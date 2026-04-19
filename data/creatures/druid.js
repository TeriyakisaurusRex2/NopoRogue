// ════════════════════════════════════════════════════
// CREATURE: STARCALLER DRUID
// ════════════════════════════════════════════════════

CREATURES.druid = {
  id:       'druid',
  name:     'STARCALLER DRUID',
  icon:     '🌙',
  lore:     'The ritual shard is shattered. Whatever was sealed inside it is no longer contained. The druid does not yet understand what was released — only that the sky answers differently now, and the stars have begun to move.',
  role:     'Mana Engine / Hand Burst',
  bossOnly: false,

  baseStats: { str:10, agi:12, wis:22 },
  growth:    { str:1,  agi:1,  wis:3  },

  innate: {
    id:       'starfall',
    name:     'Starfall',
    desc:     '[Churn] your entire hand. Deal 5 damage per card churned.',
    active:   true,
    cost:     50,
    cooldown: 8000,
  },

  deck: [
    'druid_void_bolt',
    'druid_void_bolt',
    'druid_void_bolt',
    'druid_nebula_ward',
    'druid_nebula_ward',
    'druid_nova_burst',
    'druid_nova_burst',
  ],
};
