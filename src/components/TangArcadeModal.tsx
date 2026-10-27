import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Lightbulb,
  Flame,
  Trophy,
  Gamepad2,
  ArrowUpRight,
} from 'lucide-react';
import type { Language } from '../i18n/translations';
import {
  calculateSpeedGemReward,
  type SchoolGroupId,
  type SpeedGemReward,
  type TrickyFactItem,
} from '../engine/progressionStore';
import {
  CURRICULUM_GROUPS,
  getCurriculumGroup,
  getNextSchoolGroup,
} from '../engine/curriculumGroups';
import {
  TangMiniGameId,
  TangChallenge,
  generateTangChallenge,
  challengeToTrickyFact,
} from '../engine/tangGamesEngine';
import { soundEngine } from '../audio/soundEngine';

interface TangArcadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  schoolGroup: SchoolGroupId;
  onChangeSchoolGroup: (group: SchoolGroupId) => void;
  gems: number;
  onEarnReward: (gemsEarned: number, xpEarned: number) => void;
  onRecordMiss?: (fact: TrickyFactItem) => void;
  onOpenDojo?: () => void;
  initialGame?: TangMiniGameId;
}

const GAME_TABS: {
  id: TangMiniGameId;
  emoji: string;
  titleNl: string;
  titleEn: string;
  subtitleNl: string;
  subtitleEn: string;
  quoteNl: string;
  quoteEn: string;
}[] = [
  {
    id: 'sodaBubbles',
    emoji: '🫧',
    titleNl: 'Soda-Pop Bubbels',
    titleEn: 'Soda-Pop Bubbles',
    subtitleNl: 'Getalparen & Factoren',
    subtitleEn: 'Number Bonds & Factors',
    quoteNl: '“Jij bent mijn Soda Pop!” — Saja Boys 🥤',
    quoteEn: '“You’re my Soda Pop!” — Saja Boys 🥤',
  },
  {
    id: 'numberLine',
    emoji: '📏',
    titleNl: 'Honmoon Laser-Lijn',
    titleEn: 'Honmoon Laser Line',
    subtitleNl: 'Getallenlijn & Sprongen',
    subtitleEn: 'Number Line & Jumps',
    quoteNl: '“Volg de gouden Honmoon-lijn over nul!” — Mira 📏',
    quoteEn: '“Follow the golden Honmoon laser across zero!” — Mira 📏',
  },
  {
    id: 'subZero',
    emoji: '❄️',
    titleNl: 'Sub-Zero Portaal',
    titleEn: 'Sub-Zero Portal',
    subtitleNl: 'Negatieve Getallen & Onder Nul',
    subtitleEn: 'Negative Numbers & Sub-Zero',
    quoteNl: '“Bevries Gwi-Ma’s portaal onder 0°!” — Rumi ❄️',
    quoteEn: '“Freeze Gwi-Ma’s portal below 0°!” — Rumi ❄️',
  },
  {
    id: 'missingRune',
    emoji: '⚔️',
    titleNl: 'Saingeom Rune',
    titleEn: 'Saingeom Rune',
    subtitleNl: 'Algebra, Balans & Volgorde',
    subtitleEn: 'Algebra, Balance & Order',
    quoteNl: '“Samen smeden we het Saingeom-sterrenzwaard!” — Rumi ⚔️',
    quoteEn: '“Together we forge the Saingeom star-sword!” — Rumi ⚔️',
  },
  {
    id: 'breakApart',
    emoji: '🐯',
    titleNl: 'Derpy’s Splits-Beat',
    titleEn: 'Derpy’s Split Beat',
    subtitleNl: 'Slim Splitsen & Verdelen',
    subtitleEn: 'Smart Split & Distributive',
    quoteNl: '“Derpy neemt altijd de slimme splits-binnenweg!” — Zoey 🐯',
    quoteEn: '“Derpy always takes the smart split shortcut!” — Zoey 🐯',
  },
  {
    id: 'powerLab',
    emoji: '🧪',
    titleNl: 'Kristal-Lab',
    titleEn: 'Crystal Lab',
    subtitleNl: 'Breuken, % & Verhoudingen',
    subtitleEn: 'Fractions, % & Ratios',
    quoteNl: '“Mix breuken, procenten en kristallen op de beat!” — Mira 🧪',
    quoteEn: '“Mix fractions, percentages and crystals on the beat!” — Mira 🧪',
  },
];

const AUTO_PROMOTE_STREAK = 6;

export const TangArcadeModal: React.FC<TangArcadeModalProps> = ({
  isOpen,
  onClose,
  lang,
  schoolGroup,
  onChangeSchoolGroup,
  gems,
  onEarnReward,
  onRecordMiss,
  onOpenDojo,
  initialGame = 'sodaBubbles',
}) => {
  const [activeGame, setActiveGame] = useState<TangMiniGameId>(initialGame);
  const [challenge, setChallenge] = useState<TangChallenge>(() =>
    generateTangChallenge(initialGame, schoolGroup, 0)
  );
  const [selectedBubbleIds, setSelectedBubbleIds] = useState<string[]>([]);
  const [showCoachTip, setShowCoachTip] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [sessionGemsEarned, setSessionGemsEarned] = useState(0);
  const [dojoSavedNotice, setDojoSavedNotice] = useState(false);
  const [levelUpBanner, setLevelUpBanner] = useState<string | null>(null);
  const [hadPenaltyOnCurrent, setHadPenaltyOnCurrent] = useState(false);
  const [lastSpeedReward, setLastSpeedReward] = useState<SpeedGemReward | null>(
    null
  );
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isOpen) {
      setActiveGame(initialGame);
      setChallenge(generateTangChallenge(initialGame, schoolGroup, 0));
      setSelectedBubbleIds([]);
      setShowCoachTip(false);
      setFeedback(null);
      setDojoSavedNotice(false);
      setHadPenaltyOnCurrent(false);
      setLastSpeedReward(null);
      questionStartRef.current = Date.now();
    }
  }, [isOpen, initialGame]);

  useEffect(() => {
    if (isOpen) {
      setChallenge(generateTangChallenge(activeGame, schoolGroup, streak));
      setSelectedBubbleIds([]);
      setShowCoachTip(false);
      setFeedback(null);
      setDojoSavedNotice(false);
      setHadPenaltyOnCurrent(false);
      questionStartRef.current = Date.now();
    }
  }, [activeGame, schoolGroup]);

  if (!isOpen) return null;

  const activeGameMeta =
    GAME_TABS.find((g) => g.id === activeGame) ?? GAME_TABS[0];
  const currentGroupProfile = getCurriculumGroup(schoolGroup);
  const nextGroup = schoolGroup === 'g8' ? null : getNextSchoolGroup(schoolGroup);

  const loadNextChallenge = (
    nextGame = activeGame,
    nextGroupId = schoolGroup,
    nextStreak = streak
  ) => {
    setChallenge(generateTangChallenge(nextGame, nextGroupId, nextStreak));
    setSelectedBubbleIds([]);
    setShowCoachTip(false);
    setFeedback(null);
    setHadPenaltyOnCurrent(false);
    questionStartRef.current = Date.now();
  };

  const handleSuccess = () => {
    const timeTakenMs = Date.now() - questionStartRef.current;
    const speedReward = calculateSpeedGemReward(
      timeTakenMs,
      hadPenaltyOnCurrent || showCoachTip
    );
    const nextStreak = streak + 1;
    const isStreakBonus = nextStreak % 5 === 0;
    const shouldAutoPromote =
      nextStreak > 0 &&
      nextStreak % AUTO_PROMOTE_STREAK === 0 &&
      nextGroup !== null;

    const bonusGems = shouldAutoPromote ? 10 : isStreakBonus ? 5 : 0;
    const bonusXp = shouldAutoPromote ? 50 : isStreakBonus ? 25 : 0;
    const gemsReward = speedReward.gems + bonusGems;
    const xpReward = speedReward.xp + bonusXp;

    setLastSpeedReward(speedReward);
    setFeedback('correct');
    setStreak(nextStreak);
    setDojoSavedNotice(false);
    setSessionGemsEarned((prev) => prev + gemsReward);
    onEarnReward(gemsReward, xpReward);

    if (shouldAutoPromote && nextGroup) {
      const promotedProfile = getCurriculumGroup(nextGroup);
      soundEngine.playVictoryFanfare();
      setLevelUpBanner(
        lang === 'nl'
          ? `🚀 NIVEAU OMHOOG! Welkom in ${promotedProfile.shortLabel.nl} (${promotedProfile.ageRange} jr)!`
          : `🚀 LEVEL UP! Welcome to ${promotedProfile.shortLabel.en} (Age ${promotedProfile.ageRange})!`
      );
      try {
        confetti({
          particleCount: 90,
          spread: 85,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
      setTimeout(() => {
        onChangeSchoolGroup(nextGroup);
        loadNextChallenge(activeGame, nextGroup, 0);
      }, 950);
      setTimeout(() => setLevelUpBanner(null), 4500);
      return;
    }

    if (isStreakBonus) {
      soundEngine.playVictoryFanfare();
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.55 },
        });
      } catch {
        // ignore
      }
    } else {
      soundEngine.playCorrect(nextStreak);
    }

    setTimeout(() => {
      loadNextChallenge(activeGame, schoolGroup, nextStreak);
    }, 800);
  };

  const handleMiss = () => {
    soundEngine.playWrong();
    setFeedback('wrong');
    setStreak(0);
    setShowCoachTip(true);
    setDojoSavedNotice(true);
    setHadPenaltyOnCurrent(true);
    if (onRecordMiss) {
      onRecordMiss(challengeToTrickyFact(challenge));
    }
    setTimeout(() => {
      setFeedback(null);
      setSelectedBubbleIds([]);
    }, 650);
  };

  const handleBubbleTap = (bubbleId: string) => {
    if (challenge.kind !== 'sodaBubbles' || feedback === 'correct') return;
    soundEngine.playSelect();

    if (selectedBubbleIds.includes(bubbleId)) {
      setSelectedBubbleIds((prev) => prev.filter((id) => id !== bubbleId));
      return;
    }

    const next = [...selectedBubbleIds, bubbleId];
    setSelectedBubbleIds(next);

    if (next.length === 2) {
      const b1 = challenge.bubbles.find((b) => b.id === next[0]);
      const b2 = challenge.bubbles.find((b) => b.id === next[1]);
      if (!b1 || !b2) return;
      const val =
        challenge.op === '+' ? b1.value + b2.value : b1.value * b2.value;
      if (val === challenge.target) {
        handleSuccess();
      } else {
        handleMiss();
      }
    }
  };

  const handleChoiceTap = (choice: number) => {
    if (challenge.kind === 'sodaBubbles' || feedback === 'correct') return;
    if (choice === challenge.answer) {
      handleSuccess();
    } else {
      handleMiss();
    }
  };

  // Helper to get concept badge if present on challenge
  const conceptBadgeText =
    'conceptBadge' in challenge && challenge.conceptBadge
      ? challenge.conceptBadge[lang]
      : challenge.kind === 'powerLab'
        ? challenge.topicTag[lang]
        : currentGroupProfile.shortLabel[lang];

  return (
    <div
      data-testid="tang-arcade-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div className="light-surface-card relative w-full max-w-4xl bg-gradient-to-b from-[#230c47] via-[#14072b] to-[#0a0316] border-2 border-cyan-400/70 rounded-3xl p-3.5 sm:p-5 text-white shadow-[0_0_60px_rgba(34,211,238,0.4)] my-auto max-h-[95vh] overflow-y-auto">
        <button
          type="button"
          data-testid="close-tang-arcade-btn"
          onClick={onClose}
          className="light-pill-btn absolute top-3.5 right-3.5 p-2 rounded-full bg-purple-900/80 hover:bg-purple-800 text-purple-200 z-10 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-purple-700/50 pr-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-300/50 text-cyan-300 text-xs font-black mb-0.5">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'nl'
                  ? 'HUNTR/X REKEN-ARCADE • IB PYP MISSIES'
                  : 'HUNTR/X MATH ARCADE • IB PYP MISSIONS'}
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              {activeGameMeta.emoji}{' '}
              {lang === 'nl' ? activeGameMeta.titleNl : activeGameMeta.titleEn}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div
              title={
                lang === 'nl'
                  ? `Bij ${AUTO_PROMOTE_STREAK} op rij ga je automatisch een groep omhoog!`
                  : `Hit a ${AUTO_PROMOTE_STREAK}-streak to auto-advance to the next group!`
              }
              className="px-3 py-1 rounded-2xl bg-purple-950 border border-amber-400/60 font-display font-black text-sm sm:text-base text-amber-300 flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>
                {streak}/{AUTO_PROMOTE_STREAK}
              </span>
            </div>
            <div
              data-testid="tang-arcade-gems"
              className="px-3 py-1 rounded-2xl bg-purple-950 border border-cyan-400/60 font-display font-black text-sm sm:text-base text-cyan-300 flex items-center gap-1.5"
            >
              <span>💎</span>
              <span>{gems}</span>
              {sessionGemsEarned > 0 && (
                <span className="text-emerald-300 text-xs">
                  (+{sessionGemsEarned})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Auto Level-Up Celebration Banner */}
        {levelUpBanner && (
          <div
            data-testid="arcade-levelup-banner"
            className="my-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 text-slate-950 font-display font-black text-base sm:text-lg text-center shadow-[0_0_30px_rgba(251,191,36,0.7)] animate-bounce"
          >
            {levelUpBanner}
          </div>
        )}

        {/* 6 Game Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 my-2.5">
          {GAME_TABS.map((tab) => {
            const active = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`tang-tab-${tab.id}`}
                onClick={() => {
                  soundEngine.playSelect();
                  setActiveGame(tab.id);
                }}
                className={`p-2 sm:p-2.5 rounded-2xl border-2 text-left transition-all flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-pink-500/40 via-purple-600/40 to-cyan-500/40 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                    : 'bg-purple-950/50 border-purple-800/50 hover:border-purple-500/60 opacity-85'
                }`}
              >
                <span className="text-xl sm:text-2xl">{tab.emoji}</span>
                <div className="min-w-0">
                  <div className="font-display font-black text-xs sm:text-sm text-white truncate">
                    {lang === 'nl' ? tab.titleNl : tab.titleEn}
                  </div>
                  <div className="text-[10px] sm:text-xs text-cyan-200 font-bold truncate">
                    {lang === 'nl' ? tab.subtitleNl : tab.subtitleEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* School Group Selector Bar + Active Concept Tags */}
        <div className="flex flex-col gap-1.5 px-3 py-2 rounded-2xl bg-purple-950/60 border border-purple-800/60 mb-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-black text-purple-200">
              {lang === 'nl'
                ? '🎓 Niveau (groeit automatisch mee!):'
                : '🎓 Level (auto-advances as you win!):'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {CURRICULUM_GROUPS.map((grp) => {
                const active = grp.id === schoolGroup;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    data-testid={`arcade-group-${grp.id}`}
                    onClick={() => {
                      soundEngine.playSelect();
                      onChangeSchoolGroup(grp.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 shadow scale-105'
                        : 'bg-purple-900/60 text-purple-200 hover:bg-purple-800'
                    }`}
                  >
                    {grp.mascotEmoji} {grp.shortLabel[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Concept Tags for current Group */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-purple-800/40">
            <span className="text-[11px] font-black text-amber-300">
              {currentGroupProfile.fullTitle[lang]}:
            </span>
            {currentGroupProfile.conceptTags[lang].map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[11px] font-bold text-cyan-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Active Mini-Game Stage */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border-2 transition-all ${
            feedback === 'correct'
              ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.45)]'
              : feedback === 'wrong'
                ? 'bg-rose-950/60 border-rose-400'
                : 'bg-purple-950/55 border-purple-700/70'
          }`}
        >
          {/* Concept Chip */}
          <div className="flex items-center justify-between mb-3">
            <span
              data-testid="arcade-concept-badge"
              className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-200 text-xs sm:text-sm font-black"
            >
              ✨ {conceptBadgeText}
            </span>
            <span className="text-xs sm:text-sm font-black text-cyan-300">
              <Trophy className="w-4 h-4 inline mr-1" />
              {nextGroup
                ? lang === 'nl'
                  ? `Nog ${AUTO_PROMOTE_STREAK - (streak % AUTO_PROMOTE_STREAK)} goed voor ${getCurriculumGroup(nextGroup).shortLabel.nl}!`
                  : `${AUTO_PROMOTE_STREAK - (streak % AUTO_PROMOTE_STREAK)} more to unlock ${getCurriculumGroup(nextGroup).shortLabel.en}!`
                : lang === 'nl'
                  ? '👑 Hoogste Groep 8 / PYP 6 Meester!'
                  : '👑 Top Year 6 / PYP 6 Master!'}
            </span>
          </div>

          {/* GAME 1: SAJA SODA-POP BUBBLES */}
          {challenge.kind === 'sodaBubbles' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-base sm:text-xl font-black text-cyan-200 mb-3">
                {challenge.prompt[lang]}
              </div>

              {/* Target Star Badge */}
              <div className="my-2 px-8 py-4 rounded-3xl bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-600 text-slate-950 font-display font-black text-4xl sm:text-5xl shadow-[0_0_30px_rgba(251,191,36,0.65)] flex items-center gap-3">
                <span>🎯 {challenge.target}</span>
                <span className="text-xl sm:text-2xl px-3 py-1 rounded-full bg-black/25 text-white">
                  {challenge.op}
                </span>
              </div>

              {/* 6 Floating Bubbles */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3.5 w-full max-w-2xl mt-5">
                {challenge.bubbles.map((bub) => {
                  const isSelected = selectedBubbleIds.includes(bub.id);
                  return (
                    <button
                      key={bub.id}
                      type="button"
                      data-testid={`tang-bubble-${bub.id}`}
                      data-value={bub.value}
                      onClick={() => handleBubbleTap(bub.id)}
                      className={`keep-dark-card h-24 sm:h-28 rounded-full bg-gradient-to-br ${bub.color} border-4 font-display font-black text-3xl sm:text-4xl text-white shadow-lg transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-yellow-200 scale-110 ring-4 ring-yellow-300'
                          : 'border-white/70 hover:scale-105'
                      }`}
                    >
                      <span>{bub.value}</span>
                      <span className="text-[11px] opacity-90">🫧 SODA</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME 2: HONMOON LASER-LIJN (INTERACTIVE NUMBER LINE) */}
          {challenge.kind === 'numberLine' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-base sm:text-xl font-black text-cyan-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-numberline-equation"
                className="my-1.5 px-6 py-2.5 rounded-3xl bg-slate-950/90 border-2 border-cyan-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_25px_rgba(34,211,238,0.4)]"
              >
                📏 {challenge.questionEquation}
              </div>

              {/* Animated Visual SVG Number Line */}
              <div className="w-full max-w-2xl my-2.5 p-2.5 sm:p-3 rounded-2xl bg-slate-950/85 border border-cyan-500/40">
                {(() => {
                  const range = Math.max(1, challenge.max - challenge.min);
                  const toX = (val: number) =>
                    45 + ((val - challenge.min) / range) * 510;
                  const startX = toX(challenge.startVal);
                  const endX = toX(challenge.endVal);
                  const midX = (startX + endX) / 2;
                  const zeroX =
                    challenge.min <= 0 && challenge.max >= 0 ? toX(0) : null;

                  return (
                    <svg
                      viewBox="0 0 600 135"
                      className="w-full h-28 sm:h-32 overflow-visible"
                    >
                      <defs>
                        <linearGradient
                          id="honmoonLineGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="50%" stopColor="#f472b6" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                      </defs>

                      {/* Sub-zero vs Positive Track */}
                      <line
                        x1="35"
                        y1="88"
                        x2="565"
                        y2="88"
                        stroke="url(#honmoonLineGrad)"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />

                      {/* Zero Anchor Highlight */}
                      {zeroX !== null && (
                        <g>
                          <line
                            x1={zeroX}
                            y1="62"
                            x2={zeroX}
                            y2="112"
                            stroke="#fbbf24"
                            strokeWidth="3.5"
                            strokeDasharray="4 2"
                          />
                          <text
                            x={zeroX}
                            y="55"
                            textAnchor="middle"
                            fill="#fde68a"
                            fontSize="13"
                            fontWeight="900"
                          >
                            0★
                          </text>
                        </g>
                      )}

                      {/* Tick Marks & Numbers */}
                      {challenge.ticks.map((t) => {
                        const x = toX(t);
                        const isZero = t === 0;
                        return (
                          <g key={t}>
                            <line
                              x1={x}
                              y1={isZero ? 74 : 79}
                              x2={x}
                              y2={isZero ? 102 : 97}
                              stroke={
                                t < 0
                                  ? '#38bdf8'
                                  : isZero
                                    ? '#fbbf24'
                                    : '#f472b6'
                              }
                              strokeWidth={isZero ? 3.5 : 2.5}
                            />
                            <text
                              x={x}
                              y="122"
                              textAnchor="middle"
                              fill={
                                t < 0
                                  ? '#7dd3fc'
                                  : isZero
                                    ? '#fde047'
                                    : '#fbcfe8'
                              }
                              fontSize="14"
                              fontWeight="900"
                            >
                              {t}
                            </text>
                          </g>
                        );
                      })}

                      {/* Animated Jump Arc */}
                      <path
                        d={`M ${startX} 84 Q ${midX} 14 ${endX} 84`}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="4"
                        strokeDasharray="8 4"
                      />

                      {/* Jump Label Badge */}
                      <rect
                        x={midX - 36}
                        y="8"
                        width="72"
                        height="26"
                        rx="12"
                        fill="#0f172a"
                        stroke="#22d3ee"
                        strokeWidth="2"
                      />
                      <text
                        x={midX}
                        y="26"
                        textAnchor="middle"
                        fill="#67e8f9"
                        fontSize="15"
                        fontWeight="900"
                      >
                        {challenge.mode === 'jump'
                          ? '+ ?'
                          : challenge.mode === 'midpoint'
                            ? '↔ ?'
                            : challenge.jumpVal >= 0
                              ? `+${challenge.jumpVal}`
                              : `${challenge.jumpVal}`}
                      </text>

                      {/* Start Marker Orb */}
                      <circle
                        cx={startX}
                        cy="88"
                        r="11"
                        fill="#ec4899"
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                      <text
                        x={startX}
                        y="70"
                        textAnchor="middle"
                        fill="#f9a8d4"
                        fontSize="14"
                        fontWeight="900"
                      >
                        {challenge.startVal}
                      </text>

                      {/* End / Target Marker Orb */}
                      <circle
                        cx={endX}
                        cy="88"
                        r="13"
                        fill="#fbbf24"
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                      <text
                        x={endX}
                        y="93"
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="14"
                        fontWeight="900"
                      >
                        {challenge.mode === 'land' ? '?' : challenge.endVal}
                      </text>
                    </svg>
                  );
                })()}
              </div>

              {/* 4 Big Answer Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-2">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 hover:from-amber-400 hover:to-cyan-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 3: GWI-MA SUB-ZERO PORTAAL (NEGATIVE NUMBERS & THERMOMETER) */}
          {challenge.kind === 'subZero' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-base sm:text-xl font-black text-cyan-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-subzero-equation"
                className="my-1.5 px-7 py-3 rounded-3xl bg-slate-950/90 border-2 border-sky-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_30px_rgba(56,189,248,0.45)]"
              >
                ❄️ {challenge.equationDisplay}
              </div>

              {/* Visual Sub-Zero Thermometer / Portal Gauge */}
              <div className="w-full max-w-xl my-2.5 p-3 rounded-2xl bg-slate-950/90 border border-sky-500/40">
                <div className="flex items-center justify-between text-xs sm:text-sm font-black mb-2">
                  <span className="text-sky-300">
                    ❄️ SUB-ZERO ({challenge.scaleMin}°)
                  </span>
                  <span className="text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40">
                    0° PORTAAL-GRENS
                  </span>
                  <span className="text-pink-300">
                    🔥 HONMOON (+{challenge.scaleMax}°)
                  </span>
                </div>

                {(() => {
                  const span = Math.max(
                    1,
                    challenge.scaleMax - challenge.scaleMin
                  );
                  const clampPct = (v: number) =>
                    Math.max(
                      4,
                      Math.min(96, ((v - challenge.scaleMin) / span) * 100)
                    );
                  const zeroPct = clampPct(0);
                  const curPct = clampPct(challenge.currentTemp);

                  return (
                    <div className="relative h-12 rounded-full bg-gradient-to-r from-sky-900 via-slate-900 to-rose-900 border-2 border-sky-400/60 overflow-visible flex items-center">
                      {/* Zero Dividing Line */}
                      <div
                        style={{ left: `${zeroPct}%` }}
                        className="absolute top-0 bottom-0 w-1 bg-amber-300 z-10"
                      />
                      {/* Current Temp Marker */}
                      <div
                        style={{ left: `${curPct}%` }}
                        className="absolute -translate-x-1/2 px-3 py-1 rounded-full bg-sky-400 text-slate-950 font-display font-black text-sm sm:text-base shadow-lg border-2 border-white z-20"
                      >
                        {challenge.currentTemp}°
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-2">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className={`keep-dark-card py-4 sm:py-5 rounded-2xl border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white shadow-lg transition-all hover:scale-105 cursor-pointer ${
                      c < 0
                        ? 'bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 hover:from-sky-400 hover:to-cyan-300 hover:text-slate-950'
                        : 'bg-gradient-to-br from-pink-600 via-fuchsia-600 to-purple-700 hover:from-amber-400 hover:to-pink-500 hover:text-slate-950'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 4: SAINGEOM MISSING RUNE */}
          {challenge.kind === 'missingRune' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-base sm:text-xl font-black text-amber-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-missing-equation"
                className="my-3 px-7 py-5 rounded-3xl bg-slate-950/90 border-2 border-amber-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_25px_rgba(251,191,36,0.35)]"
              >
                ⚔️ {challenge.equationDisplay}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-3">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 5: DERPY'S BREAK-APART BEAT */}
          {challenge.kind === 'breakApart' && (
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-200 text-base sm:text-lg font-black mb-2">
                <span>🐯 {challenge.fullEquation}</span>
              </div>

              <div className="text-sm sm:text-lg font-bold text-purple-100 max-w-xl mb-2">
                {challenge.stepPrompt[lang]}
              </div>

              <div
                data-testid="tang-breakapart-bridge"
                className="my-2 px-6 py-4 rounded-3xl bg-slate-950/90 border-2 border-cyan-400 font-display font-black text-2xl sm:text-4xl text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.35)]"
              >
                {challenge.bridgeDisplay}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-3">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 hover:from-amber-400 hover:to-cyan-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 6: MIRA'S KRISTAL-LAB (IB PYP CONCEPTS: FRACTIONS, %, RATIOS, PLACE VALUE) */}
          {challenge.kind === 'powerLab' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-base sm:text-xl font-black text-pink-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-powerlab-formula"
                className="my-3 px-7 py-5 rounded-3xl bg-slate-950/90 border-2 border-pink-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_28px_rgba(244,114,182,0.4)]"
              >
                🧪 {challenge.visualFormula}
              </div>

              {/* Visual Crystal Bar for Fractions / Percentages / Ratios */}
              {challenge.visualBar && (
                <div className="w-full max-w-md my-2 p-3 rounded-2xl bg-slate-950/80 border border-pink-400/40">
                  <div className="flex justify-between text-xs font-black text-pink-200 mb-1.5">
                    <span>⚡ HONMOON KRISTAL-METER</span>
                    <span>{challenge.visualBar.label}</span>
                  </div>
                  <div className="h-5 w-full rounded-full bg-purple-950 overflow-hidden border border-pink-400/50 p-0.5">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (challenge.visualBar.filled /
                              Math.max(1, challenge.visualBar.total)) *
                              100
                          )
                        )}%`,
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-3">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 hover:from-amber-400 hover:to-pink-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coach Tip & Dojo Mistake Routing Footer */}
          <div className="mt-5 pt-3 border-t border-purple-800/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="tang-hint-btn"
                onClick={() => {
                  soundEngine.playHint();
                  setShowCoachTip((prev) => !prev);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/50 text-amber-200 text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4" />
                <span>
                  {lang === 'nl' ? 'Slimme Reken-Tip' : 'Smart Math Trick'}
                </span>
              </button>

              {dojoSavedNotice && (
                <div
                  data-testid="arcade-dojo-saved-badge"
                  className="px-3 py-1.5 rounded-xl bg-rose-500/25 border border-rose-300/60 text-rose-100 text-xs sm:text-sm font-black flex items-center gap-2"
                >
                  <span>
                    {lang === 'nl'
                      ? '🥋 Opgeslagen in jouw Dojo om te oefenen!'
                      : '🥋 Saved to your Dojo for practice!'}
                  </span>
                  {onOpenDojo && (
                    <button
                      type="button"
                      data-testid="arcade-open-dojo-btn"
                      onClick={onOpenDojo}
                      className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Dojo</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {showCoachTip && (
              <div
                data-testid="tang-coach-tip"
                className="text-xs sm:text-sm font-bold text-amber-200 bg-black/50 px-3.5 py-2 rounded-xl border border-amber-400/50"
              >
                {challenge.coachTip[lang]}
              </div>
            )}

            <div
              data-testid="arcade-speed-reward-badge"
              className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {feedback === 'correct' && lastSpeedReward
                  ? `${lastSpeedReward.badge[lang]} • +${lastSpeedReward.gems} 💎`
                  : lang === 'nl'
                    ? '⚡ Snel: +8 💎 • 🔥 Vlot: +5 💎 • 🐢 Rustig: +1 💎'
                    : '⚡ Fast: +8 💎 • 🔥 Quick: +5 💎 • 🐢 Slow: +1 💎'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
