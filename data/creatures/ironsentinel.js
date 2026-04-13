// ════════════════════════════════════════════════════
// CREATURE: IRONSENTINEL
// Drop ironsentinel.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.ironsentinel = {id:'ironsentinel',name:'IRON SENTINEL',icon:'⚔️',lore:'It was built to be impossible to kill. Several centuries of evidence suggest the builders were good at their jobs. The Vault it guards no longer exists but the mandate remains.',baseStats:{str:22,agi:5,wis:10},growth:{str:2.5,agi:0.4,wis:0.8},baseDmg:7,dmgGrowth:0.8,gold:[5,9],
    cardRewards:['wax_shell','bone_slash'],
    innate:{id:'vigilance',name:'Vigilance',desc:'The first 5 damage of every hit is absorbed. Only sustained heavy blows get through.'},
    openingMove:'sentinel_guard',
    deck:[
      {id:'sentinel_guard', copies:3, name:'Guard Strike', effect:'dmg',  value:7,         msg:'strikes with a guarding blow!'},
      {id:'sentinel_lock',  copies:2, name:'Lockdown',     effect:'stun', value:0,dur:1000, msg:'locks you down momentarily!'},
    ]};
