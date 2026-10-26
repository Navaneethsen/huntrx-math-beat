import React from 'react';
import {
  KakoomaChainPuzzle,
  KakoomaPuzzle,
  formatPuzzleValue,
} from '../engine/kakoomaGenerator';
import { HonmoonSeal } from './HonmoonSeal';
import { Translations, Language } from '../i18n/translations';
import { Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface HonmoonChainBoardProps {
  chain: KakoomaChainPuzzle;
  solvedOuterIndices: boolean[];
  solvedOuterEquations: ({ a: number; b: number; target: number } | null)[];
  activeOuterIndex: number;
  onSelectOuterIndex: (idx: number) => void;
  onSelectNumber: (num: number) => void;
  hintLevel: 0 | 1 | 2;
  wrongNumber: number | null;
  activeSolvedEquation: { a: number; b: number; target: number } | null;
  mathTrickMessage?: string;
  onCloseSolved?: () => void;
  lang?: Language;
  eliminatedNumbers?: number[];
  floatingBanner?: { text: string; sub?: string } | null;
  isGoldenMode: boolean;
  t: Translations;
}

export const HonmoonChainBoard: React.FC<HonmoonChainBoardProps> = ({
  chain,
  solvedOuterIndices,
  solvedOuterEquations,
  activeOuterIndex,
  onSelectOuterIndex,
  onSelectNumber,
  hintLevel,
  wrongNumber,
  activeSolvedEquation,
  mathTrickMessage = '',
  onCloseSolved,
  lang = 'nl',
  eliminatedNumbers = [],
  floatingBanner = null,
  isGoldenMode,
  t,
}) => {
  const outerCount = chain.outerPuzzles.length;
  const solvedCount = solvedOuterIndices.filter(Boolean).length;
  const isMasterActive = activeOuterIndex === -1;

  const currentPuzzle: KakoomaPuzzle = isMasterActive
    ? chain.centerPuzzle
    : chain.outerPuzzles[activeOuterIndex];

  return (
    <div className="w-full flex flex-col-reverse lg:flex-row items-center justify-center gap-4 sm:gap-6">
      {/* Left / Bottom on Mobile: The Honmoon Multi-Seal Constellation Map */}
      <div className="w-full lg:w-5/12 bg-purple-950/50 border border-fuchsia-500/30 rounded-3xl p-4 flex flex-col items-center shadow-xl">
        <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{t.outerSealsProgress(solvedCount, outerCount)}</span>
        </div>

        <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center my-1">
          <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full pointer-events-none">
            <circle
              cx="120"
              cy="120"
              r="82"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="5 5"
              className="opacity-40"
            />
            {chain.outerPuzzles.map((_, idx) => {
              const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / outerCount;
              const x = 120 + 82 * Math.cos(angle);
              const y = 120 + 82 * Math.sin(angle);
              const isSolved = solvedOuterIndices[idx];
              return (
                <line
                  key={`beam-${idx}`}
                  x1={x}
                  y1={y}
                  x2={120}
                  y2={120}
                  stroke={isSolved ? '#fbbf24' : '#6b21a8'}
                  strokeWidth={isSolved ? '4' : '2'}
                  strokeDasharray={isSolved ? undefined : '4 4'}
                />
              );
            })}
          </svg>

          {/* Center Master Seal Node in the Constellation */}
          <div
            className={`relative z-10 w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center text-center p-2 transition-all duration-300 ${
              isMasterActive
                ? 'bg-gradient-to-b from-amber-400 to-orange-500 border-white text-slate-950 scale-110 shadow-[0_0_30px_rgba(251,191,36,0.9)]'
                : 'bg-purple-950/90 border-purple-500/50 text-purple-300'
            }`}
          >
            {isMasterActive ? (
              <>
                <Sparkles className="w-5 h-5 text-slate-950 animate-spin-slow" />
                <span className="font-display font-black text-xs uppercase leading-tight mt-0.5">
                  HONMOON FINALE
                </span>
                <span className="text-[10px] font-bold opacity-90">
                  ({chain.centerPuzzle.operation})
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-fuchsia-400 mb-0.5" />
                <div className="flex flex-wrap items-center justify-center gap-1 max-w-[82px]">
                  {chain.outerPuzzles.map((p, idx) => (
                    <span
                      key={p.id}
                      className={`inline-flex items-center justify-center px-1 min-w-[22px] h-5 rounded-full text-[10px] font-black ${
                        solvedOuterIndices[idx]
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'bg-purple-900/80 text-purple-400 border border-purple-600/50'
                      }`}
                    >
                      {solvedOuterIndices[idx] ? formatPuzzleValue(p, p.target).text : '?'}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Outer Mini-Seal Buttons around the Constellation */}
          {chain.outerPuzzles.map((puz, idx) => {
            const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / outerCount;
            const leftPct = ((120 + 82 * Math.cos(angle)) / 240) * 100;
            const topPct = ((120 + 82 * Math.sin(angle)) / 240) * 100;
            const isSolved = solvedOuterIndices[idx];
            const isSelected = !isMasterActive && activeOuterIndex === idx;
            const eq = solvedOuterEquations[idx];

            return (
              <button
                key={puz.id}
                type="button"
                onClick={() => {
                  if (!isSolved && !isMasterActive && !activeSolvedEquation) {
                    onSelectOuterIndex(idx);
                  }
                }}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-20 w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                  isSolved
                    ? 'keep-dark-card bg-gradient-to-b from-emerald-500 to-teal-700 border-emerald-200 text-white shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                    : isSelected
                    ? 'keep-dark-card bg-gradient-to-b from-fuchsia-500 to-purple-800 border-amber-300 text-white scale-110 ring-4 ring-fuchsia-400/40 shadow-[0_0_20px_rgba(232,121,249,0.8)]'
                    : 'bg-purple-900/90 border-fuchsia-400/50 text-fuchsia-200 hover:scale-105'
                }`}
              >
                {isSolved ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span className="font-display font-black text-sm leading-none">
                        {formatPuzzleValue(puz, puz.target).text}
                      </span>
                    </div>
                    {eq && (
                      <span className="text-[9px] font-bold text-emerald-100 mt-0.5 truncate max-w-[58px]">
                        {formatPuzzleValue(puz, eq.a).text}
                        {puz.operation}
                        {formatPuzzleValue(puz, eq.b).text}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">
                      #{idx + 1}
                    </span>
                    <span className="font-display font-black text-[11px] text-amber-300 truncate max-w-[56px]">
                      {puz.numbers
                        .slice(0, 3)
                        .map((n) => formatPuzzleValue(puz, n).text)
                        .join('·')}
                      ..
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-center text-purple-200/80 mt-1">
          {isMasterActive ? t.masterSealUnlocked : t.masterSealLocked}
        </p>
      </div>

      {/* Right / Bottom: Active Full-Size Interactive Kakooma Seal */}
      <div className="w-full lg:w-7/12 flex flex-col items-center">
        <div
          className={`mb-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider border ${
            isMasterActive
              ? 'bg-amber-400/20 border-amber-300 text-amber-200 animate-pulse'
              : 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200'
          }`}
        >
          {isMasterActive
            ? `🌟 GOLDEN MASTER SEAL (${chain.centerPuzzle.operation})`
            : `✨ SEAL #${activeOuterIndex + 1} / ${outerCount} (${currentPuzzle.operation})`}
        </div>

        <HonmoonSeal
          puzzle={currentPuzzle}
          onSelectNumber={onSelectNumber}
          hintLevel={hintLevel}
          wrongNumber={wrongNumber}
          solvedEquation={activeSolvedEquation}
          mathTrickMessage={mathTrickMessage}
          onCloseSolved={onCloseSolved}
          lang={lang}
          eliminatedNumbers={eliminatedNumbers}
          floatingBanner={floatingBanner}
          isGoldenMode={isMasterActive || isGoldenMode}
          accentColor={isMasterActive ? 'gold' : 'purple'}
        />
      </div>
    </div>
  );
};
