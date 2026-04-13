// ════════════════════════════════════════════════════
// CREATURE: GRUB
// Drop grub.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.grub = {id:'grub',name:'BLOATED GRUB',icon:'🐛',lore:'Cave grubs feed on rot and darkness. In the deep tunnels, they feed on whatever else is available. The fact that it\'s you is nothing personal.',baseStats:{str:14,agi:4,wis:3},growth:{str:1.5,agi:0.4,wis:0.3},baseDmg:4,dmgGrowth:0.5,gold:[1,3],
    innate:{id:'tough_hide',name:'Tough Hide',desc:'The first hit taken each battle deals 50% less damage. Open with confidence.'},
    openingMove:'bloat_pulse',
    deck:[
      {id:'slug',        copies:3,name:'Slug',        effect:'dmg',       value:3,                                                            msg:'slams its bulk into you!'},
      {id:'bloat_pulse', copies:1,name:'Bloat Pulse',  effect:'self_buff', status:'grub_shield',value:2,dur:4000,                             msg:'inflates defensively!'},
      {id:'seep',        copies:1,name:'Seep',         effect:'dot',       dotDmg:1,dotTick:3000,dotDur:9000,status:'grub_seep',              msg:'seeps foul liquid!'},
    ]};