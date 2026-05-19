/* =====================================================================
   Noporogue FX — effects library
   Adapted from Claude Design handoff (chat1.md). Three reusable
   primitives covering Categories 1-3 from the FX brief:
     Effects.projectile({source, target, variant, accent})
     Effects.shield({target, color})
     Effects.slash({target, angle, color})
   Each returns the live Effect so callers can chain or cancel.
   ===================================================================== */

(function () {
  'use strict';

  var F = window.FX;

  var ACCENT = {
    void: { bright: '#b27adf', dim: '#5a2f80' },
    str:  { bright: '#e88060', dim: '#7a3826' },
    agi:  { bright: '#9adc7e', dim: '#3f7a32' },
    wis:  { bright: '#9ad8e8', dim: '#36707f' },
    gold: { bright: '#d4a843', dim: '#7a5b1a' }
  };
  function accentOf(c){
    if(typeof c === 'string' && ACCENT[c]) return ACCENT[c];
    if(typeof c === 'string') return { bright: c, dim: c };
    return c || ACCENT.void;
  }

  // ===================================================================
  // CATEGORY 1 — PROJECTILE with TRAIL
  // -------------------------------------------------------------------
  // Arc trajectory source → target, ~450ms, with one of three trail
  // variants: pixel-comet (dense behind head), wisp (slow ribbon),
  // spark-rain (perpendicular sparks under gravity). Beam-core is a
  // chunky white line with accent halo, tapering 12 px → 2 px from
  // head to tail tip. Impact burst on arrival.
  // ===================================================================
  function projectile(opts){
    opts = opts || {};
    var source  = opts.source;
    var target  = opts.target;
    var variant = opts.variant || 'pixel-comet';
    var accent  = opts.accent  || 'void';
    var A = accentOf(accent);
    var e = new F.Effect();
    var DUR = 450;
    // Round 67r: ARC now overridable so callers can vary the arc
    // height of multiple bolts that fire near-simultaneously (e.g.
    // Shadow Step's Weaken + Sorcery Poison) — staggered bolts on
    // different arcs are individually readable instead of merging
    // into one blur. Default unchanged so single-bolt callers keep
    // their existing look.
    var ARC = (opts.arc != null) ? +opts.arc : -160;

    var head = { x: source.x, y: source.y };
    var lastSpawn = 0;
    var impacted = false;

    function velocityAt(t){
      var dx = (target.x - source.x) / (DUR / 1000);
      var dy = (target.y - source.y) / (DUR / 1000)
             + ARC * Math.PI * Math.cos(t * Math.PI) / (DUR / 1000);
      return { dx: dx, dy: dy };
    }

    function spawnCometTrail(now){
      if(now - lastSpawn < 14) return;
      lastSpawn = now;
      for(var i = 0; i < 2; i++){
        var white = Math.random() < 0.35;
        e.particles.push(new F.Particle({
          x: head.x + F.rand(-2, 2),
          y: head.y + F.rand(-2, 2),
          vx: F.rand(-10, 10),
          vy: F.rand(-10, 10),
          size: white ? 2 : 3,
          color: white ? '#ffffff' : (Math.random() < 0.5 ? A.bright : A.dim),
          life: F.rand(180, 260),
          fade: 'step3'
        }));
      }
    }

    function spawnWispTrail(now){
      if(now - lastSpawn < 55) return;
      lastSpawn = now;
      var t = (now - e.born) / DUR;
      var v = velocityAt(t);
      var mag = Math.hypot(v.dx, v.dy) || 1;
      var px = -v.dy / mag, py = v.dx / mag;
      for(var i = 0; i < 2; i++){
        var side = i === 0 ? 1 : -1;
        e.particles.push(new F.Particle({
          x: head.x, y: head.y,
          vx: px * side * F.rand(8, 22) - v.dx * 0.04,
          vy: py * side * F.rand(8, 22) - v.dy * 0.04,
          size: 3,
          color: Math.random() < 0.5 ? '#ffffff' : A.bright,
          life: F.rand(520, 680),
          fade: 'quad'
        }));
      }
    }

    function spawnSparkTrail(now){
      if(now - lastSpawn < 65) return;
      lastSpawn = now;
      var t = (now - e.born) / DUR;
      var v = velocityAt(t);
      var mag = Math.hypot(v.dx, v.dy) || 1;
      var px = -v.dy / mag, py = v.dx / mag;
      var n = 3 + Math.floor(Math.random() * 3);
      for(var i = 0; i < n; i++){
        var side = Math.random() < 0.5 ? -1 : 1;
        e.particles.push(new F.Particle({
          x: head.x, y: head.y,
          vx: px * side * F.rand(80, 180) + F.rand(-30, 30),
          vy: py * side * F.rand(80, 180) + F.rand(-30, 30),
          ay: 700,
          size: Math.random() < 0.5 ? 2 : 3,
          color: Math.random() < 0.5 ? '#ffffff' : A.bright,
          life: F.rand(280, 440),
          fade: 'linear'
        }));
      }
    }

    function impactBurst(x, y){
      for(var i = 0; i < 10; i++){
        var ang = (Math.PI * 2 * i / 10) + F.rand(-0.18, 0.18);
        var spd = F.rand(140, 260);
        e.particles.push(new F.Particle({
          x: x, y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: Math.random() < 0.4 ? 2 : 3,
          color: Math.random() < 0.4 ? '#ffffff' : A.bright,
          life: F.rand(220, 340),
          fade: 'step3'
        }));
      }
      for(var j = 0; j < 4; j++){
        e.particles.push(new F.Particle({
          x: x + F.rand(-4, 4), y: y + F.rand(-4, 4),
          vx: F.rand(-30, 30), vy: F.rand(-30, 30),
          size: 4,
          color: '#ffffff',
          life: 140, fade: 'step3'
        }));
      }
    }

    e.tick = function(dt, now){
      var age = now - this.born;
      var t = Math.min(1, age / DUR);

      head.x = F.lerp(source.x, target.x, t);
      head.y = F.lerp(source.y, target.y, t) + ARC * Math.sin(t * Math.PI);

      if(!impacted && t < 1){
        if(variant === 'pixel-comet') spawnCometTrail(now);
        else if(variant === 'wisp')   spawnWispTrail(now);
        else if(variant === 'spark-rain') spawnSparkTrail(now);
      }

      if(t >= 1 && !impacted){
        impacted = true;
        impactBurst(target.x, target.y);
        this.done = true;
      }
    };

    // Chunky beam core with accent halo + fading tail along the arc.
    e.drawExtra = function(ctx){
      if(impacted) return;
      var now = performance.now();
      var t = Math.min(1, (now - this.born) / DUR);

      var TAIL_MS = 130;
      var N = 14;
      var PIXGRID = 2;
      function snap(v){ return Math.floor(v / PIXGRID) * PIXGRID; }

      for(var i = N - 1; i >= 0; i--){
        var frac = i / (N - 1);
        var tBack = Math.max(0, t - (TAIL_MS / DUR) * frac);
        var x = F.lerp(source.x, target.x, tBack);
        var y = F.lerp(source.y, target.y, tBack) + ARC * Math.sin(tBack * Math.PI);
        var sx_ = snap(x), sy_ = snap(y);

        var size = Math.max(2, Math.round(F.lerp(12, 2, frac)));
        var half = Math.floor(size / 2);

        var haloA = (1 - frac) * 0.85;
        ctx.globalAlpha = haloA;
        ctx.fillStyle = A.bright;
        ctx.fillRect(sx_ - half - 1, sy_ - half - 1, size + 2, size + 2);

        var coreA = (1 - frac);
        ctx.globalAlpha = coreA;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx_ - half, sy_ - half, size, size);
      }

      ctx.globalAlpha = 1;
      var hx = snap(head.x), hy = snap(head.y);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - 8, hy - 2, 16, 4);
      ctx.fillRect(hx - 2, hy - 8, 4, 16);
      ctx.fillStyle = A.bright;
      ctx.fillRect(hx - 4, hy - 4, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - 2, hy - 2, 4, 4);
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // CATEGORY 2 — SHIELD FORMATION (Round 67q redesign)
  // -------------------------------------------------------------------
  // Sprite-driven. The two halves slide in from outside the target,
  // meet at centre with a flash + sparkle burst, the full shield
  // materialises, then a diagonal shine sweeps bottom-left → top-right
  // across the full sprite. Falls back to a primitive square pulse if
  // any sprite is still loading on first call.
  //   SLIDE_MS  280   halves travel from REACH offset to centre
  //   FLASH_MS  140   collision flash
  //   HOLD_MS   240   full shield held, includes the shine sweep
  //   SHINE_MS  280   diagonal sweep across the shield
  // ===================================================================
  function shield(opts){
    opts = opts || {};
    var target = opts.target;
    var color  = opts.color || '#d4a843';
    // Round 67r: shield-form SFX at the moment the animation starts —
    // halves haven't met yet, but the sound covers the full SLIDE +
    // FLASH window naturally.
    if(typeof playSfx === 'function') playSfx('shield_on');
    var e = new F.Effect();
    var cx = target.x, cy = target.y;
    var SLIDE = 280, FLASH = 140, HOLD = 380;
    var REACH = 280;
    var SHINE_MS = 280;
    // Display size for the full shield sprite. Half sprites are
    // assumed to be half this width each; the engine reads each sprite's
    // natural size so no per-source scaling math is needed here. 192 is
    // a clean 3× of a typical 64px source asset and reads at the right
    // visual weight beside a 96px combatant portrait.
    var DISPLAY = 192;
    var flashed = false;

    e.tick = function(dt, now){
      var age = now - this.born;
      if(age > SLIDE + FLASH + HOLD){ this.done = true; return; }
      if(!flashed && age >= SLIDE){
        flashed = true;
        // Sparkle ring at the moment of collision.
        for(var i = 0; i < 14; i++){
          var ang = (Math.PI * 2 * i / 14);
          var spd = F.rand(70, 150);
          this.particles.push(new F.Particle({
            x: cx, y: cy,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 2,
            color: i % 2 === 0 ? '#ffffff' : color,
            life: F.rand(240, 380),
            fade: 'step3'
          }));
        }
      }
    };

    // Helper — draw a sprite at integer scale, centred at (x,y), with
    // alpha. Returns the rendered width so the caller knows the band
    // for the shine. drawImage at integer scale + imageSmoothingEnabled
    // off keeps the pixel art crisp.
    function drawSprite(ctx, img, x, y, displayW, alpha){
      if(!img) return 0;
      // Source dims drive the aspect; we lock display WIDTH and let the
      // height fall out of the source ratio.
      var ratio = img.naturalHeight / img.naturalWidth;
      var w = Math.floor(displayW);
      var h = Math.floor(displayW * ratio);
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, Math.floor(x - w/2), Math.floor(y - h/2), w, h);
      return w;
    }

    // Primitive fallback when sprites aren't ready yet — a square pulse
    // so the effect still has a presence rather than rendering nothing.
    function fallbackPulse(ctx, alpha){
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = color;
      var s = 180;
      ctx.fillRect(Math.floor(cx - s/2), Math.floor(cy - s/2), s, s);
    }

    // Helper: lazy per-effect offscreen canvas. Reused across phases.
    var self = e;
    function ensureOff(w, h){
      if(!self._off || self._off.width !== w || self._off.height !== h){
        self._off = document.createElement('canvas');
        self._off.width = w; self._off.height = h;
      }
      return self._off;
    }

    e.drawExtra = function(ctx){
      var age = performance.now() - this.born;
      var leftImg  = F.getSprite('shield_left');
      var rightImg = F.getSprite('shield_right');
      var fullImg  = F.getSprite('shield_full');

      if(age < SLIDE){
        // ── PHASE 1: halves slide in from outside the target panel ──
        // Round 67q (fix): each half rendered at full DISPLAY size so
        // the assembled silhouette matches the full shield. Previously
        // each half rendered at halfW=96, producing a combined image
        // half the size of the phase-2/3 full shield. The "growth" at
        // phase boundary read as a visual jump.
        var t = F.ease.outQuad(age / SLIDE);
        var leftX  = F.lerp(cx - REACH, cx, t);
        var rightX = F.lerp(cx + REACH, cx, t);
        if(leftImg)  drawSprite(ctx, leftImg,  leftX,  cy, DISPLAY, 1);
        if(rightImg) drawSprite(ctx, rightImg, rightX, cy, DISPLAY, 1);
        if(!leftImg && !rightImg) fallbackPulse(ctx, t);
      } else if(age < SLIDE + FLASH){
        // ── PHASE 2: collision flash — shield-shaped, NOT a square ──
        // Round 67q (fix): was painting a 216×216 parchment rect + a
        // 96×192 white rect over the combatant, neither clipped to
        // shield silhouette → "white square" symptom.
        // New: shield drawn normally + a white-tinted COPY of the
        // shield silhouette overlaid on top with fading alpha. The
        // overlay uses the same destination-in masking as phase 3.
        var tf = (age - SLIDE) / FLASH;
        if(!fullImg){
          fallbackPulse(ctx, 1 - tf);
        } else {
          // Base: full shield at full alpha.
          drawSprite(ctx, fullImg, cx, cy, DISPLAY, 1);

          // White overlay, masked to silhouette via offscreen + dst-in.
          var ratio2 = fullImg.naturalHeight / fullImg.naturalWidth;
          var w2 = Math.floor(DISPLAY);
          var h2 = Math.floor(DISPLAY * ratio2);
          var off2 = ensureOff(w2, h2);
          var octx2 = off2.getContext('2d');
          octx2.imageSmoothingEnabled = false;
          octx2.globalCompositeOperation = 'source-over';
          octx2.globalAlpha = 1;
          octx2.clearRect(0, 0, w2, h2);
          octx2.fillStyle = '#ffffff';
          octx2.fillRect(0, 0, w2, h2);
          octx2.globalCompositeOperation = 'destination-in';
          octx2.drawImage(fullImg, 0, 0, w2, h2);
          octx2.globalCompositeOperation = 'source-over';

          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = 1 - tf;
          ctx.drawImage(off2, Math.floor(cx - w2/2), Math.floor(cy - h2/2));
          ctx.globalAlpha = 1;
        }
      } else {
        // ── PHASE 3: full shield held + diagonal shine sweep ──
        // Round 67q: shine is now per-PIXEL clipped to the shield
        // silhouette (not just the bounding rect) via an offscreen
        // canvas + source-atop composite. The previous bounding-rect
        // clip painted shine across transparent corners of the sprite
        // and looked off. Offscreen approach:
        //   1) blit shield to offscreen at full alpha
        //   2) draw shine band on offscreen with source-atop — paints
        //      only where shield's own pixels are non-transparent
        //   3) blit offscreen to main canvas with phase-3 fade alpha
        var tp = (age - SLIDE - FLASH) / HOLD;
        var alpha = tp > 0.7 ? 1 - F.ease.inQuad((tp - 0.7) / 0.3) : 1;

        if(!fullImg){
          fallbackPulse(ctx, alpha);
        } else {
          var ratio = fullImg.naturalHeight / fullImg.naturalWidth;
          var w = Math.floor(DISPLAY);
          var h = Math.floor(DISPLAY * ratio);

          // Lazy per-effect offscreen canvas. Recreated if the
          // dimensions change (e.g. sprite finishes loading after
          // the first draw and reports a different natural size).
          if(!this._off || this._off.width !== w || this._off.height !== h){
            this._off = document.createElement('canvas');
            this._off.width = w; this._off.height = h;
          }
          var octx = this._off.getContext('2d');
          octx.imageSmoothingEnabled = false;
          // Defensive: reset composite to default in case anything in
          // the previous frame left it in a non-source-over state. Then
          // wipe and start fresh.
          octx.globalCompositeOperation = 'source-over';
          octx.globalAlpha = 1;
          octx.clearRect(0, 0, w, h);

          // Round 67q (v2 fix): switched from source-atop to a
          // destination-in masking technique. Symptom of the previous
          // approach: the shine band painted across the entire
          // 192×192 offscreen canvas instead of being clipped to the
          // shield silhouette (user reported "a whole square instead
          // of the shield shining"). source-atop *should* have worked
          // — the PNGs are RGBA — but something in the
          // translate/rotate/composite combination produced unmasked
          // output. destination-in is more straightforward:
          //   1. Draw the band FIRST, freely (it fills its own rect)
          //   2. drawImage(shield) with destination-in → keeps only
          //      band pixels where shield's alpha > 0
          //   3. drawImage(shield) with destination-over → fills the
          //      shield UNDER the masked band
          // Result: band-on-top, shield-underneath, both clipped to
          // shield silhouette. No source-atop involved.
          var shineT = (age - SLIDE - FLASH) / SHINE_MS;
          if(shineT >= 0 && shineT <= 1){
            // ── Step 1: draw the band freely ──
            octx.save();

            // Total band-centre travel along the BL→TR diagonal.
            var sweepDist = (w + h) / Math.SQRT2;
            var halfSweep = sweepDist / 2;
            var bandX = F.lerp(w/2 - halfSweep, w/2 + halfSweep, shineT);
            var bandY = F.lerp(h/2 + halfSweep, h/2 - halfSweep, shineT);
            var bandLen = (w + h) * 0.9;

            octx.translate(bandX, bandY);
            octx.rotate(-Math.PI / 4);

            // Symmetric 20-px-wide contiguous band.
            octx.globalAlpha = 0.55;
            octx.fillStyle = '#d4a843';
            octx.fillRect(-10, -bandLen, 4, bandLen * 2);
            octx.globalAlpha = 0.85;
            octx.fillStyle = '#fff7d6';
            octx.fillRect(-6, -bandLen, 4, bandLen * 2);
            octx.globalAlpha = 1.0;
            octx.fillStyle = '#ffffff';
            octx.fillRect(-2, -bandLen, 4, bandLen * 2);
            octx.globalAlpha = 0.85;
            octx.fillStyle = '#fff7d6';
            octx.fillRect(2, -bandLen, 4, bandLen * 2);
            octx.globalAlpha = 0.55;
            octx.fillStyle = '#d4a843';
            octx.fillRect(6, -bandLen, 4, bandLen * 2);
            octx.restore();

            // ── Step 2: mask band to shield silhouette (destination-in) ──
            octx.globalCompositeOperation = 'destination-in';
            octx.globalAlpha = 1;
            octx.drawImage(fullImg, 0, 0, w, h);

            // ── Step 3: fill shield under the masked band (destination-over) ──
            octx.globalCompositeOperation = 'destination-over';
            octx.drawImage(fullImg, 0, 0, w, h);

            // Reset composite for cleanliness.
            octx.globalCompositeOperation = 'source-over';
          } else {
            // No shine window active — just draw the shield.
            octx.drawImage(fullImg, 0, 0, w, h);
          }

          // 3) Blit offscreen → main canvas with phase alpha.
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = alpha;
          ctx.drawImage(this._off, Math.floor(cx - w/2), Math.floor(cy - h/2));
        }
      }
      ctx.globalAlpha = 1;
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // CATEGORY 2b — SHIELD BREAK (Round 67r)
  // -------------------------------------------------------------------
  // Inverse of the shield-formation animation. The two halves fall
  // outward + downward, rotating away from centre, fading as they go.
  // One shared visual for all three removal sources:
  //   1. Damage absorption depleted the shield value (combat.js)
  //   2. Manabound purge — mana hit 0 (game.js checkManabound)
  //   3. Duration expired — remaining hit 0 (game.js tickStatuses)
  // Each path fires Effects.shieldBreak with the same args. The
  // player learns "halves falling = shield gone" once, then reads
  // every future removal source the same way.
  //
  //   DUR_MS    700   total animation lifetime
  //   GRAVITY   900   px/s² downward
  //   DRIFT     ±260  px/s outward (left half left, right half right)
  //   LIFT      -80   px/s initial upward kick (so they hop slightly
  //                   before gravity pulls them down)
  //   SPIN      ±2.4  rad/s opposite rotations
  // ===================================================================
  function shieldBreak(opts){
    opts = opts || {};
    var target = opts.target || { x: 0, y: 0 };
    var color  = opts.color  || '#d4a843';
    // Round 67r: shield-break SFX at the moment the halves start
    // falling. Audio cue + visible debris pop hit at the same beat.
    if(typeof playSfx === 'function') playSfx('shield_off');

    var e = new F.Effect();
    var cx = target.x, cy = target.y;
    var DISPLAY = 192;           // matches shield-formation display size
    var DUR_MS  = 700;
    var GRAVITY = 900;
    var DRIFT   = 260;
    var LIFT    = -80;
    var SPIN    = 2.4;
    var burst   = false;

    function fallbackBurst(ctx, alpha){
      // No sprites yet — fall back to a gold debris pop so the moment
      // still registers visually.
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = color;
      var s = 24;
      ctx.fillRect(Math.floor(cx - s/2), Math.floor(cy - s/2), s, s);
      ctx.globalAlpha = 1;
    }

    e.tick = function(dt, now){
      var age = now - this.born;
      if(age > DUR_MS){ this.done = true; return; }
      // Initial crack burst — gold chips fly outward at the moment of
      // break, sells the "shattered" beat. Spawned once on the first
      // tick after born so it lines up with the halves starting to
      // separate.
      if(!burst){
        burst = true;
        for(var i = 0; i < 10; i++){
          var ang = (Math.PI * 2 * i / 10) + F.rand(-0.2, 0.2);
          var spd = F.rand(180, 320);
          e.particles.push(new F.Particle({
            x: cx + F.rand(-6, 6),
            y: cy + F.rand(-4, 4),
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 40,
            ay: 600,
            size: Math.random() < 0.4 ? 2 : 3,
            color: Math.random() < 0.4 ? '#ffffff' : color,
            life: F.rand(260, 420),
            fade: 'step3'
          }));
        }
      }
    };

    e.drawExtra = function(ctx){
      var age = performance.now() - this.born;
      if(age > DUR_MS) return;
      var t  = age / DUR_MS;                  // 0..1
      var ts = age / 1000;                    // seconds

      var leftImg  = F.getSprite('shield_left');
      var rightImg = F.getSprite('shield_right');
      var fullImg  = F.getSprite('shield_full');

      var fallY = LIFT * ts + 0.5 * GRAVITY * ts * ts;
      var leftX  = cx - DRIFT * ts;
      var rightX = cx + DRIFT * ts;
      var dropY  = cy + fallY;
      var rotL = -SPIN * ts;                  // left rotates CCW
      var rotR =  SPIN * ts;                  // right rotates CW
      // Fade easing — hold full alpha briefly, then ease out so the
      // shape is still readable as it starts falling.
      var alpha = t < 0.15 ? 1 : Math.max(0, 1 - (t - 0.15) / 0.85);

      ctx.imageSmoothingEnabled = false;

      if(!leftImg || !rightImg){
        // Fallback to the full sprite if halves aren't ready, or to
        // a primitive burst if even that isn't loaded.
        if(fullImg){
          var ratio = fullImg.naturalHeight / fullImg.naturalWidth;
          var w = Math.floor(DISPLAY);
          var h = Math.floor(DISPLAY * ratio);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(Math.floor(cx), Math.floor(dropY));
          ctx.drawImage(fullImg, -w/2, -h/2, w, h);
          ctx.restore();
        } else {
          fallbackBurst(ctx, alpha);
        }
        ctx.globalAlpha = 1;
        return;
      }

      // Draw each half rotated about its own centre, drifting outward
      // and falling.
      var ratioL = leftImg.naturalHeight / leftImg.naturalWidth;
      var ratioR = rightImg.naturalHeight / rightImg.naturalWidth;
      var wL = Math.floor(DISPLAY), hL = Math.floor(DISPLAY * ratioL);
      var wR = Math.floor(DISPLAY), hR = Math.floor(DISPLAY * ratioR);

      // Left half
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(Math.floor(leftX), Math.floor(dropY));
      ctx.rotate(rotL);
      ctx.drawImage(leftImg, -wL/2, -hL/2, wL, hL);
      ctx.restore();

      // Right half
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(Math.floor(rightX), Math.floor(dropY));
      ctx.rotate(rotR);
      ctx.drawImage(rightImg, -wR/2, -hR/2, wR, hR);
      ctx.restore();

      ctx.globalAlpha = 1;
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // CATEGORY 3 — SLASH IMPACT
  // -------------------------------------------------------------------
  // Diagonal stroke drawn quickly through target. Tapered thickness:
  // thin at ends, fattest in middle (sin(t·π) curve, up to 18 px).
  // On completion: expanding pixel-ring shockwave + cross flash +
  // perpendicular debris (inner fast burst + slower heavy chunks).
  // ===================================================================
  // opts:
  //   target     {x,y}        — centre of the cut
  //   angle      rad          — diagonal direction (default -π/4)
  //   length     px           — stroke length, base 340. Crit auto-bumps.
  //   color      css           — stroke colour, base white. Crit goes gold.
  //   hits       int 1+        — replay the impact N times at 120ms stagger
  //                              for multi-hit cards. Stroke draws once.
  //   crit       bool          — thicker stroke, gold tint, gold explosion
  function slash(opts){
    opts = opts || {};
    var target = opts.target;
    var angle  = (opts.angle != null) ? opts.angle : -Math.PI / 4;
    var crit   = !!opts.crit;
    var hits   = Math.max(1, Math.floor(opts.hits || 1));
    var length = opts.length || (crit ? 420 : 340);
    var color  = opts.color  || (crit ? '#ffe19a' : '#ffffff');

    var e = new F.Effect();
    var cx = target.x, cy = target.y;
    var cosA = Math.cos(angle), sinA = Math.sin(angle);
    var sx = cx - cosA * length / 2;
    var sy = cy - sinA * length / 2;
    var ex = cx + cosA * length / 2;
    var ey = cy + sinA * length / 2;
    var DRAW = 80;
    // Round 67q: multi-hit fades after the LAST impact lands, not the
    // first. Each extra hit adds 120ms of staggered impact bursts.
    var HIT_STAGGER = 120;
    var FADE = 240 + (hits - 1) * HIT_STAGGER;
    var MAX_THICK = crit ? 26 : 18;
    var PIXGRID = 2;
    function snap(v){ return Math.floor(v / PIXGRID) * PIXGRID; }

    var hitsFired = 0;
    var perpX = -sinA, perpY = cosA;

    function fireImpact(idx){
      // Single impact burst. Spawns debris perpendicular to the cut.
      // Crit hits get an extra gold-burst pass on top.
      // Round 67r: per-hit SFX. Pitch variation handled inside playSfx
      // via SFX_FILES.slash.pitchVar so each impact sounds slightly
      // different on multi-hit cards.
      if(typeof playSfx === 'function') playSfx('slash');
      var debrisColor = crit ? '#d4a843' : '#c0a060';
      var sparkColor  = crit ? '#fff7d6' : color;
      var n = crit ? 18 : 14;
      for(var i = 0; i < n; i++){
        var side = i % 2 === 0 ? 1 : -1;
        var along = F.rand(-0.25, 0.25);
        var spd = F.rand(140, crit ? 360 : 280);
        e.particles.push(new F.Particle({
          x: cx + along * length * cosA,
          y: cy + along * length * sinA,
          vx: perpX * side * spd + F.rand(-40, 40),
          vy: perpY * side * spd + F.rand(-40, 40),
          ay: 480,
          size: Math.random() < 0.4 ? 3 : 2,
          color: Math.random() < 0.35 ? sparkColor : debrisColor,
          life: F.rand(240, 420),
          fade: 'step3'
        }));
      }
      for(var j = 0; j < 6; j++){
        var sideJ = j % 2 === 0 ? 1 : -1;
        e.particles.push(new F.Particle({
          x: cx + F.rand(-12, 12),
          y: cy + F.rand(-12, 12),
          vx: perpX * sideJ * F.rand(40, 90) + F.rand(-20, 20),
          vy: perpY * sideJ * F.rand(40, 90) + F.rand(-20, 20),
          ay: 380,
          size: 4,
          color: debrisColor,
          life: F.rand(360, 520),
          fade: 'step3'
        }));
      }
      // Crit overload: extra outward gold star-burst, faster, denser.
      if(crit){
        for(var k = 0; k < 16; k++){
          var ang = (Math.PI * 2 * k / 16) + F.rand(-0.1, 0.1);
          var spd2 = F.rand(220, 380);
          e.particles.push(new F.Particle({
            x: cx, y: cy,
            vx: Math.cos(ang) * spd2,
            vy: Math.sin(ang) * spd2,
            size: 3,
            color: k % 2 === 0 ? '#ffffff' : '#d4a843',
            life: F.rand(280, 460),
            fade: 'step3'
          }));
        }
      }
    }

    e.tick = function(dt, now){
      var age = now - this.born;
      if(age > DRAW + FADE){ this.done = true; return; }
      // Schedule per-hit impacts at HIT_STAGGER intervals starting at DRAW.
      var dueHits = Math.min(hits, Math.floor((age - DRAW) / HIT_STAGGER) + 1);
      while(hitsFired < dueHits && hitsFired < hits && age >= DRAW){
        fireImpact(hitsFired);
        hitsFired++;
      }
    };

    e.drawExtra = function(ctx){
      var age = performance.now() - this.born;
      var progress = Math.min(1, age / DRAW);
      // For multi-hit, alpha holds steady through the impacts then fades.
      var fadeWindow = 240; // matches the original single-hit FADE
      var lastImpactAt = DRAW + (hits - 1) * HIT_STAGGER;
      var alpha = 1;
      if(age > lastImpactAt) alpha = Math.max(0, 1 - (age - lastImpactAt) / fadeWindow);

      // ── Tapered stroke (drawn once, at DRAW timing) ──
      ctx.globalAlpha = alpha;
      var N = 36;
      // Border colour for the stroke. Crit goes gold-on-gold; normal
      // is parchment-bordered white.
      var borderColor = crit ? '#d4a843' : '#c0a060';
      for(var i = 0; i < N; i++){
        var t = i / (N - 1);
        if(t > progress) break;
        var x = sx + (ex - sx) * t;
        var y = sy + (ey - sy) * t;
        var taper = Math.sin(t * Math.PI);
        var thick = Math.max(2, Math.round(2 + taper * (MAX_THICK - 2)));
        var half = Math.floor(thick / 2);
        var px = snap(x), py = snap(y);
        ctx.fillStyle = borderColor;
        ctx.fillRect(px - half - 1, py - half - 1, thick + 2, thick + 2);
        ctx.fillStyle = color;
        ctx.fillRect(px - half, py - half, thick, thick);
      }

      // ── Moving head sparkle while still drawing ──
      if(progress < 1){
        var xh = sx + (ex - sx) * progress;
        var yh = sy + (ey - sy) * progress;
        var taperHead = Math.sin(progress * Math.PI);
        var r = Math.round(4 + taperHead * (crit ? 10 : 6));
        ctx.fillStyle = crit ? '#fff7d6' : '#ffffff';
        ctx.fillRect(snap(xh) - r, snap(yh) - r, r * 2, r * 2);
      }

      // ── Per-impact shockwave + cross flash ──
      // For multi-hit, the ring + cross repeat for each impact in turn,
      // each scoped to its own ~fadeWindow/2 visibility window.
      for(var hi = 0; hi < hits; hi++){
        var impactStart = DRAW + hi * HIT_STAGGER;
        var hAge = age - impactStart;
        if(hAge < 0 || hAge > fadeWindow) continue;
        var k = hAge / fadeWindow;
        if(k < 0.5){
          var ringK = k / 0.5;
          var Rmax = crit ? 110 : 70;
          var R = Math.round(F.lerp(8, Rmax, ringK));
          ctx.globalAlpha = alpha * (1 - ringK) * 0.9;
          ctx.fillStyle = crit ? '#ffe19a' : '#ffffff';
          ctx.fillRect(snap(cx) - R,     snap(cy) - R,     R * 2, 3);
          ctx.fillRect(snap(cx) - R,     snap(cy) + R - 3, R * 2, 3);
          ctx.fillRect(snap(cx) - R,     snap(cy) - R,     3,     R * 2);
          ctx.fillRect(snap(cx) + R - 3, snap(cy) - R,     3,     R * 2);
        }
        if(k < 0.5){
          var cK = 1 - k / 0.5;
          ctx.globalAlpha = alpha * cK;
          ctx.fillStyle = crit ? '#fff7d6' : '#ffffff';
          var armLen = crit ? 26 : 18;
          var armT = crit ? 8 : 6;
          ctx.fillRect(snap(cx) - armLen, snap(cy) - armT/2, armLen * 2, armT);
          ctx.fillRect(snap(cx) - armT/2, snap(cy) - armLen, armT, armLen * 2);
          var dot = crit ? 14 : 10;
          ctx.fillRect(snap(cx) - dot/2, snap(cy) - dot/2, dot, dot);
        }
      }

      ctx.globalAlpha = 1;
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // CRIT FLASH — standalone overlay (Round 67q)
  // -------------------------------------------------------------------
  // Fired by the damage resolver when a crit lands, on top of whatever
  // base attack effect already played. Visible for ~300ms. Independent
  // of the slash function so non-melee cards can also trigger it (a
  // projectile crit, an AoE crit, etc).
  // ===================================================================
  function critFlash(target, targetEl){
    if(!target) return;
    // Round 67r: when the caller hands us the target's DOM element, briefly
    // tint it to a pure-black silhouette for the crit impact frames. The
    // browser does the silhouette work via CSS `filter: brightness(0)`,
    // which zeros all RGB channels while preserving alpha — emojis turn
    // into black blobs and creature sprites into black silhouettes. Reads
    // as a hit-stop "ouch" beat, layered under the gold cross + burst.
    if(targetEl){
      try {
        var prevFilter = targetEl.style.filter || '';
        var prevTransition = targetEl.style.transition || '';
        targetEl.style.transition = 'none';
        targetEl.style.filter = 'brightness(0)';
        setTimeout(function(){
          // Only revert if our class is still the one in effect — guards
          // against rapid follow-up crits that re-apply mid-window.
          if(targetEl.style.filter === 'brightness(0)'){
            targetEl.style.filter = prevFilter;
            targetEl.style.transition = prevTransition;
          }
        }, 140);
      } catch(silhouetteErr){}
    }
    var e = new F.Effect();
    var cx = target.x, cy = target.y;
    var DUR = 320;

    // Burst of bright gold + white outward particles.
    for(var i = 0; i < 22; i++){
      var ang = (Math.PI * 2 * i / 22) + F.rand(-0.12, 0.12);
      var spd = F.rand(220, 420);
      e.particles.push(new F.Particle({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: i % 2 === 0 ? 3 : 4,
        color: i % 2 === 0 ? '#ffe19a' : '#ffffff',
        life: F.rand(260, 440),
        fade: 'step3'
      }));
    }

    e.tick = function(dt, now){
      if(now - this.born > DUR) this.done = true;
    };

    // Quick "CRIT!" gold cross flash that fades over the duration.
    e.drawExtra = function(ctx){
      var age = performance.now() - this.born;
      var k = age / DUR;
      if(k > 1) return;
      var alpha = 1 - k;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffe19a';
      // Concentric pixel-square halo, expands outward.
      var R = Math.round(F.lerp(16, 90, k));
      ctx.fillRect(Math.floor(cx) - R,     Math.floor(cy) - R,     R * 2, 4);
      ctx.fillRect(Math.floor(cx) - R,     Math.floor(cy) + R - 4, R * 2, 4);
      ctx.fillRect(Math.floor(cx) - R,     Math.floor(cy) - R,     4,     R * 2);
      ctx.fillRect(Math.floor(cx) + R - 4, Math.floor(cy) - R,     4,     R * 2);
      ctx.globalAlpha = 1;
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // STATUS APPLY — lingering on-target effect (Round 67q)
  // -------------------------------------------------------------------
  // Per-keyword particle pattern that hangs on the target while a
  // status is being applied. Duration is short (1.5-2s default) — this
  // is the "you just got hit by it" cue, NOT the full lifetime of the
  // status (which can be many seconds). The status's HUD chip carries
  // the persistent indication; this is the impact flourish.
  //
  // Per-keyword visual is selected from STATUS_FX. Cards apply this by
  // calling Effects.statusApply(targetPos, statusId) at the moment the
  // status is added (the apply_status effect type already triggers
  // here via the router).
  // ===================================================================
  var STATUS_FX = {
    // Damage-over-time
    burn:      { color:'#ff7a40', tint:'#ffb070', motion:'rise', count:18, speed:[40, 90], life:[700, 1100] },
    poison:    { color:'#7fc06a', tint:'#b8e88c', motion:'drip', count:14, speed:[40, 80], life:[600, 900]  },
    bleed:     { color:'#c14040', tint:'#e87878', motion:'drip', count:12, speed:[60, 110], life:[500, 800] },
    // Control / debuffs
    stun:      { color:'#ffe19a', tint:'#ffffff', motion:'orbit', count:8,  speed:[80, 130], life:[900, 1300] },
    slow:      { color:'#9ad8e8', tint:'#cfeef5', motion:'drip', count:10, speed:[20, 50],  life:[700, 1000] },
    weaken:    { color:'#b070d0', tint:'#d8a8e8', motion:'fall', count:10, speed:[30, 60],  life:[600, 900]  },
    shock:     { color:'#ffe24a', tint:'#fff7d6', motion:'crackle', count:14, speed:[180, 320], life:[160, 300] },
    // Buffs (apply via statusApply too; the motion conveys positive vs
    // negative — buffs rise, debuffs fall/drip)
    haste:     { color:'#9adc7e', tint:'#fff7d6', motion:'rise', count:14, speed:[80, 130], life:[500, 800] },
    frenzy:    { color:'#ff7a40', tint:'#ffe19a', motion:'radiate', count:14, speed:[120, 180], life:[300, 500] },
    shield:    { color:'#d4a843', tint:'#fff7d6', motion:'rise', count:12, speed:[40, 80],  life:[600, 900] },
    thorns:    { color:'#c0a060', tint:'#e8d090', motion:'spike', count:10, speed:[140, 220], life:[280, 460] },
    dodge:     { color:'#9adc7e', tint:'#cfeef5', motion:'rise', count:10, speed:[60, 100], life:[500, 800] },
    mana_burn: { color:'#5a8be0', tint:'#9ad8e8', motion:'crackle', count:14, speed:[160, 280], life:[180, 320] }
  };

  function statusApply(target, statusId){
    if(!target) return null;
    var def = STATUS_FX[statusId] || STATUS_FX.burn;  // safe default
    // Round 67r: per-status SFX. Fires at the moment lingering motes
    // spawn, which is also the moment a bolt lands (statusBolt
    // schedules statusApply at +450ms). Self-applied buffs that skip
    // the bolt path fire immediately, matching the on-target visual.
    // Unregistered SFX keys no-op silently inside playSfx.
    if(typeof playSfx === 'function' && statusId){
      playSfx(statusId + '_on');
    }
    var e = new F.Effect();
    var cx = target.x, cy = target.y;
    var DUR = 1800;             // spawn window
    var SPAWN_GAP = 90;         // ms between particle batches
    var lastSpawn = 0;
    var spawnedTotal = 0;
    var batch = Math.max(1, Math.floor(def.count / Math.ceil(DUR / SPAWN_GAP)));

    function spawnOne(){
      var c = Math.random() < 0.5 ? def.color : def.tint;
      var lifeBase = F.rand(def.life[0], def.life[1]);
      var spd = F.rand(def.speed[0], def.speed[1]);
      // Spawn origin spreads around the target's centre. Each motion
      // gets its own distribution + initial velocity recipe.
      var ox = F.rand(-44, 44), oy = F.rand(-44, 44);
      var vx = 0, vy = 0, ax = 0, ay = 0;
      switch(def.motion){
        case 'rise':
          oy = F.rand(0, 50);
          vx = F.rand(-15, 15); vy = -spd; ay = 60;
          break;
        case 'drip':
          oy = F.rand(-40, 0);
          vx = F.rand(-10, 10); vy = spd; ay = 240;
          break;
        case 'fall':
          oy = F.rand(-50, -10);
          vx = F.rand(-30, 30); vy = spd * 0.6; ay = 380;
          break;
        case 'orbit':
          var ang = F.rand(0, Math.PI * 2);
          var rad = F.rand(28, 48);
          ox = Math.cos(ang) * rad; oy = -Math.abs(Math.sin(ang) * rad * 0.7) - 20;
          vx = -Math.sin(ang) * spd; vy = Math.cos(ang) * spd * 0.3 - 20;
          break;
        case 'crackle':
          var a2 = F.rand(0, Math.PI * 2);
          ox = Math.cos(a2) * F.rand(8, 20); oy = Math.sin(a2) * F.rand(8, 20);
          vx = Math.cos(a2) * spd; vy = Math.sin(a2) * spd;
          break;
        case 'radiate':
          var a3 = F.rand(0, Math.PI * 2);
          vx = Math.cos(a3) * spd; vy = Math.sin(a3) * spd;
          break;
        case 'spike':
          var a4 = F.rand(0, Math.PI * 2);
          vx = Math.cos(a4) * spd; vy = Math.sin(a4) * spd; ay = 100;
          break;
      }
      e.particles.push(new F.Particle({
        x: cx + ox, y: cy + oy,
        vx: vx, vy: vy,
        ax: ax, ay: ay,
        size: Math.random() < 0.4 ? 3 : 2,
        color: c,
        life: lifeBase,
        fade: 'step3'
      }));
    }

    e.tick = function(dt, now){
      var age = now - this.born;
      if(age > DUR && this.particles.length === 0){ this.done = true; return; }
      if(age <= DUR && now - lastSpawn >= SPAWN_GAP){
        lastSpawn = now;
        for(var i = 0; i < batch && spawnedTotal < def.count; i++){
          spawnOne();
          spawnedTotal++;
        }
      }
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // CATEGORY 3b — STATUS BOLT (Round 67r)
  // -------------------------------------------------------------------
  // Delivery primitive for status applications. Fires a pixel-comet
  // projectile from source → target, colored by the status's own hue
  // (STATUS_FX[id].color). On impact, triggers the lingering on-target
  // statusApply motes so the delivery + landing layer naturally.
  //
  // Used by the _fxStatusApplyFromTarget hook in game.js whenever a
  // DEBUFF lands — the projectile makes "who threw what at whom"
  // immediately readable. Buffs / self-applies skip this path and use
  // the on-target lingering effect alone.
  // ===================================================================
  function statusBolt(opts){
    opts = opts || {};
    if(!opts.source || !opts.target) return null;
    var sid = opts.statusId || 'burn';
    var def = STATUS_FX[sid] || STATUS_FX.burn;
    // Pass the status's own colour as the accent. accentOf() accepts
    // raw hex strings and returns {bright,dim} pointing at the same
    // colour, so the comet trail comes in as white-core + status-hue
    // tail (35% of trail particles spawn white, the rest in the hue).
    // Round 67r: opts.arc overrides the projectile's arc height so
    // burst-firing bolts (Shadow Step Weaken + Sorcery Poison) can be
    // staged on different curves.
    projectile({
      source: opts.source,
      target: opts.target,
      variant: 'pixel-comet',
      accent: def.color,
      arc: opts.arc
    });
    // Trigger the on-target lingering motes timed to coincide with the
    // projectile impact (~450ms). Layers with the impact burst so the
    // landing reads as a single moment: comet thud → motes bloom.
    setTimeout(function(){
      statusApply(opts.target, sid);
    }, 450);
  }

  // ===================================================================
  // Small utility — darken a hex color by a factor. Used for the heal
  // mote outline (auto-darkens from the input color). Falls back to a
  // sensible dim green if the input can't be parsed.
  // ===================================================================
  function darkenHex(hex, factor){
    factor = (factor != null) ? factor : 0.4;
    if(!hex || hex.charAt(0) !== '#') return '#3a7a32';
    var h = hex.replace('#','');
    if(h.length === 3) h = h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);
    if(h.length !== 6) return '#3a7a32';
    var r = parseInt(h.substr(0,2),16);
    var g = parseInt(h.substr(2,2),16);
    var b = parseInt(h.substr(4,2),16);
    if(isNaN(r)||isNaN(g)||isNaN(b)) return '#3a7a32';
    r = Math.max(0, Math.floor(r * factor));
    g = Math.max(0, Math.floor(g * factor));
    b = Math.max(0, Math.floor(b * factor));
    function hx(v){ var s = v.toString(16); return s.length < 2 ? '0'+s : s; }
    return '#' + hx(r) + hx(g) + hx(b);
  }

  // ===================================================================
  // CATEGORY 4 — HEAL (Round 67q)
  // -------------------------------------------------------------------
  // Green pixel '+' motes rise and rotate around the target. Spec from
  // Claude Design handoff: spawn over 1100ms, motes live 900-1300ms,
  // fade out over their last 500ms, rise vy -90..-55, rotation rate
  // -1.6..+1.6 rad/s, arm length picked from {3,4,4,5} px. Outline
  // auto-darkens from the input color.
  //
  // Motes don't fit the base Particle (which has no rotation field),
  // so we store them on e.motes and override drawExtra to render them.
  // ===================================================================
  function heal(opts){
    opts = opts || {};
    var target = opts.target;
    if(!target) return null;
    var color   = opts.color   || '#9adc7e';
    var outline = opts.outline || darkenHex(color, 0.4);

    var e = new F.Effect();
    e.motes = [];
    var cx = target.x, cy = target.y;
    var DUR = 1100;
    var SPAWN_MS = 55;
    var lastSpawn = 0;
    var ARMS = [3, 4, 4, 5];

    function spawnMote(){
      var ang = F.rand(0, Math.PI * 2);
      var r = F.rand(40, 120);
      var lifeMs = F.rand(900, 1300);
      return {
        x: cx + Math.cos(ang) * r,
        y: cy + Math.sin(ang) * r * 0.55,
        vy: F.rand(-90, -55),
        rot: F.rand(0, Math.PI * 2),
        vrot: F.rand(-1.6, 1.6),
        life: lifeMs,
        maxLife: lifeMs,
        arm: F.pick(ARMS)
      };
    }

    e.tick = function(dt, now){
      var age = now - this.born;
      // Spawn window.
      if(age <= DUR && now - lastSpawn >= SPAWN_MS){
        lastSpawn = now;
        this.motes.push(spawnMote());
        if(Math.random() < 0.4) this.motes.push(spawnMote());
      }
      // Update + cull motes.
      var alive = [];
      for(var i = 0; i < this.motes.length; i++){
        var m = this.motes[i];
        m.y   += m.vy * dt;
        m.rot += m.vrot * dt;
        m.life -= dt * 1000;
        if(m.life > 0) alive.push(m);
      }
      this.motes = alive;
      if(age > DUR && this.motes.length === 0) this.done = true;
    };

    e.drawExtra = function(ctx){
      // Each mote: pixel '+' shape, outline 1px wider, rotated.
      // Fade in over first 200ms of life, hold, fade out over last 500ms.
      var FADE_IN = 200;
      var FADE_OUT = 500;
      for(var i = 0; i < this.motes.length; i++){
        var m = this.motes[i];
        var ageMs = m.maxLife - m.life;
        var a = 1;
        if(ageMs < FADE_IN) a = ageMs / FADE_IN;
        else if(m.life < FADE_OUT) a = m.life / FADE_OUT;
        if(a <= 0) continue;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(Math.floor(m.x), Math.floor(m.y));
        ctx.rotate(m.rot);
        var arm = m.arm;
        // Outline (1px wider, darker).
        ctx.fillStyle = outline;
        ctx.fillRect(-1, -arm - 1, 3, arm * 2 + 2);
        ctx.fillRect(-arm - 1, -1, arm * 2 + 2, 3);
        // Core.
        ctx.fillStyle = color;
        ctx.fillRect(0, -arm, 1, arm * 2);
        ctx.fillRect(-arm, 0, arm * 2, 1);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // CATEGORY 5 — BUFF (Round 67q)
  // -------------------------------------------------------------------
  // Base flash + rising converging column. Generic "stat went up".
  // Spec: DUR 900ms, spawn 35ms (1-2 motes), base flash 180ms, motes
  // live 520-780ms. Column starts spread (-90..90 offsetX), converges
  // inward (vx = -offX * 0.4..0.9), rises fast (-260..-180).
  // ===================================================================
  function buff(opts){
    opts = opts || {};
    var target = opts.target;
    if(!target) return null;
    var accentKey = opts.accent || 'gold';
    var palette = ACCENT[accentKey] || { bright: opts.color || '#d4a843', dim: '#7a5b1a' };
    var color = opts.color || palette.bright;
    var dim   = palette.dim;

    var e = new F.Effect();
    var cx = target.x, cy = target.y;
    var DUR = 900;
    var SPAWN_MS = 35;
    var FLASH_MS = 180;
    var lastSpawn = 0;

    e.tick = function(dt, now){
      var age = now - this.born;
      if(age <= DUR && now - lastSpawn >= SPAWN_MS){
        lastSpawn = now;
        var n = 1 + Math.floor(Math.random() * 2);
        for(var i = 0; i < n; i++){
          var offX = F.rand(-90, 90);
          var vx = -offX * F.rand(0.4, 0.9);   // converge inward
          e.particles.push(new F.Particle({
            x: cx + offX, y: cy + F.rand(30, 70),
            vx: vx, vy: F.rand(-260, -180),
            size: Math.random() < 0.4 ? 3 : 2,
            color: Math.random() < 0.5 ? color : dim,
            life: F.rand(520, 780),
            fade: 'step3'
          }));
        }
      }
      if(age > DUR && e.particles.length === 0) this.done = true;
    };

    e.drawExtra = function(ctx){
      var age = performance.now() - this.born;
      // Base flash — bar under the target, fades out over FLASH_MS.
      if(age < FLASH_MS){
        var k = 1 - age / FLASH_MS;
        ctx.globalAlpha = k * 0.85;
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(cx - 80), Math.floor(cy + 30), 160, 8);
        ctx.globalAlpha = k;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(cx - 40), Math.floor(cy + 32), 80, 4);
      }
      ctx.globalAlpha = 1;
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // CATEGORY 6 — AOE (Round 67q)
  // -------------------------------------------------------------------
  // Single-shot explosion: core flash → expanding pixel-ring shockwave
  // + accent ring → radial spray + falling embers. Auto-finishes when
  // ring + particles done. Spec: flash 90ms, ring 280ms, embers grav
  // 380, 24 outer + 10 inner particles, ring thickness 4, accent ring
  // inset 6 / thickness 2.
  // ===================================================================
  function aoe(opts){
    opts = opts || {};
    var center = opts.center;
    if(!center) return null;
    // Accept palette key (str/agi/wis/void/gold) OR raw hex.
    var rawColor = opts.color || '#e88060';
    var color = (ACCENT[rawColor] ? ACCENT[rawColor].bright : rawColor);
    var radius = opts.radius || 130;

    var e = new F.Effect();
    var cx = center.x, cy = center.y;
    var FLASH_MS = 90;
    var RING = 280;

    // Initial particle spawn — outer spray + inner flecks.
    for(var i = 0; i < 24; i++){
      var ang = (Math.PI * 2 * i / 24) + F.rand(-0.1, 0.1);
      var spd = F.rand(220, 380);
      e.particles.push(new F.Particle({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        ay: 380,
        size: Math.random() < 0.4 ? 3 : 2,
        color: Math.random() < 0.4 ? '#ffffff' : color,
        life: F.rand(420, 720),
        fade: 'step3'
      }));
    }
    for(var j = 0; j < 10; j++){
      var ang2 = F.rand(0, Math.PI * 2);
      var spd2 = F.rand(60, 140);
      e.particles.push(new F.Particle({
        x: cx + F.rand(-6, 6), y: cy + F.rand(-6, 6),
        vx: Math.cos(ang2) * spd2,
        vy: Math.sin(ang2) * spd2,
        ay: 280,
        size: 2,
        color: '#ffe19a',
        life: F.rand(280, 480),
        fade: 'step3'
      }));
    }

    e.tick = function(dt, now){
      var age = now - this.born;
      if(age > RING && e.particles.length === 0) this.done = true;
    };

    e.drawExtra = function(ctx){
      var age = performance.now() - this.born;

      // Core flash — hot square in centre, fades over FLASH_MS.
      if(age < FLASH_MS){
        var k = 1 - age / FLASH_MS;
        ctx.globalAlpha = k;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(cx - 30), Math.floor(cy - 30), 60, 60);
        ctx.globalAlpha = k * 0.6;
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(cx - 50), Math.floor(cy - 50), 100, 100);
      }

      // Shockwave — expanding pixel-ring outline + inner accent ring.
      if(age < RING){
        var rk = F.ease.outCubic(age / RING);
        var R = Math.round(F.lerp(10, radius, rk));
        var T = 4;
        ctx.globalAlpha = (1 - rk) * 0.95;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(cx - R), Math.floor(cy - R), R * 2, T);
        ctx.fillRect(Math.floor(cx - R), Math.floor(cy + R - T), R * 2, T);
        ctx.fillRect(Math.floor(cx - R), Math.floor(cy - R), T, R * 2);
        ctx.fillRect(Math.floor(cx + R - T), Math.floor(cy - R), T, R * 2);
        var R2 = R - 6;
        if(R2 > 4){
          ctx.globalAlpha = (1 - rk) * 0.7;
          ctx.fillStyle = color;
          ctx.fillRect(Math.floor(cx - R2), Math.floor(cy - R2), R2 * 2, 2);
          ctx.fillRect(Math.floor(cx - R2), Math.floor(cy + R2 - 2), R2 * 2, 2);
          ctx.fillRect(Math.floor(cx - R2), Math.floor(cy - R2), 2, R2 * 2);
          ctx.fillRect(Math.floor(cx + R2 - 2), Math.floor(cy - R2), 2, R2 * 2);
        }
      }
      ctx.globalAlpha = 1;
    };

    F.add(e);
    return e;
  }

  // ===================================================================
  // CARD-ZONE PULSE (Round 67q)
  // -------------------------------------------------------------------
  // Generic primitive for "something happened to a card in the hand /
  // deck / discard" — every action shares the same call shape:
  //   Effects.cardZonePulse({x,y}, action)
  // Caller is responsible for resolving the position via the
  // _fx*Pos helpers in game.js. action picks the recipe:
  //   draw          inward gather + central gold cross   ~500ms
  //   conjure       inward gather + central void cross   ~500ms
  //   purge         outward dissipate, void → fade        ~400ms
  //   modify        pulsing gold card-outline + sparkles ~350ms
  //   discard-doom  red border pulse + outward reds      ~400ms
  //   churn-out     outward parchment particles          ~320ms
  //   churn-in      alias for draw (readable hook name)  ~500ms
  // ===================================================================
  function cardZonePulse(pos, action, opts){
    opts = opts || {};
    if(!pos || !action) return null;
    var e = new F.Effect();
    var cx = pos.x, cy = pos.y;

    // ── draw / conjure / churn-in : inward gather + central cross ──
    if(action === 'draw' || action === 'conjure' || action === 'churn-in'){
      var isVoid = (action === 'conjure');
      var brightCol = isVoid ? '#b27adf' : '#d4a843';
      var dimCol    = isVoid ? '#5a2f80' : '#7a5b1a';
      var DUR = 500;

      for(var i = 0; i < 14; i++){
        var ang = (Math.PI * 2 * i / 14) + F.rand(-0.15, 0.15);
        var r = F.rand(34, 56);
        // Spawn at outer ring, move INWARD then drift slightly past.
        e.particles.push(new F.Particle({
          x: cx + Math.cos(ang) * r,
          y: cy + Math.sin(ang) * r,
          vx: -Math.cos(ang) * F.rand(80, 130),
          vy: -Math.sin(ang) * F.rand(80, 130),
          size: i % 3 === 0 ? 3 : 2,
          color: i % 3 === 0 ? '#ffffff' : (Math.random() < 0.5 ? brightCol : dimCol),
          life: F.rand(280, 420),
          fade: 'step3'
        }));
      }

      e.tick = function(dt, now){
        if(now - this.born > DUR && this.particles.length === 0) this.done = true;
      };
      e.drawExtra = function(ctx){
        var age = performance.now() - this.born;
        // Central cross sparkle, fades over ~320ms.
        if(age < 320){
          var k = 1 - age / 320;
          ctx.globalAlpha = k;
          var armLen = 12;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.floor(cx - armLen), Math.floor(cy - 2), armLen * 2, 4);
          ctx.fillRect(Math.floor(cx - 2), Math.floor(cy - armLen), 4, armLen * 2);
          ctx.fillStyle = brightCol;
          ctx.fillRect(Math.floor(cx - 3), Math.floor(cy - 3), 6, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.floor(cx - 2), Math.floor(cy - 2), 4, 4);
          ctx.globalAlpha = 1;
        }
      };
      F.add(e);
      return e;
    }

    // ── purge : outward dissipate ──
    if(action === 'purge'){
      var purgeCol = opts.color || '#b27adf';
      for(var i = 0; i < 14; i++){
        var ang2 = (Math.PI * 2 * i / 14) + F.rand(-0.2, 0.2);
        var spd = F.rand(140, 240);
        e.particles.push(new F.Particle({
          x: cx, y: cy,
          vx: Math.cos(ang2) * spd,
          vy: Math.sin(ang2) * spd,
          size: i % 2 === 0 ? 3 : 2,
          color: i % 2 === 0 ? '#ffffff' : purgeCol,
          life: F.rand(280, 400),
          fade: 'step3'
        }));
      }
      e.tick = function(dt, now){
        if(this.particles.length === 0) this.done = true;
      };
      F.add(e);
      return e;
    }

    // ── modify : gold/white sparkles around card centre ──
    // Round 67r: previously also drew a 64×88 axis-aligned gold
    // outline rectangle on the FX canvas. Because hand cards are
    // CSS-rotated DOM elements and the FX canvas is a flat overlay,
    // the rectangle sat at the card's screen position but didn't
    // rotate with it — read as a floating "unknown emoji" box. Drop
    // the rectangle, keep only the sparkles. Sparkles spawn at random
    // angles around the card centre so they don't imply any
    // orientation and look natural over rotated cards.
    if(action === 'modify'){
      for(var i = 0; i < 8; i++){
        var ang3 = (Math.PI * 2 * i / 8);
        var r3 = F.rand(18, 32);
        e.particles.push(new F.Particle({
          x: cx + Math.cos(ang3) * r3,
          y: cy + Math.sin(ang3) * r3,
          vx: Math.cos(ang3) * 40,
          vy: Math.sin(ang3) * 40,
          size: 2,
          color: i % 2 === 0 ? '#ffffff' : '#d4a843',
          life: F.rand(240, 360),
          fade: 'step3'
        }));
      }
      e.tick = function(dt, now){
        if(now - this.born > 400 && this.particles.length === 0) this.done = true;
      };
      F.add(e);
      return e;
    }

    // ── discard-doom : red flash before existing fly-to-discard ──
    if(action === 'discard-doom'){
      for(var i = 0; i < 8; i++){
        var ang4 = (Math.PI * 2 * i / 8) + F.rand(-0.2, 0.2);
        var spd4 = F.rand(120, 200);
        e.particles.push(new F.Particle({
          x: cx, y: cy,
          vx: Math.cos(ang4) * spd4,
          vy: Math.sin(ang4) * spd4,
          size: 2,
          color: i % 2 === 0 ? '#ff7060' : '#c14040',
          life: F.rand(220, 360),
          fade: 'step3'
        }));
      }
      e.tick = function(dt, now){
        if(now - this.born > 400 && this.particles.length === 0) this.done = true;
      };
      e.drawExtra = function(ctx){
        var age = performance.now() - this.born;
        if(age < 220){
          var k = 1 - age / 220;
          ctx.globalAlpha = k;
          ctx.fillStyle = '#c14040';
          var w = 64, h = 88;
          ctx.fillRect(Math.floor(cx - w/2 - 2), Math.floor(cy - h/2 - 2), w + 4, 3);
          ctx.fillRect(Math.floor(cx - w/2 - 2), Math.floor(cy + h/2 - 1), w + 4, 3);
          ctx.fillRect(Math.floor(cx - w/2 - 2), Math.floor(cy - h/2 - 2), 3, h + 4);
          ctx.fillRect(Math.floor(cx + w/2 - 1), Math.floor(cy - h/2 - 2), 3, h + 4);
          ctx.globalAlpha = 1;
        }
      };
      F.add(e);
      return e;
    }

    // ── churn-out : outward parchment particles ──
    if(action === 'churn-out'){
      for(var i = 0; i < 10; i++){
        var ang5 = (Math.PI * 2 * i / 10) + F.rand(-0.18, 0.18);
        var spd5 = F.rand(80, 140);
        e.particles.push(new F.Particle({
          x: cx + F.rand(-6, 6), y: cy + F.rand(-6, 6),
          vx: Math.cos(ang5) * spd5,
          vy: Math.sin(ang5) * spd5,
          size: 2,
          color: i % 2 === 0 ? '#c0a060' : '#7a6030',
          life: F.rand(220, 320),
          fade: 'step3'
        }));
      }
      e.tick = function(dt, now){
        if(this.particles.length === 0) this.done = true;
      };
      F.add(e);
      return e;
    }

    return null;
  }

  // ===================================================================
  // ROUTER — effect-driven default with per-card overrides
  // -------------------------------------------------------------------
  // Round 67q: instead of mapping cardId → effect by hand, we read
  // the card's `effects` array and pick a sensible default per effect
  // type. Cards that need a bespoke vibe set `fx:` to a key in
  // CARD_FX_OVERRIDES (e.g. 'projectile_void' for Void Bolt). Unknown
  // cards / cards with no recognisable effects no-op silently so the
  // existing emoji-fly is the sole VFX.
  //
  // ctx fields used:
  //   source, target   — design-space coords
  //   casterIsPlayer   — true when player cast, false when enemy
  //   hits             — multi-hit count (default 1, read from card.effects)
  //   crit             — optional; usually fired separately via critFlash
  // ===================================================================

  // Per-card bespoke FX. Round 67r — restructured from bare functions
  // into a delivery/impact composition model.
  //
  // SHAPE:
  //   { delivery: function(card, ctx),    // delivery animation (e.g. projectile)
  //     impactDelay: ms,                  // when to fire the effect-driven default impact
  //     suppressDefault: bool }           // if true, don't fire any default impact at all
  //
  // BEHAVIOUR:
  //   - delivery runs immediately. Optional — omit for "no delivery animation".
  //   - After impactDelay (default 0) the router fires the EFFECT-DRIVEN
  //     default impact based on card.effects (slash for dmg_*, etc).
  //   - If suppressDefault is true, the override has provided its own
  //     impact (aoe, buff, …) and the default is skipped.
  //
  // WHY: previously each override was a bare function that took complete
  // control. A ranged-attack card like Void Bolt had to choose between
  // "projectile flies in (no slash on impact)" or "slash plays at the
  // caster with no projectile." Splitting delivery from impact lets the
  // common case — ranged attack = projectile then slash on landing —
  // work without bespoke chaining per card. AOE / buff overrides that
  // already provide their own impact set suppressDefault to opt out.
  //
  // LEGACY: bare functions still work — treated as { delivery: fn,
  // suppressDefault: true } so older overrides keep their current
  // "all or nothing" behaviour.
  var CARD_FX_OVERRIDES = {
    // ── Pure projectile deliveries — default impact (slash) plays
    // on landing. Damage cards keep their slash thunk; non-damage
    // cards using these keys just see the projectile (no effect of
    // type dmg_* → defaultForEffect returns false → nothing extra).
    'projectile_void': {
      delivery: function(card, ctx){
        projectile({ source:ctx.source, target:ctx.target, variant:'pixel-comet', accent:'void' });
      },
      impactDelay: 450
    },
    'projectile_fire': {
      delivery: function(card, ctx){
        projectile({ source:ctx.source, target:ctx.target, variant:'spark-rain', accent:'str' });
      },
      impactDelay: 450
    },
    'projectile_wis': {
      delivery: function(card, ctx){
        projectile({ source:ctx.source, target:ctx.target, variant:'wisp', accent:'wis' });
      },
      impactDelay: 450
    },
    'projectile_agi': {
      delivery: function(card, ctx){
        projectile({ source:ctx.source, target:ctx.target, variant:'pixel-comet', accent:'agi' });
      },
      impactDelay: 450
    },
    // Fire-themed projectile delivery for apply_status cards (Consecrate).
    // No default impact: apply_status doesn't fire one anyway; the
    // status FX is handled by the applyStatus hook in game.js.
    'cast_status_fire': {
      delivery: function(card, ctx){
        projectile({ source:ctx.source, target:ctx.target, variant:'spark-rain', accent:'str' });
      },
      suppressDefault: true
    },
    // ── AOE overrides — projectile + themed explosion. The aoe IS
    // the impact, so suppressDefault is true to skip the slash.
    'aoe_fire': {
      delivery: function(card, ctx){
        projectile({ source:ctx.source, target:ctx.target, variant:'spark-rain', accent:'str' });
        setTimeout(function(){ aoe({ center: ctx.target, color:'#e88060', radius:130 }); }, 450);
      },
      suppressDefault: true
    },
    'aoe_void': {
      delivery: function(card, ctx){
        projectile({ source:ctx.source, target:ctx.target, variant:'pixel-comet', accent:'void' });
        setTimeout(function(){ aoe({ center: ctx.target, color:'#b27adf', radius:130 }); }, 450);
      },
      suppressDefault: true
    },
    // Detonate at the caster's position — no delivery, no slash.
    'aoe_self_void': {
      delivery: function(card, ctx){ aoe({ center: ctx.source, color:'#b27adf', radius:140 }); },
      suppressDefault: true
    },
    'aoe_self_fire': {
      delivery: function(card, ctx){ aoe({ center: ctx.source, color:'#e88060', radius:140 }); },
      suppressDefault: true
    },
    // Buff overrides — rising column on the caster. No impact at all.
    'buff_str': { delivery: function(card, ctx){ buff({ target: ctx.source, accent:'str' });  }, suppressDefault: true },
    'buff_agi': { delivery: function(card, ctx){ buff({ target: ctx.source, accent:'agi' });  }, suppressDefault: true },
    'buff_wis': { delivery: function(card, ctx){ buff({ target: ctx.source, accent:'wis' });  }, suppressDefault: true },
    'buff_gold':{ delivery: function(card, ctx){ buff({ target: ctx.source, accent:'gold' }); }, suppressDefault: true }
  };

  // Effect-type → default animation. Each handler reads from the
  // resolved card.effects entry + ctx, fires the right primitive.
  function defaultForEffect(card, eff, ctx){
    if(!eff || !eff.type) return false;
    var t = eff.type;

    // Damage — slash. Multi-hit pulled from eff.hits.
    if(t === 'dmg_conditional' || t === 'dmg_scaling' || t === 'dmg_multi_crit_if_debuffed'){
      slash({
        target: ctx.target,
        angle: ctx.casterIsPlayer ? -Math.PI/4 : (Math.PI - Math.PI/4),
        hits: Math.max(1, +eff.hits || 1),
        crit: !!ctx.crit
      });
      return true;
    }

    // Note: apply_status is intentionally NOT handled here. It's
    // covered by the applyStatus / applyDoT hooks in game.js, which
    // fire the lingering FX wherever a status actually attaches —
    // regardless of whether it came from a card, innate, or relic.
    // Letting the router fire it too would double-up the visuals.

    return false;
  }

  function playCardFX(cardId, ctxOrSrc, maybeTarget, maybeCasterIsPlayer){
    // Backwards-compat: accept the old (cardId, srcPos, targetPos, isPlayer)
    // signature alongside the new (cardId, ctx) signature.
    var ctx;
    if(ctxOrSrc && typeof ctxOrSrc === 'object' && 'source' in ctxOrSrc){
      ctx = ctxOrSrc;
    } else {
      ctx = {
        source: ctxOrSrc,
        target: maybeTarget,
        casterIsPlayer: !!maybeCasterIsPlayer
      };
    }
    if(!cardId || !ctx.source || !ctx.target) return;
    var card = (typeof CARDS !== 'undefined') ? CARDS[cardId] : null;
    if(!card) return;

    // ── PER-CARD OVERRIDE ──
    // Round 67r: overrides can now be objects {delivery, impactDelay,
    // suppressDefault} so delivery + impact compose generically. Bare
    // functions are still accepted as legacy "take complete control"
    // overrides (treated as suppressDefault:true).
    var impactDelay = 0;
    var suppressDefault = false;
    if(card.fx && CARD_FX_OVERRIDES[card.fx]){
      var ov = CARD_FX_OVERRIDES[card.fx];
      if(typeof ov === 'function'){
        // Legacy bare-function override — fire it and skip default.
        try { ov(card, ctx); } catch(e){}
        suppressDefault = true;
      } else {
        if(typeof ov.delivery === 'function'){
          try { ov.delivery(card, ctx); } catch(e){}
        }
        impactDelay = +ov.impactDelay || 0;
        suppressDefault = !!ov.suppressDefault;
      }
    }

    // Note: Brace's shield FX is no longer triggered here. It fires
    // from applyStatus in game.js when the shield status actually
    // attaches, which covers EVERY shield source — Brace, innates,
    // relics, future cards — not just this one card.

    if(suppressDefault) return;

    // ── EFFECT-DRIVEN DEFAULT IMPACT ──
    // Pick the FIRST effect that has a default animation. If a card
    // has multiple effects (damage + apply_status), the headline
    // wins — usually damage. Status applies still fire on the
    // damage-resolver side via Effects.statusApply directly.
    // Round 67r: if an override declared impactDelay (delivery time),
    // schedule the impact to land at that offset so projectile → slash
    // reads as one motion → hit.
    var fireDefaultImpact = function(){
      var effects = card.effects || [];
      for(var i = 0; i < effects.length; i++){
        if(defaultForEffect(card, effects[i], ctx)) return;
      }
    };
    if(impactDelay > 0) setTimeout(fireDefaultImpact, impactDelay);
    else fireDefaultImpact();
  }

  // ---------- export ----------
  window.Effects = {
    projectile: projectile,
    shield: shield,
    shieldBreak: shieldBreak,
    slash: slash,
    statusApply: statusApply,
    statusBolt: statusBolt,
    critFlash: critFlash,
    heal: heal,
    buff: buff,
    aoe: aoe,
    cardZonePulse: cardZonePulse,
    playCardFX: playCardFX,
    ACCENT: ACCENT,
    STATUS_FX: STATUS_FX,
    CARD_FX_OVERRIDES: CARD_FX_OVERRIDES
  };
})();
