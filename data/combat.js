// ════════════════════════════════════════════════════════════════
// COMBAT.JS — Unified Combat System
// ════════════════════════════════════════════════════════════════
//
// This file implements the symmetrical combat architecture.
// A creature is a creature regardless of which side it fights on.
// All logic uses CombatActor objects — no isEnemy checks.
//
// Dependencies: CREATURES, CARDS, EFFECT_TYPES (from other files)
// ════════════════════════════════════════════════════════════════


// ── LAYER 1: COMBAT ACTOR ─────────────────────────────────────

function createActor(creatureId, level, side) {
  var c = CREATURES[creatureId];
  if (!c) { console.error('createActor: unknown creature ' + creatureId); return null; }

  var str = Math.round(c.baseStats.str + (level - 1) * c.growth.str);
  var agi = Math.round(c.baseStats.agi + (level - 1) * c.growth.agi);
  var wis = Math.round(c.baseStats.wis + (level - 1) * c.growth.wis);
  var maxHp  = str * 5;
  var maxMana = calcMaxMana(wis);
  var manaRegen = calcManaRegen(wis);

  // Build deck
  var deckIds = buildCreatureDeck(c, str);

  return {
    // Identity
    id: creatureId,
    creature: c,
    side: side || 'player',
    level: level,

    // Core stats
    str: str, agi: agi, wis: wis,

    // Resources
    hp: maxHp, maxHp: maxHp,
    mana: 0,
    maxMana: maxMana,
    manaRegen: manaRegen,
    manaAccum: 0,
    shield: 0,

    // Card zones
    hand: [],
    drawPool: deckIds.slice().sort(function(){ return Math.random() - 0.5; }),
    discardPile: [],

    // Draw system
    drawInterval: calcDrawInterval(agi),
    drawTimer: 0,
    drawSpeedMult: 1.0,

    // Status effects
    statusEffects: [],

    // Innate
    innateCooldown: 0,

    // Frenzy
    frenzyStacks: 0,

    // Tracking
    cardsPlayed: 0,
    lastCardPlayed: null,

    // Flags
    dodge: false,
    conjuredCount: 0,
    shadowMarkActive: false,
    nextCardCrit: false,

    // Card modification system
    _cardMods: [],

    // Aura system — resolution-time modifiers from innates/relics
    // Populated by processAuras() in gameTick
    auras: {},
    _activeAuraIds: [],
  };
}


// Get the opposing actor
function getOpponent(actor) {
  if (!gs || !gs.actors) return null;
  return actor.side === 'player' ? gs.actors.enemy : gs.actors.player;
}


// ── LAYER 5: DAMAGE & STATUS ROUTING ──────────────────────────
//
// All damage flows through dealDamage(). Effects never call
// dealDamageToEnemy/dealDamageToPlayer directly.

function dealDamage(target, dmg, options) {
  options = options || {};
  if (!target || !gs || !gs.running) return 0;

  var origDmg = dmg;
  var source = getOpponent(target);

  // Dodge check
  if (target.dodge && !options.isDot && !options.isThorns) {
    target.dodge = false;
    removeTagsByClass(target.side, 'dodge');
    spawnFloatNum(target.side, 'DODGE!', false, 'dodge-num');
    addLog(target.creature.name + ' dodges!', 'buff');
    return 0;
  }

  // Shield absorption (DoTs bypass shield)
  if (target.shield > 0 && !options.bypassShield && !options.isDot) {
    var absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) {
      spawnFloatNum(target.side, '🛡 ' + absorbed, false, 'block-num');
      addLog('Shield absorbs ' + absorbed + '.', 'buff');
    }
    // Shield depleted — remove status + tag
    if (target.shield <= 0) {
      target.shield = 0;
      removeTagsByClass(target.side, 'shield');
      for (var si = target.statusEffects.length - 1; si >= 0; si--) {
        if (target.statusEffects[si].id === 'shield') {
          if (typeof target.statusEffects[si]._onExpiry === 'function') {
            target.statusEffects[si]._onExpiry();
          }
          target.statusEffects.splice(si, 1);
        }
      }
    }

    // Fire on_hit_while_shielded triggers (even if shield absorbed all damage)
    if (!options.isThorns && !options.isDot) {
      fireInnateTriggers(target, 'on_hit_while_shielded', {
        actor: target,
        opponent: source,
        pdmg: function(b) { return Math.max(1, b); }
      });
    }
  }

  // Apply damage to HP
  dmg = Math.max(0, dmg);

  // Fire on_pre_damage triggers (can modify dmg before HP reduction)
  if (dmg > 0 && !options.isDot && !options.isThorns) {
    var preDmgCtx = {
      actor: target,
      opponent: source,
      pdmg: function(b) { return Math.max(1, b); },
      _incomingDmg: dmg
    };
    fireInnateTriggers(target, 'on_pre_damage', preDmgCtx);
    // Check if triggers modified the damage
    if (typeof preDmgCtx._modifiedDmg === 'number') {
      dmg = Math.max(0, preDmgCtx._modifiedDmg);
    }
  }

  target.hp = Math.max(0, target.hp - dmg);

  // Undying: survive lethal damage once
  if (target.hp <= 0 && target.creature && target.creature.innate
      && target.creature.innate.id === 'undying' && !target._undyingUsed) {
    target._undyingUsed = true;
    target.hp = 1;
    spawnFloatNum(target.side, 'UNDYING!', false, 'crit-num');
    addLog(target.creature.name + ' refuses to die! Survives at 1 HP.', 'innate');
  }

  // Thorns reflect (only from card damage — not DoTs, not Thorns itself)
  if (dmg > 0 && !options.isThorns && !options.isDot) {
    var thorns = target.statusEffects.find(function(s) { return s.stat === 'thorns'; });
    if (thorns && thorns.val > 0 && source) {
      dealDamage(source, thorns.val, { isThorns: true });
      spawnFloatNum(source.side, '🦔' + thorns.val, false, 'crit-num');
      addLog('[Thorns] reflects ' + thorns.val + ' damage!', 'buff');
    }
  }

  // Fire on_hit triggers on the target
  if (dmg > 0 && !options.isThorns) {
    fireInnateTriggers(target, 'on_hit', {
      actor: target,
      opponent: source,
      pdmg: function(b) { return Math.max(1, b); }
    });
  }

  // Visual feedback
  if (dmg > 0) {
    spawnFloatNum(target.side, '-' + dmg, dmg >= 50);
    shakeIcon(target.side, false);
    flashHpBar(target.side, 'hp-flash-red');
    addLog(target.creature.name + ' takes ' + dmg + ' dmg! (' + target.hp + '/' + target.maxHp + ' HP)', 'dmg');
  } else if (origDmg > 0 && dmg === 0 && target.shield === 0) {
    spawnFloatNum(target.side, 'BLOCKED', false, 'block-num');
  }

  // Sync HP/shield back to gs so old rendering code sees the change
  if (target.side === 'player') {
    gs.playerHp = target.hp;
    gs.playerShield = target.shield;
  } else {
    gs.enemyHp = target.hp;
    gs.enemyShell = target.shield;
  }
  updateAll(); checkEnd();

  return dmg;
}


// Apply shield to an actor
function actorApplyShield(actor, amt, durMs) {
  actor.shield += amt;

  var existing = actor.statusEffects.find(function(s) { return s.id === 'shield'; });
  if (existing) {
    existing.remaining = Math.max(existing.remaining, durMs);
    existing.maxRemaining = Math.max(existing.maxRemaining, durMs);
    existing.label = 'Shield (' + actor.shield + ')';
    removeTagsByClass(actor.side, 'shield');
  } else {
    actor.statusEffects.push({
      id: 'shield', label: 'Shield (' + actor.shield + ')', cls: 'shield', stat: 'shield',
      remaining: durMs, maxRemaining: durMs,
      desc: 'Shield: absorbs ' + actor.shield + ' direct damage.'
    });
  }
  addTag(actor.side, 'shield', 'Shield (' + actor.shield + ')', null, 'shield',
    'Shield: absorbs ' + actor.shield + ' direct damage.');
}


// Apply a status effect to an actor
function actorApplyStatus(actor, statusDef) {
  // statusDef: {id, label, cls, stat, val, remaining, maxRemaining, dot, dpt, tickMs, desc, ...}
  var existing = actor.statusEffects.find(function(s) { return s.id === statusDef.id; });
  if (existing) {
    // Refresh duration (don't stack most statuses — just refresh)
    existing.remaining = Math.max(existing.remaining, statusDef.remaining || 0);
    existing.maxRemaining = Math.max(existing.maxRemaining, statusDef.maxRemaining || 0);
    if (statusDef.val !== undefined) existing.val = statusDef.val;
    if (statusDef.label) {
      removeTagByLabel(actor.side, existing.label);
      existing.label = statusDef.label;
    }
  } else {
    actor.statusEffects.push(Object.assign({}, statusDef));
  }
  addTag(actor.side, statusDef.cls || 'buff', statusDef.label,
    statusDef.val || null, statusDef.stat || statusDef.id,
    statusDef.desc || '');
}


// ── DRAW ────────────────────────────────────────────────────────
// Single draw function for both player and enemy.
// Called by: doDraw (timer), churn redraw, draw_cards effect, actorDraw itself
//
// Parameters:
//   actor      — the actor drawing (player or enemy)
//   overrideId — force a specific card ID (for ghost/conjured draws)
//   silent     — skip log/animation (used during batch operations)
//
// Returns: drawn card ID, or null if nothing to draw.

function actorDraw(actor, overrideId, silent) {
  // ── Reshuffle if draw pool empty ──
  if (actor.drawPool.length === 0) {
    if (actor.discardPile.length === 0) return null;
    actor.drawPool = actor.discardPile.slice();
    // Shuffle (Fisher-Yates)
    for (var si = actor.drawPool.length - 1; si > 0; si--) {
      var sj = Math.floor(Math.random() * (si + 1));
      var tmp = actor.drawPool[si];
      actor.drawPool[si] = actor.drawPool[sj];
      actor.drawPool[sj] = tmp;
    }
    actor.discardPile = [];
    if (!silent) {
      addLog(actor.creature.name + '\'s deck reshuffles.', 'draw');
      if (actor.side === 'player' && typeof playCardShuffleSfx === 'function') playCardShuffleSfx();
    }
  }

  // ── Draw a card ──
  var drawnId;
  if (overrideId) {
    drawnId = overrideId;
    // Remove from pool if present (for non-ghost overrides)
    var idx = actor.drawPool.indexOf(overrideId);
    if (idx !== -1) actor.drawPool.splice(idx, 1);
  } else {
    if (actor.drawPool.length === 0) return null;
    var ix = Math.floor(Math.random() * actor.drawPool.length);
    drawnId = actor.drawPool.splice(ix, 1)[0];
  }
  if (!drawnId) return null;

  // ── Build hand item ──
  var isGhost = !!overrideId; // override draws are ghost cards
  var newItem = { id: drawnId, ghost: isGhost, _new: true };

  // Conjured marking — if conjured copies exist and this is the conjured card
  if (!isGhost && actor.conjuredCount > 0 && gs._conjuredCardId && drawnId === gs._conjuredCardId) {
    newItem._conjured = true;
  }

  // Shadow Mark: attack cards get guaranteed crit
  if (actor.shadowMarkActive && !isGhost) {
    var drawnCard = CARDS[drawnId];
    if (drawnCard && drawnCard.type === 'attack') {
      newItem.critBonus = 100;
    }
  }

  // Pending crit bonus (from Sorcery effects like Wolf Howl)
  if (actor._pendingCritBonus && !isGhost) {
    var drawnCard2 = CARDS[drawnId];
    if (drawnCard2 && drawnCard2.type === 'attack') {
      newItem.critBonus = (newItem.critBonus || 0) + actor._pendingCritBonus;
    }
    actor._pendingCritBonus = 0;
  }

  // ── Draw lock + stagger (player only) ──
  if (actor.side === 'player') {
    if (!window._drawStaggerAcc) window._drawStaggerAcc = 0;
    var now = Date.now();
    if (!window._drawStaggerLast || now - window._drawStaggerLast > 300) {
      window._drawStaggerAcc = 0;
    }
    window._drawStaggerLast = now;
    var staggerDelay = window._drawStaggerAcc;
    window._drawStaggerAcc += 80;
    var animDuration = 400;
    newItem._newDraw = true;
    newItem._drawLock = now + staggerDelay + animDuration;
    newItem._arriveAt = now + staggerDelay + animDuration;
  }

  // ── Add to hand ──
  actor.hand.push(newItem);

  // ── Overflow: auto-play oldest when over capacity ──
  var maxHand = HAND_SIZE || 7;
  while (actor.hand.length > maxHand) {
    if (!silent) {
      var oc = CARDS[actor.hand[0].id];
      addLog('Auto-played ' + (oc ? oc.name : actor.hand[0].id) + '.', 'draw');
    }
    playCardForActor(actor, 0);
    if (!gs || !gs.running) return null;
  }

  // ── Visual + audio (player only) ──
  if (!silent && actor.side === 'player') {
    var c = CARDS[drawnId];
    addLog('Drew ' + (c ? c.name : drawnId) + (isGhost ? ' [Ghost]' : '') + '.', 'draw');
    if (typeof playCardDrawSfx === 'function') playCardDrawSfx();
    var delay = (typeof staggerDelay !== 'undefined') ? staggerDelay : 0;
    if (delay > 0) {
      (function(id, d) { setTimeout(function() { spawnDrawAnim(id, 'deck'); }, d); })(drawnId, delay);
    } else {
      spawnDrawAnim(drawnId, 'deck');
    }
  }

  // ── Fire on_draw triggers ──
  fireInnateTriggers(actor, 'on_draw', {
    actor: actor,
    opponent: getOpponent(actor),
    pdmg: function(b) { return Math.max(1, b); },
    cardId: drawnId
  });

  return drawnId;
}


// Discard a card from an actor's hand (by index)
function actorDiscard(actor, handIndex, silent) {
  if (handIndex < 0 || handIndex >= actor.hand.length) return null;
  var item = actor.hand.splice(handIndex, 1)[0];
  var cardId = item.id;

  if (!item.ghost) {
    actor.discardPile.push(cardId);

    // Fire echo (onDiscard) effects
    var card = CARDS[cardId];
    if (card && card.onDiscard && card.onDiscard.length > 0) {
      var opponent = getOpponent(actor);
      var echoCtx = {
        actor: actor,
        opponent: opponent,
        cardId: cardId,
        cardName: card.name,
        str: actor.str, agi: actor.agi, wis: actor.wis,
        pdmg: function(b) { return Math.max(1, b); },
        isGhost: false, critBonus: 0,
      };
      card.onDiscard.forEach(function(eff) {
        if (EFFECT_TYPES[eff.type]) {
          EFFECT_TYPES[eff.type].run(eff, echoCtx);
        }
      });
      spawnEchoFloat(cardId);
      addLog('[Echo] ' + card.name + ' triggered!', 'draw');
    }

    // Fire on_discard triggers
    fireInnateTriggers(actor, 'on_discard', {
      actor: actor,
      opponent: getOpponent(actor),
      pdmg: function(b) { return Math.max(1, b); },
      cardId: cardId
    });
  }

  if (!silent) {
    spawnCardFloat(cardId, 'discard');
  }

  return item;
}


// Tick one actor's systems (called every frame, ms = elapsed)
function tickActor(actor, ms) {
  if (!actor || actor.hp <= 0) return;

  // Mana regen
  actor.manaAccum += actor.manaRegen * ms / 1000;
  var manaGain = Math.floor(actor.manaAccum);
  if (manaGain >= 1) {
    actor.manaAccum -= manaGain;
    actor.mana = Math.min(actor.maxMana, actor.mana + manaGain);
  }

  // Frenzy mana drain (3/s per stack)
  if (actor.frenzyStacks > 0) {
    var frenzyDrain = 3 * actor.frenzyStacks * ms / 1000;
    actor.mana = Math.max(0, actor.mana - frenzyDrain);
  }

  // Draw timer
  var interval = actor.drawInterval / actor.drawSpeedMult;
  actor.drawTimer += ms;
  if (actor.drawTimer >= interval) {
    actor.drawTimer = 0;
    actorDraw(actor, null, false);
  }

  // Status effect tick (timers, DoTs)
  tickActorStatuses(actor, ms);

  // Innate cooldown
  if (actor.innateCooldown > 0) {
    actor.innateCooldown = Math.max(0, actor.innateCooldown - ms);
  }

  // Manabound check
  if (actor.mana <= 0) {
    checkActorManabound(actor);
  }
}


// Tick status effects for one actor
function tickActorStatuses(actor, ms) {
  for (var i = actor.statusEffects.length - 1; i >= 0; i--) {
    var s = actor.statusEffects[i];

    // DoT tick
    if (s.dot && s.dpt) {
      s.tickAcc = (s.tickAcc || 0) + ms;
      var tickMs = s.tickMs || 1000;
      while (s.tickAcc >= tickMs) {
        s.tickAcc -= tickMs;
        // DoTs bypass shield
        actor.hp = Math.max(0, actor.hp - s.dpt);
        spawnFloatNum(actor.side, '-' + s.dpt, false, 'dmg-num');
      }
    }

    // Timer countdown
    if (s.remaining !== undefined && s.remaining !== null) {
      s.remaining -= ms;
      if (s.remaining <= 0) {
        var label = s.label;
        var statusId = s.id;

        // Shield expiry
        if (statusId === 'shield') {
          actor.shield = 0;
          if (typeof s._onExpiry === 'function') s._onExpiry();
        }

        // Frenzy expiry — collapse all stacks
        if (statusId === 'frenzy') {
          actor.frenzyStacks = 0;
          actor.drawSpeedMult = Math.max(1.0, actor.drawSpeedMult); // recalc needed
          addLog('Frenzy collapsed!', 'sys');
        }

        actor.statusEffects.splice(i, 1);
        removeTagByLabel(actor.side, label);
      }
    }
  }
}


// Manabound check for one actor — purge Shield, Dodge, Frenzy, Thorns at 0 mana
function checkActorManabound(actor) {
  if (actor.mana > 0) return;
  var purged = false;

  for (var i = actor.statusEffects.length - 1; i >= 0; i--) {
    var s = actor.statusEffects[i];
    var isManabound = (s.id === 'shield' || s.id === 'frenzy' || s.stat === 'thorns' || s.id === 'dodge');
    if (isManabound) {
      var label = s.label || s.id;
      if (s.id === 'shield') actor.shield = 0;
      if (s.id === 'frenzy') {
        actor.frenzyStacks = 0;
        actor.drawSpeedMult = 1.0;
      }
      if (s.id === 'dodge') actor.dodge = false;
      actor.statusEffects.splice(i, 1);
      removeTagByLabel(actor.side, label);
      purged = true;
    }
  }

  if (purged) {
    addLog('⚡ Manabound purge — mana depleted.', 'sys');
  }
}


// ── LAYER 3: INNATE TRIGGER SYSTEM ────────────────────────────
//
// Innates declare triggers as data. This function checks and fires them.
// Will be fully wired in Session 3 — stub for now.

function fireInnateTriggers(actor, event, ctx) {
  var innate = actor.creature && actor.creature.innate;
  if (!innate) return;

  // Get triggers: try innate.triggers first, then protected INNATE_TRIGGERS registry
  var triggers = innate.triggers;
  if (!triggers || !triggers.length) {
    triggers = (typeof INNATE_TRIGGERS !== 'undefined') ? INNATE_TRIGGERS[innate.id] : null;
  }
  if (!triggers || !triggers.length) return;

  triggers.forEach(function(trigger) {
    if (trigger.on !== event) return;

    // Check condition
    if (trigger.condition && !checkTriggerCondition(actor, trigger.condition)) return;

    // Determine target actor for the effect
    var effectTarget = (trigger.target === 'opponent') ? ctx.opponent : ctx.actor;

    // Build effect context
    var effCtx = {
      actor: effectTarget,
      opponent: (trigger.target === 'opponent') ? ctx.actor : ctx.opponent,
      cardId: ctx.cardId || null,
      cardName: ctx.cardName || (innate.name || ''),
      str: actor.str, agi: actor.agi, wis: actor.wis,
      pdmg: ctx.pdmg || function(b) { return Math.max(1, b); },
      isGhost: false, critBonus: 0,
    };

    // Fire the effect
    if (trigger.effect && trigger.effect.type && EFFECT_TYPES[trigger.effect.type]) {
      EFFECT_TYPES[trigger.effect.type].run(trigger.effect, effCtx);
    }
  });
}


function checkTriggerCondition(actor, condition) {
  switch (condition) {
    case 'has_haste':
      return actor.drawSpeedMult > 1.0 ||
        actor.statusEffects.some(function(s) { return s.stat === 'haste' || s.id === 'haste'; });
    case 'has_shield':
      return actor.shield > 0;
    case 'has_frenzy':
      return actor.frenzyStacks > 0;
    case 'has_burn_on_opponent':
      var opp = getOpponent(actor);
      return opp && opp.statusEffects.some(function(s) { return s.id === 'burn'; });
    case 'has_debuff_on_opponent':
      var opp2 = getOpponent(actor);
      return opp2 && opp2.statusEffects.some(function(s) { return s.cls === 'debuff'; });
    case 'below_50_hp':
      return actor.hp < actor.maxHp * 0.5;
    case 'draw_pile_empty':
      return actor.drawPool.length === 0;
    case 'has_mana_20':
      return actor.mana >= 20;
    case 'has_mana_15':
      return actor.mana >= 15;
    default:
      return true;
  }
}


// Activate an active innate for an actor
// Uses INNATE_EFFECTS registry (built in index.html after creature files load)
// to protect against init.js or save/load stripping innate.effect from CREATURES.

function actorActivateInnate(actor) {
  var innate = actor.creature && actor.creature.innate;
  if (!innate || !innate.active) return false;

  // Get effect array: try innate.effect first, then protected INNATE_EFFECTS registry
  var effectArr = innate.effect;
  if (!effectArr || !effectArr.length) {
    effectArr = (typeof INNATE_EFFECTS !== 'undefined') ? INNATE_EFFECTS[innate.id] : null;
  }
  if (!effectArr || !effectArr.length) return false;

  // Check mana and cooldown
  if (actor.mana < (innate.cost || 0)) return false;
  if (actor.innateCooldown > 0) return false;

  // Spend mana and start cooldown
  actor.mana -= (innate.cost || 0);
  actor.innateCooldown = innate.cooldown || 0;

  // Execute innate effects
  var opponent = getOpponent(actor);
  var ctx = {
    actor: actor,
    opponent: opponent,
    cardName: innate.name,
    str: actor.str, agi: actor.agi, wis: actor.wis,
    pdmg: function(b) { return Math.max(1, b); },
    isGhost: false, critBonus: 0,
    isEnemy: actor.side === 'enemy',
  };

  effectArr.forEach(function(eff) {
    if (EFFECT_TYPES[eff.type]) {
      EFFECT_TYPES[eff.type].run(eff, ctx);
    }
  });

  spawnFloatNum(actor.side, innate.name + '!', false, 'crit-num');
  addLog('✦ ' + innate.name + '!', 'innate');

  return true;
}


// ── LAYER 2: UNIFIED CARD EXECUTION ───────────────────────────
//
// One function handles card play for both player and enemy.
// Effects receive a ctx with actor/opponent — no isEnemy checks.

function playCardForActor(actor, cardIndex) {
  if (!actor || !gs || !gs.running) return;
  if (cardIndex < 0 || cardIndex >= actor.hand.length) return;

  var item = actor.hand[cardIndex];
  var card = CARDS[item.id];
  if (!card) return;

  var opponent = getOpponent(actor);

  // Draw lock check
  if (item._drawLock && Date.now() < item._drawLock) return;

  // Remove from hand — check if this was the last card (Hellbent)
  var wasLastInHand = actor.hand.length === 1;
  actor.hand.splice(cardIndex, 1);

  // Play animation (player only — enemy cards don't need visual ghosts)
  if (actor.side === 'player') {
    spawnCardFloat(item.id, 'play');
    playCardSfx();
  }

  // Shadow Mark crit consumption
  var markedCrit = false;
  if (item.critBonus) {
    markedCrit = true;
    actor.shadowMarkActive = false;
    // Clear crit marks from all remaining hand cards
    actor.hand.forEach(function(h) { delete h.critBonus; });
    removeTagByLabel(actor.side, 'Shadow Mark');
  }

  // Build unified context
  var ctx = {
    // New actor-based fields
    actor: actor,
    opponent: opponent,
    // Card info
    card: card,
    cardId: item.id,
    cardName: card.name,
    // Stats (from actor)
    str: actor.str, agi: actor.agi, wis: actor.wis,
    // Flags
    isGhost: item.ghost || false,
    isAuto: false,
    markedCrit: markedCrit,
    critBonus: item.critBonus || 0,
    // Old compatibility flag (effects that still check this)
    isEnemy: actor.side === 'enemy',
    // Damage helper
    pdmg: function(base) { return Math.max(1, Math.round(base)); },
    // Hellbent flag
    _wasLastInHand: wasLastInHand,
  };

  // Log
  var who = actor.side === 'player' ? 'You play' : actor.creature.name + ' plays';
  addLog(who + ' ' + card.name + '!', 'sys');

  // Fire pre-attack innate triggers (crit modifiers must apply before effects)
  if (card.type === 'attack') {
    // Check for innate crit modifiers (e.g. Keen Senses)
    var innate = actor.creature && actor.creature.innate;
    if (innate && innate.triggers) {
      innate.triggers.forEach(function(trigger) {
        if (trigger.on !== 'on_attack') return;
        if (trigger.condition && !checkTriggerCondition(actor, trigger.condition)) return;
        // crit_roll: roll for crit and set markedCrit on ctx
        if (trigger.effect && trigger.effect.type === 'crit_roll') {
          if (Math.random() < (+trigger.effect.pct / 100)) {
            ctx.markedCrit = true;
          }
        }
      });
    }
  }

  // Execute card effects through EFFECT_TYPES (with mod resolution)
  var resolved = resolveCardEffects(actor, item.id);
  var resolvedEffects = resolved.effects.concat(resolved.appendedEffects);

  // Apply crit from mods
  if(resolved.crit > 0){
    ctx.critBonus = (ctx.critBonus || 0) + resolved.crit;
  }

  if (resolvedEffects.length) {
    resolvedEffects.forEach(function(eff) {
      var def = EFFECT_TYPES[eff.type];
      if (!def) { addLog('Unknown effect: ' + eff.type, 'sys'); return; }
      def.run(eff, ctx);
    });
  }

  // Execute legacy _bonusEffects (from old modify_hand, kept for compatibility)
  if (item._bonusEffects && item._bonusEffects.length) {
    item._bonusEffects.forEach(function(eff) {
      var def = EFFECT_TYPES[eff.type];
      if (def) def.run(eff, ctx);
    });
  }

  // Consume next_play mods after card is played
  consumeNextPlayMods(actor, item.id);

  // Fire post-play innate triggers (rewards like Frenzy)
  fireInnateTriggers(actor, 'on_card', ctx);
  if (card.type === 'attack') {
    // Filter out crit_roll triggers (already fired pre-attack)
    var innate2 = actor.creature && actor.creature.innate;
    if (innate2 && innate2.triggers) {
      innate2.triggers.forEach(function(trigger) {
        if (trigger.on !== 'on_attack') return;
        if (trigger.effect && trigger.effect.type === 'crit_roll') return; // already handled
        if (trigger.condition && !checkTriggerCondition(actor, trigger.condition)) return;
        var effectTarget = (trigger.target === 'opponent') ? ctx.opponent : ctx.actor;
        var effCtx = {
          actor: effectTarget,
          opponent: (trigger.target === 'opponent') ? ctx.actor : ctx.opponent,
          cardId: ctx.cardId, cardName: ctx.cardName,
          str: actor.str, agi: actor.agi, wis: actor.wis,
          pdmg: ctx.pdmg, isGhost: false, critBonus: 0,
          isEnemy: actor.side === 'enemy',
        };
        if (trigger.effect && trigger.effect.type && EFFECT_TYPES[trigger.effect.type]) {
          EFFECT_TYPES[trigger.effect.type].run(trigger.effect, effCtx);
        }
      });
    }
  }

  // Fire opponent's reactive triggers (e.g. Corruption Spread)
  if (card.type === 'attack' && opponent && opponent.creature && opponent.creature.innate
      && opponent.creature.innate.triggers) {
    var oppCtx = {
      actor: opponent,
      opponent: actor,
      cardId: item.id,
      cardName: card.name,
      str: opponent.str, agi: opponent.agi, wis: opponent.wis,
      pdmg: function(b) { return Math.max(1, b); },
      isGhost: false, critBonus: 0,
      isEnemy: opponent.side === 'enemy',
    };
    opponent.creature.innate.triggers.forEach(function(trigger) {
      if (trigger.on !== 'on_opponent_attack') return;
      if (trigger.condition && !checkTriggerCondition(opponent, trigger.condition)) return;
      if (trigger.effect && trigger.effect.type && EFFECT_TYPES[trigger.effect.type]) {
        EFFECT_TYPES[trigger.effect.type].run(trigger.effect, oppCtx);
      }
    });
  }

  // Discard (non-ghost cards)
  if (!item.ghost) {
    actor.discardPile.push(item.id);
    // Fire echo (onDiscard) — not here, echo fires when discarded by OTHER means
    // (Churn, Quick Hands, overflow). Playing a card is NOT a discard.
  }
  // Ghost cards just vanish

  // Tracking
  actor.cardsPlayed++;
  actor.lastCardPlayed = item.id;
  gs.lastCardPlayed = item.id;

  // Update
  checkEnd();
  if (actor.side === 'player') {
    renderHand(); renderPiles();
  }
  updateAll();

  // Fire on_hand_empty triggers if hand is now empty
  if (actor.hand.length === 0) {
    fireInnateTriggers(actor, 'on_hand_empty', {
      actor: actor,
      opponent: opponent,
      pdmg: function(b) { return Math.max(1, b); }
    });
  }
}


// ── SHIM LAYER ────────────────────────────────────────────────
//
// Syncs new actor state to old gs fields so existing rendering
// code continues to work unchanged during migration.

// ── SYNC LAYER ─────────────────────────────────────────────────
// gs fields remain source of truth for rendering.
// Actors read from gs before card execution, and write back after.
// This replaces the old bidirectional shim.

function syncGSToActors() {
  if (!gs || !gs.actors) return;
  var p = gs.actors.player;
  var e = gs.actors.enemy;
  if (p) {
    p.hp = gs.playerHp; p.maxHp = gs.playerMaxHp;
    p.shield = gs.playerShield; p.mana = gs.mana;
    p.maxMana = gs.maxMana; p.manaRegen = gs.manaRegen;
    p.dodge = gs.playerDodge || false;
    p.shadowMarkActive = gs.shadowMarkActive;
    p.nextCardCrit = gs.nextCardCrit;
    p.conjuredCount = gs.conjuredCount;
    p.innateCooldown = gs._innCooldown || 0;
  }
  if (e) {
    e.hp = gs.enemyHp; e.maxHp = gs.enemyMaxHp;
    e.shield = gs.enemyShell;
    e.mana = gs.enemyMana; e.maxMana = gs.enemyMaxMana;
    e.dodge = gs.enemyDodge || false;
  }
}

function syncActorsToGS() {
  if (!gs || !gs.actors) return;
  var p = gs.actors.player;
  var e = gs.actors.enemy;
  if (p) {
    gs.playerHp = p.hp; gs.playerShield = p.shield;
    gs.mana = p.mana; gs.shadowMarkActive = p.shadowMarkActive;
    gs.nextCardCrit = p.nextCardCrit; gs.conjuredCount = p.conjuredCount;
    gs.playerDodge = p.dodge;
    gs._innCooldown = p.innateCooldown;
  }
  if (e) {
    gs.enemyHp = e.hp; gs.enemyShell = e.shield;
    gs.enemyMana = e.mana; gs.enemyDodge = e.dodge;
  }
  gs.lastCardPlayed = (p && p.lastCardPlayed) || (e && e.lastCardPlayed) || gs.lastCardPlayed;
}
