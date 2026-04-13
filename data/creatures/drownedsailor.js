// ════════════════════════════════════════════════════
// CREATURE: DROWNEDSAILOR
// Drop drownedsailor.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.drownedsailor = {id:'drownedsailor',name:'DROWNED SAILOR',icon:'🧟',lore:'The tide brought them back and they couldn\'t find their way home again. The pull of the sea is different now — it calls inward, into the dark, into the deep.',baseStats:{str:14,agi:4,wis:4},growth:{str:1.5,agi:0.3,wis:0.3},baseDmg:8,dmgGrowth:1.0,gold:[3,6],
    cardRewards:['bone_slash','ancient_roar'],
    innate:{id:'waterlogged',name:'Waterlogged',desc:'You attack 50% slower, but each hit deals triple damage. Slow, heavy, inevitable.'},
    openingMove:'sailor_anchor',
    deck:[
      {id:'sailor_anchor',   copies:2, name:'Anchor Swing',   effect:'dmg', value:8, msg:'swings a rusted anchor!'},
      {id:'sailor_barnacle', copies:2, name:'Barnacle Hurl',  effect:'dmg', value:3, msg:'hurls clusters of barnacles!'},
      {id:'sailor_drag',     copies:1, name:'Drag Under',     effect:'dmg_and_debuff', value:5,status:'smoke',debuffVal:-0.3,debuffDur:3000, msg:'drags you toward the depths!'},
    ]};
