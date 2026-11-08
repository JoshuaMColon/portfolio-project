/* Capabilities. Each plate lines up with its label. On a narrow screen the
   plates are stacked in Z and I solve --gap so plate i projects onto item i
   (the tilt is 58deg, the same angle as --tilt-x in the CSS). As the section
   scrolls in, --spread eases from 0.3 to 1: already a stack when it arrives,
   fully open once it settles. The active plate is whichever label crosses
   the middle band of the viewport. Classic script, so this still runs from
   file://. */
(function () {
  "use strict";

  var root = document.querySelector("[data-layers]");
  if (!root) return;

  var plates = Array.prototype.slice.call(root.querySelectorAll(".layer-plate"));
  var items = Array.prototype.slice.call(root.querySelectorAll(".layer-item"));
  if (!plates.length || plates.length !== items.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var stacked = window.matchMedia("(max-width: 899px)");
  var SIN_TILT = Math.sin((58 * Math.PI) / 180); /* matches --tilt-x */
  var active = -1;

  root.style.setProperty("--n", String(plates.length));

  function setActive(index) {
    if (index === active) return;
    active = index;
    plates.forEach(function (p, i) {
      p.classList.toggle("is-active", i === index);
      p.classList.toggle("is-above", i < index);
    });
    items.forEach(function (el, i) {
      el.classList.toggle("is-active", i === index);
      if (i === index) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
  }

  /* Narrow layout only. Plate i sits translateZ((n-1-i) * gap) above the
     stage, which a 58deg tilt projects to (n-1-i) * gap * sin(tilt) pixels
     up the screen. I put the stage origin on the last item's centre and
     pick the gap that lands every plate on its own line. Desktop clears
     both properties and lets the stylesheet stack them. */
  function layout() {
    if (!stacked.matches) {
      root.style.removeProperty("--gap");
      root.style.removeProperty("--origin-y");
      return;
    }
    var top = root.getBoundingClientRect().top;
    var centres = items.map(function (el) {
      var r = el.getBoundingClientRect();
      return r.top - top + r.height / 2;
    });
    var first = centres[0];
    var last = centres[centres.length - 1];
    var gap = (last - first) / ((items.length - 1) * SIN_TILT);
    root.style.setProperty("--gap", gap.toFixed(1) + "px");
    root.style.setProperty("--origin-y", last.toFixed(1) + "px");
  }

  /* Scroll ease-in. Reduced motion stays fully open. Otherwise --spread
     moves from 0.3 to 1 with a cubic ease-out. It starts as the section
     top hits 95% of the viewport and finishes when the top reaches 30%
     on a narrow screen, or 15% on a wide one. I start at 0.3 rather than
     0 so the plates are already separated on the way in. */
  var ticking = false;
  function spread() {
    ticking = false;
    if (reduceMotion.matches) {
      root.style.setProperty("--spread", "1");
      return;
    }
    var r = root.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var start = vh * 0.95;
    var end = vh * (stacked.matches ? 0.3 : 0.15);
    var t = (start - r.top) / (start - end);
    t = Math.max(0, Math.min(1, t));
    var eased = 1 - Math.pow(1 - t, 3);
    root.style.setProperty("--spread", (0.3 + 0.7 * eased).toFixed(3));
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(spread);
    }
  }

  /* Active layer: the root is the middle 10% of the viewport (-45% top and
     bottom). Whichever label intersects that band becomes current. A tap,
     Enter, Space, or focus selects one directly; the scroll band takes
     back over on the next intersection. */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(items.indexOf(entry.target));
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Tap or Enter/Space on a layer selects it (tap ripple comes from site.js). */
  items.forEach(function (el, i) {
    el.addEventListener("click", function () { setActive(i); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActive(i);
      }
    });
    el.addEventListener("focus", function () { setActive(i); });
  });

  function refresh() {
    layout();
    spread();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", refresh);
  if (stacked.addEventListener) {
    stacked.addEventListener("change", refresh);
    reduceMotion.addEventListener("change", refresh);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(root);

  refresh();
  setActive(0);
  root.classList.add("is-ready");
})();
