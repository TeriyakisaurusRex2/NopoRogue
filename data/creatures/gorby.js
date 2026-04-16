// ════════════════════════════════════════════════════
// CREATURE: GORBY
// Archetype: Conversion / Burst
// Loop: Wallop/Gut (generators) → Brace for It (sustain/engine) → Gorby Attack (payoff)
// Innate: Activated — converts all attack cards in hand into Ethereal Gorby Attacks
//         Formula: resolvedDamage × effectCount
//         Cards with more effects = bigger conversion value
// Mana: Innate costs mana to activate. Brace for It + Sorcery refunds most of it.
//       Rampage's third effect (×3 vs ×2) is Sorcery-gated.
// Drop gorby.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.gorby = {
  id:'gorby', name:'Gorby', icon:'👹',
  lore:'A thick-skulled brawler who has never learned a trick in his life — but has perfected the art of hitting things very hard. Gorby does not understand magic. He understands that when he squints at a card it glows, and then his fist hurts less.',
  baseStats:{str:14, agi:8, wis:10},
  growth:{str:2, agi:0.5, wis:1},
  baseDmg:5, dmgGrowth:0.6,
  gold:[2,5],
  playable:false,

  // Unlockable progression cards — unlocked through levelling
  cardRewards:['gb_claw','gb_rampage'],

  innate:{
    id:'gorby_convert',
    name:'Wot\'s Dis Do',
    desc:'ACTIVATED: Pay mana to convert all attack cards in hand into Ethereal Gorby Attacks. Each card becomes: resolved damage × number of effects on that card. Ethereal cards vanish when played or discarded.'
  },
  innateCost:60,
  innateActive:true,

  openingMove:'gb_wallop',

  // Enemy deck — used when fighting as an encounter
  // Deck size = STR (14)
  deck:[
    {id:'gb_wallop', copies:4, name:'Wallop',     effect:'dmg', value:8,  msg:'wallops you!'},
    {id:'gb_gut',    copies:3, name:'Gut Punch',  effect:'dmg', value:6,  msg:'gut punches!'},
    {id:'gb_brace',  copies:3, name:'Tough It Out',effect:'shield',value:12,msg:'braces!'},
    {id:'strike',    copies:2, name:'Strike',     effect:'dmg', value:5,  msg:'attacks!'},
    {id:'brace',     copies:2, name:'Brace',      effect:'shield',value:8,msg:'braces!'},
  ]
};
