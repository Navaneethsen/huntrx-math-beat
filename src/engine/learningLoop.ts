import type { Language } from '../i18n/translations';
import type { KakoomaPuzzle } from './kakoomaGenerator';
import { formatPuzzleValue } from './kakoomaGenerator.ts';
import type { TrickyFactItem } from './progressionStore';
import { getSmartMathTrick } from './progressionStore.ts';

/** Number of other completed puzzles before a fact is due again. */
export const REVIEW_SPACING = 3;
/** Correct spaced retrievals in a row needed to master a fact. */
export const REVIEWS_TO_MASTER = 2;
export const MAX_REVIEW_FACTS = 12;

export interface FactReviewState {
  consecutiveCorrect: number;
  promptsUntilReview: number;
  mastered: boolean;
  rewardClaimed: boolean;
}

export function createReviewState(): FactReviewState {
  return {
    consecutiveCorrect: 0,
    promptsUntilReview: 0,
    mastered: false,
    rewardClaimed: false,
  };
}

export function recordReviewAnswer(
  state: FactReviewState,
  correct: boolean
): { state: FactReviewState; masteredNow: boolean } {
  if (!correct) return { state: recordMiss(state), masteredNow: false };

  const consecutiveCorrect = state.consecutiveCorrect + 1;
  const masteredNow = !state.mastered && consecutiveCorrect >= REVIEWS_TO_MASTER;
  return {
    state: {
      ...state,
      consecutiveCorrect,
      promptsUntilReview: REVIEW_SPACING,
      mastered: state.mastered || masteredNow,
    },
    masteredNow,
  };
}

export function recordMiss(state: FactReviewState): FactReviewState {
  return {
    ...state,
    consecutiveCorrect: 0,
    promptsUntilReview: REVIEW_SPACING,
    mastered: false,
  };
}

export function advanceOtherReviews(
  states: Record<string, FactReviewState>,
  answeredFactId: string
): Record<string, FactReviewState> {
  return Object.fromEntries(
    Object.entries(states).map(([id, state]) => [
      id,
      id !== answeredFactId && !state.mastered
        ? { ...state, promptsUntilReview: Math.max(0, state.promptsUntilReview - 1) }
        : state,
    ])
  );
}

export function getNextDueFactId(
  orderedFactIds: string[],
  states: Record<string, FactReviewState>
): string | null {
  return (
    orderedFactIds.find((id) => {
      const state = states[id];
      return state !== undefined && !state.mastered && state.promptsUntilReview === 0;
    }) ?? null
  );
}

export function mergeMissedFact(
  fact: TrickyFactItem,
  facts: TrickyFactItem[],
  factReview: Record<string, FactReviewState>
): { facts: TrickyFactItem[]; factReview: Record<string, FactReviewState> } {
  const previous = factReview[fact.id] ?? createReviewState();
  return {
    facts: [fact, ...facts.filter((item) => item.id !== fact.id)].slice(0, MAX_REVIEW_FACTS),
    factReview: { ...factReview, [fact.id]: recordMiss(previous) },
  };
}

export function claimMasteryReward(
  state: FactReviewState
): { state: FactReviewState; rewardGranted: boolean } {
  if (!state.mastered || state.rewardClaimed) {
    return { state, rewardGranted: false };
  }
  return { state: { ...state, rewardClaimed: true }, rewardGranted: true };
}

export function getFactId(puzzle: KakoomaPuzzle): string {
  const [a, b] = puzzle.pair;
  return `${formatPuzzleValue(puzzle, a).text}${puzzle.operation}${
    formatPuzzleValue(puzzle, b).text
  }=${formatPuzzleValue(puzzle, puzzle.target).text}`;
}

export function createTrickyFact(puzzle: KakoomaPuzzle): TrickyFactItem {
  const [a, b] = puzzle.pair;
  const aLabel = formatPuzzleValue(puzzle, a).text;
  const bLabel = formatPuzzleValue(puzzle, b).text;
  const targetLabel = formatPuzzleValue(puzzle, puzzle.target).text;
  const operandLabels = new Set([aLabel, bLabel]);
  const otherChoices = Array.from(
    new Set(puzzle.numbers.map((n) => formatPuzzleValue(puzzle, n).text))
  ).filter((label) => label !== targetLabel && !operandLabels.has(label));
  const fillers = Array.from(
    new Set(
      [puzzle.target - 1, puzzle.target + 1, puzzle.target + 2, puzzle.target - 2]
        .filter((n) => n > 0)
        .map((n) => formatPuzzleValue(puzzle, n).text)
    )
  ).filter((label) => label !== targetLabel && !otherChoices.includes(label));
  const distractors = [...otherChoices, ...fillers].slice(0, 3);
  const choices = [targetLabel, ...distractors].sort((x, y) =>
    x.localeCompare(y, undefined, { numeric: true })
  );
  const hint = (language: Language) =>
    getSmartMathTrick(a, b, puzzle.target, puzzle.operation, language, puzzle.fractionData);

  return {
    id: `${aLabel}${puzzle.operation}${bLabel}=${targetLabel}`,
    aLabel,
    bLabel,
    targetLabel,
    op: puzzle.operation,
    choices,
    hintNl: hint('nl'),
    hintEn: hint('en'),
  };
}

const GENERIC_TRICK_NAMES = new Set(['Super gevonden', 'Awesome bond', 'Knap gerekend', 'Sharp math']);

/** Distinct strategy names (e.g. "Near-Double Trick") from the hint texts shown this session. */
export function getPracticedStrategies(tricks: string[]): string[] {
  const names = tricks
    .map((trick) => trick.replace('💡', '').split(/[:(]/)[0].trim())
    .filter((name) => name.length > 0 && !GENERIC_TRICK_NAMES.has(name));
  return Array.from(new Set(names));
}
