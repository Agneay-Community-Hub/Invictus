/* ===========================================================
   Landing sites (landings.html): every 3D landing simulation from
   3D Worlds (js/atlas-data.js), searchable, each one launched with a
   "Land here" button. The two mission replays are listed below.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const D = ATLAS_DATA;
  const mission = Object.fromEntries(D.missions.map(m => [m.id, m]));
  const byMachine = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const coord = (lat, lon) => { const e = lon > 180 ? lon - 360 : lon; return `${Math.abs(lat).toFixed(2)}°${lat < 0 ? "S" : "N"}, ${Math.abs(e).toFixed(2)}°${e < 0 ? "W" : "E"}`; };
  // a photo for each site: the first NASA photo of the matching machine in our archive
  const photo = s => {
    for (const mid of s.missionIds) for (const id of MISSION_MACHINES[mid] || []) { const m = byMachine[id]?.media?.[0]; if (m) return `assets/nasa/${m.f}`; }
    return `assets/maps/${s.body === "mars" ? "mars-sm" : "moon-sm"}.jpg`;
  };
  const MODE = { walk: ["footprints", "On foot"], drive: ["rover", "Drive a rover (conceptual)"] };

  function siteCard(s) {
    const ms = s.missionIds.map(id => mission[id]).filter(Boolean);
    const name = s.name.split(" — ");
    const what = s.summary || (s.body === "moon" ? `Walk around ${ms[0]?.name || "the site"} as an astronaut, among the lunar module and the science stations at their measured positions.` : "");
    const [mi, ml] = s.body === "moon" ? MODE.walk : MODE[s.mode] || MODE.walk;
    const dossier = (MISSION_MACHINES[s.missionIds[0]] || [])[0];
    return `<article class="land-card" data-w="${s.body}" data-text="${esc([s.name, ...ms.map(m => m.name), what, s.hardware, s.body].join(" ").toLowerCase())}">
      <div class="land-img"><img src="${photo(s)}" alt="" loading="lazy"><span class="land-world ${s.body}">${s.body === "moon" ? "Moon" : "Mars"}</span></div>
      <div class="land-body">
        <h3>${esc(name[1] || name[0])}</h3>
        <p class="land-place">${esc(name[1] ? name[0] : ms.map(m => m.name).join(", "))} · ${coord(s.lat, s.lon)}</p>
        ${what ? `<p class="land-what">${esc(what)}</p>` : ""}
        <ul class="land-meta">
          <li>${ico(mi)} ${ml}</li>
          ${s.scene ? `<li>${ico("calendar")} ${esc(s.scene)}</li>` : ""}
          ${s.hardware ? `<li>${typeIco(s.body === "mars" ? "lander" : "lander")} ${esc(s.hardware)}</li>` : ""}
        </ul>
        <div class="land-actions">
          <a class="btn btn-small btn-primary" data-atlas="site:${esc(s.id)}" href="atlas/index.html?go=site&amp;id=${esc(s.id)}">${ico("footprints")} Land here</a>
          ${ms[0] ? `<a class="btn btn-small" href="catalogue.html#${esc(ms[0].id)}">${ico("book")} Mission record</a>` : ""}
          ${dossier && byMachine[dossier] ? `<a class="btn btn-small" href="index.html#artifact=${dossier}">${typeIco(byMachine[dossier].type)} Dossier</a>` : ""}
        </div>
      </div>
    </article>`;
  }

  const order = { moon: 0, mars: 1 };
  const sites = D.sites.slice().sort((a, b) => order[a.body] - order[b.body]);
  $("#landGrid").innerHTML = sites.map(siteCard).join("");

  // the two full-mission replays
  const REPLAYS = [
    { id: "apollo-11", img: "as11-40-5903.jpg", title: "Apollo 11", sub: "16–24 July 1969 · from launch to splashdown", what: "Watch the whole first Moon landing mission step by step, with NASA's records behind every event." },
    { id: "mer-opportunity", img: "PIA22222.jpg", title: "Opportunity", sub: "2003–2018 · launch to last contact", what: "Fourteen years on Mars, drive by drive, including her two years at Victoria crater." }
  ];
  $("#reliveGrid").innerHTML = REPLAYS.map(r => `<article class="land-card" data-w="replay">
      <div class="land-img"><img src="assets/nasa/${r.img}" alt="" loading="lazy"><span class="land-world replay">Replay</span></div>
      <div class="land-body"><h3>${esc(r.title)}</h3><p class="land-place">${esc(r.sub)}</p><p class="land-what">${esc(r.what)}</p>
        <div class="land-actions">
          <a class="btn btn-small btn-primary" data-atlas="relive:${r.id}" href="atlas/index.html?go=relive&amp;id=${r.id}">${ico("play")} Relive it</a>
          <a class="btn btn-small" href="catalogue.html#${r.id}">${ico("book")} Mission record</a>
        </div></div></article>`).join("");

  // search + world filter
  let filter = "all";
  function apply() {
    const q = $("#landSearch").value.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll("#landGrid .land-card").forEach(c => {
      const show = (filter === "all" || c.dataset.w === filter) && (!q || q.split(/\s+/).every(w => c.dataset.text.includes(w)));
      c.hidden = !show; if (show) n++;
    });
    $("#landCount").textContent = n === sites.length ? `${n} landing sites` : n ? `${n} of ${sites.length} landing sites` : "No landing site matches. Try another word.";
  }
  $("#landSearch").addEventListener("input", apply);
  document.querySelectorAll(".cat-chips button").forEach(b => b.addEventListener("click", () => {
    filter = b.dataset.f;
    document.querySelectorAll(".cat-chips button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  }));
  apply();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
