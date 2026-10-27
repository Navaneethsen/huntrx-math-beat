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
  LayoutGrid,
  Play,
  ArrowLeft,
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
import { StageVolume3D } from './StageVolume3D';

export type ArcadeCategory = 'all' | 'numberSense' | 'visualShapes' | 'algebraSubZero';

export interface ArcadeGameMeta {
  id: TangMiniGameId;
  category: Exclude<ArcadeCategory, 'all'>;
  emoji: string;
  titleNl: string;
  titleEn: string;
  subtitleNl: string;
  subtitleEn: string;
  badgeGradient: string;
  cardBorder: string;
}

export const ARCADE_GAMES_CATALOG: ArcadeGameMeta[] = [
  {
    id: 'sodaBubbles',
    category: 'numberSense',
    emoji: '🫧',
    titleNl: 'Soda-Pop Bubbels',
    titleEn: 'Soda-Pop Bubbles',
    subtitleNl: 'Getalparen (+ & ×)',
    subtitleEn: 'Number Pairs (+ & ×)',
    badgeGradient: 'from-pink-400/45 via-rose-400/35 to-sky-300/45 border border-pink-200/75',
    cardBorder: 'border-pink-300/55 hover:border-pink-200',
  },
  {
    id: 'numberLine',
    category: 'visualShapes',
    emoji: '📏',
    titleNl: 'Laser Getallenlijn',
    titleEn: 'Laser Number Line',
    subtitleNl: 'Sprongen & Over 0',
    subtitleEn: 'Jumps & Across 0',
    badgeGradient: 'from-cyan-400/45 via-sky-400/35 to-blue-500/45 border border-cyan-200/75',
    cardBorder: 'border-cyan-300/55 hover:border-cyan-200',
  },
  {
    id: 'subZero',
    category: 'algebraSubZero',
    emoji: '❄️',
    titleNl: 'Sub-Zero Portaal',
    titleEn: 'Sub-Zero Portal',
    subtitleNl: 'Onder 0°C',
    subtitleEn: 'Below 0°C',
    badgeGradient: 'from-sky-400/45 via-cyan-300/35 to-rose-400/45 border border-sky-200/75',
    cardBorder: 'border-sky-300/55 hover:border-sky-200',
  },
  {
    id: 'missingRune',
    category: 'algebraSubZero',
    emoji: '⚔️',
    titleNl: 'Geheime Rune',
    titleEn: 'Missing Rune',
    subtitleNl: 'Algebra & n²',
    subtitleEn: 'Algebra & n²',
    badgeGradient: 'from-amber-400/45 via-yellow-300/35 to-orange-400/45 border border-amber-200/75',
    cardBorder: 'border-amber-300/55 hover:border-amber-200',
  },
  {
    id: 'breakApart',
    category: 'numberSense',
    emoji: '🐯',
    titleNl: 'Derpy Splits-Beat',
    titleEn: 'Derpy Split-Beat',
    subtitleNl: 'Slim Splitsen',
    subtitleEn: 'Smart Split',
    badgeGradient: 'from-emerald-400/45 via-teal-400/35 to-cyan-400/45 border border-emerald-200/75',
    cardBorder: 'border-emerald-300/55 hover:border-emerald-200',
  },
  {
    id: 'powerLab',
    category: 'visualShapes',
    emoji: '🧪',
    titleNl: 'Mira Kristal-Lab',
    titleEn: 'Mira Crystal Lab',
    subtitleNl: 'Breuken & %',
    subtitleEn: 'Fractions & %',
    badgeGradient: 'from-fuchsia-400/45 via-pink-400/35 to-purple-500/45 border border-fuchsia-200/75',
    cardBorder: 'border-fuchsia-300/55 hover:border-fuchsia-200',
  },
  {
    id: 'stageGrid',
    category: 'visualShapes',
    emoji: '🍱',
    titleNl: 'Zoey Podium-Rooster',
    titleEn: 'Zoey Stage Grid',
    subtitleNl: 'Oppervlakte & 3D',
    subtitleEn: 'Area & 3D Blocks',
    badgeGradient: 'from-violet-400/45 via-purple-400/35 to-cyan-400/45 border border-violet-200/75',
    cardBorder: 'border-violet-300/55 hover:border-violet-200',
  },
  {
    id: 'soulScale',
    category: 'algebraSubZero',
    emoji: '⚖️',
    titleNl: 'Jinu Ziel-Balans',
    titleEn: 'Jinu Soul Scale',
    subtitleNl: 'Weegschaal Balans',
    subtitleEn: 'Balance Scale',
    badgeGradient: 'from-amber-300/45 via-pink-400/35 to-cyan-400/45 border border-amber-200/75',
    cardBorder: 'border-amber-300/55 hover:border-amber-200',
  },
  {
    id: 'rhythmPattern',
    category: 'algebraSubZero',
    emoji: '⚡',
    titleNl: 'Rumi Ritme-Reeks',
    titleEn: 'Rumi Rhythm Track',
    subtitleNl: 'Getallen-Patronen',
    subtitleEn: 'Number Patterns',
    badgeGradient: 'from-rose-400/45 via-pink-400/35 to-amber-400/45 border border-rose-200/75',
    cardBorder: 'border-rose-300/55 hover:border-rose-200',
  },
  {
    id: 'targetTrio',
    category: 'numberSense',
    emoji: '🎯',
    titleNl: 'Sussie Trio-Doel',
    titleEn: 'Sussie Target Trio',
    subtitleNl: '3-Kaarten & Hoeken',
    subtitleEn: '3-Cards & Angles',
    badgeGradient: 'from-teal-400/45 via-cyan-400/35 to-sky-400/45 border border-teal-200/75',
    cardBorder: 'border-teal-300/55 hover:border-teal-200',
  },
];

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
  pageMode?: boolean;
  initialViewMode?: 'hub' | 'stage';
}

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
  pageMode = false,
  initialViewMode = 'stage',
}) => {
  const [activeGame, setActiveGame] = useState<TangMiniGameId>(initialGame);
  const [viewMode, setViewMode] = useState<'hub' | 'stage'>(initialViewMode);
  const [categoryFilter, setCategoryFilter] = useState<ArcadeCategory>('all');
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
  const missTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveGame(initialGame);
      setViewMode(initialViewMode);
      setChallenge(generateTangChallenge(initialGame, schoolGroup, 0));
      setSelectedBubbleIds([]);
      setShowCoachTip(false);
      setFeedback(null);
      setDojoSavedNotice(false);
      setHadPenaltyOnCurrent(false);
      setLastSpeedReward(null);
      questionStartRef.current = Date.now();
    }
  }, [isOpen, initialGame, initialViewMode]);

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
    ARCADE_GAMES_CATALOG.find((g) => g.id === activeGame) ??
    ARCADE_GAMES_CATALOG[0];
  const currentGroupProfile = getCurriculumGroup(schoolGroup);
  const nextGroup = schoolGroup === 'g8' ? null : getNextSchoolGroup(schoolGroup);

  const filteredCatalog =
    categoryFilter === 'all'
      ? ARCADE_GAMES_CATALOG
      : ARCADE_GAMES_CATALOG.filter((g) => g.category === categoryFilter);

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

    setTimeout(
      () => {
        loadNextChallenge(activeGame, schoolGroup, nextStreak);
      },
      challenge.kind === 'sodaBubbles' ? 1150 : 800
    );
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
    if (missTimerRef.current) {
      clearTimeout(missTimerRef.current);
    }
    missTimerRef.current = setTimeout(() => {
      setFeedback(null);
      setSelectedBubbleIds([]);
      missTimerRef.current = null;
    }, 650);
  };

  const handleBubbleTap = (bubbleId: string) => {
    if (challenge.kind !== 'sodaBubbles' || feedback === 'correct') return;
    soundEngine.playSelect();

    if (missTimerRef.current) {
      clearTimeout(missTimerRef.current);
      missTimerRef.current = null;
      setFeedback(null);
    }

    const baseSelected =
      selectedBubbleIds.length >= 2 ? [] : selectedBubbleIds;

    if (baseSelected.includes(bubbleId)) {
      setSelectedBubbleIds(baseSelected.filter((id) => id !== bubbleId));
      return;
    }

    const next = [...baseSelected, bubbleId];
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

  const conceptBadgeText =
    'conceptBadge' in challenge && challenge.conceptBadge
      ? challenge.conceptBadge[lang]
      : challenge.kind === 'powerLab'
        ? challenge.topicTag[lang]
        : currentGroupProfile.shortLabel[lang];

  const innerContent = (
    <div className="light-surface-card relative w-full bg-gradient-to-b from-[#230c47] via-[#14072b] to-[#0a0316] border-2 border-cyan-400/60 rounded-3xl p-4 sm:p-6 text-white shadow-[0_0_50px_rgba(34,211,238,0.28)] space-y-4">
      {/* Top Bar: Back/Close + Title + Streak & Gems + Hub Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-700/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="close-tang-arcade-btn"
            onClick={() => {
              soundEngine.playTap();
              onClose();
            }}
            className="px-3.5 py-2 rounded-2xl bg-purple-900/80 hover:bg-purple-800 border border-pink-400/50 text-pink-100 font-display font-black text-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            {pageMode ? (
              <>
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'nl' ? 'Home' : 'Home'}</span>
              </>
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-300/50 text-cyan-300 text-xs font-black">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'nl'
                  ? '10 REKEN-ARCADE GAMES'
                  : '10 MATH ARCADE GAMES'}
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-3xl text-white leading-tight mt-0.5">
              {viewMode === 'hub'
                ? lang === 'nl'
                  ? '🕹️ Kies jouw Arcade Game!'
                  : '🕹️ Pick Your Arcade Game!'
                : `${activeGameMeta.emoji} ${
                    lang === 'nl'
                      ? activeGameMeta.titleNl
                      : activeGameMeta.titleEn
                  }`}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle between 10-Game Hub Wall and Active Stage */}
          <button
            type="button"
            data-testid="arcade-toggle-hub-btn"
            onClick={() => {
              soundEngine.playTap();
              setViewMode((prev) => (prev === 'hub' ? 'stage' : 'hub'));
            }}
            className={`px-3.5 py-2 rounded-2xl font-display font-black text-xs sm:text-sm flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
              viewMode === 'hub'
                ? 'bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 border-white shadow-lg'
                : 'bg-purple-900/80 hover:bg-purple-800 border-amber-300/60 text-amber-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>
              {viewMode === 'hub'
                ? lang === 'nl'
                  ? '▶ Terug naar Spel'
                  : '▶ Back to Game'
                : lang === 'nl'
                  ? '🕹️ Alle 10 Games'
                  : '🕹️ All 10 Games'}
            </span>
          </button>

          <div
            title={
              lang === 'nl'
                ? `Bij ${AUTO_PROMOTE_STREAK} op rij ga je automatisch een groep omhoog!`
                : `Hit a ${AUTO_PROMOTE_STREAK}-streak to auto-advance to the next group!`
            }
            className="px-3.5 py-2 rounded-2xl bg-purple-950 border border-amber-400/60 font-display font-black text-sm sm:text-base text-amber-300 flex items-center gap-1.5"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>
              {streak}/{AUTO_PROMOTE_STREAK}
            </span>
          </div>

          <div
            data-testid="tang-arcade-gems"
            className="px-3.5 py-2 rounded-2xl bg-purple-950 border border-cyan-400/60 font-display font-black text-sm sm:text-base text-cyan-300 flex items-center gap-1.5"
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
          className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 text-slate-950 font-display font-black text-base sm:text-xl text-center shadow-[0_0_30px_rgba(251,191,36,0.7)] animate-bounce"
        >
          {levelUpBanner}
        </div>
      )}

      {/* Clean School Group Bar (Big Tactile Pills, Minimal Text) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-purple-950/45 backdrop-blur-md border border-purple-400/50">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-display font-black text-amber-200">
            🎓 {currentGroupProfile.shortLabel[lang]}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-pink-500/30 border border-pink-300/65 text-xs font-black text-pink-100">
            {currentGroupProfile.ageRange} {lang === 'nl' ? 'jr' : 'yrs'}
          </span>
        </div>

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
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-display font-black transition-all cursor-pointer border ${
                  active
                    ? 'bg-gradient-to-r from-amber-400/65 via-pink-500/60 to-purple-500/65 text-white border-amber-200 shadow-[0_0_14px_rgba(244,114,182,0.45)] scale-105'
                    : 'bg-purple-900/40 border-purple-400/45 text-purple-100 hover:bg-purple-800/55'
                }`}
              >
                {grp.mascotEmoji} {grp.shortLabel[lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== VIEW A: FULL-PAGE 10-GAME ARCADE HUB WALL ==================== */}
      {viewMode === 'hub' && (
        <div data-testid="arcade-hub-wall" className="space-y-4 animate-fadeIn">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                {
                  id: 'all' as ArcadeCategory,
                  nl: '🌟 Alle 10 Games',
                  en: '🌟 All 10 Games',
                },
                {
                  id: 'numberSense' as ArcadeCategory,
                  nl: '🫧 Getalbegrip & Splitsen',
                  en: '🫧 Number Sense & Splits',
                },
                {
                  id: 'visualShapes' as ArcadeCategory,
                  nl: '📐 Lijn, Rooster & Breuken',
                  en: '📐 Line, Grid & Fractions',
                },
                {
                  id: 'algebraSubZero' as ArcadeCategory,
                  nl: '⚔️ Algebra, Balans & Onder 0°',
                  en: '⚔️ Algebra, Scale & Sub-Zero',
                },
              ] as const
            ).map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`arcade-cat-${cat.id}`}
                  onClick={() => {
                    soundEngine.playTap();
                    setCategoryFilter(cat.id);
                  }}
                  className={`px-4 py-2 rounded-2xl font-display font-black text-xs sm:text-sm transition-all cursor-pointer border ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400/65 to-blue-500/65 text-white border-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.4)] scale-[1.02]'
                      : 'bg-purple-900/40 border-purple-400/45 text-purple-100 hover:bg-purple-800/55'
                  }`}
                >
                  {lang === 'nl' ? cat.nl : cat.en}
                </button>
              );
            })}
          </div>

          {/* 10 Translucent Colored Game Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {filteredCatalog.map((game) => {
              const isSelected = activeGame === game.id;
              return (
                <button
                  key={game.id}
                  type="button"
                  data-testid={`arcade-hub-card-${game.id}`}
                  onClick={() => {
                    soundEngine.playCardOpen();
                    setActiveGame(game.id);
                    setViewMode('stage');
                  }}
                  className={`kid-block-card pad-3d-step p-4 rounded-3xl bg-gradient-to-br from-purple-900/45 via-indigo-950/45 to-slate-900/50 hover:from-purple-800/55 hover:to-indigo-900/55 backdrop-blur-md border ${
                    isSelected ? 'border-amber-300 ring-2 ring-amber-300/50' : game.cardBorder
                  } text-left flex flex-col justify-between gap-3 cursor-pointer`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.badgeGradient} flex items-center justify-center text-3xl shadow-sm animate-float-slow`}
                    >
                      {game.emoji}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400/65 to-pink-500/65 border border-amber-200/85 text-white font-display font-black text-xs flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" />
                      <span>{lang === 'nl' ? 'SPEEL' : 'PLAY'}</span>
                    </span>
                  </div>

                  <div>
                    <div className="font-display font-black text-lg text-white leading-snug">
                      {lang === 'nl' ? game.titleNl : game.titleEn}
                    </div>
                    <div className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-purple-950/55 border border-purple-400/40 text-purple-100 font-bold text-xs">
                      {lang === 'nl' ? game.subtitleNl : game.subtitleEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 10-GAME QUICK SWITCHER STRIP (Visible in Stage Mode) ==================== */}
      {viewMode === 'stage' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {ARCADE_GAMES_CATALOG.map((tab) => {
            const active = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`tang-tab-${tab.id}`}
                onClick={() => {
                  soundEngine.playSelect();
                  setActiveGame(tab.id);
                  setViewMode('stage');
                }}
                className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md ${
                  active
                    ? `bg-gradient-to-r ${tab.badgeGradient} border-amber-200 shadow-[0_0_16px_rgba(244,114,182,0.4)] scale-[1.02]`
                    : `bg-gradient-to-br ${tab.badgeGradient} opacity-75 hover:opacity-100`
                }`}
              >
                <span className="text-xl sm:text-2xl shrink-0">{tab.emoji}</span>
                <div className="min-w-0">
                  <div className="font-display font-black text-xs sm:text-sm text-white truncate">
                    {lang === 'nl' ? tab.titleNl : tab.titleEn}
                  </div>
                  <div className="text-[10px] sm:text-xs text-purple-100 font-bold truncate">
                    {lang === 'nl' ? tab.subtitleNl : tab.subtitleEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ==================== VIEW B: ACTIVE MINI-GAME STAGE ==================== */}
      {viewMode === 'stage' && (
        <div
          className={`p-4 sm:p-6 rounded-3xl border backdrop-blur-md transition-all ${
            feedback === 'correct'
              ? 'bg-emerald-500/20 border-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.35)]'
              : feedback === 'wrong'
                ? 'bg-rose-500/20 border-rose-300'
                : 'bg-gradient-to-b from-purple-950/45 via-indigo-950/40 to-slate-950/45 border-purple-400/50'
          }`}
        >
          {/* Concept Chip & Next Level Progress */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span
              data-testid="arcade-concept-badge"
              className="px-3.5 py-1 rounded-full bg-fuchsia-500/30 border border-pink-300/70 text-pink-100 text-xs sm:text-sm font-black"
            >
              ✨ {conceptBadgeText}
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-300">
              <Trophy className="w-4 h-4 inline mr-1" />
              {nextGroup
                ? lang === 'nl'
                  ? `Nog ${AUTO_PROMOTE_STREAK - (streak % AUTO_PROMOTE_STREAK)} goed ➔ ${getCurriculumGroup(nextGroup).shortLabel.nl}!`
                  : `${AUTO_PROMOTE_STREAK - (streak % AUTO_PROMOTE_STREAK)} more ➔ ${getCurriculumGroup(nextGroup).shortLabel.en}!`
                : lang === 'nl'
                  ? '👑 Groep 8 / PYP 6 Meester!'
                  : '👑 Year 6 / PYP 6 Master!'}
            </span>
          </div>

          {/* GAME 1: SAJA SODA-POP BUBBLES */}
          {challenge.kind === 'sodaBubbles' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-pink-100 mb-3">
                {challenge.prompt[lang]}
              </div>

              <div className="pad-3d-step my-2 px-9 py-4 rounded-3xl bg-gradient-to-r from-amber-400/45 via-pink-500/45 to-cyan-400/45 backdrop-blur-md border border-pink-200/80 text-white font-display font-black text-4xl sm:text-6xl shadow-[0_8px_24px_rgba(244,114,182,0.28)] flex items-center gap-3">
                <span>🎯 {challenge.target}</span>
                <span className="text-xl sm:text-3xl px-3.5 py-1 rounded-full bg-purple-950/50 border border-amber-300/70 text-amber-200">
                  {challenge.op}
                </span>
              </div>

              {/* Live Selected Bubble Combo OR Burst Solved Answer Banner */}
              {(() => {
                const firstBub = challenge.bubbles.find(
                  (b) => b.id === selectedBubbleIds[0]
                );
                const secondBub = challenge.bubbles.find(
                  (b) => b.id === selectedBubbleIds[1]
                );
                const isBurstSolved =
                  feedback === 'correct' && firstBub && secondBub;

                if (isBurstSolved) {
                  return (
                    <div
                      data-testid="tang-bubble-burst-answer"
                      className="my-2.5 px-7 py-2.5 rounded-full bg-gradient-to-r from-emerald-400/50 via-cyan-400/50 to-pink-400/50 backdrop-blur-md border-2 border-amber-200 text-white font-display font-black text-2xl sm:text-4xl shadow-[0_0_30px_rgba(103,232,249,0.75)] flex items-center gap-2.5 animate-target-burst"
                    >
                      <span>🫧</span>
                      <span>
                        {firstBub.value} {challenge.op} {secondBub.value} ={' '}
                        {challenge.target}!
                      </span>
                      <span>✨</span>
                    </div>
                  );
                }

                return (
                  <div className="my-2 px-5 py-1.5 rounded-full bg-purple-950/50 backdrop-blur-sm border border-purple-400/50 flex items-center gap-2.5 font-display font-black text-xl sm:text-2xl">
                    <span
                      className={`px-3.5 py-0.5 rounded-full border transition-all ${
                        firstBub
                          ? 'bg-cyan-400/45 text-white border-cyan-200 scale-110 shadow-[0_0_14px_rgba(103,232,249,0.65)]'
                          : 'bg-purple-900/40 text-cyan-200/80 border-purple-400/40'
                      }`}
                    >
                      {firstBub ? firstBub.value : '?'}
                    </span>
                    <span className="text-pink-300">{challenge.op}</span>
                    <span
                      className={`px-3.5 py-0.5 rounded-full border transition-all ${
                        secondBub
                          ? 'bg-pink-400/45 text-white border-pink-200 scale-110 shadow-[0_0_14px_rgba(244,114,182,0.65)]'
                          : 'bg-purple-900/40 text-cyan-200/80 border-purple-400/40'
                      }`}
                    >
                      {secondBub ? secondBub.value : '?'}
                    </span>
                    <span className="text-purple-200">=</span>
                    <span className="text-amber-300">{challenge.target}</span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-5 w-full max-w-2xl mt-5 pt-2">
                {challenge.bubbles.map((bub) => {
                  const isSelected = selectedBubbleIds.includes(bub.id);
                  const isBursting = isSelected && feedback === 'correct';
                  return (
                    <div
                      key={bub.id}
                      className="relative flex items-center justify-center h-24 sm:h-28"
                    >
                      {/* Popped sparkle number left behind as the soap bubble bursts */}
                      {isBursting && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-pop-in z-20">
                          <span className="font-display font-black text-3xl sm:text-4xl text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
                            ✨{bub.value}✨
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        data-testid={`tang-bubble-${bub.id}`}
                        data-value={bub.value}
                        aria-pressed={isSelected}
                        onClick={() => handleBubbleTap(bub.id)}
                        className={`real-soap-bubble real-soap-bubble-${bub.color} w-24 h-24 sm:w-28 sm:h-28 rounded-full font-display font-black text-3xl sm:text-4xl text-white flex items-center justify-center cursor-pointer ${
                          isBursting
                            ? 'real-soap-bubble-burst z-20'
                            : isSelected
                              ? 'real-soap-bubble-selected z-10'
                              : 'hover:scale-105 animate-float-slow'
                        }`}
                      >
                        <span
                          className={`drop-shadow-[0_2px_6px_rgba(15,23,42,0.55)] ${
                            isSelected ? 'scale-110 text-white' : ''
                          }`}
                        >
                          {bub.value}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME 2: HONMOON LASER-LIJN (INTERACTIVE NUMBER LINE) */}
          {challenge.kind === 'numberLine' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-cyan-100 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-numberline-equation"
                className="pad-3d-step my-2 px-7 py-3 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-blue-500/25 to-indigo-500/30 backdrop-blur-md border border-cyan-200/75 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_8px_24px_rgba(56,189,248,0.22)]"
              >
                📏{' '}
                {lang === 'nl'
                  ? challenge.questionEquation
                  : (challenge.questionEquationEn ?? challenge.questionEquation)}
              </div>

              <div className="w-full max-w-2xl my-3 p-3 sm:p-4 rounded-2xl bg-slate-900/45 backdrop-blur-md border border-cyan-300/45">
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
                      className="w-full h-28 sm:h-36 overflow-visible"
                    >
                      <defs>
                        <linearGradient
                          id="honmoonLineGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.85)" />
                          <stop offset="50%" stopColor="rgba(251, 191, 36, 0.9)" />
                          <stop offset="100%" stopColor="rgba(244, 114, 182, 0.85)" />
                        </linearGradient>
                        <radialGradient id="orbPink3D" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="45%" stopColor="rgba(249, 168, 212, 0.9)" />
                          <stop offset="100%" stopColor="rgba(236, 72, 153, 0.85)" />
                        </radialGradient>
                        <radialGradient id="orbGold3D" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="rgba(253, 230, 138, 0.92)" />
                          <stop offset="100%" stopColor="rgba(245, 158, 11, 0.88)" />
                        </radialGradient>
                      </defs>

                      {/* Translucent Colored Laser Rail */}
                      <line
                        x1="35"
                        y1="88"
                        x2="565"
                        y2="88"
                        stroke="url(#honmoonLineGrad)"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />

                      {zeroX !== null && (
                        <g>
                          <line
                            x1={zeroX}
                            y1="62"
                            x2={zeroX}
                            y2="112"
                            stroke="#fbbf24"
                            strokeWidth="3"
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
                                isZero
                                  ? '#fbbf24'
                                  : t < 0
                                    ? '#7dd3fc'
                                    : '#f9a8d4'
                              }
                              strokeWidth={isZero ? 3.5 : 2.5}
                            />
                            <text
                              x={x}
                              y="122"
                              textAnchor="middle"
                              fill={
                                isZero
                                  ? '#fde68a'
                                  : t < 0
                                    ? '#bae6fd'
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

                      <path
                        d={`M ${startX} 84 Q ${midX} 14 ${endX} 84`}
                        fill="none"
                        stroke="rgba(103, 232, 249, 0.9)"
                        strokeWidth="3.5"
                        strokeDasharray="7 4"
                      />

                      <rect
                        x={midX - 36}
                        y="8"
                        width="72"
                        height="26"
                        rx="12"
                        fill="rgba(14, 116, 144, 0.65)"
                        stroke="rgba(165, 243, 252, 0.9)"
                        strokeWidth="1.6"
                      />
                      <text
                        x={midX}
                        y="26"
                        textAnchor="middle"
                        fill="#ecfeff"
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

                      {/* 3D Start Rose-Glass Sphere */}
                      <circle
                        cx={startX}
                        cy="88"
                        r="12"
                        fill="url(#orbPink3D)"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <text
                        x={startX}
                        y="68"
                        textAnchor="middle"
                        fill="#fdf2f8"
                        fontSize="14"
                        fontWeight="900"
                      >
                        {challenge.startVal}
                      </text>

                      {/* 3D Target/End Golden-Glass Sphere */}
                      <circle
                        cx={endX}
                        cy="88"
                        r="14"
                        fill="url(#orbGold3D)"
                        stroke="#ffffff"
                        strokeWidth="2"
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-2">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-cyan-400/35 to-blue-600/35 hover:from-cyan-400/50 hover:to-blue-500/50 border border-cyan-200/70 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 3: GWI-MA SUB-ZERO PORTAAL */}
          {challenge.kind === 'subZero' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-sky-100 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-subzero-equation"
                className="pad-3d-step my-2 px-7 py-3.5 rounded-3xl bg-gradient-to-r from-sky-500/35 via-indigo-500/30 to-rose-500/35 backdrop-blur-md border border-sky-200/75 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_8px_24px_rgba(56,189,248,0.22)]"
              >
                ❄️ {challenge.equationDisplay}
              </div>

              <div className="w-full max-w-xl my-3 p-4 rounded-2xl bg-slate-900/45 backdrop-blur-md border border-sky-300/45">
                <div className="flex items-center justify-between text-xs sm:text-sm font-black mb-2.5">
                  <span className="text-cyan-300">
                    ❄️ SUB-ZERO ({challenge.scaleMin}°)
                  </span>
                  <span className="text-amber-200 px-2.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/65">
                    {lang === 'nl' ? '0° GRENS' : '0° ZERO'}
                  </span>
                  <span className="text-rose-300">
                    🔥 +{challenge.scaleMax}°
                  </span>
                </div>

                {(() => {
                  const span = Math.max(
                    1,
                    challenge.scaleMax - challenge.scaleMin
                  );
                  const clampPct = (v: number) =>
                    Math.max(
                      6,
                      Math.min(94, ((v - challenge.scaleMin) / span) * 100)
                    );
                  const zeroPct = clampPct(0);
                  const curPct = clampPct(challenge.currentTemp);

                  return (
                    <div className="flex items-center">
                      {/* 3D Realistic Translucent Ice-Blue Glass Thermometer Bulb */}
                      <div className="sphere-3d-bubble w-11 h-11 rounded-full bg-gradient-to-br from-cyan-300/70 via-sky-500/60 to-blue-700/70 border border-cyan-100/85 -mr-2.5 z-20 flex items-center justify-center text-sm shadow-[0_0_16px_rgba(56,189,248,0.45)]">
                        ❄️
                      </div>

                      {/* 3D Clear Cylindrical Glass Tube with Cool-to-Warm Tint */}
                      <div className="tube-3d-glass relative flex-1 h-11 rounded-full bg-gradient-to-r from-sky-500/20 via-slate-900/40 to-rose-500/25 border border-white/65 overflow-visible flex items-center">
                        {/* Realistic Translucent Thermometer Liquid Column (Icy Blue -> Warm Rose) */}
                        <div
                          style={{ width: `${curPct}%` }}
                          className={`h-full rounded-l-full transition-all ${
                            challenge.currentTemp < 0
                              ? 'bg-gradient-to-r from-cyan-400/75 via-sky-400/70 to-teal-300/75'
                              : 'bg-gradient-to-r from-cyan-400/75 via-amber-300/70 to-rose-500/80'
                          }`}
                        />

                        {/* 0° Golden-Glass Divider Ring */}
                        <div
                          style={{ left: `${zeroPct}%` }}
                          className="absolute -top-1 -bottom-1 w-1.5 rounded-full bg-amber-300/90 shadow-[0_0_10px_rgba(251,191,36,0.85)] z-10"
                        />

                        {/* 3D Translucent Glass Temperature Puck */}
                        <div
                          style={{ left: `${curPct}%` }}
                          className={`pad-3d-step absolute -translate-x-1/2 px-3.5 py-1 rounded-full font-display font-black text-sm sm:text-base border border-white z-20 ${
                            challenge.currentTemp < 0
                              ? 'bg-cyan-300/85 text-slate-950 shadow-[0_4px_14px_rgba(56,189,248,0.5)]'
                              : 'bg-rose-400/85 text-white shadow-[0_4px_14px_rgba(244,63,94,0.5)]'
                          }`}
                        >
                          {challenge.currentTemp}°
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-2">
                {challenge.choices.map((c) => {
                  const isNeg = String(c).trim().startsWith('-');
                  return (
                    <button
                      key={c}
                      type="button"
                      data-testid={`tang-choice-${c}`}
                      data-correct={c === challenge.answer ? 'true' : 'false'}
                      onClick={() => handleChoiceTap(c)}
                      className={`keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer border ${
                        isNeg
                          ? 'bg-gradient-to-b from-sky-400/35 to-blue-600/40 hover:from-sky-400/50 hover:to-blue-500/55 border-sky-200/75'
                          : 'bg-gradient-to-b from-rose-400/35 to-amber-500/35 hover:from-rose-400/50 hover:to-amber-500/50 border-rose-200/75'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME 4: SAINGEOM MISSING RUNE */}
          {challenge.kind === 'missingRune' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-amber-100 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-missing-equation"
                className="pad-3d-step my-3 px-8 py-5 rounded-3xl bg-gradient-to-r from-amber-400/35 via-orange-500/30 to-rose-500/35 backdrop-blur-md border border-amber-200/75 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_8px_24px_rgba(251,191,36,0.22)]"
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-amber-400/35 to-orange-600/35 hover:from-amber-400/50 hover:to-orange-500/50 border border-amber-200/75 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-400/25 border border-emerald-200/70 text-emerald-100 text-xl sm:text-2xl font-display font-black mb-2">
                <span>🐯 {challenge.fullEquation}</span>
              </div>

              <div className="text-base sm:text-xl font-bold text-emerald-100 max-w-xl mb-2">
                {challenge.stepPrompt[lang]}
              </div>

              <div
                data-testid="tang-breakapart-bridge"
                className="pad-3d-step my-2 px-7 py-4 rounded-3xl bg-gradient-to-r from-emerald-400/35 via-teal-500/30 to-cyan-500/35 backdrop-blur-md border border-emerald-200/75 font-display font-black text-2xl sm:text-4xl text-white shadow-[0_8px_24px_rgba(16,185,129,0.22)]"
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-emerald-400/35 to-teal-600/35 hover:from-emerald-400/50 hover:to-teal-500/50 border border-emerald-200/75 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 6: MIRA'S KRISTAL-LAB */}
          {challenge.kind === 'powerLab' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-pink-100 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-powerlab-formula"
                className="pad-3d-step my-3 px-7 py-5 rounded-3xl bg-gradient-to-r from-fuchsia-500/35 via-purple-500/30 to-pink-500/35 backdrop-blur-md border border-pink-200/75 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_8px_24px_rgba(236,72,153,0.22)]"
              >
                🧪{' '}
                {lang === 'nl'
                  ? challenge.visualFormula
                  : (challenge.visualFormulaEn ?? challenge.visualFormula)}
              </div>

              {challenge.visualBar && (
                <div className="w-full max-w-md my-2 p-3.5 rounded-2xl bg-slate-900/45 backdrop-blur-md border border-pink-300/45">
                  <div className="flex justify-between text-xs font-black text-pink-200 mb-2">
                    <span>
                      {lang === 'nl'
                        ? '⚡ 3D KRISTAL-CILINDER'
                        : '⚡ 3D CRYSTAL CYLINDER'}
                    </span>
                    <span className="text-amber-200">
                      {challenge.visualBar.label}
                    </span>
                  </div>

                  {/* 3D Cylindrical Clear Glass Tube with Translucent Glowing Crystal/Potion Liquid */}
                  {challenge.visualBar.total <= 12 ? (
                    <div className="tube-3d-glass h-9 w-full rounded-full bg-slate-950/45 border border-white/65 p-1 flex items-center gap-1 overflow-hidden">
                      {Array.from({
                        length: Math.max(1, challenge.visualBar.total),
                      }).map((_, segIdx) => {
                        const isFilled = segIdx < challenge.visualBar!.filled;
                        return (
                          <div
                            key={segIdx}
                            className={`h-full flex-1 first:rounded-l-full last:rounded-r-full rounded-sm transition-all ${
                              isFilled
                                ? 'bg-gradient-to-b from-amber-300/80 via-pink-500/70 to-cyan-400/75 border-t border-white shadow-[0_0_10px_rgba(244,114,182,0.55)]'
                                : 'bg-white/5 border border-white/20'
                            }`}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="tube-3d-glass h-9 w-full rounded-full bg-slate-950/45 overflow-hidden border border-white/65 p-1">
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
                        className="h-full rounded-full bg-gradient-to-r from-amber-300/80 via-pink-500/75 to-cyan-400/80 border-t border-white transition-all"
                      />
                    </div>
                  )}
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-fuchsia-400/35 to-purple-600/35 hover:from-fuchsia-400/50 hover:to-purple-500/50 border border-pink-200/75 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 7: ZOEY'S STAGE GRID (ARRAYS, AREA, PERIMETER & 3D VOLUME) */}
          {challenge.kind === 'stageGrid' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-violet-100 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-stagegrid-formula"
                className="pad-3d-step my-2 px-7 py-3.5 rounded-3xl bg-gradient-to-r from-violet-500/35 via-indigo-500/30 to-cyan-500/35 backdrop-blur-md border border-violet-200/75 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_8px_24px_rgba(139,92,246,0.22)]"
              >
                🍱 {challenge.visualFormula}
              </div>

              {/* 3D Interactive Rotatable Stage Volume OR 3D Translucent Colored Crystal Stage Block Deck */}
              {challenge.mode === 'volume' || challenge.height3d ? (
                <StageVolume3D
                  cols={challenge.cols}
                  rows={challenge.rows}
                  height3d={challenge.height3d ?? 2}
                  lang={lang}
                />
              ) : (
                <div className="pad-3d-step my-3 p-4 rounded-3xl bg-slate-900/45 backdrop-blur-md border border-violet-300/50 flex flex-col items-center gap-2.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-display font-black text-amber-200">
                    {challenge.mode === 'array' ? (
                      <span>
                        ↔ {challenge.cols} × ↕ {challenge.rows}{' '}
                        {lang === 'nl'
                          ? challenge.unitLabel
                          : (challenge.unitLabelEn ?? challenge.unitLabel)}
                      </span>
                    ) : (
                      <>
                        <span className="text-pink-200">
                          ↔{' '}
                          {challenge.mode === 'missingSide'
                            ? '? m'
                            : `${challenge.cols}m`}
                        </span>
                        <span className="text-white/60">×</span>
                        <span className="text-cyan-200">
                          ↕ {challenge.rows}m
                        </span>
                      </>
                    )}
                  </div>

                  {/* Translucent Colored Crystal Cubes on Glass Stage Platform */}
                  <div
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(12, challenge.cols)}, minmax(0, 1fr))`,
                    }}
                    className="grid gap-2 p-3 rounded-2xl bg-violet-950/40 border border-violet-300/45 shadow-[inset_0_2px_6px_rgba(255,255,255,0.25)]"
                  >
                    {Array.from({
                      length:
                        Math.min(8, challenge.rows) *
                        Math.min(12, challenge.cols),
                    }).map((_, idx) => (
                      <div
                        key={idx}
                        className="block-3d-tile w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-300/65 via-pink-400/55 to-violet-500/65 animate-pop-in"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-2">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-violet-400/35 to-indigo-600/35 hover:from-violet-400/50 hover:to-indigo-500/50 border border-violet-200/75 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 8: JINU'S SOUL SCALE (3D VISUAL PAN BALANCE) */}
          {challenge.kind === 'soulScale' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-amber-100 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-soulscale-equation"
                className="pad-3d-step my-2 px-7 py-3.5 rounded-3xl bg-gradient-to-r from-amber-400/35 via-yellow-500/25 to-cyan-400/35 backdrop-blur-md border border-amber-200/75 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_8px_24px_rgba(251,191,36,0.22)]"
              >
                ⚖️ {challenge.equationDisplay}
              </div>

              {/* 3D Translucent Colored Glass & Golden-Brass Pan Balance Scale */}
              <div className="w-full max-w-xl my-3 p-4 sm:p-5 rounded-3xl bg-slate-900/45 backdrop-blur-md border border-amber-300/45 flex flex-col items-center">
                <div className="w-full flex flex-col items-center animate-tilt-balance">
                  {/* Left & Right Pans with 3D Translucent Sapphire & Rose-Gold Weight Blocks */}
                  <div className="w-full flex items-end justify-between gap-4 sm:gap-8 px-1 sm:px-4">
                    {/* Left Pan */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex flex-wrap items-end justify-center gap-2 mb-1.5">
                        {challenge.leftItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="w-5 h-1.5 rounded-t-full border-t-2 border-x-2 border-cyan-200/80" />
                            <div className="keep-dark-card scale-3d-weight px-4 py-2.5 rounded-xl bg-gradient-to-b from-cyan-300/55 via-sky-500/45 to-blue-600/55 border border-cyan-100/85 font-display font-black text-xl sm:text-2xl text-white">
                              {item}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* 3D Translucent Cyan-Glass Dish Pan Rim */}
                      <div className="w-full h-3.5 rounded-b-2xl bg-gradient-to-b from-cyan-200/65 via-cyan-400/45 to-blue-500/45 border-t border-white/90 border-b-2 border-cyan-200/60 shadow-sm" />
                      {/* Pan Support Pillar */}
                      <div className="w-2 h-3 bg-gradient-to-r from-amber-300/60 via-amber-100/90 to-amber-400/60" />
                    </div>

                    {/* Right Pan */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex flex-wrap items-end justify-center gap-2 mb-1.5">
                        {challenge.rightItems.map((item, idx) => {
                          const isMystery = item.includes('?');
                          return (
                            <div key={idx} className="flex flex-col items-center">
                              <div
                                className={`w-5 h-1.5 rounded-t-full border-t-2 border-x-2 ${
                                  isMystery
                                    ? 'border-amber-200/90'
                                    : 'border-pink-200/80'
                                }`}
                              />
                              <div
                                className={`keep-dark-card scale-3d-weight px-4 py-2.5 rounded-xl font-display font-black text-xl sm:text-2xl ${
                                  isMystery
                                    ? 'bg-gradient-to-b from-amber-300/70 via-amber-400/55 to-pink-500/60 text-white border border-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
                                    : 'bg-gradient-to-b from-pink-300/55 via-fuchsia-500/45 to-purple-600/55 text-white border border-pink-100/85'
                                }`}
                              >
                                {item}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* 3D Translucent Rose-Glass Dish Pan Rim */}
                      <div className="w-full h-3.5 rounded-b-2xl bg-gradient-to-b from-pink-200/65 via-pink-400/45 to-purple-500/45 border-t border-white/90 border-b-2 border-pink-200/60 shadow-sm" />
                      {/* Pan Support Pillar */}
                      <div className="w-2 h-3 bg-gradient-to-r from-amber-300/60 via-amber-100/90 to-amber-400/60" />
                    </div>
                  </div>

                  {/* 3D Translucent Golden-Amber Crossbar Beam */}
                  <div className="w-11/12 h-3 rounded-full bg-gradient-to-b from-amber-200/80 via-amber-400/65 to-amber-600/65 border-t border-white/95 border-b border-amber-200/60 shadow-md flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-400 shadow-sm" />
                  </div>
                </div>

                {/* 3D Faceted Amber-Crystal Fulcrum Prism & Base */}
                <svg viewBox="0 0 80 34" className="w-20 h-9 -mt-0.5 overflow-visible">
                  {/* Left sunlit amber-crystal facet */}
                  <polygon
                    points="40,2 14,28 40,28"
                    fill="rgba(253, 230, 138, 0.75)"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="1.2"
                  />
                  {/* Right shaded amber-crystal facet */}
                  <polygon
                    points="40,2 66,28 40,28"
                    fill="rgba(245, 158, 11, 0.62)"
                    stroke="rgba(255, 255, 255, 0.85)"
                    strokeWidth="1.2"
                  />
                  {/* 3D Amber-Crystal Plinth Base */}
                  <rect
                    x="8"
                    y="27"
                    width="64"
                    height="6"
                    rx="3"
                    fill="rgba(251, 191, 36, 0.7)"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="1.2"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-2">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-amber-400/35 to-yellow-600/35 hover:from-amber-400/50 hover:to-yellow-500/50 border border-amber-200/75 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 9: RUMI'S RHYTHM PATTERN (STEPPING-STONE SEQUENCES) */}
          {challenge.kind === 'rhythmPattern' && (
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-400/25 border border-rose-200/70 text-rose-100 font-display font-black text-sm sm:text-base mb-2">
                <span>🎵 {challenge.ruleBadge[lang]}</span>
              </div>

              <div className="text-lg sm:text-2xl font-display font-black text-rose-100 mb-3">
                {challenge.prompt[lang]}
              </div>

              {/* 3D Translucent Colored Glass Stepping-Stone Rhythm Pads */}
              <div
                data-testid="tang-rhythm-sequence"
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 my-3 p-4 rounded-3xl bg-slate-900/45 backdrop-blur-md border border-rose-300/45"
              >
                {challenge.sequence.map((val, idx) => {
                  const isMissing = val === '?';
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className={`keep-dark-card pad-3d-step min-w-[68px] sm:min-w-[84px] h-20 sm:h-24 px-4 rounded-3xl flex items-center justify-center font-display font-black text-3xl sm:text-4xl ${
                          isMissing
                            ? 'bg-gradient-to-b from-amber-300/65 via-pink-500/55 to-rose-500/60 text-white border-2 border-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
                            : 'bg-gradient-to-b from-purple-400/35 to-indigo-600/35 text-white border border-purple-200/70'
                        }`}
                      >
                        {val}
                      </div>
                      {idx < challenge.sequence.length - 1 && (
                        <span className="font-display font-black text-2xl sm:text-3xl text-amber-300">
                          ➔
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-3">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-rose-400/35 to-purple-600/35 hover:from-rose-400/50 hover:to-purple-500/50 border border-rose-200/75 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 10: SUSSIE'S TARGET TRIO (3-CARD COMBO & ANGLES) */}
          {challenge.kind === 'targetTrio' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-teal-100 mb-3">
                {challenge.prompt[lang]}
              </div>

              {/* 3D Translucent Colored Glass Slabs + Target Bullseye */}
              <div
                data-testid="tang-targettrio-cards"
                className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 my-3 p-4 rounded-3xl bg-slate-900/45 backdrop-blur-md border border-teal-300/45"
              >
                {challenge.cards.map((cardText, idx) => {
                  const isMissing = cardText.includes('?');
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className={`keep-dark-card pad-3d-step w-20 sm:w-24 h-24 sm:h-28 rounded-2xl flex items-center justify-center font-display font-black text-2xl sm:text-4xl ${
                          isMissing
                            ? 'bg-gradient-to-b from-amber-300/65 via-pink-500/55 to-rose-500/60 text-white border-2 border-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
                            : 'bg-gradient-to-b from-teal-400/35 to-cyan-600/35 text-white border border-teal-200/75 animate-float-slow'
                        }`}
                      >
                        {cardText}
                      </div>
                      {idx < 2 ? (
                        <span className="font-display font-black text-2xl sm:text-3xl text-cyan-200">
                          +
                        </span>
                      ) : (
                        <span className="font-display font-black text-2xl sm:text-3xl text-amber-200">
                          =
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}

                <div className="keep-dark-card pad-3d-step px-6 h-24 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400/55 via-pink-500/50 to-purple-600/55 border border-amber-200/85 flex items-center justify-center font-display font-black text-3xl sm:text-5xl text-white shadow-[0_8px_24px_rgba(244,114,182,0.28)]">
                  🎯 {challenge.targetDisplay}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-xl mt-3">
                {challenge.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`tang-choice-${c}`}
                    data-correct={c === challenge.answer ? 'true' : 'false'}
                    onClick={() => handleChoiceTap(c)}
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-teal-400/35 to-cyan-600/35 hover:from-teal-400/50 hover:to-cyan-500/50 border border-teal-200/75 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
                      ? '🥋 Opgeslagen in jouw Dojo!'
                      : '🥋 Saved to your Dojo!'}
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
      )}
    </div>
  );

  if (pageMode) {
    return (
      <div data-testid="tang-arcade-modal" className="w-full animate-fadeIn">
        {innerContent}
      </div>
    );
  }

  return (
    <div
      data-testid="tang-arcade-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div className="w-full max-w-5xl my-auto max-h-[95vh] overflow-y-auto">
        {innerContent}
      </div>
    </div>
  );
};
