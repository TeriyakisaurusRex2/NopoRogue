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
}
function deleteSaveCancel(){
  var dc=document.getElementById('s-delete-confirm');
  var db=document.getElementById('s-delete-btn');
  if(dc) dc.style.display='none';
  if(db) db.style.display='inline-block';
}
function deleteSaveConfirm(){
  try{ localStorage.removeItem(PERSIST_KEY); }catch(e){}
  try{ localStorage.removeItem('cetd_settings'); }catch(e){}
  // Show feedback directly in the confirm panel since import-msg may not be visible
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
      board:{unlocked:false, slottedCard:null},
      expedition_hall:{unlocked:false,level:1,slots:[{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null}],log:[]},
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
    buildingXp:{vault:0,forge:0,shrine:0,bestiary:0,shard_well:0,sanctum:0,market:0,board:0},
    buildingLevel:{vault:1,forge:1,shrine:1,bestiary:1,shard_well:1,sanctum:1,market:1,board:1},
    quests:{
      offered:[],      // 3 quests shown on the board
      active:null,     // current active quest {def, progress, startTime}
      completed:[],    // ids of completed quests (for deduplication)
      offeredRefresh:0,// timestamp of last refresh
    },
  },
  bestiary:{ research:{}, researchAcc:0 },
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
        if(p.town.buildings&&p.town.buildings.board) PERSIST.town.buildings.board=Object.assign({unlocked:false,slottedCard:null},p.town.buildings.board);
        if(p.town.buildings&&p.town.buildings.expedition_hall) PERSIST.town.buildings.expedition_hall=Object.assign({unlocked:false,level:1,slots:[{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},{champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null}],log:[]},p.town.buildings.expedition_hall);
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
// Champions loaded from data/champions.js
var CREATURES_PLAYABLE = {};

var RARITY_COLORS = {common:'#c0a060',uncommon:'#70b040',rare:'#4080e0',legendary:'#d4a843'};
var RARITY_LABELS = {common:'COMMON',uncommon:'UNCOMMON',rare:'RARE',legendary:'LEGENDARY'};
var SOUL_SHARDS_PER_PULL = 100;

// Rarity overrides — starters and bosses
var RARITY_OVERRIDES = {
  druid:'rare', paladin:'rare', thief:'rare',
  dragon:'legendary', lich:'legendary', harbourmaster:'legendary',
  wyrm:'rare', knight:'rare', witch:'rare', golem:'rare',
  troll:'uncommon', orc:'uncommon', skeleton:'uncommon', snake:'uncommon',
  wisp:'uncommon', harpy:'uncommon', bandit:'uncommon',
};

// Ascension tiers (gem names) — each tier gives +3 base stats AND +0.5 growth
var ASCENSION_TIERS = [
  {tier:'ruby',      cost:5,  baseBonus:3, growthBonus:0.5},
  {tier:'emerald',   cost:10, baseBonus:3, growthBonus:0.5},
  {tier:'sapphire',  cost:20, baseBonus:3, growthBonus:0.5},
  {tier:'turquoise', cost:40, baseBonus:3, growthBonus:0.5},
  {tier:'amethyst',  cost:80, baseBonus:3, growthBonus:0.5},
];

function getCreatureRarity(e){
  if(!e) return 'common';
  if(RARITY_OVERRIDES[e.id]) return RARITY_OVERRIDES[e.id]; // starters/bosses
  var power=(e.baseStats.str+e.baseStats.agi+e.baseStats.wis)
    +(e.growth.str+e.growth.agi+e.growth.wis)*10;
  if(power>=110) return 'legendary';
  if(power>=80)  return 'rare';
  if(power>=62)  return 'uncommon';
  return 'common';
}

// Legacy compatibility — now just ensures playable fields are merged
function ensureEnemyChampion(id){ getCreaturePlayable(id); }
function buildEnemyChampionDeck(id){ return getCreaturePlayable(id)&&getCreaturePlayable(id).startDeck||CREATURES_PLAYABLE.thief.startDeck.slice(); }

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

  var count=Math.min(8, 4+Math.floor(level/2));
  for(var i=0;i<count;i++){
    var b=pool[i%pool.length];
    var str=Math.round(b.baseStats.str+(level-1)*b.growth.str);
    var agi=Math.round(b.baseStats.agi+(level-1)*b.growth.agi);
    var wis=Math.round(b.baseStats.wis+(level-1)*b.growth.wis);
    // Damage scaled by level multiplier: 1.2× at lv1, 3× at lv10, 5× at lv20
    var baseDmg=b.baseDmg+(level-1)*b.dmgGrowth;
    var dmgMult=1+level*0.2;
    var hp=str*5;
    enemies.push({
      id:b.id, name:b.name, icon:b.icon,
      str:str, agi:agi, wis:wis,
      baseHp:hp,
      dmgMult:dmgMult,  // applied to all card.value in executeEnemyCard
      atkInterval:calcDrawInterval(agi),
      gold:b.gold, xp:Math.round(8+level*10),
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
// Merges CREATURES_PLAYABLE overrides (for starters) with base CREATURES data.
// For enemy-derived creatures: auto-generates playable fields on first access.
function getCreaturePlayable(id){
  var c=CREATURES[id]; if(!c) return null;
  if(c._playableMerged) return c;
  // Merge in starter overrides if they exist
  var over=CREATURES_PLAYABLE[id];
  if(over) Object.assign(c, over);
  // Auto-generate playable fields for enemy creatures
  if(!c.playable){ c.playable=false; }
  if(!c.role){ var r=getCreatureRarity(c); c.role={common:'FIGHTER',uncommon:'WARRIOR',rare:'CHAMPION',legendary:'LEGEND'}[r]||'FIGHTER'; }
  if(!c.desc && c.innate) c.desc=c.innate.desc||'';
  if(!c.statPips) c.statPips={str:Math.max(1,Math.round(c.growth.str*2)),agi:Math.max(1,Math.round(c.growth.agi*2)),wis:Math.max(1,Math.round(c.growth.wis*2))};
  if(!c.innateName&&c.innate) c.innateName=c.innate.name;
  if(!c.innateDesc&&c.innate) c.innateDesc=c.innate.desc;
  if(c.innateActive===undefined) c.innateActive=false;
  if(c.innateCost===undefined) c.innateCost=0;
  // startDeck: use CREATURES_PLAYABLE.startDeck, CREATURE_DECKS, or fall back to thief deck
  if(!c.startDeck){
    if(CREATURE_DECKS&&CREATURE_DECKS[id]){
      c.startDeck=CREATURE_DECKS[id].cards.slice();
      c.sanctumAlts=CREATURE_DECKS[id].alts||[];
    } else {
      c.startDeck=(CREATURES_PLAYABLE.thief.startDeck).slice();
    }
  }
  c._playableMerged=true;
  return c;
}

function buildStartDeck(champId){
  var c=getCreaturePlayable(champId);
  var mods=getSanctumMods(champId);

  // If the deck editor has saved an override, use it directly
  if(mods.deckOverride && mods.deckOverride.length > 0){
    var base = mods.deckOverride.slice();
    // Pad to current STR cap with filler if needed
    var cp=getChampPersist(champId);
    var cap=calcDeckCap(cp.stats.str);
    while(base.length<cap) base.push('filler');
    return base;
  }

  var base=c&&c.startDeck ? c.startDeck.slice() : CREATURES_PLAYABLE.thief.startDeck.slice();
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
  // Pad with filler cards up to current STR-based deck cap
  var cp=getChampPersist(champId);
  var cap=calcDeckCap(cp.stats.str);
  while(base.length<cap) base.push('filler');
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
    enemyShell:0, enemyHardened:0, enemyCardCount:0,
    enemyDrawPool:[], enemyDiscardPile:[], enemyHand:[],
    enemyMana:0, enemyMaxMana:0, enemyManaRegen:0, enemyManaAccum:0, _innCooldown:0,
    lastEnemyCard:null, goblinAlarmFired:false, skeletonUndyingUsed:false,
    roachSwarmUsed:false, adaptiveStacks:0,
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
    holyShieldActive:false,
    nextCardCrit:false,
    killedEnemyIds:[],
    _frenziedAcc:0, _frenziedStacks:0,
    _skitterAcc:0,
    _damageTaken:0,
    // Player creature innate flags
    _toughHideActive:false,
    _goldenReserves:false,
    _soulSiphon:false,
    _effigyFree:false,
    _spreadingSporesCount:0,
    _sporeBurstAcc:0,
    _deepRootsAcc:0,
    _bulwarkReady:false,
    _frenzyBiteStacks:0,
    _goblinRallied:false,
    _bloatShieldActive:false,
    // New mechanic state
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
    _swarmAntUsed:false, // tracks enemy IDs defeated this run for card reward pool
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
        +'<div class="champ-role">'+ch.role+'</div>'
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
  document.getElementById('csp-role').textContent=ch.role||'';
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
  document.getElementById('e-str').textContent=e.str;
  document.getElementById('e-agi').textContent=e.agi;
  document.getElementById('e-wis').textContent=e.wis;
  document.getElementById('e-tags').innerHTML='';
  if(e.innate) addInnateTag('enemy',e.innate);
  trackSeen(e.id);
  // Reset per-enemy flags
  gs.enemyShell=0; gs.enemyHardened=(e.innate&&e.innate.id==='hardened')?2:0;
  gs.goblinAlarmFired=false; gs.skeletonUndyingUsed=false;
  gs.enemyCardCount=0; gs.lastEnemyCard=null;
  gs.enemyHand=[]; gs.roachSwarmUsed=false; gs.adaptiveStacks=0;
  // Enemy mana — scales with WIS like player
  var eManaMax=Math.round(e.wis*8+40);
  gs.enemyMaxMana=eManaMax; gs.enemyMana=0;
  gs.enemyManaRegen=Math.round(e.wis*1.2+3); gs.enemyManaAccum=0; gs._innCooldown=0;
  // Mistwoods per-fight state
  gs.playerRooted=false; gs._rooterAcc=0;
  gs.playerDrawDelay=0;
  gs.enemyDodge=(e.innate&&e.innate.id==='mist_veil');
  gs.enemyDodgeProcReady=false;
  gs._silktrapFired=false;
  // Wax Dunes per-fight state
  gs._brittleShellFired=false;
  gs._waxMeltAcc=0;
  gs._waxTimerAcc=0;
  gs.waxDamageDealt=0;
  gs.holyShieldActive=false;
  gs._frenziedAcc=0; gs._frenziedStacks=0;
  gs._skitterAcc=0;
  gs._seepAcc=0; gs._accumAcc=0; gs._accumStacks=0;
  gs._digInAcc=0; gs._digInFired=false;
  gs._magmaAcc=0;
  gs._lureApplied=false;
  gs._inkCloudUsed=false;
  gs._moltenCoreFired=false;
  gs._frenzyFired=false;
  gs._sporeHits=0;
  gs._swarmAntUsed=false;
  // Scout's Alarm: apply Rallying countdown buff at fight start
  if(e.innate&&e.innate.id==='scouts_alarm'){
    gs.goblinAlarmFired=false;
    applyStatus('enemy','buff','⚠ Rallying...',0,'scouts_rally',15000,"Scout's Alarm: rallies in 15s — gaining +40% speed and +50% damage. Kill it first!");
  }
  // Build enemy deck — supports both new format (array of card ID strings)
  // and old format (array of {id, copies, effect, value, ...} objects)
  var pool=[];
  (e.deck||[]).forEach(function(card){
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
  // On-entry innate effects
  if(e.innate&&e.innate.id==='bog_aura'){
    applyStatus('player','debuff','Bog Mud',-0.15,'drawspeed',999999,'Slows draw speed by 15%. Applied by Toad King\'s Bog Aura.');
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
  // Opening Volley — tracked per-battle, consumed in executeCard
  // (gs._shrineOpenVolley already set, consumed on card play)
  // ── Player Creature Innate effects at battle start ──
  var pInnate=CREATURES[gs.champId]&&CREATURES[gs.champId].innate;
  if(pInnate){
    // Tough Hide — first hit 50% reduced
    if(pInnate.id==='tough_hide') gs._toughHideActive=true;
    // Golden Reserves — 80% faster mana regen (applied via mRegenMult in gameTick)
    if(pInnate.id==='golden_reserves') gs._goldenReserves=true;
    // Soul Siphon — mana on kill (checked in trackKill)
    if(pInnate.id==='soul_siphon') gs._soulSiphon=true;
    // Effigy — first card this battle costs no mana
    if(pInnate.id==='effigy') gs._effigyFree=true;
    // Rapid Assault — draw interval permanently -15% (applied once per run in makeGS, stacks with battle bonuses)
    if(pInnate.id==='rapid_assault') gs.drawSpeedBonus=(gs.drawSpeedBonus||1)+0.15;
    // Bog Aura (player) — reduce enemy attack speed permanently
    if(pInnate.id==='bog_aura'){
      applyStatus('enemy','debuff','Bog Aura',-0.15,'atkspeed',9999999,'Bog Aura: enemy -15% attack speed permanently.');
      addLog('Bog Aura! Enemy slowed.','buff');
    }
  }
  for(var i=0;i<startCards;i++) doDraw(null,true);

  startLoops();
}
function startLoops(){ stopLoops(); tickTimer=setInterval(gameTick,100); scheduleEnemyAction(); }
function stopLoops(){ clearInterval(tickTimer); tickTimer=null; clearTimeout(enemyTimer); enemyTimer=null; clearInterval(_enemyDrawBarTimer); _enemyDrawBarTimer=null; }

function gameTick(){
  if(paused||!gs||!gs.running) return;
  tickStatuses(100); tickDoTs(100); tickEnemyInnates(100);
  // Battle timer (used by Goblin War Cry rally check)
  gs._battleTimeMs=(gs._battleTimeMs||0)+100;
  // Bloat Shield — apply Poison to enemy while shield is active
  if(gs._bloatShieldActive&&gs.playerShield>0){
    var bsP=gs.statusEffects.enemy.find(function(s){return s.id==='bloat_poison';});
    if(!bsP){gs.statusEffects.enemy.push({id:'bloat_poison',label:'Bloat Poison',cls:'debuff',stat:'dot',remaining:9999999,maxRemaining:9999999,dot:true,dpt:2,tickMs:1000,tickAcc:0,desc:'Bloat: 2/s while shield holds.'});}
  } else {
    gs.statusEffects.enemy=gs.statusEffects.enemy.filter(function(s){return s.id!=='bloat_poison';});
  }
  updateTagTimers();
  // Mana regen — applies mana_regen debuffs from statuses (Lich, Watcher, etc.)
  var mRegenMult=1;
  getStatuses('player','mana_regen').forEach(function(s){ mRegenMult=Math.max(0.1,mRegenMult+s.val); });
  // Golden Reserves — 80% faster mana regen
  if(gs._goldenReserves) mRegenMult*=1.8;
  // Cursed Conviction (Paladin) — +50% mana regen while Burn is active on enemy
  if(gs.champId==='paladin'){
    var hasBurn=gs.statusEffects.enemy.some(function(s){return s.id==='burn'&&s.dpt>0;});
    if(hasBurn) mRegenMult*=1.5;
  }
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
  // Enemy innate cooldown tick
  if(gs._innCooldown>0) gs._innCooldown=Math.max(0,gs._innCooldown-100);
  // on_timer innate triggers
  var _eInn=gs.enemies[gs.enemyIdx]&&gs.enemies[gs.enemyIdx].innate;
  if(_eInn&&_eInn.trigger==='on_timer'&&gs._innCooldown===0){
    enemyCheckActivateInnate(gs.enemies[gs.enemyIdx]);
  }

  // ── Player Creature passive innate ticks ──
  // Spore Burst — apply Poison to enemy every 8s
  if(gs._goldenReserves===undefined){ } // skip if not set
  if(CREATURES[gs.champId]&&CREATURES[gs.champId].innate){
    var pi=CREATURES[gs.champId].innate;
    if(pi.id==='spore_burst'){
      gs._sporeBurstAcc=(gs._sporeBurstAcc||0)+100;
      if(gs._sporeBurstAcc>=8000){ gs._sporeBurstAcc=0;
        applyDoT('player_vs_enemy','spore_dot',3,2000,6000,'Spore Burst: 3/2s');
        applyStatus('enemy','debuff','Spore Burst',-0.03,'dot_dummy',6000,'Spore Burst: poisoned by spores.');
        addLog('Spore Burst! Poison applied to enemy.','buff'); }
    }
    if(pi.id==='deep_roots'){
      gs._deepRootsAcc=(gs._deepRootsAcc||0)+100;
      if(gs._deepRootsAcc>=5000){ gs._deepRootsAcc=0;
        if(gs.playerHp<gs.playerMaxHp){ gs.playerHp=Math.min(gs.playerMaxHp,gs.playerHp+2); spawnHealNum('player',2); flashHpBar('player','hp-flash-green'); }
      }
    }
    if(pi.id==='spreading_spores'){
      // Tracked per-card-played via gs._spreadingSporesCount, applied in executeCard
    }
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
  // slow_draw: add flat ms to draw interval (non-stacking, just one instance)
  var slowDraw=gs.statusEffects.enemy.find(function(s){return s.stat==='slow_draw';});
  if(slowDraw) interval+=slowDraw.val||600;
  // Harbourmaster / Waterlogged: 50% slower attack but triple damage (handled in applyEnemyDmgMods)
  if(e.innate&&(e.innate.id==='harbourmaster'||e.innate.id==='waterlogged')) interval=Math.round(interval*1.5);
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
  var handSize=e.handSize||1;
  // Draw one card into hand; if at capacity, oldest auto-plays first (FIFO)
  if(gs.enemyHand.length>=handSize){
    var toPlay=gs.enemyHand.shift();
    playEnemyCard(toPlay,e);
  }
  var drawn=enemyDrawCard(e);
  if(drawn) gs.enemyHand.push(drawn);
  // If hand was empty (first draw), play immediately
  if(gs.enemyHand.length===1&&handSize===1){
    playEnemyCard(gs.enemyHand.shift(),e);
  }
  // Check if active innate can fire after this action
  enemyCheckActivateInnate(e);
}

// ── Enemy Active Innate Trigger System ──────────────────────────
// Creatures with innate.trigger:'mana_full' fire when mana >= cost.
// Creatures with innate.trigger:'hp_below' fire when HP <= threshold.
// Creatures with innate.trigger:'on_timer' fire every innate.cooldown ms.
// Passive innates (trigger:'passive' or no trigger) need no AI here.
function enemyCheckActivateInnate(e){
  if(!e||!e.innate) return;
  var inn=e.innate;
  // Support both old trigger format and new active/cost format
  var cost=inn.cost||inn.manaCost||0;
  var trigger=inn.trigger||(inn.active?'mana_threshold':'passive');
  if(trigger==='passive') return;
  // Cooldown guard
  if(gs._innCooldown>0) return;

  var shouldFire=false;
  if(trigger==='mana_full'&&gs.enemyMana>=gs.enemyMaxMana&&gs.enemyMaxMana>0) shouldFire=true;
  if(trigger==='mana_threshold'&&cost>0&&gs.enemyMana>=cost) shouldFire=true;
  if(trigger==='hp_below'&&inn.triggerValue&&gs.enemyHp<=(gs.enemyMaxHp*(inn.triggerValue||0.5))) shouldFire=true;

  if(!shouldFire) return;
  if(cost>0&&gs.enemyMana<cost) return;
  gs.enemyMana=Math.max(0,gs.enemyMana-cost);
  // Set cooldown — support new cooldown field (ms) or old (ms)
  gs._innCooldown=inn.cooldown||8000;
  executeEnemyInnateEffect(inn,e);
}

function executeEnemyInnateEffect(inn,e){
  addLog(e.name+' — '+inn.name+'.','innate');
  var id=inn.id;

  // ── New Sewers innates ──

  // Spite Spines — Convert oldest hand card to Spite (Ethereal), play immediately
  if(id==='spite_spines'){
    var spite={id:'spite_ethereal',name:'Spite',effect:'spite',ghost:true,
      value:Math.max(1,Math.floor((gs.enemyMaxHp-gs.enemyHp)/4)),
      thornsVal:8, thornsDur:6000};
    // Remove oldest card from hand if any, otherwise just play Spite
    if(gs.enemyHand.length>0) gs.enemyHand.shift();
    // Apply Spite effects
    var spiteDmg=spite.value;
    if(spiteDmg>0){ dealDamageToPlayer(spiteDmg); addLog(e.name+' — Spite! '+spiteDmg+' dmg.','innate'); }
    applyStatus('player','buff','Thorns',spite.thornsVal,'thorns',spite.thornsDur,'Thorns: reflects '+spite.thornsVal+' dmg per hit.');
    addLog(e.name+' — [Thorns] ('+spite.thornsVal+') applied to self.','buff');
    return;
  }

  // Volatile Injection — apply 2 Volatile stacks to self (as enemy, targets player)
  if(id==='volatile_injection'){
    _applyVolatile(2);
    addLog(e.name+' — Volatile Injection! +2 [Volatile].','innate');
    return;
  }

  // Feast on Carrion — Shield from discard pile × 4, then Refresh
  if(id==='feast_on_carrion'){
    var discardCount=gs.enemyDiscardPile.length;
    var shieldAmt=discardCount*4;
    if(shieldAmt>0){
      gs.enemyShell+=shieldAmt;
      addTag('enemy','buff','Carrion Shield ('+shieldAmt+')',null,null,'Shield from '+discardCount+' discarded cards.');
      setTimeout(function(){ if(!gs) return; gs.enemyShell=Math.max(0,gs.enemyShell-shieldAmt); }, 5000);
      addLog(e.name+' — Feast! Shield +'+shieldAmt+' ('+discardCount+' cards).','buff');
    }
    // Refresh enemy deck
    gs.enemyDrawPool=gs.enemyDrawPool.concat(gs.enemyDiscardPile.splice(0));
    for(var ri=gs.enemyDrawPool.length-1;ri>0;ri--){
      var rj=Math.floor(Math.random()*(ri+1));
      var rt=gs.enemyDrawPool[ri]; gs.enemyDrawPool[ri]=gs.enemyDrawPool[rj]; gs.enemyDrawPool[rj]=rt;
    }
    addLog(e.name+' — [Refresh] deck.','innate');
    return;
  }

  // Self-heal
  if(inn.effect==='self_heal'){
    var healAmt=Math.round((inn.value||0.2)*gs.enemyMaxHp);
    gs.enemyHp=Math.min(gs.enemyMaxHp,gs.enemyHp+healAmt);
    spawnFloatNum('enemy','+'+healAmt,false,'heal-num');
    flashHpBar('enemy','hp-flash-green');
    updateAll();
  }
  // Apply DoT to player
  else if(inn.effect==='dot'){
    applyDoT('player',id+'_dot',inn.dotDmg||3,inn.dotTick||2000,inn.dotDur||6000,inn.name+': '+(inn.dotDmg||3)+' dmg/'+(inn.dotTick||2000)/1000+'s');
  }
  // Speed burst for enemy
  else if(inn.effect==='speed_burst'){
    applyStatus('enemy','buff',inn.name,inn.value||0.3,'atkspeed',inn.dur||4000,inn.name+': +'+(Math.round((inn.value||0.3)*100))+'% atk speed for '+(inn.dur||4000)/1000+'s.');
  }
  // Damage buff
  else if(inn.effect==='dmg_buff'){
    applyStatus('enemy','buff',inn.name,inn.value||0.25,'dmg',inn.dur||5000,inn.name+': +'+(Math.round((inn.value||0.25)*100))+'% damage for '+(inn.dur||5000)/1000+'s.');
  }
  // Shield
  else if(inn.effect==='shield'){
    var shAmt=Math.round((inn.value||6)*(e.str||1));
    gs.enemyShell=(gs.enemyShell||0)+shAmt;
    addTag('enemy','shield',inn.name,null,null,'Absorbs '+shAmt+' dmg per hit.');
    var dur=inn.dur||5000;
    setTimeout(function(){ if(gs){ gs.enemyShell=Math.max(0,gs.enemyShell-shAmt); removeTagByLabel('enemy',inn.name); } },dur);
  }
  // Debuff player mana regen
  else if(inn.effect==='mana_drain'){
    applyStatus('player','debuff',inn.name,-(inn.value||0.3),'mana_regen',inn.dur||6000,inn.name+': mana regen -'+(Math.round((inn.value||0.3)*100))+'% for '+(inn.dur||6000)/1000+'s.');
  }
  // Direct damage burst
  else if(inn.effect==='dmg_burst'){
    var dmgAmt=Math.round((inn.value||8)*(e.dmgMult||1));
    dealDamageToPlayer(applyEnemyDmgMods(dmgAmt,e));
  }
  // Dodge grant
  else if(inn.effect==='dodge'){
    gs.enemyDodge=true;
    addTag('enemy','buff','Dodge',0,'',''+inn.name+': next hit evaded.');
  }
  updateAll(); checkEnd();
}
// ────────────────────────────────────────────────────────────────

function playEnemyCard(card,e){
  gs.lastEnemyCard=card;
  gs.enemyCardCount++;

  // Light Fingers — enemy drains 5 player mana on every card play
  if(e.innate&&e.innate.id==='light_fingers'){
    gs.mana=Math.max(0,gs.mana-5);
    addLog(e.name+' — Light Fingers: -5 mana.','mana');
    updateAll();
  }
  // Waterlogged — enemy's Sorcery[15]: Apply Slow fires if enemy has ≥15 mana
  if(e.innate&&e.innate.id==='waterlogged'){
    if(gs.enemyMana>=15){
      gs.enemyMana-=15;
      // Apply Slow to player draw interval
      var existingSlow=gs.statusEffects.player.find(function(s){return s.stat==='slow_draw';});
      if(existingSlow){ existingSlow.remaining=4000; }
      else { gs.statusEffects.player.push({id:'slow_player',label:'Slow',cls:'debuff',stat:'slow_draw',val:600,remaining:4000,maxRemaining:4000,desc:'Slow: draw interval +600ms.'}); addTag('player','debuff','Slow',0,'slow_draw','Slow: draw interval +600ms.'); }
      addLog(e.name+' — Waterlogged: [Slow] applied to you.','debuff');
    }
  }

  var mult=1;
  if(e.innate&&(e.innate.id==='ambush'||e.innate.id==='poison_ambush'||e.innate.id==='silent_strike')&&gs.enemyCardCount===1){
    mult=2; addLog(e.name+' — Ambush. Double damage.','innate');
    if(e.innate.id==='poison_ambush'){
      var pa=gs.statusEffects.player.find(function(s){return s.id==='poison';});
      if(pa){pa.dpt+=8;pa.remaining=8000;}
      else{gs.statusEffects.player.push({id:'poison',label:'Poison (8/2s)',cls:'debuff',stat:'dot',remaining:8000,maxRemaining:8000,dot:true,dpt:8,tickMs:2000,tickAcc:0,desc:'Poison Ambush: 8/2s.'});addTag('player','debuff','Poison (8/2s)',0,'dot','Poison Ambush!');}
      addLog('Poison Ambush — +8 Poison.','innate');
    }
    if(e.innate.id==='silent_strike'){
      gs.enemyDodge=true;
      addTag('enemy','buff','Dodge',0,'','Silent Strike: dodges after the first hit.');
      addLog('Silent Strike — '+e.name+' gains [Dodge].','innate');
    }
  }
  if(e.innate&&e.innate.id==='swoop'&&gs.enemyCardCount%4===0){ mult*=2; addLog(e.name+' — Swoop. ×2 damage.','innate'); }
  if(e.innate&&e.innate.id==='slither'&&gs.enemyCardCount%3===0){
    applyDoT('player','venom_slither',2,2000,6000,'Venom (Slither): 2 dmg/2s');
    addLog(e.name+' — Slither. Venom 2/2s.','innate');
  }

  var logCls=card.effect==='self_buff'||card.effect==='self_heal'||card.effect==='self_shell'?'buff':'debuff';
  addLog(e.name+' — '+card.name+'.', logCls);
  executeEnemyCard(card,e,mult);
  gs.enemyDiscardPile.push(card);
  updateAll(); checkEnd();
}

function executeEnemyCard(card,e,mult){
  mult=mult||1;
  var levelMult=e.dmgMult||1; // area-level damage scaling

  // New format: card ID string resolved through CARDS + EFFECT_TYPES
  if(card._new&&card.id){
    var cDef=CARDS[card.id];
    if(cDef&&cDef.effects&&cDef.effects.length){
      // Build enemy-perspective pdmg (applies level scaling)
      var ePdmg=function(base){ return Math.max(1,Math.round(base*mult*levelMult)); };
      var eStat=e||{};
      // Filthy Persistence: extend debuff durations by 50%
      var _debuffMult=(e.innate&&e.innate.id==='filthy_persistence')?1.5:1;
      executeEnemyEffects(cDef.effects, ePdmg, cDef.name, e, _debuffMult);
    }
    return;
  }

  // Lurk: first card double damage
  if(e.innate&&e.innate.id==='lurk'&&gs.enemyCardCount===1) mult*=2;
  // Infectious: extend DoT durations by 40%
  var dotDurMult=(e.innate&&e.innate.id==='infectious')?1.4:1;
  var val=Math.round((card.value||0)*mult*levelMult);

  if(card.effect==='dmg'){
    dealDamageToPlayer(applyEnemyDmgMods(Math.max(1,val),e));
  } else if(card.effect==='dmg_and_debuff'){
    dealDamageToPlayer(applyEnemyDmgMods(Math.max(1,val),e));
    applyStatus('player','debuff',card.status||'debuffed',card.debuffVal,
      (card.status&&(card.status.indexOf('speed')!==-1||card.status==='pinched'||card.status==='constricted'))?'atkspeed':'dmg',
      card.debuffDur,'Enemy debuff: '+(Math.abs(card.debuffVal||0)*100|0)+'% for '+(card.debuffDur/1000)+'s');
  } else if(card.effect==='dmg_and_dot'){
    dealDamageToPlayer(applyEnemyDmgMods(Math.max(1,val),e));
    var dotDmg=Math.round((card.dotDmg||1)*levelMult);
    applyDoT('player',card.status||'dot',dotDmg,card.dotTick,Math.round(card.dotDur*dotDurMult),card.name+': '+dotDmg+' dmg/'+card.dotTick/1000+'s');
  } else if(card.effect==='dot'){
    var dotDmg2=Math.round((card.dotDmg||1)*levelMult);
    applyDoT('player',card.status||'dot',dotDmg2,card.dotTick,Math.round(card.dotDur*dotDurMult),card.name+': '+dotDmg2+' dmg/'+card.dotTick/1000+'s');
  } else if(card.effect==='self_buff'){
    if(card.status==='haste_rat'||card.status==='airborne'||card.status==='fleeing'||card.status==='roach_evade'||card.status==='wisp_evade'){
      applyStatus('enemy','buff',card.status,card.value||0,'atkspeed',card.dur||2000,'Attack speed +'+(Math.round((card.value||0)*100))+'%');
      // Apply damage reduction if card defines dmgMult (e.g. fleeing goblin hits softer)
      if(card.dmgMult&&card.dmgMult<1){
        applyStatus('enemy','debuff','fleeing_dmg',card.dmgMult,'fleeing_dmg',card.dur||2000,'Deals '+(Math.round(card.dmgMult*100))+'% damage while fleeing.');
      }
    } else if(card.status==='shell'||card.status==='grub_shield'||card.status==='amalgam_shield'){
      var shieldAmt=Math.round((card.value||2)*levelMult);
      gs.enemyShell=(gs.enemyShell||0)+shieldAmt;
      var sLabel=card.status==='grub_shield'?'Bloat Shield':card.status==='amalgam_shield'?'Absorb':'Shell';
      addTag('enemy','shield',sLabel,null,null,'Absorbs '+shieldAmt+' dmg per hit');
      setTimeout(function(){ gs.enemyShell=0; removeTagByLabel('enemy',sLabel); },card.dur||4000);
    } else if(card.status==='fortified'){
      var fAmt=Math.round((card.value||5)*levelMult);
      gs.enemyShell=(gs.enemyShell||0)+fAmt;
      addTag('enemy','shield','Fortified',null,null,'Absorbs '+fAmt+' dmg per hit');
      setTimeout(function(){ gs.enemyShell=0; removeTagByLabel('enemy','Fortified'); },card.dur);
    } else {
      applyStatus('enemy','buff',card.status,card.value||0,'dmg',card.dur||4000,'Damage +'+(Math.round((card.value||0)*100))+'%');
    }
  } else if(card.effect==='self_heal'){
    var healAmt=Math.round((card.value||3)*levelMult);
    gs.enemyHp=Math.min(gs.enemyMaxHp,gs.enemyHp+healAmt);
    addLog(e.name+' heals '+healAmt+' HP!','heal');
    updateAll();
  } else if(card.effect==='stun_player'){
    var stunMs=card.value||600;
    gs.drawSpeedBonus=Math.max(0.2,gs.drawSpeedBonus*0.5);
    gs.drawSpeedBonusTimer=Math.max(gs.drawSpeedBonusTimer,stunMs);
    applyStatus('player','debuff','Stunned',-0.5,'drawspeed',stunMs,'Briefly stunned! Draw speed halved.');
    addLog('You are stunned for '+(stunMs/1000).toFixed(1)+'s!','debuff');
  } else if(card.effect==='self_shell'){
    // Bark Armour / self-block
    var shAmt=Math.round((card.value||8)*levelMult);
    gs.enemyShell=(gs.enemyShell||0)+shAmt;
    addTag('enemy','shield','Bark Armour',null,null,'Absorbs '+shAmt+' dmg per hit');
    setTimeout(function(){ gs.enemyShell=Math.max(0,gs.enemyShell-shAmt); removeTagByLabel('enemy','Bark Armour'); },card.dur||4000);
    addLog(e.name+' hardens its bark, blocking '+shAmt+' damage!','buff');
  } else if(card.effect==='root_player'){
    // Night Entling root — freeze player draws
    var rootMs=card.value||2500;
    gs.playerRooted=true;
    addTag('player','debuff','Rooted',null,null,'Cannot draw for '+(rootMs/1000).toFixed(1)+'s!');
    addLog('Roots erupt! You cannot draw for '+(rootMs/1000).toFixed(1)+'s!','debuff');
    spawnFloatNum('player','🌿ROOTED',false,'block-num');
    setTimeout(function(){
      if(gs){ gs.playerRooted=false; removeTagByLabel('player','Rooted'); }
    },rootMs);
  } else if(card.effect==='drain_mana'){
    // Foghast drain
    var drainAmt=Math.round((card.drainMana||15)*levelMult);
    var dmgAmt=Math.round((card.value||8)*levelMult);
    if(dmgAmt>0) dealDamageToPlayer(applyEnemyDmgMods(Math.max(1,dmgAmt),e));
    if(gs.mana>=drainAmt){ gs.mana-=drainAmt; addLog(e.name+' drains '+drainAmt+' mana!','debuff'); spawnFloatNum('player','-'+drainAmt+'✦',false,'resist-num'); }
    else { var drained=gs.mana; gs.mana=0; addLog(e.name+' drains all mana ('+drained+')!','debuff'); }
    updateAll();
  } else if(card.effect==='drain_mana_only'){
    var dmOnly=Math.round((card.value||20)*levelMult);
    if(gs.mana>=dmOnly){ gs.mana-=dmOnly; addLog(e.name+' chills your mind, draining '+dmOnly+' mana!','debuff'); }
    else { gs.mana=0; addLog(e.name+' drains all mana!','debuff'); }
    spawnFloatNum('player','-'+dmOnly+'✦',false,'resist-num'); updateAll();
  } else if(card.effect==='slow_draw'){
    // Draw speed debuff — add to player's draw timer
    var slMs=card.value||1000;
    var slDur=card.dur||4000;
    gs.playerDrawDelay=(gs.playerDrawDelay||0)+slMs;
    applyStatus('player','debuff','Slowed',0,'drawspeed',slDur,'Draw speed reduced by '+(slMs/1000)+'s for '+(slDur/1000)+'s');
    addLog('Your draws are slowed for '+(slDur/1000)+'s!','debuff');
    spawnFloatNum('player','🕸SLOW',false,'block-num');
    setTimeout(function(){ if(gs) gs.playerDrawDelay=Math.max(0,(gs.playerDrawDelay||0)-slMs); },slDur);
  } else if(card.effect==='discard'){
    // Scatter a card from player's hand
    if(gs.hand.length>0){
      var discIdx=Math.floor(Math.random()*gs.hand.length);
      var discCard=gs.hand.splice(discIdx,1)[0];
      if(!discCard.ghost) gs.discardPile.push(discCard.id);
      addLog(e.name+' scatters '+(CARDS[discCard.id]?CARDS[discCard.id].name:discCard.id)+' from your hand!','debuff');
      spawnFloatNum('player','✦SCATTER',false,'dodge-num');
      renderHand(); renderPiles();
    }
  } else if(card.effect==='dmg_multi'){
    // Multi-hit
    var hits=card.hits||3;
    var hitVal=Math.max(1,Math.round((card.value||4)*levelMult));
    addLog(e.name+' attacks '+hits+'×!','enemy');
    for(var h=0;h<hits;h++){
      dealDamageToPlayer(applyEnemyDmgMods(hitVal,e));
    }
  } else if(card.effect==='dmg_dot'){
    // Damage + DoT (spider venom)
    dealDamageToPlayer(applyEnemyDmgMods(Math.max(1,val),e));
    var dotDmgV=Math.round((card.dotDmg||3)*levelMult);
    applyDoT('player',card.status||'venom',dotDmgV,card.dotTick||2000,Math.round((card.dotDur||6000)*dotDurMult),card.name+': '+dotDmgV+' dmg every '+(card.dotTick/1000)+'s');
  } else if(card.effect==='haste'){
    // Speed buff for enemy
    applyStatus('enemy','buff','Haste',card.value||0.4,'atkspeed',card.dur||3000,'Attack speed +'+(Math.round((card.value||0.4)*100))+'%');
  } else if(card.effect==='self_dodge'){
    // Enemy self-dodge
    gs.enemyDodge=true;
    addTag('enemy','buff','Dodge',null,null,'Next hit will be dodged');
    addLog(e.name+' prepares to dodge!','buff');
  } else if(card.effect==='mimic_last'){
    // Wax Effigy: mirror the last card the player played
    var mirrorId=gs.lastPlayerCard||null;
    var dmgTable={
      strike:18, brace:0, void_bolt:12+gs.stats.wis, drifting_comet:16,
      nova_burst:20, stellar_shards:21, retribution:22, holy_shield:0,
      consecrate:12, quick_slash:10+gs.stats.agi, backstab:35, poison_dart:0,
      smoke_bomb:0, shadow_step:0, death_mark:0,
    };
    var scale=card.value||0.7;
    var baseDmg=mirrorId?(dmgTable[mirrorId]||10):8;
    var mimicDmg=Math.max(1,Math.round(baseDmg*scale*mult));
    var mirrorName=mirrorId&&CARDS[mirrorId]?CARDS[mirrorId].name:'Unknown Move';
    if(mirrorId&&baseDmg>0){
      addLog(e.name+' mimics your '+mirrorName+'! ('+mimicDmg+' dmg)','innate');
      dealDamageToPlayer(applyEnemyDmgMods(mimicDmg,e));
    } else if(mirrorId){
      addLog(e.name+' mimics '+mirrorName+' — no effect.','innate');
    } else {
      // Nothing played yet — basic wax strike
      var fallback=Math.max(1,Math.round(6*mult));
      addLog(e.name+' finds nothing to mimic — basic strike! ('+fallback+' dmg)','enemy');
      dealDamageToPlayer(applyEnemyDmgMods(fallback,e));
    }
  } else if(card.effect==='force_autoplay'){
    forceAutoplay();
  }
}


function applyEnemyDmgMods(dmg,e){
  // Enemy buffs that increase their own attack
  getStatuses('enemy','dmg').forEach(function(s){ if(s.val>0) dmg=Math.round(dmg*(1+s.val)); });
  // Enemy debuffs that reduce their own attack (Cursed, Hex, etc.) — stat:'dmg' with negative val
  getStatuses('enemy','dmg').forEach(function(s){ if(s.val<0) dmg=Math.round(dmg*(1+s.val)); });
  // Player debuffs that reduce incoming damage (player shields, resistances)
  getStatuses('player','dmg').forEach(function(s){ if(s.val<0) dmg=Math.round(dmg*(1+s.val)); });
  if(e.innate&&e.innate.id==='battle_rage'&&gs.enemyHp<=(gs.enemyMaxHp/3)) dmg*=2;
  if(e.innate&&e.innate.id==='ancient_fury'&&gs.enemyHp<=(gs.enemyMaxHp/4)) dmg*=2;
  if(e.innate&&(e.innate.id==='harbourmaster'||e.innate.id==='waterlogged')) dmg=Math.round(dmg*3); // slow but devastating
  if(getStatus('enemy','fleeing_dmg')) dmg=Math.round(dmg*0.8);
  if(e.innate&&e.innate.id==='filth_armour') dmg=Math.max(1,dmg-1);
  if(e.innate&&e.innate.id==='adaptive'&&gs.adaptiveStacks>0){
    var resist=1-(gs.adaptiveStacks*0.08);
    dmg=Math.max(1,Math.round(dmg*resist));
  }
  return Math.max(1,Math.round(dmg));
}

function applyPlayerDmgMods(dmg,e){
  // Lurk: first enemy card deals double damage
  if(e.innate&&e.innate.id==='lurk'&&gs.enemyCardCount===1) dmg*=2;
  // Ambush handled in playEnemyCard
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

function dealDamageToPlayer(dmg){
  // Paladin Holy Shield — active: 80% of hit routes to mana while shield is up
  if(gs.champId==='paladin'&&gs.holyShieldActive&&gs.mana>0&&dmg>0){
    var routeAmt=Math.floor(dmg*0.8);
    var drained=Math.min(gs.mana,routeAmt);
    gs.mana-=drained; dmg=dmg-drained; // remaining 20% (or more if mana ran out) hits HP
    if(drained>0){
      spawnFloatNum('player','🛡 '+drained,false,'block-num');
      flashHpBar('player','hp-flash-blue');
      addLog('Holy Shield routes '+drained+' dmg to mana! ('+Math.round(dmg)+' bleeds through)','buff');
      updateAll();
      if(gs.mana<=0){ gs.holyShieldActive=false; removeTagByLabel('player','Shielded'); addLog('Holy Shield exhausted — mana drained!','debuff'); }
    }
  }
  // Dodge — full evade
  if(gs.playerDodge){
    gs.playerDodge=false;
    removeTagByLabel('player','Dodge');
    addLog('Dodged! No damage taken.','buff');
    spawnFloatNum('player','DODGE',false,'dodge-num');
    shakeIcon('player',false);
    return;
  }
  // Shield absorption
  if(gs.playerShield>0){
    var b=Math.min(gs.playerShield,dmg); gs.playerShield-=b; dmg-=b;
    if(b>0){
      addLog('Shield absorbs '+b+'!','buff');
      spawnFloatNum('player','🛡 '+b,false,'block-num');
      flashHpBar('player','hp-flash-blue');
    }
    if(gs.playerShield<=0){
      gs.playerShield=0; removeTagsByClass('player','shield');
      if(gs.playerShieldMana>0){ gs.mana=Math.min(gs.maxMana,gs.mana+gs.playerShieldMana); addLog('Shield converted to +'+gs.playerShieldMana+' mana.','mana'); gs.playerShieldMana=0; }
    }
  }
  dmg=Math.max(0,dmg);
  // Tough Hide — first hit each battle deals 50% less damage
  if(gs._toughHideActive&&dmg>0){ dmg=Math.max(1,Math.round(dmg*0.5)); gs._toughHideActive=false; addLog('Tough Hide absorbs half the blow!','buff'); }
  // Toxic Body — retaliate with Poison on hit
  if(dmg>0){
    var _tbInnate=CREATURES[gs.champId]&&CREATURES[gs.champId].innate;
    if(_tbInnate&&_tbInnate.id==='toxic_body'){
      var tbPoison=gs.statusEffects.enemy.find(function(s){return s.id==='poison';});
      if(tbPoison){ tbPoison.dpt+=2; tbPoison.remaining=8000; }
      else { gs.statusEffects.enemy.push({id:'poison',label:'Poison (2/2s)',cls:'debuff',stat:'dot',remaining:8000,maxRemaining:8000,dot:true,dpt:2,tickMs:2000,tickAcc:0,desc:'Toxic Body: 2/2s.'}); addTag('enemy','debuff','Poison (2/2s)',0,'dot','Toxic Body: enemy poisoned.'); }
    }
  }
  // Resilience shrine blessing
  if(gs._shrineResilience&&dmg>0) dmg=Math.max(1,Math.round(dmg*(1-gs._shrineResilience)));
  gs.playerHp=Math.max(0,gs.playerHp-dmg);
  // Relic: thorn_band — reflect damage on every hit
  if(dmg>0&&gs._relicThorns){
    var thornDmg=gs._relicThorns;
    gs.enemyHp=Math.max(0,gs.enemyHp-thornDmg);
    spawnFloatNum('enemy','-'+thornDmg,false,'crit-num');
    addLog('Thorn Band reflects '+thornDmg+' dmg.','buff');
    updateAll(); checkEnd();
  }
  // Second Wind — survive killing blow
  if(gs.playerHp<=0&&gs._shrineSecondWind&&!gs._shrineSecondWindUsed){
    gs.playerHp=gs._shrineSecondWind;
    gs._shrineSecondWindUsed=true;
    addLog('✦ Second Wind! Survived at '+gs._shrineSecondWind+' HP!','buff');
    spawnFloatNum('player','SECOND WIND!',true,'crit-num');
    flashHpBar('player','hp-flash-green');
  }
  if(dmg>0){
    gs._damageTaken=(gs._damageTaken||0)+dmg; // track for no-damage quests
    addLog('You take '+dmg+' dmg! ('+gs.playerHp+'/'+gs.playerMaxHp+' HP)','dmg');
    playDamagePlayerSfx();
    shakeIcon('player',false);
    flashHpBar('player','hp-flash-red');
    spawnFloatNum('player','-'+dmg, dmg>=50);
  } else if(dmg===0&&gs.playerShield===0){
    // Fully blocked
    spawnFloatNum('player','BLOCKED',false,'block-num');
  }
}

function dealDamageToEnemy(dmg,bypassHardened){
  var e=gs.enemies[gs.enemyIdx];
  // Skitter (Sewer Roach): dodge every 8s via skitter_dodge status
  if(e.innate&&e.innate.id==='skitter'&&getStatus('enemy','skitter_dodge')){
    var sk=gs.statusEffects.enemy.findIndex(function(s){return s.stat==='skitter_dodge';});
    if(sk!==-1){ gs.statusEffects.enemy.splice(sk,1); removeTagByLabel('enemy','Dodge'); }
    addLog('Roach skitters — attack evaded!','buff');
    spawnFloatNum('enemy','DODGE',false,'dodge-num');
    return;
  }
  // Enemy dodge (Mistraven Mist Veil, Masked Owl Silent Glide)
  if(gs.enemyDodge){
    gs.enemyDodge=false;
    removeTagByLabel('enemy','Dodge');
    addLog(e.name+' dodges the attack!','buff');
    spawnFloatNum('enemy','DODGE',false,'dodge-num');
    if(e.innate&&e.innate.id==='mist_veil') gs.enemyDodgeProcReady=true;
    return;
  }
  // Silktrapper: first hit of 10+ triggers permanent draw delay
  if(e.innate&&e.innate.id==='silktrapper'&&!gs._silktrapFired&&dmg>=10){
    gs._silktrapFired=true;
    gs.playerDrawDelay=(gs.playerDrawDelay||0)+800;
    addTag('player','debuff','Webbed',null,null,'Silktrapper: draw interval +0.8s permanently for this fight');
    addLog('The Orbweaver\'s silk traps you! Draw interval +0.8s!','debuff');
    spawnFloatNum('player','🕸WEBBED',false,'block-num');
  }
  var origDmg=dmg;
  if(!bypassHardened&&gs.enemyHardened>0){
    var h=Math.min(gs.enemyHardened,dmg); dmg-=h;
    if(dmg<=0){
      addLog('Hardened absorbs all damage!','buff');
      spawnFloatNum('enemy','🪨 BLOCKED',false,'block-num');
      return;
    }
    addLog('Hardened absorbs '+h+'.','buff');
    spawnFloatNum('enemy','🪨 -'+h,false,'block-num');
  }
  if(gs.enemyShell>0){
    var s2=Math.min(gs.enemyShell,dmg); dmg-=s2;
    if(s2>0){
      addLog('Shell blocks '+s2+'.','buff');
      spawnFloatNum('enemy','🛡 '+s2,false,'block-num');
    }
  }
  // Heat Armour (Dune Crawler): -1 flat damage per hit
  if(e.innate&&e.innate.id==='heat_armour'){ dmg=Math.max(1,dmg-1); }
  if(e.innate&&e.innate.id==='ethereal'){ dmg=Math.max(1,dmg-1); }
  if(e.innate&&e.innate.id==='stone_skin'){ dmg=Math.max(1,dmg-3); }
  if(e.innate&&e.innate.id==='vigilance'){ dmg=Math.max(1,dmg-5); }
  // Adaptive resistance
  if(e.innate&&e.innate.id==='adaptive'&&gs.adaptiveStacks>0){
    var resistedAmt=Math.round(origDmg*gs.adaptiveStacks*0.08);
    if(resistedAmt>0) spawnFloatNum('enemy','◈ -'+resistedAmt,false,'resist-num');
  }
  getStatuses('enemy','death_mark').forEach(function(s){ dmg=Math.round(dmg*1.5); });
  dmg=Math.max(0,dmg);
  gs.enemyHp=Math.max(0,gs.enemyHp-dmg);
  // Thorns reflect — if player has Thorns buff, reflect damage back
  if(dmg>0) _checkThornsReflect();
  // Track damage for Wax Oasis timed fight
  if(e.innate&&e.innate.id==='wax_timed'&&dmg>0){
    gs.waxDamageDealt=(gs.waxDamageDealt||0)+dmg;
  }
  if(dmg>0){
    addLog('Enemy takes '+dmg+' dmg! ('+gs.enemyHp+'/'+gs.enemyMaxHp+' HP)','dmg');
    playDamageEnemySfx();
    shakeIcon('enemy',false); flashHpBar('enemy','hp-flash-red'); spawnFloatNum('enemy','-'+dmg,dmg>=50);
    // Spore Count (Mycelid): every 3rd hit triggers Poison burst
    if(e.innate&&e.innate.id==='spore_count'){
      gs._sporeHits=(gs._sporeHits||0)+1;
      if(gs._sporeHits%3===0){
        gs.playerHp=Math.max(0,gs.playerHp-6);
        spawnFloatNum('player','-6',false); flashHpBar('player','hp-flash-red');
        addLog('Spore Count! Burst of 6 Poison damage (bypasses shield)!','debuff'); updateAll();
      }
    }
    // Ink Cloud (Ink Squall): first hit grants Dodge
    if(e.innate&&e.innate.id==='ink_cloud'&&!gs._inkCloudUsed){
      gs._inkCloudUsed=true;
      gs.enemyDodge=true;
      addTag('enemy','buff','Dodge',0,'','Ink Cloud: next direct hit evaded.');
      addLog('Ink Cloud! Squall evades the next hit!','buff');
    }
    // Molten Core (Ember Golem): at 50% HP trigger
    if(e.innate&&e.innate.id==='molten_core'&&!gs._moltenCoreFired&&gs.enemyHp<=gs.enemyMaxHp*0.5){
      gs._moltenCoreFired=true;
      applyStatus('enemy','buff','Molten Core',0.20,'atkspeed',9999999,'Molten Core: +20% attack speed.');
      addTag('enemy','buff','Molten Core',0,'','Molten Core: hits now apply Burn!');
      addLog('Molten Core ignites! +20% speed, hits apply Burn.','innate');
      spawnFloatNum('enemy','IGNITE!',true,'crit-num');
    }
    // Feeding Frenzy (Shark Knight): at 50% HP trigger
    if(e.innate&&e.innate.id==='feeding_frenzy'&&!gs._frenzyFired&&gs.enemyHp<=gs.enemyMaxHp*0.5){
      gs._frenzyFired=true;
      applyStatus('enemy','buff','Feeding Frenzy',0.30,'atkspeed',9999999,'Feeding Frenzy: +30% attack speed below 50% HP.');
      addLog('Feeding Frenzy! +30% attack speed!','innate');
      spawnFloatNum('enemy','FRENZY!',true,'crit-num');
    }
    // Soot Cloud (Ash Bat): 30% chance on hit to apply Slow to player
    if(e.innate&&e.innate.id==='soot_cloud'&&Math.random()<0.30){
      applyStatus('player','debuff','Soot',-0.40,'atkspeed',2000,'Soot Cloud: -40% draw speed for 2s.');
      addLog('Soot Cloud! Slowed for 2s.','debuff');
    }
    // Adaptive stacks
    if(e.innate&&e.innate.id==='adaptive'&&dmg>=5){
      gs.adaptiveStacks=(gs.adaptiveStacks||0);
      if(gs.adaptiveStacks<3){
        gs.adaptiveStacks++;
        removeTagByLabel('enemy','Adaptive');
        addTag('enemy','buff','Adaptive',0,'adaptive','Damage resistance +'+(gs.adaptiveStacks*8)+'% ('+gs.adaptiveStacks+'/3 stacks)');
        addLog('Adaptive: resistance stack '+gs.adaptiveStacks+'/3!','buff');
      }
    }
    // Molten Core: apply Burn on hit when fired
    if(e.innate&&e.innate.id==='molten_core'&&gs._moltenCoreFired){
      var pb=gs.statusEffects.player.find(function(s){return s.id==='molten_burn';});
      if(pb){ pb.dpt+=3; pb.remaining=9000; } else { gs.statusEffects.player.push({id:'molten_burn',label:'Molten Burn',cls:'debuff',stat:'dot',remaining:9000,maxRemaining:9000,dot:true,dpt:3,tickMs:3000,tickAcc:0,desc:'Molten Core: 3/3s.'}); addTag('player','debuff','Molten Burn',0,'dot','Molten Core burn.'); }
    }
  }
}

function tickEnemyInnates(ms){
  if(!gs||!gs.running) return;
  var e=gs.enemies[gs.enemyIdx];
  // Trigger mana_full / mana_threshold innates on every tick too
  if(e.innate&&(e.innate.trigger==='mana_full'||e.innate.trigger==='mana_threshold')&&gs._innCooldown===0){
    enemyCheckActivateInnate(e);
  }
  // Frenzied (Giant Rat): +8% atkspeed every 4s, indefinitely
  // Seep (Cave Grub): Poison DoT stack every 5s
  if(e.innate&&e.innate.id==='seep'){
    gs._seepAcc=(gs._seepAcc||0)+ms;
    if(gs._seepAcc>=5000){
      gs._seepAcc=0;
      var ps=gs.statusEffects.player.find(function(s){return s.id==='poison';});
      if(ps){ ps.dpt+=2; ps.remaining=8000; } else { gs.statusEffects.player.push({id:'poison',label:'Poison (2/2s)',cls:'debuff',stat:'dot',remaining:8000,maxRemaining:8000,dot:true,dpt:2,tickMs:2000,tickAcc:0,desc:'Seep: 2 dmg/2s.'}); addTag('player','debuff','Poison (2/2s)',0,'dot','Seep: poison stacking.'); }
      addLog('Seep! Poison stacks on you.','debuff');
    }
  }
  // Accumulate (Sump Thing): +8% dmg every 5s, permanent stacks
  if(e.innate&&e.innate.id==='accumulate'){
    gs._accumAcc=(gs._accumAcc||0)+ms;
    if(gs._accumAcc>=5000){
      gs._accumAcc=0;
      gs._accumStacks=(gs._accumStacks||0)+1;
      removeTagByLabel('enemy','Swelling ×'+(gs._accumStacks-1));
      applyStatus('enemy','buff','Swelling ×'+gs._accumStacks,gs._accumStacks*0.08,'dmg',9999999,'Accumulate: +'+(gs._accumStacks*8)+'% damage permanently.');
      if(gs._accumStacks===5) applyStatus('enemy','buff','Surging',0.10,'atkspeed',9999999,'Swelling: +10% attack speed at 5 stacks.');
      addLog('Swelling ×'+gs._accumStacks+'! +'+(gs._accumStacks*8)+'% damage.','innate');
      spawnFloatNum('enemy','SWELLING!',gs._accumStacks>=5,'crit-num');
    }
  }
  // Dig In (Mine Ghoul): +15% dmg after 6s
  if(e.innate&&e.innate.id==='dig_in'&&!gs._digInFired){
    gs._digInAcc=(gs._digInAcc||0)+ms;
    if(gs._digInAcc>=6000){
      gs._digInFired=true;
      applyStatus('enemy','buff','Dug In',0.15,'dmg',9999999,'Dig In: +15% damage permanently.');
      addLog('Mine Ghoul digs in! +15% damage.','innate');
      spawnFloatNum('enemy','DUG IN!',false,'crit-num');
    }
  }
  // Magma Trail (Lava Crawler): stacking Burn every 5s
  if(e.innate&&e.innate.id==='magma_trail'){
    gs._magmaAcc=(gs._magmaAcc||0)+ms;
    if(gs._magmaAcc>=5000){
      gs._magmaAcc=0;
      var burn=gs.statusEffects.player.find(function(s){return s.id==='magma_burn';});
      if(burn){ burn.dpt+=3; burn.remaining=9000; addLog('Magma Trail! Burn intensifies.','debuff'); }
      else { gs.statusEffects.player.push({id:'magma_burn',label:'Magma Burn',cls:'debuff',stat:'dot',remaining:9000,maxRemaining:9000,dot:true,dpt:3,tickMs:3000,tickAcc:0,desc:'Magma Trail: 3 dmg/3s, stacking.'}); addTag('player','debuff','Magma Burn',0,'dot','Magma Trail: stacking burn.'); addLog('Magma Trail! Burn applied.','debuff'); }
    }
  }
  // Molten Core (Ember Golem): trigger at 50% HP — handled in dealDamageToEnemy
  // Lure (Siren): draw speed debuff while alive
  if(e.innate&&e.innate.id==='lure'&&!gs._lureApplied){
    gs._lureApplied=true;
    gs.drawSpeedBonus=Math.max(0.5,(gs.drawSpeedBonus||1)*0.80);
    addTag('player','debuff','Lured',0,'','Siren: draw speed -20% while it lives.');
    addLog('Lure! Draw speed reduced by 20%.','debuff');
  }
  if(e.innate&&e.innate.id==='frenzied'){
    gs._frenziedAcc=(gs._frenziedAcc||0)+ms;
    if(gs._frenziedAcc>=4000){
      gs._frenziedAcc=0;
      gs._frenziedStacks=(gs._frenziedStacks||0)+1;
      var stackVal=gs._frenziedStacks*0.08;
      removeTagByLabel('enemy','Frenzied ×'+(gs._frenziedStacks-1));
      if(gs._frenziedStacks===1) removeTagByLabel('enemy','Frenzied');
      applyStatus('enemy','buff','Frenzied ×'+gs._frenziedStacks,stackVal,'atkspeed',9999999,'Frenzied: attack speed +'+(gs._frenziedStacks*8)+'%. Stacks every 4s.');
      addLog('Frenzied! Attack speed now +'+(gs._frenziedStacks*8)+'%.','innate');
    }
  }
  // Overcharge (Cursed Urn): +10% atkspeed every 6s, permanent
  if(e.innate&&e.innate.id==='overcharge'){
    gs._overchargeAcc=(gs._overchargeAcc||0)+ms;
    if(gs._overchargeAcc>=6000){
      gs._overchargeAcc=0;
      gs._overchargeStacks=(gs._overchargeStacks||0)+1;
      var ocVal=gs._overchargeStacks*0.10;
      removeTagByLabel('enemy','Overcharge ×'+(gs._overchargeStacks-1));
      applyStatus('enemy','buff','Overcharge ×'+gs._overchargeStacks,ocVal,'atkspeed',9999999,'Overcharge: +'+(gs._overchargeStacks*10)+'% attack speed.');
      addLog('Overcharge ×'+gs._overchargeStacks+'! +10% attack speed.','innate');
    }
  }
  // Infectious Bloom (Corruption Bloom): stacking Poison + draw slow every 4s
  if(e.innate&&e.innate.id==='bloom'){
    gs._bloomAcc=(gs._bloomAcc||0)+ms;
    if(gs._bloomAcc>=4000){
      gs._bloomAcc=0;
      gs._bloomStacks=Math.min(3,(gs._bloomStacks||0)+1);
      // Stack poison
      var bloomPoison=gs.statusEffects.player.find(function(s){return s.id==='bloom_poison';});
      if(bloomPoison){ bloomPoison.dpt+=3; bloomPoison.remaining=8000; }
      else { gs.statusEffects.player.push({id:'bloom_poison',label:'Bloom Poison',cls:'debuff',stat:'dot',remaining:8000,maxRemaining:8000,dot:true,dpt:3,tickMs:2000,tickAcc:0,desc:'Bloom: 3/2s stacking poison.'}); addTag('player','debuff','Bloom Poison',0,'dot','Infectious Bloom: stacking poison.'); }
      // Draw slow stacks (5% per stack, max 3)
      if(gs._bloomStacks<=3){
        removeTagByLabel('player','Bloom Slow ×'+(gs._bloomStacks-1));
        applyStatus('player','debuff','Bloom Slow ×'+gs._bloomStacks,-0.05*gs._bloomStacks,'atkspeed',9999999,'Bloom: draw speed -'+(gs._bloomStacks*5)+'%.');
      }
      addLog('Infectious Bloom ×'+gs._bloomStacks+'! Poison + draw slow stack.','debuff');
    }
  }
  // Deep Pressure (Abyss Crawler): squeeze max mana every 5s
  if(e.innate&&e.innate.id==='deep_pressure'){
    gs._deepPressureAcc=(gs._deepPressureAcc||0)+ms;
    if(gs._deepPressureAcc>=5000){
      gs._deepPressureAcc=0;
      gs.maxMana=Math.max(20,gs.maxMana-15);
      gs.mana=Math.min(gs.mana,gs.maxMana);
      addLog('Deep Pressure! Max mana reduced by 15 for 4s.','debuff');
      setTimeout(function(){ if(gs){ gs.maxMana=Math.min(gs.maxMana+15,gs.playerMaxMana||200); } },4000);
    }
  }
  // Skitter (Sewer Roach): gain [Dodge] every 8s
  if(e.innate&&e.innate.id==='skitter'){
    gs._skitterAcc=(gs._skitterAcc||0)+ms;
    if(gs._skitterAcc>=8000){
      gs._skitterAcc=0;
      if(!getStatus('enemy','skitter_dodge')){
        applyStatus('enemy','buff','Dodge',0,'skitter_dodge',9999999,'Skitter: next direct hit will be evaded.');
        addLog('Roach skitters — [Dodge] gained!','innate');
      }
    }
  }
  if(e.innate&&e.innate.id==='wounded_fury'&&gs.enemyHp<=(gs.enemyMaxHp/2)){
    var hasWF=getStatus('enemy','wounded_fury');
    if(!hasWF) applyStatus('enemy','buff','Wounded Fury',0.2,'atkspeed',9999999,'Attack speed +20%. Permanent below 50% HP.');
  }
  if(e.innate&&e.innate.id==='regeneration'){
    gs._trollRegenAcc=(gs._trollRegenAcc||0)+ms;
    if(gs._trollRegenAcc>=4000){ gs._trollRegenAcc=0; gs.enemyHp=Math.min(gs.enemyMaxHp,gs.enemyHp+1); addLog('Troll regenerates 1 HP.','heal'); }
  }
  if(e.innate&&e.innate.id==='flame_aura'){
    gs._wyrmAuraAcc=(gs._wyrmAuraAcc||0)+ms;
    if(gs._wyrmAuraAcc>=5000){ gs._wyrmAuraAcc=0; applyDoT('player','wyrm_flame',3,3000,9000,'Wyrm Flame Aura: 3 dmg/3s'); addLog('Flame Aura burns you!','debuff'); }
  }
  // Malevolent Gaze: -30% mana regen (applied as a persistent debuff tag)
  if(e.innate&&e.innate.id==='malevolent_gaze'){
    if(!getStatus('player','gaze_mana')){ applyStatus('player','debuff','Gaze',-0.3,'mana_regen',9999999,'Malevolent Gaze: mana regen -30%.'); }
  }
  // Death Aura (Lich): -50% mana regen
  if(e.innate&&e.innate.id==='death_aura'){
    if(!getStatus('player','death_aura_mana')){ applyStatus('player','debuff','Death Aura',-0.5,'mana_regen',9999999,'Death Aura: mana regen halved.'); }
  }
  // Slow Melt (Wax Soldier): 50% faster mana regen — shown as aura tag
  if(e.innate&&e.innate.id==='slow_melt'){
    if(!getStatus('enemy','slow_melt_tag')){ applyStatus('enemy','buff','Slow Melt',0,'',9999999,'Mana regens 50% faster.'); }
    gs._waxMeltAcc=(gs._waxMeltAcc||0)+ms;
    if(gs._waxMeltAcc>=1000){
      var meltGain=Math.floor(e.wis*1.5*(gs._waxMeltAcc/1000)*0.5);
      gs.enemyMana=Math.min(gs.enemyMaxMana||100,(gs.enemyMana||0)+meltGain);
      gs._waxMeltAcc=0;
    }
  }
  // Brittle Shell (Wax Hound): once per fight at ≤20% HP — heal + speed burst
  if(e.innate&&e.innate.id==='brittle_shell'&&!gs._brittleShellFired){
    if(gs.enemyHp<=gs.enemyMaxHp*0.20){
      gs._brittleShellFired=true;
      var shellHeal=Math.round(gs.enemyMaxHp*0.15);
      gs.enemyHp=Math.min(gs.enemyMaxHp,gs.enemyHp+shellHeal);
      applyStatus('enemy','buff','Shell Burst',0.6,'atkspeed',5000,'Brittle Shell cracked! +60% atk speed for 5s.');
      addLog(e.name+'\'s shell cracks! Heals '+shellHeal+' HP and surges!','innate');
      spawnFloatNum('enemy','+'+shellHeal,false,'heal-num');
      updateAll();
    }
  }
  // Heat Armour (Dune Crawler): handled in dealDamageToEnemy — tag display here
  if(e.innate&&e.innate.id==='heat_armour'){
    if(!getStatus('enemy','heat_armour_tag')){ applyStatus('enemy','buff','Heat Armour',0,'',9999999,'Takes 1 less dmg per hit.'); }
  }
  // Wax Timed (Wax Oasis): countdown timer
  if(e.innate&&e.innate.id==='wax_timed'){
    gs._waxTimerAcc=(gs._waxTimerAcc||0)+ms;
    gs.enemyHp=gs.enemyMaxHp; // regen constantly — can't be killed
    if(gs._waxTimerAcc>=45000){ endWaxOasisFight(); return; }
    // Update the enemy HP bar label to show countdown
    var remaining=Math.ceil((45000-gs._waxTimerAcc)/1000);
    var dmgSoFar=gs.waxDamageDealt||0;
    document.getElementById('e-hp-bar').style.width='100%';
    document.getElementById('e-hp-txt').textContent='TIME: '+remaining+'s | DMG: '+dmgSoFar;
  }
  if(e.innate&&e.innate.id==='rooter'){
    gs._rooterAcc=(gs._rooterAcc||0)+ms;
    if(gs._rooterAcc>=8000){
      gs._rooterAcc=0;
      if(!gs.playerRooted){
        gs.playerRooted=true;
        addTag('player','debuff','Rooted',null,null,'Cannot draw for 2.5s!');
        addLog('Roots erupt from the earth! You cannot draw!','debuff');
        spawnFloatNum('player','🌿ROOTED',false,'block-num');
        setTimeout(function(){ if(gs){ gs.playerRooted=false; removeTagByLabel('player','Rooted'); } },2500);
      }
    }
  }
  // Mist Veil (Mistraven): on dodge, 30% chance to refresh dodge
  if(e.innate&&e.innate.id==='mist_veil'&&gs.enemyDodgeProcReady){
    gs.enemyDodgeProcReady=false;
    if(Math.random()<0.30){
      gs.enemyDodge=true;
      addTag('enemy','buff','Dodge',null,null,'Mist Veil: dodge refreshed!');
      addLog('Mist Veil swirls — dodge refreshed!','buff');
    }
  }
  // Mist Drain passive tag (Foghast) — shown as an aura tag on enter
  if(e.innate&&e.innate.id==='mist_drain'){
    if(!getStatus('enemy','mist_drain_tag')){ applyStatus('enemy','buff','Mist Drain',0,'',9999999,'Drains 15 mana on each hit.'); }
  }
}

function forceAutoplay(){
  if(gs.hand.length===0) return;
  var oldest=gs.hand.shift();
  addLog('Forced autoplay: '+((CARDS[oldest.id]&&CARDS[oldest.id].name)||oldest.id)+'!','debuff');
  executeCard(oldest.id,oldest.ghost,true);
  if(!oldest.ghost) gs.discardPile.push(oldest.id);
  renderHand(); renderPiles();
}

// ═══════════════════════════════════════════════════════
// DRAW & PLAY
// ═══════════════════════════════════════════════════════
function doDraw(overrideId,silent){
  if(!overrideId&&gs.drawPool.length===0){
    if(gs.discardPile.length===0){ addLog('No cards to draw!','draw'); return; }
    gs.drawPool=gs.discardPile.slice().sort(function(){return Math.random()-.5;});
    gs.discardPile=[];
    addLog('Deck exhausted — discard reshuffled.','draw');
    playCardShuffleSfx();
  }
  if(gs.hand.length>=HAND_SIZE){
    var oldest=gs.hand[0];
    var oc=CARDS[oldest.id];
    // All cards auto-play freely
    gs.hand.shift();
    if(SETTINGS.logd!=='brief') addLog('Auto-played '+(oc?oc.name:oldest.id)+'.','draw');
    playCardSfx();
    var delay=ASPEED_DELAYS[SETTINGS.aspeed]||600;
    if(delay===0){ executeCard(oldest.id,oldest.ghost,true); if(!oldest.ghost) gs.discardPile.push(oldest.id); }
    else (function(item){setTimeout(function(){ if(gs&&gs.running){ executeCard(item.id,item.ghost,true); if(!item.ghost) gs.discardPile.push(item.id); updateAll(); } },delay);})(oldest);
    if(!gs.running) return;
  }
  var drawnId,isGhost=false;
  if(overrideId){ drawnId=overrideId; isGhost=true; }
  else{ var ix=Math.floor(Math.random()*gs.drawPool.length); drawnId=gs.drawPool.splice(ix,1)[0]; }
  gs.hand.push({id:drawnId,ghost:isGhost});
  if(!silent&&SETTINGS.logd!=='brief'){ var c=CARDS[drawnId]; addLog('Drew '+(c?c.name:drawnId)+(isGhost?' [Ghost]':'')+'.','draw'); }
  if(!silent&&!isGhost) playCardDrawSfx();
  renderHand(drawnId); renderPiles();
}

function playCard(idx){
  if(!gs||!gs.running||paused) return;
  if(idx<0||idx>=gs.hand.length) return;
  // Focus mana gate
  var item=gs.hand[idx];
  if(item.id==='druid_focus'&&!item.ghost){
    var threshold=Math.round(gs.maxMana*0.8);
    if(gs.mana<threshold){ addLog('Not enough mana to cast Focus manually (need '+threshold+').','mana'); return; }
  }
  gs.hand.splice(idx,1);
  var c=CARDS[item.id];
  addLog('You play '+(c?c.name:item.id)+'!','sys');
  playCardSfx();
  executeCard(item.id,item.ghost,false);
  if(!item.ghost) gs.discardPile.push(item.id);
  pendingConfirmIdx=-1;
  checkEnd(); renderHand(); renderPiles(); updateAll();
}


// ═══════════════════════════════════════════════════════
// CARD EFFECTS (executeCard, activateInnate, combat helpers)
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
    gs.statusEffects[target].forEach(function(s){
      if(s.stat==='stun'||s.id==='starburn') return; // handled separately
      if(!s.maxRemaining||s.remaining>=999000) return; // permanent
      var pct=Math.max(0,Math.min(100,(s.remaining/s.maxRemaining)*100));
      var tag=el.querySelector('[data-label="'+s.label+'"]');
      if(tag) tag.style.setProperty('--t',pct.toFixed(1));
    });
    // Starburn special case — always full bar (stacks, not time-draining display)
    var sb=gs.statusEffects[target].find(function(s){return s.id==='starburn';});
    if(sb){
      var tag=el.querySelector('[data-label="Starburn"]');
      if(tag){ var pct=Math.max(0,Math.min(100,(sb.remaining/6000)*100)); tag.style.setProperty('--t',pct.toFixed(1)); }
    }
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
        list.splice(i,1);
        removeTagByLabel(t,lbl);
        // Scout's Rally expiry — goblin transforms
        if(stat==='scouts_rally'&&gs&&gs.running&&!gs.goblinAlarmFired){
          gs.goblinAlarmFired=true;
          applyStatus('enemy','buff','⚠ Rallied!',0.4,'atkspeed',9999999,'Rallied: +40% attack speed. +50% damage. The Scout has been emboldened.');
          applyStatus('enemy','buff','Rallied Dmg',0.5,'dmg',9999999,'Rallied: +50% damage.');
          addTag('enemy','buff','⚠ Rallied!',0,'','Rallied: +40% atk speed, +50% damage. Permanent.');
          addLog('⚠ The Goblin Scout rallies! +40% speed, +50% damage!','innate');
          spawnFloatNum('enemy','RALLIED!',true,'crit-num');
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
  // If suspended, skip timer advancement for player statuses
  var suspended=gs._suspended&&Date.now()<(gs._suspendEnd||0);
  ['player','enemy'].forEach(function(t){
    gs.statusEffects[t].forEach(function(s){
      if(!s.dot) return;
      // Suspend pauses player buff/debuff ticks
      if(suspended&&t==='player') return;
      s.tickAcc+=ms;
      while(s.tickAcc>=s.tickMs){
        s.tickAcc-=s.tickMs;
        if(s.id==='starburn'){ var dmg=(s.stacks||1)*5; dealDamageToEnemy(dmg); if(SETTINGS.logd==='verbose') addLog('Starburn ('+s.stacks+'×): '+dmg+' dmg.','debuff'); }
        else if(t==='enemy'){ dealDamageToEnemy(s.dpt); if(SETTINGS.logd==='verbose') addLog(s.label+': '+s.dpt+' dmg.','debuff'); }
        else {
          // Poison immunity check (Plague Bearer)
          if((s.id==='poison'||s.id==='poison_self')&&_hasPoisonImmunity()) continue;
          // DoTs bypass [Shield] — deal directly to HP
          var dotDmg=s.dpt;
          gs.playerHp=Math.max(0,gs.playerHp-dotDmg);
          if(dotDmg>0){ shakeIcon('player',false); flashHpBar('player','hp-flash-red'); spawnFloatNum('player','-'+dotDmg,dotDmg>=50); }
          if(SETTINGS.logd==='verbose') addLog(s.label+': '+s.dpt+' dmg (bypasses shield).','dmg');
          updateAll(); checkEnd();
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════
// TAGS & TOOLTIPS
// ═══════════════════════════════════════════════════════
function addTag(target,cls,label,val,stat,desc){
  var el=document.getElementById(target==='player'?'p-tags':'e-tags'); if(!el) return;
  if(el.querySelector('[data-label="'+label+'"]')) return;
  var t=document.createElement('span');
  t.className='tag '+cls; t.dataset.label=label;
  // Try to show a status icon, fall back to just text
  var iconHtml=stat?statusImgHTML(stat,'14px'):'';
  t.innerHTML=iconHtml+label;
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
  var gold=Math.floor(Math.random()*(e.gold[1]-e.gold[0]))+e.gold[0];
  gs.goldEarned+=gold;
  var rawXp=Math.round(8+gs.area.level*10);
  var xpMult=calcXpMult(gs.level,gs.area.level);
  if(gs._shrineXpBonus) xpMult*=gs._shrineXpBonus;
  var xp=Math.max(1,Math.round(rawXp*xpMult));
  gs.xp+=xp;
  trackKill(e.id);
  var xpMsg=xpMult<1?' ('+Math.round(xpMult*100)+'% XP)':'';
  addLog('✦ Victory! +'+xp+' XP'+xpMsg+', +'+gold+' gold.','sys');
  checkLevelUp();
  saveChampionState();
  var isLast=(gs.enemyIdx+1>=gs.enemies.length);
  if(isLast){ playWinSfx(); } else { playVictorySfx(); }

  if(!isLast){
    // ── Mid-battle: gold toast, auto-chain ──
    var midGold=Math.round(3+gs.area.level*2);
    gs.goldEarned+=midGold;
    updateTopBar();
    addLog('+'+midGold+' gold.','sys');
    // Show mid-battle popup
    var toastEl=document.getElementById('gold-toast');
    var amtEl=document.getElementById('gold-toast-amount');
    var nextEl=document.getElementById('gold-toast-next');
    var nextIconEl=document.getElementById('gold-toast-next-icon');
    var nextHpEl=document.getElementById('gold-toast-next-hp');
    var barEl=document.getElementById('gold-toast-bar');
    var lblEl=document.getElementById('gold-toast-lbl');
    var nextE=gs.enemies[gs.enemyIdx+1];
    if(toastEl){
      if(amtEl) amtEl.textContent='+'+midGold+' ✦';
      if(nextEl) nextEl.textContent=nextE?nextE.name:'';
      if(nextIconEl) nextIconEl.textContent=nextE?nextE.icon:'⚔️';
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
  if(_deckReturnScreen==='area-screen'){
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

  return line
    // WIS×N, STR×N, AGI×N
    .replace(/\b(WIS|STR|AGI)\s*[×x\*]\s*(\d+(?:\.\d+)?)/gi, function(m, stat, n){
      if(!s) return sv(m);
      var base = s[stat.toLowerCase()]||0;
      return sv(Math.round(base * parseFloat(n)));
    })
    // WIS÷N, STR÷N, AGI÷N
    .replace(/\b(WIS|STR|AGI)\s*[÷\/]\s*(\d+)/gi, function(m, stat, n){
      if(!s) return sv(m);
      var base = s[stat.toLowerCase()]||0;
      return sv(Math.floor(base / parseFloat(n)));
    })
    // Bare stat name (e.g. "+ WIS damage", "Deal 12 + WIS")
    .replace(/\b\+\s*(WIS|STR|AGI)\b/gi, function(m, stat){
      if(!s) return sv(m);
      return '+ '+sv(s[stat.toLowerCase()]||0);
    })
    // "missing mana ÷ N" / "missing mana / N"
    .replace(/missing mana\s*[÷\/]\s*(\d+)/gi, function(m, n){
      if(!gameState) return sv(m);
      var missing = (gameState.maxMana||0) - (gameState.mana||0);
      return sv(Math.floor(missing / parseInt(n)));
    })
    // "missing HP ÷ N" / "missing HP / N"
    .replace(/missing HP\s*[÷\/]\s*(\d+)/gi, function(m, n){
      if(!gameState) return sv(m);
      var missing = (gameState.playerMaxHp||0) - (gameState.playerHp||0);
      return sv(Math.floor(missing / parseInt(n)));
    })
    // "discard pile × N" / "discard pile * N"
    .replace(/discard pile\s*[×x\*]\s*(\d+)/gi, function(m, n){
      if(!gameState) return sv(m);
      return sv((gameState.discardPile||[]).length * parseInt(n));
    })
    // "cards in hand × N" / "cards in hand * N"
    .replace(/cards in hand\s*[×x\*]\s*(\d+)/gi, function(m, n){
      if(!gameState) return sv(m);
      return sv((gameState.hand||[]).length * parseInt(n));
    })
    // Any remaining bare stat names that haven't been caught
    .replace(/\b(WIS|STR|AGI)\b/g, function(m, stat){
      if(!s) return sv(m);
      return sv(s[stat.toLowerCase()]||0);
    });
}
// ────────────────────────────────────────────────────────────────────

function buildCardHTML(id,isGhost){
  var c=CARDS[id];
  if(!c) c={name:id,icon:'?',type:'attack',unique:false,effect:'?',champ:null,statId:null,manaCost:0};
  var statCls=c.statId?'card-stat-'+c.statId:'card-stat-none';
  var rawLine=(c.effect||'').split('\n')[0]||'';
  var resolved=resolveCardEffect(rawLine, typeof gs!=='undefined'&&gs?gs:null, null);
  var mechanic=renderKeywords(resolved);
  var manaCost=c.manaCost!=null?c.manaCost:0;
  var fzStyle=cardEffectFontSize(c.effect);
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
function maybeRenderHand(){ var k=gs.hand.map(function(h){return h.id+(h.ghost?'g':'');}).join(','); if(k!==lastHandStr) renderHand(); }

function renderHand(newId){
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
    d.className='card '+statCls+(isGhost?' ghost':'')+(item.id===newId?' new-card':'')+(isSel?' selected-card':'');
    d.setAttribute('data-idx',i);

    // Fan transform — rotate and drop from centre, scaled for 158x220 cards
    var mid=(total-1)/2;
    var t=total>1?(i-mid)/mid:0;
    var rot=t*12;        // slightly tighter arc for bigger cards
    var drop=Math.abs(t)*16;
    d.style.cssText='transform:rotate('+rot+'deg) translateY('+drop+'px);transform-origin:bottom center;z-index:'+i+';position:relative;'+(i>0?'margin-left:-38px;':'');

    var cEffect=cd?(cd.effect||''):'';
    var rawLine=(cEffect.split('\n')[0])||'';
    var mechanic=renderKeywords(resolveCardEffect(rawLine, gs, null));
    var fzStyle=cardEffectFontSize(cEffect);
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
  document.getElementById('disc-cnt').textContent=disc;
  // Show top discard card icon on the pile if available
  var topId=disc>0?gs.discardPile[gs.discardPile.length-1]:null;
  var topC=topId?CARDS[topId]:null;
  var discHint=document.getElementById('disc-hint-icon');
  if(discHint) discHint.textContent=topC?topC.icon:'';
}

function updateAll(){
  if(!gs) return;
  var pPct=(gs.playerHp/gs.playerMaxHp)*100;
  var ePct=(gs.enemyHp/gs.enemyMaxHp)*100;
  var mPct=gs.maxMana>0?(gs.mana/gs.maxMana)*100:0;
  document.getElementById('p-hp-bar').style.width=pPct+'%';
  document.getElementById('e-hp-bar').style.width=ePct+'%';
  document.getElementById('p-hp-txt').textContent=gs.playerHp+'/'+gs.playerMaxHp;
  document.getElementById('e-hp-txt').textContent=gs.enemyHp+'/'+gs.enemyMaxHp;
  document.getElementById('mana-bar2').style.width=mPct+'%';
  document.getElementById('mana-val').textContent=gs.mana+'/'+gs.maxMana;
  // Enemy mana bar
  var emPct=gs.enemyMaxMana>0?Math.min(100,Math.round((gs.enemyMana/gs.enemyMaxMana)*100)):0;
  var emBar=document.getElementById('e-mana-bar'); if(emBar) emBar.style.width=emPct+'%';
  var emVal=document.getElementById('e-mana-val'); if(emVal) emVal.textContent=(gs.enemyMana||0)+'/'+(gs.enemyMaxMana||0);
  var ch=getCreaturePlayable(gs.champId);
  // Hidden proxy
  if(ch.innateActive) document.getElementById('innate-btn').disabled=(!gs.running||gs.mana<ch.innateCost);
  // Innate card: mana bar + ready glow
  if(ch.innateActive){
    var innateCard=document.getElementById('innate-card');
    var fill=document.getElementById('innate-mana-fill');
    var lbl=document.getElementById('innate-mana-lbl');
    var cost=ch.innateCost||1;
    var manaPct=Math.min(100,Math.round((gs.mana/cost)*100));
    var ready=gs.running&&gs.mana>=cost;
    if(fill){ fill.style.width=manaPct+'%'; fill.className='innate-mana-fill'+(manaPct>=100?' full':''); }
    if(lbl){ lbl.textContent=Math.min(gs.mana,cost)+' / '+cost; }
    if(innateCard){
      innateCard.classList.toggle('ready',ready);
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
  vault: {
    id:'vault', name:'The Vault', icon:'📦',
    desc:'Stores gems, materials and artifacts. Slot a gem to activate the generator — it slowly produces loot over time.',
    unlocked:true,
    slotEffect:function(tier){ return 0; }, // capacity now from level/upgrades
    defaultCap:16,
  },
  forge: {
    id:'forge', name:'The Forge', icon:'🔨',
    desc:'Upgrades cards through gem tiers — Ruby, Emerald, Sapphire and beyond.',
    unlocked:false,
  },
  bestiary: {
    id:'bestiary', name:'The Bestiary', icon:'📖',
    desc:'Reveals full stats, innates, and tactics for every enemy you\'ve encountered.',
    unlocked:false,
  },
  shard_well: {
    id:'shard_well', name:'The Shard Well', icon:'🔮',
    desc:'Slowly generates Shards over time for use in the Gacha.',
    unlocked:false,
  },
  sanctum: {
    id:'sanctum', name:'The Sanctum', icon:'⚗️',
    desc:'Customise champion starting decks, upgrade cards, and raise level floors.',
    unlocked:false,
  },
  market: {
    id:'market', name:'The Market', icon:'🛒',
    desc:'Buy chests with gold. Prices rise with each purchase.',
    unlocked:false,
  },
  board: {
    id:'board', name:"Adventurer's Board", icon:'📋',
    desc:'Take on quests for gold, gems, and glory. One active quest at a time.',
    unlocked:false,
  },
  expedition_hall: {
    id:'expedition_hall', name:'Expedition Hall', icon:'🏕️',
    desc:'Dispatch champions on timed expeditions to gather materials while you fight.',
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
  board:    { achId:'battle_hardened', desc:'Reach level 5 — the Adventurer\'s Board unlocks automatically.' },
  bestiary: { seenCount:10, gold:100, desc:'Unlocked by encountering 10 different enemies, or purchase for 100 gold.' },
  market:   { gold:150, desc:'Purchase The Market for 150 gold to buy chests.' },
  sanctum:  { gold:250, desc:'Purchase The Sanctum for 250 gold to customise champion decks and relics.' },
  shard_well:{ gold:300, desc:'Purchase the Shard Well for 300 gold.' },
  expedition_hall:{ gold:400, desc:'Purchase the Expedition Hall for 400 gold.' },
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
  else if(id==='board') refreshBoardPanel();
  else if(id==='shard_well') refreshShardWellPanel();
  else if(id==='expedition_hall') refreshExpeditionHallPanel();
}

function openBuilding(id){
  playSelectSfx();
  if(id==='vault'){ openVaultPanel(); showTutorial('vault_intro'); return; }
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
  var b=PERSIST.town.buildings[id];
  if(b&&b.unlocked) return true; // always show unlocked
  var cost=BUILDING_UNLOCK_COSTS[id];
  if(!cost) return false;

  // Vault: visible once town is visible (always)
  if(id==='vault') return true;

  // Forge + Board: visible once vault is unlocked (they'll auto-unlock via achievements)
  if(id==='forge'||id==='board') return PERSIST.town.buildings.vault&&PERSIST.town.buildings.vault.unlocked;

  // Gold-gated buildings: visible once vault is unlocked AND player has earned ≥50% of the gold cost
  if(cost.gold){
    if(!(PERSIST.town.buildings.vault&&PERSIST.town.buildings.vault.unlocked)) return false;
    var totalGoldEarned=(PERSIST.achievements&&PERSIST.achievements['gold_earned'])||0;
    // Fallback: just check if they've done at least one run (vault unlocked = first run done)
    // Show shrine early, others progressively
    if(id==='bestiary') return PERSIST.seenEnemies.length>=3||PERSIST.gold>=50;
    if(id==='market') return PERSIST.town.buildings.bestiary&&PERSIST.town.buildings.bestiary.unlocked||PERSIST.gold>=150;
    if(id==='sanctum') return PERSIST.town.buildings.bestiary&&PERSIST.town.buildings.bestiary.unlocked||PERSIST.gold>=150;
    if(id==='shard_well') return PERSIST.town.buildings.market&&PERSIST.town.buildings.market.unlocked||PERSIST.gold>=200;
    if(id==='expedition_hall') return PERSIST.town.buildings.sanctum&&PERSIST.town.buildings.sanctum.unlocked||PERSIST.gold>=250;
  }
  return false;
}

function buildTownGrid(){
  refreshSummonsBanner();
  var grid=document.getElementById('town-grid'); grid.innerHTML='';

  // Count visible buildings before rendering
  var visibleCount=Object.values(BUILDINGS).filter(function(b){ return isBuildingVisible(b.id); }).length;
  if(visibleCount===0){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px 20px;">'
      +'<div style="font-size:32px;margin-bottom:12px;">🏕️</div>'
      +'<div style="font-family:Cinzel,serif;font-size:11px;color:#5a4020;letter-spacing:2px;margin-bottom:8px;">YOUR SETTLEMENT AWAITS</div>'
      +'<div style="font-size:9px;color:#3a2810;line-height:1.7;">Complete your first run to unlock the Vault<br>and begin building your town.</div>'
      +'</div>';
    return;
  }

  Object.values(BUILDINGS).forEach(function(bdef){
    // Progressive reveal — don't show buildings the player isn't ready for yet
    if(!isBuildingVisible(bdef.id)) return;

    var b=PERSIST.town.buildings[bdef.id];
    var unlocked=b&&b.unlocked;
    var slottedCard=null;
    var isActive=false;
    var cost=BUILDING_UNLOCK_COSTS[bdef.id];
    var canAfford=cost&&cost.gold&&PERSIST.gold>=cost.gold;

    var card=document.createElement('div');
    card.className='building-card'+(statusCls==='active'&&unlocked?' active':'')+(unlocked?'':' locked');


    var achOnly=cost&&cost.achId&&!cost.gold&&!cost.seenCount;
    if(unlocked) card.onclick=function(){ openBuilding(bdef.id); };
    else if(!achOnly&&canAfford) card.onclick=function(){ openBuilding(bdef.id); };

    var pipHtml='';

    var hintHtml='';
    if(!unlocked&&cost){
      var req, hintAffordable;
      if(cost.achId&&!cost.gold){
        // Achievement-only unlock — can't buy, must earn
        var achDef=ACHIEVEMENTS.find(function(a){return a.id===cost.achId;});
        var achDone=achDef&&isAchComplete(achDef);
        req=achDone?'✦ Claim from Achievements to unlock':cost.desc;
        hintAffordable=achDone;
      } else if(cost.seenCount){
        var seenNow=PERSIST.seenEnemies.length;
        var seenMet=seenNow>=cost.seenCount;
        req=seenMet?'Ready to unlock!':(seenNow+'/'+cost.seenCount+' seen · or ✦'+cost.gold+'g');
        hintAffordable=seenMet||(cost.gold&&PERSIST.gold>=cost.gold);
      } else {
        req=cost.achId?'📋 achievement required':(cost.gold?'✦ '+cost.gold+' gold to build':'');
        hintAffordable=!cost.achId&&cost.gold>0&&PERSIST.gold>=cost.gold;
      }
      hintHtml='<div class="bc-unlock-hint'+(hintAffordable?' affordable':'')+'">'+req+'</div>';
    }

    // Per-building meaningful status text
    var statusTxt='LOCKED', statusCls='locked';
    if(!unlocked){
      statusTxt='LOCKED'; statusCls='locked';
    } else {
      // Default: OPEN
      statusTxt='OPEN'; statusCls='empty';
      // Per-building overrides
      if(bdef.id==='forge'){
        var fq=(PERSIST.town.buildings.forge.queue||[]);
        if(fq.length>0){
          var fi=fq[0]; var fpct=Math.min(100,Math.round(((Date.now()-fi.startTime)/fi.totalMs)*100));
          statusTxt='CRAFTING — '+fpct+'%'; statusCls='active';
        } else { statusTxt='READY TO CRAFT'; statusCls='empty'; }
      } else if(bdef.id==='shrine'){
        var sb=PERSIST.town.buildings.shrine;
        if(sb.activeBlessing){ statusTxt='BLESSING ACTIVE'; statusCls='active'; }
        else { statusTxt='CHOOSE A BLESSING'; statusCls='empty'; }
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
        var vi=(PERSIST.town.items&&Object.keys(PERSIST.town.items).length)||0;
        var vm=Object.keys(PERSIST.town.materials||{}).filter(function(k){return (PERSIST.town.materials[k]||0)>0;}).length;
        var vtot=vi+vm;
        statusTxt=vtot+' ITEM'+(vtot!==1?'S':'')+' STORED'; statusCls=vtot>0?'active':'empty';
      } else if(bdef.id==='board'){
        var ba=PERSIST.town.quests&&PERSIST.town.quests.active;
        statusTxt=ba?'QUEST ACTIVE':'CHECK BOARD'; statusCls=ba?'active':'empty';
      } else if(bdef.id==='expedition_hall'){
        var expB=PERSIST.town.buildings.expedition_hall;
        var readySlots=(expB.slots||[]).filter(function(s){
          return s.champId && s.startTime && Date.now()>=s.startTime+s.totalMs;
        });
        var activeSlots=(expB.slots||[]).filter(function(s){return !!s.champId;});
        if(readySlots.length>0){
          statusTxt='✦ '+readySlots.length+' EXPEDITION'+(readySlots.length>1?'S':'')+' COMPLETE';
          statusCls='active';
        } else if(activeSlots.length>0){
          statusTxt=activeSlots.length+' EXPEDITION'+(activeSlots.length>1?'S':'')+' ACTIVE';
          statusCls='active';
        } else { statusTxt='SEND CHAMPIONS'; statusCls='empty'; }
      }
    }

    // Special hint for vault — locked until first run
    if(!unlocked&&bdef.id==='vault'){
      hintHtml='<div class="bc-unlock-hint">Complete your first run to unlock</div>';
    }

    // Building level display for unlocked buildings
    var levelHtml='';
    if(unlocked){
      var bLevel=getBuildingLevel(bdef.id);
      var bXp=(PERSIST.town.buildingXp&&PERSIST.town.buildingXp[bdef.id])||0;
      var bXpNext=getBuildingXpToNext(bLevel);
      var xpPct=Math.min(100,Math.round((bXp/bXpNext)*100));
      levelHtml='<div style="margin-top:6px;">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">'
          +'<span style="font-size:8px;color:#5a4020;font-family:Cinzel,serif;letter-spacing:.5px;">Lv'+bLevel+'</span>'
          +'<span style="font-size:8px;color:#3a2010;">'+bXp+'/'+bXpNext+'</span>'
        +'</div>'
        +'<div style="height:3px;background:rgba(0,0,0,.4);border-radius:2px;overflow:hidden;">'
          +'<div style="height:100%;width:'+xpPct+'%;background:#7a5010;border-radius:2px;"></div>'
        +'</div>'
      +'</div>';
    }

    card.innerHTML='<div class="bc-icon">'+buildingImgHTML(bdef.id, bdef.icon)+'</div>'
      +'<div class="bc-body">'
        +'<div class="bc-name">'+bdef.name.toUpperCase()+'</div>'
        +'<div class="bc-desc">'+bdef.desc+'</div>'
        +hintHtml
        +levelHtml
        +'<div class="bc-status '+statusCls+'">'+statusTxt+'</div>'
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
        +'<div style="font-size:9px;color:'+roleCol+';letter-spacing:2px;margin:2px 0;">'+ch.role+'</div>'
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
    icon:'📦',
    title:'The Vault',
    pages:[
      {body:'The Vault stores all items: <span style="color:#c03030;">Gems</span>, <span style="color:#7a6030;">Materials</span>, keys and chests. When a gem is slotted, the Vault runs a passive generator that produces random loot on a timer. Higher-tier gems reduce the timer.',
       tip:null},
      {body:'Items can be inspected, sold for gold, or recycled into <span style="color:#2980b9;">💎 Gem Shards</span>. The Vault has a capacity cap. Shelf upgrades increase capacity. The Vault levels up while a gem is slotted — higher levels reveal item flavour text, drop sources, and crafting information.',
       tip:null},
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

function _renderTutPage(){
  var tut=TUTORIALS[_tutCurrent]; if(!tut) return;
  var page=tut.pages[_tutPage];
  document.getElementById('tut-icon').textContent=tut.icon;
  document.getElementById('tut-title').textContent=tut.title;
  document.getElementById('tut-body').innerHTML=page.body;
  var stepEl=document.getElementById('tut-step');
  var multi=tut.pages.length>1;
  stepEl.textContent=multi?'Page '+(_tutPage+1)+' of '+tut.pages.length:'';
  var nextBtn=document.getElementById('tut-next-btn');
  nextBtn.style.display=multi&&_tutPage<tut.pages.length-1?'inline-block':'none';
}

function tutorialNext(){
  var tut=TUTORIALS[_tutCurrent]; if(!tut) return;
  if(_tutPage<tut.pages.length-1){ _tutPage++; _renderTutPage(); }
  else dismissTutorial();
}

function dismissTutorial(){
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
