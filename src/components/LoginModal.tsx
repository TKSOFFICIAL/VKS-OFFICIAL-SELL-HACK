import React, { useState, useEffect, useRef } from 'react';
import { 
  PAYMENT_QR_URL, 
  TELEGRAM_SUPPORT_URL, 
  PLANS as DEFAULT_PLANS, 
  DEVICE_LIST as DEFAULT_DEVICE_LIST, 
  APP_NAME as DEFAULT_APP_NAME, 
  APP_SUBTITLE as DEFAULT_APP_SUBTITLE, 
  LOGO_IMG_URL 
} from '../constants';
import { Plan } from '../types';
import { verifyUTRInFirebase, sendAdminRequestToFirebase } from '../services/firebase';
import { soundManager } from '../services/sound';
import { 
  ShieldCheck, 
  KeyRound, 
  Smartphone, 
  Send, 
  QrCode, 
  ZoomIn, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  RefreshCw,
  Fingerprint,
  Sliders,
  Settings,
  Lock,
  Unlock,
  X
} from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (utr: string, device: string, existingUid?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  // Dynamic App & Admin Config State (Fetched from localStorage/Firebase sync)
  const [appName, setAppName] = useState(() => localStorage.getItem('vks_custom_name') || DEFAULT_APP_NAME);
  const [appSubtitle, setAppSubtitle] = useState(() => localStorage.getItem('vks_custom_subtitle') || DEFAULT_APP_SUBTITLE);
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('vks_custom_color') || '#7c3aed'); // primary color hex
  const [customPlans, setCustomPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('vks_custom_plans');
    return saved ? JSON.parse(saved) : DEFAULT_PLANS;
  });
  const [deviceList, setDeviceList] = useState<string[]>(() => {
    const saved = localStorage.getItem('vks_custom_devices');
    return saved ? JSON.parse(saved) : DEFAULT_DEVICE_LIST;
  });

  const [selectedPlan, setSelectedPlan] = useState<Plan>(customPlans[0]);
  const [utrInput, setUtrInput] = useState(() => localStorage.getItem('last_entered_utr') || '');
  const [selectedDevice, setSelectedDevice] = useState(() => localStorage.getItem('last_selected_device') || deviceList[0] || 'Realme 12 Pro+');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [pendingTimer, setPendingTimer] = useState<number | null>(null);
  const [showQrZoom, setShowQrZoom] = useState(false);

  // Hidden Secret Admin Panel Access State (Click logo 5 times or enter admin password)
  const [showSecretAdmin, setShowSecretAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuth, setAdminAuth] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  // Admin Config Form State
  const [editName, setEditName] = useState(appName);
  const [editSubtitle, setEditSubtitle] = useState(appSubtitle);
  const [editColor, setEditColor] = useState(themeColor);
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [customLogicCode, setCustomLogicCode] = useState(() => localStorage.getItem('vks_custom_logic') || 'STANDARD_MULTI_AI');

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleLogoClick = () => {
    soundManager.playClick();
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 5) {
      setShowSecretAdmin(true);
      setLogoClicks(0);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    // Default secret admin pass: VKSADMIN777 or admin password stored in localStorage
    const savedPass = localStorage.getItem('vks_admin_pass') || 'VKSADMIN777';
    if (adminPassword === savedPass || adminPassword === 'VKSADMIN777') {
      setAdminAuth(true);
      soundManager.playWin();
    } else {
      alert("❌ Incorrect Admin Password!");
    }
  };

  const handleSaveAdminConfig = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();

    localStorage.setItem('vks_custom_name', editName);
    localStorage.setItem('vks_custom_subtitle', editSubtitle);
    localStorage.setItem('vks_custom_color', editColor);
    localStorage.setItem('vks_custom_logic', customLogicCode);
    localStorage.setItem('vks_custom_plans', JSON.stringify(customPlans));
    localStorage.setItem('vks_custom_devices', JSON.stringify(deviceList));

    setAppName(editName);
    setAppSubtitle(editSubtitle);
    setThemeColor(editColor);
    setShowSecretAdmin(false);
    alert("✅ Admin Settings Saved Successfully! Hack UI & Logic Updated.");
  };

  const handleAddPlan = () => {
    if (!newPlanPrice || !newPlanDuration) return;
    const p = parseInt(newPlanPrice, 10);
    const updated = [...customPlans, { price: p, duration: newPlanDuration, hours: p > 500 ? 168 : 24 }];
    setCustomPlans(updated);
    setNewPlanPrice('');
    setNewPlanDuration('');
  };

  const handleRemovePlan = (idx: number) => {
    const updated = customPlans.filter((_, i) => i !== idx);
    setCustomPlans(updated);
  };

  const handleAddDevice = () => {
    if (!newDeviceName.trim()) return;
    const updated = [newDeviceName.trim(), ...deviceList];
    setDeviceList(updated);
    setNewDeviceName('');
  };

  const handleRemoveDevice = (dev: string) => {
    const updated = deviceList.filter(d => d !== dev);
    setDeviceList(updated);
  };

  const startAuto15SecondChecker = (utr: string, device: string) => {
    let secondsLeft = 15;
    setPendingTimer(secondsLeft);

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      secondsLeft -= 1;
      setPendingTimer(secondsLeft);

      try {
        const res = await verifyUTRInFirebase(utr, device);
        if (res.valid) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPendingTimer(null);
          soundManager.playWin();
          setSuccessNotice("✅ UTR APPROVED BY ADMIN! OPENING HACK...");
          setTimeout(() => {
            onLoginSuccess(utr, device, res.userUid);
          }, 800);
          return;
        }
      } catch {
        // continue
      }

      if (secondsLeft <= 0) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        const finalRes = await verifyUTRInFirebase(utr, device);
        if (finalRes.valid) {
          setPendingTimer(null);
          soundManager.playWin();
          setSuccessNotice("✅ UTR APPROVED! OPENING HACK...");
          setTimeout(() => {
            onLoginSuccess(utr, device, finalRes.userUid);
          }, 800);
        } else {
          setPendingTimer(null);
          setErrorMsg("⏳ Waiting for Admin approval in Firebase. Contact Admin on Telegram to approve UTR.");
        }
      }
    }, 1000);
  };

  const handleVerify = async () => {
    soundManager.playClick();
    const utr = utrInput.trim();
    if (!utr) {
      setErrorMsg("PLEASE ENTER YOUR UTR / ACCESS CODE");
      return;
    }
    if (!selectedDevice) {
      setErrorMsg("PLEASE SELECT YOUR DEVICE");
      return;
    }

    localStorage.setItem('last_entered_utr', utr);
    localStorage.setItem('last_selected_device', selectedDevice);

    setLoading(true);
    setErrorMsg('');
    setSuccessNotice('');

    try {
      const res = await verifyUTRInFirebase(utr, selectedDevice);
      if (res.valid) {
        soundManager.playWin();
        setSuccessNotice("✅ UTR VERIFIED! INITIALIZING ENGINE...");
        setTimeout(() => {
          onLoginSuccess(utr, selectedDevice, res.userUid);
        }, 700);
      } else {
        // Send request to Firebase admin_requests collection
        await sendAdminRequestToFirebase(
          utr,
          selectedDevice,
          `₹${selectedPlan.price} (${selectedPlan.duration})`
        );

        startAuto15SecondChecker(utr, selectedDevice);
      }
    } catch {
      setErrorMsg("Network error. Checking verification...");
      startAuto15SecondChecker(utr, selectedDevice);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#f5f3ff] overflow-y-auto">
      <div className="relative w-full max-w-[430px] my-auto py-4">
        <div className="bg-white rounded-3xl border-2 border-[#ddd6fe] shadow-[0_20px_50px_rgba(139,92,246,0.15)] p-5 sm:p-6 text-center relative">
          
          {/* Logo Circle - Click 5 times for Secret Admin Panel */}
          <div className="flex justify-center mb-4">
            <div 
              onClick={handleLogoClick}
              className="relative w-28 h-28 rounded-full bg-gradient-to-br from-white to-blue-50 border-4 border-white shadow-[0_15px_35px_rgba(59,130,246,0.25)] flex items-center justify-center anim-float cursor-pointer"
              title="Click 5 times for Admin Config"
            >
              <div className="absolute -inset-2 rounded-full border-2 border-dashed border-purple-400/60 anim-spin-slow pointer-events-none" />
              <img 
                src={LOGO_IMG_URL} 
                alt="Logo" 
                className="w-full h-full object-cover rounded-full p-1"
              />
            </div>
          </div>

          {/* Dynamic App Name & Subtitle */}
          <h1 
            className="text-3xl font-black text-transparent bg-clip-text tracking-widest font-messiri"
            style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #2563eb, #7c3aed)` }}
          >
            {appName}
          </h1>
          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-black text-[10px] tracking-[0.3em] uppercase mt-1 mb-4">
            {appSubtitle}
          </div>

          {/* QR Code Section */}
          <div className="mb-4 p-3 bg-gradient-to-b from-blue-50/60 to-purple-50/40 rounded-2xl border border-blue-200/80">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5 font-messiri">
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                SCAN & PAY ANY UPI APP
              </span>
              <button 
                type="button"
                onClick={() => setShowQrZoom(true)}
                className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-sm transition-colors"
              >
                <ZoomIn className="w-3 h-3" /> Zoom
              </button>
            </div>

            <div className="flex justify-center my-1">
              <div 
                onClick={() => setShowQrZoom(true)}
                className="p-2 bg-white rounded-2xl shadow-md border border-purple-100 cursor-pointer hover:scale-105 transition-transform"
              >
                <img 
                  src={PAYMENT_QR_URL} 
                  alt="Payment QR" 
                  className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-xl"
                />
              </div>
            </div>
            <p className="text-[10px] text-purple-700 font-bold mt-1">
              Pay via PhonePe / GPay / Paytm & enter 12-digit UTR below
            </p>
          </div>

          {/* Dynamic Plans */}
          <div className="mb-3.5 text-left">
            <label className="text-[10px] font-black tracking-widest text-purple-700 uppercase mb-1.5 block">
              SELECT SUBSCRIPTION PLAN
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {customPlans.map((plan) => {
                const isSel = selectedPlan.price === plan.price;
                const isBasic = plan.price === 199 || plan.label === 'Basic';
                return (
                  <button
                    key={plan.price}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedPlan(plan);
                    }}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer relative overflow-hidden ${
                      isSel
                        ? 'text-white font-black shadow-md border-transparent scale-[1.02]'
                        : isBasic
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                          : 'bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-900 border-amber-300 shadow-sm'
                    }`}
                    style={isSel ? { background: `linear-gradient(135deg, ${themeColor}, #2563eb)` } : {}}
                  >
                    <div className={`text-[8px] font-black uppercase tracking-wider mb-0.5 px-1 py-0.5 rounded ${
                      isSel
                        ? 'bg-white/25 text-white'
                        : isBasic
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-200 text-amber-800'
                    }`}>
                      {isBasic ? 'Basic Plan' : 'Premium'}
                    </div>
                    <div className="text-sm font-orbitron font-black">₹{plan.price}</div>
                    <div className="text-[9px] font-bold opacity-90">{plan.duration}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* UTR Input */}
          <div className="mb-3 text-left">
            <label className="text-[10px] font-black tracking-widest text-purple-700 uppercase mb-1 flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
              <span>ACCESS UTR / KEY CODE</span>
            </label>
            <input
              type="text"
              value={utrInput}
              onChange={(e) => setUtrInput(e.target.value.toUpperCase())}
              placeholder="ENTER 12-DIGIT UTR CODE"
              className="input-box w-full px-4 py-3 rounded-xl font-orbitron font-bold text-center tracking-wider text-sm placeholder:text-purple-300"
            />
          </div>

          {/* Dynamic Device Selection */}
          <div className="mb-4 text-left">
            <label className="text-[10px] font-black tracking-widest text-purple-700 uppercase mb-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>YOUR SMARTPHONE MODEL</span>
            </label>
            <div className="relative">
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="input-box w-full px-3.5 py-2.5 rounded-xl text-sm font-bold appearance-none cursor-pointer text-purple-900"
              >
                {deviceList.map((dev) => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400 font-bold text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Pending Approval Banner */}
          {pendingTimer !== null && (
            <div className="mb-3.5 p-3 rounded-2xl bg-blue-50 border-2 border-blue-300 text-left shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                  REQUEST SENT TO ADMIN!
                </span>
                <span className="font-orbitron font-black text-sm bg-blue-600 text-white px-2 py-0.5 rounded-lg shadow-sm">
                  {pendingTimer}s
                </span>
              </div>
              <p className="text-[10px] text-blue-600 mt-1.5 leading-relaxed font-bold">
                ⚠️ Hack will ONLY open when approved from Admin Panel! Checking Firebase live every 3s...
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.open(TELEGRAM_SUPPORT_URL, '_blank')}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold cursor-pointer hover:bg-blue-700 shadow-sm text-center flex items-center justify-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>CONTACT ADMIN</span>
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-purple-600 text-white text-[10px] font-bold cursor-pointer hover:bg-purple-700 shadow-sm text-center flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>RE-CHECK APPROVAL</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {errorMsg && (
            <div className="mb-3 p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading}
            className="btn-3d w-full py-4 rounded-xl font-black text-sm tracking-widest flex items-center justify-center gap-2 mb-2.5 cursor-pointer disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${themeColor}, #2563eb)` }}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>VERIFYING WITH FIREBASE...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>AUTHORIZE ACCESS</span>
              </>
            )}
          </button>

          {/* Secondary Telegram Support Button */}
          <button
            type="button"
            onClick={() => window.open(TELEGRAM_SUPPORT_URL, '_blank')}
            className="btn-secondary w-full py-3 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-blue-600" />
            <span>CONTACT ADMIN SUPPORT ON TELEGRAM</span>
          </button>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-[10px] text-purple-600">
            <span>OFFICIAL SYSTEM v7.0</span>
            <span className="font-bold opacity-80">SECURE FIREBASE ENGINE</span>
          </div>
        </div>
      </div>

      {/* SECRET ADMIN CONFIGURATION MODAL (Opened by clicking logo 5 times) */}
      {showSecretAdmin && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-4 border-blue-500 shadow-2xl max-w-md w-full p-6 text-slate-800 text-left relative">
            <button
              onClick={() => setShowSecretAdmin(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-100">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-black font-messiri text-purple-950">
                ADMIN CUSTOMIZATION SUITE
              </h3>
            </div>

            {!adminAuth ? (
              <form onSubmit={handleAdminLogin} className="space-y-3.5 py-4">
                <p className="text-xs text-purple-700 font-bold">
                  Enter Admin Password to customize Prices, Devices, Name, Theme & AI Prediction Logic:
                </p>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter Admin Password (default: VKSADMIN777)"
                  className="input-box w-full px-4 py-3 rounded-xl text-sm font-bold font-mono"
                  required
                />
                <button
                  type="submit"
                  className="btn-3d w-full py-3 rounded-xl font-black text-xs tracking-wider cursor-pointer"
                >
                  UNLOCK ADMIN CONFIG
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveAdminConfig} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-[10px] font-black text-purple-700 uppercase block mb-1">
                    APP NAME (Title)
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-box w-full px-3.5 py-2 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-purple-700 uppercase block mb-1">
                    SUBTITLE
                  </label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    className="input-box w-full px-3.5 py-2 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-purple-700 uppercase block mb-1">
                    THEME COLOR (Primary Accent Hex)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-purple-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="input-box flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-purple-700 uppercase block mb-1">
                    PREDICTION LOGIC ENGINE
                  </label>
                  <select
                    value={customLogicCode}
                    onChange={(e) => setCustomLogicCode(e.target.value)}
                    className="input-box w-full px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <option value="STANDARD_MULTI_AI">4-AI Neural Consensus Engine</option>
                    <option value="AGGRESSIVE_DRAGON">Aggressive Dragon & Trend Tracker</option>
                    <option value="ZIGZAG_OSCILLATOR">High-Accuracy Zigzag Oscillator</option>
                    <option value="MARTINGALE_RECOVERY_PRO">Advanced Recovery & Parity Matrix</option>
                  </select>
                </div>

                {/* Manage Plans */}
                <div>
                  <label className="text-[10px] font-black text-purple-700 uppercase block mb-1">
                    MANAGE SUBSCRIPTION PLANS & PRICES
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {customPlans.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-purple-50 rounded-xl border border-purple-100 text-xs font-bold">
                        <span>₹{p.price} — {p.duration}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlan(idx)}
                          className="text-rose-600 hover:text-rose-800 text-[10px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(e.target.value)}
                      placeholder="Price (₹)"
                      className="input-box w-1/3 px-2.5 py-2 rounded-xl text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={newPlanDuration}
                      onChange={(e) => setNewPlanDuration(e.target.value)}
                      placeholder="Duration (e.g. 3 Hours)"
                      className="input-box flex-1 px-2.5 py-2 rounded-xl text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddPlan}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Manage Devices */}
                <div>
                  <label className="text-[10px] font-black text-purple-700 uppercase block mb-1">
                    ADD / REMOVE SMARTPHONE DEVICES
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      placeholder="New Device Model (e.g. OnePlus 13)"
                      className="input-box flex-1 px-3 py-2 rounded-xl text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddDevice}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Add Device
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {deviceList.slice(0, 15).map((d) => (
                      <div key={d} className="flex justify-between items-center p-1.5 bg-blue-50/70 rounded-lg text-[11px] font-bold">
                        <span>{d}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDevice(d)}
                          className="text-rose-600 text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-3d w-full py-3.5 rounded-xl font-black text-xs tracking-wider cursor-pointer shadow-md mt-2"
                >
                  SAVE & APPLY CONFIGURATION
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QR Zoom Modal */}
      {showQrZoom && (
        <div 
          onClick={() => setShowQrZoom(false)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-5 rounded-3xl max-w-sm w-full text-center shadow-2xl border-4 border-blue-200"
          >
            <h3 className="text-base font-black text-blue-700 mb-2">OFFICIAL UPI PAYMENT QR</h3>
            <div className="p-3 bg-white rounded-2xl shadow-md inline-block border border-purple-100">
              <img 
                src={PAYMENT_QR_URL} 
                alt="Enlarged QR" 
                className="w-64 h-64 object-contain rounded-lg"
              />
            </div>
            <p className="text-xs text-purple-700 font-bold mt-2">Pay & submit 12-digit UTR to unlock</p>
            <button 
              type="button"
              onClick={() => setShowQrZoom(false)}
              className="mt-3 px-6 py-2 rounded-xl bg-blue-600 text-white font-black text-xs cursor-pointer shadow-md hover:bg-blue-700"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
