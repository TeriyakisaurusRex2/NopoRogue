// ════════════════════════════════════════════════════
// CREATURE: AMALGAM
// Drop amalgam.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.amalgam = {id:'amalgam',name:'THE AMALGAM',icon:'🧫',lore:'Several things, once. Now one thing. The stitching is recent — days, not weeks. The pieces don\'t all agree on what to do next, which gives you a window.',baseStats:{str:32,agi:7,wis:8},growth:{str:3.5,agi:0.7,wis:0.8},baseDmg:6,dmgGrowth:1.2,gold:[6,14],
    innate:{id:'adaptive',name:'Adaptive',desc:'Taking 5+ damage in a single hit grants a stack of Adaptive (+8% damage resistance, max 3 stacks). Punishment makes you stronger.'},
    openingMove:'absorb',
    deck:[
      {id:'crush',  copies:2,name:'Crush',  effect:'dmg',        value:7,                                                                     msg:'crushes you with its mass!'},
      {id:'absorb', copies:2,name:'Absorb', effect:'self_buff',   status:'amalgam_shield',value:4,dur:5000,                                   msg:'absorbs the blow!'},
      {id:'lash',   copies:1,name:'Lash',   effect:'dmg_and_debuff',value:4,status:'lashed',debuffVal:-0.2,debuffDur:4000,                    msg:'lashes out with tendrils!'},
    ]};