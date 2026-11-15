/**
 * OptionWheel — 3D Curved Circular Arc Navigation Wheel
 * Adapted from @react-bits/OptionWheel into native, dependency-free Vanilla JS
 * Preserves circular arc projection, frame-rate independent exponential smoothing,
 * touch drag, pointer capture, mouse wheel, keyboard navigation, and audio tick feedback.
 */
(function (global) {
  'use strict';

  let audioCtx = null;
  let lastTickTime = 0;

  function playTick(soundUrl, volume) {
    const now = performance.now();
    if (now - lastTickTime < 65) return;
    lastTickTime = now;

    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = Math.min(Math.max(volume, 0), 1);
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      } catch (_) {}
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.026);
      gain.gain.setValueAtTime(volume * 0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.026);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    } catch (_) {}
  }

  class OptionWheel {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) throw new Error('OptionWheel: container element not found.');

      this.items = options.items || [];
      this.onChange = options.onChange || null;
      this.onSelect = options.onSelect || null;

      this.textColor = options.textColor || '#8a99ad';
      this.activeColor = options.activeColor || '#ffffff';
      this.side = options.side || 'left';
      this.fontSize = options.fontSize || 2.4; // in rem
      this.spacing = options.spacing || 1.35;
      this.curve = options.curve !== undefined ? options.curve : 1;
      this.tilt = options.tilt !== undefined ? options.tilt : 6.2;
      this.blur = options.blur !== undefined ? options.blur : 2;
      this.fade = options.fade !== undefined ? options.fade : 0.25;
      this.minOpacity = options.minOpacity !== undefined ? options.minOpacity : 0.08;
      this.smoothing = options.smoothing !== undefined ? options.smoothing : 180;
      this.inset = options.inset !== undefined ? options.inset : 60; // in px
      this.loop = options.loop || false;
      this.draggable = options.draggable !== undefined ? options.draggable : true;
      this.soundUrl = options.soundUrl || '';
      this.soundVolume = options.soundVolume !== undefined ? options.soundVolume : 0.45;
      this.className = options.className || '';

      this.defaultSelected = Math.max(0, Math.min(options.defaultSelected || 0, Math.max(this.items.length - 1, 0)));
      this.target = this.defaultSelected;
      this.pos = this.defaultSelected;
      this.selectedIndex = this.defaultSelected;

      this.rafId = null;
      this.lastTime = 0;
      this.wheelTimer = null;
      this.drag = null;
      this.dragMoved = false;

      this.itemEls = [];
      this.buildDOM();
      this.bindEvents();
      this.updateConfig();
      this.applyTarget(this.defaultSelected, true);
    }

    buildDOM() {
      this.root = document.createElement('div');
      this.root.className = `option-wheel${this.side === 'right' ? ' option-wheel--right' : ''}${this.className ? ' ' + this.className : ''}`;
      this.root.setAttribute('role', 'listbox');
      this.root.setAttribute('tabindex', '0');
      this.root.setAttribute('aria-label', 'Option navigation wheel');

      this.root.style.setProperty('--ow-text-color', this.textColor);
      this.root.style.setProperty('--ow-active-color', this.activeColor);
      this.root.style.setProperty('--ow-font-size', `${this.fontSize}rem`);
      this.root.style.setProperty('--ow-inset', `${this.inset}px`);

      this.itemEls = this.items.map((item, index) => {
        const el = document.createElement('div');
        el.className = `option-wheel__item${index === this.selectedIndex ? ' option-wheel__item--selected' : ''}`;
        el.setAttribute('role', 'option');
        el.setAttribute('aria-selected', index === this.selectedIndex ? 'true' : 'false');
        el.dataset.index = index;

        const label = typeof item === 'object' && item !== null ? item.label : String(item);
        el.innerHTML = `<span class="option-wheel__label">${label}</span>`;
        if (typeof item === 'object' && item.badge) {
          const badge = document.createElement('span');
          badge.className = 'option-wheel__badge';
          badge.textContent = item.badge;
          el.appendChild(badge);
        }

        this.root.appendChild(el);
        return el;
      });

      this.container.appendChild(this.root);
    }

    updateConfig() {
      const remPx = typeof window !== 'undefined'
        ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
        : 16;
      if (typeof window !== 'undefined') {
        const w = window.innerWidth;
        if (w < 380) {
          this.fontSize = 1.7;
          this.inset = 20;
          this.tilt = 5.0;
        } else if (w < 480) {
          this.fontSize = 1.95;
          this.inset = 28;
          this.tilt = 5.3;
        } else if (w < 768) {
          this.fontSize = 2.15;
          this.inset = 38;
          this.tilt = 5.6;
        } else if (w < 1100) {
          this.fontSize = 2.45;
          this.inset = 56;
          this.tilt = 6.0;
        } else {
          this.fontSize = 2.7;
          this.inset = 75;
          this.tilt = 6.0;
        }
        this.root.style.setProperty('--ow-font-size', `${this.fontSize}rem`);
        this.root.style.setProperty('--ow-inset', `${this.inset}px`);
      }
      this.cfg = {
        count: this.items.length,
        rowH: Math.max(this.fontSize * this.spacing * remPx, 1),
        curve: this.curve,
        tilt: this.tilt,
        blur: this.blur,
        fade: this.fade,
        minOpacity: this.minOpacity,
        side: this.side,
        loop: this.loop,
        smoothing: this.smoothing,
        draggable: this.draggable,
        soundUrl: this.soundUrl,
        soundVolume: this.soundVolume
      };
    }

    runFrame(now) {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      const cfg = this.cfg;
      const tau = Math.max(cfg.smoothing, 1) / 1000;
      const k = 1 - Math.exp(-dt / tau);

      const target = this.target;
      const cur = this.pos;
      let next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.001;
      if (settled) next = target;
      this.pos = next;

      const els = this.itemEls;
      const n = cfg.count;
      const mirror = cfg.side === 'right' ? -1 : 1;
      const tiltRad = (cfg.tilt * Math.PI) / 180;
      const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;

      for (let i = 0; i < n; i++) {
        const el = els[i];
        if (!el) continue;
        let d = i - next;
        if (cfg.loop && n > 1) {
          d = ((d % n) + n) % n;
          if (d > n / 2) d -= n;
        }
        const dist = Math.abs(d);
        let x = 0;
        let y = d * cfg.rowH;
        let rot = 0;
        if (R > 0) {
          const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
          y = R * Math.sin(ang);
          x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
          rot = (mirror * ang * 180) / Math.PI;
        }

        const opacity = Math.max(cfg.minOpacity, 1 - dist * cfg.fade);
        const blurPx = cfg.blur > 0 ? (dist * cfg.blur).toFixed(2) : 0;
        const p = Math.max(0, 1 - Math.min(dist, 1)).toFixed(4);

        el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
        el.style.setProperty('--ow-p', p);
      }

      this.rafId = settled ? null : requestAnimationFrame(t => this.runFrame(t));
    }

    startLoop() {
      if (this.rafId != null) cancelAnimationFrame(this.rafId);
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(t => this.runFrame(t));
    }

    applyTarget(value, snap) {
      const cfg = this.cfg;
      let v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      this.target = v;

      const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
      if (idx !== this.selectedIndex) {
        const prev = this.selectedIndex;
        this.selectedIndex = idx;
        if (this.itemEls[prev]) {
          this.itemEls[prev].classList.remove('option-wheel__item--selected');
          this.itemEls[prev].setAttribute('aria-selected', 'false');
        }
        if (this.itemEls[idx]) {
          this.itemEls[idx].classList.add('option-wheel__item--selected');
          this.itemEls[idx].setAttribute('aria-selected', 'true');
        }
        if (this.onChange) this.onChange(idx, this.items[idx]);
        playTick(this.cfg.soundUrl, this.cfg.soundVolume);
      }
      this.startLoop();
    }

    bindEvents() {
      const root = this.root;

      // Wheel / touchpad scrolling (non-passive)
      this.onWheelHandler = (e) => {
        e.preventDefault();
        const cfg = this.cfg;
        const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
        const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
        this.applyTarget(this.target + step, false);
        if (this.wheelTimer) clearTimeout(this.wheelTimer);
        this.wheelTimer = setTimeout(() => this.applyTarget(this.target, true), 140);
      };
      root.addEventListener('wheel', this.onWheelHandler, { passive: false });

      // Pointer drag & touch support
      this.onPointerDownHandler = (e) => {
        if (!this.cfg.draggable) return;
        this.drag = { y: e.clientY, start: this.target, id: e.pointerId };
        this.dragMoved = false;
        root.classList.add('option-wheel--dragging');
      };
      root.addEventListener('pointerdown', this.onPointerDownHandler);

      this.onPointerMoveHandler = (e) => {
        if (!this.drag) return;
        const dy = e.clientY - this.drag.y;
        if (!this.dragMoved && Math.abs(dy) > 4) {
          this.dragMoved = true;
          try { root.setPointerCapture(this.drag.id); } catch (_) {}
        }
        if (this.dragMoved) {
          this.applyTarget(this.drag.start - dy / this.cfg.rowH, false);
        }
      };
      root.addEventListener('pointermove', this.onPointerMoveHandler);

      this.onPointerEndHandler = (e) => {
        if (!this.drag) return;
        this.drag = null;
        root.classList.remove('option-wheel--dragging');
        if (this.dragMoved) {
          this.applyTarget(this.target, true);
        }
      };
      root.addEventListener('pointerup', this.onPointerEndHandler);
      root.addEventListener('pointercancel', this.onPointerEndHandler);

      // Item click handling
      this.onItemClickHandler = (e) => {
        const itemEl = e.target.closest('.option-wheel__item');
        if (!itemEl || this.dragMoved) return;
        const index = parseInt(itemEl.dataset.index, 10);
        if (isNaN(index)) return;

        const cfg = this.cfg;
        const cur = this.target;
        let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
        if (cfg.loop && cfg.count > 1) {
          if (d > cfg.count / 2) d -= cfg.count;
          else if (d < -cfg.count / 2) d += cfg.count;
        }

        const isCentered = Math.round(cur) === index;
        this.applyTarget(cur + d, true);

        if (this.onSelect) {
          this.onSelect(index, this.items[index], isCentered);
        }
      };
      root.addEventListener('click', this.onItemClickHandler);

      // Keyboard navigation
      this.onKeyDownHandler = (e) => {
        let delta = null;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
        else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;

        if (delta != null) {
          e.preventDefault();
          this.applyTarget(Math.round(this.target) + delta, true);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const idx = ((Math.round(this.target) % this.cfg.count) + this.cfg.count) % this.cfg.count;
          if (this.onSelect) this.onSelect(idx, this.items[idx], true);
        }
      };
      root.addEventListener('keydown', this.onKeyDownHandler);

      // Window resize refit
      this.onResizeHandler = () => {
        this.updateConfig();
        this.applyTarget(this.target, false);
      };
      window.addEventListener('resize', this.onResizeHandler);
      window.addEventListener('orientationchange', this.onResizeHandler);
    }

    select(index, snap = true) {
      const idx = Math.max(0, Math.min(index, this.items.length - 1));
      this.applyTarget(idx, snap);
    }

    destroy() {
      if (this.rafId != null) cancelAnimationFrame(this.rafId);
      if (this.wheelTimer) clearTimeout(this.wheelTimer);
      window.removeEventListener('resize', this.onResizeHandler);
      window.removeEventListener('orientationchange', this.onResizeHandler);
      this.root.remove();
    }
  }

  // Helper to initialize navigation overlay with OptionWheel
  function initNavOptionWheel() {
    if (window._navWheelInitialized) return;
    window._navWheelInitialized = true;

    const navToggles = document.querySelectorAll('.nav-toggle');
    const navlist = document.getElementById('navlist');
    if (!navlist) return;

    // Harvest navigation items from the static navlist
    const navLinks = Array.from(navlist.querySelectorAll('a')).map(a => ({
      label: a.textContent.trim(),
      href: a.getAttribute('href') || '#',
      active: a.classList.contains('active') || a.getAttribute('aria-current') === 'page'
    }));

    if (!navLinks.length) return;

    // Check if overlay already exists
    let overlay = document.getElementById('navWheelOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'navWheelOverlay';
      overlay.className = 'nav-wheel-overlay';
      overlay.setAttribute('hidden', '');
      overlay.style.display = 'none';
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'Cosmic Navigation Deck');

      overlay.innerHTML = `
        <div class="nav-wheel-backdrop" id="navWheelBackdrop"></div>
        <div class="nav-wheel-container">
          <div class="nav-wheel-header">
            <a class="nav-wheel-brand" href="#top">
              <span class="nav-wheel-orb" aria-hidden="true"></span>
              <div class="nav-wheel-brand-text">
                <strong>Ghosts of Exploration</strong>
                <small>Orbital Navigation</small>
              </div>
            </a>
            <button class="nav-wheel-close" id="navWheelClose" aria-label="Close navigation overlay">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="nav-wheel-body">
            <div class="nav-wheel-reticle" aria-hidden="true">
              <span class="nav-wheel-reticle-line"></span>
              <span class="nav-wheel-reticle-bracket"></span>
            </div>
            <div class="nav-wheel-viewport" id="navWheelViewport"></div>
          </div>

          <div class="nav-wheel-footer">
            <div class="nav-wheel-hint">
              <span>Drag / scroll wheel to steer • Tap to warp</span>
            </div>
            <div class="nav-wheel-quicklinks">
              <a href="explore.html" class="nav-wheel-chip"><svg class="ico"><use href="#i-globe"></use></svg> 3D Explore</a>
              <a href="ask.html" class="nav-wheel-chip"><svg class="ico"><use href="#i-sparkle"></use></svg> Ask Archive</a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const viewport = document.getElementById('navWheelViewport');
    const closeBtn = document.getElementById('navWheelClose');
    const backdrop = document.getElementById('navWheelBackdrop');

    // Find active link index or default to 0
    let initialIndex = navLinks.findIndex(l => l.active);
    if (initialIndex < 0) initialIndex = 0;

    let wheelInstance = null;

    function openOverlay() {
      overlay.removeAttribute('hidden');
      overlay.style.display = 'flex';
      document.body.classList.add('nav-wheel-open');
      navToggles.forEach(t => t.setAttribute('aria-expanded', 'true'));

      if (!wheelInstance) {
        wheelInstance = new OptionWheel(viewport, {
          items: navLinks,
          defaultSelected: initialIndex,
          side: 'left',
          fontSize: window.innerWidth < 640 ? 2.1 : 2.7,
          spacing: 1.38,
          curve: 1.05,
          tilt: 6.5,
          blur: 2.2,
          fade: 0.28,
          minOpacity: 0.08,
          smoothing: 180,
          inset: window.innerWidth < 640 ? 36 : 75,
          onSelect: (index, item, isCentered) => {
            setTimeout(() => {
              closeOverlay();
              const href = item.href;
              if (href.startsWith('#')) {
                const targetEl = document.querySelector(href);
                if (targetEl) {
                  targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  try { history.pushState(null, '', href); } catch (_) {}
                }
              } else {
                window.location.href = href;
              }
            }, 120);
          }
        });
      } else {
        wheelInstance.updateConfig();
        wheelInstance.select(initialIndex, true);
        wheelInstance.startLoop();
      }

      setTimeout(() => {
        wheelInstance?.root.focus();
      }, 50);
    }

    function closeOverlay() {
      overlay.setAttribute('hidden', '');
      overlay.style.display = 'none';
      document.body.classList.remove('nav-wheel-open');
      navToggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
      const activeToggle = document.querySelector('.nav-toggle:not([style*="display: none"])');
      activeToggle?.focus();
    }

    // Expose helpers globally
    window.openNavWheel = openOverlay;
    window.closeNavWheel = closeOverlay;

    let lastToggleTime = 0;

    // Attach click behavior on all .nav-toggle buttons
    navToggles.forEach(t => {
      if (t.dataset.navWheelBound) return;
      t.dataset.navWheelBound = 'true';
      t.addEventListener('click', (e) => {
        if (!window.matchMedia('(max-width: 768px)').matches) return;   // computers and tablets use the normal menu
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (now - lastToggleTime < 250) return;
        lastToggleTime = now;
        if (overlay.hasAttribute('hidden') || overlay.style.display === 'none') {
          openOverlay();
        } else {
          closeOverlay();
        }
      });
    });

    closeBtn?.addEventListener('click', closeOverlay);
    // turning a phone sideways or widening the window past phone size closes the dial
    window.matchMedia('(max-width: 768px)').addEventListener?.('change', ev => { if (!ev.matches && !overlay.hasAttribute('hidden')) closeOverlay(); });
    backdrop?.addEventListener('click', closeOverlay);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hasAttribute('hidden') && overlay.style.display !== 'none') {
        closeOverlay();
      }
    });
  }

  global.OptionWheel = OptionWheel;
  global.initNavOptionWheel = initNavOptionWheel;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavOptionWheel);
  } else {
    initNavOptionWheel();
  }
})(typeof window !== 'undefined' ? window : this);
