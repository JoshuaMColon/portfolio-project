/* Custom cursor, "contour" style: the cursor itself is just a small, precise dot.
   The effect lives in the background: in the light theme the flowing topographic
   contours (assets/js/topo-flow.js) bulge and ripple around the pointer and ripple
   out on click, through a pointer uniform in its shader. In the dark theme (no
   contours) a faint glow trails the dot while it moves and fades when it stops.
   - the dot grows a little over links/buttons and more over project cards
   - only for fine, hovering pointers with motion allowed; touch and reduced motion
     keep the native cursor. Text fields keep the native text caret. The native
     cursor is hidden (body.custom-cursor-active) only while the dot is showing.
   One rAF loop (transforms + one opacity), stopped once the glow has settled. */

const CARD = ".infinite-spiral__item, .project-tab";
const LINK =
  "a, button, summary, label, select, [role='button'], [role='tab'], [role='link'], .nav_link, .change-theme, .nav_toggle, .nav_close, .scrollup";
const TEXT =
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file']), textarea, [contenteditable='']:not([contenteditable='false']), [contenteditable='true']";

export function initCustomCursor({ ease = 0.12 } = {}) {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const body = document.body;

  const root = document.createElement("div");
  root.className = "cursor-contour-root";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<div class="cursor-contour__glow"></div><div class="cursor-contour__dot"></div>';
  const glow = root.firstElementChild;
  const dot = root.lastElementChild;

  let enabled = false, shown = false, raf = 0, mode = "", last = 0;
  let x = -100, y = -100, gx = -100, gy = -100, energy = 0, lastMove = 0;

  function setMode(m) {
    if (m === mode) return;
    mode = m;
    root.classList.toggle("is-card", m === "card");
    root.classList.toggle("is-link", m === "link");
    root.classList.toggle("is-text", m === "text");
  }
  function show(on) {
    if (on === shown) return;
    shown = on;
    root.classList.toggle("is-visible", on);
    body.classList.toggle("custom-cursor-active", on);
  }
  function kick() { if (!raf && enabled) { last = 0; raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(now - last, 64) / 16.667 : 1;
    last = now;
    const k = 1 - Math.pow(1 - ease, dt);
    gx += (x - gx) * k; gy += (y - gy) * k;
    energy *= Math.pow(0.94, dt);
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    glow.style.opacity = energy.toFixed(3);
    if (energy > 0.004 || Math.abs(x - gx) + Math.abs(y - gy) > 0.2) raf = requestAnimationFrame(tick);
  }

  function onMove(e) {
    if (e.pointerType && e.pointerType !== "mouse") { show(false); return; }
    const now = e.timeStamp, dx = e.clientX - x, dy = e.clientY - y;
    if (shown && lastMove) {
      const v = Math.hypot(dx, dy) / Math.max(8, now - lastMove); /* px per ms */
      energy = Math.min(1, energy + v * 0.08);
    }
    lastMove = now;
    x = e.clientX; y = e.clientY;
    if (!shown) { gx = x; gy = y; }
    const t = e.target instanceof Element ? e.target : null;
    setMode(!t ? "" : t.closest(TEXT) ? "text" : t.closest(CARD) ? "card" : t.closest(LINK) ? "link" : "");
    show(true);
    kick();
  }
  function onDown(e) { if (e.pointerType === "mouse") { root.classList.add("is-pressed"); energy = Math.min(1, energy + 0.5); kick(); } }
  function onUp() { root.classList.remove("is-pressed"); }
  function onLeave(e) { if (!e.relatedTarget) show(false); }

  function enable() {
    if (enabled) return;
    enabled = true;
    body.appendChild(root);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", onUp);
    document.addEventListener("pointerout", onLeave, { passive: true });
  }
  function disable() {
    if (!enabled) return;
    enabled = false;
    show(false);
    cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("blur", onUp);
    document.removeEventListener("pointerout", onLeave);
    root.remove();
  }
  function sync() { (fine.matches && !reduce.matches ? enable : disable)(); }
  fine.addEventListener?.("change", sync);
  reduce.addEventListener?.("change", sync);
  sync();

  return {
    destroy() {
      disable();
      fine.removeEventListener?.("change", sync);
      reduce.removeEventListener?.("change", sync);
    },
  };
}
