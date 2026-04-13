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
  var e=gs.statusEffects.enemy.find(function(s){return s.id==='poison';});
  if(e){
    e.dpt+=dpt; e.remaining=Math.max(e.remaining,durMs||8000); e.maxRemaining=durMs||8000;
    removeTagByLabel('enemy',e.label);
    e.label='Poison ('+e.dpt+'/2s)';
    addTag('enemy','debuff',e.label,0,'dot','Poison: '+e.dpt+' dmg/2s. Bypasses Shield.');
  } else {
    gs.statusEffects.enemy.push({id:'poison',label:'Poison ('+dpt+'/2s)',cls:'debuff',stat:'dot',
      remaining:durMs||8000,maxRemaining:durMs||8000,dot:true,dpt:dpt,tickMs:2000,tickAcc:0,
      desc:'Poison: '+dpt+' dmg/2s. Bypasses Shield.'});
    addTag('enemy','debuff','Poison ('+dpt+'/2s)',0,'dot','Poison: '+dpt+' dmg/2s. Bypasses Shield.');
  }
}

// Stack-or-create Burn (3s tick, bypasses Shield)
function _applyBurn(dpt, durMs){
  var e=gs.statusEffects.enemy.find(function(s){return s.id==='burn';});
  if(e){
    e.dpt+=dpt; e.remaining=Math.max(e.remaining,durMs||9000);
    removeTagByLabel('enemy',e.label);
    e.label='Burn ('+e.dpt+'/3s)';
    addTag('enemy','debuff',e.label,0,'dot','Burn: '+e.dpt+' dmg/3s. Bypasses Shield.');
  } else {
    gs.statusEffects.enemy.push({id:'burn',label:'Burn ('+dpt+'/3s)',cls:'debuff',stat:'dot',
      remaining:durMs||9000,maxRemaining:durMs||9000,dot:true,dpt:dpt,tickMs:3000,tickAcc:0,
      desc:'Burn: '+dpt+' dmg/3s. Bypasses Shield.'});
    addTag('enemy','debuff','Burn ('+dpt+'/3s)',0,'dot','Burn: '+dpt+' dmg/3s. Bypasses Shield.');
  }
}

// Timed shield with optional on-expiry callback
function _applyShield(amt, durMs, onExpiry){
  gs.playerShield+=amt;
  addTag('player','shield','Shield ('+amt+')',null,null,'Absorbs '+amt+' direct damage. DoTs bypass this.');
  setTimeout(function(){
    if(!gs) return;
    gs.playerShield=Math.max(0,gs.playerShield-amt);
    removeTagsByClass('player','shield');
    if(onExpiry) onExpiry();
  }, durMs);
}

// ═══════════════════════════════════════════════════════
// EFFECT TYPES  —  single source of truth
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
      dealDamageToEnemy(d);
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

  // ── DEBUFFS ─────────────────────────────────────────

  slow: {
    label:'Apply [Slow]', cat:'debuff',
    desc:'Reduce enemy attack speed for a duration.',
    fields:[{id:'dur', label:'Duration (s)', type:'number', default:4, min:1, max:15}],
    effectText:  function(v){ return 'Apply [Slow] for '+v.dur+'s.'; },
    tooltipText: function(v){ return '[Slow]: enemy attack speed reduced by 40%.'; },
    typeHint:'debuff',
    run: function(v,ctx){
      applyStatus('enemy','debuff','Slow',-0.4,'atkspeed',(+v.dur)*1000,'Slow: atk speed -40%.');
      addLog(ctx.cardName+'! Slowed '+v.dur+'s.','debuff');
    }
  },

  cursed: {
    label:'Apply [Cursed]', cat:'debuff',
    desc:'Reduce enemy damage output.',
    fields:[{id:'dur', label:'Duration (s)', type:'number', default:5, min:1, max:20}],
    effectText:  function(v){ return 'Apply [Cursed] for '+v.dur+'s.'; },
    tooltipText: function(v){ return '[Cursed]: enemy deals 15% less damage.'; },
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
    effectText:  function(v){ return 'Apply [Marked] for '+v.dur+'s.'; },
    tooltipText: function(v){ return '[Marked]: enemy takes 50% more damage from all sources.'; },
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
    effectText:  function(v){ return 'Apply [Poison] ('+v.dpt+' dmg/2s) for '+v.dur+'s.'; },
    tooltipText: function(v){ return '[Poison]: deals damage every 2s. Bypasses [Shield].'; },
    typeHint:'debuff',
    run: function(v,ctx){
      _applyPoison(+v.dpt,(+v.dur)*1000);
      addLog(ctx.cardName+'! Poison +'+v.dpt+'/2s.','debuff');
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
    effectText:  function(v){ return 'Apply [Poison] ('+v.base+'+'+v.stat.toUpperCase()+'/'+v.div+' dmg/2s).'; },
    tooltipText: function(v){ return '[Poison]: deals damage every 2s. Bypasses [Shield].'; },
    typeHint:'debuff',
    run: function(v,ctx){
      var dpt=+v.base+Math.floor((ctx[v.stat]||0)/+v.div);
      _applyPoison(dpt,(+v.dur)*1000);
      addLog(ctx.cardName+'! Poison +'+dpt+'/2s.','debuff');
    }
  },

  burn: {
    label:'Apply [Burn]', cat:'debuff',
    desc:'Apply or stack Burn DoT. Ticks every 3s, bypasses Shield.',
    fields:[
      {id:'dpt', label:'Dmg per 3s',  type:'number', default:3, min:1, max:40},
      {id:'dur', label:'Duration (s)', type:'number', default:9, min:3, max:30}
    ],
    effectText:  function(v){ return 'Apply [Burn] ('+v.dpt+' dmg/3s) for '+v.dur+'s.'; },
    tooltipText: function(v){ return '[Burn]: deals damage every 3s. Bypasses [Shield].'; },
    typeHint:'debuff',
    run: function(v,ctx){
      _applyBurn(+v.dpt,(+v.dur)*1000);
      addLog(ctx.cardName+'! Burn +'+v.dpt+'/3s.','debuff');
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
    effectText:  function(v){ return 'Apply [Burn] ('+v.base+'+'+v.stat.toUpperCase()+'/'+v.div+' dmg/3s).'; },
    tooltipText: function(v){ return '[Burn]: deals damage every 3s. Bypasses [Shield].'; },
    typeHint:'debuff',
    run: function(v,ctx){
      var dpt=+v.base+Math.floor((ctx[v.stat]||0)/+v.div);
      _applyBurn(dpt,(+v.dur)*1000);
      addLog(ctx.cardName+'! Burn +'+dpt+'/3s.','debuff');
    }
  },

  poison_detonate: {
    label:'Detonate [Poison]', cat:'debuff',
    desc:'Burst all current Poison as instant damage (bypasses Shield).',
    fields:[
      {id:'reapply', label:'Reapply after?', type:'select', default:'no', options:['no','yes']},
      {id:'rdpt',    label:'Reapply dpt',    type:'number', default:4, min:1, max:20}
    ],
    effectText:  function(v){ return 'Detonate all [Poison] as instant damage.'+(v.reapply==='yes'?' Reapply ('+v.rdpt+'/2s).':''); },
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
    effectText:  function(v){ return 'Detonate all [Burn] as instant damage.'+(v.reapply==='yes'?' Reapply ('+v.rdpt+'/3s).':''); },
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
    tooltipText: function(v){ return '[Shield] absorbs direct damage before HP. DoTs bypass it.'; },
    typeHint:'defense',
    run: function(v,ctx){
      var amt=+v.amt, dur=(+v.dur)*1000, ev=+v.expiry_val;
      _applyShield(amt, dur, function(){
        if(v.onexpiry==='gain_mana'){ gs.mana=Math.min(gs.maxMana,gs.mana+ev); addLog('Shield expired — +'+ev+' mana.','mana'); }
        else if(v.onexpiry==='deal_dmg'){ dealDamageToEnemy(ev); addLog('Shield expired — '+ev+' dmg burst!','dmg'); }
      });
      addLog(ctx.cardName+'! Shield +'+amt+' for '+v.dur+'s.','buff');
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
    tooltipText: function(v){ return '[Shield] absorbs direct damage before HP. DoTs bypass it.'; },
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
    effectText:  function(v){ return 'Apply [Dodge].'; },
    tooltipText: function(v){ return '[Dodge]: next incoming attack is evaded.'; },
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
    effectText:  function(v){ return '[Drain] '+v.pct+'% of max mana.'; },
    tooltipText: function(v){ return '[Drain]: removes mana from your bar.'; },
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

  steal_mana: {
    label:'Steal Enemy Mana', cat:'utility',
    desc:'Temporarily reduce enemy mana pool.',
    fields:[
      {id:'amt', label:'Mana stolen', type:'number', default:20, min:5,  max:100},
      {id:'dur', label:'Duration (s)',type:'number', default:3,  min:1,  max:10}
    ],
    effectText:  function(v){ return 'Steal '+v.amt+' mana from enemy for '+v.dur+'s.'; },
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
    effectText:  function(v){ return 'Discard '+v.count+' random card'+(+v.count>1?'s':'')+' from hand.'; },
    tooltipText: function(v){ return 'Discarded cards return to your deck.'; },
    typeHint:'utility',
    run: function(v,ctx){
      var n=Math.min(+v.count,gs.hand.length);
      for(var i=0;i<n;i++){
        if(!gs.hand.length) break;
        var ri=Math.floor(Math.random()*gs.hand.length);
        var disc=gs.hand.splice(ri,1)[0];
        var dc=CARDS[disc.id];
        if(!disc.ghost){ gs.discardPile.push(disc.id); handleCardDiscard(disc.id); }
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
    effectText:  function(v){ return 'Triggers [Holy Flame].'; },
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
    effectText:  function(v){ return 'Deal '+v.base+' damage. If [Shield] is active: deal '+v.high+' instead.'; },
    tooltipText: function(v){ return '[Shield] absorbs direct damage before HP. DoTs bypass it.'; },
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
    effectText:  function(v){ return 'Deal '+v.base+' damage. If enemy is [Slowed]: deal '+v.high+' instead.'; },
    tooltipText: function(v){ return '[Slow]: enemy attack speed reduced by 40%.'; },
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
    effectText:  function(v){ return 'Deal '+v.base+' damage. If [Poison] is active: deal '+v.high+' instead.'; },
    tooltipText: function(v){ return '[Poison]: deals damage every 2s. Bypasses [Shield].'; },
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
    effectText:  function(v){ return 'Deal '+v.base+' damage. If [Burn] is active: deal '+v.high+' instead.'; },
    tooltipText: function(v){ return '[Burn]: deals damage every 3s. Bypasses [Shield].'; },
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
    effectText:  function(v){ return 'Deal '+v.base+' damage. If hand is full: deal '+v.high+' instead.'; },
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
    effectText:  function(v){ return 'Apply [Slow] for '+v.dur+'s. If already [Slowed]: extend to '+v.ext_dur+'s.'; },
    tooltipText: function(v){ return '[Slow]: enemy attack speed reduced by 40%.'; },
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
  }

}; // end EFFECT_TYPES


// ═══════════════════════════════════════════════════════
// DATA-DRIVEN DISPATCHER
// ═══════════════════════════════════════════════════════

function executeEffects(effects, pdmgFn, cardId, isAuto, isGhost, markedCrit){
  var s=gs.stats;
  var ctx={
    pdmg:pdmgFn, str:s.str, agi:s.agi, wis:s.wis,
    isAuto:isAuto, isGhost:isGhost, markedCrit:markedCrit,
    cardName:(CARDS[cardId]&&CARDS[cardId].name)||cardId
  };
  effects.forEach(function(e){
    var def=EFFECT_TYPES[e.type];
    if(def) def.run(e,ctx);
    else addLog('Unknown effect type: '+e.type,'sys');
  });
}

// Fires when a card enters the discard pile without being played.
// Called from doDraw (hand overflow auto-play), forceAutoplay,
// discard_hand effect, and activateInnate (Starfall discards).
function handleCardDiscard(cardId){
  var c=CARDS[cardId];
  if(!c||!c.onDiscard||!c.onDiscard.length) return;
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
      if(gs._spreadingSporesCount%3===0){ applyDoT('enemy','spread_poison',4,2000,6000,'Spreading Spores: 4/2s.'); addLog('Spreading Spores! Poison.','buff'); }
    }
    // Effigy — first card each battle refunds its mana cost
    if(gs._effigyFree){ gs._effigyFree=false; gs.mana=Math.min(gs.maxMana,gs.mana+(c&&c.manaCost||10)); addLog('Effigy: first card is free!','mana'); }
  }

  // Shadow Mark — consume nextCardCrit for non-ghost real cards
  var markedCrit=false;
  if(!isGhost&&gs.nextCardCrit&&id!=='ghost_shadow_mark'){
    markedCrit=true; gs.nextCardCrit=false; removeTagByLabel('player','Shadow Mark');
  }

  // Player damage multipliers
  function pdmg(base){
    var d=base;
    getStatuses('player','dmg').forEach(function(x){if(x.val>0)d=Math.round(d*(1+x.val));});
    getStatuses('enemy','death_mark').forEach(function(){d=Math.round(d*1.5);});
    if(markedCrit) d=Math.round(d*1.5);
    if(gs._bulwarkReady&&getStatus('player','shielded')){ d=Math.round(d*1.5); gs._bulwarkReady=false; removeTagByLabel('player','Bulwark'); }
    if(gs._shrinePredator&&gs.enemyHp>gs.enemyMaxHp*0.75) d=Math.round(d*(1+gs._shrinePredator));
    if(gs._shrineExecutioner&&gs.enemyHp<gs.enemyMaxHp*0.25) d=Math.round(d*(1+gs._shrineExecutioner));
    if(gs._shrineOpenVolley&&gs._shrineOpenVolleyUsed<gs._shrineOpenVolley){ d=d*2; gs._shrineOpenVolleyUsed=(gs._shrineOpenVolleyUsed||0)+1; }
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
  else if(id==='gr_gnaw'){
    // Time-based conditional: bonus damage if played within 2s of last card
    var gn=pdmg(4+Math.floor(agi/3));
    if(gs._lastCardTime&&(Date.now()-gs._lastCardTime)<2000) gn=pdmg(8);
    gs._lastCardTime=Date.now();
    dealDamageToEnemy(gn); addLog('Gnaw! '+gn+' dmg'+(gn>=pdmg(8)?' (fast bonus!)':'')+'.','dmg');
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
  else if(id==='nova_burst'){
    // hand-size scaling — needs gs.hand.length at runtime
    var hc=gs.hand.length; var novaDmg=Math.max(15,15*hc);
    dealDamageToEnemy(pdmg(novaDmg)); addLog('Nova Burst: '+hc+' cards \xd7 15 = '+novaDmg+' dmg.','dmg');
  }
  else if(id==='focus'){
    // drain% + draw combo; cost differs when auto-played
    var cost=isAuto?Math.round(gs.maxMana*0.4):Math.round(gs.maxMana*0.8);
    gs.mana=Math.max(0,gs.mana-cost); addLog('Focus: -'+cost+' mana, drawing 2 cards.','mana');
    doDraw(null,false); doDraw(null,false);
  }
  else if(id==='stellar_shards'){
    // discards other copies and adds one hit per discarded copy
    var shardsInHand=[];
    for(var si=gs.hand.length-1;si>=0;si--){
      if(gs.hand[si].id==='stellar_shards'&&!gs.hand[si].ghost) shardsInHand.push(gs.hand.splice(si,1)[0]);
    }
    var extraHits=shardsInHand.length;
    shardsInHand.forEach(function(sh){ gs.discardPile.push(sh.id); handleCardDiscard(sh.id); });
    var totalHits=3+extraHits;
    if(extraHits>0) addLog('Stellar Shards: discarded '+extraHits+' \u2014 '+totalHits+' hits!','innate');
    for(var shi=0;shi<totalHits;shi++){
      (function(delay){ setTimeout(function(){ if(!gs||!gs.running) return; dealDamageToEnemy(pdmg(7)); updateAll(); }, delay*300); })(shi);
    }
  }
  else if(id==='retribution'){
    // Condemned stacks — per-stack stateful tracking
    var hasDebuff=gs.statusEffects.enemy.some(function(x){return x.cls==='debuff';});
    var condemnedStacks=gs.statusEffects.enemy.filter(function(x){return x.stat==='condemned';}).length;
    var condemnedMult=1+(condemnedStacks*0.15);
    var baseDmg=hasDebuff?30:15;
    dealDamageToEnemy(pdmg(Math.round(baseDmg*condemnedMult)));
    if(hasDebuff) addLog('Retribution: '+Math.round(baseDmg*condemnedMult)+' dmg'+(condemnedStacks?' (\xd7'+condemnedStacks+' Condemned)':'')+'!','innate');
    if(condemnedStacks<5){
      var ns=condemnedStacks+1; var tl='Condemned \xd7'+ns;
      var td='Condemned '+ns+'/5: Retribution deals +'+(15*ns)+'% more damage.';
      gs.statusEffects.enemy.push({id:'condemned_'+ns,label:'Condemned',cls:'debuff',stat:'condemned',remaining:12000,maxRemaining:12000,dot:false,desc:td});
      removeTagByLabel('enemy','Condemned \xd7'+condemnedStacks); if(condemnedStacks===0) removeTagByLabel('enemy','Condemned');
      addTag('enemy','debuff',tl,0,'condemned',td); addLog('Condemned \xd7'+ns+'/5.','debuff'); triggerHolyFlame();
    }
  }
  else if(id==='holy_shield'){
    // Sets holyShieldActive flag used by dealDamageToPlayer
    gs.holyShieldActive=true;
    applyStatus('player','buff','Shielded',0,'',5000,'Holy Shield: 80% of dmg drains mana instead of HP for 5s.');
    addLog('Aegis! Incoming damage drains mana for 5s.','buff');
    setTimeout(function(){ if(gs){ gs.holyShieldActive=false; removeTagByLabel('player','Shielded'); } },5000);
    triggerHolyFlame();
  }
  else if(id==='bulwark'){
    // Sets _bulwarkReady which is read inside pdmg() itself
    applyStatus('player','buff','Shielded',0,'shielded',8000,'Shielded: incoming dmg drains mana instead of HP.');
    gs._bulwarkReady=true; addLog('Bulwark! Shielded 8s \u2014 next hit +50%.','buff');
    addTag('player','buff','Bulwark',0,'','Bulwark: next hit deals +50% damage.'); triggerHolyFlame();
  }
  else if(id==='judgment'){
    // Counts active debuffs, conditionally stacks Condemned
    var debuffCount=gs.statusEffects.enemy.filter(function(s){return s.cls==='debuff';}).length;
    var jDmg=debuffCount>=3?40:20; dealDamageToEnemy(pdmg(jDmg));
    if(debuffCount>=3){
      var cond=gs.statusEffects.enemy.find(function(s){return s.id==='condemned';}); var cStacks=cond?Math.min(5,(cond.stacks||1)+1):1;
      if(cond){ cond.stacks=cStacks; cond.remaining=12000; removeTagByLabel('enemy','Condemned'); }
      else gs.statusEffects.enemy.push({id:'condemned',label:'Condemned \xd7'+cStacks,cls:'debuff',stat:'condemned',remaining:12000,maxRemaining:12000,stacks:cStacks,desc:'Condemned: Retribution +'+(cStacks*15)+'% extra damage.'});
      addTag('enemy','debuff','Condemned \xd7'+cStacks,0,'condemned','Condemned: Retribution +'+(cStacks*15)+'% damage.');
      addLog('JUDGMENT! '+jDmg+' dmg \u2014 Condemned \xd7'+cStacks+'!','innate');
    } else { addLog('Judgment! '+jDmg+' dmg ('+debuffCount+'/3 debuffs \u2014 no Condemned).','dmg'); }
  }
  else if(id==='quick_slash'){
    // Own crit chance decoupled from Shadow Mark
    var qsDmg=pdmg(10+Math.floor(agi/5)*5); var qsCrit=markedCrit||Math.random()<0.15;
    if(qsCrit){ qsDmg=Math.round(qsDmg*2); spawnFloatNum('enemy','CRIT!',false,'crit-num'); addLog('Quick Slash CRIT'+(markedCrit?' (Shadow Mark)':'')+'! '+qsDmg+' dmg!','innate'); }
    dealDamageToEnemy(qsDmg);
  }
  else if(id==='backstab'){
    // Debuff-check with dramatically different tiers (12 vs 45)
    var bsHasD=gs.statusEffects.enemy.some(function(x){return x.cls==='debuff';});
    var bsDmg=pdmg(bsHasD?45:12); dealDamageToEnemy(bsDmg);
    if(markedCrit){ spawnFloatNum('enemy','CRIT!',false,'crit-num'); addLog('Backstab CRIT (Shadow Mark)! '+bsDmg+' dmg!','innate'); }
    else if(!bsHasD) addLog('No debuff \u2014 Backstab weakened!','debuff');
  }
  else if(id==='shadow_step'){
    gs.playerDodge=true; addTag('player','buff','Dodge',null,null,'Next incoming attack will be completely evaded.');
    gs.mana=Math.min(gs.maxMana,gs.mana+50); addLog('Shadow Step! Dodge ready, +50 mana.','buff');
  }
  else if(id==='poison_dart'){
    // Crit → full detonate combo with complex re-poison logic
    var pdEntry=gs.statusEffects.enemy.find(function(s){return s.id==='poison';});
    if(pdEntry){ pdEntry.dpt+=8; pdEntry.remaining=8000; pdEntry.maxRemaining=8000; removeTagByLabel('enemy',pdEntry.label); pdEntry.label='Poison ('+pdEntry.dpt+'/2s)'; addTag('enemy','debuff',pdEntry.label,0,'dot','Poison: '+pdEntry.dpt+' dmg/2s.'); addLog('Poison Dart! Poison now '+pdEntry.dpt+' dmg/2s.','debuff'); }
    else{ gs.statusEffects.enemy.push({id:'poison',label:'Poison (8/2s)',cls:'debuff',stat:'dot',remaining:8000,maxRemaining:8000,dot:true,dpt:8,tickMs:2000,tickAcc:0,desc:'Poison: 8 dmg/2s.'}); addTag('enemy','debuff','Poison (8/2s)',0,'dot','Poison: 8 dmg/2s.'); addLog('Poison Dart! Enemy poisoned (8 dmg/2s).','debuff'); }
    if(markedCrit||Math.random()<0.15){
      var pdPop=gs.statusEffects.enemy.find(function(s){return s.id==='poison';}); var burstDmg=pdPop?pdPop.dpt:8;
      if(pdPop){ gs.statusEffects.enemy.splice(gs.statusEffects.enemy.indexOf(pdPop),1); removeTagByLabel('enemy',pdPop.label); }
      if(burstDmg>0){ gs.enemyHp=Math.max(0,gs.enemyHp-burstDmg); shakeIcon('enemy',false); flashHpBar('enemy','hp-flash-red'); spawnFloatNum('enemy','VENOM! -'+burstDmg,burstDmg>=30,'crit-num'); addLog('Poison Dart CRIT'+(markedCrit?' (Shadow Mark)':'')+'! Venom Burst \u2014 '+burstDmg+' instant damage!','innate'); updateAll(); checkEnd(); }
    }
  }
  else if(id==='ghost_shadow_mark'){
    // Applies poison AND sets the nextCardCrit flag — two coupled effects
    _applyPoison(16,8000); gs.nextCardCrit=true;
    applyStatus('player','buff','Shadow Mark',0,'shadow_mark',30000,'Next card is guaranteed to [Crit].'); addLog('\u2756 Shadow Mark! +16 Poison applied. Next card CRITS.','innate');
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
  else if(id==='gr_frenzy_bite'){
    // Permanently mutates drawIntervalBase (per-run stat)
    dealDamageToEnemy(pdmg(6)); if(!gs._frenzyBiteStacks) gs._frenzyBiteStacks=0;
    if(gs._frenzyBiteStacks<5){ gs._frenzyBiteStacks++; gs.drawIntervalBase=Math.max(500,(gs.drawIntervalBase||2000)*0.97); }
    addLog('Frenzy Bite! 6 dmg + draw interval -3% (\xd7'+gs._frenzyBiteStacks+').','buff');
  }
  else if(id==='mc_mycelium'){
    // Sets _myceliumBurst flag read by the Spreading Spores innate loop
    gs.mana=Math.min(gs.maxMana,gs.mana+30); gs._myceliumBurst=true;
    addTag('player','buff','Mycelium Charge',0,'','Next Spreading Spores trigger: 10 Poison burst instead of DoT.'); addLog('Mycelium Net! +30 mana, next Spores trigger bursts.','buff');
  }
  else if(id==='drifting_comet'){
    // Different behaviour when auto-played vs played manually
    if(isAuto){ stunEnemy(800); addLog('Drifting Comet stuns! (auto-played)','innate'); }
    else dealDamageToEnemy(pdmg(16));
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
    existing.label=newLabel; addTag('enemy','debuff',newLabel,0,'dot','Holy Flame: '+existing.dpt+' dmg/3s ('+stacks+' stacks)'); addLog('Holy Flame: Burn \xd7'+stacks+' ('+existing.dpt+' dmg/3s).','innate');
  } else {
    var label1='Holy Burn \xd71'; var desc1='Holy Flame: '+burnDmg+' dmg/3s (1 stack)';
    gs.statusEffects.enemy.push({id:'holy_burn',label:label1,cls:'debuff',stat:'dot',remaining:12000,maxRemaining:12000,dot:true,dpt:burnDmg,tickMs:3000,tickAcc:0,desc:desc1});
    addTag('enemy','debuff',label1,0,'dot',desc1); addLog('Holy Flame: Burn \xd71 ('+burnDmg+' dmg/3s).','innate');
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
  if(gs.champId==='druid'){
    var hl=gs.hand.length; if(hl===0){ addLog('No cards in hand for Starfall!','innate'); gs.mana+=ch.innateCost; return; }
    var dmg=hl*3; dealDamageToEnemy(dmg); addLog('\u2756 STARFALL! '+hl+' \xd7 3 = '+dmg+' dmg!','innate');
    var half=Math.floor(hl/2);
    for(var i=0;i<half;i++){
      if(gs.hand.length===0) break;
      var ri=Math.floor(Math.random()*gs.hand.length); var disc=gs.hand.splice(ri,1)[0]; var dc=CARDS[disc.id];
      addLog('Discarded '+(dc?dc.name:disc.id)+'.','draw');
      if(!disc.ghost){ gs.discardPile.push(disc.id); handleCardDiscard(disc.id); }
    }
  } else if(gs.champId==='thief'){
    doDraw('ghost_shadow_mark',false); addLog('\u2756 SHADOW MARK! A spectral card appears in hand.','innate');
  }
  updateAll(); renderHand(); renderPiles(); checkEnd();
}
