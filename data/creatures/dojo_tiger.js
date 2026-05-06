// ════════════════════════════════════════════════════
// CREATURE: DOJO TIGER  —  Debug / Testing Dummy
// ════════════════════════════════════════════════════
// Currently loaded: SPORE PUFF kit (testing)

CREATURES.dojo_tiger = {
  id:       'dojo_tiger',
  name:     'DOJO TIGER',
  icon:     '🐯',
  lore:     'A patient sparring partner. It fights however you tell it to.',
  bossOnly: false,

  // ═══ CURRENTLY TESTING: Spore Puff stats ═══
  baseStats: { str:10, agi:14, wis:10 },
  growth:    { str:1,  agi:1,  wis:1 },

  // ═══ CURRENTLY TESTING: Spore Puff innate ═══
  innate: {
    id:       'toxic_cloud',
    name:     'Toxic Cloud',
    desc:     'When a card is discarded, apply 1 [Poison] to enemy.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_discard', target: 'opponent', effect: {type: 'apply_status', status: 'poison', target: 'opponent', value: 1, dur: 8} }
    ],
  },

  // ═══ CURRENTLY TESTING: Spore Puff cards ═══
  deckOrder: ['sporepuff_spore_shot', 'sporepuff_puff', 'sporepuff_burst'],
};

CREATURES.dojo_tiger._innateTriggers = [
  {on: 'on_discard', target: 'opponent', effect: {type: 'apply_status', status: 'poison', target: 'opponent', value: 1, dur: 8}}
];
