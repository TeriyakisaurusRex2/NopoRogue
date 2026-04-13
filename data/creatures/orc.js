// ════════════════════════════════════════════════════
// CREATURE: ORC
// Drop orc.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.orc = {id:'orc',name:'ORC WARRIOR',icon:'👹',lore:'Orc warriors don\'t fear pain — they interpret it as confirmation that the fight has become interesting. The bloodied, cornered orc is the most dangerous one in the room.',baseStats:{str:22,agi:9,wis:6},growth:{str:2.5,agi:1,wis:0.8},baseDmg:5,dmgGrowth:1,gold:[4,9],
    innate:{id:'battle_rage',name:'Battle Rage',desc:'Below 33% HP, all your damage is doubled. The more desperate the fight, the more dangerous you become.'},
    openingMove:'war_cry',
    deck:[
      {id:'slam',        copies:3,name:'Slam',        effect:'dmg',            value:5,                                                      msg:'slams with a heavy fist!'},
      {id:'war_cry',     copies:1,name:'War Cry',      effect:'self_buff',     status:'enraged',value:0.4,dur:4000,                          msg:'lets out a war cry!'},
      {id:'ground_slam', copies:1,name:'Ground Slam',  effect:'dmg_and_debuff',value:4,status:'stunned_player',debuffVal:-0.5,debuffDur:1500, msg:'slams the ground!'},
    ]};
