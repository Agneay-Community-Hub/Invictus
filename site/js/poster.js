/* ===========================================================
   Printable wall poster (poster.html): the Moon and Mars maps with
   every machine numbered where it lies, the far travellers in a list,
   and a key. Sized for A3 / Tabloid landscape; scales to fit A4.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let n = 0;
  const num = {};
  ["moon", "mars", "deep"].forEach(w => ARTIFACTS.filter(a => a.world === w).sort((p, q) => p.year - q.year).forEach(a => (num[a.id] = ++n)));

  function map(w) {
    const list = ARTIFACTS.filter(a => a.world === w && a.lat != null);
    return `<figure class="pz-map">
      <div class="pz-img"><img src="assets/maps/${w}.jpg" alt="Map of ${esc(WORLDS[w].name)}">
        ${list.map(a => `<span class="pz-pin" style="left:${(a.lon + 180) / 360 * 100}%;top:${(90 - a.lat) / 180 * 100}%;--c:${STATUS[a.status].color}" title="${esc(a.name)}">${num[a.id]}</span>`).join("")}
      </div>
      <figcaption><b>${esc(WORLDS[w].name)}</b> · ${list.length} machines · ${esc(WORLDS[w].tagline)}</figcaption>
    </figure>`;
  }
  const key = w => `<ol class="pz-key" start="${Math.min(...ARTIFACTS.filter(a => a.world === w).map(a => num[a.id]))}">${ARTIFACTS.filter(a => a.world === w).sort((p, q) => num[p.id] - num[q.id])
    .map(a => `<li><i style="background:${STATUS[a.status].color}"></i><b>${esc(a.name)}</b> <span>${a.year}</span></li>`).join("")}</ol>`;

  $("#poster").innerHTML = `
    <header class="pz-head">
      <div><p class="pz-eye">Ghosts of Exploration</p><h1>The machines we left behind</h1>
      <p>${ARTIFACTS.length} NASA robots, landers, Moon cars and probes, still out there. Some are silent, some are still talking.</p></div>
      <ul class="pz-legend">${Object.entries(STATUS).map(([k, s]) => `<li><i style="background:${s.color}"></i>${esc(s.label)}</li>`).join("")}</ul>
    </header>
    <div class="pz-grid">
      <section class="pz-col">${map("moon")}${key("moon")}</section>
      <section class="pz-col">${map("mars")}${key("mars")}</section>
      <section class="pz-col pz-deep"><h2>${esc(WORLDS.deep.name)}</h2><p class="pz-sub">${esc(WORLDS.deep.tagline)}</p>${key("deep")}</section>
    </div>
    <footer class="pz-foot">Maps and photos: NASA. Positions from NASA mission records. Explore every machine at agneay-community-hub.github.io/PROJECT-AREA-51</footer>`;

  // spread out pins that would overlap (the Apollo sites sit close together) and draw a short line to the true spot
  document.querySelectorAll(".pz-img").forEach(box => {
    const W = box.clientWidth, H = box.clientHeight, R = 21;
    const pins = [...box.querySelectorAll(".pz-pin")].map(el => { const x = parseFloat(el.style.left) / 100 * W, y = parseFloat(el.style.top) / 100 * H; return { el, x0: x, y0: y, x, y }; });
    for (let it = 0; it < 120; it++) {
      for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) {
        const p = pins[i], q = pins[j]; let dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
        if (d < R) { if (d < .01) { dx = Math.cos(i + j); dy = Math.sin(i + j); d = 1; } const push = (R - d) / 2; dx /= d; dy /= d; p.x -= dx * push; p.y -= dy * push; q.x += dx * push; q.y += dy * push; }
      }
      pins.forEach(p => { p.x += (p.x0 - p.x) * .02; p.y += (p.y0 - p.y) * .02; p.x = Math.max(11, Math.min(W - 11, p.x)); p.y = Math.max(11, Math.min(H - 11, p.y)); });
    }
    const lines = pins.filter(p => Math.hypot(p.x - p.x0, p.y - p.y0) > 6)
      .map(p => `<line x1="${p.x0}" y1="${p.y0}" x2="${p.x}" y2="${p.y}"/><circle cx="${p.x0}" cy="${p.y0}" r="2.2"/>`).join("");
    box.insertAdjacentHTML("beforeend", `<svg class="pz-lines" viewBox="0 0 ${W} ${H}" aria-hidden="true">${lines}</svg>`);
    pins.forEach(p => { p.el.style.left = (p.x / W * 100) + "%"; p.el.style.top = (p.y / H * 100) + "%"; box.appendChild(p.el); });
  });

  // on screen, shrink the 1400px sheet to fit the window (printing sets its own size)
  const fit = () => $("#poster").style.setProperty("--fit", Math.min(1, $(".pz-sheet").clientWidth / 1400));
  fit(); addEventListener("resize", fit);

  $("#pzPrint").addEventListener("click", () => print());
  const page = document.createElement("style"); document.head.appendChild(page);
  const setSize = sz => { document.documentElement.dataset.paper = sz; page.textContent = `@page { size: ${sz === "a4" ? "A4" : sz === "letter" ? "letter" : "A3"} landscape; margin: 8mm; }`; };
  setSize("a3");
  $$("[data-size]").forEach(b => b.addEventListener("click", () => {
    setSize(b.dataset.size);
    $$("[data-size]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  }));
  function $$(s) { return [...document.querySelectorAll(s)]; }

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
