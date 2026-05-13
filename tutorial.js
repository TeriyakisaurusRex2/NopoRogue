// ════════════════════════════════════════════════════════════════
// TUTORIAL  (Round 66 → 67b)
// ════════════════════════════════════════════════════════════════
// Pre-scripted wolf-vs-goblin fight that pauses combat at scripted
// beats to introduce the player to the basics. Mandatory on first
// launch (after BEGIN from the login card), with a SKIP option on
// the intro dialog only. Not replayable — set tutorialComplete=true
// once skipped or finished and never offer again.
//
// Round 67b: narration rewritten to be dry/factual with minimal
// flavour. Mechanics are named by their UI labels (Health, Mana,
// STR/AGI/WIS, Strike, Brace, Shield, Haste, Weaken) so the
// player can match narrator words to what they see on screen.
//
// Voice: the narrator is the "mysterious figure"
// (assets/creatures/mysterious_figure.png) addressing the WOLF as
// if it were a champion. After the prelude the player has no
// in-universe reference for what they witnessed.
//
// Pause primitive: the existing global `paused` flag in game.js
// (togglePause). When paused, gameTick early-returns and every
// animation / timer guard short-circuits.
// ════════════════════════════════════════════════════════════════

// ── State ───────────────────────────────────────────────────────
// Module-level. The PERSIST.tutorialComplete flag lives on the save
// so a player only sees the tutorial once per save.
var _tutorial = {
  active:        false,   // currently in the tutorial flow
  step:          -1,      // index into TUTORIAL_STEPS, -1 = not yet started
  waitFor:       null,    // event token the current step is waiting on (or null = manual)
  playedSet:     {},      // set of cardIds played, reset on step entry — used by 'play_both' waits
  fallbackT:     null,    // setTimeout handle for safety fallbacks (e.g. force-apply Weaken if goblin AI dawdles)
  area:          null,    // Round 67j: stored area for retry-on-defeat
  retryStartStep:null,    // Round 67j: when set, _tutorialStartFromTop uses this as the starting step (so retry skips orientation)
};

// Round 67b: rewritten for dry, factual narration with minimal flavour.
// Mechanics are named by their actual UI labels (Health, Mana, STR/AGI/
// WIS, Strike, Brace, Shield, Haste, Weaken) so the player can match
// what the narrator says to what they see on screen.
//
// Beat groupings (per J's request):
//   1-6: orientation (paused, no gaps)
//   7  : combined Strike + Brace play (any order)
//   8  : Shield explanation (immediately after both played)
//   ---- combat continues, wolf_howl injected as next draw ----
//   9  : play Howl
//   10 : Haste / buff / duration
//   11 : Sorcery + card modifiers (advancing this triggers goblin to
//        play jab on its next turn for the debuff teach)
//   ---- combat continues, goblin plays jab + Sorcery applies Weaken ----
//   12 : Debuff explanation
//   13 : Closer → victory
//
// Special wait types:
//   'play_both:strike,brace' — wait for BOTH cards to be played
//   'status_applied:weaken'  — wait for Weaken debuff on player
//
// onAdvance side-effects (fire when this step's NEXT is clicked):
//   'inject_howl'      — replace drawPool with [wolf_howl] so the
//                        next draw is guaranteed to be Howl
//   'force_goblin_jab' — replace goblin's hand with [goblin_jab] +
//                        set their mana to 35 so the Sorcery fires
// Step fields:
//   text       — narration (omit on transitional steps)
//   highlight  — CSS selector for the UI element to spotlight
//   wait       — what advances the step
//   onAdvance  — side-effect on NEXT click (e.g. inject_howl)
//   transitional:true — no pause, no dialog. Step exists only to
//                       wait for an event and advance. Used to bridge
//                       between an action and its visible result (e.g.
//                       wait for the card to be drawn / status to apply
//                       before painting the next narration beat).
var TUTORIAL_STEPS = [
  // ── Pre-combat orientation (paused, manual NEXT) ──
  { text: 'Wolf. Watch and remember.',
    highlight: null, wait: 'click' },

  { text: 'Your health. At zero, the run ends.',
    highlight: '#combatant-player .big-hp-wrap', wait: 'click' },

  { text: "The enemy's health. Reduce it to zero to win.",
    highlight: '#combatant-enemy .big-hp-wrap', wait: 'click' },

  { text: 'Mana. Used by some abilities and effects. Regenerates over time.',
    highlight: '#mana-bar2', wait: 'click' },

  { text: "Stats. STR, AGI, WIS. They shape your champion's strengths.",
    highlight: '.tb-stats', wait: 'click' },

  { text: 'Cards draw automatically when this bar fills.',
    highlight: '#draw-bar', wait: 'click' },

  // ── Combined card play ──
  { text: 'Strike deals damage. Brace grants Shield for 5 seconds. Play one of each.',
    highlight: '.hand-cards .card', wait: 'play_both:strike,brace' },

  { text: 'Shield absorbs damage. It expires after 5 seconds.',
    highlight: '#p-shield-bar', wait: 'click', onAdvance: 'inject_howl' },

  // Transitional: wait for wolf_howl to land in the player's hand
  // before painting the Howl prompt. Without this the dialog appears
  // before the card has been drawn (J's bug report Round 67d).
  { transitional: true, wait: 'card_drawn:wolf_howl' },

  // ── Howl + Haste + Sorcery ──
  { text: 'Howl. Grants Haste, a temporary buff. Play it.',
    highlight: '.hand-cards .card', wait: 'play_card:wolf_howl' },

  // Transitional: play_card fires BEFORE card resolution, so Haste
  // hasn't applied yet at this point. Wait for it to actually land
  // before showing the Haste dialog.
  { transitional: true, wait: 'status_applied:haste' },

  { text: 'Haste — a buff. It speeds your draws for 4 seconds. Buffs have a duration. When it expires, the effect ends.',
    highlight: '#p-tags', wait: 'click' },

  { text: 'Howl also has a [Sorcery] effect. With 40 mana, it adds Crit to your next attack. Card modifiers like this appear as green text on cards.',
    highlight: '#mana-bar2', wait: 'click', onAdvance: 'force_goblin_jab' },

  // ── Debuff (driven by goblin playing jab with Sorcery) ──
  { text: 'Weaken — a debuff. It reduces your damage for 4 seconds. Like buffs, debuffs have a duration and expire.',
    highlight: '#p-tags', wait: 'status_applied:weaken' },

  // ── Finish ──
  { text: 'Finish the fight.',
    highlight: null, wait: 'victory' },

  // ── Conclusion (post-victory) ──
  // After the goblin dies, the narrator delivers a closing line and
  // the player clicks through to the champion-select screen. The
  // tutorial state machine drives this transition itself — no more
  // setTimeout in checkEnd, no more split between victory-event and
  // screen-change.
  { text: 'It is done. Another road waits for you.',
    highlight: null, wait: 'click' },
];

// ════════════════════════════════════════════════════════════════
// ENTRY POINT (called from enterGameFromLogin in game.js)
// ════════════════════════════════════════════════════════════════
// Returns true if the tutorial was triggered (caller should NOT
// continue into the normal champion-select flow). Returns false if
// the tutorial was skipped or already complete (caller continues).
function maybeStartTutorial(){
  if(PERSIST.tutorialComplete) return false;
  // Mandatory on the first run-through. Intro dialog has the SKIP.
  _tutorialShowIntro();
  return true;
}

// ── Intro dialog (modal on the login screen — NOT a combat pause) ──
function _tutorialShowIntro(){
  // Build the overlay if not present.
  var ov = document.getElementById('tut-intro-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'tut-intro-overlay';
    ov.className = 'tut-intro-overlay';
    document.body.appendChild(ov);
  }
  ov.innerHTML = ''
    + '<div class="tut-intro-box">'
    +   '<div class="tut-intro-portrait">'
    +     '<img class="flip-x" src="assets/creatures/mysterious_figure.png" alt="???" onerror="this.outerHTML=\'<span style=&quot;font-size:64px;color:#5a4060;&quot;>?</span>\'">'
    +   '</div>'
    +   '<div class="tut-intro-name">???</div>'
    +   '<div class="tut-intro-body">'
    +     'A creature waits beneath. Learn to hunt it, and you will live a while longer.'
    +   '</div>'
    +   '<div class="tut-intro-actions">'
    +     '<button class="tut-intro-btn primary" onclick="_tutorialBegin()">BEGIN ►</button>'
    +     '<button class="tut-intro-btn skip" onclick="_tutorialSkip()">skip combat tutorial</button>'
    +   '</div>'
    + '</div>';
  ov.classList.add('show');
}

function _tutorialBegin(){
  var ov = document.getElementById('tut-intro-overlay');
  if(ov) ov.classList.remove('show');
  _tutorial.active = true;
  _tutorial.step = -1;
  _tutorial.waitFor = null;
  _tutorial.playedSet = {};
  // Mark scripted run state, then enter combat as the dire wolf in a
  // goblin area. game.js's startRun reads gs._tutorial after makeGS
  // to apply the deck / hand / stat / enemy overrides.
  // Round 67c: switched from regular wolf → dire_wolf. The dire wolf
  // is a high-tier creature with a passive "double crit" innate. It's
  // NOT in the player's default unlockedChamps — they only inhabit
  // it for the tutorial, then choose their own champion afterwards.
  selectedChampId = 'dire_wolf';
  // Round 67f: custom tutorial-only area "The Deep Woods". Defined
  // inline (NOT in AREA_DEFS) so generateAreas doesn't surface it in
  // the normal area-select grid — it's a one-off narrative location
  // the mysterious figure drops the wolf into. The combat background
  // is forced to forest_2.png via the gated setCombatBackground call
  // in startRun (which checks gs._tutorial). The begin-battle modal
  // will read this def.name correctly so the player sees "THE DEEP
  // WOODS" instead of "THE SEWERS" on the goblin card.
  var tutorialDef = {
    id:            'deep_woods',
    name:          'THE DEEP WOODS',
    icon:          '🌲',
    materialGroup: 'forest',
    levelRange:    [1, 1],
    theme:         'a hush between the trees; something watches',
    lore:          'Where the road forgets to follow.',
    enemyPool:     ['goblin'],
    singleEnemy:   true,
    bg:            '#0a0d06',
  };
  var area = (typeof buildArea === 'function') ? buildArea(tutorialDef, 1) : { def:tutorialDef, level:1, enemies:[] };
  selectedArea = area;
  // Round 67j: stash for retry-on-defeat so we can rebuild combat
  // against the same goblin without rebuilding the area.
  _tutorial.area = area;
  if(typeof showNav === 'function') showNav(false); // hide nav during tutorial
  if(typeof showScreen === 'function') showScreen('game-screen');
  if(typeof startRun === 'function') startRun(selectedChampId, area);
  // Round 67e: setCombatBackground is gated inside startRun now —
  // when gs._tutorial is true, it loads forest_2.png directly
  // instead of the area def.id. No duplicate call here, no race.
  // The actual step 0 dialog fires from inside startBattle via
  // _tutorialStartFromTop() — the begin-battle-modal sits in between
  // startRun and startBattle, and we want the tutorial to kick off
  // AFTER the player has dismissed that modal and combat is live.
}

// Called from the end of startBattle when isTutorialActive() is true.
// Resets the step counter to 0 (or to retryStartStep if a retry is
// in flight) and paints the first dialog.
function _tutorialStartFromTop(){
  // Round 67j: retry jumps past orientation to the combined-play
  // beat. retryStartStep is set by _tutorialRetry before triggering
  // a fresh startRun, and consumed (cleared) here.
  _tutorial.step = (_tutorial.retryStartStep !== null && _tutorial.retryStartStep !== undefined)
    ? _tutorial.retryStartStep
    : 0;
  _tutorial.retryStartStep = null;
  _tutorial.waitFor = null;
  _tutorial.playedSet = {};
  _tutorialEnterStep();
}

function _tutorialSkip(){
  var ov = document.getElementById('tut-intro-overlay');
  if(ov) ov.classList.remove('show');
  _tutorial.active = false;
  PERSIST.tutorialComplete = true;
  // Round 67l: story quest activation TABLED (see _tutorialFinishToChampSelect).
  // _activateStoryQuest(STORY_QUESTS.pick_first_champion);
  if(typeof savePersist === 'function') savePersist();
  // Continue into the normal champion-select flow.
  if(typeof showNav === 'function') showNav(true);
  if(typeof showScreen === 'function') showScreen('select-screen');
  if(typeof updateNavBar === 'function') updateNavBar('adventure');
  if(typeof buildSelectScreen === 'function') buildSelectScreen();
}

// ════════════════════════════════════════════════════════════════
// IN-COMBAT STEP MACHINE
// ════════════════════════════════════════════════════════════════

// Enter the current step: pause combat, render dialog + highlight.
// Reset per-step tracking state (playedSet for play_both waits).
//
// Transitional steps (step.transitional === true) have no dialog and
// don't pause combat. They exist solely to wait for an event before
// the next dialog step paints. Used to bridge between an action
// (e.g. play_card) and its visible result (e.g. status applied) so
// the next narration beat fires only after the player can see the
// effect on screen.
function _tutorialEnterStep(){
  if(!_tutorial.active) return;
  var step = TUTORIAL_STEPS[_tutorial.step];
  if(!step){ console.log('[tut] no step at index', _tutorial.step, '→ end'); _tutorialEnd(); return; }
  _tutorial.playedSet = {};
  console.log('[tut] ENTER step', _tutorial.step, step.transitional ? '(transitional)' : '(dialog)', 'wait:', step.wait, 'text:', step.text);

  if(step.transitional){
    // Don't paint a dialog — just arm the wait and let combat run.
    // Round 67h: explicitly unpause. If we got here via a click-step
    // advance (which keeps paused=true so the NEXT dialog can paint
    // pre-paused), the transitional step would stay frozen forever
    // because click-advance doesn't unpause and transitional needs
    // combat to tick (e.g. for draw timer → card_drawn event).
    _tutorial.waitFor = step.wait || null;
    paused = false;
    if(typeof scheduleEnemyAction === 'function') scheduleEnemyAction();
    return;
  }

  try {
    paused = true;
    _tutorial.waitFor = null;
    if(_tutorial.fallbackT){ clearTimeout(_tutorial.fallbackT); _tutorial.fallbackT = null; }
    _tutorialShowDialog(step);
    _tutorialApplyHighlight(step.highlight);
    console.log('[tut] dialog shown for step', _tutorial.step);
  } catch(err){
    console.error('[tut] FAILED to enter step', _tutorial.step, err);
    // Defensive: don't leave combat paused if the dialog broke
    paused = false;
    if(typeof scheduleEnemyAction === 'function') scheduleEnemyAction();
  }
}

// Render the dialog box. Mystery figure portrait + text + NEXT.
function _tutorialShowDialog(step){
  var ov = document.getElementById('tut-combat-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'tut-combat-overlay';
    ov.className = 'tut-combat-overlay';
    document.body.appendChild(ov);
  }
  ov.innerHTML = ''
    + '<div class="tut-combat-dialog">'
    +   '<div class="tut-combat-dialog-portrait">'
    +     '<img class="flip-x" src="assets/creatures/mysterious_figure.png" alt="???" onerror="this.outerHTML=\'<span style=&quot;font-size:48px;color:#5a4060;&quot;>?</span>\'">'
    +   '</div>'
    +   '<div class="tut-combat-dialog-body">'
    +     '<div class="tut-combat-dialog-name">???</div>'
    +     '<div class="tut-combat-dialog-text">' + step.text + '</div>'
    +   '</div>'
    +   '<button class="tut-combat-dialog-next" onclick="_tutorialNext()">NEXT ►</button>'
    + '</div>';
  ov.classList.add('show');
}

// Highlight management — adds .tut-highlight to the target(s).
// Round 66d: dim via CSS filter (see style.css). Filter on parent
// dims; child filter compounds back to ~normal brightness, so the
// highlight escapes without z-index gymnastics.
function _tutorialApplyHighlight(selector){
  _tutorialClearHighlight();
  if(!selector) return;
  document.body.classList.add('tut-dim-mode');
  try{
    document.querySelectorAll(selector).forEach(function(el){
      el.classList.add('tut-highlight');
    });
  } catch(e){ /* selector miss — fine, just no highlight */ }
}
function _tutorialClearHighlight(){
  document.body.classList.remove('tut-dim-mode');
  document.querySelectorAll('.tut-highlight').forEach(function(el){
    el.classList.remove('tut-highlight');
  });
}

// NEXT clicked. Behaviour depends on the step's wait type:
//   click  → close dialog, advance to next step (still paused)
//   anything-else → close dialog, set waitFor token, unpause combat
// Also fires the step's onAdvance side-effect (e.g. inject_howl).
function _tutorialNext(){
  if(!_tutorial.active) return;
  var step = TUTORIAL_STEPS[_tutorial.step];
  if(!step) return;
  _tutorialClearHighlight();
  var ov = document.getElementById('tut-combat-overlay');
  if(ov) ov.classList.remove('show');

  // Fire the side-effect (if any) before advancing — gives the
  // injected card / forced goblin play time to take effect by
  // the time the next event-driven wait kicks off.
  if(step.onAdvance && typeof _tutorialSideEffect === 'function'){
    _tutorialSideEffect(step.onAdvance);
  }

  if(step.wait === 'click'){
    _tutorial.step += 1;
    if(_tutorial.step >= TUTORIAL_STEPS.length){
      _tutorialEnd();
    } else {
      // Stay paused, paint the next dialog.
      _tutorialEnterStep();
    }
    return;
  }

  // Event-driven wait — resume combat and arm the event listener.
  _tutorial.waitFor = step.wait;
  paused = false;
  if(typeof scheduleEnemyAction === 'function') scheduleEnemyAction();
}

// Called from game.js when relevant combat events happen. type is
// one of: 'play_card', 'card_drawn', 'status_applied', 'victory'.
// payload depends on type:
//   play_card     → payload is the card id (string)
//   card_drawn    → payload is the card id (string)
//   status_applied→ payload is { target, statusId } (object)
//   victory       → no payload
function tutorialEvent(type, payload){
  if(!_tutorial.active) return;

  // Round 67o: victory is special-cased BEFORE the waitFor early-return.
  // The player can finish the goblin before reaching the 'Finish the
  // fight' beat (e.g. dire wolf crit-chunks the goblin during the click-
  // through of the Sorcery step, before the goblin's jab → Weaken sequence
  // even gets to fire). Don't soft-lock waiting on a debuff that will
  // never land — fast-forward to the post-victory conclusion step and
  // paint it immediately.
  if(type === 'victory' && _tutorial.waitFor !== 'victory'){
    console.log('[tut] VICTORY during wait', _tutorial.waitFor, '→ fast-forward to conclusion');
    _tutorial.waitFor = null;
    if(_tutorial.fallbackT){ clearTimeout(_tutorial.fallbackT); _tutorial.fallbackT = null; }
    _tutorialClearHighlight();
    var ovFf = document.getElementById('tut-combat-overlay');
    if(ovFf) ovFf.classList.remove('show');
    _tutorial.step = TUTORIAL_STEPS.length - 1;
    _tutorialEnterStep();
    return;
  }

  if(!_tutorial.waitFor) return;
  var want = _tutorial.waitFor;
  var matched = false;
  // Round 67g: diagnostic logging — helps trace freezes / missed
  // matches. Cheap (only logs while tutorial is active + a wait
  // is armed). Strip once the flow is rock-solid.
  console.log('[tut] event:', type, 'payload:', payload, 'want:', want, 'step:', _tutorial.step);

  if(type === 'play_card'){
    if(want.indexOf('play_card:') === 0){
      matched = (want.slice('play_card:'.length) === payload);
    } else if(want.indexOf('play_both:') === 0){
      // Track plays in playedSet; advance once ALL required ids are present.
      _tutorial.playedSet[payload] = true;
      var required = want.slice('play_both:'.length).split(',');
      matched = required.every(function(id){ return !!_tutorial.playedSet[id]; });
    }
  } else if(type === 'card_drawn'){
    // Round 67d: transitional step waits for a specific card to arrive
    // in the player's hand before painting the next dialog.
    if(want.indexOf('card_drawn:') === 0){
      matched = (want.slice('card_drawn:'.length) === payload);
    }
  } else if(type === 'status_applied'){
    if(want.indexOf('status_applied:') === 0){
      var requiredStatus = want.slice('status_applied:'.length);
      if(payload && payload.statusId === requiredStatus && payload.target === 'player'){
        matched = true;
      }
    }
  } else if(type === want){
    matched = true;
  }

  if(matched){
    console.log('[tut] MATCHED — advancing from step', _tutorial.step, '→', _tutorial.step + 1);
    _tutorial.waitFor = null;
    if(_tutorial.fallbackT){ clearTimeout(_tutorial.fallbackT); _tutorial.fallbackT = null; }
    // Round 67i: card_drawn matches need to finalise the card's
    // arrival animation BEFORE the next dialog step pauses combat.
    // actorDraw sets _drawLock / _arriveAt (~400ms future timestamps)
    // for a fly-in animation; while those are pending the card has
    // .card-arriving with opacity:0. With combat paused, no further
    // renderHand fires to remove that class — the card stays invisible
    // until the next draw happens. Clearing the flags here makes the
    // following renderHand (still inside doDraw, runs after this
    // tutorialEvent returns) render the card as fully arrived.
    if(type === 'card_drawn' && gs && Array.isArray(gs.hand)){
      for(var hi = 0; hi < gs.hand.length; hi++){
        var hItem = gs.hand[hi];
        if(hItem && hItem.id === payload){
          delete hItem._drawLock;
          delete hItem._arriveAt;
          delete hItem._newDraw;
        }
      }
    }
    _tutorial.step += 1;
    if(_tutorial.step >= TUTORIAL_STEPS.length){
      _tutorialEnd();
    } else {
      _tutorialEnterStep();
    }
  }
}

// Side-effects fire from _tutorialNext() right before the wait state
// arms. Used to manipulate combat state so the next event-driven
// wait can fire reliably (forcing draws, forcing enemy plays, etc).
function _tutorialSideEffect(kind){
  if(!gs) return;
  if(kind === 'inject_howl'){
    // Replace the player's draw pool with just wolf_howl so the very
    // next draw is guaranteed to be Howl. Discard reshuffles after
    // Howl is played, restoring the normal flow.
    if(!gs.drawPool || !Array.isArray(gs.drawPool)) return;
    gs.drawPool.length = 0;
    gs.drawPool.push('wolf_howl');
    // Sync the player actor's reference — should already point at
    // gs.drawPool, but defensive re-link is cheap.
    if(gs.actors && gs.actors.player) gs.actors.player.drawPool = gs.drawPool;
  }
  else if(kind === 'force_goblin_jab'){
    // Replace goblin's hand with [goblin_jab] and ensure they have
    // enough mana for the Sorcery (35) so Weaken lands on the player.
    // Their AI plays the only card they have on the next enemy turn.
    if(gs.enemyHand){
      gs.enemyHand.length = 0;
      gs.enemyHand.push({ id: 'goblin_jab', ghost: false });
    }
    gs.enemyMana = Math.max(gs.enemyMana || 0, 40);
    if(gs.actors && gs.actors.enemy){
      gs.actors.enemy.hand = gs.enemyHand;
      gs.actors.enemy.mana = gs.enemyMana;
    }
    // Safety fallback: if the goblin somehow doesn't apply Weaken
    // within 8 seconds (AI stuck, hand override didn't take, etc.),
    // force-apply it via applyStatus so the tutorial doesn't soft-lock.
    if(_tutorial.fallbackT){ clearTimeout(_tutorial.fallbackT); }
    _tutorial.fallbackT = setTimeout(function(){
      if(!_tutorial.active || _tutorial.waitFor !== 'status_applied:weaken') return;
      if(typeof applyStatus === 'function'){
        applyStatus('player','debuff','Weaken',1,'dmg',4000,'Weaken: -1 damage for 4s.');
        // applyStatus doesn't fire the tutorial event directly — the
        // hook in game.js handles that on its next call. Trigger
        // manually here too in case applyStatus was called without
        // hitting that hook.
        tutorialEvent('status_applied', { target:'player', statusId:'weaken' });
      }
      _tutorial.fallbackT = null;
    }, 8000);
  }
}

// Mark complete and exit the tutorial. Called when the step list
// runs out (last beat advanced past TUTORIAL_STEPS.length).
//
// Round 67d: now drives the transition to champion-select instead
// of leaving the player stranded on game-screen. Previously the
// transition was scheduled via a setTimeout in checkEnd, which
// raced with the final dialog. Now the conclusion beat's NEXT
// click is the single trigger for both "tutorial done" and "show
// champion-select" — clean handoff.
function _tutorialEnd(){
  // Delegate to _tutorialFinishToChampSelect which handles ALL the
  // cleanup + transition. (Marks complete, activates story quest,
  // clears gs, switches screen, rebuilds select grid, etc.)
  if(typeof _tutorialFinishToChampSelect === 'function'){
    _tutorialFinishToChampSelect();
    return;
  }
  // Fallback if the transition function somehow isn't available —
  // at least mark the tutorial done so it doesn't replay.
  _tutorial.active = false;
  _tutorialClearHighlight();
  var ov = document.getElementById('tut-combat-overlay');
  if(ov) ov.classList.remove('show');
  if(_tutorial.fallbackT){ clearTimeout(_tutorial.fallbackT); _tutorial.fallbackT = null; }
  PERSIST.tutorialComplete = true;
  if(typeof savePersist === 'function') savePersist();
  if(typeof showNav === 'function') showNav(true);
}

// ════════════════════════════════════════════════════════════════
// DEFEAT (Round 67j)
// ════════════════════════════════════════════════════════════════
// If the player somehow loses the tutorial fight (unlikely given the
// dire wolf's overwhelming stats vs the goblin's 60 HP), we bypass
// the regular doDefeat flow — no gold loss, no champion fall, no
// reset to Lv 1. Show a tutorial-specific defeat dialog with a
// RETRY button that restarts the fight from the combined-play beat.

function _tutorialShowDefeat(){
  // Reuse the in-combat dialog overlay element — same chrome, same
  // portrait, just different text and an action button instead of
  // NEXT. Replace innerHTML to swap the content cleanly.
  var ov = document.getElementById('tut-combat-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'tut-combat-overlay';
    ov.className = 'tut-combat-overlay';
    document.body.appendChild(ov);
  }
  ov.innerHTML = ''
    + '<div class="tut-combat-dialog">'
    +   '<div class="tut-combat-dialog-portrait">'
    +     '<img class="flip-x" src="assets/creatures/mysterious_figure.png" alt="???" onerror="this.outerHTML=\'<span style=&quot;font-size:48px;color:#5a4060;&quot;>?</span>\'">'
    +   '</div>'
    +   '<div class="tut-combat-dialog-body">'
    +     '<div class="tut-combat-dialog-name">???</div>'
    +     '<div class="tut-combat-dialog-text">You fell. The lesson is not finished. Stand up.</div>'
    +   '</div>'
    +   '<button class="tut-combat-dialog-next" onclick="_tutorialRetry()">RETRY ►</button>'
    + '</div>';
  ov.classList.add('show');
}

// Restart the tutorial fight from scratch. Wipes the current gs,
// rebuilds the run via startRun (which fires applyTutorialOverrides
// again to give a fresh dire-wolf-vs-goblin setup), and arms
// retryStartStep so _tutorialStartFromTop drops the player at the
// combined-play beat (skipping the orientation dialogs they've
// already seen).
function _tutorialRetry(){
  // Hide the defeat dialog
  var ov = document.getElementById('tut-combat-overlay');
  if(ov) ov.classList.remove('show');
  _tutorialClearHighlight();

  // Restart from the combined-play beat. Index 6 in TUTORIAL_STEPS.
  _tutorial.retryStartStep = 6;
  _tutorial.active = true;

  // Reset transient run state
  gs = null;
  paused = false;

  // Rebuild combat. selectedChampId / selectedArea are still set
  // from the original _tutorialBegin call. _tutorial.area is the
  // pre-built area (so we don't rebuild it).
  selectedChampId = 'dire_wolf';
  selectedArea = _tutorial.area || selectedArea;
  if(typeof showScreen === 'function') showScreen('game-screen');
  if(typeof startRun === 'function') startRun(selectedChampId, selectedArea);
  // Combat background re-applied by startRun (gs._tutorial gate).
  // The begin-battle modal will pop again from startRun's tail;
  // player clicks BEGIN BATTLE → startBattle → 800ms timeout →
  // _tutorialStartFromTop → starts at step 6.
}

// ════════════════════════════════════════════════════════════════
// SCRIPTED RUN SETUP (called from makeGS / startBattle in game.js)
// ════════════════════════════════════════════════════════════════
// applyTutorialOverrides(gs) — runs after makeGS but before
// startBattle. Mutates gs to give the wolf overwhelming stats, a
// scripted deck order, and a goblin enemy with reduced HP. The
// fight is winnable no matter how the player plays.
function applyTutorialOverrides(gs){
  if(!_tutorial.active || !gs) return;
  gs._tutorial = true;

  // Buff wolf so the fight is guaranteed-winnable.
  gs.stats.str = Math.max(gs.stats.str, 20);
  gs.stats.agi = Math.max(gs.stats.agi, 30);
  gs.stats.wis = Math.max(gs.stats.wis, 20);
  gs.playerMaxHp = Math.max(gs.playerMaxHp, 200);
  gs.playerHp    = gs.playerMaxHp;
  gs.maxMana     = Math.max(gs.maxMana, 100);
  gs.manaRegen   = (gs.manaRegen || 4) * 1.5;

  // Force the player's draw pile to ONLY the starter teaching cards.
  // Strike teaches damage; Brace teaches Shield. The opening hand
  // (3 draws against a 3-card pool) is guaranteed to be exactly
  // [strike, strike, brace] in some order. wolf_howl is injected
  // later via the 'inject_howl' side-effect on step 8's NEXT.
  gs.drawPool = ['strike','strike','brace'];
  gs.discardPile = [];
  gs.hand = [];

  // The enemy was already pre-built as a goblin via buildArea on
  // a goblin-only enemyPool (set up in _tutorialBegin). Trim to a
  // single fight and dial HP/mana for the scripted flow.
  if(gs.enemies && gs.enemies.length){
    gs.enemies = gs.enemies.slice(0, 1);
    if(gs.enemies[0]){
      gs.enemies[0].baseHp = 60;
      gs.enemyHp = 60;
      gs.enemyMaxHp = 60;
    }
  }
}

// ════════════════════════════════════════════════════════════════
// QUERY HELPERS (used by game.js hooks)
// ════════════════════════════════════════════════════════════════
function isTutorialActive(){ return !!_tutorial.active; }
function isTutorialFresh(){
  // True if player has never seen the tutorial. Used by login flow
  // to decide whether to surface the BEGIN-tutorial dialog.
  return !PERSIST.tutorialComplete;
}

// ════════════════════════════════════════════════════════════════
// POST-TUTORIAL TRANSITION  (Round 66e)
// ════════════════════════════════════════════════════════════════
// Called from game.js's checkEnd when gs._tutorial is true and the
// goblin dies. Skips the normal doVictory rewards flow entirely —
// the tutorial is a narrative prelude, not a real run. Cleans up
// gs, marks the tutorial complete, returns the player to champion
// select. The first champion they click there fires the story
// dialog (see showChampStory below).
function _tutorialFinishToChampSelect(){
  _tutorial.active = false;
  _tutorialClearHighlight();
  var ov = document.getElementById('tut-combat-overlay');
  if(ov) ov.classList.remove('show');
  if(_tutorial.fallbackT){ clearTimeout(_tutorial.fallbackT); _tutorial.fallbackT = null; }
  PERSIST.tutorialComplete = true;
  // Round 67l: story quest activation TABLED for ship. The hook is
  // intentionally disabled (not deleted) so the story arc can be
  // re-enabled by uncommenting these lines once the content is
  // finalised. STORY_QUESTS / _activateStoryQuest / etc all remain
  // in the file ready to wire back up.
  // _activateStoryQuest(STORY_QUESTS.pick_first_champion);
  if(typeof savePersist === 'function') savePersist();
  // Reset transient run state — gs is now done.
  if(typeof gs !== 'undefined') gs = null;
  // Make sure the begin-battle modal is dismissed.
  var bbm = document.getElementById('begin-battle-modal');
  if(bbm) bbm.style.display = 'none';
  // Hand off to the normal post-game flow.
  if(typeof showNav === 'function') showNav(true);
  if(typeof showScreen === 'function') showScreen('select-screen');
  if(typeof buildSelectScreen === 'function') buildSelectScreen();
  if(typeof updateNavBar === 'function') updateNavBar('adventure');
  if(typeof checkBestiaryAutoUnlock === 'function') checkBestiaryAutoUnlock();
  if(typeof restoreQuestBadge === 'function') restoreQuestBadge();
  // Reset the town tab if startRun locked it.
  if(typeof _restoreTownTab === 'function') _restoreTownTab();
  // Round 67l: swap back to menu music from battle music.
  if(typeof playMusic === 'function') playMusic('menu');
}

// ════════════════════════════════════════════════════════════════
// STORY QUESTS  (Round 67)
// ════════════════════════════════════════════════════════════════
// Hand-authored quest line driven by tutorial / narrative beats
// rather than randomised by the quest board. Use isStory:true so
// the existing buildCsQuestRail styling renders them with the gold
// gradient + star prefix. No rewards array — story quests progress
// the narrative, they don't pay out.
//
// Each story quest defines its own completion trigger; tutorial.js
// owns the trigger wiring (e.g. _completeStoryQuest is called from
// _dismissChampStory when the player closes a champion's intro).
var STORY_QUESTS = {
  pick_first_champion: {
    id:     'story_pick_first_champion',
    title:  'The Three Paths',
    desc:   'Choose your first champion. The road begins where they begin.',
    type:   'pick_champion',
    target: 1,
    isStory:true,
    rewards:[],
    issuer: '???',
  },
};

// Adds a story quest def to quests.offered (so the rail can look it up)
// and pushes { id, progress:0 } to active. Idempotent — re-adding the
// same id is a no-op.
function _activateStoryQuest(def){
  if(!def || !def.id) return;
  if(!PERSIST.town) return;
  var q = PERSIST.town.quests;
  if(!q){ PERSIST.town.quests = { offered:[], active:[], completed:[] }; q = PERSIST.town.quests; }
  if(!Array.isArray(q.offered))   q.offered   = [];
  if(!Array.isArray(q.active))    q.active    = [];
  if(!Array.isArray(q.completed)) q.completed = [];
  // Skip if already active OR already completed (story quests are
  // one-shot — don't re-add to active if the player has finished it).
  if(q.active.some(function(a){ return a.id === def.id; })) return;
  if(q.completed.indexOf(def.id) !== -1) return;
  if(!q.offered.some(function(o){ return o.id === def.id; })) q.offered.push(def);
  q.active.push({ id: def.id, progress: 0 });
}

// Mark a story quest complete by setting its progress to target and
// (after a brief delay so the player sees the bar fill) moving it to
// the completed list. Repaints both quest rails if they're mounted.
function _completeStoryQuest(id){
  if(!id || !PERSIST.town || !PERSIST.town.quests) return;
  var q = PERSIST.town.quests;
  if(!Array.isArray(q.active)) return;
  var idx = q.active.findIndex(function(a){ return a.id === id; });
  if(idx < 0) return;
  var def = (q.offered || []).find(function(o){ return o.id === id; });
  var target = (def && def.target) || 1;
  q.active[idx].progress = target;
  // Refresh whichever rail is visible so the bar fills immediately.
  if(typeof buildCsQuestRail === 'function') buildCsQuestRail();
  if(typeof buildAreaQuestRail === 'function') buildAreaQuestRail();
  // Move to completed after a short pause so the player can see the
  // full bar before it disappears.
  setTimeout(function(){
    var qNow = PERSIST.town && PERSIST.town.quests;
    if(!qNow || !Array.isArray(qNow.active)) return;
    qNow.active = qNow.active.filter(function(a){ return a.id !== id; });
    if(!Array.isArray(qNow.completed)) qNow.completed = [];
    if(!qNow.completed.includes(id)) qNow.completed.push(id);
    if(typeof savePersist === 'function') savePersist();
    if(typeof buildCsQuestRail === 'function') buildCsQuestRail();
    if(typeof buildAreaQuestRail === 'function') buildAreaQuestRail();
  }, 1800);
}

// ════════════════════════════════════════════════════════════════
// CHAMPION FIRST-PICK STORY  (Round 66e)
// ════════════════════════════════════════════════════════════════
// One-time narrative beat triggered the first time the player
// selects each starter champion. The mysterious figure has fallen
// silent; this is the champion's own voice / perspective. Acts as
// both the END of the tutorial AND the START of the broader story.
//
// Stored per-champion in PERSIST.champStorySeen so each starter
// gets their moment the first time they're clicked, even later in
// the game. Only the three starter champions have entries here for
// now — newly-summoned champions don't get a first-pick story
// unless one is authored.
var CHAMP_INTRO_STORY = {
  druid: [
    "Something stirred when the shard broke.",
    "You felt it before you saw it — the way the stars rearranged, the way the night opened a sentence and didn't finish it.",
    "You will find what was sealed. You will find why it was sealed. And then you will decide if those answers can be lived with."
  ],
  paladin: [
    "The vow was simple once. Defend the light. Destroy the dark.",
    "Then the dark answered. The light went quiet. Your blade now drinks from both.",
    "You serve no order anymore. You walk anyway. There is still work, and you are still the one with the steel."
  ],
  thief: [
    "Three weeks ago a man you'd never met called you by name and cursed you. Two weeks ago a girl in the alley said the same name, and ran.",
    "The name isn't yours. It follows you anyway.",
    "Somewhere in this city is the person who used to wear your face. Find them. Decide what to do."
  ],
};

// Called from game.js's selectChamp. Shows the story dialog the
// first time the player clicks a champion that has one. No-ops if
// the story has already been shown (or doesn't exist for this id).
function maybeShowChampStory(champId){
  if(!champId) return false;
  if(!CHAMP_INTRO_STORY[champId]) return false;
  if(!PERSIST.champStorySeen) PERSIST.champStorySeen = {};
  if(PERSIST.champStorySeen[champId]) return false;
  _showChampStory(champId);
  return true;
}

function _showChampStory(champId){
  var ch = CREATURES[champId];
  if(!ch) return;
  var paragraphs = CHAMP_INTRO_STORY[champId] || [];

  var ov = document.getElementById('tut-story-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'tut-story-overlay';
    ov.className = 'tut-story-overlay';
    document.body.appendChild(ov);
  }
  var bodyHtml = paragraphs.map(function(p){
    return '<p class="tut-story-para">' + p + '</p>';
  }).join('');
  // Champion sprite — flip-x so they face into the dialog (they're
  // "yours" now). Falls back to the emoji icon if PNG missing.
  var portraitHtml = '<img class="flip-x" src="assets/creatures/'+champId+'.png" alt="'+ch.name+'" '
    + 'onerror="this.outerHTML=\'<span style=&quot;font-size:120px;color:#5a4060;&quot;>'+ ch.icon +'</span>\'">';
  ov.innerHTML = ''
    + '<div class="tut-story-box">'
    +   '<div class="tut-story-portrait">' + portraitHtml + '</div>'
    +   '<div class="tut-story-name">' + ch.name + '</div>'
    +   '<div class="tut-story-text">' + bodyHtml + '</div>'
    +   '<button class="tut-story-btn" onclick="_dismissChampStory(\'' + champId + '\')">BEGIN ►</button>'
    + '</div>';
  ov.classList.add('show');
}

function _dismissChampStory(champId){
  if(!PERSIST.champStorySeen) PERSIST.champStorySeen = {};
  var wasFirstStory = !Object.keys(PERSIST.champStorySeen).length;
  PERSIST.champStorySeen[champId] = true;
  if(typeof savePersist === 'function') savePersist();
  var ov = document.getElementById('tut-story-overlay');
  if(ov) ov.classList.remove('show');
  // Round 67: if this was the FIRST champion-story dismissal, complete
  // the 'pick_first_champion' story quest. Subsequent picks of other
  // champions don't re-complete (they just show their own intros).
  if(wasFirstStory){
    _completeStoryQuest('story_pick_first_champion');
  }
}
