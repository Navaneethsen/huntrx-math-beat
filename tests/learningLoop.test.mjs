import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};

const {
  createReviewState,
  recordReviewAnswer,
  recordMiss,
  advanceOtherReviews,
  getNextDueFactId,
  mergeMissedFact,
  claimMasteryReward,
  createTrickyFact,
  REVIEW_SPACING,
} = await import('../src/engine/learningLoop.ts');
const { loadProgress, saveProgress } = await import('../src/engine/progressionStore.ts');
const { generateSinglePuzzle } = await import('../src/engine/kakoomaGenerator.ts');

const sampleFact = {
  id: '7×8=56', aLabel: '7', bLabel: '8', targetLabel: '56',
  op: '×', choices: ['48', '54', '56', '64'], hintNl: '', hintEn: '',
};

test('a correct review schedules the next review after three other prompts', () => {
  const first = recordReviewAnswer(createReviewState(), true);
  assert.equal(first.state.consecutiveCorrect, 1);
  assert.equal(first.state.promptsUntilReview, REVIEW_SPACING);
  assert.equal(first.masteredNow, false);
});

test('the second spaced correct review marks a fact mastered', () => {
  let state = recordReviewAnswer(createReviewState(), true).state;
  for (let i = 0; i < 3; i += 1) state = advanceOtherReviews({ fact: state }, 'filler').fact;
  const result = recordReviewAnswer(state, true);
  assert.equal(result.state.consecutiveCorrect, 2);
  assert.equal(result.state.mastered, true);
  assert.equal(result.masteredNow, true);
});

test('a miss resets consecutive success and schedules a later retry', () => {
  const afterCorrect = recordReviewAnswer(createReviewState(), true).state;
  const afterMiss = recordMiss(afterCorrect);
  assert.equal(afterMiss.consecutiveCorrect, 0);
  assert.equal(afterMiss.promptsUntilReview, 3);
  assert.equal(afterMiss.mastered, false);
});

test('reactivating a mastered fact preserves its one-time reward flag', () => {
  const reactivated = recordMiss({ ...createReviewState(), mastered: true, rewardClaimed: true });
  assert.equal(reactivated.mastered, false);
  assert.equal(reactivated.rewardClaimed, true);
});

test('a fact becomes due after three other prompts and mastered facts stay closed', () => {
  let states = { fact: { ...createReviewState(), promptsUntilReview: 3 } };
  assert.equal(getNextDueFactId(['fact'], states), null);
  states = advanceOtherReviews(states, 'fact');
  assert.equal(states.fact.promptsUntilReview, 3, 'answering the fact itself does not count');
  for (let i = 0; i < 3; i += 1) states = advanceOtherReviews(states, 'filler');
  assert.equal(getNextDueFactId(['fact'], states), 'fact');
  states.fact = { ...states.fact, mastered: true };
  assert.equal(getNextDueFactId(['fact'], states), null);
});

test('full review sequence: miss → spaced → correct → spaced → mastered', () => {
  let { facts, factReview } = mergeMissedFact(sampleFact, [], {});
  assert.equal(getNextDueFactId(facts.map((f) => f.id), factReview), null, 'not repeated immediately');
  for (let i = 0; i < 3; i += 1) factReview = advanceOtherReviews(factReview, 'other');
  assert.equal(getNextDueFactId(facts.map((f) => f.id), factReview), sampleFact.id);
  let r = recordReviewAnswer(factReview[sampleFact.id], true);
  assert.equal(r.masteredNow, false);
  factReview = { ...factReview, [sampleFact.id]: r.state };
  assert.equal(getNextDueFactId([sampleFact.id], factReview), null);
  for (let i = 0; i < 3; i += 1) factReview = advanceOtherReviews(factReview, 'other');
  r = recordReviewAnswer(factReview[sampleFact.id], true);
  assert.equal(r.masteredNow, true);
});

test('a miss adds one fact and preserves the reward flag on reactivation', () => {
  const first = mergeMissedFact(sampleFact, [], {});
  assert.equal(first.facts.length, 1);
  assert.equal(first.factReview[sampleFact.id].promptsUntilReview, 3);
  const rewarded = { ...first.factReview, [sampleFact.id]: {
    ...first.factReview[sampleFact.id], mastered: true, rewardClaimed: true } };
  const again = mergeMissedFact(sampleFact, first.facts, rewarded);
  assert.equal(again.facts.length, 1);
  assert.equal(again.factReview[sampleFact.id].rewardClaimed, true);
  assert.equal(again.factReview[sampleFact.id].mastered, false);
});

test('mastery rewards can be claimed only once', () => {
  const result = claimMasteryReward({ ...createReviewState(), mastered: true });
  assert.equal(result.rewardGranted, true);
  assert.equal(result.state.rewardClaimed, true);
  assert.equal(claimMasteryReward(result.state).rewardGranted, false);
  assert.equal(claimMasteryReward(createReviewState()).rewardGranted, false);
});

test('createTrickyFact builds a correct equation with the answer among 4 unique choices', () => {
  for (const skill of ['add20', 'sub100', 'multAll', 'divAll', 'fracEasy', 'fracPro']) {
    for (let i = 0; i < 30; i += 1) {
      const fact = createTrickyFact(generateSinglePuzzle(skill, 5));
      assert.ok(fact.choices.includes(fact.targetLabel), `${skill}: answer in choices`);
      assert.equal(new Set(fact.choices).size, fact.choices.length);
      assert.equal(fact.choices.length, 4, `${skill}: ${fact.id} → ${fact.choices}`);
      assert.equal(fact.id, `${fact.aLabel}${fact.op}${fact.bLabel}=${fact.targetLabel}`);
      if (!fact.aLabel.includes('/')) {
        const [a, b, t] = [fact.aLabel, fact.bLabel, fact.targetLabel].map(Number);
        const expected = { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[fact.op];
        assert.equal(expected, t, fact.id);
      }
      assert.ok(fact.hintNl.length > 0 && fact.hintEn.length > 0);
    }
  }
});

test('legacy progress keeps rewards and does not refill starter facts', () => {
  storage.set('huntrx_progress_v2', JSON.stringify({
    xp: 210, gems: 80, totalSolved: 12, unlockedCards: ['card_derpy_tiger'], trickyFacts: [],
  }));
  const progress = loadProgress();
  assert.equal(progress.xp, 210);
  assert.equal(progress.gems, 80);
  assert.deepEqual(progress.trickyFacts, []);
  assert.deepEqual(progress.factReview, {});
});

test('legacy facts without review state become due', () => {
  storage.set('huntrx_progress_v2', JSON.stringify({ xp: 0, trickyFacts: [sampleFact] }));
  const progress = loadProgress();
  assert.equal(progress.factReview[sampleFact.id].promptsUntilReview, 0);
  assert.equal(getNextDueFactId([sampleFact.id], progress.factReview), sampleFact.id);
});

test('fresh install gets starter facts that are due', () => {
  storage.clear();
  const progress = loadProgress();
  assert.ok(progress.trickyFacts.length > 0);
  assert.ok(getNextDueFactId(progress.trickyFacts.map((f) => f.id), progress.factReview));
});

test('save/load round-trip preserves review state; malformed state is normalized', () => {
  const progress = loadProgress();
  const merged = mergeMissedFact(sampleFact, progress.trickyFacts, progress.factReview);
  saveProgress({ ...progress, trickyFacts: merged.facts, factReview: merged.factReview });
  assert.deepEqual(loadProgress().factReview, merged.factReview);

  storage.set('huntrx_progress_v2', JSON.stringify({ trickyFacts: [sampleFact], factReview: 'oops' }));
  assert.deepEqual(loadProgress().factReview, { [sampleFact.id]: createReviewState() });
  storage.set('huntrx_progress_v2', JSON.stringify({
    trickyFacts: [], factReview: { x: null, y: { promptsUntilReview: -4, mastered: true, rewardClaimed: true } },
  }));
  assert.deepEqual(loadProgress().factReview, {
    y: { consecutiveCorrect: 0, promptsUntilReview: 0, mastered: true, rewardClaimed: true },
  });
});

test('practiced strategies are distinct named tricks, not generic praise', async () => {
  const { getPracticedStrategies } = await import('../src/engine/learningLoop.ts');
  assert.deepEqual(
    getPracticedStrategies([
      '💡 Near-Double Trick: 6 + 6 = 12, plus 1 more = 13!',
      '💡 Near-Double Trick: 7 + 7 = 14, plus 1 more = 15!',
      '💡 Common Denominator (12): 1/4 = 3/12',
      '💡 Awesome bond: 3 and 9 combine to make 12!',
    ]),
    ['Near-Double Trick', 'Common Denominator']
  );
});
