// ════════════════════════════════════════════════════
// CREATURE: DRAIN LURKER
// ════════════════════════════════════════════════════

CREATURES.drain_lurker = {
  id:       'drain_lurker',
  name:     'DRAIN LURKER',
  icon:     '🐊',
  lore:     'It wedges itself into the narrowest tunnels and waits for something to walk past. The shell is thick enough that most blades bounce off. The jaws are patient enough that most prey gives up running before the Lurker gives up chasing.',
  bossOnly: false,

  baseStats: { str:14, agi:10, wis:10 },
  growth:    { str:1,  agi:1, wis:1 },

  innate: {
    id:       'hunker',
    name:     'Hunker',
    desc:     'Gain 20% current HP as [Shield].',
    active:   true,
    cost:     40,
    cooldown: 5000,
    effect: [
      {type: 'shield_pct_hp', pct: 20, dur: 6}
    ],
  },

  deckOrder: ['lurker_lash', 'lurker_crush', 'lurker_coil'],
};
CREATURES.drain_lurker._innateEffect = [{type: 'shield_pct_hp', pct: 20, dur: 6}];
