// ════════════════════════════════════════════════════
// CREATURE: SWAMP SNAKE
// ════════════════════════════════════════════════════

CREATURES.snake = {
  id:       'snake',
  name:     'SWAMP SNAKE',
  icon:     '🐍',
  lore:     'The swamp breeds them long and patient. They coil beneath the surface of still water and wait for vibration. The venom is not immediately lethal — it is designed to slow prey down, so the snake can take its time.',
  role:     'Poison / Tempo',
  bossOnly: false,

  baseStats: { str:10, agi:14, wis:10 },
  growth:    { str:1,  agi:2,  wis:0 },

  innate: {
    id:       'venomous',
    name:     'Venomous',
    desc:     'Passive: all attack cards apply 1 [Poison].',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_attack', effect: {type: 'poison', dpt: 1, dur: 8} }
    ],
  },

  // Deck generated from STR + deckOrder (10 cards at base)
  // 10 ÷ 5 = 2 each
  deckOrder: ['snake_fang', 'snake_coil', 'snake_spit'],
};
// Backup: protect triggers array from being stripped
CREATURES.snake._innateTriggers = [{"on": "on_attack", "effect": {"type": "poison", "dpt": 1, "dur": 8}}];
