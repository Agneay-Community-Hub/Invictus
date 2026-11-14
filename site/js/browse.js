/* ===========================================================
   All machines (browse.html): the 49 machines as cards, with search,
   world chips, type / status filters and sorting. Cards open the
   dossier on the home page. browse.html?world=deep starts filtered.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cover = a => a.media && a.media[0] ? "assets/nasa/" + a.media[0].f : null;
  const pill = s => `<span class="pill" style="color:${STATUS[s].color}">${STATUS[s].label}</span>`;
  const where = a => a.place || a.fixedPlace || a.heading || "";

  $("#brGrid").innerHTML = ARTIFACTS.map(a => `
    <a class="card br-card" href="index.html#artifact=${a.id}" data-id="${a.id}" data-w="${a.world}" data-type="${a.type}" data-status="${a.status}" data-year="${a.year}" data-name="${esc(a.name.toLowerCase())}"
       data-text="${esc([a.name, a.mission, a.year, where(a), TYPES[a.type], WORLDS[a.world].name, STATUS[a.status].label, a.body || ""].join(" ").toLowerCase())}">
      ${cover(a) ? `<img src="${cover(a)}" alt="" loading="lazy">` : `<span class="ph">${typeIco(a.type)}</span>`}
      <span class="card-body">${pill(a.status)}<b>${esc(a.name)}</b>
        <p>${esc(TYPES[a.type])} · ${esc(WORLDS[a.world].short)} · ${a.year}</p>
        <p class="br-where">${esc(where(a))}</p></span>
    </a>`).join("");

  // filter menus from the data, with counts
  const count = (k, v) => ARTIFACTS.filter(a => a[k] === v).length;
  $("#brType").insertAdjacentHTML("beforeend", Object.keys(TYPES).filter(k => count("type", k)).map(k => `<option value="${k}">${esc(TYPES_PLURAL?.[k] || TYPES[k])} (${count("type", k)})</option>`).join(""));
  $("#brStatus").insertAdjacentHTML("beforeend", Object.keys(STATUS).filter(k => count("status", k)).map(k => `<option value="${k}">${esc(STATUS[k].label)} (${count("status", k)})</option>`).join(""));

  let world = "all";
  function apply() {
    const q = $("#brSearch").value.trim().toLowerCase(), type = $("#brType").value, status = $("#brStatus").value, sort = $("#brSort").value;
    const cards = $$("#brGrid .br-card");
    let n = 0;
    cards.forEach(c => {
      const show = (world === "all" || c.dataset.w === world) && (!type || c.dataset.type === type) && (!status || c.dataset.status === status)
        && (!q || q.split(/\s+/).every(w => c.dataset.text.includes(w)));
      c.hidden = !show; if (show) n++;
    });
    cards.sort((a, b) => sort === "name" ? a.dataset.name.localeCompare(b.dataset.name) : sort === "new" ? b.dataset.year - a.dataset.year : a.dataset.year - b.dataset.year)
      .forEach(c => $("#brGrid").appendChild(c));
    $("#brCount").textContent = n === cards.length ? `${n} machines` : `${n} of ${cards.length} machines`;
    $("#brEmpty").hidden = n > 0;
  }
  $("#brSearch").addEventListener("input", apply);
  ["#brType", "#brStatus", "#brSort"].forEach(s => $(s).addEventListener("change", apply));
  $$(".cat-chips button").forEach(b => b.addEventListener("click", () => {
    world = b.dataset.f; $$(".cat-chips button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); apply();
  }));
  const p = new URLSearchParams(location.search);
  if (["moon", "mars", "deep"].includes(p.get("world"))) $(`.cat-chips [data-f="${p.get("world")}"]`).click();
  if (p.get("q")) $("#brSearch").value = p.get("q");
  apply();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
