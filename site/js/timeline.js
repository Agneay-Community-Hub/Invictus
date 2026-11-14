/* ===========================================================
   Timeline (timeline.html): every machine as a bar from launch to
   last contact. Drag the year slider (or press Play) to see which
   machines were working, launched or went quiet in that year.
   "Listen in order" reads each ghost log aloud, oldest first.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cover = a => a.media && a.media[0] ? "assets/nasa/" + a.media[0].f : null;
  const YEAR = 365.25 * 864e5;
  const when = s => { const d = Date.parse(String(s || "").replace(/\(.*?\)/g, "").split("/")[0].trim()); return isNaN(d) ? null : d; };
  const toY = ms => 1970 + ms / YEAR; // fractional year
  const NOW = toY(Date.now()), THIS = new Date().getFullYear();

  // ---- each machine's span ----
  const rows = ARTIFACTS.map(a => {
    const s = when(a.dates.launch) ?? Date.UTC(a.year, 0, 1);
    let e = when(a.dates.last), still = false;
    if (e === null && (a.status === "active" || a.status === "retired")) { e = Date.now(); still = true; }
    if (e === null) e = when(a.dates.arrive) ?? s;
    return { a, s: toY(s), e: Math.max(toY(e), toY(s) + 3 / 365), still, ly: new Date(s).getUTCFullYear(), ey: still ? THIS : new Date(e).getUTCFullYear() };
  }).sort((p, q) => p.s - q.s);

  const MIN = Math.floor(Math.min(...rows.map(r => r.s))), MAX = THIS + 1;
  const X = y => ((y - MIN) / (MAX - MIN)) * 100;

  // ---- the chart ----
  const ticks = []; for (let y = Math.ceil(MIN / 10) * 10; y <= MAX; y += 10) ticks.push(y);
  $("#gantt").innerHTML = `
    <div class="g-axis" aria-hidden="true"><span class="g-lab"></span><div class="g-track">${ticks.map(y => `<span style="left:${X(y)}%">${y}</span>`).join("")}</div></div>
    ${rows.map(r => `
    <a class="g-row" href="index.html#artifact=${r.a.id}" data-id="${r.a.id}" data-w="${r.a.world}">
      <span class="g-lab"><b>${esc(r.a.name)}</b><small>${esc(TYPES[r.a.type])} · ${r.ly}${r.still ? "–now" : r.ey !== r.ly ? "–" + r.ey : ""}</small></span>
      <span class="g-track"><i class="g-bar${r.still ? " still" : ""}" style="left:${X(r.s)}%;width:${Math.max(X(r.e) - X(r.s), .6)}%;--c:${WORLDS[r.a.world].color}"
        title="${esc(r.a.name)}: ${esc(r.a.dates.launch)} → ${esc(r.a.dates.last)}"></i></span>
    </a>`).join("")}
    <div class="g-cursor" id="gCursor" aria-hidden="true"><span id="gCursorY"></span></div>`;

  // ---- the year ----
  const range = $("#tlRange");
  range.min = MIN; range.max = THIS;
  let world = "all";
  const chip = r => `<a class="tl-chip" href="index.html#artifact=${r.a.id}" style="--c:${WORLDS[r.a.world].color}">${cover(r.a) ? `<img src="${cover(r.a)}" alt="" loading="lazy">` : typeIco(r.a.type)}<span>${esc(r.a.name)}</span></a>`;
  const list = (arr, empty) => arr.length ? arr.map(chip).join("") : `<p class="tl-none">${empty}</p>`;
  function setYear(y, fromUser) {
    y = Math.max(MIN, Math.min(THIS, +y));
    range.value = y; $("#tlYear").textContent = y;
    range.setAttribute("aria-valuetext", String(y));
    const vis = rows.filter(r => world === "all" || r.a.world === world);
    const born = vis.filter(r => r.ly === y), alive = vis.filter(r => r.ly <= y && y <= r.ey), quiet = vis.filter(r => r.ey === y && !r.still);
    const before = vis.filter(r => r.ey < y && !r.still).length;
    $("#tlSum").innerHTML = `<b>${alive.length}</b> ${alive.length === 1 ? "machine" : "machines"} working · <b>${born.length}</b> launched · <b>${quiet.length}</b> went quiet · <b>${before}</b> already silent`;
    $("#tlBorn").innerHTML = list(born, "Nothing launched this year.");
    $("#tlAlive").innerHTML = list(alive, "Nothing was working this year.");
    $("#tlQuiet").innerHTML = list(quiet, "Nobody went quiet this year.");
    $("#nBorn").textContent = born.length; $("#nAlive").textContent = alive.length; $("#nQuiet").textContent = quiet.length;
    const cur = $("#gCursor"); cur.style.setProperty("--xf", X(y + .5) / 100); $("#gCursorY").textContent = y;
    $$("#gantt .g-row").forEach(el => { const r = rows.find(x => x.a.id === el.dataset.id); el.classList.toggle("on", r.ly <= y && y <= r.ey); });
    if (fromUser) history.replaceState(null, "", `?year=${y}${world !== "all" ? "&world=" + world : ""}`);
  }
  range.addEventListener("input", () => { stopPlay(); setYear(range.value, true); });

  // world chips
  $$(".cat-chips button").forEach(b => b.addEventListener("click", () => {
    world = b.dataset.f; $$(".cat-chips button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    $$("#gantt .g-row").forEach(el => (el.hidden = world !== "all" && el.dataset.w !== world));
    setYear(range.value, true);
  }));

  // play through the years
  let timer = null;
  const playBtn = $("#tlPlay");
  function stopPlay() { clearInterval(timer); timer = null; playBtn.setAttribute("aria-pressed", "false"); playBtn.querySelector("span").textContent = "Play the years"; }
  playBtn.addEventListener("click", () => {
    if (timer) return stopPlay();
    if (+range.value >= THIS) setYear(MIN);
    playBtn.setAttribute("aria-pressed", "true"); playBtn.querySelector("span").textContent = "Pause";
    timer = setInterval(() => { if (+range.value >= THIS) return stopPlay(); setYear(+range.value + 1, true); }, 550);
  });

  // listen to every ghost log, oldest first
  const listen = $("#tlListen");
  listen.addEventListener("click", () => {
    stopPlay();
    const vis = rows.filter(r => world === "all" || r.a.world === world);
    const label = listen.querySelector("span");
    GhostVoice.queue(listen, vis.map(r => `${r.a.name}, ${r.ly}. ${r.a.ghost}`), {
      onItem: i => {
        const r = vis[i]; setYear(r.ly);
        $$("#gantt .g-row").forEach(el => el.classList.toggle("reading", el.dataset.id === r.a.id));
        $(`#gantt .g-row[data-id="${r.a.id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        label.textContent = `Stop (${i + 1} of ${vis.length})`;
      },
      onEnd: () => { $$("#gantt .g-row.reading").forEach(el => el.classList.remove("reading")); label.textContent = "Listen in order"; }
    });
  });
  if (!GhostVoice.ok) listen.hidden = true;

  // start: ?year= and ?world=, else the year of the first Moon landing
  const p = new URLSearchParams(location.search);
  if (["moon", "mars", "deep"].includes(p.get("world"))) $(`.cat-chips [data-f="${p.get("world")}"]`).click();
  setYear(+p.get("year") || 1969);

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
