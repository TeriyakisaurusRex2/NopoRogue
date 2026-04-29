// ════════════════════════════════════════════════════
// CREATURE: CURSED PALADIN
// ════════════════════════════════════════════════════

CREATURES.paladin = {
  id:       'paladin',
  name:     'CURSED PALADIN',
  icon:     '🛡️',
  lore:     'A defender of the Sanctum of Light, now marked by the same evil he swore to destroy. The curse does not weaken him. It redirects him. Every act of holy power feeds the darkness coiled around his heart — and he has learned, grimly, to use that.',
  role:     'Attrition Tank / Burn + Weaken',
  bossOnly: false,

  baseStats: { str:20, agi:12, wis:16 },
  growth:    { str:3,  agi:1,  wis:2  },

  innate: {
    id:       'cursed_retribution',
    name:     'Cursed Retribution',
    desc:     'While [Shield] is active, taking damage applies [Burn] 5s.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_hit_while_shielded', target: 'opponent', effect: {type: 'apply_status', status: 'burn', target: 'opponent', value: 2, dur: 5} }
    ],
  },

  deckOrder: ['paladin_smite', 'paladin_aegis', 'paladin_consecrate'],
};
CREATURES.paladin._innateTriggers = [
  {on: 'on_hit_while_shielded', target: 'opponent', effect: {type: 'apply_status', status: 'burn', target: 'opponent', value: 2, dur: 5}}
];
