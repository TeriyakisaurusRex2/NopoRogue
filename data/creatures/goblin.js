// ════════════════════════════════════════════════════
// CREATURE: GOBLIN
// Drop goblin.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.goblin = {id:'goblin',name:'GOBLIN SCOUT',icon:'👺',lore:'Goblin scouts are cowardly alone, but that\'s the point. They\'re buying time. Every second you spend finishing one off is a second their kin are closing in.',baseStats:{str:13,agi:10,wis:4},growth:{str:1.2,agi:1,wis:0.5},baseDmg:4,dmgGrowth:0.5,gold:[1,3],
    cardRewards:['rusty_stab','leg_it_card'],
    innate:{id:'scouts_alarm',name:"Scout's Alarm",desc:"Survive for 15s and you Rally: +40% attack speed and +50% damage permanently. Hold the line and the tide turns."},
    openingMove:'goblin_rush',
    deck:[
      {id:'goblin_slash',    copies:2, name:'Slash',               effect:'dmg', value:2, msg:'slashes wildly!'},
      {id:'goblin_rush',     copies:2, name:'Rush',                effect:'dmg', value:3, msg:'rushes in hard!'},
    ]};
