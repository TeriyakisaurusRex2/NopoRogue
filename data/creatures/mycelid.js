// ════════════════════════════════════════════════════
// CREATURE: MYCELID
// Drop mycelid.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.mycelid = {id:'mycelid',name:'MYCELID',icon:'🦠',lore:'The mycelid doesn\'t think as you do. It thinks as the fungal network thinks — distributed, patient, everywhere at once. Your wounds are already inoculated.',baseStats:{str:12,agi:8,wis:8},growth:{str:1.2,agi:0.6,wis:0.8},baseDmg:3,dmgGrowth:0.35,gold:[1,3],
    cardRewards:['hex_bolt','spore_cloud'],
    innate:{id:'spreading_spores',name:'Spreading Spores',desc:'Every 3rd card played automatically applies Poison (4 dmg/2s) to the enemy. Play cards — the poison follows.'},
    openingMove:'mycelid_tendril',
    deck:[
      {id:'mycelid_tendril', copies:3, name:'Tendril',    effect:'dmg',            value:2,                                              msg:'lashes with a tendril!'},
      {id:'mycelid_spore',   copies:1, name:'Spore Cloud', effect:'dmg_and_debuff', value:1,status:'smoke',debuffVal:-0.4,debuffDur:3000, msg:'releases a slowing spore cloud!'},
    ]};
