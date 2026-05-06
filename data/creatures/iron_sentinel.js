// ════════════════════════════════════════════════════
// CREATURE: IRON SENTINEL  —  Ransacked Temple
// ════════════════════════════════════════════════════
// Tank / Damage Capped. Slow, immovable, must be chipped down.
// Passive: Ironclad — no single hit can exceed 20% max HP.
// Synergy: survives at low HP → Wrath payoff. DoTs bypass → Purge answers.
// Counterplay: DoTs, multi-hit, sustained pressure.

CREATURES.iron_sentinel = {
  id:       'iron_sentinel',
  name:     'IRON SENTINEL',
  icon:     '🗿',
  lore:     'A guardian construct still standing watch over ruins it failed to protect. It does not know the temple fell. It does not need to know. It only needs to stand.',
  bossOnly: false,

  baseStats: { str:17, agi:10, wis:10 },
  growth:    { str:2,  agi:1,  wis:1 },

  innate: {
    id:       'ironclad',
    name:     'Ironclad',
    desc:     'No single hit can deal more than 20% of max HP. DoTs bypass this.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_pre_damage', effect: { type: 'dmg_cap_pct', pct: 20 } }
    ],
  },

  deckOrder: ['sentinel_iron_wall', 'sentinel_wrath', 'sentinel_purge'],
};

CREATURES.iron_sentinel._innateTriggers = [
  { on: 'on_pre_damage', effect: { type: 'dmg_cap_pct', pct: 20 } }
];




