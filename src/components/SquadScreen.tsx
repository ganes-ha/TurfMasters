import React, { useState } from 'react';
import { Users, Plus, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';
import { audioHaptics } from '../utils/audioHaptics';

interface SquadScreenProps {
  players: string[];
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (name: string) => void;
  onResetDefaultSquad: () => void;
}

export const SquadScreen: React.FC<SquadScreenProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onResetDefaultSquad
}) => {
  const [newPlayerName, setNewPlayerName] = useState<string>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPlayerName.trim();
    if (!clean) return;
    if (players.some(p => p.toLowerCase() === clean.toLowerCase())) {
      alert('A player with this name already exists.');
      return;
    }
    audioHaptics.tapFeedback();
    onAddPlayer(clean);
    setNewPlayerName('');
  };

  return (
    <div className="max-w-md mx-auto py-4 px-3 space-y-4">
      {/* Squad Header */}
      <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">Squad Management</h3>
            <p className="text-xs text-emerald-300/70">{players.length} Registered Players</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset squad back to the default 20 players?')) {
              audioHaptics.tapFeedback();
              onResetDefaultSquad();
            }
          }}
          className="p-2 rounded-xl bg-[#143427] hover:bg-[#1a4232] text-emerald-300 text-xs font-bold border border-emerald-800/60"
          title="Reset Defaults"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Add Player Input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newPlayerName}
          onChange={e => setNewPlayerName(e.target.value)}
          placeholder="Enter player name..."
          maxLength={30}
          className="flex-1 px-4 py-3 rounded-2xl bg-[#0f281e] border border-emerald-800 text-emerald-100 text-sm font-semibold focus:outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Players List */}
      <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-2">
        <div className="grid grid-cols-1 gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {players.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#143427] border border-emerald-900/40 hover:bg-[#183d2e] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-xs text-emerald-100">{name}</span>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Remove ${name} from squad?`)) {
                    audioHaptics.tapFeedback();
                    onRemovePlayer(name);
                  }
                }}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                title="Remove player"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
