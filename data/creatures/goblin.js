// ════════════════════════════════════════════════════
// CREATURE: GOBLIN SCAVENGER
// ════════════════════════════════════════════════════

CREATURES.goblin = {
  id:       'goblin',
  name:     'GOBLIN SCAVENGER',
  icon:     '👺',
  lore:     'Scavengers pick through what others leave behind — bodies, refuse, the aftermath of something worse. They are not dangerous alone. The danger is that they are never alone.',
  role:     'Debuffer / Attrition',
  bossOnly: false,

  baseStats: { str:10, agi:12, wis:10 },
  growth:    { str:1,  agi:1,  wis:1  },

  innate: {
    id:       'filthy_persistence',
    name:     'Filthy Persistence',
    desc:     'All debuffs applied by this creature last 50% longer.',
    active:   false,
    cost:     0,
    cooldown: 0,
  },

  deck: [
    'goblin_filth_toss',
    'goblin_filth_toss',
    'goblin_crippling_jab',
    'goblin_crippling_jab',
    'goblin_pocket_sand',
  ],
};
