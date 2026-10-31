# Josh Colon — Portfolio

**Live:** https://joshuamcolon.github.io/portfolio-project/

My personal portfolio: a single-page site for hiring managers and clients that shows my full-stack projects, skills, background and a way to get in touch. It's hand-written HTML, CSS and vanilla JavaScript with no build step, styled in a dark, framed "graphite" look.

## Featured projects

The Projects section shows each app with a preview, a short description (collapsible with **Read more…**), a live-site link and a case study (problem, approach, stack, what I learned). A scrolling **Live demos** ticker links straight into the apps that have a no-sign-up demo.

| Project | Live | Code |
| --- | --- | --- |
| Blog Platform: cyber-styled blogging with realtime, notifications, search and AI related posts | [Live](https://blog-platform-one-xi.vercel.app) · [guest demo](https://blog-platform-one-xi.vercel.app/demo) | [blog-platform](https://github.com/JoshuaMColon/blog-platform) |
| Collaborative Kanban Board: realtime board with presence and live comments | [Live](https://collaborative-kanban-board-gold.vercel.app) | [collaborative-kanban-board](https://github.com/JoshuaMColon/collaborative-kanban-board) |
| Weather Dashboard: iPhone-style weather app with animated skies and synced cities | [Live](https://weather-dashboard-app-sable-three.vercel.app) · [guest demo](https://weather-dashboard-app-sable-three.vercel.app/demo) | [Weather_Dashboard_App](https://github.com/JoshuaMColon/Weather_Dashboard_App) |
| XPlan: gamified task manager with XP, levels, natural-language quick-add and realtime sync | [Live](https://xplan-sand.vercel.app) · [guest demo](https://xplan-sand.vercel.app/demo) | [task-manager](https://github.com/JoshuaMColon/task-manager) |
| Recall Lab: Python exam practice graded by in-browser Python, with SM-2 spaced repetition, a mastery map and a timed mock OA | [Live](https://recall-lab-ruby.vercel.app) · [guest demo](https://recall-lab-ruby.vercel.app/demo) | [recall-lab](https://github.com/JoshuaMColon/recall-lab) |

## Features

- **Graphite design:** thin borders, corner marks, bento grids and soft glows over a layered, CSS-only background (graphite gradient, dot grid, slow drifting light beams, film grain and a hero spotlight), plus a neon hex frame around the portrait that flickers on when you switch to dark mode.
- **Projects showcase:** an interactive 3D project spiral linked to tabs, a detail panel whose description clamps to two lines with a fade and only shows **Read more… / Show less** when the text overflows, and an expandable case study per project.
- **Live demos ticker:** a left-to-right, constant-speed marquee of the live demos.
- **Theme:** dark/light toggle remembered between visits and applied before first paint (no flash).
- **Feedback everywhere:** hover spotlight, press states and tap ripples for mouse, touch, pen and keyboard (Enter/Space), plus scroll-reveal animations, a scroll-progress bar, sticky blurred header and scroll-to-top.
- **Optional effects** (when served over http(s)): decrypted-text bio reveal, a custom cursor and magnetic buttons.
- **Accessible:** skip link, visible focus states, labelled form fields, ARIA tabs and `aria-expanded` toggles, tooltips on icon-only buttons (hover or keyboard focus, `role="tooltip"` + `aria-describedby`, Esc to close, never from a tap), and `prefers-reduced-motion` support.
- **SEO and sharing:** meta description, canonical URL, Open Graph/Twitter cards with a 1200×630 image, `Person` JSON-LD, `robots.txt` and `sitemap.xml`.
- **Contact:** a form sent through EmailJS, plus email, LinkedIn, GitHub and a downloadable resume (PDF).

## Tech stack

- HTML5, CSS3 and vanilla JavaScript (no framework, no build step)
- Geist and Geist Mono (Google Fonts), Remix Icon
- EmailJS for the contact form
- GitHub Pages hosting

## Running it locally

No install is needed. Core interactions in `site.js` work even when `index.html` is opened straight from disk. The optional effects in `main.js` load as an ES module, which browsers block on `file://`, so serve the folder to see everything:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment

GitHub Pages publishes the root of the `main` branch, so every merge to `main` goes live at https://joshuamcolon.github.io/portfolio-project/. When you change CSS or JS, bump the `?v=` query on its `<link>`/`<script>` tag in `index.html` so browsers fetch the new file.

## Project structure

```text
index.html                    The whole page: hero, skills, projects, qualifications, contact
robots.txt, sitemap.xml       Crawl rules and sitemap
assets/
  css/graphite.css            Theme, layout, background layers and responsive styles
  js/site.js                  Core interactions: menu, theme, scroll, reveal, tap feedback, ticker, contact form
  js/project-showcase.js      Project data, 3D spiral, tabs, read-more toggle and case studies
  js/main.js                  Optional effects module (needs http/https)
  js/decrypted-text.js, custom-cursor.js, magnetic.js   Effects used by main.js
  img/                        Project previews (WebP + JPEG/PNG fallbacks), icons, Open Graph image
  docs/                       Resume PDF
```

## Contact

- Email: [joshua.m.colon2@gmail.com](mailto:joshua.m.colon2@gmail.com)
- LinkedIn: [joshua-colon2](https://www.linkedin.com/in/joshua-colon2)
- GitHub: [JoshuaMColon](https://github.com/JoshuaMColon)
