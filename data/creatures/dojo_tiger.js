// ════════════════════════════════════════════════════
// CREATURE: DOJO TIGER  —  Debug / Testing Dummy
// ════════════════════════════════════════════════════
// Currently loaded: CORRUPTED BLOOM kit
// Swap innate and deckOrder to test any ability/card combo.
// High HP so fights last. Fast AGI so cards play quickly.

CREATURES.dojo_tiger = {
  id:       'dojo_tiger',
  name:     'DOJO TIGER',
  icon:     '🐯',
  lore:     'A patient sparring partner. It fights however you tell it to.',
  role:     'Debug / Testing',
  bossOnly: false,

  baseStats: { str:20, agi:18, wis:14 },
  growth:    { str:2,  agi:1,  wis:1 },

  // ═══ CURRENTLY TESTING: Corrupted Bloom innate ═══
  innate: {
    id:       'corruption_spread',
    name:     'Corruption Spread',
    desc:     'Passive: when the opponent plays an attack card, [Sorcery] [20]: create a Corrupt Spore ([Weaken] 4s, Ethereal) in own hand.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_opponent_attack', condition: 'has_mana_20', effect: {type: 'corruption_spread'} }
    ],
  },

  // ═══ CURRENTLY TESTING: Corrupted Bloom cards ═══
  deckOrder: ['bloom_vine_lash', 'bloom_rot_guard', 'bloom_wilt'],
};

// Backup triggers for registry
CREATURES.dojo_tiger._innateTriggers = [
  { on: 'on_opponent_attack', condition: 'has_mana_20', effect: {type: 'corruption_spread'} }
];
