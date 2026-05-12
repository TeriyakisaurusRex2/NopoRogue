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
// Fallback span starts hidden; only revealed by onerror. The img renders
// directly with no opacity dance — cached images appear instantly, network
// loads paint when ready (browser default). Keeps the no-flash-of-emoji
// fix without depending on onload firing.
function creatureImgHTML(id, emoji, size, cls){
  var src = CREATURE_IMG_PATH + id + CREATURE_IMG_EXT;
  var sz  = size || '64px';
  var c   = cls  || '';
  return '<span class="creature-img-wrap '+c+'" style="width:'+sz+';height:'+sz+';display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">'
    + '<img src="'+src+'" '
      + 'style="image-rendering:pixelated;object-fit:contain;width:'+sz+';height:'+sz+';" '
      + 'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'inline\';">'
    + '<span style="font-size:calc('+sz+' * 0.7);line-height:1;display:none;">'+emoji+'</span>'
    + '</span>';
}

// Set a DOM element's content to a creature image (for elements set via textContent/innerHTML)
function setCreatureImg(el, id, emoji, size){
  if(!el) return;
  el.innerHTML = creatureImgHTML(id, emoji, size);
}

// Building icon — uses assets/icons/buildings/{id}.png, falls back to emoji.
// No opacity dance: img renders directly, fallback span only appears on error.
function buildingImgHTML(id, emoji, size){
  var sz = size || '52px';
  // Mapping kept for IDs that don't match their filename directly. All entries
  // here point to actual files in assets/icons/buildings/. Anything not in the
  // map falls through to assets/icons/buildings/<id>.png.
  var BUILDING_FILES = {shard_well:'shardwell',adventurers_hall:'hall',board:'questboard'};
  var src = 'assets/icons/buildings/' + (BUILDING_FILES[id]||id) + '.png';
  var onerr = "this.style.display='none';this.nextSibling.style.display='inline';";
  return '<span style="display:inline-flex;align-items:center;justify-content:center;width:'+sz+';height:'+sz+';flex-shrink:0;">' + '<img src="'+src+'" style="image-rendering:pixelated;object-fit:contain;width:'+sz+';height:'+sz+';" onerror="'+onerr+'">' + '<span style="font-size:calc('+sz+' * 0.7);line-height:1;display:none;">'+emoji+'</span>' + '</span>';
}
// gemImgHTML is defined further down (line ~108) using the GEM_FILE alias map.
// An earlier orphan declaration was here; removed because JS function-declaration
// hoisting meant the later one always won and edits to the orphan never applied.

// Relic icon — assets/icons/relics/<relicId>.png with emoji fallback from
// the relic definition. Same flicker-resistant pattern as creatureImgHTML
// (no opacity dance, fallback hidden until onerror fires).
// (Round 37: orphan relicImgHTML at this position deleted. There were
//  two declarations in this file — one here and the canonical one near
//  line 1869. JS function-hoisting makes the LATER win, so this earlier
//  copy was dead code that looked alive. Per the CLAUDE.md duplicate-
//  declaration rule, removed to prevent future "edit hits the wrong
//  copy" bugs.)

// Build a horizontal strip of equipped-relic icons for a champion. Each chip
// is hover-wired to the existing tooltip system. Returns '' when no relics
// equipped so callers can drop the strip cleanly. opts.size sets icon size.
function relicStripHTML(champId, opts){
  opts = opts || {};
  var equipped = (typeof getEquippedRelics === 'function') ? getEquippedRelics(champId) : [];
  return _relicStripFromIdsHTML(equipped, opts);
}

// Round 57: variant that takes a raw array of relic IDs (vs the
// champion-lookup variant above). Used by setEnemyUI to render the
// enemy's relic strip during arena duels, where the payload carries
// the relics directly on the enemy (e._arenaRelics) rather than
// going through a champion record.
function _relicStripFromIdsHTML(relicIds, opts){
  opts = opts || {};
  var size = opts.size || '24px';
  if(!relicIds || !relicIds.length) return '';
  var html = '<span class="relic-strip">';
  relicIds.forEach(function(rid){
    var r = (typeof RELICS !== 'undefined') ? RELICS[rid] : null;
    if(!r) return;
    html += '<span class="relic-chip" data-relic="'+rid+'" '
      + 'onmouseenter="_showRelicTip(\''+rid+'\', event)" '
      + 'onmousemove="moveTip(event)" '
      + 'onmouseleave="hideTip()">'
      + relicImgHTML(rid, size)
      + '</span>';
  });
  html += '</span>';
  return html;
}

// Tooltip helper used by relicStripHTML chips. Pulls name/desc/tier from
// the RELICS map and routes through the existing showTipDirect plumbing.
function _showRelicTip(relicId, e){
  if(typeof RELICS === 'undefined') return;
  var r = RELICS[relicId]; if(!r) return;
  var tier = (r.tier||'base').toUpperCase() + ' RELIC';
  var time = 'Equipped';
  if(typeof showTipDirect === 'function') showTipDirect(r.name, tier, r.desc||'', time, e);
}

// Preload tier gem icons so they're cached before the inventory inspector
// ever asks for them at a different size. Called once on init.
function preloadGemIcons(){
  var tiers = ['ruby','emerald','sapphire','turquoise','amethyst','topaz','blackopal'];
  tiers.forEach(function(t){
    var im = new Image();
    im.src = 'assets/icons/gem' + t + '.png';
  });
}

// Icon with optional alert badge overlay — used to flag claimable items, etc.
// src: full path to the icon, fallback: emoji glyph if image missing,
// size: CSS size (e.g. '24px'), hasAlert: bool.
function iconWithAlertHTML(src, fallback, size, hasAlert){
  var sz = size || '24px';
  return '<span class="icon-alert-wrap" style="position:relative;display:inline-flex;width:'+sz+';height:'+sz+';align-items:center;justify-content:center;flex-shrink:0;">'
    + '<img src="'+src+'" style="width:'+sz+';height:'+sz+';image-rendering:pixelated;object-fit:contain;" '
    + 'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'inline\';">'
    + '<span style="font-size:calc('+sz+' * 0.8);line-height:1;display:none;">'+(fallback||'?')+'</span>'
    + (hasAlert ? '<img src="assets/icons/alert.png" class="icon-alert-overlay" alt="!">' : '')
    + '</span>';
}

// ═══════════════════════════════════════════════════════
// DEV / PRE-SHIP FLAGS
// ═══════════════════════════════════════════════════════
// Flip these false (or delete) before ship. Each flag is meant to be
// found via "DEV:" grep in the codebase when audit time comes.

// Round 37: blanket unlock for all town buildings while we redesign
// the unlock pacing. Applied in loadPersist; idempotent. To re-gate,
// flip to false and the building defaults take over again.
var DEV_UNLOCK_ALL_BUILDINGS = true;

// Round 60: console-callable cheat to add Soul Shards for summons
// testing. Replaces the hardcoded "+500 Shards" button that used to
// live on the summons screen itself. Usage from devtools:
//   _devGiveShards()      → +500 (default)
//   _devGiveShards(100)   → +100
//   _devGiveShards(1000)  → +1000
// Refreshes any open summons panel + the shard well's summons banner
// so the new total is visible immediately.
function _devGiveShards(n){
  n = (typeof n === 'number' && n > 0) ? Math.floor(n) : 500;
  PERSIST.soulShards = (PERSIST.soulShards || 0) + n;
  savePersist();
  console.log('[DEV] Added ' + n + ' soul shards. Total: ' + PERSIST.soulShards);
  // Live refresh open surfaces
  if(typeof _refreshSummonsPanel === 'function') _refreshSummonsPanel();
  if(typeof refreshShardWellPanel === 'function'){
    var sw = document.getElementById('shard_well-panel-bg');
    if(sw && sw.classList.contains('show')) refreshShardWellPanel();
  }
  if(typeof refreshSummonsBanner === 'function') refreshSummonsBanner();
  if(typeof refreshNavCurrencies === 'function') refreshNavCurrencies();
}

// Round 62: console-callable cheat to add Gold for testing.
// Usage from devtools:
//   _devGiveGold()        → +1000 (default)
//   _devGiveGold(100)     → +100
//   _devGiveGold(50000)   → +50000
// Repaints the nav bar so the new total is visible immediately.
function _devGiveGold(n){
  n = (typeof n === 'number' && n > 0) ? Math.floor(n) : 1000;
  PERSIST.gold = (PERSIST.gold || 0) + n;
  savePersist();
  console.log('[DEV] Added ' + n + ' gold. Total: ' + PERSIST.gold);
  if(typeof refreshNavCurrencies === 'function') refreshNavCurrencies();
}

// Round 39: console-callable cheat to set up a relic-equipped state
// for testing layouts. Open devtools, run `_devGiveTestRelics()`, then
// refresh the UI (e.g. navigate away and back). Picks the first
// unlocked champion (skips dojo_tiger), bumps them to Sapphire (3
// relic slots), drops every base-tier relic into the vault, and
// equips two so the rail / champion-card / etc all have something
// to render. Idempotent — re-runs add more vault copies but the
// equip slice stays at 2.
function _devGiveTestRelics(){
  var champId = null;
  var pool = (PERSIST && PERSIST.unlockedChamps) || [];
  for(var i=0;i<pool.length;i++){
    if(pool[i] !== 'dojo_tiger' && CREATURES[pool[i]]){ champId = pool[i]; break; }
  }
  if(!champId){ console.log('[DEV] No unlocked champion to test on.'); return; }
  var cp = getChampPersist(champId);
  if(!cp){ console.log('[DEV] Champion persist missing for ' + champId); return; }
  // 3 relic slots = Sapphire tier (1 slot per tier)
  cp.ascensionTier = Math.max(cp.ascensionTier || 0, 3);
  // All base-tier relics into the vault
  if(!PERSIST.town.relics) PERSIST.town.relics = {};
  var baseRelics = (typeof RELICS !== 'undefined')
    ? Object.keys(RELICS).filter(function(id){ return RELICS[id].tier === 'base'; })
    : [];
  baseRelics.forEach(function(id){
    PERSIST.town.relics[id] = (PERSIST.town.relics[id]||0) + 1;
  });
  // Equip up to 2 (leave 1 slot empty so the partial-equipped UI is exercised)
  if(!cp.relics) cp.relics = [];
  cp.relics = baseRelics.slice(0, 2);
  savePersist();
  var name = CREATURES[champId].name;
  console.log('[DEV] '+name+' is now Sapphire (3 relic slots).');
  console.log('[DEV] '+baseRelics.length+' base relics added to vault. 2 equipped on '+name+'.');
  console.log('[DEV] Refresh the champion-select screen to see the new state.');
}

// Pixel-art icon size policy — never display below source resolution
// (J: pixel art looks bad squished). Helpers that wrap PNG assets pass
// their callers' size through this floor before rendering. Sizes given
// as raw pixel strings ('14px'); other values (calc, em, etc) pass
// through untouched since enforcing min on those is a different problem.
function _minSizePx(sz, minPx){
  if(typeof sz !== 'string') return minPx + 'px';
  var m = sz.match(/^(-?\d+)\s*px$/);
  if(!m) return sz; // not a px string — let caller's value pass through
  var n = parseInt(m[1], 10);
  if(isNaN(n) || n < minPx) return minPx + 'px';
  return sz;
}

// Gold icon — uses assets/icons/gold.png (24×24, pixel art), falls back
// to ✦. Display size is floored at 24px to avoid squishing the asset.
// Default also bumped 16px → 24px to match the floor.
function goldImgHTML(size){
  var sz = _minSizePx(size || '24px', 24);
  return '<span style="display:inline-flex;align-items:center;gap:3px;">'
    +'<img src="assets/icons/gold.png" style="width:'+sz+';height:'+sz+';image-rendering:pixelated;vertical-align:middle;" onerror="this.style.display=\'none\'">'
    +'</span>';
}

// Soul shard icon — two variants by display size:
//   < 48px  → assets/icons/soul_shard_small.png  (24×24 native)
//   ≥ 48px  → assets/icons/soul_shard.png        (48×48 native)
// Small variant floored at 24, large at 48 — "don't squish below
// native size" policy holds for both. Falls back to 🔮 emoji when the
// PNG isn't yet in place.
// (Round 39 added the 48px version; Round 62h added the 24px small
// variant for inline / nav-bar / counter use cases where 48 was
// massively oversized.)
function soulShardImgHTML(size){
  // Parse the requested px to pick the variant. Non-px strings (em,
  // %, etc.) just fall through to the large variant.
  var requestedPx = null;
  if(typeof size === 'string'){
    var m = size.match(/^(-?\d+)\s*px$/);
    if(m) requestedPx = parseInt(m[1], 10);
  }
  var useSmall = (requestedPx !== null && requestedPx < 48);
  var src      = useSmall ? 'assets/icons/soul_shard_small.png' : 'assets/icons/soul_shard.png';
  var sz       = useSmall ? _minSizePx(size, 24) : _minSizePx(size || '48px', 48);
  return '<span style="display:inline-flex;align-items:center;justify-content:center;width:'+sz+';height:'+sz+';">'
    + '<img src="'+src+'" style="width:'+sz+';height:'+sz+';image-rendering:pixelated;object-fit:contain;" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'inline\';">'
    + '<span style="font-size:calc('+sz+' * 0.85);line-height:1;display:none;">🔮</span>'
    + '</span>';
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
// GEM_FILE preserves tier-name aliases (obsidian/opal → gemblackopal) for any
// legacy callers that pass those tier IDs.
var GEM_FILE = { ruby:'gemruby', emerald:'gememerald', sapphire:'gemsapphire', turquoise:'gemturquoise', amethyst:'gemamethyst', topaz:'gemtopaz', obsidian:'gemblackopal', opal:'gemblackopal', black_opal:'gemblackopal', blackopal:'gemblackopal' };
// Gem icon — bare <img> tag. No fallback span (would flash visible for one
// frame in Brave even with display:none, producing the sprite-plus-emoji
// flicker users reported). All 7 tier PNGs ship with the project (48×48).
// Display floored at 48px — never squish source. (Round 38: a few
// decorative gem usages at <48 were either dead code or replaced
// with emoji equivalents to keep small-context layouts intact.)
function gemImgHTML(tier, size){
  var sz   = _minSizePx(size || '48px', 48);
  var file = GEM_FILE[tier] || ('gem' + (tier||'').replace(/_/g,''));
  return '<img src="assets/icons/'+file+'.png" alt="" style="display:inline-block;width:'+sz+';height:'+sz+';image-rendering:pixelated;object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));vertical-align:middle;flex-shrink:0;">';
}


// Round 62l: dropped `aspeed` (Auto-play Speed) — was stored but never
// consumed anywhere in the codebase. Combat is real-time; there is no
// auto-play. Also dropped ASPEED_DELAYS for the same reason. Added
// _muteStash so the new mute-button toggle can restore the prior slider
// value when you unmute.
var SETTINGS = { music:70, sfx:85, logd:'normal', confirm:false, tutorial:true };
var pendingConfirmIdx = -1;
var _muteStash = { music:70, sfx:85 };
var _settingsTab = 'audio';

function openSettings(){
  playUiSettingsSfx();
  document.getElementById('settings-overlay').classList.add('show');
  switchSettingsTab(_settingsTab);
  refreshNowPlaying();
  refreshMuteButtons();
}
function closeSettings(){
  playUiCloseSfx();
  document.getElementById('settings-overlay').classList.remove('show');
  deleteSaveCancel();
}

// Round 62l: tab switcher for the settings panel. Stashes the active
// tab in _settingsTab so re-opening returns you to the same tab.
function switchSettingsTab(tab){
  _settingsTab = tab;
  ['audio','gameplay','save'].forEach(function(t){
    var btn  = document.getElementById('stab-'+t);
    var pane = document.getElementById('spane-'+t);
    if(btn)  btn.classList.toggle('active', t===tab);
    if(pane) pane.style.display = (t===tab) ? '' : 'none';
  });
  // The "Now Playing" line is only on the AUDIO tab — refresh when we
  // land there so a re-open mid-track-change shows the right name.
  if(tab === 'audio') refreshNowPlaying();
}

// Round 62l: mute / unmute a slider (music or sfx). Stores the prior
// value in _muteStash so a second click restores it. Updates the
// slider DOM, the SETTINGS object, the displayed %, the mute-button
// icon, and persists to localStorage via applySetting.
function toggleMute(kind){
  var current = SETTINGS[kind] || 0;
  var target;
  if(current > 0){
    _muteStash[kind] = current;
    target = 0;
  } else {
    target = _muteStash[kind] || (kind === 'music' ? 70 : 85);
  }
  var slider = document.getElementById('s-'+kind);
  if(slider) slider.value = target;
  applySetting(kind, target);
  refreshMuteButtons();
}

// Paint the speaker / muted-speaker icons based on current slider state.
function refreshMuteButtons(){
  ['music','sfx'].forEach(function(kind){
    var btn = document.getElementById('s-'+kind+'-mute');
    if(!btn) return;
    var muted = !SETTINGS[kind] || SETTINGS[kind] === 0;
    btn.textContent = muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', muted);
  });
}

// Refresh the AUDIO tab's "Now Playing" line. Shows the friendly track
// name from audio.js's MUSIC_NAMES, or an em-dash when music is stopped
// or muted (getCurrentMusicName returns null in both cases).
function refreshNowPlaying(){
  var nameEl = document.getElementById('s-nowplaying-name');
  if(!nameEl) return;
  var name = (typeof getCurrentMusicName === 'function') ? getCurrentMusicName() : null;
  if(name){
    nameEl.textContent = '♪ ' + name;
    nameEl.classList.remove('silent');
  } else {
    nameEl.textContent = '— silent —';
    nameEl.classList.add('silent');
  }
}

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
  // Round 63: deletes the CURRENTLY ACTIVE save slot only — not the
  // entire localStorage. Other save slots are preserved. After delete
  // we reload so the login screen rebuilds with the updated registry
  // (and so any in-flight game state is cleared cleanly).
  var id = getActiveSaveId();
  if(id){
    deleteSaveById(id);
  } else {
    // Pre-Round-63 fallback: nothing was active, scrub legacy key too
    try{ localStorage.removeItem(PERSIST_KEY); }catch(e){}
  }
  // Settings are global (not per-save) — preserved.
  var dc=document.getElementById('s-delete-confirm');
  if(dc) dc.innerHTML='<div style="color:#60c060;font-size:11px;letter-spacing:1px;">✦ Save deleted. Reloading...</div>';
  setTimeout(function(){ window.location.reload(); },1000);
}
function applySetting(k,v){
  if(k==='music'){
    SETTINGS.music=+v;
    document.getElementById('sv-music').textContent=v+'%';
    updateMusicVolume();
    // Round 62l: mute button + now-playing line both react to volume.
    if(typeof refreshMuteButtons === 'function') refreshMuteButtons();
    if(typeof refreshNowPlaying === 'function') refreshNowPlaying();
  }
  else if(k==='sfx'){
    SETTINGS.sfx=+v;
    document.getElementById('sv-sfx').textContent=v+'%';
    if(typeof refreshMuteButtons === 'function') refreshMuteButtons();
  }
  else if(k==='logd'){ SETTINGS.logd=v; }
  else if(k==='confirm'){ SETTINGS.confirm=!!v; pendingConfirmIdx=-1; if(gs) renderHand(); }
  else if(k==='tutorial'){ SETTINGS.tutorial=!!v; }
  // Round 62l: 'aspeed' removed (was a dead setting with no consumer).
  try{ localStorage.setItem('cetd_settings',JSON.stringify(SETTINGS)); }catch(e){}
}
function loadSettings(){
  try{
    var s=JSON.parse(localStorage.getItem('cetd_settings')||'{}');
    if(s.music!=null){ document.getElementById('s-music').value=s.music; document.getElementById('sv-music').textContent=s.music+'%'; SETTINGS.music=s.music; if(s.music>0) _muteStash.music=s.music; }
    if(s.sfx!=null){   document.getElementById('s-sfx').value=s.sfx;     document.getElementById('sv-sfx').textContent=s.sfx+'%';     SETTINGS.sfx=s.sfx;     if(s.sfx>0)   _muteStash.sfx=s.sfx;     }
    if(s.logd){     document.getElementById('s-logd').value=s.logd;       SETTINGS.logd=s.logd; }
    if(s.confirm!=null){ document.getElementById('s-confirm').checked=s.confirm;   SETTINGS.confirm=s.confirm; }
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
// Round 63: surface a version constant — shown on the login screen,
// can be used by future feature gates. Bump when the save format
// changes meaningfully.
var GAME_VERSION = 'v0.1.0';

// Round 63: multi-save support. Single-save model retired.
//   localStorage 'cetd_saves'        → JSON array of save metadata
//     [{ id, name, createdAt, lastPlayed }]
//   localStorage 'cetd_active_save'  → id of the currently-loaded save
//   localStorage 'cetd_save_<id>'    → per-save serialized PERSIST blob
//
// PERSIST_KEY is kept as the LEGACY key — used only by the one-time
// migration helper (migrateLegacySaveIfNeeded). Live load/save go
// through getCurrentSaveKey() which reads 'cetd_active_save'.
var SAVES_REGISTRY_KEY = 'cetd_saves';
var ACTIVE_SAVE_KEY    = 'cetd_active_save';
var SAVE_PREFIX        = 'cetd_save_';
var PERSIST_KEY='cetd_v6'; // legacy — kept for migration only
var PERSIST={
  unlockedChamps:['druid','paladin','thief'],
  favoriteChamps:{}, // Round 62: champion ids the player has starred; sort to top of select grid
  seenEnemies:[], gold:50, metaCurrency:0, achievements:{},
  champions:{}, // keyed by champId: {level,xp,xpNext,stats,alive,lastArea}
  townUnlocked:true,
  town:{
    cards:[], // [{id,tier:'ruby'|'emerald'|'sapphire'...,slottedIn:buildingId|null}]
    buildings:{
      vault:{unlocked:true, slottedCard:null},
      forge:{unlocked:false,slottedCard:null,queue:[],assignedChamp:null},
      bestiary:{unlocked:true,slottedCard:null},
      shard_well:{unlocked:false,slottedCard:null,
                  // Round 40: champion-driven cap/rate/XP system
                  // Round 44: pendingShards is the well's own pool; the
                  // player must CLAIM to transfer to PERSIST.soulShards.
                  assignedChampIds:[],   // up to 3 ids
                  wellXp:0,              // accumulated, resets on level
                  wellLevel:1,           // separate from buildingLevel
                  unspentPoints:0,       // earned per well-level, spent on rate/cap
                  rateLevel:0,           // permanent rate upgrades (each = +5%)
                  capLevel:0,            // permanent cap upgrades (each = +1)
                  shardAcc:0,            // fractional accumulator for ticks
                  masteryAcc:0,          // fractional accumulator for slotted-champ mastery
                  pendingShards:0        // shards in the well awaiting CLAIM
                 },
      sanctum:   {unlocked:false,slottedCard:null},
      market:{unlocked:true,slottedCard:null, stock:[], refreshProgress:0,
              deals:[], dealsProgress:0, rare:null, rareProgress:0},
      adventurers_hall:{unlocked:true, expeditionSlots:[
        {champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},
        {champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null},
        {champId:null,areaId:null,type:null,startTime:null,totalMs:null,restUntil:null}
      ], expeditionLog:[]},
      arena:{unlocked:false, tab:'sparring', sparringSlots:[null,null,null], pendingGold:0, dailyCompleted:null, dailySeedYMD:null},
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
      offered:[],          // quests shown on the board
      active:[],           // array of active quests [{id, progress}]
      completed:[],        // ids of completed quests
      refreshProgress:0,   // seconds toward next quest refresh (4h)
      offeredRefresh:0,// timestamp of last refresh
    },
  },
  bestiary:{ entries:{}, areaCompletions:{} },
  sanctum:{ deckMods:{}, levelFloors:{}, unlockedCards:{} },
  shrineCounters:{ run_count:0, cards_played:0, cards_discarded:0, deaths:0, nodamage_clears:0, clutch_wins:0, fast_wins:0, debuffs_applied:0, area_level:0 },
  soulShards:0,          // gacha currency
  gems:{},               // {ruby:N, emerald:N, sapphire:N, ...} ascension currency
  champDupes:{},    // { champId: N } legacy — keeping for compat
  seenTutorials:{}, // { tutorialId: true } — tracks dismissed tutorials
  areaRuns:{},
};

// Round 63: snapshot the original PERSIST shape so createNewSave can
// deep-clone a fresh defaults state into PERSIST when minting a new
// slot. Captured here (immediately after the literal) so nothing has
// mutated it yet. _resetPersistToDefaults() reads from this.
_PERSIST_DEFAULTS_SNAPSHOT = JSON.parse(JSON.stringify(PERSIST));

function champPersistDefault(champId){
  var ch=CREATURES[champId];
  if(!ch) return null;
  return {
    level:1, xp:0, xpNext:80, xpTotal:0,
    stats:{str:ch.baseStats.str,agi:ch.baseStats.agi,wis:ch.baseStats.wis},
    alive:true, lastArea:null,
    relics:[],             // equipped relic IDs
    lockedExpedition:null, // slot index if on expedition, else null
    lockedForge:null,      // slot index if assigned to a forge slot, else null
    lockedShardWell:null,  // slot index (0/1/2) if assigned to the well, else null
    lockedArena:null,      // slot index (0/1/2) if sparring at the arena, else null
    ascensionTier:0,       // 0=base, 1=ruby, 2=emerald, etc.
    masteryXp:0,           // progress toward next ascension
  };
}
function getChampPersist(champId){
  if(!PERSIST.champions[champId]) PERSIST.champions[champId]=champPersistDefault(champId);
  // Migration for saves that predate lockedForge / lockedShardWell / lockedArena
  var cp = PERSIST.champions[champId];
  if(cp && cp.lockedForge     === undefined) cp.lockedForge     = null;
  if(cp && cp.lockedShardWell === undefined) cp.lockedShardWell = null;
  if(cp && cp.lockedArena     === undefined) cp.lockedArena     = null;
  return cp;
}

// ── Activity assignment & stat-fit model ─────────────────────────────────
// Generic lock check for any town activity (expedition, forge, shard well,
// future arena). Existing code paths still read cp.lockedExpedition directly
// — that's fine, these helpers are for new code that needs the union.
function isChampLocked(champId){
  var cp = PERSIST.champions[champId];
  if(!cp) return false;
  return (cp.lockedExpedition !== null && cp.lockedExpedition !== undefined)
      || (cp.lockedForge      !== null && cp.lockedForge      !== undefined)
      || (cp.lockedShardWell  !== null && cp.lockedShardWell  !== undefined)
      || (cp.lockedArena      !== null && cp.lockedArena      !== undefined);
}
function getChampLockLabel(champId){
  var cp = PERSIST.champions[champId];
  if(!cp) return null;
  if(cp.lockedExpedition !== null && cp.lockedExpedition !== undefined) return 'ON EXPEDITION';
  if(cp.lockedForge      !== null && cp.lockedForge      !== undefined) return 'AT THE FORGE';
  if(cp.lockedShardWell  !== null && cp.lockedShardWell  !== undefined) return 'AT THE SHARD WELL';
  if(cp.lockedArena      !== null && cp.lockedArena      !== undefined) return 'AT THE ARENA';
  return null;
}

// Activity stat-fit: each activity has a primary stat that's most relevant
// to it. The primary contributes at 100% efficiency, the other two at 25%.
//   Forge      → STR (heat, hammer, endurance)
//   Expedition → AGI (travel, scouting, foraging)
//   Arena      → WIS (reads opponents, picks bets) [future]
// Returns { speedBonus: 0..0.5, effectiveStat: number }.
// speedBonus is a fractional time-reduction (0.33 = 33% faster).
// Diminishing returns: bonus = eff / (eff + 100), capped at 0.5 so even
// a maxed champion can't trivialize craft times.
var ACTIVITY_PRIMARY_STAT = { forge:'STR', expedition:'AGI', arena:'WIS' };
var ACTIVITY_SECONDARY_WEIGHT = 0.25;

function champActivitySpeedBonus(champId, primaryStat){
  var cp = (typeof champId === 'string') ? getChampPersist(champId) : champId;
  if(!cp || !cp.stats) return { speedBonus:0, effectiveStat:0, primary:0, secondaryA:0, secondaryB:0 };
  var s = cp.stats;
  var primary, secondaryA, secondaryB;
  if(primaryStat === 'STR'){ primary = s.str; secondaryA = s.agi; secondaryB = s.wis; }
  else if(primaryStat === 'AGI'){ primary = s.agi; secondaryA = s.str; secondaryB = s.wis; }
  else { primary = s.wis; secondaryA = s.str; secondaryB = s.agi; }
  var eff = primary + (secondaryA + secondaryB) * ACTIVITY_SECONDARY_WEIGHT;
  var raw = eff / (eff + 100);
  return {
    speedBonus:    Math.min(0.5, raw),
    effectiveStat: eff,
    primary:       primary,
    secondaryA:    secondaryA,
    secondaryB:    secondaryB
  };
}

// Multi-champion variant. Each additional champion contributes with
// diminishing returns so a 3-champion roster is meaningfully better
// than 1 but not 3× better. Same speedBonus formula and 0.5 cap.
var ROSTER_WEIGHTS = [1.0, 0.7, 0.5, 0.4];

function rosterActivitySpeedBonus(champIds, primaryStat){
  var arr = (champIds||[]).filter(function(id){ return !!CREATURES[id]; });
  if(!arr.length) return { speedBonus:0, effectiveStat:0, count:0 };
  var eff = 0;
  for(var i=0;i<arr.length;i++){
    var fit = champActivitySpeedBonus(arr[i], primaryStat);
    eff += fit.effectiveStat * (ROSTER_WEIGHTS[i] || 0.4);
  }
  return {
    speedBonus:    Math.min(0.5, eff / (eff + 100)),
    effectiveStat: eff,
    count:         arr.length
  };
}

// ── Shard Well stat model (Round 40) ─────────────────────────────────────
// Different shape from the Forge/Expedition stat-fit because the well uses
// ALL THREE stats independently (each maps to a different building dial)
// and stacks across up to 3 slotted champions WITHOUT diminishing returns
// (a min-max player can stack 3 high-STR champs and feel it). The combined
// stats are then ranked: highest = primary (200% efficiency), middle =
// secondary (30%), lowest = tertiary (10%). Special case: when all three
// combined stats are exactly equal, all three get 100% efficiency (the
// "balanced is OP" reward for engineering a perfectly-balanced roster).
//   AGI → rate multiplier (faster ticks)
//   WIS → cap bonus       (more storage)
//   STR → XP multiplier   (well levels faster, earns stat points to spend)

function _combinedShardWellStats(champIds){
  var combined = {str:0, agi:0, wis:0};
  (champIds||[]).forEach(function(id){
    if(!CREATURES[id]) return;
    var cp = getChampPersist(id);
    if(!cp || !cp.stats) return;
    combined.str += cp.stats.str || 0;
    combined.agi += cp.stats.agi || 0;
    combined.wis += cp.stats.wis || 0;
  });
  return combined;
}

// Returns {str: eff, agi: eff, wis: eff} where each eff is in [0..2.0].
// Mode label included so the UI can show "STR-MODE" / "BALANCED" / etc.
function _shardWellEfficiency(combined){
  var s = combined.str || 0, a = combined.agi || 0, w = combined.wis || 0;

  // Special case: all three exactly equal (and non-zero) → balanced 100%.
  if(s === a && a === w){
    return { str:1.0, agi:1.0, wis:1.0, mode: s > 0 ? 'BALANCED' : 'EMPTY' };
  }

  // Sort by value desc to determine ranks
  var ranked = [
    {key:'str', val:s},
    {key:'agi', val:a},
    {key:'wis', val:w}
  ].sort(function(x,y){ return y.val - x.val; });

  var result = { str:0, agi:0, wis:0 };
  // Primary (rank 0): always 200%
  result[ranked[0].key] = 2.0;

  // Tied for top (rank 0 == rank 1): both at 200%, lowest at 10%
  if(ranked[0].val === ranked[1].val){
    result[ranked[1].key] = 2.0;
    result[ranked[2].key] = 0.10;
  }
  // Tied for bottom (rank 1 == rank 2): both at 25% (per J's spec)
  else if(ranked[1].val === ranked[2].val){
    result[ranked[1].key] = 0.25;
    result[ranked[2].key] = 0.25;
  }
  // Strict ranking: 200 / 30 / 10
  else {
    result[ranked[1].key] = 0.30;
    result[ranked[2].key] = 0.10;
  }

  // Mode label = which stat is dominant primary
  var primaryKey = ranked[0].val > 0 ? ranked[0].key : null;
  var mode = primaryKey === 'str' ? 'INVESTMENT'
           : primaryKey === 'agi' ? 'GENERATION'
           : primaryKey === 'wis' ? 'CAPACITY'
           : 'EMPTY';
  // Tied-top callout
  if(primaryKey && ranked[0].val === ranked[1].val) mode = 'DUAL';
  result.mode = mode;
  return result;
}

// Final per-stat effect on the well after applying baselines + efficiency.
// Each baseline uses the same eff/(eff+100) asymptote as the rest of the
// activity-stat model so curves are consistent across the game.
function champShardWellEffect(champIds){
  if(!champIds || !champIds.length){
    return { rateMult:1.0, capBonus:0, xpMult:1.0,
             combined:{str:0,agi:0,wis:0},
             eff:{str:0,agi:0,wis:0,mode:'EMPTY'} };
  }
  var combined = _combinedShardWellStats(champIds);
  var eff      = _shardWellEfficiency(combined);

  // Per-stat asymptotic baselines (shared shape with Forge/Expedition).
  // baselineRate / baselineXp approach 2.0 as combined stat → ∞.
  var baselineRate = 1 + combined.agi / (combined.agi + 100);
  var baselineXp   = 1 + combined.str / (combined.str + 100);
  var baselineCap  = combined.wis * 0.5;

  // Apply tiered efficiency to each baseline's BONUS portion.
  // At all-even (eff=1.0): xpMult = baseline (up to 2× at high stats).
  // At specialized (eff=2.0): xpMult = 1 + 2*(baseline-1) (up to 3× at high stats).
  var rateMult = 1 + (baselineRate - 1) * eff.agi;
  var xpMult   = 1 + (baselineXp   - 1) * eff.str;
  var capBonus = baselineCap * eff.wis;

  return {
    rateMult: rateMult,
    capBonus: Math.round(capBonus),
    xpMult:   xpMult,
    combined: combined,
    eff:      eff
  };
}

// XP needed to advance from level N to N+1. Triangle curve: each level
// costs (N * 50) XP. Lv1→2 = 50, Lv2→3 = 100, Lv5→6 = 250, etc.
// Tunable later when balance pass happens.
function getShardWellXpForLevel(level){
  return Math.max(50, level * 50);
}

// Triangle stat-point cost: Nth upgrade costs N points, so total cost to
// reach +N = N(N+1)/2. (Used by both rate and cap independently.)
function getShardWellPointCost(currentRank){
  return Math.max(1, currentRank + 1);
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

// Remove a relic from a slot by index. Destroyed by default; if the
// Adventurer's Backpack market upgrade is owned, the relic is returned
// to town inventory instead. Returns 'returned' | 'destroyed' | null.
function unequipRelic(champId, slotIdx){
  var cp = getChampPersist(champId);
  if(!cp || !cp.relics) return null;
  var relicId = cp.relics[slotIdx];
  if(!relicId) return null;
  cp.relics.splice(slotIdx, 1);
  var hasBackpack = PERSIST.town && PERSIST.town.hasBackpack;
  var outcome;
  if(hasBackpack){
    PERSIST.town.relics = PERSIST.town.relics || {};
    PERSIST.town.relics[relicId] = (PERSIST.town.relics[relicId]||0) + 1;
    outcome = 'returned';
  } else {
    outcome = 'destroyed';
  }
  savePersist();
  return outcome;
}

// Add gold to gs.goldEarned, applying any active gold-multiplier relic
// (Gambler's Coin sets gs._relicGoldMult). All gold-gain sites in combat
// should funnel through here so the multiplier composes consistently.
function _addCombatGold(gs, amount){
  if(!gs) return 0;
  var mult = gs._relicGoldMult || 1;
  amount = Math.round((amount||0) * mult);
  gs.goldEarned = (gs.goldEarned||0) + amount;
  return amount;
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

// ═══════════════════════════════════════════════════════
// ASCENSION SYSTEM
// ═══════════════════════════════════════════════════════

// Mastery requirements tuned (Round 30) so base→ruby is ~3 hours of mixed
// active-and-idle play. Combat is the steady drip; idle activities
// (expeditions / forge crafts / achievements) provide bigger lumps that
// gate higher tiers behind real-time waits. Per-active-minute, idle is
// always more efficient than combat — combat is paced for "while you
// wait for things" rather than "the path to ascension".
var ASCENSION_TIERS = [
  {tier:'ruby',      gem:'ruby',      masteryReq:250,   baseBonus:1, growthBonus:1},
  {tier:'emerald',   gem:'emerald',   masteryReq:700,   baseBonus:1, growthBonus:1},
  {tier:'sapphire',  gem:'sapphire',  masteryReq:1500,  baseBonus:2, growthBonus:1},
  {tier:'turquoise', gem:'turquoise', masteryReq:3000,  baseBonus:2, growthBonus:1},
  {tier:'amethyst',  gem:'amethyst',  masteryReq:6000,  baseBonus:2, growthBonus:2},
  {tier:'topaz',     gem:'topaz',     masteryReq:12000, baseBonus:3, growthBonus:2},
  {tier:'black_opal',gem:'black_opal',masteryReq:25000, baseBonus:3, growthBonus:2},
];

function getAscensionLevel(champId){
  var cp = getChampPersist(champId);
  return cp ? (cp.ascensionTier||0) : 0;
}

function getAscensionTierName(champId){
  var level = getAscensionLevel(champId);
  return level === 0 ? 'Base' : ASCENSION_TIERS[level-1].tier.charAt(0).toUpperCase() + ASCENSION_TIERS[level-1].tier.slice(1);
}

function getAscensionClass(champId){
  var level = getAscensionLevel(champId);
  if(level === 0) return '';
  return 'asc-' + ASCENSION_TIERS[level-1].tier;
}

function getAscensionChipHTML(champId){
  var level = getAscensionLevel(champId);
  if(level === 0) return '';
  var tier = ASCENSION_TIERS[level-1].tier;
  var label = tier.charAt(0).toUpperCase() + tier.slice(1).replace('_',' ');
  return '<span class="asc-tier-chip '+tier+'">'+label+'</span>';
}

function getMasteryXpRequired(champId){
  var level = getAscensionLevel(champId);
  if(level >= ASCENSION_TIERS.length) return Infinity;
  return ASCENSION_TIERS[level].masteryReq;
}

function addMasteryXp(champId, amount){
  var cp = getChampPersist(champId);
  if(!cp) return;
  cp.masteryXp = (cp.masteryXp||0) + amount;
  savePersist();
}

// Grant mastery to every unlocked champion. Used by town-wide events
// (achievement claims, certain quest rewards) where the source is not
// tied to a specific champion. Skips dojo_tiger and any unknown ids.
function addMasteryXpToAll(amount){
  if(!amount || amount <= 0) return;
  (PERSIST.unlockedChamps||[]).forEach(function(id){
    if(!CREATURES[id] || id === 'dojo_tiger') return;
    var cp = getChampPersist(id);
    if(cp) cp.masteryXp = (cp.masteryXp||0) + amount;
  });
  savePersist();
}

// Grant mastery to a specific roster (e.g. all champions on a completed
// expedition). Each champion gets the full amount — multi-champion
// expeditions are slower per individual mastery gain because the duration-
// scaled amount is the same regardless of party size.
function addMasteryXpToRoster(champIds, amount){
  if(!amount || amount <= 0 || !champIds) return;
  champIds.forEach(function(id){
    if(!CREATURES[id]) return;
    var cp = getChampPersist(id);
    if(cp) cp.masteryXp = (cp.masteryXp||0) + amount;
  });
  savePersist();
}

function canAscend(champId){
  var cp = getChampPersist(champId);
  if(!cp) return false;
  var level = cp.ascensionTier || 0;
  if(level >= ASCENSION_TIERS.length) return false;
  var tier = ASCENSION_TIERS[level];
  // Check mastery XP
  if((cp.masteryXp||0) < tier.masteryReq) return false;
  // Check gem
  if(!PERSIST.gems) return false;
  if((PERSIST.gems[tier.gem]||0) < 1) return false;
  return true;
}

function ascendChampion(champId){
  if(!canAscend(champId)){
    showTownToast('Cannot ascend — check requirements.');
    return false;
  }
  var cp = getChampPersist(champId);
  var level = cp.ascensionTier || 0;
  var tier = ASCENSION_TIERS[level];
  var ch = CREATURES[champId];
  if(!ch) return false;

  // Consume resources
  cp.masteryXp = (cp.masteryXp||0) - tier.masteryReq;
  PERSIST.gems[tier.gem] = (PERSIST.gems[tier.gem]||0) - 1;

  // Apply ascension
  cp.ascensionTier = level + 1;

  // Reset level to 1 but keep stats at new base
  cp.level = 1;
  cp.xp = 0;
  cp.xpNext = 80;

  // Bump base stats (permanent — applied to creature definition for this champion)
  cp.stats.str = ch.baseStats.str + tier.baseBonus * (level + 1);
  cp.stats.agi = ch.baseStats.agi + tier.baseBonus * (level + 1);
  cp.stats.wis = ch.baseStats.wis + tier.baseBonus * (level + 1);

  savePersist();
  showTownToast(ch.name + ' ascended to ' + tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1) + '!');
  return true;
}

function savePersist(){
  // Round 47: stamp every save with the current time so we can compute
  // offline elapsed on next load. Cheap (one Date.now() per save) and
  // means even an unclean tab-close gets a fresh timestamp from the
  // 5s idle tick savePersist call.
  // Round 63: persists to the active save slot (cetd_save_<id>) instead
  // of the legacy single cetd_v6 key. If no active save is set (e.g.
  // player on the login screen pre-selection), save is a no-op rather
  // than scribbling defaults into the legacy key.
  PERSIST.lastSeen = Date.now();
  var key = getCurrentSaveKey();
  if(!key) return;
  try{ localStorage.setItem(key, JSON.stringify(PERSIST)); }catch(e){}
}

// ═══════════════════════════════════════════════════════
// MULTI-SAVE MANAGEMENT (Round 63)
// ═══════════════════════════════════════════════════════
// Save model:
//   cetd_saves        → JSON array of { id, name, createdAt, lastPlayed }
//   cetd_active_save  → id of the save currently loaded into PERSIST
//   cetd_save_<id>    → serialized PERSIST blob for that save
// Legacy cetd_v6 is migrated once at startup into a fresh slot named "Save 1".

function getActiveSaveId(){
  try{ return localStorage.getItem(ACTIVE_SAVE_KEY) || null; }catch(e){ return null; }
}
function setActiveSaveId(id){
  try{ localStorage.setItem(ACTIVE_SAVE_KEY, id); }catch(e){}
}
function clearActiveSaveId(){
  try{ localStorage.removeItem(ACTIVE_SAVE_KEY); }catch(e){}
}
function getCurrentSaveKey(){
  var id = getActiveSaveId();
  return id ? (SAVE_PREFIX + id) : null;
}

function listSaves(){
  try{
    var raw = localStorage.getItem(SAVES_REGISTRY_KEY);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function writeSavesRegistry(arr){
  try{ localStorage.setItem(SAVES_REGISTRY_KEY, JSON.stringify(arr)); }catch(e){}
}
function getSaveMeta(id){
  return listSaves().find(function(s){ return s.id === id; }) || null;
}
function updateSaveMeta(id, patch){
  var arr = listSaves();
  for(var i=0;i<arr.length;i++){
    if(arr[i].id === id){
      arr[i] = Object.assign({}, arr[i], patch);
      writeSavesRegistry(arr);
      return arr[i];
    }
  }
  return null;
}

// Peek at a save's raw blob without loading it into PERSIST. Used by
// the login screen to render save cards (champion, gold, etc) without
// disturbing the currently-active save.
function peekSave(id){
  if(!id) return null;
  try{
    var raw = localStorage.getItem(SAVE_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

// Generate a unique save id. Uses Date.now plus a short random suffix
// so back-to-back saves don't collide.
function _newSaveId(){
  return 'sv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

// Create a brand-new save (empty PERSIST defaults). Adds to registry,
// writes an empty blob to localStorage, sets as active. Returns the
// new save's metadata.
function createNewSave(name){
  var id = _newSaveId();
  var trimmed = (name || '').trim() || ('Save ' + (listSaves().length + 1));
  var meta = { id: id, name: trimmed, createdAt: Date.now(), lastPlayed: Date.now() };
  var arr = listSaves();
  arr.push(meta);
  writeSavesRegistry(arr);
  setActiveSaveId(id);
  // Reset PERSIST to fresh defaults and write the empty blob so the
  // slot exists in storage. Also clear selectedChampId so the next
  // buildSelectScreen auto-picks from the fresh roster.
  _resetPersistToDefaults();
  PERSIST.playerName = trimmed;
  if(typeof selectedChampId !== 'undefined') selectedChampId = null;
  savePersist();
  return meta;
}

// Wipe PERSIST in-memory back to the original defaults declared above.
// Used by createNewSave and after deleting the active save.
function _resetPersistToDefaults(){
  PERSIST.unlockedChamps = ['druid','paladin','thief'];
  PERSIST.favoriteChamps = {};
  PERSIST.seenEnemies = [];
  PERSIST.gold = 50;
  PERSIST.metaCurrency = 0;
  PERSIST.achievements = {};
  PERSIST.champions = {};
  PERSIST.soulShards = 0;
  PERSIST.lastSeen = Date.now();
  PERSIST.playerName = '';
  // Deep-reset town to its initial-state literal. The cleanest way is to
  // restore PERSIST.town from a fresh snapshot — but the original
  // literal lives inline in the PERSIST declaration. We rely on
  // loadPersist's path of starting from in-memory defaults + overlay,
  // so here we restore the town defaults by cloning the original
  // structure. For now, the simplest correct thing is to rebuild town
  // by reading what loadPersist would set when given null. We achieve
  // that by parsing the freshly-stringified PERSIST shape captured at
  // module load.
  if(_PERSIST_DEFAULTS_SNAPSHOT){
    PERSIST.town = JSON.parse(JSON.stringify(_PERSIST_DEFAULTS_SNAPSHOT.town));
  }
}
// Snapshot the original PERSIST.town shape on script load so new
// saves can deep-clone it back as a fresh default.
var _PERSIST_DEFAULTS_SNAPSHOT = null;

// Delete a save. If it's the active one, clears active. Returns true
// on success.
function deleteSaveById(id){
  if(!id) return false;
  var arr = listSaves().filter(function(s){ return s.id !== id; });
  writeSavesRegistry(arr);
  try{ localStorage.removeItem(SAVE_PREFIX + id); }catch(e){}
  if(getActiveSaveId() === id) clearActiveSaveId();
  return true;
}

// Switch the active save: persists the current one, sets the new id
// active, reloads PERSIST from the new key. Used when the player
// picks a different save in the bottom-left dropdown.
function switchToSave(id){
  if(!id || getActiveSaveId() === id) return;
  // Save the currently-loaded slot first so its state is current
  if(getActiveSaveId()) savePersist();
  setActiveSaveId(id);
  loadPersist();
  // Reset transient module state that doesn't belong to either save.
  // selectedChampId was scoped to the old save's unlockedChamps; it
  // would dangle and confuse buildSelectScreen if left set.
  if(typeof selectedChampId !== 'undefined') selectedChampId = null;
  applyOfflineProgressWithDiff();
  updateSaveMeta(id, { lastPlayed: Date.now() });
}

// Migrate the legacy cetd_v6 single-save into a fresh slot named
// "Save 1". Runs once on first boot after Round 63. Idempotent — if
// the registry already has entries, this is a no-op. The legacy key
// is intentionally NOT removed so a player can roll back if needed.
function migrateLegacySaveIfNeeded(){
  if(listSaves().length > 0) return;
  var legacy;
  try{ legacy = localStorage.getItem(PERSIST_KEY); }catch(e){ legacy = null; }
  if(!legacy) return;
  var id = _newSaveId();
  try{ localStorage.setItem(SAVE_PREFIX + id, legacy); }catch(e){ return; }
  writeSavesRegistry([{ id: id, name: 'Save 1', createdAt: Date.now(), lastPlayed: Date.now(), migrated: true }]);
  setActiveSaveId(id);
  console.log('[Migration] Legacy save cetd_v6 → slot', id);
}

// ── Offline-progress with diff capture ──────────────────────────
// Captures a snapshot of relevant fields BEFORE applyOfflineProgress
// runs, then computes the diff after so the login card can show
// "while you were away" and the shard well panel can animate its
// XP bar up.
//
// Round 63 followup: simplified login-card content to duration +
// shards + expeditions + quests. Vault/well XP details stay in the
// gains object — the shard well's XP bar animates them on panel
// open (visceral feedback beats a text row on the login card).
var _offlineGains = null;
function applyOfflineProgressWithDiff(){
  // Capture elapsed BEFORE applyOfflineProgress mutates PERSIST.lastSeen.
  var elapsedSec = 0;
  if(typeof PERSIST.lastSeen === 'number'){
    elapsedSec = Math.max(0, Math.floor((Date.now() - PERSIST.lastSeen) / 1000));
  }
  if(typeof OFFLINE_CAP_SEC === 'number'){
    elapsedSec = Math.min(elapsedSec, OFFLINE_CAP_SEC);
  }
  var snap = _captureOfflineSnap();
  if(typeof applyOfflineProgress === 'function') applyOfflineProgress();
  _offlineGains = _diffOfflineSnap(snap);
  _offlineGains.elapsedSec = elapsedSec;
  _offlineGains.wellAnimated = false; // toggled true once the well-XP animation has played
}
function _captureOfflineSnap(){
  var b = (PERSIST.town && PERSIST.town.buildings) || {};
  var well = b.shard_well || {};
  var ahall = b.adventurers_hall || {};
  var quests = (PERSIST.town && PERSIST.town.quests) || {};
  return {
    soulShards:    PERSIST.soulShards || 0,
    wellXp:        well.wellXp || 0,
    wellLevel:     well.wellLevel || 1,
    pendingShards: well.pendingShards || 0,
    questsOffered: (quests.offered || []).length,
    expReadyCount: ((ahall.expeditionSlots || []).filter(function(s){
      return s && s.champId && s.startTime && s.totalMs && (Date.now() >= s.startTime + s.totalMs);
    })).length,
  };
}
function _diffOfflineSnap(before){
  var after = _captureOfflineSnap();
  return {
    pendingShards:   Math.max(0, after.pendingShards - before.pendingShards),
    wellXpBefore:    before.wellXp,
    wellLevelBefore: before.wellLevel,
    wellXpAfter:     after.wellXp,
    wellLevelAfter:  after.wellLevel,
    expReady:        after.expReadyCount,        // absolute, not delta — count of ready expeditions
    questsOffered:   Math.max(0, after.questsOffered - before.questsOffered),
  };
}
function getOfflineGains(){ return _offlineGains; }

// Round 63: human-readable elapsed-seconds formatter used by the
// "Away for X" line on the login card. Caps were enforced earlier
// (OFFLINE_CAP_SEC = 12h) so the longest string we'll emit is "12h".
function _formatAwayDuration(seconds){
  if(seconds < 60)   return 'less than a minute';
  if(seconds < 3600){
    var m = Math.floor(seconds / 60);
    return m + ' minute' + (m === 1 ? '' : 's');
  }
  var h = Math.floor(seconds / 3600);
  var mins = Math.floor((seconds % 3600) / 60);
  if(mins === 0) return h + ' hour' + (h === 1 ? '' : 's');
  return h + 'h ' + mins + 'm';
}

// ═══════════════════════════════════════════════════════
// ASSET PRELOADER  (Round 63)
// ═══════════════════════════════════════════════════════
// Minimal critical-path preload — anything the login screen + first
// gameplay seconds will reach for. Most game art lazy-loads fine
// (creature sprites paint as cards mount); we only pre-warm the
// things that would visibly stutter otherwise.
//
// Asset list intentionally short — add more here when something
// visibly pops in late (a flashing icon, a missing portrait on
// first frame). Don't pre-load EVERYTHING — that's wasted bytes.
function _buildPreloadList(){
  var list = [];
  // Music — these are big and fade-in benefits from being ready.
  list.push({ kind:'audio', src:'assets/audio/music/menu_theme.mp3'  });
  list.push({ kind:'audio', src:'assets/audio/music/theme_town.mp3'  });
  // Backgrounds for the login screen (texture) + early gameplay.
  list.push({ kind:'image', src:'assets/backgrounds/texture.png'      });
  // Icons that show in the nav from the very first frame after login.
  list.push({ kind:'image', src:'assets/icons/gold.png'                });
  list.push({ kind:'image', src:'assets/icons/soul_shard.png'          });
  list.push({ kind:'image', src:'assets/icons/soul_shard_small.png'    });
  // Active save's champion sprite (for the login card) — best-effort.
  var actId = getActiveSaveId();
  if(actId){
    var data = peekSave(actId);
    var champ = _pickSaveChampionId(data);
    if(champ) list.push({ kind:'image', src:'assets/creatures/' + champ + '.png' });
  }
  return list;
}

// Run the preload list. Each asset reports back via load/error; we
// don't care which (errors still resolve so a missing optional asset
// doesn't block the loader). barEl + statusEl are the DOM elements
// to update during loading. Calls `done` when every item finished.
function preloadAssets(barEl, statusEl, done){
  var list = _buildPreloadList();
  var total = list.length;
  if(total === 0){ if(done) done(); return; }
  var completed = 0;
  function bump(label){
    completed++;
    if(barEl) barEl.style.width = Math.round((completed/total)*100) + '%';
    if(statusEl) statusEl.textContent = label || ('Loading… ' + completed + '/' + total);
    if(completed >= total){ if(done) setTimeout(done, 200); }
  }
  list.forEach(function(asset){
    if(asset.kind === 'image'){
      var img = new Image();
      img.onload = function(){  bump('Loaded ' + _shortAssetName(asset.src)); };
      img.onerror = function(){ bump('Skipped ' + _shortAssetName(asset.src)); };
      img.src = asset.src;
    } else if(asset.kind === 'audio'){
      var a = new Audio();
      a.preload = 'auto';
      a.oncanplaythrough = function(){ bump('Loaded ' + _shortAssetName(asset.src)); };
      a.onerror          = function(){ bump('Skipped ' + _shortAssetName(asset.src)); };
      a.src = asset.src;
      // Some browsers won't fire oncanplaythrough without an explicit
      // load() call when src is set post-construct.
      try{ a.load(); }catch(e){}
      // Safety net: if neither event fires in 5s, count it as done.
      setTimeout(function(){ if(!a.__counted){ a.__counted=true; bump('Timed out ' + _shortAssetName(asset.src)); } }, 5000);
      a.addEventListener('canplaythrough', function(){ if(!a.__counted){ a.__counted=true; } }, { once:true });
      a.addEventListener('error',          function(){ if(!a.__counted){ a.__counted=true; } }, { once:true });
    } else {
      bump();
    }
  });
}
function _shortAssetName(src){
  var i = src.lastIndexOf('/');
  return i >= 0 ? src.slice(i+1) : src;
}

// Helper: pick a "representative" champion from a save's PERSIST blob
// for the login-card portrait. Prefers the most recently selected /
// highest-level champion; falls back to the first unlocked.
function _pickSaveChampionId(data){
  if(!data) return null;
  // Highest XP first — feels like "the champ you've been playing"
  var champs = data.champions || {};
  var unlocked = (data.unlockedChamps || []).filter(function(id){ return CREATURES[id]; });
  if(!unlocked.length) return null;
  var best = unlocked[0], bestScore = -1;
  unlocked.forEach(function(id){
    var cp = champs[id];
    var score = cp ? ((cp.level||1)*1000 + (cp.xpTotal||0)) : 0;
    if(score > bestScore){ bestScore = score; best = id; }
  });
  return best;
}

// ═══════════════════════════════════════════════════════
// LOGIN SCREEN  (Round 63)
// ═══════════════════════════════════════════════════════

// Show the login screen. Hides nav, switches the .active screen,
// kicks off the menu music, and paints the card based on the
// current active save (if any).
function showLoginScreen(){
  showNav(false);
  showScreen('login-screen');
  // Music: menu theme is the right vibe for the title screen.
  if(typeof playMusic === 'function') playMusic('menu_theme');
  buildLoginScreen();
}

function buildLoginScreen(){
  var verEl = document.getElementById('login-version');
  if(verEl) verEl.textContent = (typeof GAME_VERSION === 'string' ? GAME_VERSION : '');

  var saves = listSaves();
  var activeId = getActiveSaveId();
  // If active id no longer exists in registry, clear it.
  if(activeId && !saves.find(function(s){ return s.id === activeId; })){
    clearActiveSaveId();
    activeId = null;
  }

  var card = document.getElementById('login-card');
  if(!card) return;

  if(saves.length === 0 || !activeId){
    // No save (or just created and not selected) — show new-save form.
    card.classList.add('empty');
    card.innerHTML = _renderNewSaveForm();
    setTimeout(function(){
      var input = document.getElementById('login-newsave-input');
      if(input) input.focus();
    }, 50);
  } else {
    card.classList.remove('empty');
    card.innerHTML = _renderSaveCard(activeId);
  }

  // Saves menu (closed by default on every rebuild)
  _renderSavesMenu();
  var menu = document.getElementById('login-saves-menu');
  if(menu) menu.style.display = 'none';
  var btn = document.getElementById('login-saves-toggle');
  if(btn) btn.classList.remove('open');
}

function _renderNewSaveForm(){
  var existingCount = listSaves().length;
  var headline = existingCount > 0 ? 'NEW SAVE' : 'WELCOME, ADVENTURER';
  var tagline  = existingCount > 0
    ? 'Name a fresh save to begin a new run.'
    : 'Name yourself, and the road opens.';
  return ''
    + '<div class="login-newsave-hdr">' + headline + '</div>'
    + '<div class="login-newsave-tag">' + tagline + '</div>'
    + '<input id="login-newsave-input" class="login-newsave-input" type="text" maxlength="24" placeholder="Your name" '
    +   'onkeydown="if(event.key===\'Enter\')_loginCreateNewSave();">'
    + '<div class="login-newsave-hint">Press Enter or click Begin.</div>'
    + '<div class="login-card-actions">'
    +   (existingCount > 0
        ? '<button class="login-continue" style="background:linear-gradient(180deg,#1e1408,#120802);border-color:#5a3a18;color:#7a6030;" onclick="_loginCancelNewSave()">CANCEL</button>'
        : '')
    +   '<button class="login-continue" onclick="_loginCreateNewSave()">BEGIN ►</button>'
    + '</div>';
}

function _renderSaveCard(saveId){
  var meta = getSaveMeta(saveId) || {};
  var data = peekSave(saveId) || {};
  var champId = _pickSaveChampionId(data);
  var champ = champId ? CREATURES[champId] : null;
  var cp = (data.champions && champId) ? data.champions[champId] : null;
  var champCount = (data.unlockedChamps || []).filter(function(id){ return CREATURES[id]; }).length;
  var gold = data.gold || 0;
  var shards = data.soulShards || 0;

  // Portrait — fall back to a "?" plaque if no champion / sprite.
  var portrait;
  if(champId){
    portrait = '<img src="assets/creatures/'+champId+'.png" class="flip-x" onerror="this.outerHTML=\'<span style=&quot;font-size:64px;&quot;>'+ (champ ? champ.icon : '?') +'</span>\'">';
  } else {
    portrait = '<span style="font-size:64px;color:#5a4020;">?</span>';
  }

  // Champion line (only when we actually have one)
  var champLine = '';
  if(champ && cp){
    champLine = champ.name.toUpperCase() + ' · Lv. ' + (cp.level || 1);
  } else if(champ){
    champLine = champ.name.toUpperCase();
  } else {
    champLine = 'No champion yet';
  }

  var stats = ''
    + '<div class="login-card-stat"><span class="login-card-stat-label">CHAMPS</span> ' + champCount + '</div>'
    + '<div class="login-card-stat"><span class="login-card-stat-label">GOLD</span> ' + (typeof goldImgHTML==='function' ? goldImgHTML('16px') : '✦') + ' ' + gold + '</div>'
    + '<div class="login-card-stat"><span class="login-card-stat-label">SHARDS</span> ' + (typeof soulShardImgHTML==='function' ? soulShardImgHTML('16px') : '🔮') + ' ' + shards + '</div>';

  var awayHtml = _renderWhileAwayBlock();

  return ''
    + '<div class="login-card-body">'
    +   '<div class="login-card-portrait">' + portrait + '</div>'
    +   '<div class="login-card-info">'
    +     '<div class="login-card-name">' + (meta.name || 'Save') + '</div>'
    +     '<div class="login-card-sub">' + champLine + '</div>'
    +     '<div class="login-card-stats">' + stats + '</div>'
    +     awayHtml
    +   '</div>'
    + '</div>'
    + '<div class="login-card-actions">'
    +   '<button class="login-continue" onclick="enterGameFromLogin()">CONTINUE ►</button>'
    + '</div>';
}

function _renderWhileAwayBlock(){
  var g = getOfflineGains();
  if(!g) return '';

  // Round 63 followup: card focuses on duration + shards. Vault / well
  // XP gains aren't listed here — those animate on the Shard Well's
  // own XP bar when the panel opens (more visceral than a text row).
  // Expeditions and quests still listed because they're actionable
  // signals ("things are ready for you").
  var awayDur  = (g.elapsedSec >= 60) ? _formatAwayDuration(g.elapsedSec) : null;
  var hasShards = g.pendingShards > 0;
  var hasExp    = g.expReady > 0;
  var hasQuests = g.questsOffered > 0;
  if(!awayDur && !hasShards && !hasExp && !hasQuests) return '';

  var rows = [];
  if(awayDur){
    rows.push('<div class="login-card-away-row login-card-away-duration">Away for <span class="dur">' + awayDur + '</span></div>');
  }
  if(hasShards){
    var icon = (typeof soulShardImgHTML === 'function') ? soulShardImgHTML('16px') : '🔮';
    rows.push('<div class="login-card-away-row"><span class="delta">+' + g.pendingShards + '</span> ' + icon + ' ready to claim</div>');
  }
  if(hasExp){
    rows.push('<div class="login-card-away-row"><span class="delta">' + g.expReady + '</span> expedition' + (g.expReady>1?'s':'') + ' ready</div>');
  }
  if(hasQuests){
    rows.push('<div class="login-card-away-row"><span class="delta">+' + g.questsOffered + '</span> new quest' + (g.questsOffered>1?'s':'') + ' on the board</div>');
  }
  return ''
    + '<div class="login-card-away">'
    +   '<div class="login-card-away-hdr">WHILE YOU WERE AWAY</div>'
    +   '<div class="login-card-away-rows">' + rows.join('') + '</div>'
    + '</div>';
}

function _renderSavesMenu(){
  var menu = document.getElementById('login-saves-menu');
  if(!menu) return;
  var saves = listSaves();
  var activeId = getActiveSaveId();

  // Sort by lastPlayed desc so the most recent save is at the top.
  saves = saves.slice().sort(function(a,b){ return (b.lastPlayed||0) - (a.lastPlayed||0); });

  var rows = saves.map(function(s){
    var data = peekSave(s.id) || {};
    var champId = _pickSaveChampionId(data);
    var champ = champId ? CREATURES[champId] : null;
    var cp = (data.champions && champId) ? data.champions[champId] : null;
    var portrait = champId
      ? '<img src="assets/creatures/'+champId+'.png" class="flip-x" onerror="this.outerHTML=\'<span style=&quot;font-size:22px;&quot;>'+ (champ ? champ.icon : '?') +'</span>\'">'
      : '<span style="font-size:22px;color:#5a4020;">?</span>';
    var subLine = champ
      ? champ.name + (cp ? ' · Lv.' + (cp.level||1) : '')
      : 'Fresh save';
    var cls = 'login-save-row' + (s.id === activeId ? ' active' : '');
    return ''
      + '<div class="' + cls + '" onclick="_loginPickSave(\'' + s.id + '\')">'
      +   '<div class="login-save-portrait">' + portrait + '</div>'
      +   '<div class="login-save-info">'
      +     '<div class="login-save-name">' + s.name + '</div>'
      +     '<div class="login-save-sub">' + subLine + '</div>'
      +   '</div>'
      +   '<button class="login-save-delete" title="Delete this save" onclick="event.stopPropagation();_loginDeleteSave(\'' + s.id + '\')">✕</button>'
      + '</div>';
  }).join('');

  var newBtn = ''
    + '<div class="login-save-newbtn" onclick="_loginStartNewSave()">'
    +   '<span class="login-save-newbtn-plus">+</span>'
    +   '<span>NEW SAVE</span>'
    + '</div>';

  menu.innerHTML = rows + newBtn;
}

function toggleLoginSavesMenu(){
  var menu = document.getElementById('login-saves-menu');
  var btn = document.getElementById('login-saves-toggle');
  if(!menu || !btn) return;
  var open = menu.style.display !== 'none';
  if(open){
    menu.style.display = 'none';
    btn.classList.remove('open');
  } else {
    _renderSavesMenu();
    menu.style.display = '';
    btn.classList.add('open');
  }
}

// Picked a save from the dropdown — switch to it and refresh card.
function _loginPickSave(id){
  if(!id) return;
  switchToSave(id);
  buildLoginScreen();
}

// Delete from the dropdown. Confirms with a quick window.confirm —
// the destructive zone in Settings is the more elaborate path.
function _loginDeleteSave(id){
  var meta = getSaveMeta(id);
  var name = meta ? meta.name : 'this save';
  if(!confirm('Delete "' + name + '" permanently? This cannot be undone.')) return;
  var wasActive = (getActiveSaveId() === id);
  deleteSaveById(id);
  if(wasActive){
    // If the active save was deleted, switch to the most recent
    // remaining save (if any).
    var rest = listSaves();
    if(rest.length){
      var next = rest.slice().sort(function(a,b){ return (b.lastPlayed||0)-(a.lastPlayed||0); })[0];
      switchToSave(next.id);
    } else {
      _resetPersistToDefaults();
      _offlineGains = null;
    }
  }
  buildLoginScreen();
}

// Open the new-save form in the main card area (keeps existing
// saves intact, just shows the input). User clicks BEGIN to commit.
function _loginStartNewSave(){
  var card = document.getElementById('login-card');
  if(!card) return;
  card.classList.add('empty');
  card.innerHTML = _renderNewSaveForm();
  setTimeout(function(){
    var input = document.getElementById('login-newsave-input');
    if(input) input.focus();
  }, 50);
  // Close dropdown
  var menu = document.getElementById('login-saves-menu');
  if(menu) menu.style.display = 'none';
  var btn = document.getElementById('login-saves-toggle');
  if(btn) btn.classList.remove('open');
}

function _loginCreateNewSave(){
  var input = document.getElementById('login-newsave-input');
  var name = input ? input.value : '';
  createNewSave(name);
  _offlineGains = null; // fresh save has no offline progress
  buildLoginScreen();
}

function _loginCancelNewSave(){
  // Back to the current active save's card
  buildLoginScreen();
}

// Click CONTINUE from the active save card — boot into the game.
function enterGameFromLogin(){
  // Defensive: if somehow there's no active save, fall back to new-save form.
  if(!getActiveSaveId()){
    _loginStartNewSave();
    return;
  }
  // Update lastPlayed stamp for this save
  updateSaveMeta(getActiveSaveId(), { lastPlayed: Date.now() });
  showNav(true);
  showScreen('select-screen');
  if(typeof buildSelectScreen === 'function') buildSelectScreen();
  if(typeof updateNavBar === 'function') updateNavBar('adventure');
  if(typeof checkBestiaryAutoUnlock === 'function') checkBestiaryAutoUnlock();
  if(typeof restoreQuestBadge === 'function') restoreQuestBadge();
}

// Round 47: offline progress catch-up. Reads PERSIST.lastSeen (set by
// savePersist) and runs each idle tick once with the elapsed seconds.
// Capped at OFFLINE_CAP_SEC (12h — matches the longest base shard-well
// fill so an overnight idle gets a full cap window).
//
// Ticks that take a `seconds` arg: vault, market, bestiary, shard_well,
// quest — these accumulate state proportional to elapsed time.
// Ticks that don't: forge, expedition — they read absolute Date.now()
// timestamps for their own internal timing and need no catch-up.
//
// First-run / pre-Round-47 saves: lastSeen will be missing. We stamp
// it without granting any progress so the player isn't surprised by a
// gigantic dump on first load after updating.
var OFFLINE_CAP_SEC = 12 * 3600;
function applyOfflineProgress(){
  if(typeof PERSIST.lastSeen !== 'number'){
    PERSIST.lastSeen = Date.now();
    return;
  }
  var nowMs = Date.now();
  var elapsedSec = Math.max(0, Math.floor((nowMs - PERSIST.lastSeen) / 1000));
  PERSIST.lastSeen = nowMs;
  // Floor: don't bother for sub-minute gaps (tab refresh, quick reload).
  if(elapsedSec < 60) return;
  elapsedSec = Math.min(elapsedSec, OFFLINE_CAP_SEC);

  if(typeof vaultTick      === 'function') vaultTick(elapsedSec);
  if(typeof marketTick     === 'function') marketTick(elapsedSec);
  if(typeof bestiaryTick   === 'function') bestiaryTick(elapsedSec);
  if(typeof shardWellTick  === 'function') shardWellTick(elapsedSec);
  if(typeof arenaTick      === 'function') arenaTick(elapsedSec);
  if(typeof questTick      === 'function') questTick(elapsedSec);
}
function loadPersist(){
  try{
    // Round 63: read from the active save slot. Falls back to the legacy
    // cetd_v6 key so loads work during the first boot after the
    // migration helper runs, AND so a future re-introduction of single-
    // save mode would still find the data.
    var key = getCurrentSaveKey() || PERSIST_KEY;
    var p=JSON.parse(localStorage.getItem(key)||'null');
    if(p){
      PERSIST.unlockedChamps=p.unlockedChamps||['druid','paladin','thief'];
      PERSIST.favoriteChamps = (p.favoriteChamps && typeof p.favoriteChamps === 'object') ? p.favoriteChamps : {};
      PERSIST.playerName = (typeof p.playerName === 'string') ? p.playerName : '';
      // Round 62 migration: scrub any unimplemented stub champs that
      // were rollable from a pre-fix gacha pool. Refund 100 soul shards
      // each (single-pull cost) so the player gets a re-roll. Guarded
      // by p._stubCleanupV1 so it runs once per save.
      if(typeof UNIMPLEMENTED_CHAMPS === 'object' && !p._stubCleanupV1){
        var _stripped = [];
        PERSIST.unlockedChamps = PERSIST.unlockedChamps.filter(function(cid){
          if(UNIMPLEMENTED_CHAMPS[cid]){ _stripped.push(cid); return false; }
          return true;
        });
        if(_stripped.length){
          // Refund + scrub any champion record so the slot is clean
          // for a future re-pull when the kit lands.
          var refund = _stripped.length * 100;
          PERSIST.soulShards = (PERSIST.soulShards || 0) + refund;
          _stripped.forEach(function(cid){
            if(PERSIST.champions && PERSIST.champions[cid]) delete PERSIST.champions[cid];
          });
          console.log('[Migration] Removed unimplemented champ(s): '+_stripped.join(', ')+'. Refunded '+refund+' soul shards.');
          PERSIST._stubRefundPending = { ids: _stripped, shards: refund };
        }
        PERSIST._stubCleanupV1 = true;
        // Persist immediately so a quick refresh doesn't re-run the
        // strip/refund pair (it's idempotent but persisting nails it
        // down regardless).
        try{ localStorage.setItem(PERSIST_KEY, JSON.stringify(PERSIST)); }catch(e){}
      }
      PERSIST.seenEnemies=p.seenEnemies||[];
      PERSIST.gold=p.gold!=null?p.gold:50;
      PERSIST.metaCurrency=p.metaCurrency||0;
      PERSIST.achievements=p.achievements||{};
      PERSIST.champions=p.champions||{};
      PERSIST.townUnlocked=true; // town always visible now
      // Round 51 fix: restore lastSeen so applyOfflineProgress can
      // compute elapsed against the previous session's final save.
      // Round 47 added the write (savePersist) and the read
      // (applyOfflineProgress) but forgot the restore here — meaning
      // every page reload saw `PERSIST.lastSeen` reset to undefined,
      // applyOfflineProgress hit the "first-run, stamp now, grant
      // nothing" branch, and offline progress silently never fired.
      if(typeof p.lastSeen === 'number') PERSIST.lastSeen = p.lastSeen;
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
        if(p.town.quests){
          PERSIST.town.quests=Object.assign({offered:[],active:[],completed:[],refreshProgress:0,offeredRefresh:0},p.town.quests);
          // Migrate old single-quest format
          if(PERSIST.town.quests.active && !Array.isArray(PERSIST.town.quests.active)){
            PERSIST.town.quests.active = PERSIST.town.quests.active ? [PERSIST.town.quests.active] : [];
          }
          if(!PERSIST.town.quests.active) PERSIST.town.quests.active = [];
        }
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
        // Round 48: Arena gained tab state + sparring slots + daily fields.
        // Round 49: stripped rate/cap/points fields.
        // Round 54: sparringSlots schema changed — slot entries are now
        // session OBJECTS (champId, purse, startTime, lastBetTime, wins,
        // losses) instead of bare champion-id strings. Old slot entries
        // (strings or null) are migrated below: strings get wrapped into
        // a fresh session, nulls stay null.
        if(p.town.buildings&&p.town.buildings.arena){
          PERSIST.town.buildings.arena=Object.assign(
            {unlocked:false, tab:'sparring', sparringSlots:[null,null,null], pendingGold:0, dailyCompleted:null, dailySeedYMD:null},
            p.town.buildings.arena
          );
          // Defensive: ensure sparringSlots is always a 3-array
          var arenaB = PERSIST.town.buildings.arena;
          if(!Array.isArray(arenaB.sparringSlots) || arenaB.sparringSlots.length !== 3){
            arenaB.sparringSlots = [null,null,null];
          }
          // Round 54 migration: wrap legacy string entries into session objects.
          for(var asi=0; asi<3; asi++){
            var entry = arenaB.sparringSlots[asi];
            if(typeof entry === 'string'){
              arenaB.sparringSlots[asi] = {
                champId: entry,
                purse: 100,                  // legacy slot gets a fresh stake
                startTime: Date.now(),
                lastBetTime: Date.now(),
                wins: 0, losses: 0
              };
            }
          }
        }
        if(p.town.buildings&&p.town.buildings.shard_well){
          PERSIST.town.buildings.shard_well=Object.assign({unlocked:false,slottedCard:null,shardAcc:0,assignedChampIds:[],wellXp:0,wellLevel:1,unspentPoints:0,rateLevel:0,capLevel:0,masteryAcc:0,pendingShards:0},p.town.buildings.shard_well);
          // Defensive: ensure assignedChampIds is always an array
          if(!Array.isArray(PERSIST.town.buildings.shard_well.assignedChampIds)){
            PERSIST.town.buildings.shard_well.assignedChampIds = [];
          }
        }
      }
      if(p.bestiary){ PERSIST.bestiary=Object.assign({research:{},researchAcc:0},p.bestiary); }
      if(p.sanctum){ PERSIST.sanctum=Object.assign({deckMods:{},levelFloors:{},unlockedCards:{}},p.sanctum); }
      if(p.shrineCounters) PERSIST.shrineCounters=Object.assign({run_count:0,cards_played:0,cards_discarded:0,deaths:0,nodamage_clears:0,clutch_wins:0,fast_wins:0,debuffs_applied:0,area_level:0},p.shrineCounters);
      if(typeof p.soulShards==='number') PERSIST.soulShards=p.soulShards;
      if(p.champDupes) PERSIST.champDupes=Object.assign({},p.champDupes);
      if(p.gems) PERSIST.gems=Object.assign({},p.gems);
      // Migrate champion ascension fields
      if(p.seenTutorials) PERSIST.seenTutorials=Object.assign({},p.seenTutorials);
      if(p.areaRuns) PERSIST.areaRuns=p.areaRuns;
      // Force informational buildings always unlocked
      PERSIST.town.buildings.vault.unlocked = true;
      PERSIST.town.buildings.adventurers_hall.unlocked = true;
      PERSIST.town.buildings.bestiary.unlocked = true;
      PERSIST.town.buildings.market.unlocked = true;

      // ─── DEV: UNLOCK ALL BUILDINGS (Round 37) ────────────────────
      // Temporary blanket unlock until we redesign building-unlock
      // pacing. Flip DEV_UNLOCK_ALL_BUILDINGS to false (or just
      // delete this block) before shipping. Idempotent — runs every
      // load, just flips false → true on whatever's still gated.
      if(DEV_UNLOCK_ALL_BUILDINGS && PERSIST.town && PERSIST.town.buildings){
        Object.keys(PERSIST.town.buildings).forEach(function(id){
          var b = PERSIST.town.buildings[id];
          if(b) b.unlocked = true;
        });
        PERSIST.townUnlocked = true;
      }
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

// Round 62: champion rarity rebuilt to match the project's existing
// 7-tier gem palette (Ruby → Emerald → Sapphire → Turquoise →
// Amethyst → Topaz → Black Opal — the same R/G/B/C/M/Y/K colour
// sequence used by the ascension chips). The old common/uncommon/
// rare/legendary buckets were a legacy carry-over from a generic
// gacha sketch and didn't speak the project's visual language.
//
// Per-creature `rarity:` field on a creature file (data/creatures/*.js)
// wins if set, so designer intent can override the heuristic. Otherwise
// we score by base power = sum(baseStats) + sum(growth)*5, which
// preserves the principle that stronger creatures are rarer while
// also giving growth-heavy designs proper weight (a champion with
// modest base stats but huge growth scales bigger than one with
// front-loaded stats and no growth — the score should reflect that).
//
// bossOnly always lands at black_opal regardless of stats — those
// are pinnacle encounters and the rarity should signal it.
var CHAMP_RARITY_TIERS = ['ruby','emerald','sapphire','turquoise','amethyst','topaz','black_opal'];
// Score thresholds (upper bound of each bucket; black_opal is the catch-all)
var CHAMP_RARITY_THRESH = {
  ruby:       49,
  emerald:    54,
  sapphire:   60,
  turquoise:  75,
  amethyst:  100,
  topaz:     130,
  // black_opal: no upper bound — anything 131+ or bossOnly lands here
};

function getCreaturePowerScore(e){
  if(!e) return 0;
  var bs = e.baseStats || {str:10, agi:10, wis:10};
  var g  = e.growth    || {str:1,  agi:1,  wis:1};
  return (bs.str||0)+(bs.agi||0)+(bs.wis||0) + ((g.str||0)+(g.agi||0)+(g.wis||0))*5;
}

function getCreatureRarity(e){
  if(!e) return 'ruby';
  // Explicit override: creature file may set `rarity:'amethyst'` etc.
  if(e.rarity && CHAMP_RARITY_THRESH.hasOwnProperty(e.rarity)) return e.rarity;
  if(e.rarity === 'black_opal') return 'black_opal';
  if(e.bossOnly) return 'black_opal';
  var score = getCreaturePowerScore(e);
  if(score <= CHAMP_RARITY_THRESH.ruby)      return 'ruby';
  if(score <= CHAMP_RARITY_THRESH.emerald)   return 'emerald';
  if(score <= CHAMP_RARITY_THRESH.sapphire)  return 'sapphire';
  if(score <= CHAMP_RARITY_THRESH.turquoise) return 'turquoise';
  if(score <= CHAMP_RARITY_THRESH.amethyst)  return 'amethyst';
  if(score <= CHAMP_RARITY_THRESH.topaz)     return 'topaz';
  return 'black_opal';
}

// Round 62: Centralized stub list — creatures that exist in the data
// dir but have no playable cards (their `deck` field references card
// IDs that aren't defined in cards.js). These are work-in-progress
// kits that shouldn't be rollable from the summoning pool until they
// have a full card set + innate hook implemented. Also used as a
// migration filter in loadPersist to strip any stubs already in a
// player's unlockedChamps from a pre-fix pull.
var UNIMPLEMENTED_CHAMPS = { 'plagued_one': true, 'smuggler': true };

function buildGachaPool(){
  // All creatures in pool — exclude special unplayable boss encounters
  // and any work-in-progress stub kits (see UNIMPLEMENTED_CHAMPS).
  var excluded = Object.assign({'waxoasis':true}, UNIMPLEMENTED_CHAMPS);
  var allIds=Object.keys(CREATURES).filter(function(id){return !excluded[id];});
  return allIds.map(function(id){
    var e=CREATURES[id];
    var rarity=getCreatureRarity(e);
    return {
      id:id,
      rarity:rarity,
      seen:true, // always visible
      // Round 62: tier weights in percent — must sum to 100. The
      // doEternalPull roll uses these for the random pick. Per-tier
      // weight stored on the pool entry too for future per-creature
      // tuning (rare-but-special creatures could break out of their
      // tier's flat weight).
      weight:{ruby:35,emerald:25,sapphire:18,turquoise:12,amethyst:7,topaz:2.5,black_opal:0.5}[rarity]||10,
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
function calcMaxMana(wis){ return wis*5; }
function calcManaRegen(wis){ return Math.round(wis*0.8+2); }
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

  var newGS = {
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
  // Apply equipped relics — sets gs._relic* flags / modifiers BEFORE
  // combat starts. Was previously broken: the original code did
  //   return { ... };
  //   applyRelics(gs);   // unreachable
  //   return gs;          // unreachable
  // …so no relic effects ever applied. Now wired correctly.
  applyRelics(newGS);
  return newGS;
}

// ═══════════════════════════════════════════════════════
// CHAMPION SELECT
// ═══════════════════════════════════════════════════════
// Round 62: pagination dropped — grid scrolls instead. CS_PAGE / CS_PER_PAGE
// / csChangePage retired. New `favoriteChamps` map sorts starred entries
// to the top regardless of the dropdown sort.
// Round 62e: gold display moved to nav-bar only; cs-gold span removed
// from index.html. _csFavoritesOnly is the session flag for the new
// favorites-only filter toggle in the header.
var _csFavoritesOnly = false;

function buildSelectScreen(){
  rebuildChampGrid();
}

// Round 62e: filter toggle — when active, the grid shows ONLY the
// player's favorited champions. Re-renders the grid and updates the
// star button's active state.
function toggleCsFavoritesOnly(){
  _csFavoritesOnly = !_csFavoritesOnly;
  var btn = document.getElementById('cs-fav-toggle');
  if(btn){
    btn.classList.toggle('active', _csFavoritesOnly);
    btn.textContent = _csFavoritesOnly ? '★' : '☆';
    btn.title = _csFavoritesOnly ? 'Show all champions' : 'Show favorites only';
  }
  rebuildChampGrid();
}

// Toggle the star on a champion card. stopPropagation so the click
// doesn't bubble up to the card's selectChamp handler.
function toggleChampFavorite(id, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(!id || !CREATURES[id]) return;
  PERSIST.favoriteChamps = PERSIST.favoriteChamps || {};
  if(PERSIST.favoriteChamps[id]) delete PERSIST.favoriteChamps[id];
  else PERSIST.favoriteChamps[id] = true;
  savePersist();
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

  // Round 62: favorites partition. After the chosen sort runs, peel
  // favorites to the top while preserving their relative order. Works
  // for every sort mode including alphabetical.
  var favs = PERSIST.favoriteChamps || {};
  scored.sort(function(a,b){
    var afv = favs[a.id] ? 1 : 0;
    var bfv = favs[b.id] ? 1 : 0;
    return bfv - afv; // favorites first; ties keep prior order (stable sort)
  });

  // Add a single mystery slot at the end to hint more champions exist
  scored.push({id:'__mystery__',score:-999,isUnlocked:false,isSeen:false});
  return scored;
}

function rebuildChampGrid(){
  // Round 62e: cs-gold removed from header (nav-gold owns gold display).
  // Refresh the active-quests rail every time the grid rebuilds so the
  // panel reflects the latest state (after a run, after a quest claim,
  // after the auto-refresh tick, etc).
  if(typeof buildCsQuestRail === 'function') buildCsQuestRail();
  // Auto-select first unlocked champion if nothing is selected, so the
  // left rail isn't empty on first land. Falls through to existing
  // selectChamp logic which also paints the rail.
  if(!selectedChampId && Array.isArray(PERSIST.unlockedChamps)){
    var firstUnlocked = null;
    for(var u=0;u<PERSIST.unlockedChamps.length;u++){
      var uid = PERSIST.unlockedChamps[u];
      if(uid !== 'dojo_tiger' && CREATURES[uid]){ firstUnlocked = uid; break; }
    }
    if(firstUnlocked) selectedChampId = firstUnlocked;
  }
  if(typeof buildCsChampRail === 'function') buildCsChampRail(selectedChampId);
  var sort=document.getElementById('cs-sort').value;
  var list=getSortedChampList(sort);

  // Round 62e: favorites-only filter. Drops every non-favorite (and
  // the trailing __mystery__ slot, since the player has explicitly
  // narrowed scope to their starred set).
  if(_csFavoritesOnly){
    var favs = PERSIST.favoriteChamps || {};
    list = list.filter(function(item){ return item.id !== '__mystery__' && favs[item.id]; });
  }

  // Round 62e: count moved inline with the title as a subtle "· N"
  // (was a near-invisible 8px afterthought before). Reads naturally
  // against "CHOOSE YOUR CHAMPION · 5 IN ROSTER".
  var unlocked=PERSIST.unlockedChamps.length;
  var totalEl = document.getElementById('cs-total');
  if(totalEl){
    if(_csFavoritesOnly){
      var favCount = Object.keys(PERSIST.favoriteChamps||{}).length;
      totalEl.textContent = favCount + ' FAVORITED';
    } else {
      totalEl.textContent = unlocked + (unlocked === 1 ? ' CHAMPION' : ' CHAMPIONS');
    }
  }

  var grid=document.getElementById('champ-grid'); grid.innerHTML='';

  // Round 62e: empty-state when favorites-only is on but the roster
  // is unstarred. A short prompt explaining how to star a champion is
  // friendlier than an empty grid.
  if(_csFavoritesOnly && !list.length){
    grid.innerHTML = '<div style="grid-column:1/-1;padding:48px 16px;text-align:center;color:#7a6030;font-family:\'Crimson Text\',serif;font-size:12px;line-height:1.6;">'
      + '<div style="font-size:34px;opacity:.5;margin-bottom:10px;">☆</div>'
      + 'No favorites yet. Tap the star on any champion card to pin them to the top.'
      + '</div>';
    return;
  }

  list.forEach(function(item){
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
      var lockLabel = getChampLockLabel(id);
      var isLocked = !!lockLabel;
      var lockBadgeIcon = (cp.lockedForge !== null && cp.lockedForge !== undefined) ? '⚒' : '🏕️';
      d.className='champ-card'+(isDead?' dead-champ':'')+(isLocked?' expedition-locked':'')+(' '+getAscensionClass(id));
      d.id='cc-'+id;
      // Click ALWAYS paints the side rail (selectChamp does that
      // unconditionally; the lock check only gates combat selection).
      d.onclick=function(){ selectChamp(id); };
      var s=cp.stats;
      // Reserved-slot rendering: every slot div is always emitted with
      // a min-height in CSS so cards line up vertically across the grid
      // regardless of which states are set. Empty slots hold space.
      // Round 35 cut card content to identity + click-driving signals
      // only (sprite, name, status, ascension, relics, level, innate
      // name, stats). XP bar / growth row / last area / innate desc
      // moved to side rail only — they don't drive the click decision.
      var statusInner = '';
      if(isDead){
        statusInner = '<span class="dead-badge">✦ FALLEN · Lv.1 on next run</span>';
      } else if(isLocked){
        statusInner = '<span class="exp-locked-badge">'+lockBadgeIcon+' '+lockLabel+'</span>';
      }
      var ascChip = getAscensionChipHTML(id);
      // Round 38: cards used to render full relic icons at 22px each.
      // Now that relicImgHTML enforces min 48px, displaying icons here
      // would overflow the card. The card now shows a count chip
      // ("⚒ 3") — a "this champ is geared up" signal. Detail (full
      // icons + tooltips) lives in the side rail at 48px where it
      // belongs.
      var equipped = (typeof getEquippedRelics === 'function') ? getEquippedRelics(id) : [];
      var slots    = (typeof getRelicSlotCount === 'function') ? getRelicSlotCount(id) : 0;
      var relicChip = '';
      if(slots > 0){
        var col = (equipped.length === slots && slots > 0) ? '#d4a843' : '#7a6030';
        relicChip = '<span class="champ-card-relic-count" style="color:'+col+';">⚒ '+equipped.length+' / '+slots+'</span>';
      }
      // Round 62: favorite star (top-right). Clicking toggles
      // PERSIST.favoriteChamps[id] and re-sorts the grid so starred
      // champs float to the top.
      var isFav = !!(PERSIST.favoriteChamps && PERSIST.favoriteChamps[id]);
      var starGlyph = isFav ? '★' : '☆';
      var starColor = isFav ? '#d4a843' : '#5a4020';
      var starTitle = isFav ? 'Unfavorite' : 'Favorite (sorts to top)';
      var favStar = '<button class="champ-card-fav'+(isFav?' active':'')+'" '
        + 'onclick="toggleChampFavorite(\''+id+'\', event)" '
        + 'title="'+starTitle+'" '
        + 'style="color:'+starColor+';">'+starGlyph+'</button>';
      d.innerHTML =
          favStar
        + '<div class="champ-card-status">'+statusInner+'</div>'
        + '<div class="champ-icon">'+creatureImgHTML(id, ch.icon, '150px', 'flip-x')+'</div>'
        + '<div class="champ-name">'+ch.name+'</div>'
        + '<div class="champ-card-asc">'+(ascChip||'')+'</div>'
        + '<div class="champ-card-relics">'+relicChip+'</div>'
        + '<div class="champ-card-footer">'
        +   '<div class="champ-card-foot-row">'
        +     '<span class="champ-level-badge">Lv.'+cp.level+'</span>'
        +     '<span class="champ-card-innate">✦ '+(ch.innateName||'')+'</span>'
        +   '</div>'
        +   '<div class="champ-stats-row">'
        +     '<div><div class="champ-stat-v str">'+s.str+'</div><div class="champ-stat-l">STR</div></div>'
        +     '<div><div class="champ-stat-v agi">'+s.agi+'</div><div class="champ-stat-l">AGI</div></div>'
        +     '<div><div class="champ-stat-v wis">'+s.wis+'</div><div class="champ-stat-l">WIS</div></div>'
        +   '</div>'
        + '</div>';
    }

    grid.appendChild(d);
  });

  // Keep selected champion highlighted if still on this page
  if(selectedChampId){
    var sel=document.getElementById('cc-'+selectedChampId);
    if(sel) sel.classList.add('selected');
  }
}

// ── Champion-info side rail (left of grid) ───────────────────────────
// Replaces the per-card (i) button popup with a persistent panel.
// Populated by selectChamp(id) on every card click and by
// rebuildChampGrid on screen entry (auto-selects first unlocked).
// Locked champions still render — player wants to inspect what
// their busy champion is doing, even if they can't pick them.
function buildCsChampRail(id){
  var rail   = document.getElementById('cs-champ-rail');
  var emptyEl = document.getElementById('cs-cr-empty');
  var bodyEl  = document.getElementById('cs-cr-body');
  if(!rail || !emptyEl || !bodyEl) return;
  if(!id || !CREATURES[id] || (PERSIST.unlockedChamps||[]).indexOf(id) === -1){
    emptyEl.style.display = '';
    bodyEl.style.display  = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  bodyEl.style.display  = '';

  var ch = CREATURES[id];
  var cp = getChampPersist(id);
  var s  = cp.stats || {str:0,agi:0,wis:0};

  // Status badge (FALLEN / lock / empty — reserved space)
  var statusEl = document.getElementById('cs-cr-status');
  var lockLabel = (typeof getChampLockLabel === 'function') ? getChampLockLabel(id) : null;
  var lockIcon  = (cp.lockedForge !== null && cp.lockedForge !== undefined) ? '⚒' : '🏕️';
  if(!cp.alive){
    statusEl.innerHTML = '<span class="dead-badge">✦ FALLEN · Lv.1 on next run</span>';
  } else if(lockLabel){
    statusEl.innerHTML = '<span class="exp-locked-badge">'+lockIcon+' '+lockLabel+'</span>';
  } else {
    statusEl.innerHTML = '';
  }

  // Portrait + name + ascension chip
  var portraitEl = document.getElementById('cs-cr-portrait');
  if(portraitEl) portraitEl.innerHTML = creatureImgHTML(id, ch.icon, '120px', 'flip-x');
  document.getElementById('cs-cr-name').textContent = ch.name;
  var ascEl = document.getElementById('cs-cr-asc');
  ascEl.innerHTML = (typeof getAscensionChipHTML === 'function') ? getAscensionChipHTML(id) : '';

  // Stats grid
  document.getElementById('cs-cr-level').textContent = cp.level;
  document.getElementById('cs-cr-str').textContent   = Math.round(s.str);
  document.getElementById('cs-cr-agi').textContent   = Math.round(s.agi);
  document.getElementById('cs-cr-wis').textContent   = Math.round(s.wis);

  // Growth-per-level line
  var g = ch.growth || {str:0,agi:0,wis:0};
  document.getElementById('cs-cr-growth').innerHTML =
      '<span class="str">+'+g.str+' STR</span>'
    + '<span class="agi">+'+g.agi+' AGI</span>'
    + '<span class="wis">+'+g.wis+' WIS</span>'
    + '<span style="color:#3a2010;">/ lv</span>';

  // XP bar
  var xpPct = Math.min(100, Math.round((cp.xp/(cp.xpNext||1))*100));
  document.getElementById('cs-cr-xp-txt').textContent = cp.xp + ' / ' + cp.xpNext;
  document.getElementById('cs-cr-xp-bar').style.width = xpPct + '%';

  // Mastery bar (toward next ascension tier)
  var ascLv  = (typeof getAscensionLevel === 'function') ? getAscensionLevel(id) : 0;
  var nextTier = (typeof ASCENSION_TIERS !== 'undefined' && ascLv < ASCENSION_TIERS.length) ? ASCENSION_TIERS[ascLv] : null;
  var mast    = cp.masteryXp || 0;
  var mastReq = nextTier ? nextTier.masteryReq : 0;
  var mastPct = mastReq > 0 ? Math.min(100, Math.round((mast/mastReq)*100)) : 100;
  var mastBar = document.getElementById('cs-cr-mastery-bar');
  mastBar.style.width = mastPct + '%';
  mastBar.classList.toggle('full', mastPct >= 100 && !!nextTier);
  document.getElementById('cs-cr-mastery-toward').textContent =
    nextTier ? ('Toward ' + nextTier.tier.charAt(0).toUpperCase() + nextTier.tier.slice(1).replace('_',' ')) : 'Maximum ascension';
  document.getElementById('cs-cr-mastery-frac').textContent =
    nextTier ? (mast + ' / ' + mastReq) : '—';

  // Innate
  document.getElementById('cs-cr-innate-name').textContent = ch.innateName || (ch.innate && ch.innate.name) || 'Innate';
  document.getElementById('cs-cr-innate-desc').innerHTML   = (typeof renderKeywords === 'function')
    ? renderKeywords(ch.innateDesc || (ch.innate && ch.innate.desc) || '')
    : (ch.innateDesc || '');

  // Deck summary — use the canonical buildStartDeck which knows about
  // deck overrides (Sanctum edits), creature.deckOrder generators,
  // startDeck / deck fallbacks, and Dead Weight (filler) padding for
  // STR-based deck cap. The earlier `cp.deck || ch.deck` lookup was
  // hitting `undefined` on most champions and showing "Empty deck".
  var deck = (typeof buildStartDeck === 'function') ? buildStartDeck(id) : [];
  document.getElementById('cs-cr-deck-count').textContent = deck.length ? '· '+deck.length+' cards' : '';
  // Group by id for tidy summary (icon + count)
  var counts = {};
  deck.forEach(function(cid){ counts[cid] = (counts[cid]||0)+1; });
  var deckHtml = Object.keys(counts).map(function(cid){
    var card = (typeof CARDS !== 'undefined') ? CARDS[cid] : null;
    var name = card ? card.name : cid;
    var icon = card ? (card.icon||'') : '';
    var n = counts[cid];
    return '<div>'+icon+' '+name+(n>1?' ×'+n:'')+'</div>';
  }).join('') || '<em style="color:#5a4020;">No cards.</em>';
  document.getElementById('cs-cr-deck-summary').innerHTML = deckHtml;

  // Relics — equipped strip with hover info via existing relic system
  var relicEl = document.getElementById('cs-cr-relics');
  var equipped = (typeof getEquippedRelics === 'function') ? getEquippedRelics(id) : (cp.relics||[]);
  var slotCount = (typeof getRelicSlotCount === 'function') ? getRelicSlotCount(id) : 0;
  // Hide the "X / Y" count when there are no slots yet — "0 / 0" reads
  // confusingly. The placeholder line below carries the message.
  document.getElementById('cs-cr-relic-count').textContent = slotCount > 0
    ? equipped.length + ' / ' + slotCount
    : '';
  if(slotCount === 0){
    relicEl.innerHTML = '<span class="cs-cr-relics-empty">No relic slots. Ascend first.</span>';
  } else if(!equipped.length){
    relicEl.innerHTML = '<span class="cs-cr-relics-empty">No relics equipped.</span>';
  } else if(typeof relicStripHTML === 'function'){
    // Round 38: bumped 28 → 48 since relicImgHTML enforces min 48.
    // Rail is 280px wide; 3 relics at 48 + gaps fit comfortably; more
    // wrap to a second row.
    relicEl.innerHTML = relicStripHTML(id, {size:'48px'});
  } else {
    relicEl.innerHTML = '';
  }

  // Action buttons — point to existing deck view + Sanctum entry points
  var viewBtn = document.getElementById('cs-cr-view-deck');
  var editBtn = document.getElementById('cs-cr-edit-deck');
  if(viewBtn){
    viewBtn.onclick = function(){
      selectedChampId = id;
      if(typeof openChampDeckView === 'function') openChampDeckView();
    };
  }
  if(editBtn){
    editBtn.onclick = function(){
      selectedChampId = id;
      if(typeof openChampSanctum === 'function') openChampSanctum();
    };
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
  // Always paint the side rail — the player wants to inspect their
  // locked champions too (to remember what they're up to). Selection
  // for combat is gated below; rail is unconditional.
  if(typeof buildCsChampRail === 'function') buildCsChampRail(id);
  if(isChampLocked(id)) return;
  playSelectSfx();
  selectedChampId=id;
  document.querySelectorAll('.champ-card').forEach(function(c){c.classList.remove('selected');});
  var el=document.getElementById('cc-'+id); if(el) el.classList.add('selected');
}

function confirmChampion(){
  if(!selectedChampId) selectedChampId=PERSIST.unlockedChamps[0]||'druid';
  if(PERSIST.unlockedChamps.indexOf(selectedChampId)===-1) return;
  var lockLabel = getChampLockLabel(selectedChampId);
  if(lockLabel){
    showTownToast(CREATURES[selectedChampId].name + ' is ' + lockLabel.toLowerCase() + '!');
    return;
  }
  playUiClickSfx();
  showScreen('area-screen');
  showNav(true);
  updateNavBar('adventure');
  buildAreaScreen();
}

function confirmArea(){
  if(!selectedArea) return;
  var lockLabel = getChampLockLabel(selectedChampId);
  if(lockLabel){
    showTownToast('Champion is ' + lockLabel.toLowerCase() + '!');
    return;
  }
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
  // activeTab is optional. When omitted, tab classes are left alone
  // so a background tick can repaint currencies without clobbering
  // the player's current tab.
  if(activeTab !== undefined){
    document.getElementById('nav-adventure').classList.toggle('active',activeTab==='adventure');
    var tt=document.getElementById('nav-town');
    if(tt){
      tt.classList.toggle('active',activeTab==='town');
      tt.classList.remove('locked-tab');
      tt.title='';
    }
  }
  refreshNavCurrencies();
  updateAchBadge();
}

// Round 62f: paint the gold + shard counters in the nav bar. Split
// out so background ticks can refresh currency without disturbing
// the active-tab state. Called from updateNavBar AND from any code
// path that mutates currency and wants a live nav refresh.
function refreshNavCurrencies(){
  var goldEl = document.getElementById('nav-gold');
  if(goldEl) goldEl.innerHTML = goldImgHTML('16px') + ' ' + PERSIST.gold;
  var shardsEl = document.getElementById('nav-shards');
  if(shardsEl){
    var shardIcon = (typeof soulShardImgHTML === 'function')
      ? soulShardImgHTML('16px')
      : '<span style="font-size:14px;">🔮</span>';
    shardsEl.innerHTML = shardIcon + ' ' + (PERSIST.soulShards || 0);
  }
}

function navToTown(){
  navTo('town');
}

function navTo(tab){
  if(tab==='adventure'){
    if(gs&&gs.running){ addLog('Finish the battle first.','sys'); return; }
    showScreen('select-screen');
    // Round 62: re-render so newly-summoned champions appear without
    // a full page refresh. Previously the grid was painted once on
    // init.js boot and never refreshed when town actions changed the
    // unlocked roster.
    if(typeof rebuildChampGrid === 'function') rebuildChampGrid();
    // Round 62g: was missing — without this, switching from town
    // back to adventure left the TOWN tab visually highlighted
    // because no code path repainted the active-tab class state.
    updateNavBar('adventure');
    playMusic('menu_theme');
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


// Deck editor code extracted to deck_builder.js

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

  var statusTxt=a.readyToClaim?'✦ Complete · ready to claim!'
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
// Relic icon — assets/icons/relics/{id}.png (48×48 pixel art).
// Display floored at 48px — never squish source. (Round 38: layouts
// adjusted at every call site that previously rendered <48: champion
// card now uses a count chip; Sanctum/Forge slots grew their frames.)
function relicImgHTML(relicId, size){
  var sz = _minSizePx(size || '48px', 48);
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
  stopMusic();
  gs=makeGS(champId,area);
  // Snapshot start-of-run state for the post-area "RUN SUMMARY" panel.
  // Captures champion XP/level/mastery and active-quest progress so the
  // panel can animate the deltas at run-end. Stored on gs (cleared with
  // the run state).
  gs._snapshot = _captureRunSnapshot(champId);
  paused=false;
  var ch=CREATURES[champId];
  setCreatureImg(document.getElementById('top-portrait'), champId, ch.icon, '40px');
  document.getElementById('top-name').textContent=ch.name;
  document.getElementById('p-name').textContent=ch.name;
  setCreatureImg(document.getElementById('p-icon'), champId, ch.icon, '320px');
  document.getElementById('p-icon').classList.add('flip-x');
  // Equipped relics strip — hover for tooltip
  var pRelics = document.getElementById('p-relics');
  if(pRelics) pRelics.innerHTML = relicStripHTML(champId, {size:'28px'});

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
    innateCard.onmouseenter=function(e){ showTipDirect(ch.innateName, ch.innateActive?'ACTIVE · '+ch.innateCost+' mana':'PASSIVE', ch.innateDesc, '', e); };
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
  // (Removed stale call to updateQuestIndicator() — function was deleted in
  // a prior refactor. Quest HUD already refreshes via updateAll() above.)
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
  // Round 57: enemy relic strip (mirror of p-relics). Currently only
  // arena fights carry enemy relics (e._arenaRelics from the duel-code
  // payload). Hover shows the same tooltip as player relics.
  var eRelics = document.getElementById('e-relics');
  if(eRelics){
    if(e._arenaRelics && e._arenaRelics.length && typeof _relicStripFromIdsHTML === 'function'){
      eRelics.innerHTML = _relicStripFromIdsHTML(e._arenaRelics, {size:'28px'});
    } else {
      eRelics.innerHTML = '';
    }
  }
  trackSeen(e.id);
  // Reset per-enemy state
  gs.enemyShell=0;
  gs.enemyCardCount=0; gs.lastEnemyCard=null;
  gs.enemyHand=[];
  // Enemy mana — scales with WIS like player
  var eManaMax=calcMaxMana(e.wis);
  gs.enemyMaxMana=eManaMax; gs.enemyMana=0;
  gs.enemyManaRegen=calcManaRegen(e.wis); gs.enemyManaAccum=0; gs._innCooldown=0;
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
      auras: {},
      _activeAuraIds: [],
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
      auras: {},
      _activeAuraIds: [],
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
  if(gs._relicBonusStartCards) startCards += gs._relicBonusStartCards; // Quick-Draw Holster
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
  if(gs.manaAccum>=1){ var g=Math.floor(gs.manaAccum); gs.manaAccum-=g; gs.mana=Math.min(gs.maxMana,gs.mana+g); gs._handDisplayDirty=true; }

  // Enemy mana regen
  if(gs.enemyMaxMana>0){
    gs.enemyManaAccum+=(gs.enemyManaRegen||3)/10;
    var eg=Math.floor(gs.enemyManaAccum);
    if(eg>=1){ gs.enemyManaAccum-=eg; gs.enemyMana=Math.min(gs.enemyMaxMana,gs.enemyMana+eg); }
  }
  // Enemy innate cooldown tick (player cooldown)
  if(gs._innCooldown>0) gs._innCooldown=Math.max(0,gs._innCooldown-100);

  // ── Aura system: process all passive auras for both actors ──
  if(gs.actors){
    if(gs.actors.player) processAuras(gs.actors.player);
    if(gs.actors.enemy) processAuras(gs.actors.enemy);
  }

  // ── Throttled card text update for live values (HP, shield, mana, hand size) ──
  if(gs._handDisplayDirty){
    var _now = Date.now();
    if(!gs._lastHandTextUpdate || _now - gs._lastHandTextUpdate > 500){
      gs._handDisplayDirty = false;
      gs._lastHandTextUpdate = _now;
      updateHandText();
    }
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
  // Apply Slow debuff to player draw interval (percentage-based)
  var playerSlow=gs.statusEffects.player.find(function(s){return s.stat==='slow_draw';});
  if(playerSlow) eff=Math.round(eff*(1+(playerSlow.val||0.5)));
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
  // slow_draw: percentage-based draw speed reduction (non-stacking)
  var slowDraw=gs.statusEffects.enemy.find(function(s){return s.stat==='slow_draw';});
  if(slowDraw) interval=Math.round(interval*(1+(slowDraw.val||0.5)));
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

  // Mana Siphon Ring relic: temporarily augment Strike/Brace/Focus effects
  // with a [Mana Burn] tail. Restored in finally so the global CARDS object
  // is never permanently mutated, even if the play throws.
  var _origUniversalEffects = null;
  if(gs._relicUniversalManaBurn && (item.id === 'strike' || item.id === 'brace' || item.id === 'focus')){
    _origUniversalEffects = c.effects;
    c.effects = (c.effects||[]).concat([{type:'mana_burn', value:gs._relicUniversalManaBurn}]);
  }

  try {
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
  } finally {
    // Always restore the global CARDS effects array, even if play threw.
    if(_origUniversalEffects){ c.effects = _origUniversalEffects; }
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
          if(t==='player'){ gs.playerShield=0; if(gs.actors&&gs.actors.player) gs.actors.player.shield=0; }
          else { gs.enemyShell=0; if(gs.actors&&gs.actors.enemy) gs.actors.enemy.shield=0; }
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
  // Check if this side's creature has mycelium_network innate
  var innateId = null;
  if(side === 'player'){
    var pInn = CREATURES[gs.champId] && CREATURES[gs.champId].innate;
    innateId = pInn && pInn.id;
    if(!innateId && typeof INNATE_TRIGGERS !== 'undefined'){
      var cInn = CREATURES[gs.champId] && CREATURES[gs.champId].innate;
      if(cInn && INNATE_TRIGGERS[cInn.id]) innateId = cInn.id;
    }
  } else {
    var e = gs.enemies && gs.enemies[gs.enemyIdx];
    innateId = e && e.innate && e.innate.id;
  }
  if(innateId !== 'mycelium_network') return;

  // Add shield value
  if(side === 'player'){
    gs.playerShield = (gs.playerShield||0) + dotDmg;
    if(gs.actors && gs.actors.player) gs.actors.player.shield = gs.playerShield;
  } else {
    gs.enemyShell = (gs.enemyShell||0) + dotDmg;
    if(gs.actors && gs.actors.enemy) gs.actors.enemy.shield = gs.enemyShell;
  }

  // Create or refresh 5s shield status (so it expires)
  var shieldDur = 5000;
  var list = gs.statusEffects[side];
  var existing = -1;
  for(var i = 0; i < list.length; i++){
    if(list[i].id === 'shield'){ existing = i; break; }
  }
  if(existing !== -1){
    // Refresh duration
    list[existing].remaining = shieldDur;
    list[existing].maxRemaining = shieldDur;
  } else {
    var shieldVal = side === 'player' ? gs.playerShield : gs.enemyShell;
    list.push({id:'shield', label:'Shield ('+shieldVal+')', cls:'shield', val:shieldVal, stat:'shield',
      remaining:shieldDur, maxRemaining:shieldDur, desc:'Shield from Mycelium Network.'});
    addTag(side, 'shield', 'Shield ('+shieldVal+')', null, null, 'Shield from Mycelium Network.');
  }

  spawnFloatNum(side, '+'+dotDmg+'🛡', false, 'shield-num');
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
  var desc=hidden?'Unknown. Defeat this creature to reveal its secret.':innate.desc;
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
  if(waxGold>0) _addCombatGold(gs, waxGold);

  // XP (same as any fight) with shrine bonus
  var rawXp=Math.round(8+gs.area.level*10);
  var xpMult=calcXpMult(gs.level,gs.area.level);
  if(gs._shrineXpBonus) xpMult*=gs._shrineXpBonus;
  var xp=Math.max(1,Math.round(rawXp*xpMult));
  gs.xp+=xp;
  trackKill('waxoasis');
  checkLevelUp();
  gs._lastFightWon = true;  // wax oasis = passive shrine, treated as a "win"
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
  gs._lastFightWon = true;  // grantCombatMasteryXp reads this at run-end
  saveChampionState();
  var isLast=(gs.enemyIdx+1>=gs.enemies.length);
  if(isLast){
    // Area clear — gold reward based on area level
    var areaGold=Math.floor(15+gs.area.level*8+Math.random()*gs.area.level*4);
    var awardedAreaGold = _addCombatGold(gs, areaGold);
    addLog('+'+awardedAreaGold+' gold (area clear).','sys');
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
  _runResultsThenSpoils();
}

// Award combat mastery once (delta-correct), then show the run-results
// panel. CONTINUE proceeds to spoils or directly to area select.
function _runResultsThenSpoils(){
  if(!gs) return;
  if(typeof grantCombatMasteryXp === 'function') grantCombatMasteryXp();
  var champId = gs.champId;
  var areaName = (gs.area && gs.area.def) ? gs.area.def.name : '';
  var snap = gs._snapshot;
  var pool = (typeof buildSpoilsCardPool === 'function') ? buildSpoilsCardPool() : [];
  var afterFn = function(){
    if(pool.length) showSpoilsOverlay(champId);
    else goToAreaSelectAfterRun();
  };
  if(snap && typeof showRunResults === 'function'){
    showRunResults(champId, areaName, snap, afterFn);
  } else {
    afterFn();
  }
}

function autoTakeGold(){
  if(!gs) return;
  if(!_rewardIsLast){
    var goldAmt=Math.round(3+gs.area.level*2);
    var awardedAuto = _addCombatGold(gs, goldAmt);
    addLog('Auto: +'+awardedAuto+' gold.','sys');
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
    _runResultsThenSpoils();
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
  // NOTE: combat mastery is awarded ONCE at run-end via grantCombatMasteryXp()
  // — we used to award incrementally here which produced two bugs:
  //   1) saveChampionState fires after each enemy + each level-up + run-end,
  //      so `enemyIdx*5` (cumulative-current) snowballed into 0+5+10+10 = 25
  //      for a 3-enemy run instead of the intended 15.
  //   2) The clear bonus (`enemiesBeaten >= enemies.length`) never fired
  //      because gs.enemyIdx is the index of the LAST enemy (length-1), not
  //      length, when this function runs. Off-by-one ate the +15.
  // Both are fixed by the dedicated run-end hook below.
  savePersist();
}

// ═══════════════════════════════════════════════════════
// RUN RESULTS — sequenced post-area reveal
// ═══════════════════════════════════════════════════════
//
// Flow: startRun snapshots cp state → combat happens → at run-end,
// showRunResults reads current vs snapshot, animates each delta in
// sequence, then enables CONTINUE which advances to spoils (or area
// select if there's nothing to spoil). Pure presentation — all
// numerical updates have already been committed to PERSIST by the
// time this fires.

var _rrContinueCb = null;
var _rrTimers = [];

function _rrClearTimers(){
  _rrTimers.forEach(function(t){ clearTimeout(t); });
  _rrTimers = [];
}

// Public entry. snap is gs._snapshot (start of run); afterFn is what to
// call when the player clicks CONTINUE.
function showRunResults(champId, areaName, snap, afterFn){
  _rrContinueCb = afterFn || function(){};
  _rrClearTimers();

  var ch = CREATURES[champId];
  var cp = getChampPersist(champId);
  if(!ch || !cp || !snap){
    // Safety: if anything is missing, skip the panel entirely.
    if(typeof afterFn === 'function') afterFn();
    return;
  }

  // Subtitle
  var sub = document.getElementById('rr-subtitle');
  if(sub) sub.textContent = ch.name + ' · ' + (areaName || '—');

  // ── Compute deltas ──────────────────────────────────────────
  // XP delta — accounts for level-ups (could be multiple). We need to
  // simulate the fill: from snap.level/snap.xp/snap.xpNext through any
  // intermediate level transitions to cp.level/cp.xp/cp.xpNext.
  // The simplest model: total XP earned = sum of XP poured in. We
  // approximate by running the level curve from snap to cp and
  // recording each segment.
  var xpSegments = _rrComputeXpSegments(snap, cp);
  var xpTotalGained = xpSegments.totalXp;

  // Mastery delta — direct
  var masteryGained = Math.max(0, (cp.masteryXp||0) - (snap.masteryXp||0));

  // Quest deltas — only quests that EXISTED in snap and have higher
  // progress now (or completed). Quests added mid-run don't appear here.
  var questDeltas = _rrComputeQuestDeltas(snap);

  // ── Reset section visuals to "before" state ────────────────
  document.querySelectorAll('#run-results-overlay .rr-section').forEach(function(s){
    s.classList.remove('revealed');
  });
  document.querySelectorAll('#run-results-overlay .rr-burst').forEach(function(b){
    b.style.display = 'none';
  });
  var xpFill = document.getElementById('rr-xp-fill');
  var msFill = document.getElementById('rr-mastery-fill');
  if(xpFill){ xpFill.style.transition = 'none'; xpFill.style.width = (snap.xpNext>0?(snap.xp/snap.xpNext)*100:0)+'%'; xpFill.classList.remove('full'); }
  if(msFill){ msFill.style.transition = 'none'; msFill.style.width = _rrMasteryPct(snap.masteryXp, snap.ascensionTier)+'%'; msFill.classList.remove('full'); }
  var xpLevelEl = document.getElementById('rr-xp-level');
  var xpFracEl  = document.getElementById('rr-xp-frac');
  var xpGainEl  = document.getElementById('rr-xp-gain');
  if(xpLevelEl) xpLevelEl.textContent = 'Lv.'+snap.level;
  if(xpFracEl)  xpFracEl.textContent  = snap.xp+' / '+snap.xpNext;
  if(xpGainEl)  xpGainEl.textContent  = '+'+xpTotalGained+' XP';
  var msFracEl  = document.getElementById('rr-mastery-frac');
  var msTowardEl= document.getElementById('rr-mastery-toward');
  var msGainEl  = document.getElementById('rr-mastery-gain');
  var snapNextTier = ASCENSION_TIERS[snap.ascensionTier];
  if(msFracEl)   msFracEl.textContent   = (snap.masteryXp||0) + (snapNextTier ? ' / '+snapNextTier.masteryReq : ' / —');
  if(msTowardEl) msTowardEl.textContent = snapNextTier ? ('Toward '+_rrTitleCase(snapNextTier.tier)) : 'Maximum ascension';
  if(msGainEl)   msGainEl.textContent   = '+'+masteryGained;

  // Quests section visibility
  var qSec = document.getElementById('rr-section-quests');
  var qList = document.getElementById('rr-quests-list');
  if(qList) qList.innerHTML = '';
  if(qSec) qSec.style.display = (questDeltas.length ? '' : 'none');

  // CONTINUE hidden until the sequence completes
  var contBtn = document.getElementById('rr-continue');
  if(contBtn){ contBtn.style.opacity = '0'; contBtn.style.pointerEvents = 'none'; }

  // Show overlay
  var ov = document.getElementById('run-results-overlay');
  if(ov) ov.style.display = 'flex';

  // ── Sequence the reveals ───────────────────────────────────
  var t = 0;

  // Step 1: XP section appears + fills
  _rrTimers.push(setTimeout(function(){
    var sec = document.getElementById('rr-section-xp');
    if(sec) sec.classList.add('revealed');
    _rrTimers.push(setTimeout(function(){
      _rrAnimateXpSegments(xpSegments, snap);
    }, 280));
  }, t));
  t += 300 + (xpSegments.segments.length * 1100) + 250;

  // Step 2: Mastery section
  _rrTimers.push(setTimeout(function(){
    var sec = document.getElementById('rr-section-mastery');
    if(sec) sec.classList.add('revealed');
    _rrTimers.push(setTimeout(function(){
      _rrAnimateMastery(snap, cp, masteryGained);
    }, 280));
  }, t));
  t += 1500;

  // Step 3: Quests section (only if any deltas)
  if(questDeltas.length){
    _rrTimers.push(setTimeout(function(){
      if(qSec) qSec.classList.add('revealed');
      _rrAnimateQuests(questDeltas);
    }, t));
    t += 600 + questDeltas.length * 850;
  }

  // Step 4: enable CONTINUE
  _rrTimers.push(setTimeout(function(){
    if(contBtn){ contBtn.style.opacity = '1'; contBtn.style.pointerEvents = 'auto'; }
  }, t));
}

// Compute XP segments to animate. Each segment fills from `from%` to
// either 100% (level-up) or `to%` (final stop). `boundaries` contains
// {fromPct, toPct, levelAfter, xpNextAfter} per segment.
function _rrComputeXpSegments(snap, cp){
  var segs = [];
  var totalXp = 0;
  // Walk from snap → cp by level. We don't know the exact intermediate
  // xpNext ramps; recompute using the same formula as checkLevelUp:
  //   xpNextNew = floor(xpNextOld * 1.5)
  var curLevel  = snap.level;
  var curXp     = snap.xp;
  var curXpNext = snap.xpNext;
  // Sum total XP gained: poured-in XP across all level transitions plus
  // remaining xp at end-state.
  var endLevel  = cp.level;
  var endXp     = cp.xp;
  var endXpNext = cp.xpNext;
  if(endLevel < curLevel){
    // Should never happen — defensive, just animate to-current.
    segs.push({ fromPct: (snap.xpNext>0?(snap.xp/snap.xpNext)*100:0), toPct: (endXpNext>0?(endXp/endXpNext)*100:0), levelAfter: endLevel, xpNextAfter: endXpNext });
    return { segments: segs, totalXp: 0 };
  }
  while(curLevel < endLevel){
    // Fill remaining from curXp → curXpNext (one level-up)
    var pourIn = curXpNext - curXp;
    totalXp += pourIn;
    segs.push({
      fromPct: (curXpNext>0?(curXp/curXpNext)*100:0),
      toPct: 100,
      levelAfter: curLevel + 1,
      xpNextAfter: Math.floor(curXpNext * 1.5)
    });
    curLevel++;
    curXpNext = Math.floor(curXpNext * 1.5);
    curXp = 0;
  }
  // Final partial fill toward endXp
  if(endXp > curXp){
    totalXp += (endXp - curXp);
  }
  segs.push({
    fromPct: (curXpNext>0?(curXp/curXpNext)*100:0),
    toPct:   (endXpNext>0?(endXp/endXpNext)*100:0),
    levelAfter: endLevel,
    xpNextAfter: endXpNext
  });
  return { segments: segs, totalXp: totalXp };
}

// Animate the XP segments in series. Bursts the LEVEL UP! caption when
// a segment crosses a level boundary.
function _rrAnimateXpSegments(xpSegments, snap){
  var fill = document.getElementById('rr-xp-fill');
  var levelEl = document.getElementById('rr-xp-level');
  var fracEl  = document.getElementById('rr-xp-frac');
  var burst   = document.getElementById('rr-xp-burst');
  if(!fill) return;

  var i = 0;
  var displayedLevel = snap.level;
  var displayedXpNext = snap.xpNext;

  function runNext(){
    if(i >= xpSegments.segments.length) return;
    var seg = xpSegments.segments[i];
    // Set fill instantly to fromPct (in case last segment ended early)
    fill.style.transition = 'none';
    fill.style.width = seg.fromPct + '%';
    // Force reflow so the next transition fires
    void fill.offsetWidth;
    fill.style.transition = 'width .9s cubic-bezier(.3,.6,.4,1)';
    fill.style.width = seg.toPct + '%';

    // Update fraction text mid-flight (rough — don't tick it precisely)
    if(fracEl) fracEl.textContent = '… filling';

    _rrTimers.push(setTimeout(function(){
      if(seg.toPct >= 100){
        // Level-up: flash the burst, snap bar to 0, bump displayed level
        displayedLevel = seg.levelAfter;
        displayedXpNext = seg.xpNextAfter;
        if(levelEl) levelEl.textContent = 'Lv.' + displayedLevel;
        if(burst){
          burst.style.display = 'block';
          burst.style.animation = 'none';
          void burst.offsetWidth;
          burst.style.animation = 'rr-burst-pop .5s ease-out';
        }
        if(typeof playLevelUpSfx === 'function') playLevelUpSfx();
        _rrTimers.push(setTimeout(function(){
          // Hide the burst, reset bar to 0% for the next segment
          if(burst) burst.style.display = 'none';
          fill.style.transition = 'none';
          fill.style.width = '0%';
          void fill.offsetWidth;
          if(fracEl) fracEl.textContent = '0 / ' + displayedXpNext;
          i++;
          runNext();
        }, 700));
      } else {
        // Final segment — write the actual fraction text
        var endXp = Math.round((seg.toPct / 100) * displayedXpNext);
        if(fracEl) fracEl.textContent = endXp + ' / ' + displayedXpNext;
        i++;
        runNext();
      }
    }, 950));
  }
  runNext();
}

// Animate the mastery bar. Plays the READY TO ASCEND burst if the
// bar fills to 100% (mastery requirement met for the next tier).
function _rrAnimateMastery(snap, cp, gained){
  var fill   = document.getElementById('rr-mastery-fill');
  var fracEl = document.getElementById('rr-mastery-frac');
  var burst  = document.getElementById('rr-mastery-burst');
  if(!fill) return;
  var fromPct = _rrMasteryPct(snap.masteryXp, snap.ascensionTier);
  var toPct   = _rrMasteryPct(cp.masteryXp,   cp.ascensionTier);
  // Edge case: if the player ascended mid-run (ascensionTier increased),
  // the bar's reference req changes. Just fill to 100% on the old req
  // visually — it's good enough for the recap.
  if(cp.ascensionTier > snap.ascensionTier) toPct = 100;

  fill.style.transition = 'none';
  fill.style.width = fromPct + '%';
  void fill.offsetWidth;
  fill.style.transition = 'width 1.1s cubic-bezier(.3,.6,.4,1)';
  fill.style.width = toPct + '%';

  if(fracEl){
    var nextTier = ASCENSION_TIERS[cp.ascensionTier];
    var req = nextTier ? nextTier.masteryReq : 0;
    fracEl.textContent = (cp.masteryXp||0) + (req ? ' / ' + req : ' / —');
  }

  _rrTimers.push(setTimeout(function(){
    if(toPct >= 100 && ASCENSION_TIERS[cp.ascensionTier]){
      if(burst){
        burst.style.display = 'block';
        burst.style.animation = 'none';
        void burst.offsetWidth;
        burst.style.animation = 'rr-burst-pop .5s ease-out';
      }
      fill.classList.add('full');
    }
  }, 1150));
}

// Animate the quest deltas — one row per quest, staggered ~700ms.
function _rrAnimateQuests(questDeltas){
  var list = document.getElementById('rr-quests-list');
  if(!list) return;
  list.innerHTML = '';
  questDeltas.forEach(function(d, i){
    var row = document.createElement('div');
    row.className = 'rr-quest-row';
    var fromPct = d.target>0 ? Math.min(100, (d.from/d.target)*100) : 0;
    var toPct   = d.target>0 ? Math.min(100, (d.to/d.target)*100)   : 0;
    var complete = d.to >= d.target;
    row.innerHTML =
        '<div class="rr-quest-name">'+ _rrEsc(d.title) +
          '<span class="rr-quest-frac'+(complete?' complete':'')+'" data-from="'+d.from+'" data-to="'+d.to+'" data-target="'+d.target+'">'
          + d.from+' / '+d.target +
          '</span>'
        +'</div>'
      + '<div class="rr-quest-bar"><div class="rr-quest-bar-fill'+(complete?' complete':'')+'" style="width:'+fromPct+'%;"></div></div>';
    list.appendChild(row);
    var fill = row.querySelector('.rr-quest-bar-fill');
    var frac = row.querySelector('.rr-quest-frac');
    _rrTimers.push(setTimeout(function(){
      if(fill){
        void fill.offsetWidth;
        fill.style.width = toPct + '%';
      }
      if(frac){
        // Tick the fraction up to the new value
        var startN = d.from, endN = d.to;
        var stepMs = 60;
        var steps  = Math.max(1, Math.min(20, endN - startN));
        var elapsed = 0;
        var tick = setInterval(function(){
          elapsed++;
          var n = Math.round(startN + (endN - startN) * (elapsed/steps));
          frac.textContent = n + ' / ' + d.target;
          if(elapsed >= steps){
            clearInterval(tick);
            frac.textContent = endN + ' / ' + d.target;
          }
        }, stepMs);
      }
    }, 350 + i*700));
  });
}

// Compute quest deltas: only quests that existed at snapshot time AND
// have a higher progress now. Excludes quests added mid-run (because
// snap.quests doesn't contain them).
function _rrComputeQuestDeltas(snap){
  var out = [];
  if(!snap || !snap.quests) return out;
  var quests = (PERSIST.town && PERSIST.town.quests) ? PERSIST.town.quests : null;
  if(!quests || !Array.isArray(quests.active)) return out;

  Object.keys(snap.quests).forEach(function(qid){
    var fromN = snap.quests[qid] || 0;
    var active = quests.active.find(function(a){ return a && a.id === qid; });
    if(!active) return; // quest was abandoned/claimed mid-run
    var toN = active.progress || 0;
    if(toN <= fromN) return;
    var def = quests.offered ? quests.offered.find(function(o){ return o.id === qid; }) : null;
    if(!def) return;
    out.push({
      title:  def.title || qid,
      from:   fromN,
      to:     Math.min(toN, def.target || toN),
      target: def.target || toN
    });
  });
  return out;
}

// Mastery bar percentage for snapshot/current state. ascensionTier
// indexes into ASCENSION_TIERS for the current target.
function _rrMasteryPct(masteryXp, ascensionTier){
  var tier = ASCENSION_TIERS[ascensionTier];
  if(!tier) return 100;
  return Math.min(100, ((masteryXp||0) / tier.masteryReq) * 100);
}

function _rrTitleCase(s){
  if(!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g,' ');
}

function _rrEsc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// CONTINUE button handler — closes the overlay and runs whatever was
// queued (showSpoilsOverlay or goToAreaSelectAfterRun).
function _runResultsContinue(){
  _rrClearTimers();
  var ov = document.getElementById('run-results-overlay');
  if(ov) ov.style.display = 'none';
  var cb = _rrContinueCb; _rrContinueCb = null;
  if(typeof cb === 'function') cb();
}

// Snapshot the parts of champion + town state that the run-results panel
// needs to animate deltas. Called once from startRun. Pure read — no side
// effects on PERSIST. Active-quest progress is captured by id + value so
// even if the active list reorders between snapshot and read, we can still
// match deltas.
function _captureRunSnapshot(champId){
  var cp = getChampPersist(champId);
  var snap = {
    level:      cp ? (cp.level||1)        : 1,
    xp:         cp ? (cp.xp||0)           : 0,
    xpNext:     cp ? (cp.xpNext||80)      : 80,
    masteryXp:  cp ? (cp.masteryXp||0)    : 0,
    ascensionTier: cp ? (cp.ascensionTier||0) : 0,
    quests:     {} // questId → progress
  };
  var quests = (PERSIST.town && PERSIST.town.quests) ? PERSIST.town.quests : null;
  if(quests && Array.isArray(quests.active)){
    quests.active.forEach(function(a){
      if(a && a.id) snap.quests[a.id] = a.progress || 0;
    });
  }
  return snap;
}

// Combat mastery — awarded once at run-end. enemiesBeaten is the count of
// enemies defeated this run (gs.enemyIdx + 1 IF the last one was killed,
// else just gs.enemyIdx). clearedAll is true if the player got through all
// of gs.enemies. Returns the amount gained for use by run-results UI.
//
// Tuning (Round 30): 2 per enemy + 5 clear bonus. A typical 4-enemy
// clear yields 13 mastery (~2.6/min over a 5-minute run). Idle
// activities deliberately pay more per active-minute so the player
// doesn't feel forced to grind combat for ascension.
var COMBAT_MASTERY_PER_ENEMY = 2;
var COMBAT_MASTERY_CLEAR_BONUS = 5;
function grantCombatMasteryXp(){
  if(!gs || !gs.champId) return 0;
  var beaten = gs.enemyIdx || 0;
  if(gs._lastFightWon) beaten += 1;
  beaten = Math.max(0, Math.min(beaten, (gs.enemies?gs.enemies.length:beaten)));
  var clearedAll = gs.enemies && beaten >= gs.enemies.length;
  var gain = beaten * COMBAT_MASTERY_PER_ENEMY + (clearedAll ? COMBAT_MASTERY_CLEAR_BONUS : 0);
  if(gain > 0){
    var cp = getChampPersist(gs.champId);
    if(cp){ cp.masteryXp = (cp.masteryXp||0) + gain; savePersist(); }
  }
  return gain;
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
    goldWrap.onclick=function(){ var awarded = _addCombatGold(gs, goldAmt); addLog('+'+awarded+' gold.','sys'); updateTopBar(); postVictory(false); };
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
  // Round 48: Arena fights have NO loss penalties (J's call). Branch
  // off before any of the level-reset / gold-loss / mark-dead logic.
  if(gs && gs.area && gs.area.isArena){
    finishArenaRunLoss();
    return;
  }
  PERSIST.gold+=gs.goldEarned; gs.goldEarned=0;
  var lost=Math.min(PERSIST.gold,10); PERSIST.gold-=lost;
  var ch=getCreaturePlayable(gs.champId);
  var cp=getChampPersist(gs.champId);
  // Grant combat mastery BEFORE wiping the level — enemies the champion
  // beat before falling still count. _lastFightWon is false on defeat so
  // the +15 clear bonus correctly doesn't fire.
  if(typeof grantCombatMasteryXp === 'function') grantCombatMasteryXp();
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
  var eManaMax=calcMaxMana(e.wis);
  gs.enemyMaxMana=eManaMax; gs.enemyMana=0;
  gs.enemyManaRegen=calcManaRegen(e.wis); gs.enemyManaAccum=0;
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
      auras: {},
      _activeAuraIds: [],
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

// ════════════════════════════════════════════════════════════════
// ARENA COMBAT — Round 48
// ════════════════════════════════════════════════════════════════
// Single entry point for all Arena fights (Challenge / Daily / Quest /
// Duel). Builds a synthetic area + enemy from a decoded duel-code
// payload, then hands off to startRun() so all the regular combat
// machinery (cards, mana, status effects, innate, HUD) just works.
//
// The synthetic area is tagged `isArena:true` so the win path
// (goToAreaSelectAfterRun) and loss path (doDefeat) can branch into
// the lighter arena-specific finish flows below.
//
// opts:
//   payload       — decoded duel code (see data/arena.js)
//   context       — 'challenge'|'daily'|'quest'|'duel' (for telemetry)
//   contextData   — { questId?, dailySeedYMD?, ... } passed to callbacks
//   onWin / onLoss — fired in the finish flows. Caller handles rewards.

function startArenaCombat(opts){
  if(!opts || !opts.payload){
    if(typeof showTownToast === 'function') showTownToast('No arena payload.');
    return;
  }
  var p  = opts.payload;
  var ch = CREATURES[p.id];
  if(!ch){
    if(typeof showTownToast === 'function') showTownToast('Arena: unknown opponent.');
    return;
  }

  // Auto-use the currently-selected champion (J's call #5).
  // Fall back to the first unlocked champion if nothing's selected.
  var champId = selectedChampId || (PERSIST.unlockedChamps && PERSIST.unlockedChamps[0]);
  if(!champId){
    if(typeof showTownToast === 'function') showTownToast('Select a champion first.');
    return;
  }
  // Refuse if the selected champion is locked to another activity.
  if(typeof getChampLockLabel === 'function'){
    var lockLabel = getChampLockLabel(champId);
    if(lockLabel){
      if(typeof showTownToast === 'function'){
        showTownToast(CREATURES[champId].name + ' is ' + lockLabel.toLowerCase() + '!');
      }
      return;
    }
  }

  // ── Build the synthetic enemy ──
  var str = p.st[0], agi = p.st[1], wis = p.st[2];
  var lv  = p.lv || 1;
  var enemy = {
    id:    p.id,
    name:  p.name || ch.name,
    icon:  ch.icon,
    str:   str, agi: agi, wis: wis,
    baseHp: Math.max(1, str * 5),
    // Damage scaling parallels buildArea's normal-enemy formula
    dmgMult:     1 + lv * 0.2,
    atkInterval: (typeof calcDrawInterval === 'function') ? calcDrawInterval(agi) : 3000,
    // No area-XP from arena enemies — rewards flow through callbacks
    xp:          0,
    innate:      ch.innate,
    // Custom deck if the code carries one, otherwise the creature's base
    deck:        (p.deck && p.deck.length) ? p.deck.slice() : (ch.deck || ['strike','strike','brace']),
    openingMove: ch.openingMove,
    // Stash relic/ascension hooks for future combat-side use (TBD)
    _arenaRelics:    (p.rel || []).slice(),
    _arenaAscension: p.asc || 0
  };

  // ── Build the synthetic area ──
  var contextLabel = ({
    challenge: 'Arena Challenge',
    daily:     'Daily Challenge',
    quest:     'Arena Quest',
    duel:      'Arena Duel'
  })[opts.context] || 'Arena';
  var def = {
    id:        'arena',              // setCombatBackground will try assets/backgrounds/arena.png
    name:      contextLabel,
    enemyPool: [p.id],
    isBossArea: false,
    isArena:   true,
    arenaContext: opts.context || 'fight'
  };
  var area = {
    id:       'arena-' + (opts.context || 'fight'),
    def:      def,
    level:    lv,
    enemies:  [enemy],
    isArena:  true,
    _arenaCallbacks: {
      onWin:  (typeof opts.onWin  === 'function') ? opts.onWin  : null,
      onLoss: (typeof opts.onLoss === 'function') ? opts.onLoss : null,
      context: opts.context || 'fight',
      contextData: opts.contextData || {}
    }
  };

  // Hand off to the standard run-start. Existing combat code doesn't
  // need to know it's an Arena fight — the isArena flag only matters
  // at finish-time.
  startRun(champId, area);
}

// Arena WIN — softer finish than goToAreaSelectAfterRun.
// - Awards gold earned (combat felt real)
// - Grants combat mastery to the champion (already fired by saveChampionState)
// - Skips area-loot, soul-shard grant, building-XP scatter
// - Skips area_clear / run_complete quest hooks (uses dedicated
//   arena_win hook for arena quests)
// - Fires the onWin callback, then returns to town.
function finishArenaRunWin(){
  stopLoops(); hideOverlays();
  if(gs && gs.conjuredCount > 0) purgeAllConjured();
  var callbacks = null;
  if(gs){
    if(typeof grantCombatMasteryXp === 'function') grantCombatMasteryXp();
    saveChampionState();
    PERSIST.gold += gs.goldEarned; gs.goldEarned = 0;
    callbacks = (gs.area && gs.area._arenaCallbacks) || null;
    // Arena quest progress hook — distinct from area_clear so regular
    // quests don't fire on arena fights.
    if(typeof checkQuestProgress === 'function'){
      checkQuestProgress('arena_win', {
        enemyId: gs.enemies && gs.enemies[0] && gs.enemies[0].id,
        context: callbacks && callbacks.context,
        contextData: callbacks && callbacks.contextData
      });
    }
    savePersist();
    gs = null;
  }
  selectedArea = null;
  _restoreTownTab();
  // Return to TOWN (not area-screen) — Arena is a town activity.
  showScreen('town-screen');
  showNav(true);
  updateNavBar('town');
  if(typeof buildTownGrid === 'function') buildTownGrid();
  // Fire caller's onWin LAST so it can show its own toast / refresh
  // the Arena panel / advance a quest / etc.
  if(callbacks && callbacks.onWin){
    try { callbacks.onWin(); } catch(e){ /* swallow — UI must not crash run-end */ }
  }
}

// Arena LOSS — no penalties (J's call). No gold lost, no level reset,
// champion stays alive. Just go home.
function finishArenaRunLoss(){
  stopLoops(); hideOverlays();
  if(gs && gs.conjuredCount > 0) purgeAllConjured();
  var callbacks = null;
  if(gs){
    if(typeof grantCombatMasteryXp === 'function') grantCombatMasteryXp();
    callbacks = (gs.area && gs.area._arenaCallbacks) || null;
    // Don't keep the in-progress XP / level on a loss — but ALSO don't
    // reset to 1. We snap stats back to the pre-run snapshot so the
    // champion is exactly as they were before entering.
    var cp = getChampPersist(gs.champId);
    if(cp && gs._snapshot){
      cp.alive = true;
      // (XP/level were never committed mid-run — saveChampionState only
      //  fires on win or doDefeat path, both of which we've bypassed.)
    }
    savePersist();
    gs = null;
  }
  selectedArea = null;
  _restoreTownTab();
  showScreen('town-screen');
  showNav(true);
  updateNavBar('town');
  if(typeof buildTownGrid === 'function') buildTownGrid();
  if(typeof showTownToast === 'function') showTownToast('Defeated. The Arena offers no scorn — return when ready.');
  if(callbacks && callbacks.onLoss){
    try { callbacks.onLoss(); } catch(e){}
  }
}

function goToAreaSelectAfterRun(){
  // Round 48: Arena fights branch off into their own completion flow —
  // no area-loot, no soul-shard grant, no area_clear quest hook, no
  // building XP scatter. Arena fights live in their own reward space
  // (sparring tick / daily reward / quest payout) handled via the
  // onWin callback stashed on the synthetic area.
  if(gs && gs.area && gs.area.isArena){
    finishArenaRunWin();
    return;
  }
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
      addLog('✦ The Vault is now open. Visit the Town!','sys');
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
  // Capture the screen we came from so Continue returns to the right place.
  // (Was hardcoded to 'area-screen', which broke the path:
  //  champ select → ℹ → View Deck → Continue → empty area-screen.)
  var cur = document.querySelector('.screen.active');
  _deckReturnScreen = (cur && cur.id) ? cur.id : 'area-screen';
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
  } else if(_deckReturnScreen==='select-screen'){
    // Came from the champion select via the ℹ panel — return there.
    showScreen('select-screen');
    showNav(true);
    updateNavBar('adventure');
  } else if(_deckReturnScreen==='town-screen'){
    showScreen('town-screen');
    showNav(true);
    updateNavBar('town');
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
  var playerActor = (typeof gs !== 'undefined' && gs && gs.actors) ? gs.actors.player : null;
  var mechanic = _resolveCardEffectHTML(id, null, playerActor);
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

// ── Card effect text generation (shared by renderHand, updateHandText, buildCardHTML, etc.) ──
function _resolveCardEffectHTML(cardId, item, actor){
  var cd = CARDS[cardId];
  if(!cd) return '';
  if(actor && cd.effects && cd.effects.length){
    try {
      var rawHtml = generateCardTextHTML(actor, cardId, item);
      if(typeof rawHtml !== 'string') rawHtml = String(rawHtml || '');
      return renderKeywords(rawHtml);
    } catch(e){}
  }
  // Fallback to static text
  var cEffect = cd.effect || '';
  var rawLines = cEffect.split('\n');
  var resolvedLines = rawLines.map(function(line){ return resolveCardEffect(line, gs, null); });
  if(item && item.critBonus){
    resolvedLines.push('<span style="color:#60c060;">+[Crit]: '+item.critBonus+'%</span>');
  }
  return renderKeywords(resolvedLines.join('<div class="card-line-sep"></div>'));
}

// ── Lightweight text-only update for cards already in the DOM ──
// Only updates .card-effect innerHTML on each card element.
// Called from gameTick when display-relevant values change.
function updateHandText(){
  if(!gs || !gs.hand) return;
  var container = document.getElementById('hand-cards');
  if(!container) return;
  var cards = container.children;
  var actor = gs.actors && gs.actors.player;
  for(var i = 0; i < cards.length && i < gs.hand.length; i++){
    var item = gs.hand[i];
    var cd = CARDS[item.id];
    var effectEl = cards[i].querySelector('.card-effect');
    if(!effectEl) continue;
    var newHtml = _resolveCardEffectHTML(item.id, item, actor);
    if(effectEl.innerHTML !== newHtml) effectEl.innerHTML = newHtml;
  }
}

function renderHand(){
  lastHandStr=gs.hand.map(function(h){return h.id+(h.ghost?'g':'');}).join(',');
  var container=document.getElementById('hand-cards');
  container.innerHTML='';
  var total=gs.hand.length;
  var actor = gs.actors && gs.actors.player;
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

    var mechanic = _resolveCardEffectHTML(item.id, item, actor);
    var cEffect = cd ? (cd.effect||'') : '';
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

// ═══════════════════════════════════════════════════════
// TOWN CODE — moved to town.js
// (Loot, Buildings, NPC Dialogue, Bestiary, Tutorials, Typewriter)
// ═══════════════════════════════════════════════════════

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
    if(screen==='deck-edit-screen'){
      // Show confirmation before leaving
      var overlay = document.getElementById('de-esc-confirm');
      if(overlay){ overlay.remove(); return; }
      overlay = document.createElement('div');
      overlay.id = 'de-esc-confirm';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;';
      var box = document.createElement('div');
      box.style.cssText = 'background:#1a0f06;border:1px solid #5a3418;border-radius:10px;padding:24px 28px;max-width:340px;text-align:center;box-shadow:0 0 40px rgba(0,0,0,.8);';
      box.innerHTML = '<div style="font-family:Cinzel,serif;font-size:12px;color:#d4a843;margin-bottom:12px;">SAVE & EXIT?</div>'
        +'<div style="font-size:9px;color:#8a6840;line-height:1.6;margin-bottom:16px;">Save changes to deck and return?</div>'
        +'<div style="display:flex;gap:10px;justify-content:center;"></div>';
      var btnRow = box.querySelector('div:last-child');
      var yesBtn = document.createElement('button');
      yesBtn.textContent = 'SAVE & EXIT';
      yesBtn.style.cssText = 'font-family:Cinzel,serif;font-size:9px;padding:8px 20px;border-radius:6px;cursor:pointer;border:1px solid #4a6020;background:rgba(10,25,8,.8);color:#70b050;letter-spacing:1px;';
      yesBtn.addEventListener('click', function(){ overlay.remove(); deDeckDone(); });
      var noBtn = document.createElement('button');
      noBtn.textContent = 'CANCEL';
      noBtn.style.cssText = 'font-family:Cinzel,serif;font-size:9px;padding:8px 20px;border-radius:6px;cursor:pointer;border:1px solid #3a2818;background:rgba(30,20,5,.5);color:#8a6840;letter-spacing:1px;';
      noBtn.addEventListener('click', function(){ overlay.remove(); });
      btnRow.appendChild(yesBtn);
      btnRow.appendChild(noBtn);
      overlay.appendChild(box);
      overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });
      document.body.appendChild(overlay);
      return;
    }
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
