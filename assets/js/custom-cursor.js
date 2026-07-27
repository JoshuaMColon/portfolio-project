/*=============== CUSTOM CURSOR ===============*/
/*
  Adds a two-part custom cursor (a small dot that tracks the pointer
  directly, plus a larger ring that eases toward it with a slight lag) that
  grows and changes color when hovering interactive elements.

  Skipped entirely on touch/coarse-pointer devices, where a synthetic
  cursor doesn't make sense and could otherwise interfere with tapping.

  Usage (see main.js):
    import { initCustomCursor } from './custom-cursor.js';
    const cursor = initCustomCursor({ hoverSelector: 'a, button' });
    // cursor.destroy() to tear down if ever needed
*/

export function initCustomCursor(options = {}) {
  const {
    hoverSelector = 'a, button, input, textarea, .nav_link, .change-theme, .nav_toggle, .nav_close, .scrollup',
    dampening = 0.2
  } = options;

  const supportsCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!supportsCustomCursor) {
    return { destroy() {} };
  }

  const dot = document.createElement('div');
  dot.className = 'custom-cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'custom-cursor-ring';
  document.body.append(dot, ring);
  document.body.classList.add('custom-cursor-active');

  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { x: target.x, y: target.y };
  let dotScaleTarget = 1;
  let dotScaleCurrent = 1;
  let ringScaleTarget = 1;
  let ringScaleCurrent = 1;
  let active = true;
  let raf = 0;

  const onMove = e => {
    target.x = e.clientX;
    target.y = e.clientY;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const onEnter = () => {
    dotScaleTarget = 0.4;
    ringScaleTarget = 1.8;
    dot.classList.add('is-hovering');
    ring.classList.add('is-hovering');
  };
  const onLeave = () => {
    dotScaleTarget = 1;
    ringScaleTarget = 1;
    dot.classList.remove('is-hovering');
    ring.classList.remove('is-hovering');
  };

  const hoverTargets = Array.from(document.querySelectorAll(hoverSelector));
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
  });

  const onWindowLeave = () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  };
  const onWindowEnter = () => {
    dot.style.opacity = '';
    ring.style.opacity = '';
  };
  document.addEventListener('mouseleave', onWindowLeave);
  document.addEventListener('mouseenter', onWindowEnter);

  const loop = () => {
    if (!active) return;

    // The dot tracks the pointer instantly (no easing); the ring eases
    // toward it with a slight lag. Scale is eased toward its target too,
    // for a smooth pop on hover in/out.
    ringPos.x += (target.x - ringPos.x) * dampening;
    ringPos.y += (target.y - ringPos.y) * dampening;
    dotScaleCurrent += (dotScaleTarget - dotScaleCurrent) * 0.2;
    ringScaleCurrent += (ringScaleTarget - ringScaleCurrent) * 0.2;

    // Position and scale are combined into a single transform string here
    // (rather than position via the "transform" property and scale via
    // the separate "scale" property) — mixing those two composes in a
    // fixed translate/rotate/scale/transform order that doesn't scale
    // around the position we just moved to, which is what caused the
    // dot and ring to visually pull apart on hover.
    dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) scale(${dotScaleCurrent})`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${ringScaleCurrent})`;

    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const destroy = () => {
    active = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('mouseleave', onWindowLeave);
    document.removeEventListener('mouseenter', onWindowEnter);
    hoverTargets.forEach(el => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    });
    document.body.classList.remove('custom-cursor-active');
    dot.remove();
    ring.remove();
  };

  return { destroy };
}