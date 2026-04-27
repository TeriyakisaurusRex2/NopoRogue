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

  baseStats: { str:18, agi:10, wis:10 },
  growth:    { str:2,  agi:1,  wis:1 },

  innate: {
    id:       'spite_spines',
    name:     'Spite Spines',
    desc:     'Convert the oldest card in hand into [Spite] (Ethereal). Deal missing HP ÷ 4 damage.',
    active:   true,
    cost:     30,
    cooldown: 2000,
    effect: [
      {type: 'convert_oldest_to', cardId: 'squanchback_spite'}
    ],
  },

  // Deck generated from STR + deckOrder (18 cards at base)
  // 18 ÷ 5 = 3 each + 3 remainder → Bristle 4, Shell Slam 4, Spine Lash 4, Strike 3, Brace 3
  deckOrder: ['squanchback_bristle', 'squanchback_shell_slam', 'squanchback_spine_lash'],
};
// Backup: protect effect array from being stripped
CREATURES.squanchback._innateEffect = [{"type": "convert_oldest_to", "cardId": "squanchback_spite"}];
