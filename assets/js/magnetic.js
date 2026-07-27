/*=============== MAGNETIC BUTTONS ===============*/
/*
  Makes matched elements gently follow the cursor while hovered (a common
  "magnetic pull" hover effect), then ease back to rest on mouseleave.

  Skipped entirely on touch/coarse-pointer devices, where hover doesn't
  apply and the effect would have nothing to respond to.

  Usage (see main.js):
    import { initMagnetic } from './magnetic.js';
    const magnetic = initMagnetic('.projects_button, .contact_button');
    // magnetic.destroy() to tear down if ever needed
*/

export function initMagnetic(selector, options = {}) {
  const { strength = 0.4, maxOffset = 18 } = options;

  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!supportsHover) {
    return { destroy() {} };
  }

  const elements = Array.from(document.querySelectorAll(selector));

  const bound = elements.map(el => {
    const onMouseMove = e => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-maxOffset, Math.min(maxOffset, relX * strength));
      const y = Math.max(-maxOffset, Math.min(maxOffset, relY * strength));
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onMouseLeave = () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    };

    el.classList.add('magnetic');
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return { el, onMouseMove, onMouseLeave };
  });

  const destroy = () => {
    bound.forEach(({ el, onMouseMove, onMouseLeave }) => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.classList.remove('magnetic');
      el.style.transform = '';
    });
  };

  return { destroy };
}