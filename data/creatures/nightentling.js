// ════════════════════════════════════════════════════
// CREATURE: NIGHTENTLING
// Drop nightentling.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.nightentling = {id:'nightentling',name:'NIGHT ENTLING',icon:'🌿',lore:'The nightentling eats sound. Silence trails behind it like a shadow. Champions who fight it describe the experience as deeply wrong in a way they can never quite articulate.',baseStats:{str:18,agi:4,wis:10},growth:{str:2,agi:0.3,wis:1},baseDmg:10,dmgGrowth:0.9,gold:[5,10],
    cardRewards:['spore_cloud','bone_slash'],
    innate:{id:'deep_roots',name:'Deep Roots',desc:'Heals 2 HP every 5 seconds. Ancient growth sustains you through long battles.'},
    openingMove:'entling_roots',
    deck:[
      {id:'entling_roots',  copies:2,name:'Grasping Roots',effect:'root_player', value:2500,                                                        msg:'erupts roots, freezing your draws!'},
      {id:'entling_lash',   copies:2,name:'Bramble Lash',  effect:'dmg',         value:12,                                                          msg:'lashes with thorny branches!'},
      {id:'entling_bloom',  copies:1,name:'Night Bloom',   effect:'self_heal',   value:8,                                                           msg:'blooms in the moonlight, healing!'},
      {id:'entling_bark',   copies:1,name:'Bark Armour',   effect:'self_shell',  value:8,dur:4000,                                                  msg:'hardens its bark, blocking damage!'},
    ]};
