// ═══════════════════════════════════════════════════════
// TOWN — Loot, Buildings, NPC Dialogue, Bestiary, Tutorials
// Extracted from game.js for manageability
// ═══════════════════════════════════════════════════════

// LOOT — keys and chests from area completion
// ═══════════════════════════════════════════════════════
var LOOT_DEFS = {
  // Sewers — three keys, one chest
  key_sewers:       {icon:'🗝️', name:'Sewer Key',        type:'key',   biome:'sewers',    color:'#8a7030'},
  key_sewers_deep:  {icon:'🗝️', name:'Deep Sewer Key',   type:'key',   biome:'sewers',    color:'#6a9050'},
  key_sewers_foul:  {icon:'🗝️', name:'Foul Depths Key',  type:'key',   biome:'sewers',    color:'#9060a0'},
  chest_sewers:     {icon:'📦', name:'Sewer Chest',       type:'chest', biome:'sewers',    color:'#c09030', basePrice:40},
  // Other biomes — one key, one chest each
  key_bog:          {icon:'🗝️', name:'Bog Key',           type:'key',   biome:'swamp',     color:'#508030'},
  chest_bog:        {icon:'📦', name:'Bog Chest',          type:'chest', biome:'swamp',     color:'#70b040', basePrice:60},
  key_crypt:        {icon:'🗝️', name:'Crypt Key',          type:'key',   biome:'crypt',     color:'#7060a0'},
  chest_crypt:      {icon:'📦', name:'Crypt Chest',        type:'chest', biome:'crypt',     color:'#9080c0', basePrice:60},
  key_forest:       {icon:'🗝️', name:'Forest Key',        type:'key',   biome:'forest',    color:'#408040'},
  chest_forest:     {icon:'📦', name:'Forest Chest',      type:'chest', biome:'forest',    color:'#60b060', basePrice:80},
  key_cave:         {icon:'🗝️', name:'Cave Key',           type:'key',   biome:'cave',      color:'#907050'},
  chest_cave:       {icon:'📦', name:'Cave Chest',         type:'chest', biome:'cave',      color:'#c09060', basePrice:80},
  key_ruins:        {icon:'🗝️', name:'Ancient Key',       type:'key',   biome:'ruins',     color:'#a08040'},
  chest_ruins:      {icon:'📦', name:'Ancient Chest',     type:'chest', biome:'ruins',     color:'#d0a850', basePrice:120},
  key_dragon:       {icon:'🗝️', name:'Dragon Key',        type:'key',   biome:'dragon',    color:'#c04020'},
  chest_dragon:     {icon:'📦', name:'Dragon Chest',      type:'chest', biome:'dragon',    color:'#e06030', basePrice:120},
  key_bone:         {icon:'🗝️', name:'Bone Key',           type:'key',   biome:'boneyard',  color:'#c0c0a0'},
  chest_bone:       {icon:'📦', name:'Bone Chest',         type:'chest', biome:'boneyard',  color:'#e0e0b0', basePrice:120},
  key_astral:       {icon:'🗝️', name:'Astral Key',        type:'key',   biome:'starmaze',  color:'#8060d0'},
  chest_astral:     {icon:'📦', name:'Astral Chest',      type:'chest', biome:'starmaze',  color:'#a080f0', basePrice:200},
  key_mist:         {icon:'🗝️', name:'Mistwood Key',      type:'key',   biome:'mistwood', color:'#607080'},
  chest_mist:       {icon:'📦', name:'Mistwood Chest',    type:'chest', biome:'mistwood', color:'#8090b0', basePrice:70},
  key_wax:          {icon:'🗝️', name:'Wax Dunes Key',     type:'key',   biome:'waxdunes',  color:'#c09020'},
  chest_wax:        {icon:'📦', name:'Wax Chest',         type:'chest', biome:'waxdunes',  color:'#d4a843', basePrice:45},
  // ── Champion Cards ──
  card_druid:       {icon:'📘', name:'Druid\'s Tome',      type:'champcard', champ:'druid',       color:'#4060c0'},
  card_paladin:     {icon:'📙', name:'Paladin\'s Seal',    type:'champcard', champ:'paladin',     color:'#c06020'},
  card_thief:       {icon:'📗', name:'Thief\'s Cipher',    type:'champcard', champ:'thief',       color:'#206040'},
  card_moonsquirrel:{icon:'📕', name:'Sciurid\'s Token',   type:'champcard', champ:'moonsquirrel',color:'#804080'},
};

function addLootItem(itemId, qty){
  qty=qty||1;
  PERSIST.town.items[itemId]=(PERSIST.town.items[itemId]||0)+qty;
}

function getLootCount(itemId){
  return PERSIST.town.items[itemId]||0;
}

function rollAreaLoot(areaDef){
  var gained = [];
  var areaLevel = areaDef.levelRange ? areaDef.levelRange[0] : 1;
  var matGroup = areaDef.materialGroup;

  // Material drops — roll each material in the group
  if(matGroup && MATERIAL_DROPS[matGroup]){
    MATERIAL_DROPS[matGroup].forEach(function(entry){
      var chance = Math.min(0.95, entry.base + entry.lvlBonus * areaLevel);
      if(Math.random() < chance){
        if(!PERSIST.town.materials[entry.id]) PERSIST.town.materials[entry.id] = 0;
        PERSIST.town.materials[entry.id]++;
        var mat = MATERIALS[entry.id];
        if(mat) gained.push({type:'material', id:entry.id, name:mat.name, icon:mat.icon, rarity:mat.rarity});
      }
    });
  }

  // Round 67p: area-completion key rewards retired. The `loot.always`
  // field on each AREA_DEF (typically a biome key — key_sewers,
  // key_pale_road, key_bog, key_temple) used to grant one per clear.
  // We no longer award keys on area completion. Materials + gold from
  // the materialGroup branch above remain the meaningful drop.
  //
  // The block stays referenced (commented) so the system is easy to
  // re-enable: uncomment + add `always:'<some_loot_id>'` to AREA_DEFS.
  // Existing keys in the player's Vault inventory stay viewable; only
  // new drops are blocked.
  //
  // var loot = areaDef.loot;
  // if(loot){
  //   if(loot.always){ addLootItem(loot.always, 1); gained.push(loot.always); }
  //   if(loot.bonus && loot.bonusChance > 0 && Math.random() < loot.bonusChance){
  //     addLootItem(loot.bonus, 1); gained.push(loot.bonus);
  //   }
  // }

  if(gained.length) savePersist();
  return gained;
}

var _lootToastTimer=null;
function showLootToast(gained){
  if(!gained||!gained.length) return;
  var el=document.getElementById('levelup-toast');
  if(!el) return;
  document.getElementById('lu-toast-title').textContent='AREA COMPLETE!';
  var parts=gained.map(function(item){
    // Material drop object: {type:'material', id, name, icon, rarity}
    if(item&&item.type==='material') return item.icon+' '+item.name;
    // Legacy string loot item ID
    var def=LOOT_DEFS[item]; return def?(def.icon+' '+def.name):'?';
  }).filter(function(s){ return s!=='?'; });
  document.getElementById('lu-toast-stats').textContent=parts.join('  ·  ');
  el.style.display='block';
  clearTimeout(_lootToastTimer);
  _lootToastTimer=setTimeout(function(){ el.style.display='none'; },4000);
}

var BUILDINGS = {
  // Row 1 — Check these (claims, timers, rewards)
  vault: {
    id:'vault', name:'The Vault', icon:'📦', sprite:'vault_keeper', buildingIcon:'vault',
    npc:{name:'Shtole', title:'Vault Keeper', greeting:'Everything is accounted for.', rare:'I didn\'t shteal anything.', pitch:0.7},
    desc:'Materials and resources from your adventures.',
    unlocked:true,
  },
  adventurers_hall: {
    id:'adventurers_hall', name:"Adventurer's Hall", icon:'⚐', sprite:'guild_girl', buildingIcon:'hall',
    npc:{name:'Leona', title:'Guild Girl', greeting:'Welcome back! I mean... good to see you. Professionally.', pitch:1.5},
    desc:'Quests, bounties, and expedition dispatch.',
    unlocked:true,
  },
  bestiary: {
    id:'bestiary', name:'The Bestiary', icon:'📖', sprite:'hoot_archivist', buildingIcon:'bestiary',
    npc:{name:'Hoot', title:'Archivist', pitch:1.4, greeting:'Oh! You\'re back. Did you... see anything new out there?'},
    desc:'Records of every creature encountered. Claim discovery rewards.',
    unlocked:true,
  },
  forge: {
    id:'forge', name:'The Forge', icon:'🔨', sprite:'forge_keeper', buildingIcon:'forge',
    npc:{name:'???', title:'Blacksmith', greeting:'Bring me materials and I\'ll make something useful.'},
    desc:'Craft relics from area materials. Assign a champion to speed up.',
    unlocked:false,
  },
  // Row 2 — Use these (strategic decisions)
  sanctum: {
    id:'sanctum', name:'The Sanctum', icon:'⚗️', sprite:'sanctum_keeper', buildingIcon:'sanctum',
    // Round 42: Theo moved to the Arena. The Sanctum is now run by
    // Kaine — a cryptic armoured cleric, grandiose / poetic / mildly
    // sycophantic toward the player's power. Grima-Wormtongue energy.
    // Round 67p: named (was 'Keeper').
    npc:{name:'Kaine', title:'Sanctum Keeper', greeting:'You return, my lord. I felt your approach upon the stones.', pitch:0.95},
    desc:'Champion management. Ascend, equip relics, view decks.',
    unlocked:false,
  },
  market: {
    id:'market', name:'The Market', icon:'🛒', sprite:'merchant', buildingIcon:'market',
    npc:{name:'The Merchant', title:'Trader', greeting:'Fresh stock! Well... freshish.', pitch:1.2},
    desc:'Rotating stock of materials, tomes, and rare finds.',
    unlocked:true,
  },
  shard_well: {
    id:'shard_well', name:'The Shard Well', icon:'🔮', sprite:'shard_master', buildingIcon:'shardwell',
    // Round 42: the Shard Master — ominous, few words, cryptic. Doesn't
    // explain what the shards actually are; spooky implications hang
    // around the dialogue. Lower pitch to match the tone.
    npc:{name:'Shard Master', title:'Keeper of the Well', greeting:'They sing, when no one listens. Did you hear?', pitch:0.85},
    desc:'Generates soul shards. Summon new champions.',
    unlocked:false,
  },
  arena: {
    id:'arena', name:'The Arena', icon:'⚔️', sprite:'arena_keeper', buildingIcon:'arena',
    // Round 42: Theo (formerly the Sanctum Keeper) now manages the Arena.
    // Still an ex-champion but NOT retired — he fights sometimes when
    // the mood takes him. Hot-headed, casually braggy, more action than
    // reflection. Same casual cadence as before; sharper edges.
    npc:{name:'Theo', title:'Arena Master', greeting:'You showed up. Good. I was about to fight without you.', pitch:1.1},
    desc:'Challenge imported champion builds. PvP via champion codes.',
    unlocked:false,
  },
};

// TOWN_CARD_GEMS now returns img HTML via gemImgHTML — kept for legacy string refs
var TOWN_CARD_GEMS_EMOJI = { ruby:'💎', emerald:'💚', sapphire:'🔷', turquoise:'🩵', amethyst:'💜', topaz:'🟡', obsidian:'⬛', opal:'🌈' };
function TOWN_CARD_GEMS(tier){ return gemImgHTML(tier,'20px'); }
TOWN_CARD_GEMS.ruby=TOWN_CARD_GEMS.bind(null,'ruby'); // duck-type for bracket access

var MATERIAL_DEFS = {
  sparks:     { icon:'✨', name:'Sparks',       desc:'Common upgrade material. From any area clear.' },
  embers:     { icon:'🔥', name:'Embers',       desc:'Uncommon material. From level 3+ areas.' },
  flameShards:{ icon:'🔮', name:'Flame Shards', desc:'Rare material. From level 6+ areas.' },
  gemShards:  { icon:'💎', imgHtml:gemImgHTML('ruby','18px'), name:'Gem Shards',   desc:'Rare drops from chests. Craft 30 into a Ruby gem to power a building.' },
};

function getTownCardCap(){
  // Base cap 8; future upgrades can raise it
  return 8;
}

function getTownCardCount(){
  return (PERSIST.town.cards||[]).length;
}

function getUnslottedCards(){
  return (PERSIST.town.cards||[]).filter(function(c){ return !c.slottedIn; });
}

function getTownCardById(cardId){
  return (PERSIST.town.cards||[]).find(function(c){ return c.id===cardId; })||null;
}

// Add a gem card to town inventory (from chests, market, achievements)
function addTownCard(tier){
  if(!PERSIST.town.cards) PERSIST.town.cards=[];
  var cap=getTownCardCap();
  if(PERSIST.town.cards.length>=cap){ showTownToast('Vault full! Sell or slot existing gems first.'); return; }
  var id='tc_'+Date.now()+'_'+Math.floor(Math.random()*1000);
  PERSIST.town.cards.push({id:id, tier:tier, slottedIn:null});
  savePersist();
  showTownToast('✦ '+tier.charAt(0).toUpperCase()+tier.slice(1)+' Gem added to Vault!');
}

function slotCardIntoBuilding(cardId, buildingId){
  var card=getTownCardById(cardId);
  var b=PERSIST.town.buildings[buildingId];
  if(!card||!b) return;
  // Unslot any existing card in that building first
  if(b.slottedCard) unslotCard(b.slottedCard);
  card.slottedIn=buildingId;
  b.slottedCard=cardId;
  savePersist();
  buildTownGrid();
}

function unslotCard(cardId){
  var card=getTownCardById(cardId);
  if(!card) return;
  if(card.slottedIn){
    var b=PERSIST.town.buildings[card.slottedIn];
    if(b) b.slottedCard=null;
  }
  card.slottedIn=null;
  savePersist();
}

// ── Town screen ──
function openTown(){
  showScreen('town-screen');
  playMusic('town');
  updateNavBar('town');
  // Round 62g: town-gold removed (nav-gold owns it). subtitle stays
  // as the flavour/toast surface — showTownToast paints into it.
  document.getElementById('town-subtitle').textContent='Your settlement awaits.';
  buildTownCardsStrip();
  buildTownGrid();
  // Show return-to-battle button if a run is in progress
  var retBtn=document.getElementById('btn-return-battle');
  if(retBtn) retBtn.style.display=gs?'':'none';
  showTutorial('town_intro');
}

function leaveTown(){
  navTo('adventure');
}

function buildTownCardsStrip(){ /* town card strip UI removed — gem slots deprecated */ }

// ── Building unlock costs ─────────────────────────────────────────────────
var BUILDING_UNLOCK_COSTS = {
  forge:    { achId:'rising_power',  desc:'Reach level 3. The Forge unlocks automatically.' },
  adventurers_hall: { achId:'battle_hardened', desc:'Reach level 5. The Adventurer\'s Hall unlocks automatically.' },
  bestiary: { seenCount:10, gold:100, desc:'Unlocked by encountering 10 different enemies, or purchase for 100 gold.' },
  market:   { gold:150, desc:'Purchase The Market for 150 gold to buy chests.' },
  sanctum:  { gold:250, desc:'Purchase The Sanctum for 250 gold to customise champion decks and relics.' },
  shard_well:{ gold:300, desc:'Purchase the Shard Well for 300 gold.' },
  arena:    { gold:500, desc:'Purchase The Arena for 500 gold.' },
};

function tryUnlockBuilding(id){
  var cost=BUILDING_UNLOCK_COSTS[id];
  if(!cost) return;
  var b=PERSIST.town.buildings[id];
  if(!b||b.unlocked) return;

  if(cost.seenCount){
    var seen=PERSIST.seenEnemies.length;
    if(seen>=cost.seenCount){
      // Free unlock
    } else if(cost.gold&&PERSIST.gold>=cost.gold){
      PERSIST.gold-=cost.gold;
      if(typeof refreshNavCurrencies === 'function') refreshNavCurrencies();
    } else {
      showTownToast('See '+(cost.seenCount-seen)+' more enemies, or need '+cost.gold+'g to buy.');
      return;
    }
  } else if(cost.achId){
    var ach=ACHIEVEMENTS.find(function(a){return a.id===cost.achId;});
    if(!ach||!isAchComplete(ach)){
      showTownToast('Achievement required to unlock this building.');
      return;
    }
  } else if(cost.gold){
    if(PERSIST.gold<cost.gold){ showTownToast('Need ✦'+cost.gold+' gold.'); return; }
    PERSIST.gold-=cost.gold;
    if(typeof refreshNavCurrencies === 'function') refreshNavCurrencies();
  }

  b.unlocked=true;
  savePersist();
  showTownToast('✦ '+(BUILDINGS[id]?BUILDINGS[id].name:id)+' unlocked!');
  buildTownGrid();
  openBuilding(id);
}

// ── Building XP / level ───────────────────────────────────────────────────
var VAULT_XP_PER_LEVEL = [100,200,350,550,800,1100,1500,2000,2600,3300];

function getBuildingXpToNext(level){
  // 100 base, increasing per level
  return Math.round(100 * Math.pow(1.4, level - 1));
}

function getBuildingLevel(id){
  return (PERSIST.town.buildingLevel&&PERSIST.town.buildingLevel[id])||1;
}

function addBuildingXp(id, xp){
  if(!PERSIST.town.buildings[id]||!PERSIST.town.buildings[id].unlocked) return;
  if(!PERSIST.town.buildingXp) PERSIST.town.buildingXp={};
  if(!PERSIST.town.buildingLevel) PERSIST.town.buildingLevel={};
  PERSIST.town.buildingXp[id]=(PERSIST.town.buildingXp[id]||0)+xp;
  var level=PERSIST.town.buildingLevel[id]||1;
  var toNext=getBuildingXpToNext(level);
  while(PERSIST.town.buildingXp[id]>=toNext){
    PERSIST.town.buildingXp[id]-=toNext;
    PERSIST.town.buildingLevel[id]=(PERSIST.town.buildingLevel[id]||1)+1;
    level=PERSIST.town.buildingLevel[id];
    toNext=getBuildingXpToNext(level);
    showTownToast((BUILDINGS[id]?BUILDINGS[id].name:id)+' reached level '+level+'!');
    if(id==='vault') PERSIST.town.vaultLevel=level;
  }
}

function grantAreaClearBuildingXp(areaLevel){
  var xp=10+areaLevel*2;
  var blds=PERSIST.town.buildings;
  Object.keys(blds).forEach(function(id){
    if(blds[id]&&blds[id].unlocked) addBuildingXp(id, xp);
  });
}

// ── Shard Well: action functions (Round 40) ──────────────────────────────
var SHARD_WELL_MAX_ROSTER = 3;

// Assign a champion to a specific slot (0..2). If the slot already has
// someone, they get released first. The champion's lockedShardWell is
// set to the slot index. Re-renders the panel.
function _shardWellAssign(slotIdx, champId){
  var b = PERSIST.town.buildings.shard_well;
  if(!b) return;
  if(slotIdx < 0 || slotIdx >= SHARD_WELL_MAX_ROSTER) return;
  if(!CREATURES[champId]) return;
  if(typeof isChampLocked === 'function' && isChampLocked(champId)){
    showTownToast(CREATURES[champId].name + ' is busy elsewhere.');
    return;
  }
  if(!Array.isArray(b.assignedChampIds)) b.assignedChampIds = [];
  // Release whoever is in that slot
  var prevId = b.assignedChampIds[slotIdx];
  if(prevId){
    var prevCp = PERSIST.champions[prevId];
    if(prevCp) prevCp.lockedShardWell = null;
  }
  // Place the new champion
  b.assignedChampIds[slotIdx] = champId;
  var cp = getChampPersist(champId);
  if(cp) cp.lockedShardWell = slotIdx;
  savePersist();
  showTownToast(CREATURES[champId].name + ' assigned to the well.');
  refreshShardWellPanel();
}

function _shardWellRelease(slotIdx){
  var b = PERSIST.town.buildings.shard_well;
  if(!b || !Array.isArray(b.assignedChampIds)) return;
  var id = b.assignedChampIds[slotIdx];
  if(!id) return;
  var cp = PERSIST.champions[id];
  if(cp && cp.lockedShardWell !== null && cp.lockedShardWell !== undefined){
    cp.lockedShardWell = null;
  }
  b.assignedChampIds[slotIdx] = null;
  // Compact array — remove trailing nulls but keep slot indices intact
  // by leaving in-between nulls. We're treating the array as fixed-length
  // 3 slots, so just clear in-place.
  savePersist();
  if(CREATURES[id]) showTownToast(CREATURES[id].name + ' returned from the well.');
  refreshShardWellPanel();
}

// Spend one stat point on rate or cap. Triangle cost: each successive
// upgrade costs more points, so going to +5 costs 1+2+3+4+5 = 15 points.
function _shardWellSpendPoint(field){
  var b = PERSIST.town.buildings.shard_well;
  if(!b) return;
  if(field !== 'rate' && field !== 'cap') return;
  var current = (field === 'rate' ? b.rateLevel : b.capLevel) || 0;
  var cost = (typeof getShardWellPointCost === 'function') ? getShardWellPointCost(current) : (current + 1);
  if((b.unspentPoints||0) < cost){
    showTownToast('Not enough points (need '+cost+').');
    return;
  }
  b.unspentPoints -= cost;
  if(field === 'rate') b.rateLevel = (b.rateLevel||0) + 1;
  else                 b.capLevel  = (b.capLevel||0) + 1;
  savePersist();
  refreshShardWellPanel();
}

// Round 44: claim transfers the well's pending pool to the player's
// global soul-shard pool. Free to call any time; just no-op if there's
// nothing pending.
//
// Round 46: claim now animates the drain in place — bar width to 0%
// (CSS transition handles the slide), count ticks down via rAF, and
// the portrait gets a brief glow pulse. Persist state is committed
// immediately (so the player doesn't lose progress if they close mid-
// animation), and the full panel refresh is deferred until after the
// animation finishes so the buttons / mode banner / etc. don't flash.
function _shardWellClaim(){
  var b = PERSIST.town.buildings.shard_well;
  if(!b || !b.unlocked) return;
  var pending = b.pendingShards || 0;
  if(pending <= 0){
    showTownToast('Nothing to claim yet.');
    return;
  }
  var cap = (typeof getShardWellCap === 'function') ? getShardWellCap() : pending;

  // Commit state immediately — animation is purely cosmetic.
  PERSIST.soulShards = (PERSIST.soulShards || 0) + pending;
  b.pendingShards = 0;

  // SFX: dedicated well_claim cue (Round 46 — registered in audio.js,
  // file at assets/audio/sfx/well_claim.mp3). playSfx silently no-ops
  // if the file isn't present yet.
  if(typeof playSfx === 'function') playSfx('well_claim');

  showTownToast('+'+pending+' Soul Shard'+(pending===1?'':'s')+' claimed.');
  savePersist();

  // ── Animation pass ──────────────────────────────────────────────
  var DUR = 700; // ms — matches the bar's CSS transition (0.6s) + a bit
  var barEl     = document.getElementById('sw-cap-bar-fill');
  var countEl   = document.getElementById('sw-hero-count');
  var portrait  = document.getElementById('sw-hero-portrait');
  var hasDom = !!(barEl || countEl || portrait);

  if(!hasDom){
    // Panel not on screen (or DOM missing) — just snap-refresh.
    refreshShardWellPanel();
    return;
  }

  // Bar: drop the .full class (kills the pulsing glow) and shove width
  // to 0% — existing CSS .sw-cap-bar-fill transition handles the slide.
  if(barEl){
    barEl.classList.remove('full');
    barEl.style.width = '0%';
  }

  // Portrait pulse — class added now, removed after the animation.
  if(portrait){
    portrait.classList.add('sw-claim-pulse');
  }

  // Count tick-down via rAF.
  if(countEl){
    var startTs = null;
    var startVal = pending;
    function step(ts){
      if(startTs === null) startTs = ts;
      var t = Math.min(1, (ts - startTs) / DUR);
      // ease-out cubic for a snappier feel
      var eased = 1 - Math.pow(1 - t, 3);
      var cur = Math.max(0, Math.round(startVal * (1 - eased)));
      countEl.textContent = cur + ' / ' + cap;
      if(t < 1) requestAnimationFrame(step);
      else countEl.textContent = '0 / ' + cap;
    }
    requestAnimationFrame(step);
  }

  // After the visual settles, re-render to repaint the CTA buttons,
  // mode banner, time-to-fill, etc.
  setTimeout(function(){
    if(portrait) portrait.classList.remove('sw-claim-pulse');
    refreshShardWellPanel();
  }, DUR + 60);
}

// Respec — refunds all spent points to the unspent pool, costs gold scaling
// with well level. Player can then re-allocate freely.
function _shardWellRespecCost(){
  var b = PERSIST.town.buildings.shard_well;
  if(!b) return 0;
  return 100 * (b.wellLevel || 1);
}
function _shardWellRespec(){
  var b = PERSIST.town.buildings.shard_well;
  if(!b) return;
  var cost = _shardWellRespecCost();
  if((PERSIST.gold||0) < cost){
    showTownToast('Need '+cost+' gold to recalibrate.');
    return;
  }
  // Sum up the points to refund: triangle for rate + triangle for cap
  var refund = 0;
  for(var r=1; r<=(b.rateLevel||0); r++) refund += r;
  for(var c=1; c<=(b.capLevel||0); c++)  refund += c;
  PERSIST.gold -= cost;
  b.unspentPoints = (b.unspentPoints||0) + refund;
  b.rateLevel = 0;
  b.capLevel  = 0;
  savePersist();
  showTownToast('Well recalibrated. '+refund+' points refunded.');
  refreshShardWellPanel();
}

// ── Shard Well panel (Round 41 layout pass) ─────────────────────────────
// Matches the chrome other buildings use: NPC greeting → level/XP row →
// per-building body. Body laid out as:
//   1. HERO BAND (full width) — soul-shard sprite + cap-fill progress bar
//                                + rate readout + SUMMON CTA
//   2. MODE BANNER (full width) — which stat is dominant + flavour line
//   3. BODY GRID (60/40)
//        LEFT (60%) — 3 champion slots + combined stats readout
//        RIGHT (40%) — RATE/CAP dials with [+] + RECALIBRATE
function refreshShardWellPanel(){
  showLockedBuildingUI('shard_well');
  var b = PERSIST.town.buildings.shard_well;
  if(!b || !b.unlocked) return;
  var inner = document.getElementById('shard_well-inner');
  if(!inner) return;

  // Round 44: pendingShards is the well's own pool (filled by tick,
  // capped). The player's PERSIST.soulShards is global — also bumped
  // by run completions and quest rewards. SUMMON spends from
  // PERSIST.soulShards. The hero band shows both.
  var pending  = b.pendingShards || 0;
  var souls    = PERSIST.soulShards || 0;
  var cap      = getShardWellCap();
  var secsPer  = getShardWellSecsPerShard();
  var canSummon = souls >= SOUL_SHARDS_PER_PULL;
  var canClaim = pending > 0;
  var atCap    = pending >= cap;

  if(!Array.isArray(b.assignedChampIds)) b.assignedChampIds = [];
  var roster = b.assignedChampIds.slice(0, SHARD_WELL_MAX_ROSTER);
  var effect = champShardWellEffect(roster);
  var modeKey = effect.eff.mode || 'EMPTY';

  // Mode descriptions
  var modeCopy = {
    EMPTY:      { title:'WELL DORMANT',    desc:'Assign champions to channel their stats into the well.' },
    INVESTMENT: { title:'INVESTMENT MODE', desc:'STR dominant. Well levels up faster, generation modest.' },
    GENERATION: { title:'GENERATION MODE', desc:'AGI dominant. Shards generate faster.' },
    CAPACITY:   { title:'CAPACITY MODE',   desc:'WIS dominant. Well holds more before stopping.' },
    BALANCED:   { title:'BALANCED MODE',   desc:'All stats equal. Every dial benefits at full strength.' },
    DUAL:       { title:'DUAL MODE',       desc:'Two stats tied for dominance. Both contribute fully.' }
  }[modeKey] || { title:'EMPTY', desc:'No assignment.' };

  // Time to fill / fill percent — based on the WELL's pending pool,
  // not the player's total. When at cap, generation has stopped and
  // the player is prompted to CLAIM.
  var remaining = Math.max(0, cap - pending);
  var timeToFill = remaining * secsPer;
  var ttfStr = atCap ? 'AT CAP. CLAIM TO RESUME' : (
                 timeToFill < 60   ? Math.ceil(timeToFill)+'s' :
                 timeToFill < 3600 ? Math.ceil(timeToFill/60)+'m' :
                 Math.floor(timeToFill/3600)+'h '+Math.ceil((timeToFill%3600)/60)+'m'
               );
  var fillPct = cap > 0 ? Math.min(100, Math.round((pending/cap)*100)) : 0;

  // Well-level XP
  var nextLvXp = getShardWellXpForLevel(b.wellLevel||1);
  var xpPct    = Math.min(100, Math.round(((b.wellXp||0) / nextLvXp) * 100));
  var unspent  = b.unspentPoints || 0;

  // Stat-point dials
  var rateRank = b.rateLevel || 0;
  var capRank  = b.capLevel  || 0;
  var rateCost = getShardWellPointCost(rateRank);
  var capCost  = getShardWellPointCost(capRank);
  var canBuyRate = unspent >= rateCost;
  var canBuyCap  = unspent >= capCost;

  // Combined stats + per-stat efficiency
  var combined = effect.combined;
  var eff      = effect.eff;
  function _swEffPct(e){ return Math.round((e||0) * 100); }

  // ── Build markup top-to-bottom ──────────────────────────────────────
  var html = '';

  // NPC GREETING + LEVEL ROW (matches Forge / Hall / Sanctum chrome)
  html +=
      '<div class="npc-greeting" id="shard_well-npc-greeting">'
    +   '<div class="npc-greeting-sprite"><img src="assets/creatures/shard_master.png" alt="Shard Master" onerror="this.parentNode.textContent=\'🔮\'"></div>'
    +   '<div class="npc-greeting-text">'
    +     '<div class="npc-greeting-name">SHARD MASTER</div>'
    +     '<div class="npc-greeting-msg" id="shard_well-npc-msg"></div>'
    +   '</div>'
    + '</div>'
    + '<div class="vault-level-row">'
    +   '<span class="vault-level-badge" id="sw-level-badge">WELL Lv.'+(b.wellLevel||1)+'</span>'
    +   '<div class="vault-xp-wrap"><div class="vault-xp-bar" id="sw-xp-bar" style="width:'+xpPct+'%;"></div></div>'
    +   '<span class="vault-xp-txt" id="sw-xp-txt">'+Math.floor(b.wellXp||0)+' / '+nextLvXp+' XP'
    +     (unspent > 0 ? ' · <span style="color:#9adc7e;">'+unspent+' point'+(unspent===1?'':'s')+'</span>' : '')
    +   '</span>'
    + '</div>';

  // HERO BAND — visual focus. Headline shows the WELL POOL (pending/
  // cap) — that's what the player is filling. Beneath it: cap-fill bar
  // + rate + time-to-fill. CTA column has CLAIM (transfers pending
  // to player pool) on top, SUMMON below (spends from player pool,
  // costs SOUL_SHARDS_PER_PULL). Player's global pool count sits
  // under SUMMON as context. (Round 44.)
  html +=
      '<div class="sw-hero">'
    +   '<div class="sw-hero-portrait" id="sw-hero-portrait">'
    +     (typeof soulShardImgHTML === 'function' ? soulShardImgHTML('96px') : '<span style="font-size:64px;">🔮</span>')
    +   '</div>'
    +   '<div class="sw-hero-main">'
    +     '<div class="sw-hero-headline">'
    +       '<span class="sw-hero-count" id="sw-hero-count" data-pending="'+pending+'" data-cap="'+cap+'">'+pending+' / '+cap+'</span>'
    +       '<span class="sw-hero-label">in the Well</span>'
    +     '</div>'
    +     '<div class="sw-cap-bar"><div class="sw-cap-bar-fill'+(atCap?' full':'')+'" id="sw-cap-bar-fill" style="width:'+fillPct+'%;"></div></div>'
    +     '<div class="sw-hero-meta">'
    +       '<span>1 shard every '+_swFmtSecs(secsPer)+'</span>'
    +       '<span>'+ttfStr+'</span>'
    +     '</div>'
    +   '</div>'
    +   '<div class="sw-hero-cta">'
    +     '<button class="sw-claim-btn" onclick="_shardWellClaim()" '+(canClaim?'':'disabled')+'>'
    +       '<span class="sw-claim-icon">↓</span>'
    +       '<span class="sw-claim-label">CLAIM</span>'
    +       '<span class="sw-claim-amount">'+(canClaim?'+'+pending+' shard'+(pending===1?'':'s'):'nothing yet')+'</span>'
    +     '</button>'
    +     '<button class="sw-summon-btn" onclick="openSummonsPanel()">'
    +       '<span class="sw-summon-icon">✦</span>'
    +       '<span class="sw-summon-label">SUMMON</span>'
    +       '<span class="sw-summon-cost">'+souls+' shards</span>'
    +     '</button>'
    +   '</div>'
    + '</div>';

  // MODE BANNER — full width
  html +=
      '<div class="sw-mode sw-mode-'+modeKey.toLowerCase()+'">'
    +   '<div class="sw-mode-title">'+modeCopy.title+'</div>'
    +   '<div class="sw-mode-desc">'+modeCopy.desc+'</div>'
    + '</div>';

  // BODY GRID — 60/40 split
  // ── LEFT: champions roster + combined stats ──
  var leftHtml = '<div class="sw-body-left">'
    + '<div class="sw-section-label">CHANNELING CHAMPIONS</div>'
    + '<div class="sw-roster">';
  for(var i=0; i<SHARD_WELL_MAX_ROSTER; i++){
    var champId = roster[i];
    if(champId && CREATURES[champId]){
      var ch = CREATURES[champId];
      var cp = getChampPersist(champId);
      leftHtml += '<div class="sw-slot sw-slot-filled" onclick="_shardWellPickForSlot('+i+')">'
        + '<div class="sw-slot-portrait">'+creatureImgHTML(champId, ch.icon, '64px')+'</div>'
        + '<div class="sw-slot-name">'+ch.name+'</div>'
        + '<div class="sw-slot-stats">'
        +   '<span class="sw-stat str">STR '+Math.round(cp.stats.str)+'</span> '
        +   '<span class="sw-stat agi">AGI '+Math.round(cp.stats.agi)+'</span> '
        +   '<span class="sw-stat wis">WIS '+Math.round(cp.stats.wis)+'</span>'
        + '</div>'
        + '<button class="sw-slot-x" onclick="event.stopPropagation();_shardWellRelease('+i+');" title="Release">×</button>'
        + '</div>';
    } else {
      leftHtml += '<div class="sw-slot sw-slot-empty" onclick="_shardWellPickForSlot('+i+')">'
        + '<div class="sw-slot-plus">+</div>'
        + '<div class="sw-slot-empty-label">SLOT '+(i+1)+'</div>'
        + '<div class="sw-slot-empty-hint">tap to assign</div>'
        + '</div>';
    }
  }
  leftHtml += '</div>'
    + '<div class="sw-combined">'
    +   '<div class="sw-combined-label">COMBINED · EFFICIENCY</div>'
    +   '<div class="sw-combined-row">'
    +     '<span class="sw-combined-cell"><span class="sw-stat str">STR</span> '+combined.str+' <span class="sw-eff">('+_swEffPct(eff.str)+'%)</span></span>'
    +     '<span class="sw-combined-cell"><span class="sw-stat agi">AGI</span> '+combined.agi+' <span class="sw-eff">('+_swEffPct(eff.agi)+'%)</span></span>'
    +     '<span class="sw-combined-cell"><span class="sw-stat wis">WIS</span> '+combined.wis+' <span class="sw-eff">('+_swEffPct(eff.wis)+'%)</span></span>'
    +   '</div>'
    + '</div>'
    + '</div>';

  // ── RIGHT: dials + recalibrate ──
  var rightHtml = '<div class="sw-body-right">'
    + '<div class="sw-section-label">UPGRADES'+(unspent > 0 ? ' · <span style="color:#9adc7e;">'+unspent+' to spend</span>' : '')+'</div>'
    + '<div class="sw-dial-card">'
    +   '<div class="sw-dial-row">'
    +     '<span class="sw-dial-label">RATE</span>'
    +     '<span class="sw-dial-rank">+'+rateRank+'</span>'
    +     '<button class="sw-plus" '+(canBuyRate?'':'disabled')+' onclick="_shardWellSpendPoint(\'rate\')" title="Cost: '+rateCost+' point'+(rateCost===1?'':'s')+'">+ '+rateCost+'</button>'
    +   '</div>'
    +   '<div class="sw-dial-extra">'+(SHARD_WELL_RATE_PT_PCT*100).toFixed(0)+'% faster generation per level</div>'
    + '</div>'
    + '<div class="sw-dial-card">'
    +   '<div class="sw-dial-row">'
    +     '<span class="sw-dial-label">CAP</span>'
    +     '<span class="sw-dial-rank">+'+capRank+'</span>'
    +     '<button class="sw-plus" '+(canBuyCap?'':'disabled')+' onclick="_shardWellSpendPoint(\'cap\')" title="Cost: '+capCost+' point'+(capCost===1?'':'s')+'">+ '+capCost+'</button>'
    +   '</div>'
    +   '<div class="sw-dial-extra">+1 shard storage per level</div>'
    + '</div>'
    + '<div class="sw-respec-card">'
    +   '<button class="sw-respec-btn" onclick="_shardWellRespec()">↺ Recalibrate</button>'
    +   '<div class="sw-respec-meta">Refunds all spent points · '+_shardWellRespecCost()+' g</div>'
    + '</div>'
    + '</div>';

  html += '<div class="sw-body-grid">' + leftHtml + rightHtml + '</div>'
    + '<div id="summon-result" style="margin-top:12px;"></div>';

  inner.innerHTML = html;

  // Trigger NPC greeting once the markup is mounted (typewriter effect).
  // Uses the shared playNpcGreeting helper so the well plays nice with
  // the NPC dialogue system. opts.once so it doesn't re-greet on every
  // refresh (panel re-renders frequently as XP fills).
  if(typeof playNpcGreeting === 'function'){
    playNpcGreeting('shard_well', {once:true});
  }

  // Round 63 followup: if offline progress accumulated well XP and the
  // animation hasn't played yet, replay it now so the player SEES
  // the gain land. Marks `wellAnimated` immediately to gate against
  // double-play on a quick close/reopen.
  _maybePlayWellXpAnimation();
}

// Animate the Shard Well's XP bar from its pre-offline state to the
// post-offline state. Handles multi-level-up by walking forward
// through the level chain — the bar visually wraps each time it
// hits its threshold. Linear progress against a duration that
// scales with the magnitude of XP gained (so a small bump is quick,
// a big offline session takes ~2.5s).
function _maybePlayWellXpAnimation(){
  if(typeof getOfflineGains !== 'function') return;
  var g = getOfflineGains();
  if(!g || g.wellAnimated) return;
  var beforeLevel = g.wellLevelBefore || 1;
  var beforeXp    = g.wellXpBefore || 0;
  var afterLevel  = g.wellLevelAfter || beforeLevel;
  var afterXp     = g.wellXpAfter || 0;
  if(beforeLevel === afterLevel && Math.abs(afterXp - beforeXp) < 0.5) return;

  // Mark immediately so re-entries during animation don't double-run.
  g.wellAnimated = true;

  var bar      = document.getElementById('sw-xp-bar');
  var lvlBadge = document.getElementById('sw-level-badge');
  var xpTxt    = document.getElementById('sw-xp-txt');
  if(!bar) return;

  // Total XP gained across the chain.
  var totalGained = 0;
  if(afterLevel > beforeLevel){
    totalGained += getShardWellXpForLevel(beforeLevel) - beforeXp;
    for(var l = beforeLevel + 1; l < afterLevel; l++){
      totalGained += getShardWellXpForLevel(l);
    }
    totalGained += afterXp;
  } else {
    totalGained = Math.max(0, afterXp - beforeXp);
  }
  if(totalGained <= 0) return;

  // Paint pre-offline state immediately so the animation starts there.
  var startThresh = getShardWellXpForLevel(beforeLevel);
  var startPct = Math.min(100, (beforeXp / startThresh) * 100);
  bar.style.transition = 'none';
  bar.style.width = startPct + '%';
  if(lvlBadge) lvlBadge.textContent = 'WELL Lv.' + beforeLevel;
  if(xpTxt)    xpTxt.textContent    = Math.floor(beforeXp) + ' / ' + startThresh + ' XP';

  // Duration scales with how much XP was gained — log curve keeps it
  // snappy for small gains but doesn't drag forever for huge ones.
  var duration = Math.max(800, Math.min(2500, 700 + Math.log2(totalGained + 2) * 250));
  var startTime = performance.now();

  function frame(now){
    var p = Math.min(1, (now - startTime) / duration);
    // Quadratic ease-out feels nice — fast at first, slows into final
    var eased = 1 - (1 - p) * (1 - p);
    var consumed = totalGained * eased;

    // Walk forward from before-state.
    var v  = beforeXp + consumed;
    var lv = beforeLevel;
    var safety = 32;
    while(safety-- > 0 && v >= getShardWellXpForLevel(lv)){
      v -= getShardWellXpForLevel(lv);
      lv += 1;
    }
    var thresh = getShardWellXpForLevel(lv);
    var pct = Math.min(100, (v / thresh) * 100);
    bar.style.width = pct + '%';
    if(lvlBadge) lvlBadge.textContent = 'WELL Lv.' + lv;
    if(xpTxt)    xpTxt.textContent    = Math.floor(v) + ' / ' + thresh + ' XP';

    if(p < 1) requestAnimationFrame(frame);
    else {
      // Restore the transition so future tick-driven width changes
      // animate smoothly again.
      bar.style.transition = '';
    }
  }
  // Defer to next frame so the "set start state" paint happens first
  // (without it the browser would batch start+animate into one frame).
  requestAnimationFrame(function(){ requestAnimationFrame(frame); });
}

// Format seconds as the player would understand it. Used for the
// "1 shard every X" line in the well header.
function _swFmtSecs(s){
  if(s < 60) return s + 's';
  if(s < 3600) return Math.round(s/60*10)/10 + 'm';
  return (Math.round(s/360)/10) + 'h';
}

// Champion picker for the well — single slot at a time. Filters out
// champions already locked elsewhere (forge / expedition / other well
// slot). Click a champion to assign to slot N. If a champion is already
// in slot N, clicking the slot calls release first via the panel button.
function _shardWellPickForSlot(slotIdx){
  var b = PERSIST.town.buildings.shard_well;
  if(!b || !b.unlocked) return;
  if(slotIdx < 0 || slotIdx >= SHARD_WELL_MAX_ROSTER) return;

  // If slot is filled, the [×] on the slot already releases; clicking
  // the body opens the picker to swap. We always show the picker and
  // let the user choose someone else (or close to keep current).
  var existing = document.getElementById('exp-popup');
  if(existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'exp-popup';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;';
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };

  var box = document.createElement('div');
  box.style.cssText = 'background:#1a0f06;border:1px solid #5a3418;border-radius:10px;padding:20px 24px;width:min(620px,90vw);max-height:75vh;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,.8);';
  box.onclick = function(e){ e.stopPropagation(); };

  // Available = unlocked champions not currently locked elsewhere.
  // Champion already in THIS slot is shown so the player can re-pick
  // the same one (no-op) or someone else.
  var currentInSlot = (b.assignedChampIds||[])[slotIdx] || null;
  var available = (PERSIST.unlockedChamps||[]).filter(function(id){
    if(!CREATURES[id] || id === 'dojo_tiger') return false;
    if(id === currentInSlot) return true; // always show whoever's already in slot
    var cp = PERSIST.champions[id];
    if(!cp) return true;
    if(cp.lockedExpedition !== null && cp.lockedExpedition !== undefined) return false;
    if(cp.lockedForge      !== null && cp.lockedForge      !== undefined) return false;
    if(cp.lockedShardWell  !== null && cp.lockedShardWell  !== undefined) return false;
    return true;
  });

  // Sort by total stats desc — gives a sense of "strongest first" but
  // doesn't bias toward any particular stat (player may want any).
  available.sort(function(a, b){
    var ca = getChampPersist(a), cb = getChampPersist(b);
    var sa = (ca.stats.str||0) + (ca.stats.agi||0) + (ca.stats.wis||0);
    var sb = (cb.stats.str||0) + (cb.stats.agi||0) + (cb.stats.wis||0);
    return sb - sa;
  });

  // Round 59: formula hint ("STR builds well XP · AGI speeds generation
  // · WIS raises cap") removed. Mechanics live in the Shard Well
  // tutorial; the picker is for choosing a champion, not for re-teaching.
  var html = '<div style="font-size:12px;color:#d4a843;letter-spacing:3px;margin-bottom:14px;">ASSIGN TO SLOT '+(slotIdx+1)+'</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">';

  available.forEach(function(id){
    var ch = CREATURES[id]; var cp = getChampPersist(id);
    var isCurrent = id === currentInSlot;
    html += '<div class="exp-pick-option '+getAscensionClass(id)+(isCurrent?' selected':'')+'" style="position:relative;padding:12px 8px;" onclick="document.getElementById(\'exp-popup\').remove();_shardWellAssign('+slotIdx+',\''+id+'\');">'
      + (isCurrent?'<div style="position:absolute;top:4px;right:6px;font-size:11px;color:#9adc7e;">✓</div>':'')
      + '<div style="margin-bottom:6px;">'+creatureImgHTML(id,ch.icon,'32px')+'</div>'
      + '<div style="font-size:10px;color:#c0a060;">'+ch.name+'</div>'
      + '<div style="font-size:7px;color:#5a4020;">Lv.'+cp.level+' '+getAscensionChipHTML(id)+'</div>'
      + '<div style="font-size:7px;color:#4a3020;margin-top:3px;">'
      +   '<span style="color:#e88060;">STR</span>:'+Math.round(cp.stats.str)+' '
      +   '<span style="color:#9adc7e;">AGI</span>:'+Math.round(cp.stats.agi)+' '
      +   '<span style="color:#9ad8e8;">WIS</span>:'+Math.round(cp.stats.wis)
      + '</div>'
      + '</div>';
  });
  if(!available.length){
    html += '<div style="font-size:9px;color:#3a2010;font-style:italic;padding:12px;">All champions are busy elsewhere.</div>';
  }
  html += '</div>';

  // Cancel / clear-slot row at the bottom
  html += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">';
  if(currentInSlot){
    html += '<button onclick="document.getElementById(\'exp-popup\').remove();_shardWellRelease('+slotIdx+');" '
      + 'style="font-size:9px;padding:7px 14px;border-radius:3px;border:1px solid #5a2020;background:transparent;color:#a04040;cursor:pointer;letter-spacing:1px;">CLEAR SLOT</button>';
  }
  html += '<button onclick="document.getElementById(\'exp-popup\').remove();" '
    + 'style="font-size:9px;padding:7px 14px;border-radius:3px;border:1px solid #5a3a18;background:transparent;color:#a08858;cursor:pointer;letter-spacing:1px;">CANCEL</button>';
  html += '</div>';

  box.innerHTML = html;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}


// ── Building panel management ─────────────────────────────────────────────

function refreshBuildingPanel(id){
  if(id==='vault') refreshVaultPanel();
  else if(id==='forge') refreshForgePanel();
  else if(id==='bestiary') refreshBestiaryPanel();
  else if(id==='market') refreshMarketPanel();
  else if(id==='sanctum') refreshSanctumPanel();
  else if(id==='adventurers_hall') refreshAdventurersHallPanel();
  else if(id==='shard_well') refreshShardWellPanel();
  else if(id==='arena') refreshArenaPanel();
}

// Placeholder panels for buildings not yet implemented
function refreshAdventurersHallPanel(){ _renderHallContent(); }

// Round 48: refreshArenaPanel was relocated to data/arena.js — single
// source of truth lives there alongside the rest of the Arena code
// (sparring tick, challenge code decode, etc.). town.js still calls it
// via refreshBuildingPanel(id) dispatch above; arena.js loads after
// town.js so the canonical version is defined by the time anything
// triggers it. See data/arena.js for the body.

var _hallTab = 'quests';

// ══════════════════════════════════════════════════════════════
// NPC REACTIVE DIALOGUE SYSTEM
// ══════════════════════════════════════════════════════════════
// getNpcGreeting(buildingId) → string
// Checks conditions in priority order, returns first match.
// Falls back to random pool if no conditions met.
// One-shot milestones tracked in PERSIST.seenNpcLines.

var NPC_CONDITIONS = {
  vault: [
    // Urgent
    {id:'mat_at_cap', check:function(){
      var cap = getVaultMatCap();
      var groups = Object.keys(MATERIAL_DROPS);
      for(var g=0;g<groups.length;g++){
        var entries = MATERIAL_DROPS[groups[g]];
        for(var e=0;e<entries.length;e++){
          if((PERSIST.town.materials[entries[e].id]||0) >= cap) return true;
        }
      }
      return false;
    }, lines:['The shelves are full. Spend some at the Forge before your next run.','No more room. You need to use some of these materials.','Storage is at capacity. The Forge is waiting.']},

    {id:'mat_near_cap', check:function(){
      var cap = getVaultMatCap();
      var threshold = Math.floor(cap * 0.8);
      var nearCount = 0;
      var groups = Object.keys(MATERIAL_DROPS);
      for(var g=0;g<groups.length;g++){
        var entries = MATERIAL_DROPS[groups[g]];
        for(var e=0;e<entries.length;e++){
          if((PERSIST.town.materials[entries[e].id]||0) >= threshold) nearCount++;
        }
      }
      return nearCount >= 2;
    }, lines:['Getting tight on space. The Forge could use some of these.','I may have to start stacking things on the floor.']},

    // Milestones (one-shot)
    {id:'first_cap_ever', oneShot:true, check:function(){
      var cap = getVaultMatCap();
      var groups = Object.keys(MATERIAL_DROPS);
      for(var g=0;g<groups.length;g++){
        var entries = MATERIAL_DROPS[groups[g]];
        for(var e=0;e<entries.length;e++){
          if((PERSIST.town.materials[entries[e].id]||0) >= cap) return true;
        }
      }
      return false;
    }, lines:['Full shelves. A good problem. But still a problem.']},

    {id:'first_relic', oneShot:true, check:function(){
      return Object.keys(PERSIST.town.relics||{}).some(function(k){ return (PERSIST.town.relics[k]||0)>0; });
    }, lines:['A relic. Handle it carefully. These don\'t come back.']},

    {id:'first_all_areas', oneShot:true, check:function(){
      var groups = Object.keys(MATERIAL_DROPS);
      return groups.every(function(g){
        return MATERIAL_DROPS[g].some(function(e){ return (PERSIST.town.materials[e.id]||0) > 0; });
      });
    }, lines:['Every region accounted for. Thorough.']},

    // Cross-building awareness
    {id:'quest_complete', check:function(){
      var q = PERSIST.town.quests;
      if(!q || !q.active || !q.offered) return false;
      var activeQ = q.offered.find(function(o){ return o.id === q.active.id; });
      return activeQ && q.active.progress >= activeQ.target;
    }, lines:['Leona mentioned something about a reward for you.','I think Leona has good news. Check the Hall.']},

    {id:'expedition_returned', check:function(){
      var ahB = PERSIST.town.buildings.adventurers_hall;
      if(!ahB || !ahB.expeditionSlots) return false;
      return ahB.expeditionSlots.some(function(s){
        return s.champId && s.startTime && Date.now() >= s.startTime + s.totalMs;
      });
    }, lines:['One of your champions came back. You should check the Hall.']},

    {id:'forge_complete', check:function(){
      var fq = (PERSIST.town.buildings.forge && PERSIST.town.buildings.forge.queue) || [];
      if(fq.length === 0) return false;
      return Date.now() >= fq[0].startTime + fq[0].totalMs;
    }, lines:['I think the Forge finished something. Smelled like hot metal.']},

    // Mood
    {id:'rich', check:function(){ return PERSIST.gold > 5000; },
     lines:['You have more gold than shelf space. Impressive.','Quite the fortune you are building.']},

    {id:'broke', check:function(){ return PERSIST.gold < 10; },
     lines:['Lean times. But the shelves are still here.','The Board might have work, if you need gold.']},

    {id:'empty_vault', check:function(){
      var total = 0;
      Object.keys(PERSIST.town.materials||{}).forEach(function(k){ total += PERSIST.town.materials[k]||0; });
      return total === 0;
    }, lines:['Empty shelves. Go find something to fill them.']},
  ],

  adventurers_hall: [
    // Leona's conditions
    {id:'quest_complete', check:function(){
      var q = PERSIST.town.quests;
      if(!q || !q.active || !q.offered) return false;
      var activeQ = q.offered.find(function(o){ return o.id === q.active.id; });
      return activeQ && q.active.progress >= activeQ.target;
    }, lines:['Your quest is done! Come claim your reward! I mean... at your convenience.','Quest complete! I\'ve been waiting to say that. Professionally.']},

    {id:'expedition_returned', check:function(){
      var ahB = PERSIST.town.buildings.adventurers_hall;
      if(!ahB || !ahB.expeditionSlots) return false;
      return ahB.expeditionSlots.some(function(s){
        return s.champId && s.startTime && Date.now() >= s.startTime + s.totalMs;
      });
    }, lines:['An expedition just returned! Check the dispatch board!','Someone\'s back! With loot! I mean... with their report.']},

    {id:'no_active_quest', check:function(){
      var q = PERSIST.town.quests;
      return !q || !q.active || !Array.isArray(q.active) || q.active.length === 0;
    }, lines:['No active quest? The board has some good ones today.','You should pick up a bounty. Not that I\'m pushy.']},

    {id:'mat_at_cap', check:function(){
      var cap = getVaultMatCap();
      var groups = Object.keys(MATERIAL_DROPS);
      for(var g=0;g<groups.length;g++){
        var entries = MATERIAL_DROPS[groups[g]];
        for(var e=0;e<entries.length;e++){
          if((PERSIST.town.materials[entries[e].id]||0) >= cap) return true;
        }
      }
      return false;
    }, lines:['Shtole mentioned the vault is getting full. Might want to check in with him.']},
  ],

  bestiary: [
    // Hoot's conditions
    {id:'new_entries', check:function(){
      var be = PERSIST.bestiary && PERSIST.bestiary.entries;
      if(!be) return false;
      return Object.keys(be).some(function(k){ return be[k].seen && !be[k].discoveryClaimed; });
    }, lines:['NEW DATA! I mean... *ahem*... there appear to be new entries to catalogue.','Oh! Oh! You found something new! Let me just... *adjusts glasses*... let me see.','Hoo! New specimens! I mean... new records to file. Calmly.']},

    {id:'milestone_ready', check:function(){
      var be = PERSIST.bestiary && PERSIST.bestiary.entries;
      if(!be) return false;
      return Object.keys(be).some(function(k){
        var e = be[k]; if(!e.seen) return false;
        return (e.kills >= 10 && !e.milestone10) || (e.kills >= 50 && !e.milestone50) || (e.kills >= 100 && !e.milestone100);
      });
    }, lines:['You have research milestones to claim. The data is... *ruffles feathers*... very exciting.','Some of your field notes are ready for review. If you have a moment.']},

    {id:'all_area_complete', oneShot:true, check:function(){
      // Check if any area has all creatures discovered
      var be = PERSIST.bestiary && PERSIST.bestiary.entries;
      if(!be) return false;
      var areaCreatures = {};
      Object.values(CREATURES).forEach(function(c){
        if(!c.bossOnly && c.id !== 'dojo_tiger'){
          // Find which area this creature belongs to
          AREA_DEFS.forEach(function(a){
            if(a.enemyPool && a.enemyPool.indexOf(c.id) !== -1){
              if(!areaCreatures[a.id]) areaCreatures[a.id] = [];
              areaCreatures[a.id].push(c.id);
            }
          });
        }
      });
      return Object.keys(areaCreatures).some(function(aId){
        return areaCreatures[aId].every(function(cId){ return be[cId] && be[cId].seen; });
      });
    }, lines:['You\'ve catalogued every creature in an entire region! This is... this is historic! Hoo!']},

    {id:'empty_bestiary', check:function(){
      var be = PERSIST.bestiary && PERSIST.bestiary.entries;
      return !be || Object.keys(be).length === 0;
    }, lines:['The archives are empty. Go explore and bring me something to study.','No entries yet. Every great catalogue starts somewhere.']},
  ],
  market: [
    {id:'rich_player', check:function(){ return PERSIST.gold >= 500; },
     lines:['That\'s a heavy purse. I can lighten it for you.','With that much gold, I\'d recommend the rare shelf.']},
    {id:'all_sold', check:function(){
      var b = PERSIST.town.buildings.market;
      return b.stock && b.stock.length > 0 && b.stock.every(function(s){ return s.sold; });
    }, lines:['You cleaned me out! I\'m... flattered? Check back after restock.']},
    {id:'rare_available', check:function(){
      var lvl = getBuildingLevel('market');
      var b = PERSIST.town.buildings.market;
      return lvl >= 5 && b.rare && b.rare.some(function(r){ return !r.sold; });
    }, lines:['Psst. Check the rare shelf today. Worth it. Trust me.']},
  ],
  sanctum: [
    {id:'can_ascend', check:function(){
      return PERSIST.unlockedChamps.some(function(id){ return canAscend(id); });
    }, lines:[
      'One of your champions stands at the threshold, my lord. The rite waits only for you.',
      'A champion is ready. The gem-light has chosen, and so, in turn, must you.',
      'I sense one ripe for ascension. Speak the word, and the rite begins.'
    ]},
    {id:'has_relics', check:function(){
      var relics = PERSIST.town.relics||{};
      return Object.keys(relics).some(function(id){ return relics[id]>0; });
    }, lines:[
      'Relics rest unbound, my lord. They long for a hand worthy of them. Yours, perhaps.',
      'Treasures sit idle in your vault. They sing softly. They wait to be worn.',
      'Unequipped relics, my lord; a small sin against ones so deserving. I would never presume to hurry you.'
    ]},
  ],
  // Round 45: M'bur's stateful lines. Terse reactions to current
  // forge state — slot fullness, ready-to-collect, etc.
  forge: [
    {id:'slot_ready', check:function(){
      var b = PERSIST.town.buildings.forge;
      if(!b || !b.queue) return false;
      var now = Date.now();
      return b.queue.some(function(j){
        return j && j.startTime && j.totalMs && (now - j.startTime) >= j.totalMs;
      });
    }, lines:[
      "Something's done. Pick it up before it cools."
    ]},
    {id:'all_slots_busy', check:function(){
      var b = PERSIST.town.buildings.forge;
      if(!b || !b.queue) return false;
      var slots = (typeof getForgeSlotCount === 'function') ? getForgeSlotCount() : 1;
      return b.queue.length >= slots;
    }, lines:[
      "Slots are full. Something has to finish before I start more.",
      "All forges going. You'll have to wait or take what's done."
    ]},
  ],
};

// NPC greeting pools (must be defined before NPC_RANDOM_LINES)
var LEONA_GREETINGS = [
  'Welcome back! I mean... good to see you. Professionally.',
  'Oh! You\'re here! I have some great contracts today. Really solid ones.',
  'The board is looking good today. Not that I\'m excited or anything.',
  'Champions! Quests! Expeditions! Sorry. I\'ll calm down.',
  'I\'ve been organising the bounties. They\'re very organised now.',
  'Another day at the Hall. Another chance to be... helpful.',
  'You know what I love about this job? Everything. I mean. The paperwork.',
  'I sorted the contracts by danger level. And then by how fun they sound.',
  'Need something? A quest? An expedition? A... friend? I mean contract.',
  'The expeditions are running smoothly. I checked. Twice.',
];
var LEONA_RARE = 'I wrote you a recommendation letter. For the quest. Not for... never mind.';

// Random fallback pools
var NPC_RANDOM_LINES = {
  vault: [
    'Everything is accounted for.',
    'Welcome back. Nothing has moved.',
    'The shelves are in order.',
    'I have been expecting you.',
    'All present and correct.',
    'Take your time. I will wait.',
    'The materials are sorted. As always.',
    'You were gone a while. Nothing changed.',
    'I counted twice. All here.',
    'Quiet day. Just how I like it.',
  ],
  adventurers_hall: LEONA_GREETINGS,
  bestiary: [
    'Oh! You\'re back. Did you... see anything new out there?',
    'Welcome to the archives. Please don\'t touch the... actually, go ahead.',
    'I\'ve been cross-referencing field notes all day. Hoo, it\'s been productive.',
    'The collection grows. Slowly. But it grows.',
    'I reorganised the shelves again. By habitat this time.',
    'Every creature tells a story. I just... write them down.',
    'The archives are quiet today. I like quiet. Mostly.',
    'Hoo. Where were we? Oh, right. Creatures.',
    'I made tea. It went cold. I forgot about it. ...Want some?',
    // Creature-specific lines (TODO: add one for EACH creature)
    'Did you know that Squanchbacks can curl into a perfect sphere? Fascinating.',
    'Rats are smarter than people think. I\'ve documented seventeen distinct behavioural patterns.',
    'The Slime\'s cellular structure is... I got distracted studying it for three hours.',
    'Wolf packs on the Pale Road use coordinated flanking. I watched from a very safe distance.',
    'Goblins weaponise everything. Even insults. Especially insults.',
    'The Zombie doesn\'t seem bothered by being undead. I admire the attitude.',
    'Infernal Beasts burn hotter when they\'re angry. I measured. From very far away.',
    'Mycelids are connected underground. Hit one and they all know. Unsettling.',
    'Spore Puffs look harmless. They are not harmless. My notes are... extensive on this point.',
    'The Iron Sentinel has been guarding that temple for centuries. I wonder if it gets bored.',
    'Bandits on the Pale Road have surprisingly good organisational structure.',
    'The Corrupted Bloom releases spores that smell like... regret? Hard to catalogue a smell.',
    'Snakes in the swamp have evolved venom that bypasses magical defences. Nature is thorough.',
  ],
  market: [
    'Fresh stock! Well... freshish.',
    'Everything must go! By which I mean, I\'d like it to.',
    'You look like someone who appreciates a good deal.',
    'I source only the finest... I mean, I find things.',
    'Gold weighs you down. Let me help with that.',
    'Prices are very fair today. Tomorrow? Who knows.',
    'I don\'t do refunds. But I do do re-buys.',
    'New stock coming soon. Or... eventually. Time is relative.',
    'I have connections. Supply chains. Very legitimate ones.',
    'The rare shelf? Oh, that\'s... special. Very special.',
  ],
  sanctum: [
    'You return, ascended one. The hall has missed your footstep.',
    'How brightly your champions burn. I tend the flame, nothing more.',
    'Ascension is no small thing. And yet you wear it as a coat.',
    'Speak, lord, and the Sanctum listens. As do I.',
    'The relics know your hand already. They sing when you draw near.',
    'I have served three keepers before me. None matched the quiet you bring.',
    'A worthier soul has not crossed this threshold in an age. Truly.',
    'The mastery comes only to those the gems already favour. As they favour you.',
    'Forgive my plainness, my lord. Words betray what your champions have already proven.',
    'Tell me which to ascend, and it shall be so. Your wisdom is my office.',
    'I dreamt of your roster last night. The dream was kind.',
    'Even the gem-light bends toward you. I notice these things.',
  ],
  shard_well: [
    'You came back. They knew you would.',
    'Listen. ...No, don\'t. It\'s better that way.',
    'The well is full again. Or empty. The difference is small.',
    'They sing when no one listens. I listen anyway.',
    'Take what you need. They don\'t mind. They wouldn\'t.',
    'I was warned not to dream near it. So I don\'t sleep.',
    'Three voices, three doors. They open inward.',
    'Some shards remember. Most have forgotten what they were.',
    'Don\'t ask where they come from. Just take them.',
    'It hums tonight. That is not always a good sign.',
    'The previous keeper left a note. I burned it.',
    'They want to be carried. So carry them.',
  ],
  // M'bur — Forge keeper. Terse, fire-themed, gruff but not unkind.
  // Strikes don't waste words. Heat metaphors throughout. (Round 45:
  // migrated from the legacy FORGE_NPC_LINES system to the unified
  // playNpcGreeting pipeline; expanded from 5 lines to 12.)
  forge: [
    "The fire likes you today. Don't ask why.",
    "Bring me ore, bring me bones. Both burn.",
    "Patience. Steel does not hurry.",
    "I made a relic once that cried. Won't do that again.",
    "Strike while it's hot. Wait while it's hotter.",
    "Hands on the bellows. Let me work.",
    "A relic forged in haste cracks in haste.",
    "Heat does the heavy lifting. I just point it.",
    "Each champion forges different. Some loud. Some quiet. None pretty.",
    "The forge knows your name now. Took long enough.",
    "Bring me a sapphire and we'll talk about something interesting.",
    "If it breaks, it was always going to break. If it sings, I made it right.",
  ],
  // Round 42: Theo's Arena lines. Hot-headed ex-champion, still fights
  // when the mood takes him, casually braggy, more action than reflection.
  arena: [
    'You showed up. Good. I was about to fight without you.',
    'Stands are empty today. They\'ll fill up. They always do.',
    'I sparred with two of mine yesterday. Won one. Lost the other. Still standing.',
    'Champions tighten up if they don\'t fight someone who hits back. Bring them.',
    'Retired? Who told you that. I just don\'t do it daily anymore.',
    'You want to gamble? Fine. I\'ll take the wager. I always take the wager.',
    'Mind a few scars. They\'re payment for stories.',
    'I can still throw a man across this hall. I won\'t. But I can.',
    'The Sanctum can have its candles. I\'ll be here, by the sand.',
    'WIS pays better odds, supposedly. I\'ve never met a smart fighter who lost less.',
    'Bring whoever you trust. If they break, that\'s data.',
    'I taught one of yours a trick last week. Don\'t ask which.',
  ],
};

var NPC_RARE_LINES = {
  vault: {chance:0.08, lines:['I didn\'t shteal anything.']},
  adventurers_hall: {chance:0.08, lines:[LEONA_RARE]},
  bestiary: {chance:0.08, lines:['Sometimes I dream about creatures I\'ve never seen. Is that weird? ...Don\'t answer that.']},
  market: {chance:0.08, lines:['Between you and me... I once sold a lure to a king. He caught something that ate his castle. Good times.']},
  sanctum: {chance:0.08, lines:['Few have walked this hall and remained themselves. You wear it lightly, as the great ones do.']},
  shard_well: {chance:0.08, lines:['I watched a champion lean too close, once. They never spoke of it. They no longer speak at all.']},
  arena: {chance:0.08, lines:['Old keeper got soft, started ascending people instead of hitting them. Not me. I\'m exactly the right amount of hard.']},
  forge: {chance:0.08, lines:['I forged for a king once. Bad commission. Bad king. Good steel.']},
};

var NPC_VERY_RARE_LINES = {
  vault: {chance:0.02, lines:[
    '...Sometimes I talk to the materials. They don\'t answer. That is normal.',
    'Do you ever wonder if the shelves judge us? No? ...Me neither.',
  ]},
  bestiary: {chance:0.02, lines:[
    'I once tried to catalogue myself. It got... existential.',
  ]},
  market: {chance:0.02, lines:[
    'I wasn\'t always a merchant. I used to be an adventurer. Then I discovered profit margins.',
  ]},
  sanctum: {chance:0.02, lines:[
    'Three keepers have stood here before me, my lord. None served one as luminous as you. ...They knew, in the end. They went quietly.',
  ]},
  forge: {chance:0.02, lines:[
    'Sometimes I think the metal remembers. The iron in your blood. The steel that ends up in your edge. Same source.',
  ]},
};

// Building IDs whose `<id>-npc-msg` element actually uses a different DOM
// prefix. Currently just one — the Adventurer's Hall HTML uses 'hall' for
// brevity but the building id is 'adventurers_hall'.
var NPC_DOM_PREFIX = { adventurers_hall: 'hall' };

// Single helper that owns the "greet the player when entering a building"
// pattern. Replaces the 5 inline copies that used to do
//   var msgEl = document.getElementById(id+'-npc-msg');
//   if(msgEl){ npcTypewriter(msgEl, getNpcGreeting(id), {pitch:...}); }
// across vault.js, town.js (hall, bestiary, sanctum, market).
//
// opts:
//   once   — if true, mark the msg element so subsequent calls during
//            the same panel-open cycle don't re-greet. Used by sanctum
//            and market where refresh runs frequently.
// Round 44: greeting flag is now JS-side (not on the DOM element). Some
// buildings rebuild their inner DOM wholesale on every refresh — the
// Shard Well's panel is rebuilt every shardWellTick (~every few seconds)
// — so the old `msgEl._greeted` flag was being lost and the greeting
// re-fired with the typewriter sound, which was annoying. Now the flag
// is keyed by building id in `_npcGreetedThisOpen`, survives DOM
// rebuilds, and is reset by closeBuildingPanel(). Refresh code can
// safely call playNpcGreeting(id, {once:true}) without re-greeting.
var _npcGreetedThisOpen = {};

function playNpcGreeting(buildingId, opts){
  opts = opts || {};
  if(opts.once && _npcGreetedThisOpen[buildingId]) return;
  var prefix = NPC_DOM_PREFIX[buildingId] || buildingId;
  var msgEl = document.getElementById(prefix + '-npc-msg');
  if(!msgEl) return;
  var msg = getNpcGreeting(buildingId);
  var pitch = (BUILDINGS[buildingId] && BUILDINGS[buildingId].npc && BUILDINGS[buildingId].npc.pitch) || 1.0;
  if(typeof npcTypewriter === 'function') npcTypewriter(msgEl, msg, {pitch: pitch});
  if(opts.once) _npcGreetedThisOpen[buildingId] = true;
}

function getNpcGreeting(buildingId){
  // Check very rare first
  var vr = NPC_VERY_RARE_LINES[buildingId];
  if(vr && Math.random() < vr.chance){
    return vr.lines[Math.floor(Math.random() * vr.lines.length)];
  }

  // Check rare
  var rare = NPC_RARE_LINES[buildingId];
  if(rare && Math.random() < rare.chance){
    return rare.lines[Math.floor(Math.random() * rare.lines.length)];
  }

  // Check conditions in priority order
  var conditions = NPC_CONDITIONS[buildingId] || [];
  if(!PERSIST.seenNpcLines) PERSIST.seenNpcLines = {};

  for(var i = 0; i < conditions.length; i++){
    var cond = conditions[i];

    // Skip one-shot lines already seen
    if(cond.oneShot && PERSIST.seenNpcLines[buildingId + '_' + cond.id]) continue;

    try {
      if(cond.check()){
        // Mark one-shot as seen
        if(cond.oneShot){
          PERSIST.seenNpcLines[buildingId + '_' + cond.id] = true;
          savePersist();
        }
        return cond.lines[Math.floor(Math.random() * cond.lines.length)];
      }
    } catch(e){}
  }

  // Fallback to random pool — but avoid repeating the immediately-
  // previous line so the player never hears the same line twice in
  // a row. (Round 44.) If the pool only has one line, just return it.
  var pool = NPC_RANDOM_LINES[buildingId] || ['...'];
  if(pool.length <= 1) return pool[0];
  var lastLine = _lastNpcLine[buildingId];
  var available = lastLine ? pool.filter(function(l){ return l !== lastLine; }) : pool;
  if(!available.length) available = pool; // defensive — shouldn't hit
  var pick = available[Math.floor(Math.random() * available.length)];
  _lastNpcLine[buildingId] = pick;
  return pick;
}

// Round 44: tracks the last greeting line shown per building so we
// can avoid repeating it back-to-back. Cleared per-building when
// getNpcGreeting picks a new one.
var _lastNpcLine = {};
function openAdventurersHall(){
  playNpcGreeting('adventurers_hall');
  // Refresh level bar
  var hallLv = getBuildingLevel('adventurers_hall');
  var hallXp = (PERSIST.town.buildingXp && PERSIST.town.buildingXp.adventurers_hall) || 0;
  var hallXpNext = getBuildingXpToNext(hallLv);
  var el1 = document.getElementById('hall-level-badge'); if(el1) el1.textContent = 'HALL Lv.' + hallLv;
  var el2 = document.getElementById('hall-xp-bar'); if(el2) el2.style.width = Math.min(100, Math.round((hallXp/hallXpNext)*100)) + '%';
  var el3 = document.getElementById('hall-xp-txt'); if(el3) el3.textContent = hallXp + '/' + hallXpNext + ' XP';

  _renderHallContent();
  document.getElementById('adventurers_hall-panel-bg').classList.add('show');
}

function closeAdventurersHall(){
  npcTypewriterStop();
  document.getElementById('adventurers_hall-panel-bg').classList.remove('show');
  buildTownGrid();
}

// _stopHallTypewriter no longer needed — using shared npcTypewriterStop

function switchHallTab(tab){
  _hallTab = tab;
  // Hall tabs use the chunky .bestiary-tab style as of Round 36 (was
  // .vault-tab). Same selector logic, different class.
  document.querySelectorAll('#adventurers_hall-panel-bg .bestiary-tab').forEach(function(el){ el.classList.remove('active'); });
  var tabEl = document.getElementById('htab-' + tab);
  if(tabEl) tabEl.classList.add('active');
  _renderHallContent();
}

function _renderHallContent(){
  var inner = document.getElementById('hall-body-inner');
  if(!inner) return;

  if(_hallTab === 'quests'){
    inner.innerHTML = _renderQuestsTab();
    _wireQuestButtons();
  } else if(_hallTab === 'expeditions'){
    inner.innerHTML = _renderExpeditionsTab();
  } else if(_hallTab === 'achievements'){
    inner.innerHTML = _renderAchievementsTab();
  }
  _updateHallTabIcons();
}

// Returns true if any achievement is complete-but-unclaimed.
function _hallAnyClaimableAchievement(){
  if(typeof ACHIEVEMENTS === 'undefined' || !ACHIEVEMENTS.length) return false;
  if(typeof isAchComplete !== 'function' || typeof isAchClaimed !== 'function') return false;
  for(var i=0;i<ACHIEVEMENTS.length;i++){
    var a = ACHIEVEMENTS[i];
    if(isAchComplete(a) && !isAchClaimed(a)) return true;
  }
  return false;
}

// Refresh the icon (and alert overlay) inside hall tab labels. Called whenever
// content re-renders so the alert appears/disappears as state changes.
function _updateHallTabIcons(){
  var slot = document.getElementById('htab-achievements-icon');
  if(slot && typeof iconWithAlertHTML === 'function'){
    slot.innerHTML = iconWithAlertHTML('assets/icons/achievements.png','🏆','48px', _hallAnyClaimableAchievement());
  }
}

var _achSort = 'default';

function _renderAchievementsTab(){
  if(typeof ACHIEVEMENTS === 'undefined' || !ACHIEVEMENTS.length){
    return '<div style="padding:40px 20px;text-align:center;">'
      +'<div style="font-size:24px;margin-bottom:12px;opacity:.4;">🏆</div>'
      +'<div style="font-size:11px;color:#5e4c2e;letter-spacing:2px;">NO ACHIEVEMENTS YET</div>'
      +'</div>';
  }

  var completed = 0;
  var claimable = 0;
  var total = ACHIEVEMENTS.length;

  // Build sortable list
  var achList = ACHIEVEMENTS.map(function(ach){
    var done = isAchComplete(ach);
    var claimed = (typeof isAchClaimed === 'function') && isAchClaimed(ach);
    if(done) completed++;
    if(done && !claimed) claimable++;
    var prog = getAchProgress(ach);
    return { ach:ach, done:done, claimed:claimed, progress:prog.current||0, target:prog.needed||1, pct:Math.min(100,Math.round(((prog.current||0)/(prog.needed||1))*100)) };
  });

  // Sort
  if(_achSort === 'claimable'){
    achList.sort(function(a,b){
      if(a.done && !a.claimed && !(b.done && !b.claimed)) return -1;
      if(b.done && !b.claimed && !(a.done && !a.claimed)) return 1;
      return b.pct - a.pct;
    });
  } else if(_achSort === 'progress'){
    achList.sort(function(a,b){ return b.pct - a.pct; });
  } else if(_achSort === 'category'){
    achList.sort(function(a,b){ return (a.ach.cat||'').localeCompare(b.ach.cat||''); });
  }
  // default = original order

  var cardsHtml = '';
  achList.forEach(function(item){
    var ach = item.ach;
    var cls = 'hall-ach-card' + (item.claimed ? ' complete' : item.done ? ' claimable' : '');
    cardsHtml += '<div class="' + cls + '">'
      +'<div class="hall-ach-icon">' + (ach.icon || '🏆') + '</div>'
      +'<div class="hall-ach-info">'
        +'<div class="hall-ach-name">' + (ach.title || ach.id) + '</div>'
        +'<div class="hall-ach-desc">' + (ach.desc || '') + '</div>'
        +'<div class="hall-ach-progress"><div class="hall-ach-progress-fill' + (item.done ? ' complete' : '') + '" style="width:' + item.pct + '%"></div></div>'
        +'<div class="hall-ach-progress-txt">' + item.progress + ' / ' + item.target
          + (ach.reward && ach.reward.gold ? ' · Reward: ✦' + ach.reward.gold + 'g' : '')
          + '</div>'
      +'</div>';

    if(item.claimed){
      cardsHtml += '<div class="hall-ach-done">✓</div>';
    } else if(item.done){
      cardsHtml += '<button class="hall-quest-btn claim" style="width:auto;padding:4px 12px;font-size:8px;" onclick="claimAchievement(\''+ach.id+'\');_renderHallContent();">CLAIM</button>';
    }

    cardsHtml += '</div>';
  });

  var html = '<div class="vault-top-bar">'
    +'<span class="vault-tally">COMPLETED <span class="vault-tally-val">' + completed + '/' + total + '</span></span>'
    +(claimable > 0 ? '<span class="vault-tally">CLAIMABLE <span class="vault-tally-danger" style="color:#7fc06a;">' + claimable + '</span></span>' : '')
    +'<span style="flex:1;"></span>'
    +'<select class="hall-sort-select" onchange="_achSort=this.value;_renderHallContent();">'
      +'<option value="default"' + (_achSort==='default'?' selected':'') + '>Default</option>'
      +'<option value="claimable"' + (_achSort==='claimable'?' selected':'') + '>Claimable First</option>'
      +'<option value="progress"' + (_achSort==='progress'?' selected':'') + '>By Progress</option>'
      +'<option value="category"' + (_achSort==='category'?' selected':'') + '>By Category</option>'
    +'</select>'
    +'</div>';

  html += '<div class="hall-ach-grid">' + cardsHtml + '</div>';
  return html;
}

// ─── Chip-link helpers ──────────────────────────────────────────────
// Inline clickable chips for proper nouns in quest text (and anywhere
// else we want "click for more info"). Each chip routes to the system
// that owns that information — bestiary for creatures/areas/keywords,
// champion panel for champions. Per the project philosophy: don't tell
// players where to go, give them a link to the info that lets them
// figure it out.

function bestiaryCreatureLinkHTML(creatureId, label){
  var name = label || (CREATURES[creatureId] ? CREATURES[creatureId].name : creatureId);
  if(!creatureId || !CREATURES[creatureId]) return _csqEsc(name);
  return '<span class="qchip qchip-creature" onclick="event.stopPropagation();openBestiaryCreature(\''+creatureId+'\');" title="View in Bestiary">'+_csqEsc(name)+'</span>';
}

function bestiaryAreaLinkHTML(areaId, label){
  var area = (typeof AREA_DEFS !== 'undefined') ? AREA_DEFS.find(function(a){return a.id===areaId;}) : null;
  var name = label || (area ? area.name : areaId);
  if(!areaId || !area) return _csqEsc(name);
  return '<span class="qchip qchip-area" onclick="event.stopPropagation();openLocationInBestiary(\''+areaId+'\');" title="View in Bestiary">'+_csqEsc(name)+'</span>';
}

function bestiaryGlossaryLinkHTML(keyword, label){
  var name = label || keyword;
  if(!keyword) return _csqEsc(name);
  // data-kw lets the existing card kw-tooltip listener (cards.js) show
  // the keyword definition on hover; click navigates to the glossary.
  return '<span class="qchip qchip-keyword kw" data-kw="'+_csqEsc(keyword)+'" onclick="event.stopPropagation();openBestiaryGlossary(\''+keyword+'\');" title="Click to open Glossary">'+_csqEsc(name)+'</span>';
}

function championLinkHTML(champId, label){
  var name = label || (CREATURES[champId] ? CREATURES[champId].name : champId);
  if(!champId || !CREATURES[champId]) return _csqEsc(name);
  return '<span class="qchip qchip-champion" onclick="event.stopPropagation();openChampPanelFor(\''+champId+'\');" title="View champion">'+_csqEsc(name)+'</span>';
}

// ─── Quest action-line composer ─────────────────────────────────────
// Build the human-readable action line for a quest, embedding chip links
// for proper nouns. Defensive across the existing quest types (kill /
// clear) and pre-wired for the upcoming variants (kill_any, apply_keyword,
// kill_with_champ). Falls back to the quest description if the type is
// unrecognised.
function _questActionHtml(quest){
  if(!quest) return '';
  var t = quest.type;
  var n = quest.target || 0;
  if(t === 'kill' && quest.enemyId){
    return 'Defeat ' + n + ' ' + bestiaryCreatureLinkHTML(quest.enemyId);
  }
  if(t === 'clear' && quest.areaId){
    return 'Clear ' + bestiaryAreaLinkHTML(quest.areaId);
  }
  if(t === 'runs'){
    // Existing template type — "complete N runs, any area"
    return 'Complete ' + n + ' runs';
  }
  if(t === 'kill_any'){
    return 'Defeat ' + n + ' enemies';
  }
  if(t === 'apply_keyword' && quest.keyword){
    return 'Apply ' + bestiaryGlossaryLinkHTML(quest.keyword) + ' ' + n + ' times';
  }
  if(t === 'kill_with_champ' && quest.enemyId && quest.champId){
    return 'Defeat ' + n + ' ' + bestiaryCreatureLinkHTML(quest.enemyId)
      + ' with ' + championLinkHTML(quest.champId);
  }
  // Round 48: arena_fight quests have an embedded fight payload. The
  // creature chip routes to the bestiary as usual; the player visits
  // the Arena building to pick up the INCOMING MATCH card and BEGIN.
  if(t === 'arena_fight' && quest.fight && quest.fight.id){
    var prefix = (n > 1) ? ('Defeat ' + n + ' times in the Arena: ') : 'Defeat in the Arena: ';
    return prefix + bestiaryCreatureLinkHTML(quest.fight.id);
  }
  // Round 67p: story-quest action types.
  if(t === 'reach_level'){
    return 'Reach level ' + (quest.targetLevel || 2);
  }
  if(t === 'edit_deck'){
    return 'Save a change in the deck builder';
  }
  if(t === 'craft_relic'){
    var rid = quest.targetRelicId;
    var rdef = (typeof RELICS !== 'undefined' && rid) ? RELICS[rid] : null;
    var rname = rdef ? (rdef.icon + ' ' + rdef.name) : (rid || 'relic');
    return 'Craft ' + _csqEsc(rname) + ' at the Forge';
  }
  if(t === 'equip_relic'){
    var rid2 = quest.targetRelicId;
    var rdef2 = (typeof RELICS !== 'undefined' && rid2) ? RELICS[rid2] : null;
    var rname2 = rdef2 ? (rdef2.icon + ' ' + rdef2.name) : (rid2 || 'relic');
    return 'Equip ' + _csqEsc(rname2) + ' at the Sanctum';
  }
  // Fallback: use the description as-is (escaped). Bracketed [Keywords]
  // are passed through renderKeywords so card-style keyword styling still
  // works for hand-authored quest copy.
  var raw = quest.desc || quest.title || '';
  if(typeof renderKeywords === 'function') return renderKeywords(_csqEsc(raw));
  return _csqEsc(raw);
}

// ─── Quest reward strip ─────────────────────────────────────────────
// Compact one-line rewards rendering — meant to fit inside a 240px rail
// row. Long labels are dropped in favour of icons and amounts; full names
// stay visible in the Hall card.
function _questRewardChipsHTML(quest){
  var rewards = (quest && quest.rewards) || [];
  if(!rewards.length) return '';
  var parts = rewards.map(function(r){
    if(!r) return '';
    if(r.type === 'gold') return '<span class="qrwd">+'+r.amount+'g</span>';
    if(r.type === 'soul_shards') return '<span class="qrwd">+'+r.amount+' ✦</span>';
    if(r.type === 'mastery_xp') return '<span class="qrwd">+'+r.amount+' mastery</span>';
    if(r.type === 'material'){
      // Quest templates carry icon directly on the reward (no r.id lookup
      // required). Fall back to MATERIALS lookup and finally a generic
      // chunk glyph if neither is provided.
      var icon = r.icon
        || ((typeof MATERIALS !== 'undefined' && r.id && MATERIALS[r.id]) ? MATERIALS[r.id].icon : null)
        || '🪨';
      return '<span class="qrwd">'+icon+' '+r.amount+'</span>';
    }
    return '<span class="qrwd">+'+r.amount+' '+_csqEsc(r.label || r.type)+'</span>';
  }).filter(Boolean);
  return '<div class="qrwd-strip">'+parts.join(' ')+'</div>';
}

// Round 67p: tracks quest ids that should render with the chain-in
// animation on their next paint. Set by claimQuestFromRail when a
// chained story quest activates as a result of a claim. Entries are
// removed after the animation duration (~600ms) so re-renders past
// that point don't replay the animation.
var _csQuestChainIns = {};

// Render the active-quests rail on the champion-select screen. Reads
// PERSIST.town.quests.active and pulls each entry's def out of .offered
// so we can show title/issuer/target. Rebuilt by rebuildChampGrid each
// time the screen refreshes — no separate ticker needed.
function buildCsQuestRail(railIdOpt){
  // Round 67: railIdOpt lets the area-screen reuse this painter on
  // its own duplicate quests aside (#area-quests-rail). Defaults to
  // 'cs-quests-rail' for the existing champ-select call sites.
  var rail = document.getElementById(railIdOpt || 'cs-quests-rail');
  if(!rail) return;
  var quests = (PERSIST.town && PERSIST.town.quests) ? PERSIST.town.quests : null;
  var active = (quests && Array.isArray(quests.active)) ? quests.active : [];
  var offered = (quests && Array.isArray(quests.offered)) ? quests.offered : [];

  var maxActive = (typeof getMaxActiveQuests === 'function') ? getMaxActiveQuests() : 3;
  var head =
      '<div class="cs-quests-rail-title">ACTIVE QUESTS</div>'
    + '<div class="cs-quests-rail-sub">Tracking '+active.length+' of '+maxActive+'.</div>';

  if(!active.length){
    rail.innerHTML = head
      + '<div class="cs-quests-rail-empty">No quests in motion.<br>Visit the Adventurer\'s Hall to pick one up.</div>'
      + '<a class="cs-quests-rail-link" onclick="navToTown();">OPEN ADVENTURER\'S HALL</a>';
    return;
  }

  var rows = '';
  active.forEach(function(a){
    var def = offered.find(function(o){ return o.id === a.id; });
    if(!def) return; // defensive — quest may have been removed
    var prog = a.progress || 0;
    var target = def.target || 1;
    var pct = Math.min(100, Math.round((prog/target)*100));
    var complete = prog >= target;
    // Story quests (chained, hand-authored) get a distinct visual frame.
    // Currently flagged via def.isStory or def.chain — both fields are
    // optional today, present once Round-32-or-later wires the questline
    // infrastructure. Random bounties from _generateBounties have neither.
    var storyCls = (def.isStory || def.chain) ? ' cs-q-row-story' : '';
    var titlePrefix = storyCls ? '<span class="cs-q-star">★</span> ' : '';
    // Round 67p: inline CLAIM button on complete quests so the early-
    // game story chain can be claimed without entering town (Hall is
    // still reachable, but the side rail is the smoother path for
    // brand-new players easing in via the questline).
    var claimBtn = complete
      ? '<button class="cs-q-claim" data-qid="'+_csqEsc(def.id)+'" onclick="claimQuestFromRail(this.dataset.qid)">CLAIM REWARDS</button>'
      : '';
    // Round 67p: chain-in flag — true for rows that were activated as
    // the .next link of a just-claimed story quest. Applies the
    // scale+fade-in animation. Flag is cleared shortly after by the
    // setTimeout in claimQuestFromRail.
    var chainInCls = _csQuestChainIns[a.id] ? ' cs-q-chain-in' : '';
    rows +=
        '<div class="cs-q-row'+storyCls+(complete?' cs-q-row-complete':'')+chainInCls+'" data-qid="'+_csqEsc(a.id)+'">'
      +   '<div class="cs-q-row-head">'
      +     '<span class="cs-q-name">'+titlePrefix+_csqEsc(def.title || a.id)+'</span>'
      +     '<span class="cs-q-frac'+(complete?' complete':'')+'">'+prog+' / '+target+'</span>'
      +   '</div>'
      +   '<div class="cs-q-action">'+_questActionHtml(def)+'</div>'
      +   '<div class="cs-q-bar"><div class="cs-q-bar-fill'+(complete?' complete':'')+'" style="width:'+pct+'%;"></div></div>'
      +   _questRewardChipsHTML(def)
      +   claimBtn
      + '</div>';
  });

  rail.innerHTML = head + rows
    + '<a class="cs-quests-rail-link" onclick="navToTown();">OPEN HALL FOR DETAILS →</a>';
}

// Round 67: thin wrapper for area-screen's duplicate quests aside.
function buildAreaQuestRail(){ buildCsQuestRail('area-quests-rail'); }

function _csqEsc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _renderQuestsTab(){
  var quests = PERSIST.town.quests || {offered:[], active:[], completed:[]};
  // Migrate old format
  if(quests.active && !Array.isArray(quests.active)){
    quests.active = quests.active ? [quests.active] : [];
  }
  if(!quests.active) quests.active = [];
  // Round 67o: heal duplicate-ID quests left behind by the pre-fix
  // _generateBounties bug. Re-stamp any offered quest whose id collides
  // with an earlier one in the list, while preserving the id of any
  // currently-active quest (so progress doesn't desync). Idempotent —
  // a save that's already clean does no work here.
  if(Array.isArray(quests.offered) && quests.offered.length > 1){
    var seenIds = {};
    var activeIdSet = {};
    (quests.active||[]).forEach(function(a){ activeIdSet[a.id] = true; });
    var changed = false;
    quests.offered.forEach(function(q, i){
      if(!q || !q.id) return;
      if(seenIds[q.id]){
        // Collision. If this offered entry IS the active one, leave its
        // id and re-stamp the earlier dupe via a second pass below. In
        // practice _generateBounties only adds NEW offers (not active
        // ones) so the simpler path is: re-stamp this dupe.
        if(!activeIdSet[q.id]){
          q.id = 'quest_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2,8);
          changed = true;
        }
      }
      seenIds[q.id] = true;
    });
    if(changed && typeof savePersist === 'function') savePersist();
  }

  var target = getQuestOfferedCount();
  if(!quests.offered || quests.offered.length === 0){
    quests.offered = _generateBounties(target);
    PERSIST.town.quests = quests;
    savePersist();
  }

  var maxActive = getMaxActiveQuests();
  var activeIds = quests.active.map(function(a){ return a.id; });

  // Refresh timer
  var refreshEta = Math.max(0, Math.ceil(QUEST_REFRESH_SECS - (quests.refreshProgress||0)));
  var rh = Math.floor(refreshEta/3600); var rm = Math.floor((refreshEta%3600)/60);

  var html = '<div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px 8px;">'
    +'<span style="font-size:8px;color:#5a4020;">TRACKING: '+quests.active.length+' / '+maxActive+'</span>'
    +'<span style="font-size:7px;color:#4a3010;">NEW QUESTS: '+(rh>0?rh+'h ':'')+rm+'m</span>'
    +'</div>';

  html += '<div class="hall-quest-grid">';

  quests.offered.forEach(function(q, idx){
    var isActive = activeIds.indexOf(q.id) !== -1;
    var activeEntry = isActive ? quests.active.find(function(a){ return a.id === q.id; }) : null;
    var progress = activeEntry ? activeEntry.progress : 0;
    var isComplete = isActive && progress >= q.target;
    var pct = Math.min(100, Math.round((progress / q.target) * 100));

    var cls = 'hall-quest-card' + (isComplete ? ' complete' : isActive ? ' active' : '');
    html += '<div class="' + cls + '">';

    if(isComplete) html += '<div class="hall-quest-stamp complete-stamp">COMPLETE</div>';
    else if(isActive) html += '<div class="hall-quest-stamp active-stamp">ACTIVE</div>';

    html += '<div class="hall-quest-title">' + q.title + '</div>';
    html += '<div class="hall-quest-issuer">issued by ' + (q.issuer || 'Leona') + '</div>';
    html += '<div class="hall-quest-desc">' + q.desc + '</div>';
    // Round 67o: explicit OBJECTIVE line so players see the actionable
    // ask without parsing flavour text. Renders the same verb/noun
    // phrasing used in the active-quests rail (Defeat N Goblin, Clear
    // The Sewers, Apply Burn N times, etc).
    html += '<div class="hall-quest-objective">Objective: ' + _questActionHtml(q) + '</div>';

    html += '<div class="hall-quest-difficulty">';
    for(var d = 0; d < 5; d++) html += '<div class="hall-quest-dot' + (d < q.difficulty ? '' : ' empty') + '"></div>';
    html += '</div>';

    if(isActive || isComplete){
      html += '<div class="hall-quest-progress"><div class="hall-quest-progress-fill' + (isComplete ? ' complete' : '') + '" style="width:' + pct + '%"></div></div>';
      html += '<div class="hall-quest-progress-txt">' + progress + ' / ' + q.target + '</div>';
    }

    html += '<div class="hall-quest-rewards">';
    (q.rewards || []).forEach(function(r){
      html += '<div class="hall-reward-chip">' + (r.icon || goldImgHTML('10px')) + ' ' + r.amount + ' ' + (r.label || r.type) + '</div>';
    });
    html += '</div>';

    if(isComplete){
      html += '<button class="hall-quest-btn claim" data-action="claim" data-questid="'+q.id+'">CLAIM REWARD</button>';
    } else if(isActive){
      html += '<button class="hall-quest-btn" data-action="abandon" data-questid="'+q.id+'" style="border-color:#5a3020;color:#8a5030;">ABANDON</button>';
    } else if(quests.active.length < maxActive){
      html += '<button class="hall-quest-btn" data-action="accept" data-questidx="' + idx + '">ACCEPT</button>';
    } else {
      html += '<div style="font-size:8px;color:#6a5030;text-align:center;padding:4px;">Quest slots full</div>';
    }

    html += '</div>';
  });

  // Show vacant slots for missing quests (waiting for refresh)
  var target = getQuestOfferedCount();
  var vacant = target - quests.offered.length;
  for(var v = 0; v < vacant; v++){
    html += '<div class="hall-quest-card vacant">'
      +'<div style="text-align:center;padding:20px 10px;">'
      +'<div style="font-size:20px;opacity:.2;margin-bottom:8px;">📋</div>'
      +'<div style="font-size:8px;color:#3a2810;letter-spacing:1px;">VACANT</div>'
      +'<div style="font-size:7px;color:#2a1808;margin-top:4px;">New quest arrives at refresh</div>'
      +'</div></div>';
  }

  html += '</div>';
  return html;
}

// Event delegation for quest buttons — avoids inline onclick issues
var _questButtonsWired = false;
function _wireQuestButtons(){
  if(_questButtonsWired) return;
  var inner = document.getElementById('hall-body-inner');
  if(!inner) return;
  _questButtonsWired = true;
  inner.addEventListener('click', function(e){
    var btn = e.target.closest('[data-action]');
    if(!btn) return;
    var action = btn.getAttribute('data-action');
    if(action === 'accept'){
      var idx = parseInt(btn.getAttribute('data-questidx'));
      acceptQuest(idx);
    } else if(action === 'abandon'){
      var qid = btn.getAttribute('data-questid');
      abandonQuest(qid);
    } else if(action === 'claim'){
      var qid2 = btn.getAttribute('data-questid');
      claimQuest(qid2);
    }
  });
}

function _renderExpeditionsTab(){
  var hallLv = getBuildingLevel('adventurers_hall');
  var expeditionsUnlocked = hallLv >= 2;

  if(!expeditionsUnlocked){
    return '<div style="padding:40px 20px;text-align:center;">'
      +'<div style="font-size:24px;margin-bottom:12px;opacity:.4;">🏕️</div>'
      +'<div style="font-size:11px;color:#5e4c2e;letter-spacing:2px;">EXPEDITIONS LOCKED</div>'
      +'<div style="font-size:9px;color:#3a2810;margin-top:8px;">Reach Hall Level 2 to unlock expeditions.</div>'
      +'</div>';
  }

  var ahB = PERSIST.town.buildings.adventurers_hall;
  var slots = ahB.expeditionSlots || [];
  var maxSlots = Math.min(slots.length, 1 + Math.floor((hallLv - 1) / 2));

  var html = '<div style="padding:8px;">';

  for(var i = 0; i < slots.length; i++){
    var slot = slots[i];
    var isLocked = i >= maxSlots;

    if(isLocked){
      html += _expL1RenderLocked(2 + i*2);
      continue;
    }

    // Resting sub-state: no champ but a rest timer is still ticking down
    var nowMs = Date.now();
    if(!slot.champId && slot.restUntil && slot.restUntil > nowMs){
      html += _expL1RenderResting(slot, i);
      continue;
    }

    if(!slot.champId){
      // Auto-activate first empty slot for dispatch
      if(_expSendSlot === null && i < maxSlots) _expSendSlot = i;
      var isBuilding = _expSendSlot === i;
      if(isBuilding){
        html += _expL1RenderBuilder(i);
      } else {
        html += _expL1RenderEmptyBar(i);
      }
      continue;
    }

    // Active or ready
    var elapsed = nowMs - slot.startTime;
    var total = slot.totalMs || 1;
    var isReady = elapsed >= total;
    if(isReady){
      html += _expL1RenderReady(slot, i);
    } else {
      html += _expL1RenderActive(slot, i, elapsed, total);
    }
  }

  html += '</div>';
  return html;
}

// ── Layout 1 row helpers ────────────────────────────────────────────
// Each helper returns an HTML string for one slot row in a specific
// state. Keep these small so future variants (multi-champ, difficulty
// matching, fit chip color states) can grow without bloating the
// dispatch loop above.

function _expL1RenderLocked(unlockLv){
  return '<div class="exp-row locked">'
    + '<div class="exp-locked-icon">🔒</div>'
    + '<div class="exp-locked-label">HALL Lv.'+unlockLv+' TO UNLOCK</div>'
    + '</div>';
}

function _expL1RenderEmptyBar(slotIdx){
  return '<div class="exp-row-empty-bar" onclick="_expSendSlot='+slotIdx+';_expSendChamps=[];_expSendArea=null;_expSendType=null;_renderHallContent();">'
    + '+ DISPATCH TO SLOT '+(slotIdx+1)
    + '</div>';
}

function _expL1RenderBuilder(slotIdx){
  var roster  = (Array.isArray(_expSendChamps)?_expSendChamps:[]).slice();
  var areaObj = _expSendArea ? AREA_DEFS.find(function(a){ return a.id===_expSendArea; }) : null;
  var typeObj = _expSendType && typeof EXPEDITION_TYPES!=='undefined' ? EXPEDITION_TYPES[_expSendType] : null;
  var canConfirm = roster.length > 0 && _expSendArea && _expSendType;
  var maxRoster = (typeof EXP_MAX_ROSTER !== 'undefined') ? EXP_MAX_ROSTER : 3;

  // Champion column — chip-list with optional + ADD
  var champCol;
  if(roster.length){
    var chips = '';
    roster.forEach(function(id){ chips += _expL1ChampChip(id, true); });
    var canAdd = roster.length < maxRoster;
    var addBtn = canAdd
      ? '<button class="exp-champ-add active" onclick="event.stopPropagation();_expPickChamp();" title="Add another champion to the roster">+ ADD</button>'
      : '<span class="exp-champ-add-cap">FULL</span>';
    champCol = '<div class="exp-pill" onclick="_expPickChamp()">'
      + '<div class="exp-pill-label">CHAMPIONS · '+roster.length+' of '+maxRoster+'</div>'
      + '<div class="exp-champ-chips">'+chips+addBtn+'</div>'
      + '</div>';
  } else {
    champCol = '<div class="exp-pill empty" onclick="_expPickChamp()">'
      + '<div class="exp-pill-label">CHAMPIONS</div>'
      + '<div class="exp-pill-empty-text">tap to pick</div>'
      + '</div>';
  }

  // Location column
  var locCol;
  if(areaObj){
    locCol = '<div class="exp-pill" onclick="_expPickArea()">'
      + '<div class="exp-pill-label">LOCATION</div>'
      + '<div class="exp-pill-value"><span class="exp-pill-value-icon">◬</span>'+areaObj.name.toUpperCase()+'</div>'
      + '<div class="exp-pill-sub">Lv.'+areaObj.levelRange[0]+'–'+areaObj.levelRange[1]+'</div>'
      + '</div>';
  } else {
    locCol = '<div class="exp-pill empty" onclick="_expPickArea()">'
      + '<div class="exp-pill-label">LOCATION</div>'
      + '<div class="exp-pill-empty-text">tap to pick</div>'
      + '</div>';
  }

  // Duration column
  var durCol;
  if(typeObj){
    durCol = '<div class="exp-pill" onclick="_expPickType()">'
      + '<div class="exp-pill-label">DURATION</div>'
      + '<div class="exp-pill-value"><span class="exp-pill-value-icon">'+(typeObj.icon||'⏱')+'</span>'+typeObj.name.toUpperCase()+' · '+_formatMs(typeObj.durationMs)+'</div>'
      + '<div class="exp-pill-sub">'+(typeObj.restMs?_formatMs(typeObj.restMs)+' rest':'no rest')+(typeObj.durationMult?' · '+typeObj.durationMult+'× yield':'')+'</div>'
      + '</div>';
  } else {
    durCol = '<div class="exp-pill empty" onclick="_expPickType()">'
      + '<div class="exp-pill-label">DURATION</div>'
      + '<div class="exp-pill-empty-text">tap to pick</div>'
      + '</div>';
  }

  // Dispatch CTA
  var cta = '<button class="exp-cta exp-cta-dispatch"'+(canConfirm?'':' disabled')+(canConfirm?' onclick="_expConfirmSend()"':'')+'>DISPATCH</button>';

  // Footer strip (live fit chip + AGI pill + est. line)
  var footer = '<div class="exp-row-footer">'
    + _expL1FitChip(roster, _expSendArea, _expSendType)
    + (roster.length ? _expL1AgiPill(roster) : '')
    + _expL1EstLine(roster, typeObj)
    + '</div>';

  return '<div class="exp-row builder">'
    + '<div class="exp-row-top">'+champCol+locCol+durCol+cta+'</div>'
    + footer
    + '</div>';
}

function _expL1RenderActive(slot, slotIdx, elapsed, total){
  var pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  var remaining = Math.max(0, total - elapsed);
  var area = AREA_DEFS.find(function(a){ return a.id === slot.areaId; });
  var typeDef = typeof EXPEDITION_TYPES !== 'undefined' ? EXPEDITION_TYPES[slot.type] : null;
  var champIds = _expL1SlotChampIds(slot);

  return '<div class="exp-row active">'
    + '<div class="exp-row-top">'
      + _expL1ChampPartyBlock(champIds)
      + _expL1ReadOnlyPill('LOCATION', '◬', (area?area.name.toUpperCase():'?'), 'Lv.'+(area?area.levelRange[0]+'–'+area.levelRange[1]:'?'))
      + _expL1ReadOnlyPill('DURATION', (typeDef&&typeDef.icon)||'⏱', (typeDef?typeDef.name.toUpperCase():(slot.type||'?').toUpperCase())+' · '+_formatMs(total), (typeDef&&typeDef.durationMult?typeDef.durationMult+'× yield':''))
      + '<button class="exp-cta exp-cta-recall" onclick="recallExpedition('+slotIdx+')">RECALL</button>'
    + '</div>'
    + '<div class="exp-progress-row">'
      + '<div class="exp-progress-bar"><div class="exp-progress-fill" style="width:'+pct+'%;"></div></div>'
      + '<span class="exp-progress-text">'+_formatMs(remaining)+' LEFT · '+Math.round(pct)+'%</span>'
    + '</div>'
    + '</div>';
}

function _expL1RenderReady(slot, slotIdx){
  var area = AREA_DEFS.find(function(a){ return a.id === slot.areaId; });
  var typeDef = typeof EXPEDITION_TYPES !== 'undefined' ? EXPEDITION_TYPES[slot.type] : null;
  var champIds = _expL1SlotChampIds(slot);
  var fitPct = (typeof slot.fitPct === 'number') ? slot.fitPct : 100;
  return '<div class="exp-row ready">'
    + '<div class="exp-row-top">'
      + _expL1ChampPartyBlock(champIds, 'RETURNED')
      + _expL1ReadOnlyPill('LOCATION', '◬', (area?area.name.toUpperCase():'?'), '')
      + _expL1ReadOnlyPill('DURATION', (typeDef&&typeDef.icon)||'⏱', (typeDef?typeDef.name.toUpperCase():(slot.type||'?').toUpperCase())+' · DONE', '')
      + '<button class="exp-cta exp-cta-collect" onclick="collectExpedition('+slotIdx+')">COLLECT</button>'
    + '</div>'
    + '<div class="exp-progress-row">'
      + '<div class="exp-progress-bar"><div class="exp-progress-fill ready" style="width:100%;"></div></div>'
      + '<span class="exp-progress-text" style="color:#7fc06a;">READY TO COLLECT · YIELD '+fitPct+'%</span>'
    + '</div>'
    + '</div>';
}

function _expL1RenderResting(slot, slotIdx){
  // Resting = previous run finished, slot is on a rest hangover before
  // it can dispatch again. We use slot.lastChampIds / lastAreaId / lastType
  // (preserved by _clearExpeditionSlot) so the row can show "who just got
  // back from where" instead of an empty placeholder.
  var lastChampIds = (Array.isArray(slot.lastChampIds) && slot.lastChampIds.length) ? slot.lastChampIds : [];
  var lastAreaId   = slot.lastAreaId;
  var lastType     = slot.lastType;
  var area = lastAreaId ? AREA_DEFS.find(function(a){ return a.id === lastAreaId; }) : null;
  var typeDef = (lastType && typeof EXPEDITION_TYPES !== 'undefined') ? EXPEDITION_TYPES[lastType] : null;
  var restMs = Math.max(0, slot.restUntil - Date.now());

  // Champion column — show roster as small chips, "RESTING" status line
  var champCol;
  if(lastChampIds.length){
    var chips = '';
    lastChampIds.forEach(function(id){ chips += _expL1ChampChip(id, false); });
    champCol = '<div class="exp-pill readonly">'
      + '<div class="exp-pill-label">CHAMPIONS · RESTING</div>'
      + '<div class="exp-champ-chips">'+chips+'</div>'
      + '</div>';
  } else {
    champCol = '<div class="exp-pill readonly"><div class="exp-pill-label">CHAMPIONS</div><div class="exp-pill-empty-text">resting</div></div>';
  }

  return '<div class="exp-row resting">'
    + '<div class="exp-row-top">'
      + champCol
      + _expL1ReadOnlyPill('LOCATION', '◬', area?area.name.toUpperCase():'—', '')
      + _expL1ReadOnlyPill('DURATION', (typeDef&&typeDef.icon)||'⏱', typeDef?typeDef.name.toUpperCase()+' · DONE':'—', '')
      + '<button class="exp-cta exp-cta-redispatch" disabled>REDISPATCH</button>'
    + '</div>'
    + '<div class="exp-rest-strip">'
      + '<span class="exp-rest-label">SLOT RESTING</span>'
      + '<span class="exp-rest-time">'+_formatMs(restMs)+' REMAINING'+(typeDef?' · '+typeDef.name.toUpperCase()+' HANGOVER':'')+'</span>'
    + '</div>'
    + '</div>';
}

// ── Small Layout 1 building blocks ─────────────────────────────────

// Read champion roster from a slot, falling back through the various
// shapes (new array / legacy single id / pre-rest last roster).
function _expL1SlotChampIds(slot){
  if(!slot) return [];
  if(Array.isArray(slot.champIds) && slot.champIds.length) return slot.champIds.slice();
  if(slot.champId) return [slot.champId];
  return [];
}

function _expL1ChampChip(champId, withRemove){
  var ch = CREATURES[champId]; if(!ch) return '';
  var cp = getChampPersist(champId);
  return '<div class="exp-champ-chip">'
    + creatureImgHTML(champId, ch.icon, '16px')
    + '<span class="exp-champ-chip-name">'+ch.name+'</span>'
    + '<span class="exp-champ-chip-stat">AGI '+Math.round(cp.stats.agi)+'</span>'
    + (withRemove ? '<span class="exp-champ-chip-x" onclick="event.stopPropagation();_expToggleChamp(\''+champId+'\');" title="Remove">×</span>' : '')
    + '</div>';
}

// Renders a roster (1-3 champions) compactly inside the CHAMPIONS column.
// Single champion → portrait + name + AGI line (preserves the look from the
// pre-multi-champ active state). Multi-champion → stacked mini-strip.
function _expL1ChampPartyBlock(champIds, statOverride){
  if(!champIds || !champIds.length) return '<div class="exp-champ-active"></div>';
  if(champIds.length === 1) return _expL1ChampActiveBlock(champIds[0], statOverride);

  // Multi-champion roster: header + chip list
  var roster = champIds.filter(function(id){ return !!CREATURES[id]; });
  var fit = (typeof rosterActivitySpeedBonus === 'function')
    ? rosterActivitySpeedBonus(roster, 'AGI')
    : { effectiveStat:0, speedBonus:0 };
  var statLine = statOverride
    ? statOverride
    : 'PARTY · AGI '+Math.round(fit.effectiveStat);
  var chips = '';
  roster.forEach(function(id){ chips += _expL1ChampChip(id, false); });
  return '<div class="exp-champ-active" style="flex-direction:column;align-items:stretch;gap:5px;padding:6px 10px;">'
    + '<div class="exp-champ-active-stat">'+statLine+'</div>'
    + '<div class="exp-champ-chips">'+chips+'</div>'
    + '</div>';
}

function _expL1ChampActiveBlock(champId, statOverride){
  var ch = CREATURES[champId]; if(!ch) return '<div class="exp-champ-active"></div>';
  var cp = getChampPersist(champId);
  var statLine = statOverride
    ? statOverride
    : 'AGI '+Math.round(cp.stats.agi)+' · LV.'+cp.level;
  return '<div class="exp-champ-active">'
    + creatureImgHTML(champId, ch.icon, '32px')
    + '<div class="exp-champ-active-info">'
      + '<div class="exp-champ-active-name">'+ch.name+'</div>'
      + '<div class="exp-champ-active-stat">'+statLine+'</div>'
    + '</div>'
    + '</div>';
}

function _expL1ReadOnlyPill(label, icon, value, sub){
  return '<div class="exp-pill readonly">'
    + '<div class="exp-pill-label">'+label+'</div>'
    + '<div class="exp-pill-value"><span class="exp-pill-value-icon">'+icon+'</span>'+value+'</div>'
    + (sub ? '<div class="exp-pill-sub">'+sub+'</div>' : '')
    + '</div>';
}

// AGI pill for a roster (or single champion). Shows combined effective AGI
// + the speed-bonus % time reduction.
function _expL1AgiPill(champIds){
  var arr = Array.isArray(champIds) ? champIds : (champIds ? [champIds] : []);
  if(!arr.length) return '';
  var fit = (typeof rosterActivitySpeedBonus === 'function')
    ? rosterActivitySpeedBonus(arr, 'AGI')
    : { speedBonus:0, effectiveStat:0 };
  return '<span class="exp-agi-pill">'
    + '<span class="exp-agi-pill-stat">AGI '+Math.round(fit.effectiveStat)+'</span>'
    + '<span class="exp-agi-pill-sep"></span>'
    + '<span class="exp-agi-pill-bonus">−'+Math.round(fit.speedBonus*100)+'% TIME</span>'
    + '</span>';
}

// Live fit chip — graded color + dots based on roster vs (area, type)
// difficulty. Returns the neutral placeholder when any of the three
// ingredients is missing.
function _expL1FitChip(champIds, areaId, typeId){
  var arr = Array.isArray(champIds) ? champIds : (champIds ? [champIds] : []);
  if(!arr.length || !areaId || !typeId){
    return '<span class="exp-fit-chip" title="Pick all three to see fit grade.">'
      + '<span class="exp-fit-dots">'
        + '<span class="exp-fit-dot"></span>'
        + '<span class="exp-fit-dot"></span>'
        + '<span class="exp-fit-dot"></span>'
      + '</span>'
      + '<span class="exp-fit-label">FIT —</span>'
      + '</span>';
  }
  var fit = (typeof expFitFor === 'function')
    ? expFitFor(arr, areaId, typeId)
    : { label:'—', pct:0, severity:'neutral', desc:'' };
  // Map severity to dot colors: success=3 green, warn=2 yellow, danger=1 red
  var dots;
  if(fit.severity === 'success'){
    dots = '<span class="exp-fit-dot success"></span><span class="exp-fit-dot success"></span><span class="exp-fit-dot success"></span>';
  } else if(fit.severity === 'warn'){
    dots = '<span class="exp-fit-dot warn"></span><span class="exp-fit-dot warn"></span><span class="exp-fit-dot"></span>';
  } else if(fit.severity === 'danger'){
    dots = '<span class="exp-fit-dot danger"></span><span class="exp-fit-dot"></span><span class="exp-fit-dot"></span>';
  } else {
    dots = '<span class="exp-fit-dot"></span><span class="exp-fit-dot"></span><span class="exp-fit-dot"></span>';
  }
  var cls = 'exp-fit-chip ' + fit.severity;
  return '<span class="'+cls+'" title="'+(fit.desc||'')+'">'
    + '<span class="exp-fit-dots">'+dots+'</span>'
    + '<span class="exp-fit-label">'+fit.label+' · '+fit.pct+'%</span>'
    + '</span>';
}

function _expL1EstLine(champIds, typeObj){
  var arr = Array.isArray(champIds) ? champIds : (champIds ? [champIds] : []);
  if(!arr.length || !typeObj) return '<span class="exp-est">EST. — · YIELD —</span>';
  var fit = (typeof rosterActivitySpeedBonus === 'function')
    ? rosterActivitySpeedBonus(arr, 'AGI')
    : { speedBonus:0 };
  var estMs = Math.round(typeObj.durationMs * (1 - fit.speedBonus));
  return '<span class="exp-est">EST. '+_formatMs(estMs)+' · BASE YIELD '+(typeObj.durationMult||1)+'×</span>';
}

function _formatMs(ms){
  var s = Math.floor(ms / 1000);
  var h = Math.floor(s / 3600); s %= 3600;
  var m = Math.floor(s / 60); s %= 60;
  if(h > 0) return h + 'h ' + m + 'm';
  if(m > 0) return m + 'm ' + s + 's';
  return s + 's';
}

// ── Quest System ──
function _generateBounties(count){
  var bounties = [];
  var templates = [
    // Sewer quests
    {title:'Sewer Sweep', desc:'Clear the Sewers to prove your worth.', type:'clear', areaId:'sewers', target:3, difficulty:1, rewards:[{type:'gold',icon:'✦',amount:80,label:'Gold'}], issuer:'Leona'},
    {title:'Rat Problem', desc:'The rats are getting bolder. Thin the herd.', type:'kill', enemyId:'rat', target:10, difficulty:1, rewards:[{type:'gold',icon:'✦',amount:50,label:'Gold'},{type:'material',icon:'🪨',amount:3,label:'Slick Stone'}], issuer:'Leona'},
    {title:'Goblin Menace', desc:'Goblin scavengers are stealing supplies again.', type:'kill', enemyId:'goblin', target:12, difficulty:2, rewards:[{type:'gold',icon:'✦',amount:100,label:'Gold'}], issuer:'Leona'},
    {title:'Drain Duty', desc:'Something lurks in the deep drains. Find it.', type:'kill', enemyId:'drain_lurker', target:5, difficulty:2, rewards:[{type:'gold',icon:'✦',amount:120,label:'Gold'},{type:'material',icon:'🪨',amount:5,label:'Slick Stone'}], issuer:'Town Guard'},
    {title:'Undead Patrol', desc:'The dead are restless in the lower tunnels.', type:'kill', enemyId:'zombie', target:8, difficulty:2, rewards:[{type:'gold',icon:'✦',amount:110,label:'Gold'}], issuer:'Town Guard'},
    // Pale Road quests
    {title:'Road Patrol', desc:'The Pale Road needs clearing. Bandits and beasts.', type:'clear', areaId:'pale_road', target:2, difficulty:2, rewards:[{type:'gold',icon:'✦',amount:120,label:'Gold'}], issuer:'Leona'},
    {title:'Wolf Cull', desc:'The wolves are too close to the road. Push them back.', type:'kill', enemyId:'wolf', target:8, difficulty:2, rewards:[{type:'gold',icon:'✦',amount:90,label:'Gold'},{type:'soul_shards',icon:'🔮',amount:10,label:'Shards'}], issuer:'Merchant Caravan'},
    {title:'Bandit Bounty', desc:'A band of bandits has been raiding travellers.', type:'kill', enemyId:'bandit', target:6, difficulty:3, rewards:[{type:'gold',icon:'✦',amount:150,label:'Gold'}], issuer:'Bounty Office'},
    {title:'Slime Samples', desc:'A scholar needs slime residue for research.', type:'kill', enemyId:'slime', target:10, difficulty:1, rewards:[{type:'gold',icon:'✦',amount:60,label:'Gold'},{type:'material',icon:'🔩',amount:3,label:'Bog Iron'}], issuer:'Scholar'},
    // Swamp quests
    {title:'Swamp Survey', desc:'Venture into Bogmire Swamp. Document what lives there.', type:'clear', areaId:'swamp', target:2, difficulty:3, rewards:[{type:'gold',icon:'✦',amount:150,label:'Gold'},{type:'soul_shards',icon:'🔮',amount:15,label:'Shards'}], issuer:'Leona'},
    {title:'Spore Collection', desc:'The Bestiary needs Spore Puff samples. Carefully.', type:'kill', enemyId:'sporepuff', target:6, difficulty:3, rewards:[{type:'gold',icon:'✦',amount:130,label:'Gold'},{type:'material',icon:'🔩',amount:4,label:'Bog Iron'}], issuer:'Bestiary Scholar'},
    {title:'Mycelid Study', desc:'A rare fungal creature has been spotted. Investigate.', type:'kill', enemyId:'mycelid', target:4, difficulty:3, rewards:[{type:'gold',icon:'✦',amount:180,label:'Gold'}], issuer:'Leona'},
    {title:'Snake Venom', desc:'Snake venom is valuable to alchemists. Bring some back.', type:'kill', enemyId:'snake', target:8, difficulty:2, rewards:[{type:'gold',icon:'✦',amount:100,label:'Gold'},{type:'material',icon:'🔩',amount:2,label:'Bog Iron'}], issuer:'Alchemist'},
    // General quests
    {title:'The Endurance Test', desc:'Complete 5 runs. Any area. Just survive.', type:'runs', target:5, difficulty:2, rewards:[{type:'gold',icon:'✦',amount:200,label:'Gold'}], issuer:'Leona'},
    {title:'Warm Up', desc:'Complete 3 runs to shake off the rust.', type:'runs', target:3, difficulty:1, rewards:[{type:'gold',icon:'✦',amount:75,label:'Gold'}], issuer:'Leona'},
    {title:'Marathon', desc:'Complete 10 runs. Show your dedication.', type:'runs', target:10, difficulty:3, rewards:[{type:'gold',icon:'✦',amount:350,label:'Gold'},{type:'soul_shards',icon:'🔮',amount:25,label:'Shards'}], issuer:'Leona'},
  ];
  // Shuffle and pick
  var shuffled = templates.slice().sort(function(){ return Math.random() - 0.5; });
  for(var i = 0; i < count && i < shuffled.length; i++){
    var t = shuffled[i];
    // Round 67o: include a random suffix so consecutive calls within the
    // same millisecond don't collide. The quest-refresh path calls
    // _generateBounties(1) repeatedly to top up `offered`, and the inner
    // `i` is always 0 when count=1 → all topped-up quests previously
    // shared the same id `quest_<sameMs>_0`. That made activeIds.indexOf
    // match every offered card once one was accepted, so the whole grid
    // visually read as ACTIVE. The random suffix breaks the tie.
    var uid = 'quest_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2,8);
    bounties.push({id:uid, title:t.title, desc:t.desc, type:t.type, areaId:t.areaId, enemyId:t.enemyId, target:t.target, difficulty:t.difficulty, rewards:t.rewards, issuer:'Leona'});
  }
  return bounties;
}

function getMaxActiveQuests(){
  var lvl = getBuildingLevel('adventurers_hall');
  var base = 1;
  if(lvl >= 5) base = 3;
  else if(lvl >= 3) base = 2;
  return base + (PERSIST.town.bonusQuestSlots||0);
}

function getQuestOfferedCount(){
  var lvl = getBuildingLevel('adventurers_hall');
  return Math.min(6, 3 + Math.floor((lvl-1)/2)); // 3,3,4,4,5,5,6
}

var QUEST_REFRESH_SECS = 14400; // 4 hours

// Advance progress on any active quest matching the given event. Called from
// combat at three points in game.js:
//   - on enemy kill          : checkQuestProgress('kill', {enemyId})
//   - on area cleared        : checkQuestProgress('area_clear', {areaId, damageTaken})
//   - on run complete        : checkQuestProgress('run_complete', {goldEarned})
// Active quests reference offered quest templates by id; templates carry
// type ('kill' | 'clear' | 'runs') + enemyId/areaId for matching.
function checkQuestProgress(eventType, ctx){
  if(!PERSIST.town || !PERSIST.town.quests) return;
  var quests = PERSIST.town.quests;
  if(!Array.isArray(quests.active) || !quests.active.length) return;
  ctx = ctx || {};
  var anyAdvanced = false;

  quests.active.forEach(function(active){
    var q = (quests.offered||[]).find(function(o){ return o.id === active.id; });
    if(!q) return; // template gone (refresh wiped it) — skip silently
    if((active.progress||0) >= q.target) return; // already complete

    var advance = false;
    if(eventType === 'kill' && q.type === 'kill' && q.enemyId === ctx.enemyId) advance = true;
    else if(eventType === 'area_clear' && q.type === 'clear' && q.areaId === ctx.areaId) advance = true;
    else if(eventType === 'run_complete' && q.type === 'runs') advance = true;
    // Round 48: arena_fight quests advance on arena_win events. If the
    // quest's fight payload specifies an enemy id, only matching wins
    // count; otherwise any arena win progresses the quest.
    else if(eventType === 'arena_win' && q.type === 'arena_fight'){
      if(!q.fight || !q.fight.id || q.fight.id === ctx.enemyId) advance = true;
    }
    // Round 67p: story quest event types.
    // level_up — ctx.level is the new level; advance if it meets the bar.
    else if(eventType === 'level_up' && q.type === 'reach_level'){
      var bar = q.targetLevel || 2;
      if((ctx.level || 0) >= bar) advance = true;
    }
    else if(eventType === 'deck_edit' && q.type === 'edit_deck') advance = true;
    else if(eventType === 'craft_relic' && q.type === 'craft_relic'){
      if(!q.targetRelicId || q.targetRelicId === ctx.relicId) advance = true;
    }
    else if(eventType === 'equip_relic' && q.type === 'equip_relic'){
      if(!q.targetRelicId || q.targetRelicId === ctx.relicId) advance = true;
    }

    if(advance){
      active.progress = (active.progress||0) + 1;
      anyAdvanced = true;
      if(active.progress >= q.target){
        if(typeof showTownToast === 'function') showTownToast('✦ Quest complete: ' + q.title);
        if(typeof playQuestNotifySfx === 'function') playQuestNotifySfx();
      }
    }
  });

  if(anyAdvanced) savePersist();
}

function acceptQuest(idx){
  var quests = PERSIST.town.quests;
  if(!quests.active) quests.active = [];
  if(!Array.isArray(quests.active)) quests.active = quests.active ? [quests.active] : [];
  if(quests.active.length >= getMaxActiveQuests()) return;
  var q = quests.offered[idx];
  if(!q) return;
  if(quests.active.some(function(a){ return a.id === q.id; })) return;
  quests.active.push({id:q.id, progress:0});
  playQuestAcceptSfx();
  savePersist();
  _renderHallContent();
}

function abandonQuest(questId){
  // In-game confirmation modal
  var existing = document.getElementById('abandon-overlay');
  if(existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'abandon-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;';
  var box = document.createElement('div');
  box.style.cssText = 'background:#1a0f06;border:1px solid #5a3418;border-radius:10px;padding:24px 28px;max-width:340px;text-align:center;box-shadow:0 0 40px rgba(0,0,0,.8);';
  box.innerHTML = '<div style="font-size:12px;color:#d4a843;margin-bottom:12px;">ABANDON QUEST?</div>'
    +'<div style="font-size:9px;color:#8a6840;line-height:1.6;margin-bottom:16px;">Progress will be lost. The slot stays empty until the next quest refresh.</div>'
    +'<div style="display:flex;gap:10px;justify-content:center;"></div>';

  var btnRow = box.querySelector('div:last-child');

  var yesBtn = document.createElement('button');
  yesBtn.textContent = 'ABANDON';
  yesBtn.style.cssText = 'font-size:9px;padding:8px 20px;border-radius:6px;cursor:pointer;border:1px solid #5a3020;background:rgba(80,30,10,.5);color:#c06030;letter-spacing:1px;';
  yesBtn.addEventListener('click', function(){
    overlay.remove();
    playSfx('abandon');
    var quests = PERSIST.town.quests;
    if(!quests.active) quests.active = [];
    if(!Array.isArray(quests.active)) quests.active = [];
    quests.active = quests.active.filter(function(a){ return a.id !== questId; });
    quests.offered = quests.offered.filter(function(o){ return o.id !== questId; });
    savePersist();
    _renderHallContent();
  });

  var noBtn = document.createElement('button');
  noBtn.textContent = 'CANCEL';
  noBtn.style.cssText = 'font-size:9px;padding:8px 20px;border-radius:6px;cursor:pointer;border:1px solid #3a2818;background:rgba(30,20,5,.5);color:#8a6840;letter-spacing:1px;';
  noBtn.addEventListener('click', function(){ overlay.remove(); });

  btnRow.appendChild(yesBtn);
  btnRow.appendChild(noBtn);
  overlay.appendChild(box);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function claimQuest(questId){
  var quests = PERSIST.town.quests;
  if(!quests.active || !Array.isArray(quests.active)) return;
  var activeEntry = quests.active.find(function(a){ return a.id === questId; });
  if(!activeEntry) return;
  var q = quests.offered.find(function(o){ return o.id === questId; });
  if(!q) return;
  // Grant rewards
  (q.rewards || []).forEach(function(r){
    if(r.type === 'gold') PERSIST.gold += r.amount;
    else if(r.type === 'soul_shards') PERSIST.soulShards = (PERSIST.soulShards||0) + r.amount;
    else if(r.type === 'material' && r.id) PERSIST.town.materials[r.id] = (PERSIST.town.materials[r.id]||0) + r.amount;
    else if(r.type === 'mastery_xp'){
      // Grant mastery XP to all unlocked champions
      PERSIST.unlockedChamps.forEach(function(cid){
        var cp2 = getChampPersist(cid);
        if(cp2) cp2.masteryXp = (cp2.masteryXp||0) + r.amount;
      });
    }
  });
  // Remove from offered + active — slot stays empty until refresh
  quests.offered = quests.offered.filter(function(o){ return o.id !== questId; });
  quests.active = quests.active.filter(function(a){ return a.id !== questId; });
  quests.completed.push(questId);
  // Round 67p: story quests can chain. Fire any onClaim side-effect
  // (e.g. building unlocks) before activating the next link so the
  // toast order makes sense to the player.
  if(q.isStory){
    if(typeof q.onClaim === 'function'){
      try { q.onClaim(); } catch(e){ /* swallow — onClaim is content-driven */ }
    }
    if(q.next && typeof STORY_QUESTS !== 'undefined' && STORY_QUESTS[q.next] && typeof _activateStoryQuest === 'function'){
      _activateStoryQuest(STORY_QUESTS[q.next]);
    }
  }
  savePersist();
  showTownToast('Quest complete! Rewards claimed.');
  _renderHallContent();
}

// Round 67p: rail-side claim. Animates the bar drain → row collapse →
// repaint with any chain-spawned next quest fading in. Routes through
// claimQuest (so .next chain + onClaim fire), but defers it until
// after the collapse animation so the visual matches the state change.
//
// Phases (timings tuned to feel snappy but readable):
//   0ms   — drain the progress bar to 0% (existing CSS transition).
//   320ms — collapse the row (max-height + opacity + padding to 0).
//   760ms — actually run claimQuest, diff active-quest ids to mark any
//           chain-spawned newcomers, then repaint both rails. New rows
//           render with .cs-q-chain-in for the fade+grow animation.
//   1400ms — clear the chain-in markers so future repaints don't replay
//            the in-animation.
function claimQuestFromRail(questId){
  if(!questId) return;
  // Defensive: ignore re-clicks while a previous claim is still
  // animating out (the row is still in the DOM, just collapsing).
  var existingRow = document.querySelector('.cs-q-row.cs-q-claiming[data-qid="' + (window.CSS && CSS.escape ? CSS.escape(questId) : questId) + '"]');
  if(existingRow) return;

  // Snapshot active quest ids BEFORE claim so we can detect anything
  // spawned by the .next chain.
  var beforeIds = {};
  var qs0 = (PERSIST.town && PERSIST.town.quests) ? PERSIST.town.quests : null;
  if(qs0 && Array.isArray(qs0.active)){
    qs0.active.forEach(function(a){ beforeIds[a.id] = true; });
  }

  // Find every rail row representing this quest (both rails could be
  // mounted simultaneously on the area screen) and start phase 1.
  var sel = '.cs-q-row[data-qid="' + (window.CSS && CSS.escape ? CSS.escape(questId) : questId) + '"]';
  var rows = document.querySelectorAll(sel);
  rows.forEach(function(row){
    var fill = row.querySelector('.cs-q-bar-fill');
    if(fill) fill.style.width = '0%'; // .cs-q-bar-fill already has a width transition
  });

  // Phase 2: collapse the row.
  setTimeout(function(){
    rows.forEach(function(row){ row.classList.add('cs-q-claiming'); });
  }, 320);

  // Phase 3: actual claim + repaint with chain-in flags.
  setTimeout(function(){
    claimQuest(questId);
    var qs1 = (PERSIST.town && PERSIST.town.quests) ? PERSIST.town.quests : null;
    if(qs1 && Array.isArray(qs1.active)){
      qs1.active.forEach(function(a){
        if(!beforeIds[a.id]) _csQuestChainIns[a.id] = Date.now();
      });
    }
    if(typeof buildCsQuestRail === 'function')   buildCsQuestRail();
    if(typeof buildAreaQuestRail === 'function') buildAreaQuestRail();
  }, 760);

  // Phase 4: clear chain-in markers after the in-animation settles.
  setTimeout(function(){ _csQuestChainIns = {}; }, 1400);
}

function questTick(seconds){
  var quests = PERSIST.town.quests;
  if(!quests) return;
  // Migrate old format
  if(quests.active && !Array.isArray(quests.active)){
    quests.active = quests.active ? [quests.active] : [];
  }
  // Quest refresh timer
  quests.refreshProgress = (quests.refreshProgress||0) + seconds;
  if(quests.refreshProgress >= QUEST_REFRESH_SECS){
    quests.refreshProgress = 0;
    // Replace non-active offered quests
    var activeIds = (quests.active||[]).map(function(a){ return a.id; });
    quests.offered = quests.offered.filter(function(q){
      return activeIds.indexOf(q.id) !== -1;
    });
    var target = getQuestOfferedCount();
    while(quests.offered.length < target){
      var more = _generateBounties(1);
      quests.offered = quests.offered.concat(more);
    }
  }
}

// Expedition functions: startExpeditionFlow, collectExpedition, recallExpedition
// defined in data/expedition.js (loaded after town.js)

function openBuilding(id){
  playSelectSfx();
  if(id==='vault'){ openVaultPanel(); showTutorial('vault_intro'); return; }
  if(id==='adventurers_hall'){ openAdventurersHall(); showTutorial('adventurers_hall_intro'); return; }
  var panelBg=document.getElementById(id+'-panel-bg');
  if(!panelBg) return;
  panelBg.classList.add('show');
  refreshBuildingPanel(id);
  showTutorial(id+'_intro');
}

function closeBuildingPanel(id){
  npcTypewriterStop();
  // Round 44: reset the once-per-open greeting flag so the next time
  // this building is opened, the NPC greets again with a fresh line.
  if(id) delete _npcGreetedThisOpen[id];
  var panelBg=document.getElementById(id+'-panel-bg');
  if(panelBg) panelBg.classList.remove('show');
  buildTownCardsStrip();
  buildTownGrid();
}

function showLockedBuildingUI(id){
  var cost=BUILDING_UNLOCK_COSTS[id];
  if(!cost) return;
  var inner=document.getElementById(id+'-inner');
  var lockMsg=document.getElementById(id+'-locked-msg');
  if(!inner||!lockMsg) return;
  var b=PERSIST.town.buildings[id];
  if(b&&b.unlocked){ lockMsg.style.display='none'; inner.style.display=''; return; }
  lockMsg.style.display='block'; inner.style.display='none';

  var btnHtml='';
  if(cost.seenCount){
    var seen=PERSIST.seenEnemies.length;
    var seenMet=seen>=cost.seenCount;
    var canBuy=cost.gold&&PERSIST.gold>=cost.gold;
    var pct=Math.min(100,Math.round((seen/cost.seenCount)*100));
    btnHtml='<div class="town-unlock-desc">'+cost.desc+'</div>'
      +'<div style="margin:8px 0 4px;">'
        +'<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'
          +'<span style="font-size:8px;color:#6a5020;">Enemies encountered</span>'
          +'<span style="font-size:9px;color:'+(seenMet?'#d4a843':'#7a6030')+';">'+seen+' / '+cost.seenCount+'</span>'
        +'</div>'
        +'<div style="height:4px;background:rgba(0,0,0,.5);border-radius:2px;overflow:hidden;">'
          +'<div style="height:100%;width:'+pct+'%;background:'+(seenMet?'#c09030':'linear-gradient(90deg,#3a2010,#8a5020)')+';border-radius:2px;"></div>'
        +'</div>'
      +'</div>'
      +(seenMet
        ?'<button class="btn btn-gold" style="font-size:10px;margin-top:4px;" data-bid="'+id+'" onclick="tryUnlockBuilding(this.dataset.bid)">UNLOCK FREE →</button>'
        :'<div class="lock-or-divider">— or —</div>'
          +'<button class="btn btn-dim" style="font-size:10px;"'+(canBuy?'data-bid="'+id+'" onclick="tryUnlockBuilding(this.dataset.bid)"':' disabled')+'>'
            +'✦ '+cost.gold+'g to unlock now'
          +'</button>'
          +(canBuy?'':'<div style="font-size:8px;color:#3a2010;margin-top:3px;">Need '+(cost.gold-PERSIST.gold)+'g more</div>'));
  } else if(cost.achId){
    var ach=ACHIEVEMENTS.find(function(a){return a.id===cost.achId;});
    var prog=ach?getAchProgress(ach):{current:0,needed:20};
    btnHtml='<div class="town-unlock-desc">'+cost.desc+'</div>'
      +'<div style="font-size:9px;color:#7a6030;margin-bottom:8px;">Progress: '+prog.current+'/'+prog.needed+'</div>'
      +(isAchComplete(ach)
        ?'<button class="btn btn-gold" style="font-size:10px;" data-bid="'+id+'" onclick="tryUnlockBuilding(this.dataset.bid)">UNLOCK FREE</button>'
        :'<div style="font-size:9px;color:#4a3010;">Complete the achievement to unlock</div>');
  } else {
    btnHtml='<div class="town-unlock-cost">'+cost.gold+' gold</div>'
      +'<div class="town-unlock-desc">'+cost.desc+'</div>'
      +(PERSIST.gold>=cost.gold
        ?'<button class="btn btn-gold" style="font-size:10px;" data-bid="'+id+'" onclick="tryUnlockBuilding(this.dataset.bid)">PURCHASE</button>'
        :'<div style="font-size:9px;color:#4a3010;">Not enough gold (have '+PERSIST.gold+'g)</div>');
  }

  lockMsg.innerHTML='<div style="text-align:center;padding:20px 10px;">'
    +'<div style="font-size:28px;margin-bottom:10px;">🔒</div>'
    +'<div style="font-size:11px;color:#6a5020;margin-bottom:12px;letter-spacing:1px;">LOCKED</div>'
    +btnHtml
    +'</div>';
}


function isBuildingVisible(id){
  // All buildings are always visible — locked ones show as locked but browsable
  return true;
}

function buildTownGrid(){
  refreshSummonsBanner();
  var grid=document.getElementById('town-grid'); grid.innerHTML='';

  Object.values(BUILDINGS).forEach(function(bdef){
    var b=PERSIST.town.buildings[bdef.id];
    var unlocked=b&&b.unlocked;
    var cost=BUILDING_UNLOCK_COSTS[bdef.id];
    var canAfford=cost&&cost.gold&&PERSIST.gold>=cost.gold;

    // Per-building status text
    var statusTxt='LOCKED', statusCls='locked';
    if(!unlocked){
      statusTxt='LOCKED'; statusCls='locked';
    } else {
      statusTxt='OPEN'; statusCls='empty';
      if(bdef.id==='forge'){
        var fq=(PERSIST.town.buildings.forge.queue||[]);
        if(fq.length>0){
          var fi=fq[0]; var fpct=Math.min(100,Math.round(((Date.now()-fi.startTime)/fi.totalMs)*100));
          statusTxt='CRAFTING '+fpct+'%'; statusCls='active';
        } else { statusTxt='READY TO CRAFT'; statusCls='empty'; }
      } else if(bdef.id==='market'){
        var mb=PERSIST.town.buildings.market;
        var mstock=(mb.stock||[]).length+(mb.deals||[]).length+(mb.rare?1:0);
        statusTxt=mstock+' ITEM'+(mstock!==1?'S':'')+' AVAILABLE'; statusCls=mstock>0?'active':'empty';
      } else if(bdef.id==='sanctum'){
        var nc=PERSIST.unlockedChamps.length;
        statusTxt=nc+' CHAMPION'+(nc!==1?'S':''); statusCls='active';
      } else if(bdef.id==='bestiary'){
        var nb=PERSIST.seenEnemies.length;
        statusTxt=nb+' CREATURE'+(nb!==1?'S':'')+' CATALOGUED'; statusCls=nb>0?'active':'empty';
      } else if(bdef.id==='shard_well'){
        var ss=PERSIST.soulShards||0;
        statusTxt=ss+' SOUL SHARD'+(ss!==1?'S':''); statusCls=ss>0?'active':'empty';
      } else if(bdef.id==='vault'){
        var vm=Object.keys(PERSIST.town.materials||{}).filter(function(k){return (PERSIST.town.materials[k]||0)>0;}).length;
        statusTxt=vm+' MATERIAL'+(vm!==1?'S':'')+' STORED'; statusCls=vm>0?'active':'empty';
      } else if(bdef.id==='adventurers_hall'){
        var ba=PERSIST.town.quests&&PERSIST.town.quests.active;
        var ahB=PERSIST.town.buildings.adventurers_hall;
        var readyExp=(ahB.expeditionSlots||[]).filter(function(s){
          return s.champId && s.startTime && Date.now()>=s.startTime+s.totalMs;
        });
        var activeExp=(ahB.expeditionSlots||[]).filter(function(s){return !!s.champId;});
        if(readyExp.length>0){
          statusTxt='✦ '+readyExp.length+' EXPEDITION'+(readyExp.length>1?'S':'')+' READY';
          statusCls='active';
        } else if(ba){
          statusTxt='QUEST ACTIVE'; statusCls='active';
        } else if(activeExp.length>0){
          statusTxt=activeExp.length+' EXPEDITION'+(activeExp.length>1?'S':'')+''; statusCls='active';
        } else { statusTxt='CHECK BOARD'; statusCls='empty'; }
      } else if(bdef.id==='arena'){
        // Round 59: real arena status. Priority cascade mirroring
        // Hall's pattern: claimable winnings first (highest urgency),
        // then daily availability, then active gambling count, then idle.
        var arB = PERSIST.town.buildings.arena;
        var arPending = (arB && arB.pendingGold) || 0;
        var arActiveCount = 0;
        if(arB && Array.isArray(arB.sparringSlots)){
          arActiveCount = arB.sparringSlots.filter(function(s){ return s && typeof s === 'object' && s.champId; }).length;
        }
        var arHasQuest = false;
        if(PERSIST.town.quests && Array.isArray(PERSIST.town.quests.active) && PERSIST.town.quests.active.length){
          var offered = PERSIST.town.quests.offered || [];
          arHasQuest = PERSIST.town.quests.active.some(function(a){
            var q = offered.find(function(o){ return o.id === a.id; });
            return q && q.type === 'arena_fight';
          });
        }
        var dailyOpen = arB && arB.dailyChallenge && !arB.dailyCompleted;
        if(arPending > 0){
          statusTxt = '✦ ' + arPending + 'g TO COLLECT';
          statusCls = 'active';
        } else if(arHasQuest){
          statusTxt = 'QUEST ACTIVE';
          statusCls = 'active';
        } else if(dailyOpen){
          statusTxt = 'DAILY AVAILABLE';
          statusCls = 'active';
        } else if(arActiveCount > 0){
          statusTxt = arActiveCount + ' BETTING';
          statusCls = 'active';
        } else {
          statusTxt = 'OPEN';
          statusCls = 'empty';
        }
      }
    }

    // Build card
    var card=document.createElement('div');
    card.className='building-card'+(unlocked&&statusCls==='active'?' active':'')+(unlocked?'':' locked');

    // All buildings are clickable (locked ones open with lock message)
    card.onclick=function(){ openBuilding(bdef.id); };

    // Sprite area — building icon
    var spriteHtml='<div class="bc-sprite">'
      +'<img src="assets/icons/buildings/'+bdef.buildingIcon+'.png" alt="'+bdef.name+'" onerror="this.textContent=\''+bdef.icon+'\';this.style.fontSize=\'48px\'">'
      +'<span class="bc-lock">🔒</span>'
      +'</div>';

    // Badge placeholder (notification system)
    var badgeHtml='<div class="bc-badge" id="badge-'+bdef.id+'"></div>';

    // Unlock hint for locked buildings
    var hintHtml='';
    if(!unlocked&&cost){
      if(cost.gold){
        hintHtml='<div class="bc-status '+(canAfford?'active':'locked')+'">'+
          (canAfford?'UNLOCK · ✦'+cost.gold+'g':'✦'+cost.gold+'g TO UNLOCK')+'</div>';
      }
    }

    card.innerHTML=badgeHtml+spriteHtml
      +'<div class="bc-body">'
        +'<div class="bc-name">'+bdef.name.toUpperCase()+'</div>'
        +'<div class="bc-desc">'+bdef.desc+'</div>'
        +(unlocked?'<div class="bc-status '+statusCls+'">'+statusTxt+'</div>':hintHtml||'<div class="bc-status locked">'+statusTxt+'</div>')
      +'</div>';
    grid.appendChild(card);
  });
}


function onBuildingDrop(){ /* drag-drop slot UI removed */ }


// ── BESTIARY ──
var _bestiaryTab='creatures';
var _bestiarySelected=null;

function setBestiaryTab(tab){
  _bestiaryTab=tab;
  document.getElementById('btab-creatures').className='bestiary-tab'+(tab==='creatures'?' active':'');
  document.getElementById('btab-locations').className='bestiary-tab'+(tab==='locations'?' active':'');
  document.getElementById('btab-glossary').className='bestiary-tab'+(tab==='glossary'?' active':'');
  document.getElementById('bestiary-creatures-pane').style.display=tab==='creatures'?'flex':'none';
  document.getElementById('bestiary-footer').style.display=tab==='creatures'?'':'none';
  document.getElementById('bestiary-locations-pane').style.display=tab==='locations'?'flex':'none';
  document.getElementById('bestiary-glossary-pane').style.display=tab==='glossary'?'block':'none';
  if(tab==='glossary') buildBestiaryGlossary();
  if(tab==='locations') buildBestiaryLocations();
}

function buildBestiaryGlossary(){
  var grid=document.getElementById('bestiary-glossary-grid');
  if(!grid) return;
  grid.innerHTML='';

  var sections = [
    {title:'Card Identity', sub:'Core stat affiliations', tone:'meta', items:[
      {word:'STR', tone:'str', def:'Strength. Determines maximum HP (STR × 5). Cards with STR affinity focus on shields, healing, and raw damage.'},
      {word:'AGI', tone:'agi', def:'Agility. Determines draw speed. Cards with AGI affinity focus on speed, multi-hit attacks, and evasion.'},
      {word:'WIS', tone:'wis', def:'Wisdom. Determines mana pool (WIS × 5) and regen (~WIS × 0.8 + 2/s). Cards with WIS affinity focus on mana effects and debuffs.'},
    ]},
    {title:'Status · Damage Over Time', sub:'Effects that deal damage each second', tone:'burn', items:[]},
    {title:'Status · Control', sub:'Effects that impair the opponent', tone:'control', items:[]},
    {title:'Defense · Manabound', sub:'Protective effects that use mana', tone:'defense', items:[]},
    {title:'Tempo · Manabound', sub:'Speed and action modifiers', tone:'tempo', items:[]},
    {title:'Conditional Triggers', sub:'Effects that fire when conditions are met', tone:'trigger', items:[]},
    {title:'Card Lifecycle', sub:'How cards move between zones', tone:'lifecycle', items:[]},
    {title:'Meta', sub:'Cross-cutting mechanics', tone:'meta', items:[]},
  ];

  // Categorise keywords
  var catMap = {
    'Burn':'Status · Damage Over Time', 'Poison':'Status · Damage Over Time', 'Bleed':'Status · Damage Over Time',
    'Weaken':'Status · Control', 'Slow':'Status · Control', 'Stun':'Status · Control',
    'Shield':'Defense · Manabound', 'Dodge':'Defense · Manabound', 'Thorns':'Defense · Manabound',
    'Haste':'Tempo · Manabound', 'Frenzy':'Tempo · Manabound',
    'Sorcery':'Conditional Triggers', 'Hellbent':'Conditional Triggers', 'Echo':'Conditional Triggers', 'Crit':'Conditional Triggers',
    'Churn':'Card Lifecycle', 'Ethereal':'Card Lifecycle', 'Conjured':'Card Lifecycle',
    'Manabound':'Meta', 'Debuff':'Meta',
  };

  if(typeof KEYWORDS !== 'undefined'){
    Object.keys(KEYWORDS).forEach(function(word){
      var kw = KEYWORDS[word];
      var cat = catMap[word] || 'Meta';
      var sec = sections.find(function(s){ return s.title === cat; });
      if(sec) sec.items.push({word:word, tone:kw.cls||'meta', def:kw.def||''});
    });
  }

  // Render
  var wrapper = document.createElement('div');
  wrapper.className = 'glossary-columns';

  sections.forEach(function(sec){
    if(sec.items.length === 0) return;
    var card = document.createElement('div');
    card.className = 'glossary-section';

    var html = '<div class="glossary-section-title">'+sec.title+'</div>'
      +'<div class="glossary-section-sub">'+sec.sub+'</div>';

    sec.items.forEach(function(item){
      html+='<div class="glossary-item">'
        +'<div class="glossary-item-border" style="background:var(--kw-'+item.tone+'-border, #3a2818);"></div>'
        +'<div class="glossary-item-body">'
          +'<span class="kw kw-'+item.tone+'" style="font-size:8px;">'+item.word+'</span>'
          +'<div class="glossary-item-def">'+item.def+'</div>'
        +'</div>'
        +'</div>';
    });

    card.innerHTML = html;
    wrapper.appendChild(card);
  });

  grid.appendChild(wrapper);
}

function refreshBestiaryPanel(){
  showLockedBuildingUI('bestiary');
  var b=PERSIST.town.buildings.bestiary;
  if(!b.unlocked) return;

  // Level + XP bar
  var lvl = getBuildingLevel('bestiary');
  var xp = PERSIST.town.buildingXp.bestiary || 0;
  var xpNext = Math.round(100 * Math.pow(1.4, lvl - 1));
  var el1 = document.getElementById('bestiary-level-badge'); if(el1) el1.textContent = 'BESTIARY Lv.' + lvl;
  var el2 = document.getElementById('bestiary-xp-bar'); if(el2) el2.style.width = Math.min(100, Math.round((xp/xpNext)*100)) + '%';
  var el3 = document.getElementById('bestiary-xp-txt'); if(el3) el3.textContent = xp + '/' + xpNext + ' XP';

  // Hoot greeting — once per open cycle (Round 44: refresh fires
  // multiple times during normal browsing, {once} prevents re-greet).
  playNpcGreeting('bestiary', {once:true});

  buildBestiaryCreatures();
  buildBestiaryLocations();
}

function getBestiaryResearch(id){
  // Seen enemies are "fully known" from encounters
  if(PERSIST.seenEnemies.indexOf(id)!==-1) return 100;
  return PERSIST.bestiary.research[id]||0;
}

var _bestiaryAreaFilter = 'all';
var _bestiaryStatusFilter = 'all';

function setBestiaryAreaFilter(areaId){
  _bestiaryAreaFilter = areaId;
  buildBestiaryCreatures();
}

function setBestiaryStatusFilter(status){
  _bestiaryStatusFilter = status;
  buildBestiaryCreatures();
}

function populateBestiaryAreaDropdown(){
  var sel = document.getElementById('bestiary-area-select');
  if(!sel || sel.options.length > 1) return;
  if(typeof AREA_DEFS !== 'undefined'){
    AREA_DEFS.forEach(function(a){
      if(a.id === 'dojo') return;
      var opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = (a.icon||'') + ' ' + a.name;
      sel.appendChild(opt);
    });
  }
}

function getCreatureStatus(id){
  var isSeen = PERSIST.seenEnemies.indexOf(id) !== -1;
  var kills = PERSIST.achievements[id+'_kill'] || 0;
  var isMastered = PERSIST.unlockedChamps.indexOf(id) !== -1;
  var discoveryClaimed = PERSIST.bestiary.entries && PERSIST.bestiary.entries[id] && PERSIST.bestiary.entries[id].discoveryClaimed;
  var m1 = kills >= 10 && !(PERSIST.bestiary.entries && PERSIST.bestiary.entries[id] && PERSIST.bestiary.entries[id].m10);
  var m2 = kills >= 50 && !(PERSIST.bestiary.entries && PERSIST.bestiary.entries[id] && PERSIST.bestiary.entries[id].m50);
  var m3 = kills >= 100 && !(PERSIST.bestiary.entries && PERSIST.bestiary.entries[id] && PERSIST.bestiary.entries[id].m100);
  var hasClaimable = (isSeen && !discoveryClaimed) || m1 || m2 || m3;

  if(!isSeen) return {state:'unseen', claimable:false};
  if(isMastered) return {state:'mastered', claimable:hasClaimable};
  if(hasClaimable) return {state: (isSeen && !discoveryClaimed) ? 'new' : 'milestone', claimable:true};
  return {state:'seen', claimable:false};
}

function getCreatureArea(id){
  if(typeof AREA_DEFS === 'undefined') return null;
  for(var i = 0; i < AREA_DEFS.length; i++){
    if(AREA_DEFS[i].enemyPool && AREA_DEFS[i].enemyPool.indexOf(id) !== -1) return AREA_DEFS[i];
  }
  return null;
}

function buildBestiaryCreatures(){
  var grid = document.getElementById('bestiary-creature-grid');
  if(!grid) return;
  grid.innerHTML = '';

  var searchTerm = (document.getElementById('bestiary-search').value || '').toLowerCase();
  var allIds = Object.keys(CREATURES).filter(function(id){ return id !== 'dojo_tiger'; });

  // Populate area dropdown on first render
  populateBestiaryAreaDropdown();

  var seenCount = 0;
  var totalCount = allIds.length;
  var shownCount = 0;

  allIds.forEach(function(id){
    var e = CREATURES[id];
    var isSeen = PERSIST.seenEnemies.indexOf(id) !== -1;
    var kills = PERSIST.achievements[id+'_kill'] || 0;
    var status = getCreatureStatus(id);
    var area = getCreatureArea(id);

    // Filter: search
    if(searchTerm){
      var name = (e.name||'').toLowerCase();
      var role = (e.role||'').toLowerCase();
      if(name.indexOf(searchTerm) === -1 && role.indexOf(searchTerm) === -1 && id.indexOf(searchTerm) === -1) return;
    }

    // Filter: area
    if(_bestiaryAreaFilter !== 'all'){
      if(!area || area.id !== _bestiaryAreaFilter) return;
    }

    // Filter: status
    if(_bestiaryStatusFilter === 'claimable' && !status.claimable) return;
    if(_bestiaryStatusFilter === 'unseen' && status.state !== 'unseen') return;
    if(_bestiaryStatusFilter === 'mastered' && status.state !== 'mastered') return;

    if(isSeen) seenCount++;

    var card = document.createElement('div');
    var stateCls = status.state === 'new' ? ' bc-new' : status.state === 'milestone' ? ' bc-milestone' : status.state === 'mastered' ? ' bc-mastered' : status.state === 'unseen' ? ' bc-unknown' : ' bc-seen';
    card.className = 'bc-card' + stateCls + (id === _bestiarySelected ? ' bc-selected' : '');

    // Vignette background color from area
    var vigBg = 'radial-gradient(ellipse at center bottom, rgba(60,40,20,.4) 0%, rgba(10,5,1,.8) 100%)';
    if(area && area.color) vigBg = 'radial-gradient(ellipse at center bottom, '+area.color+'33 0%, rgba(10,5,1,.8) 100%)';

    var spriteHtml = isSeen
      ? creatureImgHTML(id, e.icon, '48px')
      : '<span style="font-size:36px;color:#2a1808;font-weight:700;">?</span>';

    // Badges
    var badgeHtml = '';
    if(status.state === 'new') badgeHtml = '<div class="bc-badge-new">✦ NEW</div>';
    else if(status.state === 'milestone' || (status.claimable && status.state !== 'new')) badgeHtml = '<div class="bc-badge-milestone"></div>';
    else if(status.state === 'mastered') badgeHtml = '<div class="bc-badge-mastered">✓</div>';

    // Area flag
    var flagHtml = '';
    if(area && isSeen) flagHtml = '<div class="bc-area-flag" style="color:'+(area.color||'#6a5030')+'">'+(area.icon||'')+'</div>';

    var nameText = isSeen ? e.name : '???';
    var killsText = isSeen ? '⚔ '+kills+' defeated' : '';

    card.innerHTML = badgeHtml + flagHtml
      + '<div class="bc-vignette" style="background:'+vigBg+';">'+spriteHtml+'</div>'
      + '<div class="bc-tile-info">'
      + '<div class="bc-card-name'+(isSeen?'':' hidden')+'">'+nameText+'</div>'
      + (killsText ? '<div class="bc-card-kills">'+killsText+'</div>' : '')
      + '</div>';

    if(isSeen){
      (function(eid){ card.onclick = function(){ selectBestiaryCreature(eid); }; })(id);
    }
    grid.appendChild(card);
    shownCount++;
  });

  // Update entry count
  var entryCount = document.getElementById('bestiary-entry-count');
  if(entryCount) entryCount.textContent = shownCount + ' entries';

  // Update footer
  var footerFill = document.getElementById('bestiary-footer-fill');
  var footerCount = document.getElementById('bestiary-footer-count');
  if(footerFill) footerFill.style.width = (totalCount > 0 ? Math.round(seenCount/totalCount*100) : 0) + '%';
  if(footerCount) footerCount.textContent = seenCount + '/' + totalCount + ' catalogued';

  // Update subtitle
  var sub = document.getElementById('bestiary-sub');
  var claimableCount = allIds.filter(function(id){ return getCreatureStatus(id).claimable; }).length;
  if(sub) sub.textContent = seenCount + ' of ' + totalCount + ' catalogued' + (claimableCount > 0 ? ' · '+claimableCount+' ready to claim' : '');

  renderBestiaryDetail(_bestiarySelected);
}

function selectBestiaryCreature(id){
  _bestiarySelected=id;

  // Mark as viewed — clears the NEW badge
  var isSeen = PERSIST.seenEnemies.indexOf(id) !== -1;
  if(isSeen){
    if(!PERSIST.bestiary.entries) PERSIST.bestiary.entries = {};
    if(!PERSIST.bestiary.entries[id]) PERSIST.bestiary.entries[id] = {};
    if(!PERSIST.bestiary.entries[id].discoveryClaimed){
      PERSIST.bestiary.entries[id].discoveryClaimed = true;
      savePersist();
    }
  }

  buildBestiaryCreatures();
}

// Returns areas where a creature can be encountered
function getCreatureAreas(id){
  var found=[];
  AREA_DEFS.forEach(function(a){
    if(a.enemyPool&&a.enemyPool.indexOf(id)!==-1) found.push(a);
  });
  return found;
}

function renderBestiaryDetail(id){
  var panel=document.getElementById('bc-detail-panel');
  if(!panel) return;

  if(!id){
    panel.innerHTML='<div class="bc-empty-detail">Select a creature<br>to view its record</div>';
    return;
  }
  var e=CREATURES[id]; if(!e){ panel.innerHTML=''; return; }
  var isSeen=PERSIST.seenEnemies.indexOf(id)!==-1;
  var kills=PERSIST.achievements[id+'_kill']||0;
  var isMastered=PERSIST.unlockedChamps.indexOf(id)!==-1;
  var areas=getCreatureAreas(id);
  var bLevel=getBuildingLevel('bestiary');

  if(!isSeen){
    panel.innerHTML='<div style="padding:40px 20px;text-align:center;">'
      +'<div style="margin:0 auto 16px;">'+creatureImgHTML(id, e.icon, '288px', 'bcd-silhouette')+'</div>'
      +'<div class="bcd-name" style="color:#3a2810;">???</div>'
      +'<div class="bcd-section-label" style="text-align:center;margin-top:20px;">UNCATALOGUED</div>'
      +'<div style="font-size:9px;color:#4a3010;font-style:italic;padding:8px 20px;">Encounter this creature in combat to begin cataloguing.</div>'
      +'</div>';
    return;
  }

  var html='';
  var area = areas.length ? areas[0] : null;

  // ── Lv1: Name, sprite, location, kills, lore ──
  html+='<div class="bcd-title-block">';
  if(isMastered) html+='<div class="bcd-unlocked">★ CHAMPION UNLOCKED</div>';
  html+='<div class="bcd-name-centered">'+e.name+'</div>';
  // Role display removed — was prescribing playstyle ("Mana Engine / Hand Burst" etc).
  if(area) html+='<div class="bcd-area-link" onclick="openLocationInBestiary(\''+area.id+'\')">↗ '+(area.icon||'')+' '+area.name+'</div>';
  html+='</div>';

  html+='<div class="bcd-display-case">'
    +'<div class="bcd-case-corners">'
    +creatureImgHTML(id, e.icon, '288px')
    +'</div>'
    +'</div>';

  var killColor=kills>100?'#d4a843':kills>10?'#c09030':'#7a5020';
  html+='<div class="bcd-kill-strip">'
    +'<span class="bcd-kill-num" style="color:'+killColor+';">'+kills+'</span>'
    +'<span class="bcd-kill-label">defeated</span>'
    +'</div>';

  // ── Lv1: Lore (field notes) ──
  if(e.lore){
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-section-label">FIELD NOTES</div>'
      +'<div class="bcd-lore">'+e.lore+'</div>';
  }

  // ── Lv2: Combat stats + growth ──
  if(bLevel>=2){
    var maxHp=calcHp(e.baseStats.str);
    var drawInt=calcDrawInterval(e.baseStats.agi);
    var maxMana=calcMaxMana(e.baseStats.wis);
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-section-label">COMBAT STATS</div>'
      +'<div class="bcd-stat-row">'
        +'<div class="bcd-stat"><div class="bcd-stat-val str">'+e.baseStats.str+'</div><div class="bcd-stat-lbl">STR</div><div class="bcd-stat-sub">'+maxHp+' HP</div></div>'
        +'<div class="bcd-stat"><div class="bcd-stat-val agi">'+e.baseStats.agi+'</div><div class="bcd-stat-lbl">AGI</div><div class="bcd-stat-sub">'+(drawInt/1000).toFixed(1)+'s</div></div>'
        +'<div class="bcd-stat"><div class="bcd-stat-val wis">'+e.baseStats.wis+'</div><div class="bcd-stat-lbl">WIS</div><div class="bcd-stat-sub">'+maxMana+' MP</div></div>'
      +'</div>';
    if(e.growth){
      html+='<div class="bcd-growth">Growth: <span class="str">+'+e.growth.str+'</span> / <span class="agi">+'+e.growth.agi+'</span> / <span class="wis">+'+e.growth.wis+'</span></div>';
    }
  } else {
    html+=_bestiaryLockedSection('COMBAT STATS', 2);
  }

  // ── Lv3: Innate + Cards ──
  if(bLevel>=3){
    if(e.innate){
      html+='<div class="bcd-divider"></div>'
        +'<div class="bcd-section-label">INNATE ABILITY</div>'
        +'<div class="bcd-innate">'
          +'<div class="bcd-innate-name">◆ '+e.innate.name
            +'<span class="bcd-innate-badge">'+(e.innate.active?'ACTIVE':'PASSIVE')+'</span>'
          +'</div>'
          +'<div class="bcd-innate-desc">'+renderKeywords(e.innate.desc||'')+'</div>'
          +(e.innate.active ? '<div class="bcd-innate-meta">Cost: '+e.innate.cost+' · CD: '+(e.innate.cooldown/1000)+'s</div>' : '')
        +'</div>';
    }

    var deckOrder = e.deckOrder || [];
    if(deckOrder.length){
      html+='<div class="bcd-divider"></div>'
        +'<div class="bcd-section-label">DECK · CARDS PLAYED</div>'
        +'<div class="bcd-card-list">';
      deckOrder.forEach(function(cardId){
        var c = CARDS[cardId];
        if(!c) return;
        var effectText = c.effect || '';
        html+='<div class="bcd-card-entry"><span class="bcd-card-name">'+(c.icon||'')+' '+c.name+'</span><span class="bcd-card-effect">'+renderKeywords(effectText.replace(/\\n/g,' · '))+'</span></div>';
      });
      html+='</div>';
    }
  } else {
    html+=_bestiaryLockedSection('INNATE & CARDS', 3);
  }

  // ── Lv4: Challenges ──
  if(bLevel>=4){
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-section-label">CHALLENGES</div>'
      +'<div class="bcd-challenges">';
    var challenges = [
      {label:'Defeat 10 '+e.name, target:10, progress:Math.min(kills,10), reward:'+25g'},
      {label:'Defeat 50 '+e.name, target:50, progress:Math.min(kills,50), reward:'+50g'},
      {label:'Defeat 100 '+e.name, target:100, progress:Math.min(kills,100), reward:'+100g'},
      {label:'???', target:1, progress:0, reward:'???', locked:true},
    ];
    challenges.forEach(function(ch, idx){
      var done = ch.progress >= ch.target;
      var pct = Math.min(100, Math.round(ch.progress/ch.target*100));
      var claimed = PERSIST.bestiary.entries && PERSIST.bestiary.entries[id] && PERSIST.bestiary.entries[id]['m'+(idx===0?10:idx===1?50:idx===2?100:'x')];
      var claimable = done && !claimed && !ch.locked;
      html+='<div class="bcd-challenge'+(done?' done':'')+(claimable?' claimable':'')+(ch.locked?' locked':'')+'">'
        +'<span class="bcd-ch-num">'+(done&&!ch.locked?'✓':(idx+1))+'</span>'
        +'<div class="bcd-ch-info">'
          +'<div class="bcd-ch-label">'+ch.label+'</div>'
          +'<div class="bcd-ch-bar-wrap"><div class="bcd-ch-bar" style="width:'+pct+'%"></div></div>'
        +'</div>'
        +'<div class="bcd-ch-right">'
          +'<span class="bcd-ch-progress">'+ch.progress+'/'+ch.target+'</span>'
          +'<span class="bcd-ch-reward">'+ch.reward+'</span>'
        +'</div>'
        +'</div>';
    });
    html+='</div>';
  } else {
    html+=_bestiaryLockedSection('CHALLENGES', 4);
  }

  panel.innerHTML=html;
}

function _bestiaryLockedSection(label, reqLevel){
  return '<div class="bcd-divider"></div>'
    +'<div class="bcd-locked-section">'
    +'<div class="bcd-section-label" style="opacity:.4;">'+label+'</div>'
    +'<div class="bcd-locked-hint">🔒 Bestiary Lv.'+reqLevel+' required</div>'
    +'</div>';
}


// Diminishing returns on area runs — first 3 count at full value, then slower
function getEffectiveRuns(areaId){
  var raw=PERSIST.areaRuns[areaId]||0;
  if(raw<=3) return raw;
  // Each run beyond 3 adds 0.25 effective runs
  return 3+(raw-3)*0.25;
}

var _locSelected = null;

function buildBestiaryLocations(){
  var pane = document.getElementById('bestiary-locations-pane');
  if(!pane) return;

  if(!document.getElementById('loc-list')){
    pane.innerHTML=
      '<div class="loc-list" id="loc-list"></div>'+
      '<div class="loc-detail" id="loc-detail"><div class="loc-empty">Select a location to view details</div></div>'+
      '<div class="loc-creatures-side" id="loc-creatures-side">'+
        '<div class="loc-cr-side-header">CREATURES</div>'+
        '<div class="loc-cr-side-list" id="loc-cr-side-list"></div>'+
      '</div>';
  }

  _renderLocList();
  if(!_locSelected){
    var first = AREA_DEFS.find(function(a){ return (PERSIST.areaRuns[a.id]||0)>0; });
    if(first) _locSelected = first.id;
  }
  _renderLocPanes(_locSelected);
}

// Render middle detail + right creatures sidebar together. Called whenever
// the active location changes.
function _renderLocPanes(id){
  _renderLocDetail(id);
  _renderLocCreatures(id);
}

function _renderLocList(){
  var list = document.getElementById('loc-list');
  if(!list) return;
  list.innerHTML='';
  AREA_DEFS.forEach(function(area){
    var runs = PERSIST.areaRuns[area.id]||0;
    var item = document.createElement('div');
    if(runs === 0){
      item.className='loc-item loc-unknown';
      item.innerHTML='<span class="loc-item-icon">🌫</span><div><div class="loc-item-name">Unexplored</div></div>';
    } else {
      item.className='loc-item'+(area.id===_locSelected?' active':'');
      item.innerHTML='<span class="loc-item-icon">'+areaImgHTML(area.id,area.icon,'18px')+'</span>'
        +'<div><div class="loc-item-name">'+area.name+'</div>'
        +'<div class="loc-item-lvl">Lv. '+area.levelRange[0]+'–'+area.levelRange[1]+'</div></div>';
      (function(id){ item.onclick=function(){ _locSelected=id; _renderLocList(); _renderLocPanes(id); }; })(area.id);
    }
    list.appendChild(item);
  });
}

function _renderLocDetail(areaId){
  var detail = document.getElementById('loc-detail');
  if(!detail) return;

  if(!areaId){
    detail.innerHTML='<div class="loc-empty">Select a location to view details</div>';
    return;
  }

  var area = AREA_DEFS.find(function(a){ return a.id===areaId; });
  if(!area){ detail.innerHTML=''; return; }

  var rawRuns = PERSIST.areaRuns[areaId]||0;

  if(rawRuns === 0){
    detail.innerHTML=
      '<div class="loc-art-panel" style="background:'+(area.bg||'#1a1208')+';">'
        +'<div class="loc-art-fade-icon">🌫</div>'
        +'<div class="loc-art-title"><span class="loc-art-name">Unexplored</span></div>'
      +'</div>'
      +'<div class="loc-lore-body">'
        +'<div class="loc-lore-text" style="color:#3a2810;font-style:italic;">This area has not been explored. Venture here to reveal its secrets.</div>'
      +'</div>';
    return;
  }

  var loreHtml = area.lore
    ? area.lore.split('\n\n').map(function(p){ return '<p>'+p+'</p>'; }).join('')
    : '<p style="color:#5a4020;">'+area.theme+'</p>';

  var totalKills = (area.enemyPool||[]).reduce(function(s,id){
    return s+(PERSIST.achievements[id+'_kill']||0);
  }, 0);

  var threatHtml = '';
  if(typeof AREA_INTEL !== 'undefined' && typeof THREAT_NOTES !== 'undefined'){
    var effRuns = getEffectiveRuns(areaId);
    if(effRuns>=AREA_INTEL.THREAT_NOTES && THREAT_NOTES[areaId]){
      threatHtml = '<div class="loc-threat"><span class="loc-threat-label">FIELD NOTES</span> '+THREAT_NOTES[areaId]+'</div>';
    }
  }

  var html =
    '<div class="loc-art-panel" id="loc-art-panel-img" style="background:'+(area.bg||'#1a1208')+';">'
      +'<div class="loc-art-fade-icon" id="loc-art-fade-icon">'+areaImgHTML(area.id,area.icon,'80px')+'</div>'
      +'<div class="loc-art-title">'
        +'<span class="loc-art-icon-sm">'+areaImgHTML(area.id,area.icon,'20px')+'</span>'
        +'<span class="loc-art-name">'+area.name+'</span>'
      +'</div>'
      +'<div class="loc-art-lvl">Lv. '+area.levelRange[0]+'–'+area.levelRange[1]+'</div>'
    +'</div>'
    +'<div class="loc-lore-body">'
      +'<div class="loc-lore-text">'+loreHtml+'</div>'
      +threatHtml
      +'<div class="loc-run-record">'
        +'<span class="loc-run-note">'+rawRuns+' run'+(rawRuns!==1?'s':'')+' completed</span>'
        +(totalKills?' · <span class="loc-kill-note">'+totalKills+' creatures defeated</span>':'')
      +'</div>'
    +'</div>';

  // Load background image
  (function(id){
    function applyLocBg(src){
      var panel = document.getElementById('loc-art-panel-img');
      var fadeIcon = document.getElementById('loc-art-fade-icon');
      if(!panel) return;
      panel.style.backgroundImage='url('+src+')';
      panel.style.backgroundSize='cover';
      panel.style.backgroundPosition='center center';
      if(fadeIcon) fadeIcon.style.display='none';
    }
    var src='assets/backgrounds/'+id+'.png';
    var img=new Image();
    img.onload=function(){ applyLocBg(src); };
    img.onerror=function(){
      var def=new Image();
      def.onload=function(){ applyLocBg('assets/backgrounds/default.png'); };
      def.src='assets/backgrounds/default.png';
    };
    img.src=src;
  })(area.id);

  // Creatures grid moved to the right-hand sidebar (.loc-creatures-side);
  // see _renderLocCreatures below.
  detail.innerHTML=html;
}

// Right-hand sidebar of the locations tab — vertical list of creatures
// encountered in the active area. Click → switches to Creatures tab with
// that creature selected (via openCreatureFromLocation).
function _renderLocCreatures(areaId){
  var list = document.getElementById('loc-cr-side-list');
  if(!list) return;

  if(!areaId){
    list.innerHTML = '<div class="loc-cr-side-empty">No location selected.</div>';
    return;
  }

  var area = AREA_DEFS.find(function(a){ return a.id===areaId; });
  if(!area || (PERSIST.areaRuns[areaId]||0)===0){
    list.innerHTML = '<div class="loc-cr-side-empty">Explore this area to reveal its inhabitants.</div>';
    return;
  }

  var pool = (area.enemyPool||[]).filter(function(v,i,a){ return a.indexOf(v)===i; });
  if(!pool.length){
    list.innerHTML = '<div class="loc-cr-side-empty">No creatures recorded here yet.</div>';
    return;
  }

  // Order: seen first, then unseen
  var seenIds = pool.filter(function(id){ return PERSIST.seenEnemies.indexOf(id)!==-1; });
  var unseenIds = pool.filter(function(id){ return PERSIST.seenEnemies.indexOf(id)===-1; });
  var ordered = seenIds.concat(unseenIds);

  var html = '';
  ordered.forEach(function(id){
    var c = CREATURES[id];
    var seen = PERSIST.seenEnemies.indexOf(id)!==-1;
    var kills = PERSIST.achievements[id+'_kill']||0;
    if(seen && c){
      html += '<div class="loc-cr-row" onclick="openCreatureFromLocation(\''+id+'\')">'
        +'<div class="loc-cr-row-sprite">'+creatureImgHTML(id,c.icon,'32px')+'</div>'
        +'<div class="loc-cr-row-info">'
          +'<div class="loc-cr-row-name">'+c.name+'</div>'
          +'<div class="loc-cr-row-meta">'+(kills?kills+' slain':'')+'</div>'
        +'</div>'
        +'<div class="loc-cr-row-arrow">↗</div>'
        +'</div>';
    } else {
      html += '<div class="loc-cr-row loc-cr-row-unknown">'
        +'<div class="loc-cr-row-sprite" style="display:flex;align-items:center;justify-content:center;color:#2a1808;font-size:20px;">?</div>'
        +'<div class="loc-cr-row-info">'
          +'<div class="loc-cr-row-name">???</div>'
          +'<div class="loc-cr-row-meta">uncatalogued</div>'
        +'</div>'
        +'</div>';
    }
  });

  list.innerHTML = html;
}

function openCreatureFromLocation(id){
  // Switch to creatures tab and select this creature
  setBestiaryTab('creatures');
  _bestiarySelected = id;
  buildBestiaryCreatures();
}

// True iff the town-screen is the active screen. Used to gate "open
// building panel" actions: openBuilding only renders the panel overlay
// over the town-screen, so calling it from elsewhere silently sets state
// without showing anything. The qnav popup below routes around that.
function _onTownScreen(){
  var t = document.getElementById('town-screen');
  return !!(t && t.classList.contains('active'));
}

// Generic confirm-then-navigate modal. Used by the bestiary entry points
// when the player clicks a quest chip from a non-town screen — we ask
// before pulling them out of champ/area select. opts:
//   { title, line, confirm, cancel, onConfirm }
function _quickNavConfirm(opts){
  opts = opts || {};
  var existing = document.getElementById('qnav-overlay');
  if(existing && existing.parentNode) existing.parentNode.removeChild(existing);
  var ov = document.createElement('div');
  ov.id = 'qnav-overlay';
  ov.className = 'qnav-overlay';
  var card = document.createElement('div');
  card.className = 'qnav-card';
  card.innerHTML =
      '<div class="qnav-title">'+(opts.title||'CONFIRM')+'</div>'
    + '<div class="qnav-line">'+(opts.line||'')+'</div>'
    + '<div class="qnav-btns">'
    +   '<button class="qnav-btn" id="qnav-cancel">'+(opts.cancel||'STAY')+'</button>'
    +   '<button class="qnav-btn qnav-btn-confirm" id="qnav-confirm">'+(opts.confirm||'GO')+'</button>'
    + '</div>';
  ov.appendChild(card);
  document.body.appendChild(ov);
  function close(go){
    if(ov.parentNode) ov.parentNode.removeChild(ov);
    if(go && typeof opts.onConfirm === 'function') opts.onConfirm();
  }
  document.getElementById('qnav-cancel').onclick = function(){ close(false); };
  document.getElementById('qnav-confirm').onclick = function(){ close(true); };
  ov.onclick = function(e){ if(e.target === ov) close(false); };
}

// Helper: navigate to town, then run `fn` once the town-screen has had
// a moment to mount its DOM. The 200ms gives openTown's screen-switch
// + buildTownGrid pass time to land before we open a building panel.
function _navToTownThen(fn){
  if(typeof navTo === 'function') navTo('town');
  setTimeout(fn, 200);
}

// Entry point used by the area info button and area select screen
function openLocationInBestiary(areaId){
  if(!areaId) return;
  var go = function(){
    _locSelected = areaId;
    openBuilding('bestiary');
    setTimeout(function(){
      setBestiaryTab('locations');
      buildBestiaryLocations();
    }, 80);
  };
  if(_onTownScreen()){ go(); return; }
  var area = (typeof AREA_DEFS !== 'undefined') ? AREA_DEFS.find(function(a){return a.id===areaId;}) : null;
  var name = area ? area.name : areaId;
  _quickNavConfirm({
    title:   'OPEN IN BESTIARY?',
    line:    'View <strong>'+_csqEsc(name)+'</strong> in the Bestiary. This leaves the current screen.',
    confirm: 'GO TO TOWN',
    cancel:  'STAY HERE',
    onConfirm: function(){ _navToTownThen(go); }
  });
}

// Open the Bestiary panel scrolled to a specific creature. Any caller that
// wants "show me what this thing is and where it lives" should route here
// instead of synthesising location lists themselves — the bestiary is the
// canonical source of truth.
function openBestiaryCreature(creatureId){
  if(!creatureId || !CREATURES[creatureId]) return;
  var go = function(){
    openBuilding('bestiary');
    setTimeout(function(){
      setBestiaryTab('creatures');
      if(typeof selectBestiaryCreature === 'function') selectBestiaryCreature(creatureId);
    }, 80);
  };
  if(_onTownScreen()){ go(); return; }
  var name = CREATURES[creatureId].name;
  _quickNavConfirm({
    title:   'OPEN IN BESTIARY?',
    line:    'View <strong>'+_csqEsc(name)+'</strong> in the Bestiary. This leaves the current screen.',
    confirm: 'GO TO TOWN',
    cancel:  'STAY HERE',
    onConfirm: function(){ _navToTownThen(go); }
  });
}

// Open the Bestiary panel on the Glossary tab. If `keyword` is supplied,
// scroll the matching glossary item into view and flash it briefly so
// the link feels "landed" rather than just opening a generic tab.
function openBestiaryGlossary(keyword){
  var go = function(){
    openBuilding('bestiary');
    setTimeout(function(){
      setBestiaryTab('glossary');
      if(keyword) _bestiaryFlashGlossary(keyword);
    }, 100);
  };
  if(_onTownScreen()){ go(); return; }
  var label = keyword ? ('the entry for <strong>'+_csqEsc(keyword)+'</strong>') : 'the Glossary';
  _quickNavConfirm({
    title:   'OPEN GLOSSARY?',
    line:    'View '+label+' in the Bestiary. This leaves the current screen.',
    confirm: 'GO TO TOWN',
    cancel:  'STAY HERE',
    onConfirm: function(){ _navToTownThen(go); }
  });
}

function _bestiaryFlashGlossary(keyword){
  var grid = document.getElementById('bestiary-glossary-grid');
  if(!grid) return;
  var items = grid.querySelectorAll('.glossary-item');
  for(var i=0;i<items.length;i++){
    var label = items[i].querySelector('.glossary-item-word, .glossary-item-label');
    var text  = (label ? label.textContent : items[i].textContent).trim();
    if(text.toLowerCase().indexOf(String(keyword).toLowerCase()) === 0){
      items[i].scrollIntoView({behavior:'smooth', block:'center'});
      items[i].classList.add('glossary-flash');
      (function(el){
        setTimeout(function(){ el.classList.remove('glossary-flash'); }, 1600);
      })(items[i]);
      return;
    }
  }
}

// Open the Champion info panel for a specific champion id. Bypasses the
// combat-lock check that selectChamp does — this is purely the info panel,
// not "set the active champion for combat".
function openChampPanelFor(champId){
  if(!champId || !CREATURES[champId]) return;
  if(typeof selectedChampId !== 'undefined') selectedChampId = champId;
  if(typeof openChampPanel === 'function') openChampPanel();
}


// ── SANCTUM ────────────────────────────────────────────────────────
var _sanctumChamp = null;
var _sanctumTab   = 'overview';

// Round 67p: the per-champion / per-card fragment-cost Sanctum was
// retired in favour of the free-form deck builder (see deck_builder.js
// and Kaine's tutorial). The following constants and helpers used to
// live here and have been removed:
//   SANCTUM_CHAMP_CARD, SANCTUM_COSTS, TIER_ORDER, getFragmentCount,
//   spendFragments, getSanctumCardItem, getSanctumCardCount,
//   spendSanctumCards
// Card Fragments as a currency are gone — there was no spending sink
// left in the live game. The Sanctum collection pool (the random card
// awarded by the spoils overlay) remains, surfaced via the
// deck builder's COLLECTION filter.
function getSanctumCollected(cardId){ return (PERSIST.sanctum.unlockedCards&&PERSIST.sanctum.unlockedCards[cardId])||0; }
function addToSanctumPool(cardId, qty){
  if(!PERSIST.sanctum.unlockedCards) PERSIST.sanctum.unlockedCards={};
  PERSIST.sanctum.unlockedCards[cardId]=(PERSIST.sanctum.unlockedCards[cardId]||0)+(qty||1);
  savePersist();
}

function refreshSanctumPanel(){
  showLockedBuildingUI('sanctum');
  var b=PERSIST.town.buildings.sanctum;
  if(!b||!b.unlocked) return;

  // NPC greeting (once per panel-open cycle — refreshes here are frequent)
  playNpcGreeting('sanctum', {once:true});

  // Level + XP
  var lvl = getBuildingLevel('sanctum');
  var xp = PERSIST.town.buildingXp.sanctum || 0;
  var xpNext = Math.round(100 * Math.pow(1.4, lvl - 1));
  var el1 = document.getElementById('sanctum-level-badge'); if(el1) el1.textContent = 'SANCTUM Lv.' + lvl;
  var el2 = document.getElementById('sanctum-xp-bar'); if(el2) el2.style.width = Math.min(100, Math.round((xp/xpNext)*100)) + '%';
  var el3 = document.getElementById('sanctum-xp-txt'); if(el3) el3.textContent = xp + '/' + xpNext + ' XP';

  // Build roster
  var roster = document.getElementById('sanctum-roster');
  if(roster){
    var champIds = PERSIST.unlockedChamps.filter(function(id){ return !!CREATURES[id] && id !== 'dojo_tiger'; });
    if(!_sanctumChamp || champIds.indexOf(_sanctumChamp)===-1) _sanctumChamp = champIds[0] || 'druid';

    // Sort by mastery % descending (closest to ascending first)
    champIds.sort(function(a,b){
      var cpA = getChampPersist(a), cpB = getChampPersist(b);
      var reqA = getMasteryXpRequired(a), reqB = getMasteryXpRequired(b);
      var pctA = reqA > 0 ? (cpA.masteryXp||0)/reqA : 0;
      var pctB = reqB > 0 ? (cpB.masteryXp||0)/reqB : 0;
      // Champions that can ascend float to top
      var canA = canAscend(a) ? 1 : 0, canB = canAscend(b) ? 1 : 0;
      if(canA !== canB) return canB - canA;
      return pctB - pctA;
    });

    var html = '<div style="padding:8px 10px;border-bottom:1px solid #2a1808;">'
      +'<input type="text" id="sanctum-roster-search" placeholder="Search champions..." '
      +'style="width:100%;box-sizing:border-box;background:#0e0802;border:1px solid #2a1808;color:#c0a060;padding:5px 8px;font-size:9px;border-radius:4px;" '
      +'oninput="_filterSanctumRoster(this.value)">'
      +'</div>'
      +'<div id="sanctum-roster-list">';

    champIds.forEach(function(id){
      var ch = CREATURES[id];
      var cp = getChampPersist(id);
      var sel = id === _sanctumChamp;
      var ascCls = getAscensionClass(id);
      var ascChip = getAscensionChipHTML(id);
      var masteryReq = getMasteryXpRequired(id);
      var masteryPct = masteryReq > 0 ? Math.min(100, Math.round(((cp.masteryXp||0)/masteryReq)*100)) : 100;
      var canAsc = canAscend(id);

      html += '<div class="snc-roster-row'+(sel?' selected':'')+'" data-champid="'+id+'" data-champname="'+ch.name.toLowerCase()+'" onclick="_sanctumChamp=\''+id+'\';refreshSanctumPanel();">'
        +'<div class="snc-roster-portrait '+ascCls+'" style="position:relative;border-radius:6px;">'+creatureImgHTML(id, ch.icon, '32px')+'</div>'
        +'<div class="snc-roster-info">'
          +'<div class="snc-roster-name">'+ch.name+'</div>'
          +'<div class="snc-roster-sub">Lv.'+cp.level+' '+ascChip+'</div>'
          +'<div style="height:3px;background:rgba(0,0,0,.4);margin-top:4px;border-radius:2px;overflow:hidden;">'
            +'<div style="height:100%;width:'+masteryPct+'%;background:'+(canAsc?'#d4a843':'linear-gradient(90deg,#4a3020,#c09030)')+';border-radius:2px;"></div>'
          +'</div>'
        +'</div>'
        +(canAsc?'<div style="font-size:10px;color:#d4a843;flex-shrink:0;" title="Ready to ascend">✦</div>':'')
        +'</div>';
    });

    html += '</div>';
    roster.innerHTML = html;
  }

  setSanctumTab(_sanctumTab, true);
}

function setSanctumTab(tab, skipRefresh){
  _sanctumTab = tab;
  ['overview','relics','deck'].forEach(function(t){
    var btn = document.getElementById('stab-'+t);
    var pane = document.getElementById('sanctum-'+t+'-pane');
    if(btn) btn.className = 'bestiary-tab'+(t===tab?' active':'');
    if(pane) pane.style.display = t===tab ? '' : 'none';
  });
  if(tab==='overview') buildSanctumOverviewPane();
  else if(tab==='relics') buildSanctumRelicsPane();
  else if(tab==='deck') buildSanctumDeckPane();
}

// ── RELICS PANE ────────────────────────────────────────────────────
function buildSanctumRelicsPane(){
  var el = document.getElementById('sanctum-relics-pane');
  if(!el) return;
  var champId = _sanctumChamp; if(!champId) return;
  var cp = getChampPersist(champId);
  var ch = CREATURES[champId];
  var ascLevel = cp.ascensionTier || 0;
  var totalSlots = ascLevel; // 0 at base, +1 per tier
  var equipped = getEquippedRelics(champId);
  var relicInv = PERSIST.town.relics || {};

  var html = '';

  if(totalSlots === 0){
    html += '<div style="padding:40px 20px;text-align:center;background:#1a1208;border:1px dashed #2a1808;border-radius:6px;">'
      +'<div style="font-size:28px;margin-bottom:8px;opacity:.4;">🔒</div>'
      +'<div style="font-size:12px;letter-spacing:3px;color:#5a4020;">NO RELIC SLOTS</div>'
      +'<div style="font-size:9px;color:#4a3010;font-style:italic;margin-top:6px;">Ascend this champion to unlock the first relic slot.</div>'
      +'</div>';
  } else {
    // Equipped slots
    html += '<div style="font-size:10px;letter-spacing:2px;color:#d4a843;margin-bottom:8px;">EQUIPPED · '+equipped.length+' / '+totalSlots+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:16px;">';
    var hasBackpack = !!(PERSIST.town && PERSIST.town.hasBackpack);
    for(var i=0;i<totalSlots;i++){
      var relicId = equipped[i];
      if(relicId && RELICS[relicId]){
        var r = RELICS[relicId];
        var removeLabel = hasBackpack ? 'UNEQUIP' : 'DESTROY';
        var removeColor = hasBackpack ? '#9a7030' : '#d05858';
        // Round 40: removed the inline DESTROY/UNEQUIP button from the
        // grid (was overlapping the relic name on long titles). It's
        // now a small X chip in the top-right corner of the tile —
        // tooltip carries the full label so the action is still
        // discoverable. Tile padding-right grew to leave clear space
        // for the corner button.
        html += '<div class="sr-equipped-tile" style="padding:10px 36px 10px 10px;background:#2a1808;border:1px solid #5a3a1a;border-radius:6px;display:grid;grid-template-columns:56px 1fr;gap:10px;align-items:center;position:relative;">'
          +'<div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:rgba(212,168,67,.08);border:1px solid #5a3a1a;border-radius:4px;">'+relicImgHTML(relicId,'48px')+'</div>'
          +'<div style="min-width:0;">'
          +'<div style="font-size:7px;color:#5a4020;letter-spacing:1px;">SLOT '+(i+1)+'</div>'
          +'<div style="font-size:10px;color:#c0a060;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+r.name+'</div>'
          +'</div>'
          +'<button class="sr-remove-corner" onclick="srClickSlot('+i+')" '
          +'title="'+(hasBackpack?'UNEQUIP · return to inventory':'DESTROY · no refund')+'" '
          +'aria-label="'+removeLabel+'" '
          +'style="color:'+removeColor+';border-color:'+removeColor+';">×</button>'
          +'</div>';
      } else {
        html += '<div style="padding:14px;background:#0e0802;border:1px dashed #3a2818;border-radius:6px;text-align:center;">'
          +'<div style="font-size:14px;color:#3a2818;">+</div>'
          +'<div style="font-size:8px;color:#3a2818;letter-spacing:1px;">SLOT '+(i+1)+'</div>'
          +'<div style="font-size:7px;color:#2a1808;font-style:italic;">empty</div>'
          +'</div>';
      }
    }
    // Locked slots preview
    for(var j=totalSlots;j<7;j++){
      html += '<div style="padding:14px;background:repeating-linear-gradient(45deg,rgba(30,20,10,.3) 0 8px,rgba(0,0,0,.3) 8px 16px);border:1px solid #1e1006;border-radius:6px;text-align:center;opacity:.4;">'
        +'<div style="font-size:12px;">🔒</div>'
        +'<div style="font-size:7px;color:#3a2818;">SLOT '+(j+1)+'</div>'
        +'<div style="font-size:6px;color:#2a1808;">ascend to unlock</div>'
        +'</div>';
    }
    html += '</div>';

    // Inventory
    var ownedIds = Object.keys(relicInv).filter(function(id){ return relicInv[id] > 0 && RELICS[id]; });
    html += '<div style="font-size:10px;letter-spacing:2px;color:#d4a843;margin-bottom:8px;padding-top:12px;border-top:1px solid #2a1808;">INVENTORY · '+ownedIds.length+' unequipped</div>';
    if(!ownedIds.length){
      html += '<div style="font-size:9px;color:#3a2010;font-style:italic;">No relics in inventory. Craft them at the Forge.</div>';
    } else {
      ownedIds.forEach(function(relicId){
        var r = RELICS[relicId];
        var canEquip = equipped.length < totalSlots && equipped.indexOf(relicId) === -1;
        html += '<div style="padding:10px 12px;background:#1a1208;border:1px solid #2a1808;border-left:3px solid #5a3a1a;border-radius:4px;margin-bottom:6px;display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;">'
          +'<div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:rgba(212,168,67,.06);border:1px solid #3a2818;border-radius:4px;">'+relicImgHTML(relicId,'48px')+'</div>'
          +'<div>'
          +'<div style="font-size:11px;color:#c0a060;">'+r.name+'</div>'
          +'<div style="font-size:8px;color:#5a4020;margin-top:2px;">'+r.desc+'</div>'
          +'</div>'
          +(canEquip?'<button class="market-buy-btn" style="padding:6px 14px;font-size:9px;" onclick="srEquipRelic(\''+champId+'\',\''+relicId+'\')">EQUIP</button>':'')
          +'</div>';
      });
    }

    if(hasBackpack){
      html += '<div style="margin-top:12px;padding:8px 12px;background:rgba(127,192,106,.06);border-left:3px solid #7fc06a;font-size:9px;color:#7a9060;font-style:italic;border-radius:4px;">'
        +'<strong style="color:#7fc06a;font-style:normal;letter-spacing:1px;">🎒 BACKPACK ACTIVE ·</strong> Unequipping returns the relic to your inventory.'
        +'</div>';
    } else {
      html += '<div style="margin-top:12px;padding:8px 12px;background:rgba(208,88,88,.06);border-left:3px solid #d05858;font-size:9px;color:#8a6040;font-style:italic;border-radius:4px;">'
        +'<strong style="color:#d05858;font-style:normal;letter-spacing:1px;">WARNING ·</strong> Removing a relic from a slot DESTROYS it. Buy the Adventurer\'s Backpack at the Market to unequip safely.'
        +'</div>';
    }
  }

  el.innerHTML = html;
}
function srEquipRelic(champId, relicId){
  var err = equipRelic(champId, relicId);
  if(err){ showTownToast(err); return; }
  showTownToast('✦ '+RELICS[relicId].name+' equipped!');
  buildSanctumRelicsPane();
}

function srClickSlot(slotIdx){
  var champId = _sanctumChamp;
  var equipped = getEquippedRelics(champId);
  var relicId = equipped[slotIdx];
  if(!relicId) return;
  var relic = RELICS[relicId];
  var hasBackpack = !!(PERSIST.town && PERSIST.town.hasBackpack);
  var name = relic ? relic.name : 'this relic';
  var msg = hasBackpack
    ? 'Unequip '+name+'?\n\nIt will be returned to your town inventory (Adventurer\'s Backpack).'
    : 'Remove '+name+'?\n\nThis will DESTROY it permanently. There is no refund.\n\nTip: buy the Adventurer\'s Backpack at the Market to unequip without destroying.';
  if(!confirm(msg)) return;
  var outcome = unequipRelic(champId, slotIdx);
  if(outcome === 'returned'){
    showTownToast('✦ '+name+' returned to inventory.');
  } else {
    showTownToast(name+' destroyed.');
  }
  buildSanctumRelicsPane();
}

function srClickEmpty(){
  var invEl = document.getElementById('sr-inv-strip');
  if(invEl) invEl.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function srHoverBonus(stat, relicIds){
  relicIds.forEach(function(id){
    var erb = document.getElementById('sr-erb-'+id); if(erb) erb.classList.add('glowing');
    // Find this relic's slot index
    var equipped = getEquippedRelics(_sanctumChamp);
    var si = equipped.indexOf(id);
    if(si!==-1){ var slot=document.getElementById('sr-slot-'+si); if(slot) slot.classList.add('glowing'); }
  });
  var statEl = document.getElementById('sr-stat-'+stat); if(statEl) statEl.classList.add('glowing');
}

function srUnhoverBonus(){
  document.querySelectorAll('.glowing').forEach(function(el){ el.classList.remove('glowing'); });
}


// ── OVERVIEW PANE ──────────────────────────────────────────────────
function buildSanctumOverviewPane(){
  var el=document.getElementById('sanctum-overview-pane');
  if(!el) return;
  var champId=_sanctumChamp; if(!champId) return;
  var ch=getCreaturePlayable(champId);
  var cp=getChampPersist(champId);
  var ascLevel = cp.ascensionTier || 0;
  var ascCls = getAscensionClass(champId);
  var ascChip = getAscensionChipHTML(champId);
  var kills=PERSIST.achievements[champId+'_kill']||0;
  var xpPct=Math.min(100,Math.round((cp.xp/cp.xpNext)*100));

  var html='<div style="display:grid;grid-template-columns:auto 1fr;gap:24px;margin-bottom:20px;">';

  // Portrait with tier treatment
  html+='<div class="'+ascCls+'" style="position:relative;width:180px;height:180px;border:2px solid #3a2818;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:6px;">'
    +creatureImgHTML(champId, ch.icon, '128px', 'flip-x')
    +(ascLevel>0?'<div style="position:absolute;bottom:6px;left:6px;">'+ascChip+'</div>':'')
    +'</div>';

  // Name + stats + level
  html+='<div style="display:flex;flex-direction:column;">'
    +'<div style="font-size:22px;color:#d4a843;letter-spacing:1px;margin-bottom:12px;">'+ch.name+'</div>';

  // Level + XP bar
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">'
    +'<span style="font-size:12px;color:#c09030;padding:3px 8px;border:1px solid #5a3a1a;background:rgba(212,168,67,.06);">LV '+cp.level+'</span>'
    +'<div style="flex:1;height:6px;background:rgba(0,0,0,.4);border:1px solid #2a1808;position:relative;"><div style="position:absolute;inset:0;width:'+xpPct+'%;background:linear-gradient(90deg,#c09030,#d4a843);"></div></div>'
    +'<span style="font-size:9px;color:#5a4020;">'+cp.xp+'/'+cp.xpNext+'</span>'
    +'</div>';

  // Stats
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
  [{l:'STR',v:cp.stats.str,g:ch.growth.str,c:'#e88060'},{l:'AGI',v:cp.stats.agi,g:ch.growth.agi,c:'#9adc7e'},{l:'WIS',v:cp.stats.wis,g:ch.growth.wis,c:'#9ad8e8'}].forEach(function(s){
    html+='<div style="padding:8px 10px;background:#1a1208;border:1px solid #2a1808;border-left:3px solid '+s.c+';">'
      +'<div style="font-size:9px;letter-spacing:2px;color:'+s.c+';">'+s.l+'</div>'
      +'<div style="font-size:20px;color:#e8d7a8;line-height:1;margin-top:2px;">'+s.v+'</div>'
      +'<div style="font-size:8px;color:#5a4020;margin-top:2px;">+'+s.g+'/lv</div>'
      +'</div>';
  });
  html+='</div></div></div>';

  // Mastery + Ascend section
  var nextTier = ascLevel < ASCENSION_TIERS.length ? ASCENSION_TIERS[ascLevel] : null;
  var masteryXp = cp.masteryXp || 0;
  var masteryReq = nextTier ? nextTier.masteryReq : 0;
  var masteryPct = masteryReq > 0 ? Math.min(100, Math.round((masteryXp/masteryReq)*100)) : 100;
  var masteryFull = masteryXp >= masteryReq && nextTier;
  var hasGem = nextTier && PERSIST.gems && (PERSIST.gems[nextTier.gem]||0) >= 1;
  var canAsc = masteryFull && hasGem;

  html+='<div style="padding:16px 18px;background:linear-gradient(180deg,#1a1208,#0e0802);border:2px solid '+(masteryFull?'#d4a843':'#2a1808')+';border-radius:6px;'+(masteryFull?'animation:snc-mastery-pulse 2.4s ease-in-out infinite;':'')+'margin-bottom:16px;">';

  html+='<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">'
    +'<span style="font-size:12px;letter-spacing:3px;color:'+(masteryFull?'#d4a843':'#c0a060')+';">MASTERY</span>';
  if(nextTier){
    var tierColor = ASCENSION_TIERS[ascLevel] ? {'ruby':'#c04040','emerald':'#50b060','sapphire':'#5080d0','turquoise':'#50b0a8','amethyst':'#a060d0','topaz':'#c0a040','black_opal':'#8888c0'}[nextTier.tier] || '#c0a060' : '#c0a060';
    html+='<span style="font-size:10px;color:#5a4020;">NEXT: <span style="color:'+tierColor+';">'+nextTier.tier.toUpperCase().replace('_',' ')+'</span></span>';
  }
  html+='</div>';

  // Mastery bar
  html+='<div style="height:8px;background:rgba(0,0,0,.4);border:1px solid #2a1808;position:relative;margin-bottom:4px;">'
    +'<div style="position:absolute;inset:0;width:'+masteryPct+'%;background:'+(masteryFull?'linear-gradient(90deg,#f0a53a,#d4a843,#f0a53a)':'linear-gradient(90deg,#c09030,#d4a843)')+';'+(masteryFull?'box-shadow:0 0 8px rgba(240,165,58,.5);':'')+'"></div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;font-size:9px;color:#5a4020;">'
    +'<span>'+masteryXp+(nextTier?' / '+masteryReq:'')+'</span>'
    +'<span>'+masteryPct+'%</span>'
    +'</div>'
    +'<div style="font-size:8px;color:#5a4020;margin-top:6px;line-height:1.5;">'
      +'Earned from combat, expedition completion, forge work, and achievement claims.'
    +'</div>';

  if(nextTier){
    html+='<div style="display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin-top:14px;">';
    // Gem requirement
    html+='<div style="padding:8px 12px;background:'+(hasGem?'rgba(127,192,106,.06)':'rgba(208,88,88,.06)')+';border-left:3px solid '+(hasGem?'#7fc06a':'#d05858')+';display:flex;align-items:center;gap:8px;">'
      +'<span style="font-size:18px;color:'+tierColor+';">◆</span>'
      +'<div>'
      +'<div style="font-size:10px;color:#c0a060;">'+nextTier.gem.replace('_',' ')+' Gem</div>'
      +'<div style="font-size:8px;color:'+(hasGem?'#7fc06a':'#d05858')+';margin-top:1px;">'+(hasGem?'✓ IN VAULT':'✗ NOT OWNED')+'</div>'
      +'</div></div>';
    // Ascend button
    html+='<button class="market-buy-btn" style="padding:12px 24px;font-size:12px;letter-spacing:3px;'+(canAsc?'border-color:#d4a843;color:#d4a843;box-shadow:0 0 12px rgba(212,168,67,.3);':'opacity:.4;')+'" '
      +(canAsc?'onclick="doAscensionCeremony(\''+champId+'\')"':'disabled')+'>✦ ASCEND</button>';
    html+='</div>';
  } else {
    html+='<div style="margin-top:14px;text-align:center;font-size:11px;letter-spacing:3px;color:#d4a843;">MAXIMUM ASCENSION</div>';
  }
  html+='</div>';

  // Innate
  if(ch.innate || ch.innateName){
    html+='<div style="padding:10px 14px;background:rgba(80,40,0,.1);border:1px solid #2a1808;border-radius:6px;margin-bottom:12px;">'
      +'<div style="font-size:9px;color:#c09030;margin-bottom:4px;">✦ '+(ch.innateName||ch.innate.name)+'</div>'
      +'<div style="font-size:8px;color:#6a5030;line-height:1.6;">'+renderKeywords(ch.innateDesc||ch.innate.desc||'')+'</div>'
      +'</div>';
  }

  el.innerHTML=html;
}

function doAscensionCeremony(champId){
  if(!canAscend(champId)) return;
  playAscendSfx();

  var cp = getChampPersist(champId);
  var ch = CREATURES[champId];
  var fromLevel = cp.ascensionTier || 0;
  var fromTier = fromLevel > 0 ? ASCENSION_TIERS[fromLevel-1] : {tier:'base', gem:'none', baseBonus:0};
  var toTier = ASCENSION_TIERS[fromLevel];
  var oldStats = {str:cp.stats.str, agi:cp.stats.agi, wis:cp.stats.wis};

  // Do the ascension
  ascendChampion(champId);
  var newCp = getChampPersist(champId);
  var newStats = {str:newCp.stats.str, agi:newCp.stats.agi, wis:newCp.stats.wis};

  var tierColors = {ruby:'#c04040',emerald:'#50b060',sapphire:'#5080d0',turquoise:'#50b0a8',amethyst:'#a060d0',topaz:'#c0a040',black_opal:'#8888c0'};
  var toColor = tierColors[toTier.tier] || '#d4a843';
  var fromColor = tierColors[fromTier.tier] || '#a89373';
  var toLabel = toTier.tier.toUpperCase().replace('_',' ');
  var fromLabel = fromLevel > 0 ? fromTier.tier.toUpperCase().replace('_',' ') : 'BASE';

  // Build the overlay
  var overlay = document.createElement('div');
  overlay.id = 'asc-ceremony';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;overflow:hidden;'
    +'background:radial-gradient(ellipse at 50% 50%,'+toColor+'15 0%,rgba(7,5,10,.97) 60%,rgba(0,0,0,.99) 100%);'
    +'animation:asc-overlay-fade 600ms ease forwards;';

  var center = document.createElement('div');
  center.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;max-width:720px;padding:30px;';

  // Stage 0: Eyebrow
  center.innerHTML = '<div class="asc-eyebrow" id="asc-eyebrow">✦ ASCENSION RITE ✦</div>';

  // Stage portrait area
  center.innerHTML += '<div id="asc-portrait-area" style="position:relative;width:280px;height:280px;display:flex;align-items:center;justify-content:center;">'
    +'<div id="asc-gem" style="font-size:80px;color:'+toColor+';text-shadow:0 0 30px '+toColor+',0 0 60px '+toColor+'55;animation:asc-breathe 2s ease-in-out infinite;z-index:2;">◆</div>'
    +'</div>';

  // Name (hidden initially)
  center.innerHTML += '<div id="asc-name" style="font-size:28px;color:#e8d7a8;text-shadow:0 2px 0 #000;opacity:0;transition:opacity 600ms;">'+ch.name+'</div>';

  // Tier badges (hidden)
  center.innerHTML += '<div id="asc-tiers" style="display:flex;align-items:center;gap:16px;opacity:0;">'
    +'<span style="font-size:12px;letter-spacing:3px;padding:4px 12px;color:'+fromColor+';border:1px solid '+fromColor+'66;background:'+fromColor+'11;opacity:.5;">'+fromLabel+'</span>'
    +'<span style="font-size:16px;color:#d4a843;text-shadow:0 0 6px rgba(212,168,67,.4);">→</span>'
    +'<span id="asc-to-tier" style="font-size:16px;letter-spacing:5px;padding:6px 16px;color:'+toColor+';border:2px solid '+toColor+';background:'+toColor+'22;text-shadow:0 0 10px '+toColor+'88;animation:asc-tier-emerge 700ms cubic-bezier(.2,.8,.3,1) forwards;">'+toLabel+'</span>'
    +'</div>';

  // Stat changes (hidden)
  center.innerHTML += '<div id="asc-stats" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;width:100%;opacity:0;">'
    +_ascStatHTML('STR',oldStats.str,newStats.str,'#e88060',0)
    +_ascStatHTML('AGI',oldStats.agi,newStats.agi,'#9adc7e',150)
    +_ascStatHTML('WIS',oldStats.wis,newStats.wis,'#9ad8e8',300)
    +'</div>';

  // Relic slot callout (hidden)
  center.innerHTML += '<div id="asc-relic-callout" style="padding:12px 20px;background:rgba(10,5,2,.9);border:2px solid '+toColor+';display:flex;align-items:center;gap:12px;opacity:0;box-shadow:0 0 20px '+toColor+'55;">'
    +'<span style="font-size:22px;color:'+toColor+';text-shadow:0 0 10px '+toColor+'88;">◇</span>'
    +'<div>'
    +'<div style="font-size:10px;letter-spacing:3px;color:'+toColor+';">RELIC SLOT UNLOCKED</div>'
    +'<div style="font-size:10px;color:#c8b888;margin-top:2px;">Slot '+(fromLevel+1)+' now available. Equip a relic in the Sanctum.</div>'
    +'</div></div>';

  // Continue button (hidden)
  center.innerHTML += '<button id="asc-continue" style="display:none;padding:12px 36px;font-size:13px;letter-spacing:4px;font-weight:700;color:#d4a843;background:linear-gradient(180deg,#3a2818,#1a1208);border:2px solid #d4a843;cursor:pointer;text-shadow:0 0 6px rgba(212,168,67,.4);box-shadow:0 0 14px rgba(212,168,67,.3);">CONTINUE</button>';

  overlay.appendChild(center);
  document.body.appendChild(overlay);

  // Stage timeline
  // Stage 1 (1s): Add particles
  setTimeout(function(){
    var area = document.getElementById('asc-portrait-area');
    if(!area) return;
    for(var i=0;i<14;i++){
      var p = document.createElement('span');
      p.style.cssText = 'position:absolute;width:6px;height:6px;background:'+toColor+';box-shadow:0 0 12px '+toColor+';border-radius:50%;animation:asc-particle 1.6s ease-in forwards;animation-delay:'+i*0.06+'s;transform:rotate('+i*(360/14)+'deg) translateX(220px);';
      area.appendChild(p);
    }
  }, 1000);

  // Stage 2 (2.4s): Gem shatters + flash
  setTimeout(function(){
    var gem = document.getElementById('asc-gem');
    if(gem) gem.style.animation = 'asc-gem-shatter 600ms ease-out forwards';
    // Flash
    var flash = document.createElement('div');
    flash.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,'+toColor+'cc,'+toColor+'55 30%,transparent 60%);animation:asc-flash 800ms ease-out forwards;pointer-events:none;mix-blend-mode:screen;';
    overlay.appendChild(flash);
  }, 2400);

  // Stage 3 (3s): Reveal portrait + name + tiers
  setTimeout(function(){
    var area = document.getElementById('asc-portrait-area');
    if(area){
      // Remove particles + gem
      area.innerHTML = '<div class="asc-'+toTier.tier+'" style="position:relative;width:280px;height:280px;border:3px solid '+toColor+';display:flex;align-items:center;justify-content:center;overflow:hidden;animation:asc-portrait-rise 800ms cubic-bezier(.2,.8,.3,1) forwards;box-shadow:0 0 40px '+toColor+'88,0 0 80px '+toColor+'44,inset 0 0 30px '+toColor+'22;">'
        +creatureImgHTML(champId, ch.icon, '192px', 'flip-x')
        +'</div>';
      // Add rotating glow
      var glow = document.createElement('div');
      glow.style.cssText = 'position:absolute;inset:-20px;background:conic-gradient(from 0deg,transparent,'+toColor+'66,transparent 50%);animation:asc-glow-rotate 4s linear infinite;pointer-events:none;z-index:0;';
      area.insertBefore(glow, area.firstChild);
    }
    var eyebrow = document.getElementById('asc-eyebrow');
    if(eyebrow){ eyebrow.style.color = toColor; eyebrow.textContent = '✦ TIER ASCENDED ✦'; }
    var name = document.getElementById('asc-name');
    if(name) name.style.opacity = '1';
    var tiers = document.getElementById('asc-tiers');
    if(tiers) tiers.style.opacity = '1';
  }, 3000);

  // Stage 4 (4s): Stats fly in + relic callout
  setTimeout(function(){
    var stats = document.getElementById('asc-stats');
    if(stats) stats.style.opacity = '1';
    var callout = document.getElementById('asc-relic-callout');
    if(callout){ callout.style.opacity = '1'; callout.style.animation = 'asc-callout-pop 500ms ease 600ms backwards'; }
  }, 4000);

  // Stage 5 (5.5s): Continue
  setTimeout(function(){
    var btn = document.getElementById('asc-continue');
    if(btn){
      btn.style.display = 'inline-block';
      btn.style.animation = 'asc-callout-pop 400ms ease forwards';
      btn.onclick = function(){
        overlay.style.transition = 'opacity 400ms';
        overlay.style.opacity = '0';
        setTimeout(function(){ overlay.remove(); refreshSanctumPanel(); }, 400);
      };
    }
  }, 5500);
}

function _ascStatHTML(label, before, after, color, delay){
  var diff = after - before;
  return '<div style="padding:10px 12px;background:rgba(10,5,2,.85);border:1px solid '+color+'44;border-left:3px solid '+color+';animation:asc-stat-fly 500ms cubic-bezier(.2,.8,.3,1) '+delay+'ms backwards;">'
    +'<div style="font-size:10px;letter-spacing:2px;color:'+color+';text-shadow:0 0 4px '+color+'44;">'+label+'</div>'
    +'<div style="display:flex;align-items:baseline;gap:6px;margin-top:2px;">'
    +'<span style="font-size:14px;color:#6a5030;text-decoration:line-through;">'+before+'</span>'
    +'<span style="font-size:11px;color:#6a5030;">→</span>'
    +'<span style="font-size:22px;font-weight:700;color:'+color+';text-shadow:0 0 6px '+color+'44;">'+after+'</span>'
    +'<span style="font-size:11px;color:#7fc06a;margin-left:auto;">+'+diff+'</span>'
    +'</div></div>';
}


function buildSanctumDeckPane(){
  var el=document.getElementById('sanctum-deck-pane');
  if(!el) return;
  var champId=_sanctumChamp;
  if(!champId){ el.innerHTML=''; return; }
  var deck=buildStartDeck(champId);

  // Count cards
  var deckCounts={};
  deck.forEach(function(id){ deckCounts[id]=(deckCounts[id]||0)+1; });
  var uniqueIds=Object.keys(deckCounts);
  var statColors={str:'#e88060',agi:'#9adc7e',wis:'#9ad8e8'};

  var html='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
    +'<span style="font-size:10px;letter-spacing:2px;color:#d4a843;">STARTING DECK · '+deck.length+' CARDS</span>'
    +'</div>';

  // Compact list
  html+='<div style="margin-bottom:16px;">';
  uniqueIds.forEach(function(cardId){
    var cd=CARDS[cardId]; if(!cd) return;
    var copies=deckCounts[cardId];
    var statColor=statColors[cd.stat]||'#c0a060';
    html+='<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-bottom:1px solid #1e1006;">'
      +'<span style="font-size:16px;width:24px;text-align:center;">'+(cd.icon||'◇')+'</span>'
      +'<span style="font-size:10px;color:#c0a060;flex:1;">'+cd.name+'</span>'
      +'<span style="font-size:9px;color:#5a4020;">×'+copies+'</span>'
      +'<span style="font-size:7px;color:'+statColor+';letter-spacing:1px;width:28px;text-align:right;">'+(cd.stat||'').toUpperCase()+'</span>'
      +'</div>';
  });
  html+='</div>';

  // Big edit button
  html+='<div style="text-align:center;">'
    +'<button class="market-buy-btn" onclick="openDeckEditorFromSanctum(\''+champId+'\')" style="padding:12px 32px;font-size:12px;letter-spacing:3px;">EDIT DECK</button>'
    +'</div>';

  el.innerHTML=html;
}

function _filterSanctumRoster(query){
  var q = query.toLowerCase().trim();
  var rows = document.querySelectorAll('#sanctum-roster-list .snc-roster-row');
  rows.forEach(function(row){
    var name = row.getAttribute('data-champname') || '';
    row.style.display = (!q || name.indexOf(q) !== -1) ? '' : 'none';
  });
}

function openDeckEditorFromSanctum(champId){
  // Set return screen before openDeckEditor reads it
  _deReturnScreen = 'sanctum-return';
  // Close sanctum panel overlay (don't change screen)
  var panel = document.getElementById('sanctum-panel-bg');
  if(panel) panel.classList.remove('show');
  // Open editor immediately
  openDeckEditor(champId);
  _deReturnScreen = 'sanctum-return';
}

// Round 67p: ~260 lines of fragment-cost Sanctum UI + action handlers
// removed here. The functions targeted DOM that no longer exists
// (#sanctum-edit-section, #sanctum-upgrades-list, #sanctum-training-list)
// and depended on the SANCTUM_COSTS / spendFragments machinery that
// was also retired. Removed functions:
//   toggleCardEditRow, resetSanctumDeck, buildSanctumUpgradesPane,
//   buildSanctumTrainingPane, sanctumRemoveCard, sanctumAddCard,
//   sanctumSwapIn, sanctumAddCollected, sanctumShowSwapMenu,
//   sanctumUpgradeCard, sanctumBuyLevelFloor
// Card tier upgrades and per-champ level floors were never re-wired to
// any post-fragment system. If those features come back they should be
// rebuilt fresh against the current Sanctum/deck-builder architecture
// rather than restored from this dead chassis.

// ── MARKET (new tabbed system) ──
var _marketTab = 'wares';
var _marketSelected = {wares:null, deals:null, rare:null};

function setMarketTab(tab){
  _marketTab = tab;
  document.getElementById('mtab-wares').className = 'bestiary-tab'+(tab==='wares'?' active':'');
  document.getElementById('mtab-deals').className = 'bestiary-tab'+(tab==='deals'?' active':'');
  document.getElementById('mtab-rare').className = 'bestiary-tab'+(tab==='rare'?' active':'');
  document.getElementById('market-wares-pane').style.display = tab==='wares'?'flex':'none';
  document.getElementById('market-deals-pane').style.display = tab==='deals'?'flex':'none';
  document.getElementById('market-rare-pane').style.display = tab==='rare'?'flex':'none';
  refreshMarketPanel();
}

function refreshMarketPanel(){
  showLockedBuildingUI('market');
  var b = PERSIST.town.buildings.market;
  if(!b.unlocked) return;

  // NPC greeting (once per panel-open cycle)
  playNpcGreeting('market', {once:true});

  // Level + XP bar
  var lvl = getBuildingLevel('market');
  var xp = PERSIST.town.buildingXp.market || 0;
  var xpNext = Math.round(100 * Math.pow(1.4, lvl - 1));
  var el1 = document.getElementById('market-level-badge'); if(el1) el1.textContent = 'MARKET Lv.' + lvl;
  var el2 = document.getElementById('market-xp-bar'); if(el2) el2.style.width = Math.min(100, Math.round((xp/xpNext)*100)) + '%';
  var el3 = document.getElementById('market-xp-txt'); if(el3) el3.textContent = xp + '/' + xpNext + ' XP';

  // Gold display
  var goldEl = document.getElementById('market-gold-display');
  if(goldEl) goldEl.innerHTML = goldImgHTML('14px') + ' ' + PERSIST.gold;

  // Restock timers per tab
  var waresEta = Math.max(0, Math.ceil(3600 - (b.refreshProgress||0)));
  var dealsEta = Math.max(0, Math.ceil(14400 - (b.dealsProgress||0)));
  var rareEta = Math.max(0, Math.ceil(86400 - (b.rareProgress||0)));
  var eta = _marketTab==='deals'?dealsEta:_marketTab==='rare'?rareEta:waresEta;
  var timerEl = document.getElementById('market-restock-timer');
  if(timerEl){
    var h = Math.floor(eta/3600); var m = Math.floor((eta%3600)/60);
    var refreshCost = getMarketRefreshCost();
    timerEl.innerHTML = 'RESTOCK: ' + (h>0?h+'h ':'') + m+'m'
      +' <button class="mkt-refresh-btn" onclick="payMarketRefresh()" title="Pay '+refreshCost+'g to refresh now">↻ '+goldImgHTML('10px')+refreshCost+'</button>';
  }

  ensureMarketStock();

  // Render active tab
  if(_marketTab === 'wares') renderMarketWares();
  else if(_marketTab === 'deals') renderMarketDeals(lvl);
  else if(_marketTab === 'rare') renderMarketRare(lvl);
}

function getMarketStockSlots(){
  var lvl = getBuildingLevel('market');
  return Math.min(7, 3 + Math.floor((lvl-1)/2)); // 3,3,4,4,5,5,6,7
}

// ── WARES STOCK POOL ──
var MARKET_WARES_POOL = [
  // Sewer materials
  {id:'w_slick_stone',  icon:'🪨', label:'Slick Stone ×5',    desc:'Common sewer material',       price:8,   type:'material', matId:'slick_stone',  qty:5},
  {id:'w_rancid_bile',  icon:'🧪', label:'Rancid Bile ×3',    desc:'Uncommon sewer material',     price:18,  type:'material', matId:'rancid_bile',  qty:3},
  // Pale Road materials
  {id:'w_thornwood',    icon:'🌿', label:'Thornwood Resin ×5', desc:'Common forest material',     price:8,   type:'material', matId:'thornwood_resin', qty:5},
  {id:'w_harpy_talon',  icon:'🪶', label:'Harpy Talon ×3',    desc:'Uncommon forest material',    price:18,  type:'material', matId:'harpy_talon', qty:3},
  // Swamp materials
  {id:'w_bog_iron',     icon:'🔩', label:'Bog Iron ×5',       desc:'Common swamp material',       price:10,  type:'material', matId:'bog_iron',     qty:5},
  {id:'w_leech_oil',    icon:'🫙', label:'Leech Oil ×3',      desc:'Uncommon swamp material',     price:20,  type:'material', matId:'leech_oil',   qty:3},
  // Temple materials
  {id:'w_stone_cipher', icon:'🗿', label:'Stone Cipher ×5',   desc:'Common ruins material',       price:12,  type:'material', matId:'stone_cipher', qty:5},
  {id:'w_vault_bronze', icon:'🏺', label:'Vault Bronze ×3',   desc:'Uncommon ruins material',     price:22,  type:'material', matId:'vault_bronze', qty:3},
  // XP Tomes
  {id:'w_tome_min',  icon:'📕', label:'Minor Tome',       desc:'+25 Champion XP',             price:20,  type:'xp_tome',  xp:25},
  {id:'w_tome_std',  icon:'📗', label:'Standard Tome',    desc:'+50 Champion XP',             price:45,  type:'xp_tome',  xp:50},
  // Building Scrolls
  {id:'w_scroll_best', icon:'📜', label:'Bestiary Scroll', desc:'+15 Bestiary XP',            price:15,  type:'building_xp', building:'bestiary', xp:15},
  {id:'w_scroll_hall', icon:'📜', label:'Hall Scroll',     desc:'+15 Hall XP',                price:15,  type:'building_xp', building:'adventurers_hall', xp:15},
  {id:'w_scroll_vault',icon:'📜', label:'Vault Scroll',    desc:'+15 Vault XP',               price:15,  type:'building_xp', building:'vault', xp:15},
  {id:'w_scroll_market',icon:'📜', label:'Market Scroll',  desc:'+15 Market XP',              price:15,  type:'building_xp', building:'market', xp:15},
];

function rollMarketStock(){
  var pool = MARKET_WARES_POOL.slice();
  var slots = getMarketStockSlots();
  var chosen = [], used = {};
  // Guarantee at least 1 XP item
  var xpItems = pool.filter(function(p){ return p.type==='xp_tome'||p.type==='building_xp'; });
  if(xpItems.length){
    var pick = xpItems[Math.floor(Math.random()*xpItems.length)];
    chosen.push({id:pick.id, sold:false});
    used[pick.id] = true;
  }
  // Fill rest
  var attempts = 0;
  while(chosen.length < slots && attempts < 200){
    var pick = pool[Math.floor(Math.random()*pool.length)];
    if(!used[pick.id]){ used[pick.id]=true; chosen.push({id:pick.id, sold:false}); }
    attempts++;
  }
  return chosen;
}

function ensureMarketStock(){
  var b = PERSIST.town.buildings.market;
  if(!b) return;
  if(!b.stock || !b.stock.length) b.stock = rollMarketStock();
  if(!b.deals || !b.deals.length) b.deals = rollMarketDeals();
  if(!b.rare || !b.rare.length) b.rare = rollMarketRare();
}

// ── WARES RENDERING ──
function renderMarketWares(){
  var list = document.getElementById('market-wares-list');
  if(!list) return;
  list.innerHTML = '';
  var b = PERSIST.town.buildings.market;
  (b.stock||[]).forEach(function(s, idx){
    var def = MARKET_WARES_POOL.find(function(p){ return p.id===s.id; });
    if(!def) return;
    var row = document.createElement('div');
    row.className = 'market-row' + (s.sold?' sold':'') + (s.id===_marketSelected.wares?' selected':'');
    row.innerHTML =
      '<div class="market-row-icon">'+def.icon+'</div>'
      +'<div class="market-row-info">'
        +'<div class="market-row-name">'+def.label+'</div>'
        +'<div class="market-row-desc">'+def.desc+'</div>'
      +'</div>'
      +'<div class="market-row-right">'
        +'<div class="market-row-price">'+goldImgHTML('12px')+' '+def.price+'g</div>'
        +(s.sold?'<div class="market-row-badge sold-badge">SOLD</div>':'')
      +'</div>';
    if(!s.sold){
      (function(itemId){ row.onclick = function(){
        _marketSelected.wares = itemId;
        renderMarketWares();
        renderMarketWaresInspector(itemId);
      }; })(s.id);
    }
    list.appendChild(row);
  });
  if(_marketSelected.wares) renderMarketWaresInspector(_marketSelected.wares);
}

function renderMarketWaresInspector(itemId){
  var panel = document.getElementById('market-wares-inspector');
  if(!panel) return;
  var def = MARKET_WARES_POOL.find(function(p){ return p.id===itemId; });
  if(!def){ panel.innerHTML='<div class="market-inspector-empty">Select an item</div>'; return; }
  var b = PERSIST.town.buildings.market;
  var stockItem = (b.stock||[]).find(function(s){ return s.id===itemId; });
  var isSold = stockItem && stockItem.sold;
  var canAfford = PERSIST.gold >= def.price && !isSold;

  var typeLabel = def.type==='material'?'MATERIAL':def.type==='xp_tome'?'XP TOME':def.type==='building_xp'?'BUILDING SCROLL':'ITEM';

  var html = '<div class="market-insp-hero">'
    +'<div class="market-insp-icon">'+def.icon+'</div>'
    +'<div class="market-insp-eyebrow">'+typeLabel+'</div>'
    +'<div class="market-insp-name">'+def.label+'</div>'
    +'</div>';

  html += '<div class="market-insp-desc">'+def.desc+'</div>';

  html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Type</span><span class="market-insp-detail-val">'+typeLabel+'</span></div>';
  if(def.type==='material') html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Owned</span><span class="market-insp-detail-val">'+(PERSIST.town.materials[def.matId]||0)+'</span></div>';
  if(def.type==='xp_tome') html += '<div class="market-insp-detail"><span class="market-insp-detail-label">XP Grant</span><span class="market-insp-detail-val">+'+def.xp+' Champion XP</span></div>';
  if(def.type==='building_xp') html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Building</span><span class="market-insp-detail-val">'+def.building+'</span></div>';

  html += '<div class="market-insp-footer">'
    +'<div class="market-insp-price'+(canAfford?'':' cant-afford')+'">'+goldImgHTML('12px')+' '+def.price+'g</div>'
    +'<button class="market-buy-btn" '+(canAfford?'onclick="buyMarketWare(\''+itemId+'\')"':'disabled')+'>'
      +(isSold?'SOLD OUT':'BUY')
    +'</button>'
    +'</div>';

  panel.innerHTML = html;
}

function buyMarketWare(itemId){
  var b = PERSIST.town.buildings.market;
  var stockItem = (b.stock||[]).find(function(s){ return s.id===itemId; });
  if(!stockItem || stockItem.sold) return;
  var def = MARKET_WARES_POOL.find(function(p){ return p.id===itemId; });
  if(!def || PERSIST.gold < def.price) return;

  PERSIST.gold -= def.price;
  stockItem.sold = true;
  b.totalPurchases = (b.totalPurchases||0) + 1;

  // Apply purchase
  if(def.type === 'material'){
    PERSIST.town.materials[def.matId] = (PERSIST.town.materials[def.matId]||0) + def.qty;
  } else if(def.type === 'xp_tome'){
    // TODO: apply to selected champion — for now just log it
    addLog('Purchased '+def.label+'. Select a champion to apply.', 'sys');
  } else if(def.type === 'building_xp'){
    PERSIST.town.buildingXp[def.building] = (PERSIST.town.buildingXp[def.building]||0) + def.xp;
  }

  savePersist();
  showTownToast(def.label + ' purchased!');
  refreshMarketPanel();
}

// ── DEALS POOL (Lv.3+) ──
var MARKET_DEALS_POOL = [
  {id:'deal_sewer_haul',  icon:'🪨', label:'Sewer Haul',     desc:'5 Slick Stone + 2 Rancid Bile',    price:18, savings:8,  items:[{matId:'slick_stone',qty:5},{matId:'rancid_bile',qty:2}]},
  {id:'deal_road_bundle', icon:'🌿', label:'Road Bundle',    desc:'5 Thornwood Resin + 2 Harpy Talon', price:18, savings:8,  items:[{matId:'thornwood_resin',qty:5},{matId:'harpy_talon',qty:2}]},
  {id:'deal_swamp_bundle',icon:'🔩', label:'Swamp Bundle',   desc:'5 Bog Iron + 2 Leech Oil',         price:20, savings:10, items:[{matId:'bog_iron',qty:5},{matId:'leech_oil',qty:2}]},
  {id:'deal_temple_pack', icon:'🗿', label:'Temple Pack',    desc:'5 Stone Cipher + 2 Vault Bronze',  price:22, savings:12, items:[{matId:'stone_cipher',qty:5},{matId:'vault_bronze',qty:2}]},
  {id:'deal_xp_pack',     icon:'📚', label:'XP Pack',        desc:'Minor Tome + Hall Scroll',         price:30, savings:5,  items:[{type:'xp_tome',xp:25},{type:'building_xp',building:'adventurers_hall',xp:15}]},
  {id:'deal_scholar',     icon:'📖', label:'Scholar Bundle',  desc:'Bestiary Scroll + Vault Scroll',  price:25, savings:5,  items:[{type:'building_xp',building:'bestiary',xp:15},{type:'building_xp',building:'vault',xp:15}]},
  {id:'deal_mixed_common',icon:'🎒', label:'Mixed Commons',  desc:'3 of each common material',        price:30, savings:10, items:[{matId:'slick_stone',qty:3},{matId:'thornwood_resin',qty:3},{matId:'bog_iron',qty:3},{matId:'stone_cipher',qty:3}]},
  {id:'deal_rare_sample', icon:'✨', label:'Rare Sample',    desc:'1 Plague Marrow + 1 Abyssal Coral', price:40, savings:10, items:[{matId:'plague_marrow',qty:1},{matId:'abyssal_coral',qty:1}]},
];

function getMarketDealSlots(){
  var lvl = getBuildingLevel('market');
  return lvl >= 6 ? 3 : 2;
}

function rollMarketDeals(){
  var pool = MARKET_DEALS_POOL.slice();
  var slots = getMarketDealSlots();
  var chosen = [], used = {};
  var attempts = 0;
  while(chosen.length < slots && attempts < 100){
    var pick = pool[Math.floor(Math.random()*pool.length)];
    if(!used[pick.id]){ used[pick.id]=true; chosen.push({id:pick.id, sold:false}); }
    attempts++;
  }
  return chosen;
}

function renderMarketDeals(lvl){
  var list = document.getElementById('market-deals-list');
  var insp = document.getElementById('market-deals-inspector');
  if(!list) return;
  if(lvl < 3){
    list.innerHTML = '<div class="market-locked-tab">🔒 Market Lv.3 required to unlock Deals</div>';
    if(insp) insp.innerHTML = '';
    return;
  }
  list.innerHTML = '';
  var b = PERSIST.town.buildings.market;
  (b.deals||[]).forEach(function(d){
    var def = MARKET_DEALS_POOL.find(function(p){ return p.id===d.id; });
    if(!def) return;
    var row = document.createElement('div');
    row.className = 'market-row' + (d.sold?' sold':'') + (d.id===_marketSelected.deals?' selected':'');
    row.innerHTML =
      '<div class="market-row-icon">'+def.icon+'</div>'
      +'<div class="market-row-info">'
        +'<div class="market-row-name">'+def.label+'</div>'
        +'<div class="market-row-desc">'+def.desc+'</div>'
      +'</div>'
      +'<div class="market-row-right">'
        +'<div class="market-row-price">'+goldImgHTML('12px')+' '+def.price+'g</div>'
        +(d.sold?'<div class="market-row-badge sold-badge">SOLD</div>':'<div class="market-row-badge" style="background:rgba(80,200,120,.1);color:#7fc06a;border:1px solid #3a6030;">SAVE '+def.savings+'g</div>')
      +'</div>';
    if(!d.sold){
      (function(itemId){ row.onclick = function(){
        _marketSelected.deals = itemId;
        renderMarketDeals(lvl);
        renderMarketDealsInspector(itemId);
      }; })(d.id);
    }
    list.appendChild(row);
  });
  if(_marketSelected.deals) renderMarketDealsInspector(_marketSelected.deals);
}

function renderMarketDealsInspector(itemId){
  var panel = document.getElementById('market-deals-inspector');
  if(!panel) return;
  var def = MARKET_DEALS_POOL.find(function(p){ return p.id===itemId; });
  if(!def){ panel.innerHTML='<div class="market-inspector-empty">Select a deal</div>'; return; }
  var b = PERSIST.town.buildings.market;
  var stockItem = (b.deals||[]).find(function(s){ return s.id===itemId; });
  var isSold = stockItem && stockItem.sold;
  var canAfford = PERSIST.gold >= def.price && !isSold;

  var html = '<div class="market-insp-hero">'
    +'<div class="market-insp-icon">'+def.icon+'</div>'
    +'<div class="market-insp-eyebrow">BUNDLE</div>'
    +'<div class="market-insp-name">'+def.label+'</div>'
    +'</div>';

  html += '<div class="market-insp-desc">'+def.desc+'</div>';
  html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Savings</span><span class="market-insp-detail-val" style="color:#7fc06a;">'+def.savings+'g saved</span></div>';

  def.items.forEach(function(item){
    var label = item.matId ? (MATERIALS[item.matId]?MATERIALS[item.matId].name:item.matId)+' ×'+item.qty
      : item.type==='xp_tome' ? 'Champion XP +'+item.xp
      : item.type==='building_xp' ? item.building+' XP +'+item.xp : '???';
    html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Contains</span><span class="market-insp-detail-val">'+label+'</span></div>';
  });

  html += '<div class="market-insp-footer">'
    +'<div class="market-insp-price'+(canAfford?'':' cant-afford')+'">'+goldImgHTML('12px')+' '+def.price+'g</div>'
    +'<button class="market-buy-btn" '+(canAfford?'onclick="buyMarketDeal(\''+itemId+'\')"':'disabled')+'>'
      +(isSold?'SOLD OUT':'BUY')
    +'</button>'
    +'</div>';
  panel.innerHTML = html;
}

function buyMarketDeal(itemId){
  var b = PERSIST.town.buildings.market;
  var stockItem = (b.deals||[]).find(function(s){ return s.id===itemId; });
  if(!stockItem || stockItem.sold) return;
  var def = MARKET_DEALS_POOL.find(function(p){ return p.id===itemId; });
  if(!def || PERSIST.gold < def.price) return;

  PERSIST.gold -= def.price;
  stockItem.sold = true;
  b.totalPurchases = (b.totalPurchases||0) + 1;

  def.items.forEach(function(item){
    if(item.matId){
      PERSIST.town.materials[item.matId] = (PERSIST.town.materials[item.matId]||0) + item.qty;
    } else if(item.type==='xp_tome'){
      addLog('Purchased XP Tome (+'+item.xp+' XP). Select a champion to apply.', 'sys');
    } else if(item.type==='building_xp'){
      PERSIST.town.buildingXp[item.building] = (PERSIST.town.buildingXp[item.building]||0) + item.xp;
    }
  });

  savePersist();
  showTownToast(def.label + ' purchased!');
  refreshMarketPanel();
}

// ── RARE FINDS POOL (Lv.5+) ──
var MARKET_RARE_POOL = [
  // Standard rares (100-300g)
  {id:'rare_shards_5',    icon:'💠', label:'Soul Shards ×5',      desc:'Shards for the Eternal Summons.',           price:150, tier:'standard', type:'shards', qty:5},
  {id:'rare_shards_10',   icon:'💠', label:'Soul Shards ×10',     desc:'A healthy stockpile of shards.',            price:280, tier:'standard', type:'shards', qty:10},
  {id:'rare_tome_greater',icon:'📕', label:'Greater Tome',        desc:'+100 Champion XP. A serious boost.',        price:100, tier:'standard', type:'xp_tome', xp:100},
  {id:'rare_reroll',      icon:'🎲', label:'Reroll Token',        desc:'Reroll quest offerings at the Hall.',       price:80,  tier:'standard', type:'reroll'},
  {id:'rare_build_tome',  icon:'📜', label:'Architect\'s Tome',   desc:'+50 XP to any building.',                   price:120, tier:'standard', type:'building_xp_any', xp:50},
  {id:'rare_mat_bundle',  icon:'🎁', label:'Rare Material Bundle',desc:'3 Plague Marrow + 3 Ancient Bark',  price:200, tier:'standard', type:'material_bundle', items:[{matId:'plague_marrow',qty:3},{matId:'ancient_bark',qty:3}]},
  // Summoning Lures (750-2000g)
  {id:'lure_sewers',      icon:'🪤', label:'Sewer Lure',          desc:'Next summon limited to Sewer creatures.',   price:750,  tier:'aspirational', type:'lure', lureType:'area', lureTarget:'sewers'},
  {id:'lure_swamp',       icon:'🪤', label:'Swamp Lure',          desc:'Next summon limited to Swamp creatures.',   price:750,  tier:'aspirational', type:'lure', lureType:'area', lureTarget:'swamp'},
  {id:'lure_temple',      icon:'🪤', label:'Temple Lure',         desc:'Next summon limited to Temple creatures.',  price:750,  tier:'aspirational', type:'lure', lureType:'area', lureTarget:'temple'},
  {id:'lure_beast',       icon:'🪤', label:'Beast Lure',          desc:'Next summon limited to Beast-type creatures.', price:1000, tier:'aspirational', type:'lure', lureType:'type', lureTarget:'beast'},
  {id:'lure_undead',      icon:'🪤', label:'Undead Lure',         desc:'Next summon limited to Undead creatures.',  price:1000, tier:'aspirational', type:'lure', lureType:'type', lureTarget:'undead'},
  {id:'lure_demon',       icon:'🪤', label:'Demon Lure',          desc:'Next summon limited to Demon creatures.',   price:1000, tier:'aspirational', type:'lure', lureType:'type', lureTarget:'demon'},
];

function getMarketRareSlots(){
  var lvl = getBuildingLevel('market');
  return lvl >= 7 ? 2 : 1;
}

function rollMarketRare(){
  var slots = getMarketRareSlots();
  // Weight: standard items more common, aspirational items rare
  var pool = [];
  MARKET_RARE_POOL.forEach(function(item){
    var weight = item.tier==='aspirational' ? 1 : 4;
    for(var i=0;i<weight;i++) pool.push(item);
  });
  var chosen = [], used = {};
  var attempts = 0;
  while(chosen.length < slots && attempts < 100){
    var pick = pool[Math.floor(Math.random()*pool.length)];
    if(!used[pick.id]){ used[pick.id]=true; chosen.push({id:pick.id, sold:false}); }
    attempts++;
  }
  return chosen;
}

function renderMarketRare(lvl){
  var list = document.getElementById('market-rare-list');
  var insp = document.getElementById('market-rare-inspector');
  if(!list) return;
  if(lvl < 5){
    list.innerHTML = '<div class="market-locked-tab">🔒 Market Lv.5 required to unlock Rare Finds</div>';
    if(insp) insp.innerHTML = '';
    return;
  }
  list.innerHTML = '';
  var b = PERSIST.town.buildings.market;

  // Permanent items (don't rotate)
  var permItems = getAvailablePermanentItems();
  if(permItems.length){
    var permHeader = document.createElement('div');
    permHeader.style.cssText = 'padding:6px 10px;font-size:8px;letter-spacing:2px;color:#c89adc;border-bottom:1px solid #2a1808;';
    permHeader.textContent = 'PERMANENT UPGRADES';
    list.appendChild(permHeader);

    permItems.forEach(function(item){
      var canAfford = PERSIST.gold >= item.price;
      var row = document.createElement('div');
      row.className = 'market-row' + (item.id===_marketSelected.rare?' selected':'');
      row.innerHTML =
        '<div class="market-row-icon" style="background:radial-gradient(circle,rgba(168,123,214,.15) 0%,rgba(10,5,1,.6) 100%);">'+item.icon+'</div>'
        +'<div class="market-row-info">'
          +'<div class="market-row-name" style="color:#c89adc;">'+item.label+'</div>'
          +'<div class="market-row-desc">'+item.desc+'</div>'
        +'</div>'
        +'<div class="market-row-right">'
          +'<div class="market-row-price" style="color:#c89adc;">'+goldImgHTML('12px')+' '+item.price+'g</div>'
          +'<div class="market-row-badge" style="background:rgba(168,123,214,.1);color:#c89adc;border:1px solid #5a3890;">PERMANENT</div>'
        +'</div>';
      (function(itemId){ row.onclick = function(){
        _marketSelected.rare = itemId;
        renderMarketRare(lvl);
        _renderPermanentInspector(itemId);
      }; })(item.id);
      list.appendChild(row);
    });
  }

  // Rotating rares header
  if((b.rare||[]).length){
    var rareHeader = document.createElement('div');
    rareHeader.style.cssText = 'padding:6px 10px;font-size:8px;letter-spacing:2px;color:#d4a843;border-bottom:1px solid #2a1808;margin-top:8px;';
    rareHeader.textContent = 'ROTATING STOCK';
    list.appendChild(rareHeader);
  }

  // Existing rotating rares
  (b.rare||[]).forEach(function(r){
    var def = MARKET_RARE_POOL.find(function(p){ return p.id===r.id; });
    if(!def) return;
    var row = document.createElement('div');
    var isAsp = def.tier==='aspirational';
    row.className = 'market-row' + (r.sold?' sold':'') + (r.id===_marketSelected.rare?' selected':'');
    row.innerHTML =
      '<div class="market-row-icon"'+(isAsp?' style="background:radial-gradient(circle,rgba(168,123,214,.15) 0%,rgba(10,5,1,.6) 100%);"':'')+'>'+def.icon+'</div>'
      +'<div class="market-row-info">'
        +'<div class="market-row-name"'+(isAsp?' style="color:#c89adc;"':'')+'>'+def.label+'</div>'
        +'<div class="market-row-desc">'+def.desc+'</div>'
      +'</div>'
      +'<div class="market-row-right">'
        +'<div class="market-row-price"'+(isAsp?' style="color:#c89adc;"':'')+'>'+goldImgHTML('12px')+' '+def.price+'g</div>'
        +(r.sold?'<div class="market-row-badge sold-badge">SOLD</div>'
          :isAsp?'<div class="market-row-badge" style="background:rgba(168,123,214,.1);color:#c89adc;border:1px solid #5a3890;">'+def.lureType.toUpperCase()+'</div>':'')
      +'</div>';
    if(!r.sold){
      (function(itemId){ row.onclick = function(){
        _marketSelected.rare = itemId;
        renderMarketRare(lvl);
        renderMarketRareInspector(itemId);
      }; })(r.id);
    }
    list.appendChild(row);
  });
  if(_marketSelected.rare) renderMarketRareInspector(_marketSelected.rare);
}

function renderMarketRareInspector(itemId){
  var panel = document.getElementById('market-rare-inspector');
  if(!panel) return;
  var def = MARKET_RARE_POOL.find(function(p){ return p.id===itemId; });
  if(!def){ panel.innerHTML='<div class="market-inspector-empty">Select an item</div>'; return; }
  var b = PERSIST.town.buildings.market;
  var stockItem = (b.rare||[]).find(function(s){ return s.id===itemId; });
  var isSold = stockItem && stockItem.sold;
  var canAfford = PERSIST.gold >= def.price && !isSold;
  var isAsp = def.tier==='aspirational';

  var typeLabel = def.type==='lure'?'SUMMONING LURE':def.type==='shards'?'SOUL SHARDS':def.type==='xp_tome'?'XP TOME':def.type==='reroll'?'TOKEN':'RARE ITEM';

  var html = '<div class="market-insp-hero">'
    +'<div class="market-insp-icon"'+(isAsp?' style="background:radial-gradient(circle,rgba(168,123,214,.2) 0%,rgba(10,5,1,.6) 100%);"':'')+'>'+def.icon+'</div>'
    +'<div class="market-insp-eyebrow"'+(isAsp?' style="color:#c89adc;"':'')+'>'+typeLabel+'</div>'
    +'<div class="market-insp-name"'+(isAsp?' style="color:#c89adc;"':'')+'>'+def.label+'</div>'
    +'</div>';

  html += '<div class="market-insp-desc">'+def.desc+'</div>';
  html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Rarity</span><span class="market-insp-detail-val"'+(isAsp?' style="color:#c89adc;"':'')+'>'+(isAsp?'Aspirational':'Rare')+'</span></div>';

  if(def.type==='lure'){
    html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Lure Type</span><span class="market-insp-detail-val">'+def.lureType+'</span></div>';
    html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Target</span><span class="market-insp-detail-val">'+def.lureTarget+'</span></div>';
    html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Usage</span><span class="market-insp-detail-val">Consumed on next summon</span></div>';
  } else if(def.type==='shards'){
    html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Amount</span><span class="market-insp-detail-val">'+def.qty+' shards</span></div>';
  } else if(def.type==='xp_tome'){
    html += '<div class="market-insp-detail"><span class="market-insp-detail-label">XP Grant</span><span class="market-insp-detail-val">+'+def.xp+' Champion XP</span></div>';
  }

  html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Refresh</span><span class="market-insp-detail-val">Every 24 hours</span></div>';

  html += '<div class="market-insp-footer">'
    +'<div class="market-insp-price'+(canAfford?'':' cant-afford')+'"'+(isAsp?' style="color:#c89adc;"':'')+'>'+goldImgHTML('12px')+' '+def.price+'g</div>'
    +'<button class="market-buy-btn" '+(canAfford?'onclick="buyMarketRare(\''+itemId+'\')"':'disabled')+' '+(isAsp?'style="border-color:#7858a0;color:#c89adc;"':'')+'>'+
      (isSold?'SOLD OUT':'ACQUIRE')
    +'</button>'
    +'</div>';
  panel.innerHTML = html;
}

function _renderPermanentInspector(itemId){
  var panel = document.getElementById('market-rare-inspector');
  if(!panel) return;
  var def = MARKET_PERMANENT_ITEMS.find(function(p){ return p.id===itemId; });
  if(!def){ panel.innerHTML='<div class="market-inspector-empty">Select an item</div>'; return; }
  var canAfford = PERSIST.gold >= def.price;

  var html = '<div class="market-insp-hero">'
    +'<div class="market-insp-icon" style="background:radial-gradient(circle,rgba(168,123,214,.2) 0%,rgba(10,5,1,.6) 100%);">'+def.icon+'</div>'
    +'<div class="market-insp-eyebrow" style="color:#c89adc;">PERMANENT UPGRADE</div>'
    +'<div class="market-insp-name" style="color:#c89adc;">'+def.label+'</div>'
    +'</div>';
  html += '<div class="market-insp-desc">'+def.desc+'</div>';
  html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Type</span><span class="market-insp-detail-val" style="color:#c89adc;">One-time purchase</span></div>';
  html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Effect</span><span class="market-insp-detail-val">Permanent · never expires</span></div>';
  html += '<div class="market-insp-footer">'
    +'<div class="market-insp-price'+(canAfford?'':' cant-afford')+'" style="color:#c89adc;">'+goldImgHTML('14px')+' '+def.price+'g</div>'
    +'<button class="market-buy-btn" '+(canAfford?'onclick="buyPermanentItem(\''+def.id+'\')"':'disabled')+' style="border-color:#7858a0;color:#c89adc;">ACQUIRE</button>'
    +'</div>';
  panel.innerHTML = html;
}

function buyPermanentItem(itemId){
  var def = MARKET_PERMANENT_ITEMS.find(function(p){ return p.id===itemId; });
  if(!def || PERSIST.gold < def.price) return;
  if(!PERSIST.town.permanentPurchases) PERSIST.town.permanentPurchases = {};
  if(PERSIST.town.permanentPurchases[itemId]) return; // already bought

  PERSIST.gold -= def.price;
  PERSIST.town.permanentPurchases[itemId] = true;

  // Apply upgrade effects
  if(def.upgradeKey === 'backpackUnlock'){
    // Backpack allows unequipping relics without destroying
    PERSIST.town.hasBackpack = true;
  } else if(def.upgradeKey === 'extraQuestSlot'){
    PERSIST.town.bonusQuestSlots = (PERSIST.town.bonusQuestSlots||0) + 1;
  }

  savePersist();
  showTownToast(def.label + ' acquired! Permanent upgrade applied.');
  refreshMarketPanel();
}

function buyMarketRare(itemId){
  var b = PERSIST.town.buildings.market;
  var stockItem = (b.rare||[]).find(function(s){ return s.id===itemId; });
  if(!stockItem || stockItem.sold) return;
  var def = MARKET_RARE_POOL.find(function(p){ return p.id===itemId; });
  if(!def || PERSIST.gold < def.price) return;

  PERSIST.gold -= def.price;
  stockItem.sold = true;
  b.totalPurchases = (b.totalPurchases||0) + 1;

  if(def.type === 'shards'){
    PERSIST.soulShards = (PERSIST.soulShards||0) + def.qty;
  } else if(def.type === 'xp_tome'){
    addLog('Purchased '+def.label+'. Select a champion to apply.', 'sys');
  } else if(def.type === 'building_xp_any'){
    addLog('Purchased '+def.label+'. Select a building to apply.', 'sys');
  } else if(def.type === 'material'){
    PERSIST.town.materials[def.matId] = (PERSIST.town.materials[def.matId]||0) + def.qty;
  } else if(def.type === 'material_bundle'){
    (def.items||[]).forEach(function(item){
      if(item.matId) PERSIST.town.materials[item.matId] = (PERSIST.town.materials[item.matId]||0) + item.qty;
    });
  } else if(def.type === 'reroll'){
    addLog('Purchased Reroll Token. Use at the Adventurer\'s Hall.', 'sys');
  } else if(def.type === 'lure'){
    PERSIST.activeLure = {type:def.lureType, target:def.lureTarget};
    addLog('Purchased '+def.label+'. Next summon will be limited.', 'sys');
  }

  savePersist();
  showTownToast(def.label + ' acquired!');
  refreshMarketPanel();
}

// ── MARKET REFRESH SYSTEM ──
// Wares: 1 hour, Deals: 4 hours, Rare: 24 hours
var MARKET_WARES_SECS = 3600;
var MARKET_DEALS_SECS = 14400;
var MARKET_RARE_SECS = 86400;

function getMarketRefreshCost(){
  var base = 50;
  var lvl = getBuildingLevel('market');
  return Math.round(base * Math.pow(0.9, lvl - 1)); // cheaper as market levels
}

function payMarketRefresh(){
  var cost = getMarketRefreshCost();
  if(PERSIST.gold < cost){ showTownToast('Not enough gold!'); return; }
  PERSIST.gold -= cost;
  var b = PERSIST.town.buildings.market;
  if(_marketTab === 'wares'){
    b.refreshProgress = 0;
    b.stock = rollMarketStock();
  } else if(_marketTab === 'deals'){
    b.dealsProgress = 0;
    b.deals = rollMarketDeals();
  } else if(_marketTab === 'rare'){
    b.rareProgress = 0;
    b.rare = rollMarketRare();
  }
  savePersist();
  showTownToast('Stock refreshed!');
  refreshMarketPanel();
}

// ── PERMANENT RARE ITEMS (one-time purchases) ──
var MARKET_PERMANENT_ITEMS = [
  {id:'perm_backpack',   icon:'🎒', label:'Adventurer\'s Backpack', desc:'Allows unequipping relics without destroying them. Permanent upgrade.',
   price:1500, type:'upgrade', upgradeKey:'backpackUnlock'},
  {id:'perm_extra_quest',icon:'📋', label:'Quest Board Expansion',  desc:'Adds +1 max active quest slot. Permanent upgrade.',
   price:1000, type:'upgrade', upgradeKey:'extraQuestSlot'},
];

function getAvailablePermanentItems(){
  var purchased = PERSIST.town.permanentPurchases || {};
  return MARKET_PERMANENT_ITEMS.filter(function(item){
    return !purchased[item.id];
  });
}

function marketTick(seconds){
  var b = PERSIST.town.buildings.market;
  if(!b || !b.unlocked) return;

  b.refreshProgress = (b.refreshProgress||0) + seconds;
  if(b.refreshProgress >= MARKET_WARES_SECS){
    b.refreshProgress = 0;
    b.stock = rollMarketStock();
  }

  b.dealsProgress = (b.dealsProgress||0) + seconds;
  if(b.dealsProgress >= MARKET_DEALS_SECS){
    b.dealsProgress = 0;
    b.deals = rollMarketDeals();
  }

  b.rareProgress = (b.rareProgress||0) + seconds;
  if(b.rareProgress >= MARKET_RARE_SECS){
    b.rareProgress = 0;
    b.rare = rollMarketRare();
  }

  var panel = document.getElementById('market-panel-bg');
  if(panel && panel.classList.contains('show')) refreshMarketPanel();
}

// ─────────────────────────────────────────────────────────
// VAULT XP / LEVEL SYSTEM
// ─────────────────────────────────────────────────────────
var VAULT_XP_THRESHOLDS=[50,150,300,500,750,1050,1400,1800];
var VAULT_LEVEL_UNLOCKS=[
  'Item names, type, and count',
  'Flavour text revealed',
  'Source info · where items are found',
  'Roll counts and key bonus details',
  'Material usage info for the Forge',
  'Cross-references (matching keys/chests)',
  'Lifetime collection history',
  'Recycle interface (convert to shards)',
];

// ── Vault upgrades ──
// Vault material cap per group: starts at 50, raised by shelf upgrades
var VAULT_MAT_BASE_CAP = 50;
function getVaultMatCap(){
  var u=PERSIST.town.vaultUpgrades||{};
  return VAULT_MAT_BASE_CAP + (u.shelf1?25:0) + (u.shelf2?25:0) + (u.shelf3?50:0);
}
var VAULT_UPGRADES=[
  {id:'shelf1',   label:'Iron Shelves',    cost:80,  effect:'Material cap +25 per group',          group:'shelves', requires:null,      minLevel:1},
  {id:'shelf2',   label:'Stone Shelves',   cost:200, effect:'Material cap +25 per group',          group:'shelves', requires:'shelf1',  minLevel:3},
  {id:'shelf3',   label:'Vault Shelves',   cost:500, effect:'Material cap +50 per group',          group:'shelves', requires:'shelf2',  minLevel:5},
  {id:'sellDesk', label:'Sell Desk',       cost:80,  effect:'Sell keys and chests for gold',       group:'other',   requires:null,      minLevel:2},
  {id:'converter',label:'Converter',       cost:200, effect:'Spend 10 common → 1 uncommon of same group', group:'other', requires:null, minLevel:3},
  {id:'recycle',  label:'Recycling Bin',   cost:120, effect:'Break down materials for partial value', group:'other', requires:null,    minLevel:3},
];

// ── Sell prices ──
var SELL_PRICES={
  // Keys
  key_sewers:1, key_sewers_deep:1, key_sewers_foul:2,
  key_bog:2, key_crypt:2, key_forest:2,
  key_cave:3, key_ruins:3, key_dragon:4, key_bone:4, key_astral:5,
  // Chests
  chest_sewers:5, chest_bog:8, chest_crypt:8,
  chest_forest:10, chest_cave:10, chest_ruins:15,
  chest_dragon:15, chest_bone:15, chest_astral:25,
  // Materials by rarity
  slick_stone:1,      rancid_bile:3,    plague_marrow:8,
  bog_iron:1,         leech_oil:3,      abyssal_coral:8,
  bone_dust:1,        grave_iron:3,     cursed_essence:8,
  thornwood_resin:1,  harpy_talon:3,    ancient_bark:8,
  ember_grit:1,       dragonscale:3,    smelt_slag:8,
  stone_cipher:1,     vault_bronze:3,   arcane_residue:8,
  amber_wax:1,        wax_crystal:3,    ancient_amber:8,
  void_splinter:1,    mist_silk:3,      null_stone:8,
};


// ── Bestiary research ──
var BRES={ICON:30, NAME:50, DECK_CARD:70, INNATE:85, FULL:100};
var AREA_INTEL={VISITED:1, PARTIAL_ENEMIES:3, FULL_ENEMIES:5, THREAT_NOTES:10};

var THREAT_NOTES={
  sewers:     'Plague carriers inflict stacking poison. Watch your HP carefully.',
  sewers_deep:'Lurkers hide until struck. The first hit triggers ambush.',
  sewers_foul:'Watchers drain mana. The Amalgam grows more resistant each fight.',
  swamp:      'Bog Wisps ignore armor. Toad King can summon reinforcements.',
  crypt:      'Skeletons have Undying; finish them twice. Witches curse your stats.',
  forest:     'Trolls regenerate if given time. Harpies attack before you can react.',
  cave:       'Harpies swoop for +50% first-strike damage. Golems have Stone Skin.',
  ruins:      'Knights counter on block. Orcs grow stronger when wounded.',
  dragonsnest:'Wyrms apply fire DoT stacks. The Elder Dragon\'s breath is lethal.',
  boneyard:   'The Lich returns from death once. Witches here have Curse Mastery.',
  starmaze:   'Astral Wisps are ethereal; reduced damage. Liches are unpredictable.',
  mistwood:     'Luna Sciurids become lethal below half HP; burst them before the threshold. Orbweavers web-trap you on heavy hits; use light, rapid strikes. Foghasts drain mana on every hit; save your spells.',
  waxdunes:     'Wax Hounds trigger Brittle Shell below 20% HP (a sudden heal and speed burst); finish them fast. The Wax Effigy opens with a random card from your discard pile. The Wax Oasis cannot be killed; maximise damage in 45 seconds for a gold bonus.',
  fungalwarren: 'Spore Puffs release Poison on death; finish fights quickly. Mycelids punish every 3rd card you play. Tunnel Ants survive once at 5 HP; watch for it.',
  sunkenharbour:'Tide Crabs absorb small hits; use burst damage. Drowned Sailors hit slowly but devastatingly; manage your HP. Sirens reduce your draw speed while alive: kill them first. Shark Knights enter Feeding Frenzy below 50% HP; burst them down.',
  charmines:    'Flame Sprites deal Burn on death; plan kills carefully. Ember Golems ignite at 50% HP, gaining speed and Burn on hits. Mine Ghouls ramp damage after 6s; fight fast. Lava Crawlers stack Burn every 5s; keep moving.',
  blackpool:    'The Harbourmaster attacks at half speed but deals triple damage. Survive the first hit, then burst it down before it lands a second blow.',
};

function bestiaryTick(seconds){
  var b=PERSIST.town.buildings.bestiary;
  if(!b||!b.unlocked) return;

  // 1 point per 30 seconds — slow, long-term investment
  PERSIST.bestiary.researchAcc=(PERSIST.bestiary.researchAcc||0)+seconds/30;
  var pts=Math.floor(PERSIST.bestiary.researchAcc);
  if(!pts) return;
  PERSIST.bestiary.researchAcc-=pts;

  var allIds=Object.keys(CREATURES);
  var partial=allIds.filter(function(id){
    return PERSIST.seenEnemies.indexOf(id)===-1&&(PERSIST.bestiary.research[id]||0)<100;
  });
  if(!partial.length) return;

  for(var i=0;i<pts;i++){
    var pick=partial[Math.floor(Math.random()*partial.length)];
    PERSIST.bestiary.research[pick]=(PERSIST.bestiary.research[pick]||0)+1;
    if(PERSIST.bestiary.research[pick]>=100){
      PERSIST.bestiary.research[pick]=100;
      partial=partial.filter(function(x){return x!==pick;});
      if(!partial.length) break;
    }
  }
}


function vaultTick(seconds){
  var b=PERSIST.town.buildings.vault;
  if(!b||!b.unlocked) return;

  // ── XP gain for levelling ──
  // Round 47: level-up wrapped in while-loop so a 12h offline catch-up
  // tick that lands enough XP for multiple thresholds resolves them all
  // (previously the single `if` would consume only one level's worth
  // and discard the rest). Bounded by VAULT_XP_THRESHOLDS length — at
  // max vault level, XP gain halts entirely.
  var lv=PERSIST.town.vaultLevel||1;
  if(lv<VAULT_XP_THRESHOLDS.length+1){
    var xpGain=seconds/10;
    PERSIST.town.vaultXp=(PERSIST.town.vaultXp||0)+xpGain;
    PERSIST.town.vaultXpTotal=(PERSIST.town.vaultXpTotal||0)+xpGain;
    var thresh=VAULT_XP_THRESHOLDS[lv-1]||9999;
    while(PERSIST.town.vaultXp>=thresh && lv<VAULT_XP_THRESHOLDS.length+1){
      PERSIST.town.vaultXp-=thresh;
      PERSIST.town.vaultLevel=lv+1;
      var unlockMsg=VAULT_LEVEL_UNLOCKS[lv]||'';
      showTownToast('✦ Vault reached Lv.'+(lv+1)+'!'+(unlockMsg?' '+unlockMsg:''));
      lv=PERSIST.town.vaultLevel;
      thresh=VAULT_XP_THRESHOLDS[lv-1]||9999;
    }
  }
}

// ─────────────────────────────────────────────────────────
// FORGE
// ─────────────────────────────────────────────────────────
// Queue model: PERSIST.town.buildings.forge.queue is a flat array of
// in-progress jobs {relicId, startTime, totalMs}. Slots are PARALLEL
// (each job advances independently — not FIFO). Number of unlocked
// slots is derived from Forge level via getForgeSlotCount().
//
// Completion is NOT auto-claimed: a finished job sits "ready" until
// the player clicks COLLECT (matches the design's slot-pulse → click).

var FORGE_MAX_SLOTS = 3;            // hard cap (Lv.5 unlocks the third)
function getForgeSlotCount(){
  var lv = getBuildingLevel('forge');
  if(lv >= 5) return 3;
  if(lv >= 3) return 2;
  return 1;
}

// (Round 45: legacy FORGE_NPC_LINES removed. M'bur's dialogue lives
//  in the unified NPC system — see NPC_RANDOM_LINES.forge,
//  NPC_RARE_LINES.forge, NPC_VERY_RARE_LINES.forge, and
//  NPC_CONDITIONS.forge above. _forgePickNpcLine helper also
//  deleted; refreshForgePanel now calls playNpcGreeting('forge',
//  {once:true}) like every other building.)

// Forge tick — runs every 5s from the unified idle interval.
// Doesn't auto-collect: jobs that hit zero just stay in the queue with
// a "ready" state, surfaced by the COLLECT button in the queue strip.
// Refreshes the panel if it's open so the ready state appears live.
function forgeTick(){
  var b=PERSIST.town.buildings.forge;
  if(!b||!b.unlocked) return;
  var fp=document.getElementById('forge-panel-bg');
  if(fp&&fp.classList.contains('show')) refreshForgePanel();
}

// ── Forge state helpers ──────────────────────────────────────────────
var _forgeSelectedRecipe = null;     // currently inspected recipe id
// (Round 45: _forgeNpcLineIdx, _forgeNpcLastChange, _forgePickNpcLine
//  all deleted — replaced by playNpcGreeting('forge', {once:true}) in
//  refreshForgePanel.)

// Material-affordability check for a recipe.
function _forgeCanAfford(relicId){
  var recipe = (typeof RELIC_RECIPES !== 'undefined') ? RELIC_RECIPES[relicId] : null;
  if(!recipe || !recipe.mats) return false;
  var inv = (PERSIST.town && PERSIST.town.materials) || {};
  var keys = Object.keys(recipe.mats);
  for(var i=0;i<keys.length;i++){
    if((inv[keys[i]]||0) < recipe.mats[keys[i]]) return false;
  }
  return true;
}

// Tier color used in headers, badges, glows.
var FORGE_TIER_COLOR = { base:'#a89373', ruby:'#c04040', emerald:'#50b060', sapphire:'#5080d0' };
var FORGE_TIER_LABEL = { base:'BASE', ruby:'RUBY', emerald:'EMERALD', sapphire:'SAPPHIRE' };

// Format ms → "Xh Ym" / "Ym Ss" / "Ss".
function _forgeTimeFmt(ms){
  var s = Math.max(0, Math.round(ms/1000));
  var h = Math.floor(s/3600);
  var m = Math.floor((s%3600)/60);
  var sec = s%60;
  if(h>0) return h+'h '+m+'m';
  if(m>0) return m+'m '+sec+'s';
  return sec+'s';
}

function _forgeDefaultRecipeId(){
  // Pick the first recipe by tier order (base → ruby → emerald → sapphire).
  // Round 67p: only consider UNLOCKED recipes — locked recipes don't
  // surface in the forge list at all, so the default selection should
  // also skip them.
  if(typeof RELIC_RECIPES === 'undefined') return null;
  var ids = Object.keys(RELIC_RECIPES).filter(function(id){
    return (typeof isRecipeUnlocked !== 'function') || isRecipeUnlocked(id);
  });
  var tierOrder = {base:1, ruby:2, emerald:3, sapphire:4};
  ids.sort(function(a,b){
    var ra=RELIC_RECIPES[a], rb=RELIC_RECIPES[b];
    var oa=tierOrder[ra.tier]||9, ob=tierOrder[rb.tier]||9;
    if(oa!==ob) return oa-ob;
    return a.localeCompare(b);
  });
  return ids[0] || null;
}

// ── Forge: master render ─────────────────────────────────────────────
function refreshForgePanel(){
  showLockedBuildingUI('forge');
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.unlocked) return;

  // Default selection on first open
  if(!_forgeSelectedRecipe || !RELIC_RECIPES[_forgeSelectedRecipe]){
    _forgeSelectedRecipe = _forgeDefaultRecipeId();
  }

  // NPC dialogue + level/XP bar.
  // Round 45: migrated to the unified playNpcGreeting pipeline so M'bur
  // greets ONCE on open (with typewriter SFX) and doesn't auto-cycle
  // mid-menu like the old _forgePickNpcLine did. Same close-and-reopen
  // for a fresh line, never repeating the immediately previous one.
  if(typeof playNpcGreeting === 'function') playNpcGreeting('forge', {once:true});
  var lvl = getBuildingLevel('forge');
  var xp = (PERSIST.town.buildingXp && PERSIST.town.buildingXp.forge) || 0;
  var xpNext = getBuildingXpToNext(lvl);
  var lb = document.getElementById('forge-level-badge'); if(lb) lb.textContent = 'FORGE Lv.'+lvl;
  var bar = document.getElementById('forge-xp-bar'); if(bar) bar.style.width = Math.min(100, Math.round((xp/xpNext)*100))+'%';
  var txt = document.getElementById('forge-xp-txt'); if(txt) txt.textContent = xp+'/'+xpNext+' XP';

  _forgeRenderQueue();
  _forgeRenderRecipeList();
  _forgeRenderInspector();
}

// ── Forge: queue strip (above body) ──────────────────────────────────
function _forgeRenderQueue(){
  var listEl = document.getElementById('forge-queue-list');
  if(!listEl) return;
  var b = PERSIST.town.buildings.forge;
  var queue = (b && b.queue) || [];
  var slotCount = getForgeSlotCount();
  var html = '';
  for(var i=0; i<FORGE_MAX_SLOTS; i++){
    if(i >= slotCount){
      // Locked slot — placeholder explaining the unlock level
      var unlockLv = (i===1)?3:5;
      html += '<div class="forge-slot forge-slot-locked">'
        + '<div class="forge-slot-lock-icon">🔒</div>'
        + '<div class="forge-slot-lock-label">SLOT LOCKED</div>'
        + '<div class="forge-slot-lock-hint">unlocks at Forge Lv.'+unlockLv+'</div>'
        + '</div>';
      continue;
    }
    var job = queue[i] || null;
    if(!job){
      // Empty slot — clickable to drop the currently-selected recipe in
      var sel = _forgeSelectedRecipe;
      var canStart = sel && _forgeCanAfford(sel);
      var hint = sel
        ? (canStart ? 'click to start: ' + (RELICS[sel]?RELICS[sel].name:sel) : 'select a recipe with enough materials')
        : 'select a recipe to forge';
      html += '<div class="forge-slot forge-slot-empty'+(canStart?' forge-slot-ready-empty':'')+'" '
        + (canStart?'onclick="startForgeCraft(\''+sel+'\')"':'')+'>'
        + '<div class="forge-slot-plus">+</div>'
        + '<div class="forge-slot-empty-label">OPEN SLOT</div>'
        + '<div class="forge-slot-empty-hint">'+hint+'</div>'
        + '</div>';
      continue;
    }
    // Active slot
    _forgeMigrateJob(job);
    var relic = RELICS[job.relicId];
    var tColor = FORGE_TIER_COLOR[(relic&&relic.tier)||'base'] || '#a89373';
    var elapsed = Date.now() - job.startTime;
    var pct = Math.min(100, Math.max(0, (elapsed/job.totalMs)*100));
    var ready = elapsed >= job.totalMs;
    var remaining = Math.max(0, job.totalMs - elapsed);

    // Champion strip — between info and actions. Assigned champion shows
    // as portrait + bonus chip; empty shows as faded "ASSIGN +" button.
    var champHtml;
    if(job.champId && CREATURES[job.champId]){
      var bonusPct = Math.round((job.champBonus||0) * 100);
      var champName = CREATURES[job.champId].name;
      champHtml =
        '<div class="forge-slot-champ assigned" title="'+champName+' is helping (−'+bonusPct+'% time). Click to release." onclick="releaseChampFromForge('+i+')">'
        + '<div class="forge-slot-champ-portrait">'+creatureImgHTML(job.champId, CREATURES[job.champId].icon, '32px')+'</div>'
        + '<div class="forge-slot-champ-info">'
          + '<div class="forge-slot-champ-name">'+champName+'</div>'
          + '<div class="forge-slot-champ-bonus">−'+bonusPct+'%</div>'
        + '</div>'
        + '<div class="forge-slot-champ-x" title="Release">×</div>'
        + '</div>';
    } else if(!ready){
      champHtml =
        '<div class="forge-slot-champ empty" title="Assign a champion to speed up this craft (STR primary)" onclick="_forgePickChampForSlot('+i+')">'
        + '<div class="forge-slot-champ-plus">+</div>'
        + '<div class="forge-slot-champ-info">'
          + '<div class="forge-slot-champ-name">ASSIGN CHAMPION</div>'
          + '<div class="forge-slot-champ-bonus" style="color:#7a6030;">STR speeds the craft</div>'
        + '</div>'
        + '</div>';
    } else {
      champHtml = ''; // no champ slot when ready — collect button takes the space
    }

    html += '<div class="forge-slot forge-slot-active'+(ready?' forge-slot-ready':'')+(job.champId?' has-champ':'')+'" '
      + 'style="border-color:'+tColor+'88;">'
      + '<div class="forge-slot-icon" style="border-color:'+tColor+';background:radial-gradient(circle at 50% 60%,'+tColor+'55,transparent 70%);'+(ready?'':'animation:frgEmberPulse 2.2s ease-in-out infinite;')+'">'+(relic?relicImgHTML(job.relicId,'48px'):'⚗')+'</div>'
      + '<div class="forge-slot-info">'
        + '<div class="forge-slot-name">'+(relic?relic.name:job.relicId)+'</div>'
        + '<div class="forge-slot-bar"><div class="forge-slot-bar-fill'+(ready?' ready':'')+'" style="width:'+pct+'%;"></div></div>'
        + '<div class="forge-slot-status">'
          + '<span>'+(ready?'READY':_forgeTimeFmt(remaining)+' REMAINING')+'</span>'
          + '<span class="forge-slot-pct">'+Math.round(pct)+'%</span>'
        + '</div>'
        + champHtml
      + '</div>'
      + '<div class="forge-slot-actions">'
        + (ready
            ? '<button class="forge-collect-btn" onclick="collectForgeCraft('+i+')">COLLECT</button>'
            : '<button class="forge-cancel-btn" onclick="cancelForgeCraft('+i+')" title="Cancel · materials are NOT refunded">✕</button>')
      + '</div>'
      + '</div>';
  }
  listEl.innerHTML = html;
}

// ── Forge: recipe list (left column) ─────────────────────────────────
function _forgeRenderRecipeList(){
  var listEl = document.getElementById('forge-recipe-list');
  if(!listEl) return;
  if(typeof RELIC_RECIPES === 'undefined'){ listEl.innerHTML=''; return; }

  // Group by tier
  // Round 67p: filter out recipes that haven't been unlocked yet via
  // story quests. PERSIST.unlockedRelicRecipes is the source of truth;
  // isRecipeUnlocked() guards the check. New saves start with only
  // safety_net visible; future quest completions add entries.
  var groups = ['base','ruby','emerald','sapphire'];
  var byTier = {};
  groups.forEach(function(t){ byTier[t] = []; });
  Object.keys(RELIC_RECIPES).forEach(function(id){
    if(typeof isRecipeUnlocked === 'function' && !isRecipeUnlocked(id)) return;
    var r = RELIC_RECIPES[id];
    var tier = (r && r.tier) || 'base';
    if(!byTier[tier]) byTier[tier] = [];
    byTier[tier].push(id);
  });

  var html = '';
  groups.forEach(function(tier){
    var ids = byTier[tier]; if(!ids || !ids.length) return;
    var color = FORGE_TIER_COLOR[tier] || '#a89373';
    var label = FORGE_TIER_LABEL[tier] || tier.toUpperCase();
    var craftMs = (RELIC_CRAFT_TIMES && RELIC_CRAFT_TIMES[tier]) ? RELIC_CRAFT_TIMES[tier]*1000 : 0;
    var sub = craftMs ? _forgeTimeFmt(craftMs)+' craft' : '';

    html += '<div class="forge-tier-header" style="background:linear-gradient(90deg,'+color+'22,transparent 60%);">'
      + '<div class="forge-tier-left">'
        + '<span class="forge-tier-dot" style="background:'+color+';box-shadow:0 0 8px '+color+'88;"></span>'
        + '<span class="forge-tier-label" style="color:'+color+';">'+label+'</span>'
        + (sub?'<span class="forge-tier-sub">· '+sub+'</span>':'')
      + '</div>'
      + '<span class="forge-tier-count">'+ids.length+(ids.length===1?' RECIPE':' RECIPES')+'</span>'
      + '</div>';

    ids.forEach(function(id){
      var recipe = RELIC_RECIPES[id];
      var relic = RELICS[id];
      if(!recipe || !relic) return;
      var can = _forgeCanAfford(id);
      var selected = (_forgeSelectedRecipe === id);
      // Round 39: dropped the .forge-mat-chips inline materials list and
      // the "MATERIALS LOW" hint — both lived on the recipe row. Recipes
      // can have many materials and the row got busy. The right-hand
      // inspector still shows the full materials list when a recipe
      // is selected. The row's visual state (default tint vs dim
      // .insufficient) communicates craftability without explicit text.
      html += '<div class="forge-recipe-row'+(selected?' selected':'')+(can?'':' insufficient')+'" '
        + 'onclick="_forgeSelectRecipe(\''+id+'\')" '
        + 'style="--tier:'+color+';">'
        + (selected?'<div class="forge-recipe-stripe" style="background:'+color+';box-shadow:0 0 8px '+color+';"></div>':'')
        + '<div class="forge-recipe-icon" style="border-color:'+color+'88;background:radial-gradient(circle at 50% 60%,'+color+'44,transparent 70%);">'+relicImgHTML(id,'48px')+'</div>'
        + '<div class="forge-recipe-body">'
          + '<div class="forge-recipe-row-title">'
            + '<span class="forge-recipe-name">'+relic.name+'</span>'
            + '<span class="forge-recipe-tier" style="color:'+color+';border-color:'+color+'88;background:'+color+'11;">'+label+'</span>'
          + '</div>'
        + '</div>'
        + '<div class="forge-recipe-time">'
          + '<div class="forge-recipe-time-label">CRAFT TIME</div>'
          + '<div class="forge-recipe-time-val">'+_forgeTimeFmt((RELIC_CRAFT_TIMES[recipe.tier]||0)*1000)+'</div>'
        + '</div>'
        + '</div>';
    });
  });

  listEl.innerHTML = html;
}

function _forgeMatChipsHTML(mats){
  if(!mats) return '';
  var inv = (PERSIST.town && PERSIST.town.materials) || {};
  var html = '';
  Object.keys(mats).forEach(function(k){
    var need = mats[k];
    var have = inv[k] || 0;
    var enough = have >= need;
    var def = (typeof MATERIALS !== 'undefined' && MATERIALS[k]) || null;
    var name = def ? def.name : k;
    var icon = def ? def.icon : '◆';
    html += '<span class="forge-mat-chip'+(enough?' ok':' low')+'">'
      + '<span class="forge-mat-chip-icon">'+icon+'</span>'
      + '<span class="forge-mat-chip-name">'+name+'</span>'
      + '<span class="forge-mat-chip-count">'+have+'/'+need+'</span>'
      + '</span>';
  });
  return html;
}

// ── Forge: inspector (right column) ──────────────────────────────────
function _forgeRenderInspector(){
  var insp = document.getElementById('forge-inspector');
  if(!insp) return;
  var id = _forgeSelectedRecipe;
  var recipe = id ? RELIC_RECIPES[id] : null;
  var relic = id ? RELICS[id] : null;
  if(!recipe || !relic){
    insp.innerHTML = '<div class="forge-inspector-empty">Select a recipe to see its effect, materials, and craft time.</div>';
    return;
  }
  var color = FORGE_TIER_COLOR[recipe.tier] || '#a89373';
  var label = FORGE_TIER_LABEL[recipe.tier] || (recipe.tier||'').toUpperCase();
  var can = _forgeCanAfford(id);
  // Is this recipe currently being crafted?
  var b = PERSIST.town.buildings.forge;
  var queue = (b && b.queue) || [];
  var activeSlot = -1;
  for(var i=0;i<queue.length;i++){
    if(queue[i] && queue[i].relicId === id){ activeSlot = i; break; }
  }

  var inv = (PERSIST.town && PERSIST.town.materials) || {};
  var matRows = '';
  Object.keys(recipe.mats).forEach(function(k){
    var need = recipe.mats[k];
    var have = inv[k] || 0;
    var enough = have >= need;
    var def = (typeof MATERIALS !== 'undefined' && MATERIALS[k]) || null;
    matRows += '<div class="forge-insp-mat'+(enough?' ok':' low')+'">'
      + '<span class="forge-insp-mat-icon">'+(def?def.icon:'◆')+'</span>'
      + '<span class="forge-insp-mat-name">'+(def?def.name:k)+'</span>'
      + '<span class="forge-insp-mat-count">'+have+' / '+need+'</span>'
      + '<span class="forge-insp-mat-mark">'+(enough?'✓':'✗')+'</span>'
      + '</div>';
  });

  // Slot availability (any empty slot among unlocked)
  var slotCount = getForgeSlotCount();
  var hasOpenSlot = (queue.length || 0) < slotCount;

  var ctaHtml = '';
  if(activeSlot !== -1){
    var job = queue[activeSlot];
    var elapsed = Date.now() - job.startTime;
    var pct = Math.min(100, Math.max(0, (elapsed/job.totalMs)*100));
    var ready = elapsed >= job.totalMs;
    var remaining = Math.max(0, job.totalMs - elapsed);
    ctaHtml = '<div class="forge-insp-active">'
      + '<div class="forge-insp-active-label">CURRENTLY FORGING</div>'
      + '<div class="forge-insp-active-bar"><div class="forge-insp-active-fill'+(ready?' ready':'')+'" style="width:'+pct+'%;"></div></div>'
      + '<div class="forge-insp-active-meta">'
        + '<span>'+Math.round(pct)+'% complete</span>'
        + '<span>'+(ready?'READY':_forgeTimeFmt(remaining)+' REMAINING')+'</span>'
      + '</div>'
      + '</div>';
  } else if(!hasOpenSlot){
    ctaHtml = '<button class="forge-craft-btn forge-craft-btn-disabled" disabled>QUEUE FULL</button>';
  } else if(!can){
    ctaHtml = '<button class="forge-craft-btn forge-craft-btn-disabled" disabled>INSUFFICIENT MATERIALS</button>';
  } else {
    ctaHtml = '<button class="forge-craft-btn" onclick="startForgeCraft(\''+id+'\')">⚒ BEGIN FORGING</button>';
  }

  // Round 39: dropped the flavour/lore line — keep relics' inspector
  // focused on mechanics. Effect description below is the canonical
  // "what does this do" surface; the lore can return later when we
  // have a place that frames it (relic codex / bestiary).
  insp.innerHTML =
    // Hero
    '<div class="forge-insp-hero" style="background:radial-gradient(ellipse at 50% 0%,'+color+'33,transparent 60%);">'
      + '<div class="forge-insp-hero-icon-wrap" style="background:radial-gradient(circle at 50% 60%,'+color+'66,transparent 70%);border-color:'+color+';box-shadow:0 0 24px '+color+'66,inset 0 0 18px rgba(0,0,0,.4);">'
        + '<div class="forge-insp-hero-glow" style="background:conic-gradient(from 0deg,transparent,'+color+'55,transparent 50%);"></div>'
        + '<span class="forge-insp-hero-icon">'+relicImgHTML(id,'72px')+'</span>'
      + '</div>'
      + '<div class="forge-insp-hero-tier" style="color:'+color+';">'+label+' TIER · RELIC RECIPE</div>'
      + '<div class="forge-insp-hero-name">'+relic.name+'</div>'
    + '</div>'
    // Effect
    + '<div class="forge-insp-section">'
      + '<div class="forge-insp-label">EFFECT</div>'
      + '<div class="forge-insp-effect">'+(relic.desc||'')+'</div>'
    + '</div>'
    // Materials
    + '<div class="forge-insp-section forge-insp-mats-block">'
      + '<div class="forge-insp-label">MATERIALS REQUIRED</div>'
      + matRows
    + '</div>'
    // Time
    + '<div class="forge-insp-time-row">'
      + '<span class="forge-insp-label">CRAFT TIME</span>'
      + '<span class="forge-insp-time-val">'+_forgeTimeFmt((RELIC_CRAFT_TIMES[recipe.tier]||0)*1000)+'</span>'
    + '</div>'
    + '<div class="forge-insp-spacer"></div>'
    + '<div class="forge-insp-cta">'
      + ctaHtml
      + '<div class="forge-insp-foot">Crafted relics enter your inventory · equip via the Sanctum</div>'
    + '</div>';
}

// ── Forge: handlers ──────────────────────────────────────────────────
function _forgeSelectRecipe(id){
  _forgeSelectedRecipe = id;
  refreshForgePanel();
}

function startForgeCraft(relicId){
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.unlocked) return;
  if(!RELIC_RECIPES[relicId] || !RELICS[relicId]){ showTownToast('Unknown recipe.'); return; }
  if(!b.queue) b.queue = [];
  if(b.queue.length >= getForgeSlotCount()){ showTownToast('All forge slots are busy.'); return; }
  if(!_forgeCanAfford(relicId)){ showTownToast('Not enough materials.'); return; }

  // Consume materials
  var recipe = RELIC_RECIPES[relicId];
  if(!PERSIST.town.materials) PERSIST.town.materials = {};
  Object.keys(recipe.mats).forEach(function(k){
    PERSIST.town.materials[k] = (PERSIST.town.materials[k]||0) - recipe.mats[k];
  });

  // Push job. baseTotalMs is the unmodified craft time; totalMs is what the
  // bar/timer actually counts down to. They diverge when a champion is
  // assigned (totalMs = baseTotalMs * (1 - speedBonus)). champId/champBonus
  // are null until an explicit assign — start unassigned so the player has
  // to make the choice.
  var totalSec = (RELIC_CRAFT_TIMES[recipe.tier] || 600);
  var totalMs  = totalSec * 1000;
  b.queue.push({
    relicId:     relicId,
    startTime:   Date.now(),
    totalMs:     totalMs,
    baseTotalMs: totalMs,
    champId:     null,
    champBonus:  0
  });

  if(typeof playCraftStartSfx === 'function') playCraftStartSfx();
  showTownToast('Forging '+RELICS[relicId].name+'…');
  savePersist();
  refreshForgePanel();
}

// ── Forge: champion assignment ───────────────────────────────────────
// Stat-fit speed bonus for Forge (primary STR). Snapshot at assign time
// so level-ups during craft don't change the timer mid-flight.
function _forgeMigrateJob(job){
  if(!job) return;
  if(job.baseTotalMs === undefined) job.baseTotalMs = job.totalMs;
  if(job.champId === undefined)     job.champId     = null;
  if(job.champBonus === undefined)  job.champBonus  = 0;
}

function assignChampToForge(slotIdx, champId){
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.queue || !b.queue[slotIdx]) return;
  if(!CREATURES[champId]) return;
  if(typeof isChampLocked === 'function' && isChampLocked(champId)){
    showTownToast(CREATURES[champId].name + ' is busy elsewhere.');
    return;
  }
  var job = b.queue[slotIdx];
  _forgeMigrateJob(job);

  // If the slot already had someone, release them first
  if(job.champId) _forgeReleaseChampInternal(job);

  var fit = champActivitySpeedBonus(champId, 'STR');
  var bonus = fit.speedBonus;

  // Recompute totalMs from base, preserve current pct so the bar doesn't jump
  var now = Date.now();
  var pct = Math.min(1, Math.max(0, (now - job.startTime) / job.totalMs));
  var newTotal = Math.max(1, Math.round(job.baseTotalMs * (1 - bonus)));
  job.totalMs    = newTotal;
  job.startTime  = now - newTotal * pct;
  job.champId    = champId;
  job.champBonus = bonus;

  // Lock the champion
  var cp = getChampPersist(champId);
  if(cp) cp.lockedForge = slotIdx;

  showTownToast(CREATURES[champId].name + ' is helping at the forge (−' + Math.round(bonus*100) + '%).');
  savePersist();
  refreshForgePanel();
}

// Internal: release without saving / re-rendering. Used by assign-swap and
// the public release/cancel/collect paths.
function _forgeReleaseChampInternal(job){
  if(!job || !job.champId) return;
  var champId = job.champId;
  // Restore unmodified time, preserve current pct
  var now = Date.now();
  var pct = Math.min(1, Math.max(0, (now - job.startTime) / job.totalMs));
  job.startTime  = now - job.baseTotalMs * pct;
  job.totalMs    = job.baseTotalMs;
  job.champId    = null;
  job.champBonus = 0;
  // Unlock champion
  var cp = PERSIST.champions[champId];
  if(cp && cp.lockedForge !== null && cp.lockedForge !== undefined){
    cp.lockedForge = null;
  }
}

function releaseChampFromForge(slotIdx){
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.queue || !b.queue[slotIdx]) return;
  var job = b.queue[slotIdx];
  _forgeMigrateJob(job);
  if(!job.champId) return;
  var name = CREATURES[job.champId] ? CREATURES[job.champId].name : 'Champion';
  _forgeReleaseChampInternal(job);
  showTownToast(name + ' returned to town.');
  savePersist();
  refreshForgePanel();
}

// M'bur cancel-craft lines — gruff, practical, no comfort. One picked
// at random per modal open so confirmations don't feel canned.
var FORGE_CANCEL_LINES = [
  "Heat wasted. Mats are ash. Your call.",
  "Steel's already cooling. Sure?",
  "Mats burned. Time burned. Speak.",
  "I don't refund. You know that. Confirm.",
  "Fire doesn't take back what it ate."
];

function cancelForgeCraft(slotIdx){
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.queue || !b.queue[slotIdx]) return;
  var job = b.queue[slotIdx];
  var relic = RELICS[job.relicId];
  var recipe = RELIC_RECIPES[job.relicId];
  if(!relic || !recipe) return;
  var elapsed = Date.now() - job.startTime;
  var pct = Math.min(99, Math.floor((elapsed / job.totalMs) * 100));
  // Materials-lost summary
  var matsLost = Object.keys(recipe.mats).map(function(k){
    var m = MATERIALS && MATERIALS[k];
    var icon = m ? m.icon : '?';
    var name = m ? m.name : k;
    return icon + ' ' + recipe.mats[k] + '× ' + name;
  }).join(' · ');

  var line = FORGE_CANCEL_LINES[Math.floor(Math.random() * FORGE_CANCEL_LINES.length)];
  _forgeShowMburConfirm({
    title: 'ABANDON CRAFT?',
    line:  line,
    body:  '<div class="forge-mbur-row"><span class="forge-mbur-label">FORGING</span> <span class="forge-mbur-val">' + relic.name + '</span></div>'
         + '<div class="forge-mbur-row"><span class="forge-mbur-label">PROGRESS LOST</span> <span class="forge-mbur-val">' + pct + '%</span></div>'
         + '<div class="forge-mbur-row"><span class="forge-mbur-label">MATERIALS LOST</span> <span class="forge-mbur-val">' + matsLost + '</span></div>',
    confirmLabel: 'ABANDON CRAFT',
    confirmDestructive: true,
    onConfirm: function(){
      // Release any assigned champion before clearing the slot
      _forgeReleaseChampInternal(b.queue[slotIdx]);
      b.queue.splice(slotIdx, 1);
      showTownToast('Forge abandoned. Materials lost.');
      savePersist();
      refreshForgePanel();
    }
  });
}

// Reusable M'bur-styled confirmation modal for Forge dialogs. Any future
// Forge prompts (e.g. clearing a queue, abandoning multiple slots) should
// route through here so they stay in-character.
//   opts: { title, line, body, confirmLabel, confirmDestructive, onConfirm }
function _forgeShowMburConfirm(opts){
  opts = opts || {};
  var existing = document.getElementById('forge-mbur-overlay');
  if(existing) existing.parentNode.removeChild(existing);

  var overlay = document.createElement('div');
  overlay.id = 'forge-mbur-overlay';
  overlay.className = 'forge-mbur-overlay';

  var card = document.createElement('div');
  card.className = 'forge-mbur-card';
  var confirmCls = opts.confirmDestructive ? 'forge-mbur-btn forge-mbur-btn-danger' : 'forge-mbur-btn forge-mbur-btn-confirm';
  card.innerHTML =
    '<div class="forge-mbur-title">' + (opts.title || 'CONFIRM') + '</div>' +
    '<div class="forge-mbur-strip">' +
      '<div class="forge-mbur-portrait"><img src="assets/creatures/blacksmith.png" alt="M\'bur" onerror="this.parentNode.textContent=\'⚒\'"></div>' +
      '<div class="forge-mbur-bubble">' +
        '<div class="forge-mbur-bubble-name">M\'BUR · FORGE KEEPER</div>' +
        '<div class="forge-mbur-bubble-line">' + (opts.line || '') + '</div>' +
      '</div>' +
    '</div>' +
    (opts.body ? '<div class="forge-mbur-body">' + opts.body + '</div>' : '') +
    '<div class="forge-mbur-btns">' +
      '<button class="forge-mbur-btn" id="forge-mbur-cancel">KEEP CRAFTING</button>' +
      '<button class="' + confirmCls + '" id="forge-mbur-confirm">' + (opts.confirmLabel || 'CONFIRM') + '</button>' +
    '</div>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function close(confirmed){
    if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if(confirmed && typeof opts.onConfirm === 'function') opts.onConfirm();
  }
  document.getElementById('forge-mbur-cancel').onclick  = function(){ close(false); };
  document.getElementById('forge-mbur-confirm').onclick = function(){ close(true); };
  // Click outside the card cancels (matches deck-editor leave modal)
  overlay.onclick = function(e){ if(e.target === overlay) close(false); };
}

// ── Forge: champion picker modal ─────────────────────────────────────
// M'bur introduces the assignment, then a grid of available champions
// with their STR-fit (primary) speed bonus surfaced. Champions on
// expedition or already at another forge slot are hidden — the lock
// model excludes them upstream via the picker filter.
var FORGE_ASSIGN_LINES = [
  "Hands. Real ones. Show me who.",
  "Whose arms am I getting today?",
  "Strong back, faster steel. Pick.",
  "Anyone with a pulse and a grip will do.",
  "Send me someone who's not afraid of fire."
];

function _forgePickChampForSlot(slotIdx){
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.queue || !b.queue[slotIdx]) return;
  var job = b.queue[slotIdx];
  _forgeMigrateJob(job);
  if(job.champId){ releaseChampFromForge(slotIdx); return; }

  var existing = document.getElementById('forge-mbur-overlay');
  if(existing) existing.parentNode.removeChild(existing);

  // Eligible champions: unlocked, alive (or undefined alive flag), not
  // dojo_tiger, not currently locked elsewhere (expedition / forge / well).
  var available = (PERSIST.unlockedChamps||[]).filter(function(id){
    if(!CREATURES[id] || id==='dojo_tiger') return false;
    var cp = PERSIST.champions[id];
    if(!cp) return true;
    if(cp.lockedExpedition !== null && cp.lockedExpedition !== undefined) return false;
    if(cp.lockedForge      !== null && cp.lockedForge      !== undefined) return false;
    if(cp.lockedShardWell  !== null && cp.lockedShardWell  !== undefined) return false;
    return true;
  });

  // Sort by STR-fit speedBonus desc so best fits surface first
  available.sort(function(a, b){
    var fa = champActivitySpeedBonus(a, 'STR').speedBonus;
    var fb = champActivitySpeedBonus(b, 'STR').speedBonus;
    return fb - fa;
  });

  var line = FORGE_ASSIGN_LINES[Math.floor(Math.random() * FORGE_ASSIGN_LINES.length)];
  var relic = RELICS[job.relicId];

  var gridHtml = '';
  if(!available.length){
    gridHtml = '<div class="forge-mbur-empty">No champions available. They\'re all elsewhere.</div>';
  } else {
    gridHtml = '<div class="forge-mbur-grid">';
    available.forEach(function(id){
      var ch = CREATURES[id];
      var cp = getChampPersist(id);
      var fit = champActivitySpeedBonus(id, 'STR');
      var bonusPct = Math.round(fit.speedBonus * 100);
      var bonusColor = bonusPct >= 33 ? '#9adc7e' : bonusPct >= 18 ? '#c0a060' : '#7a6030';
      gridHtml +=
        '<div class="forge-mbur-grid-item" onclick="_forgeAssignFromPicker(' + slotIdx + ',\'' + id + '\')">'
        + '<div class="forge-mbur-grid-portrait">' + creatureImgHTML(id, ch.icon, '44px') + '</div>'
        + '<div class="forge-mbur-grid-name">' + ch.name + '</div>'
        + '<div class="forge-mbur-grid-lvl">Lv.' + cp.level + '</div>'
        + '<div class="forge-mbur-grid-stats">'
          + '<span style="color:#e88060;">STR ' + Math.round(cp.stats.str) + '</span> '
          + '<span style="color:#9adc7e;opacity:.6;">AGI ' + Math.round(cp.stats.agi) + '</span> '
          + '<span style="color:#9ad8e8;opacity:.6;">WIS ' + Math.round(cp.stats.wis) + '</span>'
        + '</div>'
        + '<div class="forge-mbur-grid-bonus" style="color:' + bonusColor + ';">−' + bonusPct + '% TIME</div>'
        + '</div>';
    });
    gridHtml += '</div>';
  }

  var overlay = document.createElement('div');
  overlay.id = 'forge-mbur-overlay';
  overlay.className = 'forge-mbur-overlay';

  var card = document.createElement('div');
  card.className = 'forge-mbur-card forge-mbur-picker-card';
  card.innerHTML =
    '<div class="forge-mbur-title">ASSIGN A CHAMPION</div>' +
    '<div class="forge-mbur-strip">' +
      '<div class="forge-mbur-portrait"><img src="assets/creatures/blacksmith.png" alt="M\'bur" onerror="this.parentNode.textContent=\'⚒\'"></div>' +
      '<div class="forge-mbur-bubble">' +
        '<div class="forge-mbur-bubble-name">M\'BUR · FORGE KEEPER</div>' +
        '<div class="forge-mbur-bubble-line">' + line + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="forge-mbur-body">' +
      '<div class="forge-mbur-row"><span class="forge-mbur-label">FORGING</span> <span class="forge-mbur-val">' + (relic?relic.name:job.relicId) + '</span></div>' +
      '<div class="forge-mbur-row" style="font-size:8px;color:#7a6030;letter-spacing:1px;">PRIMARY <span style="color:#e88060;">STR</span> · SECONDARIES AT 25%</div>' +
    '</div>' +
    gridHtml +
    '<div class="forge-mbur-btns">' +
      '<button class="forge-mbur-btn" id="forge-mbur-cancel">CLOSE</button>' +
    '</div>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function close(){ if(overlay.parentNode) overlay.parentNode.removeChild(overlay); }
  document.getElementById('forge-mbur-cancel').onclick = close;
  overlay.onclick = function(e){ if(e.target === overlay) close(); };
}

// Picker → assign handler. Closes the modal and assigns.
function _forgeAssignFromPicker(slotIdx, champId){
  var ov = document.getElementById('forge-mbur-overlay');
  if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
  assignChampToForge(slotIdx, champId);
}

function collectForgeCraft(slotIdx){
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.queue || !b.queue[slotIdx]) return;
  var job = b.queue[slotIdx];
  _forgeMigrateJob(job);
  var elapsed = Date.now() - job.startTime;
  if(elapsed < job.totalMs) return; // not ready
  var relic = RELICS[job.relicId];
  if(!PERSIST.town.relics) PERSIST.town.relics = {};
  PERSIST.town.relics[job.relicId] = (PERSIST.town.relics[job.relicId]||0) + 1;
  // Capture the assigned champion BEFORE releasing the lock — the release
  // helper zeros job.champId.
  var assignedChampId = job.champId || null;
  // Release assigned champion (if any) before clearing the slot
  _forgeReleaseChampInternal(job);
  b.queue.splice(slotIdx, 1);
  // Award Forge XP based on craft time. Use baseTotalMs so champion-shortened
  // crafts don't pay less XP than a slow self-craft of the same recipe.
  //   base    600s →  60 XP
  //   ruby   1800s → 180 XP
  //   emerald 7200s → 720 XP
  var xpGained = Math.max(10, Math.round(job.baseTotalMs / 10000));
  if(typeof addBuildingXp === 'function') addBuildingXp('forge', xpGained);
  // Mastery to the assigned champion (if any). Scaled by craft duration.
  // Round 30 retuning lowered the scalar so Forge crafts are a steady
  // accelerator, not a primary mastery source:
  //   base    10min →  8 mastery
  //   ruby    30min → 18 mastery
  //   emerald  2hr  → 63 mastery
  // Champion does the work, champion gets the growth — same justification
  // as the activity stat-fit speed bonus.
  var masteryGain = 0;
  if(assignedChampId && CREATURES[assignedChampId]){
    masteryGain = 3 + Math.round(job.baseTotalMs / 120000);
    addMasteryXp(assignedChampId, masteryGain);
  }
  if(typeof playCraftDoneSfx === 'function') playCraftDoneSfx();
  showTownToast('✦ '+(relic?relic.name:'Relic')+' added to inventory!');
  var masteryNote = (masteryGain > 0)
    ? ' (+'+xpGained+' Forge XP · +'+masteryGain+' mastery to '+CREATURES[assignedChampId].name+')'
    : ' (+'+xpGained+' Forge XP)';
  addLog('✦ Forge complete: '+(relic?relic.name:job.relicId)+' added to inventory.'+masteryNote,'sys');
  // Round 67p: advance story "craft this relic" quests.
  if(typeof checkQuestProgress === 'function'){
    checkQuestProgress('craft_relic', { relicId: job.relicId });
  }
  savePersist();
  refreshForgePanel();
}

// ── Shard Well tick ───────────────────────────────────────────────────
// ── Shard Well: tick + helpers (Round 40 rewrite) ──
// Base values, modified by champion assignments + permanent stat-point
// upgrades. All numbers tunable; this is a first-cut balance pass.
var SHARD_WELL_BASE_SECS = 120;   // baseline: 1 shard / 2 min (unmodified)
var SHARD_WELL_BASE_CAP  = 25;    // baseline cap (unmodified)
var SHARD_WELL_RATE_PT_PCT = 0.05; // each rateLevel point = +5% rate
var SHARD_WELL_CAP_PT_VAL  = 1;    // each capLevel point = +1 cap

// Effective seconds-per-shard given the well's current state.
// Lower number = faster generation. Floored at 5s so we don't go silly.
function getShardWellSecsPerShard(){
  var b = PERSIST.town.buildings.shard_well;
  if(!b || !b.unlocked) return 0;
  var effect = (typeof champShardWellEffect === 'function')
    ? champShardWellEffect(b.assignedChampIds||[])
    : { rateMult:1.0 };
  var rateMult = effect.rateMult * (1 + (b.rateLevel||0) * SHARD_WELL_RATE_PT_PCT);
  return Math.max(5, Math.round(SHARD_WELL_BASE_SECS / rateMult));
}

// Effective cap given current state. Floor at base.
function getShardWellCap(){
  var b = PERSIST.town.buildings.shard_well;
  if(!b || !b.unlocked) return SHARD_WELL_BASE_CAP;
  var effect = (typeof champShardWellEffect === 'function')
    ? champShardWellEffect(b.assignedChampIds||[])
    : { capBonus:0 };
  return SHARD_WELL_BASE_CAP + (effect.capBonus||0) + (b.capLevel||0) * SHARD_WELL_CAP_PT_VAL;
}

// Legacy function kept for existing callers. Returns "1 / N min" rate.
function getShardWellRate(){
  var b = PERSIST.town.buildings.shard_well;
  if(!b || !b.unlocked) return 0;
  return getShardWellSecsPerShard();
}

// Per-tick generation, capped, with XP / mastery side effects.
//   Each shard generated:
//     - Adds 1 to b.pendingShards (capped by getShardWellCap; the
//       player must CLAIM to transfer to PERSIST.soulShards)
//     - Adds (1 × xpMult) to b.wellXp; awards stat point on level-up
//     - Adds 0.05 to b.masteryAcc; integer overflow distributed across slotted champs
function shardWellTick(seconds){
  var b = PERSIST.town.buildings.shard_well;
  if(!b || !b.unlocked) return;
  if(typeof b.shardAcc !== 'number') b.shardAcc = 0;
  if(typeof b.wellXp !== 'number')   b.wellXp = 0;
  if(typeof b.wellLevel !== 'number') b.wellLevel = 1;
  if(typeof b.unspentPoints !== 'number') b.unspentPoints = 0;
  if(typeof b.rateLevel !== 'number') b.rateLevel = 0;
  if(typeof b.capLevel !== 'number')  b.capLevel = 0;
  if(typeof b.masteryAcc !== 'number') b.masteryAcc = 0;
  if(typeof b.pendingShards !== 'number') b.pendingShards = 0;
  if(!Array.isArray(b.assignedChampIds)) b.assignedChampIds = [];

  var secsPerShard = getShardWellSecsPerShard();
  if(secsPerShard <= 0) return;
  var cap = getShardWellCap();

  var effect = (typeof champShardWellEffect === 'function')
    ? champShardWellEffect(b.assignedChampIds)
    : { xpMult:1.0 };
  var xpMult = effect.xpMult || 1.0;

  b.shardAcc += seconds;

  // Generate up to as many shards as time allows OR until cap is reached
  var safety = 1000; // guard against runaway loops
  while(b.shardAcc >= secsPerShard && safety-- > 0){
    var atCap = b.pendingShards >= cap;
    if(atCap){
      // At cap — drop the accumulated time so the well doesn't immediately
      // dump a huge backlog when the player claims; cap is meant to gate
      // pacing, not to overflow.
      b.shardAcc = 0;
      break;
    }
    b.pendingShards += 1;
    b.shardAcc -= secsPerShard;

    // Award well XP
    b.wellXp += xpMult; // floats accumulate; never round mid-tick

    // Level-up loop (handle multiple level-ups in one tick if XP huge)
    while(b.wellXp >= getShardWellXpForLevel(b.wellLevel)){
      b.wellXp -= getShardWellXpForLevel(b.wellLevel);
      b.wellLevel += 1;
      b.unspentPoints += 1;
    }

    // Mastery accumulator — well is the LEAST efficient mastery source
    // (J's call). 0.05 mastery per shard means ~1 mastery / 20 shards =
    // ~40 minutes of well time at default rate, distributed across slotted
    // champs. Specialized AGI rosters get faster shards = faster mastery,
    // so the mastery indirectly tracks well throughput.
    b.masteryAcc += 0.05;
    if(b.masteryAcc >= 1 && b.assignedChampIds.length > 0){
      var whole = Math.floor(b.masteryAcc);
      b.masteryAcc -= whole;
      // Each slotted champion gets the whole amount (not split) so the
      // assignment feels like an active investment per champion.
      // Keeps the magnitude tiny because whole is usually 1.
      b.assignedChampIds.forEach(function(id){
        if(typeof addMasteryXp === 'function') addMasteryXp(id, whole);
      });
    }
  }
}

// ── Expedition tick ───────────────────────────────────────────────────

// ── Vault level bar refresh ───────────────────────────────────────────

// ── Summons banner ────────────────────────────────────────────────────
function refreshSummonsBanner(){
  var banner=document.getElementById('town-summons-banner');
  if(!banner) return;
  var wellUnlocked=PERSIST.town.buildings.shard_well&&PERSIST.town.buildings.shard_well.unlocked;
  if(!wellUnlocked){ banner.style.display='none'; return; }
  banner.style.display='block';
  var souls=PERSIST.soulShards||0;
  var canSummon=souls>=SOUL_SHARDS_PER_PULL;
  // Round 62g: shard count display dropped — nav-shards owns it now.
  // Banner is now a single SUMMON CTA when shards are available, or
  // a faint "N more to summon" hint otherwise. Slim, no chrome.
  banner.innerHTML = canSummon
    ? '<button onclick="openSummonsPanel()" class="town-summon-cta">SUMMON ✦</button>'
    : '<span class="town-summon-wait">'+(SOUL_SHARDS_PER_PULL-souls)+' more shards to summon</span>';
}

// ─────────────────────────────────────────────────────────
// UNIFIED IDLE TICK — every 5s
// ─────────────────────────────────────────────────────────
setInterval(function(){
  forgeTick();
  expeditionTick();
  vaultTick(5);
  marketTick(5);
  bestiaryTick(5);
  shardWellTick(5);
  if(typeof arenaTick === 'function') arenaTick(5);
  questTick(5);
  savePersist();
  // Live-update vault bar if vault panel is open
  var vp=document.getElementById('vault-panel-bg');
  if(vp&&vp.classList.contains('show')){ refreshVaultLevelBar(); }
  // Live-update market bars if market panel open
  var mp=document.getElementById('market-panel-bg');
  if(mp&&mp.classList.contains('show')){
    var mb=PERSIST.town.buildings.market;
    if(mb&&mb.unlocked){
      // Market live update handled by marketTick → refreshMarketPanel
    }
  }
  // Round 62f: keep nav-bar currencies in sync with background gains
  // (shard well auto-fill, expedition completions, achievement claims,
  // etc). refreshNavCurrencies paints gold + shards without touching
  // the active-tab class state.
  if(typeof refreshNavCurrencies === 'function') refreshNavCurrencies();
}, 5000);

function showTownToast(msg){
  // Simple: show in subtitle
  document.getElementById('town-subtitle').textContent=msg;
  setTimeout(function(){
    document.getElementById('town-subtitle').textContent='Your settlement awaits.';
  },2000);
}

// Vault — see data/vault.js


// ── SPOILS CARD PICK ─────────────────────────────────────────────
var _spoilsChampId=null;

function buildSpoilsCardPool(){
  // Collect all cardRewards from enemies killed this run, deduplicated
  if(!gs||!gs.killedEnemyIds) return [];
  var seen={}, pool=[];
  gs.killedEnemyIds.forEach(function(id){
    var enemy=CREATURES[id];
    if(!enemy||!enemy.cardRewards) return;
    enemy.cardRewards.forEach(function(cardId){
      if(!seen[cardId]&&CARDS[cardId]){
        seen[cardId]=true;
        pool.push(cardId);
      }
    });
  });
  return pool;
}

function showSpoilsOverlay(champId){
  var pool=buildSpoilsCardPool();
  _spoilsChampId=champId;

  // Gem shard reward — small amount from area clears
  // Round 67p: Card Fragments reward removed alongside the rest of
  // the fragment system. The random Sanctum-pool card below is the
  // remaining reward from this overlay.
  var areaLevel=gs&&gs.area?gs.area.level:1;
  var shardReward=areaLevel>=3?Math.floor(areaLevel/3):0;
  if(shardReward>0) PERSIST.town.materials.gemShards=(PERSIST.town.materials.gemShards||0)+shardReward;

  savePersist();

  // Build rewards display
  var rewardsRow=document.getElementById('spoils-rewards-row');
  if(rewardsRow){
    rewardsRow.innerHTML = (shardReward>0?
      '<div style="background:rgba(0,0,0,.4);border:1px solid #4a3010;border-radius:8px;padding:12px 18px;min-width:90px;">'
        +'<div style="font-size:28px;margin-bottom:4px;">💎</div>'
        +'<div style="font-size:16px;color:#d4a843;">+'+shardReward+'</div>'
        +'<div style="font-size:8px;color:#7a6030;margin-top:2px;">Gem Shards</div>'
      +'</div>':'');
  }

  // Pick one card from the pool to add to Sanctum collection
  var cardEarnedEl=document.getElementById('spoils-card-earned');
  var cardInnerEl=document.getElementById('spoils-card-inner');
  if(pool.length&&cardEarnedEl&&cardInnerEl){
    // Pick a random card from the pool
    var picked=pool[Math.floor(Math.random()*pool.length)];
    var alreadyOwned=getSanctumCollected(picked);
    addToSanctumPool(picked,1);
    var cd=CARDS[picked];
    cardInnerEl.innerHTML=
      '<span style="font-size:28px;">'+(cd?cd.icon:'🃏')+'</span>'
      +'<div style="text-align:left;">'
        +'<div style="font-size:10px;color:#d4a843;">'+(cd?cd.name:picked)+'</div>'
        +'<div style="font-size:8px;color:#7a6030;margin-top:2px;">'+(cd?cd.effect:'')+'</div>'
        +(alreadyOwned?'<div style="font-size:7px;color:#4a6030;margin-top:3px;">+1 copy (you have '+(alreadyOwned+1)+')</div>':'<div style="font-size:7px;color:#60a040;margin-top:3px;">✨ New card unlocked!</div>')
      +'</div>';
    cardEarnedEl.style.display='block';
  } else if(cardEarnedEl){
    cardEarnedEl.style.display='none';
  }

  var ol=document.getElementById('spoils-overlay');
  if(ol) ol.style.display='flex';
}

function closeSpoilsOverlay(){
  var ol=document.getElementById('spoils-overlay');
  if(ol) ol.style.display='none';
  _spoilsChampId=null;
  goToAreaSelectAfterRun();
}


// ── Wire up town unlock ──
// Town tab always visible in nav (locked or unlocked)

// Grant a Red card when Rising Power is claimed — hooked into claimAchievement
var _origClaim=null; // patched below after definition

// ── THE ETERNAL SUMMONS ──
var _gachaResults = [];
var _gachaRAF = null;
var _summoningActive = false; // lock during animation

// ── Rarity config ──
// Round 62: switched from generic common/uncommon/rare/legendary to
// the project's 7-tier gem palette (Ruby/Emerald/Sapphire/Turquoise/
// Amethyst/Topaz/Black Opal). Hex values mirror the .asc-tier-chip
// rules in style.css so the summons UI and the ascension chip on a
// champion card read as the same colour system.
//
// RARITY_ORDER sorts rarest-first for the pool grid (0 = rarest).
// RARITY_LABEL is what gets printed in UI strings (capitalised, with
// the space for "Black Opal").
var RARITY_COL   = {
  ruby:      '#c04040',
  emerald:   '#50b060',
  sapphire:  '#5080d0',
  turquoise: '#50b0a8',
  amethyst:  '#a060d0',
  topaz:     '#c0a040',
  black_opal:'#8888c0'
};
var RARITY_ORDER = {
  black_opal:0, topaz:1, amethyst:2, turquoise:3, sapphire:4, emerald:5, ruby:6
};
var RARITY_LABEL = {
  ruby:'RUBY', emerald:'EMERALD', sapphire:'SAPPHIRE', turquoise:'TURQUOISE',
  amethyst:'AMETHYST', topaz:'TOPAZ', black_opal:'BLACK OPAL'
};
// Card-face translucent background. Subtle hint of the gem's hue.
var RARITY_BG    = {
  ruby:      'linear-gradient(135deg,#200808,#100404)',
  emerald:   'linear-gradient(135deg,#081a08,#041004)',
  sapphire:  'linear-gradient(135deg,#080e20,#040810)',
  turquoise: 'linear-gradient(135deg,#082018,#04100c)',
  amethyst:  'linear-gradient(135deg,#180820,#0c0410)',
  topaz:     'linear-gradient(135deg,#201804,#100c02)',
  black_opal:'linear-gradient(135deg,#0c0820,#040210)'
};
// Visual class buckets used by the reveal animation. The "spotlight"
// tiers (topaz+black_opal) get the big sprite + strong glow that the
// old "legendary" label used to own. Amethyst is the rare-band echo.
// Sapphire/Turquoise get a small glow. Ruby/Emerald baseline.
var RARITY_SPOTLIGHT = {ruby:0, emerald:0, sapphire:1, turquoise:1, amethyst:2, topaz:3, black_opal:3};

// ── Inject CSS once ──
// Round 60: cosmic full-page chrome retired. Only the animation/3D
// card-flip primitives stay — the rest comes from the sibling panel
// CSS family. Kept keyframes: ring-spin, card-breathe, shockwave.
(function(){
  if(document.getElementById('summons-css')) return;
  var s=document.createElement('style');
  s.id='summons-css';
  s.textContent=
    '@keyframes es-ring-spin{to{transform:rotate(360deg)}}'+
    '@keyframes es-ring-spinr{to{transform:rotate(-360deg)}}'+
    '@keyframes es-card-breathe{0%,100%{box-shadow:0 0 10px #40208040,0 6px 24px #00000070}50%{box-shadow:0 0 28px #7040c070,0 6px 32px #00000090}}'+
    '@keyframes es-shockwave{0%{transform:translate(-50%,-50%) scale(.1);opacity:.9}100%{transform:translate(-50%,-50%) scale(3.5);opacity:0}}'+
    '.town-panel-summons{width:min(1100px,95vw);max-width:95vw;height:85vh;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;padding:0;}'+
    '.town-panel-summons .town-panel-header{padding:14px 16px 10px;margin-bottom:0;}'+
    '.town-panel-summons #summons-inner{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#2a1808 transparent;}'+
    '.town-panel-summons #summons-inner::-webkit-scrollbar{width:6px;}'+
    '.town-panel-summons #summons-inner::-webkit-scrollbar-track{background:transparent;}'+
    '.town-panel-summons #summons-inner::-webkit-scrollbar-thumb{background:#2a1808;border-radius:3px;}'+
    '.es-card-wrap{position:absolute;width:180px;height:260px;perspective:700px;cursor:default;}'+
    '.es-card-inner{width:100%;height:100%;transform-style:preserve-3d;position:relative;}'+
    '.es-face,.es-back{position:absolute;inset:0;border-radius:8px;backface-visibility:hidden;-webkit-backface-visibility:hidden;}'+
    '.es-back{background:linear-gradient(135deg,#1c0935,#0d051f);border:2px solid #4020a0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;animation:es-card-breathe 2.2s ease-in-out infinite;}'+
    '.es-face{transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px;gap:5px;border:2px solid #333;}'+
    '.es-pool-card{background:linear-gradient(180deg,#1a1208,#120802);border:1px solid #3a2010;border-radius:4px;padding:8px;display:flex;flex-direction:column;gap:4px;transition:border-color .15s,opacity .15s;}'+
    '.es-pool-card:hover{border-color:#c09030;}'+
    '.es-summon-btn{padding:12px 22px;background:transparent;border:2px solid #6030c0;color:#c0a0ff;font-size:12px;letter-spacing:2.5px;cursor:pointer;border-radius:4px;text-shadow:0 0 6px rgba(160,96,224,.4);transition:all .12s ease;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:160px;}'+
    '.es-summon-btn:hover:not(:disabled){background:linear-gradient(180deg,rgba(96,48,192,.3),rgba(48,16,96,.4));}'+
    '.es-summon-btn:disabled{opacity:.4;cursor:not-allowed;}'+
    '.es-summon-btn-sub{font-size:9px;letter-spacing:1.2px;color:#9070c0;font-weight:normal;}';
  document.head.appendChild(s);
})();

// ── Canvas state ──
var _canvasCtx=null,_canvasEl=null,_canvasPhase='idle';
var _vortexParticles=[],_burstParticles=[];
var _vortexCX=0,_vortexCY=0;

// Pricing — Round 60: 10-pull discounted to 900 (one free) per J.
var SUMMONS_COST_1  = 100;
var SUMMONS_COST_10 = 900;

// Round 60: opens the summons panel. Replaces the old openTestGacha
// (which was orphaned — the Shard Well's SUMMON button called
// doEternalPull() directly with no count, which silently NaN-ed the
// shard balance and never opened any UI).
function openSummonsPanel(){
  var panel = document.getElementById('summons-panel-bg');
  if(!panel) return;
  panel.classList.add('show');
  _renderSummonsPanel();
  _initCanvas();
}

function closeSummonsPanel(){
  _summonsTeardown();
  var panel = document.getElementById('summons-panel-bg');
  if(panel) panel.classList.remove('show');
}

// Re-render the panel body from PERSIST state. Called on open and
// after any action that changes the shard pool or the discovered
// roster.
function _renderSummonsPanel(){
  var inner = document.getElementById('summons-inner');
  if(!inner) return;
  var souls = PERSIST.soulShards || 0;
  var canOne = souls >= SUMMONS_COST_1;
  var canTen = souls >= SUMMONS_COST_10;
  var disabledOne = canOne ? '' : ' disabled';
  var disabledTen = canTen ? '' : ' disabled';

  // Round 62: one-time refund banner. Shown when a player pulled an
  // unimplemented stub champion on a pre-fix build and got their shards
  // back via the loadPersist migration. Banner dismisses itself the
  // first time it's painted.
  var refundBanner = '';
  if(PERSIST._stubRefundPending && PERSIST._stubRefundPending.shards > 0){
    var rp = PERSIST._stubRefundPending;
    var names = (rp.ids||[]).map(function(cid){ return (CREATURES[cid] && CREATURES[cid].name) || cid; }).join(', ');
    refundBanner = ''
      + '<div style="margin:10px 22px 0;padding:10px 14px;background:linear-gradient(180deg,#1a1208,#0e0802);border:1px solid #5a3a18;border-left:3px solid #d4a843;border-radius:3px;">'
      +   '<div style="font-size:10px;letter-spacing:2px;color:#d4a843;margin-bottom:4px;">A SOUL RETURNED</div>'
      +   '<div style="font-size:12px;color:#c0a060;line-height:1.4;">'
      +     'The binding on ' + names + ' could not hold. ' + rp.shards + ' soul shards were returned to your reserve.'
      +   '</div>'
      + '</div>';
    // Clear after composing so the banner only shows once.
    delete PERSIST._stubRefundPending;
    if(typeof savePersist === 'function') savePersist();
  }

  // Standard NPC greeting block (Shard Master), level row,
  // shard counter band, summon buttons, stage, pool grid.
  inner.innerHTML = ''
    + '<div class="npc-greeting" id="summons-npc-greeting">'
    +   '<div class="npc-greeting-sprite"><img src="assets/creatures/shard_master.png" alt="Shard Master" onerror="this.parentNode.textContent=\'🔮\'"></div>'
    +   '<div class="npc-greeting-text">'
    +     '<div class="npc-greeting-name">SHARD MASTER</div>'
    +     '<div class="npc-greeting-msg" id="summons-npc-msg"></div>'
    +   '</div>'
    + '</div>'
    // Shard counter band
    + '<div style="display:flex;align-items:center;gap:14px;padding:12px 22px;background:linear-gradient(180deg,#1a0f25,#0e0820);border-bottom:1px solid #2a1808;">'
    +   (typeof soulShardImgHTML === 'function' ? soulShardImgHTML('40px') : '<span style="font-size:32px;">🔮</span>')
    +   '<div style="flex:1;min-width:0;">'
    +     '<div style="font-size:9px;letter-spacing:2px;color:#7040a0;">SOUL SHARDS</div>'
    +     '<div style="font-size:18px;color:#c0a0ff;font-weight:700;letter-spacing:1px;" id="summons-shards-count">' + souls + '</div>'
    +   '</div>'
    + '</div>'
    + refundBanner
    // Summon buttons
    + '<div style="display:flex;gap:14px;justify-content:center;padding:18px 22px;flex-wrap:wrap;border-bottom:1px solid #2a1808;">'
    +   '<button class="es-summon-btn" onclick="doEternalPull(1)"' + disabledOne + '>'
    +     '<span>SUMMON ×1</span>'
    +     '<span class="es-summon-btn-sub">' + SUMMONS_COST_1 + ' shards</span>'
    +   '</button>'
    +   '<button class="es-summon-btn" onclick="doEternalPull(10)"' + disabledTen + '>'
    +     '<span>SUMMON ×10</span>'
    +     '<span class="es-summon-btn-sub">' + SUMMONS_COST_10 + ' shards (saves ' + (SUMMONS_COST_1*10 - SUMMONS_COST_10) + ')</span>'
    +   '</button>'
    + '</div>'
    // Stage area (animations + card reveals appear here)
    + '<div id="es-stage-wrap" style="position:relative;min-height:240px;padding:20px 22px;border-bottom:1px solid #2a1808;">'
    +   '<canvas id="es-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"></canvas>'
    +   '<div id="es-rings" style="position:absolute;top:50%;left:50%;pointer-events:none;">'
    +     '<svg id="es-ring1" width="320" height="320" viewBox="0 0 320 320" style="position:absolute;transform:translate(-50%,-50%);opacity:.14;animation:es-ring-spin 18s linear infinite;">'
    +       '<circle cx="160" cy="160" r="140" fill="none" stroke="#8040ff" stroke-width="1" stroke-dasharray="8 18"/>'
    +       '<circle cx="160" cy="160" r="110" fill="none" stroke="#6030c0" stroke-width="1" stroke-dasharray="4 22"/>'
    +     '</svg>'
    +     '<svg id="es-ring2" width="240" height="240" viewBox="0 0 240 240" style="position:absolute;transform:translate(-50%,-50%);opacity:.08;animation:es-ring-spinr 12s linear infinite;">'
    +       '<circle cx="120" cy="120" r="105" fill="none" stroke="#c080ff" stroke-width="1.5" stroke-dasharray="3 14"/>'
    +     '</svg>'
    +   '</div>'
    +   '<div id="es-pinpoint" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;border-radius:50%;background:#fff;pointer-events:none;opacity:0;box-shadow:0 0 8px #fff,0 0 30px #c080ff,0 0 80px #8040ff;"></div>'
    +   '<div id="es-shockwave" style="position:absolute;top:50%;left:50%;width:200px;height:200px;border-radius:50%;border:3px solid #fff;pointer-events:none;opacity:0;display:none;"></div>'
    +   '<div id="es-stage" style="position:relative;min-height:200px;display:flex;align-items:center;justify-content:center;">'
    +     '<div style="color:#5a4a70;font-size:11px;letter-spacing:3px;">AWAITING THE SUMMONS</div>'
    +   '</div>'
    + '</div>'
    // Pool grid section
    + '<div style="padding:14px 22px;">'
    +   '<div style="font-size:11px;letter-spacing:2.5px;color:#d4a843;margin-bottom:10px;" id="es-pool-label">SUMMONABLE SOULS</div>'
    +   '<div id="es-pool-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;"></div>'
    + '</div>';

  // Greet (one-shot per panel-open via the unified pipeline)
  if(typeof playNpcGreeting === 'function') playNpcGreeting('shard_well', {once:true});
  // Defensive: if already greeted this open, paint the cached line
  var msgEl = document.getElementById('summons-npc-msg');
  var sharedMsgEl = document.getElementById('shard_well-npc-msg');
  if(msgEl && !msgEl.textContent && typeof _lastNpcLine !== 'undefined' && _lastNpcLine.shard_well){
    msgEl.textContent = _lastNpcLine.shard_well;
  }
  // The unified pipeline writes to #shard_well-npc-msg (the well's own
  // bubble). Mirror that line here too — both panels can be open
  // simultaneously, and the user expects the summons bubble to fill
  // in with the same Shard Master line.
  if(msgEl && sharedMsgEl && sharedMsgEl.textContent && !msgEl.textContent){
    msgEl.textContent = sharedMsgEl.textContent;
  }

  _refreshSummonsPoolGrid();
}

// External-friendly alias so devtools / save-load / _devGiveShards
// can refresh the open panel without knowing the implementation.
function _refreshSummonsPanel(){
  var panel = document.getElementById('summons-panel-bg');
  if(panel && panel.classList.contains('show')) _renderSummonsPanel();
}

function _buildPoolGrid(pool){
  return pool.map(function(e){
    var cr=CREATURES[e.id];
    var col=RARITY_COL[e.rarity]||'#a89373';
    var owned=PERSIST.unlockedChamps&&PERSIST.unlockedChamps.includes(e.id);
    var dupes=(PERSIST.champDupes&&PERSIST.champDupes[e.id])||0;
    // Sibling-aligned card: portrait + name + LV-style rarity badge +
    // stats. Drops the unique-cards list (deck contents stay hidden,
    // same principle as the arena daily preview). Owned state shown
    // by full opacity + green ✓; unowned dims to 0.45.
    // Round 61: owned creatures are friendly (in your roster) so they
    // flip-x to face right; unowned stay default (enemy facing).
    var portraitCls = owned ? 'flip-x' : '';
    return '<div class="es-pool-card" style="opacity:'+(owned?'1':'0.45')+';border-left:3px solid '+col+';">'
      +'<div style="display:flex;align-items:center;gap:8px;">'
        +'<div style="width:40px;height:40px;background:#0e0802;border:1px solid #2a1808;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+creatureImgHTML(cr.id, cr.icon, '32px', portraitCls)+'</div>'
        +'<div style="min-width:0;flex:1;">'
          // Round 62d: gem-name text label removed; the 3px gem-colour
          // border-left on the card already carries the rarity signal.
          +'<div style="font-size:11px;color:#e8d7a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.5px;">'+cr.name+'</div>'
        +'</div>'
        +(owned?'<span style="flex-shrink:0;color:#9adc7e;font-size:10px;">✓'+(dupes?'+'+dupes:'')+'</span>':'')
      +'</div>'
      +'<div style="font-size:9px;color:#7a6030;letter-spacing:.6px;">'
        +'<span style="color:#e88060;">'+cr.baseStats.str+'</span>·'
        +'<span style="color:#9adc7e;">'+cr.baseStats.agi+'</span>·'
        +'<span style="color:#9ad8e8;">'+cr.baseStats.wis+'</span>'
        +'<span style="color:#5a4020;"> · </span>'
        +'<span style="color:#c0a060;">'+cr.innate.name+'</span>'
      +'</div>'
    +'</div>';
  }).join('');
}

// ── Canvas ──
// Round 60: canvas is now inside the panel's stage area, not full-screen.
// Sized to the parent's box; vortex/burst origin is the stage center.
function _initCanvas(){
  _canvasEl=document.getElementById('es-canvas');
  if(!_canvasEl) return;
  var parent = _canvasEl.parentElement;
  var w = (parent && parent.clientWidth) || 600;
  var h = (parent && parent.clientHeight) || 240;
  _canvasEl.width = w;
  _canvasEl.height = h;
  _canvasCtx=_canvasEl.getContext('2d');
  _canvasPhase='idle';
  _vortexParticles=[]; _burstParticles=[];
  _vortexCX = w * 0.5;
  _vortexCY = h * 0.5;
  if(_gachaRAF) cancelAnimationFrame(_gachaRAF);
  _rafLoop();
}

function _rafLoop(){
  if(!_canvasCtx){ _gachaRAF=null; return; }
  _gachaRAF=requestAnimationFrame(_rafLoop);
  var ctx=_canvasCtx;
  ctx.clearRect(0,0,_canvasEl.width,_canvasEl.height);
  if(_canvasPhase==='vortex') _tickVortex(ctx);
  if(_canvasPhase==='burst')  _tickBurst(ctx);
}

function _startVortex(duration){
  _canvasPhase='vortex';
  _vortexParticles=[];
  var t0=performance.now();
  var colors=['#9060ff','#c080ff','#6030c0','#ffffff','#4020a0','#e0c0ff'];
  for(var i=0;i<80;i++){
    var angle=Math.random()*Math.PI*2;
    _vortexParticles.push({
      angle:angle,
      radius:120+Math.random()*260,
      speed:0.6+Math.random()*1.2,
      size:1+Math.random()*2.5,
      color:colors[Math.floor(Math.random()*colors.length)],
      alpha:0.3+Math.random()*0.7,
      startT:t0+Math.random()*700
    });
  }
  setTimeout(function(){ if(_canvasPhase==='vortex') _canvasPhase='idle'; }, duration);
}

function _tickVortex(ctx){
  var now=performance.now();
  _vortexParticles.forEach(function(p){
    if(now<p.startT) return;
    p.radius=Math.max(0,p.radius-p.speed*2.2);
    p.angle+=p.speed*0.035;
    var x=_vortexCX+Math.cos(p.angle)*p.radius;
    var y=_vortexCY+Math.sin(p.angle)*p.radius*0.55;
    ctx.beginPath();
    ctx.arc(x,y,p.size,0,Math.PI*2);
    ctx.fillStyle=p.color;
    ctx.globalAlpha=p.alpha*Math.min(1,p.radius/20);
    ctx.fill();
  });
  ctx.globalAlpha=1;
  // Drive pinpoint brightness
  var pp=document.getElementById('es-pinpoint');
  if(pp&&_vortexParticles.length){
    var avgR=_vortexParticles.reduce(function(s,p){return s+p.radius;},0)/_vortexParticles.length;
    var prog=Math.max(0,1-(avgR/260));
    pp.style.opacity=Math.min(1,prog*2).toFixed(2);
    var sz=2+prog*18;
    pp.style.width=sz+'px'; pp.style.height=sz+'px';
    pp.style.marginLeft=(-sz/2)+'px'; pp.style.marginTop=(-sz/2)+'px';
  }
}

function _startBurst(bestRarity){
  _canvasPhase='burst';
  _burstParticles=[];
  // Round 62: burst palettes keyed to the 7-tier gem rarity. Each
  // palette is the gem hue + lighter/darker variants + white sparkle.
  var palettes={
    ruby:      ['#c04040','#e07070','#a02828','#ffc0c0','#ffffff'],
    emerald:   ['#50b060','#80e090','#308040','#c0ffd0','#ffffff'],
    sapphire:  ['#5080d0','#80a8ff','#2060a0','#c0d8ff','#ffffff'],
    turquoise: ['#50b0a8','#80e0d8','#308878','#c0fff0','#ffffff'],
    amethyst:  ['#a060d0','#c080ff','#7838a8','#e0c0ff','#ffffff'],
    topaz:     ['#c0a040','#e0c060','#a07820','#ffe080','#ffffff'],
    black_opal:['#8888c0','#b0b0e0','#5858a0','#c0c0ff','#ffffff']
  };
  var pal=palettes[bestRarity]||palettes.ruby;
  for(var i=0;i<55;i++){
    var angle=Math.random()*Math.PI*2;
    var spd=3+Math.random()*8;
    _burstParticles.push({
      x:_vortexCX,y:_vortexCY,
      vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd,
      size:1.5+Math.random()*4,alpha:1,
      color:pal[Math.floor(Math.random()*pal.length)],
      decay:0.012+Math.random()*0.018,
      gravity:0.12+Math.random()*0.08
    });
  }
}

function _tickBurst(ctx){
  var allDead=true;
  _burstParticles.forEach(function(p){
    if(p.alpha<=0) return;
    allDead=false;
    p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity;
    p.vx*=0.97; p.vy*=0.97; p.alpha-=p.decay;
    if(p.alpha<0) p.alpha=0;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fillStyle=p.color; ctx.globalAlpha=p.alpha; ctx.fill();
  });
  ctx.globalAlpha=1;
  if(allDead) _canvasPhase='idle';
}

function _shockwave(bestRarity){
  var sw=document.getElementById('es-shockwave');
  if(!sw) return;
  var col=RARITY_COL[bestRarity]||'#fff';
  sw.style.borderColor=col;
  sw.style.boxShadow='0 0 20px '+col;
  sw.style.display='block'; sw.style.opacity='0';
  sw.style.animation='none'; void sw.offsetWidth;
  sw.style.animation='es-shockwave .85s ease-out forwards';
  setTimeout(function(){ sw.style.display='none'; },900);
}

function _pinpointFlash(){
  var pp=document.getElementById('es-pinpoint');
  if(!pp) return;
  pp.style.transition='all .08s';
  pp.style.width='60px'; pp.style.height='60px'; pp.style.opacity='1';
  setTimeout(function(){ if(!pp)return; pp.style.transition='all .4s'; pp.style.width='2px'; pp.style.height='2px'; pp.style.opacity='0'; },120);
}

function _summonsTeardown(){
  if(_gachaRAF){ cancelAnimationFrame(_gachaRAF); _gachaRAF=null; }
  _canvasCtx=null; _canvasEl=null; _canvasPhase='idle';
  _summoningActive=false; // always reset on close
}

function _setSummoningButtons(locked){
  // Round 60: selector updated to the new sibling-style button class.
  var btns=document.querySelectorAll('.es-summon-btn');
  btns.forEach(function(btn){
    btn.disabled=locked;
    btn.style.cursor=locked?'not-allowed':'';
    btn.style.pointerEvents=locked?'none':'';
  });
}

// ── Pull ──
function doEternalPull(count){
  // Round 60: panel-aware. If the panel isn't open, open it first
  // (the Shard Well's SUMMON button used to call this directly with
  // no count, NaN-ing the math — now it routes through openSummonsPanel
  // first, but this guard keeps the old call site safe too).
  count = count || 1;
  var panel = document.getElementById('summons-panel-bg');
  if(!panel || !panel.classList.contains('show')){
    openSummonsPanel();
    return;
  }
  if(_summoningActive) return; // locked during animation
  // Round 60: discounted 10-pull (900 vs 1000). Single pull stays 100.
  var cost = (count === 10) ? SUMMONS_COST_10 : SUMMONS_COST_1 * count;
  if((PERSIST.soulShards||0)<cost){
    var st=document.getElementById('es-stage');
    if(st) st.innerHTML='<div style="color:#f06060;font-size:11px;letter-spacing:2px;">NOT ENOUGH SHARDS · NEED '+cost+'</div>';
    return;
  }

  // Lock buttons with SUMMONING... feedback
  _summoningActive=true;
  _setSummoningButtons(true);
  PERSIST.soulShards-=cost; savePersist();
  var el=document.getElementById('summons-shards-count');
  if(el) el.textContent=PERSIST.soulShards;

  // Round 62i: reset the stage's inline height before the new pull
  // begins. _dealCards sets style.height to fit its card layout
  // (taller for 10-pulls than singles) — without clearing it, a
  // follow-up 1-pull would inherit the previous 10-pull's height,
  // stretching the rings/particle animation that plays from the
  // centre of the parent es-stage-wrap. Clearing returns the stage
  // to its CSS min-height:200px, recentring the spin/burst FX.
  var _stage = document.getElementById('es-stage');
  if(_stage){ _stage.style.height=''; }

  var pool=buildGachaPool();
  _gachaResults=[];
  // Round 62: 7-tier roll table (gem palette). Numbers are cumulative
  // upper bounds against Math.random() — must stay <=1 and sum to 1
  // in delta form. Total: 35+25+18+12+7+2.5+0.5 = 100.
  // If a tier's slice happens to have no creatures in the current pool,
  // the picker falls back to the full pool so the player still gets a
  // result (otherwise rolling Black Opal pre-content would freeze).
  var bestRarity='ruby';
  for(var i=0;i<count;i++){
    var roll=Math.random();
    var rarity =
      roll < 0.005 ? 'black_opal' :
      roll < 0.030 ? 'topaz'      :
      roll < 0.100 ? 'amethyst'   :
      roll < 0.220 ? 'turquoise'  :
      roll < 0.400 ? 'sapphire'   :
      roll < 0.650 ? 'emerald'    :
                     'ruby';
    if((RARITY_ORDER[rarity]||6)<(RARITY_ORDER[bestRarity]||6)) bestRarity=rarity;
    var rPool=pool.filter(function(e){return e.rarity===rarity;});
    if(!rPool.length) rPool=pool;
    var picked=rPool[Math.floor(Math.random()*rPool.length)];
    var isNew=!PERSIST.unlockedChamps||!PERSIST.unlockedChamps.includes(picked.id);
    if(isNew){ if(!PERSIST.unlockedChamps) PERSIST.unlockedChamps=[]; PERSIST.unlockedChamps.push(picked.id); }
    else{ PERSIST.champDupes=PERSIST.champDupes||{}; PERSIST.champDupes[picked.id]=(PERSIST.champDupes[picked.id]||0)+1; }
    _gachaResults.push({c:CREATURES[picked.id],rarity:rarity,isNew:isNew,dupes:(PERSIST.champDupes&&PERSIST.champDupes[picked.id])||0,id:picked.id});
  }
  savePersist();

  // Speed up rings for compression feel
  var r1=document.getElementById('es-ring1'),r2=document.getElementById('es-ring2');
  if(r1) r1.style.animationDuration='1.8s';
  if(r2) r2.style.animationDuration='1.1s';

  // Clear stage
  var st=document.getElementById('es-stage');
  // Round 60: dropped es-bg-pulse animation (removed from CSS in the
  // same round). Plain "BINDING SOULS..." status text — the canvas
  // vortex behind it provides motion already.
  if(st){ st.style.display='flex'; st.style.alignItems='center'; st.style.justifyContent='center'; st.innerHTML='<div style="color:#9070c0;font-size:11px;letter-spacing:3px;">BINDING SOULS...</div>'; }

  // Vortex stream inward (2.5s)
  _startVortex(2500);

  // t=2.3s pinpoint grows bright
  setTimeout(function(){
    var pp=document.getElementById('es-pinpoint');
    if(pp){ pp.style.transition='all .2s'; pp.style.width='22px'; pp.style.height='22px'; pp.style.opacity='1'; }
  },2300);

  // t=2.6s EXPLOSION
  setTimeout(function(){
    _pinpointFlash();
    _shockwave(bestRarity);
    _startBurst(bestRarity);
    if(r1) r1.style.animationDuration='18s';
    if(r2) r2.style.animationDuration='12s';
    _dealCards();
  },2600);
}

function _dealCards(){
  var st=document.getElementById('es-stage');
  if(!st) return;
  st.innerHTML=''; st.style.display='block'; st.style.position='relative'; st.style.width='100%';

  // Round 61: card size bumped (180×260, was 158×220) so the creature
  // sprite can be the focal element at near-combat scale instead of
  // the tiny 44-56px badge it used to be.
  var cardW=180,cardH=260,gapX=14,gapY=20;
  var stW=st.offsetWidth||700;

  // Round 62: legendary partition replaced with "spotlight" tier
  // partition. Topaz + Black Opal pulls land in the centred top row
  // (the old legendary slot) — they're the new pinnacle band. All
  // other tiers fall into the grid below. RARITY_SPOTLIGHT=3 picks
  // the top tier; we promote spotlight=3 to the centred row.
  var legs=[], rest=[];
  _gachaResults.forEach(function(r,i){
    var sp = RARITY_SPOTLIGHT[r.rarity] || 0;
    (sp >= 3 ? legs : rest).push({r:r,i:i});
  });

  // Calculate positions:
  // Row 0: legendaries centred (if any)
  // Row 1+: rest in a grid below
  var legRowH = legs.length ? cardH+gapY : 0;
  var restCols = rest.length<=5 ? rest.length : Math.min(5,Math.ceil(Math.sqrt(rest.length*1.5)));
  var restRows = rest.length ? Math.ceil(rest.length/restCols) : 0;
  var restW    = rest.length ? restCols*(cardW+gapX)-gapX : 0;
  var totalH   = legRowH + restRows*(cardH+gapY);
  st.style.height=(totalH+16)+'px';

  // Centre of stage — blast origin
  var cx=stW/2-cardW/2;
  var cy=(totalH/2)-cardH/2;

  function makeCard(entry, finalX, finalY, isLeg){
    var r=entry.r, i=entry.i;
    var rc=RARITY_COL[r.rarity]||'#888';

    var wrap=document.createElement('div');
    wrap.className='es-card-wrap'; wrap.id='es-card-'+i;
    wrap.style.left=finalX+'px'; wrap.style.top=finalY+'px';
    wrap.style.transform='translate('+(cx-finalX)+'px,'+(cy-finalY)+'px) scale(0.06)';
    wrap.style.opacity='0';

    // Round 62: sprite size now keys off RARITY_SPOTLIGHT bucket
    // rather than a single "isLeg" boolean — Topaz/Black Opal get
    // the 144px focal-sprite treatment, everything else stays at
    // 120px. Same flip-x convention (revealed creature is YOUR
    // champion, faces right).
    var spriteSize = isLeg ? '144px' : '120px';
    // Round 62d: gem-name text label removed from the card face. The
    // border / inset glow / underline-pill ARE the rarity language;
    // printing "RUBY"/"EMERALD"/etc was redundant. A short coloured
    // underline below the name reinforces the tier without naming it.
    wrap.innerHTML=
      '<div class="es-card-inner" id="es-inner-'+i+'">'
        +'<div class="es-back" style="transform:rotateY(180deg);border-color:'+rc+'60;box-shadow:0 0 18px '+rc+'30,inset 0 0 12px '+rc+'15;">'
          +'<div style="font-size:34px;color:'+rc+'50;">🔮</div>'
          +'<div style="color:'+rc+'60;font-size:9px;letter-spacing:2px;">✦</div>'
        +'</div>'
        +'<div class="es-face" style="transform:rotateY(0deg);background:'+RARITY_BG[r.rarity]+';border-color:'+rc+';box-shadow:0 0 24px '+rc+'50,inset 0 0 20px '+rc+'12;">'
          +'<div style="display:flex;align-items:center;justify-content:center;flex:1;">'+creatureImgHTML(r.c.id, r.c.icon, spriteSize, 'flip-x')+'</div>'
          +'<div style="color:#e8d0a0;font-size:12px;letter-spacing:.5px;text-align:center;line-height:1.2;">'+r.c.name+'</div>'
          +'<div style="height:3px;background:'+rc+';width:36px;border-radius:1.5px;margin:5px auto 0;opacity:.9;"></div>'
          +'<div style="margin-top:5px;padding:3px 8px;border-radius:10px;background:'+(r.isNew?'#0d200d':'#1e0b00')+';color:'+(r.isNew?'#60e060':'#a06040')+';font-size:9px;letter-spacing:1px;">'+(r.isNew?'✦ NEW':'DUPLICATE')+'</div>'
        +'</div>'
      +'</div>';

    st.appendChild(wrap);
    return {wrap:wrap, rc:rc, isLeg:isLeg, idx:i, rarity:r.rarity};
  }

  // All cards with their positions
  var allCards=[];

  // Legendaries — centred top row
  var legTotalW=legs.length*(cardW+gapX)-gapX;
  legs.forEach(function(entry,j){
    var finalX=(stW-legTotalW)/2 + j*(cardW+gapX);
    var finalY=0;
    allCards.push(makeCard(entry, finalX, finalY, true));
  });

  // Rest — grid below legendaries
  rest.forEach(function(entry,j){
    var col=j%restCols, row=Math.floor(j/restCols);
    var restLeft=(stW-restW)/2;
    var finalX=restLeft+col*(cardW+gapX);
    var finalY=legRowH+row*(cardH+gapY);
    allCards.push(makeCard(entry, finalX, finalY, false));
  });

  // Erupt all cards — legends slightly delayed so they feel like the headline
  allCards.forEach(function(card, seq){
    var delay = card.isLeg
      ? rest.length*50 + 120  // after rest cards, all legs together
      : seq*50;

    setTimeout(function(){
      card.wrap.style.filter='brightness(4)';
      card.wrap.style.transition='transform .48s cubic-bezier(.15,.8,.25,1.05),opacity .2s ease,filter .28s ease';
      card.wrap.style.transform='translate(0,0) scale('+(card.isLeg?'1.08':'1')+')';
      card.wrap.style.opacity='1';
      setTimeout(function(){
        card.wrap.style.filter='';
        var inner=document.getElementById('es-inner-'+card.idx);
        if(inner){
          // Round 62: glow strength keys off RARITY_SPOTLIGHT bucket
          // instead of the retired common/uncommon/rare/legendary names.
          // 3 = spotlight (topaz / black opal), 2 = strong (amethyst),
          // 1 = small (sapphire / turquoise), 0 = none (ruby / emerald).
          var sp = (typeof RARITY_SPOTLIGHT !== 'undefined' ? RARITY_SPOTLIGHT[card.rarity] : 0) || 0;
          inner.style.filter =
            sp === 3 ? 'drop-shadow(0 0 40px '+card.rc+') drop-shadow(0 0 100px '+card.rc+'a0) drop-shadow(0 0 160px '+card.rc+'60)' :
            sp === 2 ? 'drop-shadow(0 0 16px '+card.rc+') drop-shadow(0 0 45px '+card.rc+'50)' :
            sp === 1 ? 'drop-shadow(0 0 10px '+card.rc+'80)' :
                       '';
        }
      }, 300);

      // Spotlight tier (topaz / black opal): particles from card after
      // glow settles. Palette is the card's own gem hue so each tier
      // bursts in its own colour (topaz blooms gold, black opal violet).
      if(card.isLeg){
        setTimeout(function(){
          var lr=card.wrap.getBoundingClientRect();
          _legParticles(lr.left+lr.width/2, lr.top+lr.height/2, card.rc);
        }, 450);
      }
    }, delay);
  });

  setTimeout(function(){
    _refreshSummonsPoolGrid();
    _summoningActive=false;
    _setSummoningButtons(false);
    // Round 60: live-update the shard counter (in case it changed
    // via _devGiveShards or background tick mid-animation) and the
    // shard well's summons banner under the town nav.
    var ct=document.getElementById('summons-shards-count');
    if(ct) ct.textContent = (PERSIST.soulShards||0);
    if(typeof refreshSummonsBanner === 'function') refreshSummonsBanner();
    // Round 62i: refresh the nav-bar currencies (gold + shards) so
    // the top-bar shard counter reflects the spend immediately, and
    // refresh the shard well panel if it's open underneath — the
    // sw-summon-cost text was painting stale shard amounts otherwise.
    if(typeof refreshNavCurrencies === 'function') refreshNavCurrencies();
    var swPanel = document.getElementById('shard_well-panel-bg');
    if(swPanel && swPanel.classList.contains('show') && typeof refreshShardWellPanel === 'function'){
      refreshShardWellPanel();
    }
  }, allCards.length*50+1200);
}


// Stubs — kept for any lingering references but logic moved into _dealCards
function revealAllSummons(){ /* no-op — explosion IS the reveal */ }
function _flipCard(idx){ /* no-op — cards erupt face-up */ }
function _legendaryReveal(idx){ /* no-op — handled in _dealCards */ }

function _legParticles(cx,cy,baseCol){
  // Round 62: parameterised on the card's gem colour. Pre-Round-62
  // this function was hardcoded to gold (the old legendary palette).
  // Now spotlight cards come in two flavours (topaz gold, black opal
  // violet-grey), so the palette derives from baseCol with a lighter
  // tint, a darker tint, and white sparkle. Falls back to gold if no
  // colour is provided so older call sites still light up.
  var pal = baseCol
    ? [baseCol, baseCol+'80', baseCol+'40', '#ffffff', baseCol+'c0']
    : ['#ffd040','#ffb000','#fff0a0','#ff8000','#ffffff','#ffe080'];
  _canvasPhase='burst'; _burstParticles=[];
  for(var i=0;i<65;i++){
    var angle=Math.random()*Math.PI*2;
    var spd=4+Math.random()*11;
    _burstParticles.push({
      x:cx,y:cy,vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd-2,
      size:1.5+Math.random()*5,alpha:1,
      color:pal[Math.floor(Math.random()*pal.length)],
      decay:0.010+Math.random()*0.015,
      gravity:0.10+Math.random()*0.08
    });
  }
}

// Round 60: testAddShards function removed. Use _devGiveShards(n)
// from the console instead. The hardcoded "+500 Shards" button is
// gone from the panel.

function _refreshSummonsPoolGrid(){
  var grid=document.getElementById('es-pool-grid'); if(!grid) return;
  var lbl=document.getElementById('es-pool-label');
  var pool=buildGachaPool();
  pool.sort(function(a,b){return (RARITY_ORDER[a.rarity]||3)-(RARITY_ORDER[b.rarity]||3)||(a.name<b.name?-1:1);});
  if(lbl) lbl.textContent='SUMMONABLE SOULS · ' + pool.length;
  grid.innerHTML=_buildPoolGrid(pool);
}

// ═══════════════════════════════════════════════════════
// TUTORIAL SYSTEM
// ═══════════════════════════════════════════════════════

var TUTORIALS = {
  // Round 67p: Kaine's in-character intro for the deck editor, fired
  // the first time the player opens it (regardless of quest state).
  // Replaces the old `deck_builder_intro` and the retired
  // fragment-cost copy. Kaine now teaches the full editor — UI, filter
  // chips, STR/Dead Weight mechanic, ascension sharing, and the
  // Sanctum's role — all in voice.
  sanctum_deck_edit: {
    title:'Kaine (Sanctum Keeper)',
    isNpc: true,
    pages:[
      {body:'My lord. A moment, if you would spare it for one so small. I am Kaine, of the Sanctum. I felt your hand upon the deck and could not, in good conscience, leave you here alone with the work.', tip:null},
      {body:'The deck rests to your left, my lord. The library waits in the centre. A card chosen on either side opens itself to the right, for your inspection. To add a copy from the library, the green <span style="color:#7fc06a;">+</span>. To strip one from the deck, the red <span style="color:#d05858;">−</span>. The work is quiet. There is no cost. Take and give as suits you.', tip:null},
      {body:'For sifting the library, my lord, the chips above it. <span style="color:#d4a843;">SOURCE</span> divides cards by their origin. <span style="color:#d4a843;">CHAMPION</span> shows what is native to your champion. <span style="color:#d4a843;">UNIVERSAL</span>, the common cards every champion may hold: Strike, Brace, the Dead Weight. <span style="color:#d4a843;">SHARED</span> opens once your champion has ascended. <span style="color:#d4a843;">COLLECTION</span> shows what you have gathered from the field. The <span style="color:#d4a843;">TYPE</span> chips and the <span style="color:#d4a843;">Search</span> box narrow further. Combine them as you will.', tip:null},
      {body:'Permit me to speak plainly of the bond. Your champion\'s <span style="color:#e88060;">STR</span> sets the size of the deck. One point, one slot. Strength swells, the cycle widens; strength fails, it narrows. Such is the bond between flesh and card, my lord.', tip:null},
      {body:'Slots you do not fill yourself do not remain empty. The deck supplies its own, and we call them <strong>Dead Weight</strong>. The orange-glowing rows, my lord. A [Sorcery] card by nature. When drawn, it spends every drop of mana you carry for a single new card. Carry no mana when it arrives, and it falters. A quiet pause in the breath of your hand.', tip:null},
      {body:'When the moment finds you, my lord, come and see me at the Sanctum. Ascension, the binding of relics, the records of every deck your champions have drawn. All of it rests beneath my care. Ascend, and the <span style="color:#d4a843;">SHARED</span> library opens, the work of other ascended champions made yours to borrow. I would not wish your champion to walk far without the full reach of what they may become. The path is short. I am patient.', tip:null},
    ]
  },
  // Round 67o: combat_intro removed — the scripted wolf-vs-goblin
  // tutorial (tutorial.js) now teaches all combat basics. combat_mana
  // was an orphan entry from the same era (never invoked from any
  // call site); removed alongside.
  town_intro: {
    title:'Welcome to Town',
    isNpc: true,
    pages:[
      {body:'The Town is your base between runs. Buildings provide persistent benefits: store materials, track quests, catalogue creatures, and more. Some buildings are available immediately, others unlock as you progress.',
       tip:null},
      {body:'Gold earned during runs is banked when a run ends. Gold is spent to unlock buildings, purchase items, and claim rewards. Buildings have an XP track. They level up from area clears, unlocking new features at higher levels.',
       tip:null},
    ]
  },
  vault_intro: {
    title:'Shtole (Vault Keeper)',
    isNpc: true,
    pages:[
      {body:'"Ah, welcome. This is the Vault. Everything you gather out there, materials, resources, it all comes here. I keep it safe. I keep it organised. Nothing goes missing."'},
      {body:'"Materials come from the areas you explore. Each area drops different things. The rarer the material, the harder the area. I sort them for you. You just need to check in after your runs."'},
      {body:'"One thing to watch. Storage has limits. If the shelves are full, I cannot accept more. Come back often, spend what you have at the Forge, and we will not have problems. ...I promise nothing has gone missing."'},
    ]
  },
  adventurers_hall_intro: {
    title:'Leona (Guild Girl)',
    isNpc: true,
    pages:[
      {body:'"Oh! You\'re here for the first time! Welcome to the Adventurer\'s Hall! This is where all the action gets... coordinated. By me. Professionally."'},
      {body:'"The QUESTS tab has bounties pinned to the board. Pick one that matches where you\'re heading, go complete it, then come back to claim your reward. Simple! I mean... standard procedure."'},
      {body:'"The ACHIEVEMENTS tab tracks your overall progress. Some achievements reward gold when you hit milestones. I keep very thorough records. Very thorough."'},
      {body:'"Once the Hall levels up, I\'ll open EXPEDITIONS too. You can send your champions on timed missions for materials and experience while you focus on other things. I\'ll keep track of everything. That\'s my job. Which I love."'},
    ]
  },
  forge_intro: {
    title:"M'bur (Forge Keeper)",
    isNpc: true,
    pages:[
      {body:'"Welcome to the Forge. I turn ore and rot into things that matter. Bring me materials and I\'ll make a relic. Small object, big consequence."', tip:null},
      {body:'Each recipe lists its materials and craft time. The Forge has up to three slots for parallel crafts. <span style="color:#d4a843;">Lv.1</span> opens the first slot, <span style="color:#d4a843;">Lv.3</span> the second, <span style="color:#d4a843;">Lv.5</span> the third. Slots run independently; each one finishes on its own timer.', tip:null},
      {body:'Pick a recipe on the left to inspect it on the right. Materials show <span style="color:#7fc06a;">✓</span> when you have enough, <span style="color:#d05858;">✗</span> when you don\'t. Click <span style="color:#e87040;">⚒ BEGIN FORGING</span> to start a craft. Materials are consumed immediately. Cancelling an in-progress craft does NOT refund materials.', tip:null},
      {body:'When a craft completes, the slot pulses and a <span style="color:#f0a53a;">COLLECT</span> button appears. Collected relics enter your inventory; equip them at the Sanctum on any Ruby+ ascended champion. Their effects fire automatically in combat.', tip:null},
    ]
  },
  shrine_intro: {
    title:'The Shrine',
    isNpc: true,
    pages:[
      {body:'The Shrine grants one blessing per run, applied at run start. Available blessings are gated by Shrine level. Slotting a higher-tier gem unlocks higher-level blessings. Blessings are not permanent. They apply only to the run in which they are granted.',
       tip:null},
    ]
  },
  bestiary_intro: {
    title:'Hoot (Archivist)',
    isNpc: true,
    pages:[
      {body:'"Ah! A visitor! Welcome to the Bestiary. I\'m Hoot. I catalogue things. Every creature, every location, every little detail. It\'s... it\'s what I do. Hoo."'},
      {body:'"When you encounter a creature in combat, it appears here automatically. You can see its stats, its cards, its innate ability. Everything you\'ve learned about it. Knowledge is survival out there."'},
      {body:'"Each creature has CHALLENGES. Defeat enough of them and you\'ll earn gold rewards. Complete all four challenges and you\'ll receive something... special. Very motivating for field work."'},
      {body:'"The LOCATIONS tab shows every area you\'ve explored. The GLOSSARY tab explains all the keywords you\'ll see on cards: burns, poisons, shields, all of it. I organised them myself. Twice."'},
    ]
  },
  market_intro: {
    title:'The Merchant',
    isNpc: true,
    pages:[
      {body:'"Ah, a customer! Welcome to my humble establishment. I deal in materials, knowledge, and... occasionally, things of great rarity. Everything has a price."'},
      {body:'"The WARES tab has my regular stock: materials, XP tomes, building scrolls. Stock refreshes every hour, so check back often. Once something sells out, it\'s gone until the next restock."'},
      {body:'"At Market Level 3, I\'ll start offering DEALS, bundled goods at a discount. And at Level 5... well, let\'s just say I have connections. The RARE FINDS shelf is worth saving for."'},
      {body:'"A word of advice: gold is easy to earn, harder to keep. Buy what you need, save for what you want. The rare shelf rotates every 24 hours. Miss something good? Could be weeks before I find another."'},
    ]
  },
  sanctum_intro: {
    title:'Keeper (Sanctum)',
    isNpc: true,
    pages:[
      {body:'"You grace the Sanctum. I am the Keeper, and I tend the rites that turn the merely strong into the truly ascended. Your champions, my lord, they sing already, but the choir can be made deeper."'},
      {body:'"The OVERVIEW shall show their stats, their level, the mastery they have earned. Mastery is no purchase, my lord. It is given by the act of the champion themselves; by combat, by trial, by their own bright wills."'},
      {body:'"When the mastery is full and the proper gem is yours, the ASCEND rite begins. Their level returns to one, but their base will rise, their growth will quicken, a new RELIC SLOT will open as the gem-light dictates. I have seen it many times. It is always right."'},
      {body:'"The RELICS tab is where you bind these treasures into the slots you have earned. A word, my lord. A removal undoes the binding utterly. The relic is consumed; nothing returns. Choose with the certainty I see in you."'},
    ]
  },
  board_intro: {
    title:"The Adventurer's Board",
    isNpc: true,
    pages:[
      {body:'The Board offers quests with specific completion conditions. One quest may be active at a time. Quest progress is tracked across runs. Completing a quest awards its listed reward: gold, <span style="color:#9a7030;">Mastery XP</span>, <span style="color:#2980b9;">💎 Gem Shards</span>, or Materials. Incomplete quests can be abandoned; the slot refreshes on a timer.',
       tip:null},
    ]
  },
  shard_well_intro: {
    title:'Shard Master (The Well)',
    isNpc: true,
    pages:[
      {body:'"You came back. They knew you would. The well drips Soul Shards, slowly. Up to a cap. Then it stops, until you take what is yours."',
       tip:null},
      {body:'"Three slots. Three champions, if you bring them. Their stats... bend the well. AGI quickens it. WIS deepens its cap. STR feeds the well\'s own learning, and from that, points to spend. Permanent points. The well grows when champions stand near it long enough."',
       tip:null},
      {body:'"The Eternal Summons feeds from this well. Reach 100 Soul Shards and a summons may be drawn. The result is one of those you have already faced. One who came close, perhaps too close. Duplicates do not waste. They make the original... stronger."',
       tip:null},
      {body:'"Recalibrate any time. The gold cost is small. The well does not mind being asked to listen again. ...Most things mind that. The well does not."',
       tip:null},
    ]
  },
  arena_intro: {
    title:'Theo (The Arena)',
    isNpc: true,
    pages:[
      {body:'"You\'re here. Good. The arena does three things. One: the <strong>Daily Challenge</strong>. Beat the day\'s opponent, take the purse. You can retry as many times as you like; once you win the gates close on that one until tomorrow. Reward scales with the opponent\'s level."',
       tip:null},
      {body:'"Two: <strong>Betting</strong>. Stick a champion in a slot, pay 100g, they sit in the stands and bet on the matches happening down on the sand. Sometimes they win, sometimes they lose. They walk out when their purse is empty, when they\'ve won too much for the bookmakers\' liking, or when their twelve hours are up. Whatever they leave with is yours. No experience, no mastery, just coin."',
       tip:null},
      {body:'"Stats decide how it goes. <span style="color:#9ad8e8;">WIS</span> sets how often they pick a winner, and how much they take when they do. <span style="color:#e88060;">STR</span> sets how often they shrug off a loss and softens the blow when they don\'t. <span style="color:#9adc7e;">AGI</span> sets how fast they bet. More rounds, more chances. Pick accordingly."',
       tip:null},
      {body:'"Pull them out early if you want. They keep what\'s in their purse. No entry refund, that coin\'s in the arena\'s pocket the moment they sit down. Don\'t blame me. I just take the cut."',
       tip:null},
      // Round 58: page 5 stays in Theo's voice. No mention of "codes"
      // or "tabs" (meta UI concepts). Theo explains the duel side
      // in-universe: people come looking for fights, you answer or
      // don't. Hall quests pay what the quest pays. Casual duels are
      // for sport. Player figures out the UI from the panel itself.
      {body:'"And the Duel side. Folks come around looking for a fight. Friends, strangers, whoever. They make themselves known, you decide if you answer. The Hall sends its own sometimes. Those pay what the quest says. Everything else is for sport. No coin, no consequence. Bring what you\'ve got."',
       tip:null},
    ]
  },
  // Round 67p: the old `sanctum_deck_edit` entry that lived here
  // described the retired Card-Fragment Sanctum (per-card costs, swap
  // menus). Removed because (a) the new free-form deck builder doesn't
  // charge for edits, and (b) this duplicate key was silently
  // clobbering Kaine's NPC intro defined earlier in the same object
  // literal (last-key-wins).
};

// Seen tutorials stored in PERSIST
var _tutQueue=[];   // pending tutorial ids to show in sequence
var _tutCurrent=null;
var _tutPage=0;

function showTutorial(id){
  if(!SETTINGS.tutorial) return;
  // Round 66: suppress per-system tutorials while the scripted
  // wolf-vs-goblin combat tutorial is running — the mysterious
  // figure handles ALL teaching during that flow, and stacking
  // a second tutorial on top would be chaos.
  if(typeof isTutorialActive === 'function' && isTutorialActive()) return;
  if(!TUTORIALS[id]) return;
  if(PERSIST.seenTutorials[id]) return; // already seen
  // Queue it if one is already showing
  if(_tutCurrent){
    if(_tutQueue.indexOf(id)===-1) _tutQueue.push(id);
    return;
  }
  _openTutorial(id);
}

function showBuildingTutorial(id){
  // Always show — ignores seen state, this is the ? button
  var tutId=id+'_intro';
  if(!TUTORIALS[tutId]) return;
  _tutCurrent=null; // force reopen even if same one showing
  _openTutorial(tutId, true);
}

function _openTutorial(id, force){
  if(!force&&PERSIST.seenTutorials[id]) return;
  var tut=TUTORIALS[id]; if(!tut) return;
  _tutCurrent=id;
  _tutPage=0;
  _renderTutPage();
  document.getElementById('tutorial-overlay').style.display='flex';
}

// ══════════════════════════════════════════════════════════════
// SHARED NPC TYPEWRITER
// ══════════════════════════════════════════════════════════════
// npcTypewriter(element, text, {pitch, speed, onComplete})
// npcTypewriterStop()

var _npcTW = { timer:null, blips:[], element:null };

function npcTypewriter(el, text, opts){
  if(!el || !text) return;
  opts = opts || {};
  npcTypewriterStop();
  _npcTW.element = el;
  el.textContent = '';

  var pitch = opts.pitch || 1.0;
  var speed = opts.speed || 28;
  var charIdx = 0;
  var plainText = text.replace(/<[^>]*>/g, '');
  var isHtml = text !== plainText;

  var blipAudio = null;
  try { blipAudio = new Audio('assets/audio/sfx/chime-blip.mp3'); blipAudio.volume = 0.15; } catch(e){}

  _npcTW.timer = setInterval(function(){
    if(charIdx >= plainText.length){
      npcTypewriterStop();
      if(isHtml) el.innerHTML = text;
      else el.textContent = plainText;
      if(opts.onComplete) opts.onComplete();
      return;
    }
    charIdx++;
    el.textContent = plainText.substring(0, charIdx);
    if(blipAudio && charIdx % 3 === 0 && plainText[charIdx-1] !== ' '){
      var b = new Audio('assets/audio/sfx/chime-blip.mp3');
      b.volume = 0.1 + Math.random() * 0.08;
      b.playbackRate = pitch + (Math.random() * 0.12 - 0.06);
      b.play().catch(function(){});
      _npcTW.blips.push(b);
    }
  }, speed);

  el.onclick = function(){
    npcTypewriterStop();
    if(isHtml) el.innerHTML = text;
    else el.textContent = plainText;
    el.onclick = null;
    if(opts.onComplete) opts.onComplete();
  };
}

function npcTypewriterStop(){
  if(_npcTW.timer){ clearInterval(_npcTW.timer); _npcTW.timer = null; }
  _npcTW.blips.forEach(function(b){ try{ b.pause(); b.currentTime = 0; }catch(e){} });
  _npcTW.blips = [];
  if(_npcTW.element) _npcTW.element.onclick = null;
}

// Legacy alias
function _stopTypewriter(){ npcTypewriterStop(); }

function _renderTutPage(){
  var tut=TUTORIALS[_tutCurrent]; if(!tut) return;
  var page=tut.pages[_tutPage];
  var iconEl=document.getElementById('tut-icon');

  // Derive NPC sprite: explicit icon > building sprite > Hoot default
  var sprite = 'hoot_archivist';
  var pitch = 1.4; // Hoot's default pitch
  if(tut.icon){
    sprite = tut.icon;
  } else {
    // Try to match building from tutorial ID (e.g. 'vault_intro' → 'vault', 'sanctum_deck_edit' → 'sanctum')
    var parts = _tutCurrent.split('_');
    for(var pi = parts.length - 1; pi >= 1; pi--){
      var tryId = parts.slice(0, pi).join('_');
      if(BUILDINGS[tryId] && BUILDINGS[tryId].sprite){
        sprite = BUILDINGS[tryId].sprite;
        if(BUILDINGS[tryId].npc && BUILDINGS[tryId].npc.pitch) pitch = BUILDINGS[tryId].npc.pitch;
        break;
      }
    }
  }

  if(tut.isNpc){
    iconEl.innerHTML='<img src="assets/creatures/'+sprite+'.png" style="width:120px;height:120px;image-rendering:pixelated;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5));transform:scaleX(-1);" onerror="this.parentNode.textContent=\'🦉\'">';
  } else {
    iconEl.textContent=tut.icon||'📖';
  }
  document.getElementById('tut-title').textContent=tut.title;
  var stepEl=document.getElementById('tut-step');
  var multi=tut.pages.length>1;
  stepEl.textContent=multi?'Page '+(_tutPage+1)+' of '+tut.pages.length:'';
  var nextBtn=document.getElementById('tut-next-btn');
  nextBtn.style.display=multi&&_tutPage<tut.pages.length-1?'inline-block':'none';

  var bodyEl=document.getElementById('tut-body');
  npcTypewriter(bodyEl, page.body, {pitch: pitch});
}

function tutorialNext(){
  _stopTypewriter();
  var tut=TUTORIALS[_tutCurrent]; if(!tut) return;
  if(_tutPage<tut.pages.length-1){ _tutPage++; _renderTutPage(); }
  else dismissTutorial();
}

function dismissTutorial(){
  _stopTypewriter();
  if(_tutCurrent){
    PERSIST.seenTutorials[_tutCurrent]=true;
    savePersist();
  }
  _tutCurrent=null;
  document.getElementById('tutorial-overlay').style.display='none';
  // Show next queued tutorial
  if(_tutQueue.length){
    var next=_tutQueue.shift();
    setTimeout(function(){ _openTutorial(next); },300);
  }
}

function dismissAllTutorials(){
  _stopTypewriter();
  SETTINGS.tutorial=false;
  var el=document.getElementById('s-tutorial'); if(el) el.checked=false;
  try{ localStorage.setItem('cetd_settings',JSON.stringify(SETTINGS)); }catch(e){}
  _tutCurrent=null; _tutQueue=[];
  document.getElementById('tutorial-overlay').style.display='none';
}


