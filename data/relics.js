// ════════════════════════════════════════════════════
// RELICS — relic definitions and crafting data
// ════════════════════════════════════════════════════
// Each relic: { id, name, icon, tier, desc, apply(gs) }
// apply(gs) is called at run start via applyRelics(gs).
// Universal: any relic on any champion.
// Slots unlock per ascension tier (0 at base, +1 per tier).
// Removing a relic destroys it (unless backpack upgrade owned).
// ════════════════════════════════════════════════════

var RELICS = {

  // ── Base tier (simple, starter relics) ────────────────────

  wildfire_focus: {
    id:'wildfire_focus', name:'Wildfire Focus', icon:'🔥', tier:'base',
    desc:'[Burn] damage scales with WIS instead of flat damage.',
    flavor:'"Heat is just impatient light."',
    apply: function(gs){ gs._relicBurnScalesWis = true; },
  },

  gamblers_coin: {
    id:'gamblers_coin', name:"Gambler's Coin", icon:'🪙', tier:'base',
    desc:'+50% gold rewards from battle.',
    flavor:'"The coin always knows. The gambler rarely does."',
    apply: function(gs){ gs._relicGoldMult = (gs._relicGoldMult||1) * 1.5; },
  },

  quick_draw_holster: {
    id:'quick_draw_holster', name:'Quick-Draw Holster', icon:'🃏', tier:'base',
    desc:'Start each battle with 2 extra cards in hand.',
    flavor:'"Speed kills. Slowness kills slower."',
    apply: function(gs){ gs._relicBonusStartCards = (gs._relicBonusStartCards||0) + 2; },
  },

  // Round 67p: Safety Net — first relic available in the early-game
  // quest line. Trades 100g on defeat to preserve the champion's
  // levels (XP still resets to 0, so level progress is lost but the
  // tier-up doesn't unwind). Death-revive logic lives in doDefeat.
  safety_net: {
    id:'safety_net', name:'Safety Net', icon:'🪢', tier:'base',
    desc:'On defeat: pay 100g to keep your levels (XP resets to 0). Auto-activates if you can afford it.',
    flavor:'"For every fall, a fold of cloth."',
    apply: function(gs){ gs._relicSafetyNet = true; },
  },

  // ── Ruby tier (build-enabling) ────────────────────────────

  overflow_crystal: {
    id:'overflow_crystal', name:'Overflow Crystal', icon:'💎', tier:'ruby',
    desc:'Crit chance over 100% adds the excess as bonus damage %.',
    flavor:'"What spills must be caught."',
    apply: function(gs){ gs._relicCritOverflow = true; },
  },

  shieldbreaker_charm: {
    id:'shieldbreaker_charm', name:'Shieldbreaker Charm', icon:'⚡', tier:'ruby',
    desc:'Draw a card when your damage breaks an opponent\'s shield.',
    flavor:'"Walls are just suggestions."',
    apply: function(gs){ gs._relicDrawOnShieldBreak = true; },
  },

  // ── Emerald tier (archetype-defining) ─────────────────────

  mana_siphon_ring: {
    id:'mana_siphon_ring', name:'Mana Siphon Ring', icon:'🌀', tier:'emerald',
    desc:'Add [Mana Burn] 5 to all universal cards (Strike, Brace, Focus).',
    flavor:'"Their well, your bucket."',
    apply: function(gs){ gs._relicUniversalManaBurn = 5; },
  },

  sporeling_heart: {
    id:'sporeling_heart', name:'Sporeling Heart', icon:'🍄', tier:'emerald',
    desc:'[Poison] ticks 25% faster.',
    flavor:'"It grows where the dead lay still."',
    apply: function(gs){ gs._relicPoisonTickMult = (gs._relicPoisonTickMult||1) * 0.75; },
  },
};

// Craft times in seconds per tier
var RELIC_CRAFT_TIMES = {
  base:     600,    // 10 min
  ruby:     1800,   // 30 min
  emerald:  7200,   // 2 hours
  sapphire: 21600,  // 6 hours
};

// Material cost per relic — {materialId: count}
var RELIC_RECIPES = {
  // Round 67p: Safety Net is the starter recipe — only one unlocked by
  // default on a new save. Other recipes are gated by story-quest
  // progress (see isRecipeUnlocked / PERSIST.unlockedRelicRecipes).
  // Round 67q: recipe simplified to 2x Ancient Bark (Pale Road rare).
  // Bark fibre = woven cord = net, thematically. The preceding quest
  // (story_reach_lv3) drops exactly these 2 mats as its reward, so the
  // player walks out of the Hall with everything they need to craft.
  safety_net:         {tier:'base',    mats:{ancient_bark:2}},
  wildfire_focus:     {tier:'base',    mats:{slick_stone:3, rancid_bile:2}},
  gamblers_coin:      {tier:'base',    mats:{bog_iron:3, vault_bronze:1}},
  quick_draw_holster: {tier:'base',    mats:{thornwood_resin:4, harpy_talon:1}},
  overflow_crystal:   {tier:'ruby',    mats:{stone_cipher:5, arcane_residue:1}},
  shieldbreaker_charm:{tier:'ruby',    mats:{grave_iron:4, cursed_essence:1}},
  mana_siphon_ring:   {tier:'emerald', mats:{void_splinter:4, null_stone:1, mist_silk:2}},
  sporeling_heart:    {tier:'emerald', mats:{rancid_bile:3, plague_marrow:2, leech_oil:2}},
};
