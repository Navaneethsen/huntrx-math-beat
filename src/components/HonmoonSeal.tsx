import React, { useEffect, useState } from 'react';
import { KakoomaPuzzle, formatPuzzleValue } from '../engine/kakoomaGenerator';
import { Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface HonmoonSealProps {
  puzzle: KakoomaPuzzle;
  onSelectNumber: (num: number) => void;
  hintLevel?: 0 | 1 | 2;
  wrongNumber?: number | null;
  solvedEquation?: { a: number; b: number; target: number } | null;
  mathTrickMessage?: string;
  onCloseSolved?: () => void;
  lang?: Language;
  eliminatedNumbers?: number[];
  floatingBanner?: { text: string; sub?: string } | null;
  compact?: boolean;
  isGoldenMode?: boolean;
  disabled?: boolean;
  accentColor?: 'purple' | 'pink' | 'cyan' | 'gold';
  label?: string;
}

/**
 * Generates a short, visual-first mental-math bridge (no long sentences!)
 * so a 10-year-old can read and understand the step in 1 second with zero stress.
 */
function buildStepByStepEvaluation(
  puzzle: KakoomaPuzzle,
  a: number,
  b: number,
  target: number,
  lang: Language
): string {
  if (puzzle.fractionData) {
    const den = puzzle.fractionData.denominator;
    const fT = formatPuzzleValue(puzzle, target);
    return `💡 ${a}/${den} ${puzzle.operation} ${b}/${den} = ${fT.text}`;
  }

  const op = puzzle.operation;
  if (op === '+') {
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    if (big < 10 && small < 10 && target > 10) {
      const toTen = 10 - big;
      const rest = small - toTen;
      return `💡 (${big} + ${toTen} = 10) + ${rest} = ${target}`;
    }
    if (big >= 10 && small >= 10) {
      const tens = Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10;
      const ones = (a % 10) + (b % 10);
      return `💡 ${tens} + ${ones} = ${target}`;
    }
    return `💡 ${big} + ${small} = ${target}`;
  }

  if (op === '−') {
    if (a > 10 && b < 10 && a - b < 10) {
      const toTen = a - 10;
      const rest = b - toTen;
      return `💡 (${a} − ${toTen} = 10) − ${rest} = ${target}`;
    }
    return `💡 ${target} + ${b} = ${a}`;
  }

  if (op === '×') {
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    if (big > 5) {
      const rem = big - 5;
      return `💡 (${small}×5=${small * 5}) + (${small}×${rem}=${small * rem}) = ${target}`;
    }
    return lang === 'nl'
      ? `💡 ${a} × ${b} = ${target}`
      : `💡 ${a} × ${b} = ${target}`;
  }

  // Division '÷'
  return `💡 ${target} × ${b} = ${a}`;
}

export const HonmoonSeal: React.FC<HonmoonSealProps> = ({
  puzzle,
  onSelectNumber,
  hintLevel = 0,
  wrongNumber = null,
  solvedEquation = null,
  onCloseSolved,
  lang = 'nl',
  eliminatedNumbers = [],
  floatingBanner = null,
  compact = false,
  isGoldenMode = false,
  disabled = false,
  accentColor = 'purple',
  label,
}) => {
  const [evalStage, setEvalStage] = useState<0 | 1 | 2 | 3>(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleSmoothClose = () => {
    if (!onCloseSolved || isClosing) return;
    soundEngine.playTap();
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onCloseSolved();
    }, 210);
  };

  // Slow, smooth 3-stage evaluation when an answer is clicked!
  useEffect(() => {
    if (!solvedEquation || compact) {
      setEvalStage(0);
      setIsClosing(false);
      return;
    }
    setIsClosing(false);
    // Stage 1 (0ms): Center loop smoothly expands & shows [a] op [b] = ?
    setEvalStage(1);

    // Stage 2 (550ms): Reveals the short visual bridge chip
    const t1 = window.setTimeout(() => {
      setEvalStage(2);
    }, 550);

    // Stage 3 (1150ms): Pops the final golden target result = [target]
    const t2 = window.setTimeout(() => {
      soundEngine.playTap();
      setEvalStage(3);
    }, 1150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [solvedEquation, compact]);

  // Allow closing the expanded Center Loop with Enter or Spacebar
  useEffect(() => {
    if (!solvedEquation || compact || !onCloseSolved) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSmoothClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const count = puzzle.numbers.length;
  const center = 150;
  const isExpandedEval = Boolean(solvedEquation && !compact);
  const radius = compact ? 92 : 104;

  const nodes = puzzle.numbers.map((num, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / count;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { num, x, y, angle, idx };
  });

  const [hintA, hintB] = puzzle.pair;
  const nodeByNum = (n: number) => nodes.find((item) => item.num === n);

  const solvedNodeA = solvedEquation ? nodeByNum(solvedEquation.a) : null;
  const solvedNodeB = solvedEquation ? nodeByNum(solvedEquation.b) : null;
  const solvedNodeTarget = solvedEquation ? nodeByNum(solvedEquation.target) : null;

  const hintNodeA = hintLevel >= 1 ? nodeByNum(hintA) : null;
  const hintNodeB = hintLevel >= 2 ? nodeByNum(hintB) : null;

  const ringStroke = isGoldenMode
    ? '#fbbf24'
    : accentColor === 'pink'
    ? '#f43f5e'
    : accentColor === 'cyan'
    ? '#22d3ee'
    : accentColor === 'gold'
    ? '#fbbf24'
    : '#a855f7';

  const solvedTextA = solvedEquation ? formatPuzzleValue(puzzle, solvedEquation.a).text : '';
  const solvedTextB = solvedEquation ? formatPuzzleValue(puzzle, solvedEquation.b).text : '';
  const solvedTextTarget = solvedEquation
    ? formatPuzzleValue(puzzle, solvedEquation.target).text
    : '';

  return (
    <div
      data-testid="honmoon-seal"
      className={`relative select-none mx-auto flex items-center justify-center transition-transform duration-200 ${
        solvedEquation ? 'scale-[1.04]' : ''
      } ${
        compact ? 'w-44 h-44 sm:w-52 sm:h-52' : 'w-[295px] h-[295px] sm:w-[360px] sm:h-[360px]'
      }`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Floating Dopamine Callout Popup */}
      {floatingBanner && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center animate-floatPopup">
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-pink-500 text-slate-950 font-display font-black text-sm sm:text-base shadow-[0_0_30px_rgba(251,191,36,0.95)] border-2 border-white whitespace-nowrap">
            {floatingBanner.text}
          </div>
          {floatingBanner.sub && (
            <div className="mt-1 px-3 py-0.5 rounded-full bg-purple-950/95 border border-cyan-400 text-cyan-300 font-display font-extrabold text-xs whitespace-nowrap shadow-lg">
              {floatingBanner.sub}
            </div>
          )}
        </div>
      )}

      {/* Sacred Honmoon Geometric SVG Background & Energy Lines */}
      <svg
        viewBox="0 0 300 300"
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      >
        <defs>
          <radialGradient id={`sealGlow-${puzzle.id}`} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={isGoldenMode ? '#fbbf24' : '#ec4899'}
              stopOpacity={isGoldenMode ? '0.38' : '0.24'}
            />
            <stop offset="70%" stopColor="#7e22ce" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#090414" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Glow */}
        <circle cx={center} cy={center} r={radius + 36} fill={`url(#sealGlow-${puzzle.id})`} />

        {/* Rotating Sacred Honmoon Star Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringStroke}
          strokeWidth="2.5"
          strokeDasharray="8 6"
          className="opacity-55"
        />
        <circle
          cx={center}
          cy={center}
          r={radius * 0.54}
          fill="none"
          stroke={ringStroke}
          strokeWidth="1.5"
          className="opacity-35"
        />

        {/* Polygon connecting the number orbs */}
        <polygon
          points={nodes.map((n) => `${n.x},${n.y}`).join(' ')}
          fill="rgba(15, 7, 34, 0.58)"
          stroke={ringStroke}
          strokeWidth="2"
          strokeOpacity="0.45"
          className="seal-polygon-bg"
        />

        {/* Spokes from center to each number orb */}
        {nodes.map((n) => (
          <line
            key={`spoke-${n.idx}`}
            x1={center}
            y1={center}
            x2={n.x}
            y2={n.y}
            stroke={ringStroke}
            strokeWidth="1.5"
            strokeOpacity="0.25"
          />
        ))}

        {/* Hint Level 2 Line connecting the two ingredient numbers */}
        {hintNodeA && hintNodeB && !solvedEquation && (
          <line
            x1={hintNodeA.x}
            y1={hintNodeA.y}
            x2={hintNodeB.x}
            y2={hintNodeB.y}
            stroke="#38bdf8"
            strokeWidth="6"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />
        )}

        {/* Solved Equation Neon Energy Triangle & Weapon Slash Burst */}
        {solvedNodeA && solvedNodeB && solvedNodeTarget && (
          <>
            <polygon
              points={`${solvedNodeA.x},${solvedNodeA.y} ${solvedNodeB.x},${solvedNodeB.y} ${solvedNodeTarget.x},${solvedNodeTarget.y}`}
              fill="rgba(251, 191, 36, 0.22)"
              stroke="#fbbf24"
              strokeWidth="3"
            />
            <line
              x1={solvedNodeA.x}
              y1={solvedNodeA.y}
              x2={solvedNodeTarget.x}
              y2={solvedNodeTarget.y}
              stroke="#fbbf24"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <line
              x1={solvedNodeB.x}
              y1={solvedNodeB.y}
              x2={solvedNodeTarget.x}
              y2={solvedNodeTarget.y}
              stroke="#fbbf24"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <line
              x1={solvedNodeA.x}
              y1={solvedNodeA.y}
              x2={solvedNodeB.x}
              y2={solvedNodeB.y}
              stroke="#38bdf8"
              strokeWidth="5"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>

      {/* Center Operation Emblem / Expandable Center Loop Evaluation Hub */}
      {isExpandedEval && solvedEquation ? (
        <div
          data-testid="center-loop-expanded"
          style={{ zIndex: 50 }}
          onClick={() => {
            if (evalStage >= 3) {
              handleSmoothClose();
            }
          }}
          className={`center-loop-card relative z-50 w-[238px] sm:w-[278px] rounded-[38px] bg-[#160730] bg-gradient-to-b from-[#280e54] via-[#160730] to-[#0b031a] border-[3px] border-amber-300 p-4 sm:p-5 shadow-[0_0_55px_rgba(251,191,36,0.75)] flex flex-col items-center justify-between text-center cursor-pointer ${
            isClosing ? 'animate-center-close' : 'animate-center-open'
          }`}
        >
          {/* Top Bar: 3-Beat Dots & Close (✕) Button */}
          <div className="w-full flex items-center justify-between gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-300 text-xs font-bold">
              <span>✨</span>
              <span className="flex items-center gap-1">
                {[1, 2, 3].map((stepDot) => (
                  <span
                    key={stepDot}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      evalStage >= stepDot
                        ? 'bg-amber-300 scale-125 shadow-[0_0_6px_rgba(251,191,36,1)]'
                        : 'bg-purple-700'
                    }`}
                  />
                ))}
              </span>
            </div>

            {onCloseSolved && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSmoothClose();
                }}
                title={lang === 'nl' ? 'Sluiten & volgende' : 'Close & next'}
                className="w-7 h-7 rounded-full bg-purple-900/90 hover:bg-rose-500/80 border border-purple-400/50 text-purple-100 hover:text-white font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow"
              >
                ✕
              </button>
            )}
          </div>

          {/* Stage 1 -> Stage 3: Big, Kid-Friendly Expression Evaluation */}
          <div className="center-loop-eq-box w-full py-3 px-2 rounded-3xl bg-slate-950/90 border-2 border-cyan-400/50 shadow-inner flex items-center justify-center gap-1.5 sm:gap-2">
            {/* Ingredient A Badge */}
            <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-b from-cyan-300 to-blue-600 border-2 border-white text-slate-950 font-display font-bold text-2xl sm:text-3xl shadow-[0_0_14px_rgba(34,211,238,0.8)] animate-pop-in">
              {solvedTextA}
            </div>

            {/* Operation Symbol */}
            <span className="font-display font-bold text-2xl sm:text-3xl text-amber-300">
              {puzzle.operation}
            </span>

            {/* Ingredient B Badge */}
            <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-b from-cyan-300 to-blue-600 border-2 border-white text-slate-950 font-display font-bold text-2xl sm:text-3xl shadow-[0_0_14px_rgba(34,211,238,0.8)] animate-pop-in">
              {solvedTextB}
            </div>

            {/* Equals Sign */}
            <span className="font-display font-bold text-2xl sm:text-3xl text-fuchsia-300">
              =
            </span>

            {/* Target Result Badge: Pulsing '?' until Stage 3, then Golden Target Burst! */}
            <div className="min-w-[46px] sm:min-w-[54px] flex items-center justify-center">
              {evalStage >= 3 ? (
                <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-500 border-2 border-white text-slate-950 font-display font-bold text-2xl sm:text-3xl ring-4 ring-yellow-300/60 shadow-[0_0_24px_rgba(251,191,36,1)] animate-target-burst">
                  {solvedTextTarget}
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-2xl bg-purple-900/80 border-2 border-dashed border-amber-300/80 text-amber-300 font-display font-bold text-xl sm:text-2xl animate-pulse">
                  ?
                </div>
              )}
            </div>
          </div>

          {/* Stage 2 (550ms): Short Visual Bridge Chip (1 clean line, no wall of text!) */}
          <div
            className={`w-full mt-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 px-3 py-1.5 text-center transition-all duration-300 ${
              evalStage >= 2
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-1.5 pointer-events-none'
            }`}
          >
            <div className="font-display font-bold text-xs sm:text-sm text-cyan-100 tracking-wide">
              {buildStepByStepEvaluation(
                puzzle,
                solvedEquation.a,
                solvedEquation.b,
                solvedEquation.target,
                lang
              )}
            </div>
          </div>

          {/* Bottom Button: Close Center Loop & Go to Next Question */}
          {onCloseSolved && (
            <button
              type="button"
              data-testid="next-puzzle-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSmoothClose();
              }}
              className={`mt-2.5 w-full py-2.5 px-4 rounded-2xl font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                evalStage >= 3
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-pink-500 text-slate-950 border-2 border-white shadow-[0_0_24px_rgba(251,191,36,0.9)] hover:brightness-110 active:scale-95'
                  : 'bg-purple-900/80 text-purple-200 border border-purple-500/50 hover:bg-purple-800'
              }`}
            >
              <span>
                {lang === 'nl' ? '✨ Volgende →' : '✨ Next →'}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div
          className={`relative z-10 flex flex-col items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300 pointer-events-none ${
            solvedEquation
              ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 border-white scale-125 px-3.5 py-2 shadow-[0_0_30px_rgba(251,191,36,0.9)]'
              : isGoldenMode
              ? 'bg-amber-500/25 border-amber-300 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
              : 'bg-purple-950/90 border-fuchsia-400/70 text-fuchsia-200'
          } ${compact ? 'w-12 h-12 text-lg' : 'w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl'}`}
        >
          {solvedEquation ? (
            <span className="font-display font-bold text-xs sm:text-sm whitespace-nowrap tracking-tight">
              {solvedTextA}
              {puzzle.operation}
              {solvedTextB}={solvedTextTarget}
            </span>
          ) : (
            <>
              <span className="font-display font-bold leading-none">{puzzle.operation}</span>
              {label && !compact && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-300/90 mt-0.5">
                  {label}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Interactive Number Orbs around the Seal */}
      {nodes.map(({ num, x, y, angle }) => {
        const leftPct = (x / 300) * 100;
        const topPct = (y / 300) * 100;

        const isEliminated = eliminatedNumbers.includes(num);
        const isSolvedTarget = solvedEquation?.target === num;
        const isSolvedPart = solvedEquation?.a === num || solvedEquation?.b === num;
        const isHintedPart =
          !solvedEquation &&
          ((hintLevel >= 1 && num === hintA) || (hintLevel >= 2 && num === hintB));
        const isWrong = wrongNumber === num;

        const formatted = formatPuzzleValue(puzzle, num);

        // GPU-accelerated radial push & scale when the Center Loop expands!
        const pushDist = isExpandedEval && !isClosing ? 32 : 0;
        const pushX = Math.round(Math.cos(angle) * pushDist * 10) / 10;
        const pushY = Math.round(Math.sin(angle) * pushDist * 10) / 10;
        const orbScale =
          isExpandedEval && !isClosing
            ? isSolvedTarget
              ? 0.92
              : isSolvedPart
              ? 0.88
              : 0.78
            : isSolvedTarget
            ? 1.12
            : isSolvedPart
            ? 1.02
            : solvedEquation
            ? 0.82
            : isHintedPart
            ? 1.12
            : isEliminated
            ? 0.75
            : 1;

        let orbStyle =
          'seal-orb-default bg-gradient-to-b from-[#341372] to-[#170736] border-fuchsia-400/85 text-white hover:border-amber-300 active:scale-90 shadow-[0_0_22px_rgba(192,132,252,0.4)]';

        if (isGoldenMode && !isSolvedTarget && !isSolvedPart && !isWrong && !isEliminated) {
          orbStyle =
            'seal-orb-golden bg-gradient-to-b from-amber-500/90 via-fuchsia-700 to-purple-950 border-amber-300 text-white active:scale-90 shadow-[0_0_26px_rgba(251,191,36,0.65)]';
        }

        if (isEliminated) {
          orbStyle =
            'bg-slate-950/60 border-slate-700/40 text-slate-600 opacity-35 line-through pointer-events-none';
        }

        if (isHintedPart) {
          orbStyle =
            'bg-gradient-to-b from-sky-400 to-indigo-800 border-yellow-300 text-white ring-4 ring-sky-300/75 shadow-[0_0_32px_rgba(56,189,248,0.95)]';
        }

        if (solvedEquation && !isSolvedPart && !isSolvedTarget) {
          orbStyle =
            'bg-slate-950/75 border-purple-800/40 text-purple-300/45 opacity-40 pointer-events-none';
        }

        if (isSolvedPart) {
          orbStyle =
            'bg-gradient-to-b from-cyan-300 to-blue-600 border-white text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.95)] z-30';
        }

        if (isSolvedTarget) {
          orbStyle =
            'bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-500 border-white text-slate-950 ring-4 ring-yellow-200 shadow-[0_0_42px_rgba(251,191,36,1)] z-30';
        }

        if (isWrong) {
          orbStyle =
            'bg-gradient-to-b from-rose-600 to-red-900 border-rose-300 text-white animate-shake';
        }

        const circumference = 2 * Math.PI * 30; // ~188.5

        return (
          <button
            key={num}
            type="button"
            data-testid="seal-orb"
            data-orb-value={num}
            disabled={disabled || isEliminated || Boolean(solvedEquation)}
            onClick={() => {
              if (!disabled && !isEliminated && !solvedEquation) {
                onSelectNumber(num);
              }
            }}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              zIndex: 20,
              opacity: isExpandedEval && !isClosing ? 0.32 : undefined,
              transform: `translate(-50%, -50%) translate3d(${pushX}px, ${pushY}px, 0) scale(${orbScale})`,
              transition:
                'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease',
              touchAction: 'manipulation',
            }}
            className={`absolute z-20 flex items-center justify-center rounded-full border-[3px] font-display font-bold cursor-pointer select-none ${
              compact
                ? 'w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl'
                : 'w-[74px] h-[74px] sm:w-[88px] sm:h-[88px] text-2xl sm:text-3xl'
            } ${orbStyle}`}
          >
            {/* Visual Fraction Ring Gauge inside Orb when playing Fractions! */}
            {formatted.isFraction && !isEliminated && (
              <svg
                viewBox="0 0 68 68"
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              >
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="4"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={isSolvedTarget || isSolvedPart ? '#0f172a' : '#22d3ee'}
                  strokeWidth="4"
                  strokeDasharray={`${formatted.fillRatio * circumference} ${circumference}`}
                  strokeLinecap="round"
                />
              </svg>
            )}

            {formatted.isFraction ? (
              <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                <span className={compact ? 'text-xs sm:text-sm' : 'text-base sm:text-xl'}>
                  {formatted.num}
                </span>
                <span className="w-5 sm:w-6 h-[2px] bg-current opacity-85 my-0.5 rounded-full" />
                <span className={compact ? 'text-xs sm:text-sm' : 'text-base sm:text-xl'}>
                  {formatted.den}
                </span>
              </div>
            ) : (
              <span>{formatted.text}</span>
            )}

            {isEliminated && (
              <span className="absolute inset-0 flex items-center justify-center text-rose-500 font-black text-2xl">
                ⚔️
              </span>
            )}
            {isHintedPart && (
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow animate-bounce">
                {puzzle.operation}?
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
