// ════════════════════════════════════════════════════
// CREATURE: TIDECRAB
// Drop tidecrab.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.tidecrab = {id:'tidecrab',name:'TIDE CRAB',icon:'🦀',lore:'Ordinary enough in open water. In the sunken harbour, cut off from the tide, it has grown — stranger, larger, adapted to the sealed dark.',baseStats:{str:16,agi:6,wis:3},growth:{str:1.8,agi:0.4,wis:0.2},baseDmg:4,dmgGrowth:0.5,gold:[2,4],
    cardRewards:['wax_shell','claw_rake'],
    innate:{id:'hardened',name:'Hardened Shell',desc:'The first 2 damage of every hit is always absorbed. Burst damage breaks through; small rapid hits do not.'},
    openingMove:'crab_snap',
    deck:[
      {id:'crab_snap',  copies:3, name:'Snap',      effect:'dmg', value:2, msg:'snaps a claw!'},
      {id:'crab_slam',  copies:2, name:'Shell Slam', effect:'dmg', value:5, msg:'slams its shell!'},
    ]};
