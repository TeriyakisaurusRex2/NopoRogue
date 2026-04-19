// ════════════════════════════════════════════════════════════════
// ADVENTURER'S BOARD — quests.js
// ════════════════════════════════════════════════════════════════
//
// Owns the entire quest system for the Adventurer's Board building.
//
//   DATA
//     QUEST_TEMPLATES   — all available quest definitions
//
//   LOGIC
//     generateQuestOffers()            — pick 3 quests to show on board
//     getQuestTemplate(id)             — look up a template by id
//     activateQuest(id)                — accept a quest
//     abandonQuest()                   — cancel active quest, no penalty
//     checkQuestProgress(eventType, data) — called after every run event
//     completeQuest()                  — internal: mark complete, unlock claim
//     claimQuestReward()               — player claims reward
//     updateQuestIndicator()           — updates board building card badge
//     formatReward(reward)             — human-readable reward string
//
//   UI
//     refreshBoardPanel()              — renders the Adventurer's Board panel
//
// Dependencies (from game.js):
//   PERSIST, LOOT_DEFS, AREA_DEFS, CREATURES, MATERIALS,
//   savePersist, showTownToast, addLog, addLootItem,
//   buildTownGrid, showLockedBuildingUI
//
// ════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ADVENTURER'S BOARD — QUEST SYSTEM
// ═══════════════════════════════════════════════════════

var QUEST_TEMPLATES = [
  // Area clear quests
  {id:'q_sewers_1',    type:'area_clear',  areaId:'sewers',    count:1, label:'Clear the Sewers',          reward:{gold:30}},
  {id:'q_sewers_3',    type:'area_clear',  areaId:'sewers',    count:3, label:'Clear the Sewers 3 times',   reward:{soulShards:8}},
  {id:'q_swamp_1',     type:'area_clear',  areaId:'swamp',     count:1, label:'Clear Bogmire Swamp',        reward:{gold:40, slick_stone:5}},
  {id:'q_crypt_1',     type:'area_clear',  areaId:'crypt',     count:1, label:'Clear the Forgotten Crypt',  reward:{gold:45, bone_dust:2}},
  {id:'q_forest_1',    type:'area_clear',  areaId:'forest',    count:1, label:'Clear the Thornwood',        reward:{gold:55, soulShards:5}},
  {id:'q_cave_1',      type:'area_clear',  areaId:'cave',      count:1, label:'Clear the Crystal Caves',    reward:{gold:60, bone_dust:3}},
  {id:'q_ruins_1',     type:'area_clear',  areaId:'ruins',     count:1, label:'Clear the Ancient Ruins',    reward:{gold:70, soulShards:8}},
  {id:'q_dragon_1',    type:'area_clear',  areaId:'dragonsnest',count:1,label:'Clear the Dragon\'s Nest',   reward:{gold:90, soulShards:12, null_stone:1}},
  // Kill quota quests
  {id:'q_kill_rat_20', type:'kill_quota',  enemyId:'rat',      count:20, label:'Defeat 20 Giant Rats',       reward:{gold:25, slick_stone:8}},
  {id:'q_kill_rat_50', type:'kill_quota',  enemyId:'rat',      count:50, label:'Defeat 50 Giant Rats',       reward:{soulShards:10}},
  {id:'q_kill_goblin_20',type:'kill_quota',enemyId:'goblin',   count:20, label:'Defeat 20 Goblin Scouts',    reward:{gold:30, slick_stone:6}},
  {id:'q_kill_goblin_50',type:'kill_quota',enemyId:'goblin',   count:50, label:'Defeat 50 Goblin Scouts',    reward:{soulShards:12}},
  {id:'q_kill_roach_20', type:'kill_quota',enemyId:'roach',    count:20, label:'Defeat 20 Sewer Roaches',    reward:{gold:20, slick_stone:10}},
  {id:'q_kill_skeleton_30',type:'kill_quota',enemyId:'skeleton',count:30,label:'Defeat 30 Skeletons',        reward:{gold:40, bone_dust:2}},
  {id:'q_kill_troll_10',type:'kill_quota', enemyId:'troll',    count:10, label:'Defeat 10 Forest Trolls',    reward:{gold:50, soulShards:6}},
  {id:'q_kill_dragon_3', type:'kill_quota',enemyId:'dragon',   count:3,  label:'Defeat 3 Elder Dragons',     reward:{gold:80, soulShards:15}},
  {id:'q_fungal_1',      type:'area_clear', areaId:'fungalwarren',count:1, label:'Explore the Fungal Warren', reward:{gold:35, soulShards:5}},
  {id:'q_fungal_3',      type:'area_clear', areaId:'fungalwarren',count:3, label:'Clear the Fungal Warren 3 times', reward:{soulShards:12}},
  {id:'q_kill_sporepuff_20',type:'kill_quota',enemyId:'sporepuff',count:20,label:'Defeat 20 Spore Puffs',     reward:{gold:20, slick_stone:8}},
  {id:'q_kill_venomstalker_10',type:'kill_quota',enemyId:'venomstalker',count:10,label:'Defeat 10 Venom Stalkers', reward:{gold:30, soulShards:5}},
  {id:'q_blackpool_1',   type:'area_clear', areaId:'blackpool',   count:1, label:'Face the Harbourmaster',    reward:{soulShards:20, gold:50}},
  {id:'q_harbour_1',     type:'area_clear', areaId:'sunkenhabour',count:1, label:'Explore the Sunken Harbour',reward:{gold:40, soulShards:6}},
  {id:'q_harbour_3',     type:'area_clear', areaId:'sunkenhabour',count:3, label:'Clear the Harbour 3 times', reward:{soulShards:15}},
  {id:'q_kill_siren_5',  type:'kill_quota', enemyId:'siren',      count:5, label:'Silence 5 Sirens',          reward:{gold:25, soulShards:4}},
  {id:'q_kill_sharknight_10',type:'kill_quota',enemyId:'sharknight',count:10,label:'Defeat 10 Shark Knights',  reward:{gold:40, soulShards:8}},
  {id:'q_mines_1',       type:'area_clear', areaId:'charmines',   count:1, label:'Explore the Char Mines',    reward:{gold:40, soulShards:6}},
  {id:'q_mines_3',       type:'area_clear', areaId:'charmines',   count:3, label:'Clear the Mines 3 times',   reward:{soulShards:15, slick_stone:10}},
  {id:'q_kill_flamesprite_20',type:'kill_quota',enemyId:'flamesprite',count:20,label:'Extinguish 20 Flame Sprites',reward:{gold:20, slick_stone:10}},
  {id:'q_kill_lavacrawler_5', type:'kill_quota',enemyId:'lavacrawler', count:5, label:'Defeat 5 Lava Crawlers',   reward:{gold:35, soulShards:6}},
  // Challenge quests (no damage taken)
  {id:'q_nodmg_sewers', type:'no_damage',  areaId:'sewers',    count:1, label:'Clear Sewers without taking damage', reward:{soulShards:15, gold:20}},
  {id:'q_nodmg_swamp',  type:'no_damage',  areaId:'swamp',     count:1, label:'Clear Swamp without taking damage',  reward:{soulShards:20, bone_dust:3}},
  {id:'q_nodmg_crypt',  type:'no_damage',  areaId:'crypt',     count:1, label:'Clear Crypt without taking damage',  reward:{soulShards:25, bone_dust:4}},
  // Run count quests
  {id:'q_runs_5',      type:'run_count',   count:5,  label:'Complete 5 runs',             reward:{gold:50, slick_stone:15}},
  {id:'q_runs_10',     type:'run_count',   count:10, label:'Complete 10 runs',            reward:{soulShards:10, gold:40}},
  {id:'q_gold_earn',   type:'gold_earned', count:500,label:'Earn 500 gold in one run',    reward:{soulShards:8,  gold:60}},
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
  if(r.soulShards){ PERSIST.soulShards=(PERSIST.soulShards||0)+r.soulShards; msgs.push('+'+r.soulShards+' 🔮 Soul Shards'); }
  // Material rewards — any key matching a MATERIALS entry
  if(typeof MATERIALS!=='undefined'){
    Object.keys(r).forEach(function(k){
      if(k==='gold'||k==='soulShards') return;
      if(MATERIALS[k]){
        PERSIST.town.materials[k]=(PERSIST.town.materials[k]||0)+r[k];
        msgs.push('+'+r[k]+' '+MATERIALS[k].icon+' '+MATERIALS[k].name);
      }
    });
  }
  q.completed.push(a.id);
  q.active=null;
  savePersist();
  updateNavBar('town');
  refreshBoardPanel();
  updateQuestIndicator();
  var qb=document.getElementById('quest-badge');
  if(qb){ qb.style.display='none'; qb.textContent=''; }
  showTownToast('Reward claimed: '+msgs.join(', ')+'!');
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
  if(r.soulShards) parts.push(r.soulShards+' 🔮');
  // Any material key
  if(typeof MATERIALS!=='undefined'){
    Object.keys(r).forEach(function(k){
      if(k==='gold'||k==='soulShards') return;
      if(MATERIALS[k]) parts.push(r[k]+' '+MATERIALS[k].icon);
    });
  }
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
