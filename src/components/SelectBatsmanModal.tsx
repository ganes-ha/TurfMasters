import React, { useState } from 'react';
import { X, UserCheck, ShieldAlert } from 'lucide-react';
import { Innings } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface SelectBatsmanModalProps {
  innings: Innings;
  targetRole: 'striker' | 'nonstriker' | 'new_batter';
  commonPlayer: string | null;
  onClose: () => void;
  onSelectBatter: (batterIndex: number) => void;
}

export const SelectBatsmanModal: React.FC<SelectBatsmanModalProps> = ({
  innings,
  targetRole,
  commonPlayer,
  onClose,
  onSelectBatter
}) => {
  // Available batters who are not currently on strike or non-striker, and not out
  const currentStrikerIdx = innings.strikerIdx;
  const currentNonStrikerIdx = innings.nonStrikerIdx;
  const strikerIsOut = currentStrikerIdx >= 0 && innings.batting[currentStrikerIdx]?.out;
  const nonStrikerIsOut = currentNonStrikerIdx >= 0 && innings.batting[currentNonStrikerIdx]?.out;

  const eligibleBatters = innings.batting
    .map((b, i) => ({ ...b, idx: i }))
    .filter(b => {
      if (b.out || b.retired) return false;
      if (targetRole === 'striker' && b.idx === currentNonStrikerIdx && !nonStrikerIsOut) return false;
      if (targetRole === 'nonstriker' && b.idx === currentStrikerIdx && !strikerIsOut) return false;
      if (targetRole === 'new_batter') {
        // If replacing dismissed batter, exclude only the active partner
        if (strikerIsOut && b.idx === currentNonStrikerIdx) return false;
        if (nonStrikerIsOut && b.idx === currentStrikerIdx) return false;
        if (!strikerIsOut && !nonStrikerIsOut && (b.idx === currentStrikerIdx || b.idx === currentNonStrikerIdx)) return false;
      }
      return true;
    });

  const [selectedIdx, setSelectedIdx] = useState<number>(eligibleBatters[0]?.idx ?? 0);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    audioHaptics.tapFeedback();
    onSelectBatter(selectedIdx);
    onClose();
  };

  const titles = {
    striker: 'Select Striker Batsman',
    nonstriker: 'Select Non-Striker Batsman',
    new_batter: 'Select Next Batsman (In-Coming)'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">
              {titles[targetRole]}
            </h3>
            <p className="text-xs text-emerald-300/70">Choose squad batter to take position</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="py-4 space-y-3">
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {eligibleBatters.length === 0 ? (
              <p className="text-xs text-emerald-300/60 italic p-3 text-center">
                No eligible batsman available in the squad.
              </p>
            ) : (
              eligibleBatters.map((b) => (
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
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {b.name === commonPlayer && <span className="text-[10px] text-amber-300 font-extrabold">★ Common</span>}
                      {b.retired && <span className="text-[10px] text-amber-300 font-semibold">(Retired)</span>}
                    </div>
                    <div className={`text-[10px] ${selectedIdx === b.idx ? 'text-emerald-950/80' : 'text-emerald-300/60'}`}>
                      {b.runs} runs ({b.balls} balls) • 4s: {b.fours} • 6s: {b.sixes}
                    </div>
                  </div>
                  {selectedIdx === b.idx && <UserCheck className="w-4 h-4" />}
                </button>
              ))
            )}
          </div>

          <button
            type="submit"
            disabled={eligibleBatters.length === 0}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md mt-2 disabled:opacity-50"
          >
            Confirm Batsman
          </button>
        </form>
      </div>
    </div>
  );
};
