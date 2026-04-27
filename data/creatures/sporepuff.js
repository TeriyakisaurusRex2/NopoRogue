// ════════════════════════════════════════════════════
// CREATURE: SPORE PUFF
// ════════════════════════════════════════════════════

CREATURES.sporepuff = {
  id:       'sporepuff',
  name:     'SPORE PUFF',
  icon:     '🍄',
  lore:     'A soft, round fungal body that drifts through the swamp canopy on updrafts of warm rot. It looks harmless. The cloud it releases when agitated is not. Experienced travellers hold their breath and walk past quickly.',
  role:     'Debuffer / Discard Poison',
  bossOnly: false,

  baseStats: { str:10, agi:14, wis:10 },
  growth:    { str:0,  agi:2,  wis:1 },

  innate: {
    id:       'toxic_cloud',
    name:     'Toxic Cloud',
    desc:     'Passive: when this creature discards a card, apply 1 [Poison] to the opponent.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_discard', target: 'opponent', effect: {type: 'poison', dpt: 1, dur: 8} }
    ],
  },

  // Deck generated from STR + deckOrder (10 cards at base)
  // 10 ÷ 5 = 2 each
  deckOrder: ['sporepuff_spore_shot', 'sporepuff_puff', 'sporepuff_burst'],
};
// Backup: protect triggers array from being stripped
CREATURES.sporepuff._innateTriggers = [{"on": "on_discard", "target": "opponent", "effect": {"type": "poison", "dpt": 1, "dur": 8}}];
