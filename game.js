// ═══════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// CREATURE IMAGE SYSTEM
// Looks for creatures/{id}.png next to the HTML file.
// Falls back to emoji if the image is missing.
// ═══════════════════════════════════════════════════════
var CREATURE_IMG_PATH = 'assets/creatures/'; // folder relative to HTML file
var CREATURE_IMG_EXT  = '.png';
var _imgCache = {}; // 'id' → true (exists) | false (missing) | undefined (untried)

// Returns an HTML string: <img> if image file exists, emoji text otherwise.
// size: CSS width/height string e.g. '64px'. cls: extra CSS class string.
function creatureImgHTML(id, emoji, size, cls){
  var src = CREATURE_IMG_PATH + id + CREATURE_IMG_EXT;
  var sz  = size || '64px';
  var c   = cls  || '';
  return '<span class="creature-img-wrap '+c+'" style="width:'+sz+';height:'+sz+';display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">'
    + '<img src="'+src+'" '
      + 'style="image-rendering:pixelated;object-fit:contain;width:'+sz+';height:'+sz+';" '
      + 'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'inline\';" '
      + 'onload="this.nextSibling.style.display=\'none\';">'
    + '<span style="font-size:calc('+sz+' * 0.7);line-height:1;">'+emoji+'</span>'
    + '</span>';
}

// Set a DOM element's content to a creature image (for elements set via textContent/innerHTML)
function setCreatureImg(el, id, emoji, size){
  if(!el) return;
  el.innerHTML = creatureImgHTML(id, emoji, size);
}

// Building icon — uses assets/icons/buildings/{id}.png, falls back to emoji
function buildingImgHTML(id, emoji, size){
  var sz = size || '52px';
  var BUILDING_FILES = {vault:'vault',forge:'forge-big',shrine:'shrine-big',bestiary:'bestiary-big',
    shard_well:'shardwell-big',sanctum:'sanctum-big',market:'market-big',board:'questboard-big'};
  var src = 'assets/icons/buildings/' + (BUILDING_FILES[id]||id) + '.png';
  var onerr = "this.style.display='none';this.nextSibling.style.display='inline';";
  var onld  = "this.nextSibling.style.display='none';";
  return '<span style="display:inline-flex;align-items:center;justify-content:center;width:'+sz+';height:'+sz+';">' + '<img src="'+src+'" style="image-rendering:pixelated;object-fit:contain;width:'+sz+';height:'+sz+';" onerror="'+onerr+'" onload="'+onld+'">' + '<span style="font-size:calc('+sz+' * 0.7);line-height:1;">'+emoji+'</span>' + '</span>';
}
// Gold icon — uses assets/icons/gold.png (24×24), falls back to ✦
function goldImgHTML(size){
  var sz=size||'16px';
  return '<span style="display:inline-flex;align-items:center;gap:3px;">'
    +'<img src="assets/icons/gold.png" style="width:'+sz+';height:'+sz+';image-rendering:pixelated;vertical-align:middle;" onerror="this.style.display=\'none\'">'
    +'</span>';
}

// Status icon — tries assets/icons/status/{stat}.png, used in tags
function statusImgHTML(stat, size){
  var sz=size||'14px';
  if(!stat) return '';
  return '<img src="assets/icons/status/'+stat+'.png" style="width:'+sz+';height:'+sz+';image-rendering:pixelated;vertical-align:middle;margin-right:3px;" onerror="this.style.display=\'none\'">';
}

// Area icon — tries assets/icons/areas/{id}.png, falls back to emoji
function areaImgHTML(id, emoji, size){
  var sz=size||'48px';
  return '<span style="display:inline-flex;align-items:center;justify-content:center;width:'+sz+';height:'+sz+';">'
    +'<img src="assets/icons/areas/'+id+'.png" style="image-rendering:pixelated;object-fit:contain;width:'+sz+';height:'+sz+';" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'inline\';">'
    +'<span style="font-size:calc('+sz+' * 0.7);line-height:1;display:none;">'+emoji+'</span>'
    +'</span>';
}
var GEM_EMOJI = { ruby:'💎', emerald:'💚', sapphire:'🔷', turquoise:'🩵', amethyst:'💜', topaz:'🟡', obsidian:'⬛', opal:'🌈', blackopal:'🌈' };
var GEM_FILE  = { ruby:'gemruby', emerald:'gememerald', sapphire:'gemsapphire', turquoise:'gemturquoise', amethyst:'gemamethyst', topaz:'gemtopaz', obsidian:'gemblackopal', opal:'gemblackopal', blackopal:'gemblackopal' };
function gemImgHTML(tier, size){
  var sz   = size || '20px';
  var file = GEM_FILE[tier] || ('gem'+tier);
  var emoji= GEM_EMOJI[tier] || '💎';
  var src  = 'assets/icons/' + file + '.png';
  var onerr= "this.style.display='none';this.nextSibling.style.display='inline';";
  var onld = "this.nextSibling.style.display='none';";
  return '<span style="display:inline-flex;align-items:center;justify-content:center;width:'+sz+';height:'+sz+';">'
    + '<img src="'+src+'" style="image-rendering:pixelated;object-fit:contain;width:'+sz+';height:'+sz+';" onerror="'+onerr+'" onload="'+onld+'">'
    + '<span style="font-size:calc('+sz+' * 0.8);line-height:1;">'+emoji+'</span>'
    + '</span>';
}


var SETTINGS = { music:70, sfx:85, aspeed:'normal', logd:'normal', confirm:false, tutorial:true };
var ASPEED_DELAYS = { instant:0, fast:300, normal:600, slow:1200 };
var pendingConfirmIdx = -1;

function openSettings(){ playUiSettingsSfx(); document.getElementById('settings-overlay').classList.add('show'); }
function closeSettings(){ playUiCloseSfx(); document.getElementById('settings-overlay').classList.remove('show'); deleteSaveCancel(); }

// ── Export ──
function exportSave(){
  try{
    var raw=JSON.stringify(PERSIST);
    var encoded=btoa(unescape(encodeURIComponent(raw)));
    if(navigator.clipboard){
      navigator.clipboard.writeText(encoded).then(function(){
        showImportMsg('✦ Copied to clipboard!','#60b060');
      }).catch(function(){
        showExportFallback(encoded);
      });
    } else {
      showExportFallback(encoded);
    }
  }catch(e){ showImportMsg('Export failed: '+e.message,'#c05050'); }
}
function showExportFallback(str){
  var ta=document.getElementById('s-import-txt');
  ta.value=str; ta.select();
  showImportMsg('Clipboard unavailable — string selected above, copy manually.','#c09030');
}

// ── Import ──
function importSave(){
  var ta=document.getElementById('s-import-txt');
  var str=(ta.value||'').trim();
  if(!str){ showImportMsg('Paste a save string first.','#c09030'); return; }
  try{
    var raw=decodeURIComponent(escape(atob(str)));
    var parsed=JSON.parse(raw);
    // Basic validation
    if(!parsed.unlockedChamps||!Array.isArray(parsed.unlockedChamps)) throw new Error('Invalid save data');
    // Apply
    localStorage.setItem(PERSIST_KEY, JSON.stringify(parsed));
    showImportMsg('✦ Save loaded! Reloading...','#60b060');
    setTimeout(function(){ window.location.reload(); }, 1200);
  }catch(e){
    showImportMsg('Invalid save string. Check you copied the full export.','#c05050');
  }
}

function showImportMsg(msg,color){
  var el=document.getElementById('s-import-msg');
  if(!el) return;
  el.textContent=msg;
  el.style.color=color||'#c0a060';
  setTimeout(function(){ if(el.textContent===msg) el.textContent=''; },4000);
}

// ── Delete save — two-step confirm ──
function deleteSaveStep1(){
  document.getElementById('s-delete-confirm').style.display='block';
  document.getElementById('s-delete-btn').style.display='none';
  document.getElementById('s-delete-confirm').innerHTML=
    '<div style="color:#ff6060;font-size:11px;letter-spacing:1px;margin-bottom:8px;">'
    +'⚠ Delete this save? All progress will be permanently lost.</div>'
    +'<button onclick="deleteSaveStep2()" style="background:#8b2020;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;margin-right:8px;font-size:11px;">YES, DELETE FOREVER</button>'
    +'<button onclick="deleteSaveCancel()" style="background:#333;color:#aaa;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:11px;">Cancel</button>';
}
function deleteSaveStep2(){
  // Second confirmation — this is permanent
  document.getElementById('s-delete-confirm').innerHTML=
    '<div style="color:#ff4040;font-size:11px;letter-spacing:1px;margin-bottom:8px;">'
    +'⚠ Are you absolutely sure? This cannot be undone.</div>'
    +'<button onclick="deleteSaveConfirm()" style="background:#cc0000;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;margin-right:8px;font-size:11px;">DELETE PERMANENTLY</button>'
    +'<button onclick="deleteSaveCancel()" style="background:#333;color:#aaa;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:11px;">Cancel</button>';
}
function deleteSaveCancel(){
  var dc=document.getElementById('s-delete-confirm');
  var db=document.getElementById('s-delete-btn');
  if(dc) dc.style.display='none';
  if(db) db.style.display='inline-block';
}
function deleteSaveConfirm(){
  // Delete current account save data
  // TODO: When multi-account is implemented, this deletes only the active
  // account's save key (noporo_save_{username}) and removes it from the
  // user list. For now, single save key.
  try{ localStorage.removeItem(PERSIST_KEY); }catch(e){}
  // Settings are global (not per-account) — keep them
  // Show feedback
  var dc=document.getElementById('s-delete-confirm');
  if(dc) dc.innerHTML='<div style="color:#60c060;font-size:11px;letter-spacing:1px;">✦ Save deleted. Reloading...</div>';
  setTimeout(function(){ window.location.reload(); },1000);
}
function applySetting(k,v){
  if(k==='music'){ SETTINGS.music=+v; document.getElementById('sv-music').textContent=v+'%'; updateMusicVolume(); }
  else if(k==='sfx'){ SETTINGS.sfx=+v; document.getElementById('sv-sfx').textContent=v+'%'; }
  else if(k==='aspeed'){ SETTINGS.aspeed=v; }
  else if(k==='logd'){ SETTINGS.logd=v; }
  else if(k==='confirm'){ SETTINGS.confirm=!!v; pendingConfirmIdx=-1; if(gs) renderHand(); }
  else if(k==='tutorial'){ SETTINGS.tutorial=!!v; }
  try{ localStorage.setItem('cetd_settings',JSON.stringify(SETTINGS)); }catch(e){}
}
function loadSettings(){
  try{
    var s=JSON.parse(localStorage.getItem('cetd_settings')||'{}');
    if(s.music!=null){ document.getElementById('s-music').value=s.music; document.getElementById('sv-music').textContent=s.music+'%'; SETTINGS.music=s.music; }
    if(s.sfx!=null){ document.getElementById('s-sfx').value=s.sfx; document.getElementById('sv-sfx').textContent=s.sfx+'%'; SETTINGS.sfx=s.sfx; }
    if(s.aspeed){ document.getElementById('s-aspeed').value=s.aspeed; SETTINGS.aspeed=s.aspeed; }
    if(s.logd){ document.getElementById('s-logd').value=s.logd; SETTINGS.logd=s.logd; }
    if(s.confirm!=null){ document.getElementById('s-confirm').checked=s.confirm; SETTINGS.confirm=s.confirm; }
    if(s.tutorial!=null){ document.getElementById('s-tutorial').checked=s.tutorial; SETTINGS.tutorial=s.tutorial; }
    // Always enforce Press Start font and normal text size
    setFontTheme('press');
    setTextSize(9);
  }catch(e){}
}

// ═══════════════════════════════════════════════════════
// AUDIO SYSTEM
// ═══════════════════════════════════════════════════════
// Full implementation lives in audio.js (loaded before init.js).
// game.js calls the named wrappers defined there.
// Stubs here so nothing breaks if audio.js fails to load.
var _sfxData = [];
var _sfxSelect = [];
if(typeof playSfx === 'undefined'){
  function playSfx(){}
  function playCardPlaySfx(){}  function playCardDrawSfx(){}
  function playCardShuffleSfx(){} function playVictorySfx(){}
  function playWinSfx(){}       function playDefeatSfx(){}
  function playDamagePlayerSfx(){} function playDamageEnemySfx(){}
  function playLevelUpSfx(){}   function playInnateSfx(){}
  function playUiClickSfx(){}   function playUiCloseSfx(){}
  function playUiSettingsSfx(){} function playQuestNotifySfx(){}
  function playEnterAreaSfx(){}
  function playSelectSfx(){}    function playCardSfx(){}
  function updateMusicVolume(){}
}


// ═══════════════════════════════════════════════════════
// PERSISTENT STATE
// ═══════════════════════════════════════════════════════
var PERSIST_KEY='cetd_v6';
var PERSIST={
  unlockedChamps:['druid','paladin','thief'],
  seenEnemies:[], gold:50, metaCurrency:0, achievements:{},
  champions:{}, // keyed by champId: {level,xp,xpNext,stats,alive,lastArea}
  townUnlocked:true,
  town:{
    cards:[], // [{id,tier:'ruby'|'emerald'|'sapphire'...,slottedIn:buildingId|null}]
    buildings:{
      vault:{unlocked:false, slottedCard:null},
      forge:{unlocked:false,slottedCard:null,queue:[],assignedChamp:null},
      bestiary:{unlocked:false,slottedCard:null},
      shard_well:{unlocked:false,slottedCard:null},
      sanctum:   {unlocked:false,slottedCard:null},
      market:{unlocked:false,slottedCard:null, stock:[], refreshProgress:0,
              deals:[], dealsProgress:0, rare:null, rareProgress:0},
      adventurers_hall:{unlocked:false, expeditionSlots:[
        {champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},
        {champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},
        {champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null}
      ], expeditionLog:[]},
      arena:{unlocked:false},
    },
    materials:{},  // { materialId: count } — populated from MATERIALS definition
    relics:{},     // { relicId: count } — crafted/found relics in inventory
    items:{},
    shopPurchases:{},
    vaultXp:0, vaultLevel:1, vaultXpTotal:0,
    vaultUpgrades:{shelf1:false,shelf2:false,shelf3:false,sellDesk:false,recycle:false},
    vaultGenProgress:0,   // 0–100, fills toward producing an item
    vaultGenTarget:null,  // randomised target (seconds) for current fill cycle
    cardFragments:0,
    marketOffers:[],
    buildingXp:{vault:0,forge:0,bestiary:0,shard_well:0,sanctum:0,market:0,adventurers_hall:0,arena:0},
    buildingLevel:{vault:1,forge:1,bestiary:1,shard_well:1,sanctum:1,market:1,adventurers_hall:1,arena:1},
    quests:{
      offered:[],      // 3 quests shown on the board
      active:null,     // current active quest {def, progress, startTime}
      completed:[],    // ids of completed quests (for deduplication)
      offeredRefresh:0,// timestamp of last refresh
    },
  },
  bestiary:{ entries:{}, areaCompletions:{} },
  sanctum:{ deckMods:{}, levelFloors:{}, unlockedCards:{} },
  shrineCounters:{ run_count:0, cards_played:0, cards_discarded:0, deaths:0, nodamage_clears:0, clutch_wins:0, fast_wins:0, debuffs_applied:0, area_level:0 },
  soulShards:0,          // gacha currency
  champDupes:{},    // { champId: N } per-champion ascension material
  seenTutorials:{}, // { tutorialId: true } — tracks dismissed tutorials
  areaRuns:{},
};

function champPersistDefault(champId){
  var ch=CREATURES[champId];
  if(!ch) return null;
  return {
    level:1, xp:0, xpNext:80, xpTotal:0,
    stats:{str:ch.baseStats.str,agi:ch.baseStats.agi,wis:ch.baseStats.wis},
    alive:true, lastArea:null,
    relics:[],             // equipped relic IDs
    lockedExpedition:null  // slot index if on expedition, else null
  };
}
function getChampPersist(champId){
  if(!PERSIST.champions[champId]) PERSIST.champions[champId]=champPersistDefault(champId);
  return PERSIST.champions[champId];
}

// ── Relic slot management ──────────────────────────────────────────────────

// How many relic slots this champion has (1 per ascension tier, 0 at base)
function getRelicSlotCount(champId){
  return getAscensionLevel(champId);
}

// Equipped relic IDs for a champion (ordered list, length = equipped count)
function getEquippedRelics(champId){
  var cp = getChampPersist(champId);
  if(!cp) return [];
  if(!cp.relics) cp.relics = [];
  return cp.relics;
}

// Equip a relic from town inventory onto a champion. Returns error string or null.
function equipRelic(champId, relicId){
  var cp = getChampPersist(champId);
  if(!cp) return 'Champion not found.';
  if(!cp.relics) cp.relics = [];
  var slots = getRelicSlotCount(champId);
  if(slots === 0) return 'No relic slots — ascend this champion first.';
  if(cp.relics.length >= slots) return 'All slots full.';
  var inv = PERSIST.town.relics || {};
  if(!inv[relicId] || inv[relicId] <= 0) return 'Relic not in inventory.';
  inv[relicId]--;
  if(inv[relicId] <= 0) delete inv[relicId];
  cp.relics.push(relicId);
  savePersist();
  return null;
}

// Remove a relic from a slot by index. Destroys it (no refund).
function unequipRelic(champId, slotIdx){
  var cp = getChampPersist(champId);
  if(!cp || !cp.relics) return;
  cp.relics.splice(slotIdx, 1);
  savePersist();
}

// Apply all equipped relics to a game state object at run start.
// Each relic's apply(gs) function modifies gs in place.
function applyRelics(gs){
  if(!gs || !gs.champId) return;
  var equipped = getEquippedRelics(gs.champId);
  equipped.forEach(function(relicId){
    var relic = RELICS[relicId];
    if(relic && typeof relic.apply === 'function'){
      try { relic.apply(gs); } catch(e) { console.warn('Relic apply error:', relicId, e); }
    }
  });
}

function savePersist(){ try{ localStorage.setItem(PERSIST_KEY,JSON.stringify(PERSIST)); }catch(e){} }
function loadPersist(){
  try{
    var p=JSON.parse(localStorage.getItem(PERSIST_KEY)||'null');
    if(p){
      PERSIST.unlockedChamps=p.unlockedChamps||['druid','paladin','thief'];
      PERSIST.seenEnemies=p.seenEnemies||[];
      PERSIST.gold=p.gold!=null?p.gold:50;
      PERSIST.metaCurrency=p.metaCurrency||0;
      PERSIST.achievements=p.achievements||{};
      PERSIST.champions=p.champions||{};
      PERSIST.townUnlocked=true; // town always visible now
      if(p.town){
        if(p.town.buildings){
          Object.keys(p.town.buildings).forEach(function(k){
            if(PERSIST.town.buildings[k]) PERSIST.town.buildings[k]=Object.assign({},PERSIST.town.buildings[k],p.town.buildings[k]);
          });
        }        if(p.town.materials) PERSIST.town.materials=Object.assign({},PERSIST.town.materials,p.town.materials);
        PERSIST.town.items=p.town.items||{};
        PERSIST.town.shopPurchases=p.town.shopPurchases||{};
        PERSIST.town.vaultXp=p.town.vaultXp||0;
        PERSIST.town.vaultLevel=p.town.vaultLevel||1;
        PERSIST.town.vaultXpTotal=p.town.vaultXpTotal||0;
        if(p.town.buildingXp) PERSIST.town.buildingXp=Object.assign({vault:0,forge:0,shrine:0,bestiary:0,shard_well:0,sanctum:0,market:0,board:0},p.town.buildingXp);
        if(p.town.buildingLevel) PERSIST.town.buildingLevel=Object.assign({vault:1,forge:1,shrine:1,bestiary:1,shard_well:1,sanctum:1,market:1,board:1},p.town.buildingLevel);
        PERSIST.town.vaultUpgrades=Object.assign({shelf1:false,shelf2:false,shelf3:false,sellDesk:false,recycle:false},p.town.vaultUpgrades||{});
        PERSIST.town.cardFragments=p.town.cardFragments||0;
        PERSIST.town.vaultGenProgress=p.town.vaultGenProgress||0;
        PERSIST.town.vaultGenTarget=p.town.vaultGenTarget||null;
        PERSIST.town.marketOffers=p.town.marketOffers||[];
        if(p.town.quests) PERSIST.town.quests=Object.assign({offered:[],active:null,completed:[],offeredRefresh:0},p.town.quests);
        if(p.town.buildings&&p.town.buildings.adventurers_hall) PERSIST.town.buildings.adventurers_hall=Object.assign({unlocked:false,expeditionSlots:[{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null}],expeditionLog:[]},p.town.buildings.adventurers_hall);
        // Migrate old board/expedition_hall saves
        if(!p.town.buildings.adventurers_hall){
          if((p.town.buildings.board&&p.town.buildings.board.unlocked)||(p.town.buildings.expedition_hall&&p.town.buildings.expedition_hall.unlocked)){
            PERSIST.town.buildings.adventurers_hall.unlocked=true;
          }
          if(p.town.buildings.expedition_hall&&p.town.buildings.expedition_hall.slots){
            PERSIST.town.buildings.adventurers_hall.expeditionSlots=p.town.buildings.expedition_hall.slots;
          }
        }
        if(p.town.buildings&&p.town.buildings.arena) PERSIST.town.buildings.arena=Object.assign({unlocked:false},p.town.buildings.arena);
        if(p.town.buildings&&p.town.buildings.shard_well) PERSIST.town.buildings.shard_well=Object.assign({unlocked:false,slottedCard:null,shardAcc:0},p.town.buildings.shard_well);
      }
      if(p.bestiary){ PERSIST.bestiary=Object.assign({research:{},researchAcc:0},p.bestiary); }
      if(p.sanctum){ PERSIST.sanctum=Object.assign({deckMods:{},levelFloors:{},unlockedCards:{}},p.sanctum); }
      if(p.shrineCounters) PERSIST.shrineCounters=Object.assign({run_count:0,cards_played:0,cards_discarded:0,deaths:0,nodamage_clears:0,clutch_wins:0,fast_wins:0,debuffs_applied:0,area_level:0},p.shrineCounters);
      if(typeof p.soulShards==='number') PERSIST.soulShards=p.soulShards;
      if(p.champDupes) PERSIST.champDupes=Object.assign({},p.champDupes);
      if(p.seenTutorials) PERSIST.seenTutorials=Object.assign({},p.seenTutorials);
      if(p.areaRuns) PERSIST.areaRuns=p.areaRuns;
    }
  }catch(e){}
}
function checkBestiaryAutoUnlock(){
  var b=PERSIST.town.buildings.bestiary;
  if(!b||b.unlocked) return;
  var cost=BUILDING_UNLOCK_COSTS.bestiary;
  if(!cost) return;
  if(PERSIST.seenEnemies.length>=cost.seenCount){
    b.unlocked=true;
    savePersist();
    showTownToast('✦ The Bestiary is now open!');
    buildTownGrid();
  }
}

function trackSeen(id){
  if(PERSIST.seenEnemies.indexOf(id)===-1){
    PERSIST.seenEnemies.push(id);
    savePersist();
    checkBestiaryAutoUnlock();
  }
}
function trackKill(id){
  if(gs&&gs.killedEnemyIds) gs.killedEnemyIds.push(id);
  var k=id+'_kill'; PERSIST.achievements[k]=(PERSIST.achievements[k]||0)+1;
  var cond=UNLOCK_CONDITIONS[id];
  if(cond&&cond.type==='kill'&&PERSIST.achievements[k]>=cond.count&&PERSIST.unlockedChamps.indexOf(id)===-1){
    PERSIST.unlockedChamps.push(id);
  }
  // Bloodlust — heal on kill
  if(gs&&gs._shrineBloodlust&&gs.playerHp>0&&gs.playerHp<gs.playerMaxHp){
    var heal=gs._shrineBloodlust;
    gs.playerHp=Math.min(gs.playerMaxHp,gs.playerHp+heal);
    spawnHealNum('player',heal); flashHpBar('player','hp-flash-green');
  }
  // Soul Siphon — restore 20 mana on kill
  if(gs&&gs._soulSiphon){
    gs.mana=Math.min(gs.maxMana,gs.mana+20);
    addLog('Soul Siphon: +20 mana.','mana');
  }
  // Shrine counter: clutch wins (< 25% HP at kill)
  if(gs&&gs.playerHp<gs.playerMaxHp*0.25&&gs.playerHp>0){
    PERSIST.shrineCounters.clutch_wins=(PERSIST.shrineCounters.clutch_wins||0)+1;
  }
  // Quest progress
  checkQuestProgress('kill',{enemyId:id});
  savePersist();
  checkAchievementsAuto();
}

var UNLOCK_CONDITIONS={
  paladin:{type:'starter'}, thief:{type:'starter'},
  // All enemy champions: 500 kills to earn free, or 500 gold to buy
  rat:      {type:'kill',enemyId:'rat',      count:500, goldCost:500, label:'Defeat 500 Giant Rats'},
  mudcrab:  {type:'kill',enemyId:'mudcrab',  count:500, goldCost:500, label:'Defeat 500 Mud Crabs'},
  goblin:   {type:'kill',enemyId:'goblin',   count:500, goldCost:500, label:'Defeat 500 Goblin Scouts'},
  roach:    {type:'kill',enemyId:'roach',    count:500, goldCost:500, label:'Defeat 500 Sewer Roaches'},
  grub:     {type:'kill',enemyId:'grub',     count:500, goldCost:500, label:'Defeat 500 Bloated Grubs'},
  wisp:     {type:'kill',enemyId:'wisp',     count:500, goldCost:500, label:'Defeat 500 Bog Wisps'},
  snake:    {type:'kill',enemyId:'snake',    count:500, goldCost:500, label:'Defeat 500 Swamp Serpents'},
  toadking: {type:'kill',enemyId:'toadking', count:500, goldCost:500, label:'Defeat 500 Toad Kings'},
  skeleton: {type:'kill',enemyId:'skeleton', count:500, goldCost:500, label:'Defeat 500 Skeletons'},
  wretch:   {type:'kill',enemyId:'wretch',   count:500, goldCost:500, label:'Defeat 500 Sewer Wretches'},
  lurker:   {type:'kill',enemyId:'lurker',   count:500, goldCost:500, label:'Defeat 500 Drain Lurkers'},
  plague:   {type:'kill',enemyId:'plague',   count:500, goldCost:500, label:'Defeat 500 Plague Carriers'},
  orc:      {type:'kill',enemyId:'orc',      count:500, goldCost:500, label:'Defeat 500 Orc Warriors'},
  troll:    {type:'kill',enemyId:'troll',    count:500, goldCost:500, label:'Defeat 500 Forest Trolls'},
  bandit:   {type:'kill',enemyId:'bandit',   count:500, goldCost:500, label:'Defeat 500 Bandit Captains'},
  harpy:    {type:'kill',enemyId:'harpy',    count:500, goldCost:500, label:'Defeat 500 Harpies'},
  golem:    {type:'kill',enemyId:'golem',    count:500, goldCost:500, label:'Defeat 500 Stone Golems'},
  witch:    {type:'kill',enemyId:'witch',    count:500, goldCost:500, label:'Defeat 500 Cursed Witches'},
  watcher:      {type:'kill',enemyId:'watcher',      count:500, goldCost:500, label:'Defeat 500 Sewer Watchers'},
  amalgam:      {type:'kill',enemyId:'amalgam',      count:500, goldCost:500, label:'Defeat 500 Amalgams'},
  mistraven:    {type:'kill',enemyId:'mistraven',    count:500, goldCost:500, label:'Defeat 500 Mist Ravens'},
  foghast:      {type:'kill',enemyId:'foghast',      count:500, goldCost:500, label:'Defeat 500 Foghasts'},
  moonsquirrel: {type:'kill',enemyId:'moonsquirrel', count:200, goldCost:500, label:'Defeat 200 Luna Sciurids'},
  nightentling: {type:'kill',enemyId:'nightentling', count:500, goldCost:500, label:'Defeat 500 Night Entlings'},
  orbweaver:    {type:'kill',enemyId:'orbweaver',    count:500, goldCost:500, label:'Defeat 500 Orbweavers'},
  maskedowl:    {type:'kill',enemyId:'maskedowl',    count:500, goldCost:500, label:'Defeat 500 Masked Owls'},
  waxsoldier:   {type:'kill',enemyId:'waxsoldier',   count:500, goldCost:500, label:'Defeat 500 Wax Soldiers'},
  waxhound:     {type:'kill',enemyId:'waxhound',     count:500, goldCost:500, label:'Defeat 500 Wax Hounds'},
  dunecrawler:  {type:'kill',enemyId:'dunecrawler',  count:500, goldCost:500, label:'Defeat 500 Dune Crawlers'},
  waxeffigy:    {type:'kill',enemyId:'waxeffigy',    count:500, goldCost:500, label:'Defeat 500 Wax Effigies'},
  knight:   {type:'kill',enemyId:'knight',   count:500, goldCost:500, label:'Defeat 500 Dark Knights'},
  wyrm:     {type:'kill',enemyId:'wyrm',     count:500, goldCost:500, label:'Defeat 500 Fire Wyrms'},
  lich:     {type:'kill',enemyId:'lich',     count:500, goldCost:500, label:'Defeat 500 Lich Kings'},
  dragon:   {type:'kill',enemyId:'dragon',   count:500, goldCost:500, label:'Defeat 500 Elder Dragons'},
  // Fungal Warren
  sporepuff:    {type:'kill',enemyId:'sporepuff',    count:500, goldCost:500, label:'Defeat 500 Spore Puffs'},
  cavegrub:     {type:'kill',enemyId:'cavegrub',     count:500, goldCost:500, label:'Defeat 500 Cave Grubs'},
  mycelid:      {type:'kill',enemyId:'mycelid',      count:500, goldCost:500, label:'Defeat 500 Mycelids'},
  tunnelant:    {type:'kill',enemyId:'tunnelant',    count:500, goldCost:500, label:'Defeat 500 Tunnel Ants'},
  venomstalker: {type:'kill',enemyId:'venomstalker', count:500, goldCost:500, label:'Defeat 500 Venom Stalkers'},
  // Black Pool boss
  harbourmaster:{type:'kill',enemyId:'harbourmaster',count:100,  goldCost:500, label:'Defeat 100 Harbourmasters'},
  // Sunken Harbour
  tidecrab:     {type:'kill',enemyId:'tidecrab',      count:500, goldCost:500, label:'Defeat 500 Tide Crabs'},
  drownedsailor:{type:'kill',enemyId:'drownedsailor', count:500, goldCost:500, label:'Defeat 500 Drowned Sailors'},
  inksquall:    {type:'kill',enemyId:'inksquall',     count:500, goldCost:500, label:'Defeat 500 Ink Squalls'},
  siren:        {type:'kill',enemyId:'siren',         count:500, goldCost:500, label:'Defeat 500 Sirens'},
  sharknight:   {type:'kill',enemyId:'sharknight',    count:500, goldCost:500, label:'Defeat 500 Shark Knights'},
  // Char Mines
  flamesprite:  {type:'kill',enemyId:'flamesprite',   count:500, goldCost:500, label:'Defeat 500 Flame Sprites'},
  embergolem:   {type:'kill',enemyId:'embergolem',    count:500, goldCost:500, label:'Defeat 500 Ember Golems'},
  ashbat:       {type:'kill',enemyId:'ashbat',        count:500, goldCost:500, label:'Defeat 500 Ash Bats'},
  mineghoul:    {type:'kill',enemyId:'mineghoul',     count:500, goldCost:500, label:'Defeat 500 Mine Ghouls'},
  lavacrawler:  {type:'kill',enemyId:'lavacrawler',   count:500, goldCost:500, label:'Defeat 500 Lava Crawlers'},
};


// ═══════════════════════════════════════════════════════
// ACHIEVEMENTS — loaded from data/achievements.js
// ═══════════════════════════════════════════════════════
// KEYWORDS + CARDS + CREATURE_DECKS — loaded from data/cards.js
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// CREATURE DATA — unified enemies + playable champions
// ═══════════════════════════════════════════════════════
// Playable creatures have: playable:true, role, desc, statPips,
//   innateActive, innateName, innateCost, innateDesc, startDeck[]
// All creatures share: id, name, icon, baseStats, growth,
//   baseDmg, dmgGrowth, gold, innate, deck, cardRewards

// Starter playable creatures (defined inline with CREATURES below)
// Their startDeck is their hand at run start; deck is their enemy action deck
// Champion decks read directly from CREATURES[id].deck

function buildGachaPool(){
  // All creatures in pool — exclude special unplayable boss encounters
  var excluded={'waxoasis':true};
  var allIds=Object.keys(CREATURES).filter(function(id){return !excluded[id];});
  return allIds.map(function(id){
    var e=CREATURES[id];
    var rarity=getCreatureRarity(e);
    return {
      id:id,
      rarity:rarity,
      seen:true, // always visible
      weight:{common:55,uncommon:28,rare:13,legendary:4}[rarity]||13,
    };
  });
}

function getAvailablePool(){
  // All enemies in pool, filter out already-unlocked
  return buildGachaPool().filter(function(e){
    return PERSIST.unlockedChamps.indexOf(e.id)===-1;
  });
}

// ═══════════════════════════════════════════════════════
// CREATURE DATA — enemies + playable champions unified
// ═══════════════════════════════════════════════════════
// Creatures loaded from data/creatures/*.js
var CREATURES = {};

// ═══════════════════════════════════════════════════════
// AREA DEFINITIONS
// ═══════════════════════════════════════════════════════
// Area definitions loaded from data/areas.js
// ═══════════════════════════════════════════════════════
// MATERIALS — area-themed crafting resources
// Each entry: { id, name, icon, group, rarity }
// rarity: 'common' | 'uncommon' | 'rare'
// ═══════════════════════════════════════════════════════
var MATERIALS = {
  // Sewer / Vermin
  slick_stone:      {id:'slick_stone',      name:'Slick Stone',      icon:'🪨', group:'sewer',   rarity:'common'},
  rancid_bile:      {id:'rancid_bile',      name:'Rancid Bile',      icon:'🧪', group:'sewer',   rarity:'uncommon'},
  plague_marrow:    {id:'plague_marrow',    name:'Plague Marrow',    icon:'☠️', group:'sewer',   rarity:'rare'},
  // Wetlands
  bog_iron:         {id:'bog_iron',         name:'Bog Iron',         icon:'🔩', group:'wetlands', rarity:'common'},
  leech_oil:        {id:'leech_oil',        name:'Leech Oil',        icon:'🫙', group:'wetlands', rarity:'uncommon'},
  abyssal_coral:    {id:'abyssal_coral',    name:'Abyssal Coral',    icon:'🪸', group:'wetlands', rarity:'rare'},
  // Undead / Crypt
  bone_dust:        {id:'bone_dust',        name:'Bone Dust',        icon:'🦴', group:'crypt',   rarity:'common'},
  grave_iron:       {id:'grave_iron',       name:'Grave Iron',       icon:'⛓️', group:'crypt',   rarity:'uncommon'},
  cursed_essence:   {id:'cursed_essence',   name:'Cursed Essence',   icon:'💀', group:'crypt',   rarity:'rare'},
  // Forest / Cave
  thornwood_resin:  {id:'thornwood_resin',  name:'Thornwood Resin',  icon:'🌿', group:'forest',  rarity:'common'},
  harpy_talon:      {id:'harpy_talon',      name:'Harpy Talon',      icon:'🪶', group:'forest',  rarity:'uncommon'},
  ancient_bark:     {id:'ancient_bark',     name:'Ancient Bark',     icon:'🌳', group:'forest',  rarity:'rare'},
  // Fire / Forge
  ember_grit:       {id:'ember_grit',       name:'Ember Grit',       icon:'🔥', group:'fire',    rarity:'common'},
  dragonscale:      {id:'dragonscale',      name:'Dragonscale',      icon:'🐉', group:'fire',    rarity:'uncommon'},
  smelt_slag:       {id:'smelt_slag',       name:'Smelt Slag',       icon:'⚙️', group:'fire',    rarity:'rare'},
  // Ancient / Ruins
  stone_cipher:     {id:'stone_cipher',     name:'Stone Cipher',     icon:'🗿', group:'ruins',   rarity:'common'},
  vault_bronze:     {id:'vault_bronze',     name:'Vault Bronze',     icon:'🏺', group:'ruins',   rarity:'uncommon'},
  arcane_residue:   {id:'arcane_residue',   name:'Arcane Residue',   icon:'✨', group:'ruins',   rarity:'rare'},
  // Wax / Desert
  amber_wax:        {id:'amber_wax',        name:'Amber Wax',        icon:'🕯️', group:'wax',     rarity:'common'},
  wax_crystal:      {id:'wax_crystal',      name:'Wax Crystal',      icon:'💎', group:'wax',     rarity:'uncommon'},
  ancient_amber:    {id:'ancient_amber',    name:'Ancient Amber',    icon:'🟡', group:'wax',     rarity:'rare'},
  // Arcane / Void
  void_splinter:    {id:'void_splinter',    name:'Void Splinter',    icon:'🌑', group:'arcane',  rarity:'common'},
  mist_silk:        {id:'mist_silk',        name:'Mist Silk',        icon:'🌫️', group:'arcane',  rarity:'uncommon'},
  null_stone:       {id:'null_stone',       name:'Null Stone',       icon:'🔮', group:'arcane',  rarity:'rare'},
};

// Material drop table by group — [ [materialId, dropChance], ... ]
// Chances are per-roll; multiple materials can drop in one run
var MATERIAL_DROPS = {
  sewer:   [{id:'slick_stone',   base:0.60, lvlBonus:0.00}, {id:'rancid_bile',   base:0.25, lvlBonus:0.01}, {id:'plague_marrow',  base:0.06, lvlBonus:0.01}],
  wetlands:[{id:'bog_iron',      base:0.60, lvlBonus:0.00}, {id:'leech_oil',     base:0.25, lvlBonus:0.01}, {id:'abyssal_coral',  base:0.06, lvlBonus:0.01}],
  crypt:   [{id:'bone_dust',     base:0.60, lvlBonus:0.00}, {id:'grave_iron',    base:0.25, lvlBonus:0.01}, {id:'cursed_essence', base:0.06, lvlBonus:0.01}],
  forest:  [{id:'thornwood_resin',base:0.60,lvlBonus:0.00}, {id:'harpy_talon',   base:0.25, lvlBonus:0.01}, {id:'ancient_bark',   base:0.06, lvlBonus:0.01}],
  fire:    [{id:'ember_grit',    base:0.60, lvlBonus:0.00}, {id:'dragonscale',   base:0.25, lvlBonus:0.01}, {id:'smelt_slag',     base:0.06, lvlBonus:0.01}],
  ruins:   [{id:'stone_cipher',  base:0.60, lvlBonus:0.00}, {id:'vault_bronze',  base:0.25, lvlBonus:0.01}, {id:'arcane_residue', base:0.06, lvlBonus:0.01}],
  wax:     [{id:'amber_wax',     base:0.60, lvlBonus:0.00}, {id:'wax_crystal',   base:0.25, lvlBonus:0.01}, {id:'ancient_amber',  base:0.06, lvlBonus:0.01}],
  arcane:  [{id:'void_splinter', base:0.60, lvlBonus:0.00}, {id:'mist_silk',     base:0.25, lvlBonus:0.01}, {id:'null_stone',     base:0.06, lvlBonus:0.01}],
};

var AREA_DEFS = [];

function calcXpMult(champLevel, areaLevel){
  if(areaLevel>=champLevel) return 1;
  var levelsBelow=champLevel-areaLevel;
  return Math.max(0.1, Math.round((1-levelsBelow*0.2)*10)/10);
}

function buildArea(def,level){
  var pool=def.enemyPool.map(function(id){return CREATURES[id];}).filter(Boolean);
  if(pool.length===0){
    // No valid creatures — return a minimal area with just a Strike-only dummy
    return {id:def.id+'-'+level, def:def, level:level, enemies:[{
      id:'dummy', name:'???', icon:'❓', str:10, agi:10, wis:10,
      baseHp:50, dmgMult:1, atkInterval:3000, xp:10,
      innate:null, deck:['strike','strike','brace']
    }]};
  }
  var enemies=[];

  // Boss areas: use the pool exactly as defined — fixed lineup
  if(def.isBossArea){
    pool.forEach(function(b){
      var str=Math.round(b.baseStats.str+(level-1)*b.growth.str);
      var agi=Math.round(b.baseStats.agi+(level-1)*b.growth.agi);
      var wis=Math.round(b.baseStats.wis+(level-1)*b.growth.wis);
      var hp=str*5;
      enemies.push({
        id:b.id, name:b.name, icon:b.icon, str:str, agi:agi, wis:wis, baseHp:hp,
        dmgMult:1+level*0.2, atkInterval:calcDrawInterval(agi),
        gold:b.gold, xp:Math.round(8+level*10)*2, // boss XP bonus
        innate:b.innate, deck:b.deck, openingMove:b.openingMove, cardRewards:b.cardRewards,
        isBoss:(b.id==='harbourmaster'||b.id==='sumpthing'), // mark the actual boss
      });
    });
    return {def:def,level:level,enemies:enemies};
  }

  var count=def.singleEnemy ? 1 : Math.min(8, 4+Math.floor(level/2));
  // Dojo: cycle through pool sequentially
  var dojoOffset = 0;
  if(def.singleEnemy){
    if(typeof window._dojoIdx === 'undefined') window._dojoIdx = 0;
    dojoOffset = window._dojoIdx % pool.length;
    window._dojoIdx++;
  }
  // Shuffle the pool so enemy order is unpredictable
  var shuffled=pool.slice();
  for(var si=shuffled.length-1;si>0;si--){ var sj=Math.floor(Math.random()*(si+1)); var tmp=shuffled[si]; shuffled[si]=shuffled[sj]; shuffled[sj]=tmp; }
  for(var i=0;i<count;i++){
    // Pick from pool — dojo uses sequential cycling, normal areas use random
    var b = def.singleEnemy ? pool[dojoOffset] : shuffled[i%shuffled.length];
    // Re-shuffle when we've cycled through once for more variety
    if(i>0 && i%shuffled.length===0){
      for(var si2=shuffled.length-1;si2>0;si2--){ var sj2=Math.floor(Math.random()*(si2+1)); var tmp2=shuffled[si2]; shuffled[si2]=shuffled[sj2]; shuffled[sj2]=tmp2; }
    }
    var str=Math.round(b.baseStats.str+(level-1)*b.growth.str);
    var agi=Math.round(b.baseStats.agi+(level-1)*b.growth.agi);
    var wis=Math.round(b.baseStats.wis+(level-1)*b.growth.wis);
    // Damage scaled by level multiplier: 1.2× at lv1, 3× at lv10, 5× at lv20
    var baseDmg=(b.baseDmg||0)+(level-1)*(b.dmgGrowth||0);
    var dmgMult=1+level*0.2;
    var hp=str*5;
    enemies.push({
      id:b.id, name:b.name, icon:b.icon,
      str:str, agi:agi, wis:wis,
      baseHp:hp,
      dmgMult:dmgMult,  // applied to all card.value in executeEnemyCard
      atkInterval:calcDrawInterval(agi),
      xp:Math.round(8+level*10),
      innate:b.innate,
      deck:b.deck,
      openingMove:b.openingMove,
    });
  }
  return {id:def.id+'-'+level, def:def, level:level, enemies:enemies};
}

function generateAreas(champLevel){
  var result=[],used={};
  var maxLevel=champLevel+3; // never show areas more than 3 levels ahead

  // Only consider areas reachable at current level
  var reachable=AREA_DEFS.filter(function(d){ return d.levelRange[0]<=maxLevel; });

  // Always include one area at champion's level (or level 1 minimum)
  var targetLevel=Math.max(1,champLevel);
  var matchDefs=reachable.filter(function(d){return d.levelRange[0]<=targetLevel&&d.levelRange[1]>=targetLevel;});
  if(!matchDefs.length) matchDefs=reachable.length?reachable:AREA_DEFS;
  var mainDef=matchDefs[Math.floor(Math.random()*matchDefs.length)];
  result.push(buildArea(mainDef,targetLevel)); used[mainDef.id]=true;

  // Always include one level-1 area if champ is above level 1
  if(champLevel>1){
    var l1defs=reachable.filter(function(d){return d.levelRange[0]<=1&&!used[d.id];});
    if(l1defs.length){ var l1=l1defs[Math.floor(Math.random()*l1defs.length)]; result.push(buildArea(l1,1)); used[l1.id]=true; }
  }

  // Fill remaining slots with a spread — capped at maxLevel
  var spread=[champLevel-2,champLevel-1,champLevel+1,champLevel+2,champLevel+3];
  spread.forEach(function(tl){
    if(result.length>=6) return;
    var tl2=Math.min(maxLevel,Math.max(1,tl));
    var cands=reachable.filter(function(d){return d.levelRange[0]<=tl2&&d.levelRange[1]>=tl2&&!used[d.id];});
    if(!cands.length) cands=reachable.filter(function(d){return !used[d.id];});
    if(!cands.length) return;
    var def=cands[Math.floor(Math.random()*cands.length)];
    result.push(buildArea(def,tl2));
    used[def.id]=true;
  });

  // Sort by level ascending
  result.sort(function(a,b){return a.level-b.level;});
  return result;
}

// ═══════════════════════════════════════════════════════
// STAT FORMULAS
// ═══════════════════════════════════════════════════════
// STR = HP = DECK CAP (same number)
function calcHp(str){ return str*5; }
function calcDeckCap(str){ return str; }           // deck size unchanged
function calcDrawInterval(agi){ return Math.round(2000+6000/(1+agi*0.08)); }
function calcMaxMana(wis){ return wis*20; }
function calcManaRegen(wis){ return wis*1.5; }
var HAND_SIZE=7;
var SOUL_SHARDS_PER_PULL=100;

// ═══════════════════════════════════════════════════════
// DECK BUILDER — generates a creature's deck from STR + deckOrder
// ═══════════════════════════════════════════════════════
// Rules:
//   — All 5 identity cards (3 unique + Strike + Brace) get an even share
//     of STR total: floor(STR / 5) copies each
//   — Remainder (STR % 5) distributed one extra copy each, in priority:
//     deckOrder first (in listed order), then Strike, then Brace
//   — No filler at base STR. Filler only on level-up when STR exceeds deck.
// ═══════════════════════════════════════════════════════
function buildCreatureDeck(creature, strOverride){
  if(!creature) return ['strike','strike','brace','brace'];
  var str = (strOverride !== undefined) ? strOverride : (creature.baseStats && creature.baseStats.str) || 10;
  var order = creature.deckOrder || [];

  // All 5 identity cards in priority order: unique first, then universals
  var allCards = order.concat(['strike', 'brace']);
  var base = Math.floor(str / allCards.length);
  var remainder = str % allCards.length;

  var deck = [];
  allCards.forEach(function(id, idx){
    var copies = base + (idx < remainder ? 1 : 0);
    for(var i = 0; i < copies; i++) deck.push(id);
  });

  return deck;
}

// ═══════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════
var selectedChampId=null, selectedArea=null, gs=null;
var tickTimer=null, enemyTimer=null, paused=false;
var lastHandStr='', afterVictoryFn=null;

// ── Sanctum helpers ──────────────────────────────────────────────
function getSanctumMods(champId){
  if(!PERSIST.sanctum) PERSIST.sanctum={deckMods:{},levelFloors:{}};
  if(!PERSIST.sanctum.deckMods[champId]) PERSIST.sanctum.deckMods[champId]={swaps:[],extras:[],removed:[],cardTiers:{}};
  return PERSIST.sanctum.deckMods[champId];
}

// ── Get playable fields for a creature ──
// Reads directly from CREATURES[id] — no separate champions.js needed.
function getCreaturePlayable(id){
  var c=CREATURES[id]; if(!c) return null;
  // Derive innate display fields directly from creature definition
  if(!c.innateName&&c.innate) c.innateName=c.innate.name;
  if(!c.innateDesc&&c.innate)  c.innateDesc=c.innate.desc;
  if(c.innateActive===undefined&&c.innate) c.innateActive=!!c.innate.active;
  if(c.innateCost===undefined&&c.innate)   c.innateCost=c.innate.cost||0;
  if(c.innateCooldown===undefined&&c.innate) c.innateCooldown=c.innate.cooldown||8000;
  // startDeck: deckOrder always wins if present (generates from STR).
  // Otherwise fall back to legacy deck / CREATURE_DECKS.
  if(c.deckOrder){
    c.startDeck = buildCreatureDeck(c);
  } else if(!c.startDeck){
    if(CREATURE_DECKS&&CREATURE_DECKS[id]){
      c.startDeck=CREATURE_DECKS[id].cards.slice();
    } else if(c.deck){
      c.startDeck=c.deck.slice();
    } else {
      c.startDeck=['strike','strike','brace'];
    }
  }
  return c;
}

function buildStartDeck(champId){
  var c=getCreaturePlayable(champId);
  var mods=getSanctumMods(champId);
  var cp=getChampPersist(champId);
  var currentStr = cp.stats.str;
  var baseStr = (c && c.baseStats && c.baseStats.str) || currentStr;
  var cap = calcDeckCap(currentStr);

  // If the deck editor has saved an override, use it directly
  if(mods.deckOverride && mods.deckOverride.length > 0){
    var base = mods.deckOverride.slice();
    // Pad with Dead Weight if current STR cap exceeds deck size (post level-up)
    while(base.length < cap) base.push('filler');
    return base;
  }

  // Generate base deck from creature's base STR (not current STR).
  // This gives the designed baseline deck for this creature.
  var base;
  if(c && c.deckOrder){
    base = buildCreatureDeck(c, baseStr);
  } else {
    base = c&&c.startDeck ? c.startDeck.slice() : (c&&c.deck ? c.deck.slice() : ['strike','strike','brace']);
  }

  // Apply removals
  (mods.removed||[]).forEach(function(r){
    for(var i=0;i<(r.copies||1);i++){
      var idx=base.indexOf(r.cardId);
      if(idx!==-1) base.splice(idx,1);
    }
  });
  // Apply swaps (replace fromId with toId)
  (mods.swaps||[]).forEach(function(s){
    var idx=base.indexOf(s.fromId);
    if(idx!==-1) base[idx]=s.toId;
  });
  // Apply extras (add copies)
  (mods.extras||[]).forEach(function(e){
    for(var i=0;i<(e.copies||1);i++) base.push(e.cardId);
  });

  // Pad with Dead Weight if STR has grown beyond base deck size.
  // Player can swap these out via Sanctum deck editor.
  while(base.length < cap) base.push('filler');
  return base;
}

function makeGS(champId,area){
  var ch=getCreaturePlayable(champId);
  var cp=getChampPersist(champId);
  // Apply level floor from Sanctum
  var floors=PERSIST.sanctum?PERSIST.sanctum.levelFloors:{};
  if(floors[champId]&&cp.level<floors[champId]){
    // Bring stats up to floor level without modifying persist (run-only)
    var floored=JSON.parse(JSON.stringify(cp));
    while(floored.level<floors[champId]){
      floored.stats.str+=ch.growth.str; floored.stats.agi+=ch.growth.agi; floored.stats.wis+=ch.growth.wis;
      floored.level++;
    }
    cp=floored;
  }
  var stats={str:cp.stats.str,agi:cp.stats.agi,wis:cp.stats.wis};
  var hp=calcHp(stats.str);
  var rapidAssault=ch.id==='moonsquirrel'?1.15:1.0;
  // Build deck with Sanctum mods; store tier upgrades in startTierMap
  var mods=getSanctumMods(champId);
  var deckIds=buildStartDeck(champId);
  var startTierMap={}; // {cardId: tier} for start-only upgraded copies
  var tierBudget={};
  Object.keys(mods.cardTiers||{}).forEach(function(cid){
    var cnt=deckIds.filter(function(d){return d===cid;}).length;
    tierBudget[cid]={tier:mods.cardTiers[cid],count:cnt};
  });
  deckIds.forEach(function(cid){
    if(tierBudget[cid]&&tierBudget[cid].count>0){
      tierBudget[cid].count--;
      // track as upgraded (keyed with index to allow multiple copies)
      if(!startTierMap[cid]) startTierMap[cid]=0;
      startTierMap[cid]++;
    }
  });

  return {
    champId:champId, area:area,
    level:cp.level, xp:cp.xp, xpNext:cp.xpNext,
    stats:stats, growth:ch.growth,
    playerHp:hp, playerMaxHp:hp,
    playerShield:0, playerShieldMana:0, playerDodge:false,
    mana:0, maxMana:calcMaxMana(stats.wis), manaRegen:calcManaRegen(stats.wis), manaAccum:0,
    enemies:area.enemies, enemyIdx:0,
    enemyHp:area.enemies[0].baseHp, enemyMaxHp:area.enemies[0].baseHp,
    enemyShell:0, enemyCardCount:0,
    enemyDrawPool:[], enemyDiscardPile:[], enemyHand:[],
    enemyMana:0, enemyMaxMana:0, enemyManaRegen:0, enemyManaAccum:0, _innCooldown:0,
    lastEnemyCard:null, lastCardPlayed:null,
    adaptiveStacks:0,
    drawPool:deckIds.slice().sort(function(){return Math.random()-0.5;}),
    discardPile:[], hand:[],
    startTierMap:startTierMap, // {cardId: numUpgradedCopies} for start-only tier display
    drawTimer:0, statusEffects:{player:[],enemy:[]},
    running:false, goldEarned:0,
    drawSpeedBonus:rapidAssault, drawSpeedBonusTimer:0,
    playerRooted:false, playerDrawDelay:0,
    enemyDodge:false, enemyDodgeProcReady:false,
    _rooterAcc:0, _silktrapFired:false,
    lastPlayerCard:null,
    _brittleShellFired:false, _waxMeltAcc:0, _waxTimerAcc:0, waxDamageDealt:0,
    nextCardCrit:false, shadowMarkActive:false, conjuredCount:0, _thornsGuard:false,
    killedEnemyIds:[],
    _damageTaken:0,
    // New mechanic state
    _conjuredCardId:null,
    _volatile:null,
    _suspended:false,
    _suspendEnd:0,
    _nextDrawBonus:0,
    _trollHealed:false,
    _lastCardTime:0,
    _pinchReduce:0,
    _swarmCallStacks:0,
    _myceliumBurst:false,
    // New innate accumulators
    _seepAcc:0, _accumAcc:0, _accumStacks:0,
    _digInAcc:0, _digInFired:false,
    _magmaAcc:0,
    _lureApplied:false,
    _inkCloudUsed:false,
    _moltenCoreFired:false,
    _frenzyFired:false,
    _sporeHits:0,
    _swarmAntUsed:false,
    // Unified combat actors (new system — see combat.js)
    actors: null,
  };
  // Apply equipped relics — modifies gs stats, flags, and starting values
  applyRelics(gs);
  return gs;
}

// ═══════════════════════════════════════════════════════
// CHAMPION SELECT
// ═══════════════════════════════════════════════════════
var CS_PAGE=0;
var CS_PER_PAGE=12;

function buildSelectScreen(){
  document.getElementById('cs-gold').innerHTML=goldImgHTML('16px')+' '+PERSIST.gold;
  CS_PAGE=0;
  rebuildChampGrid();
}

function csChangePage(dir){
  var sort=document.getElementById('cs-sort').value;
  var list=getSortedChampList(sort);
  var pages=Math.max(1,Math.ceil(list.length/CS_PER_PAGE));
  CS_PAGE=Math.max(0,Math.min(pages-1,CS_PAGE+dir));
  rebuildChampGrid();
}

function getSortedChampList(sort){
  // Only show unlocked champions — no locked/seen enemies cluttering the grid
  var unlocked=PERSIST.unlockedChamps.filter(function(id){return !!CREATURES[id];}).map(function(id){getCreaturePlayable(id);return id;});

  var scored=unlocked.map(function(id){
    var cp=getChampPersist(id);
    var kills=PERSIST.achievements[id+'_kill']||0;
    var score=0;
    switch(sort){
      case 'recent': score=1000+PERSIST.unlockedChamps.indexOf(id); break;
      case 'level':  score=cp.level*100+cp.xp; break;
      case 'str':    score=cp.stats.str; break;
      case 'agi':    score=cp.stats.agi; break;
      case 'wis':    score=cp.stats.wis; break;
      case 'kills':  score=kills; break;
      case 'alpha':  return {id:id,score:0,name:CREATURES[id].name,isUnlocked:true,isSeen:true};
    }
    return {id:id,score:score,isUnlocked:true,isSeen:true};
  });

  if(sort==='alpha'){
    scored.sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
  } else {
    scored.sort(function(a,b){ return b.score-a.score; });
  }

  // Add a single mystery slot at the end to hint more champions exist
  scored.push({id:'__mystery__',score:-999,isUnlocked:false,isSeen:false});
  return scored;
}

function rebuildChampGrid(){
  document.getElementById('cs-gold').innerHTML=goldImgHTML('16px')+' '+PERSIST.gold;
  var sort=document.getElementById('cs-sort').value;
  var list=getSortedChampList(sort);
  var pages=Math.max(1,Math.ceil(list.length/CS_PER_PAGE));
  CS_PAGE=Math.max(0,Math.min(pages-1,CS_PAGE));

  document.getElementById('cs-page-lbl').textContent=(CS_PAGE+1)+' / '+pages;
  document.getElementById('cs-prev').disabled=(CS_PAGE===0);
  document.getElementById('cs-next').disabled=(CS_PAGE>=pages-1);
  var unlocked=PERSIST.unlockedChamps.length;
  document.getElementById('cs-total').textContent=unlocked+' champion'+(unlocked!==1?'s':'')+' unlocked';

  var grid=document.getElementById('champ-grid'); grid.innerHTML='';
  var pageItems=list.slice(CS_PAGE*CS_PER_PAGE,(CS_PAGE+1)*CS_PER_PAGE);

  pageItems.forEach(function(item){
    var id=item.id;
    var d=document.createElement('div');

    if(id==='__mystery__'){
      // Mystery slot — hints more champions exist
      d.className='champ-card locked unseen-champ';
      d.innerHTML='<div class="unseen-icon">?</div>'
        +'<div class="champ-name unseen-name">UNKNOWN</div>'
        +'<div class="unseen-hint">More champions await discovery</div>'
        +'<div class="unseen-lock">🔒</div>';

    } else if(item.isUnlocked&&CREATURES[id]){
      var ch=getCreaturePlayable(id);
      var cp=getChampPersist(id);
      var isDead=!cp.alive;
      var isOnExpedition = cp.lockedExpedition !== null && cp.lockedExpedition !== undefined;
      d.className='champ-card'+(isDead?' dead-champ':'')+(isOnExpedition?' expedition-locked':'');
      d.id='cc-'+id;
      if(!isOnExpedition) d.onclick=function(){ selectChamp(id); };
      var xpPct=Math.min(100,Math.round((cp.xp/cp.xpNext)*100));
      var s=cp.stats;
      var deadHtml=isDead?'<div class="dead-badge">✦ FALLEN — Lv.1 on next run</div>':'';
      var expHtml=isOnExpedition?'<div class="exp-locked-badge">🏕️ ON EXPEDITION</div>':'';
      var lastAreaHtml=cp.lastArea?'<div class="champ-last-area">Last: '+cp.lastArea+'</div>':'<div class="champ-last-area">Not yet ventured</div>';
      d.innerHTML=deadHtml+expHtml
        +'<div class="champ-icon">'+creatureImgHTML(id, ch.icon, '96px')+'</div>'
        +'<div class="champ-name">'+ch.name+'</div>'
        
        +'<div class="champ-level-row">'
          +'<span class="champ-level-badge">Lv.'+cp.level+'</span>'
          +'<div class="champ-xp-wrap"><div class="champ-xp-bar" style="width:'+xpPct+'%"></div></div>'
          +'<span style="font-size:8px;color:#7a6030;">'+xpPct+'%</span>'
        +'</div>'
        +lastAreaHtml
        +'<div class="champ-stats-row">'
          +'<div><div class="champ-stat-v str">'+s.str+'</div><div class="champ-stat-l">STR</div></div>'
          +'<div><div class="champ-stat-v agi">'+s.agi+'</div><div class="champ-stat-l">AGI</div></div>'
          +'<div><div class="champ-stat-v wis">'+s.wis+'</div><div class="champ-stat-l">WIS</div></div>'
        +'</div>'
        +'<div class="champ-growth-row">'
          +'<span class="str">+'+ch.growth.str+' STR</span>'
          +'<span class="agi">+'+ch.growth.agi+' AGI</span>'
          +'<span class="wis">+'+ch.growth.wis+' WIS</span>'
          +'<span style="color:#4a3010;">/ lv</span>'
        +'</div>'
        +'<div class="innate-box"><div class="innate-lbl">✦ '+ch.innateName+'</div><div class="innate-txt">'+ch.innateDesc+'</div></div>'
        +'<button class="champ-card-info-btn" onclick="event.stopPropagation();selectChamp(\''+id+'\');openChampPanel();" title="Champion info">ℹ</button>';
    }

    grid.appendChild(d);
  });

  // Keep selected champion highlighted if still on this page
  if(selectedChampId){
    var sel=document.getElementById('cc-'+selectedChampId);
    if(sel) sel.classList.add('selected');
  }
}

function buyChampionUnlock(id){
  var cond=UNLOCK_CONDITIONS[id];
  if(!cond||!cond.goldCost) return;
  if(PERSIST.unlockedChamps.indexOf(id)!==-1) return; // already unlocked
  if(PERSIST.gold<cond.goldCost){
    // Flash the gold display
    var el=document.getElementById('nav-gold');
    if(el){ el.style.color='#e05050'; setTimeout(function(){ el.style.color=''; },600); }
    return;
  }
  PERSIST.gold-=cond.goldCost;
  PERSIST.unlockedChamps.push(id);
  savePersist();
  addLog('✦ '+CREATURES[id].name+' champion unlocked for '+cond.goldCost+' gold!','sys');
}

function selectChamp(id){
  playSelectSfx();
  selectedChampId=id;
  document.querySelectorAll('.champ-card').forEach(function(c){c.classList.remove('selected');});
  var el=document.getElementById('cc-'+id); if(el) el.classList.add('selected');
}

function confirmChampion(){
  if(!selectedChampId) selectedChampId=PERSIST.unlockedChamps[0]||'druid';
  if(PERSIST.unlockedChamps.indexOf(selectedChampId)===-1) return;
  playUiClickSfx();
  showScreen('area-screen');
  showNav(true);
  updateNavBar('adventure');
  buildAreaScreen();
}

function confirmArea(){
  if(!selectedArea) return;
  playEnterAreaSfx();
  startRun(selectedChampId,selectedArea);
}
// ── NAV BAR ──
// Screens that show the nav bar
var NAV_SCREENS=['select-screen','town-screen','area-screen'];

function showNav(show){
  document.getElementById('main-nav').style.display=show?'block':'none';
}

function updateNavBar(activeTab){
  document.getElementById('nav-adventure').classList.toggle('active',activeTab==='adventure');
  var tt=document.getElementById('nav-town');
  if(tt){
    tt.classList.toggle('active',activeTab==='town');
    tt.classList.remove('locked-tab');
    tt.title='';
  }
  document.getElementById('nav-gold').innerHTML=goldImgHTML('16px')+' '+PERSIST.gold;
  updateAchBadge();
}

function navToTown(){
  navTo('town');
}

function navTo(tab){
  if(tab==='adventure'){
    if(gs&&gs.running){ addLog('Finish the battle first.','sys'); return; }
    showScreen('select-screen');
  } else if(tab==='town'){
    openTown();
  }
}

// Restore the town tab to its normal clickable state
function _restoreTownTab(){
  var tt=document.getElementById('nav-town');
  if(tt){
    tt.classList.remove('locked-tab');
    tt.onclick=function(){ navToTown(); };
    tt.title='';
  }
  var retBtn=document.getElementById('btn-return-battle');
  if(retBtn) retBtn.style.display='none';
}

// Called from the "Return to Battle" nav button when player visits town mid-run
function returnToBattle(){
  if(!gs) return;
  showScreen('game-screen');
  var retBtn=document.getElementById('btn-return-battle');
  if(retBtn) retBtn.style.display='none';
  if(gs.running) startLoops();
}

function goToHub(){
  stopLoops(); hideOverlays();
  if(gs){ PERSIST.gold+=gs.goldEarned; gs.goldEarned=0; savePersist(); }
  gs=null; selectedArea=null;
  document.getElementById('log-area').innerHTML='';
  document.getElementById('btn-pause').style.display='none';
  document.getElementById('btn-pause').textContent='PAUSE';
  document.getElementById('btn-deck-view').style.display='none';
  _restoreTownTab();
  if(selectedChampId){
    showScreen('area-screen');
    showNav(true);
    updateNavBar('adventure');
    buildAreaScreen();
  } else {
    showScreen('select-screen');
    showNav(true);
    updateNavBar('adventure');
  }
}

function goToSelect(){
  showScreen('select-screen');
}

function buildHub(){
  // Legacy — now just updates nav
}

// ═══════════════════════════════════════════════════════
// AREA SELECT
// ═══════════════════════════════════════════════════════
function buildAreaScreen(){
  var ch=getCreaturePlayable(selectedChampId);
  var cp=getChampPersist(selectedChampId);
  var champLevel=cp.level;
  setCreatureImg(document.getElementById('area-icon'), selectedChampId, ch.icon, '40px');
  document.getElementById('area-champ-nm').textContent=ch.name+' (Lv.'+champLevel+')';
  var areas=generateAreas(champLevel);
  var grid=document.getElementById('area-grid'); grid.innerHTML='';
  document.getElementById('area-confirm-btn').disabled=true;
  areas.forEach(function(area){
    // Danger: area level > champ level + 1
    var danger=area.level>champLevel+1;
    // Grind: area level < champ level - 1 (XP penalty applies)
    var grind=area.level<champLevel-1;
    var card=document.createElement('div');
    var isBoss=!!(area.def&&area.def.isBossArea);
    card.className='area-card'+(danger?' danger':'')+(grind?' grind':'')+(isBoss?' boss-area':'');
    card.onclick=function(){
      playSelectSfx();
      document.querySelectorAll('.area-card').forEach(function(c){c.classList.remove('selected');});
      card.classList.add('selected'); selectedArea=area;
      document.getElementById('area-confirm-btn').disabled=false;
    };
    var stars=Math.min(5,Math.ceil(area.level/3)),starStr='';
    for(var i=0;i<5;i++) starStr+='<span style="color:'+(i<stars?'#d4a843':'#2a1808')+';">★</span>';
    var eIcons=[],seen={};
    area.enemies.forEach(function(e){if(!seen[e.icon]){eIcons.push(e.icon);seen[e.icon]=true;}});
    var xpMult=calcXpMult(champLevel,area.level);
    var xpLabel=grind?'<div style="font-size:7px;color:#806030;font-family:Cinzel,serif;text-align:center;margin-bottom:2px;">'+Math.round(xpMult*100)+'% XP</div>':'';
    var bossLabel=isBoss?'<div style="font-size:8px;color:#a03030;font-family:Cinzel,serif;text-align:center;margin-bottom:3px;letter-spacing:1px;">⚠ BOSS ENCOUNTER</div>':'';
    card.innerHTML=(isBoss?'<div style="position:absolute;top:6px;right:6px;font-size:16px;">💀</div>':'')
      +'<div class="area-icon">'+areaImgHTML(area.def.id, area.def.icon, '36px')+'</div>'
      +'<div class="area-name">'+area.def.name+'</div>'
      +'<div class="area-lvl">LEVEL '+area.level+'</div>'
      +bossLabel
      +(danger&&!isBoss?'<div class="area-danger-lbl">⚠ ABOVE YOUR LEVEL</div>':'')
      +xpLabel
      +'<div class="area-stars">'+starStr+'</div>'
      +'<div class="area-theme">'+area.def.theme+'</div>'
      +'<div class="area-row"><span class="area-rl">CREATURES</span><span class="area-rv">'+eIcons.slice(0,3).join(' ')+'</span></div>'
      +'<div class="area-row"><span class="area-rl">FIGHTS</span><span class="area-rv">'+area.enemies.length+(isBoss?' (boss)':'')+'</span></div>'
      +'<button class="area-info-btn" onclick="event.stopPropagation();openLocationInBestiary(\''+area.def.id+'\')" title="Location info">ℹ</button>';
    if(isBoss) card.style.position='relative'; // for skull positioning
    grid.appendChild(card);
  });
}

function openChampDeckView(){
  _sanctumChamp=selectedChampId;
  showDeckViewForChamp(selectedChampId);
}

function openChampSanctum(){
  // Now routes to the new deck editor
  openDeckEditor(selectedChampId);
}

// ═══════════════════════════════════════════════════════
// DECK EDITOR
// ═══════════════════════════════════════════════════════
var _deChampId = null;
var _deDeck    = [];   // current working deck (array of card ids, mutable)
var _deHistory = [];   // stack of previous deck states for undo
var _deSelected= -1;   // index in _deDeck that is selected for replacement
var _deTab     = 'unlocks'; // active available-cards tab
var MAX_CARD_COPIES = 5; // max copies of any one card (Dead Weight exempt)

// ── Deck editor tooltip ──
var _deTip = null;
function _deShowTooltip(e, card){
  if(!card) return;
  _deHideTooltip();
  var tip = document.createElement('div');
  tip.className = 'de-tooltip';
  var effect = (card.effect||'').split('\n')[0];
  var mana   = card.manaCost ? '<div class="de-tooltip-mana">'+card.manaCost+' mana</div>' : '';
  tip.innerHTML = '<div class="de-tooltip-name">'+card.name+'</div>'
    +'<div class="de-tooltip-effect">'+effect+'</div>'
    + mana;
  document.body.appendChild(tip);
  _deTip = tip;
  _deMoveTooltip(e);
}
function _deHideTooltip(){
  if(_deTip){ _deTip.remove(); _deTip = null; }
}
function _deMoveTooltip(e){
  if(!_deTip) return;
  var x = e.clientX + 10, y = e.clientY - 10;
  if(x + 190 > window.innerWidth) x = e.clientX - 200;
  if(y + 80  > window.innerHeight) y = e.clientY - 90;
  _deTip.style.left = x + 'px';
  _deTip.style.top  = y + 'px';
}

// ── Info strip — shows full card + keyword glossary ──
var _deInfoPinned = null; // card pinned by selection (vs just hovered)

function _deUpdateInfo(card, pinned){
  if(pinned !== undefined) _deInfoPinned = pinned ? card : null;
  var display = card || _deInfoPinned;

  var wrap   = document.getElementById('de-info-card-wrap');
  var detail = document.getElementById('de-info-detail');
  if(!wrap || !detail) return;

  if(!display){
    wrap.innerHTML   = '';
    detail.innerHTML = '<div class="de-info-empty">Select a card to see details</div>';
    return;
  }

  // Full card render (uses existing buildCardHTML)
  var cardId = display.id || '';
  wrap.innerHTML = buildCardHTML(cardId, false);

  // Detail: name, full effect, keyword glossary
  var fullEffect = renderKeywords((display.effect||'').replace(/\n/g,'<br>'));
  var html = '<div class="de-info-name">'+display.name+'</div>';
  if(display.manaCost) html += '<div class="de-info-type">'+display.manaCost+' mana &nbsp;·&nbsp; '+display.type+'</div>';
  else html += '<div class="de-info-type">'+display.type+'</div>';
  html += '<div class="de-info-effect">'+fullEffect+'</div>';

  // Keyword glossary — find all [Keyword] references in the effect
  var kwMatches = (display.effect||'').match(/\[([A-Za-z]+)\]/g);
  if(kwMatches){
    var seen = {};
    var kwHtml = '';
    kwMatches.forEach(function(m){
      var word = m.slice(1,-1);
      if(seen[word] || !KEYWORDS[word]) return;
      seen[word] = true;
      kwHtml += '<div class="de-info-kw"><strong>'+word+'</strong> — '+KEYWORDS[word].def+'</div>';
    });
    if(kwHtml){
      html += '<div class="de-info-divider"></div>';
      html += '<div class="de-info-glossary-label">KEYWORDS</div>';
      html += '<div class="de-info-glossary">'+kwHtml+'</div>';
    }
  }

  detail.innerHTML = html;
}

var _deReturnScreen = 'area-screen';

function openDeckEditor(champId){
  // Track where we came from so Done returns correctly
  var cur = document.querySelector('.screen.active');
  _deReturnScreen = cur ? cur.id : 'area-screen';
  _deChampId  = champId;
  _deDeck     = buildStartDeck(champId).slice();
  _deHistory  = [];
  _deSelected = -1;
  _deTab      = 'unlocks';

  var ch = getCreaturePlayable(champId);
  var cp = getChampPersist(champId);

  // Header
  setCreatureImg(document.getElementById('de-portrait'), champId, ch.icon, '36px');
  document.getElementById('de-champ-name').textContent = ch.name;
  document.getElementById('de-champ-sub').textContent  = 'Lv.' + cp.level;
  document.getElementById('de-stat-row').innerHTML =
    '<span class="de-stat de-stat-str">'+Math.round(cp.stats.str)+' STR</span>'+
    '<span class="de-stat de-stat-agi">'+Math.round(cp.stats.agi)+' AGI</span>'+
    '<span class="de-stat de-stat-wis">'+Math.round(cp.stats.wis)+' WIS</span>';
  document.getElementById('de-gold-row').innerHTML =
    goldImgHTML('12px') + ' ' + PERSIST.gold;

  // Highlight filler on first visit
  _highlightFillerCards(champId);

  _deRender();
  showScreen('deck-edit-screen');
  showNav(false);
}

function _deCardArtHTML(cardId, card){
  if(!card) return '<span style="font-size:18px;">?</span>';
  if(card.champ){
    var src = 'assets/creatures/'+card.champ+'.png';
    return '<img src="'+src+'" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;transform:scaleX(-1);" onerror="this.style.display=\'none\'">';
  }
  return '<span style="font-size:18px;">'+(card.icon||'?')+'</span>';
}

function _deRender(){
  _deRenderDeck();
  _deRenderAvail();
  _deRenderFooter();
}

function _deRenderDeck(){
  var cp  = getChampPersist(_deChampId);
  var cap = calcDeckCap(cp.stats.str);
  var grid = document.getElementById('de-deck-grid');
  grid.innerHTML = '';

  // Count copies in working deck
  var counts = {};
  _deDeck.forEach(function(id){ counts[id] = (counts[id]||0)+1; });

  _deDeck.forEach(function(cardId, idx){
    var card = CARDS[cardId];
    var isFiller = cardId === 'filler';
    var isSelected = idx === _deSelected;
    var effectLine = card ? (card.effect||'').split('\n')[0] : '';
    var manaCost   = card && card.manaCost ? card.manaCost : 0;
    var cardType   = card ? (card.type||'utility') : 'utility';

    var d = document.createElement('div');
    d.className = 'de-card' + (isFiller?' de-filler':'') + (isSelected?' de-selected':'');
    d.setAttribute('data-type', cardType);
    d.innerHTML =
      (manaCost ? '<div class="de-mana-badge">'+manaCost+'</div>' : '')+
      '<div class="de-card-art">'+_deCardArtHTML(cardId, card)+'</div>'+
      '<div class="de-card-name">'+(card?card.name:cardId)+'</div>'+
      '<div class="de-card-effect">'+effectLine+'</div>'+
      (counts[cardId]>1?'<div class="de-copy-count">×'+counts[cardId]+'</div>':'');

    (function(i,c){ 
      d.onclick = function(){ _deSelectSlot(i); _deUpdateInfo(c, true); };
      d.onmouseenter = function(){ if(_deInfoPinned===null) _deUpdateInfo(c, false); };
      d.onmouseleave = function(){ if(_deInfoPinned===null) _deUpdateInfo(null); };
    })(idx, card);

    // Apply filler glow on first visit
    if(isFiller && !PERSIST['filler_seen_'+_deChampId]) d.classList.add('filler-glow');

    grid.appendChild(d);
  });

  // Update size bar
  var used = _deDeck.length;
  document.getElementById('de-size-fill').style.width = Math.min(100,Math.round(used/cap*100))+'%';
  document.getElementById('de-size-label').textContent = used + ' / ' + cap + ' slots used';
  document.getElementById('de-deck-size').textContent  = '(' + used + ')';

  // Mark filler as seen
  if(_deDeck.indexOf('filler') === -1 || PERSIST['filler_seen_'+_deChampId]){
    PERSIST['filler_seen_'+_deChampId] = true;
    savePersist();
  }
}

function _deSelectSlot(idx){
  if(_deSelected === idx){
    _deSelected = -1;
    _deInfoPinned = null;
    _deUpdateInfo(null);
  } else {
    _deSelected = idx;
  }
  _deRender();
}

function _deRenderAvail(){
  var ch  = getCreaturePlayable(_deChampId);
  var cp  = getChampPersist(_deChampId);
  var mods = getSanctumMods(_deChampId);
  var purchased = mods.purchasedUnlocks || [];

  // Build tabs
  var tabsEl = document.getElementById('de-avail-tabs');
  tabsEl.innerHTML = '';
  ['unlocks','universal','collection'].forEach(function(tab){
    var btn = document.createElement('button');
    btn.className = 'de-tab' + (tab===_deTab?' active':'');
    btn.textContent = tab === 'unlocks' ? 'UNLOCKS' : tab === 'universal' ? 'UNIVERSAL' : 'COLLECTION';
    btn.onclick = function(){ _deTab = tab; _deRenderAvail(); };
    tabsEl.appendChild(btn);
  });

  var grid = document.getElementById('de-avail-grid');
  grid.innerHTML = '';
  var labelEl = document.getElementById('de-avail-label');

  // Count copies in current working deck
  var deckCounts = {};
  _deDeck.forEach(function(id){ deckCounts[id] = (deckCounts[id]||0)+1; });

  if(_deTab === 'unlocks'){
    labelEl.textContent = 'CHAMPION CARDS';
    // Starting cards + unlockable cards
    var startCards  = (ch.startDeck||[]).filter(function(id){ return CARDS[id]&&CARDS[id].champ===_deChampId; });
    var uniqStart   = startCards.filter(function(id,i){ return startCards.indexOf(id)===i; });
    var rewards     = ch.cardRewards||[];
    var allChamp    = uniqStart.concat(rewards.filter(function(id){ return uniqStart.indexOf(id)===-1; }));

    if(!allChamp.length){
      grid.innerHTML = '<div style="font-size:8px;color:#3a2810;grid-column:1/-1;padding:8px;text-align:center;">No champion-specific cards yet.</div>';
      return;
    }

    allChamp.forEach(function(cardId){
      var card = CARDS[cardId]; if(!card) return;
      var isReward    = rewards.indexOf(cardId) !== -1;
      var isPurchased = purchased.indexOf(cardId) !== -1;
      var canBuy      = isReward && !isPurchased && cp.level >= 5;
      var isLocked    = isReward && !isPurchased;
      var buyGold     = 50; // cost to unlock a progression card
      var atMax       = deckCounts[cardId] >= MAX_CARD_COPIES;

      var effLine1 = (card.effect||'').split('\n')[0];
      var d = document.createElement('div');
      d.className = 'de-acard de-acard-champ' + (isLocked?' de-acard-locked':'');
      d.setAttribute('data-type', card.type||'utility');
      d.innerHTML =
        '<div class="de-acard-art">'+_deCardArtHTML(cardId, card)+'</div>'+
        '<div class="de-acard-name">'+card.name+'</div>'+
        '<div class="de-acard-effect">'+effLine1+'</div>'+
        (isLocked && canBuy   ? '<span class="de-buy-badge">'+buyGold+'g</span>' : '')+
        (isLocked && !canBuy  ? '<span class="de-lock-badge">Lv.5</span>' : '')+
        (!isLocked && atMax   ? '<span class="de-maxed-badge">MAX</span>' : '');

      if(isLocked && canBuy){
        d.onclick = function(){ _deBuyUnlock(cardId, buyGold); };
      } else if(!isLocked && !atMax){
        (function(id,c){ d.onclick=function(){_deSwap(id);}; })(cardId,card);
      }
      (function(c){ d.onmouseenter=function(){if(_deInfoPinned===null)_deUpdateInfo(c,false);}; d.onmouseleave=function(){if(_deInfoPinned===null)_deUpdateInfo(null);}; })(card);
      grid.appendChild(d);
    });

  } else if(_deTab === 'universal'){
    labelEl.textContent = 'UNIVERSAL CARDS';
    ['strike','brace'].forEach(function(cardId){
      var card = CARDS[cardId]; if(!card) return;
      var atMax = deckCounts[cardId] >= MAX_CARD_COPIES;
      var effLine2 = (card.effect||'').split('\n')[0];
      var d = document.createElement('div');
      d.className = 'de-acard' + (atMax?' de-acard-locked':'');
      d.setAttribute('data-type', card.type||'utility');
      d.innerHTML =
        '<div class="de-acard-art">'+_deCardArtHTML(cardId, card)+'</div>'+
        '<div class="de-acard-name">'+card.name+'</div>'+
        '<div class="de-acard-effect">'+effLine2+'</div>'+
        (atMax ? '<span class="de-maxed-badge">MAX</span>' : '');
      (function(id,c){ if(!atMax) d.onclick=function(){_deSwap(id);}; d.onmouseenter=function(){if(_deInfoPinned===null)_deUpdateInfo(c,false);}; d.onmouseleave=function(){if(_deInfoPinned===null)_deUpdateInfo(null);}; })(cardId,card);
      grid.appendChild(d);
    });

  } else { // collection
    labelEl.textContent = 'COLLECTION';
    var pool = PERSIST.sanctum && PERSIST.sanctum.unlockedCards || {};
    var poolIds = Object.keys(pool).filter(function(id){
      var c = CARDS[id];
      return pool[id]>0 && c && (!c.champ || c.champ===_deChampId);
    });
    if(!poolIds.length){
      grid.innerHTML = '<div style="font-size:8px;color:#3a2810;grid-column:1/-1;padding:8px;text-align:center;">No collected cards available.</div>';
      return;
    }
    poolIds.forEach(function(cardId){
      var card = CARDS[cardId]; if(!card) return;
      var atMax = deckCounts[cardId] >= MAX_CARD_COPIES;
      var effLine3 = (card.effect||'').split('\n')[0];
      var d = document.createElement('div');
      d.className = 'de-acard' + (atMax?' de-acard-locked':'');
      d.setAttribute('data-type', card.type||'utility');
      d.innerHTML =
        '<div class="de-acard-art">'+_deCardArtHTML(cardId, card)+'</div>'+
        '<div class="de-acard-name">'+card.name+'</div>'+
        '<div class="de-acard-effect">'+effLine3+'</div>'+
        '<div class="de-copy-count">'+pool[cardId]+' owned</div>'+
        (atMax ? '<span class="de-maxed-badge">MAX</span>' : '');
      (function(id,c){ if(!atMax) d.onclick=function(){_deSwap(id);}; d.onmouseenter=function(){if(_deInfoPinned===null)_deUpdateInfo(c,false);}; d.onmouseleave=function(){if(_deInfoPinned===null)_deUpdateInfo(null);}; })(cardId,card);
      grid.appendChild(d);
    });
  }
}

function _deSwap(incomingId){
  if(_deSelected === -1){
    // No slot selected — auto-select first filler or first available slot
    var fillerIdx = _deDeck.indexOf('filler');
    if(fillerIdx !== -1){ _deSelected = fillerIdx; }
    else { document.getElementById('de-hint').textContent = 'Select a card in your deck first'; return; }
  }
  // Check max copies (filler exempt)
  var counts = {};
  _deDeck.forEach(function(id){ counts[id]=(counts[id]||0)+1; });
  if(incomingId !== 'filler' && (counts[incomingId]||0) >= MAX_CARD_COPIES){
    document.getElementById('de-hint').textContent = 'Max '+MAX_CARD_COPIES+' copies of any card'; return;
  }

  // Save history for undo
  _deHistory.push(_deDeck.slice());
  if(_deHistory.length > 20) _deHistory.shift();

  _deDeck[_deSelected] = incomingId;
  _deSelected = -1;
  _deInfoPinned = CARDS[incomingId] || null;
  _deSave();
  _deRender();
  _deUpdateInfo(_deInfoPinned, false);
}

function _deBuyUnlock(cardId, goldCost){
  if(PERSIST.gold < goldCost){ showTownToast('Not enough gold (need '+goldCost+').'); return; }
  var mods = getSanctumMods(_deChampId);
  if(!mods.purchasedUnlocks) mods.purchasedUnlocks = [];
  if(mods.purchasedUnlocks.indexOf(cardId) !== -1) return;
  PERSIST.gold -= goldCost;
  mods.purchasedUnlocks.push(cardId);
  savePersist();
  showTownToast('Unlocked '+CARDS[cardId].name+'!');
  _deRenderAvail();
  document.getElementById('de-gold-row').innerHTML = goldImgHTML('12px')+' '+PERSIST.gold;
}

function deDeckUndo(){
  if(!_deHistory.length) return;
  _deDeck = _deHistory.pop();
  _deSelected = -1;
  _deSave();
  _deRender();
}

function deDeckReset(){
  if(!confirm('Reset '+getCreaturePlayable(_deChampId).name+'\'s deck to default?')) return;
  var mods = getSanctumMods(_deChampId);
  mods.swaps=[]; mods.extras=[]; mods.removed=[];
  savePersist();
  _deHistory = [];
  _deDeck = buildStartDeck(_deChampId).slice();
  _deSelected = -1;
  _deRender();
  showTownToast('Deck reset to default.');
}

function deDeckDone(){
  _deSave();
  var ret = _deReturnScreen || 'area-screen';
  if(ret === 'area-screen'){
    showScreen('area-screen');
    showNav(true);
    updateNavBar('adventure');
    buildAreaScreen();
  } else if(ret === 'town-screen'){
    openTown();
  } else if(ret === 'select-screen'){
    showScreen('select-screen');
    showNav(true);
    updateNavBar('adventure');
  } else {
    showScreen('area-screen');
    showNav(true);
    updateNavBar('adventure');
    buildAreaScreen();
  }
}

function _deSave(){
  // Reconstruct sanctum mods from the diff between default deck and working deck
  var ch      = getCreaturePlayable(_deChampId);
  var mods    = getSanctumMods(_deChampId);
  var defDeck = (ch.startDeck||[]).slice();

  // Build new extras/removed/swaps from scratch by comparing working vs default
  var working = _deDeck.slice();
  var def     = defDeck.slice();

  // Simple approach: store working deck directly as a flat override
  // We use a new field `deckOverride` to avoid breaking the existing swap/extras system
  mods.deckOverride = working;
  savePersist();
}

function _deRenderFooter(){
  var undoBtn = document.getElementById('de-undo-btn');
  undoBtn.style.display = _deHistory.length ? '' : 'none';
  var hint = document.getElementById('de-hint');
  if(_deSelected !== -1){
    var selCard = CARDS[_deDeck[_deSelected]];
    hint.textContent = (selCard ? selCard.name : 'slot') + ' selected — choose a replacement';
  } else {
    hint.textContent = 'Select a card in your deck to replace it';
  }
}


// ═══════════════════════════════════════════════════════
// CHAMPION INFO PANEL
// ═══════════════════════════════════════════════════════
function openChampPanel(){
  var ch=getCreaturePlayable(selectedChampId);
  var cp=getChampPersist(selectedChampId);
  if(!ch) return;
  playUiClickSfx();
  // Portrait
  setCreatureImg(document.getElementById('csp-portrait'), selectedChampId, ch.icon, '56px');
  document.getElementById('csp-name').textContent=ch.name;
  // role display removed
  document.getElementById('csp-level').textContent=cp.level;
  document.getElementById('csp-str').textContent=Math.round(cp.stats.str);
  document.getElementById('csp-agi').textContent=Math.round(cp.stats.agi);
  document.getElementById('csp-wis').textContent=Math.round(cp.stats.wis);
  // XP
  var xpPct=Math.min(100,Math.round((cp.xp/cp.xpNext)*100));
  document.getElementById('csp-xp-bar').style.width=xpPct+'%';
  document.getElementById('csp-xp-txt').textContent=cp.xp+' / '+cp.xpNext;
  // Innate
  document.getElementById('csp-innate-name').textContent='✦ '+ch.innateName;
  document.getElementById('csp-innate-desc').textContent=ch.innateDesc;
  // Deck
  var deck=buildStartDeck(selectedChampId);
  var counts={};
  deck.forEach(function(id){ counts[id]=(counts[id]||0)+1; });
  document.getElementById('csp-deck-count').textContent='('+deck.length+' cards)';
  document.getElementById('csp-deck-summary').textContent=Object.keys(counts).map(function(id){
    var c=CARDS[id]; return (counts[id]>1?counts[id]+'× ':'')+((c&&c.name)||id);
  }).join('\n');
  // Edit button — always available, no building gate
  document.getElementById('csp-edit-btn').style.display='';
  // Open
  document.getElementById('champ-panel').classList.add('open');
  document.getElementById('champ-panel-backdrop').style.display='block';
}

function closeChampPanel(){
  playUiCloseSfx();
  document.getElementById('champ-panel').classList.remove('open');
  document.getElementById('champ-panel-backdrop').style.display='none';
}

// ═══════════════════════════════════════════════════════
// QUEST POPUP (in-battle, no navigation)
// ═══════════════════════════════════════════════════════
function openQuestPopup(){
  var q=PERSIST.town&&PERSIST.town.quests;
  var a=q&&q.active;
  if(!a){ return; } // no quest, don't open

  document.getElementById('qp-title').textContent=a.title||'Active Quest';
  document.getElementById('qp-desc').textContent=a.desc||'';

  var prog=a.progress||0;
  var count=a.count||1;
  var pct=Math.min(100,Math.round((prog/count)*100));
  document.getElementById('qp-bar').style.width=pct+'%';

  var statusTxt=a.readyToClaim?'✦ Complete — ready to claim!'
    :a.failed?'✗ Failed'
    :(prog+' / '+count);
  document.getElementById('qp-progress').textContent=statusTxt;

  var rewardTxt='';
  if(a.reward){
    if(a.reward.gold) rewardTxt='Reward: ✦ '+a.reward.gold+' gold';
    else if(a.reward.gem) rewardTxt='Reward: '+a.reward.gem+' gem';
    else if(a.reward.material) rewardTxt='Reward: '+a.reward.material;
  }
  document.getElementById('qp-reward').textContent=rewardTxt;

  var claimBtn=document.getElementById('qp-claim-btn');
  if(claimBtn) claimBtn.style.display=a.readyToClaim?'':'none';

  document.getElementById('quest-popup-backdrop').style.display='block';
  document.getElementById('quest-popup').style.display='block';
}

function closeQuestPopup(){
  document.getElementById('quest-popup-backdrop').style.display='none';
  document.getElementById('quest-popup').style.display='none';
}

function closeQuestPopupAndClaim(){
  closeQuestPopup();
  // Navigate to board to do the actual claim
  navTo('town');
  setTimeout(function(){
    if(PERSIST.town.buildings.board&&PERSIST.town.buildings.board.unlocked) openBuilding('board');
  },120);
}

// ═══════════════════════════════════════════════════════
// START RUN
// ═══════════════════════════════════════════════════════


// Material icon — tries assets/icons/mat_{id}.png, falls back to emoji
function matImgHTML(matId, size){
  var sz = size || '18px';
  var emoji = (MATERIAL_DEFS[matId]&&MATERIAL_DEFS[matId].icon)||'✨';
  var src = 'assets/icons/mat_' + matId + '.png';
  var onerr = "this.style.display='none';this.nextSibling.style.display='inline';";
  var onld  = "this.nextSibling.style.display='none';";
  return '<span style="display:inline-flex;align-items:center;justify-content:center;width:'+sz+';height:'+sz+';">'
    + '<img src="'+src+'" style="image-rendering:pixelated;object-fit:contain;width:'+sz+';height:'+sz+';" onerror="'+onerr+'" onload="'+onld+'">'
    + '<span style="font-size:calc('+sz+' * 0.85);line-height:1;">'+emoji+'</span>'
    + '</span>';
}

// Relic icon — tries assets/icons/relics/{id}.png, falls back to emoji
function relicImgHTML(relicId, size){
  var sz = size || '32px';
  var relic = RELICS[relicId];
  var emoji = relic ? relic.icon : '?';
  var src = 'assets/icons/relics/' + relicId + '.png';
  var onerr = "this.style.display='none';this.nextSibling.style.display='inline';";
  var onld  = "this.nextSibling.style.display='none';";
  return '<span style="display:inline-flex;align-items:center;justify-content:center;width:'+sz+';height:'+sz+';">'
    + '<img src="'+src+'" style="image-rendering:pixelated;object-fit:contain;width:'+sz+';height:'+sz+';" onerror="'+onerr+'" onload="'+onld+'">'
    + '<span style="font-size:calc('+sz+' * 0.85);line-height:1;">'+emoji+'</span>'
    + '</span>';
}
function setCombatBackground(areaId){
  var playerPanel = document.getElementById('combatant-player');
  var enemyPanel  = document.getElementById('combatant-enemy');
  var gs_el       = document.getElementById('game-screen');
  if(gs_el) gs_el.style.backgroundImage='';
  if(!playerPanel||!enemyPanel) return;

  function applyBg(src){
    var url = 'url('+src+')';
    playerPanel.style.backgroundImage    = url;
    playerPanel.style.backgroundSize     = '200% 100%';
    playerPanel.style.backgroundPosition = 'left center';
    enemyPanel.style.backgroundImage     = url;
    enemyPanel.style.backgroundSize      = '200% 100%';
    enemyPanel.style.backgroundPosition  = 'right center';
  }

  var src = 'assets/backgrounds/' + areaId + '.png';
  var img = new Image();
  img.onload  = function(){ applyBg(src); };
  img.onerror = function(){
    // Fall back to default
    var def = new Image();
    def.onload  = function(){ applyBg('assets/backgrounds/default.png'); };
    def.onerror = function(){
      playerPanel.style.backgroundImage = '';
      enemyPanel.style.backgroundImage  = '';
    };
    def.src = 'assets/backgrounds/default.png';
  };
  img.src = src;
}
// ────────────────────────────────────────────────────────────────────────
function startRun(champId,area){
  gs=makeGS(champId,area);
  paused=false;
  var ch=CREATURES[champId];
  setCreatureImg(document.getElementById('top-portrait'), champId, ch.icon, '40px');
  document.getElementById('top-name').textContent=ch.name;
  document.getElementById('p-name').textContent=ch.name;
  setCreatureImg(document.getElementById('p-icon'), champId, ch.icon, '320px');
  document.getElementById('p-icon').classList.add('flip-x');

  // Innate card in hand area
  var innateCard=document.getElementById('innate-card');
  var innateArt=document.getElementById('innate-card-art');
  var innateName=document.getElementById('innate-card-name');
  var innateDesc=document.getElementById('innate-card-desc');
  var innatePasLbl=document.getElementById('innate-passive-lbl');
  var innateManaTrack=document.getElementById('innate-mana-track');
  var ib=document.getElementById('innate-btn'); // hidden proxy
  ib.disabled=true;
  if(innateArt) setCreatureImg(innateArt, champId, ch.icon||'⚡', '58px');
  if(innateName) innateName.textContent=ch.innateName||'Innate';
  if(innateDesc) innateDesc.textContent=ch.innateDesc||'';
  if(innateCard){
    innateCard.classList.remove('active-innate','ready');
    if(ch.innateActive){
      innateCard.classList.add('active-innate');
      if(innatePasLbl) innatePasLbl.style.display='none';
      if(innateManaTrack) innateManaTrack.style.display='block';
      ib.classList.remove('passive');
    } else {
      if(innatePasLbl) innatePasLbl.style.display='block';
      if(innateManaTrack) innateManaTrack.style.display='none';
      innateCard.style.cursor='default';
      ib.classList.add('passive');
    }
    // Tooltip on innate card
    innateCard.onmouseenter=function(e){ showTipDirect(ch.innateName, ch.innateActive?'ACTIVE — '+ch.innateCost+' mana':'PASSIVE', ch.innateDesc, '', e); };
    innateCard.onmousemove=moveTip;
    innateCard.onmouseleave=hideTip;
  }

  document.getElementById('btn-start').style.display='none';
  document.getElementById('btn-pause').style.display='none';
  document.getElementById('btn-pause').textContent='PAUSE';
  document.getElementById('btn-deck-view').style.display='none';
  // Lock town tab during combat, show return button
  var townTab=document.getElementById('nav-town');
  if(townTab){ townTab.classList.add('locked-tab'); townTab.onclick=null; townTab.title='Finish your battle first'; }
  var retBtn=document.getElementById('btn-return-battle');
  if(retBtn) retBtn.style.display='none'; // hidden until town is opened mid-run
  showScreen('game-screen');
  setCombatBackground(area.def.id);
  setEnemyUI(0); updateAll(); renderHand(); renderPiles();
  addLog('✦ '+ch.name+' enters '+area.def.name+'.','sys');
  trackAreaEnter(area.def.id);
  updateQuestIndicator();
  showTutorial('combat_intro');
  // Auto-show begin battle modal
  showBeginBattleModal();
}

function setEnemyUI(idx){
  var e=gs.enemies[idx];
  var total=gs.enemies.length;
  var ctr=document.getElementById('battle-counter');
  if(ctr) ctr.textContent='Battle '+(idx+1)+' of '+total;
  document.getElementById('e-name').textContent=e.name;
  setCreatureImg(document.getElementById('e-icon'), e.id, e.icon, '320px');
  document.getElementById('e-hp-bar').style.width='100%';
  document.getElementById('e-hp-txt').textContent=e.baseHp+'/'+e.baseHp;
  document.getElementById('e-tags').innerHTML='';
  if(e.innate) addInnateTag('enemy',e.innate);
  trackSeen(e.id);
  // Reset per-enemy state
  gs.enemyShell=0;
  gs.enemyCardCount=0; gs.lastEnemyCard=null;
  gs.enemyHand=[];
  // Enemy mana — scales with WIS like player
  var eManaMax=Math.round(e.wis*8+40);
  gs.enemyMaxMana=eManaMax; gs.enemyMana=0;
  gs.enemyManaRegen=Math.round(e.wis*1.2+3); gs.enemyManaAccum=0; gs._innCooldown=0;
  gs.playerRooted=false;
  gs.playerDrawDelay=0;
  gs.enemyDodge=false;
  gs.adaptiveStacks=0;
  // Build enemy deck — supports deckOrder (new), deck array (creature file),
  // and old format inline card objects
  var eDeck = e.deck || [];
  // If creature has deckOrder, generate deck from it
  if(!e.deck || e.deck.length === 0){
    var creatureDef = CREATURES[e.id];
    if(creatureDef && creatureDef.deckOrder){
      eDeck = buildCreatureDeck(creatureDef, e.str || (creatureDef.baseStats && creatureDef.baseStats.str) || 10);
    }
  }
  var pool=[];
  (eDeck).forEach(function(card){
    if(typeof card==='string'){
      // New format: card ID string — look up in CARDS
      var cDef=CARDS[card];
      if(cDef) pool.push({id:card, name:cDef.name, _new:true});
      else pool.push({id:card, name:card, _new:true});
    } else {
      // Old format: inline card object with copies
      for(var i=0;i<(card.copies||1);i++) pool.push(Object.assign({},card));
    }
  });
  // Shuffle
  for(var i=pool.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=pool[i]; pool[i]=pool[j]; pool[j]=tmp; }
  gs.enemyDrawPool=pool;
  gs.enemyDiscardPile=[];

  // Initialize unified combat actors (new system)
  // Player actor mirrors current gs state
  if(typeof createActor === 'function'){
    var playerActor = {
      id: gs.champId,
      creature: CREATURES[gs.champId],
      side: 'player',
      level: gs.level,
      str: gs.stats.str, agi: gs.stats.agi, wis: gs.stats.wis,
      hp: gs.playerHp, maxHp: gs.playerMaxHp,
      mana: gs.mana, maxMana: gs.maxMana,
      manaRegen: gs.manaRegen, manaAccum: gs.manaAccum,
      shield: gs.playerShield,
      hand: gs.hand,
      drawPool: gs.drawPool,
      discardPile: gs.discardPile,
      drawInterval: calcDrawInterval(gs.stats.agi),
      drawTimer: gs.drawTimer || 0,
      drawSpeedMult: gs.drawSpeedBonus || 1.0,
      statusEffects: gs.statusEffects.player,
      innateCooldown: 0,
      frenzyStacks: 0,
      dodge: gs.playerDodge || false,
      conjuredCount: gs.conjuredCount || 0,
      shadowMarkActive: gs.shadowMarkActive || false,
      nextCardCrit: gs.nextCardCrit || false,
      cardsPlayed: 0,
      lastCardPlayed: null,
      _cardMods: [],
    };
    var enemyActor = {
      id: e.id,
      creature: CREATURES[e.id] || {innate: e.innate, name: e.name},
      side: 'enemy',
      level: gs.level,
      str: e.str, agi: e.agi, wis: e.wis,
      hp: e.baseHp, maxHp: e.baseHp,
      mana: 0, maxMana: eManaMax,
      manaRegen: gs.enemyManaRegen, manaAccum: 0,
      shield: 0,
      hand: gs.enemyHand,
      drawPool: gs.enemyDrawPool,
      discardPile: gs.enemyDiscardPile,
      drawInterval: calcDrawInterval(e.agi),
      drawTimer: 0,
      drawSpeedMult: 1.0,
      statusEffects: gs.statusEffects.enemy,
      innateCooldown: 0,
      frenzyStacks: 0,
      dodge: gs.enemyDodge || false,
      conjuredCount: 0,
      shadowMarkActive: false,
      nextCardCrit: false,
      cardsPlayed: 0,
      lastCardPlayed: null,
      _cardMods: [],
    };
    gs.actors = { player: playerActor, enemy: enemyActor };
  }
}

// ═══════════════════════════════════════════════════════
// BATTLE
// ═══════════════════════════════════════════════════════
function startBattle(){
  if(!gs) return;
  document.getElementById('btn-start').style.display='none';
  document.getElementById('btn-pause').style.display='inline-block';
  gs.running=true; paused=false;
  var startCards=3; // default opening hand size
  var e=gs.enemies[gs.enemyIdx];
  addLog('⚔ '+e.name+' looms before you!','sys');
  // Reset per-battle shrine flags
  gs._shrineOpenVolleyUsed=0;
  if(gs._shrineExtraCards){ startCards+=gs._shrineExtraCards; gs._shrineExtraCards=0; }
  // Legacy flag compat
  if(gs._blessingExtraCard){ startCards=Math.max(startCards,4); gs._blessingExtraCard=false; }
  if(gs._blessingManaStart){ gs.mana=Math.round(gs.maxMana*gs._blessingManaStart); gs._blessingManaStart=0; }
  // Mana Font
  if(gs._blessingManaStart===undefined&&gs._shrine_mana_applied!==true&&gs.mana===0&&gs._shrineDrawSpeed===undefined){} // handled below
  // Iron Will — opening shield each battle
  if(gs._shrineOpenShield){
    var shAmt=gs._shrineOpenShield;
    gs.playerShield+=shAmt;
    addTag('player','shield','Iron Will ('+shAmt+')',null,null,'Iron Will: '+shAmt+' HP opening shield.');
    setTimeout(function(){ if(gs){gs.playerShield=Math.max(0,gs.playerShield-shAmt);removeTagsByClass('player','shield');} },5000);
  }
  // Swift Hands — persistent draw speed for run
  if(gs._shrineDrawSpeed){ gs.drawSpeedBonus=(gs.drawSpeedBonus||1)+gs._shrineDrawSpeed; }
  // War Cry — opening attack speed burst each battle
  if(gs._shrineWarCry){
    var wc=gs._shrineWarCry;
    applyStatus('player','buff','War Cry',wc.speed,'atkspeed_p',wc.dur,'War Cry: +'+Math.round(wc.speed*100)+'% attack speed for '+(wc.dur/1000)+'s.');
    gs.drawSpeedBonus=(gs.drawSpeedBonus||1)+wc.speed;
    var wcDur=wc.dur;
    setTimeout(function(){ if(gs) gs.drawSpeedBonus=Math.max(1,gs.drawSpeedBonus-wc.speed); },wcDur);
    addLog('War Cry! +'+(Math.round(wc.speed*100))+'% speed for '+(wcDur/1000)+'s.','buff');
  }
  // Battle Trance — draw speed burst each battle
  if(gs._shrineBattleTrance){
    var bt=gs._shrineBattleTrance;
    gs.drawSpeedBonus=(gs.drawSpeedBonus||1)+bt.speed;
    gs.drawSpeedBonusTimer=Math.max(gs.drawSpeedBonusTimer||0,bt.dur);
    addLog('Battle Trance! Draw speed +'+(Math.round(bt.speed*100))+'% for '+(bt.dur/1000)+'s.','buff');
  }
  // Predator's Eye — opening damage buff each battle
  if(gs._shrinePredatorsEye){
    var pe=gs._shrinePredatorsEye;
    applyStatus('player','buff',"Predator's Eye",pe.dmg,'dmg',pe.dur,"Predator's Eye: +"+Math.round(pe.dmg*100)+"% damage for "+(pe.dur/1000)+"s.");
    addLog("Predator's Eye! +"+(Math.round(pe.dmg*100))+"% damage for "+(pe.dur/1000)+"s.",'buff');
  }
  // Cursed Touch — apply debuffs to enemy at battle start
  if(gs._shrineCursedTouch){
    applyStatus('enemy','debuff','Cursed',-0.15,'dmg',4000,'Cursed Touch: enemy dmg -15%.');
    if(gs._shrineCursedTouch>=2) applyStatus('enemy','debuff','Marked',0.5,'death_mark',3000,'Cursed Touch: +50% damage taken.');
    addLog('Cursed Touch: enemy weakened!','debuff');
  }
  // (gs._shrineOpenVolley already set, consumed on card play)
  // ── Player Creature Innate effects at battle start ──
  // (Future: on_battle_start triggers can be added to creature innate definitions)
  for(var i=0;i<startCards;i++) doDraw(null,true);

  startLoops();
}
function startLoops(){ stopLoops(); tickTimer=setInterval(gameTick,100); scheduleEnemyAction(); }
function stopLoops(){ clearInterval(tickTimer); tickTimer=null; clearTimeout(enemyTimer); enemyTimer=null; clearInterval(_enemyDrawBarTimer); _enemyDrawBarTimer=null; }

// Manabound purge — when a creature's mana hits 0, all manabound
// statuses are immediately removed. Manabound: Shield, Dodge, Frenzy, Thorns, Haste.
function checkManabound(target, mana, effects){
  if(mana > 0) return;
  var purged = false;
  // Shield purge
  if(target === 'player' && gs.playerShield > 0){
    gs.playerShield = 0;
    // Remove shield status effect and call its onExpiry
    for(var i = effects.length-1; i >= 0; i--){
      if(effects[i].id === 'shield'){
        if(typeof effects[i]._onExpiry === 'function') effects[i]._onExpiry();
        effects.splice(i, 1);
      }
    }
    removeTagsByClass('player', 'shield');
    addLog('⚡ Shield purged (manabound — mana depleted).', 'sys');
    purged = true;
  }
  if(target === 'enemy' && (gs.enemyShell||0) > 0){
    gs.enemyShell = 0;
    for(var i = effects.length-1; i >= 0; i--){
      if(effects[i].id === 'shield') effects.splice(i, 1);
    }
    removeTagsByClass('enemy', 'shield');
    purged = true;
  }
  // Dodge purge
  if(target === 'player' && gs.playerDodge){
    gs.playerDodge = false;
    removeTagByLabel('player', 'Dodge');
    addLog('⚡ Dodge purged (manabound — mana depleted).', 'sys');
    purged = true;
  }
  // Frenzy purge
  for(var i = effects.length-1; i >= 0; i--){
    if(effects[i].id === 'frenzy'){
      var fLabel = effects[i].label || 'Frenzy';
      effects.splice(i, 1);
      removeTagByLabel(target, fLabel);
      if(target === 'player'){
        gs.drawSpeedBonus = 1.0;
        gs._frenzyDrawBonus = 0;
        addLog('⚡ Frenzy collapsed (manabound — mana depleted).', 'sys');
      }
      if(target === 'enemy'){
        var ce = gs.enemies[gs.enemyIdx];
        if(ce) ce._frenzyAtkMult = 1;
      }
      purged = true;
    }
  }
  // Thorns purge
  for(var i = effects.length-1; i >= 0; i--){
    if(effects[i].stat === 'thorns'){
      var tLabel = effects[i].label || 'Thorns';
      effects.splice(i, 1);
      removeTagByLabel(target, tLabel);
      if(target === 'player') addLog('⚡ Thorns purged (manabound — mana depleted).', 'sys');
      purged = true;
    }
  }
  // Haste purge
  for(var i = effects.length-1; i >= 0; i--){
    if(effects[i].stat === 'haste' || effects[i].id === 'haste'){
      var hLabel = effects[i].label || 'Haste';
      effects.splice(i, 1);
      removeTagByLabel(target, hLabel);
      if(target === 'player') addLog('⚡ Haste purged (manabound — mana depleted).', 'sys');
      purged = true;
    }
  }
}

function gameTick(){
  if(paused||!gs||!gs.running) return;
  // Sync old gs fields → actors (in case old code modified gs directly)
  if(gs.actors && typeof syncGSToActors === 'function') syncGSToActors();
  tickStatuses(100); tickDoTs(100);
  // Manabound purge — if mana hits 0, remove all manabound effects
  checkManabound('player', gs.mana, gs.statusEffects.player);
  checkManabound('enemy', gs.enemyMana, gs.statusEffects.enemy);
  // Battle timer
  gs._battleTimeMs=(gs._battleTimeMs||0)+100;
  updateTagTimers();
  // Mana regen — applies mana_regen debuffs from statuses (Lich, Watcher, etc.)
  var mRegenMult=1;
  getStatuses('player','mana_regen').forEach(function(s){ mRegenMult=Math.max(0.1,mRegenMult+s.val); });
  // Relic: mana_coil
  if(gs._relicManaRegenMult&&gs._relicManaRegenMult!==1) mRegenMult*=gs._relicManaRegenMult;
  gs.manaAccum+=gs.manaRegen*mRegenMult/10;
  if(gs.manaAccum>=1){ var g=Math.floor(gs.manaAccum); gs.manaAccum-=g; gs.mana=Math.min(gs.maxMana,gs.mana+g); }

  // Enemy mana regen
  if(gs.enemyMaxMana>0){
    gs.enemyManaAccum+=(gs.enemyManaRegen||3)/10;
    var eg=Math.floor(gs.enemyManaAccum);
    if(eg>=1){ gs.enemyManaAccum-=eg; gs.enemyMana=Math.min(gs.enemyMaxMana,gs.enemyMana+eg); }
  }
  // Enemy innate cooldown tick (player cooldown)
  if(gs._innCooldown>0) gs._innCooldown=Math.max(0,gs._innCooldown-100);

  // ── Hellfire passive: while hand empty, apply Haste 100% ──
  // Check both player and enemy actors
  if(gs.actors){
    ['player','enemy'].forEach(function(side){
      var actor = gs.actors[side];
      if(!actor || !actor.creature || !actor.creature.innate) return;
      if(actor.creature.innate.id !== 'hellfire') return;
      var handEmpty = actor.hand.length === 0;
      var hasHellfireHaste = actor.statusEffects.some(function(s){ return s.id === 'hellfire_haste'; });
      if(handEmpty && !hasHellfireHaste){
        // Apply massive haste
        actor.statusEffects.push({id:'hellfire_haste', label:'Hellfire', cls:'buff', stat:'haste', val:1.0, remaining:999999, maxRemaining:999999, desc:'Hellfire: 100% Haste while hand is empty.'});
        addTag(side, 'buff', '🔥 Hellfire', 0, '', 'Hellfire: 100% Haste while hand is empty.');
        addLog(actor.creature.name+' — Hellfire! 100% Haste!', 'innate');
      } else if(!handEmpty && hasHellfireHaste){
        // Remove hellfire haste
        for(var i = actor.statusEffects.length - 1; i >= 0; i--){
          if(actor.statusEffects[i].id === 'hellfire_haste') actor.statusEffects.splice(i, 1);
        }
        removeTagByLabel(side, '🔥 Hellfire');
      }
    });
  }

  // Enemy active innate AI — route through actorActivateInnate
  if(gs.actors && gs.actors.enemy && typeof actorActivateInnate === 'function'){
    var eActor = gs.actors.enemy;
    if(typeof syncGSToActors === 'function') syncGSToActors();
    if(eActor.creature && eActor.creature.innate && eActor.creature.innate.active){
      // Get effect array from innate or INNATE_EFFECTS registry
      var eInn = eActor.creature.innate;
      var eEffArr = eInn.effect || (typeof INNATE_EFFECTS !== 'undefined' ? INNATE_EFFECTS[eInn.id] : null);
      if(eEffArr && eEffArr.length && eActor.innateCooldown <= 0 && eActor.mana >= (eInn.cost||0)){
        var shouldActivate = true;
        if(eInn.id === 'absorb' && (!gs.lastCardPlayed || !CARDS[gs.lastCardPlayed])) shouldActivate = false;
        if(eInn.id === 'quick_hands' && eActor.hand.length === 0) shouldActivate = false;
        if(shouldActivate){
          actorActivateInnate(eActor);
          if(typeof syncActorsToGS === 'function') syncActorsToGS();
          updateAll();
        }
      }
    }
    // Tick enemy actor innate cooldown
    if(eActor.innateCooldown > 0) eActor.innateCooldown = Math.max(0, eActor.innateCooldown - 100);
  }
  // Draw speed bonus timer
  if(gs.drawSpeedBonusTimer>0){
    gs.drawSpeedBonusTimer-=100;
    if(gs.drawSpeedBonusTimer<=0){ gs.drawSpeedBonus=1.0; gs.drawSpeedBonusTimer=0; }
  }
  // Draw timer
  gs.drawTimer+=100;
  // Rooted: can't draw
  if(gs.playerRooted){ document.getElementById('draw-bar').style.width='0%'; updateAll(); maybeRenderHand(); return; }
  var eff=calcDrawInterval(gs.stats.agi)/gs.drawSpeedBonus;
  // Apply drawspeed debuffs
  getStatuses('player','drawspeed').forEach(function(s){ eff=eff/(1+s.val); });
  // Apply flat draw delay (Orbweaver web trap)
  eff=eff+(gs.playerDrawDelay||0);
  // Apply Slow debuff to player draw interval (Drowned Waterlogged, etc.)
  var playerSlow=gs.statusEffects.player.find(function(s){return s.stat==='slow_draw';});
  if(playerSlow) eff+=playerSlow.val||600;
  // Apply one-time draw speed bonus (e.g. Fence the Goods)
  if(gs._nextDrawBonus&&gs._nextDrawBonus>0){
    eff=Math.max(200, eff-gs._nextDrawBonus);
    gs._nextDrawBonus=0;
  }
  var pct=(gs.drawTimer/eff)*100;
  document.getElementById('draw-bar').style.width=Math.min(pct,100)+'%';
  if(gs.drawTimer>=eff){ gs.drawTimer=0; doDraw(null,false); }
  updateAll(); maybeRenderHand();
}

var _enemyDrawBarTimer=null;
function scheduleEnemyAction(){
  clearTimeout(enemyTimer); enemyTimer=null;
  clearInterval(_enemyDrawBarTimer);
  var e=gs.enemies[gs.enemyIdx];
  var interval=e.atkInterval;
  getStatuses('enemy','atkspeed').forEach(function(s){ interval=Math.round(interval/(1+(s.val||0))); });
  // Frenzy: reduce interval by frenzy multiplier
  if(e._frenzyAtkMult && e._frenzyAtkMult > 1) interval = Math.round(interval / e._frenzyAtkMult);
  // slow_draw: add flat ms to draw interval (non-stacking, just one instance)
  var slowDraw=gs.statusEffects.enemy.find(function(s){return s.stat==='slow_draw';});
  if(slowDraw) interval+=slowDraw.val||600;
  if(!interval||isNaN(interval)||interval<200) interval=200;
  // Animate draw bar draining over interval
  var elapsed=0;
  var bar=document.getElementById('e-draw-bar');
  if(bar){ bar.style.transition='none'; bar.style.width='100%'; }
  document.getElementById('enemy-eta').textContent=(interval/1000).toFixed(1)+'s';
  _enemyDrawBarTimer=setInterval(function(){
    if(!gs||!gs.running||paused) return;
    elapsed+=100;
    var pct=Math.max(0,100-Math.round((elapsed/interval)*100));
    if(bar) bar.style.width=pct+'%';
    var remaining=Math.max(0,(interval-elapsed)/1000);
    var etaEl=document.getElementById('enemy-eta');
    if(etaEl) etaEl.textContent=remaining.toFixed(1)+'s';
  },100);
  enemyTimer=setTimeout(function(){
    clearInterval(_enemyDrawBarTimer);
    if(!gs||!gs.running||paused) return;
    doEnemyAction(e);
    if(gs&&gs.running) scheduleEnemyAction();
  }, interval);
}

function enemyDrawCard(e){
  if(gs.enemyDrawPool.length===0){
    if(gs.enemyDiscardPile.length===0) return null;
    gs.enemyDrawPool=gs.enemyDiscardPile.slice().sort(function(){return Math.random()-.5;});
    gs.enemyDiscardPile=[];
    addLog(e.name+'\'s deck reshuffles.','draw');
  }
  return gs.enemyDrawPool.shift();
}

function doEnemyAction(e){
  var handSize=e.handSize||HAND_SIZE;

  // Sync before action
  if(gs.actors && typeof syncGSToActors === 'function') syncGSToActors();

  // Draw a card into hand
  var drawn=enemyDrawCard(e);
  if(drawn) gs.enemyHand.push(drawn);

  // Play oldest card from hand
  if(gs.enemyHand.length>0){
    // Overflow: auto-play until at capacity
    while(gs.enemyHand.length > handSize){
      _enemyPlayCard(e);
      if(!gs||!gs.running) return;
    }
    // Normal play: one card per tick
    if(gs.enemyHand.length>0){
      _enemyPlayCard(e);
    }
  }
  // Sync after action
  if(gs.actors && typeof syncActorsToGS === 'function') syncActorsToGS();
  updateAll(); checkEnd();
}

// Helper: play oldest card from enemy hand through new system
function _enemyPlayCard(e){
  if(!gs.enemyHand.length) return;
  var toPlay = gs.enemyHand[0];
  var cardDef = toPlay.id ? CARDS[toPlay.id] : null;

  if(gs.actors && gs.actors.enemy && cardDef && cardDef.effects && cardDef.effects.length){
    // New system
    playCardForActor(gs.actors.enemy, 0);
    if(gs.actors) gs.enemyMana = gs.actors.enemy.mana;
  } else if(cardDef){
    // Card exists but has no effects array — play as basic damage/defense
    gs.enemyHand.shift();
    var cardName = cardDef.name || toPlay.id;
    addLog(e.name+' — '+cardName+'.', cardDef.type==='defense'?'buff':'debuff');
    // Basic execution: just deal damage or apply shield based on type
    if(cardDef.type === 'attack'){
      var baseDmg = cardDef.dmg || 10;
      dealDamageToPlayer(baseDmg);
    } else if(cardDef.type === 'defense'){
      var shieldAmt = cardDef.shield || 12;
      gs.enemyShell = (gs.enemyShell||0) + shieldAmt;
    }
    if(!toPlay.ghost) gs.enemyDiscardPile.push(toPlay.id);
  } else {
    // Unknown card — just discard it
    gs.enemyHand.shift();
    addLog(e.name+' plays unknown card.','sys');
  }
}

// ── Enemy Active Innate Trigger System ──────────────────────────
// Creatures with innate.trigger:'mana_full' fire when mana >= cost.
// Creatures with innate.trigger:'hp_below' fire when HP <= threshold.
// Creatures with innate.trigger:'on_timer' fire every innate.cooldown ms.
// Passive innates (trigger:'passive' or no trigger) need no AI here.
function applyPlayerDmgMods(dmg,e){
  // Lurk: first enemy card deals double damage
  if(e.innate&&e.innate.id==='lurk'&&gs.enemyCardCount===1) dmg*=2;
  return Math.max(1,Math.round(dmg));
}

// ═══════════════════════════════════════════════════════
// HIT FEEDBACK — shake, flash, floating numbers
// ═══════════════════════════════════════════════════════
function flashHpBar(target, cls){
  var barId = target==='player' ? 'p-hp-bar' : 'e-hp-bar';
  var bar = document.getElementById(barId);
  if(!bar) return;
  bar.classList.remove(cls);
  void bar.offsetWidth; // force reflow
  bar.classList.add(cls);
  setTimeout(function(){ bar.classList.remove(cls); }, 400);
}

function shakeIcon(target, deathAnim){
  var iconId = target==='player' ? 'p-icon' : 'e-icon';
  var el = document.getElementById(iconId);
  if(!el) return;
  var animClass = deathAnim ? 'icon-death' : 'icon-shake';
  el.classList.remove('icon-shake','icon-death');
  void el.offsetWidth;
  el.classList.add(animClass);
  setTimeout(function(){ el.classList.remove(animClass); }, deathAnim ? 550 : 450);
}

function spawnFloatNum(target, text, isBig, cls){
  var iconId = target==='player' ? 'p-icon' : 'e-icon';
  var anchor = document.getElementById(iconId);
  if(!anchor) return;
  var rect = anchor.getBoundingClientRect();
  var el = document.createElement('div');
  el.className = 'float-num ' + (cls||'dmg-num') + (isBig ? ' big-num' : '');
  el.textContent = text;
  var jitter = (Math.random()-0.5)*28;
  el.style.left = (rect.left + rect.width/2 - 10 + jitter) + 'px';
  el.style.top  = (rect.top - 4) + 'px';
  document.body.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 950);
}

function spawnHealNum(target, text){
  spawnFloatNum(target, '+'+text, false, 'heal-num');
}

// Determine where a card's effect targets: 'enemy', 'player', or 'both'
function getCardTarget(cardId){
  var c = CARDS[cardId];
  if(!c) return 'enemy';
  var hitsEnemy = false, hitsSelf = false;
  // Check card type
  if(c.type === 'attack') hitsEnemy = true;
  if(c.type === 'defense') hitsSelf = true;
  // Check effects array for more detail
  if(c.effects){
    c.effects.forEach(function(e){
      var t = e.type || '';
      if(t.indexOf('dmg')!==-1 || t.indexOf('poison')!==-1 || t.indexOf('burn')!==-1 ||
         t.indexOf('slow')!==-1 || t.indexOf('weaken')!==-1 || t.indexOf('cursed')!==-1 ||
         t.indexOf('marked')!==-1 || t.indexOf('stun')!==-1) hitsEnemy = true;
      if(t.indexOf('shield')!==-1 || t.indexOf('heal')!==-1 || t.indexOf('dodge')!==-1 ||
         t.indexOf('mana')!==-1 || t.indexOf('draw')!==-1 || t.indexOf('frenzy')!==-1 ||
         t.indexOf('haste')!==-1) hitsSelf = true;
    });
  }
  if(hitsEnemy && hitsSelf) return 'both';
  if(hitsSelf) return 'player';
  if(hitsEnemy) return 'enemy';
  return 'neutral';
}

// Spawn a card ghost that flies from hand to target
// type: 'play' or 'discard'
function spawnCardFloat(cardId, type){
  var c = CARDS[cardId];
  if(!c) return;
  var container = document.getElementById('hand-cards');
  if(!container) return;
  var startRect = container.getBoundingClientRect();
  var startX = startRect.left + startRect.width/2;
  var startY = startRect.top + startRect.height/2;

  if(type === 'discard'){
    // Discard: fly to discard pile
    var discEl = document.getElementById('disc-cnt');
    if(discEl){
      var discRect = discEl.getBoundingClientRect();
      _spawnGhost(c.icon, startX, startY, discRect.left + discRect.width/2, discRect.top + discRect.height/2, 'discard', c.name);
    }
    return;
  }

  // Play: determine target and fly there
  var target = getCardTarget(cardId);
  var enemyEl = document.getElementById('e-icon');
  var playerEl = document.getElementById('p-icon');
  var enemyRect = enemyEl ? enemyEl.getBoundingClientRect() : null;
  var playerRect = playerEl ? playerEl.getBoundingClientRect() : null;

  if(target === 'both' && enemyRect && playerRect){
    // Shatter into two fragments
    var ghost = _createGhostEl(c.icon, startX, startY, c.name);
    ghost.classList.add('ghost-shatter');
    document.body.appendChild(ghost);
    // After brief hold, spawn two fragments
    setTimeout(function(){
      if(ghost.parentNode) ghost.parentNode.removeChild(ghost);
      _spawnGhost(c.icon, startX, startY, enemyRect.left + enemyRect.width/2, enemyRect.top + enemyRect.height/2, 'attack', c.name);
      _spawnGhost(c.icon, startX, startY, playerRect.left + playerRect.width/2, playerRect.top + playerRect.height/2, 'buff', c.name);
    }, 120);
  } else if(target === 'player' && playerRect){
    _spawnGhost(c.icon, startX, startY, playerRect.left + playerRect.width/2, playerRect.top + playerRect.height/2, 'buff', c.name);
  } else if(target === 'neutral'){
    // Neutral card (Dead Weight etc.) — fizzle in place
    var ghost = _createGhostEl(c.icon, startX, startY, c.name);
    ghost.classList.add('card-ghost-neutral');
    document.body.appendChild(ghost);
    setTimeout(function(){ if(ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 500);
  } else if(enemyRect){
    _spawnGhost(c.icon, startX, startY, enemyRect.left + enemyRect.width/2, enemyRect.top + enemyRect.height/2, 'attack', c.name);
  }
}

function _createGhostEl(icon, x, y, name){
  var el = document.createElement('div');
  el.className = 'card-ghost';
  el.innerHTML = '<div class="cg-icon">'+(icon||'?')+'</div>'+(name?'<div class="cg-name">'+name+'</div>':'');
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  return el;
}

function _spawnGhost(icon, fromX, fromY, toX, toY, cls, name){
  var el = _createGhostEl(icon, fromX, fromY, name);
  el.classList.add('card-ghost-' + cls);
  el.style.setProperty('--dx', (toX - fromX) + 'px');
  el.style.setProperty('--dy', (toY - fromY) + 'px');
  document.body.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 450);
}
// Echo trigger visual — a ripple effect at the discard pile when Echo fires
function spawnEchoFloat(cardId){
  var c = CARDS[cardId];
  if(!c) return;
  var discEl = document.getElementById('disc-cnt');
  if(!discEl) return;
  var rect = discEl.getBoundingClientRect();
  var el = document.createElement('div');
  el.className = 'echo-burst';
  el.textContent = c.icon;
  el.style.left = (rect.left + rect.width/2) + 'px';
  el.style.top = (rect.top + rect.height/2) + 'px';
  document.body.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 600);
}

// Remove all Conjured copies from hand, deck (drawPool), and discard.
// gs.conjuredCount tracks total conjured copies in existence.
// gs._conjuredCardId tracks which card ID is conjured.
function purgeAllConjured(){
  if(!gs || !gs.conjuredCount || gs.conjuredCount <= 0) return 0;
  var toRemove = gs.conjuredCount;
  var purged = 0;
  var targetId = gs._conjuredCardId;

  // Remove from hand (hand items have _conjured flag)
  for(var i = gs.hand.length - 1; i >= 0 && toRemove > 0; i--){
    if(gs.hand[i]._conjured){
      spawnCardFloat(gs.hand[i].id, 'discard');
      gs.hand.splice(i, 1);
      toRemove--; purged++;
    }
  }

  // Remove from discard pile (scan for conjured card ID)
  if(targetId){
    for(var i = gs.discardPile.length - 1; i >= 0 && toRemove > 0; i--){
      if(gs.discardPile[i] === targetId){
        gs.discardPile.splice(i, 1);
        toRemove--; purged++;
      }
    }

    // Remove from draw pool
    for(var i = gs.drawPool.length - 1; i >= 0 && toRemove > 0; i--){
      if(gs.drawPool[i] === targetId){
        gs.drawPool.splice(i, 1);
        toRemove--; purged++;
      }
    }
  }

  gs.conjuredCount = 0;
  gs._conjuredCardId = null;
  return purged;
}


// Spawn a draw animation — a card-shaped element flies from origin to hand
// origin: 'deck' (from deck pile) or 'innate' (from innate card)
function spawnDrawAnim(cardId, origin){
  var c = CARDS[cardId];
  if(!c) return;
  var srcId = origin === 'innate' ? 'innate-card' : 'deck-cnt';
  var src = document.getElementById(srcId);
  var dest = document.getElementById('hand-cards');
  if(!src || !dest) return;
  var srcRect = src.getBoundingClientRect();
  var destRect = dest.getBoundingClientRect();
  var el = document.createElement('div');
  el.className = 'draw-arc';
  el.innerHTML = '<div class="cg-icon">'+(c.icon||'?')+'</div><div class="cg-name">'+(c.name||cardId)+'</div>';
  var startX = srcRect.left + srcRect.width/2;
  var startY = srcRect.top + srcRect.height/2;
  var endX = destRect.left + destRect.width/2;
  var endY = destRect.top + destRect.height/2;
  el.style.left = startX + 'px';
  el.style.top = startY + 'px';
  el.style.setProperty('--dx', (endX - startX) + 'px');
  el.style.setProperty('--dy', (endY - startY) + 'px');
  document.body.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 450);
}


// Thin wrappers — route through dealDamage when actors exist
function dealDamageToPlayer(dmg){
  if(gs.actors && gs.actors.player && typeof dealDamage === 'function'){
    dealDamage(gs.actors.player, dmg);
  } else {
    dmg = Math.max(0, dmg);
    gs.playerHp = Math.max(0, gs.playerHp - dmg);
    if(dmg > 0){
      spawnFloatNum('player', '-'+dmg, dmg>=50);
      shakeIcon('player', false); flashHpBar('player', 'hp-flash-red');
      addLog('You take '+dmg+' dmg! ('+gs.playerHp+'/'+gs.playerMaxHp+' HP)', 'dmg');
    }
    updateAll(); checkEnd();
  }
}

function dealDamageToEnemy(dmg){
  if(gs.actors && gs.actors.enemy && typeof dealDamage === 'function'){
    dealDamage(gs.actors.enemy, dmg);
  } else {
    dmg = Math.max(0, dmg);
    gs.enemyHp = Math.max(0, gs.enemyHp - dmg);
    if(dmg > 0){
      spawnFloatNum('enemy', '-'+dmg, dmg>=50);
      shakeIcon('enemy', false); flashHpBar('enemy', 'hp-flash-red');
      addLog('Enemy takes '+dmg+' dmg! ('+gs.enemyHp+'/'+gs.enemyMaxHp+' HP)', 'dmg');
    }
    updateAll(); checkEnd();
  }
}


function forceAutoplay(){
  if(gs.hand.length===0) return;
  addLog('Forced autoplay: '+((CARDS[gs.hand[0].id]&&CARDS[gs.hand[0].id].name)||gs.hand[0].id)+'!','debuff');
  if(gs.actors && gs.actors.player){
    if(typeof syncGSToActors === 'function') syncGSToActors();
    playCardForActor(gs.actors.player, 0);
    if(typeof syncActorsToGS === 'function') syncActorsToGS();
  }
  renderHand(); renderPiles(); updateAll();
}

// ═══════════════════════════════════════════════════════
// DRAW & PLAY
// ═══════════════════════════════════════════════════════
// ── PLAYER DRAW (timer-driven) ──
// Called by gameTick when draw timer fires.
// Delegates all logic to actorDraw in combat.js.
function doDraw(overrideId, silent) {
  if (!gs.actors || !gs.actors.player) return;
  if (typeof syncGSToActors === 'function') syncGSToActors();
  actorDraw(gs.actors.player, overrideId || null, silent);
  if (typeof syncActorsToGS === 'function') syncActorsToGS();
  renderHand(); renderPiles();
}

function playCard(idx){
  if(!gs||!gs.running||paused) return;
  if(idx<0||idx>=gs.hand.length) return;
  var item=gs.hand[idx];
  if(item._drawLock && Date.now() < item._drawLock) return;

  var c=CARDS[item.id];
  if(!c){ addLog('Unknown card: '+item.id,'sys'); return; }

  // Sync before play
  if(gs.actors && typeof syncGSToActors === 'function') syncGSToActors();

  if(gs.actors && gs.actors.player && c.effects && c.effects.length > 0){
    playCardForActor(gs.actors.player, idx);
  } else if(gs.actors && gs.actors.player){
    // Card has no effects array — basic execution
    gs.hand.splice(idx,1);
    spawnCardFloat(item.id, 'play');
    addLog('You play '+c.name+'!','sys');
    playCardSfx();
    gs.lastCardPlayed = item.id;
    if(c.type === 'attack'){
      var dmg = c.dmg || 18;
      if(gs.actors.enemy) dealDamage(gs.actors.enemy, dmg);
      else dealDamageToEnemy(dmg);
    }
    if(!item.ghost) gs.discardPile.push(item.id);
  }

  // Sync after play
  if(gs.actors && typeof syncActorsToGS === 'function') syncActorsToGS();
  pendingConfirmIdx=-1;
  checkEnd(); renderHand(); renderPiles(); updateAll();
}


// ═══════════════════════════════════════════════════════
// CARD EFFECTS (activateInnate, combat helpers)
// Loaded from data/card_effects.js
// ═══════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════
// STATUS EFFECTS
// ═══════════════════════════════════════════════════════
function applyStatus(target,cls,label,val,stat,dur,desc){
  if(target==='enemy'&&cls==='debuff'&&gs&&gs._relicDebuffDurBonus&&(stat==='dmg'||stat==='death_mark'))
    dur+=gs._relicDebuffDurBonus;
  var list=gs.statusEffects[target];
  for(var i=0;i<list.length;i++){ if(list[i].label===label){ list[i].remaining=dur; return; } }
  list.push({label:label,cls:cls,val:val,stat:stat,remaining:dur,maxRemaining:dur,desc:desc||label});
  addTag(target,cls,label,val,stat,desc);
}
function applyDoT(target,id,dpt,tickMs,dur,desc){
  var list=gs.statusEffects[target];
  for(var i=0;i<list.length;i++){ if(list[i].id===id){ list[i].remaining=dur; return; } }
  var lbl=id.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
  list.push({id:id,label:lbl,cls:'debuff',stat:'dot',remaining:dur,maxRemaining:dur,dot:true,dpt:dpt,tickMs:tickMs,tickAcc:0,desc:desc||lbl});
  addTag(target,'debuff',lbl,0,'dot',desc);
}
function getStatus(target,stat){ var l=gs.statusEffects[target]; for(var i=0;i<l.length;i++) if(l[i].stat===stat) return l[i]; return null; }
function getStatuses(target,stat){ return gs.statusEffects[target].filter(function(s){return s.stat===stat;}); }

function updateTagTimers(){
  ['player','enemy'].forEach(function(target){
    var containerId=target==='player'?'p-tags':'e-tags';
    var el=document.getElementById(containerId); if(!el) return;
    var effects=gs.statusEffects[target]||[];
    // Update bar width (--t) for all timed statuses
    effects.forEach(function(s){
      if(s.stat==='stun'||s.id==='starburn') return;
      if(!s.maxRemaining||s.remaining>=999000) return;
      var pct=Math.max(0,Math.min(100,(s.remaining/s.maxRemaining)*100));
      var tag=el.querySelector('[data-label="'+s.label+'"]');
      if(tag) tag.style.setProperty('--t',pct.toFixed(1));
    });
    // Starburn special case
    var sb=effects.find(function(s){return s.id==='starburn';});
    if(sb){
      var tag=el.querySelector('[data-label="Starburn"]');
      if(tag){ var pct=Math.max(0,Math.min(100,(sb.remaining/6000)*100)); tag.style.setProperty('--t',pct.toFixed(1)); }
    }
    // Update text timers on all tags
    el.querySelectorAll('.tag').forEach(function(tag){
      var label=tag.dataset.label;
      var timerEl=tag.querySelector('.tag-timer');
      if(!timerEl) return;
      var status=null;
      for(var i=0;i<effects.length;i++){
        if(effects[i].label===label){ status=effects[i]; break; }
      }
      if(status && status.remaining > 0 && status.remaining < 999000){
        timerEl.textContent=' '+Math.ceil(status.remaining/1000)+'s';
      } else {
        timerEl.textContent='';
      }
    });
  });
}

function tickStatuses(ms){
  ['player','enemy'].forEach(function(t){
    var list=gs.statusEffects[t];
    for(var i=list.length-1;i>=0;i--){
      if(list[i].stat==='stun'||list[i].id==='starburn') continue;
      list[i].remaining-=ms;
      if(list[i].remaining<=0){
        var lbl=list[i].label;
        var stat=list[i].stat;
        var statusId=list[i].id;
        var onExpiry=list[i]._onExpiry;
        // Shield expiry — clear shield value
        if(statusId==='shield'){
          if(t==='player'){ gs.playerShield=0; }
          else { gs.enemyShell=0; }
          if(typeof onExpiry==='function') onExpiry();
        }
        list.splice(i,1);
        removeTagByLabel(t,lbl);
        // Frenzy expiry — clear speed multiplier
        if(statusId==='frenzy'){
          if(t==='player'){
            gs.drawSpeedBonus=1.0;
            gs._frenzyDrawBonus=0;
            addLog('Frenzy collapsed!','sys');
          }
          if(t==='enemy'){
            var ce=gs.enemies[gs.enemyIdx];
            if(ce) ce._frenzyAtkMult=1;
          }
        }
      }
    }
  });
  // Stun timer
  var stunIdx=gs.statusEffects.enemy.findIndex(function(s){return s.id==='stun';});
  if(stunIdx!==-1){ gs.statusEffects.enemy[stunIdx].remaining-=ms; if(gs.statusEffects.enemy[stunIdx].remaining<=0){ removeTagByLabel('enemy','Stunned'); gs.statusEffects.enemy.splice(stunIdx,1); } }
  // Starburn timer
  var sbIdx=gs.statusEffects.enemy.findIndex(function(s){return s.id==='starburn';});
  if(sbIdx!==-1){ gs.statusEffects.enemy[sbIdx].remaining-=ms; if(gs.statusEffects.enemy[sbIdx].remaining<=0){ removeTagByLabel('enemy','Starburn'); gs.statusEffects.enemy.splice(sbIdx,1); } }
}

function tickDoTs(ms){
  var suspended=gs._suspended&&Date.now()<(gs._suspendEnd||0);
  ['player','enemy'].forEach(function(t){
    gs.statusEffects[t].forEach(function(s){
      if(!s.dot) return;
      if(suspended&&t==='player') return;
      s.tickAcc+=ms;
      while(s.tickAcc>=s.tickMs){
        s.tickAcc-=s.tickMs;
        var dotDmg = s.dpt || 0;
        if(s.id==='starburn') dotDmg = (s.stacks||1)*5;
        if(dotDmg <= 0) continue;

        // Route through dealDamage if actors exist
        if(t==='enemy' && gs.actors && gs.actors.enemy){
          dealDamage(gs.actors.enemy, dotDmg, {isDot:true, bypassShield:true});
          if(SETTINGS.logd==='verbose') addLog(s.label+': '+dotDmg+' dmg.','debuff');
          // Mycelium Network: player gains Shield from enemy DoT ticks
          _checkMyceliumNetwork('player', dotDmg);
        } else if(t==='enemy'){
          dealDamageToEnemy(dotDmg);
          if(SETTINGS.logd==='verbose') addLog(s.label+': '+dotDmg+' dmg.','debuff');
        } else if(t==='player' && gs.actors && gs.actors.player){
          dealDamage(gs.actors.player, dotDmg, {isDot:true, bypassShield:true});
          if(SETTINGS.logd==='verbose') addLog(s.label+': '+dotDmg+' dmg (bypasses shield).','dmg');
          // Mycelium Network: enemy gains Shield from player DoT ticks
          _checkMyceliumNetwork('enemy', dotDmg);
        } else {
          gs.playerHp=Math.max(0,gs.playerHp-dotDmg);
          if(dotDmg>0){ shakeIcon('player',false); flashHpBar('player','hp-flash-red'); spawnFloatNum('player','-'+dotDmg,dotDmg>=50); }
          if(SETTINGS.logd==='verbose') addLog(s.label+': '+dotDmg+' dmg (bypasses shield).','dmg');
          updateAll(); checkEnd();
        }
      }
    });
  });
}

// Mycelium Network helper — check if the given side's creature has it, apply Shield
function _checkMyceliumNetwork(side, dotDmg){
  if(dotDmg <= 0) return;
  var innateId = null;
  if(side === 'player'){
    var pInn = CREATURES[gs.champId] && CREATURES[gs.champId].innate;
    innateId = pInn && pInn.id;
    // Also check INNATE_TRIGGERS registry
    if(!innateId && typeof INNATE_TRIGGERS !== 'undefined'){
      var cInn = CREATURES[gs.champId] && CREATURES[gs.champId].innate;
      if(cInn && INNATE_TRIGGERS[cInn.id]) innateId = cInn.id;
    }
  } else {
    var e = gs.enemies && gs.enemies[gs.enemyIdx];
    innateId = e && e.innate && e.innate.id;
  }
  if(innateId === 'mycelium_network'){
    if(side === 'player'){
      gs.playerShield = (gs.playerShield||0) + dotDmg;
      if(gs.actors && gs.actors.player) gs.actors.player.shield = gs.playerShield;
      _refreshShieldTag('player', gs.playerShield);
    } else {
      gs.enemyShell = (gs.enemyShell||0) + dotDmg;
      if(gs.actors && gs.actors.enemy) gs.actors.enemy.shield = gs.enemyShell;
      _refreshShieldTag('enemy', gs.enemyShell);
    }
  }
}

// ═══════════════════════════════════════════════════════
// TAGS & TOOLTIPS
// ═══════════════════════════════════════════════════════
function addTag(target,cls,label,val,stat,desc){
  var el=document.getElementById(target==='player'?'p-tags':'e-tags'); if(!el) return;
  if(el.querySelector('[data-label="'+label+'"]')) return;
  var t=document.createElement('span');
  t.className='tag '+cls; t.dataset.label=label; t.dataset.target=target;
  // Try to show a status icon, fall back to just text
  var iconHtml=stat?statusImgHTML(stat,'14px'):'';
  t.innerHTML=iconHtml+'<span class="tag-name">'+label+'</span><span class="tag-timer"></span>';
  t.style.setProperty('--t','100');
  t.addEventListener('mouseenter',function(e){ showTip(target,label,e,desc); });
  t.addEventListener('mousemove',moveTip);
  t.addEventListener('mouseleave',hideTip);
  el.appendChild(t);
}
function addInnateTag(target,innate){
  var el=document.getElementById(target==='player'?'p-tags':'e-tags'); if(!el) return;
  var t=document.createElement('span');
  t.className='tag innate'; t.dataset.label=innate.name;
  var hidden=innate.hidden&&false; // hidden innates are now always revealed
  t.textContent='◆ '+(hidden?'???':innate.name);
  var desc=hidden?'Unknown — defeat this creature to reveal its secret.':innate.desc;
  t.addEventListener('mouseenter',function(e){ showTipDirect(hidden?'???':innate.name,'INNATE',desc,'Permanent ability',e); });
  t.addEventListener('mousemove',moveTip);
  t.addEventListener('mouseleave',hideTip);
  el.appendChild(t);
}
function removeTagByLabel(target,label){ var el=document.getElementById(target==='player'?'p-tags':'e-tags'); if(!el) return; var t=el.querySelector('[data-label="'+label+'"]'); if(t) t.remove(); }
function removeTagsByClass(target,cls){ var el=document.getElementById(target==='player'?'p-tags':'e-tags'); if(!el) return; el.querySelectorAll('.tag.'+cls).forEach(function(t){t.remove();}); }
function _refreshShieldTag(target,amt){
  removeTagsByClass(target,'shield');
  if(amt>0) addTag(target,'shield','Shield ('+amt+')',null,'shield','Shield: absorbs '+amt+' direct damage.');
}

function showTip(target,label,e,fallbackDesc){
  var list=gs?gs.statusEffects[target]:[];
  var status=null;
  for(var i=0;i<list.length;i++) if(list[i].label===label){ status=list[i]; break; }
  var desc=fallbackDesc||(status&&status.desc)||label;
  var time=(status&&status.remaining<999000)?(status.remaining/1000).toFixed(1)+'s remaining':'Permanent';
  showTipDirect(label,'',desc,time,e);
}
function showTipDirect(name,sub,desc,time,e){
  document.getElementById('tip-name').textContent=(sub?sub+': ':'')+name;
  document.getElementById('tip-desc').textContent=desc;
  document.getElementById('tip-time').textContent=time;
  document.getElementById('tip').classList.add('show');
  moveTip(e);
}
function moveTip(e){
  var tip=document.getElementById('tip');
  var x=e.clientX+12,y=e.clientY-10;
  var tw=tip.offsetWidth||190,th=tip.offsetHeight||60;
  if(x+tw>window.innerWidth-8) x=e.clientX-tw-12;
  if(y+th>window.innerHeight-8) y=e.clientY-th-10;
  tip.style.left=x+'px'; tip.style.top=y+'px';
}
function hideTip(){ document.getElementById('tip').classList.remove('show'); }

// ═══════════════════════════════════════════════════════
// COMBAT END
// ═══════════════════════════════════════════════════════
function checkEnd(){
  if(!gs) return;
  if(!gs.running) return;  // already ended — prevent double-fire
  if(gs.enemyHp<=0){
    var e=gs.enemies[gs.enemyIdx];
    // Wax Oasis cannot be killed
    if(e.innate&&e.innate.id==='wax_timed'){ gs.enemyHp=gs.enemyMaxHp; return; }
    // Undying — skeleton survives once at 1 HP
    if(e.innate&&e.innate.id==='undying'&&!gs.skeletonUndyingUsed){
      gs.skeletonUndyingUsed=true; gs.enemyHp=1;
      addLog('Undying! The skeleton survives at 1 HP.','innate');
      shakeIcon('enemy',false); flashHpBar('enemy','hp-flash-red'); return;
    }
    // Swarm — roach survives once at 2 HP
    if(e.innate&&e.innate.id==='swarm'&&!gs.roachSwarmUsed){
      gs.roachSwarmUsed=true; gs.enemyHp=2;
      addLog('Swarm! The roach refuses to die!','innate');
      shakeIcon('enemy',false); flashHpBar('enemy','hp-flash-red'); return;
    }
    // Swarm Ant — tunnel ant survives once at 5 HP
    if(e.innate&&e.innate.id==='swarm_ant'&&!gs._swarmAntUsed){
      gs._swarmAntUsed=true; gs.enemyHp=5;
      addLog('Swarm! The ant refuses to die!','innate');
      shakeIcon('enemy',false); flashHpBar('enemy','hp-flash-red'); return;
    }
    // Burst — spore puff applies Poison on death
    if(e.innate&&e.innate.id==='burst'){
      gs.statusEffects.player.push({id:'burst_poison',label:'Burst Poison',cls:'debuff',stat:'dot',remaining:6000,maxRemaining:6000,dot:true,dpt:3,tickMs:2000,tickAcc:0,desc:'Burst: 3 dmg/2s from dying spore.'});
      addTag('player','debuff','Burst Poison',0,'dot','Spore Puff burst: 3/2s for 6s.');
      addLog('Burst! Dying spore applies Poison!','debuff');
    }
    // Volatile — flame sprite deals 5 Burn on death
    if(e.innate&&e.innate.id==='volatile'){
      gs.playerHp=Math.max(0,gs.playerHp-5);
      spawnFloatNum('player','-5',false);
      flashHpBar('player','hp-flash-red');
      addLog('Volatile! The sprite explodes — 5 Burn damage (bypasses shield)!','debuff');
      updateAll();
    }
    // Lure — restore draw speed when siren dies
    if(e.innate&&e.innate.id==='lure'&&gs._lureApplied){
      gs.drawSpeedBonus=Math.min(2,(gs.drawSpeedBonus||1)/0.80);
      removeTagByLabel('player','Lured');
      gs._lureApplied=false;
      addLog('Siren silenced — draw speed restored.','buff');
    }
    gs.running=false; stopLoops();
    shakeIcon('enemy',true); flashHpBar('enemy','hp-flash-red');
    setTimeout(function(){ doVictory(); }, 600);
  } else if(gs.playerHp<=0){
    gs.running=false; stopLoops();
    playDefeatSfx();
    shakeIcon('player',true); flashHpBar('player','hp-flash-red');
    setTimeout(function(){ doDefeat(); }, 600);
  }
}

function endWaxOasisFight(){
  if(!gs||!gs.running) return;
  gs.running=false; stopLoops();
  playWinSfx();
  var dmg=gs.waxDamageDealt||0;
  // Tiered gold reward
  var waxGold=0;
  if     (dmg>=400) waxGold=30;
  else if(dmg>=300) waxGold=25;
  else if(dmg>=200) waxGold=20;
  else if(dmg>=150) waxGold=15;
  else if(dmg>=100) waxGold=10;
  else if(dmg>=50)  waxGold=5;
  if(waxGold>0) gs.goldEarned+=waxGold;

  // XP (same as any fight) with shrine bonus
  var rawXp=Math.round(8+gs.area.level*10);
  var xpMult=calcXpMult(gs.level,gs.area.level);
  if(gs._shrineXpBonus) xpMult*=gs._shrineXpBonus;
  var xp=Math.max(1,Math.round(rawXp*xpMult));
  gs.xp+=xp;
  trackKill('waxoasis');
  checkLevelUp();
  saveChampionState();

  var isLast=(gs.enemyIdx+1>=gs.enemies.length);
  var tierLabel=waxGold>0?'Tier reward: +'+waxGold+'g':'No reward (deal 50+ dmg next time)';
  addLog('✦ Wax Oasis fades. '+dmg+' dmg dealt. '+tierLabel+' · +'+xp+' XP.','sys');

  // Show the standard reward overlay with a special subtitle
  var allRow=document.getElementById('reward-all-row');
  if(allRow){ allRow.style.opacity=''; allRow.style.pointerEvents=''; }
  buildRewardUI(isLast);
  document.getElementById('victory-sub').textContent='The Oasis fades… '+dmg+' damage dealt · '+tierLabel;
  document.getElementById('victory-overlay').classList.add('show');
  startRewardCountdown(isLast);
}

function doVictory(){
  var e=gs.enemies[gs.enemyIdx];
  var rawXp=Math.round(8+gs.area.level*10);
  var xpMult=calcXpMult(gs.level,gs.area.level);
  if(gs._shrineXpBonus) xpMult*=gs._shrineXpBonus;
  var xp=Math.max(1,Math.round(rawXp*xpMult));
  gs.xp+=xp;
  trackKill(e.id);
  var xpMsg=xpMult<1?' ('+Math.round(xpMult*100)+'% XP)':'';
  addLog('✦ Victory! +'+xp+' XP'+xpMsg+'.','sys');
  checkLevelUp();
  saveChampionState();
  var isLast=(gs.enemyIdx+1>=gs.enemies.length);
  if(isLast){
    // Area clear — gold reward based on area level
    var areaGold=Math.floor(15+gs.area.level*8+Math.random()*gs.area.level*4);
    gs.goldEarned+=areaGold;
    addLog('+'+areaGold+' gold (area clear).','sys');
    playWinSfx();
  } else { playVictorySfx(); }

  if(!isLast){
    // ── Mid-battle: no gold, just chain to next enemy ──
    updateTopBar();
    // Show mid-battle popup
    var toastEl=document.getElementById('gold-toast');
    var nextEl=document.getElementById('gold-toast-next');
    var nextIconEl=document.getElementById('gold-toast-next-icon');
    var nextHpEl=document.getElementById('gold-toast-next-hp');
    var barEl=document.getElementById('gold-toast-bar');
    var lblEl=document.getElementById('gold-toast-lbl');
    var nextE=gs.enemies[gs.enemyIdx+1];
    if(toastEl){
      if(nextEl) nextEl.textContent=nextE?nextE.name:'';
      if(nextIconEl) {
        if(nextE) nextIconEl.innerHTML=creatureImgHTML(nextE.id, nextE.icon, '48px');
        else nextIconEl.textContent='⚔️';
      }
      if(nextHpEl) nextHpEl.textContent=nextE?nextE.baseHp+' HP':'';
      if(barEl){ barEl.style.transition='none'; barEl.style.width='100%'; }
      toastEl.style.display='flex';
      toastEl.style.opacity='1';
      // Animate bar down over 2.5s
      var toastMs=2500, toastAcc=0;
      var toastTick=setInterval(function(){
        toastAcc+=100;
        var pct=Math.max(0,100-(toastAcc/toastMs)*100);
        if(barEl) barEl.style.width=pct+'%';
        var secs=Math.ceil((toastMs-toastAcc)/1000);
        if(lblEl) lblEl.textContent='Continuing in '+secs+'s...';
        if(toastAcc>=toastMs){
          clearInterval(toastTick);
          dismissGoldToast(false);
        }
      },100);
      // Click to dismiss early
      toastEl.onclick=function(){ clearInterval(toastTick); dismissGoldToast(true); };
    } else {
      setTimeout(function(){ postVictory(false,true); },2500);
    }
  } else {
    // ── Final enemy: area complete ──
    var rewardBox=document.getElementById('reward-box');
    var allRow=document.getElementById('reward-all-row');
    var actions=document.getElementById('reward-actions');
    var title=document.getElementById('reward-section-title');
    if(allRow) allRow.innerHTML='';
    if(title) title.textContent='';
    if(actions) actions.innerHTML='<button class="btn btn-gold" style="font-size:13px;padding:10px 28px;letter-spacing:1px;" onclick="finishAreaAndContinue()">CONTINUE ✦</button>';
    if(rewardBox) rewardBox.style.display='';
    buildRewardUI(true); // populates next-enemy-box with "AREA COMPLETE"
    document.getElementById('victory-sub').textContent='Area complete!';
    // Update countdown label to show auto-advance timer
    var lbl=document.getElementById('reward-countdown-lbl');
    if(lbl) lbl.textContent='Auto-continuing in 10s...';
    document.getElementById('victory-overlay').classList.add('show');
    startRewardCountdown(true);
  }
}

var _rewardTimer=null, _rewardTimerMs=0, _rewardTimerPaused=false, _rewardIsLast=false;
var REWARD_AUTO_MS_MIDBATTLE=3000;
var REWARD_AUTO_MS_FINAL=10000; // 10s for area complete — gives time to read

function startRewardCountdown(isLast){
  _rewardIsLast=isLast;
  var autoMs=isLast?REWARD_AUTO_MS_FINAL:REWARD_AUTO_MS_MIDBATTLE;
  _rewardTimerMs=autoMs;
  _rewardTimerPaused=false;
  clearInterval(_rewardTimer);
  _rewardTimer=setInterval(function(){
    if(_rewardTimerPaused) return;
    _rewardTimerMs-=100;
    var pct=Math.max(0,(_rewardTimerMs/autoMs)*100);
    var bar=document.getElementById('reward-countdown-bar');
    var lbl=document.getElementById('reward-countdown-lbl');
    if(bar) bar.style.width=pct+'%';
    if(lbl) lbl.textContent=isLast?'Auto-continuing in '+Math.ceil(_rewardTimerMs/1000)+'s...':'Continuing in '+Math.ceil(_rewardTimerMs/1000)+'s...';
    if(_rewardTimerMs<=0){
      clearInterval(_rewardTimer); _rewardTimer=null;
      autoTakeGold();
    }
  },100);
}

function dismissGoldToast(immediate){
  var toastEl=document.getElementById('gold-toast');
  if(!toastEl) return;
  toastEl.onclick=null;
  if(immediate){
    toastEl.style.display='none';
    postVictory(false,true);
  } else {
    toastEl.style.transition='opacity .35s';
    toastEl.style.opacity='0';
    setTimeout(function(){
      toastEl.style.display='none';
      toastEl.style.transition='';
      toastEl.style.opacity='1';
      postVictory(false,true);
    },350);
  }
}

function pauseRewardCountdown(){
  _rewardTimerPaused=true;
  var lbl=document.getElementById('reward-countdown-lbl');
  if(lbl) lbl.textContent='';
}

function stopRewardCountdown(){
  clearInterval(_rewardTimer); _rewardTimer=null;
  var bar=document.getElementById('reward-countdown-bar');
  var lbl=document.getElementById('reward-countdown-lbl');
  if(bar) bar.style.width='100%';
  if(lbl) lbl.textContent='';
}

function finishAreaAndContinue(){
  stopRewardCountdown();
  document.getElementById('victory-overlay').classList.remove('show');
  var rb=document.getElementById('reward-box');
  if(rb) rb.style.display='';
  // Restore reward actions for future use
  var actions=document.getElementById('reward-actions');
  if(actions) actions.innerHTML='<button class="btn btn-dim" style="font-size:10px;" onclick="openDeckPopup()">VIEW DECK</button>'
    +'<button class="btn btn-dim" style="font-size:10px;" onclick="skipAll()">SKIP</button>';
  gs.hand.forEach(function(h){if(!h.ghost) gs.discardPile.push(h.id);}); gs.hand=[];
  // Show spoils then go to area select
  var pool=buildSpoilsCardPool();
  if(pool.length){ showSpoilsOverlay(gs.champId); }
  else { goToAreaSelectAfterRun(); }
}

function autoTakeGold(){
  if(!gs) return;
  if(!_rewardIsLast){
    var goldAmt=Math.round(3+gs.area.level*2);
    gs.goldEarned+=goldAmt;
    addLog('Auto: +'+goldAmt+' gold.','sys');
    updateTopBar();
    postVictory(false, true);
  } else {
    // Final: auto-fire continue
    finishAreaAndContinue();
  }
}

function postVictory(isLast, autoChain){
  stopRewardCountdown();
  document.getElementById('victory-overlay').classList.remove('show');
  var rb=document.getElementById('reward-box');
  if(rb) rb.style.display='';
  gs.hand.forEach(function(h){if(!h.ghost) gs.discardPile.push(h.id);}); gs.hand=[];
  if(isLast){
    var pool=buildSpoilsCardPool();
    if(pool.length){ showSpoilsOverlay(gs.champId); }
    else { goToAreaSelectAfterRun(); }
  } else {
    // Revitalise — restore HP between battles (not on final)
    if(gs._shrineRevitalise&&gs.playerHp>0&&gs.playerHp<gs.playerMaxHp){
      var healAmt=gs._shrineRevitalise;
      gs.playerHp=Math.min(gs.playerMaxHp,gs.playerHp+healAmt);
      spawnHealNum('player',healAmt);
      flashHpBar('player','hp-flash-green');
    }
    nextEnemy(autoChain);
  }
}

function saveChampionState(){
  var cp=getChampPersist(gs.champId);
  var prevXp=cp.xpTotal||0;
  cp.level=gs.level; cp.xp=gs.xp; cp.xpNext=gs.xpNext;
  // xpTotal accumulates all XP ever earned — used for milestone tracking
  cp.xpTotal=Math.max(prevXp, (cp.level-1)*80 + cp.xp); // rough floor from level
  cp.stats={str:gs.stats.str,agi:gs.stats.agi,wis:gs.stats.wis};
  cp.alive=true;
  cp.lastArea=gs.area.def.name;
  savePersist();
}

// ═══════════════════════════════════════════════════════
// BLESSINGS — per-battle bonuses chosen as rewards
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// BONUSES — small per-battle perks (simplified)
// ═══════════════════════════════════════════════════════
var ALL_BONUSES = [
  {id:'extra_card', icon:'🃏', cls:'',           name:'One More',     desc:'Start the next battle with 1 extra card in hand.',
   apply:function(){ gs._blessingExtraCard=true; addLog('Next battle: +1 starting card.','sys'); }},
  {id:'mana_30',    icon:'🔮', cls:'mana-tile',  name:'Mana Vial',    desc:'Start next battle with 30% mana.',
   apply:function(){ gs._blessingManaStart=0.3; addLog('Next battle: start with 30% mana.','mana'); }},
  {id:'open_slow',  icon:'💨', cls:'',           name:'Trip Wire',    desc:'Enemy is slowed 30% for the first 2s of next battle.',
   apply:function(){ gs._blessingOpeningSlow=true; addLog('Next battle: opening slow on enemy.','buff'); }},
  {id:'open_shield',icon:'🛡', cls:'',           name:'Ward',         desc:'Start next battle with a small 3 HP shield.',
   apply:function(){ gs._blessingOpeningShield=true; addLog('Next battle: start with 3 HP shield.','buff'); }},
  // HP recovery — only surfaced when player is below 50% HP
  {id:'hp_5',       icon:'💖', cls:'hp-tile',    name:'Recover',      desc:'Restore 5 HP.',    _hpOnly:true,
   apply:function(){ gs.playerHp=Math.min(gs.playerMaxHp,gs.playerHp+5); spawnHealNum('player',5); flashHpBar('player','hp-flash-green'); addLog('+5 HP.','heal'); updateAll(); }},
  {id:'hp_8',       icon:'💗', cls:'hp-tile',    name:'Recover',      desc:'Restore 8 HP.',    _hpOnly:true,
   apply:function(){ gs.playerHp=Math.min(gs.playerMaxHp,gs.playerHp+8); spawnHealNum('player',8); flashHpBar('player','hp-flash-green'); addLog('+8 HP.','heal'); updateAll(); }},
];

function getBonusPool(){
  var isLowHp = gs.playerHp < gs.playerMaxHp * 0.5;
  var pool = ALL_BONUSES.filter(function(b){
    if(b._hpOnly) return isLowHp; // only appears when low HP
    return true;
  });
  // Shuffle and return 3
  pool = pool.slice().sort(function(){ return Math.random()-.5; });
  return pool.slice(0,3);
}

function buildRewardUI(isLast){
  var row=document.getElementById('reward-all-row'); row.innerHTML='';

  if(!isLast){
    // ── Mid-battle: gold only, auto-advances quickly ──
    var goldAmt=Math.round(3+gs.area.level*2);
    var goldWrap=document.createElement('div');
    goldWrap.className='reward-opt reward-opt-gold-only';
    goldWrap.innerHTML='<div class="bonus-tile gold-tile" style="width:100%;max-width:180px;margin:0 auto;">'
      +'<div class="bonus-icon">💰</div>'
      +'<div class="bonus-name">+'+goldAmt+' Gold</div>'
      +'<div class="bonus-desc">Tap to continue, or wait.</div>'
      +'</div>';
    goldWrap.onclick=function(){ gs.goldEarned+=goldAmt; addLog('+'+goldAmt+' gold.','sys'); updateTopBar(); postVictory(false); };
    row.appendChild(goldWrap);
  }

  // ── Next enemy preview / area complete ──
  var neb=document.getElementById('next-enemy-box'); neb.innerHTML='';
  var nextIdx=gs.enemyIdx+1;
  if(isLast){
    neb.innerHTML='<div class="ne-label">AREA COMPLETE</div><div class="ne-icon">🏆</div><div class="ne-name">All enemies defeated</div><div class="ne-final">Return to map.</div>';
  } else if(nextIdx<gs.enemies.length){
    var ne=gs.enemies[nextIdx];
    neb.innerHTML='<div class="ne-label">NEXT ENEMY</div>'
      +'<div class="ne-icon">'+ne.icon+'</div>'
      +'<div class="ne-name">'+ne.name+'</div>'
      +'<div class="ne-stats">'
        +'<div class="ne-stat"><div class="v str">'+ne.str+'</div><div class="l">STR</div></div>'
        +'<div class="ne-stat"><div class="v agi">'+ne.agi+'</div><div class="l">AGI</div></div>'
        +'<div class="ne-stat"><div class="v wis">'+ne.wis+'</div><div class="l">WIS</div></div>'
      +'</div>'
      +'<div class="ne-hp">'+ne.baseHp+' HP</div>'
      +(ne.innate?'<div class="ne-innate"><div class="ne-innate-lbl">◆ '+ne.innate.name+'</div><div class="ne-innate-desc">'+ne.innate.desc+'</div></div>':'');
  }
}

var cardChosen=false, blessChosen=false;
function checkBothChosen(){ postVictory(gs.enemyIdx+1>=gs.enemies.length); }
function skipCard(){ postVictory(gs.enemyIdx+1>=gs.enemies.length); }
function skipAll(){ postVictory(gs.enemyIdx+1>=gs.enemies.length); }
function skipReward(){ postVictory(gs.enemyIdx+1>=gs.enemies.length); }

// View deck from reward screen — uses pile popup reuse
function openDeckPopup(){
  var all = gs.drawPool.concat(gs.discardPile).concat(gs.hand.map(function(h){return h.id;}));
  var counts={}; all.forEach(function(id){counts[id]=(counts[id]||0)+1;});
  document.getElementById('popup-title').textContent = 'YOUR DECK ('+all.length+' cards)';
  var grid = document.getElementById('popup-grid'); grid.innerHTML = '';
  Object.keys(counts).forEach(function(id){
    var c = CARDS[id]; if(!c) return;
    var w = document.createElement('div'); w.style.position='relative';
    w.innerHTML = buildCardHTML(id,false)+'<div style="font-size:8px;color:#7a6030;text-align:center;margin-top:2px;">×'+counts[id]+'</div>';
    grid.appendChild(w);
  });
  document.getElementById('pile-popup').classList.add('show');
}
// Replace-a-card popup
var _pendingRewardCard=null;
function openReplacePopup(newCardId){
  _pendingRewardCard=newCardId;
  var all=gs.drawPool.concat(gs.discardPile);
  document.getElementById('popup-title').textContent='REPLACE WHICH CARD?';
  var grid=document.getElementById('popup-grid'); grid.innerHTML='';
  var seen={};
  all.forEach(function(id){
    if(seen[id]) return; seen[id]=true;
    var w=document.createElement('div'); w.style.cursor='pointer';
    w.innerHTML=buildCardHTML(id,false);
    w.onclick=function(){
      var idx=gs.drawPool.indexOf(id);
      if(idx!==-1) gs.drawPool.splice(idx,1);
      else { idx=gs.discardPile.indexOf(id); if(idx!==-1) gs.discardPile.splice(idx,1); }
      gs.drawPool.push(_pendingRewardCard);
      var nc=CARDS[_pendingRewardCard];
      addLog('Replaced '+(CARDS[id]?CARDS[id].name:id)+' with '+(nc?nc.name:_pendingRewardCard)+'.','sys');
      closePilePopup(null);
      cardChosen=true; checkBothChosen();
    };
    grid.appendChild(w);
  });
  document.getElementById('pile-popup').classList.add('show');
}

function doDefeat(){
  PERSIST.gold+=gs.goldEarned; gs.goldEarned=0;
  var lost=Math.min(PERSIST.gold,10); PERSIST.gold-=lost;
  var ch=getCreaturePlayable(gs.champId);
  var cp=getChampPersist(gs.champId);
  cp.level=1; cp.xp=0; cp.xpNext=80;
  cp.stats={str:ch.baseStats.str,agi:ch.baseStats.agi,wis:ch.baseStats.wis};
  cp.alive=false;
  cp.lastArea=gs.area.def.name;
  // Shrine counters
  PERSIST.shrineCounters.deaths=(PERSIST.shrineCounters.deaths||0)+1;
  // Still grant partial building XP for incomplete runs
  if(gs.area&&gs.area.level) grantAreaClearBuildingXp(Math.floor(gs.area.level/2)||1);
  savePersist();
  document.getElementById('defeat-sub').textContent='Lost '+lost+' gold. '+ch.name+' falls. Level reset to 1.';
  document.getElementById('defeat-overlay').classList.add('show');
  document.getElementById('defeat-overlay').style.display='block';
  addLog('✦ Defeated. Lost '+lost+' gold. Champion falls.','sys');
}

function retryBattle(){
  var d=document.getElementById('defeat-overlay');
  d.classList.remove('show'); d.style.display='none';
  var cp=getChampPersist(gs.champId);
  cp.alive=true; savePersist();
  startRun(gs.champId,gs.area);
  document.getElementById('log-area').innerHTML='';
}

function nextEnemy(autoChain){
  gs.enemyIdx++;
  var e=gs.enemies[gs.enemyIdx];
  gs.enemyHp=e.baseHp; gs.enemyMaxHp=e.baseHp;
  gs.playerHp=Math.min(gs.playerMaxHp,gs.playerHp);
  gs.playerShield=0; gs.playerShieldMana=0; gs.playerDodge=false;
  gs.drawPool=gs.drawPool.concat(gs.discardPile).sort(function(){return Math.random()-.5;});
  gs.discardPile=[]; gs.drawTimer=0;
  gs.mana=Math.min(gs.maxMana,Math.floor(gs.maxMana/4));
  gs.manaAccum=0; gs.statusEffects={player:[],enemy:[]};
  gs._trollRegenAcc=0; gs._wyrmAuraAcc=0;
  gs.drawSpeedBonus=1.0; gs.drawSpeedBonusTimer=0;
  gs.running=false;
  gs.enemyShell=0;
  gs.enemyCardCount=0; gs.lastEnemyCard=null;
  gs.enemyHand=[];
  gs.enemyDodge=false;
  // Rebuild enemy mana
  var eManaMax=Math.round(e.wis*8+40);
  gs.enemyMaxMana=eManaMax; gs.enemyMana=0;
  gs.enemyManaRegen=Math.round(e.wis*1.2+3); gs.enemyManaAccum=0;
  // Rebuild enemy deck
  var eDeck = [];
  var creatureDef = CREATURES[e.id];
  if(creatureDef && creatureDef.deckOrder){
    eDeck = buildCreatureDeck(creatureDef, e.str);
  }
  var pool=[];
  eDeck.forEach(function(card){
    if(typeof card==='string'){
      var cDef=CARDS[card];
      if(cDef) pool.push({id:card, name:cDef.name, _new:true});
      else pool.push({id:card, name:card, _new:true});
    } else {
      for(var i=0;i<(card.copies||1);i++) pool.push(Object.assign({},card));
    }
  });
  for(var i=pool.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=pool[i]; pool[i]=pool[j]; pool[j]=tmp; }
  gs.enemyDrawPool=pool;
  gs.enemyDiscardPile=[];
  // Rebuild enemy actor
  if(gs.actors){
    gs.actors.enemy = {
      id: e.id,
      creature: CREATURES[e.id] || {innate: e.innate, name: e.name},
      side: 'enemy',
      level: gs.level,
      str: e.str, agi: e.agi, wis: e.wis,
      hp: e.baseHp, maxHp: e.baseHp,
      mana: 0, maxMana: eManaMax,
      manaRegen: gs.enemyManaRegen, manaAccum: 0,
      shield: 0,
      hand: gs.enemyHand,
      drawPool: gs.enemyDrawPool,
      discardPile: gs.enemyDiscardPile,
      drawInterval: calcDrawInterval(e.agi),
      drawTimer: 0,
      drawSpeedMult: 1.0,
      statusEffects: gs.statusEffects.enemy,
      innateCooldown: 0,
      frenzyStacks: 0,
      dodge: false,
      conjuredCount: 0,
      shadowMarkActive: false,
      nextCardCrit: false,
      cardsPlayed: 0,
      lastCardPlayed: null,
      _cardMods: [],
    };
    // Also refresh player actor references
    if(gs.actors.player){
      gs.actors.player.hp = gs.playerHp;
      gs.actors.player.shield = gs.playerShield;
      gs.actors.player.mana = gs.mana;
      gs.actors.player.hand = gs.hand;
      gs.actors.player.drawPool = gs.drawPool;
      gs.actors.player.discardPile = gs.discardPile;
      gs.actors.player.statusEffects = gs.statusEffects.player;
      gs.actors.player.dodge = false;
    }
  }
  document.getElementById('p-tags').innerHTML='';
  setEnemyUI(gs.enemyIdx);
  addLog('⚔ Next: '+e.name+'!','sys');
  showScreen('game-screen');
  document.getElementById('btn-pause').style.display='none';
  document.getElementById('btn-deck-view').style.display='none';
  updateAll(); renderHand(); renderPiles();
  if(autoChain){
    addLog('Auto-starting next battle...','sys');
    setTimeout(function(){ if(gs&&!gs.running&&!paused) startBattle(); }, 1500);
  } else {
    showBeginBattleModal();
  }
}

function goToAreaSelectAfterRun(){
  stopLoops(); hideOverlays();
  // Clean up conjured cards (end of battle)
  if(gs && gs.conjuredCount > 0) purgeAllConjured();
  var lootGained=[];
  if(gs){
    saveChampionState();
    PERSIST.gold+=gs.goldEarned; gs.goldEarned=0;
    // First run completion — unlock the Vault
    if(!PERSIST.town.buildings.vault.unlocked){
      PERSIST.town.buildings.vault.unlocked=true;
      addLog('✦ The Vault is now open — visit the Town!','sys');
    }
    if(gs.area&&gs.area.def) lootGained=rollAreaLoot(gs.area.def);
    // Quest progress — area clear and run complete
    if(gs.area&&gs.area.def){
      var areaId=gs.area.def.id;
      var damageTaken=gs._damageTaken||0;
      checkQuestProgress('area_clear',{areaId:areaId, damageTaken:damageTaken});
      checkQuestProgress('run_complete',{goldEarned:gs.goldEarned||0});
      PERSIST.areaRuns[areaId]=(PERSIST.areaRuns[areaId]||0)+1;
      // Grant XP to all unlocked buildings
      grantAreaClearBuildingXp(gs.area.level||1);
      // Earn Soul Shards on run completion
      PERSIST.soulShards=(PERSIST.soulShards||0)+3;
      refreshSummonsBanner();
    } else savePersist();
    gs=null;
  }
  selectedArea=null;
  _restoreTownTab();
  // Return to area screen with the same champion, not champion select
  if(selectedChampId){
    showScreen('area-screen');
    showNav(true);
    updateNavBar('adventure');
    buildAreaScreen();
  } else {
    showScreen('select-screen');
    showNav(true);
    updateNavBar('adventure');
  }
  if(lootGained.length) showLootToast(lootGained);
}

// ═══════════════════════════════════════════════════════
// LEVEL UP
// ═══════════════════════════════════════════════════════
function checkLevelUp(){
  var ch=getCreaturePlayable(gs.champId);
  while(gs.xp>=gs.xpNext){
    gs.xp-=gs.xpNext; gs.level++; gs.xpNext=Math.floor(gs.xpNext*1.5);
    // Auto-apply champion's natural growth — same system as enemies
    var gains=[];
    ['str','agi','wis'].forEach(function(stat){
      var g=ch.growth[stat]||0;
      if(g>0){
        gs.stats[stat]+=g;
        gains.push('+'+g.toFixed(1).replace('.0','')+' '+stat.toUpperCase());
      }
    });
    // Recalculate derived stats
    gs.playerMaxHp=calcHp(gs.stats.str);
    gs.playerHp=Math.min(gs.playerHp+calcHp(ch.growth.str||0), gs.playerMaxHp);
    gs.maxMana=calcMaxMana(gs.stats.wis);
    gs.manaRegen=calcManaRegen(gs.stats.wis);
    addLog('✦ LEVEL '+gs.level+'! '+gains.join(' · '),'sys');
    showLevelUpToast(gs.level, gains);
    saveChampionState();
  }
  checkAchievementsAuto();
  updateTopBar();
}

var _luToastTimer=null;
function showLevelUpToast(level, gains){
  playLevelUpSfx();
  var el=document.getElementById('levelup-toast');
  document.getElementById('lu-toast-title').textContent='LEVEL '+level+'!';
  document.getElementById('lu-toast-stats').textContent=gains.join('  ·  ');
  el.style.display='block';
  clearTimeout(_luToastTimer);
  _luToastTimer=setTimeout(function(){ el.style.display='none'; }, 3000);
}

// ═══════════════════════════════════════════════════════
// DECK VIEW
// ═══════════════════════════════════════════════════════
var _deckReturnScreen='game-screen';

// Highlight filler cards the first time a champion's deck view is opened with them
function _highlightFillerCards(champId){
  var seenKey='filler_seen_'+(champId||'run');
  var alreadySeen=PERSIST[seenKey];
  var grid=document.getElementById('dv-grid');
  if(!grid) return;
  var hasUnseenFiller=false;
  grid.querySelectorAll('.dv-wrap').forEach(function(wrap){
    var card=wrap.querySelector('.card');
    if(!card) return;
    var title=card.querySelector('.card-title');
    if(title&&title.textContent.trim()==='Dead Weight'){
      if(!alreadySeen){ card.classList.add('filler-glow'); hasUnseenFiller=true; }
    }
  });
  if(hasUnseenFiller){ PERSIST[seenKey]=true; savePersist(); }
}

function showDeckView(){
  _deckReturnScreen='game-screen';
  // Hide begin-battle modal if it's open
  var bbm=document.getElementById('begin-battle-modal');
  if(bbm && bbm.style.display!=='none') { bbm.style.display='none'; _deckReturnScreen='begin-battle'; }
  stopLoops();
  var all=gs.drawPool.concat(gs.discardPile).concat(gs.hand.map(function(h){return h.id;}));
  var counts={}; all.forEach(function(id){counts[id]=(counts[id]||0)+1;});
  var grid=document.getElementById('dv-grid'); grid.innerHTML='';
  Object.keys(counts).forEach(function(id){
    var c=CARDS[id]; if(!c) return;
    var wrap=document.createElement('div'); wrap.className='dv-wrap';
    wrap.innerHTML=buildCardHTML(id,false)+'<div class="dv-cnt">×'+counts[id]+'</div>';
    grid.appendChild(wrap);
  });
  showScreen('deck-screen');
  _highlightFillerCards(gs&&gs.champId);
}

function showDeckViewForChamp(champId){
  _deckReturnScreen='area-screen';
  var deck=buildStartDeck(champId);
  var counts={}; deck.forEach(function(id){counts[id]=(counts[id]||0)+1;});
  var grid=document.getElementById('dv-grid'); grid.innerHTML='';
  Object.keys(counts).forEach(function(id){
    var c=CARDS[id]; if(!c) return;
    var wrap=document.createElement('div'); wrap.className='dv-wrap';
    wrap.innerHTML=buildCardHTML(id,false)+'<div class="dv-cnt">×'+counts[id]+'</div>';
    grid.appendChild(wrap);
  });
  showScreen('deck-screen');
  _highlightFillerCards(champId);
}

function continueDeckView(){
  if(_deckReturnScreen==='begin-battle'){
    // Return to the begin-battle modal
    showScreen('game-screen');
    var bbm=document.getElementById('begin-battle-modal');
    if(bbm) bbm.style.display='flex';
  } else if(_deckReturnScreen==='area-screen'){
    showScreen('area-screen');
    showNav(true);
    updateNavBar('adventure');
  } else {
    showScreen('game-screen');
    if(afterVictoryFn){var fn=afterVictoryFn;afterVictoryFn=null;fn();}
    else if(gs&&gs.running) startLoops();
  }
}

// ═══════════════════════════════════════════════════════
// PILE POPUP
// ═══════════════════════════════════════════════════════
function openPilePopup(which){
  var cards=which==='deck'?gs.drawPool:gs.discardPile;
  document.getElementById('popup-title').textContent=(which==='deck'?'DECK':'DISCARD')+' ('+cards.length+')';
  var display=cards.slice().sort(function(){return Math.random()-.5;});
  var grid=document.getElementById('popup-grid'); grid.innerHTML='';
  display.forEach(function(id){ var w=document.createElement('div'); w.innerHTML=buildCardHTML(id,false); grid.appendChild(w); });
  if(!cards.length) grid.innerHTML='<div style="color:#7a6030;font-family:Cinzel,serif;font-size:9px;text-align:center;padding:20px;grid-column:1/-1;">Empty</div>';
  document.getElementById('pile-popup').classList.add('show');
}
function closePilePopup(e){ if(!e||e.target===document.getElementById('pile-popup')) document.getElementById('pile-popup').classList.remove('show'); }

// ═══════════════════════════════════════════════════════
// BUILD CARD HTML
// ═══════════════════════════════════════════════════════
// Returns an inline font-size style string for .card-effect based on text length.
// Press Start 2P is wide so thresholds are tighter than you'd expect.
function cardEffectFontSize(effectText){
  var raw=(effectText||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  var len=raw.length;
  if(len<=30)  return 'font-size:10px;line-height:1.7;';
  if(len<=55)  return 'font-size:9px;line-height:1.8;';
  if(len<=80)  return 'font-size:8px;line-height:1.85;';
  if(len<=110) return 'font-size:7px;line-height:1.9;';
  if(len<=145) return 'font-size:6.5px;line-height:2.0;';
  return              'font-size:6px;line-height:2.0;';
}

// Card art — champion sprite if card has a champ, emoji fallback for universals
function cardArtHTML(cardId, emoji, manaCost, champId){
  var html='';
  if(champId){
    var csrc='assets/creatures/'+champId+'.png';
    html='<img class="card-champ-art" src="'+csrc+'" alt="" onerror="this.style.display=\'none\';">';
  }
  html+='<span class="card-emoji-icon"'+(champId?' style="opacity:0;"':'')+'>'+emoji+'</span>';
  if(manaCost) html+='<div class="card-mana-badge">'+manaCost+'</div>';
  return html;
}

function getCardIdentityLabel(c){
  if(!c||!c.champ) return 'Universal';
  var cr=CREATURES&&CREATURES[c.champ];
  return cr ? cr.name : c.champ.charAt(0).toUpperCase()+c.champ.slice(1);
}

function getCardTags(c){
  if(!c) return ['unique'];
  var tags=[];
  var DMG={dmg:1,dmg_stat:1,dmg_multi:1,dmg_if_debuff:1,dmg_if_hp_low:1,dmg_crit:1,dmg_if_shielded:1,dmg_if_slowed:1,dmg_if_poison:1,dmg_if_burn:1,dmg_if_full_hand:1,dmg_first_card:1,dmg_scaling_played:1,poison_detonate:1,burn_detonate:1};
  var DEB={slow:1,cursed:1,marked:1,poison:1,poison_stat:1,burn:1,burn_stat:1,steal_mana:1,bonus_effect_if_slowed:1,discard_hand:1};
  var BUF={mana:1,draw_speed:1,shield:1,shield_stat:1,dodge:1,heal:1,draw_speed_permanent:1,draw_cards:1,mana_if_debuffed:1};
  var effects=(c.effects||[]).concat(c.onDiscard||[]);
  effects.forEach(function(e){
    if(DMG[e.type]) tags.push('damage');
    if(DEB[e.type]) tags.push('debuff');
    if(BUF[e.type]) tags.push('buff');
    if(e.type==='sorcery'&&e.type2){
      if(DMG[e.type2]) tags.push('damage');
      if(DEB[e.type2]) tags.push('debuff');
      if(BUF[e.type2]) tags.push('buff');
    }
  });
  var seen={}; tags=tags.filter(function(t){return seen[t]?false:(seen[t]=true);});
  if(!tags.length) tags=['unique'];
  return tags;
}

function buildTagsHTML(tags){
  return tags.map(function(tag){
    return '<span class="card-tag card-tag-'+tag+'" title="'+tag+'"></span>';
  }).join('');
}

// ── Stat-resolved card effect text ──────────────────────────────────
// Replaces stat formula tokens in effect strings with live values.
// When gs is available (combat), values are exact.
// When gs is null (deck editor, bestiary), values fall back to base stats or
// show the formula token styled in blue to signal it's dynamic.
//
// Tokens recognised:
//   {WIS}, {STR}, {AGI}           — current stat value
//   {WIS×N}, {STR×N}, {WIS÷N}    — stat arithmetic
//   {MANA_MISSING}                 — maxMana - mana (runtime only)
//   {HP_MISSING}                   — maxHp - hp (runtime only)
//   {DISCARD_COUNT}                — discard pile size (runtime only)
//   {HAND_COUNT}                   — hand size (runtime only)
//
// Usage: resolveCardEffect(effectLine, gs, statsOverride)
// statsOverride = {str,agi,wis} for deck editor preview
function resolveCardEffect(line, gameState, statsOverride){
  var s = gameState ? gameState.stats : (statsOverride || null);
  function sv(val){ return '<span class="stat-val">'+val+'</span>'; }

  var resolved = line
    .replace(/\b(WIS|STR|AGI)\s*[\u00d7x\*]\s*(\d+(?:\.\d+)?)/gi, function(m, stat, n){
      if(!s) return sv(m);
      var base = s[stat.toLowerCase()]||0;
      return sv(Math.round(base * parseFloat(n)));
    })
    .replace(/\b(WIS|STR|AGI)\s*[\u00f7\/]\s*(\d+)/gi, function(m, stat, n){
      if(!s) return sv(m);
      var base = s[stat.toLowerCase()]||0;
      return sv(Math.floor(base / parseFloat(n)));
    })
    .replace(/\b\+\s*(WIS|STR|AGI)\b/gi, function(m, stat){
      if(!s) return sv(m);
      return '+ '+sv(s[stat.toLowerCase()]||0);
    })
    .replace(/missing mana\s*[\u00f7\/]\s*(\d+)/gi, function(m, n){
      if(!gameState) return sv(m);
      var missing = (gameState.maxMana||0) - (gameState.mana||0);
      return sv(Math.floor(missing / parseInt(n)));
    })
    .replace(/missing HP\s*[\u00f7\/]\s*(\d+)/gi, function(m, n){
      if(!gameState) return sv(m);
      var missing = (gameState.playerMaxHp||0) - (gameState.playerHp||0);
      return sv(Math.floor(missing / parseInt(n)));
    })
    .replace(/discard pile\s*[\u00d7x\*]\s*(\d+)/gi, function(m, n){
      if(!gameState) return sv(m);
      return sv((gameState.discardPile||[]).length * parseInt(n));
    })
    .replace(/cards in hand\s*[\u00d7x\*]\s*(\d+)/gi, function(m, n){
      if(!gameState) return sv(m);
      return sv((gameState.hand||[]).length * parseInt(n));
    })
    // "Deal X damage per card in hand (min Y)"
    .replace(/Deal\s+(\d+)\s+damage per card in hand\s*\(min\s*(\d+)\)/gi, function(m, perCard, min){
      if(!gameState) return m;
      var handSize = (gameState.hand||[]).length;
      var total = Math.max(parseInt(min), handSize * parseInt(perCard));
      return 'Deal '+sv(total)+' damage';
    })
    .replace(/\b(WIS|STR|AGI)\b/g, function(m, stat){
      if(!s) return sv(m);
      return sv(s[stat.toLowerCase()]||0);
    })
    // "[Shield]" as a live value — resolves to current Shield HP
    .replace(/Destroy \[Shield\]/gi, function(m){
      if(!gameState) return m;
      var shieldVal = gameState.playerShield || 0;
      return 'Destroy ' + sv(shieldVal) + ' Shield';
    })
    .replace(/deal \[Shield\] additional damage/gi, function(m){
      if(!gameState) return m;
      var shieldVal = gameState.playerShield || 0;
      return 'deal ' + sv(shieldVal) + ' additional damage';
    });

  // Collapse "Deal X + Y damage" into "Deal Z damage" (resolved total in blue)
  resolved = resolved.replace(/Deal\s+(?:<span class="stat-val">)?(\d+)(?:<\/span>)?\s*\+\s*(?:<span class="stat-val">)?(\d+)(?:<\/span>)?\s*damage/gi, function(m, a, b){
    return 'Deal '+sv(parseInt(a)+parseInt(b))+' damage';
  });

  return resolved;
}
// ────────────────────────────────────────────────────────────────────

function buildCardHTML(id,isGhost){
  var c=CARDS[id];
  if(!c) c={name:id,icon:'?',type:'attack',unique:false,effect:'?',champ:null,statId:null,manaCost:0};
  var statCls=c.statId?'card-stat-'+c.statId:'card-stat-none';
  // Use dynamic text if actor available and card has effects array
  var mechanic;
  var playerActor = (typeof gs !== 'undefined' && gs && gs.actors) ? gs.actors.player : null;
  if(playerActor && c.effects){
    mechanic = generateCardTextHTML(playerActor, id, null);
  } else {
    var rawLines=(c.effect||'').split('\n');
    var resolvedLines=rawLines.map(function(line){ return resolveCardEffect(line, typeof gs!=='undefined'&&gs?gs:null, null); });
    mechanic=renderKeywords(resolvedLines.join('<div class="card-line-sep"></div>'));
  }
  var manaCost=c.manaCost!=null?c.manaCost:0;
  var fzStyle=cardEffectFontSize(c.effect||'');
  var tags=getCardTags(c);
  var tagsHTML=buildTagsHTML(tags);
  var identity=getCardIdentityLabel(c);
  return '<div class="card '+statCls+(isGhost?' ghost':'')+(id&&id.startsWith('ghost_')?' ghost':'')+'">'
    +(isGhost||id.startsWith('ghost_')?'<div class="ghost-badge"></div>':'')
    +'<div class="card-title">'+c.name+'</div>'
    +'<div class="card-identity">'+identity+'</div>'
    +'<div class="card-art">'
    +cardArtHTML(id, c.icon, manaCost, c.champ||null)
    +'</div>'
    +'<div class="card-effect" style="'+fzStyle+'">'+mechanic+'</div>'
    +'<div class="card-type-bar">'+tagsHTML+'</div>'
    +'</div>';
}


// Card art — tries assets/cards/backgrounds/{cardId}.png over the emoji icon
// ═══════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════
function maybeRenderHand(){
  var k=gs.hand.map(function(h){return h.id+(h.ghost?'g':'');}).join(',');
  var hasArriving = gs.hand.some(function(h){ return h._arriveAt && Date.now() >= h._arriveAt && h._arriveAt > Date.now() - 150; });
  if(k!==lastHandStr || hasArriving){
    gs.hand.forEach(function(h){
      if(h._arriveAt && Date.now() >= h._arriveAt){
        h._justArrived = true;
        delete h._arriveAt;
      }
    });
    renderHand();
  }
}

function renderHand(){
  lastHandStr=gs.hand.map(function(h){return h.id+(h.ghost?'g':'');}).join(',');
  var container=document.getElementById('hand-cards');
  container.innerHTML='';
  var total=gs.hand.length;
  gs.hand.forEach(function(item,i){
    var cd=CARDS[item.id];
    var isGhost=item.ghost||!!(item.id&&item.id.startsWith('ghost_'));
    var d=document.createElement('div');
    var statCls=cd&&cd.statId?'card-stat-'+cd.statId:'card-stat-none';
    var isSel=SETTINGS.confirm&&pendingConfirmIdx===i;
    var isNew=item._newDraw||false; if(isNew) delete item._newDraw;
    var isConjured=item._conjured||false;
    var notArrived = item._arriveAt && Date.now() < item._arriveAt;
    var justArrived = item._justArrived||false; if(justArrived) delete item._justArrived;
    d.className='card '+statCls+(isGhost?' ghost':'')+(isNew?' new-card':'')+(isSel?' selected-card':'')+(isConjured?' conjured-card':'')+(notArrived?' card-arriving':'')+(justArrived?' card-fadein':'');
    d.setAttribute('data-idx',i);

    // Fan transform — rotate and drop from centre, scaled for 158x220 cards
    var mid=(total-1)/2;
    var t=total>1?(i-mid)/mid:0;
    var rot=t*12;        // slightly tighter arc for bigger cards
    var drop=Math.abs(t)*16;
    d.style.cssText='transform:rotate('+rot+'deg) translateY('+drop+'px);transform-origin:bottom center;z-index:'+i+';position:relative;'+(i>0?'margin-left:-38px;':'');

    var cEffect = cd ? (cd.effect||'') : '';
    // Use dynamic text if card has effects array AND actor is available
    var mechanic;
    var playerActor = gs.actors && gs.actors.player;
    if(playerActor && cd && cd.effects && cd.effects.length){
      try {
        mechanic = generateCardTextHTML(playerActor, item.id, item);
      } catch(e){
        var rawLines = cEffect.split('\n');
        var resolvedLines = rawLines.map(function(line){ return resolveCardEffect(line, gs, null); });
        mechanic = renderKeywords(resolvedLines.join('<div class="card-line-sep"></div>'));
      }
    } else {
      var rawLines = cEffect.split('\n');
      var resolvedLines = rawLines.map(function(line){ return resolveCardEffect(line, gs, null); });
      if(item.critBonus){
        resolvedLines.push('<span style="color:#60c060;">+[Crit]: '+item.critBonus+'%</span>');
      }
      mechanic = renderKeywords(resolvedLines.join('<div class="card-line-sep"></div>'));
    }
    var fzStyle = cardEffectFontSize(cEffect);
    var manaCost=cd&&cd.manaCost!=null?cd.manaCost:0;
    var rTags=getCardTags(cd||{});
    var rTagsHTML=buildTagsHTML(rTags);
    var rIdentity=getCardIdentityLabel(cd||null);
    d.innerHTML=(isGhost?'<div class="ghost-badge"></div>':'')
      +'<div class="card-title">'+(cd?cd.name:item.id)+'</div>'
      +'<div class="card-identity">'+rIdentity+'</div>'
      +'<div class="card-art">'
      +cardArtHTML(item.id, cd?cd.icon:'?', manaCost, cd&&cd.champ?cd.champ:null)
      +'</div>'
      +'<div class="card-effect" style="'+fzStyle+'">'+mechanic+'</div>'
      +'<div class="card-type-bar">'+rTagsHTML+'</div>';

    // Hover — lift and straighten via JS (overrides static fan transform)
    d.addEventListener('mouseenter',function(){
      d.style.transform='rotate('+(rot*0.25)+'deg) translateY('+(drop-55)+'px)';
      d.style.zIndex='50';
    });
    d.addEventListener('mouseleave',function(){
      d.style.transform='rotate('+rot+'deg) translateY('+drop+'px)';
      d.style.zIndex=i;
    });

    // Click directly on card div (not delegated, avoids pointer-events issue)
    d.addEventListener('click',function(e){
      e.stopPropagation();
      var idx=parseInt(d.getAttribute('data-idx'),10);
      if(isNaN(idx)) return;
      if(SETTINGS.confirm){
        if(pendingConfirmIdx===idx){ pendingConfirmIdx=-1; playCard(idx); }
        else{ pendingConfirmIdx=idx; playSelectSfx(); renderHand(); }
      } else {
        playCard(idx);
      }
    });

    container.appendChild(d);
  });
  document.getElementById('hand-cnt').textContent=gs.hand.length;
}

function renderPiles(){
  var dc=gs.drawPool.length;
  document.getElementById('deck-cnt').textContent=dc;
  var disc=gs.discardPile.length;
  var discEl=document.getElementById('disc-cnt');
  var oldDisc=parseInt(discEl.textContent)||0;
  discEl.textContent=disc;
  // Bump animation when discard count increases
  if(disc>oldDisc){
    var pileEl=discEl.closest('.pile')||discEl.parentElement;
    if(pileEl){ pileEl.classList.remove('pile-bump'); void pileEl.offsetWidth; pileEl.classList.add('pile-bump'); }
  }
  // Show top discard card icon on the pile if available
  var topId=disc>0?gs.discardPile[gs.discardPile.length-1]:null;
  var topC=topId?CARDS[topId]:null;
  var discHint=document.getElementById('disc-hint-icon');
  if(discHint) discHint.textContent=topC?topC.icon:'';
}

// Shield overlay bar — renders as blue bar overlapping HP bar from the right.
// Shows shield as a layered "extra HP" bar, like fighting game multi-bars.
// Timer and shield amount shown centered in the blue section.
function updateShieldBar(prefix, shieldAmt, currentHp, maxHp){
  var bar = document.getElementById(prefix+'-shield-bar');
  var timer = document.getElementById(prefix+'-shield-timer');
  if(!bar) return;
  if(!shieldAmt || shieldAmt <= 0){
    bar.style.display = 'none';
    return;
  }
  bar.style.display = '';
  // Shield width proportional to maxHp — overlaps from the right
  var shieldPct = Math.min(100, (shieldAmt / maxHp) * 100);
  bar.style.width = shieldPct + '%';
  // Find shield timer from status effects
  var effects = prefix === 'p' ? (gs.statusEffects ? gs.statusEffects.player : []) : (gs.statusEffects ? gs.statusEffects.enemy : []);
  var remaining = 0;
  for(var i = 0; i < effects.length; i++){
    if(effects[i].id === 'shield' || effects[i].cls === 'shield' || effects[i].stat === 'shield'){
      remaining = effects[i].remaining || 0; break;
    }
  }
  if(timer){
    var secs = remaining > 0 ? Math.ceil(remaining / 1000) + 's' : '';
    timer.textContent = shieldAmt + (secs ? ' · ' + secs : '');
  }
}

function updateAll(){
  if(!gs) return;
  // Sync actors → gs fields (new system → old rendering)
  if(gs.actors && typeof syncActorsToGS === 'function') syncActorsToGS();
  var pPct=(gs.playerHp/gs.playerMaxHp)*100;
  var ePct=(gs.enemyHp/gs.enemyMaxHp)*100;
  var mPct=gs.maxMana>0?(gs.mana/gs.maxMana)*100:0;
  document.getElementById('p-hp-bar').style.width=pPct+'%';
  document.getElementById('e-hp-bar').style.width=ePct+'%';
  document.getElementById('p-hp-txt').textContent=gs.playerHp+'/'+gs.playerMaxHp;
  document.getElementById('e-hp-txt').textContent=gs.enemyHp+'/'+gs.enemyMaxHp;
  // Shield overlay bars — renders as blue extension past HP
  updateShieldBar('p', gs.playerShield, gs.playerHp, gs.playerMaxHp);
  updateShieldBar('e', gs.enemyShell||0, gs.enemyHp, gs.enemyMaxHp);
  updateTagTimers();
  document.getElementById('mana-bar2').style.width=mPct+'%';
  document.getElementById('mana-val').textContent=gs.mana+'/'+gs.maxMana;
  // Enemy mana bar
  var emPct=gs.enemyMaxMana>0?Math.min(100,Math.round((gs.enemyMana/gs.enemyMaxMana)*100)):0;
  var emBar=document.getElementById('e-mana-bar'); if(emBar) emBar.style.width=emPct+'%';
  var emVal=document.getElementById('e-mana-val'); if(emVal) emVal.textContent=(gs.enemyMana||0)+'/'+(gs.enemyMaxMana||0);
  var ch=getCreaturePlayable(gs.champId);
  // Hidden proxy
  if(ch.innateActive) document.getElementById('innate-btn').disabled=(!gs.running||gs.mana<ch.innateCost||gs._innCooldown>0);
  // Innate card: mana bar + ready glow
  if(ch.innateActive){
    var innateCard=document.getElementById('innate-card');
    var fill=document.getElementById('innate-mana-fill');
    var lbl=document.getElementById('innate-mana-lbl');
    var cost=ch.innateCost||1;
    var onCooldown = gs._innCooldown > 0;
    var manaPct=Math.min(100,Math.round((gs.mana/cost)*100));
    var ready=gs.running&&gs.mana>=cost&&!onCooldown;
    if(fill){
      if(onCooldown){
        // Show cooldown progress instead of mana
        var cdPct = Math.round((gs._innCooldown / (ch.innateCooldown||8000)) * 100);
        fill.style.width = (100 - cdPct) + '%';
        fill.className = 'innate-mana-fill cooldown';
      } else {
        fill.style.width=manaPct+'%';
        fill.className='innate-mana-fill'+(manaPct>=100?' full':'');
      }
    }
    if(lbl){
      if(onCooldown){
        lbl.textContent = (gs._innCooldown/1000).toFixed(1)+'s';
      } else {
        lbl.textContent=Math.min(gs.mana,cost)+' / '+cost;
      }
    }
    if(innateCard){
      innateCard.classList.toggle('ready',ready);
      innateCard.classList.toggle('on-cooldown',onCooldown);
      innateCard.style.cursor=ready?'pointer':'default';
    }
  }
  updateTopBar();
}
function updateTopBar(){
  if(!gs) return;
  document.getElementById('ts-str').textContent=gs.stats.str;
  document.getElementById('ts-agi').textContent=gs.stats.agi;
  document.getElementById('ts-wis').textContent=gs.stats.wis;
  var total=gs.drawPool.length+gs.discardPile.length+gs.hand.length;
  document.getElementById('ts-deck').textContent=total+'/'+gs.stats.str;
  document.getElementById('top-lv').textContent='Lv.'+gs.level+' · '+gs.xp+'/'+gs.xpNext;
  document.getElementById('xp-bar').style.width=((gs.xp/gs.xpNext)*100)+'%';
  document.getElementById('gold-d').innerHTML=goldImgHTML('16px')+' '+(PERSIST.gold+gs.goldEarned);
}

// ═══════════════════════════════════════════════════════
// PAUSE / SCREENS / OVERLAYS
// ═══════════════════════════════════════════════════════
function toggleCombatLog(){
  var sidebar=document.getElementById('combat-log-sidebar');
  if(sidebar) sidebar.classList.toggle('open');
}

function showBeginBattleModal(){
  if(!gs) return;
  var e=gs.enemies[gs.enemyIdx];
  if(!e){ startBattle(); return; }
  var modal=document.getElementById('begin-battle-modal');
  if(!modal){ startBattle(); return; }
  setCreatureImg(document.getElementById('bbm-enemy-icon'), e.id, e.icon||'👺', '200px');
  document.getElementById('bbm-enemy-name').textContent=e.name||'Enemy';
  document.getElementById('bbm-enemy-desc').textContent='HP: '+e.baseHp+' · Area: '+((gs.area&&gs.area.def&&gs.area.def.name)||'');
  var statsHtml='';
  ['str','agi','wis'].forEach(function(s){
    var cols={str:'#e07070',agi:'#70e0a0',wis:'#70a0e0'};
    statsHtml+='<div style="text-align:center;"><div style="font-family:Cinzel,serif;font-size:16px;color:'+cols[s]+';">'+e[s]+'</div><div style="font-size:7px;color:#5a4020;">'+s.toUpperCase()+'</div></div>';
  });
  document.getElementById('bbm-enemy-stats').innerHTML=statsHtml;
  var innateBlock=document.getElementById('bbm-innate-block');
  if(e.innate&&e.innate.name){
    document.getElementById('bbm-innate-name').textContent='✦ '+e.innate.name;
    document.getElementById('bbm-innate-desc').textContent=e.innate.desc||'';
    innateBlock.style.display='block';
  } else {
    innateBlock.style.display='none';
  }
  modal.style.display='flex';
}

function beginBattleFromModal(){
  var modal=document.getElementById('begin-battle-modal');
  if(modal) modal.style.display='none';
  startBattle();
}


function showScreen(id){ document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');}); document.getElementById(id).classList.add('active'); }
function hideOverlays(){
  ['victory-overlay'].forEach(function(id){document.getElementById(id).classList.remove('show');});
  var d=document.getElementById('defeat-overlay');
  d.classList.remove('show'); d.style.display='none';
  var t=document.getElementById('levelup-toast');
  if(t) t.style.display='none';
}

function addLog(msg,cls){
  if(SETTINGS.logd==='brief'&&(cls==='draw'||cls==='mana')) return;
  var feed=document.getElementById('log-area');
  if(!feed) return;
  var icons={dmg:'⚔️',heal:'💚',buff:'✨',debuff:'🔥',draw:'🃏',mana:'🔷',innate:'⚡',sys:'✦'};
  var icon=icons[cls]||'·';
  var entry=document.createElement('div');
  entry.className='log-entry '+(cls||'');
  entry.innerHTML='<span class="log-entry-icon">'+icon+'</span><span class="log-entry-text">'+msg+'</span>';
  feed.appendChild(entry);
  feed.scrollTop=feed.scrollHeight;
  // Cap log at 120 entries
  while(feed.children.length>120) feed.removeChild(feed.firstChild);
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
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
    unlocked:true, defaultCap:16,
  },
  adventurers_hall: {
    id:'adventurers_hall', name:"Adventurer's Hall", icon:'⚐', sprite:'guild_girl', buildingIcon:'hall',
    npc:{name:'Leona', title:'Guild Girl', greeting:'Welcome back! I mean... good to see you. Professionally.', pitch:1.5},
    desc:'Quests, bounties, and expedition dispatch.',
    unlocked:false,
  },
  bestiary: {
    id:'bestiary', name:'The Bestiary', icon:'📖', sprite:'hoot', buildingIcon:'bestiary',
    npc:{name:'Hoot', title:'Archivist', pitch:1.4, greeting:'Oh! You\'re back. Did you... see anything new out there?'},
    desc:'Records of every creature encountered. Claim discovery rewards.',
    unlocked:false,
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
    npc:{name:'???', title:'Sanctum Keeper', greeting:'Your champions await.'},
    desc:'Champion management. Edit decks, equip relics, ascend.',
    unlocked:false,
  },
  market: {
    id:'market', name:'The Market', icon:'🛒', sprite:'market_keeper', buildingIcon:'market',
    npc:{name:'???', title:'Merchant', greeting:'Take a look at my wares.'},
    desc:'Buy chests and supplies with gold.',
    unlocked:false,
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
  updateNavBar('town');
  document.getElementById('town-gold').textContent='✦ '+PERSIST.gold;
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
      document.getElementById('town-gold').textContent='✦ '+PERSIST.gold;
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
    document.getElementById('town-gold').textContent='✦ '+PERSIST.gold;
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
      return !PERSIST.town.quests || !PERSIST.town.quests.active;
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
};

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
    'Did you know that Squanchbacks can curl into a perfect sphere? Fascinating.',
    'I made tea. It went cold. I forgot about it. ...Want some?',
    'Every creature tells a story. I just... write them down.',
    'The archives are quiet today. I like quiet. Mostly.',
    'Hoo. Where were we? Oh, right. Creatures.',
  ],
};

var NPC_RARE_LINES = {
  vault: {chance:0.08, lines:['I didn\'t shteal anything.']},
  adventurers_hall: {chance:0.08, lines:[LEONA_RARE]},
  bestiary: {chance:0.08, lines:['Sometimes I dream about creatures I\'ve never seen. Is that weird? ...Don\'t answer that.']},
};

var NPC_VERY_RARE_LINES = {
  vault: {chance:0.02, lines:[
    '...Sometimes I talk to the materials. They don\'t answer. That is normal.',
    'Do you ever wonder if the shelves judge us? No? ...Me neither.',
  ]},
  bestiary: {chance:0.02, lines:[
    'I once tried to catalogue myself. It got... existential.',
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
  } else if(_hallTab === 'expeditions'){
    inner.innerHTML = _renderExpeditionsTab();
  } else if(_hallTab === 'achievements'){
    inner.innerHTML = _renderAchievementsTab();
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
  var quests = PERSIST.town.quests || {offered:[], active:null, completed:[]};

  // If no quests offered yet, generate some
  if(!quests.offered || quests.offered.length === 0){
    quests.offered = _generateBounties(3);
    PERSIST.town.quests = quests;
    savePersist();
  }

  var html = '<div class="hall-quest-grid">';

  quests.offered.forEach(function(q, idx){
    var isActive = quests.active && quests.active.id === q.id;
    var isComplete = isActive && quests.active.progress >= q.target;
    var progress = isActive ? quests.active.progress : 0;
    var pct = Math.min(100, Math.round((progress / q.target) * 100));

    var cls = 'hall-quest-card' + (isComplete ? ' complete' : isActive ? ' active' : '');
    html += '<div class="' + cls + '">';

    // Stamp
    if(isComplete) html += '<div class="hall-quest-stamp complete-stamp">COMPLETE</div>';
    else if(isActive) html += '<div class="hall-quest-stamp active-stamp">ACTIVE</div>';

    // Content
    html += '<div class="hall-quest-title">' + q.title + '</div>';
    html += '<div class="hall-quest-issuer">issued by ' + (q.issuer || 'Leona') + '</div>';
    html += '<div class="hall-quest-desc">' + q.desc + '</div>';

    // Difficulty dots
    html += '<div class="hall-quest-difficulty">';
    for(var d = 0; d < 5; d++) html += '<div class="hall-quest-dot' + (d < q.difficulty ? '' : ' empty') + '"></div>';
    html += '</div>';

    // Progress (if active or complete)
    if(isActive || isComplete){
      html += '<div class="hall-quest-progress"><div class="hall-quest-progress-fill' + (isComplete ? ' complete' : '') + '" style="width:' + pct + '%"></div></div>';
      html += '<div class="hall-quest-progress-txt">' + progress + ' / ' + q.target + '</div>';
    }

    // Rewards
    html += '<div class="hall-quest-rewards">';
    (q.rewards || []).forEach(function(r){
      html += '<div class="hall-reward-chip">' + (r.icon || '✦') + ' ' + r.amount + ' ' + (r.label || r.type) + '</div>';
    });
    html += '</div>';

    // Button
    if(isComplete){
      html += '<button class="hall-quest-btn claim" onclick="claimQuest()">CLAIM REWARD</button>';
    } else if(isActive){
      html += '<button class="hall-quest-btn" onclick="abandonQuest()" style="border-color:#5a3020;color:#8a5030;">ABANDON</button>';
    } else if(!quests.active){
      html += '<button class="hall-quest-btn" onclick="acceptQuest(' + idx + ')">ACCEPT</button>';
    } else {
      html += '<div style="font-size:8px;color:#6a5030;text-align:center;padding:4px;">Complete active quest first</div>';
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
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
  var maxSlots = Math.min(slots.length, 1 + Math.floor((hallLv - 1) / 2)); // 1 at lv2, 2 at lv4, 3 at lv6

  var html = '<div class="hall-exp-grid">';

  for(var i = 0; i < slots.length; i++){
    var slot = slots[i];
    var isLocked = i >= maxSlots;

    if(isLocked){
      html += '<div class="hall-exp-slot locked">'
        +'<div class="hall-exp-empty-prompt">'
        +'<div class="plus">🔒</div>'
        +'<div class="label">HALL Lv.' + (2 + i * 2) + ' TO UNLOCK</div>'
        +'</div></div>';
      continue;
    }

    if(!slot.champId){
      // Empty slot
      html += '<div class="hall-exp-slot empty">'
        +'<div class="hall-exp-empty-prompt">'
        +'<div class="plus">+</div>'
        +'<div class="label">SEND CHAMPION</div>'
        +'</div>'
        +'<button class="hall-exp-btn send" onclick="startExpeditionFlow(' + i + ')">DISPATCH →</button>'
        +'</div>';
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
    var champIcon = champ ? champ.icon : '?';
    var area = AREA_DEFS.find(function(a){ return a.id === slot.areaId; });
    var areaName = area ? area.name : slot.areaId;

    var slotCls = 'hall-exp-slot ' + (isComplete ? 'complete' : 'active');
    html += '<div class="' + slotCls + '">';
    html += '<div class="hall-exp-slot-header">';
    html += '<div class="hall-exp-champ-icon"><img src="assets/creatures/' + slot.champId + '.png" onerror="this.outerHTML=\'' + champIcon + '\'"></div>';
    html += '<div class="hall-exp-info">';
    html += '<div class="hall-exp-name">' + champName + '</div>';
    html += '<div class="hall-exp-area">▸ ' + areaName + '</div>';
    html += '<div class="hall-exp-type">' + (slot.type || 'Scout') + ' · ' + _formatMs(total) + '</div>';
    html += '</div></div>';

    // Timer
    html += '<div class="hall-exp-timer"><div class="hall-exp-timer-fill' + (isComplete ? ' complete' : '') + '" style="width:' + pct + '%"></div></div>';
    html += '<div class="hall-exp-time-txt">' + (isComplete ? 'READY TO COLLECT' : 'Returning in ' + timeStr) + '</div>';

    // Button
    if(isComplete){
      html += '<button class="hall-exp-btn collect" onclick="collectExpedition(' + i + ')">COLLECT</button>';
    } else {
      html += '<button class="hall-exp-btn" onclick="recallExpedition(' + i + ')">RECALL EARLY</button>';
    }
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

function acceptQuest(idx){
  var quests = PERSIST.town.quests;
  if(quests.active) return;
  var q = quests.offered[idx];
  if(!q) return;
  quests.active = {id:q.id, progress:0};
  savePersist();
  _renderHallContent();
}

function abandonQuest(){
  PERSIST.town.quests.active = null;
  savePersist();
  _renderHallContent();
}

function claimQuest(){
  var quests = PERSIST.town.quests;
  if(!quests.active) return;
  var q = quests.offered.find(function(o){ return o.id === quests.active.id; });
  if(!q) return;
  // Grant rewards
  (q.rewards || []).forEach(function(r){
    if(r.type === 'gold') PERSIST.gold += r.amount;
    else if(r.type === 'soul_shards') PERSIST.soulShards += r.amount;
    else if(r.type === 'material' && r.id) PERSIST.town.materials[r.id] = (PERSIST.town.materials[r.id]||0) + r.amount;
  });
  // Remove from offered, mark complete
  quests.offered = quests.offered.filter(function(o){ return o.id !== quests.active.id; });
  quests.completed.push(quests.active.id);
  quests.active = null;
  // Refill if needed
  while(quests.offered.length < 3){
    var more = _generateBounties(1);
    quests.offered = quests.offered.concat(more);
  }
  savePersist();
  _renderHallContent();
}

// Expedition stubs — to be fully implemented
function startExpeditionFlow(slotIdx){ alert('Expedition dispatch flow coming soon. Slot: ' + slotIdx); }
function collectExpedition(slotIdx){ alert('Collect expedition coming soon. Slot: ' + slotIdx); }
function recallExpedition(slotIdx){ alert('Recall expedition coming soon. Slot: ' + slotIdx); }

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
  document.getElementById('bestiary-creatures-pane').style.display=tab==='creatures'?'':'none';
  document.getElementById('bestiary-locations-pane').style.display=tab==='locations'?'flex':'none';
  document.getElementById('bestiary-glossary-pane').style.display=tab==='glossary'?'':'none';
  if(tab==='glossary') buildBestiaryGlossary();
}

function buildBestiaryGlossary(){
  var grid=document.getElementById('bestiary-glossary-grid');
  if(!grid) return;
  grid.innerHTML='';

  var header=document.createElement('div');
  header.style.cssText='font-size:8px;color:#7a6030;margin-bottom:10px;line-height:1.6;';
  header.textContent='Keywords appear on cards as coloured tags. Hover a keyword in-game to see its definition.';
  grid.appendChild(header);

  var statSection=document.createElement('div');
  statSection.style.cssText='margin-bottom:12px;';
  statSection.innerHTML='<div style="font-family:Cinzel,serif;font-size:9px;color:#d4a843;margin-bottom:6px;border-bottom:1px solid #2a1808;padding-bottom:3px;">CARD IDENTITY</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'
    +'<div style="display:flex;align-items:center;gap:4px;"><div style="width:3px;height:16px;background:#c0392b;border-radius:1px;"></div><span style="font-size:8px;color:#c09030;">STR — Survival, shields, HP</span></div>'
    +'<div style="display:flex;align-items:center;gap:4px;"><div style="width:3px;height:16px;background:#27ae60;border-radius:1px;"></div><span style="font-size:8px;color:#c09030;">AGI — Speed, draw, dodge</span></div>'
    +'<div style="display:flex;align-items:center;gap:4px;"><div style="width:3px;height:16px;background:#2980b9;border-radius:1px;"></div><span style="font-size:8px;color:#c09030;">WIS — Mana, buffs, debuffs</span></div>'
    +'</div>';
  grid.appendChild(statSection);

  var kwHeader=document.createElement('div');
  kwHeader.style.cssText='font-family:Cinzel,serif;font-size:9px;color:#d4a843;margin-bottom:6px;border-bottom:1px solid #2a1808;padding-bottom:3px;';
  kwHeader.textContent='STATUS KEYWORDS';
  grid.appendChild(kwHeader);

  Object.keys(KEYWORDS).forEach(function(word){
    var kw=KEYWORDS[word];
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #160a00;';
    row.innerHTML='<span class="kw kw-'+kw.cls+'" style="flex-shrink:0;font-size:8px;">'+word+'</span>'
      +'<span style="font-size:8px;color:#8a6040;line-height:1.5;">'+kw.def+'</span>';
    grid.appendChild(row);
  });
}

function refreshBestiaryPanel(){
  showLockedBuildingUI('bestiary');
  var b=PERSIST.town.buildings.bestiary;
  if(!b.unlocked) return;
  buildBestiaryCreatures();
  buildBestiaryLocations();
}

function getBestiaryResearch(id){
  // Seen enemies are "fully known" from encounters
  if(PERSIST.seenEnemies.indexOf(id)!==-1) return 100;
  return PERSIST.bestiary.research[id]||0;
}

function buildBestiaryCreatures(){
  var grid=document.getElementById('bestiary-creature-grid');
  if(!grid) return;
  grid.innerHTML='';
  var allIds=Object.keys(CREATURES);

  allIds.forEach(function(id){
    var e=CREATURES[id];
    var res=getBestiaryResearch(id);
    var isSeen=res>=100;
    var kills=PERSIST.achievements[id+'_kill']||0;
    var isMastered=PERSIST.unlockedChamps.indexOf(id)!==-1;

    var card=document.createElement('div');
    card.className='bc-card'+(res===0?' bc-unknown':isMastered?' bc-mastered':isSeen?' bc-seen':'')+(id===_bestiarySelected?' bc-selected':'');

    var iconHtml, nameHtml, extraHtml='';

    if(isSeen){
      // Fully known — show icon and name
      iconHtml='<div class="bc-icon-wrap">'+creatureImgHTML(id, e.icon, '44px')+'</div>';
      nameHtml='<div class="bc-card-name" style="color:'+(isMastered?'#d4a843':'#c0a060')+'">'+e.name+'</div>';
      extraHtml='<div class="bc-card-kills">⚔ '+kills+'</div>';
    } else if(res>=BRES.NAME){
      // Name known but not fully seen
      iconHtml='<div class="bc-icon-wrap">'+creatureImgHTML(id, e.icon, '44px')+'</div>';
      nameHtml='<div class="bc-card-name" style="color:#7a5020;">'+e.name+'</div>';
      extraHtml='<div class="bc-res-bar-wrap"><div class="bc-res-bar" style="width:'+res+'%"></div></div>';
    } else if(res>=BRES.ICON){
      // Icon known, name hidden
      iconHtml='<div class="bc-icon-wrap">'+creatureImgHTML(id, e.icon, '44px')+'</div>';
      nameHtml='<div class="bc-card-name hidden">???</div>';
      extraHtml='<div class="bc-res-bar-wrap"><div class="bc-res-bar" style="width:'+res+'%"></div></div>';
    } else if(res>0){
      // Some research — just show ? with bar
      iconHtml='<div class="bc-unknown-icon">?</div>';
      nameHtml='<div class="bc-card-name hidden">???</div>';
      extraHtml='<div class="bc-res-bar-wrap"><div class="bc-res-bar" style="width:'+res+'%"></div></div>';
    } else {
      // Nothing known
      iconHtml='<div class="bc-unknown-icon" style="opacity:.3;">?</div>';
      nameHtml='<div class="bc-card-name hidden">???</div>';
    }

    card.innerHTML=iconHtml+nameHtml+extraHtml;

    if(isSeen||(res>=BRES.NAME)){
      (function(eid){ card.onclick=function(){ selectBestiaryCreature(eid); }; })(id);
    }
    grid.appendChild(card);
  });

  renderBestiaryDetail(_bestiarySelected);
}

function selectBestiaryCreature(id){
  _bestiarySelected=id;
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
  var res=getBestiaryResearch(id);
  var isSeen=res>=100||PERSIST.seenEnemies.indexOf(id)!==-1;
  var kills=PERSIST.achievements[id+'_kill']||0;
  var isMastered=PERSIST.unlockedChamps.indexOf(id)!==-1;

  var showStats  = isSeen||(res>=BRES.ICON);
  var showInnate = isSeen||(res>=BRES.INNATE);
  var showCards  = isSeen||(res>=BRES.DECK_CARD);
  var showLore   = isSeen||(res>=BRES.NAME);
  var showAreas  = isSeen||(res>=BRES.NAME);

  var areas=getCreatureAreas(id);
  var html='';

  // ── Art header ──
  var killColor=kills>100?'#d4a843':kills>10?'#c09030':'#7a5020';
  html+='<div class="bcd-header">'
    +'<div class="bcd-portrait">'+creatureImgHTML(id,e.icon,'100px')+'</div>'
    +'<div class="bcd-header-info">'
      +'<div class="bcd-name">'+e.name+'</div>'
      +(isMastered?'<div class="bcd-unlocked">★ CHAMPION UNLOCKED</div>':'')
      +'<div class="bcd-kills" style="color:'+killColor+';">⚔ '+kills+' defeated</div>'
      // Location tags with ↗ links
      +(showAreas&&areas.length
        ?'<div class="bcd-areas">'+areas.map(function(a){
            return '<span class="bcd-area-tag" onclick="openLocationInBestiary(\''+a.id+'\')" title="View location">'+a.icon+' '+a.name+' <span class="bcd-area-arrow">↗</span></span>';
          }).join('')+'</div>'
        :'')
    +'</div>'
    +'</div>';

  // ── Stats ──
  if(showStats){
    var maxHp=calcHp(e.baseStats.str);
    var atkSec=(e.atkInterval||Math.round(2000/(1+e.baseStats.agi*0.05)))/1000;
    var manaMax=Math.round(e.baseStats.wis*8+40);
    html+='<div class="bcd-section-label">COMBAT STATS</div>'
      +'<div class="bcd-stat-row">'
        +'<div class="bcd-stat"><div class="bcd-stat-val str">'+e.baseStats.str+'</div><div class="bcd-stat-lbl">STR</div><div class="bcd-stat-sub">'+maxHp+' HP</div></div>'
        +'<div class="bcd-stat"><div class="bcd-stat-val agi">'+e.baseStats.agi+'</div><div class="bcd-stat-lbl">AGI</div><div class="bcd-stat-sub">'+atkSec.toFixed(1)+'s</div></div>'
        +'<div class="bcd-stat"><div class="bcd-stat-val wis">'+e.baseStats.wis+'</div><div class="bcd-stat-lbl">WIS</div><div class="bcd-stat-sub">'+manaMax+' MP</div></div>'
      +'</div>';
  } else {
    html+='<div class="bcd-section-label">COMBAT STATS</div>'
      +'<div class="bcd-unknown-block">Observe this creature in combat to reveal its stats.</div>';
  }

  // ── Lore ──
  if(showLore&&e.lore){
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-section-label">FIELD NOTES</div>'
      +'<div class="bcd-lore">'+e.lore+'</div>';
  } else if(res>0&&!showLore){
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-lore bcd-unknown-text">Research further to uncover field notes on this creature.</div>';
  }

  // ── Innate ──
  if(showInnate&&e.innate){
    var hidden=e.innate.hidden&&!kills;
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-section-label">INNATE ABILITY</div>'
      +'<div class="bcd-innate">'
        +'<div class="bcd-innate-name">◆ '+(hidden?'???':e.innate.name)+'</div>'
        +'<div class="bcd-innate-desc">'+(hidden?'Defeat this creature to reveal its innate ability.':e.innate.desc)+'</div>'
      +'</div>';
  } else if(showStats&&e.innate){
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-section-label">INNATE ABILITY</div>'
      +'<div class="bcd-unknown-block">Research further to reveal this innate ability.</div>';
  }

  // ── Cards ──
  if(showCards&&(e.deck||[]).length){
    var visible=isSeen?(e.deck||[]).slice()
      :(e.deck||[]).slice(0,Math.max(1,Math.ceil(((res-BRES.DECK_CARD)/(BRES.INNATE-BRES.DECK_CARD))*(e.deck||[]).length)));
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-section-label">KNOWN CARDS</div>'
      +'<div class="bcd-card-list">';
    visible.forEach(function(c){
      html+='<div class="bcd-card-entry"><span class="bcd-card-name">'+c.name+'</span><span class="bcd-card-copies">×'+c.copies+'</span></div>';
    });
    var rem=(e.deck||[]).length-visible.length;
    if(rem>0) html+='<div class="bcd-card-more">+ '+rem+' card'+(rem!==1?'s':'')+' not yet observed</div>';
    html+='</div>';
  } else if(showStats&&(e.deck||[]).length){
    html+='<div class="bcd-divider"></div>'
      +'<div class="bcd-section-label">KNOWN CARDS</div>'
      +'<div class="bcd-unknown-block">Research further to identify cards.</div>';
  }

  // ── Research / catalogued status ──
  html+='<div class="bcd-divider"></div>';
  if(!isSeen&&res>0){
    html+='<div class="bcd-section-label">RESEARCH</div>'
      +'<div class="bcd-res-bar-wrap"><div class="bcd-res-bar" style="width:'+res+'%"></div></div>'
      +'<div class="bcd-res-pct">'+Math.round(res)+'% catalogued</div>';
  } else if(isSeen){
    html+='<div class="bcd-catalogued'+(isMastered?' bcd-mastered-txt':'')+'">'+
      (isMastered?'★ FULLY CATALOGUED & UNLOCKED':'✓ FULLY CATALOGUED')+'</div>';
  }

  panel.innerHTML=html;
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

  // Build three-column layout if not already built
  if(!document.getElementById('loc-list')){
    pane.style.cssText='display:flex;flex-direction:row;flex:1;min-height:0;overflow:hidden;max-height:none;';
    pane.innerHTML=
      '<div class="loc-list" id="loc-list"></div>'+
      '<div class="loc-detail" id="loc-detail"><div class="loc-empty">Select a location</div></div>'+
      '<div class="loc-creatures-col" id="loc-creatures-col"></div>';
  }

  _renderLocList();
  if(!_locSelected){
    // Auto-select first explored area
    var first = AREA_DEFS.find(function(a){ return (PERSIST.areaRuns[a.id]||0)>0; });
    if(first) _locSelected = first.id;
  }
  _renderLocDetail(_locSelected);
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
      (function(id){ item.onclick=function(){ _locSelected=id; _renderLocList(); _renderLocDetail(id); }; })(area.id);
    }
    list.appendChild(item);
  });
}

function _renderLocDetail(areaId){
  var detail   = document.getElementById('loc-detail');
  var creatCol = document.getElementById('loc-creatures-col');
  if(!detail||!creatCol) return;

  if(!areaId){
    detail.innerHTML='<div class="loc-empty">Select a location</div>';
    creatCol.innerHTML='';
    return;
  }

  var area = AREA_DEFS.find(function(a){ return a.id===areaId; });
  if(!area){ detail.innerHTML=''; creatCol.innerHTML=''; return; }

  var rawRuns = PERSIST.areaRuns[areaId]||0;
  var effRuns = getEffectiveRuns(areaId);

  if(rawRuns === 0){
    detail.innerHTML=
      '<div class="loc-fog-art" style="background:'+area.bg+';">'
        +'<div class="loc-fog-icon">🌫</div>'
      +'</div>'
      +'<div class="loc-lore-body">'
        +'<div class="loc-lore-text" style="color:#2a1808;font-style:italic;">This area has not been explored. Venture here to reveal its secrets.</div>'
      +'</div>';
    creatCol.innerHTML='<div class="loc-cr-label">INHABITANTS</div><div class="loc-cr-list"><div style="font-size:8px;color:#2a1808;padding:8px;font-style:italic;">Explore this area to discover what lives here.</div></div>';
    return;
  }

  // Art panel — uses area bg colour + large faded icon
  var threatHtml = effRuns>=AREA_INTEL.THREAT_NOTES && THREAT_NOTES[areaId]
    ? '<div class="loc-threat"><span class="loc-threat-label">FIELD NOTES</span> '+THREAT_NOTES[areaId]+'</div>' : '';

  var loreHtml = area.lore
    ? area.lore.split('\n\n').map(function(p){ return '<p>'+p+'</p>'; }).join('')
    : '<p style="color:#3a2810;font-style:italic;">'+area.theme+'</p>';

  var runsNote = rawRuns+' run'+(rawRuns!==1?'s':'')+' completed';
  var totalKills = (area.enemyPool||[]).reduce(function(s,id){
    return s+(PERSIST.achievements[id+'_kill']||0);
  }, 0);

  detail.innerHTML=
    '<div class="loc-art-panel" id="loc-art-panel-img" style="background:'+area.bg+';">'
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
        +'<span class="loc-run-note">'+runsNote+'</span>'
        +(totalKills?' &nbsp;·&nbsp; <span class="loc-kill-note">'+totalKills+' creatures defeated</span>':'')
      +'</div>'
    +'</div>';

  // Load background image, fall back to default.png, hide fade icon when image is present
  (function(id){
    function applyLocBg(src){
      var panel = document.getElementById('loc-art-panel-img');
      var fadeIcon = document.getElementById('loc-art-fade-icon');
      if(!panel) return;
      panel.style.backgroundImage    = 'url('+src+')';
      panel.style.backgroundSize     = 'cover';
      panel.style.backgroundPosition = 'center center';
      if(fadeIcon) fadeIcon.style.display = 'none';
    }
    var src = 'assets/backgrounds/'+id+'.png';
    var img = new Image();
    img.onload  = function(){ applyLocBg(src); };
    img.onerror = function(){
      var def = new Image();
      def.onload  = function(){ applyLocBg('assets/backgrounds/default.png'); };
      def.onerror = function(){ /* keep solid colour fallback */ };
      def.src = 'assets/backgrounds/default.png';
    };
    img.src = src;
  })(area.id);

  // Creature column
  var pool = (area.enemyPool||[]).filter(function(v,i,a){ return a.indexOf(v)===i; });
  var crHTML = '<div class="loc-cr-label">INHABITANTS</div><div class="loc-cr-list">';
  pool.forEach(function(id){
    var c = CREATURES[id];
    var seen = PERSIST.seenEnemies.indexOf(id)!==-1;
    var kills = PERSIST.achievements[id+'_kill']||0;
    if(seen && c){
      crHTML += '<div class="loc-cr-entry" onclick="openCreatureFromLocation(\''+id+'\')">'
        +'<div class="loc-cr-art">'+creatureImgHTML(id,c.icon,'24px')+'</div>'
        +'<div class="loc-cr-info">'
          +'<div class="loc-cr-name">'+c.name+'</div>'
          +(kills?'<div class="loc-cr-kills">'+kills+' defeated</div>':'<div class="loc-cr-kills">Encountered</div>')
        +'</div>'
        +'<div class="loc-cr-link">↗</div>'
        +'</div>';
    } else {
      crHTML += '<div class="loc-cr-entry loc-cr-unknown">'
        +'<div class="loc-cr-art loc-cr-art-unknown">?</div>'
        +'<div class="loc-cr-info">'
          +'<div class="loc-cr-name" style="color:#2a1808;">???</div>'
          +'<div class="loc-cr-kills">not yet encountered</div>'
        +'</div>'
        +'</div>';
    }
  });
  crHTML += '</div>';
  creatCol.innerHTML = crHTML;
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

  // Fragment count
  var fragEl=document.getElementById('sanctum-frag-count');
  if(fragEl) fragEl.textContent=getFragmentCount();

  // gem slot UI removed
  var slotCard=null;

  // Champion selector tabs (vertical list)
  var tabs=document.getElementById('sanctum-champ-tabs');
  if(tabs){
    var champIds=PERSIST.unlockedChamps.filter(function(id){return !!CREATURES[id];});
    if(!_sanctumChamp||champIds.indexOf(_sanctumChamp)===-1) _sanctumChamp=champIds[0]||'druid';
    tabs.innerHTML='';
    champIds.forEach(function(id){
      var ch=CREATURES[id];
      var btn=document.createElement('button');
      btn.className='sanctum-champ-btn'+(id===_sanctumChamp?' active':'');
      btn.innerHTML='<span style="font-size:18px;">'+(ch?ch.icon:'?')+'</span>'
        +'<span style="font-size:8px;color:#c09030;font-family:Cinzel,serif;margin-top:2px;">'+(ch?ch.name.split(' ')[0]:id)+'</span>';
      btn.onclick=(function(cid){ return function(){ _sanctumChamp=cid; refreshSanctumPanel(); }; })(id);
      tabs.appendChild(btn);
    });
  }

  setSanctumTab(_sanctumTab, true);
}

function setSanctumTab(tab, skipRefresh){
  _sanctumTab=tab;
  ['overview','deck','relics','upgrades','training'].forEach(function(t){
    var btn=document.getElementById('stab-'+t);
    var pane=document.getElementById('sanctum-'+t+'-pane');
    if(btn) btn.className='sanctum-tab'+(t===tab?' active':'');
    if(pane){ pane.style.display=t===tab?'flex':'none'; pane.style.flexDirection='column'; }
  });
  if(tab==='overview') buildSanctumOverviewPane();
  else if(tab==='deck'){ buildSanctumDeckPane(); showTutorial('sanctum_deck_edit'); }
  else if(tab==='relics') buildSanctumRelicsPane();
  else if(tab==='upgrades') buildSanctumUpgradesPane();
  else if(tab==='training') buildSanctumTrainingPane();
}

// ── RELICS PANE ────────────────────────────────────────────────────
function buildSanctumRelicsPane(){
  var champId = _sanctumChamp; if(!champId) return;
  var ch = CREATURES[champId];
  var cp = getChampPersist(champId);
  var equipped = getEquippedRelics(champId);
  var slots = getRelicSlotCount(champId);
  var ascLevel = getAscensionLevel(champId);
  var nextAsc = ASCENSION_TIERS[ascLevel];
  var tc = {base:'#777',ruby:'#c0392b',emerald:'#27ae60',sapphire:'#2980b9',turquoise:'#17a589',amethyst:'#8e44ad'};

  // Compute relic stat bonuses for this champion (simulating applyRelics)
  var bonuses = {str:0, agi:0, wis:0};
  var relicStatMap = {}; // stat -> [relicId, ...]
  equipped.forEach(function(relicId){
    var r = RELICS[relicId]; if(!r||!r.apply) return;
    var fake = {stats:{str:0,agi:0,wis:0},maxMana:0,manaRegen:0,playerMaxHp:0,playerHp:0,maxHand:5,
      _relicFirstCardBonus:false,_relicFirstCardUsed:false,_relicThorns:0,_relicManaRegenMult:1,
      _relicPoisonDptBonus:0,_relicPoisonTickMult:1,_relicBurnDurBonus:0,_relicDebuffDurBonus:0,
      _relicSorceryCostReduction:0,_relicCritMult:null};
    try{ r.apply(fake); }catch(e){}
    ['str','agi','wis'].forEach(function(s){
      if(fake.stats[s]>0){
        bonuses[s]+=fake.stats[s];
        if(!relicStatMap[s]) relicStatMap[s]=[];
        relicStatMap[s].push(relicId);
      }
    });
  });

  // ── STATS COLUMN ──
  var statsEl = document.getElementById('sr-stats-col');
  if(statsEl){
    var statsHTML = '<div class="tp-section-label" style="margin-bottom:4px;">STATS</div>';
    ['str','agi','wis'].forEach(function(s){
      var base = cp.stats[s]; var bonus = bonuses[s];
      var bonusSources = relicStatMap[s]||[];
      statsHTML += '<div class="sr-stat" id="sr-stat-'+s+'">'
        +'<div class="sr-stat-name">'+s.toUpperCase()+'</div>'
        +'<div class="sr-stat-vals">'
          +'<span class="sr-stat-base">'+base+'</span>'
          +(bonus>0?'<span class="sr-stat-bonus" '
            +'onmouseenter="srHoverBonus(\''+s+'\','+JSON.stringify(bonusSources)+')" '
            +'onmouseleave="srUnhoverBonus()">+'+bonus+'</span>':'')
        +'</div>'
        +(bonus>0?'<div class="sr-stat-hint">= '+(base+bonus)+' this run</div>':'<div class="sr-stat-hint">no bonus</div>')
        +'</div>';
    });
    // Level block
    var xpPct = Math.min(100,Math.round((cp.xp/cp.xpNext)*100));
    statsHTML += '<div class="sr-lv-block">'
      +'<div class="sr-lv-n">Lv '+cp.level+'</div>'
      +'<div class="sr-lv-bg"><div class="sr-lv-bar" style="width:'+xpPct+'%"></div></div>'
      +'<div class="sr-lv-xp">'+cp.xp+' / '+cp.xpNext+' XP</div>'
      +'<div class="sr-pip-row">'
        +'<span style="font-family:\'Cinzel\',serif;font-size:6px;color:#7a5020;letter-spacing:.4px;">'+(ascLevel>0?ASCENSION_TIERS[ascLevel-1].tier.toUpperCase():'BASE')+'</span>';
    for(var pi=0;pi<5;pi++){
      statsHTML += '<div class="sr-pip'+(pi<ascLevel?' f':pi===ascLevel?' u':'')+'"></div>';
    }
    statsHTML += '</div></div>';
    statsEl.innerHTML = statsHTML;
  }

  // ── HERO COLUMN ──
  var heroEl = document.getElementById('sr-hero-col');
  if(heroEl){
    // Build portrait — uses creature image or emoji
    var portraitInner = creatureImgHTML(champId, ch.icon, '100px', '');

    // Build slots row — 8 slots total
    var slotsHTML = '';
    for(var si=0;si<8;si++){
      var isEquipped = si < equipped.length;
      var isUnlocked = si < slots;
      var isEmpty = isUnlocked && !isEquipped;
      var isLast = si === 7;
      var cls = isEquipped?'eq' : isEmpty?'ue' : isLast?'lk8':'lk';
      var relicObj = isEquipped ? RELICS[equipped[si]] : null;
      slotsHTML += '<div class="sr-slot '+cls+'" id="sr-slot-'+si+'"'
        +(isEquipped?' onclick="srClickSlot('+si+')" title="'+relicObj.name+' — click to remove"':'')
        +(isEmpty?' onclick="srClickEmpty()" title="Slot '+(si+1)+' — equip a relic from inventory below"':'')
        +(cls==='lk'?' title="Unlock at '+ASCENSION_TIERS[si].tier+' ascension"':'')
        +(cls==='lk8'?' title="Final slot — permanently locked for now"':'')
        +'>'
        +(isEquipped?'<span class="sr-slot-icon">'+relicImgHTML(equipped[si],'24px')+'</span>':'')
        +(isEmpty?'<span class="sr-slot-plus">+</span>':'')
        +(!isUnlocked?'<span class="sr-slot-lock">🔒</span>':'')
        +'<span class="sr-slot-num">'+(si+1)+'</span>'
        +'</div>';
    }

    var ascTierName = nextAsc ? nextAsc.tier.charAt(0).toUpperCase()+nextAsc.tier.slice(1) : null;

    heroEl.innerHTML =
      '<div class="sr-hero-name">'+(ch?ch.name:'?')+'</div>'
      +'<div class="sr-hero-tier">'+(ascLevel>0?ASCENSION_TIERS[ascLevel-1].tier.toUpperCase()+' TIER':'BASE TIER')+'</div>'
      +'<div class="sr-portrait">'+portraitInner+'</div>'
      +'<div class="sr-connector"><div class="sr-conn-line"></div><div class="sr-conn-dot"></div><div class="sr-conn-line"></div></div>'
      +'<div class="sr-slots-row">'+slotsHTML+'</div>'
      +'<div class="sr-hero-footer">'
        +(ascTierName?'<button class="sr-asc-btn" data-champ="'+champId+'" onclick="ascendChampion(this.dataset.champ);buildSanctumRelicsPane();">ASCEND TO '+ascTierName.toUpperCase()+'</button>':'<div style="font-family:Cinzel,serif;font-size:8px;color:#4a3010;letter-spacing:.5px;">MAX ASCENSION</div>')
        +'<div class="sr-destroy-note">Removing a relic destroys it permanently.</div>'
      +'</div>';
  }

  // ── EFFECTS COLUMN ──
  var effEl = document.getElementById('sr-effects-col');
  if(effEl){
    if(!equipped.length){
      effEl.innerHTML = '<div class="tp-section-label" style="margin-bottom:4px;">RELIC EFFECTS</div>'
        +'<div class="sr-empty-hint">No relics equipped.</div>'
        +'<div class="sr-forge-cta" style="margin-top:6px;">Craft relics at<br><a onclick="closeBuildingPanel(\'sanctum\');openBuilding(\'forge\');">the Forge →</a></div>';
    } else {
      var effHTML = '<div class="tp-section-label" style="margin-bottom:4px;">RELIC EFFECTS</div>';
      equipped.forEach(function(relicId){
        var r = RELICS[relicId]; if(!r) return;
        var rTier = (Object.values(RELIC_RECIPES).find(function(x){ return Object.keys(RELICS).indexOf(relicId)!==-1; })||{}).tier||'base';
        // Find tier from recipes
        var recipeTier = RELIC_RECIPES[relicId] ? RELIC_RECIPES[relicId].tier : 'base';
        effHTML += '<div class="sr-erb" id="sr-erb-'+relicId+'">'
          +'<div class="sr-erb-head">'
            +'<span class="sr-erb-icon">'+relicImgHTML(relicId,'18px')+'</span>'
            +'<span class="sr-erb-name">'+r.name+'</span>'
          +'</div>'
          +'<div class="sr-erb-eff">'+r.desc+'</div>'
          +'</div>';
      });
      if(slots > equipped.length){
        effHTML += '<div class="sr-empty-hint">'+( slots-equipped.length)+' slot'+(slots-equipped.length>1?'s':'')+' empty</div>';
      }
      effEl.innerHTML = effHTML;
    }
  }

  // ── INVENTORY STRIP ──
  _buildSanctumRelicsInventory(champId, equipped, slots);
}

function _buildSanctumRelicsInventory(champId, equipped, slots){
  var invEl = document.getElementById('sr-inv-strip');
  if(!invEl) return;
  var relics = PERSIST.town.relics||{};
  var ownedIds = Object.keys(relics).filter(function(id){ return relics[id]>0; });
  var tc = {base:'#777',ruby:'#c0392b',emerald:'#27ae60',sapphire:'#2980b9',turquoise:'#17a589',amethyst:'#8e44ad'};

  var html = '<div class="sr-inv-label">INVENTORY</div>';
  if(!ownedIds.length){
    html += '<div style="font-size:10px;color:#2a1e0c;font-style:italic;">No relics in inventory. Craft them at the Forge.</div>';
  } else {
    var slotsAvailable = slots - equipped.length;
    ownedIds.forEach(function(relicId){
      var r = RELICS[relicId]; if(!r) return;
      var count = relics[relicId]||0;
      var recipe = RELIC_RECIPES[relicId];
      var tier = recipe ? recipe.tier : 'base';
      var col = tc[tier]||'#777';
      var canEquip = slotsAvailable > 0;
      html += '<div class="sr-inv-row">'
        +'<span class="sr-inv-icon">'+relicImgHTML(relicId,'20px')+'</span>'
        +'<div style="flex:1;min-width:0;">'
          +'<div style="display:flex;align-items:center;gap:5px;">'
            +'<span class="sr-inv-name">'+r.name+'</span>'
            +'<span class="sr-inv-badge" style="color:'+col+';border-color:'+col+'44;">'+tier.toUpperCase()+'</span>'
            +'<span class="sr-inv-ct">×'+count+'</span>'
          +'</div>'
          +'<div class="sr-inv-desc">'+r.desc+'</div>'
        +'</div>'
        +(canEquip
          ?'<button class="sr-equip-btn" onclick="srEquipRelic(\''+champId+'\',\''+relicId+'\')">EQUIP</button>'
          :'<button class="sr-equip-btn" disabled>'+(slots===0?'NO SLOTS':'SLOTS FULL')+'</button>')
        +'</div>';
    });
  }
  invEl.innerHTML = html;
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
  if(!confirm('Remove '+(relic?relic.name:'this relic')+'?\n\nThis will DESTROY it permanently. There is no refund.')) return;
  unequipRelic(champId, slotIdx);
  showTownToast('Relic destroyed.');
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
  var el=document.getElementById('sanctum-overview-body');
  if(!el) return;
  var champId=_sanctumChamp; if(!champId) return;
  var ch=getCreaturePlayable(champId);
  var cp=getChampPersist(champId);
  var kills=PERSIST.achievements[champId+'_kill']||0;
  var runs=PERSIST.areaRuns?Object.values(PERSIST.areaRuns).reduce(function(s,v){return s+(v[champId]||0);},0):0;
  var floor=PERSIST.sanctum&&PERSIST.sanctum.levelFloors&&PERSIST.sanctum.levelFloors[champId]||1;
  var xpPct=Math.min(100,Math.round((cp.xp/cp.xpNext)*100));

  // Stat growth preview — show stats at levels 1,5,10,20,30
  var previewLevels=[1,5,10,20,30];
  function statsAtLevel(lv){
    return {
      str:Math.round(ch.baseStats.str+(ch.growth.str*(lv-1))),
      agi:Math.round(ch.baseStats.agi+(ch.growth.agi*(lv-1))),
      wis:Math.round(ch.baseStats.wis+(ch.growth.wis*(lv-1)))
    };
  }

  var roleColors={MAGE:'#8060d0',TANK:'#d09030',ASSASSIN:'#30c060',BERSERKER:'#d04030',FIGHTER:'#a07030',WARRIOR:'#c08040',CHAMPION:'#c0a050',LEGEND:'#ffd040'};
  var roleCol=roleColors[ch.role]||'#c09030';

  var html=
    // Champion identity block
    '<div style="display:flex;align-items:center;gap:14px;padding:12px;background:rgba(0,0,0,.3);border-radius:8px;margin-bottom:12px;">'
      +'<div style="font-size:52px;line-height:1;">'+ch.icon+'</div>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-family:Cinzel,serif;font-size:14px;color:#d4a843;letter-spacing:1px;">'+ch.name+'</div>'
        
        +'<div style="font-size:9px;color:#7a6030;margin-top:4px;line-height:1.4;">'+ch.innateDesc+'</div>'
      +'</div>'
    +'</div>'

    // Level + XP
    +'<div style="margin-bottom:12px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">'
        +'<span style="font-family:Cinzel,serif;font-size:11px;color:#c09030;">Level '+cp.level+'</span>'
        +(floor>1?'<span style="font-size:8px;color:#6a4010;">Floor: Lv.'+floor+'</span>':'')
        +'<span style="font-size:8px;color:#5a4020;">'+cp.xp+' / '+cp.xpNext+' XP ('+xpPct+'%)</span>'
      +'</div>'
      +'<div style="height:5px;background:rgba(0,0,0,.5);border-radius:3px;overflow:hidden;">'
        +'<div style="height:100%;width:'+xpPct+'%;background:linear-gradient(90deg,#4a2808,#c09030);border-radius:3px;transition:width .4s;"></div>'
      +'</div>'
    +'</div>'

    // Quick stats
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;">'
      +'<div style="background:rgba(0,0,0,.3);border-radius:6px;padding:8px;text-align:center;">'
        +'<div style="font-size:18px;font-family:Cinzel,serif;color:#e06060;">'+cp.stats.str+'</div>'
        +'<div style="font-size:7px;color:#7a6030;letter-spacing:1px;">STR</div>'
        +'<div style="font-size:7px;color:#6a4020;margin-top:2px;">+'+ch.growth.str+'/lv</div>'
      +'</div>'
      +'<div style="background:rgba(0,0,0,.3);border-radius:6px;padding:8px;text-align:center;">'
        +'<div style="font-size:18px;font-family:Cinzel,serif;color:#e0c060;">'+cp.stats.agi+'</div>'
        +'<div style="font-size:7px;color:#7a6030;letter-spacing:1px;">AGI</div>'
        +'<div style="font-size:7px;color:#6a4020;margin-top:2px;">+'+ch.growth.agi+'/lv</div>'
      +'</div>'
      +'<div style="background:rgba(0,0,0,.3);border-radius:6px;padding:8px;text-align:center;">'
        +'<div style="font-size:18px;font-family:Cinzel,serif;color:#60a0e0;">'+cp.stats.wis+'</div>'
        +'<div style="font-size:7px;color:#7a6030;letter-spacing:1px;">WIS</div>'
        +'<div style="font-size:7px;color:#6a4020;margin-top:2px;">+'+ch.growth.wis+'/lv</div>'
      +'</div>'
    +'</div>'

    // Stat growth table
    +'<div style="margin-bottom:14px;">'
      +'<div style="font-family:Cinzel,serif;font-size:8px;color:#6a5020;letter-spacing:2px;margin-bottom:6px;">STAT GROWTH PROJECTION</div>'
      +'<table style="width:100%;border-collapse:collapse;font-size:8px;">'
        +'<thead><tr>'
          +'<th style="text-align:left;color:#5a4020;padding:3px 4px;border-bottom:1px solid #1e1006;">Level</th>'
          +'<th style="color:#c05050;padding:3px 4px;border-bottom:1px solid #1e1006;text-align:center;">STR</th>'
          +'<th style="color:#c0a030;padding:3px 4px;border-bottom:1px solid #1e1006;text-align:center;">AGI</th>'
          +'<th style="color:#4080c0;padding:3px 4px;border-bottom:1px solid #1e1006;text-align:center;">WIS</th>'
          +'<th style="color:#5a4020;padding:3px 4px;border-bottom:1px solid #1e1006;text-align:center;">HP</th>'
        +'</tr></thead>'
        +'<tbody>'
        +previewLevels.map(function(lv){
          var s=statsAtLevel(lv);
          var isCurrent=lv===cp.level;
          var rowStyle=isCurrent?'background:rgba(100,60,0,.2);':'';
          var hp=calcHp?calcHp(s.str):s.str*2;
          return '<tr style="'+rowStyle+'">'
            +'<td style="padding:3px 4px;color:'+(isCurrent?'#d4a843':'#6a5020')+';font-family:Cinzel,serif;">Lv.'+lv+(isCurrent?' ◀':lv<cp.level?' ✓':'')+'</td>'
            +'<td style="padding:3px 4px;color:#c05050;text-align:center;">'+s.str+'</td>'
            +'<td style="padding:3px 4px;color:#c0a030;text-align:center;">'+s.agi+'</td>'
            +'<td style="padding:3px 4px;color:#4080c0;text-align:center;">'+s.wis+'</td>'
            +'<td style="padding:3px 4px;color:#5a4020;text-align:center;">'+hp+'</td>'
          +'</tr>';
        }).join('')
        +'</tbody>'
      +'</table>'
    +'</div>'

    // Activity stats
    +'<div style="font-family:Cinzel,serif;font-size:8px;color:#6a5020;letter-spacing:2px;margin-bottom:6px;">HISTORY</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;">'
      +'<div style="background:rgba(0,0,0,.3);border-radius:5px;padding:8px;">'
        +'<div style="font-size:16px;font-family:Cinzel,serif;color:#d4a843;">'+kills+'</div>'
        +'<div style="font-size:7px;color:#5a4020;margin-top:1px;">Total Kills</div>'
      +'</div>'
      +'<div style="background:rgba(0,0,0,.3);border-radius:5px;padding:8px;">'
        +'<div style="font-size:16px;font-family:Cinzel,serif;color:#d4a843;">'+(cp.lastArea||'—')+'</div>'
        +'<div style="font-size:7px;color:#5a4020;margin-top:1px;">Last Area</div>'
      +'</div>'
    +'</div>'

    // Innate details
    +'<div style="background:rgba(80,40,0,.15);border:1px solid #3a2010;border-radius:6px;padding:10px;margin-bottom:8px;">'
      +'<div style="font-size:9px;color:#c09030;font-family:Cinzel,serif;margin-bottom:4px;">✦ '+ch.innateName+'</div>'
      +'<div style="font-size:8px;color:#806040;line-height:1.6;">'+ch.innateDesc+'</div>'
    +'</div>';

  el.innerHTML=html;
}


function buildSanctumDeckPane(){
  var grid=document.getElementById('sanctum-deck-grid');
  if(!grid) return;
  grid.innerHTML='';
  var champId=_sanctumChamp;
  if(!champId) return;
  var mods=getSanctumMods(champId);
  var deck=buildStartDeck(champId);
  var frags=getFragmentCount();
  var hasAnyMod=mods.removed.length>0||mods.swaps.length>0||mods.extras.length>0||Object.keys(mods.cardTiers||{}).length>0;

  // Count cards per type
  var deckCounts={};
  deck.forEach(function(id){ deckCounts[id]=(deckCounts[id]||0)+1; });
  var uniqueIds=Object.keys(deckCounts);

  // Champion-specific cards not yet in deck
  var champCards=Object.keys(CARDS).filter(function(id){
    return CARDS[id].champ===champId&&uniqueIds.indexOf(id)===-1;
  });

  // ── Header: fragment count + reset ──
  var header=document.createElement('div');
  header.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;';
  header.innerHTML='<span style="font-family:Cinzel,serif;font-size:9px;color:#7a6030;">'
    +deck.length+' cards · <span style="color:#d4a843;">🃏 '+frags+'</span> Fragments</span>'
    +(hasAnyMod?'<button class="sanctum-btn sanctum-btn-remove" onclick="resetSanctumDeck(\''+champId+'\')" style="font-size:7px;">↺ Reset to Default</button>':'');
  grid.appendChild(header);

  // ── Full deck visual — card grid ──
  var deckLabel=document.createElement('div');
  deckLabel.style.cssText='font-family:Cinzel,serif;font-size:7px;color:#6a5020;letter-spacing:2px;margin-bottom:6px;';
  deckLabel.textContent='STARTING DECK';
  grid.appendChild(deckLabel);

  var tierColors={base:'#444',ruby:'#c0392b',emerald:'#27ae60',sapphire:'#2980b9',turquoise:'#17a589',amethyst:'#8e44ad',topaz:'#d4ac0d',obsidian:'#2c3e50'};
  var deckGrid=document.createElement('div');
  deckGrid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:12px;';

  uniqueIds.forEach(function(cardId){
    var cd=CARDS[cardId]; if(!cd) return;
    var copies=deckCounts[cardId];
    var tier=mods.cardTiers&&mods.cardTiers[cardId]?mods.cardTiers[cardId]:'base';
    var tc=tierColors[tier]||'#444';
    var isModded=mods.extras.some(function(e){return e.cardId===cardId;})||
                 mods.swaps.some(function(s){return s.toId===cardId;})||
                 tier!=='base';
    var cell=document.createElement('div');
    cell.style.cssText='background:rgba(20,10,2,.6);border:1px solid '+(isModded?'#3a5020':'#2a1808')+';border-radius:5px;padding:6px;cursor:pointer;transition:border-color .15s;';
    cell.innerHTML='<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:3px;">'
      +'<span style="font-size:16px;">'+(cd.icon||'?')+'</span>'
      +'<span style="font-size:8px;color:#7a6030;font-family:Cinzel,serif;">×'+copies+'</span>'
      +'</div>'
      +'<div style="font-size:7px;color:#d4a843;font-family:Cinzel,serif;line-height:1.2;margin-bottom:2px;">'+cd.name+'</div>'
      +(tier!=='base'?'<div style="font-size:6px;color:'+tc+';border:1px solid '+tc+';display:inline-block;padding:0 3px;border-radius:2px;">'+tier.toUpperCase()+'</div>':'')
      +(isModded?'<div style="font-size:6px;color:#6a8040;margin-top:2px;">✦ modified</div>':'');
    // Click to expand edit options for this card
    (function(cid,isBase){
      cell.onclick=function(){ toggleCardEditRow(champId,cid,isBase,cell,frags,champCards,deck,deckCounts); };
    })(cardId,!cd.champ);
    deckGrid.appendChild(cell);
  });
  grid.appendChild(deckGrid);

  // ── Edit section ──
  var editSection=document.createElement('div');
  editSection.id='sanctum-edit-section';
  editSection.style.cssText='border-top:1px solid #1e1006;padding-top:10px;';
  editSection.innerHTML='<div style="font-size:8px;color:#4a3010;font-style:italic;text-align:center;padding:4px;">Click a card above to edit it</div>';
  grid.appendChild(editSection);

  // ── Available section: champion cards + collected pool ──
  var availSection=document.createElement('div');
  availSection.style.cssText='margin-top:12px;border-top:1px solid #1e1006;padding-top:10px;';

  var availHTML='<div style="font-family:Cinzel,serif;font-size:7px;color:#6a5020;letter-spacing:2px;margin-bottom:8px;">AVAILABLE CARDS</div>';

  // Champion-specific unlocks
  if(champCards.length>0){
    var canSwapIn=frags>=(SANCTUM_COSTS.swap_base);
    availHTML+='<div style="font-size:8px;color:#7a6030;margin-bottom:4px;">Champion cards — swap out a Strike or Brace ('+SANCTUM_COSTS.swap_base+' 🃏)</div>'
      +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">'
      +champCards.map(function(cid){
        var cd=CARDS[cid]; if(!cd) return '';
        return '<button class="sanctum-btn sanctum-btn-swap"'+(canSwapIn?'':' disabled')
          +' onclick="sanctumSwapIn(\''+champId+'\',\''+cid+'\')" title="'+cd.effect+'">'
          +(cd.icon||'?')+' '+cd.name+'</button>';
      }).join('')+'</div>';
  }

  // Collected pool
  var pool=PERSIST.sanctum.unlockedCards||{};
  var relPool=Object.keys(pool).filter(function(id){
    var cd=CARDS[id];
    return pool[id]>0&&cd&&(!cd.champ||(cd.champ===champId));
  });
  if(relPool.length>0){
    var canAdd=frags>=(SANCTUM_COSTS.add_collected);
    availHTML+='<div style="font-size:8px;color:#d4a843;margin-bottom:4px;">Collected cards — add to deck ('+SANCTUM_COSTS.add_collected+' 🃏 each)</div>'
      +'<div style="display:flex;gap:4px;flex-wrap:wrap;">'
      +relPool.map(function(cid){
        var cd=CARDS[cid];
        return '<button class="sanctum-btn sanctum-btn-swap"'+(canAdd?'':' disabled')
          +' onclick="sanctumAddCollected(\''+champId+'\',\''+cid+'\')" title="'+cd.effect+'">'
          +(cd.icon||'?')+' '+cd.name+' ×'+pool[cid]+'</button>';
      }).join('')+'</div>';
  } else if(!champCards.length){
    availHTML+='<div style="font-size:8px;color:#3a2810;font-style:italic;">No extra cards available yet — earn them from runs.</div>';
  }

  availSection.innerHTML=availHTML;
  grid.appendChild(availSection);
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

// ── MARKET ──
var CHEST_IDS=Object.keys(LOOT_DEFS).filter(function(id){return LOOT_DEFS[id].type==='chest';});

function getChestPrice(chestId){
  var def=LOOT_DEFS[chestId]; if(!def||!def.basePrice) return 999;
  var buys=PERSIST.town.shopPurchases[chestId]||0;
  return Math.round(def.basePrice*Math.pow(1.3,buys)/5)*5; // rounded to nearest 5g
}

function buyMarketChest(chestId){
  var b=PERSIST.town.buildings.market;
  var stockItem=(b.stock||[]).find(function(s){return s.id===chestId;});
  if(!stockItem||stockItem.qty<=0){ showTownToast('Out of stock!'); return; }
  var price=getChestPrice(chestId);
  if(PERSIST.gold<price){ showTownToast('Not enough gold!'); return; }
  PERSIST.gold-=price;
  stockItem.qty--;
  addLootItem(chestId,1);
  PERSIST.town.shopPurchases[chestId]=(PERSIST.town.shopPurchases[chestId]||0)+1;
  savePersist();
  updateNavBar('town');
  refreshMarketPanel();
  showTownToast(LOOT_DEFS[chestId].name+' purchased! Next: '+getChestPrice(chestId)+'g');
}

// Keep buyChest as alias for old calls
function buyChest(chestId){ buyMarketChest(chestId); }

function buyMarketDeal(dealId){
  var b=PERSIST.town.buildings.market;
  var deal=(b.deals||[]).find(function(d){return d.id===dealId;});
  if(!deal){ showTownToast('Deal no longer available.'); return; }
  if(PERSIST.gold<deal.cost){ showTownToast('Not enough gold!'); return; }
  PERSIST.gold-=deal.cost;
  if(deal.type==='material'){
    PERSIST.town.materials[deal.matId]=(PERSIST.town.materials[deal.matId]||0)+deal.qty;
  } else if(deal.type==='lootbatch'){
    addLootItem(deal.lootId,deal.qty);
  } else if(deal.type==='fragments'){
    PERSIST.town.cardFragments=(PERSIST.town.cardFragments||0)+deal.qty;
  }
  // Remove deal after purchase (one-time per refresh)
  b.deals=b.deals.filter(function(d){return d.id!==dealId;});
  savePersist(); updateNavBar('town');
  refreshMarketPanel();
  showTownToast(deal.label+' purchased!');
}

function buyRareItem(){
  var b=PERSIST.town.buildings.market;
  var r=b.rare;
  if(!r){ showTownToast('No rare item available.'); return; }
  if(PERSIST.gold<r.cost){ showTownToast('Not enough gold!'); return; }
  PERSIST.gold-=r.cost;
  if(r.type==='towncard'){
    addTownCard(r.tier);
  } else if(r.type==='shards'){
    // Future: PERSIST.shards = (PERSIST.shards||0) + r.qty;
    showTownToast(r.label+' purchased! (Shards system coming soon)');
  } else if(r.type==='mystery'){
    // Open a random chest
    var chestIds=Object.keys(CHEST_LOOT_TABLES);
    var randomChest=chestIds[Math.floor(Math.random()*chestIds.length)];
    addLootItem(randomChest,1);
    showTownToast('Mystery Chest revealed: '+LOOT_DEFS[randomChest].name+'!');
  } else if(r.type==='fragments'){
    PERSIST.town.cardFragments=(PERSIST.town.cardFragments||0)+r.qty;
  } else if(r.type==='material'){
    PERSIST.town.materials[r.matId]=(PERSIST.town.materials[r.matId]||0)+r.qty;
  }
  b.rare=null; // consumed
  savePersist(); updateNavBar('town');
  refreshMarketPanel();
  if(r.type!=='mystery'&&r.type!=='shards') showTownToast(r.label+' purchased!');
}

function refreshMarketPanel(){
  showLockedBuildingUI('market');
  var b=PERSIST.town.buildings.market;
  if(!b.unlocked) return;

  ensureMarketStock();

  var slotCard=null;
  var active=false; // gem slot UI removed
  var goldEl=document.getElementById('market-gold-val');
  if(goldEl) goldEl.textContent='✦ '+PERSIST.gold;

  // Market always active — gem just boosts refresh rate
  var active=true;

  // Helper: set a mini bar
  function setBar(barId,etaId,prog,max){
    var pct=Math.min(100,(prog/max)*100);
    var eta=Math.max(0,Math.ceil(max-prog));
    var barEl=document.getElementById(barId); if(barEl) barEl.style.width=pct+'%';
    var etaEl=document.getElementById(etaId);
    if(etaEl) etaEl.textContent=(eta>=60?Math.ceil(eta/60)+'m':eta+'s');
  }
  setBar('market-stock-bar','market-stock-eta',b.refreshProgress||0,MARKET_REFRESH_SECS);
  setBar('market-deals-bar','market-deals-eta',b.dealsProgress||0,MARKET_DEALS_SECS);
  setBar('market-rare-bar', 'market-rare-eta', b.rareProgress||0, MARKET_RARE_SECS);

  // Helper: render a buy card
  function makeItem(def,cost,onclick,extraClass,desc){
    var canAfford=PERSIST.gold>=cost;
    var el=document.createElement('div');
    el.className='market-item'+(canAfford?' available':'')+(extraClass?' '+extraClass:'');
    el.innerHTML='<div class="market-item-icon">'+def.icon+'</div>'
      +'<div class="market-item-name">'+def.label+'</div>'
      +(desc?'<div class="market-item-desc">'+desc+'</div>':'')
      +'<div class="market-item-price'+(!canAfford?' cant-afford':'')+'">✦ '+cost+'g</div>'
      +'<button class="market-buy-btn"'+(canAfford?' onclick="'+onclick+'"':' disabled')+'>'
        +'BUY'
      +'</button>';
    return el;
  }

  // ── STOCK grid (chests) ──
  var stockGrid=document.getElementById('market-stock-grid');
  if(stockGrid){
    stockGrid.innerHTML='';
    if(!active){
      var msg=document.createElement('div'); msg.style.cssText='grid-column:1/-1;font-size:9px;color:#3a2810;font-style:italic;text-align:center;padding:8px 0;'; msg.textContent='Slot a card to reveal stock.'; stockGrid.appendChild(msg);
    } else {
      (b.stock||[]).forEach(function(s){
        var def=LOOT_DEFS[s.id]; if(!def) return;
        var price=getChestPrice(s.id);
        var canAfford=PERSIST.gold>=price&&s.qty>0;
        var el=document.createElement('div');
        el.className='market-item'+(canAfford?' available':'');
        el.innerHTML='<div class="market-item-icon" style="color:'+def.color+'">'+def.icon+'</div>'
          +'<div class="market-item-name" style="color:'+def.color+'">'+def.name+'</div>'
          +'<div class="market-item-desc">stock: '+s.qty+' · owned: '+getLootCount(s.id)+'</div>'
          +'<div class="market-item-price'+(canAfford?'':' cant-afford')+'">✦ '+price+'g</div>'
          +'<button class="market-buy-btn"'+(canAfford?' onclick="buyMarketChest(\''+s.id+'\')"':' disabled')+'>'
            +(s.qty>0?'BUY':'SOLD OUT')
          +'</button>';
        stockGrid.appendChild(el);
      });
    }
  }

  // ── DEALS grid ──
  var dealsGrid=document.getElementById('market-deals-grid');
  if(dealsGrid){
    dealsGrid.innerHTML='';
    if(!active){
      var msg2=document.createElement('div'); msg2.style.cssText='grid-column:1/-1;font-size:9px;color:#3a2810;font-style:italic;text-align:center;padding:8px 0;'; msg2.textContent='Slot a card to reveal deals.'; dealsGrid.appendChild(msg2);
    } else {
      (b.deals||[]).forEach(function(deal){
        var el=makeItem(deal,deal.cost,"buyMarketDeal('"+deal.id+"')",'',deal.desc);
        dealsGrid.appendChild(el);
      });
    }
  }

  // ── RARE grid ──
  var rareGrid=document.getElementById('market-rare-grid');
  if(rareGrid){
    rareGrid.innerHTML='';
    if(!active){
      var msg3=document.createElement('div'); msg3.style.cssText='grid-column:1/-1;font-size:9px;color:#3a2810;font-style:italic;text-align:center;padding:8px 0;'; msg3.textContent='Slot a card to reveal the rare find.'; rareGrid.appendChild(msg3);
    } else if(b.rare){
      var r=b.rare;
      var el2=makeItem(r,r.cost,"buyRareItem()",'rare-item',r.desc);
      rareGrid.appendChild(el2);
    }
  }
}

// ─────────────────────────────────────────────────────────
// MARKET REFRESH SYSTEM
// ─────────────────────────────────────────────────────────
var MARKET_REFRESH_SECS=60;
var MARKET_STOCK_SIZE=4;
var MARKET_POOL=[
  ['chest_sewers',6],['chest_bog',5],['chest_crypt',5],
  ['chest_forest',4],['chest_cave',4],['chest_mist',4],['chest_wax',4],
  ['chest_ruins',2],['chest_dragon',2],['chest_bone',2],
  ['chest_astral',1],
];

function rollMarketStock(){
  var pool=[];
  MARKET_POOL.forEach(function(e){ for(var i=0;i<e[1];i++) pool.push(e[0]); });
  var chosen=[],used={},attempts=0;
  while(chosen.length<MARKET_STOCK_SIZE&&attempts<200){
    var pick=pool[Math.floor(Math.random()*pool.length)];
    if(!used[pick]){ used[pick]=true; chosen.push({id:pick,qty:3}); }
    attempts++;
  }
  return chosen;
}

function rollDeals(){
  var pool=DEALS_POOL.slice();
  var chosen=[]; var used={};
  for(var i=0;i<2;i++){
    var avail=pool.filter(function(p){return !used[p.id];});
    if(!avail.length) break;
    var pick=avail[Math.floor(Math.random()*avail.length)];
    chosen.push(Object.assign({},pick)); used[pick.id]=true;
  }
  return chosen;
}

function rollRare(){
  return Object.assign({},RARE_POOL[Math.floor(Math.random()*RARE_POOL.length)]);
}

function marketTick(seconds){
  var b=PERSIST.town.buildings.market;
  if(!b||!b.unlocked) return;
  // Gem boosts refresh speed by 50%
  var speedMult=1.0;
  var ticks=seconds*speedMult;

  b.refreshProgress=(b.refreshProgress||0)+ticks;
  if(b.refreshProgress>=MARKET_REFRESH_SECS){ b.refreshProgress=0; b.stock=rollMarketStock(); }

  b.dealsProgress=(b.dealsProgress||0)+ticks;
  if(b.dealsProgress>=MARKET_DEALS_SECS){ b.dealsProgress=0; b.deals=rollDeals(); }

  b.rareProgress=(b.rareProgress||0)+ticks;
  if(b.rareProgress>=MARKET_RARE_SECS){ b.rareProgress=0; b.rare=rollRare(); }

  var panel=document.getElementById('market-panel-bg');
  if(panel&&panel.classList.contains('show')) refreshMarketPanel();
}

function ensureMarketStock(){
  var b=PERSIST.town.buildings.market;
  if(!b) return;
  if(!b.stock||!b.stock.length) b.stock=rollMarketStock();
  if(!b.deals||!b.deals.length) b.deals=rollDeals();
  if(!b.rare) b.rare=rollRare();
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


// ── Market deals pool ──
var DEALS_POOL=[
  {id:'deal_slick_sm',   label:'Slick Stone ×10',  icon:'🪨', desc:'10 Slick Stone',   cost:10, type:'material', matId:'slick_stone',  qty:10},
  {id:'deal_slick_lg',   label:'Slick Stone ×25',  icon:'🪨', desc:'25 Slick Stone',   cost:22, type:'material', matId:'slick_stone',  qty:25},
  {id:'deal_bog_sm',     label:'Bog Iron ×5',       icon:'🔩', desc:'5 Bog Iron',       cost:12, type:'material', matId:'bog_iron',     qty:5},
  {id:'deal_bone_sm',    label:'Bone Dust ×5',      icon:'🦴', desc:'5 Bone Dust',      cost:12, type:'material', matId:'bone_dust',    qty:5},
  {id:'deal_ember_sm',   label:'Ember Grit ×5',     icon:'🔥', desc:'5 Ember Grit',     cost:14, type:'material', matId:'ember_grit',   qty:5},
  {id:'deal_keys_sewer', label:'Sewer Keys ×3', icon:'🗝️', desc:'3 Sewer Keys', cost:6, type:'lootbatch', lootId:'key_sewers', qty:3},
  {id:'deal_keys_bog',   label:'Bog Keys ×2',   icon:'🗝️', desc:'2 Bog Keys',   cost:8, type:'lootbatch', lootId:'key_bog',    qty:2},
  {id:'deal_keys_crypt', label:'Crypt Keys ×2', icon:'🗝️', desc:'2 Crypt Keys', cost:8, type:'lootbatch', lootId:'key_crypt',  qty:2},
  {id:'deal_keys_forest',label:'Forest Keys ×2',icon:'🗝️', desc:'2 Forest Keys',cost:12,type:'lootbatch', lootId:'key_forest', qty:2},
  {id:'deal_frags_sm',   label:'Card Fragments ×10', icon:'🃏', desc:'10 Card Fragments (100=Ruby Gem)', cost:20, type:'fragments', qty:10},
  {id:'deal_frags_lg',   label:'Card Fragments ×25', icon:'🃏', desc:'25 Card Fragments', cost:45, type:'fragments', qty:25},
];

// ── Market rare pool ──
var RARE_POOL=[
  {id:'rare_green_card', label:'Emerald Gem', icon:'💚', desc:'A rare gem — more potent than Ruby for powering buildings.', cost:400, type:'towncard', tier:'emerald'},
  {id:'rare_shards_5',   label:'Shards ×5',       icon:'💠', desc:'5 Shards (used in the Shard Well)',      cost:150, type:'shards',   qty:5},
  {id:'rare_shards_10',  label:'Shards ×10',      icon:'💠', desc:'10 Shards — a healthy stockpile',        cost:280, type:'shards',   qty:10},
  {id:'rare_mystery',    label:'Mystery Chest',   icon:'❓', desc:'A chest of unknown origin. Could be anything.', cost:55, type:'mystery'},
  {id:'rare_frags_50',   label:'Card Fragments ×50', icon:'🃏', desc:'50 Card Fragments — halfway to a Ruby Gem', cost:80, type:'fragments', qty:50},
  {id:'rare_ember_grit', label:'Ember Grit ×15',  icon:'🔥', desc:'15 Ember Grit — forge fuel',           cost:55, type:'material', matId:'ember_grit', qty:15},
];

var MARKET_DEALS_SECS=90;
var MARKET_RARE_SECS=300;

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

// ── Forge tick ───────────────────────────────────────────────────────
function forgeTick(){
  var b=PERSIST.town.buildings.forge;
  if(!b||!b.unlocked||!b.queue||!b.queue.length) return;
  var item=b.queue[0];
  if(Date.now()-item.startTime>=item.totalMs){
    b.queue.shift();
    if(!PERSIST.town.relics) PERSIST.town.relics={};
    PERSIST.town.relics[item.relicId]=(PERSIST.town.relics[item.relicId]||0)+1;
    var relic=RELICS[item.relicId];
    showTownToast('✦ '+(relic?relic.name:'Relic')+' crafted! Check your inventory.');
    addLog('✦ Forge complete: '+(relic?relic.name:item.relicId)+' added to inventory.','sys');
    savePersist();
    var fp=document.getElementById('forge-panel-bg');
    if(fp&&fp.classList.contains('show')) refreshForgePanel();
  }
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
  savePersist();
  // Live-update vault bar if vault panel is open
  var vp=document.getElementById('vault-panel-bg');
  if(vp&&vp.classList.contains('show')){ refreshVaultLevelBar(); }
  // Live-update market bars if market panel open
  var mp=document.getElementById('market-panel-bg');
  if(mp&&mp.classList.contains('show')){
    var mb=PERSIST.town.buildings.market;
    if(mb&&mb.unlocked){
      var updBar=function(barId,etaId,prog,max){
        var pct=Math.min(100,(prog/max)*100);
        var eta=Math.max(0,Math.ceil(max-prog));
        var b2=document.getElementById(barId); if(b2) b2.style.width=pct.toFixed(1)+'%';
        var e2=document.getElementById(etaId); if(e2) e2.textContent=eta>=60?Math.ceil(eta/60)+'m':eta+'s';
      }
      updBar('market-stock-bar','market-stock-eta',mb.refreshProgress||0,MARKET_REFRESH_SECS);
      updBar('market-deals-bar','market-deals-eta',mb.dealsProgress||0,MARKET_DEALS_SECS);
      updBar('market-rare-bar','market-rare-eta',mb.rareProgress||0,MARKET_RARE_SECS);
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
  combat_intro: {
    icon:'⚔️',
    title:'Combat',
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
    icon:'🔷',
    title:'Mana',
    pages:[
      {body:'Your mana pool maximum is <span style="color:#5080c0;">WIS × 20</span>. Mana regenerates at <span style="color:#5080c0;">WIS × 1.5</span> per second passively. Each card has a fixed mana cost. Cards cannot play if current mana is below their cost.',
       tip:null},
    ]
  },
  town_intro: {
    icon:'🏘',
    title:'The Town',
    pages:[
      {body:'The Town contains buildings that provide persistent benefits between runs. Each building has a gem slot. Slotting a gem card activates and empowers that building. Buildings unlock progressively as you meet their requirements.',
       tip:null},
      {body:'Gold earned during runs is banked when a run ends. Gold is spent in the Town to unlock buildings and purchase items. Buildings have an XP track — they level up from area clears, unlocking new features at higher levels.',
       tip:null},
    ]
  },
  vault_intro: {
    icon:'vault_keeper',
    title:'Shtole — Vault Keeper',
    isNpc: true,
    pages:[
      {body:'"Ah, welcome. This is the Vault. Everything you gather out there, materials, resources, it all comes here. I keep it safe. I keep it organised. Nothing goes missing."'},
      {body:'"Materials come from the areas you explore. Each area drops different things. The rarer the material, the harder the area. I sort them for you. You just need to check in after your runs."'},
      {body:'"One thing to watch. Storage has limits. If the shelves are full, I cannot accept more. Come back often, spend what you have at the Forge, and we will not have problems. ...I promise nothing has gone missing."'},
    ]
  },
  adventurers_hall_intro: {
    icon:'guild_girl',
    title:'Leona — Guild Girl',
    isNpc: true,
    pages:[
      {body:'"Oh! You\'re here for the first time! Welcome to the Adventurer\'s Hall! This is where all the action gets... coordinated. By me. Professionally."'},
      {body:'"The QUESTS tab has bounties pinned to the board. Pick one that looks good, go complete it, then come back to claim your reward. Simple! I mean. Standard procedure."'},
      {body:'"Once the Hall levels up, I\'ll open the EXPEDITIONS tab too. You can send your champions on timed missions while you\'re busy with other things. They bring back materials and experience. I\'ll keep track of everything. That\'s my job. Which I love. A normal amount."'},
    ]
  },
  forge_intro: {
    icon:'🔨',
    title:'The Forge',
    pages:[
      {body:'The Forge upgrades gem cards through tiers: Ruby → Emerald → Sapphire → and beyond. Each upgrade consumes the source gem plus <span style="color:#a06030;">Materials</span> and takes time to complete. Higher-tier gems produce stronger effects when slotted into buildings.',
       tip:null},
    ]
  },
  shrine_intro: {
    icon:'🏮',
    title:'The Shrine',
    pages:[
      {body:'The Shrine grants one blessing per run, applied at run start. Available blessings are gated by Shrine level. Slotting a higher-tier gem unlocks higher-level blessings. Blessings are not permanent — they apply only to the run in which they are granted.',
       tip:null},
    ]
  },
  bestiary_intro: {
    icon:'📖',
    title:'The Bestiary',
    pages:[
      {body:'The Bestiary tracks every enemy you have encountered. Each entry has a research progress bar (0–100%). When an entry reaches 100%, that enemy\'s card rewards are added to your <span style="color:#d4a843;">Sanctum Collection</span>. Slotting a gem enables passive research of unseen entries over time.',
       tip:null},
    ]
  },
  market_intro: {
    icon:'🛒',
    title:'The Market',
    pages:[
      {body:'The Market has three offer pools: Stock (common), Deals (discounted), and Rare Find (one scarce item). Each pool refreshes on its own timer. Purchasing an item from Stock increases that item\'s price for future purchases. Slotting a gem reduces refresh timers.',
       tip:null},
    ]
  },
  sanctum_intro: {
    icon:'⚗️',
    title:'The Sanctum',
    pages:[
      {body:'The Sanctum modifies a champion\'s <strong>starting deck</strong> — the deck they enter every run with. Changes are permanent across runs. Modifications cost <span style="color:#d4a843;">🃏 Card Fragments</span>, earned from area clears. The unmodified default deck can be restored for free at any time.',
       tip:null},
      {body:'<strong>Deck tab:</strong> add, remove, or swap cards in the starting deck. <strong>Upgrades tab:</strong> raise a card\'s tier — upgraded copies start the run at that tier. <strong>Training tab:</strong> set a level floor — the champion always starts a run at that level or higher, regardless of their current level.',
       tip:null},
    ]
  },
  board_intro: {
    icon:'📋',
    title:"The Adventurer's Board",
    pages:[
      {body:'The Board offers quests with specific completion conditions. One quest may be active at a time. Quest progress is tracked across runs. Completing a quest awards its listed reward — gold, <span style="color:#d4a843;">🃏 Fragments</span>, <span style="color:#2980b9;">💎 Gem Shards</span>, or Materials. Incomplete quests can be abandoned; the slot refreshes on a timer.',
       tip:null},
    ]
  },
  shard_well_intro: {
    icon:'🔮',
    title:'The Shard Well',
    pages:[
      {body:'The Shard Well passively generates <span style="color:#2980b9;">💎 Gem Shards</span> on a timer. Slotting a gem reduces that timer. Gem Shards are also earned from higher-level area clears and can be crafted into gem cards in the Vault.',
       tip:null},
      {body:'The Shard Well also connects to the <strong>Eternal Summons</strong>. You earn <span style="color:#c8a0ff;">🔮 Soul Shards</span> passively after every completed run. At 100 Soul Shards, you may perform a summon. Summoning draws a random champion from the pool of enemies you have encountered. Duplicate results grant Ascension tokens for that champion.',
       tip:null},
    ]
  },
  sanctum_deck_edit: {
    icon:'🃏',
    title:'Deck Editing',
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
  if(tut.isNpc){
    iconEl.innerHTML='<img src="assets/creatures/'+tut.icon+'.png" style="width:120px;height:120px;image-rendering:pixelated;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5));transform:scaleX(-1);" onerror="this.parentNode.textContent=\'🦦\'">';
  } else {
    iconEl.textContent=tut.icon;
  }
  document.getElementById('tut-title').textContent=tut.title;
  var stepEl=document.getElementById('tut-step');
  var multi=tut.pages.length>1;
  stepEl.textContent=multi?'Page '+(_tutPage+1)+' of '+tut.pages.length:'';
  var nextBtn=document.getElementById('tut-next-btn');
  nextBtn.style.display=multi&&_tutPage<tut.pages.length-1?'inline-block':'none';

  // Get NPC pitch from tutorial definition or BUILDINGS
  var pitch = 1.0;
  if(tut.isNpc && tut.icon){
    // Find the building that uses this sprite
    Object.values(BUILDINGS).forEach(function(b){
      if(b.sprite === tut.icon && b.npc && b.npc.pitch) pitch = b.npc.pitch;
    });
  }

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


// ═══════════════════════════════════════════════════════
// FONT & TEXT SIZE TUNER
// ═══════════════════════════════════════════════════════
// Font always Press Start 2P, text size always default

// Font always Press Start 2P, text size always default
function _updateSizeBtns(){}
function setFontTheme(theme){
  document.body.classList.add('font-press');
}
function setTextSize(px){
  // Locked to default — sets the CSS variable baseline only
  document.documentElement.style.setProperty('--ts', '1');
}

function togglePause(){
  if(!gs||!gs.running) return;
  paused=!paused;
  var btn=document.getElementById('btn-pause');
  if(btn) btn.textContent=paused?'RESUME':'PAUSE';
  if(!paused) scheduleEnemyAction();
}

// ═══════════════════════════════════════════════════════
// KEYBOARD SYSTEM
// ═══════════════════════════════════════════════════════
var _kbCardIdx=-1;

function _kbShowHints(show){
  var el=document.getElementById('kb-hints');
  if(el) el.style.display=show?'block':'none';
}

function _kbActiveScreen(){
  var screens=['select-screen','area-screen','game-screen','town-screen','deck-screen'];
  for(var i=0;i<screens.length;i++){
    var el=document.getElementById(screens[i]);
    if(el&&el.classList.contains('active')) return screens[i];
  }
  return null;
}

function _kbIsModalOpen(){
  var modal=document.getElementById('begin-battle-modal');
  if(modal&&modal.style.display==='flex') return 'begin-battle';
  var pile=document.getElementById('pile-popup');
  if(pile&&pile.classList.contains('show')) return 'pile';
  var tut=document.getElementById('tutorial-overlay');
  if(tut&&tut.style.display==='flex') return 'tutorial';
  var sett=document.getElementById('settings-overlay');
  if(sett&&sett.classList.contains('show')) return 'settings';
  var vic=document.getElementById('victory-overlay');
  if(vic&&vic.classList.contains('show')) return 'victory';
  return null;
}

function _kbSelectCard(idx){
  var cards=document.getElementById('hand-cards');
  if(!cards) return;
  var cardEls=cards.querySelectorAll('.card');
  cardEls.forEach(function(c){ c.classList.remove('selected-card'); });
  if(idx>=0&&idx<cardEls.length){
    cardEls[idx].classList.add('selected-card');
    _kbCardIdx=idx;
  } else {
    _kbCardIdx=-1;
  }
}

var _kbChampIdx=0;
function _kbSelectChamp(dir){
  var ids=PERSIST.unlockedChamps.filter(function(id){return !!CREATURES[id];});
  _kbChampIdx=Math.max(0,Math.min(ids.length-1,_kbChampIdx+dir));
  var id=ids[_kbChampIdx];
  if(id){
    selectedChampId=id;
    var btn=document.getElementById('cc-'+id);
    if(btn) btn.click();
  }
}

var _kbAreaIdx=0;
function _kbSelectArea(dir, cols){
  var areaCards=document.querySelectorAll('.area-card');
  _kbAreaIdx=Math.max(0,Math.min(areaCards.length-1,_kbAreaIdx+(dir*(cols||1))));
  if(areaCards[_kbAreaIdx]) areaCards[_kbAreaIdx].click();
}

document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;

  var screen=_kbActiveScreen();
  var modal=_kbIsModalOpen();

  // Escape — close overlays
  if(e.key==='Escape'){
    if(modal==='begin-battle'){ document.getElementById('begin-battle-modal').style.display='none'; return; }
    if(modal==='pile'){ closePilePopup({target:document.getElementById('pile-popup')}); return; }
    if(modal==='tutorial'){ dismissTutorial(); return; }
    if(modal==='settings'){ closeSettings(); return; }
    if(screen==='deck-screen'){ continueDeckView(); return; }
    if(screen==='deck-edit-screen'){ deDeckDone(); return; }
    return;
  }

  // Begin Battle modal
  if(modal==='begin-battle'){
    if(e.key==='Enter'||e.key===' '){ e.preventDefault(); beginBattleFromModal(); }
    return;
  }

  if(modal) return; // any other modal — don't act

  // Champion select
  if(screen==='select-screen'){
    if(e.key==='ArrowLeft')       { e.preventDefault(); _kbSelectChamp(-1); }
    else if(e.key==='ArrowRight') { e.preventDefault(); _kbSelectChamp(1); }
    else if(e.key==='Enter')      { confirmChampion(); }
    else if(e.key==='t'||e.key==='T') { navTo('town'); }
    return;
  }

  // Area select
  if(screen==='area-screen'){
    if(e.key==='ArrowLeft')       { e.preventDefault(); _kbSelectArea(-1); }
    else if(e.key==='ArrowRight') { e.preventDefault(); _kbSelectArea(1); }
    else if(e.key==='ArrowUp')    { e.preventDefault(); _kbSelectArea(-3,1); }
    else if(e.key==='ArrowDown')  { e.preventDefault(); _kbSelectArea(3,1); }
    else if(e.key==='Enter')      { if(selectedArea) confirmArea(); }
    else if(e.key==='Backspace')  { goToSelect(); }
    return;
  }

  // Game screen
  if(screen==='game-screen'){
    _kbShowHints(true);

    // P = pause/resume
    if(e.key==='p'||e.key==='P'){ togglePause(); return; }

    // D = deck view
    if((e.key==='d'||e.key==='D')&&gs&&gs.running){ e.preventDefault(); showDeckView(); return; }

    // 1–7 = play card at position
    var num=parseInt(e.key);
    if(!isNaN(num)&&num>=1&&num<=7){
      if(gs&&gs.running&&!paused){
        var idx=num-1;
        if(SETTINGS.confirm){
          if(_kbCardIdx===idx){ _kbSelectCard(-1); playCard(idx); }
          else { _kbSelectCard(idx); }
        } else {
          _kbSelectCard(-1);
          playCard(idx);
        }
      }
      return;
    }

    // Arrow left/right = cycle card selection
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();
      if(!gs||!gs.running||paused) return;
      var len=gs.hand.length; if(!len) return;
      var next=_kbCardIdx<0?0:(_kbCardIdx+(e.key==='ArrowRight'?1:-1)+len)%len;
      _kbSelectCard(next);
      return;
    }

    // Enter = play selected card
    if(e.key==='Enter'){
      e.preventDefault();
      if(!gs||!gs.running||paused) return;
      if(_kbCardIdx>=0&&_kbCardIdx<gs.hand.length){
        var ci=_kbCardIdx; _kbSelectCard(-1); playCard(ci);
      }
      return;
    }

    // Space = innate ability
    if(e.key===' '){
      e.preventDefault();
      if(gs&&gs.running&&!paused) activateInnate();
      return;
    }
  }
});

// Show tuner when entering game screen
var _kbOrigStartRun=startRun;
startRun=function(champId,area){
  _kbCardIdx=-1;
  _kbOrigStartRun(champId,area);
};
// Expedition Hall — see data/expedition.js
