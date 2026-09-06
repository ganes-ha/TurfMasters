import React, { useState } from 'react';
import { X, UserCheck, ShieldAlert, FileText, Users, Target, Activity } from 'lucide-react';
import { Match, Innings } from '../types';
import { oversStr } from '../utils/cricketRules';
import { audioHaptics } from '../utils/audioHaptics';

interface SelectBatsmanModalProps {
  innings: Innings;
  match?: Match | null;
  targetRole: 'striker' | 'nonstriker' | 'new_batter';
  commonPlayer: string | null;
  onClose: () => void;
  onSelectBatter: (batterIndex: number) => void;
}

export const SelectBatsmanModal: React.FC<SelectBatsmanModalProps> = ({
  innings,
  match,
  targetRole,
  commonPlayer,
  onClose,
  onSelectBatter
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'scorecard'>('select');

  // Available batters who are not currently on strike or non-striker, and not out
  const currentStrikerIdx = innings.strikerIdx;
  const currentNonStrikerIdx = innings.nonStrikerIdx;
  const striker = currentStrikerIdx >= 0 ? innings.batting[currentStrikerIdx] : null;
  const nonStriker = currentNonStrikerIdx >= 0 ? innings.batting[currentNonStrikerIdx] : null;

  const strikerIsOut = striker?.out ?? false;
  const nonStrikerIsOut = nonStriker?.out ?? false;

  // Partner who remains active at crease
  const activePartner = strikerIsOut ? nonStriker : (nonStrikerIsOut ? striker : null);

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

  const handleDirectSelect = (batterIdx: number) => {
    audioHaptics.tapFeedback();
    onSelectBatter(batterIdx);
    onClose();
  };

  const titles = {
    striker: 'Select Striker Batsman',
    nonstriker: 'Select Non-Striker Batsman',
    new_batter: 'Select Next Batsman (In-Coming)'
  };

  // Match & Scorecard calculations
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

  const target = match && match.innings === 2 && match.inn1 ? match.inn1.total + 1 : null;
  const needed = (target !== null) ? Math.max(0, target - innings.total) : null;
  const maxBalls = match ? match.overs * 6 : 0;
  const ballsLeft = maxBalls > 0 ? Math.max(0, maxBalls - innings.legalBalls) : null;
  const crr = innings.legalBalls > 0 ? ((innings.total / innings.legalBalls) * 6).toFixed(2) : '0.00';
  const rrr = (needed !== null && ballsLeft !== null && ballsLeft > 0)
    ? ((needed / ballsLeft) * 6).toFixed(2)
    : null;

  const latestWicket = innings.fallOfWickets.length > 0
    ? innings.fallOfWickets[innings.fallOfWickets.length - 1]
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-emerald-900/60 shrink-0">
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">
              {titles[targetRole]}
            </h3>
            <p className="text-xs text-emerald-300/70">
              {targetRole === 'new_batter' ? 'Wicket fallen • Choose incoming batsman' : 'Choose squad batsman to take position'}
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

          {/* Active Partner at Crease & Latest Dismissal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
            {activePartner && (
              <div className="p-1.5 rounded-lg bg-[#0d2b1f] border border-emerald-900/60 flex items-center justify-between">
                <span className="text-emerald-300/80 font-medium">Partner:</span>
                <span className="font-bold text-emerald-100 truncate ml-1">
                  {activePartner.name} <span className="text-amber-300 font-black">{activePartner.runs}*</span>
                  <span className="text-[10px] text-emerald-300/60 font-normal"> ({activePartner.balls}b)</span>
                </span>
              </div>
            )}

            {latestWicket && targetRole === 'new_batter' && (
              <div className="p-1.5 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-between">
                <span className="text-red-300 font-medium text-[10px]">Wkt #{latestWicket.wicket}:</span>
                <span className="font-semibold text-red-200 text-[10px] truncate ml-1">
                  {latestWicket.batsman} ({latestWicket.score}/{latestWicket.wicket} in {latestWicket.overs} ov)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View Toggle: Selection List vs Full Scorecard */}
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
            <span>Select Batter ({eligibleBatters.length})</span>
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
            <span>Innings Scorecard</span>
          </button>
        </div>

        {/* Tab Content: Selection List */}
        {activeTab === 'select' && (
          <form onSubmit={handleConfirm} className="py-2.5 flex-1 flex flex-col overflow-hidden">
            <div className="text-[11px] font-semibold text-emerald-300/80 mb-1.5 uppercase tracking-wider">
              Available Squad Batters
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1 flex-1">
              {eligibleBatters.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0c241b] border border-emerald-900/60 text-center text-xs text-emerald-300/60 italic">
                  No eligible batsman available in the squad.
                </div>
              ) : (
                eligibleBatters.map((b) => {
                  const strikeRate = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                  const isSelected = selectedIdx === b.idx;
                  return (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => setSelectedIdx(b.idx)}
                      className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                        isSelected
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
                          {b.retired && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-semibold">
                              (Retired)
                            </span>
                          )}
                          {b.balls === 0 && !b.retired && (
                            <span className={`text-[9px] px-1 rounded font-medium ${isSelected ? 'bg-emerald-950/20 text-emerald-950' : 'bg-emerald-900/40 text-emerald-300/70'}`}>
                              Yet to bat
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-950/80' : 'text-emerald-300/70'}`}>
                          {b.runs} runs ({b.balls} balls) • 4s: {b.fours} • 6s: {b.sixes} • SR: {strikeRate}
                        </div>
                      </div>
                      {isSelected ? (
                        <UserCheck className="w-4 h-4 shrink-0 text-emerald-950" />
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400/80 shrink-0 uppercase tracking-wide">
                          Select
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="submit"
              disabled={eligibleBatters.length === 0}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md mt-3 disabled:opacity-50 transition-all shrink-0"
            >
              Confirm Batsman Selection
            </button>
          </form>
        )}

        {/* Tab Content: Full Batting Scorecard */}
        {activeTab === 'scorecard' && (
          <div className="py-2.5 flex-1 overflow-y-auto max-h-72 pr-1 space-y-3">
            <div className="rounded-xl border border-emerald-900/60 overflow-hidden bg-[#0c241b]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#091a13] text-emerald-300/70 font-bold uppercase text-[9px] border-b border-emerald-900/60">
                  <tr>
                    <th className="py-2 px-2.5">Batter</th>
                    <th className="py-2 px-1 text-right">R</th>
                    <th className="py-2 px-1 text-right">B</th>
                    <th className="py-2 px-1 text-right">4s</th>
                    <th className="py-2 px-1 text-right">6s</th>
                    <th className="py-2 px-1.5 text-right">SR</th>
                    <th className="py-2 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/40">
                  {innings.batting.map((b, idx) => {
                    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                    const isCrease = idx === currentStrikerIdx || idx === currentNonStrikerIdx;
                    const isEligible = eligibleBatters.some(e => e.idx === idx);

                    let statusText = 'yet to bat';
                    if (b.out) statusText = b.howOut || 'out';
                    else if (b.retired) statusText = 'retired hurt';
                    else if (isCrease) statusText = 'batting *';

                    return (
                      <tr key={b.name} className={`${isCrease ? 'bg-emerald-950/40' : ''}`}>
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-emerald-100 flex items-center gap-1">
                            <span>{b.name}</span>
                            {isCrease && <span className="text-[10px] text-amber-300 font-extrabold">*</span>}
                          </div>
                          <div className="text-[9px] text-emerald-300/60 truncate max-w-[120px]">
                            {statusText}
                          </div>
                        </td>
                        <td className="py-2 px-1 text-right font-black text-white tabular-nums">{b.runs}</td>
                        <td className="py-2 px-1 text-right text-emerald-300/80 tabular-nums">{b.balls}</td>
                        <td className="py-2 px-1 text-right text-emerald-300/70 tabular-nums">{b.fours}</td>
                        <td className="py-2 px-1 text-right text-emerald-300/70 tabular-nums">{b.sixes}</td>
                        <td className="py-2 px-1.5 text-right text-emerald-200 tabular-nums">{sr}</td>
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
                            <span className="text-[9px] text-emerald-500/40">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Extras and Fall of Wickets Summary */}
            <div className="space-y-1.5 text-[10px]">
              <div className="p-2 rounded-xl bg-[#0c241b] border border-emerald-900/60 flex items-center justify-between text-emerald-300">
                <span className="font-bold">Extras:</span>
                <span>
                  b {innings.extras.byes}, lb {innings.extras.legbyes}, w {innings.extras.wides}, nb {innings.extras.noballs} •{' '}
                  <strong className="text-white font-black">{innings.extras.total}</strong>
                </span>
              </div>

              {innings.fallOfWickets.length > 0 && (
                <div className="p-2 rounded-xl bg-[#0c241b] border border-emerald-900/60">
                  <div className="font-bold text-emerald-300 mb-1 uppercase text-[9px]">Fall of Wickets:</div>
                  <div className="flex flex-wrap gap-1">
                    {innings.fallOfWickets.map(f => (
                      <span key={f.wicket} className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-200 text-[9px]">
                        {f.score}/{f.wicket} ({f.batsman}, {f.overs} ov)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
