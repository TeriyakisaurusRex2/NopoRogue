// ════════════════════════════════════════════════════
// CREATURE: LURKER
// Drop lurker.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.lurker = {id:'lurker',name:'DRAIN LURKER',icon:'🐊',lore:'You won\'t see it until it\'s already on you. This is not a skill. This is patience refined over generations into something that barely needs a body anymore.',baseStats:{str:24,agi:10,wis:5},growth:{str:2.5,agi:1,wis:0.5},baseDmg:5,dmgGrowth:1,gold:[3,7],
    innate:{id:'lurk',name:'Lurk',desc:'Your first card each battle always deals double damage. Patience before the strike.'},
    openingMove:'lunge',
    deck:[
      {id:'lunge',     copies:2,name:'Lunge',     effect:'dmg',            value:6,                                                           msg:'lunges from the drain!'},
      {id:'tail_whip', copies:2,name:'Tail Whip',  effect:'dmg_and_debuff', value:3,status:'whipped',debuffVal:-0.25,debuffDur:3000,          msg:'whips with its tail!'},
      {id:'drag_under',copies:1,name:'Drag Under', effect:'stun_player',    value:600,                                                        msg:'drags you under!'},
    ]};
