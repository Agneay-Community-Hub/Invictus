/* ===========================================================
   Ghost Shorts: short cartoon videos of the machines, made in Blender
   (see scripts/shorts/). SHORTS lists the ones made so far; any page
   can call openShort(id) to play one in a pop-up, with subtitles.
   =========================================================== */
const SHORTS = {   // written by scripts/shorts/make_shorts.py
  ranger7: { title: "Ranger 7", src: "assets/video/ranger7.mp4", poster: "assets/video/ranger7.jpg", vtt: "assets/video/ranger7.vtt", length: "35 s" },
  surveyor1: { title: "Surveyor 1", src: "assets/video/surveyor1.mp4", poster: "assets/video/surveyor1.jpg", vtt: "assets/video/surveyor1.vtt", length: "29 s" },
  surveyor3: { title: "Surveyor 3", src: "assets/video/surveyor3.mp4", poster: "assets/video/surveyor3.jpg", vtt: "assets/video/surveyor3.vtt", length: "32 s" },
  apollo11: { title: "Tranquility Base", src: "assets/video/apollo11.mp4", poster: "assets/video/apollo11.jpg", vtt: "assets/video/apollo11.vtt", length: "34 s" },
  apollo12: { title: "Apollo 12 ALSEP", src: "assets/video/apollo12.mp4", poster: "assets/video/apollo12.jpg", vtt: "assets/video/apollo12.vtt", length: "34 s" },
  apollo14: { title: "Apollo 14 site", src: "assets/video/apollo14.mp4", poster: "assets/video/apollo14.jpg", vtt: "assets/video/apollo14.vtt", length: "30 s" },
  apollo15: { title: "Lunar Roving Vehicle 1", src: "assets/video/apollo15.mp4", poster: "assets/video/apollo15.jpg", vtt: "assets/video/apollo15.vtt", length: "34 s" },
  apollo16: { title: "Lunar Roving Vehicle 2", src: "assets/video/apollo16.mp4", poster: "assets/video/apollo16.jpg", vtt: "assets/video/apollo16.vtt", length: "31 s" },
  apollo17: { title: "Lunar Roving Vehicle 3", src: "assets/video/apollo17.mp4", poster: "assets/video/apollo17.jpg", vtt: "assets/video/apollo17.vtt", length: "35 s" },
  sivb16: { title: "Apollo 16 S-IVB stage", src: "assets/video/sivb16.mp4", poster: "assets/video/sivb16.jpg", vtt: "assets/video/sivb16.vtt", length: "32 s" },
  lcross: { title: "LCROSS & Centaur", src: "assets/video/lcross.mp4", poster: "assets/video/lcross.jpg", vtt: "assets/video/lcross.vtt", length: "35 s" },
  grail: { title: "GRAIL Ebb & Flow", src: "assets/video/grail.mp4", poster: "assets/video/grail.jpg", vtt: "assets/video/grail.vtt", length: "31 s" },
  ladee: { title: "LADEE", src: "assets/video/ladee.mp4", poster: "assets/video/ladee.jpg", vtt: "assets/video/ladee.vtt", length: "28 s" },
  prospector: { title: "Lunar Prospector", src: "assets/video/prospector.mp4", poster: "assets/video/prospector.jpg", vtt: "assets/video/prospector.vtt", length: "40 s" },
  viking1: { title: "Viking 1: Facing the Wrong Way", src: "assets/video/viking1.mp4", poster: "assets/video/viking1.jpg", vtt: "assets/video/viking1.vtt", length: "50 s" },
  viking2: { title: "Viking 2 Lander", src: "assets/video/viking2.mp4", poster: "assets/video/viking2.jpg", vtt: "assets/video/viking2.vtt", length: "25 s" },
  pathfinder: { title: "Mars Pathfinder", src: "assets/video/pathfinder.mp4", poster: "assets/video/pathfinder.jpg", vtt: "assets/video/pathfinder.vtt", length: "30 s" },
  sojourner: { title: "Sojourner", src: "assets/video/sojourner.mp4", poster: "assets/video/sojourner.jpg", vtt: "assets/video/sojourner.vtt", length: "30 s" },
  polarlander: { title: "Mars Polar Lander", src: "assets/video/polarlander.mp4", poster: "assets/video/polarlander.jpg", vtt: "assets/video/polarlander.vtt", length: "31 s" },
  spirit: { title: "Spirit", src: "assets/video/spirit.mp4", poster: "assets/video/spirit.jpg", vtt: "assets/video/spirit.vtt", length: "33 s" },
  opportunity: { title: "Opportunity", src: "assets/video/opportunity.mp4", poster: "assets/video/opportunity.jpg", vtt: "assets/video/opportunity.vtt", length: "38 s" },
  phoenix: { title: "Phoenix", src: "assets/video/phoenix.mp4", poster: "assets/video/phoenix.jpg", vtt: "assets/video/phoenix.vtt", length: "34 s" },
  insight: { title: "InSight", src: "assets/video/insight.mp4", poster: "assets/video/insight.jpg", vtt: "assets/video/insight.vtt", length: "37 s" },
  ingenuity: { title: "Ingenuity", src: "assets/video/ingenuity.mp4", poster: "assets/video/ingenuity.jpg", vtt: "assets/video/ingenuity.vtt", length: "38 s" },
  backshell: { title: "Perseverance backshell & parachute", src: "assets/video/backshell.mp4", poster: "assets/video/backshell.jpg", vtt: "assets/video/backshell.vtt", length: "32 s" },
  curiosity: { title: "Curiosity", src: "assets/video/curiosity.mp4", poster: "assets/video/curiosity.jpg", vtt: "assets/video/curiosity.vtt", length: "25 s" },
  pioneer10: { title: "Pioneer 10", src: "assets/video/pioneer10.mp4", poster: "assets/video/pioneer10.jpg", vtt: "assets/video/pioneer10.vtt", length: "33 s" },
  pioneer11: { title: "Pioneer 11", src: "assets/video/pioneer11.mp4", poster: "assets/video/pioneer11.jpg", vtt: "assets/video/pioneer11.vtt", length: "28 s" },
  voyager1: { title: "Voyager 1", src: "assets/video/voyager1.mp4", poster: "assets/video/voyager1.jpg", vtt: "assets/video/voyager1.vtt", length: "37 s" },
  voyager2: { title: "Voyager 2", src: "assets/video/voyager2.mp4", poster: "assets/video/voyager2.jpg", vtt: "assets/video/voyager2.vtt", length: "34 s" },
  near: { title: "NEAR Shoemaker", src: "assets/video/near.mp4", poster: "assets/video/near.jpg", vtt: "assets/video/near.vtt", length: "33 s" },
  deepimpact: { title: "Deep Impact impactor", src: "assets/video/deepimpact.mp4", poster: "assets/video/deepimpact.jpg", vtt: "assets/video/deepimpact.vtt", length: "27 s" },
  newhorizons: { title: "New Horizons", src: "assets/video/newhorizons.mp4", poster: "assets/video/newhorizons.jpg", vtt: "assets/video/newhorizons.vtt", length: "22 s" },
  messenger: { title: "MESSENGER", src: "assets/video/messenger.mp4", poster: "assets/video/messenger.jpg", vtt: "assets/video/messenger.vtt", length: "36 s" },
  pioneervenus: { title: "Pioneer Venus probes", src: "assets/video/pioneervenus.mp4", poster: "assets/video/pioneervenus.jpg", vtt: "assets/video/pioneervenus.vtt", length: "37 s" },
  galileo: { title: "Galileo & its probe", src: "assets/video/galileo.mp4", poster: "assets/video/galileo.jpg", vtt: "assets/video/galileo.vtt", length: "32 s" },
  cassini: { title: "Cassini", src: "assets/video/cassini.mp4", poster: "assets/video/cassini.jpg", vtt: "assets/video/cassini.vtt", length: "36 s" },
  dawn: { title: "Dawn", src: "assets/video/dawn.mp4", poster: "assets/video/dawn.jpg", vtt: "assets/video/dawn.vtt", length: "39 s" },
  magellan: { title: "Magellan", src: "assets/video/magellan.mp4", poster: "assets/video/magellan.jpg", vtt: "assets/video/magellan.vtt", length: "36 s" },
  mariner9: { title: "Mariner 9", src: "assets/video/mariner9.mp4", poster: "assets/video/mariner9.jpg", vtt: "assets/video/mariner9.vtt", length: "36 s" },
  mco: { title: "Mars Climate Orbiter", src: "assets/video/mco.mp4", poster: "assets/video/mco.jpg", vtt: "assets/video/mco.vtt", length: "34 s" },
  mgs: { title: "Mars Global Surveyor", src: "assets/video/mgs.mp4", poster: "assets/video/mgs.jpg", vtt: "assets/video/mgs.vtt", length: "35 s" },
  vanguard1: { title: "Vanguard 1", src: "assets/video/vanguard1.mp4", poster: "assets/video/vanguard1.jpg", vtt: "assets/video/vanguard1.vtt", length: "35 s" },
  mariner2: { title: "Mariner 2", src: "assets/video/mariner2.mp4", poster: "assets/video/mariner2.jpg", vtt: "assets/video/mariner2.vtt", length: "35 s" },
  mariner4: { title: "Mariner 4", src: "assets/video/mariner4.mp4", poster: "assets/video/mariner4.jpg", vtt: "assets/video/mariner4.vtt", length: "37 s" },
  isee3: { title: "ISEE-3 / ICE", src: "assets/video/isee3.mp4", poster: "assets/video/isee3.jpg", vtt: "assets/video/isee3.vtt", length: "37 s" },
  kepler: { title: "Kepler", src: "assets/video/kepler.mp4", poster: "assets/video/kepler.jpg", vtt: "assets/video/kepler.vtt", length: "38 s" },
  spitzer: { title: "Spitzer Space Telescope", src: "assets/video/spitzer.mp4", poster: "assets/video/spitzer.jpg", vtt: "assets/video/spitzer.vtt", length: "34 s" },
  stardust: { title: "Stardust", src: "assets/video/stardust.mp4", poster: "assets/video/stardust.jpg", vtt: "assets/video/stardust.vtt", length: "30 s" }
};
(() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const css = document.createElement("style");
  css.textContent = `
  .gs-back{position:fixed;inset:0;z-index:260;background:rgba(3,6,12,.86);display:grid;place-items:center;padding:16px}
  .gs-back[hidden]{display:none}
  .gs-box{width:min(960px,100%);background:var(--bg2,#0b1120);border:1px solid var(--line2,#2f4166);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px -20px #000}
  .gs-box video{display:block;width:100%;aspect-ratio:16/9;background:#000}
  .gs-bar{display:flex;align-items:center;gap:12px;padding:10px 14px}
  .gs-bar h2{margin:0;font-size:1rem;flex:1}
  .gs-bar small{color:var(--dim,#7e8ca6)}
  .gs-bar button{background:none;border:1px solid var(--line2,#2f4166);color:var(--text,#e9eef7);border-radius:10px;padding:6px 12px;font:inherit;cursor:pointer}`;
  document.head.appendChild(css);
  let back = null, last = null;
  window.openShort = id => {
    const s = SHORTS[id]; if (!s) return;
    last = document.activeElement;
    back ??= Object.assign(document.createElement("div"), { className: "gs-back" });
    back.innerHTML = `<div class="gs-box" role="dialog" aria-modal="true" aria-label="${esc(s.title)}">
      <video controls autoplay playsinline preload="metadata" poster="${s.poster}"><source src="${s.src}" type="video/mp4"><track kind="captions" srclang="en" label="English" src="${s.vtt}" default></video>
      <div class="gs-bar"><h2>${esc(s.title)}</h2><small>Ghost Shorts · ${esc(s.length)}</small><button type="button" data-close>Close</button></div></div>`;
    document.body.appendChild(back); back.hidden = false;
    const close = () => { back.querySelector("video")?.pause(); back.hidden = true; back.innerHTML = ""; last?.focus?.(); removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    back.querySelector("[data-close]").addEventListener("click", close);
    back.addEventListener("click", e => { if (e.target === back) close(); }, { once: true });
    addEventListener("keydown", onKey);
    back.querySelector("[data-close]").focus();
  };
  document.addEventListener("click", e => { const b = e.target.closest("[data-short]"); if (b) { e.preventDefault(); openShort(b.dataset.short); } });
})();
