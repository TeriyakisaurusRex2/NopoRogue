// ════════════════════════════════════════════════════
// CREATURE: WAXSOLDIER
// Drop waxsoldier.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.waxsoldier = {id:'waxsoldier',name:'WAX SOLDIER',icon:'🕯️',lore:'Cast from the wax of ancient queens, these soldiers maintain their vigil long after the wars that made them. They melt in sufficient heat, but the wax pools and reforms.',baseStats:{str:11,agi:10,wis:8},growth:{str:1.2,agi:1,wis:0.8},baseDmg:5,dmgGrowth:0.5,gold:[2,5],
    cardRewards:['wax_shell','leg_it_card'],
    innate:{id:'slow_melt',name:'Slow Melt',desc:'Mana regenerates 50% faster than normal. Warm wax oozes with latent energy — you always have something to spend.'},
    openingMove:'wax_strike',
    deck:[
      {id:'wax_strike',   copies:3,name:'Wax Strike',  effect:'dmg',      value:6,                                         msg:'strikes with a hardened wax fist!'},
      {id:'wax_harden',   copies:2,name:'Wax Harden',  effect:'self_buff', status:'wax_shell',value:0.15,dur:4000,           msg:'hardens its wax shell!'},
      {id:'wax_lunge',    copies:2,name:'Wax Lunge',   effect:'dmg',      value:9,                                         msg:'lunges with melting weight!'},
    ]};
