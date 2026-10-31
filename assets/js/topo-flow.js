/* Light theme only: makes the topographic contour lines flow like slowly shifting
   terrain. Loaded lazily by site.js (never in dark mode, never with reduced motion).
   One WebGL2 fragment shader draws the contours of a time-evolving height field:
   - the height field is the exact field the static tile (assets/img/topo.svg) was
     generated from (same waves + bumps, baked once into a periodic 1024² texture),
     so the first frame matches the static tile and the hand-off is invisible;
   - each frame warps it gently, morphs it with a few slow waves and drifts the
     levels (rings breathe out of peaks / into hollows). Everything is periodic over
     the tile, so it stays seamless.
   Cost: a 256² warp pass + one full-screen draw at <=30 fps, DPR- and pixel-capped; paused while the
   tab is hidden or the dark theme is on. Any failure (or no hardware GPU) leaves the static tile. */
(function () {
  "use strict";
  var host = document.querySelector(".bg-topo");
  if (!host || host.querySelector(".topo-flow")) return;

  var P = {"w":[2.0,-3.0,0.1888,1.4879,-2.0,2.0,0.2588,3.6578,-3.0,-3.0,0.1528,2.7214,1.0,0.0,1.0,1.0037,1.0,2.0,0.3513,0.7142,0.0,-1.0,1.0,3.2468,-1.0,0.0,1.0,3.687,-2.0,2.0,0.2588,6.0084,2.0,-2.0,0.2588,4.0749,-6.0,-4.0,0.0851,5.4047,0.0,5.0,0.0795,1.8164,5.0,-1.0,0.1067,4.6495,-7.0,-1.0,0.1411,1.9444,-3.0,-6.0,0.0902,0.351,4.0,6.0,0.1187,1.2335,7.0,-7.0,0.133,2.3315,-4.0,-7.0,0.0475,1.0234,4.0,-11.0,0.0345,0.0537,-5.0,-6.0,0.0493,3.9613,-4.0,-6.0,0.0381,4.2133,10.0,-5.0,0.0623,3.2119,11.0,12.0,0.0399,0.7915,5.0,-9.0,0.0667,4.2847,9.0,-9.0,0.0344,5.037,-11.0,-1.0,0.0671,0.0961,-2.0,9.0,0.0393,6.2027,-19.0,-14.0,0.0177,2.9193,16.0,1.0,0.0168,4.5501,7.0,17.0,0.0155,1.0867,-13.0,11.0,0.0153,4.2663,-9.0,16.0,0.0222,2.3256,13.0,-17.0,0.0183,0.9603,19.0,1.0,0.0148,4.7573,1.0,20.0,0.0165,4.0975,4.0,16.0,0.0176,5.7216,-16.0,-10.0,0.0245,4.985,-10.0,16.0,0.0225,0.6184,-17.0,6.0,0.0202,5.5283,18.0,-6.0,0.0232,3.4049,-7.0,-15.0,0.0249,2.8576],"g":[835.46,351.26,110.22,0.98,376.78,1070.05,197.77,-1.08,927.93,36.42,216.04,-0.85,792.6,1117.76,141.08,1.18,357.8,890.11,218.32,-1.3,789.18,819.36,233.01,1.06,910.45,1054.18,125.35,-1.04,515.54,34.82,33.44,0.21,500.92,260.54,54.91,-0.21,611.79,739.98,73.93,0.25,838.92,321.63,63.59,-0.18,802.63,266.62,65.76,0.3,957.65,1128.39,63.99,0.2,227.66,1082.94,30.43,-0.16,711.42,617.05,60.53,-0.16,452.79,699.02,65.52,-0.26,313.39,498.41,57.15,-0.2,954.0,1021.81,28.64,0.18,763.0,1087.41,41.48,0.2,511.0,602.51,50.76,0.28,395.11,618.53,36.89,0.2,554.65,1138.85,63.23,0.3,965.63,1040.13,63.61,0.16,382.35,133.38,58.32,0.18,655.37,56.13,48.62,-0.14,235.16,768.87,72.37,-0.26,488.86,136.07,68.07,-0.27,824.24,275.9,51.18,0.2,781.58,821.43,43.35,0.27],"lo":-3.15414,"hi":3.02072}; /* w: [kx,ky,amp,phase]*, g: [cx,cy,r,sign*amp]*, lo/hi: field range */
  var NW = P.w.length / 4, NG = P.g.length / 4, R = 1024, T = 1200, LEVELS = 65, FR = 256;
  var PRESETS = {
    /* drift: levels/s, warp: px, morph: levels, speed: time scale */
    calm: { drift: 0.14, warp: 16, morph: 1.1, speed: 0.3 },
    lively: { drift: 0.3, warp: 24, morph: 1.7, speed: 0.6 },
  };
  var q = /[?&]flow=(calm|lively)\b/.exec(location.search);
  var preset = PRESETS[(q && q[1]) || host.getAttribute("data-flow")] || PRESETS.calm;

  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canvas = document.createElement("canvas");
  canvas.className = "topo-flow";
  canvas.setAttribute("aria-hidden", "true");
  /* software-rendered WebGL (no usable GPU) would read every frame back on the main
     thread, so those browsers keep the static tile. ?flowforce overrides (testing). */
  var force = /[?&]flowforce\b/.test(location.search);
  var gl = canvas.getContext("webgl2", {
    alpha: true, premultipliedAlpha: true, antialias: false, depth: false,
    stencil: false, preserveDrawingBuffer: false, powerPreference: "low-power",
    failIfMajorPerformanceCaveat: !force,
  });
  if (!gl) return;
  if (!force) {
    var dri = gl.getExtension("WEBGL_debug_renderer_info");
    var rend = String(gl.getParameter(dri ? dri.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(rend)) {
      var lc = gl.getExtension("WEBGL_lose_context"); if (lc) lc.loseContext();
      return;
    }
  }

  var VS = "#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  var BAKE = "#version 300 es\nprecision highp float;" +
    "uniform vec4 uW[" + NW + "];uniform vec4 uG[" + NG + "];uniform vec2 uLH;out vec4 o;" +
    "const float T=1200.,R=1024.,TAU=6.28318531;" +
    "void main(){vec2 p=gl_FragCoord.xy*(T/R);float F=0.;" +
    "for(int i=0;i<" + NW + ";i++)F+=uW[i].z*sin(TAU*fract(dot(uW[i].xy,p)/T)+uW[i].w);" +
    "for(int i=0;i<" + NG + ";i++){vec2 d=p-uG[i].xy;d-=T*floor(d/T+.5);float k=-.5/(uG[i].z*uG[i].z);" +
    "for(int a=-1;a<=1;a++)for(int b=-1;b<=1;b++){vec2 e=d+T*vec2(a,b);F+=uG[i].w*exp(dot(e,e)*k);}}" +
    "float h=clamp((F-uLH.x)/(uLH.y-uLH.x),0.,1.);" +
    "\n#ifdef LIN\no=vec4(h,0.,0.,1.);\n#else\nuint x=uint(h*65535.+.5);o=vec4(float(x>>8u),float(x&255u),0.,255.)/255.;\n#endif\n}";
  /* warp (xy) + morph (z): smooth, low-frequency and periodic, so they're cheap to
     evaluate on a small 256² grid once per frame and sample with one linear fetch */
  var WARP = "const float TAU=6.28318531,T=1200.;uniform float uT;uniform vec4 uP;" +
    "float w(vec2 k,vec2 p,float ph,float om){float a=TAU*fract(dot(k,p)/T)+ph;return sin(a+om*uT)-sin(a);}" +
    /* gentle domain warp + slow morph (low waves rising and falling); zero at t=0 */
    "vec3 flow(vec2 p){return vec3(uP.y*vec2(w(vec2(1,1),p,.7,.21)+.6*w(vec2(-2,1),p,2.1,.33),w(vec2(1,-1),p,4.,.17)+.6*w(vec2(1,2),p,5.3,.29))," +
    "uP.z*(w(vec2(2,1),p,1.3,.23)+.7*w(vec2(-1,3),p,3.7,.31)+.5*w(vec2(3,-2),p,.4,.41)));}";
  var FLOW = "#version 300 es\nprecision highp float;" + WARP + "out vec4 o;" +
    "void main(){o=vec4(flow(gl_FragCoord.xy*(T/" + FR + ".)),0.);}";
  function drawSrc(tex, lin) {
    return "#version 300 es\nprecision highp float;" + WARP +
      "uniform sampler2D uF,uW;uniform vec2 uOff;uniform float uK,uH,uD;uniform vec2 uLW;out vec4 o;" +
      "const float R=1024.;" +
      (lin ? "float H(vec2 p){return texture(uF,p/T).r;}" :
      "float dec(ivec2 c){vec4 v=texelFetch(uF,c&1023,0);return(v.r*65280.+v.g*255.)/65535.;}" +
      "float H(vec2 p){p=p*(R/T)-.5;vec2 i=floor(p),f=p-i;ivec2 c=ivec2(i);" +
      "return mix(mix(dec(c),dec(c+ivec2(1,0)),f.x),mix(dec(c+ivec2(0,1)),dec(c+ivec2(1,1)),f.x),f.y);}") +
      "void main(){vec2 p=vec2(gl_FragCoord.x,uH-gl_FragCoord.y)*uK+uOff;" +
      (tex ? "vec3 f=texture(uW,p/T).xyz;" : "vec3 f=flow(p);") +
      "vec2 q=p+f.xy;q-=T*floor(q/T);" +
      "float u=H(q)*" + LEVELS + ".+f.z+uD;" +
      "float fw=max(fwidth(u),1e-5),d=abs(fract(u+.5)-.5)/fw,n=floor(u+.5);" +
      "float lw=mod(n-1.,5.)<.5?uLW.y:uLW.x;" +
      "float c=clamp(max(lw,1.)*.5+.5-d,0.,1.)*min(lw,1.);" +
      /* lines closer than ~2px: settle to their average tone instead of aliasing */
      "c=mix(c,min(.55*fw,.5),smoothstep(.3,.6,fw));" +
      "o=vec4(vec3(.1647,.2,.2588)*c,c);}";
  }

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s;
  }
  function prog(fs) {
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "a"); gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  }
  /* the small warp grid needs a half-float render target; without one the draw
     pass evaluates the warp per pixel (same picture, more ALU) */
  var cbf = !!gl.getExtension("EXT_color_buffer_float");
  var useTex = cbf || !!gl.getExtension("EXT_color_buffer_half_float");
  /* with float targets + float filtering the field is one hardware-filtered fetch per
     pixel; otherwise it's 16-bit packed RGBA8 with a manual bilinear (4 fetches) */
  var lin = cbf && !!gl.getExtension("OES_texture_float_linear");
  var bake = prog(lin ? BAKE.replace("precision", "#define LIN\nprecision") : BAKE);
  if (!bake && lin) { lin = false; bake = prog(BAKE); }
  var flowP = useTex && prog(FLOW), draw = prog(drawSrc(!!flowP, lin));
  if (!bake || !draw) return;
  useTex = !!flowP;

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  /* bake the static field once */
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  if (lin) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, R, R, 0, gl.RED, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, R, R, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  var filt = lin ? gl.LINEAR : gl.NEAREST;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
  var fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, R, R);
  gl.useProgram(bake);
  gl.uniform4fv(gl.getUniformLocation(bake, "uW"), new Float32Array(P.w));
  gl.uniform4fv(gl.getUniformLocation(bake, "uG"), new Float32Array(P.g));
  gl.uniform2f(gl.getUniformLocation(bake, "uLH"), P.lo, P.hi);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fb);

  var wtex = null, wfb = null, UF = {};
  if (useTex) {
    gl.activeTexture(gl.TEXTURE1);
    wtex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, wtex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, FR, FR, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    wfb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, wfb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, wtex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.useProgram(flowP);
    UF.uT = gl.getUniformLocation(flowP, "uT");
    gl.uniform4f(gl.getUniformLocation(flowP, "uP"), 0, preset.warp, preset.morph, 0);
  }

  gl.useProgram(draw);
  var U = {};
  ["uF", "uW", "uOff", "uK", "uH", "uT", "uD", "uP", "uLW"].forEach(function (n) { U[n] = gl.getUniformLocation(draw, n); });
  gl.uniform1i(U.uF, 0);
  gl.uniform1i(U.uW, 1);
  gl.uniform4f(U.uP, 0, preset.warp, preset.morph, 0);
  gl.clearColor(0, 0, 0, 0);

  /* line up with the static tile: same size and centring, plus wherever its CSS drift
     currently is, so swapping the static tile for the canvas is invisible */
  var drift = [0, 0];
  try {
    var m = new DOMMatrixReadOnly(getComputedStyle(host, "::before").transform);
    drift = [m.m41, m.m42];
  } catch (e) {}

  var scale = 1, W = 0, Hh = 0, tile = 1200;
  function resize() {
    W = host.clientWidth; Hh = host.clientHeight;
    tile = parseFloat(getComputedStyle(host, "::before").backgroundSize) || 1200;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cap = Math.sqrt(2.6e6 / Math.max(1, W * Hh)); /* at most ~2.6 MP per frame */
    scale = Math.min(dpr, cap);
    canvas.width = Math.round(W * scale); canvas.height = Math.round(Hh * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U.uK, T / tile / scale);
    gl.uniform1f(U.uH, canvas.height);
    gl.uniform2f(U.uOff, -(drift[0] + (W - tile) / 2) * (T / tile), -(drift[1] + (Hh - tile) / 2) * (T / tile));
    gl.uniform2f(U.uLW, 0.55 * scale, 1.05 * scale);
    dirty = true;
  }

  var t = 0, td = 0, last = 0, raf = 0, dirty = true, running = false, lost = false, FRAME = 1000 / 30;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (last && now - last < FRAME - 2 && !dirty) return;
    if (last) {
      var dt = Math.min(now - last, 100) / 1000;
      t += dt * preset.speed; /* terrain morph clock */
      td = (td + dt * preset.drift) % 5; /* level drift (mod 5 keeps index lines in step) */
    }
    last = now; dirty = false;
    render();
  }
  function render() {
    if (useTex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, wfb);
      gl.viewport(0, 0, FR, FR);
      gl.useProgram(flowP);
      gl.uniform1f(UF.uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(draw);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uD, td);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function wanted() {
    return !lost && !document.hidden && !reduceMotion.matches && !body.classList.contains("dark-theme");
  }
  function update() {
    var on = wanted();
    if (on && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    if (!on && running) { running = false; cancelAnimationFrame(raf); }
    /* reduced motion (or a lost context) brings the static tile back */
    host.classList.toggle("is-flowing", !lost && !reduceMotion.matches);
  }

  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); lost = true; update(); });
  host.insertBefore(canvas, host.firstChild);
  resize();
  /* draw the first frame, then swap in the same paint */
  render();
  update();

  var rz = 0;
  window.addEventListener("resize", function () {
    cancelAnimationFrame(rz); rz = requestAnimationFrame(resize);
  });
  document.addEventListener("visibilitychange", update);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", update);
  new MutationObserver(update).observe(body, { attributes: true, attributeFilter: ["class"] });
})();
