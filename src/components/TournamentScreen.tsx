import React, { useState } from 'react';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  Table, 
  Flame, 
  Play, 
  CheckCircle2, 
  Medal, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';
import { Tournament, TournamentFixture, MatchHistoryEntry } from '../types';
import { calculatePointsTable, calculateTournamentLeaders, createNewTournament } from '../utils/tournamentEngine';
import { SAMPLE_TEAMS } from '../data/defaultSquad';
import { audioHaptics } from '../utils/audioHaptics';

interface TournamentScreenProps {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  onSelectTournament: (id: string) => void;
  onCreateTournament: (tourn: Tournament) => void;
  onLaunchFixtureMatch: (fixture: TournamentFixture, tournament: Tournament) => void;
  history: MatchHistoryEntry[];
  isScorer: boolean;
}

export const TournamentScreen: React.FC<TournamentScreenProps> = ({
  tournaments,
  activeTournamentId,
  onSelectTournament,
  onCreateTournament,
  onLaunchFixtureMatch,
  history,
  isScorer
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures' | 'knockout' | 'leaders'>('table');
  const [isCreating, setIsCreating] = useState<boolean>(tournaments.length === 0);

  // New Tournament Form State
  const [tournName, setTournName] = useState<string>('Turf Premier League');
  const [overs, setOvers] = useState<number>(6);
  const [maxBowl, setMaxBowl] = useState<number>(2);

  const activeTourn = tournaments.find(t => t.id === activeTournamentId) || tournaments[0] || null;

  const pointsTable = activeTourn ? calculatePointsTable(activeTourn, history) : [];
  const leaders = activeTourn ? calculateTournamentLeaders(activeTourn, history) : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    audioHaptics.tapFeedback();
    const newTourn = createNewTournament(tournName, overs, maxBowl, SAMPLE_TEAMS, 'round-robin');
    onCreateTournament(newTourn);
    onSelectTournament(newTourn.id);
    setIsCreating(false);
  };

  return (
    <div className="max-w-md mx-auto py-4 px-3 space-y-4">
      {/* Tournament Selector / Header */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#0f281e] border border-emerald-900/60">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-emerald-100 font-display truncate max-w-[180px]">
              {activeTourn?.name || 'Tournament Hub'}
            </h2>
            <span className="text-[10px] text-emerald-400/80 uppercase font-bold">
              {activeTourn ? `${activeTourn.teams.length} Teams • ${activeTourn.oversPerMatch} Overs` : 'Create League'}
            </span>
          </div>
        </div>

        {isScorer && (
          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              setIsCreating(!isCreating);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-1 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? 'View' : 'New League'}</span>
          </button>
        )}
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <div className="p-5 rounded-3xl bg-[#122c23] border border-emerald-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-900/60">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-emerald-100 font-display">
              Create New Turf Tournament
            </h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-emerald-300/80 mb-1">Tournament Name</label>
              <input
                type="text"
                value={tournName}
                onChange={e => setTournName(e.target.value)}
                placeholder="e.g. Summer Turf Cup 2026"
                className="w-full px-3 py-2.5 rounded-xl bg-[#183a2f] border border-emerald-800 text-emerald-100 font-bold focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-emerald-300/80 mb-1">Overs / Match</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={overs}
                  onChange={e => setOvers(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#183a2f] border border-emerald-800 text-emerald-100 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-emerald-300/80 mb-1">Max Over/Bowler</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={maxBowl}
                  onChange={e => setMaxBowl(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#183a2f] border border-emerald-800 text-emerald-100 font-bold"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0d2118] border border-emerald-900/40 space-y-1">
              <span className="font-bold text-emerald-300/90 block">Default 4-Team Round Robin Setup:</span>
              <p className="text-[11px] text-emerald-300/60 leading-tight">
                Includes Turf Titans, Royal Strikers, Thunder Bolts, and Shadow Warriors with automated round-robin fixtures and Knockout Playoffs.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
            >
              <span>Generate Tournament & Fixtures</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Sub Navigation Tabs */}
      {activeTourn && (
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#0c231a] border border-emerald-900/60">
          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              setActiveTab('table');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
              activeTab === 'table' ? 'bg-emerald-500 text-emerald-950 font-black shadow-md' : 'text-emerald-300/70 hover:bg-[#143427]'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>

          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              setActiveTab('fixtures');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
              activeTab === 'fixtures' ? 'bg-emerald-500 text-emerald-950 font-black shadow-md' : 'text-emerald-300/70 hover:bg-[#143427]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Fixtures</span>
          </button>

          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              setActiveTab('knockout');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
              activeTab === 'knockout' ? 'bg-emerald-500 text-emerald-950 font-black shadow-md' : 'text-emerald-300/70 hover:bg-[#143427]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Playoffs</span>
          </button>

          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              setActiveTab('leaders');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
              activeTab === 'leaders' ? 'bg-emerald-500 text-emerald-950 font-black shadow-md' : 'text-emerald-300/70 hover:bg-[#143427]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Caps</span>
          </button>
        </div>
      )}

      {/* Tab 1: Points Table */}
      {activeTourn && activeTab === 'table' && (
        <div className="p-3 sm:p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
            <h3 className="font-extrabold text-xs text-emerald-200 uppercase tracking-wider">
              Official Points Table & NRR
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold">2 pts for Win</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-900/60 text-emerald-300/60 text-[10px] uppercase font-bold">
                  <th className="pb-1.5"># Team</th>
                  <th className="pb-1.5 text-center">P</th>
                  <th className="pb-1.5 text-center">W</th>
                  <th className="pb-1.5 text-center">L</th>
                  <th className="pb-1.5 text-center">Pts</th>
                  <th className="pb-1.5 text-right">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60">
                {pointsTable.map((row, idx) => (
                  <tr key={row.teamId} className="hover:bg-emerald-950/30">
                    <td className="py-2.5 flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        idx < 2 ? 'bg-emerald-500 text-emerald-950' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-emerald-100 truncate">{row.teamName}</span>
                    </td>
                    <td className="py-2.5 text-center font-semibold text-emerald-200/80">{row.played}</td>
                    <td className="py-2.5 text-center font-bold text-emerald-400">{row.won}</td>
                    <td className="py-2.5 text-center text-red-400/80">{row.lost}</td>
                    <td className="py-2.5 text-center font-black text-white text-sm">{row.points}</td>
                    <td className={`py-2.5 text-right font-mono font-bold ${
                      row.nrr > 0 ? 'text-emerald-400' : row.nrr < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {row.nrr > 0 ? `+${row.nrr.toFixed(3)}` : row.nrr.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-emerald-300/60">
            <span>• Top 2 qualify for Playoffs</span>
            <span>• NRR = Run Rate For - Run Rate Against</span>
          </div>
        </div>
      )}

      {/* Tab 2: Fixtures & Matches */}
      {activeTourn && activeTab === 'fixtures' && (
        <div className="space-y-2">
          {activeTourn.fixtures.map((fix) => {
            const isCompleted = fix.status === 'completed';
            return (
              <div
                key={fix.id}
                className="p-3.5 rounded-2xl bg-[#0f281e] border border-emerald-900/60 space-y-2 hover:border-emerald-700/60 transition-all"
              >
                <div className="flex items-center justify-between text-[11px] text-emerald-300/70">
                  <span className="font-bold uppercase tracking-wider">
                    Match #{fix.matchNumber} • {fix.stage.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isCompleted ? 'Finished' : 'Upcoming'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm font-extrabold text-white">
                  <span>{fix.teamAName}</span>
                  <span className="text-xs text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded-md">VS</span>
                  <span>{fix.teamBName}</span>
                </div>

                {fix.summary && (
                  <div className="text-xs text-emerald-400 font-bold pt-1 border-t border-emerald-900/40">
                    🏆 {fix.summary}
                  </div>
                )}

                {/* Scorer Match Launcher */}
                {!isCompleted && isScorer && (
                  <button
                    onClick={() => {
                      audioHaptics.tapFeedback();
                      onLaunchFixtureMatch(fix, activeTourn);
                    }}
                    className="w-full mt-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Score This Match</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Knockout Playoffs */}
      {activeTourn && activeTab === 'knockout' && (
        <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-4">
          <div className="pb-2 border-b border-emerald-900/60">
            <h3 className="font-extrabold text-xs text-emerald-200 uppercase tracking-wider">
              Playoff & Championship Tree
            </h3>
          </div>

          <div className="space-y-3">
            {/* Semi Finals */}
            <div className="space-y-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Semi-Finals</span>
              <div className="p-3 rounded-xl bg-[#143427] border border-emerald-800/60 text-xs">
                <div className="font-bold text-emerald-100 flex justify-between">
                  <span>Rank 1 ({pointsTable[0]?.teamName || 'TBD'})</span>
                  <span className="text-emerald-400">vs</span>
                  <span>Rank 4 ({pointsTable[3]?.teamName || 'TBD'})</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#143427] border border-emerald-800/60 text-xs">
                <div className="font-bold text-emerald-100 flex justify-between">
                  <span>Rank 2 ({pointsTable[1]?.teamName || 'TBD'})</span>
                  <span className="text-emerald-400">vs</span>
                  <span>Rank 3 ({pointsTable[2]?.teamName || 'TBD'})</span>
                </div>
              </div>
            </div>

            {/* Grand Final */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-center space-y-2">
              <span className="text-xs font-black text-amber-300 uppercase tracking-widest block">
                👑 GRAND FINAL
              </span>
              <div className="text-sm font-extrabold text-white">
                Winner Semi 1 vs Winner Semi 2
              </div>
              <p className="text-[11px] text-emerald-200/70">
                Champion wins the CricVault League Trophy & Golden Bat!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tournament Caps & Leaderboards */}
      {activeTourn && activeTab === 'leaders' && leaders && (
        <div className="space-y-3">
          {/* Orange Cap (Most Runs) */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#422006] to-[#1a2e22] border border-amber-500/40 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-amber-950 font-black flex items-center justify-center text-xs">
                🧢
              </div>
              <div>
                <h4 className="font-black text-xs text-amber-300 uppercase tracking-wider font-display">
                  Orange Cap • Most Runs
                </h4>
                <span className="text-[10px] text-amber-200/60">Top tournament run-getters</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {leaders.orangeCap.length === 0 ? (
                <p className="text-xs text-emerald-300/60 italic">No tournament match stats recorded yet.</p>
              ) : (
                leaders.orangeCap.map((b, idx) => (
                  <div key={b.name} className="flex items-center justify-between p-2 rounded-xl bg-[#122a1f]/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400">#{idx + 1}</span>
                      <strong className="text-white">{b.name}</strong>
                      <span className="text-[10px] text-emerald-300/60 font-medium">({b.team})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-amber-400 text-sm">{b.runs} runs</span>
                      <span className="text-[10px] text-emerald-300/60 block">SR {b.sr} • 6s: {b.sixes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Purple Cap (Most Wickets) */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#2e1065] to-[#122e23] border border-purple-500/40 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500 text-purple-950 font-black flex items-center justify-center text-xs">
                🎳
              </div>
              <div>
                <h4 className="font-black text-xs text-purple-300 uppercase tracking-wider font-display">
                  Purple Cap • Most Wickets
                </h4>
                <span className="text-[10px] text-purple-200/60">Top tournament wicket-takers</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {leaders.purpleCap.length === 0 ? (
                <p className="text-xs text-emerald-300/60 italic">No bowling figures recorded yet.</p>
              ) : (
                leaders.purpleCap.map((bw, idx) => (
                  <div key={bw.name} className="flex items-center justify-between p-2 rounded-xl bg-[#122a1f]/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-400">#{idx + 1}</span>
                      <strong className="text-white">{bw.name}</strong>
                      <span className="text-[10px] text-emerald-300/60 font-medium">({bw.team})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-purple-300 text-sm">{bw.wickets} wkts</span>
                      <span className="text-[10px] text-emerald-300/60 block">Econ {bw.econ}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
