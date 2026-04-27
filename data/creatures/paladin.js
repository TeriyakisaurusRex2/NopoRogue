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
    desc:     'Passive: when taking damage while [Shield] is active, apply 2 [Burn] for 5s to the enemy.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_hit_while_shielded', target: 'opponent', effect: {type: 'burn', dpt: 2, dur: 5} }
    ],
  },

  // Deck is generated from STR. The 5 identity cards below are distributed
  // evenly (20% each) at STR 10. Extra slots from higher STR are filled in
  // deckOrder priority: unique cards first (in listed order), then universals.
  // deckOrder defines the priority tiebreaker for odd extra slots.
  deckOrder: ['paladin_smite', 'paladin_aegis', 'paladin_consecrate'],
};
// Backup: protect triggers array from being stripped
CREATURES.paladin._innateTriggers = [{"on": "on_hit_while_shielded", "target": "opponent", "effect": {"type": "burn", "dpt": 2, "dur": 5}}];
