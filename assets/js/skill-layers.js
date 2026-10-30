/* Capabilities layer stack: lines each tilted plate up with its text on
   small screens, eases the stack apart as it scrolls in, and highlights the
   layer whose text is in view. Classic script so it also works from file://. */
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

  /* Mobile: plate i is translateZ((n-1-i) * gap) above the stage, which
     projects to (n-1-i) * gap * sin(tilt) px up the screen. Put the stage on
     the last item's centre and size the gap so every plate meets its item. */
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

  /* Scroll ease-in: the stack starts compressed and fans out to full spacing
     as the section arrives. Reduced motion keeps it fanned out. */
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

  /* Active layer: whichever item crosses the middle band of the viewport. */
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
