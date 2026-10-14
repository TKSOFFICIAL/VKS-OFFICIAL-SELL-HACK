import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  push, 
  update, 
  query, 
  orderByChild, 
  equalTo, 
  limitToLast,
  Database
} from 'firebase/database';
import { UserRecord, HistoryItem, AdminRequest } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBdPvoCRM_lnM4f3AY6wJYxdZCuL-oCjNw",
  authDomain: "madarauuchiha-1e565.firebaseapp.com",
  databaseURL: "https://madarauuchiha-1e565-default-rtdb.firebaseio.com",
  projectId: "madarauuchiha-1e565",
  storageBucket: "madarauuchiha-1e565.firebasestorage.app",
  messagingSenderId: "980170468207",
  appId: "1:980170468207:android:acdcffbb65e932415a169a"
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getDatabase(app);
} catch (err) {
  console.warn("Firebase initialization notice:", err);
}

export function isRecordActive(record: { status?: string; expiry?: number } | null | undefined): boolean {
  if (!record) return false;
  if (record.status !== "active") return false;
  if (record.expiry && Date.now() > record.expiry) return false;
  return true;
}

export async function verifyUTRInFirebase(utr: string, device: string): Promise<{ valid: boolean; record?: any; userUid?: string }> {
  if (!db) {
    return { valid: false };
  }

  try {
    // 1. Check approved_devices/{utr}
    const utrRef = ref(db, `approved_devices/${utr}`);
    const snapshot = await get(utrRef);
    if (snapshot.exists()) {
      const record = snapshot.val();
      if (isRecordActive(record)) {
        let userUid: string | undefined = undefined;
        try {
          const userQ = query(ref(db, 'users'), orderByChild('utr'), equalTo(utr));
          const userSnap = await get(userQ);
          if (userSnap.exists()) {
            userSnap.forEach((child) => {
              userUid = child.key || undefined;
            });
          }
        } catch {
          // Ignore
        }
        await update(utrRef, { lastUsed: Date.now(), deviceName: device });
        return { valid: true, record, userUid };
      }
    }

    // 2. Also check vks_keys/{utr}
    const keyRef = ref(db, `vks_keys/${utr}`);
    const keySnap = await get(keyRef);
    if (keySnap.exists()) {
      const keyData = keySnap.val();
      if (keyData.active !== false && (!keyData.expiry || keyData.expiry === 0 || Date.now() < keyData.expiry)) {
        return { valid: true, record: keyData, userUid: keyData.uid || utr };
      }
    }
  } catch (err) {
    console.error("UTR verification error:", err);
  }

  return { valid: false };
}

export async function sendAdminRequestToFirebase(utr: string, device: string, plan: string): Promise<boolean> {
  const reqData: AdminRequest = {
    utr,
    device,
    plan,
    timestamp: Date.now(),
    status: 'pending'
  };

  // Cache locally
  const pendingList = JSON.parse(localStorage.getItem('local_admin_requests') || '[]');
  pendingList.unshift(reqData);
  localStorage.setItem('local_admin_requests', JSON.stringify(pendingList.slice(0, 30)));

  if (!db) return true;

  try {
    const reqRef = ref(db, 'admin_requests');
    await push(reqRef, reqData);
    return true;
  } catch (err) {
    console.error("Admin request push failed:", err);
    return true;
  }
}

export async function registerNewUserInFirebase(user: UserRecord): Promise<boolean> {
  localStorage.setItem(`user_${user.uid}`, JSON.stringify(user));
  localStorage.setItem(`uid_for_utr_${user.utr}`, user.uid);

  if (!db) return true;
  try {
    const userRef = ref(db, `users/${user.uid}`);
    await set(userRef, user);
    return true;
  } catch (err) {
    console.error("User registration error:", err);
    return true;
  }
}

export async function getUserFromFirebase(uid: string): Promise<UserRecord | null> {
  const cached = localStorage.getItem(`user_${uid}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Ignore
    }
  }

  if (!db) return null;
  try {
    const userRef = ref(db, `users/${uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      return snap.val() as UserRecord;
    }
  } catch (err) {
    console.error("Error fetching user:", err);
  }
  return null;
}

export async function saveActivityToFirebase(
  uid: string, 
  period: string, 
  prediction: string, 
  numbers: string, 
  result: number | string, 
  status: 'WIN' | 'LOSS' | 'JACKPOT'
) {
  if (!uid) return;
  const historyItem = {
    period,
    prediction,
    numbers,
    result,
    status,
    time: Date.now()
  };

  if (!db) return;
  try {
    const histRef = ref(db, `user_history/${uid}`);
    await push(histRef, historyItem);

    const userRef = ref(db, `users/${uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      const data = snap.val();
      const updates: Record<string, any> = {
        totalBets: (data.totalBets || 0) + 1
      };
      if (status === 'WIN') {
        updates.totalWins = (data.totalWins || 0) + 1;
      } else if (status === 'JACKPOT') {
        updates.totalWins = (data.totalWins || 0) + 1;
        updates.totalJackpots = (data.totalJackpots || 0) + 1;
      } else if (status === 'LOSS') {
        updates.totalLosses = (data.totalLosses || 0) + 1;
      }
      await update(userRef, updates);
    }
  } catch (err) {
    console.warn("Save activity error:", err);
  }
}

export async function fetchUserHistory(uid: string): Promise<HistoryItem[]> {
  if (!uid || !db) return [];
  try {
    const histQ = query(ref(db, `user_history/${uid}`), limitToLast(50));
    const snap = await get(histQ);
    const list: HistoryItem[] = [];
    if (snap.exists()) {
      snap.forEach(child => {
        const val = child.val();
        list.push({
          id: child.key || undefined,
          period: val.period,
          prediction: val.prediction,
          numbers: val.numbers ? val.numbers.split('/').map((n: string) => parseInt(n.trim(), 10)) : [0, 0],
          result: val.result,
          status: val.status,
          time: val.time
        });
      });
      list.reverse();
    }
    return list;
  } catch {
    return [];
  }
}

export async function approveUTRDirectly(utr: string, durationHours: number = 24, device: string = 'Authorized Device'): Promise<boolean> {
  const expiry = Date.now() + durationHours * 3600 * 1000;
  const record = {
    status: 'active',
    utr,
    deviceName: device,
    expiry,
    createdAt: Date.now()
  };

  localStorage.setItem(`approved_utr_${utr}`, JSON.stringify(record));

  if (!db) return true;
  try {
    const utrRef = ref(db, `approved_devices/${utr}`);
    await set(utrRef, record);
    return true;
  } catch (err) {
    console.error("Approve UTR error:", err);
    return true;
  }
}

export async function getAdminRequestsFromFirebase(): Promise<AdminRequest[]> {
  const local: AdminRequest[] = JSON.parse(localStorage.getItem('local_admin_requests') || '[]');
  if (!db) return local;

  try {
    const q = query(ref(db, 'admin_requests'), limitToLast(20));
    const snap = await get(q);
    const list: AdminRequest[] = [];
    if (snap.exists()) {
      snap.forEach(child => {
        list.push({ id: child.key || undefined, ...child.val() });
      });
      list.reverse();
      return list;
    }
  } catch {
    // Ignore
  }
  return local;
}
