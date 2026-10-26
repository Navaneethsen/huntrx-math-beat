import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSinglePuzzle,
  generateChainPuzzle,
  analyzeKakoomaSet,
  formatPuzzleValue,
  getSkillOperation,
} from '../src/engine/kakoomaGenerator.ts';

const POOLS = {
  fracEasy: { 4: [6, 8, 10], 5: [8, 10, 12], 6: [12] },
  fracPro: { 4: [8, 10, 12], 5: [10, 12], 6: [12] },
};

function assertBoundedUnique(puzzle, skill, poolSize, label) {
  const { denominator, simplify } = puzzle.fractionData;
  assert.ok(POOLS[skill][poolSize].includes(denominator), `${label}: denominator ${denominator}`);
  assert.equal(simplify, skill === 'fracPro');
  const max = skill === 'fracPro' ? denominator - 1 : denominator;
  for (const n of puzzle.numbers) {
    assert.ok(n >= 1 && n <= max, `${label}: value ${n}/${denominator} must stay within one whole`);
  }
  assert.equal(new Set(puzzle.numbers).size, puzzle.numbers.length, `${label}: distinct orbs`);
  const { validTargets } = analyzeKakoomaSet(puzzle.numbers, '+');
  assert.equal(validTargets.size, 1, `${label}: exactly one valid sum in [${puzzle.numbers}]`);
  assert.ok(validTargets.has(puzzle.target), `${label}: stored target is the valid sum`);
  assert.equal(puzzle.pair[0] + puzzle.pair[1], puzzle.target);
}

for (const skill of ['fracEasy', 'fracPro']) {
  for (const size of [4, 5, 6]) {
    test(`${skill} size ${size}: single seals stay ≤ 1 whole with one answer`, () => {
      for (let i = 0; i < 200; i += 1) {
        const p = generateSinglePuzzle(skill, size);
        assert.equal(p.numbers.length, size);
        assertBoundedUnique(p, skill, size, `${skill}/${size}#${i}`);
      }
    });

    test(`${skill} size ${size}: chains share a feasible denominator and stay bounded`, () => {
      // Pro 6-orb chains use 5-orb outer seals: proper fractions over 12 cannot fill six orbs for every answer.
      const outerSize = skill === 'fracPro' && size === 6 ? 5 : size;
      for (let i = 0; i < 30; i += 1) {
        const chain = generateChainPuzzle(skill, size);
        const den = chain.centerPuzzle.fractionData.denominator;
        assertBoundedUnique(chain.centerPuzzle, skill, outerSize, `center#${i}`);
        chain.outerPuzzles.forEach((outer, j) => {
          assert.equal(outer.fractionData.denominator, den);
          assert.equal(outer.target, chain.centerPuzzle.numbers[j], 'outer answer feeds the center');
          assert.equal(outer.numbers.length, outerSize);
          assertBoundedUnique(outer, skill, outerSize, `outer#${i}.${j}`);
        });
      }
    });
  }
}

test('fracPro seals show simplified fractions that never equal one whole', () => {
  for (let i = 0; i < 100; i += 1) {
    const p = generateSinglePuzzle('fracPro', 5);
    for (const n of p.numbers) {
      const f = formatPuzzleValue(p, n);
      assert.ok(f.num < f.den, `${f.text} must be a proper fraction`);
    }
  }
});

test('every non-fraction skill produces correct equations for its operation', () => {
  for (const skill of ['add10', 'add20', 'add50', 'sub20', 'sub100', 'multEasy', 'multAll', 'divAll']) {
    const op = getSkillOperation(skill);
    for (let i = 0; i < 100; i += 1) {
      const p = generateSinglePuzzle(skill, 5);
      const [a, b] = p.pair;
      const expected = { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[op];
      assert.equal(expected, p.target, `${skill}: ${a} ${op} ${b} = ${p.target}`);
      assert.ok(p.numbers.includes(p.target));
    }
  }
});

test('multiplication chains stay inside the promised tables', () => {
  const easy = [2, 3, 4, 5, 10];
  for (const skill of ['multEasy', 'multAll']) {
    for (let i = 0; i < 40; i += 1) {
      for (const outer of generateChainPuzzle(skill, 5).outerPuzzles) {
        const [a, b] = outer.pair;
        assert.equal(a * b, outer.target);
        assert.ok(a >= 2 && a <= 10 && b >= 2 && b <= 10, `${skill}: ${a} × ${b}`);
        if (skill === 'multEasy') assert.ok(easy.includes(a) || easy.includes(b), `${a} × ${b}`);
      }
    }
  }
});
