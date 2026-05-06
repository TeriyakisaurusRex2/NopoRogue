// ════════════════════════════════════════════════════
// CREATURE: GOBLIN SCAVENGER
// ════════════════════════════════════════════════════

CREATURES.goblin = {
  id:       'goblin',
  name:     'GOBLIN SCAVENGER',
  icon:     '👺',
  lore:     'Scavengers pick through what others leave behind — bodies, refuse, the aftermath of something worse. They are not dangerous alone. The danger is that they are never alone.',
  bossOnly: false,

  baseStats: { str:10, agi:14, wis:10 },
  growth:    { str:1,  agi:2,  wis:1  },

  innate: {
    id:       'filthy_persistence',
    name:     'Filthy Persistence',
    desc:     'All debuffs applied last 50% longer.',
    active:   false,
    cost:     0,
    cooldown: 0,
    auras: [
      {id: 'filthy_persistence', condition: 'always', effect: {debuffDurMult: 1.5}, manabound: false}
    ],
  },

  deckOrder: ['goblin_jab', 'goblin_brace', 'goblin_cheap_shot'],
};
