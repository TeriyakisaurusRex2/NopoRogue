// ════════════════════════════════════════════════════════════════
// AUDIO SYSTEM — Noporogue
// ════════════════════════════════════════════════════════════════
// All sound effects and music are managed here.
// game.js calls playSfx('key') and music functions — never touches
// Audio objects or file paths directly.
//
// SFX files expected at: assets/audio/sfx/{key}.mp3
// Music files expected at: assets/audio/music/{key}.mp3
//
// To add a new sfx: add it to SFX_FILES below, drop the mp3 in
// assets/audio/sfx/, then call playSfx('your_key') where needed.
// ════════════════════════════════════════════════════════════════

// ── SFX catalogue ──────────────────────────────────────────────
// Each entry: volume multiplier relative to the sfx slider (0–1).
// Tweak these if something feels too loud or too quiet.
var SFX_FILES = {
  card_play:      { file:'card_play',      vol:1.0  },
  card_draw:      { file:'card_draw',      vol:0.7  },
  card_shuffle:   { file:'card_shuffle',   vol:0.6  },
  victory:        { file:'victory',        vol:1.0  },  // per-enemy kill
  win:            { file:'win',            vol:1.0  },  // area complete
  defeat:         { file:'defeat',         vol:1.0  },
  damage_player:  { file:'damage_player',  vol:0.85 },
  damage_enemy:   { file:'damage_enemy',   vol:0.75 },
  level_up:       { file:'level_up',       vol:1.0  },
  innate_activate:{ file:'innate_activate',vol:0.9  },
  ui_click:       { file:'ui_click',       vol:0.6  },
  ui_close:       { file:'ui_close',       vol:0.5  },
  ui_settings:    { file:'ui_settings',    vol:0.6  },
  quest_notify:   { file:'quest_notify',   vol:0.9  },
  enter_area:     { file:'enter_area',     vol:0.85 },
  accept:         { file:'accept',         vol:0.9  },
  scribble:       { file:'scribble',       vol:0.7  },
  ascend:         { file:'ascend',         vol:1.0  },
  craft_start:    { file:'craft_start',    vol:0.8  },
  craft_done:     { file:'craft_done',     vol:1.0  },
  abandon:        { file:'abandon',        vol:0.8  },
  well_claim:     { file:'well_claim',     vol:0.9  },  // Round 46 — Shard Well CLAIM
  // ── Deck Editor (de_*) ───────────────────────────────────────
  de_small_click: { file:'de_small_click', vol:0.7  },  // adding a card
  de_remove:      { file:'de_remove',      vol:0.75 },  // removing a card
  de_deck_saved:  { file:'de_deck_saved',  vol:0.85 },  // save & exit
  de_deadweight:  { file:'de_deadweight',  vol:0.7  },  // filler appears in deck
};

var SFX_BASE = 'assets/audio/sfx/';

// Pre-load all sfx into Audio objects so first play has no delay.
// We keep a small pool per key to allow rapid overlapping plays
// (e.g. card_draw firing quickly with a full hand).
var _sfxPool = {};
var _sfxPoolSize = 3; // simultaneous instances per sound

(function _initSfx(){
  Object.keys(SFX_FILES).forEach(function(key){
    var def = SFX_FILES[key];
    _sfxPool[key] = [];
    for(var i = 0; i < _sfxPoolSize; i++){
      var a = new Audio(SFX_BASE + def.file + '.mp3');
      a.preload = 'auto';
      _sfxPool[key].push(a);
    }
  });
})();

// Round-robin index per key so rapid plays cycle through the pool.
var _sfxPoolIdx = {};

function playSfx(key){
  if(!SETTINGS || SETTINGS.sfx <= 0) return;
  var def = SFX_FILES[key];
  if(!def || !_sfxPool[key]) return;
  var pool = _sfxPool[key];
  var idx = (_sfxPoolIdx[key] || 0) % pool.length;
  _sfxPoolIdx[key] = idx + 1;
  var a = pool[idx];
  try{
    a.currentTime = 0;
    a.volume = Math.min(1, (SETTINGS.sfx / 100) * def.vol);
    a.play().catch(function(){});
  } catch(e){}
}

// ── Convenience wrappers (called by game.js) ───────────────────
// These replace the old playVictorySfx / playSelectSfx functions.

function playCardPlaySfx()    { playSfx('card_play');       }
function playCardDrawSfx()    { playSfx('card_draw');       }
function playCardShuffleSfx() { playSfx('card_shuffle');    }
function playVictorySfx()     { playSfx('victory');         }  // per-enemy
function playWinSfx()         { playSfx('win');             }  // area complete
function playDefeatSfx()      { playSfx('defeat');          }
function playDamagePlayerSfx(){ playSfx('damage_player');   }
function playDamageEnemySfx() { playSfx('damage_enemy');    }
function playLevelUpSfx()     { playSfx('level_up');        }
function playInnateSfx()      { playSfx('innate_activate'); }
function playUiClickSfx()     { playSfx('ui_click');        }
function playUiCloseSfx()     { playSfx('ui_close');        }
function playUiSettingsSfx()  { playSfx('ui_settings');     }
function playQuestNotifySfx() { playSfx('quest_notify');    }
function playEnterAreaSfx()   { playSfx('enter_area');      }

// Legacy aliases so any old call sites still work
function playSelectSfx()      { playSfx('ui_click');        }
function playCardSfx()        { playSfx('card_play');       }
function playQuestAcceptSfx() { playSfx('accept'); playSfx('scribble'); }
function playAscendSfx()      { playSfx('ascend');          }
function playCraftStartSfx()  { playSfx('craft_start');     }
function playCraftDoneSfx()   { playSfx('craft_done');      }
// Deck editor wrappers
function playDeAddSfx()       { playSfx('de_small_click');  }
function playDeRemoveSfx()    { playSfx('de_remove');       }
function playDeSavedSfx()     { playSfx('de_deck_saved');   }
function playDeDeadweightSfx(){ playSfx('de_deadweight');   }

// ── Live volume update ─────────────────────────────────────────
// Called from applySetting('sfx', v) so the slider is instant.
function updateSfxVolume(pct){
  // Nothing to update on pooled Audio objects — volume is read fresh
  // each time playSfx() is called, so slider changes take effect
  // on the very next sound that plays.
  // Music is handled separately below.
  updateMusicVolume(pct === undefined ? SETTINGS.music : null);
}

// ════════════════════════════════════════════════════════════════
// MUSIC SYSTEM
// ════════════════════════════════════════════════════════════════
// One looping track plays at a time. Crossfades on track change.
// Tracks expected at: assets/audio/music/{key}.mp3

// Round 67l: music system rebuilt around SCENE SETS instead of
// individual track keys. Each "set" is a pool of one or more tracks
// associated with a scene (menu / town / battle). When a track ends
// naturally, the system re-checks the player's current screen and
// picks the next track from that scene's set — so if a battle ends
// mid-song the music auto-transitions to menu/town on the next
// track boundary instead of looping a battle theme on the area screen.
//
// Track files expected at assets/audio/music/<key>.mp3.
//
// Backwards-compat: playMusic('menu_theme') / ('theme_town') still
// work via the alias map below — callers haven't been updated yet.
var MUSIC_SETS = {
  menu:   { tracks:['theme_menu'],                       label:'Adventurer\'s Rest' },
  town:   { tracks:['theme_town_1','theme_town_2'],      label:'The Town at Dusk'   },
  battle: { tracks:['theme_battle_1','theme_battle_2'],  label:'Battle'             },
};
// Per-track display names. Falls back to set.label if a track isn't
// listed here individually.
var MUSIC_TRACK_NAMES = {
  theme_menu:     'Adventurer\'s Rest',
  theme_town_1:   'The Town at Dusk I',
  theme_town_2:   'The Town at Dusk II',
  theme_battle_1: 'Battle Theme I',
  theme_battle_2: 'Battle Theme II',
};
// Legacy aliases — old call sites used these key strings; keep the
// alias map so we don't have to chase down every playMusic('menu_theme')
// in one round.
var _LEGACY_MUSIC_ALIASES = {
  menu_theme: 'menu',
  theme_town: 'town',
};

var MUSIC_BASE = 'assets/audio/music/';
var _musicSet      = null;   // current scene set key ('menu' | 'town' | 'battle')
var _musicTrack    = null;   // currently-playing track key ('theme_menu' etc)
var _musicEl       = null;   // active Audio element
var _musicFadeTimer= null;
var _musicPaused   = false;  // manual pause (skip/pause button); independent from screen-transition fades

// Pick a set key based on which .screen.active is currently visible.
// Used by _onTrackEnded as a self-correcting fallback so the music
// stays in sync with the screen even if a playMusic call was missed.
function _deriveMusicSetForScreen(){
  var gs_el  = document.getElementById('game-screen');
  if(gs_el && gs_el.classList.contains('active')) return 'battle';
  var tn_el  = document.getElementById('town-screen');
  if(tn_el && tn_el.classList.contains('active')) return 'town';
  // login, select, area, deck, deck-edit — all map to menu
  return 'menu';
}

// Public entry. setKey is one of 'menu' / 'town' / 'battle' — or a
// legacy track key ('menu_theme' / 'theme_town') for backwards compat.
//
// Round 67o: scene transitions no longer interrupt the currently
// playing track. We just update _musicSet (the desired pool) and let
// the current song play to its natural end. _onTrackEnded re-derives
// the right set from the active screen and picks fresh from there —
// so the music swaps at the song boundary, not mid-bar. This avoids
// the jarring "menu → battle" mid-track crossfade and gives songs
// time to breathe.
//
// We only KICK OFF a new track if nothing is currently playing
// (initial load, after stopMusic, or while autoplay-blocked). Manual
// pause (_musicPaused) is respected — playMusic during a manual pause
// won't auto-resume; the player has to hit Play again.
function playMusic(setKey){
  if(_LEGACY_MUSIC_ALIASES[setKey]) setKey = _LEGACY_MUSIC_ALIASES[setKey];
  if(!MUSIC_SETS[setKey]) return;
  _musicSet = setKey;
  // Manual pause sticks across scene changes.
  if(_musicEl && _musicPaused) return;
  // Track is actively playing — let it finish; _onTrackEnded will pick
  // from the (now-updated) _musicSet on the next boundary.
  if(_musicEl && !_musicEl.paused) return;
  // Nothing playing (initial / stopped) OR element exists but paused
  // due to autoplay block — start a fresh track now.
  _musicPaused = false;
  _playNextInSet();
}

// Internal: pick a track from the current set and play it.
function _playNextInSet(){
  if(!_musicSet || !MUSIC_SETS[_musicSet]){
    _fadeOutMusic(function(){ _musicTrack = null; });
    return;
  }
  var tracks = MUSIC_SETS[_musicSet].tracks || [];
  if(!tracks.length){
    _fadeOutMusic(function(){ _musicTrack = null; });
    return;
  }
  var pick;
  if(tracks.length === 1){
    pick = tracks[0];
  } else {
    // Multi-track set: pick random, but avoid replaying the same
    // track twice in a row when alternatives exist.
    var pool = tracks.filter(function(t){ return t !== _musicTrack; });
    if(!pool.length) pool = tracks;
    pick = pool[Math.floor(Math.random() * pool.length)];
  }
  _playTrack(pick);
}

// Internal: crossfade from the current track (if any) to a new track.
// Round 67n: replaced sequential fade-out → fade-in with a true
// simultaneous crossfade. Old track fades down while new track fades
// up over the same window, so there's no audible gap between menu
// and battle music. Time-based duration (not volume-step-based) so
// the transition feels the same regardless of master volume — the
// old step-based fade went from 1.0 → 0 in 600ms but from 0.2 → 0
// in only 120ms, hence the "hard cut" sensation at low volumes.
function _playTrack(key){
  _stopMusicFade();
  var targetVol = Math.min(1, (SETTINGS.music || 0) / 100);
  if(targetVol <= 0){
    // Volume is 0 — mark the intended track but don't actually play.
    _musicTrack = key;
    if(_musicEl) _musicEl.pause();
    return;
  }

  // Build the new audio element.
  var newEl = new Audio(MUSIC_BASE + key + '.mp3');
  newEl.loop = false;  // let 'ended' fire so we can re-pick from the set
  newEl.volume = 0;
  newEl.addEventListener('ended', _onTrackEnded);

  // Capture the outgoing element + its volume BEFORE we swap _musicEl.
  var oldEl = _musicEl;
  var oldStartVol = oldEl ? oldEl.volume : 0;

  // Start the new track (autoplay-block recovery in case it's the
  // first play of the session and the user hasn't interacted yet).
  var p = newEl.play();
  if(p && typeof p.catch === 'function'){
    p.catch(function(){ _armMusicAutoplayRetry(); });
  }

  // Swap current pointers immediately. If anything queries _musicEl
  // mid-fade (refreshNowPlaying, skip, pause), it sees the new track.
  _musicEl = newEl;
  _musicTrack = key;
  _musicPaused = false;

  // Crossfade window — long enough to feel intentional, short enough
  // to not drag. 1.2s reads as a deliberate musical bridge.
  var fadeMs = 1200;
  var startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  _musicFadeTimer = setInterval(function(){
    var now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    var progress = Math.min(1, (now - startTime) / fadeMs);
    // Fade old down (linear). If oldEl was null this is a no-op.
    if(oldEl){
      oldEl.volume = Math.max(0, oldStartVol * (1 - progress));
    }
    // Fade new up (linear, clamped to target).
    newEl.volume = Math.min(targetVol, targetVol * progress);
    if(progress >= 1){
      clearInterval(_musicFadeTimer);
      _musicFadeTimer = null;
      if(oldEl){ oldEl.pause(); }
    }
  }, 30);

  if(typeof refreshNowPlaying === 'function') refreshNowPlaying();
}

// Round 67m: arm a one-shot global gesture listener that retries
// _musicEl.play() the moment the user interacts. Re-arms on its own
// if the retry is still blocked (rare — usually one gesture suffices).
var _musicAutoplayRetryArmed = false;
function _armMusicAutoplayRetry(){
  if(_musicAutoplayRetryArmed) return;
  _musicAutoplayRetryArmed = true;
  var fire = function(){
    document.removeEventListener('click',       fire, true);
    document.removeEventListener('keydown',     fire, true);
    document.removeEventListener('touchstart',  fire, true);
    _musicAutoplayRetryArmed = false;
    if(_musicEl && _musicEl.paused){
      var p = _musicEl.play();
      if(p && typeof p.catch === 'function'){
        p.catch(function(){ _armMusicAutoplayRetry(); });
      }
      if(typeof refreshNowPlaying === 'function') refreshNowPlaying();
    }
  };
  // Capture phase so we hear the gesture before any specific handler
  // might preventDefault or stopPropagation it.
  document.addEventListener('click',      fire, true);
  document.addEventListener('keydown',    fire, true);
  document.addEventListener('touchstart', fire, true);
}

// Fired when a track finishes playing naturally. Re-derives the set
// from the current screen (so e.g. if combat ended mid-song the music
// transitions to menu on the next track boundary) then picks fresh.
function _onTrackEnded(){
  var derived = _deriveMusicSetForScreen();
  if(derived !== _musicSet) _musicSet = derived;
  _playNextInSet();
}

function stopMusic(){
  _musicSet = null;
  _fadeOutMusic(function(){
    _musicTrack = null;
    if(typeof refreshNowPlaying === 'function') refreshNowPlaying();
  });
}

// Skip the current track — picks another from the same set if more
// than one is available, else re-picks the only one (effectively a
// restart). Used by the Settings → Audio "skip" button.
function skipMusicTrack(){
  if(!_musicSet) return;
  _playNextInSet();
}

// Pause / resume / toggle. Independent of screen-transition fades —
// when paused, the screen-change playMusic call won't auto-resume
// (player has to hit Play again). Used by the Settings → Audio
// pause button.
function pauseMusic(){
  if(!_musicEl || _musicPaused) return;
  _musicEl.pause();
  _musicPaused = true;
  if(typeof refreshNowPlaying === 'function') refreshNowPlaying();
}
function resumeMusic(){
  if(!_musicEl || !_musicPaused) return;
  _musicEl.play().catch(function(){});
  _musicPaused = false;
  if(typeof refreshNowPlaying === 'function') refreshNowPlaying();
}
function toggleMusicPause(){
  if(_musicPaused) resumeMusic();
  else pauseMusic();
}
function isMusicPaused(){ return _musicPaused; }

// Returns the display name of the currently-playing track, or null
// when music is stopped / muted / paused. Used by Settings panel's
// AUDIO tab "Now Playing" line.
function getCurrentMusicName(){
  if(!_musicTrack) return null;
  if(!SETTINGS || !SETTINGS.music) return null;
  return MUSIC_TRACK_NAMES[_musicTrack]
      || (MUSIC_SETS[_musicSet] && MUSIC_SETS[_musicSet].label)
      || _musicTrack;
}

function updateMusicVolume(){
  if(!_musicEl) return;
  var v = Math.min(1, (SETTINGS.music || 0) / 100);
  _musicEl.volume = v;
  if(v <= 0) _musicEl.pause();
  else if(_musicEl.paused){ _musicEl.play().catch(function(){}); }
}

function _fadeOutMusic(cb){
  if(!_musicEl){ if(cb) cb(); return; }
  var el = _musicEl;
  _musicEl = null;
  var step = 0.05;
  _stopMusicFade();
  _musicFadeTimer = setInterval(function(){
    el.volume = Math.max(0, el.volume - step);
    if(el.volume <= 0){
      clearInterval(_musicFadeTimer);
      _musicFadeTimer = null;
      el.pause();
      if(cb) cb();
    }
  }, 30);
}

function _fadeInMusic(targetVol){
  if(!_musicEl) return;
  var el = _musicEl;
  var step = 0.03;
  _stopMusicFade();
  _musicFadeTimer = setInterval(function(){
    if(!_musicEl || _musicEl !== el){ clearInterval(_musicFadeTimer); return; }
    el.volume = Math.min(targetVol, el.volume + step);
    if(el.volume >= targetVol){
      clearInterval(_musicFadeTimer);
      _musicFadeTimer = null;
    }
  }, 30);
}

function _stopMusicFade(){
  if(_musicFadeTimer){ clearInterval(_musicFadeTimer); _musicFadeTimer = null; }
}
