// ════════════════════════════════════════════════════
// CREATURE: ABYSSCRAWLER
// Drop abysscrawler.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.abysscrawler = {id:'abysscrawler',name:'ABYSS CRAWLER',icon:'🐙',lore:'From a depth where the rules are different. Up here the light is wrong and gravity feels like a suggestion. It hasn\'t adjusted. Neither will you.',baseStats:{str:18,agi:8,wis:14},growth:{str:2.0,agi:0.7,wis:1.4},baseDmg:7,dmgGrowth:0.9,gold:[5,10],
    cardRewards:['web_shot','ancient_roar'],
    innate:{id:'deep_pressure',name:'Deep Pressure',desc:'Every 5s, reduces the enemy max mana by 15 for 4s. The deep pressure squeezes their reserves.'},
    openingMove:'crawler_crush',
    deck:[
      {id:'crawler_crush',    copies:2, name:'Crush',    effect:'dmg', value:9,                                              msg:'crushes with massive limbs!'},
      {id:'crawler_tentacle', copies:2, name:'Tentacle', effect:'dmg_and_debuff',value:5,status:'smoke',debuffVal:-0.3,debuffDur:3000, msg:'snares with a tentacle!'},
    ]};
