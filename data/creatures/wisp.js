// ════════════════════════════════════════════════════
// CREATURE: WISP
// Drop wisp.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.wisp = {id:'wisp',name:'BOG WISP',icon:'🔮',lore:'Nobody knows what a bog wisp actually is. The scholars say trapped souls. The locals say bad gas. Both agree you should not follow one into the dark.',baseStats:{str:7,agi:12,wis:12},growth:{str:0.8,agi:1,wis:1.5},baseDmg:3,dmgGrowth:0.4,gold:[2,5],
    cardRewards:['hex_bolt','swamp_hex'],
    innate:{id:'ethereal',name:'Ethereal',desc:'All damage taken is reduced by 1. The ethereal form softens every blow.'},
    openingMove:'will_o',
    deck:[
      {id:'hex_bolt',copies:3,name:'Hex Bolt',  effect:'dmg_and_debuff',value:3,status:'hexed',debuffVal:-0.2,debuffDur:4000,                msg:'fires a hex bolt!'},
      {id:'will_o',  copies:1,name:"Will o' Wisp",effect:'self_buff',  status:'wisp_evade',value:0,dur:2000,                                msg:'flickers and evades!'},
      {id:'drain',   copies:1,name:'Life Drain', effect:'dmg',          value:4,                                                            msg:'drains your life force!'},
    ]};
