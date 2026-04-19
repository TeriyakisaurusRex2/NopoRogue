// ════════════════════════════════════════════════════
// CHAMPIONS  —  playable character definitions
// ════════════════════════════════════════════════════
// This file defines the player-facing champion data:
// role display, innate UI fields, and starting deck card IDs.
// Creature stats (baseStats, growth, innate mechanics) live in
// the individual creature files (paladin.js, druid.js, thief.js etc.)
// ════════════════════════════════════════════════════

var CREATURES_PLAYABLE = {

  druid:{
    playable:true, role:'MAGE',
    desc:'The shard is shattered. Something vast was released. Builds a full hand then detonates it with Starfall for cosmic burst damage.',
    statPips:{str:1,agi:2,wis:5},
    innateActive:true, innateName:'Starfall', innateCost:50,
    innateDesc:'[Churn] your entire hand. Deal 5 damage per card churned.',
    startDeck:[
      'strike','strike','strike',
      'brace','brace',
      'druid_void_bolt','druid_void_bolt','druid_void_bolt',
      'druid_nebula_ward','druid_nebula_ward',
      'druid_nova_burst','druid_nova_burst',
    ],
    sanctumAlts:['druid_focus','druid_stellar_shards','druid_drifting_comet'],
  },

  paladin:{
    playable:true, role:'TANK',
    desc:'Cursed by the evil he swore to destroy. Maintains Burn to accelerate mana, Weakens enemies to survive, and outlasts through attrition.',
    statPips:{str:5,agi:1,wis:3},
    innateActive:false, innateName:'Cursed Conviction', innateCost:0,
    innateDesc:'PASSIVE: while Burn is active on the enemy, mana regenerates 50% faster.',
    startDeck:[
      'strike','strike','strike',
      'brace','brace',
      'paladin_smite','paladin_smite','paladin_smite',
      'paladin_aegis','paladin_aegis',
      'paladin_consecrate','paladin_consecrate',
    ],
    sanctumAlts:['paladin_judgment','paladin_hellfire','paladin_bulwark'],
  },

  thief:{
    playable:true, role:'ASSASSIN',
    desc:'No face, no name. Stolen memories and borrowed souls. Fast hands, lethal poison combos.',
    statPips:{str:1,agi:5,wis:3},
    innateActive:true, innateName:'Shadow Mark', innateCost:35,
    innateDesc:'Apply 12 Poison to the enemy. Your next card played is a guaranteed Crit (1.5× damage).',
    startDeck:[
      'strike','strike','strike',
      'brace','brace',
      'thief_quick_slash','thief_quick_slash','thief_quick_slash',
      'thief_poison_dart','thief_poison_dart',
      'thief_smoke_bomb',
      'thief_shadow_step',
    ],
    sanctumAlts:['thief_backstab','thief_death_mark','thief_flicker'],
  },

  moonsquirrel:{
    playable:true, role:'BERSERKER',
    desc:'A moonlit blur of claws and fury. What it lacks in strength it makes up for in sheer relentless speed.',
    statPips:{str:2,agi:5,wis:2},
    innateActive:false, innateName:'Rapid Assault', innateCost:0,
    innateDesc:'PASSIVE: Draw interval permanently -15%. The Sciurid strikes faster than the eye can follow.',
    startDeck:[
      'strike','brace',
      'ms_scratch','ms_scratch',
      'ms_frenzy',
      'ms_scurry',
    ],
    sanctumAlts:['ms_moonburst'],
  },

};
