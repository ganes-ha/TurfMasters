import React, { useState, useMemo } from 'react';
import { 
  User, 
  Swords, 
  Award, 
  Flame, 
  ShieldCheck, 
  Target, 
  Zap, 
  Activity 
} from 'lucide-react';
import { MatchHistoryEntry } from '../types';
import { aggregateCareerStats, aggregateHeadToHead, BADGE_DEFS, oversStr } from '../utils/cricketRules';
import { audioHaptics } from '../utils/audioHaptics';

interface StatsScreenProps {
  players: string[];
  history: MatchHistoryEntry[];
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ players, history }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'h2h'>('profile');
  const [selectedPlayer, setSelectedPlayer] = useState<string>(players[0] || '');

  // Head-to-Head selectors
  const [h2hBatter, setH2hBatter] = useState<string>(players[0] || '');
  const [h2hBowler, setH2hBowler] = useState<string>(players[1] || players[0] || '');

  const career = useMemo(() => {
    return selectedPlayer ? aggregateCareerStats(selectedPlayer, history) : null;
  }, [selectedPlayer, history]);

  const h2h = useMemo(() => {
    return (h2hBatter && h2hBowler) ? aggregateHeadToHead(h2hBatter, h2hBowler, history) : null;
  }, [h2hBatter, h2hBowler, history]);

  const earnedBadges = useMemo(() => {
    return career ? BADGE_DEFS.filter(b => b.check(career)) : [];
  }, [career]);

  const lockedBadges = useMemo(() => {
    return career ? BADGE_DEFS.filter(b => !b.check(career)) : BADGE_DEFS;
  }, [career]);

  // Head to Head verdict
  const getH2HVerdict = () => {
    if (!h2h || h2h.ballsFaced === 0) return 'No Matchup Data';
    if (h2h.dismissals >= 2 && h2h.strikeRate < 110) return `⚡ ${h2h.bowlerName} Dominates with ${h2h.dismissals} Wickets`;
    if (h2h.strikeRate >= 160 && h2h.dismissals === 0) return `🔥 ${h2h.batterName} Dominates (SR ${h2h.strikeRate})`;
    return '⚔️ Balanced Rivalry';
  };

  return (
    <div className="max-w-md mx-auto py-4 px-3 space-y-4">
      {/* Top Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0c231a] border border-emerald-900/60">
        <button
          onClick={() => {
            audioHaptics.tapFeedback();
            setActiveTab('profile');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'profile'
              ? 'bg-emerald-500 text-emerald-950 shadow-md'
              : 'text-emerald-300/70 hover:bg-[#143427]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Player Career</span>
        </button>

        <button
          onClick={() => {
            audioHaptics.tapFeedback();
            setActiveTab('h2h');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'h2h'
              ? 'bg-emerald-500 text-emerald-950 shadow-md'
              : 'text-emerald-300/70 hover:bg-[#143427]'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Head-to-Head Rivalry</span>
        </button>
      </div>

      {/* TAB 1: PLAYER CAREER & ACHIEVEMENTS */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {/* Player Dropdown */}
          <div className="p-3.5 rounded-2xl bg-[#0f281e] border border-emerald-900/60">
            <label className="block text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1.5">
              Select Squad Player
            </label>
            <select
              value={selectedPlayer}
              onChange={e => setSelectedPlayer(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#143527] border border-emerald-800 text-emerald-100 font-bold text-sm focus:outline-none focus:border-emerald-400"
            >
              {players.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {career && (
            <>
              {/* Profile Avatar Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-b from-[#143d2c] to-[#0a2318] border border-emerald-700/60 text-center shadow-xl relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-emerald-400 text-emerald-950 font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-950/60">
                  {selectedPlayer.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-extrabold text-xl text-white font-display">{selectedPlayer}</h3>
                <div className="text-xs text-emerald-300/70 mt-0.5">
                  {career.matches} Match{career.matches !== 1 ? 'es' : ''} Played • {earnedBadges.length} Badges Unlocked
                </div>

                {/* MVP & Honors Pills */}
                <div className="flex justify-center gap-2 mt-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    👑 {career.awards.mom} MVPs
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                    🏏 {career.awards.bestBat} Best Bat
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    🎳 {career.awards.bestBowl} Best Bowl
                  </span>
                </div>
              </div>

              {/* Batting Career Grid */}
              <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-2.5">
                <h4 className="font-extrabold text-xs text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🏏 Batting Career Statistics</span>
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-black text-base text-white">{career.bat.runs}</div>
                    <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Runs</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-black text-base text-emerald-400">{career.bat.sr}</div>
                    <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Strike Rate</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-black text-base text-white">{career.bat.avg}</div>
                    <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Average</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-black text-base text-amber-400">{career.bat.highScore}{career.bat.highScoreNotOut ? '*' : ''}</div>
                    <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">High Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-bold text-sm text-emerald-100">{career.bat.innings}</div>
                    <div className="text-[9px] text-emerald-300/60 uppercase">Innings</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-bold text-sm text-emerald-100">{career.bat.fifties}</div>
                    <div className="text-[9px] text-emerald-300/60 uppercase">50s</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-bold text-sm text-emerald-100">{career.bat.fours}</div>
                    <div className="text-[9px] text-emerald-300/60 uppercase">4s</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-bold text-sm text-purple-300">{career.bat.sixes}</div>
                    <div className="text-[9px] text-emerald-300/60 uppercase">6s</div>
                  </div>
                </div>
              </div>

              {/* Bowling Career Grid */}
              <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-2.5">
                <h4 className="font-extrabold text-xs text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎳 Bowling Career Statistics</span>
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-black text-base text-purple-400">{career.bowl.wickets}</div>
                    <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Wickets</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-black text-base text-white">{career.bowl.economy > 0 ? career.bowl.economy : '—'}</div>
                    <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Economy</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-black text-base text-white">{career.bowl.bestRuns === 999 ? '—' : `${career.bowl.bestWickets}/${career.bowl.bestRuns}`}</div>
                    <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Best Figures</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#143427] text-center border border-emerald-900/40">
                    <div className="font-black text-base text-emerald-400">{oversStr(career.bowl.balls)}</div>
                    <div className="text-[10px] text-emerald-300/70 font-semibold uppercase">Overs</div>
                  </div>
                </div>
              </div>

              {/* Achievements & Badges */}
              <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-900/60">
                  <h4 className="font-extrabold text-xs text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Achievements ({earnedBadges.length}/{BADGE_DEFS.length})</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {earnedBadges.map(b => (
                    <div key={b.id} className="p-2.5 rounded-2xl bg-[#153a2b] border border-emerald-600/50 flex items-center gap-3">
                      <div className="text-2xl w-9 text-center shrink-0">{b.icon}</div>
                      <div>
                        <div className="font-extrabold text-xs text-white">{b.name}</div>
                        <div className="text-[11px] text-emerald-300/70">{b.desc}</div>
                      </div>
                    </div>
                  ))}

                  {lockedBadges.map(b => (
                    <div key={b.id} className="p-2.5 rounded-2xl bg-[#10251c] border border-emerald-950 opacity-40 flex items-center gap-3">
                      <div className="text-2xl w-9 text-center shrink-0 grayscale">{b.icon}</div>
                      <div>
                        <div className="font-bold text-xs text-emerald-200">{b.name} (Locked)</div>
                        <div className="text-[11px] text-emerald-400/60">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: HEAD-TO-HEAD RIVALRY SIMULATOR */}
      {activeTab === 'h2h' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-900/60">
              <Swords className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-xs text-emerald-100 uppercase tracking-wider font-display">
                Head-to-Head Batter vs Bowler
              </h3>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-semibold text-emerald-300/80 mb-1">🏏 Batter</label>
                <select
                  value={h2hBatter}
                  onChange={e => setH2hBatter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#143527] border border-emerald-800 text-emerald-100 font-bold"
                >
                  {players.map(p => (
                    <option key={`bat_${p}`} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-emerald-300/80 mb-1">🎳 Bowler</label>
                <select
                  value={h2hBowler}
                  onChange={e => setH2hBowler(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#143527] border border-emerald-800 text-emerald-100 font-bold"
                >
                  {players.map(p => (
                    <option key={`bowl_${p}`} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* H2H Analytics Dashboard */}
          {h2h && (
            <div className="p-5 rounded-3xl bg-gradient-to-b from-[#133a29] to-[#0a2016] border border-emerald-700/60 shadow-xl space-y-4">
              {/* Verdict Banner */}
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-center">
                <span className="font-extrabold text-xs text-amber-300 font-display">
                  {getH2HVerdict()}
                </span>
              </div>

              {/* Head to Head Numbers */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-[#143828] border border-emerald-900/60">
                  <div className="font-black text-xl text-white">{h2h.runsScored}</div>
                  <div className="text-[10px] text-emerald-300/70 uppercase font-bold mt-0.5">Runs Scored</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#143828] border border-emerald-900/60">
                  <div className="font-black text-xl text-emerald-400">{h2h.ballsFaced}</div>
                  <div className="text-[10px] text-emerald-300/70 uppercase font-bold mt-0.5">Balls Faced</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#143828] border border-emerald-900/60">
                  <div className="font-black text-xl text-red-400">{h2h.dismissals}</div>
                  <div className="text-[10px] text-emerald-300/70 uppercase font-bold mt-0.5">Dismissals</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-2xl bg-[#143828] border border-emerald-900/60">
                  <div className="font-bold text-sm text-emerald-200">{h2h.strikeRate}</div>
                  <div className="text-[9px] text-emerald-300/60 uppercase">Strike Rate</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#143828] border border-emerald-900/60">
                  <div className="font-bold text-sm text-emerald-200">4s: {h2h.fours} • 6s: {h2h.sixes}</div>
                  <div className="text-[9px] text-emerald-300/60 uppercase">Boundaries</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#143828] border border-emerald-900/60">
                  <div className="font-bold text-sm text-emerald-200">{h2h.dotPercentage}%</div>
                  <div className="text-[9px] text-emerald-300/60 uppercase">Dot Ball %</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
