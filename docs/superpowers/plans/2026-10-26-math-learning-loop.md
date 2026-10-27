# Math Learning Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing math modes and learning tools reinforce accurate, age-appropriate practice through spaced review, useful coaching, and progress feedback.

**Architecture:** Add a small pure learning-loop engine for review spacing/mastery and keep persisted per-fact state in the existing local `PlayerProgress` store. Route child misses from every mode through one shared fact-capture path; keep the Dojo responsible for review presentation, and keep puzzle generation responsible for math content. Update summary and bilingual copy without adding a backend, dependency, or mode.

**Tech Stack:** React 19, TypeScript, Vite, browser `localStorage`, Node built-in test runner.

---

## File map

- Create `src/engine/learningLoop.ts` for deterministic fact review state transitions and selection.
- Modify `src/engine/progressionStore.ts` for backward-compatible review-state persistence and reward history.
- Modify `src/engine/kakoomaGenerator.ts` for progressive fraction constraints and test every skill's generated operations/ranges against its displayed label.
- Modify `README.md` to correct any educational claims that do not match the implemented skill content.
- Modify `src/App.tsx` to use fixed correct-answer rewards, collect child misses across solo/chain/timed/co-op, and report session learning outcomes.
- Modify `src/components/VersusBattleBoard.tsx` to forward only child misses and provide the child a useful strategy hint.
- Modify `src/components/NumberDojoModal.tsx` to implement spaced review, mastery rewards, retry feedback, a no-due-facts state, and strategy application checks.
- Modify `src/i18n/translations.ts` for English and Dutch copy for the new review, mastery, empty-state, and practice-check experiences.
- Create `tests/learningLoop.test.mjs` and `tests/kakoomaFractions.test.mjs` using Node's built-in test/assert modules. These tests import TypeScript directly; the current workspace uses Node 26, which supports native TypeScript type stripping.

The workspace has no Git metadata. Do not run commit commands here; if this work is moved into a Git repository, commit each completed task separately.

### Task 1: Define and test fact review transitions

**Files:**
- Create: `tests/learningLoop.test.mjs`
- Create: `src/engine/learningLoop.ts`

- [ ] **Step 1: Write failing tests for spacing, mastery, and reactivation**

Create `tests/learningLoop.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createReviewState,
  recordReviewAnswer,
  recordMiss,
  advanceOtherReviews,
  getNextDueFactId,
} from '../src/engine/learningLoop.ts';

test('a correct review schedules the next review after three other prompts', () => {
  const first = recordReviewAnswer(createReviewState(), true);
  assert.equal(first.state.consecutiveCorrect, 1);
  assert.equal(first.state.promptsUntilReview, 3);
  assert.equal(first.masteredNow, false);
});

test('the second spaced correct review marks a fact mastered', () => {
  let state = recordReviewAnswer(createReviewState(), true).state;
  for (let i = 0; i < 3; i += 1) {
    state = advanceOtherReviews({ fact: state }, 'filler').fact;
  }
  state = recordReviewAnswer(state, true).state;
  assert.equal(state.consecutiveCorrect, 2);
  assert.equal(state.mastered, true);
});

test('a miss resets consecutive success and schedules a later retry', () => {
  const afterCorrect = recordReviewAnswer(createReviewState(), true).state;
  const afterMiss = recordMiss(afterCorrect);
  assert.equal(afterMiss.consecutiveCorrect, 0);
  assert.equal(afterMiss.promptsUntilReview, 3);
  assert.equal(afterMiss.mastered, false);
});

test('reactivating a mastered fact preserves its one-time reward flag', () => {
  const reactivated = recordMiss({
    ...createReviewState(),
    mastered: true,
    rewardClaimed: true,
  });
  assert.equal(reactivated.mastered, false);
  assert.equal(reactivated.rewardClaimed, true);
});
```

- [ ] **Step 2: Run the tests and verify they fail because the engine module is missing**

Run: `node --test tests/learningLoop.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/engine/learningLoop.ts`.

- [ ] **Step 3: Implement the pure review-state module**

Create `src/engine/learningLoop.ts` with the tested state shape and transitions:

```ts
export const REVIEW_SPACING = 3;
export const REVIEWS_TO_MASTER = 2;

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
  const masteredNow =
    !state.mastered && consecutiveCorrect >= REVIEWS_TO_MASTER;
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
```

- [ ] **Step 4: Add selection and spacing tests**

Add these assertions:

```js
test('a fact becomes due after three other prompts and mastered facts stay closed', () => {
  let states = { fact: { ...createReviewState(), promptsUntilReview: 3 } };
  assert.equal(getNextDueFactId(['fact'], states), null);
  for (let i = 0; i < 3; i += 1) {
    states = advanceOtherReviews(states, 'filler');
  }
  assert.equal(getNextDueFactId(['fact'], states), 'fact');
  states.fact = { ...states.fact, mastered: true };
  assert.equal(getNextDueFactId(['fact'], states), null);
});
```

- [ ] **Step 5: Run the review engine tests**

Run: `node --test tests/learningLoop.test.mjs`

Expected: all review state and selection tests pass.

### Task 2: Persist review state and migrate existing saves

**Files:**
- Modify: `src/engine/progressionStore.ts`
- Modify: `tests/learningLoop.test.mjs`

- [ ] **Step 1: Add failing storage migration tests**

Extend the test file with a small `localStorage` stub and dynamically import the store after installing the stub:

```js
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};
const { loadProgress, saveProgress } = await import('../src/engine/progressionStore.ts');

test('legacy progress keeps rewards and initializes review state', () => {
  storage.set('huntrx_progress_v2', JSON.stringify({
    xp: 210,
    gems: 80,
    totalSolved: 12,
    unlockedCards: ['card_derpy_tiger'],
    trickyFacts: [],
  }));
  const progress = loadProgress();
  assert.equal(progress.xp, 210);
  assert.equal(progress.gems, 80);
  assert.deepEqual(progress.trickyFacts, []);
  assert.deepEqual(progress.factReview, {});
});
```

- [ ] **Step 2: Run tests and verify the migration assertion fails**

Run: `node --test tests/learningLoop.test.mjs`

Expected: FAIL because `PlayerProgress.factReview` is not yet present.

- [ ] **Step 3: Extend the stored progress shape and normalize old saves**

In `progressionStore.ts`, add `factReview: Record<string, FactReviewState>` to `PlayerProgress`. Import `FactReviewState` as a type. In `loadProgress`, preserve all existing fields, default a missing/invalid `factReview` to `{}`, and initialize a missing state for each unresolved legacy fact with `createReviewState()`. Do not replace an intentionally empty `trickyFacts` array with starter facts. Keep starter facts only in the fresh-install default, with initial due review state.

The store's imports should use explicit `.ts` paths and type-only imports where needed so Node's native TS test import can load the store; Vite and the existing TypeScript configuration support `.ts` import extensions.

- [ ] **Step 4: Test save/load round-trip and malformed review state**

Add assertions that `saveProgress` followed by `loadProgress` preserves `factReview`, while missing `factReview` gets `{}` and malformed non-object state is safely normalized. Do not swallow failures from `saveProgress` beyond the existing storage-error behavior.

- [ ] **Step 5: Run tests and production type-check/build**

Run: `node --test tests/learningLoop.test.mjs && npm run build`

Expected: tests pass and the production build completes.

### Task 3: Capture misses consistently and remove speed incentives

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/VersusBattleBoard.tsx`
- Modify: `src/engine/learningLoop.ts`
- Modify: `tests/learningLoop.test.mjs`

- [ ] **Step 1: Add failing tests for miss-state merging and reward claiming**

Add tests for `mergeMissedFact` and `claimMasteryReward`:

```js
test('a miss adds one fact and preserves the reward flag on reactivation', () => {
  const fact = { id: '7×8=56', aLabel: '7', bLabel: '8', targetLabel: '56',
    op: '×', choices: ['48', '54', '56', '64'], hintNl: '', hintEn: '' };
  const first = mergeMissedFact(fact, [], {});
  assert.equal(first.facts.length, 1);
  assert.equal(first.factReview[fact.id].promptsUntilReview, 3);
  const rewarded = { ...first.factReview, [fact.id]: {
    ...first.factReview[fact.id], mastered: true, rewardClaimed: true,
  } };
  const again = mergeMissedFact(fact, first.facts, rewarded);
  assert.equal(again.facts.length, 1);
  assert.equal(again.factReview[fact.id].rewardClaimed, true);
});

test('mastery rewards can be claimed only once', () => {
  const result = claimMasteryReward({
    ...createReviewState(), mastered: true, rewardClaimed: false,
  });
  assert.equal(result.rewardGranted, true);
  assert.equal(result.state.rewardClaimed, true);
  assert.equal(claimMasteryReward(result.state).rewardGranted, false);
});
```

Import `mergeMissedFact` and `claimMasteryReward` from `learningLoop.ts`.

- [ ] **Step 2: Implement shared fact-capture and mastery-reward helpers**

Add the following typed interfaces/functions to `learningLoop.ts`. Import `TrickyFactItem` with `import type` from `progressionStore.ts`; the store imports `FactReviewState` with `import type`, so this is a type-only cycle.

```ts
export function mergeMissedFact(
  fact: TrickyFactItem,
  facts: TrickyFactItem[],
  factReview: Record<string, FactReviewState>
): { facts: TrickyFactItem[]; factReview: Record<string, FactReviewState> } {
  const previous = factReview[fact.id] ?? createReviewState();
  const nextFactReview = {
    ...factReview,
    [fact.id]: recordMiss(previous),
  };
  return {
    facts: [fact, ...facts.filter((item) => item.id !== fact.id)].slice(0, 12),
    factReview: nextFactReview,
  };
}

export function claimMasteryReward(
  state: FactReviewState
): { state: FactReviewState; rewardGranted: boolean } {
  if (!state.mastered || state.rewardClaimed) {
    return { state, rewardGranted: false };
  }
  return {
    state: { ...state, rewardClaimed: true },
    rewardGranted: true,
  };
}
```

Add `createTrickyFact(puzzle: KakoomaPuzzle): TrickyFactItem` in the same module, importing `formatPuzzleValue` and `getSmartMathTrick` from existing modules. Build the ID as `${aLabel}${puzzle.operation}${bLabel}=${targetLabel}`, use the existing `puzzle.pair` / `puzzle.target`, use `getSmartMathTrick` for both `hintNl` and `hintEn`, and take four unique choices from the puzzle numbers while ensuring `targetLabel` is included. This keeps all operation math in the existing engine.

Use this implementation shape:

```ts
export function createTrickyFact(
  puzzle: KakoomaPuzzle
): TrickyFactItem {
  const [a, b] = puzzle.pair;
  const aLabel = formatPuzzleValue(puzzle, a).text;
  const bLabel = formatPuzzleValue(puzzle, b).text;
  const targetLabel = formatPuzzleValue(puzzle, puzzle.target).text;
  const choices = Array.from(
    new Set(puzzle.numbers.map((number) => formatPuzzleValue(puzzle, number).text))
  ).slice(0, 4);
  const finalChoices = choices.includes(targetLabel)
    ? choices
    : [targetLabel, ...choices.slice(0, 3)];
  const hint = (language: Language) =>
    getSmartMathTrick(a, b, puzzle.target, puzzle.operation, language, puzzle.fractionData);

  return {
    id: `${aLabel}${puzzle.operation}${bLabel}=${targetLabel}`,
    aLabel,
    bLabel,
    targetLabel,
    op: puzzle.operation,
    choices: finalChoices,
    hintNl: hint('nl'),
    hintEn: hint('en'),
  };
}
```

- [ ] **Step 3: Route solo, chain, timed, and daughter co-op misses through the helper**

In `App.tsx`, replace the inline `TrickyFactItem` construction inside the wrong-answer branch with `createTrickyFact` and `mergeMissedFact`. Save both returned values in one `updateProgress` call. In co-op, record a miss only when `coopTurn === 'daughter'`; keep existing gentle-miss feedback and hints for both players.

- [ ] **Step 4: Count completed child puzzles toward review spacing**

In `App.tsx`, when a child completes a puzzle, call `advanceOtherReviews` for all unresolved facts except the just-completed equation ID. Do not advance cooldowns on wrong taps or parent co-op turns. In `VersusBattleBoard`, add an `onDaughterSolve(puzzle: KakoomaPuzzle)` callback and call it only after a correct daughter answer; connect it in `App.tsx` to the same cooldown update.

- [ ] **Step 5: Route only child 1v1 misses through the same helper**

Add `onDaughterMiss(puzzle: KakoomaPuzzle)` and `lang: Language` to `VersusBattleBoardProps`. Invoke the callback only in `handleDaughterTap`'s incorrect-answer branch. In `App.tsx`, implement the callback with `createTrickyFact` and `mergeMissedFact`; do not add parent misses to the child's progress. In the child pane, show `getSmartMathTrick`'s bilingual strategy after a miss and keep the existing gentle hint.

- [ ] **Step 6: Remove speed/streak-dependent learning rewards**

In `App.tsx`, each correct non-1v1 puzzle awards exactly `100` score points, `7` gems, and `50` XP, regardless of elapsed milliseconds or streak. Keep streak count, combo banner, confetti, and sound as visual feedback only. Remove the 3.2-second gem bonus and streak multiplier from points and rewards. Keep `bestSpeedMs` only as an optional secondary statistic, never as a mastery signal. Update the translated Golden Combo text so it no longer claims “2× points.”

- [ ] **Step 7: Run tests and production build**

Run: `node --test tests/learningLoop.test.mjs && npm run build`

Expected: fact capture/reward tests pass and TypeScript/Vite build succeeds.

### Task 4: Make the Dojo a spaced-retrieval activity

**Files:**
- Modify: `src/components/NumberDojoModal.tsx`
- Modify: `src/App.tsx`
- Modify: `src/i18n/translations.ts`
- Modify: `tests/learningLoop.test.mjs`

- [ ] **Step 1: Add a failing integration-level state test**

Test the sequence for one missed fact: initial review is not immediately repeated; three different answered prompts decrement its cooldown; its first correct retrieval reschedules it; three different prompts later it appears again; the second correct retrieval marks it mastered.

- [ ] **Step 2: Select only due review facts**

Use `getNextDueFactId` in `NumberDojoModal`. Add an `onReviewAttempt(factId: string, correct: boolean)` prop. The parent applies `recordReviewAnswer` to that ID and decrements cooldowns for all other unresolved facts. On an incorrect review, reset that fact's consecutive-correct count and set its cooldown to three.

- [ ] **Step 3: Provide a clear waiting state and count other practice**

When unresolved facts exist but none is due, show a bilingual “this fact is resting; solve three other puzzles in a stage, then come back” state and a button that closes the Dojo. In every stage, decrement cooldowns only when the child completes a different puzzle; do not count the child's current fact, parent turns in co-op, or parent answers in 1v1. This provides real intervening math practice without repeating a fact early. When there are no unresolved facts, show a bilingual “all caught up / play a round to add review facts” state instead of silently restoring starter facts.

- [ ] **Step 4: Reward mastery once and only once**

In `App.tsx`, the `onReviewAttempt` handler updates `factReview` and `trickyFacts` in one `updateProgress` callback. On `masteredNow`, call `claimMasteryReward`; only when `rewardGranted` is true add `15` gems and `50` XP, then remove the fact from unresolved `trickyFacts`. A later main-game miss reopens practice but keeps `rewardClaimed: true`. Do not render a success/reward message until the persistent update has been applied.

- [ ] **Step 5: Make feedback teach after an attempt**

Do not show the target fact's answer strategy before the first attempt. After a wrong choice, show `hintNl` or `hintEn`, lock the choices, and offer a “continue” action; the next attempt is the spaced review after three other puzzles, not an immediate retry of the same fact. After a correct answer, show the equation and a one-sentence fact-family connection. The first correct review stays pending until the second spaced correct answer. Disable answer choices while feedback is active to prevent duplicate callbacks.

- [ ] **Step 6: Add bilingual no-review and mastery copy**

Add typed Dutch and English fields in `translations.ts` for cooldown feedback, review progress, mastery, waiting state, and empty queue; use them in the modal rather than inline language ternaries.

- [ ] **Step 7: Run review tests and production build**

Run: `node --test tests/learningLoop.test.mjs && npm run build`

Expected: spacing, retries, reward-once, and old-save tests pass; build succeeds.

### Task 5: Audit math content and make strategy cards actionable

**Files:**
- Modify: `src/engine/kakoomaGenerator.ts`
- Modify: `src/i18n/translations.ts`
- Modify: `src/components/NumberDojoModal.tsx`
- Modify: `README.md`
- Create: `tests/kakoomaFractions.test.mjs`

- [ ] **Step 1: Add failing content tests for each skill and fractions**

Create `tests/kakoomaFractions.test.mjs` with Node `test` and `assert` imports. For each seal size 4/5/6, generate 200 `fracEasy` and 200 `fracPro` single puzzles plus 30 chain puzzles, and assert: every value is between 1 and the denominator (pro: strictly below), the denominator is in the size pool, the puzzle has exactly one valid sum target, and the stored `target` is that target. Test each skill's visible label examples against the actual operation/range.

- [ ] **Step 2: Run content tests to establish the current failures**

Run: `node --test tests/kakoomaFractions.test.mjs`

Expected: tests fail for current arbitrary basic denominators and generated values above one.

- [ ] **Step 3: Implement controlled fraction progression**

In `kakoomaGenerator.ts`, bound every fraction value (target, pair, distractors) to at most one whole (`numerator <= denominator`; for `fracPro`, `< denominator` so nothing simplifies to `1/1`). Denominator pools depend on seal size, because an exhaustive check showed smaller denominators cannot produce a seal with exactly one valid sum when values stay ≤ 1 (e.g. denominator 4 has zero valid 4-orb seals; denominator 10 has only 5 valid 6-orb seals):

```ts
const FRACTION_DENOMINATORS: Record<'fracEasy' | 'fracPro', Record<SealSize, number[]>> = {
  fracEasy: { 4: [6, 8, 10], 5: [8, 10, 12], 6: [12] },
  fracPro: { 4: [8, 10, 12], 5: [10, 12], 6: [12] },
};
```

Chain mode uses the pool for the outer seal `size` (the larger seal), which is always feasible for the smaller center seal too. Preserve the uniqueness check for each Kakooma seal.

- [ ] **Step 4: Correct labels and examples in both languages**

Check all eleven skill IDs against `getSkillOperation` and their generated operand/target bounds. Update only labels/examples that do not match the generator. For fractions, describe `fracEasy` as like-denominator addition using the basic pool, and `fracPro` as like-denominator addition with simplification; do not claim unlike-denominator addition. Update `README.md` so operation/table/fraction claims match the actual generator. Keep equivalence explicit as a visual teaching example (`1/2 = 2/4`), not as a claim that the puzzle generator currently adds unlike denominators.

- [ ] **Step 5: Add independent application checks to Math Secrets**

Add one “Try it” prompt per existing Math Secret using fresh facts: Make-10 (`9 + 6`), count-up subtraction (`52 − 48`), 5× stepping stone (`6 × 7`), double-double (`4 × 9`), and equivalent fractions (`1/3 = ?/6`). Show answer choices only after the worked example; reveal correctness and the relevant strategy only after the child answers. The check question must not repeat the worked example's operands/result. Ensure a wrong response gets an explanatory retry, not just a red state.

- [ ] **Step 6: Run fraction and learning-loop tests, then build**

Run: `node --test tests/kakoomaFractions.test.mjs tests/learningLoop.test.mjs && npm run build`

Expected: all content constraints pass and the production build succeeds.

### Task 6: Report learning outcomes and next practice focus

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/i18n/translations.ts`

- [ ] **Step 1: Identify the existing session facts and skill data**

Use `masteredFacts` to list the distinct mental strategies shown, `correctTaps` / `totalTaps` for session accuracy, and unresolved `trickyFacts` for review waiting. Do not infer mastery from speed, score, XP, streak, or card count.

- [ ] **Step 2: Add a next-focus helper**

Use the first item in `progress.trickyFacts` as the most recently missed unresolved fact because `mergeMissedFact` puts the newest fact first. Show its equation as the next practice recommendation; if the list is empty, recommend the currently selected skill. Do not infer or claim curriculum mastery.

- [ ] **Step 3: Update the summary**

Show accuracy, facts practiced, review facts waiting, and the recommended next fact/selected skill in both normal and 1v1 summaries. Keep average speed only as an optional secondary stat and remove language that equates speed with skill. Keep existing replay, menu, and collectible actions.

- [ ] **Step 4: Add bilingual summary copy**

Add matching Dutch and English labels and recommendation text in `translations.ts`; confirm the recommendation text does not imply certainty about school proficiency.

- [ ] **Step 5: Run production build and exercise summary branches**

Run: `npm run build`

Expected: build succeeds. Manually verify summary for a clean session, a session with misses, a zero-tap completion, and a timed round.

### Task 7: Final verification across game modes

**Files:**
- Verify: `src/App.tsx`
- Verify: `src/components/VersusBattleBoard.tsx`
- Verify: `src/components/NumberDojoModal.tsx`
- Verify: `src/engine/learningLoop.ts`
- Verify: `src/engine/progressionStore.ts`
- Verify: `src/engine/kakoomaGenerator.ts`
- Verify: `src/i18n/translations.ts`

- [ ] **Step 1: Run all automated tests**

Run: `node --test tests/learningLoop.test.mjs tests/kakoomaFractions.test.mjs`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript reports no errors and Vite writes a production bundle.

- [ ] **Step 3: Manually verify the child learning flows**

Run `npm run dev`, then verify in a browser:

1. In solo, chain, timed, and co-op, deliberately miss a fact; confirm it enters the Dojo queue.
2. In 1v1, miss as the child and then as the parent; confirm only the child's fact is queued.
3. In the Dojo, answer other prompts and confirm the missed fact returns only after three; confirm mastery needs two spaced correct answers and pays once.
4. Reload the page and confirm review spacing, mastery, XP, gems, and unlocked cards persist.
5. Confirm correct answers earn equal normal rewards at different speeds and streaks remain cosmetic.
6. Confirm basic fraction puzzles do not show above-one values; verify displayed skill labels, hints, and bilingual UI.
7. Confirm Math Secrets do not reveal the application-check answer before an attempt and show a useful explanation after a miss.
8. Confirm the summary recommends a focus from misses and does not describe speed or collectibles as mastery.

- [ ] **Step 4: Remove generated test/build artifacts not tracked by the project**

Confirm the test commands did not create files outside their named test files and source changes. Do not delete or clean the existing `dist/` directory as part of this task.
