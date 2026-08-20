import React, { useState } from 'react';
import { X, Play, ShieldAlert } from 'lucide-react';
import { Innings } from '../types';

interface StartInningsModalProps {
  inningsNum: 1 | 2;
  battingTeamName: string;
  innings: Innings;
  target?: number | null;
  totalOvers?: number;
  firstInningsTotal?: number;
  firstInningsBalls?: number;
  commonPlayer: string | null;
  onClose: () => void;
  onConfirm: (strikerIdx: number, nonStrikerIdx: number, bowlerIdx: number) => void;
}

export const StartInningsModal: React.FC<StartInningsModalProps> = ({
  inningsNum,
  battingTeamName,
  innings,
  target,
  totalOvers = 5,
  firstInningsTotal,
  firstInningsBalls,
  commonPlayer,
  onClose,
  onConfirm
}) => {
  const availableBatters = innings.batting.filter(b => !b.out && !b.retired);
  const availableBowlers = innings.bowling.map((b, i) => ({ ...b, idx: i }));

  const [strikerIdx, setStrikerIdx] = useState<number>(0);
  const [nonStrikerIdx, setNonStrikerIdx] = useState<number>(1);
  const [bowlerIdx, setBowlerIdx] = useState<number>(0);

  const totalBalls = totalOvers * 6;
  const reqRunRate = target && totalOvers > 0 ? (target / totalOvers).toFixed(2) : null;
  const inn1RunRate = firstInningsTotal !== undefined && firstInningsBalls && firstInningsBalls > 0
    ? (firstInningsTotal / (firstInningsBalls / 6)).toFixed(2)
    : null;

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

        {/* 2nd Innings Target, Balls, Run Rate & Required Run Rate Banner */}
        {inningsNum === 2 && target !== undefined && target !== null && (
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-[#144230] to-[#0d2b1f] border border-emerald-500/40 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                <span>🎯 Target Chase</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {totalOvers} Overs ({totalBalls} Balls)
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-300/70">Target Score</div>
                <div className="text-2xl font-black text-white font-display">
                  {target} <span className="text-xs font-semibold text-emerald-300/70">runs</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-emerald-300/70">Required From</div>
                <div className="text-sm font-extrabold text-amber-300">
                  {totalBalls} balls
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-800/50 text-[11px]">
              <div className="p-2 rounded-xl bg-[#0f281e] border border-emerald-900/60 flex flex-col">
                <span className="text-[10px] text-emerald-300/70 font-semibold uppercase">1st Innings RR</span>
                <span className="font-extrabold text-emerald-200">{inn1RunRate || '—'}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#0f281e] border border-amber-500/30 flex flex-col">
                <span className="text-[10px] text-amber-300/80 font-semibold uppercase">Req Run Rate (RRR)</span>
                <span className="font-black text-amber-400 text-xs">{reqRunRate || '—'} <span className="text-[9px] font-normal text-amber-300/70">rpo</span></span>
              </div>
            </div>
          </div>
        )}

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
