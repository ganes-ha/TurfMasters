import React from 'react';
import { 
  Trophy, 
  PlayCircle, 
  FileText, 
  BarChart2, 
  Users, 
  History as HistoryIcon, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Mic, 
  MicOff, 
  Shield, 
  PlusCircle,
  Sun,
  Moon,
  Trees
} from 'lucide-react';
import { UserSession, AppTheme } from '../types';

interface NavbarProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  user: UserSession;
  onOpenAuth: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticEnabled: boolean;
  onToggleHaptic: () => void;
  voiceActive: boolean;
  onToggleVoice: () => void;
  isMatchLive: boolean;
  theme: AppTheme;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen,
  setActiveScreen,
  user,
  onOpenAuth,
  soundEnabled,
  onToggleSound,
  hapticEnabled,
  onToggleHaptic,
  voiceActive,
  onToggleVoice,
  isMatchLive,
  theme,
  onToggleTheme
}) => {
  const isScorer = user.role === 'scorer' || user.role === 'cloudadmin';

  return (
    <header className="sticky top-0 z-40 bg-[#061811]/95 backdrop-blur-md border-b border-emerald-950/60 shadow-lg select-none">
      {/* Top Brand Bar */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => setActiveScreen('live')}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-emerald-950 font-black text-lg sm:text-xl shadow-md shadow-emerald-900/40 shrink-0">
            🏏
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base sm:text-lg text-emerald-300 tracking-tight leading-none font-display truncate">
                CricVault
              </h1>
              {isMatchLive && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                  LIVE
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-200/60 font-medium leading-tight truncate">
              Hit Hard. Stay In.
            </p>
          </div>
        </div>

        {/* Action Controls & User Role */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Voice Scoring Toggle */}
          {isScorer && (
            <button
              id="btn-voice-toggle"
              onClick={onToggleVoice}
              title={voiceActive ? 'Voice Scoring Active' : 'Enable Voice Scoring'}
              className={`p-1.5 sm:p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                voiceActive 
                  ? 'bg-red-500/20 text-red-300 border-red-500/60 shadow-sm shadow-red-900/50 animate-pulse' 
                  : 'bg-emerald-950/40 text-emerald-300/70 border-emerald-900/60 hover:text-emerald-200 hover:bg-emerald-900/40'
              }`}
            >
              {voiceActive ? <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span className="hidden md:inline font-semibold text-[11px]">{voiceActive ? 'Voice ON' : 'Voice'}</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="btn-sound-toggle"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-1.5 sm:p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-900/40 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />}
          </button>

          {/* Haptic Toggle */}
          <button
            id="btn-haptic-toggle"
            onClick={onToggleHaptic}
            title={hapticEnabled ? 'Haptics ON' : 'Haptics OFF'}
            className="p-1.5 sm:p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-900/40 transition-colors"
          >
            <Smartphone className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hapticEnabled ? 'text-emerald-400' : 'text-gray-400'}`} />
          </button>

          {/* Theme Selector Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={onToggleTheme}
            title={`Current Theme: ${theme === 'midnight' ? 'Midnight Slate' : theme === 'forest' ? 'Stadium Forest' : 'Daylight Outdoor'} (Click to switch)`}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-900/40 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            {theme === 'midnight' && (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden md:inline text-[11px]">Midnight</span>
              </>
            )}
            {theme === 'forest' && (
              <>
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline text-[11px]">Forest</span>
              </>
            )}
            {theme === 'daylight' && (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline text-[11px]">Daylight</span>
              </>
            )}
          </button>

          {/* User Role Badge */}
          <button
            id="btn-auth-badge"
            onClick={onOpenAuth}
            className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] uppercase font-black tracking-wider transition-all shrink-0 whitespace-nowrap active:scale-95 border ${
              user.role === 'cloudadmin'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                : user.role === 'scorer'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
            }`}
            title="Click to switch role / login"
          >
            {user.role === 'cloudadmin' ? 'ADMIN' : user.role === 'scorer' ? 'SCORER' : 'VIEWER'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="max-w-4xl mx-auto px-2 overflow-x-auto no-scrollbar flex items-center border-t border-emerald-950/50">
        <button
          id="nav-live"
          onClick={() => setActiveScreen('live')}
          className={`flex-1 min-w-[72px] sm:min-w-[84px] py-2.5 px-2 text-center flex flex-col items-center gap-1 font-semibold text-xs border-b-2 transition-all ${
            activeScreen === 'live'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-950/30'
              : 'text-emerald-200/60 border-transparent hover:text-emerald-200 hover:bg-emerald-950/15'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          <span>Live Match</span>
        </button>

        {isScorer && (
          <button
            id="nav-setup"
            onClick={() => setActiveScreen('setup')}
            className={`flex-1 min-w-[72px] sm:min-w-[84px] py-2.5 px-2 text-center flex flex-col items-center gap-1 font-semibold text-xs border-b-2 transition-all ${
              activeScreen === 'setup'
                ? 'text-emerald-400 border-emerald-400 bg-emerald-950/30'
                : 'text-emerald-200/60 border-transparent hover:text-emerald-200 hover:bg-emerald-950/15'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Match</span>
          </button>
        )}

        <button
          id="nav-scorecard"
          onClick={() => setActiveScreen('scorecard')}
          className={`flex-1 min-w-[72px] sm:min-w-[84px] py-2.5 px-2 text-center flex flex-col items-center gap-1 font-semibold text-xs border-b-2 transition-all ${
            activeScreen === 'scorecard'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-950/30'
              : 'text-emerald-200/60 border-transparent hover:text-emerald-200 hover:bg-emerald-950/15'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Scorecard</span>
        </button>

        <button
          id="nav-tournaments"
          onClick={() => setActiveScreen('tournaments')}
          className={`flex-1 min-w-[78px] sm:min-w-[90px] py-2.5 px-2 text-center flex flex-col items-center gap-1 font-semibold text-xs border-b-2 transition-all ${
            activeScreen === 'tournaments'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-950/30'
              : 'text-emerald-200/60 border-transparent hover:text-emerald-200 hover:bg-emerald-950/15'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400/80" />
          <span>Tournaments</span>
        </button>

        <button
          id="nav-stats"
          onClick={() => setActiveScreen('stats')}
          className={`flex-1 min-w-[72px] sm:min-w-[84px] py-2.5 px-2 text-center flex flex-col items-center gap-1 font-semibold text-xs border-b-2 transition-all ${
            activeScreen === 'stats'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-950/30'
              : 'text-emerald-200/60 border-transparent hover:text-emerald-200 hover:bg-emerald-950/15'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Stats & H2H</span>
        </button>

        {isScorer && (
          <button
            id="nav-squad"
            onClick={() => setActiveScreen('squad')}
            className={`flex-1 min-w-[68px] sm:min-w-[80px] py-2.5 px-2 text-center flex flex-col items-center gap-1 font-semibold text-xs border-b-2 transition-all ${
              activeScreen === 'squad'
                ? 'text-emerald-400 border-emerald-400 bg-emerald-950/30'
                : 'text-emerald-200/60 border-transparent hover:text-emerald-200 hover:bg-emerald-950/15'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Squad</span>
          </button>
        )}

        <button
          id="nav-history"
          onClick={() => setActiveScreen('history')}
          className={`flex-1 min-w-[68px] sm:min-w-[80px] py-2.5 px-2 text-center flex flex-col items-center gap-1 font-semibold text-xs border-b-2 transition-all ${
            activeScreen === 'history'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-950/30'
              : 'text-emerald-200/60 border-transparent hover:text-emerald-200 hover:bg-emerald-950/15'
          }`}
        >
          <HistoryIcon className="w-4 h-4" />
          <span>History</span>
        </button>
      </nav>
    </header>
  );
};
