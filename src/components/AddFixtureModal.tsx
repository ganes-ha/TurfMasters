import React, { useState } from 'react';
import { X, Calendar, Plus, Shield, Swords } from 'lucide-react';
import { Tournament, TournamentFixture, TournamentStage } from '../types';
import { audioHaptics } from '../utils/audioHaptics';

interface AddFixtureModalProps {
  tournament: Tournament;
  onClose: () => void;
  onAddFixture: (fixture: TournamentFixture) => void;
}

export const AddFixtureModal: React.FC<AddFixtureModalProps> = ({
  tournament,
  onClose,
  onAddFixture
}) => {
  const nextMatchNum = tournament.fixtures.length + 1;
  const [matchNumber, setMatchNumber] = useState<number>(nextMatchNum);
  const [stage, setStage] = useState<TournamentStage>('group');
  const [stageLabel, setStageLabel] = useState<string>('Group Stage');
  const [teamAId, setTeamAId] = useState<string>(tournament.teams[0]?.id || '');
  const [teamBId, setTeamBId] = useState<string>(tournament.teams[1]?.id || '');
  const [overs, setOvers] = useState<number>(tournament.oversPerMatch);
  const [venue, setVenue] = useState<string>('');

  const stageOptions: { id: TournamentStage; label: string; isPlayoff: boolean }[] = [
    { id: 'group', label: 'Group Stage', isPlayoff: false },
    { id: 'qualifier1', label: 'Qualifier 1 (Page Playoff)', isPlayoff: true },
    { id: 'eliminator', label: 'Eliminator (Page Playoff)', isPlayoff: true },
    { id: 'qualifier2', label: 'Qualifier 2 (Page Playoff)', isPlayoff: true },
    { id: 'semi1', label: 'Semi-Final 1', isPlayoff: true },
    { id: 'semi2', label: 'Semi-Final 2', isPlayoff: true },
    { id: 'quarter', label: 'Quarter Final', isPlayoff: true },
    { id: 'semi', label: 'Semi Final', isPlayoff: true },
    { id: 'final', label: 'Grand Final', isPlayoff: true }
  ];

  const handleStageChange = (newStage: TournamentStage) => {
    setStage(newStage);
    const opt = stageOptions.find(o => o.id === newStage);
    if (opt) {
      setStageLabel(opt.label);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAId || !teamBId || teamAId === teamBId) {
      alert('Please select two distinct teams for the fixture.');
      return;
    }

    const teamA = tournament.teams.find(t => t.id === teamAId);
    const teamB = tournament.teams.find(t => t.id === teamBId);

    const isPlayoff = stage !== 'group';

    const newFixture: TournamentFixture = {
      id: `fix_${tournamentIdGen()}`,
      tournamentId: tournament.id,
      matchNumber,
      stage,
      stageLabel: stageLabel || (stage === 'group' ? 'Group Match' : 'Playoff Match'),
      teamAId,
      teamBId,
      teamAName: teamA?.name || 'Team A',
      teamBName: teamB?.name || 'Team B',
      overs,
      venue: venue.trim() || undefined,
      status: 'scheduled',
      isPlayoff
    };

    audioHaptics.tapFeedback();
    onAddFixture(newFixture);
    onClose();
  };

  function tournamentIdGen() {
    return `${tournament.id}_${Date.now()}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0f281e] border border-emerald-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-emerald-100 font-display">
                Add Custom Fixture
              </h3>
              <p className="text-[10px] text-emerald-400/80">
                Schedule a new match for {tournament.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Match Stage & Number */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-emerald-300/80 mb-1">Match Number</label>
              <input
                type="number"
                min="1"
                value={matchNumber}
                onChange={e => setMatchNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#16382c] border border-emerald-800 text-emerald-100 font-bold focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-300/80 mb-1">Overs / Match</label>
              <input
                type="number"
                min="2"
                max="50"
                value={overs}
                onChange={e => setOvers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#16382c] border border-emerald-800 text-emerald-100 font-bold focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-emerald-300/80 mb-1">Match Stage / Type</label>
            <select
              value={stage}
              onChange={e => handleStageChange(e.target.value as TournamentStage)}
              className="w-full px-3 py-2 rounded-xl bg-[#16382c] border border-emerald-800 text-emerald-100 font-bold focus:outline-none focus:border-emerald-400"
            >
              {stageOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} {opt.isPlayoff ? '🏆' : '🏏'}
                </option>
              ))}
            </select>
          </div>

          {/* Team Selectors */}
          <div className="p-3.5 rounded-2xl bg-[#091812] border border-emerald-900/60 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-300">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Team A (Home)
              </span>
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Team B (Away)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={teamAId}
                onChange={e => setTeamAId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-[#16382c] border border-emerald-700 text-emerald-100 font-bold focus:outline-none text-[11px]"
                required
              >
                <option value="">Select Team A</option>
                {tournament.teams.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === teamBId}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>

              <select
                value={teamBId}
                onChange={e => setTeamBId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-[#16382c] border border-emerald-700 text-emerald-100 font-bold focus:outline-none text-[11px]"
                required
              >
                <option value="">Select Team B</option>
                {tournament.teams.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === teamAId}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Venue / Date */}
          <div>
            <label className="block font-bold text-emerald-300/80 mb-1">Venue / Ground (Optional)</label>
            <input
              type="text"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="e.g. Ground A, Pitch 1"
              className="w-full px-3 py-2 rounded-xl bg-[#16382c] border border-emerald-800 text-emerald-100 focus:outline-none text-xs"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#16382c] hover:bg-[#1f4a3b] text-emerald-300 font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fixture</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
