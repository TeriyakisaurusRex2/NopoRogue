// ════════════════════════════════════════════════════
// CREATURE: FOGHAST
// Drop foghast.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.foghast = {id:'foghast',name:'FOGHAST',icon:'👻',lore:'Not quite dead, not quite alive, perfectly content with the ambiguity. The fog is home and the fog is self and the fog has been here since before the road was built.',baseStats:{str:8,agi:14,wis:18},growth:{str:0.8,agi:1,wis:1.5},baseDmg:7,dmgGrowth:0.7,gold:[5,10],
    cardRewards:['hex_bolt','swamp_hex'],
    innate:{id:'soul_siphon',name:'Soul Siphon',desc:'Each kill restores 20 mana. Every victory fuels the next.'},
    openingMove:'foghast_creep',
    deck:[
      {id:'foghast_chill',   copies:2,name:'Chill',     effect:'drain_mana', value:20,                                                               msg:'chills your mind, draining mana!'},
      {id:'foghast_pull',    copies:2,name:'Soul Pull',  effect:'dmg_drain',  value:8, drainMana:15,                                                  msg:'reaches into your soul!'},
      {id:'foghast_wail',    copies:1,name:'Wail',       effect:'slow_draw',  value:1200,dur:5000,                                                    msg:'wails, clouding your mind!'},
      {id:'foghast_creep',   copies:1,name:'Creep',      effect:'dmg',        value:6,                                                               msg:'creeps closer through the fog!'},
    ]};
