/* ===========================================================
   Guided tour (home page): on a first visit, a small card offers a
   one-minute tour. Each step spotlights one part of the page. It can
   be skipped, and any [data-tour] link starts it again.
   =========================================================== */
(() => {
  const T = (k, f) => (window.t ? t(k, f) : f);
  const KEY = "goe-tour";
  const get = () => { try { return localStorage.getItem(KEY); } catch { return "done"; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch { } };
  const STEPS = [
    ["#map", T("tour.1t", "The Ghost Map"), T("tour.1", "Every glowing dot is a real machine, placed where it lies. Tap one to open its story.")],
    [".sx-btn", T("tour.3t", "Search everything"), T("tour.3", "Find any machine, mission, sound or page. Press Ctrl+K or / on a keyboard.")],
    ["#logs", T("tour.4t", "Ghost Logs"), T("tour.4", "Short stories told by the machines themselves. Press Read aloud to listen.")],
    [".top-actions .btn-glow", T("tour.5t", "3D Explore"), T("tour.5", "Spin the Moon and Mars in 3D and fly out to the far probes.")],
    ["#today", T("tour.2t", "Ghost of the day"), T("tour.2", "A different machine every day. Read it, hear it, or share it.")],
    ["#play", T("play.eyebrow", "Play"), T("tour.6p", "Land a spacecraft, play Ghost Cards, or guess the machine in Who am I?")],
    ["#passportBtn", T("tour.7t", "Your passport"), T("tour.7", "Collect badges as you explore. That's the tour. Have fun!")]
  ];

  const css = document.createElement("style");
  css.textContent = `
  .tour-spot{position:absolute;z-index:250;border-radius:16px;box-shadow:0 0 0 4px rgba(255,179,71,.85),0 0 0 9999px rgba(3,6,12,.72);pointer-events:none;transition:all .35s ease}
  .tour-card,.tour-ask{position:fixed;z-index:251;width:min(360px,calc(100vw - 24px));background:var(--bg2);border:1px solid rgba(255,179,71,.55);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow);color:var(--text)}
  .tour-card h2,.tour-ask h2{font-size:1.1rem;margin:0 0 4px}
  .tour-card p,.tour-ask p{margin:0 0 12px;color:var(--muted);line-height:1.5}
  .tour-card .tour-n{font:700 .72rem var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--amber);margin-bottom:4px}
  .tour-btns{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .tour-btns .tour-skip{margin-left:auto;background:none;border:0;color:var(--dim);font:inherit;cursor:pointer;text-decoration:underline}
  .tour-ask{right:16px;bottom:16px}
  @media (max-width:600px){.tour-ask{left:12px;right:12px;width:auto;bottom:12px}}
  @media (prefers-reduced-motion:reduce){.tour-spot{transition:none}}`;
  document.head.appendChild(css);

  let i = 0, spot = null, card = null, lastFocus = null;
  const visible = el => el && el.offsetParent !== null && el.getBoundingClientRect().width > 0;
  const steps = () => STEPS.filter(([s]) => visible(document.querySelector(s)));

  function place() {
    const list = steps(), [sel, title, text] = list[i], el = document.querySelector(sel);
    const r = el.getBoundingClientRect(), pad = 8, big = r.height > innerHeight * .6;
    const top = big ? Math.max(70, r.top) : r.top, h = big ? Math.min(innerHeight * .5, r.bottom - top) : r.height;
    Object.assign(spot.style, { left: scrollX + r.left - pad + "px", top: scrollY + top - pad + "px", width: r.width + pad * 2 + "px", height: h + pad * 2 + "px" });
    card.innerHTML = `<p class="tour-n">${i + 1} / ${list.length}</p><h2 id="tourTitle">${title}</h2><p>${text}</p>
      <div class="tour-btns">${i ? `<button class="btn btn-small" data-t="back">${T("tour.back", "Back")}</button>` : ""}
      <button class="btn btn-primary btn-small" data-t="next">${i === list.length - 1 ? T("tour.done", "Done") : T("tour.next", "Next")}</button>
      <button class="tour-skip" data-t="skip">${T("tour.skip", "Skip tour")}</button></div>`;
    const below = top + h + 24 + 190 < innerHeight;
    card.style.top = below ? Math.min(innerHeight - 200, top + h + 20) + "px" : "";
    card.style.bottom = below ? "" : Math.max(12, innerHeight - top + 20) + "px";
    if (!below && innerHeight - top + 20 + 190 > innerHeight) { card.style.bottom = "12px"; }
    card.style.left = Math.max(12, Math.min(innerWidth - card.offsetWidth - 12, r.left)) + "px";
    card.querySelector("[data-t=next]").focus();
  }
  function goTo(n) {
    const list = steps();
    if (n < 0 || n >= list.length) return stop();
    i = n;
    const el = document.querySelector(list[i][0]);
    el.scrollIntoView({ block: el.getBoundingClientRect().height > innerHeight * .6 ? "start" : "center", behavior: "instant" });
    setTimeout(place, 60);
  }
  function start() {
    document.querySelector(".tour-ask")?.remove();
    if (card) return;
    lastFocus = document.activeElement;
    spot = document.createElement("div"); spot.className = "tour-spot"; document.body.appendChild(spot);
    card = document.createElement("div"); card.className = "tour-card"; card.setAttribute("role", "dialog"); card.setAttribute("aria-labelledby", "tourTitle");
    document.body.appendChild(card);
    card.addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (!b) return; ({ next: () => goTo(i + 1), back: () => goTo(i - 1), skip: stop })[b.dataset.t](); });
    addEventListener("resize", place); addEventListener("keydown", key);
    goTo(0);
  }
  function key(e) { if (!card) return; if (e.key === "Escape") stop(); else if (e.key === "ArrowRight") goTo(i + 1); else if (e.key === "ArrowLeft") goTo(i - 1); }
  function stop() {
    set("done"); spot?.remove(); card?.remove(); spot = card = null;
    removeEventListener("resize", place); removeEventListener("keydown", key);
    lastFocus?.focus?.();
  }

  // first visit: offer it
  if (!get() && !location.hash && !new URLSearchParams(location.search).has("scrollto")) {
    setTimeout(() => {
      if (get() || card) return;
      const ask = document.createElement("div"); ask.className = "tour-ask"; ask.setAttribute("role", "dialog"); ask.setAttribute("aria-label", T("tour.askT", "New here?"));
      ask.innerHTML = `<h2>${T("tour.askT", "New here?")}</h2><p>${T("tour.ask", "Take a one-minute tour of what you can do on this site.")}</p>
        <div class="tour-btns"><button class="btn btn-primary btn-small" data-go>${T("tour.start", "Show me around")}</button><button class="tour-skip" data-no>${T("tour.no", "No thanks")}</button></div>`;
      document.body.appendChild(ask);
      ask.querySelector("[data-go]").addEventListener("click", start);
      ask.querySelector("[data-no]").addEventListener("click", () => { set("done"); ask.remove(); });
    }, 2500);
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-tour]")) { e.preventDefault(); start(); } });
})();
