// ════════════════════════════════════════════════════
// CREATURE: VAULTSPECTRE
// Drop vaultspectre.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.vaultspectre = {id:'vaultspectre',name:'VAULT SPECTRE',icon:'👁️',lore:'The memory of a person, without the inconvenience of a body. The Vault recorded everything. It still plays back on loop. The recording is angry.',baseStats:{str:10,agi:14,wis:20},growth:{str:0.8,agi:1.2,wis:2.2},baseDmg:5,dmgGrowth:0.6,gold:[4,8],
    cardRewards:['hex_bolt','swamp_hex'],
    innate:{id:'malevolent_gaze',name:'Malevolent Gaze',desc:'Player mana regeneration is reduced by 30% while the Spectre watches. Silence it quickly.'},
    openingMove:'spectre_gaze',
    deck:[
      {id:'spectre_gaze',   copies:2, name:'Gaze',         effect:'dmg',            value:4,                                               msg:'fixes you with a malevolent stare!'},
      {id:'spectre_crush',  copies:2, name:'Psychic Crush', effect:'dmg',           value:8,                                               msg:'crushes your mind!'},
      {id:'spectre_tendrils',copies:1,name:'Tendrils',      effect:'dmg_and_debuff',value:5,status:'hexed',debuffVal:-0.2,debuffDur:3000, msg:'reaches with spectral tendrils!'},
    ]};