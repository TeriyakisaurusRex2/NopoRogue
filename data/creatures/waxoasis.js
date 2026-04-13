// ════════════════════════════════════════════════════
// CREATURE: WAXOASIS
// Drop waxoasis.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.waxoasis = {id:'waxoasis',name:'THE WAX OASIS',icon:'✨',lore:'Not an oasis. The pooled wax shifts and breathes and forms something that looks like water. In the heat of the dunes, desperate travelers sometimes forget to check.',baseStats:{str:22,agi:4,wis:20},growth:{str:2,agi:0.2,wis:2},baseDmg:6,dmgGrowth:0.8,gold:[8,15],
    cardRewards:['wax_shell','hex_bolt'],
    innate:{id:'golden_reserves',name:'Golden Reserves',desc:'Mana regenerates 80% faster than normal. The stored wax energy fuels your every action.'},
    openingMove:'oasis_pulse',
    deck:[
      {id:'oasis_pulse', copies:3, name:'Wax Pulse',  effect:'dmg',            value:5,                                              msg:'pulses with golden energy!'},
      {id:'oasis_curse', copies:2, name:'Wax Curse',  effect:'dmg_and_debuff', value:4,status:'hexed',debuffVal:-0.15,debuffDur:4000, msg:'curses you with wax magic!'},
      {id:'oasis_shell', copies:1, name:'Wax Harden', effect:'self_shell',     value:10,dur:4000,                                    msg:'hardens its wax form!'},
    ]};
