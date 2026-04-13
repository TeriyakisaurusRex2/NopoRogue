// ════════════════════════════════════════════════════
// CREATURE: LAVACRAWLER
// Drop lavacrawler.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.lavacrawler = {id:'lavacrawler',name:'LAVA CRAWLER',icon:'🌋',lore:'Thrives in temperature that should not support anything. Moves through cooled rock like water. The cooling is temporary — it brings its own heat.',baseStats:{str:16,agi:5,wis:6},growth:{str:1.8,agi:0.4,wis:0.5},baseDmg:5,dmgGrowth:0.7,gold:[4,7],
    cardRewards:['ember_strike','dragon_breath'],
    innate:{id:'magma_trail',name:'Magma Trail',desc:'Every 5s, applies stacking Burn (3/3s) to the enemy. The heat accumulates — the longer the fight, the more they burn.'},
    openingMove:'crawler_slam',
    deck:[
      {id:'crawler_slam',  copies:2, name:'Lava Slam',   effect:'dmg', value:7, msg:'slams with a magma fist!'},
      {id:'crawler_spray', copies:2, name:'Magma Spray', effect:'dmg', value:3, msg:'sprays molten rock!'},
    ]};