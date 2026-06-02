// ════════════════════════════════════════════════════
// CREATURE: GROLL
// ════════════════════════════════════════════════════
// Stone-monk elemental that tends the Deeproot tree.
// Slow STR/WIS keeper. Churn-focused engine, Stun secondary.
// Tending (passive aura) adds +1 to every Churn he runs.
// The aura key (churnBonus) is shared, so future relics that
// boost Churn stack into the same number cleanly.

CREATURES.groll = {
  id:       'groll',
  name:     'GROLL',
  icon:     '🪨',
  lore:     'Stone the colour of riverbed slate, carved into the shape of a monk and given the slow patience of geology. The grolls tend the boughs of Deeproot without speaking, without hurrying, without ever quite finishing. Strike one and it does not flinch. It simply turns toward you and continues the work elsewhere — until, eventually, the work is you.',
  bossOnly: false,

  baseStats: { str:14, agi:10, wis:14 },
  growth:    { str:2,  agi:1, wis:2  },

	altSprites: ['_alt_1'],
				spriteWeights: [
				  { sprite: 'default', weight: 90 },
				  { sprite: '_alt_1',  weight: 10 }
				],
  innate: {
    id:       'tending',
    name:     'Tending',
    desc:     'Your [Churn] effects [Churn] 1 additional.',
    active:   false,
    cost:     0,
    cooldown: 0,
    // Modifier aura — always on. churnBonus is read by EFFECT_TYPES.churn
    // (both run and display) — relics that boost Churn add to the same key.
    auras: [
      { id:'tending', condition:'always', effect:{churnBonus:1}, manabound:false }
    ],
  },

  deckOrder: ['groll_granite_fist', 'groll_resonance', 'groll_stonewall'],
};
