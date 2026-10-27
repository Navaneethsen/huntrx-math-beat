import type { SchoolGroupId, TrickyFactItem } from './progressionStore';
import type { Operation } from './kakoomaGenerator';

export type TangMiniGameId =
  | 'sodaBubbles'
  | 'numberLine'
  | 'subZero'
  | 'missingRune'
  | 'breakApart'
  | 'powerLab';

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
  visualBar?: { filled: number; total: number; label: string };
  answer: number;
  choices: number[];
  prompt: { nl: string; en: string };
  coachTip: { nl: string; en: string };
}

export type TangChallenge =
  | BubblePopChallenge
  | NumberLineChallenge
  | SubZeroChallenge
  | MissingRuneChallenge
  | BreakApartChallenge
  | PowerLabChallenge;

const BUBBLE_COLORS = [
  'from-pink-500 to-rose-500',
  'from-cyan-400 to-blue-500',
  'from-amber-400 to-orange-500',
  'from-purple-500 to-fuchsia-600',
  'from-emerald-400 to-teal-500',
  'from-violet-500 to-indigo-600',
];

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
  const streakBoost = Math.min(streak, 8);
  const useMult =
    group !== 'g3' &&
    ((group === 'g4' && Math.random() < 0.35) ||
      ((group === 'g5' || group === 'g6' || group === 'g7' || group === 'g8') &&
        Math.random() < 0.5));

  if (!useMult) {
    let target = 10;
    let a = 6;
    let b = 4;
    let badgeNl = 'Getalbegrip (+)';
    let badgeEn = 'Number Bonds (+)';

    if (group === 'g3') {
      target = randInt(6 + Math.floor(streakBoost / 3), 10 + Math.floor(streakBoost / 2));
      a = randInt(2, target - 2);
      b = target - a;
      badgeNl = 'Splitsen t/m 10';
      badgeEn = 'Bonds to 10';
    } else if (group === 'g4') {
      target = randInt(12 + streakBoost, 22 + streakBoost);
      a = randInt(4, target - 4);
      b = target - a;
      badgeNl = 'Over het Tiental (+)';
      badgeEn = 'Bridge 10 (+)';
    } else if (group === 'g5') {
      target = randInt(25 + streakBoost * 2, 55 + streakBoost * 2);
      a = randInt(8, target - 8);
      b = target - a;
      badgeNl = 'Hoofdrekenen t/m 60';
      badgeEn = 'Mental Sums to 60';
    } else if (group === 'g6') {
      target = randInt(55 + streakBoost * 3, 110 + streakBoost * 4);
      a = randInt(14, target - 14);
      b = target - a;
      badgeNl = 'Grote Getallen (+)';
      badgeEn = 'Big Sums (+)';
    } else if (group === 'g7') {
      // Negative + Positive integer bubble pairs!
      a = -randInt(3, 14 + streakBoost);
      b = randInt(18, 36 + streakBoost * 2);
      target = a + b;
      badgeNl = 'Negatieve & Positieve Getallen';
      badgeEn = 'Negative & Positive Integers';
    } else {
      // g8: Deep Sub-Zero & Integer sums (can be negative target or positive target)
      const negativeTarget = Math.random() < 0.45;
      if (negativeTarget) {
        a = -randInt(12, 28 + streakBoost * 2);
        b = randInt(4, Math.abs(a) - 3);
        target = a + b; // negative target!
      } else {
        a = -randInt(9, 25 + streakBoost * 2);
        b = randInt(30, 65 + streakBoost * 3);
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
          ? randInt(-25, 55)
          : randInt(1, Math.max(9, target + 5));
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
      color: BUBBLE_COLORS[idx % BUBBLE_COLORS.length],
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
      const tables = [2, 5, 10];
      a = tables[randInt(0, tables.length - 1)];
      b = randInt(2, 6 + Math.min(4, streakBoost));
      badgeNl = 'Tafels 2×, 5×, 10×';
      badgeEn = '2×, 5×, 10× Tables';
    } else if (group === 'g5') {
      const tables = [2, 3, 4, 5, 8, 10];
      a = tables[randInt(0, tables.length - 1)];
      b = randInt(3, 9);
      badgeNl = 'Kern-Tafels (×)';
      badgeEn = 'Core Tables (×)';
    } else if (group === 'g6') {
      const tables = [6, 7, 8, 9, 11, 12];
      a = tables[randInt(0, tables.length - 1)];
      b = randInt(4, 12);
      badgeNl = 'Grote Tafels 6×–12×';
      badgeEn = 'Master Tables 6×–12×';
    } else if (group === 'g7') {
      a = randInt(11, 16 + Math.min(4, streakBoost));
      b = randInt(3, 8);
      badgeNl = 'Grote Factoren (×)';
      badgeEn = 'Multi-Digit Factors (×)';
    } else {
      // g8: either negative factor pairs or big 2-digit × 1-digit
      if (Math.random() < 0.45) {
        a = -randInt(4, 11);
        b = Math.random() < 0.5 ? -randInt(4, 9) : randInt(4, 9);
        badgeNl = 'Negatieve Factoren (×)';
        badgeEn = 'Negative Factors (×)';
      } else {
        a = randInt(12, 22);
        b = randInt(4, 9);
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
        group === 'g8' && (a < 0 || b < 0)
          ? randInt(-12, 12)
          : randInt(2, Math.max(15, Math.abs(a) + 4));
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
      color: BUBBLE_COLORS[idx % BUBBLE_COLORS.length],
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
  const buildTicks = (min: number, max: number, step: number): number[] => {
    const out: number[] = [];
    for (let v = min; v <= max; v += step) out.push(v);
    return out;
  };

  if (group === 'g3') {
    const min = 0;
    const max = 10;
    const step = 1;
    const isAdd = Math.random() < 0.6;
    const startVal = isAdd ? randInt(1, 5) : randInt(5, 10);
    const jumpVal = isAdd ? randInt(2, 10 - startVal) : -randInt(2, startVal - 1);
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
      choices: buildUniqueChoices(endVal, [endVal - 1, endVal + 1, endVal + 2, startVal]),
      conceptBadge: { nl: 'Getallenlijn 0–10', en: 'Number Line 0–10' },
      prompt: {
        nl: `Waar landt Rumi’s sprong op de getallenlijn?`,
        en: `Where does Rumi’s laser jump land on the number line?`,
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
    const askJump = streak >= 2 && Math.random() < 0.45;
    const startVal = randInt(5, 9);
    const endVal = randInt(12, 18);
    const jumpVal = endVal - startVal;
    const answer = askJump ? jumpVal : endVal;
    const eq = askJump
      ? `${startVal} + [ ? ] = ${endVal}`
      : `${startVal} + ${jumpVal} = [ ? ]`;

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
      choices: buildUniqueChoices(answer, [answer - 1, answer + 1, answer + 2, 10]),
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
        nl: `💡 Eerst van ${startVal} naar 10 (+${10 - startVal}), en dan nog +${endVal - 10} = ${endVal}!`,
        en: `💡 First hop from ${startVal} to 10 (+${10 - startVal}), then +${endVal - 10} = ${endVal}!`,
      },
    };
  }

  if (group === 'g5') {
    const min = 0;
    const max = 100;
    const step = 10;
    const isMidpoint = Math.random() < 0.35;
    if (isMidpoint) {
      const startVal = randInt(1, 3) * 10;
      const endVal = startVal + randInt(2, 3) * 20; // even gap so midpoint is multiple of 10
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
        answer: mid,
        choices: buildUniqueChoices(mid, [mid - 10, mid + 10, mid + 20, startVal + 10]),
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

    const startVal = randInt(15, 55);
    const jumpVal = randInt(2, 4) * 10;
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
      questionEquation: `${startVal} + ${jumpVal} = [ ? ]`,
      answer: endVal,
      choices: buildUniqueChoices(endVal, [endVal - 10, endVal + 10, endVal - 5, endVal + 5]),
      conceptBadge: { nl: 'Tiental-Sprongen 0–100', en: 'Tens Jumps 0–100' },
      prompt: {
        nl: `Spring +${jumpVal} verder vanaf ${startVal}!`,
        en: `Jump +${jumpVal} forward from ${startVal}!`,
      },
      coachTip: {
        nl: `💡 Tel ${jumpVal / 10} tientallen bij ${startVal}: ${startVal} + ${jumpVal} = ${endVal}!`,
        en: `💡 Add ${jumpVal / 10} tens to ${startVal}: ${startVal} + ${jumpVal} = ${endVal}!`,
      },
    };
  }

  if (group === 'g6') {
    // Negative number line -10 to +10 crossing zero!
    const min = -10;
    const max = 10;
    const step = 2;
    const goRight = Math.random() < 0.55;
    const startVal = goRight ? -randInt(2, 8) : randInt(2, 8);
    const endVal = goRight ? randInt(2, 8) : -randInt(2, 8);
    const jumpVal = endVal - startVal;
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
      choices: buildUniqueChoices(
        endVal,
        [-endVal, endVal - 2, endVal + 2, endVal + 1],
        true
      ),
      conceptBadge: { nl: 'Over Nul (−10 tot +10)', en: 'Across Zero (−10 to +10)' },
      prompt: {
        nl: `Spring over 0 op de Honmoon-lijn: waar land je?`,
        en: `Jump across 0 on the Honmoon line: where do you land?`,
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
    const askJump = Math.random() < 0.45;
    const startVal = -randInt(1, 4) * 5; // -5, -10, -15, -20
    const endVal = randInt(1, 4) * 5; // 5, 10, 15, 20
    const jumpVal = endVal - startVal;
    const answer = askJump ? jumpVal : endVal;
    const eq = askJump
      ? `${startVal} + [ ? ] = ${endVal}`
      : `${startVal} + ${jumpVal} = [ ? ]`;

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
          : `Waar landt de laser vanaf ${startVal} met sprong +${jumpVal}?`,
        en: askJump
          ? `How many steps from ${startVal} across 0 to +${endVal}?`
          : `Where does the laser land from ${startVal} with jump +${jumpVal}?`,
      },
      coachTip: {
        nl: `💡 Afstand tot 0 is ${Math.abs(startVal)}, plus ${endVal} voorbij 0: ${Math.abs(startVal)} + ${endVal} = ${jumpVal}!`,
        en: `💡 Distance to 0 is ${Math.abs(startVal)}, plus ${endVal} past 0: ${Math.abs(startVal)} + ${endVal} = ${jumpVal}!`,
      },
    };
  }

  // g8: -50 to +50 (step 10), midpoints & large negative jumps
  const min = -50;
  const max = 50;
  const step = 10;
  const isMidpoint = Math.random() < 0.4;
  if (isMidpoint) {
    const startVal = -randInt(2, 4) * 10; // -20, -30, -40
    const endVal = randInt(1, 3) * 10 * (Math.abs(startVal / 10) % 2 === 0 ? 2 : 1);
    const evenEnd = (startVal + endVal) % 2 === 0 ? endVal : endVal + 10;
    const mid = (startVal + evenEnd) / 2;
    return {
      kind: 'numberLine',
      min,
      max,
      step,
      ticks: buildTicks(min, max, step),
      startVal,
      endVal: evenEnd,
      jumpVal: mid - startVal,
      mode: 'midpoint',
      questionEquation: `Midden: ${startVal} ↔ +${evenEnd} = [ ? ]`,
      answer: mid,
      choices: buildUniqueChoices(mid, [-mid, mid - 5, mid + 5, mid + 10], true),
      conceptBadge: { nl: 'Sub-Zero Midden (−50 tot +50)', en: 'Sub-Zero Midpoint (−50 to +50)' },
      prompt: {
        nl: `Wat ligt precies midden tussen ${startVal} en +${evenEnd}?`,
        en: `What is halfway between ${startVal} and +${evenEnd}?`,
      },
      coachTip: {
        nl: `💡 Tel bij elkaar op en deel door 2: (${startVal} + ${evenEnd}) ÷ 2 = ${mid}!`,
        en: `💡 Add and divide by 2: (${startVal} + ${evenEnd}) ÷ 2 = ${mid}!`,
      },
    };
  }

  const startVal = randInt(15, 40);
  const jumpVal = -randInt(35, 75);
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
}

/**
 * 3. ❄️ Gwi-Ma Sub-Zero Portaal (Negative Numbers & Thermometer/Portal)
 * Scales across g3 -> g8:
 * - g3: Countdown to 0 (0° to 10°)
 * - g4: First steps below zero (-5° to +10°)
 * - g5: Thermometer drops & rises across zero (-10° to +15°)
 * - g6: Sub-zero addition & subtraction (-20° to +20°)
 * - g7: Deep sub-zero & subtracting a negative (-a - (-b) = -a + b)
 * - g8: Full negative integers: (-a) × (-b), (-a) ÷ b, and multi-step sub-zero
 */
export function generateSubZeroChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): SubZeroChallenge {
  const boost = Math.min(streak, 6);

  if (group === 'g3') {
    const currentTemp = randInt(4, 10);
    const deltaTemp = -randInt(3, currentTemp);
    const targetTemp = currentTemp + deltaTemp;
    return {
      kind: 'subZero',
      scaleMin: 0,
      scaleMax: 10,
      currentTemp,
      deltaTemp,
      targetTemp,
      equationDisplay: `${currentTemp}° − ${Math.abs(deltaTemp)}° = [ ? ]°`,
      answer: targetTemp,
      choices: buildUniqueChoices(targetTemp, [targetTemp + 1, targetTemp + 2, currentTemp]),
      conceptBadge: { nl: 'Aftellen naar 0°', en: 'Countdown to 0°' },
      prompt: {
        nl: `De thermometer daalt ${Math.abs(deltaTemp)}° vanaf ${currentTemp}°. Hoeveel graden wordt het?`,
        en: `The thermometer drops ${Math.abs(deltaTemp)}° from ${currentTemp}°. What is the new reading?`,
      },
      coachTip: {
        nl: `💡 Tel ${Math.abs(deltaTemp)} omlaag vanaf ${currentTemp}° → ${targetTemp}°!`,
        en: `💡 Count down ${Math.abs(deltaTemp)} from ${currentTemp}° → ${targetTemp}°!`,
      },
    };
  }

  if (group === 'g4') {
    const currentTemp = randInt(1, 5);
    const drop = currentTemp + randInt(1, 4);
    const deltaTemp = -drop;
    const targetTemp = currentTemp + deltaTemp; // -1 to -4
    return {
      kind: 'subZero',
      scaleMin: -5,
      scaleMax: 10,
      currentTemp,
      deltaTemp,
      targetTemp,
      equationDisplay: `${currentTemp}° − ${drop}° = [ ? ]°`,
      answer: targetTemp,
      choices: buildUniqueChoices(targetTemp, [-targetTemp, 0, targetTemp - 1, targetTemp + 1], true),
      conceptBadge: { nl: 'Onder Nul (−5° tot +10°)', en: 'Below Zero (−5° to +10°)' },
      prompt: {
        nl: `Het is ${currentTemp}° en daalt ${drop}° onder nul!`,
        en: `It is ${currentTemp}° and drops ${drop}° below zero!`,
      },
      coachTip: {
        nl: `💡 ${currentTemp}° − ${currentTemp}° = 0°, en dan nog ${drop - currentTemp}° kouder = ${targetTemp}°!`,
        en: `💡 ${currentTemp}° − ${currentTemp}° = 0°, then ${drop - currentTemp}° colder = ${targetTemp}°!`,
      },
    };
  }

  if (group === 'g5') {
    const rise = Math.random() < 0.5;
    const currentTemp = rise ? -randInt(2, 8) : randInt(2, 8);
    const deltaTemp = rise ? randInt(5, 14) : -randInt(5, 14);
    const targetTemp = currentTemp + deltaTemp;
    const eq =
      deltaTemp >= 0
        ? `${currentTemp}° + ${deltaTemp}° = [ ? ]°`
        : `${currentTemp}° − ${Math.abs(deltaTemp)}° = [ ? ]°`;
    return {
      kind: 'subZero',
      scaleMin: -10,
      scaleMax: 15,
      currentTemp,
      deltaTemp,
      targetTemp,
      equationDisplay: eq,
      answer: targetTemp,
      choices: buildUniqueChoices(targetTemp, [-targetTemp, targetTemp - 2, targetTemp + 2, 0], true),
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
    const currentTemp = -randInt(4, 12 + boost);
    const deltaTemp = bothNegative ? -randInt(3, 8) : randInt(6, 20);
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
    const currentTemp = -randInt(6, 18 + boost);
    const b = randInt(5, 22);
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
  const isDiv = Math.random() < 0.35;
  const a = -randInt(3, 9);
  const b = Math.random() < 0.55 ? -randInt(3, 9) : randInt(3, 9);
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
  const boost = Math.min(streak, 6);

  if (group === 'g3' || group === 'g4') {
    const maxSum = group === 'g3' ? 12 + Math.floor(boost / 2) : 25 + boost;
    const a = randInt(3, Math.floor(maxSum * 0.6));
    const answer = randInt(2, maxSum - a);
    const total = a + answer;
    const hideFirst = Math.random() < 0.4;
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
        nl: group === 'g3' ? 'Geheime Rune t/m 12' : 'Geheime Rune t/m 25',
        en: group === 'g3' ? 'Missing Rune to 12' : 'Missing Rune to 25',
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
        group === 'g5' ? [2, 3, 4, 5, 8, 10] : [6, 7, 8, 9, 11, 12];
      const factor = pool[randInt(0, pool.length - 1)];
      const answer = randInt(3, group === 'g5' ? 9 : 12);
      const product = factor * answer;
      const isDiv = group === 'g6' && Math.random() < 0.45;
      const eq = isDiv
        ? `${product} ÷ [ ? ] = ${factor}`
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
      const answer = randInt(12, 45);
      const b = randInt(11, 35);
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
      const base = randInt(3, 9);
      const sq = base * base;
      const answer = randInt(4, 25);
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
      const f1 = randInt(3, 8);
      const f2 = randInt(4, 7);
      const prod = f1 * f2;
      const answer = randInt(3, 18);
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

  // g8: Two-step algebra (a × [ ? ] + b = total) or Negative / Exponent equations
  const m = randInt(3, 9);
  const answer = randInt(3, 12);
  const b = randInt(4, 19);
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
  if (group === 'g3' || group === 'g4' || group === 'g5') {
    const baseTen =
      group === 'g3' ? 10 : group === 'g4' ? 20 : randInt(2, 6) * 10;
    const ones = randInt(6, 9);
    const a = baseTen - 10 + ones;
    const needToTen = baseTen - a;
    const leftover = randInt(2, group === 'g3' ? 5 : 7);
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
    const factorB = randInt(4, 9);
    const extra = factorA - 5;
    const fivePart = 5 * factorB;
    const restPart = extra * factorB;
    const total = factorA * factorB;

    return {
      kind: 'breakApart',
      fullEquation: `${factorA} × ${factorB} = ${total}`,
      stepPrompt: {
        nl: `Splits ${factorA} × ${factorB} via 5×: (5 × ${factorB} = ${fivePart}) + (${extra} × ${factorB} = [ ? ])`,
        en: `Split ${factorA} × ${factorB} via 5×: (5 × ${factorB} = ${fivePart}) + (${extra} × ${factorB} = [ ? ])`,
      },
      bridgeDisplay: `${fivePart} + [ ? ] = ${total}`,
      answer: restPart,
      choices: buildUniqueChoices(restPart, [
        factorB,
        restPart + factorB,
        restPart - 2,
        fivePart,
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
    const ones = randInt(3, 8);
    const factorA = 10 + ones;
    const factorB = randInt(4, 9);
    const tenPart = 10 * factorB;
    const restPart = ones * factorB;
    const total = factorA * factorB;

    return {
      kind: 'breakApart',
      fullEquation: `${factorA} × ${factorB} = ${total}`,
      stepPrompt: {
        nl: `Splits ${factorA} in 10 + ${ones}: (10 × ${factorB} = ${tenPart}) + (${ones} × ${factorB} = [ ? ])`,
        en: `Split ${factorA} into 10 + ${ones}: (10 × ${factorB} = ${tenPart}) + (${ones} × ${factorB} = [ ? ])`,
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
        nl: `💡 ${factorA} × ${factorB} = (10 × ${factorB} = ${tenPart}) + (${ones} × ${factorB} = ${restPart}) = ${total}!`,
        en: `💡 ${factorA} × ${factorB} = (10 × ${factorB} = ${tenPart}) + (${ones} × ${factorB} = ${restPart}) = ${total}!`,
      },
    };
  }

  // g8: Big Division Split (e.g. 156 ÷ 12 = (120 ÷ 12 = 10) + (36 ÷ 12 = [ ? ]) = 13)
  const divisor = randInt(6, 12 + Math.min(3, streak));
  const extraQuotient = randInt(2, 6);
  const totalQuotient = 10 + extraQuotient;
  const tenChunk = divisor * 10;
  const restChunk = divisor * extraQuotient;
  const dividend = tenChunk + restChunk;

  return {
    kind: 'breakApart',
    fullEquation: `${dividend} ÷ ${divisor} = ${totalQuotient}`,
    stepPrompt: {
      nl: `Splits ${dividend} in ${tenChunk} + ${restChunk}: (${tenChunk} ÷ ${divisor} = 10) + (${restChunk} ÷ ${divisor} = [ ? ])`,
      en: `Split ${dividend} into ${tenChunk} + ${restChunk}: (${tenChunk} ÷ ${divisor} = 10) + (${restChunk} ÷ ${divisor} = [ ? ])`,
    },
    bridgeDisplay: `10 + [ ? ] = ${totalQuotient}`,
    answer: extraQuotient,
    choices: buildUniqueChoices(extraQuotient, [
      extraQuotient + 1,
      extraQuotient + 2,
      Math.max(1, extraQuotient - 1),
      totalQuotient,
    ]),
    conceptBadge: { nl: 'Grote Deel-Splitsing (÷)', en: 'Big Division Split (÷)' },
    coachTip: {
      nl: `💡 ${dividend} = ${tenChunk} + ${restChunk}. ${restChunk} ÷ ${divisor} = ${extraQuotient}, dus 10 + ${extraQuotient} = ${totalQuotient}!`,
      en: `💡 ${dividend} = ${tenChunk} + ${restChunk}. ${restChunk} ÷ ${divisor} = ${extraQuotient}, so 10 + ${extraQuotient} = ${totalQuotient}!`,
    },
  };
}

/**
 * 6. 🧪 Mira's Honmoon Kristal-Lab (IB PYP Concepts: Place Value, Rounding, Fractions, Decimals, Percentages, Ratios & Geometry)
 * Scales across g3 -> g8 so NO curriculum topic is skipped!
 */
export function generatePowerLabChallenge(
  group: SchoolGroupId = 'g5',
  streak = 0
): PowerLabChallenge {
  if (group === 'g3') {
    const isDouble = Math.random() < 0.55;
    if (isDouble) {
      const n = randInt(3, 9);
      const ans = n * 2;
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Dubbelen & Helften', en: 'Doubles & Halves' },
        visualFormula: `Dubbel ${n}  (${n} + ${n}) = [ ? ]`,
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
    } else {
      const ones = randInt(1, 9);
      const ans = 10 + ones;
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Tiental & Eenheden', en: 'Tens & Ones' },
        visualFormula: `10 + ${ones} = [ ? ]`,
        visualBar: { filled: 10, total: ans, label: `10 + ${ones}` },
        answer: ans,
        choices: buildUniqueChoices(ans, [ans - 1, ans + 1, ones * 10, ans + 2]),
        prompt: {
          nl: `1 vol tiental (10) en ${ones} losse kristallen maken samen:`,
          en: `1 full ten (10) and ${ones} single crystals make:`,
        },
        coachTip: {
          nl: `💡 1 tiental is 10, plus ${ones} eenheden = ${ans}!`,
          en: `💡 1 ten is 10, plus ${ones} ones = ${ans}!`,
        },
      };
    }
  }

  if (group === 'g4') {
    const mode = randInt(0, 2);
    if (mode === 0) {
      const tens = randInt(2, 8);
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
      const ans = randInt(3, 12);
      const total = ans * 2;
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Halveren (½)', en: 'Halving (½)' },
        visualFormula: `½ van ${total} = [ ? ]`,
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
      const baseTen = randInt(2, 8) * 10;
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
      const denom = [3, 4, 5][randInt(0, 2)];
      const ans = randInt(3, 9);
      const total = denom * ans;
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Stambreuken (1/n)', en: 'Unit Fractions (1/n)' },
        visualFormula: `1/${denom} van ${total} = [ ? ]`,
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
      const w = randInt(4, 12);
      const h = randInt(3, 10);
      const ans = 2 * (w + h);
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Omtrek Podium', en: 'Stage Perimeter' },
        visualFormula: `Omtrek: ${w}m × ${h}m = [ ? ]m`,
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
    ];
    const [num, den] = pairs[randInt(0, pairs.length - 1)];
    const unit = randInt(3, 9);
    const total = den * unit;
    const ans = num * unit;
    return {
      kind: 'powerLab',
      topicTag: { nl: 'Breuken van Getallen', en: 'Fractions of Amounts' },
      visualFormula: `${num}/${den} van ${total} = [ ? ]`,
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
        { pct: 10, num: 1, den: 10 },
      ];
      const pick = pcts[randInt(0, pcts.length - 1)];
      const unit = randInt(3, 12);
      const total = pick.den * unit;
      const ans = pick.num * unit;
      return {
        kind: 'powerLab',
        topicTag: { nl: 'Procenten & Breuken (%)', en: 'Percentages & Fractions (%)' },
        visualFormula: `${pick.pct}% van ${total} = [ ? ]`,
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
      const whole = randInt(2, 9);
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
    const a = randInt(2, 5);
    const b = randInt(a + 1, 8);
    const scale = randInt(3, 7 + Math.min(3, streak));
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
    const pct = [15, 30, 40, 60][randInt(0, 3)];
    const tens = randInt(2, 9);
    const total = tens * 10;
    const ans = (pct * total) / 100;
    return {
      kind: 'powerLab',
      topicTag: { nl: 'Procenten via 10%', en: 'Percentages via 10%' },
      visualFormula: `${pct}% van ${total} = [ ? ]`,
      visualBar: { filled: pct, total: 100, label: `${pct}%` },
      answer: ans,
      choices: buildUniqueChoices(ans, [ans - tens, ans + tens, total - ans, tens]),
      prompt: {
        nl: `Vind eerst 10% van ${total} (=${tens}) en bereken daarmee ${pct}%!`,
        en: `First find 10% of ${total} (=${tens}), then scale to ${pct}%!`,
      },
      coachTip: {
        nl: `💡 10% van ${total} = ${tens}. Dus ${pct}% = ${pct / 10} × ${tens} = ${ans}!`,
        en: `💡 10% of ${total} = ${tens}. So ${pct}% = ${pct / 10} × ${tens} = ${ans}!`,
      },
    };
  } else {
    // Mean / Average of 3 numbers
    const mean = randInt(8, 22);
    const d1 = randInt(2, 6);
    const d2 = randInt(1, 5);
    const n1 = mean - d1;
    const n2 = mean - d2;
    const n3 = mean + d1 + d2;
    return {
      kind: 'powerLab',
      topicTag: { nl: 'Gemiddelde (Statistiek)', en: 'Mean / Average (Data)' },
      visualFormula: `Gemiddelde (${n1}, ${n2}, ${n3}) = [ ? ]`,
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
      aLabel: ch.bridgeDisplay.split('→')[0].trim(),
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
    aLabel: ch.visualFormula.replace('= [ ? ]', '').replace('≈ [ ? ]', '').trim(),
    bLabel: '?',
    targetLabel: String(ch.answer),
    op: '+',
    choices: ch.choices.map(String),
    hintNl: ch.coachTip.nl,
    hintEn: ch.coachTip.en,
  };
}
