import React, { useState } from 'react';
import { X, Shield, Lock, Check } from 'lucide-react';
import { UserSession } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface AuthModalProps {
  currentUser: UserSession;
  onClose: () => void;
  onLogin: (session: UserSession) => void;
}

const USERS = [
  { username: 'admin', password: 'admin123', role: 'scorer' as const, name: 'Match Scorer' },
  { username: 'cloudadmin', password: 'j72e#05t', role: 'cloudadmin' as const, name: 'Cloud Admin' },
  { username: 'guest', password: 'iltwat', role: 'viewer' as const, name: 'Spectator / Viewer' }
];

export const AuthModal: React.FC<AuthModalProps> = ({ currentUser, onClose, onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = USERS.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (user) {
      audioHaptics.tapFeedback();
      onLogin({ username: user.username, role: user.role, name: user.name });
      onClose();
    } else {
      audioHaptics.errorFeedback();
      setError('Invalid username or password. Check role credentials.');
    }
  };

  const handleQuickLogin = (role: 'scorer' | 'viewer' | 'cloudadmin') => {
    const user = USERS.find(u => u.role === role);
    if (user) {
      audioHaptics.tapFeedback();
      onLogin({ username: user.username, role: user.role, name: user.name });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-emerald-100 font-display">User Role</h3>
              <p className="text-xs text-emerald-300/70">Current: {currentUser.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Switch Section */}
        <div className="py-4 space-y-2">
          <span className="block text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1">
            Quick Role Switch
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('scorer')}
              className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                currentUser.role === 'scorer'
                  ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black'
                  : 'bg-[#143427] text-emerald-200 border-emerald-900/60'
              }`}
            >
              <span>🏏 Scorer</span>
              <span className="text-[9px] opacity-70">Full Scoring</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('viewer')}
              className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                currentUser.role === 'viewer'
                  ? 'bg-amber-500 text-amber-950 border-amber-400 font-black'
                  : 'bg-[#143427] text-emerald-200 border-emerald-900/60'
              }`}
            >
              <span>👁 Spectator</span>
              <span className="text-[9px] opacity-70">View Only</span>
            </button>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleLogin} className="space-y-3 pt-2 border-t border-emerald-900/60 text-xs">
          <span className="block font-bold text-emerald-300/80 uppercase tracking-wider text-[10px]">
            Or Login with Credentials
          </span>

          {error && (
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-emerald-300/80 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. admin or cloudadmin"
              className="w-full px-3 py-2 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-semibold"
            />
          </div>

          <div>
            <label className="block text-emerald-300/80 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};
