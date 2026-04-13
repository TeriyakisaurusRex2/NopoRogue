// ════════════════════════════════════════════════════
// CREATURE: TUNNELANT
// Drop tunnelant.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.tunnelant = {id:'tunnelant',name:'TUNNEL ANT',icon:'🐜',lore:'Ants this deep aren\'t building for any queen you\'d recognise. The colony is old enough that it has its own culture. You are trespassing in a small civilisation.',baseStats:{str:10,agi:16,wis:3},growth:{str:0.8,agi:1.5,wis:0.2},baseDmg:2,dmgGrowth:0.3,gold:[1,2],
    cardRewards:['claw_rake','leg_it_card'],
    innate:{id:'swarm_ant',name:'Swarm',desc:'The first time you would die, you survive at 5 HP instead. The colony does not fall so easily. Once per fight.'},
    openingMove:'ant_bite',
    deck:[
      {id:'ant_bite',  copies:3, name:'Bite',            effect:'dmg', value:1, msg:'bites frantically!'},
      {id:'ant_crush', copies:1, name:'Mandible Crush',  effect:'dmg', value:3, msg:'crushes with its mandibles!'},
    ]};
