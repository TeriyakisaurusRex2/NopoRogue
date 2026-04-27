// ════════════════════════════════════════════════════════════════
// CARD EFFECTS  —  data/card_effects.js
// ════════════════════════════════════════════════════════════════
//
// All card execution routes through playCardForActor() in combat.js
// which reads the card's effects[] array and runs each EFFECT_TYPE.
//
// HOW TO ADD A NEW CARD:
//   1. Add the card definition to data/cards.js with an effects[] array
//   2. Use generalized types: dmg_conditional, dmg_scaling, apply_status
//   3. Only create a custom EFFECT_TYPE for truly unique mechanics
//
// HOW TO ADD A NEW EFFECT TYPE:
//   1. Add one entry to EFFECT_TYPES below
//   2. Any card can now use it via effects:[{type:'your_type',...}]
//
// ON-DISCARD (ECHO) TRIGGER:
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

// Apply Burn to player (used by enemy innates like Cursed Retribution)
function _applyBurnToPlayer(dpt, durMs){
  var dur=durMs||9000;
  var e=gs.statusEffects.player.find(function(s){return s.id==='burn';});
  if(e){ e.remaining=dur; e.maxRemaining=dur; }
  else {
    gs.statusEffects.player.push({id:'burn',label:'Burn ('+dpt+'/s)',cls:'debuff',stat:'dot',
      remaining:dur,maxRemaining:dur,dot:true,dpt:dpt,tickMs:1000,tickAcc:0,
      desc:'Burn: '+dpt+' dmg/s. Bypasses Shield.'});
    addTag('player','debuff','Burn ('+dpt+'/s)',0,'dot','Burn: '+dpt+' dmg/s. Bypasses Shield.');
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
// Route card damage to correct target.
// Supports both new (ctx.opponent) and old (ctx.isEnemy) formats.
function dealCardDamage(d, ctx){
  if(ctx.opponent && typeof dealDamage === 'function'){
    dealDamage(ctx.opponent, d);
  } else if(ctx.isEnemy) {
    dealDamageToPlayer(d);
  } else {
    dealCardDamage(d, ctx);
  }
}

// Get the target side string for float numbers etc.
// Works with both old ctx (isEnemy) and new ctx (opponent.side)
function getTargetSide(ctx){
  if(ctx.opponent) return ctx.opponent.side;
  return ctx.isEnemy ? 'player' : 'enemy';
}

// Get self side string
function getSelfSide(ctx){
  if(ctx.actor) return ctx.actor.side;
  return ctx.isEnemy ? 'enemy' : 'player';
}

var EFFECT_TYPES = {

  // ══════════════════════════════════════════════════════════
  // GENERALIZED EFFECT TYPES — use these for all new cards
  // ══════════════════════════════════════════════════════════

  // ── GENERALIZED CONDITIONAL DAMAGE ──
  // Replaces: dmg_crit, dmg_multi_crit, dmg_if_burning, dmg_if_debuffed,
  // dmg_if_debuff, dmg_multi_crit_if_debuffed, dmg_if_shielded, etc.
  //
  // Fields:
  //   hits:        number of hits (1 = single, 2+ = multi-hit)
  //   dmg:         damage per hit
  //   stat:        optional stat scaling ('agi', 'str', 'wis')
  //   stat_div:    divisor for stat scaling (default 4)
  //   condition:   what to check ('always','has_debuff','has_burn','has_poison',
  //                'has_weaken','has_slow','has_shield','has_haste',
  //                'has_frenzy','below_50_hp','above_50_hp')
  //   check:       who to check ('opponent' or 'self')
  //   on_true:     what happens ('crit','bonus_dmg','bonus_hits')
  //   on_true_val: crit %, bonus damage amount, or bonus hit count
  //
  dmg_conditional: {
    label:'Conditional Damage', cat:'damage',
    desc:'Flexible damage with optional condition check.',
    fields:[
      {id:'hits',       label:'Hits',       type:'number', default:1},
      {id:'dmg',        label:'Dmg/hit',    type:'number', default:10},
      {id:'stat',       label:'Stat scale', type:'select', default:'none', options:['none','str','agi','wis']},
      {id:'stat_div',   label:'Stat div',   type:'number', default:4},
      {id:'condition',  label:'Condition',  type:'select', default:'always',
        options:['always','has_debuff','has_burn','has_poison','has_weaken','has_slow',
                 'has_shield','has_haste','has_frenzy','below_50_hp','above_50_hp']},
      {id:'check',      label:'Check who',  type:'select', default:'opponent', options:['opponent','self']},
      {id:'on_true',    label:'If true',    type:'select', default:'crit', options:['crit','bonus_dmg','bonus_hits']},
      {id:'on_true_val',label:'Value',      type:'number', default:25}
    ],
    effectText: function(v){
      var base = +v.dmg;
      var statStr = (v.stat && v.stat !== 'none') ? ' + '+v.stat.toUpperCase()+' ÷ '+v.stat_div : '';
      var dmgStr = (+v.hits > 1) ? (base + ' damage × ' + v.hits + ' hits') : ('Deal ' + base + statStr + ' damage');
      if (+v.hits > 1) dmgStr = 'Deal ' + dmgStr;
      if (v.condition === 'always' && v.on_true === 'crit') return dmgStr + '. [Crit]: ' + v.on_true_val + '%.';
      var condStr = '';
      var condMap = {has_debuff:'[Debuff]',has_burn:'[Burn]',has_poison:'[Poison]',has_weaken:'[Weaken]',
        has_slow:'[Slow]',has_shield:'[Shield]',has_haste:'[Haste]',has_frenzy:'[Frenzy]',
        below_50_hp:'Below 50% HP',above_50_hp:'Above 50% HP'};
      condStr = condMap[v.condition] || v.condition;
      var targetStr = v.check === 'self' ? '' : ' on enemy';
      if (v.on_true === 'crit') return dmgStr + '.\n' + condStr + targetStr + ': [Crit]: ' + v.on_true_val + '%.';
      if (v.on_true === 'bonus_dmg') return dmgStr + '.\n' + condStr + targetStr + ': deal ' + v.on_true_val + ' additional damage.';
      if (v.on_true === 'bonus_hits') return dmgStr + '.\n' + condStr + targetStr + ': +' + v.on_true_val + ' additional hits.';
      return dmgStr + '.';
    },
    typeHint:'attack',
    run: function(v,ctx){
      var hits = +v.hits || 1;
      var baseDmg = +v.dmg || 0;
      // Stat scaling
      if (v.stat && v.stat !== 'none') {
        baseDmg += Math.floor((ctx[v.stat] || 0) / (+v.stat_div || 4));
      }
      // Check condition
      var checkTarget;
      if (v.check === 'self') {
        checkTarget = ctx.actor || null;
      } else {
        checkTarget = ctx.opponent || null;
      }
      var condMet = false;
      if (v.condition === 'always') {
        condMet = true;
      } else if (checkTarget) {
        var effs = checkTarget.statusEffects || (v.check === 'self'
          ? (ctx.isEnemy ? gs.statusEffects.enemy : gs.statusEffects.player)
          : (ctx.isEnemy ? gs.statusEffects.player : gs.statusEffects.enemy));
        switch (v.condition) {
          case 'has_debuff':   condMet = effs.some(function(s){ return s.cls==='debuff'; }); break;
          case 'has_burn':     condMet = effs.some(function(s){ return s.id==='burn'; }); break;
          case 'has_poison':   condMet = effs.some(function(s){ return s.id==='poison'; }); break;
          case 'has_weaken':   condMet = effs.some(function(s){ return s.stat==='dmg' && s.cls==='debuff'; }); break;
          case 'has_slow':     condMet = effs.some(function(s){ return s.stat==='slow_draw'; }); break;
          case 'has_shield':   condMet = (checkTarget.shield || 0) > 0; break;
          case 'has_haste':    condMet = effs.some(function(s){ return s.stat==='haste'||s.id==='haste'; }) || (checkTarget.drawSpeedMult||1) > 1; break;
          case 'has_frenzy':   condMet = effs.some(function(s){ return s.id==='frenzy'; }); break;
          case 'below_50_hp':  condMet = checkTarget.hp < checkTarget.maxHp * 0.5; break;
          case 'above_50_hp':  condMet = checkTarget.hp >= checkTarget.maxHp * 0.5; break;
        }
      } else {
        // Fallback for old system without actors
        var oldEffs = ctx.isEnemy ? gs.statusEffects.player : gs.statusEffects.enemy;
        if (v.check === 'self') oldEffs = ctx.isEnemy ? gs.statusEffects.enemy : gs.statusEffects.player;
        switch (v.condition) {
          case 'has_debuff': condMet = oldEffs.some(function(s){ return s.cls==='debuff'; }); break;
          case 'has_burn':   condMet = oldEffs.some(function(s){ return s.id==='burn'; }); break;
          case 'has_poison': condMet = oldEffs.some(function(s){ return s.id==='poison'; }); break;
          default: condMet = false;
        }
      }

      var target = getTargetSide(ctx);
      var total = 0, crits = 0;
      var actualHits = hits;
      if (condMet && v.on_true === 'bonus_hits') actualHits += (+v.on_true_val || 0);

      for (var i = 0; i < actualHits; i++) {
        var d = ctx.pdmg(baseDmg);
        var isCrit = ctx.markedCrit || (condMet && v.on_true === 'crit' && Math.random() < (+v.on_true_val / 100));
        if (isCrit) { d = Math.round(d * 2); crits++; }
        if (condMet && v.on_true === 'bonus_dmg' && i === 0) d += (+v.on_true_val || 0);
        total += d;
        dealCardDamage(d, ctx);
      }
      if (crits > 0) spawnFloatNum(target, 'CRIT' + (crits > 1 ? ' ×' + crits : '') + '!', false, 'crit-num');
      addLog(ctx.cardName + '! ' + (actualHits > 1 ? actualHits + ' hits, ' : '') + total + ' total dmg' +
        (crits > 0 ? ' (' + crits + ' crit' + (crits > 1 ? 's' : '') + ')' : '') + '.', 'dmg');
    }
  },

  // ── GENERALIZED SCALING DAMAGE ──
  // Replaces: dmg_discard_scaling, dmg_hand_scaling, dmg_plus_shield,
  // dmg_missing_hp, dmg_per_hand_card, dmg_per_poison_on_enemy, etc.
  //
  // Fields:
  //   base:   base damage
  //   source: what to scale from ('hand_size','discard_size','missing_hp',
  //           'shield','missing_mana','cards_played')
  //   check:  who to read the source from ('self' or 'opponent')
  //   mult:   multiplier per unit of source
  //
  dmg_scaling: {
    label:'Scaling Damage', cat:'damage',
    desc:'Damage scales with a dynamic value.',
    fields:[
      {id:'base',   label:'Base Dmg',  type:'number', default:8},
      {id:'source', label:'Scale from',type:'select', default:'discard_size',
        options:['hand_size','discard_size','missing_hp','shield','missing_mana','cards_played']},
      {id:'check',  label:'Read from', type:'select', default:'self', options:['self','opponent']},
      {id:'mult',   label:'Per unit',  type:'number', default:1}
    ],
    effectText: function(v){
      var sourceMap = {hand_size:'hand size',discard_size:'discard pile',missing_hp:'missing HP',
        shield:'[Shield]',missing_mana:'missing mana',cards_played:'cards played'};
      var src = sourceMap[v.source] || v.source;
      return 'Deal ' + v.base + ' + ' + src + ' × ' + v.mult + ' damage.';
    },
    typeHint:'attack',
    run: function(v,ctx){
      var sourceVal = 0;
      var who = (v.check === 'opponent') ? ctx.opponent : ctx.actor;
      if (who) {
        switch (v.source) {
          case 'hand_size':     sourceVal = who.hand.length; break;
          case 'discard_size':  sourceVal = who.discardPile.length; break;
          case 'missing_hp':    sourceVal = who.maxHp - who.hp; break;
          case 'shield':        sourceVal = who.shield || 0; break;
          case 'missing_mana':  sourceVal = who.maxMana - who.mana; break;
          case 'cards_played':  sourceVal = who.cardsPlayed || 0; break;
        }
      } else {
        // Fallback for old system
        var isSelf = (v.check !== 'opponent');
        var isE = ctx.isEnemy;
        switch (v.source) {
          case 'hand_size':    sourceVal = (isSelf === isE) ? gs.enemyHand.length : gs.hand.length; break;
          case 'discard_size': sourceVal = (isSelf === isE) ? (gs.enemyDiscardPile||[]).length : (gs.discardPile||[]).length; break;
          case 'missing_hp':   sourceVal = (isSelf === isE) ? (gs.enemyMaxHp - gs.enemyHp) : (gs.playerMaxHp - gs.playerHp); break;
          case 'shield':       sourceVal = (isSelf === isE) ? (gs.enemyShell||0) : (gs.playerShield||0); break;
        }
      }
      var d = ctx.pdmg(+v.base + sourceVal * (+v.mult));
      dealCardDamage(d, ctx);
      addLog(ctx.cardName + '! ' + d + ' dmg (' + sourceVal + ' ' + v.source + ').', 'dmg');
    }
  },

  // ── GENERALIZED STATUS APPLICATION ──
  // Replaces: poison, burn, weaken, slow_draw, haste, thorns, dodge, frenzy
  //
  // Fields:
  //   status: which status ('poison','burn','weaken','slow','haste','thorns','dodge','frenzy')
  //   target: who gets it ('opponent' or 'self')
  //   value:  status value (dpt for DoTs, % for haste, flat for thorns)
  //   dur:    duration in seconds
  //
  apply_status: {
    label:'Apply Status', cat:'utility',
    desc:'Apply a status effect to self or opponent.',
    fields:[
      {id:'status',   label:'Status',     type:'select', default:'poison',
        options:['poison','burn','weaken','slow','haste','thorns','dodge','frenzy']},
      {id:'target',   label:'Target',     type:'select', default:'opponent', options:['opponent','self']},
      {id:'value',    label:'Value',      type:'number', default:2},
      {id:'stat',     label:'Stat scale', type:'select', default:'none', options:['none','str','agi','wis']},
      {id:'stat_div', label:'Stat div',   type:'number', default:4},
      {id:'dur',      label:'Dur (s)',    type:'number', default:8}
    ],
    effectText: function(v){
      var targetStr = v.target === 'self' ? 'Gain' : 'Apply';
      var valStr = '' + (v.value || 0);
      if (v.stat && v.stat !== 'none') {
        valStr = (v.value ? v.value + ' + ' : '') + v.stat.toUpperCase() + ' ÷ ' + (v.stat_div || 4);
      }
      var statusMap = {
        poison: targetStr + ' ' + valStr + ' [Poison] for ' + v.dur + 's.',
        burn:   targetStr + ' ' + valStr + ' [Burn] for ' + v.dur + 's.',
        weaken: targetStr + ' [Weaken] for ' + v.dur + 's.',
        slow:   targetStr + ' [Slow] for ' + v.dur + 's.',
        haste:  'Gain [Haste] ' + valStr + '% for ' + v.dur + 's.',
        thorns: 'Gain [Thorns] (' + valStr + ') for ' + v.dur + 's.',
        dodge:  'Gain [Dodge].',
        frenzy: 'Gain ' + valStr + ' [Frenzy] stack' + (+v.value > 1 ? 's' : '') + '.'
      };
      return statusMap[v.status] || (targetStr + ' ' + v.status + '.');
    },
    typeHint: function(v){ return v.target === 'self' ? 'utility' : 'debuff'; },
    run: function(v,ctx){
      var targetActor = (v.target === 'self') ? ctx.actor : ctx.opponent;
      var targetSide = (v.target === 'self') ? getSelfSide(ctx) : getTargetSide(ctx);
      var dur = (+v.dur || 8) * 1000;
      var val = +v.value || 0;
      // Stat scaling
      if (v.stat && v.stat !== 'none') {
        val += Math.floor((ctx[v.stat] || 0) / (+v.stat_div || 4));
      }
      val = Math.max(val, 0);

      switch (v.status) {
        case 'poison':
          if (targetActor) {
            // Use old _applyPoison functions for now — they handle stacking
            if (targetSide === 'player') _applyPoisonToPlayer(val, dur);
            else _applyPoison(val, dur);
          } else {
            if (v.target === 'self') { if (ctx.isEnemy) _applyPoisonToPlayer(val, dur); else _applyPoison(val, dur); }
            else { if (ctx.isEnemy) _applyPoisonToPlayer(val, dur); else _applyPoison(val, dur); }
          }
          addLog(ctx.cardName + '! Poison +' + val + '/s.', 'debuff');
          break;

        case 'burn':
          _applyBurn(val, dur);
          addLog(ctx.cardName + '! Burn +' + val + '/s.', 'debuff');
          break;

        case 'weaken':
          applyStatus(targetSide, 'debuff', 'Weaken', -0.15, 'dmg', dur, 'Weaken: target deals 15% less damage.');
          addLog(ctx.cardName + '! [Weaken] ' + v.dur + 's.', 'debuff');
          break;

        case 'slow':
          applyStatus(targetSide, 'debuff', 'Slow', 600, 'slow_draw', dur, 'Slow: draw interval +600ms.');
          addLog(ctx.cardName + '! [Slow] ' + v.dur + 's.', 'debuff');
          break;

        case 'haste':
          // Use existing haste effect
          if (EFFECT_TYPES.haste) EFFECT_TYPES.haste.run({pct: val, dur: +v.dur}, ctx);
          break;

        case 'thorns':
          applyStatus(targetSide, 'buff', 'Thorns (' + val + ')', val, 'thorns', dur,
            'Thorns: reflects ' + val + ' damage when hit.');
          addLog(ctx.cardName + '! [Thorns] (' + val + ') ' + v.dur + 's.', 'buff');
          break;

        case 'dodge':
          if (targetActor) targetActor.dodge = true;
          else if (targetSide === 'player') gs.playerDodge = true;
          else gs.enemyDodge = true;
          addTag(targetSide, 'buff', 'Dodge', null, null, 'Next attack will be evaded.');
          addLog(ctx.cardName + '! [Dodge] active.', 'buff');
          break;

        case 'frenzy':
          if (EFFECT_TYPES.frenzy) EFFECT_TYPES.frenzy.run({stacks: val}, ctx);
          break;
      }
    }
  },

  // ══════════════════════════════════════════════════════════
  // LEGACY EFFECT TYPES — kept for backward compatibility
  // New cards should use dmg_conditional, dmg_scaling, apply_status
  // ══════════════════════════════════════════════════════════

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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d,ctx);
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
      var isE=ctx.isEnemy;
      for(var i=0;i<hits;i++){
        (function(d){ setTimeout(function(){
          if(gs&&gs.running){ var dd=ctx.pdmg(dmg); dealCardDamage(dd, ctx); updateAll(); }
        }, d*delay); })(i);
      }
      addLog(ctx.cardName+'! '+hits+'×'+dmg+' dmg.','dmg');
    }
  },

  // ── Multi-hit with independent crit rolls per hit ──
  dmg_multi_crit: {
    label:'Multi-hit with Crit', cat:'damage',
    desc:'Deal damage in several hits. Each hit rolls crit independently.',
    fields:[
      {id:'hits', label:'Hits',       type:'number', default:3, min:2, max:6},
      {id:'dmg',  label:'Dmg / hit',  type:'number', default:6, min:1, max:50},
      {id:'pct',  label:'Crit %',     type:'number', default:10, min:1, max:50}
    ],
    effectText:  function(v){ return 'Deal '+v.dmg+' damage × '+v.hits+' hits. [Crit]: '+v.pct+'%.'; },
    tooltipText: function(v){ return 'Each hit rolls crit independently.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var hits=+v.hits, dmg=+v.dmg, pct=+v.pct/100;
      var total=0, crits=0;
      var target=getTargetSide(ctx);
      for(var i=0;i<hits;i++){
        var d=ctx.pdmg(dmg);
        var isCrit=ctx.markedCrit||Math.random()<pct;
        if(isCrit){ d=Math.round(d*2); crits++; }
        total+=d;
        dealCardDamage(d, ctx);
      }
      if(crits>0) spawnFloatNum(target,'CRIT ×'+crits+'!',false,'crit-num');
      addLog(ctx.cardName+'! '+hits+' hits, '+total+' total dmg'+(crits>0?' ('+crits+' crits)':'')+'.','dmg');
    }
  },

  // ── Multi-hit with crit ONLY when opponent is debuffed ──
  dmg_multi_crit_if_debuffed: {
    label:'Multi-hit (Crit if debuffed)', cat:'damage',
    desc:'Multi-hit damage. Crit chance only applies if opponent has a debuff.',
    fields:[
      {id:'hits', label:'Hits',       type:'number', default:2, min:2, max:6},
      {id:'dmg',  label:'Dmg / hit',  type:'number', default:6, min:1, max:50},
      {id:'pct',  label:'Crit %',     type:'number', default:25, min:1, max:50}
    ],
    effectText:  function(v){ return 'Deal '+v.dmg+' damage × '+v.hits+' hits. [Debuff] on enemy: [Crit]: '+v.pct+'%.'; },
    tooltipText: function(v){ return 'Each hit rolls crit independently. Crit only activates if opponent has any debuff.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var hits=+v.hits, dmg=+v.dmg, pct=+v.pct/100;
      var total=0, crits=0;
      var target=getTargetSide(ctx);
      // Check opponent for debuffs
      var oppEffects = ctx.opponent ? ctx.opponent.statusEffects : (ctx.isEnemy ? gs.statusEffects.player : gs.statusEffects.enemy);
      var hasDebuff = oppEffects.some(function(s){ return s.cls==='debuff'; });
      for(var i=0;i<hits;i++){
        var d=ctx.pdmg(dmg);
        var isCrit = ctx.markedCrit || (hasDebuff && Math.random()<pct);
        if(isCrit){ d=Math.round(d*2); crits++; }
        total+=d;
        dealCardDamage(d, ctx);
      }
      if(crits>0) spawnFloatNum(target,'CRIT ×'+crits+'!',false,'crit-num');
      addLog(ctx.cardName+'! '+hits+' hits, '+total+' total dmg'+(crits>0?' ('+crits+' crits)':'')+(hasDebuff?'':' (no debuff — no crit)')+'.','dmg');
    }
  },

  // ── Damage scaling with discard pile size ──
  dmg_discard_scaling: {
    label:'Discard Pile Damage', cat:'damage',
    desc:'Deal base damage plus bonus from discard pile size.',
    fields:[
      {id:'base', label:'Base Dmg',   type:'number', default:8, min:1, max:50},
      {id:'mult', label:'Per card',   type:'number', default:1, min:1, max:5}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' + discard pile × '+v.mult+' damage.'; },
    tooltipText: function(v){ return 'More cards in discard = more damage.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var discSize;
      if(ctx.actor) discSize=ctx.actor.discardPile.length;
      else discSize=ctx.isEnemy?(gs.enemyDiscardPile||[]).length:(gs.discardPile||[]).length;
      var d=ctx.pdmg(+v.base + discSize * (+v.mult));
      dealCardDamage(d,ctx);
      addLog(ctx.cardName+'! '+d+' dmg ('+discSize+' in discard).','dmg');
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
      var oppEff3=ctx.opponent?ctx.opponent.statusEffects:gs.statusEffects.enemy;
      var hasD=oppEff3.some(function(x){return x.cls==='debuff';});
      var d=ctx.pdmg(hasD?+v.high:+v.base);
      dealCardDamage(d,ctx);
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
      var selfHp=ctx.actor?ctx.actor.hp:gs.playerHp;
      var selfMaxHp=ctx.actor?ctx.actor.maxHp:gs.playerMaxHp;
      var low=selfHp<selfMaxHp*(+v.threshold/100);
      var d=ctx.pdmg(low?+v.high:+v.base);
      dealCardDamage(d,ctx);
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
      var target=getTargetSide(ctx);
      if(isCrit){ d=Math.round(d*2); spawnFloatNum(target,'CRIT!',false,'crit-num'); }
      dealCardDamage(d,ctx);
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
      var oppEffects = ctx.opponent ? ctx.opponent.statusEffects : gs.statusEffects.enemy;
      var enemyBurning = oppEffects.some(function(s){ return s.id==='burn'; });
      var isCrit = ctx.markedCrit || (enemyBurning && Math.random() < (+v.critPct/100));
      var d = ctx.pdmg(+v.base);
      var target=getTargetSide(ctx);
      if(isCrit){ d=Math.round(d*2); spawnFloatNum(target,'CRIT!',false,'crit-num'); }
      dealCardDamage(d,ctx);
      addLog(ctx.cardName+'! '+d+' dmg'+(isCrit?' CRIT!':'')+'.','dmg');
    }
  },

  // Damage with crit chance conditional on enemy having ANY debuff active.
  // Used by Cheap Shot: [Debuff] on enemy: [Crit]: 40%.
  dmg_if_debuffed: {
    label:'Damage (Crit if enemy Debuffed)', cat:'damage',
    desc:'Deal damage. If enemy has any debuff: crit chance applies.',
    fields:[
      {id:'base',    label:'Damage',       type:'number', default:10, min:1, max:200},
      {id:'critPct', label:'Crit % if Debuffed', type:'number', default:40, min:1, max:100}
    ],
    effectText:  function(v){ return 'Deal '+v.base+' damage.\n[Debuff] on enemy: [Crit]: '+v.critPct+'%.'; },
    tooltipText: function(v){ return '[Crit] fires only when the enemy has any debuff active.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var oppEffects2 = ctx.opponent ? ctx.opponent.statusEffects : gs.statusEffects.enemy;
      var hasDebuff = oppEffects2.some(function(s){ return s.cls==='debuff'; });
      var isCrit = ctx.markedCrit || (hasDebuff && Math.random() < (+v.critPct/100));
      var d = ctx.pdmg(+v.base);
      var target=getTargetSide(ctx);
      if(isCrit){ d=Math.round(d*2); spawnFloatNum(target,'CRIT!',false,'crit-num'); }
      dealCardDamage(d,ctx);
      addLog(ctx.cardName+'! '+d+' dmg'+(isCrit?' CRIT!':'')+'.','dmg');
    }
  },

  // ── Damage + Shield value ──
  // Spine Lash: Deal base damage. If Shield active, deal current Shield value as additional damage.
  dmg_plus_shield: {
    label:'Damage + Shield bonus', cat:'damage',
    desc:'Deal base damage. If Shield is active, deal additional damage equal to current Shield value.',
    fields:[{id:'base', label:'Base Damage', type:'number', default:8, min:1, max:200}],
    effectText:  function(v){ return 'Deal '+v.base+' damage.\n[Shield] active: deal [Shield] additional damage.'; },
    tooltipText: function(v){ return 'Bonus damage equals current Shield HP.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var base = ctx.pdmg(+v.base);
      var shieldBonus = 0;
      if(ctx.actor){
        shieldBonus = ctx.actor.shield || 0;
      } else if(ctx.isEnemy){
        shieldBonus = gs.enemyShell || 0;
      } else {
        shieldBonus = gs.playerShield || 0;
      }
      var d = base + shieldBonus;
      dealCardDamage(d, ctx);
      if(shieldBonus > 0){
        addLog(ctx.cardName+'! '+base+' + '+shieldBonus+' (Shield) = '+d+' dmg.','dmg');
      } else {
        addLog(ctx.cardName+'! '+d+' dmg.','dmg');
      }
    }
  },

  // ── Damage from missing HP ──
  // Spite: Deal damage equal to missing HP ÷ divisor.
  dmg_missing_hp: {
    label:'Damage from missing HP', cat:'damage',
    desc:'Deal damage equal to missing HP divided by a value.',
    fields:[{id:'div', label:'Divisor', type:'number', default:4, min:1, max:10}],
    effectText:  function(v){ return 'Deal missing HP ÷ '+v.div+' damage.'; },
    tooltipText: function(v){ return 'The lower your HP, the harder this hits.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var missing, max;
      if(ctx.actor){
        missing = ctx.actor.maxHp - ctx.actor.hp;
        max = ctx.actor.maxHp;
      } else if(ctx.isEnemy){
        missing = gs.enemyMaxHp - gs.enemyHp;
        max = gs.enemyMaxHp;
      } else {
        missing = gs.playerMaxHp - gs.playerHp;
        max = gs.playerMaxHp;
      }
      var d = Math.max(1, Math.floor(missing / (+v.div || 4)));
      dealCardDamage(d, ctx);
      addLog(ctx.cardName+'! '+d+' dmg ('+missing+' missing HP ÷ '+v.div+').','dmg');
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
      dealCardDamage(d, ctx);
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
      var pool, selfSide;
      if(ctx.actor){
        pool = ctx.actor.mana;
        selfSide = ctx.actor.side;
      } else {
        pool = ctx.isEnemy ? gs.enemyMana : gs.mana;
        selfSide = ctx.isEnemy ? 'enemy' : 'player';
      }
      if(pool<+v.cost) return;
      if(ctx.actor){
        ctx.actor.mana-=+v.cost;
      } else if(ctx.isEnemy){
        gs.enemyMana-=+v.cost;
      } else {
        gs.mana-=+v.cost;
      }
      spawnFloatNum(selfSide,'-'+v.cost+'✦',false,'mana-num');
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
          // Get card position before removing
          var cardEl = null;
          var handEl = document.getElementById('hand-cards');
          if(handEl){
            var cardEls = handEl.querySelectorAll('.card');
            if(cardEls[ri]) cardEl = cardEls[ri];
          }
          var disc=gs.hand.splice(ri,1)[0];
          if(!disc.ghost){
            gs.discardPile.push(disc.id);
            handleCardDiscard(disc.id);
            // Spawn discard ghost from card's actual position
            if(cardEl){
              var cr = cardEl.getBoundingClientRect();
              var discPile = document.getElementById('disc-cnt');
              if(discPile){
                var dr = discPile.getBoundingClientRect();
                var c = CARDS[disc.id];
                var el = document.createElement('div');
                el.className = 'churn-arc';
                el.innerHTML = '<div class="cg-icon">'+(c?c.icon:'?')+'</div><div class="cg-name">'+(c?c.name:disc.id)+'</div>';
                el.style.left = (cr.left + cr.width/2) + 'px';
                el.style.top = (cr.top + cr.height/2) + 'px';
                el.style.setProperty('--dx', (dr.left + dr.width/2 - cr.left - cr.width/2) + 'px');
                el.style.setProperty('--dy', (dr.top + dr.height/2 - cr.top - cr.height/2) + 'px');
                document.body.appendChild(el);
                setTimeout(function(e){ return function(){ if(e.parentNode) e.parentNode.removeChild(e); }; }(el), 550);
              }
            } else {
              spawnCardFloat(disc.id, 'discard');
            }
          }
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
      var copyId = ctx.cardId;
      if(!copyId) return;
      // Track which card ID is being conjured (for purge)
      gs._conjuredCardId = copyId;
      if(ctx.actor) ctx.actor.discardPile.push(copyId);
      else gs.discardPile.push(copyId);
      gs.conjuredCount = (gs.conjuredCount||0) + 1;
      if(ctx.actor) ctx.actor.conjuredCount = gs.conjuredCount;
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
        if(ctx.cardId) spawnEchoFloat(ctx.cardId);
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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

  // ── Crit Bonus — add +[Crit] to next attack card ──
  crit_bonus: {
    label:'Crit Bonus', cat:'buff',
    desc:'Add crit chance to the next attack card played.',
    fields:[{id:'pct', label:'Crit %', type:'number', default:15, min:1, max:100}],
    effectText:  function(v){ return 'Next attack card: +[Crit]: '+v.pct+'%.'; },
    tooltipText: function(v){ return 'Adds crit chance to the next attack card.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var pct=+v.pct;
      if(ctx.isEnemy){
        gs._enemyCritBonus = (gs._enemyCritBonus||0) + pct;
        addLog('[Sorcery] Next attack: +[Crit]: '+pct+'%.','buff');
      } else {
        for(var i=0;i<gs.hand.length;i++){
          var c=CARDS[gs.hand[i].id];
          if(c&&c.type==='attack'&&!gs.hand[i].ghost){
            gs.hand[i].critBonus=(gs.hand[i].critBonus||0)+pct;
          }
        }
        gs._pendingCritBonus = pct;
        addLog('Attack cards gain +[Crit]: '+pct+'%.','buff');
        renderHand();
      }
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
      dealCardDamage(d, ctx);
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
        // Enemy shielding itself — use status effect for timer tracking
        gs.enemyShell+=amt;
        var existing=gs.statusEffects.enemy.find(function(s){return s.id==='shield';});
        if(existing){
          existing.remaining=Math.max(existing.remaining, dur);
          existing.maxRemaining=Math.max(existing.maxRemaining, dur);
          existing.label='Shield ('+gs.enemyShell+')';
          removeTagsByClass('enemy','shield');
        } else {
          gs.statusEffects.enemy.push({
            id:'shield',label:'Shield ('+gs.enemyShell+')',cls:'shield',stat:'shield',
            remaining:dur,maxRemaining:dur,
            desc:'Shield: absorbs '+gs.enemyShell+' direct damage.'
          });
        }
        addTag('enemy','shield','Shield ('+gs.enemyShell+')',null,'shield','Shield: absorbs '+gs.enemyShell+' direct damage.');
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
      if(ctx.isEnemy){
        // Enemy shielding itself — use status effect for timer tracking
        gs.enemyShell+=amt;
        var existing=gs.statusEffects.enemy.find(function(s){return s.id==='shield';});
        if(existing){
          existing.remaining=Math.max(existing.remaining, dur);
          existing.maxRemaining=Math.max(existing.maxRemaining, dur);
          existing.label='Shield ('+gs.enemyShell+')';
          removeTagsByClass('enemy','shield');
        } else {
          gs.statusEffects.enemy.push({
            id:'shield',label:'Shield ('+gs.enemyShell+')',cls:'shield',stat:'shield',
            remaining:dur,maxRemaining:dur,
            desc:'Shield: absorbs '+gs.enemyShell+' direct damage.'
          });
        }
        addTag('enemy','shield','Shield ('+gs.enemyShell+')',null,'shield','Shield: absorbs '+gs.enemyShell+' direct damage.');
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
    effectText:  function(v){ return 'Heal '+v.amt+' HP.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'defense',
    run: function(v,ctx){
      var target, side;
      if(ctx.actor){
        target = ctx.actor;
        side = ctx.actor.side;
        var h = Math.min(+v.amt, target.maxHp - target.hp);
        target.hp = Math.min(target.maxHp, target.hp + h);
        if(h > 0){ spawnHealNum(side, h); flashHpBar(side, 'hp-flash-green'); }
        addLog(ctx.cardName + '! +' + h + ' HP.', 'heal');
      } else if(ctx.isEnemy){
        var h2 = Math.min(+v.amt, gs.enemyMaxHp - gs.enemyHp);
        gs.enemyHp = Math.min(gs.enemyMaxHp, gs.enemyHp + h2);
        if(h2 > 0){ spawnHealNum('enemy', h2); flashHpBar('enemy', 'hp-flash-green'); }
        addLog(ctx.cardName + '! +' + h2 + ' HP.', 'heal');
      } else {
        var h3 = Math.min(+v.amt, gs.playerMaxHp - gs.playerHp);
        gs.playerHp = Math.min(gs.playerMaxHp, gs.playerHp + h3);
        if(h3 > 0){ spawnHealNum('player', h3); flashHpBar('player', 'hp-flash-green'); }
        addLog(ctx.cardName + '! +' + h3 + ' HP.', 'heal');
      }
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
      if(ctx.actor && typeof actorDraw === 'function'){
        for(var i=0;i<n;i++) actorDraw(ctx.actor, null, false);
      } else if(ctx.isEnemy){
        for(var i=0;i<n;i++){
          if(gs.enemyDrawPool.length>0) gs.enemyHand.push(gs.enemyDrawPool.shift());
        }
        addLog(ctx.cardName+'! Enemy drew '+n+' card'+(n>1?'s':'')+'.','draw');
      } else {
        for(var i=0;i<n;i++) doDraw(null,false);
        addLog(ctx.cardName+'! Drew '+n+' card'+(n>1?'s':'')+'.','draw');
      }
    }
  },

  // ── Hand Size Scaling effects ────────────────────────────────

  // Damage scales with hand size (Vine Lash)
  dmg_hand_scaling: {
    label:'Hand Size Damage', cat:'damage',
    desc:'Deal base damage plus bonus per card in hand.',
    fields:[
      {id:'base', label:'Base Dmg', type:'number', default:10},
      {id:'perCard', label:'Per card', type:'number', default:2}
    ],
    effectText: function(v){ return 'Deal '+v.base+' + hand size × '+v.perCard+' damage.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var handLen = ctx.actor ? ctx.actor.hand.length : (ctx.isEnemy ? gs.enemyHand.length : gs.hand.length);
      var d = ctx.pdmg(+v.base + handLen * (+v.perCard));
      dealCardDamage(d, ctx);
      addLog(ctx.cardName+'! '+d+' dmg ('+handLen+' cards in hand).','dmg');
    }
  },

  // Deal damage per card in hand then discard entire hand (Wilt)
  dmg_hand_discard_all: {
    label:'Hand Burst + Discard All', cat:'damage',
    desc:'Deal damage per card in hand, then discard entire hand.',
    fields:[{id:'dmgPerCard', label:'Dmg per card', type:'number', default:6}],
    effectText: function(v){ return 'Deal '+v.dmgPerCard+' damage × hand size. Discard entire hand.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var actor = ctx.actor;
      var handLen, d;
      if(actor){
        handLen = actor.hand.length;
        d = ctx.pdmg(handLen * (+v.dmgPerCard));
        dealCardDamage(d, ctx);
        addLog(ctx.cardName+'! '+handLen+' cards × '+v.dmgPerCard+' = '+d+' dmg!','dmg');
        // Discard entire hand
        while(actor.hand.length > 0){
          var item = actor.hand.shift();
          if(!item.ghost){
            actor.discardPile.push(item.id);
          }
          spawnCardFloat(item.id, 'discard');
        }
        if(actor.side === 'player'){ renderHand(); renderPiles(); }
      } else {
        handLen = ctx.isEnemy ? gs.enemyHand.length : gs.hand.length;
        d = ctx.pdmg(handLen * (+v.dmgPerCard));
        dealCardDamage(d, ctx);
        addLog(ctx.cardName+'! '+handLen+' cards × '+v.dmgPerCard+' = '+d+' dmg!','dmg');
        // Fallback discard
        if(ctx.isEnemy){ gs.enemyHand.length = 0; }
        else { while(gs.hand.length > 0){ var disc = gs.hand.shift(); if(!disc.ghost) gs.discardPile.push(disc.id); } renderHand(); renderPiles(); }
      }
    }
  },

  // Corruption Spread: create an Ethereal Corrupt Spore in own hand (Bloom innate)
  corruption_spread: {
    label:'Corruption Spread', cat:'utility',
    desc:'Spend 20 mana to create a Corrupt Spore (Weaken 4s, Ethereal) in own hand.',
    fields:[],
    effectText: function(v){ return 'Create Corrupt Spore (Ethereal) in hand.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      // Mana check (this is a Sorcery-like cost on the innate trigger)
      if(actor.mana < 20) return;
      actor.mana -= 20;
      // Create Ethereal Corrupt Spore in hand
      // Register the card if not already in CARDS
      if(!CARDS['corrupt_spore']){
        CARDS['corrupt_spore'] = {
          id:'corrupt_spore', name:'Corrupt Spore', icon:'🌺', type:'utility',
          unique:false, champ:'bloom', statId:null,
          effect:'Apply [Weaken] for 4s.\n[Ethereal]',
          effects:[{type:'weaken',dur:4}]
        };
      }
      actor.hand.push({id:'corrupt_spore', ghost:true, _new:true, _newDraw:true, _drawLock:Date.now()+200});
      spawnFloatNum(getSelfSide(ctx), '-20✦', false, 'mana-num');
      addLog('Corruption Spread! Corrupt Spore added to hand.','innate');
      if(actor.side === 'player') renderHand();
    }
  },

  // ── Shield / Damage utility effects ──────────────────────────

  // Gain Shield equal to a percentage of current HP (Hunker)
  shield_pct_hp: {
    label:'Shield from HP %', cat:'buff',
    desc:'Gain Shield equal to a percentage of current HP.',
    fields:[
      {id:'pct', label:'HP %', type:'number', default:20, min:5, max:50},
      {id:'dur', label:'Duration (s)', type:'number', default:6, min:2, max:15}
    ],
    effectText: function(v){ return 'Gain '+v.pct+'% current HP as [Shield] for '+v.dur+'s.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var hp = ctx.actor ? ctx.actor.hp : (ctx.isEnemy ? gs.enemyHp : gs.playerHp);
      var amt = Math.max(1, Math.round(hp * (+v.pct / 100)));
      var dur = (+v.dur) * 1000;
      if(ctx.actor && typeof actorApplyShield === 'function'){
        actorApplyShield(ctx.actor, amt, dur);
      } else if(ctx.isEnemy){
        gs.enemyShell += amt;
        addTag('enemy','shield','Shield ('+amt+')',null,'shield','Shield: absorbs '+amt+' damage.');
        setTimeout(function(){ if(gs) gs.enemyShell = Math.max(0, gs.enemyShell - amt); }, dur);
      } else {
        _applyShield(amt, dur);
      }
      addLog(ctx.cardName+'! Shield +'+amt+' ('+v.pct+'% HP) for '+v.dur+'s.','buff');
    }
  },

  // Destroy own Shield and deal the destroyed amount as damage (Crush Sorcery)
  destroy_shield_damage: {
    label:'Destroy Shield → Damage', cat:'damage',
    desc:'Destroy your own Shield. Deal the destroyed amount as damage to opponent.',
    fields:[],
    effectText: function(v){ return 'Destroy own [Shield]. Deal destroyed amount as additional damage.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var shieldVal;
      if(ctx.actor){
        shieldVal = ctx.actor.shield || 0;
        ctx.actor.shield = 0;
        // Remove shield status
        for(var i = ctx.actor.statusEffects.length - 1; i >= 0; i--){
          if(ctx.actor.statusEffects[i].id === 'shield') ctx.actor.statusEffects.splice(i, 1);
        }
        removeTagsByClass(ctx.actor.side, 'shield');
      } else if(ctx.isEnemy){
        shieldVal = gs.enemyShell || 0;
        gs.enemyShell = 0;
        removeTagsByClass('enemy', 'shield');
      } else {
        shieldVal = gs.playerShield || 0;
        gs.playerShield = 0;
        removeTagsByClass('player', 'shield');
      }
      if(shieldVal > 0){
        dealCardDamage(shieldVal, ctx);
        addLog('Shield destroyed! +'+shieldVal+' bonus damage.','dmg');
      } else {
        addLog('No Shield to destroy.','sys');
      }
    }
  },

  // ── Innate utility effects ─────────────────────────────────

  // Churn entire hand and deal damage per card churned (Starfall)
  churn_all_damage: {
    label:'Churn All + Damage', cat:'utility',
    desc:'Discard entire hand, deal damage per card discarded, then draw same number back.',
    fields:[{id:'dmgPerCard', label:'Dmg per card', type:'number', default:5}],
    effectText: function(v){ return 'Churn entire hand. Deal '+v.dmgPerCard+' damage per card churned.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var actor = ctx.actor;
      var opponent = ctx.opponent;
      if(!actor || !opponent) return;

      // Snapshot card positions from hand DOM before removing
      var cardPositions = [];
      if(actor.side === 'player'){
        var handEl = document.getElementById('hand-cards');
        if(handEl){
          var cardEls = handEl.querySelectorAll('.hcard');
          for(var ci = 0; ci < cardEls.length; ci++){
            var r = cardEls[ci].getBoundingClientRect();
            cardPositions.push({x: r.left + r.width/2, y: r.top + r.height/2});
          }
        }
      }

      // Get discard pile position
      var discX = 0, discY = 0;
      var discEl = document.getElementById('disc-cnt');
      if(discEl){
        var dr = discEl.getBoundingClientRect();
        discX = dr.left + dr.width/2;
        discY = dr.top + dr.height/2;
      }

      var churned = 0;
      var cardIds = [];
      while(actor.hand.length > 0){
        var item = actor.hand.shift();
        if(!item.ghost){
          actor.discardPile.push(item.id);
          // Fire echo
          var card = CARDS[item.id];
          if(card && card.onDiscard && card.onDiscard.length){
            card.onDiscard.forEach(function(eff){
              if(EFFECT_TYPES[eff.type]) EFFECT_TYPES[eff.type].run(eff, ctx);
            });
            spawnEchoFloat(item.id);
          }
        }
        cardIds.push(item.id);
        churned++;
      }

      // Staggered arc animation — each card lifts, shrinks, arcs to discard
      if(actor.side === 'player'){
        for(var ai = 0; ai < cardIds.length; ai++){
          (function(idx, cId){
            setTimeout(function(){
              var c = CARDS[cId];
              if(!c) return;
              var pos = cardPositions[idx] || cardPositions[0] || {x: discX, y: discY + 200};
              var el = document.createElement('div');
              el.className = 'churn-arc';
              el.innerHTML = '<div class="cg-icon">'+(c.icon||'?')+'</div><div class="cg-name">'+(c.name||cId)+'</div>';
              el.style.left = pos.x + 'px';
              el.style.top = pos.y + 'px';
              el.style.setProperty('--dx', (discX - pos.x) + 'px');
              el.style.setProperty('--dy', (discY - pos.y) + 'px');
              document.body.appendChild(el);
              setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 550);
            }, idx * 80); // 80ms stagger between each card
          })(ai, cardIds[ai]);
        }
      }

      if(churned > 0){
        var d = churned * (+v.dmgPerCard || 5);
        dealCardDamage(d, ctx);
        addLog('Starfall! Churned '+churned+' cards, '+d+' damage.','innate');
      }
      // Draw same number back (Churn = discard + redraw)
      for(var i = 0; i < churned; i++){
        if(typeof actorDraw === 'function') actorDraw(actor, null, false);
        else if(actor.side === 'player') doDraw(null, false);
      }
      if(actor.side === 'player'){ renderHand(); renderPiles(); }
    }
  },

  // Mark all attack cards in hand with +Crit (Shadow Mark)
  mark_attack_cards_crit: {
    label:'Mark Attack Cards Crit', cat:'buff',
    desc:'All attack cards in hand gain +Crit.',
    fields:[{id:'pct', label:'Crit %', type:'number', default:100}],
    effectText: function(v){ return 'All attack cards: +[Crit]: '+v.pct+'%.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      var pct = +v.pct || 100;
      actor.shadowMarkActive = true;
      for(var i = 0; i < actor.hand.length; i++){
        var c = CARDS[actor.hand[i].id];
        if(c && c.type === 'attack' && !actor.hand[i].ghost){
          actor.hand[i].critBonus = pct;
        }
      }
      actorApplyStatus(actor, {
        id:'shadow_mark', label:'Shadow Mark', cls:'buff', stat:'shadow_mark',
        remaining:30000, maxRemaining:30000,
        desc:'Shadow Mark: next attack card played crits.'
      });
      if(actor.side === 'player') renderHand();
    }
  },

  // Convert oldest card in hand to a specific card (Spite Spines)
  convert_oldest_to: {
    label:'Convert Oldest Card', cat:'utility',
    desc:'Replace the oldest card in hand with a ghost card.',
    fields:[{id:'cardId', label:'Card ID', type:'text', default:'squanchback_spite'}],
    effectText: function(v){ return 'Convert oldest card into ['+v.cardId+'] (Ethereal).'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      var oldestIdx = -1;
      for(var i = 0; i < actor.hand.length; i++){
        if(!actor.hand[i].ghost){ oldestIdx = i; break; }
      }
      if(oldestIdx === -1){
        addLog('No cards to convert!','innate');
        // Refund mana
        var innate = actor.creature && actor.creature.innate;
        if(innate) actor.mana += (innate.cost || 0);
        return;
      }
      var oldName = (CARDS[actor.hand[oldestIdx].id] && CARDS[actor.hand[oldestIdx].id].name) || actor.hand[oldestIdx].id;
      actor.hand[oldestIdx] = {id: v.cardId, ghost: true};
      addLog(oldName + ' → ' + (CARDS[v.cardId] ? CARDS[v.cardId].name : v.cardId) + '.','innate');
      if(actor.side === 'player') renderHand();
    }
  },

  // Copy the last card played by either side into hand as Ethereal (Absorb)
  copy_last_card: {
    label:'Copy Last Card', cat:'utility',
    desc:'Create an Ethereal copy of the last card played.',
    fields:[],
    effectText: function(v){ return 'Copy last card played (Ethereal).'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      var lastId = gs.lastCardPlayed;
      if(!lastId || !CARDS[lastId]){
        addLog('No card to absorb!','innate');
        var innate = actor.creature && actor.creature.innate;
        if(innate) actor.mana += (innate.cost || 0);
        return;
      }
      actor.hand.push({id: lastId, ghost: true, _newDraw: true, _drawLock: Date.now()+200});
      addLog('Absorbed ' + CARDS[lastId].name + ' (Ethereal).','innate');
      if(actor.side === 'player') spawnDrawAnim(lastId, 'innate');
      if(actor.side === 'player') renderHand();
    }
  },

  // Discard random cards from hand (Quick Hands component)
  discard_random: {
    label:'Discard Random', cat:'utility',
    desc:'Discard random cards from hand.',
    fields:[{id:'count', label:'Cards', type:'number', default:1}],
    effectText: function(v){ return 'Discard '+v.count+' random card'+(+v.count>1?'s':'')+'.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || actor.hand.length === 0) return;
      var n = Math.min(+v.count || 1, actor.hand.length);
      for(var i = 0; i < n; i++){
        if(actor.hand.length === 0) break;
        var ri = Math.floor(Math.random() * actor.hand.length);
        var discItem = actor.hand.splice(ri, 1)[0];
        if(!discItem.ghost){
          actor.discardPile.push(discItem.id);
          // Fire echo
          var card = CARDS[discItem.id];
          if(card && card.onDiscard && card.onDiscard.length){
            card.onDiscard.forEach(function(eff){
              if(EFFECT_TYPES[eff.type]) EFFECT_TYPES[eff.type].run(eff, ctx);
            });
            spawnEchoFloat(discItem.id);
          }
        }
        spawnCardFloat(discItem.id, 'discard');
        var discName = (CARDS[discItem.id] && CARDS[discItem.id].name) || discItem.id;
        addLog('Discarded ' + discName + '.','draw');
      }
      if(actor.side === 'player'){ renderHand(); renderPiles(); }
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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
      dealCardDamage(d, ctx);
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
      var oppEff3=ctx.opponent?ctx.opponent.statusEffects:gs.statusEffects.enemy;
      var hasD=oppEff3.some(function(x){return x.cls==='debuff';});
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
      dealCardDamage(d, ctx);
      addLog(ctx.cardName+'! '+d+' dmg (played '+gs[key]+'×).','dmg');
    }
  },


}; // end EFFECT_TYPES

// Build display text for a sorcery bonus given its field values

// Build an inner effect object from sorcery fields, for dispatch through EFFECT_TYPES


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
    cardName:(CARDS[cardId]&&CARDS[cardId].name)||cardId,
    // Bridge: add actor/opponent refs if actors system is active
    actor: (gs.actors && gs.actors.player) || null,
    opponent: (gs.actors && gs.actors.enemy) || null,
    isEnemy: false,
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
    isEnemy: true,
    debuffDurMult: debuffDurMult,
    // Bridge: add actor/opponent refs if actors system is active
    actor: (gs.actors && gs.actors.enemy) || null,
    opponent: (gs.actors && gs.actors.player) || null,
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
  if(!ch.innateActive||gs.mana<ch.innateCost||gs._innCooldown>0) return;

  if(!gs.actors || !gs.actors.player) return;

  if(typeof syncGSToActors === 'function') syncGSToActors();
  var pActor = gs.actors.player;
  if(!pActor.creature) pActor.creature = CREATURES[gs.champId];

  var success = actorActivateInnate(pActor);
  if(success){
    if(typeof syncActorsToGS === 'function') syncActorsToGS();
    playInnateSfx();
    var innateEl=document.getElementById('innate-card');
    if(innateEl){ innateEl.classList.remove('innate-flash'); void innateEl.offsetWidth; innateEl.classList.add('innate-flash'); }
  }
  updateAll(); renderHand(); renderPiles(); checkEnd();
}
