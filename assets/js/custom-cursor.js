/* Custom cursor, "map crosshair" style: a thin survey crosshair with ruler ticks and
   a small grid-reference readout (E = page x, N = page y, in CSS px), like the
   cursor of a map tool. It sits exactly on the pointer (no trailing), and tightens
   around interactive elements with corner brackets (wider brackets + "VIEW" on
   project cards). Mousedown snaps the arms in.
   Only for fine, hovering pointers; touch keeps the native cursor. There is no
   trailing motion, so it stays on with prefers-reduced-motion, just without the
   tighten/loosen transitions. Text fields keep the native text caret. The native
   cursor is hidden (body.custom-cursor-active) only while the crosshair is showing.
   Work per frame: one transform for the crosshair, one for the readout, and the
   readout text only when it changes. */

const CARD = ".infinite-spiral__item, .project-tab";
const LINK =
  "a, button, summary, label, select, [role='button'], [role='tab'], [role='link'], .nav_link, .change-theme, .nav_toggle, .nav_close, .scrollup";
const TEXT =
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file']), textarea, [contenteditable='']:not([contenteditable='false']), [contenteditable='true']";

export function initCustomCursor() {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const body = document.body;

  const root = document.createElement("div");
  root.className = "cursor-cross-root";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML =
    '<div class="cursor-cross">' +
    '<i class="cursor-cross__arm" style="--r:0deg"></i><i class="cursor-cross__arm" style="--r:90deg"></i>' +
    '<i class="cursor-cross__arm" style="--r:180deg"></i><i class="cursor-cross__arm" style="--r:270deg"></i>' +
    '<b class="cursor-cross__corner" style="--r:0deg"></b><b class="cursor-cross__corner" style="--r:90deg"></b>' +
    '<b class="cursor-cross__corner" style="--r:180deg"></b><b class="cursor-cross__corner" style="--r:270deg"></b>' +
    '<span class="cursor-cross__pip"></span></div>' +
    '<div class="cursor-cross__readout"><span class="cursor-cross__tag">VIEW</span><span class="cursor-cross__coords"></span></div>';
  const cross = root.firstElementChild;
  const readout = root.lastElementChild;
  const coords = readout.lastElementChild;

  let enabled = false, shown = false, raf = 0, mode = "";
  let x = -100, y = -100, text = "", rw = 0, rh = 0;

  function pad(n) { n = Math.max(0, Math.round(n)); return n < 1e4 ? ("000" + n).slice(-4) : String(n); }
  function setMode(m) {
    if (m === mode) return;
    mode = m;
    root.classList.toggle("is-card", m === "card");
    root.classList.toggle("is-link", m === "link");
    root.classList.toggle("is-text", m === "text");
    rw = 0; /* readout width changes with the tag */
  }
  function show(on) {
    if (on === shown) return;
    shown = on;
    root.classList.toggle("is-visible", on);
    body.classList.toggle("custom-cursor-active", on);
  }
  function frame() {
    raf = 0;
    cross.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    const t = `E ${pad(x + window.scrollX)}  N ${pad(y + window.scrollY)}`;
    if (t !== text) { text = t; coords.textContent = t; }
    if (!rw) { rw = readout.offsetWidth; rh = readout.offsetHeight; }
    const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    const ox = x + 18 + rw > vw - 6 ? x - 18 - rw : x + 18;
    const oy = y + 18 + rh > vh - 6 ? y - 18 - rh : y + 18;
    readout.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
  }
  function queue() { if (!raf) raf = requestAnimationFrame(frame); }

  function onMove(e) {
    if (e.pointerType && e.pointerType !== "mouse") { show(false); return; }
    x = e.clientX; y = e.clientY;
    const t = e.target instanceof Element ? e.target : null;
    setMode(!t ? "" : t.closest(TEXT) ? "text" : t.closest(CARD) ? "card" : t.closest(LINK) ? "link" : "");
    show(true);
    queue();
  }
  function onDown(e) { if (e.pointerType === "mouse") root.classList.add("is-pressed"); }
  function onUp() { root.classList.remove("is-pressed"); }
  function onLeave(e) { if (!e.relatedTarget) show(false); }

  function enable() {
    if (enabled) return;
    enabled = true;
    body.appendChild(root);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", queue, { passive: true }); /* the readout tracks page coords */
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
    window.removeEventListener("scroll", queue);
    window.removeEventListener("blur", onUp);
    document.removeEventListener("pointerout", onLeave);
    root.remove();
  }
  function sync() { (fine.matches ? enable : disable)(); }
  fine.addEventListener?.("change", sync);
  sync();

  return {
    destroy() {
      disable();
      fine.removeEventListener?.("change", sync);
    },
  };
}
