// ════════════════════════════════════════════════════════════════
// ARENA  —  Theo's building (Round 48)
// ════════════════════════════════════════════════════════════════
// The Arena does four things, surfaced as tabs in one panel:
//   SPARRING    — idle gold-per-tick, champion-slot pattern
//                 (same shape as the Shard Well).
//   CHALLENGE   — paste a duel/creature code → preview → fight.
//   DAILY       — one rotating challenge, UTC midnight reset,
//                 medium gold + mastery for first-clear.
//   DUEL CODES  — export your champion as a shareable code so a
//                 friend can fight your build.
//
// Quests can also embed an arena fight payload — accepting such
// a quest surfaces an "INCOMING MATCH" card at the top of the
// panel above the tabs.
//
// All four modes share one combat entry point: startArenaCombat()
// in game.js, which builds a one-off "area run" from a payload so
// the existing combat code doesn't need to know it's an Arena fight.
//
// Author note (J): scope locked in Round 48. No friend-duel
// rewards, no leaderboard, no Theo's-pick — those are parked.
// ════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════
// CHAMPION / CREATURE CODES — encode, decode, validate
// ════════════════════════════════════════════════════════════════
//
// A duel code is a version-prefixed base64-encoded JSON blob.
// The prefix is `nopo:v1:` so we can:
//   (a) cheaply detect "is this a duel code" before decoding
//   (b) reject codes from a future game version with a clean message
//
// Compact field names keep encoded strings short enough for casual
// copy/paste — typical champion code is ~250-400 chars.
//
// Payload schema (v1):
//   { v:1, t:'champion'|'creature', id:string,
//     lv:number, asc:number, st:[str,agi,wis],
//     deck:[cardId,...]?, rel:[relicId,...]?,
//     name:string? }
//
// Validation is strict. Any malformed / missing / out-of-range
// field rejects the whole code with a player-readable error.
// Codes from a future schema version fail with a "newer version"
// message rather than crashing.

var ARENA_CODE_PREFIX  = 'nopo:v1:';
var ARENA_CODE_VERSION = 1;

// Snapshot a champion's current state into a payload object.
// Throws if the champion id doesn't resolve. Caller should already
// know the id is valid; this is just defensive.
function _arenaSnapshotChampion(champId){
  if(typeof CREATURES === 'undefined' || !CREATURES[champId]){
    throw new Error('Unknown champion id: ' + champId);
  }
  var cp = (typeof getChampPersist === 'function') ? getChampPersist(champId) : null;
  if(!cp) throw new Error('No persist record for: ' + champId);
  var deck = (typeof buildStartDeck === 'function') ? buildStartDeck(champId) : [];
  return {
    v:   ARENA_CODE_VERSION,
    t:   'champion',
    id:  champId,
    lv:  cp.level || 1,
    asc: cp.ascensionTier || 0,
    st:  [cp.stats.str || 0, cp.stats.agi || 0, cp.stats.wis || 0],
    deck: deck.slice(),
    rel: (cp.relics || []).slice()
  };
}

// Encode a champion → string. Returns the full code with prefix.
// Caller catches errors and toasts.
function encodeChampionCode(champId){
  var payload = _arenaSnapshotChampion(champId);
  var json = JSON.stringify(payload);
  // btoa is fine here — all our IDs are plain ASCII.
  var b64;
  try { b64 = btoa(json); }
  catch(e){ throw new Error('Encoding failed (non-ASCII payload).'); }
  return ARENA_CODE_PREFIX + b64;
}

// Decode + validate a code string. Returns the payload, or throws
// with a message safe to surface in a toast / error label.
function decodeArenaCode(codeStr){
  if(typeof codeStr !== 'string' || !codeStr.trim()){
    throw new Error('No code provided.');
  }
  codeStr = codeStr.trim();
  if(codeStr.indexOf(ARENA_CODE_PREFIX) !== 0){
    throw new Error('Invalid code — missing "nopo:v1:" prefix.');
  }
  var b64 = codeStr.slice(ARENA_CODE_PREFIX.length);
  var json;
  try { json = atob(b64); }
  catch(e){ throw new Error('Invalid code — corrupted data.'); }
  var p;
  try { p = JSON.parse(json); }
  catch(e){ throw new Error('Invalid code — not valid JSON.'); }

  // ── Field-by-field validation ─────────────────────────────────
  if(p.v !== ARENA_CODE_VERSION){
    throw new Error('Code is from a different game version (v' + p.v + ').');
  }
  if(p.t !== 'champion' && p.t !== 'creature'){
    throw new Error('Code type must be champion or creature.');
  }
  if(typeof p.id !== 'string'
     || typeof CREATURES === 'undefined'
     || !CREATURES[p.id]){
    throw new Error('Code references unknown creature: ' + p.id);
  }
  if(typeof p.lv !== 'number' || p.lv < 1 || p.lv > 100){
    throw new Error('Code level out of range (1-100).');
  }
  if(typeof p.asc !== 'number' || p.asc < 0 || p.asc > 6){
    throw new Error('Code ascension tier out of range (0-6).');
  }
  if(!Array.isArray(p.st) || p.st.length !== 3
     || p.st.some(function(s){ return typeof s !== 'number' || s < 0 || s > 999; })){
    throw new Error('Code stats malformed.');
  }
  if(p.deck !== undefined){
    if(!Array.isArray(p.deck)) throw new Error('Code deck malformed.');
    if(typeof CARDS !== 'undefined'){
      var badCards = p.deck.filter(function(cid){
        return typeof cid !== 'string' || (!CARDS[cid] && cid !== 'filler');
      });
      if(badCards.length){
        throw new Error('Code references unknown cards: ' + badCards.slice(0,3).join(', '));
      }
    }
  }
  if(p.rel !== undefined){
    if(!Array.isArray(p.rel) || p.rel.length > 3){
      throw new Error('Code relics malformed (max 3).');
    }
    if(typeof RELICS !== 'undefined'){
      var badRel = p.rel.filter(function(rid){
        return typeof rid !== 'string' || !RELICS[rid];
      });
      if(badRel.length){
        throw new Error('Code references unknown relics: ' + badRel.join(', '));
      }
    }
  }
  if(p.name !== undefined && (typeof p.name !== 'string' || p.name.length > 40)){
    throw new Error('Code display name malformed.');
  }
  return p;
}

// Convenience wrapper used by UI: returns {ok, payload, error}
// so the caller can branch without try/catch boilerplate.
function tryDecodeArenaCode(codeStr){
  try {
    return { ok:true, payload: decodeArenaCode(codeStr), error:null };
  } catch(e){
    return { ok:false, payload:null, error: e.message || 'Invalid code.' };
  }
}

// ════════════════════════════════════════════════════════════════
// SPARRING — idle gold income                          (Phase 2a)
// ════════════════════════════════════════════════════════════════
//
// Same shape as the Shard Well. Up to 3 slots; assigned champions
// "spar for purse money" while idle. WIS is the primary stat (per
// CLAUDE.md ACTIVITY_PRIMARY_STAT.arena = 'WIS') — sharpest reader
// of opponents earns the most. STR / AGI contribute as secondaries.
//
// Generated gold accumulates in b.pendingGold (separate pool from
// PERSIST.gold) and requires CLAIM to transfer. Cap gates pacing —
// at cap the well stops generating until claimed.
//
// XP per gold = 1.0; level-ups grant 1 unspent point (spendable on
// rate or cap). Mastery XP trickles to slotted champions at the
// same magnitude as the Shard Well (small, idle).
//
// Slot count scales with arena building level: 1 at Lv1, 2 at Lv3,
// 3 at Lv5 — matches Forge progression.

// ════════════════════════════════════════════════════════════════
// GAMBLING (Round 54 rewrite — replaces idle-trickle sparring)
// ════════════════════════════════════════════════════════════════
//
// J's spec: instead of passively ticking up gold, each champion you
// place at the tables enters with a 100g stake. Every bet interval
// they win or lose money. They leave when:
//   • their purse hits 0 (busted — player loses the entry fee)
//   • their purse hits ARENA_GAMBLE_CAP (kicked out for winning too much)
//   • their session timer expires
// When they leave, their final purse is added to b.pendingGold for
// the player to COLLECT.
//
// Stat roles:
//   WIS — boosts win chance % AND win amount
//   STR — boosts "save chance" (loss avoided) AND mitigates loss amount
//   AGI — shortens the bet interval (more bets per minute)
//
// Pity is baked into the base win chance (50% baseline, WIS bumps it
// up to a cap) and the asymmetric amounts (wins scale with WIS,
// losses are bounded by STR mitigation). Net expected value is mildly
// positive for an average-stat champion and strongly positive for a
// WIS-built one.

var ARENA_MAX_ROSTER         = 3;
var ARENA_GAMBLE_ENTRY_FEE   = 100;       // gold charged on assign
var ARENA_GAMBLE_CAP         = 500;       // per-champ purse cap (kicked out)
var ARENA_GAMBLE_MAX_SECS    = 12 * 3600; // 12h session timer
var ARENA_GAMBLE_BASE_BET    = 10;        // gold per bet (modified by stats)
var ARENA_GAMBLE_BASE_INTERVAL = 60;      // seconds between bets at 0 AGI
var ARENA_GAMBLE_BASE_WIN_CHANCE = 0.50;  // pity floor

function getArenaSlotCount(){
  var lv = (typeof getBuildingLevel === 'function') ? getBuildingLevel('arena') : 1;
  if(lv >= 5) return 3;
  if(lv >= 3) return 2;
  return 1;
}

// Per-champion stat-based gambling parameters. Pure helper — given a
// champion's stats, returns the formulas that drive a bet.
function _arenaGambleParams(stats){
  stats = stats || {str:0, agi:0, wis:0};
  var str = stats.str || 0, agi = stats.agi || 0, wis = stats.wis || 0;
  return {
    // AGI: 1 bet per 60s at 0 AGI, 1 bet per 30s at 100 AGI (2× rate).
    // Floor at 10s so insanely high-AGI doesn't trivialise tick budget.
    betInterval:    Math.max(10, Math.round(ARENA_GAMBLE_BASE_INTERVAL / (1 + agi/100))),
    // WIS: +0.4% win chance per WIS point, capped at +35% (so 50% → 85% max).
    winChance:      Math.min(0.85, ARENA_GAMBLE_BASE_WIN_CHANCE + wis * 0.004),
    // WIS amount mult: +1.5% per WIS point (50 WIS = 75% bigger wins).
    winAmount:      Math.round(ARENA_GAMBLE_BASE_BET * (1 + wis * 0.015)),
    // STR save chance: 0.4% per STR point, capped at 50%.
    lossSaveChance: Math.min(0.50, str * 0.004),
    // STR loss mitigation: 0.7% per STR point (50 STR = 35% smaller losses), floor 2g.
    lossAmount:     Math.max(2, Math.round(ARENA_GAMBLE_BASE_BET * (1 - str * 0.007)))
  };
}

// Cap remains a constant for the OVERALL pending pool. Champion
// individual purses are capped by ARENA_GAMBLE_CAP. The "purse
// summary band" in the panel shows pendingGold awaiting COLLECT —
// not a hard cap, just a running total.
function getArenaGoldCap(){
  return ARENA_MAX_ROSTER * ARENA_GAMBLE_CAP;
}

// ── Tick ────────────────────────────────────────────────────────
// Resolves bets for every slotted champion. Each champ's session
// advances at its own rate (AGI-derived). On any exit condition
// (bust / cap / timer), the champion leaves and their final purse
// is banked to b.pendingGold.
function arenaTick(seconds){
  var b = PERSIST.town.buildings.arena;
  if(!b || !b.unlocked) return;
  if(typeof b.pendingGold !== 'number') b.pendingGold = 0;
  if(!Array.isArray(b.sparringSlots)) b.sparringSlots = [null,null,null];

  var now = Date.now();
  // Process each slot — bounded loop per slot guards against runaway
  // offline catch-up (e.g. 12h offline at fastest interval = ~4320 bets,
  // safety cap at 5000 to be generous).
  for(var i=0; i<ARENA_MAX_ROSTER; i++){
    var session = b.sparringSlots[i];
    if(!session || typeof session !== 'object') continue;

    var cp = PERSIST.champions[session.champId];
    if(!cp){
      // Champion got wiped somehow — purge slot defensively
      b.sparringSlots[i] = null;
      continue;
    }
    var params = _arenaGambleParams(cp.stats);
    var lastBet = session.lastBetTime || session.startTime || now;
    var elapsedSinceLast = (now - lastBet) / 1000;

    // Resolve as many bets as the elapsed time allows
    var safety = 5000;
    while(elapsedSinceLast >= params.betInterval && safety-- > 0){
      // Run one bet
      var roll = Math.random();
      if(roll < params.winChance){
        // WIN
        session.purse += params.winAmount;
        session.wins = (session.wins||0) + 1;
      } else {
        // Potential loss — STR can save it
        if(Math.random() < params.lossSaveChance){
          // Saved! No-op
        } else {
          session.purse -= params.lossAmount;
          session.losses = (session.losses||0) + 1;
        }
      }
      // Advance bet timer
      lastBet += params.betInterval * 1000;
      elapsedSinceLast -= params.betInterval;

      // Exit conditions — checked after each bet
      if(session.purse <= 0){
        _arenaChampLeaves(i, 'bust');
        session = null; break;
      }
      if(session.purse >= ARENA_GAMBLE_CAP){
        _arenaChampLeaves(i, 'cap');
        session = null; break;
      }
      if((now - (session.startTime||now)) / 1000 >= ARENA_GAMBLE_MAX_SECS){
        _arenaChampLeaves(i, 'timer');
        session = null; break;
      }
    }
    // Stamp lastBetTime so the next tick picks up cleanly. If session
    // got cleared by exit, skip.
    if(session){
      session.lastBetTime = lastBet;
    }
  }
}

// Champion leaves the tables. Reason: 'bust' | 'cap' | 'timer' | 'pull'.
// Their (clamped) final purse moves to the building's pendingGold pool.
function _arenaChampLeaves(slotIdx, reason){
  var b = PERSIST.town.buildings.arena;
  if(!b || !b.sparringSlots) return;
  var session = b.sparringSlots[slotIdx];
  if(!session || typeof session !== 'object') return;
  var final = Math.max(0, Math.floor(session.purse || 0));
  var champId = session.champId;
  var champName = (CREATURES[champId] && CREATURES[champId].name) || 'Champion';

  // Bank winnings
  b.pendingGold = (b.pendingGold || 0) + final;

  // Clear slot + unlock champion
  b.sparringSlots[slotIdx] = null;
  var cp = PERSIST.champions[champId];
  if(cp && cp.lockedArena !== null && cp.lockedArena !== undefined){
    cp.lockedArena = null;
  }

  // Toast — plain factual outcome, no flavour text.
  if(typeof showTownToast === 'function'){
    var msg;
    if(reason === 'bust')       msg = champName + ' lost it all.';
    else                        msg = champName + ' leaves with ' + final + 'g.';
    showTownToast(msg);
  }
  savePersist();
}

// ── Slot actions ────────────────────────────────────────────────

function _arenaAssign(slotIdx, champId){
  var b = PERSIST.town.buildings.arena;
  if(!b) return;
  if(slotIdx < 0 || slotIdx >= ARENA_MAX_ROSTER) return;
  if(!CREATURES[champId]) return;
  if(typeof isChampLocked === 'function' && isChampLocked(champId)){
    if(typeof showTownToast === 'function'){
      showTownToast(CREATURES[champId].name + ' is busy elsewhere.');
    }
    return;
  }
  // Round 54: must pay ENTRY_FEE upfront — this is the champion's
  // stake at the tables. Refuse if the player can't afford it.
  if((PERSIST.gold || 0) < ARENA_GAMBLE_ENTRY_FEE){
    if(typeof showTownToast === 'function'){
      showTownToast('Need ' + ARENA_GAMBLE_ENTRY_FEE + 'g for the entry fee.');
    }
    return;
  }
  if(!Array.isArray(b.sparringSlots)) b.sparringSlots = [null,null,null];

  // If the slot is already occupied by an active session, refuse to
  // overwrite (the player should explicitly PULL them first). Avoids
  // accidentally vaporising a champ mid-winning-streak.
  var existing = b.sparringSlots[slotIdx];
  if(existing && typeof existing === 'object' && existing.champId){
    if(typeof showTownToast === 'function'){
      showTownToast('Pull ' + (CREATURES[existing.champId] ? CREATURES[existing.champId].name : 'the current champion') + ' first.');
    }
    return;
  }

  // Charge the entry fee, build a fresh session
  PERSIST.gold -= ARENA_GAMBLE_ENTRY_FEE;
  var now = Date.now();
  b.sparringSlots[slotIdx] = {
    champId:     champId,
    purse:       ARENA_GAMBLE_ENTRY_FEE,  // starts with what they paid in
    startTime:   now,
    lastBetTime: now,
    wins:        0,
    losses:      0
  };
  var cp = getChampPersist(champId);
  if(cp) cp.lockedArena = slotIdx;

  savePersist();
  if(typeof showTownToast === 'function'){
    showTownToast(CREATURES[champId].name + ' joins the arena.');
  }
  refreshArenaPanel();
}

// Pull a champion out early. They walk away with their CURRENT purse
// (no entry-fee refund — that money's already on the table). If the
// purse is below the entry fee they take a loss; if above, they
// walk away ahead.
function _arenaRelease(slotIdx){
  var b = PERSIST.town.buildings.arena;
  if(!b || !Array.isArray(b.sparringSlots)) return;
  var session = b.sparringSlots[slotIdx];
  if(!session || typeof session !== 'object') return;
  _arenaChampLeaves(slotIdx, 'pull');
  refreshArenaPanel();
}

// (Round 49: _arenaSpendPoint, _arenaRespec, _arenaRespecCost
// removed along with the rate/cap upgrade tree. Sparring numbers
// flow purely from champion stats now.)

// COLLECT — banks pendingGold (winnings from departed champions)
// into the player's pool. Round 54: no more progress bar to drain
// since the winnings band is just a flat counter; we only animate
// the count ticking down. Snap-refresh follows.
function _arenaClaim(){
  var b = PERSIST.town.buildings.arena;
  if(!b || !b.unlocked) return;
  var pending = b.pendingGold || 0;
  if(pending <= 0){
    if(typeof showTownToast === 'function') showTownToast('Nothing to collect yet.');
    return;
  }

  // Commit state
  PERSIST.gold = (PERSIST.gold||0) + pending;
  b.pendingGold = 0;

  if(typeof playSfx === 'function') playSfx('accept');
  if(typeof showTownToast === 'function'){
    showTownToast('+'+pending+' gold collected.');
  }
  savePersist();

  // ── Count tick-down ──
  var DUR = 700;
  var countEl = document.getElementById('arena-hero-count');
  if(!countEl){ refreshArenaPanel(); return; }
  if(countEl){
    var startTs = null;
    var startVal = pending;
    function step(ts){
      if(startTs === null) startTs = ts;
      var t = Math.min(1, (ts - startTs) / DUR);
      var eased = 1 - Math.pow(1 - t, 3);
      var cur = Math.max(0, Math.round(startVal * (1 - eased)));
      countEl.textContent = cur + 'g';
      if(t < 1) requestAnimationFrame(step);
      else countEl.textContent = '0g';
    }
    requestAnimationFrame(step);
  }
  setTimeout(function(){ refreshArenaPanel(); }, DUR + 60);
}

// ── Champion picker (slot click) ────────────────────────────────
// Mirrors _shardWellPickForSlot. Round 49: uses the canonical inline-
// style overlay pattern (no phantom CSS class). The original Round 48
// attempt referenced .exp-popup-overlay / .exp-pick-grid which don't
// exist anywhere in the project — the popup was being inserted with
// no positioning at all and was invisible.
function _arenaPickChampForSlot(slotIdx){
  var b = PERSIST.town.buildings.arena;
  if(!b || !b.unlocked) return;
  if(slotIdx < 0 || slotIdx >= ARENA_MAX_ROSTER) return;

  // Tear down any prior popup
  var existing = document.getElementById('exp-popup');
  if(existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'exp-popup';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;';
  overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };

  var box = document.createElement('div');
  box.style.cssText = 'background:#1a0f06;border:1px solid #5a3418;border-radius:10px;padding:20px 24px;width:min(620px,90vw);max-height:75vh;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,.8);';
  box.onclick = function(e){ e.stopPropagation(); };

  // Round 54: slot entries are session OBJECTS now (or null). The
  // picker doesn't show a "current" champion option because gambling
  // sessions can't be swapped — you have to PULL first.
  var currentSession = (b.sparringSlots||[])[slotIdx] || null;
  var currentInSlot = (currentSession && typeof currentSession === 'object') ? currentSession.champId : null;
  var available = (PERSIST.unlockedChamps||[]).filter(function(id){
    if(!CREATURES[id] || id === 'dojo_tiger') return false;
    var cp = PERSIST.champions[id];
    if(!cp) return true;
    if(cp.lockedExpedition !== null && cp.lockedExpedition !== undefined) return false;
    if(cp.lockedForge      !== null && cp.lockedForge      !== undefined) return false;
    if(cp.lockedShardWell  !== null && cp.lockedShardWell  !== undefined) return false;
    if(cp.lockedArena      !== null && cp.lockedArena      !== undefined) return false;
    return true;
  });

  // Sort by total stats desc — "strongest first" without favouring any stat
  available.sort(function(a, b){
    var ca = getChampPersist(a), cb = getChampPersist(b);
    var sa = (ca.stats.str||0) + (ca.stats.agi||0) + (ca.stats.wis||0);
    var sb = (cb.stats.str||0) + (cb.stats.agi||0) + (cb.stats.wis||0);
    return sb - sa;
  });

  var canAfford = (PERSIST.gold || 0) >= ARENA_GAMBLE_ENTRY_FEE;
  var html = '<div style="font-family:Cinzel,serif;font-size:12px;color:#d4a843;letter-spacing:3px;margin-bottom:6px;">ASSIGN CHAMPION (SLOT ' + (slotIdx+1) + ')</div>'
    + '<div style="font-family:Cinzel,serif;font-size:9px;color:#7a6030;letter-spacing:1px;margin-bottom:14px;">'
    +   ARENA_GAMBLE_ENTRY_FEE + 'g entry'
    +   (canAfford ? '' : '<span style="color:#c04040;"> · NOT ENOUGH GOLD</span>')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">';

  available.forEach(function(id){
    var ch = CREATURES[id]; var cp = getChampPersist(id);
    var disabled = !canAfford;
    var click = disabled ? '' : ('document.getElementById(\'exp-popup\').remove();_arenaAssign(' + slotIdx + ',\'' + id + '\');');
    html += '<div class="exp-pick-option '+(typeof getAscensionClass==='function'?getAscensionClass(id):'')+'" style="position:relative;padding:12px 8px;' + (disabled?'opacity:.5;cursor:not-allowed;':'cursor:pointer;') + '" ' + (disabled?'':'onclick="'+click+'"') + '>'
      + '<div style="margin-bottom:6px;">'+(typeof creatureImgHTML==='function'?creatureImgHTML(id,ch.icon,'44px'):'')+'</div>'
      + '<div style="font-family:Cinzel,serif;font-size:10px;color:#c0a060;">'+ch.name+'</div>'
      + '<div style="font-size:7px;color:#5a4020;">Lv.'+cp.level+' '+(typeof getAscensionChipHTML==='function'?getAscensionChipHTML(id):'')+'</div>'
      + '<div style="font-size:7px;color:#4a3020;margin-top:3px;">'
      +   '<span style="color:#e88060;">STR</span>:'+Math.round(cp.stats.str)+' '
      +   '<span style="color:#9adc7e;">AGI</span>:'+Math.round(cp.stats.agi)+' '
      +   '<span style="color:#9ad8e8;">WIS</span>:'+Math.round(cp.stats.wis)
      + '</div>'
      + '</div>';
  });
  if(!available.length){
    html += '<div style="font-size:9px;color:#3a2010;font-style:italic;padding:12px;">All champions are busy elsewhere.</div>';
  }
  html += '</div>';

  // Cancel / pull-current row
  html += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">';
  if(currentInSlot){
    html += '<button onclick="document.getElementById(\'exp-popup\').remove();_arenaConfirmPull('+slotIdx+');" '
      + 'style="font-family:Cinzel,serif;font-size:9px;padding:7px 14px;border-radius:3px;border:1px solid #5a2020;background:transparent;color:#a04040;cursor:pointer;letter-spacing:1px;">PULL CURRENT</button>';
  }
  html += '<button onclick="document.getElementById(\'exp-popup\').remove();" '
    + 'style="font-family:Cinzel,serif;font-size:9px;padding:7px 14px;border-radius:3px;border:1px solid #5a3a18;background:transparent;color:#a08858;cursor:pointer;letter-spacing:1px;">CANCEL</button>';
  html += '</div>';

  box.innerHTML = html;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}


// ════════════════════════════════════════════════════════════════
// PANEL RENDERER + TAB SWITCHING                       (Phase 1c)
// ════════════════════════════════════════════════════════════════
//
// The Arena panel has four tabs (SPARRING / CHALLENGE / DAILY /
// DUEL CODES). Static tab buttons live in index.html; this code
// owns the active-state and fills `#arena-tab-body`. The current
// tab is remembered on PERSIST.town.buildings.arena.tab so it
// survives panel close/reopen.
//
// Optional INCOMING MATCH card (above the tab strip) appears when
// an arena-fight quest is active — filled by _arenaRenderIncoming.

// Round 50: collapsed from 4 tabs to 2 — WAGERS (daily headline +
// idle betting on your stable) and DUEL (load opponent code / fight
// arena quests / export your champion). Old tab keys are migrated.
var _arenaCurrentTab = 'wagers';

function _arenaMigrateTabKey(key){
  if(key === 'sparring' || key === 'daily')   return 'wagers';
  if(key === 'challenge')                     return 'duel';
  if(key === 'wagers' || key === 'duel')      return key;
  return 'wagers';
}

// Canonical refreshArenaPanel — Round 53: chrome restored to match
// the other buildings (Shard Well pattern). The standard
// .town-panel-header (icon + name + sub + close + help) is static in
// index.html; JS fills #arena-inner with .npc-greeting + .vault-level-row
// + tab strip + tab body — same shape every sibling uses.
function refreshArenaPanel(){
  if(typeof showLockedBuildingUI === 'function') showLockedBuildingUI('arena');
  var b = PERSIST.town.buildings.arena;
  if(!b || !b.unlocked) return;

  // Restore tab selection from persist, migrating old keys.
  b.tab = _arenaMigrateTabKey(b.tab);
  _arenaCurrentTab = b.tab;

  var inner = document.getElementById('arena-inner');
  if(!inner) return;

  // Building level + XP. Arena XP is fed by the area-clear scatter
  // (grantAreaClearBuildingXp) — same source the other buildings use.
  var lvl = (typeof getBuildingLevel === 'function') ? getBuildingLevel('arena') : 1;
  var curXp = (PERSIST.town.buildingXp && PERSIST.town.buildingXp.arena) || 0;
  // Threshold heuristic (placeholder until the real curve exists):
  // each level needs lvl * 100 XP. Tunable later.
  var maxXp = Math.max(100, lvl * 100);
  var xpPct = Math.min(100, Math.round((curXp / maxXp) * 100));

  // Tabs — Round 56: use the .bestiary-tab pattern (icons + label)
  // that every other tabbed building in town uses. Emoji fallbacks
  // until arena_wagers.png / arena_duel.png assets are drawn.
  var tabHtml = ''
    + '<div class="bestiary-tab-row">'
    +   '<button class="bestiary-tab' + (_arenaCurrentTab==='wagers'?' active':'') + '" data-tab="wagers" onclick="_arenaSwitchTab(\'wagers\')">'
    +     '<img src="assets/icons/arena_wagers.png" class="bestiary-tab-icon" onerror="this.outerHTML=\'<span class=&quot;bestiary-tab-emoji&quot;>🪙</span>\'">'
    +     'WAGERS'
    +   '</button>'
    +   '<button class="bestiary-tab' + (_arenaCurrentTab==='duel'?' active':'')   + '" data-tab="duel" onclick="_arenaSwitchTab(\'duel\')">'
    +     '<img src="assets/icons/arena_duel.png" class="bestiary-tab-icon" onerror="this.outerHTML=\'<span class=&quot;bestiary-tab-emoji&quot;>⚔</span>\'">'
    +     'DUEL'
    +   '</button>'
    + '</div>';

  // Full inner content — sibling-shaped chrome + tab strip + body container.
  inner.innerHTML = ''
    + '<div class="npc-greeting" id="arena-npc-greeting">'
    +   '<div class="npc-greeting-sprite"><img src="assets/creatures/arena_keeper.png" alt="Theo" onerror="this.parentNode.textContent=\'⚔️\'"></div>'
    +   '<div class="npc-greeting-text">'
    +     '<div class="npc-greeting-name">THEO</div>'
    +     '<div class="npc-greeting-msg" id="arena-npc-msg"></div>'
    +   '</div>'
    + '</div>'
    + '<div class="vault-level-row">'
    +   '<span class="vault-level-badge">ARENA Lv.' + lvl + '</span>'
    +   '<div class="vault-xp-wrap"><div class="vault-xp-bar" style="width:' + xpPct + '%;"></div></div>'
    +   '<span class="vault-xp-txt">' + curXp + ' / ' + maxXp + ' XP</span>'
    + '</div>'
    + tabHtml
    + '<div class="arn-body" id="arena-tab-body"></div>';

  // Render the active tab body
  _arenaRenderTabBody(_arenaCurrentTab);

  // NPC greeting (Theo). One-shot per panel-open via the unified
  // pipeline. #arena-npc-msg lives inside the freshly-rendered
  // greeting block; the once-flag prevents re-greeting on later
  // refreshes within the same open.
  if(typeof playNpcGreeting === 'function') playNpcGreeting('arena', {once:true});

  // Defensive: refreshArenaPanel rebuilds the inner DOM each call.
  // The once-flag suppresses re-typewriting, which would leave the
  // bubble blank. Paint the cached line back so it stays visible.
  var msgEl = document.getElementById('arena-npc-msg');
  if(msgEl && !msgEl.textContent && typeof _lastNpcLine !== 'undefined' && _lastNpcLine.arena){
    msgEl.textContent = _lastNpcLine.arena;
  }
}

// Click-handler for the tab buttons.
function _arenaSwitchTab(tabKey){
  tabKey = _arenaMigrateTabKey(tabKey);
  _arenaCurrentTab = tabKey;
  // Persist the selection so it survives panel close/reopen.
  var b = PERSIST.town.buildings.arena;
  if(b){ b.tab = tabKey; savePersist(); }
  _arenaPaintTabButtons();
  _arenaRenderTabBody(tabKey);
  if(typeof playUiClickSfx === 'function') playUiClickSfx();
}

function _arenaPaintTabButtons(){
  // Round 56: now uses .bestiary-tab styling (same as every other
  // tabbed building); selector updated to match.
  var btns = document.querySelectorAll('#arena-panel-bg .bestiary-tab');
  for(var i=0; i<btns.length; i++){
    var btn = btns[i];
    if(btn.getAttribute('data-tab') === _arenaCurrentTab) btn.classList.add('active');
    else btn.classList.remove('active');
  }
}

function _arenaRenderTabBody(tabKey){
  var body = document.getElementById('arena-tab-body');
  if(!body) return;
  tabKey = _arenaMigrateTabKey(tabKey);
  if(tabKey === 'wagers')    body.innerHTML = _arenaRenderWagers();
  else if(tabKey === 'duel') body.innerHTML = _arenaRenderDuel();
  else body.innerHTML = '';
}

// Round 50: _arenaRenderIncoming + _arenaIncomingBegin removed —
// quest fights load inside the DUEL tab automatically now (no longer
// a banner above the tabs). The DUEL tab's renderer scans active
// arena_fight quests and preloads the first one. The quest-begin
// flow lives there as _arenaDuelBeginQuest.

// Helper: find the first active arena_fight quest, or null.
function _arenaFindActiveQuest(){
  var quests = (PERSIST.town && PERSIST.town.quests) || {};
  var active  = quests.active  || [];
  var offered = quests.offered || [];
  for(var i=0; i<active.length; i++){
    var a = active[i];
    var q = offered.find(function(o){ return o.id === a.id; });
    if(q && q.type === 'arena_fight' && q.fight){
      return { active: a, quest: q };
    }
  }
  return null;
}

// Dev helper — adds a sample arena_fight quest to the active list.
// Usable from the console: `_devGiveArenaQuest()`. Picks a random
// non-champion creature, scales it modestly, gives 200 gold reward.
// (Eventually arena_fight quests will be generated by a story system
//  or a dedicated arena-quest source. For now this is the easiest
//  way to test the flow.)
function _devGiveArenaQuest(){
  var pool = [];
  if(typeof CREATURES !== 'undefined'){
    Object.keys(CREATURES).forEach(function(id){
      var c = CREATURES[id];
      if(!c || !c.baseStats) return;
      if(c.isChampion || c.playable) return;
      pool.push(id);
    });
  }
  if(!pool.length){ console.warn('No eligible creatures for dev arena quest.'); return; }
  var enemyId = pool[Math.floor(Math.random()*pool.length)];
  var ch = CREATURES[enemyId];
  var lv = 4 + Math.floor(Math.random()*5);
  var str = Math.round(ch.baseStats.str + (lv-1) * (ch.growth ? (ch.growth.str||0) : 0));
  var agi = Math.round(ch.baseStats.agi + (lv-1) * (ch.growth ? (ch.growth.agi||0) : 0));
  var wis = Math.round(ch.baseStats.wis + (lv-1) * (ch.growth ? (ch.growth.wis||0) : 0));
  var qid = 'q_arena_dev_' + Date.now();
  var quest = {
    id: qid,
    type: 'arena_fight',
    title: 'Theo Calls You Out: ' + ch.name,
    desc: 'Theo wants to see the ' + ch.name.toLowerCase() + ' put down. Show up.',
    target: 1,
    fight: {
      v: ARENA_CODE_VERSION, t: 'creature', id: enemyId,
      name: ch.name + ' (Quest)',
      lv: lv, asc: 0, st: [str, agi, wis],
      deck: (ch.deck && ch.deck.slice()) || ['strike','strike','brace'],
      rel: []
    },
    reward: { gold: 200, mastery: 30 }
  };
  if(!PERSIST.town.quests) PERSIST.town.quests = {offered:[], active:[], completed:[]};
  if(!Array.isArray(PERSIST.town.quests.offered)) PERSIST.town.quests.offered = [];
  if(!Array.isArray(PERSIST.town.quests.active))  PERSIST.town.quests.active = [];
  PERSIST.town.quests.offered.push(quest);
  PERSIST.town.quests.active.push({ id: qid, progress: 0 });
  savePersist();
  console.log('Added arena quest:', qid, '(opponent: '+ch.name+' Lv.'+lv+')');
  if(typeof refreshArenaPanel === 'function'){
    var panel = document.getElementById('arena-panel-bg');
    if(panel && panel.classList.contains('show')) refreshArenaPanel();
  }
}

// ── PER-TAB RENDERER STUBS ──────────────────────────────────────
// Each tab returns the HTML string for its body. Phase 1c ships
// placeholder content; real implementations land in Phase 2a-d.

// ════════════════════════════════════════════════════════════════
// WAGERS tab (Round 50) — daily headline match + idle betting stable
// ════════════════════════════════════════════════════════════════
//
// Thematic reframe: gold from "sparring" is actually purse money from
// BETS being placed on your champions' fights. The player isn't the
// fighter — they're the manager / bettor, putting their stable in the
// ring to draw a crowd. Daily challenge is Theo's headline card that
// the player can take on themselves (different layer, same tab).
//
// Layout:
//   TOP    — Today's headline match (the daily challenge)
//   BOTTOM — Your stable (slot grid + purse + claim)

function _arenaRenderWagers(){
  var b = PERSIST.town.buildings.arena;
  if(!b) return '';
  _arenaEnsureDailyFresh();
  return ''
    // ── Section A: DAILY CHALLENGE ──
    + _arnSectionTitle('DAILY CHALLENGE',
        '<span style="display:inline-flex;align-items:center;gap:8px;">'
      + '<span style="width:6px;height:6px;border-radius:50%;background:#f0a53a;box-shadow:0 0 6px rgba(240,165,58,.5);animation:arn-ember-flicker 1.6s ease-in-out infinite;"></span>'
      + '<span>Resets in <span style="color:#e8d7a8;">' + _arenaFmtSecs(_arenaSecsUntilNextDaily()) + '</span></span>'
      + '</span>')
    + _arenaRenderWagersDaily(b)
    // ── Section B: BETTING (the slot grid + unclaimed-gold band) ──
    + _arnSectionTitle('BETTING', '')
    + _arenaRenderWagersStable(b);
}

// Common section title helper.
function _arnSectionTitle(label, rightHtml){
  return ''
    + '<div class="arn-section-title">'
    +   '<div class="arn-section-title-lbl">' + label + '</div>'
    +   '<div class="arn-section-title-right">' + (rightHtml || '') + '</div>'
    + '</div>';
}

// Daily headline — smoke-portrait card.
function _arenaRenderWagersDaily(b){
  var payload   = b.dailyChallenge;
  var completed = !!b.dailyCompleted;
  if(!payload){
    return '<div class="arn-empty-card">No match scheduled today.</div>';
  }
  var rewards = _arenaDailyRewards(payload.lv || 1);
  var rewardHtml = completed
    ? '<span style="color:#6a5a40;">Cleared today &mdash; back tomorrow</span>'
    : 'Reward: <span style="color:#d4a843;">+'+rewards.gold+'g</span> · <span style="color:#9ad8e8;">+'+rewards.mastery+' mastery</span>';
  return _arenaPreviewCardHTML(payload, {
    rewardHtml: rewardHtml,
    ctaLabel: completed ? '✓ CLEARED' : 'BEGIN',
    ctaOnclick: completed ? '' : '_arenaDailyBegin()',
    ctaDisabled: completed,
    ctaCleared: completed
  });
}

// ── YOUR STABLE — slot grid + subtle purse band ──
function _arenaRenderWagersStable(b){
  var slotCount = getArenaSlotCount();
  var pending   = b.pendingGold || 0;
  var slots     = b.sparringSlots || [null,null,null];
  var canClaim  = pending > 0;
  var now       = Date.now();

  // ── Slot grid (Round 54: gambling sessions) ──
  var html = '<div class="arn-stable-grid">';
  for(var i=0; i<ARENA_MAX_ROSTER; i++){
    var unlocked = i < slotCount;
    var session = slots[i];

    if(!unlocked){
      html += '<div class="arn-slot locked">'
           +    '<div class="arn-slot-locked-lbl">LOCKED</div>'
           +    '<div class="arn-slot-locked-sub">Arena Lv ' + (i===1?3:5) + ' required</div>'
           +  '</div>';
      continue;
    }

    if(session && typeof session === 'object' && session.champId && CREATURES[session.champId]){
      var ch = CREATURES[session.champId];
      var cp = getChampPersist(session.champId);
      var tierKey = _arnTierKeyForChamp(cp);
      var purse   = Math.floor(session.purse || 0);
      var delta   = purse - ARENA_GAMBLE_ENTRY_FEE;
      var deltaCls = delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat');
      var deltaStr = (delta > 0 ? '+' : '') + delta;
      var elapsed = Math.floor((now - (session.startTime || now)) / 1000);
      var remaining = Math.max(0, ARENA_GAMBLE_MAX_SECS - elapsed);

      // Round 55: dropped the GAMBLING pip, the "bet every Xm" /
      // "X% win" formula exposition, and the "stake 100g" reminder.
      // The slot just shows status (purse + delta + W/L + time left).
      // Mechanics live in the building tutorial now.
      html += '<div class="arn-slot filled">'
           +    '<button class="arn-slot-x" onclick="event.stopPropagation();_arenaConfirmPull(' + i + ');" title="Pull champion">×</button>'
           +    '<div class="arn-slot-row">'
           +      '<div class="arn-slot-portrait">'
           +        ((typeof creatureImgHTML === 'function') ? creatureImgHTML(session.champId, ch.icon||'❓', '48px', 'flip-x') : '')
           +      '</div>'
           +      '<div class="arn-slot-info">'
           +        '<div class="arn-slot-name-row">'
           +          '<span class="arn-slot-name">' + ch.name + '</span>'
           +          '<span class="arn-slot-lv">LV ' + (cp.level||1) + '</span>'
           +          _arnTierChipHTML(tierKey)
           +        '</div>'
           +        '<div class="arn-slot-stats-row">'
           +          _arnStatsHTML(cp.stats, 'sm')
           +        '</div>'
           +      '</div>'
           +    '</div>'
           +    '<div class="arn-slot-purse-row">'
           +      '<span class="arn-slot-purse">' + purse + 'g</span>'
           +      '<span class="arn-slot-delta ' + deltaCls + '">' + deltaStr + '</span>'
           +    '</div>'
           +    '<div class="arn-slot-meta-row">'
           +      '<span>W ' + (session.wins||0) + ' / L ' + (session.losses||0) + '</span>'
           +      '<span class="arn-slot-time">' + _arenaFmtSecs(remaining) + ' left</span>'
           +    '</div>'
           +  '</div>';
    } else {
      // Empty slot — minimal, no themed copy
      html += '<div class="arn-slot empty" onclick="_arenaPickChampForSlot(' + i + ')">'
           +    '<span class="arn-slot-plus">+</span>'
           +    '<span class="arn-slot-empty-lbl">ASSIGN</span>'
           +    '<span class="arn-slot-empty-hint">' + ARENA_GAMBLE_ENTRY_FEE + 'g · click to assign</span>'
           +  '</div>';
    }
  }
  html += '</div>';

  // ── Unclaimed gold band ──
  html += '<div class="arn-purse-band">'
       +    '<div>'
       +      '<div class="arn-purse-band-top">'
       +        '<div>'
       +          '<span class="arn-purse-band-label">UNCLAIMED GOLD</span>'
       +          '<span class="arn-purse-band-val" id="arena-hero-count">' + pending + 'g</span>'
       +        '</div>'
       +      '</div>'
       +    '</div>'
       +    '<button class="arn-collect-btn" onclick="_arenaClaim()"' + (canClaim ? '' : ' disabled') + '>'
       +      (canClaim ? 'COLLECT' : 'NOTHING YET')
       +    '</button>'
       +  '</div>';

  return html;
}

// Pull-confirmation: clicking the × on a slot ought to confirm before
// vaporising a potentially-winning session. Quick inline confirm.
function _arenaConfirmPull(slotIdx){
  var b = PERSIST.town.buildings.arena;
  if(!b) return;
  var session = (b.sparringSlots||[])[slotIdx];
  if(!session || typeof session !== 'object') return;
  var ch = CREATURES[session.champId];
  var name = ch ? ch.name : 'Champion';
  var purse = Math.floor(session.purse || 0);
  var msg = 'Pull ' + name + '? They leave with ' + purse + 'g.';
  if(window.confirm(msg)){
    _arenaRelease(slotIdx);
  }
}

// Map a champion's ascensionTier to a CSS class key for the tier chip.
function _arnTierKeyForChamp(cp){
  var tier = cp && cp.ascensionTier || 0;
  return ['base','ruby','emerald','sapphire','amethyst','diamond','opal'][tier] || 'base';
}
function _arnTierKeyForAsc(asc){
  return ['base','ruby','emerald','sapphire','amethyst','diamond','opal'][asc || 0] || 'base';
}
function _arnTierChipHTML(tierKey){
  var label = {base:'BASE',ruby:'RUBY',emerald:'EMERALD',sapphire:'SAPPHIRE',amethyst:'AMETHYST',diamond:'DIAMOND',opal:'BLACK OPAL'}[tierKey] || 'BASE';
  return '<span class="arn-tier-chip ' + tierKey + '">' + label + '</span>';
}

function _arnStatsHTML(stats, size){
  size = size || '';
  var cls = 'arn-stats' + (size === 'sm' ? ' sm' : '');
  return '<span class="' + cls + '">'
       +   '<span class="arn-stat str"><span class="arn-stat-label">STR</span><span class="arn-stat-val">' + (stats.str||0) + '</span></span>'
       +   '<span class="arn-stat agi"><span class="arn-stat-label">AGI</span><span class="arn-stat-val">' + (stats.agi||0) + '</span></span>'
       +   '<span class="arn-stat wis"><span class="arn-stat-label">WIS</span><span class="arn-stat-val">' + (stats.wis||0) + '</span></span>'
       + '</span>';
}

// ── Opponent preview card (shared by daily + duel opponent) ──
// Round 56/57: sibling-aligned layout that mirrors the Sanctum
// overview pane. Boxed portrait + name/level/tier in the info
// column, Sanctum-style stat tiles below, optional reward/relic
// line, CTA on the right. No smoke, no flavour, no card-count
// (R57: deck contents are intentionally hidden from the player
// until combat). Inline styles match the Sanctum pattern.
//
// opts: { rewardHtml?, ctaLabel, ctaOnclick, ctaDisabled?, ctaCleared?, questBannerHtml? }
function _arenaPreviewCardHTML(payload, opts){
  opts = opts || {};
  var ch = CREATURES[payload.id];
  var displayName = payload.name || (ch && ch.name) || payload.id;
  var lv = payload.lv || 1;
  var relCount = (payload.rel || []).length;
  var tierKey  = _arnTierKeyForAsc(payload.asc || 0);
  var stats    = { str: (payload.st && payload.st[0]) || 0, agi: (payload.st && payload.st[1]) || 0, wis: (payload.st && payload.st[2]) || 0 };

  var portrait;
  if(typeof creatureImgHTML === 'function' && ch){
    portrait = creatureImgHTML(payload.id, ch.icon||'❓', '88px');
  } else if(ch){
    portrait = '<span style="font-size:64px;">' + (ch.icon||'❓') + '</span>';
  } else {
    portrait = '<span style="font-size:64px;">❓</span>';
  }

  var fightBtnCls = 'arn-fight-btn' + (opts.ctaCleared ? ' cleared' : '');
  var disabledAttr = opts.ctaDisabled ? ' disabled' : '';

  // Sanctum-style stat tiles — vertical stack of label-over-value,
  // 3 tiles side-by-side. Numbers and labels are visually balanced
  // because they're stacked rather than inline.
  var statColors = {str:'#e88060', agi:'#9adc7e', wis:'#9ad8e8'};
  function statTile(key, val){
    var c = statColors[key];
    return '<div style="padding:6px 10px;background:#1a1208;border:1px solid #2a1808;border-left:3px solid '+c+';flex:1;">'
         +   '<div style="font-family:Cinzel,serif;font-size:9px;letter-spacing:2px;color:'+c+';">'+key.toUpperCase()+'</div>'
         +   '<div style="font-family:Cinzel,serif;font-size:18px;color:#e8d7a8;line-height:1;margin-top:2px;">'+val+'</div>'
         + '</div>';
  }
  var statsRow = '<div style="display:flex;gap:6px;">'
               +   statTile('str', stats.str)
               +   statTile('agi', stats.agi)
               +   statTile('wis', stats.wis)
               + '</div>';

  // Pre-compute optional rows (chained-+ ternary doesn't play nice
  // in JS — easier to flatten than fight the parser).
  var relicsRow = '';
  if(relCount > 0){
    relicsRow = '<div style="font-family:Cinzel,serif;font-size:9px;color:#7a6030;letter-spacing:.8px;">'
              + '<span style="color:#c0a060;">' + relCount + '</span> relic' + (relCount===1 ? '' : 's')
              + '</div>';
  }
  var rewardRow = '';
  if(opts.rewardHtml){
    rewardRow = '<div style="font-family:\'Crimson Text\',serif;font-size:11px;color:#c0a060;font-style:italic;margin-top:2px;">'
              + opts.rewardHtml
              + '</div>';
  }

  var html = ''
    + '<div style="border:1px solid #3a2010;background:linear-gradient(180deg,#1a1208,#120802);">'
    +   (opts.questBannerHtml || '')
    +   '<div style="display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:14px;">'
    // Portrait (boxed, Sanctum-style)
    +     '<div style="width:104px;height:104px;border:1px solid #2a1808;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);">'
    +       portrait
    +     '</div>'
    // Info column
    +     '<div style="min-width:0;display:flex;flex-direction:column;gap:8px;">'
    +       '<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">'
    +         '<span style="font-family:Cinzel,serif;font-size:16px;color:#d4a843;letter-spacing:1px;">' + displayName + '</span>'
    +         '<span style="font-family:Cinzel,serif;font-size:10px;color:#c0a060;letter-spacing:1.2px;">LV ' + lv + '</span>'
    +         _arnTierChipHTML(tierKey)
    +       '</div>'
    +       statsRow
    +       relicsRow
    +       rewardRow
    +     '</div>'
    // CTA column
    +     '<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:stretch;justify-content:center;min-width:140px;">'
    +       '<button class="' + fightBtnCls + '" onclick="' + (opts.ctaOnclick || '') + '"' + disabledAttr + '>' + (opts.ctaLabel || 'BEGIN') + '</button>'
    +     '</div>'
    +   '</div>'
    + '</div>';
  return html;
}

// Format a seconds value as "Xs" / "Xm Ys" / "Xh Ym"
function _arenaFmtSecs(s){
  if(s < 60) return Math.round(s)+'s';
  if(s < 3600){
    var m = Math.floor(s/60);
    var rs = Math.round(s - m*60);
    return rs > 0 ? (m+'m '+rs+'s') : (m+'m');
  }
  var h = Math.floor(s/3600);
  var rm = Math.round((s - h*3600)/60);
  return rm > 0 ? (h+'h '+rm+'m') : (h+'h');
}

// ════════════════════════════════════════════════════════════════
// DUEL tab (Round 50) — unified: quest preload + code load + export
// ════════════════════════════════════════════════════════════════
//
// On open, the tab scans active quests for type === 'arena_fight'. If
// found, the first one is preloaded as the opponent (preview card +
// big BEGIN). Player can override by pasting their own code (decoding
// switches the preview to that code's payload). Below the opponent
// section is a compact "Export your champion" panel for sharing.
//
// State priority:
//   1. Quest preload (if active arena_fight quest AND no code loaded)
//   2. Code-loaded payload (if player decoded one in this session)
//   3. Empty (placeholder "load a code or accept an arena quest")

// Ephemeral state — code input + decoded payload (or error). Reset
// to {null,null,''} when the player clicks CLEAR or panel closes.
var _arenaDuelLoadState = { payload: null, error: null, codeStr: '' };

function _arenaRenderDuel(){
  var s = _arenaDuelLoadState;
  var quest = _arenaFindActiveQuest();    // null or {active, quest}

  // Section A: OPPONENT — preference order: loaded code > quest > empty
  // Round 56: no mode tags, no italic flavour, no "for sport only" copy.
  // The quest banner stays — it's data (which quest, what progress), not flavour.
  var opponentHtml = '';
  if(s.payload){
    opponentHtml = _arenaPreviewCardHTML(s.payload, {
      ctaLabel: 'BEGIN',
      ctaOnclick: '_arenaDuelBeginLoaded()'
    });
  } else if(quest){
    var q = quest.quest;
    var prog = (quest.active.progress||0) + ' / ' + (q.target||1);
    var rewardLine = (q.reward && q.reward.gold)
      ? 'Reward: <span style="color:#d4a843;">+'+q.reward.gold+'g</span>'
        + (q.reward.mastery ? ' · <span style="color:#9ad8e8;">+'+q.reward.mastery+' mastery</span>' : '')
      : '';
    var questBanner = '<div class="arn-quest-ribbon">'
                    +   '<span class="arn-quest-ribbon-lbl">◆ QUEST · ' + (q.title || 'Arena Quest').toUpperCase() + '</span>'
                    +   '<span class="arn-quest-ribbon-prog">' + prog + '</span>'
                    + '</div>';
    opponentHtml = _arenaPreviewCardHTML(q.fight, {
      rewardHtml: rewardLine,
      ctaLabel: 'BEGIN',
      ctaOnclick: '_arenaDuelBeginQuest(\'' + q.id + '\')',
      questBannerHtml: questBanner
    });
  } else {
    opponentHtml = '<div class="arn-empty-card">No opponent loaded.</div>';
  }

  // Section B: LOAD OPPONENT CODE
  var loaderTitle = s.payload ? 'LOAD DIFFERENT OPPONENT' : 'LOAD OPPONENT CODE';
  var loaderHtml = '<div class="arn-code-box">'
                 +   '<textarea class="arn-code-textarea" id="arena-duel-code-in" placeholder="nopo:v1:..." '
                 +     'oninput="_arenaDuelLoadState.codeStr = this.value;">' + (s.codeStr || '') + '</textarea>'
                 +   (s.error ? '<div class="arn-code-error">' + s.error + '</div>' : '')
                 +   '<div class="arn-code-actions">'
                 +     '<div class="arn-code-actions-left">'
                 +       '<button class="arn-fight-btn small" onclick="_arenaDuelDecode()">DECODE</button>'
                 +       (s.payload ? '<button class="arn-code-btn-cancel" onclick="_arenaDuelClearLoaded()">CLEAR</button>' : '')
                 +       '<button class="arn-code-btn-example" onclick="_arenaDuelPasteExample()">paste example</button>'
                 +     '</div>'
                 +     '<span class="arn-code-charcount">' + (s.codeStr || '').length + ' chars</span>'
                 +   '</div>'
                 + '</div>';

  return ''
    + _arnSectionTitle('OPPONENT', '')
    + opponentHtml
    + _arnSectionTitle(loaderTitle, '')
    + loaderHtml
    + _arnSectionTitle('SHARE YOUR CHAMPION', '')
    + _arenaRenderDuelExport();
}

// "paste example" — drops a sample code into the textarea so the
// player can see the decode flow without needing a friend's code.
function _arenaDuelPasteExample(){
  // Generate a code from the currently-selected champion if possible;
  // otherwise from any unlocked champion. Real code = always parseable.
  var champId = (typeof selectedChampId === 'string') ? selectedChampId : null;
  if(!champId || !CREATURES[champId]){
    champId = (PERSIST.unlockedChamps && PERSIST.unlockedChamps[0]) || 'druid';
  }
  try {
    var code = encodeChampionCode(champId);
    _arenaDuelLoadState.codeStr = code;
    _arenaRenderTabBody('duel');
  } catch(e){
    if(typeof showTownToast === 'function') showTownToast('Could not generate example.');
  }
}

function _arenaDuelDecode(){
  var ta = document.getElementById('arena-duel-code-in');
  var raw = ta ? ta.value : (_arenaDuelLoadState.codeStr || '');
  _arenaDuelLoadState.codeStr = raw;
  var res = tryDecodeArenaCode(raw);
  if(res.ok){
    _arenaDuelLoadState.payload = res.payload;
    _arenaDuelLoadState.error = null;
  } else {
    _arenaDuelLoadState.payload = null;
    _arenaDuelLoadState.error = res.error;
  }
  _arenaRenderTabBody('duel');
}

function _arenaDuelClearLoaded(){
  _arenaDuelLoadState = { payload: null, error: null, codeStr: '' };
  _arenaRenderTabBody('duel');
}

function _arenaDuelBeginLoaded(){
  var payload = _arenaDuelLoadState.payload;
  if(!payload) return;
  if(typeof closeBuildingPanel === 'function') closeBuildingPanel('arena');
  startArenaCombat({
    payload: payload,
    context: 'challenge',
    onWin: function(){
      if(typeof showTownToast === 'function'){
        showTownToast('Defeated '+(payload.name || (CREATURES[payload.id] && CREATURES[payload.id].name) || 'opponent')+'.');
      }
    },
    onLoss: null
  });
}

function _arenaDuelBeginQuest(questId){
  var quests = (PERSIST.town && PERSIST.town.quests) || {};
  var q = (quests.offered||[]).find(function(o){ return o.id === questId; });
  if(!q || q.type !== 'arena_fight' || !q.fight){
    if(typeof showTownToast === 'function') showTownToast('Quest unavailable.');
    return;
  }
  if(typeof closeBuildingPanel === 'function') closeBuildingPanel('arena');
  startArenaCombat({
    payload: q.fight,
    context: 'quest',
    contextData: { questId: questId },
    onWin: function(){
      // Quest progress hook fires in finishArenaRunWin; reward
      // is handed out here if the quest just completed.
      var quests2 = (PERSIST.town && PERSIST.town.quests) || {};
      var active2 = (quests2.active||[]).find(function(a){ return a.id === questId; });
      if(active2 && active2.progress >= q.target && q.reward){
        if(q.reward.gold)    PERSIST.gold = (PERSIST.gold||0) + q.reward.gold;
        if(q.reward.mastery && typeof selectedChampId === 'string' && selectedChampId && typeof addMasteryXp === 'function'){
          addMasteryXp(selectedChampId, q.reward.mastery);
        }
        savePersist();
      }
    },
    onLoss: null
  });
}

// (Round 52: _arenaPreviewCardHTML removed — the smaller two-line
// preview card was replaced by the smoke-portrait card design
// (_arenaSmokeCardHTML) which both WAGERS daily and DUEL opponent
// now share. The .arena-prev-* CSS rules were dropped alongside.)

// ════════════════════════════════════════════════════════════════
// DAILY CHALLENGE — UTC midnight rotation + seeded generation
// ════════════════════════════════════════════════════════════════
//
// One challenge per UTC day, deterministic from the date string.
// Same seed → same opponent for everyone (supports a future
// leaderboard without needing a server today).
//
// First clear of the day pays a chunky reward (medium gold + decent
// mastery to the participating champion). Re-fights are free but
// give nothing. Rolls over at UTC midnight.

// "YYYY-MM-DD" for the current UTC date.
function _arenaDailyYMD(){
  var d = new Date();
  var y = d.getUTCFullYear();
  var m = d.getUTCMonth() + 1;
  var dd = d.getUTCDate();
  return y + '-' + (m<10?'0':'') + m + '-' + (dd<10?'0':'') + dd;
}

// Seconds until next UTC midnight.
function _arenaSecsUntilNextDaily(){
  var now = new Date();
  var next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(0, Math.floor((next - now) / 1000));
}

// Hash a string to a 32-bit integer (FNV-1a). Used to seed mulberry32.
function _arenaHashStr(str){
  var h = 0x811c9dc5;
  for(var i=0; i<str.length; i++){
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// Mulberry32 — small deterministic RNG. Returns a function: seed →
// () → [0,1). Same seed always yields the same sequence.
function _arenaMakeRng(seedInt){
  var s = seedInt >>> 0;
  return function(){
    s = (s + 0x6D2B79F5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate today's challenge payload from the YMD seed. Pure function:
// same seed → same payload. Player's progression doesn't influence the
// roll (so leaderboard fairness holds).
function _arenaGenerateDailyChallenge(seedYMD){
  var seed = _arenaHashStr('arena-daily-' + seedYMD);
  var rng = _arenaMakeRng(seed);

  // Eligible creature pool: any CREATURES entry with a defined deck
  // and baseStats. Filter out player champions to avoid pasting a
  // mirror match (less interesting for a daily).
  var poolIds = [];
  if(typeof CREATURES !== 'undefined'){
    Object.keys(CREATURES).forEach(function(id){
      var c = CREATURES[id];
      if(!c || !c.baseStats) return;
      if(!c.deck && !c.deckOrder) return;
      // Skip overtly playable champions (they have isChampion or playable flag)
      if(c.isChampion || c.playable) return;
      poolIds.push(id);
    });
  }
  if(!poolIds.length){
    // Pathological fallback — no enemies in the bestiary. Use a dummy.
    return {
      v: ARENA_CODE_VERSION, t: 'creature', id: 'goblin',
      lv: 5, asc: 0, st: [20,15,10],
      deck: ['strike','strike','strike','brace'], rel: []
    };
  }
  var pickIdx = Math.floor(rng() * poolIds.length);
  var enemyId = poolIds[pickIdx];
  var ch = CREATURES[enemyId];

  // Daily level: 5-12 baseline, scaled gently. Real difficulty comes
  // from stat-curve scaling in the buildArea formula at startArenaCombat.
  var lv = 5 + Math.floor(rng() * 8);
  // Stats: standard creature growth formula at chosen level.
  var str = Math.round(ch.baseStats.str + (lv-1) * (ch.growth ? (ch.growth.str||0) : 0));
  var agi = Math.round(ch.baseStats.agi + (lv-1) * (ch.growth ? (ch.growth.agi||0) : 0));
  var wis = Math.round(ch.baseStats.wis + (lv-1) * (ch.growth ? (ch.growth.wis||0) : 0));

  // 1 random relic ~50% of the time; 2 ~10%. Skipped if RELICS missing.
  var relics = [];
  if(typeof RELICS !== 'undefined'){
    var relicIds = Object.keys(RELICS);
    if(relicIds.length){
      var roll = rng();
      var nRelics = roll < 0.10 ? 2 : (roll < 0.60 ? 1 : 0);
      for(var r=0; r<nRelics; r++){
        var pickedRelic = relicIds[Math.floor(rng() * relicIds.length)];
        if(relics.indexOf(pickedRelic) === -1) relics.push(pickedRelic);
      }
    }
  }

  return {
    v: ARENA_CODE_VERSION,
    t: 'creature',
    id: enemyId,
    name: ch.name + ' (Daily)',
    lv: lv,
    asc: 0,
    st: [str, agi, wis],
    deck: (ch.deck && ch.deck.slice()) || ['strike','strike','brace'],
    rel: relics
  };
}

// Make sure today's daily is fresh on the building. Regenerates if
// the stored seedYMD doesn't match today's UTC date.
function _arenaEnsureDailyFresh(){
  var b = PERSIST.town.buildings.arena;
  if(!b) return;
  var today = _arenaDailyYMD();
  if(b.dailySeedYMD !== today){
    b.dailySeedYMD = today;
    b.dailyChallenge = _arenaGenerateDailyChallenge(today);
    b.dailyCompleted = false;
    savePersist();
  } else if(!b.dailyChallenge){
    // Same day but no payload yet (e.g. first ever load) — generate.
    b.dailyChallenge = _arenaGenerateDailyChallenge(today);
    savePersist();
  }
}

// Round 50: _arenaRenderDaily removed — daily headline now lives at
// the TOP of the WAGERS tab via _arenaRenderWagersDaily, called from
// _arenaRenderWagers. _arenaDailyBegin stays — it's the "fight the
// daily" entry point and is wired to the headline card's BEGIN button.

// Daily reward formula (Round 54): scaled to the creature's level,
// roughly 50% of what clearing an area at that level pays. Per-enemy
// gold in regular combat is `3 + lv*2`; an area has ~5-8 enemies, so
// a full clear nets ~50-200g around mid levels. Daily's single-fight
// payout sits at half that. Mastery scales similarly.
function _arenaDailyRewards(lv){
  lv = Math.max(1, lv || 1);
  return {
    gold:    15 + lv * 8,
    mastery: 10 + lv * 2
  };
}

function _arenaDailyBegin(){
  var b = PERSIST.town.buildings.arena;
  if(!b || !b.dailyChallenge) return;
  if(b.dailyCompleted) return;  // Round 54: no re-fights — button is disabled when cleared
  var payload = b.dailyChallenge;
  if(typeof closeBuildingPanel === 'function') closeBuildingPanel('arena');
  startArenaCombat({
    payload: payload,
    context: 'daily',
    contextData: { seedYMD: b.dailySeedYMD },
    onWin: function(){
      var bb = PERSIST.town.buildings.arena;
      if(!bb) return;
      // Reward scaled to the daily creature's level (50% of area clear).
      var rewards = _arenaDailyRewards(payload.lv || 1);
      PERSIST.gold = (PERSIST.gold||0) + rewards.gold;
      if(typeof selectedChampId === 'string' && selectedChampId && typeof addMasteryXp === 'function'){
        addMasteryXp(selectedChampId, rewards.mastery);
      }
      bb.dailyCompleted = true;
      savePersist();
      if(typeof showTownToast === 'function'){
        showTownToast('Daily cleared! +'+rewards.gold+' gold · +'+rewards.mastery+' mastery');
      }
    },
    onLoss: null
  });
}



// ── DUEL: export sub-section ────────────────────────────────────
// Round 50: was its own tab in Round 48 ("DUEL CODES") and Round 49
// trimmed to "current champion only". Now lives at the bottom of the
// unified DUEL tab as a compact section. Same export contract — code
// is a snapshot of the currently-selected champion's persist state.
var _arenaDuelState = { lastChamp: null, code: '', copied: false };

function _arenaRenderDuelExport(){
  var champId = (typeof selectedChampId === 'string') ? selectedChampId : null;
  if(!champId){
    return '<div class="arn-share-box">'
         +   '<div class="arn-empty-card">No champion selected. Visit the champion select screen first.</div>'
         +   '<div style="margin-top:10px;display:flex;justify-content:center;">'
         +     '<button class="arn-share-btn-switch" onclick="_arenaDuelGoToSelect()">SELECT A CHAMPION</button>'
         +   '</div>'
         + '</div>';
  }

  // Invalidate cached code if the selected champion changed since last render
  if(_arenaDuelState.lastChamp !== champId){
    _arenaDuelState.lastChamp = champId;
    _arenaDuelState.code = '';
    _arenaDuelState.copied = false;
  }

  var s = _arenaDuelState;
  var ch = CREATURES[champId];
  var cp = getChampPersist(champId);
  var deckPreview = (typeof buildStartDeck === 'function') ? buildStartDeck(champId) : [];
  var relicCount  = (cp.relics||[]).length;
  var tierKey = _arnTierKeyForChamp(cp);
  var portrait = (typeof creatureImgHTML === 'function')
    ? creatureImgHTML(champId, ch.icon||'❓', '48px', 'flip-x')
    : '';

  var html = ''
    + '<div class="arn-share-box">'
    +   '<div class="arn-share-row">'
    +     '<div class="arn-share-portrait">' + portrait + '</div>'
    +     '<div class="arn-share-info">'
    +       '<div class="arn-share-name-row">'
    +         '<span class="arn-share-name">' + (ch ? ch.name : champId) + '</span>'
    +         '<span class="arn-share-lv">LV ' + (cp.level||1) + '</span>'
    +         _arnTierChipHTML(tierKey)
    +         '<span class="arn-share-extra"><span class="v">' + deckPreview.length + '</span> cards · <span class="v">' + relicCount + '</span> relics</span>'
    +       '</div>'
    +       '<div style="margin-top:4px;">'
    +         _arnStatsHTML(cp.stats, 'sm')
    +       '</div>'
    +     '</div>'
    +     '<button class="arn-share-btn-switch" onclick="_arenaDuelGoToSelect()">SELECT DIFFERENT</button>'
    +     '<button class="arn-share-btn-encode" onclick="_arenaDuelEncode()">' + (s.code ? 'RE-ENCODE' : 'ENCODE') + '</button>'
    +   '</div>';

  if(s.code){
    html += '<div class="arn-share-code-wrap">'
         +    '<div class="arn-share-code-label">SHAREABLE CODE</div>'
         +    '<textarea class="arn-share-code-out" readonly onclick="this.select();">' + s.code + '</textarea>'
         +    '<div class="arn-share-code-actions">'
         +      '<span class="arn-code-charcount">' + s.code.length + ' chars</span>'
         +      '<button class="arn-share-btn-copy' + (s.copied ? ' copied' : '') + '" onclick="_arenaDuelCopy()">' + (s.copied ? '✓ COPIED' : 'COPY') + '</button>'
         +    '</div>'
         +  '</div>';
  }
  html += '</div>';
  return html;
}

// Take the player to the champion-select screen so they can change
// their active champion. Arena panel closes; player comes back to
// reopen Arena → DUEL once they've picked someone.
function _arenaDuelGoToSelect(){
  if(typeof closeBuildingPanel === 'function') closeBuildingPanel('arena');
  if(typeof showScreen === 'function')        showScreen('select-screen');
  if(typeof showNav === 'function')           showNav(true);
  if(typeof updateNavBar === 'function')      updateNavBar('adventure');
}

function _arenaDuelEncode(){
  var champId = (typeof selectedChampId === 'string') ? selectedChampId : null;
  if(!champId) return;
  try {
    _arenaDuelState.code = encodeChampionCode(champId);
    _arenaDuelState.copied = false;
  } catch(e){
    if(typeof showTownToast === 'function') showTownToast(e.message || 'Encode failed.');
    return;
  }
  _arenaRenderTabBody('duel');
}

function _arenaDuelCopy(){
  var code = _arenaDuelState.code;
  if(!code) return;
  // Prefer the modern clipboard API; fall back to a hidden-textarea select.
  var done = false;
  try {
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(code).then(function(){
        _arenaDuelState.copied = true;
        _arenaRenderTabBody('duel');
      }, function(){ /* fall through to manual */ });
      done = true;
    }
  } catch(e){}
  if(!done){
    // Manual fallback — find the textarea, select, exec copy
    var ta = document.querySelector('.arn-share-code-out');
    if(ta){
      ta.select();
      try { document.execCommand('copy'); _arenaDuelState.copied = true; } catch(e){}
      _arenaRenderTabBody('duel');
    }
  }
  if(typeof playUiClickSfx === 'function') playUiClickSfx();
}
