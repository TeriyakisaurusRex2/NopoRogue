// ════════════════════════════════════════════════════
// CREATURE: SLIME
// ════════════════════════════════════════════════════

CREATURES.slime = {
  id:       'slime',
  name:     'SLIME',
  icon:     '🟢',
  lore:     'A quivering mound of translucent ooze that has no business being alive and yet insists on it. It absorbs what it touches — weapons, spells, the occasional overconfident adventurer. It learns by eating.',
  role:     'Tank / Mimic',
  bossOnly: false,

  baseStats: { str:14, agi:8, wis:6 },
  growth:    { str:2,  agi:1, wis:0 },

  innate: {
    id:       'absorb',
    name:     'Absorb',
    desc:     'Create an [Ethereal] copy of the last card played (by either side) into hand.',
    active:   true,
    cost:     15,
    cooldown: 3000,
    effect: [
      {type: 'copy_last_card'}
    ],
  },

  // Deck generated from STR + deckOrder (14 cards at base)
  // 14 ÷ 5 = 2 each + 4 remainder → Ooze 3, Harden 3, Spit 3, Strike 3, Brace 2
  deckOrder: ['slime_ooze', 'slime_harden', 'slime_spit'],
};
// Backup: protect effect array from being stripped
CREATURES.slime._innateEffect = [{"type": "copy_last_card"}];
