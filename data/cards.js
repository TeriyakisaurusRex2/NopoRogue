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
  Crit:      {cls:'hastened',  def:'A critical strike that deals double damage. Triggered by chance or special conditions.'},

  // ── Card properties ──
  Ethereal:  {cls:'echo',      def:'This card vanishes when played or discarded. It does not return to the deck. Created temporarily by abilities.'},
  Conjured:  {cls:'echo',      def:'Created during combat. Circulates normally through the deck. Removed at end of battle.'},
  Manabound: {cls:'drain',     def:'This effect is purged immediately if the creature\'s mana hits 0. Applies to Shield, Dodge, Frenzy, Thorns, Haste.'},
  Debuff:    {cls:'cursed',    def:'Any negative status effect (Weaken, Poison, Burn, Slow, etc.).'},
};

// Replace [BracketWord] tokens in effect strings with styled keyword spans.
function renderKeywords(text){
  return text.replace(/\[([A-Za-z]+)\]/g,function(match,word){
    var kw=KEYWORDS[word];
    if(!kw) return match;
    return '<span class="kw kw-'+kw.cls+'" data-kw="'+word+'">'+word+'</span>';
  });
}

// Tooltip — follows mouse, shown on .kw hover.
document.addEventListener('mouseover',function(e){
  var el=e.target.closest('.kw[data-kw]');
  var tip=document.getElementById('kw-tooltip');
  if(!tip) return;
  if(!el){ tip.classList.remove('show'); return; }
  var kw=KEYWORDS[el.getAttribute('data-kw')];
  if(!kw) return;
  tip.innerHTML='<strong>'+el.getAttribute('data-kw')+'</strong><br>'+kw.def;
  tip.classList.add('show');
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
  if(tip&&!e.target.closest('.kw[data-kw]')) tip.classList.remove('show');
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
  strike:      {id:'strike',      name:'Strike',        icon:'⚔️', type:'attack',  unique:false, champ:null,    statId:null,  effect:'Deal 18 damage.', effects:[{type:'dmg_conditional',base:18,hits:1}]},
  brace:       {id:'brace',       name:'Brace',         icon:'🛡', type:'defense', unique:false, champ:null,    statId:null,  effect:'Gain 20 [Shield] for 5s.', effects:[{type:'apply_status',status:'shield',target:'self',value:20,dur:5}]},
  filler:      {id:'filler',      name:'Dead Weight',   icon:'🪨', type:'utility', unique:false, champ:null,    statId:null,  effect:'[Sorcery] (all mana): Draw 1.', effects:[{type:'sorcery',cost:'all',effect:{type:'draw_cards',count:1}}]},

  // ── Starcaller Druid ──
  druid_void_bolt: {id:'druid_void_bolt', name:'Void Bolt', icon:'🔵', type:'attack', unique:true, champ:'druid', statId:'wis',
    effect:'Deal WIS÷2 damage.\n[Sorcery] [30]: [Churn] 1.\n[Echo]: Draw 1.',
    effects:[{type:'dmg_conditional',base:0,hits:1,stat:'wis',stat_div:2},{type:'sorcery',cost:30,effect:{type:'churn',count:1}}],
    onDiscard:[{type:'draw_cards',count:1}]},

  druid_star_shard: {id:'druid_star_shard', name:'Star Shard', icon:'✨', type:'attack', unique:true, champ:'druid', statId:'wis',
    effect:'Deal 8 damage. [Conjured] a copy.\n[Echo]: Purge all [Conjured]. Deal +2 per card purged.',
    effects:[{type:'dmg_conditional',base:8,hits:1},{type:'conjure_copy'}],
    onDiscard:[{type:'purge_conjured'},{type:'dmg_scaling',base:0,source:'purged_count',check:'self',mult:2}]},

  druid_nova_burst: {id:'druid_nova_burst', name:'Nova Burst', icon:'💫', type:'attack', unique:true, champ:'druid', statId:'wis',
    effect:'Deal 12 + 2 per card in hand damage.\n[Sorcery] [60]: [Churn] 3.',
    effects:[{type:'dmg_scaling',base:12,source:'hand_size',check:'self',mult:2},{type:'sorcery',cost:60,effect:{type:'churn',count:3}}]},


  // ── Cursed Paladin ──
  paladin_smite: {id:'paladin_smite', name:'Smite', icon:'🔥', type:'attack', unique:true, champ:'paladin', statId:'str',
    effect:'Deal 10+STR÷4 damage. [Crit]: 25%.',
    effects:[{type:'dmg_conditional',base:10,hits:1,crit:25,stat:'str',stat_div:4}]},

  paladin_consecrate: {id:'paladin_consecrate', name:'Consecrate', icon:'🕊️', type:'utility', unique:true, champ:'paladin', statId:'str',
    effect:'Apply [Burn] 5s.\n[Sorcery] [40]: Heal STR÷4.',
    effects:[{type:'apply_status',status:'burn',target:'opponent',value:2,dur:5},{type:'sorcery',cost:40,effect:{type:'heal',amt:0,stat:'str',stat_div:4}}]},

  paladin_aegis: {id:'paladin_aegis', name:'Aegis', icon:'🛡️', type:'defense', unique:true, champ:'paladin', statId:'str',
    effect:'Gain STR [Shield] 5s.\n[Sorcery] [40]: [Weaken] 6s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:0,stat:'str',stat_div:1,dur:5},{type:'sorcery',cost:40,effect:{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:6}}]},

  // ── Faceless Thief ──
  thief_quick_slash: {id:'thief_quick_slash', name:'Quick Slash', icon:'⚡', type:'attack', unique:true, champ:'thief', statId:'agi',
    effect:'Deal 8 damage × 2 hits. [Crit]: 15%.',
    effects:[{type:'dmg_conditional',base:8,hits:2,crit:15}]},

  thief_poison_dart: {id:'thief_poison_dart', name:'Poison Dart', icon:'🎯', type:'attack', unique:true, champ:'thief', statId:'agi',
    effect:'Deal 10+AGI÷4 damage. Apply 1 [Poison] 8s.',
    effects:[{type:'dmg_conditional',base:10,hits:1,stat:'agi',stat_div:4},{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}]},

  thief_shadow_step: {id:'thief_shadow_step', name:'Shadow Step', icon:'👣', type:'utility', unique:true, champ:'thief', statId:'agi',
    effect:'[Weaken] 6s.\n[Sorcery] [25]: Apply 1 [Poison] 8s.',
    effects:[{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:6},{type:'sorcery',cost:25,effect:{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}}]},

  //   Backstab: [Debuff] on enemy: deal 33 additional damage — condition syntax needs crit system
  //   Death Mark: Apply [Vulnerable] for 6s — clean once explanation line removed
  //   Flicker: remove entirely, weak design
  //   Shadow Step Dodge: Dodge concept belongs on an unlock card with room to be interesting

  // ── Giant Rat ──
  rat_gnaw:   {id:'rat_gnaw',   name:'Gnaw',   icon:'🐀', type:'attack',  unique:true, champ:'rat', statId:'agi',
    effect:'Deal 10 damage. Apply 2 [Poison].',
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
    effect:'Gain STR+5 [Shield] 5s.\n[Sorcery] [35]: [Weaken] 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:5,stat:'str',stat_div:1,dur:5},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4}}]},
  goblin_cheap_shot: {id:'goblin_cheap_shot', name:'Cheap Shot', icon:'👺', type:'attack', unique:true, champ:'goblin', statId:'agi',
    effect:'Deal 5 damage × 3 hits.\n[Debuff] on enemy: [Crit] 50%.',
    effects:[{type:'dmg_conditional',base:5,hits:3,condition:'has_debuff',on_true:'crit',on_true_val:50}]},

  // ── Squanchback ──
  squanchback_bristle:    {id:'squanchback_bristle',    name:'Bristle',    icon:'🦔', type:'utility', unique:true, champ:'squanchback', statId:'str',
    effect:'Apply 6 [Thorns] 4s.',
    effects:[{type:'apply_status',status:'thorns',target:'self',value:6,dur:4}]},
  squanchback_shell_slam: {id:'squanchback_shell_slam', name:'Shell Slam', icon:'👊', type:'attack',  unique:true, champ:'squanchback', statId:'str',
    effect:'Deal 10 damage. Gain 12 [Shield] 5s.',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'apply_status',status:'shield',target:'self',value:12,dur:5}]},
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
    effect:'Gain 12 [Shield] for 4s. Apply [Slow] for 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:12,dur:5},{type:'apply_status',status:'slow',target:'opponent',value:0.5,dur:4}]},
  snake_spit: {id:'snake_spit', name:'Spit', icon:'💧', type:'attack', unique:true, champ:'snake', statId:'wis',
    effect:'Deal 10 damage.\n[Sorcery] [35]: Apply 2 [Poison].',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}}]},

  // ── Corrupted Bloom ──
  bloom_vine_lash: {id:'bloom_vine_lash', name:'Vine Lash', icon:'🌿', type:'attack', unique:true, champ:'bloom', statId:'str',
    effect:'Deal 10 + hand size × 2 damage.\n[Sorcery] [30]: Create [Ethereal] Corrupt Spore.',
    effects:[{type:'dmg_scaling',base:10,source:'hand_size',check:'self',mult:2},{type:'sorcery',cost:30,effect:{type:'create_card_in_hand',cardId:'corrupt_spore',target:'self',ghost:true}}]},
  bloom_rot_guard: {id:'bloom_rot_guard', name:'Rot Guard', icon:'🛡️', type:'defense', unique:true, champ:'bloom', statId:'str',
    effect:'Gain 16 [Shield] 5s.\n[Sorcery] [25]: [Churn] 1.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:16,dur:5},{type:'sorcery',cost:25,effect:{type:'churn',count:1}}]},
  bloom_wilt: {id:'bloom_wilt', name:'Wilt', icon:'🥀', type:'attack', unique:true, champ:'bloom', statId:'str',
    effect:'Apply 1 [Poison]. Discard 3.\n[Echo]: Apply 2 [Poison].',
    effects:[{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8},{type:'discard_own',count:3}],
    onDiscard:[{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}]},

  // ── Spore Puff ──
  sporepuff_spore_shot: {id:'sporepuff_spore_shot', name:'Spore Shot', icon:'🍄', type:'attack', unique:true, champ:'sporepuff', statId:'agi',
    effect:'Deal 12 damage.\n[Sorcery] [30]: [Churn] 1.',
    effects:[{type:'dmg_conditional',base:12,hits:1},{type:'sorcery',cost:30,effect:{type:'churn',count:1}}]},
  sporepuff_puff: {id:'sporepuff_puff', name:'Puff', icon:'💨', type:'utility', unique:true, champ:'sporepuff', statId:'agi',
    effect:'[Weaken] 4s.\n[Sorcery] [30]: [Churn] 1.\n[Echo]: Apply 1 [Poison].',
    effects:[{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4},{type:'sorcery',cost:30,effect:{type:'churn',count:1}}],
    onDiscard:[{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}]},
  sporepuff_burst: {id:'sporepuff_burst', name:'Burst', icon:'💥', type:'attack', unique:true, champ:'sporepuff', statId:'agi',
    effect:'Deal 6 damage × 2 hits.\n[Debuff] on enemy: [Crit] 25%.',
    effects:[{type:'dmg_conditional',base:6,hits:2,condition:'has_debuff',on_true:'crit',on_true_val:25}]},

  // ── Mycelid ──
  mycelid_fungal_slam: {id:'mycelid_fungal_slam', name:'Fungal Slam', icon:'🍄', type:'attack', unique:true, champ:'mycelid', statId:'str',
    effect:'Deal 14 damage.\n[Sorcery] [35]: Apply 2 [Poison].',
    effects:[{type:'dmg_conditional',base:14,hits:1},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}}]},
  mycelid_spore_guard: {id:'mycelid_spore_guard', name:'Spore Guard', icon:'🛡️', type:'defense', unique:true, champ:'mycelid', statId:'str',
    effect:'Gain 12 [Shield] 5s.\n[Sorcery] [35]: Apply 1 [Poison].',
    effects:[{type:'apply_status',status:'shield',target:'self',value:12,dur:5},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}}]},
  mycelid_decompose: {id:'mycelid_decompose', name:'Decompose', icon:'☠️', type:'attack', unique:true, champ:'mycelid', statId:'wis',
    effect:'Deal 8 damage. Apply WIS ÷ 4 [Poison].',
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
    effect:'Deal 8+STR÷4 damage. Gain 10 [Shield] 5s.',
    effects:[{type:'dmg_conditional',base:8,hits:1,stat:'str',stat_div:4},{type:'apply_status',status:'shield',target:'self',value:10,dur:5}]},
  lurker_crush: {id:'lurker_crush', name:'Crush', icon:'💥', type:'attack',  unique:true, champ:'drain_lurker', statId:'str',
    effect:'Deal 2× enemy [Shield] damage.\n[Sorcery] [35]: Next attack: +[Crit] 15%.',
    effects:[{type:'dmg_scaling',base:0,source:'shield',check:'opponent',mult:2},{type:'sorcery',cost:35,effect:{type:'modify_cards',source:'lurker_crush',filter:{type:'attack'},where:'hand',scope:'next_play',changes:[{field:'crit',delta:15}]}}]},
  lurker_coil:  {id:'lurker_coil',  name:'Coil',  icon:'🛡️', type:'defense', unique:true, champ:'drain_lurker', statId:'str',
    effect:'Gain 14 [Shield] 5s. [Slow] 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:14,dur:5},{type:'apply_status',status:'slow',target:'opponent',value:0.5,dur:4}]},

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
    effect:'Gain 10+STR÷3 [Shield] 5s.\n[Sorcery] [35]: +10 additional [Shield].',
    effects:[{type:'apply_status', status:'shield', target:'self', value:10, stat:'str', stat_div:3, dur:5},{type:'sorcery',cost:35,effect:{type:'apply_status',status:'shield',target:'self',value:10,dur:5}}]},
  sentinel_wrath: {id:'sentinel_wrath', name:"Sentinel's Wrath", icon:'💥', type:'attack',
    unique:false, champ:'iron_sentinel', statId:'str',
    effect:'Deal 12 damage.\nBelow 50% HP: deal 20 damage.',
    effects:[{type:'dmg_conditional', base:12, hits:1, check:'self', condition:'below_50_hp', on_true:'bonus_dmg', on_true_val:8}]},
  sentinel_purge: {id:'sentinel_purge', name:'Purge', icon:'✨', type:'defense',
    unique:false, champ:'iron_sentinel', statId:'wis',
    effect:'[Sorcery] [40]: Cleanse all debuffs. Gain 10 [Shield] 5s.',
    effects:[{type:'sorcery',cost:40,effects:[{type:'cleanse',target:'self',what:'all_debuffs'},{type:'apply_status',status:'shield',target:'self',value:10,dur:5}]}]},

  // ── Raider ──
  raider_rummage: {id:'raider_rummage', name:'Rummage', icon:'🪙', type:'utility',
    unique:false, champ:'raider', statId:'wis',
    effect:'[Sorcery] [40]: Create [Ethereal] Plundered Goods in hand. Create [Ethereal] Rusty Junk in enemy hand.',
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
    effect:'Gain 12 [Shield] 5s. [Churn] 1.',
    effects:[
      {type:'apply_status', status:'shield', target:'self', value:12, dur:5},
      {type:'churn', count:1}]},
  raider_plundered_goods: {id:'raider_plundered_goods', name:'Plundered Goods', icon:'💰', type:'attack',
    unique:false, champ:'raider', statId:'agi',
    effect:'Deal 6 × (cards in hand) damage. Haste 15% for 3s. Ethereal.',
    effects:[
      {type:'dmg_scaling', base:0, source:'hand_size', check:'self', mult:6},
      {type:'apply_status', status:'haste', target:'self', value:0.15, dur:3}]},
  raider_rusty_junk: {id:'raider_rusty_junk', name:'Rusty Junk', icon:'🗑️', type:'utility',
    unique:false, champ:'raider', statId:'wis',
    effect:'[Sorcery] [30]: [Haste] 10% 2s. [Ethereal].',
    effects:[{type:'sorcery',cost:30,effect:{type:'apply_status', status:'haste', target:'self', value:0.10, dur:2}}]},

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
};

// Deck size = creature STR (same as max HP). Cards ARE health — small decks are fragile.
function creatureDeckSize(id){ var c=CREATURES[id]; if(!c) return 10; return c.baseStats.str; }

// CREATURE_DECKS legacy — active creatures now use deckOrder in creature files.
// buildCreatureDeck() in game.js generates decks from deckOrder + STR.
var CREATURE_DECKS = {};
