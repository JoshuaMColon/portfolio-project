const projectTrack = document.getElementById("project-track");
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
    accent: "#7dd3fc",
    description:
      "Editorial experience with a clean writing flow and product-grade content structure.",
    url: "https://blog-platform-one-xi.vercel.app/",
  },
  kanban: {
    type: "Productivity tool",
    title: "Kanban Board",
    accent: "#f7b36a",
    description:
      "Task orchestration interface built for team velocity, focus, and simple visual flow.",
    url: "https://collaborative-kanban-board-q5pl4n6x0-joshuamcolons-projects.vercel.app/",
  },
  weather: {
    type: "Dashboard",
    title: "Weather Dashboard",
    accent: "#54e1c1",
    description:
      "Data-rich UI with readable summaries and a clear, branded experience.",
    url: "https://joshuamcolon.github.io/Weather_Dashboard_App/",
  },
};

function selectProject(tab) {
  const project = projects[tab.dataset.project];
  const projectIndex = Number(tab.dataset.index);
  if (!project || !projectTrack) return;

  projectTrack.style.transform = `translateX(-${projectIndex * 100}%)`;
  if (projectStage) {
    projectStage.style.setProperty("--project-accent", project.accent);
  }
  projectTabs.forEach((projectTab) => {
    const isActive = projectTab === tab;
    projectTab.classList.toggle("active", isActive);
    projectTab.setAttribute("aria-selected", String(isActive));
  });

  projectDetailType.textContent = project.type;
  projectDetailTitle.textContent = project.title;
  projectDetailDescription.textContent = project.description;
  projectDetailLink.href = project.url;
}

let selectedProjectIndex = 0;
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

if (projectStage) {
  let touchStartX = 0;
  projectStage.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true },
  );
  projectStage.addEventListener(
    "touchend",
    (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 40) moveProject(distance < 0 ? 1 : -1);
    },
    { passive: true },
  );
}

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
