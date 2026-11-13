/* ===========================================================
   Photos, videos and sounds (library.html): everything from the
   NASA Image and Video Library on this site, in three tabs with
   one search and a world filter. library.html#videos opens a tab.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const byId = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const VIDEO_FOR = { apollo11: "apollo11", lrv: "apollo15", ingenuity: "ingenuity", marsquake: "insight", meteoroid: "insight", voyager: "voyager1" };

  // ---- items ----
  const seen = new Set(), photos = [];
  ARTIFACTS.forEach(a => a.media.forEach(m => { if (!seen.has(m.f)) { seen.add(m.f); photos.push({ a, m }); } }));
  const videos = Object.entries(VIDEOS).map(([k, v]) => ({ k, v, a: byId[VIDEO_FOR[k]] }));
  const sounds = (typeof SOUNDS !== "undefined" ? SOUNDS : []).map(s => ({ s, a: byId[s.for] }));

  $("#libPhotos").innerHTML = photos.map(({ a, m }, i) => `
    <figure data-w="${a.world}" data-text="${esc((a.name + " " + a.mission + " " + m.cap + " " + m.id).toLowerCase())}">
      <button data-i="${i}"><img src="assets/nasa/${m.f}" alt="${esc(m.cap)}" loading="lazy"></button>
      <figcaption><b>${esc(a.name)}</b>${esc(m.cap)}<br><a href="${NASA_PAGE(m.id)}" target="_blank" rel="noopener">NASA · ${esc(m.id)}</a> · <a href="index.html#artifact=${a.id}">Dossier</a></figcaption>
    </figure>`).join("");

  $("#libVideos").innerHTML = videos.map(({ k, v, a }) => `
    <div class="vcard" data-w="${a ? a.world : "all"}" data-text="${esc((v.title + " " + (a ? a.name : "") + " " + (v.note || "")).toLowerCase())}">
      <button class="vthumb" data-v="${k}" aria-label="Play video: ${esc(v.title)}"><img src="${v.poster}" alt="" loading="lazy"></button>
      <p>${esc(v.title)}<small>${a ? `<a href="index.html#artifact=${a.id}">${esc(a.name)}</a>` : ""}${v.note ? " · " + esc(v.note) : ""} · <a href="${NASA_PAGE(v.id)}" target="_blank" rel="noopener">NASA</a></small></p>
    </div>`).join("");

  $("#libSounds").innerHTML = sounds.map(({ s, a }) => `
    <div class="snd" data-sid="${esc(s.id)}" data-w="${a ? a.world : "all"}" data-text="${esc((s.title + " " + s.what + " " + (a ? a.name : "")).toLowerCase())}">
      <button class="snd-play" aria-label="Play: ${esc(s.title)}"><span class="snd-ic" aria-hidden="true">▶</span></button>
      <div class="snd-body"><b>${esc(s.title)}</b><p>${esc(s.what)}</p>
        <div class="snd-meta"><span class="snd-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="snd-time">tap ▶ to listen</span>
        ${a ? ` · <a href="index.html#artifact=${a.id}">${esc(a.name)}</a>` : ""} · <a href="${NASA_PAGE(s.id)}" target="_blank" rel="noopener">NASA source</a></div></div>
    </div>`).join("");

  $("#nPhotos").textContent = photos.length; $("#nVideos").textContent = videos.length; $("#nSounds").textContent = sounds.length;

  // ---- photos: lightbox ----
  let lbReturn = null;
  $("#libPhotos").addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    const { a, m } = photos[+b.dataset.i];
    lbReturn = b;
    $("#lbImg").src = `assets/nasa/${m.f}`; $("#lbImg").alt = m.cap; $("#lbCap").textContent = `${a.name} — ${m.cap} — NASA · ${m.id}`;
    $("#lightbox").hidden = false; $("#lbClose").focus();
  });
  const closeLb = () => { $("#lightbox").hidden = true; lbReturn?.focus(); };
  $("#lbClose").addEventListener("click", closeLb);
  $("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") closeLb(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#lightbox").hidden) closeLb(); });

  // ---- videos: play in place ----
  $("#libVideos").addEventListener("click", e => {
    const b = e.target.closest(".vthumb"); if (!b) return;
    const v = VIDEOS[b.dataset.v];
    const vid = document.createElement("video");
    vid.controls = true; vid.autoplay = true; vid.playsInline = true; vid.poster = v.poster; vid.src = NASA_VIDEO(v.id);
    vid.setAttribute("aria-label", v.title);
    b.replaceWith(vid); vid.focus();
  });

  // ---- sounds: one plays at a time ----
  let playing = null;
  $$("#libSounds .snd").forEach(card => {
    const s = SOUNDS.find(x => x.id === card.dataset.sid);
    const btn = card.querySelector(".snd-play"), time = card.querySelector(".snd-time"), ic = card.querySelector(".snd-ic");
    let audio = null;
    const stopUI = () => { card.classList.remove("playing"); ic.textContent = "▶"; btn.setAttribute("aria-label", "Play: " + s.title); };
    btn.addEventListener("click", () => {
      if (!audio) {
        audio = new Audio(); audio.preload = "none"; audio.src = NASA_VIDEO(s.id);
        audio.addEventListener("timeupdate", () => { const t = audio.currentTime | 0; time.textContent = `${(t / 60) | 0}:${String(t % 60).padStart(2, "0")}`; });
        audio.addEventListener("ended", stopUI); audio.addEventListener("pause", stopUI);
        audio.addEventListener("waiting", () => (time.textContent = "loading…"));
        audio.addEventListener("error", () => { time.textContent = "couldn't load (needs internet)"; stopUI(); });
      }
      if (!audio.paused) { audio.pause(); return; }
      if (playing && playing !== audio) playing.pause();
      audio.play().catch(() => (time.textContent = "couldn't play"));
      playing = audio;
      card.classList.add("playing"); ic.textContent = "❚❚"; btn.setAttribute("aria-label", "Pause: " + s.title);
    });
  });

  // ---- tabs, search, world filter ----
  let tab = "photos", world = "all";
  const LABEL = { photos: ["photo", "photos"], videos: ["video", "videos"], sounds: ["sound", "sounds"] };
  function apply() {
    const q = $("#libSearch").value.trim().toLowerCase();
    const items = $$(`#${tab} [data-text]`);
    let n = 0;
    items.forEach(el => {
      const show = (world === "all" || el.dataset.w === world) && (!q || q.split(/\s+/).every(w => el.dataset.text.includes(w)));
      el.hidden = !show; if (show) n++;
    });
    const [one, many] = LABEL[tab];
    $("#libCount").textContent = n === items.length ? `${n} ${n === 1 ? one : many}` : `${n} of ${items.length} ${many}`;
    $("#libEmpty").hidden = n > 0;
  }
  function select(t) {
    tab = t;
    $$(".lib-tabs [role=tab]").forEach(b => { const on = b.dataset.tab === t; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; $("#" + b.dataset.tab).hidden = !on; });
    if (location.hash.slice(1) !== t) history.replaceState(null, "", "#" + t);
    if (playing) playing.pause();
    apply();
  }
  $$(".lib-tabs [role=tab]").forEach((b, i, all) => {
    b.addEventListener("click", () => select(b.dataset.tab));
    b.addEventListener("keydown", e => { const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (d) { const n = all[(i + d + all.length) % all.length]; select(n.dataset.tab); n.focus(); } });
  });
  $("#libSearch").addEventListener("input", apply);
  $$(".cat-chips button").forEach(b => b.addEventListener("click", () => {
    world = b.dataset.f; $$(".cat-chips button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); apply();
  }));
  const fromHash = () => { const h = location.hash.slice(1); select(["photos", "videos", "sounds"].includes(h) ? h : "photos"); };
  window.addEventListener("hashchange", fromHash);
  const w0 = new URLSearchParams(location.search).get("world");
  if (["moon", "mars", "deep"].includes(w0)) $(`.cat-chips [data-f="${w0}"]`).click();
  fromHash();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
