// ════════════════════════════════════════════════════
// CREATURE: KNIGHT
// Drop knight.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.knight = {id:'knight',name:'DARK KNIGHT',icon:'🦹',lore:'The armour is empty. Has been for years. Whatever animates it doesn\'t need a body — just a cause. The cause died centuries ago but nobody told the armour.',baseStats:{str:28,agi:12,wis:10},growth:{str:3,agi:1.2,wis:1},baseDmg:6,dmgGrowth:1.2,gold:[8,16],
    innate:{id:'iron_will',name:'Iron Will',desc:'Below 50% HP, all damage you take is reduced by 2. The will to survive hardens into armour.'},
    openingMove:'intimidate',
    deck:[
      {id:'dark_slash',  copies:3,name:'Dark Slash',  effect:'dmg',            value:7,                                                       msg:'slashes with a dark blade!'},
      {id:'shield_bash', copies:1,name:'Shield Bash',  effect:'dmg_and_debuff', value:4,status:'staggered',debuffVal:-0.3,debuffDur:2000,      msg:'bashes with a shield!'},
      {id:'intimidate',  copies:1,name:'Intimidate',   effect:'self_buff',      status:'knight_rage',value:0.5,dur:4000,                       msg:'intimidates!'},
    ]};
