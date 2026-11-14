/* ===========================================================
   Comic issues (comics.html). Issue #1, "Facing the Wrong Way", is
   written by hand: the Viking 1 Lander tells its own story. Every
   other machine gets a shorter issue built from its dossier in
   data.js. Page layouts: cover, splash, two, three, four, tall, back.
   =========================================================== */
window.ISSUES = (() => {
  const by = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const SOL = 88775.244e3; // one Mars day in ms
  const solsSince = d => Math.floor((Date.now() - d) / SOL);
  const SKYW = { moon: "moon", mars: "marsDay", deep: "space" };

  // ---- Issue #1: Viking 1, by hand ----
  const V = by.viking1;
  const viking1 = {
    id: "viking1", title: "Facing the Wrong Way", star: V, featured: true,
    pages: [
      { cover: true, art: { bg: "marsDusk", seed: 3, sun: [262, 150, 9], earth: [148, 104], ground: 196, groundOpts: { bigJoe: [284, 232], rocks: 8 }, viking: [205, 204, .95, { dish: "away", beam: "lost", dust: .35 }], speed: [205, 190, 26, 70, 330] },
        tag: "The true story of a machine that never stopped talking" },

      { layout: "three", panels: [
        { art: { bg: "space", seed: 5, planet: [300, 330, 210, "#c56a3e", { craters: true }], orbiter: [150, 110, .8] }, cap: [["Summer, 1976. For ten months I rode across space, folded up inside my shell on the back of my orbiter.", "tl"]] },
        { art: { bg: "space", seed: 9, planet: [200, 170, 120, "#c56a3e", { craters: true }], glints: [[170, 150, 10]] }, cap: [["The plan was to land on July 4th, my country's 200th birthday.", "tl"]] },
        { art: { bg: "room", screen: "mars", text: "LANDING SITE A-1" }, bubble: ["Too rough. Rocks everywhere. We can't put her down there.", "br", true], cap: [["The first pictures from orbit showed the spot was too dangerous. So we kept looking.", "tl"]] }
      ] },

      { layout: "splash", panels: [
        { art: { bg: "marsDay", seed: 11, sun: [340, 50, 10], ground: 250, aeroshell: [140, 120, 1], speed: [140, 100, 22, 60, 260], flames: [270, 205], viking: [270, 196, .7, {}] },
          sfx: ["FWOOOSH!", 18, 66, -12, 64, "#ffb347"], cap: [["July 20, 1976. Seven years to the day after people first walked on the Moon.", "tl"], ["Heat shield. Parachute. Then three little rockets to slow my fall.", "br"]] }
      ] },

      { layout: "two", panels: [
        { art: { bg: "footpad", seed: 13 }, sfx: ["THUMP.", 260, 80, 8, 54, "#c0392b"], cap: [["I touched down on Chryse Planitia, the Plain of Gold.", "tl"]] },
        { art: { bg: "room", screen: "mars", text: "FIRST PICTURE" }, cap: [["The very first picture anyone ever took on the surface of Mars was of my own foot.", "tl"]], bubble: ["We're on Mars. We're actually on Mars!", "br", true] }
      ] },

      { layout: "three", panels: [
        { art: { bg: "photo", src: "assets/nasa/" + V.media[0].f }, cap: [["Then I opened my eyes properly and looked around.", "tl"]], photo: V.media[0] },
        { art: { bg: "marsDay", seed: 17, sun: [320, 60, 10], ground: 210, groundOpts: { rocks: 14 } }, cap: [["The sky wasn't blue. It was the colour of butterscotch, from dust floating in the air.", "tl"]] },
        { art: { bg: "room", screen: "mars", text: "LIVE FROM MARS" }, cap: [["Back on Earth, people crowded around screens to see a new world.", "tl"]] }
      ] },

      { layout: "four", panels: [
        { art: { bg: "marsDay", seed: 19, ground: 190, viking: [170, 210, 1.1, { arm: [140, 40] }] }, sfx: ["SKRRRCH", 230, 250, -8, 34, "#c0392b"], cap: [["My job: find out if anything lives here. I dug up soil with my scoop…", "tl"]] },
        { art: { bg: "room", screen: "dark", text: "RELEASE: +++ ???" }, cap: [["…and fed it to three tiny laboratories inside my body.", "tl"]], bubble: ["Wait. Something's giving off gas!", "br", true] },
        { art: { bg: "marsDay", seed: 23, ground: 200, crackle: [200, 120, 18] }, cap: [["Was it something alive? Or just strange, fizzy chemistry?", "tl"], ["People are still arguing about it today.", "br"]] },
        { art: { bg: "marsDusk", seed: 29, sun: [80, 190, 10], ground: 220, viking: [260, 232, .8, { beam: "home" }] }, cap: [["Every day I sent home a weather report. The first weather reports ever sent from another planet.", "tl"]] }
      ] },

      { layout: "tall", panels: [
        { art: { bg: "marsDay", seed: 31, ground: 170, groundOpts: { bigJoe: [200, 260], rocks: 6 } }, cap: [["A big boulder sat a few metres in front of me. The team named it Big Joe.", "tl"]], sfx: ["BIG JOE", 140, 160, -6, 40, "#ffb347"] },
        { art: { bg: "photo", src: "assets/nasa/" + V.media[1].f }, cap: [["Martian sunsets are blue. I watched more than two thousand of them.", "tl"]], photo: V.media[1] },
        { art: { bg: "photo", src: "assets/nasa/" + V.media[2].f }, cap: [["I carried my country's flag, painted on my side.", "tl"]], photo: V.media[2] }
      ] },

      { layout: "three", fade: .9, panels: [
        { art: { bg: "space", seed: 37, planet: [200, 150, 110, "#c56a3e", { craters: true }], glints: [[150, 110, 9], [260, 120, 9]] }, cap: [["I wasn't alone. My twin, Viking 2, landed in September 1976, about 6,500 km away.", "tl"]] },
        { art: { bg: "marsDay", seed: 41, ground: 200, frost: true, viking: [200, 222, .9, {}] }, cap: [["She sent home pictures of frost on the ground. Frost, on Mars!", "tl"]] },
        { art: { bg: "marsNight", seed: 43, ground: 210, viking: [200, 228, .9, { dust: .2 }] }, cap: [["In April 1980 her batteries failed. She went quiet first.", "tl"], ["Then it was just me.", "br"]] }
      ] },

      { layout: "two", fade: .85, panels: [
        { art: { bg: "marsDay", seed: 47, ground: 205, viking: [200, 222, 1.1, { dust: .25 }] }, cap: [["In 1981 they gave me a new name: the Thomas Mutch Memorial Station.", "tl"], ["Tim Mutch led my camera team. He was lost while climbing a mountain in the Himalayas.", "br"]] },
        { art: { bg: "marsDusk", seed: 53, sun: [90, 190, 9], ground: 220, viking: [240, 234, .8, { beam: "home", dust: .3 }] }, cap: [["I was set to keep going on my own: a weather report home every week, for years to come.", "tl"]] }
      ] },

      { layout: "splash", fade: .8, panels: [
        { art: { bg: "room", screen: "dark", text: "UPLOAD: BATTERY PROGRAM v2" }, sfx: ["BEEP.", 300, 270, 6, 44, "#9fe0ff"], cap: [["November 1982. A small update, sent from Earth, to change how I charged my batteries. Routine.", "tl"]], bubble: ["Sending the new program now.", "br", true] }
      ] },

      { layout: "four", fade: .65, panels: [
        { art: { bg: "marsDay", seed: 59, earth: [70, 50], ground: 210, viking: [220, 232, 1, { dish: "home", beam: "home", dust: .3 }] }, cap: [["But the new commands wrote over the ones that told my dish where Earth was.", "tl"]] },
        { art: { bg: "marsDay", seed: 61, earth: [70, 50], ground: 210, viking: [220, 232, 1, { dish: "turning", dust: .3 }] }, sfx: ["whirrrr…", 230, 70, -10, 36, "#1d1814"] },
        { art: { bg: "marsDay", seed: 67, earth: [70, 50], ground: 210, viking: [220, 232, 1, { dish: "away", beam: "lost", dust: .3 }] }, cap: [["My dish turned to face empty sky.", "tl"], ["I kept talking. Nobody could hear me.", "br"]] },
        { art: { bg: "room", screen: "dark", text: "NO SIGNAL" }, bubble: ["Viking 1, do you read? …Viking 1?", "tl", true], sfx: ["…", 300, 250, 0, 60, "#9fe0ff"] }
      ] },

      { layout: "three", fade: .45, dust: .2, panels: [
        { art: { bg: "marsDay", seed: 71, ground: 210, viking: [200, 230, .9, { dish: "away", dust: .45 }] }, cap: [["Sol 2,245. That's the last day anyone heard me.", "tl"]] },
        { art: { bg: "marsNight", seed: 73, ground: 210, viking: [200, 230, .9, { dish: "away", dust: .6 }], dust: .12 }, sfx: ["kssshhh…", 40, 90, -6, 40, "#e6b088"], cap: [["Sol 5,000. The wind never stops. It sounds like this.", "tl"]] },
        { art: { bg: "marsDay", seed: 79, ground: 210, viking: [200, 230, .9, { dish: "away", dust: .8 }], dust: .2 }, cap: [["Sol 10,000. I'm wearing a coat of red dust now.", "tl"]] }
      ] },

      { layout: "four", fade: .5, dust: .25, panels: [
        { art: { bg: "marsDay", seed: 83, ground: 230, airbags: [260, 150] }, cap: [["1997. Something bounced in on giant airbags, about 830 km away. Pathfinder, with a tiny rover called Sojourner.", "tl"]], link: ["pathfinder", "Pathfinder's story"] },
        { art: { bg: "marsNight", seed: 89, ground: 230, glints: [[120, 70, 14], [290, 90, 14]] }, cap: [["2004. Two lights, far across the planet: Spirit and Opportunity.", "tl"]], link: ["opportunity", "Opportunity's story"] },
        { art: { bg: "marsDusk", seed: 97, ground: 236, skycrane: [230, 150] }, cap: [["2012. A flying crane lowered Curiosity on cables, like a spider on a thread.", "tl"]], link: ["curiosity", "Curiosity's story"] },
        { art: { bg: "marsDay", seed: 101, ground: 230, heli: [200, 130, .9] }, sfx: ["bzzzzz", 250, 80, 8, 36, "#1d1814"], cap: [["2021. A helicopter flew on Mars! I'd never seen anything fly here before.", "tl"]], link: ["ingenuity", "Ingenuity's story"] }
      ] },

      { layout: "two", fade: .45, dust: .25, panels: [
        { art: { bg: "top", label: "ORBIT CAMERA · DEC 2006" }, cap: [["December 2006. A camera on a spacecraft circling Mars took my picture from above.", "tl"]] },
        { art: { bg: "marsDay", seed: 103, ground: 210, viking: [200, 230, 1, { dish: "away", dust: .8 }], glints: [[330, 40, 10]] }, cap: [["I'm just a bright dot with a shadow from up there. But someone was still looking for me.", "tl"]] }
      ] },

      { layout: "splash", fade: .3, dust: .3, sol: true, panels: [
        { art: { bg: "marsNight", seed: 107, earth: [70, 60, "Earth"], ground: 214, groundOpts: { bigJoe: [330, 250] }, viking: [200, 226, 1.4, { dish: "away", beam: "lost", dust: .85 }] },
          cap: [["I'm still facing the wrong way.", "tl"], ["If you could see me, I'm the dot just there, next to Big Joe. Still here.", "br"]] }
      ] },

      { back: true }
    ]
  };

  // ---- every other machine: an issue built from its dossier ----
  const sentences = t => String(t || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  function make(a, n) {
    const W = a.world, sky = SKYW[W], m = [a.type === "impactor" ? "impactor" : a.type, 200, W === "deep" ? 170 : 200, W === "deep" ? 1 : 1.25];
    const g = sentences(a.ghost), photos = a.media || [];
    const gnd = W === "deep" ? null : 212;
    const worldArt = { mars: { planet: [200, 170, 110, "#c56a3e", { craters: true }] }, moon: { planet: [200, 170, 110, "#b9b3a6", { craters: true }] }, deep: { planet: [300, 330, 220, "#8fb0d8", { bands: true }] } }[W];
    const pages = [
      { cover: true, art: { bg: sky, seed: n * 7, ground: gnd, machine: m, speed: [200, 150, 24, 130, 320], ...(W === "deep" ? { planet: [330, 260, 90, "#8fb0d8", { bands: true }] } : {}) }, tag: a.epitaph },
      { layout: "three", panels: [
        { art: { bg: "earth", seed: n * 7 + 1, rocket: [200, 230, 1] }, sfx: ["WHOOOM!", 20, 70, -10, 54, "#ffb347"], cap: [[`${a.dates.launch}. Lift-off.`, "tl"]] },
        { art: { bg: "space", seed: n * 7 + 2, ...worldArt }, cap: [[`The plan: ${a.planned.charAt(0).toLowerCase() + a.planned.slice(1)}`, "tl"]] },
        { art: { bg: sky, seed: n * 7 + 3, ground: gnd, machine: m }, cap: [[`Arrival: ${a.dates.arrive}.`, "tl"]] }
      ] },
      { layout: photos[0] ? "two" : "splash", panels: [
        { art: { bg: sky, seed: n * 7 + 4, ground: gnd, machine: [m[0], 200, m[2], m[3] * 1.15] }, cap: [[g.slice(0, 2).join(" "), "tl"], ...(g[2] ? [[g.slice(2, 4).join(" "), "br"]] : [])] },
        ...(photos[0] ? [{ art: { bg: "photo", src: "assets/nasa/" + photos[0].f }, cap: [[photos[0].cap, "bl"]], photo: photos[0] }] : [])
      ] },
      { layout: "four", panels: [
        ...(a.discoveries || []).slice(0, 3).map((d, i) => ({ art: { bg: sky, seed: n * 7 + 5 + i, ground: gnd ? 230 : null, crackle: [200, 130, 12 + i * 4], glints: [[200, 120, 22]] }, cap: [[d, "tl"]], ...(i === 0 ? { sfx: ["EUREKA!", 70, 250, -8, 30, "#ffb347"] } : {}) })),
        photos[1] ? { art: { bg: "photo", src: "assets/nasa/" + photos[1].f }, cap: [[photos[1].cap, "bl"]], photo: photos[1] } : { art: { bg: sky, seed: n * 7 + 9, ground: gnd, machine: m }, cap: [[a.fun, "tl"]] }
      ].slice(0, 4) },
      { layout: "tall", panels: [
        { art: { bg: sky, seed: n * 7 + 10, ground: gnd, machine: [m[0], 200, m[2], m[3] * .9], speed: [200, 150, 18, 120, 300] }, cap: [["By the numbers", "tl"]], stats: a.stats },
        { art: { bg: "room", screen: "dark", text: "DID YOU KNOW?" }, cap: [[a.fun, "tl"]] },
        photos[2] ? { art: { bg: "photo", src: "assets/nasa/" + photos[2].f }, cap: [[photos[2].cap, "bl"]], photo: photos[2] } : { art: { bg: sky, seed: n * 7 + 11, ground: gnd, glints: [[200, 120, 20]] }, cap: [[a.legacy, "tl"]] }
      ] },
      { layout: "two", fade: a.status === "active" ? 1 : .55, panels: [
        { art: { bg: a.type === "impactor" || a.status === "impact" ? "space" : sky, seed: n * 7 + 12, ground: gnd, ...(a.status === "impact" ? { crackle: [200, 160, 30], glints: [[200, 160, 50]], speed: [200, 160, 30, 20, 300] } : { machine: m }) },
          sfx: a.status === "impact" ? ["KRAKOOM!", 30, 80, -10, 56, "#ffb347"] : null, cap: [[`Last contact: ${a.dates.last}.`, "tl"], [a.actual, "br"]] },
        { art: { bg: sky === "marsDay" ? "marsNight" : sky, seed: n * 7 + 13, ground: gnd, machine: m, dust: W === "mars" ? .18 : 0 }, cap: [[a.status === "active" ? "I'm still working. Not a ghost yet." : g[g.length - 1] || a.legacy, "tl"]] }
      ] },
      { layout: "splash", fade: a.status === "active" ? .9 : .35, sol: false, panels: [
        { art: { bg: sky === "marsDay" ? "marsNight" : sky, seed: n * 7 + 14, ground: gnd, machine: [m[0], 200, m[2], m[3] * 1.3], earth: W === "deep" ? null : [70, 60, "Earth"] }, cap: [[`“${a.epitaph}”`, "br"]] }
      ] },
      { back: true }
    ];
    return { id: a.id, title: a.nick && a.nick !== a.mission ? a.nick : a.name, star: a, pages };
  }

  const order = ["viking1", ...ARTIFACTS.map(a => a.id).filter(id => id !== "viking1")];
  const cache = { viking1 };
  return {
    order, solsSince,
    get: id => cache[id] || (by[id] ? (cache[id] = make(by[id], order.indexOf(id) + 1)) : null),
    number: id => order.indexOf(id) + 1
  };
})();
