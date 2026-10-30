/* Optional visual effects, loaded as an ES module (needs http(s); browsers
   block module scripts on file://). Core interactions live in site.js. */
import { initFloatingLines } from "./floating-lines.js";
import { initLightRays } from "./light-rays.js";
import { DecryptedText } from "./decrypted-text.js";
import { initCustomCursor } from "./custom-cursor.js";
import { initMagnetic } from "./magnetic.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const floatingLinesBg = document.getElementById("floating-lines-bg");
const lightRaysBg = document.getElementById("light-rays-bg");

let floatingLines = null;
let lightRays = null;

function applyBackgroundForTheme() {
  if (reduceMotion) return;
  const isDark = document.body.classList.contains("dark-theme");
  try {
    if (isDark) {
      floatingLines?.destroy();
      floatingLines = null;
      if (lightRaysBg && !lightRays) {
        lightRays = initLightRays(lightRaysBg, {
          raysOrigin: "top-center",
          raysColor: "#ffffff",
          raysSpeed: 0.6,
          lightSpread: 0.45,
          rayLength: 2.4,
          followMouse: true,
          mouseInfluence: 0.06,
          noiseAmount: 0,
          distortion: 0,
          pulsating: false,
          fadeDistance: 0.9,
          saturation: 0.6,
        });
      }
    } else {
      lightRays?.destroy();
      lightRays = null;
      if (floatingLinesBg && !floatingLines) {
        floatingLines = initFloatingLines(floatingLinesBg, {
          enabledWaves: ["top", "middle", "bottom"],
          lineCount: 10,
          lineDistance: 7,
          bendRadius: 8,
          bendStrength: -2,
          interactive: true,
          parallax: true,
          animationSpeed: 0.6,
          linesGradient: ["#9ca3af", "#7dd3fc", "#f7b36a"],
        });
      }
    }
  } catch (err) {
    console.warn("Background effect unavailable:", err);
  }
}

applyBackgroundForTheme();
new MutationObserver(applyBackgroundForTheme).observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});

const bioText = document.getElementById("bio-text");
if (bioText && !reduceMotion) {
  new DecryptedText(bioText, {
    animateOn: "view",
    sequential: true,
    revealDirection: "start",
    speed: 30,
  });
}

initCustomCursor();
initMagnetic(".btn-light, .contact_button");
