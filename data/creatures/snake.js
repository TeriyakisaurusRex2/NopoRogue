// ════════════════════════════════════════════════════
// CREATURE: SNAKE
// Drop snake.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.snake = {id:'snake',name:'SWAMP SERPENT',icon:'🐍',lore:'The swamp serpent doesn\'t hunt so much as wait. It has learned that patience is the deadliest venom of all.',baseStats:{str:9,agi:18,wis:4},growth:{str:1,agi:1.5,wis:0.5},baseDmg:2,dmgGrowth:0.4,gold:[2,5],
    innate:{id:'slither',name:'Slither',desc:'Every 3rd card played automatically applies Venom (2 dmg/2s for 6s) to the enemy.'},
    openingMove:'bite',
    deck:[
      {id:'bite',         copies:3,name:'Bite',          effect:'dmg',            value:2,                                                  msg:'bites swiftly!'},
      {id:'constrict',    copies:1,name:'Constrict',      effect:'dmg_and_debuff', value:1,status:'constricted',debuffVal:-0.25,debuffDur:3000,msg:'constricts you!'},
      {id:'venom_strike', copies:1,name:'Venom Strike',   effect:'dmg_and_dot',    value:3,dotDmg:2,dotTick:2000,dotDur:6000,status:'venom', msg:'injects venom!'},
    ]};
