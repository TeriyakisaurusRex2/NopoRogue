// ════════════════════════════════════════════════════════════════
// ENCHANTED GLADE BACKGROUND  (Round 67p)
// ════════════════════════════════════════════════════════════════
// Interactive pixel-art WebGL shader background for the main-menu
// (login) screen. Sourced from a Claude Design handoff (see chat
// log: "Fantasy Game Menu Wallpapers" / Enchanted Glade.html).
//
// Pipeline:
//   pass 1 — fragment shader paints a deep twilight forest glade
//            with mist, moon, layered tree silhouettes and a swarm
//            of fireflies into a low-res offscreen framebuffer.
//   pass 2 — a blit shader samples that texture nearest-neighbor
//            and applies a Bayer-4 ordered dither + posterize to
//            PALETTE_BANDS levels per channel for the pixel-art look.
//
// Integration notes (where this differs from the standalone HTML):
//   • Canvas drawing buffer is locked to the game design size
//     (1920×1080) instead of viewport+DPR. The whole game is wrapped
//     in #game-root which scales uniformly, so the canvas already
//     scales with it — we don't want DPR multiplication too, or the
//     pixel art would densify away from the chunky look.
//   • Mouse input goes through `clientToGameCoords()` (defined in
//     init.js) so e.clientX/Y in viewport space is translated to
//     #game-root design space before being fed to the shader.
//   • The render loop pauses while the login screen isn't .active,
//     so the GPU isn't churning during gameplay.
//
// Tuning constants live in CONFIG below. Defaults match what the
// designer baked into the handoff: chunk 200 / 16 bands / dither
// on / saturation 0.75.
(function(){
  var CONFIG = {
    PIXEL_HEIGHT:  200,   // logical rows in the offscreen FBO — smaller = chunkier
    PALETTE_BANDS: 16,    // bands per channel (≥2). Fewer = more posterized
    DITHER:        true,  // Bayer 4×4 ordered dither
    SATURATION:    0.75,  // 1.0 = source; <1 desaturated; >1 punchier
  };

  // Match the game's design surface. The canvas's CSS size is 100%
  // of its parent (login-screen, which fills #game-root = 1920×1080
  // at design scale). Drawing-buffer size matches so 1:1 logical
  // mapping holds.
  var DESIGN_W = 1920;
  var DESIGN_H = 1080;

  var VERT = [
    'attribute vec2 a_pos;',
    'void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var COMMON = [
    'precision highp float;',
    'uniform vec2  u_res;',
    'uniform vec2  u_smooth;',
    'uniform float u_time;',
    'float hash(vec2 p){',
    '  p = fract(p*vec2(123.34, 456.21));',
    '  p += dot(p, p+45.32);',
    '  return fract(p.x*p.y);',
    '}',
    'float noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  float a = hash(i);',
    '  float b = hash(i + vec2(1.0, 0.0));',
    '  float c = hash(i + vec2(0.0, 1.0));',
    '  float d = hash(i + vec2(1.0, 1.0));',
    '  vec2 u = f*f*(3.0 - 2.0*f);',
    '  return mix(a, b, u.x)',
    '       + (c - a) * u.y * (1.0 - u.x)',
    '       + (d - b) * u.x * u.y;',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0, a = 0.5;',
    '  for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }',
    '  return v;',
    '}',
    'vec2 toUV(){ return (gl_FragCoord.xy - 0.5*u_res) / u_res.y; }',
    'vec2 toUV(vec2 px){ return (px - 0.5*u_res) / u_res.y; }'
  ].join('\n');

  // Enchanted Glade scene shader — verbatim from the design handoff.
  var FRAG_GLADE = COMMON + '\n' + [
    'void main(){',
    '  vec2 uv = toUV();',
    '  vec2 m  = toUV(u_smooth);',
    '  vec3 sky_top  = vec3(0.025, 0.055, 0.140);',
    '  vec3 sky_mid  = vec3(0.020, 0.130, 0.155);',
    '  vec3 sky_low  = vec3(0.010, 0.090, 0.085);',
    '  float skyMix  = smoothstep(-0.6, 0.6, uv.y);',
    '  vec3 col = mix(sky_low, sky_mid, skyMix);',
    '  col = mix(col, sky_top, smoothstep(0.15, 0.85, uv.y));',
    '  vec2 moonP = vec2(0.55, 0.42);',
    '  float md0 = length(uv - moonP);',
    '  col += vec3(0.45, 0.80, 0.95) * exp(-md0*md0*9.0) * 0.20;',
    '  float moonDisk = smoothstep(0.155, 0.140, md0);',
    '  col = mix(col, vec3(0.94, 0.96, 0.86), moonDisk);',
    '  col = mix(col, vec3(0.78, 0.86, 0.78),',
    '            moonDisk * smoothstep(0.13, 0.08, length(uv - moonP - vec2(0.04, 0.03))));',
    '  float mist1 = fbm(uv*1.6 + vec2(u_time*0.04, u_time*0.02));',
    '  col += vec3(0.10, 0.30, 0.28) * mist1 * 0.22;',
    '  float mist2 = fbm(uv*3.2 - vec2(u_time*0.08, 0.0));',
    '  col += vec3(0.10, 0.40, 0.32) * pow(mist2, 1.6) * 0.18;',
    '  float backLine = -0.10 + sin(uv.x*3.6 + 0.8)*0.05',
    '                 + fbm(vec2(uv.x*1.2, 0.5))*0.10;',
    '  float back = step(uv.y, backLine);',
    '  col = mix(col, vec3(0.015, 0.045, 0.055), back * 0.9);',
    '  float frontLine = -0.28 + sin(uv.x*2.0 + 1.4)*0.08',
    '                  + fbm(vec2(uv.x*2.6, 1.7))*0.22;',
    '  float front = step(uv.y, frontLine);',
    '  col = mix(col, vec3(0.004, 0.018, 0.022), front);',
    '  float rim = smoothstep(0.012, 0.0, abs(uv.y - frontLine)) * (1.0 - front);',
    '  col += vec3(0.30, 0.85, 0.55) * rim * 0.25;',
    '  for(int i = 0; i < 28; i++){',
    '    float fi = float(i);',
    '    float seed = hash(vec2(fi, 1.3));',
    '    float t = u_time*0.35 + seed*60.0;',
    '    vec2 home = vec2(',
    '      (hash(vec2(fi, 7.0))*2.0 - 1.0) * 1.55,',
    '      mix(-0.18, 0.45, hash(vec2(fi, 13.0)))',
    '    );',
    '    home += vec2(sin(t + fi*1.7)*0.11, cos(t*1.2 + fi)*0.09);',
    '    vec2 toM = m - home;',
    '    float pull = exp(-length(toM)*1.5) * 0.75;',
    '    vec2 pos = home + toM * pull;',
    '    float d = distance(uv, pos);',
    '    float twinkle = 0.55 + 0.45 * sin(u_time*3.5 + fi*1.7);',
    '    float core = smoothstep(0.014, 0.009, d) * twinkle;',
    '    float halo = exp(-d*d*120.0) * twinkle * 0.35;',
    '    vec3 hue = mix(vec3(0.98, 1.0, 0.55),',
    '                   vec3(0.50, 1.0, 0.80),',
    '                   seed);',
    '    col += hue * (core*1.3 + halo);',
    '  }',
    '  float md = length(uv - m);',
    '  col += vec3(0.70, 1.0, 0.75) * exp(-md*md*11.0) * 0.30;',
    '  col += vec3(1.00, 1.0, 0.70) * smoothstep(0.024, 0.014, md) * 0.95;',
    '  col *= 1.0 - 0.5*pow(length(uv*vec2(0.6, 0.85)), 2.2);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  // Blit / pixel-art post: nearest sample + Bayer dither + posterize + saturation
  var BLIT_FRAG = [
    'precision highp float;',
    'uniform sampler2D u_tex;',
    'uniform vec2  u_canvasRes;',
    'uniform vec2  u_texRes;',
    'uniform float u_posterize;',
    'uniform float u_dither;',
    'uniform float u_saturation;',
    'float bayer4(vec2 fc){',
    '  vec2 p = mod(fc, 4.0);',
    '  int x = int(p.x);',
    '  int y = int(p.y);',
    '  float v = 0.0;',
    '  if(y==0){',
    '    if(x==0) v=0.0; else if(x==1) v=8.0; else if(x==2) v=2.0; else v=10.0;',
    '  } else if(y==1){',
    '    if(x==0) v=12.0; else if(x==1) v=4.0; else if(x==2) v=14.0; else v=6.0;',
    '  } else if(y==2){',
    '    if(x==0) v=3.0; else if(x==1) v=11.0; else if(x==2) v=1.0; else v=9.0;',
    '  } else {',
    '    if(x==0) v=15.0; else if(x==1) v=7.0; else if(x==2) v=13.0; else v=5.0;',
    '  }',
    '  return v/16.0 - 0.5;',
    '}',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_canvasRes;',
    '  vec2 tx = floor(uv * u_texRes) + 0.5;',
    '  vec3 col = texture2D(u_tex, tx / u_texRes).rgb;',
    '  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));',
    '  col = mix(vec3(lum), col, u_saturation);',
    '  float steps = max(1.0, u_posterize - 1.0);',
    '  if(u_dither > 0.5){',
    '    vec2 cell = floor(uv * u_texRes);',
    '    col += bayer4(cell) / steps;',
    '  }',
    '  col = clamp(floor(col * steps + 0.5) / steps, 0.0, 1.0);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function initGladeBackground(){
    var canvas = document.getElementById('glade-bg');
    if(!canvas){ return; }

    canvas.width  = DESIGN_W;
    canvas.height = DESIGN_H;

    var gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if(!gl){
      console.warn('[glade-bg] WebGL not available; keeping fallback bg');
      // Optional fallback — keep the css fallback color visible by
      // setting a dark background on the canvas via inline style.
      canvas.style.background = '#02100a';
      return;
    }

    function compile(kind, src){
      var sh = gl.createShader(kind);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
        console.error('[glade-bg] shader compile error:', gl.getShaderInfoLog(sh));
        throw new Error(gl.getShaderInfoLog(sh));
      }
      return sh;
    }
    function makeProgram(vert, frag){
      var p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER,   vert));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(p);
      if(!gl.getProgramParameter(p, gl.LINK_STATUS)){
        throw new Error(gl.getProgramInfoLog(p));
      }
      return p;
    }

    // fullscreen triangle
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    var sceneProg = makeProgram(VERT, FRAG_GLADE);
    var scene = {
      prog:     sceneProg,
      a_pos:    gl.getAttribLocation (sceneProg, 'a_pos'),
      u_res:    gl.getUniformLocation(sceneProg, 'u_res'),
      u_smooth: gl.getUniformLocation(sceneProg, 'u_smooth'),
      u_time:   gl.getUniformLocation(sceneProg, 'u_time'),
    };

    var blitProg = makeProgram(VERT, BLIT_FRAG);
    var blit = {
      prog:         blitProg,
      a_pos:        gl.getAttribLocation (blitProg, 'a_pos'),
      u_tex:        gl.getUniformLocation(blitProg, 'u_tex'),
      u_canvasRes:  gl.getUniformLocation(blitProg, 'u_canvasRes'),
      u_texRes:     gl.getUniformLocation(blitProg, 'u_texRes'),
      u_posterize:  gl.getUniformLocation(blitProg, 'u_posterize'),
      u_dither:     gl.getUniformLocation(blitProg, 'u_dither'),
      u_saturation: gl.getUniformLocation(blitProg, 'u_saturation'),
    };

    // offscreen low-res framebuffer for the pixel-art pass
    var pixFBO = null;
    function ensurePixFBO(h){
      var aspect = canvas.width / canvas.height;
      var lh = Math.max(64, Math.round(h));
      var lw = Math.max(64, Math.round(lh * aspect));
      if(pixFBO && pixFBO.w === lw && pixFBO.h === lh) return pixFBO;
      if(pixFBO){
        gl.deleteFramebuffer(pixFBO.fbo);
        gl.deleteTexture(pixFBO.tex);
      }
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, lw, lh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
      var fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      pixFBO = { fbo: fbo, tex: tex, w: lw, h: lh };
      return pixFBO;
    }

    ensurePixFBO(CONFIG.PIXEL_HEIGHT);

    // state — mouse positions live in canvas pixel coords (0..DESIGN_W,
    // 0..DESIGN_H) with y FLIPPED to match WebGL's bottom-origin.
    var start  = performance.now();
    var mouse  = { x: DESIGN_W * 0.5, y: DESIGN_H * 0.45 };
    var smooth = { x: mouse.x, y: mouse.y };

    function onPointer(e){
      var c = (typeof clientToGameCoords === 'function')
        ? clientToGameCoords(e.clientX, e.clientY)
        : { x: e.clientX, y: e.clientY };
      // Clamp to design surface — cursor outside the canvas in
      // letterbox space would push the shader off into surreal
      // territory.
      var x = Math.max(0, Math.min(DESIGN_W, c.x));
      var y = Math.max(0, Math.min(DESIGN_H, c.y));
      mouse.x = x;
      mouse.y = DESIGN_H - y;          // WebGL Y up vs DOM Y down
    }
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchmove', function(e){
      if(e.touches[0]) onPointer(e.touches[0]);
    }, { passive: true });

    // first paint so the canvas isn't transparent before rAF kicks in
    gl.clearColor(0.02, 0.04, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    function isLoginVisible(){
      var login = document.getElementById('login-screen');
      return !!(login && login.classList.contains('active'));
    }

    var prev = performance.now();
    function frame(now){
      requestAnimationFrame(frame);

      // Skip rendering when the login screen isn't visible. We still
      // tick the rAF so the loop reanimates the moment the player
      // returns to main menu.
      if(!isLoginVisible()){
        prev = now;
        return;
      }

      var dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      // ease mouse so motion feels weighty
      var k = 1 - Math.pow(0.001, dt);
      smooth.x += (mouse.x - smooth.x) * k;
      smooth.y += (mouse.y - smooth.y) * k;

      // ── pass 1: scene into low-res FBO ──────────────────────────────────
      var fb = pixFBO;
      var sx = fb.w / canvas.width;
      var sy = fb.h / canvas.height;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb.fbo);
      gl.viewport(0, 0, fb.w, fb.h);
      gl.useProgram(scene.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(scene.a_pos);
      gl.vertexAttribPointer(scene.a_pos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(scene.u_res,    fb.w, fb.h);
      gl.uniform2f(scene.u_smooth, smooth.x * sx, smooth.y * sy);
      gl.uniform1f(scene.u_time,   (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // ── pass 2: blit upscaled to screen with dither + posterize ─────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(blit.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(blit.a_pos);
      gl.vertexAttribPointer(blit.a_pos, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fb.tex);
      gl.uniform1i(blit.u_tex,        0);
      gl.uniform2f(blit.u_canvasRes,  canvas.width, canvas.height);
      gl.uniform2f(blit.u_texRes,     fb.w, fb.h);
      gl.uniform1f(blit.u_posterize,  CONFIG.PALETTE_BANDS);
      gl.uniform1f(blit.u_dither,     CONFIG.DITHER ? 1 : 0);
      gl.uniform1f(blit.u_saturation, CONFIG.SATURATION);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  }

  // The script tag sits at the end of <body>, so DOM is parsed by the
  // time we run. No DOMContentLoaded gate needed.
  initGladeBackground();
})();
