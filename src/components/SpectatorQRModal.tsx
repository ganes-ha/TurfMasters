import React, { useEffect, useState } from 'react';
import { X, QrCode, Copy, Check, ExternalLink } from 'lucide-react';
import { generateSpectatorQRCode } from '../utils/socialGraphics';
import { audioHaptics } from '../utils/audioHaptics';

interface SpectatorQRModalProps {
  onClose: () => void;
}

export const SpectatorQRModal: React.FC<SpectatorQRModalProps> = ({ onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    generateSpectatorQRCode(currentUrl).then(url => {
      setQrDataUrl(url);
    });
  }, [currentUrl]);

  const handleCopyLink = () => {
    audioHaptics.tapFeedback();
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102a20] border border-emerald-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="font-extrabold text-lg text-emerald-100 font-display">
          Spectator Live View
        </h3>
        <p className="text-xs text-emerald-300/70 mt-1 mb-4">
          Scan this QR code from the pavilion or turf sidelines to watch live scores in real-time.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Spectator Live View QR Code" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-500">
              Generating QR...
            </div>
          )}
        </div>

        {/* URL Box */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0a1f18] border border-emerald-900/80 mb-3 text-left">
          <span className="text-xs text-emerald-200/80 truncate flex-1 font-mono pl-1">
            {currentUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs flex items-center gap-1 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#143427] hover:bg-[#1a4232] text-emerald-200 text-xs font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
};
