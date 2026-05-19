/* =====================================================================
   Noporogue FX — engine
   Adapted from Claude Design handoff (chat1.md). Original lab used a
   standalone 1920×1080 #stage. Here the game's #game-root IS that
   design surface (transform-scaled to viewport), so:
     - fitStage() is dropped — #game-root handles scaling already
     - rectInStage / centerInStage measure relative to #game-root
     - canvas lives inside #game-screen, positioned absolute at 1920×1080
   ---------------------------------------------------------------------
   Effects are objects with .update(dt, now) and .draw(ctx). Returning
   false from update() culls the effect.
   ===================================================================== */

(function () {
  'use strict';

  // ---------- design-surface dimensions ----------
  // Must match #game-root's fixed size — see CLAUDE.md ("1920×1080
  // fixed design surface, scaled via CSS transform").
  var STAGE_W = 1920;
  var STAGE_H = 1080;

  // ---------- canvas (lazy — may not exist on first script load) ----
  var canvas = null;
  var ctx = null;
  function ensureCanvas(){
    if(canvas) return canvas;
    canvas = document.getElementById('fx-canvas');
    if(!canvas) return null;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return canvas;
  }

  // ---------- sprite cache ----------
  // Round 67q: lazy-loaded Image objects, keyed by short id. Effects
  // request a sprite via getSprite(id); the first call kicks off the
  // load and returns null. Subsequent calls return the cached Image
  // once it has fired its 'load' event. Effects that need a sprite
  // should no-op or fall back to a primitive draw when null is
  // returned — letting them animate even before assets settle.
  var SPRITE_PATHS = {
    'shield_left':  'assets/icons/shield_left.png',
    'shield_right': 'assets/icons/shield_right.png',
    'shield_full':  'assets/icons/shield_full.png'
  };
  var _spriteCache = {};
  function getSprite(id){
    if(!SPRITE_PATHS[id]) return null;
    var entry = _spriteCache[id];
    if(!entry){
      entry = { img: new Image(), loaded: false };
      entry.img.onload = function(){ entry.loaded = true; };
      entry.img.src = SPRITE_PATHS[id];
      _spriteCache[id] = entry;
      return null;
    }
    return entry.loaded ? entry.img : null;
  }
  // Kick off preloads now so first use isn't blank.
  Object.keys(SPRITE_PATHS).forEach(function(id){ getSprite(id); });

  // ---------- effects list ----------
  var effects = [];
  function add(effect){ effects.push(effect); return effect; }

  // ---------- particle ----------
  function Particle(opts){
    this.x = opts.x;
    this.y = opts.y;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.ax = opts.ax || 0;
    this.ay = opts.ay || 0;
    this.size = opts.size || 2;
    this.color = opts.color || '#fff';
    this.life = opts.life || 300;
    this.maxLife = this.life;
    this.fade = opts.fade || 'linear';
    this.dead = false;
  }
  Particle.prototype.update = function(dt){
    this.vx += this.ax * dt;
    this.vy += this.ay * dt;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.life -= dt * 1000;
    if(this.life <= 0) this.dead = true;
  };
  Particle.prototype.alpha = function(){
    var t = Math.max(0, this.life / this.maxLife);
    if(this.fade === 'quad') return t * t;
    if(this.fade === 'step3'){
      if(t > 0.66) return 1;
      if(t > 0.33) return 0.66;
      return 0.33;
    }
    return t;
  };
  Particle.prototype.draw = function(ctx){
    var a = this.alpha();
    if(a <= 0) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
  };

  // ---------- effect base ----------
  function Effect(){
    this.born = performance.now();
    this.particles = [];
    this.done = false;
  }
  Effect.prototype.age = function(now){ return (now || performance.now()) - this.born; };
  Effect.prototype.update = function(dt, now){
    for(var i = 0; i < this.particles.length; i++) this.particles[i].update(dt);
    this.particles = this.particles.filter(function(p){ return !p.dead; });
    if(this.tick) this.tick(dt, now);
    return !this.done || this.particles.length > 0;
  };
  Effect.prototype.draw = function(ctx){
    for(var i = 0; i < this.particles.length; i++) this.particles[i].draw(ctx);
    if(this.drawExtra) this.drawExtra(ctx);
    ctx.globalAlpha = 1;
  };

  // ---------- helpers ----------
  function rand(a, b){ return a + Math.random() * (b - a); }
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  var ease = {
    linear:    function(t){ return t; },
    inQuad:    function(t){ return t * t; },
    outQuad:   function(t){ return 1 - (1 - t) * (1 - t); },
    inOutQuad: function(t){ return t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2; },
    outCubic:  function(t){ return 1 - Math.pow(1 - t, 3); },
    outBack:   function(t){ var c1=1.70158, c3=c1+1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); }
  };

  // Get an element's rect in DESIGN-SURFACE coordinates (post-undo of
  // the CSS transform that scales #game-root to viewport). The game-
  // root width/height in computed CSS is 1920×1080, but getBoundingClientRect
  // returns the SCALED visual size — we use that ratio to map element
  // viewport coords back into design pixels.
  function rectInStage(el){
    var root = document.getElementById('game-root');
    if(!root || !el) return { x:0, y:0, w:0, h:0 };
    var rr = root.getBoundingClientRect();
    var er = el.getBoundingClientRect();
    var sx = rr.width  > 0 ? (STAGE_W / rr.width)  : 1;
    var sy = rr.height > 0 ? (STAGE_H / rr.height) : 1;
    return {
      x: (er.left - rr.left) * sx,
      y: (er.top  - rr.top)  * sy,
      w: er.width  * sx,
      h: er.height * sy
    };
  }
  function centerInStage(el){
    var r = rectInStage(el);
    return { x: r.x + r.w/2, y: r.y + r.h/2 };
  }

  // ---------- main loop ----------
  var last = performance.now();
  function frame(now){
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    var c = ensureCanvas();
    if(c){
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      for(var i = effects.length - 1; i >= 0; i--){
        var e = effects[i];
        var alive = e.update(dt, now);
        e.draw(ctx);
        if(!alive) effects.splice(i, 1);
      }
    } else {
      // No canvas (combat screen not mounted) — still tick effects so
      // they don't accumulate stale, but skip the draw work.
      for(var i2 = effects.length - 1; i2 >= 0; i2--){
        var e2 = effects[i2];
        var alive2 = e2.update(dt, now);
        if(!alive2) effects.splice(i2, 1);
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- export ----------
  window.FX = {
    add: add,
    effects: effects,
    Particle: Particle,
    Effect: Effect,
    rand: rand, pick: pick, lerp: lerp, ease: ease,
    rectInStage: rectInStage,
    centerInStage: centerInStage,
    getSprite: getSprite,
    STAGE_W: STAGE_W,
    STAGE_H: STAGE_H
  };
})();
