// ════════════════════════════════════════════════════
// CREATURE: GRUB
// ════════════════════════════════════════════════════
// Deeproot parasite. Eats the tree at its own steady pace.
// AGI-primary common creature. Relentless innate (passive
// aura) locks draw speed — no haste, no slow, no stun, no
// frenzy bonus can change his draw rate. His cards stun
// both creatures; the self-stun is a drawback only any
// non-Grub user would feel.

CREATURES.grub = {
  id:       'grub',
  name:     'GRUB',
  icon:     '🐛',
  lore:     'The grubs feed on the great tree from within. They are not in a hurry — they have been here for centuries, and they will be here for centuries more. What they lack in speed they make up for in absolute, unshakeable focus. You can stun a grub. The grub will not notice. You can slow a grub. The grub does not know what slow means. It is simply chewing, and it will not stop chewing for you.',
  bossOnly: false,

  baseStats: { str:10, agi:16, wis:14 },
  growth:    { str:1,  agi:2,  wis:1 },

  innate: {
    id:       'relentless',
    name:     'Relentless',
    desc:     'Draw speed cannot be changed by any effect.',
    active:   false,
    cost:     0,
    cooldown: 0,
    // Modifier aura — always on. lockedDrawSpeed is checked by the
    // player-draw / enemy-draw paths in game.js, which skip the
    // whole modifier stack (haste / slow / atkspeed / frenzy /
    // drawSpeedBonus / drawDelay) when truthy. Status applications
    // still land; only their draw-speed effect is suppressed. Side
    // effects (e.g. Frenzy's mana drain) fire normally.
    auras: [
      { id:'relentless', condition:'always', effect:{lockedDrawSpeed:1}, manabound:false }
    ],
  },

  deckOrder: ['grub_gnaw', 'grub_burrow', 'grub_curl'],
};
