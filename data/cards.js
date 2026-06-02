// ════════════════════════════════════════════════════════════════
// KEYWORDS — combat status glossary
// ════════════════════════════════════════════════════════════════
// These render as inline tooltips on card effect text.
// To add a new keyword: add an entry here and wrap it in [BracketName]
// in any card effect string.
// ════════════════════════════════════════════════════════════════

var KEYWORDS = {
  // ── Damage over time ──
  Burn:      {cls:'burn',      def:'Deals X damage per second. Non-stacking; reapplication refreshes duration only. Bypasses Shield.'},
  Poison:    {cls:'poison',    def:'Deals X damage per second. Stacks; each application adds damage and refreshes timer. Bypasses Shield.'},

  // ── Debuffs ──
  Weaken:    {cls:'cursed',    def:'Target deals 15% less damage for the duration.'},
  Slow:      {cls:'slow',      def:'Draw speed reduced by X% for the duration. Non-stacking; reapplication refreshes.'},
  Stun:      {cls:'slow',      def:'Draw speed reduced by 90% for 1 second. Effectively freezes the creature briefly.'},
  Bleed:     {cls:'burn',      def:'Deals X damage each time the affected creature plays a card. Non-stacking; reapplication refreshes duration. Bypasses Shield. Punishes fast play speed.'},

  // ── Buffs ──
  Shield:    {cls:'shielded',  def:'Temporary HP buffer. Absorbs direct damage before HP. DoTs bypass it. Manabound.'},
  Dodge:     {cls:'dodge',     def:'The next incoming attack is completely evaded. Manabound.'},
  Haste:     {cls:'haste',     def:'Draw speed increased by X% for the duration. Manabound.'},
  Frenzy:    {cls:'hastened',  def:'Stacking draw-speed buff. Each stack = +10% draw speed. Collapses entirely when timer expires. Manabound. Drains 3 mana/s.'},
  Thorns:    {cls:'burn',      def:'Each hit from an attack card reflects X damage back to the attacker. Triggers through Shield. Manabound.'},

  // ── Card keywords ──
  Sorcery:   {cls:'drain',     def:'Spend X mana to trigger this bonus. If mana is below X, the effect does not fire. Multiple Sorcery effects resolve top to bottom.'},
  Hellbent:  {cls:'burn',      def:'This effect triggers only if the card is the last card in hand when played.'},
  Echo:      {cls:'echo',      def:'If this card is discarded, its Echo effect triggers.'},
  Churn:     {cls:'echo',      def:'Discard X random cards from hand, then draw X cards.'},
  Crit:      {cls:'hastened',  def:'A critical hit. Doubles the card\'s damage. On a card that deals no damage, it doubles the duration of the status applied instead.'},
  Compound:  {cls:'drain',     def:'Advance this card\'s Compound count. All copies of the card share one count. The bonus applies once per count. Counts reset each battle.'},
  Gift:      {cls:'drain',     def:'The opponent gains this card in their hand.'},

  // ── Card properties ──
  Ethereal:  {cls:'echo',      def:'This card vanishes when played or discarded. It does not return to the deck. Created temporarily by abilities.'},
  Conjured:  {cls:'echo',      def:'Created during combat. Circulates normally through the deck. Removed at end of battle.'},
  Banish:    {cls:'drain',     def:'When this card is played, it is removed for the rest of this battle. Permanent cards return next fight.'},
  Accrue:    {cls:'shielded',  def:'While this card is in hand, the listed value grows each time the trigger fires. Resets if it leaves hand unplayed.'},
  Drawn:     {cls:'echo',      def:'Fires once when this card is drawn into hand. Spent after — the line fades from the card.'},
  Manabound: {cls:'drain',     def:'This effect is purged immediately if the creature\'s mana hits 0. Applies to Shield, Dodge, Frenzy, Thorns, Haste.'},
  Debuff:    {cls:'cursed',    def:'Any negative status effect (Weaken, Poison, Burn, Slow, etc.).'},
};

// Replace [BracketWord] tokens in effect strings with styled keyword
// spans, and {{cardId}} tokens with hoverable card-reference spans.
// A {{cardId}} ref renders as the card's name and shows that card's
// full face on hover (see the card-ref-tip handler below) — used so
// card text can point at a conjured / created card.
function renderKeywords(text){
  if(text==null) return '';
  text=String(text).replace(/\{\{([A-Za-z0-9_]+)\}\}/g,function(match,cid){
    var c=(typeof CARDS!=='undefined')?CARDS[cid]:null;
    if(!c) return match;
    return '<span class="card-ref" data-card-ref="'+cid+'">'+c.name+'</span>';
  });
  return text.replace(/\[([A-Za-z]+)\]/g,function(match,word){
    var kw=KEYWORDS[word];
    if(!kw) return match;
    return '<span class="kw kw-'+kw.cls+'" data-kw="'+word+'">'+word+'</span>';
  });
}

// Tooltip — follows mouse, shown on .kw hover.
document.addEventListener('mouseover',function(e){
  var tip=document.getElementById('kw-tooltip');
  if(!tip) return;
  // Keyword glossary tooltip
  var el=e.target.closest('.kw[data-kw]');
  if(el){
    var kw=KEYWORDS[el.getAttribute('data-kw')];
    if(kw){
      tip.innerHTML='<strong>'+el.getAttribute('data-kw')+'</strong><br>'+kw.def;
      tip.classList.add('show');
      return;
    }
  }
  // Round 67r (bundled task B): formula breakdown on computed values.
  var fEl=e.target.closest('.stat-formula[data-formula]');
  if(fEl){
    tip.innerHTML='<strong>Formula</strong><br>'+fEl.getAttribute('data-formula');
    tip.classList.add('show');
    return;
  }
  tip.classList.remove('show');
});
document.addEventListener('mousemove',function(e){
  var tip=document.getElementById('kw-tooltip');
  if(tip&&tip.classList.contains('show')){
    // Round 67o: invert the #game-root scale so the tooltip lands at
    // the cursor in screen space — clientX/Y are real-viewport coords
    // but tip lives inside the scaled wrapper.
    var c = (typeof clientToGameCoords === 'function') ? clientToGameCoords(e.clientX, e.clientY) : { x:e.clientX, y:e.clientY };
    var dW = (typeof GAME_DESIGN_W === 'number') ? GAME_DESIGN_W : window.innerWidth;
    var dH = (typeof GAME_DESIGN_H === 'number') ? GAME_DESIGN_H : window.innerHeight;
    tip.style.left=Math.min(c.x+12,dW-200)+'px';
    tip.style.top=Math.min(c.y+12,dH-80)+'px';
  }
});
document.addEventListener('mouseout',function(e){
  var tip=document.getElementById('kw-tooltip');
  if(tip&&!e.target.closest('.kw[data-kw]')&&!e.target.closest('.stat-formula[data-formula]')) tip.classList.remove('show');
});

// Card-reference preview — hover a {{cardId}} ref to see the full card.
document.addEventListener('mouseover',function(e){
  var crTip=document.getElementById('card-ref-tip');
  if(!crTip) return;
  var el=e.target.closest('.card-ref[data-card-ref]');
  if(el){
    var cid=el.getAttribute('data-card-ref');
    if(typeof CARDS!=='undefined'&&CARDS[cid]&&typeof buildCardHTML==='function'){
      crTip.innerHTML='<div class="popup-card-wrap">'+buildCardHTML(cid,false)+'</div>';
      crTip.classList.add('show');
    }
  }
});
document.addEventListener('mousemove',function(e){
  var crTip=document.getElementById('card-ref-tip');
  if(crTip&&crTip.classList.contains('show')){
    var c=(typeof clientToGameCoords==='function')?clientToGameCoords(e.clientX,e.clientY):{x:e.clientX,y:e.clientY};
    var dW=(typeof GAME_DESIGN_W==='number')?GAME_DESIGN_W:window.innerWidth;
    var dH=(typeof GAME_DESIGN_H==='number')?GAME_DESIGN_H:window.innerHeight;
    crTip.style.left=Math.min(c.x+16,dW-168)+'px';
    crTip.style.top=Math.min(c.y+16,dH-224)+'px';
  }
});
document.addEventListener('mouseout',function(e){
  var crTip=document.getElementById('card-ref-tip');
  if(crTip&&!e.target.closest('.card-ref[data-card-ref]')) crTip.classList.remove('show');
});

// ════════════════════════════════════════════════════════════════
// CARDS — all card definitions
// ════════════════════════════════════════════════════════════════
// Fields: id, name, icon, type ('attack'|'defense'|'debuff'|'utility'),
//         unique (champion-only), champ (champion id or null),
//         statId (primary stat: 'str'|'agi'|'wis'|null), effect (display string).
// Card effects (what happens when played) live in data/card_effects.js.
// To add a new card: add its definition here, add its effect handler there.
// ════════════════════════════════════════════════════════════════

var CARDS = {
  // ── Universal basics ──
  // Strike / Brace are in every champion's starting deck via deckOrder.
  // Dead Weight pads unfilled deck slots automatically. Cards below
  // these three are universal but NOT in starting decks — players add
  // them via the deck editor's UNIVERSAL filter. Add new universals
  // here AND to UNIVERSAL_CARD_IDS in deck_builder.js.
  strike:      {id:'strike',      name:'Strike',        icon:'⚔️', type:'attack',  unique:false, champ:null,    statId:null,  effect:'Deal 18 damage.', effects:[{type:'dmg_conditional',base:18,hits:1}]},
  brace:       {id:'brace',       name:'Brace',         icon:'🛡', type:'defense', unique:false, champ:null,    statId:null,  effect:'Gain [Shield] 20 for 3s.', effects:[{type:'apply_status',status:'shield',target:'self',value:20,dur:3}]},
  filler:      {id:'filler',      name:'Dead Weight',   icon:'🪨', type:'utility', unique:false, champ:null,    statId:null,  effect:'[Sorcery] (all mana): Draw 1.', effects:[{type:'sorcery',cost:'all',effect:{type:'draw_cards',count:1}}]},
  // Round 67q: first non-starter universal. Simple [Haste] applicator —
  // a sliver of draw-speed for one breath. Tuned in the same ballpark
  // as champion haste effects (0.15-0.30 for 2-4s) but without the
  // damage / sorcery riders those carry, since this is a pure utility
  // card players can slot into any deck.
  quickstep:   {id:'quickstep',   name:'Quickstep',     icon:'💨', type:'utility', unique:false, champ:null,    statId:null,  effect:'Gain [Haste] 20% for 4s.', effects:[{type:'apply_status',status:'haste',target:'self',value:0.20,dur:4}]},

  // ── Starcaller Druid ──
  druid_void_bolt: {id:'druid_void_bolt', name:'Void Bolt', icon:'🔵', type:'attack', unique:true, champ:'druid', statId:'wis',
    effect:'Deal WIS÷2 damage.\n[Sorcery] [30]: [Churn] 1.\n[Echo]: Draw 1.',
    // Round 67q: bespoke FX — projectile-with-comet-trail in void accent.
    // Without this, the effect-driven router would fire a slash for the
    // dmg_conditional, which is the wrong shape for a ranged WIS bolt.
    fx: 'projectile_void',
    effects:[{type:'dmg_conditional',base:0,hits:1,stat:'wis',stat_div:2},{type:'sorcery',cost:30,effect:{type:'churn',count:1}}],
    onDiscard:[{type:'draw_cards',count:1}]},

  druid_star_shard: {id:'druid_star_shard', name:'Star Shard', icon:'✨', type:'attack', unique:true, champ:'druid', statId:'wis',
    effect:'Deal 8 damage. [Conjured] a copy.\n[Echo]: Purge all [Conjured]. Deal +2 per card purged.',
    effects:[{type:'dmg_conditional',base:8,hits:1},{type:'conjure_copy'}],
    onDiscard:[{type:'purge_conjured'},{type:'dmg_scaling',base:0,source:'purged_count',check:'self',mult:2}]},

  druid_nova_burst: {id:'druid_nova_burst', name:'Nova Burst', icon:'💫', type:'attack', unique:true, champ:'druid', statId:'wis',
    effect:'Deal 12 + 2 per card in hand damage.\n[Sorcery] [60]: [Churn] 3.',
    effects:[{type:'dmg_scaling',base:12,source:'hand_size',check:'self',mult:2},{type:'sorcery',cost:60,effect:{type:'churn',count:3}}]},


  // ── Vault Keeper (Shtole) — Compound ramp ──
  // The Sorcery is placed FIRST in effects[] so compound_advance bumps the
  // count before dmg_conditional reads it (display layering is separate
  // from array order). compoundDmg on dmg_conditional is the per-count bonus.
  vault_keeper_treasure: {id:'vault_keeper_treasure', name:"Shtole's Treasure", icon:'💎', type:'attack', unique:true, champ:'vault_keeper', statId:'str',
    effect:'Deal 12 damage.\n[Sorcery] [25]: [Compound] +3 damage.',
    effects:[{type:'sorcery',cost:25,effect:{type:'compound_advance',show:'+3 damage'}},{type:'dmg_conditional',base:12,hits:1,compoundDmg:3}]},

  vault_keeper_appraise: {id:'vault_keeper_appraise', name:'Appraise', icon:'🔍', type:'utility', unique:true, champ:'vault_keeper', statId:'wis',
    effect:'Draw 2. Gain 20 mana.',
    effects:[{type:'draw_cards',count:2},{type:'gain_mana',amt:20}]},

  vault_keeper_lockbox: {id:'vault_keeper_lockbox', name:'Lockbox', icon:'🔒', type:'defense', unique:true, champ:'vault_keeper', statId:'str',
    effect:'Gain [Shield] 16 for 3s.\n[Sorcery] [15]: Draw 1.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:16,dur:3},{type:'sorcery',cost:15,effect:{type:'draw_cards',count:1}}]},


  // ── Bestiary Archivist (Hoot) — distributed Compound scaling ──
  // Each card is a Compound card: Sorcery first in effects[] so the
  // count advances before the main effect reads it.
  hoot_archivist_cross_examine: {id:'hoot_archivist_cross_examine', name:'Cross-Examine', icon:'🔎', type:'attack', unique:true, champ:'hoot_archivist', statId:'wis',
    effect:'Deal 6 damage.\n[Sorcery] [25]: [Compound] +1 hit.',
    effects:[{type:'sorcery',cost:25,effect:{type:'compound_advance',show:'+1 hit'}},{type:'dmg_conditional',base:6,hits:1,compoundHits:1}]},

  hoot_archivist_speed_read: {id:'hoot_archivist_speed_read', name:'Speed Read', icon:'📖', type:'utility', unique:true, champ:'hoot_archivist', statId:'agi',
    effect:'Gain [Haste] 15% for 4s.\n[Sorcery] [25]: [Compound] +[Haste] 5%.',
    effects:[{type:'sorcery',cost:25,effect:{type:'compound_advance',show:'+[Haste] 5%'}},{type:'apply_status',status:'haste',target:'self',value:0.15,dur:4,compoundVal:0.05}]},

  hoot_archivist_hardbound: {id:'hoot_archivist_hardbound', name:'Hardbound', icon:'📕', type:'defense', unique:true, champ:'hoot_archivist', statId:'str',
    effect:'Gain [Shield] 14 for 3s.\n[Sorcery] [25]: [Compound] +[Shield] 4.',
    effects:[{type:'sorcery',cost:25,effect:{type:'compound_advance',show:'+[Shield] 4'}},{type:'apply_status',status:'shield',target:'self',value:14,dur:3,compoundVal:4}]},


  // ── Forge Blacksmith (M'bur) — universal card mastery ──
  // Whetstone stamps item._dmgBuff on attack cards in hand (consumed
  // on play); Tempered Edge (innate) gives universals a Draw-1 cantrip.
  blacksmith_hammer_out: {id:'blacksmith_hammer_out', name:'Hammer Out', icon:'🔨', type:'utility', unique:true, champ:'blacksmith', statId:'str',
    effect:'Create 3 [Ethereal] {{strike}}s.',
    effects:[{type:'create_card_in_hand',cardId:'strike',target:'self',ghost:true,count:3}]},

  blacksmith_reforge: {id:'blacksmith_reforge', name:'Reforge', icon:'♻️', type:'utility', unique:true, champ:'blacksmith', statId:'agi',
    effect:'[Churn] 2.\n[Sorcery] [15]: Draw 1.',
    effects:[{type:'churn',count:2},{type:'sorcery',cost:15,effect:{type:'draw_cards',count:1}}]},

  blacksmith_whetstone: {id:'blacksmith_whetstone', name:'Whetstone', icon:'🗡️', type:'utility', unique:true, champ:'blacksmith', statId:'str',
    effect:'Attack cards in hand: +2 damage (next play).\n[Sorcery] [25]: +3 damage.',
    effects:[{type:'buff_hand_attacks',amt:2},{type:'sorcery',cost:25,effect:{type:'buff_hand_attacks',amt:3}}]},


  // ── The Merchant — crit chain / conjure engine ──
  // Markup (innate) conjures escalating-crit Banish copies on crit.
  // Insurance uses the `accrue` field — read by _markupOnCrit (bumps
  // item._accrue per crit) and resolveCardEffects (adds it to Shield).
  merchant_loose_change: {id:'merchant_loose_change', name:'Loose Change', icon:'🪙', type:'attack', unique:true, champ:'merchant', statId:'wis',
    effect:'Deal 3 + WIS÷5 damage × 3 hits.\n[Sorcery] [20]: +1 hit.\n[Crit]: 12%.',
    effects:[{type:'sorcery',cost:20,effect:{type:'bonus_hits',amount:1}},{type:'dmg_conditional',base:3,hits:3,stat:'wis',stat_div:5,crit:12}]},

  merchant_insurance: {id:'merchant_insurance', name:'Insurance', icon:'📜', type:'defense', unique:true, champ:'merchant', statId:'str',
    effect:'Gain [Shield] 12 for 3s.\n[Accrue] [Crit]: +[Shield] 2.',
    accrue:{trigger:'crit',target:'shield',per:2},
    effects:[{type:'apply_status',status:'shield',target:'self',value:12,dur:3}]},

  merchant_rush_order: {id:'merchant_rush_order', name:'Rush Order', icon:'⏱️', type:'utility', unique:true, champ:'merchant', statId:'agi',
    effect:'Gain [Haste] 25% for 1s.\n[Crit]: 12%.',
    effects:[{type:'apply_status',status:'haste',target:'self',value:0.25,dur:1,crit:12}]},


  // ── Guild Girl (Leona) — bomb layer / tempo denial ──
  // Rigged Contract is a created bomb (ethereal:true -> drawn as a ghost).
  // It deals 12 to its holder on play (effects) and on discard (onDiscard).
  rigged_contract: {id:'rigged_contract', name:'Rigged Contract', icon:'💣', type:'utility', unique:false, champ:null, statId:null,
    ethereal:true,
    effect:'Deal 12 damage to self.\n[Echo]: Deal 12 damage to self.\n[Ethereal].',
    effects:[{type:'dmg_self',amt:12}],
    onDiscard:[{type:'dmg_self',amt:12}]},

  guild_girl_bounty_order: {id:'guild_girl_bounty_order', name:'Bounty Order', icon:'📋', type:'utility', unique:true, champ:'guild_girl', statId:'agi',
    effect:'Create 2 {{rigged_contract}}s in the opponent\'s deck.',
    effects:[{type:'create_card_in_deck',cardId:'rigged_contract',target:'opponent',count:2}]},

  guild_girl_fine_print: {id:'guild_girl_fine_print', name:'Fine Print', icon:'✒️', type:'attack', unique:true, champ:'guild_girl', statId:'agi',
    effect:'Deal 8 damage.\nCreate 1 {{rigged_contract}} in the opponent\'s deck.',
    effects:[{type:'dmg_conditional',base:8,hits:1},{type:'create_card_in_deck',cardId:'rigged_contract',target:'opponent',count:1}]},

  guild_girl_retainer_fee: {id:'guild_girl_retainer_fee', name:'Retainer Fee', icon:'💵', type:'utility', unique:true, champ:'guild_girl', statId:'wis',
    effect:'Apply [Haste] 20% to both for 4s.\n[Drawn]: Gain 5 mana.',
    effects:[{type:'apply_status',status:'haste',target:'both',value:0.20,dur:4}],
    onDraw:[{type:'gain_mana',amt:5}]},


  // ── Cursed Paladin ──
  paladin_smite: {id:'paladin_smite', name:'Smite', icon:'🔥', type:'attack', unique:true, champ:'paladin', statId:'str',
    effect:'Deal 10+STR÷4 damage.\n[Accrue] [Burn]: +[Crit] 5%.\n[Crit]: 15%.',
    accrue:{trigger:'burn',target:'crit',per:5},
    effects:[{type:'dmg_conditional',base:10,hits:1,crit:15,stat:'str',stat_div:4}]},

  paladin_consecrate: {id:'paladin_consecrate', name:'Consecrate', icon:'🕊️', type:'utility', unique:true, champ:'paladin', statId:'str',
    effect:'Apply [Burn] 5s.\n[Sorcery] [40]: Heal STR÷4.',
    effects:[{type:'apply_status',status:'burn',target:'opponent',value:2,dur:5},{type:'sorcery',cost:40,effect:{type:'heal',amt:0,stat:'str',stat_div:4}}]},

  paladin_aegis: {id:'paladin_aegis', name:'Aegis', icon:'🛡️', type:'defense', unique:true, champ:'paladin', statId:'str',
    effect:'Gain [Shield] STR 3s.\n[Sorcery] [40]: [Weaken] 6s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:0,stat:'str',stat_div:1,dur:3},{type:'sorcery',cost:40,effect:{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:6}}]},

  // ── Faceless Thief ──
  thief_quick_slash: {id:'thief_quick_slash', name:'Quick Slash', icon:'⚡', type:'attack', unique:true, champ:'thief', statId:'agi',
    effect:'Deal 8 damage × 2 hits. [Crit]: 15%.',
    effects:[{type:'dmg_conditional',base:8,hits:2,crit:15}]},

  thief_poison_dart: {id:'thief_poison_dart', name:'Poison Dart', icon:'🎯', type:'attack', unique:true, champ:'thief', statId:'agi',
    effect:'Deal 10+AGI÷4 damage. Apply [Poison] 1 8s.',
    effects:[{type:'dmg_conditional',base:10,hits:1,stat:'agi',stat_div:4},{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}]},

  thief_shadow_step: {id:'thief_shadow_step', name:'Shadow Step', icon:'👣', type:'utility', unique:true, champ:'thief', statId:'agi',
    effect:'[Weaken] 6s.\n[Sorcery] [25]: Apply [Poison] 1 8s.',
    effects:[{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:6},{type:'sorcery',cost:25,effect:{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}}]},

  //   Backstab: [Debuff] on enemy: deal 33 additional damage — condition syntax needs crit system
  //   Death Mark: Apply [Vulnerable] for 6s — clean once explanation line removed
  //   Flicker: remove entirely, weak design
  //   Shadow Step Dodge: Dodge concept belongs on an unlock card with room to be interesting

  // ── Giant Rat ──
  rat_gnaw:   {id:'rat_gnaw',   name:'Gnaw',   icon:'🐀', type:'attack',  unique:true, champ:'rat', statId:'agi',
    effect:'Deal 10 damage. Apply [Poison] 2.',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}]},
  rat_slash:  {id:'rat_slash',  name:'Slash',  icon:'⚡', type:'attack',  unique:true, champ:'rat', statId:'agi',
    effect:'Deal 13+AGI÷4 damage. [Crit]: 15%.',
    effects:[{type:'dmg_conditional',base:13,hits:1,crit:15,stat:'agi',stat_div:4}]},
  rat_dart:   {id:'rat_dart',   name:'Dart',   icon:'💨', type:'utility', unique:true, champ:'rat', statId:'agi',
    effect:'[Haste] 20% 3s.\n[Sorcery] [35]: Next attack card: +[Crit] 5%.',
    effects:[{type:'apply_status',status:'haste',target:'self',value:0.20,dur:3},{type:'sorcery',cost:35,effect:{type:'modify_cards',source:'rat_dart',filter:{type:'attack'},where:'hand',scope:'next_play',changes:[{field:'crit',delta:5}]}}]},

  // ── Goblin Scavenger ──
  goblin_jab:        {id:'goblin_jab',        name:'Jab',        icon:'🗡️', type:'attack', unique:true, champ:'goblin', statId:'str',
    effect:'Deal 10+WIS÷4 damage.\n[Sorcery] [35]: [Weaken] 4s.',
    effects:[{type:'dmg_conditional',base:10,hits:1,stat:'wis',stat_div:4},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4}}]},
  goblin_brace:      {id:'goblin_brace',      name:'Hunker',     icon:'🛡️', type:'defense', unique:true, champ:'goblin', statId:'str',
    effect:'Gain [Shield] STR+5 3s.\n[Sorcery] [35]: [Weaken] 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:5,stat:'str',stat_div:1,dur:3},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4}}]},
  goblin_cheap_shot: {id:'goblin_cheap_shot', name:'Cheap Shot', icon:'👺', type:'attack', unique:true, champ:'goblin', statId:'agi',
    effect:'Deal 5 damage × 3 hits.\n[Debuff] on enemy: [Crit] 50%.',
    effects:[{type:'dmg_conditional',base:5,hits:3,condition:'has_debuff',on_true:'crit',on_true_val:50}]},

  // ── Squanchback ──
  squanchback_bristle:    {id:'squanchback_bristle',    name:'Bristle',    icon:'🦔', type:'utility', unique:true, champ:'squanchback', statId:'str',
    effect:'Apply 6 [Thorns] 4s.',
    effects:[{type:'apply_status',status:'thorns',target:'self',value:6,dur:4}]},
  squanchback_shell_slam: {id:'squanchback_shell_slam', name:'Shell Slam', icon:'👊', type:'attack',  unique:true, champ:'squanchback', statId:'str',
    effect:'Deal 10 damage. Gain [Shield] 12 3s.',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'apply_status',status:'shield',target:'self',value:12,dur:3}]},
  squanchback_spine_lash: {id:'squanchback_spine_lash', name:'Spine Lash', icon:'🦷', type:'attack',  unique:true, champ:'squanchback', statId:'str',
    effect:'Deal 8 damage.\n[Sorcery] [30]: Deal [Shield] additional damage.',
    effects:[{type:'dmg_conditional',base:8,hits:1},{type:'sorcery',cost:30,effect:{type:'dmg_scaling',base:0,source:'shield',check:'self',mult:1}}]},
  squanchback_spite:      {id:'squanchback_spite',      name:'Spite',      icon:'💢', type:'attack',  unique:false, champ:'squanchback', statId:'str',
    effect:'Deal missing HP ÷ 3 damage. [Ethereal].',
    effects:[{type:'dmg_scaling',base:0,source:'missing_hp',check:'self',mult:1,stat_div:3}]},

  // ── Slime ──
  slime_dissolve: {id:'slime_dissolve', name:'Dissolve', icon:'🟢', type:'attack', unique:true, champ:'slime', statId:'wis',
    effect:'Deal 4+WIS÷4+AGI÷4 damage.\n[Sorcery] [30]: [Haste] 20% 3s.',
    effects:[{type:'dmg_conditional',base:4,hits:1,stat:'wis',stat_div:4,stat2:'agi',stat2_div:4},{type:'sorcery',cost:30,effect:{type:'apply_status',status:'haste',target:'self',value:0.20,dur:3}}]},
  slime_split:   {id:'slime_split',   name:'Split',   icon:'💧', type:'utility', unique:true, champ:'slime', statId:'wis',
    effect:'Copy a random card in hand.\n[Sorcery] [25]: Copy the same card again.',
    effects:[{type:'copy_hand_card'},{type:'sorcery',cost:25,effect:{type:'copy_last_copied'}}]},
  slime_catalyse:{id:'slime_catalyse', name:'Catalyse', icon:'⚗️', type:'utility', unique:true, champ:'slime', statId:'wis',
    effect:'Reduce [Sorcery] costs by 50%.',
    effects:[{type:'sorcery_discount',mult:0.5}]},

  // ── Wolf ──
  wolf_bite:  {id:'wolf_bite',  name:'Bite',  icon:'🐺', type:'attack',  unique:true, champ:'wolf', statId:'agi',
    effect:'Deal 7+AGI÷4 damage × 2 hits.',
    effects:[{type:'dmg_conditional',base:7,hits:2,stat:'agi',stat_div:4}]},
  wolf_lunge: {id:'wolf_lunge', name:'Lunge', icon:'💨', type:'attack',  unique:true, champ:'wolf', statId:'agi',
    effect:'Deal 14 damage. [Haste] 15% 3s.',
    effects:[{type:'dmg_conditional',base:14,hits:1},{type:'apply_status',status:'haste',target:'self',value:0.15,dur:3}]},
  wolf_howl:  {id:'wolf_howl',  name:'Howl',  icon:'🌙', type:'utility', unique:true, champ:'wolf', statId:'agi',
    effect:'[Haste] 30% 4s.\n[Sorcery] [40]: Next attack: +[Crit] 15%.',
    effects:[{type:'apply_status',status:'haste',target:'self',value:0.30,dur:4},{type:'sorcery',cost:40,effect:{type:'modify_cards',source:'wolf_howl',filter:{type:'attack'},where:'hand',scope:'next_play',changes:[{field:'crit',delta:15}]}}]},

  // ── Swamp Snake ──
  snake_fang: {id:'snake_fang', name:'Fang', icon:'🐍', type:'attack', unique:true, champ:'snake', statId:'agi',
    effect:'Deal 14 damage. [Crit]: 15%.',
    effects:[{type:'dmg_conditional',base:14,hits:1,crit:15}]},
  snake_coil: {id:'snake_coil', name:'Coil', icon:'🛡️', type:'defense', unique:true, champ:'snake', statId:'agi',
    effect:'Gain [Shield] 12 for 4s. Apply [Slow] for 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:12,dur:3},{type:'apply_status',status:'slow',target:'opponent',value:0.5,dur:4}]},
  snake_spit: {id:'snake_spit', name:'Spit', icon:'💧', type:'attack', unique:true, champ:'snake', statId:'wis',
    effect:'Deal 10 damage.\n[Sorcery] [35]: Apply [Poison] 2.',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}}]},

  // ── Corrupted Bloom ──
  bloom_vine_lash: {id:'bloom_vine_lash', name:'Vine Lash', icon:'🌿', type:'attack', unique:true, champ:'bloom', statId:'str',
    effect:'Deal 10 + hand size × 2 damage.\n[Sorcery] [30]: Create [Ethereal] {{corrupt_spore}}.',
    effects:[{type:'dmg_scaling',base:10,source:'hand_size',check:'self',mult:2},{type:'sorcery',cost:30,effect:{type:'create_card_in_hand',cardId:'corrupt_spore',target:'self',ghost:true}}]},
  bloom_rot_guard: {id:'bloom_rot_guard', name:'Rot Guard', icon:'🛡️', type:'defense', unique:true, champ:'bloom', statId:'str',
    effect:'Gain [Shield] 16 3s.\n[Sorcery] [25]: [Churn] 1.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:16,dur:3},{type:'sorcery',cost:25,effect:{type:'churn',count:1}}]},
  bloom_wilt: {id:'bloom_wilt', name:'Wilt', icon:'🥀', type:'attack', unique:true, champ:'bloom', statId:'str',
    effect:'Apply [Poison] 1. Discard 3.\n[Echo]: Apply [Poison] 2.',
    effects:[{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8},{type:'discard_own',count:3}],
    onDiscard:[{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}]},

  // ── Spore Puff ──
  sporepuff_spore_shot: {id:'sporepuff_spore_shot', name:'Spore Shot', icon:'🍄', type:'attack', unique:true, champ:'sporepuff', statId:'agi',
    effect:'Deal 12 damage.\n[Sorcery] [30]: [Churn] 1.',
    effects:[{type:'dmg_conditional',base:12,hits:1},{type:'sorcery',cost:30,effect:{type:'churn',count:1}}]},
  sporepuff_puff: {id:'sporepuff_puff', name:'Puff', icon:'💨', type:'utility', unique:true, champ:'sporepuff', statId:'agi',
    effect:'[Weaken] 4s.\n[Sorcery] [30]: [Churn] 1.\n[Echo]: Apply [Poison] 1.',
    effects:[{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4},{type:'sorcery',cost:30,effect:{type:'churn',count:1}}],
    onDiscard:[{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}]},
  sporepuff_burst: {id:'sporepuff_burst', name:'Burst', icon:'💥', type:'attack', unique:true, champ:'sporepuff', statId:'agi',
    effect:'Deal 6 damage × 2 hits.\n[Debuff] on enemy: [Crit] 25%.',
    effects:[{type:'dmg_conditional',base:6,hits:2,condition:'has_debuff',on_true:'crit',on_true_val:25}]},

  // ── Mycelid ──
  mycelid_fungal_slam: {id:'mycelid_fungal_slam', name:'Fungal Slam', icon:'🍄', type:'attack', unique:true, champ:'mycelid', statId:'str',
    effect:'Deal 14 damage.\n[Sorcery] [35]: Apply [Poison] 2.',
    effects:[{type:'dmg_conditional',base:14,hits:1},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}}]},
  mycelid_spore_guard: {id:'mycelid_spore_guard', name:'Spore Guard', icon:'🛡️', type:'defense', unique:true, champ:'mycelid', statId:'str',
    effect:'Gain [Shield] 12 3s.\n[Sorcery] [35]: Apply [Poison] 1.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:12,dur:3},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}}]},
  mycelid_decompose: {id:'mycelid_decompose', name:'Decompose', icon:'☠️', type:'attack', unique:true, champ:'mycelid', statId:'wis',
    effect:'Deal 8 damage. Apply [Poison] WIS ÷ 4.',
    effects:[{type:'dmg_conditional',base:8,hits:1},{type:'apply_status',status:'poison',target:'opponent',value:0,stat:'wis',stat_div:4,dur:8}]},

  // ── Sewer Zombie ──
  zombie_pummel: {id:'zombie_pummel', name:'Pummel', icon:'🧟', type:'attack', unique:true, champ:'zombie', statId:'str',
    effect:'Deal 7 damage × 2 hits.\n[Sorcery] [35]: Mana Burn 10.',
    effects:[{type:'dmg_conditional',base:7,hits:2},{type:'sorcery',cost:35,effect:{type:'mana_burn',value:10}}]},
  zombie_devour: {id:'zombie_devour', name:'Devour', icon:'🦷', type:'attack', unique:true, champ:'zombie', statId:'str',
    effect:'Deal 10+STR÷4 damage.\nBelow 50% HP: [Crit] 50%.',
    effects:[{type:'dmg_conditional',base:10,hits:1,stat:'str',stat_div:4,condition:'below_50_hp',on_true:'crit',on_true_val:50}]},
  zombie_mend:  {id:'zombie_mend',  name:'Mend',  icon:'💀', type:'utility', unique:true, champ:'zombie', statId:'wis',
    effect:'Heal 5.\n[Sorcery] [45]: Cleanse all debuffs.',
    effects:[{type:'heal',amt:5},{type:'sorcery',cost:45,effect:{type:'cleanse',target:'self',what:'all_debuffs'}}]},

  // ── Drain Lurker ──
  lurker_lash:  {id:'lurker_lash',  name:'Lash',  icon:'🐊', type:'attack',  unique:true, champ:'drain_lurker', statId:'str',
    effect:'Deal 8+STR÷4 damage. Gain [Shield] 10 3s.',
    effects:[{type:'dmg_conditional',base:8,hits:1,stat:'str',stat_div:4},{type:'apply_status',status:'shield',target:'self',value:10,dur:3}]},
  lurker_crush: {id:'lurker_crush', name:'Crush', icon:'💥', type:'attack',  unique:true, champ:'drain_lurker', statId:'str',
    effect:'Deal 2× enemy [Shield] damage.\n[Sorcery] [35]: Next attack: +[Crit] 15%.',
    effects:[{type:'dmg_scaling',base:0,source:'shield',check:'opponent',mult:2},{type:'sorcery',cost:35,effect:{type:'modify_cards',source:'lurker_crush',filter:{type:'attack'},where:'hand',scope:'next_play',changes:[{field:'crit',delta:15}]}}]},
  lurker_coil:  {id:'lurker_coil',  name:'Coil',  icon:'🛡️', type:'defense', unique:true, champ:'drain_lurker', statId:'str',
    effect:'Gain [Shield] 14 3s. [Slow] 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:14,dur:3},{type:'apply_status',status:'slow',target:'opponent',value:0.5,dur:4}]},

  // ── Bandit ──
  bandit_shiv:       {id:'bandit_shiv',       name:'Shiv',       icon:'🗡️', type:'attack',  unique:true, champ:'bandit', statId:'agi',
    effect:'Deal 6 damage × 3 hits. [Crit]: 10%.\n[Echo]: Deal 6 damage × 2 hits.',
    effects:[{type:'dmg_conditional',base:6,hits:3,crit:10}],
    onDiscard:[{type:'dmg_conditional',base:6,hits:2}]},
  bandit_ransack:    {id:'bandit_ransack',    name:'Ransack',    icon:'💰', type:'attack',  unique:true, champ:'bandit', statId:'agi',
    effect:'Deal 8 damage.\n[Sorcery] [35]: Deal +1 per discarded card.',
    effects:[{type:'dmg_conditional',base:8,hits:1},{type:'sorcery',cost:35,effect:{type:'dmg_scaling',base:0,source:'discard_size',check:'self',mult:1}}]},
  bandit_smoke_bomb: {id:'bandit_smoke_bomb', name:'Smoke Bomb', icon:'💨', type:'utility', unique:true, champ:'bandit', statId:'agi',
    effect:'Apply [Weaken] for 4s. [Churn] 1.\n[Echo]: Draw 1 card.',
    effects:[{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4},{type:'churn',count:1}],
    onDiscard:[{type:'draw_cards',count:1}]},


  // ── Corrupted Bloom (created by innate) ──
  corrupt_spore: {id:'corrupt_spore', name:'Corrupt Spore', icon:'🌺', type:'utility',
    unique:false, champ:'bloom', statId:null,
    effect:'Apply [Weaken] for 4s. [Ethereal]',
    effects:[{type:'apply_status', status:'weaken', target:'opponent', value:1, dur:4}]},

  // ── Iron Sentinel ──
  sentinel_iron_wall: {id:'sentinel_iron_wall', name:'Iron Wall', icon:'🛡️', type:'defense',
    unique:false, champ:'iron_sentinel', statId:'str',
    effect:'Gain [Shield] 10+STR÷3 3s.\n[Sorcery] [35]: +[Shield] 10.',
    effects:[{type:'apply_status', status:'shield', target:'self', value:10, stat:'str', stat_div:3, dur:3},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'shield',target:'self',value:10,dur:3}}]},
  sentinel_wrath: {id:'sentinel_wrath', name:"Sentinel's Wrath", icon:'💥', type:'attack',
    unique:false, champ:'iron_sentinel', statId:'str',
    effect:'Deal 12 damage.\nBelow 50% HP: deal 20 damage.',
    effects:[{type:'dmg_conditional', base:12, hits:1, check:'self', condition:'below_50_hp', on_true:'bonus_dmg', on_true_val:8}]},
  sentinel_purge: {id:'sentinel_purge', name:'Purge', icon:'✨', type:'defense',
    unique:false, champ:'iron_sentinel', statId:'wis',
    effect:'[Sorcery] [40]: Cleanse all debuffs. Gain [Shield] 10 3s.',
    effects:[{type:'sorcery',cost:40,effects:[{type:'cleanse',target:'self',what:'all_debuffs'},{type:'apply_status',status:'shield',target:'self',value:10,dur:3}]}]},

  // ── Raider ──
  raider_rummage: {id:'raider_rummage', name:'Rummage', icon:'🪙', type:'utility',
    unique:false, champ:'raider', statId:'wis',
    effect:'[Sorcery] [40]: Create [Ethereal] {{raider_plundered_goods}}. [Gift] [Ethereal] {{raider_rusty_junk}}.',
    effects:[{type:'sorcery',cost:40,effects:[
      {type:'create_card_in_hand', cardId:'raider_plundered_goods', target:'self', ghost:true},
      {type:'create_card_in_hand', cardId:'raider_rusty_junk', target:'opponent', ghost:true}]}]},
  raider_flurry: {id:'raider_flurry', name:'Flurry', icon:'⚔️', type:'attack',
    unique:false, champ:'raider', statId:'agi',
    effect:'Deal 6 damage × 2 hits.\n[Sorcery] [30]: [Haste] 15% 3s.',
    effects:[
      {type:'dmg_conditional', base:6, hits:2},
      {type:'sorcery',cost:30,effect:{type:'apply_status', status:'haste', target:'self', value:0.15, dur:3}}]},
  raider_hunker: {id:'raider_hunker', name:'Hunker', icon:'🛡️', type:'defense',
    unique:false, champ:'raider', statId:'agi',
    effect:'Gain [Shield] 12 3s. [Churn] 1.',
    effects:[
      {type:'apply_status', status:'shield', target:'self', value:12, dur:3},
      {type:'churn', count:1}]},
  raider_plundered_goods: {id:'raider_plundered_goods', name:'Plundered Goods', icon:'💰', type:'attack',
    unique:false, champ:'raider', statId:'agi',
    effect:'Deal hand size × 6 damage.\n[Haste] 15% 3s.\n[Ethereal].',
    effects:[
      {type:'dmg_scaling', base:0, source:'hand_size', check:'self', mult:6},
      {type:'apply_status', status:'haste', target:'self', value:0.15, dur:3}]},
  raider_rusty_junk: {id:'raider_rusty_junk', name:'Rusty Junk', icon:'🗑️', type:'utility',
    unique:false, champ:'raider', statId:'wis',
    effect:'[Sorcery] [30]: [Haste] 10% 2s. [Ethereal].',
    effects:[{type:'sorcery',cost:30,effect:{type:'apply_status', status:'haste', target:'self', value:0.10, dur:2}}]},

  // ── Kaine (creature id: sanctum_keeper) ──
  // Slow STR/WIS bruiser. Rend/Bulwark apply [Bleed] on [Drawn];
  // Grind churns the hand to re-fire them. Hemorrhage (innate aura)
  // scales every Bleed Kaine applies off STR.
  sanctum_keeper_rend: {id:'sanctum_keeper_rend', name:'Rend', icon:'🪓', type:'attack', unique:true, champ:'sanctum_keeper', statId:'str',
    effect:'Deal 14 + STR÷4 damage.\n[Drawn]: Apply [Bleed] 4 3s.',
    effects:[{type:'dmg_conditional',base:14,hits:1,stat:'str',stat_div:4}],
    onDraw:[{type:'apply_status',status:'bleed',target:'opponent',value:4,dur:3}]},

  sanctum_keeper_grind: {id:'sanctum_keeper_grind', name:'Grind', icon:'🌀', type:'utility', unique:true, champ:'sanctum_keeper', statId:'wis',
    effect:'[Churn] 2.\n[Sorcery] [25]: Apply [Bleed] 4 3s.',
    effects:[{type:'churn',count:2},{type:'sorcery',cost:25,effect:{type:'apply_status',status:'bleed',target:'opponent',value:4,dur:3}}]},

  sanctum_keeper_bulwark: {id:'sanctum_keeper_bulwark', name:'Bulwark', icon:'🛡', type:'defense', unique:true, champ:'sanctum_keeper', statId:'str',
    effect:'Gain [Shield] STR÷2 3s.\n[Drawn]: Apply [Bleed] 4 3s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:0,stat:'str',stat_div:2,dur:3}],
    onDraw:[{type:'apply_status',status:'bleed',target:'opponent',value:4,dur:3}]},

  // ── Groll (Deeproot) ──
  // Stone-monk elemental. Slow STR/WIS, Churn-focused with Stun secondary.
  // Tending innate (+1 to all Churn) compounds the engine; Granite Fist's
  // [Echo] spawns an [Ethereal] Granite Shard — the cheap stun follow-up.
  groll_granite_fist: {id:'groll_granite_fist', name:'Granite Fist', icon:'✊', type:'attack', unique:true, champ:'groll', statId:'str',
    effect:'Deal 12 + STR÷4 damage.\n[Echo]: Create [Ethereal] {{groll_granite_shard}}.',
    effects:[{type:'dmg_conditional',base:12,hits:1,stat:'str',stat_div:4}],
    onDiscard:[{type:'create_card_in_hand',cardId:'groll_granite_shard',target:'self',ghost:true}]},

  groll_resonance: {id:'groll_resonance', name:'Resonance', icon:'🔔', type:'utility', unique:true, champ:'groll', statId:'wis',
    effect:'[Churn] 2.\n[Sorcery] [25]: Apply [Stun].',
    effects:[{type:'churn',count:2},{type:'sorcery',cost:25,effect:{type:'apply_status',status:'stun',target:'opponent'}}]},

  groll_stonewall: {id:'groll_stonewall', name:'Stonewall', icon:'🧱', type:'defense', unique:true, champ:'groll', statId:'str',
    effect:'Gain [Shield] 8 + STR÷2 for 3s.\n[Drawn]: Gain [Shield] 3.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:8,stat:'str',stat_div:2,dur:3}],
    onDraw:[{type:'apply_status',status:'shield',target:'self',value:3,dur:3}]},

  // Conjured-only — Granite Fist's [Echo] creates this on discard.
  groll_granite_shard: {id:'groll_granite_shard', name:'Granite Shard', icon:'🪨', type:'utility', unique:true, champ:'groll', statId:'wis',
    effect:'[Sorcery] [10]: Apply [Stun].\n[Ethereal].',
    effects:[{type:'sorcery',cost:10,effect:{type:'apply_status',status:'stun',target:'opponent'}}]},

  // ── Tree Sprite (Deeproot) ──
  // Squishy WIS spirit. Every base play conjures an [Ethereal] Echo;
  // each Echo Sorcery'd repeats the base effect + Sap (Mana Burn 10).
  // Base deck is never ethereal — convention respected.
  tree_sprite_flicker: {id:'tree_sprite_flicker', name:'Flicker', icon:'✨', type:'attack', unique:true, champ:'tree_sprite', statId:'wis',
    effect:'Deal WIS÷2 damage × 2 hits.\nCreate [Ethereal] {{tree_sprite_flicker_echo}}.',
    effects:[
      {type:'dmg_conditional',base:0,hits:2,stat:'wis',stat_div:2},
      {type:'create_card_in_hand',cardId:'tree_sprite_flicker_echo',target:'self',ghost:true}]},

  tree_sprite_wither: {id:'tree_sprite_wither', name:'Wither', icon:'🍂', type:'utility', unique:true, champ:'tree_sprite', statId:'wis',
    effect:'Mana Burn 10 + WIS÷4.\nCreate [Ethereal] {{tree_sprite_wither_echo}}.',
    effects:[
      {type:'mana_burn',value:10,stat:'wis',stat_div:4},
      {type:'create_card_in_hand',cardId:'tree_sprite_wither_echo',target:'self',ghost:true}]},

  tree_sprite_phase: {id:'tree_sprite_phase', name:'Phase', icon:'🌀', type:'defense', unique:true, champ:'tree_sprite', statId:'wis',
    effect:'Apply [Weaken] for 4s.\nCreate [Ethereal] {{tree_sprite_phase_echo}}.',
    effects:[
      {type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4},
      {type:'create_card_in_hand',cardId:'tree_sprite_phase_echo',target:'self',ghost:true}]},

  // Conjured-only — born from the base cards' Create lines.
  tree_sprite_flicker_echo: {id:'tree_sprite_flicker_echo', name:'Flicker Echo', icon:'✨', type:'attack', unique:true, champ:'tree_sprite', statId:'wis',
    effect:'[Sorcery] [20]: Deal WIS÷2 damage × 2 hits.\n[Ethereal].',
    effects:[{type:'sorcery',cost:20,effect:{type:'dmg_conditional',base:0,hits:2,stat:'wis',stat_div:2}}]},

  tree_sprite_wither_echo: {id:'tree_sprite_wither_echo', name:'Wither Echo', icon:'🍂', type:'utility', unique:true, champ:'tree_sprite', statId:'wis',
    effect:'[Sorcery] [20]: Mana Burn 10 + WIS÷4.\n[Ethereal].',
    effects:[{type:'sorcery',cost:20,effect:{type:'mana_burn',value:10,stat:'wis',stat_div:4}}]},

  tree_sprite_phase_echo: {id:'tree_sprite_phase_echo', name:'Phase Echo', icon:'🌀', type:'defense', unique:true, champ:'tree_sprite', statId:'wis',
    effect:'[Sorcery] [20]: Apply [Weaken] for 4s.\n[Ethereal].',
    effects:[{type:'sorcery',cost:20,effect:{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4}}]},

  // ── Grub (Deeproot) ──
  // Common parasite. Relentless innate locks his draw speed — so the
  // self-stun riders on every card are a drawback only any non-Grub
  // user would actually feel. Cards are "balanced for anyone, free
  // for the Grub."
  grub_gnaw: {id:'grub_gnaw', name:'Gnaw', icon:'🦷', type:'attack', unique:true, champ:'grub', statId:'agi',
    effect:'Deal 6 + AGI÷4 damage.\nApply [Stun] to both.',
    effects:[
      {type:'dmg_conditional',base:6,hits:1,stat:'agi',stat_div:4},
      {type:'apply_status',status:'stun',target:'both'}]},

  grub_burrow: {id:'grub_burrow', name:'Burrow', icon:'🕳', type:'utility', unique:true, champ:'grub', statId:'wis',
    effect:'Apply [Stun] to both.\n[Sorcery] [20]: Apply [Slow] 50% for 3s.',
    effects:[
      {type:'apply_status',status:'stun',target:'both'},
      {type:'sorcery',cost:20,effect:{type:'apply_status',status:'slow',target:'opponent',value:0.5,dur:3}}]},

  grub_curl: {id:'grub_curl', name:'Curl', icon:'🌀', type:'defense', unique:true, champ:'grub', statId:'str',
    effect:'Gain [Shield] 6 + STR÷2 for 3s.\nApply [Stun] to both.',
    effects:[
      {type:'apply_status',status:'shield',target:'self',value:6,stat:'str',stat_div:2,dur:3},
      {type:'apply_status',status:'stun',target:'both'}]},

  // ── Infernal Beast ──
  infernal_strike: {id:'infernal_strike', name:'Infernal Strike', icon:'🔥', type:'attack',
    unique:false, champ:'infernal_beast', statId:'agi',
    effect:'Deal 8 damage × 2 hits.\n[Sorcery] [40]: Mana Burn 15.\n[Hellbent]: Apply [Burn] 5s.',
    effects:[
      {type:'dmg_conditional', base:8, hits:2},
      {type:'sorcery', cost:40, effect:{type:'mana_burn', value:15}},
      {type:'hellbent', effect:{type:'apply_status', status:'burn', target:'opponent', value:2, dur:5}}]},
  infernal_demon_bolt: {id:'infernal_demon_bolt', name:'Demon Bolt', icon:'⚡', type:'attack',
    unique:false, champ:'infernal_beast', statId:'wis',
    effect:'Deal 10 damage.\n[Sorcery] [45]: Mana Burn 20.\n[Hellbent]: Draw 2.',
    effects:[
      {type:'dmg_conditional', base:10, hits:1},
      {type:'sorcery', cost:45, effect:{type:'mana_burn', value:20}},
      {type:'hellbent', effect:{type:'draw_cards', count:2}}]},
  infernal_dark_pact: {id:'infernal_dark_pact', name:'Dark Pact', icon:'👁️', type:'utility',
    unique:false, champ:'infernal_beast', statId:'wis',
    effect:'Discard 3. [Weaken] 4s.\n[Sorcery] [35]: Mana Burn 15.\n[Hellbent]: Cleanse [Shield] (both).',
    effects:[
      {type:'discard_own', count:3},
      {type:'apply_status', status:'weaken', target:'opponent', value:1, dur:4},
      {type:'sorcery', cost:35, effect:{type:'mana_burn', value:15}},
      {type:'hellbent', effect:{type:'cleanse', target:'both', what:'shield'}}]},

  // ── Cultist (faction: cultist — self-sacrifice / WIS bleed) ──
  cultist_bloodletting: {id:'cultist_bloodletting', name:'Bloodletting', icon:'🩸', type:'attack', unique:true, champ:'cultist', statId:'wis',
    effects:[
      {type:'dmg_conditional', base:6, hits:1, stat:'wis', stat_div:4},
      {type:'apply_status', status:'bleed', target:'opponent', value:0, stat:'wis', stat_div:4, dur:3}]},
  cultist_hex_ward: {id:'cultist_hex_ward', name:'Hex Ward', icon:'🕯️', type:'utility', unique:true, champ:'cultist', statId:'wis',
    effects:[
      {type:'apply_status', status:'weaken', target:'opponent', value:1, dur:6},
      {type:'sorcery', cost:30, effect:{type:'apply_status', status:'shield', target:'self', value:0, stat:'wis', stat_div:2, dur:3}}]},
  cultist_sanguine_bolt: {id:'cultist_sanguine_bolt', name:'Sanguine Bolt', icon:'🔥', type:'attack', unique:true, champ:'cultist', statId:'wis',
    effects:[
      {type:'dmg_conditional', base:8, hits:1, stat:'wis', stat_div:4, condition:'has_debuff', check:'opponent', on_true:'bonus_dmg', on_true_val:6}]},
};

// Deck size = creature STR (same as max HP). Cards ARE health — small decks are fragile.
function creatureDeckSize(id){ var c=CREATURES[id]; if(!c) return 10; return c.baseStats.str; }

// CREATURE_DECKS legacy — active creatures now use deckOrder in creature files.
// buildCreatureDeck() in game.js generates decks from deckOrder + STR.
var CREATURE_DECKS = {};
