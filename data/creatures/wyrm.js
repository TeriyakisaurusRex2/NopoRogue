// ════════════════════════════════════════════════════
// CREATURE: WYRM
// Drop wyrm.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.wyrm = {id:'wyrm',name:'FIRE WYRM',icon:'🐉',lore:'Young dragons before the pride sets in. All the fire and fury, none of the patience. That\'s what makes them more dangerous than their elders — they\'ll actually rush you.',baseStats:{str:28,agi:14,wis:18},growth:{str:3,agi:1.5,wis:2},baseDmg:8,dmgGrowth:1.2,gold:[12,20],
    innate:{id:'flame_aura',name:'Flame Aura',desc:'Every 5s, automatically applies Burn (3 dmg/3s) to the enemy. A constant, passive heat.'},
    openingMove:'fire_breath',
    deck:[
      {id:'claw_swipe',  copies:2,name:'Claw Swipe',  effect:'dmg',    value:8,                                                              msg:'swipes with a massive claw!'},
      {id:'fire_breath', copies:2,name:'Fire Breath',  effect:'dot',    dotDmg:4,dotTick:2000,dotDur:6000,status:'fire_dot',                 msg:'breathes fire!'},
      {id:'flame_surge', copies:1,name:'Flame Surge',  effect:'dmg_and_dot',value:6,dotDmg:3,dotTick:2000,dotDur:4000,status:'fire_dot2',   msg:'surges with flame!'},
    ]};
