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
    id:       'cursed_retribution',
    name:     'Cursed Retribution',
    desc:     'Passive: when taking damage while [Shield] is active (including fully absorbed hits), apply [Burn] (WIS dmg/3s) to the enemy.',
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
