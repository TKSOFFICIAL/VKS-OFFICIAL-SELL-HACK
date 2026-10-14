import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle2, XCircle, DollarSign, Smartphone, Settings, 
  Palette, Bot, Users, Activity, Lock, Unlock, RefreshCw, Save, Plus, Trash2, Globe, Send, Bell
} from 'lucide-react';
import { PLANS } from '../constants';
import { Plan } from '../types';

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'utrs' | 'plans' | 'devices' | 'config' | 'ai' | 'bot'>('overview');

  // Admin state (persisted in localStorage)
  const [appName, setAppName] = useState<string>(localStorage.getItem('admin_app_name') || 'AURA BLUE AI');
  const [logoUrl, setLogoUrl] = useState<string>(localStorage.getItem('admin_logo_url') || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(localStorage.getItem('admin_qr_url') || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=admin@paytm&pn=AuraBlue');
  
  // Plans state
  const [plansList, setPlansList] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('admin_plans');
    return saved ? JSON.parse(saved) : PLANS;
  });

  // Pending UTRs state
  const [utrRequests, setUtrRequests] = useState<Array<{ id: string; utr: string; device: string; plan: string; amount: number; time: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }>>(() => {
    const saved = localStorage.getItem('admin_utr_requests');
    return saved ? JSON.parse(saved) : [
      { id: '1', utr: 'UTR98321456', device: 'iPhone 15 Pro', plan: '2 Hours (Basic)', amount: 199, time: '10:24 AM', status: 'PENDING' },
      { id: '2', utr: 'UTR44556677', device: 'Android OneUI', plan: '1 Day (Premium)', amount: 499, time: '09:12 AM', status: 'PENDING' },
      { id: '3', utr: 'UTR11223344', device: 'Samsung S24', plan: '7 Days (Premium)', amount: 999, time: 'Yesterday', status: 'APPROVED' },
    ];
  });

  // Devices & UIDs
  const [devicesList, setDevicesList] = useState<Array<{ uid: string; deviceName: string; utr: string; expiry: string; status: 'ACTIVE' | 'EXPIRED' | 'BLOCKED' }>>(() => {
    const saved = localStorage.getItem('admin_devices');
    return saved ? JSON.parse(saved) : [
      { uid: 'AURA889X', deviceName: 'iPhone 14', utr: 'UTR11223344', expiry: '2026-10-20 18:00', status: 'ACTIVE' },
      { uid: 'VKS772K', deviceName: 'Xiaomi Redmi', utr: 'UTR99887766', expiry: '2026-10-14 12:00', status: 'ACTIVE' },
    ];
  });

  // Prediction AI Settings
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState<number>(Number(localStorage.getItem('admin_ai_conf') || '85'));
  const [predictionBias, setPredictionBias] = useState<'AUTO' | 'FORCE_BIG' | 'FORCE_SMALL'>( (localStorage.getItem('admin_ai_bias') as any) || 'AUTO');

  // Telegram Settings
  const [botToken, setBotToken] = useState<string>(localStorage.getItem('admin_bot_token') || '789234123:AAH_sample_token');
  const [channelId, setChannelId] = useState<string>(localStorage.getItem('admin_channel_id') || '@aura_blue_signals');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'admin123' || passcode === 'admin' || passcode === '1234') {
      setIsAuthenticated(true);
    } else {
      alert("Invalid Admin Passcode! (Try: admin123)");
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('admin_app_name', appName);
    localStorage.setItem('admin_logo_url', logoUrl);
    localStorage.setItem('admin_qr_url', qrCodeUrl);
    localStorage.setItem('admin_plans', JSON.stringify(plansList));
    localStorage.setItem('admin_utr_requests', JSON.stringify(utrRequests));
    localStorage.setItem('admin_devices', JSON.stringify(devicesList));
    localStorage.setItem('admin_ai_conf', aiConfidenceThreshold.toString());
    localStorage.setItem('admin_ai_bias', predictionBias);
    localStorage.setItem('admin_bot_token', botToken);
    localStorage.setItem('admin_channel_id', channelId);
    alert("Admin configuration saved successfully!");
  };

  const approveUtr = (id: string) => {
    setUtrRequests(prev => prev.map(item => item.id === id ? { ...item, status: 'APPROVED' } : item));
    // Also add to authorized devices
    const target = utrRequests.find(x => x.id === id);
    if (target) {
      const newDev = {
        uid: 'AURA' + Math.floor(1000 + Math.random() * 9000),
        deviceName: target.device,
        utr: target.utr,
        expiry: new Date(Date.now() + 86400000 * 7).toISOString().replace('T', ' ').substring(0, 16),
        status: 'ACTIVE' as const
      };
      setDevicesList(prev => [newDev, ...prev]);
    }
  };

  const rejectUtr = (id: string) => {
    setUtrRequests(prev => prev.map(item => item.id === id ? { ...item, status: 'REJECTED' } : item));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl w-full max-w-md shadow-2xl text-white">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center mb-1 font-orbitron tracking-wider">MASTER ADMIN PANEL</h1>
          <p className="text-xs text-blue-200 text-center mb-6">Secure Control & Management Portal</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-blue-300 mb-1">Admin Security Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Enter passcode (admin123)"
                className="w-full px-4 py-3 bg-black/40 border border-blue-500/40 rounded-xl text-white placeholder-blue-400/50 focus:outline-none focus:border-blue-400 text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider"
            >
              Access Admin Dashboard
            </button>
            <div className="text-center mt-2">
              <span className="text-[11px] text-blue-300/75">Default password: <code className="text-amber-300 font-mono">admin123</code></span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              {appName} - MASTER ADMIN PANEL
            </h1>
            <p className="text-xs text-slate-400">Full Control & Management Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveConfig}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save All Changes</span>
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-rose-600/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600/30 font-bold rounded-xl text-xs transition-all"
          >
            Lock Admin
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('utrs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'utrs' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>UTR Requests ({utrRequests.filter(x => x.status === 'PENDING').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'plans' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Plans & Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'devices' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Authorized Devices</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'config' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>App Branding & QR</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ai' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Prediction AI Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('bot')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bot' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Telegram Bot Settings</span>
          </button>
        </aside>

        {/* Tab Viewport */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black font-orbitron tracking-wide text-blue-400">System Statistics & Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-bold mb-1">Pending UTR Requests</div>
                  <div className="text-3xl font-black text-amber-400">{utrRequests.filter(x => x.status === 'PENDING').length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-bold mb-1">Active Devices / UIDs</div>
                  <div className="text-3xl font-black text-emerald-400">{devicesList.length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-bold mb-1">Total Subscription Plans</div>
                  <div className="text-3xl font-black text-blue-400">{plansList.length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-bold mb-1">AI Engine Status</div>
                  <div className="text-3xl font-black text-purple-400">ACTIVE</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-300 mb-4">Recent UTR Approvals & Activity</h3>
                <div className="space-y-3">
                  {utrRequests.slice(0, 5).map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                      <div>
                        <div className="text-xs font-bold font-mono text-blue-400">{req.utr} - {req.plan}</div>
                        <div className="text-[10px] text-slate-400">Device: {req.device} • {req.time}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        req.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'utrs' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black font-orbitron tracking-wide text-blue-400">UTR Payment Verification Requests</h2>
              <p className="text-xs text-slate-400">Approve or Reject UTR submissions submitted by users from the login screen.</p>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 uppercase font-mono">
                    <tr>
                      <th className="p-4">UTR Number</th>
                      <th className="p-4">Device</th>
                      <th className="p-4">Selected Plan</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {utrRequests.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-mono font-bold text-blue-400">{item.utr}</td>
                        <td className="p-4 text-slate-300">{item.device}</td>
                        <td className="p-4 text-slate-300">{item.plan}</td>
                        <td className="p-4 font-bold text-emerald-400">₹{item.amount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            item.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                            item.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {item.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => approveUtr(item.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectUtr(item.id)}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black font-orbitron tracking-wide text-blue-400">Plans & Pricing Manager</h2>
                  <p className="text-xs text-slate-400">Configure prices, durations, and Basic / Premium badge labels.</p>
                </div>
                <button
                  onClick={() => {
                    const newPlan: Plan = { price: 299, duration: '3 Hours', hours: 3, label: 'Basic' };
                    setPlansList([...plansList, newPlan]);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Plan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plansList.map((plan, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black font-orbitron text-white">₹{plan.price}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          plan.price === 199 || plan.label === 'Basic' ? 'bg-slate-700 text-slate-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {plan.label || (plan.price === 199 ? 'Basic' : 'Premium')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">Duration: {plan.duration} ({plan.hours} hours)</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const updated = plansList.filter((_, i) => i !== idx);
                          setPlansList(updated);
                        }}
                        className="p-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black font-orbitron tracking-wide text-blue-400">Authorized Devices & UIDs</h2>
              <p className="text-xs text-slate-400">Manage active hardware devices and user sessions.</p>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 uppercase font-mono">
                    <tr>
                      <th className="p-4">UID</th>
                      <th className="p-4">Device Name</th>
                      <th className="p-4">UTR Verified</th>
                      <th className="p-4">Expiry Time</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {devicesList.map((dev, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-4 font-mono font-bold text-blue-400">{dev.uid}</td>
                        <td className="p-4 text-slate-300">{dev.deviceName}</td>
                        <td className="p-4 font-mono text-slate-400">{dev.utr}</td>
                        <td className="p-4 text-slate-300">{dev.expiry}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {dev.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-black font-orbitron tracking-wide text-blue-400">App Branding & Payment QR</h2>
              <p className="text-xs text-slate-400">Customize the application name, logo image, and payment QR code.</p>

              <div className="space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Application Name</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Logo Image URL</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Payment QR Code Image URL</label>
                  <input
                    type="text"
                    value={qrCodeUrl}
                    onChange={e => setQrCodeUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-black font-orbitron tracking-wide text-blue-400">Prediction Logic & AI Engine</h2>
              <p className="text-xs text-slate-400">Configure neural consensus thresholds and prediction bias.</p>

              <div className="space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">AI Confidence Threshold ({aiConfidenceThreshold}%)</label>
                  <input
                    type="range"
                    min="70"
                    max="99"
                    value={aiConfidenceThreshold}
                    onChange={e => setAiConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Prediction Bias Mode</label>
                  <select
                    value={predictionBias}
                    onChange={e => setPredictionBias(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  >
                    <option value="AUTO">AUTO (Multi-AI Neural Consensus)</option>
                    <option value="FORCE_BIG">Force BIG Bias</option>
                    <option value="FORCE_SMALL">Force SMALL Bias</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bot' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-black font-orbitron tracking-wide text-blue-400">Telegram Bot Integration</h2>
              <p className="text-xs text-slate-400">Configure Telegram Bot token and channel ID for automated signal broadcasts.</p>

              <div className="space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Telegram Bot Token</label>
                  <input
                    type="text"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Telegram Channel ID</label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={e => setChannelId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
