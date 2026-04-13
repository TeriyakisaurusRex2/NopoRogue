// ════════════════════════════════════════════════════
// CREATURE: RAT
// Drop rat.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.rat = {id:'rat',name:'GIANT RAT',icon:'🐀',lore:'A bloated, mean-tempered rodent that thrives in the filth beneath every civilised place. The longer it fights, the faster it gets — veterans know to end it quick.',baseStats:{str:12,agi:14,wis:5},growth:{str:1,agi:2,wis:0.5},baseDmg:4,dmgGrowth:0.5,gold:[1,3],
    cardRewards:['claw_rake','leg_it_card'],
    innate:{id:'frenzied',name:'Frenzied',desc:'Every 4s in combat, your attack speed increases by 8%. Stacks indefinitely — the longer the fight, the faster you become.'},
    openingMove:'gnaw',
    deck:[
      {id:'gnaw',   copies:3, name:'Gnaw',  effect:'dmg', value:2, msg:'gnaws at you!'},
      {id:'dart',   copies:2, name:'Dart',  effect:'self_buff', status:'haste_rat', value:0.2, dur:3000, msg:'darts forward!'},
    ]};
