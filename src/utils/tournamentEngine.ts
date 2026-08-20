/**
 * Tournament & League Mode Engine
 * Handles Dynamic Teams, Manual/Auto Fixtures, Points Table with ICC/IPL NRR,
 * Playoff Systems (IPL Page Playoffs, Classic Semi-Finals, Direct Finals, Knockouts),
 * and Tournament Caps (Orange/Purple Cap).
 */

import { 
  Tournament, 
  TournamentFixture, 
  TournamentTeam, 
  PointsTableRow, 
  MatchHistoryEntry,
  PlayoffFormat,
  FixtureGenerationMode
} from '../types';

export const PLAYOFF_OPTIONS: { id: PlayoffFormat; label: string; minTeams: number; desc: string }[] = [
  {
    id: 'page-playoffs',
    label: 'IPL Page Playoffs (Top 4)',
    minTeams: 4,
    desc: 'Qualifier 1 (1v2), Eliminator (3v4), Qualifier 2 (Loser Q1 v Winner Elim), Grand Final'
  },
  {
    id: 'semi-finals',
    label: 'Standard Semi-Finals (Top 4)',
    minTeams: 4,
    desc: 'Semi-Final 1 (1v4), Semi-Final 2 (2v3), Grand Final'
  },
  {
    id: 'top-2-final',
    label: 'Direct Final (Top 2)',
    minTeams: 2,
    desc: 'Rank 1 vs Rank 2 in Grand Final'
  },
  {
    id: 'top-6-knockout',
    label: 'Top 6 Knockout Bracket',
    minTeams: 6,
    desc: 'Rank 1 & 2 bye to Semis; Eliminators (3v6, 4v5) -> Semis -> Grand Final'
  },
  {
    id: 'none',
    label: 'League Only (No Playoffs)',
    minTeams: 2,
    desc: 'Team finishing Top of Points Table is directly crowned League Champion'
  }
];

export const TEAM_COLOR_PRESETS = [
  { name: 'Emerald', hex: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Sapphire', hex: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Amber Gold', hex: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Amethyst Purple', hex: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Crimson Red', hex: '#ef4444', bg: 'bg-red-500' },
  { name: 'Cyan Neon', hex: '#06b6d4', bg: 'bg-cyan-500' },
  { name: 'Orange Fire', hex: '#f97316', bg: 'bg-orange-500' },
  { name: 'Rose Pink', hex: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Lime Green', hex: '#84cc16', bg: 'bg-lime-500' },
  { name: 'Indigo Deep', hex: '#6366f1', bg: 'bg-indigo-500' }
];

/**
 * Generate Playoff Fixture Slots based on Format
 */
export function buildPlayoffFixtureSlots(
  tournamentId: string,
  playoffFormat: PlayoffFormat,
  overs: number,
  startMatchNum: number
): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  let currentNum = startMatchNum;

  if (playoffFormat === 'page-playoffs') {
    fixtures.push({
      id: `fix_${tournamentId}_q1`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'qualifier1',
      stageLabel: 'Qualifier 1',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 1',
      teamBName: 'Rank 2',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner advances directly to Grand Final. Loser gets second chance in Qualifier 2.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_elim`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'eliminator',
      stageLabel: 'Eliminator',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 3',
      teamBName: 'Rank 4',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner advances to Qualifier 2. Loser is eliminated from tournament.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_q2`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'qualifier2',
      stageLabel: 'Qualifier 2',
      teamAId: '',
      teamBId: '',
      teamAName: 'Loser Qualifier 1',
      teamBName: 'Winner Eliminator',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner advances to Grand Final. Loser is eliminated.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_final`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'final',
      stageLabel: 'Grand Final',
      teamAId: '',
      teamBId: '',
      teamAName: 'Winner Qualifier 1',
      teamBName: 'Winner Qualifier 2',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Champion of the League is crowned with Trophy!'
    });
  } else if (playoffFormat === 'semi-finals') {
    fixtures.push({
      id: `fix_${tournamentId}_sf1`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'semi1',
      stageLabel: 'Semi-Final 1',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 1',
      teamBName: 'Rank 4',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner advances to Grand Final.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_sf2`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'semi2',
      stageLabel: 'Semi-Final 2',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 2',
      teamBName: 'Rank 3',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner advances to Grand Final.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_final`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'final',
      stageLabel: 'Grand Final',
      teamAId: '',
      teamBId: '',
      teamAName: 'Winner Semi 1',
      teamBName: 'Winner Semi 2',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Champion of the League is crowned with Trophy!'
    });
  } else if (playoffFormat === 'top-2-final') {
    fixtures.push({
      id: `fix_${tournamentId}_final`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'final',
      stageLabel: 'Grand Final',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 1',
      teamBName: 'Rank 2',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Top 2 teams clash for the Trophy!'
    });
  } else if (playoffFormat === 'top-6-knockout') {
    fixtures.push({
      id: `fix_${tournamentId}_e1`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'quarter',
      stageLabel: 'Eliminator 1',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 3',
      teamBName: 'Rank 6',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner plays Rank 2 in Semi-Final 2.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_e2`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'quarter',
      stageLabel: 'Eliminator 2',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 4',
      teamBName: 'Rank 5',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner plays Rank 1 in Semi-Final 1.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_sf1`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'semi1',
      stageLabel: 'Semi-Final 1',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 1',
      teamBName: 'Winner Eliminator 2',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner advances to Grand Final.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_sf2`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'semi2',
      stageLabel: 'Semi-Final 2',
      teamAId: '',
      teamBId: '',
      teamAName: 'Rank 2',
      teamBName: 'Winner Eliminator 1',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Winner advances to Grand Final.'
    });

    fixtures.push({
      id: `fix_${tournamentId}_final`,
      tournamentId,
      matchNumber: currentNum++,
      stage: 'final',
      stageLabel: 'Grand Final',
      teamAId: '',
      teamBId: '',
      teamAName: 'Winner Semi 1',
      teamBName: 'Winner Semi 2',
      overs,
      status: 'scheduled',
      isPlayoff: true,
      ruleDescription: 'Champion of the League is crowned with Trophy!'
    });
  }

  return fixtures;
}

/**
 * Create a New Tournament with Custom Teams, Fixture Mode, and Playoff Rules
 */
export function createNewTournament(
  name: string,
  overs: number,
  maxBowl: number,
  teamsList: { name: string; shortName: string; color: string; players: string[]; captain?: string }[],
  fixtureMode: FixtureGenerationMode = 'auto-single',
  playoffFormat: PlayoffFormat = 'page-playoffs'
): Tournament {
  const tournamentId = `tourn_${Date.now()}`;
  
  const teams: TournamentTeam[] = teamsList.map((t, idx) => ({
    id: `team_${tournamentId}_${idx + 1}`,
    name: t.name.trim() || `Team ${idx + 1}`,
    shortName: (t.shortName || t.name.substring(0, 3)).toUpperCase().trim(),
    color: t.color || TEAM_COLOR_PRESETS[idx % TEAM_COLOR_PRESETS.length].hex,
    players: t.players && t.players.length > 0 ? t.players : [`Player 1`, `Player 2`, `Player 3`, `Player 4`, `Player 5`],
    captain: t.captain
  }));

  const fixtures: TournamentFixture[] = [];
  let matchNumber = 1;

  if (fixtureMode === 'auto-single' || fixtureMode === 'auto-double') {
    const legs = fixtureMode === 'auto-double' ? 2 : 1;
    for (let leg = 1; leg <= legs; leg++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const teamA = leg === 1 ? teams[i] : teams[j];
          const teamB = leg === 1 ? teams[j] : teams[i];

          fixtures.push({
            id: `fix_${tournamentId}_${matchNumber}`,
            tournamentId,
            matchNumber,
            stage: 'group',
            stageLabel: legs > 1 ? `Group Leg ${leg}` : 'Group Stage',
            teamAId: teamA.id,
            teamBId: teamB.id,
            teamAName: teamA.name,
            teamBName: teamB.name,
            overs,
            status: 'scheduled',
            isPlayoff: false
          });
          matchNumber++;
        }
      }
    }
  }

  // Add Playoff Slots if selected and enough teams exist
  const minTeamsForPlayoff = PLAYOFF_OPTIONS.find(p => p.id === playoffFormat)?.minTeams || 2;
  if (playoffFormat !== 'none' && teams.length >= minTeamsForPlayoff) {
    const playoffSlots = buildPlayoffFixtureSlots(tournamentId, playoffFormat, overs, matchNumber);
    fixtures.push(...playoffSlots);
  }

  return {
    id: tournamentId,
    name: name.trim() || 'Turf Premier League',
    startDate: new Date().toISOString(),
    oversPerMatch: overs,
    maxOversPerBowler: maxBowl,
    format: playoffFormat === 'none' ? 'round-robin' : 'groups-playoffs',
    playoffFormat,
    fixtureMode,
    teams,
    fixtures,
    status: 'ongoing',
    pointsForWin: 2,
    pointsForTie: 1
  };
}

/**
 * Calculate Rule-Accurate Points Table with ICC/IPL Standard Net Run Rate
 */
export function calculatePointsTable(
  tournament: Tournament,
  history: MatchHistoryEntry[]
): PointsTableRow[] {
  const tableMap: Record<string, PointsTableRow> = {};

  // Initialize for all teams
  tournament.teams.forEach(team => {
    tableMap[team.id] = {
      teamId: team.id,
      teamName: team.name,
      shortName: team.shortName,
      color: team.color,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      runsScored: 0,
      oversFacedBalls: 0,
      runsConceded: 0,
      oversBowledBalls: 0,
      nrr: 0,
      form: []
    };
  });

  // Filter matches belonging to group stage
  const groupFixtures = tournament.fixtures.filter(f => f.stage === 'group');

  groupFixtures.forEach(fix => {
    if (fix.status !== 'completed') return;

    const teamA = tableMap[fix.teamAId];
    const teamB = tableMap[fix.teamBId];
    if (!teamA || !teamB) return;

    const winPts = tournament.pointsForWin || 2;
    const tiePts = tournament.pointsForTie || 1;

    // Find the matching match history entry
    const matchEntry = history.find(h => String(h.id) === String(fix.matchId));
    if (!matchEntry || !matchEntry.full) {
      // Use fixture winner if full match history entry not found
      if (fix.winnerTeamId === fix.teamAId) {
        teamA.played++; teamA.won++; teamA.points += winPts; teamA.form.push('W');
        teamB.played++; teamB.lost++; teamB.form.push('L');
      } else if (fix.winnerTeamId === fix.teamBId) {
        teamB.played++; teamB.won++; teamB.points += winPts; teamB.form.push('W');
        teamA.played++; teamA.lost++; teamA.form.push('L');
      }
      return;
    }

    const match = matchEntry.full;
    const inn1 = match.inn1;
    const inn2 = match.inn2;
    if (!inn1 || !inn2) return;

    teamA.played++;
    teamB.played++;

    const isBattingFirstA = match.battingFirst === 'A';
    const team1Row = isBattingFirstA ? teamA : teamB;
    const team2Row = isBattingFirstA ? teamB : teamA;

    // Team 1 Batting
    const maxBalls = match.overs * 6;
    // Rule: if all out, overs faced is considered full quota of overs
    const inn1AllOut = inn1.wickets >= (inn1.batting.length - 1) || inn1.endReason === 'allout';
    const team1BallsFaced = inn1AllOut ? maxBalls : inn1.legalBalls;

    team1Row.runsScored += inn1.total;
    team1Row.oversFacedBalls += team1BallsFaced;

    team2Row.runsConceded += inn1.total;
    team2Row.oversBowledBalls += team1BallsFaced;

    // Team 2 Batting
    const inn2AllOut = inn2.wickets >= (inn2.batting.length - 1) || inn2.endReason === 'allout';
    const team2BallsFaced = inn2AllOut ? maxBalls : inn2.legalBalls;

    team2Row.runsScored += inn2.total;
    team2Row.oversFacedBalls += team2BallsFaced;

    team1Row.runsConceded += inn2.total;
    team1Row.oversBowledBalls += team2BallsFaced;

    // Result Points & Form
    const isTie = match.result?.toLowerCase().includes('tie') || inn1.total === inn2.total;
    const isTeamAWinner = match.result?.includes(match.teamA.name + ' won') || fix.winnerTeamId === fix.teamAId;
    const isTeamBWinner = match.result?.includes(match.teamB.name + ' won') || fix.winnerTeamId === fix.teamBId;

    if (isTie) {
      teamA.tied++;
      teamA.points += tiePts;
      teamA.form.push('T');
      teamB.tied++;
      teamB.points += tiePts;
      teamB.form.push('T');
    } else if (isTeamAWinner) {
      teamA.won++;
      teamA.points += winPts;
      teamA.form.push('W');
      teamB.lost++;
      teamB.form.push('L');
    } else if (isTeamBWinner) {
      teamB.won++;
      teamB.points += winPts;
      teamB.form.push('W');
      teamA.lost++;
      teamA.form.push('L');
    }
  });

  // Calculate NRR for each team
  const rows = Object.values(tableMap).map(row => {
    let nrr = 0;
    if (row.oversFacedBalls > 0 && row.oversBowledBalls > 0) {
      const battingRPO = (row.runsScored / (row.oversFacedBalls / 6));
      const bowlingRPO = (row.runsConceded / (row.oversBowledBalls / 6));
      nrr = Number((battingRPO - bowlingRPO).toFixed(3));
    }
    return { ...row, nrr };
  });

  // Sort by Points DESC, then NRR DESC, then Runs Scored DESC
  rows.sort((a, b) => b.points - a.points || b.nrr - a.nrr || b.runsScored - a.runsScored);

  return rows;
}

/**
 * Dynamic Playoff Seeding & Progression
 * Resolves teams for Playoff fixtures based on Points Table standings and prior playoff outcomes
 */
export function resolvePlayoffMatchups(
  tournament: Tournament,
  pointsTable: PointsTableRow[]
): TournamentFixture[] {
  const teamsById = new Map(tournament.teams.map(t => [t.id, t]));
  const getTeamByRank = (rank1Idx: number) => {
    const row = pointsTable[rank1Idx - 1];
    return row ? teamsById.get(row.teamId) : null;
  };

  const updatedFixtures = tournament.fixtures.map(f => ({ ...f }));

  const findFixtureByStage = (stage: string) => updatedFixtures.find(f => f.stage === stage);

  if (tournament.playoffFormat === 'page-playoffs') {
    const q1 = findFixtureByStage('qualifier1');
    const elim = findFixtureByStage('eliminator');
    const q2 = findFixtureByStage('qualifier2');
    const finalMatch = findFixtureByStage('final');

    const rank1 = getTeamByRank(1);
    const rank2 = getTeamByRank(2);
    const rank3 = getTeamByRank(3);
    const rank4 = getTeamByRank(4);

    if (q1 && (!q1.teamAId || !q1.teamBId)) {
      if (rank1 && rank2) {
        q1.teamAId = rank1.id;
        q1.teamAName = rank1.name;
        q1.teamBId = rank2.id;
        q1.teamBName = rank2.name;
      }
    }

    if (elim && (!elim.teamAId || !elim.teamBId)) {
      if (rank3 && rank4) {
        elim.teamAId = rank3.id;
        elim.teamAName = rank3.name;
        elim.teamBId = rank4.id;
        elim.teamBName = rank4.name;
      }
    }

    if (q2) {
      const loserQ1Id = q1?.loserTeamId || (q1?.status === 'completed' && q1.winnerTeamId ? (q1.winnerTeamId === q1.teamAId ? q1.teamBId : q1.teamAId) : null);
      const winnerElimId = elim?.winnerTeamId;

      if (loserQ1Id) {
        const team = teamsById.get(loserQ1Id);
        if (team) {
          q2.teamAId = team.id;
          q2.teamAName = team.name;
        }
      }
      if (winnerElimId) {
        const team = teamsById.get(winnerElimId);
        if (team) {
          q2.teamBId = team.id;
          q2.teamBName = team.name;
        }
      }
    }

    if (finalMatch) {
      const winnerQ1Id = q1?.winnerTeamId;
      const winnerQ2Id = q2?.winnerTeamId;

      if (winnerQ1Id) {
        const team = teamsById.get(winnerQ1Id);
        if (team) {
          finalMatch.teamAId = team.id;
          finalMatch.teamAName = team.name;
        }
      }
      if (winnerQ2Id) {
        const team = teamsById.get(winnerQ2Id);
        if (team) {
          finalMatch.teamBId = team.id;
          finalMatch.teamBName = team.name;
        }
      }
    }
  } else if (tournament.playoffFormat === 'semi-finals') {
    const sf1 = findFixtureByStage('semi1');
    const sf2 = findFixtureByStage('semi2');
    const finalMatch = findFixtureByStage('final');

    const rank1 = getTeamByRank(1);
    const rank2 = getTeamByRank(2);
    const rank3 = getTeamByRank(3);
    const rank4 = getTeamByRank(4);

    if (sf1 && (!sf1.teamAId || !sf1.teamBId)) {
      if (rank1 && rank4) {
        sf1.teamAId = rank1.id;
        sf1.teamAName = rank1.name;
        sf1.teamBId = rank4.id;
        sf1.teamBName = rank4.name;
      }
    }

    if (sf2 && (!sf2.teamAId || !sf2.teamBId)) {
      if (rank2 && rank3) {
        sf2.teamAId = rank2.id;
        sf2.teamAName = rank2.name;
        sf2.teamBId = rank3.id;
        sf2.teamBName = rank3.name;
      }
    }

    if (finalMatch) {
      const winnerSF1Id = sf1?.winnerTeamId;
      const winnerSF2Id = sf2?.winnerTeamId;

      if (winnerSF1Id) {
        const team = teamsById.get(winnerSF1Id);
        if (team) {
          finalMatch.teamAId = team.id;
          finalMatch.teamAName = team.name;
        }
      }
      if (winnerSF2Id) {
        const team = teamsById.get(winnerSF2Id);
        if (team) {
          finalMatch.teamBId = team.id;
          finalMatch.teamBName = team.name;
        }
      }
    }
  } else if (tournament.playoffFormat === 'top-2-final') {
    const finalMatch = findFixtureByStage('final');
    const rank1 = getTeamByRank(1);
    const rank2 = getTeamByRank(2);

    if (finalMatch && (!finalMatch.teamAId || !finalMatch.teamBId)) {
      if (rank1 && rank2) {
        finalMatch.teamAId = rank1.id;
        finalMatch.teamAName = rank1.name;
        finalMatch.teamBId = rank2.id;
        finalMatch.teamBName = rank2.name;
      }
    }
  }

  return updatedFixtures;
}

/**
 * Tournament Caps & Leaderboards (Orange Cap, Purple Cap, Most Sixes)
 */
export function calculateTournamentLeaders(
  tournament: Tournament,
  history: MatchHistoryEntry[]
) {
  const fixtureMatchIds = new Set(
    tournament.fixtures
      .map(f => String(f.matchId))
      .filter(id => id && id !== 'undefined')
  );

  const batMap: Record<string, { name: string; team: string; runs: number; balls: number; fours: number; sixes: number; innings: number; highScore: number }> = {};
  const bowlMap: Record<string, { name: string; team: string; wickets: number; runs: number; balls: number; maidens: number }> = {};

  history.forEach(h => {
    if (!fixtureMatchIds.has(String(h.id)) && h.full?.tournamentId !== tournament.id) return;

    const full = h.full;
    if (!full) return;

    [full.inn1, full.inn2].forEach((inn, idx) => {
      if (!inn) return;
      const teamName = idx === 0
        ? (full.battingFirst === 'A' ? full.teamA.name : full.teamB.name)
        : (full.battingFirst === 'A' ? full.teamB.name : full.teamA.name);
      const bowlingTeamName = idx === 0
        ? (full.battingFirst === 'A' ? full.teamB.name : full.teamA.name)
        : (full.battingFirst === 'A' ? full.teamA.name : full.teamB.name);

      inn.batting.forEach(b => {
        if (b.balls === 0 && b.runs === 0 && !b.out) return;
        if (!batMap[b.name]) {
          batMap[b.name] = { name: b.name, team: teamName, runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, highScore: 0 };
        }
        batMap[b.name].runs += b.runs;
        batMap[b.name].balls += b.balls;
        batMap[b.name].fours += b.fours;
        batMap[b.name].sixes += b.sixes;
        batMap[b.name].innings += 1;
        batMap[b.name].highScore = Math.max(batMap[b.name].highScore, b.runs);
      });

      inn.bowling.forEach(bw => {
        if (bw.totalBalls === 0 && bw.wickets === 0) return;
        if (!bowlMap[bw.name]) {
          bowlMap[bw.name] = { name: bw.name, team: bowlingTeamName, wickets: 0, runs: 0, balls: 0, maidens: 0 };
        }
        bowlMap[bw.name].wickets += bw.wickets;
        bowlMap[bw.name].runs += bw.runs;
        bowlMap[bw.name].balls += bw.totalBalls;
        bowlMap[bw.name].maidens += bw.maidens || 0;
      });
    });
  });

  const orangeCap = Object.values(batMap)
    .map(b => ({
      ...b,
      sr: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.runs - a.runs || Number(b.sr) - Number(a.sr));

  const purpleCap = Object.values(bowlMap)
    .map(bw => ({
      ...bw,
      econ: bw.balls > 0 ? ((bw.runs / (bw.balls / 6))).toFixed(2) : '0.00'
    }))
    .sort((a, b) => b.wickets - a.wickets || Number(a.econ) - Number(b.econ));

  const sixesKing = [...orangeCap].sort((a, b) => b.sixes - a.sixes || b.runs - a.runs);

  return {
    orangeCap: orangeCap.slice(0, 8),
    purpleCap: purpleCap.slice(0, 8),
    sixesKing: sixesKing.slice(0, 8)
  };
}
