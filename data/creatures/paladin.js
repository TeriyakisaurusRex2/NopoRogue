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

  baseStats: { str:18, agi:10, wis:14 },
  growth:    { str:2,  agi:1,  wis:1  },

  innate: {
    id:       'cursed_conviction',
    name:     'Cursed Conviction',
    desc:     'Passive: while [Burn] is active on the enemy, this creature regenerates mana 50% faster.',
    active:   false,
    cost:     0,
    cooldown: 0,
  },

  deck: [
    'paladin_smite',
    'paladin_smite',
    'paladin_smite',
    'paladin_aegis',
    'paladin_aegis',
    'paladin_consecrate',
    'paladin_consecrate',
  ],
};
