// ════════════════════════════════════════════════════
// CREATURE: DRUID
// Drop druid.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.druid = {id:'druid',name:'STARCALLER DRUID',icon:'🌙',baseStats:{str:20,agi:20,wis:20},growth:{str:1,agi:1,wis:3},baseDmg:6,dmgGrowth:0.8,gold:[5,10],
    playable:true, cardRewards:['void_bolt','nebula_shield'],
    innate:{id:'starfall',name:'Starfall',desc:'Deal 3 dmg per card in hand, then discard half at random.'},
    openingMove:'druid_bolt',
    deck:[
      {id:'druid_bolt',   copies:3, name:'Void Bolt',  effect:'dmg', value:8, msg:'fires a void bolt!'},
      {id:'druid_comet',  copies:2, name:'Comet',      effect:'dmg', value:12,msg:'launches a drifting comet!'},
      {id:'druid_nova',   copies:2, name:'Nova Burst', effect:'dmg_multi', value:5,hits:3, msg:'erupts in nova energy!'},
    ]};
