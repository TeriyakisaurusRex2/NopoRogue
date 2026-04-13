// ════════════════════════════════════════════════════
// CREATURE: DRAGON
// Drop dragon.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.dragon = {id:'dragon',name:'ELDER DRAGON',icon:'🐲',lore:'Most champions who face a dragon don\'t lose to the fire. They lose to the calm. The dragon has seen centuries of confident people walk into its lair. The expression on its face is boredom.',baseStats:{str:35,agi:12,wis:18},growth:{str:4,agi:1.2,wis:2},baseDmg:10,dmgGrowth:1.8,gold:[20,38],
    cardRewards:['dragon_breath','ember_strike','ancient_roar'],
    innate:{id:'ancient_fury',name:'Ancient Fury',desc:'Below 25% HP, your attack speed and all damage both double. Brought low, you become truly lethal.'},
    openingMove:'wing_blast',
    deck:[
      {id:'dragon_bite',   copies:2,name:'Dragon Bite',  effect:'dmg',            value:10,                                                   msg:'bites with ancient fury!'},
      {id:'wing_blast',    copies:2,name:'Wing Blast',    effect:'dmg_and_debuff', value:6,status:'blown_back',debuffVal:-0.4,debuffDur:3000,  msg:'blasts with its wings!'},
      {id:'dragon_breath', copies:1,name:'Dragon Breath', effect:'dot',            dotDmg:5,dotTick:2000,dotDur:8000,status:'dragon_fire',    msg:'breathes ancient fire!'},
    ]};
