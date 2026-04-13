// ════════════════════════════════════════════════════
// CHAMPIONS  —  playable character definitions
// ════════════════════════════════════════════════════

var CREATURES_PLAYABLE = {
  druid:{
    playable:true, role:'MAGE',
    desc:'Commands the void between stars. Holds a full hand to unleash cosmic devastation.',
    statPips:{str:2,agi:2,wis:5},
    innateActive:true, innateName:'Starfall', innateCost:250,
    innateDesc:'Deal 3 dmg per card in hand, then discard half at random.',
    // STR 20 → deck size 20. Core: void_bolt×6, nova_burst×4, nebula_shield×4, strike×4, brace×2
    startDeck:['strike','strike','strike','strike','brace','brace','brace','brace',
               'void_bolt','void_bolt','void_bolt','void_bolt',
               'nova_burst','nova_burst','nova_burst','nova_burst',
               'nebula_shield','nebula_shield','nebula_shield','nebula_shield'],
    sanctumAlts:['drifting_comet','focus','stellar_shards'], // unlocked-by-default in Sanctum
  },
  paladin:{
    playable:true, role:'TANK',
    desc:'Torn between holy light and demonic darkness. Mana absorbs hits — let it fill, let it burn.',
    statPips:{str:5,agi:2,wis:2},
    innateActive:false, innateName:'Holy Flame', innateCost:0,
    innateDesc:'PASSIVE: Whenever you apply a buff or debuff, the enemy gains [Burn] (WIS×1 dmg/3s). Stacks accumulate indefinitely — more debuffs means more burn.',
    // STR 20 → deck size 20. Core: retribution×6, consecrate×5, hellfire×5, strike×3, brace×1
    startDeck:['strike','strike','strike','strike','brace','brace','brace','brace',
               'retribution','retribution','retribution','retribution',
               'consecrate','consecrate','consecrate','consecrate',
               'hellfire','hellfire','hellfire','hellfire'],
    sanctumAlts:['holy_shield','judgment','bulwark'],
  },
  thief:{
    playable:true, role:'ASSASSIN',
    desc:'No face, no name. Stolen memories and borrowed souls. Fast hands, lethal combos.',
    statPips:{str:2,agi:5,wis:2},
    innateActive:true, innateName:'Shadow Mark', innateCost:150,
    innateDesc:'Draw a Shadow Mark ghost card into your hand. When played: applies 16 Poison to the enemy and makes your next card guaranteed to [Crit] (damage cards deal 1.5× if they have no crit of their own).',
    // STR 20 → deck size 20. Core: quick_slash×6, poison_dart×5, backstab×4, strike×3, brace×2
    startDeck:['strike','strike','strike','strike','brace','brace','brace','brace',
               'quick_slash','quick_slash','quick_slash','quick_slash',
               'poison_dart','poison_dart','poison_dart','poison_dart',
               'backstab','backstab','backstab','backstab'],
    sanctumAlts:['flicker','death_mark','shadow_step'],
  },
  moonsquirrel:{
    playable:true, role:'BERSERKER',
    desc:'A moonlit blur of claws and fury. What it lacks in strength it makes up for in sheer relentless speed.',
    statPips:{str:2,agi:5,wis:2},
    innateActive:false, innateName:'Rapid Assault', innateCost:0,
    innateDesc:'PASSIVE: Draw interval permanently -15%. The Sciurid strikes faster than the eye can follow.',
    // STR 6 → deck size 13. Core: ms_scratch×4, ms_frenzy×3, ms_moonburst×3, strike×2, brace×1
    startDeck:['strike','brace',
               'ms_scratch','ms_scratch',
               'ms_frenzy',
               'ms_scurry'],
    sanctumAlts:['ms_moonburst'],
  },
};
