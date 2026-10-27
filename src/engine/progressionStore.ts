import type { Language } from '../i18n/translations';
import type { Operation, FractionMeta, SkillId, SealSize } from './kakoomaGenerator';
import { gcd } from './kakoomaGenerator.ts';
import type { FactReviewState } from './learningLoop';
export {
  PHOTOCARD_CATALOG,
  RARITY_COSTS,
  type PhotocardItem,
  type PhotocardRarity,
  type PhotocardCategory,
} from './photocardCatalog.ts';

export type ProfileHunterId = 'rumi' | 'mira' | 'zoey';
export type SchoolGroupId = 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8';

export type ProfileGameMode =
  | 'soloPractice'
  | 'honmoonChain'
  | 'timedRush'
  | 'coopDuet'
  | 'versusBattle';

export const STAGE_SKILL_ORDER: SkillId[] = [
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

export interface TrickyFactItem {
  id: string;
  aLabel: string;
  bLabel: string;
  targetLabel: string;
  op: Operation;
  choices: string[];
  hintNl: string;
  hintEn: string;
}

export const DEFAULT_STARTER_TRICKY_FACTS: TrickyFactItem[] = [
  {
    id: '7×8=56',
    aLabel: '7',
    bLabel: '8',
    targetLabel: '56',
    op: '×',
    choices: ['48', '54', '56', '64'],
    hintNl: 'Ezelsbruggetje: 5, 6, 7, 8 → 56 = 7 × 8! Of: (5 × 8 = 40) + (2 × 8 = 16) = 56.',
    hintEn: 'Memory trick: 5, 6, 7, 8 → 56 = 7 × 8! Or: (5 × 8 = 40) + (2 × 8 = 16) = 56.',
  },
  {
    id: '15−8=7',
    aLabel: '15',
    bLabel: '8',
    targetLabel: '7',
    op: '−',
    choices: ['6', '7', '8', '9'],
    hintNl: 'Via de 10: van 8 naar 10 is +2, en van 10 naar 15 is +5. Samen 2 + 5 = 7!',
    hintEn: 'Bridge through 10: from 8 to 10 is +2, and from 10 to 15 is +5. Together 2 + 5 = 7!',
  },
  {
    id: '54÷6=9',
    aLabel: '54',
    bLabel: '6',
    targetLabel: '9',
    op: '÷',
    choices: ['7', '8', '9', '6'],
    hintNl: 'Omkeer-truc: 10 × 6 = 60, dus 9 × 6 = 54! Daarom is 54 ÷ 6 = 9.',
    hintEn: 'Inverse trick: 10 × 6 = 60, so 9 × 6 = 54! That means 54 ÷ 6 = 9.',
  },
  {
    id: '1/4+1/2=3/4',
    aLabel: '1/4',
    bLabel: '1/2',
    targetLabel: '3/4',
    op: '+',
    choices: ['2/4', '3/4', '2/6', '1/4'],
    hintNl: '1/2 (een halve taart) is precies hetzelfde als 2/4 (twee kwarten). 1/4 + 2/4 = 3/4!',
    hintEn: '1/2 (half a pie) is the exact same size as 2/4 (two quarters). 1/4 + 2/4 = 3/4!',
  },
];

export interface PlayerProgress {
  xp: number;
  gems: number;
  totalSolved: number;
  unlockedCards: string[];
  bestSpeedMs: number | null;
  trickyFacts: TrickyFactItem[];
  factReview: Record<string, FactReviewState>;
  conqueredTrickyCount: number;
  /** Highest Clock Quest level the player may start (1-based). */
  clockLevelUnlocked: number;
  /** Best stars (1–3) per Clock Quest level id. */
  clockStars: Record<string, number>;
}

function dueReviewState(): FactReviewState {
  return { consecutiveCorrect: 0, promptsUntilReview: 0, mastered: false, rewardClaimed: false };
}

function isTrickyFact(value: unknown): value is TrickyFactItem {
  if (!value || typeof value !== 'object') return false;
  const fact = value as Record<string, unknown>;
  return (
    typeof fact.id === 'string' &&
    typeof fact.aLabel === 'string' &&
    typeof fact.bLabel === 'string' &&
    typeof fact.targetLabel === 'string' &&
    Array.isArray(fact.choices)
  );
}

function normalizeReviewState(value: unknown): FactReviewState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as Record<string, unknown>;
  const toCount = (n: unknown) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  return {
    consecutiveCorrect: toCount(state.consecutiveCorrect),
    promptsUntilReview: toCount(state.promptsUntilReview),
    mastered: state.mastered === true,
    rewardClaimed: state.rewardClaimed === true,
  };
}

function normalizeFactReview(
  value: unknown,
  facts: TrickyFactItem[]
): Record<string, FactReviewState> {
  const result: Record<string, FactReviewState> = {};
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
      const state = normalizeReviewState(raw);
      if (state) result[id] = state;
    }
  }
  // Every fact still waiting in the queue needs an open (unmastered) review state.
  for (const fact of facts) {
    const existing = result[fact.id];
    if (!existing) {
      result[fact.id] = dueReviewState();
    } else if (existing.mastered) {
      result[fact.id] = { ...existing, mastered: false, consecutiveCorrect: 0 };
    }
  }
  return result;
}

const STORAGE_KEY = 'huntrx_progress_v2';
export const PROFILES_STORAGE_KEY = 'huntrx_profiles_v3';

export interface PlayerProfile {
  id: string;
  name: string;
  hunter: ProfileHunterId;
  schoolGroup?: SchoolGroupId;
  mode: ProfileGameMode;
  skill: SkillId;
  sealSize: SealSize;
  stagesCleared: number;
  createdAt: number;
  lastPlayedAt: number;
  progress: PlayerProgress;
}

export interface ProfilesStore {
  activeProfileId: string | null;
  profiles: PlayerProfile[];
}

export function createDefaultProgress(): PlayerProgress {
  return {
    xp: 0,
    gems: 120, // Start with 120 gems so she can unlock her first 100-gem photocard right away!
    totalSolved: 0,
    unlockedCards: ['card_derpy_tiger'],
    bestSpeedMs: null,
    trickyFacts: DEFAULT_STARTER_TRICKY_FACTS,
    factReview: Object.fromEntries(
      DEFAULT_STARTER_TRICKY_FACTS.map((fact) => [fact.id, dueReviewState()])
    ),
    conqueredTrickyCount: 0,
    clockLevelUnlocked: 1,
    clockStars: {},
  };
}

function normalizeClockStars(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [id, stars] of Object.entries(value as Record<string, unknown>)) {
      if (typeof stars === 'number' && stars >= 1) result[id] = Math.min(3, Math.floor(stars));
    }
  }
  return result;
}

function normalizeProgress(raw: unknown): PlayerProgress {
  if (!raw || typeof raw !== 'object') return createDefaultProgress();
  const parsed = raw as Record<string, unknown>;
  const trickyFacts: TrickyFactItem[] = Array.isArray(parsed.trickyFacts)
    ? parsed.trickyFacts.filter(isTrickyFact)
    : [];
  return {
    xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
    gems: typeof parsed.gems === 'number' ? parsed.gems : 50,
    totalSolved: typeof parsed.totalSolved === 'number' ? parsed.totalSolved : 0,
    unlockedCards: Array.isArray(parsed.unlockedCards)
      ? (parsed.unlockedCards as string[])
      : ['card_derpy_tiger'],
    bestSpeedMs: typeof parsed.bestSpeedMs === 'number' ? parsed.bestSpeedMs : null,
    trickyFacts,
    factReview: normalizeFactReview(parsed.factReview, trickyFacts),
    conqueredTrickyCount:
      typeof parsed.conqueredTrickyCount === 'number' ? parsed.conqueredTrickyCount : 0,
    clockLevelUnlocked:
      typeof parsed.clockLevelUnlocked === 'number' && parsed.clockLevelUnlocked >= 1
        ? Math.floor(parsed.clockLevelUnlocked)
        : 1,
    clockStars: normalizeClockStars(parsed.clockStars),
  };
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeProgress(JSON.parse(raw));
    }
  } catch {
    // ignore storage errors
  }
  return createDefaultProgress();
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

export function getStageNumber(skill: SkillId, sealSize: SealSize): number {
  const skillIdx = Math.max(0, STAGE_SKILL_ORDER.indexOf(skill));
  const sizeOffset = sealSize === 4 ? 1 : sealSize === 5 ? 2 : 3;
  return skillIdx * 3 + sizeOffset;
}

export function getNextStage(
  skill: SkillId,
  sealSize: SealSize
): { skill: SkillId; sealSize: SealSize; isFinalStage: boolean } {
  if (sealSize === 4) {
    return { skill, sealSize: 5, isFinalStage: false };
  }
  if (sealSize === 5) {
    return { skill, sealSize: 6, isFinalStage: false };
  }
  const currentIdx = STAGE_SKILL_ORDER.indexOf(skill);
  if (currentIdx >= 0 && currentIdx < STAGE_SKILL_ORDER.length - 1) {
    return {
      skill: STAGE_SKILL_ORDER[currentIdx + 1],
      sealSize: 4,
      isFinalStage: false,
    };
  }
  return { skill: 'mixBoss', sealSize: 6, isFinalStage: true };
}

export function loadProfilesStore(): ProfilesStore {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.profiles)) {
        const profiles: PlayerProfile[] = parsed.profiles
          .filter((p: unknown) => p && typeof p === 'object')
          .map((p: Record<string, unknown>) => ({
            id: typeof p.id === 'string' ? p.id : `hunter_${Date.now()}`,
            name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Hunter',
            hunter:
              p.hunter === 'rumi' || p.hunter === 'mira' || p.hunter === 'zoey'
                ? p.hunter
                : 'rumi',
            schoolGroup:
              p.schoolGroup === 'g3' ||
              p.schoolGroup === 'g4' ||
              p.schoolGroup === 'g5' ||
              p.schoolGroup === 'g6' ||
              p.schoolGroup === 'g7' ||
              p.schoolGroup === 'g8'
                ? p.schoolGroup
                : undefined,
            mode:
              p.mode === 'soloPractice' ||
              p.mode === 'honmoonChain' ||
              p.mode === 'timedRush' ||
              p.mode === 'coopDuet' ||
              p.mode === 'versusBattle'
                ? p.mode
                : 'soloPractice',
            skill:
              typeof p.skill === 'string' && STAGE_SKILL_ORDER.includes(p.skill as SkillId)
                ? (p.skill as SkillId)
                : 'add10',
            sealSize: p.sealSize === 4 || p.sealSize === 5 || p.sealSize === 6 ? p.sealSize : 4,
            stagesCleared: typeof p.stagesCleared === 'number' ? p.stagesCleared : 0,
            createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
            lastPlayedAt: typeof p.lastPlayedAt === 'number' ? p.lastPlayedAt : Date.now(),
            progress: normalizeProgress(p.progress),
          }));

        const activeProfileId =
          typeof parsed.activeProfileId === 'string' &&
          profiles.some((p) => p.id === parsed.activeProfileId)
            ? parsed.activeProfileId
            : profiles[0]?.id ?? null;

        return { activeProfileId, profiles };
      }
    }

    // Check legacy v2 storage for seamless migration if the player already played
    const legacyRaw = localStorage.getItem(STORAGE_KEY);
    if (legacyRaw) {
      const legacyProgress = normalizeProgress(JSON.parse(legacyRaw));
      if (
        legacyProgress.xp > 0 ||
        legacyProgress.totalSolved > 0 ||
        legacyProgress.unlockedCards.length > 1
      ) {
        const migratedSkill: SkillId =
          legacyProgress.totalSolved >= 40
            ? 'multEasy'
            : legacyProgress.totalSolved >= 20
            ? 'add20'
            : 'add10';
        const migratedProfile: PlayerProfile = {
          id: 'hunter_migrated_1',
          name: 'Rumi Star',
          hunter: 'rumi',
          mode: 'soloPractice',
          skill: migratedSkill,
          sealSize: 4,
          stagesCleared: Math.floor(legacyProgress.totalSolved / 8),
          createdAt: Date.now(),
          lastPlayedAt: Date.now(),
          progress: legacyProgress,
        };
        const migratedStore: ProfilesStore = {
          activeProfileId: migratedProfile.id,
          profiles: [migratedProfile],
        };
        saveProfilesStore(migratedStore);
        return migratedStore;
      }
    }
  } catch {
    // ignore storage errors
  }

  return { activeProfileId: null, profiles: [] };
}

export function saveProfilesStore(store: ProfilesStore): void {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(store));
    const active = store.profiles.find((p) => p.id === store.activeProfileId);
    if (active) {
      saveProgress(active.progress);
    }
  } catch {
    // ignore storage errors
  }
}

export function createPlayerProfile(
  store: ProfilesStore,
  name: string,
  hunter: ProfileHunterId,
  schoolGroup?: SchoolGroupId,
  initialSkill: SkillId = 'add10'
): ProfilesStore {
  const cleanName =
    name.trim() || (hunter === 'rumi' ? 'Rumi' : hunter === 'mira' ? 'Mira' : 'Zoey');
  const newProfile: PlayerProfile = {
    id: `hunter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    hunter,
    schoolGroup,
    mode: 'soloPractice',
    skill: initialSkill,
    sealSize: 4,
    stagesCleared: 0,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    progress: createDefaultProgress(),
  };
  const next: ProfilesStore = {
    activeProfileId: newProfile.id,
    profiles: [...store.profiles, newProfile],
  };
  saveProfilesStore(next);
  return next;
}

export function switchPlayerProfile(store: ProfilesStore, profileId: string): ProfilesStore {
  if (!store.profiles.some((p) => p.id === profileId)) return store;
  const next: ProfilesStore = {
    activeProfileId: profileId,
    profiles: store.profiles.map((p) =>
      p.id === profileId ? { ...p, lastPlayedAt: Date.now() } : p
    ),
  };
  saveProfilesStore(next);
  return next;
}

export function resetPlayerProfileProgress(
  store: ProfilesStore,
  profileId: string
): ProfilesStore {
  const next: ProfilesStore = {
    ...store,
    profiles: store.profiles.map((p) =>
      p.id === profileId
        ? {
            ...p,
            mode: 'soloPractice',
            skill: 'add10',
            sealSize: 4,
            stagesCleared: 0,
            lastPlayedAt: Date.now(),
            progress: createDefaultProgress(),
          }
        : p
    ),
  };
  saveProfilesStore(next);
  return next;
}

export function deletePlayerProfile(store: ProfilesStore, profileId: string): ProfilesStore {
  const remaining = store.profiles.filter((p) => p.id !== profileId);
  const nextActiveId =
    store.activeProfileId === profileId ? remaining[0]?.id ?? null : store.activeProfileId;
  const next: ProfilesStore = {
    activeProfileId: nextActiveId,
    profiles: remaining,
  };
  saveProfilesStore(next);
  return next;
}

export function getLevelInfo(xp: number, lang: Language) {
  const xpPerLevel = 500;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  const progressPct = Math.min(100, Math.round((currentLevelXp / xpPerLevel) * 100));

  const titlesNl = [
    'Trainee Hunter',
    'Rookie Idol',
    'Neon Vocalist',
    'Rhythm Star',
    'Honmoon Beschermer',
    'Saja Boys Verslinder',
    'Golden Superstar',
    'HUNTR/X Legende',
  ];
  const titlesEn = [
    'Trainee Hunter',
    'Rookie Idol',
    'Neon Vocalist',
    'Rhythm Star',
    'Honmoon Guardian',
    'Saja Boys Slayer',
    'Golden Superstar',
    'HUNTR/X Legend',
  ];

  const idx = Math.min(level - 1, titlesNl.length - 1);
  return {
    level,
    title: lang === 'nl' ? titlesNl[idx] : titlesEn[idx],
    currentLevelXp,
    xpPerLevel,
    progressPct,
  };
}

export type SpeedTierId = 'lightning' | 'fast' | 'steady' | 'careful';

export interface SpeedGemReward {
  tier: SpeedTierId;
  gems: number;
  xp: number;
  points: number;
  secondsDisplay: string;
  badge: { nl: string; en: string };
}

/**
 * Calculates Gem, XP, and Point rewards based on solve speed (`timeMs`) and whether
 * a hint or wrong attempt occurred on the current question (`hadPenalty`).
 * - Lightning (<= 3.5s, clean): +8 Gems, +35 XP, +140 pts
 * - Fast (<= 7.0s, clean): +5 Gems, +28 XP, +110 pts
 * - Steady (<= 14.0s, clean): +3 Gems, +20 XP, +85 pts
 * - Careful / Slow (> 14.0s or had hint/miss): +1 Gem, +15 XP, +60 pts
 */
export function calculateSpeedGemReward(
  timeMs: number,
  hadPenalty = false
): SpeedGemReward {
  const safeMs = Math.max(100, Number.isFinite(timeMs) ? timeMs : 15000);
  const secondsDisplay = `${(safeMs / 1000).toFixed(1)}s`;

  if (hadPenalty || safeMs > 14000) {
    return {
      tier: 'careful',
      gems: 1,
      xp: 15,
      points: 60,
      secondsDisplay,
      badge: {
        nl: `🐢 Rustig tempo (${secondsDisplay})`,
        en: `🐢 Careful pace (${secondsDisplay})`,
      },
    };
  }

  if (safeMs <= 3500) {
    return {
      tier: 'lightning',
      gems: 8,
      xp: 35,
      points: 140,
      secondsDisplay,
      badge: {
        nl: `⚡ Bliksem-snel! (${secondsDisplay})`,
        en: `⚡ Lightning fast! (${secondsDisplay})`,
      },
    };
  }

  if (safeMs <= 7000) {
    return {
      tier: 'fast',
      gems: 5,
      xp: 28,
      points: 110,
      secondsDisplay,
      badge: {
        nl: `🔥 Vlot gerekend! (${secondsDisplay})`,
        en: `🔥 Fast solve! (${secondsDisplay})`,
      },
    };
  }

  return {
    tier: 'steady',
    gems: 3,
    xp: 20,
    points: 85,
    secondsDisplay,
    badge: {
      nl: `✨ Goed tempo (${secondsDisplay})`,
      en: `✨ Steady pace (${secondsDisplay})`,
    },
  };
}

/**
 * Generates a kid-friendly mental math strategy ("Slimme Reken-Truc!")
 * that explains HOW to compute a + b, a − b, a × b, or fractions quickly in your head!
 */
export function getSmartMathTrick(
  a: number,
  b: number,
  target: number,
  op: Operation,
  lang: Language,
  fractionData?: FractionMeta
): string {
  // 0. Fraction Mental Math Tricks!
  if (fractionData) {
    const den = fractionData.denominator;
    if (!fractionData.simplify) {
      return lang === 'nl'
        ? `💡 Breuken-Truc: De onderkant (noemer ${den}) blijft gelijk! Tel alleen de bovenkanten op: ${a} + ${b} = ${target} → ${target}/${den}!`
        : `💡 Fraction Trick: The bottom denominator (${den}) stays the same! Just add the top numerators: ${a} + ${b} = ${target} → ${target}/${den}!`;
    } else {
      const ga = gcd(a, den);
      const gb = gcd(b, den);
      const gt = gcd(target, den);
      const fa = `${a / ga}/${den / ga}`;
      const fb = `${b / gb}/${den / gb}`;
      const ft = `${target / gt}/${den / gt}`;
      return lang === 'nl'
        ? `💡 Gelijknamig Maken (noemer ${den}): ${fa} = ${a}/${den} en ${fb} = ${b}/${den}. Samen ${a}/${den} + ${b}/${den} = ${target}/${den} (${ft})!`
        : `💡 Common Denominator (${den}): ${fa} = ${a}/${den} and ${fb} = ${b}/${den}. Together ${a}/${den} + ${b}/${den} = ${target}/${den} (${ft})!`;
    }
  }

  // 1. Subtraction ('−') Mental Math Tricks! (Here a is minuend, b is subtrahend, target = a - b)
  if (op === '−') {
    const minuend = Math.max(a, b);
    const subtrahend = Math.min(a, b);
    const diff = minuend - subtrahend;

    // Close numbers -> Count UP! (Aanvul-truc: e.g. 15 - 12 = 3 or 42 - 38 = 4)
    if (diff <= 5 || subtrahend > minuend * 0.65) {
      return lang === 'nl'
        ? `💡 Aanvul-Truc: Tel omhoog van ${subtrahend} naar ${minuend} (${subtrahend} + ${diff} = ${minuend}) → het verschil is ${diff}!`
        : `💡 Count-Up Trick: Count up from ${subtrahend} to ${minuend} (${subtrahend} + ${diff} = ${minuend}) → the difference is ${diff}!`;
    }

    // Bridging back through 10 (Via de 10 terug: e.g. 14 - 6 -> 14 - 4 = 10, 10 - 2 = 8)
    if (minuend > 10 && minuend < 20 && subtrahend > minuend - 10) {
      const stepTo10 = minuend - 10;
      const rest = subtrahend - stepTo10;
      return lang === 'nl'
        ? `💡 Via de 10 Terug: Eerst ${minuend} − ${stepTo10} = 10, en dan 10 − ${rest} = ${diff}!`
        : `💡 Bridge Back via 10: First ${minuend} − ${stepTo10} = 10, then 10 − ${rest} = ${diff}!`;
    }

    // Fact Family (Sommenfamilie: e.g. 25 - 10 = 15 because 15 + 10 = 25)
    return lang === 'nl'
      ? `💡 Omkeer-Truc: Omdat ${subtrahend} + ${diff} = ${minuend}, weet je meteen dat ${minuend} − ${subtrahend} = ${diff}!`
      : `💡 Fact-Family Trick: Since ${subtrahend} + ${diff} = ${minuend}, you know right away that ${minuend} − ${subtrahend} = ${diff}!`;
  }

  // 2. Division ('÷') Mental Math Tricks! (Here a is dividend, b is divisor, target = a / b)
  if (op === '÷') {
    const dividend = Math.max(a, b);
    const divisor = Math.min(a, b);
    const quotient = Math.round(dividend / divisor);

    if (divisor === 2) {
      return lang === 'nl'
        ? `💡 Halveer-Truc: Delen door 2 is gewoon de helft nemen! De helft van ${dividend} is ${quotient}!`
        : `💡 Halving Trick: Dividing by 2 is just taking half! Half of ${dividend} is ${quotient}!`;
    }
    if (divisor === 4) {
      const half1 = dividend / 2;
      return lang === 'nl'
        ? `💡 Dubbel-Halveren (÷4): De helft van ${dividend} is ${half1}, en de helft van ${half1} is ${quotient}!`
        : `💡 Half-Half Trick (÷4): Half of ${dividend} is ${half1}, and half of ${half1} is ${quotient}!`;
    }
    if (divisor === 5) {
      return lang === 'nl'
        ? `💡 Vijf-Deeltruc: Omdat ${quotient} × 5 = ${dividend}, is ${dividend} ÷ 5 = ${quotient}!`
        : `💡 Divide-by-5 Trick: Since ${quotient} × 5 = ${dividend}, ${dividend} ÷ 5 = ${quotient}!`;
    }
    return lang === 'nl'
      ? `💡 Tafel-Omkeertruc: Denk aan de tafel van ${divisor}: hoeveel keer ${divisor} is ${dividend}? ${quotient} × ${divisor} = ${dividend} → dus ${quotient}!`
      : `💡 Inverse Table Trick: Think of the ${divisor}× table: what times ${divisor} makes ${dividend}? ${quotient} × ${divisor} = ${dividend} → so ${quotient}!`;
  }

  const min = Math.min(a, b);
  const max = Math.max(a, b);

  if (op === '+') {
    // 1. Doubles (e.g., 6 + 6 = 12)
    if (a === b) {
      return lang === 'nl'
        ? `💡 Dubbel-Kracht: ${a} + ${b} = ${target}!`
        : `💡 Double Power: ${a} + ${b} = ${target}!`;
    }
    // 2. Near-doubles (e.g., 6 + 7 = 6 + 6 + 1 = 13)
    if (max - min === 1 && min >= 4) {
      const dbl = min * 2;
      return lang === 'nl'
        ? `💡 Bijna-Dubbel Truc: ${min} + ${min} = ${dbl}, plus 1 erbij = ${target}!`
        : `💡 Near-Double Trick: ${min} + ${min} = ${dbl}, plus 1 more = ${target}!`;
    }
    // 3. Friends of 10 (Vriendjes van 10)
    if (target === 10) {
      return lang === 'nl'
        ? `💡 Vriendjes van 10! ${min} en ${max} maken samen altijd 10!`
        : `💡 Friends of 10! ${min} and ${max} always bond to make 10!`;
    }
    // 4. Bridging through 10 (Over het tiental: e.g. 8 + 5 -> 8 + 2 = 10, + 3 = 13)
    if (max < 10 && target > 10 && target < 20) {
      const toTen = 10 - max;
      const leftover = min - toTen;
      return lang === 'nl'
        ? `💡 Eerst naar de 10: ${max} + ${toTen} = 10, en dan nog + ${leftover} = ${target}!`
        : `💡 Bridge through 10: ${max} + ${toTen} = 10, plus ${leftover} more = ${target}!`;
    }
    // 5. Bridging through next multiple of 10 for 2-digit numbers
    const nextTen = Math.ceil(max / 10) * 10;
    if (max > 10 && nextTen > max && target > nextTen) {
      const step1 = nextTen - max;
      const step2 = min - step1;
      if (step2 > 0) {
        return lang === 'nl'
          ? `💡 Tiental-Sprong: ${max} + ${step1} = ${nextTen}, plus ${step2} = ${target}!`
          : `💡 Make a 10 Jump: ${max} + ${step1} = ${nextTen}, plus ${step2} = ${target}!`;
      }
    }
    return lang === 'nl'
      ? `💡 Super gevonden: ${min} en ${max} vormen samen ${target}!`
      : `💡 Awesome bond: ${min} and ${max} combine to make ${target}!`;
  } else {
    // Multiplication ('×') tricks!
    // 1. Times 10
    if (max === 10) {
      return lang === 'nl'
        ? `💡 Tafel van 10 Truc: Plak een 0 achter de ${min} → ${target}!`
        : `💡 Times 10 Trick: Just put a 0 after ${min} → ${target}!`;
    }
    // 2. Times 9 (10x minus 1x)
    if (max === 9 || min === 9) {
      const other = max === 9 ? min : max;
      const tenTimes = other * 10;
      return lang === 'nl'
        ? `💡 Negen-Truc: 10 × ${other} = ${tenTimes}, haal er ${other} vanaf = ${target}!`
        : `💡 Times-9 Trick: 10 × ${other} = ${tenTimes}, minus ${other} = ${target}!`;
    }
    // 3. Times 5 (Half of 10x)
    if (max === 5 || min === 5) {
      const other = max === 5 ? min : max;
      return lang === 'nl'
        ? `💡 Vijf-Truc: De helft van 10 × ${other} (${other * 10}) is ${target}!`
        : `💡 Times-5 Trick: Half of 10 × ${other} (${other * 10}) is ${target}!`;
    }
    // 4. Times 4 (Double-Double!)
    if (min === 4 || max === 4) {
      const other = min === 4 ? max : min;
      const dbl = other * 2;
      return lang === 'nl'
        ? `💡 4× is Dubbel-Dubbel: ${other} × 2 = ${dbl}, en ${dbl} × 2 = ${target}!`
        : `💡 4× is Double-Double: ${other} × 2 = ${dbl}, and ${dbl} × 2 = ${target}!`;
    }
    // 5. Hard tables (6, 7, 8) -> Use 5x stepping stone!
    if (min >= 6) {
      const fivePart = 5 * max;
      const restFactor = min - 5;
      const restPart = restFactor * max;
      return lang === 'nl'
        ? `💡 Tafel-Steunpunt: 5 × ${max} = ${fivePart}, plus ${restFactor} × ${max} (${restPart}) = ${target}!`
        : `💡 Stepping Stone: 5 × ${max} = ${fivePart}, plus ${restFactor} × ${max} (${restPart}) = ${target}!`;
    }
    return lang === 'nl'
      ? `💡 Knap gerekend: ${min} groepjes van ${max} = ${target}!`
      : `💡 Sharp math: ${min} groups of ${max} = ${target}!`;
  }
}
