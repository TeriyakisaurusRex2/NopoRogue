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
  refreshVaultPanel();
  document.getElementById('vault-panel-bg').classList.add('show');
}

function closeVaultPanel(){
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

function refreshVaultPanel(){
  showLockedBuildingUI('vault');
  var b=PERSIST.town.buildings.vault;
  if(!b||!b.unlocked) return;
  refreshVaultLevelBar();

  var inner=document.getElementById('vault-body-inner');
  if(!inner) return;

  var u=PERSIST.town.vaultUpgrades||{};
  var cap=getVaultMatCap();
  var lv=getVaultLevel();

  // ── LEFT: chests and keys ──
  var chests=Object.keys(LOOT_DEFS).filter(function(k){
    return LOOT_DEFS[k].type==='chest' && (PERSIST.town.items[k]||0)>0;
  });
  var keys=Object.keys(LOOT_DEFS).filter(function(k){
    return LOOT_DEFS[k].type==='key' && (PERSIST.town.items[k]||0)>0;
  });
  // Chests that have no matching key
  var lockedChests=Object.keys(LOOT_DEFS).filter(function(k){
    return LOOT_DEFS[k].type==='chest'
      && (PERSIST.town.items[k]||0)>0
      && !_chestHasKey(k);
  });

  var leftHtml='<div class="vault-section-lbl">CHESTS</div>';
  if(chests.length===0){
    leftHtml+='<div class="vault-empty-hint">No chests yet — complete runs and open areas to find them.</div>';
  } else {
    chests.forEach(function(chestId){
      var def=LOOT_DEFS[chestId];
      var count=PERSIST.town.items[chestId]||0;
      var hasKey=_chestHasKey(chestId);
      var keyId=_findKeyForChest(chestId);
      leftHtml+='<div class="vault-chest-row'+(hasKey?'':' vault-chest-no-key')+'" '
        +(hasKey?'onclick="openChest(\''+chestId+'\',\''+keyId+'\')"':'')+'>'
        +'<span class="vault-chest-icon">'+def.icon+'</span>'
        +'<div class="vault-chest-info">'
          +'<div class="vault-chest-name">'+def.name+'</div>'
          +(hasKey
            ?'<div class="vault-chest-key">🗝️ '+LOOT_DEFS[keyId].name+'</div>'
            :'<div class="vault-chest-nokey">No key — explore '+_biomeHint(chestId)+'</div>')
        +'</div>'
        +'<span class="vault-chest-count">×'+count+'</span>'
        +(u.sellDesk&&hasKey?'<button class="vault-sell-btn" onclick="event.stopPropagation();sellVaultItem(\''+chestId+'\')">SELL '+getSellPrice({lootKey:chestId})+'g</button>':'')
        +'</div>';
    });
    // Open all button — only if any chest has a key
    var openableCount=chests.filter(function(k){return _chestHasKey(k);}).length;
    if(openableCount>0){
      leftHtml+='<button class="vault-open-all-btn" onclick="openAllChests()">OPEN ALL WITH KEYS →</button>';
    }
  }

  leftHtml+='<div class="vault-divider"></div><div class="vault-section-lbl">KEYS</div>';
  if(keys.length===0){
    leftHtml+='<div class="vault-empty-hint">Keys drop from runs in each area.</div>';
  } else {
    keys.forEach(function(keyId){
      var def=LOOT_DEFS[keyId];
      var count=PERSIST.town.items[keyId]||0;
      leftHtml+='<div class="vault-key-row">'
        +'<span class="vault-key-icon">🗝️</span>'
        +'<span class="vault-key-name">'+def.name+'</span>'
        +'<span class="vault-key-count">×'+count+'</span>'
        +(u.sellDesk?'<button class="vault-sell-btn" onclick="sellVaultItem(\''+keyId+'\')">'+getSellPrice({lootKey:keyId})+'g</button>':'')
        +'</div>';
    });
  }

  // ── RIGHT: materials by group ──
  var rightHtml='<div class="vault-section-lbl" style="display:flex;justify-content:space-between;align-items:center;">'
    +'<span>MATERIALS</span>'
    +'<span class="vault-cap-note">cap: '+cap+' per group</span>'
    +'</div>';

  // Build group data from MATERIAL_DROPS keys
  var groups=Object.keys(MATERIAL_DROPS);
  groups.forEach(function(groupId){
    var entries=MATERIAL_DROPS[groupId];
    var hasAny=entries.some(function(e){return (PERSIST.town.materials[e.id]||0)>0;});
    // Check if player has visited any area with this group
    var visited=AREA_DEFS.some(function(a){
      return a.materialGroup===groupId && (PERSIST.areaRuns[a.id]||0)>0;
    });

    if(!visited){
      rightHtml+='<div class="vault-mat-group vault-mat-group-unknown">'
        +'<div class="vault-mat-group-name">'+groupId.toUpperCase()+' <span class="vault-mat-group-areas">— unexplored</span></div>'
        +'<div class="vault-mat-unknown-hint">Run in a '+groupId+' area to discover these materials.</div>'
        +'</div>';
      return;
    }

    // Area names for this group
    var areaNames=AREA_DEFS.filter(function(a){return a.materialGroup===groupId;})
      .map(function(a){return a.name;}).join(' · ');

    rightHtml+='<div class="vault-mat-group">'
      +'<div class="vault-mat-group-name">'+groupId.toUpperCase()
        +' <span class="vault-mat-group-areas">'+areaNames+'</span>'
      +'</div>';

    entries.forEach(function(entry){
      var mat=MATERIALS[entry.id]; if(!mat) return;
      var qty=PERSIST.town.materials[entry.id]||0;
      var pct=Math.min(100,Math.round((qty/cap)*100));
      var atCap=qty>=cap;
      var rarity=mat.rarity||'common';
      rightHtml+='<div class="vault-mat-row'+(atCap?' vault-mat-at-cap':'')+'">'
        +'<span class="vault-mat-icon">'+mat.icon+'</span>'
        +'<span class="vault-mat-name">'+mat.name+'</span>'
        +'<span class="vault-mat-rarity vault-rarity-'+rarity+'">'+rarity.toUpperCase().slice(0,5)+'</span>'
        +'<div class="vault-mat-bar-wrap"><div class="vault-mat-bar-bg">'
          +'<div class="vault-mat-bar vault-bar-'+rarity+'" style="width:'+pct+'%"></div>'
        +'</div></div>'
        +'<span class="vault-mat-count'+(atCap?' vault-mat-count-cap':'')+'">'+qty+'</span>'
        +'<span class="vault-mat-cap">/'+cap+'</span>'
        +(u.recycle&&qty>0?'<button class="vault-recycle-btn" onclick="recycleVaultItem(\''+entry.id+'\',1)" title="Recycle 1 for '+getRecycleValue(entry.id)+'g">↩</button>':'')
        +'</div>';
    });

    // Converter button if unlocked and has enough commons
    if(u.converter){
      var commonEntry=entries.find(function(e){return MATERIALS[e.id]&&MATERIALS[e.id].rarity==='common';});
      var uncommonEntry=entries.find(function(e){return MATERIALS[e.id]&&MATERIALS[e.id].rarity==='uncommon';});
      if(commonEntry&&uncommonEntry){
        var commonQty=PERSIST.town.materials[commonEntry.id]||0;
        var canConvert=commonQty>=10;
        rightHtml+='<div class="vault-converter-row">'
          +'<button class="vault-convert-btn" data-group="'+groupId+'" '+(canConvert?'onclick="convertMaterials(this.dataset.group)"':'disabled')+'>'
          +(canConvert?'CONVERT 10 &#8594; 1 '+MATERIALS[uncommonEntry.id].name:'Need 10 '+MATERIALS[commonEntry.id].name)
          +'</button></div>';
      }
    }
    rightHtml+='</div>';
  });

  // ── UPGRADES footer ──
  var upgHtml='<div class="vault-upgrades-row">';
  VAULT_UPGRADES.forEach(function(upg){
    var owned=!!u[upg.id];
    var meetsReq=!upg.requires||!!u[upg.requires];
    var meetsLevel=lv>=(upg.minLevel||1);
    var canAfford=PERSIST.gold>=upg.cost;
    var canBuy=!owned&&meetsReq&&meetsLevel&&canAfford;
    var cls='vault-upg-item'+(owned?' vault-upg-owned':'')+(meetsReq&&meetsLevel&&!owned?' vault-upg-next':'');
    upgHtml+='<div class="'+cls+'">'
      +'<div class="vault-upg-name">'+upg.label+'</div>'
      +'<div class="vault-upg-effect">'+upg.effect+'</div>'
      +(owned?'':!meetsReq?'<div class="vault-upg-req">Requires '+upg.requires+'</div>'
        :!meetsLevel?'<div class="vault-upg-req">Needs Vault Lv.'+upg.minLevel+'</div>'
        :'<button class="vault-upg-btn" '+(canBuy?'onclick="buyVaultUpgrade(\''+upg.id+'\')"':'disabled')+'>'
          +(canAfford?'✦'+upg.cost+'g':'Need '+(upg.cost-PERSIST.gold)+'g')
        +'</button>')
      +'</div>';
  });
  upgHtml+='</div>';

  inner.innerHTML=
    '<div class="vault-two-col">'
      +'<div class="vault-left">'+leftHtml+'</div>'
      +'<div class="vault-right">'+rightHtml+'</div>'
    +'</div>'
    +upgHtml;
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
