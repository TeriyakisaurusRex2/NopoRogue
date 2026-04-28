// ════════════════════════════════════════════════════
// CREATURE: CORRUPTED BLOOM
// ════════════════════════════════════════════════════

CREATURES.bloom = {
  id:       'bloom',
  name:     'CORRUPTED BLOOM',
  icon:     '🌺',
  lore:     'It was a flower once. The corruption entered through the roots and climbed. Now it blooms in colours that do not occur in nature and releases spores that make living things forget they were ever healthy. The petals open wider when something approaches.',
  role:     'Hand Size Scaling / Reactive Debuffer',
  bossOnly: false,

  baseStats: { str:16, agi:6, wis:12 },
  growth:    { str:2,  agi:0, wis:1 },

  innate: {
    id:       'corruption_spread',
    name:     'Corruption Spread',
    desc:     'Passive: when the opponent plays an attack card, spend 20 mana to create an Ethereal Corrupt Spore (Weaken 4s) in own hand.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_opponent_attack', condition: 'has_mana_20', effect: {type: 'create_card_in_hand', cardId: 'corrupt_spore', target: 'self', ghost: true, mana_cost: 20} }
    ],
  },

  deckOrder: ['bloom_vine_lash', 'bloom_rot_guard', 'bloom_wilt'],
};
CREATURES.bloom._innateTriggers = [
  { on: 'on_opponent_attack', condition: 'has_mana_20', effect: {type: 'create_card_in_hand', cardId: 'corrupt_spore', target: 'self', ghost: true, mana_cost: 20} }
];

