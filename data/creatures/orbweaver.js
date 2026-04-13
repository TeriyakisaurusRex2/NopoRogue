// ════════════════════════════════════════════════════
// CREATURE: ORBWEAVER
// Drop orbweaver.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.orbweaver = {id:'orbweaver',name:'ORBWEAVER',icon:'🕷️',lore:'The web is older than the forest it hangs in. The spider that tends it may not be the original. The web doesn\'t care either way — it just catches things.',baseStats:{str:12,agi:16,wis:12},growth:{str:1.2,agi:1.5,wis:1},baseDmg:9,dmgGrowth:0.9,gold:[4,9],
    cardRewards:['web_shot','death_rattle'],
    innate:{id:'web_mastery',name:'Web Mastery',desc:'Your first Slow each battle applies twice — double duration, double potency. One web holds them long enough.'},
    openingMove:'orb_barrage',
    deck:[
      {id:'orb_web',     copies:2,name:'Web Shot',    effect:'slow_draw', value:1200,dur:5000,                                                       msg:'fires sticky webs, slowing your draws!'},
      {id:'orb_venom',   copies:2,name:'Venom Bite',  effect:'dmg_dot',   value:10, dotDmg:3,dotTick:2000,dotDur:6000,status:'spider_venom',        msg:'bites with venomous fangs!'},
      {id:'orb_cocoon',  copies:1,name:'Cocoon Wrap', effect:'slow_draw', value:600,dur:4000,                                                        msg:'wraps you in silk, slowing your draws!'},
      {id:'orb_barrage', copies:1,name:'Leg Barrage', effect:'dmg_multi', value:5, hits:3,                                                           msg:'attacks with all eight legs!'},
    ]};
