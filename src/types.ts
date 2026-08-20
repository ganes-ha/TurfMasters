/**
 * CricVault - Types & Data Models
 */

export type UserRole = 'scorer' | 'viewer' | 'cloudadmin';
export type AppTheme = 'midnight' | 'forest' | 'daylight';

export interface UserSession {
  username: string;
  role: UserRole;
  name: string;
  uid?: string;
  email?: string;
  isCloudAuth?: boolean;
}

export interface BatterRecord {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  howOut: string;
  retired: boolean;
  order: number;
  dismissal?: {
    type: string;
    bowler?: string;
    fielder?: string;
  };
}

export interface BowlerRecord {
  name: string;
  totalBalls: number;
  ballsThisOver: number;
  runs: number;
  wickets: number;
  wides: number;
  noballs: number;
  maidens: number;
}

export interface FallOfWicket {
  score: number;
  wicket: number;
  batsman: string;
  howOut: string;
  overs: string;
}

export interface BallDelivery {
  id: string;
  label: string;
  type: 'runs' | 'wide' | 'noball' | 'bye' | 'legbye' | 'wicket';
  runs: number;
  extraRuns?: number;
  isLegal: boolean;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  timestamp: number;
  isFreeHit?: boolean;
  howOut?: string;
  outPlayer?: 'striker' | 'nonstriker';
  fielder?: string;
}

export interface Innings {
  batting: BatterRecord[];
  bowling: BowlerRecord[];
  total: number;
  wickets: number;
  extras: {
    wides: number;
    noballs: number;
    byes: number;
    legbyes: number;
    total: number;
  };
  legalBalls: number;
  currentOver: BallDelivery[];
  allDeliveries: BallDelivery[];
  strikerIdx: number;
  nonStrikerIdx: number;
  bowlerIdx: number;
  lastBowlerIdx: number;
  battingOrder: number;
  isComplete: boolean;
  freeHit: boolean;
  fallOfWickets: FallOfWicket[];
  overStartTotal?: number;
  endReason?: string;
  _pendingNewBatsman?: {
    outWasStriker: boolean;
    onLastBallOfOver: boolean;
    how: string;
  } | null;
  _overEndedWithWicket?: boolean;
}

export interface MatchAwards {
  bestBatsman: string;
  bestBowler: string;
  manOfTheMatch: string;
  momReason?: string;
}

export interface Match {
  id: string | number;
  date: string;
  overs: number;
  maxBowl: number;
  freeHitOn: boolean;
  allowCommon: boolean;
  commonPlayer: string | null;
  teamA: {
    name: string;
    players: string[];
  };
  teamB: {
    name: string;
    players: string[];
  };
  toss: {
    winner: 'A' | 'B';
    decision: 'bat' | 'bowl';
  };
  battingFirst: 'A' | 'B';
  innings: 1 | 2;
  status: 'setup' | 'live' | 'completed';
  inn1: Innings;
  inn2: Innings | null;
  result: string | null;
  awards?: MatchAwards;
  tournamentId?: string;
  fixtureId?: string;
  lastUpdated?: number;
}

export interface MatchHistoryEntry {
  id: string | number;
  date: string;
  teamA: string;
  teamB: string;
  result: string | null;
  inn1: string;
  inn2: string;
  overs: number;
  awards?: MatchAwards;
  playerStats?: Record<string, {
    name: string;
    bat: {
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      out: boolean;
      highScore: number;
    } | null;
    bowl: {
      balls: number;
      runs: number;
      wickets: number;
      wides: number;
      noballs: number;
      maidens: number;
    } | null;
  }>;
  full: Match;
}

/* ---------- TOURNAMENT & LEAGUE TYPES ---------- */

export type TournamentStage = 
  | 'group' 
  | 'qualifier1' 
  | 'eliminator' 
  | 'qualifier2' 
  | 'semi1' 
  | 'semi2' 
  | 'quarter' 
  | 'semi' 
  | 'final';

export type PlayoffFormat = 
  | 'page-playoffs'  // IPL Style: Q1 (1v2), Eliminator (3v4), Q2 (LQ1 v WE), Final (WQ1 v WQ2)
  | 'semi-finals'    // Classic: SF1 (1v4), SF2 (2v3), Final (WSF1 v WSF2)
  | 'top-2-final'    // Direct Final: Rank 1 vs Rank 2
  | 'top-6-knockout' // 6-team knockout
  | 'direct-knockout'// Pure knockout tree
  | 'none';          // Table winner is champion

export type FixtureGenerationMode = 'auto-single' | 'auto-double' | 'manual';

export interface TournamentTeam {
  id: string;
  name: string;
  shortName: string;
  color: string;
  players: string[];
  captain?: string;
}

export interface TournamentFixture {
  id: string;
  tournamentId: string;
  matchNumber: number;
  stage: TournamentStage;
  stageLabel?: string;
  groupName?: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  overs: number;
  venue?: string;
  date?: string;
  status: 'scheduled' | 'live' | 'completed';
  matchId?: string | number;
  result?: string;
  winnerTeamId?: string;
  loserTeamId?: string;
  summary?: string;
  ruleDescription?: string;
  isPlayoff?: boolean;
}

export interface PointsTableRow {
  teamId: string;
  teamName: string;
  shortName: string;
  color: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  runsScored: number;
  oversFacedBalls: number;
  runsConceded: number;
  oversBowledBalls: number;
  nrr: number; // Net Run Rate
  form: ('W' | 'L' | 'T')[];
}

export interface Tournament {
  id: string;
  name: string;
  location?: string;
  startDate: string;
  oversPerMatch: number;
  maxOversPerBowler: number;
  format: 'round-robin' | 'groups-playoffs' | 'knockout';
  playoffFormat: PlayoffFormat;
  fixtureMode: FixtureGenerationMode;
  teams: TournamentTeam[];
  groups?: {
    name: string;
    teamIds: string[];
  }[];
  fixtures: TournamentFixture[];
  status: 'upcoming' | 'ongoing' | 'completed';
  championTeamId?: string;
  runnerUpTeamId?: string;
  pointsForWin?: number;
  pointsForTie?: number;
}

/* ---------- CAREER & HEAD-TO-HEAD TYPES ---------- */

export interface CareerBatting {
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highScore: number;
  highScoreNotOut: boolean;
  notOuts: number;
  outs: number;
  avg: number;
  sr: number;
  fifties: number;
  thirties: number;
  ducks: number;
  hundreds: number;
}

export interface CareerBowling {
  innings: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  wides: number;
  noballs: number;
  bestWickets: number;
  bestRuns: number;
  avg: number;
  economy: number;
  sr: number;
  threeWickets: number;
  hatTricks: number;
  fiveWickets: number;
}

export interface CareerStats {
  matches: number;
  bat: CareerBatting;
  bowl: CareerBowling;
  awards: {
    mom: number;
    bestBat: number;
    bestBowl: number;
  };
}

export interface HeadToHeadStats {
  batterName: string;
  bowlerName: string;
  ballsFaced: number;
  runsScored: number;
  dismissals: number;
  fours: number;
  sixes: number;
  dots: number;
  strikeRate: number;
  dotPercentage: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  desc: string;
  tier: 'gold' | 'silver' | 'bronze' | 'purple' | 'blue' | 'green';
  check: (s: CareerStats) => boolean;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  voiceScoringEnabled: boolean;
  autoSaveToCloud: boolean;
  theme: 'emerald' | 'cyan' | 'amber';
}
