import React, { useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { Innings } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface ReturnRetiredModalProps {
  innings: Innings;
  onClose: () => void;
  onConfirmReturn: (playerIdx: number, replaceTarget: 'striker' | 'nonstriker') => void;
}

export const ReturnRetiredModal: React.FC<ReturnRetiredModalProps> = ({
  innings,
  onClose,
  onConfirmReturn
}) => {
  const retiredBatters = innings.batting
    .map((b, i) => ({ ...b, idx: i }))
    .filter(b => b.retired && !b.out);

  const [selectedIdx, setSelectedIdx] = useState<number>(retiredBatters[0]?.idx ?? -1);
  const [replaceTarget, setReplaceTarget] = useState<'striker' | 'nonstriker'>('striker');

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIdx < 0) return;
    audioHaptics.tapFeedback();
    onConfirmReturn(selectedIdx, replaceTarget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-base text-emerald-100 font-display">Return Retired Batsman</h3>
              <p className="text-xs text-emerald-300/70">Resume batting for retired player</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {retiredBatters.length === 0 ? (
          <div className="py-6 text-center text-emerald-300/70 text-xs">
            No retired batsmen currently recorded in this innings.
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="py-4 space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-2 tracking-wider">
                Select Retired Batsman
              </label>
              <div className="space-y-1.5">
                {retiredBatters.map((b) => (
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
                        {b.runs} runs ({b.balls} balls) • 4s: {b.fours} • 6s: {b.sixes}
                      </div>
                    </div>
                    {selectedIdx === b.idx && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-2 tracking-wider">
                Replaces Crease Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReplaceTarget('striker')}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    replaceTarget === 'striker'
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black'
                      : 'bg-[#143427] text-emerald-200 border-emerald-900/60'
                  }`}
                >
                  Striker End
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceTarget('nonstriker')}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    replaceTarget === 'nonstriker'
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black'
                      : 'bg-[#143427] text-emerald-200 border-emerald-900/60'
                  }`}
                >
                  Non-Striker End
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md mt-2"
            >
              Confirm Batsman Return
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
