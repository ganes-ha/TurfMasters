import React, { useState } from 'react';
import { Edit3, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { BallDelivery } from '../types';

interface BallEditorModalProps {
  delivery: BallDelivery;
  ballIndex: number;
  onClose: () => void;
  onUpdateDelivery: (index: number, updated: Partial<BallDelivery>) => void;
  onDeleteDelivery: (index: number) => void;
}

export const BallEditorModal: React.FC<BallEditorModalProps> = ({
  delivery,
  ballIndex,
  onClose,
  onUpdateDelivery,
  onDeleteDelivery
}) => {
  const [runs, setRuns] = useState<number>(delivery.runs);
  const [type, setType] = useState<BallDelivery['type']>(delivery.type);
  const [extraRuns, setExtraRuns] = useState<number>(delivery.extraRuns || 0);

  const handleSave = () => {
    let label = String(runs);
    let isLegal = true;

    if (type === 'wide') {
      label = extraRuns > 0 ? `Wd+${extraRuns}` : 'Wd';
      isLegal = false;
    } else if (type === 'noball') {
      label = runs > 0 ? `Nb+${runs}` : 'Nb';
      isLegal = false;
    } else if (type === 'bye') {
      label = `B${runs > 0 ? runs : ''}`;
      isLegal = true;
    } else if (type === 'legbye') {
      label = `Lb${runs > 0 ? runs : ''}`;
      isLegal = true;
    } else if (type === 'wicket') {
      label = 'W';
      isLegal = true;
    } else if (runs === 0) {
      label = '•';
    }

    onUpdateDelivery(ballIndex, {
      runs,
      type,
      extraRuns: (type === 'wide') ? extraRuns : 0,
      label,
      isLegal
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800/80 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-100 font-display">
                Edit Delivery #{ballIndex + 1}
              </h3>
              <p className="text-xs text-emerald-300/60">
                Bowler: <strong className="text-emerald-200">{delivery.bowlerName}</strong> • Striker: <strong className="text-emerald-200">{delivery.strikerName}</strong>
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

        {/* Form Body */}
        <div className="py-4 space-y-4">
          {/* Delivery Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-2">
              Delivery Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['runs', 'wide', 'noball', 'bye', 'legbye', 'wicket'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold capitalize transition-all border ${
                    type === t
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-sm'
                      : 'bg-[#143427] text-emerald-200/80 border-emerald-900/60 hover:bg-[#1a4232]'
                  }`}
                >
                  {t === 'noball' ? 'No Ball' : t === 'legbye' ? 'Leg Bye' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Runs Scored */}
          {type !== 'wicket' && (
            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-2">
                {type === 'wide' ? 'Extra Runs Taken on Wide (+1 auto)' : type === 'noball' ? 'Runs off Bat (+1 auto)' : 'Runs Scored'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      if (type === 'wide') setExtraRuns(r);
                      else setRuns(r);
                    }}
                    className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${
                      (type === 'wide' ? extraRuns === r : runs === r)
                        ? 'bg-emerald-500 text-emerald-950 border-emerald-400 font-extrabold shadow-md'
                        : 'bg-[#143427] text-emerald-100 border-emerald-900/60 hover:bg-[#1a4232]'
                    }`}
                  >
                    {r === 0 ? '0 (Dot)' : r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Modifying this ball will recalculate the over count, strike batsman, and score total automatically.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-emerald-900/60">
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this delivery completely?')) {
                onDeleteDelivery(ballIndex);
                onClose();
              }
            }}
            className="px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Ball</span>
          </button>
          <div className="flex-1 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#143427] hover:bg-[#1a4232] text-emerald-200 border border-emerald-900/60 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
            >
              <Check className="w-4 h-4" />
              <span>Apply Fix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
