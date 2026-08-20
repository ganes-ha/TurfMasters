import React from 'react';
import { 
  ArrowLeftRight, 
  UserMinus, 
  UserPlus, 
  Sparkles, 
  Mic, 
  RotateCcw, 
  Share2, 
  QrCode, 
  Edit3, 
  Trophy,
  Play,
  UserCheck
} from 'lucide-react';
import { Match, BallDelivery } from '../types';
import { oversStr, strikeRate, economyRate } from '../utils/cricketRules';
import { audioHaptics } from '../utils/audioHaptics';

interface LiveScoringScreenProps {
  match: Match | null;
  isScorer: boolean;
  onScoreRuns: (runs: number) => void;
  onOpenWideModal: () => void;
  onOpenNoBallModal: () => void;
  onOpenByeModal: (kind: 'bye' | 'legbye') => void;
  onOpenWicketModal: () => void;
  onUndo: () => void;
  onSwapStrike: () => void;
  onRetireBatsman: () => void;
  onOpenReturnRetired: () => void;
  onOpenAddPlayerMidMatch: () => void;
  onChangeStriker: () => void;
  onChangeNonStriker: () => void;
  onChangeBowler: () => void;
  onOpenBallEditor: (delivery: BallDelivery, index: number) => void;
  onOpenPosterModal: () => void;
  onOpenQRModal: () => void;
  onStartNewMatch: () => void;
  onStartRematchSameSquad?: () => void;
  onOpenStartInnings?: () => void;
  voiceActive: boolean;
  voiceTranscript: string;
}

export const LiveScoringScreen: React.FC<LiveScoringScreenProps> = ({
  match,
  isScorer,
  onScoreRuns,
  onOpenWideModal,
  onOpenNoBallModal,
  onOpenByeModal,
  onOpenWicketModal,
  onUndo,
  onSwapStrike,
  onRetireBatsman,
  onOpenReturnRetired,
  onOpenAddPlayerMidMatch,
  onChangeStriker,
  onChangeNonStriker,
  onChangeBowler,
  onOpenBallEditor,
  onOpenPosterModal,
  onOpenQRModal,
  onStartNewMatch,
  onStartRematchSameSquad,
  onOpenStartInnings,
  voiceActive,
  voiceTranscript
}) => {
  if (!match) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl">
          🏏
        </div>
        <h2 className="text-xl font-extrabold text-emerald-100 font-display">No Active Match</h2>
        <p className="text-xs text-emerald-300/70 mt-1 mb-6 max-w-xs mx-auto">
          Start a new match or launch a tournament fixture to begin rule-accurate box cricket scoring.
        </p>
        <button
          onClick={onStartNewMatch}
          className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-sm shadow-xl shadow-emerald-950/60 inline-flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Set Up New Match</span>
        </button>
      </div>
    );
  }

  if (match.status === 'completed') {
    const awards = match.awards;
    return (
      <div className="max-w-md mx-auto py-6 px-3 space-y-4">
        {/* Match Over Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#144230] to-[#0d281d] border border-emerald-500/40 text-center shadow-xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block mb-2">
            MATCH CONCLUDED
          </span>
          <h2 className="text-2xl font-black text-white font-display">
            {match.result || 'Match Completed'}
          </h2>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold text-emerald-200/80">
            <span>{match.teamA.name}: <strong>{match.inn1?.total}/{match.inn1?.wickets}</strong></span>
            <span>vs</span>
            <span>{match.teamB.name}: <strong>{match.inn2?.total}/{match.inn2?.wickets}</strong></span>
          </div>
        </div>

        {/* Awards Highlights */}
        {awards && (
          <div className="p-5 rounded-2xl bg-[#122c23] border border-amber-500/40 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Match Honors & Awards</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#183a2f] border border-emerald-900/60">
                <div className="text-[11px] text-amber-300/80 font-bold uppercase">👑 Player of the Match</div>
                <div className="font-extrabold text-base text-white">{awards.manOfTheMatch}</div>
                {awards.momReason && <div className="text-[11px] text-emerald-300/70 mt-0.5">{awards.momReason}</div>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#183a2f] border border-emerald-900/60">
                  <div className="text-[10px] text-sky-400 font-bold uppercase">🏏 Best Batter</div>
                  <div className="font-bold text-xs text-white truncate">{awards.bestBatsman}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#183a2f] border border-emerald-900/60">
                  <div className="text-[10px] text-purple-400 font-bold uppercase">🎳 Best Bowler</div>
                  <div className="font-bold text-xs text-white truncate">{awards.bestBowler}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onOpenPosterModal}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate & Share Match Poster</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {onStartRematchSameSquad && (
              <button
                onClick={onStartRematchSameSquad}
                className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <span>⚡ Same Squad Rematch</span>
              </button>
            )}
            <button
              onClick={onStartNewMatch}
              className={`py-3 rounded-2xl bg-[#143427] hover:bg-[#1a4232] text-emerald-200 font-bold text-xs border border-emerald-800/60 transition-all ${
                !onStartRematchSameSquad ? 'col-span-2' : ''
              }`}
            >
              👥 New Match / Squads
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inn = match.innings === 1 ? match.inn1 : match.inn2;
  if (!inn) return null;

  const striker = inn.batting[inn.strikerIdx];
  const nonStriker = inn.batting[inn.nonStrikerIdx];
  const bowler = inn.bowling[inn.bowlerIdx];

  const battingTeamName = match.innings === 1
    ? (match.battingFirst === 'A' ? match.teamA.name : match.teamB.name)
    : (match.battingFirst === 'A' ? match.teamB.name : match.teamA.name);

  const target = match.innings === 2 && match.inn1 ? match.inn1.total + 1 : null;
  const needed = target !== null ? Math.max(0, target - inn.total) : null;
  const maxLegalBalls = match.overs * 6;
  const ballsLeft = Math.max(0, maxLegalBalls - inn.legalBalls);
  const currentRunRate = inn.legalBalls > 0 ? ((inn.total / (inn.legalBalls / 6))).toFixed(2) : '0.00';
  const reqRunRate = (target !== null && ballsLeft > 0) ? ((needed! / (ballsLeft / 6))).toFixed(2) : null;

  return (
    <div className="max-w-md mx-auto py-3 px-3 space-y-3 select-none">
      {/* Unstarted Innings Alert Banner */}
      {(match.status === 'setup' || inn.strikerIdx < 0 || inn.bowlerIdx < 0) && isScorer && (
        <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-between gap-3 shadow-md">
          <div className="text-xs text-amber-200">
            <span className="font-bold text-amber-300 block">⚡ Ready to Begin Innings {match.innings}!</span>
            Confirm opening batters & bowler to start Innings {match.innings}.
          </div>
          {onOpenStartInnings && (
            <button
              onClick={onOpenStartInnings}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shrink-0 shadow transition-all active:scale-95 flex items-center gap-1"
            >
              <span>Begin Innings {match.innings}</span>
            </button>
          )}
        </div>
      )}

      {/* Free Hit Banner */}
      {inn.freeHit && (
        <div className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center font-black text-xs tracking-wider uppercase shadow-md shadow-purple-950/60 animate-pulse flex items-center justify-center gap-2">
          <span>⚡ FREE HIT DELIVERY — ONLY RUN OUT APPLIES</span>
        </div>
      )}

      {/* Live Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-b from-[#113828] to-[#0b261b] border border-emerald-600/30 text-center shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-1">
          <span className="font-extrabold uppercase tracking-wide">
            {battingTeamName} • Innings {match.innings}
          </span>
          <span className="font-semibold text-emerald-200/60">
            CRR: <strong className="text-emerald-200">{currentRunRate}</strong>
          </span>
        </div>

        {/* Big Score */}
        <div className="flex items-baseline justify-center gap-1.5 my-1">
          <span className="text-5xl font-black text-white tracking-tight font-display leading-none">
            {inn.total}
          </span>
          <span className="text-3xl font-extrabold text-emerald-400/80">
            /{inn.wickets}
          </span>
        </div>

        <div className="text-sm font-semibold text-emerald-300/90">
          {oversStr(inn.legalBalls)} <span className="text-xs text-emerald-300/60">/ {match.overs} ov</span>
        </div>

        {/* Target Info */}
        {target !== null && (
          <div className="mt-2.5 pt-2 border-t border-emerald-800/40 text-xs font-bold text-amber-400 flex items-center justify-center gap-2">
            <span>🎯 Target: <strong>{target}</strong></span>
            <span>•</span>
            <span>Need <strong>{needed}</strong> off <strong>{ballsLeft}b</strong></span>
            {reqRunRate && <span>(RRR: {reqRunRate})</span>}
          </div>
        )}
      </div>

      {/* Voice Recognition Active HUD Banner */}
      {voiceActive && (
        <div className="py-2 px-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-red-400" />
            <span className="font-bold">Listening:</span>
            <span className="font-mono text-white text-[11px]">{voiceTranscript || 'Say "Single", "Four", "Six", "Wide"...'}</span>
          </div>
        </div>
      )}

      {/* Ball-by-Ball Strip with Interactive Click-to-Edit */}
      <div className="p-3 rounded-2xl bg-[#0f281e] border border-emerald-900/60">
        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300/70 uppercase tracking-wider mb-2">
          <span>This Over Deliveries</span>
          <span className="text-[10px] text-emerald-400/80 lowercase">tap any ball to edit</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar min-h-[42px]">
          {inn.currentOver.length === 0 ? (
            <span className="text-xs text-emerald-200/40 italic">New over starting...</span>
          ) : (
            inn.currentOver.map((b, idx) => {
              let bgCls = 'bg-[#1e3a5f] text-white border-blue-400/30';
              if (b.type === 'wicket') bgCls = 'bg-red-600 text-white border-red-400 font-extrabold shadow-sm shadow-red-950/60';
              else if (b.type === 'wide' || b.type === 'noball') bgCls = 'bg-amber-500 text-amber-950 border-amber-300 font-black';
              else if (b.label === '4') bgCls = 'bg-blue-600 text-white border-blue-400 font-extrabold';
              else if (b.label === '6') bgCls = 'bg-purple-600 text-white border-purple-400 font-black shadow-sm shadow-purple-950/60';
              else if (b.label === '•') bgCls = 'bg-[#21352a] text-emerald-200/60 border-emerald-900/40';

              return (
                <button
                  key={b.id || idx}
                  onClick={() => {
                    audioHaptics.tapFeedback();
                    onOpenBallEditor(b, idx);
                  }}
                  title="Click to edit this ball"
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 transition-transform active:scale-90 hover:ring-2 hover:ring-emerald-400 ${bgCls}`}
                >
                  {b.label}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Batter Cards with Change Batsman Selection */}
      <div className="grid grid-cols-2 gap-2">
        {/* Striker */}
        <div className="p-3 rounded-2xl bg-[#143527] border-2 border-emerald-400 shadow-md shadow-emerald-950/40 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-100 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="truncate">{striker?.name || 'Striker'}</span>
            </div>
            <div className="flex items-center gap-1">
              {isScorer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    audioHaptics.tapFeedback();
                    onChangeStriker();
                  }}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1e4d3a] hover:bg-[#28634b] text-emerald-200 border border-emerald-600/50"
                  title="Change Striker"
                >
                  Change
                </button>
              )}
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500 text-emerald-950 uppercase">
                Strike
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-extrabold text-white">{striker?.runs || 0}</span>
            <span className="text-xs text-emerald-300/70">({striker?.balls || 0}b)</span>
          </div>
          <div className="text-[10px] text-emerald-300/60 mt-1 flex justify-between">
            <span>4s: <strong>{striker?.fours || 0}</strong> • 6s: <strong>{striker?.sixes || 0}</strong></span>
            <span>SR: <strong>{strikeRate(striker?.runs || 0, striker?.balls || 0)}</strong></span>
          </div>
        </div>

        {/* Non-Striker */}
        <div className="p-3 rounded-2xl bg-[#102b20] border border-emerald-900/60 relative">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-emerald-200/80 truncate">
              {nonStriker?.name || 'Non-Striker'}
            </span>
            {isScorer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  audioHaptics.tapFeedback();
                  onChangeNonStriker();
                }}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#173d2d] hover:bg-[#21543e] text-emerald-200 border border-emerald-700/50"
                title="Change Non-Striker"
              >
                Change
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-bold text-emerald-100">{nonStriker?.runs || 0}</span>
            <span className="text-xs text-emerald-300/60">({nonStriker?.balls || 0}b)</span>
          </div>
          <div className="text-[10px] text-emerald-300/60 mt-1 flex justify-between">
            <span>4s: <strong>{nonStriker?.fours || 0}</strong> • 6s: <strong>{nonStriker?.sixes || 0}</strong></span>
            <span>SR: <strong>{strikeRate(nonStriker?.runs || 0, nonStriker?.balls || 0)}</strong></span>
          </div>
        </div>
      </div>

      {/* Bowler Card */}
      <div className="p-3 rounded-2xl bg-[#102b20] border border-emerald-900/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Bowling</div>
          <div className="font-extrabold text-sm text-emerald-100">{bowler?.name || 'Bowler'}</div>
          <div className="text-xs text-emerald-300/70 mt-0.5">
            {oversStr(bowler?.totalBalls || 0)} ov • <strong>{bowler?.runs || 0}r</strong> • <strong>{bowler?.wickets || 0}w</strong> • Econ: {economyRate(bowler?.runs || 0, bowler?.totalBalls || 0)}
          </div>
        </div>
        {isScorer && (
          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              onChangeBowler();
            }}
            className="px-3 py-1.5 rounded-xl bg-[#173d2d] hover:bg-[#1e4d39] text-emerald-200 font-bold text-xs border border-emerald-700/50 transition-all active:scale-95"
          >
            Change Bowler
          </button>
        )}
      </div>

      {/* Keypad Section (Scorer Only) */}
      {isScorer ? (
        <div className="pt-1">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onScoreRuns(0)}
              className="py-3.5 rounded-2xl bg-[#1a382b] hover:bg-[#204636] active:scale-95 text-emerald-100 font-extrabold text-lg border border-emerald-800/60 transition-all shadow-sm"
            >
              0
            </button>
            <button
              onClick={() => onScoreRuns(1)}
              className="py-3.5 rounded-2xl bg-[#1a425f] hover:bg-[#22557a] active:scale-95 text-white font-extrabold text-lg border border-blue-500/40 transition-all shadow-sm"
            >
              1
            </button>
            <button
              onClick={() => onScoreRuns(2)}
              className="py-3.5 rounded-2xl bg-[#1a425f] hover:bg-[#22557a] active:scale-95 text-white font-extrabold text-lg border border-blue-500/40 transition-all shadow-sm"
            >
              2
            </button>
            <button
              onClick={() => onScoreRuns(3)}
              className="py-3.5 rounded-2xl bg-[#1a425f] hover:bg-[#22557a] active:scale-95 text-white font-extrabold text-lg border border-blue-500/40 transition-all shadow-sm"
            >
              3
            </button>

            <button
              onClick={() => onScoreRuns(4)}
              className="py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xl border border-blue-400 transition-all shadow-md shadow-blue-950/60"
            >
              4
            </button>
            <button
              onClick={() => onScoreRuns(6)}
              className="py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-xl border border-purple-400 transition-all shadow-md shadow-purple-950/60"
            >
              6
            </button>
            <button
              onClick={() => onOpenWideModal()}
              className="py-3.5 rounded-2xl bg-[#713f12] hover:bg-[#854d0e] active:scale-95 text-amber-200 font-bold text-xs border border-amber-600/40 transition-all uppercase"
            >
              Wide +
            </button>
            <button
              onClick={() => onOpenNoBallModal()}
              className="py-3.5 rounded-2xl bg-[#713f12] hover:bg-[#854d0e] active:scale-95 text-amber-200 font-bold text-xs border border-amber-600/40 transition-all uppercase"
            >
              NoBall +
            </button>

            <button
              onClick={() => onOpenWicketModal()}
              className="py-3.5 rounded-2xl bg-red-700 hover:bg-red-600 active:scale-95 text-white font-black text-sm border border-red-500 transition-all shadow-md shadow-red-950/60 uppercase"
            >
              Wicket
            </button>
            <button
              onClick={() => onOpenByeModal('bye')}
              className="py-3.5 rounded-2xl bg-[#2e3b52] hover:bg-[#3b4b68] active:scale-95 text-slate-200 font-bold text-xs border border-slate-600/40 transition-all uppercase"
            >
              Bye +
            </button>
            <button
              onClick={() => onOpenByeModal('legbye')}
              className="py-3.5 rounded-2xl bg-[#2e3b52] hover:bg-[#3b4b68] active:scale-95 text-slate-200 font-bold text-xs border border-slate-600/40 transition-all uppercase"
            >
              LegBye +
            </button>
            <button
              onClick={() => onUndo()}
              className="py-3.5 rounded-2xl bg-[#374151] hover:bg-[#4b5563] active:scale-95 text-gray-200 font-bold text-xs border border-gray-600/40 flex items-center justify-center gap-1 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#0e271e] border border-dashed border-emerald-800 text-center text-xs text-emerald-300/70">
          👁 <strong>View Only Mode</strong> — Login as a Scorer to record live deliveries.
        </div>
      )}

      {/* Quick Tools & Mid-Match Actions */}
      <div className="pt-2 flex flex-wrap gap-2">
        <button
          onClick={() => {
            audioHaptics.tapFeedback();
            onSwapStrike();
          }}
          className="flex-1 min-w-[100px] py-2.5 px-3 rounded-xl bg-[#122c23] hover:bg-[#183a2f] text-emerald-200 font-bold text-xs border border-emerald-800/60 flex items-center justify-center gap-1.5 transition-all"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Swap Strike</span>
        </button>

        {isScorer && (
          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              onRetireBatsman();
            }}
            className="flex-1 min-w-[70px] py-2.5 px-2 rounded-xl bg-[#122c23] hover:bg-[#183a2f] text-emerald-200 font-bold text-xs border border-emerald-800/60 flex items-center justify-center gap-1.5 transition-all"
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>Retire</span>
          </button>
        )}

        {isScorer && (
          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              onOpenReturnRetired();
            }}
            className="flex-1 min-w-[90px] py-2.5 px-2 rounded-xl bg-[#122c23] hover:bg-[#183a2f] text-emerald-200 font-bold text-xs border border-emerald-800/60 flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return Ret</span>
          </button>
        )}

        {isScorer && (
          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              onOpenAddPlayerMidMatch();
            }}
            className="flex-1 min-w-[80px] py-2.5 px-2 rounded-xl bg-[#122c23] hover:bg-[#183a2f] text-emerald-200 font-bold text-xs border border-emerald-800/60 flex items-center justify-center gap-1.5 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Player</span>
          </button>
        )}

        <button
          onClick={() => {
            audioHaptics.tapFeedback();
            onOpenPosterModal();
          }}
          className="p-2.5 rounded-xl bg-[#163e2e] hover:bg-[#1d4f3b] text-emerald-300 border border-emerald-700/60 flex items-center justify-center transition-all"
          title="Share Poster"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            audioHaptics.tapFeedback();
            onOpenQRModal();
          }}
          className="p-2.5 rounded-xl bg-[#163e2e] hover:bg-[#1d4f3b] text-emerald-300 border border-emerald-700/60 flex items-center justify-center transition-all"
          title="Spectator QR"
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
