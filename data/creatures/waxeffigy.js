// ════════════════════════════════════════════════════
// CREATURE: WAXEFFIGY
// Drop waxeffigy.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.waxeffigy = {id:'waxeffigy',name:'WAX EFFIGY',icon:'🗿',lore:'An effigy carved by ancient hands to embody fear itself. The wax has hardened over centuries into something that has its own opinions now.',baseStats:{str:10,agi:8,wis:12},growth:{str:1,agi:0.8,wis:1.2},baseDmg:5,dmgGrowth:0.5,gold:[3,6],
    cardRewards:['hex_bolt','wax_shell'],
    innate:{id:'effigy',name:'Effigy',desc:'PASSIVE: Your first card each battle costs no mana. The wax effigy stores your opening action in amber.'},
    openingMove:'wax_mimic',
    deck:[
      {id:'wax_mimic',  copies:1,name:'Mimic',       effect:'mimic_last',value:0.7,                                       msg:'mimics your last move against you!'},
      {id:'wax_pulse',  copies:3,name:'Wax Pulse',   effect:'dmg',          value:6,                                      msg:'pulses with warm wax energy!'},
      {id:'wax_curse',  copies:2,name:'Wax Curse',   effect:'dmg_and_debuff',value:5,status:'wax_cursed',debuffVal:-0.1,debuffDur:5000, msg:'curses you with melting wax!'},
    ]};
