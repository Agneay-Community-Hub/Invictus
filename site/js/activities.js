/* ===========================================================
   Activity sheets (activities.html): printable colouring pages of
   four machines, a word search, a match-the-machine sheet and a
   design-your-own mission patch. Each sheet prints on its own page.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const svg = (body, extra = "") => `<svg class="as-art" viewBox="0 0 600 500" role="img" ${extra} fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const stars = pts => pts.map(([x, y, r = 9]) => `<path d="M${x} ${y - r}l${r * .3} ${r * .7} ${r * .7} ${r * .3}-${r * .7} ${r * .3}-${r * .3} ${r * .7}-${r * .3}-${r * .7}-${r * .7}-${r * .3} ${r * .7}-${r * .3}z"/>`).join("");
  const ground = y => `<path d="M0 ${y} C80 ${y - 14} 140 ${y + 10} 220 ${y - 4} S380 ${y + 12} 460 ${y - 6} S560 ${y + 6} 600 ${y - 2}"/><ellipse cx="90" cy="${y + 38}" rx="34" ry="8"/><ellipse cx="510" cy="${y + 44}" rx="22" ry="6"/><path d="M300 ${y + 30} q20 -10 40 0"/>`;

  const ART = {
    rover: svg(`${stars([[60, 60], [520, 50, 7], [460, 120, 6], [110, 150, 5]])}<circle cx="560" cy="160" r="26"/>${ground(430)}
      <rect x="170" y="238" width="290" height="16" rx="4"/><rect x="185" y="254" width="260" height="56" rx="8"/><path d="M215 270h60M215 288h40"/>
      <path d="M150 395 222 330 292 395M222 330 300 306 380 322 432 395M300 306 300 310"/>
      ${[150, 292, 432].map(x => `<circle cx="${x}" cy="395" r="33"/><circle cx="${x}" cy="395" r="10"/><path d="M${x - 33} 395h18M${x + 15} 395h18"/>`).join("")}
      <path d="m448 232 58-24 18 42-58 24z"/><path d="m462 236 14 32M478 228l14 32M494 222l14 32"/>
      <path d="M232 238V122"/><rect x="196" y="88" width="78" height="38" rx="7"/><circle cx="217" cy="107" r="8"/><circle cx="247" cy="107" r="8"/><path d="M262 100h6"/>
      <path d="M185 292 122 272 96 318"/><circle cx="94" cy="332" r="15"/><path d="M80 340l-10 12M108 340l10 12"/>
      <path d="M392 238v-14"/><ellipse cx="392" cy="212" rx="26" ry="12"/><path d="M342 238v-28"/><circle cx="342" cy="204" r="6"/>`),
    lm: svg(`${stars([[70, 70], [540, 60, 7], [480, 160, 5], [180, 40, 6]])}<circle cx="120" cy="140" r="42"/><path d="M90 128c18 6 30 22 30 40M128 102c10 14 30 18 46 14"/>${ground(435)}
      <path d="M205 300h190l14 18v56l-14 18H205l-14-18v-56z"/><path d="M191 336h218M235 300v92M365 300v92"/>
      <path d="M193 330 138 428M407 330l55 98M250 392l-12 38M350 392l12 38"/><ellipse cx="132" cy="433" rx="28" ry="8"/><ellipse cx="468" cy="433" rx="28" ry="8"/><ellipse cx="236" cy="434" rx="20" ry="6"/><ellipse cx="364" cy="434" rx="20" ry="6"/>
      <path d="m170 372-12 22M160 360l-12 22M182 352l-12 22"/>
      <path d="M232 300v-62l30-44h78l30 44v62z"/><path d="M270 214h26l-13 22z"/><rect x="285" y="250" width="32" height="44" rx="4"/>
      <path d="M340 194l22-40"/><ellipse cx="368" cy="146" rx="18" ry="9" transform="rotate(-30 368 146)"/>
      <rect x="218" y="250" width="14" height="14"/><rect x="370" y="250" width="14" height="14"/>
      <path d="M528 432V258"/><path d="M528 262h62v40h-62"/><path d="M540 274h10M540 286h22"/>`),
    lrv: svg(`${stars([[60, 60], [300, 40, 7], [520, 80, 6], [440, 40, 5]])}<circle cx="110" cy="130" r="38"/><path d="M80 120c16 8 28 22 28 40"/>${ground(432)}
      <path d="M118 382c0-34 26-58 56-58s56 24 56 58M394 382c0-34 26-58 56-58s56 24 56 58"/>
      ${[174, 450].map(x => `<circle cx="${x}" cy="392" r="40"/><circle cx="${x}" cy="392" r="12"/><path d="M${x} 352v80M${x - 40} 392h80M${x - 28} 364l56 56M${x + 28} 364l-56 56"/>`).join("")}
      <rect x="140" y="336" width="344" height="18" rx="4"/><path d="M230 336v-46h66v46M246 290v-30h50M318 336v-46h66v46M334 290v-30h50"/>
      <path d="M210 336v-70"/><rect x="186" y="236" width="52" height="30" rx="4"/><path d="M196 248h10M214 248h14"/>
      <path d="M440 336V214"/><path d="M394 206c14-22 78-22 92 0z"/><path d="M412 336l-14-96"/><path d="m398 240-10-14"/>
      <rect x="170" y="300" width="28" height="22" rx="3"/><circle cx="184" cy="311" r="6"/>
      <path d="M20 470h80M120 470h80M20 482h80M120 482h80" stroke-dasharray="8 8"/>`),
    voyager: svg(`${stars([[60, 60], [540, 70], [520, 420, 7], [80, 430, 6], [460, 470, 5], [40, 260, 6], [560, 250, 5]])}
      <circle cx="300" cy="190" r="128"/><circle cx="300" cy="190" r="22"/><path d="M300 62v106M300 212v106M172 190h106M322 190h106M210 100l75 75M390 100l-75 75"/>
      <path d="M300 168v-46"/><circle cx="300" cy="116" r="6"/>
      <path d="M252 320h96l14 22-14 22h-96l-14-22z"/><circle cx="300" cy="342" r="15"/><circle cx="300" cy="342" r="5"/>
      <path d="M362 342l200-48"/><path d="M546 290l18-4M520 296l18-4"/>
      <path d="M238 342 130 400"/><rect x="88" y="392" width="52" height="38" rx="5"/><circle cx="104" cy="411" r="9"/><circle cx="126" cy="411" r="6"/>
      <path d="M300 364l24 70"/><rect x="306" y="404" width="40" height="18" rx="4" transform="rotate(20 326 413)"/><rect x="318" y="438" width="40" height="18" rx="4" transform="rotate(20 338 447)"/>`)
  };
  const COLOUR = [
    ["rover", "A Mars rover", "Rovers like Curiosity have six wheels, a camera mast with two “eyes”, and a robot arm. Colour Mars red, orange or brown."],
    ["lm", "The Apollo Lunar Module", "Six of these landed people on the Moon. The bottom half is still there. Can you draw an astronaut on the ladder?"],
    ["lrv", "The Moon car", "Three Lunar Roving Vehicles are still parked on the Moon, where Apollo 15, 16 and 17 left them."],
    ["voyager", "Voyager", "Voyager 1 and 2 carry a Golden Record (the small circle) with sounds and pictures from Earth. Colour it gold!"]
  ];

  // ---- word search ----
  const WORDS = ["ROVER", "LANDER", "ORBITER", "REGOLITH", "CRATER", "VOYAGER", "APOLLO", "SOL", "MARS", "MOON", "COMET", "SATURN"];
  function wordSearch() {
    const N = 12, dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let tries = 0; tries < 200; tries++) {
      const g = Array.from({ length: N }, () => Array(N).fill("")), placed = [];
      let ok = true;
      for (const w of [...WORDS].sort((a, b) => b.length - a.length)) {
        let done = false;
        for (let k = 0; k < 300 && !done; k++) {
          const [dx, dy] = dirs[(Math.random() * dirs.length) | 0], x0 = (Math.random() * N) | 0, y0 = (Math.random() * N) | 0;
          const xe = x0 + dx * (w.length - 1), ye = y0 + dy * (w.length - 1);
          if (xe < 0 || xe >= N || ye < 0 || ye >= N) continue;
          if ([...w].every((c, i) => !g[y0 + dy * i][x0 + dx * i] || g[y0 + dy * i][x0 + dx * i] === c)) {
            [...w].forEach((c, i) => (g[y0 + dy * i][x0 + dx * i] = c)); placed.push(w); done = true;
          }
        }
        if (!done) { ok = false; break; }
      }
      if (!ok) continue;
      const L = "ABCDEFGHIJKLMNOPRSTUVWY";
      return g.map(r => r.map(c => c || L[(Math.random() * L.length) | 0]));
    }
  }
  const wsHTML = () => `<table class="as-ws">${wordSearch().map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;

  // ---- match the machine to its world ----
  const PAIRS = [["Lunar Roving Vehicle", "The Moon"], ["Sojourner", "Mars"], ["MESSENGER", "Mercury"], ["Galileo", "Jupiter"], ["Cassini", "Saturn"], ["Voyager 1", "Interstellar space"]];
  const right = PAIRS.map(p => p[1]).sort(() => Math.random() - .5);

  const sheet = (id, title, body, foot = "") => `
    <section class="as-sheet" id="${id}">
      <div class="as-tools no-print"><button class="btn btn-small" data-print="${id}">${ico("download")} Print this sheet</button>${id === "words" ? `<button class="btn btn-small" id="asNewWs">${ico("shuffle")} New puzzle</button>` : ""}</div>
      <div class="as-page">
        <header class="as-head"><span>Ghosts of Exploration</span><span>Name: ____________________</span></header>
        <h2>${title}</h2>${body}
        <footer class="as-foot">${foot || "More machines, stories and pictures: agneay-community-hub.github.io/Invictus"}</footer>
      </div>
    </section>`;

  $("#sheets").innerHTML =
    COLOUR.map(([k, title, text]) => sheet("colour-" + k, `Colour in: ${title}`, `<p class="as-lede">${esc(text)}</p>${ART[k]}`)).join("")
    + sheet("words", "Word search", `<p class="as-lede">Find these 12 space words. They go across, down or diagonally.</p><div id="asWs">${wsHTML()}</div>
        <ul class="as-list">${WORDS.map(w => `<li>${w}</li>`).join("")}</ul>`)
    + sheet("match", "Where did they go?", `<p class="as-lede">Draw a line from each machine to the place it went. Use the website to check your answers!</p>
        <div class="as-match"><ol>${PAIRS.map(p => `<li><span>${esc(p[0])}</span><i></i></li>`).join("")}</ol><ol type="A">${right.map(w => `<li><i></i><span>${esc(w)}</span></li>`).join("")}</ol></div>`)
    + sheet("patch", "Design your own mission patch", `<p class="as-lede">Every mission has a patch. Invent a machine and a place to send it, then draw its patch.</p>
        <svg class="as-art as-patch" viewBox="0 0 600 470" fill="none" stroke="#111" stroke-width="3"><circle cx="300" cy="215" r="200"/><circle cx="300" cy="215" r="150" stroke-dasharray="6 8"/>
        <path id="arcTop" d="M130 215a170 170 0 0 1 340 0" stroke="none"/><text font-family="sans-serif" font-size="22" fill="#666" stroke="none" letter-spacing="4"><textPath href="#arcTop" startOffset="50%" text-anchor="middle">MISSION NAME</textPath></text></svg>
        <div class="as-lines"><p>My machine is called: ______________________________</p><p>It is going to: ______________________________</p><p>Launch year: __________  It will find out: ______________________________</p></div>`);

  document.addEventListener("click", e => {
    const p = e.target.closest("[data-print]");
    if (p) { document.body.dataset.only = p.dataset.print; print(); }
    if (e.target.closest("#asNewWs")) $("#asWs").innerHTML = wsHTML();
  });
  $("#asAll").addEventListener("click", () => { delete document.body.dataset.only; print(); });
  addEventListener("afterprint", () => delete document.body.dataset.only);

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
