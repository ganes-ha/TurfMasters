/**
 * Tournament & League Mode Engine
 * Handles Fixtures, Automated Points Table, Official Net Run Rate (NRR) calculation,
 * Knockout Brackets, and Tournament Caps (Orange/Purple Cap).
 */

import { Tournament, TournamentFixture, TournamentTeam, PointsTableRow, MatchHistoryEntry } from '../types';

export function createNewTournament(
  name: string,
  overs: number,
  maxBowl: number,
  teamsList: { name: string; shortName: string; color: string; players: string[] }[],
  format: 'round-robin' | 'groups-playoffs' | 'knockout' = 'round-robin'
): Tournament {
  const tournamentId = `tourn_${Date.now()}`;
  const teams: TournamentTeam[] = teamsList.map((t, idx) => ({
    id: `team_${tournamentId}_${idx + 1}`,
    name: t.name,
    shortName: t.shortName || t.name.substring(0, 3).toUpperCase(),
    color: t.color || '#22c55e',
    players: t.players
  }));

  const fixtures: TournamentFixture[] = [];

  if (format === 'round-robin') {
    // Generate all pairs
    let matchNumber = 1;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          id: `fix_${tournamentId}_${matchNumber}`,
          tournamentId,
          matchNumber,
          stage: 'group',
          teamAId: teams[i].id,
          teamBId: teams[j].id,
          teamAName: teams[i].name,
          teamBName: teams[j].name,
          overs,
          status: 'scheduled'
        });
        matchNumber++;
      }
    }

    // Add semi-finals & final if 4+ teams
    if (teams.length >= 4) {
      fixtures.push({
        id: `fix_${tournamentId}_semi1`,
        tournamentId,
        matchNumber: matchNumber++,
        stage: 'semi',
        teamAId: '',
        teamBId: '',
        teamAName: 'Qualifier 1 (Rank 1)',
        teamBName: 'Qualifier 4 (Rank 4)',
        overs,
        status: 'scheduled'
      });
      fixtures.push({
        id: `fix_${tournamentId}_semi2`,
        tournamentId,
        matchNumber: matchNumber++,
        stage: 'semi',
        teamAId: '',
        teamBId: '',
        teamAName: 'Qualifier 2 (Rank 2)',
        teamBName: 'Qualifier 3 (Rank 3)',
        overs,
        status: 'scheduled'
      });
      fixtures.push({
        id: `fix_${tournamentId}_final`,
        tournamentId,
        matchNumber: matchNumber++,
        stage: 'final',
        teamAId: '',
        teamBId: '',
        teamAName: 'Winner Semi 1',
        teamBName: 'Winner Semi 2',
        overs,
        status: 'scheduled'
      });
    }
  }

  return {
    id: tournamentId,
    name,
    startDate: new Date().toISOString(),
    oversPerMatch: overs,
    maxOversPerBowler: maxBowl,
    format,
    teams,
    fixtures,
    status: 'ongoing'
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

  // Filter matches belonging to this tournament or match teams
  const groupFixtures = tournament.fixtures.filter(f => f.stage === 'group');

  groupFixtures.forEach(fix => {
    if (fix.status !== 'completed') return;

    const teamA = tableMap[fix.teamAId];
    const teamB = tableMap[fix.teamBId];
    if (!teamA || !teamB) return;

    // Find the matching match history entry
    const matchEntry = history.find(h => String(h.id) === String(fix.matchId));
    if (!matchEntry || !matchEntry.full) {
      // Use fixture winner if history entry not found
      if (fix.winnerTeamId === fix.teamAId) {
        teamA.played++; teamA.won++; teamA.points += 2; teamA.form.push('W');
        teamB.played++; teamB.lost++; teamB.form.push('L');
      } else if (fix.winnerTeamId === fix.teamBId) {
        teamB.played++; teamB.won++; teamB.points += 2; teamB.form.push('W');
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
    if (match.result?.includes(match.teamA.name + ' won') || fix.winnerTeamId === fix.teamAId) {
      teamA.won++;
      teamA.points += 2;
      teamA.form.push('W');
      teamB.lost++;
      teamB.form.push('L');
    } else if (match.result?.includes(match.teamB.name + ' won') || fix.winnerTeamId === fix.teamBId) {
      teamB.won++;
      teamB.points += 2;
      teamB.form.push('W');
      teamA.lost++;
      teamA.form.push('L');
    } else {
      teamA.tied++;
      teamA.points += 1;
      teamA.form.push('T');
      teamB.tied++;
      teamB.points += 1;
      teamB.form.push('T');
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
    // If match is part of this tournament
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
    orangeCap: orangeCap.slice(0, 5),
    purpleCap: purpleCap.slice(0, 5),
    sixesKing: sixesKing.slice(0, 5)
  };
}
