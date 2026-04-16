// ════════════════════════════════════════════════════
// CREATURE: RAT
// Archetype: Tempo / Frenzy escalation
// Loop: Gnaw (generator) → Dart (engine) → Scurry (payoff)
// Innate: Frenzied — PASSIVE, gain 1 Frenzy on each attack card played
// Frenzy: stacking draw speed buff, collapses on expiry or at 0 mana
// Drop rat.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.rat = {
  id:'rat', name:'Giant Rat', icon:'🐀',
  lore:'A bloated, mean-tempered rodent that thrives in the filth beneath every civilised place. The longer it fights, the faster it gets — veterans know to end it quick. Let it build momentum and it becomes almost impossible to stop.',
  baseStats:{str:10, agi:16, wis:6},
  growth:{str:1, agi:2, wis:0.5},
  baseDmg:3, dmgGrowth:0.4,
  gold:[1,3],
  playable:false,

  // Unlockable progression cards — available after levelling
  cardRewards:['gr_frenzy_surge','gr_frenzy_burst'],

  innate:{
    id:'frenzied',
    name:'Frenzied',
    desc:'PASSIVE: Whenever you play an attack card, gain 1 stack of [Frenzy]. Frenzy increases draw speed by 10% per stack. Collapses entirely on expiry or when mana runs out. Drains 3 mana/s while active.'
  },

  openingMove:'gr_gnaw',

  // Enemy deck — used when fighting as an encounter
  // Deck size = STR (10)
  deck:[
    {id:'gr_gnaw',   copies:3, name:'Gnaw',   effect:'dmg', value:4,  msg:'gnaws savagely!'},
    {id:'gr_dart',   copies:2, name:'Dart',   effect:'mana',value:15, msg:'darts forward!'},
    {id:'gr_scurry', copies:1, name:'Scurry', effect:'dmg', value:6,  msg:'scurries in for the kill!'},
    {id:'strike',    copies:2, name:'Strike', effect:'dmg', value:4,  msg:'attacks!'},
    {id:'brace',     copies:2, name:'Brace',  effect:'shield',value:8,msg:'braces itself!'},
  ]
};
