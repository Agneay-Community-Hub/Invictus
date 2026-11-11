/* ===========================================================
   Shared 3D model viewer (NASA 3D Resources GLB files)
   Uses Google's <model-viewer> web component, loaded only when
   someone first opens a model. Exposes window.openModel(id).
   =========================================================== */
(() => {
  "use strict";
  const LIB = "https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
  let libPromise = null, modal = null, lastFocus = null;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function loadLib() {
    if (customElements.get("model-viewer")) return Promise.resolve();
    if (!libPromise) {
      libPromise = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.type = "module"; s.src = LIB;
        s.onload = () => customElements.whenDefined("model-viewer").then(res);
        s.onerror = () => { libPromise = null; rej(new Error("model-viewer failed to load")); };
        document.head.appendChild(s);
      });
    }
    return libPromise;
  }

  function build() {
    modal = document.createElement("div");
    modal.className = "modal model-modal"; modal.hidden = true;
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "mmTitle");
    modal.innerHTML = `
      <div class="modal-card model-card">
        <button class="icon-btn close" data-mclose aria-label="Close 3D model">✕</button>
        <p class="eyebrow">NASA 3D model</p>
        <h2 id="mmTitle"></h2>
        <div class="mm-stage" id="mmStage"></div>
        <p class="mm-help">Drag to turn it · scroll or pinch to zoom · on a phone, tap <b>View in your space</b> to place it in your room (AR).</p>
        <p class="mm-note" id="mmNote"></p>
        <p class="mm-credit">Model: <a href="https://github.com/nasa/NASA-3D-Resources" target="_blank" rel="noopener">NASA 3D Resources</a> (public domain). Shapes are simplified; not to scale with other models.</p>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => { if (e.target === modal || e.target.closest("[data-mclose]")) close(); });
    document.addEventListener("keydown", e => {
      if (modal.hidden) return;
      if (e.key === "Escape") { e.stopImmediatePropagation(); close(); }
    }, true);
  }

  function close() {
    modal.hidden = true;
    const mv = modal.querySelector("model-viewer"); if (mv) mv.remove(); // free GPU memory
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  async function openModel(id) {
    const m = (typeof MODELS !== "undefined") && MODELS[id];
    const a = (typeof ARTIFACTS !== "undefined") && ARTIFACTS.find(x => x.id === id);
    if (!m) return;
    if (!modal) build();
    lastFocus = document.activeElement;
    modal.querySelector("#mmTitle").textContent = a ? `${a.name} — ${m.title}` : m.title;
    modal.querySelector("#mmNote").textContent = m.note;
    const stage = modal.querySelector("#mmStage");
    stage.innerHTML = `<div class="mm-loading">Loading 3D model…</div>`;
    modal.hidden = false;
    modal.querySelector("[data-mclose]").focus();
    try { await loadLib(); }
    catch {
      stage.innerHTML = `<div class="mm-loading">The 3D viewer couldn't load (it needs an internet connection). <a href="assets/models/${esc(m.file)}" download>Download the model file</a> instead.</div>`;
      return;
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains("reduce-motion");
    stage.innerHTML = `
      <model-viewer src="assets/models/${esc(m.file)}" alt="3D model of ${esc(m.title)}"
        camera-controls touch-action="pan-y" ${reduce ? "" : "auto-rotate auto-rotate-delay=\"800\" rotation-per-second=\"18deg\""}
        ar ar-modes="webxr scene-viewer quick-look" shadow-intensity="0.8" exposure="1.05" environment-image="neutral" interaction-prompt="auto">
        <button slot="ar-button" class="btn btn-primary btn-small mm-ar">📱 View in your space</button>
        <div slot="progress-bar" class="mm-progress"><i></i></div>
      </model-viewer>`;
    const mv = stage.querySelector("model-viewer"), bar = stage.querySelector(".mm-progress i");
    mv.addEventListener("progress", e => { bar.style.width = (e.detail.totalProgress * 100) + "%"; if (e.detail.totalProgress >= 1) bar.parentElement.style.opacity = 0; });
    mv.addEventListener("error", () => { stage.innerHTML = `<div class="mm-loading">Sorry — this model couldn't be displayed on this device.</div>`; });
    try { localStorage.setItem("goe:model", "true"); } catch { /* ignore */ }
    document.dispatchEvent(new CustomEvent("goe:model-opened", { detail: { id } }));
  }

  window.openModel = openModel;
  window.hasModel = id => typeof MODELS !== "undefined" && !!MODELS[id];
})();
