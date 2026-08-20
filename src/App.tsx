/**
 * CricVault - Main Application Root
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Match, 
  Innings, 
  Tournament, 
  TournamentFixture, 
  MatchHistoryEntry, 
  UserSession, 
  BallDelivery 
} from './types';
import { DEFAULT_PLAYERS } from './data/defaultSquad';
import { calculateAwards, oversStr } from './utils/cricketRules';
import { audioHaptics } from './utils/audioHaptics';
import { voiceScoring } from './utils/voiceRecognition';
import { resolvePlayoffMatchups, calculatePointsTable } from './utils/tournamentEngine';
import { 
  subscribeToAuthChanges, 
  subscribeToActiveLiveMatch, 
  subscribeToLiveMatch,
  syncLiveMatchToCloud, 
  saveMatchHistoryToCloud, 
  deleteMatchHistoryFromCloud,
  subscribeToMatchHistory, 
  saveTournamentToCloud, 
  deleteTournamentFromCloud,
  subscribeToTournaments, 
  saveSquadPlayersToCloud, 
  subscribeToSquadPlayers 
} from './services/firebase';

// UI Components
import { Navbar } from './components/Navbar';
import { LiveScoringScreen } from './components/LiveScoringScreen';
import { SetupScreen } from './components/SetupScreen';
import { ScorecardScreen } from './components/ScorecardScreen';
import { TournamentScreen } from './components/TournamentScreen';
import { StatsScreen } from './components/StatsScreen';
import { SquadScreen } from './components/SquadScreen';
import { HistoryScreen } from './components/HistoryScreen';

// Modals
import { BallEditorModal } from './components/BallEditorModal';
import { WicketModal } from './components/WicketModal';
import { MatchPosterModal } from './components/MatchPosterModal';
import { SpectatorQRModal } from './components/SpectatorQRModal';
import { AuthModal } from './components/AuthModal';
import { StartInningsModal } from './components/StartInningsModal';
import { ChangeBowlerModal } from './components/ChangeBowlerModal';
import { ExtrasModal } from './components/ExtrasModal';
import { SelectBatsmanModal } from './components/SelectBatsmanModal';
import { ReturnRetiredModal } from './components/ReturnRetiredModal';
import { AddPlayerMidMatchModal } from './components/AddPlayerMidMatchModal';
import { NewMatchModal } from './components/NewMatchModal';

function safeStorageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

export default function App() {
  // Global State
  const [user, setUser] = useState<UserSession>(() => {
    return safeStorageGet<UserSession>('cricvault_user', {
      username: 'admin',
      role: 'scorer',
      name: 'Match Scorer'
    });
  });

  const [players, setPlayers] = useState<string[]>(() => {
    return safeStorageGet<string[]>('cricvault_players', DEFAULT_PLAYERS);
  });

  const [match, setMatch] = useState<Match | null>(() => {
    return safeStorageGet<Match | null>('cricvault_active_match', null);
  });

  const [history, setHistory] = useState<MatchHistoryEntry[]>(() => {
    return safeStorageGet<MatchHistoryEntry[]>('cricvault_history', []);
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    return safeStorageGet<Tournament[]>('cricvault_tournaments', []);
  });

  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

  // App Navigation
  const [activeScreen, setActiveScreen] = useState<string>('live');

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isWicketModalOpen, setIsWicketModalOpen] = useState<boolean>(false);
  const [isStartInningsModalOpen, setIsStartInningsModalOpen] = useState<boolean>(false);
  const [isChangeBowlerModalOpen, setIsChangeBowlerModalOpen] = useState<boolean>(false);
  const [editingBall, setEditingBall] = useState<{ delivery: BallDelivery; index: number } | null>(null);

  // Advanced Options Modals
  const [extrasModalType, setExtrasModalType] = useState<'wide' | 'noball' | 'bye' | 'legbye' | null>(null);
  const [batsmanModalRole, setBatsmanModalRole] = useState<'striker' | 'nonstriker' | 'new_batter' | null>(null);
  const [isReturnRetiredModalOpen, setIsReturnRetiredModalOpen] = useState<boolean>(false);
  const [isAddPlayerMidMatchModalOpen, setIsAddPlayerMidMatchModalOpen] = useState<boolean>(false);
  const [isNewMatchModalOpen, setIsNewMatchModalOpen] = useState<boolean>(false);

  // Sound & Voice Controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => audioHaptics.isSoundEnabled());
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => audioHaptics.isHapticEnabled());
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  const isScorer = user.role === 'scorer' || user.role === 'cloudadmin';

  // Spectator URL Detection & Firebase Real-time Subscriptions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isSpectate = params.get('spectate') === 'true' || params.get('view') === 'spectator';
      if (isSpectate) {
        setUser(prev => ({
          ...prev,
          role: 'viewer',
          name: prev.role === 'scorer' || prev.role === 'cloudadmin' ? 'Live Spectator' : prev.name
        }));
        setActiveScreen('live');
      }
    }
  }, []);

  // 1. Firebase Auth state listener
  useEffect(() => {
    const unsub = subscribeToAuthChanges((cloudSession) => {
      if (cloudSession) {
        setUser(cloudSession);
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time Live Match Stream for spectators
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const paramMatchId = params?.get('matchId') || '';

    const handleRemoteMatch = (remoteMatch: Match | null) => {
      if (remoteMatch) {
        // If current session is spectator/viewer, continuously mirror the live match
        if (user.role === 'viewer') {
          setMatch(remoteMatch);
        }
      }
    };

    const unsub = paramMatchId
      ? subscribeToLiveMatch(paramMatchId, handleRemoteMatch)
      : subscribeToActiveLiveMatch(handleRemoteMatch);

    return () => unsub();
  }, [user.role]);

  // 3. Cloud Match Archives & History
  useEffect(() => {
    const unsub = subscribeToMatchHistory((remoteHistory) => {
      if (remoteHistory && remoteHistory.length > 0) {
        setHistory(remoteHistory);
      }
    });
    return () => unsub();
  }, []);

  // 4. Cloud Tournaments & Standings
  useEffect(() => {
    const unsub = subscribeToTournaments((remoteTournaments) => {
      if (remoteTournaments && remoteTournaments.length > 0) {
        setTournaments(remoteTournaments);
      }
    });
    return () => unsub();
  }, []);

  // 5. Cloud Master Squad Players
  useEffect(() => {
    const unsub = subscribeToSquadPlayers((remotePlayers) => {
      if (remotePlayers && remotePlayers.length > 0) {
        setPlayers(remotePlayers);
      }
    });
    return () => unsub();
  }, []);

  // 6. Push Live Match state to Firestore in real-time when Scorer scores
  useEffect(() => {
    if (isScorer && match) {
      syncLiveMatchToCloud(match);
    }
  }, [match, isScorer]);

  // Save to localStorage on state modifications with a light debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('cricvault_user', JSON.stringify(user));
        localStorage.setItem('cricvault_players', JSON.stringify(players));
        localStorage.setItem('cricvault_history', JSON.stringify(history.slice(0, 30)));
        localStorage.setItem('cricvault_tournaments', JSON.stringify(tournaments));
        if (match) {
          localStorage.setItem('cricvault_active_match', JSON.stringify(match));
        } else {
          localStorage.removeItem('cricvault_active_match');
        }
      } catch (e) {
        console.warn('Storage sync notice:', e);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [user, players, match, history, tournaments]);

  // Voice recognition scoring handler
  const handleToggleVoice = () => {
    audioHaptics.tapFeedback();
    const next = voiceScoring.toggle(
      (action) => {
        if (action.type === 'runs') handleScoreRuns(action.runs || 0);
        else if (action.type === 'wide') setExtrasModalType('wide');
        else if (action.type === 'noball') setExtrasModalType('noball');
        else if (action.type === 'bye') setExtrasModalType('bye');
        else if (action.type === 'wicket') setIsWicketModalOpen(true);
        else if (action.type === 'undo') handleUndo();
      },
      (listening, msg) => {
        setVoiceActive(listening);
        setVoiceTranscript(msg);
      }
    );
    setVoiceActive(next);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioHaptics.setSoundEnabled(next);
    if (next) audioHaptics.boundaryFeedback('four');
  };

  const handleToggleHaptic = () => {
    const next = !hapticEnabled;
    setHapticEnabled(next);
    audioHaptics.setHapticEnabled(next);
    if (next) audioHaptics.tapFeedback();
  };

  /* ============================================================
     SCORING ENGINE FUNCTIONS
     ============================================================ */

  const getCurrentInnings = (): Innings | null => {
    if (!match) return null;
    return match.innings === 1 ? match.inn1 : match.inn2;
  };

  const handleStartMatch = (config: {
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
  }) => {
    const battingFirst = config.tossWinner === 'A'
      ? (config.tossDecision === 'bat' ? 'A' : 'B')
      : (config.tossDecision === 'bat' ? 'B' : 'A');

    const battingPlayers = battingFirst === 'A' ? config.selectedA : config.selectedB;
    const bowlingPlayers = battingFirst === 'A' ? config.selectedB : config.selectedA;

    const commonPlayer = config.selectedA.find(p => config.selectedB.includes(p)) || null;

    const newMatch: Match = {
      id: Date.now(),
      date: new Date().toISOString(),
      overs: config.overs,
      maxBowl: config.maxBowl,
      freeHitOn: config.freeHitOn,
      allowCommon: config.allowCommon,
      commonPlayer,
      teamA: { name: config.teamAName, players: config.selectedA },
      teamB: { name: config.teamBName, players: config.selectedB },
      toss: { winner: config.tossWinner, decision: config.tossDecision },
      battingFirst,
      innings: 1,
      status: 'setup',
      inn1: createEmptyInnings(battingPlayers, bowlingPlayers),
      inn2: null,
      result: null
    };

    setMatch(newMatch);
    setIsStartInningsModalOpen(true);
    setActiveScreen('live');
  };

  const createEmptyInnings = (batters: string[], bowlers: string[]): Innings => ({
    batting: batters.map((name) => ({
      name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
      howOut: '',
      retired: false,
      order: -1
    })),
    bowling: bowlers.map((name) => ({
      name,
      totalBalls: 0,
      ballsThisOver: 0,
      runs: 0,
      wickets: 0,
      wides: 0,
      noballs: 0,
      maidens: 0
    })),
    total: 0,
    wickets: 0,
    extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0, total: 0 },
    legalBalls: 0,
    currentOver: [],
    allDeliveries: [],
    strikerIdx: -1,
    nonStrikerIdx: -1,
    bowlerIdx: -1,
    lastBowlerIdx: -1,
    battingOrder: 0,
    isComplete: false,
    freeHit: false,
    fallOfWickets: []
  });

  const handleConfirmStartInnings = (strikerIdx: number, nonStrikerIdx: number, bowlerIdx: number) => {
    if (!match) return;
    const inn = getCurrentInnings();
    if (!inn) return;

    inn.strikerIdx = strikerIdx;
    inn.nonStrikerIdx = nonStrikerIdx;
    inn.bowlerIdx = bowlerIdx;
    inn.lastBowlerIdx = -1;
    inn.batting[strikerIdx].order = 0;
    inn.batting[nonStrikerIdx].order = 1;
    inn.battingOrder = 2;
    inn.overStartTotal = inn.total;

    setMatch({ ...match, status: 'live' });
    setIsStartInningsModalOpen(false);
    audioHaptics.boundaryFeedback('four');
  };

  const handleScoreRuns = (runs: number) => {
    if (!match || match.status !== 'live') return;
    const inn = getCurrentInnings();
    if (!inn || inn.isComplete) return;

    if (runs === 4) audioHaptics.boundaryFeedback('four');
    else if (runs === 6) audioHaptics.boundaryFeedback('six');
    else audioHaptics.tapFeedback();

    const striker = inn.batting[inn.strikerIdx];
    const bowler = inn.bowling[inn.bowlerIdx];

    striker.runs += runs;
    striker.balls += 1;
    if (runs === 4) striker.fours++;
    if (runs === 6) striker.sixes++;

    bowler.runs += runs;
    bowler.totalBalls += 1;
    bowler.ballsThisOver = bowler.totalBalls % 6 || (bowler.totalBalls > 0 ? 6 : 0);

    inn.total += runs;
    inn.legalBalls += 1;
    inn.freeHit = false;

    const delivery: BallDelivery = {
      id: `ball_${Date.now()}`,
      label: runs === 0 ? '•' : String(runs),
      type: 'runs',
      runs,
      isLegal: true,
      strikerName: striker.name,
      nonStrikerName: inn.batting[inn.nonStrikerIdx].name,
      bowlerName: bowler.name,
      timestamp: Date.now()
    };

    inn.currentOver.push(delivery);
    inn.allDeliveries.push(delivery);

    if (runs % 2 === 1) {
      const temp = inn.strikerIdx;
      inn.strikerIdx = inn.nonStrikerIdx;
      inn.nonStrikerIdx = temp;
    }

    checkOverAndMatchStatus(inn);
  };

  const handleConfirmWide = (extraRuns: number) => {
    if (!match || match.status !== 'live') return;
    const inn = getCurrentInnings();
    if (!inn || inn.isComplete) return;

    audioHaptics.tapFeedback();
    const bowler = inn.bowling[inn.bowlerIdx];
    const totalExtra = 1 + extraRuns;

    inn.extras.wides += totalExtra;
    inn.extras.total += totalExtra;
    inn.total += totalExtra;
    bowler.runs += totalExtra;
    bowler.wides += 1;

    const delivery: BallDelivery = {
      id: `ball_${Date.now()}`,
      label: extraRuns > 0 ? `Wd+${extraRuns}` : 'Wd',
      type: 'wide',
      runs: 0,
      extraRuns,
      isLegal: false,
      strikerName: inn.batting[inn.strikerIdx].name,
      nonStrikerName: inn.batting[inn.nonStrikerIdx].name,
      bowlerName: bowler.name,
      timestamp: Date.now()
    };

    inn.currentOver.push(delivery);
    inn.allDeliveries.push(delivery);

    if (extraRuns % 2 === 1) {
      const temp = inn.strikerIdx;
      inn.strikerIdx = inn.nonStrikerIdx;
      inn.nonStrikerIdx = temp;
    }

    checkOverAndMatchStatus(inn);
  };

  const handleConfirmNoBall = (batRuns: number, offBat: boolean) => {
    if (!match || match.status !== 'live') return;
    const inn = getCurrentInnings();
    if (!inn || inn.isComplete) return;

    audioHaptics.tapFeedback();
    const striker = inn.batting[inn.strikerIdx];
    const bowler = inn.bowling[inn.bowlerIdx];
    const totalAdded = 1 + batRuns;

    inn.extras.noballs += 1;
    inn.extras.total += 1;

    if (!offBat && batRuns > 0) {
      inn.extras.byes += batRuns;
      inn.extras.total += batRuns;
    }

    inn.total += totalAdded;

    if (offBat && batRuns > 0) {
      striker.runs += batRuns;
      striker.balls += 1;
      if (batRuns === 4) striker.fours++;
      if (batRuns === 6) striker.sixes++;
    }

    bowler.runs += totalAdded;
    bowler.noballs += 1;
    inn.freeHit = match.freeHitOn;

    const delivery: BallDelivery = {
      id: `ball_${Date.now()}`,
      label: batRuns > 0 ? `Nb+${batRuns}` : 'Nb',
      type: 'noball',
      runs: offBat ? batRuns : 0,
      extraRuns: !offBat ? batRuns : 0,
      isLegal: false,
      strikerName: striker.name,
      nonStrikerName: inn.batting[inn.nonStrikerIdx].name,
      bowlerName: bowler.name,
      timestamp: Date.now()
    };

    inn.currentOver.push(delivery);
    inn.allDeliveries.push(delivery);

    if (batRuns % 2 === 1) {
      const temp = inn.strikerIdx;
      inn.strikerIdx = inn.nonStrikerIdx;
      inn.nonStrikerIdx = temp;
    }

    checkOverAndMatchStatus(inn);
  };

  const handleConfirmByeLegBye = (kind: 'bye' | 'legbye', runs: number) => {
    if (!match || match.status !== 'live') return;
    const inn = getCurrentInnings();
    if (!inn || inn.isComplete) return;

    audioHaptics.tapFeedback();
    const striker = inn.batting[inn.strikerIdx];
    const bowler = inn.bowling[inn.bowlerIdx];

    if (kind === 'bye') inn.extras.byes += runs;
    else inn.extras.legbyes += runs;

    inn.extras.total += runs;
    inn.total += runs;
    inn.legalBalls += 1;
    striker.balls += 1;
    bowler.totalBalls += 1;
    bowler.ballsThisOver = bowler.totalBalls % 6 || 6;
    inn.freeHit = false;

    const delivery: BallDelivery = {
      id: `ball_${Date.now()}`,
      label: (kind === 'bye' ? 'B' : 'Lb') + (runs > 0 ? `+${runs}` : ''),
      type: kind,
      runs,
      isLegal: true,
      strikerName: striker.name,
      nonStrikerName: inn.batting[inn.nonStrikerIdx].name,
      bowlerName: bowler.name,
      timestamp: Date.now()
    };

    inn.currentOver.push(delivery);
    inn.allDeliveries.push(delivery);

    if (runs % 2 === 1) {
      const temp = inn.strikerIdx;
      inn.strikerIdx = inn.nonStrikerIdx;
      inn.nonStrikerIdx = temp;
    }

    checkOverAndMatchStatus(inn);
  };

  const handleConfirmWicket = (data: {
    howOut: string;
    outPlayer: 'striker' | 'nonstriker';
    bowlerName: string;
    fielder?: string;
    runs?: number;
    onExtra?: boolean;
  }) => {
    if (!match || match.status !== 'live') return;
    const inn = getCurrentInnings();
    if (!inn || inn.isComplete) return;

    audioHaptics.wicketFeedback();

    const striker = inn.batting[inn.strikerIdx];
    const nonStriker = inn.batting[inn.nonStrikerIdx];
    const bowler = inn.bowling[inn.bowlerIdx];
    const victim = data.outPlayer === 'striker' ? striker : nonStriker;

    const completedRuns = data.runs || 0;
    if (completedRuns > 0 && data.howOut === 'run out' && !data.onExtra) {
      striker.runs += completedRuns;
      bowler.runs += completedRuns;
      inn.total += completedRuns;
      if (completedRuns % 2 === 1) {
        const temp = inn.strikerIdx;
        inn.strikerIdx = inn.nonStrikerIdx;
        inn.nonStrikerIdx = temp;
      }
    }

    victim.out = true;
    victim.howOut = data.fielder ? `${data.howOut} (${data.fielder})` : data.howOut;
    victim.dismissal = {
      type: data.howOut,
      bowler: bowler.name,
      fielder: data.fielder
    };

    if (!data.onExtra) {
      striker.balls += 1;
    }

    const bowlerCredits = ['bowled', 'caught', 'stumped', 'lbw', 'hit wicket'].includes(data.howOut);
    if (bowlerCredits) {
      bowler.wickets += 1;
    }

    const isLegal = !data.onExtra;
    if (isLegal) {
      bowler.totalBalls += 1;
      bowler.ballsThisOver = bowler.totalBalls % 6 || 6;
      inn.legalBalls += 1;
    }

    inn.wickets += 1;
    inn.fallOfWickets.push({
      score: inn.total,
      wicket: inn.wickets,
      batsman: victim.name,
      howOut: victim.howOut,
      overs: oversStr(inn.legalBalls)
    });
    inn.freeHit = false;

    const delivery: BallDelivery = {
      id: `ball_${Date.now()}`,
      label: 'W',
      type: 'wicket',
      runs: completedRuns,
      isLegal,
      strikerName: striker.name,
      nonStrikerName: nonStriker.name,
      bowlerName: bowler.name,
      howOut: victim.howOut,
      fielder: data.fielder,
      timestamp: Date.now()
    };

    inn.currentOver.push(delivery);
    inn.allDeliveries.push(delivery);

    // Prompt batsman selection modal for the next batter if available
    const availableNext = inn.batting.filter(
      b => !b.out && !b.retired && b.order === -1 && b.balls === 0 && b.runs === 0
    );

    if (availableNext.length > 0) {
      // Open batsman selection modal
      setBatsmanModalRole('new_batter');
    } else {
      // Check remaining
      const remainingBatters = inn.batting.filter(b => !b.out && !b.retired);
      if (remainingBatters.length < 2) {
        endInnings(inn, 'allout');
        return;
      }
    }

    checkOverAndMatchStatus(inn);
  };

  const handleSelectBatter = (batterIdx: number) => {
    const inn = getCurrentInnings();
    if (!inn) return;

    if (batsmanModalRole === 'striker') {
      inn.strikerIdx = batterIdx;
    } else if (batsmanModalRole === 'nonstriker') {
      inn.nonStrikerIdx = batterIdx;
    } else if (batsmanModalRole === 'new_batter') {
      // Assign to whichever spot is vacated/out
      const strikerIsOut = inn.batting[inn.strikerIdx]?.out;
      inn.batting[batterIdx].order = inn.battingOrder++;
      if (strikerIsOut) {
        inn.strikerIdx = batterIdx;
      } else {
        inn.nonStrikerIdx = batterIdx;
      }
    }
    setMatch({ ...match });
    setBatsmanModalRole(null);
  };

  const handleConfirmReturnRetired = (playerIdx: number, replaceTarget: 'striker' | 'nonstriker') => {
    const inn = getCurrentInnings();
    if (!inn) return;

    inn.batting[playerIdx].retired = false;
    inn.batting[playerIdx].howOut = '';

    if (replaceTarget === 'striker') {
      inn.strikerIdx = playerIdx;
    } else {
      inn.nonStrikerIdx = playerIdx;
    }
    setMatch({ ...match });
  };

  const handleConfirmAddPlayerMidMatch = (playerName: string, team: 'A' | 'B' | 'both') => {
    if (!match) return;

    // Add to players pool
    if (!players.includes(playerName)) {
      setPlayers(prev => [...prev, playerName]);
    }

    // Add to Team A or B
    if (team === 'A' || team === 'both') {
      if (!match.teamA.players.includes(playerName)) {
        match.teamA.players.push(playerName);
      }
    }
    if (team === 'B' || team === 'both') {
      if (!match.teamB.players.includes(playerName)) {
        match.teamB.players.push(playerName);
      }
    }

    // Add to live current innings lineups
    const inn = getCurrentInnings();
    if (inn) {
      const isBattingTeam = (match.innings === 1 && match.battingFirst === 'A' && (team === 'A' || team === 'both')) ||
                            (match.innings === 1 && match.battingFirst === 'B' && (team === 'B' || team === 'both')) ||
                            (match.innings === 2 && match.battingFirst === 'A' && (team === 'B' || team === 'both')) ||
                            (match.innings === 2 && match.battingFirst === 'B' && (team === 'A' || team === 'both'));

      if (isBattingTeam && !inn.batting.some(b => b.name === playerName)) {
        inn.batting.push({
          name: playerName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          out: false,
          howOut: '',
          retired: false,
          order: -1
        });
      }

      const isBowlingTeam = (match.innings === 1 && match.battingFirst === 'A' && (team === 'B' || team === 'both')) ||
                            (match.innings === 1 && match.battingFirst === 'B' && (team === 'A' || team === 'both')) ||
                            (match.innings === 2 && match.battingFirst === 'A' && (team === 'A' || team === 'both')) ||
                            (match.innings === 2 && match.battingFirst === 'B' && (team === 'B' || team === 'both'));

      if (isBowlingTeam && !inn.bowling.some(b => b.name === playerName)) {
        inn.bowling.push({
          name: playerName,
          totalBalls: 0,
          ballsThisOver: 0,
          runs: 0,
          wickets: 0,
          wides: 0,
          noballs: 0,
          maidens: 0
        });
      }
    }

    setMatch({ ...match });
  };

  const checkOverAndMatchStatus = (inn: Innings) => {
    if (!match) return;

    // Check chase in 2nd innings
    if (match.innings === 2 && match.inn1 && inn.total >= match.inn1.total + 1) {
      endInnings(inn, 'target');
      return;
    }

    // Check all out
    const remaining = inn.batting.filter(b => !b.out && !b.retired);
    if (remaining.length < 2) {
      endInnings(inn, 'allout');
      return;
    }

    // Check overs complete
    if (inn.legalBalls >= match.overs * 6) {
      endInnings(inn, 'overs');
      return;
    }

    // Check end of over
    const bowler = inn.bowling[inn.bowlerIdx];
    if (bowler && bowler.totalBalls > 0 && bowler.totalBalls % 6 === 0 && inn.currentOver.length > 0) {
      audioHaptics.overCompleteFeedback();
      if (inn.total === (inn.overStartTotal ?? 0)) {
        bowler.maidens += 1;
      }
      bowler.ballsThisOver = 0;
      inn.currentOver = [];
      inn.lastBowlerIdx = inn.bowlerIdx;

      // Swap strike at end of over
      const temp = inn.strikerIdx;
      inn.strikerIdx = inn.nonStrikerIdx;
      inn.nonStrikerIdx = temp;

      setMatch({ ...match });
      setTimeout(() => setIsChangeBowlerModalOpen(true), 300);
      return;
    }

    setMatch({ ...match });
  };

  const endInnings = (inn: Innings, reason: string) => {
    if (!match) return;
    inn.isComplete = true;
    inn.endReason = reason;

    if (match.innings === 1) {
      const bat2 = match.battingFirst === 'A' ? match.teamB.players : match.teamA.players;
      const bowl2 = match.battingFirst === 'A' ? match.teamA.players : match.teamB.players;

      const nextInn = createEmptyInnings(bat2, bowl2);
      const updatedMatch: Match = {
        ...match,
        innings: 2,
        inn2: nextInn,
        status: 'setup'
      };

      setMatch(updatedMatch);
      setTimeout(() => setIsStartInningsModalOpen(true), 400);
    } else {
      // Match Complete
      const target = match.inn1.total + 1;
      const scored = match.inn2 ? match.inn2.total : 0;
      let resultText = '';

      if (scored >= target || reason === 'target') {
        const teamBatting2 = match.battingFirst === 'A' ? match.teamB.name : match.teamA.name;
        const wktsRemaining = Math.max(1, (match.inn2?.batting.length || 6) - 1 - (match.inn2?.wickets || 0));
        resultText = `${teamBatting2} won by ${wktsRemaining} wicket${wktsRemaining > 1 ? 's' : ''}`;
      } else if (scored === match.inn1.total) {
        resultText = 'Match Tied';
      } else {
        const teamBowling2 = match.battingFirst === 'A' ? match.teamA.name : match.teamB.name;
        const margin = match.inn1.total - scored;
        resultText = `${teamBowling2} won by ${margin} run${margin !== 1 ? 's' : ''}`;
      }

      const completedMatch: Match = {
        ...match,
        status: 'completed',
        result: resultText,
        awards: calculateAwards({ ...match, result: resultText })
      };

      setMatch(completedMatch);

      // Add to history
      const historyEntry: MatchHistoryEntry = {
        id: completedMatch.id,
        date: completedMatch.date,
        teamA: completedMatch.teamA.name,
        teamB: completedMatch.teamB.name,
        result: resultText,
        inn1: `${completedMatch.inn1.total}/${completedMatch.inn1.wickets}`,
        inn2: `${completedMatch.inn2 ? completedMatch.inn2.total : 0}/${completedMatch.inn2 ? completedMatch.inn2.wickets : 0}`,
        overs: completedMatch.overs,
        awards: completedMatch.awards,
        full: completedMatch
      };

      setHistory(prev => [historyEntry, ...prev.slice(0, 40)]);
      saveMatchHistoryToCloud(historyEntry);
      syncLiveMatchToCloud(completedMatch);

      // Update tournament fixture if applicable
      if (completedMatch.tournamentId && completedMatch.fixtureId) {
        setTournaments(prev => prev.map(t => {
          if (t.id !== completedMatch.tournamentId) return t;

          const currentFix = t.fixtures.find(f => f.id === completedMatch.fixtureId);
          let winnerTeamId = '';
          let loserTeamId = '';

          if (currentFix) {
            const isTeamAWinner = resultText.includes(completedMatch.teamA.name + ' won');
            const isTeamBWinner = resultText.includes(completedMatch.teamB.name + ' won');
            if (isTeamAWinner) {
              winnerTeamId = currentFix.teamAId;
              loserTeamId = currentFix.teamBId;
            } else if (isTeamBWinner) {
              winnerTeamId = currentFix.teamBId;
              loserTeamId = currentFix.teamAId;
            }
          }

          const updatedFixtures = t.fixtures.map(f => {
            if (f.id !== completedMatch.fixtureId) return f;
            return {
              ...f,
              status: 'completed' as const,
              matchId: completedMatch.id,
              result: resultText,
              winnerTeamId,
              loserTeamId,
              summary: `${resultText} (${historyEntry.inn1} vs ${historyEntry.inn2})`
            };
          });

          let updatedTourn: Tournament = {
            ...t,
            fixtures: updatedFixtures
          };

          // If this was a final match, record champion
          if (currentFix?.stage === 'final' && winnerTeamId) {
            updatedTourn.championTeamId = winnerTeamId;
            updatedTourn.runnerUpTeamId = loserTeamId;
            updatedTourn.status = 'completed';
          }

          // Recalculate standings and resolve subsequent playoff matchups
          const newHistory = [historyEntry, ...history.slice(0, 40)];
          const newPoints = calculatePointsTable(updatedTourn, newHistory);
          const resolved = resolvePlayoffMatchups(updatedTourn, newPoints);
          updatedTourn.fixtures = resolved;

          saveTournamentToCloud(updatedTourn);
          return updatedTourn;
        }));
      }

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}
    }
  };

  const handleUndo = () => {
    if (!match || match.status !== 'live') return;
    const inn = getCurrentInnings();
    if (!inn || inn.allDeliveries.length === 0) return;

    audioHaptics.undoFeedback();
    const lastBall = inn.allDeliveries.pop();
    if (!lastBall) return;

    // Remove from current over
    inn.currentOver.pop();

    // Revert runs / extras
    if (lastBall.type === 'runs') {
      inn.total = Math.max(0, inn.total - lastBall.runs);
      inn.legalBalls = Math.max(0, inn.legalBalls - 1);
      const b = inn.batting.find(x => x.name === lastBall.strikerName);
      if (b) {
        b.runs = Math.max(0, b.runs - lastBall.runs);
        b.balls = Math.max(0, b.balls - 1);
        if (lastBall.runs === 4) b.fours = Math.max(0, b.fours - 1);
        if (lastBall.runs === 6) b.sixes = Math.max(0, b.sixes - 1);
      }
      const bw = inn.bowling.find(x => x.name === lastBall.bowlerName);
      if (bw) {
        bw.runs = Math.max(0, bw.runs - lastBall.runs);
        bw.totalBalls = Math.max(0, bw.totalBalls - 1);
      }
      if (lastBall.runs % 2 === 1) {
        const temp = inn.strikerIdx;
        inn.strikerIdx = inn.nonStrikerIdx;
        inn.nonStrikerIdx = temp;
      }
    } else if (lastBall.type === 'wide') {
      const extra = 1 + (lastBall.extraRuns || 0);
      inn.total = Math.max(0, inn.total - extra);
      inn.extras.wides = Math.max(0, inn.extras.wides - extra);
      inn.extras.total = Math.max(0, inn.extras.total - extra);
      const bw = inn.bowling.find(x => x.name === lastBall.bowlerName);
      if (bw) {
        bw.runs = Math.max(0, bw.runs - extra);
        bw.wides = Math.max(0, bw.wides - 1);
      }
    } else if (lastBall.type === 'noball') {
      const totalExtra = 1 + lastBall.runs + (lastBall.extraRuns || 0);
      inn.total = Math.max(0, inn.total - totalExtra);
      inn.extras.noballs = Math.max(0, inn.extras.noballs - 1);
      inn.extras.total = Math.max(0, inn.extras.total - 1);
      if (lastBall.extraRuns) {
        inn.extras.byes = Math.max(0, inn.extras.byes - lastBall.extraRuns);
        inn.extras.total = Math.max(0, inn.extras.total - lastBall.extraRuns);
      }
      const b = inn.batting.find(x => x.name === lastBall.strikerName);
      if (b && lastBall.runs > 0) {
        b.runs = Math.max(0, b.runs - lastBall.runs);
        b.balls = Math.max(0, b.balls - 1);
        if (lastBall.runs === 4) b.fours = Math.max(0, b.fours - 1);
        if (lastBall.runs === 6) b.sixes = Math.max(0, b.sixes - 1);
      }
      const bw = inn.bowling.find(x => x.name === lastBall.bowlerName);
      if (bw) {
        bw.runs = Math.max(0, bw.runs - totalExtra);
        bw.noballs = Math.max(0, bw.noballs - 1);
      }
    } else if (lastBall.type === 'bye' || lastBall.type === 'legbye') {
      const runs = lastBall.runs || 0;
      inn.total = Math.max(0, inn.total - runs);
      inn.legalBalls = Math.max(0, inn.legalBalls - 1);
      if (lastBall.type === 'bye') inn.extras.byes = Math.max(0, inn.extras.byes - runs);
      else inn.extras.legbyes = Math.max(0, inn.extras.legbyes - runs);
      inn.extras.total = Math.max(0, inn.extras.total - runs);
      const b = inn.batting.find(x => x.name === lastBall.strikerName);
      if (b) b.balls = Math.max(0, b.balls - 1);
      const bw = inn.bowling.find(x => x.name === lastBall.bowlerName);
      if (bw) bw.totalBalls = Math.max(0, bw.totalBalls - 1);
    } else if (lastBall.type === 'wicket') {
      inn.wickets = Math.max(0, inn.wickets - 1);
      if (lastBall.isLegal) inn.legalBalls = Math.max(0, inn.legalBalls - 1);
      inn.fallOfWickets.pop();
    }

    setMatch({ ...match });
  };

  const handleSwapStrike = () => {
    const inn = getCurrentInnings();
    if (!inn) return;
    const temp = inn.strikerIdx;
    inn.strikerIdx = inn.nonStrikerIdx;
    inn.nonStrikerIdx = temp;
    setMatch({ ...match });
  };

  const handleRetireBatsman = () => {
    const inn = getCurrentInnings();
    if (!inn) return;
    const striker = inn.batting[inn.strikerIdx];
    if (!confirm(`Retire ${striker.name}?`)) return;

    striker.retired = true;
    striker.howOut = 'retired out';

    const next = inn.batting.findIndex(b => !b.out && !b.retired && b.order === -1);
    if (next >= 0) {
      inn.batting[next].order = inn.battingOrder++;
      inn.strikerIdx = next;
    }
    setMatch({ ...match });
  };

  const handleUpdateDelivery = (ballIndex: number, updated: Partial<BallDelivery>) => {
    const inn = getCurrentInnings();
    if (!inn || !inn.currentOver[ballIndex]) return;

    audioHaptics.tapFeedback();
    const old = inn.currentOver[ballIndex];
    Object.assign(old, updated);

    // Recalculate over total
    inn.total = inn.allDeliveries.reduce((sum, d) => sum + d.runs + (d.extraRuns || (d.type === 'wide' || d.type === 'noball' ? 1 : 0)), 0);
    setMatch({ ...match });
  };

  const handleDeleteDelivery = (ballIndex: number) => {
    const inn = getCurrentInnings();
    if (!inn) return;
    audioHaptics.undoFeedback();
    inn.currentOver.splice(ballIndex, 1);
    setMatch({ ...match });
  };

  const handleLaunchFixtureMatch = (fixture: TournamentFixture, tournament: Tournament) => {
    const teamA = tournament.teams.find(t => t.id === fixture.teamAId) || { name: fixture.teamAName, players: DEFAULT_PLAYERS.slice(0, 5) };
    const teamB = tournament.teams.find(t => t.id === fixture.teamBId) || { name: fixture.teamBName, players: DEFAULT_PLAYERS.slice(5, 10) };

    const newMatch: Match = {
      id: Date.now(),
      date: new Date().toISOString(),
      overs: fixture.overs || tournament.oversPerMatch,
      maxBowl: tournament.maxOversPerBowler,
      freeHitOn: true,
      allowCommon: false,
      commonPlayer: null,
      teamA: { name: teamA.name, players: teamA.players },
      teamB: { name: teamB.name, players: teamB.players },
      toss: { winner: 'A', decision: 'bat' },
      battingFirst: 'A',
      innings: 1,
      status: 'setup',
      inn1: createEmptyInnings(teamA.players, teamB.players),
      inn2: null,
      result: null,
      tournamentId: tournament.id,
      fixtureId: fixture.id
    };

    setMatch(newMatch);
    setActiveScreen('live');
    setIsStartInningsModalOpen(true);
  };

  const handleStartSameSquadRematch = (tossWinner: 'A' | 'B', tossDecision: 'bat' | 'bowl') => {
    const prev = match || history[0]?.full;
    if (!prev) {
      setActiveScreen('setup');
      return;
    }

    const battingFirst = tossWinner === 'A'
      ? (tossDecision === 'bat' ? 'A' : 'B')
      : (tossDecision === 'bat' ? 'B' : 'A');

    const battingPlayers = battingFirst === 'A' ? prev.teamA.players : prev.teamB.players;
    const bowlingPlayers = battingFirst === 'A' ? prev.teamB.players : prev.teamA.players;

    const newMatch: Match = {
      id: Date.now(),
      date: new Date().toISOString(),
      overs: prev.overs,
      maxBowl: prev.maxBowl,
      freeHitOn: prev.freeHitOn,
      allowCommon: prev.allowCommon,
      commonPlayer: prev.commonPlayer,
      teamA: { name: prev.teamA.name, players: [...prev.teamA.players] },
      teamB: { name: prev.teamB.name, players: [...prev.teamB.players] },
      toss: { winner: tossWinner, decision: tossDecision },
      battingFirst,
      innings: 1,
      status: 'setup',
      inn1: createEmptyInnings(battingPlayers, bowlingPlayers),
      inn2: null,
      result: null
    };

    setMatch(newMatch);
    setActiveScreen('live');
    setIsNewMatchModalOpen(false);
    setIsStartInningsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#06130e] text-[#f0fdf4] flex flex-col font-sans">
      {/* Top Sticky Navbar */}
      <Navbar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        hapticEnabled={hapticEnabled}
        onToggleHaptic={handleToggleHaptic}
        voiceActive={voiceActive}
        onToggleVoice={handleToggleVoice}
        isMatchLive={match?.status === 'live'}
      />

      {/* Main Screen Content View */}
      <main className="flex-1 pb-10">
        {activeScreen === 'live' && (
          <LiveScoringScreen
            match={match}
            isScorer={isScorer}
            onScoreRuns={handleScoreRuns}
            onOpenWideModal={() => setExtrasModalType('wide')}
            onOpenNoBallModal={() => setExtrasModalType('noball')}
            onOpenByeModal={(kind) => setExtrasModalType(kind)}
            onOpenWicketModal={() => setIsWicketModalOpen(true)}
            onUndo={handleUndo}
            onSwapStrike={handleSwapStrike}
            onRetireBatsman={handleRetireBatsman}
            onOpenReturnRetired={() => setIsReturnRetiredModalOpen(true)}
            onOpenAddPlayerMidMatch={() => setIsAddPlayerMidMatchModalOpen(true)}
            onChangeStriker={() => setBatsmanModalRole('striker')}
            onChangeNonStriker={() => setBatsmanModalRole('nonstriker')}
            onChangeBowler={() => setIsChangeBowlerModalOpen(true)}
            onOpenBallEditor={(delivery, index) => setEditingBall({ delivery, index })}
            onOpenPosterModal={() => setIsPosterModalOpen(true)}
            onOpenQRModal={() => setIsQRModalOpen(true)}
            onStartNewMatch={() => {
              if (match || history.length > 0) {
                setIsNewMatchModalOpen(true);
              } else {
                setActiveScreen('setup');
              }
            }}
            onStartRematchSameSquad={() => setIsNewMatchModalOpen(true)}
            voiceActive={voiceActive}
            voiceTranscript={voiceTranscript}
          />
        )}

        {activeScreen === 'setup' && (
          <SetupScreen
            players={players}
            previousMatch={match || (history.length > 0 ? history[0].full : null)}
            onStartMatch={handleStartMatch}
          />
        )}

        {activeScreen === 'scorecard' && (
          <ScorecardScreen
            match={match}
            onOpenPosterModal={() => setIsPosterModalOpen(true)}
            onOpenQRModal={() => setIsQRModalOpen(true)}
          />
        )}

        {activeScreen === 'tournaments' && (
          <TournamentScreen
            tournaments={tournaments}
            activeTournamentId={activeTournamentId}
            onSelectTournament={setActiveTournamentId}
            onCreateTournament={(t) => {
              setTournaments(prev => [t, ...prev]);
              setActiveTournamentId(t.id);
              saveTournamentToCloud(t);
            }}
            onUpdateTournament={(t) => {
              setTournaments(prev => prev.map(item => item.id === t.id ? t : item));
              saveTournamentToCloud(t);
            }}
            onDeleteTournament={(id) => {
              setTournaments(prev => prev.filter(item => item.id !== id));
              deleteTournamentFromCloud(id);
              if (activeTournamentId === id) {
                setActiveTournamentId(null);
              }
            }}
            onLaunchFixtureMatch={handleLaunchFixtureMatch}
            history={history}
            players={players}
            isScorer={isScorer}
          />
        )}

        {activeScreen === 'stats' && (
          <StatsScreen
            players={players}
            history={history}
          />
        )}

        {activeScreen === 'squad' && (
          <SquadScreen
            players={players}
            onAddPlayer={(name) => {
              const next = [...players, name];
              setPlayers(next);
              saveSquadPlayersToCloud(next);
            }}
            onRemovePlayer={(name) => {
              const next = players.filter(p => p !== name);
              setPlayers(next);
              saveSquadPlayersToCloud(next);
            }}
            onResetDefaultSquad={() => {
              setPlayers([...DEFAULT_PLAYERS]);
              saveSquadPlayersToCloud([...DEFAULT_PLAYERS]);
            }}
          />
        )}

        {activeScreen === 'history' && (
          <HistoryScreen
            history={history}
            onSelectMatch={(m) => {
              setMatch(m);
              setActiveScreen('scorecard');
            }}
            onClearHistory={() => setHistory([])}
            isScorer={isScorer}
          />
        )}
      </main>

      {/* Global Modals */}
      {isAuthModalOpen && (
        <AuthModal
          currentUser={user}
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={setUser}
        />
      )}

      {isPosterModalOpen && match && (
        <MatchPosterModal
          match={match}
          onClose={() => setIsPosterModalOpen(false)}
        />
      )}

      {isQRModalOpen && (
        <SpectatorQRModal
          onClose={() => setIsQRModalOpen(false)}
          matchId={match?.id ? String(match.id) : undefined}
        />
      )}

      {isWicketModalOpen && getCurrentInnings() && (
        <WicketModal
          innings={getCurrentInnings()!}
          onClose={() => setIsWicketModalOpen(false)}
          onConfirmWicket={handleConfirmWicket}
        />
      )}

      {isStartInningsModalOpen && match && getCurrentInnings() && (
        <StartInningsModal
          inningsNum={match.innings}
          battingTeamName={
            match.innings === 1
              ? (match.battingFirst === 'A' ? match.teamA.name : match.teamB.name)
              : (match.battingFirst === 'A' ? match.teamB.name : match.teamA.name)
          }
          innings={getCurrentInnings()!}
          commonPlayer={match.commonPlayer}
          onClose={() => setIsStartInningsModalOpen(false)}
          onConfirm={handleConfirmStartInnings}
        />
      )}

      {isChangeBowlerModalOpen && getCurrentInnings() && match && (
        <ChangeBowlerModal
          innings={getCurrentInnings()!}
          maxBowl={match.maxBowl}
          commonPlayer={match.commonPlayer}
          onClose={() => setIsChangeBowlerModalOpen(false)}
          onSelectBowler={(bowlerIdx) => {
            const inn = getCurrentInnings();
            if (inn) {
              inn.bowlerIdx = bowlerIdx;
              inn.overStartTotal = inn.total;
              setMatch({ ...match });
            }
            setIsChangeBowlerModalOpen(false);
          }}
        />
      )}

      {/* Extras Selection Modal (Wide+, NoBall+, Bye+, LegBye+) */}
      {extrasModalType && (
        <ExtrasModal
          type={extrasModalType}
          onClose={() => setExtrasModalType(null)}
          onConfirmWide={handleConfirmWide}
          onConfirmNoBall={handleConfirmNoBall}
          onConfirmByeLegBye={handleConfirmByeLegBye}
        />
      )}

      {/* Batsman Selection Modal (Striker / Non-Striker / Next Incoming) */}
      {batsmanModalRole && getCurrentInnings() && (
        <SelectBatsmanModal
          innings={getCurrentInnings()!}
          targetRole={batsmanModalRole}
          commonPlayer={match?.commonPlayer || null}
          onClose={() => setBatsmanModalRole(null)}
          onSelectBatter={handleSelectBatter}
        />
      )}

      {/* Return Retired Batsman Modal */}
      {isReturnRetiredModalOpen && getCurrentInnings() && (
        <ReturnRetiredModal
          innings={getCurrentInnings()!}
          onClose={() => setIsReturnRetiredModalOpen(false)}
          onConfirmReturn={handleConfirmReturnRetired}
        />
      )}

      {/* Add Player Mid-Match Modal */}
      {isAddPlayerMidMatchModalOpen && match && (
        <AddPlayerMidMatchModal
          match={match}
          onClose={() => setIsAddPlayerMidMatchModalOpen(false)}
          onConfirmAddPlayer={handleConfirmAddPlayerMidMatch}
        />
      )}

      {/* New Match / Same Squad Rematch Modal */}
      {isNewMatchModalOpen && (
        <NewMatchModal
          previousMatch={match || (history.length > 0 ? history[0].full : null)}
          onClose={() => setIsNewMatchModalOpen(false)}
          onStartSameSquads={handleStartSameSquadRematch}
          onGoToSetupScreen={() => {
            setIsNewMatchModalOpen(false);
            setActiveScreen('setup');
          }}
        />
      )}

      {editingBall && (
        <BallEditorModal
          delivery={editingBall.delivery}
          ballIndex={editingBall.index}
          onClose={() => setEditingBall(null)}
          onUpdateDelivery={handleUpdateDelivery}
          onDeleteDelivery={handleDeleteDelivery}
        />
      )}
    </div>
  );
}
