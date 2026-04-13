// ════════════════════════════════════════════════════
// CREATURE: ASHBAT
// Drop ashbat.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.ashbat = {id:'ashbat',name:'ASH BAT',icon:'🦇',lore:'Lives in the soot and smoke of collapsed tunnels. The ash has gotten into its wings, its bones, its small furious brain. Everything it touches comes away grey.',baseStats:{str:9,agi:18,wis:4},growth:{str:0.7,agi:1.8,wis:0.3},baseDmg:2,dmgGrowth:0.3,gold:[1,3],
    cardRewards:['mist_step','leg_it_card'],
    innate:{id:'soot_cloud',name:'Soot Cloud',desc:'30% chance on hit to apply [Slow] (2s) to the enemy. Unpredictable — but it adds up.'},
    openingMove:'bat_wing',
    deck:[
      {id:'bat_wing', copies:3, name:'Wing Slash', effect:'dmg', value:2, msg:'slashes with a wing!'},
      {id:'bat_dive',  copies:1, name:'Dive',      effect:'dmg', value:5, msg:'dives from above!'},
    ]};
