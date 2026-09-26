/*=============== CUSTOM CURSOR ===============*/
const vertexSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
uniform vec2 resolution;
uniform float iTime;
uniform float clickFlicker;
uniform float sunMode;

float acceleration(float u) {
  return -u + 1.5 * u * u;
}

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 screen = (gl_FragCoord.xy - 0.5 * resolution) / (0.5 * min(resolution.x, resolution.y));

  if (sunMode > 0.5) {
    float radius = length(screen);
    float angle = atan(screen.y, screen.x);
    float surfaceNoise = fbm(screen * 22.0 + vec2(iTime * 0.12, -iTime * 0.08));
    float rays = pow(max(cos(angle * 7.0 + sin(angle * 2.0) * 0.35), 0.0), 24.0);
    float solarRadius = 0.212;
    float solarDisc = 1.0 - smoothstep(solarRadius - 0.008, solarRadius + 0.008, radius);
    float solarFlicker = clickFlicker * (0.5 + 0.5 * sin(iTime * 92.0));
    float corona = exp(-max(radius - solarRadius, 0.0) * 11.0)
      * (1.0 - smoothstep(0.25, 0.68, radius))
      * (0.14 + rays * 0.34);
    float litCorona = corona * (1.0 + solarFlicker * 1.8);
    float flareGlow = 0.0;
    float flareCore = 0.0;
    for (int i = 0; i < 4; i++) {
      float index = float(i);
      float flareAngle = 0.42 + index * 1.72;
      float angularSpan = 0.17 + 0.025 * sin(iTime * 0.55 + index * 2.0);
      float alongFlare = atan(sin(angle - flareAngle), cos(angle - flareAngle)) / angularSpan;
      float flareMask = 1.0 - smoothstep(0.72, 1.0, abs(alongFlare));
      float flareHeight = 0.075
        + 0.035 * (0.5 + 0.5 * sin(iTime * 0.8 + index * 2.4))
        + clickFlicker * 0.15;
      float flareRadius = solarRadius + flareHeight * sqrt(max(1.0 - alongFlare * alongFlare, 0.0));
      float flareDistance = abs(radius - flareRadius);
      float flarePulse = (0.65 + 0.35 * sin(iTime * 1.7 + index * 2.1))
        * flareMask * (1.0 + solarFlicker * 1.5);
      flareGlow += exp(-pow(flareDistance / 0.026, 2.0)) * flarePulse;
      flareCore += exp(-pow(flareDistance / 0.008, 2.0)) * flarePulse;
    }
    vec3 solarColor = vec3(1.0, 0.48, 0.08) * litCorona
      + vec3(1.0, 0.7, 0.2) * solarDisc * (0.82 + surfaceNoise * 0.18 + solarFlicker * 0.16)
      + vec3(1.0, 0.96, 0.7) * exp(-pow(radius / 0.12, 2.0)) * (0.32 + solarFlicker * 0.32)
      + vec3(1.0, 0.78, 0.36) * flareGlow * 0.8
      + vec3(1.0, 0.97, 0.78) * flareCore * (1.2 + solarFlicker)
      + vec3(1.0, 0.9, 0.56) * corona * solarFlicker * 1.6;
    float solarAlpha = max(max(solarDisc, min(litCorona, 0.95)), min(flareGlow * 0.72, 0.9));
    gl_FragColor = vec4(clamp(solarColor, 0.0, 1.0), solarAlpha);
    return;
  }

  float impact = length(screen) * 13.0;
  float criticalImpact = 2.598076;
  float photonDistance = abs(impact - criticalImpact);
  float pulse = 1.0 + 0.08 * sin(iTime * 8.0);
  float clickPulse = clickFlicker * (0.55 + 0.45 * sin(iTime * 75.0));
  float photonRing = exp(-pow(photonDistance / 0.06, 2.0))
    * 3.4 * (pulse + clickPulse * 1.4);
  float corona = 0.38 * exp(-pow((impact - criticalImpact - 0.14) / 0.2, 2.0));
  float shadow = 1.0 - smoothstep(criticalImpact - 0.04, criticalImpact + 0.04, impact);
  vec3 diskLight = vec3(0.0);
  float diskAlpha = 0.0;

  if (impact > criticalImpact + 0.035 && impact < 15.0) {
    vec2 transverse = screen / max(length(screen), 0.0001);
    float u = 0.025;
    float v = sqrt(max(1.0 / (impact * impact) - u * u + u * u * u, 0.0));
    float phi = 0.0;
    float sinInclination = 0.85;
    float cosInclination = 0.52;
    float previousPlane = cosInclination;
    float previousU = u;
    const float stepSize = 0.04;

    for (int i = 0; i < 80; i++) {
      float k1u = v;
      float k1v = acceleration(u);
      float k2u = v + 0.5 * stepSize * k1v;
      float k2v = acceleration(u + 0.5 * stepSize * k1u);
      float k3u = v + 0.5 * stepSize * k2v;
      float k3v = acceleration(u + 0.5 * stepSize * k2u);
      float k4u = v + stepSize * k3v;
      float k4v = acceleration(u + stepSize * k3u);

      float nextU = u + stepSize * (k1u + 2.0 * k2u + 2.0 * k3u + k4u) / 6.0;
      float nextV = v + stepSize * (k1v + 2.0 * k2v + 2.0 * k3v + k4v) / 6.0;
      float nextPhi = phi + stepSize;
      if (nextU <= 0.0 || nextU > 0.6667) break;

      float plane = cosInclination * cos(nextPhi) + sinInclination * transverse.y * sin(nextPhi);
      if (previousPlane * plane < 0.0) {
        float alongStep = clamp(previousPlane / (previousPlane - plane), 0.0, 1.0);
        float crossingU = mix(previousU, nextU, alongStep);
        float diskRadius = 1.0 / crossingU;

        if (diskRadius >= 3.0 && diskRadius <= 12.0) {
          float crossingPhi = phi + stepSize * alongStep;
          vec3 normal = vec3(0.0, sinInclination, cosInclination);
          vec3 position = vec3(
            transverse.x * sin(crossingPhi),
            transverse.y * sin(crossingPhi),
            cos(crossingPhi)
          );
          vec3 velocity = normalize(cross(normal, position));
          vec3 diskUp = cross(normal, vec3(1.0, 0.0, 0.0));
          float diskAzimuth = atan(dot(position, diskUp), position.x);
          float hotSpotAngle = iTime * 1.15;
          float hotSpotDistance = atan(
            sin(diskAzimuth - hotSpotAngle),
            cos(diskAzimuth - hotSpotAngle)
          );
          float hotSpot = exp(
            -pow(hotSpotDistance / 0.3, 2.0)
            -pow((diskRadius - 6.0) / 1.8, 2.0)
          );
          float beta = clamp(sqrt(0.5 / max(diskRadius - 1.0, 0.1)), 0.0, 0.55);
          float gamma = inversesqrt(1.0 - beta * beta);
          float rawDoppler = pow(1.0 / max(gamma * (1.0 - beta * velocity.z), 0.2), 2.4);
          float doppler = mix(1.0, rawDoppler, 0.3);
          float redshift = sqrt(max(1.0 - 1.0 / diskRadius, 0.0));
          float intensity = smoothstep(3.0, 3.8, diskRadius)
            * (1.0 - smoothstep(10.0, 12.0, diskRadius))
            * pow(3.0 / diskRadius, 1.6);
          float edgeFade = smoothstep(3.0, 3.4, diskRadius)
            * (1.0 - smoothstep(10.0, 12.0, diskRadius));
          vec3 temperature = mix(vec3(0.48, 0.76, 0.9), vec3(0.96, 0.99, 1.0), intensity);
          float emission = intensity * doppler * redshift * edgeFade;
          float yellowHeat = 0.08 + 0.1 * hotSpot;
          vec3 diskColor = mix(temperature, vec3(1.0, 0.76, 0.28), 0.58 + yellowHeat * 0.3);
          diskColor = mix(diskColor, vec3(0.94, 1.0, 1.0), hotSpot * 0.9);
          diskLight += diskColor * emission * (4.8 + hotSpot * 2.4);
          diskAlpha = max(diskAlpha, clamp(emission * (1.8 + hotSpot * 0.6), 0.0, 1.0));
        }
      }

      previousPlane = plane;
      previousU = nextU;
      u = nextU;
      v = nextV;
      phi = nextPhi;
    }
  }

  vec3 color = diskLight * (1.0 + clickPulse * 1.1)
    + vec3(0.92, 0.98, 1.0) * photonRing
    + vec3(0.48, 0.78, 0.92) * corona;
  color *= 1.0 - shadow;
  float alpha = max(shadow, max(diskAlpha, max(photonRing, corona)));
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}`;

function renderBlackHole(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) {
    canvas.classList.add("is-fallback");
    return () => {};
  }

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message || "Black-hole shader compilation failed.");
    }
    return shader;
  };

  let vertexShader;
  let fragmentShader;
  let program;
  let buffer;
  try {
    vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        gl.getProgramInfoLog(program) || "Black-hole shader linking failed.",
      );
    }

    canvas.width = 128;
    canvas.height = 128;
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(
      gl.getUniformLocation(program, "resolution"),
      canvas.width,
      canvas.height,
    );
    const timeLocation = gl.getUniformLocation(program, "iTime");
    const clickLocation = gl.getUniformLocation(program, "clickFlicker");
    const sunLocation = gl.getUniformLocation(program, "sunMode");
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.blackHoleDraw = (time, flicker = 0, sun = 0) => {
      gl.uniform1f(timeLocation, time);
      gl.uniform1f(clickLocation, flicker);
      gl.uniform1f(sunLocation, sun);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
  } catch (error) {
    console.warn("Black-hole cursor rendering failed:", error);
    canvas.classList.add("is-fallback");
  }

  return () => {
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

export function initCustomCursor(options = {}) {
  const {
    hoverSelector = "a, button, input, textarea, .nav_link, .change-theme, .nav_toggle, .nav_close, .scrollup",
    dampening = 0.2,
  } = options;
  const supportsCustomCursor = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  if (!supportsCustomCursor) return { destroy() {} };

  const canvas = document.createElement("canvas");
  canvas.className = "custom-cursor-black-hole";
  const bubble = document.createElement("div");
  bubble.className = "custom-cursor-bubble";
  canvas.style.opacity = "0";
  bubble.style.opacity = "0";
  const destroyBlackHole = renderBlackHole(canvas);
  document.body.append(bubble, canvas);
  document.body.classList.add("custom-cursor-active");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let sunMode = !document.body.classList.contains("dark-theme");
  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const current = { x: target.x, y: target.y };
  let active = true;
  let raf = 0;
  let lastDiskRender = 0;
  let clickStartedAt = -Infinity;

  const applyCursorTheme = () => {
    sunMode = !document.body.classList.contains("dark-theme");
    canvas.classList.toggle("is-sun", sunMode);
    bubble.classList.toggle("is-sun", sunMode);
    canvas.blackHoleDraw?.(performance.now() * 0.001, 0, sunMode ? 1 : 0);
  };
  const themeObserver = new MutationObserver(applyCursorTheme);
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  applyCursorTheme();

  const onMove = (event) => {
    target.x = event.clientX;
    target.y = event.clientY;
    canvas.style.opacity = "1";
    bubble.style.opacity = "1";
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const onEnter = () => {
    canvas.classList.add("is-hovering");
    bubble.classList.add("is-hovering");
  };
  const onLeave = () => {
    canvas.classList.remove("is-hovering");
    bubble.classList.remove("is-hovering");
  };
  const hoverTargets = Array.from(document.querySelectorAll(hoverSelector));
  hoverTargets.forEach((element) => {
    element.addEventListener("mouseenter", onEnter);
    element.addEventListener("mouseleave", onLeave);
  });

  const onPress = () => {
    clickStartedAt = performance.now();
    canvas.classList.add("is-pressed");
  };
  const onRelease = () => canvas.classList.remove("is-pressed");
  window.addEventListener("pointerdown", onPress);
  window.addEventListener("pointerup", onRelease);
  window.addEventListener("pointercancel", onRelease);

  const onWindowLeave = () => {
    canvas.style.opacity = "0";
    bubble.style.opacity = "0";
  };
  const onWindowEnter = () => {
    if (
      target.x !== window.innerWidth / 2 ||
      target.y !== window.innerHeight / 2
    ) {
      canvas.style.opacity = "1";
      bubble.style.opacity = "1";
    }
  };
  document.addEventListener("mouseleave", onWindowLeave);
  document.addEventListener("mouseenter", onWindowEnter);

  const loop = (time) => {
    if (!active) return;
    const follow = reducedMotion.matches ? 1 : dampening;
    current.x += (target.x - current.x) * follow;
    current.y += (target.y - current.y) * follow;
    const position = `translate3d(${current.x}px, ${current.y}px, 0)`;
    canvas.style.transform = position;
    bubble.style.transform = position;
    if (
      !reducedMotion.matches &&
      canvas.blackHoleDraw &&
      time - lastDiskRender >= 50
    ) {
      const clickAge = (time - clickStartedAt) * 0.001;
      const clickFlicker =
        clickAge >= 0 && clickAge < 0.55 ? Math.exp(-clickAge * 5.5) : 0;
      canvas.blackHoleDraw(time * 0.001, clickFlicker, sunMode ? 1 : 0);
      lastDiskRender = time;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const destroy = () => {
    active = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onPress);
    window.removeEventListener("pointerup", onRelease);
    window.removeEventListener("pointercancel", onRelease);
    document.removeEventListener("mouseleave", onWindowLeave);
    document.removeEventListener("mouseenter", onWindowEnter);
    themeObserver.disconnect();
    hoverTargets.forEach((element) => {
      element.removeEventListener("mouseenter", onEnter);
      element.removeEventListener("mouseleave", onLeave);
    });
    document.body.classList.remove("custom-cursor-active");
    canvas.remove();
    bubble.remove();
    destroyBlackHole();
  };

  return { destroy };
}
