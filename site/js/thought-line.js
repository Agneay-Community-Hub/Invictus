/**
 * ThoughtLine — Interactive AI Thinking State Component
 * Features:
 * - Real-time stopwatch elapsed counter (0.0s -> 2.4s)
 * - Shimmering gradient text & celestial sparkle icon
 * - Animated progressive archive search trace
 * - Settle state ("Thought for X.Xs") with collapsible trace dropdown
 */
(function (global) {
  'use strict';

  class ThoughtLine {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = Object.assign({
        mode: 'ai', // 'ai' or 'offline'
        steps: null,
        startTime: performance.now(),
        onToggle: null
      }, options);

      this.startTime = this.options.startTime;
      this.settled = false;
      this.elapsedSec = 0;
      this.currentStep = 0;
      this.timerId = null;
      this.stepTimerId = null;

      this.defaultSteps = this.options.mode === 'ai' ? [
        'Analyzing inquiry & mission parameters',
        'Scanning deep-space telemetry & dossiers',
        'Cross-referencing historical records',
        'Formulating response'
      ] : [
        'Parsing query keywords & entity matches',
        'Querying local offline archive index',
        'Ranking historical spacecraft dossiers',
        'Synthesizing verified facts'
      ];

      this.steps = this.options.steps || this.defaultSteps;
      this.init();
    }

    init() {
      this.el = document.createElement('div');
      this.el.className = 'thought-line thought-line-active';
      this.el.setAttribute('role', 'status');
      this.el.setAttribute('aria-live', 'polite');

      this.el.innerHTML = `
        <div class="thought-line-header" tabindex="0" role="button" aria-expanded="false" aria-label="Toggle thinking steps">
          <div class="thought-line-sparkle" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2L14.39 8.26L21 9.27L16.5 14.14L17.77 21L12 17.77L6.23 21L7.5 14.14L3 9.27L9.61 8.26L12 2Z"/>
            </svg>
          </div>
          <span class="thought-line-title">Thinking…</span>
          <span class="thought-line-timer">0.0s</span>
          <span class="thought-line-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>
        <div class="thought-line-steps" hidden>
          <ul class="thought-step-list">
            ${this.steps.map((s, i) => `
              <li class="thought-step ${i === 0 ? 'step-current' : 'step-pending'}" data-step="${i}">
                <span class="step-icon" aria-hidden="true">
                  <span class="step-dot"></span>
                </span>
                <span class="step-text">${s}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;

      if (this.container) {
        this.container.appendChild(this.el);
      }

      this.header = this.el.querySelector('.thought-line-header');
      this.titleEl = this.el.querySelector('.thought-line-title');
      this.timerEl = this.el.querySelector('.thought-line-timer');
      this.stepsEl = this.el.querySelector('.thought-line-steps');
      this.stepItems = this.el.querySelectorAll('.thought-step');

      this.header.addEventListener('click', () => this.toggle());
      this.header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });

      this.startTimers();
    }

    startTimers() {
      // Stopwatch loop
      this.timerId = setInterval(() => {
        if (this.settled) return;
        const now = performance.now();
        this.elapsedSec = ((now - this.startTime) / 1000).toFixed(1);
        if (this.timerEl) {
          this.timerEl.textContent = `${this.elapsedSec}s`;
        }
      }, 100);

      // Step progression loop
      let stepIdx = 0;
      this.stepTimerId = setInterval(() => {
        if (this.settled) return;
        if (stepIdx < this.steps.length - 1) {
          this.setStepDone(stepIdx);
          stepIdx++;
          this.setStepCurrent(stepIdx);
        }
      }, 700);
    }

    setStepDone(idx) {
      const item = this.stepItems[idx];
      if (!item) return;
      item.classList.remove('step-current', 'step-pending');
      item.classList.add('step-done');
      const icon = item.querySelector('.step-icon');
      if (icon) {
        icon.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      }
    }

    setStepCurrent(idx) {
      const item = this.stepItems[idx];
      if (!item) return;
      item.classList.remove('step-done', 'step-pending');
      item.classList.add('step-current');
      const icon = item.querySelector('.step-icon');
      if (icon) {
        icon.innerHTML = `<span class="step-spinner"></span>`;
      }
    }

    toggle() {
      if (!this.settled && this.stepsEl.hasAttribute('hidden')) {
        // user clicked during thinking: open steps
        this.stepsEl.removeAttribute('hidden');
        this.header.setAttribute('aria-expanded', 'true');
        this.el.classList.add('expanded');
      } else if (this.stepsEl.hasAttribute('hidden')) {
        this.stepsEl.removeAttribute('hidden');
        this.header.setAttribute('aria-expanded', 'true');
        this.el.classList.add('expanded');
      } else {
        this.stepsEl.setAttribute('hidden', '');
        this.header.setAttribute('aria-expanded', 'false');
        this.el.classList.remove('expanded');
      }
      if (typeof this.options.onToggle === 'function') {
        this.options.onToggle(!this.stepsEl.hasAttribute('hidden'));
      }
    }

    settle(customText) {
      if (this.settled) return;
      this.settled = true;
      clearInterval(this.timerId);
      clearInterval(this.stepTimerId);

      const finalElapsed = ((performance.now() - this.startTime) / 1000).toFixed(1);
      this.elapsedSec = finalElapsed;

      // Mark all remaining steps done
      this.stepItems.forEach((_, idx) => this.setStepDone(idx));

      this.el.classList.remove('thought-line-active');
      this.el.classList.add('thought-line-settled');

      if (this.titleEl) {
        this.titleEl.textContent = customText || `Thought for ${finalElapsed}s`;
      }
      if (this.timerEl) {
        this.timerEl.textContent = '';
      }

      // Ensure steps are collapsed by default after settling
      this.stepsEl.setAttribute('hidden', '');
      this.header.setAttribute('aria-expanded', 'false');
      this.el.classList.remove('expanded');
    }

    destroy() {
      clearInterval(this.timerId);
      clearInterval(this.stepTimerId);
      this.el?.remove();
    }
  }

  global.ThoughtLine = ThoughtLine;
})(typeof window !== 'undefined' ? window : this);
