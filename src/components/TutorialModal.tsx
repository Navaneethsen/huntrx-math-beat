import React from 'react';
import { Translations } from '../i18n/translations';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';
import { DerpyTigerMascot } from './CharacterArt';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="tutorial-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="light-surface-card relative w-full max-w-lg bg-gradient-to-b from-[#1f0d3d] to-[#0f0520] border-2 border-fuchsia-400/60 rounded-3xl p-6 text-white shadow-[0_0_50px_rgba(232,121,249,0.4)]">
        <button
          type="button"
          data-testid="close-tutorial-btn"
          onClick={onClose}
          className="light-pill-btn absolute top-4 right-4 p-2 rounded-full bg-purple-900/70 hover:bg-purple-800 text-purple-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <DerpyTigerMascot size={56} excited />
          <div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-amber-300">
              {t.tutorialTitle}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">{t.tutorialIntro}</p>
          </div>
        </div>

        {/* Visual Mini Diagram of a 4-Number Kakooma Seal [3, 4, 7, 9] */}
        <div className="bg-purple-950/80 border border-fuchsia-500/40 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-around gap-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg viewBox="0 0 140 140" className="absolute inset-0 w-full h-full">
              <circle cx="70" cy="70" r="46" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" />
              {/* Line connecting 3 + 4 -> 7 */}
              <line x1="70" y1="24" x2="116" y2="70" stroke="#fbbf24" strokeWidth="4" />
              <line x1="24" y1="70" x2="116" y2="70" stroke="#fbbf24" strokeWidth="4" />
            </svg>
            {/* Center + */}
            <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs z-10">
              3+4=7
            </div>
            {/* Top: 3 */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-cyan-500 border-2 border-white text-slate-950 font-black flex items-center justify-center">
              3
            </div>
            {/* Left: 4 */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyan-500 border-2 border-white text-slate-950 font-black flex items-center justify-center">
              4
            </div>
            {/* Right: 7 (Target!) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-amber-400 border-2 border-white text-slate-950 font-black flex items-center justify-center scale-110 shadow-[0_0_16px_rgba(251,191,36,1)]">
              7
            </div>
            {/* Bottom: 9 */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-purple-900 border border-purple-400 text-purple-200 font-bold flex items-center justify-center">
              9
            </div>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm flex-1">
            <div className="bg-purple-900/50 rounded-xl p-2.5 border border-purple-700/50">
              <div className="font-bold text-cyan-300">{t.tutorialStep1Title}</div>
              <div className="text-purple-100">{t.tutorialStep1Desc}</div>
            </div>
            <div className="bg-purple-900/50 rounded-xl p-2.5 border border-purple-700/50">
              <div className="font-bold text-pink-300">{t.tutorialStep2Title}</div>
              <div className="text-purple-100">{t.tutorialStep2Desc}</div>
            </div>
            <div className="bg-amber-500/20 rounded-xl p-2.5 border border-amber-400/60">
              <div className="font-bold text-amber-300 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {t.tutorialStep3Title}
              </div>
              <div className="text-amber-100">{t.tutorialStep3Desc}</div>
            </div>
          </div>
        </div>

        {/* Dedicated Credit & Tribute to Greg Tang (Creator of Kakooma®) */}
        <div className="bg-slate-950/90 border border-amber-400/50 rounded-2xl p-3.5 mb-4 text-xs">
          <div className="font-display font-black text-amber-300 text-xs sm:text-sm mb-1 flex items-center justify-between gap-2">
            <span>🌟 {t.gregTangCreditTitle}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px]">
              Kakooma®
            </span>
          </div>
          <p className="text-purple-100/90 leading-relaxed mb-2">
            {t.gregTangCreditText}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://tangmath.com/kakooma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-extrabold text-cyan-300 hover:text-cyan-200 underline decoration-cyan-400/60"
            >
              {t.gregTangVisitLink}
            </a>
            <a
              href="https://tangmath.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-pink-300 hover:text-pink-200 underline decoration-pink-400/60"
            >
              GregTangMath.com ↗
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 text-slate-950 font-display font-black text-base sm:text-lg shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {t.tutorialGotItBtn}
        </button>
      </div>
    </div>
  );
};
