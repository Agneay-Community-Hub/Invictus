/* ===========================================================
   Live tracker (tracker.html): where the five far travellers are
   right now. Distances tick up live from each probe's 2025 distance
   and average speed (data.js "dist"), so they are good estimates,
   not navigation data. NASA Eyes (eyes.html) has the exact orbits.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const AU = 1.495978707e8, YR = 365.25 * 864e5, C_AU_S = 499.005; // seconds for light to cross 1 AU
  const auAt = (d, t) => d.au2025 + d.rate * ((t - Date.UTC(2025, 0, 1)) / YR);
  const kmS = d => d.rate * AU / (YR / 1000);
  const cover = a => a.media && a.media[0] ? "assets/nasa/" + a.media[0].f : null;
  const thumb = a => a.media && a.media[0] ? "assets/nasa/thumb/" + a.media[0].f.replace(/\.\w+$/, ".jpg") : null; // small copy for cards (scripts/build-thumbs.py)
  const pill = s => `<span class="pill" style="color:${STATUS[s].color}">${STATUS[s].label}</span>`;
  const hms = s => { s = Math.max(0, Math.round(s)); const h = (s / 3600) | 0, m = ((s % 3600) / 60) | 0, x = s % 60; return `${h}h ${String(m).padStart(2, "0")}m ${String(x).padStart(2, "0")}s`; };
  const n0 = n => Math.round(n).toLocaleString("en");
  const opened = Date.now();

  const probes = ARTIFACTS.filter(a => a.dist).sort((p, q) => auAt(q.dist, opened) - auAt(p.dist, opened));

  // ---- ruler: log scale from 0.3 to 300 AU ----
  const lo = Math.log10(0.3), hi = Math.log10(300);
  const X = au => ((Math.log10(au) - lo) / (hi - lo)) * 100;
  const planets = [["Earth", 1, "#5aa9ff"], ["Jupiter", 5.2, "#d9b38c"], ["Saturn", 9.54, "#e6d3a3"], ["Neptune", 30.1, "#5b7cff"], ["Pluto", 39.5, "#cbbba6"]];
  $("#trRuler").innerHTML = `
    <div class="tr-zone" style="left:${X(120)}%"><span>Interstellar space →</span></div>
    <div class="tr-axis"></div>
    <i class="tr-sun" style="left:0"></i>
    ${planets.map(([n, au, c], i) => `<div class="tr-pl" style="left:${X(au)}%;--c:${c}"><i></i><span class="${i % 2 ? "lo" : ""}">${n}</span></div>`).join("")}
    ${probes.map((a, i) => `<a class="tr-dot" href="#tr-${a.id}" id="dot-${a.id}" style="--c:${STATUS[a.status].color};--row:${i}"><i></i><span>${esc(a.name)}</span></a>`).join("")}`;

  // ---- one card per probe ----
  $("#trCards").innerHTML = probes.map(a => `
    <article class="tr-card" id="tr-${a.id}">
      <div class="tr-media">${cover(a) ? `<img src="${thumb(a)}" alt="" loading="lazy" decoding="async">` : typeIco(a.type)}</div>
      <div class="tr-body">
        <div class="tr-head">${pill(a.status)}<h2>${esc(a.name)}</h2><p>Launched ${a.year} · ${esc(a.heading || "")}</p></div>
        <dl class="tr-nums" data-live>
          <div class="tr-km"><dt>Distance from the Sun</dt><dd><span data-km="${a.id}">…</span> km</dd></div>
          <div><dt>In astronomical units</dt><dd><span data-au="${a.id}">…</span> AU</dd></div>
          <div><dt>Light from there takes</dt><dd data-lt="${a.id}">…</dd></div>
          <div><dt>Speed (average)</dt><dd>${kmS(a.dist).toFixed(1)} km/s · ${n0(kmS(a.dist) * 3600)} km/h</dd></div>
        </dl>
        <p class="tr-since" data-live>Since you opened this page it has travelled <b data-since="${a.id}">0</b> km.</p>
        <div class="tr-actions">
          ${a.status === "active" ? `<button class="btn btn-small tr-hello" data-hello="${a.id}">${ico("chat")} Send it a hello</button>` : `<span class="tr-silent">Silent since ${esc(String(a.dates.last).replace(/\s*\(.*\)/, ""))}. It keeps flying anyway.</span>`}
          <a class="btn btn-small" href="index.html#artifact=${a.id}">${ico("book")} Dossier</a>
          <a class="btn btn-small" href="compare.html?a=${a.id}">${ico("compare")} Compare</a>
        </div>
        <p class="tr-msg" data-live data-msg="${a.id}" aria-live="polite" hidden></p>
      </div>
    </article>`).join("");

  // ---- "send a hello": a countdown until the signal would arrive ----
  const sent = {};
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-hello]"); if (!b) return;
    const a = probes.find(p => p.id === b.dataset.hello), now = Date.now();
    sent[a.id] = { at: now, arrive: now + auAt(a.dist, now) * C_AU_S * 1000 };
    b.disabled = true; b.innerHTML = `${ico("chat")} Hello sent`;
  });

  // ---- tick ----
  function tick() {
    const now = Date.now();
    for (const a of probes) {
      const au = auAt(a.dist, now);
      document.querySelector(`[data-km="${a.id}"]`).textContent = n0(au * AU);
      document.querySelector(`[data-au="${a.id}"]`).textContent = au.toFixed(4);
      document.querySelector(`[data-lt="${a.id}"]`).textContent = hms(au * C_AU_S);
      document.querySelector(`[data-since="${a.id}"]`).textContent = n0(kmS(a.dist) * (now - opened) / 1000);
      $("#dot-" + a.id).style.left = X(au) + "%";
      const s = sent[a.id], msg = document.querySelector(`[data-msg="${a.id}"]`);
      if (s) {
        msg.hidden = false;
        const left = (s.arrive - now) / 1000;
        msg.innerHTML = left > 0
          ? `Your hello is on its way at the speed of light. It reaches ${esc(a.name)} in <b>${hms(left)}</b>, at ${new Date(s.arrive).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })} your time. A reply would take just as long to come back.`
          : `Your hello has reached ${esc(a.name)}. A reply would land on Earth at ${new Date(s.arrive + (s.arrive - s.at)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
      }
    }
    const far = probes[0];
    $("#trLead").innerHTML = `${esc(far.name)} is the farthest: light from it takes <b>${hms(auAt(far.dist, now) * C_AU_S)}</b> to reach us.`;
  }
  tick();
  setInterval(tick, 200);

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
