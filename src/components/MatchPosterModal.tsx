import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Sparkles, Check } from 'lucide-react';
import { Match } from '../types';
import { generateMatchPosterCanvas, shareToWhatsApp } from '../utils/socialGraphics';
import { audioHaptics } from '../utils/audioHaptics';

interface MatchPosterModalProps {
  match: Match;
  onClose: () => void;
}

export const MatchPosterModal: React.FC<MatchPosterModalProps> = ({ match, onClose }) => {
  const [aspectRatio, setAspectRatio] = useState<'story' | 'feed'>('story');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    generateMatchPosterCanvas(match, aspectRatio)
      .then((canvas) => {
        if (!isMounted) return;
        canvasRef.current = canvas;
        if (canvasContainerRef.current) {
          canvasContainerRef.current.innerHTML = '';
          canvas.className = 'w-full h-auto rounded-xl shadow-2xl border border-emerald-500/30';
          canvasContainerRef.current.appendChild(canvas);
        }
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Failed to generate poster:', err);
        setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [match, aspectRatio]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    audioHaptics.tapFeedback();
    const link = document.createElement('a');
    link.download = `CricVault_Match_${match.id}_${aspectRatio}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleNativeShare = async () => {
    audioHaptics.tapFeedback();
    if (!canvasRef.current) return;

    if (navigator.share && navigator.canShare) {
      try {
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `cricvault_match.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${match.teamA.name} vs ${match.teamB.name} - CricVault`,
              text: `Check out the match result from CricVault: ${match.result}`,
              files: [file]
            });
          }
        });
      } catch (err) {
        console.warn('Native share error:', err);
      }
    } else {
      // Fallback: Copy link or download
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0b2018] border border-emerald-800/80 rounded-3xl max-w-lg w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 text-emerald-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-100 font-display">
                Match Story & Poster Generator
              </h3>
              <p className="text-xs text-emerald-300/70">
                HD Instagram Story & Status Cards
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

        {/* Format Selector Bar */}
        <div className="px-4 py-2.5 bg-[#0e271e] border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAspectRatio('story');
                audioHaptics.tapFeedback();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                aspectRatio === 'story'
                  ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-sm'
                  : 'bg-[#143427] text-emerald-200/80 border-emerald-900/60'
              }`}
            >
              📱 9:16 Story (Status)
            </button>
            <button
              onClick={() => {
                setAspectRatio('feed');
                audioHaptics.tapFeedback();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                aspectRatio === 'feed'
                  ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-sm'
                  : 'bg-[#143427] text-emerald-200/80 border-emerald-900/60'
              }`}
            >
              🖼️ 1:1 Feed Post
            </button>
          </div>
        </div>

        {/* Canvas Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-[#071610]">
          {isGenerating ? (
            <div className="py-20 text-center text-emerald-300/70">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold">Designing Graphic Poster...</p>
            </div>
          ) : (
            <div ref={canvasContainerRef} className="max-w-[320px] sm:max-w-[360px] w-full" />
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 bg-[#0e271e] border-t border-emerald-900/60 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download Image</span>
            </button>
            <button
              onClick={handleNativeShare}
              className="px-4 py-3 rounded-xl bg-[#1a4232] hover:bg-[#205540] text-emerald-200 border border-emerald-700/60 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          <button
            onClick={() => {
              shareToWhatsApp(match);
              audioHaptics.tapFeedback();
            }}
            className="w-full py-2.5 rounded-xl bg-[#1f6f43] hover:bg-[#25824f] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-emerald-600/40"
          >
            <span>💬 Share Text Summary to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
