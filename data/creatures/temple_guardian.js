// ════════════════════════════════════════════════════
// CREATURE: TEMPLE_GUARDIAN
// Drop temple_guardian.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.temple_guardian = {id:'temple_guardian',name:'TEMPLE GUARDIAN',icon:'🗿',lore:'Built to outlast the temple. Has. Still performing the sacred duty with a dedication that requires no faith because it has no choice.',baseStats:{str:24,agi:4,wis:12},growth:{str:2.8,agi:0.3,wis:1.2},baseDmg:9,dmgGrowth:1.1,gold:[6,11],
    cardRewards:['ancient_roar','wax_shell'],
    innate:{id:'stone_skin',name:'Stone Skin',desc:'The first 3 damage of every hit is absorbed. Ancient and unyielding — only sustained heavy blows will bring it down.'},
    openingMove:'guardian_slam',
    deck:[
      {id:'guardian_slam',  copies:2, name:'Ground Pound', effect:'dmg', value:11,                                          msg:'slams the ground with tremendous force!'},
      {id:'guardian_throw', copies:2, name:'Rock Throw',   effect:'dmg', value:7,                                           msg:'hurls a chunk of ancient stone!'},
      {id:'guardian_brace', copies:1, name:'Fortify',      effect:'self_shell', value:8,dur:4000,                           msg:'fortifies its ancient form!'},
    ]};