// ════════════════════════════════════════════════════
// CREATURE: HARBOURMASTER
// Drop harbourmaster.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.harbourmaster = {id:'harbourmaster',name:'THE HARBOURMASTER',icon:'⚓',lore:'Drowned with the harbour. Still at his post, still collecting the toll. He doesn\'t know the ships stopped coming. Or perhaps he does, and this is why he\'s so angry.',baseStats:{str:28,agi:3,wis:8},growth:{str:3,agi:0.2,wis:0.8},baseDmg:12,dmgGrowth:1.5,gold:[20,35],
    cardRewards:['bone_slash','ancient_roar'],
    innate:{id:'harbourmaster',name:'Tide Caller',desc:'Attacks 50% slower, but each hit deals triple damage. One blow at a time — each one worth three.'},
    openingMove:'anchor_swing',
    deck:[
      {id:'anchor_swing',  copies:2, name:'Anchor Swing',   effect:'dmg', value:14, msg:'swings a massive rusted anchor!'},
      {id:'tidal_crush',   copies:1, name:'Tidal Crush',    effect:'dmg', value:20, msg:'crushes with a tidal wave of force!'},
      {id:'barnacle_hurl', copies:2, name:'Barnacle Hurl',  effect:'dmg', value:6,  msg:'hurls clusters of barnacles!'},
    ]};