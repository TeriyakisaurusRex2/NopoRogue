// ════════════════════════════════════════════════════
// CREATURE: WRETCH
// Drop wretch.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.wretch = {id:'wretch',name:'SEWER WRETCH',icon:'🧟',lore:'Something that used to be human, or close to it. The sewers change things that stay too long. It doesn\'t know what it used to be and it doesn\'t want to.',baseStats:{str:16,agi:8,wis:6},growth:{str:1.8,agi:0.8,wis:0.7},baseDmg:3,dmgGrowth:0.6,gold:[2,5],
    innate:{id:'filth_armour',name:'Filth Armour',desc:'The first 1 damage of every hit is absorbed. Beneath the filth, something endures.'},
    openingMove:'retch',
    deck:[
      {id:'wretch_claw',copies:2,name:'Claw Swipe',effect:'dmg',          value:3,                                                            msg:'claws wildly!'},
      {id:'retch',      copies:1,name:'Retch',      effect:'dmg_and_debuff',value:2,status:'nausea',debuffVal:-0.2,debuffDur:5000,            msg:'retches on you! (-20% dmg)'},
      {id:'foul_bite',  copies:1,name:'Foul Bite',  effect:'dmg_and_dot',  value:2,dotDmg:1,dotTick:2000,dotDur:6000,status:'foul_dot',      msg:'bites with foul teeth!'},
      {id:'mend',       copies:1,name:'Mend',        effect:'self_heal',    value:3,                                                          msg:'licks its wounds! (+3 HP)'},
    ]};
