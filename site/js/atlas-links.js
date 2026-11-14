/* ===========================================================
   Links into "3D Worlds" (site/atlas/): the walkable Moon and
   Mars landing sites and mission replays, built from
   atlas/ (see atlas/README-GHOSTS.md). Each button switches the page
   to his app at one feature; his app shows "← Home"
   to come back to where you were.
   =========================================================== */
const ATLAS_SITES = {
  apollo11: "tranquility-base", apollo12: "apollo-12", apollo14: "apollo-14", apollo15: "apollo-15",
  apollo16: "apollo-16", apollo17: "apollo-17",
  viking1: "mars-viking-1", viking2: "mars-viking-2", pathfinder: "mars-pathfinder", sojourner: "mars-pathfinder",
  spirit: "mars-spirit", opportunity: "victoria-crater", phoenix: "mars-phoenix", curiosity: "mars-curiosity", insight: "mars-insight"
};
const ATLAS_RELIVE = { apollo11: "apollo-11", opportunity: "mer-opportunity" };

// Mission catalogue id (js/atlas-data.js) → our machines (js/data.js), for links in both directions
const MISSION_MACHINES = {
  "apollo-11": ["apollo11"], "apollo-12": ["apollo12", "surveyor3"], "apollo-14": ["apollo14"], "apollo-15": ["apollo15"],
  "apollo-16": ["apollo16", "sivb16"], "apollo-17": ["apollo17"], "lcross": ["lcross"],
  "viking-1": ["viking1"], "viking-2": ["viking2"], "mars-pathfinder": ["pathfinder", "sojourner"], "mer-spirit": ["spirit"],
  "mer-opportunity": ["opportunity"], "phoenix": ["phoenix"], "msl-curiosity": ["curiosity"], "insight": ["insight"],
  "mars-2020": ["ingenuity", "backshell"], "mariner-9": ["mariner9"], "mars-global-surveyor": ["mgs"], "cassini": ["cassini"],
  "mariner-2": ["mariner2"], "mariner-4": ["mariner4"], "pioneer-10": ["pioneer10"], "pioneer-11": ["pioneer11"],
  "voyager-1": ["voyager1"], "voyager-2": ["voyager2"], "pioneer-venus-1": ["pioneervenus"], "pioneer-venus-2": ["pioneervenus"],
  "magellan": ["magellan"], "galileo": ["galileo"], "near": ["near"], "stardust": ["stardust"], "messenger": ["messenger"],
  "deep-impact": ["deepimpact"], "new-horizons": ["newhorizons"], "dawn": ["dawn"]
};
const ATLAS_RELIVE_BY_MISSION = { "apollo-11": "apollo-11", "mer-opportunity": "mer-opportunity" };

// go: site | relive | journey (see atlas/src/embed/ghosts.ts)
function atlasURL(go, id) {
  const base = new URL(location.pathname.includes("/machines/") ? "../atlas/index.html" : "atlas/index.html", location.href);
  if (go) base.searchParams.set("go", go);
  if (id) base.searchParams.set("id", id);
  base.searchParams.set("from", location.pathname + location.search + location.hash);
  return base.href;
}

// <a data-atlas="site:tranquility-base">: fill in the address when clicked, so "from" is the current page
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-atlas]");
  if (!a) return;
  const [go, id] = a.dataset.atlas.split(":");
  a.href = atlasURL(go, id);
});
