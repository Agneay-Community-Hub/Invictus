/* ===========================================================
   Compare two machines (compare.html?a=ID&b=ID): pick any two of the
   49 machines and see them side by side: a quick "at a glance"
   summary, then dates, lifespan, numbers, discoveries and epitaphs.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const byId = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const cover = a => a.media && a.media[0] ? "assets/nasa/" + a.media[0].f : null;
  const pill = s => `<span class="pill" style="color:${STATUS[s].color}">${STATUS[s].label}</span>`;
  const where = a => a.place || a.fixedPlace || a.heading || "";
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const NOW = { silent: "silent", lost: "lost", impact: "a crash site", retired: "retired but partly awake", active: "still working" };

  // ---- dates: "28 Jul 1964", "31 Jul 1964 (impact)", "31 Dec 2011 / 1 Jan 2012 (orbit)", "Still working" ----
  const when = s => { const d = Date.parse(String(s || "").replace(/\(.*?\)/g, "").split("/")[0].trim()); return isNaN(d) ? null : d; };
  const DAY = 864e5;
  function life(a) {
    const start = when(a.dates.launch);
    let end = when(a.dates.last), still = false;
    if (end === null && (a.status === "active" || a.status === "retired")) { end = Date.now(); still = true; }
    if (end === null) end = when(a.dates.arrive);
    return start !== null && end !== null && end >= start ? { days: (end - start) / DAY, still } : null;
  }
  function span(days) {
    if (days < 1) return "less than a day";
    if (days < 60) return plural(Math.round(days), "day");
    if (days < 730) return plural(Math.round(days / 30.44), "month");
    const y = days / 365.25;
    return `${y < 10 ? Math.round(y * 10) / 10 : Math.round(y)} years`;
  }
  const lifeText = a => { const l = life(a); return l ? span(l.days) + (l.still ? " and counting" : "") : "Not known"; };

  // ---- pickers, grouped by world ----
  const opts = Object.keys(WORLDS).map(w => `<optgroup label="${esc(WORLDS[w].name)}">${ARTIFACTS.filter(a => a.world === w)
    .map(a => `<option value="${a.id}">${esc(a.name)} (${a.year})</option>`).join("")}</optgroup>`).join("");
  $("#cmpA").innerHTML = opts; $("#cmpB").innerHTML = opts;

  const p = new URLSearchParams(location.search);
  let A = byId[p.get("a")] ? p.get("a") : "sojourner";
  let B = byId[p.get("b")] && p.get("b") !== A ? p.get("b") : null;
  if (!B) { // a sensible partner: same type, then same world, then anything
    const a = byId[A];
    B = (ARTIFACTS.find(x => x.id !== A && x.type === a.type && x.world !== a.world) || ARTIFACTS.find(x => x.id !== A && x.type === a.type)
      || ARTIFACTS.find(x => x.id !== A && x.world === a.world) || ARTIFACTS.find(x => x.id !== A)).id;
    if (A === "sojourner" && !p.get("a")) B = "curiosity";
  }

  // ---- "at a glance": a few plain sentences ----
  function glance(a, b) {
    const out = [];
    if (a.year === b.year) out.push(`Both reached space in <b>${a.year}</b>.`);
    else { const [o, n] = a.year < b.year ? [a, b] : [b, a]; out.push(`<b>${esc(o.name)}</b> came first, <b>${plural(n.year - o.year, "year")}</b> before ${esc(n.name)}.`); }
    const la = life(a), lb = life(b);
    if (la && lb && la.days >= 1 && lb.days >= 1) {
      const [l, s] = la.days >= lb.days ? [[a, la], [b, lb]] : [[b, lb], [a, la]];
      const x = l[1].days / s[1].days;
      out.push(x < 1.15 ? `They worked for about the same time: <b>${span(l[1].days)}</b>.`
        : `<b>${esc(l[0].name)}</b> ${l[1].still ? "has been going" : "kept going"} <b>${x >= 10 ? Math.round(x).toLocaleString("en") : Math.round(x * 10) / 10}× longer</b> (${span(l[1].days)} against ${span(s[1].days)}).`);
    }
    out.push(a.world === b.world ? `Both are on ${a.world === "deep" ? "journeys beyond the Moon and Mars" : WORLDS[a.world].name.replace(/^The /, "the ")}.`
      : `One is ${a.world === "deep" ? "out in deep space" : "on " + WORLDS[a.world].name.replace(/^The /, "the ")}, the other ${b.world === "deep" ? "out in deep space" : "on " + WORLDS[b.world].name.replace(/^The /, "the ")}.`);
    out.push(a.status === b.status ? `Today both are <b>${a.status === "impact" ? "crash sites" : NOW[a.status]}</b>.`
      : `Today ${esc(a.name)} is <b>${NOW[a.status]}</b> and ${esc(b.name)} is <b>${NOW[b.status]}</b>.`);
    return out;
  }

  const list = arr => arr && arr.length ? `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "—";
  const stats = arr => arr && arr.length ? `<dl class="cmp-stats">${arr.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : "—";
  const ROWS = [
    ["Where", a => `${esc(WORLDS[a.world].name)}${where(a) ? `<small>${esc(where(a))}</small>` : ""}`],
    ["Type", a => esc(TYPES[a.type])],
    ["Mission", a => esc(a.mission)],
    ["Launched", a => esc(a.dates.launch)],
    ["Arrived", a => esc(a.dates.arrive)],
    ["Last heard from", a => esc(a.dates.last)],
    ["Launch to last contact", a => `<b class="cmp-big">${lifeText(a)}</b>`],
    ["The plan", a => esc(a.planned)],
    ["What happened", a => esc(a.actual)],
    ["Key numbers", a => stats(a.stats)],
    ["What it found", a => list(a.discoveries)],
    ["Its legacy", a => esc(a.legacy)],
    ["Epitaph", a => `<q>${esc(a.epitaph)}</q>`]
  ];

  function head(a) {
    return `<article class="cmp-card">
      ${cover(a) ? `<img src="${cover(a)}" alt="" loading="lazy">` : `<span class="ph">${typeIco(a.type)}</span>`}
      <div class="cmp-card-body">${pill(a.status)}<h2>${esc(a.name)}</h2><p>${esc(TYPES[a.type])} · ${esc(WORLDS[a.world].short)} · ${a.year}</p>
        <a class="btn btn-small" href="index.html#artifact=${a.id}">${ico("book")} Open the dossier</a></div>
    </article>`;
  }

  function render() {
    const a = byId[A], b = byId[B];
    $("#cmpA").value = A; $("#cmpB").value = B;
    [...$("#cmpA").options].forEach(o => (o.disabled = o.value === B));
    [...$("#cmpB").options].forEach(o => (o.disabled = o.value === A));
    $("#cmpOut").innerHTML = `
      <div class="cmp-heads">${head(a)}<span class="cmp-vs" aria-hidden="true">vs</span>${head(b)}</div>
      <section class="cmp-glance" aria-label="At a glance"><h2>At a glance</h2><ul>${glance(a, b).map(s => `<li>${s}</li>`).join("")}</ul></section>
      <div class="cmp-table" role="table" aria-label="${esc(a.name)} and ${esc(b.name)} side by side">
        <div class="cmp-row cmp-row-head" role="row"><span role="columnheader" class="cmp-k"></span><span role="columnheader">${esc(a.name)}</span><span role="columnheader">${esc(b.name)}</span></div>
        ${ROWS.map(([k, f]) => `<div class="cmp-row" role="row"><span class="cmp-k" role="rowheader">${k}</span><div class="cmp-v" role="cell" data-who="${esc(a.name)}">${f(a)}</div><div class="cmp-v" role="cell" data-who="${esc(b.name)}">${f(b)}</div></div>`).join("")}
      </div>`;
    document.title = `${a.name} vs ${b.name} — Ghosts of Exploration`;
    history.replaceState(null, "", `?a=${A}&b=${B}`);
  }

  $("#cmpA").addEventListener("change", e => { A = e.target.value; render(); });
  $("#cmpB").addEventListener("change", e => { B = e.target.value; render(); });
  $("#cmpSwap").addEventListener("click", () => { [A, B] = [B, A]; render(); });
  $("#cmpRand").addEventListener("click", () => {
    const pick = () => ARTIFACTS[(Math.random() * ARTIFACTS.length) | 0].id;
    let a = pick(), b = pick();
    while (b === a) b = pick();
    A = a; B = b; render();
  });
  render();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
