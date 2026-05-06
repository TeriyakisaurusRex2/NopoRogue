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
  key_mist:         {icon:'🗝️', name:'Mistwood Key',      type:'key',   biome:'mistwoods', color:'#607080'},
  chest_mist:       {icon:'📦', name:'Mistwood Chest',    type:'chest', biome:'mistwoods', color:'#8090b0', basePrice:70},
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

  // Legacy loot support (keys / chests) — kept for backwards compat
  var loot = areaDef.loot;
  if(loot){
    if(loot.always){ addLootItem(loot.always, 1); gained.push(loot.always); }
    if(loot.bonus && loot.bonusChance > 0 && Math.random() < loot.bonusChance){
      addLootItem(loot.bonus, 1); gained.push(loot.bonus);
    }
  }

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
    npc:{name:'Theo', title:'Ex-Champion', greeting:'Ah, you\'re back. I was just thinking about how good I used to be.', pitch:1.1},
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
    id:'shard_well', name:'The Shard Well', icon:'🔮', sprite:'shard_well_keeper', buildingIcon:'shardwell',
    npc:{name:'???', title:'Seer', greeting:'The well whispers of new allies.'},
    desc:'Generates soul shards. Summon new champions.',
    unlocked:false,
  },
  arena: {
    id:'arena', name:'The Arena', icon:'⚔️', sprite:'arena_keeper', buildingIcon:'arena',
    npc:{name:'???', title:'Arena Master', greeting:'Ready to test your strength?'},
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
  playMusic('theme_town');
  updateNavBar('town');
  document.getElementById('town-gold').innerHTML=goldImgHTML('16px')+' '+PERSIST.gold;
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
  forge:    { achId:'rising_power',  desc:'Reach level 3 — the Forge unlocks automatically.' },
  adventurers_hall: { achId:'battle_hardened', desc:'Reach level 5 — the Adventurer\'s Hall unlocks automatically.' },
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
      document.getElementById('town-gold').innerHTML=goldImgHTML('16px')+' '+PERSIST.gold;
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
    document.getElementById('town-gold').innerHTML=goldImgHTML('16px')+' '+PERSIST.gold;
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

// ── Shard Well panel ──────────────────────────────────────────────────────
function refreshShardWellPanel(){
  showLockedBuildingUI('shard_well');
  var b=PERSIST.town.buildings.shard_well;
  if(!b||!b.unlocked) return;
  var inner=document.getElementById('shard_well-inner');
  if(!inner) return;

  var souls=PERSIST.soulShards||0;
  var rate=getShardWellRate();
  var canSummon=souls>=SOUL_SHARDS_PER_PULL;

  inner.innerHTML='<div style="padding:12px 14px;">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
      +'<span style="font-size:32px;">🔮</span>'
      +'<div>'
        +'<div style="font-family:Cinzel,serif;font-size:14px;color:#d4a843;">'+souls+' Soul Shards</div>'
        +'<div style="font-size:9px;color:#6a5020;margin-top:2px;">Generating 1 every '+(rate/60)+' min</div>'
      +'</div>'
    +'</div>'
    +'<button onclick="doEternalPull()" '+(canSummon?'':'disabled')
      +' style="font-family:Cinzel,serif;font-size:10px;padding:8px 20px;border-radius:4px;'
      +'border:1px solid '+(canSummon?'#c09030':'#3a2010')+';background:rgba(30,18,4,.9);'
      +'color:'+(canSummon?'#d4a843':'#4a3010')+';cursor:'+(canSummon?'pointer':'not-allowed')+';width:100%;">'
      +(canSummon?'✦ SUMMON ('+SOUL_SHARDS_PER_PULL+' Shards)':'Need '+(SOUL_SHARDS_PER_PULL-souls)+' more Shards')
    +'</button>'
    +'<div id="summon-result" style="margin-top:12px;"></div>'
  +'</div>';
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

function refreshArenaPanel(){}

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
    }, lines:['One of your champions is ready to ascend. Don\'t keep them waiting. I never liked waiting.','The mastery bar is full. You know what to do. I certainly did, back in my day.']},
    {id:'has_relics', check:function(){
      var relics = PERSIST.town.relics||{};
      return Object.keys(relics).some(function(id){ return relics[id]>0; });
    }, lines:['You\'ve got relics sitting in inventory. Equip them! I never left slots empty. That\'s amateur hour.']},
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
    'Ah, you\'re back. I was just thinking about how good I used to be.',
    'I retired undefeated, you know. Well... mostly undefeated.',
    'Your champions have potential. Not as much as I had, obviously.',
    'Relics are nice. But talent? That\'s what really matters. I should know.',
    'Ascension changes you. Trust me. I\'ve been through it... a few times.',
    'I could still fight if I wanted to. I just choose not to. Very deliberately.',
    'Back in my day, we didn\'t need seven relic slots. I only needed two. Maybe three.',
    'The mastery bar fills faster if you actually win fights. Just a tip. From experience.',
    'Don\'t worry about the stats. Worry about the player behind them. That\'s what I always say.',
    'You remind me of me. Before I got good. I mean — you\'re doing great.',
  ],
};

var NPC_RARE_LINES = {
  vault: {chance:0.08, lines:['I didn\'t shteal anything.']},
  adventurers_hall: {chance:0.08, lines:[LEONA_RARE]},
  bestiary: {chance:0.08, lines:['Sometimes I dream about creatures I\'ve never seen. Is that weird? ...Don\'t answer that.']},
  market: {chance:0.08, lines:['Between you and me... I once sold a lure to a king. He caught something that ate his castle. Good times.']},
  sanctum: {chance:0.08, lines:['I once ascended so fast the gem cracked mid-ceremony. The Keeper before me fainted. Good times.']},
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
    '...Sometimes I miss it. The fighting. The winning. Mostly the winning.',
  ]},
};

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

  // Fallback to random
  var pool = NPC_RANDOM_LINES[buildingId] || ['...'];
  return pool[Math.floor(Math.random() * pool.length)];
}
function openAdventurersHall(){
  var msgEl = document.getElementById('hall-npc-msg');
  if(msgEl){
    var msg = getNpcGreeting('adventurers_hall');
    npcTypewriter(msgEl, msg, {pitch: BUILDINGS.adventurers_hall.npc.pitch || 1.5});
  }
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
  document.querySelectorAll('#adventurers_hall-panel-bg .vault-tab').forEach(function(el){ el.classList.remove('active'); });
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
      +'<div style="font-family:Cinzel,serif;font-size:11px;color:#5e4c2e;letter-spacing:2px;">NO ACHIEVEMENTS YET</div>'
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

function _renderQuestsTab(){
  var quests = PERSIST.town.quests || {offered:[], active:[], completed:[]};
  // Migrate old format
  if(quests.active && !Array.isArray(quests.active)){
    quests.active = quests.active ? [quests.active] : [];
  }
  if(!quests.active) quests.active = [];

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
    +'<span style="font-size:8px;color:#5a4020;font-family:Cinzel,serif;">TRACKING: '+quests.active.length+' / '+maxActive+'</span>'
    +'<span style="font-size:7px;color:#4a3010;font-family:Cinzel,serif;">NEW QUESTS: '+(rh>0?rh+'h ':'')+rm+'m</span>'
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
      +'<div style="font-family:Cinzel,serif;font-size:8px;color:#3a2810;letter-spacing:1px;">VACANT</div>'
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
      +'<div style="font-family:Cinzel,serif;font-size:11px;color:#5e4c2e;letter-spacing:2px;">EXPEDITIONS LOCKED</div>'
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
      html += '<div class="exp-row exp-locked">'
        +'<div class="exp-card exp-card-empty" style="opacity:.3;">🔒</div>'
        +'<div class="exp-card exp-card-empty" style="opacity:.3;">🔒</div>'
        +'<div class="exp-card exp-card-empty" style="opacity:.3;">🔒</div>'
        +'<div class="exp-bar-area"><div style="font-size:8px;color:#3a2010;text-align:center;font-family:Cinzel,serif;letter-spacing:1px;">HALL Lv.'+(2+i*2)+' TO UNLOCK</div></div>'
        +'</div>';
      continue;
    }

    if(!slot.champId){
      // Auto-activate first empty slot for dispatch
      if(_expSendSlot === null && i < maxSlots) _expSendSlot = i;
      var isBuilding = _expSendSlot === i;

      if(isBuilding){
        var champCh = _expSendChamp ? CREATURES[_expSendChamp] : null;
        var champCp = _expSendChamp ? getChampPersist(_expSendChamp) : null;
        var areaObj = _expSendArea ? AREA_DEFS.find(function(a){ return a.id===_expSendArea; }) : null;
        var typeObj = _expSendType && typeof EXPEDITION_TYPES!=='undefined' ? EXPEDITION_TYPES[_expSendType] : null;
        var canConfirm = _expSendChamp && _expSendArea && _expSendType;

        html += '<div class="exp-row exp-building">';
        // Champion card
        html += '<div class="exp-card'+(champCh?' exp-card-filled':' exp-card-empty')+'" style="cursor:pointer;" onclick="_expPickChamp()">';
        if(champCh){
          html += '<div style="margin-bottom:4px;">'+creatureImgHTML(_expSendChamp,champCh.icon,'40px')+'</div>'
            +'<div style="font-family:Cinzel,serif;font-size:9px;color:#c0a060;">'+champCh.name+'</div>'
            +'<div style="font-size:7px;color:#5a4020;">Lv.'+champCp.level+'</div>';
        } else {
          html += '<div style="font-size:24px;color:#5a3818;">+</div>'
            +'<div style="font-family:Cinzel,serif;font-size:8px;color:#5a4020;">CHAMPION</div>';
        }
        html += '</div>';
        // Location card
        html += '<div class="exp-card'+(areaObj?' exp-card-filled':' exp-card-empty')+'" style="cursor:pointer;'+(areaObj?'background:'+(areaObj.bg||'#1a1208')+';':'')+ '" onclick="_expPickArea()">';
        if(areaObj){
          html += '<div style="margin-bottom:4px;">'+areaImgHTML(areaObj.id,areaObj.icon,'36px')+'</div>'
            +'<div style="font-family:Cinzel,serif;font-size:9px;color:#e8d7a8;text-shadow:0 1px 2px #000;">'+areaObj.name+'</div>'
            +'<div style="font-size:7px;color:#b0a080;">Lv.'+areaObj.levelRange[0]+'–'+areaObj.levelRange[1]+'</div>';
        } else {
          html += '<div style="font-size:24px;color:#3a2818;">↗</div>'
            +'<div style="font-family:Cinzel,serif;font-size:8px;color:#5a4020;">LOCATION</div>';
        }
        html += '</div>';
        // Duration card
        html += '<div class="exp-card'+(typeObj?' exp-card-filled':' exp-card-empty')+'" style="cursor:pointer;" onclick="_expPickType()">';
        if(typeObj){
          html += '<div style="font-size:20px;margin-bottom:4px;color:#c0a060;">'+typeObj.icon+'</div>'
            +'<div style="font-family:Cinzel,serif;font-size:9px;color:#c0a060;">'+typeObj.name+'</div>'
            +'<div style="font-size:7px;color:#5a4020;">'+_formatMs(typeObj.durationMs)+'</div>';
        } else {
          html += '<div style="font-size:24px;color:#3a2818;">⏱</div>'
            +'<div style="font-family:Cinzel,serif;font-size:8px;color:#5a4020;">DURATION</div>';
        }
        html += '</div>';
        // Confirm bar
        html += '<div class="exp-bar-area" style="display:flex;gap:8px;">'
          +'<button class="exp-dispatch-btn" style="flex:1;'+(canConfirm?'':'opacity:.4;cursor:not-allowed;')+'" '
            +(canConfirm?'onclick="_expConfirmSend()"':'disabled')+'>CONFIRM DISPATCH</button>'
          +'</div>';
        html += '</div>';
      } else {
        // Additional empty slot (not the active builder)
        html += '<div class="exp-row exp-empty" onclick="_expSendSlot='+i+';_expSendChamp=null;_expSendArea=null;_expSendType=null;_renderHallContent();">'
          +'<div class="exp-card exp-card-empty" style="grid-column:1/-1;cursor:pointer;">'
            +'<div style="font-size:20px;color:#3a2818;">+</div>'
            +'<div style="font-family:Cinzel,serif;font-size:8px;color:#4a3020;letter-spacing:1px;">DISPATCH TO SLOT '+(i+1)+'</div>'
          +'</div>'
          +'</div>';
      }
      continue;
    }

    // Active or complete
    var elapsed = Date.now() - slot.startTime;
    var total = slot.totalMs || 1;
    var isComplete = elapsed >= total;
    var pct = Math.min(100, Math.round((elapsed / total) * 100));
    var remaining = Math.max(0, total - elapsed);
    var timeStr = _formatMs(remaining);

    var champ = CREATURES[slot.champId];
    var champName = champ ? champ.name : slot.champId;
    var area = AREA_DEFS.find(function(a){ return a.id === slot.areaId; });
    var areaName = area ? area.name : slot.areaId;
    var typeDef = typeof EXPEDITION_TYPES !== 'undefined' ? EXPEDITION_TYPES[slot.type] : null;
    var typeName = typeDef ? typeDef.name : (slot.type || 'Scout');

    html += '<div class="exp-row'+(isComplete?' exp-complete':' exp-active')+'">';

    // Champion card
    html += '<div class="exp-card '+getAscensionClass(slot.champId)+'" style="position:relative;">'
      +'<div style="margin-bottom:4px;">'+creatureImgHTML(slot.champId, champ?champ.icon:'?', '40px')+'</div>'
      +'<div style="font-family:Cinzel,serif;font-size:9px;color:#c0a060;">'+champName+'</div>'
      +'<div style="font-size:7px;color:#5a4020;">'+getAscensionChipHTML(slot.champId)+'</div>'
      +'</div>';

    // Location card
    html += '<div class="exp-card">'
      +'<div style="margin-bottom:4px;">'+(area?areaImgHTML(area.id,area.icon,'32px'):'↗')+'</div>'
      +'<div style="font-family:Cinzel,serif;font-size:9px;color:#c0a060;">'+areaName+'</div>'
      +'<div style="font-size:7px;color:#5a4020;">Lv.'+(area?area.levelRange[0]+'-'+area.levelRange[1]:'?')+'</div>'
      +'</div>';

    // Duration card
    html += '<div class="exp-card">'
      +'<div style="font-size:20px;margin-bottom:4px;color:'+(isComplete?'#d4a843':'#5a4020')+';">⏱</div>'
      +'<div style="font-family:Cinzel,serif;font-size:9px;color:#c0a060;">'+typeName+'</div>'
      +'<div style="font-size:7px;color:#5a4020;">'+_formatMs(total)+'</div>'
      +'</div>';

    // Progress bar area
    html += '<div class="exp-bar-area">'
      +'<div class="exp-progress-wrap"><div class="exp-progress-fill'+(isComplete?' complete':'')+'" style="width:'+pct+'%"></div></div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">'
        +'<span style="font-size:8px;color:'+(isComplete?'#d4a843':'#5a4020')+';font-family:Cinzel,serif;">'
          +(isComplete?'✦ READY TO COLLECT':'Returning in '+timeStr)
        +'</span>';

    if(isComplete){
      html += '<button class="exp-collect-btn" onclick="collectExpedition('+i+')">COLLECT</button>';
    } else {
      html += '<button class="exp-recall-btn" onclick="recallExpedition('+i+')">RECALL</button>';
    }
    html += '</div></div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
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
    bounties.push({id:'quest_' + Date.now() + '_' + i, title:t.title, desc:t.desc, type:t.type, areaId:t.areaId, enemyId:t.enemyId, target:t.target, difficulty:t.difficulty, rewards:t.rewards, issuer:'Leona'});
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
  box.innerHTML = '<div style="font-family:Cinzel,serif;font-size:12px;color:#d4a843;margin-bottom:12px;">ABANDON QUEST?</div>'
    +'<div style="font-size:9px;color:#8a6840;line-height:1.6;margin-bottom:16px;">Progress will be lost. The slot stays empty until the next quest refresh.</div>'
    +'<div style="display:flex;gap:10px;justify-content:center;"></div>';

  var btnRow = box.querySelector('div:last-child');

  var yesBtn = document.createElement('button');
  yesBtn.textContent = 'ABANDON';
  yesBtn.style.cssText = 'font-family:Cinzel,serif;font-size:9px;padding:8px 20px;border-radius:6px;cursor:pointer;border:1px solid #5a3020;background:rgba(80,30,10,.5);color:#c06030;letter-spacing:1px;';
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
  noBtn.style.cssText = 'font-family:Cinzel,serif;font-size:9px;padding:8px 20px;border-radius:6px;cursor:pointer;border:1px solid #3a2818;background:rgba(30,20,5,.5);color:#8a6840;letter-spacing:1px;';
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
  savePersist();
  showTownToast('Quest complete! Rewards claimed.');
  _renderHallContent();
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
          +'<span style="font-family:Cinzel,serif;font-size:9px;color:'+(seenMet?'#d4a843':'#7a6030')+';">'+seen+' / '+cost.seenCount+'</span>'
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
    +'<div style="font-family:Cinzel,serif;font-size:11px;color:#6a5020;margin-bottom:12px;letter-spacing:1px;">LOCKED</div>'
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
          statusTxt='CRAFTING — '+fpct+'%'; statusCls='active';
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
        statusTxt='COMING SOON'; statusCls='locked';
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
          (canAfford?'UNLOCK — ✦'+cost.gold+'g':'✦'+cost.gold+'g TO UNLOCK')+'</div>';
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
    {title:'Status — Damage Over Time', sub:'Effects that deal damage each second', tone:'burn', items:[]},
    {title:'Status — Control', sub:'Effects that impair the opponent', tone:'control', items:[]},
    {title:'Defense — Manabound', sub:'Protective effects that use mana', tone:'defense', items:[]},
    {title:'Tempo — Manabound', sub:'Speed and action modifiers', tone:'tempo', items:[]},
    {title:'Conditional Triggers', sub:'Effects that fire when conditions are met', tone:'trigger', items:[]},
    {title:'Card Lifecycle', sub:'How cards move between zones', tone:'lifecycle', items:[]},
    {title:'Meta', sub:'Cross-cutting mechanics', tone:'meta', items:[]},
  ];

  // Categorise keywords
  var catMap = {
    'Burn':'Status — Damage Over Time', 'Poison':'Status — Damage Over Time', 'Bleed':'Status — Damage Over Time',
    'Weaken':'Status — Control', 'Slow':'Status — Control', 'Stun':'Status — Control',
    'Shield':'Defense — Manabound', 'Dodge':'Defense — Manabound', 'Thorns':'Defense — Manabound',
    'Haste':'Tempo — Manabound', 'Frenzy':'Tempo — Manabound',
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

  // Hoot greeting
  var msgEl = document.getElementById('bestiary-npc-msg');
  if(msgEl){
    var msg = getNpcGreeting('bestiary');
    npcTypewriter(msgEl, msg, {pitch: BUILDINGS.bestiary.npc.pitch || 1.4});
  }

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
      ? creatureImgHTML(id, e.icon, '52px')
      : '<span style="font-size:24px;color:#2a1808;font-family:Cinzel,serif;font-weight:700;">?</span>';

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
      +'<div style="margin:0 auto 16px;">'+creatureImgHTML(id, e.icon, '120px', 'bcd-silhouette')+'</div>'
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
    +creatureImgHTML(id, e.icon, '160px')
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
        +'<div class="loc-cr-row-sprite">'+creatureImgHTML(id,c.icon,'40px')+'</div>'
        +'<div class="loc-cr-row-info">'
          +'<div class="loc-cr-row-name">'+c.name+'</div>'
          +'<div class="loc-cr-row-meta">'+(kills?kills+' slain':'')+'</div>'
        +'</div>'
        +'<div class="loc-cr-row-arrow">↗</div>'
        +'</div>';
    } else {
      html += '<div class="loc-cr-row loc-cr-row-unknown">'
        +'<div class="loc-cr-row-sprite" style="display:flex;align-items:center;justify-content:center;color:#2a1808;font-family:Cinzel,serif;font-size:20px;">?</div>'
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

// Entry point used by the area info button and area select screen
function openLocationInBestiary(areaId){
  _locSelected = areaId;
  openBuilding('bestiary');
  setTimeout(function(){
    setBestiaryTab('locations');
    buildBestiaryLocations();
  }, 80);
}


// ── SANCTUM ────────────────────────────────────────────────────────
var _sanctumChamp = null;
var _sanctumTab   = 'overview';

// Per-champion card items retired — Sanctum now uses Card Fragments universally
var SANCTUM_CHAMP_CARD = {}; // kept for save compatibility, no longer used

// Cost tables — all deck operations now cost Card Fragments
var SANCTUM_COSTS = {
  remove_card:  10,  // remove a card from starting deck
  add_copy:     25,  // add an extra copy of any card already known
  swap_base:    30,  // replace Strike/Brace with a champion-specific card
  swap_champ:   40,  // replace one champion card with another
  add_collected:15,  // add a card from the collected pool to the deck
  tier_ruby:    { fragments:50,  sparks:10 },
  tier_emerald: { fragments:100, embers:5 },
  tier_sapphire:{ fragments:200, flameShards:2 },
  floor_2:      { gold:100, fragments:50 },
  floor_3:      { gold:200, fragments:100 },
  floor_4:      { gold:400, fragments:180 },
  floor_5:      { gold:700, fragments:300 },
};

var TIER_ORDER = ['base','ruby','emerald','sapphire','turquoise','amethyst','topaz','obsidian','opal'];

// Fragment-based sanctum currency helpers
function getFragmentCount(){ return PERSIST.town.cardFragments||0; }
function spendFragments(n){
  if(getFragmentCount()<n) return false;
  PERSIST.town.cardFragments-=n;
  return true;
}
// Card collection pool — cards earned from runs, available to add to decks
function getSanctumCollected(cardId){ return (PERSIST.sanctum.unlockedCards&&PERSIST.sanctum.unlockedCards[cardId])||0; }
function addToSanctumPool(cardId, qty){
  if(!PERSIST.sanctum.unlockedCards) PERSIST.sanctum.unlockedCards={};
  PERSIST.sanctum.unlockedCards[cardId]=(PERSIST.sanctum.unlockedCards[cardId]||0)+(qty||1);
  savePersist();
}
// Legacy stubs — kept so old save data doesn't break anything
function getSanctumCardItem(champId){ return null; }
function getSanctumCardCount(champId){ return getFragmentCount(); }
function spendSanctumCards(champId, n){ return spendFragments(n); }

function refreshSanctumPanel(){
  showLockedBuildingUI('sanctum');
  var b=PERSIST.town.buildings.sanctum;
  if(!b||!b.unlocked) return;

  // NPC greeting
  var msgEl = document.getElementById('sanctum-npc-msg');
  if(msgEl && !msgEl._greeted){
    var msg = getNpcGreeting('sanctum');
    npcTypewriter(msgEl, msg, {pitch: BUILDINGS.sanctum.npc.pitch || 1.3});
    msgEl._greeted = true;
  }

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
      +'style="width:100%;box-sizing:border-box;background:#0e0802;border:1px solid #2a1808;color:#c0a060;padding:5px 8px;font-size:9px;font-family:Cinzel,serif;border-radius:4px;" '
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
        +'<div class="snc-roster-portrait '+ascCls+'" style="position:relative;border-radius:6px;">'+creatureImgHTML(id, ch.icon, '40px')+'</div>'
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
      +'<div style="font-family:Cinzel,serif;font-size:12px;letter-spacing:3px;color:#5a4020;">NO RELIC SLOTS</div>'
      +'<div style="font-size:9px;color:#4a3010;font-style:italic;margin-top:6px;">Ascend this champion to unlock the first relic slot.</div>'
      +'</div>';
  } else {
    // Equipped slots
    html += '<div style="font-family:Cinzel,serif;font-size:10px;letter-spacing:2px;color:#d4a843;margin-bottom:8px;">EQUIPPED · '+equipped.length+' / '+totalSlots+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:16px;">';
    var hasBackpack = !!(PERSIST.town && PERSIST.town.hasBackpack);
    for(var i=0;i<totalSlots;i++){
      var relicId = equipped[i];
      if(relicId && RELICS[relicId]){
        var r = RELICS[relicId];
        var removeLabel = hasBackpack ? 'UNEQUIP' : 'DESTROY';
        var removeColor = hasBackpack ? '#9a7030' : '#d05858';
        html += '<div style="padding:10px;background:#2a1808;border:1px solid #5a3a1a;border-radius:6px;display:grid;grid-template-columns:36px 1fr auto;gap:8px;align-items:center;">'
          +'<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:rgba(212,168,67,.08);border:1px solid #5a3a1a;border-radius:4px;">'+relicImgHTML(relicId,'32px')+'</div>'
          +'<div style="min-width:0;">'
          +'<div style="font-size:7px;color:#5a4020;font-family:Cinzel,serif;letter-spacing:1px;">SLOT '+(i+1)+'</div>'
          +'<div style="font-family:Cinzel,serif;font-size:10px;color:#c0a060;">'+r.name+'</div>'
          +'</div>'
          +'<button class="sr-remove-btn" onclick="srClickSlot('+i+')" title="'+(hasBackpack?'Return to inventory':'Destroy this relic — no refund')+'" '
          +'style="font-family:Cinzel,serif;font-size:7px;letter-spacing:1px;padding:5px 8px;background:transparent;color:'+removeColor+';border:1px solid '+removeColor+';border-radius:3px;cursor:pointer;">'
          +removeLabel+'</button>'
          +'</div>';
      } else {
        html += '<div style="padding:14px;background:#0e0802;border:1px dashed #3a2818;border-radius:6px;text-align:center;">'
          +'<div style="font-size:14px;color:#3a2818;">+</div>'
          +'<div style="font-size:8px;color:#3a2818;font-family:Cinzel,serif;letter-spacing:1px;">SLOT '+(i+1)+'</div>'
          +'<div style="font-size:7px;color:#2a1808;font-style:italic;">empty</div>'
          +'</div>';
      }
    }
    // Locked slots preview
    for(var j=totalSlots;j<7;j++){
      html += '<div style="padding:14px;background:repeating-linear-gradient(45deg,rgba(30,20,10,.3) 0 8px,rgba(0,0,0,.3) 8px 16px);border:1px solid #1e1006;border-radius:6px;text-align:center;opacity:.4;">'
        +'<div style="font-size:12px;">🔒</div>'
        +'<div style="font-size:7px;color:#3a2818;font-family:Cinzel,serif;">SLOT '+(j+1)+'</div>'
        +'<div style="font-size:6px;color:#2a1808;">ascend to unlock</div>'
        +'</div>';
    }
    html += '</div>';

    // Inventory
    var ownedIds = Object.keys(relicInv).filter(function(id){ return relicInv[id] > 0 && RELICS[id]; });
    html += '<div style="font-family:Cinzel,serif;font-size:10px;letter-spacing:2px;color:#d4a843;margin-bottom:8px;padding-top:12px;border-top:1px solid #2a1808;">INVENTORY · '+ownedIds.length+' unequipped</div>';
    if(!ownedIds.length){
      html += '<div style="font-size:9px;color:#3a2010;font-style:italic;">No relics in inventory. Craft them at the Forge.</div>';
    } else {
      ownedIds.forEach(function(relicId){
        var r = RELICS[relicId];
        var canEquip = equipped.length < totalSlots && equipped.indexOf(relicId) === -1;
        html += '<div style="padding:10px 12px;background:#1a1208;border:1px solid #2a1808;border-left:3px solid #5a3a1a;border-radius:4px;margin-bottom:6px;display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;">'
          +'<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:rgba(212,168,67,.06);border:1px solid #3a2818;border-radius:4px;">'+relicImgHTML(relicId,'32px')+'</div>'
          +'<div>'
          +'<div style="font-family:Cinzel,serif;font-size:11px;color:#c0a060;">'+r.name+'</div>'
          +'<div style="font-size:8px;color:#5a4020;margin-top:2px;">'+r.desc+'</div>'
          +'</div>'
          +(canEquip?'<button class="market-buy-btn" style="padding:6px 14px;font-size:9px;" onclick="srEquipRelic(\''+champId+'\',\''+relicId+'\')">EQUIP</button>':'')
          +'</div>';
      });
    }

    if(hasBackpack){
      html += '<div style="margin-top:12px;padding:8px 12px;background:rgba(127,192,106,.06);border-left:3px solid #7fc06a;font-size:9px;color:#7a9060;font-style:italic;border-radius:4px;">'
        +'<strong style="color:#7fc06a;font-style:normal;letter-spacing:1px;font-family:Cinzel,serif;">🎒 BACKPACK ACTIVE ·</strong> Unequipping returns the relic to your inventory.'
        +'</div>';
    } else {
      html += '<div style="margin-top:12px;padding:8px 12px;background:rgba(208,88,88,.06);border-left:3px solid #d05858;font-size:9px;color:#8a6040;font-style:italic;border-radius:4px;">'
        +'<strong style="color:#d05858;font-style:normal;letter-spacing:1px;font-family:Cinzel,serif;">WARNING ·</strong> Removing a relic from a slot DESTROYS it. Buy the Adventurer\'s Backpack at the Market to unequip safely.'
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
    +creatureImgHTML(champId, ch.icon, '140px', 'flip-x')
    +(ascLevel>0?'<div style="position:absolute;bottom:6px;left:6px;">'+ascChip+'</div>':'')
    +'</div>';

  // Name + stats + level
  html+='<div style="display:flex;flex-direction:column;">'
    +'<div style="font-family:Cinzel,serif;font-size:22px;color:#d4a843;letter-spacing:1px;margin-bottom:12px;">'+ch.name+'</div>';

  // Level + XP bar
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">'
    +'<span style="font-family:Cinzel,serif;font-size:12px;color:#c09030;padding:3px 8px;border:1px solid #5a3a1a;background:rgba(212,168,67,.06);">LV '+cp.level+'</span>'
    +'<div style="flex:1;height:6px;background:rgba(0,0,0,.4);border:1px solid #2a1808;position:relative;"><div style="position:absolute;inset:0;width:'+xpPct+'%;background:linear-gradient(90deg,#c09030,#d4a843);"></div></div>'
    +'<span style="font-size:9px;color:#5a4020;">'+cp.xp+'/'+cp.xpNext+'</span>'
    +'</div>';

  // Stats
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
  [{l:'STR',v:cp.stats.str,g:ch.growth.str,c:'#e88060'},{l:'AGI',v:cp.stats.agi,g:ch.growth.agi,c:'#9adc7e'},{l:'WIS',v:cp.stats.wis,g:ch.growth.wis,c:'#9ad8e8'}].forEach(function(s){
    html+='<div style="padding:8px 10px;background:#1a1208;border:1px solid #2a1808;border-left:3px solid '+s.c+';">'
      +'<div style="font-family:Cinzel,serif;font-size:9px;letter-spacing:2px;color:'+s.c+';">'+s.l+'</div>'
      +'<div style="font-family:Cinzel,serif;font-size:20px;color:#e8d7a8;line-height:1;margin-top:2px;">'+s.v+'</div>'
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
    +'<span style="font-family:Cinzel,serif;font-size:12px;letter-spacing:3px;color:'+(masteryFull?'#d4a843':'#c0a060')+';">MASTERY</span>';
  if(nextTier){
    var tierColor = ASCENSION_TIERS[ascLevel] ? {'ruby':'#c04040','emerald':'#50b060','sapphire':'#5080d0','turquoise':'#50b0a8','amethyst':'#a060d0','topaz':'#c0a040','black_opal':'#8888c0'}[nextTier.tier] || '#c0a060' : '#c0a060';
    html+='<span style="font-size:10px;color:#5a4020;font-family:Cinzel,serif;">NEXT: <span style="color:'+tierColor+';">'+nextTier.tier.toUpperCase().replace('_',' ')+'</span></span>';
  }
  html+='</div>';

  // Mastery bar
  html+='<div style="height:8px;background:rgba(0,0,0,.4);border:1px solid #2a1808;position:relative;margin-bottom:4px;">'
    +'<div style="position:absolute;inset:0;width:'+masteryPct+'%;background:'+(masteryFull?'linear-gradient(90deg,#f0a53a,#d4a843,#f0a53a)':'linear-gradient(90deg,#c09030,#d4a843)')+';'+(masteryFull?'box-shadow:0 0 8px rgba(240,165,58,.5);':'')+'"></div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;font-size:9px;color:#5a4020;font-family:Cinzel,serif;">'
    +'<span>'+masteryXp+(nextTier?' / '+masteryReq:'')+'</span>'
    +'<span>'+masteryPct+'%</span>'
    +'</div>';

  if(nextTier){
    html+='<div style="display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin-top:14px;">';
    // Gem requirement
    html+='<div style="padding:8px 12px;background:'+(hasGem?'rgba(127,192,106,.06)':'rgba(208,88,88,.06)')+';border-left:3px solid '+(hasGem?'#7fc06a':'#d05858')+';display:flex;align-items:center;gap:8px;">'
      +'<span style="font-size:18px;color:'+tierColor+';">◆</span>'
      +'<div>'
      +'<div style="font-family:Cinzel,serif;font-size:10px;color:#c0a060;">'+nextTier.gem.replace('_',' ')+' Gem</div>'
      +'<div style="font-size:8px;color:'+(hasGem?'#7fc06a':'#d05858')+';margin-top:1px;">'+(hasGem?'✓ IN VAULT':'✗ NOT OWNED')+'</div>'
      +'</div></div>';
    // Ascend button
    html+='<button class="market-buy-btn" style="padding:12px 24px;font-size:12px;letter-spacing:3px;'+(canAsc?'border-color:#d4a843;color:#d4a843;box-shadow:0 0 12px rgba(212,168,67,.3);':'opacity:.4;')+'" '
      +(canAsc?'onclick="doAscensionCeremony(\''+champId+'\')"':'disabled')+'>✦ ASCEND</button>';
    html+='</div>';
  } else {
    html+='<div style="margin-top:14px;text-align:center;font-family:Cinzel,serif;font-size:11px;letter-spacing:3px;color:#d4a843;">MAXIMUM ASCENSION</div>';
  }
  html+='</div>';

  // Innate
  if(ch.innate || ch.innateName){
    html+='<div style="padding:10px 14px;background:rgba(80,40,0,.1);border:1px solid #2a1808;border-radius:6px;margin-bottom:12px;">'
      +'<div style="font-family:Cinzel,serif;font-size:9px;color:#c09030;margin-bottom:4px;">✦ '+(ch.innateName||ch.innate.name)+'</div>'
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
  center.innerHTML += '<div id="asc-name" style="font-family:Cinzel,serif;font-size:28px;color:#e8d7a8;text-shadow:0 2px 0 #000;opacity:0;transition:opacity 600ms;">'+ch.name+'</div>';

  // Tier badges (hidden)
  center.innerHTML += '<div id="asc-tiers" style="display:flex;align-items:center;gap:16px;opacity:0;">'
    +'<span style="font-family:Cinzel,serif;font-size:12px;letter-spacing:3px;padding:4px 12px;color:'+fromColor+';border:1px solid '+fromColor+'66;background:'+fromColor+'11;opacity:.5;">'+fromLabel+'</span>'
    +'<span style="font-size:16px;color:#d4a843;text-shadow:0 0 6px rgba(212,168,67,.4);">→</span>'
    +'<span id="asc-to-tier" style="font-family:Cinzel,serif;font-size:16px;letter-spacing:5px;padding:6px 16px;color:'+toColor+';border:2px solid '+toColor+';background:'+toColor+'22;text-shadow:0 0 10px '+toColor+'88;animation:asc-tier-emerge 700ms cubic-bezier(.2,.8,.3,1) forwards;">'+toLabel+'</span>'
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
    +'<div style="font-family:Cinzel,serif;font-size:10px;letter-spacing:3px;color:'+toColor+';">RELIC SLOT UNLOCKED</div>'
    +'<div style="font-size:10px;color:#c8b888;margin-top:2px;">Slot '+(fromLevel+1)+' now available — equip a relic in the Sanctum.</div>'
    +'</div></div>';

  // Continue button (hidden)
  center.innerHTML += '<button id="asc-continue" style="display:none;padding:12px 36px;font-family:Cinzel,serif;font-size:13px;letter-spacing:4px;font-weight:700;color:#d4a843;background:linear-gradient(180deg,#3a2818,#1a1208);border:2px solid #d4a843;cursor:pointer;text-shadow:0 0 6px rgba(212,168,67,.4);box-shadow:0 0 14px rgba(212,168,67,.3);">CONTINUE</button>';

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
        +creatureImgHTML(champId, ch.icon, '200px', 'flip-x')
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
    +'<div style="font-family:Cinzel,serif;font-size:10px;letter-spacing:2px;color:'+color+';text-shadow:0 0 4px '+color+'44;">'+label+'</div>'
    +'<div style="display:flex;align-items:baseline;gap:6px;margin-top:2px;">'
    +'<span style="font-family:Cinzel,serif;font-size:14px;color:#6a5030;text-decoration:line-through;">'+before+'</span>'
    +'<span style="font-size:11px;color:#6a5030;">→</span>'
    +'<span style="font-family:Cinzel,serif;font-size:22px;font-weight:700;color:'+color+';text-shadow:0 0 6px '+color+'44;">'+after+'</span>'
    +'<span style="font-family:Cinzel,serif;font-size:11px;color:#7fc06a;margin-left:auto;">+'+diff+'</span>'
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
    +'<span style="font-family:Cinzel,serif;font-size:10px;letter-spacing:2px;color:#d4a843;">STARTING DECK · '+deck.length+' CARDS</span>'
    +'</div>';

  // Compact list
  html+='<div style="margin-bottom:16px;">';
  uniqueIds.forEach(function(cardId){
    var cd=CARDS[cardId]; if(!cd) return;
    var copies=deckCounts[cardId];
    var statColor=statColors[cd.stat]||'#c0a060';
    html+='<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-bottom:1px solid #1e1006;">'
      +'<span style="font-size:16px;width:24px;text-align:center;">'+(cd.icon||'◇')+'</span>'
      +'<span style="font-family:Cinzel,serif;font-size:10px;color:#c0a060;flex:1;">'+cd.name+'</span>'
      +'<span style="font-size:9px;color:#5a4020;font-family:Cinzel,serif;">×'+copies+'</span>'
      +'<span style="font-size:7px;color:'+statColor+';font-family:Cinzel,serif;letter-spacing:1px;width:28px;text-align:right;">'+(cd.stat||'').toUpperCase()+'</span>'
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

function toggleCardEditRow(champId, cardId, isBase, cell, frags, champCards, deck, deckCounts){
  var section=document.getElementById('sanctum-edit-section');
  if(!section) return;
  var cd=CARDS[cardId];
  if(!cd) return;
  var canRemove=frags>=(SANCTUM_COSTS.remove_card)&&deck.length>1;
  var canSwap=isBase&&champCards.length>0&&frags>=(SANCTUM_COSTS.swap_base);
  var canAdd=frags>=(SANCTUM_COSTS.add_copy);

  section.innerHTML='<div style="background:rgba(20,10,2,.7);border:1px solid #3a2010;border-radius:6px;padding:10px;">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
      +'<span style="font-size:20px;">'+(cd.icon||'?')+'</span>'
      +'<div>'
        +'<div style="font-family:Cinzel,serif;font-size:10px;color:#d4a843;">'+cd.name+'</div>'
        +'<div style="font-size:7px;color:#8a6040;line-height:1.4;">'+cd.effect+'</div>'
      +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:5px;flex-wrap:wrap;">'
    +(canRemove?'<button class="sanctum-btn sanctum-btn-remove" onclick="sanctumRemoveCard(\''+champId+'\',\''+cardId+'\')">-1 copy ('+SANCTUM_COSTS.remove_card+' 🃏)</button>':'')
    +(canAdd?'<button class="sanctum-btn" onclick="sanctumAddCard(\''+champId+'\',\''+cardId+'\')">+1 copy ('+SANCTUM_COSTS.add_copy+' 🃏)</button>':'')
    +(canSwap?'<button class="sanctum-btn sanctum-btn-swap" onclick="sanctumShowSwapMenu(\''+champId+'\',\''+cardId+'\',this)">Swap out ('+SANCTUM_COSTS.swap_base+' 🃏)</button>':'')
    +'<button class="sanctum-btn" onclick="document.getElementById(\'sanctum-edit-section\').innerHTML=\'<div style=\\"font-size:8px;color:#4a3010;font-style:italic;text-align:center;padding:4px;\\">Click a card above to edit it</div>\'">✕ Close</button>'
    +'</div>'
  +'</div>';
}

function resetSanctumDeck(champId){
  if(!confirm('Reset '+getCreaturePlayable(champId).name+'\'s deck to default? This cannot be undone.')) return;
  if(PERSIST.sanctum.deckMods[champId]){
    PERSIST.sanctum.deckMods[champId]={swaps:[],extras:[],removed:[],cardTiers:{}};
  }
  savePersist();
  showTownToast('Deck reset to default.');
  refreshSanctumPanel();
}


// ── UPGRADE PANE ───────────────────────────────────────────────────
function buildSanctumUpgradesPane(){
  var list=document.getElementById('sanctum-upgrades-list');
  if(!list) return;
  list.innerHTML='';
  var champId=_sanctumChamp; if(!champId) return;
  var mods=getSanctumMods(champId);
  var deck=buildStartDeck(champId);
  var frags=getFragmentCount();
  var active=!!(PERSIST.town.buildings.sanctum&&PERSIST.town.buildings.sanctum.unlocked);
  var uniqueIds=[...new Set(deck)];

  var intro=document.createElement('div');
  intro.style.cssText='font-size:8px;color:#7a6030;margin-bottom:10px;line-height:1.5;padding:6px 8px;background:rgba(0,0,0,.3);border-radius:4px;';
  intro.textContent='Upgrade card tiers to start runs with more powerful versions. Uses Card Fragments + materials.';
  list.appendChild(intro);

  uniqueIds.forEach(function(cardId){
    var cd=CARDS[cardId]; if(!cd) return;
    var curTier=mods.cardTiers&&mods.cardTiers[cardId]?mods.cardTiers[cardId]:'base';
    var curIdx=TIER_ORDER.indexOf(curTier);
    var nextTier=curIdx<TIER_ORDER.length-1?TIER_ORDER[curIdx+1]:null;
    var cost=nextTier?SANCTUM_COSTS['tier_'+nextTier]:null;
    var tierCol={base:'#555',ruby:'#c0392b',emerald:'#27ae60',sapphire:'#2980b9',turquoise:'#17a589',amethyst:'#8e44ad',topaz:'#d4ac0d',obsidian:'#2c3e50'};

    var row=document.createElement('div');
    row.className='sanctum-upgrade-row';
    if(cost){
      var matKey=cost.sparks?'sparks':cost.embers?'embers':'flameShards';
      var matAmt=cost.sparks||cost.embers||cost.flameShards||0;
      var matHave=PERSIST.town.materials[matKey]||0;
      var matIcon={'sparks':'✨','embers':'🔥','flameShards':gemImgHTML('ruby','16px')}[matKey]||'';
      var hasFrags=frags>=cost.fragments;
      var hasMats=matHave>=matAmt;
      var canAfford=active&&hasFrags&&hasMats;
      row.innerHTML='<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #1a0e00;">'
        +'<span style="font-size:16px;">'+(cd.icon||'?')+'</span>'
        +'<div style="flex:1;min-width:0;">'
          +'<div style="font-size:9px;color:#d4a843;font-family:Cinzel,serif;">'+cd.name+'</div>'
          +'<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">'
            +'<span style="font-size:7px;color:'+tierCol[curTier]+';border:1px solid '+tierCol[curTier]+';padding:1px 4px;border-radius:2px;">'+curTier.toUpperCase()+'</span>'
            +'<span style="font-size:8px;color:#444;">→</span>'
            +'<span style="font-size:7px;color:'+tierCol[nextTier]+';border:1px solid '+tierCol[nextTier]+';padding:1px 4px;border-radius:2px;">'+nextTier.toUpperCase()+'</span>'
          +'</div>'
        +'</div>'
        +'<div style="text-align:right;font-size:7px;margin-right:6px;">'
          +'<div style="color:'+(hasFrags?'#c09030':'#7a2020')+';">'+cost.fragments+' 🃏</div>'
          +(matAmt?'<div style="color:'+(hasMats?'#8a9040':'#7a2020')+';">'+matAmt+matIcon+'</div>':'')
        +'</div>'
        +(canAfford
          ?'<button class="sanctum-btn sanctum-btn-upgrade" onclick="sanctumUpgradeCard(\''+champId+'\',\''+cardId+'\')">UPGRADE</button>'
          :'<button class="sanctum-btn" disabled style="opacity:.4;">UPGRADE</button>')
        +'</div>';
    } else {
      row.innerHTML='<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #1a0e00;">'
        +'<span style="font-size:16px;">'+(cd.icon||'?')+'</span>'
        +'<span style="font-size:9px;color:#d4a843;font-family:Cinzel,serif;flex:1;">'+cd.name+'</span>'
        +'<span style="font-size:7px;color:'+tierCol[curTier]+';border:1px solid '+tierCol[curTier]+';padding:1px 4px;border-radius:2px;">'+curTier.toUpperCase()+'</span>'
        +'<span style="font-size:7px;color:#3a6020;margin-left:4px;">MAX</span>'
        +'</div>';
    }
    list.appendChild(row);
  });

  if(!active){
    var el=document.createElement('div');
    el.style.cssText='font-size:9px;color:#4a3010;text-align:center;padding:16px;';
    el.textContent='Slot a gem to unlock card tier upgrades.';
    list.appendChild(el);
  }
}

// ── TRAINING PANE ──────────────────────────────────────────────────
function buildSanctumTrainingPane(){
  var list=document.getElementById('sanctum-training-list');
  if(!list) return;
  list.innerHTML='';
  var champId=_sanctumChamp; if(!champId) return;
  var ch=CREATURES[champId]; if(!ch) return;
  var frags=getFragmentCount();
  var curFloor=PERSIST.sanctum.levelFloors[champId]||1;
  var cp=getChampPersist(champId);

  var infoDiv=document.createElement('div');
  infoDiv.style.cssText='font-size:9px;color:#7a6030;margin-bottom:10px;line-height:1.6;padding:6px 8px;background:rgba(0,0,0,.3);border-radius:4px;';
  infoDiv.innerHTML='<strong style="color:#d4a843;">'+ch.name+'</strong> · Current level: <strong>'+cp.level+'</strong>'
    +'<br>Level floor ensures your champion always starts a run at a minimum level.';
  list.appendChild(infoDiv);

  [2,3,4,5].forEach(function(floor){
    var cost=SANCTUM_COSTS['floor_'+floor];
    var alreadySet=curFloor>=floor;
    var hasGold=PERSIST.gold>=cost.gold;
    var hasFrags=frags>=cost.fragments;
    var canAfford=!alreadySet&&hasGold&&hasFrags;
    var row=document.createElement('div');
    row.className='sanctum-upgrade-row';
    row.innerHTML='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1a0e00;">'
      +'<span style="font-size:20px;">'+(alreadySet?'✅':'🏆')+'</span>'
      +'<div style="flex:1;">'
        +'<div style="font-size:9px;color:#d4a843;font-family:Cinzel,serif;">Level Floor '+floor+'</div>'
        +'<div style="font-size:7px;color:#7a6030;margin-top:1px;">Runs start at Lv.'+floor+' minimum</div>'
        +'<div style="font-size:7px;margin-top:3px;display:flex;gap:8px;">'
          +'<span style="color:'+(hasGold||alreadySet?'#c09030':'#7a2020')+';">'+cost.gold+'g</span>'
          +'<span style="color:'+(hasFrags||alreadySet?'#d4a843':'#7a2020')+';">'+cost.fragments+' 🃏</span>'
        +'</div>'
      +'</div>'
      +(alreadySet
        ?'<span style="font-size:8px;color:#27ae60;font-family:Cinzel,serif;">UNLOCKED</span>'
        :canAfford
          ?'<button class="sanctum-btn sanctum-btn-upgrade" onclick="sanctumBuyLevelFloor(\''+champId+'\','+floor+')">UNLOCK</button>'
          :'<button class="sanctum-btn" disabled style="opacity:.4;">UNLOCK</button>')
      +'</div>';
    list.appendChild(row);
  });
}

// ── SANCTUM ACTIONS ────────────────────────────────────────────────
function sanctumRemoveCard(champId, cardId){
  var cost=SANCTUM_COSTS.remove_card;
  if(!spendFragments(cost)){ showTownToast('Not enough Card Fragments (need '+cost+').'); return; }
  var mods=getSanctumMods(champId);
  // Check card isn't already marked for removal beyond what's in deck
  var deck=buildStartDeck(champId);
  if(deck.indexOf(cardId)===-1){ showTownToast('That card is not in the starting deck.'); return; }
  // Add to removed list
  var existing=mods.removed.find(function(r){return r.cardId===cardId;});
  if(existing) existing.copies=(existing.copies||1)+1;
  else mods.removed.push({cardId:cardId,copies:1});
  savePersist(); showTownToast('Removed one '+CARDS[cardId].name+' from starting deck.'); refreshSanctumPanel();
}

function sanctumAddCard(champId, cardId){
  var cost=SANCTUM_COSTS.add_copy;
  if(!spendFragments(cost)){ showTownToast('Not enough Card Fragments (need '+cost+').'); return; }
  var mods=getSanctumMods(champId);
  var existing=mods.extras.find(function(e){return e.cardId===cardId;});
  if(existing) existing.copies=(existing.copies||1)+1;
  else mods.extras.push({cardId:cardId,copies:1});
  savePersist(); showTownToast('+1 '+CARDS[cardId].name+' added to starting deck.'); refreshSanctumPanel();
}

function sanctumSwapIn(champId, newCardId){
  // Swap a strike or brace for the new champion card
  var mods=getSanctumMods(champId);
  var deck=buildStartDeck(champId);
  // Find a swappable base card (strike first, then brace)
  var fromId=deck.indexOf('strike')!==-1?'strike':deck.indexOf('brace')!==-1?'brace':null;
  if(!fromId){ showTownToast('No base cards (Strike/Brace) left to swap out.'); return; }
  var cost=SANCTUM_COSTS.swap_base;
  if(!spendFragments(cost)){ showTownToast('Not enough Card Fragments (need '+cost+').'); return; }
  mods.swaps.push({fromId:fromId,toId:newCardId});
  savePersist(); showTownToast('Swapped a '+CARDS[fromId].name+' for '+CARDS[newCardId].name+'!'); refreshSanctumPanel();
}

function sanctumAddCollected(champId, cardId){
  var pool=PERSIST.sanctum.unlockedCards||{};
  if(!(pool[cardId]>0)){ showTownToast('No copies of that card in your collection.'); return; }
  var cost=SANCTUM_COSTS.add_collected;
  if(!spendFragments(cost)){ showTownToast('Not enough Card Fragments (need '+cost+').'); return; }
  // Add to deck extras and consume from pool
  var mods=getSanctumMods(champId);
  var existing=mods.extras.find(function(e){return e.cardId===cardId;});
  if(existing) existing.copies=(existing.copies||1)+1;
  else mods.extras.push({cardId:cardId,copies:1});
  pool[cardId]--;
  savePersist();
  showTownToast(CARDS[cardId].name+' added to '+getCreaturePlayable(champId).name+' starting deck!');
  refreshSanctumPanel();
}

function sanctumShowSwapMenu(champId, fromCardId, btn){
  // Simple: swap a champion card back to strike
  var mods=getSanctumMods(champId);
  var cost=SANCTUM_COSTS.swap_champ;
  // Find existing swap entry and remove it to undo
  var swapIdx=mods.swaps.findIndex(function(s){return s.toId===fromCardId;});
  if(swapIdx!==-1){
    // Undo swap — restore the original base card, refund nothing (intentional)
    mods.swaps.splice(swapIdx,1);
    savePersist(); showTownToast('Swapped back. Cards are NOT refunded on undo.'); refreshSanctumPanel();
  } else {
    showTownToast('Use Swap to replace base cards with champion-specific cards.');
  }
}

function sanctumUpgradeCard(champId, cardId){
  var mods=getSanctumMods(champId);
  var curTier=mods.cardTiers[cardId]||'base';
  var curIdx=TIER_ORDER.indexOf(curTier);
  if(curIdx>=TIER_ORDER.length-1){ showTownToast('Already at max tier!'); return; }
  var nextTier=TIER_ORDER[curIdx+1];
  var cost=SANCTUM_COSTS['tier_'+nextTier];
  if(!cost){ showTownToast('No upgrade cost defined for '+nextTier+'.'); return; }
  var matKey=cost.sparks?'sparks':cost.embers?'embers':'flameShards';
  var matAmt=cost.sparks||cost.embers||cost.flameShards||0;
  if(!spendFragments(cost.fragments)){ showTownToast('Not enough Card Fragments (need '+cost.fragments+').'); return; }
  if(matAmt&&(PERSIST.town.materials[matKey]||0)<matAmt){
    PERSIST.town.cardFragments+=cost.fragments; // refund
    showTownToast('Not enough '+matKey+' (need '+matAmt+').'); return;
  }
  if(matAmt) PERSIST.town.materials[matKey]-=matAmt;
  mods.cardTiers[cardId]=nextTier;
  savePersist();
  showTownToast(CARDS[cardId].name+' upgraded to '+nextTier.toUpperCase()+'!');
  refreshSanctumPanel();
}

function sanctumBuyLevelFloor(champId, floor){
  var costKey='floor_'+floor;
  var cost=SANCTUM_COSTS[costKey];
  if(PERSIST.gold<cost.gold){ showTownToast('Not enough gold (need '+cost.gold+'g).'); return; }
  if(!spendFragments(cost.fragments)){ showTownToast('Not enough Card Fragments (need '+cost.fragments+').'); return; }
  PERSIST.gold-=cost.gold;
  PERSIST.sanctum.levelFloors[champId]=floor;
  savePersist(); updateNavBar('town'); showTownToast('Level floor raised to '+floor+' for '+getCreaturePlayable(champId).name+'!'); refreshSanctumPanel();
}

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

  // NPC greeting
  var msgEl = document.getElementById('market-npc-msg');
  if(msgEl && !msgEl._greeted){
    var msg = getNpcGreeting('market');
    npcTypewriter(msgEl, msg, {pitch: BUILDINGS.market.npc.pitch || 1.2});
    msgEl._greeted = true;
  }

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
    permHeader.style.cssText = 'padding:6px 10px;font-family:Cinzel,serif;font-size:8px;letter-spacing:2px;color:#c89adc;border-bottom:1px solid #2a1808;';
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
    rareHeader.style.cssText = 'padding:6px 10px;font-family:Cinzel,serif;font-size:8px;letter-spacing:2px;color:#d4a843;border-bottom:1px solid #2a1808;margin-top:8px;';
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
  html += '<div class="market-insp-detail"><span class="market-insp-detail-label">Effect</span><span class="market-insp-detail-val">Permanent — never expires</span></div>';
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
  'Source info — where items are found',
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
  sewers_deep:'Lurkers hide until struck — the first hit triggers ambush.',
  sewers_foul:'Watchers drain mana. The Amalgam grows more resistant each fight.',
  swamp:      'Bog Wisps ignore armor. Toad King can summon reinforcements.',
  crypt:      'Skeletons have Undying — finish them twice. Witches curse your stats.',
  forest:     'Trolls regenerate if given time. Harpies attack before you can react.',
  cave:       'Harpies swoop for +50% first-strike damage. Golems have Stone Skin.',
  ruins:      'Knights counter on block. Orcs grow stronger when wounded.',
  dragonsnest:'Wyrms apply fire DoT stacks. The Elder Dragon\'s breath is lethal.',
  boneyard:   'The Lich returns from death once. Witches here have Curse Mastery.',
  starmaze:   'Astral Wisps are ethereal — reduced damage. Liches are unpredictable.',
  mistwoods:    'Luna Sciurids become lethal below half HP — burst them before the threshold. Orbweavers web-trap you on heavy hits; use light, rapid strikes. Foghasts drain mana on every hit; save your spells.',
  waxdunes:     'Wax Hounds trigger Brittle Shell below 20% HP — a sudden heal and speed burst, finish them fast. The Wax Effigy opens with a random card from your discard pile. The Wax Oasis cannot be killed — maximise damage in 45 seconds for a gold bonus.',
  fungalwarren: 'Spore Puffs release Poison on death — finish fights quickly. Mycelids punish every 3rd card you play. Tunnel Ants survive once at 5 HP — watch for it.',
  sunkenhabour: 'Tide Crabs absorb small hits — use burst damage. Drowned Sailors hit slowly but devastatingly — manage your HP. Sirens reduce your draw speed while alive: kill them first. Shark Knights enter Feeding Frenzy below 50% HP — burst them down.',
  charmines:    'Flame Sprites deal Burn on death — plan kills carefully. Ember Golems ignite at 50% HP, gaining speed and Burn on hits. Mine Ghouls ramp damage after 6s — fight fast. Lava Crawlers stack Burn every 5s — keep moving.',
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

  // ── XP gain for levelling (keep existing) ──
  var lv=PERSIST.town.vaultLevel||1;
  if(lv<VAULT_XP_THRESHOLDS.length+1){
    var xpGain=seconds/10;
    PERSIST.town.vaultXp=(PERSIST.town.vaultXp||0)+xpGain;
    PERSIST.town.vaultXpTotal=(PERSIST.town.vaultXpTotal||0)+xpGain;
    var thresh=VAULT_XP_THRESHOLDS[lv-1]||9999;
    if(PERSIST.town.vaultXp>=thresh){
      PERSIST.town.vaultXp-=thresh;
      PERSIST.town.vaultLevel=lv+1;
      var unlockMsg=VAULT_LEVEL_UNLOCKS[lv]||'';
      showTownToast('✦ Vault reached Lv.'+(lv+1)+'!'+(unlockMsg?' '+unlockMsg:''));
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

// M'bur — typewritten lines, cycled in the NPC greeting.
var FORGE_NPC_LINES = [
  "The fire likes you today. Don't ask why.",
  "Bring me ore, bring me bones — both burn.",
  "Patience. Steel does not hurry.",
  "I made a relic once that cried. Won't do that again.",
  "Strike while it's hot. Wait while it's hotter."
];

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
var _forgeNpcLineIdx = -1;           // current line in FORGE_NPC_LINES
var _forgeNpcLastChange = 0;         // timestamp of last line change

function _forgePickNpcLine(){
  // Cycle to a new line every ~6s of panel time. Random-but-not-repeat.
  var now = Date.now();
  if(_forgeNpcLineIdx === -1 || now - _forgeNpcLastChange > 6000){
    var prev = _forgeNpcLineIdx;
    var next = prev;
    while(next === prev && FORGE_NPC_LINES.length > 1){
      next = Math.floor(Math.random() * FORGE_NPC_LINES.length);
    }
    _forgeNpcLineIdx = next;
    _forgeNpcLastChange = now;
  }
  return FORGE_NPC_LINES[_forgeNpcLineIdx] || '';
}

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
  if(typeof RELIC_RECIPES === 'undefined') return null;
  var ids = Object.keys(RELIC_RECIPES);
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

  // NPC dialogue + level/XP bar
  var msgEl = document.getElementById('forge-npc-msg');
  if(msgEl) msgEl.textContent = _forgePickNpcLine();
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
    var relic = RELICS[job.relicId];
    var tColor = FORGE_TIER_COLOR[(relic&&relic.tier)||'base'] || '#a89373';
    var elapsed = Date.now() - job.startTime;
    var pct = Math.min(100, Math.max(0, (elapsed/job.totalMs)*100));
    var ready = elapsed >= job.totalMs;
    var remaining = Math.max(0, job.totalMs - elapsed);
    html += '<div class="forge-slot forge-slot-active'+(ready?' forge-slot-ready':'')+'" '
      + 'style="border-color:'+tColor+'88;">'
      + '<div class="forge-slot-icon" style="border-color:'+tColor+';background:radial-gradient(circle at 50% 60%,'+tColor+'55,transparent 70%);'+(ready?'':'animation:frgEmberPulse 2.2s ease-in-out infinite;')+'">'+(relic?relicImgHTML(job.relicId,'30px'):'⚗')+'</div>'
      + '<div class="forge-slot-info">'
        + '<div class="forge-slot-name">'+(relic?relic.name:job.relicId)+'</div>'
        + '<div class="forge-slot-bar"><div class="forge-slot-bar-fill'+(ready?' ready':'')+'" style="width:'+pct+'%;"></div></div>'
        + '<div class="forge-slot-status">'
          + '<span>'+(ready?'READY':_forgeTimeFmt(remaining)+' REMAINING')+'</span>'
          + '<span class="forge-slot-pct">'+Math.round(pct)+'%</span>'
        + '</div>'
      + '</div>'
      + '<div class="forge-slot-actions">'
        + (ready
            ? '<button class="forge-collect-btn" onclick="collectForgeCraft('+i+')">COLLECT</button>'
            : '<button class="forge-cancel-btn" onclick="cancelForgeCraft('+i+')" title="Cancel — materials are NOT refunded">✕</button>')
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
  var groups = ['base','ruby','emerald','sapphire'];
  var byTier = {};
  groups.forEach(function(t){ byTier[t] = []; });
  Object.keys(RELIC_RECIPES).forEach(function(id){
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
      html += '<div class="forge-recipe-row'+(selected?' selected':'')+(can?'':' insufficient')+'" '
        + 'onclick="_forgeSelectRecipe(\''+id+'\')" '
        + 'style="--tier:'+color+';">'
        + (selected?'<div class="forge-recipe-stripe" style="background:'+color+';box-shadow:0 0 8px '+color+';"></div>':'')
        + '<div class="forge-recipe-icon" style="border-color:'+color+'88;background:radial-gradient(circle at 50% 60%,'+color+'44,transparent 70%);">'+relicImgHTML(id,'34px')+'</div>'
        + '<div class="forge-recipe-body">'
          + '<div class="forge-recipe-row-title">'
            + '<span class="forge-recipe-name">'+relic.name+'</span>'
            + '<span class="forge-recipe-tier" style="color:'+color+';border-color:'+color+'88;background:'+color+'11;">'+label+'</span>'
          + '</div>'
          + '<div class="forge-mat-chips">' + _forgeMatChipsHTML(recipe.mats) + '</div>'
        + '</div>'
        + '<div class="forge-recipe-time">'
          + '<div class="forge-recipe-time-label">CRAFT TIME</div>'
          + '<div class="forge-recipe-time-val">'+_forgeTimeFmt((RELIC_CRAFT_TIMES[recipe.tier]||0)*1000)+'</div>'
          + (can?'':'<div class="forge-recipe-low">MATERIALS LOW</div>')
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

  var flavor = recipe.flavor || relic.flavor || '';
  insp.innerHTML =
    // Hero
    '<div class="forge-insp-hero" style="background:radial-gradient(ellipse at 50% 0%,'+color+'33,transparent 60%);">'
      + '<div class="forge-insp-hero-icon-wrap" style="background:radial-gradient(circle at 50% 60%,'+color+'66,transparent 70%);border-color:'+color+';box-shadow:0 0 24px '+color+'66,inset 0 0 18px rgba(0,0,0,.4);">'
        + '<div class="forge-insp-hero-glow" style="background:conic-gradient(from 0deg,transparent,'+color+'55,transparent 50%);"></div>'
        + '<span class="forge-insp-hero-icon">'+relicImgHTML(id,'72px')+'</span>'
      + '</div>'
      + '<div class="forge-insp-hero-tier" style="color:'+color+';">'+label+' TIER · RELIC RECIPE</div>'
      + '<div class="forge-insp-hero-name">'+relic.name+'</div>'
      + (flavor?'<div class="forge-insp-hero-flavor">'+flavor+'</div>':'')
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

  // Push job — totalMs derived from tier's craft time (in seconds)
  var totalSec = (RELIC_CRAFT_TIMES[recipe.tier] || 600);
  b.queue.push({ relicId: relicId, startTime: Date.now(), totalMs: totalSec * 1000 });

  if(typeof playCraftStartSfx === 'function') playCraftStartSfx();
  showTownToast('Forging '+RELICS[relicId].name+'…');
  savePersist();
  refreshForgePanel();
}

function cancelForgeCraft(slotIdx){
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.queue || !b.queue[slotIdx]) return;
  var job = b.queue[slotIdx];
  var relic = RELICS[job.relicId];
  var name = relic ? relic.name : job.relicId;
  var msg = 'Cancel forging '+name+'?\n\nMaterials are NOT refunded.';
  if(!confirm(msg)) return;
  b.queue.splice(slotIdx, 1);
  showTownToast('Forge cancelled. Materials lost.');
  savePersist();
  refreshForgePanel();
}

function collectForgeCraft(slotIdx){
  var b = PERSIST.town.buildings.forge;
  if(!b || !b.queue || !b.queue[slotIdx]) return;
  var job = b.queue[slotIdx];
  var elapsed = Date.now() - job.startTime;
  if(elapsed < job.totalMs) return; // not ready
  var relic = RELICS[job.relicId];
  if(!PERSIST.town.relics) PERSIST.town.relics = {};
  PERSIST.town.relics[job.relicId] = (PERSIST.town.relics[job.relicId]||0) + 1;
  b.queue.splice(slotIdx, 1);
  if(typeof playCraftDoneSfx === 'function') playCraftDoneSfx();
  showTownToast('✦ '+(relic?relic.name:'Relic')+' added to inventory!');
  addLog('✦ Forge complete: '+(relic?relic.name:job.relicId)+' added to inventory.','sys');
  savePersist();
  refreshForgePanel();
}

// ── Shard Well tick ───────────────────────────────────────────────────
var SHARD_WELL_BASE_SECS=300;
function getShardWellRate(){
  var b=PERSIST.town.buildings.shard_well;
  if(!b||!b.unlocked) return 0;
  return 120; // 1 shard per 2 min
}

function shardWellTick(seconds){
  var b=PERSIST.town.buildings.shard_well;
  if(!b||!b.unlocked) return;
  if(!b.shardAcc) b.shardAcc=0;
  var rate=getShardWellRate();
  if(rate<=0) return;
  b.shardAcc+=seconds;
  var earned=Math.floor(b.shardAcc/rate);
  if(earned>0){
    b.shardAcc-=earned*rate;
    PERSIST.soulShards=(PERSIST.soulShards||0)+earned;
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
  banner.innerHTML='<div style="display:flex;align-items:center;gap:10px;padding:6px 14px;background:rgba(6,3,1,.6);border-bottom:1px solid #1e1006;">'
    +'<span style="font-family:Cinzel,serif;font-size:8px;color:#7a5020;letter-spacing:1px;">SOUL SHARDS</span>'
    +'<span style="font-family:Cinzel,serif;font-size:11px;color:#c09030;">🔮 '+souls+'</span>'
    +(canSummon
      ?'<button onclick="openBuilding(\'shard_well\')" style="font-family:Cinzel,serif;font-size:8px;padding:4px 10px;border-radius:3px;border:1px solid #c09030;background:rgba(40,22,4,.9);color:#d4a843;cursor:pointer;margin-left:auto;">SUMMON ✦</button>'
      :'<span style="font-size:8px;color:#3a2810;margin-left:auto;">'+(SOUL_SHARDS_PER_PULL-souls)+' more to summon</span>')
    +'</div>';
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

  // Fragment reward — scales with area level
  var areaLevel=gs&&gs.area?gs.area.level:1;
  var fragReward=Math.round(10+areaLevel*4); // Lv1=14, Lv5=30, Lv10=50
  PERSIST.town.cardFragments=(PERSIST.town.cardFragments||0)+fragReward;

  // Gem shard reward — small amount from area clears
  var shardReward=areaLevel>=3?Math.floor(areaLevel/3):0;
  if(shardReward>0) PERSIST.town.materials.gemShards=(PERSIST.town.materials.gemShards||0)+shardReward;

  savePersist();

  // Build rewards display
  var rewardsRow=document.getElementById('spoils-rewards-row');
  if(rewardsRow){
    rewardsRow.innerHTML=
      '<div style="background:rgba(0,0,0,.4);border:1px solid #4a3010;border-radius:8px;padding:12px 18px;min-width:90px;">'
        +'<div style="font-size:28px;margin-bottom:4px;">🃏</div>'
        +'<div style="font-family:Cinzel,serif;font-size:16px;color:#d4a843;">+'+fragReward+'</div>'
        +'<div style="font-size:8px;color:#7a6030;margin-top:2px;">Card Fragments</div>'
      +'</div>'
      +(shardReward>0?
        '<div style="background:rgba(0,0,0,.4);border:1px solid #4a3010;border-radius:8px;padding:12px 18px;min-width:90px;">'
          +'<div style="font-size:28px;margin-bottom:4px;">💎</div>'
          +'<div style="font-family:Cinzel,serif;font-size:16px;color:#d4a843;">+'+shardReward+'</div>'
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
        +'<div style="font-family:Cinzel,serif;font-size:10px;color:#d4a843;">'+(cd?cd.name:picked)+'</div>'
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
var RARITY_COL   = {common:'#c8a050',uncommon:'#50d050',rare:'#5090ff',legendary:'#ffd040'};
var RARITY_ORDER = {legendary:0,rare:1,uncommon:2,common:3};
var RARITY_SYM   = {common:'◆',uncommon:'◈',rare:'✦',legendary:'★'};
var RARITY_BG    = {
  common:   'linear-gradient(135deg,#1a1208,#100c04)',
  uncommon: 'linear-gradient(135deg,#081a08,#041004)',
  rare:     'linear-gradient(135deg,#080e20,#040810)',
  legendary:'linear-gradient(135deg,#201004,#100800)'
};

// ── Inject CSS once ──
(function(){
  if(document.getElementById('summons-css')) return;
  var s=document.createElement('style');
  s.id='summons-css';
  s.textContent=
    '@keyframes es-bg-pulse{0%,100%{opacity:.55}50%{opacity:.9}}'+
    '@keyframes es-ring-spin{to{transform:rotate(360deg)}}'+
    '@keyframes es-ring-spinr{to{transform:rotate(-360deg)}}'+
    '@keyframes es-title-glow{0%,100%{text-shadow:0 0 20px #9060ff80,0 0 60px #6030c040}50%{text-shadow:0 0 32px #b080ff,0 0 80px #7040d060,0 0 130px #5020a040}}'+
    '@keyframes es-card-breathe{0%,100%{box-shadow:0 0 10px #40208040,0 6px 24px #00000070}50%{box-shadow:0 0 28px #7040c070,0 6px 32px #00000090}}'+
    '@keyframes es-reveal-pulse{0%,100%{box-shadow:0 0 30px #7030c040,0 0 70px #5020a020}50%{box-shadow:0 0 50px #9050e060,0 0 110px #7030c040}}'+
    '@keyframes es-shockwave{0%{transform:translate(-50%,-50%) scale(.1);opacity:.9}100%{transform:translate(-50%,-50%) scale(3.5);opacity:0}}'+
    '.es-overlay{position:fixed;inset:0;z-index:9000;background:#04010e;overflow-y:auto;font-family:Georgia,serif;}'+
    '.es-card-wrap{position:absolute;width:130px;height:180px;perspective:700px;cursor:default;}'+
    '.es-card-inner{width:100%;height:100%;transform-style:preserve-3d;position:relative;}'+
    '.es-face,.es-back{position:absolute;inset:0;border-radius:12px;backface-visibility:hidden;-webkit-backface-visibility:hidden;}'+
    '.es-back{background:linear-gradient(135deg,#1c0935,#0d051f);border:2px solid #4020a0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;animation:es-card-breathe 2.2s ease-in-out infinite;}'+
    '.es-back::before{content:"";position:absolute;inset:8px;border:1px solid #3010a030;border-radius:8px;}'+
    '.es-back::after{content:"";position:absolute;inset:0;border-radius:12px;background:repeating-linear-gradient(45deg,transparent,transparent 9px,#ffffff03 9px,#ffffff03 10px);}'+
    '.es-face{transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px;gap:5px;border:2px solid #333;}'+
    '.es-pool-card{background:#0e0618;border:1px solid #1e0a30;border-radius:8px;padding:9px 8px;display:flex;flex-direction:column;gap:3px;transition:border-color .2s,opacity .2s;}'+
    '.es-pool-card:hover{border-color:#4020a0;}'+
    '.es-btn{padding:12px 28px;border-radius:8px;cursor:pointer;font-family:Georgia,serif;font-size:14px;font-weight:bold;letter-spacing:1px;border:none;transition:transform .12s,filter .12s;}'+
    '.es-btn:hover{transform:translateY(-2px);filter:brightness(1.2);}'+
    '.es-btn:active{transform:translateY(1px);}'+
    '.es-btn-single{background:linear-gradient(135deg,#2a1060,#4020a0);color:#c0a0ff;border:1px solid #6030c0;}'+
    '.es-btn-multi{background:linear-gradient(135deg,#301000,#804020);color:#ffc080;border:1px solid #c06030;}'+
    '.es-btn-shards{background:linear-gradient(135deg,#0a2010,#103020);color:#80e080;border:1px solid #308040;font-size:12px;padding:8px 16px;}'+
    '.es-reveal-btn{padding:14px 52px;background:linear-gradient(135deg,#2a0a50,#5010a0,#2a0a50);color:#e0b0ff;border:1px solid #9050e0;border-radius:8px;cursor:pointer;font-family:Georgia,serif;font-size:16px;letter-spacing:3px;animation:es-reveal-pulse 2s ease-in-out infinite;transition:transform .15s,filter .15s;}'+
    '.es-reveal-btn:hover{transform:scale(1.05);filter:brightness(1.25);}';
  document.head.appendChild(s);
})();

// ── Canvas state ──
var _canvasCtx=null,_canvasEl=null,_canvasPhase='idle';
var _vortexParticles=[],_burstParticles=[];
var _vortexCX=0,_vortexCY=0;

function openTestGacha(){
  var ex=document.getElementById('summons-overlay');
  if(ex){ _summonsTeardown(); ex.remove(); return; }

  var pool=buildGachaPool();
  pool.sort(function(a,b){return (RARITY_ORDER[a.rarity]||3)-(RARITY_ORDER[b.rarity]||3)||(a.name<b.name?-1:1);});

  var ov=document.createElement('div');
  ov.className='es-overlay'; ov.id='summons-overlay';

  ov.innerHTML=
    '<div style="position:fixed;inset:0;pointer-events:none;z-index:0;">'+
      '<div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 38%,#1a0540 0%,#04010e 68%);animation:es-bg-pulse 4s ease-in-out infinite;"></div>'+
      '<canvas id="es-canvas" style="position:absolute;inset:0;width:100%;height:100%;"></canvas>'+
    '</div>'+
    '<div id="es-rings" style="position:fixed;top:38%;left:50%;pointer-events:none;z-index:1;">'+
      '<svg id="es-ring1" width="480" height="480" viewBox="0 0 480 480" style="position:absolute;transform:translate(-50%,-50%);opacity:.14;animation:es-ring-spin 18s linear infinite;">'+
        '<circle cx="240" cy="240" r="210" fill="none" stroke="#8040ff" stroke-width="1" stroke-dasharray="8 18"/>'+
        '<circle cx="240" cy="240" r="165" fill="none" stroke="#6030c0" stroke-width="1" stroke-dasharray="4 22"/>'+
      '</svg>'+
      '<svg id="es-ring2" width="360" height="360" viewBox="0 0 360 360" style="position:absolute;transform:translate(-50%,-50%);opacity:.08;animation:es-ring-spinr 12s linear infinite;">'+
        '<circle cx="180" cy="180" r="155" fill="none" stroke="#c080ff" stroke-width="1.5" stroke-dasharray="3 14"/>'+
      '</svg>'+
    '</div>'+
    '<div id="es-pinpoint" style="position:fixed;top:38%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;border-radius:50%;background:#fff;z-index:2;pointer-events:none;opacity:0;box-shadow:0 0 8px #fff,0 0 30px #c080ff,0 0 80px #8040ff;"></div>'+
    '<div id="es-shockwave" style="position:fixed;top:38%;left:50%;width:200px;height:200px;border-radius:50%;border:3px solid #fff;z-index:3;pointer-events:none;opacity:0;display:none;"></div>'+
    '<div id="es-leg-iso" style="position:fixed;inset:0;background:#000;z-index:8990;pointer-events:none;opacity:0;display:none;"></div>'+
    '<div style="position:relative;z-index:4;max-width:940px;margin:0 auto;padding:24px 16px;">'+
      '<div style="text-align:center;margin-bottom:8px;">'+
        '<div style="color:#7040a0;font-size:11px;letter-spacing:4px;margin-bottom:6px;">✦ ✦ ✦</div>'+
        '<h1 style="margin:0;font-size:28px;font-weight:normal;letter-spacing:3px;color:#c8a0ff;animation:es-title-glow 3s ease-in-out infinite;">THE ETERNAL SUMMONS</h1>'+
        '<div style="color:#5030a0;font-size:12px;letter-spacing:2px;margin-top:6px;">BIND A SOUL TO YOUR CAUSE</div>'+
      '</div>'+
      '<div style="text-align:center;margin-bottom:20px;"><span style="color:#9070c0;font-size:14px;">🔮 <span id="es-shards">0</span> Soul Shards</span></div>'+
      '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px;flex-wrap:wrap;align-items:center;">'+
        '<button class="es-btn es-btn-single" onclick="doEternalPull(1)">🔮 SUMMON ONE<br><span style="font-size:10px;opacity:.7;font-weight:normal">100 Soul Shards</span></button>'+
        '<button class="es-btn es-btn-multi"  onclick="doEternalPull(10)">🔥 SUMMON TEN<br><span style="font-size:10px;opacity:.7;font-weight:normal">1000 Soul Shards</span></button>'+
        '<button class="es-btn es-btn-shards" onclick="testAddShards()">✦ +500 Shards</button>'+
        '<button onclick="_summonsTeardown();document.getElementById(\'summons-overlay\').remove()" style="padding:8px 16px;background:transparent;border:1px solid #2a1060;color:#503080;border-radius:6px;cursor:pointer;font-size:12px;">✕ CLOSE</button>'+
      '</div>'+
      '<div id="es-stage" style="position:relative;min-height:220px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;">'+
        '<div style="color:#2a1450;font-size:13px;letter-spacing:2px;">AWAITING THE SUMMONS</div>'+
      '</div>'+
      '<div id="es-reveal-wrap" style="text-align:center;margin-bottom:28px;display:none;">'+
        '<button class="es-reveal-btn" onclick="revealAllSummons()" style="display:none;">✦ &nbsp; REVEAL ALL &nbsp; ✦</button>'+
      '</div>'+
      '<div style="border-top:1px solid #1a0840;padding-top:20px;">'+
        '<div style="color:#4020a0;font-size:11px;letter-spacing:3px;margin-bottom:12px;" id="es-pool-label">KNOWN ENTITIES — SOULS IN THE VOID</div>'+
        '<div id="es-pool-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:8px;"></div>'+
      '</div>'+
    '</div>'+
    '<div id="summons-flash" style="position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:0;background:#000;transition:opacity .35s;"></div>';

  document.body.appendChild(ov);

  // Fill shard count and pool grid after DOM ready
  var shEl=document.getElementById('es-shards');
  if(shEl) shEl.textContent=(PERSIST.soulShards||0);
  _refreshSummonsPoolGrid();
  _initCanvas();
}

function _buildPoolGrid(pool){
  return pool.map(function(e){
    var cr=CREATURES[e.id];
    var col=RARITY_COL[e.rarity]||'#888';
    var owned=PERSIST.unlockedChamps&&PERSIST.unlockedChamps.includes(e.id);
    var dupes=(PERSIST.champDupes&&PERSIST.champDupes[e.id])||0;
    var deck=CREATURE_DECKS[e.id];
    var uniq=deck?[...new Set(deck.cards)].filter(function(x){return x!=='strike'&&x!=='brace';}).map(function(x){return CARDS[x]?CARDS[x].name:x;}).join(' · '):'';
    return '<div class="es-pool-card" style="opacity:'+(owned?'1':'0.38')+';border-color:'+(owned?col+'44':'#1a0830')+'">'
      +'<div style="display:flex;align-items:center;gap:8px;">'
        +creatureImgHTML(cr.id, cr.icon, '36px')
        +'<div style="min-width:0;flex:1;">'
          +'<div style="color:'+col+';font-size:9px;font-weight:bold;letter-spacing:1px;">'+e.rarity.toUpperCase()+'</div>'
          +'<div style="color:#d0b080;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+cr.name+'</div>'
        +'</div>'
        +(owned?'<span style="flex-shrink:0;color:#50c050;font-size:9px;">✓'+(dupes?'+'+dupes:'')+'</span>':'')
      +'</div>'
      +'<div style="color:#504060;font-size:9px;">'+cr.baseStats.str+'/'+cr.baseStats.agi+'/'+cr.baseStats.wis+' · '+cr.innate.name+'</div>'
      +(uniq?'<div style="color:#382848;font-size:8px;">'+uniq+'</div>':'')
    +'</div>';
  }).join('');
}

// ── Canvas ──
function _initCanvas(){
  _canvasEl=document.getElementById('es-canvas');
  if(!_canvasEl) return;
  _canvasEl.width=window.innerWidth; _canvasEl.height=window.innerHeight;
  _canvasCtx=_canvasEl.getContext('2d');
  _canvasPhase='idle';
  _vortexParticles=[]; _burstParticles=[];
  _vortexCX=window.innerWidth*0.5;
  _vortexCY=window.innerHeight*0.38;
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
  var palettes={
    legendary:['#ffd040','#ffb000','#fff0a0','#ff8000','#ffffff'],
    rare:      ['#5090ff','#80b8ff','#2060d0','#c0d8ff','#ffffff'],
    uncommon:  ['#50d050','#80ff80','#30a030','#c0ffc0','#ffffff'],
    common:    ['#c8a050','#e0c080','#a08040','#f0e0a0','#ffffff']
  };
  var pal=palettes[bestRarity]||palettes.common;
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
  var btns=document.querySelectorAll('.es-btn-single,.es-btn-multi');
  btns.forEach(function(btn){
    btn.disabled=locked;
    btn.style.cursor=locked?'not-allowed':'';
    btn.style.pointerEvents=locked?'none':'';
  });
}

// ── Pull ──
function doEternalPull(count){
  if(_summoningActive) return; // locked during animation
  var cost=count*100;
  if((PERSIST.soulShards||0)<cost){
    var st=document.getElementById('es-stage');
    if(st) st.innerHTML='<div style="color:#f06060;font-size:13px;letter-spacing:1px;">NOT ENOUGH SHARDS — NEED '+cost+'</div>';
    return;
  }

  // Lock buttons with SUMMONING... feedback
  _summoningActive=true;
  _setSummoningButtons(true);
  PERSIST.soulShards-=cost; savePersist();
  var el=document.getElementById('es-shards'); if(el) el.textContent=PERSIST.soulShards;

  var pool=buildGachaPool();
  _gachaResults=[];
  var bestRarity='common';
  for(var i=0;i<count;i++){
    var roll=Math.random();
    var rarity=roll<0.04?'legendary':roll<0.17?'rare':roll<0.45?'uncommon':'common';
    if((RARITY_ORDER[rarity]||3)<(RARITY_ORDER[bestRarity]||3)) bestRarity=rarity;
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
  if(st){ st.style.display='flex'; st.style.alignItems='center'; st.style.justifyContent='center'; st.innerHTML='<div style="color:#2a1060;font-size:11px;letter-spacing:3px;animation:es-bg-pulse 1s ease-in-out infinite;">BINDING SOULS...</div>'; }
  var rw=document.getElementById('es-reveal-wrap'); if(rw) rw.style.display='none';

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

  var cardW=158,cardH=220,gapX=14,gapY=20;
  var stW=st.offsetWidth||700;

  // Separate legendaries from the rest
  var legs=[], rest=[];
  _gachaResults.forEach(function(r,i){ (r.rarity==='legendary'?legs:rest).push({r:r,i:i}); });

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
    var scale=isLeg?'1.08':'1';

    var wrap=document.createElement('div');
    wrap.className='es-card-wrap'; wrap.id='es-card-'+i;
    wrap.style.left=finalX+'px'; wrap.style.top=finalY+'px';
    wrap.style.transform='translate('+(cx-finalX)+'px,'+(cy-finalY)+'px) scale(0.06)';
    wrap.style.opacity='0';

    wrap.innerHTML=
      '<div class="es-card-inner" id="es-inner-'+i+'">'
        +'<div class="es-back" style="transform:rotateY(180deg);border-color:'+rc+'60;box-shadow:0 0 18px '+rc+'30,inset 0 0 12px '+rc+'15;">'
          +'<div style="font-size:30px;color:'+rc+'50;">🔮</div>'
          +'<div style="color:'+rc+'60;font-size:9px;letter-spacing:2px;">✦</div>'
        +'</div>'
        +'<div class="es-face" style="transform:rotateY(0deg);background:'+RARITY_BG[r.rarity]+';border-color:'+rc+';box-shadow:0 0 24px '+rc+'50,inset 0 0 20px '+rc+'12;">'
          +(isLeg?'<div style="font-size:10px;color:#ffd04090;letter-spacing:3px;margin-bottom:2px;">★ LEGENDARY ★</div>':'')
          +'<div style="display:flex;align-items:center;justify-content:center;margin:2px 0;">'+creatureImgHTML(r.c.id, r.c.icon, isLeg?'56px':'44px')+'</div>'
          +'<div style="color:'+rc+';font-size:10px;letter-spacing:2px;font-weight:bold;">'+RARITY_SYM[r.rarity]+' '+r.rarity.toUpperCase()+' '+RARITY_SYM[r.rarity]+'</div>'
          +'<div style="color:#e8d0a0;font-size:11px;text-align:center;line-height:1.3;">'+r.c.name+'</div>'
          +'<div style="width:75%;height:1px;background:'+rc+'40;margin:3px 0;"></div>'
          +'<div style="color:'+rc+'80;font-size:9px;text-align:center;">'+r.c.innate.name+'</div>'
          +'<div style="margin-top:5px;padding:3px 8px;border-radius:10px;background:'+(r.isNew?'#0d200d':'#1e0b00')+';color:'+(r.isNew?'#60e060':'#a06040')+';font-size:9px;letter-spacing:1px;">'+(r.isNew?'✨ NEW!':'DUPLICATE')+'</div>'
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
        if(inner) inner.style.filter=
          card.isLeg ? 'drop-shadow(0 0 40px #ffd040) drop-shadow(0 0 100px #ffa000) drop-shadow(0 0 160px #ffd04060)' :
          card.rarity==='rare' ? 'drop-shadow(0 0 16px '+card.rc+') drop-shadow(0 0 45px '+card.rc+'50)' :
          card.rarity==='uncommon' ? 'drop-shadow(0 0 10px '+card.rc+'80)' : '';
      }, 300);

      // Legendary: particles from card after glow settles
      if(card.isLeg){
        setTimeout(function(){
          var lr=card.wrap.getBoundingClientRect();
          _legParticles(lr.left+lr.width/2, lr.top+lr.height/2);
        }, 450);
      }
    }, delay);
  });

  setTimeout(function(){ _refreshSummonsPoolGrid(); _summoningActive=false; _setSummoningButtons(false); }, allCards.length*50+1200);
}


// Stubs — kept for any lingering references but logic moved into _dealCards
function revealAllSummons(){ /* no-op — explosion IS the reveal */ }
function _flipCard(idx){ /* no-op — cards erupt face-up */ }
function _legendaryReveal(idx){ /* no-op — handled in _dealCards */ }

function _legParticles(cx,cy){
  var pal=['#ffd040','#ffb000','#fff0a0','#ff8000','#ffffff','#ffe080'];
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

function testAddShards(){
  PERSIST.soulShards=(PERSIST.soulShards||0)+500; savePersist();
  var el=document.getElementById('es-shards'); if(el) el.textContent=PERSIST.soulShards;
}

function _refreshSummonsPoolGrid(){
  var grid=document.getElementById('es-pool-grid'); if(!grid) return;
  var lbl=document.getElementById('es-pool-label');
  var pool=buildGachaPool();
  pool.sort(function(a,b){return (RARITY_ORDER[a.rarity]||3)-(RARITY_ORDER[b.rarity]||3)||(a.name<b.name?-1:1);});
  if(lbl) lbl.textContent='KNOWN ENTITIES — '+pool.length+' SOULS IN THE VOID';
  grid.innerHTML=_buildPoolGrid(pool);
}

// ═══════════════════════════════════════════════════════
// TUTORIAL SYSTEM
// ═══════════════════════════════════════════════════════

var TUTORIALS = {
  deck_builder_intro: {
    title:'Deck Builder',
    isNpc: false,
    pages:[
      {body:'<strong>Build your champion\'s deck from a unified card library.</strong> Cards in your deck appear on the left. The card library fills the centre. Click any card to inspect it on the right; click <span style="color:#7fc06a;">+</span> on a library card to add a copy, or <span style="color:#d05858;">−</span> on a deck row to remove one.', tip:null},
      {body:'<strong>Filter the library</strong> with the <span style="color:#d4a843;">SOURCE</span> chips: <span style="color:#d4a843;">CHAMPION</span> shows your native cards, <span style="color:#d4a843;">UNIVERSAL</span> shows Strike / Brace / Dead Weight, <span style="color:#d4a843;">SHARED</span> shows cards borrowed from other Ruby+ ascended champions, <span style="color:#d4a843;">COLLECTION</span> shows anything else you\'ve unlocked. Empty categories are hidden.', tip:null},
      {body:'The <span style="color:#d4a843;">TYPE</span> chips narrow by Attack / Defense / Utility. The <span style="color:#d4a843;">Search</span> box matches card names as you type. The <span style="color:#d4a843;">Sort</span> dropdown reorders by mana, name, source, or type. Filters are orthogonal — combine them freely.', tip:null},
      {body:'<strong>Dead Weight</strong> (the orange-glowing rows) fills any deck slot you haven\'t assigned. Your deck size scales with STR — every unassigned slot becomes a Dead Weight. Mechanically: it is a [Sorcery] card that spends <span style="color:#5080c0;">all your current mana</span> to draw 1 card; if you have no mana, the Sorcery does not fire.', tip:null},
      {body:'<strong>Ascension sharing:</strong> once a champion reaches Ruby tier or above, they can use cards from other Ruby+ champions via the <span style="color:#d4a843;">SHARED</span> filter. Borrowed cards display a gold "↗" badge and the inspector shows where they came from. Their effects fire normally; stat scaling uses the active champion\'s stats.', tip:null},
    ]
  },
  combat_intro: {
    title:'Combat Basics',
    isNpc: true,
    pages:[
      {body:'Cards are drawn from your deck into your hand on a timer. Your hand holds up to 7 cards. When a new card is drawn into a full hand, the oldest card in hand is played automatically. You can click any card in hand to play it immediately. Playing a card costs <span style="color:#5080c0;">mana</span>.',
       tip:null},
      {body:'<span style="color:#c05050;">STR</span> determines maximum HP. <span style="color:#c0a030;">AGI</span> determines draw speed and card play speed. <span style="color:#5080c0;">WIS</span> determines maximum mana and mana regeneration rate. All three stats increase each level according to your champion\'s growth rates.',
       tip:null},
      {body:'Enemies operate on the same card system. Each enemy has a deck and a draw timer shown as a bar below their portrait. Every enemy plays a fixed <strong>opening move</strong> on their first action before entering their normal draw cycle.',
       tip:null},
    ]
  },
  combat_mana: {
    title:'Mana System',
    isNpc: true,
    pages:[
      {body:'Your mana pool maximum is <span style="color:#5080c0;">WIS × 5</span>. Mana regenerates at approximately <span style="color:#5080c0;">WIS × 0.8 + 2</span> per second. Some card effects require mana — look for the <span style="color:#5080c0;">[Sorcery]</span> keyword. If your mana is too low, the sorcery effect won\'t fire but the base effect still plays.',
       tip:null},
    ]
  },
  town_intro: {
    title:'Welcome to Town',
    isNpc: true,
    pages:[
      {body:'The Town is your base between runs. Buildings provide persistent benefits — store materials, track quests, catalogue creatures, and more. Some buildings are available immediately, others unlock as you progress.',
       tip:null},
      {body:'Gold earned during runs is banked when a run ends. Gold is spent to unlock buildings, purchase items, and claim rewards. Buildings have an XP track — they level up from area clears, unlocking new features at higher levels.',
       tip:null},
    ]
  },
  vault_intro: {
    title:'Shtole — Vault Keeper',
    isNpc: true,
    pages:[
      {body:'"Ah, welcome. This is the Vault. Everything you gather out there, materials, resources, it all comes here. I keep it safe. I keep it organised. Nothing goes missing."'},
      {body:'"Materials come from the areas you explore. Each area drops different things. The rarer the material, the harder the area. I sort them for you. You just need to check in after your runs."'},
      {body:'"One thing to watch. Storage has limits. If the shelves are full, I cannot accept more. Come back often, spend what you have at the Forge, and we will not have problems. ...I promise nothing has gone missing."'},
    ]
  },
  adventurers_hall_intro: {
    title:'Leona — Guild Girl',
    isNpc: true,
    pages:[
      {body:'"Oh! You\'re here for the first time! Welcome to the Adventurer\'s Hall! This is where all the action gets... coordinated. By me. Professionally."'},
      {body:'"The QUESTS tab has bounties pinned to the board. Pick one that matches where you\'re heading, go complete it, then come back to claim your reward. Simple! I mean — standard procedure."'},
      {body:'"The ACHIEVEMENTS tab tracks your overall progress. Some achievements reward gold when you hit milestones. I keep very thorough records. Very thorough."'},
      {body:'"Once the Hall levels up, I\'ll open EXPEDITIONS too. You can send your champions on timed missions for materials and experience while you focus on other things. I\'ll keep track of everything. That\'s my job. Which I love."'},
    ]
  },
  forge_intro: {
    title:"M'bur — Forge Keeper",
    isNpc: true,
    pages:[
      {body:'"Welcome to the Forge. I turn ore and rot into things that matter. Bring me materials and I\'ll make a relic — small object, big consequence."', tip:null},
      {body:'Each recipe lists its materials and craft time. The Forge has up to three slots for parallel crafts. <span style="color:#d4a843;">Lv.1</span> opens the first slot, <span style="color:#d4a843;">Lv.3</span> the second, <span style="color:#d4a843;">Lv.5</span> the third. Slots run independently — each one finishes on its own timer.', tip:null},
      {body:'Pick a recipe on the left to inspect it on the right. Materials show <span style="color:#7fc06a;">✓</span> when you have enough, <span style="color:#d05858;">✗</span> when you don\'t. Click <span style="color:#e87040;">⚒ BEGIN FORGING</span> to start a craft — materials are consumed immediately. Cancelling an in-progress craft does NOT refund materials.', tip:null},
      {body:'When a craft completes, the slot pulses and a <span style="color:#f0a53a;">COLLECT</span> button appears. Collected relics enter your inventory; equip them at the Sanctum on any Ruby+ ascended champion. Their effects fire automatically in combat.', tip:null},
    ]
  },
  shrine_intro: {
    title:'The Shrine',
    isNpc: true,
    pages:[
      {body:'The Shrine grants one blessing per run, applied at run start. Available blessings are gated by Shrine level. Slotting a higher-tier gem unlocks higher-level blessings. Blessings are not permanent — they apply only to the run in which they are granted.',
       tip:null},
    ]
  },
  bestiary_intro: {
    title:'Hoot — Archivist',
    isNpc: true,
    pages:[
      {body:'"Ah! A visitor! Welcome to the Bestiary. I\'m Hoot. I catalogue things. Every creature, every location, every little detail. It\'s... it\'s what I do. Hoo."'},
      {body:'"When you encounter a creature in combat, it appears here automatically. You can see its stats, its cards, its innate ability — everything you\'ve learned about it. Knowledge is survival out there."'},
      {body:'"Each creature has CHALLENGES. Defeat enough of them and you\'ll earn gold rewards. Complete all four challenges and you\'ll receive something... special. Very motivating for field work."'},
      {body:'"The LOCATIONS tab shows every area you\'ve explored. The GLOSSARY tab explains all the keywords you\'ll see on cards — burns, poisons, shields, all of it. I organised them myself. Twice."'},
    ]
  },
  market_intro: {
    title:'The Merchant',
    isNpc: true,
    pages:[
      {body:'"Ah, a customer! Welcome to my humble establishment. I deal in materials, knowledge, and... occasionally, things of great rarity. Everything has a price."'},
      {body:'"The WARES tab has my regular stock — materials, XP tomes, building scrolls. Stock refreshes every hour, so check back often. Once something sells out, it\'s gone until the next restock."'},
      {body:'"At Market Level 3, I\'ll start offering DEALS — bundled goods at a discount. And at Level 5... well, let\'s just say I have connections. The RARE FINDS shelf is worth saving for."'},
      {body:'"A word of advice: gold is easy to earn, harder to keep. Buy what you need, save for what you want. The rare shelf rotates every 24 hours. Miss something good? Could be weeks before I find another."'},
    ]
  },
  sanctum_intro: {
    title:'Theo — Ex-Champion',
    isNpc: true,
    pages:[
      {body:'"Welcome to the Sanctum. This is where champions become... well, more like me. I\'m Theo. Retired champion. Undefeated. Mostly."'},
      {body:'"The OVERVIEW tab shows your champion\'s stats, level, and mastery progress. Mastery XP is earned through combat — you can\'t buy it. Believe me, I tried."'},
      {body:'"Once the mastery bar is full AND you have the right gem, hit ASCEND. Your champion resets to level 1 but with higher base stats, better growth, and a shiny new RELIC SLOT. It\'s worth it. I would know."'},
      {body:'"The RELICS tab lets you equip relics into your unlocked slots. Fair warning — removing a relic DESTROYS it. No take-backs. Even I learned that the hard way."'},
    ]
  },
  board_intro: {
    title:"The Adventurer's Board",
    isNpc: true,
    pages:[
      {body:'The Board offers quests with specific completion conditions. One quest may be active at a time. Quest progress is tracked across runs. Completing a quest awards its listed reward — gold, <span style="color:#d4a843;">🃏 Fragments</span>, <span style="color:#2980b9;">💎 Gem Shards</span>, or Materials. Incomplete quests can be abandoned; the slot refreshes on a timer.',
       tip:null},
    ]
  },
  shard_well_intro: {
    title:'The Shard Well',
    isNpc: true,
    pages:[
      {body:'The Shard Well passively generates <span style="color:#2980b9;">💎 Gem Shards</span> on a timer. Slotting a gem reduces that timer. Gem Shards are also earned from higher-level area clears and can be crafted into gem cards in the Vault.',
       tip:null},
      {body:'The Shard Well also connects to the <strong>Eternal Summons</strong>. You earn <span style="color:#c8a0ff;">🔮 Soul Shards</span> passively after every completed run. At 100 Soul Shards, you may perform a summon. Summoning draws a random champion from the pool of enemies you have encountered. Duplicate results grant Ascension tokens for that champion.',
       tip:null},
    ]
  },
  sanctum_deck_edit: {
    title:'Deck Editing',
    isNpc: true,
    pages:[
      {body:'Click any card in the deck grid to open its edit panel. Available operations: <strong>Remove</strong> (-1 copy, 10 🃏), <strong>Add copy</strong> (+1 copy of an existing card, 25 🃏), <strong>Swap</strong> (replace a Strike or Brace with a champion card, 30 🃏). All operations spend <span style="color:#d4a843;">🃏 Card Fragments</span>.',
       tip:null},
      {body:'The <strong>Available Cards</strong> section shows champion-specific cards not yet in the deck (swappable in) and your <strong>Sanctum Collection</strong> — cards earned from runs. Collection cards cost 15 🃏 to add. <strong>Reset to Default</strong> wipes all modifications for this champion and is always free.',
       tip:null},
    ]
  },
};

// Seen tutorials stored in PERSIST
var _tutQueue=[];   // pending tutorial ids to show in sequence
var _tutCurrent=null;
var _tutPage=0;

function showTutorial(id){
  if(!SETTINGS.tutorial) return;
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


