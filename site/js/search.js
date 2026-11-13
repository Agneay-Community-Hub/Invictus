/* ===========================================================
   Site-wide search (every page): a Search button in the top bar,
   or Ctrl+K / ⌘K / "/" anywhere. One box finds machines, missions,
   landing sites, videos, sounds and pages, and jumps straight there.
   Loads js/data.js and js/atlas-data.js itself if the page has not.
   =========================================================== */
(() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const svg = n => `<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-${n}"></use></svg>`;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const PAGES = [
    ["Ghost Map", "index.html#map", "map", "home moon mars where"],
    ["Ghost Logs", "index.html#logs", "book", "stories diary first person"],
    ["Timeline", "index.html#timeline", "clock", "history years dates"],
    ["Quiz", "index.html#quiz", "award", "game guess who am i"],
    ["All machines", "browse.html", "grid", "browse list filter rovers landers probes"],
    ["Compare two machines", "compare.html", "compare", "side by side versus vs"],
    ["Timeline, year by year", "timeline.html", "clock", "history years dates when launched quiet listen"],
    ["Live tracker", "tracker.html", "clock", "voyager pioneer new horizons distance now light time speed"],
    ["Ghost of the day", "index.html#today", "award", "today daily featured random share"],
    ["Future ghosts", "future.html", "rocket", "planned upcoming next artemis viper dragonfly europa clipper"],
    ["Glossary", "glossary.html", "book", "words meaning define explain"],
    ["The Moon tonight", "moon.html", "moon", "phase full new sunlight apollo sites today sky"],
    ["Ghost Cards", "cards.html", "award", "card game trading top battle play print deck"],
    ["Drive on Mars: signal delay", "signal.html", "play", "game rover drive delay radio light minutes challenge"],
    ["Build a probe", "probe.html", "rocket", "design spacecraft game power solar nuclear rtg antenna engineer"],
    ["Scroll to Voyager", "voyager.html", "rocket", "scale solar system distance size how far"],
    ["Activity sheets", "activities.html", "image", "colouring coloring word search print kids patch"],
    ["Open data and embeds", "data.html", "download", "csv json download spreadsheet embed iframe api"],
    ["Take the tour", "index.html#more", "map", "help guide new start how to use"],
    ["Wall poster", "poster.html", "download", "print pdf map classroom"],
    ["Photos, videos and sounds", "library.html", "image", "gallery media audio pictures"],
    ["Landing sites", "landings.html", "footprints", "3d walk unity simulation"],
    ["Mission catalogue", "catalogue.html", "book", "missions records sources dates"],
    ["3D Explore", "explore.html", "globe", "globe moon mars model"],
    ["NASA Eyes", "eyes.html", "eye", "solar system spacecraft live"],
    ["Adopt a Ghost", "adopt.html", "award", "certificate print"],
    ["Ask the archive", "ask.html", "chat", "question answer ai"],
    ["Try landing it yourself", "lander.html", "rocket", "game lander"],
    ["For teachers", "teacher.html", "book", "lesson plans worksheets class"],
    ["Sources", "sources.html", "book", "references citations"]
  ];
  const KIND = { machine: "Machines", mission: "Missions", site: "Landing sites", media: "Videos and sounds", word: "Words", page: "Pages" };

  // ---- data, loaded on first open when the page does not have it ----
  const load = src => new Promise(res => { const s = document.createElement("script"); s.src = src; s.onload = s.onerror = res; document.head.appendChild(s); });
  let index = null;
  async function getIndex() {
    if (index) return index;
    if (typeof ARTIFACTS === "undefined") await load("js/data.js");
    if (typeof ATLAS_DATA === "undefined") await load("js/atlas-data.js");
    const items = [];
    const add = (kind, title, sub, href, icon, text) => items.push({ kind, title, sub, href, icon, t: title.toLowerCase(), text: (title + " " + sub + " " + (text || "")).toLowerCase() });
    if (typeof ARTIFACTS !== "undefined") {
      ARTIFACTS.forEach(a => add("machine", a.name, `${TYPES[a.type]} · ${WORLDS[a.world].short} · ${a.year}`, `index.html#artifact=${a.id}`,
        typeof typeIco === "function" ? null : "rocket", [a.mission, a.nick, a.place, a.fixedPlace, a.heading, a.body, STATUS[a.status].label, a.type].join(" ")));
      const byId = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
      Object.entries(VIDEOS).forEach(([k, v]) => add("media", v.title, "Video", `library.html?q=${encodeURIComponent(v.title.split(/[:(]/)[0].trim())}#videos`, "film", v.note));
      if (typeof SOUNDS !== "undefined") SOUNDS.forEach(s => add("media", s.title, "Sound" + (byId[s.for] ? " · " + byId[s.for].name : ""), `library.html?q=${encodeURIComponent(s.title)}#sounds`, "speaker", s.what));
      items.forEach(i => { if (i.kind === "machine" && !i.icon) i.type = ARTIFACTS.find(a => a.name === i.title).type; });
    }
    if (typeof ATLAS_DATA !== "undefined") {
      const where = { moon: "Moon", mars: "Mars" };
      ATLAS_DATA.missions.forEach(m => add("mission", m.name, `Mission · ${m.agency}${m.launch?.value ? " · " + m.launch.value.slice(0, 4) : ""}`, `catalogue.html#${m.id}`, "book", m.target));
      ATLAS_DATA.sites.forEach(s => add("site", s.name, `Landing site · ${where[s.body] || s.body}`, `landings.html?q=${encodeURIComponent(s.name.split(/ — /)[0])}`, "footprints", s.scene));
    }
    PAGES.forEach(([title, href, icon, words]) => add("page", title, "Page", href, icon, words));
    if (typeof GLOSSARY !== "undefined") GLOSSARY.forEach((g, i) => add("word", g[0], g[2], `glossary.html#g${i}`, "book", g[1].join(" ")));
    return (index = items);
  }

  function search(items, q) {
    q = q.trim().toLowerCase();
    if (!q) return items.filter(i => i.kind === "page").slice(0, 8);
    const words = q.split(/\s+/);
    const scored = [];
    for (const i of items) {
      if (!words.every(w => i.text.includes(w))) continue;
      let s = i.t === q ? 100 : i.t.startsWith(q) ? 60 : i.t.includes(q) ? 40 : words.every(w => i.t.includes(w)) ? 30 : 10;
      if (i.kind === "word" && s < 30 && !words.every(w => i.text.split(i.sub.toLowerCase()).join(" ").includes(w))) continue; // words: match the word, not its explanation
      s += { machine: 5, page: 4, mission: 3, site: 2, media: 1, word: 1 }[i.kind];
      scored.push([s, i]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    // keep groups in a steady order, best group first
    const out = scored.slice(0, 24).map(x => x[1]);
    const order = [...new Set(out.map(i => i.kind))];
    return order.flatMap(k => out.filter(i => i.kind === k));
  }

  // ---- UI ----
  const style = document.createElement("style");
  style.textContent = `
  .sx-btn{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 10px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font:inherit;font-size:.88rem;cursor:pointer;white-space:nowrap}
  .sx-btn:hover,.sx-btn:focus-visible{color:var(--text);border-color:var(--line2);background:var(--panel2)}
  .sx-btn .ico{width:18px;height:18px}
  .sx-btn kbd{font:600 .72rem var(--font);border:1px solid var(--line2);border-radius:6px;padding:1px 6px;color:var(--dim)}
  .sx-slot{margin-left:auto;display:flex;align-items:center}
  .top-actions .sx-btn{margin-right:4px}
  @media (max-width:900px){.sx-btn kbd,.sx-btn .sx-lbl{display:none}.sx-btn{width:40px;padding:0;justify-content:center}}
  .sx-back{position:fixed;inset:0;z-index:200;background:rgba(3,6,12,.72);backdrop-filter:blur(6px);display:flex;justify-content:center;align-items:flex-start;padding:min(12vh,110px) 16px 16px}
  .sx-back[hidden]{display:none}
  .sx-box{width:min(640px,100%);max-height:min(72vh,640px);display:flex;flex-direction:column;background:var(--bg2);border:1px solid var(--line2);border-radius:18px;box-shadow:var(--shadow);overflow:hidden}
  .sx-in{display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid var(--line)}
  .sx-in .ico{width:20px;height:20px;color:var(--amber);flex:none}
  .sx-in input{flex:1;min-width:0;height:56px;background:none;border:0;outline:0;color:var(--text);font:inherit;font-size:1.05rem}
  .sx-in button{flex:none;background:var(--panel);border:1px solid var(--line);color:var(--muted);border-radius:8px;font:600 .75rem var(--font);padding:4px 8px;cursor:pointer}
  .sx-list{overflow-y:auto;padding:6px 8px 10px;margin:0;list-style:none}
  .sx-h{font:700 .72rem var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--amber);padding:12px 10px 4px}
  .sx-o{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:12px;color:var(--text);text-decoration:none;cursor:pointer}
  .sx-o .sx-ic{width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:10px;background:var(--panel);border:1px solid var(--line);color:var(--muted)}
  .sx-o .sx-ic .ico{width:18px;height:18px}
  .sx-o b{display:block;font-weight:700;line-height:1.3}
  .sx-o small{display:block;color:var(--muted);font-size:.82rem}
  .sx-o mark{background:none;color:var(--amber2)}
  .sx-o[aria-selected=true]{background:var(--panel2);outline:1px solid var(--line2)}
  .sx-o[aria-selected=true] .sx-ic{color:var(--amber);border-color:rgba(255,179,71,.5)}
  .sx-none{padding:28px 12px;text-align:center;color:var(--muted)}
  .sx-foot{display:flex;gap:16px;padding:9px 16px;border-top:1px solid var(--line);color:var(--dim);font-size:.78rem}
  .sx-foot kbd{font:600 .72rem var(--font);border:1px solid var(--line2);border-radius:5px;padding:0 5px}
  @media (max-width:600px){.sx-back{padding:10px}.sx-box{max-height:calc(100dvh - 20px)}.sx-foot{display:none}}`;
  document.head.appendChild(style);

  const back = document.createElement("div");
  back.className = "sx-back"; back.hidden = true;
  back.innerHTML = `<div class="sx-box" role="dialog" aria-modal="true" aria-label="Search the site">
      <div class="sx-in">${svg("search")}<input id="sxQ" type="text" role="combobox" aria-expanded="true" aria-controls="sxList" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Search machines, missions, sites, sounds…"><button type="button" id="sxEsc" aria-label="Close search">Esc</button></div>
      <ul class="sx-list" id="sxList" role="listbox" aria-label="Results"></ul>
      <div class="sx-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>
    </div>`;
  document.body.appendChild(back);
  const input = back.querySelector("#sxQ"), list = back.querySelector("#sxList");

  // the button, in the top bar of every page
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "sx-btn"; btn.setAttribute("aria-label", "Search the site");
  btn.innerHTML = `${svg("search")}<span class="sx-lbl">Search</span><kbd>${isMac ? "⌘" : "Ctrl"} K</kbd>`;
  const bar = document.querySelector(".topbar, .x-top");
  const actions = bar?.querySelector(".top-actions");
  if (actions) actions.prepend(btn);
  else if (bar) { const slot = document.createElement("div"); slot.className = "sx-slot"; slot.appendChild(btn); const nav = bar.querySelector(".mainnav"); nav ? nav.after(slot) : bar.appendChild(slot); }

  let results = [], active = 0, lastFocus = null;
  const hi = (text, q) => {
    let h = esc(text);
    q.trim().split(/\s+/).filter(w => w.length > 1).forEach(w => { h = h.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
    return h;
  };
  function render() {
    const q = input.value;
    if (!index) { list.innerHTML = `<li class="sx-none" role="presentation">Loading…</li>`; return; }
    results = search(index, q);
    active = Math.min(active, Math.max(0, results.length - 1));
    if (!results.length) { list.innerHTML = `<li class="sx-none" role="presentation">Nothing matches “${esc(q.trim())}”. Try a machine, a mission or a world.</li>`; input.removeAttribute("aria-activedescendant"); return; }
    let last = "";
    list.innerHTML = results.map((r, i) => {
      const head = r.kind !== last ? `<li class="sx-h" role="presentation">${q.trim() ? KIND[r.kind] : "Go to"}</li>` : "";
      last = r.kind;
      const icon = r.type && typeof typeIco === "function" ? typeIco(r.type) : svg(r.icon || "arrow");
      return `${head}<li role="option" id="sx${i}" class="sx-o" data-i="${i}" aria-selected="${i === active}"><span class="sx-ic">${icon}</span><span><b>${hi(r.title, q)}</b><small>${esc(r.sub)}</small></span></li>`;
    }).join("");
    input.setAttribute("aria-activedescendant", "sx" + active);
  }
  function move(d) {
    if (!results.length) return;
    active = (active + d + results.length) % results.length;
    list.querySelectorAll(".sx-o").forEach(o => o.setAttribute("aria-selected", String(+o.dataset.i === active)));
    input.setAttribute("aria-activedescendant", "sx" + active);
    list.querySelector(`#sx${active}`)?.scrollIntoView({ block: "nearest" });
  }
  function go(i) {
    const r = results[i]; if (!r) return;
    const url = new URL(r.href, location.href);
    close(false);
    // same page, different #: index.html and catalogue.html listen for hashchange
    if (url.pathname === location.pathname && url.search === location.search && url.hash) { location.hash = url.hash; if (url.hash === location.hash) window.dispatchEvent(new HashChangeEvent("hashchange")); }
    else location.href = url.href;
  }
  async function open(q) {
    if (!back.hidden) return;
    lastFocus = document.activeElement;
    back.hidden = false; document.documentElement.style.overflow = "hidden";
    input.value = q || ""; active = 0;
    list.innerHTML = `<li class="sx-none" role="presentation">Loading…</li>`;
    input.focus();
    await getIndex(); render();
  }
  function close(restore = true) {
    back.hidden = true; document.documentElement.style.overflow = "";
    if (restore) lastFocus?.focus?.();
  }

  btn.addEventListener("click", () => open());
  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") { e.preventDefault(); go(active); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") e.preventDefault(); // keep focus in the box
  });
  list.addEventListener("click", e => { const o = e.target.closest(".sx-o"); if (o) go(+o.dataset.i); });
  list.addEventListener("mousemove", e => { const o = e.target.closest(".sx-o"); if (o && +o.dataset.i !== active) move(+o.dataset.i - active); });
  back.querySelector("#sxEsc").addEventListener("click", () => close());
  back.addEventListener("mousedown", e => { if (e.target === back) close(); });
  document.addEventListener("keydown", e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); back.hidden ? open() : close(); }
    else if (e.key === "/" && !typing && back.hidden) { e.preventDefault(); open(); }
  });
  window.GHOST_SEARCH = open;
})();
