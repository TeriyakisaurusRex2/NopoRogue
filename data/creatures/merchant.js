// ════════════════════════════════════════════════════
// CREATURE: THE MERCHANT
// ════════════════════════════════════════════════════
// Legendary NPC champion. Crit Chain / Conjure Engine.
// Markup (passive) conjures escalating-crit Banish copies into the
// draw pile on every crit. Insurance accrues Shield per crit while
// held; Rush Order's crit doubles its Haste duration.

CREATURES.merchant = {
  id:       'merchant',
  name:     'BARAU',
  icon:     '🪙',
  lore:     'A shifty deal-maker who always seems to get the better end of the bargain. Charming, slippery, never quite where you left him. Every fight, to Barau, is just another transaction.',
  bossOnly: false,

  baseStats: { str:12, agi:16, wis:22 },
  growth:    { str:1,  agi:2,  wis:3  },

  innate: {
    id:       'markup',
    name:     'Markup',
    desc:     'On [Crit]: conjure a copy into your deck with double [Crit] chance and [Banish].',
    active:   false,
    triggers: [
      {on:'on_crit', effect:{type:'markup_conjure'}}
    ],
  },

  deckOrder: ['merchant_loose_change', 'merchant_insurance', 'merchant_rush_order'],
};
CREATURES.merchant._innateTriggers = [
  {on:'on_crit', effect:{type:'markup_conjure'}}
];
