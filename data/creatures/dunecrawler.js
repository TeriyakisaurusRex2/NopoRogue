// ════════════════════════════════════════════════════
// CREATURE: DUNECRAWLER
// Drop dunecrawler.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.dunecrawler = {id:'dunecrawler',name:'DUNE CRAWLER',icon:'🪲',lore:'Adapted to the scorching sands, it glides beneath the surface and strikes from below. The dunes are never as empty as they look.',baseStats:{str:14,agi:6,wis:6},growth:{str:1.5,agi:0.5,wis:0.6},baseDmg:6,dmgGrowth:0.6,gold:[2,5],
    cardRewards:['wax_shell','spore_cloud'],
    innate:{id:'heat_armour',name:'Heat Armour',desc:'Takes 1 less damage from each hit. The wax exterior dissipates the force of every blow.'},
    openingMove:'wax_crush',
    deck:[
      {id:'wax_crush',  copies:2,name:'Wax Crush',   effect:'dmg',      value:8,                                           msg:'crushes with its heavy body!'},
      {id:'wax_burrow', copies:2,name:'Wax Burrow',  effect:'self_buff', status:'burrowing',value:0.25,dur:2000,           msg:'burrows briefly, becoming harder to hit!'},
      {id:'wax_grind',  copies:2,name:'Wax Grind',   effect:'dmg',      value:10,                                          msg:'grinds with hardened mandibles!'},
    ]};
