// ════════════════════════════════════════════════════
// CREATURE: GOLEM
// Drop golem.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.golem = {id:'golem',name:'STONE GOLEM',icon:'🪨',lore:'Built to guard something, long since forgotten what. Still guarding. It will guard until someone or something stops it, and it finds that quite difficult to imagine.',baseStats:{str:35,agi:3,wis:4},growth:{str:4,agi:0.3,wis:0.5},baseDmg:6,dmgGrowth:1.2,gold:[6,12],
    innate:{id:'stone_skin',name:'Stone Skin',desc:'The first 3 damage of every hit is absorbed. Heavy attacks chip through; light hits barely register.'},
    openingMove:'fortify',
    deck:[
      {id:'ground_pound',copies:2,name:'Ground Pound',effect:'dmg',value:6,                                                                  msg:'pounds the ground!'},
      {id:'rock_throw',  copies:2,name:'Rock Throw',   effect:'dmg',value:8,                                                                  msg:'hurls a boulder!'},
      {id:'fortify',     copies:1,name:'Fortify',       effect:'self_buff',status:'fortified',value:5,dur:5000,                               msg:'fortifies its body!'},
    ]};
