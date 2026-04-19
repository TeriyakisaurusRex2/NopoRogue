// ════════════════════════════════════════════════════
// CREATURE: SQUANCHBACK
// ════════════════════════════════════════════════════

CREATURES.squanchback = {
  id:       'squanchback',
  name:     'SQUANCHBACK',
  icon:     '🦔',
  lore:     'Something that was a mammal once and has since revised that decision. The spines grew inward first, then out. It does not appear to be in pain. That is the unsettling part.',
  role:     'Tank / Thorns Punisher',
  bossOnly: false,

  baseStats: { str:18, agi:7, wis:10 },
  growth:    { str:2,  agi:1, wis:1  },

  innate: {
    id:       'spite_spines',
    name:     'Spite Spines',
    desc:     '[Convert] the oldest card in hand into [Spite] (Ethereal). It is played immediately as the next card.\n[Spite]: Deal damage equal to missing HP ÷ 4. Apply [Thorns] (8) for 6s.',
    active:   true,
    cost:     30,
    cooldown: 2000,
  },

  deck: [
    'squanchback_lunge',
    'squanchback_lunge',
    'squanchback_harden',
    'squanchback_harden',
    'squanchback_gnash',
  ],
};
