/* ===========================================================
   Ghost Shorts: short cartoon videos of the machines, made in Blender
   (see scripts/shorts/). SHORTS lists the ones made so far; any page
   can call openShort(id) to play one in a pop-up, with subtitles.
   =========================================================== */
const SHORTS = {
  viking1: { title: "Viking 1: Facing the Wrong Way", src: "assets/video/viking1.mp4", poster: "assets/video/viking1.jpg", vtt: "assets/video/viking1.vtt", length: "50 s" }
};
(() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const css = document.createElement("style");
  css.textContent = `
  .gs-back{position:fixed;inset:0;z-index:260;background:rgba(3,6,12,.86);display:grid;place-items:center;padding:16px}
  .gs-back[hidden]{display:none}
  .gs-box{width:min(960px,100%);background:var(--bg2,#0b1120);border:1px solid var(--line2,#2f4166);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px -20px #000}
  .gs-box video{display:block;width:100%;aspect-ratio:16/9;background:#000}
  .gs-bar{display:flex;align-items:center;gap:12px;padding:10px 14px}
  .gs-bar h2{margin:0;font-size:1rem;flex:1}
  .gs-bar small{color:var(--dim,#7e8ca6)}
  .gs-bar button{background:none;border:1px solid var(--line2,#2f4166);color:var(--text,#e9eef7);border-radius:10px;padding:6px 12px;font:inherit;cursor:pointer}`;
  document.head.appendChild(css);
  let back = null, last = null;
  window.openShort = id => {
    const s = SHORTS[id]; if (!s) return;
    last = document.activeElement;
    back ??= Object.assign(document.createElement("div"), { className: "gs-back" });
    back.innerHTML = `<div class="gs-box" role="dialog" aria-modal="true" aria-label="${esc(s.title)}">
      <video controls autoplay playsinline preload="metadata" poster="${s.poster}"><source src="${s.src}" type="video/mp4"><track kind="captions" srclang="en" label="English" src="${s.vtt}" default></video>
      <div class="gs-bar"><h2>${esc(s.title)}</h2><small>Ghost Shorts · ${esc(s.length)}</small><button type="button" data-close>Close</button></div></div>`;
    document.body.appendChild(back); back.hidden = false;
    const close = () => { back.querySelector("video")?.pause(); back.hidden = true; back.innerHTML = ""; last?.focus?.(); removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    back.querySelector("[data-close]").addEventListener("click", close);
    back.addEventListener("click", e => { if (e.target === back) close(); }, { once: true });
    addEventListener("keydown", onKey);
    back.querySelector("[data-close]").focus();
  };
  document.addEventListener("click", e => { const b = e.target.closest("[data-short]"); if (b) { e.preventDefault(); openShort(b.dataset.short); } });
})();
