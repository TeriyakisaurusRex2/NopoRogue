// ════════════════════════════════════════════════════
// CREATURE: SEWER ZOMBIE
// ════════════════════════════════════════════════════

CREATURES.zombie = {
  id:       'zombie',
  name:     'SEWER ZOMBIE',
  icon:     '🧟',
  lore:     'Whatever this was before, it has forgotten. The flesh is grey and waterlogged. The jaw hangs at an angle that suggests it was broken and then continued to be used regardless. It does not feel pain. It does not feel anything. It just keeps coming.',
  bossOnly: false,

  baseStats: { str:10, agi:10, wis:10 },
  growth:    { str:2,  agi:1, wis:2 },

  innate: {
    id:       'undying',
    name:     'Undying',
    desc:     'Passive: the first time this creature would be reduced to 0 HP, survive at 1 HP instead. Triggers once per combat.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_lethal', effect: {type: 'survive_at_1'} }
    ],
  },

  // Deck generated from STR + deckOrder (14 cards at base)
  // 14 ÷ 5 = 2 each + 4 remainder → Slam 3, Bite 3, Groan 3, Strike 3, Brace 2
  deckOrder: ['zombie_pummel', 'zombie_devour', 'zombie_mend'],
};
// Backup: protect triggers array from being stripped
CREATURES.zombie._innateTriggers = [{"on": "on_lethal", "effect": {"type": "survive_at_1"}}];
