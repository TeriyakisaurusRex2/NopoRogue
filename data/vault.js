// ════════════════════════════════════════════════════════════════
// VAULT — vault.js
// ════════════════════════════════════════════════════════════════
//
// Owns the Vault panel: materials dashboard, chests, keys, upgrades.
//
//   UI
//     refreshVaultPanel()           — main two-column panel render
//     openVaultPanel()              — open panel, reset state
//     closeVaultPanel()             — close panel
//     refreshVaultLevelBar()        — update XP bar (called from global tick)
//     getVaultLevel()               — current vault level
//
//   CHEST OPENING
//     openChest(chestId, keyId)     — open a chest with optional key bonus
//     rollChestTable(table)         — weighted random roll from loot table
//     showChestOverlay(items)       — animated chest reveal overlay
//     revealLootItems(items, el)    — sequential item reveal animation
//     closeChestOverlay()           — dismiss overlay
//
//   UPGRADES
//     buyVaultUpgrade(id)           — purchase an upgrade
//     convertMaterials(groupId)     — 10 common → 1 uncommon (Converter upgrade)
//
//   SELL / RECYCLE
//     sellVaultItem(lootKey)        — sell one key or chest for gold
//     recycleVaultItem(matId, qty)  — break down materials for partial value
//     getRecycleValue(matId)        — gold value per material unit
//
// Dependencies (from game.js):
//   PERSIST, LOOT_DEFS, CHEST_LOOT_TABLES, SELL_PRICES,
//   MATERIALS, MATERIAL_DROPS, VAULT_UPGRADES, getVaultMatCap,
//   addLootItem, savePersist, showTownToast, buildTownGrid,
//   showLockedBuildingUI, refreshVaultLevelBar, vaultTick
//
// ════════════════════════════════════════════════════════════════

// ── Chest loot tables ─────────────────────────────────────────────────────
// Each chest: { rolls, rolls_key, table: [{w, type, id?, qty?, tier?}] }
// rolls_key = bonus rolls when opened with matching area key
var CHEST_LOOT_TABLES={
  chest_sewers:{rolls:2,rolls_key:3,table:[
    {w:40,type:'material',id:'slick_stone',   qty:[3,8]},
    {w:19,type:'loot',    id:'key_sewers',    qty:1},
    {w:16,type:'gold',                        qty:[10,25]},
    {w:10,type:'material',id:'rancid_bile',   qty:[1,2]},
    {w:8, type:'gemShards',                   qty:1},
    {w:7, type:'champcard',                   qty:1},
  ]},
  chest_bog:{rolls:2,rolls_key:3,table:[
    {w:35,type:'material',id:'bog_iron',      qty:[4,10]},
    {w:17,type:'loot',    id:'key_bog',       qty:1},
    {w:16,type:'gold',                        qty:[15,35]},
    {w:12,type:'material',id:'leech_oil',     qty:[1,3]},
    {w:8, type:'gemShards',                   qty:1},
    {w:12,type:'champcard',                   qty:1},
  ]},
  chest_crypt:{rolls:2,rolls_key:3,table:[
    {w:33,type:'material',id:'bone_dust',     qty:[5,12]},
    {w:15,type:'loot',    id:'key_crypt',     qty:1},
    {w:18,type:'gold',                        qty:[15,40]},
    {w:13,type:'material',id:'grave_iron',    qty:[2,4]},
    {w:8, type:'gemShards',                   qty:1},
    {w:13,type:'champcard',                   qty:1},
  ]},
  chest_forest:{rolls:3,rolls_key:4,table:[
    {w:29,type:'material',id:'thornwood_resin',qty:[6,14]},
    {w:12,type:'loot',    id:'key_forest',    qty:1},
    {w:18,type:'gold',                        qty:[20,50]},
    {w:16,type:'material',id:'harpy_talon',   qty:[2,5]},
    {w:8, type:'gemShards',                   qty:[1,2]},
    {w:17,type:'champcard',                   qty:[1,2]},
  ]},
  chest_cave:{rolls:3,rolls_key:4,table:[
    {w:27,type:'material',id:'thornwood_resin',qty:[7,15]},
    {w:12,type:'loot',    id:'key_cave',      qty:1},
    {w:18,type:'gold',                        qty:[20,55]},
    {w:16,type:'material',id:'harpy_talon',   qty:[3,6]},
    {w:8, type:'gemShards',                   qty:[1,2]},
    {w:19,type:'champcard',                   qty:[1,2]},
  ]},
  chest_ruins:{rolls:4,rolls_key:5,table:[
    {w:22,type:'material',id:'stone_cipher',  qty:[8,18]},
    {w:9, type:'loot',    id:'key_ruins',     qty:1},
    {w:18,type:'gold',                        qty:[30,70]},
    {w:14,type:'material',id:'vault_bronze',  qty:[3,7]},
    {w:10,type:'material',id:'arcane_residue',qty:[1,2]},
    {w:8, type:'gemShards',                   qty:[1,2]},
    {w:19,type:'champcard',                   qty:[1,2]},
  ]},
  chest_dragon:{rolls:4,rolls_key:5,table:[
    {w:20,type:'material',id:'dragonscale',   qty:[4,9]},
    {w:9, type:'loot',    id:'key_dragon',    qty:1},
    {w:18,type:'gold',                        qty:[35,80]},
    {w:18,type:'material',id:'smelt_slag',    qty:[1,3]},
    {w:9, type:'material',id:'ember_grit',    qty:[10,20]},
    {w:12,type:'gemShards',                   qty:[2,3]},
    {w:14,type:'champcard',                   qty:[1,2]},
  ]},
  chest_bone:{rolls:4,rolls_key:5,table:[
    {w:20,type:'material',id:'grave_iron',    qty:[4,9]},
    {w:9, type:'loot',    id:'key_bone',      qty:1},
    {w:18,type:'gold',                        qty:[35,80]},
    {w:18,type:'material',id:'cursed_essence',qty:[1,3]},
    {w:9, type:'material',id:'bone_dust',     qty:[10,20]},
    {w:12,type:'gemShards',                   qty:[2,3]},
    {w:14,type:'champcard',                   qty:[1,2]},
  ]},
  chest_astral:{rolls:5,rolls_key:6,table:[
    {w:14,type:'material',id:'null_stone',    qty:[2,5]},
    {w:7, type:'loot',    id:'key_astral',    qty:1},
    {w:16,type:'gold',                        qty:[50,120]},
    {w:14,type:'material',id:'mist_silk',     qty:[5,12]},
    {w:11,type:'material',id:'void_splinter', qty:[15,30]},
    {w:12,type:'gemShards',                   qty:[2,4]},
    {w:26,type:'champcard',                   qty:[2,3]},
  ]},
  chest_mist:{rolls:2,rolls_key:3,table:[
    {w:33,type:'material',id:'thornwood_resin',qty:[5,12]},
    {w:17,type:'loot',    id:'key_mist',      qty:1},
    {w:16,type:'gold',                        qty:[15,40]},
    {w:13,type:'material',id:'harpy_talon',   qty:[1,3]},
    {w:8, type:'gemShards',                   qty:1},
    {w:13,type:'champcard',                   qty:1},
  ]},
  chest_wax:{rolls:2,rolls_key:3,table:[
    {w:36,type:'material',id:'amber_wax',     qty:[4,10]},
    {w:19,type:'loot',    id:'key_wax',       qty:1},
    {w:19,type:'gold',                        qty:[12,30]},
    {w:8, type:'material',id:'wax_crystal',   qty:[1,2]},
    {w:5, type:'gemShards',                   qty:1},
    {w:13,type:'champcard',                   qty:1},
  ]},
};


function openVaultPanel(){
  var msgEl = document.getElementById('vault-npc-msg');
  if(msgEl){
    var greetings = [
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
    ];
    var rare = 'I didn\'t shteal anything.';
    var msg = (Math.random() < 0.08) ? rare : greetings[Math.floor(Math.random() * greetings.length)];
    npcTypewriter(msgEl, msg, {pitch: BUILDINGS.vault.npc.pitch || 0.85});
  }
  refreshVaultPanel();
  document.getElementById('vault-panel-bg').classList.add('show');
}

function closeVaultPanel(){
  npcTypewriterStop();
  document.getElementById('vault-panel-bg').classList.remove('show');
  buildTownGrid();
}

function getVaultLevel(){
  return (PERSIST.town.buildingLevel&&PERSIST.town.buildingLevel.vault)||1;
}

function refreshVaultLevelBar(){
  var lv=getVaultLevel();
  var xp=(PERSIST.town.buildingXp&&PERSIST.town.buildingXp.vault)||0;
  var xpNext=getBuildingXpToNext(lv);
  var pct=Math.min(100,Math.round((xp/xpNext)*100));
  var badge=document.getElementById('vault-level-badge');
  var bar=document.getElementById('vault-xp-bar');
  var txt=document.getElementById('vault-xp-txt');
  if(badge) badge.textContent='VAULT Lv.'+lv;
  if(bar) bar.style.width=pct+'%';
  if(txt) txt.textContent=xp+'/'+xpNext+' XP';
}

var _vaultTab = 'materials';

function switchVaultTab(tab){
  _vaultTab = tab;
  document.querySelectorAll('.vault-tab').forEach(function(el){ el.classList.remove('active'); });
  var tabEl = document.getElementById('vtab-'+tab);
  if(tabEl) tabEl.classList.add('active');
  refreshVaultPanel();
}

function refreshVaultPanel(){
  showLockedBuildingUI('vault');
  var b=PERSIST.town.buildings.vault;
  if(!b||!b.unlocked) return;
  refreshVaultLevelBar();

  var inner=document.getElementById('vault-body-inner');
  if(!inner) return;

  if(_vaultTab === 'inventory'){
    inner.innerHTML = renderVaultInventory();
    // Upgrades footer still shows
    var footerEl = document.getElementById('vault-upgrades-footer');
    if(footerEl) footerEl.style.display = 'flex';
    renderVaultUpgradesFooter();
    return;
  }

  // ── MATERIALS TAB — Forge Ledger Layout ──
  var u=PERSIST.town.vaultUpgrades||{};
  var cap=getVaultMatCap();

  // Gather area data
  var groups=Object.keys(MATERIAL_DROPS);
  var totalAreas = AREA_DEFS.filter(function(a){ return a.id !== 'dojo'; }).length;
  var visitedAreas = 0;
  var totalMats = 0;
  var atCapCount = 0;

  var areaData = [];
  groups.forEach(function(groupId){
    var entries = MATERIAL_DROPS[groupId];
    var areas = AREA_DEFS.filter(function(a){ return a.materialGroup === groupId; });
    var areaNames = areas.map(function(a){ return a.name; }).join(' · ');
    var visited = areas.some(function(a){ return (PERSIST.areaRuns[a.id]||0) > 0; });
    var runs = 0;
    areas.forEach(function(a){ runs += (PERSIST.areaRuns[a.id]||0); });
    if(visited) visitedAreas++;

    var mats = [];
    var rowAtCap = false;
    entries.forEach(function(entry){
      var mat = MATERIALS[entry.id]; if(!mat) return;
      var qty = PERSIST.town.materials[entry.id] || 0;
      var pct = Math.min(100, Math.round((qty/cap)*100));
      var isCap = qty >= cap;
      if(isCap){ atCapCount++; rowAtCap = true; }
      totalMats++;
      mats.push({ id:entry.id, name:mat.name, icon:mat.icon, rarity:mat.rarity||'common', qty:qty, cap:cap, pct:pct, atCap:isCap });
    });

    var areaIcon = '';
    var areaBg = '';
    var areaIds = [];
    areas.forEach(function(a){
      if(a.icon) areaIcon = a.icon;
      areaIds.push(a.id);
    });
    // Use first area's ID for background image
    if(areaIds.length > 0) areaBg = areaIds[0];

    areaData.push({
      groupId: groupId,
      areaNames: areaNames,
      areaIcon: areaIcon,
      areaBg: areaBg,
      visited: visited,
      runs: runs,
      materials: mats,
      hasAtCap: rowAtCap,
      converterUnlocked: !!u.converter,
    });
  });

  // Top bar with tally chips
  var html = '<div class="vault-top-bar">'
    +'<span class="vault-tally">AREAS <span class="vault-tally-val">'+visitedAreas+'/'+totalAreas+'</span></span>'
    +'<span class="vault-tally">MATERIALS <span class="vault-tally-val">'+totalMats+'</span></span>'
    +(atCapCount > 0 ? '<span class="vault-tally">AT CAP <span class="vault-tally-danger">'+atCapCount+'</span></span>' : '')
    +'<span style="flex:1;"></span>'
    +'<span class="vault-tally">CAP: <span class="vault-tally-val">'+cap+'</span> PER MATERIAL</span>'
    +'</div>';

  // Column headers
  html += '<div class="vault-col-headers">'
    +'<div class="vault-col-identity"></div>'
    +'<div class="vault-col-materials">'
      +'<div class="vault-col-hdr">COMMON</div>'
      +'<div class="vault-col-hdr">UNCOMMON</div>'
      +'<div class="vault-col-hdr">RARE</div>'
    +'</div>'
    +'<div class="vault-col-converter vault-col-hdr">CONVERTER</div>'
    +'</div>';

  // Area rows
  areaData.forEach(function(area){
    if(!area.visited){
      // Locked row
      html += '<div class="vault-area-row locked">'
        +'<div class="vault-accent"></div>'
        +'<div class="vault-area-identity">'
          +'<div class="vault-area-name" style="color:#3a2810;">???</div>'
          +'<div class="vault-area-sub">Unexplored</div>'
        +'</div>'
        +'<div class="vault-col-materials" style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">'
          +'<div style="text-align:center;"><div class="vault-locked-sigil">?</div></div>'
          +'<div style="text-align:center;"><div class="vault-locked-sigil">?</div></div>'
          +'<div style="text-align:center;"><div class="vault-locked-sigil">?</div></div>'
        +'</div>'
        +'<div class="vault-converter-cell"><span style="font-size:16px;opacity:.3;">🔒</span></div>'
        +'</div>';
      return;
    }

    var rowCls = 'vault-area-row' + (area.hasAtCap ? ' has-cap' : '');
    var areaIconHtml = '<img src="assets/icons/areas/'+area.areaBg+'.png" class="area-icon-sprite" onerror="this.outerHTML=\'<span class=area-icon>'+area.areaIcon+'</span>\'">';
    html += '<div class="'+rowCls+'">'
      +'<div class="vault-accent"></div>'
      +'<div class="vault-area-identity">'
        +'<div class="vault-area-identity-bg" style="background-image:url(\'assets/backgrounds/'+area.areaBg+'.png\');"></div>'
        +'<div class="vault-area-identity-content">'
          +'<div class="vault-area-name">'+areaIconHtml+' '+area.areaNames+'</div>'
          +'<div class="vault-area-sub">'+area.groupId+'</div>'
          +'<div class="vault-area-runs">'+area.runs+' RUN'+(area.runs!==1?'S':'')+'</div>'
        +'</div>'
      +'</div>'
      +'<div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">';

    // Material cells (common, uncommon, rare)
    area.materials.forEach(function(mat){
      var cellCls = 'vault-mat-cell' + (mat.atCap ? ' at-cap' : '');
      var fillCls = mat.atCap ? 'vault-fill-cap' : 'vault-fill-'+mat.rarity;
      var matIconHtml = '<img src="assets/icons/materials/'+mat.id+'.png" class="mat-icon-sprite" onerror="this.outerHTML=\'<span class=vault-mat-glyph>'+mat.icon+'</span>\'">';
      html += '<div class="'+cellCls+'">'
        +'<div class="vault-mat-cell-top">'
          +matIconHtml
          +'<span class="vault-mat-name vault-mat-name-'+mat.rarity+'">'+mat.name+'</span>'
        +'</div>'
        +'<div class="vault-fill-track"><div class="vault-fill-bar '+fillCls+'" style="width:'+mat.pct+'%"></div></div>'
        +'<div style="display:flex;align-items:center;gap:4px;margin-top:3px;">'
          +'<span class="vault-mat-count">'+mat.qty+'</span>'
          +'<span class="vault-mat-count-cap">/'+mat.cap+'</span>'
          +(mat.atCap ? '<span class="vault-mat-full-pill">● FULL</span>' : '')
        +'</div>'
        +'</div>';
    });

    html += '</div>';

    // Converter cell
    html += '<div class="vault-converter-cell">';
    if(area.converterUnlocked && area.materials.length >= 2){
      var common = area.materials.find(function(m){ return m.rarity === 'common'; });
      var uncommon = area.materials.find(function(m){ return m.rarity === 'uncommon'; });
      if(common && uncommon){
        var canConvert = common.qty >= 10;
        html += '<button class="vault-convert-btn" '
          +(canConvert ? 'onclick="convertMaterials(\''+area.groupId+'\')"' : 'disabled')+'>'
          +(canConvert ? '10 → 1' : '10 → 1')
          +'</button>';
      }
    } else if(!area.converterUnlocked){
      html += '<span style="font-size:16px;opacity:.3;">🔒</span>';
    }
    html += '</div>';

    html += '</div>';
  });

  inner.innerHTML = html;
  renderVaultUpgradesFooter();
}

function renderVaultUpgradesFooter(){
  var u=PERSIST.town.vaultUpgrades||{};
  var lv = getVaultLevel();
  // ── Upgrades footer (anchored, not scrollable) ──
  var footerEl = document.getElementById('vault-upgrades-footer');
  if(footerEl){
    var upgHtml = '<span class="vault-upgrades-title">UPGRADES</span>';

    VAULT_UPGRADES.forEach(function(upg){
      var owned = !!(u[upg.id]);
      var meetsReq = !upg.requires || !!(u[upg.requires]);
      var meetsLevel = lv >= (upg.minLevel||1);
      var canAfford = PERSIST.gold >= upg.cost;

      if(owned){
        upgHtml += '<div class="vault-upg-chip owned" title="'+upg.effect+'">✓ '+upg.label+'</div>';
      } else if(meetsReq && meetsLevel){
        upgHtml += '<div class="vault-upg-chip available" onclick="buyVaultUpgrade(\''+upg.id+'\')" title="'+upg.effect+'">'
          +upg.label+' · '+(canAfford ? '✦'+upg.cost+'g' : 'Need '+upg.cost+'g')
          +'</div>';
      } else {
        var reason = !meetsLevel ? 'Vault Lv.'+upg.minLevel : 'Requires '+upg.requires;
        upgHtml += '<div class="vault-upg-chip locked" title="'+reason+'">🔒 '+upg.label+'</div>';
      }
    });

    footerEl.innerHTML = upgHtml;
    footerEl.style.display = 'flex';
  }
}

// ── Inventory Tab ──

function renderVaultInventory(){
  var u=PERSIST.town.vaultUpgrades||{};
  var items = PERSIST.town.items || {};
  var relics = PERSIST.town.relics || {};

  // Categorise items
  var categories = [
    { id:'chests', label:'CHESTS', icon:'📦', items:[] },
    { id:'keys', label:'KEYS', icon:'🗝️', items:[] },
    { id:'gems', label:'GEMS', icon:'💎', items:[] },
    { id:'tokens', label:'SUMMON TOKENS', icon:'🎟️', items:[] },
    { id:'relics', label:'RELICS', icon:'⚗️', items:[] },
    { id:'misc', label:'OTHER', icon:'📋', items:[] },
  ];

  // Sort LOOT_DEFS items into categories
  Object.keys(items).forEach(function(itemId){
    var qty = items[itemId] || 0;
    if(qty <= 0) return;
    var def = (typeof LOOT_DEFS !== 'undefined' && LOOT_DEFS[itemId]) || null;
    var entry = { id:itemId, qty:qty, name:def?def.name:itemId, icon:def?def.icon:'❓', type:def?def.type:'misc' };

    if(entry.type === 'chest') categories[0].items.push(entry);
    else if(entry.type === 'key') categories[1].items.push(entry);
    else if(entry.type === 'gem') categories[2].items.push(entry);
    else if(entry.type === 'token' || entry.type === 'summon_token') categories[3].items.push(entry);
    else categories[5].items.push(entry);
  });

  // Relics (unequipped, in town inventory)
  Object.keys(relics).forEach(function(relicId){
    var qty = relics[relicId] || 0;
    if(qty <= 0) return;
    var def = (typeof RELICS !== 'undefined' && RELICS[relicId]) || null;
    categories[4].items.push({ id:relicId, qty:qty, name:def?def.name:relicId, icon:def?def.icon:'⚗️', type:'relic' });
  });

  // Gems from persist (if stored separately)
  // Future: PERSIST.gems or similar

  // Count total items
  var totalItems = 0;
  categories.forEach(function(cat){ totalItems += cat.items.length; });

  var html = '<div class="vault-top-bar">'
    +'<span class="vault-tally">ITEMS <span class="vault-tally-val">'+totalItems+'</span></span>'
    +'<span style="flex:1;"></span>'
    +(u.sellDesk ? '<span class="vault-tally" style="color:#70a030;">SELL DESK ACTIVE</span>' : '')
    +'</div>';

  if(totalItems === 0){
    html += '<div style="padding:40px 20px;text-align:center;">'
      +'<div style="font-size:24px;margin-bottom:12px;opacity:.4;">📦</div>'
      +'<div style="font-family:Cinzel,serif;font-size:10px;color:#3a2810;letter-spacing:2px;">INVENTORY EMPTY</div>'
      +'<div style="font-size:9px;color:#2a1808;margin-top:6px;">Items from runs, chests, and rewards will appear here.</div>'
      +'</div>';
    return html;
  }

  // Render each non-empty category
  categories.forEach(function(cat){
    if(cat.items.length === 0) return;

    html += '<div class="vault-inv-category">'
      +'<div class="vault-inv-cat-header">'+cat.icon+' '+cat.label+'</div>'
      +'<div class="vault-inv-cat-grid">';

    cat.items.forEach(function(item){
      var actions = '';
      if(u.sellDesk){
        var price = (typeof getSellPrice === 'function') ? getSellPrice({lootKey:item.id}) : 5;
        actions += '<button class="vault-inv-action" onclick="event.stopPropagation();sellVaultItem(\''+item.id+'\')">SELL '+price+'g</button>';
      }
      if(item.type === 'relic'){
        actions += '<button class="vault-inv-action vault-inv-action-go" onclick="event.stopPropagation();closeBuildingPanel(\'vault\');openBuilding(\'sanctum\')">EQUIP →</button>';
      }
      if(item.type === 'gem'){
        actions += '<button class="vault-inv-action vault-inv-action-go" onclick="event.stopPropagation();closeBuildingPanel(\'vault\');openBuilding(\'sanctum\')">ASCEND →</button>';
      }
      if(item.type === 'token' || item.type === 'summon_token'){
        actions += '<button class="vault-inv-action vault-inv-action-go" onclick="event.stopPropagation();closeBuildingPanel(\'vault\');openBuilding(\'shard_well\')">SUMMON →</button>';
      }
      if(item.type === 'chest'){
        var hasKey = (typeof _chestHasKey === 'function') && _chestHasKey(item.id);
        if(hasKey){
          var keyId = (typeof _findKeyForChest === 'function') ? _findKeyForChest(item.id) : null;
          actions += '<button class="vault-inv-action vault-inv-action-go" onclick="event.stopPropagation();openChest(\''+item.id+'\',\''+keyId+'\')">OPEN</button>';
        }
      }

      html += '<div class="vault-inv-item">'
        +'<div class="vault-inv-item-icon">'+item.icon+'</div>'
        +'<div class="vault-inv-item-info">'
          +'<div class="vault-inv-item-name">'+item.name+'</div>'
          +'<div class="vault-inv-item-qty">×'+item.qty+'</div>'
        +'</div>'
        +(actions ? '<div class="vault-inv-item-actions">'+actions+'</div>' : '')
        +'</div>';
    });

    html += '</div></div>';
  });

  return html;
}

// ── Helpers ──

function _chestHasKey(chestId){
  var def=LOOT_DEFS[chestId];
  if(!def||!def.biome) return false;
  return Object.keys(LOOT_DEFS).some(function(k){
    return LOOT_DEFS[k].type==='key'
      && LOOT_DEFS[k].biome===def.biome
      && (PERSIST.town.items[k]||0)>0;
  });
}

function _findKeyForChest(chestId){
  var def=LOOT_DEFS[chestId];
  if(!def||!def.biome) return null;
  return Object.keys(LOOT_DEFS).find(function(k){
    return LOOT_DEFS[k].type==='key'
      && LOOT_DEFS[k].biome===def.biome
      && (PERSIST.town.items[k]||0)>0;
  })||null;
}

function _biomeHint(chestId){
  var def=LOOT_DEFS[chestId];
  return def&&def.biome ? def.biome : 'this area';
}

function openAllChests(){
  var chests=Object.keys(LOOT_DEFS).filter(function(k){
    return LOOT_DEFS[k].type==='chest'
      && (PERSIST.town.items[k]||0)>0
      && _chestHasKey(k);
  });
  if(!chests.length) return;
  // Open one at a time; each openChest handles its own overlay
  // For "open all" we batch them after a short delay chain
  var idx=0;
  function next(){
    if(idx>=chests.length){ savePersist(); buildTownGrid(); return; }
    var cid=chests[idx++];
    var kid=_findKeyForChest(cid);
    if(kid) openChest(cid,kid);
    // Chain next after overlay dismiss is handled manually
  }
  next();
}

function buyVaultUpgrade(id){
  var upg=VAULT_UPGRADES.find(function(u){return u.id===id;});
  if(!upg) return;
  var u=PERSIST.town.vaultUpgrades||{};
  if(u[id]){ showTownToast('Already owned.'); return; }
  if(upg.requires&&!u[upg.requires]){ showTownToast('Requires '+upg.requires+' first.'); return; }
  var lv=getVaultLevel();
  if(lv<(upg.minLevel||1)){ showTownToast('Needs Vault Lv.'+upg.minLevel+'.'); return; }
  if(PERSIST.gold<upg.cost){ showTownToast('Need ✦'+upg.cost+' gold.'); return; }
  PERSIST.gold-=upg.cost;
  PERSIST.town.vaultUpgrades[id]=true;
  savePersist();
  showTownToast('✦ '+upg.label+' unlocked!');
  refreshVaultPanel();
  buildTownGrid();
}

function convertMaterials(groupId){
  var entries=MATERIAL_DROPS[groupId]; if(!entries) return;
  var commonEntry=entries.find(function(e){return MATERIALS[e.id]&&MATERIALS[e.id].rarity==='common';});
  var uncommonEntry=entries.find(function(e){return MATERIALS[e.id]&&MATERIALS[e.id].rarity==='uncommon';});
  if(!commonEntry||!uncommonEntry) return;
  if((PERSIST.town.materials[commonEntry.id]||0)<10){
    showTownToast('Need 10 '+MATERIALS[commonEntry.id].name+'.'); return;
  }
  PERSIST.town.materials[commonEntry.id]-=10;
  PERSIST.town.materials[uncommonEntry.id]=(PERSIST.town.materials[uncommonEntry.id]||0)+1;
  savePersist();
  showTownToast(MATERIALS[uncommonEntry.id].name+' crafted!');
  refreshVaultPanel();
}

function getSellPrice(item){
  var key=item.lootKey||item.matKey||'';
  return SELL_PRICES[key]||0;
}

function sellVaultItem(lootKey){
  var u=PERSIST.town.vaultUpgrades||{};
  if(!u.sellDesk){ showTownToast('Sell Desk not unlocked.'); return; }
  var count=PERSIST.town.items[lootKey]||0;
  if(!count){ showTownToast('None in inventory.'); return; }
  var price=SELL_PRICES[lootKey]||0;
  if(!price){ showTownToast('This item has no sale value.'); return; }
  PERSIST.town.items[lootKey]--;
  if(PERSIST.town.items[lootKey]<=0) delete PERSIST.town.items[lootKey];
  PERSIST.gold+=price;
  savePersist();
  showTownToast('Sold for ✦'+price+'g.');
  refreshVaultPanel();
  buildTownGrid();
}

function getRecycleValue(matId){
  return SELL_PRICES[matId]||0;
}

function recycleVaultItem(matId, qty){
  var u=PERSIST.town.vaultUpgrades||{};
  if(!u.recycle){ showTownToast('Recycling Bin not unlocked.'); return; }
  qty=qty||1;
  var have=PERSIST.town.materials[matId]||0;
  if(have<qty){ showTownToast('Not enough.'); return; }
  var val=getRecycleValue(matId)*qty;
  PERSIST.town.materials[matId]-=qty;
  PERSIST.gold+=val;
  savePersist();
  showTownToast('Recycled for ✦'+val+'g.');
  refreshVaultPanel();
}

// ── Chest opening ──

function rollChestTable(tableEntry){
  var total=tableEntry.reduce(function(s,e){return s+e.w;},0);
  var r=Math.random()*total,cum=0;
  for(var i=0;i<tableEntry.length;i++){ cum+=tableEntry[i].w; if(r<=cum) return tableEntry[i]; }
  return tableEntry[tableEntry.length-1];
}

function openChest(chestId, keyId){
  var def=LOOT_DEFS[chestId];
  var tbl=CHEST_LOOT_TABLES[chestId];
  if(!def||!tbl){ showTownToast('Unknown chest.'); return; }
  var count=PERSIST.town.items[chestId]||0;
  if(!count){ showTownToast('No '+def.name+' in inventory.'); return; }

  // Spend chest
  PERSIST.town.items[chestId]--;
  if(PERSIST.town.items[chestId]<=0) delete PERSIST.town.items[chestId];

  // Spend key if provided
  var rolls=tbl.rolls;
  if(keyId){
    var keyCount=PERSIST.town.items[keyId]||0;
    if(keyCount>0){
      PERSIST.town.items[keyId]--;
      if(PERSIST.town.items[keyId]<=0) delete PERSIST.town.items[keyId];
      rolls=tbl.rolls_key||tbl.rolls;
    }
  }

  // Roll loot
  var gained=[];
  for(var i=0;i<rolls;i++){
    var entry=rollChestTable(tbl.table);
    gained.push(entry);
    _applyChestEntry(entry);
  }

  savePersist();
  buildTownGrid();
  showChestOverlay(def, gained);
}

function _applyChestEntry(entry){
  if(entry.type==='gold'){
    var g=Array.isArray(entry.qty)?entry.qty[0]+Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1)):entry.qty;
    PERSIST.gold+=g;
  } else if(entry.type==='material'){
    var q=Array.isArray(entry.qty)?entry.qty[0]+Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1)):entry.qty;
    PERSIST.town.materials[entry.id]=(PERSIST.town.materials[entry.id]||0)+q;
  } else if(entry.type==='loot'||entry.type==='lootbatch'){
    var qty2=Array.isArray(entry.qty)?entry.qty[0]+Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1)):entry.qty;
    addLootItem(entry.id, qty2);
  } else if(entry.type==='gemShards'){
    var qs=Array.isArray(entry.qty)?entry.qty[0]+Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1)):entry.qty;
    PERSIST.soulShards=(PERSIST.soulShards||0)+qs;
  } else if(entry.type==='champcard'){
    var qc=Array.isArray(entry.qty)?entry.qty[0]+Math.floor(Math.random()*(entry.qty[1]-entry.qty[0]+1)):entry.qty;
    PERSIST.champDupes=PERSIST.champDupes||{};
    var pool=PERSIST.unlockedChamps;
    if(pool.length){ var cid=pool[Math.floor(Math.random()*pool.length)]; PERSIST.champDupes[cid]=(PERSIST.champDupes[cid]||0)+qc; }
  }
}

function showChestOverlay(def, entries){
  var overlay=document.getElementById('chest-overlay');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='chest-overlay';
    overlay.style.cssText='position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;';
    overlay.onclick=function(e){ if(e.target===overlay) closeChestOverlay(); };
    document.body.appendChild(overlay);
  }
  var inner=document.createElement('div');
  inner.style.cssText='background:#0e0601;border:2px solid #c09030;border-radius:12px;padding:22px 26px;min-width:240px;max-width:320px;text-align:center;';
  inner.innerHTML='<div style="font-family:Cinzel,serif;font-size:13px;color:#d4a843;letter-spacing:2px;margin-bottom:4px;">'+def.name.toUpperCase()+'</div>'
    +'<div style="font-size:28px;margin-bottom:14px;">'+def.icon+'</div>'
    +'<div id="chest-drops" style="display:flex;flex-direction:column;gap:5px;margin-bottom:14px;"></div>'
    +'<button onclick="closeChestOverlay()" style="font-family:Cinzel,serif;font-size:9px;padding:7px 20px;border-radius:4px;border:1px solid #c09030;background:rgba(40,22,4,.9);color:#d4a843;cursor:pointer;letter-spacing:1px;">COLLECT</button>';
  overlay.innerHTML='';
  overlay.appendChild(inner);
  overlay.style.display='flex';
  revealLootItems(entries, document.getElementById('chest-drops'));
}

function revealLootItems(entries, el){
  var delay=0;
  entries.forEach(function(entry){
    setTimeout(function(){
      if(!el) return;
      var icon='', text='', qty='';
      if(entry.type==='gold'){
        var g=Array.isArray(entry.qty)?Math.round((entry.qty[0]+entry.qty[1])/2):entry.qty;
        icon='✦'; text='Gold'; qty='+'+g+'g';
      } else if(entry.type==='material'){
        var m=MATERIALS[entry.id];
        var q=Array.isArray(entry.qty)?Math.round((entry.qty[0]+entry.qty[1])/2):entry.qty;
        icon=m?m.icon:'?'; text=m?m.name:entry.id; qty='+'+q;
      } else if(entry.type==='loot'||entry.type==='lootbatch'){
        var ld=LOOT_DEFS[entry.id];
        icon=ld?ld.icon:'🗝️'; text=ld?ld.name:entry.id; qty='×'+(Array.isArray(entry.qty)?entry.qty[0]:entry.qty);
      } else if(entry.type==='gemShards'){
        icon='💎'; text='Soul Shards'; qty='+'+(Array.isArray(entry.qty)?entry.qty[0]:entry.qty);
      } else if(entry.type==='champcard'){
        icon='✦'; text='Champion Token'; qty='×1';
      } else { return; }
      var row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:10px;background:rgba(20,10,2,.8);border:1px solid #2a1808;border-radius:4px;padding:5px 10px;opacity:0;transition:opacity .25s;';
      row.innerHTML='<span style="font-size:16px;">'+icon+'</span>'
        +'<span style="font-family:Cinzel,serif;font-size:9px;color:#8a6030;flex:1;text-align:left;">'+text+'</span>'
        +'<span style="font-family:Cinzel,serif;font-size:10px;color:#d4a843;">'+qty+'</span>';
      el.appendChild(row);
      requestAnimationFrame(function(){ row.style.opacity='1'; });
    }, delay);
    delay+=160;
  });
}

function closeChestOverlay(){
  var o=document.getElementById('chest-overlay');
  if(o) o.style.display='none';
  refreshVaultPanel();
}


function clearVaultInspector(){ /* replaced by new vault layout */ }
function vaultPageChange(){ /* replaced by new vault layout */ }
