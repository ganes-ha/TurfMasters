import React, { useState } from 'react';
import { X, Play, ShieldAlert } from 'lucide-react';
import { Innings } from '../types';

interface StartInningsModalProps {
  inningsNum: 1 | 2;
  battingTeamName: string;
  innings: Innings;
  commonPlayer: string | null;
  onClose: () => void;
  onConfirm: (strikerIdx: number, nonStrikerIdx: number, bowlerIdx: number) => void;
}

export const StartInningsModal: React.FC<StartInningsModalProps> = ({
  inningsNum,
  battingTeamName,
  innings,
  commonPlayer,
  onClose,
  onConfirm
}) => {
  const availableBatters = innings.batting.filter(b => !b.out && !b.retired);
  const availableBowlers = innings.bowling.map((b, i) => ({ ...b, idx: i }));

  const [strikerIdx, setStrikerIdx] = useState<number>(0);
  const [nonStrikerIdx, setNonStrikerIdx] = useState<number>(1);
  const [bowlerIdx, setBowlerIdx] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (strikerIdx === nonStrikerIdx) {
      alert('Striker and Non-Striker must be two different players.');
      return;
    }
    onConfirm(strikerIdx, nonStrikerIdx, bowlerIdx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">
              Start Innings {inningsNum}
            </h3>
            <p className="text-xs text-emerald-400 font-bold">{battingTeamName} Batting</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {commonPlayer && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
            Common player <strong>{commonPlayer}</strong> cannot both bat and bowl in the same match.
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-emerald-300/80 mb-1">🏏 Opening Striker</label>
            <select
              value={strikerIdx}
              onChange={e => setStrikerIdx(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
            >
              {availableBatters.map((b, i) => (
                <option key={b.name} value={i}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-emerald-300/80 mb-1">🏏 Non-Striker</label>
            <select
              value={nonStrikerIdx}
              onChange={e => setNonStrikerIdx(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
            >
              {availableBatters.map((b, i) => (
                <option key={b.name} value={i}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-emerald-300/80 mb-1">🎳 Opening Bowler</label>
            <select
              value={bowlerIdx}
              onChange={e => setBowlerIdx(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
            >
              {availableBowlers.map(b => (
                <option key={b.name} value={b.idx}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Begin Innings {inningsNum}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
