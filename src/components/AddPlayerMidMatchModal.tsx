import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Match } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface AddPlayerMidMatchModalProps {
  match: Match;
  onClose: () => void;
  onConfirmAddPlayer: (playerName: string, team: 'A' | 'B' | 'both') => void;
}

export const AddPlayerMidMatchModal: React.FC<AddPlayerMidMatchModalProps> = ({
  match,
  onClose,
  onConfirmAddPlayer
}) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [targetTeam, setTargetTeam] = useState<'A' | 'B' | 'both'>('A');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = playerName.trim();
    if (!clean) return;

    audioHaptics.tapFeedback();
    onConfirmAddPlayer(clean, targetTeam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-base text-emerald-100 font-display">Add Player Mid-Match</h3>
              <p className="text-xs text-emerald-300/70">Insert player into live squads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-emerald-300/80 mb-1">Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Rahul, Sameer..."
              className="w-full px-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold focus:outline-none focus:border-emerald-400"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-1.5 tracking-wider">
              Assign to Team
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setTargetTeam('A')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] truncate border transition-all ${
                  targetTeam === 'A'
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black'
                    : 'bg-[#143427] text-emerald-200 border-emerald-900/60'
                }`}
              >
                {match.teamA.name}
              </button>

              <button
                type="button"
                onClick={() => setTargetTeam('B')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] truncate border transition-all ${
                  targetTeam === 'B'
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black'
                    : 'bg-[#143427] text-emerald-200 border-emerald-900/60'
                }`}
              >
                {match.teamB.name}
              </button>

              <button
                type="button"
                onClick={() => setTargetTeam('both')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] truncate border transition-all ${
                  targetTeam === 'both'
                    ? 'bg-amber-500 text-amber-950 border-amber-400 font-black'
                    : 'bg-[#143427] text-emerald-200 border-emerald-900/60'
                }`}
              >
                Both Teams
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md mt-2"
          >
            Add to Active Match
          </button>
        </form>
      </div>
    </div>
  );
};
