// ════════════════════════════════════════════════════
// CREATURE: MASKEDOWL
// Drop maskedowl.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.maskedowl = {id:'maskedowl',name:'MASKED OWL',icon:'🦉',lore:'It wears what looks like a human face. It isn\'t. The owl found it somewhere and liked the shape. Champions report it tilts its head while they die, as if taking notes.',baseStats:{str:14,agi:18,wis:16},growth:{str:1.5,agi:1.5,wis:1.5},baseDmg:11,dmgGrowth:1,gold:[6,12],
    cardRewards:['mist_step','ancient_roar'],
    innate:{id:'silent_strike',name:'Silent Strike',desc:'The first card played deals double damage AND immediately grants [Dodge] — the next incoming hit is evaded. Strike first, vanish after.'},
    openingMove:'owl_rake',
    deck:[
      {id:'owl_rake',    copies:1,name:'Talon Rake',  effect:'dmg',       value:15,                                                                  msg:'strikes with silent talons!'},
      {id:'owl_glide',   copies:2,name:'Silent Glide',effect:'self_dodge',value:1,                                                                   msg:'glides silently, preparing an ambush!'},
      {id:'owl_screech', copies:1,name:'Screech',     effect:'discard',   value:1,                                                                   msg:'screeches, scattering your hand!'},
      {id:'owl_feather', copies:2,name:'Feather Strike',effect:'dmg',     value:8,                                                                   msg:'strikes with a razor feather!'},
    ]};