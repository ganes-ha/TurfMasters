import React, { useState } from 'react';
import { X, Check, ShieldAlert } from 'lucide-react';
import { audioHaptics } from '../utils/audioHaptics';

interface ExtrasModalProps {
  type: 'wide' | 'noball' | 'bye' | 'legbye';
  onClose: () => void;
  onConfirmWide: (extraRuns: number) => void;
  onConfirmNoBall: (batRuns: number, offBat: boolean) => void;
  onConfirmByeLegBye: (kind: 'bye' | 'legbye', runs: number) => void;
}

export const ExtrasModal: React.FC<ExtrasModalProps> = ({
  type,
  onClose,
  onConfirmWide,
  onConfirmNoBall,
  onConfirmByeLegBye
}) => {
  const [extraRuns, setExtraRuns] = useState<number>(0);
  const [noBallRuns, setNoBallRuns] = useState<number>(0);
  const [offBat, setOffBat] = useState<boolean>(true);
  const [byeKind, setByeKind] = useState<'bye' | 'legbye'>(type === 'legbye' ? 'legbye' : 'bye');
  const [byeRuns, setByeRuns] = useState<number>(1);

  const handleConfirm = () => {
    audioHaptics.tapFeedback();
    if (type === 'wide') {
      onConfirmWide(extraRuns);
    } else if (type === 'noball') {
      onConfirmNoBall(noBallRuns, offBat);
    } else {
      onConfirmByeLegBye(byeKind, byeRuns);
    }
    onClose();
  };

  const titles = {
    wide: 'Wide Ball Extras',
    noball: 'No Ball Delivery',
    bye: 'Bye / Leg Bye Runs',
    legbye: 'Bye / Leg Bye Runs'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div>
            <h3 className="font-extrabold text-base text-emerald-100 font-display">
              {titles[type]}
            </h3>
            <p className="text-xs text-emerald-300/70">Select additional runs scored</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* WIDE BALL RUNS */}
          {type === 'wide' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                Base penalty: <strong>1 Wide Run</strong> + any additional runs ran or conceded via overthrows/boundary.
              </div>

              <div>
                <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-2 tracking-wider">
                  Additional Runs Conceded (Overthrow / Ran)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 6].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setExtraRuns(r)}
                      className={`py-2.5 rounded-xl font-black text-sm border transition-all ${
                        extraRuns === r
                          ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-md scale-105'
                          : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                      }`}
                    >
                      {r === 0 ? '+0 (Only Wd)' : `+${r}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center text-xs font-bold text-emerald-300 pt-1">
                Total Runs to Innings: <strong className="text-white text-sm">{1 + extraRuns}</strong>
              </div>
            </div>
          )}

          {/* NO BALL RUNS */}
          {type === 'noball' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs">
                Base penalty: <strong>1 No Ball Run</strong> + Free Hit on next legal delivery.
              </div>

              {/* Off bat or Bye/Extras */}
              <div className="flex gap-2 p-1 rounded-xl bg-[#0b2118] border border-emerald-900/60">
                <button
                  type="button"
                  onClick={() => setOffBat(true)}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                    offBat ? 'bg-emerald-500 text-emerald-950 shadow-sm' : 'text-emerald-300/70'
                  }`}
                >
                  🏏 Runs Off Bat (Credits Batter)
                </button>
                <button
                  type="button"
                  onClick={() => setOffBat(false)}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                    !offBat ? 'bg-purple-500 text-purple-950 shadow-sm' : 'text-emerald-300/70'
                  }`}
                >
                  👟 Bye / Overthrow Extras
                </button>
              </div>

              <div>
                <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-2 tracking-wider">
                  Runs Scored off the No Ball
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 6].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNoBallRuns(r)}
                      className={`py-2.5 rounded-xl font-black text-sm border transition-all ${
                        noBallRuns === r
                          ? 'bg-purple-500 text-purple-950 border-purple-400 shadow-md scale-105'
                          : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                      }`}
                    >
                      {r === 0 ? '0' : `+${r}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center text-xs font-bold text-emerald-300 pt-1">
                Total Runs Added: <strong className="text-white text-sm">{1 + noBallRuns}</strong> ({offBat && noBallRuns > 0 ? `${noBallRuns} to batsman` : 'extras only'})
              </div>
            </div>
          )}

          {/* BYE / LEG BYE RUNS */}
          {(type === 'bye' || type === 'legbye') && (
            <div className="space-y-3">
              <div className="flex gap-2 p-1 rounded-xl bg-[#0b2118] border border-emerald-900/60">
                <button
                  type="button"
                  onClick={() => setByeKind('bye')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                    byeKind === 'bye' ? 'bg-emerald-500 text-emerald-950 shadow-sm' : 'text-emerald-300/70'
                  }`}
                >
                  Bye (B)
                </button>
                <button
                  type="button"
                  onClick={() => setByeKind('legbye')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                    byeKind === 'legbye' ? 'bg-teal-500 text-teal-950 shadow-sm' : 'text-emerald-300/70'
                  }`}
                >
                  Leg Bye (Lb)
                </button>
              </div>

              <div>
                <label className="block font-bold text-emerald-300/80 uppercase text-[10px] mb-2 tracking-wider">
                  Number of Runs Completed
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 6].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setByeRuns(r)}
                      className={`py-2.5 rounded-xl font-black text-sm border transition-all ${
                        byeRuns === r
                          ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-md scale-105'
                          : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center text-xs font-bold text-emerald-300 pt-1">
                Recorded as: <strong className="text-white text-sm">{byeKind === 'bye' ? 'Bye' : 'Leg Bye'} +{byeRuns}</strong> (1 Legal ball added)
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 mt-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirm & Record Delivery</span>
          </button>
        </div>
      </div>
    </div>
  );
};
