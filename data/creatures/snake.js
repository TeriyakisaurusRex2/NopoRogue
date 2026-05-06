// ════════════════════════════════════════════════════
// CREATURE: SWAMP SNAKE
// ════════════════════════════════════════════════════

CREATURES.snake = {
  id:       'snake',
  name:     'SWAMP SNAKE',
  icon:     '🐍',
  lore:     'The swamp breeds them long and patient. They coil beneath the surface of still water and wait for vibration. The venom is not immediately lethal — it is designed to slow prey down, so the snake can take its time.',
  bossOnly: false,

  baseStats: { str:10, agi:14, wis:10 },
  growth:    { str:1,  agi:2,  wis:1  },

  innate: {
    id:       'venomous',
    name:     'Venomous',
    desc:     'All attack cards apply 1 [Poison].',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_attack', effect: {type: 'apply_status', status: 'poison', target: 'opponent', value: 1, dur: 8} }
    ],
  },

  deckOrder: ['snake_fang', 'snake_coil', 'snake_spit'],
};
CREATURES.snake._innateTriggers = [
  {on: 'on_attack', effect: {type: 'apply_status', status: 'poison', target: 'opponent', value: 1, dur: 8}}
];
