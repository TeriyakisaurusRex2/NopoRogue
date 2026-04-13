// ════════════════════════════════════════════════════
// CREATURE: SPOREPUFF
// Drop sporepuff.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.sporepuff = {id:'sporepuff',name:'SPORE PUFF',icon:'🍄',lore:'A balloon of fungal matter that does one thing: pop. The spores disperse into every cut, every breath. The mycelium remembers where it\'s been.',baseStats:{str:8,agi:8,wis:3},growth:{str:0.5,agi:0.5,wis:0.2},baseDmg:2,dmgGrowth:0.2,gold:[1,2],
    cardRewards:['spore_cloud','death_rattle'],
    innate:{id:'spore_burst',name:'Spore Burst',desc:'Every 8s, automatically releases spores — applying Poison (3 dmg/2s) to the enemy. You poison without lifting a finger.'},
    openingMove:'puff_hit',
    deck:[
      {id:'puff_hit', copies:4, name:'Puff', effect:'dmg', value:1, msg:'puffs spores at you!'},
    ]};
