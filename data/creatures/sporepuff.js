// ════════════════════════════════════════════════════
// CREATURE: SPORE PUFF
// ════════════════════════════════════════════════════

CREATURES.sporepuff = {
  id:       'sporepuff',
  name:     'SPORE PUFF',
  icon:     '🍄',
  lore:     'A soft, round fungal body that drifts through the swamp canopy on updrafts of warm rot. It looks harmless. The cloud it releases when agitated is not. Experienced travellers hold their breath and walk past quickly.',
  bossOnly: false,

  baseStats: { str:10, agi:14, wis:10 },
  growth:    { str:1,  agi:1,  wis:1 },

  innate: {
    id:       'toxic_cloud',
    name:     'Toxic Cloud',
    desc:     'When a card is discarded, apply 1 [Poison] to enemy.',
    active:   false,
    cost:     0,
    cooldown: 0,
    triggers: [
      { on: 'on_discard', target: 'opponent', effect: {type: 'apply_status', status: 'poison', target: 'opponent', value: 1, dur: 8} }
    ],
  },

  deckOrder: ['sporepuff_spore_shot', 'sporepuff_puff', 'sporepuff_burst'],
};
CREATURES.sporepuff._innateTriggers = [
  {on: 'on_discard', target: 'opponent', effect: {type: 'apply_status', status: 'poison', target: 'opponent', value: 1, dur: 8}}
];
