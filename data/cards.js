// ════════════════════════════════════════════════════════════════
// KEYWORDS — combat status glossary
// ════════════════════════════════════════════════════════════════
// These render as inline tooltips on card effect text.
// To add a new keyword: add an entry here and wrap it in [BracketName]
// in any card effect string.
// ════════════════════════════════════════════════════════════════

var KEYWORDS = {
  Burn:      {cls:'burn',      def:'Deals WIS×1 dmg every 3s. Stacks indefinitely — each application adds more damage and refreshes duration.'},
  Poison:    {cls:'poison',    def:'Deals X dmg every 2s for a set duration.'},
  Cursed:    {cls:'cursed',    def:'Enemy deals 15% less damage for the duration.'},
  Shield:    {cls:'shielded',  def:'A temporary HP buffer. Absorbs direct damage before your HP is touched. DoTs (Poison, Burn, Bleed) bypass it entirely. Depletes or expires after its duration.'},
  Shielded:  {cls:'shielded',  def:'Incoming damage drains mana instead of HP while active. When mana runs out the effect ends. Applied by Aegis.'},
  Root:      {cls:'root',      def:'Cannot draw cards for the duration. Dispelled on draw.'},
  Slow:      {cls:'slow',      def:'Draw interval increased by a flat amount for the duration.'},
  Dodge:     {cls:'dodge',     def:'The next incoming attack is completely evaded.'},
  Haste:     {cls:'haste',     def:'Attack or draw speed increased by X% for the duration.'},
  Drain:     {cls:'drain',     def:'Steals X mana from the target directly.'},
  Webbed:    {cls:'webbed',    def:'Draw interval permanently increased by 800ms for this fight.'},
  Condemned: {cls:'cursed',    def:'Each stack increases Retribution damage by +15% (max ×5 stacks, 12s). Applied by Retribution.'},
  Marked:    {cls:'cursed',    def:'Enemy takes 50% more damage from all sources while active. Applied by Death Mark.'},
  Crit:      {cls:'hastened',  def:'A strike that deals double damage. Triggered by chance or special conditions.'},
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
//
// Card effects (what happens when played) live in data/card_effects.js.
// To add a new card: add its definition here, add its effect handler there.
// ════════════════════════════════════════════════════════════════

var CARDS = {
  // ── Universal basics ──
  strike:      {id:'strike',      name:'Strike',        icon:'⚔️', type:'attack',  unique:false, champ:null,    statId:null,  effect:'Deal 18 damage.'},
  brace:       {id:'brace',       name:'Brace',         icon:'🛡', type:'defense', unique:false, champ:null,    statId:null,  effect:'Apply [Shield] (20) for 5s. On expiry: gain 40 mana.\n[Shield] absorbs direct damage before HP. DoTs bypass it.', effects:[{type:'shield',amt:20,dur:5,onexpiry:'gain_mana',expiry_val:40}]},


  // ── Starcaller Druid ──
  void_bolt:   {id:'void_bolt',   name:'Void Bolt',     icon:'🔵', type:'attack',  unique:true,  champ:'druid', statId:'wis', effect:'Deal 12+WIS damage. On discard: draw speed +50% for 1s.', effects:[{type:'dmg_stat',base:12,stat:'wis',div:1}]},

  drifting_comet:{id:'drifting_comet',name:'Drifting Comet',icon:'💫',type:'attack',unique:true, champ:'druid', statId:'agi', effect:'Deal 16 damage. If auto-played: stun enemy 0.8s instead.'},
  nova_burst:  {id:'nova_burst',  name:'Nova Burst',    icon:'💥', type:'attack',  unique:true,  champ:'druid', statId:'wis', effect:'Deal 15 × cards-in-hand damage (min 15).'},
  focus:       {id:'focus',       name:'Focus',         icon:'🔮', type:'utility', unique:true,  champ:'druid', statId:'wis', effect:'[Drain] 80% of max mana. Draw 2 cards.\n[Drain]: removes mana from your bar.'},
  stellar_shards:{id:'stellar_shards',name:'Stellar Shards',icon:'✨',type:'attack',unique:true, champ:'druid', statId:'wis', effect:'Deal 7 damage 3 times. Discard other [Stellar Shards] in hand — deal 1 extra hit per discarded copy.'},
  nebula_shield:{id:'nebula_shield',name:'Nebula Ward', icon:'🌌',type:'defense',  unique:true,  champ:'druid', statId:'str', effect:'Apply [Shield] (30) for 6s. On expiry: gain 100 mana.\n[Shield] absorbs direct damage before HP. DoTs bypass it.', effects:[{type:'shield',amt:30,dur:6,onexpiry:'gain_mana',expiry_val:100}]},
  

  // ── Cursed Paladin ──
  retribution: {id:'retribution', name:'Retribution',   icon:'️⚖️', type:'attack',  unique:true,  champ:'paladin',statId:'str', effect:'Deal 15 damage. If enemy is debuffed: deal 30 instead. Add a stack of [Condemned] for 12s. (Max 5)[Condemned]: each stack increases Retribution damage by +15%.'},
  holy_shield: {id:'holy_shield', name:'Aegis',         icon:'🛡️', type:'defense', unique:true,  champ:'paladin',statId:'str', effect:'Apply [Shielded] for 5s.\n[Shielded]: incoming damage drains mana instead of HP.'},
  consecrate:  {id:'consecrate',  name:'Consecrate',    icon:'🕊️', type:'attack',  unique:true,  champ:'paladin',statId:'wis', effect:'Deal 12 damage. Apply [Cursed] for 5s.\n[Cursed]: enemy deals 15% less damage.', effects:[{type:'dmg',base:12}, {type:'cursed',dur:5}, {type:'holy_flame'}]},

  judgment:    {id:'judgment',    name:'Judgment',      icon:'⚡', type:'attack',  unique:true,  champ:'paladin',statId:'str', effect:'Deal 20 damage. If enemy has 3+ active debuffs: deal 40 instead and apply [Condemned].\n[Condemned]: stacks — each increases Retribution damage by +15%.'},
  hellfire:    {id:'hellfire',    name:'Hellfire',      icon:'🔥', type:'attack',  unique:true,  champ:'paladin',statId:'wis', effect:'Apply [Burn] (WIS×2 dmg/3s). Gain 30 mana.\nDirectly fuels Holy Flame — every Burn stack is a debuff applied.', effects:[{type:'burn_stat',base:0,stat:'wis',div:1,dur:9}, {type:'mana',amt:30}, {type:'holy_flame'}]},

  bulwark:     {id:'bulwark',     name:'Bulwark',       icon:'🏰', type:'defense', unique:true,  champ:'paladin',statId:'str', effect:'Apply [Shielded] for 8s. While [Shielded] is active, your next damaging card deals +50% damage.\nOffense through defense — the shield is the setup.'},

  // ── Spoils cards (earned from area clears, enemy-derived) ──
  rusty_stab:   {id:'rusty_stab',   name:'Rusty Stab',    icon:'🗡️', type:'attack',  unique:false, champ:null, statId:'str', effect:'Deal 8 damage. Apply [Poison] by 4.\n[Poison]: deals damage every 2s. Bypasses [Shield].', effects:[{type:'dmg',base:8}, {type:'poison',dpt:4,dur:8}]},

  leg_it_card:  {id:'leg_it_card',  name:'Leg It',         icon:'💨', type:'utility', unique:false, champ:null, statId:'agi', effect:'Draw speed +40% for 4s. Gain 30 mana.', effects:[{type:'draw_speed',pct:40,dur:4}, {type:'mana',amt:30}]},

  hex_bolt:     {id:'hex_bolt',     name:'Hex Bolt',       icon:'🔮', type:'debuff',  unique:false, champ:null, statId:'wis', effect:'Deal 5 damage. Apply [Cursed] for 4s.\n[Cursed]: enemy deals 15% less damage.', effects:[{type:'dmg',base:5}, {type:'cursed',dur:4}]},

  bone_slash:   {id:'bone_slash',   name:'Bone Slash',     icon:'💀', type:'attack',  unique:false, champ:null, statId:'str', effect:'Deal 14 damage. 20% chance: apply [Marked] for 3s.\n[Marked]: enemy takes 50% more damage from all sources.', effects:[{type:'dmg',base:14}, {type:'marked',dur:3}]},

  death_rattle: {id:'death_rattle', name:'Death Rattle',   icon:'☠️', type:'debuff',  unique:false, champ:null, statId:'wis', effect:'Apply [Cursed] for 8s. Increase [Poison] by 6.\n[Cursed]: enemy deals 15% less damage.', effects:[{type:'cursed',dur:8}, {type:'poison',dpt:6,dur:8}]},

  spore_cloud:  {id:'spore_cloud',  name:'Spore Cloud',    icon:'🍄', type:'debuff',  unique:false, champ:null, statId:'wis', effect:'Apply [Slow] for 6s. Increase [Poison] by 5.\n[Slow]: enemy attack speed reduced by 40%.', effects:[{type:'slow',dur:6}, {type:'poison',dpt:5,dur:8}]},

  web_shot:     {id:'web_shot',     name:'Web Shot',       icon:'🕸️', type:'debuff',  unique:false, champ:null, statId:'agi', effect:'Apply [Slow] for 5s. Apply [Dodge].\n[Dodge]: next incoming attack is evaded.', effects:[{type:'slow',dur:5}, {type:'dodge'}]},

  claw_rake:    {id:'claw_rake',    name:'Claw Rake',      icon:'🐾', type:'attack',  unique:false, champ:null, statId:'agi', effect:'Deal 6 damage three times rapidly.', effects:[{type:'dmg_multi',hits:3,dmg:6,delay:150}]},

  swamp_hex:    {id:'swamp_hex',    name:'Swamp Hex',      icon:'🌿', type:'debuff',  unique:false, champ:null, statId:'wis', effect:'Apply [Cursed] for 6s. Apply [Marked] for 3s.\n[Marked]: enemy takes 50% more damage from all sources.', effects:[{type:'cursed',dur:6}, {type:'marked',dur:3}]},

  mist_step:    {id:'mist_step',    name:'Mist Step',      icon:'🌫️', type:'utility', unique:false, champ:null, statId:'agi', effect:'Apply [Dodge]. Draw speed +50% for 2s.\n[Dodge]: next incoming attack is evaded.', effects:[{type:'dodge'}, {type:'draw_speed',pct:50,dur:2}]},

  wax_shell:    {id:'wax_shell',    name:'Wax Shell',      icon:'🕯️', type:'defense', unique:false, champ:null, statId:'str', effect:'Apply [Shield] (25) for 5s.\n[Shield] absorbs direct damage before HP. DoTs bypass it.', effects:[{type:'shield',amt:25,dur:5,onexpiry:'nothing',expiry_val:0}]},

  ember_strike: {id:'ember_strike', name:'Ember Strike',   icon:'🔥', type:'attack',  unique:false, champ:null, statId:'str', effect:'Deal 20 damage. Increase [Burn] by WIS.\n[Burn]: deals damage every 3s. Bypasses [Shield].', effects:[{type:'dmg',base:20}, {type:'burn_stat',base:0,stat:'wis',div:1,dur:9}, {type:'holy_flame'}]},

  dragon_breath:{id:'dragon_breath',name:'Dragon Breath',  icon:'🐲', type:'attack',  unique:false, champ:null, statId:'wis', effect:'Deal 12 damage three times. Increase [Burn] by WIS×2.\n[Burn]: deals damage every 3s. Bypasses [Shield].', effects:[{type:'dmg_multi',hits:3,dmg:12,delay:300}, {type:'burn_stat',base:0,stat:'wis',div:1,dur:9}, {type:'holy_flame'}]},
  ancient_roar: {id:'ancient_roar', name:'Ancient Roar',   icon:'🗣️', type:'debuff',  unique:false, champ:null, statId:'str', effect:'Apply [Marked] for 5s. Deal 10 damage.\n[Marked]: enemy takes 50% more damage from all sources.', effects:[{type:'marked',dur:5}, {type:'dmg',base:10}]},

  ghost_shadow_mark:{id:'ghost_shadow_mark',name:'Shadow Mark',icon:'🌑',type:'utility',unique:false,champ:'thief',statId:'agi',effect:'Apply 16 [Poison]. Your next card is guaranteed to [Crit].\n[Crit]: 1.5× damage, or 2× if the card has its own crit chance.'},
  quick_slash: {id:'quick_slash', name:'Quick Slash',   icon:'⚡', type:'attack',  unique:true,  champ:'thief', statId:'agi', effect:'Deal 10+AGI damage. 15% chance to [Crit]: deal double damage.\n[Crit]: a lucky strike that deals double damage.'},
  flicker:     {id:'flicker',     name:'Flicker',       icon:'💨', type:'attack',  unique:true,  champ:'thief', statId:'agi', effect:'Deal 5 damage. Draw speed +30% for 2s.\nHigher AGI means faster draws — Flicker stacks with itself.', effects:[{type:'dmg',base:5}, {type:'draw_speed',pct:30,dur:2}]},

  poison_dart: {id:'poison_dart', name:'Poison Dart',   icon:'🎯', type:'debuff',  unique:true,  champ:'thief', statId:'wis', effect:'Increase [Poison] by 8. 15% chance to [Crit]: detonate all [Poison] as instant damage.\n[Poison]: 8 damage every 2s. Bypasses [Shield]. Detonation also bypasses [Shield].'},
  backstab:    {id:'backstab',    name:'Backstab',      icon:'🗡️', type:'attack',  unique:true,  champ:'thief', statId:'agi', effect:'Deal 12 damage. If the enemy is debuffed: deal 45 instead.'},
  smoke_bomb:  {id:'smoke_bomb',  name:'Smoke Bomb',    icon:'💨', type:'debuff',  unique:true,  champ:'thief', statId:'agi', effect:'Apply [Slow] for 5s.\n[Slow]: enemy attack speed reduced by 40%.', effects:[{type:'slow',dur:5}]},

  shadow_step: {id:'shadow_step', name:'Shadow Step',   icon:'👣', type:'utility', unique:true,  champ:'thief', statId:'agi', effect:'Apply [Dodge]. Gain 50 mana.\n[Dodge]: next incoming attack is evaded.'},
  death_mark:  {id:'death_mark',  name:'Death Mark',    icon:'🩸', type:'debuff',  unique:true,  champ:'thief', statId:'wis', effect:'Apply [Marked] for 4s.\n[Marked]: enemy takes 50% more damage from all sources.', effects:[{type:'marked',dur:4}]},


  // ── Luna Sciurid ──
  ms_scratch:  {id:'ms_scratch',  name:'Scratch',       icon:'🐾', type:'attack',  unique:true, champ:'moonsquirrel', statId:'agi', effect:'Deal 6+AGI/2 damage. Small and fast — hits add up.', effects:[{type:'dmg_stat',base:6,stat:'agi',div:2}]},

  ms_frenzy:   {id:'ms_frenzy',   name:'Frenzy',        icon:'🌀', type:'attack',  unique:true, champ:'moonsquirrel', statId:'agi', effect:'Deal 5 damage. Draw speed +20% for 2s.\nStacks with Rapid Assault — Luna Sciurid becomes a blur.', effects:[{type:'dmg',base:5}, {type:'draw_speed',pct:20,dur:2}]},

  ms_moonburst:{id:'ms_moonburst',name:'Moonburst',     icon:'🌕', type:'attack',  unique:true, champ:'moonsquirrel', statId:'agi', effect:'Deal 3 damage 4 times. Each hit has a 20% chance to [Crit]: double damage.\n[Crit]: a lucky strike that deals double damage.'},
  ms_scurry:   {id:'ms_scurry',   name:'Scurry',        icon:'⚡', type:'utility', unique:true, champ:'moonsquirrel', statId:'agi', effect:'Draw speed +60% for 3s. Gain 20 mana.\nAt max AGI, Luna Sciurid practically teleports between cards.', effects:[{type:'draw_speed',pct:60,dur:3}, {type:'mana',amt:20}]},


  // ── Sewers ──
  // Giant Rat (frenzied)
  gr_gnaw:       {id:'gr_gnaw',       name:'Gnaw',          icon:'🐀', type:'attack',  unique:true, champ:'rat',         statId:'agi', effect:'Deal 4+AGI/3 damage. If you played a card in the last 2s: deal 8 instead.'},
  gr_dart:       {id:'gr_dart',       name:'Dart',          icon:'⚡', type:'utility', unique:true, champ:'rat',         statId:'agi', effect:'Draw speed +25% for 3s. Gain 10 mana.', effects:[{type:'draw_speed',pct:25,dur:3}, {type:'mana',amt:10}]},

  gr_frenzy_bite:{id:'gr_frenzy_bite',name:'Frenzy Bite',   icon:'🔴', type:'attack',  unique:true, champ:'rat',         statId:'agi', effect:'Deal 6 damage. Permanently reduce your draw interval by 3% (stacks, max 15%).'},
  // Mud Crab (hardened)
  mc2_claw:      {id:'mc2_claw',      name:'Claw Snap',     icon:'🦀', type:'attack',  unique:true, champ:'mudcrab',     statId:'str', effect:'Deal 5+STR/4 damage. If [Shield] is active: deal double.', effects:[{type:'dmg_if_debuff',base:5,high:10}]},

  mc2_shell:     {id:'mc2_shell',     name:'Shell Up',      icon:'🛡️', type:'defense', unique:true, champ:'mudcrab',     statId:'str', effect:'Apply [Shield] (STR×1.5) for 6s. On expiry: gain 25 mana.', effects:[{type:'shield_stat',mult:1.5,dur:6,onexpiry:'gain_mana',expiry_val:25}]},

  mc2_pinch:     {id:'mc2_pinch',     name:'Pinch',         icon:'🦀', type:'attack',  unique:true, champ:'mudcrab',     statId:'str', effect:'Deal 8 damage. If enemy is Slowed: reduce next 3 incoming hits by 2 each.', effects:[{type:'dmg',base:8}]},

  // Goblin Scout (scouts_alarm)
  go_slash:      {id:'go_slash',      name:'Slash',         icon:'👺', type:'attack',  unique:true, champ:'goblin',      statId:'agi', effect:'Deal 5 damage. If this is your 3rd+ card this battle: deal 8 instead.', effects:[{type:'dmg_if_debuff',base:5,high:8}]},

  go_rush:       {id:'go_rush',       name:'Rush',          icon:'🏃', type:'utility', unique:true, champ:'goblin',      statId:'agi', effect:'Draw speed +35% for 2s. Gain 15 mana. If [Rally] is active: gain 30 mana instead.', effects:[{type:'draw_speed',pct:35,dur:2}, {type:'mana',amt:15}]},

  go_warcry:     {id:'go_warcry',     name:'War Cry',       icon:'📯', type:'utility', unique:true, champ:'goblin',      statId:'agi', effect:'Deal 4 damage. +20% attack speed for 3s. After 15s this battle: permanently +15% speed.', effects:[{type:'dmg',base:4}, {type:'draw_speed',pct:20,dur:3}]},

  // Sewer Roach (skitter)
  sr_scuttle:    {id:'sr_scuttle',    name:'Scuttle',       icon:'🪲', type:'attack',  unique:true, champ:'roach',       statId:'agi', effect:'Deal 3 damage. If you have [Dodge]: deal 6 instead and gain 20 mana.', effects:[{type:'dmg_if_debuff',base:3,high:6}, {type:'mana',amt:20}]},

  sr_skitter:    {id:'sr_skitter',    name:'Skitter',       icon:'💨', type:'utility', unique:true, champ:'roach',       statId:'agi', effect:'Apply [Dodge]. Gain 15 mana. Draw speed +15% for 2s.', effects:[{type:'dodge'}, {type:'mana',amt:15}, {type:'draw_speed',pct:15,dur:2}]},

  sr_chitin:     {id:'sr_chitin',     name:'Chitin Strike', icon:'🪲', type:'attack',  unique:true, champ:'roach',       statId:'agi', effect:'Deal 5+AGI/4 damage. Apply [Dodge] after the hit.', effects:[{type:'dmg_stat',base:5,stat:'agi',div:4}, {type:'dodge'}]},

  // Bloated Grub (tough_hide)
  bg_slug:       {id:'bg_slug',       name:'Slug',          icon:'💢', type:'attack',  unique:true, champ:'grub',        statId:'str', effect:'Deal 4+STR/4 damage. Slow and heavy.', effects:[{type:'dmg_stat',base:4,stat:'str',div:4}]},

  bg_seep:       {id:'bg_seep',       name:'Seep',          icon:'🧪', type:'debuff',  unique:true, champ:'grub',        statId:'wis', effect:'Apply [Poison] by 5 to enemy. Gain 15 mana.', effects:[{type:'poison',dpt:5,dur:8}, {type:'mana',amt:15}]},

  bg_bloat:      {id:'bg_bloat',      name:'Bloat',         icon:'🫧', type:'defense', unique:true, champ:'grub',        statId:'str', effect:'Apply [Shield] (STR×1) for 5s. While [Shield] is active: enemy takes 2 Poison per second.', effects:[{type:'shield_stat',mult:1,dur:5,onexpiry:'nothing',expiry_val:0}]},


  // ── Bogmire Swamp ──
  // Bog Wisp (ethereal)
  bw_hex:        {id:'bw_hex',        name:'Hex Bolt',      icon:'🔮', type:'attack',  unique:true, champ:'wisp',        statId:'wis', effect:'Deal 4+WIS/3 damage. Apply [Cursed] for 4s.', effects:[{type:'dmg_stat',base:4,stat:'wis',div:3}, {type:'cursed',dur:4}]},

  bw_wisp:       {id:'bw_wisp',       name:'Will-o-Wisp',   icon:'💙', type:'utility', unique:true, champ:'wisp',        statId:'wis', effect:'Gain 40 mana. Apply [Dodge].', effects:[{type:'mana',amt:40}, {type:'dodge'}]},

  bw_drain:      {id:'bw_drain',      name:'Life Drain',    icon:'🌊', type:'attack',  unique:true, champ:'wisp',        statId:'wis', effect:'Deal 3 damage. Steal 15 mana from enemy and restore it to yourself.', effects:[{type:'dmg',base:3}, {type:'steal_mana',amt:15,dur:3}]},

  // Swamp Serpent (slither)
  ss_bite:       {id:'ss_bite',       name:'Bite',          icon:'🐍', type:'attack',  unique:true, champ:'snake',       statId:'agi', effect:'Deal 4+AGI/4 damage. Apply [Poison] by 4.', effects:[{type:'dmg_stat',base:4,stat:'agi',div:4}, {type:'poison',dpt:4,dur:8}]},

  ss_constrict:  {id:'ss_constrict',  name:'Constrict',     icon:'🌿', type:'debuff',  unique:true, champ:'snake',       statId:'agi', effect:'Apply [Slow] for 5s. Apply [Marked] for 3s.', effects:[{type:'slow',dur:5}, {type:'marked',dur:3}]},

  ss_venom:      {id:'ss_venom',      name:'Venom Strike',  icon:'⚡', type:'attack',  unique:true, champ:'snake',       statId:'wis', effect:'Deal 6 damage. If [Poison] is active: detonate 50% as instant damage.', effects:[{type:'dmg',base:6}, {type:'poison_detonate',reapply:'no',rdpt:4}]},

  // Toad King (bog_aura — enemy slower)
  tk_tongue:     {id:'tk_tongue',     name:'Tongue Lash',   icon:'🐸', type:'attack',  unique:true, champ:'toadking',    statId:'str', effect:'Deal 5+STR/5 damage. Apply [Slow] for 3s.', effects:[{type:'dmg_stat',base:5,stat:'str',div:5}, {type:'slow',dur:3}]},

  tk_croak:      {id:'tk_croak',      name:'Croak',         icon:'🌫️', type:'debuff',  unique:true, champ:'toadking',    statId:'wis', effect:'Apply [Cursed] for 6s. Apply [Slow] for 4s. Gain 20 mana.', effects:[{type:'cursed',dur:6}, {type:'slow',dur:4}, {type:'mana',amt:20}]},

  tk_mud_bomb:   {id:'tk_mud_bomb',   name:'Mud Bomb',      icon:'💣', type:'attack',  unique:true, champ:'toadking',    statId:'str', effect:'Deal 8 damage. Apply [Slow] for 5s. If enemy already Slowed: deal 14 instead.', effects:[{type:'dmg_if_debuff',base:8,high:14}, {type:'slow',dur:5}]},


  // ── The Forgotten Crypt ──
  // Skeleton (undying)
  sk_bone:       {id:'sk_bone',       name:'Bone Slash',    icon:'⚔️', type:'attack',  unique:true, champ:'skeleton',    statId:'str', effect:'Deal 5+STR/4 damage. If at full HP: deal 8 instead.', effects:[{type:'dmg_stat',base:5,stat:'str',div:4}]},

  sk_rattle:     {id:'sk_rattle',     name:'Rattle',        icon:'🎲', type:'utility', unique:true, champ:'skeleton',    statId:'agi', effect:'Gain 25 mana. Apply [Dodge].', effects:[{type:'mana',amt:25}, {type:'dodge'}]},

  sk_march:      {id:'sk_march',      name:'Death March',   icon:'💀', type:'utility', unique:true, champ:'skeleton',    statId:'agi', effect:'Deal 4 damage. Draw interval -5% for this battle (stacks indefinitely).'},
  // Cursed Witch (curse_mastery — debuffs 50% longer)
  cw_hex:        {id:'cw_hex',        name:'Hex',           icon:'🔮', type:'debuff',  unique:true, champ:'witch',       statId:'wis', effect:'Apply [Cursed] for 8s. Apply [Marked] for 4s. Curse Mastery extends both.', effects:[{type:'cursed',dur:8}, {type:'marked',dur:4}]},

  cw_curse:      {id:'cw_curse',      name:'Curse',         icon:'🌀', type:'debuff',  unique:true, champ:'witch',       statId:'wis', effect:'Apply [Cursed] for 6s. Gain 30 mana.', effects:[{type:'cursed',dur:6}, {type:'mana',amt:30}]},

  cw_hex_shield: {id:'cw_hex_shield', name:'Hex Shield',    icon:'🛡️', type:'defense', unique:true, champ:'witch',       statId:'wis', effect:'Apply [Shield] (12) for 5s. On expiry: apply [Cursed] to enemy for 5s.'},

  // ── Thornwood Forest ──
  // Forest Troll (regeneration)
  ft_club:       {id:'ft_club',       name:'Club',          icon:'🏔️', type:'attack',  unique:true, champ:'troll',       statId:'str', effect:'Deal 7+STR/5 damage. If you healed this battle: deal 10 instead.', effects:[{type:'dmg_stat',base:7,stat:'str',div:5}]},

  ft_rock:       {id:'ft_rock',       name:'Throw Rock',    icon:'🪨', type:'attack',  unique:true, champ:'troll',       statId:'str', effect:'Deal 5 damage. Apply [Slow] for 4s. Gain 20 mana.', effects:[{type:'dmg',base:5}, {type:'slow',dur:4}, {type:'mana',amt:20}]},

  ft_taunt:      {id:'ft_taunt',      name:'Taunt',         icon:'🛡️', type:'defense', unique:true, champ:'troll',       statId:'str', effect:'Apply [Shield] (STR×1.5) for 8s. Regeneration triggers immediately (+2 HP).', effects:[{type:'shield_stat',mult:1.5,dur:8,onexpiry:'nothing',expiry_val:0}, {type:'heal',amt:2}]},

  // Harpy (swoop — every 4th card double damage)
  ha_talon:      {id:'ha_talon',      name:'Talon Strike',  icon:'🦅', type:'attack',  unique:true, champ:'harpy',       statId:'agi', effect:'Deal 6+AGI/4 damage. Counts toward Swoop trigger.', effects:[{type:'dmg_stat',base:6,stat:'agi',div:4}]},

  ha_shriek:     {id:'ha_shriek',     name:'Shriek',        icon:'📢', type:'debuff',  unique:true, champ:'harpy',       statId:'agi', effect:'Apply [Slow] for 3s. Draw speed +20% for 2s.', effects:[{type:'slow',dur:3}, {type:'draw_speed',pct:20,dur:2}]},

  ha_gust:       {id:'ha_gust',       name:'Wind Gust',     icon:'💨', type:'utility', unique:true, champ:'harpy',       statId:'agi', effect:'Deal 4 damage. Apply [Dodge]. Draw speed +30% for 2s.', effects:[{type:'dmg',base:4}, {type:'dodge'}, {type:'draw_speed',pct:30,dur:2}]},

  // Bandit Captain (ambush)
  bc_stab:       {id:'bc_stab',       name:'Quick Stab',    icon:'🗡️', type:'attack',  unique:true, champ:'bandit',      statId:'agi', effect:'Deal 5+AGI/4 damage. If first card this battle: deal 12 instead.', effects:[{type:'dmg_stat',base:5,stat:'agi',div:4}]},

  bc_disarm:     {id:'bc_disarm',     name:'Disarm',        icon:'🙅', type:'debuff',  unique:true, champ:'bandit',      statId:'agi', effect:'Apply [Cursed] for 5s. Apply [Slow] for 3s.', effects:[{type:'cursed',dur:5}, {type:'slow',dur:3}]},

  bc_trick:      {id:'bc_trick',      name:'Dirty Trick',   icon:'🃏', type:'attack',  unique:true, champ:'bandit',      statId:'agi', effect:'Deal 4 damage. Apply [Marked] for 4s. Gain 20 mana.', effects:[{type:'dmg',base:4}, {type:'marked',dur:4}, {type:'mana',amt:20}]},


  // ── Eagle's Cave ──
  // Stone Golem (stone_skin)
  sg_pound:      {id:'sg_pound',      name:'Ground Pound',  icon:'🏔️', type:'attack',  unique:true, champ:'golem',       statId:'str', effect:'Deal 10+STR/5 damage. If enemy is Slowed: also Stun for 0.8s.', effects:[{type:'dmg_stat',base:10,stat:'str',div:5}, {type:'stun',dur:800}]},

  sg_throw:      {id:'sg_throw',      name:'Rock Throw',    icon:'🪨', type:'attack',  unique:true, champ:'golem',       statId:'str', effect:'Deal 7 damage. Apply [Slow] for 5s.', effects:[{type:'dmg',base:7}, {type:'slow',dur:5}]},

  sg_fortify:    {id:'sg_fortify',    name:'Fortify',       icon:'🛡️', type:'defense', unique:true, champ:'golem',       statId:'str', effect:'Apply [Shield] (STR×2) for 8s. On expiry: deal 6 damage to enemy.', effects:[{type:'shield_stat',mult:2,dur:8,onexpiry:'deal_dmg',expiry_val:6}]},


  // ── Deep Sewers ──
  // Sewer Wretch (filth_armour)
  sw_claw:       {id:'sw_claw',       name:'Claw Swipe',    icon:'🧟', type:'attack',  unique:true, champ:'wretch',      statId:'str', effect:'Deal 5+STR/4 damage. Apply [Poison] by 3.', effects:[{type:'dmg_stat',base:5,stat:'str',div:4}, {type:'poison',dpt:3,dur:8}]},

  sw_retch:      {id:'sw_retch',      name:'Retch',         icon:'🤮', type:'debuff',  unique:true, champ:'wretch',      statId:'wis', effect:'Apply [Cursed] for 5s. Apply [Poison] by 4. Gain 20 mana.', effects:[{type:'cursed',dur:5}, {type:'poison',dpt:4,dur:8}, {type:'mana',amt:20}]},

  sw_mend:       {id:'sw_mend',       name:'Mend',          icon:'🩹', type:'defense', unique:true, champ:'wretch',      statId:'str', effect:'Restore STR/4 HP. Apply [Shield] (8) for 3s.', effects:[{type:'heal',amt:5}, {type:'shield',amt:8,dur:3,onexpiry:'nothing',expiry_val:0}]},

  // Drain Lurker (lurk — first card double)
  dl_lunge:      {id:'dl_lunge',      name:'Lunge',         icon:'🐊', type:'attack',  unique:true, champ:'lurker',      statId:'str', effect:'Deal 8+STR/4 damage. Lurk makes this 16+ on the opener.', effects:[{type:'dmg_stat',base:8,stat:'str',div:4}]},

  dl_tail:       {id:'dl_tail',       name:'Tail Whip',     icon:'🌀', type:'attack',  unique:true, champ:'lurker',      statId:'agi', effect:'Deal 6 damage. Apply [Slow] for 5s.', effects:[{type:'dmg',base:6}, {type:'slow',dur:5}]},

  dl_drag:       {id:'dl_drag',       name:'Drag Under',    icon:'💧', type:'attack',  unique:true, champ:'lurker',      statId:'str', effect:'Deal 9 damage. Apply [Marked] for 4s. Gain 25 mana.', effects:[{type:'dmg',base:9}, {type:'marked',dur:4}, {type:'mana',amt:25}]},

  // Plague Carrier (infectious — DoTs +40% longer)
  pc_infect:     {id:'pc_infect',     name:'Infect',        icon:'🦟', type:'debuff',  unique:true, champ:'plague',      statId:'wis', effect:'Apply [Poison] by 6. Gain 15 mana. With Infectious: Poison lasts 40% longer.', effects:[{type:'poison',dpt:6,dur:8}, {type:'mana',amt:15}]},

  pc_bite:       {id:'pc_bite',       name:'Plague Bite',   icon:'🦠', type:'attack',  unique:true, champ:'plague',      statId:'agi', effect:'Deal 3+AGI/4 damage. Apply [Poison] by 3.', effects:[{type:'dmg_stat',base:3,stat:'agi',div:4}, {type:'poison',dpt:3,dur:8}]},

  pc_spore:      {id:'pc_spore',      name:'Spore Cloud',   icon:'🌫️', type:'debuff',  unique:true, champ:'plague',      statId:'wis', effect:'Apply [Slow] for 5s. Apply [Poison] by 4.', effects:[{type:'slow',dur:5}, {type:'poison',dpt:4,dur:8}]},


  // ── Foul Depths ──
  // Sewer Watcher (malevolent_gaze — enemy mana regen -30%)
  wa_gaze:       {id:'wa_gaze',       name:'Gaze',          icon:'👁️', type:'attack',  unique:true, champ:'watcher',     statId:'wis', effect:'Deal 4 damage. Steal 20 mana from enemy (reduce their mana by 20 for 3s).', effects:[{type:'dmg',base:4}, {type:'steal_mana',amt:20,dur:3}]},

  wa_crush:      {id:'wa_crush',      name:'Psychic Crush', icon:'🧠', type:'attack',  unique:true, champ:'watcher',     statId:'wis', effect:'Deal 8+WIS/4 damage. Apply [Cursed] for 5s.', effects:[{type:'dmg_stat',base:8,stat:'wis',div:4}, {type:'cursed',dur:5}]},

  wa_tendrils:   {id:'wa_tendrils',   name:'Tendrils',      icon:'🐙', type:'attack',  unique:true, champ:'watcher',     statId:'wis', effect:'Deal 5 damage. Apply [Slow] for 4s. Apply [Marked] for 3s.', effects:[{type:'dmg',base:5}, {type:'slow',dur:4}, {type:'marked',dur:3}]},

  // Amalgam (adaptive — taking 5+ damage builds resistance stacks)
  am_crush:      {id:'am_crush',      name:'Crush',         icon:'💪', type:'attack',  unique:true, champ:'amalgam',     statId:'str', effect:'Deal 8+STR/5 damage. +5% damage per Adaptive stack active.', effects:[{type:'dmg_stat',base:8,stat:'str',div:5}]},

  am_absorb:     {id:'am_absorb',     name:'Absorb',        icon:'🧬', type:'defense', unique:true, champ:'amalgam',     statId:'str', effect:'Apply [Shield] (STR×1) for 5s. On expiry: triggers as if you were hit for 5+ damage (+1 Adaptive).', effects:[{type:'shield_stat',mult:1,dur:5,onexpiry:'nothing',expiry_val:0}]},

  am_lash:       {id:'am_lash',       name:'Lash',          icon:'🌊', type:'attack',  unique:true, champ:'amalgam',     statId:'str', effect:'Deal 6 damage 2 times. Each hit of 5+ damage grants an Adaptive stack.', effects:[{type:'dmg_multi',hits:2,dmg:6,delay:200}]},


  // ── Sunken Harbour ──
  tc_slam:   {id:'tc_slam',   name:'Shell Slam',    icon:'🦀',type:'attack', unique:true,champ:'tidecrab',   statId:'str',effect:'Deal 6+STR/4 dmg. If [Shield] active: +4 dmg and Stun 0.5s.', effects:[{type:'dmg_stat',base:6,stat:'str',div:4}, {type:'stun',dur:500}]},

  tc_harden: {id:'tc_harden', name:'Harden',         icon:'🛡️',type:'defense',unique:true,champ:'tidecrab',   statId:'str',effect:'Apply [Shield] (STR×1.5) 6s. Absorbs first 4 dmg of each hit while active.', effects:[{type:'shield_stat',mult:1.5,dur:6,onexpiry:'nothing',expiry_val:0}]},

  tc_snap:   {id:'tc_snap',   name:'Snap',           icon:'🌊',type:'attack', unique:true,champ:'tidecrab',   statId:'agi',effect:'Deal 4 dmg. Apply [Slow] 3s. If enemy already Slowed: deal 8 instead.', effects:[{type:'dmg_if_debuff',base:4,high:8}, {type:'slow',dur:3}]},

  ds_anchor: {id:'ds_anchor', name:'Anchor Swing',   icon:'⚓',type:'attack', unique:true,champ:'drownedsailor',statId:'str',effect:'Deal 10+STR/3 dmg. Slow and inevitable.', effects:[{type:'dmg_stat',base:10,stat:'str',div:3}]},

  ds_barnacle:{id:'ds_barnacle',name:'Barnacle Hurl',icon:'💀',type:'attack', unique:true,champ:'drownedsailor',statId:'str',effect:'Deal 5 dmg. Apply [Slow] 4s. Gain 20 mana.', effects:[{type:'dmg',base:5}, {type:'slow',dur:4}, {type:'mana',amt:20}]},
  ds_drag:   {id:'ds_drag',   name:'Drag Under',     icon:'🌊',type:'attack', unique:true,champ:'drownedsailor',statId:'str',effect:'Deal 7 dmg. Apply [Marked] 4s. Gain 25 mana.', effects:[{type:'dmg',base:7}, {type:'marked',dur:4}, {type:'mana',amt:25}]},

  is_slap:   {id:'is_slap',   name:'Tentacle Slap',  icon:'🦑',type:'attack', unique:true,champ:'inksquall',  statId:'agi',effect:'Deal 3+AGI/4 dmg. If [Dodge] active: deal 6 and reset Dodge.', effects:[{type:'dmg_stat',base:3,stat:'agi',div:4}]},

  is_burst:  {id:'is_burst',  name:'Ink Burst',      icon:'💨',type:'utility',unique:true,champ:'inksquall',  statId:'agi',effect:'Apply [Dodge]. Apply [Slow] to enemy 3s. Gain 15 mana.', effects:[{type:'dodge'}, {type:'slow',dur:3}, {type:'mana',amt:15}]},

  is_web:    {id:'is_web',    name:'Web Shot',        icon:'🕸️',type:'debuff', unique:true,champ:'inksquall',  statId:'agi',effect:'Deal 4 dmg. Apply [Slow] 5s. Apply [Marked] 3s.', effects:[{type:'dmg',base:4}, {type:'slow',dur:5}, {type:'marked',dur:3}]},

  si_song:   {id:'si_song',   name:'Song',            icon:'🎵',type:'debuff', unique:true,champ:'siren',      statId:'wis',effect:'Apply [Cursed] 5s. Apply [Slow] 3s. Gain 20 mana.', effects:[{type:'cursed',dur:5}, {type:'slow',dur:3}, {type:'mana',amt:20}]},

  si_wail:   {id:'si_wail',   name:'Wail',            icon:'💙',type:'attack', unique:true,champ:'siren',      statId:'wis',effect:'Deal 4+WIS/3 dmg. Apply [Cursed] 4s.', effects:[{type:'dmg_stat',base:4,stat:'wis',div:3}, {type:'cursed',dur:4}]},

  si_enchant:{id:'si_enchant',name:'Enchant',         icon:'✨',type:'utility',unique:true,champ:'siren',      statId:'wis',effect:'Gain 35 mana. Apply [Dodge]. Lure intensifies: enemy -10% extra attack speed 4s.', effects:[{type:'mana',amt:35}, {type:'dodge'}, {type:'slow',dur:4}]},
  sk2_fin:   {id:'sk2_fin',   name:'Fin Slash',       icon:'🦈',type:'attack', unique:true,champ:'sharknight', statId:'agi',effect:'Deal 5+AGI/4 dmg. Below 50% HP: deal 8 instead.', effects:[{type:'dmg_stat',base:5,stat:'agi',div:4}]},

  sk2_chomp: {id:'sk2_chomp', name:'Chomp',           icon:'💢',type:'attack', unique:true,champ:'sharknight', statId:'str',effect:'Deal 9 dmg. Below 50% HP: also apply [Marked] 3s.', effects:[{type:'dmg',base:9}, {type:'marked',dur:3}]},

  sk2_frenzy:{id:'sk2_frenzy',name:'Blood Frenzy',    icon:'🩸',type:'utility',unique:true,champ:'sharknight', statId:'agi',effect:'Deal 4 dmg. Below 50% HP: permanent +10% draw speed (stacks, max 30%).', effects:[{type:'dmg',base:4}, {type:'draw_speed',pct:10,dur:2}]},

  // ── Char Mines ──
  fs_ember:  {id:'fs_ember',  name:'Ember Touch',    icon:'🔥',type:'attack', unique:true,champ:'flamesprite', statId:'agi',effect:'Deal 3+AGI/4 dmg. Apply Burn (2/3s) to enemy.', effects:[{type:'dmg_stat',base:3,stat:'agi',div:4}, {type:'burn',dpt:2,dur:9}]},

  fs_scatter:{id:'fs_scatter',name:'Scatter',         icon:'💨',type:'utility',unique:true,champ:'flamesprite', statId:'agi',effect:'Draw speed +40% 3s. Gain 15 mana.', effects:[{type:'draw_speed',pct:40,dur:3}, {type:'mana',amt:15}]},
  fs_detonate:{id:'fs_detonate',name:'Detonate',      icon:'💥',type:'attack', unique:true,champ:'flamesprite', statId:'wis',effect:'Deal 5 dmg. If enemy has [Burn]: detonate (triple remaining Burn as instant dmg, bypasses Shield).', effects:[{type:'dmg',base:5}, {type:'burn_detonate',reapply:'no',rdpt:0}]},
  eg_smash:  {id:'eg_smash',  name:'Boulder Smash',  icon:'🏔️',type:'attack', unique:true,champ:'embergolem',  statId:'str',effect:'Deal 8+STR/5 dmg. If Molten Core active: +4 dmg.', effects:[{type:'dmg_stat',base:8,stat:'str',div:5}]},

  eg_sear:   {id:'eg_sear',   name:'Sear',            icon:'🔥',type:'debuff', unique:true,champ:'embergolem',  statId:'wis',effect:'Apply Burn (WIS/2+2 per 3s) to enemy. Gain 15 mana.', effects:[{type:'burn_stat',base:2,stat:'wis',div:2,dur:9}, {type:'mana',amt:15}]},

  eg_shell:  {id:'eg_shell',  name:'Magma Shell',     icon:'🛡️',type:'defense',unique:true,champ:'embergolem',  statId:'str',effect:'Apply [Shield] (STR) 6s. While active: enemy takes 2 Burn per second.', effects:[{type:'shield_stat',mult:1,dur:6,onexpiry:'nothing',expiry_val:0}]},

  ab_wing:   {id:'ab_wing',   name:'Wing Slash',      icon:'🦇',type:'attack', unique:true,champ:'ashbat',      statId:'agi',effect:'Deal 4+AGI/4 dmg. Apply [Dodge].', effects:[{type:'dmg_stat',base:4,stat:'agi',div:4}, {type:'dodge'}]},

  ab_dive:   {id:'ab_dive',   name:'Dive',            icon:'💨',type:'attack', unique:true,champ:'ashbat',      statId:'agi',effect:'Deal 7 dmg. Apply [Slow] 3s on enemy.', effects:[{type:'dmg',base:7}, {type:'slow',dur:3}]},

  ab_shroud: {id:'ab_shroud', name:'Soot Shroud',     icon:'🌑',type:'utility',unique:true,champ:'ashbat',      statId:'agi',effect:'Apply [Dodge]. Draw speed +30% 3s. Immune to Soot Cloud slow on next hit.', effects:[{type:'dodge'}, {type:'draw_speed',pct:30,dur:3}]},

  mg_pick:   {id:'mg_pick',   name:'Pick Swing',      icon:'⛏️',type:'attack', unique:true,champ:'mineghoul',   statId:'str',effect:'Deal 5+STR/4 dmg. After 6s in battle: deal 9 instead (Dug In bonus).', effects:[{type:'dmg_stat',base:5,stat:'str',div:4}]},

  mg_cavein: {id:'mg_cavein', name:'Cave-In',         icon:'🪨',type:'attack', unique:true,champ:'mineghoul',   statId:'str',effect:'Deal 4 dmg. Stun enemy 0.8s. Gain 20 mana.', effects:[{type:'dmg',base:4}, {type:'stun',dur:800}, {type:'mana',amt:20}]},

  mg_digin:  {id:'mg_digin',  name:'Dig In',          icon:'💪',type:'utility',unique:true,champ:'mineghoul',   statId:'str',effect:'Gain 25 mana. Draw speed +20% 3s. After 6s: also gain permanent +10% dmg.', effects:[{type:'mana',amt:25}, {type:'draw_speed',pct:20,dur:3}]},

  lc_slam:   {id:'lc_slam',   name:'Lava Slam',       icon:'🌋',type:'attack', unique:true,champ:'lavacrawler', statId:'str',effect:'Deal 7+STR/5 dmg. Apply Burn (3/3s) to enemy.', effects:[{type:'dmg_stat',base:7,stat:'str',div:5}, {type:'burn',dpt:3,dur:9}]},

  lc_spray:  {id:'lc_spray',  name:'Magma Spray',     icon:'💥',type:'debuff', unique:true,champ:'lavacrawler', statId:'wis',effect:'Apply Burn (2/3s, stacking). Apply [Slow] 3s. Gain 10 mana.', effects:[{type:'burn',dpt:2,dur:9}, {type:'slow',dur:3}, {type:'mana',amt:10}]},

  lc_burst:  {id:'lc_burst',  name:'Trail Burst',     icon:'🔥',type:'attack', unique:true,champ:'lavacrawler', statId:'wis',effect:'Detonate all Burn as instant dmg (bypasses Shield). Reapply Burn (4/3s). Deal 6 dmg.', effects:[{type:'dmg',base:6}, {type:'burn_detonate',reapply:'yes',rdpt:4}]},


  // ── Mistwoods ──
  mr_talon:  {id:'mr_talon',  name:'Talon Strike',    icon:'🐦‍⬛',type:'attack',unique:true,champ:'mistraven',  statId:'agi',effect:'Deal 5+AGI/4 dmg. If [Dodge] active: deal 9 instead and keep Dodge.', effects:[{type:'dmg_stat',base:5,stat:'agi',div:4}]},

  mr_mist:   {id:'mr_mist',   name:'Mist Step',       icon:'🌫️',type:'utility',unique:true,champ:'mistraven',  statId:'agi',effect:'Apply [Dodge]. Draw speed +35% 2s. Gain 15 mana.', effects:[{type:'dodge'}, {type:'draw_speed',pct:35,dur:2}, {type:'mana',amt:15}]},

  mr_dive:   {id:'mr_dive',   name:'Dive',            icon:'💨',type:'attack', unique:true,champ:'mistraven',  statId:'agi',effect:'Deal 8 dmg. Apply [Dodge] after. Vanish on impact.', effects:[{type:'dmg',base:8}, {type:'dodge'}]},

  fg_chill:  {id:'fg_chill',  name:'Chill',           icon:'👻',type:'attack', unique:true,champ:'foghast',    statId:'wis',effect:'Deal 3+WIS/4 dmg. Apply [Slow] 4s.', effects:[{type:'dmg_stat',base:3,stat:'wis',div:4}, {type:'slow',dur:4}]},

  fg_soul:   {id:'fg_soul',   name:'Soul Pull',       icon:'🌊',type:'attack', unique:true,champ:'foghast',    statId:'wis',effect:'Deal 4 dmg. Steal 20 mana from enemy. Gain 20 mana.', effects:[{type:'dmg',base:4}, {type:'steal_mana',amt:20,dur:3}, {type:'mana',amt:20}]},

  fg_wail:   {id:'fg_wail',   name:'Wail',            icon:'💀',type:'attack', unique:true,champ:'foghast',    statId:'wis',effect:'Deal 5+WIS/4 dmg. Apply [Cursed] 5s. Apply [Marked] 3s.', effects:[{type:'dmg_stat',base:5,stat:'wis',div:4}, {type:'cursed',dur:5}, {type:'marked',dur:3}]},

  ne_roots:  {id:'ne_roots',  name:'Grasping Roots',  icon:'🌿',type:'attack', unique:true,champ:'nightentling',statId:'str',effect:'Deal 5+STR/5 dmg. Apply [Slow] 4s. Stun 0.5s.', effects:[{type:'dmg_stat',base:5,stat:'str',div:5}, {type:'slow',dur:4}, {type:'stun',dur:500}]},

  ne_bloom:  {id:'ne_bloom',  name:'Night Bloom',     icon:'🌺',type:'utility',unique:true,champ:'nightentling',statId:'wis',effect:'Heal STR/5 HP. Gain 20 mana. Deep Roots triggers immediately.', effects:[{type:'heal',amt:5}, {type:'mana',amt:20}]},

  ne_bark:   {id:'ne_bark',   name:'Bark Armour',     icon:'🌱',type:'defense',unique:true,champ:'nightentling',statId:'str',effect:'Apply [Shield] (STR×1.5) 6s. While Shielded: regen triggers every 3s instead of 5s.', effects:[{type:'shield_stat',mult:1.5,dur:6,onexpiry:'nothing',expiry_val:0}]},

  ow_web:    {id:'ow_web',    name:'Web Shot',        icon:'🕸️',type:'debuff', unique:true,champ:'orbweaver',  statId:'agi',effect:'Apply [Slow] 5s (→10s via Web Mastery). Deal 3 dmg.', effects:[{type:'slow',dur:5}, {type:'dmg',base:3}]},

  ow_venom:  {id:'ow_venom',  name:'Venom Bite',      icon:'🕷️',type:'attack', unique:true,champ:'orbweaver',  statId:'agi',effect:'Deal 5+AGI/4 dmg. Apply [Poison] 5.', effects:[{type:'dmg_stat',base:5,stat:'agi',div:4}, {type:'poison',dpt:5,dur:8}]},

  ow_cocoon: {id:'ow_cocoon', name:'Cocoon Wrap',     icon:'🌀',type:'debuff', unique:true,champ:'orbweaver',  statId:'wis',effect:'Apply [Slow] 4s (→8s). Apply [Marked] 4s. Gain 20 mana.', effects:[{type:'slow',dur:4}, {type:'marked',dur:4}, {type:'mana',amt:20}]},

  mo_rake:   {id:'mo_rake',   name:'Talon Rake',      icon:'🦉',type:'attack', unique:true,champ:'maskedowl',  statId:'agi',effect:'Deal 6+AGI/4 dmg. If first card this battle: deal 12 and gain [Dodge].', effects:[{type:'dmg_stat',base:6,stat:'agi',div:4}]},

  mo_glide:  {id:'mo_glide',  name:'Silent Glide',    icon:'🌑',type:'utility',unique:true,champ:'maskedowl',  statId:'agi',effect:'Apply [Dodge]. Draw speed +25% 3s. Gain 10 mana.', effects:[{type:'dodge'}, {type:'draw_speed',pct:25,dur:3}, {type:'mana',amt:10}]},

  mo_screech:{id:'mo_screech',name:'Screech',         icon:'🎯',type:'debuff', unique:true,champ:'maskedowl',  statId:'wis',effect:'Apply [Cursed] 5s. Apply [Slow] 3s. Resets Silent Strike — next card treated as first.', effects:[{type:'cursed',dur:5}, {type:'slow',dur:3}]},

  // ── Wax Dunes ──
  ws_strike: {id:'ws_strike', name:'Wax Strike',      icon:'⚔️',type:'attack', unique:true,champ:'waxsoldier', statId:'str',effect:'Deal 5+STR/4 dmg. Gain 8 mana (Slow Melt fuels every swing).', effects:[{type:'dmg_stat',base:5,stat:'str',div:4}, {type:'mana',amt:8}]},

  ws_harden: {id:'ws_harden', name:'Wax Harden',      icon:'🛡️',type:'defense',unique:true,champ:'waxsoldier', statId:'str',effect:'Apply [Shield] (STR×1.5) 5s. Mana regen +50% while Shield holds.', effects:[{type:'shield_stat',mult:1.5,dur:5,onexpiry:'nothing',expiry_val:0}]},

  ws_lunge:  {id:'ws_lunge',  name:'Wax Lunge',       icon:'🕯️',type:'attack', unique:true,champ:'waxsoldier', statId:'str',effect:'Deal 7 dmg. Apply [Slow] 3s. Gain 12 mana.', effects:[{type:'dmg',base:7}, {type:'slow',dur:3}, {type:'mana',amt:12}]},

  wh_snap:   {id:'wh_snap',   name:'Wax Snap',        icon:'🐕',type:'attack', unique:true,champ:'waxhound',   statId:'agi',effect:'Deal 4+AGI/4 dmg. Below 30% HP: deal 7 instead.', effects:[{type:'dmg_stat',base:4,stat:'agi',div:4}]},

  wh_dash:   {id:'wh_dash',   name:'Wax Dash',        icon:'💨',type:'utility',unique:true,champ:'waxhound',   statId:'agi',effect:'Draw speed +40% 3s. Gain 15 mana. At low HP: also apply [Dodge].', effects:[{type:'draw_speed',pct:40,dur:3}, {type:'mana',amt:15}]},

  wh_howl:   {id:'wh_howl',   name:'Wax Howl',        icon:'🐺',type:'debuff', unique:true,champ:'waxhound',   statId:'wis',effect:'Apply [Cursed] 4s. Apply [Slow] 3s. Below 20% HP: also gain 30 mana.', effects:[{type:'cursed',dur:4}, {type:'slow',dur:3}]},

  dc_crush:  {id:'dc_crush',  name:'Wax Crush',       icon:'🪲',type:'attack', unique:true,champ:'dunecrawler',statId:'str',effect:'Deal 6+STR/4 dmg. Slow and powerful.', effects:[{type:'dmg_stat',base:6,stat:'str',div:4}]},

  dc_burrow: {id:'dc_burrow', name:'Wax Burrow',      icon:'🏜️',type:'defense',unique:true,champ:'dunecrawler',statId:'str',effect:'Apply [Shield] (STR) 5s. On expiry: deal 4 dmg to enemy.', effects:[{type:'shield_stat',mult:1,dur:5,onexpiry:'deal_dmg',expiry_val:4}]},

  dc_grind:  {id:'dc_grind',  name:'Wax Grind',       icon:'🔥',type:'attack', unique:true,champ:'dunecrawler',statId:'agi',effect:'Deal 5 dmg 2 times. Each hit reduces enemy ATK 5% for 3s (stacks).', effects:[{type:'dmg_multi',hits:2,dmg:5,delay:200}, {type:'slow',dur:3}]},

  we_pulse:  {id:'we_pulse',  name:'Wax Pulse',       icon:'🗿',type:'attack', unique:true,champ:'waxeffigy',  statId:'wis',effect:'Deal 4+WIS/4 dmg. If this is the free Effigy card: deal 7 instead.', effects:[{type:'dmg_stat',base:4,stat:'wis',div:4}]},

  we_curse:  {id:'we_curse',  name:'Wax Curse',       icon:'🌑',type:'debuff', unique:true,champ:'waxeffigy',  statId:'wis',effect:'Apply [Cursed] 5s. Apply [Marked] 3s. Gain 20 mana.', effects:[{type:'cursed',dur:5}, {type:'marked',dur:3}, {type:'mana',amt:20}]},

  we_mimic:  {id:'we_mimic',  name:'Mimic',           icon:'🪄',type:'attack', unique:true,champ:'waxeffigy',  statId:'wis',effect:'Copy the enemy\'s last card effect at 75% potency.'},
  wo_pulse:  {id:'wo_pulse',  name:'Wax Pulse',       icon:'✨',type:'attack', unique:true,champ:'waxoasis',   statId:'wis',effect:'Deal 5+WIS/4 dmg. Gain 15 mana.', effects:[{type:'dmg_stat',base:5,stat:'wis',div:4}, {type:'mana',amt:15}]},

  wo_flow:   {id:'wo_flow',   name:'Golden Flow',     icon:'💛',type:'utility',unique:true,champ:'waxoasis',   statId:'wis',effect:'Gain 50 mana. Apply [Shield] (WIS×1) 4s.', effects:[{type:'mana',amt:50}, {type:'shield_stat',mult:1,dur:4,onexpiry:'nothing',expiry_val:0}]},

  wo_overflow:{id:'wo_overflow',name:'Overflow',      icon:'🌟',type:'attack', unique:true,champ:'waxoasis',   statId:'wis',effect:'Deal 8+WIS/5 dmg. If mana above 75%: deal 12 instead.', effects:[{type:'dmg_stat',base:8,stat:'wis',div:5}]},

  // ── Sunken Ruins / Shattered Vault ──
  dk_slash:  {id:'dk_slash',  name:'Dark Slash',      icon:'⚔️',type:'attack', unique:true,champ:'knight',     statId:'str',effect:'Deal 8+STR/5 dmg. Below 50% HP: +4 and ignore Iron Will reduction.', effects:[{type:'dmg_stat',base:8,stat:'str',div:5}]},

  dk_bash:   {id:'dk_bash',   name:'Shield Bash',     icon:'🛡️',type:'attack', unique:true,champ:'knight',     statId:'str',effect:'Deal 6 dmg. Apply [Slow] 4s. Apply [Shield] (STR) 5s.', effects:[{type:'dmg',base:6}, {type:'slow',dur:4}, {type:'shield_stat',mult:1,dur:5,onexpiry:'nothing',expiry_val:0}]},

  dk_intim:  {id:'dk_intim',  name:'Intimidate',      icon:'😰',type:'debuff', unique:true,champ:'knight',     statId:'wis',effect:'Apply [Cursed] 6s. Apply [Marked] 4s. Gain 25 mana.', effects:[{type:'cursed',dur:6}, {type:'marked',dur:4}, {type:'mana',amt:25}]},

  ow2_slam:  {id:'ow2_slam',  name:'Slam',            icon:'💢',type:'attack', unique:true,champ:'orc',        statId:'str',effect:'Deal 7+STR/5 dmg. Below 33% HP: deal 14 instead (Battle Rage).', effects:[{type:'dmg_if_hp_low',base:7,high:14,threshold:33}]},

  ow2_cry:   {id:'ow2_cry',   name:'War Cry',         icon:'📣',type:'utility',unique:true,champ:'orc',        statId:'agi',effect:'+30% draw speed 3s. Gain 20 mana. Apply [Marked] 3s.', effects:[{type:'draw_speed',pct:30,dur:3}, {type:'mana',amt:20}, {type:'marked',dur:3}]},

  ow2_ground:{id:'ow2_ground',name:'Ground Slam',     icon:'🏔️',type:'attack', unique:true,champ:'orc',        statId:'str',effect:'Deal 9 dmg. Stun 0.8s. Apply [Slow] 4s.', effects:[{type:'dmg',base:9}, {type:'stun',dur:800}, {type:'slow',dur:4}]},
  cu_hex:    {id:'cu_hex',    name:'Hex Wave',        icon:'🔮',type:'attack', unique:true,champ:'cursedurn',   statId:'wis',effect:'Deal 4+WIS/4 dmg. Apply [Cursed] 5s.', effects:[{type:'dmg_stat',base:4,stat:'wis',div:4}, {type:'cursed',dur:5}]},

  cu_overflow:{id:'cu_overflow',name:'Overflow',      icon:'🌀',type:'attack', unique:true,champ:'cursedurn',   statId:'wis',effect:'Deal 6 dmg. Gain 25 mana. Each Overcharge stack adds +5 bonus dmg.', effects:[{type:'dmg',base:6}, {type:'mana',amt:25}]},
  cu_surge:  {id:'cu_surge',  name:'Surge',           icon:'⚡',type:'utility',unique:true,champ:'cursedurn',   statId:'agi',effect:'Draw speed +20% 3s. Gain 20 mana. +1 Overcharge stack immediately.', effects:[{type:'draw_speed',pct:20,dur:3}, {type:'mana',amt:20}]},

  is2_guard: {id:'is2_guard', name:'Guard Strike',    icon:'⚔️',type:'attack', unique:true,champ:'ironsentinel',statId:'str',effect:'Deal 7+STR/5 dmg. Apply [Shield] (6) 3s after hit.', effects:[{type:'dmg_stat',base:7,stat:'str',div:5}, {type:'shield',amt:6,dur:3,onexpiry:'nothing',expiry_val:0}]},

  is2_lock:  {id:'is2_lock',  name:'Lockdown',        icon:'🔒',type:'utility',unique:true,champ:'ironsentinel',statId:'str',effect:'Stun enemy 1s. Apply [Slow] 4s. Gain 20 mana.', effects:[{type:'stun',dur:1000}, {type:'slow',dur:4}, {type:'mana',amt:20}]},

  is2_fort:  {id:'is2_fort',  name:'Fortify',         icon:'🛡️',type:'defense',unique:true,champ:'ironsentinel',statId:'str',effect:'Apply [Shield] (STR×2) 8s. Draw speed +15% while active.', effects:[{type:'shield_stat',mult:2,dur:8,onexpiry:'nothing',expiry_val:0}]},

  vs2_gaze:  {id:'vs2_gaze',  name:'Gaze',            icon:'👁️',type:'attack', unique:true,champ:'vaultspectre',statId:'wis',effect:'Deal 4+WIS/4 dmg. Steal 20 mana from enemy.', effects:[{type:'dmg_stat',base:4,stat:'wis',div:4}, {type:'steal_mana',amt:20,dur:3}]},

  vs2_crush: {id:'vs2_crush', name:'Psychic Crush',   icon:'🧠',type:'attack', unique:true,champ:'vaultspectre',statId:'wis',effect:'Deal 7+WIS/4 dmg. Apply [Cursed] 5s.', effects:[{type:'dmg_stat',base:7,stat:'wis',div:4}, {type:'cursed',dur:5}]},

  vs2_tendrils:{id:'vs2_tendrils',name:'Tendrils',    icon:'🌑',type:'attack', unique:true,champ:'vaultspectre',statId:'wis',effect:'Deal 5 dmg. Apply [Slow] 4s. Apply [Marked] 3s.', effects:[{type:'dmg',base:5}, {type:'slow',dur:4}, {type:'marked',dur:3}]},

  // ── Dragon's Nest / Boneyard / Drowned Temple ──
  fw_claw:   {id:'fw_claw',   name:'Claw Swipe',      icon:'🔥',type:'attack', unique:true,champ:'wyrm',       statId:'str',effect:'Deal 7+STR/5 dmg. Apply Burn (WIS/3+2 per 3s).', effects:[{type:'dmg_stat',base:7,stat:'str',div:5}, {type:'burn_stat',base:2,stat:'wis',div:3,dur:9}]},

  fw_breath: {id:'fw_breath', name:'Fire Breath',     icon:'💨',type:'debuff', unique:true,champ:'wyrm',       statId:'wis',effect:'Apply Burn (WIS/2+3 per 3s, stacking). Gain 20 mana.', effects:[{type:'burn_stat',base:3,stat:'wis',div:2,dur:9}, {type:'mana',amt:20}]},

  fw_surge:  {id:'fw_surge',  name:'Flame Surge',     icon:'🌊',type:'attack', unique:true,champ:'wyrm',       statId:'wis',effect:'Detonate all Burn as instant dmg. Reapply Burn (WIS/2 per 3s). Deal 6 dmg.', effects:[{type:'dmg',base:6}, {type:'burn_detonate',reapply:'yes',rdpt:4}]},

  ed_bite:   {id:'ed_bite',   name:'Dragon Bite',     icon:'🐲',type:'attack', unique:true,champ:'dragon',     statId:'str',effect:'Deal 10+STR/5 dmg. Below 25% HP: deal 20 (Ancient Fury doubles).', effects:[{type:'dmg_stat',base:10,stat:'str',div:5}]},

  ed_blast:  {id:'ed_blast',  name:'Wing Blast',      icon:'💨',type:'attack', unique:true,champ:'dragon',     statId:'agi',effect:'Deal 8 dmg. Apply [Slow] 5s. Apply [Marked] 4s.', effects:[{type:'dmg',base:8}, {type:'slow',dur:5}, {type:'marked',dur:4}]},

  ed_breath: {id:'ed_breath', name:'Dragon Breath',   icon:'🔥',type:'attack', unique:true,champ:'dragon',     statId:'wis',effect:'Deal 6 dmg 3 times. Apply Burn (WIS/3+3 per 3s, stacking).', effects:[{type:'dmg_multi',hits:3,dmg:6,delay:300}, {type:'burn_stat',base:3,stat:'wis',div:3,dur:9}]},

  lk_bolt:   {id:'lk_bolt',   name:'Death Bolt',      icon:'💀',type:'attack', unique:true,champ:'lich',       statId:'wis',effect:'Deal 8+WIS/4 dmg. Steal 30 mana from enemy.', effects:[{type:'dmg_stat',base:8,stat:'wis',div:4}, {type:'steal_mana',amt:30,dur:3}]},

  lk_drain:  {id:'lk_drain',  name:'Soul Drain',      icon:'🌑',type:'attack', unique:true,champ:'lich',       statId:'wis',effect:'Deal 5 dmg 2 times. Each hit steals 15 mana. Gain 20 mana.', effects:[{type:'dmg_multi',hits:2,dmg:5,delay:250}, {type:'steal_mana',amt:15,dur:3}, {type:'mana',amt:20}]},

  lk_raise:  {id:'lk_raise',  name:'Raise Dead',      icon:'☠️',type:'debuff', unique:true,champ:'lich',       statId:'wis',effect:'Deal 6 dmg. Apply [Marked] 5s. Gain 40 mana. Apply [Cursed] 5s.', effects:[{type:'dmg',base:6}, {type:'marked',dur:5}, {type:'mana',amt:40}, {type:'cursed',dur:5}]},

  cb_touch:  {id:'cb_touch',  name:'Corrupt Touch',   icon:'🌸',type:'attack', unique:true,champ:'corruptionbloom',statId:'wis',effect:'Deal 4+WIS/4 dmg. Apply [Poison] 5. Apply [Slow] 3s.', effects:[{type:'dmg_stat',base:4,stat:'wis',div:4}, {type:'poison',dpt:5,dur:8}, {type:'slow',dur:3}]},

  cb_wave:   {id:'cb_wave',   name:'Spore Wave',      icon:'🌫️',type:'debuff', unique:true,champ:'corruptionbloom',statId:'wis',effect:'Apply [Poison] 6. Apply [Slow] 4s. Gain 15 mana.', effects:[{type:'poison',dpt:6,dur:8}, {type:'slow',dur:4}, {type:'mana',amt:15}]},

  cb_bloom:  {id:'cb_bloom',  name:'Bloom',           icon:'🌱',type:'attack', unique:true,champ:'corruptionbloom',statId:'wis',effect:'Deal 5 dmg. Detonate 50% of Poison as instant dmg. Reapply Poison (6).', effects:[{type:'dmg',base:5}, {type:'poison_detonate',reapply:'yes',rdpt:6}]},

  ac_crush:  {id:'ac_crush',  name:'Crush',           icon:'🐙',type:'attack', unique:true,champ:'abysscrawler',statId:'str',effect:'Deal 8+STR/5 dmg. Slow and devastating.', effects:[{type:'dmg_stat',base:8,stat:'str',div:5}]},

  ac_tentacle:{id:'ac_tentacle',name:'Tentacle',      icon:'🌀',type:'attack', unique:true,champ:'abysscrawler',statId:'agi',effect:'Deal 5 dmg. Apply [Slow] 5s. Apply [Marked] 3s.', effects:[{type:'dmg',base:5}, {type:'slow',dur:5}, {type:'marked',dur:3}]},
  ac_pull:   {id:'ac_pull',   name:'Deep Pull',       icon:'💧',type:'attack', unique:true,champ:'abysscrawler',statId:'wis',effect:'Deal 6 dmg. Steal 25 mana from enemy. Gain 25 mana.', effects:[{type:'dmg',base:6}, {type:'steal_mana',amt:25,dur:3}, {type:'mana',amt:25}]},

  tg_pound:  {id:'tg_pound',  name:'Ground Pound',    icon:'🏛️',type:'attack', unique:true,champ:'temple_guardian',statId:'str',effect:'Deal 9+STR/5 dmg. Stun 0.8s if enemy Slowed.', effects:[{type:'dmg_stat',base:9,stat:'str',div:5}, {type:'stun',dur:800}]},

  tg_rock:   {id:'tg_rock',   name:'Rock Throw',      icon:'🪨',type:'attack', unique:true,champ:'temple_guardian',statId:'str',effect:'Deal 7 dmg. Apply [Slow] 5s. Gain 15 mana.', effects:[{type:'dmg',base:7}, {type:'slow',dur:5}, {type:'mana',amt:15}]},

  tg_fort:   {id:'tg_fort',   name:'Fortify',         icon:'🛡️',type:'defense',unique:true,champ:'temple_guardian',statId:'str',effect:'Apply [Shield] (STR×2) 8s. On expiry: deal 6 dmg to enemy.', effects:[{type:'shield_stat',mult:2,dur:8,onexpiry:'deal_dmg',expiry_val:6}]},

  hm_anchor: {id:'hm_anchor', name:'Anchor Swing',    icon:'⚓',type:'attack', unique:true,champ:'harbourmaster',statId:'str',effect:'Deal 12+STR/5 dmg. The signature blow — slow but devastating.', effects:[{type:'dmg_stat',base:12,stat:'str',div:5}]},

  hm_tidal:  {id:'hm_tidal',  name:'Tidal Crush',     icon:'🌊',type:'attack', unique:true,champ:'harbourmaster',statId:'str',effect:'Deal 15 dmg. Apply [Marked] 5s. Apply [Slow] 4s.', effects:[{type:'dmg',base:15}, {type:'marked',dur:5}, {type:'slow',dur:4}]},

  hm_barnacle:{id:'hm_barnacle',name:'Barnacle Hurl', icon:'🪸',type:'attack', unique:true,champ:'harbourmaster',statId:'str',effect:'Deal 6 dmg. Apply [Slow] 5s. Gain 20 mana.', effects:[{type:'dmg',base:6}, {type:'slow',dur:5}, {type:'mana',amt:20}]},

  // ── Fungal Warren creature cards ──
  // Spore Puff (spore_burst innate — passive DoT emitter)
  sp_spore_shot: {id:'sp_spore_shot', name:'Spore Shot',   icon:'🍄', type:'attack',  unique:true, champ:'sporepuff', statId:'wis', effect:'Deal 4 damage. Apply [Poison] by 3.\nA small puff of toxic spores — the damage lingers after the hit.', effects:[{type:'dmg',base:4}, {type:'poison',dpt:3,dur:8}]},

  sp_toxic_cloud:{id:'sp_toxic_cloud',name:'Toxic Cloud',  icon:'💨', type:'debuff',  unique:true, champ:'sporepuff', statId:'wis', effect:'Apply [Slow] for 4s. Increase [Poison] by 5.\nA billowing cloud that chokes movement and poisons the air.', effects:[{type:'slow',dur:4}, {type:'poison',dpt:5,dur:8}]},
  sp_burst_nova: {id:'sp_burst_nova', name:'Burst Nova',   icon:'💥', type:'attack',  unique:true, champ:'sporepuff', statId:'wis', effect:'Deal 3 damage. Detonate all [Poison] as instant damage.\n[Poison] detonation bypasses [Shield].'},

  // Cave Grub (toxic_body innate — retaliates with Poison on hit)
  cg_slug_strike:{id:'cg_slug_strike',name:'Slug Strike',  icon:'💢', type:'attack',  unique:true, champ:'cavegrub',  statId:'str', effect:'Deal 5+STR/4 damage. Slow and heavy — the Grub throws its whole body into it.', effects:[{type:'dmg_stat',base:4,stat:'str',div:4}]},
  cg_bloat_pulse:{id:'cg_bloat_pulse',name:'Bloat Pulse',  icon:'🫧', type:'defense', unique:true, champ:'cavegrub',  statId:'str', effect:'Apply [Shield] (STR×1) for 5s. On expiry: deal 4 Poison damage to enemy.\nThe Grub\'s hide swells, then bursts.'},
  cg_seep:       {id:'cg_seep',       name:'Seep',          icon:'🧪', type:'debuff',  unique:true, champ:'cavegrub',  statId:'wis', effect:'Increase [Poison] by 6. Gain 20 mana.\nThe toxin leaks freely — feeding your mana as it poisons the enemy.', effects:[{type:'poison',dpt:6,dur:8}, {type:'mana',amt:20}]},


  // Mycelid (spreading_spores innate — every 3rd card poisons)
  mc_tendril:    {id:'mc_tendril',    name:'Tendril',       icon:'🌿', type:'attack',  unique:true, champ:'mycelid',   statId:'str', effect:'Deal 3 damage 2 times. If [Poison] is active: each hit adds 1 Poison stack.\nThe tendrils seek the wound.', effects:[{type:'dmg_multi',hits:2,dmg:3,delay:150}, {type:'poison',dpt:1,dur:4}]},

  mc_spore_cloud:{id:'mc_spore_cloud',name:'Spore Cloud',   icon:'🌫️', type:'debuff',  unique:true, champ:'mycelid',   statId:'wis', effect:'Apply [Slow] for 5s. Increase [Poison] by 4.\nA thick cloud of toxic spores hangs in the air.', effects:[{type:'slow',dur:5}, {type:'poison',dpt:4,dur:8}]},
  mc_mycelium:   {id:'mc_mycelium',   name:'Mycelium Net',  icon:'🕸️', type:'utility', unique:true, champ:'mycelid',   statId:'wis', effect:'Gain 30 mana. Your next Spreading Spores trigger deals 10 Poison burst instead of applying a DoT.\nThe fungal network stores energy for a sudden release.'},

  // Tunnel Ant (swarm_ant innate — survives once at 5 HP)
  ta_bite:       {id:'ta_bite',       name:'Frantic Bite',  icon:'🐜', type:'attack',  unique:true, champ:'tunnelant', statId:'agi', effect:'Deal 3 damage. If your HP is below 25%: deal 6 instead.\nThe Ant fights hardest when cornered.', effects:[{type:'dmg_if_hp_low',base:3,high:6,threshold:25}]},

  ta_mandible:   {id:'ta_mandible',   name:'Mandible Crush',icon:'💪', type:'attack',  unique:true, champ:'tunnelant', statId:'str', effect:'Deal 8+STR/3 damage. Slow but devastating — the Ant brings its full strength to bear.', effects:[{type:'dmg_stat',base:8,stat:'str',div:3}]},

  ta_swarm_call: {id:'ta_swarm_call', name:'Swarm Call',    icon:'📯', type:'utility', unique:true, champ:'tunnelant', statId:'agi', effect:'Draw speed +30% for 3s. Gain 15 mana. Reduces your draw interval by 5% permanently (stacks, max 30%).\nThe Ant calls on the colony — the pace quickens.', effects:[{type:'draw_speed',pct:30,dur:3}, {type:'mana',amt:15}]},


  // Venom Stalker (ambush innate — first card double damage)
  vs_venom_bite: {id:'vs_venom_bite', name:'Venom Bite',    icon:'🕷️', type:'attack',  unique:true, champ:'venomstalker',statId:'agi', effect:'Deal 4 damage. Apply [Poison] by 5.\nThe Stalker injects precise doses — maximum effect, minimum exposure.', effects:[{type:'dmg',base:4}, {type:'poison',dpt:5,dur:8}]},

  vs_web_trap:   {id:'vs_web_trap',   name:'Web Trap',      icon:'🕸️', type:'debuff',  unique:true, champ:'venomstalker',statId:'agi', effect:'Apply [Slow] for 6s. Apply [Marked] for 3s.\n[Marked]: enemy takes 50% more damage. The web holds them in place for the killing blow.', effects:[{type:'slow',dur:6}, {type:'marked',dur:3}]},

  vs_ambush:     {id:'vs_ambush',     name:'Ambush Strike',  icon:'🌑', type:'attack',  unique:true, champ:'venomstalker',statId:'agi', effect:'Deal 12+AGI/3 damage. Resets your [Ambush] innate — your next card deals double damage again.\nReset the trap. Spring it again.'},
};

// Deck size = creature STR (same as max HP). Cards ARE health — small decks are fragile.
function creatureDeckSize(id){ var c=CREATURES[id]; if(!c) return 10; return c.baseStats.str; }

// ════════════════════════════════════════════════════════════════
// CREATURE_DECKS — action decks used when a creature fights as an enemy
// ════════════════════════════════════════════════════════════════
// Each entry: { cards: [...card ids], alts: [] }
// Deck size should match the creature's baseStats.str.
// When you add a new creature, add its deck entry here.
// ════════════════════════════════════════════════════════════════

var CREATURE_DECKS = {
  // ── Sewers ── (STR = total cards, even split)
  // Giant Rat STR 12 = 12: strike×2, brace×2, gnaw×3, dart×3, frenzy_bite×2
  rat:         {cards:['strike','strike','brace','brace','gr_gnaw','gr_gnaw','gr_gnaw','gr_dart','gr_dart','gr_dart','gr_frenzy_bite','gr_frenzy_bite'], alts:[]},
  // Mud Crab STR 12 = 12: strike×2, brace×2, claw×3, shell×3, pinch×2
  mudcrab:     {cards:['strike','strike','brace','brace','mc2_claw','mc2_claw','mc2_claw','mc2_shell','mc2_shell','mc2_shell','mc2_pinch','mc2_pinch'], alts:[]},
  // Goblin Scout STR 13 = 13: strike×3, brace×2, slash×3, rush×3, warcry×2
  goblin:      {cards:['strike','strike','strike','brace','brace','go_slash','go_slash','go_slash','go_rush','go_rush','go_rush','go_warcry','go_warcry'], alts:[]},
  // Sewer Roach STR 8 = 8: strike×2, brace×1, scuttle×2, skitter×2, chitin×1
  roach:       {cards:['strike','strike','brace','sr_scuttle','sr_scuttle','sr_skitter','sr_skitter','sr_chitin'], alts:[]},
  // Bloated Grub STR 14 = 14: strike×3, brace×2, slug×3, seep×3, bloat×3
  grub:        {cards:['strike','strike','strike','brace','brace','bg_slug','bg_slug','bg_slug','bg_seep','bg_seep','bg_seep','bg_bloat','bg_bloat','bg_bloat'], alts:[]},

  // ── Bogmire Swamp ──
  // Bog Wisp STR 7 = 7: strike×1, brace×1, hex×2, wisp×2, drain×1
  wisp:        {cards:['strike','brace','bw_hex','bw_hex','bw_wisp','bw_wisp','bw_drain'], alts:[]},
  // Swamp Serpent STR 9 = 9: strike×2, brace×1, bite×2, constrict×2, venom×2
  snake:       {cards:['strike','strike','brace','ss_bite','ss_bite','ss_constrict','ss_constrict','ss_venom','ss_venom'], alts:[]},
  // Toad King STR 18 = 18: strike×4, brace×3, tongue×4, croak×4, mud_bomb×3
  toadking:    {cards:['strike','strike','strike','strike','brace','brace','brace','tk_tongue','tk_tongue','tk_tongue','tk_tongue','tk_croak','tk_croak','tk_croak','tk_croak','tk_mud_bomb','tk_mud_bomb','tk_mud_bomb'], alts:[]},

  // ── Forgotten Crypt ──
  // Skeleton STR 12 = 12: strike×2, brace×2, bone×3, rattle×3, march×2
  skeleton:    {cards:['strike','strike','brace','brace','sk_bone','sk_bone','sk_bone','sk_rattle','sk_rattle','sk_rattle','sk_march','sk_march'], alts:[]},
  // Cursed Witch STR 12 = 12: strike×2, brace×2, hex×3, curse×3, hex_shield×2
  witch:       {cards:['strike','strike','brace','brace','cw_hex','cw_hex','cw_hex','cw_curse','cw_curse','cw_curse','cw_hex_shield','cw_hex_shield'], alts:[]},

  // ── Thornwood Forest ──
  // Forest Troll STR 28 = 28: strike×6, brace×5, club×6, rock×6, taunt×5
  troll:       {cards:['strike','strike','strike','strike','strike','strike','brace','brace','brace','brace','brace','ft_club','ft_club','ft_club','ft_club','ft_club','ft_club','ft_rock','ft_rock','ft_rock','ft_rock','ft_rock','ft_rock','ft_taunt','ft_taunt','ft_taunt','ft_taunt','ft_taunt'], alts:[]},
  // Harpy STR 14 = 14: strike×3, brace×2, talon×3, shriek×3, gust×3
  harpy:       {cards:['strike','strike','strike','brace','brace','ha_talon','ha_talon','ha_talon','ha_shriek','ha_shriek','ha_shriek','ha_gust','ha_gust','ha_gust'], alts:[]},
  // Bandit Captain STR 18 = 18: strike×4, brace×3, stab×4, disarm×4, trick×3
  bandit:      {cards:['strike','strike','strike','strike','brace','brace','brace','bc_stab','bc_stab','bc_stab','bc_stab','bc_disarm','bc_disarm','bc_disarm','bc_disarm','bc_trick','bc_trick','bc_trick'], alts:[]},

  // ── Eagle's Cave ──
  // Stone Golem STR 35 = 35: strike×7, brace×7, pound×7, throw×7, fortify×7
  golem:       {cards:['strike','strike','strike','strike','strike','strike','strike','brace','brace','brace','brace','brace','brace','brace','sg_pound','sg_pound','sg_pound','sg_pound','sg_pound','sg_pound','sg_pound','sg_throw','sg_throw','sg_throw','sg_throw','sg_throw','sg_throw','sg_throw','sg_fortify','sg_fortify','sg_fortify','sg_fortify','sg_fortify','sg_fortify','sg_fortify'], alts:[]},

  // ── Deep Sewers ──
  // Sewer Wretch STR 16 = 16: strike×3, brace×3, claw×4, retch×3, mend×3
  wretch:      {cards:['strike','strike','strike','brace','brace','brace','sw_claw','sw_claw','sw_claw','sw_claw','sw_retch','sw_retch','sw_retch','sw_mend','sw_mend','sw_mend'], alts:[]},
  // Drain Lurker STR 24 = 24: strike×5, brace×4, lunge×5, tail×5, drag×5
  lurker:      {cards:['strike','strike','strike','strike','strike','brace','brace','brace','brace','dl_lunge','dl_lunge','dl_lunge','dl_lunge','dl_lunge','dl_tail','dl_tail','dl_tail','dl_tail','dl_tail','dl_drag','dl_drag','dl_drag','dl_drag','dl_drag'], alts:[]},
  // Plague Carrier STR 11 = 11: strike×2, brace×2, infect×3, bite×2, spore×2
  plague:      {cards:['strike','strike','brace','brace','pc_infect','pc_infect','pc_infect','pc_bite','pc_bite','pc_spore','pc_spore'], alts:[]},

  // ── Foul Depths ──
  // Sewer Watcher STR 20 = 20: strike×4, brace×4, gaze×4, crush×4, tendrils×4
  watcher:     {cards:['strike','strike','strike','strike','brace','brace','brace','brace','wa_gaze','wa_gaze','wa_gaze','wa_gaze','wa_crush','wa_crush','wa_crush','wa_crush','wa_tendrils','wa_tendrils','wa_tendrils','wa_tendrils'], alts:[]},
  // Amalgam STR 32 = 32: strike×6, brace×6, crush×7, absorb×7, lash×6
  amalgam:     {cards:['strike','strike','strike','strike','strike','strike','brace','brace','brace','brace','brace','brace','am_crush','am_crush','am_crush','am_crush','am_crush','am_crush','am_crush','am_absorb','am_absorb','am_absorb','am_absorb','am_absorb','am_absorb','am_absorb','am_lash','am_lash','am_lash','am_lash','am_lash','am_lash'], alts:[]},

  // ── Sunken Harbour ──
  // Tide Crab STR 16 = 16: strike×3,brace×3,slam×4,harden×3,snap×3
  tidecrab:    {cards:['strike','strike','strike','brace','brace','brace','tc_slam','tc_slam','tc_slam','tc_slam','tc_harden','tc_harden','tc_harden','tc_snap','tc_snap','tc_snap'],alts:[]},
  // Drowned Sailor STR 14 = 14: strike×3,brace×2,anchor×3,barnacle×3,drag×3
  drownedsailor:{cards:['strike','strike','strike','brace','brace','ds_anchor','ds_anchor','ds_anchor','ds_barnacle','ds_barnacle','ds_barnacle','ds_drag','ds_drag','ds_drag'],alts:[]},
  // Ink Squall STR 9 = 9: strike×2,brace×1,slap×2,burst×2,web×2
  inksquall:   {cards:['strike','strike','brace','is_slap','is_slap','is_burst','is_burst','is_web','is_web'],alts:[]},
  // Siren STR 8 = 8: strike×2,brace×1,song×2,wail×2,enchant×1
  siren:       {cards:['strike','strike','brace','si_song','si_song','si_wail','si_wail','si_enchant'],alts:[]},
  // Shark Knight STR 15 = 15: strike×3,brace×3,fin×3,chomp×3,frenzy×3
  sharknight:  {cards:['strike','strike','strike','brace','brace','brace','sk2_fin','sk2_fin','sk2_fin','sk2_chomp','sk2_chomp','sk2_chomp','sk2_frenzy','sk2_frenzy','sk2_frenzy'],alts:[]},

  // ── Char Mines ──
  // Flame Sprite STR 7 = 7: strike×1,brace×1,ember×2,scatter×2,detonate×1
  flamesprite: {cards:['strike','brace','fs_ember','fs_ember','fs_scatter','fs_scatter','fs_detonate'],alts:[]},
  // Ember Golem STR 20 = 20: strike×4,brace×4,smash×4,sear×4,shell×4
  embergolem:  {cards:['strike','strike','strike','strike','brace','brace','brace','brace','eg_smash','eg_smash','eg_smash','eg_smash','eg_sear','eg_sear','eg_sear','eg_sear','eg_shell','eg_shell','eg_shell','eg_shell'],alts:[]},
  // Ash Bat STR 9 = 9: strike×2,brace×1,wing×2,dive×2,shroud×2
  ashbat:      {cards:['strike','strike','brace','ab_wing','ab_wing','ab_dive','ab_dive','ab_shroud','ab_shroud'],alts:[]},
  // Mine Ghoul STR 12 = 12: strike×2,brace×2,pick×3,cavein×3,digin×2
  mineghoul:   {cards:['strike','strike','brace','brace','mg_pick','mg_pick','mg_pick','mg_cavein','mg_cavein','mg_cavein','mg_digin','mg_digin'],alts:[]},
  // Lava Crawler STR 16 = 16: strike×3,brace×3,slam×4,spray×3,burst×3
  lavacrawler: {cards:['strike','strike','strike','brace','brace','brace','lc_slam','lc_slam','lc_slam','lc_slam','lc_spray','lc_spray','lc_spray','lc_burst','lc_burst','lc_burst'],alts:[]},

  // ── Mistwoods ──
  // Mist Raven STR 10 = 10: strike×2,brace×2,talon×2,mist×2,dive×2
  mistraven:   {cards:['strike','strike','brace','brace','mr_talon','mr_talon','mr_mist','mr_mist','mr_dive','mr_dive'],alts:[]},
  // Foghast STR 8 = 8: strike×2,brace×1,chill×2,soul×2,wail×1
  foghast:     {cards:['strike','strike','brace','fg_chill','fg_chill','fg_soul','fg_soul','fg_wail'],alts:[]},
  // Night Entling STR 18 = 18: strike×4,brace×3,roots×4,bloom×4,bark×3
  nightentling:{cards:['strike','strike','strike','strike','brace','brace','brace','ne_roots','ne_roots','ne_roots','ne_roots','ne_bloom','ne_bloom','ne_bloom','ne_bloom','ne_bark','ne_bark','ne_bark'],alts:[]},
  // Orbweaver STR 12 = 12: strike×2,brace×2,web×3,venom×3,cocoon×2
  orbweaver:   {cards:['strike','strike','brace','brace','ow_web','ow_web','ow_web','ow_venom','ow_venom','ow_venom','ow_cocoon','ow_cocoon'],alts:[]},
  // Masked Owl STR 14 = 14: strike×3,brace×2,rake×3,glide×3,screech×3
  maskedowl:   {cards:['strike','strike','strike','brace','brace','mo_rake','mo_rake','mo_rake','mo_glide','mo_glide','mo_glide','mo_screech','mo_screech','mo_screech'],alts:[]},

  // ── Wax Dunes ──
  // Wax Soldier STR 11 = 11: strike×2,brace×2,strike2×3,harden×2,lunge×2
  waxsoldier:  {cards:['strike','strike','brace','brace','ws_strike','ws_strike','ws_strike','ws_harden','ws_harden','ws_lunge','ws_lunge'],alts:[]},
  // Wax Hound STR 8 = 8: strike×2,brace×1,snap×2,dash×2,howl×1
  waxhound:    {cards:['strike','strike','brace','wh_snap','wh_snap','wh_dash','wh_dash','wh_howl'],alts:[]},
  // Dune Crawler STR 14 = 14: strike×3,brace×2,crush×3,burrow×3,grind×3
  dunecrawler: {cards:['strike','strike','strike','brace','brace','dc_crush','dc_crush','dc_crush','dc_burrow','dc_burrow','dc_burrow','dc_grind','dc_grind','dc_grind'],alts:[]},
  // Wax Effigy STR 10 = 10: strike×2,brace×2,pulse×2,curse×2,mimic×2
  waxeffigy:   {cards:['strike','strike','brace','brace','we_pulse','we_pulse','we_curse','we_curse','we_mimic','we_mimic'],alts:[]},
  // Wax Oasis STR 22 = 22: strike×4,brace×4,pulse×5,flow×5,overflow×4
  waxoasis:    {cards:['strike','strike','strike','strike','brace','brace','brace','brace','wo_pulse','wo_pulse','wo_pulse','wo_pulse','wo_pulse','wo_flow','wo_flow','wo_flow','wo_flow','wo_flow','wo_overflow','wo_overflow','wo_overflow','wo_overflow'],alts:[]},

  // ── Sunken Ruins / Shattered Vault ──
  // Dark Knight STR 28 = 28: strike×6,brace×5,slash×6,bash×6,intim×5
  knight:      {cards:['strike','strike','strike','strike','strike','strike','brace','brace','brace','brace','brace','dk_slash','dk_slash','dk_slash','dk_slash','dk_slash','dk_slash','dk_bash','dk_bash','dk_bash','dk_bash','dk_bash','dk_bash','dk_intim','dk_intim','dk_intim','dk_intim','dk_intim'],alts:[]},
  // Orc Warrior STR 22 = 22: strike×4,brace×4,slam×5,cry×5,ground×4
  orc:         {cards:['strike','strike','strike','strike','brace','brace','brace','brace','ow2_slam','ow2_slam','ow2_slam','ow2_slam','ow2_slam','ow2_cry','ow2_cry','ow2_cry','ow2_cry','ow2_cry','ow2_ground','ow2_ground','ow2_ground','ow2_ground'],alts:[]},
  // Cursed Urn STR 14 = 14: strike×3,brace×2,hex×3,overflow×3,surge×3
  cursedurn:   {cards:['strike','strike','strike','brace','brace','cu_hex','cu_hex','cu_hex','cu_overflow','cu_overflow','cu_overflow','cu_surge','cu_surge','cu_surge'],alts:[]},
  // Iron Sentinel STR 22 = 22: strike×4,brace×4,guard×5,lock×5,fort×4
  ironsentinel:{cards:['strike','strike','strike','strike','brace','brace','brace','brace','is2_guard','is2_guard','is2_guard','is2_guard','is2_guard','is2_lock','is2_lock','is2_lock','is2_lock','is2_lock','is2_fort','is2_fort','is2_fort','is2_fort'],alts:[]},
  // Vault Spectre STR 10 = 10: strike×2,brace×2,gaze×2,crush×2,tendrils×2
  vaultspectre:{cards:['strike','strike','brace','brace','vs2_gaze','vs2_gaze','vs2_crush','vs2_crush','vs2_tendrils','vs2_tendrils'],alts:[]},

  // ── Dragon's Nest ──
  // Fire Wyrm STR 28 = 28: strike×6,brace×5,claw×6,breath×6,surge×5
  wyrm:        {cards:['strike','strike','strike','strike','strike','strike','brace','brace','brace','brace','brace','fw_claw','fw_claw','fw_claw','fw_claw','fw_claw','fw_claw','fw_breath','fw_breath','fw_breath','fw_breath','fw_breath','fw_breath','fw_surge','fw_surge','fw_surge','fw_surge','fw_surge'],alts:[]},
  // Elder Dragon STR 35 = 35: strike×7,brace×7,bite×7,blast×7,breath×7
  dragon:      {cards:['strike','strike','strike','strike','strike','strike','strike','brace','brace','brace','brace','brace','brace','brace','ed_bite','ed_bite','ed_bite','ed_bite','ed_bite','ed_bite','ed_bite','ed_blast','ed_blast','ed_blast','ed_blast','ed_blast','ed_blast','ed_blast','ed_breath','ed_breath','ed_breath','ed_breath','ed_breath','ed_breath','ed_breath'],alts:[]},

  // ── Boneyard ──
  // Lich King STR 38 = 38: strike×8,brace×7,bolt×8,drain×8,raise×7
  lich:        {cards:['strike','strike','strike','strike','strike','strike','strike','strike','brace','brace','brace','brace','brace','brace','brace','lk_bolt','lk_bolt','lk_bolt','lk_bolt','lk_bolt','lk_bolt','lk_bolt','lk_bolt','lk_drain','lk_drain','lk_drain','lk_drain','lk_drain','lk_drain','lk_drain','lk_drain','lk_raise','lk_raise','lk_raise','lk_raise','lk_raise','lk_raise','lk_raise'],alts:[]},

  // ── Drowned Temple ──
  // Corruption Bloom STR 16 = 16: strike×3,brace×3,touch×4,wave×3,bloom×3
  corruptionbloom:{cards:['strike','strike','strike','brace','brace','brace','cb_touch','cb_touch','cb_touch','cb_touch','cb_wave','cb_wave','cb_wave','cb_bloom','cb_bloom','cb_bloom'],alts:[]},
  // Abyss Crawler STR 18 = 18: strike×4,brace×3,crush×4,tentacle×4,pull×3
  abysscrawler:{cards:['strike','strike','strike','strike','brace','brace','brace','ac_crush','ac_crush','ac_crush','ac_crush','ac_tentacle','ac_tentacle','ac_tentacle','ac_tentacle','ac_pull','ac_pull','ac_pull'],alts:[]},
  // Temple Guardian STR 24 = 24: strike×5,brace×4,pound×5,rock×5,fort×5
  temple_guardian:{cards:['strike','strike','strike','strike','strike','brace','brace','brace','brace','tg_pound','tg_pound','tg_pound','tg_pound','tg_pound','tg_rock','tg_rock','tg_rock','tg_rock','tg_rock','tg_fort','tg_fort','tg_fort','tg_fort','tg_fort'],alts:[]},

  // ── Black Pool ──
  // Harbourmaster STR 28 = 28: strike×6,brace×5,anchor×6,tidal×6,barnacle×5
  harbourmaster:{cards:['strike','strike','strike','strike','strike','strike','brace','brace','brace','brace','brace','hm_anchor','hm_anchor','hm_anchor','hm_anchor','hm_anchor','hm_anchor','hm_tidal','hm_tidal','hm_tidal','hm_tidal','hm_tidal','hm_tidal','hm_barnacle','hm_barnacle','hm_barnacle','hm_barnacle','hm_barnacle'],alts:[]},

  // ── Fungal Warren ── (STR = total cards, even split across 5 types)
  // Spore Puff STR 8 = 8 cards: strike×2, brace×1, spore_shot×2, toxic_cloud×2, burst_nova×1
  sporepuff:   {cards:['strike','strike','brace',
                        'sp_spore_shot','sp_spore_shot',
                        'sp_toxic_cloud','sp_toxic_cloud',
                        'sp_burst_nova'],
                alts:[]},
  // Cave Grub STR 18 = 18 cards: strike×4, brace×3, slug×4, bloat×4, seep×3
  cavegrub:    {cards:['strike','strike','strike','strike','brace','brace','brace',
                        'cg_slug_strike','cg_slug_strike','cg_slug_strike','cg_slug_strike',
                        'cg_bloat_pulse','cg_bloat_pulse','cg_bloat_pulse','cg_bloat_pulse',
                        'cg_seep','cg_seep','cg_seep'],
                alts:[]},
  // Mycelid STR 12 = 12 cards: strike×2, brace×2, tendril×3, spore_cloud×3, mycelium×2
  mycelid:     {cards:['strike','strike','brace','brace',
                        'mc_tendril','mc_tendril','mc_tendril',
                        'mc_spore_cloud','mc_spore_cloud','mc_spore_cloud',
                        'mc_mycelium','mc_mycelium'],
                alts:[]},
  // Tunnel Ant STR 10 = 10 cards: strike×2, brace×2, bite×2, mandible×2, swarm_call×2
  tunnelant:   {cards:['strike','strike','brace','brace',
                        'ta_bite','ta_bite',
                        'ta_mandible','ta_mandible',
                        'ta_swarm_call','ta_swarm_call'],
                alts:[]},
  // Venom Stalker STR 11 = 11 cards: strike×2, brace×2, venom_bite×3, web_trap×2, ambush×2
  venomstalker:{cards:['strike','strike','brace','brace',
                        'vs_venom_bite','vs_venom_bite','vs_venom_bite',
                        'vs_web_trap','vs_web_trap',
                        'vs_ambush','vs_ambush'],
                alts:[]},
};
