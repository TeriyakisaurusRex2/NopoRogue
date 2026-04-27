// ════════════════════════════════════════════════════
// CREATURE: DRAIN LURKER
// ════════════════════════════════════════════════════

CREATURES.drain_lurker = {
  id:       'drain_lurker',
  name:     'DRAIN LURKER',
  icon:     '🐊',
  lore:     'It wedges itself into the narrowest tunnels and waits for something to walk past. The shell is thick enough that most blades bounce off. The jaws are patient enough that most prey gives up running before the Lurker gives up chasing.',
  role:     'Tank / Shield Burst',
  bossOnly: false,

  baseStats: { str:16, agi:8, wis:8 },
  growth:    { str:2,  agi:1, wis:0 },

  innate: {
    id:       'hunker',
    name:     'Hunker',
    desc:     'Gain 20% current HP as [Shield]. Draw 1 card.',
    active:   true,
    cost:     35,
    cooldown: 5000,
    effect: [
      {type: 'shield_pct_hp', pct: 20, dur: 6},
      {type: 'draw_cards', count: 1}
    ],
  },

  // Deck generated from STR + deckOrder (16 cards at base)
  // 16 ÷ 5 = 3 each + 1 remainder → Lash 4, Crush 3, Coil 3, Strike 3, Brace 3
  deckOrder: ['lurker_lash', 'lurker_crush', 'lurker_coil'],
};
// Backup: protect effect array from being stripped
CREATURES.drain_lurker._innateEffect = [{"type": "shield_pct_hp", "pct": 20, "dur": 6}, {"type": "draw_cards", "count": 1}];
