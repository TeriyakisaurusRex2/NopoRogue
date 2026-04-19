// ════════════════════════════════════════════════════
// RELICS — relic definitions and crafting data
// Loaded after game.js. References calcHp, calcMaxMana,
// calcManaRegen which are defined in game.js.
// ════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// RELICS
// Each relic: { id, name, icon, tier, desc, apply(gs) }
// apply(gs) is called at run start via applyRelics(gs).
// Relics are universal — any relic on any champion.
// Slots unlock per ascension tier (0 at base, +1 per tier).
// Removing a relic from a champion destroys it (resource sink).
// ═══════════════════════════════════════════════════════
var RELICS = {
  // ── Base tier ──
  worn_amulet: {
    id:'worn_amulet', name:'Worn Amulet', icon:'📿', tier:'base',
    desc:'Start each run with 10% of max mana already filled.',
    apply:function(gs){ gs.mana=Math.floor(gs.maxMana*0.10); },
  },
  cracked_lens: {
    id:'cracked_lens', name:'Cracked Lens', icon:'🔍', tier:'base',
    desc:'Your first card played each run deals +50% damage.',
    apply:function(gs){ gs._relicFirstCardBonus=true; },
  },
  rat_skull: {
    id:'rat_skull', name:'Rat Skull', icon:'💀', tier:'base',
    desc:'Start each fight with Shield (4).',
    apply:function(gs){ gs.playerShield=(gs.playerShield||0)+4; },
  },
  iron_ring: {
    id:'iron_ring', name:'Iron Ring', icon:'💍', tier:'base',
    desc:'+2 STR for this run.',
    apply:function(gs){ gs.stats.str+=2; gs.playerMaxHp=calcHp(gs.stats.str); gs.playerHp=Math.min(gs.playerHp,gs.playerMaxHp); },
  },
  swiftcloak: {
    id:'swiftcloak', name:'Swiftcloak', icon:'🧥', tier:'base',
    desc:'+2 AGI for this run.',
    apply:function(gs){ gs.stats.agi+=2; },
  },
  focus_shard: {
    id:'focus_shard', name:'Focus Shard', icon:'🔷', tier:'base',
    desc:'+2 WIS for this run.',
    apply:function(gs){ gs.stats.wis+=2; gs.maxMana=calcMaxMana(gs.stats.wis); gs.manaRegen=calcManaRegen(gs.stats.wis); },
  },
  // ── Ruby tier ──
  ember_flask: {
    id:'ember_flask', name:'Ember Flask', icon:'🧪', tier:'ruby',
    desc:'[Burn] you apply lasts 3s longer.',
    apply:function(gs){ gs._relicBurnDurBonus=3000; },
  },
  venom_phial: {
    id:'venom_phial', name:'Venom Phial', icon:'☠️', tier:'ruby',
    desc:'[Poison] you apply deals 2 additional damage per tick.',
    apply:function(gs){ gs._relicPoisonDptBonus=2; },
  },
  mana_coil: {
    id:'mana_coil', name:'Mana Coil', icon:'🌀', tier:'ruby',
    desc:'Mana regenerates 20% faster.',
    apply:function(gs){ gs._relicManaRegenMult=(gs._relicManaRegenMult||1)*1.20; },
  },
  thorn_band: {
    id:'thorn_band', name:'Thorn Band', icon:'🌿', tier:'ruby',
    desc:'Reflect 3 damage to the enemy on each hit taken.',
    apply:function(gs){ gs._relicThorns=(gs._relicThorns||0)+3; },
  },
  // ── Emerald tier ──
  poison_gland: {
    id:'poison_gland', name:'Poison Gland', icon:'🫀', tier:'emerald',
    desc:'[Poison] ticks 25% faster.',
    apply:function(gs){ gs._relicPoisonTickMult=(gs._relicPoisonTickMult||1)*0.75; },
  },
  cursed_sigil: {
    id:'cursed_sigil', name:'Cursed Sigil', icon:'🔯', tier:'emerald',
    desc:'[Weaken] and [Vulnerable] last 2s longer.',
    apply:function(gs){ gs._relicDebuffDurBonus=(gs._relicDebuffDurBonus||0)+2000; },
  },
  deep_pockets: {
    id:'deep_pockets', name:'Deep Pockets', icon:'👝', tier:'emerald',
    desc:'Maximum hand size +1.',
    apply:function(gs){ gs.maxHand=(gs.maxHand||5)+1; },
  },
  // ── Sapphire tier ──
  void_lens: {
    id:'void_lens', name:'Void Lens', icon:'🔮', tier:'sapphire',
    desc:'[Sorcery] effects cost 10 less mana.',
    apply:function(gs){ gs._relicSorceryCostReduction=(gs._relicSorceryCostReduction||0)+10; },
  },
  bloodstone: {
    id:'bloodstone', name:'Bloodstone', icon:'🔴', tier:'sapphire',
    desc:'Crits deal 2× damage instead of 1.5×.',
    apply:function(gs){ gs._relicCritMult=2.0; },
  },
};

var RELIC_CRAFT_TIMES = {base:600, ruby:1800, emerald:7200, sapphire:21600}; // seconds

// material cost per relic — format: {materialId: count}
var RELIC_RECIPES = {
  worn_amulet:   {tier:'base',    mats:{slick_stone:3, bog_iron:2}},
  cracked_lens:  {tier:'base',    mats:{slick_stone:4, bone_dust:2}},
  rat_skull:     {tier:'base',    mats:{slick_stone:5, rancid_bile:1}},
  iron_ring:     {tier:'base',    mats:{bog_iron:4, grave_iron:1}},
  swiftcloak:    {tier:'base',    mats:{thornwood_resin:4, harpy_talon:1}},
  focus_shard:   {tier:'base',    mats:{void_splinter:3, mist_silk:2}},
  ember_flask:   {tier:'ruby',    mats:{ember_grit:6, dragonscale:1}},
  venom_phial:   {tier:'ruby',    mats:{rancid_bile:5, plague_marrow:1}},
  mana_coil:     {tier:'ruby',    mats:{void_splinter:5, null_stone:1}},
  thorn_band:    {tier:'ruby',    mats:{thornwood_resin:6, ancient_bark:1}},
  poison_gland:  {tier:'emerald', mats:{plague_marrow:3, leech_oil:3, abyssal_coral:1}},
  cursed_sigil:  {tier:'emerald', mats:{cursed_essence:3, arcane_residue:2, void_splinter:2}},
  deep_pockets:  {tier:'emerald', mats:{vault_bronze:4, stone_cipher:3, amber_wax:2}},
  void_lens:     {tier:'sapphire',mats:{null_stone:3, mist_silk:3, arcane_residue:2, ancient_amber:1}},
  bloodstone:    {tier:'sapphire',mats:{plague_marrow:2, cursed_essence:2, grave_iron:3, dragonscale:1}},
};
