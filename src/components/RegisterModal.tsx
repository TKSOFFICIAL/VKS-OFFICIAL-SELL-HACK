import React, { useState } from 'react';
import { soundManager } from '../services/sound';
import { registerNewUserInFirebase } from '../services/firebase';
import { UserRecord } from '../types';
import { UserCheck, Shield, Phone, User, Copy, Check } from 'lucide-react';

interface RegisterModalProps {
  utr: string;
  device: string;
  initialUid: string;
  onRegistered: (user: UserRecord) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  utr,
  device,
  initialUid,
  onRegistered
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCopy = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(initialUid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    if (!name.trim()) {
      setErrorMsg("Please enter your full name");
      return;
    }
    if (mobile.trim().length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const newUser: UserRecord = {
      uid: initialUid,
      name: name.trim(),
      mobile: mobile.trim(),
      utr,
      device,
      createdAt: Date.now(),
      totalBets: 0,
      totalWins: 0,
      totalLosses: 0,
      totalJackpots: 0
    };

    try {
      await registerNewUserInFirebase(newUser);
      soundManager.playWin();
      onRegistered(newUser);
    } catch {
      setErrorMsg("Failed to save profile. Proceeding anyway.");
      onRegistered(newUser);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e0f3c]/70 backdrop-blur-md">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border-2 border-[#ddd6fe] shadow-2xl p-6 text-slate-800">
          <div className="text-center pb-3 border-b border-purple-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-orbitron font-bold tracking-widest border border-blue-200 mb-2">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>REGISTRATION PROTOCOL</span>
            </div>
            <h2 className="text-2xl font-black font-messiri text-purple-950">
              CREATE USER PROFILE
            </h2>
            <p className="text-xs text-purple-600 font-bold">
              Link your identity to verified UTR access
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-4 space-y-3.5 text-left">
            <div>
              <label className="text-[11px] font-black tracking-widest text-purple-700 uppercase mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>FULL NAME</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter operator / user name"
                className="input-box w-full px-3.5 py-2.5 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-black tracking-widest text-purple-700 uppercase mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>MOBILE NUMBER</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="input-box w-full px-3.5 py-2.5 rounded-xl font-mono text-sm tracking-wider font-bold"
              />
            </div>

            {/* Generated UID Box */}
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl">
              <div className="flex items-center justify-between text-[10px] text-purple-700 font-orbitron font-bold mb-1">
                <span>ASSIGNED SYSTEM UID</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-blue-600 hover:text-purple-800 cursor-pointer font-bold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <div className="text-center py-1 font-orbitron font-black text-2xl text-blue-700 tracking-[4px]">
                {initialUid}
              </div>
              <div className="text-[10px] text-center text-slate-500 font-mono">
                Linked UTR: {utr} • Device: {device}
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 border border-rose-300 rounded-xl font-bold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-3d w-full py-3.5 rounded-xl font-black text-xs tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{saving ? 'CONFIGURING...' : 'CONFIRM & ENTER HACK'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
