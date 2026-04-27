// ════════════════════════════════════════════════════
// CREATURE: WOLF
// ════════════════════════════════════════════════════

CREATURES.wolf = {
  id:       'wolf',
  name:     'WOLF',
  icon:     '🐺',
  lore:     'Lean, scarred, and patient. The wolves that hunt the Pale Road are not wild — they are precise. They wait for the moment you slow down. Then they are already moving.',
  role:     'Haste / Crit Burst',
  bossOnly: false,

  baseStats: { str:10, agi:16, wis:8 },
  growth:    { str:1,  agi:2,  wis:0 },

  innate: {
    id:       'keen_senses',
    name:     'Keen Senses',
    desc:     'Passive: while [Haste] is active, all attack cards gain +[Crit]: 25%.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_attack', condition: 'has_haste', effect: {type: 'crit_roll', pct: 25} }
    ],
  },

  // Deck generated from STR + deckOrder (10 cards at base)
  // 10 ÷ 5 = 2 each
  deckOrder: ['wolf_bite', 'wolf_lunge', 'wolf_howl'],
};
// Backup: protect triggers array from being stripped
CREATURES.wolf._innateTriggers = [{"on": "on_attack", "condition": "has_haste", "effect": {"type": "crit_roll", "pct": 25}}];
