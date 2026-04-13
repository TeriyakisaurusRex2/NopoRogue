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
      forge:{unlocked:false,slottedCard:null,queue:[]},
      shrine:{unlocked:false,slottedCard:null,activeBlessing:null},
      bestiary:{unlocked:false,slottedCard:null},
      shard_well:{unlocked:false,slottedCard:null},
      sanctum:   {unlocked:false,slottedCard:null},
      market:{unlocked:false,slottedCard:null, stock:[], refreshProgress:0,
              deals:[], dealsProgress:0, rare:null, rareProgress:0},
      board:{unlocked:false, slottedCard:null},
    },
    materials:{sparks:0, embers:0, flameShards:0, gemShards:0},
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
    alive:true, lastArea:null
  };
}
function getChampPersist(champId){
  if(!PERSIST.champions[champId]) PERSIST.champions[champId]=champPersistDefault(champId);
  return PERSIST.champions[champId];
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
        PERSIST.town.cards=p.town.cards||[];
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
  var base=c&&c.startDeck ? c.startDeck.slice() : CREATURES_PLAYABLE.thief.startDeck.slice();
  var mods=getSanctumMods(champId);
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
      d.className='champ-card'+(isDead?' dead-champ':'');
      d.id='cc-'+id;
      d.onclick=function(){ selectChamp(id); };
      var xpPct=Math.min(100,Math.round((cp.xp/cp.xpNext)*100));
      var s=cp.stats;
      var deadHtml=isDead?'<div class="dead-badge">✦ FALLEN — Lv.1 on next run</div>':'';
      var lastAreaHtml=cp.lastArea?'<div class="champ-last-area">Last: '+cp.lastArea+'</div>':'<div class="champ-last-area">Not yet ventured</div>';
      d.innerHTML=deadHtml
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
        +'<div class="innate-box"><div class="innate-lbl">✦ '+ch.innateName+'</div><div class="innate-txt">'+ch.innateDesc+'</div></div>';
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
      +'<div class="area-row"><span class="area-rl">FIGHTS</span><span class="area-rv">'+area.enemies.length+(isBoss?' (boss)':'')+'</span></div>';
    if(isBoss) card.style.position='relative'; // for skull positioning
    grid.appendChild(card);
  });
}

function openChampDeckView(){
  _sanctumChamp=selectedChampId;
  showDeckViewForChamp(selectedChampId);
}

function openChampSanctum(){
  _sanctumChamp=selectedChampId;
  navTo('town');
  setTimeout(function(){
    if(PERSIST.town.buildings.sanctum&&PERSIST.town.buildings.sanctum.unlocked) openBuilding('sanctum');
  },120);
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
  // Edit button
  var canEdit=PERSIST.town&&PERSIST.town.buildings&&PERSIST.town.buildings.sanctum&&PERSIST.town.buildings.sanctum.unlocked;
  document.getElementById('csp-edit-btn').style.display=canEdit?'':'none';
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

// ── Combat Background ──────────────────────────────────────────────────
function setCombatBackground(areaId){
  var gs_el = document.getElementById('game-screen');
  if(!gs_el) return;
  var src = 'assets/backgrounds/' + areaId + '.png';
  var img = new Image();
  img.onload = function(){
    gs_el.style.backgroundImage = 'url('+src+')';
    gs_el.style.backgroundSize  = 'cover';
    gs_el.style.backgroundPosition = 'center';
    gs_el.style.backgroundRepeat = 'no-repeat';
  };
  img.onerror = function(){
    // No image for this area — clear to solid colour from area def
    gs_el.style.backgroundImage = '';
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
  // Build enemy deck
  var pool=[];
  (e.deck||[]).forEach(function(card){
    for(var i=0;i<(card.copies||1);i++) pool.push(Object.assign({},card));
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
  applyShrineBlessing(); // apply shrine buff (sets gs flags)
  // Mana Font applied here after applyShrineBlessing sets _blessingManaStart
  if(gs._blessingManaStart){ gs.mana=Math.round(gs.maxMana*gs._blessingManaStart); gs._blessingManaStart=0; }
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
  var cost=inn.manaCost||0;
  var trigger=inn.trigger||'passive';
  if(trigger==='passive') return;
  // Cooldown guard
  if(gs._innCooldown>0) return;

  var shouldFire=false;
  if(trigger==='mana_full'&&gs.enemyMana>=gs.enemyMaxMana&&gs.enemyMaxMana>0) shouldFire=true;
  if(trigger==='mana_threshold'&&cost>0&&gs.enemyMana>=cost) shouldFire=true;
  if(trigger==='hp_below'&&inn.triggerValue&&gs.enemyHp<=(gs.enemyMaxHp*(inn.triggerValue||0.5))) shouldFire=true;

  if(!shouldFire) return;
  // Spend mana
  if(cost>0&&gs.enemyMana<cost) return;
  gs.enemyMana=Math.max(0,gs.enemyMana-cost);
  // Set cooldown
  gs._innCooldown=inn.cooldown||8000;
  executeEnemyInnateEffect(inn,e);
}

function executeEnemyInnateEffect(inn,e){
  addLog(e.name+' — '+inn.name+'.','innate');
  // Generic effect dispatch by innate id
  var id=inn.id;
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
  if(item.id==='focus'&&!item.ghost){
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
  ['player','enemy'].forEach(function(t){
    gs.statusEffects[t].forEach(function(s){
      if(!s.dot) return;
      s.tickAcc+=ms;
      while(s.tickAcc>=s.tickMs){
        s.tickAcc-=s.tickMs;
        if(s.id==='starburn'){ var dmg=(s.stacks||1)*5; dealDamageToEnemy(dmg); if(SETTINGS.logd==='verbose') addLog('Starburn ('+s.stacks+'×): '+dmg+' dmg.','debuff'); }
        else if(t==='enemy'){ dealDamageToEnemy(s.dpt); if(SETTINGS.logd==='verbose') addLog(s.label+': '+s.dpt+' dmg.','debuff'); }
        else {
          // DoTs bypass [Shield] — deal directly to HP, shields only absorb direct hits
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
  if(Math.random()<0.6) PERSIST.town.materials.sparks=(PERSIST.town.materials.sparks||0)+1;
  if(gs.area.level>=3&&Math.random()<0.25) PERSIST.town.materials.embers=(PERSIST.town.materials.embers||0)+1;
  if(gs.area.level>=6&&Math.random()<0.1) PERSIST.town.materials.flameShards=(PERSIST.town.materials.flameShards||0)+1;
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

function buildCardHTML(id,isGhost){
  var c=CARDS[id];
  if(!c) c={name:id,icon:'💢',type:'attack',unique:false,effect:'?',champ:null,statId:null,manaCost:0};
  var statCls=c.statId?'card-stat-'+c.statId:'card-stat-none';
  var mechanic=renderKeywords((c.effect||'').split('\n')[0]||'');
  var manaCost=c.manaCost!=null?c.manaCost:0;
  var fzStyle=cardEffectFontSize(c.effect);
  return '<div class="card '+statCls+(isGhost?' ghost':'')+(id&&id.startsWith('ghost_')?' ghost':'')+'" style="position:relative;">'
    +(isGhost||id.startsWith('ghost_')?'<div class="ghost-badge">👻</div>':'')
    +'<div class="card-title">'+c.name+'</div>'
    +'<div class="card-art">'
    +cardArtHTML(id, c.icon, manaCost)
    +'</div>'
    +'<div class="card-effect" style="'+fzStyle+'">'+mechanic+'</div>'
    +'<div class="card-type-bar '+c.type+'">'      +(c.champ&&CREATURES[c.champ]?'<span class="card-champ-icon">'+creatureImgHTML(c.champ,CREATURES[c.champ].icon||'','14px')+'</span>':'')      +c.type.toUpperCase()    +'</div>'    +'</div>';
}


// Card art — tries assets/cards/backgrounds/{cardId}.png over the emoji icon
function cardArtHTML(cardId, emoji, manaCost){
  var src = 'assets/cards/backgrounds/' + cardId + '.png';
  var onerr = "this.parentNode.classList.remove('has-card-art');";
  var onld  = "this.parentNode.classList.add('has-card-art');";
  return '<img class="card-bg-img" src="'+src+'" onerror="'+onerr+'" onload="'+onld+'">'
    + '<span class="card-emoji-icon">'+emoji+'</span>'
    + (manaCost?'<div class="card-mana-badge">'+manaCost+'◈</div>':'');
}

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
    // Only show the first line — keywords have tooltips, explain row is removed
    var mechanic=renderKeywords((cEffect.split('\n')[0])||'');
    var fzStyle=cardEffectFontSize(cEffect);
    var manaCost=cd&&cd.manaCost!=null?cd.manaCost:0;
    d.innerHTML=(isGhost?'<div class="ghost-badge">👻</div>':'')
      +'<div class="card-title">'+(cd?cd.name:item.id)+'</div>'
      +'<div class="card-art">'
      +cardArtHTML(item.id, cd?cd.icon:'?', manaCost)
      +'</div>'
      +'<div class="card-effect" style="'+fzStyle+'">'+mechanic+'</div>'
      +'<div class="card-type-bar '+(cd?cd.type:'')+'">'        +(cd&&cd.champ&&CREATURES[cd.champ]?'<span class="card-champ-icon">'+creatureImgHTML(cd.champ,CREATURES[cd.champ].icon||'','14px')+'</span>':'')        +(cd?cd.type.toUpperCase():'')      +'</div>';

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
  var loot=areaDef.loot; if(!loot) return [];
  var gained=[];
  // Always get the key
  if(loot.always){ addLootItem(loot.always,1); gained.push(loot.always); }
  // Bonus roll for chest
  if(loot.bonus&&loot.bonusChance>0&&Math.random()<loot.bonusChance){
    addLootItem(loot.bonus,1); gained.push(loot.bonus);
  }
  if(gained.length) savePersist();
  return gained;
}

var _lootToastTimer=null;
function showLootToast(gained){
  if(!gained||!gained.length) return;
  var el=document.getElementById('levelup-toast'); // reuse toast element
  if(!el) return;
  document.getElementById('lu-toast-title').textContent='AREA COMPLETE!';
  document.getElementById('lu-toast-stats').textContent=gained.map(function(id){
    var def=LOOT_DEFS[id]; return def?(def.icon+' '+def.name):'?';
  }).join('  ·  ');
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
  shrine: {
    id:'shrine', name:'The Shrine', icon:'🏮',
    desc:'Grants your champion small blessings at the start of each run.',
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
  var b=PERSIST.town.buildings.vault;
  var def=BUILDINGS.vault;
  var u=PERSIST.town.vaultUpgrades||{};
  var upgSlots=(u.shelf1?8:0)+(u.shelf2?8:0)+(u.shelf3?8:0);
  var base=def.defaultCap+upgSlots;
  if(!b.slottedCard) return base;
  var card=PERSIST.town.cards.find(function(c){return c.id===b.slottedCard;});
  if(!card) return base;
  return base+def.slotEffect(card.tier);
}

function getTownCardCount(){
  return PERSIST.town.cards.length;
}

function getUnslottedCards(){
  return PERSIST.town.cards.filter(function(c){return !c.slottedIn;});
}

function getTownCardById(id){
  return PERSIST.town.cards.find(function(c){return c.id===id;})||null;
}

// Add a new Red card to town inventory (called from achievement claim)
function addTownCard(tier){
  tier=tier||'ruby';
  var id='tc_'+(Date.now())+'_'+Math.floor(Math.random()*1000);
  PERSIST.town.cards.push({id:id,tier:tier,slottedIn:null});
  savePersist();
  return id;
}

function slotCardIntoBuilding(cardId, buildingId){
  var card=getTownCardById(cardId);
  if(!card) return;
  // Unslot whatever was there
  var b=PERSIST.town.buildings[buildingId];
  if(b.slottedCard){
    var old=getTownCardById(b.slottedCard);
    if(old) old.slottedIn=null;
  }
  // Unslot card from wherever it was
  if(card.slottedIn){
    var prev=PERSIST.town.buildings[card.slottedIn];
    if(prev) prev.slottedCard=null;
  }
  card.slottedIn=buildingId;
  b.slottedCard=cardId;
  savePersist();
}

function unslotCard(cardId){
  var card=getTownCardById(cardId);
  if(!card||!card.slottedIn) return;
  var b=PERSIST.town.buildings[card.slottedIn];
  if(b) b.slottedCard=null;
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

function buildTownCardsStrip(){
  var strip=document.getElementById('town-cards-strip');
  strip.innerHTML='<span class="town-cards-strip-lbl">GEMS</span>';
  var unslotted=getUnslottedCards();
  if(unslotted.length===0){
    var e=document.createElement('span');
    e.className='town-card empty-hand'; e.textContent='No gems — craft from Gem Shards or earn from achievements';
    strip.appendChild(e);
  } else {
    unslotted.forEach(function(card){
      var el=document.createElement('div');
      el.className='town-card '+card.tier;
      var tierName=CARD_TIER_LABELS[card.tier]||card.tier;
      el.innerHTML='<span class="town-card-gem">'+TOWN_CARD_GEMS(card.tier)+'</span> '+tierName.toUpperCase();
      el.draggable=true;
      el.dataset.cardId=card.id;
      el.ondragstart=function(ev){ ev.dataTransfer.setData('cardId',card.id); el.style.opacity='.4'; };
      el.ondragend=function(){ el.style.opacity=''; };
      el.onclick=function(){ openSlotPicker(card.id); };
      strip.appendChild(el);
    });
  }
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
    if(id==='shrine') return true; // always visible once vault unlocked
    if(id==='bestiary') return PERSIST.seenEnemies.length>=3||PERSIST.gold>=50;
    if(id==='market') return PERSIST.town.buildings.shrine&&PERSIST.town.buildings.shrine.unlocked;
    if(id==='sanctum') return PERSIST.town.buildings.bestiary&&PERSIST.town.buildings.bestiary.unlocked||PERSIST.gold>=150;
    if(id==='shard_well') return PERSIST.town.buildings.market&&PERSIST.town.buildings.market.unlocked||PERSIST.gold>=200;
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
    var slottedCard=b&&b.slottedCard?getTownCardById(b.slottedCard):null;
    var isActive=!!slottedCard;
    var cost=BUILDING_UNLOCK_COSTS[bdef.id];
    var canAfford=cost&&cost.gold&&PERSIST.gold>=cost.gold;

    var card=document.createElement('div');
    card.className='building-card'+(isActive?' active':'')+(unlocked?'':' locked');

    // Drop zone — accept dragged town cards
    card.ondragover=function(ev){ ev.preventDefault(); if(unlocked||canAfford) card.classList.add('drop-ready'); };
    card.ondragleave=function(){ card.classList.remove('drop-ready'); };
    card.ondrop=function(ev){
      card.classList.remove('drop-ready');
      if(!unlocked) return; // can't drop onto locked (must buy first)
      onBuildingDrop(ev,bdef.id);
    };
    var achOnly=cost&&cost.achId&&!cost.gold&&!cost.seenCount;
    if(unlocked) card.onclick=function(){ openBuilding(bdef.id); };
    else if(!achOnly&&canAfford) card.onclick=function(){ openBuilding(bdef.id); };

    var pipHtml=slottedCard
      ?'<div class="bc-slot-pip '+slottedCard.tier+'">'+TOWN_CARD_GEMS(slottedCard.tier)+'</div>'
      :'<div class="bc-slot-pip empty">—</div>';

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

    var statusTxt=!unlocked?'LOCKED':isActive?'ACTIVE':'SLOT A GEM';
    var statusCls=!unlocked?'locked':isActive?'active':'empty';

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
        +'<div class="bc-slot">'+pipHtml+'</div>'
        +hintHtml
        +levelHtml
        +'<div class="bc-status '+statusCls+'">'+statusTxt+'</div>'
      +'</div>';
    grid.appendChild(card);
  });
}

// ── Drag-drop handler ──
function onBuildingDrop(ev,buildingId){
  ev.preventDefault();
  var cardId=ev.dataTransfer.getData('cardId');
  if(!cardId) return;
  var b=PERSIST.town.buildings[buildingId];
  if(!b||!b.unlocked) return;
  // Swap: unslot whatever is there first
  if(b.slottedCard&&b.slottedCard!==cardId) unslotCard(b.slottedCard);
  slotCardIntoBuilding(cardId,buildingId);
  buildTownCardsStrip(); buildTownGrid();
  refreshBuildingPanel(buildingId);
  showTownToast((BUILDINGS[buildingId]?BUILDINGS[buildingId].name:buildingId)+' activated!');
}

// ── Shrine blessings pool ──
// ═══════════════════════════════════════════════════════
// BUILDING LEVEL SYSTEM
// ═══════════════════════════════════════════════════════
function getBuildingXpToNext(level){
  return Math.round(50*Math.pow(level,1.5));
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
    // Keep vault legacy field in sync
    if(id==='vault') PERSIST.town.vaultLevel=level;
  }
}

function grantAreaClearBuildingXp(areaLevel){
  var xp=10+areaLevel*2;
  var blds=PERSIST.town.buildings;
  Object.keys(blds).forEach(function(id){
    if(blds[id]&&blds[id].unlocked) addBuildingXp(id,xp);
  });
  savePersist();
}

var SHRINE_BLESSINGS = [
  // Lv1 — always available once Shrine unlocked
  {id:'first_aid',     lvl:1, icon:'💖', name:'First Aid',       desc:'First enemy you face has 10% less HP.',           descGem:'First enemy has 20% less HP.'},
  {id:'mana_font',     lvl:1, icon:'🔮', name:'Mana Font',       desc:'Start the first battle with 30% mana.',           descGem:'Start with 40% mana.'},
  {id:'scholars_boon', lvl:1, icon:'✨', name:'Scholar\'s Boon', desc:'+10% XP from all enemies this run.',              descGem:'+15% XP.'},
  {id:'deep_pockets',  lvl:1, icon:'🃏', name:'Deep Pockets',    desc:'Start the first battle with 1 extra card.',       descGem:'Start with 2 extra cards.'},
  // Lv2
  {id:'binding_light', lvl:2, icon:'🛡️', name:'Binding Light',   desc:'Start each battle with a 5-HP shield for 5s.',    descGem:'Start with an 8-HP shield for 5s.'},
  {id:'revitalise',    lvl:2, icon:'💚', name:'Revitalise',      desc:'Restore 3 HP between each battle.',               descGem:'Restore 5 HP between each battle.'},
  {id:'war_cry',       lvl:2, icon:'📣', name:'War Cry',         desc:'Start each battle with +25% attack speed for 3s.',descGem:'+25% attack speed for 5s.'},
  // Lv3
  {id:'battle_trance', lvl:3, icon:'💨', name:'Battle Trance',   desc:'Start each battle with draw speed +30% for 4s.',  descGem:'Draw speed +50% for 4s.'},
  {id:'bloodlust',     lvl:3, icon:'🩸', name:'Bloodlust',       desc:'Each kill restores 2 HP.',                        descGem:'Each kill restores 3 HP.'},
  {id:'predators_eye', lvl:3, icon:'🎯', name:'Predator\'s Eye', desc:'Start each battle with +15% damage for 3s.',     descGem:'+20% damage for 3s.'},
  // Lv4
  {id:'resilience',    lvl:4, icon:'🪨', name:'Resilience',      desc:'Take 10% less damage for the whole run.',         descGem:'Take 15% less damage.'},
  {id:'second_wind',   lvl:4, icon:'💫', name:'Second Wind',     desc:'Once per run: survive a killing blow at 1 HP.',   descGem:'Survive at 3 HP.'},
  // Lv5
  {id:'cursed_touch',  lvl:5, icon:'🌑', name:'Cursed Touch',    desc:'Each battle starts with enemy having [Cursed].',  descGem:'Enemy starts with [Cursed] + [Marked].'},
  {id:'momentum',      lvl:5, icon:'🌀', name:'Momentum',        desc:'Each card played reduces draw interval by 2%.',   descGem:'Each card reduces interval by 3%.'},
];

function isBlessingUnlocked(bl){
  var shrineLevel=getBuildingLevel('shrine');
  return bl.lvl<=shrineLevel;
}

function getBlessingProgress(bl){
  var shrineLevel=getBuildingLevel('shrine');
  if(bl.lvl<=shrineLevel) return {cur:bl.lvl,need:bl.lvl,done:true};
  // Show XP progress toward the level needed
  var xp=PERSIST.town.buildingXp&&PERSIST.town.buildingXp.shrine||0;
  var cur=0;
  for(var lv=1;lv<bl.lvl;lv++) cur+=getBuildingXpToNext(lv);
  var totalNeeded=cur+getBuildingXpToNext(bl.lvl-1);
  var totalEarned=cur; // approximate — just show current level
  return {cur:shrineLevel,need:bl.lvl,done:false,label:'Shrine Lv'+shrineLevel+' / Lv'+bl.lvl+' needed'};
}

// Apply shrine blessing at run start — works without gem, gem enhances effect
function applyShrineBlessing(){
  var b=PERSIST.town.buildings.shrine;
  if(!b||!b.activeBlessing) return;
  var bl=SHRINE_BLESSINGS.find(function(x){return x.id===b.activeBlessing;});
  if(!bl||!isBlessingUnlocked(bl)) return;
  var g=!!b.slottedCard;

  switch(bl.id){
    case 'first_aid':     gs._shrineHpOpen=g?0.80:0.90; break;
    case 'mana_font':     gs._blessingManaStart=g?0.40:0.30; break;
    case 'scholars_boon': gs._shrineXpBonus=g?1.15:1.10; break;
    case 'deep_pockets':  gs._shrineExtraCards=g?2:1; break;
    case 'binding_light': gs._shrineOpenShield=g?8:5; break;
    case 'revitalise':    gs._shrineRevitalise=g?5:3; break;
    case 'war_cry':       gs._shrineWarCry={speed:0.25,dur:g?5000:3000}; break;
    case 'battle_trance': gs._shrineBattleTrance={speed:g?0.50:0.30,dur:4000}; break;
    case 'bloodlust':     gs._shrineBloodlust=g?3:2; break;
    case 'predators_eye': gs._shrinePredatorsEye={dmg:g?0.20:0.15,dur:3000}; break;
    case 'resilience':    gs._shrineResilience=g?0.15:0.10; break;
    case 'second_wind':   gs._shrineSecondWind=g?3:1; gs._shrineSecondWindUsed=false; break;
    case 'cursed_touch':  gs._shrineCursedTouch=g?2:1; break;
    case 'momentum':      gs._shrineMomentum=g?0.03:0.02; break;
  }
  addLog('Shrine: '+bl.name+(g?' ✦':'')+'.','buff');
}

// ── Unlock building ──
var BUILDING_UNLOCK_COSTS = {
  forge:    { achId:'rising_power',  desc:'Reach level 3 — the Forge unlocks automatically.' },
  board:    { achId:'battle_hardened', desc:'Reach level 5 — the Adventurer\'s Board unlocks automatically.' },
  shrine:   { gold:80,  desc:'Purchase the Shrine for 80 gold to gain run blessings.' },
  bestiary: { seenCount:10, gold:100, desc:'Unlocked by encountering 10 different enemies, or purchase for 100 gold.' },
  market:   { gold:150, desc:'Purchase The Market for 150 gold to buy chests.' },
  sanctum:  { gold:250, desc:'Purchase The Sanctum for 250 gold to customise champion decks and training.' },
  shard_well:{ gold:300, desc:'Purchase the Shard Well for 300 gold.' },
};

function tryUnlockBuilding(id){
  var cost=BUILDING_UNLOCK_COSTS[id];
  if(!cost) return;
  if(PERSIST.town.buildings[id].unlocked) return;

  if(cost.seenCount){
    // Can unlock free if seen enough, or pay gold
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
    if(!ach||!isAchComplete(ach)){ showTownToast('Complete the required achievement first.'); return; }
  } else if(cost.gold>0){
    if(PERSIST.gold<cost.gold){ showTownToast('Need '+cost.gold+' gold to unlock!'); return; }
    PERSIST.gold-=cost.gold;
  }

  PERSIST.town.buildings[id].unlocked=true;
  savePersist();
  buildTownGrid();
  openBuilding(id);
  document.getElementById('town-gold').textContent='✦ '+PERSIST.gold;
}

// Auto-check bestiary unlock whenever a new enemy is seen
function checkBestiaryAutoUnlock(){
  var b=PERSIST.town.buildings.bestiary;
  if(b.unlocked) return;
  var cost=BUILDING_UNLOCK_COSTS.bestiary;
  if(cost&&cost.seenCount&&PERSIST.seenEnemies.length>=cost.seenCount){
    b.unlocked=true;
    savePersist();
    buildTownGrid();
    // Show a toast if town is visible
    showTownToast('📖 Bestiary unlocked! You\'ve encountered '+PERSIST.seenEnemies.length+' creatures.');
  }
}

// ── Generic building slot click ──
function onBuildingSlotClick(id){
  var b=PERSIST.town.buildings[id];
  if(b.slottedCard){
    unslotCard(b.slottedCard);
  } else {
    var avail=getUnslottedCards();
    if(avail.length===0){ showTownToast('No cards in hand — earn from achievements.'); return; }
    // Auto-slot first available
    slotCardIntoBuilding(avail[0].id, id);
  }
  // Refresh whichever panel is open
  refreshBuildingPanel(id);
  buildTownCardsStrip();
  buildTownGrid();
}

function refreshBuildingPanel(id){
  if(id==='vault') refreshVaultPanel();
  else if(id==='forge') refreshForgePanel();
  else if(id==='shrine') refreshShrinePanel();
  else if(id==='bestiary') refreshBestiaryPanel();
  else if(id==='market') refreshMarketPanel();
  else if(id==='sanctum') refreshSanctumPanel();
  else if(id==='board') refreshBoardPanel();
  else if(id==='shard_well') refreshShardWellPanel();
}

// ── Open a building ──
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
  if(b.unlocked){ lockMsg.style.display='none'; inner.style.display='block'; return; }
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
        ?'<button class="btn btn-gold" style="font-size:10px;margin-top:4px;" onclick="tryUnlockBuilding(\''+id+'\')">UNLOCK FREE →</button>'
        :'<div class="lock-or-divider">— or —</div>'
          +'<button class="btn btn-dim" style="font-size:10px;"'+(canBuy?'onclick="tryUnlockBuilding(\''+id+'\')"':' disabled')+'>'
            +'✦ '+cost.gold+'g to unlock now'
          +'</button>'
          +(canBuy?'':'<div style="font-size:8px;color:#3a2010;margin-top:3px;">Need '+(cost.gold-PERSIST.gold)+'g more</div>')
      );
  } else if(cost.achId){
    var ach=ACHIEVEMENTS.find(function(a){return a.id===cost.achId;});
    var prog=ach?getAchProgress(ach):{current:0,needed:20};
    btnHtml='<div class="town-unlock-desc">'+cost.desc+'</div>'
      +'<div style="font-size:9px;color:#7a6030;margin-bottom:8px;">Progress: '+prog.current+'/'+prog.needed+'</div>'
      +(isAchComplete(ach)
        ?'<button class="btn btn-gold" style="font-size:10px;" onclick="tryUnlockBuilding(\''+id+'\')">UNLOCK FREE</button>'
        :'<div style="font-size:9px;color:#4a3010;">Complete the achievement to unlock</div>');
  } else {
    btnHtml='<div class="town-unlock-cost">'+cost.gold+' gold</div>'
      +'<div class="town-unlock-desc">'+cost.desc+'</div>'
      +(PERSIST.gold>=cost.gold
        ?'<button class="btn btn-gold" style="font-size:10px;" onclick="tryUnlockBuilding(\''+id+'\')">PURCHASE</button>'
        :'<div style="font-size:9px;color:#4a3010;">Not enough gold (have '+PERSIST.gold+'g)</div>');
  }
  lockMsg.innerHTML=btnHtml;
}

// ── FORGE ──
var FORGE_UPGRADE_TIMES = { base_ruby:120, ruby_emerald:300, emerald_sapphire:600 }; // seconds
var FORGE_UPGRADE_COSTS = {
  base_ruby:       { sparks:3 },
  ruby_emerald:    { sparks:8, embers:3 },
  emerald_sapphire:{ sparks:15, embers:8, flameShards:2 },
};
var CARD_TIER_ORDER = ['base','ruby','emerald','sapphire','turquoise','amethyst','topaz','obsidian','opal'];
var CARD_TIER_LABELS = {base:'Base',ruby:'Ruby',emerald:'Emerald',sapphire:'Sapphire',turquoise:'Turquoise',amethyst:'Amethyst',topaz:'Topaz',obsidian:'Obsidian',opal:'Opal'};

function getCardCurrentTier(cardId){
  // Cards in combat deck have no tier — they're 'base'. Town cards have tiers.
  return 'base';
}

function getForgeSpeed(){
  var b=PERSIST.town.buildings.forge;
  if(!b.slottedCard) return 0;
  var card=getTownCardById(b.slottedCard);
  if(!card) return 0;
  return card.tier==='red'?1:card.tier==='green'?2:3; // multiplier
}

function refreshForgePanel(){
  showLockedBuildingUI('forge');
  var b=PERSIST.town.buildings.forge;
  if(!b.unlocked) return;

  // Slot
  var slotCard=b.slottedCard?getTownCardById(b.slottedCard):null;
  var slotEl=document.getElementById('forge-slot');
  slotEl.className='building-slot'+(slotCard?' has-card '+slotCard.tier:'');
  slotEl.innerHTML=slotCard?'<span class="slot-card-gem">'+TOWN_CARD_GEMS(slotCard.tier)+'</span>':'<span style="color:#3a2810;font-size:18px;">+</span>';
  document.getElementById('forge-slot-hint').textContent=slotCard
    ?slotCard.tier.charAt(0).toUpperCase()+slotCard.tier.slice(1)+' Gem — Speed: '+getForgeSpeed()+'× | Click to unslot'
    :'Slot a gem to speed up upgrades';

  // Queue empty message
  var qEl=document.getElementById('forge-queue'); qEl.innerHTML='';
  var queue=b.queue||[];
  if(!queue.length){
    var eh=document.createElement('div'); eh.style.cssText='font-size:9px;color:#3a2810;font-style:italic;padding:6px 0;';
    eh.textContent='No upgrades queued. Select a card below to upgrade.';
    qEl.appendChild(eh);
  } else {
    queue.forEach(function(item,i){
      var now=Date.now();
      var elapsed=now-item.startTime;
      var totalMs=item.totalMs;
      var pct=Math.min(100,Math.round((elapsed/totalMs)*100));
      var etaSec=Math.max(0,Math.round((totalMs-elapsed)/1000));
      var el=document.createElement('div'); el.className='forge-queue-item';
      el.innerHTML='<div class="forge-queue-name">'+(CARDS[item.cardId]?CARDS[item.cardId].name:item.cardId)
        +' → '+CARD_TIER_LABELS[item.toTier]+'</div>'
        +'<div class="forge-queue-prog"><div class="forge-queue-bar" style="width:'+pct+'%"></div></div>'
        +'<div class="forge-queue-eta">'+etaSec+'s</div>'
        +(i===0?'<span style="cursor:pointer;color:#c03030;font-size:10px;margin-left:4px;" onclick="forgeCancelItem(0)">✕</span>':'');
      qEl.appendChild(el);
    });
  }

  // Materials
  var mEl=document.getElementById('forge-mats'); mEl.innerHTML='';
  Object.keys(MATERIAL_DEFS).forEach(function(k){
    var el=document.createElement('div'); el.className='forge-mat-item';
    el.innerHTML=MATERIAL_DEFS[k].icon+' <span class="material-count">'+(PERSIST.town.materials[k]||0)+'</span>';
    el.title=MATERIAL_DEFS[k].name+': '+(PERSIST.town.materials[k]||0);
    mEl.appendChild(el);
  });

  // Upgrade targets — always available, gem speeds up queue
  var tEl=document.getElementById('forge-targets'); tEl.innerHTML='';
  var speedNote=slotCard?' <span style="color:#d4a843;font-size:7px;">(gem: '+getForgeSpeed()+'× speed)</span>':'';
  var seen={};
  Object.values(CARDS).forEach(function(c){
    if(seen[c.id]) return; seen[c.id]=true;
    var fromTier='base', toTier='ruby';
    var costDef=FORGE_UPGRADE_COSTS[fromTier+'_'+toTier];
    var canAfford=Object.keys(costDef).every(function(k){return (PERSIST.town.materials[k]||0)>=costDef[k];});
    var costStr=Object.keys(costDef).map(function(k){return MATERIAL_DEFS[k].icon+costDef[k];}).join(' ');
    var el=document.createElement('div'); el.className='forge-target'+(canAfford?'':' disabled');
    el.innerHTML='<div class="forge-target-name">'+c.icon+' '+c.name+'</div>'
      +'<div class="forge-target-cost">Base → Red | '+costStr+'</div>';
    if(canAfford) el.onclick=function(){ forgeQueueUpgrade(c.id,'base','red'); refreshForgePanel(); };
    tEl.appendChild(el);
  });
}

function forgeQueueUpgrade(cardId, fromTier, toTier){
  var b=PERSIST.town.buildings.forge;
  if(!b.unlocked) return;
  var costDef=FORGE_UPGRADE_COSTS[fromTier+'_'+toTier];
  Object.keys(costDef).forEach(function(k){ PERSIST.town.materials[k]=(PERSIST.town.materials[k]||0)-costDef[k]; });
  var speed=getForgeSpeed();
  var baseSec=FORGE_UPGRADE_TIMES[fromTier+'_'+toTier];
  var totalMs=Math.round((baseSec/speed)*1000);
  if(!b.queue) b.queue=[];
  b.queue.push({cardId:cardId,fromTier:fromTier,toTier:toTier,startTime:Date.now(),totalMs:totalMs});
  savePersist();
  addLog('Queued: '+(CARDS[cardId]?CARDS[cardId].name:cardId)+' upgrade ('+Math.round(totalMs/1000)+'s).','sys');
}

function forgeCancelItem(idx){
  var b=PERSIST.town.buildings.forge;
  if(!b.queue||!b.queue[idx]) return;
  var item=b.queue.splice(idx,1)[0];
  // Refund materials
  var costDef=FORGE_UPGRADE_COSTS[item.fromTier+'_'+item.toTier];
  Object.keys(costDef).forEach(function(k){ PERSIST.town.materials[k]=(PERSIST.town.materials[k]||0)+costDef[k]; });
  savePersist(); refreshForgePanel();
}

// ── SHARD WELL ──────────────────────────────────────────────────────
var SHARD_WELL_BASE_SECS = 300;   // 1 shard per 5 min base
var SHARD_WELL_GEM_MULT  = 2.5;   // gem makes it 2.5× faster (1 per 2 min)

function getShardWellRate(){
  var b=PERSIST.town.buildings.shard_well;
  if(!b||!b.unlocked) return 0;
  var secsPerShard=b.slottedCard
    ? Math.round(SHARD_WELL_BASE_SECS/SHARD_WELL_GEM_MULT)
    : SHARD_WELL_BASE_SECS;
  return secsPerShard;
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
    PERSIST.town.materials.gemShards=(PERSIST.town.materials.gemShards||0)+earned;
    savePersist();
    // Refresh panel if open
    var panel=document.getElementById('shard_well-panel-bg');
    if(panel&&panel.classList.contains('show')) refreshShardWellPanel();
  }
  // Always refresh banner ETA (cheap DOM op)
  refreshSummonsBanner();
}

// ═══════════════════════════════════════════════════════
// SOUL SHARD SUMMON SYSTEM
// ═══════════════════════════════════════════════════════
function performSummon(){
  if((PERSIST.soulShards||0)<SOUL_SHARDS_PER_PULL){
    showTownToast('Need '+SOUL_SHARDS_PER_PULL+' Soul Shards to summon. You have '+(PERSIST.soulShards||0)+'.');
    return null;
  }
  var pool=getAvailablePool();
  if(!pool.length){ showTownToast('No seen champions in pool yet. Explore more areas!'); return null; }

  PERSIST.soulShards-=SOUL_SHARDS_PER_PULL;

  // Weighted roll
  var totalWeight=pool.reduce(function(s,e){return s+e.weight;},0);
  var roll=Math.random()*totalWeight;
  var acc=0, result=null;
  for(var i=0;i<pool.length;i++){
    acc+=pool[i].weight;
    if(roll<acc){ result=pool[i]; break; }
  }
  if(!result) result=pool[pool.length-1];

  var champId=result.id;
  var isDupe=PERSIST.unlockedChamps.indexOf(champId)!==-1;

  // Ensure champion definition exists
  ensureEnemyChampion(champId);

  if(isDupe){
    if(!PERSIST.champDupes) PERSIST.champDupes={};
    PERSIST.champDupes[champId]=(PERSIST.champDupes[champId]||0)+1;
    savePersist();
    return {champId:champId, rarity:result.rarity, isDupe:true, dupes:PERSIST.champDupes[champId]};
  } else {
    PERSIST.unlockedChamps.push(champId);
    savePersist();
    return {champId:champId, rarity:result.rarity, isDupe:false};
  }
}

function getAscensionLevel(champId){
  // Returns 0-5 based on how many ASCENSION_TIERS have been purchased
  if(!PERSIST.champDupes) return 0;
  var spent=PERSIST.champDupes['_spent_'+champId]||0;
  var level=0;
  var cumulative=0;
  for(var i=0;i<ASCENSION_TIERS.length;i++){
    cumulative+=ASCENSION_TIERS[i].cost;
    if(spent>=cumulative) level=i+1; else break;
  }
  return level;
}

function getAscensionTierName(champId){
  var level=getAscensionLevel(champId);
  return level===0?'Base':CARD_TIER_LABELS[ASCENSION_TIERS[level-1].tier]||'Base';
}

function ascendChampion(champId){
  var level=getAscensionLevel(champId);
  if(level>=ASCENSION_TIERS.length){ showTownToast('Already at maximum ascension!'); return; }
  var nextTier=ASCENSION_TIERS[level];
  var have=PERSIST.champDupes&&PERSIST.champDupes[champId]||0;
  if(have<nextTier.cost){
    showTownToast('Need '+nextTier.cost+' '+( CREATURES[champId]?CREATURES[champId].name:champId)+' dupes (have '+have+').');
    return;
  }
  PERSIST.champDupes[champId]=(PERSIST.champDupes[champId]||0)-nextTier.cost;
  if(!PERSIST.champDupes['_spent_'+champId]) PERSIST.champDupes['_spent_'+champId]=0;
  PERSIST.champDupes['_spent_'+champId]+=nextTier.cost;

  var cp=getChampPersist(champId);
  var ch=getCreaturePlayable(champId);
  // Each tier: +3 base stats AND +0.5 growth
  cp.stats.str+=nextTier.baseBonus; cp.stats.agi+=nextTier.baseBonus; cp.stats.wis+=nextTier.baseBonus;
  if(ch){ ch.growth.str+=nextTier.growthBonus; ch.growth.agi+=nextTier.growthBonus; ch.growth.wis+=nextTier.growthBonus; }
  savePersist();
  refreshShardWellPanel();
  var tierName=CARD_TIER_LABELS[nextTier.tier]||nextTier.tier;
  var icon=TOWN_CARD_GEMS(nextTier.tier)||'✦';
  showTownToast(icon+' '+( CREATURES[champId]?CREATURES[champId].name:champId)+' ascended to '+tierName+'!');
}

var _shardWellTab='generate';
function setShardWellTab(tab){
  _shardWellTab=tab;
  refreshShardWellPanel();
}

function refreshSummonsBanner(){
  var banner=document.getElementById('town-summons-banner');
  if(!banner) return;
  var wellUnlocked=PERSIST.town.buildings.shard_well&&PERSIST.town.buildings.shard_well.unlocked;
  if(!wellUnlocked){ banner.style.display='none'; return; }
  banner.style.display='block';

  var souls=PERSIST.soulShards||0;
  var canSummon=souls>=SOUL_SHARDS_PER_PULL;
  var pool=getAvailablePool();
  var hasPool=pool.length>0;

  // Generation rate info
  var rate=getShardWellRate();
  var b=PERSIST.town.buildings.shard_well;
  var acc=b?b.shardAcc||0:0;
  var etaSec=rate>0?Math.max(0,rate-acc):0;
  var subText=rate>0
    ?'Shard Well active · next Soul Shard in '+(etaSec>=120?Math.ceil(etaSec/60)+'m':Math.ceil(etaSec)+'s')
    :'Slot a gem in the Shard Well to generate faster';

  banner.innerHTML=
    '<div class="summons-banner" onclick="openSummonsOverlay()">'
      +'<div class="summons-banner-icon">🔮</div>'
      +'<div class="summons-banner-info">'
        +'<div class="summons-banner-title">THE ETERNAL SUMMONS</div>'
        +'<div class="summons-banner-sub">'+subText+'</div>'
      +'</div>'
      +'<div class="summons-banner-shards">'
        +'<div class="summons-banner-count">'+souls+' 🔮</div>'
        +'<div class="summons-banner-label">SOUL SHARDS</div>'
      +'</div>'
      +'<button class="summons-banner-btn'+(canSummon&&hasPool?' ready':'')+'" onclick="event.stopPropagation();openSummonsOverlay()">'
        +(canSummon&&hasPool?'✦ SUMMON':'SUMMON')
      +'</button>'
    +'</div>';
}

function openSummonsOverlay(){
  openTestGacha();
}

function refreshShardWellPanel(){
  showLockedBuildingUI('shard_well');
  var b=PERSIST.town.buildings.shard_well;
  if(!b||!b.unlocked) return;

  var slotCard=b.slottedCard?getTownCardById(b.slottedCard):null;
  var slotEl=document.getElementById('shard_well-slot');
  if(slotEl){
    slotEl.className='building-slot'+(slotCard?' has-card '+slotCard.tier:'');
    slotEl.innerHTML=slotCard
      ?'<span class="slot-card-gem">'+TOWN_CARD_GEMS(slotCard.tier)+'</span>'
      :'<span style="color:#3a2810;font-size:18px;">+</span>';
  }
  var hint=document.getElementById('shard_well-slot-hint');
  if(hint) hint.textContent=slotCard
    ?'Gem active — faster gem shard gen + Soul Shard trickle. Click to unslot.'
    :'Slot a gem to boost generation rates.';

  var display=document.getElementById('shard-well-display');
  if(!display) return;
  var tab=_shardWellTab||'generate';
  display.innerHTML=''
    +'<div style="display:flex;gap:4px;margin-bottom:10px;">'
      +'<button class="bestiary-tab'+(tab==='generate'?' active':'')+'" onclick="setShardWellTab(\'generate\')">💎 GEM SHARDS</button>'
      +'<button class="bestiary-tab'+(tab==='summon'?' active':'')+'" onclick="setShardWellTab(\'summon\')">🔮 SOUL SUMMON</button>'
    +'</div>'
    +'<div id="shard-well-tab-content"></div>';

  var content=document.getElementById('shard-well-tab-content');
  if(!content) return;

  if(tab==='generate'){
    var rate=getShardWellRate();
    var acc=b.shardAcc||0;
    var pct=rate>0?Math.round((acc/rate)*100):0;
    var etaSec=rate>0?Math.max(0,rate-acc):0;
    var etaStr=etaSec>=60?Math.ceil(etaSec/60)+'m '+Math.round(etaSec%60)+'s':Math.ceil(etaSec)+'s';
    var shards=PERSIST.town.materials.gemShards||0;
    content.innerHTML=''
      +'<div style="font-size:9px;color:#5a4020;margin-bottom:8px;">Passively generates 💎 Gem Shards. Craft them into Gems in the Vault.</div>'
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
        +'<div style="font-size:28px;">💎</div>'
        +'<div><div style="font-size:14px;color:#d4a843;font-family:Cinzel,serif;">'+shards+' Gem Shards</div>'
          +'<div style="font-size:8px;color:#5a4020;">30 shards = Ruby Gem</div></div>'
      +'</div>'
      +'<div style="font-size:8px;color:#7a6030;margin-bottom:3px;">Next shard in '+etaStr+'</div>'
      +'<div style="height:5px;background:rgba(0,0,0,.4);border-radius:3px;overflow:hidden;margin-bottom:8px;">'
        +'<div style="height:100%;width:'+pct+'%;background:#c09030;border-radius:3px;"></div>'
      +'</div>'
      +'<div style="font-size:8px;color:#5a4020;">Rate: 1 shard every '+(rate>=60?Math.round(rate/60)+'m':rate+'s')+(slotCard?' ✦':'')+'</div>';
  } else {
    var souls=PERSIST.soulShards||0;
    var pool=getAvailablePool();
    var canSummon=souls>=SOUL_SHARDS_PER_PULL&&pool.length>0;
    var poolHtml='';
    if(pool.length){
      var byRarity={legendary:[],rare:[],uncommon:[],common:[]};
      pool.forEach(function(e){
        ensureEnemyChampion(e.id);
        (byRarity[e.rarity]||byRarity.common).push(e);
      });
      ['legendary','rare','uncommon','common'].forEach(function(r){
        if(!byRarity[r].length) return;
        var col=RARITY_COLORS[r]||'#c0a060';
        poolHtml+='<div style="font-size:7px;color:'+col+';letter-spacing:1px;margin:6px 0 3px;">'+RARITY_LABELS[r]+' ('+byRarity[r].length+')</div>';
        poolHtml+='<div style="display:flex;flex-wrap:wrap;gap:2px;">'
          +byRarity[r].map(function(e){
            var ch=CREATURES[e.id]; if(!ch) return '';
            return '<span style="font-size:13px;cursor:default;" title="'+ch.name+'">'+ch.icon+'</span>';
          }).join('')+'</div>';
      });
    } else {
      poolHtml='<div style="font-size:9px;color:#5a4020;">All champions unlocked!</div>';
    }
    content.innerHTML=''
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
        +'<div style="font-size:28px;">🔮</div>'
        +'<div><div style="font-size:14px;color:#d4a843;font-family:Cinzel,serif;">'+souls+' Soul Shards</div>'
          +'<div style="font-size:8px;color:#5a4020;">Earn 3 per run · '+SOUL_SHARDS_PER_PULL+' per summon</div></div>'
      +'</div>'
      
      +(canSummon
        ?'<button class="btn btn-gold" style="width:100%;font-size:12px;padding:10px;" onclick="doSummonUI()">✦ SUMMON ('+SOUL_SHARDS_PER_PULL+' Soul Shards)</button>'
        :'<button class="btn btn-dim" style="width:100%;font-size:12px;padding:10px;" disabled>'+(pool.length?'Need '+SOUL_SHARDS_PER_PULL+' Soul Shards':'All champions unlocked')+'</button>')
      +'<div id="summon-result" style="margin-top:12px;"></div>'
      +'<div style="margin-top:12px;border-top:1px solid #2a1808;padding-top:8px;">'
        +'<div style="font-size:8px;color:#5a4020;margin-bottom:6px;">AVAILABLE POOL ('+pool.length+')</div>'
        +poolHtml
      +'</div>';
  }
}

function doSummonUI(){
  var result=performSummon();
  if(!result) return;
  refreshShardWellPanel();
  var el=document.getElementById('summon-result');
  if(!el) return;
  var ch=getCreaturePlayable(result.champId); if(!ch) return;
  var col=RARITY_COLORS[result.rarity]||'#c0a060';
  var label=RARITY_LABELS[result.rarity]||'';
  if(result.isDupe){
    var dupeTotal=PERSIST.champDupes&&PERSIST.champDupes[result.champId]||0;
    var nextAsc=ASCENSION_TIERS[getAscensionLevel(result.champId)];
    var nextCostStr=nextAsc?' ('+dupeTotal+'/'+nextAsc.cost+' for '+CARD_TIER_LABELS[nextAsc.tier]+')':'(max ascension)';
    el.innerHTML='<div style="background:rgba(20,10,2,.95);border:1px solid '+col+';border-radius:8px;padding:12px;text-align:center;">'
      +'<div style="font-size:8px;color:#5a4020;margin-bottom:6px;">DUPLICATE — ASCENSION TOKEN ADDED</div>'
      +'<div style="font-size:24px;">'+ch.icon+'</div>'
      +'<div style="font-size:11px;color:'+col+';font-family:Cinzel,serif;">'+ch.name+'</div>'
      +'<div style="font-size:8px;color:#7a6030;margin-top:4px;">+1 dupe token '+nextCostStr+'</div>'
      +(nextAsc?'<button class="sanctum-btn sanctum-btn-upgrade" style="margin-top:6px;" onclick="ascendChampion(\''+result.champId+'\');doSummonUI._refresh()">ASCEND TO '+CARD_TIER_LABELS[nextAsc.tier].toUpperCase()+'</button>':'')
      +'</div>';
    doSummonUI._refresh=function(){ refreshShardWellPanel(); };
  } else {
    el.innerHTML='<div style="background:rgba(20,10,2,.95);border:2px solid '+col+';border-radius:8px;padding:12px;text-align:center;animation:lu-toast-in .3s ease-out;">'
      +'<div style="font-size:8px;color:'+col+';letter-spacing:1px;margin-bottom:6px;">'+label+' UNLOCKED!</div>'
      +'<div style="font-size:36px;margin-bottom:4px;">'+ch.icon+'</div>'
      +'<div style="font-size:13px;color:#d4a843;font-family:Cinzel,serif;margin-bottom:2px;">'+ch.name+'</div>'
      +'<div style="font-size:8px;color:#7a6030;">'+ch.role+'</div>'
      +(ch.comingSoon?'<div style="font-size:7px;color:#4a3010;margin-top:4px;font-style:italic;">Full kit coming soon</div>':'')
      +'</div>';
  }
}

// Forge tick — called every 5s from a global idle ticker
function forgeTick(){
  var b=PERSIST.town.buildings.forge;
  if(!b||!b.unlocked||!b.queue||!b.queue.length) return;
  var item=b.queue[0];
  if(Date.now()-item.startTime>=item.totalMs){
    b.queue.shift();
    // Grant upgraded version — just add a town card of the new tier for now
    addTownCard(item.toTier);
    addLog('✦ Forge complete: '+(CARDS[item.cardId]?CARDS[item.cardId].name:item.cardId)+' → '+CARD_TIER_LABELS[item.toTier]+' Card!','sys');
    savePersist();
  }
}

// ── SHRINE ──
function refreshShrinePanel(){
  showLockedBuildingUI('shrine');
  var b=PERSIST.town.buildings.shrine;
  if(!b.unlocked) return;

  // Slot
  var slotCard=b.slottedCard?getTownCardById(b.slottedCard):null;
  var slotEl=document.getElementById('shrine-slot');
  slotEl.className='building-slot'+(slotCard?' has-card '+slotCard.tier:'');
  slotEl.innerHTML=slotCard?'<span class="slot-card-gem">'+TOWN_CARD_GEMS(slotCard.tier)+'</span>':'<span style="color:#3a2810;font-size:18px;">+</span>';
  document.getElementById('shrine-slot-hint').textContent=slotCard
    ?'Gem active — blessings enhanced (+20% effect). Click to unslot.'
    :'Slot a gem to enhance blessings (+20% effect).';

  // Active blessing display — works without gem
  var bd=document.getElementById('shrine-blessing-display'); bd.innerHTML='';
  var active=b.activeBlessing;
  if(active){
    var bl=SHRINE_BLESSINGS.find(function(x){return x.id===active;});
    if(bl) bd.innerHTML='<div class="shrine-active-bless"><div class="shrine-active-icon">'+bl.icon+'</div><div><div class="shrine-active-name">'+bl.name+(slotCard?' ✦':'')+'</div><div class="shrine-active-desc">'+bl.desc+(slotCard?' <span style="color:#d4a843;font-size:8px;">(enhanced)</span>':'')+'</div></div></div>';
  } else {
    bd.innerHTML='<div class="shrine-no-bless">Choose a blessing below.</div>';
  }

  // Blessing list — all visible, locked ones show level requirement
  var bl2=document.getElementById('shrine-blessing-list'); bl2.innerHTML='';
  var shrineLevel=getBuildingLevel('shrine');
  var xp=PERSIST.town.buildingXp&&PERSIST.town.buildingXp.shrine||0;
  var xpToNext=getBuildingXpToNext(shrineLevel);

  // Show shrine level + XP bar at top
  var lvHtml='<div style="font-size:8px;color:#7a6030;margin-bottom:8px;text-align:center;">'
    +'Shrine Level '+shrineLevel
    +' &nbsp;·&nbsp; <span style="color:#c0a060;">'+xp+' / '+xpToNext+' XP</span>'
    +'<div style="height:3px;background:rgba(0,0,0,.4);border-radius:2px;margin-top:3px;overflow:hidden;">'
    +'<div style="height:100%;width:'+(Math.round((xp/xpToNext)*100))+'%;background:#c09030;border-radius:2px;"></div>'
    +'</div></div>';
  bl2.innerHTML=lvHtml;

  SHRINE_BLESSINGS.forEach(function(bless){
    var isUnlocked=isBlessingUnlocked(bless);
    var isCur=bless.id===b.activeBlessing&&isUnlocked;
    var el=document.createElement('div');
    el.className='shrine-bless-opt'+(isCur?' shrine-bless-active':'')+(isUnlocked?'':' shrine-bless-disabled');
    var lockHtml=isUnlocked?'':' 🔒';
    var reqHtml=isUnlocked?''
      :'<div style="font-size:7px;color:#5a4020;margin-top:2px;">Requires Shrine Lv'+bless.lvl+'</div>';
    var gemHint=slotCard?'<div style="font-size:7px;color:#d4a843;margin-top:1px;">✦ '+bless.descGem+'</div>':'';
    el.innerHTML='<div class="shrine-bless-icon">'+bless.icon+'</div>'
      +'<div><div class="shrine-bless-name">'+bless.name+lockHtml+(isCur?' ✓':'')+'</div>'
      +'<div class="shrine-bless-desc">'+(isUnlocked?bless.desc:'???')+gemHint+'</div>'
      +reqHtml+'</div>';
    if(isUnlocked) el.onclick=function(){
      PERSIST.town.buildings.shrine.activeBlessing=bless.id;
      savePersist(); refreshShrinePanel();
    };
    bl2.appendChild(el);
  });
}

// ── BESTIARY ──
var _bestiaryTab='creatures';
var _bestiarySelected=null;

function setBestiaryTab(tab){
  _bestiaryTab=tab;
  document.getElementById('btab-creatures').className='bestiary-tab'+(tab==='creatures'?' active':'');
  document.getElementById('btab-locations').className='bestiary-tab'+(tab==='locations'?' active':'');
  document.getElementById('btab-glossary').className='bestiary-tab'+(tab==='glossary'?' active':'');
  document.getElementById('bestiary-creatures-pane').style.display=tab==='creatures'?'':'none';
  document.getElementById('bestiary-locations-pane').style.display=tab==='locations'?'':'none';
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

  var slotCard=b.slottedCard?getTownCardById(b.slottedCard):null;
  var slotEl=document.getElementById('bestiary-slot');
  if(slotEl){
    slotEl.className='building-slot'+(slotCard?' has-card '+slotCard.tier:'');
    slotEl.innerHTML=slotCard?'<span class="slot-card-gem">'+TOWN_CARD_GEMS(slotCard.tier)+'</span>':'<span style="color:#3a2810;font-size:18px;">+</span>';
  }
  var hintEl=document.getElementById('bestiary-slot-hint');
  if(hintEl) hintEl.textContent=slotCard
    ?'Gem active — full details including hidden innates revealed.'
    :'Slot a gem to reveal hidden innates and full enemy deck details.';

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
  var showCards  = isSeen||(res>=BRES.DECK_CARD);
  var showInnate = isSeen||(res>=BRES.INNATE);
  var showLore   = isSeen||(res>=BRES.NAME);
  var showAreas  = res>=BRES.NAME||isSeen;

  var areas=getCreatureAreas(id);

  // Header — large centred creature image
  var killColor=kills>100?'#d4a843':kills>10?'#c09030':'#7a5020';
  var html='<div style="text-align:center;padding:12px 0 6px;">'    +creatureImgHTML(id, e.icon, '120px')    +'</div>'    +'<div style="text-align:center;margin-bottom:8px;">'    +'<div class="bc-detail-name" style="font-size:14px;margin-bottom:4px;">'+e.name+'</div>'    +(isMastered?'<div style="margin-bottom:4px;"><span style="font-size:7px;font-family:Cinzel,serif;color:#d4a843;letter-spacing:1px;border:1px solid #c09030;border-radius:3px;padding:1px 5px;">★ UNLOCKED</span></div>':'')    +'<div class="bc-detail-kills">⚔ <b style="color:'+killColor+'">'+kills+'</b> defeated</div>';

  if(showAreas&&areas.length){
    html+='<div style="margin-top:5px;">';
    areas.forEach(function(a){ html+='<span class="bc-area-tag">'+a.icon+' '+a.name+'</span>'; });
    html+='</div>';
  }
  html+='</div>';

  // Stats — STR/AGI/WIS with HP and speed as sub-labels
  if(showStats){
    var maxHp=calcHp(e.baseStats.str);
    var atkInterval=e.atkInterval||Math.round(2000/(1+e.baseStats.agi*0.05));
    var manaMax=Math.round(e.baseStats.wis*8+40);
    html+='<div class="bc-section-label">COMBAT STATS</div>'      +'<div class="bc-stat-row">'      +'<div class="bc-stat-box">'        +'<div class="sv" style="color:#e07070;">'+e.baseStats.str+'</div>'        +'<div class="sl">STR</div>'        +'<div style="font-size:7px;color:#7a4020;margin-top:2px;">'+maxHp+' HP</div>'      +'</div>'      +'<div class="bc-stat-box">'        +'<div class="sv" style="color:#70e0a0;">'+e.baseStats.agi+'</div>'        +'<div class="sl">AGI</div>'        +'<div style="font-size:7px;color:#2a6040;margin-top:2px;">'+(atkInterval/1000).toFixed(1)+'s</div>'      +'</div>'      +'<div class="bc-stat-box">'        +'<div class="sv" style="color:#70a0e0;">'+e.baseStats.wis+'</div>'        +'<div class="sl">WIS</div>'        +'<div style="font-size:7px;color:#304060;margin-top:2px;">'+manaMax+' MP</div>'      +'</div>'      +'</div>';
  } else {
    html+='<div class="bc-stat-row"><div class="bc-stat-box" style="flex:1;"><div class="sv" style="color:#3a2810;">?</div><div class="sl">STATS UNKNOWN</div></div></div>';
  }

  // Lore
  if(showLore&&e.lore){
    html+='<div class="bc-section-label">FIELD NOTES</div>'
      +'<div class="bc-lore">'+e.lore+'</div>';
  } else if(res>0&&!showLore){
    html+='<div class="bc-lore" style="color:#3a2810;">Research further to uncover field notes on this creature.</div>';
  }

  // Innate
  if(showInnate&&e.innate){
    var innateHidden=e.innate.hidden&&!kills;
    html+='<div class="bc-section-label">INNATE ABILITY</div>'
      +'<div class="bc-innate-box">'
      +'<div class="bc-innate-name">◆ '+(innateHidden?'???':e.innate.name)+'</div>'
      +'<div class="bc-innate-desc">'+(innateHidden?'Defeat this creature to reveal its innate ability.':e.innate.desc)+'</div>'
      +'</div>';
  } else if(showStats&&e.innate){
    html+='<div class="bc-section-label">INNATE ABILITY</div>'
      +'<div class="bc-innate-box"><div class="bc-innate-desc" style="color:#3a2810;">Research further to reveal this innate ability.</div></div>';
  }

  // Cards
  if(showCards&&(e.deck||[]).length){
    var visibleCards=isSeen?(e.deck||[]).slice(0)
      :(e.deck||[]).slice(0, Math.max(1,Math.ceil(((res-BRES.DECK_CARD)/(BRES.INNATE-BRES.DECK_CARD))*(e.deck||[]).length)));
    if(visibleCards.length){
      html+='<div class="bc-section-label">KNOWN CARDS</div>';
      visibleCards.forEach(function(c){
        html+='<div class="bc-card-entry">'
          +'<span class="bc-card-entry-name">'+c.name+'</span>'
          +'<span class="bc-card-entry-copies">x'+c.copies+'</span>'
          +'</div>';
      });
      var remaining=(e.deck||[]).length-visibleCards.length;
      if(remaining>0) html+='<div style="font-size:8px;color:#3a2810;font-style:italic;padding:4px 8px;">+ '+remaining+' card'+(remaining!==1?'s':'')+' not yet observed</div>';
    }
  } else if(showStats&&(e.deck||[]).length){
    html+='<div class="bc-section-label">KNOWN CARDS</div>'
      +'<div style="font-size:9px;color:#3a2810;padding:4px 0;">Research further to identify cards.</div>';
  }

  // Research bar
  if(!isSeen&&res>0){
    html+='<div class="bc-section-label" style="margin-top:12px;">RESEARCH</div>'
      +'<div style="height:4px;background:rgba(0,0,0,.5);border-radius:2px;overflow:hidden;margin-bottom:4px;">'
      +'<div style="height:100%;width:'+res+'%;background:linear-gradient(90deg,#2a1808,#c09030);border-radius:2px;"></div>'
      +'</div>'
      +'<div style="font-size:8px;color:#5a4020;text-align:right;">'+Math.round(res)+'% catalogued</div>';
  } else if(isSeen){
    html+='<div style="margin-top:10px;font-size:8px;color:'+(isMastered?'#d4a843':'#4a3010')+';font-family:Cinzel,serif;text-align:center;letter-spacing:.5px;">'
      +(isMastered?'★ FULLY CATALOGUED & UNLOCKED':'✓ FULLY CATALOGUED')+'</div>';
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

function buildBestiaryLocations(){
  var grid=document.getElementById('bestiary-location-grid');
  if(!grid) return;
  grid.innerHTML='';

  // Legend — only show if player has seen a noChampion enemy
  var hasUnique=false; // noChampion flag removed in Creature unification
  if(hasUnique){
    var legend=document.createElement('div');
    legend.style.cssText='grid-column:1/-1;font-size:8px;color:#7a6030;text-align:right;padding:2px 4px;';
    legend.textContent='★ = unique encounter · cannot be unlocked as a champion';
    grid.appendChild(legend);
  }

  AREA_DEFS.forEach(function(area){
    var rawRuns=PERSIST.areaRuns[area.id]||0;
    var effRuns=getEffectiveRuns(area.id);
    var card=document.createElement('div');

    if(rawRuns===0){
      card.className='bl-card unknown';
      card.innerHTML='<div class="bl-icon">🌫️</div>'
        +'<div class="bl-name" style="color:#2a1808;">UNEXPLORED</div>'
        +'<div style="font-size:7px;color:#1e1006;">Complete a run here to reveal</div>';
      grid.appendChild(card); return;
    }

    card.className='bl-card'+(effRuns>=AREA_INTEL.THREAT_NOTES?' charted':effRuns>=AREA_INTEL.VISITED?' visited':'');

    var html='<div class="bl-icon">'+area.icon+'</div>'
      +'<div class="bl-name">'+area.name+'</div>'
      +'<div class="bl-level">Lv. '+area.levelRange[0]+'–'+area.levelRange[1]+'</div>';

    if(effRuns>=AREA_INTEL.PARTIAL_ENEMIES){
      var pool=area.enemyPool||[];
      var unique=pool.filter(function(v,i,a){return a.indexOf(v)===i;});
      var visCount=effRuns>=AREA_INTEL.FULL_ENEMIES?unique.length:Math.min(2,unique.length);
      var shown=unique.slice(0,visCount);
      var names=shown.map(function(id){
        if(!CREATURES[id]) return id;
        var label=CREATURES[id].name;
        return label;
      });
      html+='<div class="bl-enemies">'
        +names.join(' · ')
        +(unique.length>visCount?' <span style="color:#3a2810;">+'+( unique.length-visCount)+' more</span>':'')
        +'</div>';
    }

    if(effRuns>=AREA_INTEL.THREAT_NOTES&&THREAT_NOTES[area.id]){
      html+='<div class="bl-threat">'+THREAT_NOTES[area.id]+'</div>';
    }

    var runNote=rawRuns>3
      ?rawRuns+' runs <span style="color:#3a2810;">('+effRuns.toFixed(1)+' effective)</span>'
      :rawRuns+' run'+(rawRuns!==1?'s':'');
    html+='<div class="bl-runs">'+runNote+'</div>';

    var milestones=[AREA_INTEL.VISITED,AREA_INTEL.PARTIAL_ENEMIES,AREA_INTEL.FULL_ENEMIES,AREA_INTEL.THREAT_NOTES];
    html+='<div class="bl-intel-bar">';
    milestones.forEach(function(m){ html+='<div class="bl-intel-pip'+(effRuns>=m?' filled':'')+'"></div>'; });
    html+='</div>';

    card.innerHTML=html;
    grid.appendChild(card);
  });
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

  // Slot display
  var slotCard=b.slottedCard?getTownCardById(b.slottedCard):null;
  var slotEl=document.getElementById('sanctum-slot');
  if(slotEl){
    slotEl.className='building-slot'+(slotCard?' has-card '+slotCard.tier:'');
    slotEl.innerHTML=slotCard
      ?'<span class="slot-card-gem">'+TOWN_CARD_GEMS(slotCard.tier)+'</span>'
      :'<span style="color:#3a2810;font-size:18px;">+</span>';
  }

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
  ['overview','deck','upgrades','training'].forEach(function(t){
    var btn=document.getElementById('stab-'+t);
    var pane=document.getElementById('sanctum-'+t+'-pane');
    if(btn) btn.className='sanctum-tab'+(t===tab?' active':'');
    if(pane){ pane.style.display=t===tab?'flex':'none'; pane.style.flexDirection='column'; }
  });
  if(tab==='overview') buildSanctumOverviewPane();
  else if(tab==='deck'){ buildSanctumDeckPane(); showTutorial('sanctum_deck_edit'); }
  else if(tab==='upgrades') buildSanctumUpgradesPane();
  else if(tab==='training') buildSanctumTrainingPane();
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
  var active=!!(PERSIST.town.buildings.sanctum&&PERSIST.town.buildings.sanctum.slottedCard);
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

  var slotCard=b.slottedCard?getTownCardById(b.slottedCard):null;
  var active=!!slotCard;

  var slotEl=document.getElementById('market-slot');
  if(slotEl){
    slotEl.className='building-slot'+(slotCard?' has-card '+slotCard.tier:'');
    slotEl.innerHTML=slotCard
      ?'<span class="slot-card-gem">'+TOWN_CARD_GEMS(slotCard.tier)+'</span>'
      :'<span style="color:#3a2810;font-size:18px;">+</span>';
  }
  var hintEl=document.getElementById('market-slot-hint');
  if(hintEl) hintEl.textContent=slotCard?'Gem active — stock refreshes faster. Click to unslot.':'Slot a gem to boost stock refresh speed.';
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
  var speedMult=b.slottedCard?1.5:1.0;
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
var VAULT_UPGRADES=[
  {id:'shelf1',  label:'Extra Shelves',     cost:60,  effect:'+8 item slots',  group:'shelves', tier:1, requires:null,     minLevel:1},
  {id:'shelf2',  label:'Expanded Shelves',  cost:150, effect:'+8 more slots',  group:'shelves', tier:2, requires:'shelf1', minLevel:3},
  {id:'shelf3',  label:'Grand Shelves',     cost:350, effect:'+8 more slots',  group:'shelves', tier:3, requires:'shelf2', minLevel:5},
  {id:'sellDesk',label:'Sell Desk',         cost:80,  effect:'Sell items directly from the inspector', group:'other', tier:1, requires:null,     minLevel:2},
  {id:'recycle', label:'Recycling Bin',     cost:120, effect:'Break down items into Gem Shards',       group:'other', tier:1, requires:null,     minLevel:3},
];

// ── Sell prices ──
var SELL_PRICES={
  // Keys: 1g (common) to 5g (rare)
  key_sewers:1, key_sewers_deep:1, key_sewers_foul:2,
  key_bog:2, key_crypt:2, key_forest:2,
  key_cave:3, key_ruins:3, key_dragon:4, key_bone:4, key_astral:5,
  // Chests: buy_price / 8 roughly
  chest_sewers:5, chest_bog:8, chest_crypt:8,
  chest_forest:10, chest_cave:10, chest_ruins:15,
  chest_dragon:15, chest_bone:15, chest_astral:25,
  // Materials: per unit
  sparks:0.2, embers:2, flameShards:5, // sparks sell 5 for 1g via batching
};

function getSellPrice(item){
  if(item.itemType==='towncard') return 0; // not sellable
  var key=item.lootKey||item.matKey||'';
  var base=SELL_PRICES[key]||0;
  if(!base) return 0;
  if(key==='sparks') return Math.floor(item.count*SELL_PRICES.sparks); // batch
  return base; // per-item, 1 at a time for everything else
}

// ── Market deals pool ──
var DEALS_POOL=[
  {id:'deal_sparks_sm',  label:'Sparks ×10',  icon:'✨', desc:'10 Sparks',   cost:12, type:'material', matId:'sparks',    qty:10},
  {id:'deal_sparks_lg',  label:'Sparks ×25',  icon:'✨', desc:'25 Sparks',   cost:28, type:'material', matId:'sparks',    qty:25},
  {id:'deal_embers_sm',  label:'Embers ×3',   icon:'🔥', desc:'3 Embers',    cost:14, type:'material', matId:'embers',    qty:3},
  {id:'deal_embers_lg',  label:'Embers ×8',   icon:'🔥', desc:'8 Embers',    cost:32, type:'material', matId:'embers',    qty:8},
  {id:'deal_shards_sm',  label:'Flame Shards ×2', icon:'💎', desc:'2 Flame Shards', cost:18, type:'material', matId:'flameShards', qty:2},
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
  {id:'rare_embers_15',  label:'Embers ×15',      icon:'🔥', desc:'15 Embers — substantial forge fuel',    cost:55, type:'material', matId:'embers', qty:15},
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
  if(!b||!b.slottedCard) return;

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

// Gem tier config for the vault generator
var VAULT_GEN_CONFIG={
  ruby:     {minSecs:600, maxSecs:1200, table:[ // 10-20min avg
    {w:40, type:'loot',    id:'key_sewers',   qty:1},
    {w:25, type:'material',id:'sparks',        qty:[8,16]},
    {w:20, type:'material',id:'gemShards',     qty:[1,3]},
    {w:10, type:'loot',    id:'key_bog',       qty:1},
    {w:5,  type:'loot',    id:'chest_sewers',  qty:1},
  ]},
  emerald:  {minSecs:420, maxSecs:840, table:[  // 7-14min avg
    {w:30, type:'loot',    id:'key_forest',    qty:1},
    {w:25, type:'material',id:'embers',        qty:[2,5]},
    {w:20, type:'material',id:'gemShards',     qty:[3,6]},
    {w:15, type:'loot',    id:'chest_bog',     qty:1},
    {w:10, type:'loot',    id:'chest_sewers',  qty:1},
  ]},
  sapphire: {minSecs:300, maxSecs:600, table:[  // 5-10min avg
    {w:30, type:'loot',    id:'chest_forest',  qty:1},
    {w:25, type:'material',id:'flameShards',   qty:[1,3]},
    {w:20, type:'material',id:'gemShards',     qty:[5,10]},
    {w:15, type:'loot',    id:'chest_crypt',   qty:1},
    {w:10, type:'loot',    id:'key_dragon',    qty:1},
  ]},
  turquoise:{minSecs:180, maxSecs:420, table:[  // 3-7min avg
    {w:30, type:'loot',    id:'chest_ruins',   qty:1},
    {w:25, type:'material',id:'gemShards',     qty:[8,15]},
    {w:20, type:'loot',    id:'chest_dragon',  qty:1},
    {w:15, type:'material',id:'flameShards',   qty:[3,6]},
    {w:10, type:'loot',    id:'chest_bone',    qty:1},
  ]},
};
// Higher tiers default to turquoise table
['amethyst','topaz','obsidian','opal'].forEach(function(t){
  VAULT_GEN_CONFIG[t]=Object.assign({},VAULT_GEN_CONFIG.turquoise,{minSecs:120,maxSecs:300});
});

function _vaultGenRoll(config){
  var total=config.table.reduce(function(s,e){return s+e.w;},0);
  var roll=Math.random()*total;
  var acc=0;
  for(var i=0;i<config.table.length;i++){
    acc+=config.table[i].w;
    if(roll<=acc) return config.table[i];
  }
  return config.table[config.table.length-1];
}

function _vaultGenCollect(tier){
  var config=VAULT_GEN_CONFIG[tier];
  if(!config) return;
  var entry=_vaultGenRoll(config);
  var qty=Array.isArray(entry.qty)
    ? entry.qty[0]+Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1))
    : (entry.qty||1);
  var msg='';
  if(entry.type==='loot'){
    PERSIST.town.items[entry.id]=(PERSIST.town.items[entry.id]||0)+qty;
    var def=LOOT_DEFS&&LOOT_DEFS[entry.id];
    msg='Vault gem produced: '+(def?def.name:entry.id)+(qty>1?' ×'+qty:'');
  } else if(entry.type==='material'){
    PERSIST.town.materials[entry.id]=(PERSIST.town.materials[entry.id]||0)+qty;
    var mdef=MATERIAL_DEFS&&MATERIAL_DEFS[entry.id];
    msg='Vault gem produced: '+(mdef?mdef.name:entry.id)+' ×'+qty;
  }
  PERSIST.town.vaultGenProgress=0;
  PERSIST.town.vaultGenTarget=null;
  savePersist();
  showTownToast('✦ '+msg);
  // Refresh vault panel if open
  var vp=document.getElementById('vault-panel-bg');
  if(vp&&vp.classList.contains('show')) refreshVaultPanel();
}

function vaultTick(seconds){
  var b=PERSIST.town.buildings.vault;
  if(!b||!b.slottedCard) return;

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

  // ── Gem generator ──
  var card=getTownCardById(b.slottedCard);
  if(!card) return;
  var tier=card.tier||'ruby';
  var config=VAULT_GEN_CONFIG[tier];
  if(!config) return;

  // Pick a random target duration if we don't have one
  if(!PERSIST.town.vaultGenTarget){
    var range=config.maxSecs-config.minSecs;
    PERSIST.town.vaultGenTarget=config.minSecs+Math.random()*range;
  }

  // Advance progress with ±15% jitter per tick
  var jitter=0.85+Math.random()*0.30; // 0.85–1.15
  var progressGain=(seconds/PERSIST.town.vaultGenTarget)*100*jitter;
  PERSIST.town.vaultGenProgress=Math.min(100,(PERSIST.town.vaultGenProgress||0)+progressGain);

  if(PERSIST.town.vaultGenProgress>=100){
    _vaultGenCollect(tier);
  }
}

// ─────────────────────────────────────────────────────────
// UNIFIED IDLE TICK — every 5s
// ─────────────────────────────────────────────────────────
setInterval(function(){
  forgeTick();
  vaultTick(5);
  marketTick(5);
  bestiaryTick(5);
  shardWellTick(5);
  savePersist();
  // Live-update vault bar if vault panel is open
  var vp=document.getElementById('vault-panel-bg');
  if(vp&&vp.classList.contains('show')){ refreshVaultLevelBar(); _refreshVaultGenBar(); }
  // Live-update market bars if market panel open
  var mp=document.getElementById('market-panel-bg');
  if(mp&&mp.classList.contains('show')){
    var mb=PERSIST.town.buildings.market;
    if(mb&&mb.unlocked&&mb.slottedCard){
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

// ── Vault panel ──
var _vaultSelected=null; // currently selected inventory item id
var _vaultPage=0;        // current inventory page (0-indexed)
var VAULT_PER_PAGE=16;   // matches base capacity — shelves unlock new pages

function vaultPageChange(dir){
  _vaultPage=Math.max(0,_vaultPage+dir);
  _vaultSelected=null;
  clearVaultInspector();
  refreshVaultPanel();
}

function openVaultPanel(){
  _vaultSelected=null;
  _vaultPage=0;
  refreshVaultPanel();
  document.getElementById('vault-panel-bg').classList.add('show');
}

function closeVaultPanel(){
  document.getElementById('vault-panel-bg').classList.remove('show');
  buildTownCardsStrip(); buildTownGrid();
}

function onVaultSlotClick(){
  var b=PERSIST.town.buildings.vault;
  if(b.slottedCard){ unslotCard(b.slottedCard); refreshVaultPanel(); buildTownGrid(); buildTownCardsStrip(); }
}

// Build the flat ordered list of all inventory items for the grid
function buildInvItems(){
  var items=[];
  // Category: Town Cards
  PERSIST.town.cards.forEach(function(c,i){
    items.push({cat:'GEMS',id:'tc_'+i,itemType:'towncard',
      icon:TOWN_CARD_GEMS(c.tier),name:c.tier.charAt(0).toUpperCase()+c.tier.slice(1)+' Card',
      count:1,cardRef:c,color:c.tier==='red'?'#c03030':c.tier==='green'?'#20a020':'#2040c0'});
  });
  // Category: Materials
  var mats=Object.keys(MATERIAL_DEFS).filter(function(k){return (PERSIST.town.materials[k]||0)>0;});
  mats.forEach(function(k){
    items.push({cat:'MATERIALS',id:'mat_'+k,itemType:'material',matKey:k,
      icon:MATERIAL_DEFS[k].icon,name:MATERIAL_DEFS[k].name,count:PERSIST.town.materials[k],color:'#4a7030'});
  });
  // Category: Keys (sorted by biome)
  var keys=Object.keys(LOOT_DEFS).filter(function(k){return LOOT_DEFS[k].type==='key'&&(PERSIST.town.items[k]||0)>0;});
  keys.sort(function(a,b){return a.localeCompare(b);});
  keys.forEach(function(k){
    items.push({cat:'KEYS',id:'loot_'+k,itemType:'key',lootKey:k,
      icon:LOOT_DEFS[k].icon,name:LOOT_DEFS[k].name,count:PERSIST.town.items[k],color:LOOT_DEFS[k].color});
  });
  // Category: Chests
  var chests=Object.keys(LOOT_DEFS).filter(function(k){return LOOT_DEFS[k].type==='chest'&&(PERSIST.town.items[k]||0)>0;});
  chests.sort(function(a,b){return a.localeCompare(b);});
  chests.forEach(function(k){
    items.push({cat:'CHESTS',id:'loot_'+k,itemType:'chest',lootKey:k,
      icon:LOOT_DEFS[k].icon,name:LOOT_DEFS[k].name,count:PERSIST.town.items[k],color:LOOT_DEFS[k].color});
  });
  // Category: Champion Cards
  var champCards=Object.keys(LOOT_DEFS).filter(function(k){return LOOT_DEFS[k].type==='champcard'&&(PERSIST.town.items[k]||0)>0;});
  champCards.forEach(function(k){
    items.push({cat:'CHAMPION CARDS',id:'loot_'+k,itemType:'champcard',lootKey:k,
      icon:LOOT_DEFS[k].icon,name:LOOT_DEFS[k].name,count:PERSIST.town.items[k],color:LOOT_DEFS[k].color});
  });
  return items;
}

// ═══════════════════════════════════════════════════════
// ADVENTURER'S BOARD — QUEST SYSTEM
// ═══════════════════════════════════════════════════════

var QUEST_TEMPLATES = [
  // Area clear quests
  {id:'q_sewers_1',    type:'area_clear',  areaId:'sewers',    count:1, label:'Clear the Sewers',          reward:{gold:30}},
  {id:'q_sewers_3',    type:'area_clear',  areaId:'sewers',    count:3, label:'Clear the Sewers 3 times',   reward:{gemShards:8}},
  {id:'q_swamp_1',     type:'area_clear',  areaId:'swamp',     count:1, label:'Clear Bogmire Swamp',        reward:{gold:40, sparks:5}},
  {id:'q_crypt_1',     type:'area_clear',  areaId:'crypt',     count:1, label:'Clear the Forgotten Crypt',  reward:{gold:45, embers:2}},
  {id:'q_forest_1',    type:'area_clear',  areaId:'forest',    count:1, label:'Clear the Thornwood',        reward:{gold:55, gemShards:5}},
  {id:'q_cave_1',      type:'area_clear',  areaId:'cave',      count:1, label:'Clear the Crystal Caves',    reward:{gold:60, embers:3}},
  {id:'q_ruins_1',     type:'area_clear',  areaId:'ruins',     count:1, label:'Clear the Ancient Ruins',    reward:{gold:70, gemShards:8}},
  {id:'q_dragon_1',    type:'area_clear',  areaId:'dragonsnest',count:1,label:'Clear the Dragon\'s Nest',   reward:{gold:90, gemShards:12, flameShards:1}},
  // Kill quota quests
  {id:'q_kill_rat_20', type:'kill_quota',  enemyId:'rat',      count:20, label:'Defeat 20 Giant Rats',       reward:{gold:25, sparks:8}},
  {id:'q_kill_rat_50', type:'kill_quota',  enemyId:'rat',      count:50, label:'Defeat 50 Giant Rats',       reward:{gemShards:10}},
  {id:'q_kill_goblin_20',type:'kill_quota',enemyId:'goblin',   count:20, label:'Defeat 20 Goblin Scouts',    reward:{gold:30, sparks:6}},
  {id:'q_kill_goblin_50',type:'kill_quota',enemyId:'goblin',   count:50, label:'Defeat 50 Goblin Scouts',    reward:{gemShards:12}},
  {id:'q_kill_roach_20', type:'kill_quota',enemyId:'roach',    count:20, label:'Defeat 20 Sewer Roaches',    reward:{gold:20, sparks:10}},
  {id:'q_kill_skeleton_30',type:'kill_quota',enemyId:'skeleton',count:30,label:'Defeat 30 Skeletons',        reward:{gold:40, embers:2}},
  {id:'q_kill_troll_10',type:'kill_quota', enemyId:'troll',    count:10, label:'Defeat 10 Forest Trolls',    reward:{gold:50, gemShards:6}},
  {id:'q_kill_dragon_3', type:'kill_quota',enemyId:'dragon',   count:3,  label:'Defeat 3 Elder Dragons',     reward:{gold:80, gemShards:15}},
  {id:'q_fungal_1',      type:'area_clear', areaId:'fungalwarren',count:1, label:'Explore the Fungal Warren', reward:{gold:35, gemShards:5}},
  {id:'q_fungal_3',      type:'area_clear', areaId:'fungalwarren',count:3, label:'Clear the Fungal Warren 3 times', reward:{gemShards:12}},
  {id:'q_kill_sporepuff_20',type:'kill_quota',enemyId:'sporepuff',count:20,label:'Defeat 20 Spore Puffs',     reward:{gold:20, sparks:8}},
  {id:'q_kill_venomstalker_10',type:'kill_quota',enemyId:'venomstalker',count:10,label:'Defeat 10 Venom Stalkers', reward:{gold:30, gemShards:5}},
  {id:'q_blackpool_1',   type:'area_clear', areaId:'blackpool',   count:1, label:'Face the Harbourmaster',    reward:{gemShards:20, gold:50}},
  {id:'q_harbour_1',     type:'area_clear', areaId:'sunkenhabour',count:1, label:'Explore the Sunken Harbour',reward:{gold:40, gemShards:6}},
  {id:'q_harbour_3',     type:'area_clear', areaId:'sunkenhabour',count:3, label:'Clear the Harbour 3 times', reward:{gemShards:15}},
  {id:'q_kill_siren_5',  type:'kill_quota', enemyId:'siren',      count:5, label:'Silence 5 Sirens',          reward:{gold:25, gemShards:4}},
  {id:'q_kill_sharknight_10',type:'kill_quota',enemyId:'sharknight',count:10,label:'Defeat 10 Shark Knights',  reward:{gold:40, gemShards:8}},
  {id:'q_mines_1',       type:'area_clear', areaId:'charmines',   count:1, label:'Explore the Char Mines',    reward:{gold:40, gemShards:6}},
  {id:'q_mines_3',       type:'area_clear', areaId:'charmines',   count:3, label:'Clear the Mines 3 times',   reward:{gemShards:15, sparks:10}},
  {id:'q_kill_flamesprite_20',type:'kill_quota',enemyId:'flamesprite',count:20,label:'Extinguish 20 Flame Sprites',reward:{gold:20, sparks:10}},
  {id:'q_kill_lavacrawler_5', type:'kill_quota',enemyId:'lavacrawler', count:5, label:'Defeat 5 Lava Crawlers',   reward:{gold:35, gemShards:6}},
  // Challenge quests (no damage taken)
  {id:'q_nodmg_sewers', type:'no_damage',  areaId:'sewers',    count:1, label:'Clear Sewers without taking damage', reward:{gemShards:15, gold:20}},
  {id:'q_nodmg_swamp',  type:'no_damage',  areaId:'swamp',     count:1, label:'Clear Swamp without taking damage',  reward:{gemShards:20, embers:3}},
  {id:'q_nodmg_crypt',  type:'no_damage',  areaId:'crypt',     count:1, label:'Clear Crypt without taking damage',  reward:{gemShards:25, embers:4}},
  // Run count quests
  {id:'q_runs_5',      type:'run_count',   count:5,  label:'Complete 5 runs',             reward:{gold:50, sparks:15}},
  {id:'q_runs_10',     type:'run_count',   count:10, label:'Complete 10 runs',            reward:{gemShards:10, gold:40}},
  {id:'q_gold_earn',   type:'gold_earned', count:500,label:'Earn 500 gold in one run',    reward:{gemShards:8,  gold:60}},
];

function generateQuestOffers(){
  var q=PERSIST.town.quests;
  var available=QUEST_TEMPLATES.filter(function(t){
    return q.completed.indexOf(t.id)===-1 && (!q.active||q.active.id!==t.id);
  });
  // Shuffle and take 3
  available.sort(function(){return Math.random()-.5;});
  q.offered=available.slice(0,3).map(function(t){return t.id;});
  q.offeredRefresh=Date.now();
  savePersist();
}

function getQuestTemplate(id){
  return QUEST_TEMPLATES.find(function(t){return t.id===id;})||null;
}

function activateQuest(id){
  var q=PERSIST.town.quests;
  if(q.active){ showTownToast('Complete your current quest first.'); return; }
  var tmpl=getQuestTemplate(id);
  if(!tmpl) return;
  q.active={id:id,type:tmpl.type,progress:0,startTime:Date.now(),
    areaId:tmpl.areaId||null, enemyId:tmpl.enemyId||null,
    count:tmpl.count, label:tmpl.label, reward:tmpl.reward,
    failed:false};
  // Remove from offered
  q.offered=q.offered.filter(function(oid){return oid!==id;});
  savePersist();
  refreshBoardPanel();
  updateQuestIndicator();
  showTownToast('Quest accepted: '+tmpl.label);
}

function abandonQuest(){
  var q=PERSIST.town.quests;
  if(!q.active) return;
  q.active=null;
  savePersist();
  refreshBoardPanel();
  updateQuestIndicator();
  showTownToast('Quest abandoned.');
}

function checkQuestProgress(eventType, data){
  var q=PERSIST.town.quests;
  if(!q.active||q.active.failed) return;
  var a=q.active;

  if(eventType==='area_clear'&&a.type==='area_clear'&&a.areaId===data.areaId){
    a.progress=Math.min(a.count,(a.progress||0)+1);
    if(a.progress>=a.count) completeQuest();
    else { savePersist(); updateQuestIndicator(); }
  }
  if(eventType==='area_clear'&&a.type==='no_damage'&&a.areaId===data.areaId){
    if(data.damageTaken>0){ a.failed=true; savePersist(); updateQuestIndicator(); showTownToast('Quest failed — took damage!'); }
    else { a.progress=1; completeQuest(); }
  }
  if(eventType==='kill'&&a.type==='kill_quota'&&a.enemyId===data.enemyId){
    a.progress=Math.min(a.count,(a.progress||0)+1);
    if(a.progress>=a.count) completeQuest();
    else savePersist();
  }
  if(eventType==='run_complete'&&a.type==='run_count'){
    a.progress=Math.min(a.count,(a.progress||0)+1);
    if(a.progress>=a.count) completeQuest();
    else { savePersist(); updateQuestIndicator(); }
  }
  if(eventType==='run_complete'&&a.type==='gold_earned'&&data.goldEarned>=a.count){
    a.progress=data.goldEarned;
    completeQuest();
  }
  updateQuestIndicator();
}

function completeQuest(){
  var q=PERSIST.town.quests;
  if(!q.active) return;
  var a=q.active;
  a.readyToClaim=true;
  savePersist();
  updateQuestIndicator();
  playQuestNotifySfx();
  showTownToast('📋 Quest complete! Visit the Board to claim your reward.');
  // Badge + pulse the TOWN nav tab
  var qb=document.getElementById('quest-badge');
  if(qb){
    qb.textContent='!';
    qb.style.display='inline-block';
    qb.classList.remove('notify-pop');
    void qb.offsetWidth;
    qb.classList.add('notify-pop');
  }
  var tb=document.getElementById('nav-town');
  if(tb){
    tb.style.setProperty('--glow-col','#b0601080');
    tb.classList.remove('has-notif');
    void tb.offsetWidth;
    tb.classList.add('has-notif');
  }
}

function claimQuestReward(){
  var q=PERSIST.town.quests;
  if(!q.active||!q.active.readyToClaim) return;
  var a=q.active;
  var r=a.reward;
  var msgs=[];
  if(r.gold){ PERSIST.gold+=r.gold; msgs.push('+'+r.gold+'g'); }
  if(r.gemShards){ PERSIST.town.materials.gemShards=(PERSIST.town.materials.gemShards||0)+r.gemShards; msgs.push('+'+r.gemShards+' 💎 Shards'); }
  if(r.soulShards){ PERSIST.soulShards=(PERSIST.soulShards||0)+r.soulShards; msgs.push('+'+r.soulShards+' 🔮 Soul Shards'); }
  if(r.sparks){ PERSIST.town.materials.sparks=(PERSIST.town.materials.sparks||0)+r.sparks; msgs.push('+'+r.sparks+' ✨'); }
  if(r.embers){ PERSIST.town.materials.embers=(PERSIST.town.materials.embers||0)+r.embers; msgs.push('+'+r.embers+' 🔥'); }
  if(r.flameShards){ PERSIST.town.materials.flameShards=(PERSIST.town.materials.flameShards||0)+r.flameShards; msgs.push('+'+r.flameShards+' 🔮'); }
  q.completed.push(a.id);
  q.active=null;
  savePersist();
  updateNavBar('town');
  refreshBoardPanel();
  updateQuestIndicator();
  // Clear quest badge
  var qb=document.getElementById('quest-badge');
  if(qb){ qb.style.display='none'; qb.textContent=''; }
  showTownToast('Reward claimed: '+msgs.join(', ')+'!');
  // Refresh offers if empty
  if(q.offered.length===0) generateQuestOffers();
}

function updateQuestIndicator(){
  var el=document.getElementById('quest-indicator');
  var txtEl=document.getElementById('quest-indicator-text');
  var progEl=document.getElementById('quest-indicator-progress');
  if(!el) return;
  var q=PERSIST.town.quests;
  if(!q||!q.active){ el.style.display='none'; return; }
  var a=q.active;
  el.style.display='block';
  txtEl.textContent=a.label;
  if(a.readyToClaim){
    el.style.borderColor='#c09030';
    progEl.textContent='✦ READY TO CLAIM';
    progEl.style.color='#d4a843';
  } else if(a.failed){
    el.style.borderColor='#c03030';
    progEl.textContent='✗ FAILED';
    progEl.style.color='#c06060';
  } else {
    el.style.borderColor='#5a3010';
    progEl.style.color='#7a6030';
    if(a.type==='no_damage') progEl.textContent='No damage yet ✓';
    else progEl.textContent=(a.progress||0)+' / '+a.count;
  }
}

function formatReward(r){
  var parts=[];
  if(r.gold) parts.push(r.gold+'g');
  if(r.gemShards) parts.push(r.gemShards+' 💎');
  if(r.sparks) parts.push(r.sparks+' ✨');
  if(r.embers) parts.push(r.embers+' 🔥');
  if(r.flameShards) parts.push(r.flameShards+' 🔮');
  return parts.join(' · ')||'Reward';
}

function refreshBoardPanel(){
  showLockedBuildingUI('board');
  var b=PERSIST.town.buildings.board;
  if(!b||!b.unlocked) return;
  var panel=document.getElementById('board-panel');
  if(!panel) return;

  var q=PERSIST.town.quests;
  if(q.offered.length===0&&!q.active) generateQuestOffers();

  var html='<div style="font-family:Cinzel,serif;font-size:10px;color:#d4a843;letter-spacing:1px;margin-bottom:12px;">ADVENTURER\'S BOARD</div>';

  // Active quest
  if(q.active){
    var a=q.active;
    var statusHtml, btnHtml;
    if(a.readyToClaim){
      statusHtml='<div style="color:#d4a843;font-size:9px;margin:4px 0;">✦ Complete! Claim your reward.</div>';
      btnHtml='<button class="btn btn-gold" style="font-size:10px;padding:5px 14px;" onclick="claimQuestReward()">CLAIM REWARD</button>';
    } else if(a.failed){
      statusHtml='<div style="color:#c06060;font-size:9px;margin:4px 0;">✗ Quest failed.</div>';
      btnHtml='<button class="btn btn-dim" style="font-size:10px;padding:5px 14px;" onclick="abandonQuest()">DISMISS</button>';
    } else {
      var prog=a.type==='no_damage'?'No damage taken so far':(a.progress||0)+' / '+a.count;
      statusHtml='<div style="color:#c0a060;font-size:9px;margin:4px 0;">Progress: '+prog+'</div>';
      btnHtml='<button class="btn btn-dim" style="font-size:10px;padding:5px 14px;" onclick="abandonQuest()">ABANDON</button>';
    }
    html+='<div style="background:rgba(20,12,2,.8);border:1px solid #7a5010;border-radius:6px;padding:10px 12px;margin-bottom:14px;">'
      +'<div style="font-size:8px;color:#5a4020;letter-spacing:.5px;margin-bottom:3px;">ACTIVE QUEST</div>'
      +'<div style="font-size:11px;color:#d4a843;margin-bottom:2px;">'+a.label+'</div>'
      +'<div style="font-size:8px;color:#7a6030;">Reward: '+formatReward(a.reward)+'</div>'
      +statusHtml+btnHtml
      +'</div>';
  }

  // Offered quests
  if(!q.active){
    html+='<div style="font-size:8px;color:#5a4020;letter-spacing:.5px;margin-bottom:8px;">AVAILABLE QUESTS</div>';
    if(q.offered.length===0){
      html+='<div style="font-size:9px;color:#3a2010;">No quests available. Check back later.</div>';
    } else {
      q.offered.forEach(function(qid){
        var tmpl=getQuestTemplate(qid);
        if(!tmpl) return;
        var typeIcon={area_clear:'⚔️',kill_quota:'💀',no_damage:'🛡️',run_count:'🏃',gold_earned:'✦'}[tmpl.type]||'📋';
        html+='<div style="background:rgba(12,7,2,.9);border:1px solid #3a2010;border-radius:6px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;gap:8px;">'
          +'<div style="flex:1;">'
          +'<div style="font-size:10px;color:#c0a060;">'+typeIcon+' '+tmpl.label+'</div>'
          +'<div style="font-size:8px;color:#7a6030;margin-top:2px;">Reward: '+formatReward(tmpl.reward)+'</div>'
          +'</div>'
          +'<button class="btn btn-dim" style="font-size:9px;padding:4px 10px;flex-shrink:0;" onclick="activateQuest(\''+qid+'\')">ACCEPT</button>'
          +'</div>';
      });
    }
    html+='<div style="margin-top:8px;text-align:right;">'
      +'<button class="btn btn-dim" style="font-size:8px;padding:3px 8px;" onclick="generateQuestOffers();refreshBoardPanel();">🔄 NEW QUESTS</button>'
      +'</div>';
  }

  panel.innerHTML=html;
}

function claimCardFragment(){
  if((PERSIST.town.cardFragments||0)<100){ showTownToast('Need 100 Card Fragments.'); return; }
  PERSIST.town.cardFragments-=100;
  addTownCard('ruby');
  savePersist();
  refreshVaultPanel();
  buildTownCardsStrip();
  showTownToast('Ruby Gem crafted!');
}

var GEM_CRAFT_COSTS={ruby:30,emerald:75,sapphire:150,turquoise:300,amethyst:600,topaz:1200,obsidian:2500,opal:5000};

function craftGem(tier){
  tier=tier||'ruby';
  var cost=GEM_CRAFT_COSTS[tier]||30;
  var shards=PERSIST.town.materials.gemShards||0;
  if(shards<cost){ showTownToast('Need '+cost+' Gem Shards to craft a '+CARD_TIER_LABELS[tier]+' gem.'); return; }
  PERSIST.town.materials.gemShards-=cost;
  addTownCard(tier);
  savePersist();
  refreshVaultPanel();
  buildTownCardsStrip();
  var icon={'ruby':'💎','emerald':'💚','sapphire':'🔷','turquoise':'🩵','amethyst':'💜','topaz':'🟡','obsidian':'⬛','opal':'🌈'}[tier]||'💎';
  showTownToast(icon+' '+CARD_TIER_LABELS[tier]+' gem crafted!');
}

function buyVaultUpgrade(id){
  var upg=VAULT_UPGRADES.find(function(u){return u.id===id;});
  if(!upg) return;
  var u=PERSIST.town.vaultUpgrades;
  if(u[id]){ showTownToast('Already purchased!'); return; }
  if((upg.minLevel||1)>getVaultLevel()){ showTownToast('Requires Vault Lv.'+(upg.minLevel||1)+'.'); return; }
  if(upg.requires&&!u[upg.requires]){ showTownToast('Requires '+VAULT_UPGRADES.find(function(x){return x.id===upg.requires;}).label+' first.'); return; }
  if(PERSIST.gold<upg.cost){ showTownToast('Need '+upg.cost+'g to purchase.'); return; }
  PERSIST.gold-=upg.cost;
  u[id]=true;
  savePersist();
  updateNavBar('town');
  refreshVaultPanel();
  showTownToast(upg.label+' purchased!');
}

function _getSelectedVaultItem(){
  if(!_vaultSelected) return null;
  return buildInvItems().find(function(x){return x.id===_vaultSelected;})||null;
}

function sellSelectedVaultItem(){
  var item=_getSelectedVaultItem(); if(!item) return;
  sellVaultItem({itemType:item.itemType,lootKey:item.lootKey||null,matKey:item.matKey||null,name:item.name,count:item.count});
}

function recycleSelectedVaultItem(){
  var item=_getSelectedVaultItem(); if(!item) return;
  recycleVaultItem({itemType:item.itemType,lootKey:item.lootKey||null,matKey:item.matKey||null,name:item.name,count:item.count});
}

function recycleVaultItem(item){
  if(item.itemType==='towncard'){ showTownToast('Town cards cannot be recycled.'); return; }
  var shards=getRecycleValue(item);
  if(!shards){ showTownToast('This item cannot be recycled.'); return; }
  if(item.lootKey){
    if((PERSIST.town.items[item.lootKey]||0)<=0){ showTownToast('None left to recycle.'); return; }
    PERSIST.town.items[item.lootKey]--;
  } else if(item.matKey){
    if((PERSIST.town.materials[item.matKey]||0)<=0){ showTownToast('None left to recycle.'); return; }
    PERSIST.town.materials[item.matKey]--;
  }
  PERSIST.town.materials.gemShards=(PERSIST.town.materials.gemShards||0)+shards;
  savePersist(); updateNavBar('town');
  showTownToast('Recycled '+item.name+' → +'+shards+' 💎 Gem Shard'+(shards!==1?'s':''));
  _vaultSelected=null;
  refreshVaultPanel();
}

var RECYCLE_VALUES={
  // Keys: 1-4 shards depending on tier
  key_sewers:1, key_sewers_deep:1, key_sewers_foul:2,
  key_bog:2, key_crypt:2, key_forest:2,
  key_cave:3, key_ruins:3, key_dragon:4,
  key_bone:4, key_astral:5, key_mist:2,
  // Chests: 2-8 shards
  chest_sewers:2, chest_bog:3, chest_crypt:3,
  chest_forest:4, chest_cave:4, chest_ruins:5,
  chest_dragon:6, chest_bone:6, chest_astral:8,
  chest_mist:3,
  // Materials: generally not recyclable (they are crafting ingredients)
  embers:1, flameShards:2,
};

function getRecycleValue(item){
  if(item.itemType==='towncard') return 0;
  if(item.lootKey) return RECYCLE_VALUES[item.lootKey]||0;
  if(item.matKey) return RECYCLE_VALUES[item.matKey]||0;
  return 0;
}

function sellVaultItem(item){
  if(item.itemType==='towncard'){ showTownToast('Town cards cannot be sold.'); return; }
  var price=getSellPrice(item);
  if(!price){ showTownToast('This item cannot be sold.'); return; }
  // Sell one unit
  if(item.lootKey){
    if((PERSIST.town.items[item.lootKey]||0)<=0){ showTownToast('None left to sell.'); return; }
    PERSIST.town.items[item.lootKey]--;
  } else if(item.matKey){
    if(item.matKey==='sparks'){
      // Sell in batches of 5
      var batchSize=5; var batchPrice=1;
      if((PERSIST.town.materials.sparks||0)<batchSize){ showTownToast('Need at least 5 Sparks to sell.'); return; }
      PERSIST.town.materials.sparks-=batchSize;
      PERSIST.gold+=batchPrice;
      savePersist(); updateNavBar('town'); _vaultSelected=null; refreshVaultPanel();
      showTownToast('Sold 5 Sparks for '+batchPrice+'g');
      return;
    }
    if((PERSIST.town.materials[item.matKey]||0)<=0){ showTownToast('None left to sell.'); return; }
    PERSIST.town.materials[item.matKey]--;
  }
  PERSIST.gold+=price;
  savePersist(); updateNavBar('town');
  showTownToast('Sold '+item.name+' for '+price+'g');
  _vaultSelected=null;
  refreshVaultPanel();
}

function refreshVaultPanel(){
  var b=PERSIST.town.buildings.vault;
  // Show locked state if vault hasn't been unlocked by first run
  var lockedMsg=document.getElementById('vault-locked-msg');
  if(lockedMsg){
    if(!b.unlocked){
      lockedMsg.style.display='block';
      lockedMsg.innerHTML='<div style="font-family:Cinzel,serif;font-size:10px;color:#5a4020;margin-bottom:4px;">🔒 VAULT LOCKED</div>'
        +'<div style="font-size:9px;color:#3a2010;">Complete your first run to open the Vault.</div>';
      return; // don't render rest of panel
    } else {
      lockedMsg.style.display='none';
    }
  }
  refreshVaultLevelBar();
  _refreshVaultGenBar();
  var slotCard=b.slottedCard?getTownCardById(b.slottedCard):null;
  var cap=getTownCardCap();
  var activated=!!slotCard;

  // Slot display
  var slotEl=document.getElementById('vault-slot');
  if(slotEl){
    slotEl.className='building-slot'+(slotCard?' has-card '+slotCard.tier:'');
    slotEl.innerHTML=slotCard?'<span class="slot-card-gem">'+TOWN_CARD_GEMS(slotCard.tier)+'</span>':'<span style="color:#3a2810;font-size:16px;">+</span>';
  }
  var hint=document.getElementById('vault-slot-hint');
  if(hint) hint.textContent=slotCard?(slotCard.tier+' · '+cap+' slots'):'drag gem here';
  var capTxt=document.getElementById('vault-cap-txt');
  if(capTxt) capTxt.textContent='Your inventory · '+cap+' slots';

  // Sort controls
  var sortBar=document.getElementById('vault-sort-bar');
  var sortVal=sortBar?sortBar.value:'cat';

  // Build grid
  var grid=document.getElementById('vault-inv-grid');
  if(!grid) return;
  grid.innerHTML='';
  var items=buildInvItems();

  // Sort
  if(sortVal==='name') items.sort(function(a,b){return a.name.localeCompare(b.name);});
  else if(sortVal==='count') items.sort(function(a,b){return b.count-a.count;});
  else if(sortVal==='type') items.sort(function(a,b){return a.itemType.localeCompare(b.itemType)||a.name.localeCompare(b.name);});

  // Pagination — pages cover whichever is larger: cap or actual item count
  // This ensures items are always accessible even if inventory is "overfull"
  var totalSlots=Math.max(cap, items.length);
  var totalPages=Math.max(1,Math.ceil(totalSlots/VAULT_PER_PAGE));
  _vaultPage=Math.max(0,Math.min(totalPages-1,_vaultPage));
  var pgLbl=document.getElementById('vault-pg-lbl');
  var pgPrev=document.getElementById('vault-pg-prev');
  var pgNext=document.getElementById('vault-pg-next');
  if(pgLbl) pgLbl.textContent=totalPages>1?(_vaultPage+1)+'/'+totalPages:'';
  if(pgPrev){ pgPrev.disabled=_vaultPage===0; pgPrev.style.display=totalPages>1?'':'none'; }
  if(pgNext){ pgNext.disabled=_vaultPage>=totalPages-1; pgNext.style.display=totalPages>1?'':'none'; }

  var pageStart=_vaultPage*VAULT_PER_PAGE;
  var pageEnd=pageStart+VAULT_PER_PAGE;

  // Render this page's slots — items or empty boxes, always VAULT_PER_PAGE cells
  for(var si=pageStart;si<pageEnd;si++){
    var item=items[si]||null;
    var cell=document.createElement('div');
    var isOverCap=si>=cap; // item exists but exceeds capacity
    if(item){
      cell.className='vault-slot-cell has-item'+(item.id===_vaultSelected?' selected':'')+(isOverCap?' overcap':'');
      if(item.color) cell.style.borderColor=isOverCap?'#6a1010':item.color+'44';
      if(isOverCap) cell.title='Over capacity — sell or recycle items, or upgrade shelves';
      cell.innerHTML='<div class="vault-cell-icon">'+item.icon+'</div>'
        +'<div class="vault-cell-name">'+item.name.split(' ').slice(-2).join(' ')+'</div>'
        +(item.count>1?'<div class="vault-cell-count">'+item.count+'</div>':'');
      (function(it){ cell.onclick=function(){ selectVaultItem(it.id); }; })(item);
    } else {
      cell.className='vault-slot-cell empty-slot';
    }
    grid.appendChild(cell);
  }

  // Re-render inspector for currently selected item
  if(_vaultSelected){
    var found=items.find(function(x){return x.id===_vaultSelected;});
    if(found) renderVaultInspector(found);
    else { _vaultSelected=null; clearVaultInspector(); }
  }

  // Card fragments shown in Sanctum, not here

  // Gem shards row — craft Ruby gems only (upgrading done in Forge)
  var gemRow=document.getElementById('vault-gem-shards-row');
  if(gemRow){
    var shards=PERSIST.town.materials.gemShards||0;
    var rubyCost=GEM_CRAFT_COSTS.ruby||30;
    if(shards>0){
      var canCraft=shards>=rubyCost;
      gemRow.innerHTML=gemImgHTML('ruby','18px')+' '+shards+' Gem Shards'
        +(canCraft?' &nbsp;<button class="vault-upg-btn" style="width:auto;padding:2px 8px;border-color:#c09030;color:#d4a843;" onclick="craftGem(\'ruby\')">CRAFT RUBY ('+rubyCost+')</button>':' / '+rubyCost+' → 💎 Ruby');
      gemRow.style.color=canCraft?'#d4a843':'#5a4020';
    } else {
      gemRow.textContent='';
    }
  }

  // Upgrades grid — shelves show as one slot that upgrades, others separate
  var upgGrid=document.getElementById('vault-upg-grid');
  if(upgGrid){
    upgGrid.innerHTML='';
    var u=PERSIST.town.vaultUpgrades||{};
    var lv=getVaultLevel();

    // Shelves: show as one item representing current tier + next upgrade
    var shelfTier=u.shelf3?3:u.shelf2?2:u.shelf1?1:0;
    var shelfLabels=['Extra Shelves','Expanded Shelves','Grand Shelves'];
    var shelfCosts=[60,150,350];
    var shelfEl=document.createElement('div');
    shelfEl.className='vault-upg-item'+(shelfTier>=3?' purchased':'');
    var currentSlots=16+(shelfTier*8);
    if(shelfTier>=3){
      shelfEl.innerHTML='<div class="vault-upg-name">Grand Shelves ✓</div>'
        +'<div class="vault-upg-effect">'+currentSlots+' total slots · Max tier reached</div>'
        +'<button class="vault-upg-btn" disabled>✓ MAXED</button>';
    } else {
      var nextId='shelf'+(shelfTier+1);
      var nextUpg=VAULT_UPGRADES.find(function(x){return x.id===nextId;});
      var nextLabel=nextUpg.label;
      var nextCost=nextUpg.cost;
      var nextMinLvl=nextUpg.minLevel||1;
      var meetsLevel=lv>=nextMinLvl;
      var canAfford=PERSIST.gold>=nextCost;
      shelfEl.innerHTML='<div class="vault-upg-name">'+(shelfTier>0?'✓ → ':'')+nextLabel+'</div>'
        +'<div class="vault-upg-effect">'+currentSlots+' slots now · +8 more after upgrade</div>'
        +(!meetsLevel?'<div class="vault-upg-lvl">Requires Vault Lv.'+nextMinLvl+'</div>':'')
        +'<button class="vault-upg-btn"'+((meetsLevel&&canAfford)?'':' disabled')+' onclick="buyVaultUpgrade(\''+nextId+'\')">'
        +(!meetsLevel?'🔒 Lv.'+nextMinLvl+' required':canAfford?'✦ '+nextCost+'g':'Need '+(nextCost-PERSIST.gold)+'g more')+'</button>';
    }
    upgGrid.appendChild(shelfEl);

    // Other upgrades (sell desk, recycle)
    ['sellDesk','recycle'].forEach(function(id){
      var upg=VAULT_UPGRADES.find(function(x){return x.id===id;});
      if(!upg) return;
      var purchased=!!u[upg.id];
      var meetsLevel=lv>=(upg.minLevel||1);
      var canAfford=PERSIST.gold>=upg.cost;
      var el=document.createElement('div');
      el.className='vault-upg-item'+(purchased?' purchased':'');
      var locked=!meetsLevel;
      var btnLabel=purchased?'✓ OWNED':locked?'🔒 Lv.'+upg.minLevel+' required':canAfford?'✦ '+upg.cost+'g':'Need '+(upg.cost-PERSIST.gold)+'g more';
      el.innerHTML='<div class="vault-upg-name">'+upg.label+'</div>'
        +'<div class="vault-upg-effect">'+upg.effect+'</div>'
        +(!purchased&&locked?'<div class="vault-upg-lvl">Vault Lv.'+upg.minLevel+' required</div>':'')
        +'<button class="vault-upg-btn"'+((purchased||locked||!canAfford)?' disabled':'')+' onclick="buyVaultUpgrade(\''+upg.id+'\')">'+btnLabel+'</button>';
      upgGrid.appendChild(el);
    });
  }
}

function selectVaultItem(itemId){
  _vaultSelected=itemId;
  var items=buildInvItems();
  var item=items.find(function(x){return x.id===itemId;});
  if(item) renderVaultInspector(item);
  // Refresh grid to update selected highlight
  var cells=document.getElementById('vault-inv-grid');
  if(cells) cells.querySelectorAll('.vault-slot-cell').forEach(function(c){ c.classList.remove('selected'); });
  // Find and re-add
  refreshVaultPanel();
}

function clearVaultInspector(){
  var col=document.getElementById('vault-inspector');
  if(col) col.innerHTML='<div class="vault-inspector-empty">← Select an item</div>';
}

var ITEM_FLAVOUR={
  key_sewers:'A rusted key caked with grime and worse. It smells of things best left unnamed.',
  key_sewers_deep:'A corroded key from deeper tunnels. Something tried to clean it. Failed.',
  key_sewers_foul:'A twisted key dripping with foul ichor. Opening what this unlocks feels unwise.',
  key_bog:'A mossy key dredged from murky water. Still warm from whatever last held it.',
  key_crypt:'A bone-carved key etched with faded runes. The runes seem to shift in dim light.',
  key_forest:'A key of ironwood, harder than steel. Something that shouldn\'t be dead made it.',
  key_cave:'A key worn smooth by talon-calloused hands. Lighter than it looks.',
  key_ruins:'An ancient key still holding its original gleam. The lock it fits has not moved in centuries.',
  key_dragon:'A key smelted from dragonscale. It hums faintly with residual heat.',
  key_bone:'A key carved from something older than the ruins themselves.',
  key_astral:'A key that doesn\'t quite exist here. It leaves a faint afterimage when you look away.',
  chest_sewers:'A battered iron chest dredged from the dark. Waterlogged but the lock holds.',
  chest_bog:'A chest wrapped in swamp vine. Something inside shifts when you tilt it.',
  chest_crypt:'A sepulchral chest sealed with undead magic. Cold to the touch.',
  chest_forest:'A chest of living wood, still growing. Small leaves sprout from the hinges.',
  chest_cave:'A talon-scarred chest, scratched open and re-locked many times over the years.',
  chest_ruins:'An ancient reliquary sealed with mechanisms that shouldn\'t still function.',
  chest_dragon:'A chest fireproofed through necessity. Still faintly hot inside.',
  chest_bone:'A chest that seems to breathe. It doesn\'t.',
  chest_astral:'A chest that holds more inside than outside. The laws of space have negotiated.',
};
var ITEM_INFO={
  key_sewers:'Opens Sewer Chests · Provides +1 bonus loot roll when used with a Sewer Chest',
  key_sewers_deep:'Opens Sewer Chests · Provides +1 bonus loot roll when used with a Sewer Chest',
  key_sewers_foul:'Opens Sewer Chests · Provides +1 bonus loot roll when used with a Sewer Chest',
  key_bog:'Opens Bog Chests · +1 bonus roll when opening a Bog Chest',
  key_crypt:'Opens Crypt Chests · +1 bonus roll when opening a Crypt Chest',
  key_forest:'Opens Forest Chests · +1 bonus roll when opening a Forest Chest',
  key_cave:'Opens Cave Chests · +1 bonus roll when opening a Cave Chest',
  key_ruins:'Opens Ancient Chests · +1 bonus roll when opening an Ancient Chest',
  key_dragon:'Opens Dragon Chests · +1 bonus roll when opening a Dragon Chest',
  key_bone:'Opens Bone Chests · +1 bonus roll when opening a Bone Chest',
  key_astral:'Opens Astral Chests · +1 bonus roll when opening an Astral Chest',
  chest_sewers:'2 loot rolls · +1 bonus roll if you have a Sewer Key · Drops from the Sewers',
  chest_bog:'2 loot rolls · +1 bonus roll with a Bog Key · Drops from Bogmire Swamp',
  chest_crypt:'2 loot rolls · +1 bonus roll with a Crypt Key · Drops from the Forgotten Crypt',
  chest_forest:'3 loot rolls · +1 bonus roll with a Forest Key · Drops from Thornwood Forest',
  chest_cave:'3 loot rolls · +1 bonus roll with a Cave Key · Drops from Eagle\'s Cave',
  chest_ruins:'4 loot rolls · +1 bonus roll with an Ancient Key · Drops from the Sunken Ruins',
  chest_dragon:'4 loot rolls · +1 bonus roll with a Dragon Key · Drops from the Dragon\'s Nest',
  chest_bone:'4 loot rolls · +1 bonus roll with a Bone Key · Drops from the Boneyard',
  chest_astral:'5 loot rolls · +1 bonus roll with an Astral Key · Drops from the Star Maze',
};

function _refreshVaultGenBar(){
  var wrap=document.getElementById('vault-gen-wrap');
  var bar=document.getElementById('vault-gen-bar');
  var tierEl=document.getElementById('vault-gen-tier');
  if(!wrap||!bar) return;
  var b=PERSIST.town.buildings.vault;
  var active=b&&b.slottedCard;
  wrap.style.display=active?'block':'none';
  if(active){
    var card=getTownCardById(b.slottedCard);
    var tier=card?card.tier:'ruby';
    var tierLabels={ruby:'Ruby',emerald:'Emerald',sapphire:'Sapphire',turquoise:'Turquoise',amethyst:'Amethyst',topaz:'Topaz',obsidian:'Obsidian',opal:'Opal'};
    if(tierEl) tierEl.textContent=(tierLabels[tier]||tier)+' gem';
    var pct=Math.min(100,PERSIST.town.vaultGenProgress||0);
    bar.style.width=pct.toFixed(1)+'%';
    bar.style.background=pct>=90
      ?'linear-gradient(90deg,#c09030,#ffd040)'
      :'linear-gradient(90deg,#3a2808,#c09030)';
  }
}

function refreshVaultLevelBar(){
  var lv=PERSIST.town.vaultLevel||1;
  var xp=PERSIST.town.vaultXp||0;
  var maxLv=VAULT_XP_THRESHOLDS.length+1;
  var thresh=lv<maxLv?(VAULT_XP_THRESHOLDS[lv-1]||9999):9999;
  var pct=thresh<9999?Math.min(100,(xp/thresh)*100):100;
  var badge=document.getElementById('vault-level-badge');
  var bar=document.getElementById('vault-xp-bar');
  var txt=document.getElementById('vault-xp-txt');
  if(badge) badge.textContent='VAULT Lv.'+lv+(lv>=maxLv?' ✦MAX':'');
  if(bar) bar.style.width=pct.toFixed(1)+'%';
  if(txt) txt.textContent=lv>=maxLv?'Fully researched':(xp.toFixed(1)+' / '+thresh+' XP');
}

function getVaultLevel(){ return PERSIST.town.vaultLevel||1; }

function renderVaultInspector(item){
  var drawer=document.getElementById('vault-inspector');
  if(!drawer) return;
  var vLvl=getVaultLevel();
  var flavour=ITEM_FLAVOUR[item.lootKey||item.matKey||'']||'';
  var info=ITEM_INFO[item.lootKey||item.matKey||'']||(item.matKey?MATERIAL_DEFS[item.matKey].desc:'');

  // Icon
  var iconEl=document.getElementById('vi-icon');
  if(iconEl) iconEl.textContent=item.icon;

  // Main content
  var mainEl=document.getElementById('vi-main');
  if(mainEl){
    var html='<div class="vi-name">'+item.name+'</div>'
      +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">'
        +'<span class="vi-type-badge vi-type-'+item.itemType+'">'+item.itemType.toUpperCase()+'</span>'
        +'<span class="vi-count">Owned: <strong>'+item.count+'</strong></span>'
      +'</div>';
    if(vLvl>=2&&flavour) html+='<div class="vi-flavour">'+flavour+'</div>';
    else if(vLvl<2&&flavour) html+='<div class="vi-locked-info">📖 Vault Lv.2 — Lore unlocks</div>';
    if(vLvl>=3&&info) html+='<div class="vi-info">'+info+'</div>';
    else if(vLvl<3&&info) html+='<div class="vi-locked-info">🗺 Vault Lv.3 — Source info unlocks</div>';
    mainEl.innerHTML=html;
  }

  // Actions
  var actEl=document.getElementById('vi-actions');
  if(actEl){
    var ahtml='';
    if(item.itemType==='chest'){
      var lk=item.lootKey;
      var biome=LOOT_DEFS[lk]?LOOT_DEFS[lk].biome:null;
      var matchKeyId=null;
      if(biome){
        var keyIds=Object.keys(LOOT_DEFS).filter(function(k){return LOOT_DEFS[k].type==='key'&&LOOT_DEFS[k].biome===biome;});
        matchKeyId=keyIds.find(function(k){return (PERSIST.town.items[k]||0)>0;})||null;
      }
      var bonus=!!matchKeyId;
      ahtml+='<button class="vi-btn" onclick="openChest(\''+lk+'\''+(bonus?',\''+matchKeyId+'\'':'')+')">⚡ OPEN'+(bonus?' + KEY BONUS':'')+' →</button>';
      if(bonus) ahtml+='<span class="vi-btn-note">Uses 1 '+LOOT_DEFS[matchKeyId].name+'</span>';
    } else if(item.itemType==='towncard'){
      var card=item.cardRef;
      if(card.slottedIn){
        ahtml+='<div class="vi-locked-info">Slotted in: '+card.slottedIn+'</div>';
        ahtml+='<button class="vi-btn" onclick="unslotCard(\''+card.id+'\');refreshVaultPanel();buildTownGrid();buildTownCardsStrip();">UNSLOT</button>';
      } else {
        ahtml+='<div class="vi-locked-info">In hand — drag onto a building to slot</div>';
      }
    }
    var hasSellDesk=PERSIST.town.vaultUpgrades&&PERSIST.town.vaultUpgrades.sellDesk;
    var hasRecycle=PERSIST.town.vaultUpgrades&&PERSIST.town.vaultUpgrades.recycle;
    if(item.itemType!=='towncard'){
      var sp=getSellPrice(item);
      if(sp>0){
        var sellLabel=item.matKey==='sparks'?'Sell 5 for 1g':'Sell for '+sp+'g';
        if(hasSellDesk) ahtml+='<button class="vi-btn" style="border-color:#6a3010;color:#c06030;" onclick="sellSelectedVaultItem()">🪙 '+sellLabel+'</button>';
        else ahtml+='<div class="vi-locked-info">🛒 '+sellLabel+' · Sell Desk needed</div>';
      }
      var rs=getRecycleValue(item);
      if(rs>0){
        if(hasRecycle) ahtml+='<button class="vi-btn" style="border-color:#2a4a2a;color:#60c060;" onclick="recycleSelectedVaultItem()">♻ → '+rs+' 💎</button>';
        else ahtml+='<div class="vi-locked-info">♻ '+rs+' 💎 shards · Recycling Bin needed</div>';
      }
    }
    actEl.innerHTML=ahtml;
  }

  // Open the drawer
  drawer.classList.add('open');
}

function clearVaultInspector(){
  _vaultSelected=null;
  var drawer=document.getElementById('vault-inspector');
  if(drawer) drawer.classList.remove('open');
  // Deselect grid highlight
  var grid=document.getElementById('vault-inv-grid');
  if(grid) grid.querySelectorAll('.vault-slot-cell.selected').forEach(function(c){c.classList.remove('selected');});
}

// Slot picker for hand strip clicks (fallback for non-drag)
function openSlotPicker(cardId){
  // Open vault and let player drag from there, or auto-slot into first free building
  showTownToast('Drag the card onto a building to slot it, or open a building panel.');
}

// ═══════════════════════════════════════════════════════
// CHEST LOOT SYSTEM
// ═══════════════════════════════════════════════════════
var CHEST_LOOT_TABLES={
  chest_sewers:{rolls:2,rolls_key:3,keyBiome:'sewers',table:[
    {w:40,type:'material',id:'sparks',qty:[3,8]},
    {w:19,type:'loot',id:'key_sewers',qty:1},
    {w:16,type:'gold',qty:[10,25]},
    {w:10,type:'material',id:'embers',qty:[1,2]},
    {w:5, type:'material',id:'gemShards',qty:1},
    {w:3, type:'towncard',tier:'ruby'},
    {w:7, type:'champcard',qty:1},
  ]},
  chest_bog:{rolls:2,rolls_key:3,keyBiome:'swamp',table:[
    {w:35,type:'material',id:'sparks',qty:[4,10]},
    {w:17,type:'loot',id:'key_bog',qty:1},
    {w:16,type:'gold',qty:[15,35]},
    {w:12,type:'material',id:'embers',qty:[1,3]},
    {w:5, type:'material',id:'gemShards',qty:1},
    {w:6, type:'towncard',tier:'ruby'},
    {w:9, type:'champcard',qty:1},
  ]},
  chest_crypt:{rolls:2,rolls_key:3,keyBiome:'crypt',table:[
    {w:33,type:'material',id:'sparks',qty:[5,12]},
    {w:15,type:'loot',id:'key_crypt',qty:1},
    {w:18,type:'gold',qty:[15,40]},
    {w:13,type:'material',id:'embers',qty:[2,4]},
    {w:5, type:'material',id:'gemShards',qty:1},
    {w:6, type:'towncard',tier:'ruby'},
    {w:10,type:'champcard',qty:1},
  ]},
  chest_forest:{rolls:3,rolls_key:4,keyBiome:'forest',table:[
    {w:29,type:'material',id:'sparks',qty:[6,14]},
    {w:12,type:'loot',id:'key_forest',qty:1},
    {w:18,type:'gold',qty:[20,50]},
    {w:16,type:'material',id:'embers',qty:[2,5]},
    {w:8, type:'material',id:'gemShards',qty:[1,2]},
    {w:6, type:'towncard',tier:'ruby'},
    {w:1, type:'towncard',tier:'emerald'},
    {w:10,type:'champcard',qty:[1,2]},
  ]},
  chest_cave:{rolls:3,rolls_key:4,keyBiome:'cave',table:[
    {w:27,type:'material',id:'sparks',qty:[7,15]},
    {w:12,type:'loot',id:'key_cave',qty:1},
    {w:18,type:'gold',qty:[20,55]},
    {w:16,type:'material',id:'embers',qty:[3,6]},
    {w:8, type:'material',id:'gemShards',qty:[1,2]},
    {w:7, type:'towncard',tier:'ruby'},
    {w:2, type:'towncard',tier:'emerald'},
    {w:10,type:'champcard',qty:[1,2]},
  ]},
  chest_ruins:{rolls:4,rolls_key:5,keyBiome:'ruins',table:[
    {w:22,type:'material',id:'sparks',qty:[8,18]},
    {w:9, type:'loot',id:'key_ruins',qty:1},
    {w:18,type:'gold',qty:[30,70]},
    {w:14,type:'material',id:'embers',qty:[3,7]},
    {w:10,type:'material',id:'flameShards',qty:[1,2]},
    {w:8, type:'material',id:'gemShards',qty:[1,2]},
    {w:6, type:'towncard',tier:'ruby'},
    {w:2, type:'towncard',tier:'emerald'},
    {w:11,type:'champcard',qty:[1,2]},
  ]},
  chest_dragon:{rolls:4,rolls_key:5,keyBiome:'dragon',table:[
    {w:20,type:'material',id:'embers',qty:[4,9]},
    {w:9, type:'loot',id:'key_dragon',qty:1},
    {w:18,type:'gold',qty:[35,80]},
    {w:18,type:'material',id:'flameShards',qty:[1,3]},
    {w:9, type:'material',id:'sparks',qty:[10,20]},
    {w:12,type:'material',id:'gemShards',qty:[2,3]},
    {w:4, type:'towncard',tier:'ruby'},
    {w:2, type:'towncard',tier:'emerald'},
    {w:8, type:'champcard',qty:[1,2]},
  ]},
  chest_bone:{rolls:4,rolls_key:5,keyBiome:'boneyard',table:[
    {w:20,type:'material',id:'embers',qty:[4,9]},
    {w:9, type:'loot',id:'key_bone',qty:1},
    {w:18,type:'gold',qty:[35,80]},
    {w:18,type:'material',id:'flameShards',qty:[1,3]},
    {w:9, type:'material',id:'sparks',qty:[10,20]},
    {w:12,type:'material',id:'gemShards',qty:[2,3]},
    {w:4, type:'towncard',tier:'ruby'},
    {w:2, type:'towncard',tier:'emerald'},
    {w:8, type:'champcard',qty:[1,2]},
  ]},
  chest_astral:{rolls:5,rolls_key:6,keyBiome:'starmaze',table:[
    {w:14,type:'material',id:'flameShards',qty:[2,5]},
    {w:7, type:'loot',id:'key_astral',qty:1},
    {w:16,type:'gold',qty:[50,120]},
    {w:14,type:'material',id:'embers',qty:[5,12]},
    {w:11,type:'material',id:'sparks',qty:[15,30]},
    {w:12,type:'material',id:'gemShards',qty:[2,4]},
    {w:6, type:'towncard',tier:'ruby'},
    {w:5, type:'towncard',tier:'emerald'},
    {w:2, type:'towncard',tier:'sapphire'},
    {w:13,type:'champcard',qty:[2,3]},
  ]},
  chest_mist:{rolls:2,rolls_key:3,keyBiome:'mistwoods',table:[
    {w:33,type:'material',id:'sparks',qty:[5,12]},
    {w:17,type:'loot',id:'key_mist',qty:1},
    {w:16,type:'gold',qty:[15,40]},
    {w:13,type:'material',id:'embers',qty:[1,3]},
    {w:5, type:'material',id:'gemShards',qty:1},
    {w:7, type:'towncard',tier:'ruby'},
    {w:9, type:'champcard',qty:1},
  ]},
  chest_wax:{rolls:2,rolls_key:3,keyBiome:'waxdunes',table:[
    {w:36,type:'material',id:'sparks',qty:[4,10]},
    {w:19,type:'loot',id:'key_wax',qty:1},
    {w:19,type:'gold',qty:[12,30]},
    {w:8, type:'material',id:'embers',qty:[1,2]},
    {w:5, type:'material',id:'gemShards',qty:1},
    {w:4, type:'towncard',tier:'ruby'},
    {w:9, type:'champcard',qty:1},
  ]},
};
function rollChestTable(tableEntry){
  var total=tableEntry.reduce(function(s,e){return s+e.w;},0);
  var r=Math.random()*total,cum=0;
  for(var i=0;i<tableEntry.length;i++){ cum+=tableEntry[i].w; if(r<=cum) return tableEntry[i]; }
  return tableEntry[tableEntry.length-1];
}

var _chestPendingLoot=[];

function openChest(chestId, keyId){
  var tbl=CHEST_LOOT_TABLES[chestId];
  if(!tbl){ showTownToast('Unknown chest type.'); return; }
  if((PERSIST.town.items[chestId]||0)<=0){ showTownToast('No chests of this type.'); return; }

  // Consume chest
  PERSIST.town.items[chestId]--;
  // Consume key if provided
  var useKey=keyId&&(PERSIST.town.items[keyId]||0)>0;
  if(useKey) PERSIST.town.items[keyId]--;

  // Roll loot
  var rolls=useKey?tbl.rolls_key:tbl.rolls;
  var loot=[];
  for(var i=0;i<rolls;i++){
    var entry=rollChestTable(tbl.table);
    loot.push({entry:entry,isBonus:useKey&&i===rolls-1});
  }

  // Store pending loot (applied on close)
  _chestPendingLoot=loot;
  savePersist();

  // Show overlay
  showChestOverlay(chestId, loot, useKey?LOOT_DEFS[keyId]:null);
}

function pickChampCardRecipient(){
  // Weight towards unlocked champions, fallback to starters
  var unlocked=PERSIST.unlockedChamps.filter(function(id){return !!CREATURES[id];});
  if(!unlocked.length) unlocked=['druid','paladin','thief'];
  return unlocked[Math.floor(Math.random()*unlocked.length)];
}

function showChestOverlay(chestId, loot, keyDef){
  var def=LOOT_DEFS[chestId]||{icon:'📦',name:'Chest'};
  var ov=document.getElementById('chest-overlay');
  document.getElementById('chest-ov-label').textContent='OPENING '+def.name.toUpperCase();
  var iconEl=document.getElementById('chest-ov-icon');
  iconEl.textContent=def.icon;
  iconEl.className='chest-ov-icon';
  document.getElementById('chest-loot-list').innerHTML='';
  document.getElementById('chest-ov-btn').style.display='none';
  ov.style.display='flex';

  // Phase 1: idle float → shake → burst → reveal
  setTimeout(function(){
    iconEl.className='chest-ov-icon shaking';
    setTimeout(function(){
      iconEl.className='chest-ov-icon bursting';
      setTimeout(function(){
        iconEl.style.display='none';
        revealLootItems(loot, keyDef, 0);
      }, 450);
    }, 900);
  }, 800);
}

function revealLootItems(loot, keyDef, idx){
  if(idx>=loot.length){
    setTimeout(function(){
      document.getElementById('chest-ov-btn').style.display='inline-block';
    }, 300);
    return;
  }
  var entry=loot[idx].entry;
  var isBonus=loot[idx].isBonus;
  var list=document.getElementById('chest-loot-list');
  var el=document.createElement('div');
  el.className='chest-loot-item'+(isBonus?' chest-loot-bonus':'');

  var icon='?', name='Unknown', qty='';
  if(entry.type==='material'&&MATERIAL_DEFS[entry.id]){
    icon=MATERIAL_DEFS[entry.id].icon;
    name=MATERIAL_DEFS[entry.id].name;
    var amount=entry.qty?Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1))+entry.qty[0]:1;
    qty='×'+amount;
    // Store resolved amount for apply
    entry._resolved=amount;
  } else if(entry.type==='gold'){
    icon='✦'; name='Gold';
    var g=Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1))+entry.qty[0];
    qty='+'+g+'g'; entry._resolved=g;
  } else if(entry.type==='loot'&&LOOT_DEFS[entry.id]){
    icon=LOOT_DEFS[entry.id].icon; name=LOOT_DEFS[entry.id].name; qty='×1';
  } else if(entry.type==='towncard'){
    var tierName=CARD_TIER_LABELS[entry.tier]||(entry.tier.charAt(0).toUpperCase()+entry.tier.slice(1));
    icon=TOWN_CARD_GEMS(entry.tier)||'💎'; name=tierName+' Gem'; qty='×1';
  } else if(entry.type==='champcard'){
    // Pick a random unlocked champion's card
    var champId=pickChampCardRecipient();
    entry._champId=champId;
    var cdId='card_'+champId;
    var cDef=LOOT_DEFS[cdId]||{icon:'📘',name:'Champion Card'};
    icon=cDef.icon; name=cDef.name;
    var cQty=entry.qty?Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1))+entry.qty[0]:1;
    qty='×'+cQty; entry._resolved=cQty;
  }

  el.innerHTML=(isBonus?'<div class="chest-bonus-badge">🗝️ BONUS ROLL</div>':'')+
    '<div style="display:flex;align-items:center;gap:14px;width:100%;">'
    +'<div class="chest-loot-icon">'+icon+'</div>'
    +'<div class="chest-loot-name">'+name+'</div>'
    +'<div class="chest-loot-qty">'+qty+'</div>'
    +'</div>';

  list.appendChild(el);
  // Trigger animation after brief paint delay
  setTimeout(function(){ el.classList.add('revealed'); },20);

  setTimeout(function(){ revealLootItems(loot,keyDef,idx+1); }, 480);
}

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


function closeChestOverlay(){
  // Apply all loot to PERSIST
  _chestPendingLoot.forEach(function(lootEntry){
    var entry=lootEntry.entry;
    if(entry.type==='material'){
      PERSIST.town.materials[entry.id]=(PERSIST.town.materials[entry.id]||0)+(entry._resolved||1);
    } else if(entry.type==='gold'){
      PERSIST.gold+=(entry._resolved||0);
    } else if(entry.type==='loot'){
      addLootItem(entry.id,1);
    } else if(entry.type==='towncard'){
      addTownCard(entry.tier);
    } else if(entry.type==='champcard'){
      var cid='card_'+(entry._champId||'druid');
      addLootItem(cid, entry._resolved||1);
    }
  });
  _chestPendingLoot=[];
  savePersist();
  document.getElementById('chest-overlay').style.display='none';
  document.getElementById('chest-ov-icon').style.display='block';
  document.getElementById('chest-ov-icon').className='chest-ov-icon';
  // Refresh vault if open
  refreshVaultPanel();
  updateNavBar('town');
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


