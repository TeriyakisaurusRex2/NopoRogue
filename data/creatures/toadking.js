// ════════════════════════════════════════════════════
// CREATURE: TOADKING
// Drop toadking.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.toadking = {id:'toadking',name:'TOAD KING',icon:'🐸',lore:'The Toad King sits at the centre of its bog and the bog bends to it. Adventurers who arrive expecting a frog leave understanding why the title is not ironic.',baseStats:{str:18,agi:6,wis:10},growth:{str:2,agi:0.5,wis:1},baseDmg:4,dmgGrowth:0.8,gold:[3,7],
    innate:{id:'bog_aura',name:'Bog Aura',desc:'At battle start, reduces the enemy attack speed by 15% permanently. The bog pulls at everything.'},
    openingMove:'croak',
    deck:[
      {id:'tongue_lash',copies:2,name:'Tongue Lash',effect:'dmg',          value:3,                                                         msg:'lashes with its tongue!'},
      {id:'croak',      copies:1,name:'Croak',       effect:'self_buff',    status:'toad_bulk',value:0.3,dur:5000,                           msg:'lets out a mighty croak!'},
      {id:'mud_bomb',   copies:2,name:'Mud Bomb',    effect:'dmg_and_debuff',value:2,status:'muddy',debuffVal:-0.3,debuffDur:4000,           msg:'hurls a mud bomb!'},
    ]};
