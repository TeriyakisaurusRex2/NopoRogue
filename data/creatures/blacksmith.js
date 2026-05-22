// ════════════════════════════════════════════════════
// CREATURE: FORGE BLACKSMITH (M'bur)
// ════════════════════════════════════════════════════
// Legendary NPC champion. Universal Card Mastery / Efficiency
// Engine. Tempered Edge (passive) turns Strikes/Braces into
// cantrips; Hammer Out floods Ethereal Strikes; Whetstone buffs
// the hand (consumed on play).

CREATURES.blacksmith = {
  id:       'blacksmith',
  name:     "M'BUR",
  icon:     '⚒️',
  lore:     'The Forge blacksmith. A grumbly fox with an eyepatch and no patience for small talk. Hard, cold, exacting. She does not waste words, and she does not waste steel. Respect the craft, or do not bother her.',
  bossOnly: false,

  baseStats: { str:24, agi:16, wis:10 },
  growth:    { str:3,  agi:2,  wis:1  },

  innate: {
    id:       'tempered_edge',
    name:     'Tempered Edge',
    desc:     'Universal cards in hand gain [Sorcery] [10]: Draw 1.',
    active:   false,
    triggers: [
      {on:'on_draw', effect:{type:'temper_universals'}}
    ],
  },

  deckOrder: ['blacksmith_hammer_out', 'blacksmith_reforge', 'blacksmith_whetstone'],
};
CREATURES.blacksmith._innateTriggers = [
  {on:'on_draw', effect:{type:'temper_universals'}}
];
