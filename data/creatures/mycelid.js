// ════════════════════════════════════════════════════
// CREATURE: MYCELID
// ════════════════════════════════════════════════════

CREATURES.mycelid = {
  id:       'mycelid',
  name:     'MYCELID',
  icon:     '🍄',
  lore:     'The mycelium network extends for miles beneath the swamp floor. The Mycelid is not a creature so much as a node — an expression of the network given shape and purpose. When one falls, the network remembers. The next one arrives angrier.',
  bossOnly: false,

  baseStats: { str:12, agi:10, wis:12 },
  growth:    { str:1,  agi:1,  wis:1 },

  innate: {
    id:       'mycelium_network',
    name:     'Mycelium Network',
    desc:     'When enemy takes DoT damage, gain that amount as [Shield].',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_opponent_dot_tick', effect: {type: 'shield_from_dot'} }
    ],
  },

  // Deck generated from STR + deckOrder (14 cards at base)
  // 14 ÷ 5 = 2 each + 4 remainder → Fungal Slam 3, Spore Guard 3, Decompose 3, Strike 3, Brace 2
  deckOrder: ['mycelid_fungal_slam', 'mycelid_spore_guard', 'mycelid_decompose'],
};
// Backup: protect triggers array from being stripped
CREATURES.mycelid._innateTriggers = [{"on": "on_opponent_dot_tick", "effect": {"type": "shield_from_dot"}}];
