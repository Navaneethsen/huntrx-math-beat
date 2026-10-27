import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CURRICULUM_GROUPS,
  getCurriculumGroup,
  getNextSchoolGroup,
  getAutoProgressedCurriculum,
} from '../src/engine/curriculumGroups.ts';
import { STAGE_SKILL_ORDER } from '../src/engine/progressionStore.ts';

test('CURRICULUM_GROUPS defines Groep 3–8 / IB PYP 1–6 with valid missions, concept tags, and zero mentions of external brands', () => {
  assert.equal(CURRICULUM_GROUPS.length, 6);
  const expectedIds = ['g3', 'g4', 'g5', 'g6', 'g7', 'g8'];
  assert.deepEqual(
    CURRICULUM_GROUPS.map((g) => g.id),
    expectedIds
  );

  for (const group of CURRICULUM_GROUPS) {
    assert.ok(STAGE_SKILL_ORDER.includes(group.defaultSkill));
    assert.ok([4, 5, 6].includes(group.defaultSealSize));
    assert.ok(group.transcriptQuote.nl.length > 10);
    assert.ok(group.transcriptQuote.en.length > 10);
    assert.ok(group.conceptTags.nl.length >= 4);
    assert.ok(group.conceptTags.en.length >= 4);
    assert.equal(group.missions.length, 4);

    const serialized = JSON.stringify(group).toLowerCase();
    assert.ok(
      !serialized.includes('squla'),
      `Group ${group.id} should not mention Squla in any text`
    );
    // Property names 'ixlSummary' and 'ixlSkillCode' exist for backward compatibility, check values:
    assert.ok(!group.shortLabel.nl.toLowerCase().includes('ixl'));
    assert.ok(!group.shortLabel.en.toLowerCase().includes('ixl'));
    assert.ok(!group.fullTitle.nl.toLowerCase().includes('ixl'));
    assert.ok(!group.fullTitle.en.toLowerCase().includes('ixl'));
    assert.ok(!group.ixlSummary.nl.toLowerCase().includes('ixl'));
    assert.ok(!group.ixlSummary.en.toLowerCase().includes('ixl'));

    for (const mission of group.missions) {
      assert.ok(STAGE_SKILL_ORDER.includes(mission.skill));
      assert.ok([4, 5, 6].includes(mission.sealSize));
      assert.ok(mission.title.nl.length > 3 && mission.title.en.length > 3);
      assert.ok(mission.ixlSkillCode.nl.length > 3 && mission.ixlSkillCode.en.length > 3);
      assert.ok(!mission.ixlSkillCode.nl.toLowerCase().includes('ixl'));
      assert.ok(!mission.ixlSkillCode.en.toLowerCase().includes('ixl'));
    }
  }
});

test('getCurriculumGroup falls back to g5 (Groep 5 / IB PYP 3) when undefined', () => {
  const fallback = getCurriculumGroup(undefined);
  assert.equal(fallback.id, 'g5');
  assert.equal(getCurriculumGroup('g3').id, 'g3');
  assert.equal(getCurriculumGroup('g8').id, 'g8');
});

test('getNextSchoolGroup and getAutoProgressedCurriculum advance missions and promote groups smoothly', () => {
  assert.equal(getNextSchoolGroup('g3'), 'g4');
  assert.equal(getNextSchoolGroup('g7'), 'g8');
  assert.equal(getNextSchoolGroup('g8'), 'g8');

  // Within g3: first mission is add10 size 4 -> advances to next mission in g3
  const step1 = getAutoProgressedCurriculum('g3', 'add10', 4);
  assert.equal(step1.nextGroupId, 'g3');
  assert.equal(step1.promotedGroup, false);

  // At the end of g3's final mission (sub20 size 5) -> promotes to g4!
  const g3Last = getCurriculumGroup('g3').missions[3];
  const promoted = getAutoProgressedCurriculum('g3', g3Last.skill, g3Last.sealSize);
  assert.equal(promoted.nextGroupId, 'g4');
  assert.equal(promoted.promotedGroup, true);
});
