// ════════════════════════════════════════════════════════════════
// EXPEDITION HALL  —  expedition.js
// ════════════════════════════════════════════════════════════════
//
// This file owns the entire Expedition Hall system:
//
//   DATA
//     EXPEDITION_TYPES        — type definitions (Scout, Raid, Deep, etc.)
//     EXPEDITION_UPGRADES     — building level costs and what each unlocks
//     EXPEDITION_BONUS_DROPS  — per-expedition rare bonus drop table
//
//   HELPERS
//     getExpeditionHallLevel()           — current building level
//     getExpeditionSlotCount()           — how many slots are active
//     isExpeditionTypeUnlocked(typeId)   — level gate check
//     fmtExpTime(ms)                     — "1h 23m" formatting
//
//   CORE LOGIC
//     calcExpeditionReward(slot)         — full reward calculation
//     applyExpeditionReward(reward)      — write rewards to PERSIST
//     sendExpedition(slotIdx, ...)       — dispatch a champion
//     recallExpedition(slotIdx)          — early return, partial reward
//     collectExpedition(slotIdx)         — claim completed expedition
//     upgradeExpeditionHall()            — spend gold+mats to level up
//     expeditionTick()                   — called by global idle ticker
//
//   UI
//     refreshExpeditionHallPanel()       — main panel render
//     _buildExpSendFlow()                — 3-step send UI (champ→area→type)
//     _showExpeditionRewardUI(...)       — animated reward reveal overlay
//     _closeExpeditionReward()           — dismiss overlay
//
//   SEND FLOW STATE (module-private)
//     _expSendSlot, _expSendStep, _expSendChamp, _expSendArea
//
// Dependencies (from game.js):
//   PERSIST, CREATURES, AREA_DEFS, MATERIAL_DROPS, MATERIALS, RELICS,
//   ASCENSION_TIERS, getChampPersist, getCreaturePlayable,
//   getAscensionLevel, savePersist, showTownToast, buildTownGrid,
//   showLockedBuildingUI, creatureImgHTML
//
// ════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// EXPEDITION HALL
// ═══════════════════════════════════════════════════════

// ── Expedition type definitions ──────────────────────
var EXPEDITION_TYPES = {
  scout:      { id:'scout',      name:'Scout',      icon:'🔭', durationMs:15*60*1000,  restMs:0,        durationMult:1.0,  unlockLevel:1, desc:'Quick gather. Low yield. No rest required.' },
  raid:       { id:'raid',       name:'Raid',       icon:'⚔️', durationMs:60*60*1000,  restMs:5*60*1000, durationMult:4.5,  unlockLevel:1, desc:'Good yield. Short rest before next expedition.' },
  deep:       { id:'deep',       name:'Deep',       icon:'🕯️', durationMs:4*60*60*1000, restMs:10*60*1000,durationMult:15,   unlockLevel:2, desc:'High yield. Bonus drop chance.' },
  long_haul:  { id:'long_haul',  name:'Long Haul',  icon:'🌙', durationMs:8*60*60*1000, restMs:15*60*1000,durationMult:28,   unlockLevel:3, desc:'Maximum yield. Rare drop guaranteed at Lv 4+.' },
  survey:     { id:'survey',     name:'Survey',     icon:'🗺️', durationMs:2*60*60*1000, restMs:0,        durationMult:0,    unlockLevel:3, desc:'No materials. Returns Bestiary intel and area knowledge.' },
  extraction: { id:'extraction', name:'Extraction', icon:'⛏️', durationMs:3*60*60*1000, restMs:8*60*1000, durationMult:8,    unlockLevel:4, desc:'Target a specific material. All drops from one group.' },
  training:   { id:'training',   name:'Training',   icon:'📚', durationMs:6*60*60*1000, restMs:0,        durationMult:0,    unlockLevel:5, desc:'No materials. Champion gains ~40% of active combat XP.' },
};

// ── Building level upgrades ───────────────────────────
var EXPEDITION_UPGRADES = [
  null, // index 0 unused
  { level:1, slots:1, label:'Expedition Hall',  cost:null },
  { level:2, slots:2, label:'Expanded Quarters', cost:{ gold:500,  mats:{ slick_stone:20 } },
    unlocks:['deep','champion_stat_bonuses'] },
  { level:3, slots:2, label:'Seasoned Trackers', cost:{ gold:1200, mats:{ rancid_bile:15 } },
    unlocks:['long_haul','survey','rare_drops','glow_warning'] },
  { level:4, slots:3, label:'Elite Corps',       cost:{ gold:3000, mats:{ plague_marrow:10, rancid_bile:5 } },
    unlocks:['extraction','guaranteed_rare_longhaul','expedition_log'] },
  { level:5, slots:3, label:'Legendary Scouts',  cost:{ gold:8000, mats:{ plague_marrow:5, null_stone:1 } },
    unlocks:['training','double_common','town_card_live'] },
];

// ── Reward base rates (per Scout at building level 1) ──
var EXPEDITION_BASE_GOLD = 7;   // per Scout
var EXPEDITION_BASE_XP   = 12;  // per Scout
var EXPEDITION_COMMON_CHANCE  = 0.60;
var EXPEDITION_UNCOMMON_CHANCE = 0.25;
var EXPEDITION_RARE_CHANCE    = 0.06;

// ── Rare bonus drops (per expedition, flat chance) ────
var EXPEDITION_BONUS_DROPS = [
  { chance:0.10, type:'uncommon_bonus', desc:'Extra uncommon material' },
  { chance:0.02, type:'shard',          desc:'Soul Shard' },
  { chance:0.005,type:'relic',          desc:'Base-tier relic' },
];

// ── Helper: get current building level ───────────────
function getExpeditionHallLevel(){
  return getBuildingLevel('adventurers_hall');
}

// ── Helper: how many slots are active at this level ──
function getExpeditionSlotCount(){
  var level = getExpeditionHallLevel();
  var upg = EXPEDITION_UPGRADES[Math.min(level, EXPEDITION_UPGRADES.length-1)];
  return upg ? upg.slots : 1;
}

// ── Helper: is an expedition type unlocked? ───────────
function isExpeditionTypeUnlocked(typeId){
  var def = EXPEDITION_TYPES[typeId]; if(!def) return false;
  return getExpeditionHallLevel() >= def.unlockLevel;
}

// ── Helper: format ms as "1h 23m" or "45m" ───────────
function fmtExpTime(ms){
  if(ms<=0) return '0s';
  var s = Math.round(ms/1000);
  if(s<60) return s+'s';
  var m = Math.floor(s/60), h = Math.floor(m/60); m=m%60;
  if(h>0) return h+'h '+(m>0?m+'m':'');
  return m+'m';
}

// ── Calculate reward for a completed expedition ───────
function calcExpeditionReward(slot){
  var def = EXPEDITION_TYPES[slot.type];
  var cp  = getChampPersist(slot.champId);
  var ch  = CREATURES[slot.champId];
  var area= AREA_DEFS.find(function(a){return a.id===slot.areaId;});
  var level = getExpeditionHallLevel();
  if(!def||!cp||!area) return {materials:{},gold:0,xp:0,bonuses:[]};

  var mult = def.durationMult;
  var reward = {materials:{},gold:0,xp:0,bonuses:[]};

  // Special types — no materials
  if(def.id==='survey'){
    // Contribute bestiary intel
    if(PERSIST.areaRuns) PERSIST.areaRuns[area.id]=(PERSIST.areaRuns[area.id]||0)+1;
    reward.xp = Math.round(EXPEDITION_BASE_XP * 2);
    reward.bonuses.push({icon:'📖', text:'Bestiary intel: '+area.name});
    return reward;
  }
  if(def.id==='training'){
    reward.xp = Math.round(EXPEDITION_BASE_XP * def.durationMs/EXPEDITION_TYPES.scout.durationMs * 0.4);
    return reward;
  }

  // Champion stat multiplier (unlocks at Lv 2)
  var statMult = 1;
  if(level >= 2){
    var baseStats = ch ? ch.baseStats : {str:10,agi:10,wis:10};
    var strBonus  = Math.max(0, (cp.stats.str - baseStats.str)) * 0.005;
    statMult = 1 + strBonus;
  }

  // Ascension bonus
  var ascBonus = 1 + getAscensionLevel(slot.champId) * 0.10;

  // Double common at Lv 5
  var commonMult = level >= 5 ? 2 : 1;

  // Materials
  var matGroup = area.materialGroup;
  var matDefs  = MATERIAL_DROPS[matGroup];
  if(matDefs){
    matDefs.forEach(function(entry){
      var mat = MATERIALS[entry.id]; if(!mat) return;
      var baseChance = entry.base;
      // Rarity gating by level
      if(mat.rarity==='uncommon' && level < 2) return;
      if(mat.rarity==='rare'     && level < 3) return;
      var chance = baseChance * mult * statMult * ascBonus;
      if(mat.rarity==='common') chance *= commonMult;
      // Roll quantity
      var qty = 0;
      var rolls = Math.max(1, Math.floor(chance));
      var fractional = chance - rolls + 1;
      for(var i=0;i<rolls;i++){
        if(Math.random() < Math.min(1, i===0 ? fractional : 1)){
          var base = mat.rarity==='common'?2:mat.rarity==='uncommon'?1:1;
          qty += base + Math.floor(Math.random()*3) - 1; // ±1 variance
        }
      }
      qty = Math.max(0, qty);
      if(qty>0) reward.materials[entry.id]=(reward.materials[entry.id]||0)+qty;
    });
  }

  // Gold and XP
  reward.gold = Math.round(EXPEDITION_BASE_GOLD * mult * statMult * ascBonus * (0.8+Math.random()*0.4));
  reward.xp   = Math.round(EXPEDITION_BASE_XP   * mult * statMult * ascBonus * (0.8+Math.random()*0.4));

  // WIS rare drop bonus
  var wisBonus = level>=2 ? Math.max(0,(cp.stats.wis-(ch?ch.baseStats.wis:10)))*0.003 : 0;

  // Rare bonus drops
  EXPEDITION_BONUS_DROPS.forEach(function(bd){
    var chance = bd.chance + wisBonus;
    if(Math.random() < chance){
      if(bd.type==='uncommon_bonus' && level>=2){
        // Pick a random uncommon from the area's group
        var uncList = matDefs ? matDefs.filter(function(m){return (MATERIALS[m.id]&&MATERIALS[m.id].rarity==='uncommon');}) : [];
        if(uncList.length){
          var pick = uncList[Math.floor(Math.random()*uncList.length)];
          reward.materials[pick.id]=(reward.materials[pick.id]||0)+1;
          reward.bonuses.push({icon:'✨',text:'Bonus: '+MATERIALS[pick.id].name});
        }
      } else if(bd.type==='shard'){
        reward.bonuses.push({icon:'💎',text:'Soul Shard!'});
        reward.soulShard = true;
      } else if(bd.type==='relic' && level>=3){
        var baseRelics = Object.keys(RELICS).filter(function(id){return RELICS[id].tier==='base';});
        var rr = baseRelics[Math.floor(Math.random()*baseRelics.length)];
        if(rr){ reward.relicDrop = rr; reward.bonuses.push({icon:'📿',text:RELICS[rr].name+' relic!'}); }
      }
    }
  });

  // Guaranteed rare on Long Haul at Lv 4
  if(def.id==='long_haul' && level>=4 && matDefs){
    var rareList = matDefs.filter(function(m){return (MATERIALS[m.id]&&MATERIALS[m.id].rarity==='rare');});
    if(rareList.length){
      var pick = rareList[Math.floor(Math.random()*rareList.length)];
      reward.materials[pick.id]=(reward.materials[pick.id]||0)+1;
    }
  }

  // Extraction — override with targeted material drops
  if(def.id==='extraction' && slot.targetMaterial && matDefs){
    var focused = {}; var tgtId = slot.targetMaterial;
    var tgt = matDefs.find(function(m){return m.id===tgtId;});
    if(tgt){
      var qty2 = Math.round(3 * mult * 0.4 * statMult * ascBonus * (0.8+Math.random()*0.4));
      focused[tgtId] = Math.max(1, qty2);
    }
    reward.materials = focused;
  }

  return reward;
}

// ── Apply reward to PERSIST ───────────────────────────
function applyExpeditionReward(reward){
  // Materials
  Object.keys(reward.materials||{}).forEach(function(matId){
    PERSIST.town.materials[matId]=(PERSIST.town.materials[matId]||0)+reward.materials[matId];
  });
  // Gold
  if(reward.gold){ PERSIST.gold+=reward.gold; }
  // XP to champion handled by caller (needs champId)
  // Soul shard
  if(reward.soulShard){ PERSIST.soulShards=(PERSIST.soulShards||0)+1; }
  // Relic drop
  if(reward.relicDrop){
    if(!PERSIST.town.relics) PERSIST.town.relics={};
    PERSIST.town.relics[reward.relicDrop]=(PERSIST.town.relics[reward.relicDrop]||0)+1;
  }
}

// ── Send an expedition ────────────────────────────────
function sendExpedition(slotIdx, champId, areaId, typeId, targetMaterial){
  var b   = PERSIST.town.buildings.adventurers_hall; if(!b||!b.unlocked) return;
  var def = EXPEDITION_TYPES[typeId]; if(!def) return;
  var slot = b.expeditionSlots[slotIdx]; if(!slot) return;
  if(slot.champId) return; // already active

  // Lock champion
  var cp = getChampPersist(champId);
  cp.lockedExpedition = slotIdx;

  slot.champId       = champId;
  slot.areaId        = areaId;
  slot.type          = typeId;
  slot.startTime     = Date.now();
  slot.totalMs       = def.durationMs;
  slot.restUntil     = null;
  slot.targetMaterial= targetMaterial||null;

  savePersist();
  buildTownGrid();
  playQuestAcceptSfx();
  showTownToast((CREATURES[champId]?CREATURES[champId].name:champId)+' sent on '+def.name+'!');
  refreshExpeditionHallPanel();
}

// ── Recall an active expedition ───────────────────────
function recallExpedition(slotIdx){
  var b = PERSIST.town.buildings.adventurers_hall; if(!b||!b.unlocked) return;
  var slot = b.expeditionSlots[slotIdx]; if(!slot||!slot.champId) return;

  var elapsed = Date.now() - slot.startTime;
  var pct     = Math.min(1, elapsed / slot.totalMs);
  var partialReward = calcExpeditionReward(slot);

  // Scale reward proportionally
  Object.keys(partialReward.materials).forEach(function(k){
    partialReward.materials[k]=Math.floor(partialReward.materials[k]*pct);
  });
  partialReward.gold  = Math.floor((partialReward.gold||0)*pct);
  partialReward.xp    = Math.floor((partialReward.xp||0)*pct);
  partialReward.bonuses = []; // no bonuses on recall

  // Apply
  var champId = slot.champId;
  applyExpeditionReward(partialReward);
  if(partialReward.xp){
    var cp=getChampPersist(champId);
    cp.xp+=partialReward.xp; checkLevelUpForChamp(champId);
  }

  // Unlock champion
  var cp2 = getChampPersist(champId);
  if(cp2) cp2.lockedExpedition=null;

  // Clear slot (no rest on recall)
  _clearExpeditionSlot(slot);
  savePersist();
  showTownToast('Recalled! Partial reward collected ('+(Math.round(pct*100))+'%).');
  buildTownGrid();
  refreshExpeditionHallPanel();
}

// ── Collect a completed expedition ────────────────────
var _pendingExpeditionReward = null; // {slotIdx, reward, champId} — used by UI

function collectExpedition(slotIdx){
  var b = PERSIST.town.buildings.adventurers_hall; if(!b||!b.unlocked) return;
  var slot = b.expeditionSlots[slotIdx]; if(!slot||!slot.champId) return;
  if(Date.now() < slot.startTime + slot.totalMs) return; // not done

  var champId = slot.champId;
  var reward  = calcExpeditionReward(slot);

  // Apply materials, gold, shard, relic
  applyExpeditionReward(reward);

  // XP to champion
  if(reward.xp){
    var cp=getChampPersist(champId);
    if(cp){ cp.xp+=reward.xp; checkLevelUpForChamp(champId); }
  }

  // Add to log
  var logEntry = {
    champId:champId, areaId:slot.areaId, type:slot.type,
    time:Date.now(), materials:reward.materials, gold:reward.gold, xp:reward.xp,
    bonuses:reward.bonuses
  };
  b.log = [logEntry].concat((b.log||[]).slice(0,4));

  // Rest period
  var def = EXPEDITION_TYPES[slot.type];
  if(def&&def.restMs>0) slot.restUntil = Date.now()+def.restMs;
  else slot.restUntil = null;

  // Unlock champion
  var cp2=getChampPersist(champId);
  if(cp2) cp2.lockedExpedition=null;

  // Clear slot active fields
  _clearExpeditionSlot(slot);
  savePersist();
  buildTownGrid();

  // Store for animated UI reveal
  _pendingExpeditionReward = {slotIdx:slotIdx, reward:reward, champId:champId};
  _showExpeditionRewardUI(reward, champId, slotIdx);
}

function _clearExpeditionSlot(slot){
  slot.champId=null; slot.areaId=null; slot.type=null;
  slot.startTime=null; slot.totalMs=null; slot.targetMaterial=null;
}

function checkLevelUpForChamp(champId){
  var cp=getChampPersist(champId); if(!cp) return;
  while(cp.xp>=cp.xpNext){
    cp.xp-=cp.xpNext; cp.level++;
    var ch=getCreaturePlayable(champId);
    if(ch){ cp.stats.str+=ch.growth.str; cp.stats.agi+=ch.growth.agi; cp.stats.wis+=ch.growth.wis; }
    cp.xpNext=Math.round(cp.xpNext*1.25+20);
    showTownToast((CREATURES[champId]?CREATURES[champId].name:champId)+' reached level '+cp.level+'!');
  }
}

// ── Animated reward reveal ────────────────────────────
function _showExpeditionRewardUI(reward, champId, slotIdx){
  var ch = CREATURES[champId];
  var matKeys = Object.keys(reward.materials||{}).filter(function(k){return reward.materials[k]>0;});

  var panel = document.getElementById('exp-reward-overlay');
  if(!panel){
    panel = document.createElement('div');
    panel.id='exp-reward-overlay';
    panel.style.cssText='position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;';
    panel.onclick=function(e){ if(e.target===panel) _closeExpeditionReward(); };
    document.body.appendChild(panel);
  }

  var inner = document.createElement('div');
  inner.style.cssText='background:#0e0601;border:2px solid #c09030;border-radius:12px;padding:24px 28px;min-width:260px;max-width:340px;text-align:center;';
  inner.innerHTML='<div style="font-family:Cinzel,serif;font-size:14px;color:#d4a843;letter-spacing:2px;margin-bottom:4px;">EXPEDITION COMPLETE</div>'
    +'<div style="font-size:22px;margin-bottom:4px;">'+(ch?ch.icon:'?')+'</div>'
    +'<div style="font-family:Cinzel,serif;font-size:9px;color:#8a6030;letter-spacing:1px;margin-bottom:16px;">'+(ch?ch.name:'Champion')+'</div>'
    +'<div id="exp-reward-drops" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;"></div>'
    +'<div id="exp-reward-bonuses" style="margin-bottom:12px;"></div>'
    +'<button onclick="_closeExpeditionReward()" style="font-family:Cinzel,serif;font-size:9px;padding:7px 20px;border-radius:4px;border:1px solid #c09030;background:rgba(40,22,4,.9);color:#d4a843;cursor:pointer;letter-spacing:1px;">COLLECT</button>';
  panel.innerHTML='';
  panel.appendChild(inner);
  panel.style.display='flex';

  // Animate drops sequentially
  var dropsEl = document.getElementById('exp-reward-drops');
  var items = [];
  matKeys.forEach(function(k){
    var mat=MATERIALS[k]; if(!mat) return;
    items.push({icon:mat.icon,text:mat.name,qty:'+'+reward.materials[k],color:'#c0a060'});
  });
  if(reward.gold>0) items.push({icon:'✦',text:'Gold',qty:'+'+reward.gold,color:'#d4a843'});
  if(reward.xp>0)   items.push({icon:'⚡',text:'XP',qty:'+'+reward.xp,color:'#60a0e0'});

  var delay=0;
  items.forEach(function(item){
    setTimeout(function(){
      var row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:10px;background:rgba(20,10,2,.8);border:1px solid #2a1808;border-radius:4px;padding:5px 10px;opacity:0;transition:opacity .3s;';
      row.innerHTML='<span style="font-size:16px;">'+item.icon+'</span>'
        +'<span style="font-family:Cinzel,serif;font-size:9px;color:#8a6030;flex:1;text-align:left;">'+item.text+'</span>'
        +'<span style="font-family:Cinzel,serif;font-size:11px;color:'+item.color+';">'+item.qty+'</span>';
      dropsEl.appendChild(row);
      requestAnimationFrame(function(){ row.style.opacity='1'; });
    }, delay);
    delay += 180;
  });

  // Bonuses after all drops
  setTimeout(function(){
    var bonEl=document.getElementById('exp-reward-bonuses');
    if(!bonEl) return;
    reward.bonuses.forEach(function(b){
      var bd=document.createElement('div');
      bd.style.cssText='font-size:10px;color:#c09030;margin-top:4px;';
      bd.innerHTML='<span style="font-size:14px;">'+b.icon+'</span> '+b.text;
      bonEl.appendChild(bd);
    });
  }, delay+200);
}

function _closeExpeditionReward(){
  var panel=document.getElementById('exp-reward-overlay');
  if(panel) panel.style.display='none';
  _pendingExpeditionReward=null;
  refreshExpeditionHallPanel();
}

// ── Idle tick ─────────────────────────────────────────
function expeditionTick(){
  var b=PERSIST.town.buildings.adventurers_hall;
  if(!b||!b.unlocked||!b.expeditionSlots) return;
  var anyReady=false;
  b.expeditionSlots.forEach(function(slot){
    if(slot.champId&&slot.startTime&&slot.totalMs){
      if(Date.now()>=slot.startTime+slot.totalMs) anyReady=true;
    }
  });
  // Update display if panel open + expedition tab active + no popup blocking
  var panelOpen=document.getElementById('adventurers_hall-panel-bg');
  var popupOpen=document.getElementById('exp-popup');
  if(panelOpen&&panelOpen.classList.contains('show')&&_hallTab==='expeditions'&&!popupOpen) _renderHallContent();
  // Update town card glow
  var anyActive=b.expeditionSlots.some(function(s){return !!s.champId;});
  buildTownGrid();
}

// ── Upgrade building ──────────────────────────────────
function upgradeExpeditionHall(){
  var b=PERSIST.town.buildings.adventurers_hall; if(!b||!b.unlocked) return;
  var currentLevel=b.level||1;
  var nextUpg=EXPEDITION_UPGRADES[currentLevel+1];
  if(!nextUpg){ showTownToast('Already at maximum level!'); return; }
  var cost=nextUpg.cost; if(!cost) return;
  if(PERSIST.gold<(cost.gold||0)){ showTownToast('Need '+(cost.gold||0)+' gold.'); return; }
  // Check material costs
  var mats=cost.mats||{};
  var matOk=Object.keys(mats).every(function(k){return (PERSIST.town.materials[k]||0)>=mats[k];});
  if(!matOk){
    var lacking=Object.keys(mats).filter(function(k){return (PERSIST.town.materials[k]||0)<mats[k];});
    showTownToast('Missing: '+lacking.map(function(k){return mats[k]+'× '+(MATERIALS[k]?MATERIALS[k].name:k);}).join(', '));
    return;
  }
  // Spend
  PERSIST.gold-=(cost.gold||0);
  Object.keys(mats).forEach(function(k){PERSIST.town.materials[k]-=mats[k];});
  b.level=currentLevel+1;
  savePersist();
  showTownToast('✦ Expedition Hall upgraded to level '+b.level+': '+nextUpg.label+'!');
  refreshExpeditionHallPanel();
  buildTownGrid();
}

// ── UI state ──────────────────────────────────────────

function refreshExpeditionHallPanel(){
  // Delegate to town.js hall rendering pipeline
  if(typeof _renderHallContent === 'function') _renderHallContent();
}

// ── Send flow (per-slot popups) ────────────────────────
var _expSendSlot = null;
var _expSendChamp = null;
var _expSendArea = null;
var _expSendType = null;

function _expStartSend(slotIdx){
  _expSendSlot = slotIdx;
  _expSendChamp = null;
  _expSendArea = null;
  _expSendType = null;
  _renderHallContent();
}

function _expCancelSend(){
  _expSendSlot = null;
  _expSendChamp = null;
  _expSendArea = null;
  _expSendType = null;
  _renderHallContent();
}

function _expPickChamp(){
  var existing = document.getElementById('exp-popup');
  if(existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'exp-popup';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;';
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };

  var box = document.createElement('div');
  box.style.cssText = 'background:#1a0f06;border:1px solid #5a3418;border-radius:10px;padding:20px 24px;width:min(600px,90vw);max-height:70vh;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,.8);';
  box.onclick = function(e){ e.stopPropagation(); };

  var available = PERSIST.unlockedChamps.filter(function(id){
    if(!CREATURES[id] || id==='dojo_tiger') return false;
    var cp = PERSIST.champions[id];
    return !cp || cp.lockedExpedition===null || cp.lockedExpedition===undefined;
  });

  var html = '<div style="font-family:Cinzel,serif;font-size:12px;color:#d4a843;letter-spacing:3px;margin-bottom:14px;">SELECT CHAMPION</div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">';

  available.forEach(function(id){
    var ch = CREATURES[id]; var cp = getChampPersist(id);
    html += '<div class="exp-pick-option '+getAscensionClass(id)+'" style="position:relative;padding:12px 8px;" onclick="document.getElementById(\'exp-popup\').remove();_expSendChamp=\''+id+'\';_renderHallContent();">'
      +'<div style="margin-bottom:6px;">'+creatureImgHTML(id,ch.icon,'44px')+'</div>'
      +'<div style="font-family:Cinzel,serif;font-size:10px;color:#c0a060;">'+ch.name+'</div>'
      +'<div style="font-size:7px;color:#5a4020;">Lv.'+cp.level+' '+getAscensionChipHTML(id)+'</div>'
      +'<div style="font-size:7px;color:#4a3020;margin-top:3px;">STR:'+Math.round(cp.stats.str)+' AGI:'+Math.round(cp.stats.agi)+' WIS:'+Math.round(cp.stats.wis)+'</div>'
      +'</div>';
  });
  if(!available.length) html += '<div style="font-size:9px;color:#3a2010;font-style:italic;padding:12px;">All champions are on expedition or unavailable.</div>';
  html += '</div>';

  box.innerHTML = html;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function _expPickArea(){
  var existing = document.getElementById('exp-popup');
  if(existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'exp-popup';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;';
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };

  var box = document.createElement('div');
  box.style.cssText = 'background:#1a0f06;border:1px solid #5a3418;border-radius:10px;padding:20px 24px;width:min(600px,90vw);max-height:70vh;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,.8);';
  box.onclick = function(e){ e.stopPropagation(); };

  var visited = AREA_DEFS.filter(function(a){ return PERSIST.areaRuns && (PERSIST.areaRuns[a.id]||0) > 0; });

  var html = '<div style="font-family:Cinzel,serif;font-size:12px;color:#d4a843;letter-spacing:3px;margin-bottom:14px;">SELECT LOCATION</div>'
    +'<div style="display:flex;flex-direction:column;gap:8px;">';

  visited.forEach(function(area){
    var matGroup = area.materialGroup;
    var mats = (typeof MATERIAL_DROPS !== 'undefined' && MATERIAL_DROPS[matGroup]) ? MATERIAL_DROPS[matGroup] : [];
    var matHtml = mats.map(function(m){
      var def = MATERIALS[m.id];
      var rarity = m.weight >= 6 ? 'Common' : m.weight >= 3 ? 'Uncommon' : 'Rare';
      var rColor = m.weight >= 6 ? '#7a8060' : m.weight >= 3 ? '#7a9ac0' : '#c09adc';
      return '<span style="font-size:7px;color:'+rColor+';">'+(def?def.icon:'?')+' '+(def?def.name:m.id)+' <span style="opacity:.6;">('+rarity+')</span></span>';
    }).join(' · ');

    html += '<div class="exp-pick-option" style="flex-direction:row;align-items:center;padding:12px 16px;gap:14px;cursor:pointer;" onclick="document.getElementById(\'exp-popup\').remove();_expSendArea=\''+area.id+'\';_renderHallContent();">'
      +'<div style="width:50px;height:50px;background:'+(area.bg||'#1a1208')+';border:1px solid #3a2818;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+areaImgHTML(area.id,area.icon,'36px')+'</div>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-family:Cinzel,serif;font-size:11px;color:#c0a060;">'+area.name+'</div>'
        +'<div style="font-size:8px;color:#5a4020;margin-top:2px;">Lv.'+area.levelRange[0]+'–'+area.levelRange[1]+'</div>'
        +'<div style="margin-top:4px;line-height:1.8;">'+matHtml+'</div>'
      +'</div>'
      +'</div>';
  });
  if(!visited.length) html += '<div style="font-size:9px;color:#3a2010;font-style:italic;padding:12px;">Explore areas in combat first to unlock expedition destinations.</div>';
  html += '</div>';

  box.innerHTML = html;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function _expPickType(){
  var existing = document.getElementById('exp-popup');
  if(existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'exp-popup';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;';
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };

  var box = document.createElement('div');
  box.style.cssText = 'background:#1a0f06;border:1px solid #5a3418;border-radius:10px;padding:20px 24px;width:min(500px,90vw);max-height:70vh;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,.8);';
  box.onclick = function(e){ e.stopPropagation(); };

  var html = '<div style="font-family:Cinzel,serif;font-size:12px;color:#d4a843;letter-spacing:3px;margin-bottom:14px;">SELECT DURATION</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px;">';

  if(typeof EXPEDITION_TYPES !== 'undefined'){
    Object.values(EXPEDITION_TYPES).forEach(function(def){
      var unlocked = isExpeditionTypeUnlocked(def.id);
      html += '<div class="exp-pick-option'+(unlocked?'':' locked')+'" style="flex-direction:row;align-items:center;padding:12px 16px;gap:12px;'+(unlocked?'cursor:pointer;':'cursor:not-allowed;')+'" '
        +(unlocked?'onclick="document.getElementById(\'exp-popup\').remove();_expSendType=\''+def.id+'\';_renderHallContent();"':'')+'>'
        +'<span style="font-size:20px;flex-shrink:0;">'+def.icon+'</span>'
        +'<div style="flex:1;">'
          +'<div style="font-family:Cinzel,serif;font-size:11px;color:'+(unlocked?'#c0a060':'#3a2010')+';">'+def.name+'</div>'
          +'<div style="font-size:8px;color:'+(unlocked?'#5a4020':'#2a1808')+';">'+def.desc+'</div>'
        +'</div>'
        +'<div style="font-family:Cinzel,serif;font-size:11px;color:'+(unlocked?'#d4a843':'#3a2010')+';">'+fmtExpTime(def.durationMs)+'</div>'
        +(unlocked?'':'<div style="font-size:8px;color:#3a2010;margin-left:4px;">🔒</div>')
        +'</div>';
    });
  }
  html += '</div>';

  box.innerHTML = html;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function _expConfirmSend(){
  if(!_expSendChamp || !_expSendArea || !_expSendType) return;
  sendExpedition(_expSendSlot, _expSendChamp, _expSendArea, _expSendType);
  _expSendSlot = null;
  _expSendChamp = null;
  _expSendArea = null;
  _expSendType = null;
  _renderHallContent();
}



// Aliases for town.js button calls
function startExpeditionFlow(slotIdx){ _expStartSend(slotIdx); }

