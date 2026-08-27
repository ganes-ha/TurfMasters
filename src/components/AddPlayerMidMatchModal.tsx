import React, { useState } from 'react';
import { X, UserPlus, Check, Users, Sparkles } from 'lucide-react';
import { Match } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface AddPlayerMidMatchModalProps {
  match: Match;
  onClose: () => void;
  onConfirmAddPlayer: (playerName: string, team: 'A' | 'B' | 'both') => void;
  savedPlayers?: string[];
}

export const AddPlayerMidMatchModal: React.FC<AddPlayerMidMatchModalProps> = ({
  match,
  onClose,
  onConfirmAddPlayer,
  savedPlayers = []
}) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [targetTeam, setTargetTeam] = useState<'A' | 'B' | 'both'>('A');

  // Compute active players already in the current match squads
  const activePlayersTeamA = new Set(match.teamA.players.map(p => p.toLowerCase().trim()));
  const activePlayersTeamB = new Set(match.teamB.players.map(p => p.toLowerCase().trim()));

  // Find bench / saved pool players not yet in Team A, Team B, or either
  const leftoverPlayers = savedPlayers.filter(name => {
    const clean = name.toLowerCase().trim();
    if (!clean) return false;
    if (targetTeam === 'A') return !activePlayersTeamA.has(clean);
    if (targetTeam === 'B') return !activePlayersTeamB.has(clean);
    return !activePlayersTeamA.has(clean) || !activePlayersTeamB.has(clean);
  });

  const handleSubmit = (e?: React.FormEvent, customName?: string) => {
    if (e) e.preventDefault();
    const nameToUse = (customName !== undefined ? customName : playerName).trim();
    if (!nameToUse) return;

    audioHaptics.tapFeedback();
    onConfirmAddPlayer(nameToUse, targetTeam);
    setPlayerName('');
    onClose();
  };

  const handleSelectExisting = (name: string) => {
    handleSubmit(undefined, name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-base text-emerald-100 font-display">Add Player Mid-Match</h3>
              <p className="text-[11px] text-emerald-300/70">Pick from squad bench or enter new name</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content scroll area */}
        <div className="overflow-y-auto py-3.5 space-y-4 text-xs">
          {/* Team Selector */}
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
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-sm'
                    : 'bg-[#143427] text-emerald-200 border-emerald-900/60 hover:bg-[#1a4433]'
                }`}
              >
                {match.teamA.name}
              </button>

              <button
                type="button"
                onClick={() => setTargetTeam('B')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] truncate border transition-all ${
                  targetTeam === 'B'
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-sm'
                    : 'bg-[#143427] text-emerald-200 border-emerald-900/60 hover:bg-[#1a4433]'
                }`}
              >
                {match.teamB.name}
              </button>

              <button
                type="button"
                onClick={() => setTargetTeam('both')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] truncate border transition-all ${
                  targetTeam === 'both'
                    ? 'bg-amber-500 text-amber-950 border-amber-400 font-black shadow-sm'
                    : 'bg-[#143427] text-emerald-200 border-emerald-900/60 hover:bg-[#1a4433]'
                }`}
              >
                Both Teams
              </button>
            </div>
          </div>

          {/* Section 1: Leftover / Bench Squad Members */}
          {leftoverPlayers.length > 0 && (
            <div className="bg-[#143427]/70 border border-emerald-900/80 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-[11px] text-emerald-200 uppercase tracking-wider">
                    Available Bench ({leftoverPlayers.length})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400/80 font-medium">Tap to add</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {leftoverPlayers.map(player => (
                  <button
                    key={player}
                    type="button"
                    onClick={() => handleSelectExisting(player)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#0e241b] border border-emerald-800/80 hover:border-emerald-400 text-emerald-100 hover:bg-emerald-500 hover:text-emerald-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span>+</span>
                    <span className="truncate max-w-[120px]">{player}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Enter New Custom Player Name */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <label className="block font-bold text-emerald-300/90 text-xs">
                  Enter New Player Name
                </label>
              </div>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Type player name..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold text-sm focus:outline-none focus:border-emerald-400 placeholder:text-emerald-700/60"
              />
            </div>

            <button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Add &quot;{playerName.trim() || 'New Player'}&quot;</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
