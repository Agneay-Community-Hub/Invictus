/* ===========================================================
   "Start here" (home page): six curated stops through the best of the
   site. Remembers which stops were visited (this browser only) and
   shows progress; "start over" clears it.
   =========================================================== */
(() => {
  const box = document.getElementById("start");
  if (!box) return;
  const T = (k, f) => (window.t ? t(k, f) : f);
  const KEY = "goe-start";
  const stops = [...box.querySelectorAll(".start-stop")];
  const read = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); } };
  const save = v => { try { localStorage.setItem(KEY, JSON.stringify([...v])); } catch { /* private mode */ } };
  let seen = read();
  const progress = document.getElementById("startProgress");
  function render() {
    stops.forEach(li => {
      const done = seen.has(li.dataset.stop);
      li.classList.toggle("done", done);
      const a = li.querySelector(".ss-link");
      if (done) a.setAttribute("aria-description", T("start.visited", "visited")); else a.removeAttribute("aria-description");
    });
    const n = stops.filter(li => seen.has(li.dataset.stop)).length;
    progress.innerHTML = !n ? "" : n === stops.length
      ? `${T("start.allDone", "You've visited all six stops. There's plenty more to explore below!")} <button type="button" class="linklike" id="startReset">${T("start.reset", "Start over")}</button>`
      : `${T("start.progress", "{n} of {t} stops visited").replace("{n}", n).replace("{t}", stops.length)} · <button type="button" class="linklike" id="startReset">${T("start.reset", "Start over")}</button>`;
    progress.querySelector("#startReset")?.addEventListener("click", () => { seen = new Set(); save(seen); render(); });
  }
  // any link inside a stop counts as visiting it; the whole card is clickable through its title link
  stops.forEach(li => {
    li.addEventListener("click", e => {
      if (!e.target.closest("a")) { li.querySelector(".ss-link").click(); return; }
      seen.add(li.dataset.stop); save(seen); render();
    });
  });
  render();
})();
