import React, { useState } from 'react';
import { X, UserMinus, HeartPulse, LogOut, Check, ArrowRight } from 'lucide-react';
import { Innings } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface RetireBatsmanModalProps {
  innings: Innings;
  onClose: () => void;
  onConfirmRetire: (batterIdx: number, retireType: 'hurt' | 'out', nextBatterIdx?: number) => void;
}

export const RetireBatsmanModal: React.FC<RetireBatsmanModalProps> = ({
  innings,
  onClose,
  onConfirmRetire
}) => {
  const strikerIdx = innings.strikerIdx;
  const nonStrikerIdx = innings.nonStrikerIdx;
  const striker = innings.batting[strikerIdx];
  const nonStriker = innings.batting[nonStrikerIdx];

  const [selectedBatterIdx, setSelectedBatterIdx] = useState<number>(strikerIdx);
  const [retireType, setRetireType] = useState<'hurt' | 'out'>('hurt');

  // Available replacement batters (unbatted or previously retired hurt)
  const replacementCandidates = innings.batting
    .map((b, i) => ({ ...b, idx: i }))
    .filter(b => {
      if (b.out) return false;
      if (b.idx === strikerIdx || b.idx === nonStrikerIdx) return false;
      return true;
    });

  const [nextBatterIdx, setNextBatterIdx] = useState<number>(
    replacementCandidates[0]?.idx ?? -1
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioHaptics.tapFeedback();
    onConfirmRetire(selectedBatterIdx, retireType, nextBatterIdx >= 0 ? nextBatterIdx : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UserMinus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-emerald-100 font-display">Retire Batsman</h3>
              <p className="text-xs text-emerald-300/70">Select retirement reason & replacement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          {/* Step 1: Choose Batter */}
          <div>
            <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-2 tracking-wider">
              1. Select Batsman Retiring
            </label>
            <div className="grid grid-cols-2 gap-2">
              {striker && (
                <button
                  type="button"
                  onClick={() => setSelectedBatterIdx(strikerIdx)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedBatterIdx === strikerIdx
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-md'
                      : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold opacity-75 mb-0.5">Striker</div>
                  <div className="font-bold text-xs truncate">{striker.name}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedBatterIdx === strikerIdx ? 'text-emerald-950/80' : 'text-emerald-300/60'}`}>
                    {striker.runs} ({striker.balls}b)
                  </div>
                </button>
              )}

              {nonStriker && (
                <button
                  type="button"
                  onClick={() => setSelectedBatterIdx(nonStrikerIdx)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedBatterIdx === nonStrikerIdx
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-md'
                      : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold opacity-75 mb-0.5">Non-Striker</div>
                  <div className="font-bold text-xs truncate">{nonStriker.name}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedBatterIdx === nonStrikerIdx ? 'text-emerald-950/80' : 'text-emerald-300/60'}`}>
                    {nonStriker.runs} ({nonStriker.balls}b)
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Choose Retirement Type */}
          <div>
            <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-2 tracking-wider">
              2. Retirement Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Retired Hurt */}
              <button
                type="button"
                onClick={() => setRetireType('hurt')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  retireType === 'hurt'
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-lg ring-2 ring-emerald-400/40'
                    : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <HeartPulse className={`w-4 h-4 ${retireType === 'hurt' ? 'text-emerald-950' : 'text-amber-400'}`} />
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    retireType === 'hurt' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                  }`}>
                    Can Bat Again
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs">Retired Hurt</div>
                  <p className={`text-[10px] mt-1 leading-snug ${
                    retireType === 'hurt' ? 'text-emerald-950/90' : 'text-emerald-300/70'
                  }`}>
                    Injured / Ill. Not out. Eligible to return to the crease later.
                  </p>
                </div>
              </button>

              {/* Retired Out */}
              <button
                type="button"
                onClick={() => setRetireType('out')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  retireType === 'out'
                    ? 'bg-rose-500 text-rose-950 border-rose-400 font-black shadow-lg ring-2 ring-rose-400/40'
                    : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <LogOut className={`w-4 h-4 ${retireType === 'out' ? 'text-rose-950' : 'text-rose-400'}`} />
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    retireType === 'out' ? 'bg-rose-950 text-rose-300' : 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                  }`}>
                    Counts as Out
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs">Retired Out</div>
                  <p className={`text-[10px] mt-1 leading-snug ${
                    retireType === 'out' ? 'text-rose-950/90' : 'text-emerald-300/70'
                  }`}>
                    Voluntary dismissal. +1 Team Wicket. Cannot bat again.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Replacement Batsman */}
          <div>
            <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-2 tracking-wider">
              3. Select Incoming Replacement Batsman
            </label>
            {replacementCandidates.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-300/80 text-[11px]">
                No more batsmen available in squad. {retireType === 'out' ? 'Innings may conclude if all out.' : ''}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {replacementCandidates.map(b => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => setNextBatterIdx(b.idx)}
                    className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                      nextBatterIdx === b.idx
                        ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-md'
                        : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.retired && !b.out && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            nextBatterIdx === b.idx ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            Resume Hurt Player
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] ${nextBatterIdx === b.idx ? 'text-emerald-950/80' : 'text-emerald-300/60'}`}>
                        {b.runs} runs ({b.balls}b)
                      </div>
                    </div>
                    {nextBatterIdx === b.idx && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className={`w-full py-3 rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
              retireType === 'out'
                ? 'bg-rose-500 hover:bg-rose-400 text-rose-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'
            }`}
          >
            <span>Confirm {retireType === 'hurt' ? 'Retired Hurt' : 'Retired Out'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
