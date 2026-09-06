import React, { useState, useEffect } from 'react';
import { X, Check, ShieldAlert, Target, Activity, FileText, Users } from 'lucide-react';
import { Match, Innings } from '../types';
import { oversStr } from '../utils/cricketRules';
import { audioHaptics } from '../utils/audioHaptics';

interface ChangeBowlerModalProps {
  innings: Innings;
  match?: Match | null;
  maxBowl: number;
  commonPlayer: string | null;
  onClose: () => void;
  onSelectBowler: (bowlerIdx: number) => void;
}

export const ChangeBowlerModal: React.FC<ChangeBowlerModalProps> = ({
  innings,
  match,
  maxBowl,
  commonPlayer,
  onClose,
  onSelectBowler
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'scorecard'>('select');

  const eligibleBowlers = innings.bowling
    .map((b, i) => ({ ...b, idx: i }))
    .filter(b => {
      if (b.idx === innings.lastBowlerIdx) return false;
      if (maxBowl > 0 && Math.floor(b.totalBalls / 6) >= maxBowl) return false;
      return true;
    });

  const [selectedIdx, setSelectedIdx] = useState<number>(
    eligibleBowlers[0]?.idx ?? (innings.lastBowlerIdx === 0 && innings.bowling.length > 1 ? 1 : 0)
  );

  useEffect(() => {
    if (eligibleBowlers.length > 0 && !eligibleBowlers.some(b => b.idx === selectedIdx)) {
      setSelectedIdx(eligibleBowlers[0].idx);
    }
  }, [innings.lastBowlerIdx, eligibleBowlers.length]);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    audioHaptics.tapFeedback();
    onSelectBowler(selectedIdx);
  };

  const handleDirectSelect = (bowlerIdx: number) => {
    audioHaptics.tapFeedback();
    onSelectBowler(bowlerIdx);
  };

  // Match and live score information
  const battingTeamName = match
    ? (match.innings === 1
      ? (match.battingFirst === 'A' ? match.teamA.name : match.teamB.name)
      : (match.battingFirst === 'A' ? match.teamB.name : match.teamA.name))
    : 'Batting Team';

  const bowlingTeamName = match
    ? (match.innings === 1
      ? (match.battingFirst === 'A' ? match.teamB.name : match.teamA.name)
      : (match.battingFirst === 'A' ? match.teamA.name : match.teamB.name))
    : 'Bowling Team';

  const striker = innings.strikerIdx >= 0 ? innings.batting[innings.strikerIdx] : null;
  const nonStriker = innings.nonStrikerIdx >= 0 ? innings.batting[innings.nonStrikerIdx] : null;
  const lastBowler = innings.lastBowlerIdx >= 0 ? innings.bowling[innings.lastBowlerIdx] : null;

  const target = match && match.innings === 2 && match.inn1 ? match.inn1.total + 1 : null;
  const needed = (target !== null) ? Math.max(0, target - innings.total) : null;
  const maxBalls = match ? match.overs * 6 : 0;
  const ballsLeft = maxBalls > 0 ? Math.max(0, maxBalls - innings.legalBalls) : null;
  const crr = innings.legalBalls > 0 ? ((innings.total / innings.legalBalls) * 6).toFixed(2) : '0.00';
  const rrr = (needed !== null && ballsLeft !== null && ballsLeft > 0)
    ? ((needed / ballsLeft) * 6).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-emerald-900/60 shrink-0">
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">Select Next Bowler</h3>
            <p className="text-xs text-emerald-300/70">
              {bowlingTeamName} Bowling • Choose bowler for the next over
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Innings Scorecard Banner */}
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-br from-[#144230] to-[#0c241b] border border-emerald-700/50 space-y-2 shadow-md shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300/70 block">
                {battingTeamName} • Innings {match?.innings || 1}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white tabular-nums tracking-tight font-display">
                  {innings.total}/{innings.wickets}
                </span>
                <span className="text-xs font-semibold text-emerald-300/80">
                  ({oversStr(innings.legalBalls)}{match ? `/${match.overs}` : ''} ov)
                </span>
                <span className="text-[11px] font-medium text-emerald-300/60">
                  CRR: {crr}
                </span>
              </div>
            </div>

            {target !== null && needed !== null && ballsLeft !== null && (
              <div className="text-right bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl shrink-0">
                <div className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1 justify-end">
                  <Target className="w-3 h-3" /> Target {target}
                </div>
                <div className="text-xs font-black text-amber-200">
                  Need {needed} off {ballsLeft}b
                </div>
                {rrr && <div className="text-[10px] font-semibold text-amber-400">RRR: {rrr}</div>}
              </div>
            )}
          </div>

          {/* Current Batters at Crease & Last Bowler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
            <div className="p-1.5 rounded-lg bg-[#0d2b1f] border border-emerald-900/60 flex items-center justify-between">
              <span className="text-emerald-300/80 font-medium">At Crease:</span>
              <span className="font-bold text-emerald-100 truncate ml-1">
                {striker?.name} ({striker?.runs}*) & {nonStriker?.name} ({nonStriker?.runs}*)
              </span>
            </div>

            {lastBowler && (
              <div className="p-1.5 rounded-lg bg-[#0d2b1f] border border-emerald-900/60 flex items-center justify-between">
                <span className="text-emerald-300/80 font-medium">Last Bowler:</span>
                <span className="font-semibold text-amber-300 text-[10px] truncate ml-1">
                  {lastBowler.name} ({oversStr(lastBowler.totalBalls)} ov, {lastBowler.wickets}w)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View Toggle: Select Bowler vs Full Bowling Scorecard */}
        <div className="flex gap-1.5 p-1 mt-2.5 rounded-xl bg-[#0b1f17] border border-emerald-900/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('select')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'select'
                ? 'bg-emerald-500 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300/70 hover:text-emerald-100 hover:bg-[#14382a]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Select Bowler ({eligibleBowlers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scorecard')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scorecard'
                ? 'bg-emerald-500 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300/70 hover:text-emerald-100 hover:bg-[#14382a]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bowling Scorecard</span>
          </button>
        </div>

        {/* Tab Content: Selection List */}
        {activeTab === 'select' && (
          <form onSubmit={handleConfirm} className="py-2.5 flex-1 flex flex-col overflow-hidden">
            <div className="text-[11px] font-semibold text-emerald-300/80 mb-1.5 uppercase tracking-wider">
              Bowlers Squad List
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1 flex-1">
              {innings.bowling.map((b, i) => {
                const isLastBowler = i === innings.lastBowlerIdx;
                const completedOvers = Math.floor(b.totalBalls / 6);
                const isQuotaReached = maxBowl > 0 && completedOvers >= maxBowl;
                const isEligible = !isLastBowler && !isQuotaReached;
                const isSelected = selectedIdx === i;
                const economy = b.totalBalls > 0 ? ((b.runs / (b.totalBalls / 6))).toFixed(2) : '0.00';

                return (
                  <button
                    key={b.name}
                    type="button"
                    disabled={!isEligible}
                    onClick={() => setSelectedIdx(i)}
                    className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                      !isEligible
                        ? 'opacity-40 bg-[#0c241b] border-emerald-950 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-md'
                        : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs flex items-center gap-1.5 truncate">
                        <span>{b.name}</span>
                        {b.name === commonPlayer && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/30 text-amber-300 font-extrabold">
                            ★ Common
                          </span>
                        )}
                        {isLastBowler && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                            Last Bowler (Resting)
                          </span>
                        )}
                        {isQuotaReached && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold border border-red-500/40">
                            Quota Full ({maxBowl}/{maxBowl} ov)
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-950/80' : 'text-emerald-300/70'}`}>
                        {oversStr(b.totalBalls)} ov • {b.maidens}m • {b.runs}r • {b.wickets}w • Econ: {economy}
                        {maxBowl > 0 && (
                          <span className="ml-1 font-semibold">
                            (Quota: {oversStr(b.totalBalls)}/{maxBowl})
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && isEligible && (
                      <Check className="w-4 h-4 shrink-0 text-emerald-950" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={eligibleBowlers.length === 0}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md mt-3 disabled:opacity-50 transition-all shrink-0"
            >
              Confirm Bowler Selection
            </button>
          </form>
        )}

        {/* Tab Content: Full Bowling Scorecard */}
        {activeTab === 'scorecard' && (
          <div className="py-2.5 flex-1 overflow-y-auto max-h-72 pr-1 space-y-3">
            <div className="rounded-xl border border-emerald-900/60 overflow-hidden bg-[#0c241b]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#091a13] text-emerald-300/70 font-bold uppercase text-[9px] border-b border-emerald-900/60">
                  <tr>
                    <th className="py-2 px-2.5">Bowler</th>
                    <th className="py-2 px-1 text-right">O</th>
                    <th className="py-2 px-1 text-right">M</th>
                    <th className="py-2 px-1 text-right">R</th>
                    <th className="py-2 px-1 text-right">W</th>
                    <th className="py-2 px-1.5 text-right">Econ</th>
                    <th className="py-2 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/40">
                  {innings.bowling.map((b, idx) => {
                    const isLastBowler = idx === innings.lastBowlerIdx;
                    const completedOvers = Math.floor(b.totalBalls / 6);
                    const isQuotaReached = maxBowl > 0 && completedOvers >= maxBowl;
                    const isEligible = !isLastBowler && !isQuotaReached;
                    const econ = b.totalBalls > 0 ? ((b.runs / (b.totalBalls / 6))).toFixed(2) : '0.00';

                    return (
                      <tr key={b.name} className={`${isLastBowler ? 'bg-amber-950/20' : ''}`}>
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-emerald-100 flex items-center gap-1">
                            <span>{b.name}</span>
                            {isLastBowler && (
                              <span className="text-[9px] text-amber-300 font-semibold">(last)</span>
                            )}
                          </div>
                          <div className="text-[9px] text-emerald-300/60">
                            {maxBowl > 0 ? `${oversStr(b.totalBalls)}/${maxBowl} ov` : `${oversStr(b.totalBalls)} ov`}
                          </div>
                        </td>
                        <td className="py-2 px-1 text-right font-bold text-white tabular-nums">{oversStr(b.totalBalls)}</td>
                        <td className="py-2 px-1 text-right text-emerald-300/80 tabular-nums">{b.maidens}</td>
                        <td className="py-2 px-1 text-right text-emerald-300/70 tabular-nums">{b.runs}</td>
                        <td className="py-2 px-1 text-right font-black text-amber-300 tabular-nums">{b.wickets}</td>
                        <td className="py-2 px-1.5 text-right text-emerald-200 tabular-nums">{econ}</td>
                        <td className="py-2 px-2 text-center">
                          {isEligible ? (
                            <button
                              type="button"
                              onClick={() => handleDirectSelect(idx)}
                              className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-[10px] transition-all shadow-sm"
                            >
                              Pick
                            </button>
                          ) : (
                            <span className="text-[9px] text-emerald-500/40">
                              {isLastBowler ? 'Rest' : 'Max'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bowling condition reminders */}
            <div className="p-2.5 rounded-xl bg-[#0c241b] border border-emerald-900/60 text-[10px] space-y-1 text-emerald-300/80">
              <div className="font-bold text-emerald-200 uppercase text-[9px]">Bowler Rules:</div>
              <ul className="list-disc list-inside space-y-0.5 text-emerald-300/70">
                <li>A bowler cannot bowl two consecutive overs from both ends.</li>
                {maxBowl > 0 && <li>Maximum allowed quota per bowler in this match is {maxBowl} overs.</li>}
                <li>Click &quot;Pick&quot; to assign any eligible bowler directly.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
