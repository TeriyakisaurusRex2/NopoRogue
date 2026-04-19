// ════════════════════════════════════════════════════
// CREATURE: GIANT RAT
// ════════════════════════════════════════════════════

CREATURES.rat = {
  id:       'rat',
  name:     'GIANT RAT',
  icon:     '🐀',
  lore:     'A bloated, mean-tempered rodent that thrives in the filth beneath every civilised place. The longer it fights, the faster it gets. Veterans know to end it quick.',
  role:     'Tempo / Frenzy',
  bossOnly: false,

  baseStats: { str:12, agi:14, wis:5 },
  growth:    { str:1,  agi:2,  wis:1 },

  innate: {
    id:       'frenzied',
    name:     'Frenzied',
    desc:     'Every 4s in combat, gain [Frenzy] (1 stack). The longer the fight, the faster you become.',
    active:   false,
    cost:     0,
    cooldown: 0,
  },

  deck: [
    'rat_gnaw',
    'rat_gnaw',
    'rat_gnaw',
    'rat_dart',
    'rat_dart',
  ],
};
