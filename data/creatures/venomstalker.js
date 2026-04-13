// ════════════════════════════════════════════════════
// CREATURE: VENOMSTALKER
// Drop venomstalker.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.venomstalker = {id:'venomstalker',name:'VENOM STALKER',icon:'🕷️',lore:'The predator of the fungal tunnels. It uses the spores to disorient, then takes its time. Very patient. Very thorough. Leaves nothing it can\'t use.',baseStats:{str:11,agi:14,wis:6},growth:{str:1,agi:1.3,wis:0.5},baseDmg:3,dmgGrowth:0.4,gold:[2,4],
    cardRewards:['rusty_stab','web_shot'],
    innate:{id:'poison_ambush',name:'Poison Ambush',desc:'Your first card each battle deals double damage AND applies 8 Poison. Strike from the dark — venom first.'},
    openingMove:'stalker_bite',
    deck:[
      {id:'stalker_bite',    copies:2, name:'Venom Bite',  effect:'dmg_and_dot',    value:2,dotDmg:2,dotTick:2000,dotDur:8000,status:'venom',           msg:'injects venom!'},
      {id:'stalker_web',     copies:2, name:'Web Shot',    effect:'dmg_and_debuff', value:1,status:'smoke',debuffVal:-0.4,debuffDur:4000,                 msg:'fires a slowing web!'},
      {id:'stalker_strike',  copies:1, name:'Claw Strike', effect:'dmg',            value:4,                                                             msg:'strikes with a venomous claw!'},
    ]};