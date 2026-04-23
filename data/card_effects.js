// ════════════════════════════════════════════════════════════════
// CARD EFFECTS  —  data/card_effects.js
// ════════════════════════════════════════════════════════════════
//
// HOW TO ADD A NEW CARD (data-driven — no code required):
//   1. Add the card definition to data/cards.js with an effects[] array
//   2. Done — executeCard() dispatches it automatically
//
// HOW TO ADD A NEW MECHANIC TYPE:
//   1. Add one entry to EFFECT_TYPES below (run + creator metadata)
//   2. The card creator reads EFFECT_TYPES automatically — it appears
//      in the picker, archetypes, and output generation immediately
//   3. Any card can now use it via effects:[{type:'your_type',...}]
//
// HOW TO ADD A CARD WITH UNIQUE LOGIC (Category B):
//   Add an else-if branch in executeCard() below. Use helpers:
//   pdmg(), _applyPoison(), _applyBurn(), _applyShield(),
//   stunEnemy(), triggerHolyFlame(), applyStatus(), applyDoT(),
//   dealDamageToEnemy(), addLog(), addTag(), doDraw() etc.
//
// ON-DISCARD TRIGGER:
//   Add an onDiscard[] array to a card in cards.js using the same
//   EFFECT_TYPES system. handleCardDiscard() fires it automatically.
//
// ════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// SHARED COMBAT HELPERS
// Used by both EFFECT_TYPES.run() and custom branches.
// ═══════════════════════════════════════════════════════

// Stack-or-create Poison (2s tick, bypasses Shield)
function _applyPoison(dpt, durMs){
  var bonusDpt=(gs&&gs._relicPoisonDptBonus)||0; dpt+=bonusDpt;
  var tickMs=Math.round(1000*((gs&&gs._relicPoisonTickMult)||1));
  var lbl='Poison ('+dpt+'/s)';
  var e=gs.statusEffects.enemy.find(function(s){return s.id==='poison';});
  if(e){
    e.dpt+=dpt; e.tickMs=tickMs; e.remaining=Math.max(e.remaining,durMs||8000); e.maxRemaining=durMs||8000;
    removeTagByLabel('enemy',e.label); e.label='Poison ('+e.dpt+'/s)';
    addTag('enemy','debuff',e.label,0,'dot','Poison: '+e.dpt+' dmg/s. Bypasses Shield.');
  } else {
    gs.statusEffects.enemy.push({id:'poison',label:lbl,cls:'debuff',stat:'dot',
      remaining:durMs||8000,maxRemaining:durMs||8000,dot:true,dpt:dpt,tickMs:tickMs,tickAcc:0,
      desc:'Poison: '+dpt+' dmg/s. Bypasses Shield.'});
    addTag('enemy','debuff',lbl,0,'dot','Poison: '+dpt+' dmg/s. Bypasses Shield.');
  }
}

// Apply Poison to the player (enemy-context, e.g. Plagued One self-poison on enemy turn)
function _applyPoisonToPlayer(dpt, durMs){
  // Skip if player has Plague Bearer immunity
  if(_hasPoisonImmunity()) return;
  var e=gs.statusEffects.player.find(function(s){return s.id==='poison';});
  if(e){
    e.dpt+=dpt; e.remaining=Math.max(e.remaining,durMs||8000); e.maxRemaining=durMs||8000;
    removeTagByLabel('player',e.label);
    e.label='Poison ('+e.dpt+'/s)';
    addTag('player','debuff',e.label,0,'dot','Poison: '+e.dpt+' dmg/s. Bypasses Shield.');
  } else {
    gs.statusEffects.player.push({id:'poison',label:'Poison ('+dpt+'/s)',cls:'debuff',stat:'dot',
      remaining:durMs||8000,maxRemaining:durMs||8000,dot:true,dpt:dpt,tickMs:1000,tickAcc:0,
      desc:'Poison: '+dpt+' dmg/s. Bypasses Shield.'});
    addTag('player','debuff','Poison ('+dpt+'/s)',0,'dot','Poison: '+dpt+' dmg/s. Bypasses Shield.');
  }
}

// Stack-or-create Burn (3s tick, bypasses Shield)
// Apply Burn — non-stacking. Reapplication refreshes duration only, never increases dpt.
// Burn is a single flat DoT. Use poison for stacking pressure.
function _applyBurn(dpt, durMs){
  var dur=(durMs||9000)+((gs&&gs._relicBurnDurBonus)||0);
  var e=gs.statusEffects.enemy.find(function(s){return s.id==='burn';});
  if(e){ e.remaining=dur; e.maxRemaining=dur; }
  else {
    gs.statusEffects.enemy.push({id:'burn',label:'Burn ('+dpt+'/s)',cls:'debuff',stat:'dot',
      remaining:dur,maxRemaining:dur,dot:true,dpt:dpt,tickMs:1000,tickAcc:0,
      desc:'Burn: '+dpt+' dmg/s. Bypasses Shield. Does not stack — reapplication refreshes duration.'});
    addTag('enemy','debuff','Burn ('+dpt+'/s)',0,'dot','Burn: '+dpt+' dmg/s. Bypasses Shield.');
  }
}

// Timed shield with optional on-expiry callback
function _applyShield(amt, durMs, onExpiry){
  gs.playerShield+=amt;
  // Add to status effects so the tag timer system can track it
  var existing=gs.statusEffects.player.find(function(s){return s.id==='shield';});
  if(existing){
    existing.remaining=Math.max(existing.remaining, durMs);
    existing.maxRemaining=Math.max(existing.maxRemaining, durMs);
    existing.label='Shield ('+gs.playerShield+')';
    // Update tag label
    var el=document.getElementById('p-tags');
    if(el){ var old=el.querySelector('[data-label]'); /* re-add below */ }
    removeTagsByClass('player','shield');
  } else {
    gs.statusEffects.player.push({
      id:'shield', label:'Shield ('+gs.playerShield+')', cls:'shield', stat:'shield',
      remaining:durMs, maxRemaining:durMs,
      desc:'Absorbs '+gs.playerShield+' direct damage. DoTs bypass. Manabound: purged if mana hits 0.',
      _onExpiry:onExpiry
    });
  }
  addTag('player','shield','Shield ('+gs.playerShield+')',null,'shield','Absorbs '+gs.playerShield+' direct damage. DoTs bypass. Manabound: purged if mana hits 0.');
  // Expiry handled by tickStatuses — remove the setTimeout approach
  // Store onExpiry callback on the status for tickStatuses to call
  var s=gs.statusEffects.player.find(function(s){return s.id==='shield';});
  if(s) s._onExpiry=onExpiry;
}

// ── Apply Poison to self (player) ──
function _applyPoisonSelf(dpt, durMs, stacks){
  stacks=stacks||1;
  var e=gs.statusEffects.player.find(function(s){return s.id==='poison_self';});
  if(e){
    e.dpt+=dpt*stacks; e.remaining=Math.max(e.remaining,durMs||8000); e.maxRemaining=durMs||8000;
    removeTagByLabel('player',e.label);
    e.label='Poison ('+e.dpt+'/s)';
    addTag('player','debuff',e.label,0,'dot','Self-Poison: '+e.dpt+' dmg/s.');
  } else {
    var totalDpt=dpt*stacks;
    gs.statusEffects.player.push({id:'poison_self',label:'Poison ('+totalDpt+'/s)',cls:'debuff',
      stat:'dot',remaining:durMs||8000,maxRemaining:durMs||8000,dot:true,dpt:totalDpt,
      tickMs:1000,tickAcc:0,desc:'Self-Poison: '+totalDpt+' dmg/s.',selfPoison:true});
    addTag('player','debuff','Poison ('+totalDpt+'/s)',0,'dot','Self-Poison: '+totalDpt+' dmg/s.');
  }
}

// Apply Poison to enemy self (when enemy is the Plagued One)
function _applyPoisonSelfEnemy(dpt, durMs, stacks){
  stacks=stacks||1;
  var totalDpt=dpt*stacks;
  var e=gs.statusEffects.enemy.find(function(s){return s.id==='poison_self_enemy';});
  if(e){
    e.dpt+=totalDpt; e.remaining=Math.max(e.remaining,durMs||8000); e.maxRemaining=durMs||8000;
    removeTagByLabel('enemy',e.label);
    e.label='Self-Poison ('+e.dpt+'/s)';
    addTag('enemy','debuff',e.label,0,'dot','Self-Poison: '+e.dpt+' dmg/s.');
  } else {
    gs.statusEffects.enemy.push({id:'poison_self_enemy',label:'Self-Poison ('+totalDpt+'/s)',cls:'debuff',
      stat:'dot',remaining:durMs||8000,maxRemaining:durMs||8000,dot:true,dpt:totalDpt,
      tickMs:1000,tickAcc:0,desc:'Self-Poison: '+totalDpt+' dmg/s.'});
    addTag('enemy','debuff','Self-Poison ('+totalDpt+'/s)',0,'dot','Self-Poison: '+totalDpt+' dmg/s.');
  }
}

// ── Get enemy Poison stack count ──
function _getEnemyPoisonStacks(){
  var e=gs.statusEffects.enemy.find(function(s){return s.id==='poison';});
  return e?Math.floor(e.dpt/4):0; // 4 dpt per stack baseline
}

// ── Get self Poison stack count ──
function _getSelfPoisonStacks(){
  var e=gs.statusEffects.player.find(function(s){return s.id==='poison_self';});
  return e?Math.floor(e.dpt/4):0;
}

// ── Consume N self Poison stacks (for Sacrifice) — returns true if successful ──
function _consumeSelfPoison(n){
  var e=gs.statusEffects.player.find(function(s){return s.id==='poison_self';});
  if(!e) return false;
  var stacks=Math.floor(e.dpt/4);
  if(stacks<n) return false;
  e.dpt-=n*4;
  if(e.dpt<=0){
    gs.statusEffects.player=gs.statusEffects.player.filter(function(s){return s.id!=='poison_self';});
    removeTagByLabel('player',e.label);
  } else {
    removeTagByLabel('player',e.label);
    e.label='Poison ('+e.dpt+'/s)';
    addTag('player','debuff',e.label,0,'dot','Self-Poison: '+e.dpt+' dmg/s.');
  }
  return true;
}

// ── Shed Poison (transfer all self Poison to enemy) ──
function _shedPoison(){
  var self=gs.statusEffects.player.find(function(s){return s.id==='poison_self';});
  if(!self||self.dpt<=0) return;
  _applyPoison(self.dpt, self.remaining);
  gs.statusEffects.player=gs.statusEffects.player.filter(function(s){return s.id!=='poison_self';});
  removeTagByLabel('player',self.label);
  addLog('[Shed] — all Poison transferred to target.','debuff');
}

// Enemy version: transfer enemy self-poison to player
function _shedPoisonEnemy(){
  var self=gs.statusEffects.enemy.find(function(s){return s.id==='poison_self_enemy';});
  if(!self||self.dpt<=0) return;
  _applyPoisonToPlayer(self.dpt, self.remaining);
  gs.statusEffects.enemy=gs.statusEffects.enemy.filter(function(s){return s.id!=='poison_self_enemy';});
  removeTagByLabel('enemy',self.label);
  addLog('[Shed] — enemy Poison transferred to you.','debuff');
}

// ── Volatile system ──
// gs._volatile = { stacks, timer, stabilized, baseDmg }
var VOLATILE_BASE_DMG = 8; // base damage for fizzle/detonate
var VOLATILE_DURATION_MS = 8000;

function _applyVolatile(n){
  if(!gs._volatile) gs._volatile={stacks:0,timer:null,stabilized:false};
  gs._volatile.stacks+=n;
  // Reset timer
  if(gs._volatile.timer) clearTimeout(gs._volatile.timer);
  gs._volatile.timer=setTimeout(function(){
    if(!gs) return;
    _detonateVolatile(false);
  }, VOLATILE_DURATION_MS);
  // Update tag
  removeTagByLabel('enemy','Volatile');
  addTag('enemy','debuff','Volatile ×'+gs._volatile.stacks,0,'volatile','Volatile: '+gs._volatile.stacks+' stacks — detonates at '+(gs._volatile.stabilized?10:5)+'+.');
  updateAll();
}

function _detonateVolatile(forced){
  if(!gs||!gs._volatile) return;
  var v=gs._volatile;
  var threshold=v.stabilized?10:5;
  var dmg=VOLATILE_BASE_DMG;
  var msg;
  if(v.stacks>=threshold*2){ dmg=Math.round(VOLATILE_BASE_DMG*(v.stabilized?4:2)); msg='DETONATE'; }
  else if(v.stacks>=threshold){ dmg=Math.round(VOLATILE_BASE_DMG*2); msg='DETONATE'; }
  else { msg='fizzle'; } // 1× damage
  dealDamageToPlayer(dmg);
  addLog('[Volatile] '+msg+'! ('+v.stacks+' stacks) — '+dmg+' dmg.','dmg');
  spawnFloatNum('player',msg==='fizzle'?'fizzle':'BOOM!',true,'crit-num');
  removeTagByLabel('enemy','Volatile');
  gs._volatile=null;
}

// ── Thorns reflect on hit ──
// Called from dealDamageToEnemy to check for Thorns
function _checkThornsReflect(){
  var t=gs.statusEffects.player.find(function(s){return s.stat==='thorns';});
  if(!t||!t.val) return;
  gs.enemyHp=Math.max(0,gs.enemyHp-t.val);
  addLog('[Thorns] — '+t.val+' reflected.','dmg');
  updateAll();
}

// ── Suspend (pause all status timers) ──
function _suspendTimers(durSecs){
  var ms=durSecs*1000;
  gs._suspended=true;
  // Pause all status effect remaining timers by storing the suspend start
  gs._suspendEnd=Date.now()+ms;
  setTimeout(function(){
    if(!gs) return;
    gs._suspended=false;
    gs._suspendEnd=0;
  }, ms);
  addTag('player','buff','Suspended',0,'suspend','All timers paused for '+durSecs+'s.');
  setTimeout(function(){
    if(!gs) return;
    removeTagByLabel('player','Suspended');
  }, ms);
}

// ── Poison immunity check (Plague Bearer innate) ──
function _hasPoisonImmunity(){
  var c=CREATURES[gs.champId];
  return c&&c.innate&&c.innate.id==='plague_bearer';
}


//
// Each entry:
//   label       — name in the card creator picker
//   cat         — 'damage' | 'debuff' | 'buff' | 'utility'
//   desc        — one-line description for the creator
//   fields      — [{id, label, type, default, min?, max?, options?, hint?}]
//   effectText  — function(vals) → card face text fragment
//   tooltipText — function(vals) → keyword tooltip text
//   typeHint    — suggested card type for auto-detect in creator
//   run         — function(v, ctx) → executes in combat
//                 v   = the effect object from the card's effects array
//                 ctx = { pdmg, str, agi, wis, isAuto, isGhost,
//                         markedCrit, cardName }
// ═══════════════════════════════════════════════════════
var EFFECT_TYPES = {

  // ── DAMAGE ──────────────────────────────────────────

  dmg: {
    label:'Flat Damage', cat:'damage',
    desc:'Deal a fixed amount of damage.',
    fields:[{id:'base', label:'Damage', type:'number', default:10, min:1, max:200}],
    effectText:  function(v){ return 'Deal '+v.base+' damage.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'attack',
    run: function(v,ctx){
      var d=ctx.pdmg(+v.base);
      if(ctx.isEnemy) dealDamageToPlayer(d);
      else dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg.','dmg');
    }
  },

  dmg_stat: {
    label:'Stat-scaling Damage', cat:'damage',
    desc:'Damage scales with STR, AGI, or WIS.',
    fields:[
      {id:'base', label:'Base Dmg',  type:'number', default:5,   min:0, max:100},
      {id:'stat', label:'Stat',      type:'select',  default:'str', options:['str','agi','wis']},
      {id:'div',  label:'Divisor',   type:'number', default:4,   min:1, max:20,
       hint:'base + STAT÷div. Lower = stronger scaling.'}
    ],
    effectText:  function(v){ return 'Deal '+v.base+'+'+v.stat.toUpperCase()+'/'+v.div+' damage.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'attack',
    run: function(v,ctx){
      var d=ctx.pdmg(+v.base+Math.floor((ctx[v.stat]||0)/+v.div));
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg.','dmg');
    }
  },

  dmg_multi: {
    label:'Multi-hit', cat:'damage',
    desc:'Deal damage in several rapid hits.',
    fields:[
      {id:'hits',  label:'Hits',       type:'number', default:3, min:2, max:8},
      {id:'dmg',   label:'Dmg / hit',  type:'number', default:5, min:1, max:50},
      {id:'delay', label:'Delay (ms)', type:'number', default:200, min:50, max:600}
    ],
    effectText:  function(v){ return 'Deal '+v.dmg+' damage '+v.hits+' times.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'attack',
    run: function(v,ctx){
      var hits=+v.hits, dmg=+v.dmg, delay=+v.delay;
      for(var i=0;i<hits;i++){
        (function(d){ setTimeout(function(){
          if(gs&&gs.running){ dealDamageToEnemy(ctx.pdmg(dmg)); updateAll(); }
        }, d*delay); })(i);
      }
      addLog(ctx.cardName+'! '+hits+'×'+dmg+' dmg.','dmg');
    }
  },

  dmg_if_debuff: {
    label:'Damage (bonus if debuffed)', cat:'damage',
    desc:'Deal more damage if enemy has any active debuff.',
    fields:[
      {id:'base', label:'Normal Dmg', type:'number', default:12},
      {id:'high', label:'Bonus Dmg',  type:'number', default:30}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. If enemy is debuffed: deal '+v.high+' instead.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'attack',
    run: function(v,ctx){
      var hasD=gs.statusEffects.enemy.some(function(x){return x.cls==='debuff';});
      var d=ctx.pdmg(hasD?+v.high:+v.base);
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(hasD?' (debuff bonus!)':'')+'.','dmg');
    }
  },

  dmg_if_hp_low: {
    label:'Damage (bonus at low HP)', cat:'damage',
    desc:'Deal more damage when your HP is low.',
    fields:[
      {id:'base',      label:'Normal Dmg',   type:'number', default:5,  min:1, max:100},
      {id:'high',      label:'Low HP Dmg',   type:'number', default:10, min:1, max:200},
      {id:'threshold', label:'HP % trigger', type:'number', default:25, min:5, max:50}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. Below '+v.threshold+'% HP: deal '+v.high+' instead.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'attack',
    run: function(v,ctx){
      var low=gs.playerHp<gs.playerMaxHp*(+v.threshold/100);
      var d=ctx.pdmg(low?+v.high:+v.base);
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg.','dmg');
    }
  },

  dmg_crit: {
    label:'Damage with Crit Chance', cat:'damage',
    desc:'Damage with a percentage chance to deal double.',
    fields:[
      {id:'base', label:'Damage',        type:'number', default:10, min:1, max:200},
      {id:'pct',  label:'Crit chance %', type:'number', default:15, min:1, max:50}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. '+v.pct+'% chance to [Crit]: deal double.'; },
    tooltipText: function(v){ return '[Crit]: a lucky strike that deals double damage.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var isCrit=ctx.markedCrit||Math.random()<(+v.pct/100);
      var d=ctx.pdmg(+v.base);
      if(isCrit){ d=Math.round(d*2); spawnFloatNum('enemy','CRIT!',false,'crit-num'); }
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(isCrit?' CRIT!':'')+'.','dmg');
    }
  },

  // Damage with crit chance conditional on enemy having Burn active.
  // Used by Smite: [Burn] on enemy: [Crit]: 75%.
  dmg_if_burning: {
    label:'Damage (Crit if enemy Burning)', cat:'damage',
    desc:'Deal damage. If enemy has [Burn]: crit chance applies.',
    fields:[
      {id:'base',    label:'Damage',       type:'number', default:8,  min:1, max:200},
      {id:'critPct', label:'Crit % if Burning', type:'number', default:75, min:1, max:100}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage.\n[Burn] on enemy: [Crit]: '+v.critPct+'%.'; },
    tooltipText: function(v){ return '[Crit] fires only when the enemy has Burn active.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var enemyBurning = gs.statusEffects.enemy.some(function(s){ return s.id==='burn'; });
      var isCrit = ctx.markedCrit || (enemyBurning && Math.random() < (+v.critPct/100));
      var d = ctx.pdmg(+v.base);
      if(isCrit){ d=Math.round(d*2); spawnFloatNum('enemy','CRIT!',false,'crit-num'); }
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(isCrit?' CRIT!':'')+'.','dmg');
    }
  },

  // ── DEBUFFS ─────────────────────────────────────────

  // Updated: Slow is now a fixed +600ms draw interval increase (non-stacking, refreshes)
  slow_draw: {
    label:'Apply [Slow]', cat:'debuff',
    desc:'Increase enemy draw interval by 600ms. Non-stacking, refreshes duration.',
    fields:[{id:'dur', label:'Duration (s)', type:'number', default:4, min:1, max:15}],
    effectText:  function(v){ return 'Apply [Slow] for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Slow: draw interval +600ms. Non-stacking.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      var tgt=ctx.isEnemy?'player':'enemy';
      applyStatus(tgt,'debuff','Slow',600,'slow_draw',(+v.dur)*1000,'Slow: draw interval +600ms.');
      addLog(ctx.cardName+'! [Slow] applied.','debuff');
    }
  },

  // Keep legacy slow as alias for backwards compat with existing cards
  slow: {
    label:'Apply [Slow] (legacy)', cat:'debuff',
    desc:'Legacy slow — maps to slow_draw.',
    fields:[{id:'dur', label:'Duration (s)', type:'number', default:4, min:1, max:15}],
    effectText:  function(v){ return 'Apply [Slow] for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Slow: draw interval +600ms.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      applyStatus('enemy','debuff','Slow',600,'slow_draw',(+v.dur)*1000,'Slow: draw interval +600ms.');
      addLog(ctx.cardName+'! [Slow] applied.','debuff');
    }
  },

  // ── Weaken (renamed from cursed for clarity) ──
  weaken: {
    label:'Apply [Weaken]', cat:'debuff',
    desc:'Reduce target damage output by 15%.',
    fields:[{id:'dur', label:'Duration (s)', type:'number', default:4, min:1, max:20}],
    effectText:  function(v){ return 'Apply [Weaken] for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Weaken: target deals 15% less damage.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      var tgt=ctx.isEnemy?'player':'enemy';
      applyStatus(tgt,'debuff','Weaken',-0.15,'dmg',(+v.dur)*1000,'Weaken: target dmg -15%.');
      addLog(ctx.cardName+'! [Weaken] '+v.dur+'s.','debuff');
    }
  },

  // ── Thorns ──
  thorns: {
    label:'Apply [Thorns]', cat:'buff',
    desc:'Reflect X damage back to attacker on each hit.',
    fields:[
      {id:'val', label:'Reflect dmg', type:'number', default:8,  min:1, max:50},
      {id:'dur', label:'Duration (s)',type:'number', default:6,  min:1, max:20}
    ],
    effectText:  function(v){ return 'Apply [Thorns] ('+v.val+') for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Thorns: each hit dealt to this creature reflects '+v.val+' damage back. Non-stacking.'; },
    typeHint:'defense',
    run: function(v,ctx){
      var tgt=ctx.isEnemy?'enemy':'player';
      applyStatus(tgt,'buff','Thorns',+v.val,'thorns',(+v.dur)*1000,'Thorns: reflects '+v.val+' dmg per hit.');
      addLog(ctx.cardName+'! [Thorns] ('+v.val+') for '+v.dur+'s.','buff');
    }
  },

  // ── Volatile ──
  volatile_apply: {
    label:'Apply [Volatile] stacks', cat:'debuff',
    desc:'Apply N Volatile stacks to the target.',
    fields:[{id:'stacks', label:'Stacks', type:'number', default:1, min:1, max:5}],
    effectText:  function(v){ return 'Apply '+v.stacks+' [Volatile] stack'+(+v.stacks>1?'s':'')+'.'; },
    tooltipText: function(v){ return 'Volatile: at 5+ stacks detonates for 2× damage. Fizzles below 5.'; },
    typeHint:'attack',
    run: function(v,ctx){ _applyVolatile(+v.stacks); addLog(ctx.cardName+'! +'+v.stacks+' [Volatile].','debuff'); }
  },

  volatile_double: {
    label:'Double [Volatile] stacks', cat:'debuff',
    desc:'Double the current Volatile stack count on the target.',
    fields:[],
    effectText:  function(v){ return 'Double current [Volatile] stacks.'; },
    tooltipText: function(v){ return 'Doubles existing Volatile stacks.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(!gs._volatile) return;
      var add=gs._volatile.stacks;
      _applyVolatile(add);
      addLog(ctx.cardName+'! [Volatile] doubled to '+gs._volatile.stacks+'.','debuff');
    }
  },

  stabilize: {
    label:'[Stabilize]', cat:'utility',
    desc:'Raise Volatile detonation threshold to 10 stacks (10+ = 4× damage).',
    fields:[],
    effectText:  function(v){ return '[Stabilize].'; },
    tooltipText: function(v){ return 'Stabilize: raises Volatile threshold to 10 stacks. 10+ = 4× damage.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(gs._volatile) gs._volatile.stabilized=true;
      else gs._volatile={stacks:0,timer:null,stabilized:true};
      addLog(ctx.cardName+'! [Stabilize] — Volatile threshold raised to 10.','buff');
    }
  },

  // ── Poison self ──
  poison_self: {
    label:'Apply [Poison] to self', cat:'debuff',
    desc:'Apply Poison stacks to this creature (self).',
    fields:[
      {id:'dpt',    label:'Dmg/tick',    type:'number', default:2, min:1, max:20},
      {id:'dur',    label:'Duration (s)',type:'number', default:8, min:1, max:20},
      {id:'stacks', label:'Stacks',      type:'number', default:1, min:1, max:6}
    ],
    effectText:  function(v){ return 'Apply '+v.stacks+' [Poison] to self.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'utility',
    run: function(v,ctx){
      if(ctx.isEnemy) _applyPoisonSelfEnemy(+v.dpt,+v.dur*1000,+v.stacks||1);
      else _applyPoisonSelf(+v.dpt,+v.dur*1000,+v.stacks||1);
      addLog(ctx.cardName+'! Self-[Poison].','debuff');
    }
  },

  // ── Poison both ──
  poison_both: {
    label:'Apply [Poison] to self and target', cat:'debuff',
    desc:'Apply Poison to both this creature and the opponent simultaneously.',
    fields:[
      {id:'dpt',    label:'Dmg/tick',    type:'number', default:4, min:1, max:20},
      {id:'dur',    label:'Duration (s)',type:'number', default:8, min:1, max:20},
      {id:'stacks', label:'Stacks each', type:'number', default:2, min:1, max:6}
    ],
    effectText:  function(v){ return 'Apply '+v.stacks+' [Poison] to self and target.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'debuff',
    run: function(v,ctx){
      if(ctx.isEnemy){
        _applyPoisonToPlayer(+v.dpt, +v.dur*1000);
        _applyPoisonSelfEnemy(+v.dpt, +v.dur*1000, +v.stacks||2);
      } else {
        _applyPoison(+v.dpt, +v.dur*1000);
        _applyPoisonSelf(+v.dpt, +v.dur*1000, +v.stacks||2);
      }
      addLog(ctx.cardName+'! [Poison] to both.','debuff');
    }
  },

  // ── Dmg per poison stacks on enemy ──
  dmg_per_poison_on_enemy: {
    label:'Damage per Poison on target', cat:'damage',
    desc:'Deal damage equal to N × enemy Poison stacks.',
    fields:[
      {id:'base', label:'Dmg per stack', type:'number', default:4, min:1, max:20},
      {id:'min',  label:'Minimum dmg',   type:'number', default:4, min:1, max:20}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage per [Poison] stack on target (min '+v.min+').'; },
    tooltipText: function(v){ return ''; },
    typeHint:'attack',
    run: function(v,ctx){
      var stacks=ctx.isEnemy?_getSelfPoisonStacks():_getEnemyPoisonStacks();
      var d=ctx.pdmg(Math.max(+v.min, stacks*(+v.base)));
      if(ctx.isEnemy) dealDamageToPlayer(d); else dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg ('+stacks+' Poison stacks).','dmg');
    }
  },

  // ── Shed poison ──
  shed_poison: {
    label:'Transfer all [Poison] to target', cat:'utility',
    desc:'Move all self Poison stacks to the opponent.',
    fields:[],
    effectText:  function(v){ return 'Transfer all [Poison] stacks from self to target.'; },
    tooltipText: function(v){ return 'Shed: transfers all Poison from self to opponent.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(ctx.isEnemy) _shedPoisonEnemy(); else _shedPoison();
      addLog(ctx.cardName+'! [Shed] — Poison transferred.','debuff');
    }
  },

  // ── Sacrifice HP ──
  sacrifice_hp: {
    label:'[Sacrifice] HP for effect', cat:'utility',
    desc:'Pay X HP to trigger a nested effect.',
    fields:[
      {id:'cost',   label:'HP cost',     type:'number', default:10, min:1, max:50},
      {id:'effect', label:'Effect obj',  type:'json',   default:'{}'}
    ],
    effectText:  function(v){ return '[Sacrifice] ['+v.cost+' HP]: '+((v.effect&&v.effect.type)||'effect')+'.'; },
    tooltipText: function(v){ return 'Sacrifice: pay '+v.cost+' HP to trigger this.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(ctx.isEnemy){
        if(gs.enemyHp<=+v.cost) return;
        gs.enemyHp-=+v.cost;
        updateAll();
        addLog('[Sacrifice] enemy -'+v.cost+' HP.','debuff');
      } else {
        if(gs.playerHp<=+v.cost) return;
        gs.playerHp-=+v.cost;
        updateAll();
        addLog('[Sacrifice] -'+v.cost+' HP.','debuff');
      }
      if(v.effect&&v.effect.type&&EFFECT_TYPES[v.effect.type])
        EFFECT_TYPES[v.effect.type].run(v.effect,ctx);
    }
  },

  // ── Sacrifice poison stacks ──
  sacrifice_poison_stacks: {
    label:'[Sacrifice] Poison stacks for effect', cat:'utility',
    desc:'Pay X self Poison stacks to trigger a nested effect.',
    fields:[
      {id:'cost',   label:'Stack cost', type:'number', default:3, min:1, max:10},
      {id:'effect', label:'Effect obj', type:'json',   default:'{}'}
    ],
    effectText:  function(v){ return '[Sacrifice] ['+v.cost+' Poison stacks]: '+((v.effect&&v.effect.type)||'effect')+'.'; },
    tooltipText: function(v){ return 'Sacrifice: pay '+v.cost+' Poison stacks to trigger this.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(!_consumeSelfPoison(+v.cost)) return;
      addLog('[Sacrifice] -'+v.cost+' Poison stacks.','debuff');
      if(v.effect&&v.effect.type&&EFFECT_TYPES[v.effect.type])
        EFFECT_TYPES[v.effect.type].run(v.effect,ctx);
    }
  },

  // ── Sorcery wrapper ──
  sorcery: {
    label:'[Sorcery] conditional', cat:'utility',
    desc:'Spend X mana to trigger a nested effect.',
    fields:[
      {id:'cost',   label:'Mana cost',  type:'number', default:20, min:5, max:100},
      {id:'effect', label:'Effect obj', type:'json',   default:'{}'}
    ],
    effectText:  function(v){ return '[Sorcery] ['+v.cost+']: '+((v.effect&&v.effect.type)||'effect')+'.'; },
    tooltipText: function(v){ return 'Sorcery: spend '+v.cost+' mana to trigger.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var pool=ctx.isEnemy?gs.enemyMana:gs.mana;
      if(pool<+v.cost) return;
      if(ctx.isEnemy) gs.enemyMana-=+v.cost; else gs.mana-=+v.cost;
      updateAll();
      addLog('[Sorcery] ['+v.cost+'] fired.','mana');
      if(v.effect&&v.effect.type&&EFFECT_TYPES[v.effect.type])
        EFFECT_TYPES[v.effect.type].run(v.effect,ctx);
    }
  },

  // ── Hellbent wrapper ──
  hellbent: {
    label:'[Hellbent] conditional', cat:'utility',
    desc:'Only triggers if you have no cards in hand.',
    fields:[{id:'effect', label:'Effect obj', type:'json', default:'{}'}],
    effectText:  function(v){ return '[Hellbent]: '+((v.effect&&v.effect.type)||'effect')+'.'; },
    tooltipText: function(v){ return 'Hellbent: only triggers with no cards in hand.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var handLen=ctx.isEnemy?gs.enemyHand.length:gs.hand.length;
      if(handLen>0) return;
      addLog('[Hellbent] triggered!','innate');
      if(v.effect&&v.effect.type&&EFFECT_TYPES[v.effect.type])
        EFFECT_TYPES[v.effect.type].run(v.effect,ctx);
    }
  },

  // ── Refresh (shuffle discard into draw) ──
  refresh: {
    label:'[Refresh]', cat:'utility',
    desc:'Shuffle discard pile into draw pile.',
    fields:[],
    effectText:  function(v){ return '[Refresh].'; },
    tooltipText: function(v){ return 'Refresh: shuffle your discard pile into your draw pile.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(ctx.isEnemy){
        gs.enemyDrawPool=gs.enemyDrawPool.concat(gs.enemyDiscardPile.splice(0));
        for(var i=gs.enemyDrawPool.length-1;i>0;i--){
          var j=Math.floor(Math.random()*(i+1));
          var tmp=gs.enemyDrawPool[i]; gs.enemyDrawPool[i]=gs.enemyDrawPool[j]; gs.enemyDrawPool[j]=tmp;
        }
      } else {
        gs.drawPile=gs.drawPile.concat(gs.discardPile.splice(0));
        for(var i=gs.drawPile.length-1;i>0;i--){
          var j=Math.floor(Math.random()*(i+1));
          var tmp=gs.drawPile[i]; gs.drawPile[i]=gs.drawPile[j]; gs.drawPile[j]=tmp;
        }
        renderPiles();
      }
      addLog('[Refresh] — discard shuffled back into deck.','draw');
    }
  },

  // ── Churn ──
  churn: {
    label:'[Churn]', cat:'utility',
    desc:'Discard N random cards from hand, then draw N.',
    fields:[{id:'count', label:'Count', type:'number', default:1, min:1, max:4}],
    effectText:  function(v){ return '[Churn] '+v.count+'.'; },
    tooltipText: function(v){ return 'Churn '+v.count+': discard '+v.count+' random, draw '+v.count+'.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var n=+v.count;
      var discarded=0;
      if(ctx.isEnemy){
        // Churn enemy hand
        for(var i=0;i<n;i++){
          if(!gs.enemyHand.length) break;
          var ri=Math.floor(Math.random()*gs.enemyHand.length);
          var disc=gs.enemyHand.splice(ri,1)[0];
          gs.enemyDiscardPile.push(disc);
          discarded++;
        }
        for(var d=0;d<discarded;d++){
          var drawn=gs.enemyDrawPool.length?gs.enemyDrawPool.shift():null;
          if(drawn) gs.enemyHand.push(drawn);
        }
      } else {
        for(var i=0;i<n;i++){
          if(!gs.hand.length) break;
          var ri=Math.floor(Math.random()*gs.hand.length);
          var disc=gs.hand.splice(ri,1)[0];
          if(!disc.ghost){ gs.discardPile.push(disc.id); handleCardDiscard(disc.id); spawnCardFloat(disc.id, 'discard'); }
          discarded++;
        }
        for(var d=0;d<discarded;d++) doDraw(null,false);
        renderHand(); renderPiles();
      }
      addLog('[Churn] '+n+'.','draw');
    }
  },

  // ── Conjured — create a temporary copy of this card in the discard pile ──
  conjure_copy: {
    label:'[Conjured] copy', cat:'utility',
    desc:'Create a copy of this card in the discard pile. Copies are temporary — removed at end of battle.',
    fields:[],
    effectText:  function(v){ return '[Conjured] a copy into discard.'; },
    tooltipText: function(v){ return 'Conjured cards circulate normally but are removed at end of battle.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var copyId = ctx.cardId || 'druid_star_shard';
      gs.discardPile.push(copyId);
      gs.conjuredCount = (gs.conjuredCount||0) + 1;
      addLog('[Conjured] ' + (CARDS[copyId]?CARDS[copyId].name:copyId) + ' added to discard.', 'draw');
      renderPiles();
    }
  },

  // ── Purge Conjured — remove ALL conjured copies from everywhere (Echo trigger) ──
  purge_conjured: {
    label:'Purge [Conjured]', cat:'utility',
    desc:'Remove all Conjured copies from hand, deck, and discard.',
    fields:[],
    effectText:  function(v){ return 'Remove all [Conjured] copies from everywhere.'; },
    tooltipText: function(v){ return 'Echo: on discard, purges all temporary copies.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(!gs.conjuredCount || gs.conjuredCount <= 0) return;
      var purged = purgeAllConjured();
      if(purged > 0){
        addLog('[Echo] Purged ' + purged + ' [Conjured] copies.','draw');
        spawnEchoFloat(ctx.cardId || 'druid_star_shard');
        renderHand(); renderPiles();
      }
    }
  },

  // ── Shield from discard pile ──
  shield_from_discard: {
    label:'Shield from discard pile size', cat:'buff',
    desc:'Gain Shield equal to discard pile size × multiplier.',
    fields:[{id:'mult', label:'Multiplier', type:'number', default:2, min:1, max:8}],
    effectText:  function(v){ return 'Gain [Shield] equal to discard pile × '+v.mult+'.'; },
    tooltipText: function(v){ return 'Shield scales with how many cards you\'ve played.'; },
    typeHint:'defense',
    run: function(v,ctx){
      var pile=ctx.isEnemy?gs.enemyDiscardPile:gs.discardPile;
      var amt=(pile.length)*(+v.mult);
      if(ctx.isEnemy){
        if(amt>0){ gs.enemyShell+=amt; setTimeout(function(){ if(!gs) return; gs.enemyShell=Math.max(0,gs.enemyShell-amt); },4000); }
      } else {
        if(amt>0) _applyShield(amt,4000);
      }
      addLog(ctx.cardName+'! Shield +'+(amt||0)+' ('+pile.length+' in discard).','buff');
    }
  },

  // ── Damage based on missing mana ──
  dmg_missing_mana: {
    label:'Damage from missing mana', cat:'damage',
    desc:'Deal damage based on how much mana you are missing.',
    fields:[
      {id:'div', label:'Divisor',    type:'number', default:3, min:1, max:10},
      {id:'min', label:'Min damage', type:'number', default:5, min:1, max:20}
    ],
    effectText:  function(v){ return 'Deal damage equal to missing mana ÷ '+v.div+' (min '+v.min+').'; },
    tooltipText: function(v){ return 'More powerful when your mana has been drained.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var missing=ctx.isEnemy?(gs.enemyMaxMana-gs.enemyMana):(gs.maxMana-gs.mana);
      var d=ctx.pdmg(Math.max(+v.min, Math.floor(missing/(+v.div))));
      if(ctx.isEnemy) dealDamageToPlayer(d); else dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg ('+missing+' missing mana).','dmg');
    }
  },

  // ── Damage based on STR difference ──
  dmg_str_diff: {
    label:'Damage from STR difference', cat:'damage',
    desc:'Deal damage based on opponent STR minus own STR.',
    fields:[
      {id:'mult', label:'Multiplier', type:'number', default:2, min:1, max:5},
      {id:'min',  label:'Min damage', type:'number', default:4, min:1, max:20}
    ],
    effectText:  function(v){ return 'Deal (opponent STR − own STR) × '+v.mult+' damage (min '+v.min+').'; },
    tooltipText: function(v){ return 'Hits harder against high-STR targets.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var ownStr=ctx.isEnemy?ctx.str:gs.stats.str;
      var oppStr=ctx.isEnemy?gs.stats.str:(gs.enemyStats?gs.enemyStats.str:gs.stats.str);
      var diff=Math.max(0, oppStr-ownStr);
      var d=ctx.pdmg(Math.max(+v.min, diff*(+v.mult)));
      if(ctx.isEnemy) dealDamageToPlayer(d); else dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg (STR diff '+diff+').','dmg');
    }
  },

  // ── Damage based on missing HP ──
  dmg_missing_hp: {
    label:'Damage from missing HP', cat:'damage',
    desc:'Deal damage based on how much HP this creature is missing.',
    fields:[
      {id:'div', label:'Divisor',    type:'number', default:2, min:1, max:10},
      {id:'min', label:'Min damage', type:'number', default:4, min:1, max:20}
    ],
    effectText:  function(v){ return 'Deal damage equal to missing HP ÷ '+v.div+' (min '+v.min+').'; },
    tooltipText: function(v){ return 'More powerful when near death.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var missing=ctx.isEnemy?(gs.enemyMaxHp-gs.enemyHp):(gs.playerMaxHp-gs.playerHp);
      var d=ctx.pdmg(Math.max(+v.min, Math.floor(missing/(+v.div))));
      if(ctx.isEnemy) dealDamageToPlayer(d); else dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg ('+missing+' missing HP).','dmg');
    }
  },

  // ── Damage per active second of Slow on target ──
  dmg_per_slow_seconds: {
    label:'Damage per Slow seconds remaining', cat:'damage',
    desc:'Deal damage based on Slow duration remaining on target.',
    fields:[
      {id:'base', label:'Dmg per second', type:'number', default:6, min:1, max:20},
      {id:'min',  label:'Min damage',     type:'number', default:6, min:1, max:20}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage per active second of [Slow] remaining (min '+v.min+').'; },
    tooltipText: function(v){ return 'More powerful when Slow is freshly applied.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var tgt=ctx.isEnemy?'player':'enemy';
      var slowStatus=gs.statusEffects[tgt].find(function(s){return s.stat==='slow_draw';});
      var secs=slowStatus?slowStatus.remaining/1000:0;
      var d=ctx.pdmg(Math.max(+v.min, Math.floor(secs*(+v.base))));
      if(ctx.isEnemy) dealDamageToPlayer(d); else dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg ('+secs.toFixed(1)+'s Slow remaining).','dmg');
    }
  },

  // ── Drain enemy mana (direct steal, not temporary) ──
  drain_enemy_mana: {
    label:'Drain enemy mana', cat:'utility',
    desc:'Directly remove X mana from the enemy.',
    fields:[{id:'amt', label:'Mana drained', type:'number', default:15, min:5, max:60}],
    effectText:  function(v){ return '[Drain] '+v.amt+' mana.'; },
    tooltipText: function(v){ return 'Drain: removes '+v.amt+' mana from enemy directly.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(ctx.isEnemy){ gs.mana=Math.max(0,gs.mana-(+v.amt)); addLog(ctx.cardName+'! -'+v.amt+' mana.','mana'); }
      else { gs.enemyMana=Math.max(0,(gs.enemyMana||0)-(+v.amt)); addLog(ctx.cardName+'! Enemy -'+v.amt+' mana.','mana'); }
      updateAll();
    }
  },

  // ── Heal self ──
  heal_self: {
    label:'Heal self', cat:'buff',
    desc:'Restore X HP to this creature.',
    fields:[{id:'amt', label:'HP healed', type:'number', default:10, min:1, max:50}],
    effectText:  function(v){ return 'Heal '+v.amt+' HP.'; },
    tooltipText: function(v){ return 'Restores '+v.amt+' HP.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(ctx.isEnemy){
        gs.enemyHp=Math.min(gs.enemyMaxHp, gs.enemyHp+(+v.amt));
        spawnFloatNum('enemy','+'+(+v.amt),false,'heal-num');
        flashHpBar('enemy','hp-flash-green');
      } else {
        gs.playerHp=Math.min(gs.playerMaxHp, gs.playerHp+(+v.amt));
      }
      updateAll();
      addLog(ctx.cardName+'! Healed '+v.amt+' HP.','buff');
    }
  },

  // ── Suspend (pause timers) ──
  suspend: {
    label:'[Suspend] timers', cat:'utility',
    desc:'Pause all active buff and debuff timers for X seconds.',
    fields:[{id:'dur', label:'Duration (s)', type:'number', default:2, min:1, max:6}],
    effectText:  function(v){ return '[Suspend] ('+v.dur+').'; },
    tooltipText: function(v){ return 'Suspend: pause all buff/debuff timers for '+v.dur+'s.'; },
    typeHint:'utility',
    run: function(v,ctx){ _suspendTimers(+v.dur); addLog('[Suspend] ('+v.dur+'s).','buff'); }
  },

  // ── Draw speed once (reduce next draw delay) ──
  draw_speed_once: {
    label:'Reduce next draw delay', cat:'buff',
    desc:'Reduce the next draw delay by a fixed amount in ms.',
    fields:[{id:'amt', label:'Reduction (ms)', type:'number', default:1500, min:100, max:3000}],
    effectText:  function(v){ return 'Reduce next draw delay by '+(v.amt/1000).toFixed(1)+'s.'; },
    tooltipText: function(v){ return 'Accelerates the next card draw.'; },
    typeHint:'utility',
    run: function(v,ctx){
      gs._nextDrawBonus=(gs._nextDrawBonus||0)+(+v.amt);
      addLog(ctx.cardName+'! Next draw '+(+v.amt/1000).toFixed(1)+'s faster.','buff');
    }
  },

  haste: {
    label:'Apply [Haste]', cat:'buff',
    desc:'Increase draw speed by X% for a duration.',
    fields:[
      {id:'pct', label:'Speed %',    type:'number', default:20, min:5,  max:100},
      {id:'dur', label:'Duration (s)',type:'number', default:3,  min:1,  max:15}
    ],
    effectText:  function(v){ return 'Gain [Haste] '+v.pct+'% for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Haste: draw speed +'+v.pct+'% for '+v.dur+'s.'; },
    typeHint:'buff',
    run: function(v,ctx){
      var pct=+v.pct/100, dur=(+v.dur)*1000;
      if(ctx.isEnemy){
        applyStatus('enemy','buff','Haste',pct,'atkspeed',dur,'Haste: +'+v.pct+'% draw speed for '+v.dur+'s.');
      } else {
        gs.drawSpeedBonus=(gs.drawSpeedBonus||1)*(1+pct);
        gs.drawSpeedBonusTimer=Math.max(gs.drawSpeedBonusTimer||0, dur);
        addTag('player','buff','Haste (+'+v.pct+'%)',null,null,'Haste: draw speed +'+v.pct+'% for '+v.dur+'s.');
        setTimeout(function(){
          if(!gs) return;
          gs.drawSpeedBonus=Math.max(1.0, gs.drawSpeedBonus/(1+pct));
          removeTagByLabel('player','Haste (+'+v.pct+'%)');
        }, dur);
      }
      addLog(ctx.cardName+'! [Haste] +'+v.pct+'% for '+v.dur+'s.','buff');
    }
  },

  // ── Per-debuff damage ──
  dmg_per_debuff: {
    label:'Damage per active debuff on target', cat:'damage',
    desc:'Deal base damage plus N per active debuff on enemy.',
    fields:[
      {id:'base', label:'Base dmg',     type:'number', default:4, min:1, max:20},
      {id:'min',  label:'Min damage',   type:'number', default:4, min:1, max:20}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage per active debuff on target (min '+v.min+').'; },
    tooltipText: function(v){ return 'More powerful when enemy is heavily debuffed.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var tgt=ctx.isEnemy?'player':'enemy';
      var debuffs=gs.statusEffects[tgt].filter(function(s){return s.cls==='debuff';}).length;
      var d=ctx.pdmg(Math.max(+v.min, debuffs*(+v.base)));
      if(ctx.isEnemy) dealDamageToPlayer(d); else dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg ('+debuffs+' debuffs).','dmg');
    }
  },

  cursed: {
    label:'Apply [Cursed]', cat:'debuff',
    desc:'Reduce enemy damage output.',
    fields:[{id:'dur', label:'Duration (s)', type:'number', default:5, min:1, max:20}],
    effectText:  function(v){ return 'Apply Weaken for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Weaken: enemy deals 15% less damage.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      applyStatus('enemy','debuff','Cursed',-0.15,'dmg',(+v.dur)*1000,'Cursed: enemy dmg -15%.');
      addLog(ctx.cardName+'! Cursed '+v.dur+'s.','debuff');
    }
  },

  marked: {
    label:'Apply [Marked]', cat:'debuff',
    desc:'Enemy takes +50% damage from all sources.',
    fields:[{id:'dur', label:'Duration (s)', type:'number', default:4, min:1, max:15}],
    effectText:  function(v){ return 'Apply Vulnerable for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Vulnerable: enemy takes 50% more damage from all sources.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      applyStatus('enemy','debuff','Marked',0.5,'death_mark',(+v.dur)*1000,'Marked: +50% dmg taken.');
      addLog(ctx.cardName+'! Marked '+v.dur+'s.','debuff');
    }
  },

  poison: {
    label:'Apply [Poison]', cat:'debuff',
    desc:'Apply or stack Poison DoT. Ticks every 2s, bypasses Shield.',
    fields:[
      {id:'dpt', label:'Dmg per 2s',  type:'number', default:6, min:1, max:40},
      {id:'dur', label:'Duration (s)', type:'number', default:8, min:2, max:20}
    ],
    effectText:  function(v){ return 'Apply '+v.dpt+' Poison for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Poison: stacking DoT. Deals damage every 2s, bypasses Shield.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      if(ctx.isEnemy) _applyPoisonToPlayer(+v.dpt,(+v.dur)*1000);
      else _applyPoison(+v.dpt,(+v.dur)*1000);
      addLog(ctx.cardName+'! Poison +'+v.dpt+'/s.','debuff');
    }
  },

  poison_stat: {
    label:'Apply [Poison] (stat-scaling)', cat:'debuff',
    desc:'Poison amount scales with a stat.',
    fields:[
      {id:'base', label:'Base dpt',  type:'number', default:2,   min:0, max:20},
      {id:'stat', label:'Stat',      type:'select',  default:'wis', options:['str','agi','wis']},
      {id:'div',  label:'Divisor',   type:'number', default:4,   min:1, max:10},
      {id:'dur',  label:'Dur (s)',   type:'number', default:8,   min:2, max:20}
    ],
    effectText:  function(v){ return 'Apply '+(v.base?v.base+'+':'')+v.stat.toUpperCase()+'/'+v.div+' Poison for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Poison: stacking DoT. Deals damage every 2s, bypasses Shield.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      var dpt=+v.base+Math.floor((ctx[v.stat]||0)/+v.div);
      _applyPoison(dpt,(+v.dur)*1000);
      addLog(ctx.cardName+'! Poison +'+dpt+'/s.','debuff');
    }
  },

  burn: {
    label:'Apply [Burn]', cat:'debuff',
    desc:'Apply or stack Burn DoT. Ticks every 3s, bypasses Shield.',
    fields:[
      {id:'dpt', label:'Dmg per 3s',  type:'number', default:3, min:1, max:40},
      {id:'dur', label:'Duration (s)', type:'number', default:9, min:3, max:30}
    ],
    effectText:  function(v){ return 'Apply '+v.dpt+' Burn for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Burn: '+v.dpt+' dmg every 3s. Bypasses Shield. Refreshes on reapplication.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      _applyBurn(+v.dpt,(+v.dur)*1000);
      addLog(ctx.cardName+'! Burn +'+v.dpt+'/s.','debuff');
    }
  },

  burn_stat: {
    label:'Apply [Burn] (stat-scaling)', cat:'debuff',
    desc:'Burn amount scales with a stat.',
    fields:[
      {id:'base', label:'Base dpt',  type:'number', default:2,   min:0, max:20},
      {id:'stat', label:'Stat',      type:'select',  default:'wis', options:['str','agi','wis']},
      {id:'div',  label:'Divisor',   type:'number', default:3,   min:1, max:10},
      {id:'dur',  label:'Dur (s)',   type:'number', default:9,   min:3, max:30}
    ],
    effectText:  function(v){ return 'Apply '+(v.base?v.base+'+':'')+v.stat.toUpperCase()+'/'+v.div+' Burn for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Burn: '+v.dpt+' dmg every 3s. Bypasses Shield. Refreshes on reapplication.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      var dpt=+v.base+Math.floor((ctx[v.stat]||0)/+v.div);
      _applyBurn(dpt,(+v.dur)*1000);
      addLog(ctx.cardName+'! Burn +'+dpt+'/s.','debuff');
    }
  },

  poison_detonate: {
    label:'Detonate [Poison]', cat:'debuff',
    desc:'Burst all current Poison as instant damage (bypasses Shield).',
    fields:[
      {id:'reapply', label:'Reapply after?', type:'select', default:'no', options:['no','yes']},
      {id:'rdpt',    label:'Reapply dpt',    type:'number', default:4, min:1, max:20}
    ],
    effectText:  function(v){ return 'Detonate all [Poison] as instant damage.'+(v.reapply==='yes'?' Reapply ('+v.rdpt+'/s).':''); },
    tooltipText: function(v){ return '[Poison] detonation bypasses [Shield].'; },
    typeHint:'attack',
    run: function(v,ctx){
      var pe=gs.statusEffects.enemy.find(function(s){return s.id==='poison';});
      if(pe&&pe.dpt>0){
        var burst=pe.dpt;
        gs.statusEffects.enemy.splice(gs.statusEffects.enemy.indexOf(pe),1);
        removeTagByLabel('enemy',pe.label);
        gs.enemyHp=Math.max(0,gs.enemyHp-burst);
        spawnFloatNum('enemy','VENOM! -'+burst,burst>=30,'crit-num');
        flashHpBar('enemy','hp-flash-red'); updateAll(); checkEnd();
        addLog(ctx.cardName+'! Poison detonated — '+burst+' instant dmg!','innate');
        if(v.reapply==='yes') _applyPoison(+v.rdpt,8000);
      } else {
        addLog(ctx.cardName+' — no Poison to detonate.','dmg');
      }
    }
  },

  burn_detonate: {
    label:'Detonate [Burn]', cat:'debuff',
    desc:'Burst all current Burn as instant damage, then optionally reapply.',
    fields:[
      {id:'reapply', label:'Reapply after?', type:'select', default:'yes', options:['no','yes']},
      {id:'rdpt',    label:'Reapply dpt',    type:'number', default:4, min:1, max:20}
    ],
    effectText:  function(v){ return 'Detonate all [Burn] as instant damage.'+(v.reapply==='yes'?' Reapply ('+v.rdpt+'/s).':''); },
    tooltipText: function(v){ return '[Burn] detonation bypasses [Shield].'; },
    typeHint:'attack',
    run: function(v,ctx){
      var be=gs.statusEffects.enemy.find(function(s){return s.id==='burn';});
      if(be&&be.dpt>0){
        var burst=be.dpt*3;
        gs.enemyHp=Math.max(0,gs.enemyHp-burst);
        spawnFloatNum('enemy','-'+burst,true,'crit-num');
        flashHpBar('enemy','hp-flash-red'); updateAll(); checkEnd();
        gs.statusEffects.enemy=gs.statusEffects.enemy.filter(function(s){return s.id!=='burn';});
        removeTagByLabel('enemy',be.label);
        addLog(ctx.cardName+'! Burn detonated — '+burst+' instant dmg!','innate');
        if(v.reapply==='yes') _applyBurn(+v.rdpt,9000);
      } else {
        addLog(ctx.cardName+' — no Burn to detonate.','dmg');
      }
    }
  },

  // ── BUFFS ───────────────────────────────────────────

  mana: {
    label:'Gain Mana', cat:'buff',
    desc:'Restore mana immediately.',
    fields:[{id:'amt', label:'Mana', type:'number', default:25, min:5, max:200}],
    effectText:  function(v){ return 'Gain '+v.amt+' mana.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'utility',
    run: function(v,ctx){
      gs.mana=Math.min(gs.maxMana,gs.mana+(+v.amt));
      addLog(ctx.cardName+'! +'+v.amt+' mana.','mana');
    }
  },

  draw_speed: {
    label:'Draw Speed Boost', cat:'buff',
    desc:'Temporarily increase card draw rate.',
    fields:[
      {id:'pct', label:'Boost %', type:'number', default:30, min:5,  max:100},
      {id:'dur', label:'Dur (s)', type:'number', default:3,  min:1,  max:15}
    ],
    effectText:  function(v){ return 'Draw speed +'+v.pct+'% for '+v.dur+'s.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'utility',
    run: function(v,ctx){
      gs.drawSpeedBonus=(gs.drawSpeedBonus||1)+(+v.pct/100);
      gs.drawSpeedBonusTimer=Math.max(gs.drawSpeedBonusTimer||0,(+v.dur)*1000);
      addLog(ctx.cardName+'! Draw speed +'+v.pct+'% for '+v.dur+'s.','buff');
    }
  },

  shield: {
    label:'Apply [Shield]', cat:'buff',
    desc:'Absorb incoming direct damage. DoTs bypass it.',
    fields:[
      {id:'amt',       label:'Shield HP',  type:'number', default:20, min:5, max:200},
      {id:'dur',       label:'Dur (s)',    type:'number', default:5,  min:2, max:20},
      {id:'onexpiry',  label:'On expiry',  type:'select', default:'nothing',
       options:['nothing','gain_mana','deal_dmg']},
      {id:'expiry_val',label:'Expiry val', type:'number', default:30, min:1, max:200}
    ],
    effectText: function(v){
      var exp=v.onexpiry==='gain_mana'?' On expiry: gain '+v.expiry_val+' mana.'
             :v.onexpiry==='deal_dmg' ?' On expiry: deal '+v.expiry_val+' damage.':'';
      return 'Apply [Shield] ('+v.amt+') for '+v.dur+'s.'+exp;
    },
    tooltipText: function(v){ return 'Shield: absorbs direct damage before HP. DoTs bypass it.'; },
    typeHint:'defense',
    run: function(v,ctx){
      var amt=+v.amt, dur=(+v.dur)*1000, ev=+v.expiry_val;
      if(ctx.isEnemy){
        // Enemy shielding itself
        gs.enemyShell+=amt;
        addTag('enemy','buff','Shield ('+amt+')',null,null,'Enemy shield: '+amt+'.');
        setTimeout(function(){ if(!gs) return; gs.enemyShell=Math.max(0,gs.enemyShell-amt); }, dur);
        addLog(ctx.cardName+'! Enemy Shield +'+amt+' for '+v.dur+'s.','buff');
      } else {
        _applyShield(amt, dur, function(){
          if(v.onexpiry==='gain_mana'){ gs.mana=Math.min(gs.maxMana,gs.mana+ev); addLog('Shield expired — +'+ev+' mana.','mana'); }
          else if(v.onexpiry==='deal_dmg'){ dealDamageToEnemy(ev); addLog('Shield expired — '+ev+' dmg burst!','dmg'); }
        });
        addLog(ctx.cardName+'! Shield +'+amt+' for '+v.dur+'s.','buff');
      }
    }
  },

  shield_stat: {
    label:'Apply [Shield] (STR-scaling)', cat:'buff',
    desc:'Shield amount scales with STR.',
    fields:[
      {id:'mult',      label:'STR multiplier',type:'number', default:1,   min:0.5, max:5, hint:'shield = STR × mult'},
      {id:'dur',       label:'Dur (s)',        type:'number', default:5,   min:2, max:20},
      {id:'onexpiry',  label:'On expiry',      type:'select', default:'nothing',
       options:['nothing','gain_mana','deal_dmg']},
      {id:'expiry_val',label:'Expiry val',     type:'number', default:20, min:1, max:200}
    ],
    effectText: function(v){
      var exp=v.onexpiry==='gain_mana'?' On expiry: gain '+v.expiry_val+' mana.'
             :v.onexpiry==='deal_dmg' ?' On expiry: deal '+v.expiry_val+' damage.':'';
      return 'Apply [Shield] (STR\u00d7'+v.mult+') for '+v.dur+'s.'+exp;
    },
    tooltipText: function(v){ return 'Shield: absorbs direct damage before HP. DoTs bypass it.'; },
    typeHint:'defense',
    run: function(v,ctx){
      var amt=Math.round(ctx.str*(+v.mult)), dur=(+v.dur)*1000, ev=+v.expiry_val;
      _applyShield(amt, dur, function(){
        if(v.onexpiry==='gain_mana'){ gs.mana=Math.min(gs.maxMana,gs.mana+ev); addLog('Shield expired — +'+ev+' mana.','mana'); }
        else if(v.onexpiry==='deal_dmg'){ dealDamageToEnemy(ev); addLog('Shield expired — '+ev+' dmg burst!','dmg'); }
      });
      addLog(ctx.cardName+'! Shield +'+amt+' for '+v.dur+'s.','buff');
    }
  },

  dodge: {
    label:'Gain [Dodge]', cat:'buff',
    desc:'Next incoming attack is completely evaded.',
    fields:[],
    effectText:  function(v){ return 'Gain Dodge.'; },
    tooltipText: function(v){ return 'Dodge: next incoming attack is completely evaded.'; },
    typeHint:'utility',
    run: function(v,ctx){
      gs.playerDodge=true;
      addTag('player','buff','Dodge',null,null,'Next incoming attack will be evaded.');
      addLog(ctx.cardName+'! Dodge ready.','buff');
    }
  },

  heal: {
    label:'Heal HP', cat:'buff',
    desc:'Restore a flat amount of HP.',
    fields:[{id:'amt', label:'HP restored', type:'number', default:5, min:1, max:80}],
    effectText:  function(v){ return 'Restore '+v.amt+' HP.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'defense',
    run: function(v,ctx){
      var h=Math.min(+v.amt,gs.playerMaxHp-gs.playerHp);
      gs.playerHp=Math.min(gs.playerMaxHp,gs.playerHp+h);
      if(h>0){ spawnHealNum('player',h); flashHpBar('player','hp-flash-green'); }
      addLog(ctx.cardName+'! +'+h+' HP.','heal');
    }
  },

  // ── UTILITY ─────────────────────────────────────────

  stun: {
    label:'Stun Enemy', cat:'utility',
    desc:'Prevent the enemy from acting briefly.',
    fields:[{id:'dur', label:'Duration (ms)', type:'number', default:800, min:200, max:3000}],
    effectText:  function(v){ return 'Stun enemy for '+(+v.dur/1000).toFixed(1)+'s.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'utility',
    run: function(v,ctx){
      stunEnemy(+v.dur);
      addLog(ctx.cardName+'! Enemy stunned '+(+v.dur/1000).toFixed(1)+'s.','innate');
    }
  },

  drain_mana: {
    label:'Drain Own Mana', cat:'utility',
    desc:'Spend a portion of your own mana as a cost.',
    fields:[{id:'pct', label:'% of max mana', type:'number', default:30, min:10, max:100}],
    effectText:  function(v){ return 'Drain '+v.pct+'% max mana.'; },
    tooltipText: function(v){ return 'Drain: removes mana from your bar.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var cost=Math.round(gs.maxMana*(+v.pct/100));
      gs.mana=Math.max(0,gs.mana-cost);
      addLog(ctx.cardName+'! -'+cost+' mana.','mana');
    }
  },

  draw_cards: {
    label:'Draw Cards', cat:'utility',
    desc:'Immediately draw extra cards into hand.',
    fields:[{id:'count', label:'Cards to draw', type:'number', default:2, min:1, max:4}],
    effectText:  function(v){ return 'Draw '+v.count+' card'+(+v.count>1?'s':'')+'.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'utility',
    run: function(v,ctx){
      var n=+v.count;
      for(var i=0;i<n;i++) doDraw(null,false);
      addLog(ctx.cardName+'! Drew '+n+' card'+(n>1?'s':'')+'.','draw');
    }
  },

  // ── Damage per card in hand ──
  dmg_per_hand_card: {
    label:'Damage per card in hand', cat:'damage',
    desc:'Deal base damage multiplied by current hand size.',
    fields:[
      {id:'base', label:'Dmg per card', type:'number', default:15, min:1, max:50},
      {id:'min',  label:'Minimum dmg',  type:'number', default:15, min:1, max:50}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage per card in hand (min '+v.min+').'; },
    tooltipText: function(v){ return 'More powerful with a full hand.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var hc=ctx.isEnemy?gs.enemyHand.length:gs.hand.length;
      var d=ctx.pdmg(Math.max(+v.min, hc*(+v.base)));
      if(ctx.isEnemy) dealDamageToPlayer(d); else dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg ('+hc+' cards in hand).','dmg');
    }
  },

  // ── Drain a percentage of own max mana ──
  drain_self_pct: {
    label:'Drain own mana (% of max)', cat:'utility',
    desc:'Remove a percentage of this creature\'s own max mana.',
    fields:[{id:'pct', label:'% of max mana', type:'number', default:80, min:10, max:100}],
    effectText:  function(v){ return '[Drain] '+v.pct+'% of max mana.'; },
    tooltipText: function(v){ return 'Drain: removes '+v.pct+'% of your max mana.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var pool=ctx.isEnemy?gs.enemyMana:gs.mana;
      var maxPool=ctx.isEnemy?gs.enemyMaxMana:gs.maxMana;
      var cost=Math.round(maxPool*(+v.pct/100));
      if(ctx.isEnemy) gs.enemyMana=Math.max(0,gs.enemyMana-cost);
      else gs.mana=Math.max(0,gs.mana-cost);
      updateAll();
      addLog(ctx.cardName+'! -'+cost+' mana ('+v.pct+'% of max).','mana');
    }
  },

  // ── Gain mana ──
  mana_gain: {
    label:'Gain mana', cat:'buff',
    desc:'Immediately gain X mana.',
    fields:[{id:'amt', label:'Mana gained', type:'number', default:50, min:5, max:200}],
    effectText:  function(v){ return 'Gain '+v.amt+' mana.'; },
    tooltipText: function(v){ return 'Gain '+v.amt+' mana immediately.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(ctx.isEnemy) gs.enemyMana=Math.min(gs.enemyMaxMana,(gs.enemyMana||0)+(+v.amt));
      else gs.mana=Math.min(gs.maxMana,gs.mana+(+v.amt));
      updateAll();
      addLog(ctx.cardName+'! +'+v.amt+' mana.','mana');
    }
  },

  steal_mana: {
    label:'Steal Enemy Mana', cat:'utility',
    desc:'Temporarily reduce enemy mana pool.',
    fields:[
      {id:'amt', label:'Mana stolen', type:'number', default:20, min:5,  max:100},
      {id:'dur', label:'Duration (s)',type:'number', default:3,  min:1,  max:10}
    ],
    effectText:  function(v){ return 'Steal '+v.amt+' mana for '+v.dur+'s.'; },
    tooltipText: function(v){ return 'Temporarily reduces enemy mana pool.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var ms=gs.statusEffects.enemy.find(function(s){return s.id==='mana_drain';});
      if(ms){ ms.val=+v.amt; ms.remaining=(+v.dur)*1000; }
      else gs.statusEffects.enemy.push({id:'mana_drain',label:'Mana Drained',cls:'debuff',
        stat:'mana_drain',val:+v.amt,remaining:(+v.dur)*1000,maxRemaining:(+v.dur)*1000});
      addTag('enemy','debuff','Mana Drained',0,'mana_drain','Enemy mana reduced by '+v.amt+' for '+v.dur+'s.');
      addLog(ctx.cardName+'! Enemy -'+v.amt+' mana.','mana');
    }
  },

  discard_hand: {
    label:'Discard from Hand', cat:'utility',
    desc:'Discard N random cards from your own hand (downside on powerful cards).',
    fields:[{id:'count', label:'Cards discarded', type:'number', default:1, min:1, max:4}],
    effectText:  function(v){ return 'Discard '+v.count+' card'+(+v.count>1?'s':'')+' at random.'; },
    tooltipText: function(v){ return 'Discarded cards return to your deck.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var n=Math.min(+v.count,gs.hand.length);
      for(var i=0;i<n;i++){
        if(!gs.hand.length) break;
        var ri=Math.floor(Math.random()*gs.hand.length);
        var disc=gs.hand.splice(ri,1)[0];
        var dc=CARDS[disc.id];
        if(!disc.ghost){ gs.discardPile.push(disc.id); handleCardDiscard(disc.id); spawnCardFloat(disc.id, 'discard'); }
        addLog('Discarded '+(dc?dc.name:disc.id)+'.','draw');
      }
      renderHand(); renderPiles();
      addLog(ctx.cardName+'! Discarded '+n+' card'+(n>1?'s':'')+'.','innate');
    }
  },

  holy_flame: {
    label:'Trigger Holy Flame', cat:'utility',
    desc:'Triggers Holy Flame (Paladin innate — applies Burn on debuffs/buffs).',
    fields:[],
    effectText:  function(v){ return 'Trigger Holy Flame.'; },
    tooltipText: function(v){ return 'Holy Flame: Paladin innate. Applying debuffs or buffs also applies stacking Burn.'; },
    typeHint:'attack',
    run: function(v,ctx){ triggerHolyFlame(); }
  },

  // ── CONDITIONAL DAMAGE ─────────────────────────────

  dmg_if_shielded: {
    label:'Damage (bonus if Shielded)', cat:'damage',
    desc:'Deal more damage while your own Shield is active.',
    fields:[
      {id:'base', label:'Normal Dmg', type:'number', default:5,  min:1, max:100},
      {id:'high', label:'Shielded Dmg', type:'number', default:12, min:1, max:200}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. If you have Shield: deal '+v.high+'.'; },
    tooltipText: function(v){ return 'Shield: absorbs direct damage before HP. DoTs bypass it.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var shielded=gs.playerShield>0;
      var d=ctx.pdmg(shielded?+v.high:+v.base);
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(shielded?' (shield bonus!)':'')+'.','dmg');
    }
  },

  dmg_if_slowed: {
    label:'Damage (bonus if enemy Slowed)', cat:'damage',
    desc:'Deal more damage if the enemy is currently Slowed.',
    fields:[
      {id:'base', label:'Normal Dmg', type:'number', default:8,  min:1, max:100},
      {id:'high', label:'Slowed Dmg', type:'number', default:16, min:1, max:200}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. If enemy is Slowed: deal '+v.high+'.'; },
    tooltipText: function(v){ return 'Slow: reduces enemy attack speed by 40%.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var slowed=gs.statusEffects.enemy.some(function(s){return s.stat==='atkspeed'&&s.val<0;});
      var d=ctx.pdmg(slowed?+v.high:+v.base);
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(slowed?' (slow bonus!)':'')+'.','dmg');
    }
  },

  dmg_if_poison: {
    label:'Damage (bonus if Poison active)', cat:'damage',
    desc:'Deal more damage if Poison is already applied to the enemy.',
    fields:[
      {id:'base', label:'Normal Dmg',  type:'number', default:6,  min:1, max:100},
      {id:'high', label:'Poison Dmg',  type:'number', default:14, min:1, max:200}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. If enemy has Poison: deal '+v.high+'.'; },
    tooltipText: function(v){ return 'Poison: stacking DoT. Deals damage every 2s, bypasses Shield.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var poisoned=gs.statusEffects.enemy.some(function(s){return s.id==='poison'&&s.dpt>0;});
      var d=ctx.pdmg(poisoned?+v.high:+v.base);
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(poisoned?' (poison bonus!)':'')+'.','dmg');
    }
  },

  dmg_if_burn: {
    label:'Damage (bonus if Burn active)', cat:'damage',
    desc:'Deal more damage if Burn is already applied to the enemy.',
    fields:[
      {id:'base', label:'Normal Dmg', type:'number', default:6,  min:1, max:100},
      {id:'high', label:'Burn Dmg',   type:'number', default:14, min:1, max:200}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. If enemy has Burn: deal '+v.high+'.'; },
    tooltipText: function(v){ return 'Burn: '+v.dpt+' dmg every 3s. Bypasses Shield. Refreshes on reapplication.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var burning=gs.statusEffects.enemy.some(function(s){return s.id==='burn'&&s.dpt>0;});
      var d=ctx.pdmg(burning?+v.high:+v.base);
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(burning?' (burn bonus!)':'')+'.','dmg');
    }
  },

  dmg_if_full_hand: {
    label:'Damage (bonus at full hand)', cat:'damage',
    desc:'Deal more damage when holding the maximum number of cards.',
    fields:[
      {id:'base', label:'Normal Dmg',    type:'number', default:8,  min:1, max:100},
      {id:'high', label:'Full Hand Dmg', type:'number', default:18, min:1, max:200}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. Full hand: deal '+v.high+' instead.'; },
    tooltipText: function(v){ return 'Rewards holding cards — pairs well with discard-synergy builds.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var full=gs.hand.length>=HAND_SIZE;
      var d=ctx.pdmg(full?+v.high:+v.base);
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(full?' (full hand bonus!)':'')+'.','dmg');
    }
  },

  dmg_first_card: {
    label:'Damage (bonus if first card)', cat:'damage',
    desc:'Deal more damage if this is the first card played this battle.',
    fields:[
      {id:'base',   label:'Normal Dmg', type:'number', default:5,  min:1, max:100},
      {id:'opener', label:'Opener Dmg', type:'number', default:14, min:1, max:200}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage. If first card this battle: deal '+v.opener+' instead.'; },
    tooltipText: function(v){ return 'Opening plays hit harder — set up debuffs before this or use it to open combos.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var isFirst=!gs.lastPlayerCard||gs.lastPlayerCard===ctx.cardName;
      // Use cards_played counter from shrine tracking as the reliable first-card check
      var cardsPlayed=PERSIST&&PERSIST.shrineCounters&&PERSIST.shrineCounters.cards_played||0;
      var opener=cardsPlayed<=1;
      var d=ctx.pdmg(opener?+v.opener:+v.base);
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg'+(opener?' (opener bonus!)':'')+'.','dmg');
    }
  },

  // ── CONDITIONAL UTILITY ─────────────────────────────

  mana_if_debuffed: {
    label:'Mana (bonus if enemy debuffed)', cat:'buff',
    desc:'Gain mana — more if the enemy has active debuffs.',
    fields:[
      {id:'base', label:'Base Mana',  type:'number', default:20, min:5, max:150},
      {id:'high', label:'Bonus Mana', type:'number', default:45, min:5, max:200}
    ],
    effectText:  function(v){ return 'Gain '+v.base+' mana. If enemy is debuffed: gain '+v.high+' instead.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'utility',
    run: function(v,ctx){
      var hasD=gs.statusEffects.enemy.some(function(x){return x.cls==='debuff';});
      var amt=hasD?+v.high:+v.base;
      gs.mana=Math.min(gs.maxMana,gs.mana+amt);
      addLog(ctx.cardName+'! +'+amt+' mana'+(hasD?' (debuff bonus!)':'')+'.','mana');
    }
  },

  bonus_effect_if_slowed: {
    label:'Apply [Slow] (extend if already Slowed)', cat:'debuff',
    desc:'Apply Slow — if enemy is already Slowed, extend the duration instead.',
    fields:[
      {id:'dur',     label:'Duration (s)',  type:'number', default:4, min:1, max:15},
      {id:'ext_dur', label:'Extended (s)',  type:'number', default:8, min:1, max:20}
    ],
    effectText:  function(v){ return 'Apply Slow for '+v.dur+'s. Already Slowed: extend to '+v.ext_dur+'s.'; },
    tooltipText: function(v){ return 'Slow: reduces enemy attack speed by 40%.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      var existing=gs.statusEffects.enemy.find(function(s){return s.stat==='atkspeed'&&s.val<0;});
      var dur=(existing?+v.ext_dur:+v.dur)*1000;
      if(existing){ existing.remaining=Math.max(existing.remaining,dur); addLog(ctx.cardName+'! Slow extended to '+v.ext_dur+'s.','debuff'); }
      else{ applyStatus('enemy','debuff','Slow',-0.4,'atkspeed',dur,'Slow: atk speed -40%.'); addLog(ctx.cardName+'! Slowed '+v.dur+'s.','debuff'); }
    }
  },

  // ── ESCALATION ──────────────────────────────────────

  draw_speed_permanent: {
    label:'Draw Speed (permanent, stacking)', cat:'buff',
    desc:'Permanently reduce your draw interval — gets faster each time this card is played.',
    fields:[
      {id:'pct',     label:'Per-play %', type:'number', default:3,  min:1, max:10,
       hint:'Stacks each play. Max caps at 30%.'},
      {id:'max_pct', label:'Max %',      type:'number', default:30, min:5, max:50}
    ],
    effectText:  function(v){ return 'Draw interval -'+v.pct+'% permanently (stacks, max '+v.max_pct+'%).'; },
    tooltipText: function(v){ return 'Each time this is played your deck cycles faster — stacks up to '+v.max_pct+'%.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var key='_permDrawStacks_'+ctx.cardName.replace(/\s/g,'');
      if(!gs[key]) gs[key]=0;
      var maxStacks=Math.round(+v.max_pct/+v.pct);
      if(gs[key]<maxStacks){
        gs[key]++;
        gs.drawIntervalBase=Math.max(300,(gs.drawIntervalBase||2000)*(1-(+v.pct/100)));
        addLog(ctx.cardName+'! Draw interval -'+v.pct+'% (×'+gs[key]+').','buff');
      } else {
        addLog(ctx.cardName+'! Draw speed maxed out.','buff');
      }
    }
  },

  dmg_scaling_played: {
    label:'Damage (scales with times played)', cat:'damage',
    desc:'Deals more damage each time it has been played this battle.',
    fields:[
      {id:'base',    label:'Base Dmg',    type:'number', default:6, min:1, max:50},
      {id:'per_play',label:'+ per play',  type:'number', default:3, min:1, max:20},
      {id:'max_bonus',label:'Max bonus',  type:'number', default:18, min:5, max:100}
    ],
    effectText:  function(v){ return 'Deal '+v.base+'+'+v.per_play+' dmg per prior play this battle (max +'+v.max_bonus+').'; },
    tooltipText: function(v){ return 'Rewards building a deck that draws this card repeatedly.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var key='_playCount_'+ctx.cardName.replace(/\s/g,'');
      gs[key]=(gs[key]||0);
      var bonus=Math.min(gs[key]*(+v.per_play),+v.max_bonus);
      var d=ctx.pdmg(+v.base+bonus);
      gs[key]++;
      dealDamageToEnemy(d);
      addLog(ctx.cardName+'! '+d+' dmg (played '+gs[key]+'×).','dmg');
    }
  },

  // ── SORCERY ─────────────────────────────────────────

  sorcery: {
    label:'Sorcery (conditional mana bonus)', cat:'utility',
    desc:'Pay X mana to trigger a bonus effect. If you cannot afford it, the base card still resolves — only the bonus is skipped.',
    fields:[
      {id:'cost',  label:'Mana cost',     type:'number', default:20, min:5,  max:200},
      {id:'type2', label:'Bonus type',    type:'select', default:'poison',
       options:['poison','burn','slow','cursed','marked','mana','draw_speed','shield','dodge','heal','stun','dmg','dmg_stat']},
      // Bonus values — interpreted based on type2
      {id:'v1', label:'Value 1 (dpt/amt/base)', type:'number', default:3,  min:1, max:100},
      {id:'v2', label:'Value 2 (dur/div)',       type:'number', default:8,  min:1, max:30},
      {id:'v3', label:'Value 3 (stat — str/agi/wis)', type:'select', default:'wis',
       options:['str','agi','wis','none']},
    ],
    effectText: function(v){
      var bonus = _sorceryBonusText(v);
      return 'Sorcery '+v.cost+': '+bonus;
    },
    tooltipText: function(v){
      return 'Sorcery: pay '+v.cost+' mana to trigger the bonus effect. If you cannot afford it, the bonus is skipped — no mana spent.';
    },
    typeHint:'utility',
    run: function(v,ctx){
      if(gs.mana >= +v.cost){
        gs.mana -= +v.cost;
        // Build a synthetic effect object and dispatch it
        var inner = _sorceryInnerEffect(v);
        if(inner){
          var def = EFFECT_TYPES[inner.type];
          if(def) def.run(inner, ctx);
        }
        addLog(ctx.cardName+' Sorcery! ('+v.cost+' mana)','mana');
      }
      // else: silently skip — base card already resolved before this entry
    }
  }

}; // end EFFECT_TYPES

// Build display text for a sorcery bonus given its field values
function _sorceryBonusText(v){
  var t=v.type2, v1=+v.v1, v2=+v.v2, v3=v.v3;
  if(t==='poison')     return 'Apply '+v1+' Poison for '+v2+'s.';
  if(t==='burn')       return 'Apply '+v1+' Burn for '+v2+'s.';
  if(t==='slow')       return 'Apply Slow for '+v1+'s.';
  if(t==='cursed')     return 'Apply Weaken for '+v1+'s.';
  if(t==='marked')     return 'Apply Vulnerable for '+v1+'s.';
  if(t==='mana')       return 'Gain '+v1+' mana.';
  if(t==='draw_speed') return 'Draw speed +'+v1+'% for '+v2+'s.';
  if(t==='shield')     return 'Apply Shield ('+v1+') for '+v2+'s.';
  if(t==='dodge')      return 'Gain Dodge.';
  if(t==='heal')       return 'Restore '+v1+' HP.';
  if(t==='stun')       return 'Stun enemy for '+(v1/1000).toFixed(1)+'s.';
  if(t==='dmg')        return 'Deal '+v1+' damage.';
  if(t==='dmg_stat')   return 'Deal '+v1+'+'+(v3!=='none'?v3.toUpperCase():'')+'/'+v2+' damage.';
  return t;
}

// Build an inner effect object from sorcery fields, for dispatch through EFFECT_TYPES
function _sorceryInnerEffect(v){
  var t=v.type2, v1=+v.v1, v2=+v.v2, v3=v.v3;
  if(t==='poison')     return {type:'poison',     dpt:v1, dur:v2};
  if(t==='burn')       return {type:'burn',        dpt:v1, dur:v2};
  if(t==='slow')       return {type:'slow',        dur:v1};
  if(t==='cursed')     return {type:'cursed',      dur:v1};
  if(t==='marked')     return {type:'marked',      dur:v1};
  if(t==='mana')       return {type:'mana',        amt:v1};
  if(t==='draw_speed') return {type:'draw_speed',  pct:v1, dur:v2};
  if(t==='shield')     return {type:'shield',      amt:v1, dur:v2, onexpiry:'nothing', expiry_val:0};
  if(t==='dodge')      return {type:'dodge'};
  if(t==='heal')       return {type:'heal',        amt:v1};
  if(t==='stun')       return {type:'stun',        dur:v1};
  if(t==='dmg')        return {type:'dmg',         base:v1};
  if(t==='dmg_stat')   return {type:'dmg_stat',    base:v1, div:v2, stat:v3!=='none'?v3:'wis'};
  return null;
}


// Apply or stack Frenzy on the player.
// ═══════════════════════════════════════════════════════
// FRENZY — stacking player buff
// Stack Rule: Stack — each application adds stacks and refreshes duration
// Duration: 2000ms × 0.9^(stacks-1) — more stacks = shorter window
// Expiry: Full cleanse — when timer hits 0 the whole thing collapses instantly
// Mana Sustain: drains 3 mana/s while active — cleansed immediately if mana = 0
// ═══════════════════════════════════════════════════════
function _applyFrenzy(stacks){
  stacks = stacks || 1;
  var e = gs.statusEffects.player.find(function(s){ return s.id === 'frenzy'; });
  if(e){
    e.stacks = (e.stacks||1) + stacks;
    // Duration: 3s base, each stack reduces max by 10% (×0.9 per stack)
    var dur = Math.round(3000 * Math.pow(0.9, e.stacks - 1));
    e.remaining = dur; e.maxRemaining = dur;
    _updateFrenzyBonus(e.stacks);
    _updateFrenzyTag(e.stacks);
  } else {
    var initDur = Math.round(3000 * Math.pow(0.9, stacks - 1));
    gs.statusEffects.player.push({
      id:'frenzy', label:'Frenzy \xd7'+stacks, cls:'buff', stat:'frenzy',
      stacks:stacks, remaining:initDur, maxRemaining:initDur, dot:false,
      desc:'Frenzy: +10% draw speed per stack. Duration shortens per stack. Manabound. Drains 3 mana/s.'
    });
    addTag('player','buff','Frenzy \xd7'+stacks, stacks, 'frenzy',
      'Frenzy: +10% draw speed per stack. Duration shortens per stack. Manabound. Drains 3 mana/s.');
    _updateFrenzyBonus(stacks);
  }
  if(SETTINGS.logd!=='brief') addLog('Frenzy \xd7'+(e?e.stacks:stacks)+'!','buff');
}

function _getFrenzyStacks(){
  var e = gs.statusEffects.player.find(function(s){ return s.id==='frenzy'; });
  return e ? (e.stacks||0) : 0;
}

function _updateFrenzyBonus(stacks){
  // Replace old bonus cleanly to avoid accumulation errors
  if(gs._frenzyDrawBonus) gs.drawSpeedBonus = Math.max(1,(gs.drawSpeedBonus||1) - gs._frenzyDrawBonus);
  gs._frenzyDrawBonus = stacks * 0.10;
  gs.drawSpeedBonus = (gs.drawSpeedBonus||1) + gs._frenzyDrawBonus;
}

function _clearFrenzy(reason){
  var e = gs.statusEffects.player.find(function(s){ return s.id==='frenzy'; });
  if(!e) return;
  var lbl = e.label;
  gs.statusEffects.player = gs.statusEffects.player.filter(function(s){ return s.id!=='frenzy'; });
  removeTagByLabel('player', lbl);
  // Also clear any old-label tags in case of stale state
  var el = document.getElementById('p-tags');
  if(el){ var stale=el.querySelector('[data-label^="Frenzy"]'); if(stale) stale.remove(); }
  if(gs._frenzyDrawBonus){
    gs.drawSpeedBonus = Math.max(1,(gs.drawSpeedBonus||1) - gs._frenzyDrawBonus);
    gs._frenzyDrawBonus = 0;
  }
  addLog('Frenzy collapsed'+(reason?' ('+reason+')':'')+'!','debuff');
}

function _updateFrenzyTag(stacks){
  var el = document.getElementById('p-tags');
  var tag = el && el.querySelector('[data-label^="Frenzy"]');
  var lbl = 'Frenzy \xd7'+stacks;
  if(tag){ tag.setAttribute('data-label', lbl); tag.textContent = lbl; }
  else { addTag('player','buff',lbl,stacks,'frenzy','Frenzy: +'+stacks+'0% draw speed. 3 mana/s drain.'); }
  // Sync label on the status object
  var e = gs.statusEffects.player.find(function(s){ return s.id==='frenzy'; });
  if(e) e.label = lbl;
}



function executeEffects(effects, pdmgFn, cardId, isAuto, isGhost, markedCrit){
  var s=gs.stats;
  var ctx={
    pdmg:pdmgFn, str:s.str, agi:s.agi, wis:s.wis,
    isAuto:isAuto, isGhost:isGhost, markedCrit:markedCrit,
    cardId:cardId,
    cardName:(CARDS[cardId]&&CARDS[cardId].name)||cardId
  };
  effects.forEach(function(e){
    var def=EFFECT_TYPES[e.type];
    if(def) def.run(e,ctx);
    else addLog('Unknown effect type: '+e.type,'sys');
  });
}

// Enemy-side effect execution — damage targets player, buffs target enemy
// Used by new-format creature cards dispatched through CARDS + EFFECT_TYPES
function executeEnemyEffects(effects, ePdmgFn, cardName, enemy, debuffDurMult){
  debuffDurMult=debuffDurMult||1;
  var eStats=enemy||{};
  var ctx={
    pdmg: ePdmgFn,
    str:  eStats.str||10,
    agi:  eStats.agi||10,
    wis:  eStats.wis||10,
    isAuto:false, isGhost:false, markedCrit:false,
    cardName: cardName||'Enemy',
    isEnemy: true,              // flag so effects know to flip targets
    debuffDurMult: debuffDurMult,
  };
  effects.forEach(function(eff){
    var def=EFFECT_TYPES[eff.type];
    if(!def){ addLog('Unknown enemy effect: '+eff.type,'sys'); return; }
    // For enemy execution: damage effects target player, debuffs target player,
    // buffs/shields target enemy. The EFFECT_TYPES.run functions check ctx.isEnemy.
    def.run(eff, ctx);
  });
}

// Fires when a card enters the discard pile without being played.
// Called from doDraw (hand overflow auto-play), forceAutoplay,
// discard_hand effect, and activateInnate (Starfall discards).
function handleCardDiscard(cardId){
  var c=CARDS[cardId];
  if(!c||!c.onDiscard||!c.onDiscard.length) return;
  // Echo visual — burst at discard pile
  spawnEchoFloat(cardId);
  // Minimal pdmg for on-discard context — no Shadow Mark, no Bulwark bonuses
  function discardPdmg(base){ return Math.max(1,base); }
  executeEffects(c.onDiscard, discardPdmg, cardId, false, false, false);
}


// ═══════════════════════════════════════════════════════
// EXECUTE CARD — main entry point
// ═══════════════════════════════════════════════════════
function executeCard(id,isGhost,isAuto){
  var s=gs.stats; var str=s.str,agi=s.agi,wis=s.wis;
  var c=CARDS[id];

  if(!isGhost){
    gs.lastPlayerCard=id;
    PERSIST.shrineCounters.cards_played=(PERSIST.shrineCounters.cards_played||0)+1;
    PERSIST.shrineCounters.cards_discarded=(PERSIST.shrineCounters.cards_discarded||0)+1;
    if(gs._shrineMomentum) gs.drawSpeedBonus=(gs.drawSpeedBonus||1)*(1+gs._shrineMomentum);
    // Spreading Spores — every 3rd card applies Poison to enemy
    var _pi=CREATURES[gs.champId]&&CREATURES[gs.champId].innate;
    if(_pi&&_pi.id==='spreading_spores'){
      gs._spreadingSporesCount=(gs._spreadingSporesCount||0)+1;
      if(gs._spreadingSporesCount%3===0){ applyDoT('enemy','spread_poison',4,1000,6000,'Spreading Spores: 4/s.'); addLog('Spreading Spores! Poison.','buff'); }
    }
    // Frenzied — gain 1 Frenzy when playing an attack card (damage tag)
    if(_pi&&_pi.id==='frenzied'){
      var _tags=getCardTags(c);
      if(_tags.indexOf('damage')!==-1) _applyFrenzy(1);
    }
    // Waterlogged — all cards gain Sorcery[15]: Apply [Slow] to enemy
    if(_pi&&_pi.id==='waterlogged'){
      if(gs.mana>=15){
        gs.mana-=15;
        applyStatus('enemy','debuff','Slow',600,'slow_draw',4000,'Slow: draw interval +600ms.');
        addLog('Waterlogged — [Slow] applied.','debuff');
        updateAll();
      }
    }
    // Light Fingers — Drain 5 enemy mana on every card play
    if(_pi&&_pi.id==='light_fingers'){
      gs.enemyMana=Math.max(0,(gs.enemyMana||0)-5);
      addLog('Light Fingers — enemy -5 mana.','mana');
    }
    // Effigy — first card each battle refunds its mana cost
    if(gs._effigyFree){ gs._effigyFree=false; gs.mana=Math.min(gs.maxMana,gs.mana+(c&&c.manaCost||10)); addLog('Effigy: first card is free!','mana'); }
  }

  // Shadow Mark — consume critBonus from hand item OR legacy nextCardCrit
  var markedCrit=false;
  if(!isGhost && gs._critBonus > 0){
    markedCrit = true;
  } else if(!isGhost && gs.nextCardCrit && id!=='ghost_shadow_mark'){
    markedCrit=true; gs.nextCardCrit=false; removeTagByLabel('player','Shadow Mark');
  }

  // Player damage multipliers
  function pdmg(base){
    var d=base;
    getStatuses('player','dmg').forEach(function(x){if(x.val>0)d=Math.round(d*(1+x.val));});
    getStatuses('enemy','death_mark').forEach(function(){d=Math.round(d*1.5);});
    if(markedCrit) d=Math.round(d*(gs._relicCritMult||1.5));
    if(gs._bulwarkReady&&getStatus('player','shielded')){ d=Math.round(d*1.5); gs._bulwarkReady=false; removeTagByLabel('player','Bulwark'); }
    if(gs._shrinePredator&&gs.enemyHp>gs.enemyMaxHp*0.75) d=Math.round(d*(1+gs._shrinePredator));
    if(gs._shrineExecutioner&&gs.enemyHp<gs.enemyMaxHp*0.25) d=Math.round(d*(1+gs._shrineExecutioner));
    if(gs._shrineOpenVolley&&gs._shrineOpenVolleyUsed<gs._shrineOpenVolley){ d=d*2; gs._shrineOpenVolleyUsed=(gs._shrineOpenVolleyUsed||0)+1; }
    // Relic: cracked_lens — first card each run +50%
    if(gs._relicFirstCardBonus&&!gs._relicFirstCardUsed){ d=Math.round(d*1.5); gs._relicFirstCardUsed=true; }
    return Math.max(1,d);
  }

  // ── DATA-DRIVEN DISPATCH ──
  // If the card has an effects[] array, run it through the dispatcher.
  if(c&&c.effects&&c.effects.length){
    executeEffects(c.effects, pdmg, id, isAuto, isGhost, markedCrit);
    // Also fire onDiscard if this was auto-played (auto-play = discard without intentional play)
    if(isAuto&&c.onDiscard&&c.onDiscard.length) handleCardDiscard(id);
    return;
  }

  // ── CUSTOM CARD BRANCHES ──
  // Cards below need logic that can't yet be expressed as effects[].
  // Each is commented with WHY it needs custom code, so we know
  // what new EFFECT_TYPES to add when we want to migrate it.

  if(id==='strike'){
    // markedCrit feedback log — could migrate once we add a crit_feedback effect type
    var strikeDmg=pdmg(18);
    dealDamageToEnemy(strikeDmg);
    if(markedCrit){ spawnFloatNum('enemy','CRIT!',false,'crit-num'); addLog('Strike CRIT! (Shadow Mark) — '+strikeDmg+' dmg!','innate'); }
  }
  else if(id==='filler'){
    // Dead Weight — spend all current mana to draw 1 card
    var fillerMana=gs.mana;
    if(fillerMana>0){
      gs.mana=0;
      doDraw(null,false);
      addLog('Dead Weight: spent '+fillerMana+' mana to draw 1 card.','draw');
    } else {
      addLog('Dead Weight: no mana to spend.','sys');
    }
  }
  else if(id==='gr_gnaw'){
    // Core generator: damage + 1 Frenzy stack
    var gnawDmg=pdmg(3+Math.floor(agi/4));
    dealDamageToEnemy(gnawDmg);
    _applyFrenzy(1);
    addLog('Gnaw! '+gnawDmg+' dmg + Frenzy.','dmg');
  }
  else if(id==='sk_march'){
    // Permanently reduces drawIntervalBase each play (per-run mutation)
    dealDamageToEnemy(pdmg(4));
    gs.drawIntervalBase=Math.max(300,(gs.drawIntervalBase||2000)*0.95);
    addLog('Death March! 4 dmg + draw interval -5% permanently.','buff');
  }
  else if(id==='cg_bloat_pulse'){
    // Shield with a poison-aura DoT while it's active — needs an active flag
    var cgS=str; gs.playerShield+=cgS; gs._bloatShieldActive=true;
    addTag('player','shield','Bloat Shield ('+cgS+')',null,null,'Bloat: '+cgS+' shield 5s. Enemy takes 2 Poison/s while active.');
    setTimeout(function(){
      if(!gs) return;
      gs.playerShield=Math.max(0,gs.playerShield-cgS); gs._bloatShieldActive=false;
      removeTagsByClass('player','shield');
      addLog('Bloat Shield expired.','buff');
    },5000);
    addLog('Bloat Pulse! '+cgS+' shield 5s — enemy takes 2 Poison/s.','buff');
  }
  else if(id==='cw_hex_shield'){
    // Shield that applies Cursed to enemy on expiry — expiry debuff isn't in effect types yet
    gs.playerShield+=12;
    addTag('player','shield','Hex Shield (12)',null,null,'Hex Shield: 12 shield 5s. Expiry: Curse enemy for 5s.');
    setTimeout(function(){
      if(!gs) return;
      gs.playerShield=Math.max(0,gs.playerShield-12); removeTagsByClass('player','shield');
      applyStatus('enemy','debuff','Cursed',-0.15,'dmg',5000,'Hex Shield expiry: Cursed 5s.');
      addLog('Hex Shield expired — enemy Cursed!','debuff');
    },5000);
    addLog('Hex Shield! 12 shield — Curse on expiry.','buff');
  }
  // ── STARCALLER DRUID ──
  else if(id==='druid_nova_burst'){
    var hc=gs.hand.length;
    var novaDmg=pdmg(Math.max(12,12*hc));
    dealDamageToEnemy(novaDmg);
    addLog('Nova Burst: '+hc+' cards × 12 = '+novaDmg+' dmg.','dmg');
    // Churn 3 handled by effects array
  }
  else if(id==='druid_focus'){
    var cost=Math.round(gs.maxMana*0.6);
    gs.mana=Math.max(0,gs.mana-cost);
    addLog('Focus: -'+cost+' mana, drawing 3 cards.','mana');
    doDraw(null,false); doDraw(null,false); doDraw(null,false);
  }
  else if(id==='druid_stellar_shards'){
    dealDamageToEnemy(pdmg(8));
    doDraw(null,false);
    addLog('Stellar Shards! 8 dmg + draw 1.','dmg');
  }
  else if(id==='druid_drifting_comet'){
    dealDamageToEnemy(pdmg(18));
    addLog('Drifting Comet! 18 dmg.','dmg');
  }

  // ── CURSED PALADIN ──
  else if(id==='paladin_smite'){
    dealDamageToEnemy(pdmg(8));
    var burnDpt=Math.max(1,wis);
    _applyBurn(burnDpt,9000);
    addLog('Smite! 8 dmg + [Burn] ('+burnDpt+'/s).','dmg');
  }
  else if(id==='paladin_consecrate'){
    // Weaken handled by effects array; custom branch for Sorcery Burn
    applyStatus('enemy','debuff','Weaken',-0.15,'dmg',6000,'Weaken: enemy dmg -15%.');
    addLog('Consecrate! [Weaken] 6s.','debuff');
    if(gs.mana>=20){
      gs.mana-=20; updateAll();
      var cBurnDpt=Math.max(1,wis);
      _applyBurn(cBurnDpt,9000);
      addLog('[Sorcery] Consecrate: [Burn] ('+cBurnDpt+'/s).','mana');
    }
  }
  else if(id==='paladin_aegis'){
    var shieldAmt=Math.max(4,Math.floor(str/2));
    _applyShield(shieldAmt,6000);
    addLog('Aegis! Shield ('+shieldAmt+') 6s.','buff');
    if(gs.mana>=25){
      gs.mana-=25; updateAll();
      applyStatus('enemy','debuff','Weaken',-0.15,'dmg',4000,'Weaken: enemy dmg -15%.');
      addLog('[Sorcery] Aegis: [Weaken] 4s.','debuff');
    }
  }
  else if(id==='paladin_judgment'){
    // Deal damage equal to Burn dpt × remaining ticks (min 8). Bypass Shield.
    var burnStatus=gs.statusEffects.enemy.find(function(s){return s.id==='burn';});
    var jDmg=8;
    if(burnStatus&&burnStatus.dpt>0){
      var ticksLeft=Math.ceil(burnStatus.remaining/burnStatus.tickMs);
      jDmg=Math.max(8, burnStatus.dpt*ticksLeft);
    }
    // Bypass shield — deal directly to HP
    gs.enemyHp=Math.max(0,gs.enemyHp-jDmg);
    shakeIcon('enemy',false); flashHpBar('enemy','hp-flash-red');
    spawnFloatNum('enemy','-'+jDmg,jDmg>=30);
    addLog('Judgment! '+jDmg+' dmg (bypasses Shield).','dmg');
    updateAll(); checkEnd();
  }
  else if(id==='paladin_hellfire'){
    var hfDpt=Math.max(1,wis*2);
    _applyBurn(hfDpt,9000);
    gs.mana=Math.min(gs.maxMana,gs.mana+30);
    addLog('Hellfire! [Burn] ('+hfDpt+'/s) + 30 mana.','buff');
    if(gs.mana>=30){
      gs.mana-=30; updateAll();
      applyStatus('enemy','debuff','Weaken',-0.15,'dmg',5000,'Weaken: enemy dmg -15%.');
      addLog('[Sorcery] Hellfire: [Weaken] 5s.','debuff');
    }
  }
  else if(id==='paladin_bulwark'){
    var bwAmt=Math.max(8,str);
    _applyShield(bwAmt,8000);
    addLog('Bulwark! Shield ('+bwAmt+') 8s.','buff');
    if(gs.mana>=35){
      gs.mana-=35; updateAll();
      gs._bulwarkReady=true;
      addTag('player','buff','Bulwark',0,'','Bulwark: next hit deals +50% damage.');
      addLog('[Sorcery] Bulwark: next hit +50%.','buff');
    }
  }

  // ── FACELESS THIEF ──
  else if(id==='thief_quick_slash'){
    var qsDmg=pdmg(10+Math.floor(agi/4));
    var qsCrit=markedCrit||Math.random()<0.15;
    if(qsCrit){ qsDmg=Math.round(qsDmg*2); spawnFloatNum('enemy','CRIT!',false,'crit-num'); addLog('Quick Slash CRIT'+(markedCrit?' (Shadow Mark)':'')+'! '+qsDmg+' dmg!','innate'); }
    else addLog('Quick Slash! '+qsDmg+' dmg.','dmg');
    dealDamageToEnemy(qsDmg);
  }
  else if(id==='thief_backstab'){
    var bsHasD=gs.statusEffects.enemy.some(function(x){return x.cls==='debuff';});
    var bsDmg=pdmg(bsHasD?45:12);
    if(markedCrit) bsDmg=Math.round(bsDmg*1.5);
    dealDamageToEnemy(bsDmg);
    if(markedCrit) spawnFloatNum('enemy','CRIT!',false,'crit-num');
    addLog('Backstab! '+bsDmg+' dmg'+(bsHasD?' (debuff bonus!)':' (no debuff)')+'.','dmg');
  }
  else if(id==='thief_shadow_step'){
    gs.playerDodge=true;
    addTag('player','buff','Dodge',null,null,'Next incoming attack will be completely evaded.');
    gs.mana=Math.min(gs.maxMana,gs.mana+50);
    addLog('Shadow Step! Dodge + 50 mana.','buff');
    if(gs.mana>=20){
      gs.mana-=20; updateAll();
      applyStatus('enemy','debuff','Weaken',-0.15,'dmg',3000,'Weaken: enemy dmg -15%.');
      addLog('[Sorcery] Shadow Step: [Weaken] 3s.','debuff');
    }
  }
  else if(id==='ghost_shadow_mark'){
    _applyPoison(6,8000);
    gs.nextCardCrit=true;
    applyStatus('player','buff','Shadow Mark',0,'shadow_mark',30000,'Shadow Mark: next card is a guaranteed Crit.');
    addLog('✦ Shadow Mark! +6 Poison. Next card CRITS.','innate');
  }

    else if(id==='ms_moonburst'){
    // Multi-hit with independent per-hit crit chance
    var moonHits=[3,3,3,3];
    moonHits.forEach(function(dmg,i){ setTimeout(function(){ if(!gs||!gs.running) return; var isCrit=Math.random()<0.20; var d=pdmg(isCrit?dmg*2:dmg); dealDamageToEnemy(d); if(isCrit) spawnFloatNum('enemy','CRIT!',false,'crit-num'); updateAll(); },i*200); });
    addLog('Moonburst! 4 \xd7 3 dmg, each 20% crit chance.','dmg');
  }
  else if(id==='sp_burst_nova'){
    // Detonate OR deal flat — conditional branch
    dealDamageToEnemy(pdmg(3));
    var spP=gs.statusEffects.enemy.find(function(s){return s.id==='poison';});
    if(spP&&spP.dpt>0){ var burst=spP.dpt; gs.statusEffects.enemy.splice(gs.statusEffects.enemy.indexOf(spP),1); removeTagByLabel('enemy',spP.label); gs.enemyHp=Math.max(0,gs.enemyHp-burst); spawnFloatNum('enemy','-'+burst,burst>=20,'crit-num'); flashHpBar('enemy','hp-flash-red'); updateAll(); checkEnd(); addLog('Burst Nova! 3 dmg + Poison detonated ('+burst+')!','innate'); }
    else{ addLog('Burst Nova! 3 dmg (no Poison to detonate).','dmg'); }
  }
  else if(id==='we_mimic'){
    // Copies the last card the enemy played
    var lastE=gs.enemies[gs.enemyIdx]; var lastECard=lastE&&lastE.deck&&lastE.deck.length>0?lastE.deck[lastE._lastCardIdx||0]:null;
    if(lastECard&&lastECard.effect==='dmg'){ dealDamageToEnemy(pdmg(Math.ceil((lastECard.value||4)*0.75))); addLog('Mimic! Copies '+lastECard.name+' at 75% potency.','innate'); }
    else{ dealDamageToEnemy(pdmg(8)); addLog('Mimic! Nothing to copy \u2014 raw 8 dmg.','dmg'); }
  }
  else if(id==='vs_ambush'){
    // Resets Poison Ambush innate flag (creature-specific state)
    dealDamageToEnemy(pdmg(12+Math.floor(agi/3))); gs.enemyCardCount=0;
    addTag('player','buff','Ambush Reset',0,'','Ambush Strike: Poison Ambush will trigger on the next card.'); addLog('Ambush Strike! '+(12+Math.floor(agi/3))+' dmg \u2014 Poison Ambush resets!','innate');
  }
  else if(id==='gr_scurry'){
    // Payoff: deal 2 × Frenzy stacks damage (min 4)
    var scurryStacks=_getFrenzyStacks();
    var scurryDmg=pdmg(Math.max(4, scurryStacks*2));
    dealDamageToEnemy(scurryDmg);
    addLog('Scurry! '+scurryDmg+' dmg'+(scurryStacks>0?' (\xd7'+scurryStacks+' Frenzy)':'')+'.','dmg');
  }
  else if(id==='gr_frenzy_surge'){
    // Bridge: mana = Frenzy stacks × 2. Converts tempo into resources.
    var fStacks=_getFrenzyStacks();
    var manaGain=Math.max(5,fStacks*2);
    gs.mana=Math.min(gs.maxMana,gs.mana+manaGain);
    addLog('Frenzy Surge! +'+manaGain+' mana ('+fStacks+'\xd7 Frenzy).','mana');
  }
  else if(id==='gr_frenzy_burst'){
    // Payoff unlock: double current Frenzy stacks
    var fNow=_getFrenzyStacks();
    if(fNow>0){
      _applyFrenzy(fNow);
      addLog('Frenzy Burst! \xd7'+fNow+' \u2192 \xd7'+_getFrenzyStacks()+' Frenzy!','innate');
    } else {
      _applyFrenzy(1);
      addLog('Frenzy Burst! No Frenzy to double \u2014 gained 1 stack.','buff');
    }
  }
  else if(id==='mc_mycelium'){
    // Sets _myceliumBurst flag read by the Spreading Spores innate loop
    gs.mana=Math.min(gs.maxMana,gs.mana+30); gs._myceliumBurst=true;
    addTag('player','buff','Mycelium Charge',0,'','Next Spreading Spores trigger: 10 Poison burst instead of DoT.'); addLog('Mycelium Net! +30 mana, next Spores trigger bursts.','buff');
  }
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function addStarburn(){
  var existing=gs.statusEffects.enemy.find(function(s){return s.id==='starburn';});
  if(existing){ existing.stacks=Math.min(3,existing.stacks+1); existing.remaining=6000; updateStarburnTag(); }
  else{ gs.statusEffects.enemy.push({id:'starburn',label:'Starburn',cls:'debuff',stat:'dot',stacks:1,remaining:6000,dot:true,tickMs:2000,tickAcc:0}); addTag('enemy','debuff','Starburn',null,null,'Space-fire burns the enemy. Each stack deals 5 dmg/tick. Stacks up to 3.'); updateStarburnTag(); }
  addLog('Starburn applied! Stacks: '+getStarburnStacks()+'.','debuff');
}
function getStarburnStacks(){ var s=gs.statusEffects.enemy.find(function(x){return x.id==='starburn';}); return s?s.stacks:0; }
function updateStarburnTag(){ var el=document.getElementById('e-tags'); var tag=el.querySelector('[data-label="Starburn"]'); if(tag){ tag.textContent='Starburn '+getStarburnStacks()+'\xd7'; } }

function stunEnemy(ms){
  var prev=gs.statusEffects.enemy.find(function(s){return s.id==='stun';});
  if(prev){ prev.remaining=Math.max(prev.remaining,ms); return; }
  gs.statusEffects.enemy.push({id:'stun',label:'Stunned',cls:'debuff',stat:'stun',remaining:ms});
  addTag('enemy','debuff','Stunned',null,null,'Enemy cannot act while stunned.');
  clearTimeout(enemyTimer); enemyTimer=null;
  setTimeout(function(){ if(gs&&gs.running) scheduleEnemyAction(); },ms);
}

function triggerHolyFlame(){
  if(!gs||gs.champId!=='paladin') return;
  var burnDmg=Math.max(1,gs.stats.wis);
  var existing=gs.statusEffects.enemy.find(function(s){return s.id==='holy_burn';});
  if(existing){
    removeTagByLabel('enemy',existing.label); existing.dpt+=burnDmg; existing.remaining=12000; existing.maxRemaining=12000;
    var stacks=Math.round(existing.dpt/Math.max(1,gs.stats.wis)); var newLabel='Holy Burn \xd7'+stacks;
    existing.label=newLabel; addTag('enemy','debuff',newLabel,0,'dot','Holy Flame: '+existing.dpt+' dmg/s ('+stacks+' stacks)'); addLog('Holy Flame: Burn \xd7'+stacks+' ('+existing.dpt+' dmg/s).','innate');
  } else {
    var label1='Holy Burn \xd71'; var desc1='Holy Flame: '+burnDmg+' dmg/s (1 stack)';
    gs.statusEffects.enemy.push({id:'holy_burn',label:label1,cls:'debuff',stat:'dot',remaining:12000,maxRemaining:12000,dot:true,dpt:burnDmg,tickMs:1000,tickAcc:0,desc:desc1});
    addTag('enemy','debuff',label1,0,'dot',desc1); addLog('Holy Flame: Burn \xd71 ('+burnDmg+' dmg/s).','innate');
  }
}

function triggerFelCurse(){ triggerHolyFlame(); }

// ═══════════════════════════════════════════════════════
// INNATES
// ═══════════════════════════════════════════════════════
function activateInnate(){
  if(!gs||!gs.running||paused) return;
  var ch=getCreaturePlayable(gs.champId);
  if(!ch.innateActive||gs.mana<ch.innateCost) return;
  gs.mana-=ch.innateCost; playInnateSfx();
  // Flash the innate card
  var innateEl=document.getElementById('innate-card');
  if(innateEl){ innateEl.classList.remove('innate-flash'); void innateEl.offsetWidth; innateEl.classList.add('innate-flash'); }
  if(gs.champId==='druid'){
    var hl=gs.hand.length;
    if(hl===0){ addLog('No cards in hand for Starfall!','innate'); gs.mana+=ch.innateCost; return; }
    // Churn entire hand: discard all, draw same count, deal 5 dmg per card churned
    var churned=0;
    for(var i=gs.hand.length-1;i>=0;i--){
      var disc=gs.hand.splice(i,1)[0];
      if(!disc.ghost){ gs.discardPile.push(disc.id); handleCardDiscard(disc.id); spawnCardFloat(disc.id, 'discard'); }
      churned++;
    }
    var sfDmg=pdmg(churned*5);
    dealDamageToEnemy(sfDmg);
    addLog('✦ STARFALL! Churned '+churned+' cards — '+sfDmg+' dmg!','innate');
    // Draw same number back
    for(var d=0;d<churned;d++) doDraw(null,false);
    renderHand(); renderPiles();
  } else if(gs.champId==='gorby'){
    // Convert all attack cards in hand into Ethereal Gorby Attacks
    // Formula: resolvedDamage × effectCount (multi-hit uses total damage)
    var converted=0;
    var s=gs.stats;
    gs.hand.forEach(function(item,i){
      var c=CARDS[item.id];
      if(!c||item.ghost) return;
      var tags=getCardTags(c);
      if(tags.indexOf('damage')===-1) return; // skip non-damage cards

      // Resolve base damage
      var baseDmg=0;
      if(c.effects){
        for(var ei=0;ei<c.effects.length;ei++){
          var e=c.effects[ei];
          if(e.type==='dmg'){baseDmg=+e.base; break;}
          if(e.type==='dmg_stat'){baseDmg=+e.base+Math.floor((s[e.stat]||0)/+e.div); break;}
          if(e.type==='dmg_multi'){baseDmg=(+e.dmg)*(+e.hits); break;}
          if(e.type==='dmg_crit'||e.type==='dmg_if_debuff'||e.type==='dmg_if_slowed'||
             e.type==='dmg_if_poison'||e.type==='dmg_if_burn'||e.type==='dmg_if_shielded'||
             e.type==='dmg_if_full_hand'||e.type==='dmg_first_card'){baseDmg=+e.base; break;}
        }
      }
      if(baseDmg<=0) return; // no damage value found

      // Count effects (excluding sorcery cost as its own effect — it's a modifier)
      var effectCount=c.effects ? c.effects.length : 1;
      var finalDmg=Math.max(1,Math.round(baseDmg*effectCount));

      // Register a temporary Gorby Attack card in CARDS
      var gId='gorby_attack_'+i;
      CARDS[gId]={
        id:gId, name:'Gorby Attack', icon:'\ud83d\udc4a', type:'attack',
        unique:false, champ:'gorby', statId:'str', manaCost:0,
        effect:'Deal '+finalDmg+' damage.\n[Ethereal]: vanishes when played or discarded.',
        effects:[{type:'dmg',base:finalDmg}],
        _gorbyTemp:true
      };
      // Replace the hand item in-place — ghost:true means it won't go to discard
      gs.hand[i]={id:gId, ghost:true};
      converted++;
      addLog('Converted '+c.name+' \u2192 Gorby Attack ('+finalDmg+' dmg).','innate');
    });
    if(converted===0){
      addLog('\u2756 GORBY: No attack cards to convert!','innate');
      gs.mana+=ch.innateCost; // refund
    } else {
      addLog('\u2756 GORBY converts '+converted+' card'+(converted>1?'s':'')+'!','innate');
    }
  } else if(gs.champId==='thief'){
    // Shadow Mark: Apply 6 Poison + mark ALL attack cards with +[Crit]: 100%
    // First attack card played consumes the mark and clears all others
    _applyPoison(6, 8000);
    gs.shadowMarkActive = true;
    // Mark all current attack cards in hand
    for(var ti = 0; ti < gs.hand.length; ti++){
      var tCard = CARDS[gs.hand[ti].id];
      if(tCard && tCard.type === 'attack' && !gs.hand[ti].ghost){
        gs.hand[ti].critBonus = 100;
      }
    }
    applyStatus('player', 'buff', 'Shadow Mark', 0, 'shadow_mark', 30000, 'Shadow Mark: next attack card played crits.');
    addLog('✦ Shadow Mark! +6 Poison. All attack cards gain +[Crit]: 100%.', 'innate');
  }
  updateAll(); renderHand(); renderPiles(); checkEnd();
}
