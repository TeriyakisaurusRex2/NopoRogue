// ════════════════════════════════════════════════════
// CREATURE: FLAMESPRITE
// Drop flamesprite.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.flamesprite = {id:'flamesprite',name:'FLAME SPRITE',icon:'🔥',lore:'Fire that learned to move on purpose. Not intelligence, exactly — more like a very strong opinion about what should be burning. Right now: you.',baseStats:{str:7,agi:16,wis:5},growth:{str:0.5,agi:1.5,wis:0.5},baseDmg:2,dmgGrowth:0.25,gold:[1,3],
    cardRewards:['ember_strike','leg_it_card'],
    innate:{id:'volatile',name:'Volatile',desc:'On death, deals 5 Burn directly to the enemy. Shields do not protect them — Burn bypasses everything.'},
    openingMove:'sprite_ember',
    deck:[
      {id:'sprite_ember',   copies:3, name:'Ember Touch', effect:'dmg', value:2, msg:'scorches with embers!'},
      {id:'sprite_scatter', copies:1, name:'Scatter',     effect:'self_buff', status:'haste_rat',value:0.3,dur:2000, msg:'scatters in a burst of sparks!'},
    ]};
