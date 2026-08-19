import React, { useState } from 'react';
import { X, UserMinus, ShieldAlert } from 'lucide-react';
import { Innings } from '../types';

interface WicketModalProps {
  innings: Innings;
  onClose: () => void;
  onConfirmWicket: (wicketData: {
    howOut: string;
    outPlayer: 'striker' | 'nonstriker';
    bowlerName: string;
    fielder?: string;
    runs?: number;
    onExtra?: boolean;
    extraType?: 'wide' | 'noball';
  }) => void;
}

export const WicketModal: React.FC<WicketModalProps> = ({
  innings,
  onClose,
  onConfirmWicket
}) => {
  const isFreeHit = innings.freeHit;
  const striker = innings.batting[innings.strikerIdx];
  const nonStriker = innings.batting[innings.nonStrikerIdx];
  const bowler = innings.bowling[innings.bowlerIdx];

  const [selectedDismissal, setSelectedDismissal] = useState<string>(isFreeHit ? 'run out' : 'bowled');
  const [outPlayer, setOutPlayer] = useState<'striker' | 'nonstriker'>('striker');
  const [fielderName, setFielderName] = useState<string>(bowler?.name || '');
  const [completedRuns, setCompletedRuns] = useState<number>(0);
  const [onExtra, setOnExtra] = useState<boolean>(false);
  const [extraType, setExtraType] = useState<'wide' | 'noball'>('wide');

  const fieldingPlayers = innings.bowling.map(b => b.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmWicket({
      howOut: selectedDismissal,
      outPlayer,
      bowlerName: bowler?.name || 'Bowler',
      fielder: ['caught', 'stumped', 'run out'].includes(selectedDismissal) ? fielderName : undefined,
      runs: selectedDismissal === 'run out' ? completedRuns : 0,
      onExtra: selectedDismissal === 'run out' ? onExtra : false,
      extraType: (selectedDismissal === 'run out' && onExtra) ? extraType : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#122c23] border border-red-900/60 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center">
              <UserMinus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-red-200 font-display">
                Record Wicket {isFreeHit ? '(Free Hit)' : ''}
              </h3>
              <p className="text-xs text-emerald-300/70">
                Bowler: <strong className="text-emerald-200">{bowler?.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isFreeHit && (
          <div className="mt-3 p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
            <span>On a Free Hit, only <strong>Run Out</strong> is an allowable dismissal.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Dismissal Method Buttons */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-2">
              Dismissal Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(isFreeHit 
                ? ['run out'] 
                : ['bowled', 'caught', 'stumped', 'lbw', 'hit wicket', 'run out']
              ).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedDismissal(type)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                    selectedDismissal === type
                      ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-950/50'
                      : 'bg-[#1a3a2e] text-emerald-100 border-emerald-900/60 hover:bg-[#204a3b]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Caught / Stumped Fielder Picker */}
          {(selectedDismissal === 'caught' || selectedDismissal === 'stumped') && (
            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                {selectedDismissal === 'caught' ? 'Who took the catch?' : 'Who stumped? (Keeper)'}
              </label>
              <select
                value={fielderName}
                onChange={e => setFielderName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1a3a2e] border border-emerald-800 text-emerald-100 text-sm font-semibold focus:outline-none focus:border-emerald-400"
              >
                {fieldingPlayers.map(name => (
                  <option key={name} value={name}>
                    {name} {name === bowler?.name ? '(Bowler - c&b)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Run Out Specifics */}
          {selectedDismissal === 'run out' && (
            <div className="space-y-3 p-3 rounded-xl bg-[#18352b] border border-emerald-900/60">
              {/* Who is out */}
              <div>
                <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                  Which Batsman is Run Out?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutPlayer('striker')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      outPlayer === 'striker'
                        ? 'bg-red-500 text-white border-red-400'
                        : 'bg-[#122c23] text-emerald-200 border-emerald-900/60'
                    }`}
                  >
                    Striker ({striker?.name})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutPlayer('nonstriker')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      outPlayer === 'nonstriker'
                        ? 'bg-red-500 text-white border-red-400'
                        : 'bg-[#122c23] text-emerald-200 border-emerald-900/60'
                    }`}
                  >
                    Non-Striker ({nonStriker?.name})
                  </button>
                </div>
              </div>

              {/* Fielder */}
              <div>
                <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1">
                  Effected by Fielder
                </label>
                <select
                  value={fielderName}
                  onChange={e => setFielderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#122c23] border border-emerald-800 text-emerald-100 text-xs font-semibold"
                >
                  {fieldingPlayers.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Completed Runs */}
              <div>
                <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1">
                  Runs Completed Before Run-Out
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCompletedRuns(r)}
                      className={`py-1.5 rounded-lg text-xs font-bold border ${
                        completedRuns === r
                          ? 'bg-emerald-500 text-emerald-950 border-emerald-400'
                          : 'bg-[#122c23] text-emerald-200 border-emerald-900/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* On Wide / No Ball */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs text-emerald-200 font-medium">Was delivery Wide/No-Ball?</label>
                <input
                  type="checkbox"
                  checked={onExtra}
                  onChange={e => setOnExtra(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>

              {onExtra && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraType('wide')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      extraType === 'wide' ? 'bg-amber-500 text-amber-950 border-amber-400' : 'bg-[#122c23] text-emerald-200'
                    }`}
                  >
                    Wide Ball
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtraType('noball')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      extraType === 'noball' ? 'bg-amber-500 text-amber-950 border-amber-400' : 'bg-[#122c23] text-emerald-200'
                    }`}
                  >
                    No Ball
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t border-emerald-900/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#18352b] hover:bg-[#204a3b] text-emerald-200 font-semibold text-xs border border-emerald-900/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-950/60"
            >
              Confirm Wicket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
