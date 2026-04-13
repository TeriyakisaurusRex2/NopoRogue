// ════════════════════════════════════════════════════
// CREATURE: CAVEGRUB
// Drop cavegrub.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.cavegrub = {id:'cavegrub',name:'CAVE GRUB',icon:'🐛',lore:'The deep grub feeds on decay and reproduces faster than you\'d like to think about. Every nest has thousands. You found a loner. That means there\'s a nest nearby.',baseStats:{str:18,agi:4,wis:3},growth:{str:2,agi:0.3,wis:0.2},baseDmg:3,dmgGrowth:0.4,gold:[1,3],
    cardRewards:['spore_cloud','wax_shell'],
    innate:{id:'toxic_body',name:'Toxic Body',desc:'Whenever you take a direct hit, the enemy receives 2 Poison (stacking). Every blow they land poisons them back.'},
    openingMove:'grub_slug',
    deck:[
      {id:'grub_slug',   copies:3, name:'Slug',       effect:'dmg',       value:3, msg:'slams into you!'},
      {id:'grub_shield', copies:1, name:'Bloat Pulse', effect:'self_buff', status:'grub_shield',value:2,dur:4000, msg:'inflates defensively!'},
    ]};
