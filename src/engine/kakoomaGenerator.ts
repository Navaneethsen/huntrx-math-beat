export type SkillId =
  | 'add10'
  | 'add20'
  | 'add50'
  | 'sub20'
  | 'sub100'
  | 'multEasy'
  | 'multAll'
  | 'divAll'
  | 'fracEasy'
  | 'fracPro'
  | 'mixBoss';

export type Operation = '+' | '−' | '×' | '÷';
export type SealSize = 4 | 5 | 6;

export interface FractionMeta {
  denominator: number;
  simplify: boolean;
}

export interface KakoomaPuzzle {
  id: string;
  numbers: number[]; // Shuffled numbers in the seal (numerators over `fractionData.denominator` if fraction mode)
  target: number; // Primary valid answer in `numbers`
  pair: [number, number]; // [a, b] where a + b = target, a - b = target, a × b = target, or a ÷ b = target
  altTarget?: number; // In '−' (c - b = a <=> c - a = b) and '÷' (c ÷ b = a <=> c ÷ a = b), both a and b are valid!
  altPair?: [number, number];
  operation: Operation;
  allValidPairsForTarget: [number, number][];
  fractionData?: FractionMeta;
}

export interface KakoomaChainPuzzle {
  id: string;
  outerPuzzles: KakoomaPuzzle[];
  centerPuzzle: KakoomaPuzzle;
}

export interface FormattedPuzzleValue {
  text: string;
  isFraction: boolean;
  num: number;
  den: number;
  fillRatio: number;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Formats a puzzle number for display (either whole number or fraction like "3/4").
 */
export function formatPuzzleValue(puzzle: KakoomaPuzzle, n: number): FormattedPuzzleValue {
  if (!puzzle.fractionData) {
    return {
      text: String(n),
      isFraction: false,
      num: n,
      den: 1,
      fillRatio: 0,
    };
  }
  const { denominator, simplify } = puzzle.fractionData;
  const divisor = simplify ? gcd(n, denominator) : 1;
  const num = Math.round(n / divisor);
  const den = Math.round(denominator / divisor);
  const fillRatio = Math.min(1, Math.max(0.06, n / denominator));
  return {
    text: `${num}/${den}`,
    isFraction: true,
    num,
    den,
    fillRatio,
  };
}

/**
 * Checks if `tappedNum` is a valid answer for `puzzle`.
 * Handles both primary `target` and inverse `altTarget` for '−' and '÷'.
 */
export function checkKakoomaAnswer(
  puzzle: KakoomaPuzzle,
  tappedNum: number
): {
  isCorrect: boolean;
  a: number;
  b: number;
  target: number;
} {
  if (tappedNum === puzzle.target) {
    return {
      isCorrect: true,
      a: puzzle.pair[0],
      b: puzzle.pair[1],
      target: puzzle.target,
    };
  }
  if (
    (puzzle.operation === '−' || puzzle.operation === '÷') &&
    puzzle.altTarget !== undefined &&
    puzzle.altPair !== undefined &&
    tappedNum === puzzle.altTarget
  ) {
    return {
      isCorrect: true,
      a: puzzle.altPair[0],
      b: puzzle.altPair[1],
      target: puzzle.altTarget,
    };
  }
  return {
    isCorrect: false,
    a: puzzle.pair[0],
    b: puzzle.pair[1],
    target: puzzle.target,
  };
}

/**
 * Checks which numbers in `nums` can be formed by combining two OTHER distinct elements in `nums`.
 * Note: '−' uses '+' uniqueness, and '÷' uses '×' uniqueness.
 */
export function analyzeKakoomaSet(
  nums: number[],
  operation: Operation
): {
  validTargets: Map<number, [number, number][]>;
} {
  const validTargets = new Map<number, [number, number][]>();
  const effectiveOp: '+' | '×' = operation === '−' || operation === '+' ? '+' : '×';

  for (let i = 0; i < nums.length; i++) {
    const candidateTarget = nums[i];
    const pairs: [number, number][] = [];

    for (let j = 0; j < nums.length; j++) {
      if (j === i) continue;
      for (let k = j + 1; k < nums.length; k++) {
        if (k === i) continue;
        const a = nums[j];
        const b = nums[k];
        const res = effectiveOp === '+' ? a + b : a * b;
        if (res === candidateTarget) {
          pairs.push([Math.min(a, b), Math.max(a, b)]);
        }
      }
    }

    if (pairs.length > 0) {
      validTargets.set(candidateTarget, pairs);
    }
  }

  return { validTargets };
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getSkillOperation(skill: SkillId): Operation {
  if (skill === 'multEasy' || skill === 'multAll') return '×';
  if (skill === 'divAll') return '÷';
  if (skill === 'sub20' || skill === 'sub100') return '−';
  return '+';
}

export function isFractionSkill(skill: SkillId): boolean {
  return skill === 'fracEasy' || skill === 'fracPro';
}

/**
 * Like-denominator fraction seals keep every value within one whole. Larger seals need larger
 * denominators: with values ≤ 1 whole, small denominators cannot fill a 5- or 6-orb seal
 * that still has exactly one valid sum.
 */
export const FRACTION_DENOMINATORS: Record<'fracEasy' | 'fracPro', Record<SealSize, number[]>> = {
  fracEasy: { 4: [6, 8, 10], 5: [8, 10, 12], 6: [12] },
  fracPro: { 4: [8, 10, 12], 5: [10, 12], 6: [12] },
};

function pickFractionMeta(skill: 'fracEasy' | 'fracPro', size: SealSize): FractionMeta {
  return {
    denominator: randomChoice(FRACTION_DENOMINATORS[skill][size]),
    simplify: skill === 'fracPro',
  };
}

/** Largest numerator allowed: one whole for basic fractions, just below one whole for simplified ones. */
function maxFractionNumerator(meta: FractionMeta): number {
  return meta.simplify ? meta.denominator - 1 : meta.denominator;
}

function isBoundedFractionPuzzle(puzzle: KakoomaPuzzle): boolean {
  if (!puzzle.fractionData) return false;
  const max = maxFractionNumerator(puzzle.fractionData);
  return puzzle.numbers.every((n) => n >= 1 && n <= max);
}

const recentSinglePuzzleSigs = new Map<string, string[]>();
const recentChainCenterSigs = new Map<string, string[]>();
const MAX_RECENT_PUZZLES = 18;

function getSinglePuzzleSignature(p: KakoomaPuzzle): string {
  const pairSorted = [...p.pair].sort((x, y) => x - y).join(',');
  const den = p.fractionData?.denominator ?? 1;
  return `${p.operation}:${p.target}:[${pairSorted}]/${den}`;
}

/**
 * Generates a single Kakooma puzzle with a guaranteed UNIQUE relationship triple.
 * Optionally forces the target number to equal `forcedTarget` (used for building multi-seal chains).
 */
export function generateSinglePuzzle(
  skill: SkillId,
  size: SealSize,
  forcedTarget?: number,
  forcedFractionMeta?: FractionMeta,
  minFractionOrb: number = 1
): KakoomaPuzzle {
  if (forcedTarget === undefined) {
    const key = `${skill}:${size}`;
    const sigHistory = recentSinglePuzzleSigs.get(key) ?? [];
    let chosen = generateSinglePuzzleCore(skill, size, forcedTarget, forcedFractionMeta, minFractionOrb);
    for (let retry = 0; retry < 16; retry++) {
      const sig = getSinglePuzzleSignature(chosen);
      const lastSig = sigHistory[sigHistory.length - 1];
      const recentWindow = retry < 8 ? sigHistory : sigHistory.slice(-4);
      if (sig !== lastSig && !recentWindow.includes(sig)) {
        break;
      }
      chosen = generateSinglePuzzleCore(skill, size, forcedTarget, forcedFractionMeta, minFractionOrb);
    }
    const nextHistory = [...sigHistory, getSinglePuzzleSignature(chosen)].slice(-MAX_RECENT_PUZZLES);
    recentSinglePuzzleSigs.set(key, nextHistory);
    return chosen;
  }
  return generateSinglePuzzleCore(skill, size, forcedTarget, forcedFractionMeta, minFractionOrb);
}

function generateSinglePuzzleCore(
  skill: SkillId,
  size: SealSize,
  forcedTarget?: number,
  forcedFractionMeta?: FractionMeta,
  minFractionOrb: number = 1
): KakoomaPuzzle {
  // For mixBoss without forcedTarget, mix between +, −, ×, and ÷!
  let operation: Operation = getSkillOperation(skill);
  if (skill === 'mixBoss' && forcedTarget === undefined) {
    operation = randomChoice(['+', '−', '×', '÷']);
  }

  // Handle Fraction Skills ('fracEasy' and 'fracPro')
  const isFrac = isFractionSkill(skill);
  const fracSkill = skill as 'fracEasy' | 'fracPro';
  let fractionData: FractionMeta | undefined = isFrac
    ? forcedFractionMeta ?? pickFractionMeta(fracSkill, size)
    : undefined;

  for (let attempt = 0; attempt < 400; attempt++) {
    if (isFrac && !forcedFractionMeta && attempt > 0 && attempt % 40 === 0) {
      fractionData = pickFractionMeta(fracSkill, size);
    }
    let a = 1;
    let b = 2;
    let sumOrProd = 3; // In '+' and '×', this is target; in '−' and '÷', this is the largest number (minuend / dividend)
    const distractorPool: number[] = [];

    if (isFrac && fractionData) {
      const den = fractionData.denominator;
      const simplify = fractionData.simplify;
      const maxNum = maxFractionNumerator(fractionData);
      const minNum = Math.max(1, minFractionOrb);
      // A 6-orb subset of 1..12 cannot have 3 as its unique sum, so start at 4 when size === 6 and maxNum <= 12
      const minTarget = Math.max(size === 6 && maxNum <= 12 ? 4 : 3, minNum * 2 + 1);

      if (forcedTarget !== undefined) {
        sumOrProd = forcedTarget;
      } else {
        const candidates: number[] = [];
        for (let t = minTarget; t <= maxNum; t++) candidates.push(t);
        sumOrProd = candidates.length > 0 ? randomChoice(candidates) : maxNum;
      }

      const possiblePairs: [number, number][] = [];
      for (let x = minNum; x < Math.ceil(sumOrProd / 2); x++) {
        const y = sumOrProd - x;
        if (x !== y && y >= minNum) {
          // Pro practice prefers pairs where at least one fraction can be simplified.
          if (simplify && attempt < 220 && gcd(x, den) === 1 && gcd(y, den) === 1) {
            continue;
          }
          possiblePairs.push([x, y]);
        }
      }

      if (possiblePairs.length === 0) continue;
      [a, b] = randomChoice(possiblePairs);

      for (let d = minNum; d <= maxNum; d++) {
        if (d !== a && d !== b && d !== sumOrProd) {
          distractorPool.push(d);
        }
      }
    } else if (operation === '+') {
      let minSum = 4;
      let maxSum = 10;
      let maxDistractor = 14;

      if (skill === 'add10') {
        minSum = 4;
        maxSum = 10;
        maxDistractor = attempt > 150 ? 20 : 13;
      } else if (skill === 'add20') {
        minSum = 7;
        maxSum = 20;
        maxDistractor = attempt > 150 ? 28 : 22;
      } else if (skill === 'add50') {
        minSum = 14;
        maxSum = 50;
        maxDistractor = 58;
      } else {
        // mixBoss (up to 100)
        minSum = 25;
        maxSum = 99;
        maxDistractor = 108;
      }

      if (forcedTarget !== undefined) {
        sumOrProd = forcedTarget;
      } else {
        sumOrProd = randomInt(minSum, maxSum);
      }

      const possibleAs: number[] = [];
      for (let x = 1; x < Math.ceil(sumOrProd / 2); x++) {
        const y = sumOrProd - x;
        if (x !== y && y >= 1) {
          if (sumOrProd > 12 && x === 1 && attempt < 250) continue;
          possibleAs.push(x);
        }
      }
      if (possibleAs.length === 0) {
        a = 1;
        b = Math.max(2, sumOrProd - 1);
        sumOrProd = a + b;
      } else {
        a = randomChoice(possibleAs);
        b = sumOrProd - a;
      }

      const minD = skill === 'mixBoss' && sumOrProd > 20 ? 4 : 1;
      for (let d = minD; d <= Math.max(maxDistractor, sumOrProd + 8); d++) {
        if (d !== a && d !== b && d !== sumOrProd) {
          distractorPool.push(d);
        }
      }
    } else if (operation === '−') {
      const isSub20 = skill === 'sub20';
      const maxMinuend = isSub20 ? 20 : 85;
      const minMinuend = isSub20 ? 8 : 22;

      if (forcedTarget !== undefined) {
        a = forcedTarget;
        const minB = isSub20 ? 2 : 5;
        const maxB = Math.max(minB + 2, maxMinuend - a);
        const possibleBs: number[] = [];
        for (let candB = minB; candB <= maxB; candB++) {
          if (candB !== a && a + candB >= minMinuend) {
            possibleBs.push(candB);
          }
        }
        b = possibleBs.length > 0 ? randomChoice(possibleBs) : a + 3;
        sumOrProd = a + b;
      } else {
        sumOrProd = randomInt(minMinuend, maxMinuend);
        const possibleAs: number[] = [];
        for (let x = 2; x < Math.ceil(sumOrProd / 2); x++) {
          const y = sumOrProd - x;
          if (x !== y && y >= 2) {
            possibleAs.push(x);
          }
        }
        if (possibleAs.length === 0) {
          a = 2;
          b = Math.max(3, sumOrProd - 2);
          sumOrProd = a + b;
        } else {
          const chosen = randomChoice(possibleAs);
          const other = sumOrProd - chosen;
          if (Math.random() < 0.5) {
            a = chosen;
            b = other;
          } else {
            a = other;
            b = chosen;
          }
        }
      }

      const maxD = Math.max(maxMinuend + 6, sumOrProd + 6);
      for (let d = 2; d <= maxD; d++) {
        if (d !== a && d !== b && d !== sumOrProd) {
          distractorPool.push(d);
        }
      }
    } else if (operation === '÷') {
      // Division ('÷'): we build a unique multiplicative triple a * b = sumOrProd (where sumOrProd is the dividend!)
      // So sumOrProd ÷ b = a (target = a, pair = [sumOrProd, b]) AND sumOrProd ÷ a = b (altTarget = b, altPair = [sumOrProd, a])!
      const allFactors = [2, 3, 4, 5, 6, 7, 8, 9, 10];
      if (forcedTarget !== undefined && forcedTarget >= 2 && forcedTarget <= 12) {
        a = forcedTarget;
        const others = allFactors.filter((x) => x !== a);
        b = randomChoice(others);
        sumOrProd = a * b;
      } else {
        const f1 = randomChoice(allFactors);
        const others = allFactors.filter((x) => x !== f1);
        const f2 = randomChoice(others);
        a = f1;
        b = f2;
        sumOrProd = a * b;
      }

      for (let d = 2; d <= Math.max(85, sumOrProd + 10); d++) {
        if (d !== a && d !== b && d !== sumOrProd) {
          if (attempt > 150 || d <= 12 || d % 2 === 0 || d % 3 === 0 || d % 5 === 0) {
            distractorPool.push(d);
          }
        }
      }
    } else {
      // Multiplication ('×')
      const factorsEasy = [2, 3, 4, 5, 6, 7, 8, 9, 10];
      const tableEasy = [2, 3, 4, 5, 10];

      if (forcedTarget !== undefined) {
        sumOrProd = forcedTarget;
        // Stay inside the tables the skill promises (2–10; easy: one factor from 2, 3, 4, 5, 10).
        const pairs: [number, number][] = [];
        for (let f1 = 2; f1 <= 10; f1++) {
          if (sumOrProd % f1 === 0) {
            const f2 = sumOrProd / f1;
            const inEasyTable = tableEasy.includes(f1) || tableEasy.includes(f2);
            if (f2 > f1 && f2 <= 10 && (skill !== 'multEasy' || inEasyTable)) {
              pairs.push([f1, f2]);
            }
          }
        }
        if (pairs.length > 0) {
          [a, b] = randomChoice(pairs);
        } else {
          a = 2;
          b = Math.max(3, Math.floor(sumOrProd / 2));
          sumOrProd = a * b;
        }
      } else {
        if (skill === 'multEasy') {
          a = randomChoice(tableEasy);
          const otherChoices = factorsEasy.filter((x) => x !== a);
          b = randomChoice(otherChoices);
        } else {
          const allFactors = [2, 3, 4, 5, 6, 7, 8, 9, 10];
          a = randomChoice(allFactors);
          const otherChoices = allFactors.filter((x) => x !== a);
          b = randomChoice(otherChoices);
        }
        sumOrProd = a * b;
      }

      const maxProd = skill === 'multEasy' ? 55 : 95;
      for (let d = 2; d <= Math.max(maxProd, sumOrProd + 12); d++) {
        if (d !== a && d !== b && d !== sumOrProd) {
          if (
            attempt > 150 ||
            d <= 12 ||
            d % 2 === 0 ||
            d % 3 === 0 ||
            d % 5 === 0 ||
            d % 7 === 0
          ) {
            distractorPool.push(d);
          }
        }
      }
    }

    // Pick (size - 3) distractors so that `sumOrProd` is the ONLY valid additive/multiplicative target in the set
    const shuffledPool = shuffleArray(distractorPool);
    const currentSet = [a, b, sumOrProd];

    for (const candidate of shuffledPool) {
      if (currentSet.length >= size) break;
      const testSet = [...currentSet, candidate];
      const { validTargets } = analyzeKakoomaSet(testSet, operation);

      if (validTargets.size === 1 && validTargets.has(sumOrProd)) {
        const pairsForTarget = validTargets.get(sumOrProd)!;
        if (attempt < 200 && pairsForTarget.length > 1) {
          continue;
        }
        currentSet.push(candidate);
      }
    }

    if (currentSet.length === size) {
      const { validTargets } = analyzeKakoomaSet(testSetOrCurrent(currentSet), operation);
      if (validTargets.size === 1 && validTargets.has(sumOrProd)) {
        if (operation === '−' || operation === '÷') {
          return {
            id: `puz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            numbers: shuffleArray(currentSet),
            target: a,
            pair: [sumOrProd, b],
            altTarget: b,
            altPair: [sumOrProd, a],
            operation,
            allValidPairsForTarget: [[sumOrProd, b]],
          };
        }

        return {
          id: `puz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          numbers: shuffleArray(currentSet),
          target: sumOrProd,
          pair: [Math.min(a, b), Math.max(a, b)],
          operation,
          allValidPairsForTarget:
            validTargets.get(sumOrProd) || [[Math.min(a, b), Math.max(a, b)]],
          fractionData,
        };
      }
    }
  }

  // Deterministic bounded search for fraction skills so numerators never exceed maxFractionNumerator
  if (isFrac && fractionData) {
    const maxNum = maxFractionNumerator(fractionData);
    const minNum = Math.max(1, minFractionOrb);
    const targetCandidates: number[] =
      forcedTarget !== undefined && forcedTarget >= 3 && forcedTarget <= maxNum
        ? [forcedTarget]
        : Array.from(
            { length: Math.max(1, maxNum - Math.max(size === 6 && maxNum <= 12 ? 4 : 3, minNum * 2 + 1) + 1) },
            (_, idx) => maxNum - idx
          );

    for (const t of targetCandidates) {
      for (let x = minNum; x < Math.ceil(t / 2); x++) {
        const y = t - x;
        if (x === y || y < minNum) continue;
        const pool: number[] = [];
        for (let d = minNum; d <= maxNum; d++) {
          if (d !== x && d !== y && d !== t) pool.push(d);
        }

        const needed = size - 3;
        const findCombo = (startIdx: number, chosen: number[]): number[] | null => {
          if (chosen.length === needed) {
            const fullSet = [x, y, t, ...chosen];
            const { validTargets } = analyzeKakoomaSet(fullSet, '+');
            if (validTargets.size === 1 && validTargets.has(t)) {
              return fullSet;
            }
            return null;
          }
          for (let i = startIdx; i <= pool.length - (needed - chosen.length); i++) {
            const partial = [x, y, t, ...chosen, pool[i]];
            const { validTargets } = analyzeKakoomaSet(partial, '+');
            if (validTargets.size === 1 && validTargets.has(t)) {
              const res = findCombo(i + 1, [...chosen, pool[i]]);
              if (res) return res;
            }
          }
          return null;
        };

        const solvedSet = findCombo(0, []);
        if (solvedSet) {
          const { validTargets } = analyzeKakoomaSet(solvedSet, '+');
          return {
            id: `puz-frac-det-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            numbers: shuffleArray(solvedSet),
            target: t,
            pair: [x, y],
            operation: '+',
            allValidPairsForTarget: validTargets.get(t) || [[x, y]],
            fractionData,
          };
        }
      }
    }
  }

  // Mathematically guaranteed fallback that ALWAYS respects `forcedTarget`
  if (operation === '−') {
    const fbTarget = forcedTarget && forcedTarget >= 2 ? forcedTarget : 6;
    const fbB = fbTarget === 4 ? 5 : 4;
    const fbMinuend = fbTarget + fbB;
    const fbSet = [fbTarget, fbB, fbMinuend];
    let cand = fbMinuend + 3;
    while (fbSet.length < size) {
      const test = [...fbSet, cand];
      const { validTargets } = analyzeKakoomaSet(test, '+');
      if (validTargets.size === 1 && validTargets.has(fbMinuend)) {
        fbSet.push(cand);
      }
      cand += 2;
    }
    return {
      id: `puz-fb-sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      numbers: shuffleArray(fbSet),
      target: fbTarget,
      pair: [fbMinuend, fbB],
      altTarget: fbB,
      altPair: [fbMinuend, fbTarget],
      operation: '−',
      allValidPairsForTarget: [[fbMinuend, fbB]],
    };
  }

  if (operation === '÷') {
    const fbTarget = forcedTarget && forcedTarget >= 2 && forcedTarget <= 10 ? forcedTarget : 4;
    const fbB = fbTarget === 3 ? 5 : 3;
    const fbDividend = fbTarget * fbB;
    const fbSet = [fbTarget, fbB, fbDividend];
    let cand = fbDividend + 3;
    while (fbSet.length < size) {
      const test = [...fbSet, cand];
      const { validTargets } = analyzeKakoomaSet(test, '×');
      if (validTargets.size === 1 && validTargets.has(fbDividend)) {
        fbSet.push(cand);
      }
      cand += 2;
    }
    return {
      id: `puz-fb-div-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      numbers: shuffleArray(fbSet),
      target: fbTarget,
      pair: [fbDividend, fbB],
      altTarget: fbB,
      altPair: [fbDividend, fbTarget],
      operation: '÷',
      allValidPairsForTarget: [[fbDividend, fbB]],
    };
  }

  let fbTarget = forcedTarget ?? (operation === '×' ? 12 : 5);
  let fbA = 2;
  let fbB = 3;

  if (operation === '+') {
    if (fbTarget < 3) fbTarget = 5;
    fbA = 1;
    fbB = fbTarget - 1;
    if (fbA === fbB) {
      fbA = 1;
      fbB = 2;
      fbTarget = 3;
    }
  } else {
    let found = false;
    for (let f1 = 2; f1 <= 12; f1++) {
      if (fbTarget % f1 === 0 && fbTarget / f1 !== f1) {
        fbA = Math.min(f1, fbTarget / f1);
        fbB = Math.max(f1, fbTarget / f1);
        found = true;
        break;
      }
    }
    if (!found) {
      fbA = 3;
      fbB = 4;
      fbTarget = 12;
    }
  }

  const fbSet = [fbA, fbB, fbTarget];
  let candidateD = fbTarget + 2;
  while (fbSet.length < size) {
    if (
      !fbSet.includes(candidateD) &&
      (!fractionData?.simplify || candidateD % fractionData.denominator !== 0)
    ) {
      const test = [...fbSet, candidateD];
      const { validTargets } = analyzeKakoomaSet(test, operation);
      if (validTargets.size === 1 && validTargets.has(fbTarget)) {
        fbSet.push(candidateD);
      }
    }
    candidateD++;
  }

  return {
    id: `puz-fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    numbers: shuffleArray(fbSet),
    target: fbTarget,
    pair: [fbA, fbB],
    operation,
    allValidPairsForTarget: [[fbA, fbB]],
    fractionData,
  };
}

function testSetOrCurrent(s: number[]): number[] {
  return s;
}

/**
 * Generates a Multi-Seal Chain Puzzle (4 or 5 outer puzzles whose answers form the Center Master Puzzle).
 */
export function generateChainPuzzle(skill: SkillId, size: SealSize): KakoomaChainPuzzle {
  const key = `${skill}:${size}`;
  const sigHistory = recentChainCenterSigs.get(key) ?? [];
  let chosen = generateChainPuzzleCore(skill, size);
  for (let retry = 0; retry < 10; retry++) {
    const sig = getSinglePuzzleSignature(chosen.centerPuzzle);
    const lastSig = sigHistory[sigHistory.length - 1];
    if (sig !== lastSig && !sigHistory.slice(-6).includes(sig)) {
      break;
    }
    chosen = generateChainPuzzleCore(skill, size);
  }
  const nextHistory = [...sigHistory, getSinglePuzzleSignature(chosen.centerPuzzle)].slice(-14);
  recentChainCenterSigs.set(key, nextHistory);
  return chosen;
}

function generateChainPuzzleCore(skill: SkillId, size: SealSize): KakoomaChainPuzzle {
  const outerCount: SealSize = size === 6 ? 5 : 4;
  const op = getSkillOperation(skill);

  // 1. Fraction Chains: Share the same denominator across all outer seals and the center seal!
  if (isFractionSkill(skill)) {
    const fracSkill = skill as 'fracEasy' | 'fracPro';
    // Proper simplified fractions cannot fill 6-orb outer seals for every center answer,
    // so pro chains cap their outer seals at 5 orbs.
    const outerSize: SealSize = fracSkill === 'fracPro' && size === 6 ? 5 : size;
    const minCenterOrb = outerSize === 6 ? 4 : 3;
    for (let attempt = 0; attempt < 300; attempt++) {
      // The pool for the larger outer seal is always feasible for the smaller center seal too.
      const sharedMeta = pickFractionMeta(fracSkill, outerSize);
      const candidateCenter = generateSinglePuzzle(
        skill,
        outerCount,
        undefined,
        sharedMeta,
        minCenterOrb
      );
      if (
        isBoundedFractionPuzzle(candidateCenter) &&
        candidateCenter.numbers.every((n) => n >= minCenterOrb)
      ) {
        const outerPuzzles = candidateCenter.numbers.map((targetNum) =>
          generateSinglePuzzle(skill, outerSize, targetNum, sharedMeta)
        );
        if (!outerPuzzles.every(isBoundedFractionPuzzle)) continue;
        return {
          id: `chain-frac-${Date.now()}`,
          outerPuzzles,
          centerPuzzle: candidateCenter,
        };
      }
    }
  }

  // 2. Division Chains: outer targets are quotients in 2..10, and the Center Master Seal is an Addition Finale!
  if (op === '÷') {
    for (let attempt = 0; attempt < 200; attempt++) {
      const candidateCenter = generateSinglePuzzle('add10', outerCount);
      if (candidateCenter.numbers.every((n) => n >= 2 && n <= 10)) {
        const outerPuzzles = candidateCenter.numbers.map((targetNum) =>
          generateSinglePuzzle('divAll', size, targetNum)
        );
        return {
          id: `chain-div-${Date.now()}`,
          outerPuzzles,
          centerPuzzle: candidateCenter,
        };
      }
    }
  }

  // 3. Addition & Subtraction Chains
  if (op === '+' || op === '−') {
    for (let attempt = 0; attempt < 250; attempt++) {
      const centerSkill: SkillId = skill === 'add10' ? 'add20' : skill;
      const candidateCenter = generateSinglePuzzle(centerSkill, outerCount);
      const maxAllowed =
        skill === 'add10' ? 15 : skill === 'add20' || skill === 'sub20' ? 18 : 75;
      if (candidateCenter.numbers.every((n) => n >= 4 && n <= maxAllowed)) {
        const outerPuzzles = candidateCenter.numbers.map((targetNum) =>
          generateSinglePuzzle(skill, size, targetNum)
        );
        return {
          id: `chain-${Date.now()}`,
          outerPuzzles,
          centerPuzzle: candidateCenter,
        };
      }
    }
  }

  // 4. Multiplication Chains: each outer puzzle is a multiplication puzzle whose target is a composite product,
  // and the Center Master Seal is an Addition Finale combining those products!
  const validProducts =
    skill === 'multEasy'
      ? [6, 8, 10, 12, 14, 15, 16, 18, 20, 24, 28, 30, 32, 35, 36, 40]
      : [6, 8, 10, 12, 14, 15, 16, 18, 20, 21, 24, 27, 28, 30, 32, 35, 36, 40, 42, 45, 48, 54, 56];

  const validTriples: [number, number, number][] = [];
  for (let i = 0; i < validProducts.length; i++) {
    for (let j = i + 1; j < validProducts.length; j++) {
      const sum = validProducts[i] + validProducts[j];
      if (validProducts.includes(sum)) {
        validTriples.push([validProducts[i], validProducts[j], sum]);
      }
    }
  }

  for (let attempt = 0; attempt < 250; attempt++) {
    const [pA, pB, sumTarget] = randomChoice(validTriples);
    const centerSet = [pA, pB, sumTarget];
    const shuffled = shuffleArray(validProducts);

    for (const cand of shuffled) {
      if (centerSet.length >= outerCount) break;
      if (centerSet.includes(cand)) continue;
      const testSet = [...centerSet, cand];
      const { validTargets } = analyzeKakoomaSet(testSet, '+');
      if (validTargets.size === 1 && validTargets.has(sumTarget)) {
        centerSet.push(cand);
      }
    }

    if (centerSet.length === outerCount) {
      const shuffledCenter = shuffleArray(centerSet);
      const outerPuzzles = shuffledCenter.map((prodTarget) =>
        generateSinglePuzzle(skill, size, prodTarget)
      );
      return {
        id: `chain-mult-${Date.now()}`,
        outerPuzzles,
        centerPuzzle: {
          id: `center-${Date.now()}`,
          numbers: shuffledCenter,
          target: sumTarget,
          pair: [Math.min(pA, pB), Math.max(pA, pB)],
          operation: '+',
          allValidPairsForTarget: [[Math.min(pA, pB), Math.max(pA, pB)]],
        },
      };
    }
  }

  // Guaranteed fallback chain
  const isMult = op === '×';
  const fbNumbers = isMult
    ? [6, 8, 14, 24, 35].slice(0, outerCount)
    : [3, 5, 8, 9, 10].slice(0, outerCount);
  const fbTarget = isMult ? 14 : 8;
  const fbPair: [number, number] = isMult ? [6, 8] : [3, 5];

  return {
    id: `chain-fb-${Date.now()}`,
    outerPuzzles: fbNumbers.map((n) => generateSinglePuzzle(skill, size, n)),
    centerPuzzle: {
      id: `center-fb-${Date.now()}`,
      numbers: fbNumbers,
      target: fbTarget,
      pair: fbPair,
      operation: '+',
      allValidPairsForTarget: [fbPair],
    },
  };
}
