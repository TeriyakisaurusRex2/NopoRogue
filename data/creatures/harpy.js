// ════════════════════════════════════════════════════
// CREATURE: HARPY
// Drop harpy.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.harpy = {id:'harpy',name:'HARPY',icon:'🦅',lore:'They scream before they strike. Not a war cry — a courtesy. Four heartbeats of warning before the talons. Some say this makes them honourable. Most of those people are dead.',baseStats:{str:14,agi:20,wis:7},growth:{str:1.5,agi:2,wis:0.8},baseDmg:3,dmgGrowth:0.6,gold:[4,9],
    innate:{id:'swoop',name:'Swoop',desc:'Every 4th card played deals double damage. Build rhythm — the payoff comes around reliably.'},
    openingMove:'wind_gust',
    deck:[
      {id:'talon',    copies:3,name:'Talon Strike',effect:'dmg',            value:3,                                                          msg:'rakes with its talons!'},
      {id:'shriek',   copies:1,name:'Shriek',       effect:'dmg_and_debuff',value:1,status:'deafened',debuffVal:-0.2,debuffDur:3000,          msg:'shrieks!'},
      {id:'wind_gust',copies:1,name:'Wind Gust',    effect:'self_buff',     status:'airborne',value:0.3,dur:2000,                             msg:'takes to the air!'},
    ]};
