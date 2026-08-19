/**
 * Cricket Rules & Analytics Engine for Box & Turf Cricket
 */

import { Match, MatchAwards, CareerStats, HeadToHeadStats, Badge, MatchHistoryEntry } from '../types';

export function oversStr(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const rem = legalBalls % 6;
  return `${overs}.${rem}`;
}

export function strikeRate(runs: number, balls: number): string {
  if (!balls || balls <= 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
}

export function economyRate(runs: number, legalBalls: number): string {
  if (!legalBalls || legalBalls <= 0) return '0.00';
  return (runs / (legalBalls / 6)).toFixed(2);
}

export function calculateAwards(match: Match): MatchAwards {
  const chasingTeamWon = match.result ? match.result.includes('wicket') : false;
  const defendingTeamWon = match.result ? match.result.includes('run') : false;

  const batMap: Record<string, {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    notOut: boolean;
    inChase: boolean;
    earlyOrder: boolean;
    _score?: number;
  }> = {};

  [match.inn1, match.inn2].forEach((inn, innIdx) => {
    if (!inn) return;
    const isChase = innIdx === 1;
    inn.batting.forEach(b => {
      if (b.balls === 0 && b.runs === 0 && !b.out) return;
      if (!batMap[b.name]) {
        batMap[b.name] = {
          name: b.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          notOut: false,
          inChase: false,
          earlyOrder: false
        };
      }
      const x = batMap[b.name];
      x.runs += b.runs;
      x.balls += b.balls;
      x.fours += b.fours;
      x.sixes += b.sixes;
      if (!b.out && !b.retired && (b.balls > 0 || b.runs > 0 || b.order >= 0)) x.notOut = true;
      if (isChase && (b.balls > 0 || b.runs > 0)) x.inChase = true;
      if (b.order >= 0 && b.order <= 1) x.earlyOrder = true;
    });
  });

  const allBat = Object.values(batMap).map(b => {
    const sr = b.balls ? (b.runs / b.balls * 100) : 0;
    let score = b.runs * 1.0;
    score += Math.min(sr, 220) * 0.15;
    if (b.notOut) score += 8;
    if (b.notOut && b.inChase && chasingTeamWon) score += 12;
    if (b.earlyOrder && b.runs >= 15) score += 5;
    score += b.fours * 1 + b.sixes * 2.5;
    return { ...b, sr, _score: score };
  });

  allBat.sort((a, b) => (b._score || 0) - (a._score || 0) || b.runs - a.runs || b.sr - a.sr);
  const bestBat = allBat[0] || null;

  // Aggregate bowling
  const bowlMap: Record<string, {
    name: string;
    wickets: number;
    runs: number;
    balls: number;
    maidens: number;
    _score?: number;
  }> = {};

  [match.inn1, match.inn2].forEach(inn => {
    if (!inn) return;
    inn.bowling.forEach(b => {
      if (b.totalBalls === 0 && b.wides === 0 && b.noballs === 0 && b.wickets === 0) return;
      if (!bowlMap[b.name]) {
        bowlMap[b.name] = { name: b.name, wickets: 0, runs: 0, balls: 0, maidens: 0 };
      }
      const x = bowlMap[b.name];
      x.wickets += b.wickets;
      x.runs += b.runs;
      x.balls += b.totalBalls;
      x.maidens += b.maidens || 0;
    });
  });

  const allBowl = Object.values(bowlMap).map(b => {
    const economy = b.balls ? (b.runs / (b.balls / 6)) : 99;
    const rpb = b.balls ? (b.runs / b.balls) : 99;
    let score = b.wickets * 25;
    if (b.balls >= 6) {
      score += Math.max(0, 12 - economy) * 3;
      score -= Math.max(0, economy - 10) * 2;
    }
    score += Math.max(0, 1.5 - rpb) * 8;
    score += b.maidens * 15;
    score -= b.runs * 0.15;
    if (b.wickets === 0) score -= 25;
    return { ...b, economy, rpb, _score: score };
  });

  allBowl.sort((a, b) => (b._score || 0) - (a._score || 0) || b.wickets - a.wickets || a.economy - b.economy);
  const withWkts = allBowl.filter(b => b.wickets > 0);
  const bestBowl = (withWkts.length ? withWkts[0] : allBowl[0]) || null;

  // Man of the Match (MVP)
  const points: Record<string, number> = {};
  allBat.forEach(b => {
    let p = b.runs + b.fours * 1.5 + b.sixes * 3;
    p += Math.min(b.sr, 250) * 0.1;
    if (b.notOut) p += 10;
    if (b.notOut && b.inChase && chasingTeamWon) p += 20;
    if (b.runs >= 50) p += 18;
    else if (b.runs >= 30) p += 10;
    points[b.name] = (points[b.name] || 0) + p;
  });

  allBowl.forEach(b => {
    let p = b.wickets * 24;
    if (b.balls >= 6) p += Math.max(0, 10 - b.economy) * 2.5;
    p += b.maidens * 12;
    p -= Math.min(b.runs, 40) * 0.3;
    if (b.wickets >= 3) p += 15;
    if (defendingTeamWon && b.wickets > 0) p += 10;
    points[b.name] = (points[b.name] || 0) + p;
  });

  let mom = '—';
  let maxP = -Infinity;
  Object.entries(points).forEach(([name, p]) => {
    if (p > maxP) {
      maxP = p;
      mom = name;
    }
  });

  const momDetails = batMap[mom] || bowlMap[mom]
    ? `${batMap[mom]?.runs ? `${batMap[mom].runs} runs ` : ''}${bowlMap[mom]?.wickets ? `& ${bowlMap[mom].wickets} wkts` : ''}`
    : '';

  return {
    bestBatsman: bestBat
      ? `${bestBat.name} (${bestBat.runs} runs${bestBat.notOut ? '*' : ''}, SR ${bestBat.sr.toFixed(1)})`
      : '—',
    bestBowler: bestBowl
      ? `${bestBowl.name} (${bestBowl.wickets}/${bestBowl.runs}, Econ ${bestBowl.economy === 99 ? '—' : bestBowl.economy.toFixed(2)})`
      : '—',
    manOfTheMatch: mom || '—',
    momReason: momDetails ? `Impact: ${momDetails.trim()}` : undefined
  };
}

/* ---------- CAREER AGGREGATIONS ---------- */

export function aggregateCareerStats(playerName: string, history: MatchHistoryEntry[]): CareerStats {
  const career: CareerStats = {
    matches: 0,
    bat: {
      innings: 0, runs: 0, balls: 0, fours: 0, sixes: 0,
      highScore: 0, highScoreNotOut: false, notOuts: 0, outs: 0,
      avg: 0, sr: 0, fifties: 0, thirties: 0, ducks: 0, hundreds: 0
    },
    bowl: {
      innings: 0, balls: 0, runs: 0, wickets: 0,
      maidens: 0, wides: 0, noballs: 0,
      bestWickets: 0, bestRuns: 999,
      avg: 0, economy: 0, sr: 0, threeWickets: 0, hatTricks: 0, fiveWickets: 0
    },
    awards: { mom: 0, bestBat: 0, bestBowl: 0 }
  };

  if (!Array.isArray(history)) return career;

  history.forEach(h => {
    if (!h) return;
    const full = h.full;
    let participated = false;

    if (full) {
      const checkInn = (inn: typeof full.inn1) => {
        if (!inn) return false;
        const batted = inn.batting?.some(b => b.name === playerName && (b.order >= 0 || b.balls > 0 || b.out));
        const bowled = inn.bowling?.some(b => b.name === playerName && (b.totalBalls > 0 || b.wickets > 0));
        return batted || bowled;
      };
      participated = checkInn(full.inn1) || checkInn(full.inn2);
    } else if (h.playerStats && h.playerStats[playerName]) {
      participated = true;
    }

    if (!participated) return;
    career.matches++;

    if (h.awards) {
      if (h.awards.manOfTheMatch === playerName) career.awards.mom++;
      if (h.awards.bestBatsman && h.awards.bestBatsman.startsWith(playerName)) career.awards.bestBat++;
      if (h.awards.bestBowler && h.awards.bestBowler.startsWith(playerName)) career.awards.bestBowl++;
    }

    if (full) {
      [full.inn1, full.inn2].forEach(inn => {
        if (!inn) return;
        const b = inn.batting?.find(x => x.name === playerName);
        if (b && (b.order >= 0 || b.balls > 0 || b.out)) {
          career.bat.innings++;
          career.bat.runs += b.runs || 0;
          career.bat.balls += b.balls || 0;
          career.bat.fours += b.fours || 0;
          career.bat.sixes += b.sixes || 0;
          if (b.out) {
            career.bat.outs++;
            if ((b.runs || 0) === 0) career.bat.ducks++;
          } else {
            career.bat.notOuts++;
          }
          const r = b.runs || 0;
          if (r >= 100) career.bat.hundreds++;
          if (r >= 50) career.bat.fifties++;
          else if (r >= 30) career.bat.thirties++;

          if (r > career.bat.highScore) {
            career.bat.highScore = r;
            career.bat.highScoreNotOut = !b.out;
          } else if (r === career.bat.highScore && !b.out && !career.bat.highScoreNotOut) {
            career.bat.highScoreNotOut = true;
          }
        }

        const bw = inn.bowling?.find(x => x.name === playerName);
        if (bw && (bw.totalBalls > 0 || bw.wickets > 0)) {
          career.bowl.innings++;
          career.bowl.balls += bw.totalBalls || 0;
          career.bowl.runs += bw.runs || 0;
          career.bowl.wickets += bw.wickets || 0;
          career.bowl.maidens += bw.maidens || 0;
          career.bowl.wides += bw.wides || 0;
          career.bowl.noballs += bw.noballs || 0;
          const w = bw.wickets || 0;
          const r = bw.runs || 0;
          if (w >= 5) career.bowl.fiveWickets++;
          if (w >= 3) career.bowl.threeWickets++;
          if (w > career.bowl.bestWickets || (w === career.bowl.bestWickets && r < career.bowl.bestRuns)) {
            career.bowl.bestWickets = w;
            career.bowl.bestRuns = r;
          }
        }
      });
    }
  });

  career.bat.avg = career.bat.outs > 0
    ? Number((career.bat.runs / career.bat.outs).toFixed(2))
    : (career.bat.innings > 0 ? career.bat.runs : 0);
  career.bat.sr = career.bat.balls > 0
    ? Number(((career.bat.runs / career.bat.balls) * 100).toFixed(2))
    : 0;
  career.bowl.economy = career.bowl.balls > 0
    ? Number(((career.bowl.runs / career.bowl.balls) * 6).toFixed(2))
    : 0;
  career.bowl.avg = career.bowl.wickets > 0
    ? Number((career.bowl.runs / career.bowl.wickets).toFixed(2))
    : 0;
  career.bowl.sr = career.bowl.wickets > 0
    ? Number((career.bowl.balls / career.bowl.wickets).toFixed(2))
    : 0;

  return career;
}

/* ---------- HEAD-TO-HEAD STATS ENGINE ---------- */

export function aggregateHeadToHead(batterName: string, bowlerName: string, history: MatchHistoryEntry[]): HeadToHeadStats {
  const result: HeadToHeadStats = {
    batterName,
    bowlerName,
    ballsFaced: 0,
    runsScored: 0,
    dismissals: 0,
    fours: 0,
    sixes: 0,
    dots: 0,
    strikeRate: 0,
    dotPercentage: 0
  };

  if (!Array.isArray(history)) return result;

  history.forEach(h => {
    const full = h.full;
    if (!full) return;

    [full.inn1, full.inn2].forEach(inn => {
      if (!inn) return;

      // Check if allDeliveries exist
      if (inn.allDeliveries && inn.allDeliveries.length > 0) {
        inn.allDeliveries.forEach(del => {
          if (del.strikerName === batterName && del.bowlerName === bowlerName) {
            if (del.isLegal) {
              result.ballsFaced++;
              result.runsScored += del.runs;
              if (del.runs === 0 && del.type !== 'wicket') result.dots++;
              if (del.runs === 4) result.fours++;
              if (del.runs === 6) result.sixes++;
            }
            if (del.type === 'wicket' && del.howOut && !del.howOut.includes('run out')) {
              result.dismissals++;
            }
          }
        });
      } else {
        // Fallback approximation if delivery stream wasn't stored
        const b = inn.batting?.find(x => x.name === batterName);
        const bw = inn.bowling?.find(x => x.name === bowlerName);
        if (b && bw && b.dismissal && b.dismissal.bowler === bowlerName) {
          result.dismissals++;
        }
      }
    });
  });

  result.strikeRate = result.ballsFaced > 0 ? Number(((result.runsScored / result.ballsFaced) * 100).toFixed(2)) : 0;
  result.dotPercentage = result.ballsFaced > 0 ? Number(((result.dots / result.ballsFaced) * 100).toFixed(1)) : 0;

  return result;
}

/* ---------- BADGES DEFINITIONS ---------- */

export const BADGE_DEFS: Badge[] = [
  { id: 'century', name: 'Century Club', icon: '💯', desc: 'Score 100+ runs in an innings', tier: 'gold', check: (s) => s.bat.highScore >= 100 },
  { id: 'fifty', name: 'Half Century', icon: '5️⃣', desc: 'Score 50+ runs in an innings', tier: 'silver', check: (s) => s.bat.fifties > 0 || s.bat.highScore >= 50 },
  { id: 'thirty', name: 'Solid Thirty', icon: '3️⃣', desc: 'Score 30+ runs in an innings', tier: 'bronze', check: (s) => s.bat.thirties > 0 || s.bat.highScore >= 30 },
  { id: 'sixer', name: 'Six Machine', icon: '🚀', desc: 'Hit 10+ career sixes', tier: 'purple', check: (s) => s.bat.sixes >= 10 },
  { id: 'boundary', name: 'Boundary King', icon: '4️⃣', desc: 'Hit 25+ career fours', tier: 'blue', check: (s) => s.bat.fours >= 25 },
  { id: 'striker', name: 'Strike Rate Star', icon: '⚡', desc: 'Career SR above 150 (min 30 balls)', tier: 'gold', check: (s) => s.bat.balls >= 30 && s.bat.sr >= 150 },
  { id: 'consistent', name: 'Mr. Consistent', icon: '📊', desc: 'Avg 25+ (min 5 innings)', tier: 'silver', check: (s) => s.bat.innings >= 5 && s.bat.avg >= 25 },
  { id: 'not_out', name: 'Unbeaten', icon: '🛡️', desc: '5+ not-out innings', tier: 'green', check: (s) => s.bat.notOuts >= 5 },
  { id: 'fifer', name: '5-Wicket Haul', icon: '🔥', desc: 'Take 5+ wickets in an innings', tier: 'gold', check: (s) => s.bowl.bestWickets >= 5 },
  { id: 'threeFer', name: '3-Wicket Haul', icon: '🎯', desc: 'Take 3+ wickets in an innings', tier: 'silver', check: (s) => s.bowl.threeWickets > 0 || s.bowl.bestWickets >= 3 },
  { id: 'economical', name: 'Economy Master', icon: '🧊', desc: 'Career economy under 6 (min 30 balls)', tier: 'blue', check: (s) => s.bowl.balls >= 30 && s.bowl.economy <= 6 },
  { id: 'wicket_taker', name: 'Wicket Collector', icon: '🎳', desc: '15+ career wickets', tier: 'purple', check: (s) => s.bowl.wickets >= 15 },
  { id: 'allrounder', name: 'All-Rounder', icon: '🌟', desc: '100+ runs AND 10+ wickets career', tier: 'gold', check: (s) => s.bat.runs >= 100 && s.bowl.wickets >= 10 },
  { id: 'mom', name: 'Match Winner', icon: '🏆', desc: 'Win Man of the Match award', tier: 'gold', check: (s) => s.awards.mom >= 1 },
  { id: 'mom_3', name: 'Serial Winner', icon: '👑', desc: 'Win 3+ Man of the Match awards', tier: 'gold', check: (s) => s.awards.mom >= 3 },
  { id: 'veteran', name: 'Veteran', icon: '🎖️', desc: 'Play 10+ matches', tier: 'silver', check: (s) => s.matches >= 10 },
  { id: 'debut', name: 'First Match', icon: '🌱', desc: 'Play your first match', tier: 'green', check: (s) => s.matches >= 1 }
];
