// ════════════════════════════════════════════════════
// CREATURE: INFERNAL BEAST  —  Ransacked Temple
// ════════════════════════════════════════════════════
// WIS/AGI / Mana Burn / Hellbent
// Passive: Hellfire — while hand is empty, gain 100% Haste (manabound).
// Core loop: play cards fast → hand empties → Hellfire haste →
//   draw fast → Sorceries burn opponent mana → Hellbent triggers
//   on last card for bonus effects.
// Counterplay: keep pressure up, burst before mana burn drains you.
// Low HP — fragile glass cannon.

CREATURES.infernal_beast = {
  id:       'infernal_beast',
  name:     'INFERNAL BEAST',
  icon:     '🔥',
  lore:     'Once a guardian spirit bound to the temple flame. When the sanctum fell, the binding broke. Now it burns without purpose, without restraint, without mercy. It does not guard. It consumes.',
  role:     'WIS/AGI / Mana Burn / Hellbent',
  bossOnly: false,

  baseStats: { str:8, agi:14, wis:16 },
  growth:    { str:0, agi:2,  wis:2 },

  innate: {
    id:       'hellfire',
    name:     'Hellfire',
    desc:     'While hand is empty, gain 100% [Haste]. [Manabound].',
    active:   false,
    cost:     0,
    cooldown: 0,
    auras: [
      {id: 'hellfire', condition: 'hand_empty', effect: {status: 'haste', value: 1.0, label: 'Hellfire'}, manabound: true}
    ],
  },

  deckOrder: ['infernal_strike', 'infernal_demon_bolt', 'infernal_dark_pact'],
};




