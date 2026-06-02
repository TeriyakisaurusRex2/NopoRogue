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
  // Round 67r: bypass path — fire the FX hook here since this function
  // skips applyStatus()/applyDoT(). Player-applied debuff on enemy.
  if(typeof _fxStatusApplyFromTarget === 'function'){
    _fxStatusApplyFromTarget('enemy', 'poison', 'debuff');
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
  // Round 67r: bypass-path FX hook (enemy-applied debuff on player).
  if(typeof _fxStatusApplyFromTarget === 'function'){
    _fxStatusApplyFromTarget('player', 'poison', 'debuff');
  }
}

// Stack-or-create Burn (3s tick, bypasses Shield)
// Apply Burn — non-stacking. Reapplication refreshes duration only, never increases dpt.
// Burn is a single flat DoT. Use poison for stacking pressure.
function _applyBurn(dpt, durMs){
  // Wildfire Focus relic: burn dpt scales with player WIS instead of card-flat value.
  if(gs && gs._relicBurnScalesWis){
    var wis = (gs.stats && gs.stats.wis) || 0;
    dpt = Math.max(1, Math.round(wis/3));
  }
  var dur=(durMs||9000)+((gs&&gs._relicBurnDurBonus)||0);
  var e=gs.statusEffects.enemy.find(function(s){return s.id==='burn';});
  if(e){
    e.remaining=dur; e.maxRemaining=dur;
    // Stronger Burn replaces weaker (Status doc rule). Weaker
    // reapplication refreshes duration only.
    if(dpt > (e.dpt||0)){
      e.dpt = dpt;
      e.label = 'Burn ('+dpt+'/s)';
      e.desc  = 'Burn: '+dpt+' dmg/s. Bypasses Shield. Does not stack — reapplication refreshes duration.';
    }
  }
  else {
    gs.statusEffects.enemy.push({id:'burn',label:'Burn ('+dpt+'/s)',cls:'debuff',stat:'dot',
      remaining:dur,maxRemaining:dur,dot:true,dpt:dpt,tickMs:1000,tickAcc:0,
      desc:'Burn: '+dpt+' dmg/s. Bypasses Shield. Does not stack — reapplication refreshes duration.'});
    addTag('enemy','debuff','Burn ('+dpt+'/s)',0,'dot','Burn: '+dpt+' dmg/s. Bypasses Shield.');
  }
  // Round 67r: bypass-path FX hook (player-applied debuff on enemy).
  // Burn skips applyStatus()/applyDoT() — without this, Smite /
  // Consecrate / Hellbent burns never surface the statusBolt look.
  if(typeof _fxStatusApplyFromTarget === 'function'){
    _fxStatusApplyFromTarget('enemy', 'burn', 'debuff');
  }
}

// Apply Burn to player (used by enemy innates like Cursed Retribution)
function _applyBurnToPlayer(dpt, durMs){
  var dur=durMs||9000;
  var e=gs.statusEffects.player.find(function(s){return s.id==='burn';});
  if(e){
    e.remaining=dur; e.maxRemaining=dur;
    if(dpt > (e.dpt||0)){
      e.dpt = dpt;
      e.label = 'Burn ('+dpt+'/s)';
      e.desc  = 'Burn: '+dpt+' dmg/s. Bypasses Shield.';
    }
  }
  else {
    gs.statusEffects.player.push({id:'burn',label:'Burn ('+dpt+'/s)',cls:'debuff',stat:'dot',
      remaining:dur,maxRemaining:dur,dot:true,dpt:dpt,tickMs:1000,tickAcc:0,
      desc:'Burn: '+dpt+' dmg/s. Bypasses Shield.'});
    addTag('player','debuff','Burn ('+dpt+'/s)',0,'dot','Burn: '+dpt+' dmg/s. Bypasses Shield.');
  }
  // Round 67r: bypass-path FX hook (enemy-applied debuff on player).
  if(typeof _fxStatusApplyFromTarget === 'function'){
    _fxStatusApplyFromTarget('player', 'burn', 'debuff');
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
  // Round 67r: self-applied — sourceStr === targetStr suppresses the
  // projectile (no "from-to" to convey on a self-cast). Lingering
  // motes still spawn on the player.
  if(typeof _fxStatusApplyFromTarget === 'function'){
    _fxStatusApplyFromTarget('player', 'poison', 'debuff', 'player');
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
  // Round 67r: enemy self-poison (e.g. Plagued One innate). Same
  // sourceStr === targetStr trick to suppress the projectile.
  if(typeof _fxStatusApplyFromTarget === 'function'){
    _fxStatusApplyFromTarget('enemy', 'poison', 'debuff', 'enemy');
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
    // Legacy fallback (no actors system): player effect hits the enemy.
    // Bugfix: this branch used to call dealCardDamage(d, ctx) — itself —
    // which is infinite recursion. It must route to dealDamageToEnemy.
    dealDamageToEnemy(d);
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

// Find a card's printed [Crit] %, scanning its effects for a crit field.
function _cardPrintedCrit(card){
  if(!card || !card.effects) return 0;
  for(var i=0;i<card.effects.length;i++){
    var e = card.effects[i];
    if(e && +e.crit) return +e.crit;
  }
  return 0;
}

// [Accrue] — a card with an `accrue:{trigger,target,per}` property grows
// a per-hand-item counter (item._accrue) each time its trigger keyword
// fires anywhere in the battle. Scans BOTH hands so e.g. an opponent's
// burn still feeds a held card. Per-item, so it resets on a zone change
// (played / discarded -> the item is gone; a fresh draw starts at 0).
function _accrueBump(triggerKw){
  if(typeof gs === 'undefined' || !gs || !gs.actors) return;
  ['player','enemy'].forEach(function(side){
    var act = gs.actors[side];
    if(!act || !act.hand) return;
    var bumped = false;
    act.hand.forEach(function(it){
      var c = CARDS[it.id];
      if(c && c.accrue && c.accrue.trigger === triggerKw && +c.accrue.per){
        it._accrue = (it._accrue || 0) + (+c.accrue.per);
        bumped = true;
      }
    });
    if(bumped && side === 'player' && typeof renderHand === 'function') renderHand();
  });
}

// Called once per card play when a crit resolves (from dmg_conditional and
// from apply_status's generalised [Crit]). Powers the [Crit]-triggered
// [Accrue] (Insurance) and on_crit innate triggers (Markup).
function _markupOnCrit(ctx){
  if(!ctx || !ctx.actor) return;
  _accrueBump('crit');
  if(typeof fireInnateTriggers === 'function'){
    fireInnateTriggers(ctx.actor, 'on_crit', ctx);
  }
}

// ══════════════════════════════════════════════════════════════
// AURA SYSTEM — conditional resolution-time modifiers
// ══════════════════════════════════════════════════════════════
//
// Auras are defined on innates and relics:
//   innate.auras: [{id, condition, effect, manabound}]
//
// Conditions: 'always', 'hand_empty', 'hand_full', 'below_50_hp',
//   'above_50_hp', 'has_shield', 'has_debuff', 'no_debuff',
//   'has_burn', 'has_poison', 'has_haste'
//
// Effect types:
//   Status aura:    {status:'haste', value:1.0, label:'Hellfire'}
//   Modifier aura:  {debuffDurMult:1.5}  or  {poisonTickMult:2, poisonDurMult:0.5}
//                   {shieldMult:1.25}  or  {healMult:0.5}  or  {critDmgMult:2.5}
//
// Supported modifier keys (checked at resolution time):
//   debuffDurMult   — multiply duration on debuff applications
//   poisonTickMult  — multiply poison tick rate
//   poisonDurMult   — multiply poison duration
//   burnDurMult     — multiply burn duration
//   shieldMult      — multiply shield values
//   healMult        — multiply heal values
//   critDmgMult     — multiply crit damage (default 2x)
//
// processAuras(actor) is called every gameTick for both actors.

function _checkAuraCondition(condition, actor){
  if(!actor) return false;
  switch(condition){
    case 'always':      return true;
    case 'hand_empty':  return actor.hand && actor.hand.length === 0;
    case 'hand_full':   return actor.hand && actor.hand.length >= (HAND_SIZE||7);
    case 'below_50_hp': return actor.hp < actor.maxHp * 0.5;
    case 'above_50_hp': return actor.hp >= actor.maxHp * 0.5;
    case 'has_shield':  return (actor.shield || 0) > 0;
    case 'no_shield':   return (actor.shield || 0) <= 0;
    case 'has_debuff':  return actor.statusEffects && actor.statusEffects.some(function(s){return s.cls==='debuff';});
    case 'no_debuff':   return !actor.statusEffects || !actor.statusEffects.some(function(s){return s.cls==='debuff';});
    case 'has_burn':    return actor.statusEffects && actor.statusEffects.some(function(s){return s.id==='burn';});
    case 'has_poison':  return actor.statusEffects && actor.statusEffects.some(function(s){return s.id==='poison';});
    case 'has_haste':   return actor.statusEffects && actor.statusEffects.some(function(s){return s.stat==='haste'||s.id==='haste';});
    default: return false;
  }
}

function _getAuraDefinitions(actor){
  var defs = [];
  // From innate
  if(actor.creature && actor.creature.innate && actor.creature.innate.auras){
    actor.creature.innate.auras.forEach(function(a){ defs.push(a); });
  }
  // Future: from relics
  // if(actor.relics){ actor.relics.forEach(function(r){ if(r.auras) r.auras.forEach(function(a){ defs.push(a); }); }); }
  return defs;
}

function _applyAura(actor, auraDef){
  var eff = auraDef.effect;
  // Status aura — push a status effect
  if(eff.status){
    actor.statusEffects.push({
      id: auraDef.id + '_aura', label: eff.label || auraDef.id,
      cls:'buff', stat: eff.status, val: eff.value || 0,
      remaining:999999, maxRemaining:999999,
      desc: (eff.label || auraDef.id) + ' (aura)',
      _aura: true
    });
    addTag(actor.side, 'buff', (eff.label || auraDef.id), 0, '', (eff.label || auraDef.id) + ' (aura)');
    addLog(actor.creature.name + ' — ' + (eff.label || auraDef.id) + '!', 'innate');
  }
  // Modifier aura — set keys on actor.auras
  // Round 67c: attackCritMult added — multiplies the final crit% of
  // attack cards by the given factor. Dire wolf's Hunter's Edge uses
  // 2.0 ("double crit rate"). Applies AFTER all additive bonuses
  // (base + card modifiers + attackCritBonus) so the doubling counts
  // every crit source the card receives.
  var modKeys = ['debuffDurMult','poisonTickMult','poisonDurMult','burnDurMult',
                 'shieldMult','healMult','critDmgMult','attackCritBonus','attackCritMult',
                 'bleedStrDiv','churnBonus','etherealManaBurn','lockedDrawSpeed'];
  modKeys.forEach(function(key){
    if(eff[key] !== undefined) actor.auras[key] = eff[key];
  });
}

function _removeAura(actor, auraDef){
  var auraStatusId = auraDef.id + '_aura';
  var eff = auraDef.effect;
  // Remove status aura
  if(eff.status){
    for(var i = actor.statusEffects.length - 1; i >= 0; i--){
      if(actor.statusEffects[i].id === auraStatusId) actor.statusEffects.splice(i, 1);
    }
    removeTagByLabel(actor.side, eff.label || auraDef.id);
  }
  // Remove modifier keys
  // Round 67c: attackCritMult added — multiplies the final crit% of
  // attack cards by the given factor. Dire wolf's Hunter's Edge uses
  // 2.0 ("double crit rate"). Applies AFTER all additive bonuses
  // (base + card modifiers + attackCritBonus) so the doubling counts
  // every crit source the card receives.
  var modKeys = ['debuffDurMult','poisonTickMult','poisonDurMult','burnDurMult',
                 'shieldMult','healMult','critDmgMult','attackCritBonus','attackCritMult',
                 'bleedStrDiv','churnBonus','etherealManaBurn','lockedDrawSpeed'];
  modKeys.forEach(function(key){
    if(eff[key] !== undefined) delete actor.auras[key];
  });
}

// Called every gameTick for both actors
function processAuras(actor){
  if(!actor) return;
  var defs = _getAuraDefinitions(actor);
  if(defs.length === 0) return;

  defs.forEach(function(auraDef){
    var condMet = _checkAuraCondition(auraDef.condition || 'always', actor);
    var isActive = actor._activeAuraIds.indexOf(auraDef.id) !== -1;

    // Manabound check — if manabound and mana is 0, force inactive
    if(auraDef.manabound && (actor.mana || 0) <= 0) condMet = false;

    if(condMet && !isActive){
      // Activate
      _applyAura(actor, auraDef);
      actor._activeAuraIds.push(auraDef.id);
    } else if(!condMet && isActive){
      // Deactivate
      _removeAura(actor, auraDef);
      var idx = actor._activeAuraIds.indexOf(auraDef.id);
      if(idx !== -1) actor._activeAuraIds.splice(idx, 1);
    }
  });
}

// Read an aura modifier value from actor (for display and execution)
function getAura(actor, key){
  if(!actor || !actor.auras) return undefined;
  return actor.auras[key];
}

// ══════════════════════════════════════════════════════════════
// CARD MOD RESOLUTION — resolve a card's effects with active mods
// ══════════════════════════════════════════════════════════════

function _cardMatchesFilter(cardId, card, filter){
  if(!filter) return false;
  if(filter.all) return true;
  if(filter.id) return cardId === filter.id;
  if(filter.type) return card && card.type === filter.type;
  if(filter.tag === 'universal') return cardId === 'strike' || cardId === 'brace';
  if(filter.tag) return card && card.tags && card.tags.indexOf(filter.tag) !== -1;
  return false;
}

function getCardMods(actor, cardId){
  if(!actor || !actor._cardMods) return [];
  var card = CARDS[cardId];
  var matching = [];
  for(var i = 0; i < actor._cardMods.length; i++){
    if(_cardMatchesFilter(cardId, card, actor._cardMods[i].filter)) matching.push(actor._cardMods[i]);
  }
  return matching;
}

// Resolve card effects + all applicable mods → {effects, crit, appendedEffects}
function resolveCardEffects(actor, cardId, item){
  var card = CARDS[cardId];
  if(!card) return {effects:[], crit:0, appendedEffects:[], modifiedFields:{}};
  var mods = getCardMods(actor, cardId);
  var hasItemMods = item && (item._sorceryMult !== undefined || item._dmgBuff || item._accrue);
  if(mods.length === 0 && !hasItemMods) return {effects:card.effects||[], crit:0, appendedEffects:[], modifiedFields:{}};

  var resolved = JSON.parse(JSON.stringify(card.effects || []));
  var totalCrit = 0;
  var appended = [];
  var modifiedFields = {}; // track which fields were changed by mods

  for(var mi = 0; mi < mods.length; mi++){
    var changes = mods[mi].changes;
    for(var ci = 0; ci < changes.length; ci++){
      var ch = changes[ci];
      if(ch.field === 'crit'){
        totalCrit += (+ch.delta || 0);
        modifiedFields['crit'] = true;
      } else if(ch.append_effect){
        appended.push(JSON.parse(JSON.stringify(ch.append_effect)));
      } else if(ch.append_sorcery){
        appended.push({type:'sorcery', cost:ch.append_sorcery.cost, effect:ch.append_sorcery.effect});
      } else if(ch.field && ch.delta !== undefined){
        var fmatch = ch.field.match(/^effects\[(\d+)\]\.(\w+)$/);
        if(fmatch){
          var idx = +fmatch[1];
          var prop = fmatch[2];
          if(resolved[idx] && resolved[idx][prop] !== undefined){
            resolved[idx][prop] = (+resolved[idx][prop]) + (+ch.delta);
            modifiedFields[ch.field] = true;
          }
        }
      } else if(ch.debuff_dur_mult){
        // Multiply duration on all debuff-applying effects
        var debuffStatuses = ['weaken','poison','burn','slow','bleed'];
        for(var di = 0; di < resolved.length; di++){
          if(resolved[di].type === 'apply_status' && debuffStatuses.indexOf(resolved[di].status) !== -1 && resolved[di].dur){
            resolved[di].dur = Math.round(resolved[di].dur * ch.debuff_dur_mult);
            modifiedFields['effects['+di+'].dur'] = true;
          }
          // Also check inside sorcery wrappers
          if(resolved[di].type === 'sorcery' && resolved[di].effect && resolved[di].effect.type === 'apply_status' && debuffStatuses.indexOf(resolved[di].effect.status) !== -1 && resolved[di].effect.dur){
            resolved[di].effect.dur = Math.round(resolved[di].effect.dur * ch.debuff_dur_mult);
            modifiedFields['effects['+di+'].effect.dur'] = true;
          }
        }
      } else if(ch.sorcery_cost_mult){
        // Multiply sorcery costs on all sorcery effects
        for(var si = 0; si < resolved.length; si++){
          if(resolved[si].type === 'sorcery' && resolved[si].cost && resolved[si].cost !== 'all'){
            resolved[si].cost = Math.max(1, Math.round((+resolved[si].cost) * ch.sorcery_cost_mult));
            modifiedFields['effects['+si+'].cost'] = true;
          }
        }
      }
    }
  }
  // Apply per-card item stamps (e.g. from sorcery_discount)
  if(item && item._sorceryMult !== undefined){
    for(var ii = 0; ii < resolved.length; ii++){
      if(resolved[ii].type === 'sorcery' && resolved[ii].cost && resolved[ii].cost !== 'all'){
        resolved[ii].cost = Math.max(1, Math.round((+resolved[ii].cost) * item._sorceryMult));
        modifiedFields['effects['+ii+'].cost'] = true;
      }
    }
  }
  // M'bur's Whetstone: per-item flat damage buff, consumed when the card
  // is played (the hand item is destroyed on play). Bumps the first
  // dmg_conditional's base.
  if(item && item._dmgBuff){
    for(var bi = 0; bi < resolved.length; bi++){
      if(resolved[bi].type === 'dmg_conditional' && resolved[bi].base !== undefined){
        resolved[bi].base = (+resolved[bi].base) + (+item._dmgBuff);
        modifiedFields['effects['+bi+'].base'] = true;
        break;
      }
    }
  }
  // [Accrue] — per-item value accumulated while the card sat in hand.
  // accrue.target picks where it lands: 'shield' -> the shield value
  // (Insurance), 'crit' -> the dmg_conditional crit % (Smite).
  if(item && item._accrue){
    var accCard = CARDS[cardId];
    var accTarget = (accCard && accCard.accrue && accCard.accrue.target) || 'shield';
    for(var ci2 = 0; ci2 < resolved.length; ci2++){
      if(accTarget === 'shield' && resolved[ci2].type === 'apply_status' && resolved[ci2].status === 'shield' && resolved[ci2].value !== undefined){
        resolved[ci2].value = (+resolved[ci2].value) + (+item._accrue);
        modifiedFields['effects['+ci2+'].value'] = true;
        break;
      }
      if(accTarget === 'crit' && resolved[ci2].type === 'dmg_conditional'){
        resolved[ci2].crit = (+resolved[ci2].crit || 0) + (+item._accrue);
        modifiedFields['effects['+ci2+'].crit'] = true;
        break;
      }
    }
  }
  return {effects: resolved, crit: totalCrit, appendedEffects: appended, modifiedFields: modifiedFields};
}

function consumeNextPlayMods(actor, cardId){
  if(!actor || !actor._cardMods) return;
  var card = CARDS[cardId];
  for(var i = actor._cardMods.length - 1; i >= 0; i--){
    var mod = actor._cardMods[i];
    if(mod.scope === 'next_play' && _cardMatchesFilter(cardId, card, mod.filter)){
      actor._cardMods.splice(i, 1);
    }
  }
  if(actor.side === 'player' && typeof renderHand === 'function') renderHand();
}

function removeModsBySource(actor, source){
  if(!actor || !actor._cardMods) return;
  for(var i = actor._cardMods.length - 1; i >= 0; i--){
    if(actor._cardMods[i].source === source) actor._cardMods.splice(i, 1);
  }
}

function clearBattleMods(actor){
  if(!actor || !actor._cardMods) return;
  for(var i = actor._cardMods.length - 1; i >= 0; i--){
    if(actor._cardMods[i].scope !== 'permanent') actor._cardMods.splice(i, 1);
  }
}

// ══════════════════════════════════════════════════════════════
// CARD TEXT GENERATION — dynamic text from effects + mods + state
// ══════════════════════════════════════════════════════════════

var EFFECT_DISPLAY = {
  dmg_conditional: {cat:'damage',   order:0},
  dmg_scaling:     {cat:'damage',   order:0},
  dmg_cap_pct:     {cat:'damage',   order:1},
  mana_burn:       {cat:'mana_burn',order:2},
  apply_status:    {cat:'status',   order:3},
  cleanse:         {cat:'status',   order:4},
  heal:            {cat:'status',   order:3},
  churn:           {cat:'card_act', order:5},
  churn_all_damage:{cat:'card_act', order:5},
  discard_own:     {cat:'card_act', order:5},
  discard_random:  {cat:'card_act', order:5},
  draw_cards:      {cat:'card_act', order:5},
  create_card_in_hand:{cat:'card_create',order:6},
  conjure_copy:    {cat:'card_create',order:6},
  purge_conjured:  {cat:'card_act', order:5},
  modify_cards:    {cat:'modifier', order:7},
  copy_last_card:  {cat:'card_act', order:5},
  copy_hand_card:  {cat:'card_act', order:5},
  copy_last_copied:{cat:'card_act', order:5},
  sorcery_discount:{cat:'modifier', order:7},
  convert_oldest_to:{cat:'card_act',order:5},
  sorcery:         {cat:'keyword',  order:11},
  hellbent:        {cat:'keyword',  order:10},
  gain_mana:       {cat:'status',   order:3},
  compound_advance:{cat:'keyword',  order:8},
  compound_hand:   {cat:'card_create',order:6},
  vault_hoard:     {cat:'card_create',order:6},
  buff_hand_attacks:{cat:'modifier',  order:7},
  temper_universals:{cat:'modifier',  order:7},
  markup_conjure:  {cat:'card_create',order:6},
  dmg_self:        {cat:'damage',     order:0},
  create_card_in_deck:{cat:'card_create',order:6},
  churn_both:      {cat:'card_act',   order:5},
  bonus_hits:      {cat:'damage',     order:0},
  // echo:         {cat:'keyword',  order:9},  // future
};

// ══════════════════════════════════════════════════════════════
// fmt — TEXT FORMAT PRIMITIVES
// ══════════════════════════════════════════════════════════════
// Single source of truth for card-text style rules. Change a rule
// here and every card that uses the renderer picks it up.
//
// Design notes:
//   • All functions are HTML-safe: values may be plain numbers OR
//     already-wrapped <span class="stat-val">N</span> strings. fmt
//     just concatenates — wrapping is the caller's choice.
//   • Empty/null parts drop out cleanly (no "Apply [X] for s." junk).
//   • Style rules live ONLY here. CLAUDE.md describes them but this
//     module enforces them.
//
// Style rules currently encoded:
//   • Duration suffix is "for Ns" (not bare "Ns").
//   • Keyword-first ordering: "Apply [Poison] 3" never "Apply 3 [Poison]".
//   • Self-target buffs use "Gain"; opponent-target debuffs use "Apply".
//   • Mana Burn is plain text (no brackets) — flip one line to change.
// ══════════════════════════════════════════════════════════════

var fmt = {

  // Duration → "for 3s". Falsy → "".
  // Accepts a plain number OR a pre-wrapped HTML string (e.g. sv-span)
  // for live-combat usage. Don't coerce — preserve HTML.
  dur: function(s){
    if(s === null || s === undefined || s === '' || s === 0) return '';
    return 'for '+s+'s';
  },

  // Percent. Accepts a number (0.20→"20%" or 20→"20%") OR a pre-wrapped
  // string (passes through). Don't coerce HTML.
  pct: function(n){
    if(n === null || n === undefined || n === '') return '0%';
    if(typeof n === 'number'){
      if(!n) return '0%';
      if(n > 0 && n < 1) return Math.round(n*100)+'%';
      return Math.round(n)+'%';
    }
    // String (possibly HTML-wrapped) — assume caller already formatted.
    return n+'%';
  },

  // Keyword chip: "[Poison]" or "[Poison] 3".
  // val may be a number or pre-formatted string (e.g. sv-wrapped span).
  kw: function(name, val){
    var s = '['+name+']';
    if(val !== undefined && val !== null && val !== '') s += ' '+val;
    return s;
  },

  // "Apply [Keyword] N for Ms." — opponent-target convention.
  applyKw: function(name, val, dur){
    var s = 'Apply '+fmt.kw(name, val);
    var d = fmt.dur(dur);
    if(d) s += ' '+d;
    return s+'.';
  },

  // "Gain [Keyword] N for Ms." — self-target convention.
  gainKw: function(name, val, dur){
    var s = 'Gain '+fmt.kw(name, val);
    var d = fmt.dur(dur);
    if(d) s += ' '+d;
    return s+'.';
  },

  // Card-reference token. Combat renderer turns this into a hoverable chip.
  cardRef: function(cardId){ return '{{'+cardId+'}}'; },

  // Mana cost in prose: "20 mana".
  mana: function(n){ return (+n||0)+' mana'; },

  // Stat scaling formula fragment: "STR÷4". Falsy stat → "".
  statScale: function(stat, div){
    if(!stat || stat === 'none') return '';
    return stat.toUpperCase()+'÷'+(+div||1);
  },

  // "Deal N damage." or "Deal N damage × K hits."
  // base may be a number or pre-formatted string.
  dmg: function(base, hits){
    hits = +hits || 1;
    if(hits > 1) return 'Deal '+base+' damage × '+hits+' hits.';
    return 'Deal '+base+' damage.';
  },

  // "Heal N HP."
  heal: function(amt){ return 'Heal '+amt+' HP.'; },

  // "Mana Burn N." — currently unbracketed. To bracket it as a keyword:
  //   return fmt.kw('Mana Burn', val)+'.';
  manaBurn: function(val){ return 'Mana Burn '+val+'.'; },

  // Plural helper: fmt.pl(n, 'card') → 'card' or 'cards'.
  pl: function(n, sing, plur){
    n = +n||0;
    if(n === 1) return sing;
    return plur || (sing+'s');
  },

  // Status display table — drives apply_status text rendering.
  //   name    : display name (without brackets)
  //   showVal : whether to print the value next to the keyword
  //   showDur : whether to append "for Ns"
  //   asPct   : show value as percent (e.g. Haste 20%, Slow 50%)
  //   gain    : default verb is "Gain" rather than "Apply" (when target=self)
  STATUS_FMT: {
    poison: { name:'Poison', showVal:true,  showDur:true,  asPct:false, gain:false },
    burn:   { name:'Burn',   showVal:false, showDur:true,  asPct:false, gain:false },
    bleed:  { name:'Bleed',  showVal:true,  showDur:true,  asPct:false, gain:false },
    weaken: { name:'Weaken', showVal:false, showDur:true,  asPct:false, gain:false },
    slow:   { name:'Slow',   showVal:true,  showDur:true,  asPct:true,  gain:false },
    stun:   { name:'Stun',   showVal:false, showDur:false, asPct:false, gain:false },
    haste:  { name:'Haste',  showVal:true,  showDur:true,  asPct:true,  gain:true  },
    shield: { name:'Shield', showVal:true,  showDur:true,  asPct:false, gain:true  },
    thorns: { name:'Thorns', showVal:true,  showDur:true,  asPct:false, gain:true  },
    dodge:  { name:'Dodge',  showVal:false, showDur:true,  asPct:false, gain:true  },
    // Frenzy is stack-count, no duration. Phrasing: "Gain [Frenzy] N."
    frenzy: { name:'Frenzy', showVal:true,  showDur:false, asPct:false, gain:true  }
  },

  // ── Dynamic source descriptors for dmg_scaling ──────────────────
  // Each source maps to a SINGULAR-unit phrase used in "per [unit]"
  // text. Two perspectives: self (caster) and opp (opposing side).
  //
  // The static-vs-dynamic convention is enforced here. Static stat
  // scaling (eff.source==='stat') uses math notation: "Deal 10+STR÷4".
  // Dynamic in-combat sources use descriptive English: "Deal 1 damage
  // per card in your discard pile." — chosen because the value changes
  // moment-to-moment and the player needs to see WHAT it's coming from.
  SOURCE_DESC: {
    hand_size:    { self:'card in your hand',         opp:'card in the enemy\'s hand' },
    discard_size: { self:'card in your discard pile', opp:'card in the enemy\'s discard pile' },
    missing_hp:   { self:'missing HP',                opp:'HP missing from the enemy' },
    shield:       { self:'point of your [Shield]',    opp:'point of enemy [Shield]' },
    missing_mana: { self:'missing mana',              opp:'mana missing from the enemy' },
    cards_played: { self:'card you have played',      opp:'card the enemy has played' },
    purged_count: { self:'card purged',               opp:'card purged' }
  },

  // MTG-style dynamic damage:
  //   base=0:  "Deal X damage (1 per UNIT)."
  //   base>0:  "Deal BASE + X damage (M per UNIT)."
  // X is the scaling-portion placeholder. In live mode, the caller passes
  // an xLabel arg containing the resolved number (sv-wrapped). In no-actor
  // mode, xLabel defaults to literal 'X' so the rule reads as a template.
  // Returns '' if source is 'stat' — caller renders math notation.
  dmgScalingText: function(base, mult, source, check, wrap, xLabel){
    if(source === 'stat') return '';
    wrap = wrap || function(x){ return ''+x; };
    var perspective = (check === 'opponent') ? 'opp' : 'self';
    var desc = fmt.SOURCE_DESC[source];
    var unit = desc ? desc[perspective] : String(source||'').replace(/_/g,' ');
    var perUnit = (mult > 1 ? wrap(mult) : '1') + ' per ' + unit;
    // X — resolved live value (already sv-wrapped by caller) OR literal 'X'.
    var x = (xLabel !== undefined && xLabel !== null) ? xLabel : wrap('X');
    if(base > 0){
      return 'Deal '+wrap(base)+' + '+x+' damage ('+perUnit+').';
    }
    return 'Deal '+x+' damage ('+perUnit+').';
  }
};

// Generate a single effect's display text with live values.
// extraCrit (optional) is folded into a dmg_conditional's [Crit] line so
// the card shows ONE merged crit total — base + mods + item.critBonus +
// auras — rendered green when there is any bonus.
// compoundN: this card's live Compound count (actor._compound[cardId]).
// Folded into the displayed payoff so a compounded card visibly shows
// its grown value (e.g. after Hoot's Research Grant).
function _effectLiveText(eff, actor, opponent, extraCrit, compoundN){
  if(!eff || !eff.type) return '';
  compoundN = +compoundN || 0;
  var sv = function(v){ return '<span class="stat-val">'+v+'</span>'; };
  // Round 67r (bundled task B): a computed value carrying a formula
  // breakdown — dotted underline; hovering it (while paused) shows the
  // breakdown via the keyword-tooltip system. Flat values use plain sv.
  var svf = function(v, formula){
    if(!formula) return sv(v);
    return '<span class="stat-val stat-formula" data-formula="'+String(formula).replace(/"/g,'&quot;')+'">'+v+'</span>';
  };

  switch(eff.type){
    case 'dmg_conditional': {
      var base = +eff.base || 0;
      var dmgFbase = base, dmgFparts = [];
      // No-actor path (deck builder / audit) emits the formula inline
      // instead of a resolved value — same shape as hand-written text.
      var noActorFormula = '';
      if(eff.stat){
        if(actor){
          var statVal = actor[eff.stat] || 0;
          var dadd = Math.floor(statVal / (+eff.stat_div || 1));
          base += dadd;
          dmgFparts.push(eff.stat.toUpperCase()+' '+statVal+' ÷ '+(+eff.stat_div||1)+' = +'+dadd);
        } else {
          noActorFormula += '+'+fmt.statScale(eff.stat, eff.stat_div);
        }
      }
      if(eff.stat2){
        if(actor){
          var statVal2 = actor[eff.stat2] || 0;
          var dadd2 = Math.floor(statVal2 / (+eff.stat2_div || 1));
          base += dadd2;
          dmgFparts.push(eff.stat2.toUpperCase()+' '+statVal2+' ÷ '+(+eff.stat2_div||1)+' = +'+dadd2);
        } else {
          noActorFormula += '+'+fmt.statScale(eff.stat2, eff.stat2_div);
        }
      }
      // [Compound] damage scaling — fold the live count into the preview.
      if(compoundN && +eff.compoundDmg){
        var _cDmg = (+eff.compoundDmg) * compoundN;
        base += _cDmg;
        dmgFparts.push('[Compound] ×'+compoundN+' = +'+_cDmg);
      }
      var dmgFormula = dmgFparts.length ? (dmgFbase+' base   '+dmgFparts.join('   ')+'   →   '+base) : null;
      var hits = +eff.hits || 1;
      if(compoundN && +eff.compoundHits) hits += (+eff.compoundHits) * compoundN;
      // Compose damage display: live resolved value with formula tooltip,
      // OR (no actor) inline formula like "10+STR÷4".
      var dmgDisplay;
      if(noActorFormula){
        // Strip leading "+" when base is 0 (e.g. "WIS÷2" not "0+WIS÷2").
        var bodyStr = (base === 0) ? noActorFormula.replace(/^\+/,'') : (base + noActorFormula);
        dmgDisplay = sv(bodyStr);
      } else {
        dmgDisplay = svf(base, dmgFormula);
      }
      var txt = 'Deal '+dmgDisplay+' damage';
      if(hits > 1) txt += ' × '+sv(hits)+' hits';
      // Base crit — merge the printed % with any external bonus (mods,
      // item.critBonus from Markup copies, auras) into one [Crit] total.
      var _dispCrit = (+eff.crit || 0) + (+extraCrit || 0);
      if(_dispCrit > 0){
        txt += (+extraCrit > 0)
          ? '. <span class="card-mod-text">[Crit]: '+sv(_dispCrit)+'%</span>'
          : '. [Crit]: '+sv(_dispCrit)+'%';
      }
      // Condition text
      if(eff.condition){
        var condMet = false;
        var checkWho = (eff.check === 'self') ? actor : opponent;
        if(eff.condition === 'below_50_hp'){
          condMet = checkWho && checkWho.hp < checkWho.maxHp * 0.5;
        } else if(eff.condition === 'above_50_hp'){
          condMet = checkWho && checkWho.hp >= checkWho.maxHp * 0.5;
        } else if(eff.condition === 'has_debuff'){
          condMet = checkWho && checkWho.statusEffects && checkWho.statusEffects.some(function(s){return s.cls==='debuff';});
        } else if(eff.condition === 'has_burn'){
          condMet = checkWho && checkWho.statusEffects && checkWho.statusEffects.some(function(s){return s.id==='burn';});
        } else if(eff.condition === 'has_poison'){
          condMet = checkWho && checkWho.statusEffects && checkWho.statusEffects.some(function(s){return s.id==='poison';});
        } else if(eff.condition === 'has_shield'){
          condMet = checkWho && (checkWho.shield || 0) > 0;
        }
        var isSelfCheck = eff.check === 'self';
        var condLabels = {
          'below_50_hp': isSelfCheck ? 'Below 50% HP' : 'Enemy below 50% HP',
          'above_50_hp': isSelfCheck ? 'Above 50% HP' : 'Enemy above 50% HP',
          'has_debuff': isSelfCheck ? '[Debuff] active' : '[Debuff] on enemy',
          'has_burn': isSelfCheck ? '[Burn] active' : '[Burn] on enemy',
          'has_poison': isSelfCheck ? '[Poison] active' : '[Poison] on enemy',
          'has_shield': isSelfCheck ? '[Shield] active' : 'Enemy has [Shield]',
          'hand_empty': 'Hand empty',
          'hand_full': 'Hand full'
        };
        var condLabel = condLabels[eff.condition] || (eff.condition||'').replace(/_/g,' ');
        var bonusVal = +eff.on_true_val || 0;
        if(eff.on_true === 'bonus_dmg'){
          // Active (live, condition met): show the boosted total. Inactive
          // (no-actor / condition unmet): show the RULE as a delta — "deal N
          // additional damage" — clearer than a flat total and matches the
          // registry effectText + the dynamic-source convention.
          if(condMet) txt = 'Deal '+sv(base + bonusVal)+' damage'+(hits>1?' × '+sv(hits)+' hits':'') + ' ⚡';
          else txt += '.<br><span class="card-inactive">'+condLabel+': deal '+sv(bonusVal)+' additional damage</span>';
        } else if(eff.on_true === 'crit'){
          if(condMet) txt += '. [Crit]: '+sv(bonusVal)+'% ⚡';
          else txt += '.<br><span class="card-inactive">'+condLabel+': [Crit] '+sv(bonusVal)+'%</span>';
        }
      }
      return txt+'.';
    }

    case 'dmg_scaling': {
      var base = +eff.base || 0;
      var mult = +eff.mult || 1;
      var sourceVal = 0;
      var who = (eff.check === 'opponent') ? opponent : actor;

      // Resolve live source value if actor present (needed for both
      // formula tooltip and stat-source math notation).
      if(who){
        switch(eff.source){
          case 'hand_size':    sourceVal = who.hand ? who.hand.length : 0; break;
          case 'discard_size': sourceVal = who.discardPile ? who.discardPile.length : 0; break;
          case 'missing_hp':   sourceVal = (who.maxHp||0) - (who.hp||0); break;
          case 'shield':       sourceVal = who.shield || 0; break;
          case 'missing_mana': sourceVal = (who.maxMana||0) - (who.mana||0); break;
          case 'cards_played': sourceVal = who.cardsPlayed || 0; break;
          case 'purged_count': sourceVal = (ctx && ctx._purgedCount) || 0; break;
          case 'stat':
            var sn = eff.stat || 'str';
            sourceVal = Math.floor((who[sn]||0) / (+eff.stat_div||1));
            break;
        }
      }

      // Stat source — STATIC equation, math notation ("10+STR÷4 damage").
      if(eff.source === 'stat'){
        var sn2 = eff.stat || 'str';
        var sd2 = +eff.stat_div || 1;
        var total = base + (sourceVal * mult);
        if(who){
          var statFormula = base+' base   +   '+sn2.toUpperCase()+'÷'+sd2+' × '+mult+'   →   '+total;
          return 'Deal '+svf(total, statFormula)+' damage.';
        }
        var statBody = sn2.toUpperCase()+'÷'+sd2;
        if(mult > 1) statBody = mult+'×'+statBody;
        if(base > 0) statBody = base+' + '+statBody;
        return fmt.dmg(sv(statBody));
      }

      // Dynamic source — MTG-style "Deal BASE + X damage (M per UNIT)."
      //   Live  : X is replaced by the resolved scaling value (sv-wrapped).
      //   No-actor: X stays literal — the rule reads as a template.
      // Both paths share the same shape via fmt.dmgScalingText; only the
      // xLabel arg differs.
      var xLabel = who ? sv(sourceVal * mult) : undefined;
      return fmt.dmgScalingText(base, mult, eff.source, eff.check, sv, xLabel);
    }

    case 'mana_burn': {
      var val = +eff.value || 0;
      if(eff.stat && eff.stat !== 'none'){
        if(actor){
          val += Math.floor((actor[eff.stat]||0) / (+eff.stat_div||4));
        } else {
          // No-actor — inline formula like "Mana Burn 10 + WIS÷4."
          return fmt.manaBurn(sv(val+' + '+fmt.statScale(eff.stat, eff.stat_div)));
        }
      }
      return fmt.manaBurn(sv(val));
    }

    case 'apply_status': {
      var val = +eff.value || 0;
      var valFormula = null;
      // [Compound] value scaling — fold the live count into the preview.
      var _cVal = (compoundN && +eff.compoundVal) ? (+eff.compoundVal)*compoundN : 0;
      val += _cVal;
      if(eff.stat && actor){
        var vbase = val;
        var vadd = Math.floor((actor[eff.stat]||0) / (+eff.stat_div||1));
        val += vadd;
        valFormula = vbase+' base   '+eff.stat.toUpperCase()+' '+(actor[eff.stat]||0)+' ÷ '+(+eff.stat_div||1)+' = +'+vadd+'   →   '+val;
      }
      var status = eff.status || '';
      var durSec = eff.dur || 0;
      var isDebuff = ['poison','burn','weaken','slow','bleed'].indexOf(status) !== -1;
      var durModified = false;
      var valModified = false;
      // Hemorrhage aura (Kaine) — preview the STR-scaled Bleed value.
      var _bleedDiv = (status === 'bleed' && actor) ? (getAura(actor,'bleedStrDiv')||0) : 0;
      var _bleedHem = _bleedDiv ? Math.floor((actor.str||0)/_bleedDiv) : 0;

      // Aura: debuff duration multiplier
      if(isDebuff && actor){
        var auraDurMult = getAura(actor, 'debuffDurMult');
        if(auraDurMult){ durSec = Math.round(durSec * auraDurMult); durModified = true; }
      }
      // Aura: shield multiplier
      if(status === 'shield' && actor){
        var auraShMult = getAura(actor, 'shieldMult');
        if(auraShMult){ val = Math.round(val * auraShMult); valModified = true; }
      }

      // Bleed adjustment from Hemorrhage aura — fold into val/formula so the
      // shared rendering path below picks it up.
      if(status === 'bleed' && _bleedHem){
        var _bvBase = val;
        val = val + _bleedHem;
        valFormula = (valFormula ? valFormula+'   ' : (_bvBase+' base   '))
                   + 'STR '+(actor.str||0)+' ÷ '+_bleedDiv+' = +'+_bleedHem+'   →   '+val;
      }

      // Look up the format rules for this status (drives showVal/showDur/asPct/gain).
      var sdef = fmt.STATUS_FMT[status];

      // Pre-wrap the duration value for live styling. Skip entirely when
      // the status type doesn't show a duration (e.g. Frenzy).
      var durDisplay = '';
      if(durSec && (!sdef || sdef.showDur !== false)){
        durDisplay = durModified
          ? '<span class="card-mod-text">'+durSec+'</span>'
          : sv(durSec);
      }
      if(!sdef){
        // Unknown status — capitalised fallback. Keeps the renderer alive
        // for any new status added without its STATUS_FMT entry.
        var fbName = status.charAt(0).toUpperCase()+status.slice(1);
        return fmt.applyKw(fbName, sv(val), durDisplay);
      }

      // Stun has a fixed 1s duration in mechanics; render that explicitly
      // rather than reading eff.dur (which is unused for stun).
      if(status === 'stun'){
        var stunTgt = eff.target==='both' ? ' to both' : eff.target==='self' ? ' to self' : '';
        return 'Apply '+fmt.kw('Stun')+stunTgt+' '+fmt.dur(sv(1))+'.';
      }

      // Compose the value string with sv/svf wrapping + mod styling.
      var valWrapped = '';
      if(sdef.showVal){
        if(sdef.asPct){
          // Haste/Slow are stored as fractions (0.20, 0.50). Slow defaults
          // to 0.5 if value missing — matches pre-fmt behaviour.
          var rawV = (status === 'slow') ? (+eff.value || 0.5) : (+eff.value || 0);
          var pctNum = Math.round((rawV + _cVal) * 100);
          valWrapped = sv(pctNum+'%');
        } else if(valModified){
          valWrapped = '<span class="card-mod-text">'+sv(val)+'</span>';
        } else if(eff.stat && !actor){
          // No-actor path — inline formula instead of resolved value.
          var baseV = +eff.value || 0;
          var formStr = baseV ? (baseV+' + '+fmt.statScale(eff.stat, eff.stat_div))
                              : fmt.statScale(eff.stat, eff.stat_div);
          valWrapped = sv(formStr);
        } else {
          valWrapped = svf(val, valFormula);
        }
      }

      // Target qualifier (Haste-to-both, Bleed-to-both, etc.)
      var tgtQual = (eff.target === 'both') ? ' to both' : '';

      // Crit tag — currently only Haste cards use this in practice.
      var critTag = (+eff.crit) ? ' [Crit]: '+sv(+eff.crit)+'%' : '';

      // Final composition.
      var line = sdef.gain
        ? fmt.gainKw(sdef.name, valWrapped, durDisplay)
        : fmt.applyKw(sdef.name, valWrapped, durDisplay);

      // Inject "to both" before the trailing period if present.
      if(tgtQual){ line = line.replace(/\.$/, tgtQual+'.'); }
      return line + critTag;
    }

    case 'cleanse': {
      var what = (eff.what||'all_debuffs').replace(/_/g,' ');
      var tgt = eff.target === 'both' ? '(both)' : eff.target === 'opponent' ? '(enemy)' : '';
      return 'Cleanse '+what+' '+tgt+'.';
    }

    case 'heal': {
      var healVal = +eff.amt || 0;
      var healFormula = null;
      if(eff.stat && eff.stat !== 'none'){
        if(actor){
          var hbase = healVal;
          var hadd = Math.floor((actor[eff.stat] || 0) / (+eff.stat_div || 4));
          healVal += hadd;
          healFormula = hbase+' base   '+eff.stat.toUpperCase()+' '+(actor[eff.stat]||0)+' ÷ '+(+eff.stat_div||4)+' = +'+hadd+'   →   '+healVal;
        } else {
          // No-actor — inline formula like "Heal 5 + STR÷4 HP."
          return fmt.heal(sv(healVal+' + '+fmt.statScale(eff.stat, eff.stat_div)));
        }
      }
      return fmt.heal(svf(healVal, healFormula));
    }

    case 'churn': {
      var cBase = +eff.count||1;
      var cBonus = (actor && typeof getAura === 'function') ? (getAura(actor,'churnBonus')||0) : 0;
      var cTotal = cBase + cBonus;
      var cFormula = cBonus ? (cBase+' base   +   '+cBonus+' (Tending)   →   '+cTotal) : null;
      return '[Churn] '+svf(cTotal, cFormula)+'.';
    }

    case 'churn_all_damage': {
      var handSize = actor && actor.hand ? actor.hand.length : '?';
      var perCard = +eff.dmgPerCard || 0;
      var total = (typeof handSize === 'number') ? handSize * perCard : '?';
      return '[Churn] '+sv(handSize)+'. Deal '+sv(total)+' damage.';
    }

    case 'discard_own': {
      var cnt = eff.count === 'all' ? (actor && actor.hand ? actor.hand.length : 'all') : (+eff.count||1);
      return 'Discard '+sv(cnt)+'.';
    }

    case 'discard_random': return 'Discard '+sv(+eff.count||1)+' random.';

    case 'draw_cards': return 'Draw '+sv(+eff.count||1)+'.';

    case 'gain_mana': return 'Gain '+fmt.mana(sv(+eff.amt||0))+'.';
    case 'frenzy': { var fn=+eff.stacks||1; return fmt.gainKw('Frenzy', sv(fn)); }
    case 'compound_advance': return '[Compound] '+(eff.show||'')+(compoundN>0?' <span class="card-mod-text">×'+compoundN+'</span>':'');
    case 'compound_hand': return '[Compound] all cards in hand.';
    case 'buff_hand_attacks': return 'Attack cards in hand: +'+sv(+eff.amt||0)+' damage (next play).';
    case 'temper_universals': return 'Universal cards gain [Sorcery] [10]: Draw 1.';
    case 'markup_conjure': return 'Conjure a [Banish] copy of the played card.';
    case 'dmg_self': return 'Deal '+sv(+eff.amt||0)+' damage to self.';
    case 'create_card_in_deck': {
      var cdc = CARDS[eff.cardId];
      var cdCnt = +eff.count||1;
      var cdTok = cdc ? '{{'+eff.cardId+'}}' : (eff.cardId||'a card');
      return 'Create '+sv(cdCnt)+' '+cdTok+(cdCnt>1?'s':'')+' in '+(eff.target==='self'?'your':'the opponent\'s')+' deck.';
    }
    case 'churn_both': return 'Both creatures [Churn] '+sv(+eff.count||4)+'.';
    case 'bonus_hits': { var bn=+eff.amount||1; return '+'+sv(bn)+' hit'+(bn!==1?'s':''); }

    case 'create_card_in_hand': {
      var card = CARDS[eff.cardId];
      var nameTok = card ? '{{'+eff.cardId+'}}' : (eff.cardId||'a card');
      var ccnt = Math.max(1, +eff.count || 1);
      var ccBody = (ccnt>1?ccnt+' ':'')+(eff.ghost?'[Ethereal] ':'')+nameTok+(ccnt>1?'s':'');
      // [Gift] = lands in the opponent's hand. Self-target creation
      // just says "Create" — your own hand is the default.
      return (eff.target === 'opponent' ? '[Gift] ' : 'Create ') + ccBody + '.';
    }

    case 'conjure_copy': return '[Conjured]: copy this card.';
    case 'purge_conjured': return 'Purge all [Conjured] cards.';
    case 'copy_last_card': return 'Copy last played card.';
    case 'copy_hand_card': return 'Copy a random card in hand.';
    case 'copy_last_copied': return 'Copy the same card again.';
    case 'sorcery_discount': return 'Reduce [Sorcery] costs by '+sv(Math.round((1-(+eff.mult||0.5))*100))+'%.';
    case 'convert_oldest_to': return 'Convert oldest card.';

    case 'modify_cards': {
      var filt = eff.filter || {};
      var what = filt.type || filt.id || filt.tag || 'cards';
      var changes = eff.changes || [];
      var parts = [];
      changes.forEach(function(ch){
        if(ch.field === 'crit') parts.push('+[Crit] '+sv(ch.delta)+'%');
        else if(ch.append_effect) parts.push('+ effect');
        else if(ch.append_sorcery) parts.push('+ Sorcery '+ch.append_sorcery.cost);
        else if(ch.delta) parts.push(ch.field+' +'+sv(ch.delta));
      });
      return 'Modify '+what+': '+parts.join(', ')+'.';
    }

    case 'dmg_cap_pct': return 'Max hit: '+sv(eff.pct)+'% HP.';

    case 'sorcery': {
      var inner = '';
      if(eff.effect) inner = _effectLiveText(eff.effect, actor, opponent, 0, compoundN);
      if(eff.effects) inner = eff.effects.map(function(e){ return _effectLiveText(e, actor, opponent, 0, compoundN); }).join(' ');
      var costDisplay = eff.cost === 'all' ? 'all mana' : sv(+eff.cost||0);
      var canAfford = true;
      if(actor){
        var pool = actor.mana || 0;
        if(eff.cost === 'all') canAfford = pool > 0;
        else canAfford = pool >= (+eff.cost||0);
      }
      var txt = '[Sorcery] '+costDisplay+': '+inner;
      return canAfford ? txt : '<span class="card-inactive">'+txt+'</span>';
    }

    case 'hellbent': {
      var inner = eff.effect ? _effectLiveText(eff.effect, actor, opponent) : '';
      var txt = '[Hellbent]: '+inner;
      // Hellbent fires when hand size is 1 (this card is the last)
      var willFire = actor && actor.hand && actor.hand.length <= 1;
      return willFire ? txt : '<span class="card-inactive">'+txt+'</span>';
    }

    default: return eff.type + '.';
  }
}

// Standard play-event triggers we render as inline notes on cards.
// Reactive triggers (on_hit_while_shielded, on_pre_damage,
// on_opponent_attack, on_opponent_dot_tick) are NOT included — they
// don't fire from card plays so they don't belong on card text.
var _INNATE_TRIGGER_EVENT_INFO = {
  on_attack:     { label:'On attack',     applies: function(c){ return c && c.type === 'attack'; } },
  on_card:       { label:'On play',       applies: function(){ return true; } },
  on_draw:       { label:'On draw',       applies: function(){ return true; } },
  on_discard:    { label:'On discard',    applies: function(){ return true; } },
  on_hit:        { label:'On hit',        applies: function(c){ return c && c.type === 'attack'; } },
  on_crit:       { label:'On crit',       applies: function(c){
    if(!c) return false;
    // Attacks can crit even without a printed %, via mods / auras /
    // Shadow Mark. Non-damage cards only crit if they have a printed
    // [Crit] field (generalised crit — Merchant's Rush Order pattern).
    if(c.type === 'attack') return true;
    return typeof _cardPrintedCrit === 'function' && _cardPrintedCrit(c) > 0;
  } },
  on_hand_empty: { label:'On hand empty', applies: function(){ return true; } },
};

// Render the actor's innate triggers as inline notes on the card —
// so cards self-describe what their owner's innate grants them. E.g.
// a Rat's on_attack → Frenzy shows on Rat attack cards as
// "[On attack]: Gain 1 [Frenzy] stack." Player doesn't need to read
// the innate description separately.
function _innateCardTriggerLines(actor, card, opponent){
  if(!actor || !card || !actor.creature || !actor.creature.innate) return [];
  var innate = actor.creature.innate;
  // Triggers: try inline first, then the protected INNATE_TRIGGERS registry.
  var triggers = innate.triggers;
  if(!triggers || !triggers.length){
    triggers = (typeof INNATE_TRIGGERS !== 'undefined') ? INNATE_TRIGGERS[innate.id] : null;
  }
  if(!triggers || !triggers.length) return [];
  var lines = [];
  triggers.forEach(function(trigger){
    var info = _INNATE_TRIGGER_EVENT_INFO[trigger.on];
    if(!info) return;                  // reactive / unrecognized — skip
    if(!info.applies(card)) return;    // event doesn't fit this card
    if(!trigger.effect || !trigger.effect.type) return;
    // Per-effect filter (e.g. temper_universals only touches universals,
    // so its trigger note should only show on universal cards — not
    // M'bur's own champion cards).
    var effType = EFFECT_TYPES[trigger.effect.type];
    if(effType && typeof effType.appliesToCard === 'function' && !effType.appliesToCard(card)) return;
    // Try the live-text renderer; fall back to the registry's effectText
    // if _effectLiveText returned the raw "type." default (i.e. no case).
    var effText = _effectLiveText(trigger.effect, actor, opponent);
    if(effText === trigger.effect.type + '.' &&
       EFFECT_TYPES[trigger.effect.type] &&
       typeof EFFECT_TYPES[trigger.effect.type].effectText === 'function'){
      effText = EFFECT_TYPES[trigger.effect.type].effectText(trigger.effect);
    }
    if(!effText) return;
    var condText = trigger.condition ? ' ('+String(trigger.condition).replace(/_/g,' ')+')' : '';
    lines.push('['+info.label+condText+']: '+effText);
  });
  return lines;
}

// Generate full card display text from effects array
// Returns array of {layer, html} objects
function generateCardText(actor, cardId, item){
  var resolved = resolveCardEffects(actor, cardId, item);
  // Mod-appended effects render via the 'mod' layer below (in green).
  // Don't concat them here, or they'd double-render — once in their
  // natural layer (sorcery / normal / hellbent), once via the mod
  // layer. M'bur's universals showed duplicated "[Sorcery] 10: Draw 1"
  // lines from exactly this bug.
  var allEffects = resolved.effects;
  var opponent = actor ? getOpponent(actor) : null;
  // Live [Compound] count for this card (per-card-id, on the actor).
  var compoundN = (actor && actor._compound && cardId && actor._compound[cardId]) || 0;

  // Separate effects into layers
  var layers = {
    normal: [],   // order 0-7
    echo: [],     // order 9
    hellbent: [],  // order 10
    sorcery: [],  // order 11
  };

  allEffects.forEach(function(eff){
    if(!eff || !eff.type) return;
    if(eff.type === 'sorcery') layers.sorcery.push(eff);
    else if(eff.type === 'hellbent') layers.hellbent.push(eff);
    // future: else if(eff.type === 'echo') layers.echo.push(eff);
    else layers.normal.push(eff);
  });

  // Sort sorceries by cost descending (most expensive first)
  layers.sorcery.sort(function(a,b){ return (+b.cost||0) - (+a.cost||0); });

  // Sort normal effects by display order
  layers.normal.sort(function(a,b){
    var da = EFFECT_DISPLAY[a.type] || {order:99};
    var db = EFFECT_DISPLAY[b.type] || {order:99};
    return da.order - db.order;
  });

  // Build display lines per layer
  var sections = [];
  var modFields = resolved.modifiedFields || {};

  // Normal layer
  if(layers.normal.length){
    var lines = [];
    var critDelta = resolved.crit || 0;
    // Check for base crit on item
    if(item && item.critBonus) critDelta += item.critBonus;
    // Aura: attack crit bonus (e.g. Wolf Keen Senses)
    var card = CARDS[cardId];
    if(card && card.type === 'attack' && actor){
      var auraCrit = getAura(actor, 'attackCritBonus');
      if(auraCrit) critDelta += auraCrit;
      // Round 67c: attackCritMult applies AFTER additive bonuses.
      // Dire wolf doubles → e.g. base 15 from Howl Sorcery becomes 30.
      var auraCritMult = getAura(actor, 'attackCritMult');
      if(auraCritMult && auraCritMult > 0 && auraCritMult !== 1){
        critDelta = Math.round(critDelta * auraCritMult);
      }
    }
    var hasDmg = layers.normal.some(function(e){ return e.type==='dmg_conditional'||e.type==='dmg_scaling'||e.type==='churn_all_damage'; });

    // Pass critDelta so a dmg_conditional renders ONE merged [Crit]
    // total (base + mods + item.critBonus + auras) instead of the card
    // showing its printed crit and the bonus as separate segments.
    layers.normal.forEach(function(eff){
      var txt = _effectLiveText(eff, actor, opponent, critDelta, compoundN);
      if(txt) lines.push(txt);
    });
    sections.push({layer:'normal', html:lines.join('<br>')});
  }

  // Echo layer (future)
  // Check onDiscard on the card definition as legacy support
  var card = CARDS[cardId];
  if(card && card.onDiscard && card.onDiscard.length){
    var echoLines = card.onDiscard.map(function(eff){
      return _effectLiveText(eff, actor, opponent);
    }).filter(Boolean);
    if(echoLines.length){
      sections.push({layer:'echo', html:'[Echo]: '+echoLines.join(' ')});
    }
  }

  // [Drawn] layer — a card's onDraw trigger (Leona's Retainer Fee).
  if(card && card.onDraw && card.onDraw.length){
    var drawnLines = card.onDraw.map(function(eff){
      return _effectLiveText(eff, actor, opponent);
    }).filter(Boolean);
    if(drawnLines.length){
      sections.push({layer:'drawn', html:'[Drawn]: '+drawnLines.join(' ')});
    }
  }

  // Hellbent layer
  if(layers.hellbent.length){
    var hLines = layers.hellbent.map(function(eff){
      return _effectLiveText(eff, actor, opponent);
    }).filter(Boolean);
    if(hLines.length) sections.push({layer:'hellbent', html:hLines.join(' ')});
  }

  // Sorcery layer(s)
  if(layers.sorcery.length){
    var sLines = layers.sorcery.map(function(eff){
      return _effectLiveText(eff, actor, opponent, 0, compoundN);
    }).filter(Boolean);
    if(sLines.length) sections.push({layer:'sorcery', html:sLines.join('<br>')});
  }

  // Appended effects from mods (shown in green)
  if(resolved.appendedEffects && resolved.appendedEffects.length){
    var modLines = resolved.appendedEffects.map(function(eff){
      return '<span class="card-mod-text">'+_effectLiveText(eff, actor, opponent)+'</span>';
    }).filter(Boolean);
    if(modLines.length){
      sections.push({layer:'mod', html:modLines.join('<br>')});
    }
  }

  // [Accrue] is a card-level property, not an effect — surface the growth
  // rule on the card face ("[Accrue] [trigger]: +effect"). The accrued
  // total is folded live into the target value by resolveCardEffects.
  if(card && card.accrue && +card.accrue.per){
    var _ac = card.accrue;
    var _trig = (_ac.trigger === 'burn') ? 'Burn' : 'Crit';
    var _eff = (_ac.target === 'crit') ? ('+[Crit] '+(+_ac.per)+'%') : ('+[Shield] '+(+_ac.per));
    sections.push({layer:'accrue', html:'[Accrue] ['+_trig+']: '+_eff});
  }

  // [Banish] is a hand-item flag (Markup's conjured copies), not card
  // text — surface it on the card face so the player can identify a
  // conjured copy and knows it is one-play-then-gone.
  if(item && item._banish){
    sections.push({layer:'banish', html:'[Banish]'});
  }

  // Innate trigger notes — show the actor's standard play-event
  // triggers inline on cards they fit (e.g. Rat's on_attack frenzy
  // shows on attack cards). Cards self-describe what the innate grants.
  if(actor && card){
    var innateLines = _innateCardTriggerLines(actor, card, opponent);
    if(innateLines && innateLines.length){
      sections.push({layer:'innate', html:'<span class="card-innate-text">'+innateLines.join('<br>')+'</span>'});
    }
  }

  return sections;
}

// Convenience: generate full HTML for card effect area
function generateCardTextHTML(actor, cardId, item){
  var sections = generateCardText(actor, cardId, item);
  return sections.map(function(s){ return s.html; }).join('<div class="card-layer-sep"></div>');
}

// ══════════════════════════════════════════════════════════════
// SHARED CARD-DISPLAY HELPERS
// ══════════════════════════════════════════════════════════════
// Single entry point used by deck_builder, town/bestiary, dialog
// chips, and the audit page. Prefers the generator (effects[]
// array) and falls back to the hand-written effect: string for
// cards that haven't been migrated yet. Returns kw-processed HTML.
//
// As we migrate cards (drift → match → delete effect:), nothing
// in those call sites needs to change — the helper transparently
// routes to whichever source is available.
//
//   cardId — the card id
//   opts:
//     actor     — actor for live values; null/omit for design-time text
//     item      — hand item (for crit bonuses, mods)
//     joiner    — separator between effect lines (default '<br>')
//     firstLine — return only the first chunk (compact tiles)
// ══════════════════════════════════════════════════════════════
function getCardDisplayHTML(cardId, opts){
  opts = opts || {};
  var c = (typeof CARDS !== 'undefined') ? CARDS[cardId] : null;
  if(!c) return '';
  var joiner = (opts.joiner !== undefined) ? opts.joiner : '<br>';
  var sepRe = /<div\s+class="card-(?:line|layer)-sep"[^>]*><\/div>/g;
  var out = null;

  // Generator path
  if(c.effects && c.effects.length){
    try {
      if(opts.firstLine){
        var sections = generateCardText(opts.actor || null, cardId, opts.item || null);
        if(sections && sections.length && sections[0] && sections[0].html){
          out = sections[0].html.split(/<br\s*\/?>/i)[0];
        }
      } else {
        var html = generateCardTextHTML(opts.actor || null, cardId, opts.item || null);
        if(html){
          out = (joiner === '<br>') ? html : html.replace(sepRe, joiner);
        }
      }
    } catch(e){ /* fall through to static */ }
  }

  // Static fallback
  if(out == null){
    var raw = String(c.effect||'');
    if(opts.firstLine) raw = raw.split('\n')[0];
    out = raw.replace(/\n/g, joiner);
  }
  return (typeof renderKeywords === 'function') ? renderKeywords(out) : out;
}

// Plain-text variant — strips HTML, used for keyword scanning and
// string matching (e.g., the deck builder's keyword tooltip list).
function getCardDisplayText(cardId, opts){
  opts = opts || {};
  var c = (typeof CARDS !== 'undefined') ? CARDS[cardId] : null;
  if(!c) return '';
  if(c.effects && c.effects.length){
    try {
      var html = generateCardTextHTML(opts.actor || null, cardId, opts.item || null);
      if(html) return String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    } catch(e){ /* fall through */ }
  }
  return String(c.effect||'');
}

// ══════════════════════════════════════════════════════════════

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
      {id:'base',       label:'Base dmg',   type:'number', default:10},
      {id:'crit',       label:'Crit %',     type:'number', default:0},
      {id:'stat',       label:'Stat scale', type:'select', default:'none', options:['none','str','agi','wis']},
      {id:'stat_div',   label:'Stat div',   type:'number', default:4},
      {id:'stat2',      label:'Stat 2',     type:'select', default:'none', options:['none','str','agi','wis']},
      {id:'stat2_div',  label:'Stat 2 div', type:'number', default:4},
      {id:'condition',  label:'Condition',  type:'select', default:'always',
        options:['always','has_debuff','has_burn','has_poison','has_weaken','has_slow',
                 'has_shield','has_haste','has_frenzy','below_50_hp','above_50_hp']},
      {id:'check',      label:'Check who',  type:'select', default:'opponent', options:['opponent','self']},
      {id:'on_true',    label:'If true',    type:'select', default:'crit', options:['crit','bonus_dmg','bonus_hits']},
      {id:'on_true_val',label:'Value',      type:'number', default:25}
    ],
    effectText: function(v){
      var base = +v.base || +v.dmg || 0;
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
      var baseDmg = +v.base || +v.dmg || 0;
      // Compound: extra hits per Compound count (only when this play was
      // Compounded — via a paid [Compound] Sorcery or an Ethereal copy flag).
      if(ctx._compounded && +v.compoundHits){
        hits += (+v.compoundHits) * (+ctx._compoundCount || 0);
      }
      // Bonus hits from a Sorcery rider (the bonus_hits effect).
      if(ctx._bonusHits){ hits += ctx._bonusHits; }
      // Stat scaling (primary)
      if (v.stat && v.stat !== 'none') {
        var statSource = ctx.actor || ctx;
        baseDmg += Math.floor((statSource[v.stat] || 0) / (+v.stat_div || 4));
      }
      // Stat scaling (secondary)
      if (v.stat2 && v.stat2 !== 'none') {
        var statSource2 = ctx.actor || ctx;
        baseDmg += Math.floor((statSource2[v.stat2] || 0) / (+v.stat2_div || 4));
      }
      // Compound: extra damage per Compound count.
      if(ctx._compounded && +v.compoundDmg){
        baseDmg += (+v.compoundDmg) * (+ctx._compoundCount || 0);
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

      var hitDelay = 120; // ms between hits
      function fireHit(i) {
        if (!gs || !gs.running) return;
        var d = ctx.pdmg(baseDmg);
        var critPct = +v.crit || 0;
        if (ctx.critBonus) critPct += ctx.critBonus;
        // Aura: attack crit bonus (e.g. Wolf Keen Senses while haste active)
        if (ctx.card && ctx.card.type === 'attack') {
          var auraCrit = getAura(ctx.actor, 'attackCritBonus');
          if (auraCrit) critPct += auraCrit;
          // Round 67c: attackCritMult multiplies the FINAL crit% on
          // attack cards (additive bonuses already folded into
          // critPct above). Dire wolf's Hunter's Edge uses 2.0.
          var auraCritMult = getAura(ctx.actor, 'attackCritMult');
          if (auraCritMult && auraCritMult > 0 && auraCritMult !== 1) {
            critPct = Math.round(critPct * auraCritMult);
          }
        }
        // Overflow Crystal relic: each percentage of crit chance over 100
        // becomes 1% bonus damage, applied after the crit doubling.
        var critOverflowExcess = (gs && gs._relicCritOverflow && critPct > 100) ? (critPct - 100) : 0;
        var isCrit = ctx.markedCrit || (critPct > 0 && Math.random() * 100 < critPct);
        if (!isCrit && condMet && v.on_true === 'crit') isCrit = Math.random() < (+v.on_true_val / 100);
        if (isCrit) {
          d = Math.round(d * 2); crits++;
          // Fire crit-driven card mechanics once per play (Accrue, on_crit).
          if(!ctx._critFired){ ctx._critFired = true; _markupOnCrit(ctx); }
          // Round 67q: fire the FX crit overlay on the impacted target.
          // playCardFX already fired the base slash from playCard, but
          // crit isn't known until the damage roll resolves — so we
          // layer a gold burst on top once we know.
          if (typeof Effects !== 'undefined' && Effects.critFlash && typeof FX !== 'undefined' && FX.centerInStage) {
            try {
              var critTgtEl = ctx.isEnemy ? document.getElementById('p-icon') : document.getElementById('e-icon');
              // Round 67r: pass the DOM element too so critFlash can do the
              // brightness(0) silhouette flash on top of the gold burst.
              if (critTgtEl) Effects.critFlash(FX.centerInStage(critTgtEl), critTgtEl);
            } catch(critFxErr){}
          }
        }
        if (critOverflowExcess > 0) { d = Math.round(d * (1 + critOverflowExcess/100)); }
        if (condMet && v.on_true === 'bonus_dmg' && i === 0) d += (+v.on_true_val || 0);
        total += d;
        dealCardDamage(d, ctx);

        // Log after final hit
        if (i === actualHits - 1) {
          if (crits > 0) spawnFloatNum(target, 'CRIT' + (crits > 1 ? ' ×' + crits : '') + '!', false, 'crit-num');
          addLog(ctx.cardName + '! ' + (actualHits > 1 ? actualHits + ' hits, ' : '') + total + ' total dmg' +
            (crits > 0 ? ' (' + crits + ' crit' + (crits > 1 ? 's' : '') + ')' : '') + '.', 'dmg');
        }
      }

      if (actualHits <= 1) {
        fireHit(0);
      } else {
        for (var i = 0; i < actualHits; i++) {
          (function(idx){ setTimeout(function(){ fireHit(idx); }, idx * hitDelay); })(i);
        }
      }
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
        options:['hand_size','discard_size','missing_hp','shield','missing_mana','cards_played','stat','purged_count']},
      {id:'check',  label:'Read from', type:'select', default:'self', options:['self','opponent']},
      {id:'mult',   label:'Per unit',  type:'number', default:1},
      {id:'stat',   label:'Stat (if source=stat)', type:'select', default:'str', options:['str','agi','wis']},
      {id:'stat_div', label:'Stat divisor', type:'number', default:1, min:1}
    ],
    effectText: function(v){
      var base = +v.base || 0;
      var mult = +v.mult || 1;
      // Stat source — math notation (static equation convention).
      if(v.source === 'stat'){
        var statBody = (v.stat||'STR').toUpperCase()+'÷'+(v.stat_div||1);
        if(mult > 1) statBody = mult+'×'+statBody;
        if(base > 0) statBody = base+' + '+statBody;
        return 'Deal '+statBody+' damage.';
      }
      // Dynamic source — English descriptive (dynamic equation convention).
      return fmt.dmgScalingText(base, mult, v.source, v.check);
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
          case 'purged_count':  sourceVal = (ctx && ctx._purgedCount) || 0; break;
          case 'stat':
            var statName = v.stat || 'str';
            var rawStat = who[statName] || ctx[statName] || 0;
            sourceVal = Math.floor(rawStat / (+v.stat_div || 1));
            break;
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
  // ── Cleanse ──
  // Remove statuses from self or opponent. Generalised purge/dispel.
  // what: 'shield','all_debuffs','all_buffs','poison','burn','weaken',
  //        'slow','haste','frenzy','dodge','thorns','all'
  cleanse: {
    label:'Cleanse', cat:'utility',
    desc:'Remove specific status effects from a target.',
    fields:[
      {id:'target', label:'Target', type:'select', default:'self', options:['self','opponent']},
      {id:'what', label:'What to cleanse', type:'select', default:'all_debuffs',
        options:['shield','all_debuffs','all_buffs','poison','burn','weaken','slow','bleed','stun','haste','frenzy','dodge','thorns','all']}
    ],
    effectText: function(v){ return 'Cleanse '+(v.what||'all_debuffs').replace(/_/g,' ')+' from '+(v.target||'self')+'.'; },
    tooltipText: function(v){ return ''; },
    typeHint:'utility',
    run: function(v,ctx){
      // Support 'both' target — cleanse self and opponent
      if(v.target === 'both'){
        EFFECT_TYPES.cleanse.run({target:'self', what:v.what}, ctx);
        EFFECT_TYPES.cleanse.run({target:'opponent', what:v.what}, ctx);
        return;
      }
      var tgt = (v.target === 'opponent') ? ctx.opponent : ctx.actor;
      if(!tgt) return;
      var side = tgt.side;
      var what = v.what || 'all_debuffs';
      var removed = 0;

      if(what === 'shield'){
        if(tgt.shield > 0){
          var amt = tgt.shield;
          tgt.shield = 0;
          if(side === 'player') gs.playerShield = 0; else gs.enemyShell = 0;
          removeTagsByClass(side, 'shield');
          for(var i = tgt.statusEffects.length - 1; i >= 0; i--){
            if(tgt.statusEffects[i].id === 'shield') tgt.statusEffects.splice(i, 1);
          }
          spawnFloatNum(side, '-🛡'+amt, false, 'block-num');
          addLog(tgt.creature.name+'\'s Shield stripped! (-'+amt+')', 'debuff');
          // Round 67r: shared shield-break animation for cleanse-shield.
          if(typeof _fxShieldBreakFromSide === 'function') _fxShieldBreakFromSide(side);
          removed++;
        }
        return;
      }

      // Determine which statuses to remove
      var matchFn;
      if(what === 'all_debuffs') matchFn = function(s){ return s.cls === 'debuff' || s.dot || s.stat === 'dot_dummy'; };
      else if(what === 'all_buffs') matchFn = function(s){ return s.cls === 'buff' && s.id !== 'shield'; };
      else if(what === 'all') matchFn = function(s){ return true; };
      else matchFn = function(s){ return s.id === what || s.stat === what; };

      for(var j = tgt.statusEffects.length - 1; j >= 0; j--){
        if(matchFn(tgt.statusEffects[j])){
          tgt.statusEffects.splice(j, 1);
          removed++;
        }
      }

      if(what === 'all_debuffs' || what === 'all') removeTagsByClass(side, 'debuff');
      if(what === 'all_buffs' || what === 'all') removeTagsByClass(side, 'buff');
      if(what !== 'shield' && what !== 'all_debuffs' && what !== 'all_buffs' && what !== 'all'){
        // Remove specific tag
        var tags = gs.statusEffects[side];
        // Tags already removed above via statusEffects splice
      }

      if(removed > 0){
        addLog(tgt.creature.name+': '+what.replace(/_/g,' ')+' cleansed! ('+removed+')', what === 'all_buffs' || what === 'shield' ? 'debuff' : 'buff');
      }
    }
  },

  // ── Create Card In Hand ──
  // Create a specific card in a target's hand. Used by Rummage, Corruption Spread, etc.
  create_card_in_hand: {
    label:'Create Card In Hand', cat:'utility',
    desc:'Create a card in own or opponent\'s hand.',
    fields:[
      {id:'cardId', label:'Card ID', type:'text', default:''},
      {id:'target', label:'Target', type:'select', default:'self', options:['self','opponent']},
      {id:'ghost', label:'Ethereal', type:'bool', default:true},
      {id:'count', label:'Count', type:'number', default:1, min:1},
      {id:'mana_cost', label:'Mana cost', type:'number', default:0, min:0, max:100}
    ],
    effectText: function(v){
      var hasCard = (typeof CARDS!=='undefined' && CARDS[v.cardId]);
      var nm = hasCard ? '{{'+v.cardId+'}}' : (v.cardId || 'a card');
      var n = Math.max(1,+v.count||1);
      var body = (n>1?n+' ':'')+(v.ghost?'[Ethereal] ':'')+nm+(n>1?'s':'');
      return (v.mana_cost ? '['+v.mana_cost+' mana] ' : '') + (v.target==='opponent'?'[Gift] ':'Create ') + body + '.';
    },
    typeHint:'utility',
    run: function(v,ctx){
      var cardId = v.cardId;
      if(!cardId || !CARDS[cardId]) return;
      var actor = ctx.actor;
      if(!actor) return;
      // Mana cost check
      if(v.mana_cost && v.mana_cost > 0){
        if(actor.mana < v.mana_cost) return;
        actor.mana -= v.mana_cost;
        spawnFloatNum(actor.side, '-'+v.mana_cost+'✦', false, 'mana-num');
      }
      var tgt = (v.target === 'opponent') ? ctx.opponent : actor;
      if(!tgt) return;
      var ccount = Math.max(1, +v.count || 1);
      for(var cn = 0; cn < ccount; cn++){
        tgt.hand.push({ id: cardId, ghost: !!v.ghost, _new: true, _newDraw: true });
      }
      var c = CARDS[cardId];
      addLog((c.name||cardId)+(ccount>1?' x'+ccount:'')+' added to '+(tgt === actor ? 'hand' : tgt.creature.name+'\'s hand')+'.', 'draw');
      // Round 67q: conjure pulse on the player's hand when a card
      // appears. Deferred a frame so the new DOM card exists for
      // accurate slot positioning.
      if(tgt.side === 'player' && typeof _fxCardZone === 'function'){
        setTimeout(function(){
          _fxCardZone('conjure', _fxHandSlotPos(gs.hand.length - 1));
        }, 30);
      }
    }
  },

  // ── Hellbent ──
  // Wrapper: sub-effect triggers only if this card was the last card
  // in hand when played (hand size was 1 before removal).
  // Demon archetype keyword. Often has mutual downsides (hurts both sides).
  // The card's _wasLastInHand flag is set by playCardForActor.
  hellbent: {
    label:'Hellbent', cat:'utility',
    desc:'Triggers if this was the last card in hand when played.',
    fields:[
      {id:'effect', label:'Effect to run', type:'object', default:{}}
    ],
    effectText: function(v){ return '[Hellbent]: trigger effect.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(!ctx._wasLastInHand) return;
      if(v.effect && v.effect.type && EFFECT_TYPES[v.effect.type]){
        EFFECT_TYPES[v.effect.type].run(v.effect, ctx);
        addLog('Hellbent!', 'innate');
      }
    }
  },

  // ── Mutual Effect (Both) ──
  // Apply an effect to BOTH self and opponent. Used by demon Hellbent costs.

  // ── Discard Own Cards ──
  // Discard X random cards from own hand.
  discard_own: {
    label:'Discard Own', cat:'utility',
    desc:'Discard cards from own hand.',
    fields:[{id:'count', label:'Cards to discard (number or "all")', type:'text', default:'1'}],
    effectText: function(v){
      if(v.count === 'all') return 'Discard entire hand.';
      var n = +v.count||1;
      return 'Discard '+n+' '+fmt.pl(n,'card')+'.';
    },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      var n = (v.count === 'all') ? actor.hand.length : Math.min(+v.count || 1, actor.hand.length);
      // Store hand size before discard for other effects to reference
      ctx._discardedCount = n;
      for(var i = 0; i < n; i++){
        if(actor.hand.length === 0) break;
        var ri = Math.floor(Math.random() * actor.hand.length);
        var disc = actor.hand.splice(ri, 1)[0];
        if(!disc.ghost) actor.discardPile.push(disc.id);
        var card = CARDS[disc.id];
        if(card && card.onDiscard && card.onDiscard.length){
          card.onDiscard.forEach(function(eff){
            if(EFFECT_TYPES[eff.type]) EFFECT_TYPES[eff.type].run(eff, ctx);
          });
          if(typeof spawnEchoFloat === 'function') spawnEchoFloat(disc.id);
        }
        // Fire on_discard innate triggers (e.g. Toxic Cloud)
        if(!disc.ghost && typeof fireInnateTriggers === 'function'){
          fireInnateTriggers(actor, 'on_discard', {
            actor: actor,
            opponent: ctx.opponent || (typeof getOpponent === 'function' ? getOpponent(actor) : null),
            pdmg: function(b){ return Math.max(1,b); },
            cardId: disc.id
          });
        }
      }
      if(n > 0) addLog('Discarded '+n+' card'+(n>1?'s':'')+'.', 'draw');
    }
  },

  // ── Hellbent ──
  // Triggers a sub-effect only if this card is the LAST card in hand
  // when played (hand size = 1 at time of play, before removal).
  // Demon archetype keyword. Cards show "Hellbent: [effect]" as third line.
  hellbent: {
    label:'Hellbent', cat:'utility',
    desc:'If this is the last card in hand when played, trigger a bonus effect.',
    fields:[
      {id:'effect', label:'Hellbent effect', type:'object', default:{}}
    ],
    effectText: function(v){ return 'Hellbent: trigger bonus effect.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      // Check if hand was size 1 at play time (card just removed, so hand is now 0)
      // playCardForActor splices the card BEFORE running effects,
      // so hand.length === 0 means this WAS the last card
      if(actor.hand.length === 0){
        if(v.effect && v.effect.type && EFFECT_TYPES[v.effect.type]){
          addLog('Hellbent!', 'innate');
          EFFECT_TYPES[v.effect.type].run(v.effect, ctx);
        }
      }
    }
  },

  // ── Conditional Effect Wrapper ──
  // Run a sub-effect only if a condition is met. Generalises Hellbent, etc.
  // Conditions: hand_empty, hand_full, below_50_hp, above_50_hp, has_shield,
  //   has_debuff, has_burn, has_poison, has_haste, has_frenzy, has_mana_X

  // ── Mana Burn ──
  // Deal damage to opponent's mana. Overflow damages HP.
  // 20 mana burn vs 12 mana = 0 mana + 8 HP damage.
  mana_burn: {
    label:'Mana Burn', cat:'damage',
    desc:'Burn opponent mana. Overflow deals HP damage.',
    fields:[
      {id:'value', label:'Burn amount', type:'number', default:20, min:1, max:100},
      {id:'stat', label:'Stat scaling', type:'select', default:'none', options:['none','str','agi','wis']},
      {id:'stat_div', label:'Stat divisor', type:'number', default:4, min:1}
    ],
    effectText: function(v){
      var base = 'Burn '+v.value+' mana.';
      if(v.stat && v.stat !== 'none') base = 'Burn '+v.value+'+'+v.stat.toUpperCase()+'÷'+v.stat_div+' mana.';
      return base + ' Overflow damages HP.';
    },
    typeHint:'attack',
    run: function(v,ctx){
      var target = ctx.opponent;
      if(!target) return;
      var burnAmt = +v.value || 20;
      // Stat scaling
      if(v.stat && v.stat !== 'none'){
        var statVal = ctx.actor ? (ctx.actor[v.stat] || ctx[v.stat] || 0) : 0;
        burnAmt += Math.floor(statVal / (+v.stat_div || 4));
      }
      var currentMana = target.mana || 0;
      var manaBurned = Math.min(currentMana, burnAmt);
      var overflow = Math.max(0, burnAmt - currentMana);

      // Burn the mana
      target.mana = Math.max(0, target.mana - burnAmt);
      if(target.side === 'player') gs.mana = target.mana;
      else gs.enemyMana = target.mana;

      if(manaBurned > 0){
        spawnFloatNum(target.side, '-'+manaBurned+'✦', false, 'mana-num');
        addLog(target.creature.name+': '+manaBurned+' mana burned!', 'debuff');
      }

      // Overflow damages HP
      if(overflow > 0){
        dealDamage(target, overflow);
        addLog('Mana burn overflow: '+overflow+' damage!', 'dmg');
      }
    }
  },
  // Used by on_pre_damage triggers. Caps incoming damage to a % of max HP.
  // Example: Ironclad — no single hit can exceed 20% max HP.
  dmg_cap_pct: {
    label:'Damage Cap (%HP)', cat:'utility',
    desc:'Cap incoming attack damage to a percentage of max HP.',
    fields:[{id:'pct', label:'Max % of HP', type:'number', default:20, min:5, max:50}],
    effectText:  function(v){ return 'Incoming attack damage capped at '+v.pct+'% of max HP.'; },
    tooltipText: function(v){ return 'No single hit can deal more than '+v.pct+'% of max HP. DoTs bypass this.'; },
    typeHint:'utility',
    run: function(v,ctx){
      if(typeof ctx._incomingDmg !== 'number') return;
      var maxDmg = Math.floor(ctx.actor.maxHp * (+v.pct / 100));
      if(ctx._incomingDmg > maxDmg){
        ctx._modifiedDmg = maxDmg;
      }
    }
  },

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
        options:['poison','burn','weaken','slow','haste','thorns','dodge','frenzy','shield','bleed','stun']},
      {id:'target',   label:'Target',     type:'select', default:'opponent', options:['opponent','self']},
      {id:'value',    label:'Value',      type:'number', default:2},
      {id:'stat',     label:'Stat scale', type:'select', default:'none', options:['none','str','agi','wis']},
      {id:'stat_div', label:'Stat div',   type:'number', default:4},
      {id:'dur',      label:'Dur (s)',    type:'number', default:8}
    ],
    effectText: function(v){
      var sdef = fmt.STATUS_FMT[v.status];
      if(!sdef){
        // Unknown status — fallback to capitalised name.
        var fbName = (v.status||'').charAt(0).toUpperCase()+(v.status||'').slice(1);
        var fbVerb = v.target === 'self' ? 'Gain' : 'Apply';
        return fbVerb+' '+fbName+'.';
      }
      // Stun: fixed 1s mechanic; render that explicitly.
      if(v.status === 'stun'){
        return fmt.applyKw('Stun', null, 1);
      }
      // Compose value string (with optional stat scaling).
      var valStr = null;
      if(sdef.showVal){
        if(sdef.asPct){
          var rawV = (v.status === 'slow') ? (+v.value || 0.5) : (+v.value || 0);
          valStr = fmt.pct(rawV);
        } else if(v.stat && v.stat !== 'none'){
          valStr = ((+v.value) ? v.value+' + ' : '')+fmt.statScale(v.stat, v.stat_div);
        } else {
          valStr = +v.value || 0;
        }
      }
      var dur = sdef.showDur ? v.dur : null;
      // Self-target overrides the sdef default (e.g. Apply [Poison] to self).
      var useGain = sdef.gain || v.target === 'self';
      return useGain
        ? fmt.gainKw(sdef.name, valStr, dur)
        : fmt.applyKw(sdef.name, valStr, dur);
    },
    typeHint: function(v){ return v.target === 'self' ? 'utility' : 'debuff'; },
    run: function(v,ctx){
      // target:'both' — apply to self AND opponent (Leona's Retainer Fee).
      if(v.target === 'both'){
        var vSelf = {}, vOpp = {};
        for(var k in v){ vSelf[k] = v[k]; vOpp[k] = v[k]; }
        vSelf.target = 'self'; vOpp.target = 'opponent';
        EFFECT_TYPES.apply_status.run(vSelf, ctx);
        EFFECT_TYPES.apply_status.run(vOpp, ctx);
        return;
      }
      var targetActor = (v.target === 'self') ? ctx.actor : ctx.opponent;
      var targetSide = (v.target === 'self') ? getSelfSide(ctx) : getTargetSide(ctx);
      var dur = (+v.dur || 8) * 1000;
      var val = +v.value || 0;
      // Generalised [Crit]: a crit on a no-damage status card doubles the
      // status duration instead of damage (Merchant's Rush Order).
      if(+v.crit){
        var apCrit = (+v.crit) + (+ctx.critBonus || 0);
        if(ctx.markedCrit || (apCrit > 0 && Math.random()*100 < apCrit)){
          dur = dur * 2;
          if(typeof spawnFloatNum === 'function') spawnFloatNum(getSelfSide(ctx), 'CRIT!', false, 'crit-num');
          if(!ctx._critFired){ ctx._critFired = true; _markupOnCrit(ctx); }
        }
      }
      // Stat scaling
      if (v.stat && v.stat !== 'none') {
        var statSource = ctx.actor || ctx;
        val += Math.floor((statSource[v.stat] || 0) / (+v.stat_div || 4));
      }
      // Compound: scale the applied value per Compound count (Shield amount,
      // Haste %, etc) — only when this play was Compounded.
      if(ctx._compounded && +v.compoundVal){
        val += (+v.compoundVal) * (+ctx._compoundCount || 0);
      }
      val = Math.max(val, 0);

      // Aura: debuff duration multiplier
      var isDebuff = ['poison','burn','weaken','slow','bleed'].indexOf(v.status) !== -1;
      if(isDebuff && ctx.actor){
        var durMult = getAura(ctx.actor, 'debuffDurMult');
        if(durMult) dur = Math.round(dur * durMult);
      }
      // Aura: shield multiplier
      if(v.status === 'shield' && ctx.actor){
        var sMult = getAura(ctx.actor, 'shieldMult');
        if(sMult) val = Math.round(val * sMult);
      }
      // Hemorrhage aura (Kaine) — Bleed he applies scales with STR.
      if(v.status === 'bleed' && ctx.actor){
        var bleedDiv = getAura(ctx.actor, 'bleedStrDiv');
        if(bleedDiv) val += Math.floor((ctx.actor.str||0) / bleedDiv);
      }

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
          // Route by targetSide — _applyBurn pushes to enemy,
          // _applyBurnToPlayer pushes to player. Previously this
          // always called _applyBurn, which masked an inverted
          // trigger config on Cursed Retribution.
          if(targetSide === 'player') _applyBurnToPlayer(val, dur);
          else _applyBurn(val, dur);
          addLog(ctx.cardName + '! Burn +' + val + '/s.', 'debuff');
          // [Accrue] hook — any Burn application (from any source) feeds
          // burn-triggered accrue cards held in either hand (e.g. Smite).
          if(typeof _accrueBump === 'function') _accrueBump('burn');
          break;

        case 'weaken':
          applyStatus(targetSide, 'debuff', 'Weaken', -0.15, 'dmg', dur, 'Weaken: target deals 15% less damage.');
          addLog(ctx.cardName + '! [Weaken] ' + v.dur + 's.', 'debuff');
          break;

        case 'slow':
          applyStatus(targetSide, 'debuff', 'Slow ('+Math.round((+v.value||0.5)*100)+'%)', +v.value||0.5, 'slow_draw', dur,
            'Slow: draw speed reduced by '+Math.round((+v.value||0.5)*100)+'%.');
          addLog(ctx.cardName + '! [Slow] '+Math.round((+v.value||0.5)*100)+'% ' + (v.dur||4) + 's.', 'debuff');
          break;

        case 'stun':
          // Stun is always 90% slow for 1 second
          applyStatus(targetSide, 'debuff', 'Stunned', 0.9, 'slow_draw', 1000,
            'Stunned: draw speed reduced by 90% for 1s.');
          addLog(ctx.cardName + '! [Stun] 1s.', 'debuff');
          break;

        case 'bleed':
          // Non-stacking, refresh duration (like Burn)
          var bleedList = gs.statusEffects[targetSide];
          var existingBleed = bleedList.findIndex(function(s){ return s.id === 'bleed'; });
          if(existingBleed !== -1){
            var _bs = bleedList[existingBleed];
            _bs.remaining = dur;
            _bs.maxRemaining = dur;
            // Stronger Bleed replaces weaker (mirrors Burn).
            if(val > (_bs.dpt||0)){
              _bs.dpt  = val;
              _bs.desc = 'Bleed: takes '+val+' damage each time a card is played.';
            }
          } else {
            bleedList.push({id:'bleed', label:'Bleed', cls:'debuff', stat:'bleed',
              remaining:dur, maxRemaining:dur, dot:false, dpt:val,
              desc:'Bleed: takes '+val+' damage each time a card is played.'});
            addTag(targetSide, 'debuff', 'Bleed', 0, '', 'Bleed: takes '+val+' damage each time a card is played.');
          }
          addLog(ctx.cardName + '! [Bleed] '+(v.dur||4)+'s.', 'debuff');
          // Round 67r: bypass-path FX hook — this case pushes directly
          // to gs.statusEffects, skipping applyStatus()/applyDoT().
          if(typeof _fxStatusApplyFromTarget === 'function'){
            _fxStatusApplyFromTarget(targetSide, 'bleed', 'debuff');
          }
          break;

        case 'haste':
          // Round 67d: real implementation. The legacy `EFFECT_TYPES.haste`
          // it tried to call was never defined, so haste effects on cards
          // silently no-op'd. Apply as a buff status (for has_haste checks
          // + Wolf-style auras to activate) AND bump the actor's draw-speed
          // multiplier, scheduling a rollback after the duration. Matches
          // the pattern used by shrine War Cry / Battle Trance.
          applyStatus(targetSide, 'buff', 'Haste ('+Math.round(val*100)+'%)', val, 'haste', dur,
            'Haste: draw speed +'+Math.round(val*100)+'% for '+(+v.dur||4)+'s.');
          if(targetSide === 'player'){
            gs.drawSpeedBonus = (gs.drawSpeedBonus || 1) + val;
            setTimeout(function(){
              if(gs) gs.drawSpeedBonus = Math.max(1, (gs.drawSpeedBonus || 1) - val);
            }, dur);
          } else if(gs.actors && gs.actors.enemy){
            gs.actors.enemy.drawSpeedMult = (gs.actors.enemy.drawSpeedMult || 1) + val;
            setTimeout(function(){
              if(gs.actors && gs.actors.enemy){
                gs.actors.enemy.drawSpeedMult = Math.max(1, (gs.actors.enemy.drawSpeedMult || 1) - val);
              }
            }, dur);
          }
          addLog(ctx.cardName + '! [Haste] '+Math.round(val*100)+'% ' + (+v.dur||4) + 's.', 'buff');
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

        case 'shield':
          if (targetActor) {
            targetActor.shield = (targetActor.shield || 0) + val;
            if(targetActor.side === 'player') gs.playerShield = targetActor.shield;
            else gs.enemyShell = targetActor.shield;
          } else {
            if(targetSide === 'player') gs.playerShield = (gs.playerShield||0) + val;
            else gs.enemyShell = (gs.enemyShell||0) + val;
          }
          // Push status with id:'shield' so tickStatuses can find and expire it
          var shieldList = gs.statusEffects[targetSide];
          // Replace existing shield status if present (refresh duration)
          var existingShield = -1;
          for(var si = 0; si < shieldList.length; si++){
            if(shieldList[si].id === 'shield'){ existingShield = si; break; }
          }
          if(existingShield !== -1){
            shieldList[existingShield].remaining = dur;
            shieldList[existingShield].maxRemaining = dur;
          } else {
            shieldList.push({id:'shield', label:'Shield ('+val+')', cls:'shield', val:val, stat:'shield', remaining:dur, maxRemaining:dur, desc:'Shield: absorbs '+val+' damage.'});
            addTag(targetSide, 'shield', 'Shield ('+val+')', null, null, 'Shield: absorbs '+val+' damage.');
          }
          addLog((ctx.cardName||'Shield')+': +'+val+' Shield '+v.dur+'s.', 'buff');
          // Round 67q: fire the shield FX. Unlike most statuses, the
          // shield path doesn't route through applyStatus() — it
          // pushes directly to gs.statusEffects + addTag. So the
          // central _fxStatusApplyFromTarget hook (which dispatches
          // to Effects.shield for sid==='shield') never fires for
          // shield gains unless we kick it manually here.
          if(typeof _fxStatusApplyFromTarget === 'function'){
            // cls='buff' is explicit but the shield short-circuit in
            // _fxStatusApplyFromTarget runs before the debuff branch
            // anyway — passing it keeps the call self-documenting.
            _fxStatusApplyFromTarget(targetSide, 'shield', 'buff');
          }
          break;
      }
    }
  },

  // ══════════════════════════════════════════════════════════
  // LEGACY EFFECT TYPES — kept for backward compatibility
  // New cards should use dmg_conditional, dmg_scaling, apply_status
  // ══════════════════════════════════════════════════════════

  // ── DAMAGE ──────────────────────────────────────────




  // ── Multi-hit with independent crit rolls per hit ──

  // ── Multi-hit with crit ONLY when opponent is debuffed ──

  // ── Damage scaling with discard pile size ──




  // Damage with crit chance conditional on enemy having Burn active.
  // Used by Smite: [Burn] on enemy: [Crit]: 75%.

  // Damage with crit chance conditional on enemy having ANY debuff active.
  // Used by Cheap Shot: [Debuff] on enemy: [Crit]: 40%.

  // ── Damage + Shield value ──
  // Spine Lash: Deal base damage. If Shield active, deal current Shield value as additional damage.

  // ── Damage from missing HP ──
  // Spite: Deal damage equal to missing HP ÷ divisor.

  // ── DEBUFFS ─────────────────────────────────────────

  // Updated: Slow is now a fixed +600ms draw interval increase (non-stacking, refreshes)

  // Keep legacy slow as alias for backwards compat with existing cards

  // ── Weaken (renamed from cursed for clarity) ──

  // ── Thorns ──

  // ── Volatile ──



  // ── Poison self ──

  // ── Poison both ──

  // ── Dmg per poison stacks on enemy ──

  // ── Shed poison ──

  // ── Sacrifice HP ──

  // ── Sacrifice poison stacks ──

  // ── Copy Hand Card ──
  // Create an Ethereal copy of a random card from own hand.
  copy_hand_card: {
    label:'Copy Hand Card', cat:'utility',
    desc:'Create an Ethereal copy of a random card in hand.',
    fields:[],
    effectText: function(v){ return 'Copy a random card in hand.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || !actor.hand || actor.hand.length === 0) return;
      var sourceId = ctx.cardId || null;
      var candidates = actor.hand.filter(function(h){ return CARDS[h.id] && h.id !== sourceId; });
      if(candidates.length === 0) return;
      var pick = candidates[Math.floor(Math.random() * candidates.length)];
      ctx._copiedCardId = pick.id;
      actor.hand.push({id: pick.id, ghost: true, _new: true, _newDraw: true});
      var c = CARDS[pick.id];
      addLog('[Ethereal] copy of '+(c?c.name:pick.id)+' created.', 'draw');
      // Round 67q: conjure pulse for the new ethereal copy.
      if(actor.side === 'player' && typeof _fxCardZone === 'function'){
        setTimeout(function(){
          _fxCardZone('conjure', _fxHandSlotPos(gs.hand.length - 1));
        }, 30);
      }
    }
  },

  // ── Copy Last Copied ──
  copy_last_copied: {
    label:'Copy Last Copied', cat:'utility',
    desc:'Create another Ethereal copy of the last copied card.',
    fields:[],
    effectText: function(v){ return 'Copy the same card again.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || !ctx._copiedCardId) return;
      actor.hand.push({id: ctx._copiedCardId, ghost: true, _new: true, _newDraw: true});
      var c = CARDS[ctx._copiedCardId];
      addLog('[Ethereal] copy of '+(c?c.name:ctx._copiedCardId)+' created.', 'draw');
      // Round 67q: conjure pulse for repeat ethereal copy.
      if(actor.side === 'player' && typeof _fxCardZone === 'function'){
        setTimeout(function(){
          _fxCardZone('conjure', _fxHandSlotPos(gs.hand.length - 1));
        }, 30);
      }
    }
  },

  // ── Sorcery Discount ──
  // Reduce sorcery costs on all cards currently in hand.
  sorcery_discount: {
    label:'Sorcery Discount', cat:'utility',
    desc:'Reduce sorcery costs on cards currently in hand.',
    fields:[{id:'mult', label:'Cost multiplier', type:'number', default:0.5}],
    effectText: function(v){ return 'Reduce [Sorcery] costs by '+ Math.round((1-(+v.mult||0.5))*100) +'%.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || !actor.hand) return;
      var mult = +v.mult || 0.5;
      var count = 0;
      actor.hand.forEach(function(item){
        item._sorceryMult = mult;
        count++;
      });
      if(count > 0){
        addLog('[Sorcery] costs reduced by '+ Math.round((1-mult)*100) +'% on '+count+' cards!', 'buff');
        if(actor.side === 'player' && typeof renderHand === 'function') renderHand();
      }
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
      // Support cost:'all' — spend all current mana (must have at least 1)
      var cost;
      if(v.cost === 'all'){
        cost = pool;
        if(cost <= 0) return;
      } else {
        cost = +v.cost;
        if(pool < cost) return;
      }
      if(ctx.actor){
        ctx.actor.mana -= cost;
      } else if(ctx.isEnemy){
        gs.enemyMana -= cost;
      } else {
        gs.mana -= cost;
      }
      spawnFloatNum(selfSide,'-'+cost+'✦',false,'mana-num');
      updateAll();
      addLog('[Sorcery] ['+cost+'] fired.','mana');
      if(v.effect&&v.effect.type&&EFFECT_TYPES[v.effect.type])
        EFFECT_TYPES[v.effect.type].run(v.effect,ctx);
      // Support effects array (multiple effects from one sorcery)
      if(v.effects&&v.effects.length){
        v.effects.forEach(function(eff){
          if(eff.type&&EFFECT_TYPES[eff.type]) EFFECT_TYPES[eff.type].run(eff,ctx);
        });
      }
    }
  },

  // ── Hellbent wrapper ──

  // ── Refresh (shuffle discard into draw) ──

  // ── Churn ──
  churn: {
    label:'[Churn]', cat:'utility',
    desc:'Discard N random cards from hand, then draw N.',
    fields:[{id:'count', label:'Count', type:'number', default:1, min:1, max:4}],
    effectText:  function(v){ return '[Churn] '+v.count+'.'; },
    tooltipText: function(v){ return 'Churn '+v.count+': discard '+v.count+' random, draw '+v.count+'.'; },
    typeHint:'utility',
    run: function(v,ctx){
      // Tending (Groll innate) and any future relics that boost Churn
      // contribute to the churnBonus aura key. Folded in here so every
      // Churn source picks up the bonus.
      var bonus = (ctx.actor && typeof getAura === 'function') ? (getAura(ctx.actor,'churnBonus')||0) : 0;
      var n = (+v.count||0) + bonus;
      var discarded=0;
      if(ctx.isEnemy){
        // Churn enemy hand
        for(var i=0;i<n;i++){
          if(!gs.enemyHand.length) break;
          var ri=Math.floor(Math.random()*gs.enemyHand.length);
          var disc=gs.enemyHand.splice(ri,1)[0];
          gs.enemyDiscardPile.push(disc);
          // Fire the discarded card's [Echo] in the enemy's frame.
          var _discId = disc && (disc.id || disc);
          if(typeof handleCardDiscard === 'function') handleCardDiscard(_discId, ctx.actor);
          // Fire on_discard innate triggers for enemy (e.g. Toxic Cloud)
          if(ctx.actor && typeof fireInnateTriggers === 'function'){
            fireInnateTriggers(ctx.actor, 'on_discard', {
              actor: ctx.actor,
              opponent: ctx.opponent || (typeof getOpponent === 'function' ? getOpponent(ctx.actor) : null),
              pdmg: function(b){ return Math.max(1,b); },
              cardId: _discId
            });
          }
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
          // Round 67q: churn-out pulse at the doomed slot BEFORE
          // the splice / fly-to-discard fires.
          if(typeof _fxCardZone === 'function' && typeof _fxHandSlotPos === 'function'){
            _fxCardZone('churn-out', _fxHandSlotPos(ri));
          }
          var disc=gs.hand.splice(ri,1)[0];
          if(!disc.ghost){
            gs.discardPile.push(disc.id);
            handleCardDiscard(disc.id, ctx.actor);
            // Fire on_discard innate triggers (e.g. Toxic Cloud)
            if(ctx.actor && typeof fireInnateTriggers === 'function'){
              fireInnateTriggers(ctx.actor, 'on_discard', {
                actor: ctx.actor,
                opponent: ctx.opponent || (typeof getOpponent === 'function' ? getOpponent(ctx.actor) : null),
                pdmg: function(b){ return Math.max(1,b); },
                cardId: disc.id
              });
            }
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
        // Round 67q: churn-in pulse after draws complete + hand re-renders.
        // Deferred a frame so the new card DOM is in place for accurate
        // slot positioning.
        if(typeof _fxCardZone === 'function' && discarded > 0){
          setTimeout(function(){
            for(var k = 0; k < discarded; k++){
              _fxCardZone('churn-in', _fxHandSlotPos(gs.hand.length - 1 - k));
            }
          }, 30);
        }
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
      // Round 67q: void-purple conjure pulse on the discard pile, the
      // zone where the new copy actually landed.
      if(!ctx.isEnemy && typeof _fxCardZone === 'function' && typeof _fxDiscardPilePos === 'function'){
        _fxCardZone('conjure', _fxDiscardPilePos());
      }
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
      if(!gs.conjuredCount || gs.conjuredCount <= 0){ ctx._purgedCount = 0; return; }
      var purged = purgeAllConjured();
      ctx._purgedCount = purged;
      if(purged > 0){
        addLog('[Echo] Purged ' + purged + ' [Conjured] copies.','draw');
        if(ctx.cardId) spawnEchoFloat(ctx.cardId);
        renderHand(); renderPiles();
        // Round 67q: purge pulse at hand center + discard pile so the
        // player sees BOTH zones losing their conjured copies.
        if(!ctx.isEnemy && typeof _fxCardZone === 'function'){
          _fxCardZone('purge', _fxHandCenterPos());
          _fxCardZone('purge', _fxDiscardPilePos());
        }
      }
    }
  },

  // ── Shield from discard pile ──

  // ── Damage based on missing mana ──

  // ── Damage based on STR difference ──

  // ── Damage based on missing HP ──

  // ── Damage per active second of Slow on target ──

  // ── Drain enemy mana (direct steal, not temporary) ──

  // ── Heal self ──

  // ── Suspend (pause timers) ──

  // ── Draw speed once (reduce next draw delay) ──


  // ── Crit Bonus — add +[Crit] to next attack card ──

  // ── Per-debuff damage ──









  // ── BUFFS ───────────────────────────────────────────






  heal: {
    label:'Heal HP', cat:'buff',
    desc:'Restore HP. Supports stat scaling.',
    fields:[
      {id:'amt', label:'HP restored', type:'number', default:5, min:0, max:80},
      {id:'stat', label:'Stat scale', type:'select', default:'none', options:['none','str','agi','wis']},
      {id:'stat_div', label:'Stat div', type:'number', default:4, min:1}
    ],
    effectText:  function(v){ return fmt.heal(+v.amt||0); },
    tooltipText: function(v){ return ''; },
    typeHint:'defense',
    run: function(v,ctx){
      var healAmt = +v.amt || 0;
      // Stat scaling
      if(v.stat && v.stat !== 'none'){
        var statSource = ctx.actor || ctx;
        healAmt += Math.floor((statSource[v.stat] || 0) / (+v.stat_div || 4));
      }
      var target, side;
      if(ctx.actor){
        target = ctx.actor;
        side = ctx.actor.side;
        var h = Math.min(healAmt, target.maxHp - target.hp);
        target.hp = Math.min(target.maxHp, target.hp + h);
        if(h > 0){ spawnHealNum(side, h); flashHpBar(side, 'hp-flash-green'); _fxHealFromSide(side); }
        addLog(ctx.cardName + '! +' + h + ' HP.', 'heal');
      } else if(ctx.isEnemy){
        var h2 = Math.min(healAmt, gs.enemyMaxHp - gs.enemyHp);
        gs.enemyHp = Math.min(gs.enemyMaxHp, gs.enemyHp + h2);
        if(h2 > 0){ spawnHealNum('enemy', h2); flashHpBar('enemy', 'hp-flash-green'); _fxHealFromSide('enemy'); }
        addLog(ctx.cardName + '! +' + h2 + ' HP.', 'heal');
      } else {
        var h3 = Math.min(healAmt, gs.playerMaxHp - gs.playerHp);
        gs.playerHp = Math.min(gs.playerMaxHp, gs.playerHp + h3);
        if(h3 > 0){ spawnHealNum('player', h3); flashHpBar('player', 'hp-flash-green'); _fxHealFromSide('player'); }
        addLog(ctx.cardName + '! +' + h3 + ' HP.', 'heal');
      }
    }
  },

  // ── UTILITY ─────────────────────────────────────────



  draw_cards: {
    label:'Draw Cards', cat:'utility',
    desc:'Immediately draw extra cards into hand.',
    fields:[{id:'count', label:'Cards to draw', type:'number', default:2, min:1, max:4}],
    effectText:  function(v){ var n=+v.count||1; return 'Draw '+n+' '+fmt.pl(n,'card')+'.'; },
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
        // Round 67q: draw pulse on the player's hand after the new
        // cards land. Deferred a frame so renderHand has run.
        if(typeof _fxCardZone === 'function'){
          setTimeout(function(){
            for(var k = 0; k < n; k++){
              _fxCardZone('draw', _fxHandSlotPos(gs.hand.length - 1 - k));
            }
          }, 30);
        }
      }
    }
  },

  // ── Hand Size Scaling effects ────────────────────────────────

  // Damage scales with hand size (Vine Lash)

  // Deal damage per card in hand then discard entire hand (Wilt)

  // Corruption Spread: create an Ethereal Corrupt Spore in own hand (Bloom innate)

  // ── Shield / Damage utility effects ──────────────────────────

  // Gain Shield equal to a percentage of current HP (Hunker — Drain
  // Lurker innate). Routes through apply_status so the shield pool,
  // status, tag and FX all resolve through the one shield path.
  shield_pct_hp: {
    label:'Shield % of HP', cat:'utility',
    desc:'Gain Shield equal to a percentage of current HP.',
    fields:[
      {id:'pct', label:'% of current HP', type:'number', default:20},
      {id:'dur', label:'Dur (s)',         type:'number', default:6}
    ],
    effectText: function(v){ return 'Gain [Shield] '+(+v.pct||20)+'% current HP for '+(+v.dur||6)+'s.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      var amt = Math.floor((actor.hp||0) * (+v.pct||20) / 100);
      if(amt <= 0) return;
      EFFECT_TYPES.apply_status.run({status:'shield', target:'self', value:amt, dur:(+v.dur||6)}, ctx);
    }
  },

  // Gain stacking Frenzy (Rat innate; usable by any card or trigger).
  // Side-aware — _applyFrenzy resolves the player vs enemy draw knob.
  frenzy: {
    label:'Frenzy', cat:'status',
    desc:'Gain stacking Frenzy — a manabound draw-speed buff.',
    fields:[{id:'stacks', label:'Stacks', type:'number', default:1}],
    effectText: function(v){ return fmt.gainKw('Frenzy', +v.stacks||1); },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || typeof _applyFrenzy !== 'function') return;
      var side = actor.side || (ctx.isEnemy ? 'enemy' : 'player');
      _applyFrenzy(side, Math.max(1, +v.stacks || 1));
    }
  },

  // Destroy own Shield and deal the destroyed amount as damage (Crush Sorcery)

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
  // ══════════════════════════════════════════════════════════════
  // CARD MODIFICATION SYSTEM
  // ══════════════════════════════════════════════════════════════
  // actor._cardMods = [] — list of active modification rules
  //
  // Each mod: {
  //   id:       unique string (auto-generated)
  //   source:   what created it ('shadow_mark', 'shtole_scale', relic ID)
  //   filter:   {type:'attack'} | {id:'shtoles_treasure'} | {tag:'universal'} | {all:true}
  //   where:    'hand' | 'deck' | 'discard' | 'all'
  //   scope:    'next_play' | 'battle' | 'permanent'
  //   changes:  [
  //     {field:'effects[0].base', delta:5}          — modify existing value
  //     {field:'crit', delta:100}                    — add crit
  //     {append_effect: {type:'draw_cards',count:1}} — new effect line
  //     {append_sorcery: {cost:5, effect:{...}}}     — new sorcery line
  //   ]
  // }
  //
  // Usage:
  //   {type:'modify_cards', source:'shadow_mark', filter:{type:'attack'},
  //    where:'all', scope:'next_play', changes:[{field:'crit', delta:100}]}
  //
  //   {type:'modify_cards', source:'shtole_scale', filter:{id:'shtoles_treasure'},
  //    where:'all', scope:'battle', changes:[{field:'effects[0].base', delta:5}],
  //    stack:'increment'}
  //
  modify_cards: {
    label:'Modify Cards', cat:'utility',
    desc:'Add a modification rule to cards matching a filter.',
    fields:[
      {id:'source',  label:'Source ID',   type:'text',   default:''},
      {id:'filter',  label:'Filter',      type:'object', default:{type:'attack'}},
      {id:'where',   label:'Where',       type:'select', default:'all', options:['hand','deck','discard','all']},
      {id:'scope',   label:'Scope',       type:'select', default:'next_play', options:['next_play','battle','permanent']},
      {id:'changes', label:'Changes',     type:'array',  default:[]},
      {id:'stack',   label:'Stack mode',  type:'select', default:'add', options:['add','increment']}
    ],
    effectText: function(v){ return 'Modify '+(v.filter&&v.filter.type||v.filter&&v.filter.id||'cards')+' ('+v.scope+').'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      if(!actor._cardMods) actor._cardMods = [];

      var source = v.source || 'unknown';
      var changes = v.changes || [];
      if(changes.length === 0) return;

      // Stack mode: 'increment' finds existing mod with same source and increases deltas
      if(v.stack === 'increment'){
        var existing = null;
        for(var i = 0; i < actor._cardMods.length; i++){
          if(actor._cardMods[i].source === source){
            existing = actor._cardMods[i];
            break;
          }
        }
        if(existing){
          // Increment each change's delta
          for(var ci = 0; ci < changes.length; ci++){
            var ch = changes[ci];
            if(ch.delta === undefined) continue;
            var found = false;
            for(var ei = 0; ei < existing.changes.length; ei++){
              if(existing.changes[ei].field === ch.field){
                existing.changes[ei].delta += ch.delta;
                found = true;
                break;
              }
            }
            if(!found) existing.changes.push({field:ch.field, delta:ch.delta});
          }
          addLog('Card mod \''+source+'\' increased.', 'buff');
          if(actor.side === 'player' && typeof renderHand === 'function') renderHand();
          return;
        }
        // No existing mod — fall through to create new
      }

      var mod = {
        id: source + '_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        source: source,
        filter: v.filter || {all:true},
        where: v.where || 'all',
        scope: v.scope || 'next_play',
        changes: changes.slice(),
      };

      actor._cardMods.push(mod);
      addLog('Card mod \''+source+'\' applied.', 'buff');
      if(actor.side === 'player' && typeof renderHand === 'function') renderHand();
      // Round 67q: modify pulse on each affected card in the player's
      // hand. Round 67r: now filter properly — only cards that match
      // the modification's filter get the sparkle. Previously every
      // card pulsed regardless of filter (so Dead Weight twinkled on
      // Shadow Mark even though it's not an attack card).
      if(actor.side === 'player' && typeof _fxCardZone === 'function'){
        var modFilter = mod.filter;
        setTimeout(function(){
          for(var k = 0; k < gs.hand.length; k++){
            var handItem = gs.hand[k];
            var handCard = handItem && CARDS[handItem.id];
            if(_cardMatchesFilter(handItem && handItem.id, handCard, modFilter)){
              _fxCardZone('modify', _fxHandSlotPos(k));
            }
          }
        }, 30);
      }
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
      // Round 67q: conjure pulse for the absorbed copy.
      if(actor.side === 'player' && typeof _fxCardZone === 'function'){
        setTimeout(function(){
          _fxCardZone('conjure', _fxHandSlotPos(gs.hand.length - 1));
        }, 30);
      }
    }
  },

  // Discard random cards from hand (Quick Hands component)
  discard_random: {
    label:'Discard Random', cat:'utility',
    desc:'Discard random cards from hand.',
    fields:[{id:'count', label:'Cards', type:'number', default:1}],
    effectText: function(v){ var n=+v.count||1; return 'Discard '+n+' random '+fmt.pl(n,'card')+'.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || actor.hand.length === 0) return;
      var n = Math.min(+v.count || 1, actor.hand.length);
      for(var i = 0; i < n; i++){
        if(actor.hand.length === 0) break;
        var ri = Math.floor(Math.random() * actor.hand.length);
        // Round 67q: red doom flash on the chosen card BEFORE the
        // existing fly-to-discard animation. Player-side only — enemy
        // hand isn't visible.
        if(actor.side === 'player' && typeof _fxCardZone === 'function' && typeof _fxHandSlotPos === 'function'){
          _fxCardZone('discard-doom', _fxHandSlotPos(ri));
        }
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
          // Fire on_discard innate triggers (e.g. Toxic Cloud)
          if(typeof fireInnateTriggers === 'function'){
            fireInnateTriggers(actor, 'on_discard', {
              actor: actor,
              opponent: ctx.opponent || (typeof getOpponent === 'function' ? getOpponent(actor) : null),
              pdmg: function(b){ return Math.max(1,b); },
              cardId: discItem.id
            });
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

  // ── Drain a percentage of own max mana ──

  // ── Gain mana (Appraise, etc) ──
  gain_mana: {
    label:'Gain Mana', cat:'utility',
    desc:'Restore mana to the caster.',
    fields:[{id:'amt',label:'Amount',type:'number',default:20}],
    effectText: function(v){ return 'Gain '+fmt.mana(+v.amt||0)+'.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var amt = +v.amt || 0;
      if(ctx.actor){
        ctx.actor.mana = Math.min(ctx.actor.maxMana||9999, (ctx.actor.mana||0) + amt);
      } else if(ctx.isEnemy){
        gs.enemyMana = Math.min(gs.enemyMaxMana||9999, (gs.enemyMana||0) + amt);
      } else {
        gs.mana = Math.min(gs.maxMana||9999, (gs.mana||0) + amt);
      }
      addLog(ctx.cardName + '! +' + amt + ' mana.', 'mana');
      if(typeof updateAll === 'function') updateAll();
    }
  },

  // ── Compound — advance this card's per-fight count (Sorcery sub-effect) ──
  // The scaled payoff lives on the card's MAIN effect via the compoundDmg /
  // compoundHits / compoundVal fields (dmg_conditional, apply_status), which
  // read ctx._compounded + ctx._compoundCount. The count is per-card-id, on
  // the actor (actor._compound), and resets each fight (fresh actor).
  compound_advance: {
    label:'[Compound]', cat:'keyword',
    desc:'Advance this card\'s per-fight Compound count; the card\'s effect scales with it.',
    fields:[{id:'show',label:'Display bonus',type:'text',default:''}],
    effectText: function(v){ return '[Compound] '+(v.show||''); },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor, cid = ctx.cardId;
      if(!actor || !cid) return;
      if(!actor._compound) actor._compound = {};
      actor._compound[cid] = (actor._compound[cid] || 0) + 1;
      ctx._compounded = true;
      ctx._compoundCount = actor._compound[cid];
    }
  },

  // ── Compound Hand (Hoot's Research Grant) — advance the Compound
  //    count of every card in hand (once per copy held). Does not make
  //    those cards "compounded" — they still scale only when played
  //    with their [Compound] Sorcery paid; this just pre-loads counts. ──
  compound_hand: {
    label:'[Compound] Hand', cat:'card_create',
    desc:'Advance the Compound count of every card in hand.',
    fields:[],
    effectText: function(v){ return '[Compound] all cards in hand.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || !actor.hand) return;
      if(!actor._compound) actor._compound = {};
      actor.hand.forEach(function(it){
        if(!it || !it.id) return;
        actor._compound[it.id] = (actor._compound[it.id] || 0) + 1;
      });
    }
  },

  // ── Vault Hoard (Shtole innate) — discard hand, fill with Ethereal
  //    Compounded copies of Shtole's Treasure ──
  vault_hoard: {
    label:'Vault Hoard', cat:'card_create',
    desc:'Discard the hand; create one Ethereal Compounded Treasure for each card discarded.',
    fields:[],
    effectText: function(v){ return 'Discard your hand. For each card discarded this way, create an [Ethereal] {{vault_keeper_treasure}}.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || !actor.hand) return;
      // Discard the entire hand (ghosts vanish; real cards to the discard
      // pile). Count discards so we make one Treasure per card discarded
      // — keeps the swap 1-for-1 instead of always topping up to HAND_SIZE.
      var discarded = 0;
      while(actor.hand.length){
        var it = actor.hand.pop();
        if(it && !it.ghost && actor.discardPile) actor.discardPile.push(it.id);
        discarded++;
      }
      // One Ethereal Compounded Treasure per card discarded this way.
      for(var i=0;i<discarded;i++){
        actor.hand.push({ id:'vault_keeper_treasure', ghost:true, _new:true, _compounded:true });
      }
      if(actor.side === 'player'){
        if(typeof renderHand === 'function') renderHand();
        if(typeof renderPiles === 'function') renderPiles();
      }
    }
  },




  // ── Buff Hand Attacks (M'bur's Whetstone) — stamp +damage on every
  //    attack card item in hand. Per-item, so it is consumed naturally
  //    when each card is played (the item is destroyed on play).
  //    resolveCardEffects reads item._dmgBuff. ──
  buff_hand_attacks: {
    label:'Buff Hand Attacks', cat:'modifier',
    desc:'Add damage to every attack card currently in hand (consumed on play).',
    fields:[{id:'amt',label:'Damage',type:'number',default:5}],
    effectText: function(v){ return 'Attack cards in hand: +'+(+v.amt||0)+' damage (next play).'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor || !actor.hand) return;
      var amt = +v.amt || 0;
      actor.hand.forEach(function(it){
        var c = CARDS[it.id];
        if(c && c.type === 'attack') it._dmgBuff = (it._dmgBuff || 0) + amt;
      });
      if(actor.side === 'player' && typeof renderHand === 'function') renderHand();
    }
  },

  // ── Temper Universals (M'bur's Tempered Edge passive) — idempotently
  //    give universal cards a "[Sorcery] [10]: Draw 1" cantrip. Run from
  //    an on_draw trigger; the source-check makes repeat runs a silent
  //    no-op so it only ever creates one mod. ──
  temper_universals: {
    label:'Temper Universals', cat:'modifier',
    desc:'Universal cards in hand gain a Draw-1 cantrip Sorcery.',
    fields:[],
    effectText: function(v){ return 'Universal cards gain [Sorcery] [10]: Draw 1.'; },
    // Suppress the innate-trigger card-text note entirely. The temper's
    // result is *already visible* on the affected card (the appended
    // [Sorcery] [10]: Draw 1 renders in the green mod layer). An "[On
    // draw]: Universal cards gain..." note on top just restates what
    // the card already shows. General principle: effects that MODIFY
    // the card don't need a trigger note; their result speaks for them.
    appliesToCard: function(){ return false; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor;
      if(!actor) return;
      if(!actor._cardMods) actor._cardMods = [];
      for(var i=0;i<actor._cardMods.length;i++){
        if(actor._cardMods[i].source === 'tempered_edge') return;
      }
      actor._cardMods.push({
        id:'tempered_edge', source:'tempered_edge',
        filter:{tag:'universal'}, where:'all', scope:'battle',
        changes:[{append_sorcery:{cost:10, effect:{type:'draw_cards',count:1}}}]
      });
    }
  },

  // ── Markup (the Merchant's innate) — on crit, conjure an escalating-
  //    crit copy of the card into the draw pile, flagged Banish (one
  //    play, then gone). actor._markupCopies tracks the pending copy's
  //    crit bonus; actorDraw stamps it onto the drawn hand item. ──
  markup_conjure: {
    label:'Markup', cat:'card_create',
    desc:'On crit: conjure a sharper Banish copy of the card into the deck.',
    fields:[],
    effectText: function(v){ return 'Conjure a [Banish] copy of the played card.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var actor = ctx.actor, cid = ctx.cardId;
      if(!actor || !cid) return;
      var card = CARDS[cid];
      if(!card) return;
      if(!actor._markupCopies) actor._markupCopies = {};
      var wasCopy = !!ctx._isMarkupCopy;
      // One copy of a card at a time — a base-card crit while a copy is
      // still circulating does not start a second chain.
      if(!wasCopy && actor._markupCopies[cid]) return;
      var baseCrit = _cardPrintedCrit(card);
      var sourceCrit = baseCrit + (+ctx._critSourceBonus || 0);
      var nextCrit = Math.min(100, sourceCrit * 2);
      var nextBonus = Math.max(0, nextCrit - baseCrit);
      actor._markupCopies[cid] = { critBonus: nextBonus, drawn:false };
      if(actor.drawPool) actor.drawPool.push(cid);
      addLog('Markup: a sharper copy of ' + (card.name||cid) + ' slips into the deck.', 'draw');
      if(actor.side === 'player' && typeof renderPiles === 'function') renderPiles();
    }
  },

  // ── Self Damage (Leona's Rigged Contract) — damage the card's holder. ──
  dmg_self: {
    label:'Self Damage', cat:'damage',
    desc:'Deal damage to this card\'s own holder.',
    fields:[{id:'amt',label:'Damage',type:'number',default:12}],
    effectText: function(v){ return 'Deal '+(+v.amt||0)+' damage to self.'; },
    typeHint:'attack',
    run: function(v,ctx){
      var amt = +v.amt || 0;
      var holder = ctx.actor;
      if(holder && typeof dealDamage === 'function'){
        dealDamage(holder, amt);
      } else if(holder){
        holder.hp = Math.max(0, holder.hp - amt);
      }
      addLog((ctx.cardName||'Rigged Contract')+' detonates — '+amt+' damage to its holder!', 'dmg');
    }
  },

  // ── Create Card In Deck (Leona's bombs) — place copies of a card into
  //    a target's draw pile. Draws are random, so no positioning needed. ──
  create_card_in_deck: {
    label:'Create Card In Deck', cat:'card_create',
    desc:'Place a card into a target\'s draw pile.',
    fields:[
      {id:'cardId', label:'Card ID', type:'text',   default:''},
      {id:'target', label:'Target',  type:'select', default:'opponent', options:['self','opponent']},
      {id:'count',  label:'Count',   type:'number', default:1}
    ],
    effectText: function(v){
      var n=+v.count||1;
      var hasCard=(typeof CARDS!=='undefined' && CARDS[v.cardId]);
      var nm=hasCard?'{{'+v.cardId+'}}':(v.cardId||'a card');
      return 'Create '+n+' '+nm+(n>1?'s':'')+' in '+(v.target==='self'?'your':'the opponent\'s')+' deck.';
    },
    typeHint:'utility',
    run: function(v,ctx){
      var cardId = v.cardId;
      if(!cardId || !CARDS[cardId]) return;
      var tgt = (v.target === 'opponent') ? ctx.opponent : ctx.actor;
      if(!tgt || !tgt.drawPool) return;
      var count = +v.count || 1;
      for(var i=0;i<count;i++){ tgt.drawPool.push(cardId); }
      addLog((CARDS[cardId].name||cardId)+' x'+count+' planted in '+(tgt.side==='player'?'your':'the enemy\'s')+' deck.', 'draw');
      if(typeof renderPiles === 'function') renderPiles();
    }
  },

  // ── Churn Both (Leona's Contract Killer) — both actors discard N from
  //    hand and draw N. Discarded cards with onDiscard (Rigged Contract)
  //    detonate, holder-aware. Self-contained — bypasses the legacy churn. ──
  churn_both: {
    label:'Churn Both', cat:'card_act',
    desc:'Both creatures discard N random cards and draw N.',
    fields:[{id:'count',label:'Count',type:'number',default:4}],
    effectText: function(v){ return 'Both creatures [Churn] '+(+v.count||4)+'.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var n = +v.count || 4;
      var actors = [];
      if(gs && gs.actors){
        if(gs.actors.player) actors.push(gs.actors.player);
        if(gs.actors.enemy)  actors.push(gs.actors.enemy);
      }
      actors.forEach(function(act){
        if(!act.hand || !act.drawPool) return;
        var discarded = 0;
        for(var i=0;i<n;i++){
          if(!act.hand.length) break;
          var ri = Math.floor(Math.random()*act.hand.length);
          var item = act.hand.splice(ri,1)[0];
          discarded++;
          var card = CARDS[item.id];
          var dctx = {
            actor: act, opponent: (typeof getOpponent==='function'?getOpponent(act):null),
            cardId: item.id, cardName: (card?card.name:item.id),
            str: act.str, agi: act.agi, wis: act.wis,
            pdmg: function(b){ return Math.max(1, Math.round(b)); },
            isEnemy: act.side === 'enemy'
          };
          // onDiscard echo (Rigged Contract detonation), holder-aware.
          if(card && card.onDiscard && card.onDiscard.length){
            card.onDiscard.forEach(function(eff){
              if(eff.type && EFFECT_TYPES[eff.type]) EFFECT_TYPES[eff.type].run(eff, dctx);
            });
          }
          if(typeof fireInnateTriggers === 'function') fireInnateTriggers(act, 'on_discard', dctx);
          // Non-ethereal cards return to the discard pile.
          if(!item.ghost && !item._banish) act.discardPile.push(item.id);
        }
        for(var d=0; d<discarded; d++){
          if(typeof actorDraw === 'function') actorDraw(act);
        }
      });
      if(typeof renderHand === 'function') renderHand();
      if(typeof renderPiles === 'function') renderPiles();
    }
  },

  // ── Bonus Hits (a Sorcery rider) — add hits to this card's attack.
  //    Sets ctx._bonusHits, read by dmg_conditional. Place the Sorcery
  //    FIRST in effects[] so it runs before the damage resolves. ──
  bonus_hits: {
    label:'Bonus Hits', cat:'damage',
    desc:'Add hits to this card\'s dmg_conditional attack.',
    fields:[{id:'amount',label:'Hits',type:'number',default:1}],
    effectText: function(v){ var n=+v.amount||1; return '+'+n+' hit'+(n!==1?'s':''); },
    typeHint:'attack',
    run: function(v,ctx){
      ctx._bonusHits = (ctx._bonusHits || 0) + (+v.amount || 0);
    }
  },

  // ── CONDITIONAL DAMAGE ─────────────────────────────







  // ── CONDITIONAL UTILITY ─────────────────────────────



  // ── ESCALATION ──────────────────────────────────────




}; // end EFFECT_TYPES

// ══════════════════════════════════════════════════════════════
// EFFECT_TYPES registry validator
// ══════════════════════════════════════════════════════════════
// Runs once at load. Logs to console any EFFECT_TYPE missing
// effectText() or run() — those produce blank cards / dead effects.
// Forward-looking contract: any new effect type MUST supply both.
// ══════════════════════════════════════════════════════════════
function validateEffectRegistry(){
  if(typeof EFFECT_TYPES === 'undefined') return;
  var missing = { effectText:[], run:[] };
  Object.keys(EFFECT_TYPES).forEach(function(k){
    var et = EFFECT_TYPES[k];
    if(!et) return;
    if(typeof et.effectText !== 'function') missing.effectText.push(k);
    if(typeof et.run !== 'function')        missing.run.push(k);
  });
  if(missing.effectText.length){
    console.warn('[card_effects] effectText missing on: '+missing.effectText.join(', '));
  }
  if(missing.run.length){
    console.warn('[card_effects] run missing on: '+missing.run.join(', '));
  }
  if(!missing.effectText.length && !missing.run.length){
    console.log('[card_effects] registry validated — '+Object.keys(EFFECT_TYPES).length+' effect types, all complete.');
  }
}
try { validateEffectRegistry(); } catch(e){ /* boot order: registry may not be reachable yet — ignore */ }

// ══════════════════════════════════════════════════════════════
// Card-text drift logger
// ══════════════════════════════════════════════════════════════
// For every card, generate text from its effects array and compare
// against the hand-written `effect:` field. Logs any divergence —
// the audit, but automated. Run after cards.js loads (setTimeout
// defers past the current synchronous script chain).
//
// Enabled by default in dev. To silence:
//   localStorage.setItem('fmtDriftLog', 'off')
// To force-run after disabling:
//   auditCardText()
// ══════════════════════════════════════════════════════════════
function auditCardText(){
  if(typeof CARDS === 'undefined' || typeof generateCardText !== 'function'){
    console.warn('[card-text-audit] CARDS or generateCardText unavailable — audit skipped');
    return;
  }
  var stripHtml = function(s){ return String(s||'').replace(/<[^>]+>/g, ''); };
  var norm      = function(s){ return stripHtml(s).replace(/\s+/g,' ').trim(); };
  var drifts = [];
  Object.keys(CARDS).forEach(function(id){
    var c = CARDS[id];
    if(!c || !c.effect || !c.effects) return; // skip cards without both
    var sections;
    try { sections = generateCardText(null, id, null); }
    catch(e){ drifts.push({id:id, err:e.message}); return; }
    if(!sections || !sections.length) return;
    var gen = sections.map(function(s){ return s.html||''; }).join(' ');
    var a = norm(gen);
    var b = norm(c.effect);
    if(a !== b) drifts.push({id:id, hand:b, gen:a});
  });
  if(!drifts.length){
    console.log('[card-text-audit] '+Object.keys(CARDS).length+' cards — no drift.');
    return;
  }
  console.group('[card-text-audit] '+drifts.length+' card(s) differ from generated text');
  drifts.forEach(function(d){
    if(d.err){ console.warn(d.id+' — generator error: '+d.err); return; }
    console.warn(d.id+'\n  hand: '+d.hand+'\n  gen:  '+d.gen);
  });
  console.groupEnd();
}
// Defer to next tick so cards.js has loaded and CARDS is populated.
// Skip entirely if the user has opted out.
setTimeout(function(){
  try {
    if(typeof localStorage !== 'undefined' && localStorage.getItem('fmtDriftLog') === 'off') return;
    auditCardText();
  } catch(e){ /* localStorage unavailable in some contexts — fine */ }
}, 200);

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
// Round 67s: unified, side-aware Frenzy. The status lives in
// gs.statusEffects[side]; tickStatuses() (game.js) decays it and the
// manabound purge collapses it — both already handle 'player' AND
// 'enemy'. The draw-speed knob differs per side: player drives
// gs.drawSpeedBonus (tracked via gs._frenzyDrawBonus), enemy drives
// the current enemy's _frenzyAtkMult. _applyFrenzy is the single
// entry point for both. (A lone numeric arg = player, for back-compat.)
function _applyFrenzy(side, stacks){
  if(typeof side === 'number'){ stacks = side; side = 'player'; }
  side = (side === 'enemy') ? 'enemy' : 'player';
  stacks = stacks || 1;
  var list = gs.statusEffects[side];
  if(!list) return;
  var e = list.find(function(s){ return s.id === 'frenzy'; });
  if(e){
    e.stacks = (e.stacks||1) + stacks;
  } else {
    e = { id:'frenzy', label:'Frenzy', cls:'buff', stat:'frenzy', stacks:stacks,
      remaining:0, maxRemaining:0, dot:false,
      desc:'Frenzy: +10% draw speed per stack. Duration shortens per stack. Manabound. Drains 3 mana/s.' };
    list.push(e);
  }
  // Duration: 3s base, each stack shortens the window (×0.9 per stack).
  var dur = Math.round(3000 * Math.pow(0.9, e.stacks - 1));
  e.remaining = dur; e.maxRemaining = dur;
  e.label = 'Frenzy \xd7' + e.stacks;
  _updateFrenzyBonus(side, e.stacks);
  _updateFrenzyTag(side, e.stacks);
  if(SETTINGS.logd !== 'brief') addLog('Frenzy \xd7' + e.stacks + '!', 'buff');
}

function _getFrenzyStacks(side){
  var list = gs.statusEffects[(side === 'enemy') ? 'enemy' : 'player'];
  var e = list && list.find(function(s){ return s.id === 'frenzy'; });
  return e ? (e.stacks||0) : 0;
}

function _updateFrenzyBonus(side, stacks){
  if(side === 'enemy'){
    var ce = gs.enemies && gs.enemies[gs.enemyIdx];
    if(ce) ce._frenzyAtkMult = 1 + stacks * 0.10;
    return;
  }
  // Player: replace the old frenzy portion of drawSpeedBonus cleanly.
  if(gs._frenzyDrawBonus) gs.drawSpeedBonus = Math.max(1,(gs.drawSpeedBonus||1) - gs._frenzyDrawBonus);
  gs._frenzyDrawBonus = stacks * 0.10;
  gs.drawSpeedBonus = (gs.drawSpeedBonus||1) + gs._frenzyDrawBonus;
}

function _clearFrenzy(side, reason){
  if(typeof side !== 'string' || (side !== 'player' && side !== 'enemy')){ reason = side; side = 'player'; }
  var list = gs.statusEffects[side];
  if(!list) return;
  var lbl = null;
  for(var i = list.length - 1; i >= 0; i--){
    if(list[i].id === 'frenzy'){ lbl = list[i].label; list.splice(i, 1); }
  }
  if(lbl === null) return;
  removeTagByLabel(side, lbl);
  if(side === 'enemy'){
    var ce = gs.enemies && gs.enemies[gs.enemyIdx];
    if(ce) ce._frenzyAtkMult = 1;
  } else {
    if(gs._frenzyDrawBonus){
      gs.drawSpeedBonus = Math.max(1,(gs.drawSpeedBonus||1) - gs._frenzyDrawBonus);
      gs._frenzyDrawBonus = 0;
    }
  }
  addLog('Frenzy collapsed' + (reason ? ' ('+reason+')' : '') + '!', 'debuff');
}

function _updateFrenzyTag(side, stacks){
  var tagSide = (side === 'enemy') ? 'enemy' : 'player';
  var el = document.getElementById(tagSide === 'enemy' ? 'e-tags' : 'p-tags');
  var lbl = 'Frenzy \xd7' + stacks;
  var tag = el && el.querySelector('[data-label^="Frenzy"]');
  var desc = 'Frenzy: +' + (stacks * 10) + '% draw speed. Manabound. Drains 3 mana/s.';
  if(tag){ tag.setAttribute('data-label', lbl); tag.textContent = lbl; }
  else { addTag(tagSide, 'buff', lbl, stacks, 'frenzy', desc); }
  var list = gs.statusEffects[tagSide];
  var e = list && list.find(function(s){ return s.id === 'frenzy'; });
  if(e) e.label = lbl;
}


// Fires when a card enters the discard pile without being played.
// Called from doDraw (hand overflow auto-play), forceAutoplay,
// discard_hand effect, and activateInnate (Starfall discards).
// Fires an [Echo]: runs card.onDiscard for the actor who owned the
// discarded card. `actor` is optional — defaults to gs.actors.player
// so legacy callers (player-side discards) keep working. The enemy
// churn branch passes ctx.actor explicitly so an enemy's [Echo]
// resolves in the enemy's frame (target:'self' = enemy hand, etc).
function handleCardDiscard(cardId, actor){
  var c = CARDS[cardId];
  if(!c || !c.onDiscard || !c.onDiscard.length) return;
  spawnEchoFloat(cardId);
  actor = actor || (gs.actors && gs.actors.player);
  if(!actor) return;
  var opponent = (typeof getOpponent === 'function') ? getOpponent(actor) : null;
  var ctx = {
    actor: actor,
    opponent: opponent,
    cardId: cardId,
    cardName: c.name,
    str: actor.str, agi: actor.agi, wis: actor.wis,
    pdmg: function(b){ return Math.max(1, b); },
    isGhost: false, critBonus: 0,
    isEnemy: actor.side === 'enemy',
  };
  c.onDiscard.forEach(function(eff){
    if(EFFECT_TYPES[eff.type]) EFFECT_TYPES[eff.type].run(eff, ctx);
  });
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
