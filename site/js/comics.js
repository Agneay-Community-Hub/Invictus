/* ===========================================================
   Ghost Comics (comics.html): a shelf of one issue per machine and a
   flip-book reader. Two-page spreads on wide screens, one page at a
   time on phones. Flip with the arrows, keys, a swipe, or by tapping
   a page edge. comics.html?issue=viking1#p3 opens at a page.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cover = a => a.media && a.media[0] ? "assets/nasa/" + a.media[0].f : null;
  const svg = spec => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ComicArt.scene(spec)}</svg>`;
  const LANDING = Date.UTC(1976, 6, 20);

  // ---- shelf ----
  function shelf() {
    if (typeof SHORTS !== "undefined" && Object.keys(SHORTS).length) $("#gsStrip").innerHTML = `<h2>Ghost Shorts <small>cartoon videos, new</small></h2><div class="gs-row">${Object.entries(SHORTS).map(([id, s]) => `
      <button type="button" class="gs-card" data-short="${id}"><img src="${s.poster}" alt="" loading="lazy"><span class="gs-play" aria-hidden="true">▶</span><b>${esc(s.title)}</b><small>${esc(s.length)} · with subtitles</small></button>`).join("")}</div>`;
    $("#cxShelf").innerHTML = ISSUES.order.map((id, i) => {
      const a = ARTIFACTS.find(x => x.id === id), feat = id === "viking1";
      return `<a class="cx-mini${feat ? " feat" : ""}" href="?issue=${id}" data-w="${a.world}" data-text="${esc((a.name + " " + a.mission + " " + a.year + " " + WORLDS[a.world].name).toLowerCase())}" style="--w:${WORLDS[a.world].color}">
        <span class="cx-mast">GHOSTS<em>#${String(i + 1).padStart(2, "0")}</em></span>
        ${cover(a) ? `<img src="${cover(a)}" alt="" loading="lazy">` : `<span class="cx-ph">${typeIco(a.type)}</span>`}
        <b>${esc(feat ? "Facing the Wrong Way" : a.name)}</b><small>${feat ? "Viking 1 Lander · full issue" : `${esc(TYPES[a.type])} · ${a.year}`}</small>
      </a>`;
    }).join("");
    let world = "all";
    const apply = () => { const q = $("#cxSearch").value.trim().toLowerCase(); let n = 0; $$(".cx-mini").forEach(c => { const s = (world === "all" || c.dataset.w === world) && (!q || c.dataset.text.includes(q)); c.hidden = !s; if (s) n++; }); $("#cxCount").textContent = `${n} ${n === 1 ? "issue" : "issues"}`; };
    $("#cxSearch").addEventListener("input", apply);
    $$(".cat-chips button").forEach(b => b.addEventListener("click", () => { world = b.dataset.f; $$(".cat-chips button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); apply(); }));
    apply();
  }

  // ---- one page ----
  const LAYOUT = { splash: 1, two: 2, three: 3, four: 4, tall: 3 };
  function caption([t, pos]) { return `<p class="cx-cap ${pos}">${esc(t)}</p>`; }
  function pageHTML(p, issue, n) {
    const a = issue.star;
    if (p.cover) return `<div class="cx-page cx-cover" style="--w:${WORLDS[a.world].color}">
        <div class="cx-cover-art">${svg(p.art)}</div>
        <header class="cx-cover-mast"><span class="cx-logo">GHOSTS</span><span class="cx-sub">OF EXPLORATION</span><span class="cx-no">No. ${String(ISSUES.number(issue.id)).padStart(2, "0")}<br>${a.year}</span></header>
        <div class="cx-cover-title"><h2>${esc(issue.title)}</h2><p>${issue.featured ? "Starring the Viking 1 Lander" : esc(a.name)}</p></div>
        <p class="cx-cover-tag">${esc(p.tag)}</p>
      </div>`;
    if (p.back) return `<div class="cx-page cx-back">
        <p class="cx-logo sm">GHOSTS</p>
        <h2>${esc(a.name)}</h2><p class="cx-ep">“${esc(a.epitaph)}”</p>
        ${issue.featured ? `<p class="cx-sol">Today is sol <b>${ISSUES.solsSince(LANDING).toLocaleString("en")}</b> since Viking 1 landed. It has been silent for <b>${(ISSUES.solsSince(LANDING) - 2245).toLocaleString("en")}</b> of them.</p>
          <div class="cx-answer"><button type="button" class="btn btn-small" data-answer>${ico("chat")} Answer it</button><p class="cx-answer-out" hidden aria-live="polite"></p></div>` : ""}
        <div class="cx-back-links">
          ${typeof SHORTS !== "undefined" && SHORTS[a.id] ? `<button type="button" class="btn btn-small btn-primary" data-short="${a.id}">${ico("play")} Watch the cartoon</button>` : ""}
          <a class="btn btn-small" href="index.html#artifact=${a.id}">${ico("book")} Read the full dossier</a>
          <a class="btn btn-small" href="compare.html?a=${a.id}">${ico("compare")} Compare</a>
          ${next(issue) ? `<a class="btn btn-small btn-primary" href="?issue=${next(issue)}">Next issue ${ico("arrow")}</a>` : ""}
        </div>
        <p class="cx-credit">Story based on NASA mission records. Photos: NASA. Drawings made for Ghosts of Exploration.</p>
      </div>`;
    const panels = p.panels.map((pn, i) => `
      <div class="cx-panel p${i + 1}${pn.photo ? " photo" : ""}">
        ${svg(pn.art)}
        ${pn.stats ? `<dl class="cx-stats">${pn.stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        ${(pn.cap || []).map(caption).join("")}
        ${pn.bubble ? `<p class="cx-bubble ${pn.bubble[1]}${pn.bubble[2] ? " radio" : ""}">${esc(pn.bubble[0])}</p>` : ""}
        ${pn.sfx ? `<span class="cx-sfx" style="left:${pn.sfx[1] / 4}%;top:${pn.sfx[2] / 3}%;transform:rotate(${pn.sfx[3]}deg);font-size:${pn.sfx[4] / 400 * 100}cqw;color:${pn.sfx[5]}" aria-hidden="true">${esc(pn.sfx[0])}</span>` : ""}
        ${pn.link ? `<a class="cx-link" href="index.html#artifact=${pn.link[0]}">${esc(pn.link[1])} →</a>` : ""}
      </div>`).join("");
    const sol = p.sol ? `<span class="cx-solbox">SOL ${ISSUES.solsSince(LANDING).toLocaleString("en")}</span>` : "";
    return `<div class="cx-page cx-l-${p.layout}" style="--fade:${p.fade ?? 1}">${panels}${p.dust ? `<i class="cx-dust" style="opacity:${p.dust}"></i>` : ""}${sol}<span class="cx-num">${n}</span></div>`;
  }
  const next = issue => ISSUES.order[ISSUES.order.indexOf(issue.id) + 1];

  // ---- the flip book ----
  let issue, pages, leaves = [], at = 0, single = false;
  function open(id) {
    issue = ISSUES.get(id);
    if (!issue) return;
    document.title = `${issue.title} — Ghost Comics`;
    $("#cxShelfWrap").hidden = true; $("#cxReader").hidden = false;
    $("#cxTitle").textContent = `#${String(ISSUES.number(id)).padStart(2, "0")} · ${issue.title}`;
    pages = issue.pages.map((p, i) => pageHTML(p, issue, i));
    layout();
    const h = +(location.hash.match(/p(\d+)/) || [])[1] || 0;
    go(single ? h : Math.ceil(h / 2), true);
  }
  function layout() {
    single = innerWidth < 860;
    const book = $("#cxBook");
    book.classList.toggle("single", single);
    // a leaf has a front and a back; on phones each page is its own leaf
    const per = single ? 1 : 2, n = Math.ceil(pages.length / per);
    leaves = [];
    book.innerHTML = Array.from({ length: n }, (_, i) => `
      <div class="cx-leaf" data-i="${i}"><div class="cx-face front">${pages[i * per] || ""}</div>${single ? "" : `<div class="cx-face back">${pages[i * per + 1] || '<div class="cx-page cx-blank"></div>'}</div>`}</div>`).join("");
    leaves = $$("#cxBook .cx-leaf");
    leaves.forEach(l => l.addEventListener("click", e => { if (e.target.closest("a, button")) return; const r = book.getBoundingClientRect(); (e.clientX - r.left) / r.width > .5 ? go(at + 1) : go(at - 1); }));
    book.querySelectorAll("[data-answer]").forEach(b => b.addEventListener("click", answer));
  }
  function go(n, instant) {
    n = Math.max(0, Math.min(leaves.length - (single ? 1 : 0), n));
    at = n;
    leaves.forEach((l, i) => {
      l.classList.toggle("instant", !!instant);
      l.classList.toggle("flipped", i < n);
      l.style.zIndex = i < n ? i + 1 : leaves.length - i + 1;
    });
    const book = $("#cxBook");
    book.classList.toggle("closed", !single && n === 0);
    book.classList.toggle("ended", !single && n === leaves.length);
    const pg = single ? n : Math.min(n * 2, pages.length - 1);
    $("#cxPage").textContent = single ? `Page ${n + 1} of ${pages.length}` : n === 0 ? "Cover" : n === leaves.length ? "Back cover" : `Pages ${n * 2 - 1}–${Math.min(n * 2, pages.length - 1)} of ${pages.length - 1}`;
    $("#cxPrev").disabled = n === 0; $("#cxNext").disabled = n >= leaves.length - (single ? 1 : 0);
    history.replaceState(null, "", `?issue=${issue.id}#p${pg}`);
    GhostVoice?.stop?.(); $("#cxRead").setAttribute("aria-pressed", "false");
  }
  // the pages you can see right now, for read-aloud
  function visible() {
    if (single) return [leaves[at]?.querySelector(".front .cx-page")];
    return [leaves[at - 1]?.querySelector(".back .cx-page"), leaves[at]?.querySelector(".front .cx-page")].filter(Boolean);
  }
  $("#cxPrev").addEventListener("click", () => go(at - 1));
  $("#cxNext").addEventListener("click", () => go(at + 1));
  document.addEventListener("keydown", e => { if (!issue || e.target.closest("input, textarea, select, .sx-back")) return; if (e.key === "ArrowRight") go(at + 1); if (e.key === "ArrowLeft") go(at - 1); });
  let sx = null;
  $("#cxBook").addEventListener("touchstart", e => (sx = e.touches[0].clientX), { passive: true });
  $("#cxBook").addEventListener("touchend", e => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) go(at + (d < 0 ? 1 : -1)); sx = null; });
  $("#cxRead").addEventListener("click", e => {
    const texts = visible().flatMap(p => [...p.querySelectorAll(".cx-cap, .cx-bubble, .cx-cover-title, .cx-cover-tag, h2, .cx-ep")].map(x => x.textContent.trim())).filter(Boolean);
    GhostVoice.queue(e.currentTarget, texts.length ? texts : ["This page has no words. Just look."]);
  });
  $("#cxClose").addEventListener("click", () => { location.href = "comics.html"; });
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (issue && (innerWidth < 860) !== single) { const pg = single ? at : at * 2; layout(); go(single ? Math.ceil(pg / 2) : pg, true); } }, 200); });

  // "Answer it": how long a message would take to reach Viking 1 today
  function answer(e) {
    const T = (Date.now() - Date.UTC(2000, 0, 1, 12)) / 864e5;
    const ang = (L, P) => (L + 360 * T / P) * Math.PI / 180;
    const ex = Math.cos(ang(100.46, 365.256)), ey = Math.sin(ang(100.46, 365.256));
    const mx = 1.524 * Math.cos(ang(355.45, 686.98)), my = 1.524 * Math.sin(ang(355.45, 686.98));
    const au = Math.hypot(mx - ex, my - ey), min = au * 499 / 60;
    const out = e.currentTarget.parentElement.querySelector(".cx-answer-out");
    out.hidden = false;
    out.innerHTML = `Your message is on its way. Mars is about ${Math.round(au * 149.6)} million km from Earth today, so it reaches Chryse Planitia in about <b>${Math.round(min)} minutes</b>. Viking 1's dish is still pointing the wrong way, but the message gets there all the same.`;
    e.currentTarget.disabled = true;
  }

  const id = new URLSearchParams(location.search).get("issue");
  if (id && ISSUES.get(id)) open(id); else shelf();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
