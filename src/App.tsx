import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  Sparkles,
  Flame,
  Clock,
  ArrowLeft,
  Star,
  Trophy,
  Users,
  Swords,
  Zap,
  ShieldCheck,
  Play,
  RotateCcw,
  Gift,
  Lightbulb,
  Sun,
  Moon,
  UserPlus,
  ChevronRight,
  Trash2,
  Menu,
  X,
} from 'lucide-react';
import { Language, translations } from './i18n/translations';
import {
  SkillId,
  SealSize,
  KakoomaPuzzle,
  KakoomaChainPuzzle,
  generateSinglePuzzle,
  generateChainPuzzle,
  getSkillOperation,
  checkKakoomaAnswer,
  formatPuzzleValue,
  isFractionSkill,
} from './engine/kakoomaGenerator';
import {
  PlayerProgress,
  ProfilesStore,
  loadProgress,
  saveProgress,
  loadProfilesStore,
  saveProfilesStore,
  createPlayerProfile,
  switchPlayerProfile,
  resetPlayerProfileProgress,
  deletePlayerProfile,
  getStageNumber,
  getNextStage,
  getLevelInfo,
  getSmartMathTrick,
  calculateSpeedGemReward,
  PHOTOCARD_CATALOG,
  SchoolGroupId,
  TrickyFactItem,
} from './engine/progressionStore';
import {
  CURRICULUM_GROUPS,
  getCurriculumGroup,
  getAutoProgressedCurriculum,
} from './engine/curriculumGroups';
import { TangMiniGameId } from './engine/tangGamesEngine';
import { TangArcadeModal, ARCADE_GAMES_CATALOG } from './components/TangArcadeModal';
import {
  advanceOtherReviews,
  claimMasteryReward,
  createReviewState,
  createTrickyFact,
  getFactId,
  getPracticedStrategies,
  mergeMissedFact,
  recordReviewAnswer,
} from './engine/learningLoop';
import { soundEngine, MUSIC_TRACKS, MusicTrackId } from './audio/soundEngine';
import {
  HunterId,
  HunterAvatar,
  DerpyTigerMascot,
  SajaDemonBoss,
} from './components/CharacterArt';
import { HonmoonSeal } from './components/HonmoonSeal';
import { HonmoonChainBoard } from './components/HonmoonChainBoard';
import { VersusBattleBoard } from './components/VersusBattleBoard';
import { TutorialModal } from './components/TutorialModal';
import { PhotocardModal } from './components/PhotocardModal';
import { NumberSenseXRay } from './components/NumberSenseXRay';
import { NumberDojoModal, MASTERY_GEMS, MASTERY_XP } from './components/NumberDojoModal';
import { ProfileManagerModal } from './components/ProfileManagerModal';

type GameMode =
  | 'soloPractice'
  | 'honmoonChain'
  | 'timedRush'
  | 'coopDuet'
  | 'versusBattle';

interface MasteredFact {
  equation: string;
  timeMs: number;
  trick: string;
}

const SKILL_ORDER: SkillId[] = [
  'add10',
  'add20',
  'sub20',
  'add50',
  'sub100',
  'multEasy',
  'multAll',
  'divAll',
  'fracEasy',
  'fracPro',
  'mixBoss',
];

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('huntrx_lang');
    return saved === 'en' || saved === 'nl' ? saved : 'nl';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('huntrx_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-light', theme === 'light');
    root.classList.toggle('theme-dark', theme === 'dark');
    localStorage.setItem('huntrx_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    soundEngine.playTap();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const t = translations[lang];

  const toggleLanguage = (newLang: Language) => {
    soundEngine.playTap();
    setLang(newLang);
    localStorage.setItem('huntrx_lang', newLang);
  };

  // Multi-Player Profiles Store & Active Player Session
  const [profilesStore, setProfilesStore] = useState<ProfilesStore>(() => loadProfilesStore());
  const activeProfile =
    profilesStore.profiles.find((p) => p.id === profilesStore.activeProfileId) ?? null;

  // Persistent Player Progression (XP, Level, Starlight Gems, Photocards, Tricky Facts)
  const [progress, setProgress] = useState<PlayerProgress>(() =>
    activeProfile ? activeProfile.progress : loadProgress()
  );
  const [showPhotocards, setShowPhotocards] = useState(false);
  const [showDojo, setShowDojo] = useState(false);
  const [showTangArcade, setShowTangArcade] = useState(false);
  const [arcadeViewMode, setArcadeViewMode] = useState<'hub' | 'stage'>('hub');
  const [initialTangGame, setInitialTangGame] = useState<TangMiniGameId>('sodaBubbles');
  const [showXRay, setShowXRay] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const headerDropdownRef = useRef<HTMLDivElement | null>(null);
  const [leveledUpBanner, setLeveledUpBanner] = useState<number | null>(null);

  useEffect(() => {
    if (!showHeaderMenu) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        headerMenuBtnRef.current?.contains(target) ||
        headerDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setShowHeaderMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHeaderMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showHeaderMenu]);

  // Audio & Modals
  const [sfxOn, setSfxOn] = useState(true);
  const [beatOn, setBeatOn] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Stage Configuration (initialized from active cached profile if returning player)
  const [schoolGroup, setSchoolGroup] = useState<SchoolGroupId>(() =>
    activeProfile?.schoolGroup ?? 'g5'
  );
  const [mode, setMode] = useState<GameMode>(() =>
    activeProfile ? activeProfile.mode : 'soloPractice'
  );
  const [skill, setSkill] = useState<SkillId>(() =>
    activeProfile ? activeProfile.skill : 'add10'
  );
  const [sealSize, setSealSize] = useState<SealSize>(() =>
    activeProfile ? activeProfile.sealSize : 4
  );
  const [hunter, setHunter] = useState<HunterId>(() =>
    activeProfile ? activeProfile.hunter : 'rumi'
  );

  // Stage-by-Stage Wizard Step:
  // 0 = Returning Player "Welcome Back" Fast-Track Dashboard (skips re-picking Idol!)
  // 1 = Step 1: Who's Playing? (Pick Idol Rumi/Mira/Zoey + Player Name)
  // 2 = Step 2: Pick Your Activity / Mode
  // 3 = Step 3: Pick Your Math Power
  // 4 = Step 4: Pick Challenge / Complexity Level & Start the Show!
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3 | 4>(() =>
    activeProfile ? 0 : 1
  );
  const [playerNameInput, setPlayerNameInput] = useState<string>(() =>
    activeProfile ? activeProfile.name : ''
  );
  const [isCreatingNewProfile, setIsCreatingNewProfile] = useState<boolean>(
    () => !activeProfile
  );

  const updateProgress = useCallback((updater: (prev: PlayerProgress) => PlayerProgress) => {
    setProgress((prev) => {
      const prevLevel = Math.floor(prev.xp / 500) + 1;
      const next = updater(prev);
      const nextLevel = Math.floor(next.xp / 500) + 1;
      if (nextLevel > prevLevel) {
        setLeveledUpBanner(nextLevel);
      }
      saveProgress(next);
      setProfilesStore((storePrev) => {
        if (!storePrev.activeProfileId) return storePrev;
        const nextStore: ProfilesStore = {
          ...storePrev,
          profiles: storePrev.profiles.map((p) =>
            p.id === storePrev.activeProfileId
              ? { ...p, progress: next, lastPlayedAt: Date.now() }
              : p
          ),
        };
        saveProfilesStore(nextStore);
        return nextStore;
      });
      return next;
    });
  }, []);

  const syncActiveProfileStage = useCallback(
    (
      nextMode: GameMode,
      nextSkill: SkillId,
      nextSealSize: SealSize,
      nextHunter?: HunterId,
      incrementCleared = false
    ) => {
      setProfilesStore((prev) => {
        if (!prev.activeProfileId) return prev;
        const nextStore: ProfilesStore = {
          ...prev,
          profiles: prev.profiles.map((p) =>
            p.id === prev.activeProfileId
              ? {
                  ...p,
                  mode: nextMode,
                  skill: nextSkill,
                  sealSize: nextSealSize,
                  hunter: nextHunter ?? p.hunter,
                  stagesCleared: incrementCleared ? p.stagesCleared + 1 : p.stagesCleared,
                  lastPlayedAt: Date.now(),
                }
              : p
          ),
        };
        saveProfilesStore(nextStore);
        return nextStore;
      });
    },
    []
  );

  const handleSelectSchoolGroup = useCallback((groupId: SchoolGroupId) => {
    const spec = getCurriculumGroup(groupId);
    setSchoolGroup(groupId);
    setSkill(spec.defaultSkill);
    setSealSize(spec.defaultSealSize);
    setProfilesStore((prev) => {
      if (!prev.activeProfileId) return prev;
      const nextStore: ProfilesStore = {
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === prev.activeProfileId
            ? {
                ...p,
                schoolGroup: groupId,
                skill: spec.defaultSkill,
                sealSize: spec.defaultSealSize,
                lastPlayedAt: Date.now(),
              }
            : p
        ),
      };
      saveProfilesStore(nextStore);
      return nextStore;
    });
  }, []);

  const handleSelectProfile = (profileId: string) => {
    soundEngine.playTap();
    const nextStore = switchPlayerProfile(profilesStore, profileId);
    setProfilesStore(nextStore);
    const target = nextStore.profiles.find((p) => p.id === profileId);
    if (target) {
      setProgress(target.progress);
      setHunter(target.hunter);
      setSchoolGroup(target.schoolGroup ?? 'g5');
      setMode(target.mode);
      setSkill(target.skill);
      setSealSize(target.sealSize);
      setPlayerNameInput(target.name);
      setIsCreatingNewProfile(false);
      setWizardStep(0);
      setScreen('menu');
    }
  };

  const handleResetProfile = (profileId: string) => {
    soundEngine.playTap();
    const nextStore = resetPlayerProfileProgress(profilesStore, profileId);
    setProfilesStore(nextStore);
    if (nextStore.activeProfileId === profileId) {
      const resetProf = nextStore.profiles.find((p) => p.id === profileId);
      if (resetProf) {
        setProgress(resetProf.progress);
        setMode(resetProf.mode);
        setSkill(resetProf.skill);
        setSealSize(resetProf.sealSize);
      }
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    soundEngine.playTap();
    const nextStore = deletePlayerProfile(profilesStore, profileId);
    setProfilesStore(nextStore);
    const nextActive = nextStore.profiles.find((p) => p.id === nextStore.activeProfileId);
    if (nextActive) {
      setProgress(nextActive.progress);
      setHunter(nextActive.hunter);
      setMode(nextActive.mode);
      setSkill(nextActive.skill);
      setSealSize(nextActive.sealSize);
      setPlayerNameInput(nextActive.name);
      setIsCreatingNewProfile(false);
      setWizardStep(0);
    } else {
      setPlayerNameInput('');
      setIsCreatingNewProfile(true);
      setWizardStep(1);
    }
  };

  const handleSaveStep1AndAdvance = (targetStep: 2 | 3 | 4 = 2) => {
    soundEngine.playTap();
    const groupSpec = getCurriculumGroup(schoolGroup);
    if (isCreatingNewProfile || !activeProfile) {
      const nextStore = createPlayerProfile(
        profilesStore,
        playerNameInput,
        hunter,
        schoolGroup,
        groupSpec.defaultSkill
      );
      setProfilesStore(nextStore);
      const created = nextStore.profiles.find((p) => p.id === nextStore.activeProfileId);
      if (created) {
        setProgress(created.progress);
        setMode(created.mode);
        setSkill(created.skill);
        setSealSize(created.sealSize);
        setPlayerNameInput(created.name);
      }
      setIsCreatingNewProfile(false);
    } else {
      const cleanName =
        playerNameInput.trim() ||
        activeProfile.name ||
        t.hunters[hunter].name;
      setProfilesStore((prev) => {
        const nextStore: ProfilesStore = {
          ...prev,
          profiles: prev.profiles.map((p) =>
            p.id === prev.activeProfileId
              ? { ...p, name: cleanName, hunter, schoolGroup, lastPlayedAt: Date.now() }
              : p
          ),
        };
        saveProfilesStore(nextStore);
        return nextStore;
      });
    }
    setWizardStep(targetStep);
  };

  // 2-Player Parent settings
  const [parentSkill, setParentSkill] = useState<SkillId>('add50');
  const [parentSize, setParentSize] = useState<SealSize>(5);

  // Screen State
  const [screen, setScreen] = useState<'menu' | 'playing' | 'summary'>('menu');

  // Active Gameplay State
  const [currentPuzzle, setCurrentPuzzle] = useState<KakoomaPuzzle>(() =>
    generateSinglePuzzle('add10', 4)
  );
  const [chainPuzzle, setChainPuzzle] = useState<KakoomaChainPuzzle | null>(null);
  const [solvedOuterIndices, setSolvedOuterIndices] = useState<boolean[]>([]);
  const [solvedOuterEquations, setSolvedOuterEquations] = useState<
    ({ a: number; b: number; target: number } | null)[]
  >([]);
  const [activeOuterIndex, setActiveOuterIndex] = useState<number>(0);

  // Progress & Scoring
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [correctTaps, setCorrectTaps] = useState(0);
  const [masteredFacts, setMasteredFacts] = useState<MasteredFact[]>([]);
  const [sessionGemsEarned, setSessionGemsEarned] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);

  // Superpowers, Hints & Dopamine Popups
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [eliminatedNumbers, setEliminatedNumbers] = useState<number[]>([]);
  const [slashCharges, setSlashCharges] = useState<number>(3);
  const [wrongNumber, setWrongNumber] = useState<number | null>(null);
  const [solvedEquation, setSolvedEquation] = useState<{
    a: number;
    b: number;
    target: number;
  } | null>(null);
  const [floatingBanner, setFloatingBanner] = useState<{
    text: string;
    sub?: string;
  } | null>(null);
  const [coachMessage, setCoachMessage] = useState<string>('');
  const [mathTrickMessage, setMathTrickMessage] = useState<string>('');
  const [bossHitFlash, setBossHitFlash] = useState(false);

  // Co-op turn & Versus Winner
  const [coopTurn, setCoopTurn] = useState<'daughter' | 'parent'>('daughter');
  const [versusResult, setVersusResult] = useState<{
    winner: 'daughter' | 'parent';
    dScore: number;
    pScore: number;
  } | null>(null);

  // Timers
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const puzzleStartRef = useRef<number>(Date.now());

  const targetSealsForRound = mode === 'honmoonChain' ? 2 : mode === 'coopDuet' ? 10 : 8;

  // Dynamic Mood Soundtrack Selection (6 sliced sections from midi.mp3)
  const activeMusicTrack: MusicTrackId = (() => {
    if (showDojo || showPhotocards) return 'dojo';
    if (screen === 'menu') return 'menu';
    if (screen === 'summary' || versusResult !== null) return 'victory';
    // screen === 'playing'
    if (streak >= 3 || (mode === 'honmoonChain' && activeOuterIndex === -1)) {
      return 'fever';
    }
    if (mode === 'soloPractice') return 'dojo';
    if (mode === 'timedRush' || mode === 'versusBattle') return 'rush';
    return 'stage';
  })();

  useEffect(() => {
    soundEngine.setMusicTrack(activeMusicTrack);
  }, [activeMusicTrack]);

  useEffect(() => {
    // Gently duck background music while reading step-by-step evaluation or X-Ray panel
    soundEngine.setDucked(solvedEquation !== null || showXRay);
  }, [solvedEquation, showXRay]);

  const triggerConfetti = useCallback((small = false) => {
    try {
      confetti({
        particleCount: small ? 35 : 95,
        spread: small ? 55 : 80,
        origin: { y: 0.58 },
        colors: ['#fbbf24', '#ec4899', '#a855f7', '#22d3ee'],
      });
    } catch {
      // Ignore in headless env
    }
  }, []);

  const startGameWithConfig = (
    targetMode: GameMode = mode,
    targetSkill: SkillId = skill,
    targetSealSize: SealSize = sealSize
  ) => {
    soundEngine.playTap();
    setMode(targetMode);
    setSkill(targetSkill);
    setSealSize(targetSealSize);

    // Ensure profile exists in cache and sync current stage
    if (!profilesStore.activeProfileId) {
      const createdStore = createPlayerProfile(profilesStore, playerNameInput, hunter);
      const updatedStore: ProfilesStore = {
        ...createdStore,
        profiles: createdStore.profiles.map((p) =>
          p.id === createdStore.activeProfileId
            ? { ...p, mode: targetMode, skill: targetSkill, sealSize: targetSealSize }
            : p
        ),
      };
      saveProfilesStore(updatedStore);
      setProfilesStore(updatedStore);
      setIsCreatingNewProfile(false);
    } else {
      syncActiveProfileStage(targetMode, targetSkill, targetSealSize, hunter, false);
    }

    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setPuzzlesSolved(0);
    setTotalTaps(0);
    setCorrectTaps(0);
    setMasteredFacts([]);
    setSessionGemsEarned(0);
    setSessionXpEarned(0);
    setLeveledUpBanner(null);
    setHintLevel(0);
    setEliminatedNumbers([]);
    setSlashCharges(3);
    setWrongNumber(null);
    setSolvedEquation(null);
    setFloatingBanner(null);
    setCoachMessage(t.derpyReady);
    setMathTrickMessage('');
    setElapsedSeconds(0);
    setTimeLeft(60);
    setCoopTurn('daughter');
    setVersusResult(null);
    puzzleStartRef.current = Date.now();

    if (targetMode === 'honmoonChain') {
      const newChain = generateChainPuzzle(targetSkill, targetSealSize);
      setChainPuzzle(newChain);
      setSolvedOuterIndices(new Array(newChain.outerPuzzles.length).fill(false));
      setSolvedOuterEquations(new Array(newChain.outerPuzzles.length).fill(null));
      setActiveOuterIndex(0);
    } else {
      setCurrentPuzzle(generateSinglePuzzle(targetSkill, targetSealSize));
    }

    setScreen('playing');
  };

  const startGame = () => {
    startGameWithConfig(mode, skill, sealSize);
  };

  const completeStageAndShowSummary = useCallback(() => {
    soundEngine.playVictoryFanfare();
    triggerConfetti();
    // Stage clear bonus: modest +10 Starlight Gems & +60 XP!
    const stageBonusGems = 10;
    const stageBonusXp = 60;
    setSessionGemsEarned((prev) => prev + stageBonusGems);
    setSessionXpEarned((prev) => prev + stageBonusXp);
    updateProgress((prev) => ({
      ...prev,
      gems: prev.gems + stageBonusGems,
      xp: prev.xp + stageBonusXp,
    }));
    const autoProg = getAutoProgressedCurriculum(schoolGroup, skill, sealSize);
    const nextSt = getNextStage(skill, sealSize);
    if (autoProg.promotedGroup && autoProg.nextGroupId !== schoolGroup) {
      setSchoolGroup(autoProg.nextGroupId);
      setProfilesStore((prev) => {
        if (!prev.activeProfileId) return prev;
        const nextStore: ProfilesStore = {
          ...prev,
          profiles: prev.profiles.map((p) =>
            p.id === prev.activeProfileId
              ? { ...p, schoolGroup: autoProg.nextGroupId, lastPlayedAt: Date.now() }
              : p
          ),
        };
        saveProfilesStore(nextStore);
        return nextStore;
      });
    }
    syncActiveProfileStage(mode, nextSt.skill, nextSt.sealSize, hunter, true);
    setScreen('summary');
  }, [schoolGroup, skill, sealSize, mode, hunter, syncActiveProfileStage, triggerConfetti, updateProgress]);

  useEffect(() => {
    if (screen !== 'playing' || mode === 'versusBattle' || solvedEquation !== null) return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      if (mode === 'timedRush') {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            completeStageAndShowSummary();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, mode, solvedEquation, completeStageAndShowSummary]);

  const getActivePuzzle = (): KakoomaPuzzle => {
    if (mode === 'honmoonChain' && chainPuzzle) {
      return activeOuterIndex === -1
        ? chainPuzzle.centerPuzzle
        : chainPuzzle.outerPuzzles[activeOuterIndex];
    }
    return currentPuzzle;
  };

  // Superpower 1: Derpy Smart Hint + Mental Math Strategy Trick
  const handleAskHint = () => {
    soundEngine.playHint();
    const puz = getActivePuzzle();
    const [a, b] = puz.pair;
    const textA = formatPuzzleValue(puz, a).text;
    const textB = formatPuzzleValue(puz, b).text;
    const nextHint = hintLevel < 2 ? ((hintLevel + 1) as 1 | 2) : 2;
    setHintLevel(nextHint);

    if (nextHint === 1) {
      setCoachMessage(
        puz.operation === '×'
          ? t.derpyHintMult1(textA)
          : puz.operation === '÷'
          ? t.derpyHintDiv1(textA)
          : puz.operation === '−'
          ? t.derpyHintSub1(textA)
          : t.derpyHintAdd1(textA)
      );
    } else {
      setCoachMessage(
        puz.operation === '×'
          ? t.derpyHintFullMult(textA, textB)
          : puz.operation === '÷'
          ? t.derpyHintFullDiv(textA, textB)
          : puz.operation === '−'
          ? t.derpyHintFullSub(textA, textB)
          : t.derpyHintFullAdd(textA, textB)
      );
      setMathTrickMessage(
        getSmartMathTrick(a, b, puz.target, puz.operation, lang, puz.fractionData)
      );
    }
  };

  // Superpower 2: Idol Weapon Slash (Cuts away a distractor number!)
  const handleWeaponSlash = () => {
    const puz = getActivePuzzle();
    const [a, b] = puz.pair;
    const distractors = puz.numbers.filter(
      (n) =>
        n !== puz.target &&
        n !== puz.altTarget &&
        n !== a &&
        n !== b &&
        !eliminatedNumbers.includes(n)
    );
    if (distractors.length === 0 || slashCharges <= 0) return;

    soundEngine.playHint();
    const toSlash = distractors[0];
    const slashText = formatPuzzleValue(puz, toSlash).text;
    setEliminatedNumbers((prev) => [...prev, toSlash]);
    setSlashCharges((prev) => prev - 1);
    setCoachMessage(
      lang === 'nl'
        ? `⚔️ ${t.hunters[hunter].name} hakte het foute getal ${slashText} weg!`
        : `⚔️ ${t.hunters[hunter].name} slashed away trap number ${slashText}!`
    );
  };

  const recordChildMiss = (puz: KakoomaPuzzle) => {
    const fact = createTrickyFact(puz);
    updateProgress((prev) => {
      const merged = mergeMissedFact(fact, prev.trickyFacts, prev.factReview);
      return { ...prev, trickyFacts: merged.facts, factReview: merged.factReview };
    });
  };

  const recordArcadeMiss = useCallback(
    (fact: TrickyFactItem) => {
      updateProgress((prev) => {
        const merged = mergeMissedFact(fact, prev.trickyFacts, prev.factReview);
        return { ...prev, trickyFacts: merged.facts, factReview: merged.factReview };
      });
    },
    [updateProgress]
  );

  const recordChildSolve = (puz: KakoomaPuzzle) => {
    const solvedFactId = getFactId(puz);
    updateProgress((prev) => ({
      ...prev,
      factReview: advanceOtherReviews(prev.factReview, solvedFactId),
    }));
  };

  // Handle tapping a number orb
  const handleSelectNumber = (num: number) => {
    if (solvedEquation) return;
    const puz = getActivePuzzle();
    setTotalTaps((prev) => prev + 1);

    const check = checkKakoomaAnswer(puz, num);

    if (check.isCorrect) {
      const timeTakenMs = Date.now() - puzzleStartRef.current;
      const newStreak = streak + 1;
      const speedReward = calculateSpeedGemReward(timeTakenMs, hintLevel > 0);
      const pointsEarned = speedReward.points;
      const gemsEarned = speedReward.gems;
      const xpEarned = speedReward.xp;
      const isChildTurn = mode !== 'coopDuet' || coopTurn === 'daughter';

      soundEngine.playCorrect(newStreak);
      if (newStreak === 3 || newStreak === 6 || newStreak === 10) {
        triggerConfetti(true);
      }

      setCorrectTaps((prev) => prev + 1);
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));
      setScore((prev) => prev + pointsEarned);
      setSessionGemsEarned((prev) => prev + gemsEarned);
      setSessionXpEarned((prev) => prev + xpEarned);

      // Recharge weapon slash on 3-streak!
      if (newStreak % 3 === 0) {
        setSlashCharges((prev) => Math.min(3, prev + 1));
      }

      // Persist XP & Gems immediately!
      const solvedFactId = getFactId(puz);
      updateProgress((prev) => ({
        ...prev,
        xp: prev.xp + xpEarned,
        gems: prev.gems + gemsEarned,
        totalSolved: prev.totalSolved + 1,
        bestSpeedMs:
          prev.bestSpeedMs === null
            ? timeTakenMs
            : Math.min(prev.bestSpeedMs, timeTakenMs),
        // A puzzle the child completed counts as practice between spaced reviews.
        factReview: isChildTurn
          ? advanceOtherReviews(prev.factReview, solvedFactId)
          : prev.factReview,
      }));

      setBossHitFlash(true);
      setTimeout(() => setBossHitFlash(false), 340);

      const { a, b, target: solvedTarget } = check;
      const eqObj = { a, b, target: solvedTarget };
      const textA = formatPuzzleValue(puz, a).text;
      const textB = formatPuzzleValue(puz, b).text;
      const textTarget = formatPuzzleValue(puz, solvedTarget).text;
      const trickStr = getSmartMathTrick(
        a,
        b,
        solvedTarget,
        puz.operation,
        lang,
        puz.fractionData
      );

      setSolvedEquation(eqObj);
      setWrongNumber(null);
      setCoachMessage(t.correctEquation(textA, puz.operation, textB, textTarget));
      setMathTrickMessage(trickStr);

      // Dopamine Floating Callout Banner!
      const hypeTitle =
        newStreak >= 5
          ? lang === 'nl'
            ? `👑 GOLDEN IDOL ${newStreak}x! +${pointsEarned}`
            : `👑 GOLDEN IDOL ${newStreak}x! +${pointsEarned}`
          : newStreak >= 3
          ? `🔥 ${newStreak}x FEVER COMBO! +${pointsEarned}`
          : `✨ +${pointsEarned} PTS!`;

      setFloatingBanner({
        text: hypeTitle,
        sub: `${speedReward.badge[lang]}  •  +${gemsEarned} 💎  •  +${xpEarned} XP`,
      });

      setMasteredFacts((prev) => [
        ...prev,
        {
          equation: `${textA} ${puz.operation} ${textB} = ${textTarget}`,
          timeMs: timeTakenMs,
          trick: trickStr,
        },
      ]);
      // We intentionally keep solvedEquation open so the Center Loop expands big
      // and evaluates the whole expression step-by-step until the child closes it!
    } else {
      soundEngine.playGentleMiss();
      setStreak(0);
      setWrongNumber(num);
      const wrongText = formatPuzzleValue(puz, num).text;
      setCoachMessage(
        puz.operation === '×'
          ? t.wrongTapMult(wrongText)
          : puz.operation === '÷'
          ? t.wrongTapDiv(wrongText)
          : puz.operation === '−'
          ? t.wrongTapSub(wrongText)
          : t.wrongTapAdd(wrongText)
      );
      const [a, b] = puz.pair;
      const trickNl = getSmartMathTrick(a, b, puz.target, puz.operation, 'nl', puz.fractionData);
      const trickEn = getSmartMathTrick(a, b, puz.target, puz.operation, 'en', puz.fractionData);
      setMathTrickMessage(lang === 'nl' ? trickNl : trickEn);

      // Save this missed fact into the child's spaced-review queue (never the parent's co-op turns).
      if (mode !== 'coopDuet' || coopTurn === 'daughter') {
        recordChildMiss(puz);
      }

      if (hintLevel === 0) {
        setHintLevel(1);
      }
      setTimeout(() => setWrongNumber(null), 480);
    }
  };

  const handleAdvanceAfterSolve = () => {
    if (!solvedEquation) return;
    const eqObj = solvedEquation;
    setSolvedEquation(null);
    setFloatingBanner(null);
    setHintLevel(0);
    setEliminatedNumbers([]);
    puzzleStartRef.current = Date.now();

    if (mode === 'honmoonChain' && chainPuzzle) {
      if (activeOuterIndex !== -1) {
        const nextSolved = [...solvedOuterIndices];
        nextSolved[activeOuterIndex] = true;
        setSolvedOuterIndices(nextSolved);

        const nextEqs = [...solvedOuterEquations];
        nextEqs[activeOuterIndex] = eqObj;
        setSolvedOuterEquations(nextEqs);

        const nextUnsolvedIdx = nextSolved.findIndex((s) => !s);
        if (nextUnsolvedIdx !== -1) {
          setActiveOuterIndex(nextUnsolvedIdx);
          setCoachMessage(t.derpyReady);
        } else {
          soundEngine.playVictoryFanfare();
          triggerConfetti(true);
          setActiveOuterIndex(-1);
          setCoachMessage(t.masterSealUnlocked);
        }
      } else {
        const nextChainsDone = puzzlesSolved + 1;
        setPuzzlesSolved(nextChainsDone);
        if (nextChainsDone >= targetSealsForRound) {
          completeStageAndShowSummary();
        } else {
          const freshChain = generateChainPuzzle(skill, sealSize);
          setChainPuzzle(freshChain);
          setSolvedOuterIndices(new Array(freshChain.outerPuzzles.length).fill(false));
          setSolvedOuterEquations(new Array(freshChain.outerPuzzles.length).fill(null));
          setActiveOuterIndex(0);
          setCoachMessage(t.derpyReady);
        }
      }
      return;
    }

    const nextSolvedCount = puzzlesSolved + 1;
    setPuzzlesSolved(nextSolvedCount);

    if (mode !== 'timedRush' && nextSolvedCount >= targetSealsForRound) {
      completeStageAndShowSummary();
      return;
    }

    if (mode === 'coopDuet') {
      const nextTurn = coopTurn === 'daughter' ? 'parent' : 'daughter';
      setCoopTurn(nextTurn);
      const nextSkill = nextTurn === 'daughter' ? skill : parentSkill;
      const nextSize = nextTurn === 'daughter' ? sealSize : parentSize;
      setCurrentPuzzle(generateSinglePuzzle(nextSkill, nextSize));
    } else {
      setCurrentPuzzle(generateSinglePuzzle(skill, sealSize));
    }
    setCoachMessage(t.derpyReady);
  };

  const activePuzzle = getActivePuzzle();
  const isGoldenCombo = streak >= 3;
  const sessionAccuracyText =
    totalTaps > 0 ? `${Math.round((correctTaps / totalTaps) * 100)}%` : '—';
  const practicedStrategies = getPracticedStrategies(masteredFacts.map((f) => f.trick));
  // mergeMissedFact keeps the most recent miss first.
  const nextFocusFact = progress.trickyFacts[0] ?? null;
  const avgSolveSeconds =
    masteredFacts.length > 0
      ? (
          masteredFacts.reduce((acc, f) => acc + f.timeMs, 0) /
          masteredFacts.length /
          1000
        ).toFixed(1)
      : '0';
  const levelInfo = getLevelInfo(progress.xp, lang);

  const progressPercent =
    mode === 'timedRush'
      ? Math.min(100, (puzzlesSolved / 12) * 100)
      : mode === 'honmoonChain' && chainPuzzle
      ? Math.min(
          100,
          ((puzzlesSolved * (chainPuzzle.outerPuzzles.length + 1) +
            solvedOuterIndices.filter(Boolean).length +
            (activeOuterIndex === -1 ? 0.5 : 0)) /
            (targetSealsForRound * (chainPuzzle.outerPuzzles.length + 1))) *
            100
        )
      : Math.min(100, (puzzlesSolved / targetSealsForRound) * 100);

  return (
    <div
      data-theme={theme}
      className={`app-shell overflow-x-hidden w-full ${
        theme === 'light' ? 'theme-light' : 'theme-dark'
      } min-h-screen transition-colors duration-300 text-white flex flex-col justify-between pb-8 ${
        isGoldenCombo && screen === 'playing'
          ? 'bg-[#120726] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/45 via-[#14072b] to-[#06020d]'
          : 'bg-[#090414] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/60 via-[#090414] to-[#05020a]'
      }`}
    >
      {/* Top Navigation + Idol XP / Gems / Hamburger Menu Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#090414]/90 border-b border-fuchsia-500/30 px-3 sm:px-6 py-2.5">
        <div className="relative max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Back Button */}
          <div className="flex items-center gap-2 min-w-0">
            {(screen !== 'menu' || showTangArcade) && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTap();
                  setShowTangArcade(false);
                  setScreen('menu');
                }}
                className="p-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-fuchsia-400/40 text-fuchsia-200 flex items-center gap-1 text-xs font-bold shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t.backToStageBtn}</span>
              </button>
            )}
            <div
              onClick={() => {
                setShowTangArcade(false);
                setScreen('menu');
              }}
              className="cursor-pointer flex items-center gap-2 min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-amber-400 p-0.5 shadow-[0_0_15px_rgba(236,72,153,0.5)] shrink-0">
                <div className="keep-dark-card w-full h-full bg-[#120626] rounded-[10px] flex items-center justify-center font-display font-black text-amber-300 text-xs sm:text-sm">
                  H/X
                </div>
              </div>
              <div className="min-w-0">
                <h1
                  className={`font-display font-black text-xs sm:text-lg tracking-wide bg-gradient-to-r ${
                    theme === 'light'
                      ? 'from-purple-800 via-pink-600 to-amber-600'
                      : 'from-amber-200 via-pink-300 to-cyan-300'
                  } bg-clip-text text-transparent leading-none truncate`}
                >
                  <span className="sm:hidden">HUNTR/X</span>
                  <span className="hidden sm:inline">{t.appTitle}</span>
                </h1>
                {/* Live Idol Rank & XP Mini-Bar */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-black text-amber-300 truncate">
                    Lv.{levelInfo.level}{' '}
                    <span className="hidden xs:inline sm:inline">{levelInfo.title}</span>
                  </span>
                  <div className="w-10 sm:w-24 h-1.5 bg-purple-950 rounded-full overflow-hidden border border-purple-600/50 shrink-0">
                    <div
                      style={{ width: `${levelInfo.progressPct}%` }}
                      className="h-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls: Compact Player Pill, Dojo, Gems & Hamburger Dropdown Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Multi-User Profile Switcher Button */}
            <button
              type="button"
              data-testid="open-profile-modal-btn"
              onClick={() => {
                soundEngine.playTap();
                setShowProfileModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/25 to-purple-500/25 hover:from-pink-500/40 hover:to-purple-500/40 border border-pink-400/70 text-pink-100 text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_12px_rgba(236,72,153,0.25)] transition-all"
            >
              <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="max-w-[72px] sm:max-w-[110px] truncate">
                {activeProfile ? activeProfile.name : lang === 'nl' ? 'Spelers' : 'Players'}
              </span>
            </button>

            {/* HUNTR/X Number Dojo Button */}
            <button
              type="button"
              data-testid="open-dojo-btn"
              onClick={() => {
                soundEngine.playTap();
                setShowDojo(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400/70 text-cyan-200 text-xs font-extrabold flex items-center gap-1 shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all"
            >
              <span>{t.dojoBtnLabel}</span>
            </button>

            {/* HUNTR/X Full-Page Math Arcade Button */}
            <button
              type="button"
              data-testid="open-tang-arcade-btn"
              onClick={() => {
                soundEngine.playTap();
                setArcadeViewMode('hub');
                setShowTangArcade(true);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                showTangArcade
                  ? 'keep-white-text bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 border-white shadow-[0_0_18px_rgba(236,72,153,0.55)]'
                  : 'bg-gradient-to-r from-fuchsia-500/25 to-pink-500/25 hover:from-fuchsia-500/40 hover:to-pink-500/40 border-fuchsia-400/70 text-pink-200 shadow-[0_0_15px_rgba(236,72,153,0.25)]'
              }`}
            >
              <span>🕹️ {lang === 'nl' ? 'Arcade (10)' : 'Arcade (10)'}</span>
            </button>

            {/* Collectible Photobook & Gems Button */}
            <button
              type="button"
              data-testid="open-photocard-btn"
              onClick={() => {
                soundEngine.playTap();
                setShowPhotocards(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-pink-500/25 hover:from-amber-500/40 hover:to-pink-500/40 border border-amber-300/70 text-amber-200 text-xs font-extrabold flex items-center gap-1 shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all"
            >
              <span>💎 {progress.gems}</span>
              <span className="hidden md:inline text-pink-200">
                • 🃏 {progress.unlockedCards.length}/{PHOTOCARD_CATALOG.length}
              </span>
            </button>

            {/* Hamburger Settings Dropdown Trigger (Music, Sound, Theme, Language, Rules) */}
            <button
              ref={headerMenuBtnRef}
              type="button"
              data-testid="header-menu-btn"
              onClick={() => {
                soundEngine.playTap();
                setShowHeaderMenu((prev) => !prev);
              }}
              aria-label="Menu"
              className={`p-2 rounded-xl border text-xs font-extrabold flex items-center justify-center transition-all ${
                showHeaderMenu
                  ? 'keep-white-text bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 border-white shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                  : 'bg-purple-950/80 border-fuchsia-400/50 text-amber-300 hover:border-amber-300'
              }`}
            >
              {showHeaderMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Hamburger Dropdown Menu Panel (Music, Sound FX, Light/Dark Theme, NL/EN Language, Rules) */}
          {showHeaderMenu && (
            <div
              ref={headerDropdownRef}
              data-testid="header-dropdown-menu"
              className="light-surface-card absolute right-0 top-full mt-2 w-72 sm:w-80 z-50 rounded-2xl bg-gradient-to-b from-[#220a47] to-[#120529] border-2 border-fuchsia-400/60 p-3.5 shadow-[0_14px_40px_rgba(0,0,0,0.65)] space-y-2.5 animate-fadeIn"
            >
                {/* 1. Language Switcher (NL / EN) */}
                <div className="flex items-center justify-between gap-2 bg-purple-950/60 border border-purple-700/50 rounded-xl p-2">
                  <span className="text-xs font-extrabold text-purple-200 pl-1">
                    🌐 {t.langSwitchLabel}
                  </span>
                  <div className="flex items-center bg-purple-950/90 border border-fuchsia-500/40 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => toggleLanguage('nl')}
                      className={`px-2.5 py-1 rounded-md text-xs font-extrabold transition-all ${
                        lang === 'nl'
                          ? 'bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 shadow'
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      🇳🇱 NL
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLanguage('en')}
                      className={`px-2.5 py-1 rounded-md text-xs font-extrabold transition-all ${
                        lang === 'en'
                          ? 'bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 shadow'
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      🇬🇧 EN
                    </button>
                  </div>
                </div>

                {/* 2. Theme Toggle (Light / Dark) */}
                <button
                  type="button"
                  data-testid="theme-toggle"
                  onClick={toggleTheme}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-700/50 flex items-center justify-between text-xs font-extrabold transition-all"
                >
                  <span className="flex items-center gap-2 text-purple-100">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-300" />
                    ) : (
                      <Moon className="w-4 h-4 text-purple-700" />
                    )}
                    <span>{lang === 'nl' ? 'Kleurthema' : 'Color Theme'}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/50 text-amber-300">
                    {theme === 'dark'
                      ? lang === 'nl'
                        ? '☀️ Schakel Licht'
                        : '☀️ Switch to Light'
                      : lang === 'nl'
                      ? '🌙 Schakel Donker'
                      : '🌙 Switch to Dark'}
                  </span>
                </button>

                {/* 3. Background Music / Beat Toggle */}
                <button
                  type="button"
                  data-testid="music-toggle"
                  onClick={() => {
                    if (!sfxOn) {
                      setSfxOn(true);
                      soundEngine.sfxEnabled = true;
                    }
                    const nextBeat = soundEngine.toggleBeat();
                    setBeatOn(nextBeat);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-700/50 flex items-center justify-between text-xs font-extrabold transition-all"
                >
                  <span className="flex items-center gap-2 text-purple-100">
                    <Music className="w-4 h-4 text-pink-400" />
                    <span>{lang === 'nl' ? 'Achtergrond Beat' : 'Background Beat'}</span>
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg border ${
                      beatOn
                        ? 'keep-white-text bg-gradient-to-r from-pink-600 to-purple-600 border-amber-300 text-white'
                        : 'bg-purple-900/60 border-purple-600 text-purple-300'
                    }`}
                  >
                    {beatOn ? t.beatOn : t.beatOff}
                  </span>
                </button>

                {/* 4. Sound Effects (SFX) Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !sfxOn;
                    setSfxOn(next);
                    soundEngine.sfxEnabled = next;
                    if (!next) {
                      setBeatOn(false);
                      soundEngine.toggleBeat(false);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-700/50 flex items-center justify-between text-xs font-extrabold transition-all"
                >
                  <span className="flex items-center gap-2 text-purple-100">
                    {sfxOn ? (
                      <Volume2 className="w-4 h-4 text-amber-300" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{lang === 'nl' ? 'Geluidseffecten' : 'Sound Effects'}</span>
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg border ${
                      sfxOn
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {sfxOn ? t.soundOn : t.soundOff}
                  </span>
                </button>

                {/* 5. How to Play / Rules Modal */}
                <button
                  type="button"
                  data-testid="open-tutorial-btn"
                  onClick={() => {
                    soundEngine.playTap();
                    setShowHeaderMenu(false);
                    setShowTutorial(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/50 text-fuchsia-200 text-xs font-extrabold flex items-center justify-center gap-2 transition-all"
                >
                  <HelpCircle className="w-4 h-4 text-amber-300" />
                  <span>{t.howToPlayBtn}</span>
                </button>
              </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-4">
        {/* ==================== FULL-PAGE MATH ARCADE VIEW ==================== */}
        <TangArcadeModal
          isOpen={showTangArcade}
          onClose={() => setShowTangArcade(false)}
          lang={lang}
          schoolGroup={schoolGroup}
          onChangeSchoolGroup={handleSelectSchoolGroup}
          gems={progress.gems}
          initialGame={initialTangGame}
          pageMode={true}
          initialViewMode={arcadeViewMode}
          onRecordMiss={recordArcadeMiss}
          onOpenDojo={() => {
            setShowTangArcade(false);
            setShowDojo(true);
          }}
          onEarnReward={(gemsEarned, xpEarned) => {
            updateProgress((prev) => ({
              ...prev,
              gems: prev.gems + gemsEarned,
              xp: prev.xp + xpEarned,
            }));
          }}
        />

        {/* ==================== MENU SCREEN (RETURNING DASHBOARD + 4-STEP WIZARD) ==================== */}
        {!showTangArcade && screen === 'menu' && (
          <div className="space-y-5 animate-fadeIn">
            {/* CASE A: RETURNING PLAYER KID-FRIENDLY BLOCK DASHBOARD */}
            {wizardStep === 0 && activeProfile ? (
              <div
                data-testid="returning-player-dashboard"
                className="light-surface-card relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#240b4c] via-[#3b0a57] to-[#14072e] border-2 border-amber-300/60 p-4 sm:p-7 shadow-[0_0_45px_rgba(236,72,153,0.3)] space-y-5"
              >
                {/* BLOCK 1: Hero Idol Banner + Big 1-Tap Play Stage Block */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  {/* Left: Idol Avatar + Greeting + Switch Player */}
                  <div className="lg:col-span-5 bg-purple-950/65 border-2 border-purple-700/60 rounded-2xl p-4 flex flex-col justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="shrink-0 animate-float-slow">
                        <HunterAvatar hunter={activeProfile.hunter} size={78} animate />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {t.welcomeBack.currentStageBadge(
                              getStageNumber(activeProfile.skill, activeProfile.sealSize)
                            )}{' '}
                            • Lv.{levelInfo.level}
                          </span>
                        </div>
                        <h2 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight truncate">
                          {t.welcomeBack.greeting(activeProfile.name)}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="px-2.5 py-0.5 rounded-lg bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs sm:text-sm font-black">
                            🎤 {t.hunters[activeProfile.hunter].name}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs sm:text-sm font-black">
                            ✨ {progress.totalSolved}{' '}
                            {lang === 'nl' ? 'zegels' : 'seals'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid="dashboard-switch-player-btn"
                      onClick={() => {
                        soundEngine.playTap();
                        setShowProfileModal(true);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-pink-400/50 text-pink-100 font-display font-black text-sm flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>{t.welcomeBack.switchPlayerBtn}</span>
                    </button>
                  </div>

                  {/* Right: Giant 1-Tap Continue Stage Block + 3 Action Tiles */}
                  <div className="lg:col-span-7 bg-purple-950/65 border-2 border-fuchsia-400/50 rounded-2xl p-4 flex flex-col justify-between gap-3">
                    <button
                      type="button"
                      data-testid="continue-stage-btn"
                      onClick={() =>
                        startGameWithConfig(
                          activeProfile.mode,
                          activeProfile.skill,
                          activeProfile.sealSize
                        )
                      }
                      className="kid-block-card w-full py-4 sm:py-5 px-5 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 text-slate-950 font-display font-black text-lg sm:text-2xl tracking-wide shadow-[0_0_35px_rgba(236,72,153,0.65)] hover:brightness-110 flex flex-col items-center justify-center gap-1 text-center cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-2.5">
                        <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950 shrink-0" />
                        <span className="leading-snug">
                          {t.welcomeBack.continueStageBtn(
                            getStageNumber(activeProfile.skill, activeProfile.sealSize),
                            t.skills[activeProfile.skill].name
                          )}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900/85">
                        {t.modes[activeProfile.mode].title} • 🌸 {activeProfile.sealSize}
                      </span>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        data-testid="dashboard-try-power-btn"
                        onClick={() => {
                          soundEngine.playTap();
                          setWizardStep(3);
                        }}
                        className="kid-block-card px-3.5 py-3 rounded-xl bg-gradient-to-r from-cyan-500/25 to-blue-600/25 hover:from-cyan-500/40 hover:to-blue-600/40 border-2 border-cyan-400/60 text-cyan-200 font-display font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{t.welcomeBack.tryOtherPowerBtn}</span>
                      </button>

                      <button
                        type="button"
                        data-testid="dashboard-change-mode-btn"
                        onClick={() => {
                          soundEngine.playTap();
                          setWizardStep(2);
                        }}
                        className="kid-block-card px-3.5 py-3 rounded-xl bg-purple-900/75 hover:bg-purple-800 border-2 border-fuchsia-400/50 text-fuchsia-200 font-display font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{t.welcomeBack.changeActivityBtn}</span>
                      </button>

                      <button
                        type="button"
                        data-testid="dashboard-open-wizard-btn"
                        onClick={() => {
                          soundEngine.playTap();
                          setIsCreatingNewProfile(false);
                          setPlayerNameInput(activeProfile.name);
                          setWizardStep(4);
                        }}
                        className="kid-block-card px-3.5 py-3 rounded-xl bg-purple-900/75 hover:bg-purple-800 border-2 border-amber-300/50 text-amber-200 font-display font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{t.welcomeBack.customizeWizardBtn}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ==================== BLOCK 2: FULL-PAGE 10-GAME MATH ARCADE PORTAL ==================== */}
                <div
                  data-testid="dashboard-tang-arcade-section"
                  className="bg-gradient-to-br from-purple-950/85 via-fuchsia-950/60 to-indigo-950/85 border-2 border-pink-400/60 rounded-3xl p-4 sm:p-6 space-y-4 shadow-[0_0_30px_rgba(236,72,153,0.2)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl animate-float-slow">🕹️</span>
                      <div>
                        <h3 className="font-display font-black text-xl sm:text-2xl text-amber-300 leading-tight">
                          {lang === 'nl'
                            ? 'Reken-Arcade • 11 Spellen'
                            : 'Math Arcade • 11 Games'}
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-pink-200">
                          {lang === 'nl'
                            ? 'Kies een spel of open de hele Arcade-pagina!'
                            : 'Tap any game block or open the full Arcade page!'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid="open-arcade-hub-hero-btn"
                      onClick={() => {
                        soundEngine.playCardOpen();
                        setArcadeViewMode('hub');
                        setShowTangArcade(true);
                      }}
                      className="kid-block-card px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 text-slate-950 font-display font-black text-sm sm:text-base shadow-[0_0_25px_rgba(251,191,36,0.5)] flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <span>🕹️</span>
                      <span>
                        {lang === 'nl'
                          ? 'Open Alle 11 Spellen ➔'
                          : 'Open All 11 Games ➔'}
                      </span>
                    </button>
                  </div>

                  {/* 11 Visual Arcade Game Blocks */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {ARCADE_GAMES_CATALOG.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        data-testid={`launch-tang-${g.id}`}
                        onClick={() => {
                          soundEngine.playCardOpen();
                          setInitialTangGame(g.id);
                          setArcadeViewMode('stage');
                          setShowTangArcade(true);
                        }}
                        className={`kid-block-card pad-3d-step p-3.5 rounded-2xl bg-white/12 hover:bg-white/22 backdrop-blur-md border ${g.cardBorder} text-left flex flex-col justify-between gap-2 cursor-pointer`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-3xl sm:text-4xl animate-float-slow">
                            {g.emoji}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/50 text-[11px] font-black text-white">
                            ▶
                          </span>
                        </div>
                        <div>
                          <div className="font-display font-black text-sm sm:text-base text-white leading-snug">
                            {lang === 'nl' ? g.titleNl : g.titleEn}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="text-xs font-bold text-sky-100/90 truncate">
                              {lang === 'nl' ? g.subtitleNl : g.subtitleEn}
                            </span>
                            {g.minGroupBadgeNl && g.minGroupBadgeEn && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400/35 border border-amber-200/80 text-[10px] font-display font-black text-amber-100">
                                🎓 {lang === 'nl' ? g.minGroupBadgeNl : g.minGroupBadgeEn}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ==================== BLOCK 3: SCHOOL GROUP & 4 VISUAL MISSION BLOCKS ==================== */}
                {(() => {
                  const activeGroupSpec = getCurriculumGroup(schoolGroup);
                  return (
                    <div
                      data-testid="dashboard-school-group-section"
                      className="bg-purple-950/65 border-2 border-cyan-400/45 rounded-3xl p-4 sm:p-6 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl sm:text-4xl">
                            {activeGroupSpec.mascotEmoji}
                          </span>
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-300/50 text-cyan-300 text-xs font-black uppercase">
                              <span>
                                🎓 {activeGroupSpec.ageRange}{' '}
                                {lang === 'nl' ? 'jr' : 'yrs'}
                              </span>
                            </div>
                            <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                              {activeGroupSpec.fullTitle[lang]}
                            </h3>
                          </div>
                        </div>

                        {/* 6 School Group Pills (Groep 3–8 / Year 1–6) */}
                        <div className="flex flex-wrap items-center gap-2">
                          {CURRICULUM_GROUPS.map((grp) => {
                            const isSelected = grp.id === schoolGroup;
                            return (
                              <button
                                key={grp.id}
                                type="button"
                                data-testid={`select-group-${grp.id}`}
                                onClick={() => {
                                  soundEngine.playSelect();
                                  handleSelectSchoolGroup(grp.id);
                                }}
                                className={`px-3.5 py-2 rounded-2xl font-display font-black text-xs sm:text-sm transition-all cursor-pointer ${
                                  isSelected
                                    ? `bg-gradient-to-r ${grp.accentGradient} text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.45)] scale-105`
                                    : 'bg-purple-900/75 hover:bg-purple-800 text-purple-200 border border-purple-700/60'
                                }`}
                              >
                                {grp.mascotEmoji} {grp.shortLabel[lang]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Compact Concept Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        {activeGroupSpec.conceptTags[lang].map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-xs sm:text-sm font-black text-cyan-200"
                          >
                            ✨ {tag}
                          </span>
                        ))}
                      </div>

                      {/* 4 Big Visual Mission Blocks (No Wall-of-Text!) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {activeGroupSpec.missions.map((mission) => (
                          <button
                            key={mission.id}
                            type="button"
                            data-testid={`group-mission-${mission.id}`}
                            onClick={() =>
                              startGameWithConfig(
                                activeProfile.mode,
                                mission.skill,
                                mission.sealSize
                              )
                            }
                            className="kid-block-card group text-left p-4 rounded-2xl bg-gradient-to-br from-purple-900/85 to-indigo-950/90 hover:from-pink-600/35 hover:to-purple-800/85 border-2 border-purple-600/60 hover:border-amber-300 flex flex-col justify-between gap-3 cursor-pointer"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-3xl">{mission.badgeEmoji}</span>
                                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-300/40 text-amber-300 font-black text-xs">
                                  {mission.ixlSkillCode[lang]}
                                </span>
                              </div>
                              <div className="font-display font-black text-base sm:text-lg text-white group-hover:text-amber-200 leading-snug">
                                {mission.title[lang]}
                              </div>
                            </div>
                            <div className="text-xs sm:text-sm font-black text-cyan-300 flex items-center justify-between pt-2 border-t border-purple-800/60">
                              <span>🌸 {mission.sealSize}</span>
                              <span className="text-amber-300">▶ +1..8 💎</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ==================== BLOCK 4: BIG VISUAL PHOTOBOOK & DOJO TILES ==================== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTap();
                      setShowPhotocards(true);
                    }}
                    className="kid-block-card w-full p-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-display font-black text-base sm:text-lg flex items-center justify-between gap-3 shadow-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🃏</span>
                      <div className="text-left">
                        <div className="leading-tight">
                          {lang === 'nl' ? '100 Fotokaarten Album' : '100 Photocard Album'}
                        </div>
                        <div className="text-xs font-extrabold text-slate-800">
                          {progress.unlockedCards.length} / {PHOTOCARD_CATALOG.length}{' '}
                          {lang === 'nl' ? 'verzameld' : 'collected'}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950/15 text-sm font-black">
                      💎 {progress.gems}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTap();
                      setShowDojo(true);
                    }}
                    className="kid-block-card w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 text-slate-950 font-display font-black text-base sm:text-lg flex items-center justify-between gap-3 shadow-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🥋</span>
                      <div className="text-left">
                        <div className="leading-tight">
                          {lang === 'nl' ? 'HUNTR/X Getallen-Dojo' : 'HUNTR/X Number Dojo'}
                        </div>
                        <div className="text-xs font-extrabold text-slate-800">
                          {progress.trickyFacts.length}{' '}
                          {lang === 'nl' ? 'oefensommen klaar' : 'review facts ready'}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950/15 text-sm font-black">
                      +1 💎
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* CASE B: 4-STEP STAGE-BY-STAGE MOBILE WIZARD */
              <div
                data-testid="setup-wizard"
                className="light-surface-card rounded-3xl bg-gradient-to-b from-[#220a47]/95 via-[#180736]/95 to-[#100424]/95 border-2 border-fuchsia-500/45 p-4 sm:p-6 shadow-[0_0_40px_rgba(168,85,247,0.25)] space-y-5"
              >
                {/* Wizard Step Progress Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-700/50 pb-3.5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {(
                      [
                        { step: 1 as const, label: t.wizard.step1Short },
                        { step: 2 as const, label: t.wizard.step2Short },
                        { step: 3 as const, label: t.wizard.step3Short },
                        { step: 4 as const, label: t.wizard.step4Short },
                      ] as const
                    ).map((s) => {
                      const isCurrent = wizardStep === s.step;
                      const isDone = wizardStep > s.step;
                      return (
                        <button
                          key={s.step}
                          type="button"
                          data-testid={`wizard-step-pill-${s.step}`}
                          onClick={() => {
                            if (wizardStep === 1 && s.step !== 1) {
                              handleSaveStep1AndAdvance(s.step);
                            } else {
                              soundEngine.playTap();
                              setWizardStep(s.step);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-display font-extrabold text-xs whitespace-nowrap transition-all border ${
                            isCurrent
                              ? 'bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 border-white shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                              : isDone
                              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                              : 'bg-purple-950/70 border-purple-700/50 text-purple-300 hover:border-purple-500'
                          }`}
                        >
                          {isDone ? `✓ ${s.label}` : s.label}
                        </button>
                      );
                    })}
                  </div>

                  {activeProfile && !isCreatingNewProfile && (
                    <button
                      type="button"
                      data-testid="back-to-dashboard-btn"
                      onClick={() => {
                        soundEngine.playTap();
                        setWizardStep(0);
                      }}
                      className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/60 text-amber-200 text-xs font-extrabold flex items-center gap-1"
                    >
                      <span>⚡ {activeProfile.name} Dashboard</span>
                    </button>
                  )}
                </div>

                {/* ==================== WIZARD STEP 1: PLAYER & IDOL SELECTION ==================== */}
                {wizardStep === 1 && (
                  <div data-testid="wizard-step-1" className="space-y-5 animate-fadeIn">
                    {/* If cached profiles already exist on this device, allow 1-tap switching! */}
                    {profilesStore.profiles.length > 0 && (
                      <div className="bg-purple-950/70 border border-cyan-400/40 rounded-2xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                            {t.wizard.savedPlayersTitle}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowProfileModal(true)}
                            className="text-xs font-bold text-amber-300 hover:underline flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{t.welcomeBack.switchPlayerBtn}</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profilesStore.profiles.map((prof) => (
                            <button
                              key={prof.id}
                              type="button"
                              data-testid={`quick-select-profile-${prof.name}`}
                              onClick={() => handleSelectProfile(prof.id)}
                              className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-pink-600/40 hover:to-purple-800 border border-pink-400/50 text-white font-display font-bold text-xs flex items-center gap-2 shadow transition-all"
                            >
                              <HunterAvatar hunter={prof.hunter} size={28} />
                              <span>{prof.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px]">
                                Stage {getStageNumber(prof.skill, prof.sealSize)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-center sm:text-left">
                      <h2 className="font-display font-black text-xl sm:text-2xl text-amber-300">
                        {t.wizard.step1Title}
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-200 mt-0.5">
                        {t.wizard.step1Subtitle}
                      </p>
                    </div>

                    {/* Pick Your HUNTR/X Idol (Rumi, Mira, Zoey) */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                      {(['rumi', 'mira', 'zoey'] as HunterId[]).map((hId) => {
                        const hInfo = t.hunters[hId];
                        const active = hunter === hId;
                        return (
                          <button
                            key={hId}
                            type="button"
                            data-testid={`select-idol-${hId}`}
                            onClick={() => {
                              soundEngine.playTap();
                              setHunter(hId);
                            }}
                            className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                              active
                                ? 'bg-gradient-to-b from-pink-500/35 to-purple-800/60 border-amber-300 scale-[1.03] shadow-[0_0_22px_rgba(236,72,153,0.45)]'
                                : 'bg-purple-900/30 border-purple-700/40 opacity-85 hover:opacity-100'
                            }`}
                          >
                            <HunterAvatar hunter={hId} size={74} animate={active} />
                            <div className="font-display font-black text-base sm:text-lg text-white mt-2">
                              {hInfo.name}
                            </div>
                            <div className="text-[11px] font-bold text-amber-300">{hInfo.role}</div>
                            <div className="text-[10px] text-purple-200/80 mt-0.5 hidden sm:block">
                              {hInfo.weapon}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* School Group / Year Selector (Groep 3-8 / IB PYP 1-6 / Year 1-6) */}
                    <div
                      data-testid="wizard-school-group-selector"
                      className="bg-purple-950/60 border border-amber-400/40 rounded-2xl p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display font-extrabold text-sm sm:text-base text-amber-300">
                          {lang === 'nl'
                            ? '🎓 In welke groep / welk leerjaar zit je? (Groep 3–8 / IB PYP 1–6)'
                            : '🎓 Which school group / year are you in? (Year 1–6 / IB PYP 1–6)'}
                        </span>
                        <span className="text-xs font-bold text-purple-200/80">
                          {lang === 'nl'
                            ? 'Groeit automatisch met je mee!'
                            : 'Auto-advances as you progress!'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {CURRICULUM_GROUPS.map((grp) => {
                          const isGrpActive = schoolGroup === grp.id;
                          return (
                            <button
                              key={grp.id}
                              type="button"
                              data-testid={`wizard-group-btn-${grp.id}`}
                              onClick={() => handleSelectSchoolGroup(grp.id)}
                              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                                isGrpActive
                                  ? 'bg-gradient-to-br from-amber-500/30 to-pink-600/30 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.3)]'
                                  : 'bg-slate-950/70 border-purple-500/30 hover:border-purple-400/60'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-base">{grp.mascotEmoji}</span>
                                <span className="text-[10px] font-extrabold text-amber-300">
                                  {grp.ageRange} {lang === 'nl' ? 'jr' : 'yrs'}
                                </span>
                              </div>
                              <div className="font-display font-black text-xs text-white mt-0.5">
                                {grp.shortLabel[lang]}
                              </div>
                              <div className="text-[10px] text-purple-200/80 font-semibold truncate">
                                {grp.fullTitle[lang].split('•')[1]?.trim() ||
                                  grp.shortLabel[lang]}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Player Session Name Input */}
                    <div className="bg-purple-950/60 border border-fuchsia-500/40 rounded-2xl p-4 space-y-2">
                      <label
                        htmlFor="player-name-input"
                        className="block font-display font-extrabold text-xs sm:text-sm text-amber-300"
                      >
                        {t.wizard.playerNameLabel}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          id="player-name-input"
                          data-testid="player-name-input"
                          type="text"
                          maxLength={20}
                          value={playerNameInput}
                          onChange={(e) => setPlayerNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveStep1AndAdvance(2);
                            }
                          }}
                          placeholder={t.wizard.playerNamePlaceholder}
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-950/90 border-2 border-purple-500/60 focus:border-amber-300 text-white font-display font-bold text-base outline-none"
                        />
                        <button
                          type="button"
                          data-testid="wizard-step1-next-btn"
                          onClick={() => handleSaveStep1AndAdvance(2)}
                          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 text-slate-950 font-display font-black text-sm sm:text-base shadow-[0_0_24px_rgba(236,72,153,0.5)] hover:brightness-110 flex items-center justify-center gap-2 shrink-0"
                        >
                          <span>{t.wizard.saveProfileAndNextBtn}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== WIZARD STEP 2: PICK YOUR ACTIVITY (GAME MODE) ==================== */}
                {wizardStep === 2 && (
                  <div data-testid="wizard-step-2" className="space-y-4 animate-fadeIn">
                    <div>
                      <h2 className="font-display font-black text-xl sm:text-2xl text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-pink-400" />
                        {t.wizard.step2Title}
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-200 mt-0.5">
                        {t.wizard.step2Subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {(
                        [
                          { id: 'soloPractice', icon: ShieldCheck, color: 'from-purple-600 to-indigo-700' },
                          { id: 'honmoonChain', icon: Star, color: 'from-amber-500 to-pink-600' },
                          { id: 'timedRush', icon: Zap, color: 'from-fuchsia-600 to-rose-600' },
                          { id: 'coopDuet', icon: Users, color: 'from-cyan-500 to-blue-600' },
                          { id: 'versusBattle', icon: Swords, color: 'from-emerald-500 to-teal-700' },
                        ] as const
                      ).map((item) => {
                        const Icon = item.icon;
                        const active = mode === item.id;
                        const mInfo = t.modes[item.id];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            data-testid={`select-mode-${item.id}`}
                            onClick={() => {
                              soundEngine.playTap();
                              setMode(item.id);
                              syncActiveProfileStage(item.id, skill, sealSize, hunter, false);
                              setWizardStep(3);
                            }}
                            className={`text-left rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                              active
                                ? 'bg-gradient-to-b from-fuchsia-950/90 to-purple-900/90 border-amber-300 scale-[1.02] shadow-[0_0_24px_rgba(251,191,36,0.35)]'
                                : 'bg-purple-950/40 border-purple-700/40 hover:border-fuchsia-400/60'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div
                                  className={`p-2 rounded-xl bg-gradient-to-br ${item.color} text-white shadow`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-amber-200">
                                  {mInfo.badge}
                                </span>
                              </div>
                              <div className="font-display font-black text-base text-white mb-1">
                                {mInfo.title}
                              </div>
                              <p className="text-xs text-purple-200/85 leading-relaxed">
                                {mInfo.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playTap();
                          setWizardStep(1);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-purple-900/60 border border-purple-600 text-purple-200 font-bold text-xs sm:text-sm"
                      >
                        {t.wizard.backBtn}
                      </button>
                      <button
                        type="button"
                        data-testid="wizard-step2-next-btn"
                        onClick={() => {
                          soundEngine.playTap();
                          setWizardStep(3);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 font-display font-black text-xs sm:text-sm flex items-center gap-1"
                      >
                        <span>{t.wizard.nextBtn}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================== WIZARD STEP 3: PICK YOUR MATH POWER ==================== */}
                {wizardStep === 3 && (
                  <div data-testid="wizard-step-3" className="space-y-4 animate-fadeIn">
                    <div>
                      <h2 className="font-display font-black text-xl sm:text-2xl text-amber-300 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-pink-400" />
                        {t.wizard.step3Title}
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-200 mt-0.5">
                        {t.wizard.step3Subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {SKILL_ORDER.map((sId) => {
                        const sInfo = t.skills[sId];
                        const active = skill === sId;
                        const isRecommended = activeProfile?.skill === sId;
                        const isMult = sId === 'multEasy' || sId === 'multAll';
                        const isDiv = sId === 'divAll';
                        const isSub = sId === 'sub20' || sId === 'sub100';
                        const isFrac = sId === 'fracEasy' || sId === 'fracPro';
                        const isBoss = sId === 'mixBoss';

                        const iconSymbol = isFrac
                          ? '½'
                          : isDiv
                          ? '÷'
                          : isMult
                          ? '×'
                          : isSub
                          ? '−'
                          : isBoss
                          ? '★'
                          : '+';

                        const badgeColor = isFrac
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40'
                          : isDiv
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                          : isMult
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : isSub
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-300/40';

                        return (
                          <button
                            key={sId}
                            type="button"
                            data-testid={`select-skill-${sId}`}
                            onClick={() => {
                              soundEngine.playTap();
                              setSkill(sId);
                              syncActiveProfileStage(mode, sId, sealSize, hunter, false);
                              setWizardStep(4);
                            }}
                            className={`text-left rounded-2xl p-3.5 border-2 transition-all flex items-start justify-between gap-3 ${
                              active
                                ? 'bg-gradient-to-r from-pink-600/35 to-purple-800/60 border-amber-300 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                                : 'bg-purple-950/40 border-purple-800/50 hover:border-fuchsia-400/50'
                            }`}
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-200">
                                  {sInfo.badge}
                                </span>
                                {isRecommended && (
                                  <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                                    {t.wizard.recommendedBadge}
                                  </span>
                                )}
                              </div>
                              <div className="font-display font-bold text-base sm:text-lg text-white">
                                {sInfo.name}
                              </div>
                              <p className="font-display font-bold text-sm text-amber-300 mt-0.5">
                                {sInfo.sub}
                              </p>
                            </div>
                            <div
                              className={`w-10 h-10 rounded-xl font-display font-black text-lg flex items-center justify-center shrink-0 ${badgeColor}`}
                            >
                              {iconSymbol}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playTap();
                          setWizardStep(2);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-purple-900/60 border border-purple-600 text-purple-200 font-bold text-xs sm:text-sm"
                      >
                        {t.wizard.backBtn}
                      </button>
                      <button
                        type="button"
                        data-testid="wizard-step3-next-btn"
                        onClick={() => {
                          soundEngine.playTap();
                          setWizardStep(4);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 font-display font-black text-xs sm:text-sm"
                      >
                        {t.wizard.nextBtn}
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================== WIZARD STEP 4: COMPLEXITY LEVEL & START THE SHOW! ==================== */}
                {wizardStep === 4 && (
                  <div data-testid="wizard-step-4" className="space-y-5 animate-fadeIn">
                    {/* Summary Chips of Selected Player, Activity, and Math Power */}
                    <div className="flex flex-wrap items-center gap-2 bg-purple-950/60 border border-purple-700/50 rounded-2xl p-3">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="px-3 py-1 rounded-xl bg-pink-500/20 border border-pink-400/50 text-pink-200 text-xs font-extrabold flex items-center gap-1.5"
                      >
                        <HunterAvatar hunter={hunter} size={22} />
                        <span>
                          {activeProfile?.name || playerNameInput || t.hunters[hunter].name} (
                          {t.hunters[hunter].name})
                        </span>
                      </button>
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="px-3 py-1 rounded-xl bg-purple-900/80 border border-purple-500/50 text-amber-200 text-xs font-extrabold"
                      >
                        {t.modes[mode].title}
                      </button>
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                      <button
                        type="button"
                        onClick={() => setWizardStep(3)}
                        className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-extrabold"
                      >
                        {t.skills[skill].name} ({t.skills[skill].sub})
                      </button>
                    </div>

                    <div>
                      <h2 className="font-display font-black text-xl sm:text-2xl text-amber-300">
                        {t.wizard.step4Title}
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-200 mt-0.5">
                        {t.wizard.step4Subtitle}
                      </p>
                    </div>

                    {/* Kid-Friendly Complexity Level Cards (Easy / Medium / Challenging) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(
                        [
                          { size: 4 as SealSize, info: t.wizard.complexity.s4 },
                          { size: 5 as SealSize, info: t.wizard.complexity.s5 },
                          { size: 6 as SealSize, info: t.wizard.complexity.s6 },
                        ] as const
                      ).map((item) => {
                        const active = sealSize === item.size;
                        return (
                          <button
                            key={item.size}
                            type="button"
                            data-testid={`select-complexity-${item.size}`}
                            onClick={() => {
                              soundEngine.playTap();
                              setSealSize(item.size);
                              syncActiveProfileStage(mode, skill, item.size, hunter, false);
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                              active
                                ? 'bg-gradient-to-b from-amber-400/30 to-fuchsia-700/40 border-amber-300 text-white scale-[1.02] shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                                : 'bg-purple-900/30 border-purple-700/40 text-purple-200 hover:border-purple-500'
                            }`}
                          >
                            <div>
                              <span className="inline-block text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 mb-2">
                                {item.info.badge}
                              </span>
                              <div className="font-display font-black text-lg text-white">
                                {item.info.title}
                              </div>
                              <p className="text-xs text-purple-200/85 mt-1 leading-relaxed">
                                {item.info.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Optional 2-Player Handicap Setup when Co-op or Versus is selected */}
                    {(mode === 'coopDuet' || mode === 'versusBattle') && (
                      <section className="bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-fuchsia-950/80 border-2 border-cyan-400/50 rounded-3xl p-4">
                        <h3 className="font-display font-black text-sm sm:text-base text-cyan-300 mb-1 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {t.twoPlayerSetupTitle}
                        </h3>
                        <p className="text-xs text-purple-200 mb-3">{t.fairHandicapNote}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-purple-900/40 rounded-2xl p-3 border border-pink-400/40">
                            <div className="text-xs font-extrabold text-pink-300 mb-1">
                              {t.daughterSkillLabel}
                            </div>
                            <div className="text-sm font-black text-white">
                              {t.skills[skill].name} • {t.orbsCount(sealSize)}
                            </div>
                          </div>
                          <div className="bg-slate-900/60 rounded-2xl p-3 border border-cyan-400/40 flex flex-col gap-2">
                            <div className="text-xs font-extrabold text-cyan-300">
                              {t.parentSkillLabel}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {SKILL_ORDER.map((ps) => (
                                <button
                                  key={ps}
                                  type="button"
                                  onClick={() => setParentSkill(ps)}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                                    parentSkill === ps
                                      ? 'bg-cyan-400 text-slate-950 border-white font-black'
                                      : 'bg-slate-800 text-cyan-200 border-cyan-500/30'
                                  }`}
                                >
                                  {t.skills[ps].name}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {([4, 5, 6] as SealSize[]).map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setParentSize(sz)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                    parentSize === sz
                                      ? 'bg-amber-400 text-slate-950 border-white font-black'
                                      : 'bg-slate-800 text-slate-300 border-slate-600'
                                  }`}
                                >
                                  {t.orbsCount(sz)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Big Launch Concert Button — Immediately Visible on Step 4! */}
                    <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playTap();
                          setWizardStep(3);
                        }}
                        className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-purple-900/60 border border-purple-600 text-purple-200 font-bold text-sm"
                      >
                        {t.wizard.backBtn}
                      </button>

                      <button
                        type="button"
                        data-testid="start-show-btn"
                        onClick={startGame}
                        className="w-full sm:flex-1 max-w-xl px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 text-slate-950 font-display font-black text-xl sm:text-2xl tracking-wide shadow-[0_0_35px_rgba(236,72,153,0.65)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <Play className="w-6 h-6 fill-slate-950" />
                        {t.startShowBtn}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== PLAYING SCREEN ==================== */}
        {!showTangArcade && screen === 'playing' && (
          <div className="space-y-3.5 animate-fadeIn">
            {mode === 'versusBattle' ? (
              <VersusBattleBoard
                daughterSkill={skill}
                daughterSize={sealSize}
                daughterHunter={hunter}
                parentSkill={parentSkill}
                parentSize={parentSize}
                t={t}
                lang={lang}
                onDaughterMiss={(puz) => {
                  setTotalTaps((prev) => prev + 1);
                  recordChildMiss(puz);
                }}
                onDaughterSolve={(puz) => {
                  setTotalTaps((prev) => prev + 1);
                  setCorrectTaps((prev) => prev + 1);
                  recordChildSolve(puz);
                }}
                onFinishMatch={(winner, dScore, pScore) => {
                  setVersusResult({ winner, dScore, pScore });
                  updateProgress((prev) => ({
                    ...prev,
                    xp: prev.xp + 250,
                    gems: prev.gems + 35,
                  }));
                  completeStageAndShowSummary();
                }}
              />
            ) : (
              <>
                {/* Top HUD Bar: Hunter + Honmoon Charge + Boss HP + Score/Streak/Timer */}
                <div className="bg-purple-950/65 border border-fuchsia-500/35 rounded-3xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <HunterAvatar hunter={hunter} size={52} animate={false} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-sm sm:text-base text-amber-300">
                          {mode === 'coopDuet'
                            ? coopTurn === 'daughter'
                              ? t.turnDaughter
                              : t.turnParent
                            : t.hunters[hunter].name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 font-bold">
                          {
                            t.skills[
                              mode === 'coopDuet' && coopTurn === 'parent'
                                ? parentSkill
                                : skill
                            ].name
                          }
                        </span>
                      </div>

                      {/* Honmoon Golden Barrier Charge Bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[11px] font-bold text-purple-200">
                          {t.honmoonCharge}:
                        </span>
                        <div className="w-28 sm:w-44 h-3 bg-purple-950 rounded-full overflow-hidden border border-purple-600/50 p-0.5">
                          <div
                            style={{ width: `${progressPercent}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-amber-300 transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center: Score, Streak & Timer */}
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase text-purple-300">
                        {t.scoreLabel}
                      </div>
                      <div className="font-display font-black text-lg sm:text-2xl text-amber-300">
                        {score}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase text-purple-300">
                        {t.streakLabel}
                      </div>
                      <div
                        className={`font-display font-black text-lg sm:text-2xl flex items-center justify-center gap-0.5 ${
                          isGoldenCombo
                            ? 'text-amber-300 scale-110 animate-pulse'
                            : 'text-pink-400'
                        }`}
                      >
                        <Flame className="w-4 h-4 fill-current" />
                        {streak}x
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase text-purple-300">
                        {mode === 'timedRush' ? t.timeRemaining : t.elapsedTime}
                      </div>
                      <div
                        className={`font-display font-black text-lg sm:text-2xl flex items-center gap-1 ${
                          mode === 'timedRush' && timeLeft <= 10
                            ? 'text-rose-400 animate-pulse'
                            : 'text-cyan-300'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        {mode === 'timedRush' ? `${timeLeft}s` : `${elapsedSeconds}s`}
                      </div>
                    </div>
                  </div>

                  {/* Right: Saja Boys / Gwi-Ma Boss Status */}
                  <div className="hidden md:flex items-center gap-2.5 bg-purple-900/40 px-3 py-1.5 rounded-2xl border border-rose-500/30">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-rose-300">
                        {t.demonBossName}
                      </div>
                      <div className="text-[10px] text-purple-200">{t.sajaBoysStatus}</div>
                    </div>
                    <SajaDemonBoss hpPercent={100 - progressPercent} hitFlash={bossHitFlash} />
                  </div>
                </div>

                {/* Golden Fever Mode Concert Lightsticks Banner */}
                {isGoldenCombo && (
                  <div className="bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-pink-500/25 border-2 border-amber-300 rounded-2xl py-1.5 px-4 flex items-center justify-center gap-3 font-display font-black text-xs sm:text-sm text-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.45)]">
                    <span className="inline-block animate-lightstick text-lg">🪄</span>
                    <span>{t.goldenModeActive}</span>
                    <span className="inline-block animate-lightstick text-lg">🪄</span>
                  </div>
                )}

                {/* Clear Rule Instruction Banner */}
                <div className="text-center">
                  <div className="inline-block bg-purple-900/60 border border-fuchsia-400/50 rounded-2xl px-5 py-2 font-display font-bold text-base sm:text-xl text-white shadow">
                    {mode === 'honmoonChain' && activeOuterIndex === -1
                      ? activePuzzle.operation === '×'
                        ? t.masterSealBannerMult
                        : activePuzzle.operation === '÷'
                        ? t.masterSealBannerDiv
                        : activePuzzle.operation === '−'
                        ? t.masterSealBannerSub
                        : t.masterSealBannerAdd
                      : activePuzzle.fractionData
                      ? t.ruleBannerFrac
                      : activePuzzle.operation === '×'
                      ? t.ruleBannerMult
                      : activePuzzle.operation === '÷'
                      ? t.ruleBannerDiv
                      : activePuzzle.operation === '−'
                      ? t.ruleBannerSub
                      : t.ruleBannerAdd}
                  </div>
                </div>

                {/* Puzzle Arena */}
                <div className="py-1">
                  {mode === 'honmoonChain' && chainPuzzle ? (
                    <HonmoonChainBoard
                      chain={chainPuzzle}
                      solvedOuterIndices={solvedOuterIndices}
                      solvedOuterEquations={solvedOuterEquations}
                      activeOuterIndex={activeOuterIndex}
                      onSelectOuterIndex={(idx) => {
                        soundEngine.playTap();
                        setActiveOuterIndex(idx);
                        setHintLevel(0);
                        setEliminatedNumbers([]);
                      }}
                      onSelectNumber={handleSelectNumber}
                      hintLevel={hintLevel}
                      wrongNumber={wrongNumber}
                      activeSolvedEquation={solvedEquation}
                      mathTrickMessage={mathTrickMessage}
                      onCloseSolved={handleAdvanceAfterSolve}
                      lang={lang}
                      eliminatedNumbers={eliminatedNumbers}
                      floatingBanner={floatingBanner}
                      isGoldenMode={isGoldenCombo}
                      t={t}
                    />
                  ) : (
                    <HonmoonSeal
                      puzzle={currentPuzzle}
                      onSelectNumber={handleSelectNumber}
                      hintLevel={hintLevel}
                      wrongNumber={wrongNumber}
                      solvedEquation={solvedEquation}
                      mathTrickMessage={mathTrickMessage}
                      onCloseSolved={handleAdvanceAfterSolve}
                      lang={lang}
                      eliminatedNumbers={eliminatedNumbers}
                      floatingBanner={floatingBanner}
                      isGoldenMode={isGoldenCombo}
                      accentColor={
                        mode === 'coopDuet' && coopTurn === 'parent' ? 'cyan' : 'purple'
                      }
                      label={`${puzzlesSolved + 1}/${
                        mode === 'timedRush' ? '∞' : targetSealsForRound
                      }`}
                    />
                  )}
                </div>

                {/* Interactive Visual Number-Sense X-Ray (Fact-Family Bond Triangle + 10-Frame / Array / Number Line / Fraction Bars) */}
                {showXRay && (
                  <NumberSenseXRay
                    puzzle={activePuzzle}
                    lang={lang}
                    isSolved={Boolean(solvedEquation)}
                  />
                )}

                {/* Bottom Coaching & Idol Superpowers Bar */}
                <div className="max-w-3xl mx-auto bg-gradient-to-r from-sky-950/80 via-purple-950/85 to-indigo-950/80 border-2 border-sky-400/50 rounded-3xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-lg">
                  <div className="flex items-center gap-3">
                    <DerpyTigerMascot size={46} excited={Boolean(solvedEquation)} />
                    <p className="font-display font-bold text-sm sm:text-base text-sky-100 leading-snug">
                      {coachMessage || t.derpyReady}
                    </p>
                  </div>

                  {/* Three Kid-Friendly Superpower Buttons: X-Ray Vision, Weapon Slash & Derpy Hint */}
                  <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid="xray-toggle-btn"
                      onClick={() => {
                        soundEngine.playTap();
                        setShowXRay((prev) => !prev);
                      }}
                      className={`px-3.5 py-2 rounded-2xl font-display font-bold text-sm flex items-center gap-1.5 transition-all border ${
                        showXRay
                          ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_16px_rgba(34,211,238,0.75)]'
                          : 'bg-cyan-950/80 text-cyan-200 border-cyan-400/60 hover:bg-cyan-900/80'
                      }`}
                    >
                      <span>{t.xrayToggleBtn}</span>
                    </button>

                    <button
                      type="button"
                      disabled={slashCharges <= 0}
                      onClick={handleWeaponSlash}
                      className={`px-3.5 py-2 rounded-2xl font-display font-bold text-sm flex items-center gap-1.5 transition-all ${
                        slashCharges > 0
                          ? 'keep-white-text bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white border border-pink-300 shadow-[0_0_16px_rgba(236,72,153,0.6)] hover:brightness-110 active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <span>⚔️</span>
                      <span>{`Slash (${slashCharges})`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAskHint}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-display font-bold text-sm shadow-[0_0_18px_rgba(251,191,36,0.5)] hover:brightness-110 active:scale-95 transition-all"
                    >
                      {t.derpyHintBtn}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== SUMMARY / ENCORE SCREEN ==================== */}
        {!showTangArcade && screen === 'summary' && (
          <div className="max-w-2xl mx-auto bg-gradient-to-b from-[#250e4c] to-[#110626] border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] space-y-6 animate-fadeIn">
            <div className="flex justify-center items-center gap-3">
              <HunterAvatar hunter={hunter} size={78} />
              <DerpyTigerMascot size={68} excited />
            </div>

            {/* Level Up Celebration Banner */}
            {leveledUpBanner && (
              <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-pink-500 text-slate-950 rounded-2xl p-3 font-display font-black text-base sm:text-lg shadow-[0_0_30px_rgba(251,191,36,0.9)] animate-bounce">
                {lang === 'nl'
                  ? `🎉 LEVEL UP! Je bent nu Level ${leveledUpBanner} (${levelInfo.title})!`
                  : `🎉 LEVEL UP! You are now Level ${leveledUpBanner} (${levelInfo.title})!`}
              </div>
            )}

            {mode === 'versusBattle' && versusResult ? (
              <>
                <h2 className="font-display font-black text-2xl sm:text-4xl text-amber-300">
                  {versusResult.winner === 'daughter'
                    ? t.versusWinnerDaughter
                    : t.versusWinnerParent}
                </h2>
                <div className="flex justify-center gap-6 text-lg font-black">
                  <div className="bg-pink-500/20 border border-pink-400 rounded-2xl px-5 py-3 text-pink-200">
                    {t.daughterLabel}: {versusResult.dScore}
                  </div>
                  <div className="bg-cyan-500/20 border border-cyan-400 rounded-2xl px-5 py-3 text-cyan-200">
                    {t.parentLabel}: {versusResult.pScore}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300 text-amber-300 text-xs font-black mb-2">
                    <Trophy className="w-4 h-4" />
                    <span>
                      +{sessionXpEarned} XP  •  +{sessionGemsEarned} 💎 GEMS
                    </span>
                  </div>
                  <h2 className="font-display font-black text-2xl sm:text-4xl text-white">
                    {t.encoreTitle}
                  </h2>
                  <p className="text-sm text-purple-200 mt-1">{t.honmoonGoldenMsg}</p>
                </div>

                {/* 3 Golden Idol Stars */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3].map((st) => (
                    <Star
                      key={st}
                      className="w-10 h-10 text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-bounce"
                      style={{ animationDelay: `${st * 120}ms` }}
                    />
                  ))}
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-purple-950/70 border border-purple-700/50 rounded-2xl p-3">
                    <div className="text-xs text-purple-300 font-bold">{t.accuracyLabel}</div>
                    <div className="font-display font-black text-xl sm:text-2xl text-emerald-300 mt-0.5">
                      {sessionAccuracyText}
                    </div>
                  </div>

                  <div className="bg-purple-950/70 border border-purple-700/50 rounded-2xl p-3">
                    <div className="text-xs text-purple-300 font-bold">
                      {t.learn.strategiesPracticedLabel}
                    </div>
                    <div className="font-display font-black text-xl sm:text-2xl text-cyan-300 mt-0.5">
                      {practicedStrategies.length} 💡
                    </div>
                  </div>

                  <div className="bg-purple-950/70 border border-purple-700/50 rounded-2xl p-3">
                    <div className="text-xs text-purple-300 font-bold">{t.bestStreakLabel}</div>
                    <div className="font-display font-black text-xl sm:text-2xl text-pink-400 mt-0.5">
                      {bestStreak}x 🔥
                    </div>
                  </div>
                </div>

                {/* Prompt to Open a Mystery Photocard if she has >= 50 Gems! */}
                {progress.gems >= 50 &&
                  progress.unlockedCards.length < PHOTOCARD_CATALOG.length && (
                    <div className="bg-gradient-to-r from-amber-500/25 via-pink-500/25 to-purple-600/25 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-left">
                        <div className="font-display font-black text-amber-300 text-sm sm:text-base">
                          {lang === 'nl'
                            ? `🎁 Je hebt ${progress.gems} 💎 Starlight Gems!`
                            : `🎁 You have ${progress.gems} 💎 Starlight Gems!`}
                        </div>
                        <div className="text-xs text-purple-100">
                          {lang === 'nl'
                            ? 'Je kunt nu een nieuwe K-Pop Demon Hunters Fotokaart openen!'
                            : 'You can unbox a new K-Pop Demon Hunters Holographic Photocard right now!'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPhotocards(true)}
                        className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-display font-black text-xs sm:text-sm shadow hover:scale-105 transition-transform flex items-center gap-1.5"
                      >
                        <Gift className="w-4 h-4" />
                        <span>
                          {lang === 'nl' ? 'Open Fotokaart! ✨' : 'Unbox Photocard! ✨'}
                        </span>
                      </button>
                    </div>
                  )}
              </>
            )}

            {/* Action Buttons: Primary Auto-Advance Next Stage + Secondary Options */}
            {(() => {
              const nextSt = getNextStage(skill, sealSize);
              const nextStageNum = getStageNumber(nextSt.skill, nextSt.sealSize);
              const nextComplexityTitle =
                nextSt.sealSize === 4
                  ? t.wizard.complexity.s4.title
                  : nextSt.sealSize === 5
                  ? t.wizard.complexity.s5.title
                  : t.wizard.complexity.s6.title;

              return (
                <div className="space-y-3 pt-2">
                  {/* Primary CTA: Auto-Launch Next Stage Immediately */}
                  <button
                    type="button"
                    data-testid="play-next-stage-btn"
                    onClick={() => startGameWithConfig(mode, nextSt.skill, nextSt.sealSize)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 text-slate-950 font-display font-black text-base sm:text-xl shadow-[0_0_30px_rgba(236,72,153,0.65)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-slate-950 shrink-0" />
                    <span>
                      {t.profiles.nextStageAutoBtn(
                        nextStageNum,
                        t.skills[nextSt.skill].name,
                        nextComplexityTitle
                      )}
                    </span>
                  </button>

                  {/* Secondary Actions: Try Another Math Power, Replay Stage, or Dashboard */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      data-testid="summary-try-another-power-btn"
                      onClick={() => {
                        soundEngine.playTap();
                        setSkill(nextSt.skill);
                        setSealSize(nextSt.sealSize);
                        setWizardStep(3);
                        setScreen('menu');
                      }}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 text-cyan-200 font-display font-black text-sm hover:bg-cyan-500/30 transition-all"
                    >
                      {t.profiles.tryAnotherPowerVictoryBtn}
                    </button>

                    <button
                      type="button"
                      onClick={startGame}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-900/70 border border-pink-400/50 text-pink-100 font-display font-bold text-sm hover:bg-purple-800 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t.playAgainBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playTap();
                        setSkill(nextSt.skill);
                        setSealSize(nextSt.sealSize);
                        setWizardStep(0);
                        setScreen('menu');
                      }}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-900/60 border border-purple-600 text-purple-200 font-bold text-sm hover:bg-purple-800 transition-all"
                    >
                      {t.changeSettingsBtn}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Equations Cracked Review List */}
            {!(mode === 'versusBattle' && versusResult) && masteredFacts.length > 0 && (
              <div className="bg-purple-950/50 border border-fuchsia-500/30 rounded-2xl p-4 text-left">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-2">
                  {t.equationsMasteredTitle}
                </div>
                <div className="flex flex-wrap gap-2">
                  {masteredFacts.map((fact, idx) => (
                    <span
                      key={idx}
                      title={fact.trick}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-purple-900 to-fuchsia-900 border border-amber-300/40 text-white font-display font-bold text-xs sm:text-sm"
                    >
                      ✨ {fact.equation}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Learning outcome: what was practiced and what to practice next */}
            <div
              data-testid="summary-learning-panel"
              className="bg-cyan-950/40 border border-cyan-400/40 rounded-2xl p-4 text-left space-y-2"
            >
              <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                {t.learn.summaryLearningTitle}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-200">
                  {t.accuracyLabel}: {sessionAccuracyText}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-300/40 text-amber-200">
                  🥋 {t.learn.reviewWaitingLabel}: {progress.trickyFacts.length}
                </span>
                {practicedStrategies.map((name) => (
                  <span
                    key={name}
                    className="px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-400/40 text-purple-100"
                  >
                    💡 {name}
                  </span>
                ))}
              </div>
              <div className="text-sm text-white">
                <span className="font-black text-amber-300">{t.learn.nextFocusTitle}</span>{' '}
                {nextFocusFact
                  ? t.learn.nextFocusFact(
                      `${nextFocusFact.aLabel} ${nextFocusFact.op} ${nextFocusFact.bLabel}`
                    )
                  : t.learn.nextFocusSkill(t.skills[skill].name)}
              </div>
              {mode !== 'versusBattle' && masteredFacts.length > 0 && (
                <div className="text-[11px] text-purple-300/80">
                  {t.avgSpeedLabel}: {avgSolveSeconds}s • {t.learn.speedNote}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==================== PROMINENT GREG TANG (KAKOOMA®) & MUSIC CREDIT FOOTER ==================== */}
      <footer className="relative z-10 max-w-5xl mx-auto px-4 pb-6 pt-2">
        {screen === 'playing' ? (
          <div className="text-center text-xs font-bold text-purple-300/70 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>🙏 {t.gregTangCreditBadge} •</span>
            <a
              href="https://tangmath.com/kakooma"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300/90 hover:underline"
            >
              TangMath.com ↗
            </a>
            <span>• 🎵 {lang === 'nl' ? 'Muziek:' : 'Music:'}</span>
            <a
              href="https://www.youtube.com/channel/UCWvrB8eZ18wB5o7QnzMAdcA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-300/90 hover:underline"
            >
              정훈남JHN STUDIO (YouTube) ↗
            </a>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-fuchsia-950/90 border border-amber-300/40 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-300 text-[11px] font-black tracking-wide uppercase">
                <span>🙏</span>
                <span>{t.gregTangCreditBadge}</span>
              </div>
              <h3 className="font-display font-black text-sm sm:text-base text-white">
                {t.gregTangCreditTitle}
              </h3>
              <p className="text-xs text-purple-200/90 leading-relaxed max-w-2xl">
                {t.gregTangCreditText}
              </p>
              <p className="text-xs text-pink-200/90 pt-1">
                🎵 {lang === 'nl' ? 'Muziek door' : 'Music by'}{' '}
                <a
                  href="https://www.youtube.com/channel/UCWvrB8eZ18wB5o7QnzMAdcA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-300 hover:underline"
                >
                  정훈남JHN STUDIO (YouTube) ↗
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <a
                href="https://tangmath.com/kakooma"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-display font-black text-xs sm:text-sm shadow hover:brightness-110 transition-all"
              >
                {t.gregTangVisitLink}
              </a>
            </div>
          </div>
        )}
      </footer>

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        t={t}
      />

      {/* HUNTR/X Number Dojo & Greg Tang Mental Math Academy Modal */}
      {showDojo && (
        <NumberDojoModal
          lang={lang}
          progress={progress}
          onClose={() => setShowDojo(false)}
          onReviewAttempt={(factId, correct) => {
            updateProgress((prev) => {
              const before = prev.factReview[factId] ?? createReviewState();
              const answered = recordReviewAnswer(before, correct);
              // A Dojo review of this fact is also spacing practice for the other waiting facts.
              const factReview = {
                ...advanceOtherReviews(prev.factReview, factId),
                [factId]: answered.state,
              };
              if (!answered.masteredNow) return { ...prev, factReview };
              const claim = claimMasteryReward(answered.state);
              return {
                ...prev,
                xp: prev.xp + (claim.rewardGranted ? MASTERY_XP : 0),
                gems: prev.gems + (claim.rewardGranted ? MASTERY_GEMS : 0),
                conqueredTrickyCount: (prev.conqueredTrickyCount || 0) + 1,
                trickyFacts: prev.trickyFacts.filter((f) => f.id !== factId),
                factReview: { ...factReview, [factId]: claim.state },
              };
            });
          }}
        />
      )}

      {/* Collectible Holographic Photocard Album Modal */}
      <PhotocardModal
        isOpen={showPhotocards}
        onClose={() => setShowPhotocards(false)}
        lang={lang}
        progress={progress}
        onUnlockCard={(cardId, cost) => {
          updateProgress((prev) => ({
            ...prev,
            gems: Math.max(0, prev.gems - cost),
            unlockedCards: prev.unlockedCards.includes(cardId)
              ? prev.unlockedCards
              : [...prev.unlockedCards, cardId],
          }));
        }}
      />

      {/* Multi-Player Profile Manager Modal (Switch, Create, Reset, Delete) */}
      <ProfileManagerModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        lang={lang}
        t={t}
        profiles={profilesStore.profiles}
        activeProfileId={profilesStore.activeProfileId}
        onSelectProfile={handleSelectProfile}
        onCreateNewRequest={() => {
          setShowProfileModal(false);
          setIsCreatingNewProfile(true);
          setPlayerNameInput('');
          setWizardStep(1);
          setScreen('menu');
        }}
        onResetProfile={handleResetProfile}
        onDeleteProfile={handleDeleteProfile}
      />
    </div>
  );
};

export default App;
