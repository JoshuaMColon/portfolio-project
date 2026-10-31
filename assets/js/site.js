/* Core interactions. Classic script (not a module) so everything here also
   works when index.html is opened straight from disk (file://). */
(function () {
  "use strict";

  var body = document.body;
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /*=============== THEME ===============*/
  var themeButton = document.getElementById("theme-button");
  var DARK = "dark-theme";

  function syncThemeButton() {
    if (!themeButton) return;
    var isDark = body.classList.contains(DARK);
    var icon = themeButton.querySelector("i");
    if (icon) icon.className = isDark ? "ri-sun-line" : "ri-moon-line";
    themeButton.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme",
    );
    themeButton.setAttribute("aria-pressed", String(!isDark));
  }

  if (themeButton) {
    syncThemeButton();
    themeButton.addEventListener("click", function () {
      body.classList.add("theme-switched"); /* rings use the full neon start-up from now on */
      body.classList.toggle(DARK);
      var isDark = body.classList.contains(DARK);
      try {
        localStorage.setItem("selected-theme", isDark ? "dark" : "light");
        localStorage.setItem("selected-icon", isDark ? "ri-sun-line" : "ri-moon-line");
      } catch (e) {}
      syncThemeButton();
    });
  }

  /*=============== HEX MARK: REPLAY ON SCROLL ===============*/
  /* the rings around the portrait replay their theme-switch start-up (neon ignite
     in dark, colour-split glitch burst in both themes) each time the portrait
     scrolls back into view (>= 55% visible), at most once every 4s. Not on first
     load (the load-in animation already plays) and never with reduced motion. */
  var heroVisual = document.querySelector(".hero-visual");
  var hexTimer = 0;
  var hexLast = 0;
  function clearHexReplay() {
    window.clearTimeout(hexTimer);
    if (heroVisual) heroVisual.classList.remove("hex-replay", "hex-reset");
  }
  function replayHex() {
    if (!heroVisual || reduceMotion.matches || document.hidden) return;
    var now = Date.now();
    if (now - hexLast < 4000) return;
    hexLast = now;
    clearHexReplay();
    heroVisual.classList.add("hex-reset");
    void heroVisual.offsetWidth; /* flush so the keyframes restart from 0 */
    heroVisual.classList.remove("hex-reset");
    heroVisual.classList.add("hex-replay");
    hexTimer = window.setTimeout(clearHexReplay, 1700);
  }
  if (heroVisual && "IntersectionObserver" in window) {
    var hexSeen = null; /* null until the first callback: no replay on page load */
    new IntersectionObserver(
      function (entries) {
        var visible = entries[entries.length - 1].intersectionRatio >= 0.55;
        if (visible && hexSeen === false) replayHex();
        hexSeen = visible;
      },
      { threshold: [0, 0.55] },
    ).observe(heroVisual);
  }
  if (themeButton) themeButton.addEventListener("click", function () { clearHexReplay(); hexLast = Date.now(); });

  /*=============== FLOWING CONTOURS (light theme) ===============*/
  /* the WebGL contour animation is fetched only once the light theme is showing and
     motion is allowed (never in dark mode); until then (or without WebGL2) the static
     contour tile from the CSS is what you see */
  var topoFlowLoaded = false;
  function loadTopoFlow() {
    if (topoFlowLoaded || body.classList.contains(DARK) || reduceMotion.matches) return;
    if (!window.WebGL2RenderingContext || !document.querySelector(".bg-topo")) return;
    var conn = navigator.connection;
    if (conn && conn.saveData) return;
    topoFlowLoaded = true;
    var s = document.createElement("script");
    s.src = "assets/js/topo-flow.js?v=2";
    s.async = true;
    document.head.appendChild(s);
  }
  function loadTopoFlowWhenIdle() {
    var go = function () { (window.requestIdleCallback || setTimeout)(loadTopoFlow, { timeout: 1500 }); };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  }
  loadTopoFlowWhenIdle();
  if (themeButton) themeButton.addEventListener("click", loadTopoFlow);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", loadTopoFlow);

  /*=============== MOBILE MENU ===============*/
  var navMenu = document.getElementById("nav-menu");
  var navToggle = document.getElementById("nav-toggle");
  var navClose = document.getElementById("nav-close");

  function setMenu(open) {
    if (!navMenu) return;
    navMenu.classList.toggle("show-menu", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
    if (open && navClose) navClose.focus();
    if (!open && navToggle && navMenu.contains(document.activeElement)) {
      navToggle.focus();
    }
  }

  if (navToggle) navToggle.addEventListener("click", function () { setMenu(true); });
  if (navClose) navClose.addEventListener("click", function () { setMenu(false); });
  document.querySelectorAll(".nav_link").forEach(function (link) {
    link.addEventListener("click", function () {
      if (navMenu) navMenu.classList.remove("show-menu");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navMenu && navMenu.classList.contains("show-menu")) {
      setMenu(false);
    }
  });

  /*=============== SCROLL: header, active link, scroll-up, progress ===============*/
  var header = document.getElementById("header");
  var scrollUp = document.getElementById("scroll-up");
  var progress = document.getElementById("scroll-progress");
  var sections = Array.prototype.slice.call(document.querySelectorAll("section[id]"));
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("bg-header", y > 40);
    if (scrollUp) scrollUp.classList.toggle("show-scroll", y > 560);

    if (progress) {
      var max = root.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }

    var current = null;
    sections.forEach(function (s) {
      if (y >= s.offsetTop - 120) current = s.id;
    });
    if (current) {
      document.querySelectorAll(".nav_link").forEach(function (link) {
        var active = link.getAttribute("href") === "#" + current;
        link.classList.toggle("active-link", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /*=============== REVEAL ON SCROLL ===============*/
  if (!reduceMotion.matches && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(
      ".section-heading, .skills-frame, .offer-card, .project-gallery, " +
        ".about-card, .cta, .contact-row, .contact_form, .logo-strip",
    );
    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      if (el.classList.contains("offer-card") || el.classList.contains("about-card") ||
          el.classList.contains("contact-row")) {
        var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.setProperty("--reveal-delay", idx * 80 + "ms");
      }
    });
    root.classList.add("js-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  /*=============== SPOTLIGHT (pointer-follow highlight on tiles) ===============*/
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var tile = e.target.closest && e.target.closest(".tile");
    if (!tile) return;
    var r = tile.getBoundingClientRect();
    tile.style.setProperty("--mx", e.clientX - r.left + "px");
    tile.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true });

  /*=============== TAP / CLICK FEEDBACK (mouse, touch, pen) ===============*/
  var rippleSel = ".btn, .icon-btn, .tile, .project-tab, .scrollup, .nav_link, .ticker-link, .readmore-toggle, .layer-item";
  document.addEventListener("pointerdown", function (e) {
    if (e.button && e.button !== 0) return;
    var el = e.target.closest && e.target.closest(rippleSel);
    if (!el) return;
    var cs = window.getComputedStyle(el);
    if (cs.position === "static") el.style.position = "relative";
    if (cs.overflow === "visible" && !el.classList.contains("btn")) el.style.overflow = "hidden";
    var r = el.getBoundingClientRect();
    var dot = document.createElement("span");
    dot.className = "tap-ripple";
    dot.setAttribute("aria-hidden", "true");
    dot.style.left = e.clientX - r.left + "px";
    dot.style.top = e.clientY - r.top + "px";
    el.appendChild(dot);
    dot.addEventListener("animationend", function () { dot.remove(); });
    setTimeout(function () { if (dot.parentNode) dot.remove(); }, 900);
  }, { passive: true });

  /* Keyboard users get the same feedback when activating with Enter/Space. */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = document.activeElement;
    if (!el || !el.matches || !el.matches(rippleSel)) return;
    var dot = document.createElement("span");
    dot.className = "tap-ripple";
    dot.setAttribute("aria-hidden", "true");
    dot.style.left = "50%";
    dot.style.top = "50%";
    if (window.getComputedStyle(el).position === "static") el.style.position = "relative";
    el.appendChild(dot);
    setTimeout(function () { if (dot.parentNode) dot.remove(); }, 700);
  });

  /*=============== SUBTLE TILT ON THE PROJECT FRAME (desktop, motion OK) ===============*/
  var gallery = document.querySelector(".project-gallery");
  var fine = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
  if (gallery && fine.matches && !reduceMotion.matches) {
    gallery.addEventListener("pointermove", function (e) {
      var r = gallery.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      gallery.style.setProperty("--scroll-tilt-y", (px * 2.4).toFixed(2) + "deg");
      gallery.style.setProperty("--scroll-tilt-x", (-py * 2.4).toFixed(2) + "deg");
    });
    gallery.addEventListener("pointerleave", function () {
      gallery.style.setProperty("--scroll-tilt-x", "0deg");
      gallery.style.setProperty("--scroll-tilt-y", "0deg");
    });
  }

  /*=============== CONTACT FORM (EmailJS) ===============*/
  var contactForm = document.getElementById("contact-form");
  var contactName = document.getElementById("contact-name");
  var contactEmail = document.getElementById("contact-email");
  var contactProject = document.getElementById("contact-project");
  var contactMessage = document.getElementById("contact-message");

  function showMessage(text, ok) {
    contactMessage.classList.toggle("color-blue", ok);
    contactMessage.classList.toggle("color-red", !ok);
    contactMessage.textContent = text;
  }

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!contactName.value.trim() || !contactEmail.value.trim() || !contactProject.value.trim()) {
        showMessage("Please fill in every field.", false);
        var firstEmpty = [contactName, contactEmail, contactProject].filter(function (f) {
          return !f.value.trim();
        })[0];
        if (firstEmpty) firstEmpty.focus();
        return;
      }
      if (contactEmail.validity && !contactEmail.validity.valid) {
        showMessage("Please enter a valid email address.", false);
        contactEmail.focus();
        return;
      }
      if (typeof window.emailjs === "undefined") {
        showMessage("The form could not load. Please email me directly.", false);
        return;
      }
      var button = contactForm.querySelector(".contact_button");
      if (button) button.disabled = true;
      showMessage("Sending…", true);
      window.emailjs
        .sendForm("service_b9vhgrg", "template_6f0u4a9", "#contact-form", "ImLjIYOOHkAeZtYWM")
        .then(
          function () {
            showMessage("Message sent. Thanks, I’ll be in touch soon.", true);
            contactForm.reset();
            setTimeout(function () { contactMessage.textContent = ""; }, 6000);
          },
          function () {
            showMessage("Something went wrong. Please try again or email me.", false);
          },
        )
        .then(function () {
          if (button) button.disabled = false;
        });
    });
  }

  /*=============== LIVE DEMOS TICKER ===============*/
  /* Clone the real group until half the track is wider than the viewport,
     then animate -50% -> 0 (left to right) for a seamless loop. Clones are
     aria-hidden with tabindex -1 so screen readers and Tab only meet the
     real links, while pointer taps on a visible copy still open the demo. */
  (function () {
    var ticker = document.querySelector(".live-ticker");
    if (!ticker) return;
    var viewport = ticker.querySelector(".ticker-viewport");
    var track = ticker.querySelector(".ticker-track");
    var group = track && track.querySelector(".ticker-group");
    if (!viewport || !group) return;

    function clear() {
      ticker.classList.remove("is-looping");
      Array.prototype.forEach.call(track.querySelectorAll(".ticker-clone"), function (n) { n.remove(); });
    }

    function clone() {
      var c = group.cloneNode(true);
      c.classList.add("ticker-clone");
      c.setAttribute("aria-hidden", "true");
      c.removeAttribute("aria-label");
      Array.prototype.forEach.call(c.querySelectorAll("a"), function (a) { a.setAttribute("tabindex", "-1"); });
      track.appendChild(c);
    }

    function build() {
      clear();
      if (reduceMotion.matches) return;
      var w = group.getBoundingClientRect().width;
      if (!w) return;
      var perHalf = Math.max(1, Math.ceil(viewport.clientWidth / w));
      for (var i = 1; i < perHalf * 2; i++) clone();
      /* constant speed of ~45px/s whatever the screen width */
      ticker.style.setProperty("--ticker-duration", Math.round((w * perHalf) / 45) + "s");
      ticker.classList.add("is-looping");
    }

    build();
    var lastW = viewport.clientWidth, t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (viewport.clientWidth !== lastW) { lastW = viewport.clientWidth; build(); }
      }, 200);
    });
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  })();
})();
