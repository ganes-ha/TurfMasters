import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Innings } from '../types';
import { oversStr } from '../utils/cricketRules';

interface ChangeBowlerModalProps {
  innings: Innings;
  maxBowl: number;
  commonPlayer: string | null;
  onClose: () => void;
  onSelectBowler: (bowlerIdx: number) => void;
}

export const ChangeBowlerModal: React.FC<ChangeBowlerModalProps> = ({
  innings,
  maxBowl,
  commonPlayer,
  onClose,
  onSelectBowler
}) => {
  const eligibleBowlers = innings.bowling
    .map((b, i) => ({ ...b, idx: i }))
    .filter(b => {
      if (b.idx === innings.lastBowlerIdx) return false;
      if (maxBowl > 0 && Math.floor(b.totalBalls / 6) >= maxBowl) return false;
      return true;
    });

  const [selectedIdx, setSelectedIdx] = useState<number>(eligibleBowlers[0]?.idx ?? 0);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectBowler(selectedIdx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">Select Next Bowler</h3>
            <p className="text-xs text-emerald-300/70">Over complete • Choose bowler</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-emerald-300/80 mb-2 uppercase tracking-wider">
              Eligible Bowlers
            </label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {(eligibleBowlers.length > 0 ? eligibleBowlers : innings.bowling.map((b, i) => ({ ...b, idx: i }))).map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => setSelectedIdx(b.idx)}
                  className={`w-full p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                    selectedIdx === b.idx
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-md'
                      : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{b.name}</div>
                    <div className={`text-[10px] ${selectedIdx === b.idx ? 'text-emerald-950/80' : 'text-emerald-300/60'}`}>
                      {oversStr(b.totalBalls)} ov • {b.runs}r • {b.wickets}w
                    </div>
                  </div>
                  {selectedIdx === b.idx && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md mt-2"
          >
            Confirm Bowler
          </button>
        </form>
      </div>
    </div>
  );
};
