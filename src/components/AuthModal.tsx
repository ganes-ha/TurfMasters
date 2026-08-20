import React, { useState } from 'react';
import { X, Shield, Lock, Check, Cloud, User, Mail, Sparkles, LogOut } from 'lucide-react';
import { UserSession, UserRole } from '../types';
import { audioHaptics } from '../utils/audioHaptics';
import { loginWithEmail, registerWithEmail, loginAsSpectatorGuest, logoutFromCloud } from '../services/firebase';

interface AuthModalProps {
  currentUser: UserSession;
  onClose: () => void;
  onLogin: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ currentUser, onClose, onLogin }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'guest'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('scorer');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleCloudLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      audioHaptics.tapFeedback();
      const session = await loginWithEmail(email.trim(), password);
      onLogin(session);
      setSuccess('Logged in successfully!');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      audioHaptics.errorFeedback();
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials or register.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloudRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name or scorer title.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      audioHaptics.tapFeedback();
      const session = await registerWithEmail(email.trim(), password, name.trim(), role);
      onLogin(session);
      setSuccess('Account created and verified on Firebase!');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      audioHaptics.errorFeedback();
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSpectator = async () => {
    setError('');
    setLoading(true);
    try {
      audioHaptics.tapFeedback();
      const session = await loginAsSpectatorGuest(name.trim() || 'Pavilion Spectator');
      onLogin(session);
      setSuccess('Connected to Live Spectator Stream!');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      console.error('Guest login error:', err);
      // Fallback local guest
      onLogin({
        username: 'guest',
        role: 'viewer',
        name: name.trim() || 'Spectator',
        isCloudAuth: false
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    audioHaptics.tapFeedback();
    try {
      await logoutFromCloud();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    onLogin({
      username: 'guest',
      role: 'viewer',
      name: 'Guest Spectator',
      isCloudAuth: false
    });
    setSuccess('Signed out');
    setTimeout(() => onClose(), 600);
  };

  // Quick Preset login for testing
  const handleQuickPreset = (presetRole: 'scorer' | 'cloudadmin' | 'viewer') => {
    audioHaptics.tapFeedback();
    if (presetRole === 'scorer') {
      onLogin({
        username: 'scorer_official',
        role: 'scorer',
        name: 'Official Scorer',
        isCloudAuth: true
      });
    } else if (presetRole === 'cloudadmin') {
      onLogin({
        username: 'tournament_director',
        role: 'cloudadmin',
        name: 'Tournament Director',
        isCloudAuth: true
      });
    } else {
      onLogin({
        username: 'guest_spectator',
        role: 'viewer',
        name: 'Live Spectator',
        isCloudAuth: true
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e271d] border border-emerald-800/80 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-inner">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-emerald-100 font-display">Firebase Auth & Roles</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Cloud
                </span>
              </div>
              <p className="text-xs text-emerald-300/70">
                Active: <span className="font-bold text-emerald-200">{currentUser.name}</span> ({currentUser.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-emerald-950/80 text-emerald-300 hover:text-white border border-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Status Alert */}
        {currentUser.isCloudAuth && (
          <div className="mt-3 p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Authenticated as <strong className="text-emerald-100">{currentUser.name}</strong></span>
            </div>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-[11px] font-bold flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        )}

        {/* Auth Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#091b14] rounded-2xl my-4 border border-emerald-950">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-emerald-500 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-emerald-500 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            Create Scorer
          </button>
          <button
            type="button"
            onClick={() => { setTab('guest'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'guest'
                ? 'bg-amber-500 text-amber-950 shadow-md font-black'
                : 'text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            Spectator
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            {success}
          </div>
        )}

        {/* Tab 1: Cloud Sign In */}
        {tab === 'login' && (
          <form onSubmit={handleCloudLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="scorer@boxcricket.club"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 text-xs font-medium focus:outline-none focus:border-emerald-400"
                />
                <Mail className="w-4 h-4 text-emerald-400/60 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 text-xs font-medium focus:outline-none focus:border-emerald-400"
                />
                <Lock className="w-4 h-4 text-emerald-400/60 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating with Firebase...' : 'Sign In with Cloud Auth'}
            </button>
          </form>
        )}

        {/* Tab 2: Register New Scorer / Admin */}
        {tab === 'register' && (
          <form onSubmit={handleCloudRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1">
                Display Name / Scorer Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Coach Rahul or Arena Official"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 text-xs font-medium focus:outline-none focus:border-emerald-400"
                />
                <User className="w-4 h-4 text-emerald-400/60 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1">
                Role & Permissions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('scorer')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                    role === 'scorer'
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400'
                      : 'bg-[#143427] text-emerald-300 border-emerald-900'
                  }`}
                >
                  🏏 Official Scorer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('cloudadmin')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                    role === 'cloudadmin'
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400'
                      : 'bg-[#143427] text-emerald-300 border-emerald-900'
                  }`}
                >
                  🛡 Tournament Admin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@cricket.org"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 text-xs font-medium focus:outline-none focus:border-emerald-400"
                />
                <Mail className="w-4 h-4 text-emerald-400/60 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1">
                Password (min 6 chars)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 text-xs font-medium focus:outline-none focus:border-emerald-400"
                />
                <Lock className="w-4 h-4 text-emerald-400/60 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating Cloud Account...' : 'Register & Verify Role'}
            </button>
          </form>
        )}

        {/* Tab 3: Spectator 1-Click Guest Access */}
        {tab === 'guest' && (
          <div className="space-y-4 py-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-100">Spectator Live Streaming Mode</h4>
              <p className="text-xs text-amber-200/70 mt-1 max-w-xs mx-auto">
                Join instantaneously as a spectator to follow ball-by-ball commentary, real-time wagon wheels, and run-rate graphs.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGuestSpectator}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Connecting...' : 'Join Spectator Stream (Instant)'}</span>
            </button>
          </div>
        )}

        {/* Quick Local / Dev Presets for immediate testing */}
        <div className="pt-4 mt-4 border-t border-emerald-900/60">
          <span className="block text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-2 text-center">
            Quick Scorer / Admin Bypass
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('scorer')}
              className="px-2 py-1.5 rounded-lg bg-[#143427] hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-bold truncate"
            >
              🏏 Scorer
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('cloudadmin')}
              className="px-2 py-1.5 rounded-lg bg-[#143427] hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-bold truncate"
            >
              🛡 Director
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('viewer')}
              className="px-2 py-1.5 rounded-lg bg-[#143427] hover:bg-emerald-900/60 text-amber-300 border border-emerald-800/60 text-[11px] font-bold truncate"
            >
              👁 Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
