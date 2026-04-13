// ════════════════════════════════════════════════════
// CREATURE: PALADIN
// Drop paladin.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.paladin = {id:'paladin',name:'CURSED PALADIN',icon:'🛡️',baseStats:{str:20,agi:20,wis:20},growth:{str:3,agi:1,wis:1},baseDmg:8,dmgGrowth:1,gold:[5,10],
    playable:true, cardRewards:['retribution','holy_shield'],
    innate:{id:'holy_flame',name:'Holy Flame',desc:'PASSIVE: Whenever you apply a buff or debuff, the enemy gains Burn (WIS×1 dmg/3s). Stacks indefinitely.'},
    openingMove:'paladin_retribution',
    deck:[
      {id:'paladin_retribution', copies:3, name:'Retribution', effect:'dmg', value:10, msg:'strikes with holy fury!'},
      {id:'paladin_shield',      copies:2, name:'Holy Shield',  effect:'self_shell', value:15,dur:5000, msg:'raises a holy shield!'},
      {id:'paladin_consecrate',  copies:2, name:'Consecrate',   effect:'dmg', value:6, msg:'consecrates the ground!'},
    ]};
