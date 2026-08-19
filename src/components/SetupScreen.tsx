import React, { useState, useEffect } from 'react';
import { Play, Sparkles, AlertCircle, Star, RotateCcw } from 'lucide-react';
import { audioHaptics } from '../utils/audioHaptics';
import { Match } from '../types';

interface SetupScreenProps {
  players: string[];
  previousMatch?: Match | null;
  onStartMatch: (config: {
    overs: number;
    maxBowl: number;
    freeHitOn: boolean;
    allowCommon: boolean;
    teamAName: string;
    teamBName: string;
    selectedA: string[];
    selectedB: string[];
    tossWinner: 'A' | 'B';
    tossDecision: 'bat' | 'bowl';
  }) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ 
  players, 
  previousMatch, 
  onStartMatch 
}) => {
  const [overs, setOvers] = useState<number>(6);
  const [maxBowl, setMaxBowl] = useState<number>(2);
  const [teamAName, setTeamAName] = useState<string>('Team A');
  const [teamBName, setTeamBName] = useState<string>('Team B');
  const [freeHitOn, setFreeHitOn] = useState<boolean>(true);
  const [allowCommon, setAllowCommon] = useState<boolean>(false);

  const [selectedA, setSelectedA] = useState<Set<string>>(new Set(players.slice(0, 5)));
  const [selectedB, setSelectedB] = useState<Set<string>>(new Set(players.slice(5, 10)));
  const [activeTeamTab, setActiveTeamTab] = useState<'A' | 'B'>('A');

  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  const commons = [...selectedA].filter(p => selectedB.has(p));
  const commonPlayer = commons.length === 1 ? commons[0] : null;

  const handleLoadPrevious = () => {
    if (!previousMatch) return;
    audioHaptics.tapFeedback();
    setOvers(previousMatch.overs);
    setMaxBowl(previousMatch.maxBowl);
    setTeamAName(previousMatch.teamA.name);
    setTeamBName(previousMatch.teamB.name);
    setFreeHitOn(previousMatch.freeHitOn);
    setAllowCommon(previousMatch.allowCommon);
    setSelectedA(new Set(previousMatch.teamA.players));
    setSelectedB(new Set(previousMatch.teamB.players));
  };

  const togglePlayer = (team: 'A' | 'B', name: string) => {
    audioHaptics.tapFeedback();
    const currentSet = team === 'A' ? new Set(selectedA) : new Set(selectedB);
    const otherSet = team === 'A' ? selectedB : selectedA;

    if (currentSet.has(name)) {
      currentSet.delete(name);
    } else {
      if (otherSet.has(name) && !allowCommon) {
        alert('This player is already in the other team. Enable "Allow 1 Common Player" to share.');
        return;
      }
      if (otherSet.has(name) && allowCommon && commons.length >= 1 && !commons.includes(name)) {
        alert('Only 1 common player is allowed.');
        return;
      }
      currentSet.add(name);
    }

    if (team === 'A') setSelectedA(currentSet);
    else setSelectedB(currentSet);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedA.size < 2) return alert('Team A needs at least 2 players');
    if (selectedB.size < 2) return alert('Team B needs at least 2 players');

    if (!allowCommon) {
      if (commons.length > 0) return alert('Shared player found without Common Mode enabled.');
      if (selectedA.size !== selectedB.size) {
        return alert(`Teams must be equal in size. Team A: ${selectedA.size}, Team B: ${selectedB.size}`);
      }
    } else {
      if (commons.length !== 1) {
        return alert('Please select exactly 1 common player on both teams.');
      }
    }

    audioHaptics.tapFeedback();
    onStartMatch({
      overs,
      maxBowl,
      freeHitOn,
      allowCommon,
      teamAName,
      teamBName,
      selectedA: [...selectedA],
      selectedB: [...selectedB],
      tossWinner,
      tossDecision
    });
  };

  return (
    <div className="max-w-md mx-auto py-4 px-3 space-y-4">
      {/* Quick Load Previous Match Banner */}
      {previousMatch && (
        <div className="p-3 rounded-2xl bg-[#122e22] border border-emerald-700/60 flex items-center justify-between">
          <div className="text-xs text-emerald-200">
            <span className="font-bold">Previous:</span> {previousMatch.teamA.name} vs {previousMatch.teamB.name}
          </div>
          <button
            type="button"
            onClick={handleLoadPrevious}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-black flex items-center gap-1 shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Last Squads</span>
          </button>
        </div>
      )}

      <form onSubmit={handleStart} className="space-y-4">
        {/* Match Settings Card */}
        <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-3">
          <h3 className="font-extrabold text-xs text-emerald-200 uppercase tracking-wider">
            Match Configuration
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block font-semibold text-emerald-300/80 mb-1">Overs</label>
              <input
                type="number"
                min="1"
                max="20"
                value={overs}
                onChange={e => setOvers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-300/80 mb-1">Max Ov/Bowler</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxBowl}
                onChange={e => setMaxBowl(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block font-semibold text-emerald-300/80 mb-1">Team A Name</label>
              <input
                type="text"
                value={teamAName}
                onChange={e => setTeamAName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-300/80 mb-1">Team B Name</label>
              <input
                type="text"
                value={teamBName}
                onChange={e => setTeamBName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="pt-2 border-t border-emerald-900/60 space-y-2 text-xs">
            <label className="flex items-center gap-2 text-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={freeHitOn}
                onChange={e => setFreeHitOn(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Free Hit after No-ball</span>
            </label>

            <label className="flex items-center gap-2 text-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={allowCommon}
                onChange={e => setAllowCommon(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Allow 1 Common Player (plays both sides)</span>
            </label>
          </div>
        </div>

        {/* Team Squad Selection */}
        <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTeamTab('A')}
              className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition-all ${
                activeTeamTab === 'A'
                  ? 'bg-emerald-500 text-emerald-950 shadow-md'
                  : 'bg-[#143427] text-emerald-200'
              }`}
            >
              {teamAName} ({selectedA.size})
            </button>
            <button
              type="button"
              onClick={() => setActiveTeamTab('B')}
              className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition-all ${
                activeTeamTab === 'B'
                  ? 'bg-emerald-500 text-emerald-950 shadow-md'
                  : 'bg-[#143427] text-emerald-200'
              }`}
            >
              {teamBName} ({selectedB.size})
            </button>
          </div>

          {commonPlayer && (
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Common player: <strong>{commonPlayer}</strong> (plays for both sides)</span>
            </div>
          )}

          {/* Player Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1 max-h-56 overflow-y-auto pr-1">
            {players.map(p => {
              const isSelected = activeTeamTab === 'A' ? selectedA.has(p) : selectedB.has(p);
              const isCommon = commonPlayer === p;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlayer(activeTeamTab, p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isSelected
                      ? isCommon
                        ? 'bg-amber-500 text-amber-950 border-amber-400 font-extrabold shadow-sm'
                        : 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-sm'
                      : 'bg-[#143427] text-emerald-200/80 border-emerald-900/60 hover:bg-[#1a4232]'
                  }`}
                >
                  {p} {isCommon && '★'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toss Simulator */}
        <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-2.5">
          <h3 className="font-extrabold text-xs text-emerald-200 uppercase tracking-wider">
            Toss Details
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block font-semibold text-emerald-300/80 mb-1">Toss Won By</label>
              <select
                value={tossWinner}
                onChange={e => setTossWinner(e.target.value as 'A' | 'B')}
                className="w-full px-3 py-2 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
              >
                <option value="A">{teamAName}</option>
                <option value="B">{teamBName}</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-emerald-300/80 mb-1">Elected To</label>
              <select
                value={tossDecision}
                onChange={e => setTossDecision(e.target.value as 'bat' | 'bowl')}
                className="w-full px-3 py-2 rounded-xl bg-[#143427] border border-emerald-800 text-emerald-100 font-bold"
              >
                <option value="bat">Bat First</option>
                <option value="bowl">Bowl First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Confirm & Start Scoring</span>
        </button>
      </form>
    </div>
  );
};
