/* ===========================================================
   Scroll to Voyager (voyager.html): the solar system at true scale,
   one pixel for every 500,000 km, from the Sun out to Voyager 1.
   Distances are from the Sun. Planets and probes are drawn as dots
   much bigger than they really are, or you could not see them.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const AU = 1.495978707e8, KM_PX = 5e5, YR = 365.25 * 864e5;
  const px = au => au * AU / KM_PX;
  const auNow = d => d.au2025 + d.rate * ((Date.now() - Date.UTC(2025, 0, 1)) / YR);
  const by = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const names = ids => ids.filter(id => by[id]).map(id => `<a href="index.html#artifact=${id}">${esc(by[id].name)}</a>`).join(", ");
  const W = w => ARTIFACTS.filter(a => a.world === w).map(a => a.id);

  // [name, AU from the Sun, colour, size in px, machines there, note]
  const STOPS = [
    ["Mercury", .387, "#b8a99a", 8, ["messenger"], "MESSENGER crashed here in 2015."],
    ["Venus", .723, "#e8c88a", 11, ["magellan", "pioneervenus"], ""],
    ["Mariner 2's orbit", .86, null, 0, ["mariner2"], "Circling the Sun since 1962."],
    ["Earth", 1, "#5aa9ff", 12, ["vanguard1", "isee3", "kepler", "spitzer"], `The Moon is under one pixel from here, with ${W("moon").length} machines on it.`],
    ["Mariner 4's orbit", 1.33, null, 0, ["mariner4"], ""],
    ["Eros, an asteroid", 1.46, "#a89a8a", 5, ["near"], "Sometimes much closer to Earth, sometimes farther."],
    ["Mars", 1.524, "#ff8a5c", 10, [...W("mars"), "mariner9", "mgs", "mco"], "Every rover humans have ever driven on another planet is in this one pixel."],
    ["Stardust's orbit", 2, null, 0, ["stardust"], ""],
    ["Ceres", 2.77, "#bdb2a2", 6, ["dawn"], "The biggest thing in the asteroid belt."],
    ["Comet Tempel 1", 3.1, "#c9d6e3", 4, ["deepimpact"], "Roughly. Comets swing in and out."],
    ["Jupiter", 5.2, "#d9b38c", 22, ["galileo"], ""],
    ["Saturn", 9.54, "#e6d3a3", 19, ["cassini"], ""],
    ["Uranus", 19.2, "#9fe3e8", 15, [], "Only one spacecraft has ever visited: Voyager 2."],
    ["Neptune", 30.1, "#5b7cff", 15, [], "The last planet. Voyager 2 flew past in 1989."],
    ["Pluto", 39.5, "#cbbba6", 6, [], "On average. New Horizons flew past in 2015."],
    ["Termination shock", 94, null, 0, [], "The solar wind suddenly slows down here."],
    ["Heliopause", 121, null, 0, [], "The edge of the Sun's bubble. Beyond is interstellar space."]
  ];
  const PROBES = ARTIFACTS.filter(a => a.dist).map(a => [a.name, auNow(a.dist), STATUS[a.status].color, 9, [a.id], a.status === "active" ? "Still talking to Earth." : "Silent, still flying."]);
  const FACTS = [
    [.2, "That's the Sun up there. It is about 3 pixels across at this scale."],
    [.6, "Keep going. Space is mostly… space."],
    [1.2, "Light from the Sun took about 8 minutes to get as far as Earth."],
    [4, "Still a long way to Jupiter. Most of the asteroid belt is empty too."],
    [15, "Past Saturn, the planets get very far apart."],
    [45, "Beyond Pluto. Only five working machines have ever come out this far."],
    [75, "Light from the Sun takes more than 10 hours to get this far."],
    [140, "Interstellar space. No spacecraft had been here until Voyager 1 crossed in 2012."]
  ];
  const end = Math.max(...PROBES.map(p => p[1])) + 6;

  const stop = ([name, au, col, size, ids, note], probe) => `
    <div class="sc-stop${probe ? " probe" : ""}${col ? "" : " line"}" style="top:${px(au)}px;--c:${col || "var(--line2)"}" id="at-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">
      ${col ? `<i style="width:${size}px;height:${size}px"></i>` : "<hr>"}
      <div class="sc-lab"><b>${esc(name)}</b><small>${au.toFixed(au < 10 ? 2 : 0)} AU · ${(au * AU / 1e6).toLocaleString("en", { maximumFractionDigits: 0 })} million km</small>
        ${ids.length ? `<p>${names(ids)}</p>` : ""}${note ? `<p class="sc-note">${esc(note)}</p>` : ""}</div>
    </div>`;
  $("#scTrack").style.height = px(end) + "px";
  $("#scTrack").innerHTML = `<div class="sc-sun"></div>`
    + STOPS.map(s => stop(s)).join("") + PROBES.map(p => stop(p, true)).join("")
    + FACTS.map(([au, t]) => `<p class="sc-fact" style="top:${px(au)}px">${esc(t)}</p>`).join("");

  // near the Sun the stops crowd together: push labels down so they never overlap (a line still points to the dot)
  function spread() {
    let bottom = -Infinity;
    [...document.querySelectorAll(".sc-stop")].sort((p, q) => p.offsetTop - q.offsetTop).forEach(s => {
      const lab = s.querySelector(".sc-lab"); lab.style.setProperty("--dy", "0px");
      const top = Math.max(s.offsetTop, bottom + 10), dy = top - s.offsetTop;
      lab.style.setProperty("--dy", dy + "px"); s.classList.toggle("pushed", dy > 4);
      bottom = top + lab.offsetHeight;
    });
  }
  spread(); addEventListener("resize", spread);
  document.fonts?.ready.then(spread);

  // jump list
  const jumps = [["Earth", 1], ["Mars", 1.524], ["Jupiter", 5.2], ["Neptune", 30.1], ...PROBES.map(p => [p[0], p[1]])];
  $("#scJumps").innerHTML = jumps.map(([n, au]) => `<button type="button" data-au="${au}">${esc(n)}</button>`).join("");

  // ---- the read-out, as you scroll ----
  const track = $("#scTrack");
  const hms = s => { const h = (s / 3600) | 0, m = ((s % 3600) / 60) | 0; return h ? `${h} h ${m} min` : m ? `${m} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`; };
  const v1 = PROBES.find(p => p[4][0] === "voyager1");
  function hud() {
    const y = Math.max(0, scrollY + innerHeight * .5 - (track.getBoundingClientRect().top + scrollY));
    const km = y * KM_PX, au = km / AU;
    $("#scKm").textContent = Math.round(km).toLocaleString("en") + " km";
    $("#scAu").textContent = au.toFixed(au < 10 ? 2 : 1) + " AU";
    $("#scLight").textContent = "Light takes " + hms(au * 499);
    $("#scBar").style.setProperty("--p", Math.min(1, au / v1[1]));
  }
  addEventListener("scroll", () => requestAnimationFrame(hud), { passive: true });
  hud();

  // ---- travel buttons ----
  let raf = null, speed = 0, last = 0;
  function go(t) { if (!speed) return; const dt = last ? (t - last) / 1000 : 0; last = t; scrollBy(0, speed * dt); if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) return stopGo(); raf = requestAnimationFrame(go); }
  function stopGo() { speed = 0; cancelAnimationFrame(raf); last = 0; document.querySelectorAll("[data-speed]").forEach(b => b.setAttribute("aria-pressed", "false")); }
  document.querySelectorAll("[data-speed]").forEach(b => b.addEventListener("click", () => {
    const s = +b.dataset.speed * 299792 / KM_PX; // pixels per second
    if (speed === s) return stopGo();
    stopGo(); speed = s; b.setAttribute("aria-pressed", "true"); raf = requestAnimationFrame(go);
  }));
  addEventListener("wheel", stopGo, { passive: true }); addEventListener("touchstart", stopGo, { passive: true });
  $("#scJumps").addEventListener("click", e => {
    const b = e.target.closest("[data-au]"); if (!b) return; stopGo();
    scrollTo({ top: track.getBoundingClientRect().top + scrollY + px(+b.dataset.au) - innerHeight * .5, behavior: "instant" });
  });

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
