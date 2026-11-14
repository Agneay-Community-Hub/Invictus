/* ===========================================================
   Build a probe, in 3D (probe.html, second column). The model is
   built from simple shapes as you choose parts: a six-wheeled rover
   for the Moon and Mars, an orbiter for everywhere else. Click a part
   to swap or remove it, or a glowing "+" to add one. During launch,
   each step of the mission log plays out on the model: short circuits,
   frost, overheating, dust, dead power and radio waves.
   =========================================================== */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const box = document.getElementById("pb3d"), stage = document.getElementById("pb3dStage");
const PB = window.PB;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
catch { box.classList.add("no3d"); box.querySelector(".pb3d-msg").hidden = false; throw new Error("no WebGL"); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, .1, 200);
camera.position.set(4.2, 2.8, 4.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, .95, 0); controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 3; controls.maxDistance = 14; controls.maxPolarAngle = Math.PI * .52;
controls.autoRotate = !reduce; controls.autoRotateSpeed = .8;
renderer.domElement.addEventListener("pointerdown", () => (controls.autoRotate = false));

scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x2a1d14, .9));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.4); sun.position.set(5, 8, 4); scene.add(sun);
const rim = new THREE.DirectionalLight(0x7fd4ff, .8); rim.position.set(-6, 3, -5); scene.add(rim);

// ---- surroundings: ground for the Moon and Mars, stars for space ----
const groundMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 1 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 64), groundMat); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const starGeo = new THREE.BufferGeometry(), sp = [];
for (let i = 0; i < 900; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 30); sp.push(v.x, v.y, v.z); }
starGeo.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: .25, sizeAttenuation: true })));
const planet = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 32), new THREE.MeshStandardMaterial({ color: 0xd9b38c, roughness: 1 }));
planet.position.set(-46, -4, -62); scene.add(planet);

// ---- materials ----
const M = {
  white: new THREE.MeshStandardMaterial({ color: 0xe8ebf0, roughness: .5, metalness: .2 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: .3, metalness: .85, emissive: 0x000000 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: .8 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: .35, metalness: .8 }),
  panel: new THREE.MeshStandardMaterial({ color: 0x2149b8, roughness: .3, metalness: .25, emissive: 0x0a1a55, emissiveIntensity: .5 }),
  rtg: new THREE.MeshStandardMaterial({ color: 0x5b5f66, roughness: .5, metalness: .7, emissive: 0x551800, emissiveIntensity: .6 }),
  battery: new THREE.MeshStandardMaterial({ color: 0x2f6fd6, roughness: .4, metalness: .3 }),
  heat: new THREE.MeshStandardMaterial({ color: 0xff6a2b, emissive: 0xff4400, emissiveIntensity: .9, roughness: .4 }),
  blanket: new THREE.MeshStandardMaterial({ color: 0xffc46b, transparent: true, opacity: .28, roughness: .6, metalness: .4, depthWrite: false }),
  vault: new THREE.MeshStandardMaterial({ color: 0x8c96a3, roughness: .45, metalness: .9 }),
  led: new THREE.MeshBasicMaterial({ color: 0x5ee6a8 }),
  lens: new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: .1, metalness: .9 })
};
const ALL = Object.values(M);
const base = new Map(ALL.map(m => [m, { color: m.color.clone(), emissive: m.emissive?.clone(), ei: m.emissiveIntensity, opacity: m.opacity }]));

const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function dishGeo(r) {
  const pts = []; for (let i = 0; i <= 16; i++) { const x = r * i / 16; pts.push(new THREE.Vector2(x, x * x / (2.4 * r))); }
  const g = new THREE.LatheGeometry(pts, 40); return g;
}

// ---- the model ----
let probe = new THREE.Group(); scene.add(probe);
let parts = {}, hotspots = [], brain, led, mode = "", last = {};
function part(cat, key, label) { const g = new THREE.Group(); g.userData = { cat, key, label }; probe.add(g); parts[cat] = g; return g; }

function build(c) {
  const surface = c.dest === "moon" || c.dest === "mars" || !c.dest;
  const changed = cat => last[cat] !== (cat === "extra" ? (c.extra || []).join() : c[cat]);
  const fresh = { power: changed("power"), dish: changed("dish") };
  const prev = new Set((last.extra || "").split(",").filter(Boolean));
  scene.remove(probe); probe = new THREE.Group(); scene.add(probe); parts = {}; hotspots.forEach(h => scene.remove(h)); hotspots = [];
  mode = surface ? "rover" : "orbiter";
  restore();

  // surroundings
  ground.visible = surface; planet.visible = !surface;
  groundMat.color.set(c.dest === "mars" ? 0xa5522c : 0x8a8a8a);
  planet.material.color.set({ jupiter: 0xd9b38c, saturn: 0xe6d3a3, beyond: 0x6d7fa3 }[c.dest] || 0x8a8a8a);
  planet.scale.setScalar(c.dest === "beyond" ? .25 : 1);
  renderer.setClearColor(c.dest === "mars" ? 0x3a2418 : 0x000000, c.dest === "mars" ? .35 : 0);

  // body
  const body = part("body", "", surface ? "Rover body" : "Spacecraft body");
  if (surface) {
    add(body, boxG(1.6, .36, 1), M.white, 0, .78, 0);
    add(body, boxG(1.64, .05, 1.04), M.gold, 0, .98, 0);
    for (const x of [-.62, 0, .62]) for (const z of [-.64, .64]) { const w = add(body, new THREE.CylinderGeometry(.22, .22, .16, 24), M.dark, x, .24, z); w.rotation.x = Math.PI / 2; add(body, new THREE.CylinderGeometry(.08, .08, .17, 12), M.metal, x, .24, z).rotation.x = Math.PI / 2; }
    for (const z of [-.56, .56]) { add(body, boxG(1.3, .05, .05), M.metal, 0, .5, z).rotation.z = .08; add(body, boxG(.05, .3, .05), M.metal, -.3, .62, z); add(body, boxG(.05, .3, .05), M.metal, .35, .62, z); }
    add(body, new THREE.CylinderGeometry(.035, .035, .7, 10), M.metal, .58, 1.33, .28);
    const head = add(body, boxG(.18, .14, .3), M.white, .62, 1.72, .28);
    add(head, new THREE.CylinderGeometry(.04, .04, .03, 16), M.lens, .1, .01, -.07).rotation.z = Math.PI / 2;
    add(head, new THREE.CylinderGeometry(.04, .04, .03, 16), M.lens, .1, .01, .07).rotation.z = Math.PI / 2;
    const arm = add(body, boxG(.5, .05, .05), M.metal, 1.0, .72, -.3); arm.rotation.z = -.5;
    add(body, new THREE.SphereGeometry(.07, 12, 10), M.metal, 1.2, .6, -.3);
  } else {
    add(body, boxG(1, .9, 1), M.gold, 0, 1.15, 0);
    add(body, boxG(1.02, .06, 1.02), M.white, 0, 1.62, 0);
    add(body, new THREE.ConeGeometry(.18, .35, 20), M.metal, 0, .52, 0).rotation.x = Math.PI;
    for (const [x, z] of [[.48, .48], [-.48, .48], [.48, -.48], [-.48, -.48]]) add(body, boxG(.06, .06, .12), M.metal, x, 1.5, z);
  }
  // the brain: the electronics box, where short circuits happen
  brain = add(probe, boxG(.36, .16, .3), M.dark, surface ? -.2 : 0, surface ? 1.09 : 1.73, surface ? -.2 : .2);
  led = add(brain, new THREE.SphereGeometry(.035, 12, 10), M.led, .19, 0, 0);

  // power
  if (c.power) {
    const g = part("power", c.power, PB.POWER[c.power].name);
    const top = surface ? 1.02 : 1.15;
    if (c.power === "battery") { add(g, boxG(.28, .22, .5), M.battery, surface ? -.95 : -.62, surface ? .82 : 1.1, 0); add(g, boxG(.1, .04, .1), M.metal, surface ? -.95 : -.62, surface ? .95 : 1.23, .14); }
    if (c.power === "solarS" || c.power === "solarL") {
      if (surface) {
        add(g, boxG(1.5, .03, 1.0), M.panel, -.05, top + .04, 0);
        if (c.power === "solarL") for (const s of [-1, 1]) { const w = add(g, boxG(1.4, .03, .85), M.panel, -.05, top + .1, s * .95); w.rotation.x = s * -.12; }
      } else {
        const len = c.power === "solarL" ? 2.4 : 1.1, wid = c.power === "solarL" ? .85 : .6;
        for (const s of [-1, 1]) { add(g, boxG(.3, .04, .04), M.metal, s * .62, top, 0); add(g, boxG(len, .03, wid), M.panel, s * (.75 + len / 2), top, 0); }
      }
    }
    if (c.power === "rtg") {
      const r = new THREE.Group(); g.add(r);
      add(r, new THREE.CylinderGeometry(.14, .14, .62, 20), M.rtg);
      for (let i = 0; i < 8; i++) { const f = add(r, boxG(.02, .56, .16), M.metal); f.rotation.y = i * Math.PI / 4; f.position.set(Math.cos(i * Math.PI / 4) * .17, 0, -Math.sin(i * Math.PI / 4) * .17); }
      if (surface) { r.position.set(-1.0, 1.08, 0); r.rotation.z = .9; }
      else { add(g, boxG(.9, .04, .04), M.metal, -.95, 1.0, -.2); r.position.set(-1.45, 1.0, -.2); r.rotation.z = Math.PI / 2; }
    }
    if (fresh.power) pop(g);
  } else hotspot("power", surface ? [-.4, 1.3, 0] : [-.9, 1.2, 0], "Add power");

  // radio
  if (c.dish) {
    const g = part("dish", c.dish, PB.DISH[c.dish].name);
    const r = { s: 0, m: .45, l: .85 }[c.dish];
    const at = surface ? new THREE.Vector3(-.45, 1.0, .3) : new THREE.Vector3(0, 1.65, 0);
    if (c.dish === "s") { add(g, new THREE.CylinderGeometry(.015, .015, .7, 8), M.metal, at.x, at.y + .35, at.z); add(g, new THREE.SphereGeometry(.04, 10, 8), M.white, at.x, at.y + .72, at.z); }
    else {
      const post = surface ? .5 : .12;
      add(g, new THREE.CylinderGeometry(.03, .03, post, 8), M.metal, at.x, at.y + post / 2, at.z);
      const d = add(g, dishGeo(r), M.white, at.x, at.y + post, at.z); d.material = M.white; d.rotation.x = surface ? -.5 : 0;
      add(g, new THREE.CylinderGeometry(.01, .01, r * .6, 6), M.metal, at.x, at.y + post + r * .3, at.z);
    }
    g.userData.tip = new THREE.Vector3(at.x, at.y + (c.dish === "s" ? .72 : (surface ? .5 : .12) + r * .5), at.z);
    if (fresh.dish) pop(g);
  } else hotspot("dish", surface ? [-.45, 1.5, .3] : [0, 2.2, 0], "Add a radio");

  // protection
  const ex = c.extra || [];
  if (ex.includes("heat")) {
    const g = part("heat", "heat", PB.EXTRA.heat.name);
    if (surface) { add(g, boxG(1.7, .44, 1.1), M.blanket, 0, .78, 0); for (const x of [-.5, 0, .5]) add(g, boxG(.06, .04, 1.06), M.heat, x, .6, 0); }
    else { add(g, boxG(1.1, 1, 1.1), M.blanket, 0, 1.15, 0); for (const y of [.85, 1.15, 1.45]) add(g, boxG(1.06, .04, .04), M.heat, 0, y, .53); }
    if (!prev.has("heat")) pop(g);
  } else hotspot("heat", surface ? [.3, .62, .65] : [.55, .95, .6], "Add heaters");
  if (ex.includes("vault")) {
    const g = part("vault", "vault", PB.EXTRA.vault.name);
    const p = brain.position;
    add(g, boxG(.5, .28, .44), M.vault, p.x, p.y + .02, p.z);
    for (const [dx, dz] of [[.22, .19], [-.22, .19], [.22, -.19], [-.22, -.19]]) add(g, new THREE.SphereGeometry(.02, 8, 6), M.metal, p.x + dx, p.y + .17, p.z + dz);
    brain.visible = false;
    if (!prev.has("vault")) pop(g);
  } else hotspot("vault", [brain.position.x, brain.position.y + .3, brain.position.z], "Add a radiation vault");

  last = { dest: c.dest, power: c.power, dish: c.dish, extra: ex.join() };
  summary(c);
}

// a glowing "+" where a part could go
function hotspot(cat, [x, y, z], label) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: plusTex, depthTest: false, transparent: true }));
  s.position.set(x, y, z); s.scale.setScalar(.32); s.userData = { cat, key: null, label, hot: true }; s.renderOrder = 10;
  scene.add(s); hotspots.push(s);
}
const plusTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
  x.fillStyle = "rgba(255,179,71,.22)"; x.beginPath(); x.arc(32, 32, 30, 0, 7); x.fill();
  x.strokeStyle = "#ffb347"; x.lineWidth = 4; x.setLineDash([6, 5]); x.beginPath(); x.arc(32, 32, 27, 0, 7); x.stroke();
  x.setLineDash([]); x.lineWidth = 6; x.beginPath(); x.moveTo(32, 18); x.lineTo(32, 46); x.moveTo(18, 32); x.lineTo(46, 32); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

// new parts grow into place
const pops = [];
function pop(g) { if (reduce) return; g.scale.setScalar(.01); pops.push({ g, t: 0 }); }

function summary(c) {
  const n = ["power", "dish"].filter(k => c[k]).length + (c.extra || []).length;
  document.getElementById("pb3dCap").textContent = n ? `${n} ${n === 1 ? "part" : "parts"} fitted · drag to turn it, click a part to change it` : "Choose parts on the left, or click a glowing + on the model";
}

// ---- clicking parts: swap, remove or add ----
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), menu = document.getElementById("pb3dMenu");
let downAt = null;
renderer.domElement.addEventListener("pointerdown", e => (downAt = [e.clientX, e.clientY]));
renderer.domElement.addEventListener("pointerup", e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; // that was a drag
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects([...hotspots, ...Object.values(parts)], true)[0];
  let o = hit?.object; while (o && !o.userData.cat) o = o.parent;
  if (!o || o.userData.cat === "body") return closeMenu();
  openMenu(o.userData, e.clientX - r.left, e.clientY - r.top);
});
const OPTIONS = { power: () => PB.POWER, dish: () => PB.DISH };
function openMenu({ cat, key, label }, x, y) {
  const c = PB.pick(), left = PB.BUDGET - PB.cost(c);
  let html = `<p class="pb3d-mh">${esc(label)}</p>`;
  if (cat === "power" || cat === "dish") {
    html += Object.entries(OPTIONS[cat]()).filter(([k]) => k !== key).map(([k, o]) => {
      const delta = o.cost - (key ? OPTIONS[cat]()[key].cost : 0);
      return `<button type="button" data-cat="${cat}" data-key="${k}">${key ? "Swap to" : "Add"} ${esc(o.name)} <em>${delta > 0 ? "+" + delta : delta}</em></button>`;
    }).join("");
    if (key) html += `<button type="button" class="rm" data-cat="${cat}" data-key="">Remove it <em>-${OPTIONS[cat]()[key].cost}</em></button>`;
  } else {
    const o = PB.EXTRA[cat];
    html += key ? `<button type="button" class="rm" data-cat="${cat}" data-key="">Remove ${esc(o.name.toLowerCase())} <em>-${o.cost}</em></button>`
      : `<p class="pb3d-mn">${esc(o.note)}</p><button type="button" data-cat="${cat}" data-key="${cat}">Add it <em>+${o.cost}</em></button>`;
  }
  html += `<p class="pb3d-mn">${left} ${left === 1 ? "coin" : "coins"} left</p>`;
  menu.innerHTML = html; menu.hidden = false;
  const W = stage.clientWidth, H = stage.clientHeight;
  menu.style.left = Math.min(Math.max(8, x), W - menu.offsetWidth - 8) + "px";
  menu.style.top = Math.min(Math.max(8, y), H - menu.offsetHeight - 8) + "px";
  menu.querySelector("button")?.focus();
}
function closeMenu() { menu.hidden = true; }
menu.addEventListener("click", e => {
  const b = e.target.closest("button[data-cat]"); if (!b) return;
  const { cat, key } = b.dataset;
  if (cat === "power" || cat === "dish") {
    const name = cat;
    if (key) document.querySelector(`input[name=${name}][value="${key}"]`).checked = true;
    else document.querySelectorAll(`input[name=${name}]`).forEach(i => (i.checked = false));
  } else document.querySelector(`input[name=extra][value="${cat}"]`).checked = !!key;
  closeMenu();
  document.querySelector(".pb-form").dispatchEvent(new Event("change", { bubbles: true }));
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
document.addEventListener("pointerdown", e => { if (!menu.hidden && !menu.contains(e.target) && e.target !== renderer.domElement) closeMenu(); });

// ---- mission effects ----
const fx = [], labels = document.getElementById("pb3dLabels");
let shake = 0, flame = null, dead = false, frost = 0, hot = 0, dust = 0, ghost = 0;
function restore() {
  for (const m of ALL) {
    const b = base.get(m); m.color.copy(b.color);
    if (m.emissive) { m.emissive.copy(b.emissive); m.emissiveIntensity = b.ei; }
    m.transparent = m === M.blanket; m.opacity = b.opacity;
  }
  M.led.color.set(0x5ee6a8);
  fx.splice(0).forEach(f => f.obj && scene.remove(f.obj)); labels.innerHTML = "";
  dead = false; frost = hot = dust = ghost = 0; shake = 0;
}
function tag(text, kind, at) {
  const el = document.createElement("span"); el.className = "pb3d-tag " + kind; el.textContent = text; labels.appendChild(el);
  const stack = fx.filter(f => f.label && f.t < f.life).length; // don't pile labels on top of each other
  fx.push({ label: el, at: at.clone().add(new THREE.Vector3(0, stack * .32, 0)), t: 0, life: 3.2 });
}
function sparks(at, color, n = 60, spread = .8, up = 1) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos.set([at.x, at.y, at.z], i * 3); vel.push(new THREE.Vector3((Math.random() - .5) * spread, Math.random() * up, (Math.random() - .5) * spread)); }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size: .06, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(p); fx.push({ obj: p, vel, t: 0, life: 1.6, kind: "particles" });
}
function rings(from) {
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(.3, .015, 8, 40), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true }));
    r.position.copy(from); r.rotation.x = Math.PI / 2; scene.add(r); fx.push({ obj: r, t: -i * .35, life: 1.6, kind: "ring" });
  }
}
const world = obj => obj ? new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()) : new THREE.Vector3(0, 1.2, 0);

function event(kind, title) {
  const brainAt = world(parts.vault || brain), top = new THREE.Vector3(0, mode === "rover" ? 2 : 2.1, 0);
  switch (title) {
    case "Launch": shake = 1.2; flameOn(); tag("Lift-off!", "ok", top); break;
    case "Cruise": if (kind === "bad") powerDown("Batteries flat"); else tag("Cruising", "ok", top); break;
    case "Arrival":
      if (kind === "bad") powerDown("No power!");
      else { flashLed(); if (parts.power) { M.panel.emissiveIntensity = 1.2; setTimeout(() => (M.panel.emissiveIntensity = .4), 900); } tag("Power on", "ok", world(parts.power || brain)); }
      break;
    case "Radiation":
      if (kind === "bad") { sparks(brainAt, 0xfff07a, 90, 1.4, 1.6); sparks(brainAt, 0x7fd4ff, 40, 1, 1); M.dark.emissive.set(0xff2200); M.dark.emissiveIntensity = 1; M.led.color.set(0xff3030); tag("Short circuit!", "bad", brainAt); shake = .4; }
      else { shield(brainAt); tag("Shielded", "ok", brainAt); }
      break;
    case "First cold night":
      if (kind === "bad") { frost = 1; sparks(top, 0xcfefff, 120, 3, -.2); M.led.color.set(0x3a6dff); tag("Frozen!", "bad", brainAt); }
      else { M.heat.emissiveIntensity = 2.2; setTimeout(() => (M.heat.emissiveIntensity = .9), 1200); tag("Warm and safe", "ok", world(parts.heat || brain)); }
      break;
    case "Overheating": hot = 1; tag("Overheating!", "warn", brainAt); sparks(top, 0xff7a3a, 70, 1.2, 1.4); break;
    case "Dust": dust = 1; sparks(new THREE.Vector3(0, 2.2, 0), 0xc77a4a, 140, 3, -.3); tag("Dust on the panels", "warn", world(parts.power)); break;
    case "Radio":
      if (parts.dish) rings(parts.dish.userData.tip);
      if (kind === "warn") { tag("Signal too weak", "warn", parts.dish ? parts.dish.userData.tip : top); fx.slice(-3).forEach(f => (f.weak = true)); }
      else tag("Signal received", "ok", parts.dish ? parts.dish.userData.tip : top);
      break;
    case "Science": flashLed(); sparks(new THREE.Vector3(mode === "rover" ? .7 : 0, 1.75, .28), 0xffffff, 20, .3, .3); tag("Sending science", "ok", top); break;
  }
}
function flameOn() {
  const f = new THREE.Mesh(new THREE.ConeGeometry(.35, 1.4, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false }));
  f.position.set(0, mode === "rover" ? -.2 : -.1, 0); f.rotation.x = Math.PI; scene.add(f); fx.push({ obj: f, t: 0, life: 1.4, kind: "flame" });
}
function shield(at) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 16), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: .35, depthWrite: false }));
  s.position.copy(at); scene.add(s); fx.push({ obj: s, t: 0, life: 1.4, kind: "shield" });
}
function flashLed() { M.led.color.set(0xffffff); setTimeout(() => !dead && M.led.color.set(0x5ee6a8), 300); }
function powerDown(text) {
  dead = true; M.led.color.set(0x330000); M.panel.emissiveIntensity = 0; M.rtg.emissiveIntensity = 0; M.heat.emissiveIntensity = 0;
  for (const m of [M.white, M.gold, M.metal]) m.color.multiplyScalar(.45);
  tag(text, "bad", world(brain));
}
function finish(years) {
  // the probe becomes a ghost: pale, see-through, still there
  ghost = .01; M.led.color.set(years > 0 ? 0x223344 : 0x330000);
  tag(years > 0 ? "Gone quiet. Now a ghost." : "Lost", "ghost", new THREE.Vector3(0, mode === "rover" ? 2.2 : 2.3, 0));
}

// ---- loop ----
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  // step back far enough to fit the whole probe, more on tall narrow screens
  const d = camera.aspect < .8 ? 9.2 : camera.aspect < 1.2 ? 8 : 7;
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, d);
}
new ResizeObserver(resize).observe(stage); resize();
const clock = new THREE.Clock(), tmp = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  controls.update();
  for (const p of pops) { p.t += dt * 2.4; const k = Math.min(1, p.t), s = 1 + 1.7 * Math.pow(k - 1, 3) + .7 * Math.pow(k - 1, 2); p.g.scale.setScalar(Math.max(.01, s)); }
  pops.splice(0, pops.length, ...pops.filter(p => p.t < 1));
  hotspots.forEach((h, i) => h.scale.setScalar(.3 + Math.sin(t * 3 + i) * .03));
  probe.position.set(shake ? (Math.random() - .5) * .06 * shake : 0, shake ? (Math.random() - .5) * .04 * shake : 0, 0); shake = Math.max(0, shake - dt * .9);
  // states
  if (frost) for (const m of [M.white, M.gold, M.metal, M.panel]) m.color.lerp(new THREE.Color(0xbfe4ff), dt * .8);
  if (hot) { const k = .6 + Math.sin(t * 6) * .4; M.gold.emissive.set(0xff3300); M.gold.emissiveIntensity = k; M.white.emissive.set(0x661100); M.white.emissiveIntensity = k * .6; }
  if (dust) M.panel.color.lerp(new THREE.Color(0x8a5a3a), dt * .35);
  if (M.dark.emissiveIntensity > 0 && !dead && Math.random() < .2) M.dark.emissiveIntensity = Math.random(); // flickering short circuit
  if (ghost) {
    ghost = Math.min(1, ghost + dt * .4);
    for (const m of [M.white, M.gold, M.metal, M.dark, M.panel, M.rtg, M.battery, M.vault]) { m.transparent = true; m.opacity = 1 - ghost * .55; m.color.lerp(new THREE.Color(0x9fc4ff), dt * .6); if (m.emissive) m.emissive.lerp(new THREE.Color(0x10203a), dt); }
    probe.position.y = Math.sin(t * 1.2) * .03;
  }
  // effects
  for (const f of fx) {
    f.t += dt; const k = f.t / f.life;
    if (f.kind === "particles") { const a = f.obj.geometry.attributes.position; for (let i = 0; i < f.vel.length; i++) { f.vel[i].y -= dt * .9; a.array[i * 3] += f.vel[i].x * dt; a.array[i * 3 + 1] += f.vel[i].y * dt; a.array[i * 3 + 2] += f.vel[i].z * dt; } a.needsUpdate = true; f.obj.material.opacity = 1 - k; }
    if (f.kind === "ring" && f.t > 0) { const s = 1 + f.t * (f.weak ? 2 : 5); f.obj.scale.setScalar(s); f.obj.position.y += dt * 1.2; f.obj.material.opacity = (f.weak ? .45 : 1) * (1 - k); }
    if (f.kind === "flame") { f.obj.scale.set(1, 1 + Math.sin(t * 40) * .15, 1); f.obj.material.opacity = .85 * (1 - k); }
    if (f.kind === "shield") { f.obj.scale.setScalar(1 + k * .4); f.obj.material.opacity = .35 * (1 - k); }
    if (f.label) {
      tmp.copy(f.at).project(camera);
      f.label.style.transform = `translate(-50%,-50%) translate(${(tmp.x * .5 + .5) * stage.clientWidth}px, ${(-tmp.y * .5 + .5) * stage.clientHeight - f.t * 14}px)`;
      f.label.style.opacity = f.label.classList.contains("ghost") ? 1 : String(Math.min(1, (f.life - f.t) * 2));
    }
  }
  for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t > fx[i].life && !fx[i].label?.classList.contains("ghost")) { const f = fx.splice(i, 1)[0]; f.obj && scene.remove(f.obj); f.label?.remove(); }
  renderer.render(scene, camera);
});

window.Probe3D = { ready: true, build, event, finish, reset: () => { restore(); build(PB.pick()); hotspots.forEach(h => (h.visible = false)); closeMenu(); controls.autoRotate = !reduce; } };
box.classList.add("ready");
build(PB.pick());
