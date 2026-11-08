/* Core interactions. Classic script (not a module) so everything here also
   works when index.html is opened straight from disk (file://). */
(function () {
  "use strict";

  var body = document.body;
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Theme is one class on body. graphite.css maps it to the colour tokens,
     so this function never sets a colour itself. The icon and aria-pressed
     are derived from the class on every sync: dark is the resting state
     (pressed is false) because that is what the page ships with, and light
     is the pressed state. */
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
      // Sticky for the rest of the visit. First paint uses the short hex
      // load-in; every later return to dark uses the full neon start-up.
      body.classList.add("theme-switched");
      body.classList.toggle(DARK);
      var isDark = body.classList.contains(DARK);
      try {
        localStorage.setItem("selected-theme", isDark ? "dark" : "light");
        // The button does not read this back. syncThemeButton sets the icon
        // from the class, so a stored icon name cannot disagree with the page.
        localStorage.setItem("selected-icon", isDark ? "ri-sun-line" : "ri-moon-line");
      } catch (e) {} /* storage can throw; the class is already toggled */
      syncThemeButton();
    });
  }

  /* The rings replay when the portrait scrolls back into view. Dark mode
     runs the long neon ignite (the same one a theme switch uses). Both
     themes play one colour-split glitch burst. I wait until the portrait
     is at least 55% visible, and I will not replay more than once every
     4 seconds. hexSeen starts null so the first observation only records
     whether it is in view; a replay needs a later trip from below 55%
     back up. The load-in animation already covered the first paint.
     Reduced motion and a hidden tab skip it. The stylesheet also hides
     the glitch under prefers-reduced-motion; this guard means I do not
     add the class in the first place. */
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
    void heroVisual.offsetWidth; /* flush: animation none for one frame, or the keyframes continue instead of starting at 0 */
    heroVisual.classList.remove("hex-reset");
    heroVisual.classList.add("hex-replay");
    // Longer than the 1.4s ignite and the 1.2s burst (plus its 0.1s delay).
    // Stripping .hex-replay hands the rings back to the idle 7s glitch loop.
    // Leave the class on and that one-shot stays the winning animation.
    hexTimer = window.setTimeout(clearHexReplay, 1700);
  }
  if (heroVisual && "IntersectionObserver" in window) {
    var hexSeen = null; /* null until the first callback, so load does not count as a replay */
    new IntersectionObserver(
      function (entries) {
        var visible = entries[entries.length - 1].intersectionRatio >= 0.55;
        if (visible && hexSeen === false) replayHex();
        hexSeen = visible;
      },
      { threshold: [0, 0.55] },
    ).observe(heroVisual);
  }
  // A theme toggle has its own ignite. Cancel a scroll replay and start
  // the 4s cooldown so the two bursts do not stack.
  if (themeButton) themeButton.addEventListener("click", function () { clearHexReplay(); hexLast = Date.now(); });

  /* The contour animation is light-theme only, and I do not fetch it until
     that theme is actually showing and motion is allowed. Dark mode, reduced
     motion, no WebGL2, or data-saver keep the static contour tile from CSS.
     The click handler below is what picks it up if the visitor switches
     to light after load. */
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
    // After load, then in an idle callback when the browser offers one,
    // so the shader does not compete with first paint.
    var go = function () { (window.requestIdleCallback || setTimeout)(loadTopoFlow, { timeout: 1500 }); };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  }
  loadTopoFlowWhenIdle();
  if (themeButton) themeButton.addEventListener("click", loadTopoFlow);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", loadTopoFlow);

  /* Opening moves focus to the close button. Closing gives it back to the
     toggle only when focus is still inside the menu, so I do not pull it
     away from somewhere else. Escape uses the same path. */
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

  /* One rAF per scroll burst. The listener is passive so it never blocks
     scrolling. The header picks up its blur past 40px, the back-to-top
     past 560px. The progress bar is scrollY over (scrollHeight - innerHeight);
     I force 0 when that range is not positive, so a short page does not
     divide by zero. The nav marks the last section whose top has reached
     120px below the top of the viewport. The highlight switches a little
     before the heading hits the header, and it stays there until the next
     section reaches that same line. */
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

  /* Fade-up once, as a block enters. Reduced motion skips this whole block:
     I never add .reveal, so there is nothing to undo. (The stylesheet also
     forces .reveal visible, as a backstop.) Sibling cards wait 80ms times
     their index in the parent. The bottom rootMargin means a block has to
     clear 40px into the viewport, and 12% of it has to be showing, before
     it counts. unobserve so a scroll back up does not replay it. */
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
  var rippleSel = ".btn, .icon-btn, .tile, .scrollup, .nav_link, .ticker-link, .readmore-toggle, .layer-item";
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

  /* No API route. The site is static, so the form sends through EmailJS
     from the browser. The form is novalidate because I want my own status
     line and focus, not the browser tooltip. If the EmailJS script never
     arrived, I say so and point at the mailto instead of calling a missing
     global. The button stays disabled until the request settles, success
     or failure: the trailing then runs either way, because the error
     handler does not rethrow. */
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
        // service id, template id, form, public key. The public key is
        // meant to ship in the page; the template decides what gets emailed.
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

  /* The track starts as one real group of demo links. I clone it until the
     track is exactly two view-filling halves, then animate translate from
     -50% to 0. That distance is one identical half, so the loop has no seam,
     and the motion runs left to right. Clones are aria-hidden with
     tabindex -1: a screen reader or Tab only meets the real links, but a
     tap on a visible copy still navigates, because the anchors are real.
     Reduced motion, or a width of 0, leaves the single group and the CSS
     turns the row into a plain horizontal scroller. Duration is half-width
     over 45, so the speed stays 45px/s on any screen. A resize rebuilds
     only when the viewport width actually changed; a font swap rebuilds
     too, because that changes the measured group width. */
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
      // Half the track is perHalf groups wide. Dividing that by 45px/s
      // keeps the speed constant when the clone count changes.
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
