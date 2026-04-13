// ════════════════════════════════════════════════════
// CREATURE: ROACH
// Drop roach.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.roach = {id:'roach',name:'SEWER ROACH',icon:'🪲',lore:'The sewer roach has no great ambitions. It will be here long after you, long after the sewers, long after whatever culture built the sewers. It finds this funny.',baseStats:{str:8,agi:18,wis:3},growth:{str:0.6,agi:2,wis:0.3},baseDmg:3,dmgGrowth:0.3,gold:[1,2],
    cardRewards:['web_shot','mist_step'],
    innate:{id:'skitter',name:'Skitter',desc:'Every 8s, gain [Dodge] — the next direct hit against you is evaded completely.'},
    openingMove:'scuttle',
    deck:[
      {id:'scuttle', copies:4, name:'Scuttle', effect:'dmg', value:1, msg:'scuttles and bites!'},
    ]};
