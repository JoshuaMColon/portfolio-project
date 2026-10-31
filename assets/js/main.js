/* Optional visual effects, loaded as an ES module (needs http(s); browsers
   block module scripts on file://). Core interactions live in site.js; the
   page background is pure CSS (.bg-layers in graphite.css). */
import { DecryptedText } from "./decrypted-text.js";
import { initCustomCursor } from "./custom-cursor.js?v=2";
import { initMagnetic } from "./magnetic.js";
import { installTooltips } from "./tooltip.js";

installTooltips();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
