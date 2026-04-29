// ════════════════════════════════════════════════════
// CREATURE: FACELESS THIEF
// ════════════════════════════════════════════════════

CREATURES.thief = {
  id:       'thief',
  name:     'FACELESS THIEF',
  icon:     '🎭',
  lore:     'No name. No history. The face they wear belongs to someone else. They are very good at their work, which is the only thing they know for certain about themselves. The clues to who they were are scattered across the city — in graves, in ledgers, in the faces of people who look at them and go pale.',
  role:     'Poison Setup / Crit Burst',
  bossOnly: false,

  baseStats: { str:16, agi:20, wis:12 },
  growth:    { str:2,  agi:3,  wis:1  },

  innate: {
    id:       'shadow_mark',
    name:     'Shadow Mark',
    desc:     'Apply 3 [Poison]. All attack cards: +[Crit]: 100% (next play).',
    active:   true,
    cost:     50,
    cooldown: 2000,
    effect: [
      {type: 'apply_status', status: 'poison', target: 'opponent', value: 3, dur: 8},
      {type: 'modify_cards', source: 'shadow_mark', filter: {type:'attack'}, where: 'all', scope: 'next_play',
       changes: [{field:'crit', delta:100}]}
    ],
  },

  deckOrder: ['thief_quick_slash', 'thief_poison_dart', 'thief_shadow_step'],
};
CREATURES.thief._innateEffect = [
  {type: 'apply_status', status: 'poison', target: 'opponent', value: 3, dur: 8},
  {type: 'modify_cards', source: 'shadow_mark', filter: {type:'attack'}, where: 'all', scope: 'next_play',
   changes: [{field:'crit', delta:100}]}
];
