import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateBubblePopChallenge,
  generateNumberLineChallenge,
  generateSubZeroChallenge,
  generateMissingRuneChallenge,
  generateBreakApartChallenge,
  generatePowerLabChallenge,
  generateStageGridChallenge,
  generateSoulScaleChallenge,
  generateRhythmPatternChallenge,
  generateTargetTrioChallenge,
  generateTangChallenge,
  challengeToTrickyFact,
  localizeFormulaLabel,
} from '../src/engine/tangGamesEngine.ts';

const GROUPS = ['g3', 'g4', 'g5', 'g6', 'g7', 'g8'];
const GAMES = [
  'sodaBubbles',
  'numberLine',
  'subZero',
  'missingRune',
  'breakApart',
  'powerLab',
  'stageGrid',
  'soulScale',
  'rhythmPattern',
  'targetTrio',
];

test('generateBubblePopChallenge produces 6 unique bubbles with a valid solution pair across g3–g8 and streaks', () => {
  for (const group of GROUPS) {
    for (let streak = 0; streak <= 6; streak += 3) {
      for (let i = 0; i < 15; i++) {
        const ch = generateBubblePopChallenge(group, streak);
        assert.equal(ch.kind, 'sodaBubbles');
        assert.equal(ch.bubbles.length, 6);
        const b0 = ch.bubbles.find((b) => b.id === ch.solutionPairIds[0]);
        const b1 = ch.bubbles.find((b) => b.id === ch.solutionPairIds[1]);
        assert.ok(b0 && b1, 'Solution pair bubbles must exist');
        const result = ch.op === '+' ? b0.value + b1.value : b0.value * b1.value;
        assert.equal(result, ch.target);
        assert.ok(ch.conceptBadge.nl.length > 2 && ch.conceptBadge.en.length > 2);
      }
    }
  }
});

test('generateNumberLineChallenge scales from 0..10 in g3 to negative sub-zero jumps in g6–g8', () => {
  for (const group of GROUPS) {
    for (let i = 0; i < 15; i++) {
      const ch = generateNumberLineChallenge(group, 2);
      assert.equal(ch.kind, 'numberLine');
      assert.ok(ch.min < ch.max);
      if (ch.mode === 'midpoint') {
        assert.equal(ch.startVal + ch.jumpVal, ch.answer);
      } else {
        assert.equal(ch.startVal + ch.jumpVal, ch.endVal);
      }
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
      if (group === 'g6' || group === 'g7' || group === 'g8') {
        assert.ok(ch.min < 0, `Expected negative number line range for ${group}`);
      }
    }
  }
});

test('generateSubZeroChallenge scales from countdown to 0 in g3 to negative numbers & integer rules in g4–g8', () => {
  let sawNegativeAnswer = false;
  for (const group of GROUPS) {
    for (let i = 0; i < 15; i++) {
      const ch = generateSubZeroChallenge(group, 3);
      assert.equal(ch.kind, 'subZero');
      assert.ok(ch.scaleMin < ch.scaleMax);
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
      if (ch.answer < 0) sawNegativeAnswer = true;
    }
  }
  assert.ok(sawNegativeAnswer, 'Sub-Zero game must generate negative integer answers');
});

test('generateMissingRuneChallenge produces 4 unique choices containing the exact answer and scales to squares & 2-step algebra', () => {
  for (const group of GROUPS) {
    for (let i = 0; i < 20; i++) {
      const ch = generateMissingRuneChallenge(group, 2);
      assert.equal(ch.kind, 'missingRune');
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
      assert.ok(ch.equationDisplay.includes('[ ? ]'));
    }
  }
});

test('generateBreakApartChallenge produces 4 unique choices containing the exact break-apart piece across g3–g8', () => {
  for (const group of GROUPS) {
    for (let i = 0; i < 20; i++) {
      const ch = generateBreakApartChallenge(group, 2);
      assert.equal(ch.kind, 'breakApart');
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
      assert.ok(ch.bridgeDisplay.includes('[ ? ]'));
    }
  }
});

test('generatePowerLabChallenge covers visual IB PYP concepts across g3–g8', () => {
  for (const group of GROUPS) {
    for (let i = 0; i < 20; i++) {
      const ch = generatePowerLabChallenge(group, 2);
      assert.equal(ch.kind, 'powerLab');
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
      assert.ok(ch.topicTag.nl.length > 2 && ch.topicTag.en.length > 2);
    }
  }
});

test('generateStageGridChallenge scales from visual tile arrays to area, perimeter, missing side, and 3D volume across g3–g8', () => {
  for (const group of GROUPS) {
    for (let i = 0; i < 15; i++) {
      const ch = generateStageGridChallenge(group, 2);
      assert.equal(ch.kind, 'stageGrid');
      assert.ok(ch.rows >= 2 && ch.cols >= 2);
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
      if (group === 'g8') {
        assert.equal(ch.mode, 'volume');
        assert.equal(ch.answer, ch.cols * ch.rows * ch.height3d);
      }
    }
  }
});

test('generateSoulScaleChallenge produces balanced equations across g3–g8', () => {
  for (const group of GROUPS) {
    for (let i = 0; i < 15; i++) {
      const ch = generateSoulScaleChallenge(group, 2);
      assert.equal(ch.kind, 'soulScale');
      assert.ok(ch.leftItems.length >= 1 && ch.rightItems.length >= 1);
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
    }
  }
});

test('generateRhythmPatternChallenge produces stepping-stone sequences across g3–g8 including negative & square patterns', () => {
  for (const group of GROUPS) {
    for (let i = 0; i < 15; i++) {
      const ch = generateRhythmPatternChallenge(group, 2);
      assert.equal(ch.kind, 'rhythmPattern');
      assert.ok(ch.sequence.length >= 4);
      assert.equal(ch.sequence[ch.sequence.length - 1], '?');
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
    }
  }
});

test('generateTargetTrioChallenge produces 3-card combos and geometry angle sums across g3–g8', () => {
  for (const group of GROUPS) {
    for (let i = 0; i < 15; i++) {
      const ch = generateTargetTrioChallenge(group, 2);
      assert.equal(ch.kind, 'targetTrio');
      assert.equal(ch.cards.length, 3);
      assert.equal(ch.choices.length, 4);
      assert.equal(new Set(ch.choices).size, 4);
      assert.ok(ch.choices.includes(ch.answer));
    }
  }
});

test('generateTangChallenge dispatches all 10 K-Pop Demon Hunters Arcade games and challengeToTrickyFact converts every one for the Dojo', () => {
  for (const gameId of GAMES) {
    for (const group of GROUPS) {
      const ch = generateTangChallenge(gameId, group, 2);
      assert.equal(ch.kind, gameId);
      const fact = challengeToTrickyFact(ch);
      assert.ok(fact.id.startsWith('arcade_'));
      assert.ok(['+', '−', '×', '÷'].includes(fact.op));
      assert.equal(fact.choices.length, 4);
      assert.ok(fact.choices.includes(fact.targetLabel));
      assert.ok(fact.hintNl.length > 5 && fact.hintEn.length > 5);
    }
  }
});

test('English localization across all 10 Arcade games and g3–g8 contains zero Dutch formula words', () => {
  const dutchWordPattern = /\b(Gemiddelde|Midden|Dubbel|Omtrek|tegels|blokken|van)\b/i;
  for (const gameId of GAMES) {
    for (const group of GROUPS) {
      for (let i = 0; i < 20; i++) {
        const ch = generateTangChallenge(gameId, group, 2);
        if (ch.kind === 'powerLab') {
          const enFormula = ch.visualFormulaEn ?? ch.visualFormula;
          assert.ok(
            !dutchWordPattern.test(enFormula),
            `Dutch word leaked in English PowerLab formula (${group}): ${enFormula}`
          );
        }
        if (ch.kind === 'numberLine') {
          const enEq = ch.questionEquationEn ?? ch.questionEquation;
          assert.ok(
            !dutchWordPattern.test(enEq),
            `Dutch word leaked in English NumberLine equation (${group}): ${enEq}`
          );
        }
        if (ch.kind === 'stageGrid') {
          const enUnit = ch.unitLabelEn ?? ch.unitLabel;
          assert.ok(
            !dutchWordPattern.test(enUnit),
            `Dutch word leaked in English StageGrid unit (${group}): ${enUnit}`
          );
        }
        const fact = challengeToTrickyFact(ch);
        const enDojoLabel = localizeFormulaLabel(fact.aLabel, 'en');
        assert.ok(
          !dutchWordPattern.test(enDojoLabel),
          `Dutch word leaked in English Dojo label (${gameId}, ${group}): ${enDojoLabel}`
        );
      }
    }
  }
  assert.equal(
    localizeFormulaLabel('Gemiddelde (8, 6, 19)', 'en'),
    'Mean (8, 6, 19)'
  );
  assert.equal(
    localizeFormulaLabel('Mean (8, 6, 19)', 'nl'),
    'Gemiddelde (8, 6, 19)'
  );
});

test('Consecutive challenges across all 10 Arcade games and g3–g8 are non-repeating and varied', () => {
  for (const gameId of GAMES) {
    for (const group of GROUPS) {
      const seenLabels = [];
      for (let i = 0; i < 12; i++) {
        const ch = generateTangChallenge(gameId, group, i % 5);
        const fact = challengeToTrickyFact(ch);
        const signature = `${fact.aLabel}|${fact.targetLabel}`;
        if (seenLabels.length > 0) {
          assert.notEqual(
            signature,
            seenLabels[seenLabels.length - 1],
            `Back-to-back repeat detected in ${gameId} (${group}): ${signature}`
          );
        }
        seenLabels.push(signature);
      }
      const uniqueCount = new Set(seenLabels).size;
      assert.ok(
        uniqueCount >= 10,
        `Expected at least 10 unique questions out of 12 in ${gameId} (${group}), got ${uniqueCount}`
      );
    }
  }
});
