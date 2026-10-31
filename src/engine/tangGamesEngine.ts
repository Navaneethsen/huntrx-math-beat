import type { SchoolGroupId, TrickyFactItem } from './progressionStore';
import type { Operation } from './kakoomaGenerator';

export type TangMiniGameId =
  | 'sodaBubbles'
  | 'numberLine'
  | 'subZero'
  | 'missingRune'
  | 'breakApart'
  | 'powerLab'
  | 'stageGrid'
  | 'soulScale'
  | 'rhythmPattern'
  | 'targetTrio'
  | 'hcfLcm';

export interface BubblePopChallenge {
  kind: 'sodaBubbles';
  op: '+' | '×';
  target: number;
  bubbles: { id: string; value: number; color: string }[];
  solutionPairIds: [string, string];
  conceptBadge?: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface NumberLineChallenge {
  kind: 'numberLine';
  min: number;
  max: number;
  step: number;
  ticks: number[];
  startVal: number;
  endVal: number;
  jumpVal: number;
  mode: 'land' | 'jump' | 'midpoint';
  questionEquation: string;
  questionEquationEn?: string;
  answer: number;
  choices: number[];
  conceptBadge: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface SubZeroChallenge {
  kind: 'subZero';
  scaleMin: number;
  scaleMax: number;
  currentTemp: number;
  deltaTemp: number;
  targetTemp: number;
  equationDisplay: string;
  answer: number;
  choices: number[];
  conceptBadge: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface MissingRuneChallenge {
  kind: 'missingRune';
  equationDisplay: string; // e.g. "8 + [ ? ] = 15" or "[ ? ] × 6 = 42"
  answer: number;
  choices: number[];
  conceptBadge?: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface BreakApartChallenge {
  kind: 'breakApart';
  fullEquation: string; // e.g. "8 + 7 = 15" or "7 × 6 = 42"
  stepPrompt: { nl: string; en: string };
  bridgeDisplay: string; // e.g. "8 + [ ? ] = 10  →  10 + 5 = 15"
  answer: number;
  choices: number[];
  conceptBadge?: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface PowerLabChallenge {
  kind: 'powerLab';
  topicTag: { nl: string; en: string };
  visualFormula: string;
  visualFormulaEn?: string;
  visualBar?: { filled: number; total: number; label: string };
  answer: number;
  choices: number[];
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface StageGridChallenge {
  kind: 'stageGrid';
  rows: number;
  cols: number;
  height3d?: number;
  mode: 'array' | 'area' | 'perimeter' | 'missingSide' | 'volume';
  visualFormula: string;
  unitLabel: string;
  unitLabelEn?: string;
  answer: number;
  choices: number[];
  conceptBadge: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface SoulScaleChallenge {
  kind: 'soulScale';
  leftItems: string[];
  rightItems: string[];
  leftTotal: number;
  equationDisplay: string;
  answer: number;
  choices: number[];
  conceptBadge: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface RhythmPatternChallenge {
  kind: 'rhythmPattern';
  sequence: (number | '?')[];
  ruleBadge: { nl: string; en: string };
  equationDisplay: string;
  answer: number;
  choices: number[];
  conceptBadge: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface TargetTrioChallenge {
  kind: 'targetTrio';
  cards: [string, string, string];
  targetDisplay: string;
  equationDisplay: string;
  answer: number;
  choices: number[];
  conceptBadge: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export interface HcfLcmChallenge {
  kind: 'hcfLcm';
  mode: 'hcf' | 'lcm';
  effectiveGroup: 'g5' | 'g6' | 'g7' | 'g8';
  numbers: [number, number] | [number, number, number];
  equationDisplayNl: string;
  equationDisplayEn: string;
  factorsA: number[];
  factorsB: number[];
  factorsC?: number[];
  commonFactors: number[];
  trackA: number[];
  trackB: number[];
  trackC?: number[];
  primeBreakdownNl: string;
  primeBreakdownEn: string;
  stepByStepNl: [string, string, string];
  stepByStepEn: [string, string, string];
  answer: number;
  choices: number[];
  conceptBadge: { nl: string; en: string };
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export type TangChallenge =
  | BubblePopChallenge
  | NumberLineChallenge
  | SubZeroChallenge
  | MissingRuneChallenge
  | BreakApartChallenge
  | PowerLabChallenge
  | StageGridChallenge
  | SoulScaleChallenge
  | RhythmPatternChallenge
  | TargetTrioChallenge
  | HcfLcmChallenge;

const BUBBLE_COLORS = ['pink', 'cyan', 'amber', 'violet'] as const;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Non-repeating question history ring buffer per (gameId, schoolGroup).
 * Ensures players never get the same or near-identical question back-to-back
 * or within a large recent window.
 */
interface RecentBucket {
  sigs: string[];
  vals: number[];
}

const RECENT_ARCADE_BUCKETS = new Map<string, RecentBucket>();
const MAX_RECENT_SIGS = 28;
const MAX_RECENT_VALS = 4;

export function getChallengeSignature(ch: TangChallenge): string {
  switch (ch.kind) {
    case 'sodaBubbles': {
      const pairVals = ch.bubbles
        .filter((b) => ch.solutionPairIds.includes(b.id))
        .map((b) => b.value)
        .sort((x, y) => x - y)
        .join(',');
      return `bub:${ch.op}:${ch.target}:${pairVals}`;
    }
    case 'numberLine':
      return `nl:${ch.mode}:${ch.startVal}:${ch.jumpVal}:${ch.endVal}:${ch.answer}`;
    case 'subZero':
      return `sz:${ch.equationDisplay}:${ch.answer}`;
    case 'missingRune':
      return `mr:${ch.equationDisplay}:${ch.answer}`;
    case 'breakApart':
      return `ba:${ch.fullEquation}:${ch.bridgeDisplay}:${ch.answer}`;
    case 'powerLab':
      return `pl:${ch.visualFormula}:${ch.answer}`;
    case 'stageGrid':
      return `sg:${ch.mode}:${ch.rows}x${ch.cols}x${ch.height3d ?? 1}:${ch.answer}`;
    case 'soulScale':
      return `ss:${ch.equationDisplay}:${ch.answer}`;
    case 'rhythmPattern':
      return `rp:${ch.equationDisplay}:${ch.answer}`;
    case 'targetTrio':
      return `tt:${ch.equationDisplay}:${ch.answer}`;
    case 'hcfLcm':
      return `hl:${ch.mode}:${ch.numbers.join(',')}:${ch.answer}`;
  }
}

function getChallengePrimaryValue(ch: TangChallenge): number {
  return ch.kind === 'sodaBubbles' ? ch.target : ch.answer;
}

function withNonRepeatingChallenge<T extends TangChallenge>(
  kind: TangMiniGameId,
  group: SchoolGroupId,
  factory: () => T
): T {
  const key = `${kind}:${group}`;
  let bucket = RECENT_ARCADE_BUCKETS.get(key);
  if (!bucket) {
    bucket = { sigs: [], vals: [] };
    RECENT_ARCADE_BUCKETS.set(key, bucket);
  }

  let chosen: T | null = null;
  let fallbackCandidate: T | null = null;

  for (let attempt = 0; attempt < 40; attempt++) {
    const cand = factory();
    if (!fallbackCandidate) fallbackCandidate = cand;
    const sig = getChallengeSignature(cand);
    const val = getChallengePrimaryValue(cand);

    const sigSeen = bucket.sigs.includes(sig);
    const valSeenRecently = bucket.vals.includes(val);

    // First 14 attempts: require BOTH a fresh question signature AND a different target/answer number
    if (attempt < 14 && !sigSeen && !valSeenRecently) {
      chosen = cand;
      break;
    }
    // Attempts 14..34: require a fresh question signature
    if (attempt >= 14 && attempt < 35 && !sigSeen) {
      chosen = cand;
      break;
    }
    // Attempts 35..39: if the entire pool for this group was exhausted in a tight loop,
    // at least avoid the last 5 signatures
    if (attempt >= 35 && !bucket.sigs.slice(-5).includes(sig)) {
      chosen = cand;
      // Rotate out the oldest half of the history so a fresh cycle can begin
      bucket.sigs = bucket.sigs.slice(-8);
      break;
    }
  }

  const finalChallenge = chosen ?? fallbackCandidate ?? factory();
  const finalSig = getChallengeSignature(finalChallenge);
  const finalVal = getChallengePrimaryValue(finalChallenge);

  bucket.sigs.push(finalSig);
  if (bucket.sigs.length > MAX_RECENT_SIGS) {
    bucket.sigs.shift();
  }

  bucket.vals.push(finalVal);
  if (bucket.vals.length > MAX_RECENT_VALS) {
    bucket.vals.shift();
  }

  return finalChallenge;
}

function buildUniqueChoices(
  answer: number,
  candidates: number[],
  allowNegative = false
): number[] {
  const set = new Set<number>([answer]);
  for (const c of candidates) {
    if ((allowNegative || c >= 0) && c !== answer && set.size < 4) {
      set.add(c);
    }
  }
  let offset = 1;
  while (set.size < 4) {
    const candidate = answer + offset;
    if (allowNegative || candidate >= 0) {
      set.add(candidate);
    }
    offset = offset > 0 ? -offset : -offset + 1;
  }
  return shuffle(Array.from(set));
}

function fmtSigned(n: number): string {
  return n < 0 ? `(${n})` : `${n}`;
}

/**
 * 1. 🫧 Saja Soda-Pop Bubbels
 * Scales across g3 -> g8:
 * - g3: Bonds to 10/12 (+)
 * - g4: Bonds to 25 (+) & 2×/5×/10× tables (×)
 * - g5: Two-digit mental sums to 60 (+) & core tables 2×-5×, 8×, 10× (×)
 * - g6: Sums to 120 (+) & hard tables 6×-12× (×)
 * - g7: Negative + Positive integer bubbles (-8 + 26 = 18) & multi-digit factor bubbles (14 × 6 = 84)
 * - g8: Sub-Zero & Integer sums (-15 + 42 = 27) & advanced factor / negative products (16 × 8 = 128 or -6 × -9 = 54)
 */
export function generateBubblePopChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): BubblePopChallenge {
  return withNonRepeatingChallenge('sodaBubbles', group, () => {
    const streakBoost = Math.min(streak, 8);
    const useMult =
      group !== 'g3' &&
      ((group === 'g4' && Math.random() < 0.4) ||
        ((group === 'g5' || group === 'g6' || group === 'g7' || group === 'g8') &&
          Math.random() < 0.5));

    const colorPalette = shuffle([...BUBBLE_COLORS, 'pink', 'cyan']);

    if (!useMult) {
      let target = 10;
      let a = 6;
      let b = 4;
      let badgeNl = 'Getalbegrip (+)';
      let badgeEn = 'Number Bonds (+)';

      if (group === 'g3') {
        target = randInt(5, 13 + Math.floor(streakBoost / 2));
        a = randInt(1, target - 1);
        b = target - a;
        badgeNl = 'Splitsen t/m 12';
        badgeEn = 'Bonds to 12';
      } else if (group === 'g4') {
        target = randInt(11, 26 + streakBoost);
        a = randInt(3, target - 3);
        b = target - a;
        badgeNl = 'Over het Tiental (+)';
        badgeEn = 'Bridge 10 (+)';
      } else if (group === 'g5') {
        target = randInt(22, 68 + streakBoost * 2);
        a = randInt(6, target - 6);
        b = target - a;
        badgeNl = 'Hoofdrekenen t/m 60';
        badgeEn = 'Mental Sums to 60';
      } else if (group === 'g6') {
        target = randInt(48, 135 + streakBoost * 4);
        a = randInt(12, target - 12);
        b = target - a;
        badgeNl = 'Grote Getallen (+)';
        badgeEn = 'Big Sums (+)';
      } else if (group === 'g7') {
        // Negative + Positive integer bubble pairs!
        a = -randInt(2, 22 + streakBoost);
        b = randInt(12, 48 + streakBoost * 2);
        target = a + b;
        badgeNl = 'Negatieve & Positieve Getallen';
        badgeEn = 'Negative & Positive Integers';
      } else {
        // g8: Deep Sub-Zero & Integer sums (can be negative target or positive target)
        const negativeTarget = Math.random() < 0.48;
        if (negativeTarget) {
          a = -randInt(10, 36 + streakBoost * 2);
          b = randInt(3, Math.abs(a) - 2);
          target = a + b; // negative target!
        } else {
          a = -randInt(6, 30 + streakBoost * 2);
          b = randInt(24, 75 + streakBoost * 3);
          target = a + b;
        }
        badgeNl = 'Sub-Zero Integer Bubbels';
        badgeEn = 'Sub-Zero Integer Bubbles';
      }

      const values: number[] = [a, b];
      let guard = 0;
      while (values.length < 6 && guard < 120) {
        guard++;
        const d =
          group === 'g7' || group === 'g8'
            ? randInt(-30, 65)
            : randInt(1, Math.max(10, target + 6));
        if (d === 0 || values.includes(d)) continue;
        if (values.some((v) => v + d === target)) continue;
        values.push(d);
      }
      while (values.length < 6) {
        const fallback = Math.abs(target) + values.length * 7 + 3;
        if (!values.some((v) => v + fallback === target)) {
          values.push(fallback);
        } else {
          values.push(fallback + 1);
        }
      }

      const rawBubbles = values.map((val, idx) => ({
        id: `bub_${idx}`,
        value: val,
        color: colorPalette[idx % colorPalette.length],
      }));

      return {
        kind: 'sodaBubbles',
        op: '+',
        target,
        bubbles: shuffle(rawBubbles),
        solutionPairIds: ['bub_0', 'bub_1'],
        conceptBadge: { nl: badgeNl, en: badgeEn },
        prompt: {
          nl: `Tik op 2 bubbels die samen + ${target} maken!`,
          en: `Tap 2 bubbles that Add (+) to ${target}!`,
        },
        coachTip: {
          nl: `💡 Zoey’s Tip: ${a} + ${b} = ${target}!`,
          en: `💡 Zoey’s Tip: ${a} + ${b} = ${target}!`,
        },
      };
    } else {
      let a = 4;
      let b = 6;
      let badgeNl = 'Tafel-Bubbels (×)';
      let badgeEn = 'Factor Bubbles (×)';

      if (group === 'g4') {
        const tables = [2, 3, 4, 5, 10];
        a = tables[randInt(0, tables.length - 1)];
        b = randInt(2, 9 + Math.min(3, streakBoost));
        badgeNl = 'Tafels 2×–5×, 10×';
        badgeEn = '2×–5×, 10× Tables';
      } else if (group === 'g5') {
        const tables = [2, 3, 4, 5, 6, 8, 10];
        a = tables[randInt(0, tables.length - 1)];
        b = randInt(2, 10);
        badgeNl = 'Kern-Tafels (×)';
        badgeEn = 'Core Tables (×)';
      } else if (group === 'g6') {
        const tables = [4, 6, 7, 8, 9, 11, 12];
        a = tables[randInt(0, tables.length - 1)];
        b = randInt(3, 12);
        badgeNl = 'Grote Tafels 6×–12×';
        badgeEn = 'Master Tables 6×–12×';
      } else if (group === 'g7') {
        if (Math.random() < 0.35) {
          a = -randInt(3, 9);
          b = randInt(3, 9);
        } else {
          a = randInt(11, 18 + Math.min(4, streakBoost));
          b = randInt(3, 9);
        }
        badgeNl = 'Grote Factoren (×)';
        badgeEn = 'Multi-Digit Factors (×)';
      } else {
        // g8: either negative factor pairs or big 2-digit × 1-digit
        if (Math.random() < 0.5) {
          a = -randInt(3, 12);
          b = Math.random() < 0.5 ? -randInt(3, 11) : randInt(3, 11);
          badgeNl = 'Negatieve Factoren (×)';
          badgeEn = 'Negative Factors (×)';
        } else {
          a = randInt(11, 25);
          b = randInt(3, 9);
          badgeNl = 'Hoofdrekenen Factoren (×)';
          badgeEn = 'Advanced Factor Pairs (×)';
        }
      }

      const target = a * b;
      const values: number[] = [a, b];
      let guard = 0;
      while (values.length < 6 && guard < 120) {
        guard++;
        const d =
          (group === 'g8' || group === 'g7') && (a < 0 || b < 0)
            ? randInt(-14, 14)
            : randInt(2, Math.max(15, Math.abs(a) + 5));
        if (d === 0 || d === 1 || d === -1 || values.includes(d)) continue;
        if (values.some((v) => v * d === target)) continue;
        values.push(d);
      }
      while (values.length < 6) {
        const fallback = Math.max(13, Math.abs(a) + values.length + 2);
        if (!values.some((v) => v * fallback === target)) {
          values.push(fallback);
        } else {
          values.push(fallback + 1);
        }
      }

      const rawBubbles = values.map((val, idx) => ({
        id: `bub_${idx}`,
        value: val,
        color: colorPalette[idx % colorPalette.length],
      }));

      return {
        kind: 'sodaBubbles',
        op: '×',
        target,
        bubbles: shuffle(rawBubbles),
        solutionPairIds: ['bub_0', 'bub_1'],
        conceptBadge: { nl: badgeNl, en: badgeEn },
        prompt: {
          nl: `Tik op 2 bubbels die keer elkaar (×) ${target} maken!`,
          en: `Tap 2 bubbles that Multiply (×) to ${target}!`,
        },
        coachTip: {
          nl: `💡 Mira’s Tip: ${a} × ${b} = ${target}!`,
          en: `💡 Mira’s Tip: ${a} × ${b} = ${target}!`,
        },
      };
    }
  });
}

/**
 * 2. 📏 Honmoon Laser-Lijn (Interactive Number Line)
 * Scales across g3 -> g8:
 * - g3: 0 to 10 (step 1) — forward & backward hops
 * - g4: 0 to 20 (step 2) — bridging across 10 & missing jump size
 * - g5: 0 to 100 (step 10) — tens jumps & midpoints
 * - g6: -10 to +10 (step 2) — negative number line crossing 0!
 * - g7: -25 to +25 (step 5) — negative jumps & integer midpoints
 * - g8: -50 to +50 (step 10) — deep sub-zero jumps, multi-tens gaps & midpoints
 */
export function generateNumberLineChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): NumberLineChallenge {
  return withNonRepeatingChallenge('numberLine', group, () => {
    const buildTicks = (min: number, max: number, step: number): number[] => {
      const out: number[] = [];
      for (let v = min; v <= max; v += step) out.push(v);
      return out;
    };

    if (group === 'g3') {
      const min = 0;
      const max = 10;
      const step = 1;
      const isAdd = Math.random() < 0.55;
      const startVal = isAdd ? randInt(0, 7) : randInt(3, 10);
      const jumpVal = isAdd
        ? randInt(1, 10 - startVal)
        : -randInt(1, startVal);
      const endVal = startVal + jumpVal;
      const askJump = Math.random() < 0.3 && jumpVal > 0;
      const answer = askJump ? jumpVal : endVal;
      const eq = askJump
        ? `${startVal} + [ ? ] = ${endVal}`
        : jumpVal >= 0
          ? `${startVal} + ${jumpVal} = [ ? ]`
          : `${startVal} − ${Math.abs(jumpVal)} = [ ? ]`;

      return {
        kind: 'numberLine',
        min,
        max,
        step,
        ticks: buildTicks(min, max, step),
        startVal,
        endVal,
        jumpVal,
        mode: askJump ? 'jump' : 'land',
        questionEquation: eq,
        answer,
        choices: buildUniqueChoices(answer, [
          answer - 1,
          answer + 1,
          answer + 2,
          startVal,
        ]),
        conceptBadge: { nl: 'Getallenlijn 0–10', en: 'Number Line 0–10' },
        prompt: {
          nl: askJump
            ? `Hoeveel stapjes springt Rumi van ${startVal} naar ${endVal}?`
            : `Waar landt Rumi’s sprong op de getallenlijn?`,
          en: askJump
            ? `How many steps does Rumi jump from ${startVal} to ${endVal}?`
            : `Where does Rumi’s laser jump land on the number line?`,
        },
        coachTip: {
          nl: `💡 Start op ${startVal} en spring ${Math.abs(jumpVal)} stapjes naar ${jumpVal >= 0 ? 'rechts (+)' : 'links (−)'} → ${endVal}!`,
          en: `💡 Start at ${startVal} and hop ${Math.abs(jumpVal)} steps ${jumpVal >= 0 ? 'right (+)' : 'left (−)'} → ${endVal}!`,
        },
      };
    }

    if (group === 'g4') {
      const min = 0;
      const max = 20;
      const step = 2;
      const goForward = Math.random() < 0.65;
      const askJump = goForward && Math.random() < 0.4;
      const startVal = goForward ? randInt(2, 9) : randInt(11, 19);
      const endVal = goForward ? randInt(11, 20) : randInt(2, 9);
      const jumpVal = endVal - startVal;
      const answer = askJump ? jumpVal : endVal;
      const eq = askJump
        ? `${startVal} + [ ? ] = ${endVal}`
        : jumpVal >= 0
          ? `${startVal} + ${jumpVal} = [ ? ]`
          : `${startVal} − ${Math.abs(jumpVal)} = [ ? ]`;

      return {
        kind: 'numberLine',
        min,
        max,
        step,
        ticks: buildTicks(min, max, step),
        startVal,
        endVal,
        jumpVal,
        mode: askJump ? 'jump' : 'land',
        questionEquation: eq,
        answer,
        choices: buildUniqueChoices(answer, [
          answer - 1,
          answer + 1,
          answer + 2,
          10,
        ]),
        conceptBadge: { nl: 'Sprong over de 10', en: 'Bridge 10 Line' },
        prompt: {
          nl: askJump
            ? `Hoe groot is de sprong van ${startVal} naar ${endVal}?`
            : `Spring via de 10: waar kom je uit?`,
          en: askJump
            ? `How big is the jump from ${startVal} to ${endVal}?`
            : `Jump across 10: where do you land?`,
        },
        coachTip: {
          nl:
            jumpVal >= 0
              ? `💡 Eerst van ${startVal} naar 10 (+${10 - startVal}), en dan nog +${endVal - 10} = ${endVal}!`
              : `💡 Eerst van ${startVal} terug naar 10 (−${startVal - 10}), en dan nog −${10 - endVal} = ${endVal}!`,
          en:
            jumpVal >= 0
              ? `💡 First hop from ${startVal} to 10 (+${10 - startVal}), then +${endVal - 10} = ${endVal}!`
              : `💡 First hop back from ${startVal} to 10 (−${startVal - 10}), then −${10 - endVal} = ${endVal}!`,
        },
      };
    }

    if (group === 'g5') {
      const min = 0;
      const max = 100;
      const step = 10;
      const isMidpoint = Math.random() < 0.35;
      if (isMidpoint) {
        const startVal = randInt(0, 6) * 10;
        const gap = randInt(1, Math.max(1, Math.floor((100 - startVal) / 20))) * 20;
        const endVal = startVal + gap;
        const mid = (startVal + endVal) / 2;
        return {
          kind: 'numberLine',
          min,
          max,
          step,
          ticks: buildTicks(min, max, step),
          startVal,
          endVal,
          jumpVal: mid - startVal,
          mode: 'midpoint',
          questionEquation: `Midden: ${startVal} ↔ ${endVal} = [ ? ]`,
          questionEquationEn: `Midpoint: ${startVal} ↔ ${endVal} = [ ? ]`,
          answer: mid,
          choices: buildUniqueChoices(mid, [
            mid - 10,
            mid + 10,
            mid + 20,
            startVal + 10,
          ]),
          conceptBadge: { nl: 'Midden op 0–100 Lijn', en: 'Midpoint 0–100 Line' },
          prompt: {
            nl: `Welk getal ligt precies in het midden tussen ${startVal} en ${endVal}?`,
            en: `Which number is halfway between ${startVal} and ${endVal}?`,
          },
          coachTip: {
            nl: `💡 Het verschil is ${endVal - startVal}. De helft daarvan is ${(endVal - startVal) / 2}. Dus ${startVal} + ${(endVal - startVal) / 2} = ${mid}!`,
            en: `💡 The gap is ${endVal - startVal}. Half is ${(endVal - startVal) / 2}. So ${startVal} + ${(endVal - startVal) / 2} = ${mid}!`,
          },
        };
      }

      const goForward = Math.random() < 0.65;
      const startVal = goForward ? randInt(8, 65) : randInt(35, 92);
      const jumpAbs = randInt(15, goForward ? 98 - startVal : startVal - 4);
      const jumpVal = goForward ? jumpAbs : -jumpAbs;
      const endVal = startVal + jumpVal;
      const eq =
        jumpVal >= 0
          ? `${startVal} + ${jumpVal} = [ ? ]`
          : `${startVal} − ${Math.abs(jumpVal)} = [ ? ]`;
      return {
        kind: 'numberLine',
        min,
        max,
        step,
        ticks: buildTicks(min, max, step),
        startVal,
        endVal,
        jumpVal,
        mode: 'land',
        questionEquation: eq,
        answer: endVal,
        choices: buildUniqueChoices(endVal, [
          endVal - 10,
          endVal + 10,
          endVal - 5,
          endVal + 5,
        ]),
        conceptBadge: { nl: 'Sprongen op 0–100', en: 'Jumps on 0–100' },
        prompt: {
          nl:
            jumpVal >= 0
              ? `Spring +${jumpVal} verder vanaf ${startVal}!`
              : `Spring ${Math.abs(jumpVal)} terug vanaf ${startVal}!`,
          en:
            jumpVal >= 0
              ? `Jump +${jumpVal} forward from ${startVal}!`
              : `Jump ${Math.abs(jumpVal)} back from ${startVal}!`,
        },
        coachTip: {
          nl: `💡 Start op ${startVal} en reken ${jumpVal >= 0 ? `+ ${jumpVal}` : `− ${Math.abs(jumpVal)}`} = ${endVal}!`,
          en: `💡 Start at ${startVal} and compute ${jumpVal >= 0 ? `+ ${jumpVal}` : `− ${Math.abs(jumpVal)}`} = ${endVal}!`,
        },
      };
    }

    if (group === 'g6') {
      // Negative number line -10 to +10 crossing zero!
      const min = -10;
      const max = 10;
      const step = 2;
      const goRight = Math.random() < 0.55;
      const startVal = goRight ? -randInt(1, 10) : randInt(1, 10);
      const endVal = goRight ? randInt(1, 10) : -randInt(1, 10);
      const jumpVal = endVal - startVal;
      const askJump = goRight && Math.random() < 0.35;
      const answer = askJump ? jumpVal : endVal;
      const eq = askJump
        ? `${startVal} + [ ? ] = ${endVal}`
        : jumpVal >= 0
          ? `${startVal} + ${jumpVal} = [ ? ]`
          : `${startVal} − ${Math.abs(jumpVal)} = [ ? ]`;

      return {
        kind: 'numberLine',
        min,
        max,
        step,
        ticks: buildTicks(min, max, step),
        startVal,
        endVal,
        jumpVal,
        mode: askJump ? 'jump' : 'land',
        questionEquation: eq,
        answer,
        choices: buildUniqueChoices(
          answer,
          [-answer, answer - 2, answer + 2, answer + 1],
          true
        ),
        conceptBadge: { nl: 'Over Nul (−10 tot +10)', en: 'Across Zero (−10 to +10)' },
        prompt: {
          nl: askJump
            ? `Hoe groot is de sprong van ${startVal} via 0 naar ${endVal}?`
            : `Spring over 0 op de Honmoon-lijn: waar land je?`,
          en: askJump
            ? `How big is the jump from ${startVal} across 0 to ${endVal}?`
            : `Jump across 0 on the Honmoon line: where do you land?`,
        },
        coachTip: {
          nl: `💡 Via 0: van ${startVal} naar 0 is ${Math.abs(startVal)} stappen, en dan nog ${Math.abs(endVal)} stappen → ${endVal}!`,
          en: `💡 Bridge via 0: from ${startVal} to 0 is ${Math.abs(startVal)} steps, plus ${Math.abs(endVal)} more → ${endVal}!`,
        },
      };
    }

    if (group === 'g7') {
      const min = -25;
      const max = 25;
      const step = 5;
      const goRight = Math.random() < 0.65;
      const askJump = goRight && Math.random() < 0.45;
      const startVal = goRight ? -randInt(2, 24) : randInt(2, 24);
      const endVal = goRight ? randInt(2, 24) : -randInt(2, 24);
      const jumpVal = endVal - startVal;
      const answer = askJump ? jumpVal : endVal;
      const eq = askJump
        ? `${startVal} + [ ? ] = ${endVal}`
        : jumpVal >= 0
          ? `${startVal} + ${jumpVal} = [ ? ]`
          : `${startVal} − ${Math.abs(jumpVal)} = [ ? ]`;

      return {
        kind: 'numberLine',
        min,
        max,
        step,
        ticks: buildTicks(min, max, step),
        startVal,
        endVal,
        jumpVal,
        mode: askJump ? 'jump' : 'land',
        questionEquation: eq,
        answer,
        choices: buildUniqueChoices(
          answer,
          [answer - 5, answer + 5, -answer, Math.abs(endVal - Math.abs(startVal))],
          true
        ),
        conceptBadge: { nl: 'Negatieve Lijn (−25 tot +25)', en: 'Integer Line (−25 to +25)' },
        prompt: {
          nl: askJump
            ? `Hoeveel stapjes van ${startVal} via 0 naar +${endVal}?`
            : `Waar landt de laser vanaf ${startVal} met sprong ${jumpVal >= 0 ? `+${jumpVal}` : jumpVal}?`,
          en: askJump
            ? `How many steps from ${startVal} across 0 to +${endVal}?`
            : `Where does the laser land from ${startVal} with jump ${jumpVal >= 0 ? `+${jumpVal}` : jumpVal}?`,
        },
        coachTip: {
          nl: `💡 Afstand tot 0 is ${Math.abs(startVal)}, en tot ${endVal} is ${Math.abs(endVal)} → sprong van ${Math.abs(jumpVal)}!`,
          en: `💡 Distance to 0 is ${Math.abs(startVal)}, and to ${endVal} is ${Math.abs(endVal)} → total jump of ${Math.abs(jumpVal)}!`,
        },
      };
    }

    // g8: -50 to +50 (step 10), midpoints & large negative jumps
    const min = -50;
    const max = 50;
    const step = 10;
    const isMidpoint = Math.random() < 0.4;
    if (isMidpoint) {
      const startVal = -randInt(4, 24) * 2; // even negative in -48..-8
      const endVal = randInt(2, 24) * 2; // even positive in 4..48
      const mid = (startVal + endVal) / 2;
      return {
        kind: 'numberLine',
        min,
        max,
        step,
        ticks: buildTicks(min, max, step),
        startVal,
        endVal,
        jumpVal: mid - startVal,
        mode: 'midpoint',
        questionEquation: `Midden: ${startVal} ↔ +${endVal} = [ ? ]`,
        questionEquationEn: `Midpoint: ${startVal} ↔ +${endVal} = [ ? ]`,
        answer: mid,
        choices: buildUniqueChoices(mid, [-mid, mid - 5, mid + 5, mid + 10], true),
        conceptBadge: { nl: 'Sub-Zero Midden (−50 tot +50)', en: 'Sub-Zero Midpoint (−50 to +50)' },
        prompt: {
          nl: `Wat ligt precies midden tussen ${startVal} en +${endVal}?`,
          en: `What is halfway between ${startVal} and +${endVal}?`,
        },
        coachTip: {
          nl: `💡 Tel bij elkaar op en deel door 2: (${startVal} + ${endVal}) ÷ 2 = ${mid}!`,
          en: `💡 Add and divide by 2: (${startVal} + ${endVal}) ÷ 2 = ${mid}!`,
        },
      };
    }

    const startVal = randInt(8, 45);
    const jumpVal = -randInt(startVal + 5, startVal + 48);
    const endVal = startVal + jumpVal;
    return {
      kind: 'numberLine',
      min,
      max,
      step,
      ticks: buildTicks(min, max, step),
      startVal,
      endVal,
      jumpVal,
      mode: 'land',
      questionEquation: `${startVal} − ${Math.abs(jumpVal)} = [ ? ]`,
      answer: endVal,
      choices: buildUniqueChoices(endVal, [-endVal, endVal - 10, endVal + 10, endVal - 5], true),
      conceptBadge: { nl: 'Diepe Sub-Zero Sprong', en: 'Deep Sub-Zero Jump' },
      prompt: {
        nl: `Spring ${jumpVal} naar links vanaf +${startVal}!`,
        en: `Jump ${jumpVal} left from +${startVal}!`,
      },
      coachTip: {
        nl: `💡 Van +${startVal} naar 0 kost ${startVal}, daarna nog ${Math.abs(jumpVal) - startVal} onder nul → ${endVal}!`,
        en: `💡 From +${startVal} to 0 takes ${startVal}, then ${Math.abs(jumpVal) - startVal} below zero → ${endVal}!`,
      },
    };
  });
}

/**
 * 3. ❄️ Gwi-Ma Sub-Zero Portaal (Negative Numbers & Thermometer/Portal)
 * Scales across g3 -> g8:
 * - g3: Countdown to 0 (0° to 15°)
 * - g4: First steps below zero (-10° to +10°)
 * - g5: Thermometer drops & rises across zero (-15° to +15°)
 * - g6: Sub-zero addition & subtraction (-25° to +25°)
 * - g7: Deep sub-zero & subtracting a negative (-a - (-b) = -a + b)
 * - g8: Full negative integers: (-a) × (-b), (-a) ÷ b, and multi-step sub-zero
 */
export function generateSubZeroChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): SubZeroChallenge {
  return withNonRepeatingChallenge('subZero', group, () => {
    const boost = Math.min(streak, 6);

    if (group === 'g3') {
      const isDrop = Math.random() < 0.7;
      const currentTemp = isDrop ? randInt(3, 14) : randInt(0, 9);
      const deltaTemp = isDrop
        ? -randInt(1, currentTemp)
        : randInt(1, 14 - currentTemp);
      const targetTemp = currentTemp + deltaTemp;
      const eq =
        deltaTemp < 0
          ? `${currentTemp}° − ${Math.abs(deltaTemp)}° = [ ? ]°`
          : `${currentTemp}° + ${deltaTemp}° = [ ? ]°`;
      return {
        kind: 'subZero',
        scaleMin: 0,
        scaleMax: 15,
        currentTemp,
        deltaTemp,
        targetTemp,
        equationDisplay: eq,
        answer: targetTemp,
        choices: buildUniqueChoices(targetTemp, [
          targetTemp + 1,
          targetTemp + 2,
          currentTemp,
        ]),
        conceptBadge: { nl: 'Thermometer 0°–15°', en: 'Thermometer 0°–15°' },
        prompt: {
          nl:
            deltaTemp < 0
              ? `De thermometer daalt ${Math.abs(deltaTemp)}° vanaf ${currentTemp}°. Hoeveel graden wordt het?`
              : `De thermometer stijgt +${deltaTemp}° vanaf ${currentTemp}°. Hoeveel graden wordt het?`,
          en:
            deltaTemp < 0
              ? `The thermometer drops ${Math.abs(deltaTemp)}° from ${currentTemp}°. What is the new reading?`
              : `The thermometer rises +${deltaTemp}° from ${currentTemp}°. What is the new reading?`,
        },
        coachTip: {
          nl:
            deltaTemp < 0
              ? `💡 Tel ${Math.abs(deltaTemp)} omlaag vanaf ${currentTemp}° → ${targetTemp}°!`
              : `💡 Tel ${deltaTemp} omhoog vanaf ${currentTemp}° → ${targetTemp}°!`,
          en:
            deltaTemp < 0
              ? `💡 Count down ${Math.abs(deltaTemp)} from ${currentTemp}° → ${targetTemp}°!`
              : `💡 Count up ${deltaTemp} from ${currentTemp}° → ${targetTemp}°!`,
        },
      };
    }

    if (group === 'g4') {
      const isDrop = Math.random() < 0.75;
      if (isDrop) {
        const currentTemp = randInt(1, 9);
        const drop = currentTemp + randInt(1, 9);
        const deltaTemp = -drop;
        const targetTemp = currentTemp + deltaTemp; // -1 to -9
        return {
          kind: 'subZero',
          scaleMin: -10,
          scaleMax: 10,
          currentTemp,
          deltaTemp,
          targetTemp,
          equationDisplay: `${currentTemp}° − ${drop}° = [ ? ]°`,
          answer: targetTemp,
          choices: buildUniqueChoices(
            targetTemp,
            [-targetTemp, 0, targetTemp - 1, targetTemp + 1],
            true
          ),
          conceptBadge: { nl: 'Onder Nul (−10° tot +10°)', en: 'Below Zero (−10° to +10°)' },
          prompt: {
            nl: `Het is ${currentTemp}° en daalt ${drop}° onder nul!`,
            en: `It is ${currentTemp}° and drops ${drop}° below zero!`,
          },
          coachTip: {
            nl: `💡 ${currentTemp}° − ${currentTemp}° = 0°, en dan nog ${drop - currentTemp}° kouder = ${targetTemp}°!`,
            en: `💡 ${currentTemp}° − ${currentTemp}° = 0°, then ${drop - currentTemp}° colder = ${targetTemp}°!`,
          },
        };
      } else {
        const currentTemp = -randInt(1, 8);
        const deltaTemp = randInt(Math.abs(currentTemp) + 1, Math.abs(currentTemp) + 9);
        const targetTemp = currentTemp + deltaTemp;
        return {
          kind: 'subZero',
          scaleMin: -10,
          scaleMax: 10,
          currentTemp,
          deltaTemp,
          targetTemp,
          equationDisplay: `${currentTemp}° + ${deltaTemp}° = [ ? ]°`,
          answer: targetTemp,
          choices: buildUniqueChoices(
            targetTemp,
            [-targetTemp, 0, targetTemp - 1, targetTemp + 1],
            true
          ),
          conceptBadge: { nl: 'Van Onder Nul Omhoog', en: 'Rising Above Zero' },
          prompt: {
            nl: `Het is ${currentTemp}° en wordt +${deltaTemp}° warmer!`,
            en: `It is ${currentTemp}° and warms up by +${deltaTemp}°!`,
          },
          coachTip: {
            nl: `💡 Van ${currentTemp}° naar 0° kost +${Math.abs(currentTemp)}°, daarna nog +${targetTemp}° = ${targetTemp}°!`,
            en: `💡 From ${currentTemp}° to 0° takes +${Math.abs(currentTemp)}°, plus ${targetTemp}° more = ${targetTemp}°!`,
          },
        };
      }
    }

    if (group === 'g5') {
      const rise = Math.random() < 0.5;
      const currentTemp = rise ? -randInt(1, 14) : randInt(1, 14);
      const deltaTemp = rise ? randInt(3, 24) : -randInt(3, 24);
      const targetTemp = currentTemp + deltaTemp;
      const eq =
        deltaTemp >= 0
          ? `${currentTemp}° + ${deltaTemp}° = [ ? ]°`
          : `${currentTemp}° − ${Math.abs(deltaTemp)}° = [ ? ]°`;
      return {
        kind: 'subZero',
        scaleMin: -15,
        scaleMax: 15,
        currentTemp,
        deltaTemp,
        targetTemp,
        equationDisplay: eq,
        answer: targetTemp,
        choices: buildUniqueChoices(
          targetTemp,
          [-targetTemp, targetTemp - 2, targetTemp + 2, 0],
          true
        ),
        conceptBadge: { nl: 'Thermometer Sprong', en: 'Thermometer Jump' },
        prompt: {
          nl: `Start op ${currentTemp}° en ${deltaTemp >= 0 ? `stijg +${deltaTemp}°` : `daal ${deltaTemp}°`}!`,
          en: `Start at ${currentTemp}° and ${deltaTemp >= 0 ? `rise +${deltaTemp}°` : `drop ${deltaTemp}°`}!`,
        },
        coachTip: {
          nl: `💡 Gebruik 0° als tussenstop: van ${currentTemp}° via 0° kom je op ${targetTemp}°!`,
          en: `💡 Use 0° as a stepping stone: from ${currentTemp}° through 0° lands on ${targetTemp}°!`,
        },
      };
    }

    if (group === 'g6') {
      const bothNegative = Math.random() < 0.45;
      const currentTemp = -randInt(2, 18 + boost);
      const deltaTemp = bothNegative ? -randInt(2, 14) : randInt(4, 28);
      const targetTemp = currentTemp + deltaTemp;
      const eq =
        deltaTemp >= 0
          ? `${currentTemp}° + ${deltaTemp}° = [ ? ]°`
          : `${currentTemp}° − ${Math.abs(deltaTemp)}° = [ ? ]°`;
      return {
        kind: 'subZero',
        scaleMin: -25,
        scaleMax: 25,
        currentTemp,
        deltaTemp,
        targetTemp,
        equationDisplay: eq,
        answer: targetTemp,
        choices: buildUniqueChoices(
          targetTemp,
          [-targetTemp, targetTemp - 2, targetTemp + 2, currentTemp - deltaTemp],
          true
        ),
        conceptBadge: { nl: 'Sub-Zero Rekenen (−25°..+25°)', en: 'Sub-Zero Math (−25°..+25°)' },
        prompt: {
          nl: `Bereken de nieuwe Honmoon-temperatuur!`,
          en: `Calculate the new Honmoon portal temperature!`,
        },
        coachTip: {
          nl: bothNegative
            ? `💡 Al onder nul (${currentTemp}°) en nóg ${Math.abs(deltaTemp)}° kouder = ${targetTemp}°!`
            : `💡 Van ${currentTemp}° omhoog met +${deltaTemp}° passeert 0° en eindigt op ${targetTemp}°!`,
          en: bothNegative
            ? `💡 Already at ${currentTemp}° and ${Math.abs(deltaTemp)}° colder = ${targetTemp}°!`
            : `💡 From ${currentTemp}° up by +${deltaTemp}° crosses 0° to ${targetTemp}°!`,
        },
      };
    }

    if (group === 'g7') {
      // Double negative (-a - (-b) = -a + b) or negative + negative (-a + (-b))
      const doubleNeg = Math.random() < 0.55;
      const currentTemp = -randInt(3, 24 + boost);
      const b = randInt(3, 28);
      const deltaTemp = doubleNeg ? b : -b;
      const targetTemp = currentTemp + deltaTemp;
      const eq = doubleNeg
        ? `${currentTemp} − (−${b}) = [ ? ]`
        : `${currentTemp} + (−${b}) = [ ? ]`;

      return {
        kind: 'subZero',
        scaleMin: -35,
        scaleMax: 35,
        currentTemp,
        deltaTemp,
        targetTemp,
        equationDisplay: eq,
        answer: targetTemp,
        choices: buildUniqueChoices(
          targetTemp,
          [-targetTemp, currentTemp - b, currentTemp + b, targetTemp + 2],
          true
        ),
        conceptBadge: { nl: 'Dubbel-Min & Sub-Zero Regels', en: 'Double-Negative & Integer Rules' },
        prompt: {
          nl: doubleNeg
            ? `Min een negatief getal (− −${b}) wordt Plus (+${b})!`
            : `Plus een negatief getal (+ −${b}) gaat verder omlaag!`,
          en: doubleNeg
            ? `Subtracting a negative (− −${b}) becomes Plus (+${b})!`
            : `Adding a negative (+ −${b}) drops further down!`,
        },
        coachTip: {
          nl: doubleNeg
            ? `💡 Dubbel-Min Regel: ${currentTemp} − (−${b}) = ${currentTemp} + ${b} = ${targetTemp}!`
            : `💡 ${currentTemp} + (−${b}) = ${currentTemp} − ${b} = ${targetTemp}!`,
          en: doubleNeg
            ? `💡 Double-Negative Rule: ${currentTemp} − (−${b}) = ${currentTemp} + ${b} = ${targetTemp}!`
            : `💡 ${currentTemp} + (−${b}) = ${currentTemp} − ${b} = ${targetTemp}!`,
        },
      };
    }

    // g8: Negative multiplication & division: (-a) × (-b), (-a) × b, (-product) ÷ (-a)
    const isDiv = Math.random() < 0.4;
    const a = -randInt(2, 12);
    const b = Math.random() < 0.55 ? -randInt(2, 12) : randInt(2, 12);
    const product = a * b;

    if (isDiv) {
      return {
        kind: 'subZero',
        scaleMin: -50,
        scaleMax: 50,
        currentTemp: product,
        deltaTemp: b - product,
        targetTemp: b,
        equationDisplay: `${fmtSigned(product)} ÷ ${fmtSigned(a)} = [ ? ]`,
        answer: b,
        choices: buildUniqueChoices(b, [-b, b - 2, b + 2, a], true),
        conceptBadge: { nl: 'Sub-Zero Delen (÷)', en: 'Sub-Zero Division (÷)' },
        prompt: {
          nl: `Deel de Sub-Zero energie: let goed op het min-teken!`,
          en: `Divide the Sub-Zero energy: watch the negative signs!`,
        },
        coachTip: {
          nl: `💡 Teken-Regel: ${product < 0 ? 'Min ÷ Min = Plus (+)' : 'Plus ÷ Min = Min (−)'} → ${b}!`,
          en: `💡 Sign Rule: ${product < 0 ? 'Negative ÷ Negative = Positive (+)' : 'Positive ÷ Negative = Negative (−)'} → ${b}!`,
        },
      };
    }

    return {
      kind: 'subZero',
      scaleMin: -60,
      scaleMax: 60,
      currentTemp: a,
      deltaTemp: product - a,
      targetTemp: product,
      equationDisplay: `${fmtSigned(a)} × ${fmtSigned(b)} = [ ? ]`,
      answer: product,
      choices: buildUniqueChoices(product, [-product, product - a, product + a, a + b], true),
      conceptBadge: { nl: 'Sub-Zero Vermenigvuldigen (×)', en: 'Sub-Zero Multiplication (×)' },
      prompt: {
        nl: b < 0 ? `Min × Min = Plus! Bereken het product:` : `Min × Plus = Min! Bereken het product:`,
        en: b < 0 ? `Negative × Negative = Positive! Solve:` : `Negative × Positive = Negative! Solve:`,
      },
      coachTip: {
        nl: `💡 ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(product)}, en ${b < 0 ? '(−) × (−) = (+)' : '(−) × (+) = (−)'} → ${product}!`,
        en: `💡 ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(product)}, and ${b < 0 ? '(−) × (−) = (+)' : '(−) × (+) = (−)'} → ${product}!`,
      },
    };
  });
}

/**
 * 4. ⚔️ Saingeom Geheime Rune (Algebra, Balance & Order of Operations)
 * Scales across g3 -> g8:
 * - g3: Missing addend to 12
 * - g4: Missing addend/subtrahend to 25
 * - g5: Core table missing factor (2×,3×,4×,5×,10×) or 2-digit subtraction rune
 * - g6: Master table division/multiplication rune (6×-12×) or balance equation
 * - g7: Order of Operations (PEMDAS) & Squares n² (e.g. 4² + [ ? ] = 25)
 * - g8: Two-step algebra (3 × [ ? ] + 4 = 25), Cubes/Powers, & Negative equations
 */
export function generateMissingRuneChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): MissingRuneChallenge {
  return withNonRepeatingChallenge('missingRune', group, () => {
    const boost = Math.min(streak, 6);

    if (group === 'g3' || group === 'g4') {
      const maxSum = group === 'g3' ? 14 + Math.floor(boost / 2) : 28 + boost;
      const isSub = Math.random() < 0.35;
      if (isSub) {
        const total = randInt(group === 'g3' ? 6 : 11, maxSum);
        const answer = randInt(2, total - 2);
        const rem = total - answer;
        return {
          kind: 'missingRune',
          equationDisplay: `${total} − [ ? ] = ${rem}`,
          answer,
          choices: buildUniqueChoices(answer, [
            answer - 1,
            answer + 1,
            answer + 2,
            rem,
          ]),
          conceptBadge: {
            nl: group === 'g3' ? 'Geheime Rune t/m 14' : 'Geheime Rune t/m 28',
            en: group === 'g3' ? 'Missing Rune to 14' : 'Missing Rune to 28',
          },
          prompt: {
            nl: 'Welk getal mist er in Rumi’s Saingeom-rune?',
            en: 'Which number is missing in Rumi’s Saingeom rune?',
          },
          coachTip: {
            nl: `💡 Omkeer-Truc: ${total} − ${rem} = ${answer}!`,
            en: `💡 Inverse Trick: ${total} − ${rem} = ${answer}!`,
          },
        };
      }

      const a = randInt(2, Math.floor(maxSum * 0.65));
      const answer = randInt(2, maxSum - a);
      const total = a + answer;
      const hideFirst = Math.random() < 0.45;
      const eq = hideFirst
        ? `[ ? ] + ${a} = ${total}`
        : `${a} + [ ? ] = ${total}`;

      return {
        kind: 'missingRune',
        equationDisplay: eq,
        answer,
        choices: buildUniqueChoices(answer, [
          answer - 1,
          answer + 1,
          answer + 2,
          total - 1,
        ]),
        conceptBadge: {
          nl: group === 'g3' ? 'Geheime Rune t/m 14' : 'Geheime Rune t/m 28',
          en: group === 'g3' ? 'Missing Rune to 14' : 'Missing Rune to 28',
        },
        prompt: {
          nl: 'Welk getal mist er in Rumi’s Saingeom-rune?',
          en: 'Which number is missing in Rumi’s Saingeom rune?',
        },
        coachTip: {
          nl: `💡 Omkeer-Truc: ${total} − ${a} = ${answer}!`,
          en: `💡 Inverse Trick: ${total} − ${a} = ${answer}!`,
        },
      };
    }

    if (group === 'g5' || group === 'g6') {
      const useMult = Math.random() < 0.7;
      if (useMult) {
        const pool =
          group === 'g5'
            ? [2, 3, 4, 5, 6, 8, 10]
            : [4, 6, 7, 8, 9, 11, 12];
        const factor = pool[randInt(0, pool.length - 1)];
        const answer = randInt(2, group === 'g5' ? 10 : 12);
        const product = factor * answer;
        const isDiv = group === 'g6' && Math.random() < 0.45;
        const hideFirst = !isDiv && Math.random() < 0.35;
        const eq = isDiv
          ? `${product} ÷ [ ? ] = ${factor}`
          : hideFirst
          ? `[ ? ] × ${factor} = ${product}`
          : `${factor} × [ ? ] = ${product}`;

        return {
          kind: 'missingRune',
          equationDisplay: eq,
          answer,
          choices: buildUniqueChoices(answer, [
            answer - 1,
            answer + 1,
            answer + 2,
            answer - 2,
          ]),
          conceptBadge: {
            nl: group === 'g5' ? 'Tafel-Rune (×)' : 'Meester-Rune (× / ÷)',
            en: group === 'g5' ? 'Table Rune (×)' : 'Master Rune (× / ÷)',
          },
          prompt: {
            nl: 'Kies de ontbrekende Saingeom-rune!',
            en: 'Pick the missing Saingeom rune!',
          },
          coachTip: {
            nl: `💡 Sommenfamilie: ${factor} × ${answer} = ${product}!`,
            en: `💡 Fact Family: ${factor} × ${answer} = ${product}!`,
          },
        };
      } else {
        const answer = randInt(11, 52);
        const b = randInt(11, 42);
        const total = answer + b;
        return {
          kind: 'missingRune',
          equationDisplay: `${total} − [ ? ] = ${b}`,
          answer,
          choices: buildUniqueChoices(answer, [
            answer - 2,
            answer + 2,
            answer + 10,
            answer - 1,
          ]),
          conceptBadge: { nl: 'Balans-Rune (−)', en: 'Balance Rune (−)' },
          prompt: {
            nl: 'Welke waarde maakt deze vergelijking kloppend?',
            en: 'Which value completes this equation?',
          },
          coachTip: {
            nl: `💡 Aanvul-Truc: ${total} − ${b} = ${answer}!`,
            en: `💡 Difference Trick: ${total} − ${b} = ${answer}!`,
          },
        };
      }
    }

    if (group === 'g7') {
      // Order of Operations (PEMDAS) & Squares n²
      const useSquare = Math.random() < 0.5;
      if (useSquare) {
        const base = randInt(2, 11);
        const sq = base * base;
        const answer = randInt(3, 32);
        const total = sq + answer;
        return {
          kind: 'missingRune',
          equationDisplay: `${base}² + [ ? ] = ${total}`,
          answer,
          choices: buildUniqueChoices(answer, [
            answer - 2,
            answer + 2,
            total - base * 2,
            answer + 5,
          ]),
          conceptBadge: { nl: 'Kwadraten & Volgorde (n²)', en: 'Squares & Order (n²)' },
          prompt: {
            nl: `Reken eerst ${base}² (${base} × ${base}) uit en vind [ ? ]!`,
            en: `First compute ${base}² (${base} × ${base}) and find [ ? ]!`,
          },
          coachTip: {
            nl: `💡 ${base}² = ${sq}, en ${total} − ${sq} = ${answer}!`,
            en: `💡 ${base}² = ${sq}, and ${total} − ${sq} = ${answer}!`,
          },
        };
      } else {
        const f1 = randInt(2, 10);
        const f2 = randInt(3, 9);
        const prod = f1 * f2;
        const answer = randInt(3, 25);
        const total = prod + answer;
        return {
          kind: 'missingRune',
          equationDisplay: `${f1} × ${f2} + [ ? ] = ${total}`,
          answer,
          choices: buildUniqueChoices(answer, [
            answer - 1,
            answer + 1,
            answer + 3,
            answer - 3,
          ]),
          conceptBadge: { nl: 'Reken-Volgorde (× vóór +)', en: 'Order of Ops (× before +)' },
          prompt: {
            nl: `Vermenigvuldig eerst (${f1} × ${f2}) en vind daarna [ ? ]!`,
            en: `Multiply first (${f1} × ${f2}) and then find [ ? ]!`,
          },
          coachTip: {
            nl: `💡 Eerst ${f1} × ${f2} = ${prod}. Daarna ${total} − ${prod} = ${answer}!`,
            en: `💡 First ${f1} × ${f2} = ${prod}. Then ${total} − ${prod} = ${answer}!`,
          },
        };
      }
    }

    // g8: Two-step algebra (a × [ ? ] + b = total or a × [ ? ] − b = total)
    const m = randInt(2, 11);
    const answer = randInt(3, 14);
    const b = randInt(3, 24);
    const isMinus = Math.random() < 0.35;
    if (isMinus) {
      const total = m * answer - b;
      return {
        kind: 'missingRune',
        equationDisplay: `${m} × [ ? ] − ${b} = ${total}`,
        answer,
        choices: buildUniqueChoices(answer, [
          answer - 1,
          answer + 1,
          answer + 2,
          Math.max(1, answer - 2),
        ]),
        conceptBadge: { nl: '2-Staps Algebra Rune', en: '2-Step Algebra Rune' },
        prompt: {
          nl: `Los de 2-staps vergelijking op: eerst + ${b}, dan ÷ ${m}!`,
          en: `Solve the 2-step algebra rune: first + ${b}, then ÷ ${m}!`,
        },
        coachTip: {
          nl: `💡 Stap 1: ${total} + ${b} = ${m * answer}. Stap 2: ${m * answer} ÷ ${m} = ${answer}!`,
          en: `💡 Step 1: ${total} + ${b} = ${m * answer}. Step 2: ${m * answer} ÷ ${m} = ${answer}!`,
        },
      };
    }

    const total = m * answer + b;
    return {
      kind: 'missingRune',
      equationDisplay: `${m} × [ ? ] + ${b} = ${total}`,
      answer,
      choices: buildUniqueChoices(answer, [
        answer - 1,
        answer + 1,
        answer + 2,
        Math.max(1, answer - 2),
      ]),
      conceptBadge: { nl: '2-Staps Algebra Rune', en: '2-Step Algebra Rune' },
      prompt: {
        nl: `Los de 2-staps vergelijking op: eerst − ${b}, dan ÷ ${m}!`,
        en: `Solve the 2-step algebra rune: first − ${b}, then ÷ ${m}!`,
      },
      coachTip: {
        nl: `💡 Stap 1: ${total} − ${b} = ${m * answer}. Stap 2: ${m * answer} ÷ ${m} = ${answer}!`,
        en: `💡 Step 1: ${total} − ${b} = ${m * answer}. Step 2: ${m * answer} ÷ ${m} = ${answer}!`,
      },
    };
  });
}

/**
 * 5. 🐯 Derpy's Splits-Beat (Smart Decomposition & Distributive Property)
 * Scales across g3 -> g8:
 * - g3: Make-10 bridge
 * - g4: Bridge through 20
 * - g5: Bridge through 30–60
 * - g6: 6×–9× Distributive Split via 5×
 * - g7: Two-digit × 1-digit Distributive Split (e.g. 14 × 6 = 10×6 + 4×6)
 * - g8: Big Division Split (e.g. 156 ÷ 12) or 15..25 × n Distributive Split
 */
export function generateBreakApartChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): BreakApartChallenge {
  return withNonRepeatingChallenge('breakApart', group, () => {
    if (group === 'g3' || group === 'g4' || group === 'g5') {
      const baseTen =
        group === 'g3'
          ? [10, 20][randInt(0, 1)]
          : group === 'g4'
          ? randInt(2, 4) * 10
          : randInt(2, 8) * 10;
      const ones = randInt(4, 9);
      const a = baseTen - 10 + ones;
      const needToTen = baseTen - a;
      const leftover = randInt(2, group === 'g3' ? 7 : 8);
      const b = needToTen + leftover;
      const sum = a + b;

      const askStep1 = Math.random() < 0.55;
      const answer = askStep1 ? needToTen : leftover;

      const bridgeDisplay = askStep1
        ? `${a} + [ ? ] = ${baseTen}  →  ${baseTen} + ${leftover} = ${sum}`
        : `${a} + ${needToTen} = ${baseTen}  →  ${baseTen} + [ ? ] = ${sum}`;

      return {
        kind: 'breakApart',
        fullEquation: `${a} + ${b} = ${sum}`,
        stepPrompt: {
          nl: askStep1
            ? `Splits ${b}: hoeveel heb je nodig om van ${a} eerst ${baseTen} te maken?`
            : `${b} is gesplitst in ${needToTen} en [ ? ]. Hoeveel komt er na ${baseTen} nog bij?`,
          en: askStep1
            ? `Split ${b}: how much is needed to bridge ${a} up to ${baseTen}?`
            : `${b} is split into ${needToTen} and [ ? ]. How much is left after ${baseTen}?`,
        },
        bridgeDisplay,
        answer,
        choices: buildUniqueChoices(answer, [
          needToTen,
          leftover,
          b,
          answer + 1,
          answer + 2,
        ]),
        conceptBadge: {
          nl: `Aanvullen tot ${baseTen}`,
          en: `Bridge to ${baseTen}`,
        },
        coachTip: {
          nl: `💡 Splits ${b} in ${needToTen} en ${leftover}: ${a} + ${needToTen} = ${baseTen}, plus ${leftover} = ${sum}!`,
          en: `💡 Split ${b} into ${needToTen} and ${leftover}: ${a} + ${needToTen} = ${baseTen}, plus ${leftover} = ${sum}!`,
        },
      };
    }

    if (group === 'g6') {
      const factorA = randInt(6, 9);
      const factorB = randInt(3, 12);
      const extra = factorA - 5;
      const fivePart = 5 * factorB;
      const restPart = extra * factorB;
      const total = factorA * factorB;
      const askFivePart = Math.random() < 0.35;
      const answer = askFivePart ? fivePart : restPart;

      return {
        kind: 'breakApart',
        fullEquation: `${factorA} × ${factorB} = ${total}`,
        stepPrompt: {
          nl: askFivePart
            ? `Splits ${factorA} × ${factorB} via 5×: (5 × ${factorB} = [ ? ]) + (${extra} × ${factorB} = ${restPart})`
            : `Splits ${factorA} × ${factorB} via 5×: (5 × ${factorB} = ${fivePart}) + (${extra} × ${factorB} = [ ? ])`,
          en: askFivePart
            ? `Split ${factorA} × ${factorB} via 5×: (5 × ${factorB} = [ ? ]) + (${extra} × ${factorB} = ${restPart})`
            : `Split ${factorA} × ${factorB} via 5×: (5 × ${factorB} = ${fivePart}) + (${extra} × ${factorB} = [ ? ])`,
        },
        bridgeDisplay: askFivePart
          ? `[ ? ] + ${restPart} = ${total}`
          : `${fivePart} + [ ? ] = ${total}`,
        answer,
        choices: buildUniqueChoices(answer, [
          factorB,
          answer + factorB,
          answer - 2,
          askFivePart ? restPart : fivePart,
        ]),
        conceptBadge: { nl: '5× Tafel-Splitsing', en: '5× Table Split' },
        coachTip: {
          nl: `💡 ${factorA} = 5 + ${extra}. Dus ${fivePart} + (${extra} × ${factorB} = ${restPart}) = ${total}!`,
          en: `💡 ${factorA} = 5 + ${extra}. So ${fivePart} + (${extra} × ${factorB} = ${restPart}) = ${total}!`,
        },
      };
    }

    if (group === 'g7') {
      // Two-digit × 1-digit distributive split: e.g. 14 × 6 = (10 × 6 = 60) + (4 × 6 = [ ? ]) = 84
      const tensBase = Math.random() < 0.7 ? 10 : 20;
      const ones = randInt(2, 9);
      const factorA = tensBase + ones;
      const factorB = randInt(3, 9);
      const tenPart = tensBase * factorB;
      const restPart = ones * factorB;
      const total = factorA * factorB;

      return {
        kind: 'breakApart',
        fullEquation: `${factorA} × ${factorB} = ${total}`,
        stepPrompt: {
          nl: `Splits ${factorA} in ${tensBase} + ${ones}: (${tensBase} × ${factorB} = ${tenPart}) + (${ones} × ${factorB} = [ ? ])`,
          en: `Split ${factorA} into ${tensBase} + ${ones}: (${tensBase} × ${factorB} = ${tenPart}) + (${ones} × ${factorB} = [ ? ])`,
        },
        bridgeDisplay: `${tenPart} + [ ? ] = ${total}`,
        answer: restPart,
        choices: buildUniqueChoices(restPart, [
          restPart + factorB,
          restPart - factorB,
          ones + factorB,
          tenPart,
        ]),
        conceptBadge: { nl: '10× Distributieve Splitsing', en: '10× Distributive Split' },
        coachTip: {
          nl: `💡 ${factorA} × ${factorB} = (${tensBase} × ${factorB} = ${tenPart}) + (${ones} × ${factorB} = ${restPart}) = ${total}!`,
          en: `💡 ${factorA} × ${factorB} = (${tensBase} × ${factorB} = ${tenPart}) + (${ones} × ${factorB} = ${restPart}) = ${total}!`,
        },
      };
    }

    // g8: Big Division Split (e.g. 156 ÷ 12 = (120 ÷ 12 = 10) + (36 ÷ 12 = [ ? ]) = 13)
    const baseQuotient = Math.random() < 0.7 ? 10 : 20;
    const divisor = randInt(4, 13 + Math.min(3, streak));
    const extraQuotient = randInt(2, 9);
    const totalQuotient = baseQuotient + extraQuotient;
    const tenChunk = divisor * baseQuotient;
    const restChunk = divisor * extraQuotient;
    const dividend = tenChunk + restChunk;

    return {
      kind: 'breakApart',
      fullEquation: `${dividend} ÷ ${divisor} = ${totalQuotient}`,
      stepPrompt: {
        nl: `Splits ${dividend} in ${tenChunk} + ${restChunk}: (${tenChunk} ÷ ${divisor} = ${baseQuotient}) + (${restChunk} ÷ ${divisor} = [ ? ])`,
        en: `Split ${dividend} into ${tenChunk} + ${restChunk}: (${tenChunk} ÷ ${divisor} = ${baseQuotient}) + (${restChunk} ÷ ${divisor} = [ ? ])`,
      },
      bridgeDisplay: `${dividend} ÷ ${divisor}  →  ${baseQuotient} + [ ? ] = ${totalQuotient}`,
      answer: extraQuotient,
      choices: buildUniqueChoices(extraQuotient, [
        extraQuotient + 1,
        extraQuotient + 2,
        Math.max(1, extraQuotient - 1),
        totalQuotient,
      ]),
      conceptBadge: { nl: 'Grote Deel-Splitsing (÷)', en: 'Big Division Split (÷)' },
      coachTip: {
        nl: `💡 ${dividend} = ${tenChunk} + ${restChunk}. ${restChunk} ÷ ${divisor} = ${extraQuotient}, dus ${baseQuotient} + ${extraQuotient} = ${totalQuotient}!`,
        en: `💡 ${dividend} = ${tenChunk} + ${restChunk}. ${restChunk} ÷ ${divisor} = ${extraQuotient}, so ${baseQuotient} + ${extraQuotient} = ${totalQuotient}!`,
      },
    };
  });
}

/**
 * 6. 🧪 Mira's Honmoon Kristal-Lab (IB PYP Concepts: Place Value, Rounding, Fractions, Decimals, Percentages, Ratios & Geometry)
 * Scales across g3 -> g8 so NO curriculum topic is skipped!
 */
export function generatePowerLabChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): PowerLabChallenge {
  return withNonRepeatingChallenge('powerLab', group, () => {
    if (group === 'g3') {
      const mode = randInt(0, 2);
      if (mode === 0) {
        const n = randInt(2, 12);
        const ans = n * 2;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Dubbelen & Helften', en: 'Doubles & Halves' },
          visualFormula: `Dubbel ${n}  (${n} + ${n}) = [ ? ]`,
          visualFormulaEn: `Double ${n}  (${n} + ${n}) = [ ? ]`,
          visualBar: { filled: n, total: ans, label: `${n} + ${n}` },
          answer: ans,
          choices: buildUniqueChoices(ans, [ans - 2, ans + 2, ans + 1, n + 2]),
          prompt: {
            nl: `Verdubbel het aantal Honmoon-kristallen!`,
            en: `Double the number of Honmoon crystals!`,
          },
          coachTip: {
            nl: `💡 Dubbel ${n} is ${n} + ${n} = ${ans}!`,
            en: `💡 Double ${n} is ${n} + ${n} = ${ans}!`,
          },
        };
      } else if (mode === 1) {
        const ans = randInt(2, 11);
        const total = ans * 2;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Dubbelen & Helften', en: 'Doubles & Halves' },
          visualFormula: `½ van ${total} = [ ? ]`,
          visualFormulaEn: `½ of ${total} = [ ? ]`,
          visualBar: { filled: 1, total: 2, label: '½ (1/2)' },
          answer: ans,
          choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, total - 2]),
          prompt: {
            nl: `Wat is de helft van ${total} kristallen?`,
            en: `What is half of ${total} crystals?`,
          },
          coachTip: {
            nl: `💡 ${ans} + ${ans} = ${total}, dus de helft is ${ans}!`,
            en: `💡 ${ans} + ${ans} = ${total}, so half is ${ans}!`,
          },
        };
      } else {
        const tensBase = Math.random() < 0.7 ? 10 : 20;
        const ones = randInt(1, 9);
        const ans = tensBase + ones;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Tiental & Eenheden', en: 'Tens & Ones' },
          visualFormula: `${tensBase} + ${ones} = [ ? ]`,
          visualBar: { filled: tensBase, total: ans, label: `${tensBase} + ${ones}` },
          answer: ans,
          choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ones * 10, ans + 2]),
          prompt: {
            nl: `${tensBase === 10 ? '1 vol tiental (10)' : '2 tientallen (20)'} en ${ones} losse kristallen maken samen:`,
            en: `${tensBase === 10 ? '1 full ten (10)' : '2 tens (20)'} and ${ones} single crystals make:`,
          },
          coachTip: {
            nl: `💡 ${tensBase} + ${ones} eenheden = ${ans}!`,
            en: `💡 ${tensBase} + ${ones} ones = ${ans}!`,
          },
        };
      }
    }

    if (group === 'g4') {
      const mode = randInt(0, 2);
      if (mode === 0) {
        const tens = randInt(1, 9);
        const ones = randInt(1, 9);
        const ans = tens * 10 + ones;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Getalwaarde (Tientallen)', en: 'Place Value (Tens & Ones)' },
          visualFormula: `${tens} × 10 + ${ones} = [ ? ]`,
          answer: ans,
          choices: buildUniqueChoices(ans, [ones * 10 + tens, ans + 10, ans - 10, tens + ones]),
          prompt: {
            nl: `Hoeveel is ${tens} tientallen en ${ones} eenheden?`,
            en: `What is ${tens} tens and ${ones} ones?`,
          },
          coachTip: {
            nl: `💡 ${tens} tientallen = ${tens * 10}, plus ${ones} = ${ans}!`,
            en: `💡 ${tens} tens = ${tens * 10}, plus ${ones} = ${ans}!`,
          },
        };
      } else if (mode === 1) {
        const ans = randInt(2, 16);
        const total = ans * 2;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Halveren (½)', en: 'Halving (½)' },
          visualFormula: `½ van ${total} = [ ? ]`,
          visualFormulaEn: `½ of ${total} = [ ? ]`,
          visualBar: { filled: 1, total: 2, label: '½ (1/2)' },
          answer: ans,
          choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, total - 2]),
          prompt: {
            nl: `Wat is precies de helft (½) van ${total}?`,
            en: `What is exactly half (½) of ${total}?`,
          },
          coachTip: {
            nl: `💡 Omdat ${ans} + ${ans} = ${total}, is de helft van ${total} gelijk aan ${ans}!`,
            en: `💡 Since ${ans} + ${ans} = ${total}, half of ${total} is ${ans}!`,
          },
        };
      } else {
        const baseTen = randInt(1, 9) * 10;
        const offset = Math.random() < 0.5 ? randInt(1, 4) : -randInt(1, 4);
        const num = baseTen - offset;
        const ans = Math.round(num / 10) * 10;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Afronden op 10-tal', en: 'Rounding to Nearest 10' },
          visualFormula: `${num} ≈ [ ? ]`,
          answer: ans,
          choices: buildUniqueChoices(ans, [ans - 10, ans + 10, ans + 5, num]),
          prompt: {
            nl: `Rond ${num} af op het dichtstbijzijnde tiental!`,
            en: `Round ${num} to the nearest ten!`,
          },
          coachTip: {
            nl: `💡 ${num} ligt het dichtst bij het tiental ${ans}!`,
            en: `💡 ${num} is closest to the multiple of ten ${ans}!`,
          },
        };
      }
    }

    if (group === 'g5') {
      const isFraction = Math.random() < 0.6;
      if (isFraction) {
        const denom = [2, 3, 4, 5, 6, 8, 10][randInt(0, 6)];
        const ans = randInt(2, 11);
        const total = denom * ans;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Stambreuken (1/n)', en: 'Unit Fractions (1/n)' },
          visualFormula: `1/${denom} van ${total} = [ ? ]`,
          visualFormulaEn: `1/${denom} of ${total} = [ ? ]`,
          visualBar: { filled: 1, total: denom, label: `1/${denom}` },
          answer: ans,
          choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, denom]),
          prompt: {
            nl: `Verdeel ${total} kristallen in ${denom} gelijke delen (1/${denom}):`,
            en: `Split ${total} crystals into ${denom} equal parts (1/${denom}):`,
          },
          coachTip: {
            nl: `💡 1/${denom} van ${total} betekent ${total} ÷ ${denom} = ${ans}!`,
            en: `💡 1/${denom} of ${total} means ${total} ÷ ${denom} = ${ans}!`,
          },
        };
      } else {
        const w = randInt(3, 15);
        const h = randInt(2, 12);
        const ans = 2 * (w + h);
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Omtrek Podium', en: 'Stage Perimeter' },
          visualFormula: `Omtrek: ${w}m × ${h}m = [ ? ]m`,
          visualFormulaEn: `Perimeter: ${w}m × ${h}m = [ ? ]m`,
          answer: ans,
          choices: buildUniqueChoices(ans, [w * h, w + h, ans - 2, ans + 4]),
          prompt: {
            nl: `Wat is de omtrek (alle 4 zijden samen) van een podium van ${w} bij ${h}?`,
            en: `What is the perimeter (all 4 sides) of a ${w} by ${h} stage?`,
          },
          coachTip: {
            nl: `💡 Omtrek = ${w} + ${h} + ${w} + ${h} = ${ans}!`,
            en: `💡 Perimeter = ${w} + ${h} + ${w} + ${h} = ${ans}!`,
          },
        };
      }
    }

    if (group === 'g6') {
      const pairs: [number, number][] = [
        [3, 4],
        [2, 3],
        [2, 5],
        [3, 5],
        [4, 5],
        [5, 6],
        [3, 8],
        [5, 8],
        [7, 8],
        [3, 10],
        [7, 10],
        [9, 10],
      ];
      const [num, den] = pairs[randInt(0, pairs.length - 1)];
      const unit = randInt(2, 12);
      const total = den * unit;
      const ans = num * unit;
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Breuken van Getallen', en: 'Fractions of Amounts' },
        visualFormula: `${num}/${den} van ${total} = [ ? ]`,
        visualFormulaEn: `${num}/${den} of ${total} = [ ? ]`,
        visualBar: { filled: num, total: den, label: `${num}/${den}` },
        answer: ans,
        choices: buildUniqueChoices(ans, [unit, ans + unit, ans - unit, total - unit]),
        prompt: {
          nl: `Bereken eerst 1/${den} van ${total}, en neem dat ${num} keer!`,
          en: `First find 1/${den} of ${total}, then multiply by ${num}!`,
        },
        coachTip: {
          nl: `💡 1/${den} van ${total} = ${unit}. Daarna ${num} × ${unit} = ${ans}!`,
          en: `💡 1/${den} of ${total} = ${unit}. Then ${num} × ${unit} = ${ans}!`,
        },
      };
    }

    if (group === 'g7') {
      const isPercent = Math.random() < 0.6;
      if (isPercent) {
        const pcts: { pct: number; num: number; den: number }[] = [
          { pct: 25, num: 1, den: 4 },
          { pct: 50, num: 1, den: 2 },
          { pct: 75, num: 3, den: 4 },
          { pct: 20, num: 1, den: 5 },
          { pct: 40, num: 2, den: 5 },
          { pct: 60, num: 3, den: 5 },
          { pct: 80, num: 4, den: 5 },
          { pct: 10, num: 1, den: 10 },
          { pct: 30, num: 3, den: 10 },
        ];
        const pick = pcts[randInt(0, pcts.length - 1)];
        const unit = randInt(2, 15);
        const total = pick.den * unit;
        const ans = pick.num * unit;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Procenten & Breuken (%)', en: 'Percentages & Fractions (%)' },
          visualFormula: `${pick.pct}% van ${total} = [ ? ]`,
          visualFormulaEn: `${pick.pct}% of ${total} = [ ? ]`,
          visualBar: { filled: pick.num, total: pick.den, label: `${pick.pct}%` },
          answer: ans,
          choices: buildUniqueChoices(ans, [unit, ans + unit, total - ans, ans + 2]),
          prompt: {
            nl: `Hoeveel is ${pick.pct}% (${pick.num}/${pick.den}) van ${total}?`,
            en: `What is ${pick.pct}% (${pick.num}/${pick.den}) of ${total}?`,
          },
          coachTip: {
            nl: `💡 ${pick.pct}% = ${pick.num}/${pick.den}. Dus ${total} ÷ ${pick.den} × ${pick.num} = ${ans}!`,
            en: `💡 ${pick.pct}% = ${pick.num}/${pick.den}. So ${total} ÷ ${pick.den} × ${pick.num} = ${ans}!`,
          },
        };
      } else {
        // Decimal multiplication by 10/100 or whole sum from tenths
        const whole = randInt(1, 14);
        const tenth = randInt(1, 9);
        const mult = Math.random() < 0.5 ? 10 : 100;
        const ans = mult === 10 ? whole * 10 + tenth : (whole * 10 + tenth) * 10;
        return {
          kind: 'powerLab',
          topicTag: { nl: 'Kommagetallen (× 10 / × 100)', en: 'Decimals (× 10 / × 100)' },
          visualFormula: `${whole}.${tenth} × ${mult} = [ ? ]`,
          answer: ans,
          choices: buildUniqueChoices(ans, [
            whole * 10 + tenth,
            (whole * 10 + tenth) * 10,
            ans + 10,
            whole * mult,
          ]),
          prompt: {
            nl: `Schuif de komma naar rechts bij × ${mult}!`,
            en: `Shift the decimal point right when multiplying by ${mult}!`,
          },
          coachTip: {
            nl: `💡 Bij × ${mult} schuift de komma ${mult === 10 ? '1 plek' : '2 plekken'} naar rechts → ${ans}!`,
            en: `💡 Multiplying by ${mult} shifts the decimal ${mult === 10 ? '1 place' : '2 places'} right → ${ans}!`,
          },
        };
      }
    }

    // g8: Ratios (a : b = [ ? ] : d), Percentage Discounts, or Mean/Average
    const mode = randInt(0, 2);
    if (mode === 0) {
      const a = randInt(2, 7);
      const b = randInt(a + 1, 11);
      const scale = randInt(2, 9 + Math.min(3, streak));
      const ans = a * scale;
      const d = b * scale;
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Verhoudingen (Ratio a : b)', en: 'Equivalent Ratios (a : b)' },
        visualFormula: `${a} : ${b}  =  [ ? ] : ${d}`,
        visualBar: { filled: a, total: a + b, label: `${a} : ${b}` },
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - a, ans + a, b * scale, a + scale]),
        prompt: {
          nl: `Houd de verhouding gelijk: met hoeveel is ${b} vermenigvuldigd tot ${d}?`,
          en: `Keep the ratio equal: what was ${b} multiplied by to reach ${d}?`,
        },
        coachTip: {
          nl: `💡 ${d} ÷ ${b} = ${scale}× zo groot. Dus ${a} × ${scale} = ${ans}!`,
          en: `💡 ${d} ÷ ${b} = ${scale}× larger. So ${a} × ${scale} = ${ans}!`,
        },
      };
    } else if (mode === 1) {
      const pct = [15, 20, 25, 30, 35, 40, 60, 70, 75, 80][randInt(0, 9)];
      const tens = randInt(2, 14) * 2;
      const total = tens * 10;
      const ans = Math.round((pct * total) / 100);
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Procenten via 10%', en: 'Percentages via 10%' },
        visualFormula: `${pct}% van ${total} = [ ? ]`,
        visualFormulaEn: `${pct}% of ${total} = [ ? ]`,
        visualBar: { filled: pct, total: 100, label: `${pct}%` },
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - tens, ans + tens, total - ans, tens]),
        prompt: {
          nl: `Vind eerst 10% van ${total} (=${tens}) en bereken daarmee ${pct}%!`,
          en: `First find 10% of ${total} (=${tens}), then scale to ${pct}%!`,
        },
        coachTip: {
          nl: `💡 10% van ${total} = ${tens}. Daarmee is ${pct}% van ${total} gelijk aan ${ans}!`,
          en: `💡 10% of ${total} = ${tens}. Scaling to ${pct}% of ${total} gives ${ans}!`,
        },
      };
    } else {
      // Mean / Average of 3 numbers
      const mean = randInt(6, 28);
      const d1 = randInt(1, 7);
      const d2 = randInt(1, 6);
      const n1 = mean - d1;
      const n2 = mean - d2;
      const n3 = mean + d1 + d2;
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Gemiddelde (Statistiek)', en: 'Mean / Average (Data)' },
        visualFormula: `Gemiddelde (${n1}, ${n2}, ${n3}) = [ ? ]`,
        visualFormulaEn: `Mean (${n1}, ${n2}, ${n3}) = [ ? ]`,
        answer: mean,
        choices: buildUniqueChoices(mean, [mean - 1, mean + 1, mean + 2, n2]),
        prompt: {
          nl: `Tel de 3 scores bij elkaar op en deel door 3!`,
          en: `Add the 3 scores together and divide by 3!`,
        },
        coachTip: {
          nl: `💡 (${n1} + ${n2} + ${n3}) = ${mean * 3}, en ${mean * 3} ÷ 3 = ${mean}!`,
          en: `💡 (${n1} + ${n2} + ${n3}) = ${mean * 3}, and ${mean * 3} ÷ 3 = ${mean}!`,
        },
      };
    }
  });
}

/**
 * 7. 🍱 Zoey’s Stage Grid (Arrays, Area, Perimeter & 3D Volume)
 * Scales across g3 -> g8:
 * - g3: Small visual tile array 2..5 × 2..6 (counting in equal rows)
 * - g4: Multiplication array 2..7 × 3..8 (rows × cols)
 * - g5: Stage Area (L × W) or Perimeter (2L + 2W)
 * - g6: Larger Stage Area or Perimeter (up to 13 × 11)
 * - g7: Missing Side from Area ([ ? ] × W = Area) or 3D Volume
 * - g8: 3D Stage Cube Volume (L × W × H)
 */
export function generateStageGridChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): StageGridChallenge {
  return withNonRepeatingChallenge('stageGrid', group, () => {
    const boost = Math.min(3, Math.floor(streak / 2));

    if (group === 'g3') {
      const rows = randInt(2, 5);
      const cols = randInt(2, 6 + Math.min(1, boost));
      const ans = rows * cols;
      return {
        kind: 'stageGrid',
        rows,
        cols,
        mode: 'array',
        visualFormula: `${rows} × ${cols} = [ ? ]`,
        unitLabel: 'tegels',
        unitLabelEn: 'tiles',
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 2, ans + 2, rows + cols, ans + 1]),
        conceptBadge: { nl: 'Tegel-Rooster', en: 'Tile Array' },
        prompt: {
          nl: `${rows} rijen van ${cols} tegels!`,
          en: `${rows} rows of ${cols} tiles!`,
        },
        coachTip: {
          nl: `💡 Tel per rij: ${rows} × ${cols} = ${ans}!`,
          en: `💡 Count by rows: ${rows} × ${cols} = ${ans}!`,
        },
      };
    }

    if (group === 'g4') {
      const rows = randInt(2, 7);
      const cols = randInt(3, 8 + Math.min(2, boost));
      const ans = rows * cols;
      return {
        kind: 'stageGrid',
        rows,
        cols,
        mode: 'array',
        visualFormula: `${rows} × ${cols} = [ ? ]`,
        unitLabel: 'blokken',
        unitLabelEn: 'blocks',
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - rows, ans + rows, rows + cols, ans + 2]),
        conceptBadge: { nl: 'Keer-Rooster (×)', en: 'Array Grid (×)' },
        prompt: {
          nl: `Hoeveel podium-blokken in ${rows} × ${cols}?`,
          en: `How many stage blocks in ${rows} × ${cols}?`,
        },
        coachTip: {
          nl: `💡 ${rows} rijen × ${cols} kolommen = ${ans}!`,
          en: `💡 ${rows} rows × ${cols} columns = ${ans}!`,
        },
      };
    }

    if (group === 'g5' || group === 'g6') {
      const isPerimeter = Math.random() < 0.48;
      const rows = group === 'g5' ? randInt(2, 8) : randInt(3, 11);
      const cols = group === 'g5' ? randInt(3, 10) : randInt(4, 13);
      if (isPerimeter) {
        const ans = 2 * (rows + cols);
        return {
          kind: 'stageGrid',
          rows,
          cols,
          mode: 'perimeter',
          visualFormula: `${cols}m + ${rows}m + ${cols}m + ${rows}m = [ ? ] m`,
          unitLabel: 'm',
          answer: ans,
          choices: buildUniqueChoices(ans, [rows * cols, rows + cols, ans - 2, ans + 4]),
          conceptBadge: { nl: 'Omtrek (Perimeter)', en: 'Stage Perimeter' },
          prompt: {
            nl: `Wat is de omtrek (rand eromheen) van ${cols}m bij ${rows}m?`,
            en: `What is the perimeter (all 4 sides) of ${cols}m by ${rows}m?`,
          },
          coachTip: {
            nl: `💡 Omtrek = 2 × (${cols} + ${rows}) = ${ans}m!`,
            en: `💡 Perimeter = 2 × (${cols} + ${rows}) = ${ans}m!`,
          },
        };
      } else {
        const ans = rows * cols;
        return {
          kind: 'stageGrid',
          rows,
          cols,
          mode: 'area',
          visualFormula: `${cols}m × ${rows}m = [ ? ] m²`,
          unitLabel: 'm²',
          answer: ans,
          choices: buildUniqueChoices(ans, [2 * (rows + cols), ans - cols, ans + rows, ans + 2]),
          conceptBadge: { nl: 'Oppervlakte (Area m²)', en: 'Stage Area (m²)' },
          prompt: {
            nl: `Bereken de oppervlakte (${cols}m × ${rows}m)!`,
            en: `Find the stage area (${cols}m × ${rows}m)!`,
          },
          coachTip: {
            nl: `💡 Oppervlakte = lengte × breedte = ${cols} × ${rows} = ${ans} m²!`,
            en: `💡 Area = length × width = ${cols} × ${rows} = ${ans} m²!`,
          },
        };
      }
    }

    if (group === 'g7') {
      if (Math.random() < 0.5) {
        const cols = randInt(2, 6);
        const rows = randInt(2, 5);
        const height3d = randInt(2, 4);
        const ans = cols * rows * height3d;
        return {
          kind: 'stageGrid',
          rows,
          cols,
          height3d,
          mode: 'volume',
          visualFormula: `${cols}m × ${rows}m × ${height3d}m = [ ? ] m³`,
          unitLabel: 'm³',
          answer: ans,
          choices: buildUniqueChoices(ans, [
            cols * rows,
            ans + cols * rows,
            ans - height3d,
            cols + rows + height3d,
          ]),
          conceptBadge: { nl: '3D Blok-Inhoud (m³)', en: '3D Block Volume (m³)' },
          prompt: {
            nl: `Tel of bereken de 3D blokken: ${cols}m × ${rows}m × ${height3d}m!`,
            en: `Count or calculate the 3D blocks: ${cols}m × ${rows}m × ${height3d}m!`,
          },
          coachTip: {
            nl: `💡 Onderste laag = ${cols} × ${rows} = ${cols * rows} blokjes. Keer ${height3d} lagen = ${ans} m³!`,
            en: `💡 Base layer = ${cols} × ${rows} = ${cols * rows} cubes. Times ${height3d} layers = ${ans} m³!`,
          },
        };
      }

      const rows = randInt(3, 11);
      const cols = randInt(4, 14);
      const area = rows * cols;
      return {
        kind: 'stageGrid',
        rows,
        cols,
        mode: 'missingSide',
        visualFormula: `[ ? ]m × ${rows}m = ${area} m²`,
        unitLabel: 'm',
        answer: cols,
        choices: buildUniqueChoices(cols, [cols - 1, cols + 1, cols + 2, rows]),
        conceptBadge: { nl: 'Ontbrekende Zijde (m²)', en: 'Missing Side (Area)' },
        prompt: {
          nl: `Oppervlakte = ${area} m² en breedte = ${rows}m. Hoe lang is de zijde?`,
          en: `Area = ${area} m² and width = ${rows}m. Find the missing length!`,
        },
        coachTip: {
          nl: `💡 Deel de oppervlakte door de breedte: ${area} ÷ ${rows} = ${cols}m!`,
          en: `💡 Divide area by width: ${area} ÷ ${rows} = ${cols}m!`,
        },
      };
    }

    // g8: 3D Stage Cube Volume (L × W × H)
    const cols = randInt(2, 9);
    const rows = randInt(2, 7);
    const height3d = randInt(2, 6);
    const ans = cols * rows * height3d;
    return {
      kind: 'stageGrid',
      rows,
      cols,
      height3d,
      mode: 'volume',
      visualFormula: `${cols}m × ${rows}m × ${height3d}m = [ ? ] m³`,
      unitLabel: 'm³',
      answer: ans,
      choices: buildUniqueChoices(ans, [
        cols * rows,
        ans + cols * rows,
        ans - height3d,
        cols + rows + height3d,
      ]),
      conceptBadge: { nl: '3D Volume (Inhoud m³)', en: '3D Volume (m³)' },
      prompt: {
        nl: `Bereken de 3D inhoud: ${cols}m × ${rows}m × ${height3d}m!`,
        en: `Find the 3D stage volume: ${cols}m × ${rows}m × ${height3d}m!`,
      },
      coachTip: {
        nl: `💡 Eerst grondvlak ${cols} × ${rows} = ${cols * rows}, daarna × ${height3d} = ${ans} m³!`,
        en: `💡 Base area ${cols} × ${rows} = ${cols * rows}, then × ${height3d} = ${ans} m³!`,
      },
    };
  });
}

/**
 * 8. ⚖️ Jinu’s Soul Scale (Visual Balance Beam & Algebraic Weights)
 * Scales across g3 -> g8:
 * - g3: Balance to 10 ([ 6 ] + [ 4 ] = [ 7 ] + [ ? ])
 * - g4: Balance to 20 ([ 9 ] + [ 7 ] = [ 10 ] + [ ? ])
 * - g5: Two-digit balance ([ 24 ] + [ 16 ] = [ 15 ] + [ ? ])
 * - g6: Product balance ([ 6 × 7 ] = [ 30 ] + [ ? ])
 * - g7: 2-Step Algebra Balance (2 × [ ? ] + 5 = 21)
 * - g8: Negative & Multi-Bag Balance (3 × [ ? ] − 6 = 21 or [ -14 ] + [ ? ] = 18)
 */
export function generateSoulScaleChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): SoulScaleChallenge {
  return withNonRepeatingChallenge('soulScale', group, () => {
    const boost = Math.min(6, streak);

    if (group === 'g3') {
      const total = randInt(5, 14);
      const l1 = randInt(2, total - 2);
      const l2 = total - l1;
      const r1 = randInt(1, total - 1);
      const ans = total - r1;
      return {
        kind: 'soulScale',
        leftItems: [`${l1}`, `${l2}`],
        rightItems: [`${r1}`, '?'],
        leftTotal: total,
        equationDisplay: `${l1} + ${l2}  ⚖️  ${r1} + [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, total]),
        conceptBadge: { nl: 'Weegschaal t/m 14', en: 'Balance to 14' },
        prompt: {
          nl: `Maak beide kanten even zwaar (${total})!`,
          en: `Balance both sides to equal ${total}!`,
        },
        coachTip: {
          nl: `💡 Links is ${l1} + ${l2} = ${total}. Rechts: ${r1} + ${ans} = ${total}!`,
          en: `💡 Left is ${l1} + ${l2} = ${total}. Right: ${r1} + ${ans} = ${total}!`,
        },
      };
    }

    if (group === 'g4') {
      const l1 = randInt(5, 15);
      const l2 = randInt(4, 14);
      const total = l1 + l2;
      const r1 = Math.random() < 0.45 ? 10 : randInt(5, total - 3);
      const ans = total - r1;
      return {
        kind: 'soulScale',
        leftItems: [`${l1}`, `${l2}`],
        rightItems: [`${r1}`, '?'],
        leftTotal: total,
        equationDisplay: `${l1} + ${l2}  ⚖️  ${r1} + [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, total]),
        conceptBadge: { nl: 'Balans t/m 30', en: 'Balance to 30' },
        prompt: {
          nl: `Houd de weegschaal in balans!`,
          en: `Keep the Soul Scale balanced!`,
        },
        coachTip: {
          nl: `💡 Links = ${total}. Dus rechts ${r1} + ${ans} = ${total}!`,
          en: `💡 Left = ${total}. So right is ${r1} + ${ans} = ${total}!`,
        },
      };
    }

    if (group === 'g5') {
      const l1 = randInt(12, 34 + boost);
      const l2 = randInt(11, 32 + boost);
      const total = l1 + l2;
      const r1 = randInt(10, total - 8);
      const ans = total - r1;
      return {
        kind: 'soulScale',
        leftItems: [`${l1}`, `${l2}`],
        rightItems: [`${r1}`, '?'],
        leftTotal: total,
        equationDisplay: `${l1} + ${l2}  ⚖️  ${r1} + [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 2, ans + 2, ans + 5, total - l1]),
        conceptBadge: { nl: 'Dubbele Balans', en: 'Double Balance' },
        prompt: {
          nl: `Links weegt ${total}. Wat hoort er bij ${r1}?`,
          en: `Left weighs ${total}. What balances ${r1}?`,
        },
        coachTip: {
          nl: `💡 ${l1} + ${l2} = ${total}, en ${total} − ${r1} = ${ans}!`,
          en: `💡 ${l1} + ${l2} = ${total}, and ${total} − ${r1} = ${ans}!`,
        },
      };
    }

    if (group === 'g6') {
      const a = randInt(4, 12);
      const b = randInt(4, 12);
      const total = a * b;
      const r1 = randInt(6, total - 5);
      const ans = total - r1;
      return {
        kind: 'soulScale',
        leftItems: [`${a} × ${b}`],
        rightItems: [`${r1}`, '?'],
        leftTotal: total,
        equationDisplay: `${a} × ${b}  ⚖️  ${r1} + [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 2, ans + 2, ans + 4, total]),
        conceptBadge: { nl: 'Keer-Balans (× & +)', en: 'Product Balance' },
        prompt: {
          nl: `Reken eerst ${a} × ${b} uit en maak rechts gelijk!`,
          en: `First find ${a} × ${b}, then balance the right side!`,
        },
        coachTip: {
          nl: `💡 ${a} × ${b} = ${total}. Daarna ${total} − ${r1} = ${ans}!`,
          en: `💡 ${a} × ${b} = ${total}. Then ${total} − ${r1} = ${ans}!`,
        },
      };
    }

    if (group === 'g7') {
      const coeff = randInt(2, 7);
      const ans = randInt(3, 14);
      const extra = randInt(2, 18);
      const total = coeff * ans + extra;
      return {
        kind: 'soulScale',
        leftItems: [`${coeff} × [ ? ]`, `+ ${extra}`],
        rightItems: [`${total}`],
        leftTotal: total,
        equationDisplay: `${coeff} × [ ? ] + ${extra}  ⚖️  ${total}`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, coeff + extra]),
        conceptBadge: { nl: 'Algebra Balans (2-staps)', en: '2-Step Algebra Scale' },
        prompt: {
          nl: `Haal eerst ${extra} weg aan beide kanten en deel door ${coeff}!`,
          en: `First subtract ${extra} from both sides, then divide by ${coeff}!`,
        },
        coachTip: {
          nl: `💡 ${total} − ${extra} = ${coeff * ans}, en ${coeff * ans} ÷ ${coeff} = ${ans}!`,
          en: `💡 ${total} − ${extra} = ${coeff * ans}, and ${coeff * ans} ÷ ${coeff} = ${ans}!`,
        },
      };
    }

    // g8: Signed Integer Balance or Subtracted Algebra Balance
    const coeff = randInt(2, 8);
    const ans = randInt(4, 15);
    const sub = randInt(3, 20);
    const total = coeff * ans - sub;
    return {
      kind: 'soulScale',
      leftItems: [`${coeff} × [ ? ]`, `− ${sub}`],
      rightItems: [`${total}`],
      leftTotal: total,
      equationDisplay: `${coeff} × [ ? ] − ${sub}  ⚖️  ${total}`,
      answer: ans,
      choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, ans - 2]),
      conceptBadge: { nl: 'Meester-Balans (Algebra)', en: 'Master Algebra Scale' },
      prompt: {
        nl: `Tel eerst ${sub} erbij op en deel door ${coeff}!`,
        en: `First add ${sub} to both sides, then divide by ${coeff}!`,
      },
      coachTip: {
        nl: `💡 ${total} + ${sub} = ${coeff * ans}, en ${coeff * ans} ÷ ${coeff} = ${ans}!`,
        en: `💡 ${total} + ${sub} = ${coeff * ans}, and ${coeff * ans} ÷ ${coeff} = ${ans}!`,
      },
    };
  });
}

/**
 * 9. ⚡ Rumi’s Rhythm Pattern (Stepping-Stone Sequences & Function Rules)
 * Scales across g3 -> g8:
 * - g3: +1, +2, +3, +4, +5, +10 steps
 * - g4: +2, +3, +4, +5, +6, +8, +10 steps
 * - g5: +5..+12 steps or ×2 / ×3 scaling
 * - g6: Growing gaps (+1, +2, +3, +4 ... +5, +10, +15, +20)
 * - g7: Sub-zero negative integer sequences (12 -> 5 -> -2 -> [ ? ])
 * - g8: Square number sequence (1, 4, 9, 16, [ ? ]) or 2-step rule (×2 + c / ×3 + c)
 */
export function generateRhythmPatternChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): RhythmPatternChallenge {
  return withNonRepeatingChallenge('rhythmPattern', group, () => {
    if (group === 'g3') {
      const step = [1, 2, 3, 4, 5, 10][randInt(0, 5)];
      const start = randInt(1, 12);
      const seq = [start, start + step, start + step * 2, '?' as const];
      const ans = start + step * 3;
      return {
        kind: 'rhythmPattern',
        sequence: seq,
        ruleBadge: { nl: `Sprong +${step}`, en: `Step +${step}` },
        equationDisplay: `${start} ➔ ${start + step} ➔ ${start + step * 2} ➔ [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + step, ans - step]),
        conceptBadge: { nl: 'Reken-Ritme (+)', en: 'Rhythm Steps (+)' },
        prompt: {
          nl: `Volg de beat: tel steeds +${step} erbij!`,
          en: `Follow the beat: add +${step} each step!`,
        },
        coachTip: {
          nl: `💡 Elke stap is +${step}: ${start + step * 2} + ${step} = ${ans}!`,
          en: `💡 Each step is +${step}: ${start + step * 2} + ${step} = ${ans}!`,
        },
      };
    }

    if (group === 'g4') {
      const step = [2, 3, 4, 5, 6, 8, 10][randInt(0, 6)];
      const start = randInt(1, 20);
      const seq = [start, start + step, start + step * 2, '?' as const];
      const ans = start + step * 3;
      return {
        kind: 'rhythmPattern',
        sequence: seq,
        ruleBadge: { nl: `Ritme +${step}`, en: `Beat +${step}` },
        equationDisplay: `${start} ➔ ${start + step} ➔ ${start + step * 2} ➔ [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 2, ans + 2, ans + step, ans - 1]),
        conceptBadge: { nl: 'Tafel-Sprongen', en: 'Skip-Counting' },
        prompt: {
          nl: `Welk getal komt op het volgende ritme-blok?`,
          en: `Which number lands on the next rhythm pad?`,
        },
        coachTip: {
          nl: `💡 Het patroon is +${step}: ${start + step * 2} + ${step} = ${ans}!`,
          en: `💡 The pattern is +${step}: ${start + step * 2} + ${step} = ${ans}!`,
        },
      };
    }

    if (group === 'g5') {
      const isDouble = Math.random() < 0.35;
      if (isDouble) {
        const mult = Math.random() < 0.75 ? 2 : 3;
        const start = randInt(1, mult === 2 ? 9 : 4);
        const seq = [
          start,
          start * mult,
          start * mult * mult,
          '?' as const,
        ];
        const ans = start * mult * mult * mult;
        return {
          kind: 'rhythmPattern',
          sequence: seq,
          ruleBadge: {
            nl: mult === 2 ? 'Verdubbelen (×2)' : 'Verdrievoudigen (×3)',
            en: mult === 2 ? 'Doubling (×2)' : 'Tripling (×3)',
          },
          equationDisplay: `${start} ➔ ${start * mult} ➔ ${start * mult * mult} ➔ [ ? ]`,
          answer: ans,
          choices: buildUniqueChoices(ans, [
            start * mult * mult + start * mult,
            ans + 2,
            ans - 4,
            ans + start,
          ]),
          conceptBadge: {
            nl: mult === 2 ? 'Verdubbel-Beat (×2)' : 'Factor-Beat (×3)',
            en: mult === 2 ? 'Double Beat (×2)' : 'Triple Beat (×3)',
          },
          prompt: {
            nl: `Elke stap gaat × ${mult}! Wat komt nu?`,
            en: `Each step multiplies by × ${mult}! What comes next?`,
          },
          coachTip: {
            nl: `💡 Vermenigvuldig ${start * mult * mult} met ${mult}: ${start * mult * mult} × ${mult} = ${ans}!`,
            en: `💡 Multiply ${start * mult * mult} by ${mult}: ${start * mult * mult} × ${mult} = ${ans}!`,
          },
        };
      } else {
        const step = randInt(5, 13);
        const start = randInt(2, 22);
        const seq = [start, start + step, start + step * 2, '?' as const];
        const ans = start + step * 3;
        return {
          kind: 'rhythmPattern',
          sequence: seq,
          ruleBadge: { nl: `Patroon +${step}`, en: `Pattern +${step}` },
          equationDisplay: `${start} ➔ ${start + step} ➔ ${start + step * 2} ➔ [ ? ]`,
          answer: ans,
          choices: buildUniqueChoices(ans, [ans - 2, ans + 2, ans + step, ans - 1]),
          conceptBadge: { nl: 'Getallenrij (+)', en: 'Number Sequence (+)' },
          prompt: {
            nl: `Ontdek de sprong en kraak het 4e blok!`,
            en: `Spot the jump and unlock the 4th pad!`,
          },
          coachTip: {
            nl: `💡 Elke sprong is +${step}: ${start + step * 2} + ${step} = ${ans}!`,
            en: `💡 Every jump is +${step}: ${start + step * 2} + ${step} = ${ans}!`,
          },
        };
      }
    }

    if (group === 'g6') {
      // Growing step difference: +b, +2b, +3b, +4b
      const baseDiff = [1, 2, 3, 4, 5][randInt(0, 4)];
      const n0 = randInt(1, 18);
      const n1 = n0 + baseDiff;
      const n2 = n1 + baseDiff * 2;
      const n3 = n2 + baseDiff * 3;
      const ans = n3 + baseDiff * 4;
      return {
        kind: 'rhythmPattern',
        sequence: [n0, n1, n2, n3, '?'],
        ruleBadge: {
          nl: `Groei-sprong (+${baseDiff}, +${baseDiff * 2}, +${baseDiff * 3}...)`,
          en: `Growing jump (+${baseDiff}, +${baseDiff * 2}, +${baseDiff * 3}...)`,
        },
        equationDisplay: `${n0} ➔ ${n1} ➔ ${n2} ➔ ${n3} ➔ [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [
          n3 + baseDiff * 3,
          ans + baseDiff,
          ans - 2,
          ans + 2,
        ]),
        conceptBadge: { nl: 'Groeiend Patroon', en: 'Growing Sequence' },
        prompt: {
          nl: `De sprong wordt elke keer groter! Wat komt na ${n3}?`,
          en: `The jump grows bigger each time! What comes after ${n3}?`,
        },
        coachTip: {
          nl: `💡 Sprongen: +${baseDiff}, +${baseDiff * 2}, +${baseDiff * 3}, dus nu +${baseDiff * 4} → ${n3} + ${baseDiff * 4} = ${ans}!`,
          en: `💡 Jumps: +${baseDiff}, +${baseDiff * 2}, +${baseDiff * 3}, so next is +${baseDiff * 4} → ${n3} + ${baseDiff * 4} = ${ans}!`,
        },
      };
    }

    if (group === 'g7') {
      // Sub-zero countdown sequence crossing 0!
      const step = randInt(3, 12);
      const start = randInt(step + 1, step * 2 - 1);
      const n1 = start - step;
      const n2 = n1 - step; // negative!
      const ans = n2 - step;
      return {
        kind: 'rhythmPattern',
        sequence: [start, n1, n2, '?'],
        ruleBadge: { nl: `Sub-Zero Sprong −${step}`, en: `Sub-Zero Step −${step}` },
        equationDisplay: `${start} ➔ ${n1} ➔ ${n2} ➔ [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 2, ans + 2, -ans, n2 + step], true),
        conceptBadge: { nl: 'Sub-Zero Getallenrij', en: 'Sub-Zero Sequence' },
        prompt: {
          nl: `Tel steeds −${step} verder onder nul!`,
          en: `Keep subtracting −${step} below zero!`,
        },
        coachTip: {
          nl: `💡 ${n2} − ${step} = ${ans}!`,
          en: `💡 ${n2} − ${step} = ${ans}!`,
        },
      };
    }

    // g8: Square Numbers (n²) or Function Machine (×m + c)
    const useSquares = Math.random() < 0.45;
    if (useSquares) {
      const startN = randInt(1, 7 + Math.min(2, streak));
      const n0 = startN * startN;
      const n1 = (startN + 1) * (startN + 1);
      const n2 = (startN + 2) * (startN + 2);
      const n3 = (startN + 3) * (startN + 3);
      const ans = (startN + 4) * (startN + 4);
      return {
        kind: 'rhythmPattern',
        sequence: [n0, n1, n2, n3, '?'],
        ruleBadge: { nl: 'Kwadraten-Reeks (n²)', en: 'Square Numbers (n²)' },
        equationDisplay: `${n0} ➔ ${n1} ➔ ${n2} ➔ ${n3} ➔ [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 4, ans + 5, n3 + (n3 - n2), ans - 2]),
        conceptBadge: { nl: 'Kwadraten-Patroon (n²)', en: 'Squares Pattern (n²)' },
        prompt: {
          nl: `Kwadraten-reeks (${startN}², ${startN + 1}², ${startN + 2}², ${startN + 3}²): wat is (${startN + 4})²?`,
          en: `Square sequence (${startN}², ${startN + 1}², ${startN + 2}², ${startN + 3}²): what is (${startN + 4})²?`,
        },
        coachTip: {
          nl: `💡 (${startN + 4})² = ${startN + 4} × ${startN + 4} = ${ans}!`,
          en: `💡 (${startN + 4})² = ${startN + 4} × ${startN + 4} = ${ans}!`,
        },
      };
    } else {
      const mult = Math.random() < 0.75 ? 2 : 3;
      const add = randInt(1, 5);
      const n0 = randInt(1, mult === 2 ? 7 : 4);
      const n1 = n0 * mult + add;
      const n2 = n1 * mult + add;
      const ans = n2 * mult + add;
      return {
        kind: 'rhythmPattern',
        sequence: [n0, n1, n2, '?'],
        ruleBadge: { nl: `Regel: ×${mult} + ${add}`, en: `Rule: ×${mult} + ${add}` },
        equationDisplay: `${n0} ➔ ${n1} ➔ ${n2} ➔ [ ? ]`,
        answer: ans,
        choices: buildUniqueChoices(ans, [n2 * mult, ans + 2, ans - 2, ans + add]),
        conceptBadge: { nl: `Functie-Regel (×${mult} + c)`, en: `Function Rule (×${mult} + c)` },
        prompt: {
          nl: `Pas de regel (× ${mult} + ${add}) toe op ${n2}!`,
          en: `Apply the rule (× ${mult} + ${add}) to ${n2}!`,
        },
        coachTip: {
          nl: `💡 ${n2} × ${mult} + ${add} = ${n2 * mult} + ${add} = ${ans}!`,
          en: `💡 ${n2} × ${mult} + ${add} = ${n2 * mult} + ${add} = ${ans}!`,
        },
      };
    }
  });
}

/**
 * 10. 🎯 Sussie’s Target Trio (3-Card Combo, Make-100 & Geometry Angles)
 * Scales across g3 -> g8:
 * - g3: 3-Card Trio to 8..15 ([ 4 ] + [ 3 ] + [ ? ] = 10)
 * - g4: Make-10 / Make-20 Trio ([ 6 ] + [ 4 ] + [ ? ] = 18)
 * - g5: Make-100 Trio ([ 35 ] + [ 25 ] + [ ? ] = 100)
 * - g6: Mixed Trio ([ 25 ] + [ 45 ] + [ ? ] = 120)
 * - g7: Triangle Angles 180° ([ 65° ] + [ 45° ] + [ ?° ] = 180°)
 * - g8: Full Circle 360° or Signed Integer Trio ([ -15 ] + [ 35 ] + [ ? ] = 50)
 */
export function generateTargetTrioChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): TargetTrioChallenge {
  return withNonRepeatingChallenge('targetTrio', group, () => {
    if (group === 'g3') {
      const target = randInt(8, 15);
      const c1 = randInt(1, Math.min(6, target - 4));
      const c2 = randInt(1, target - c1 - 2);
      const ans = target - c1 - c2;
      return {
        kind: 'targetTrio',
        cards: [`${c1}`, `${c2}`, '?'],
        targetDisplay: `${target}`,
        equationDisplay: `${c1} + ${c2} + [ ? ] = ${target}`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, c1 + c2]),
        conceptBadge: { nl: `Trio naar ${target}`, en: `Trio to ${target}` },
        prompt: {
          nl: `Maak samen ${target} met 3 kaarten!`,
          en: `Make ${target} with 3 cards!`,
        },
        coachTip: {
          nl: `💡 ${c1} + ${c2} = ${c1 + c2}, en ${c1 + c2} + ${ans} = ${target}!`,
          en: `💡 ${c1} + ${c2} = ${c1 + c2}, and ${c1 + c2} + ${ans} = ${target}!`,
        },
      };
    }

    if (group === 'g4') {
      const baseFriend = Math.random() < 0.65 ? 10 : 20;
      const c1 = randInt(2, baseFriend - 2);
      const c2 = baseFriend - c1;
      const ans = randInt(2, 15);
      const target = baseFriend + ans;
      return {
        kind: 'targetTrio',
        cards: [`${c1}`, `${c2}`, '?'],
        targetDisplay: `${target}`,
        equationDisplay: `${c1} + ${c2} + [ ? ] = ${target}`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ans + 2, baseFriend]),
        conceptBadge: {
          nl: `Vriendjes van ${baseFriend} Trio`,
          en: `Make-${baseFriend} Trio`,
        },
        prompt: {
          nl: `${c1} + ${c2} maakt al ${baseFriend}! Hoeveel erbij voor ${target}?`,
          en: `${c1} + ${c2} makes ${baseFriend}! How much more to reach ${target}?`,
        },
        coachTip: {
          nl: `💡 (${c1} + ${c2}) = ${baseFriend}, en ${baseFriend} + ${ans} = ${target}!`,
          en: `💡 (${c1} + ${c2}) = ${baseFriend}, and ${baseFriend} + ${ans} = ${target}!`,
        },
      };
    }

    if (group === 'g5') {
      const target = 100;
      const useFiveStep = Math.random() < 0.55;
      const c1 = useFiveStep ? randInt(3, 11) * 5 : randInt(15, 52);
      const c2 = useFiveStep ? randInt(2, 7) * 5 : randInt(12, 38);
      const ans = target - c1 - c2;
      return {
        kind: 'targetTrio',
        cards: [`${c1}`, `${c2}`, '?'],
        targetDisplay: '100',
        equationDisplay: `${c1} + ${c2} + [ ? ] = 100`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 10, ans + 10, ans + 5, 100 - c1]),
        conceptBadge: { nl: 'Trio naar 100', en: 'Trio to 100' },
        prompt: {
          nl: `Welke kaart maakt samen precies 100?`,
          en: `Which card completes 100?`,
        },
        coachTip: {
          nl: `💡 ${c1} + ${c2} = ${c1 + c2}, en 100 − ${c1 + c2} = ${ans}!`,
          en: `💡 ${c1} + ${c2} = ${c1 + c2}, and 100 − ${c1 + c2} = ${ans}!`,
        },
      };
    }

    if (group === 'g6') {
      const c1 = randInt(18, 65);
      const c2 = randInt(15, 55);
      const ans = randInt(12, 55);
      const target = c1 + c2 + ans;
      return {
        kind: 'targetTrio',
        cards: [`${c1}`, `${c2}`, '?'],
        targetDisplay: `${target}`,
        equationDisplay: `${c1} + ${c2} + [ ? ] = ${target}`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 5, ans + 5, ans + 10, c1 + c2]),
        conceptBadge: { nl: '3-Kaarten Som', en: '3-Card Target' },
        prompt: {
          nl: `Vind de 3e kaart om ${target} te halen!`,
          en: `Find the 3rd card to hit ${target}!`,
        },
        coachTip: {
          nl: `💡 ${c1} + ${c2} = ${c1 + c2}. Daarna ${target} − ${c1 + c2} = ${ans}!`,
          en: `💡 ${c1} + ${c2} = ${c1 + c2}. Then ${target} − ${c1 + c2} = ${ans}!`,
        },
      };
    }

    if (group === 'g7') {
      // Triangle Angles sum to 180°!
      const a1 = randInt(25, 98);
      const a2 = randInt(25, Math.min(85, 160 - a1));
      const ans = 180 - a1 - a2;
      return {
        kind: 'targetTrio',
        cards: [`${a1}°`, `${a2}°`, '?°'],
        targetDisplay: '180°',
        equationDisplay: `${a1}° + ${a2}° + [ ? ]° = 180°`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 10, ans + 10, ans + 5, 180 - a1]),
        conceptBadge: { nl: 'Driehoek-Hoeken (180°)', en: 'Triangle Angles (180°)' },
        prompt: {
          nl: `De 3 hoeken van een driehoek zijn samen 180°!`,
          en: `The 3 angles of a triangle always add to 180°!`,
        },
        coachTip: {
          nl: `💡 ${a1}° + ${a2}° = ${a1 + a2}°. Dus 180° − ${a1 + a2}° = ${ans}°!`,
          en: `💡 ${a1}° + ${a2}° = ${a1 + a2}°. So 180° − ${a1 + a2}° = ${ans}°!`,
        },
      };
    }

    // g8: Full 360° Star Rotation or Sub-Zero Integer Trio
    const isAngle = Math.random() < 0.55;
    if (isAngle) {
      const a1 = randInt(70, 175);
      const a2 = randInt(65, Math.min(155, 325 - a1));
      const ans = 360 - a1 - a2;
      return {
        kind: 'targetTrio',
        cards: [`${a1}°`, `${a2}°`, '?°'],
        targetDisplay: '360°',
        equationDisplay: `${a1}° + ${a2}° + [ ? ]° = 360°`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 10, ans + 10, ans + 15, 360 - a1]),
        conceptBadge: { nl: 'Volle Cirkel (360°)', en: 'Full Circle (360°)' },
        prompt: {
          nl: `Een volle cirkel is 360°! Bereken de ontbrekende hoek:`,
          en: `A full circle is 360°! Find the missing angle:`,
        },
        coachTip: {
          nl: `💡 ${a1}° + ${a2}° = ${a1 + a2}°. Dus 360° − ${a1 + a2}° = ${ans}°!`,
          en: `💡 ${a1}° + ${a2}° = ${a1 + a2}°. So 360° − ${a1 + a2}° = ${ans}°!`,
        },
      };
    } else {
      const c1 = -randInt(6, 28 + Math.min(8, streak));
      const c2 = randInt(12, 42);
      const ans = randInt(8, 36);
      const target = c1 + c2 + ans;
      return {
        kind: 'targetTrio',
        cards: [`${c1}`, `+${c2}`, '?'],
        targetDisplay: `${target}`,
        equationDisplay: `(${c1}) + ${c2} + [ ? ] = ${target}`,
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 4, ans + 4, ans - c1, target - c2], true),
        conceptBadge: { nl: 'Sub-Zero Trio', en: 'Sub-Zero Trio' },
        prompt: {
          nl: `Reken eerst (${c1}) + ${c2} uit en vul aan tot ${target}!`,
          en: `First find (${c1}) + ${c2}, then complete to ${target}!`,
        },
        coachTip: {
          nl: `💡 (${c1}) + ${c2} = ${c1 + c2}. Daarna ${target} − ${c1 + c2} = ${ans}!`,
          en: `💡 (${c1}) + ${c2} = ${c1 + c2}. Then ${target} − ${c1 + c2} = ${ans}!`,
        },
      };
    }
  });
}

function gcdTwo(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcmTwo(a: number, b: number): number {
  return Math.abs(a * b) / gcdTwo(a, b);
}

function getPositiveFactors(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) out.push(i);
  }
  return out;
}

function getPrimeFactorsExpr(n: number): string {
  if (n < 2) return String(n);
  const factors: number[] = [];
  let rem = n;
  for (let d = 2; d * d <= rem; d++) {
    while (rem % d === 0) {
      factors.push(d);
      rem = Math.floor(rem / d);
    }
  }
  if (rem > 1) factors.push(rem);
  return factors.join(' × ');
}

function buildMultiplesTrack(step: number, targetLcm: number, maxCount = 8): number[] {
  const stepsNeeded = Math.min(maxCount, Math.max(4, Math.round(targetLcm / step) + 1));
  const out: number[] = [];
  for (let i = 1; i <= stepsNeeded; i++) {
    out.push(step * i);
  }
  if (!out.includes(targetLcm)) {
    out[out.length - 1] = targetLcm;
  }
  return out;
}

const HCF_POOLS: Record<'g5' | 'g6' | 'g7' | 'g8', ([number, number] | [number, number, number])[]> = {
  g5: [
    [4, 6], [4, 8], [4, 10], [6, 8], [6, 9], [6, 10], [6, 12], [6, 15],
    [8, 10], [8, 12], [8, 16], [8, 20], [9, 12], [9, 15], [9, 18], [10, 15],
    [10, 20], [10, 25], [12, 15], [12, 16], [12, 18], [12, 20], [14, 21], [15, 20],
    [15, 25], [16, 20], [16, 24], [18, 24], [20, 25], [20, 30], [12, 24], [18, 30],
  ],
  g6: [
    [12, 16], [12, 18], [12, 20], [12, 28], [12, 30], [14, 21], [14, 28], [14, 35],
    [15, 20], [15, 25], [15, 35], [16, 24], [16, 36], [16, 40], [18, 24], [18, 27],
    [18, 30], [18, 45], [20, 28], [20, 30], [20, 35], [21, 28], [21, 35], [24, 32],
    [24, 36], [24, 40], [27, 36], [28, 42], [30, 45], [32, 48], [36, 48], [40, 50],
  ],
  g7: [
    [18, 42], [21, 49], [24, 36], [24, 40], [24, 56], [24, 60], [27, 45], [28, 42],
    [28, 70], [30, 42], [30, 45], [30, 75], [32, 48], [32, 56], [35, 49], [36, 48],
    [36, 54], [36, 60], [40, 56], [40, 64], [42, 56], [42, 63], [42, 70], [45, 60],
    [45, 75], [48, 64], [48, 72], [54, 72], [56, 84], [60, 84], [63, 81], [64, 96],
  ],
  g8: [
    [12, 18, 24], [12, 20, 28], [14, 21, 35], [15, 25, 40], [15, 30, 45], [16, 24, 32],
    [16, 24, 40], [18, 27, 36], [18, 27, 45], [18, 30, 42], [20, 30, 50], [21, 28, 42],
    [24, 36, 48], [24, 36, 60], [24, 40, 56], [27, 36, 54], [28, 42, 56], [30, 45, 60],
    [30, 45, 75], [32, 48, 64], [36, 54, 72], [40, 60, 80], [42, 63, 84], [48, 72, 96],
    [48, 80], [54, 90], [56, 98], [60, 96], [63, 105], [72, 108], [75, 120], [84, 126],
  ],
};

const LCM_POOLS: Record<'g5' | 'g6' | 'g7' | 'g8', ([number, number] | [number, number, number])[]> = {
  g5: [
    [2, 3], [2, 5], [2, 7], [2, 9], [3, 4], [3, 5], [3, 6], [3, 7],
    [3, 8], [3, 9], [3, 10], [4, 5], [4, 6], [4, 8], [4, 10], [4, 12],
    [5, 6], [5, 8], [5, 10], [5, 15], [6, 8], [6, 9], [6, 10], [6, 12],
    [6, 15], [8, 10], [8, 12], [9, 12], [10, 15], [10, 20], [4, 7], [5, 7],
  ],
  g6: [
    [3, 7], [3, 8], [4, 6], [4, 7], [4, 9], [4, 10], [5, 6], [5, 7],
    [5, 8], [5, 9], [6, 8], [6, 9], [6, 10], [6, 14], [6, 15], [7, 8],
    [7, 14], [8, 10], [8, 12], [8, 16], [8, 20], [9, 12], [9, 15], [9, 18],
    [10, 12], [10, 15], [10, 25], [12, 15], [12, 16], [12, 18], [12, 20], [15, 20],
  ],
  g7: [
    [6, 14], [6, 16], [7, 9], [8, 10], [8, 12], [8, 14], [8, 18], [8, 20],
    [9, 12], [9, 15], [9, 21], [10, 12], [10, 14], [10, 15], [10, 16], [12, 14],
    [12, 15], [12, 16], [12, 18], [12, 20], [12, 30], [14, 21], [15, 20], [15, 25],
    [16, 20], [16, 24], [18, 24], [18, 30], [20, 25], [20, 30], [24, 36], [25, 30],
  ],
  g8: [
    [2, 3, 4], [2, 3, 5], [2, 4, 6], [2, 5, 6], [3, 4, 5], [3, 4, 6],
    [3, 5, 6], [3, 6, 9], [4, 5, 10], [4, 6, 8], [4, 6, 9], [4, 6, 12],
    [4, 8, 12], [5, 6, 10], [5, 6, 15], [5, 10, 15], [6, 8, 12], [6, 9, 18],
    [6, 10, 15], [8, 10, 20], [8, 12, 16], [8, 12, 24], [9, 12, 18], [10, 12, 15],
    [12, 16], [14, 21], [15, 18], [16, 20], [16, 24], [18, 24], [20, 24], [24, 32],
  ],
};

/**
 * 11. 🎸 GGD & KGV Beat-Sync Studio (HCF & LCM Lab — Groep 5 to Groep 8)
 * - Specially designed for Groep 5 and above (g5, g6, g7, g8).
 * - If called with g3 or g4, automatically upgrades to g5 starter level.
 * - Teaches both:
 *   1. GGD / HCF (Grootste Gemene Deler / Highest Common Factor) via visual Factor Crystal Ribbons & Shared Divisors
 *   2. KGV / LCM (Kleinste Gemene Veelvoud / Lowest Common Multiple) via Dual/Triple Idol Skip-Count Beat Tracks
 */
export function generateHcfLcmChallenge(
  group: SchoolGroupId = 'g5',
  _streak = 0,
  modeFilter: 'all' | 'hcf' | 'lcm' = 'all'
): HcfLcmChallenge {
  const effectiveGroup: 'g5' | 'g6' | 'g7' | 'g8' =
    group === 'g3' || group === 'g4' ? 'g5' : group;

  return withNonRepeatingChallenge('hcfLcm', effectiveGroup, () => {
    const mode: 'hcf' | 'lcm' =
      modeFilter === 'all'
        ? Math.random() < 0.5
          ? 'hcf'
          : 'lcm'
        : modeFilter;

    const pool = mode === 'hcf' ? HCF_POOLS[effectiveGroup] : LCM_POOLS[effectiveGroup];
    const picked = pool[randInt(0, pool.length - 1)];
    const [a, b, c] = picked;

    const factorsA = getPositiveFactors(a);
    const factorsB = getPositiveFactors(b);
    const factorsC = c !== undefined ? getPositiveFactors(c) : undefined;

    const commonFactors = factorsA.filter(
      (f) => factorsB.includes(f) && (factorsC === undefined || factorsC.includes(f))
    );

    const hcfVal = c !== undefined ? gcdTwo(gcdTwo(a, b), c) : gcdTwo(a, b);
    const lcmVal = c !== undefined ? lcmTwo(lcmTwo(a, b), c) : lcmTwo(a, b);

    const trackA = buildMultiplesTrack(a, lcmVal, 8);
    const trackB = buildMultiplesTrack(b, lcmVal, 8);
    const trackC = c !== undefined ? buildMultiplesTrack(c, lcmVal, 8) : undefined;

    const numsLabel = c !== undefined ? `${a}, ${b}, ${c}` : `${a}, ${b}`;
    const primeBreakdown =
      c !== undefined
        ? `${a} = ${getPrimeFactorsExpr(a)}  •  ${b} = ${getPrimeFactorsExpr(b)}  •  ${c} = ${getPrimeFactorsExpr(c)}`
        : `${a} = ${getPrimeFactorsExpr(a)}  •  ${b} = ${getPrimeFactorsExpr(b)}`;

    if (mode === 'hcf') {
      const ans = hcfVal;
      const secondLargestCommon =
        commonFactors.length >= 2 ? commonFactors[commonFactors.length - 2] : 1;
      const distractorPool = [
        secondLargestCommon,
        Math.min(a, b),
        ans * 2,
        ans + 2,
        Math.max(1, ans - 1),
        lcmVal,
      ].filter((v) => v >= 1 && v !== ans);

      const choices = buildUniqueChoices(ans, distractorPool, false);
      const divisionCheck =
        c !== undefined
          ? `${a} ÷ ${ans} = ${a / ans}, ${b} ÷ ${ans} = ${b / ans}, ${c} ÷ ${ans} = ${c / ans}`
          : `${a} ÷ ${ans} = ${a / ans} & ${b} ÷ ${ans} = ${b / ans}`;

      return {
        kind: 'hcfLcm',
        mode: 'hcf',
        effectiveGroup,
        numbers: picked,
        equationDisplayNl: `GGD(${numsLabel}) = [ ? ]`,
        equationDisplayEn: `HCF(${numsLabel}) = [ ? ]`,
        factorsA,
        factorsB,
        factorsC,
        commonFactors,
        trackA,
        trackB,
        trackC,
        primeBreakdownNl: `Priemblokjes: ${primeBreakdown}`,
        primeBreakdownEn: `Prime blocks: ${primeBreakdown}`,
        stepByStepNl: [
          `1️⃣ Zoek alle delers van ${numsLabel}.`,
          `2️⃣ Gedeelde delers: ${commonFactors.join(', ')}.`,
          `3️⃣ De grootste gedeelde deler (GGD) is ${ans} (${divisionCheck})!`,
        ],
        stepByStepEn: [
          `1️⃣ List the factors of ${numsLabel}.`,
          `2️⃣ Common factors shared by all: ${commonFactors.join(', ')}.`,
          `3️⃣ The Highest Common Factor (HCF) is ${ans} (${divisionCheck})!`,
        ],
        answer: ans,
        choices,
        conceptBadge: {
          nl: c !== undefined ? 'GGD van 3 Getallen (Gr 8)' : `GGD • Grootste Gemene Deler (${effectiveGroup.toUpperCase()})`,
          en: c !== undefined ? '3-Number HCF (Gr 8)' : `HCF • Highest Common Factor (${effectiveGroup.toUpperCase()})`,
        },
        prompt: {
          nl: `Wat is de GGD (Grootste Gemene Deler) van ${numsLabel}?`,
          en: `What is the HCF (Highest Common Factor) of ${numsLabel}?`,
        },
        coachTip: {
          nl: `💡 Gedeelde delers zijn [${commonFactors.join(', ')}]. De grootste is ${ans} (${divisionCheck})!`,
          en: `💡 Common factors are [${commonFactors.join(', ')}]. The highest is ${ans} (${divisionCheck})!`,
        },
      };
    }

    // LCM mode ('lcm')
    const ans = lcmVal;
    const sumNums = c !== undefined ? a + b + c : a + b;
    const rawProduct = c !== undefined ? a * b : a * b;
    const distractorPool = [
      ans * 2,
      Math.max(a, b, c ?? 0),
      rawProduct !== ans ? rawProduct : ans + a,
      ans + b,
      Math.max(2, ans - a),
      sumNums,
      hcfVal > 1 ? hcfVal : ans + 2,
    ].filter((v) => v >= 2 && v !== ans);

    const choices = buildUniqueChoices(ans, distractorPool, false);
    const multCheck =
      c !== undefined
        ? `${a} × ${ans / a} = ${ans}, ${b} × ${ans / b} = ${ans}, ${c} × ${ans / c} = ${ans}`
        : `${a} × ${ans / a} = ${ans} & ${b} × ${ans / b} = ${ans}`;

    return {
      kind: 'hcfLcm',
      mode: 'lcm',
      effectiveGroup,
      numbers: picked,
      equationDisplayNl: `KGV(${numsLabel}) = [ ? ]`,
      equationDisplayEn: `LCM(${numsLabel}) = [ ? ]`,
      factorsA,
      factorsB,
      factorsC,
      commonFactors,
      trackA,
      trackB,
      trackC,
      primeBreakdownNl: `Priemblokjes: ${primeBreakdown}`,
      primeBreakdownEn: `Prime blocks: ${primeBreakdown}`,
      stepByStepNl: [
        `1️⃣ Spring in veelvouden (tafels) van ${numsLabel}.`,
        `2️⃣ Kijk waar de sprong-sporen voor het eerst op hetzelfde getal landen.`,
        `3️⃣ Het Kleinste Gemene Veelvoud (KGV) is ${ans} (${multCheck})!`,
      ],
      stepByStepEn: [
        `1️⃣ Skip-count along the multiples of ${numsLabel}.`,
        `2️⃣ Spot the first number where all rhythm tracks land together.`,
        `3️⃣ The Lowest Common Multiple (LCM) is ${ans} (${multCheck})!`,
      ],
      answer: ans,
      choices,
      conceptBadge: {
        nl: c !== undefined ? 'KGV van 3 Getallen (Gr 8)' : `KGV • Kleinste Gemene Veelvoud (${effectiveGroup.toUpperCase()})`,
        en: c !== undefined ? '3-Number LCM (Gr 8)' : `LCM • Lowest Common Multiple (${effectiveGroup.toUpperCase()})`,
      },
      prompt: {
        nl: `Wat is het KGV (Kleinste Gemene Veelvoud) van ${numsLabel}?`,
        en: `What is the LCM (Lowest Common Multiple) of ${numsLabel}?`,
      },
      coachTip: {
        nl: `💡 Eerste gezamenlijke veelvoud is ${ans} (${multCheck})!`,
        en: `💡 First shared multiple on the beat track is ${ans} (${multCheck})!`,
      },
    };
  });
}

export function generateTangChallenge(
  gameId: TangMiniGameId,
  group: SchoolGroupId = 'g5',
  streak = 0
): TangChallenge {
  if (gameId === 'sodaBubbles') return generateBubblePopChallenge(group, streak);
  if (gameId === 'numberLine') return generateNumberLineChallenge(group, streak);
  if (gameId === 'subZero') return generateSubZeroChallenge(group, streak);
  if (gameId === 'missingRune') return generateMissingRuneChallenge(group, streak);
  if (gameId === 'breakApart') return generateBreakApartChallenge(group, streak);
  if (gameId === 'stageGrid') return generateStageGridChallenge(group, streak);
  if (gameId === 'soulScale') return generateSoulScaleChallenge(group, streak);
  if (gameId === 'rhythmPattern') return generateRhythmPatternChallenge(group, streak);
  if (gameId === 'targetTrio') return generateTargetTrioChallenge(group, streak);
  if (gameId === 'hcfLcm') return generateHcfLcmChallenge(group, streak);
  return generatePowerLabChallenge(group, streak);
}

/**
 * Converts ANY missed Arcade challenge into a Dojo TrickyFactItem so all mistakes
 * are sent to the HUNTR/X Number Dojo for targeted review and mastery!
 */
export function challengeToTrickyFact(ch: TangChallenge): TrickyFactItem {
  if (ch.kind === 'sodaBubbles') {
    const b0 = ch.bubbles.find((b) => b.id === ch.solutionPairIds[0])?.value ?? 0;
    const b1 = ch.bubbles.find((b) => b.id === ch.solutionPairIds[1])?.value ?? 0;
    const op: Operation = ch.op === '×' ? '×' : '+';
    const choices = buildUniqueChoices(ch.target, [
      ch.target - 2,
      ch.target + 2,
      ch.target + 4,
      b0 + b1 + 1,
    ], ch.target < 0).map(String);
    return {
      id: `arcade_bub_${ch.op}_${b0}_${b1}_${ch.target}`,
      aLabel: String(b0),
      bLabel: String(b1),
      targetLabel: String(ch.target),
      op,
      choices,
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'numberLine') {
    const op: Operation = ch.jumpVal < 0 ? '−' : '+';
    if (ch.mode !== 'land') {
      return {
        id: `arcade_line_${ch.mode}_${ch.startVal}_${ch.endVal}_${ch.answer}`,
        aLabel: ch.questionEquation.replace('= [ ? ]', '').trim(),
        bLabel: '?',
        targetLabel: String(ch.answer),
        op,
        choices: ch.choices.map(String),
        hintNl: ch.coachTip.nl,
        hintEn: ch.coachTip.en,
      };
    }
    return {
      id: `arcade_line_${ch.startVal}_${ch.jumpVal}_${ch.endVal}`,
      aLabel: String(ch.startVal),
      bLabel: String(Math.abs(ch.jumpVal)),
      targetLabel: String(ch.answer),
      op,
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'subZero') {
    const op: Operation = ch.equationDisplay.includes('÷')
      ? '÷'
      : ch.equationDisplay.includes('×')
        ? '×'
        : ch.deltaTemp < 0
          ? '−'
          : '+';
    return {
      id: `arcade_subzero_${ch.currentTemp}_${ch.deltaTemp}_${ch.answer}`,
      aLabel: String(ch.currentTemp),
      bLabel: String(Math.abs(ch.deltaTemp)),
      targetLabel: String(ch.answer),
      op,
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'missingRune') {
    const op: Operation = ch.equationDisplay.includes('÷')
      ? '÷'
      : ch.equationDisplay.includes('×')
        ? '×'
        : ch.equationDisplay.includes('−')
          ? '−'
          : '+';
    return {
      id: `arcade_rune_${ch.equationDisplay.replace(/\s+/g, '')}`,
      aLabel: ch.equationDisplay.replace('= [ ? ]', '').trim(),
      bLabel: '?',
      targetLabel: String(ch.answer),
      op,
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'breakApart') {
    const op: Operation = ch.fullEquation.includes('÷')
      ? '÷'
      : ch.fullEquation.includes('×')
        ? '×'
        : '+';
    return {
      id: `arcade_split_${ch.fullEquation.replace(/\s+/g, '')}_${ch.answer}`,
      aLabel: ch.bridgeDisplay,
      bLabel: '?',
      targetLabel: String(ch.answer),
      op,
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'stageGrid') {
    const op: Operation = ch.mode === 'perimeter' ? '+' : ch.mode === 'missingSide' ? '÷' : '×';
    return {
      id: `arcade_grid_${ch.mode}_${ch.rows}_${ch.cols}_${ch.answer}`,
      aLabel: ch.visualFormula.replace('= [ ? ]', '').trim(),
      bLabel: '?',
      targetLabel: String(ch.answer),
      op,
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'soulScale') {
    return {
      id: `arcade_scale_${ch.equationDisplay.replace(/\s+/g, '')}_${ch.answer}`,
      aLabel: ch.equationDisplay,
      bLabel: '?',
      targetLabel: String(ch.answer),
      op: '+',
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'rhythmPattern') {
    return {
      id: `arcade_pattern_${ch.equationDisplay.replace(/\s+/g, '')}_${ch.answer}`,
      aLabel: ch.equationDisplay.replace('➔ [ ? ]', '').trim(),
      bLabel: '?',
      targetLabel: String(ch.answer),
      op: '+',
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'targetTrio') {
    return {
      id: `arcade_trio_${ch.equationDisplay.replace(/\s+/g, '')}_${ch.answer}`,
      aLabel: ch.equationDisplay.replace('= ' + ch.targetDisplay, '').trim(),
      bLabel: ch.targetDisplay,
      targetLabel: String(ch.answer),
      op: '+',
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  if (ch.kind === 'hcfLcm') {
    const op: Operation = ch.mode === 'hcf' ? '÷' : '×';
    return {
      id: `arcade_hcflcm_${ch.mode}_${ch.numbers.join('_')}_${ch.answer}`,
      aLabel: ch.equationDisplayEn.replace('= [ ? ]', '').trim(),
      bLabel: '?',
      targetLabel: String(ch.answer),
      op,
      choices: ch.choices.map(String),
      hintNl: ch.coachTip.nl,
      hintEn: ch.coachTip.en,
    };
  }

  // powerLab
  return {
    id: `arcade_lab_${ch.visualFormula.replace(/\s+/g, '')}_${ch.answer}`,
    aLabel: (ch.visualFormulaEn ?? ch.visualFormula)
      .replace('= [ ? ]m', '')
      .replace('= [ ? ]', '')
      .replace('≈ [ ? ]', '')
      .trim(),
    bLabel: '?',
    targetLabel: String(ch.answer),
    op: '+',
    choices: ch.choices.map(String),
    hintNl: ch.coachTip.nl,
    hintEn: ch.coachTip.en,
  };
}

/**
 * Localizes any saved formula/equation label between Dutch and English
 * (e.g., for Dojo review items saved in a previous language session).
 */
export function localizeFormulaLabel(label: string, lang: 'nl' | 'en'): string {
  if (lang === 'en') {
    return label
      .replace(/\bGGD\(/g, 'HCF(')
      .replace(/\bKGV\(/g, 'LCM(')
      .replace(/\bGemiddelde\b/g, 'Mean')
      .replace(/\bMidden:/g, 'Midpoint:')
      .replace(/\bOmtrek:/g, 'Perimeter:')
      .replace(/\bDubbel\b/g, 'Double')
      .replace(/\bvan\b/g, 'of');
  }
  return label
    .replace(/\bHCF\(/g, 'GGD(')
    .replace(/\bLCM\(/g, 'KGV(')
    .replace(/\bMean\b/g, 'Gemiddelde')
    .replace(/\bMidpoint:/g, 'Midden:')
    .replace(/\bPerimeter:/g, 'Omtrek:')
    .replace(/\bDouble\b/g, 'Dubbel')
    .replace(/\bof\b/g, 'van');
}
