/*=============== BACKGROUNDS (theme-dependent) ===============*/
/* main.js is now loaded with <script type="module">, which is required
   for these imports to work. */
import { initFloatingLines } from "./floating-lines.js";
import { initLightRays } from "./light-rays.js";

/*=============== DECRYPTED TEXT ===============*/
import {
  DecryptedText,
  bindGroupHover,
  bindGroupView,
} from "./decrypted-text.js";

/*=============== CUSTOM CURSOR ===============*/
import { initCustomCursor } from "./custom-cursor.js";

/*=============== MAGNETIC BUTTONS ===============*/
import { initMagnetic } from "./magnetic.js";

const floatingLinesBg = document.getElementById("floating-lines-bg");
const lightRaysBg = document.getElementById("light-rays-bg");

let floatingLinesInstance = null;
let lightRaysInstance = null;

function startDarkModeBackground() {
  if (lightRaysBg && !lightRaysInstance) {
    lightRaysInstance = initLightRays(lightRaysBg, {
      raysOrigin: "top-center",
      raysColor: "#ffffff",
      raysSpeed: 1,
      lightSpread: 0.5,
      rayLength: 3,
      followMouse: true,
      mouseInfluence: 0.1,
      noiseAmount: 0,
      distortion: 0,
      pulsating: false,
      fadeDistance: 1,
      saturation: 1,
    });
  }
}

function stopDarkModeBackground() {
  if (lightRaysInstance) {
    lightRaysInstance.destroy();
    lightRaysInstance = null;
  }
}

function startLightModeBackground() {
  if (floatingLinesBg && !floatingLinesInstance) {
    floatingLinesInstance = initFloatingLines(floatingLinesBg, {
      enabledWaves: ["top", "middle", "bottom"],
      lineCount: 12,
      lineDistance: 7,
      bendRadius: 8,
      bendStrength: -2,
      interactive: true,
      parallax: true,
      animationSpeed: 1,
      // The requested gradientStart/gradientMid/gradientEnd props aren't
      // actually read by this component — it takes a single
      // "linesGradient" array instead, so the same three colors are
      // combined into that here.
      linesGradient: ["#f72585", "#22b8f0", "#ffd166"],
    });
  }
}

function stopLightModeBackground() {
  if (floatingLinesInstance) {
    floatingLinesInstance.destroy();
    floatingLinesInstance = null;
  }
}

/* Switches the running background to match the theme currently applied to
   <body>. Called once below (after the saved theme preference is applied)
   and again every time the theme toggle button is clicked. */
function applyBackgroundForTheme() {
  const isDark = document.body.classList.contains("dark-theme");
  if (isDark) {
    stopLightModeBackground();
    startDarkModeBackground();
  } else {
    stopDarkModeBackground();
    startLightModeBackground();
  }
}

/*--- Biography text: decrypt once when scrolled into view ---*/
const bioText = document.getElementById("bio-text");
if (bioText) {
  new DecryptedText(bioText, {
    animateOn: "view",
    sequential: true,
    revealDirection: "start",
    speed: 30,
  });
}

/*--- Home "Services" list: same treatment, all lines reveal together ---*/
const servicesText = document.getElementById("services-text");
if (servicesText) {
  const serviceLines = Array.from(
    servicesText.querySelectorAll(".decrypt-line"),
  ).map(
    (line) =>
      new DecryptedText(line, {
        animateOn: "manual",
        sequential: true,
        speed: 30,
      }),
  );
  bindGroupView(servicesText, serviceLines);
}

/*--- Services cards: decrypt title + description while hovering the card ---*/
document.querySelectorAll(".services_card").forEach((card) => {
  const titleLines = Array.from(
    card.querySelectorAll(".services_title .decrypt-line"),
  ).map(
    (line) =>
      new DecryptedText(line, {
        animateOn: "manual",
        sequential: true,
        speed: 25,
      }),
  );
  const description = card.querySelector(".services_description");
  const instances = [...titleLines];
  if (description) {
    instances.push(
      new DecryptedText(description, {
        animateOn: "manual",
        sequential: true,
        speed: 15,
        revealDirection: "start",
      }),
    );
  }
  bindGroupHover(card, instances);
});

/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById("nav-menu"),
  navToggle = document.getElementById("nav-toggle"),
  navClose = document.getElementById("nav-close");

/*======= MENU SHOW =======*/
/* Validate if constant exists */
if (navToggle) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.add("show-menu");
  });
}

/*======= MENU HIDDEN ======*/
/* Validate if constant exists */
if (navClose) {
  navClose.addEventListener("click", () => {
    navMenu.classList.remove("show-menu");
  });
}

/*=============== REMOVE MENU MOBILE ===============*/
const navLink = document.querySelectorAll(".nav_link");

const linkAction = () => {
  const navMenu = document.getElementById("nav-menu");
  // When we click on each nav_link, we remove the show-menu class
  navMenu.classList.remove("show-menu");
};

navLink.forEach((n) => n.addEventListener("click", linkAction));

/*=============== SWIPER PROJECTS ===============*/
function initSwiper() {
  return new Swiper(".projects_container", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    coverflowEffect: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
    breakpoints: {
      320: { coverflowEffect: { rotate: 30, depth: 50 } },
      768: { coverflowEffect: { rotate: 40, depth: 75 } },
      1024: { coverflowEffect: { rotate: 50, depth: 100 } },
    },
    keyboard: { enabled: true },
    pagination: { el: ".swiper-pagination", clickable: true },
  });
}

let swiperProjects = null;
if (document.querySelector(".projects_container")) {
  swiperProjects = initSwiper();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      swiperProjects.destroy(true, true);
      swiperProjects = initSwiper();
    }, 250);
  });
}

/*=============== SWIPER TESTIMONIAL ===============*/
if (document.querySelector(".testimonial_container")) {
  new Swiper(".testimonial_container", {
    grabCursor: true,
    pagination: {
      el: ".swiper-pagination",
      dynamicBullets: true,
      clickable: true,
    },
  });
}

/*=============== EMAIL JS ===============*/
const contactForm = document.getElementById("contact-form"),
  contactName = document.getElementById("contact-name"),
  contactEmail = document.getElementById("contact-email"),
  contactProject = document.getElementById("contact-project"),
  contactMessage = document.getElementById("contact-message");

const sendEmail = (e) => {
  e.preventDefault();

  // Check if the field has a value
  if (
    contactName.value === "" ||
    contactEmail.value === "" ||
    contactProject.value === ""
  ) {
    // Add and remove color
    contactMessage.classList.remove("color-blue");
    contactMessage.classList.add("color-red");

    // Show message
    contactMessage.textContent = "Write all the input fields 📧";
  } else {
    // serviceID - templateID - #form - publicKey
    emailjs
      .sendForm(
        "service_b9vhgrg",
        "template_6f0u4a9",
        "#contact-form",
        "ImLjIYOOHkAeZtYWM",
      )
      .then(
        () => {
          // Show message and color
          contactMessage.classList.add("color-blue");
          contactMessage.textContent = "Message sent ✅";

          // Remove message after five seconds
          setTimeout(() => {
            contactMessage.textContent = "";
          }, 5000);
        },
        (error) => {
          alert("OOPS! SOMETHING HAS FAILED...", error);
        },
      );

    // To clear the input field
    contactName.value = "";
    contactEmail.value = "";
    contactProject.value = "";
  }
};
contactForm.addEventListener("submit", sendEmail);

/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/
const sections = document.querySelectorAll("section[id]");

const scrollActive = () => {
  const scrollY = window.pageYOffset;

  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight,
      sectionTop = current.offsetTop - 58,
      sectionId = current.getAttribute("id"),
      sectionsClass = document.querySelector(
        ".nav_menu a[href*=" + sectionId + "]",
      );

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      sectionsClass.classList.add("active-link");
    } else {
      sectionsClass.classList.remove("active-link");
    }
  });
};
window.addEventListener("scroll", scrollActive);

/*=============== SHOW SCROLL UP ===============*/
const scrollUp = () => {
  const scrollUp = document.getElementById("scroll-up");
  // When the scroll is higher than 350 viewport height, add the show-scroll class to the a tag with the scrollup
  window.scrollY >= 350
    ? scrollUp.classList.add("show-scroll")
    : scrollUp.classList.remove("show-scroll");
};
window.addEventListener("scroll", scrollUp);

/*=============== DARK LIGHT THEME ===============*/
const themeButton = document.getElementById("theme-button");
const themeIcon = themeButton ? themeButton.querySelector("i") : null;
const darkTheme = "dark-theme";
const iconTheme = "ri-sun-line";

const setThemeIcon = (isDark) => {
  if (!themeIcon) return;
  themeIcon.classList.remove("ri-sun-line", "ri-moon-line");
  themeIcon.classList.add(isDark ? "ri-sun-line" : "ri-moon-line");
};

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () =>
  document.body.classList.contains(darkTheme) ? "dark" : "light";
const getCurrentIcon = () =>
  themeIcon && themeIcon.classList.contains("ri-sun-line")
    ? "ri-sun-line"
    : "ri-moon-line";

// We validate if the user previously chose a topic
if (selectedTheme) {
  document.body.classList[selectedTheme === "dark" ? "add" : "remove"](
    darkTheme,
  );
  if (selectedIcon) {
    setThemeIcon(selectedIcon === "ri-sun-line");
  }
}

// Start whichever background matches the theme now applied above (this must
// run after the block above, not before, so it reads the correct class).
applyBackgroundForTheme();
if (themeIcon) {
  setThemeIcon(document.body.classList.contains(darkTheme));
}

// Activate / deactivate the theme manually with the button
if (themeButton) {
  themeButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle(darkTheme);
    setThemeIcon(isDark);
    localStorage.setItem("selected-theme", isDark ? "dark" : "light");
    localStorage.setItem("selected-icon", getCurrentIcon());
    applyBackgroundForTheme();
  });
}

/*=============== CHANGE BACKGROUND HEADER ===============*/
const scrollHeader = () => {
  const header = document.getElementById("header");
  // When the scroll is greater than 50 viewport height, add the scroll-header class to the header tag
  window.scrollY >= 50
    ? header.classList.add("bg-header")
    : header.classList.remove("bg-header");
};
window.addEventListener("scroll", scrollHeader);

/*=============== PAGE SCROLL MOTION ===============*/
const scrollProgress = document.getElementById("scroll-progress");
const pageSections = Array.from(document.querySelectorAll("main > section"));
const scrollTiltElements = Array.from(
  document.querySelectorAll(".offer-card, .project-gallery, .skill-stack"),
);
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    { threshold: 0.12 },
  );

  pageSections.forEach((section) => revealObserver.observe(section));
}

let scrollFrame = null;
const updateScrollMotion = () => {
  scrollFrame = null;
  const documentHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress = documentHeight > 0 ? window.scrollY / documentHeight : 0;

  if (scrollProgress) {
    scrollProgress.style.transform = `scaleX(${progress})`;
  }

  pageSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const distanceFromCenter =
      (rect.top + rect.height / 2 - window.innerHeight / 2) /
      window.innerHeight;
    section.style.setProperty(
      "--scroll-depth",
      Math.max(-1, Math.min(1, distanceFromCenter)),
    );
  });

  scrollTiltElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const verticalOffset =
      (rect.top + rect.height / 2 - window.innerHeight / 2) /
      window.innerHeight;
    const horizontalOffset =
      (rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth;
    const clamp = (value) => Math.max(-1, Math.min(1, value));

    element.style.setProperty(
      "--scroll-tilt-x",
      `${clamp(verticalOffset) * -12}deg`,
    );
    element.style.setProperty(
      "--scroll-tilt-y",
      `${clamp(horizontalOffset) * 16}deg`,
    );
    element.style.setProperty(
      "--scroll-spin",
      `${clamp(verticalOffset) * 180}deg`,
    );
  });
};

const requestScrollMotion = () => {
  if (!scrollFrame)
    scrollFrame = window.requestAnimationFrame(updateScrollMotion);
};

window.addEventListener("scroll", requestScrollMotion, { passive: true });
window.addEventListener("resize", requestScrollMotion);
requestScrollMotion();

/*=============== SCROLL REVEAL ANIMATION ===============*/
const sr = ScrollReveal({
  origin: "top",
  distance: "60px",
  duration: 2500,
  delay: 400,
  reset: true /* Animations repeat */,
});

sr.reveal(
  ".home_data, .projects_container, .testimonial_container, .footer_container",
);
sr.reveal(".home_info div", { delay: 600, origin: "bottom", interval: 100 });
sr.reveal(".skills_content:nth-child(1), .contact_content:nth-child(1)", {
  origin: "left",
});
sr.reveal(".skills_content:nth-child(2), .contact_content:nth-child(2)", {
  origin: "right",
});
sr.reveal(".qualification_content, .services_card", { interval: 100 });

/*=============== FLIPPING SKILL CARDS ===============*/
document.querySelectorAll(".skill-card").forEach((card) => {
  const visual = card.querySelector(".skill-visual");
  const title = card.querySelector("h3");
  const description = card.querySelector("p");
  if (!visual || !title || !description) return;

  const inner = document.createElement("div");
  const front = document.createElement("div");
  const back = document.createElement("div");
  inner.className = "skill-card-inner";
  front.className = "skill-card-front";
  back.className = "skill-card-back";

  front.append(visual);
  back.append(title, description);
  inner.append(front, back);
  card.replaceChildren(inner);
  card.tabIndex = 0;
  card.setAttribute(
    "aria-label",
    `${title.textContent.trim()}: ${description.textContent.trim()}`,
  );
});

/*=============== CUSTOM CURSOR ===============*/
initCustomCursor();

/*=============== MAGNETIC BUTTONS ===============*/
/* Covers the resume link, project "View Project" links, certification
   links, and the contact section's messenger/submit buttons — anything
   using .projects_button or .contact_button. */
initMagnetic(".projects_button, .contact_button");
