// ════════════════════════════════════════════════════
// CREATURE: CULTIST  (faction: cultist)
// ════════════════════════════════════════════════════
// Uncommon WIS caster. Self-sacrifice / Bleed.
// Identity = Blood Offering: pay HP (not mana) to draw — a blood-cult
// engine that feeds its mana-rich, card-starved body more spells.
// Bleed (WIS-scaled) is the win condition the cards deliver.
//
// FACTION NOTE: first of a planned "cultist" faction built around
// self-sacrifice (HP-as-cost) for advantage. The HP-cost innate
// plumbing (innate.costHp) is reusable for future faction members.

CREATURES.cultist = {
  id:       'cultist',
  name:     'CULTIST',
  icon:     '🩸',
  lore:     'The cult learned long ago that blood is the only honest currency. They pay it freely, their own and yours, and the more they spend the clearer the next step becomes. A cultist does not fear the wound. The wound is the point.',
  bossOnly: false,
  faction:  'cultist',

  baseStats: { str:12, agi:10, wis:18 },
  growth:    { str:1,  agi:1,  wis:3  },
  
	altSprites: ['_alt_1'],
		spriteWeights: [
		  { sprite: 'default', weight: 80 },
		  { sprite: '_alt_1',  weight: 20 }
		],
  innate: {
    id:       'blood_offering',
    name:     'Blood Offering',
    desc:     'Lose 20% of max HP, then draw 2 cards.',
    active:   true,
    cost:     0,        // no mana
    costHp:   0.2,      // 20% of max HP (self-sacrifice)
    cooldown: 3000,     // low — HP is the real throttle
    effect: [
      {type:'draw_cards', count:2}
    ],
  },

  deckOrder: ['cultist_bloodletting', 'cultist_hex_ward', 'cultist_sanguine_bolt'],
};
CREATURES.cultist._innateEffect = [{type:'draw_cards', count:2}];
