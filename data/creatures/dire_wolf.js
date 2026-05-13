// ════════════════════════════════════════════════════
// CREATURE: DIRE WOLF
// ════════════════════════════════════════════════════
// Round 67c: tutorial champion. The mysterious figure puts the
// player in the dire wolf's body for the wolf-vs-goblin lesson —
// then the wolf is gone, and the player picks a champion of their
// own. The dire wolf doesn't appear in the player's roster after
// the prelude (not in default unlockedChamps).
//
// Stats are tuned to "high level" — score ~105 (Topaz rarity tier).
// Regular cards / deckOrder are placeholder for now (reusing the
// wolf family's cards). Tutorial overrides drawPool directly, so
// the deck contents here only matter for non-tutorial play.

CREATURES.dire_wolf = {
  id:       'dire_wolf',
  name:     'DIRE WOLF',
  icon:     '🐺',
  lore:     'Older than the pack. The dire wolves walk the same roads as the others, but they do not run with them — and the others do not contest the ground they claim.',
  bossOnly: false,

  baseStats: { str:18, agi:26, wis:16 },
  growth:    { str:3,  agi:4,  wis:2  },

  innate: {
    id:       'dire_double_crit',
    name:     'Hunter\'s Edge',
    desc:     'Double Crit rate on cards in hand.',
    active:   false,
    cost:     0,
    cooldown: 0,
    // Aura: always-on multiplier on attack-card crit chance. The
    // engine's existing aura processor reads attackCritBonus (additive);
    // attackCritMult support is a TODO — when implemented, this aura
    // doubles whatever crit% the card carries (from base + Sorcery
    // mods + Haste innates + etc).
    auras: [
      { id:'dire_double_crit', condition:'always', effect:{attackCritMult:2.0}, manabound:false }
    ],
  },

  // Placeholder deck — reuses the wolf family's cards. Will be
  // replaced with dire-wolf-specific cards in a future round.
  deckOrder: ['wolf_bite', 'wolf_lunge', 'wolf_howl'],
};
