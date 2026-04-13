// ════════════════════════════════════════════════════
// CREATURE: SIREN
// Drop siren.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.siren = {id:'siren',name:'SIREN',icon:'🧜',lore:'The song predates language. Something in it knows what you want to hear and hums it back in perfect pitch. Cover your ears. It still gets in through the chest.',baseStats:{str:8,agi:10,wis:14},growth:{str:0.7,agi:0.8,wis:1.4},baseDmg:3,dmgGrowth:0.4,gold:[3,6],
    cardRewards:['swamp_hex','hex_bolt'],
    innate:{id:'lure',name:'Lure',desc:'Enemy draw speed is reduced by 20% while you sing. The song works on anyone who hears it.'},
    openingMove:'siren_song',
    deck:[
      {id:'siren_song', copies:2, name:'Song',  effect:'dmg_and_debuff', value:2,status:'hexed',debuffVal:-0.15,debuffDur:4000, msg:'sings a debilitating melody!'},
      {id:'siren_wail', copies:2, name:'Wail',  effect:'dmg',            value:3,                                               msg:'wails in fury!'},
    ]};
