import React, { useState } from 'react';
import { 
  Trophy, 
  X, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Shuffle, 
  ShieldCheck, 
  Settings2,
  Sparkles
} from 'lucide-react';
import { 
  Tournament, 
  PlayoffFormat, 
  FixtureGenerationMode 
} from '../types';
import { 
  createNewTournament, 
  PLAYOFF_OPTIONS, 
  TEAM_COLOR_PRESETS 
} from '../utils/tournamentEngine';
import { SAMPLE_TEAMS } from '../data/defaultSquad';
import { audioHaptics } from '../utils/audioHaptics';

interface CreateTournamentModalProps {
  players: string[];
  onClose: () => void;
  onCreateTournament: (tournament: Tournament) => void;
}

interface DraftTeam {
  name: string;
  shortName: string;
  color: string;
  players: string[];
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  players,
  onClose,
  onCreateTournament
}) => {
  // Stepper: 1: Setup & Format, 2: Teams & Squads, 3: Playoff Rules
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Tournament Form State
  const [name, setName] = useState<string>('Turf Premier League');
  const [overs, setOvers] = useState<number>(6);
  const [maxBowl, setMaxBowl] = useState<number>(2);
  const [fixtureMode, setFixtureMode] = useState<FixtureGenerationMode>('auto-single');
  const [playoffFormat, setPlayoffFormat] = useState<PlayoffFormat>('page-playoffs');

  // Draft Teams
  const [draftTeams, setDraftTeams] = useState<DraftTeam[]>(() => {
    return SAMPLE_TEAMS.map(t => ({
      name: t.name,
      shortName: t.shortName,
      color: t.color,
      players: [...t.players]
    }));
  });

  const [expandedTeamIdx, setExpandedTeamIdx] = useState<number | null>(0);

  // Handle Team Count Change
  const handleSetTeamCount = (targetCount: number) => {
    audioHaptics.tapFeedback();
    const count = Math.max(2, Math.min(16, targetCount));
    
    if (count > draftTeams.length) {
      const added: DraftTeam[] = [];
      for (let i = draftTeams.length; i < count; i++) {
        const color = TEAM_COLOR_PRESETS[i % TEAM_COLOR_PRESETS.length].hex;
        const teamNum = i + 1;
        added.push({
          name: `Team ${teamNum}`,
          shortName: `T${teamNum}`,
          color,
          players: players.slice(i * 5, (i + 1) * 5)
        });
      }
      setDraftTeams(prev => [...prev, ...added]);
    } else if (count < draftTeams.length) {
      setDraftTeams(prev => prev.slice(0, count));
    }
  };

  const handleAddTeam = () => {
    audioHaptics.tapFeedback();
    const i = draftTeams.length;
    const color = TEAM_COLOR_PRESETS[i % TEAM_COLOR_PRESETS.length].hex;
    const teamNum = i + 1;
    setDraftTeams(prev => [
      ...prev,
      {
        name: `Team ${teamNum}`,
        shortName: `T${teamNum}`,
        color,
        players: players.slice(i * 4, (i + 1) * 4)
      }
    ]);
  };

  const handleRemoveTeam = (idx: number) => {
    if (draftTeams.length <= 2) {
      alert('Tournament requires at least 2 teams.');
      return;
    }
    audioHaptics.tapFeedback();
    setDraftTeams(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateTeam = (idx: number, field: keyof DraftTeam, value: any) => {
    setDraftTeams(prev => prev.map((team, i) => i === idx ? { ...team, [field]: value } : team));
  };

  // Quick Distribute master players evenly
  const handleAutoDistributePlayers = () => {
    audioHaptics.tapFeedback();
    if (players.length === 0) return;
    
    const teamsCount = draftTeams.length;
    const newDrafts = draftTeams.map(t => ({ ...t, players: [] as string[] }));
    
    players.forEach((p, idx) => {
      const teamIdx = idx % teamsCount;
      newDrafts[teamIdx].players.push(p);
    });

    setDraftTeams(newDrafts);
  };

  // Quick Preset Selector
  const handleApplyPreset = (presetType: '4-ipl' | '6-cup' | '8-super' | '2-clash') => {
    audioHaptics.tapFeedback();
    if (presetType === '4-ipl') {
      setName('Turf IPL League');
      setOvers(6);
      setMaxBowl(2);
      setFixtureMode('auto-single');
      setPlayoffFormat('page-playoffs');
      handleSetTeamCount(4);
    } else if (presetType === '6-cup') {
      setName('Super 6 Championship');
      setOvers(8);
      setMaxBowl(2);
      setFixtureMode('auto-single');
      setPlayoffFormat('top-6-knockout');
      handleSetTeamCount(6);
    } else if (presetType === '8-super') {
      setName('Grand Premier Trophy');
      setOvers(10);
      setMaxBowl(2);
      setFixtureMode('auto-single');
      setPlayoffFormat('semi-finals');
      handleSetTeamCount(8);
    } else if (presetType === '2-clash') {
      setName('Bilateral Turf Derby');
      setOvers(6);
      setMaxBowl(2);
      setFixtureMode('auto-double');
      setPlayoffFormat('top-2-final');
      handleSetTeamCount(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioHaptics.tapFeedback();

    const newTourn = createNewTournament(
      name,
      overs,
      maxBowl,
      draftTeams,
      fixtureMode,
      playoffFormat
    );

    onCreateTournament(newTourn);
    onClose();
  };

  // Validate playoff format against team count
  const validPlayoffs = PLAYOFF_OPTIONS.filter(p => p.minTeams <= draftTeams.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#0d2319] border border-emerald-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center font-black shadow-lg shadow-amber-950/40">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-emerald-100 font-display">
                Create Cricket Tournament
              </h2>
              <p className="text-xs text-emerald-400 font-medium">
                Custom Teams • Manual/Auto Fixtures • Playoffs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#071710] border border-emerald-950">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              activeStep === 1 ? 'bg-emerald-500 text-emerald-950 font-black shadow-md' : 'text-emerald-300/60 hover:bg-[#0f281e]'
            }`}
          >
            1. Format & Mode
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              activeStep === 2 ? 'bg-emerald-500 text-emerald-950 font-black shadow-md' : 'text-emerald-300/60 hover:bg-[#0f281e]'
            }`}
          >
            2. Teams ({draftTeams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              activeStep === 3 ? 'bg-emerald-500 text-emerald-950 font-black shadow-md' : 'text-emerald-300/60 hover:bg-[#0f281e]'
            }`}
          >
            3. Playoff Rules
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Format & Match Rules */}
          {activeStep === 1 && (
            <div className="space-y-3.5 text-xs">
              {/* Quick Presets */}
              <div className="p-3 rounded-2xl bg-[#112c21] border border-emerald-800/60 space-y-2">
                <span className="font-bold text-[11px] text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick Tournament Presets
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('4-ipl')}
                    className="p-2 rounded-xl bg-[#173a2d] hover:bg-[#1f4e3c] border border-emerald-700/50 text-left font-bold text-emerald-100"
                  >
                    🏆 4 Teams (IPL Playoffs)
                    <span className="block text-[10px] text-emerald-400/70 font-normal">Q1, Elim, Q2, Final</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('6-cup')}
                    className="p-2 rounded-xl bg-[#173a2d] hover:bg-[#1f4e3c] border border-emerald-700/50 text-left font-bold text-emerald-100"
                  >
                    🥊 6 Teams (Knockout)
                    <span className="block text-[10px] text-emerald-400/70 font-normal">Eliminators & Semis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('8-super')}
                    className="p-2 rounded-xl bg-[#173a2d] hover:bg-[#1f4e3c] border border-emerald-700/50 text-left font-bold text-emerald-100"
                  >
                    ⚔️ 8 Teams (Top 4 Semis)
                    <span className="block text-[10px] text-emerald-400/70 font-normal">Round Robin + Semis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('2-clash')}
                    className="p-2 rounded-xl bg-[#173a2d] hover:bg-[#1f4e3c] border border-emerald-700/50 text-left font-bold text-emerald-100"
                  >
                    ⚡ 2 Teams (Best of 3)
                    <span className="block text-[10px] text-emerald-400/70 font-normal">Double Leg Derby</span>
                  </button>
                </div>
              </div>

              {/* Tournament Name */}
              <div>
                <label className="block font-bold text-emerald-300/90 mb-1">Tournament / League Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Summer Turf League 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#15382b] border border-emerald-700 text-emerald-100 font-bold focus:outline-none focus:border-emerald-400 text-sm"
                  required
                />
              </div>

              {/* Overs & Max Bowler */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-emerald-300/90 mb-1">Overs / Match</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={overs}
                    onChange={e => setOvers(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#15382b] border border-emerald-700 text-emerald-100 font-bold text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-300/90 mb-1">Max Over / Bowler</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxBowl}
                    onChange={e => setMaxBowl(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#15382b] border border-emerald-700 text-emerald-100 font-bold text-sm"
                    required
                  />
                </div>
              </div>

              {/* Number of Participating Teams Stepper */}
              <div className="p-3.5 rounded-2xl bg-[#112c21] border border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-200">
                    Participating Teams ({draftTeams.length})
                  </label>
                  <div className="flex items-center gap-1 bg-[#173a2d] p-1 rounded-xl border border-emerald-700">
                    {[2, 3, 4, 6, 8, 10].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleSetTeamCount(cnt)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          draftTeams.length === cnt ? 'bg-emerald-500 text-emerald-950 font-black' : 'text-emerald-300 hover:bg-[#1f4e3c]'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-emerald-400/70 leading-tight">
                  You can customize each team's name, color, and squad in Step 2.
                </p>
              </div>

              {/* Fixture Mode */}
              <div className="space-y-2">
                <label className="block font-bold text-emerald-300/90">
                  Fixture Generation Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFixtureMode('auto-single')}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      fixtureMode === 'auto-single'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 font-bold'
                        : 'bg-[#15382b] border-emerald-800/70 text-emerald-300/70 hover:bg-[#1c4535]'
                    }`}
                  >
                    <span className="font-black text-xs">⚡ Single RR</span>
                    <span className="text-[10px] text-emerald-400/80">Every team plays once</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFixtureMode('auto-double')}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      fixtureMode === 'auto-double'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 font-bold'
                        : 'bg-[#15382b] border-emerald-800/70 text-emerald-300/70 hover:bg-[#1c4535]'
                    }`}
                  >
                    <span className="font-black text-xs">🔄 Double RR</span>
                    <span className="text-[10px] text-emerald-400/80">Home & Away (2 legs)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFixtureMode('manual')}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      fixtureMode === 'manual'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 font-bold'
                        : 'bg-[#15382b] border-emerald-800/70 text-emerald-300/70 hover:bg-[#1c4535]'
                    }`}
                  >
                    <span className="font-black text-xs">✍️ Manual</span>
                    <span className="text-[10px] text-emerald-400/80">Schedule on demand</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60"
                >
                  <span>Next: Configure Teams & Squads</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Teams & Squads Customization */}
          {activeStep === 2 && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-900/60">
                <span className="font-bold text-emerald-200">
                  Custom Team Roster ({draftTeams.length} Teams)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoDistributePlayers}
                    className="px-2.5 py-1 rounded-lg bg-[#173a2d] hover:bg-[#204d3c] border border-emerald-700 text-emerald-300 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Auto-Distribute Squad</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTeam}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Team</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {draftTeams.map((team, idx) => {
                  const isExpanded = expandedTeamIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#112c21] border border-emerald-800/60 overflow-hidden"
                    >
                      {/* Team Summary Bar */}
                      <div
                        onClick={() => setExpandedTeamIdx(isExpanded ? null : idx)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#16382a]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="font-black text-emerald-100 text-xs">
                            {team.name || `Team ${idx + 1}`} ({team.shortName || 'T'})
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80">
                            {team.players.length} players
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {draftTeams.length > 2 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTeam(idx);
                              }}
                              className="p-1 rounded-lg hover:bg-red-950/60 text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="text-emerald-400 text-xs font-bold">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Team Form */}
                      {isExpanded && (
                        <div className="p-3.5 bg-[#0a1e16] border-t border-emerald-900/60 space-y-2.5">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <label className="block font-bold text-emerald-300/80 mb-0.5 text-[11px]">
                                Team Name
                              </label>
                              <input
                                type="text"
                                value={team.name}
                                onChange={e => handleUpdateTeam(idx, 'name', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-[#143427] border border-emerald-700 text-emerald-100 font-bold text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-emerald-300/80 mb-0.5 text-[11px]">
                                Short Code
                              </label>
                              <input
                                type="text"
                                maxLength={4}
                                value={team.shortName}
                                onChange={e => handleUpdateTeam(idx, 'shortName', e.target.value.toUpperCase())}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-[#143427] border border-emerald-700 text-emerald-100 font-bold uppercase text-xs text-center"
                                required
                              />
                            </div>
                          </div>

                          {/* Color Palette Selector */}
                          <div>
                            <label className="block font-bold text-emerald-300/80 mb-1 text-[11px]">
                              Team Color
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {TEAM_COLOR_PRESETS.map(preset => (
                                <button
                                  key={preset.hex}
                                  type="button"
                                  onClick={() => handleUpdateTeam(idx, 'color', preset.hex)}
                                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                    team.color === preset.hex ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                                  }`}
                                  style={{ backgroundColor: preset.hex }}
                                  title={preset.name}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Players List */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="font-bold text-emerald-300/80 text-[11px]">
                                Squad Players ({team.players.length})
                              </label>
                              <span className="text-[10px] text-emerald-400/60">Comma-separated or tag</span>
                            </div>
                            <textarea
                              rows={2}
                              value={team.players.join(', ')}
                              onChange={e => {
                                const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                handleUpdateTeam(idx, 'players', list);
                              }}
                              placeholder="e.g. Dhoni, Kohli, Rohit, Jadeja"
                              className="w-full px-2.5 py-1.5 rounded-xl bg-[#143427] border border-emerald-700 text-emerald-100 text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="flex-1 py-2.5 rounded-xl bg-[#143427] text-emerald-300 font-bold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black shadow-md flex items-center justify-center gap-1"
                >
                  <span>Next: Playoff Rules</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Playoff & Tournament Rules */}
          {activeStep === 3 && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#112c21] border border-emerald-800/60 space-y-1.5">
                <h4 className="font-extrabold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Select Playoff Structure
                </h4>
                <p className="text-[11px] text-emerald-300/70">
                  Choose how group stage rankings qualify into knockouts and finals.
                </p>
              </div>

              <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                {validPlayoffs.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      audioHaptics.tapFeedback();
                      setPlayoffFormat(opt.id);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      playoffFormat === opt.id
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 shadow-md'
                        : 'bg-[#112c21] border-emerald-800/60 text-emerald-300/70 hover:bg-[#16382a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-white">
                        {opt.label}
                      </span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        playoffFormat === opt.id ? 'border-emerald-400 bg-emerald-400 text-emerald-950 text-[10px] font-bold' : 'border-emerald-700'
                      }`}>
                        {playoffFormat === opt.id ? '✓' : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-300/70 mt-1 leading-tight">
                      {opt.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tournament Summary Preview */}
              <div className="p-3 rounded-2xl bg-[#081811] border border-emerald-900/60 space-y-1 text-[11px]">
                <div className="font-bold text-emerald-300">
                  Ready to launch: <span className="text-white">{name}</span>
                </div>
                <div className="text-emerald-400/80">
                  • {draftTeams.length} Teams • {overs} Overs / match • Mode: {fixtureMode}
                </div>
                <div className="text-amber-400 font-semibold">
                  • Playoff: {PLAYOFF_OPTIONS.find(p => p.id === playoffFormat)?.label}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="flex-1 py-3 rounded-xl bg-[#143427] text-emerald-300 font-bold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-emerald-950 font-black shadow-xl flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 fill-current" />
                  <span>Generate Tournament & Fixtures</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
