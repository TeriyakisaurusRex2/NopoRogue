// ════════════════════════════════════════════════════
// CREATURE: TROLL
// Drop troll.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.troll = {id:'troll',name:'FOREST TROLL',icon:'🧌',lore:'Trolls don\'t hold grudges. They just forget they\'ve already beaten you and do it again. And again. Bring fire. Trolls dislike fire.',baseStats:{str:28,agi:5,wis:4},growth:{str:3,agi:0.5,wis:0.5},baseDmg:4,dmgGrowth:0.8,gold:[4,8],
    cardRewards:['claw_rake','wax_shell'],
    innate:{id:'regeneration',name:'Regeneration',desc:'Heals 1 HP every 4 seconds. Drag the fight out — time is on your side.'},
    openingMove:'taunt',
    deck:[
      {id:'club',       copies:3,name:'Club',       effect:'dmg',value:4,                                                                   msg:'swings its club!'},
      {id:'throw_rock', copies:1,name:'Throw Rock',  effect:'dmg',value:6,                                                                   msg:'hurls a boulder!'},
      {id:'taunt',      copies:1,name:'Taunt',       effect:'self_buff',status:'troll_tough',value:0.5,dur:5000,                             msg:'taunts you!'},
    ]};
