/* ===========================================================
   The Moon tonight (moon.html): today's real Moon phase, drawn from
   the NASA Moon map, with every machine on the near side marked and
   whether the Sun is up over it right now. A slider moves the date.
   Phase from the mean synodic month (good to a few hours); the
   Moon's small wobble (libration) is ignored.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const D2R = Math.PI / 180, SYN = 29.530588853, NEW0 = Date.UTC(2000, 0, 6, 18, 14), DAY = 864e5, RATE = 360 / SYN;
  const wrap = d => ((d + 540) % 360) - 180;
  const sites = ARTIFACTS.filter(a => a.world === "moon" && a.lat != null);

  function moonAt(t) {
    const age = (((t - NEW0) / DAY) % SYN + SYN) % SYN, E = age / SYN * 360;
    return { age, E, lit: (1 - Math.cos(E * D2R)) / 2, sub: wrap(180 - E) }; // sub = longitude where the Sun is overhead
  }
  function phaseName(age) {
    const p = [[1.85, "New Moon"], [5.54, "Waxing crescent"], [9.23, "First quarter"], [12.92, "Waxing gibbous"], [16.61, "Full Moon"], [20.3, "Waning gibbous"], [23.99, "Last quarter"], [27.68, "Waning crescent"], [30, "New Moon"]];
    return p.find(([a]) => age < a)[1];
  }
  const WHEN = {
    "New Moon": "It's too close to the Sun to see tonight. Try again in a few days, low in the west after sunset.",
    "Waxing crescent": "Look low in the west just after sunset. It sets a few hours later.",
    "First quarter": "It's high in the sky at sunset and sets around midnight. The best time to look at the Apollo sites along the shadow line.",
    "Waxing gibbous": "Up from the afternoon until after midnight.",
    "Full Moon": "Rises at sunset and is up all night. Every Apollo site is in full sunlight.",
    "Waning gibbous": "Rises in the mid-evening and is still up in the morning.",
    "Last quarter": "Rises around midnight and hangs in the morning sky, even after sunrise.",
    "Waning crescent": "Look low in the east just before dawn."
  };

  // ---- the globe: an orthographic view of the near side, lit from the Sun's direction ----
  const cv = $("#moonCanvas"), ctx = cv.getContext("2d"), N = cv.width, R = N / 2 - 4;
  let tex = null;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    tex = { w: img.width, h: img.height, d: x.getImageData(0, 0, img.width, img.height).data };
    draw();
  };
  img.src = "assets/maps/moon.jpg";

  // precompute lat/lon for each pixel of the disc
  const grid = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const nx = (x + .5 - N / 2) / R, ny = -(y + .5 - N / 2) / R, r2 = nx * nx + ny * ny;
    if (r2 > 1) continue;
    const z = Math.sqrt(1 - r2);
    grid.push([y * N + x, nx, z, Math.asin(ny) / D2R, Math.atan2(nx, z) / D2R]);
  }

  let t = Date.now();
  function draw() {
    const m = moonAt(t), sx = Math.sin(m.sub * D2R), sz = Math.cos(m.sub * D2R);
    if (tex) {
      const out = ctx.createImageData(N, N), o = out.data;
      for (const [i, nx, z, lat, lon] of grid) {
        const u = Math.min(tex.w - 1, ((lon + 180) / 360 * tex.w) | 0), v = Math.min(tex.h - 1, ((90 - lat) / 180 * tex.h) | 0), k = (v * tex.w + u) * 4;
        const l = nx * sx + z * sz;
        const day = l <= -0.02 ? 0 : l >= 0.06 ? 1 : (l + 0.02) / 0.08;
        const b = 0.07 + day * (0.55 + 0.6 * Math.max(0, l)); // faint earthshine on the night side
        o[i * 4] = Math.min(255, tex.d[k] * b); o[i * 4 + 1] = Math.min(255, tex.d[k + 1] * b); o[i * 4 + 2] = Math.min(255, tex.d[k + 2] * b * 1.04); o[i * 4 + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);
    }
    // markers
    $("#moonPins").innerHTML = sites.filter(a => Math.abs(a.lon) <= 90).map(a => {
      const x = Math.cos(a.lat * D2R) * Math.sin(a.lon * D2R), y = Math.sin(a.lat * D2R);
      const up = Math.cos(a.lat * D2R) * Math.cos((a.lon - m.sub) * D2R) > 0;
      return `<a class="mn-pin ${up ? "day" : "night"}" href="#mn-${a.id}" style="left:${50 + x * R / N * 100}%;top:${50 - y * R / N * 100}%" title="${esc(a.name)}"><span>${esc(a.name)}</span></a>`;
    }).join("");
    render(m);
  }

  // ---- the numbers and the list ----
  const span = d => d < 1 ? `${Math.max(1, Math.round(d * 24))} hours` : `${Math.round(d)} ${Math.round(d) === 1 ? "day" : "days"}`;
  function render(m) {
    const name = phaseName(m.age), today = Math.abs(t - Date.now()) < 36e5;
    const date = new Date(t).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $("#mnDate").textContent = today ? "Tonight, " + date : date;
    $("#mnPhase").textContent = name;
    $("#mnLit").textContent = Math.round(m.lit * 100) + "% lit";
    $("#mnAge").textContent = `${m.age.toFixed(1)} days since New Moon`;
    $("#mnWhen").textContent = WHEN[name];
    let lit = 0;
    const rows = sites.map(a => {
      const elev = Math.asin(Math.cos(a.lat * D2R) * Math.cos((a.lon - m.sub) * D2R)) / D2R, d = wrap(a.lon - m.sub), up = elev > 0;
      if (up) lit++;
      const next = up ? `Sunset in ${span((90 - d) / RATE)}` : `Sunrise in ${span((((-90 - d) % 360) + 360) % 360 / RATE)}`;
      const side = Math.abs(a.lon) > 90 ? "Just round the edge: only seen when the Moon tips our way" : Math.abs(a.lat) > 70 ? "Near the pole, where the Sun stays low" : "On the side facing Earth";
      return `<li class="mn-row ${up ? "day" : "night"}" id="mn-${a.id}">
        <span class="mn-dot" aria-hidden="true"></span>
        <span class="mn-name"><a href="index.html#artifact=${a.id}">${esc(a.name)}</a><small>${esc(a.place || "")} · ${side}</small></span>
        <span class="mn-state"><b>${up ? `Daytime · Sun ${Math.round(elev)}° up` : "Night"}</b><small>${next}</small></span>
      </li>`;
    });
    $("#mnList").innerHTML = rows.join("");
    $("#mnCount").textContent = `${lit} of ${sites.length} machines are in sunlight`;
  }

  // ---- date slider ----
  const range = $("#mnDays"), now0 = Date.now();
  range.addEventListener("input", () => {
    const d = +range.value; t = now0 + d * DAY;
    $("#mnDaysOut").textContent = d === 0 ? "Today" : d > 0 ? `${d} ${d === 1 ? "day" : "days"} from now` : `${-d} ${d === -1 ? "day" : "days"} ago`;
    draw();
  });
  $("#mnToday").addEventListener("click", () => { range.value = 0; range.dispatchEvent(new Event("input")); });
  draw();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
