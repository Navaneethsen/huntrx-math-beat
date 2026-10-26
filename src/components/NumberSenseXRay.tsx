import React, { useState } from 'react';
import { KakoomaPuzzle, formatPuzzleValue } from '../engine/kakoomaGenerator';
import { Language } from '../i18n/translations';
import { getSmartMathTrick } from '../engine/progressionStore';

interface NumberSenseXRayProps {
  puzzle: KakoomaPuzzle;
  lang: Language;
  isSolved: boolean;
}

export const NumberSenseXRay: React.FC<NumberSenseXRayProps> = ({
  puzzle,
  lang,
  isSolved,
}) => {
  const [revealAnswer, setRevealAnswer] = useState(false);
  const showFull = isSolved || revealAnswer;

  const [p1, p2] = puzzle.pair;
  const target = puzzle.target;
  const op = puzzle.operation;
  const frac = puzzle.fractionData;

  const p1Str = formatPuzzleValue(puzzle, p1).text;
  const p2Str = formatPuzzleValue(puzzle, p2).text;
  const targetStr = showFull ? formatPuzzleValue(puzzle, target).text : '?';

  // Determine the top "Whole / Total / Product" of the Fact-Family Triangle
  // In + and ×, target is the largest (top of triangle), p1 & p2 are bottom parts.
  // In − and ÷, p1 is the largest (minuend/dividend at top of triangle), p2 & target are bottom parts!
  const isInverseOp = op === '−' || op === '÷';
  const topValStr = isInverseOp ? p1Str : targetStr;
  const leftValStr = isInverseOp ? p2Str : p1Str;
  const rightValStr = isInverseOp ? targetStr : p2Str;

  const smartTip = getSmartMathTrick(p1, p2, target, op, lang, frac);

  return (
    <div className="w-full max-w-xl mx-auto mt-3 rounded-2xl bg-slate-950/90 border border-cyan-400/40 p-3.5 sm:p-4 shadow-[0_0_30px_rgba(34,211,238,0.18)] backdrop-blur-md animate-pop-in">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <div>
            <h4 className="font-display font-black text-xs sm:text-sm uppercase tracking-wider text-cyan-300">
              {lang === 'nl'
                ? 'Derpy’s Getal-Inzicht X-Ray (Visueel Model)'
                : 'Derpy’s Number-Sense X-Ray (Visual Model)'}
            </h4>
            <p className="text-[11px] text-purple-200/80">
              {lang === 'nl'
                ? 'Zie in één oogopslag hoe de getallen samenwerken!'
                : 'See at a glance how the numbers connect visually!'}
            </p>
          </div>
        </div>

        {!isSolved && (
          <button
            onClick={() => setRevealAnswer((prev) => !prev)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-900/80 hover:bg-purple-800 text-amber-300 border border-amber-400/40 transition cursor-pointer"
          >
            {revealAnswer
              ? lang === 'nl'
                ? '🙈 Verberg ?-antwoord'
                : '🙈 Hide ? Answer'
              : lang === 'nl'
              ? '👀 Spiek ?-antwoord'
              : '👀 Peek ? Answer'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* LEFT COLUMN: Fact-Family Triangle (Splits-Driehoek / Sommenfamilie) */}
        <div className="sm:col-span-5 bg-slate-900/90 border border-purple-500/30 rounded-xl p-3 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-1">
            {lang === 'nl' ? '🔺 Sommen-Familie Driehoek' : '🔺 Fact-Family Bond Triangle'}
          </span>

          <svg viewBox="0 0 180 120" className="w-40 h-28 overflow-visible">
            {/* Connecting Bond Lines */}
            <line
              x1="90"
              y1="26"
              x2="40"
              y2="92"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeDasharray="4 3"
            />
            <line
              x1="90"
              y1="26"
              x2="140"
              y2="92"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeDasharray="4 3"
            />
            <line
              x1="40"
              y1="92"
              x2="140"
              y2="92"
              stroke="#f472b6"
              strokeWidth="2.5"
            />

            {/* Operation symbol in center of triangle */}
            <text
              x="90"
              y="72"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="16"
              fontWeight="900"
            >
              {op === '×' || op === '÷' ? '× / ÷' : '+ / −'}
            </text>

            {/* Top Node (Total / Product) */}
            <circle
              cx="90"
              cy="26"
              r="21"
              fill={!isInverseOp && !showFull ? '#581c87' : '#0f172a'}
              stroke="#fbbf24"
              strokeWidth="2.5"
            />
            <text
              x="90"
              y="31"
              textAnchor="middle"
              fill="#fde68a"
              fontSize="14"
              fontWeight="900"
            >
              {topValStr}
            </text>

            {/* Bottom Left Node */}
            <circle
              cx="40"
              cy="92"
              r="20"
              fill="#0f172a"
              stroke="#22d3ee"
              strokeWidth="2.5"
            />
            <text
              x="40"
              y="97"
              textAnchor="middle"
              fill="#cffafe"
              fontSize="13"
              fontWeight="800"
            >
              {leftValStr}
            </text>

            {/* Bottom Right Node */}
            <circle
              cx="140"
              cy="92"
              r="20"
              fill={isInverseOp && !showFull ? '#581c87' : '#0f172a'}
              stroke={isInverseOp ? '#fbbf24' : '#f472b6'}
              strokeWidth="2.5"
            />
            <text
              x="140"
              y="97"
              textAnchor="middle"
              fill={isInverseOp ? '#fde68a' : '#fbcfe8'}
              fontSize="13"
              fontWeight="800"
            >
              {rightValStr}
            </text>
          </svg>

          {/* 4 Related Fact-Family Equations */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-bold text-purple-200 mt-1 w-full text-center bg-slate-950/70 rounded-lg py-1.5 px-2">
            {op === '×' || op === '÷' ? (
              <>
                <span>
                  {leftValStr} × {rightValStr} = {topValStr}
                </span>
                <span>
                  {rightValStr} × {leftValStr} = {topValStr}
                </span>
                <span className="text-cyan-300">
                  {topValStr} ÷ {leftValStr} = {rightValStr}
                </span>
                <span className="text-cyan-300">
                  {topValStr} ÷ {rightValStr} = {leftValStr}
                </span>
              </>
            ) : (
              <>
                <span>
                  {leftValStr} + {rightValStr} = {topValStr}
                </span>
                <span>
                  {rightValStr} + {leftValStr} = {topValStr}
                </span>
                <span className="text-cyan-300">
                  {topValStr} − {leftValStr} = {rightValStr}
                </span>
                <span className="text-cyan-300">
                  {topValStr} − {rightValStr} = {leftValStr}
                </span>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Visual Representation (Fraction Bars / Array Grid / 10-Frame / Number Line) */}
        <div className="sm:col-span-7 bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between min-h-[155px]">
          {/* CASE 1: FRACTIONS -> Visual Equivalent Fraction Bars */}
          {frac ? (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-2">
                {lang === 'nl'
                  ? `🍫 Visuele Breuken-Stroken (Verdeeld in ${frac.denominator} gelijke stukjes)`
                  : `🍫 Visual Fraction Bars (Split into ${frac.denominator} equal parts)`}
              </div>

              <div className="space-y-2">
                {/* Bar 1: p1 */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-pink-200 mb-0.5">
                    <span>
                      {lang === 'nl' ? 'Deel 1:' : 'Part 1:'} {p1Str}
                    </span>
                    <span>
                      ({p1}/{frac.denominator})
                    </span>
                  </div>
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${frac.denominator}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: frac.denominator }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-4 rounded-sm border ${
                          idx < p1
                            ? 'bg-pink-500 border-pink-300'
                            : 'bg-slate-800/70 border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Bar 2: p2 */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-cyan-200 mb-0.5">
                    <span>
                      {lang === 'nl' ? 'Deel 2:' : 'Part 2:'} {p2Str}
                    </span>
                    <span>
                      ({p2}/{frac.denominator})
                    </span>
                  </div>
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${frac.denominator}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: frac.denominator }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-4 rounded-sm border ${
                          idx >= p1 && idx < p1 + p2
                            ? 'bg-cyan-400 border-cyan-200'
                            : idx < p1
                            ? 'bg-pink-500/40 border-pink-400/30'
                            : 'bg-slate-800/70 border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : op === '×' || op === '÷' ? (
            /* CASE 2: MULTIPLICATION OR DIVISION -> Color-Coded 5x Stepping-Stone Array */
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                {lang === 'nl'
                  ? '🌟 Visueel Sterren-Rooster (Goud = eerste 5 rijen, Cyaan = rest)'
                  : '🌟 Visual Star Array (Gold = first 5 rows, Cyan = extra rows)'}
              </div>
              {(() => {
                const factorA = op === '÷' ? p2 : Math.min(p1, p2);
                const factorB = op === '÷' ? target : Math.max(p1, p2);
                const rows = Math.min(factorA, 10);
                const cols = Math.min(factorB, 10);
                return (
                  <div className="flex items-center gap-3">
                    <div className="inline-flex flex-col gap-1 bg-slate-950/80 p-2 rounded-lg border border-purple-500/30">
                      {Array.from({ length: rows }).map((_, r) => (
                        <div key={r} className="flex gap-1 items-center">
                          <span className="text-[9px] font-mono text-purple-300 w-3 text-right mr-0.5">
                            {r + 1}
                          </span>
                          {Array.from({ length: cols }).map((__, c) => (
                            <span
                              key={c}
                              className={`w-2.5 h-2.5 rounded-full ${
                                r < 5
                                  ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24]'
                                  : 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]'
                              }`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-purple-100 space-y-1">
                      <div className="font-bold text-amber-300">
                        {rows > 5 ? (
                          <>
                            <div>
                              🟡 5 × {cols} = {5 * cols}
                            </div>
                            <div className="text-cyan-300">
                              🔵 {rows - 5} × {cols} = {(rows - 5) * cols}
                            </div>
                          </>
                        ) : (
                          <div>
                            🟡 {rows} {lang === 'nl' ? 'rijen van' : 'rows of'}{' '}
                            {cols}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-purple-200/90">
                        {lang === 'nl'
                          ? 'Door grote tafels in een stuk van 5× te knippen reken je 2× zo snel!'
                          : 'Splitting big tables into a 5× chunk makes mental math twice as fast!'}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : Math.max(p1, p2, target) <= 20 ? (
            /* CASE 3: ADDITION / SUBTRACTION <= 20 -> Visual 10-Frames (Rekenrek / Tien-veld) */
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-1.5">
                {lang === 'nl'
                  ? '🔟 Visueel Tien-Veld (Rekenrek: Eerst volmaken tot 10!)'
                  : '🔟 Visual 10-Frames (Make-10 First Strategy!)'}
              </div>
              {(() => {
                const partA = op === '−' ? p2 : Math.max(p1, p2);
                const partB = op === '−' ? target : Math.min(p1, p2);
                const total = partA + partB;
                return (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Frame 1 (1 to 10) */}
                    <div className="bg-slate-950 p-2 rounded-lg border border-amber-400/40">
                      <div className="text-[9px] text-amber-300 font-bold mb-1 text-center">
                        1 – 10
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const isA = i < partA;
                          const isB = !isA && i < total;
                          return (
                            <div
                              key={i}
                              className={`w-4 h-4 rounded-full border ${
                                isA
                                  ? 'bg-pink-500 border-pink-200'
                                  : isB
                                  ? 'bg-cyan-400 border-cyan-100'
                                  : 'bg-slate-800 border-slate-700'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Frame 2 (11 to 20) if total > 10 */}
                    {total > 10 && (
                      <div className="bg-slate-950 p-2 rounded-lg border border-cyan-400/40">
                        <div className="text-[9px] text-cyan-300 font-bold mb-1 text-center">
                          11 – 20
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {Array.from({ length: 10 }).map((_, i) => {
                            const idx = i + 10;
                            const isA = idx < partA;
                            const isB = !isA && idx < total;
                            return (
                              <div
                                key={i}
                                className={`w-4 h-4 rounded-full border ${
                                  isA
                                    ? 'bg-pink-500 border-pink-200'
                                    : isB
                                    ? 'bg-cyan-400 border-cyan-100'
                                    : 'bg-slate-800 border-slate-700'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-purple-100 space-y-0.5">
                      <div>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500 mr-1" />
                        <span className="font-bold text-pink-300">
                          {lang === 'nl' ? 'Startgetal:' : 'First part:'} {partA}
                        </span>
                      </div>
                      <div>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 mr-1" />
                        <span className="font-bold text-cyan-300">
                          {lang === 'nl' ? 'Tweede deel:' : 'Second part:'}{' '}
                          {showFull || op !== '−' ? partB : '?'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* CASE 4: 2-DIGIT ADDITION / SUBTRACTION -> Stepping-Stone Number Line */
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-2">
                {lang === 'nl'
                  ? '📏 Slimme Sprongen op de Getallenlijn'
                  : '📏 Smart Jumps on the Number Line'}
              </div>
              {(() => {
                const start = op === '−' ? p2 : Math.min(p1, p2);
                const end = op === '−' ? p1 : target;
                const jump = op === '−' ? target : Math.max(p1, p2);
                const nextTen = Math.ceil((start + 1) / 10) * 10;
                const hasMidTen = nextTen > start && nextTen < end;
                return (
                  <div className="py-1">
                    <svg viewBox="0 0 280 70" className="w-full h-16 overflow-visible">
                      {/* Base horizontal line */}
                      <line
                        x1="20"
                        y1="52"
                        x2="260"
                        y2="52"
                        stroke="#94a3b8"
                        strokeWidth="2.5"
                      />
                      {/* Jump Arc(s) */}
                      {hasMidTen ? (
                        <>
                          <path
                            d="M 30 52 Q 80 10 130 52"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2.5"
                          />
                          <text
                            x="80"
                            y="22"
                            textAnchor="middle"
                            fill="#fde68a"
                            fontSize="11"
                            fontWeight="800"
                            className="xray-svg-amber"
                          >
                            +{nextTen - start}
                          </text>
                          <path
                            d="M 130 52 Q 190 10 250 52"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="2.5"
                          />
                          <text
                            x="190"
                            y="22"
                            textAnchor="middle"
                            fill="#67e8f9"
                            fontSize="11"
                            fontWeight="800"
                            className="xray-svg-cyan"
                          >
                            +{showFull ? end - nextTen : '?'}
                          </text>
                          <circle cx="130" cy="52" r="4" fill="#fbbf24" />
                          <text
                            x="130"
                            y="66"
                            textAnchor="middle"
                            fill="#fde68a"
                            fontSize="11"
                            fontWeight="800"
                            className="xray-svg-amber"
                          >
                            {nextTen}
                          </text>
                        </>
                      ) : (
                        <>
                          <path
                            d="M 30 52 Q 140 8 250 52"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="2.5"
                          />
                          <text
                            x="140"
                            y="20"
                            textAnchor="middle"
                            fill="#67e8f9"
                            fontSize="12"
                            fontWeight="800"
                            className="xray-svg-cyan"
                          >
                            +{showFull || op !== '−' ? jump : '?'}
                          </text>
                        </>
                      )}

                      {/* Start & End nodes */}
                      <circle cx="30" cy="52" r="5" fill="#f472b6" />
                      <text
                        x="30"
                        y="66"
                        textAnchor="middle"
                        fill="#fbcfe8"
                        fontSize="12"
                        fontWeight="900"
                        className="xray-svg-pink"
                      >
                        {start}
                      </text>

                      <circle cx="250" cy="52" r="5" fill="#22d3ee" />
                      <text
                        x="250"
                        y="66"
                        textAnchor="middle"
                        fill="#cffafe"
                        fontSize="12"
                        fontWeight="900"
                        className="xray-svg-cyan"
                      >
                        {showFull || op === '−' ? end : '?'}
                      </text>
                    </svg>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Greg Tang Smart Mental Math Tip Footer */}
          <div className="mt-2 pt-2 border-t border-purple-500/20 text-[11px] font-bold text-amber-200">
            {showFull ? (
              smartTip
            ) : (
              <span>
                {lang === 'nl'
                  ? `💡 Tip: Kijk naar het schema hierboven om te zien hoe ${p1Str} en ${p2Str} samenwerken!`
                  : `💡 Tip: Look at the visual model above to see how ${p1Str} and ${p2Str} connect!`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
