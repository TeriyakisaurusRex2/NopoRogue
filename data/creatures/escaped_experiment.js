// ════════════════════════════════════════════════════
// CREATURE: ESCAPED EXPERIMENT
// ════════════════════════════════════════════════════

CREATURES.escaped_experiment = {
  id:       'escaped_experiment',
  name:     'ESCAPED EXPERIMENT',
  icon:     '🧪',
  lore:     'The alchemist who made this is either dead or very careful not to be found. Whatever compounds were introduced have not finished reacting. The creature is aware of this and has developed opinions about it.',
  role:     'Volatile Buildup / Self-Management',
  bossOnly: false,

  baseStats: { str:11, agi:14, wis:12 },
  growth:    { str:1,  agi:1,  wis:1  },

  innate: {
    id:       'volatile_injection',
    name:     'Volatile Injection',
    desc:     'Apply 2 [Volatile] stacks.',
    active:   true,
    cost:     20,
    cooldown: 2000,
  },

  deck: [
    'experiment_caustic_throw',
    'experiment_caustic_throw',
    'experiment_unstable_mixture',
    'experiment_unstable_mixture',
    'experiment_mend',
  ],
};
