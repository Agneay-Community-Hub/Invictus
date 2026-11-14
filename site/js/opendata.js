/* ===========================================================
   Open data and embeds (data.html): download the archive as CSV or
   JSON for school projects and charts, and build an embed code to
   show a machine (or the Ghost of the day) on another website.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const SITE = new URL(".", location.href).href;

  // ---- datasets ----
  const A = ARTIFACTS, M = (typeof ATLAS_DATA !== "undefined" ? ATLAS_DATA : { missions: [], sites: [] });
  const v = x => x && typeof x === "object" && "value" in x ? x.value : x ?? "";
  const SETS = {
    machines: {
      title: "Machines", note: "All 49 machines, one row each: where they are, when they flew and how they ended.",
      rows: () => A.map(a => ({
        id: a.id, name: a.name, mission: a.mission, world: a.world, type: a.type, status: a.status, year: a.year,
        launch: a.dates.launch, arrival: a.dates.arrive, last_contact: a.dates.last,
        latitude: a.lat ?? "", longitude: a.lon ?? "", where: a.place || a.fixedPlace || a.heading || "",
        planned: a.planned, what_happened: a.actual, epitaph: a.epitaph,
        nasa_image_ids: (a.media || []).map(m => m.id).join(" "), page: SITE + "index.html#artifact=" + a.id
      }))
    },
    missions: {
      title: "Missions", note: "44 missions from the mission catalogue, with launch and landing dates (UTC).",
      rows: () => M.missions.map(m => ({ id: m.id, name: m.name, agency: m.agency, nasa_mission: m.nasaMission ? "yes" : "no", target: m.target, launch: v(m.launch), arrival: v(m.arrival), landing: v(m.landing), page: SITE + "catalogue.html#" + m.id }))
    },
    sites: {
      title: "Landing sites", note: "14 landing sites with coordinates (degrees, east-positive longitude).",
      rows: () => M.sites.map(s => ({ id: s.id, name: s.name, body: s.body, latitude: s.lat, longitude: s.lon, missions: (s.missionIds || []).join(" ") }))
    },
    photos: {
      title: "Photos", note: "Every NASA photo on the site, with its NASA ID and a link to the original record.",
      rows: () => { const seen = new Set(), out = []; A.forEach(a => (a.media || []).forEach(m => { if (seen.has(m.f)) return; seen.add(m.f); out.push({ machine: a.id, nasa_id: m.id, caption: m.cap, nasa_page: NASA_PAGE(m.id), file: SITE + "assets/nasa/" + m.f }); })); return out; }
    }
  };
  const csv = rows => { const cols = Object.keys(rows[0] || {}); const q = x => { const s = String(x ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }; return [cols.join(","), ...rows.map(r => cols.map(c => q(r[c])).join(","))].join("\r\n"); };
  function download(name, text, type) { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }

  $("#odSets").innerHTML = Object.entries(SETS).map(([k, s]) => {
    const rows = s.rows();
    const cols = Object.keys(rows[0] || {});
    return `<article class="od-set" id="set-${k}">
      <header><h2>${esc(s.title)} <span class="lib-n">${rows.length}</span></h2>
        <div class="od-btns"><button class="btn btn-small" data-dl="${k}" data-fmt="csv">${ico("download")} CSV</button><button class="btn btn-small" data-dl="${k}" data-fmt="json">${ico("download")} JSON</button></div></header>
      <p>${esc(s.note)} Columns: ${cols.map(c => `<code>${c}</code>`).join(" ")}</p>
      <div class="od-table"><table><thead><tr>${cols.slice(0, 6).map(c => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${rows.slice(0, 5).map(r => `<tr>${cols.slice(0, 6).map(c => `<td>${esc(String(r[c]).slice(0, 60))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    </article>`;
  }).join("");
  $("#odSets").addEventListener("click", e => {
    const b = e.target.closest("[data-dl]"); if (!b) return;
    const rows = SETS[b.dataset.dl].rows(), name = "ghosts-of-exploration-" + b.dataset.dl;
    if (b.dataset.fmt === "csv") download(name + ".csv", "﻿" + csv(rows), "text/csv");
    else download(name + ".json", JSON.stringify(rows, null, 2), "application/json");
  });
  $("#odAll").addEventListener("click", () => download("ghosts-of-exploration.json", JSON.stringify(Object.fromEntries(Object.entries(SETS).map(([k, s]) => [k, s.rows()])), null, 2), "application/json"));

  // ---- embed builder ----
  const sel = $("#emWhich");
  sel.innerHTML = `<option value="today">Ghost of the day (changes daily)</option>` + Object.keys(WORLDS).map(w => `<optgroup label="${esc(WORLDS[w].name)}">${A.filter(a => a.world === w).map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</optgroup>`).join("");
  function build() {
    const id = sel.value, wide = $("#emWide").checked;
    const src = `${SITE}embed.html?${id === "today" ? "today" : "id=" + id}`;
    const w = wide ? 560 : 320, h = wide ? 220 : 420;
    $("#emCode").value = `<iframe src="${src}" width="${w}" height="${h}" style="border:0;border-radius:16px;max-width:100%" title="Ghosts of Exploration" loading="lazy"></iframe>`;
    $("#emPreview").innerHTML = `<iframe src="embed.html?${id === "today" ? "today" : "id=" + id}" width="${w}" height="${h}" style="border:0;border-radius:16px;max-width:100%" title="Preview"></iframe>`;
  }
  sel.addEventListener("change", build); $("#emWide").addEventListener("change", build);
  $("#emCopy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#emCode").value); $("#emCopy").textContent = "Copied!"; }
    catch { $("#emCode").select(); document.execCommand("copy"); $("#emCopy").textContent = "Copied!"; }
    setTimeout(() => ($("#emCopy").textContent = "Copy code"), 1800);
  });
  build();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
