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

// Round 67r — full rewrite (v2). Re-designed from scratch in response
// to the original "player doesn't know what to do" issue: combat used
// to start ticking before any teaching landed, leaving the player
// staring at an empty hand and a ticking draw bar.
//
// New shape:
//   1. Strike is PRE-LOADED into the hand by applyTutorialOverrides.
//      The player has a card from frame one.
//   2. The first three dialogs run while combat is FROZEN. We explain
//      goal + cards + how to play before anything ticks.
//   3. The action-prompt dialogs ('Click Strike', 'Click Brace',
//      'Click Howl') have NO NEXT button. The card click IS the
//      advance. This kills the "click NEXT, then click the card"
//      double-step confusion.
//   4. After the first play, combat is unpaused and the draw bar /
//      goblin / autoplay are taught reactively (player can see them
//      in action).
//   5. Each dialog teaches ONE thing. Multiple short pages, not a
//      wall of text.
//
// Beat list (10 dialogs, 6 transitional/action bridges):
//   0   GOAL + HP BARS             paused, NEXT
//   1   CARDS INTRO                paused, NEXT
//   2   ↳ CLICK STRIKE (action)    NO NEXT, unpaused, wait play_card:strike
//   3   ↳ wait for Brace draw      transitional
//   4   DRAW MECHANIC              paused, NEXT (covers draw bar, AGI, goblin, autoplay)
//   5   BRACE + SHIELD             paused, NEXT
//   6   ↳ CLICK BRACE (action)     NO NEXT, unpaused, wait play_card:brace
//   7   ↳ wait for Howl draw       transitional
//   8   HASTE + STATUSES           paused, NEXT
//   9   MANA + SORCERY             paused, NEXT
//   10  ↳ CLICK HOWL (action)      NO NEXT, unpaused, wait play_card:wolf_howl
//   11  ↳ wait for Haste applied   transitional
//   12  INNATES                    paused, NEXT
//   13  PAUSE + DISCARD CYCLE      paused, NEXT → fill_finisher_hand
//   14  ↳ wait for victory         transitional
//   15  CONCLUSION                 paused, NEXT → champion select
//
// Step fields:
//   text       — dialog body (omit on transitional steps)
//   highlight  — CSS selector(s) for the UI element(s) to spotlight
//   wait       — what advances the step:
//                  'click'                  manual NEXT click
//                  'card_drawn:<id>'        wait for that card to be drawn
//                  'play_card:<id>'         wait for that card to be played
//                  'status_applied:<id>'    wait for that status on player
//                  'victory'                wait for goblin to die
//   noNext     — true: dialog has no NEXT button; the wait condition
//                must fire to advance. Combat is UNPAUSED while dialog
//                is up so the player can perform the action.
//   onAdvance  — side-effect when NEXT is clicked
//   onMatch    — side-effect when the event-wait matches (parallels
//                onAdvance for noNext / event-driven steps)
//   transitional:true — no pause, no dialog. Bridges an event into the
//                       next dialog step.
var TUTORIAL_STEPS = [
  // ── 0: GOAL + HP BARS (paused, NEXT) ──
  { text: 'You\'re the wolf on the LEFT, the goblin on the RIGHT. Bring the goblin\'s HP to zero to win.',
    highlight: '#combatant-player .big-hp-wrap, #combatant-enemy .big-hp-wrap',
    wait: 'click' },

  // ── 1: CARDS INTRO (paused, NEXT) ──
  // Strike is already in hand (pre-loaded by applyTutorialOverrides).
  // This dialog points it out before the action prompt.
  { text: 'You play cards from your hand to fight. You start with Strike, an attack card.',
    highlight: '.hand-cards .card',
    wait: 'click' },

  // ── 2: ACTION — CLICK STRIKE (no NEXT, unpaused, action prompt) ──
  // No NEXT button: the click on Strike itself advances the tutorial.
  // Combat unpauses on entry so the click registers. onMatch injects
  // Brace as the next draw once Strike resolves.
  { text: 'Click Strike to attack the goblin.',
    highlight: '.hand-cards .card',
    wait: 'play_card:strike',
    noNext: true,
    onMatch: 'inject_brace' },

  // ── 3: bridge — wait for Brace draw ──
  { transitional: true, wait: 'card_drawn:brace' },

  // ── 4: DRAW MECHANIC (paused, NEXT) ──
  // After the first play resolved and the player saw their draw bar
  // start filling, this dialog teaches the draw mechanic with the
  // visuals the player just witnessed. Covers: draw bar, AGI, goblin
  // parallel, autoplay.
  { text: 'Cards arrive when your DRAW bar fills, set by your AGI stat. The goblin draws the same way on their DRAW bar. If your hand ever fills up, the oldest card auto-plays.',
    highlight: '#draw-bar, #e-draw-bar',
    wait: 'click' },

  // ── 5: BRACE + SHIELD MECHANIC (paused, NEXT) ──
  { text: 'Brace gives you a SHIELD that absorbs damage. Playing another Brace before it expires refreshes the timer and stacks the value.',
    highlight: '.hand-cards .card, #p-shield-bar',
    wait: 'click' },

  // ── 6: ACTION — CLICK BRACE (no NEXT, unpaused) ──
  { text: 'Click Brace to shield yourself.',
    highlight: '.hand-cards .card',
    wait: 'play_card:brace',
    noNext: true,
    onMatch: 'inject_howl' },

  // ── 7: bridge — wait for Howl draw ──
  { transitional: true, wait: 'card_drawn:wolf_howl' },

  // ── 8: HASTE + STATUSES (paused, NEXT) ──
  { text: 'Howl applies HASTE, a buff that speeds your draws. Statuses like Haste, Shield, Poison, and Weaken all tick down to zero.',
    highlight: '.hand-cards .card',
    wait: 'click' },

  // ── 9: MANA + SORCERY (paused, NEXT) ──
  { text: 'Howl has a [Sorcery] effect: with 40 mana, it adds a Crit boost. Your mana fills over time.',
    highlight: '#mana-bar2',
    wait: 'click' },

  // ── 10: ACTION — CLICK HOWL (no NEXT, unpaused) ──
  { text: 'Click Howl to play it.',
    highlight: '.hand-cards .card',
    wait: 'play_card:wolf_howl',
    noNext: true },

  // ── 11: bridge — wait for Haste to land ──
  { transitional: true, wait: 'status_applied:haste' },

  // ── 12: INNATES (paused, NEXT) ──
  { text: 'Every creature has an INNATE, a unique ability. Yours is Hunter\'s Edge, an always-on passive. Some champions have ACTIVE innates that light up as a button when ready.',
    highlight: '#innate-card',
    wait: 'click' },

  // ── 13: PAUSE + DISCARD CYCLE (paused, NEXT → fill_finisher_hand) ──
  // Round 67r: covers the last two pieces of teaching before combat
  // wraps. Highlights the new big pause button next to the hand, tells
  // the player they can pause to read cards and status chips, and
  // explains the deck → discard → shuffle cycle so they don't get
  // confused when their deck empties. fill_finisher_hand fires here
  // (moved from the innates step) so the finisher cards arrive RIGHT
  // when the player is told they can pause to read them.
  { text: 'Click the PAUSE button beside your hand anytime to freeze combat. Use it to read your cards and the status chips on yourself and the goblin. Cards you play go to your discard pile, then shuffle back into your deck when it empties.',
    highlight: '#hand-pause-btn',
    wait: 'click',
    onAdvance: 'fill_finisher_hand' },

  // ── 14: bridge — wait for victory ──
  { transitional: true, wait: 'victory' },

  // ── 15: CONCLUSION (paused, NEXT → champion-select) ──
  { text: 'That\'s combat. You\'ll unlock more champions as you play, each with their own cards and innates.',
    highlight: null,
    wait: 'click' },
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
  // Round 67p: the starter story chain kicks off regardless of whether
  // the player did the combat tutorial or skipped it — skipping is a
  // pacing preference, not a story opt-out.
  if(typeof STORY_QUESTS !== 'undefined' && STORY_QUESTS.story_reach_lv2 && typeof _activateStoryQuest === 'function'){
    _activateStoryQuest(STORY_QUESTS.story_reach_lv2);
  }
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
    // Round 67r v2: action-prompt steps (noNext:true) keep combat
    // UNPAUSED so the highlighted card click can register and fire
    // play_card. The dialog stays up; the click on the card itself
    // is what advances the tutorial via the wait condition matching.
    if(step.noNext){
      paused = false;
      _tutorial.waitFor = step.wait || null;
      if(_tutorial.fallbackT){ clearTimeout(_tutorial.fallbackT); _tutorial.fallbackT = null; }
      _tutorialShowDialog(step);
      _tutorialApplyHighlight(step.highlight);
      if(typeof scheduleEnemyAction === 'function') scheduleEnemyAction();
      console.log('[tut] action-prompt dialog shown for step', _tutorial.step);
    } else {
      paused = true;
      _tutorial.waitFor = null;
      if(_tutorial.fallbackT){ clearTimeout(_tutorial.fallbackT); _tutorial.fallbackT = null; }
      _tutorialShowDialog(step);
      _tutorialApplyHighlight(step.highlight);
      console.log('[tut] dialog shown for step', _tutorial.step);
    }
  } catch(err){
    console.error('[tut] FAILED to enter step', _tutorial.step, err);
    // Defensive: don't leave combat paused if the dialog broke
    paused = false;
    if(typeof scheduleEnemyAction === 'function') scheduleEnemyAction();
  }
}

// Render the dialog box. Mystery figure portrait + text + NEXT.
// Round 67r v2: action-prompt steps (noNext:true) render without
// the NEXT button — the wait condition (e.g. play_card:strike)
// advances the step instead. Used for "Click Strike", "Click Brace",
// "Click Howl" prompts so the player only has ONE click to make.
function _tutorialShowDialog(step){
  var ov = document.getElementById('tut-combat-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'tut-combat-overlay';
    ov.className = 'tut-combat-overlay';
    document.body.appendChild(ov);
  }
  var nextBtn = step.noNext
    ? ''
    : '<button class="tut-combat-dialog-next" onclick="_tutorialNext()">NEXT ►</button>';
  ov.innerHTML = ''
    + '<div class="tut-combat-dialog">'
    +   '<div class="tut-combat-dialog-portrait">'
    +     '<img class="flip-x" src="assets/creatures/mysterious_figure.png" alt="???" onerror="this.outerHTML=\'<span style=&quot;font-size:48px;color:#5a4060;&quot;>?</span>\'">'
    +   '</div>'
    +   '<div class="tut-combat-dialog-body">'
    +     '<div class="tut-combat-dialog-name">???</div>'
    +     '<div class="tut-combat-dialog-text">' + step.text + '</div>'
    +   '</div>'
    +   nextBtn
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
    // Round 67r v2: dismiss the current dialog + clear its highlight
    // before advancing. For NEXT-driven advances this already happens
    // in _tutorialNext; event-driven (noNext action prompts, plain
    // transitional waits) need explicit cleanup here so the dialog
    // doesn't linger across the next step's entry.
    _tutorialClearHighlight();
    var ovMatched = document.getElementById('tut-combat-overlay');
    if(ovMatched) ovMatched.classList.remove('show');
    // Round 67r v2: fire onMatch side-effect (parallels onAdvance for
    // event-driven steps without a NEXT button — e.g. action prompts
    // that need to inject the next card AFTER the player plays one).
    var matchedStep = TUTORIAL_STEPS[_tutorial.step];
    if(matchedStep && matchedStep.onMatch && typeof _tutorialSideEffect === 'function'){
      _tutorialSideEffect(matchedStep.onMatch);
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
  else if(kind === 'inject_brace'){
    // Round 67r: same shape as inject_howl. After Strike is played,
    // replace the (now-empty) draw pool with [brace] so the next
    // draw is guaranteed Brace for the Shield lesson.
    if(!gs.drawPool || !Array.isArray(gs.drawPool)) return;
    gs.drawPool.length = 0;
    gs.drawPool.push('brace');
    if(gs.actors && gs.actors.player) gs.actors.player.drawPool = gs.drawPool;
  }
  else if(kind === 'fill_finisher_hand'){
    // Round 67r: top up the player's hand to a clean finisher kit
    // (4 Strike + 1 Brace) after the innates dialog so they have
    // plenty of damage to wrap the fight without a long drip-feed
    // from the reshuffled discard pile.
    // v2: use real doDraw() calls with overrideId + 200ms stagger so
    // each card flies in from the deck pile with the normal draw
    // animation and SFX. Reads as "Kaine just handed you a stack
    // of cards" rather than cards silently materialising in hand.
    if(!gs || !Array.isArray(gs.hand)) return;
    var finisherCards = ['strike','strike','strike','strike','brace'];
    var HAND_MAX = (typeof HAND_SIZE !== 'undefined' && HAND_SIZE) || 7;
    // Clamp to available slots — if the player has cards already in
    // hand we only draw up to the cap, not past it (autoplay would
    // otherwise consume our first finisher cards before the player
    // sees them).
    var slotsAvailable = Math.max(0, HAND_MAX - gs.hand.length);
    var toDraw = finisherCards.slice(0, slotsAvailable);
    toDraw.forEach(function(cardId, idx){
      setTimeout(function(){
        if(typeof doDraw === 'function') doDraw(cardId);
      }, idx * 200);
    });
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
  // Round 67p: defensive fallback — also kick off the story chain
  // here so the player can't end up tutorial-complete but without
  // the starter quest active.
  if(typeof STORY_QUESTS !== 'undefined' && STORY_QUESTS.story_reach_lv2 && typeof _activateStoryQuest === 'function'){
    _activateStoryQuest(STORY_QUESTS.story_reach_lv2);
  }
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
// retryStartStep so _tutorialStartFromTop skips past the orientation
// paragraph the player already saw and starts at the first event-
// driven bridge (waiting for the first card to be drawn).
function _tutorialRetry(){
  // Hide the defeat dialog
  var ov = document.getElementById('tut-combat-overlay');
  if(ov) ov.classList.remove('show');
  _tutorialClearHighlight();

  // Round 67r v2: restart from the click-Strike action prompt (step 2),
  // skipping the goal + cards-intro dialogs the player already saw.
  // Strike is pre-loaded in hand by applyTutorialOverrides, so the
  // action prompt has something to point at.
  _tutorial.retryStartStep = 2;
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

  // Round 67r v2: PRE-LOAD Strike directly into the hand so the
  // player has something to act on from frame one. drawPool starts
  // empty; cards get injected as the tutorial advances:
  //   step 2 onMatch (after Strike played) → inject_brace
  //   step 6 onMatch (after Brace played)  → inject_howl
  //   step 10 (Howl played) → discard reshuffles naturally
  gs.drawPool = [];
  gs.discardPile = [];
  gs.hand = [{ id: 'strike', ghost: false }];

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
  // Round 67p: kick off the starter story-quest chain. story_reach_lv2
  // is the first link; subsequent quests are added via the .next chain
  // when each one is claimed (see claimQuest in town.js).
  if(typeof STORY_QUESTS !== 'undefined' && STORY_QUESTS.story_reach_lv2 && typeof _activateStoryQuest === 'function'){
    _activateStoryQuest(STORY_QUESTS.story_reach_lv2);
  }
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
// Round 67p: starter quest chain. Activates after the tutorial fight
// (replacing the older pick_first_champion stub) and walks the player
// through: hitting level 2, editing their deck, hitting level 3, then
// crafting & equipping the Safety Net relic. Each quest's `next` field
// points to the id of the quest that activates on claim; null ends the
// chain. `onClaim` runs side-effects (e.g. unlocking buildings) after
// rewards are granted.
//
// Auto-skip: when a quest is activated, _activateStoryQuest checks the
// goal against current PERSIST state and marks it claimable immediately
// if the player has already met the bar (e.g. already level 3 by the
// time the chain reaches story_reach_lv3).
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

  story_reach_lv2: {
    id:           'story_reach_lv2',
    title:        'First Steps',
    desc:         'Earn enough from a run to reach level 2. The road begins to ask things of you.',
    type:         'reach_level',
    targetLevel:  2,
    target:       1,
    isStory:      true,
    rewards:      [{type:'gold', icon:'✦', amount:50, label:'Gold'}],
    issuer:       '???',
    next:         'story_edit_deck',
  },

  story_edit_deck: {
    id:           'story_edit_deck',
    title:        'Hone Your Cards',
    desc:         'Open your deck and save a change — shape the run before it shapes you.',
    type:         'edit_deck',
    target:       1,
    isStory:      true,
    rewards:      [{type:'gold', icon:'✦', amount:30, label:'Gold'}],
    issuer:       '???',
    next:         'story_reach_lv3',
  },

  story_reach_lv3: {
    id:           'story_reach_lv3',
    title:        'Find Your Stride',
    desc:         'Reach level 3. The town opens to you.',
    type:         'reach_level',
    targetLevel:  3,
    target:       1,
    isStory:      true,
    // Round 67r: Forge unlock moved to story_visit_hall — claiming
    // this quest now unlocks the TOWN (via the nav-tab gate that
    // checks isQuestClaimed('story_reach_lv3')) but NOT the Forge.
    // The player goes town → Hall → craft, not town → craft directly.
    // Material reward (ancient_bark x2) stays here so it's in hand
    // by the time the player reaches the Forge step.
    rewards:      [
      {type:'unlock',   icon:'🔓', label:'The Town'},
      {type:'material', icon:'🌳', id:'ancient_bark', amount:2, label:'Ancient Bark'},
    ],
    issuer:       '???',
    next:         'story_visit_hall',
    onClaim: function(){
      // Town gate is purely derived from isQuestClaimed; no flag to
      // flip here. Just announce the unlock.
      if(typeof showTownToast === 'function') showTownToast('✦ The town gates open to you.');
    },
  },

  story_visit_hall: {
    id:               'story_visit_hall',
    title:            'Find the Hall',
    desc:             "Visit the Adventurer's Hall. Leona has work for you.",
    type:             'visit_building',
    targetBuildingId: 'adventurers_hall',
    target:           1,
    isStory:          true,
    // Round 67r: bridging step between town unlock and the Forge
    // run. Sends the player to the Hall so they see the full quest
    // UI (story quests + bounty board) before being pointed at any
    // specific building. The Hall itself is unlocked by default
    // (game.js:842), so this is a pure "go see it" beat.
    rewards:          [
      {type:'gold',   icon:'✦', amount:30, label:'Gold'},
      {type:'unlock', icon:'🔓', label:'The Forge'},
      {type:'item',   icon:'⏳', id:'cracked_hourglass', amount:1, label:'Cracked Hourglass'},
    ],
    issuer:           'Leona',
    next:             'story_craft_safety_net',
    onClaim: function(){
      // Forge unlock moved here from story_reach_lv3 — opens when
      // Leona hands the player off to M'bur. Toast doubles as the
      // narrative handoff.
      if(PERSIST && PERSIST.town && PERSIST.town.buildings && PERSIST.town.buildings.forge){
        PERSIST.town.buildings.forge.unlocked = true;
        if(typeof showTownToast === 'function'){
          showTownToast("Leona: \"M'bur's at the Forge. He could use a hand.\"");
        }
      }
      // Round 67r: Cracked Hourglass grant happens via the rewards
      // array (declarative `type:'item'` entry handled by claimQuest's
      // reward loop). Followup toast tells the player WHERE to find
      // and use it, so the Vault gets a natural introduction.
      if(typeof showTownToast === 'function'){
        setTimeout(function(){
          showTownToast('✦ Cracked Hourglass added to your Vault. Use it to skip craft waits.');
        }, 1200);
      }
    },
  },

  story_craft_safety_net: {
    id:             'story_craft_safety_net',
    title:          'A Hedge Against Falling',
    desc:           'Craft the Safety Net at the Forge.',
    type:           'craft_relic',
    targetRelicId:  'safety_net',
    target:         1,
    isStory:        true,
    rewards:        [{type:'gold', icon:'✦', amount:100, label:'Gold'}],
    // Round 67q: M'bur asks the player to come to the Forge for this
    // one — they're crafting at his anvil. The "???" issuer is reserved
    // for the early reach-level quests where the player hasn't met the
    // story NPCs yet.
    issuer:         "M'bur",
    next:           'story_equip_safety_net',
    // Round 67q: Sanctum unlock moved here from story_reach_lv3. Kaine
    // only opens his doors once the player has something worth bringing
    // him — the freshly-crafted relic from M'bur's anvil. The next
    // quest (story_equip_safety_net) needs the Sanctum, so this hands
    // it over just in time.
    onClaim: function(){
      if(PERSIST && PERSIST.town && PERSIST.town.buildings && PERSIST.town.buildings.sanctum){
        PERSIST.town.buildings.sanctum.unlocked = true;
        if(typeof showTownToast === 'function') showTownToast("✦ Kaine's door is unbarred.");
      }
    },
  },

  story_equip_safety_net: {
    id:             'story_equip_safety_net',
    title:          'Carry It With You',
    desc:           'Equip the Safety Net on any champion at the Sanctum.',
    type:           'equip_relic',
    targetRelicId:  'safety_net',
    target:         1,
    isStory:        true,
    rewards:        [{type:'gold', icon:'✦', amount:100, label:'Gold'}],
    // Round 67q: Kaine — closing the loop on his deck-builder
    // invitation. Player visits the Sanctum, Kaine slots the relic.
    issuer:         'Kaine',
    // Round 67q: chain continues into the market-build arc. Leona
    // brokers the road-clearing job; Barau steps in once the caravan
    // can reach town; the Shard Master closes the arc with the well.
    next:           'story_clear_pale_road',
  },

  // ── Chain part 2: opening the Market + Shard Well ─────────────────
  // The starter chain so far has been ??? then named NPCs the player
  // ALREADY knows from the deck-builder / forge / sanctum loop. From
  // here the chain widens the town: each quest unlocks one more
  // building, ending with the first Shard Well summon.

  story_clear_pale_road: {
    id:             'story_clear_pale_road',
    title:          'The Road Must Be Open',
    desc:           'Bandits and beasts have closed the Pale Road. The Merchant Caravan refuses to pass while it stays that way. Clear the road. The materials for a market wait beyond the rise, but only if the caravan can deliver them.',
    type:           'clear',
    areaId:         'pale_road',
    target:         1,
    isStory:        true,
    rewards:        [
      {type:'gold',     icon:'✦', amount:150, label:'Gold'},
      {type:'material', icon:'🪵', id:'thornwood_resin', amount:5, label:'Thornwood Resin'},
    ],
    issuer:         'Leona',
    next:           'story_meet_barau',
    onClaim: function(){
      // Unlock the Market on claim — the caravan can now reach town.
      if(PERSIST && PERSIST.town && PERSIST.town.buildings && PERSIST.town.buildings.market){
        PERSIST.town.buildings.market.unlocked = true;
        if(typeof showTownToast === 'function') showTownToast('✦ The Market opens its stalls.');
      }
    },
  },

  story_meet_barau: {
    id:             'story_meet_barau',
    title:          "Barau's Welcome",
    desc:           'The caravan made it. Barau has set up shop. Visit the Market — he says he has more to discuss than wares.',
    type:           'visit_building',
    targetBuildingId: 'market',
    target:         1,
    isStory:        true,
    rewards:        [
      {type:'soul_shards', icon:'🔮', amount:100, label:'Soul Shards'},
    ],
    issuer:         'Barau',
    next:           'story_first_summon',
    onClaim: function(){
      // Unlock the Shard Well — Barau's "tip" was about a place that
      // hears the shards. The player can now spend the 100 he just
      // gave them on a first summon.
      if(PERSIST && PERSIST.town && PERSIST.town.buildings && PERSIST.town.buildings.shard_well){
        PERSIST.town.buildings.shard_well.unlocked = true;
        if(typeof showTownToast === 'function') showTownToast('✦ Barau points to the Shard Well. Its door is no longer barred.');
      }
    },
  },

  story_first_summon: {
    id:             'story_first_summon',
    title:          'The Well Hears',
    desc:           'The Shard Master will not speak plainly. The well takes shards and gives champions. There is only one way to know what it gives you.',
    type:           'summon_complete',
    target:         1,
    isStory:        true,
    rewards:        [
      {type:'gold', icon:'✦', amount:200, label:'Gold'},
    ],
    issuer:         'Shard Master',
    next:           null,
  },
};

// Round 67q: questchain registry. Each entry lists the story-quest IDs
// that share a chain title. The post-init loop below stamps `chain`
// onto each member def so the rail / detail-card renders can pick it
// up as a per-quest tagline. Add future chains here (one per arc):
//   'M\'bur\'s Forge':  ['story_xxx', 'story_yyy'],
//   'Druid\'s Awakening': ['story_zzz', ...],
// and the same renderer surfaces them without further code.
var STORY_QUEST_CHAINS = {
  'New Beginnings': [
    'story_reach_lv2',
    'story_edit_deck',
    'story_reach_lv3',
    'story_craft_safety_net',
    'story_equip_safety_net',
    'story_clear_pale_road',
    'story_meet_barau',
    'story_first_summon',
  ],
};

Object.keys(STORY_QUEST_CHAINS).forEach(function(chainTitle){
  STORY_QUEST_CHAINS[chainTitle].forEach(function(qid){
    if(STORY_QUESTS[qid]) STORY_QUESTS[qid].chain = chainTitle;
  });
});

// Lookup helper so the renderer can pull the chain title even when
// the saved offered-def doesn't carry it (older saves predating this
// round). Falls back to the live STORY_QUESTS entry by id.
function getQuestChainTitle(def){
  if(!def) return null;
  if(def.chain) return def.chain;
  if(def.id && STORY_QUESTS[def.id] && STORY_QUESTS[def.id].chain) return STORY_QUESTS[def.id].chain;
  return null;
}

// Adds a story quest def to quests.offered (so the rail can look it up)
// and pushes { id, progress:0 } to active. Idempotent — re-adding the
// same id is a no-op.
//
// Round 67p: also checks the goal against current PERSIST state on
// activation. If the player has already satisfied the goal (e.g.
// activating "reach level 3" while already level 5), progress is set
// to target immediately so the quest is claimable straight away —
// no busywork.
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
  var startProgress = _checkStoryQuestAlreadyMet(def) ? (def.target || 1) : 0;
  q.active.push({ id: def.id, progress: startProgress });
  if(typeof savePersist === 'function') savePersist();
  // Round 67q: announce story quests with issuer attribution. Random
  // bounties don't toast on activation — they're picked up from the
  // Hall board, no surprise reveal. Story quests are pushed at the
  // player, so the toast doubles as a "where did this come from" cue.
  if(def.isStory && typeof showTownToast === 'function'){
    var issuer = def.issuer || 'Leona';
    var prefix = (issuer === '???') ? '✦ NEW QUEST: ' : '✦ ' + issuer + ': ';
    showTownToast(prefix + (def.title || 'New task'));
  }
  if(def.isStory && typeof playQuestNotifySfx === 'function') playQuestNotifySfx();
  // Round 67r: fire the cyan quest-pointer particle from the new
  // quest's rail row to its UI target. Delayed so the rail has
  // time to repaint with the new row mounted. _fxQuestPointer
  // no-ops gracefully if the row / target isn't visible yet.
  if(def.isStory && typeof _fxQuestPointer === 'function'){
    setTimeout(function(){ _fxQuestPointer(def.id); }, 900);
  }
}

// Check whether the player has already met the quest's goal at the
// moment of activation. Returns true → quest activates as claimable.
function _checkStoryQuestAlreadyMet(def){
  if(!def) return false;
  if(def.type === 'reach_level'){
    // Any unlocked champion at or above the target level satisfies it.
    var targetLv = def.targetLevel || 2;
    var champs = (PERSIST.champions || {});
    for(var cid in champs){
      var cp = champs[cid];
      if(cp && (cp.level || 1) >= targetLv) return true;
    }
    return false;
  }
  if(def.type === 'craft_relic'){
    var rid = def.targetRelicId;
    if(!rid) return false;
    return !!(PERSIST.town && PERSIST.town.relics && PERSIST.town.relics[rid] && PERSIST.town.relics[rid] > 0);
  }
  if(def.type === 'equip_relic'){
    var rid2 = def.targetRelicId;
    if(!rid2) return false;
    var champs2 = (PERSIST.champions || {});
    for(var cid2 in champs2){
      var cp2 = champs2[cid2];
      if(cp2 && Array.isArray(cp2.relics) && cp2.relics.indexOf(rid2) !== -1) return true;
    }
    return false;
  }
  // Round 67q: clear / visit_building / summon_complete branches.
  if(def.type === 'clear'){
    var aid = def.areaId;
    if(!aid) return false;
    // PERSIST.areaRuns[aid] tracks every run started in that area.
    // If the player has already finished a run there, the quest is met.
    return !!(PERSIST.areaRuns && (PERSIST.areaRuns[aid] || 0) > 0);
  }
  if(def.type === 'visit_building'){
    var bid = def.targetBuildingId;
    if(!bid) return false;
    // Round 67r: openBuilding() now stamps b.visited=true when the
    // player actually opens a panel. Use that instead of b.unlocked,
    // which was returning true for default-unlocked buildings like
    // the Hall (game.js:842) and auto-completing story_visit_hall on
    // activation.
    var b = PERSIST.town && PERSIST.town.buildings && PERSIST.town.buildings[bid];
    return !!(b && b.visited);
  }
  if(def.type === 'summon_complete'){
    // Any champion unlock beyond the starter trio (druid/paladin/thief)
    // means a summon (or achievement reward) granted them — treat that
    // as "you've used the well already".
    var starters = ['druid','paladin','thief'];
    var champs = PERSIST.unlockedChamps || [];
    for(var i = 0; i < champs.length; i++){
      if(starters.indexOf(champs[i]) === -1) return true;
    }
    return false;
  }
  // edit_deck always requires the in-game action — we can't tell
  // retroactively whether the player ever saved a deck change.
  return false;
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
