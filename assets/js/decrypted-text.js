/*=============== DECRYPTED TEXT (vanilla JS port, no React/Framer Motion) ===============*/
/*
  Scrambles then reveals text character-by-character. Vanilla port of a
  React "DecryptedText" component.

  Usage (see main.js):
    import { DecryptedText, bindGroupView, bindGroupHover } from './decrypted-text.js';

    // Single element, auto-triggers itself:
    new DecryptedText(el, { animateOn: 'view' });   // once, when scrolled into view
    new DecryptedText(el, { animateOn: 'hover' });  // on mouse enter/leave

    // Several elements (e.g. multi-line text split across <span>s) that
    // should all animate together, triggered by hovering/viewing some
    // other element (e.g. the parent card):
    const instances = [...els].map(el => new DecryptedText(el, { animateOn: 'manual' }));
    bindGroupHover(cardEl, instances);
    bindGroupView(sectionEl, instances);

  IMPORTANT: each target element must contain only plain text (no nested
  elements) — its children get replaced with per-character <span>s.
*/

const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';

export class DecryptedText {
  constructor(el, options = {}) {
    this.el = el;
    this.text = options.text ?? el.textContent;
    this.speed = options.speed ?? 50;
    this.maxIterations = options.maxIterations ?? 10;
    this.sequential = options.sequential ?? true;
    this.revealDirection = options.revealDirection ?? 'start'; // 'start' | 'end' | 'center'
    this.useOriginalCharsOnly = options.useOriginalCharsOnly ?? false;
    this.characters = options.characters ?? DEFAULT_CHARACTERS;
    this.className = options.className ?? 'decrypt-revealed';
    this.encryptedClassName = options.encryptedClassName ?? 'decrypt-encrypted';
    // 'hover' | 'view' | 'manual' — manual means the caller drives start()/reset()
    this.animateOn = options.animateOn ?? 'manual';
    this.threshold = options.threshold ?? 0.1;

    this.revealed = new Set();
    this.isAnimating = false;
    this.hasAnimated = false;
    this.intervalId = null;

    this._buildDom();
    this._bindEvents();
  }

  get availableChars() {
    if (this.useOriginalCharsOnly) {
      const unique = Array.from(new Set(this.text.split(''))).filter(c => c !== ' ');
      return unique.length ? unique : this.characters.split('');
    }
    return this.characters.split('');
  }

  _buildDom() {
    this.el.textContent = '';
    this.el.setAttribute('aria-label', this.text);
    this.spans = this.text.split('').map(char => {
      const span = document.createElement('span');
      span.textContent = char;
      span.className = this.className;
      this.el.appendChild(span);
      return span;
    });

    // Lock every non-space character's box to its natural rendered width.
    // Random substitute characters (e.g. "i" vs "W") have different glyph
    // widths, so without this the line reflows on every scramble tick,
    // which is what caused the jitter. Space spans are left as plain
    // inline text so normal line-wrapping at those points still works.
    this.spans.forEach((span, i) => {
      if (this.text[i] === ' ') return;
      const width = span.getBoundingClientRect().width;
      span.style.display = 'inline-block';
      span.style.width = `${width}px`;
      span.style.textAlign = 'center';
    });
  }

  _randomChar() {
    const chars = this.availableChars;
    return chars[Math.floor(Math.random() * chars.length)];
  }

  _getNextIndex() {
    const len = this.text.length;
    switch (this.revealDirection) {
      case 'end':
        return len - 1 - this.revealed.size;
      case 'center': {
        const middle = Math.floor(len / 2);
        const offset = Math.floor(this.revealed.size / 2);
        const next = this.revealed.size % 2 === 0 ? middle + offset : middle - offset - 1;
        if (next >= 0 && next < len && !this.revealed.has(next)) return next;
        for (let i = 0; i < len; i++) if (!this.revealed.has(i)) return i;
        return 0;
      }
      case 'start':
      default:
        return this.revealed.size;
    }
  }

  _renderFrame() {
    this.spans.forEach((span, i) => {
      if (this.text[i] === ' ') return;
      if (this.revealed.has(i)) {
        span.textContent = this.text[i];
        span.className = this.className;
      } else {
        span.textContent = this._randomChar();
        span.className = this.encryptedClassName;
      }
    });
  }

  /** Scramble, then reveal character-by-character (or in maxIterations passes if non-sequential). */
  start() {
    if (this.isAnimating) return;
    clearInterval(this.intervalId);
    this.revealed = new Set();
    this.isAnimating = true;
    let iteration = 0;

    this.intervalId = setInterval(() => {
      if (this.sequential) {
        if (this.revealed.size < this.text.length) {
          this.revealed.add(this._getNextIndex());
          this._renderFrame();
        } else {
          this._finish();
        }
      } else {
        this._renderFrame();
        iteration++;
        if (iteration >= this.maxIterations) this._finish();
      }
    }, this.speed);
  }

  _finish() {
    clearInterval(this.intervalId);
    this.isAnimating = false;
    for (let i = 0; i < this.text.length; i++) this.revealed.add(i);
    this.spans.forEach((span, i) => {
      span.textContent = this.text[i];
      span.className = this.className;
    });
  }

  /** Immediately snap back to plain, unscrambled text. */
  reset() {
    clearInterval(this.intervalId);
    this.isAnimating = false;
    this.revealed = new Set();
    this.spans.forEach((span, i) => {
      span.textContent = this.text[i];
      span.className = this.className;
    });
  }

  _bindEvents() {
    if (this.animateOn === 'hover') {
      this.el.addEventListener('mouseenter', () => this.start());
      this.el.addEventListener('mouseleave', () => this.reset());
    } else if (this.animateOn === 'view') {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.start();
            this.hasAnimated = true;
            observer.unobserve(this.el);
          }
        });
      }, { threshold: this.threshold });
      observer.observe(this.el);
    }
    // 'manual': caller drives start()/reset() directly — see bindGroupHover/bindGroupView below.
  }
}

/** Bind a group of DecryptedText instances to fire together on hover of `triggerEl`. */
export function bindGroupHover(triggerEl, instances) {
  triggerEl.addEventListener('mouseenter', () => instances.forEach(i => i.start()));
  triggerEl.addEventListener('mouseleave', () => instances.forEach(i => i.reset()));
}

/** Bind a group of DecryptedText instances to fire together once, when `triggerEl` scrolls into view. */
export function bindGroupView(triggerEl, instances, threshold = 0.1) {
  let done = false;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !done) {
        instances.forEach(i => i.start());
        done = true;
        observer.unobserve(triggerEl);
      }
    });
  }, { threshold });
  observer.observe(triggerEl);
}