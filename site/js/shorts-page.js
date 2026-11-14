/* ===========================================================
   Ghost Shorts page (shorts.html): every cartoon video made so far,
   with an inline player and subtitles. shorts.html#viking1 opens one.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const byId = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const ids = Object.keys(SHORTS);

  function play(id) {
    const s = SHORTS[id], a = byId[id]; if (!s) return;
    $("#gsPlayer").innerHTML = `
      <video controls playsinline preload="metadata" poster="${s.poster}"><source src="${s.src}" type="video/mp4"><track kind="captions" srclang="en" label="English" src="${s.vtt}" default></video>
      <div class="gs-info"><h2>${esc(s.title)}</h2><p>${esc(s.length)} · subtitles on · ${a ? `${esc(TYPES[a.type])} · ${esc(WORLDS[a.world].short)} · ${a.year}` : ""}</p>
        ${a ? `<p class="gs-ep">“${esc(a.epitaph)}”</p><div class="gs-links"><a class="btn btn-small" href="index.html#artifact=${id}">${ico("book")} Read its story</a></div>` : ""}</div>`;
    document.querySelectorAll(".gs-card").forEach(c => c.setAttribute("aria-current", String(c.dataset.id === id)));
    history.replaceState(null, "", "#" + id);
  }

  $("#gsGrid").innerHTML = ids.map(id => `
    <button type="button" class="gs-card" data-id="${id}"><img src="${SHORTS[id].poster}" alt="" loading="lazy"><span class="gs-play" aria-hidden="true">▶</span>
      <b>${esc(SHORTS[id].title)}</b><small>${esc(SHORTS[id].length)} · with subtitles</small></button>`).join("");
  $("#gsGrid").addEventListener("click", e => { const c = e.target.closest(".gs-card"); if (c) { play(c.dataset.id); $("#gsPlayer").scrollIntoView({ behavior: "smooth", block: "start" }); $("#gsPlayer video")?.play().catch(() => {}); } });
  $("#gsCount").textContent = `${ids.length} of ${ARTIFACTS.length} machines have a short so far. More are on the way.`;
  play(ids.includes(location.hash.slice(1)) ? location.hash.slice(1) : ids[0]);

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
