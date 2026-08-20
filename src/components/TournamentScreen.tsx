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
  ChevronRight,
  Sparkles,
  Trash2,
  Swords,
  RefreshCw,
  Crown,
  Layers
} from 'lucide-react';
import { Tournament, TournamentFixture, MatchHistoryEntry } from '../types';
import { 
  calculatePointsTable, 
  calculateTournamentLeaders, 
  resolvePlayoffMatchups,
  PLAYOFF_OPTIONS
} from '../utils/tournamentEngine';
import { CreateTournamentModal } from './CreateTournamentModal';
import { AddFixtureModal } from './AddFixtureModal';
import { audioHaptics } from '../utils/audioHaptics';

interface TournamentScreenProps {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  onSelectTournament: (id: string) => void;
  onCreateTournament: (tourn: Tournament) => void;
  onUpdateTournament?: (tourn: Tournament) => void;
  onDeleteTournament?: (id: string) => void;
  onLaunchFixtureMatch: (fixture: TournamentFixture, tournament: Tournament) => void;
  history: MatchHistoryEntry[];
  players?: string[];
  isScorer: boolean;
}

export const TournamentScreen: React.FC<TournamentScreenProps> = ({
  tournaments,
  activeTournamentId,
  onSelectTournament,
  onCreateTournament,
  onUpdateTournament,
  onDeleteTournament,
  onLaunchFixtureMatch,
  history,
  players = [],
  isScorer
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures' | 'knockout' | 'leaders'>('table');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(tournaments.length === 0);
  const [isAddFixtureModalOpen, setIsAddFixtureModalOpen] = useState<boolean>(false);
  const [fixtureFilter, setFixtureFilter] = useState<'all' | 'group' | 'playoff' | 'upcoming' | 'completed'>('all');

  const activeTourn = tournaments.find(t => t.id === activeTournamentId) || tournaments[0] || null;

  const pointsTable = activeTourn ? calculatePointsTable(activeTourn, history) : [];
  const leaders = activeTourn ? calculateTournamentLeaders(activeTourn, history) : null;

  // Resolve playoff matchups dynamically
  const resolvedPlayoffFixtures = activeTourn 
    ? resolvePlayoffMatchups(activeTourn, pointsTable)
    : [];

  const handleSyncPlayoffMatchups = () => {
    if (!activeTourn || !onUpdateTournament) return;
    audioHaptics.tapFeedback();
    const updated = {
      ...activeTourn,
      fixtures: resolvedPlayoffFixtures
    };
    onUpdateTournament(updated);
  };

  const handleAddCustomFixture = (newFixture: TournamentFixture) => {
    if (!activeTourn || !onUpdateTournament) return;
    const updated: Tournament = {
      ...activeTourn,
      fixtures: [...activeTourn.fixtures, newFixture]
    };
    onUpdateTournament(updated);
  };

  const handleDeleteFixture = (fixtureId: string) => {
    if (!activeTourn || !onUpdateTournament) return;
    if (!window.confirm('Delete this scheduled fixture?')) return;
    audioHaptics.tapFeedback();
    const updated: Tournament = {
      ...activeTourn,
      fixtures: activeTourn.fixtures.filter(f => f.id !== fixtureId)
    };
    onUpdateTournament(updated);
  };

  // Find if Grand Final is completed to celebrate champion
  const finalFixture = activeTourn?.fixtures.find(f => f.stage === 'final');
  const isFinalCompleted = finalFixture?.status === 'completed';
  const championTeam = isFinalCompleted && finalFixture?.winnerTeamId
    ? activeTourn?.teams.find(t => t.id === finalFixture.winnerTeamId)
    : null;

  // Filtered Fixtures
  const filteredFixtures = (activeTourn?.fixtures || []).filter(f => {
    if (fixtureFilter === 'group') return f.stage === 'group';
    if (fixtureFilter === 'playoff') return f.isPlayoff || f.stage !== 'group';
    if (fixtureFilter === 'upcoming') return f.status !== 'completed';
    if (fixtureFilter === 'completed') return f.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-md mx-auto py-3 px-3 space-y-3.5">
      {/* Tournament Selector & Management Bar */}
      <div className="p-3.5 rounded-3xl bg-[#0f281e] border border-emerald-900/60 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              {tournaments.length > 1 ? (
                <select
                  value={activeTourn?.id || ''}
                  onChange={e => onSelectTournament(e.target.value)}
                  className="bg-[#143427] text-emerald-100 font-extrabold text-xs px-2.5 py-1 rounded-xl border border-emerald-700 max-w-[180px] truncate"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <h2 className="font-extrabold text-sm text-emerald-100 font-display truncate">
                  {activeTourn?.name || 'Tournament Hub'}
                </h2>
              )}
              <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                {activeTourn ? `${activeTourn.teams.length} Teams • ${activeTourn.oversPerMatch} Overs • ${PLAYOFF_OPTIONS.find(p => p.id === activeTourn.playoffFormat)?.label || 'League'}` : 'No active tournament'}
              </span>
            </div>
          </div>

          {isScorer && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  audioHaptics.tapFeedback();
                  setIsCreateModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-950/60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Tournament</span>
              </button>

              {tournaments.length > 1 && activeTourn && onDeleteTournament && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete tournament "${activeTourn.name}"?`)) {
                      onDeleteTournament(activeTourn.id);
                    }
                  }}
                  title="Delete Tournament"
                  className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Champion Banner (If Tournament has concluded!) */}
      {championTeam && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-emerald-500/20 border-2 border-amber-400/60 shadow-xl text-center space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-amber-400 fill-current animate-bounce" />
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-widest font-display">
              TOURNAMENT CHAMPION
            </h3>
            <Crown className="w-6 h-6 text-amber-400 fill-current animate-bounce" />
          </div>
          <div className="text-lg font-black text-white flex items-center justify-center gap-2">
            <span
              className="w-4 h-4 rounded-full border border-white/30"
              style={{ backgroundColor: championTeam.color }}
            />
            <span>{championTeam.name}</span>
          </div>
          <p className="text-xs text-amber-200/80 font-medium">
            🏆 Winner of {activeTourn?.name} • Trophy & Golden Bat Holders!
          </p>
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
            <span>Standings</span>
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
            <span>Fixtures ({activeTourn.fixtures.length})</span>
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

      {/* TAB 1: Points Table & Standings */}
      {activeTourn && activeTab === 'table' && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
            <div>
              <h3 className="font-extrabold text-xs text-emerald-200 uppercase tracking-wider">
                Official Points Table & NRR
              </h3>
              <span className="text-[10px] text-emerald-400/80 font-medium">
                Win = {activeTourn.pointsForWin || 2} pts • Tie = {activeTourn.pointsForTie || 1} pt
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              {activeTourn.playoffFormat !== 'none' ? 'Playoff Race' : 'League Table'}
            </span>
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
                {pointsTable.map((row, idx) => {
                  const isTopQualifier = (activeTourn.playoffFormat === 'page-playoffs' || activeTourn.playoffFormat === 'semi-finals') && idx < 4;
                  const isDirectFinal = activeTourn.playoffFormat === 'top-2-final' && idx < 2;

                  return (
                    <tr 
                      key={row.teamId} 
                      className={`hover:bg-emerald-950/30 transition-colors ${
                        isTopQualifier || isDirectFinal ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          idx === 0 
                            ? 'bg-amber-400 text-emerald-950' 
                            : (idx < 4 && activeTourn.playoffFormat !== 'none' ? 'bg-emerald-500 text-emerald-950' : 'bg-emerald-950 text-emerald-400')
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                          />
                          <span className="font-bold text-emerald-100 truncate">{row.teamName}</span>
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-emerald-300/60">
            <span>• Qualification: {PLAYOFF_OPTIONS.find(p => p.id === activeTourn.playoffFormat)?.label}</span>
            <span>• ICC Standard NRR</span>
          </div>
        </div>
      )}

      {/* TAB 2: Fixtures & Match Scheduler */}
      {activeTourn && activeTab === 'fixtures' && (
        <div className="space-y-3">
          {/* Controls: Filter & Add Fixture */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-[#0c231a] p-1 rounded-xl border border-emerald-900/60">
              {(['all', 'group', 'playoff', 'upcoming', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFixtureFilter(f)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    fixtureFilter === f ? 'bg-emerald-500 text-emerald-950 font-black' : 'text-emerald-300/60 hover:bg-[#143427]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {isScorer && (
              <button
                onClick={() => {
                  audioHaptics.tapFeedback();
                  setIsAddFixtureModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-1 shadow-md shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Match</span>
              </button>
            )}
          </div>

          {/* Fixtures List */}
          <div className="space-y-2.5">
            {filteredFixtures.length === 0 ? (
              <div className="p-6 rounded-3xl bg-[#0f281e] border border-emerald-900/60 text-center space-y-2">
                <Calendar className="w-8 h-8 text-emerald-500/40 mx-auto" />
                <p className="text-xs text-emerald-300/70 font-semibold">
                  No fixtures matching current filter.
                </p>
                {isScorer && (
                  <button
                    onClick={() => setIsAddFixtureModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-emerald-950 font-bold text-xs"
                  >
                    Schedule Match Now
                  </button>
                )}
              </div>
            ) : (
              filteredFixtures.map(fix => {
                const isCompleted = fix.status === 'completed';
                const teamA = activeTourn.teams.find(t => t.id === fix.teamAId);
                const teamB = activeTourn.teams.find(t => t.id === fix.teamBId);

                return (
                  <div
                    key={fix.id}
                    className="p-3.5 rounded-2xl bg-[#0f281e] border border-emerald-900/60 space-y-2 hover:border-emerald-700/60 transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between text-[11px] text-emerald-300/70">
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-amber-400 font-extrabold">#{fix.matchNumber}</span>
                        <span>• {fix.stageLabel || fix.stage.toUpperCase()}</span>
                        {fix.overs && <span className="text-emerald-400 font-normal">({fix.overs} Ov)</span>}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {isCompleted ? 'Finished' : 'Upcoming'}
                        </span>

                        {!isCompleted && isScorer && (
                          <button
                            onClick={() => handleDeleteFixture(fix.id)}
                            className="p-1 rounded hover:bg-red-950/60 text-red-400"
                            title="Delete Match"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm font-extrabold text-white">
                      <div className="flex items-center gap-1.5 truncate max-w-[42%]">
                        {teamA && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: teamA.color }}
                          />
                        )}
                        <span className="truncate">{fix.teamAName}</span>
                      </div>

                      <span className="text-xs text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded-md shrink-0">
                        VS
                      </span>

                      <div className="flex items-center gap-1.5 truncate max-w-[42%] justify-end">
                        <span className="truncate">{fix.teamBName}</span>
                        {teamB && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: teamB.color }}
                          />
                        )}
                      </div>
                    </div>

                    {fix.summary && (
                      <div className="text-xs text-emerald-400 font-bold pt-1 border-t border-emerald-900/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{fix.summary}</span>
                      </div>
                    )}

                    {/* Scorer Match Launcher */}
                    {!isCompleted && isScorer && (
                      <button
                        onClick={() => {
                          audioHaptics.tapFeedback();
                          onLaunchFixtureMatch(fix, activeTourn);
                        }}
                        className="w-full mt-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Score This Match</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Knockout & Playoff Bracket */}
      {activeTourn && activeTab === 'knockout' && (
        <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
            <div>
              <h3 className="font-extrabold text-xs text-emerald-200 uppercase tracking-wider">
                Playoff & Championship Tree
              </h3>
              <p className="text-[10px] text-emerald-400/80">
                Format: {PLAYOFF_OPTIONS.find(p => p.id === activeTourn.playoffFormat)?.label || 'Playoff Stage'}
              </p>
            </div>

            {isScorer && (
              <button
                onClick={handleSyncPlayoffMatchups}
                className="px-2.5 py-1 rounded-xl bg-[#143427] hover:bg-[#1d4937] border border-emerald-700 text-emerald-300 text-[11px] font-bold flex items-center gap-1"
                title="Sync standings into playoff brackets"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Standings</span>
              </button>
            )}
          </div>

          {/* Playoff Matches List */}
          <div className="space-y-3">
            {resolvedPlayoffFixtures.filter(f => f.isPlayoff || f.stage !== 'group').map(fix => {
              const isCompleted = fix.status === 'completed';
              const teamA = activeTourn.teams.find(t => t.id === fix.teamAId);
              const teamB = activeTourn.teams.find(t => t.id === fix.teamBId);
              const isReady = Boolean(fix.teamAId && fix.teamBId && fix.teamAId !== fix.teamBId);

              return (
                <div
                  key={fix.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    fix.stage === 'final' 
                      ? 'bg-gradient-to-br from-amber-500/15 to-[#122e23] border-amber-500/40 shadow-lg' 
                      : 'bg-[#143427] border-emerald-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      {fix.stageLabel || fix.stage.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : (isReady ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-gray-800 text-gray-400')
                    }`}>
                      {isCompleted ? 'Finished' : (isReady ? 'Ready to Play' : 'Waiting for Seeding')}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      {teamA && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamA.color }} />}
                      <span>{fix.teamAName}</span>
                    </div>
                    <span className="text-amber-400 font-extrabold text-[11px] px-2 py-0.5 bg-black/40 rounded-md">VS</span>
                    <div className="flex items-center gap-1.5">
                      <span>{fix.teamBName}</span>
                      {teamB && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamB.color }} />}
                    </div>
                  </div>

                  {fix.ruleDescription && (
                    <p className="text-[10px] text-emerald-300/60 mt-1 italic leading-tight">
                      ℹ️ {fix.ruleDescription}
                    </p>
                  )}

                  {fix.summary && (
                    <div className="text-xs text-emerald-400 font-bold pt-1.5 mt-1.5 border-t border-emerald-800/40">
                      🏆 {fix.summary}
                    </div>
                  )}

                  {!isCompleted && isReady && isScorer && (
                    <button
                      onClick={() => {
                        audioHaptics.tapFeedback();
                        onLaunchFixtureMatch(fix, activeTourn);
                      }}
                      className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-emerald-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Score Playoff Match</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Caps & Leaderboards */}
      {activeTourn && activeTab === 'leaders' && leaders && (
        <div className="space-y-3">
          {/* Orange Cap (Most Runs) */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#422006] to-[#1a2e22] border border-amber-500/40 space-y-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-amber-950 font-black flex items-center justify-center text-sm shadow-md">
                🧢
              </div>
              <div>
                <h4 className="font-black text-xs text-amber-300 uppercase tracking-wider font-display">
                  Orange Cap • Most Runs
                </h4>
                <span className="text-[10px] text-amber-200/60">Top tournament run-scorers</span>
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
                      <span className="text-[10px] text-emerald-300/60 block">SR {b.sr} • HS: {b.highScore}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Purple Cap (Most Wickets) */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#2e1065] to-[#122e23] border border-purple-500/40 space-y-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500 text-purple-950 font-black flex items-center justify-center text-sm shadow-md">
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

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <CreateTournamentModal
          players={players}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTournament={(t) => {
            onCreateTournament(t);
            onSelectTournament(t.id);
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* Add Custom Fixture Modal */}
      {isAddFixtureModalOpen && activeTourn && (
        <AddFixtureModal
          tournament={activeTourn}
          onClose={() => setIsAddFixtureModalOpen(false)}
          onAddFixture={handleAddCustomFixture}
        />
      )}
    </div>
  );
};
