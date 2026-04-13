// ════════════════════════════════════════════════════
// CREATURE: INKSQUALL
// Drop inksquall.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.inksquall = {id:'inksquall',name:'INK SQUALL',icon:'🦑',lore:'The squid that swam into the harbour when it flooded and decided to stay. The ink it releases isn\'t just dark — it erases the memory of light.',baseStats:{str:9,agi:18,wis:5},growth:{str:0.8,agi:1.8,wis:0.4},baseDmg:3,dmgGrowth:0.35,gold:[2,4],
    cardRewards:['mist_step','web_shot'],
    innate:{id:'ink_cloud',name:'Ink Cloud',desc:'The first time you take damage, you gain [Dodge] — the next hit is completely evaded. React to the threat.'},
    openingMove:'squid_slap',
    deck:[
      {id:'squid_slap', copies:3, name:'Tentacle Slap', effect:'dmg',            value:2,                                              msg:'slaps with a tentacle!'},
      {id:'squid_ink',  copies:1, name:'Ink Burst',     effect:'dmg_and_debuff', value:1,status:'smoke',debuffVal:-0.4,debuffDur:2000, msg:'bursts ink, slowing you!'},
    ]};
