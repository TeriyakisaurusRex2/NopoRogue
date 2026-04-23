// ════════════════════════════════════════════════════
// CREATURE: FACELESS THIEF
// ════════════════════════════════════════════════════

CREATURES.thief = {
  id:       'thief',
  name:     'FACELESS THIEF',
  icon:     '🎭',
  lore:     'No name. No history. The face they wear belongs to someone else. They are very good at their work, which is the only thing they know for certain about themselves. The clues to who they were are scattered across the city — in graves, in ledgers, in the faces of people who look at them and go pale.',
  role:     'Poison Setup / Crit Burst',
  bossOnly: false,

  baseStats: { str:10, agi:18, wis:12 },
  growth:    { str:1,  agi:2,  wis:1  },

  innate: {
    id:       'shadow_mark',
    name:     'Shadow Mark',
    desc:     'Apply 6 [Poison]. Next attack card: +[Crit]: 100%.',
    active:   true,
    cost:     35,
    cooldown: 2000,
  },

  // Deck is generated from STR. The 5 identity cards below are distributed
  // evenly (20% each) at STR 10. Extra slots from higher STR are filled in
  // deckOrder priority: unique cards first (in listed order), then universals.
  deckOrder: ['thief_quick_slash', 'thief_poison_dart', 'thief_shadow_step'],
};
