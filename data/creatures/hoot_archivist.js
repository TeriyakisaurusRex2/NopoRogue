// ════════════════════════════════════════════════════
// CREATURE: BESTIARY ARCHIVIST (Hoot)
// ════════════════════════════════════════════════════
// Legendary NPC champion. Distributed Compound Scaling.
// Three Compound cards (multi-hit / Haste / Shield) that build their
// own counts via Sorcery. Research Grant is a pure draw engine —
// more draws -> more plays -> more Compound reps on the cards.

CREATURES.hoot_archivist = {
  id:       'hoot_archivist',
  name:     'HOOT',
  icon:     '🦉',
  lore:     'The archivist of the Bestiary. A scholarly owl, meticulous and methodical, who has catalogued every creature twice and footnoted them thrice. Patient to a fault. Everything improves with study.',
  bossOnly: false,

  baseStats: { str:16, agi:12, wis:22 },
  growth:    { str:2,  agi:1,  wis:3  },

  innate: {
    id:       'research_grant',
    name:     'Research Grant',
    desc:     'Draw 2 cards.',
    active:   true,
    cost:     40,
    cooldown: 2000,
    effect: [
      {type:'draw_cards', count:2}
    ],
  },

  deckOrder: ['hoot_archivist_cross_examine', 'hoot_archivist_speed_read', 'hoot_archivist_hardbound'],
};
CREATURES.hoot_archivist._innateEffect = [
  {type:'draw_cards', count:2}
];
