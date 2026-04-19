// ════════════════════════════════════════════════════
// CREATURE: CARRION COLLECTOR
// ════════════════════════════════════════════════════

CREATURES.carrion_collector = {
  id:       'carrion_collector',
  name:     'CARRION COLLECTOR',
  icon:     '👁️',
  lore:     'It settles over things that are finished and waits. What it is waiting for is unclear. Scouts who have observed it report that it seems to grow slightly larger after each meal, though measurements have been inconsistent.',
  role:     'Discard Cycling / Shield Tank',
  bossOnly: false,

  baseStats: { str:15, agi:13, wis:10 },
  growth:    { str:2,  agi:1,  wis:1  },

  innate: {
    id:       'feast_on_carrion',
    name:     'Feast on Carrion',
    desc:     'Gain [Shield] equal to cards in discard pile × 4. Then [Refresh].',
    active:   true,
    cost:     25,
    cooldown: 3000,
  },

  deck: [
    'carrion_consume',
    'carrion_consume',
    'carrion_shell',
    'carrion_shell',
    'carrion_retch',
  ],
};
