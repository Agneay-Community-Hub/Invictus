/* ===========================================================
   Future ghosts (future.html): machines on their way, or planned,
   that will one day join the archive. Plans as of late 2026; dates
   for planned missions often slip, so each card links to the
   agency's own page.
   =========================================================== */
const FUTURE = [
  { id: "threeforks", name: "The Three Forks sample depot", who: "NASA", world: "mars", type: "debris", when: "Left in 2022–2023", stage: "waiting",
    what: "Perseverance dropped 10 sealed tubes of Mars rock, soil and air on the floor of Jezero Crater, as a backup cache for a future trip to bring samples to Earth.",
    ghost: "Ten small metal tubes, lined up on the ground, waiting for someone to come and pick them up. How and when that happens is still being decided.",
    url: "https://science.nasa.gov/mission/mars-2020-perseverance/" },
  { id: "perseverance", name: "Perseverance rover", who: "NASA", world: "mars", type: "rover", when: "Working since 2021", stage: "working",
    what: "Still exploring Jezero Crater and its rim, collecting rock cores and looking for signs of ancient life.",
    ghost: "Its nuclear power source slowly fades. One day it will stop where it stands, next to Ingenuity and its own parachute and backshell.",
    url: "https://science.nasa.gov/mission/mars-2020-perseverance/" },
  { id: "voyagers", name: "Voyager 1 and 2 going quiet", who: "NASA", world: "deep", type: "probe", when: "Expected in the 2030s", stage: "working",
    what: "Engineers keep switching off heaters and instruments to save power, so the two oldest working spacecraft can keep talking a little longer.",
    ghost: "When the power runs out they will fall silent but keep flying through interstellar space, carrying their Golden Records, for billions of years.",
    url: "https://science.nasa.gov/mission/voyager/" },
  { id: "lucy", name: "Lucy", who: "NASA", world: "deep", type: "probe", when: "Trojan flybys from 2027", stage: "flying",
    what: "On its way to the Trojan asteroids, two swarms that share Jupiter's orbit. It has already flown past the asteroids Dinkinesh and Donaldjohanson.",
    ghost: "After its last flyby it will keep looping between the Trojans and Earth's neighbourhood long after it stops talking.",
    url: "https://science.nasa.gov/mission/lucy/" },
  { id: "psyche", name: "Psyche", who: "NASA", world: "deep", type: "orbiter", when: "Arrives in 2029", stage: "flying",
    what: "Flying on electric thrusters to the metal-rich asteroid 16 Psyche, which may be part of the core of a planet that never finished forming.",
    ghost: "It will orbit the metal world, mapping it, until it runs out of fuel and becomes a silent moon of an asteroid.",
    url: "https://science.nasa.gov/mission/psyche/" },
  { id: "clipper", name: "Europa Clipper", who: "NASA", world: "deep", type: "orbiter", when: "Arrives at Jupiter in 2030", stage: "flying",
    what: "Launched in 2024. It will fly past Jupiter's moon Europa dozens of times to study the ocean hidden under its ice.",
    ghost: "Like Galileo and Cassini, it is planned to end with a deliberate crash, so it can never carry Earth germs onto Europa.",
    url: "https://science.nasa.gov/mission/europa-clipper/" },
  { id: "juice", name: "JUICE", who: "ESA, with NASA instruments", world: "deep", type: "orbiter", when: "Arrives at Jupiter in 2031", stage: "flying",
    what: "Europe's Jupiter Icy Moons Explorer will study Ganymede, Callisto and Europa, then become the first spacecraft to orbit a moon of another planet.",
    ghost: "Its mission is planned to end on Ganymede, the largest moon in the solar system.",
    url: "https://www.esa.int/Science_Exploration/Space_Science/Juice" },
  { id: "viper", name: "VIPER", who: "NASA", world: "moon", type: "rover", when: "Planned for the late 2020s", stage: "planned",
    what: "A golf-cart-sized rover built to hunt for ice in the cold, dark craters near the Moon's south pole. It was built, then shelved in 2024, then given a new ride to the Moon.",
    ghost: "Running on solar power near the pole, it is expected to stop when it can no longer find enough sunlight.",
    url: "https://science.nasa.gov/mission/viper/" },
  { id: "artemis3", name: "Artemis III", who: "NASA", world: "moon", type: "lander", when: "Planned for the late 2020s", stage: "planned",
    what: "The first crewed Moon landing since Apollo 17 in 1972, aimed at the south polar region.",
    ghost: "Astronauts plan to set up science instruments and leave them behind, as every Apollo crew did, the newest neighbours of the Apollo ghosts.",
    url: "https://www.nasa.gov/mission/artemis-iii/" },
  { id: "ltv", name: "Lunar Terrain Vehicle", who: "NASA", world: "moon", type: "vehicle", when: "Planned for later Artemis missions", stage: "planned",
    what: "A new Moon car for Artemis astronauts that can also drive itself between crews. Companies are competing to build it.",
    ghost: "The great-grandchild of the three Apollo Moon cars still parked at Hadley, Descartes and Taurus-Littrow.",
    url: "https://www.nasa.gov/artemis/" },
  { id: "rosalind", name: "Rosalind Franklin rover", who: "ESA, with NASA parts", world: "mars", type: "rover", when: "Planned launch 2028", stage: "planned",
    what: "Europe's ExoMars rover will drill up to 2 metres under the surface of Mars, deeper than any rover before, looking for traces of life. NASA is supplying its landing engines and heater units.",
    ghost: "It will join the Vikings, Spirit, Opportunity and the rest of the quiet crowd on Mars.",
    url: "https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars" },
  { id: "dragonfly", name: "Dragonfly", who: "NASA", world: "deep", type: "helicopter", when: "Planned launch 2028, arrival 2034", stage: "planned",
    what: "A car-sized, nuclear-powered drone that will hop between sites on Saturn's moon Titan, a world with thick air, rivers and lakes of liquid methane.",
    ghost: "Ingenuity's big cousin. When it stops flying it will be the first machine left on a moon of Saturn since the Huygens probe in 2005.",
    url: "https://science.nasa.gov/mission/dragonfly/" }
];

(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const STAGE = { waiting: ["Waiting", "#ffb347"], working: ["Still working", "#5ee6a8"], flying: ["On its way", "#7fd4ff"], planned: ["Planned", "#c9a7ff"] };

  $("#fuGrid").innerHTML = FUTURE.map(f => `
    <article class="fu-card" data-w="${f.world}" data-s="${f.stage}" id="${f.id}">
      <div class="fu-top"><span class="fu-ic" style="--c:${WORLDS[f.world].color}">${typeIco(f.type)}</span>
        <span class="pill" style="color:${STAGE[f.stage][1]}">${STAGE[f.stage][0]}</span><span class="fu-when">${esc(f.when)}</span></div>
      <h2>${esc(f.name)}</h2>
      <p class="fu-who">${esc(f.who)} · ${esc(WORLDS[f.world].short)}</p>
      <p>${esc(f.what)}</p>
      <p class="fu-ghost"><span>How it becomes a ghost</span>${esc(f.ghost)}</p>
      <div class="fu-actions">
        <button class="btn btn-small" data-say="${f.id}" aria-pressed="false">${ico("speaker")} Read aloud</button>
        <a class="btn btn-small" href="${f.url}" target="_blank" rel="noopener">Agency page ↗</a>
      </div>
    </article>`).join("");

  $("#fuGrid").addEventListener("click", e => {
    const b = e.target.closest("[data-say]"); if (!b) return;
    const f = FUTURE.find(x => x.id === b.dataset.say);
    GhostVoice.toggle(b, `${f.name}. ${f.what} ${f.ghost}`);
  });
  if (!GhostVoice.ok) $$("[data-say]").forEach(b => (b.hidden = true));

  let world = "all";
  function apply() {
    let n = 0;
    $$("#fuGrid .fu-card").forEach(c => { const show = world === "all" || c.dataset.w === world; c.hidden = !show; if (show) n++; });
    $("#fuCount").textContent = `${n} future ${n === 1 ? "ghost" : "ghosts"}`;
  }
  $$(".cat-chips button").forEach(b => b.addEventListener("click", () => {
    world = b.dataset.f; $$(".cat-chips button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); apply();
  }));
  apply();
  window.GLOSSARY_APPLY?.($("#fuGrid"));

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
