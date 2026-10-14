import React, { useState } from 'react';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { MainPanel } from './components/MainPanel';
import { UserRecord } from './types';

export default function App() {
  const [currentUtr, setCurrentUtr] = useState<string>('');
  const [currentDevice, setCurrentDevice] = useState<string>('');
  const [currentUid, setCurrentUid] = useState<string>('');

  // UI state: Always show Login page first on app open
  const [showLogin, setShowLogin] = useState<boolean>(true);
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [generatedUid, setGeneratedUid] = useState<string>('');

  const generateRandomUid = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleLoginSuccess = (utr: string, device: string, existingUid?: string) => {
    setCurrentUtr(utr);
    setCurrentDevice(device);
    localStorage.setItem('auth_utr', utr);
    localStorage.setItem('auth_device', device);

    if (existingUid) {
      setCurrentUid(existingUid);
      localStorage.setItem('auth_uid', existingUid);
      setShowLogin(false);
      setShowRegister(false);
    } else {
      // Prompt user registration to configure profile and bind UID
      const newUid = generateRandomUid();
      setGeneratedUid(newUid);
      setShowLogin(false);
      setShowRegister(true);
    }
  };

  const handleRegistered = (user: UserRecord) => {
    setCurrentUid(user.uid);
    localStorage.setItem('auth_uid', user.uid);
    setShowRegister(false);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_utr');
    localStorage.removeItem('auth_device');
    localStorage.removeItem('auth_uid');
    setCurrentUtr('');
    setCurrentDevice('');
    setCurrentUid('');
    setShowLogin(true);
    setShowRegister(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f3ff] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* If logged in and verified in Firebase, show Main Panel */}
      {currentUtr && currentUid && !showLogin && !showRegister ? (
        <MainPanel
          userUid={currentUid}
          utr={currentUtr}
          device={currentDevice}
          onLogout={handleLogout}
        />
      ) : null}

      {/* Login Modal - Opens first as requested */}
      {showLogin && (
        <LoginModal
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterModal
          utr={currentUtr}
          device={currentDevice}
          initialUid={generatedUid}
          onRegistered={handleRegistered}
        />
      )}
    </div>
  );
}
