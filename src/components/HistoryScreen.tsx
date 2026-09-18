import React, { useState, useEffect, useRef } from 'react';
import { 
  History as HistoryIcon, 
  Eye, 
  EyeOff, 
  Trophy,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Info
} from 'lucide-react';
import { MatchHistoryEntry, Match } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface HistoryScreenProps {
  history: MatchHistoryEntry[];
  onSelectMatch: (match: Match) => void;
  isScorer: boolean;
  onRetrieveFromCloud: () => Promise<void>;
  onSyncLocalToCloud?: () => Promise<void>;
  isCloudSyncing?: boolean;
  cloudSyncMessage?: string | null;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onSelectMatch,
  isScorer,
  onRetrieveFromCloud,
  onSyncLocalToCloud,
  isCloudSyncing = false,
  cloudSyncMessage = null
}) => {
  const [hiddenIds, setHiddenIds] = useState<Set<string | number>>(new Set());
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [isLocalFetching, setIsLocalFetching] = useState<boolean>(false);
  const autoFetchTriggered = useRef<boolean>(false);

  // Automatically fetch from database on mount regardless of login status
  useEffect(() => {
    if (!autoFetchTriggered.current) {
      autoFetchTriggered.current = true;
      setIsLocalFetching(true);
      onRetrieveFromCloud().finally(() => {
        setIsLocalFetching(false);
      });
    }
  }, [onRetrieveFromCloud]);

  const toggleHide = (id: string | number) => {
    audioHaptics.tapFeedback();
    const next = new Set(hiddenIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHiddenIds(next);
  };

  const handleManualRetrieve = async () => {
    audioHaptics.tapFeedback();
    setIsLocalFetching(true);
    try {
      await onRetrieveFromCloud();
    } finally {
      setIsLocalFetching(false);
    }
  };

  const handleManualSyncLocal = async () => {
    if (!onSyncLocalToCloud) return;
    audioHaptics.tapFeedback();
    setIsLocalFetching(true);
    try {
      await onSyncLocalToCloud();
    } finally {
      setIsLocalFetching(false);
    }
  };

  const isWorking = isCloudSyncing || isLocalFetching;

  // Render Empty State if no matches found in database
  if (history.length === 0) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 space-y-4">
        {cloudSyncMessage && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cloudSyncMessage}</span>
          </div>
        )}

        <div className="p-6 rounded-3xl bg-[#0f281e] border border-emerald-900/70 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
            <CloudDownload className={`w-8 h-8 ${isWorking ? 'animate-bounce text-emerald-300' : ''}`} />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-extrabold text-lg text-emerald-100 font-display">
              {isWorking ? 'Querying Cloud Database...' : 'No Match Archives Found'}
            </h3>
            <p className="text-xs text-emerald-300/80 leading-relaxed max-w-xs mx-auto">
              Match history is stored permanently in Firebase Cloud Firestore. Anyone can view all completed matches on any device without logging in.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleManualRetrieve}
              disabled={isWorking}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-sm shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isWorking ? 'animate-spin' : ''}`} />
              <span>{isWorking ? 'Connecting to Cloud Firestore...' : 'Retrieve All Matches from Database'}</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-[#0a1e16] border border-emerald-900/50 text-left flex items-start gap-2.5 text-[11px] text-emerald-300/70">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-300">Public & Permanent:</span>
              <p>All completed matches with full scorecards and awards remain permanently archived in the cloud database for spectators and players across all devices.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visibleMatches = history.filter(h => showHidden || !hiddenIds.has(h.id));

  return (
    <div className="max-w-md mx-auto py-3.5 px-3 space-y-3.5">
      {/* Toast Notification */}
      {cloudSyncMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{cloudSyncMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-base text-emerald-100 font-display">Match Archives</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CloudDownload className="w-2.5 h-2.5" />
                Cloud Synced
              </span>
            </div>
            <p className="text-xs text-emerald-300/70">{history.length} Matches Recorded</p>
          </div>
        </div>

        {/* Action Controls - Publicly accessible to retrieve/refresh */}
        <div className="flex items-center gap-1.5">
          {/* Retrieve / Refresh from Cloud Button (Available to all users regardless of login) */}
          <button
            type="button"
            onClick={handleManualRetrieve}
            disabled={isWorking}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="Retrieve all match history from Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isWorking ? 'animate-spin' : ''}`} />
            <span>{isWorking ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {/* Sync Local Records to Cloud (if Scorer) */}
          {isScorer && onSyncLocalToCloud && (
            <button
              type="button"
              onClick={handleManualSyncLocal}
              disabled={isWorking}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 text-teal-300 border border-teal-500/30 flex items-center gap-1 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Ensure all local matches are backed up to Cloud Firestore"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup</span>
            </button>
          )}
        </div>
      </div>

      {/* Cross-Device Sync Status Pill */}
      <div className="px-3 py-2 rounded-2xl bg-[#091b13] border border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-300/80">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sync status: <strong>Permanent Cloud Records</strong></span>
        </div>
        <button
          type="button"
          onClick={handleManualRetrieve}
          disabled={isWorking}
          className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer disabled:opacity-50"
        >
          {isWorking ? 'Fetching updates...' : 'Check Cloud for updates'}
        </button>
      </div>

      {/* Hidden Filter Toggle */}
      {hiddenIds.size > 0 && isScorer && (
        <button
          type="button"
          onClick={() => setShowHidden(!showHidden)}
          className="text-xs font-bold text-emerald-400/80 hover:text-emerald-300 flex items-center gap-1 px-2 cursor-pointer"
        >
          {showHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showHidden ? 'Hide hidden matches' : `Show hidden matches (${hiddenIds.size})`}</span>
        </button>
      )}

      {/* Match Cards List */}
      <div className="space-y-2.5">
        {visibleMatches.map((h, idx) => {
          const serial = history.length - idx;
          const isHidden = hiddenIds.has(h.id);
          const awards = h.awards;
          const matchPayload = h.full || (h as any);

          return (
            <div
              key={h.id}
              onClick={() => onSelectMatch(matchPayload)}
              className={`p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 hover:border-emerald-700/60 active:scale-[0.99] transition-all cursor-pointer space-y-2 relative shadow-sm ${
                isHidden ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-300/70">
                <span className="font-extrabold uppercase tracking-wider text-emerald-400">
                  Match #{serial} • {h.overs} Overs
                </span>
                <span>{new Date(h.date).toLocaleDateString()}</span>
              </div>

              {/* Match Result & Score */}
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  {h.result || 'Match Completed'}
                </h4>
                <div className="text-xs text-emerald-200/80 mt-1 flex justify-between">
                  <span>{h.teamA}: <strong>{h.inn1}</strong></span>
                  <span>vs</span>
                  <span>{h.teamB}: <strong>{h.inn2}</strong></span>
                </div>
              </div>

              {/* MOTM */}
              {awards && (
                <div className="pt-2 border-t border-emerald-900/40 text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 shrink-0" />
                  <span>MOM: {awards.manOfTheMatch}</span>
                </div>
              )}

              {/* Scorer Controls */}
              {isScorer && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHide(h.id);
                    }}
                    className="p-1 rounded text-emerald-400/60 hover:text-emerald-300 cursor-pointer"
                    title={isHidden ? 'Unhide' : 'Hide'}
                  >
                    {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
