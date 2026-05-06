// ════════════════════════════════════════════════════
// CREATURE: WOLF
// ════════════════════════════════════════════════════

CREATURES.wolf = {
  id:       'wolf',
  name:     'WOLF',
  icon:     '🐺',
  lore:     'Lean, scarred, and patient. The wolves that hunt the Pale Road are not wild — they are precise. They wait for the moment you slow down. Then they are already moving.',
  bossOnly: false,

  baseStats: { str:10, agi:16, wis:10 },
  growth:    { str:1,  agi:3,  wis:1  },

  innate: {
    id:       'keen_senses',
    name:     'Keen Senses',
    desc:     'While [Haste] is active, all attack cards gain +[Crit] 25%.',
    active:   false,
    cost:     0,
    cooldown: 0,
    auras: [
      {id: 'keen_senses', condition: 'has_haste', effect: {attackCritBonus: 25}, manabound: false}
    ],
  },

  deckOrder: ['wolf_bite', 'wolf_lunge', 'wolf_howl'],
};
