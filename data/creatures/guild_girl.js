// ════════════════════════════════════════════════════
// CREATURE: GUILD GIRL (Leona)
// ════════════════════════════════════════════════════
// Legendary NPC champion. Bomb Layer / Tempo Denial.
// Plants Ethereal "Rigged Contract" bombs into the opponent's
// deck; they detonate (12 to their holder) on play or discard.
// Contract Killer churns both decks; Retainer Fee feeds mana on
// draw and Hastes both creatures on play.

CREATURES.guild_girl = {
  id:       'guild_girl',
  name:     'LEONA',
  icon:     '📋',
  lore:     'The Adventurer\'s Hall guild clerk. Energetic, excitable, endlessly professional — and, though she would never admit it, genuinely invested in how every contract turns out. The fine print is always, always rigged.',
  bossOnly: false,

  baseStats: { str:12, agi:22, wis:16 },
  growth:    { str:1,  agi:3,  wis:2  },

  innate: {
    id:       'contract_killer',
    name:     'Contract Killer',
    desc:     'Both creatures [Churn] 4.',
    active:   true,
    cost:     30,
    cooldown: 3000,
    effect: [
      {type:'churn_both', count:4}
    ],
  },

  deckOrder: ['guild_girl_bounty_order', 'guild_girl_fine_print', 'guild_girl_retainer_fee'],
};
CREATURES.guild_girl._innateEffect = [{type:'churn_both', count:4}];
