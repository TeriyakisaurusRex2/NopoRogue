// ════════════════════════════════════════════════════
// CREATURE: GIANT RAT
// ════════════════════════════════════════════════════

CREATURES.rat = {
  id:       'rat',
  name:     'GIANT RAT',
  icon:     '🐀',
  lore:     'A bloated, mean-tempered rodent that thrives in the filth beneath every civilised place. The longer it fights, the faster it gets. Veterans know to end it quick.',
  bossOnly: false,

  baseStats: { str:10, agi:15, wis:8 },
  growth:    { str:1,  agi:2,  wis:1 },

  innate: {
    id:       'frenzied',
    name:     'Frenzied',
    desc:     'Passive: all attack cards gain +1 [Frenzy] stack.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_attack', effect: {type: 'frenzy', stacks: 1} }
    ],
  },

  // Deck generated from STR + deckOrder (12 cards at base)
  // 12 ÷ 5 = 2 each + 2 remainder → Gnaw 3, Slash 3, Dart 2, Strike 2, Brace 2
  deckOrder: ['rat_gnaw', 'rat_slash', 'rat_dart'],
};
// Backup: protect triggers array from being stripped
CREATURES.rat._innateTriggers = [{"on": "on_attack", "effect": {"type": "frenzy", "stacks": 1}}];
