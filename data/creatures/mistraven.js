// ════════════════════════════════════════════════════
// CREATURE: MISTRAVEN
// Drop mistraven.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.mistraven = {id:'mistraven',name:'MIST RAVEN',icon:'🐦‍⬛',lore:'The raven that lives in the mist learns the mist\'s habits. After long enough, it starts teaching the mist back. The Mistraven is a collaboration.',baseStats:{str:10,agi:22,wis:8},growth:{str:1,agi:2,wis:0.5},baseDmg:8,dmgGrowth:0.8,gold:[4,8],
    cardRewards:['mist_step','claw_rake'],
    innate:{id:'mist_veil',name:'Mist Veil',desc:'Gains Dodge at the start of combat. On a successful dodge, 30% chance to refresh Dodge again.'},
    openingMove:'mist_dive',
    deck:[
      {id:'mist_talon',  copies:2,name:'Talon Strike',  effect:'dmg',       value:12,                                                                msg:'slashes with razor talons!'},
      {id:'mist_step',   copies:2,name:'Mist Step',     effect:'self_dodge',value:1,                                                                 msg:'vanishes into the mist!'},
      {id:'mist_shriek', copies:1,name:'Shriek',        effect:'discard',   value:1,                                                                 msg:'shrieks, scattering your thoughts!'},
      {id:'mist_dive',   copies:1,name:'Dive',          effect:'dmg',       value:18,                                                                msg:'dives from the fog!'},
    ]};
