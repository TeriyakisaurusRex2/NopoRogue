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
function resolveCardEffects(actor, cardId){
  var card = CARDS[cardId];
  if(!card) return {effects:[], crit:0, appendedEffects:[]};
  var mods = getCardMods(actor, cardId);
  if(mods.length === 0) return {effects:card.effects||[], crit:0, appendedEffects:[]};

  var resolved = JSON.parse(JSON.stringify(card.effects || []));
  var totalCrit = 0;
  var appended = [];

  for(var mi = 0; mi < mods.length; mi++){
    var changes = mods[mi].changes;
    for(var ci = 0; ci < changes.length; ci++){
      var ch = changes[ci];
      if(ch.field === 'crit'){
        totalCrit += (+ch.delta || 0);
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
          }
        }
      }
    }
  }
  return {effects: resolved, crit: totalCrit, appendedEffects: appended};
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
  convert_oldest_to:{cat:'card_act',order:5},
  sorcery:         {cat:'keyword',  order:11},
  hellbent:        {cat:'keyword',  order:10},
  // echo:         {cat:'keyword',  order:9},  // future
};

// Generate a single effect's display text with live values
function _effectLiveText(eff, actor, opponent){
  if(!eff || !eff.type) return '';
  var sv = function(v){ return '<span class="stat-val">'+v+'</span>'; };

  switch(eff.type){
    case 'dmg_conditional': {
      var base = +eff.base || 0;
      if(eff.stat && actor){
        var statVal = actor[eff.stat] || 0;
        base += Math.floor(statVal / (+eff.stat_div || 1));
      }
      var hits = +eff.hits || 1;
      var txt = 'Deal '+sv(hits > 1 ? base : base)+' damage';
      if(hits > 1) txt += ' × '+sv(hits)+' hits';
      // Condition text
      if(eff.condition){
        var condMet = false;
        if(actor){
          if(eff.condition === 'below_50_hp') condMet = actor.hp < actor.maxHp * 0.5;
          else if(eff.condition === 'has_debuff') condMet = opponent && opponent.statusEffects && opponent.statusEffects.some(function(s){return s.cls==='debuff';});
          else if(eff.condition === 'has_burn') condMet = opponent && opponent.statusEffects && opponent.statusEffects.some(function(s){return s.id==='burn';});
        }
        var condLabel = (eff.condition||'').replace(/_/g,' ');
        var bonusVal = +eff.on_true_val || 0;
        if(eff.on_true === 'bonus_dmg'){
          if(condMet) txt = 'Deal '+sv(base + bonusVal)+' damage'+(hits>1?' × '+sv(hits)+' hits':'') + ' ⚡';
          else txt += '. If '+condLabel+': '+sv(base + bonusVal);
        } else if(eff.on_true === 'crit'){
          txt += '. If '+condLabel+': [Crit] '+sv(bonusVal)+'%';
        }
      }
      return txt+'.';
    }

    case 'dmg_scaling': {
      var base = +eff.base || 0;
      var mult = +eff.mult || 1;
      var sourceVal = 0;
      var sourceLabel = '';
      var who = (eff.check === 'opponent') ? opponent : actor;
      if(who){
        switch(eff.source){
          case 'hand_size':    sourceVal = who.hand ? who.hand.length : 0; sourceLabel = 'cards in hand'; break;
          case 'discard_size': sourceVal = who.discardPile ? who.discardPile.length : 0; sourceLabel = 'discarded'; break;
          case 'missing_hp':   sourceVal = (who.maxHp||0) - (who.hp||0); sourceLabel = 'missing HP'; break;
          case 'shield':       sourceVal = who.shield || 0; sourceLabel = 'Shield'; break;
          case 'missing_mana': sourceVal = (who.maxMana||0) - (who.mana||0); sourceLabel = 'missing mana'; break;
          case 'cards_played': sourceVal = who.cardsPlayed || 0; sourceLabel = 'cards played'; break;
          case 'stat':
            var sn = eff.stat || 'str';
            sourceVal = Math.floor((who[sn]||0) / (+eff.stat_div||1));
            sourceLabel = sn.toUpperCase()+'÷'+(eff.stat_div||1);
            break;
        }
      }
      var total = base + (sourceVal * mult);
      return 'Deal '+sv(total)+' damage.';
    }

    case 'mana_burn': {
      var val = +eff.value || 0;
      if(eff.stat && eff.stat !== 'none' && actor){
        val += Math.floor((actor[eff.stat]||0) / (+eff.stat_div||4));
      }
      return 'Mana Burn '+sv(val)+'.';
    }

    case 'apply_status': {
      var val = +eff.value || 0;
      if(eff.stat && actor){
        val += Math.floor((actor[eff.stat]||0) / (+eff.stat_div||1));
      }
      var status = eff.status || '';
      var dur = eff.dur ? ' '+eff.dur+'s' : '';
      var tgt = eff.target === 'opponent' ? '' : ''; // context makes it clear
      
      // Format based on status type
      if(status === 'shield') return 'Gain '+sv(val)+' [Shield]'+dur+'.';
      if(status === 'haste') return '[Haste] '+sv(Math.round((+eff.value||0)*100))+'%'+dur+'.';
      if(status === 'poison') return 'Apply '+sv(val)+' [Poison]'+dur+'.';
      if(status === 'burn') return 'Apply '+sv(val)+' [Burn]'+dur+'.';
      if(status === 'weaken') return '[Weaken]'+dur+'.';
      if(status === 'slow') return '[Slow]'+dur+'.';
      if(status === 'thorns') return '[Thorns] '+sv(val)+dur+'.';
      if(status === 'dodge') return '[Dodge]'+dur+'.';
      if(status === 'frenzy') return '[Frenzy] '+sv(val)+dur+'.';
      return status.charAt(0).toUpperCase()+status.slice(1)+' '+sv(val)+dur+'.';
    }

    case 'cleanse': {
      var what = (eff.what||'all_debuffs').replace(/_/g,' ');
      var tgt = eff.target === 'both' ? '(both)' : eff.target === 'opponent' ? '(enemy)' : '';
      return 'Cleanse '+what+' '+tgt+'.';
    }

    case 'heal': return 'Heal '+sv(+eff.amt||0)+' HP.';

    case 'churn': return 'Churn '+sv(+eff.count||1)+'.';

    case 'churn_all_damage': {
      var handSize = actor && actor.hand ? actor.hand.length : '?';
      var perCard = +eff.dmgPerCard || 0;
      var total = (typeof handSize === 'number') ? handSize * perCard : '?';
      return 'Churn '+sv(handSize)+'. Deal '+sv(total)+' damage.';
    }

    case 'discard_own': {
      var cnt = eff.count === 'all' ? (actor && actor.hand ? actor.hand.length : 'all') : (+eff.count||1);
      return 'Discard '+sv(cnt)+'.';
    }

    case 'discard_random': return 'Discard '+sv(+eff.count||1)+' random.';

    case 'draw_cards': return 'Draw '+sv(+eff.count||1)+'.';

    case 'create_card_in_hand': {
      var card = CARDS[eff.cardId];
      var name = card ? card.name : eff.cardId;
      var tgt = eff.target === 'opponent' ? 'opponent\'s hand' : 'hand';
      return 'Create '+(eff.ghost?'Ethereal ':'')+name+' in '+tgt+'.';
    }

    case 'conjure_copy': return 'Conjure a copy of this card.';
    case 'purge_conjured': return 'Purge all conjured cards.';
    case 'copy_last_card': return 'Copy last played card.';
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
      if(eff.effect) inner = _effectLiveText(eff.effect, actor, opponent);
      if(eff.effects) inner = eff.effects.map(function(e){ return _effectLiveText(e, actor, opponent); }).join(' ');
      var costDisplay = eff.cost === 'all' ? 'all mana' : sv(+eff.cost||0);
      return '[Sorcery] '+costDisplay+': '+inner;
    }

    case 'hellbent': {
      var inner = eff.effect ? _effectLiveText(eff.effect, actor, opponent) : '';
      return '[Hellbent]: '+inner;
    }

    default: return eff.type + '.';
  }
}

// Generate full card display text from effects array
// Returns array of {layer, html} objects
function generateCardText(actor, cardId, item){
  var resolved = resolveCardEffects(actor, cardId);
  var allEffects = resolved.effects.concat(resolved.appendedEffects);
  var opponent = actor ? getOpponent(actor) : null;

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

  // Normal layer
  if(layers.normal.length){
    var lines = [];
    var critDelta = resolved.crit || 0;
    // Check for base crit on item
    if(item && item.critBonus) critDelta += item.critBonus;
    var hasDmg = layers.normal.some(function(e){ return e.type==='dmg_conditional'||e.type==='dmg_scaling'||e.type==='churn_all_damage'; });

    layers.normal.forEach(function(eff){
      var txt = _effectLiveText(eff, actor, opponent);
      if(txt) lines.push(txt);
    });

    // Append crit to damage line (inline)
    if(critDelta > 0 && hasDmg && lines.length > 0){
      lines[0] = lines[0].replace(/\.$/, '') + ' [Crit]: <span class="stat-val">'+critDelta+'%</span>.';
    }
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
      return _effectLiveText(eff, actor, opponent);
    }).filter(Boolean);
    if(sLines.length) sections.push({layer:'sorcery', html:sLines.join('<br>')});
  }

  return sections;
}

// Convenience: generate full HTML for card effect area
function generateCardTextHTML(actor, cardId, item){
  var sections = generateCardText(actor, cardId, item);
  return sections.map(function(s){ return s.html; }).join('<div class="card-layer-sep"></div>');
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
        options:['hand_size','discard_size','missing_hp','shield','missing_mana','cards_played','stat']},
      {id:'check',  label:'Read from', type:'select', default:'self', options:['self','opponent']},
      {id:'mult',   label:'Per unit',  type:'number', default:1},
      {id:'stat',   label:'Stat (if source=stat)', type:'select', default:'str', options:['str','agi','wis']},
      {id:'stat_div', label:'Stat divisor', type:'number', default:1, min:1}
    ],
    effectText: function(v){
      var sourceMap = {hand_size:'hand size',discard_size:'discard pile',missing_hp:'missing HP',
        shield:'[Shield]',missing_mana:'missing mana',cards_played:'cards played',
        stat:(v.stat||'STR').toUpperCase()+'÷'+(v.stat_div||1)};
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
        options:['shield','all_debuffs','all_buffs','poison','burn','weaken','slow','haste','frenzy','dodge','thorns','all']}
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
      {id:'mana_cost', label:'Mana cost', type:'number', default:0, min:0, max:100}
    ],
    effectText: function(v){ return (v.mana_cost ? '['+v.mana_cost+' mana] ' : '') + 'Create '+(v.ghost?'Ethereal ':'')+' card in '+(v.target||'self')+'\'s hand.'; },
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
      var newItem = { id: cardId, ghost: !!v.ghost, _new: true, _newDraw: true };
      tgt.hand.push(newItem);
      var c = CARDS[cardId];
      addLog((c.name||cardId)+' added to '+(tgt === actor ? 'hand' : tgt.creature.name+'\'s hand')+'.', 'draw');
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
    effectText: function(v){ return 'Discard '+(v.count==='all'?'entire hand':v.count+' card'+(+v.count>1?'s':''))+'.'; },
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
        options:['poison','burn','weaken','slow','haste','thorns','dodge','frenzy','shield']},
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

  // Deal damage per card in hand then discard entire hand (Wilt)

  // Corruption Spread: create an Ethereal Corrupt Spore in own hand (Bloom innate)

  // ── Shield / Damage utility effects ──────────────────────────

  // Gain Shield equal to a percentage of current HP (Hunker)

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

  // ── Drain a percentage of own max mana ──

  // ── Gain mana ──




  // ── CONDITIONAL DAMAGE ─────────────────────────────







  // ── CONDITIONAL UTILITY ─────────────────────────────



  // ── ESCALATION ──────────────────────────────────────




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
