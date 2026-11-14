/* ===========================================================
   Mission catalogue (catalogue.html): all missions from the sourced
   catalogue (js/atlas-data.js, generated from 3D Worlds), searchable,
   each opening into its dates, milestones, hardware and sources.
   catalogue.html#apollo-11 opens that mission.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const D = ATLAS_DATA, SRC = D.sources;
  const byMachine = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const WORLD = { moon: "The Moon", mars: "Mars" };
  const worldOf = m => m.target === "moon" ? "moon" : m.target === "mars" ? "mars" : "deep";
  const STATUS = { completed: "Completed", ended: "Ended", operating: "Still working", active: "Still working", lost: "Lost", failed: "Failed", "partial-success": "Partly successful", unknown: "Unknown" };
  const TARGET = { moon: "Moon", mars: "Mars", venus: "Venus", mercury: "Mercury", jupiter: "Jupiter", saturn: "Saturn", titan: "Titan", ceres: "Ceres", vesta: "Vesta", eros: "Eros", sun: "the Sun", earth: "Earth orbit", pluto: "Pluto", interstellar: "Interstellar space", bennu: "Bennu", "9p-tempel-1": "Comet Tempel 1", "81p-wild-2": "Comet Wild 2", comet: "a comet", neptune: "Neptune" };
  const target = t => TARGET[t] || t.replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase());

  // dates: "1969-07-16T13:32:00Z" → "16 Jul 1969, 13:32 UTC"; date-only stays a date
  function fmtDate(v) {
    if (!v || typeof v !== "string") return v ?? "";
    const m = v.match(/^(\d{4})(?:-(\d\d))?(?:-(\d\d))?(?:T(\d\d):(\d\d))?/);
    if (!m) return v;
    const d = new Date(Date.UTC(+m[1], (+m[2] || 1) - 1, +m[3] || 1));
    const opts = m[3] ? { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } : m[2] ? { month: "short", year: "numeric", timeZone: "UTC" } : { year: "numeric", timeZone: "UTC" };
    return d.toLocaleDateString("en-GB", opts) + (m[4] ? `, ${m[4]}:${m[5]} UTC` : "");
  }
  // a sourced fact: its value, plus "not yet sourced" / "sources differ" and its note
  function fact(f, show = fmtDate) {
    if (!f) return "";
    if (f.value == null) return `<span class="cat-unsourced">Not yet sourced</span>${f.note ? `<small>${esc(f.note)}</small>` : ""}`;
    const val = typeof f.value === "object" ? `${Math.abs(f.value.latDeg).toFixed(3)}°${f.value.latDeg < 0 ? "S" : "N"}, ${Math.abs(f.value.lonEastDeg > 180 ? f.value.lonEastDeg - 360 : f.value.lonEastDeg).toFixed(3)}°${(f.value.lonEastDeg > 180 ? f.value.lonEastDeg - 360 : f.value.lonEastDeg) < 0 ? "W" : "E"}` : show(f.value);
    return `${esc(val)}${f.status === "conflicting" ? ' <span class="cat-flag">sources differ</span>' : ""}${f.note ? `<small>${esc(f.note)}</small>` : ""}`;
  }
  const srcLinks = ids => [...new Set(ids)].filter(id => SRC[id]).map(id => `<a href="${esc(SRC[id].url)}" target="_blank" rel="noopener" title="${esc(SRC[id].title)}">${esc(SRC[id].organisation?.split(/[ ,(]/)[0] || "source")}</a>`).join(" ");

  function rowHTML(m) {
    const w = worldOf(m), machines = (MISSION_MACHINES[m.id] || []).filter(id => byMachine[id]);
    const site = ATLAS_DATA.sites.find(s => s.missionIds.includes(m.id));
    const relive = ATLAS_RELIVE_BY_MISSION[m.id];
    const allSrc = [...m.launch.sources, ...(m.landing?.sources || []), ...(m.arrival?.sources || []), ...(m.end?.sources || []), ...m.status.sources,
      ...m.milestones.flatMap(x => x.sources), ...m.objects.flatMap(o => o.sources)];
    const facts = [
      ["Launch", fact(m.launch)], m.arrival && ["Arrival", fact(m.arrival)], m.landing && ["Landing", fact(m.landing)],
      m.end && ["End", fact(m.end)], ["Status", fact(m.status, v => STATUS[v] || v)],
      m.landingSite && ["Landing site", fact(m.landingSite)], m.actualDuration && ["Time there", fact(m.actualDuration, v => v)]
    ].filter(Boolean);
    return `<details class="cat-row" id="${esc(m.id)}" data-w="${w}" role="listitem">
      <summary>
        <span class="cat-dot ${w}" aria-hidden="true"></span>
        <span class="cat-name"><b>${esc(m.name)}</b><small>${esc(m.agency)}${m.nasaMission ? "" : " · not NASA"} · ${esc(target(m.target))}</small></span>
        <span class="cat-date">${esc(fmtDate(m.launch.value))}</span>
        <span class="cat-status s-${esc(m.status.value || "unknown")}">${m.status.value ? esc(STATUS[m.status.value] || m.status.value) : "Not yet sourced"}</span>
        <span class="cat-tags">${site ? `<span class="cat-tag land">${ico("footprints")} Landing site</span>` : ""}${relive ? `<span class="cat-tag relive">${ico("play")} Replay</span>` : ""}</span>
      </summary>
      <div class="cat-body">
        <p class="cat-summary">${esc(m.summary)}</p>
        ${m.nonNasaNote ? `<p class="cat-note">${esc(m.nonNasaNote)}</p>` : ""}
        <dl class="cat-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
        ${m.milestones.length ? `<h3>Milestones</h3><ol class="cat-miles">${m.milestones.map(x => `<li><time>${esc(fmtDate(x.date))}</time><div><b>${esc(x.title)}</b><span>${esc(x.description)}</span></div></li>`).join("")}</ol>` : ""}
        ${m.objects.length ? `<h3>Hardware left behind</h3><ul class="cat-hw">${m.objects.map(o => `<li><b>${esc(o.name)}</b>${o.builtBy && o.builtBy !== "NASA" ? ` <span class="cat-flag">built by ${esc(o.builtBy)}</span>` : ""}<span>${esc(o.design)}</span>${o.components.length ? `<span class="cat-parts">${o.components.map(esc).join(" · ")}</span>` : ""}</li>`).join("")}</ul>` : ""}
        <p class="cat-src"><b>Sources:</b> ${srcLinks(allSrc) || "listed in the record"}</p>
        <div class="cat-actions">
          ${machines.map(id => `<a class="btn btn-small" href="index.html#artifact=${id}">${typeIco(byMachine[id].type)} ${esc(byMachine[id].name)} dossier</a>`).join("")}
          ${site ? `<a class="btn btn-small btn-primary" data-atlas="site:${esc(site.id)}" href="atlas/index.html?go=site&amp;id=${esc(site.id)}">${ico("footprints")} Land here in 3D</a>` : ""}
          ${relive ? `<a class="btn btn-small" data-atlas="relive:${esc(relive)}" href="atlas/index.html?go=relive&amp;id=${esc(relive)}">${ico("play")} Relive it in 3D</a>` : ""}
        </div>
      </div>
    </details>`;
  }

  const sorted = D.missions.slice().sort((a, b) => String(a.launch.value).localeCompare(String(b.launch.value)));
  $("#catList").innerHTML = sorted.map(rowHTML).join("");
  $("#catLede").textContent = `${D.missions.length} missions behind the machines in this archive, from Mariner 2 in 1962 to today. Launch, landing and end dates are checked against NASA, NSSDCA and partner-agency records; open a mission for its milestones, the hardware it left behind and the documents every fact comes from.`;

  // search + destination filter
  let filter = "all";
  const text = Object.fromEntries(sorted.map(m => [m.id, [m.name, m.agency, target(m.target), m.summary, m.launch.value, ...m.objects.map(o => o.name)].join(" ").toLowerCase()]));
  function apply() {
    const q = $("#catSearch").value.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll(".cat-row").forEach(r => {
      const show = (filter === "all" || r.dataset.w === filter) && (!q || q.split(/\s+/).every(w => text[r.id].includes(w)));
      r.hidden = !show; if (show) n++;
    });
    $("#catCount").textContent = n === D.missions.length ? `${n} missions` : `${n} of ${D.missions.length} missions`;
  }
  $("#catSearch").addEventListener("input", apply);
  document.querySelectorAll(".cat-chips button").forEach(b => b.addEventListener("click", () => {
    filter = b.dataset.f;
    document.querySelectorAll(".cat-chips button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  }));
  apply();

  // catalogue.html#mission-id opens and shows that mission
  const openHash = () => { const r = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (r?.classList.contains("cat-row")) { r.open = true; r.scrollIntoView({ block: "start" }); } };
  window.addEventListener("hashchange", openHash);
  openHash();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
