// ════════════════════════════════════════════════════
// CREATURE: WITCH
// Drop witch.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.witch = {id:'witch',name:'CURSED WITCH',icon:'🧙',lore:'The curse follows you home. Two days after the fight, champions report their food tasting wrong, their sleep full of dark geometry. This is normal. It fades. Probably.',baseStats:{str:12,agi:10,wis:25},growth:{str:1.2,agi:1,wis:2.5},baseDmg:4,dmgGrowth:0.6,gold:[7,14],
    innate:{id:'curse_mastery',name:'Curse Mastery',desc:'All debuffs you apply last 50% longer. Every hex, curse and slow lingers far past its welcome.'},
    openingMove:'hex_shield',
    deck:[
      {id:'hex_bolt2',  copies:2,name:'Hex Bolt',   effect:'dmg_and_debuff',value:4,status:'hexed_strong',debuffVal:-0.35,debuffDur:6000,    msg:'fires a powerful hex!'},
      {id:'curse',      copies:2,name:'Curse',        effect:'dot',          dotDmg:3,dotTick:2000,dotDur:8000,status:'cursed_w',             msg:'casts a curse!'},
      {id:'hex_shield', copies:1,name:'Hex Shield',   effect:'self_buff',    status:'witch_shield',value:3,dur:6000,                          msg:'conjures a hex shield!'},
    ]};
