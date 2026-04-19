// ════════════════════════════════════════════════════
// CREATURE: PLAGUED ONE
// ════════════════════════════════════════════════════

CREATURES.plagued_one = {
  id:       'plagued_one',
  name:     'PLAGUED ONE',
  icon:     '☠️',
  lore:     'A cultist who completed the rite of willing infection and survived it. They consider this proof of divine favour. The distinction between faith and disease has stopped mattering to them entirely.',
  role:     'Poison Carrier / Transfer Burst',
  bossOnly: false,

  baseStats: { str:9,  agi:8,  wis:16 },
  growth:    { str:1,  agi:1,  wis:2  },

  innate: {
    id:       'plague_bearer',
    name:     'Plague Bearer',
    desc:     'This creature is immune to damage from [Poison].',
    active:   false,
    cost:     0,
    cooldown: 0,
  },

  deck: [
    'plagued_festering_touch',
    'plagued_festering_touch',
    'plagued_plague_offering',
    'plagued_plague_offering',
    'plagued_spread',
  ],
};
