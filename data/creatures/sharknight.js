// ════════════════════════════════════════════════════
// CREATURE: SHARKNIGHT
// Drop sharknight.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.sharknight = {id:'sharknight',name:'SHARK KNIGHT',icon:'🦈',lore:'Once a knight of the harbour watch. The sea kept what the sea wanted. Armour, oath, and all. The visor still snaps shut by reflex when it charges.',baseStats:{str:15,agi:12,wis:3},growth:{str:1.6,agi:1.2,wis:0.2},baseDmg:5,dmgGrowth:0.6,gold:[4,8],
    cardRewards:['claw_rake','ancient_roar'],
    innate:{id:'feeding_frenzy',name:'Feeding Frenzy',desc:'Below 50% HP, your attack speed increases by 30%. A little blood in the water and you become something else entirely.'},
    openingMove:'shark_fin',
    deck:[
      {id:'shark_fin',   copies:3, name:'Fin Slash', effect:'dmg', value:3, msg:'slashes with a fin!'},
      {id:'shark_chomp', copies:2, name:'Chomp',     effect:'dmg', value:6, msg:'chomps with massive jaws!'},
    ]};