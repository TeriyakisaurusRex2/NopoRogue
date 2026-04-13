// ════════════════════════════════════════════════════
// CREATURE: EMBERGOLEM
// Drop embergolem.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.embergolem = {id:'embergolem',name:'EMBER GOLEM',icon:'🪨',lore:'Assembled from the cooled lava of an ancient eruption. Slow. Deliberate. Holds an enormous amount of heat for a very long time. Do not hug.',baseStats:{str:20,agi:4,wis:5},growth:{str:2.2,agi:0.3,wis:0.4},baseDmg:5,dmgGrowth:0.7,gold:[3,6],
    cardRewards:['ember_strike','wax_shell'],
    innate:{id:'molten_core',name:'Molten Core',desc:'Below 50% HP: attack speed +20% and each hit applies Burn (3/3s) to the enemy. When the core ignites, you become a furnace.'},
    openingMove:'golem_smash',
    deck:[
      {id:'golem_smash', copies:2, name:'Boulder Smash', effect:'dmg', value:6, msg:'smashes with a stone fist!'},
      {id:'golem_sear',  copies:2, name:'Sear',          effect:'dmg', value:3, msg:'sears with molten heat!'},
    ]};
