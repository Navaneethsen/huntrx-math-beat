import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PHOTOCARD_CATALOG,
  RARITY_COSTS,
  createDefaultProgress,
  calculateSpeedGemReward,
} from '../src/engine/progressionStore.ts';

test('PHOTOCARD_CATALOG contains exactly 100 unique KPop Demon Hunters cards with 100 unique existing image files', () => {
  assert.equal(PHOTOCARD_CATALOG.length, 100);
  const ids = new Set(PHOTOCARD_CATALOG.map((c) => c.id));
  assert.equal(ids.size, 100, 'Every card ID must be unique');

  const numbers = new Set(PHOTOCARD_CATALOG.map((c) => c.cardNumber));
  assert.equal(numbers.size, 100, 'Card numbers 1..100 must be unique');
  assert.equal(Math.min(...numbers), 1);
  assert.equal(Math.max(...numbers), 100);

  const images = new Set(PHOTOCARD_CATALOG.map((c) => c.image));
  assert.equal(images.size, 100, 'Every card must have a unique image path');

  for (const card of PHOTOCARD_CATALOG) {
    assert.ok(
      card.image.startsWith('/images/kpop-cards/'),
      `Card ${card.id} image should be in /images/kpop-cards/: ${card.image}`
    );
    const absPath = path.join(process.cwd(), 'public', card.image);
    assert.ok(
      fs.existsSync(absPath),
      `Missing image file on disk for ${card.id}: ${absPath}`
    );
    const stat = fs.statSync(absPath);
    assert.ok(
      stat.size > 1000,
      `Image file for ${card.id} is too small (${stat.size} bytes)`
    );
  }

  // Verify manifest.json and reuse vault exist for later reuse
  const manifestPath = path.join(
    process.cwd(),
    'public/images/kpop-cards/manifest.json'
  );
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist for reuse');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.totalCards, 100);
  assert.ok(manifest.totalReuse >= 25);
});

test('PHOTOCARD_CATALOG preserves all 12 legacy card IDs for existing player profiles', () => {
  const legacyIds = [
    'card_rumi_gold',
    'card_mira_dance',
    'card_zoey_rap',
    'card_derpy_tiger',
    'card_sussie_magpie',
    'card_golden_honmoon',
    'card_jinu_redeemed',
    'card_soda_pop',
    'card_lightstick_vip',
    'card_saingeom_blade',
    'card_takedown_single',
    'card_world_tour_trophy',
  ];
  for (const id of legacyIds) {
    assert.ok(
      PHOTOCARD_CATALOG.some((c) => c.id === id),
      `Missing legacy card ID: ${id}`
    );
  }
});

test('All 100 cards have excitement-based gem values (90–950) above 50 and complete lore + quotes', () => {
  assert.deepEqual(RARITY_COSTS, {
    common: 100,
    rare: 200,
    epic: 350,
    golden: 600,
  });

  for (const card of PHOTOCARD_CATALOG) {
    assert.ok(
      card.excitement >= 60 && card.excitement <= 100,
      `Card ${card.id} excitement should be in 60..100, got ${card.excitement}`
    );
    assert.ok(
      card.cost >= 90 && card.cost <= 950,
      `Card ${card.id} cost should be in 90..950, got ${card.cost}`
    );
    assert.ok(card.title.nl.length > 3 && card.title.en.length > 3);
    assert.ok(card.subtitle.nl.length > 3 && card.subtitle.en.length > 3);
    assert.ok(
      card.lore.nl.length > 20 && card.lore.en.length > 20,
      `Card ${card.id} must have rich bilingual Fandom lore`
    );
    assert.ok(
      card.quote.nl.length > 10 && card.quote.en.length > 10,
      `Card ${card.id} must have a bilingual movie transcript quote`
    );
    assert.ok(card.mathBonus.nl.length > 5 && card.mathBonus.en.length > 5);
  }

  // Verify higher excitement images always have >= gem cost than lower excitement images
  for (const a of PHOTOCARD_CATALOG) {
    for (const b of PHOTOCARD_CATALOG) {
      if (a.excitement > b.excitement) {
        assert.ok(
          a.cost >= b.cost,
          `Higher excitement card ${a.id} (🔥${a.excitement}, ${a.cost}💎) must cost >= lower excitement card ${b.id} (🔥${b.excitement}, ${b.cost}💎)`
        );
      }
    }
  }
});

test('createDefaultProgress starts with 120 Gems so a child can unlock a 100-Gem card', () => {
  const progress = createDefaultProgress();
  assert.equal(progress.gems, 120);
  assert.ok(progress.unlockedCards.includes('card_derpy_tiger'));
});

test('calculateSpeedGemReward scales Gems by solve time and penalizes hints/misses', () => {
  const lightning = calculateSpeedGemReward(2200, false);
  assert.equal(lightning.tier, 'lightning');
  assert.equal(lightning.gems, 8);

  const fast = calculateSpeedGemReward(5400, false);
  assert.equal(fast.tier, 'fast');
  assert.equal(fast.gems, 5);

  const steady = calculateSpeedGemReward(10500, false);
  assert.equal(steady.tier, 'steady');
  assert.equal(steady.gems, 3);

  const slow = calculateSpeedGemReward(18000, false);
  assert.equal(slow.tier, 'careful');
  assert.equal(slow.gems, 1);

  const withPenaltyEvenIfFast = calculateSpeedGemReward(1800, true);
  assert.equal(withPenaltyEvenIfFast.tier, 'careful');
  assert.equal(withPenaltyEvenIfFast.gems, 1);

  assert.ok(lightning.gems > fast.gems);
  assert.ok(fast.gems > steady.gems);
  assert.ok(steady.gems > slow.gems);
});
