// ════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ════════════════════════════════════════════════════════════════
// type: 'total_kills' | 'enemy_kills' | 'champ_level' | 'area_enter'
// reward: { gold } | { unlock: 'champId' } | { special: 'town' }
//
// To add a new enemy-kill achievement, add entries here following
// the existing pattern — no other file needs to change.
// ════════════════════════════════════════════════════════════════

var ACHIEVEMENTS = [
  // ── Combat milestones ──
  {id:'first_blood',   icon:'⚔️',  cat:'combat', title:'First Blood',     desc:'Defeat your first enemy.',
   type:'total_kills', need:1,   reward:{gold:5}},
  {id:'skirmisher',    icon:'⚔️',  cat:'combat', title:'Skirmisher',      desc:'Defeat 10 enemies.',
   type:'total_kills', need:10,  reward:{gold:15}},
  {id:'warrior',       icon:'🗡️', cat:'combat', title:'Warrior',         desc:'Defeat 20 enemies.',
   type:'total_kills', need:20,  reward:{gold:50}},
  {id:'veteran',       icon:'🛡️', cat:'combat', title:'Veteran',         desc:'Defeat 50 enemies.',
   type:'total_kills', need:50,  reward:{gold:100}},
  {id:'champion_ach',  icon:'👑', cat:'combat', title:'Champion',         desc:'Defeat 100 enemies.',
   type:'total_kills', need:100, reward:{gold:200}},
  {id:'legend',        icon:'🌟', cat:'combat', title:'Legend',           desc:'Defeat 250 enemies.',
   type:'total_kills', need:250, reward:{gold:500}},

  // ── Enemy-specific kill milestones ──
  // Each creature that can be unlocked needs 1/25/100/500 kill tiers.
  // Rat
  {id:'rat_1',      icon:'🐀',cat:'enemy',title:'Rat Encounter',   desc:'Defeat 1 Giant Rat.',
   type:'enemy_kills',enemyId:'rat',need:1,   reward:{gold:5}},
  {id:'rat_25',     icon:'🐀',cat:'enemy',title:'Rat Hunter',      desc:'Defeat 25 Giant Rats.',
   type:'enemy_kills',enemyId:'rat',need:25,  reward:{gold:15}},
  {id:'rat_100',    icon:'🐀',cat:'enemy',title:'Exterminator',    desc:'Defeat 100 Giant Rats.',
   type:'enemy_kills',enemyId:'rat',need:100, reward:{gold:40}},
  {id:'rat_500',    icon:'🐀',cat:'enemy',title:'Rat Champion',    desc:'Defeat 500 Giant Rats to unlock the Rat as a playable champion.',
   type:'enemy_kills',enemyId:'rat',need:500, reward:{unlock:'rat'}},
  // Mud Crab
  {id:'crab_1',     icon:'🦀',cat:'enemy',title:'Shell Cracker',   desc:'Defeat 1 Mud Crab.',
   type:'enemy_kills',enemyId:'mudcrab',need:1,   reward:{gold:5}},
  {id:'crab_100',   icon:'🦀',cat:'enemy',title:'Crab Slayer',     desc:'Defeat 100 Mud Crabs.',
   type:'enemy_kills',enemyId:'mudcrab',need:100, reward:{gold:35}},
  {id:'crab_500',   icon:'🦀',cat:'enemy',title:'Crab Champion',   desc:'Defeat 500 Mud Crabs to unlock as champion.',
   type:'enemy_kills',enemyId:'mudcrab',need:500, reward:{unlock:'mudcrab'}},
  // Goblin
  {id:'gob_1',      icon:'👺',cat:'enemy',title:'Goblin Slayer',   desc:'Defeat 1 Goblin Scout.',
   type:'enemy_kills',enemyId:'goblin',need:1,   reward:{gold:5}},
  {id:'gob_100',    icon:'👺',cat:'enemy',title:'Goblin Hunter',   desc:'Defeat 100 Goblins.',
   type:'enemy_kills',enemyId:'goblin',need:100, reward:{gold:35}},
  {id:'gob_500',    icon:'👺',cat:'enemy',title:'Goblin Champion', desc:'Defeat 500 Goblins to unlock as champion.',
   type:'enemy_kills',enemyId:'goblin',need:500, reward:{unlock:'goblin'}},
  // Toad King
  {id:'toad_1',     icon:'🐸',cat:'enemy',title:'Toad Hunter',     desc:'Defeat the Toad King.',
   type:'enemy_kills',enemyId:'toadking',need:1,   reward:{gold:25}},
  {id:'toad_500',   icon:'🐸',cat:'enemy',title:'Toad Champion',   desc:'Defeat 500 Toad Kings to unlock as champion.',
   type:'enemy_kills',enemyId:'toadking',need:500, reward:{unlock:'toadking'}},
  // Skeleton
  {id:'skel_5',     icon:'💀',cat:'enemy',title:'Bone Breaker',    desc:'Defeat 5 Skeletons.',
   type:'enemy_kills',enemyId:'skeleton',need:5,   reward:{gold:15}},
  {id:'skel_500',   icon:'💀',cat:'enemy',title:'Skeleton Champion',desc:'Defeat 500 Skeletons to unlock as champion.',
   type:'enemy_kills',enemyId:'skeleton',need:500, reward:{unlock:'skeleton'}},
  // Knight
  {id:'knight_1',   icon:'🦹',cat:'enemy',title:"Knight's Bane",   desc:'Defeat a Dark Knight.',
   type:'enemy_kills',enemyId:'knight',need:1,   reward:{gold:50}},
  {id:'knight_500', icon:'🦹',cat:'enemy',title:'Knight Champion', desc:'Defeat 500 Dark Knights to unlock as champion.',
   type:'enemy_kills',enemyId:'knight',need:500, reward:{unlock:'knight'}},
  // Wyrm
  {id:'wyrm_1',     icon:'🐉',cat:'enemy',title:'Wyrm Slayer',     desc:'Defeat a Fire Wyrm.',
   type:'enemy_kills',enemyId:'wyrm',need:1,   reward:{gold:80}},
  {id:'wyrm_500',   icon:'🐉',cat:'enemy',title:'Wyrm Champion',   desc:'Defeat 500 Fire Wyrms to unlock as champion.',
   type:'enemy_kills',enemyId:'wyrm',need:500, reward:{unlock:'wyrm'}},
  // Dragon
  {id:'dragon_1',   icon:'🐲',cat:'enemy',title:'Dragon Slayer',   desc:'Defeat the Elder Dragon.',
   type:'enemy_kills',enemyId:'dragon',need:1,   reward:{gold:200}},
  {id:'dragon_500', icon:'🐲',cat:'enemy',title:'Dragon Champion', desc:'Defeat 500 Elder Dragons to unlock as champion.',
   type:'enemy_kills',enemyId:'dragon',need:500, reward:{unlock:'dragon'}},

  // ── Champion milestones ──
  {id:'first_steps',    icon:'👣', cat:'champ', title:'First Steps',      desc:'Reach level 2 with any champion.',
   type:'champ_level', need:2,   reward:{gold:10}},
  {id:'rising_power',   icon:'🏰', cat:'champ', title:'Rising Power',     desc:'Reach level 3 with any champion. Unlocks The Town.',
   type:'champ_level', need:3,   reward:{special:'town'}},
  {id:'battle_hardened',icon:'⚔️', cat:'champ', title:'Battle Hardened',  desc:'Reach level 5 with any champion.',
   type:'champ_level', need:5,   reward:{gold:75}},
  {id:'legend_reborn',  icon:'🌟', cat:'champ', title:'Legend Reborn',    desc:'Reach level 8 with any champion.',
   type:'champ_level', need:8,   reward:{gold:150}},

  // ── Exploration ──
  {id:'into_the_dark', icon:'🐀', cat:'explore', title:'Into the Dark',   desc:'Enter The Sewers.',
   type:'area_enter',  areaId:'sewers',      reward:{gold:5}},
  {id:'swamp_walker',  icon:'🌿', cat:'explore', title:'Swamp Walker',    desc:'Enter Bogmire Swamp.',
   type:'area_enter',  areaId:'swamp',       reward:{gold:10}},
  {id:'crypt_keeper',  icon:'💀', cat:'explore', title:'Crypt Keeper',    desc:'Enter The Forgotten Crypt.',
   type:'area_enter',  areaId:'crypt',       reward:{gold:10}},
  {id:'forest_runner', icon:'🌲', cat:'explore', title:'Forest Runner',   desc:'Enter Thornwood Forest.',
   type:'area_enter',  areaId:'forest',      reward:{gold:15}},
  {id:'eagle_eye',     icon:'🦅', cat:'explore', title:"Eagle's Eye",     desc:"Enter Eagle's Cave.",
   type:'area_enter',  areaId:'cave',        reward:{gold:15}},
  {id:'dragons_dare',  icon:'🐉', cat:'explore', title:"Dragon's Dare",   desc:"Enter Dragon's Nest.",
   type:'area_enter',  areaId:'dragonsnest', reward:{gold:30}},
  {id:'void_gazer',    icon:'🔮', cat:'explore', title:'Void Gazer',      desc:'Enter the Maze of Fractured Mirrors.',
   type:'area_enter',  areaId:'starmaze',    reward:{gold:40}},
];

// ════════════════════════════════════════════════════════════════
// ACHIEVEMENT LOGIC
// ════════════════════════════════════════════════════════════════

function getAchProgress(ach){
  if(ach.type==='total_kills'){
    var total=0;
    Object.keys(PERSIST.achievements).forEach(function(k){
      if(k.endsWith('_kill')) total+=PERSIST.achievements[k];
    });
    return {current:total, needed:ach.need};
  }
  if(ach.type==='enemy_kills'){
    var k=ach.enemyId+'_kill';
    return {current:PERSIST.achievements[k]||0, needed:ach.need};
  }
  if(ach.type==='champ_level'){
    var maxLv=1;
    Object.keys(PERSIST.champions).forEach(function(id){
      var cp=PERSIST.champions[id];
      if(cp&&cp.level>maxLv) maxLv=cp.level;
    });
    return {current:maxLv, needed:ach.need};
  }
  if(ach.type==='area_enter'){
    var entered=PERSIST.achievements['area_'+ach.areaId]||0;
    return {current:entered, needed:1};
  }
  return {current:0, needed:1};
}

function isAchComplete(ach){ var p=getAchProgress(ach); return p.current>=p.needed; }
function isAchClaimed(ach){ return !!(PERSIST.achievements['claimed_'+ach.id]); }
function isAchClaimable(ach){ return isAchComplete(ach)&&!isAchClaimed(ach); }

function openAchPanel(){
  playUiClickSfx();
  document.getElementById('ach-panel').classList.add('open');
  document.getElementById('ach-backdrop').style.display='block';
  buildAchList(currentAchFilter);
}
function closeAchPanel(){
  playUiCloseSfx();
  document.getElementById('ach-panel').classList.remove('open');
  document.getElementById('ach-backdrop').style.display='none';
}

var currentAchFilter='all';
function filterAch(filter){
  currentAchFilter=filter;
  document.querySelectorAll('.ach-filter').forEach(function(b){b.classList.remove('active');});
  var btn=document.getElementById('ach-f-'+filter);
  if(btn) btn.classList.add('active');
  buildAchList(filter);
}

function claimAchievement(achId){
  var ach=ACHIEVEMENTS.find(function(a){return a.id===achId;});
  if(!ach||isAchClaimed(ach)||!isAchComplete(ach)) return;
  PERSIST.achievements['claimed_'+ach.id]=true;
  if(ach.reward.gold){
    PERSIST.gold+=ach.reward.gold;
    addLog('✦ '+ach.title+' — +'+ach.reward.gold+' gold!','sys');
  }
  if(ach.reward.unlock){
    if(PERSIST.unlockedChamps.indexOf(ach.reward.unlock)===-1){
      PERSIST.unlockedChamps.push(ach.reward.unlock);
      addLog('✦ '+ach.title+' — champion unlocked!','sys');
    }
  }
  if(ach.reward.special==='town'){
    PERSIST.townUnlocked=true;
    if(!PERSIST.town.buildings.vault.unlocked) PERSIST.town.buildings.vault.unlocked=true;
    addTownCard('ruby');
    addLog('✦ '+ach.title+' — You earned a Ruby Gem! Slot it in the Vault.','sys');
  }
  // Achievement-gated building unlocks
  if(achId==='rising_power'&&!PERSIST.town.buildings.forge.unlocked){
    PERSIST.town.buildings.forge.unlocked=true;
    addLog('✦ The Forge is now open! Upgrade your cards in Town.','sys');
  }
  if(achId==='battle_hardened'&&!PERSIST.town.buildings.board.unlocked){
    PERSIST.town.buildings.board.unlocked=true;
    addLog("✦ The Adventurer's Board is now open! Take on quests in Town.",'sys');
  }
  savePersist();
  updateAchBadge();
  buildAchList(currentAchFilter);
  updateNavBar(document.getElementById('nav-town')&&document.getElementById('nav-town').classList.contains('active')?'town':'adventure');
}

var _prevAchClaimable=0;
function updateAchBadge(){
  var count=ACHIEVEMENTS.filter(function(a){return isAchClaimable(a);}).length;
  var badge=document.getElementById('ach-badge');
  if(!badge) return;
  if(count>0){
    badge.textContent=count; badge.style.display='inline-block';
    if(count>_prevAchClaimable){
      playQuestNotifySfx();
      badge.classList.remove('notify-pop');
      void badge.offsetWidth;
      badge.classList.add('notify-pop');
      var btn=badge.closest('.nav-icon-btn')||document.querySelector('.nav-icon-btn[onclick*="openAchPanel"]');
      if(btn){
        btn.style.setProperty('--glow-col','#ffcc0080');
        btn.classList.remove('has-notif');
        void btn.offsetWidth;
        btn.classList.add('has-notif');
      }
    }
  } else {
    badge.style.display='none';
  }
  _prevAchClaimable=count;
}

function checkAchievementsAuto(){ updateAchBadge(); }

function restoreQuestBadge(){
  var q=PERSIST.town&&PERSIST.town.quests;
  if(q&&q.active&&q.active.readyToClaim){
    var qb=document.getElementById('quest-badge');
    if(qb){ qb.textContent='!'; qb.style.display='inline-block'; }
  }
}

function trackAreaEnter(areaDefId){
  var k='area_'+areaDefId;
  if(!PERSIST.achievements[k]){
    PERSIST.achievements[k]=1;
    savePersist();
    updateAchBadge();
  }
}

function buildAchList(filter){
  var list=document.getElementById('ach-list'); if(!list) return;
  list.innerHTML='';
  var toShow=ACHIEVEMENTS.filter(function(ach){
    var complete=isAchComplete(ach);
    var claimed=isAchClaimed(ach);
    if(filter==='claimable') return complete&&!claimed;
    if(filter==='inprogress') return !complete;
    if(filter==='done') return claimed;
    return true;
  });
  if(!toShow.length){
    list.innerHTML='<div style="text-align:center;color:#5a4020;font-family:Cinzel,serif;font-size:10px;padding:24px;">Nothing here yet.</div>';
    return;
  }
  toShow.forEach(function(ach){
    var prog=getAchProgress(ach);
    var complete=isAchComplete(ach);
    var claimed=isAchClaimed(ach);
    var claimable=complete&&!claimed;
    var pct=Math.min(100,Math.round((prog.current/prog.needed)*100));
    var rewardStr='';
    if(ach.reward.gold) rewardStr='✦ '+ach.reward.gold+' gold';
    else if(ach.reward.unlock) rewardStr='🔓 Unlock champion';
    else if(ach.reward.special==='town') rewardStr='🏰 Unlock The Town';
    var item=document.createElement('div');
    item.className='ach-item'+(claimable?' claimable':'')+(claimed?' redeemed':'');
    var progressHtml='';
    if(!claimed){
      progressHtml='<div class="ach-progress-wrap"><div class="ach-progress-bar'+(complete?' done':'')+'\" style="width:'+pct+'%"></div></div>'
        +'<div class="ach-progress-txt">'+prog.current+' / '+prog.needed+'</div>';
    }
    var footerHtml='<div class="ach-footer">'
      +'<div class="ach-reward-lbl">'+rewardStr+'</div>'
      +(claimed?'<div class="ach-done-lbl">✓</div>'
        :claimable?'<button class="ach-claim-btn" onclick="claimAchievement(\''+ach.id+'\')">CLAIM</button>'
        :'')
      +'</div>';
    item.innerHTML='<div class="ach-icon">'+ach.icon+'</div>'
      +'<div class="ach-body">'
        +'<div class="ach-title">'+ach.title+'</div>'
        +'<div class="ach-desc">'+ach.desc+'</div>'
        +progressHtml+footerHtml
      +'</div>';
    list.appendChild(item);
  });
}
