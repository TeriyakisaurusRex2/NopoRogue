// ════════════════════════════════════════════════════
// CREATURE: PLAGUE
// Drop plague.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.plague = {id:'plague',name:'PLAGUE CARRIER',icon:'🦟',lore:'Disease given form. The plague-bearer doesn\'t fight so much as share. It has things inside it that want out. You are a viable host. It is very generous in this way.',baseStats:{str:11,agi:12,wis:8},growth:{str:1.2,agi:1.2,wis:1},baseDmg:2,dmgGrowth:0.4,gold:[2,5],
    innate:{id:'infectious',name:'Infectious',desc:'All damage-over-time effects you apply last 40% longer. Every DoT is a slow, grinding victory.'},
    openingMove:'infect',
    deck:[
      {id:'infect',      copies:2,name:'Infect',      effect:'dot',         dotDmg:1,dotTick:2000,dotDur:8000,status:'infection',             msg:'infects you!'},
      {id:'plague_bite', copies:2,name:'Bite',         effect:'dmg',         value:2,                                                         msg:'bites you!'},
      {id:'spore_cloud', copies:1,name:'Spore Cloud',  effect:'dot',         dotDmg:2,dotTick:3000,dotDur:9000,status:'spore_dot',            msg:'releases a spore cloud!'},
    ]};