// ════════════════════════════════════════════════════════════════
// KEYWORDS — combat status glossary
// ════════════════════════════════════════════════════════════════
// These render as inline tooltips on card effect text.
// To add a new keyword: add an entry here and wrap it in [BracketName]
// in any card effect string.
// ════════════════════════════════════════════════════════════════

var KEYWORDS = {
  // ── Damage over time ──
  Burn:      {cls:'burn',      def:'Deals X dmg every second. Non-stacking — reapplication refreshes duration only. Bypasses Shield.'},
  Poison:    {cls:'poison',    def:'Deals X dmg every second. Stacks — each application adds damage and refreshes timer. Bypasses Shield.'},

  // ── Debuffs ──
  Weaken:    {cls:'cursed',    def:'Target deals 15% less damage for the duration.'},
  Cursed:    {cls:'cursed',    def:'Target deals 15% less damage for the duration.'},  // legacy alias
  Slow:      {cls:'slow',      def:'Draw interval increased by 600ms. Non-stacking — reapplication refreshes duration only.'},
  Root:      {cls:'root',      def:'Cannot draw cards for the duration.'},
  Webbed:    {cls:'webbed',    def:'Draw interval permanently increased by 800ms for this fight.'},
  Marked:     {cls:'cursed',    def:'Target takes 50% more damage from all sources while active.'},
  Vulnerable: {cls:'cursed',    def:'Target takes 50% more damage from all sources while active.'},
  Condemned: {cls:'cursed',    def:'Each stack increases Retribution damage by +15% (max 5 stacks, 12s).'},

  // ── Buffs ──
  Shield:    {cls:'shielded',  def:'Temporary HP buffer. Absorbs direct damage before HP. DoTs bypass it. Manabound: purged if mana hits 0.'},
  Dodge:     {cls:'dodge',     def:'The next incoming attack is completely evaded. Manabound: purged if mana hits 0.'},
  Haste:     {cls:'haste',     def:'Draw speed increased by X% for the duration.'},
  Frenzy:    {cls:'hastened',  def:'Stacking draw-speed buff. Each stack = +10% draw speed. Duration starts at 3s, shortens by 10% per stack. Collapses entirely when timer expires. Manabound. Drains 3 mana/s.'},
  Thorns:    {cls:'burn',      def:'While active, each hit from an attack card reflects X damage back to the attacker. Triggers even through Shield. Manabound: purged if mana hits 0.'},

  // ── New status mechanics ──
  Volatile:  {cls:'burn',      def:'Stacking. Timer resets on each new stack. At 5+ stacks: detonates for 2× base damage. Below 5 stacks when timer expires: fizzles for 1× base damage. [Stabilize] raises threshold to 10 stacks (10+ = 4× damage).'},

  // ── Action keywords ──
  Sorcery:   {cls:'drain',     def:'Sorcery [X]: spend X mana to trigger this bonus. If mana is below X the effect does not fire and no mana is spent. Multiple Sorcery effects on one card resolve top to bottom, each spending from remaining mana.'},
  Sacrifice: {cls:'burn',      def:'Sacrifice [X]: pay X of a specified resource (HP, mana, or status stacks) to trigger this effect. If the cost cannot be paid the effect does not fire. Base effect always resolves.'},
  Drain:     {cls:'drain',     def:'Steal X mana from the target directly.'},
  Refresh:   {cls:'echo',      def:'Shuffle your discard pile into your draw pile.'},
  Churn:     {cls:'echo',      def:'Churn [X]: discard X random cards from hand, then draw X cards. Discard resolves before draw.'},
  Hellbent:  {cls:'burn',      def:'This effect only triggers if you have no cards in hand.'},
  Suspend:   {cls:'echo',      def:'Suspend [X]: pause all active buff and debuff timers on this creature for X seconds.'},
  Stabilize: {cls:'hastened',  def:'Raises the Volatile detonation threshold from 5 stacks to 10. At 5-9 stacks: 2× damage. At 10+ stacks: 4× damage.'},
  Convert:   {cls:'echo',      def:'Remove the oldest card in hand and replace it with the specified card. The new card is played immediately.'},
  Shed:      {cls:'poison',    def:'Shed [X]: transfer all stacks of [X] from self to target.'},

  // ── Misc ──
  Crit:      {cls:'hastened',  def:'A strike that deals double damage. Triggered by chance or special conditions.'},
  Echo:      {cls:'echo',      def:'If this card is discarded by any effect — innate, overflow, or another card — its Echo effect triggers.'},
  Manabound: {cls:'drain',     def:'This effect is purged immediately if the creature\'s mana hits 0. Applies to Shield, Dodge, and Frenzy.'},
  Debuff:    {cls:'cursed',    def:'Any negative status effect on the target (Weaken, Poison, Burn, Slow, etc.). Some effects trigger only when a debuff is present.'},
  Ethereal:  {cls:'echo',      def:'This card vanishes when played or discarded — it does not return to your deck. Created temporarily by special abilities.'},
  Conjured:  {cls:'echo',      def:'This card was created during combat. It circulates normally through your deck — not removed on play or discard. Removed from the game at end of battle. [Echo] on a Conjured card removes all Conjured copies from everywhere.'},
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
    tip.style.left=Math.min(e.clientX+12,window.innerWidth-200)+'px';
    tip.style.top=Math.min(e.clientY+12,window.innerHeight-80)+'px';
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
    effect:'Deal 10 + WIS damage.\n[Echo]: Draw 1 card.',
    effects:[{type:'dmg_conditional',base:10,hits:1,stat:'wis',stat_div:1}],
    onDiscard:[{type:'draw_cards',count:1}]},

  druid_star_shard: {id:'druid_star_shard', name:'Star Shard', icon:'✨', type:'attack', unique:true, champ:'druid', statId:'wis',
    effect:'Deal 4 damage. [Conjured] a copy into discard.\n[Echo]: Remove all [Conjured] copies from everywhere.',
    effects:[{type:'dmg_conditional',base:4,hits:1},{type:'conjure_copy'}],
    onDiscard:[{type:'purge_conjured'}]},
    // [Echo] purge trigger on discard. Currently just deals 4 damage.

  druid_nova_burst: {id:'druid_nova_burst', name:'Nova Burst', icon:'💥', type:'attack', unique:true, champ:'druid', statId:'wis',
    effect:'Deal 12 damage per card in hand (min 12).\n[Churn] 3.',
    effects:[{type:'dmg_scaling',base:12,source:'hand_size',check:'self',mult:1},{type:'churn',count:3}]},

  // Drifting Comet (heavy damage + control — [Suspend] needs defining first)

  // ── Cursed Paladin ──
  paladin_smite: {id:'paladin_smite', name:'Smite', icon:'🔥', type:'attack', unique:true, champ:'paladin', statId:'str',
    effect:'Deal 14 damage. Apply 2 [Burn] for 5s.\n[Burn] on enemy: [Crit]: 75%.',
    effects:[{type:'dmg_conditional',base:14,hits:1,condition:'has_burn',on_true:'crit',on_true_val:75},{type:'apply_status',status:'burn',target:'opponent',value:2,dur:5}]},

  paladin_consecrate: {id:'paladin_consecrate', name:'Consecrate', icon:'🕊️', type:'utility', unique:true, champ:'paladin', statId:'wis',
    effect:'Apply [Weaken] for 6s.\n[Sorcery] [20]: Apply 2 [Burn] for 5s.',
    effects:[{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:6},{type:'sorcery',cost:20,effect:{type:'apply_status',status:'burn',target:'opponent',value:2,dur:5}}]},

  paladin_aegis: {id:'paladin_aegis', name:'Aegis', icon:'🛡️', type:'defense', unique:true, champ:'paladin', statId:'str',
    effect:'Gain STR [Shield] for 6s.\n[Sorcery] [25]: Apply [Weaken] for 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:0,stat:'str',stat_div:1,dur:6},{type:'sorcery',cost:25,effect:{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4}}]},

  // ── Faceless Thief ──
  thief_quick_slash: {id:'thief_quick_slash', name:'Quick Slash', icon:'⚡', type:'attack', unique:true, champ:'thief', statId:'agi',
    effect:'Deal 10 + AGI ÷ 4 damage.\n[Crit]: 20%.',
    effects:[{type:'dmg_conditional',base:10,hits:1,crit:20},{type:'dmg_conditional',base:0,hits:1,stat:'agi',stat_div:4}]},

  thief_poison_dart: {id:'thief_poison_dart', name:'Poison Dart', icon:'🎯', type:'attack', unique:true, champ:'thief', statId:'agi',
    effect:'Deal 10 damage. Apply 1 [Poison].\n[Sorcery] [20]: Apply 1 additional [Poison].',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8},{type:'sorcery',cost:20,effect:{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}}]},

  thief_shadow_step: {id:'thief_shadow_step', name:'Shadow Step', icon:'👣', type:'utility', unique:true, champ:'thief', statId:'agi',
    effect:'Apply [Weaken] for 6s.',
    effects:[{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:6}]},

  //   Backstab: [Debuff] on enemy: deal 33 additional damage — condition syntax needs crit system
  //   Death Mark: Apply [Vulnerable] for 6s — clean once explanation line removed
  //   Flicker: remove entirely, weak design
  //   Shadow Step Dodge: Dodge concept belongs on an unlock card with room to be interesting

  // ── Giant Rat ──
  rat_gnaw:   {id:'rat_gnaw',   name:'Gnaw',   icon:'🐀', type:'attack',  unique:true, champ:'rat', statId:'agi',
    effect:'Deal 10 damage. Apply 2 [Poison].',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}]},
  rat_slash:  {id:'rat_slash',  name:'Slash',  icon:'⚡', type:'attack',  unique:true, champ:'rat', statId:'agi',
    effect:'Deal 13 + AGI ÷ 4 damage.\n[Crit]: 15%.',
    effects:[{type:'dmg_conditional',base:13,hits:1,crit:15},{type:'dmg_conditional',base:0,hits:1,stat:'agi',stat_div:4}]},
  rat_dart:   {id:'rat_dart',   name:'Dart',   icon:'💨', type:'utility', unique:true, champ:'rat', statId:'agi',
    effect:'Gain [Haste] 20% for 3s.',
    effects:[{type:'apply_status',status:'haste',target:'self',value:0.20,dur:3}]},

  // ── Goblin Scavenger ──
  goblin_jab:        {id:'goblin_jab',        name:'Jab',        icon:'🗡️', type:'attack', unique:true, champ:'goblin', statId:'str',
    effect:'Deal 10 damage. Apply [Weaken] for 4s.\n[Sorcery] [20]: Gain [Haste] 20% for 3s.',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4},{type:'sorcery',cost:20,effect:{type:'apply_status',status:'haste',target:'self',value:0.20,dur:3}}]},
  goblin_filth_toss: {id:'goblin_filth_toss', name:'Filth Toss', icon:'💀', type:'attack', unique:true, champ:'goblin', statId:'wis',
    effect:'Deal 12 damage.\n[Sorcery] [20]: Apply 1 [Poison].',
    effects:[{type:'dmg_conditional',base:12,hits:1},{type:'sorcery',cost:20,effect:{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}}]},
  goblin_cheap_shot: {id:'goblin_cheap_shot', name:'Cheap Shot', icon:'👺', type:'attack', unique:true, champ:'goblin', statId:'agi',
    effect:'Deal 10 damage.\n[Debuff] on enemy: [Crit]: 40%.',
    effects:[{type:'dmg_conditional',base:10,hits:1,condition:'has_debuff',on_true:'crit',on_true_val:40}]},

  // ── Squanchback ──
  squanchback_bristle:    {id:'squanchback_bristle',    name:'Bristle',    icon:'🦔', type:'utility', unique:true, champ:'squanchback', statId:'str',
    effect:'Apply [Thorns] (6) for 6s.',
    effects:[{type:'apply_status',status:'thorns',target:'self',value:6,dur:6}]},
  squanchback_shell_slam: {id:'squanchback_shell_slam', name:'Shell Slam', icon:'👊', type:'attack',  unique:true, champ:'squanchback', statId:'str',
    effect:'Deal 10 damage. Gain 12 [Shield] for 5s.',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'apply_status',status:'shield',target:'self',value:12,dur:5}]},
  squanchback_spine_lash: {id:'squanchback_spine_lash', name:'Spine Lash', icon:'🦷', type:'attack',  unique:true, champ:'squanchback', statId:'str',
    effect:'Deal 8 damage.\n[Shield] active: deal [Shield] additional damage.',
    effects:[{type:'dmg_scaling',base:8,source:'shield',check:'self',mult:1}]},
  squanchback_spite:      {id:'squanchback_spite',      name:'Spite',      icon:'💢', type:'attack',  unique:false, champ:'squanchback', statId:'str',
    effect:'Deal missing HP ÷ 4 damage.',
    effects:[{type:'dmg_scaling',base:0,source:'missing_hp',check:'self',mult:1,stat_div:4}]},

  // ── Slime ──
  slime_ooze:   {id:'slime_ooze',   name:'Ooze',   icon:'🟢', type:'attack',  unique:true, champ:'slime', statId:'str',
    effect:'Deal 14 damage. Apply 1 [Poison].',
    effects:[{type:'dmg_conditional',base:14,hits:1},{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}]},
  slime_harden: {id:'slime_harden', name:'Harden', icon:'🛡️', type:'defense', unique:true, champ:'slime', statId:'str',
    effect:'Gain 16 [Shield] for 6s.\n[Sorcery] [15]: Apply [Weaken] for 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:16,dur:6},{type:'sorcery',cost:15,effect:{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4}}]},
  slime_spit:   {id:'slime_spit',   name:'Spit',   icon:'💧', type:'attack',  unique:true, champ:'slime', statId:'agi',
    effect:'Deal 10 damage. Apply [Slow] for 4s.',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'apply_status',status:'slow',target:'opponent',value:1,dur:4}]},

  // ── Wolf ──
  wolf_bite:  {id:'wolf_bite',  name:'Bite',  icon:'🐺', type:'attack',  unique:true, champ:'wolf', statId:'agi',
    effect:'Deal 14 + AGI ÷ 4 damage. Apply 1 [Poison].',
    effects:[{type:'dmg_conditional',base:14,hits:1,stat:'agi',stat_div:4},{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}]},
  wolf_lunge: {id:'wolf_lunge', name:'Lunge', icon:'💨', type:'attack',  unique:true, champ:'wolf', statId:'agi',
    effect:'Deal 14 damage. Gain [Haste] 15% for 3s.',
    effects:[{type:'dmg_conditional',base:14,hits:1},{type:'apply_status',status:'haste',target:'self',value:0.15,dur:3}]},
  wolf_howl:  {id:'wolf_howl',  name:'Howl',  icon:'🌙', type:'utility', unique:true, champ:'wolf', statId:'agi',
    effect:'Gain [Haste] 30% for 4s.\n[Sorcery] [15]: Next attack card: +[Crit]: 15%.',
    effects:[{type:'apply_status',status:'haste',target:'self',value:0.30,dur:4},{type:'sorcery',cost:15,effect:{type:'modify_cards',source:'wolf_howl',filter:{type:'attack'},where:'hand',scope:'next_play',changes:[{field:'crit',delta:15}]}}]},

  // ── Swamp Snake ──
  snake_fang: {id:'snake_fang', name:'Fang', icon:'🐍', type:'attack', unique:true, champ:'snake', statId:'agi',
    effect:'Deal 14 damage. [Crit]: 15%.',
    effects:[{type:'dmg_conditional',base:14,hits:1,crit:15}]},
  snake_coil: {id:'snake_coil', name:'Coil', icon:'🛡️', type:'defense', unique:true, champ:'snake', statId:'agi',
    effect:'Gain 12 [Shield] for 4s. Apply [Slow] for 4s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:12,dur:4},{type:'apply_status',status:'slow',target:'opponent',value:1,dur:4}]},
  snake_spit: {id:'snake_spit', name:'Spit', icon:'💧', type:'attack', unique:true, champ:'snake', statId:'wis',
    effect:'Deal 10 damage.\n[Sorcery] [20]: Apply 2 additional [Poison].',
    effects:[{type:'dmg_conditional',base:10,hits:1},{type:'sorcery',cost:20,effect:{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}}]},

  // ── Corrupted Bloom ──
  bloom_vine_lash: {id:'bloom_vine_lash', name:'Vine Lash', icon:'🌿', type:'attack', unique:true, champ:'bloom', statId:'str',
    effect:'Deal 10 + hand size × 2 damage.',
    effects:[{type:'dmg_scaling',base:10,source:'hand_size',check:'self',mult:2}]},
  bloom_rot_guard: {id:'bloom_rot_guard', name:'Rot Guard', icon:'🛡️', type:'defense', unique:true, champ:'bloom', statId:'str',
    effect:'Gain 16 [Shield] for 5s.\n[Sorcery] [15]: [Churn] 1.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:16,dur:5},{type:'sorcery',cost:15,effect:{type:'churn',count:1}}]},
  bloom_wilt: {id:'bloom_wilt', name:'Wilt', icon:'🥀', type:'attack', unique:true, champ:'bloom', statId:'str',
    effect:'Deal 6 damage × hand size. Discard entire hand.',
    effects:[{type:'dmg_scaling',base:0,source:'hand_size',check:'self',mult:6},{type:'discard_own',count:'all'}]},

  // ── Spore Puff ──
  sporepuff_spore_shot: {id:'sporepuff_spore_shot', name:'Spore Shot', icon:'🍄', type:'attack', unique:true, champ:'sporepuff', statId:'agi',
    effect:'Deal 12 damage.\n[Sorcery] [15]: [Churn] 1.',
    effects:[{type:'dmg_conditional',base:12,hits:1},{type:'sorcery',cost:15,effect:{type:'churn',count:1}}]},
  sporepuff_puff: {id:'sporepuff_puff', name:'Puff', icon:'💨', type:'utility', unique:true, champ:'sporepuff', statId:'agi',
    effect:'Apply [Weaken] for 4s.\n[Sorcery] [15]: [Churn] 1.\n[Echo]: Apply 1 [Poison].',
    effects:[{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4},{type:'sorcery',cost:15,effect:{type:'churn',count:1}}],
    onDiscard:[{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}]},
  sporepuff_burst: {id:'sporepuff_burst', name:'Burst', icon:'💥', type:'attack', unique:true, champ:'sporepuff', statId:'agi',
    effect:'Deal 6 damage × 2 hits.\n[Debuff] on enemy: [Crit]: 25%.',
    effects:[{type:'dmg_conditional',hits:2,dmg:6,condition:'has_debuff',check:'opponent',on_true:'crit',on_true_val:25}]},

  // ── Mycelid ──
  mycelid_fungal_slam: {id:'mycelid_fungal_slam', name:'Fungal Slam', icon:'🍄', type:'attack', unique:true, champ:'mycelid', statId:'str',
    effect:'Deal 14 damage.\n[Sorcery] [20]: Apply 2 [Poison].',
    effects:[{type:'dmg_conditional',base:14,hits:1},{type:'sorcery',cost:20,effect:{type:'apply_status',status:'poison',target:'opponent',value:2,dur:8}}]},
  mycelid_spore_guard: {id:'mycelid_spore_guard', name:'Spore Guard', icon:'🛡️', type:'defense', unique:true, champ:'mycelid', statId:'str',
    effect:'Gain 12 [Shield] for 5s.\n[Sorcery] [15]: Apply 1 [Poison].',
    effects:[{type:'apply_status',status:'shield',target:'self',value:12,dur:5},{type:'sorcery',cost:15,effect:{type:'apply_status',status:'poison',target:'opponent',value:1,dur:8}}]},
  mycelid_decompose: {id:'mycelid_decompose', name:'Decompose', icon:'☠️', type:'attack', unique:true, champ:'mycelid', statId:'wis',
    effect:'Deal 8 damage. Apply WIS ÷ 4 [Poison].',
    effects:[{type:'dmg_conditional',base:8,hits:1},{type:'apply_status',status:'poison',target:'opponent',value:0,stat:'wis',stat_div:4,dur:8}]},

  // ── Sewer Zombie ──
  zombie_slam:  {id:'zombie_slam',  name:'Slam',  icon:'🧟', type:'attack',  unique:true, champ:'zombie', statId:'str',
    effect:'Deal 16 damage.\n[Sorcery] [25]: Heal 8 HP.',
    effects:[{type:'dmg_conditional',base:16,hits:1},{type:'sorcery',cost:25,effect:{type:'heal',amt:8}}]},
  zombie_bite:  {id:'zombie_bite',  name:'Bite',  icon:'🦷', type:'attack',  unique:true, champ:'zombie', statId:'str',
    effect:'Deal 12 damage. Apply [Weaken] for 4s.',
    effects:[{type:'dmg_conditional',base:12,hits:1},{type:'apply_status',status:'weaken',target:'opponent',value:1,dur:4}]},
  zombie_groan: {id:'zombie_groan', name:'Groan', icon:'🛡️', type:'defense', unique:true, champ:'zombie', statId:'str',
    effect:'Gain 16 [Shield] for 5s.\n[Sorcery] [20]: Heal 6 HP.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:16,dur:5},{type:'sorcery',cost:20,effect:{type:'heal',amt:6}}]},

  // ── Drain Lurker ──
  lurker_lash:  {id:'lurker_lash',  name:'Lash',  icon:'🐊', type:'attack',  unique:true, champ:'drain_lurker', statId:'str',
    effect:'Deal 14 damage. Gain 10 [Shield] for 5s.',
    effects:[{type:'dmg_conditional',base:14,hits:1},{type:'apply_status',status:'shield',target:'self',value:10,dur:5}]},
  lurker_crush: {id:'lurker_crush', name:'Crush', icon:'💥', type:'attack',  unique:true, champ:'drain_lurker', statId:'str',
    effect:'Deal 12 damage.\n[Sorcery] [20]: Destroy [Shield]. Deal [Shield] additional damage.',
    effects:[{type:'dmg_conditional',base:12,hits:1},{type:'sorcery',cost:20,effects:[{type:'dmg_scaling',base:0,source:'shield',check:'opponent',mult:1},{type:'cleanse',target:'opponent',what:'shield'}]}]},
  lurker_coil:  {id:'lurker_coil',  name:'Coil',  icon:'🛡️', type:'defense', unique:true, champ:'drain_lurker', statId:'str',
    effect:'Gain 16 [Shield] for 6s. Apply [Slow] for 3s.',
    effects:[{type:'apply_status',status:'shield',target:'self',value:16,dur:6},{type:'apply_status',status:'slow',target:'opponent',value:1,dur:3}]},

  // ── Bandit ──
  bandit_shiv:       {id:'bandit_shiv',       name:'Shiv',       icon:'🗡️', type:'attack',  unique:true, champ:'bandit', statId:'agi',
    effect:'Deal 6 damage × 3 hits. [Crit]: 10%.\n[Echo]: Deal 6 damage × 2 hits.',
    effects:[{type:'dmg_conditional',base:6,hits:3,crit:10}],
    onDiscard:[{type:'dmg_conditional',base:6,hits:2}]},
  bandit_ransack:    {id:'bandit_ransack',    name:'Ransack',    icon:'💰', type:'attack',  unique:true, champ:'bandit', statId:'str',
    effect:'Deal 8 + discard pile damage.',
    effects:[{type:'dmg_scaling',base:8,source:'discard_size',check:'self',mult:1}]},
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
    effect:'Gain 10+STR÷3 Shield for 6s.',
    effects:[{type:'apply_status', status:'shield', target:'self', value:10, stat:'str', stat_div:3, dur:6}]},
  sentinel_wrath: {id:'sentinel_wrath', name:"Sentinel's Wrath", icon:'💥', type:'attack',
    unique:false, champ:'iron_sentinel', statId:'str',
    effect:'Deal 12 damage. If below 50% HP: deal 20 damage instead.',
    effects:[{type:'dmg_conditional', base:12, hits:1, condition:'below_50_hp', on_true:'bonus_dmg', on_true_val:8}]},
  sentinel_purge: {id:'sentinel_purge', name:'Purge', icon:'✨', type:'defense',
    unique:false, champ:'iron_sentinel', statId:'wis',
    effect:'Sorcery 50: Cleanse all debuffs. Gain 10 Shield for 5s.',
    effects:[
      {type:'cleanse', target:'self', what:'all_debuffs', sorcery:50},
      {type:'apply_status', status:'shield', target:'self', value:10, dur:5, sorcery:50}]},

  // ── Raider ──
  raider_rummage: {id:'raider_rummage', name:'Rummage', icon:'🪙', type:'utility',
    unique:false, champ:'raider', statId:'wis',
    effect:'Sorcery 40: Create Ethereal Plundered Goods in own hand. Create Ethereal Rusty Junk in opponent\'s hand.',
    effects:[
      {type:'create_card_in_hand', cardId:'raider_plundered_goods', target:'self', ghost:true, sorcery:40},
      {type:'create_card_in_hand', cardId:'raider_rusty_junk', target:'opponent', ghost:true, sorcery:40}]},
  raider_flurry: {id:'raider_flurry', name:'Flurry', icon:'⚔️', type:'attack',
    unique:false, champ:'raider', statId:'agi',
    effect:'Deal 6 damage × 2 hits. Sorcery 15: Haste 15% for 3s.',
    effects:[
      {type:'dmg_conditional', base:6, hits:2},
      {type:'apply_status', status:'haste', target:'self', value:0.15, dur:3, sorcery:15}]},
  raider_hunker: {id:'raider_hunker', name:'Hunker', icon:'🛡️', type:'defense',
    unique:false, champ:'raider', statId:'agi',
    effect:'Gain 12 Shield for 4s. Churn 1.',
    effects:[
      {type:'apply_status', status:'shield', target:'self', value:12, dur:4},
      {type:'churn', count:1}]},
  raider_plundered_goods: {id:'raider_plundered_goods', name:'Plundered Goods', icon:'💰', type:'attack',
    unique:false, champ:'raider', statId:'agi',
    effect:'Deal 6 × (cards in hand) damage. Haste 15% for 3s. Ethereal.',
    effects:[
      {type:'dmg_scaling', base:0, source:'hand_size', check:'self', mult:6},
      {type:'apply_status', status:'haste', target:'self', value:0.15, dur:3}]},
  raider_rusty_junk: {id:'raider_rusty_junk', name:'Rusty Junk', icon:'🗑️', type:'utility',
    unique:false, champ:'raider', statId:'wis',
    effect:'Sorcery 30: Haste 10% for 2s. Ethereal.',
    effects:[
      {type:'apply_status', status:'haste', target:'self', value:0.10, dur:2, sorcery:30}]},

  // ── Infernal Beast ──
  infernal_strike: {id:'infernal_strike', name:'Infernal Strike', icon:'🔥', type:'attack',
    unique:false, champ:'infernal_beast', statId:'agi',
    effect:'Deal 8 damage × 2 hits.\nSorcery 25: Mana Burn 15.\nHellbent: Apply 2 Burn for 5s.',
    effects:[
      {type:'dmg_conditional', base:8, hits:2},
      {type:'mana_burn', value:15, sorcery:25},
      {type:'hellbent', effect:{type:'apply_status', status:'burn', target:'opponent', value:2, dur:5}}]},
  infernal_demon_bolt: {id:'infernal_demon_bolt', name:'Demon Bolt', icon:'⚡', type:'attack',
    unique:false, champ:'infernal_beast', statId:'wis',
    effect:'Deal 10 damage.\nSorcery 30: Mana Burn 20.\nHellbent: Draw 2 cards.',
    effects:[
      {type:'dmg_conditional', base:10, hits:1},
      {type:'mana_burn', value:20, sorcery:30},
      {type:'hellbent', effect:{type:'draw_cards', count:2}}]},
  infernal_dark_pact: {id:'infernal_dark_pact', name:'Dark Pact', icon:'👁️', type:'utility',
    unique:false, champ:'infernal_beast', statId:'wis',
    effect:'Discard 3. Apply Weaken 4s.\nSorcery 20: Mana Burn 15.\nHellbent: Cleanse Shield from both sides.',
    effects:[
      {type:'discard_own', count:3},
      {type:'apply_status', status:'weaken', target:'opponent', value:1, dur:4},
      {type:'mana_burn', value:15, sorcery:20},
      {type:'hellbent', effect:{type:'cleanse', target:'both', what:'shield'}}]},
};

// Deck size = creature STR (same as max HP). Cards ARE health — small decks are fragile.
function creatureDeckSize(id){ var c=CREATURES[id]; if(!c) return 10; return c.baseStats.str; }

// CREATURE_DECKS legacy — active creatures now use deckOrder in creature files.
// buildCreatureDeck() in game.js generates decks from deckOrder + STR.
var CREATURE_DECKS = {};
