// ════════════════════════════════════════════════════
// CREATURE: CURSEDURN
// Drop cursedurn.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.cursedurn = {id:'cursedurn',name:'CURSED URN',icon:'🏺',lore:'Ancient pottery. Whoever is sealed inside is very unhappy about it and has had centuries to think about what to do when the seal breaks.',baseStats:{str:14,agi:8,wis:16},growth:{str:1.2,agi:0.6,wis:1.8},baseDmg:6,dmgGrowth:0.7,gold:[4,8],
    cardRewards:['hex_bolt','death_rattle'],
    innate:{id:'overcharge',name:'Overcharge',desc:'Every 6s, permanently gain +10% attack speed. The longer the fight, the faster you become.'},
    openingMove:'urn_hex',
    deck:[
      {id:'urn_hex',      copies:3, name:'Hex Wave',  effect:'dmg_and_debuff', value:5,status:'hexed',debuffVal:-0.15,debuffDur:4000, msg:'unleashes a hex wave!'},
      {id:'urn_overflow', copies:2, name:'Overflow',  effect:'dmg',            value:9,                                               msg:'overflows with cursed energy!'},
    ]};
