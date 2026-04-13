// ════════════════════════════════════════════════════
// CREATURE: LICH
// Drop lich.png into assets/creatures/ for a custom sprite.
// ════════════════════════════════════════════════════

CREATURES.lich = {id:'lich',name:'LICH KING',icon:'☠️',lore:'A lich is what happens when a wizard decides that death is optional and does something about it. The decision is usually made at a point of considerable desperation and poor judgement.',baseStats:{str:38,agi:12,wis:28},growth:{str:4,agi:1.2,wis:3},baseDmg:7,dmgGrowth:1.2,gold:[16,28],
    innate:{id:'death_aura',name:'Death Aura',desc:'Enemy mana regeneration is halved. Your presence drains the life from their reserves.'},
    openingMove:'soul_drain',
    deck:[
      {id:'death_bolt', copies:2,name:'Death Bolt', effect:'dmg',            value:7,                                                        msg:'fires a death bolt!'},
      {id:'soul_drain', copies:2,name:'Soul Drain',  effect:'dmg_and_debuff', value:4,status:'drained',debuffVal:-0.3,debuffDur:5000,         msg:'drains your soul!'},
      {id:'raise_dead', copies:1,name:'Raise Dead',  effect:'self_buff',      status:'undead_power',value:0.4,dur:6000,                       msg:'raises the dead!'},
    ]};
