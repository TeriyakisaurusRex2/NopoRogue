// ════════════════════════════════════════════════════
// CREATURE: MINEGHOUL
// Drop mineghoul.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.mineghoul = {id:'mineghoul',name:'MINE GHOUL',icon:'⛏️',lore:'A miner who went in and didn\'t come out the same way. Whatever they found in the deep seam changed the contract between them and living.',baseStats:{str:12,agi:8,wis:5},growth:{str:1.3,agi:0.7,wis:0.4},baseDmg:3,dmgGrowth:0.4,gold:[2,4],
    cardRewards:['bone_slash','hex_bolt'],
    innate:{id:'dig_in',name:'Dig In',desc:'After 6s in combat, permanently gain +15% damage. Give yourself time to settle — then hit harder.'},
    openingMove:'ghoul_pick',
    deck:[
      {id:'ghoul_pick',   copies:3, name:'Pick Swing', effect:'dmg',  value:3,          msg:'swings a rusted pickaxe!'},
      {id:'ghoul_cavein', copies:1, name:'Cave-In',    effect:'stun', value:0, dur:800,  msg:'causes a mini cave-in!'},
    ]};
