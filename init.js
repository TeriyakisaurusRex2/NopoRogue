// ════════════════════════════════════════════════════
// INIT  —  runs after all data files are loaded
// Load order: game.js → deck_builder.js → town.js → cards.js →
//   card_effects.js → combat.js → achievements.js → areas.js →
//   relics.js → expedition.js → vault.js → creatures/*.js →
//   audio.js → init.js
// ════════════════════════════════════════════════════
//
// Round 63: boot flow rewritten to introduce a loading screen +
// login screen. The previous flow dumped the player straight into
// the champion-select grid; now they see:
//   1. Loading screen with progress bar (preloads music + key art)
//   2. Login screen (save card + saves dropdown + settings)
//   3. → CONTINUE / BEGIN → champion select
//
// Settings always loads first (those are global, not per-save).
// The legacy single-save migration runs before any save reads so
// existing players see their progress as "Save 1" without manual
// intervention.

// Round 67o: pixel-art 9-slice panel border, composed at runtime from
// two base sprites (one corner, one edge — designed for the TOP-LEFT
// of the panel). The composer draws all 4 corners (mirroring the
// source) and all 4 edges (mirroring + rotating the source) into a
// single 48×48 canvas, then exposes the data URL as the --pixel-panel
// CSS custom property. Any element with `class="pixel-panel"` (or any
// CSS rule that consumes `var(--pixel-panel)` in border-image) picks
// it up automatically.
//
// Asset contract:
//   - cornerSrc: top-left corner sprite. Art occupies the TL quadrant.
//   - edgeSrc:   left-side edge sprite. Art occupies the LEFT column.
//   - fillSrc:   (optional) tile for the panel interior. Repeats.
//   - cellSize:  source sprite dimensions in px. Default 16.
//
// Edit cornerSrc / edgeSrc and the entire palette of borders re-derives.
function _pixelPanelCompose(opts){
  return new Promise(function(resolve){
    var size  = opts.cellSize || 16;
    var sheet = size * 3;
    var canvas = document.createElement('canvas');
    canvas.width = sheet; canvas.height = sheet;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // pixel art — never blur.

    var sources = { corner: opts.cornerSrc, edge: opts.edgeSrc };
    if(opts.fillSrc) sources.fill = opts.fillSrc;
    var keys = Object.keys(sources);
    var loaded = {};
    var remaining = keys.length;

    keys.forEach(function(key){
      var img = new Image();
      img.onload = function(){
        loaded[key] = img;
        if(--remaining === 0) draw();
      };
      img.onerror = function(){
        console.warn('[pixel-panel] failed to load', sources[key]);
        if(--remaining === 0) draw();
      };
      img.src = sources[key];
    });

    function drawAt(img, cx, cy, sx, sy){
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sx, sy);
      ctx.drawImage(img, -size/2, -size/2);
      ctx.restore();
    }
    function drawRotated(img, cx, cy, angle){
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.drawImage(img, -size/2, -size/2);
      ctx.restore();
    }
    function draw(){
      var corner = loaded.corner;
      var edge   = loaded.edge;
      var fill   = loaded.fill;
      if(!corner || !edge){ resolve(null); return; }
      var half  = size/2;
      var inset = (typeof opts.borderInset === 'number') ? opts.borderInset : 0;

      // STEP 1 — paint the fill texture into the INNER area of every
      // cell (not just the center). Each cell gets the fill from its
      // edges inward, but the OUTER-facing sides are inset by
      // `borderInset` pixels so the cell's outermost edge stays
      // transparent. That outermost band is the "halo" where the
      // letterbox/element bg shows through and where corner pop-out
      // decorations can sit cleanly on transparent space.
      //
      // Without this step, the corner cell's inner transparent gap
      // (the bit inside the curve, toward the panel content) would
      // render as element bg-color while the panel's main interior
      // (the center cell) renders as the fill texture — visible seam
      // at every corner. Filling the inner area of every cell makes
      // the texture continuous all the way to the inner edge of the
      // visible frame.
      if(fill){
        var pat = ctx.createPattern(fill, 'repeat');
        ctx.fillStyle = pat;
        function fillInner(cx, cy, outT, outR, outB, outL){
          var fx = cx + (outL ? inset : 0);
          var fy = cy + (outT ? inset : 0);
          var fw = size - (outL?inset:0) - (outR?inset:0);
          var fh = size - (outT?inset:0) - (outB?inset:0);
          if(fw > 0 && fh > 0) ctx.fillRect(fx, fy, fw, fh);
        }
        // 9 cells, outer-facing flags (top, right, bottom, left).
        fillInner(0,         0,        1,0,0,1); // TL  — top + left outer
        fillInner(size,      0,        1,0,0,0); // TOP — top outer
        fillInner(size*2,    0,        1,1,0,0); // TR  — top + right
        fillInner(0,         size,     0,0,0,1); // LEFT
        fillInner(size,      size,     0,0,0,0); // CENTER — no outer sides
        fillInner(size*2,    size,     0,1,0,0); // RIGHT
        fillInner(0,         size*2,   0,0,1,1); // BL
        fillInner(size,      size*2,   0,0,1,0); // BOTTOM
        fillInner(size*2,    size*2,   0,1,1,0); // BR
      }

      // STEP 2 — corners on top of the fill. TL native, TR flipH,
      // BL flipV, BR rotated 180.
      drawAt(corner,        half,        half,     1,  1);
      drawAt(corner, sheet - half,       half,    -1,  1);
      drawAt(corner,        half, sheet - half,    1, -1);
      drawAt(corner, sheet - half, sheet - half,  -1, -1);
      // STEP 3 — edges. LEFT native, RIGHT flipH, TOP rotate 90° CW
      // (left column → top row), BOTTOM rotate 90° CCW.
      drawAt(edge,          half,        size + half,   1, 1);
      drawAt(edge,    sheet - half,      size + half,  -1, 1);
      drawRotated(edge, size + half,       half,         Math.PI/2);
      drawRotated(edge, size + half, sheet - half,      -Math.PI/2);

      // STEP 4 — optional colour tint. Multiplies each opaque pixel's
      // RGB by the tint colour (normalised to 0..1). Multiply maps
      // black → black (outlines preserved), white → tint colour, and
      // greys to intermediate shades — so a greyscale sprite recolours
      // cleanly with one parameter. Transparent pixels untouched.
      if(opts.tint){
        var r = parseInt(opts.tint.slice(1,3), 16);
        var g = parseInt(opts.tint.slice(3,5), 16);
        var b = parseInt(opts.tint.slice(5,7), 16);
        var imgData = ctx.getImageData(0, 0, sheet, sheet);
        var px = imgData.data;
        for(var i = 0; i < px.length; i += 4){
          if(px[i+3] === 0) continue;
          px[i]   = (px[i]   * r / 255) | 0;
          px[i+1] = (px[i+1] * g / 255) | 0;
          px[i+2] = (px[i+2] * b / 255) | 0;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    }
  });
}

// Compose and expose. Fires immediately on init — the data URL lands
// on the document root as soon as the sprites load. Any rule using
// `var(--pixel-panel)` picks it up live (no FOUC handling needed since
// the property simply isn't set until then; rules render with no
// border until the URL arrives, ~1-2 frames later).
// Round 67o: pixel-panel sprites embedded as base64 data URIs instead
// of loaded from disk. Why: when index.html is opened directly
// (file:// protocol), every PNG counts as a separate origin and
// drawing them onto a canvas taints it — toDataURL() then throws
// SecurityError. Data URIs are same-origin with everything, so the
// canvas stays untainted and we can export the composed image.
//
// REGENERATING THESE STRINGS after editing the sprites:
//   bash -c "base64 -w 0 assets/icons/left_top_box.png"
//   bash -c "base64 -w 0 assets/icons/left_side_box.png"
// Paste the output between the quotes below. (Or run a local web
// server — `python -m http.server` — and revert to using paths, in
// which case the composer reads the live PNGs every reload.)
var PIXEL_PANEL_CORNER_B64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAFo9M/3AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAEtSURBVHjaBMEBAQAAAIIgO+L/lwZTA0Ct4gAAAP//gjOYbGxsGBgYGBgAAAAA//8EwQEBADAMwrDeyIQhDAnY7JN3d7ZlGwCoJFFF5QMAAP//XMyxEQAwDINAlP3HYSFPolRxEeo/8i4zE4CoXQ6gLm/L4esCAAD//4LbgguwwBjLli1jOHLkCNwyGGBCFkCXZGBgwLQTHQAAAAD//4L7A5cpLDY2NgxRUVFwAXl5eRRHozgSG5sF2ThsvmCQk5P7v2XLlv+weEDHBH1BuQIAAAAA//+kktEJADEIQ9Pj5tC9HMHBnMS9vK8ettRSaD5FHpqkEVH0+Fdy9y3g/zJ7lSUiUFVUgb/zYChTso6Z4whQeb4qCgC0iMBMr5a3F/QfzQzMHKeQB5e6BnwDADpPjc3AQXDUAAAAAElFTkSuQmCC';
var PIXEL_PANEL_EDGE_B64   = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAFo9M/3AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAACZSURBVHjaYvz//z8DAwMDAxMDFAAAAAD//2KIior6////f4QIAAAA//9i+P//P1wUVQYKAAAAAP//YtiyZQtcFqsKwgIAAAAA//9i+P//P8OWLVv+I9uE10zCRpKqAAAAAP//YpCTk/u/ZcuW/3JycgPlhsGgAAAAAP//Yvj//z88LGBxgitMyAonyp04agDtDQAAAAD//wMADhN29ZzvuYQAAAAASUVORK5CYII=';

// Compose a pixel-panel variant under a named CSS variable. Tint is
// applied via multiply (see _pixelPanelCompose STEP 4) so a single
// grey source recolors into any palette cleanly. Add more entries to
// the array below to expose more variants — usable in CSS as
// `border-image-source: var(--pixel-panel-<name>)`.
function _composePixelPanelVariant(name, tint){
  _pixelPanelCompose({
    cornerSrc:   'data:image/png;base64,' + PIXEL_PANEL_CORNER_B64,
    edgeSrc:     'data:image/png;base64,' + PIXEL_PANEL_EDGE_B64,
    cellSize:    16,
    borderInset: 2,
    tint:        tint,
  }).then(function(url){
    if(url){
      document.documentElement.style.setProperty('--' + name, 'url("' + url + '")');
      console.log('[pixel-panel] ' + name + ' applied (' + url.length + ' bytes)');
    } else {
      console.warn('[pixel-panel] ' + name + ' returned null — sprite failed to load');
    }
  });
}

// Default: no tint (sprite's native grey).
_composePixelPanelVariant('pixel-panel',       null);
// Gold — matches the existing project gold accent palette.
_composePixelPanelVariant('pixel-panel-gold',  '#d4a843');
// Iron / dark — for understated panels.
_composePixelPanelVariant('pixel-panel-iron',  '#5a4830');
// Warm — slightly tan/parchment.
_composePixelPanelVariant('pixel-panel-warm',  '#a88858');
// Stat-color variants — match the in-game STR / AGI / WIS palette.
_composePixelPanelVariant('pixel-panel-str',   '#e88060'); // STR — red/orange
_composePixelPanelVariant('pixel-panel-agi',   '#9adc7e'); // AGI — green
_composePixelPanelVariant('pixel-panel-wis',   '#9ad8e8'); // WIS — blue

// Round 67o: redirect any future document.body.appendChild calls into
// #game-root so dynamically-created overlays (tutorial dialogs, quest
// modals, abandon confirmations, etc) ride the scale transform along
// with everything else. ~20 call sites across town.js / tutorial.js /
// arena.js / etc would otherwise land outside the scaled wrapper and
// render at 1:1 over the letterboxed background. Single override here
// is less invasive than rewriting every site.
(function(){
  var gameRoot = document.getElementById('game-root');
  if(!gameRoot) return;
  var origAppend = document.body.appendChild.bind(document.body);
  document.body.appendChild = function(child){
    // Skip <script> nodes — keep those at the body/document level where
    // browsers expect them. Everything else (overlays / modals / tips)
    // goes into the scaled canvas.
    if(child && child.nodeName === 'SCRIPT') return origAppend(child);
    return gameRoot.appendChild(child);
  };
})();

// Round 67o: PokeRogue-style uniform scaling. The whole game lives
// inside #game-root, a 1920×1080 fixed design surface. We scale the
// wrapper to fit the viewport (preserving aspect ratio, letterboxing
// any leftover space). Pixel-perfect mode snaps to integer scale steps
// when the viewport is big enough that fractional scaling would risk
// uneven pixel sizes on the sprite art. Below that, fractional is
// unavoidable but image-rendering:pixelated keeps sprites crisp.
var GAME_DESIGN_W = 1920;
var GAME_DESIGN_H = 1080;
function fitGameToWindow(){
  var root = document.getElementById('game-root');
  if(!root) return;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  // Fractional scale — fits the design surface to whatever viewport
  // we have, never letterboxing more than the aspect-ratio mismatch
  // demands. "Pixel-perfect" feel comes from image-rendering:pixelated
  // on every <img> inside #game-root (set in style.css), which uses
  // nearest-neighbor sampling so sprite art stays crisp even at
  // non-integer scales. Same model PokeRogue uses (Phaser canvas with
  // pixel-art:true). Strict integer-ratio snapping would have wasted
  // huge amounts of screen real estate at common viewports — e.g. a
  // 1920×1000 browser window (Full HD with chrome) would have to drop
  // to 0.5x, rendering the game at 960×540 with massive letterbox.
  var scale = Math.min(vw / GAME_DESIGN_W, vh / GAME_DESIGN_H);
  var tx = Math.floor((vw - GAME_DESIGN_W * scale) / 2);
  var ty = Math.floor((vh - GAME_DESIGN_H * scale) / 2);
  root.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
}
window.addEventListener('resize', fitGameToWindow);
fitGameToWindow();

// Round 67o: helper to convert real-viewport client coords (mouse
// events) into #game-root's design coordinate space. Anything that
// positions an element inside the scaled wrapper using e.clientX/Y
// needs this — otherwise the element lands at (clientX * scale + tx)
// in screen space instead of at the cursor. Used by moveTip in game.js
// and the keyword tooltip in data/cards.js.
function clientToGameCoords(clientX, clientY){
  var root = document.getElementById('game-root');
  if(!root) return { x:clientX, y:clientY };
  var rect = root.getBoundingClientRect();
  if(!rect.width || !rect.height) return { x:clientX, y:clientY };
  var sx = rect.width / GAME_DESIGN_W;
  var sy = rect.height / GAME_DESIGN_H;
  return {
    x: (clientX - rect.left) / sx,
    y: (clientY - rect.top)  / sy
  };
}

loadSettings();

// One-time migration: legacy cetd_v6 → first slot in the new
// multi-save registry. Idempotent — no-op once the registry exists.
if(typeof migrateLegacySaveIfNeeded === 'function') migrateLegacySaveIfNeeded();

// Hide the nav while loading + login screens are active. The
// nav-bar reappears when the player enters the game proper via
// enterGameFromLogin().
showNav(false);

// Kick off preload. The loading screen is already .active in the
// HTML, so it paints immediately and the progress bar fills as
// assets land.
var _loadingBar    = document.getElementById('loading-bar');
var _loadingStatus = document.getElementById('loading-status');

preloadAssets(_loadingBar, _loadingStatus, function(){
  // Final status flash before we transition.
  if(_loadingStatus) _loadingStatus.textContent = 'Ready.';

  // If there's an active save, load its data + run offline catch-up
  // (with diff capture for the login card's "while you were away"
  // block). If there's no active save we leave PERSIST at defaults
  // and the login screen shows the new-save form instead.
  if(getActiveSaveId()){
    loadPersist();
    if(typeof applyOfflineProgressWithDiff === 'function') applyOfflineProgressWithDiff();
    if(typeof checkBestiaryAutoUnlock === 'function') checkBestiaryAutoUnlock();
  }

  // Hand off to login screen.
  showLoginScreen();
});

// Note: buildSelectScreen / showNav(true) / updateNavBar('adventure')
// / restoreQuestBadge / preloadGemIcons now run inside
// enterGameFromLogin() (game.js) when the player clicks CONTINUE.
preloadGemIcons();
