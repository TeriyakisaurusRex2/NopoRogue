// ════════════════════════════════════════════════════
// CREATURE: SKELETON
// Drop skeleton.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.skeleton = {id:'skeleton',name:'SKELETON',icon:'💀',lore:'There is nothing left in this thing — no hunger, no fear, no hesitation. Only the echo of violence it carried in life, still running its old routines.',baseStats:{str:12,agi:10,wis:7},growth:{str:1.5,agi:1,wis:0.8},baseDmg:3,dmgGrowth:0.6,gold:[2,5],
    cardRewards:['bone_slash','death_rattle'],
    innate:{id:'undying',name:'Undying',desc:'The first time you would die, you survive with 1 HP instead. Once per fight.'},
    openingMove:'rattle',
    deck:[
      {id:'bone_slash', copies:3,name:'Bone Slash',effect:'dmg',            value:3,                                                         msg:'slashes with a bone blade!'},
      {id:'rattle',     copies:1,name:'Rattle',     effect:'self_buff',     status:'rattled',value:0.2,dur:3000,                             msg:'rattles its bones!'},
      {id:'bone_throw', copies:1,name:'Bone Throw', effect:'dmg_and_debuff',value:2,status:'rattled_player',debuffVal:-0.15,debuffDur:3000,  msg:'throws a bone!'},
    ]};
