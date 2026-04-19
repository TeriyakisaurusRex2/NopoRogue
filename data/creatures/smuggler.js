// ════════════════════════════════════════════════════
// CREATURE: SMUGGLER
// ════════════════════════════════════════════════════

CREATURES.smuggler = {
  id:       'smuggler',
  name:     'SMUGGLER',
  icon:     '🗡️',
  lore:     'A professional who has moved contraband through every sewer tunnel in the city. He does not fight with strength. He fights by making sure you have nothing left to fight with by the time you notice what he is doing.',
  role:     'Mana Thief / Sorcery Burst',
  bossOnly: false,

  baseStats: { str:10, agi:14, wis:8 },
  growth:    { str:1,  agi:1,  wis:1 },

  innate: {
    id:       'light_fingers',
    name:     'Light Fingers',
    desc:     'Whenever this creature plays a card, [Drain] 5 mana from the opponent.',
    active:   false,
    cost:     0,
    cooldown: 0,
  },

  deck: [
    'smuggler_shiv',
    'smuggler_shiv',
    'smuggler_smoke_cover',
    'smuggler_smoke_cover',
    'smuggler_lifted_purse',
  ],
};
