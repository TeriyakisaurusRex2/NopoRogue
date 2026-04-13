// ════════════════════════════════════════════════════
// CREATURE: WATCHER
// Drop watcher.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.watcher = {id:'watcher',name:'SEWER WATCHER',icon:'👁️',lore:'Has no eyes but sees everything. Has no voice but the walls know what it\'s thinking. Don\'t let it watch you for too long. Things that are watched become different.',baseStats:{str:20,agi:8,wis:22},growth:{str:2,agi:0.8,wis:2.5},baseDmg:4,dmgGrowth:0.6,gold:[5,10],
    innate:{id:'malevolent_gaze',name:'Malevolent Gaze',desc:'Enemy mana regeneration is reduced by 30%. Your gaze drains their focus.'},
    openingMove:'gaze',
    deck:[
      {id:'gaze',          copies:2,name:'Gaze',          effect:'dmg_and_debuff',value:3,status:'hexed',debuffVal:-0.2,debuffDur:5000,       msg:'fixes you with its terrible gaze!'},
      {id:'psychic_crush', copies:2,name:'Psychic Crush', effect:'dmg_and_debuff',value:4,status:'mana_drained',debuffVal:-0.15,debuffDur:4000,msg:'crushes your mind!'},
      {id:'tendrils',      copies:1,name:'Tendrils',       effect:'stun_player',   value:800,                                                 msg:'lashes with psychic tendrils!'},
    ]};
