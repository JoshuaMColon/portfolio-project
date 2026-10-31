/* Custom cursor, "ring" style: a small dot that sits exactly on the pointer and a
   thin ring that trails it with easing.
   - over project cards the ring grows and shows a tiny "View" label
   - over links/buttons it tightens into a small filled disc
   - mousedown squeezes the ring (tap feedback)
   - slate in the light theme, the site accent in the dark theme (CSS)
   Only for fine, hovering pointers with motion allowed; touch, pens and reduced
   motion keep the native cursor. Text fields keep the native text caret. The native
   cursor is hidden (body.custom-cursor-active) only while the custom one is showing.
   One rAF loop, transforms only, and it stops once the ring has caught up. */

const CARD = ".infinite-spiral__item, .project-tab";
const LINK =
  "a, button, summary, label, select, [role='button'], [role='tab'], [role='link'], .nav_link, .change-theme, .nav_toggle, .nav_close, .scrollup";
const TEXT =
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file']), textarea, [contenteditable='']:not([contenteditable='false']), [contenteditable='true']";

export function initCustomCursor({ ease = 0.2 } = {}) {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const body = document.body;

  const root = document.createElement("div");
  root.className = "cursor-ring-root";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML =
    '<div class="cursor-ring"><svg viewBox="0 0 80 80" focusable="false"><circle class="cursor-ring__halo" cx="40" cy="40" r="38"/><circle class="cursor-ring__line" cx="40" cy="40" r="38"/></svg><span class="cursor-ring__label">View</span></div><div class="cursor-dot"></div>';
  const ring = root.firstElementChild;
  const dot = root.lastElementChild;

  let enabled = false, shown = false, raf = 0;
  let x = -100, y = -100, rx = -100, ry = -100;
  let mode = "", pressed = false, s = 0.45, sTarget = 0.45, last = 0;

  const SIZE = { "": 0.45, link: 0.34, card: 1, text: 0.45 };

  function setMode(m) {
    if (m === mode) return;
    mode = m;
    root.classList.toggle("is-card", m === "card");
    root.classList.toggle("is-link", m === "link");
    root.classList.toggle("is-text", m === "text");
    retarget();
  }
  function retarget() {
    sTarget = SIZE[mode] * (pressed ? 0.72 : 1);
    kick();
  }
  function show(on) {
    if (on === shown) return;
    shown = on;
    root.classList.toggle("is-visible", on);
    body.classList.toggle("custom-cursor-active", on);
  }
  function kick() {
    if (!raf && enabled) { last = 0; raf = requestAnimationFrame(tick); }
  }
  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(now - last, 64) / 16.667 : 1;
    last = now;
    const k = 1 - Math.pow(1 - ease, dt); /* same feel at any refresh rate */
    rx += (x - rx) * k; ry += (y - ry) * k;
    s += (sTarget - s) * Math.min(1, k * 1.4);
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${s.toFixed(4)})`;
    if (Math.abs(x - rx) + Math.abs(y - ry) > 0.1 || Math.abs(sTarget - s) > 0.002) {
      raf = requestAnimationFrame(tick);
    }
  }

  function onMove(e) {
    if (e.pointerType && e.pointerType !== "mouse") { show(false); return; }
    x = e.clientX; y = e.clientY;
    if (!shown) { rx = x; ry = y; }
    const t = e.target instanceof Element ? e.target : null;
    setMode(!t ? "" : t.closest(TEXT) ? "text" : t.closest(CARD) ? "card" : t.closest(LINK) ? "link" : "");
    show(true);
    kick();
  }
  function onDown(e) { if (e.pointerType === "mouse") { pressed = true; root.classList.add("is-pressed"); retarget(); } }
  function onUp() { if (pressed) { pressed = false; root.classList.remove("is-pressed"); retarget(); } }
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
