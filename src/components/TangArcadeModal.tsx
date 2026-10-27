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
    badgeGradient: 'from-pink-500 to-rose-500',
    cardBorder: 'border-pink-400/60 hover:border-amber-300',
  },
  {
    id: 'numberLine',
    category: 'visualShapes',
    emoji: '📏',
    titleNl: 'Laser Getallenlijn',
    titleEn: 'Laser Number Line',
    subtitleNl: 'Sprongen & Over 0',
    subtitleEn: 'Jumps & Across 0',
    badgeGradient: 'from-cyan-400 to-blue-600',
    cardBorder: 'border-cyan-400/60 hover:border-amber-300',
  },
  {
    id: 'subZero',
    category: 'algebraSubZero',
    emoji: '❄️',
    titleNl: 'Sub-Zero Portaal',
    titleEn: 'Sub-Zero Portal',
    subtitleNl: 'Onder 0°C',
    subtitleEn: 'Below 0°C',
    badgeGradient: 'from-sky-400 to-indigo-600',
    cardBorder: 'border-sky-400/60 hover:border-amber-300',
  },
  {
    id: 'missingRune',
    category: 'algebraSubZero',
    emoji: '⚔️',
    titleNl: 'Geheime Rune',
    titleEn: 'Missing Rune',
    subtitleNl: 'Algebra & n²',
    subtitleEn: 'Algebra & n²',
    badgeGradient: 'from-amber-400 to-orange-500',
    cardBorder: 'border-amber-400/60 hover:border-amber-300',
  },
  {
    id: 'breakApart',
    category: 'numberSense',
    emoji: '🐯',
    titleNl: 'Derpy Splits-Beat',
    titleEn: 'Derpy Split-Beat',
    subtitleNl: 'Slim Splitsen',
    subtitleEn: 'Smart Split',
    badgeGradient: 'from-emerald-400 to-teal-600',
    cardBorder: 'border-emerald-400/60 hover:border-amber-300',
  },
  {
    id: 'powerLab',
    category: 'visualShapes',
    emoji: '🧪',
    titleNl: 'Mira Kristal-Lab',
    titleEn: 'Mira Crystal Lab',
    subtitleNl: 'Breuken & %',
    subtitleEn: 'Fractions & %',
    badgeGradient: 'from-fuchsia-500 to-purple-600',
    cardBorder: 'border-fuchsia-400/60 hover:border-amber-300',
  },
  {
    id: 'stageGrid',
    category: 'visualShapes',
    emoji: '🍱',
    titleNl: 'Zoey Podium-Rooster',
    titleEn: 'Zoey Stage Grid',
    subtitleNl: 'Oppervlakte & 3D',
    subtitleEn: 'Area & 3D Blocks',
    badgeGradient: 'from-violet-500 to-purple-700',
    cardBorder: 'border-violet-400/60 hover:border-amber-300',
  },
  {
    id: 'soulScale',
    category: 'algebraSubZero',
    emoji: '⚖️',
    titleNl: 'Jinu Ziel-Balans',
    titleEn: 'Jinu Soul Scale',
    subtitleNl: 'Weegschaal Balans',
    subtitleEn: 'Balance Scale',
    badgeGradient: 'from-amber-300 to-pink-500',
    cardBorder: 'border-amber-300/60 hover:border-amber-300',
  },
  {
    id: 'rhythmPattern',
    category: 'algebraSubZero',
    emoji: '⚡',
    titleNl: 'Rumi Ritme-Reeks',
    titleEn: 'Rumi Rhythm Track',
    subtitleNl: 'Getallen-Patronen',
    subtitleEn: 'Number Patterns',
    badgeGradient: 'from-rose-500 to-amber-500',
    cardBorder: 'border-rose-400/60 hover:border-amber-300',
  },
  {
    id: 'targetTrio',
    category: 'numberSense',
    emoji: '🎯',
    titleNl: 'Sussie Trio-Doel',
    titleEn: 'Sussie Target Trio',
    subtitleNl: '3-Kaarten & Hoeken',
    subtitleEn: '3-Cards & Angles',
    badgeGradient: 'from-teal-400 to-cyan-600',
    cardBorder: 'border-teal-400/60 hover:border-amber-300',
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
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-purple-950/60 border border-purple-800/60">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-display font-black text-amber-300">
            🎓 {currentGroupProfile.shortLabel[lang]}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-xs font-black text-cyan-200">
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
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-display font-black transition-all cursor-pointer ${
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
                  className={`px-4 py-2 rounded-2xl font-display font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 border-white shadow-md scale-[1.02]'
                      : 'bg-purple-950/70 border-purple-700/60 text-purple-200 hover:border-pink-400/60'
                  }`}
                >
                  {lang === 'nl' ? cat.nl : cat.en}
                </button>
              );
            })}
          </div>

          {/* 10 Attractive Visual Game Blocks */}
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
                  className={`kid-block-card p-4 rounded-3xl bg-gradient-to-b from-purple-900/75 via-indigo-950/80 to-slate-950/90 border-2 ${
                    isSelected ? 'border-amber-300 ring-2 ring-amber-300/40' : game.cardBorder
                  } text-left flex flex-col justify-between gap-3 cursor-pointer shadow-lg`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.badgeGradient} flex items-center justify-center text-3xl shadow-md animate-float-slow`}
                    >
                      {game.emoji}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-200 font-display font-black text-xs flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current" />
                      <span>{lang === 'nl' ? 'SPEEL' : 'PLAY'}</span>
                    </span>
                  </div>

                  <div>
                    <div className="font-display font-black text-lg text-white leading-snug">
                      {lang === 'nl' ? game.titleNl : game.titleEn}
                    </div>
                    <div className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-white/10 text-cyan-200 font-bold text-xs">
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
                className={`p-2 sm:p-2.5 rounded-2xl border-2 text-left transition-all flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-pink-500/45 via-purple-600/45 to-cyan-500/45 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.35)] scale-[1.02]'
                    : 'bg-purple-950/55 border-purple-800/50 hover:border-purple-500/60 opacity-85 hover:opacity-100'
                }`}
              >
                <span className="text-xl sm:text-2xl shrink-0">{tab.emoji}</span>
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
      )}

      {/* ==================== VIEW B: ACTIVE MINI-GAME STAGE ==================== */}
      {viewMode === 'stage' && (
        <div
          className={`p-4 sm:p-6 rounded-3xl border-2 transition-all ${
            feedback === 'correct'
              ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.45)]'
              : feedback === 'wrong'
                ? 'bg-rose-950/60 border-rose-400'
                : 'bg-purple-950/55 border-purple-700/70'
          }`}
        >
          {/* Concept Chip & Next Level Progress */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span
              data-testid="arcade-concept-badge"
              className="px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-200 text-xs sm:text-sm font-black"
            >
              ✨ {conceptBadgeText}
            </span>
            <span className="text-xs sm:text-sm font-black text-cyan-300">
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
              <div className="text-lg sm:text-2xl font-display font-black text-cyan-200 mb-3">
                {challenge.prompt[lang]}
              </div>

              <div className="pad-3d-step my-2 px-9 py-4 rounded-3xl bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-600 text-slate-950 font-display font-black text-4xl sm:text-6xl shadow-[0_0_30px_rgba(251,191,36,0.65)] flex items-center gap-3 animate-pulse-glow">
                <span>🎯 {challenge.target}</span>
                <span className="text-xl sm:text-3xl px-3.5 py-1 rounded-full bg-black/25 text-white">
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
                      className="pad-3d-step my-2.5 px-7 py-3 rounded-3xl bg-gradient-to-r from-emerald-400 via-amber-300 to-cyan-400 border-3 border-white text-slate-950 font-display font-black text-2xl sm:text-4xl shadow-[0_0_35px_rgba(52,211,153,0.9)] flex items-center gap-2.5 animate-target-burst"
                    >
                      <span>💥</span>
                      <span>
                        {firstBub.value} {challenge.op} {secondBub.value} ={' '}
                        {challenge.target}!
                      </span>
                      <span>🎉</span>
                    </div>
                  );
                }

                return (
                  <div className="my-2 px-5 py-2 rounded-2xl bg-slate-950/85 border border-cyan-400/50 flex items-center gap-2.5 font-display font-black text-xl sm:text-2xl">
                    <span
                      className={`px-3.5 py-1 rounded-xl border-2 transition-all ${
                        firstBub
                          ? 'bg-amber-400 text-slate-950 border-white scale-110 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                          : 'bg-purple-950/80 text-cyan-300 border-cyan-400/50'
                      }`}
                    >
                      {firstBub ? firstBub.value : '?'}
                    </span>
                    <span className="text-pink-400">{challenge.op}</span>
                    <span
                      className={`px-3.5 py-1 rounded-xl border-2 transition-all ${
                        secondBub
                          ? 'bg-amber-400 text-slate-950 border-white scale-110 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                          : 'bg-purple-950/80 text-cyan-300 border-cyan-400/50'
                      }`}
                    >
                      {secondBub ? secondBub.value : '?'}
                    </span>
                    <span className="text-amber-300">=</span>
                    <span className="text-white">{challenge.target}</span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-5 w-full max-w-2xl mt-5 pt-2">
                {challenge.bubbles.map((bub) => {
                  const isSelected = selectedBubbleIds.includes(bub.id);
                  const isBursting = isSelected && feedback === 'correct';
                  return (
                    <button
                      key={bub.id}
                      type="button"
                      data-testid={`tang-bubble-${bub.id}`}
                      data-value={bub.value}
                      aria-pressed={isSelected}
                      onClick={() => handleBubbleTap(bub.id)}
                      className={`keep-dark-card sphere-3d-bubble h-24 sm:h-28 rounded-full bg-gradient-to-br font-display font-black text-3xl sm:text-4xl text-white flex flex-col items-center justify-center cursor-pointer ${
                        isBursting
                          ? 'sphere-3d-bubble-burst from-emerald-400 via-amber-300 to-cyan-400 border-4 border-white z-20'
                          : isSelected
                            ? 'sphere-3d-bubble-selected from-amber-500 via-pink-500 to-fuchsia-600 border-4 border-yellow-200 z-10'
                            : `${bub.color} border-2 border-white/75 hover:scale-110 animate-float-slow`
                      }`}
                    >
                      {isBursting && (
                        <span className="absolute -top-3 -right-2 text-xl sm:text-2xl animate-bounce pointer-events-none">
                          💥
                        </span>
                      )}
                      <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
                        {isBursting ? `✨${bub.value}✨` : bub.value}
                      </span>
                      <span className="text-[11px] font-extrabold opacity-95">
                        {isBursting
                          ? '💥 POP!'
                          : isSelected
                            ? lang === 'nl'
                              ? '✓ GROOT!'
                              : '✓ BIG!'
                            : '🫧 SODA'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME 2: HONMOON LASER-LIJN (INTERACTIVE NUMBER LINE) */}
          {challenge.kind === 'numberLine' && (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg sm:text-2xl font-display font-black text-cyan-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-numberline-equation"
                className="pad-3d-step my-2 px-7 py-3 rounded-3xl bg-slate-950/90 border-2 border-cyan-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_25px_rgba(34,211,238,0.4)]"
              >
                📏{' '}
                {lang === 'nl'
                  ? challenge.questionEquation
                  : (challenge.questionEquationEn ?? challenge.questionEquation)}
              </div>

              <div className="w-full max-w-2xl my-3 p-3 sm:p-4 rounded-2xl bg-slate-950/85 border border-cyan-500/40">
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
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="50%" stopColor="#f472b6" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                        <radialGradient id="orbPink3D" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#fbcfe8" />
                          <stop offset="45%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#831843" />
                        </radialGradient>
                        <radialGradient id="orbGold3D" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#fef9c3" />
                          <stop offset="45%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#92400e" />
                        </radialGradient>
                      </defs>

                      {/* 3D Track Shadow + Main Laser Rail */}
                      <line
                        x1="35"
                        y1="92"
                        x2="565"
                        y2="92"
                        stroke="#020617"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <line
                        x1="35"
                        y1="88"
                        x2="565"
                        y2="88"
                        stroke="url(#honmoonLineGrad)"
                        strokeWidth="7"
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

                      <path
                        d={`M ${startX} 84 Q ${midX} 14 ${endX} 84`}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="4"
                        strokeDasharray="8 4"
                      />

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

                      {/* 3D Start Sphere */}
                      <circle
                        cx={startX}
                        cy="88"
                        r="12"
                        fill="url(#orbPink3D)"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                      <text
                        x={startX}
                        y="68"
                        textAnchor="middle"
                        fill="#f9a8d4"
                        fontSize="14"
                        fontWeight="900"
                      >
                        {challenge.startVal}
                      </text>

                      {/* 3D Target/End Sphere */}
                      <circle
                        cx={endX}
                        cy="88"
                        r="14"
                        fill="url(#orbGold3D)"
                        stroke="#ffffff"
                        strokeWidth="2.5"
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 hover:from-amber-400 hover:to-cyan-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
              <div className="text-lg sm:text-2xl font-display font-black text-cyan-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-subzero-equation"
                className="pad-3d-step my-2 px-7 py-3.5 rounded-3xl bg-slate-950/90 border-2 border-sky-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_30px_rgba(56,189,248,0.45)]"
              >
                ❄️ {challenge.equationDisplay}
              </div>

              <div className="w-full max-w-xl my-3 p-4 rounded-2xl bg-slate-950/90 border border-sky-500/40">
                <div className="flex items-center justify-between text-xs sm:text-sm font-black mb-2.5">
                  <span className="text-sky-300">
                    ❄️ SUB-ZERO ({challenge.scaleMin}°)
                  </span>
                  <span className="text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40">
                    {lang === 'nl' ? '0° GRENS' : '0° ZERO'}
                  </span>
                  <span className="text-pink-300">
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
                      {/* 3D Thermometer Frost Bulb */}
                      <div className="sphere-3d-bubble w-11 h-11 rounded-full bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-900 border-2 border-white/80 -mr-2.5 z-20 flex items-center justify-center text-sm shadow-lg">
                        ❄️
                      </div>

                      {/* 3D Cylindrical Glass Tube */}
                      <div className="tube-3d-glass relative flex-1 h-11 rounded-full bg-gradient-to-r from-sky-950 via-slate-900 to-rose-950 border-2 border-sky-400/70 overflow-visible flex items-center">
                        {/* 3D Mercury / Plasma Fill up to currentTemp */}
                        <div
                          style={{ width: `${curPct}%` }}
                          className="h-full rounded-l-full bg-gradient-to-r from-cyan-400 via-sky-400 to-pink-500 opacity-75 transition-all"
                        />

                        {/* 0° Golden Divider Ring */}
                        <div
                          style={{ left: `${zeroPct}%` }}
                          className="absolute -top-1 -bottom-1 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)] z-10"
                        />

                        {/* 3D Raised Temperature Puck */}
                        <div
                          style={{ left: `${curPct}%` }}
                          className="pad-3d-step absolute -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-b from-cyan-300 to-sky-500 text-slate-950 font-display font-black text-sm sm:text-base border-2 border-white z-20"
                        >
                          {challenge.currentTemp}°
                        </div>
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
                    className={`keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer ${
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
              <div className="text-lg sm:text-2xl font-display font-black text-amber-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-missing-equation"
                className="pad-3d-step my-3 px-8 py-5 rounded-3xl bg-slate-950/90 border-2 border-amber-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_25px_rgba(251,191,36,0.35)] animate-pulse-glow"
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-400/20 border-2 border-amber-300/60 text-amber-200 text-xl sm:text-2xl font-display font-black mb-2">
                <span>🐯 {challenge.fullEquation}</span>
              </div>

              <div className="text-base sm:text-xl font-bold text-purple-100 max-w-xl mb-2">
                {challenge.stepPrompt[lang]}
              </div>

              <div
                data-testid="tang-breakapart-bridge"
                className="pad-3d-step my-2 px-7 py-4 rounded-3xl bg-slate-950/90 border-2 border-cyan-400 font-display font-black text-2xl sm:text-4xl text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.35)]"
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 hover:from-amber-400 hover:to-cyan-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
              <div className="text-lg sm:text-2xl font-display font-black text-pink-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-powerlab-formula"
                className="pad-3d-step my-3 px-7 py-5 rounded-3xl bg-slate-950/90 border-2 border-pink-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_28px_rgba(244,114,182,0.4)]"
              >
                🧪{' '}
                {lang === 'nl'
                  ? challenge.visualFormula
                  : (challenge.visualFormulaEn ?? challenge.visualFormula)}
              </div>

              {challenge.visualBar && (
                <div className="w-full max-w-md my-2 p-3.5 rounded-2xl bg-slate-950/85 border border-pink-400/40">
                  <div className="flex justify-between text-xs font-black text-pink-200 mb-2">
                    <span>
                      {lang === 'nl'
                        ? '⚡ 3D KRISTAL-CILINDER'
                        : '⚡ 3D CRYSTAL CYLINDER'}
                    </span>
                    <span className="text-amber-300">
                      {challenge.visualBar.label}
                    </span>
                  </div>

                  {/* 3D Cylindrical Crystal Tube (Segmented blocks for fractions/ratios, smooth 3D tube for %) */}
                  {challenge.visualBar.total <= 12 ? (
                    <div className="tube-3d-glass h-9 w-full rounded-full bg-purple-950/95 border-2 border-pink-400/70 p-1 flex items-center gap-1 overflow-hidden">
                      {Array.from({
                        length: Math.max(1, challenge.visualBar.total),
                      }).map((_, segIdx) => {
                        const isFilled = segIdx < challenge.visualBar!.filled;
                        return (
                          <div
                            key={segIdx}
                            className={`h-full flex-1 first:rounded-l-full last:rounded-r-full rounded-sm transition-all ${
                              isFilled
                                ? 'bg-gradient-to-b from-amber-300 via-pink-500 to-fuchsia-700 border-t border-white/80 shadow-[0_0_10px_rgba(244,114,182,0.6)]'
                                : 'bg-slate-900/75 border border-purple-800/40'
                            }`}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="tube-3d-glass h-9 w-full rounded-full bg-purple-950/95 overflow-hidden border-2 border-pink-400/70 p-1">
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
                        className="h-full rounded-full bg-gradient-to-b from-amber-300 via-pink-500 to-cyan-500 border-t border-white/80 transition-all"
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 hover:from-amber-400 hover:to-pink-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
              <div className="text-lg sm:text-2xl font-display font-black text-violet-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-stagegrid-formula"
                className="pad-3d-step my-2 px-7 py-3.5 rounded-3xl bg-slate-950/90 border-2 border-violet-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_25px_rgba(167,139,250,0.4)]"
              >
                🍱 {challenge.visualFormula}
              </div>

              {/* 3D Interactive Rotatable Stage Volume OR 3D Extruded Stage Block Deck */}
              {challenge.mode === 'volume' || challenge.height3d ? (
                <StageVolume3D
                  cols={challenge.cols}
                  rows={challenge.rows}
                  height3d={challenge.height3d ?? 2}
                  lang={lang}
                />
              ) : (
                <div className="pad-3d-step my-3 p-4 rounded-3xl bg-slate-950/90 border-2 border-violet-400/60 flex flex-col items-center gap-2.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-display font-black text-amber-300">
                    {challenge.mode === 'array' ? (
                      <span>
                        ↔ {challenge.cols} × ↕ {challenge.rows}{' '}
                        {lang === 'nl'
                          ? challenge.unitLabel
                          : (challenge.unitLabelEn ?? challenge.unitLabel)}
                      </span>
                    ) : (
                      <>
                        <span>
                          ↔{' '}
                          {challenge.mode === 'missingSide'
                            ? '? m'
                            : `${challenge.cols}m`}
                        </span>
                        <span>×</span>
                        <span>↕ {challenge.rows}m</span>
                      </>
                    )}
                  </div>

                  {/* 3D Stage Platform Base with 3D Extruded Stage Cubes */}
                  <div
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(12, challenge.cols)}, minmax(0, 1fr))`,
                    }}
                    className="grid gap-2 p-3 rounded-2xl bg-gradient-to-b from-purple-900/90 to-indigo-950 border-t-2 border-violet-300/50 border-b-[7px] border-violet-950 shadow-[0_6px_0_rgba(30,10,60,0.95)]"
                  >
                    {Array.from({
                      length:
                        Math.min(8, challenge.rows) *
                        Math.min(12, challenge.cols),
                    }).map((_, idx) => (
                      <div
                        key={idx}
                        className="block-3d-tile w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-amber-300 via-pink-500 to-fuchsia-600 animate-pop-in"
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 hover:from-amber-400 hover:to-pink-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
              <div className="text-lg sm:text-2xl font-display font-black text-amber-200 mb-2">
                {challenge.prompt[lang]}
              </div>

              <div
                data-testid="tang-soulscale-equation"
                className="pad-3d-step my-2 px-7 py-3.5 rounded-3xl bg-slate-950/90 border-2 border-amber-400 font-display font-black text-3xl sm:text-5xl text-white shadow-[0_0_25px_rgba(251,191,36,0.4)]"
              >
                ⚖️ {challenge.equationDisplay}
              </div>

              {/* 3D Tactile Pan Balance Scale */}
              <div className="w-full max-w-xl my-3 p-4 sm:p-5 rounded-3xl bg-slate-950/90 border border-amber-400/40 flex flex-col items-center">
                <div className="w-full flex flex-col items-center animate-tilt-balance">
                  {/* Left & Right Pans with 3D Weight Blocks */}
                  <div className="w-full flex items-end justify-between gap-4 sm:gap-8 px-1 sm:px-4">
                    {/* Left Pan */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex flex-wrap items-end justify-center gap-2 mb-1.5">
                        {challenge.leftItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="w-5 h-1.5 rounded-t-full border-t-2 border-x-2 border-cyan-200/80" />
                            <div className="keep-dark-card scale-3d-weight px-4 py-2.5 rounded-xl bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-700 font-display font-black text-xl sm:text-2xl text-white">
                              {item}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* 3D Dish Pan Rim */}
                      <div className="w-full h-4 rounded-b-2xl bg-gradient-to-b from-cyan-300 via-teal-400 to-cyan-700 border-t-2 border-white/80 border-b-4 border-cyan-950 shadow-md" />
                      {/* Pan Support Pillar */}
                      <div className="w-2.5 h-3 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-500" />
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
                                    ? 'border-yellow-200'
                                    : 'border-pink-200/80'
                                }`}
                              />
                              <div
                                className={`keep-dark-card scale-3d-weight px-4 py-2.5 rounded-xl font-display font-black text-xl sm:text-2xl ${
                                  isMystery
                                    ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-pink-500 text-slate-950 animate-pulse-glow'
                                    : 'bg-gradient-to-b from-pink-400 via-fuchsia-500 to-purple-700 text-white'
                                }`}
                              >
                                {item}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* 3D Dish Pan Rim */}
                      <div className="w-full h-4 rounded-b-2xl bg-gradient-to-b from-pink-300 via-fuchsia-400 to-purple-800 border-t-2 border-white/80 border-b-4 border-purple-950 shadow-md" />
                      {/* Pan Support Pillar */}
                      <div className="w-2.5 h-3 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-500" />
                    </div>
                  </div>

                  {/* 3D Metallic Crossbar Beam */}
                  <div className="w-11/12 h-3.5 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 border-t border-white/80 border-b-4 border-amber-950 shadow-lg flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-amber-300 border-2 border-white shadow" />
                  </div>
                </div>

                {/* 3D Faceted Golden Fulcrum Pyramid & Base */}
                <svg viewBox="0 0 80 34" className="w-20 h-9 -mt-0.5 overflow-visible">
                  {/* Left lit facet */}
                  <polygon
                    points="40,2 14,28 40,28"
                    fill="#fbbf24"
                    stroke="#fef08a"
                    strokeWidth="1"
                  />
                  {/* Right shaded facet */}
                  <polygon
                    points="40,2 66,28 40,28"
                    fill="#d97706"
                    stroke="#fef08a"
                    strokeWidth="1"
                  />
                  {/* 3D Plinth Base */}
                  <rect
                    x="8"
                    y="27"
                    width="64"
                    height="6"
                    rx="3"
                    fill="#92400e"
                    stroke="#fbbf24"
                    strokeWidth="1"
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-amber-500 via-pink-500 to-purple-700 hover:from-amber-300 hover:to-pink-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-500/25 border border-rose-300/60 text-rose-200 font-display font-black text-sm sm:text-base mb-2">
                <span>🎵 {challenge.ruleBadge[lang]}</span>
              </div>

              <div className="text-lg sm:text-2xl font-display font-black text-amber-200 mb-3">
                {challenge.prompt[lang]}
              </div>

              {/* 3D Stepping-Stone Rhythm Pads */}
              <div
                data-testid="tang-rhythm-sequence"
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 my-3 p-4 rounded-3xl bg-slate-950/90 border-2 border-rose-400/60"
              >
                {challenge.sequence.map((val, idx) => {
                  const isMissing = val === '?';
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className={`keep-dark-card pad-3d-step min-w-[68px] sm:min-w-[84px] h-20 sm:h-24 px-4 rounded-3xl border-2 flex items-center justify-center font-display font-black text-3xl sm:text-4xl ${
                          isMissing
                            ? 'bg-gradient-to-br from-amber-400 to-pink-500 text-slate-950 border-white animate-pulse-glow'
                            : 'bg-gradient-to-br from-purple-700 to-indigo-900 text-white border-pink-400/70'
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700 hover:from-amber-400 hover:to-pink-400 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
              <div className="text-lg sm:text-2xl font-display font-black text-teal-200 mb-3">
                {challenge.prompt[lang]}
              </div>

              {/* 3D Holographic Power Slabs + Target Bullseye */}
              <div
                data-testid="tang-targettrio-cards"
                className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 my-3 p-4 rounded-3xl bg-slate-950/90 border-2 border-teal-400/60"
              >
                {challenge.cards.map((cardText, idx) => {
                  const isMissing = cardText.includes('?');
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className={`keep-dark-card pad-3d-step w-20 sm:w-24 h-24 sm:h-28 rounded-2xl border-2 flex items-center justify-center font-display font-black text-2xl sm:text-4xl ${
                          isMissing
                            ? 'bg-gradient-to-br from-amber-400 to-pink-500 text-slate-950 border-white animate-pulse-glow'
                            : 'bg-gradient-to-br from-teal-500 to-blue-700 text-white border-cyan-200/80 animate-float-slow'
                        }`}
                      >
                        {cardText}
                      </div>
                      {idx < 2 ? (
                        <span className="font-display font-black text-2xl sm:text-3xl text-cyan-300">
                          +
                        </span>
                      ) : (
                        <span className="font-display font-black text-2xl sm:text-3xl text-amber-300">
                          =
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}

                <div className="keep-dark-card pad-3d-step px-6 h-24 sm:h-28 rounded-3xl bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-600 border-2 border-white flex items-center justify-center font-display font-black text-3xl sm:text-5xl text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.5)]">
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
                    className="keep-dark-card btn-3d-key py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 hover:from-amber-400 hover:to-cyan-300 hover:text-slate-950 border-2 border-white/80 font-display font-black text-3xl sm:text-4xl text-white transition-all hover:scale-105 cursor-pointer"
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
