// ════════════════════════════════════════════════════
// CREATURE: TREE SPRITE
// ════════════════════════════════════════════════════
// Squishy WIS-primary wood-spirit for the Deeproot area.
// Every base card cycles a [Sorcery]-gated [Ethereal] Echo
// into hand on play; each Echo play triggers Sap (passive
// aura) to Mana Burn 10 in addition to the Sorcery effect.
// Base deck is never ethereal — Sprite's identity is the
// recurring spawn of ephemeral echoes that drain mana.

CREATURES.tree_sprite = {
  id:       'tree_sprite',
  name:     'TREE SPRITE',
  icon:     '🍃',
  lore:     'Older than memory, lighter than thought. A scrap of the tree\'s mind given enough shape to drift between the boughs. It does not strike. It passes through you, and where it passes, something is missing — a card, a breath, a held intention. By the time you turn to look, the sprite has already gone somewhere else, doing the same thing again.',
  bossOnly: false,

  baseStats: { str:10, agi:12, wis:18 },
  growth:    { str:1,  agi:2,  wis:3  },

	altSprites: ['_alt_1'],
				spriteWeights: [
				  { sprite: 'default', weight: 70 },
				  { sprite: '_alt_1',  weight: 30 }
				],
  innate: {
    id:       'sap',
    name:     'Sap',
    desc:     'Your [Ethereal] cards also [Mana Burn] 10.',
    active:   false,
    cost:     0,
    cooldown: 0,
    // Modifier aura — always on. etherealManaBurn is read by the Sap
    // hook in playCardForActor (combat.js) after a ghost item plays.
    auras: [
      { id:'sap', condition:'always', effect:{etherealManaBurn:10}, manabound:false }
    ],
  },

  deckOrder: ['tree_sprite_flicker', 'tree_sprite_wither', 'tree_sprite_phase'],
};
