// ════════════════════════════════════════════════════
// CREATURE: MOONSQUIRREL
// Drop moonsquirrel.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.moonsquirrel = {id:'moonsquirrel',name:'LUNA SCIURID',icon:'🐿️',lore:'Perfectly ordinary squirrel, except for the eyes. The eyes are wrong. Something looked through them once and didn\'t look away. The squirrel doesn\'t mind.',baseStats:{str:6,agi:22,wis:6},growth:{str:0.7,agi:2.0,wis:0.5},baseDmg:4,dmgGrowth:0.4,gold:[3,7],
    playable:true,
    innate:{id:'rapid_assault',name:'Rapid Assault',desc:'Draw interval is permanently reduced by 15%. Small and fast — the hits add up before the enemy realises.'},
    openingMove:'moon_burst',
    deck:[
      {id:'moon_nibble',  copies:3,name:'Nibble',   effect:'dmg',       value:5,      msg:'nibbles rapidly!'},
      {id:'moon_scratch', copies:3,name:'Scratch',  effect:'dmg',       value:7,      msg:'scratches with tiny claws!'},
      {id:'moon_burst',   copies:1,name:'Moonburst',effect:'dmg_multi', value:4,hits:4,msg:'erupts in a flurry of tiny strikes!'},
      {id:'moon_scurry',  copies:1,name:'Scurry',   effect:'haste',     value:0.4,dur:3000, msg:'scurries at blinding speed!'},
    ]};
