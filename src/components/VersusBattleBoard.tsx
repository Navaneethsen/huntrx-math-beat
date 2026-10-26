import React, { useState } from 'react';
import {
  KakoomaPuzzle,
  SkillId,
  SealSize,
  generateSinglePuzzle,
  checkKakoomaAnswer,
} from '../engine/kakoomaGenerator';
import { HonmoonSeal } from './HonmoonSeal';
import { HunterAvatar, HunterId } from './CharacterArt';
import { Translations, Language } from '../i18n/translations';
import { getSmartMathTrick } from '../engine/progressionStore';
import { soundEngine } from '../audio/soundEngine';
import { Sparkles, HelpCircle, Trophy } from 'lucide-react';

interface VersusBattleBoardProps {
  daughterSkill: SkillId;
  daughterSize: SealSize;
  daughterHunter: HunterId;
  parentSkill: SkillId;
  parentSize: SealSize;
  t: Translations;
  lang: Language;
  /** Called only for the child's wrong taps, so the fact can be reviewed later. */
  onDaughterMiss: (puzzle: KakoomaPuzzle) => void;
  /** Called only when the child completes a puzzle (counts as spaced practice). */
  onDaughterSolve: (puzzle: KakoomaPuzzle) => void;
  onFinishMatch: (winner: 'daughter' | 'parent', dScore: number, pScore: number) => void;
}

export const VersusBattleBoard: React.FC<VersusBattleBoardProps> = ({
  daughterSkill,
  daughterSize,
  daughterHunter,
  parentSkill,
  parentSize,
  t,
  lang,
  onDaughterMiss,
  onDaughterSolve,
  onFinishMatch,
}) => {
  const TARGET_POINTS = 7;

  const [dPuzzle, setDPuzzle] = useState<KakoomaPuzzle>(() =>
    generateSinglePuzzle(daughterSkill, daughterSize)
  );
  const [pPuzzle, setPPuzzle] = useState<KakoomaPuzzle>(() =>
    generateSinglePuzzle(parentSkill, parentSize)
  );

  const [dScore, setDScore] = useState(0);
  const [pScore, setPScore] = useState(0);

  const [dWrong, setDWrong] = useState<number | null>(null);
  const [pWrong, setPWrong] = useState<number | null>(null);

  const [dHint, setDHint] = useState<0 | 1 | 2>(0);
  const [pHint, setPHint] = useState<0 | 1 | 2>(0);
  const [dStrategy, setDStrategy] = useState<string | null>(null);

  const [dSolvedEq, setDSolvedEq] = useState<{ a: number; b: number; target: number } | null>(null);
  const [pSolvedEq, setPSolvedEq] = useState<{ a: number; b: number; target: number } | null>(null);

  const parentHunter: HunterId = daughterHunter === 'rumi' ? 'mira' : 'rumi';

  const handleDaughterTap = (num: number) => {
    if (dSolvedEq) return;
    const res = checkKakoomaAnswer(dPuzzle, num);
    if (res.isCorrect) {
      soundEngine.playCorrect(dScore + 1);
      setDSolvedEq({ a: res.a, b: res.b, target: res.target });
      onDaughterSolve(dPuzzle);
      const nextScore = dScore + 1;
      setDScore(nextScore);

      setTimeout(() => {
        if (nextScore >= TARGET_POINTS) {
          soundEngine.playVictoryFanfare();
          onFinishMatch('daughter', nextScore, pScore);
        } else {
          setDSolvedEq(null);
          setDHint(0);
          setDWrong(null);
          setDStrategy(null);
          setDPuzzle(generateSinglePuzzle(daughterSkill, daughterSize));
        }
      }, 520);
    } else {
      soundEngine.playGentleMiss();
      setDWrong(num);
      onDaughterMiss(dPuzzle);
      const [a, b] = dPuzzle.pair;
      setDStrategy(
        getSmartMathTrick(a, b, dPuzzle.target, dPuzzle.operation, lang, dPuzzle.fractionData)
      );
      // Auto-help daughter with a gentle hint if she misses!
      if (dHint === 0) setDHint(1);
      setTimeout(() => setDWrong(null), 450);
    }
  };

  const handleParentTap = (num: number) => {
    if (pSolvedEq) return;
    const res = checkKakoomaAnswer(pPuzzle, num);
    if (res.isCorrect) {
      soundEngine.playCorrect(pScore + 1);
      setPSolvedEq({ a: res.a, b: res.b, target: res.target });
      const nextScore = pScore + 1;
      setPScore(nextScore);

      setTimeout(() => {
        if (nextScore >= TARGET_POINTS) {
          soundEngine.playVictoryFanfare();
          onFinishMatch('parent', dScore, nextScore);
        } else {
          setPSolvedEq(null);
          setPHint(0);
          setPWrong(null);
          setPPuzzle(generateSinglePuzzle(parentSkill, parentSize));
        }
      }, 520);
    } else {
      soundEngine.playGentleMiss();
      setPWrong(num);
      setTimeout(() => setPWrong(null), 450);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Top Race Banner */}
      <div className="bg-purple-950/70 border border-fuchsia-500/40 rounded-2xl p-3 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-300 font-display font-black text-sm sm:text-base">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>{t.firstToPoints(TARGET_POINTS)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
          <span className="text-pink-300">
            {t.daughterLabel}: {dScore}/{TARGET_POINTS}
          </span>
          <span className="text-purple-400">vs</span>
          <span className="text-cyan-300">
            {t.parentLabel}: {pScore}/{TARGET_POINTS}
          </span>
        </div>
      </div>

      {/* Dual Split Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Player 1: Daughter */}
        <div className="bg-gradient-to-b from-fuchsia-950/60 to-purple-950/80 border-2 border-pink-500/60 rounded-3xl p-4 flex flex-col items-center shadow-[0_0_30px_rgba(236,72,153,0.2)]">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HunterAvatar hunter={daughterHunter} size={44} animate={false} />
              <div>
                <div className="font-display font-black text-pink-300 text-base">
                  {t.daughterLabel}
                </div>
                <div className="text-xs text-purple-200/80">
                  {t.skills[daughterSkill].name} ({dPuzzle.operation})
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playHint();
                setDHint((prev) => (prev < 2 ? ((prev + 1) as 1 | 2) : 2));
              }}
              className="px-2.5 py-1 rounded-xl bg-amber-400/20 border border-amber-300/60 text-amber-200 text-xs font-bold flex items-center gap-1 hover:bg-amber-400/30"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Hint
            </button>
          </div>

          {/* Progress Dots */}
          <div className="w-full flex gap-1.5 mb-3">
            {Array.from({ length: TARGET_POINTS }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-full transition-all ${
                  i < dScore
                    ? 'bg-gradient-to-r from-amber-300 to-pink-500 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'bg-purple-900/70'
                }`}
              />
            ))}
          </div>

          <HonmoonSeal
            puzzle={dPuzzle}
            onSelectNumber={handleDaughterTap}
            hintLevel={dHint}
            wrongNumber={dWrong}
            solvedEquation={dSolvedEq}
            accentColor="pink"
          />
          {dStrategy && (
            <div className="mt-3 w-full rounded-2xl border border-amber-300/50 bg-amber-400/10 px-3 py-2 text-xs sm:text-sm font-semibold text-amber-100">
              {dStrategy}
            </div>
          )}
        </div>

        {/* Player 2: Parent */}
        <div className="bg-gradient-to-b from-slate-900/80 to-indigo-950/80 border-2 border-cyan-500/60 rounded-3xl p-4 flex flex-col items-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HunterAvatar hunter={parentHunter} size={44} animate={false} />
              <div>
                <div className="font-display font-black text-cyan-300 text-base">
                  {t.parentLabel}
                </div>
                <div className="text-xs text-cyan-100/80">
                  {t.skills[parentSkill].name} ({pPuzzle.operation})
                </div>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {parentSize} Orbs
            </div>
          </div>

          {/* Progress Dots */}
          <div className="w-full flex gap-1.5 mb-3">
            {Array.from({ length: TARGET_POINTS }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-full transition-all ${
                  i < pScore
                    ? 'bg-gradient-to-r from-cyan-300 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <HonmoonSeal
            puzzle={pPuzzle}
            onSelectNumber={handleParentTap}
            hintLevel={pHint}
            wrongNumber={pWrong}
            solvedEquation={pSolvedEq}
            accentColor="cyan"
          />
        </div>
      </div>
    </div>
  );
};
