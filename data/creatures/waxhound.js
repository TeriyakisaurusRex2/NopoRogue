// ════════════════════════════════════════════════════
// CREATURE: WAXHOUND
// Drop waxhound.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.waxhound = {id:'waxhound',name:'WAX HOUND',icon:'🐕',lore:'A hunting dog\'s loyalty preserved in amber wax. It remembers its original quarry. Everything else is just practice.',baseStats:{str:8,agi:18,wis:5},growth:{str:0.8,agi:1.8,wis:0.5},baseDmg:5,dmgGrowth:0.5,gold:[2,5],
    cardRewards:['claw_rake','leg_it_card'],
    innate:{id:'brittle_shell',name:'Brittle Shell',desc:'When HP drops to 20%: wax shell cracks — heals 15% max HP and gain +60% attack speed for 5s. Once per fight. Your best moments come last.'},
    openingMove:'wax_snap',
    deck:[
      {id:'wax_snap',   copies:3,name:'Wax Snap',    effect:'dmg',      value:5,                                           msg:'snaps with wax jaws!'},
      {id:'wax_lunge2', copies:2,name:'Wax Dash',    effect:'dmg',      value:7,                                           msg:'dashes and bites!'},
      {id:'wax_howl',   copies:1,name:'Wax Howl',    effect:'self_buff', status:'wax_howl',value:0.2,dur:3000,             msg:'howls, accelerating!'},
    ]};
