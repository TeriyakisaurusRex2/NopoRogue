// ════════════════════════════════════════════════════
// CREATURE: BANDIT
// Drop bandit.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.bandit = {id:'bandit',name:'BANDIT CAPTAIN',icon:'🗡️',lore:'Once a soldier, maybe. Or a merchant who ran out of goods to sell. Whatever they were before, the captain title was earned by outlasting everyone else who wanted it.',baseStats:{str:18,agi:15,wis:7},growth:{str:2,agi:1.5,wis:0.8},baseDmg:4,dmgGrowth:0.8,gold:[5,10],
    innate:{id:'ambush',name:'Ambush',desc:'Your first card each battle always deals double damage. Make the opening count.'},
    openingMove:'quick_stab',
    deck:[
      {id:'quick_stab',  copies:2,name:'Quick Stab', effect:'dmg',          value:3,                                                         msg:'stabs quickly!'},
      {id:'disarm',      copies:1,name:'Disarm',      effect:'force_autoplay',                                                               msg:'disarms you!'},
      {id:'dirty_trick', copies:2,name:'Dirty Trick', effect:'dmg_and_dot',  value:2,dotDmg:2,dotTick:2000,dotDur:4000,status:'bleeding',    msg:'tricks you!'},
    ]};
