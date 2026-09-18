import React, { useState, useEffect, useRef } from 'react';
import { 
  History as HistoryIcon, 
  Eye, 
  EyeOff, 
  Trash2, 
  Trophy,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Info,
  X
} from 'lucide-react';
import { MatchHistoryEntry, Match } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface HistoryScreenProps {
  history: MatchHistoryEntry[];
  onSelectMatch: (match: Match) => void;
  onClearHistory: (deleteFromCloudToo?: boolean) => void;
  isScorer: boolean;
  onRetrieveFromCloud: () => Promise<void>;
  onSyncLocalToCloud?: () => Promise<void>;
  isCloudSyncing?: boolean;
  cloudSyncMessage?: string | null;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onSelectMatch,
  onClearHistory,
  isScorer,
  onRetrieveFromCloud,
  onSyncLocalToCloud,
  isCloudSyncing = false,
  cloudSyncMessage = null
}) => {
  const [hiddenIds, setHiddenIds] = useState<Set<string | number>>(new Set());
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [isLocalFetching, setIsLocalFetching] = useState<boolean>(false);
  const autoFetchTriggered = useRef<boolean>(false);

  // Auto-fetch from Cloud once on mount if local history is completely empty
  useEffect(() => {
    if (history.length === 0 && !autoFetchTriggered.current) {
      autoFetchTriggered.current = true;
      setIsLocalFetching(true);
      onRetrieveFromCloud().finally(() => {
        setIsLocalFetching(false);
      });
    }
  }, [history.length, onRetrieveFromCloud]);

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

  // Render Empty State with Cloud Retrieval Action
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
              {isWorking ? 'Retrieving Cloud Archives...' : 'No Match History in Local Storage'}
            </h3>
            <p className="text-xs text-emerald-300/80 leading-relaxed max-w-xs mx-auto">
              If match records were cleared locally or you opened CricVault on another device, retrieve all completed matches stored safely in Firebase Cloud Firestore.
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
              <span>{isWorking ? 'Syncing with Cloud Firestore...' : 'Retrieve Matches from Cloud'}</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-[#0a1e16] border border-emerald-900/50 text-left flex items-start gap-2.5 text-[11px] text-emerald-300/70">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-300">Cross-Device Sync Tip:</span>
              <p>Completed matches automatically back up to Cloud Firestore so spectators and scorers on any mobile, tablet, or desktop can view the same records.</p>
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

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Retrieve from Cloud Button */}
          <button
            type="button"
            onClick={handleManualRetrieve}
            disabled={isWorking}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-xs font-bold transition-all disabled:opacity-50"
            title="Retrieve newest matches from Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isWorking ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Retrieve</span>
          </button>

          {/* Sync Local Records to Cloud (if Scorer) */}
          {isScorer && onSyncLocalToCloud && (
            <button
              type="button"
              onClick={handleManualSyncLocal}
              disabled={isWorking}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 text-teal-300 border border-teal-500/30 flex items-center gap-1 text-xs font-bold transition-all disabled:opacity-50"
              title="Ensure all local matches are backed up to Cloud Firestore"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup</span>
            </button>
          )}

          {/* Clear Button */}
          {isScorer && (
            <button
              type="button"
              onClick={() => {
                audioHaptics.tapFeedback();
                setShowClearModal(true);
              }}
              className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-400 border border-red-500/30 flex items-center gap-1 text-xs font-bold transition-all"
              title="Clear or Manage History"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Cross-Device Sync Status Pill */}
      <div className="px-3 py-2 rounded-2xl bg-[#091b13] border border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-300/80">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sync status: <strong>Multi-Device Ready</strong></span>
        </div>
        <button
          type="button"
          onClick={handleManualRetrieve}
          className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
        >
          Check Cloud for updates
        </button>
      </div>

      {/* Hidden Filter Toggle */}
      {hiddenIds.size > 0 && isScorer && (
        <button
          type="button"
          onClick={() => setShowHidden(!showHidden)}
          className="text-xs font-bold text-emerald-400/80 hover:text-emerald-300 flex items-center gap-1 px-2"
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
                    className="p-1 rounded text-emerald-400/60 hover:text-emerald-300"
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

      {/* Clear History Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0f281e] border-2 border-emerald-800/80 p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-100 font-black text-base">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span>Manage Match History</span>
              </div>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="p-1 rounded-xl hover:bg-emerald-800/50 text-emerald-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-emerald-200/80">
              How would you like to clear match history?
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Clear Local Only */}
              <button
                type="button"
                onClick={() => {
                  audioHaptics.tapFeedback();
                  setShowClearModal(false);
                  onClearHistory(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-[#143929] hover:bg-[#1a4a35] border border-emerald-700/50 text-left transition-all space-y-1"
              >
                <div className="font-bold text-xs text-emerald-100 flex items-center justify-between">
                  <span>Clear Local Device Cache Only</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Recommended</span>
                </div>
                <p className="text-[11px] text-emerald-300/70">
                  Clears local storage on this browser. All matches remain preserved in Cloud Firestore and can be retrieved back at any time.
                </p>
              </button>

              {/* Option 2: Delete from Cloud Too */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete ALL match history from Cloud Firestore? This cannot be undone.')) {
                    audioHaptics.tapFeedback();
                    setShowClearModal(false);
                    onClearHistory(true);
                  }
                }}
                className="w-full p-3.5 rounded-2xl bg-red-950/40 hover:bg-red-950/70 border border-red-800/50 text-left transition-all space-y-1"
              >
                <div className="font-bold text-xs text-red-300">
                  Permanently Delete from Cloud & Device
                </div>
                <p className="text-[11px] text-red-200/60">
                  Wipes history documents from Cloud Firestore and all connected devices permanently.
                </p>
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="w-full py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
