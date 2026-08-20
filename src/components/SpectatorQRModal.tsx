import React, { useEffect, useState } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, Radio, Sparkles } from 'lucide-react';
import { generateSpectatorQRCode } from '../utils/socialGraphics';
import { audioHaptics } from '../utils/audioHaptics';

interface SpectatorQRModalProps {
  onClose: () => void;
  matchId?: string;
}

export const SpectatorQRModal: React.FC<SpectatorQRModalProps> = ({ onClose, matchId }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const spectatorUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?spectate=true${matchId ? `&matchId=${encodeURIComponent(matchId)}` : ''}`
    : '';

  useEffect(() => {
    if (spectatorUrl) {
      generateSpectatorQRCode(spectatorUrl).then(url => {
        setQrDataUrl(url);
      });
    }
  }, [spectatorUrl]);

  const handleCopyLink = () => {
    audioHaptics.tapFeedback();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(spectatorUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    audioHaptics.tapFeedback();
    window.open(spectatorUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e271d] border border-emerald-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 shadow-inner">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
          Live Firebase Stream
        </div>

        <h3 className="font-extrabold text-lg text-emerald-100 font-display">
          Spectator Live Broadcast
        </h3>
        <p className="text-xs text-emerald-300/70 mt-1 mb-3">
          Share this QR code with audience in the stands or sidelines to stream balls, wickets & run rate live with zero delay.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-2xl inline-block shadow-xl mx-auto mb-3 border-4 border-emerald-500/20">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Spectator Live View QR Code" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-500">
              Generating Live QR...
            </div>
          )}
        </div>

        {/* URL Box */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#071610] border border-emerald-900/80 mb-3 text-left">
          <span className="text-[11px] text-emerald-200/90 truncate flex-1 font-mono pl-1">
            {spectatorUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-1 shrink-0 shadow"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleOpenLink}
            className="py-2.5 rounded-xl bg-[#143427] hover:bg-[#1b4333] text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-800/60"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Link</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-emerald-950 text-xs font-black"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
