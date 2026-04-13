// ════════════════════════════════════════════════════
// CREATURE: THIEF
// Drop thief.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.thief = {id:'thief',name:'FACELESS THIEF',icon:'🎭',baseStats:{str:20,agi:20,wis:20},growth:{str:1,agi:3,wis:1},baseDmg:5,dmgGrowth:0.6,gold:[5,10],
    playable:true, cardRewards:['quick_slash','death_mark'],
    innate:{id:'shadow_mark',name:'Shadow Mark',desc:'Applies 16 Poison and makes the next card a guaranteed Crit (1.5× damage).'},
    openingMove:'thief_slash',
    deck:[
      {id:'thief_slash',  copies:3, name:'Quick Slash', effect:'dmg', value:4, msg:'slashes with blinding speed!'},
      {id:'thief_dart',   copies:2, name:'Poison Dart', effect:'dmg_and_dot', value:2,dotDmg:3,dotTick:2000,dotDur:8000,status:'poison', msg:'fires a poison dart!'},
      {id:'thief_mark',   copies:2, name:'Death Mark',  effect:'dmg_and_debuff', value:3,status:'death_mark',debuffVal:0.5,debuffDur:6000, msg:'marks for death!'},
    ]};
