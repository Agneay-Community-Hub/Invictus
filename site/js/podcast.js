/* ===========================================================
   Podcast player (podcast.html). There are no recordings yet, so the
   episodes are performed live by the browser: each character gets its
   own voice settings, sound effects are made with Web Audio, and the
   transcript highlights each line as it plays. Seasons come from
   js/podcast-seasons.js. Progress and quiz answers stay in this
   browser. Links: podcast.html#insight/mole opens an episode.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const byId = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const coverOf = id => byId[id]?.media?.[0] ? "assets/nasa/" + byId[id].media[0].f : null;
  const KEY = "goe-podcast";
  const store = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { } };
  store.done ??= {}; store.quiz ??= {};
  // Season 1 saved its progress without a season prefix
  for (const k of Object.keys(store.done)) if (!k.includes("/")) { store.done["voyager/" + k] = 1; delete store.done[k]; }
  for (const k of Object.keys(store.quiz)) if (!k.includes("/")) { store.quiz["voyager/" + k] = store.quiz[k]; delete store.quiz[k]; }

  let S = SEASONS[0], EP = S.episodes;
  const key = e => `${S.id}/${e.id}`;
  const starName = () => S.radio ? "Ghost Log Radio" : S.id === "voyager" ? "Voyager" : S.id === "apollo" ? "Mission Control" : (byId[S.star]?.name || "The spacecraft");

  // ---- voices: one per character, plus a different pitch for each narrator ----
  let voices = [];
  const loadVoices = () => { voices = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang)); };
  if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  const nice = re => voices.find(v => re.test(v.name));
  function voiceFor(sp, i) {
    const pool = voices.length ? voices : [null];
    const pick = {
      N: nice(/natural|aria|jenny|samantha|google us/i) || pool[0],
      V: nice(/guy|daniel|david|google uk english male|fred/i) || pool[1 % pool.length],
      T: nice(/ryan|mark|alex|google uk english female|zira/i) || pool[2 % pool.length],
      K: nice(/ana|child|kid|libby|sonia|susan|google uk english female/i) || pool[3 % pool.length]
    }[sp];
    const pitch = { N: .85 + (i % 5) * .12, V: .6, T: 1, K: 1.45 }[sp], rate = { N: .96, V: .86, T: 1.02, K: 1.05 }[sp];
    return { voice: pick, pitch, rate };
  }

  // ---- sound effects, made on the fly ----
  let ac = null;
  const ctx = () => (ac ??= new (window.AudioContext || window.webkitAudioContext)());
  function tone(type, f0, f1, dur, vol = .15, when = 0) {
    const c = ctx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, vol = .12, freq = 1800, q = .7) {
    const c = ctx(), b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start();
  }
  const SFX = {
    jingle: () => { [523, 659, 784, 1047].forEach((f, i) => tone("triangle", f, 0, .5, .12, i * .16)); return 1100; },
    beep: () => { tone("sine", 880, 0, .15, .14); tone("sine", 880, 0, .15, .14, .25); return 600; },
    click: () => { tone("square", 220, 60, .12, .1); noise(.08, .1, 3000); return 700; },
    static: () => { noise(.9, .09, 2400, .4); return 900; },
    sweep: () => { tone("sine", 2600, 420, 1.8, .12); tone("sine", 1800, 300, 1.6, .06, .3); return 2100; },
    hum: () => { tone("sawtooth", 70, 72, 1.6, .05); tone("sine", 140, 140, 1.6, .05); return 1500; },
    boom: () => { tone("sine", 120, 30, 1, .3); noise(.6, .15, 400); return 1000; },
    wind: () => { noise(2, .1, 500, .3); return 1800; }
  };

  // ---- the picture: a Voyager diagram for Season 1, the machine's photo for the others ----
  const PART = {
    platform: { x: 318, y: 214, label: "Scan platform" }, boom: { x: 246, y: 186, label: "Science boom" },
    antennas: { x: 150, y: 70, label: "Radio antennas" }, mag: { x: 52, y: 238, label: "Magnetometer boom" }, dish: { x: 200, y: 92, label: "High-gain dish" }
  };
  const VOYAGER_SVG = `<svg viewBox="0 0 400 300" role="img" aria-label="Voyager, with the instrument you're listening to highlighted">
    <g fill="none" stroke="#9eabc2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M200 160 L50 250" stroke-width="1.6"/><path d="M190 150 L120 30 M210 150 L170 20" stroke-width="1.2"/>
      <path d="M215 172 L330 216"/><path d="M195 178 L180 268"/><rect x="168" y="262" width="26" height="20" rx="3" transform="rotate(8 181 272)"/>
      <ellipse cx="200" cy="96" rx="96" ry="30" fill="#142038"/><path d="M200 96 v-30"/><circle cx="200" cy="64" r="4"/>
      <path d="M176 140 h48 l12 18 -12 18 h-48 l-12 -18z" fill="#2a2f45"/>
      <rect x="310" y="204" width="34" height="26" rx="4" fill="#2a2f45"/><circle cx="352" cy="214" r="7"/><circle cx="352" cy="228" r="5"/>
      <circle cx="200" cy="158" r="9" stroke="#ffb347"/></g>
    <text x="214" y="150" fill="#ffd08a" font-size="10" font-family="sans-serif">Golden Record</text><g id="pdHot"></g></svg>`;
  function picture(e) {
    if (S.diagram === "voyager") {
      if (!$("#pdHot")) $("#pdDiagram").innerHTML = VOYAGER_SVG;
      const p = PART[e.part];
      $("#pdHot").innerHTML = `<circle cx="${p.x}" cy="${p.y}" r="22" fill="${e.color}" opacity=".18"><animate attributeName="r" values="16;26;16" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx="${p.x}" cy="${p.y}" r="8" fill="${e.color}"/><text x="${p.x}" y="${p.y + 40 > 290 ? p.y - 30 : p.y + 40}" text-anchor="middle" fill="${e.color}" font-size="15" font-weight="700" font-family="sans-serif">${esc(e.short)} · ${esc(p.label)}</text>`;
      return;
    }
    const id = e.art || S.star, src = coverOf(id), a = byId[id];
    $("#pdDiagram").innerHTML = `<figure class="pd-photo" style="--c:${e.color}">${src ? `<img src="${src}" alt="${esc(a?.media?.[0]?.cap || a?.name || "")}">` : ""}
      <figcaption><b>${esc(e.short)}</b> ${esc(a ? a.name : "")} ${a?.media?.[0] ? `· <span>${esc(a.media[0].cap)}</span>` : ""}</figcaption></figure>`;
  }

  // ---- season tabs ----
  $("#pdSeasons").innerHTML = SEASONS.map((s, i) => `<button type="button" role="tab" data-s="${i}" aria-selected="false">${s.radio ? "Ghost Log Radio" : `S${i + 1} · ${esc(s.title.split(":").pop().trim())}`}<small>${s.episodes.length} episodes</small></button>`).join("");
  $("#pdSeasons").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (b) { setSeason(+b.dataset.s); load(firstUnfinished()); } });
  const firstUnfinished = () => Math.max(0, EP.findIndex(e => !store.done[key(e)]));

  function setSeason(i) {
    stop(); S = SEASONS[i]; EP = S.episodes;
    $$("#pdSeasons [data-s]").forEach(b => b.setAttribute("aria-selected", String(+b.dataset.s === i)));
    $("#pdSeasonTitle").textContent = S.title; $("#pdSeasonBlurb").textContent = S.blurb;
    $("#pdDiagram").innerHTML = "";
    // episode list
    $("#pdList").innerHTML = EP.map((e, k) => `
      <li><button type="button" data-ep="${k}" style="--c:${e.color}">
        <span class="pd-n">${S.radio ? "" : String(k + 1).padStart(2, "0")}</span>
        <span class="pd-t"><b>${esc(e.name)}</b><small>${S.radio ? `${esc(byId[e.id] ? TYPES[byId[e.id].type] : "")} · ${byId[e.id]?.year || ""}` : `${esc(e.short)} · ${esc(e.status[0][1])}`}</small></span>
        <span class="pd-dot ${e.on ? "on" : "off"}" title="${e.on ? "Still working" : "Gone quiet"}"></span>
        <span class="pd-done" data-done="${key(e)}" ${store.done[key(e)] ? "" : "hidden"}>✓</span>
      </button></li>`).join("");
    $("#pdFilter").hidden = !S.radio; $("#pdFilter input").value = "";
    years();
    score();
  }
  $("#pdList").addEventListener("click", e => { const b = e.target.closest("[data-ep]"); if (b) { load(+b.dataset.ep); play(); } });
  $("#pdFilter input").addEventListener("input", e => { const q = e.target.value.trim().toLowerCase(); $$("#pdList li").forEach((li, k) => (li.hidden = !!q && !EP[k].name.toLowerCase().includes(q))); });

  // the year strip, for Voyager: when each instrument went quiet on Voyager 1
  function years() {
    const box = $("#pdYears");
    if (!S.years) { box.hidden = true; return; }
    box.hidden = false;
    const yr = s => +(s.match(/\b(19|20)\d\d\b/) || [])[0] || null, lastX = [];
    const ticks = EP.map((e, i) => ({ e, i, y: yr(e.status[0][1]) })).map(t => ({ ...t, x: t.y ? (t.y - 1977) / (2028 - 1977) * 100 : 100 })).sort((a, b) => a.x - b.x)
      .map(t => { let row = 0; while (lastX[row] != null && t.x - lastX[row] < 8) row++; lastX[row] = t.x; return { ...t, row }; });
    box.style.height = (Math.max(...ticks.map(t => t.row)) + 1) * 22 + 52 + "px";
    box.innerHTML = `<div class="pd-axis"><span>1977</span><span>Still on</span></div>` + ticks.map(({ e, i, y, x, row }) =>
      `<button type="button" class="pd-tick ${y ? "" : "on"}" style="left:${Math.min(x, 97)}%;--c:${e.color};--row:${row}" data-ep="${i}" title="${esc(e.name)}: ${esc(e.status[0][1])}">${esc(e.short)}${y ? ` <small>${y}</small>` : ""}</button>`).join("");
  }
  $("#pdYears").addEventListener("click", e => { const b = e.target.closest("[data-ep]"); if (b) { load(+b.dataset.ep); play(); } });

  // ---- one episode ----
  let cur = 0, line = 0, playing = false, token = 0;
  const speaker = (sp, e) => sp === "N" ? (S.radio ? "Ghost" : e.short) : sp === "V" ? starName() : sp === "T" ? (S.radio ? "Radio" : "Team") : "Listener";
  function load(i) {
    stop(); cur = i; line = 0;
    const e = EP[i];
    $$("#pdList [data-ep]").forEach(b => b.setAttribute("aria-current", String(+b.dataset.ep === i)));
    $("#pdNow").innerHTML = `<p class="eyebrow" style="color:${e.color}">${S.radio ? "Ghost Log Radio" : `Episode ${i + 1} of ${EP.length}`} · ${esc(e.short)}</p><h2>${esc(e.name)}</h2>
      <p class="pd-unique"><b>${S.radio ? "The plan:" : "Only I could:"}</b> ${esc(e.unique)}</p>
      <dl class="pd-status">${e.status.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="${/still|used today/i.test(v) ? "on" : ""}">${esc(v)}</dd></div>`).join("")}</dl>`;
    $("#pdScript").innerHTML = e.lines.map(([sp, text, o], k) => text ? `<p class="pd-line sp-${sp}" data-l="${k}"><b>${esc(speaker(sp, e))}</b> ${esc(text)}</p>`
      : `<p class="pd-line pd-cue" data-l="${k}"><i>[${esc(o?.sfx || "")} sound]</i></p>`).join("");
    const q = e.challenge, ans = store.quiz[key(e)];
    $("#pdQuiz").innerHTML = `<h3>Mission challenge</h3><p>${esc(q.q)}</p><div class="pd-opts">${q.options.map((o, k) => `<button type="button" data-a="${k}" class="${ans != null && k === q.a ? "right" : ans === k ? "wrong" : ""}">${esc(o)}</button>`).join("")}</div>
      <p class="pd-qmsg" aria-live="polite">${ans == null ? "" : ans === q.a ? "Correct! Well done." : "Not quite. The right answer is lit up in green."}</p>
      <a class="btn btn-small" href="${e.try[0]}">${ico("arrow")} Try this: ${esc(e.try[1])}</a>`;
    picture(e); progress();
    history.replaceState(null, "", "#" + key(e));
  }
  $("#pdQuiz").addEventListener("click", ev => {
    const b = ev.target.closest("[data-a]"); if (!b) return;
    const e = EP[cur], k = +b.dataset.a; store.quiz[key(e)] = k; save();
    $$("#pdQuiz [data-a]").forEach(x => (x.className = +x.dataset.a === e.challenge.a ? "right" : x === b ? "wrong" : ""));
    $("#pdQuiz .pd-qmsg").textContent = k === e.challenge.a ? "Correct! Well done." : "Not quite. The right answer is lit up in green.";
    score();
  });
  function score() {
    const solved = EP.filter(e => store.quiz[key(e)] === e.challenge.a).length, done = EP.filter(e => store.done[key(e)]).length;
    const all = SEASONS.reduce((n, s) => n + s.episodes.length, 0);
    $("#pdScore").textContent = `This season: ${done} of ${EP.length} episodes finished, ${solved} challenges solved · All seasons: ${Object.keys(store.done).length} of ${all} episodes`;
  }

  // ---- playing ----
  function progress() {
    const e = EP[cur], n = e.lines.length;
    $("#pdBar").style.setProperty("--p", line / n);
    $$("#pdScript .pd-line").forEach(p => { const k = +p.dataset.l; p.classList.toggle("now", k === line && playing); p.classList.toggle("past", k < line); });
    $("#pdPlay").innerHTML = playing ? `<span aria-hidden="true">❚❚</span> Pause` : `<span aria-hidden="true">▶</span> ${line ? "Resume" : "Play"}`;
    $("#pdPlay").setAttribute("aria-pressed", String(playing));
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  function say(text, sp) {
    return new Promise(res => {
      if (!("speechSynthesis" in window)) return res();
      const u = new SpeechSynthesisUtterance(text), v = voiceFor(sp, cur);
      if (v.voice) u.voice = v.voice; u.lang = "en-US"; u.pitch = v.pitch; u.rate = v.rate * +$("#pdSpeed").value;
      u.onend = u.onerror = () => res();
      speechSynthesis.speak(u);
    });
  }
  async function play() {
    if (playing) return pause();
    if (!("speechSynthesis" in window)) { $("#pdWarn").hidden = false; return; }
    try { ctx().resume(); } catch { }
    playing = true; const me = ++token; progress();
    const e = EP[cur];
    while (line < e.lines.length && playing && me === token) {
      const [sp, text, o] = e.lines[line];
      progress();
      $(`#pdScript [data-l="${line}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      if (o?.sfx && SFX[o.sfx]) { let ms = 0; try { ms = SFX[o.sfx](); } catch { } await wait(text ? Math.min(ms, 700) : ms); }
      if (text && me === token) await say(text, sp);
      if (me !== token) return;
      await wait(260);
      line++;
    }
    if (me !== token) return;
    playing = false;
    if (line >= e.lines.length) {
      store.done[key(e)] = 1; save(); const d = $(`[data-done="${key(e)}"]`); if (d) d.hidden = false; score(); line = 0;
      $("#pdQuiz").scrollIntoView({ block: "nearest", behavior: "smooth" });
      if ($("#pdAuto").checked && cur < EP.length - 1) { await wait(1500); load(cur + 1); play(); return; }
    }
    progress();
  }
  function pause() { playing = false; token++; try { speechSynthesis.cancel(); } catch { } progress(); }
  function stop() { if (playing) pause(); }
  $("#pdPlay").addEventListener("click", play);
  $("#pdBack").addEventListener("click", () => { const was = playing; pause(); line = Math.max(0, line - 1); progress(); if (was) play(); });
  $("#pdFwd").addEventListener("click", () => { const was = playing; pause(); line = Math.min(EP[cur].lines.length - 1, line + 1); progress(); if (was) play(); });
  $("#pdScript").addEventListener("click", e => { const p = e.target.closest("[data-l]"); if (!p) return; pause(); line = +p.dataset.l; progress(); play(); });
  $("#pdPrint").addEventListener("click", () => print());
  addEventListener("pagehide", pause);

  // ---- start: #season/episode, an old Season 1 link like #crs, or a machine's id for Ghost Log Radio ----
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    let [sid, eid] = h.includes("/") ? h.split("/") : [null, h];
    if (!sid && eid) sid = SEASONS[0].episodes.some(e => e.id === eid) ? "voyager" : byId[eid] ? "radio" : null;
    const si = Math.max(0, SEASONS.findIndex(s => s.id === sid));
    setSeason(si);
    const ei = EP.findIndex(e => e.id === eid);
    load(ei >= 0 ? ei : firstUnfinished());
  }
  fromHash();
  addEventListener("hashchange", () => { if (location.hash.slice(1) !== key(EP[cur])) fromHash(); });

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
