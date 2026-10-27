import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOCK_LEVELS,
  getClockLevel,
  phraseNl,
  phraseEn,
  phraseWithDayPart,
  timeDistractors,
  isSetAnswerCorrect,
  buildClockStageDeck,
  clockStars,
} from '../src/engine/clockEngine.ts';
import { loadProgress } from '../src/engine/progressionStore.ts';

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

test('Dutch phrases use the half-hour based system', () => {
  assert.equal(phraseNl({ h: 2, m: 25 }), 'vijf voor half drie');
  assert.equal(phraseNl({ h: 9, m: 37 }), 'zeven over half tien');
  assert.equal(phraseNl({ h: 3, m: 45 }), 'kwart voor vier');
  assert.equal(phraseNl({ h: 3, m: 30 }), 'half vier');
  assert.equal(phraseNl({ h: 12, m: 0 }), 'twaalf uur');
});

test('English phrases use past/to', () => {
  assert.equal(phraseEn({ h: 3, m: 45 }), 'quarter to four');
  assert.equal(phraseEn({ h: 2, m: 25 }), 'twenty-five past two');
});

test('24h phrases add the part of the day', () => {
  assert.match(phraseWithDayPart({ h: 16, m: 45 }, 'nl'), /kwart voor vijf.*middag/);
});

test('distractors are unique, exclude the answer and stay on the level grid', () => {
  const rng = seeded(7);
  for (const level of CLOCK_LEVELS) {
    for (let i = 0; i < 40; i++) {
      const answer = { h: 1 + Math.floor(rng() * 12), m: Math.floor((rng() * 60) / level.stepMinutes) * level.stepMinutes };
      const wrong = timeDistractors(answer, level, 3, rng);
      assert.equal(wrong.length, 3);
      const keys = new Set(wrong.map((t) => `${t.h % 12}:${t.m}`));
      assert.equal(keys.size, 3);
      assert.ok(!keys.has(`${answer.h % 12}:${answer.m}`));
      for (const t of wrong) assert.equal(t.m % level.stepMinutes, 0);
    }
  }
});

test('setting the hands accepts the same analog position in 12h or 24h', () => {
  assert.ok(isSetAnswerCorrect({ h: 15, m: 20 }, { h: 3, m: 20 }));
  assert.ok(!isSetAnswerCorrect({ h: 3, m: 20 }, { h: 4, m: 20 }));
});

test('every generated task has a valid correct answer and positive durations', () => {
  const rng = seeded(42);
  for (const level of CLOCK_LEVELS) {
    const deck = buildClockStageDeck(level.id, 30, rng);
    assert.equal(deck.length, 30);
    for (const task of deck) {
      if (task.kind === 'set') continue;
      assert.equal(task.choices.length, getClockLevel(level.id).choiceCount);
      assert.ok(task.correctIndex >= 0);
      assert.equal(new Set(task.choices.map((c) => c.key)).size, task.choices.length);
      if (task.kind === 'duration') {
        assert.ok(task.durationMinutes > 0);
        for (const c of task.choices) assert.ok(c.minutes > 0);
      }
    }
  }
});

test('stars follow accuracy thresholds', () => {
  assert.equal(clockStars(9, 10), 3);
  assert.equal(clockStars(7, 10), 2);
  assert.equal(clockStars(6, 10), 1);
});

test('old saved progress gets default clock fields', () => {
  const saved = JSON.stringify({ gems: 5, clockStars: { 1: 3, 2: 'bad' } });
  globalThis.localStorage = { getItem: () => saved, setItem() {}, removeItem() {} };
  const progress = loadProgress();
  assert.equal(progress.clockLevelUnlocked, 1);
  assert.deepEqual(progress.clockStars, { 1: 3 });
});
