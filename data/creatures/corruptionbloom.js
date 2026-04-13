// ════════════════════════════════════════════════════
// CREATURE: CORRUPTIONBLOOM
// Drop corruptionbloom.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.corruptionbloom = {id:'corruptionbloom',name:'CORRUPTION BLOOM',icon:'🌸',lore:'A flower that bloomed in the drowned temple and was changed by what it found there. The petals still open at dawn, by instinct. But dawn is different down here.',baseStats:{str:16,agi:6,wis:18},growth:{str:1.4,agi:0.5,wis:2.0},baseDmg:5,dmgGrowth:0.6,gold:[5,9],
    cardRewards:['spore_cloud','death_rattle'],
    innate:{id:'bloom',name:'Infectious Bloom',desc:'Every 4s, applies stacking Poison to the enemy that also slows their draw speed by 5% per stack (max 3 stacks). Let it build — they slow down as you poison them.'},
    openingMove:'bloom_touch',
    deck:[
      {id:'bloom_touch',  copies:3, name:'Corrupt Touch', effect:'dmg_and_dot', value:3,dotDmg:3,dotTick:2000,dotDur:8000,status:'corruption', msg:'reaches with a corrupted tendril!'},
      {id:'bloom_spore',  copies:2, name:'Spore Wave',    effect:'dmg_and_debuff',value:4,status:'smoke',debuffVal:-0.3,debuffDur:4000,         msg:'releases a wave of corrupting spores!'},
    ]};
