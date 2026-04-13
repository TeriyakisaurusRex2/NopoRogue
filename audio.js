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

var MUSIC_FILES = {
  // Add your music tracks here as you get them.
  // theme_menu:   'theme_menu',
  // theme_combat: 'theme_combat',
  // theme_town:   'theme_town',
};

var MUSIC_BASE = 'assets/audio/music/';
var _musicCurrent = null;  // key of currently playing track
var _musicEl = null;       // the active Audio element
var _musicFadeTimer = null;

function playMusic(key){
  if(_musicCurrent === key) return; // already playing
  _stopMusicFade();

  var file = MUSIC_FILES[key];
  if(!file){
    // No file registered for this key — stop any current music
    _fadeOutMusic(function(){ _musicCurrent = null; });
    return;
  }

  var targetVol = Math.min(1, (SETTINGS.music || 0) / 100);
  if(targetVol <= 0){
    // Music slider at 0 — don't play
    _musicCurrent = key;
    return;
  }

  _fadeOutMusic(function(){
    var a = new Audio(MUSIC_BASE + file + '.mp3');
    a.loop = true;
    a.volume = 0;
    a.play().catch(function(){});
    _musicEl = a;
    _musicCurrent = key;
    _fadeInMusic(targetVol);
  });
}

function stopMusic(){
  _fadeOutMusic(function(){
    _musicCurrent = null;
  });
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
