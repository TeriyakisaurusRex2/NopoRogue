// ════════════════════════════════════════════════════
// CREATURE: VAULT KEEPER (Shtole)
// ════════════════════════════════════════════════════
// Legendary NPC champion. Scaling Payoff / Ramp archetype.
// Treasure scales via Compound (Sorcery-gated per-fight count).
// Vault Hoard floods the hand with Ethereal Compounded copies.

CREATURES.vault_keeper = {
  id:       'vault_keeper',
  name:     'SHTOLE',
  icon:     '💎',
  lore:     'The keeper of the Vault. A stoat-monk who has counted every coin twice and is in no hurry to count them a third time. Patient, quiet, deliberate. He does not rush, and he does not lose.',
  bossOnly: false,

  baseStats: { str:24, agi:14, wis:12 },
  growth:    { str:3,  agi:1,  wis:2  },

  innate: {
    id:       'vault_hoard',
    name:     'Vault Hoard',
    desc:     'Discard your hand. For each card discarded this way, create an [Ethereal] {{vault_keeper_treasure}}.',
    active:   true,
    cost:     40,
    cooldown: 2000,
    effect: [
      {type:'vault_hoard'}
    ],
  },

  deckOrder: ['vault_keeper_treasure', 'vault_keeper_appraise', 'vault_keeper_lockbox'],
};
CREATURES.vault_keeper._innateEffect = [{type:'vault_hoard'}];
