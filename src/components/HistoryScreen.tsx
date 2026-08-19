import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Eye, 
  EyeOff, 
  Trash2, 
  Trophy 
} from 'lucide-react';
import { MatchHistoryEntry, Match } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface HistoryScreenProps {
  history: MatchHistoryEntry[];
  onSelectMatch: (match: Match) => void;
  onClearHistory: () => void;
  isScorer: boolean;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onSelectMatch,
  onClearHistory,
  isScorer
}) => {
  const [hiddenIds, setHiddenIds] = useState<Set<string | number>>(new Set());
  const [showHidden, setShowHidden] = useState<boolean>(false);

  const toggleHide = (id: string | number) => {
    audioHaptics.tapFeedback();
    const next = new Set(hiddenIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHiddenIds(next);
  };

  if (history.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center text-emerald-300/70">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl">
          ⏳
        </div>
        <h3 className="font-bold text-base text-emerald-100 font-display">No Match History</h3>
        <p className="text-xs mt-1">Completed matches will automatically be archived here.</p>
      </div>
    );
  }

  const visibleMatches = history.filter(h => showHidden || !hiddenIds.has(h.id));

  return (
    <div className="max-w-md mx-auto py-4 px-3 space-y-4">
      {/* Header Bar */}
      <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">Match Archives</h3>
            <p className="text-xs text-emerald-300/70">{history.length} Matches Recorded</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isScorer && (
            <button
              onClick={() => {
                if (confirm('Clear local history records?')) {
                  audioHaptics.tapFeedback();
                  onClearHistory();
                }
              }}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 flex items-center gap-1 text-xs font-bold"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Hidden Filter Toggle */}
      {hiddenIds.size > 0 && isScorer && (
        <button
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

          return (
            <div
              key={h.id}
              onClick={() => onSelectMatch(h.full)}
              className={`p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 hover:border-emerald-700/60 transition-all cursor-pointer space-y-2 relative ${
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
    </div>
  );
};
