// ════════════════════════════════════════════════════
// CREATURE: KAINE — the Sanctum Keeper
// ════════════════════════════════════════════════════
// id 'sanctum_keeper' so the sprite resolves to the town
// NPC art (assets/creatures/sanctum_keeper.png). Kaine IS
// the Sanctum's keeper, made playable — display name KAINE.
//
// Legendary champion. A slow STR/WIS bruiser built on
// [Churn] + [Drawn]-Bleed. Rend and Bulwark apply [Bleed]
// when drawn; Grind churns the hand to re-fire them. The
// Hemorrhage innate (passive aura) scales every Bleed
// Kaine applies off his STR.

CREATURES.sanctum_keeper = {
  id:       'sanctum_keeper',
  name:     'KAINE',
  icon:     '🪓',
  lore:     'He does not chase, and he does not hurry. Kaine simply arrives, and keeps arriving, long after a faster fighter would have tired. The wounds he opens do not close. He learned long ago that patience, with enough weight behind it, is its own kind of edge.',
  bossOnly: false,

  baseStats: { str:24, agi:10, wis:16 },
  growth:    { str:3,  agi:1,  wis:2  },

  innate: {
    id:       'hemorrhage',
    name:     'Hemorrhage',
    desc:     '[Bleed] you apply deals +STR÷6 extra damage.',
    active:   false,
    cost:     0,
    cooldown: 0,
    // Modifier aura — always on. bleedStrDiv is read by apply_status
    // when Bleed is applied: the value gains floor(STR / div).
    auras: [
      { id:'hemorrhage', condition:'always', effect:{bleedStrDiv:6}, manabound:false }
    ],
  },

  deckOrder: ['sanctum_keeper_rend', 'sanctum_keeper_grind', 'sanctum_keeper_bulwark'],
};
