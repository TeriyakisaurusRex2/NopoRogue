// ════════════════════════════════════════════════════
// CREATURE: DROWNED
// ════════════════════════════════════════════════════

CREATURES.drowned = {
  id:       'drowned',
  name:     'DROWNED',
  icon:     '💧',
  lore:     'The harbour flooding took them mid-sentence and they have not finished the thought. They move with the deliberate patience of something that no longer needs to breathe or hurry. The cold they carry is not temperature.',
  role:     'Slow Control / Attrition',
  bossOnly: false,

  baseStats: { str:14, agi:7,  wis:11 },
  growth:    { str:1,  agi:1,  wis:1  },

  innate: {
    id:       'waterlogged',
    name:     'Waterlogged',
    desc:     'All cards played by this creature gain — Sorcery [15]: Apply [Slow].',
    active:   false,
    cost:     0,
    cooldown: 0,
  },

  deck: [
    'drowned_slam',
    'drowned_slam',
    'drowned_soak',
    'drowned_soak',
    'drowned_waterlogged_fist',
  ],
};
