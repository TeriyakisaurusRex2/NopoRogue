// ════════════════════════════════════════════════════
// CREATURE: SLIME
// ════════════════════════════════════════════════════

CREATURES.slime = {
  id:       'slime',
  name:     'SLIME',
  icon:     '🟢',
  lore:     'A quivering mound of translucent ooze that has no business being alive and yet insists on it. It absorbs what it touches — weapons, spells, the occasional overconfident adventurer. It learns by eating.',
  bossOnly: false,

  baseStats: { str:11, agi:11, wis:13 },
  growth:    { str:1,  agi:2, wis:1 },

  innate: {
    id:       'absorb',
    name:     'Absorb',
    desc:     'Create an [Ethereal] copy of the last card played (by either side).',
    active:   true,
    cost:     30,
    cooldown: 3000,
    effect: [
      {type: 'copy_last_card'}
    ],
  },

  deckOrder: ['slime_dissolve', 'slime_split', 'slime_catalyse'],
};
CREATURES.slime._innateEffect = [{type: 'copy_last_card'}];
