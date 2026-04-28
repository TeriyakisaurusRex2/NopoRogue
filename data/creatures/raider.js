// ════════════════════════════════════════════════════
// CREATURE: RAIDER  —  Ransacked Temple
// ════════════════════════════════════════════════════
// AGI / Hand Pollution / Shield Strip
// Active: Raid — strip opponent's Shield, deal AGI-scaled damage.
// Core loop: Rummage creates treasure in own hand + junk in opponent's.
// Plundered Goods scales with hand size for big burst.
// Counterplay: play fast to dump junk, burst before Rummage cycle.

CREATURES.raider = {
  id:       'raider',
  name:     'RAIDER',
  icon:     '⚔️',
  lore:     'They came for the temple\'s treasures. They found ruin. But a raider takes what a raider finds, and what they find now is opportunity. Quick hands, no reverence, no hesitation.',
  role:     'AGI / Hand Pollution',
  bossOnly: false,

  baseStats: { str:10, agi:16, wis:8 },
  growth:    { str:1,  agi:2,  wis:1 },

  innate: {
    id:       'raid',
    name:     'Raid',
    desc:     'Active: Remove all Shield from opponent. Deal 10+AGI÷4 damage.',
    active:   true,
    cost:     30,
    cooldown: 5000,
    effect: [
      { type: 'cleanse', target: 'opponent', what: 'shield' },
      { type: 'dmg_scaling', base: 10, source: 'stat', stat: 'agi', stat_div: 4 }
    ],
  },

  deckOrder: ['raider_rummage', 'raider_flurry', 'raider_hunker'],
};

CREATURES.raider._innateEffect = [
  { type: 'cleanse', target: 'opponent', what: 'shield' },
  { type: 'dmg_scaling', base: 10, source: 'stat', stat: 'agi', stat_div: 4 }
];







