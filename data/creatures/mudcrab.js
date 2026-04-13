// ════════════════════════════════════════════════════
// CREATURE: MUDCRAB
// Drop mudcrab.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.mudcrab = {id:'mudcrab',name:'MUD CRAB',icon:'🦀',lore:'The mud crab has no ambitions beyond the next meal. It never needed any — that shell has kept its kind alive for a thousand years.',baseStats:{str:12,agi:6,wis:4},growth:{str:1.5,agi:0.5,wis:0.5},baseDmg:5,dmgGrowth:0.6,gold:[1,3],
    innate:{id:'hardened',name:'Hardened',desc:'The first 2 damage of every hit is always absorbed. Small hits barely scratch you.'},
    openingMove:'shell_up',
    deck:[
      {id:'claw',     copies:3, name:'Claw',    effect:'dmg',            value:2,                                                              msg:'snaps its claw!'},
      {id:'shell_up', copies:1, name:'Shell Up', effect:'self_buff',      status:'shell',value:2,dur:4000,                                      msg:'retreats into its shell!'},
      {id:'pinch',    copies:1, name:'Pinch',    effect:'dmg_and_debuff', value:2,status:'pinched',debuffVal:-0.2,debuffDur:3000,               msg:'pinches you!'},
    ]};
