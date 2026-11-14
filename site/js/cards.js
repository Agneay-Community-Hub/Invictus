/* ===========================================================
   Ghost Cards (cards.html): every machine as a trading card with four
   stats. Play a quick stat battle against the computer, or print the
   whole deck (nine cards to a page) to cut out and play at home.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cover = a => a.media && a.media[0] ? "assets/nasa/" + a.media[0].f : null;
  const thumb = a => a.media && a.media[0] ? "assets/nasa/thumb/" + a.media[0].f.replace(/\.\w+$/, ".jpg") : null; // small copy for cards (scripts/build-thumbs.py)
  const AU = 1.496e8, YR = 365.25 * 864e5, DAY = 864e5;
  const when = s => { const d = Date.parse(String(s || "").replace(/\(.*?\)/g, "").split("/")[0].trim()); return isNaN(d) ? null : d; };

  // ---- the four stats ----
  const BODY = { Mercury: 1.04, Venus: 1.14, Mars: 1.5, Ceres: 2.8, Jupiter: 5.2, Saturn: 9.5 };
  function distKm(a) {
    if (a.world === "moon") return 384400;
    if (a.world === "mars") return 225e6;
    if (a.dist) return (a.dist.au2025 + a.dist.rate * ((Date.now() - Date.UTC(2025, 0, 1)) / YR)) * AU;
    if (a.body === "Earth") return 2300;
    if (BODY[a.body]) return BODY[a.body] * AU;
    if (a.orbit) return a.orbit.au * AU;
    if (a.id === "near") return 1.5 * AU;
    if (a.id === "deepimpact") return 3.1 * AU;
    return AU;
  }
  function lifeDays(a) {
    const s = when(a.dates.launch); let e = when(a.dates.last);
    if (e === null && (a.status === "active" || a.status === "retired")) e = Date.now();
    if (e === null) e = when(a.dates.arrive);
    return s !== null && e !== null && e > s ? (e - s) / DAY : 1;
  }
  const big = n => n >= 1e9 ? (n / 1e9).toFixed(1) + " billion" : n >= 1e6 ? Math.round(n / 1e6) + " million" : Math.round(n).toLocaleString("en");
  const life = d => d < 60 ? `${Math.round(d)} days` : d < 730 ? `${Math.round(d / 30.44)} months` : `${Math.round(d / 365.25)} years`;
  const STATS = [
    ["age", "Veteran", "Years since launch", a => new Date().getFullYear() - a.year, v => `${v} yrs`],
    ["life", "Stamina", "Launch to last contact", lifeDays, life],
    ["dist", "Reach", "Distance from Earth (rough)", distKm, v => big(v) + " km"],
    ["finds", "Discovery", "Big discoveries", a => (a.discoveries || []).length, v => String(v)]
  ];
  const CARDS = ARTIFACTS.map(a => ({ a, v: Object.fromEntries(STATS.map(([k, , , f]) => [k, f(a)])) }));
  // 0–1 rank of each stat, for the bars and for the computer's choices
  const RANK = {};
  STATS.forEach(([k]) => { const sorted = CARDS.map(c => c.v[k]).sort((x, y) => x - y); CARDS.forEach(c => { (RANK[c.a.id] ??= {})[k] = sorted.lastIndexOf(c.v[k]) / (sorted.length - 1); }); });

  function cardHTML(c, { pick = false, hidden = false, cls = "" } = {}) {
    if (hidden) return `<div class="gc-card gc-back ${cls}" aria-label="Face-down card"><span>Ghost<br>Cards</span></div>`;
    const a = c.a;
    return `<article class="gc-card ${cls}" style="--w:${WORLDS[a.world].color}">
      <header><span class="gc-world">${esc(WORLDS[a.world].short)}</span><span class="gc-year">${a.year}</span></header>
      <div class="gc-img">${cover(a) ? `<img src="${thumb(a)}" alt="" loading="lazy" decoding="async">` : typeIco(a.type)}</div>
      <h3>${esc(a.name)}</h3>
      <p class="gc-type">${esc(TYPES[a.type])} · <span style="color:${STATUS[a.status].color}">${esc(STATUS[a.status].label)}</span></p>
      <ul class="gc-stats">${STATS.map(([k, name, help, , fmt]) => `<li>${pick ? `<button type="button" data-stat="${k}" title="${esc(help)}">` : "<span>"}
        <b>${name}</b><em>${esc(fmt(c.v[k]))}</em><i style="--r:${RANK[a.id][k]}"></i>${pick ? "</button>" : "</span>"}</li>`).join("")}</ul>
      <p class="gc-ep">“${esc(a.epitaph)}”</p>
    </article>`;
  }

  // ---- the game ----
  let me = [], cpu = [], pot = [], turn = "me", round = 0, limit = 10, busy = false;
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  function start() {
    const deck = shuffle(CARDS.slice());
    me = deck.filter((_, i) => i % 2 === 0); cpu = deck.filter((_, i) => i % 2 === 1); pot = [];
    turn = "me"; round = 0; limit = +$("#gcLength").value || Infinity; busy = false;
    show();
  }
  function score() { $("#gcScore").innerHTML = `You <b>${me.length}</b> · Computer <b>${cpu.length}</b>${pot.length ? ` · ${pot.length} in the middle` : ""} · Round ${Math.min(round + 1, limit)}${limit < Infinity ? " of " + limit : ""}`; }
  function show() {
    score();
    if (!me.length || !cpu.length || round >= limit) return end();
    $("#gcMe").innerHTML = cardHTML(me[0], { pick: turn === "me" });
    $("#gcCpu").innerHTML = cardHTML(cpu[0], { hidden: true });
    $("#gcNext").hidden = true;
    if (turn === "me") $("#gcMsg").innerHTML = "Your turn. Pick the stat you think beats the computer's card.";
    else {
      const best = STATS.map(([k]) => k).sort((x, y) => RANK[cpu[0].a.id][y] - RANK[cpu[0].a.id][x])[0];
      $("#gcMsg").innerHTML = `The computer picks <b>${STATS.find(s => s[0] === best)[1]}</b>…`;
      setTimeout(() => play(best), 1100);
    }
  }
  function play(k) {
    if (busy) return; busy = true;
    const A = me.shift(), B = cpu.shift(), s = STATS.find(x => x[0] === k);
    $("#gcMe").innerHTML = cardHTML(A, { cls: "gc-chosen-" + k });
    $("#gcCpu").innerHTML = cardHTML(B, { cls: "gc-chosen-" + k + " gc-flip" });
    $$(".gc-play .gc-stats li").forEach((li, i) => li.classList.toggle("on", i % STATS.length === STATS.indexOf(s)));
    const va = A.v[k], vb = B.v[k];
    let msg;
    if (va === vb) { pot.push(A, B); msg = `${s[1]}: a tie! Both cards go in the middle for the next round.`; }
    else if (va > vb) { me.push(A, B, ...pot); pot = []; turn = "me"; msg = `<b class="gc-win">You win the round.</b> ${esc(A.a.name)}'s ${s[1].toLowerCase()} (${esc(s[4](va))}) beats ${esc(B.a.name)} (${esc(s[4](vb))}).`; }
    else { cpu.push(B, A, ...pot); pot = []; turn = "cpu"; msg = `<b class="gc-lose">The computer wins the round.</b> ${esc(B.a.name)}'s ${s[1].toLowerCase()} (${esc(s[4](vb))}) beats ${esc(A.a.name)} (${esc(s[4](va))}).`; }
    round++;
    $("#gcMsg").innerHTML = msg; score();
    $("#gcNext").hidden = false; $("#gcNext").focus();
    busy = false;
  }
  function end() {
    const win = me.length > cpu.length, tie = me.length === cpu.length;
    $("#gcMsg").innerHTML = tie ? "It's a draw! Play again?" : win ? `<b class="gc-win">You win the game</b>, ${me.length} cards to ${cpu.length}!` : `<b class="gc-lose">The computer wins</b>, ${cpu.length} cards to ${me.length}. Try again?`;
    $("#gcNext").hidden = true;
  }
  $("#gcMe").addEventListener("click", e => { const b = e.target.closest("[data-stat]"); if (b && turn === "me") play(b.dataset.stat); });
  $("#gcNext").addEventListener("click", show);
  $("#gcNew").addEventListener("click", start);
  $("#gcLength").addEventListener("change", start);
  start();

  // ---- the printable deck ----
  $("#gcDeck").innerHTML = CARDS.slice().sort((p, q) => p.a.year - q.a.year).map(c => cardHTML(c)).join("");
  $("#gcPrint").addEventListener("click", () => { document.body.classList.add("print-deck"); print(); });
  addEventListener("afterprint", () => document.body.classList.remove("print-deck"));

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
