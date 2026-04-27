// ════════════════════════════════════════════════════
// CREATURE: BANDIT
// ════════════════════════════════════════════════════

CREATURES.bandit = {
  id:       'bandit',
  name:     'BANDIT',
  icon:     '🗡️',
  lore:     'The road bandits are not organised. They do not need to be. Each one fights with the desperate efficiency of someone who has learned that hesitation is more expensive than recklessness. Quick hands, sharp steel, no honour.',
  role:     'Discard Engine / Multi-hit',
  bossOnly: false,

  baseStats: { str:12, agi:14, wis:8 },
  growth:    { str:1,  agi:2,  wis:1 },

  innate: {
    id:       'quick_hands',
    name:     'Quick Hands',
    desc:     'Discard 1 card. Draw 2 cards.',
    active:   true,
    cost:     20,
    cooldown: 3000,
    effect: [
      {type: 'discard_random', count: 1},
      {type: 'draw_cards', count: 2}
    ],
  },

  // Deck generated from STR + deckOrder (12 cards at base)
  // 12 ÷ 5 = 2 each + 2 remainder → Shiv 3, Ransack 3, Smoke Bomb 2, Strike 2, Brace 2
  deckOrder: ['bandit_shiv', 'bandit_ransack', 'bandit_smoke_bomb'],
};
// Backup: protect effect array from being stripped
CREATURES.bandit._innateEffect = [{"type": "discard_random", "count": 1}, {"type": "draw_cards", "count": 2}];
