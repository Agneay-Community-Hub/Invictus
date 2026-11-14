/* ===========================================================
   Glossary pop-ups (every page, English only): the first time a
   tricky word appears in a dossier, a chapter, the compare table and
   other long text, it gets a dotted underline; tap it for a one-line
   explanation. glossary.html lists every word.
   =========================================================== */
const GLOSSARY = [
  ["Astronomical unit (AU)", ["AU", "astronomical unit", "astronomical units"], "The average distance from Earth to the Sun, about 150 million km. Handy for measuring the solar system."],
  ["Backshell", ["backshell"], "The cone-shaped cover that protects a Mars lander on the way down. It is dropped, with the parachute, just before landing."],
  ["Deep Space Network", ["Deep Space Network", "DSN"], "NASA's giant radio dishes in California, Spain and Australia. Between them they can always talk to a spacecraft, whichever way Earth is facing."],
  ["Dust devil", ["dust devil", "dust devils"], "A spinning whirlwind of dust. On Mars they sometimes blew dust off rovers' solar panels and gave them extra power."],
  ["Ejecta", ["ejecta"], "Rock and dust thrown out when something smashes into a surface and makes a crater."],
  ["Golden Record", ["Golden Record", "Golden Records"], "A gold-plated disc on each Voyager with sounds, music, greetings and pictures from Earth, in case anyone ever finds it."],
  ["Gravity assist", ["gravity assist", "gravity assists", "slingshot"], "Flying close to a planet to borrow some of its speed and change direction, saving fuel."],
  ["Heat shield", ["heat shield"], "The front of a spacecraft's capsule that takes the fierce heat of slamming into a planet's air."],
  ["Heliopause", ["heliopause"], "The edge of the Sun's bubble of solar wind. Past it lies interstellar space."],
  ["Interstellar space", ["interstellar space", "interstellar"], "The space between the stars, outside the Sun's bubble of solar wind. Only the two Voyagers have reached it while still working."],
  ["Kuiper Belt", ["Kuiper Belt"], "A huge ring of icy bodies beyond Neptune, including Pluto and Arrokoth."],
  ["Lander", ["lander", "landers"], "A spacecraft that sets down on a surface and stays put. A rover is one that can drive."],
  ["Light-time", ["light-second", "light-seconds", "light-minute", "light-minutes", "light-hour", "light-hours", "light-day"], "How long light, or a radio signal, takes to cross a distance. Light covers about 300,000 km every second."],
  ["Mare (plural: maria)", ["mare", "maria"], "The dark, flat plains on the Moon, made of old lava. Early astronomers thought they were seas, so they are named after water."],
  ["Marsquake", ["marsquake", "marsquakes"], "An earthquake on Mars. InSight felt more than 1,300 of them."],
  ["Orbiter", ["orbiter", "orbiters"], "A spacecraft that circles a planet or moon instead of landing on it."],
  ["Perchlorate", ["perchlorate", "perchlorates"], "A salty chemical Phoenix found in Mars soil. It can keep water liquid at low temperatures but is harmful to people."],
  ["Regolith", ["regolith"], "The loose layer of dust, soil and broken rock that covers the Moon, Mars and asteroids."],
  ["Retroreflector", ["retroreflector", "retroreflectors", "reflector array"], "A panel of mirrors that bounces laser light straight back where it came from. Apollo left some on the Moon and scientists still aim lasers at them."],
  ["RTG", ["RTG", "RTGs", "radioisotope thermoelectric generator", "nuclear battery"], "A nuclear battery that turns the heat from decaying plutonium into electricity. It slowly weakens over decades, which is why the Voyagers are running low."],
  ["Safe mode", ["safe mode"], "When a spacecraft senses something is wrong, it shuts down non-essential systems and waits for instructions from Earth."],
  ["Seismometer", ["seismometer", "seismometers"], "An instrument that feels the ground shake. Apollo crews and InSight left them on the Moon and Mars."],
  ["Sky crane", ["sky crane"], "A rocket-powered hovering platform that lowered Curiosity and Perseverance to the ground on cables, then flew away and crashed."],
  ["Sol", ["sol", "sols"], "A day on Mars: 24 hours and 39 minutes."],
  ["Solar conjunction", ["solar conjunction"], "When the Sun sits between Earth and Mars and blocks radio contact for a couple of weeks."],
  ["Spectrometer", ["spectrometer", "spectrometers"], "An instrument that splits light into its colours to tell what something is made of."],
  ["Telemetry", ["telemetry"], "Data a spacecraft sends home about its own health: temperatures, power, position."],
  ["Termination shock", ["termination shock"], "Where the solar wind suddenly slows down, before the heliopause. Both Voyagers crossed it."],
  ["Trojan asteroids", ["Trojan asteroids", "Trojans"], "Two swarms of asteroids that share Jupiter's orbit, one ahead of it and one behind."]
];

(() => {
  if (((window.I18n && I18n.lang) || "en") !== "en") return; // definitions are English only
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ALIAS = new Map();
  GLOSSARY.forEach((g, i) => g[1].forEach(w => ALIAS.set(w.toLowerCase(), i)));
  const CASE = new Set(["au", "rtg", "rtgs", "dsn"]); // match these only in capitals
  const words = [...ALIAS.keys()].sort((a, b) => b.length - a.length).map(w => w.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&"));
  const RE = new RegExp(`(?<![\\w-])(${words.join("|")})(?![\\w-])`, "gi");
  const SKIP = "a, button, h1, h2, h3, label, select, option, input, textarea, .pill, .gl, script, style, svg, figcaption, .sx-back";

  const style = document.createElement("style");
  style.textContent = `
  .gl{all:unset;cursor:help;border-bottom:1.5px dotted var(--amber,#ffb347);color:inherit;text-decoration:none}
  .gl:hover,.gl:focus-visible,.gl[aria-expanded=true]{color:var(--amber2,#ffd08a);outline:none}
  .gl-pop{position:absolute;z-index:300;max-width:min(320px,calc(100vw - 24px));background:var(--bg2,#0b1120);border:1px solid var(--line2,#2f4166);border-radius:12px;padding:10px 12px;box-shadow:0 14px 40px -12px rgba(0,0,0,.8);font-size:.9rem;line-height:1.45;color:var(--text,#e9eef7)}
  .gl-pop b{display:block;color:var(--amber2,#ffd08a);margin-bottom:2px}
  .gl-pop a{color:var(--cyan,#7fd4ff);font-size:.8rem}
  .gl-pop[hidden]{display:none}`;
  document.head.appendChild(style);

  const pop = document.createElement("div");
  pop.className = "gl-pop"; pop.id = "glPop"; pop.setAttribute("role", "tooltip"); pop.hidden = true;
  document.body.appendChild(pop);
  let openBtn = null;
  function close() { if (openBtn) { openBtn.setAttribute("aria-expanded", "false"); openBtn.removeAttribute("aria-describedby"); } openBtn = null; pop.hidden = true; }
  function open(btn) {
    if (openBtn === btn) return close();
    close();
    const g = GLOSSARY[+btn.dataset.g];
    pop.innerHTML = `<b>${esc(g[0])}</b>${esc(g[2])}<br><a href="glossary.html#g${btn.dataset.g}">All words →</a>`;
    pop.hidden = false;
    const r = btn.getBoundingClientRect(), w = pop.offsetWidth;
    pop.style.left = Math.max(12, Math.min(scrollX + r.left, scrollX + innerWidth - w - 12)) + "px";
    pop.style.top = (scrollY + r.bottom + 8) + "px";
    btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-describedby", "glPop");
    openBtn = btn;
  }
  document.addEventListener("click", e => {
    const b = e.target.closest(".gl");
    if (b) { e.preventDefault(); e.stopPropagation(); open(b); }
    else if (!e.target.closest(".gl-pop")) close();
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && openBtn) { const b = openBtn; close(); b.focus(); } });
  addEventListener("scroll", () => openBtn && close(), { passive: true, capture: true });

  // wrap the first use of each word inside root
  function apply(root) {
    if (!root) return;
    const done = new Set([...root.querySelectorAll(".gl")].map(b => b.dataset.g));
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeValue.trim().length > 2 && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const text = node.nodeValue; let m, last = 0, frag = null;
      RE.lastIndex = 0;
      while ((m = RE.exec(text))) {
        const w = m[1], key = w.toLowerCase(), i = ALIAS.get(key);
        if (i === undefined || done.has(String(i))) continue;
        if (CASE.has(key) && w.replace(/s$/, "") !== w.replace(/s$/, "").toUpperCase()) continue;
        done.add(String(i));
        frag ??= document.createDocumentFragment();
        frag.append(text.slice(last, m.index));
        const b = document.createElement("button");
        b.type = "button"; b.className = "gl"; b.dataset.g = i; b.setAttribute("aria-expanded", "false"); b.textContent = w;
        b.setAttribute("aria-label", `${w}: what does this mean?`);
        frag.append(b); last = m.index + w.length;
      }
      if (frag) { frag.append(text.slice(last)); node.replaceWith(frag); }
    }
  }
  window.GLOSSARY_APPLY = apply;

  // glossary.html: the full list, with a filter
  const list = document.getElementById("glList");
  if (list) {
    list.innerHTML = GLOSSARY.map((g, i) => `<div class="gl-item" id="g${i}" data-text="${esc((g[0] + " " + g[1].join(" ") + " " + g[2]).toLowerCase())}"><dt>${esc(g[0])}</dt><dd>${esc(g[2])}</dd></div>`).join("");
    const q = document.getElementById("glSearch"), count = document.getElementById("glCount");
    const filter = () => { const v = q.value.trim().toLowerCase(); let n = 0; list.querySelectorAll(".gl-item").forEach(el => { const show = !v || v.split(/\s+/).every(w => el.dataset.text.includes(w)); el.hidden = !show; if (show) n++; }); count.textContent = `${n} of ${GLOSSARY.length} words`; };
    q.addEventListener("input", filter); filter();
    if (location.hash) document.querySelector(location.hash)?.classList.add("gl-hit");
  }

  // long-text areas on every page, including ones drawn later (dossier drawer, chapters, compare table)
  const AREAS = "#drawer, #chapter, .cmp-table, .cmp-glance, #fuGrid, #trCards, .deep-text, .cat-list";
  let queued = false;
  const run = () => { queued = false; document.querySelectorAll(AREAS).forEach(apply); };
  new MutationObserver(muts => {
    if (queued || muts.every(m => (m.target.nodeType === 1 ? m.target : m.target.parentElement)?.closest(".gl-pop, .sx-back, [data-live]"))) return;
    queued = true; requestAnimationFrame(run);
  }).observe(document.body, { childList: true, subtree: true });
  run();
})();
