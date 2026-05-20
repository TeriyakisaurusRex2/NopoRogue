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

	altSprites: ['_alt_1', '_alt_2', '_alt_3', '_alt_4'],
	spriteWeights: [
	  { sprite: 'default', weight: 60 },
	  { sprite: '_alt_1',  weight: 10 },
	  { sprite: '_alt_2',  weight: 10 },
	  { sprite: '_alt_3',  weight: 10 },
	  { sprite: '_alt_4',  weight: 10 },
	  
	],

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
