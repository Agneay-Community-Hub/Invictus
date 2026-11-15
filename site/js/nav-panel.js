/* ===========================================================
   Menu panel for laptops and tablets: when the menu bar doesn't fit,
   the ☰ button opens this compact panel under it, with the links
   grouped (Explore · Stories and science · Play and ask · For teachers),
   an icon and a one-line hint each, and Echo's story at the bottom.
   It reads the existing #navlist links, so their translated names and
   the phone dial (js/option-wheel.js) keep working unchanged.
   Phones (≤768px) never see it: the dial takes over there.
   =========================================================== */
(() => {
  const PHONE = matchMedia("(max-width: 768px)");
  const ui = k => (window.I18N && window.I18N.ui && window.I18N.ui[k]) || null;
  const tr = (k, fb) => ui(k) || fb;
  const icon = n => (typeof ico === "function" ? ico(n) : "");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // where each link goes, matched on the end of its href
  const ITEMS = {
    map:      { m: /#map$/,          icon: "map",       hint: ["nav.h.map", "Every machine where it lies"] },
    deep:     { m: /#deep$/,         icon: "planet",    hint: ["nav.h.deep", "Mercury to the stars"] },
    worlds3d: { m: /#worlds3d$/,     icon: "cube",      hint: ["nav.h.w3d", "Walk the real landing sites"] },
    logs:     { m: /#logs$/,         icon: "book",      hint: ["nav.h.logs", "Told in their own voices"] },
    stories:  { m: /#stories$/,      icon: "film",      hint: ["nav.h.stories", "Cartoons, comics and a podcast"] },
    how:      { m: /#how$/,          icon: "parachute", hint: ["nav.h.how", "How they landed, step by step"] },
    play:     { m: /#play$/,         icon: "rocket",    hint: ["nav.h.play", "Land, drive, build, quiz"] },
    ask:      { m: /ask\.html$/,     icon: "chat",      hint: ["nav.h.ask", "Ask anything about the machines"] },
    teach:    { m: /teacher\.html$/, icon: "glasses",   hint: ["nav.h.teach", "Lessons, worksheets, class quiz"] }
  };
  const GROUPS = [
    [["nav.g.explore", "Explore"], ["map", "deep", "worlds3d"]],
    [["nav.g.stories", "Stories and science"], ["logs", "stories", "how"]],
    [["nav.g.play", "Play and ask"], ["play", "ask"]],
    [["nav.g.learn", "For teachers"], ["teach"]]
  ];

  let panel = null, toggle = null, open = false;

  function build() {
    const links = [...document.querySelectorAll("#navlist a")];
    const find = key => links.find(a => ITEMS[key].m.test(a.getAttribute("href") || ""));
    const item = key => {
      const a = find(key); if (!a) return "";
      const cur = a.getAttribute("aria-current") === "page" ? ' aria-current="page"' : "";
      return `<a class="np-item" href="${esc(a.getAttribute("href"))}"${cur}>
        <span class="np-ic" aria-hidden="true">${icon(ITEMS[key].icon)}</span>
        <span class="np-tx"><b>${esc(a.textContent.trim())}</b><small>${esc(tr(...ITEMS[key].hint))}</small></span></a>`;
    };
    const storyHref = location.pathname.endsWith("story.html") ? "#" : "story.html";
    panel.innerHTML = `
      <div class="np-grid">${GROUPS.map(([g, keys]) => `
        <div class="np-group" role="group" aria-label="${esc(tr(...g))}"><p class="np-h">${esc(tr(...g))}</p>${keys.map(item).join("")}</div>`).join("")}
      </div>
      <a class="np-foot" href="${storyHref}"><span class="np-ic" aria-hidden="true">${icon("play")}</span><b>${esc(tr("hero.story", "Watch Echo's 5-minute story"))}</b><span class="np-arrow" aria-hidden="true">→</span></a>`;
  }

  function setOpen(on, { focus = true } = {}) {
    if (!panel || on === open) return;
    open = on;
    if (on) build();
    panel.hidden = !on;
    toggle?.setAttribute("aria-expanded", String(on));
    if (on && focus) panel.querySelector(".np-item")?.focus();
    if (!on && focus) toggle?.focus();
  }

  function init() {
    const bar = document.querySelector(".topbar");
    toggle = document.querySelector(".nav-toggle");
    if (!bar || !toggle || !document.getElementById("navlist")) return;
    panel = document.createElement("div");
    panel.className = "nav-panel"; panel.id = "navPanel"; panel.hidden = true;
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", tr("nav.panel", "Site menu"));
    bar.appendChild(panel);
    toggle.setAttribute("aria-controls", "navPanel");

    panel.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false, { focus: false }); });
    document.addEventListener("click", e => { if (open && !panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false, { focus: false }); });
    document.addEventListener("keydown", e => {
      if (!open) return;
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
      if (e.key === "Tab") {                       // keep Tab inside the panel while it's open
        const f = [...panel.querySelectorAll("a")];
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }, true);
    // the menu bar fits again, or the screen became phone-sized: close the panel
    addEventListener("resize", () => { if (open && (PHONE.matches || !bar.classList.contains("nav-compact"))) setOpen(false, { focus: false }); });
  }

  window.NavPanel = {
    toggle() { if (!PHONE.matches) setOpen(!open); },
    close() { setOpen(false, { focus: false }); },
    get open() { return open; }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
