import React, { useState } from 'react';
import { 
  Share2, 
  Sparkles, 
  QrCode, 
  Trophy, 
  MessageSquare, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Match } from '../types';
import { oversStr, strikeRate, economyRate } from '../utils/cricketRules';
import { shareToWhatsApp } from '../utils/socialGraphics';
import { audioHaptics } from '../utils/audioHaptics';

interface ScorecardScreenProps {
  match: Match | null;
  onOpenPosterModal: () => void;
  onOpenQRModal: () => void;
}

export const ScorecardScreen: React.FC<ScorecardScreenProps> = ({
  match,
  onOpenPosterModal,
  onOpenQRModal
}) => {
  const [selectedInnings, setSelectedInnings] = useState<1 | 2>(1);

  if (!match) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center text-emerald-300/70">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl">
          📊
        </div>
        <h3 className="font-bold text-base text-emerald-100 font-display">No Scorecard Available</h3>
        <p className="text-xs mt-1">Start or load a match to view complete ball-by-ball analysis.</p>
      </div>
    );
  }

  const inn1 = match.inn1;
  const inn2 = match.inn2;
  const currentInn = selectedInnings === 1 ? inn1 : inn2;

  const team1Name = match.battingFirst === 'A' ? match.teamA.name : match.teamB.name;
  const team2Name = match.battingFirst === 'A' ? match.teamB.name : match.teamA.name;
  const displayTeamName = selectedInnings === 1 ? team1Name : team2Name;

  const batters = currentInn?.batting.filter(b => b.order >= 0 || b.balls > 0 || b.out || b.runs > 0) || [];
  const yetToBat = currentInn?.batting.filter(b => b.order === -1 && b.balls === 0 && !b.out && !b.retired) || [];
  const bowlers = currentInn?.bowling.filter(b => b.totalBalls > 0 || b.wides > 0 || b.noballs > 0 || b.wickets > 0) || [];
  const fow = currentInn?.fallOfWickets || [];
  const awards = match.awards;

  return (
    <div className="max-w-md mx-auto py-4 px-3 space-y-3">
      {/* Top Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-b from-[#113526] to-[#0a2318] border border-emerald-800/60 shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs text-emerald-300/80">
          <span className="font-bold">{match.teamA.name} vs {match.teamB.name}</span>
          <span>{new Date(match.date).toLocaleDateString()}</span>
        </div>

        {match.result && (
          <div className="text-sm font-extrabold text-emerald-400">
            🏆 {match.result}
          </div>
        )}

        {/* Innings Tabs */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              setSelectedInnings(1);
            }}
            className={`p-2.5 rounded-2xl border text-left transition-all ${
              selectedInnings === 1
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                : 'bg-[#143427] border-emerald-900/60 text-emerald-200/70 hover:bg-[#1a4232]'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-emerald-400 truncate">{team1Name}</div>
            <div className="text-base font-extrabold text-white">
              {inn1 ? `${inn1.total}/${inn1.wickets}` : '—'}
            </div>
            <div className="text-[10px] text-emerald-300/70">
              {inn1 ? `${oversStr(inn1.legalBalls)} ov` : 'Yet to bat'}
            </div>
          </button>

          <button
            onClick={() => {
              audioHaptics.tapFeedback();
              setSelectedInnings(2);
            }}
            className={`p-2.5 rounded-2xl border text-left transition-all ${
              selectedInnings === 2
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                : 'bg-[#143427] border-emerald-900/60 text-emerald-200/70 hover:bg-[#1a4232]'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-emerald-400 truncate">{team2Name}</div>
            <div className="text-base font-extrabold text-white">
              {inn2 ? `${inn2.total}/${inn2.wickets}` : '—'}
            </div>
            <div className="text-[10px] text-emerald-300/70">
              {inn2 ? `${oversStr(inn2.legalBalls)} ov` : 'Yet to bat'}
            </div>
          </button>
        </div>
      </div>

      {/* Social & Viral Share Bar */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            audioHaptics.tapFeedback();
            shareToWhatsApp(match);
          }}
          className="p-2.5 rounded-2xl bg-[#1f6f43] hover:bg-[#25824f] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md shadow-emerald-950/60 transition-all active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={() => {
            audioHaptics.tapFeedback();
            onOpenPosterModal();
          }}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-md shadow-emerald-950/60 transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Story Poster</span>
        </button>

        <button
          onClick={() => {
            audioHaptics.tapFeedback();
            onOpenQRModal();
          }}
          className="p-2.5 rounded-2xl bg-[#163e2e] hover:bg-[#1d4f3b] text-emerald-200 font-bold text-xs border border-emerald-700/60 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <QrCode className="w-4 h-4" />
          <span>Spectator QR</span>
        </button>
      </div>

      {/* Match Awards Card (If Available) */}
      {awards && (
        <div className="p-4 rounded-2xl bg-[#122c23] border border-amber-500/40 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>Match Honors</span>
          </div>
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between items-center text-emerald-100">
              <span className="text-emerald-300/70">👑 Player of the Match:</span>
              <strong className="text-white font-extrabold">{awards.manOfTheMatch}</strong>
            </div>
            <div className="flex justify-between items-center text-emerald-100">
              <span className="text-emerald-300/70">🏏 Best Batter:</span>
              <strong className="text-white">{awards.bestBatsman}</strong>
            </div>
            <div className="flex justify-between items-center text-emerald-100">
              <span className="text-emerald-300/70">🎳 Best Bowler:</span>
              <strong className="text-white">{awards.bestBowler}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Innings Scorecard Table */}
      {currentInn ? (
        <div className="p-4 rounded-3xl bg-[#0f281e] border border-emerald-900/60 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
            <h4 className="font-extrabold text-sm text-emerald-200 font-display">
              {displayTeamName} Innings
            </h4>
            <span className="font-bold text-xs text-emerald-400">
              {currentInn.total}/{currentInn.wickets} ({oversStr(currentInn.legalBalls)} ov)
            </span>
          </div>

          {/* Batting Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-900/60 text-emerald-300/60 text-[10px] uppercase font-bold">
                  <th className="pb-1.5">Batter</th>
                  <th className="pb-1.5 text-right">R</th>
                  <th className="pb-1.5 text-right">B</th>
                  <th className="pb-1.5 text-right">4s</th>
                  <th className="pb-1.5 text-right">6s</th>
                  <th className="pb-1.5 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/60">
                {batters.map((b) => (
                  <tr key={b.name} className="hover:bg-emerald-950/30">
                    <td className="py-2 pr-2">
                      <div className="font-bold text-emerald-100">{b.name}</div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        {b.out ? b.howOut || 'out' : b.retired ? 'retired' : 'not out *'}
                      </div>
                    </td>
                    <td className="py-2 text-right font-extrabold text-white">{b.runs}</td>
                    <td className="py-2 text-right text-emerald-300/70">{b.balls}</td>
                    <td className="py-2 text-right text-emerald-300/70">{b.fours}</td>
                    <td className="py-2 text-right text-emerald-300/70">{b.sixes}</td>
                    <td className="py-2 text-right text-emerald-400/80 font-mono">
                      {strikeRate(b.runs, b.balls)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Extras & Totals */}
          <div className="pt-2 border-t border-emerald-900/60 space-y-1 text-xs">
            <div className="flex justify-between text-emerald-300/80">
              <span>Extras: <strong>{currentInn.extras.total}</strong> (Wd {currentInn.extras.wides}, Nb {currentInn.extras.noballs}, B {currentInn.extras.byes}, Lb {currentInn.extras.legbyes})</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-white pt-1">
              <span>Total:</span>
              <span>{currentInn.total}/{currentInn.wickets} ({oversStr(currentInn.legalBalls)} overs)</span>
            </div>
          </div>

          {/* Yet to Bat */}
          {yetToBat.length > 0 && (
            <div className="pt-2 border-t border-emerald-900/60 text-xs">
              <span className="text-emerald-400/80 font-bold uppercase text-[10px] block mb-1">Yet to bat:</span>
              <p className="text-emerald-200/70 leading-relaxed">
                {yetToBat.map(b => b.name).join(' • ')}
              </p>
            </div>
          )}

          {/* Fall of Wickets */}
          {fow.length > 0 && (
            <div className="pt-2 border-t border-emerald-900/60 text-xs">
              <span className="text-emerald-400/80 font-bold uppercase text-[10px] block mb-1">Fall of Wickets:</span>
              <div className="flex flex-wrap gap-2 text-emerald-300/80 text-[11px]">
                {fow.map(f => (
                  <span key={f.wicket} className="px-2 py-1 rounded-lg bg-[#143427] border border-emerald-900/60">
                    <strong>{f.score}/{f.wicket}</strong> ({f.batsman}, {f.overs} ov)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bowling Analysis Table */}
          <div className="pt-3 border-t border-emerald-900/60">
            <h5 className="font-extrabold text-xs text-emerald-200 uppercase tracking-wider mb-2">
              Bowling Analysis
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-900/60 text-emerald-300/60 text-[10px] uppercase font-bold">
                    <th className="pb-1.5">Bowler</th>
                    <th className="pb-1.5 text-right">O</th>
                    <th className="pb-1.5 text-right">M</th>
                    <th className="pb-1.5 text-right">R</th>
                    <th className="pb-1.5 text-right">W</th>
                    <th className="pb-1.5 text-right">Econ</th>
                    <th className="pb-1.5 text-right">Wd</th>
                    <th className="pb-1.5 text-right">Nb</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60">
                  {bowlers.map((bw) => (
                    <tr key={bw.name} className="hover:bg-emerald-950/30">
                      <td className="py-2 font-bold text-emerald-100">{bw.name}</td>
                      <td className="py-2 text-right">{oversStr(bw.totalBalls)}</td>
                      <td className="py-2 text-right text-emerald-300/70">{bw.maidens}</td>
                      <td className="py-2 text-right font-bold text-white">{bw.runs}</td>
                      <td className="py-2 text-right font-extrabold text-emerald-400">{bw.wickets}</td>
                      <td className="py-2 text-right text-emerald-300/80 font-mono">
                        {economyRate(bw.runs, bw.totalBalls)}
                      </td>
                      <td className="py-2 text-right text-emerald-300/60">{bw.wides}</td>
                      <td className="py-2 text-right text-emerald-300/60">{bw.noballs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-[#0f281e] text-center text-xs text-emerald-300/70 border border-emerald-900/60">
          Innings {selectedInnings} has not commenced yet.
        </div>
      )}
    </div>
  );
};
