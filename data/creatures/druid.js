// ════════════════════════════════════════════════════
// CREATURE: STARCALLER DRUID
// ════════════════════════════════════════════════════

CREATURES.druid = {
  id:       'druid',
  name:     'STARCALLER DRUID',
  icon:     '🌙',
  lore:     'The ritual shard is shattered. Whatever was sealed inside it is no longer contained. The druid does not yet understand what was released — only that the sky answers differently now, and the stars have begun to move.',
  bossOnly: false,

  baseStats: { str:12, agi:16, wis:20 },
  growth:    { str:1,  agi:2,  wis:3  },

  innate: {
    id:       'starfall',
    name:     'Starfall',
    desc:     '[Churn] entire hand. Deal 5 damage per card churned.',
    active:   true,
    cost:     50,
    cooldown: 8000,
    effect: [
      {type: 'churn_all_damage', dmgPerCard: 5}
    ],
  },

  deckOrder: ['druid_void_bolt', 'druid_star_shard', 'druid_nova_burst'],
};
CREATURES.druid._innateEffect = [{type: 'churn_all_damage', dmgPerCard: 5}];
