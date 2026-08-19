import React, { useState } from 'react';
import { X, RefreshCw, Users, Play, Trophy } from 'lucide-react';
import { Match } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface NewMatchModalProps {
  previousMatch: Match | null;
  onClose: () => void;
  onStartSameSquads: (tossWinner: 'A' | 'B', tossDecision: 'bat' | 'bowl') => void;
  onGoToSetupScreen: () => void;
}

export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  previousMatch,
  onClose,
  onStartSameSquads,
  onGoToSetupScreen
}) => {
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  const handleRematch = (e: React.FormEvent) => {
    e.preventDefault();
    audioHaptics.tapFeedback();
    onStartSameSquads(tossWinner, tossDecision);
    onClose();
  };

  const handleNewSquads = () => {
    audioHaptics.tapFeedback();
    onGoToSetupScreen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f291e] border border-emerald-700/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">
              Start Next Match
            </h3>
            <p className="text-xs text-emerald-300/70">Choose squad configuration</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Option 1: Same Squads Rematch */}
          {previousMatch && (
            <form onSubmit={handleRematch} className="p-3.5 rounded-2xl bg-[#143828] border border-emerald-600/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-emerald-100 uppercase tracking-wide">
                    Continue with Same Squads
                  </h4>
                  <p className="text-[11px] text-emerald-300/70">
                    {previousMatch.teamA.name} ({previousMatch.teamA.players.length}p) vs {previousMatch.teamB.name} ({previousMatch.teamB.players.length}p) • {previousMatch.overs} ov
                  </p>
                </div>
              </div>

              {/* Toss Selection for Quick Rematch */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-800/40">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300/80 uppercase mb-1">
                    Toss Winner
                  </label>
                  <select
                    value={tossWinner}
                    onChange={e => setTossWinner(e.target.value as 'A' | 'B')}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0c2419] border border-emerald-700 text-emerald-100 text-xs font-bold"
                  >
                    <option value="A">{previousMatch.teamA.name}</option>
                    <option value="B">{previousMatch.teamB.name}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300/80 uppercase mb-1">
                    Elected To
                  </label>
                  <select
                    value={tossDecision}
                    onChange={e => setTossDecision(e.target.value as 'bat' | 'bowl')}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0c2419] border border-emerald-700 text-emerald-100 text-xs font-bold"
                  >
                    <option value="bat">Bat First</option>
                    <option value="bowl">Bowl First</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Quick Rematch</span>
              </button>
            </form>
          )}

          {/* Option 2: Brand New Squad Setup */}
          <div className="p-3.5 rounded-2xl bg-[#0f281e] border border-emerald-900/80 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-emerald-100 uppercase tracking-wide">
                  New Match / Change Squads
                </h4>
                <p className="text-[11px] text-emerald-300/70">
                  Configure new teams, player rosters, or match rules
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNewSquads}
              className="w-full py-2.5 rounded-xl bg-[#173e2d] hover:bg-[#20523d] text-emerald-100 font-bold text-xs border border-emerald-700/60 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Go to Setup Screen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
