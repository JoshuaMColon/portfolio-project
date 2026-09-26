const projectSpiral = document.getElementById("project-spiral");
const projectTabs = Array.from(document.querySelectorAll(".project-tab"));
const projectStage = document.querySelector(".project-stage");
const projectSection = document.getElementById("projects");
const projectDetailType = document.getElementById("project-detail-type");
const projectDetailTitle = document.getElementById("project-detail-title");
const projectDetailDescription = document.getElementById(
  "project-detail-description",
);
const projectDetailLink = document.getElementById("project-detail-link");

const projects = {
  blog: {
    type: "Web app",
    title: "Blog Platform",
    image: "assets/img/Blog.png",
    imageAlt: "Blog Platform preview",
    accent: "#7dd3fc",
    description:
      "Editorial experience with a clean writing flow and product-grade content structure.",
    url: "https://blog-platform-one-xi.vercel.app/",
  },
  kanban: {
    type: "Productivity tool",
    title: "Kanban Board",
    image: "assets/img/kanaban-board.png",
    imageAlt: "Kanban Board preview",
    accent: "#f7b36a",
    description:
      "Task orchestration interface built for team velocity, focus, and simple visual flow.",
    url: "https://collaborative-kanban-board-q5pl4n6x0-joshuamcolons-projects.vercel.app/",
  },
  weather: {
    type: "Dashboard",
    title: "Weather Dashboard",
    image: "assets/img/Weather.png",
    imageAlt: "Weather Dashboard preview",
    accent: "#54e1c1",
    description:
      "Data-rich UI with readable summaries and a clear, branded experience.",
    url: "https://joshuamcolon.github.io/Weather_Dashboard_App/",
  },
};

function selectProject(tab) {
  const project = projects[tab.dataset.project];
  if (!project) return;

  selectedProjectIndex = projectTabs.indexOf(tab);
  if (projectStage) {
    projectStage.style.setProperty("--project-accent", project.accent);
  }
  projectTabs.forEach((projectTab) => {
    const isActive = projectTab === tab;
    projectTab.classList.toggle("active", isActive);
    projectTab.setAttribute("aria-selected", String(isActive));
  });
  projectSpiral?.querySelectorAll(".infinite-spiral__item").forEach((item) => {
    item.classList.toggle(
      "is-selected",
      item.dataset.project === tab.dataset.project,
    );
  });

  projectDetailType.textContent = project.type;
  projectDetailTitle.textContent = project.title;
  projectDetailDescription.textContent = project.description;
  projectDetailLink.href = project.url;
}

let selectedProjectIndex = 0;

function initializeProjectSpiral() {
  if (!projectSpiral) return;

  const settings = {
    speed: 0.55,
    radius: 170,
    cardWidth: 160,
    cardHeight: 116,
    verticalSpacing: 60,
    perspective: 1000,
    cardsPerTurn: 7,
    edgeFade: 0.3,
    edgeBlur: 6,
    centerScale: 1.2,
    grayscale: 1,
  };
  const projectKeys = Object.keys(projects);
  const spiralItems = [];

  projectSpiral.style.setProperty(
    "--spiral-card-width",
    `${settings.cardWidth}px`,
  );
  projectSpiral.style.setProperty(
    "--spiral-card-height",
    `${settings.cardHeight}px`,
  );
  projectSpiral.style.setProperty("--spiral-card-radius", "10px");
  projectSpiral.style.perspective = `${settings.perspective}px`;

  projectKeys.concat(projectKeys, projectKeys).forEach((projectKey) => {
    const project = projects[projectKey];
    const item = document.createElement("div");
    const button = document.createElement("button");
    const image = document.createElement("img");
    const label = document.createElement("span");

    item.className = "infinite-spiral__item";
    item.dataset.project = projectKey;
    item.setAttribute("role", "listitem");
    button.className = "infinite-spiral__button";
    button.type = "button";
    button.setAttribute("aria-label", `Select ${project.title} project`);
    image.className = "infinite-spiral__image";
    image.src = project.image;
    image.alt = project.imageAlt;
    image.draggable = false;
    image.style.filter = `grayscale(${settings.grayscale})`;
    label.className = "infinite-spiral__label";
    label.textContent = project.title;

    button.append(image, label);
    item.append(button);
    projectSpiral.append(item);
    spiralItems.push(item);
  });

  let progress = 0;
  let previousTime = performance.now();
  let visible = true;
  let paused = false;
  let frameId;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const resizeObserver = new ResizeObserver(layoutSpiral);
  resizeObserver.observe(projectSpiral);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  intersectionObserver.observe(projectSpiral);

  function layoutSpiral() {
    const bounds = projectSpiral.getBoundingClientRect();
    const fit = Math.min(
      1,
      bounds.width / (settings.cardWidth * 2.8),
      bounds.height / (settings.cardHeight * 2.35),
    );
    const radius =
      Math.min(settings.radius, Math.max(72, bounds.width * 0.36)) * fit;
    const fadeStart = Math.min(Math.max(1 - settings.edgeFade, 0), 0.98);
    const half = spiralItems.length / 2;

    spiralItems.forEach((item, index) => {
      let offset = index - progress;
      offset =
        ((((offset + half) % spiralItems.length) + spiralItems.length) %
          spiralItems.length) -
        half;

      const edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1);
      const opacity = 1 - smoothstep(fadeStart, 1, edge);
      const focus =
        1 - Math.min(Math.abs(offset) / (settings.cardsPerTurn * 0.65), 1);
      const scale = (1 + (settings.centerScale - 1) * focus) * fit;
      const angle = offset * (360 / settings.cardsPerTurn);
      const radians = (angle * Math.PI) / 180;
      const x = Math.sin(radians) * radius;
      const z = Math.cos(radians) * radius;
      const depthScale = Math.min(
        Math.max(settings.perspective / (settings.perspective - z), 0.72),
        1.45,
      );
      const depth = (z / Math.max(radius, 1) + 1) / 2;
      const blur = settings.edgeBlur * smoothstep(0.35, 1, edge);

      item.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${offset * settings.verticalSpacing * fit}px, 0) scale(${scale * depthScale})`;
      item.style.opacity = opacity.toFixed(3);
      item.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : "none";
      item.style.zIndex = String(Math.round(depth * 1000) + index);
      item.style.pointerEvents = opacity > 0.25 ? "auto" : "none";
    });
  }

  function smoothstep(min, max, value) {
    const amount = Math.min(Math.max((value - min) / (max - min || 1), 0), 1);
    return amount * amount * (3 - 2 * amount);
  }

  function animate(time) {
    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    if (visible && !paused && !reducedMotion.matches) {
      progress = (progress + settings.speed * delta) % spiralItems.length;
    }
    layoutSpiral();
    if (!reducedMotion.matches) frameId = requestAnimationFrame(animate);
  }

  projectSpiral.addEventListener("pointerenter", () => {
    paused = true;
  });
  projectSpiral.addEventListener("pointerleave", () => {
    paused = false;
  });
  projectSpiral.addEventListener("focusin", () => {
    paused = true;
  });
  projectSpiral.addEventListener("focusout", (event) => {
    if (!projectSpiral.contains(event.relatedTarget)) paused = false;
  });
  projectSpiral.addEventListener("click", (event) => {
    const item = event.target.closest(".infinite-spiral__item");
    if (!item) return;
    const tab = projectTabs.find(
      (projectTab) => projectTab.dataset.project === item.dataset.project,
    );
    if (tab) selectProject(tab);
  });

  layoutSpiral();
  if (!reducedMotion.matches) frameId = requestAnimationFrame(animate);
  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
  };
}

const moveProject = (direction) => {
  const nextIndex =
    (selectedProjectIndex + direction + projectTabs.length) %
    projectTabs.length;
  selectedProjectIndex = nextIndex;
  selectProject(projectTabs[nextIndex]);
};

projectTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    selectedProjectIndex = projectTabs.indexOf(tab);
    selectProject(tab);
  });
  tab.addEventListener("keydown", (event) => {
    const isForward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const isBackward = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!isForward && !isBackward) return;

    event.preventDefault();
    const currentIndex = projectTabs.indexOf(tab);
    const direction = isForward ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + projectTabs.length) % projectTabs.length;
    selectedProjectIndex = nextIndex;
    projectTabs[nextIndex].focus();
    selectProject(projectTabs[nextIndex]);
  });
});

initializeProjectSpiral();
selectProject(projectTabs[0]);

/* Hold the Projects section in place while the user reviews each project. */
if (projectSection) {
  let wheelLocked = false;

  projectSection.addEventListener(
    "wheel",
    (event) => {
      if (event.target.closest(".project-tab-description")) return;
      if (wheelLocked || Math.abs(event.deltaY) < 8) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const atFirstProject = selectedProjectIndex === 0;
      const atLastProject = selectedProjectIndex === projectTabs.length - 1;
      const canMoveWithinProjects =
        (direction > 0 && !atLastProject) || (direction < 0 && !atFirstProject);

      if (!canMoveWithinProjects) return;

      event.preventDefault();
      wheelLocked = true;
      moveProject(direction);
      window.setTimeout(() => {
        wheelLocked = false;
      }, 650);
    },
    { passive: false },
  );

  let touchStartY = 0;
  let touchHandled = false;
  projectSection.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.touches[0].clientY;
      touchHandled = false;
    },
    { passive: true },
  );
  projectSection.addEventListener(
    "touchmove",
    (event) => {
      if (touchHandled || Math.abs(event.touches[0].clientY - touchStartY) < 36)
        return;

      const direction = event.touches[0].clientY < touchStartY ? 1 : -1;
      const atFirstProject = selectedProjectIndex === 0;
      const atLastProject = selectedProjectIndex === projectTabs.length - 1;
      const canMoveWithinProjects =
        (direction > 0 && !atLastProject) || (direction < 0 && !atFirstProject);

      if (!canMoveWithinProjects) return;

      event.preventDefault();
      touchHandled = true;
      moveProject(direction);
    },
    { passive: false },
  );
}
