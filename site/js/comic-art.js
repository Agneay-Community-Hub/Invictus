/* ===========================================================
   Comic art kit (comics.html): pencil-and-ink sketches drawn in code
   as SVG. Every scene is 400×300; panels crop it to fit. A wobble
   filter and doubled pencil lines give the hand-drawn look, halftone
   dots and hatching do the shading. window.ComicArt.scene(spec)
   returns the inside of an <svg>.
   =========================================================== */
window.ComicArt = (() => {
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const r = (a, b) => a + rnd() * (b - a);
  const f = n => Math.round(n * 10) / 10;

  // shared definitions: sketch wobble, hatching, halftone, paper grain
  const DEFS = `<defs>
    <filter id="sk" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>
    <filter id="photo"><feColorMatrix type="saturate" values=".25"/><feComponentTransfer><feFuncR type="linear" slope="1.35" intercept="-.12"/><feFuncG type="linear" slope="1.35" intercept="-.12"/><feFuncB type="linear" slope="1.35" intercept="-.12"/></feComponentTransfer></filter>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0v6" stroke="#2a2420" stroke-width="1.1" opacity=".55"/></pattern>
    <pattern id="xhatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 0v6" stroke="#2a2420" stroke-width="1" opacity=".5"/></pattern>
    <pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.4" fill="#2a2420" opacity=".35"/></pattern>
    <pattern id="dotsL" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".9" fill="#2a2420" opacity=".22"/></pattern>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff6c8"/><stop offset=".4" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  </defs>`;

  // ink: a firm line plus a fainter offset pencil line
  const ink = (d, w = 2.2, extra = "") => `<path d="${d}" fill="none" stroke="#1d1814" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/><path d="${d}" fill="none" stroke="#1d1814" stroke-width="${w * .45}" opacity=".35" transform="translate(1.3 -.9)"/>`;
  const shape = (d, fill, w = 2.2, shade = "") => `<path d="${d}" fill="${fill}"/>${shade ? `<path d="${d}" fill="url(#${shade})"/>` : ""}${ink(d, w)}`;
  const circle = (cx, cy, rr, fill, w = 2, shade = "") => shape(`M${f(cx - rr)} ${f(cy)}a${rr} ${rr} 0 1 0 ${f(2 * rr)} 0a${rr} ${rr} 0 1 0 ${f(-2 * rr)} 0z`, fill, w, shade);
  const ellipse = (cx, cy, rx, ry, fill, w = 2, shade = "") => shape(`M${f(cx - rx)} ${f(cy)}a${rx} ${ry} 0 1 0 ${f(2 * rx)} 0a${rx} ${ry} 0 1 0 ${f(-2 * rx)} 0z`, fill, w, shade);
  const rect = (x, y, w, h, fill, lw = 2, shade = "") => shape(`M${x} ${y}h${w}v${h}h${-w}z`, fill, lw, shade);

  // ---- backgrounds ----
  const SKY = { marsDay: "#e6b088", marsDusk: "#7f9cc0", marsNight: "#141a33", moon: "#0d1122", space: "#0b1020", earth: "#cfe3f2", room: "#2b2f45", orbit: "#c98a62" };
  function sky(kind) {
    let s = `<rect width="400" height="300" fill="${SKY[kind] || SKY.space}"/>`;
    if (kind === "marsDay") s += `<rect width="400" height="300" fill="url(#dotsL)"/>`;
    if (kind === "marsDusk") s += `<rect width="400" height="300" fill="url(#dotsL)"/><circle cx="300" cy="190" r="70" fill="#cfe4ff" opacity=".55"/>`;
    if (["marsNight", "moon", "space"].includes(kind)) { for (let i = 0; i < 60; i++) s += `<circle cx="${f(r(0, 400))}" cy="${f(r(0, 300))}" r="${f(r(.4, 1.5))}" fill="#fff" opacity="${f(r(.4, 1))}"/>`; }
    return s;
  }
  function ground(world = "mars", y = 210, opts = {}) {
    const col = world === "moon" ? "#b9b3a6" : world === "orbit" ? "#c98a62" : "#c56a3e";
    let d = `M0 ${y}`; for (let x = 0; x <= 400; x += 40) d += ` Q${x + 20} ${f(y + r(-7, 7))} ${x + 40} ${f(y + r(-4, 4))}`;
    let s = shape(d + " V300 H0z", col, 2.2) + `<path d="${d} V300 H0z" fill="url(#dotsL)"/>`;
    // rocks
    const n = opts.rocks ?? 9;
    for (let i = 0; i < n; i++) { const x = r(10, 390), yy = r(y + 14, 290), rx = r(4, 14) * (yy - y) / 60; s += ellipse(x, yy, rx, rx * .55, world === "moon" ? "#8f8a80" : "#8a4a2c", 1.4, "hatch"); }
    if (opts.bigJoe) s += shape(`M${opts.bigJoe[0] - 46} ${opts.bigJoe[1]} q6 -40 40 -44 q34 -4 52 30 q8 14 -4 16 z`, "#7c4128", 2.4, "hatch");
    if (opts.dune) s += ink(`M0 ${y + 30} q100 -24 200 0 t200 0`, 1.4, 'opacity=".6"');
    return s;
  }
  const sun = (x, y, rr = 14) => `<circle cx="${x}" cy="${y}" r="${rr * 2.6}" fill="url(#glow)"/>` + circle(x, y, rr, "#fff3c4", 1.6);
  const earthDot = (x, y, label) => `<circle cx="${x}" cy="${y}" r="9" fill="url(#glow)"/><circle cx="${x}" cy="${y}" r="3.2" fill="#9fd0ff" stroke="#fff" stroke-width="1"/>${label ? `<text x="${x + 8}" y="${y - 8}" class="sk-lab">${label}</text>` : ""}`;
  function planet(x, y, rr, col, opts = {}) {
    let s = circle(x, y, rr, col, 2.4) + `<path d="M${x - rr * .2} ${y - rr} a${rr} ${rr} 0 0 1 0 ${2 * rr} a${rr * .7} ${rr} 0 0 0 0 ${-2 * rr}z" fill="url(#xhatch)"/>`;
    if (opts.bands) for (let i = -2; i <= 2; i++) s += ink(`M${x - rr * .95} ${y + i * rr * .3} q${rr * .95} ${r(-6, 6)} ${rr * 1.9} 0`, 1.2, 'opacity=".55"');
    if (opts.rings) s += ink(`M${x - rr * 1.9} ${y + rr * .15} q${rr * 1.9} ${rr * .7} ${rr * 3.8} 0`, 2.2) + ink(`M${x - rr * 1.9} ${y + rr * .15} q${rr * 1.9} ${-rr * .5} ${rr * 3.8} 0`, 1.2, 'opacity=".6"');
    if (opts.craters) for (let i = 0; i < 6; i++) { const a = r(0, 6.28), d = r(0, rr * .7); s += ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, r(3, rr * .14), r(2, rr * .1), "none", 1.2); }
    return s;
  }

  // ---- the Viking lander ----
  function viking(x, y, s = 1, o = {}) {
    const dishA = o.dish === "away" ? 160 : o.dish === "turning" ? 100 : 35; // angle of the dish
    const dust = o.dust || 0;
    const rad = dishA * Math.PI / 180, dx = Math.cos(rad) * 34, dy = -Math.sin(rad) * 34;
    let g = "";
    // legs
    for (const [lx, fx2] of [[-46, -78], [46, 78], [0, 0]]) {
      const back = lx === 0;
      g += ink(`M${lx} 4 L${fx2} ${back ? 30 : 40}`, 2.6, back ? 'opacity=".55"' : "") + ellipse(fx2, back ? 32 : 42, 13, 4, "#d8d2c4", 1.8);
    }
    // body: a flat six-sided box
    g += shape("M-56 -10 L-40 -24 H40 L56 -10 L44 8 H-44z", "#e9e4d6", 2.6, "dots");
    g += shape("M-56 -10 L44 8 H-44z", "none", 1.2, "hatch");
    // RTG power units with fins
    for (const sx of [-1, 1]) { g += rect(sx * 30 - 9, -42, 18, 18, "#9a958c", 2, "hatch"); for (let i = 0; i < 4; i++) g += ink(`M${sx * 30 - 9 + i * 6} -42 v-5`, 1.4); }
    // cameras
    g += rect(-8, -50, 7, 26, "#d8d2c4", 1.8) + circle(-4.5, -52, 5, "#2a2420", 1.4) + rect(4, -46, 7, 22, "#d8d2c4", 1.8) + circle(7.5, -48, 5, "#2a2420", 1.4);
    // dish on its mast
    g += ink(`M-22 -24 L-22 -58`, 2.4);
    g += `<g transform="translate(-22 -62) rotate(${-dishA + 90})">` + shape("M-20 0 q20 -14 40 0 q-20 6 -40 0z", "#f4f0e6", 2.2) + ink("M0 -4 v-12", 1.6) + `</g>`;
    // sampling arm
    if (o.arm) g += ink(`M44 -4 L${o.arm[0]} ${o.arm[1]}`, 2.6) + rect(o.arm[0] - 6, o.arm[1] - 4, 12, 8, "#bdb6a8", 1.6);
    else g += ink("M44 -4 l30 -6", 2.4);
    // flag
    g += rect(-40, -6, 14, 9, "#f4f0e6", 1.2) + `<rect x="-40" y="-6" width="5" height="5" fill="#3b5ba5"/><path d="M-35 -4h9M-35 -1h9M-40 2h14" stroke="#c0392b" stroke-width="1.2"/>`;
    // dust settling over the years
    if (dust) g += `<path d="M-56 -10 L-40 -24 H40 L56 -10 Z" fill="#c56a3e" opacity="${f(dust * .75)}"/><path d="M-39 -42h18v4h-18zM21 -42h18v4h-18z" fill="#c56a3e" opacity="${f(dust)}"/>`;
    // the radio beam: arcs towards home, or nowhere
    let beam = "";
    if (o.beam) { const bx = -22 + dx * .6, by = -62 + dy * .6; for (let i = 1; i <= 3; i++) beam += `<path d="M${f(bx + Math.cos(rad - .5) * i * 14)} ${f(by - Math.sin(rad - .5) * i * 14)} A${i * 14} ${i * 14} 0 0 0 ${f(bx + Math.cos(rad + .5) * i * 14)} ${f(by - Math.sin(rad + .5) * i * 14)}" fill="none" stroke="${o.beam === "lost" ? "#7a8aa8" : "#3fb6ff"}" stroke-width="2.4" stroke-dasharray="${o.beam === "lost" ? "3 6" : "0"}" opacity="${1 - i * .2}"/>`; }
    return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${g}${beam}</g>`;
  }

  // ---- other machines, for every issue ----
  const machines = {
    rover: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${rect(-60, -40, 120, 26, "#e9e4d6", 2.4, "dots")}${rect(-66, -46, 132, 7, "#d9a441", 2)}${ink("M-62 -12 L-36 4 L-6 -12 M-6 -12 L24 -20 L56 4")}${[-56, -4, 52].map(w => circle(w, 8, 13, "#3a332d", 2) + circle(w, 8, 4, "#bdb6a8", 1.2)).join("")}${ink("M30 -46 V-86", 2.4)}${rect(18, -100, 30, 16, "#e9e4d6", 2)}${circle(26, -92, 3.5, "#2a2420", 1.2)}${circle(38, -92, 3.5, "#2a2420", 1.2)}${ink("M-60 -26 L-86 -32 L-96 -12", 2.2)}</g>`,
    lander: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${ink("M-40 -6 L-70 30 M40 -6 L70 30 M0 0 L0 26", 2.6)}${ellipse(-70, 32, 12, 4, "#d8d2c4", 1.6)}${ellipse(70, 32, 12, 4, "#d8d2c4", 1.6)}${shape("M-46 -6 L-34 -30 H34 L46 -6z", "#e9e4d6", 2.4, "dots")}${ink("M0 -30 V-62", 2.2)}${shape("M-22 -64 q22 -14 44 0 q-22 6 -44 0z", "#f4f0e6", 2)}${rect(-60, -26, 22, 30, "#3b5bb5", 1.8, "hatch")}${rect(38, -26, 22, 30, "#3b5bb5", 1.8, "hatch")}</g>`,
    vehicle: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${circle(-50, 6, 18, "#bdb6a8", 2.2, "hatch")}${circle(50, 6, 18, "#bdb6a8", 2.2, "hatch")}${rect(-72, -16, 144, 8, "#d8d2c4", 2.2)}${rect(-30, -38, 26, 22, "#e9e4d6", 2)}${rect(4, -38, 26, 22, "#e9e4d6", 2)}${ink("M50 -16 V-70", 2)}${shape("M28 -72 q22 -14 44 0z", "#f4f0e6", 2)}${ink("M-58 -16 V-46", 2)}${rect(-70, -56, 24, 12, "#bdb6a8", 1.6)}</g>`,
    probe: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${circle(0, -30, 42, "#f4f0e6", 2.6, "dots")}${circle(0, -30, 8, "#bdb6a8", 1.6)}${ink("M0 -72 V12 M-42 -30 H42", 1.2, 'opacity=".5"')}${rect(-16, 8, 32, 18, "#d9a441", 2.2, "hatch")}${ink("M16 18 L100 0", 2)}${ink("M-16 18 L-60 46", 2)}${rect(-74, 42, 18, 12, "#9a958c", 1.6)}${ink("M0 26 L10 60", 2)}${rect(4, 56, 14, 18, "#9a958c", 1.6, "hatch")}</g>`,
    orbiter: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${rect(-22, -22, 44, 44, "#d9a441", 2.4, "hatch")}${rect(-110, -12, 84, 24, "#3b5bb5", 2, "xhatch")}${rect(26, -12, 84, 24, "#3b5bb5", 2, "xhatch")}${ink("M-26 0 h4 M22 0 h4", 2)}${ink("M0 -22 V-40", 2)}${shape("M-22 -42 q22 -14 44 0 q-22 6 -44 0z", "#f4f0e6", 2)}</g>`,
    helicopter: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${rect(-16, -16, 32, 22, "#d8d2c4", 2.2, "dots")}${ink("M-14 6 L-30 34 M14 6 L30 34 M-4 6 L-10 34 M4 6 L10 34", 2)}${ink("M0 -16 V-50", 2.2)}${ink("M-70 -40 Q0 -48 70 -40 M-70 -52 Q0 -44 70 -52", 2.4)}${rect(-12, -64, 24, 10, "#3b5bb5", 1.6, "hatch")}</g>`,
    impactor: (x, y, s) => machines.probe(x, y, s * .7) + `<g filter="url(#sk)">${[0, 1, 2, 3, 4].map(i => ink(`M${x + 50 + i * 8} ${y - 60 + i * 14} l70 -40`, 1.8, 'opacity=".7"')).join("")}</g>`,
    debris: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${shape("M-50 10 L-28 -30 H28 L50 10z", "#e9e4d6", 2.4, "hatch")}${ink("M40 4 Q90 -10 130 12", 1.6)}${shape("M90 4 q30 -30 70 6 q-34 -6 -70 -6z", "#f4f0e6", 2, "dotsL")}</g>`,
    experiment: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${rect(-40, -26, 80, 30, "#d9a441", 2.4, "hatch")}${ink("M30 -26 V-70", 2)}${shape("M14 -72 q16 -12 32 0z", "#f4f0e6", 2)}${rect(-70, -6, 22, 10, "#bdb6a8", 1.6)}${ink("M-48 -2 H-40", 2)}${rect(-30, -44, 30, 18, "#3b5bb5", 1.6, "xhatch")}</g>`,
    telescope: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${rect(-30, -70, 60, 110, "#e9e4d6", 2.4, "dots")}${ellipse(0, -70, 30, 8, "#2a2420", 2)}${rect(-90, -20, 56, 30, "#3b5bb5", 2, "xhatch")}${rect(34, -20, 56, 30, "#3b5bb5", 2, "xhatch")}</g>`
  };

  // ---- story props ----
  const aeroshell = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${shape("M-40 0 q40 -26 80 0 q-40 14 -80 0z", "#e9e4d6", 2.4, "hatch")}${ink("M-38 -2 L-6 -70 M38 -2 L6 -70 M0 -6 V-70", 1.2)}${shape("M-46 -66 q46 -50 92 0 q-46 -14 -92 0z", "#f4f0e6", 2.4, "dotsL")}${ink("M-24 -76 q-6 -10 0 -14 M24 -76 q6 -10 0 -14", 1)}</g>`;
  const flames = (x, y) => `<g filter="url(#sk)">${[-30, 0, 30].map(dx => shape(`M${x + dx - 7} ${y} q7 34 14 0z`, "#ffb347", 1.6) + `<path d="M${x + dx - 3} ${y} q3 18 6 0z" fill="#fff3c4"/>`).join("")}</g>`;
  const orbiterV = (x, y, s = 1) => machines.orbiter(x, y, s);
  const glint = (x, y, rr = 18) => `<g><circle cx="${x}" cy="${y}" r="${rr}" fill="url(#glow)"/>${[0, 45, 90, 135].map(a => `<path d="M${x} ${y - rr * (a % 90 ? .7 : 1.2)}V${y + rr * (a % 90 ? .7 : 1.2)}" stroke="#fff6c8" stroke-width="1.6" transform="rotate(${a} ${x} ${y})"/>`).join("")}</g>`;
  const speed = (cx, cy, n = 22, r0 = 60, r1 = 260) => { let s = ""; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + r(-.05, .05); s += `<path d="M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)}L${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)}" stroke="#1d1814" stroke-width="${f(r(.8, 2.6))}" opacity=".55"/>`; } return s; };
  const crackle = (x, y, n = 14) => { let s = ""; for (let i = 0; i < n; i++) { const a = r(0, 6.28), d = r(4, 40); s += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(r(2, 7))}" fill="#1d1814"/>`; } return s; };
  const airbags = (x, y) => `<g filter="url(#sk)">${[[0, 0], [16, -6], [8, 12], [-10, 10], [-14, -8], [4, -18]].map(([a, b]) => circle(x + a, y + b, 11, "#f4f0e6", 1.6, "dotsL")).join("")}${ink(`M${x - 30} ${y + 34} q15 -30 30 0 q15 -24 30 0`, 1.4, 'stroke-dasharray="4 4"')}</g>`;
  const skycrane = (x, y) => `<g filter="url(#sk)">${rect(x - 34, y - 60, 68, 16, "#d8d2c4", 2, "hatch")}${flames(x, y - 44)}${ink(`M${x - 20} ${y - 44} L${x - 18} ${y - 4} M${x + 20} ${y - 44} L${x + 18} ${y - 4}`, 1.2)}${machines.rover(x, y + 6, .45)}</g>`;
  function room(o = {}) { // mission control
    let s = `<rect width="400" height="300" fill="${SKY.room}"/><rect width="400" height="300" fill="url(#dots)" opacity=".5"/>`;
    s += rect(60, 30, 280, 110, o.screen === "dark" ? "#1a1f30" : o.screen === "mars" ? "#c98a62" : "#2f6a8a", 3);
    if (o.screen === "mars") s += `<path d="M62 104 q60 -10 120 0 t156 -4 V138 H62z" fill="#a5522c"/><path d="M62 104 q60 -10 120 0 t156 -4" fill="none" stroke="#1d1814" stroke-width="1.6"/>` + [[110, 120], [180, 126], [260, 116], [300, 128]].map(([a, b]) => ellipse(a, b, 9, 4, "#6e3620", 1.2)).join("");
    if (o.text) s += `<text x="200" y="${o.screen === "mars" ? 60 : 92}" text-anchor="middle" class="sk-screen">${o.text}</text>`;
    s += rect(0, 200, 400, 100, "#3a3f58", 2.6, "hatch");
    for (const [x, h] of [[70, 0], [150, 6], [240, 2], [320, 8]]) s += `<g filter="url(#sk)">${circle(x, 178 - h, 15, "#1d1814", 1)}${shape(`M${x - 24} 220 q24 -40 48 0z`, "#1d1814", 1)}</g>`;
    for (let i = 0; i < 6; i++) s += rect(20 + i * 62, 214, 40, 22, "#4f6a8f", 1.6) + `<rect x="${24 + i * 62}" y="218" width="${f(r(10, 30))}" height="3" fill="#9fe0ff"/>`;
    return s;
  }
  function topDown(o = {}) { // an orbiting camera's view, looking straight down
    let s = `<rect width="400" height="300" fill="#c98a62"/><rect width="400" height="300" fill="url(#dots)"/>`;
    for (let i = 0; i < 12; i++) s += ellipse(r(0, 400), r(0, 300), r(6, 30), r(5, 26), "none", 1.4);
    s += `<circle cx="210" cy="150" r="4" fill="#fff"/><path d="M212 152 l14 6" stroke="#2a2420" stroke-width="5" opacity=".6"/>`;
    s += `<path d="M210 110 V135 M210 165 V190 M170 150 H195 M225 150 H250" stroke="#fff" stroke-width="2"/><circle cx="210" cy="150" r="22" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="4 4"/>`;
    if (o.label) s += `<text x="16" y="28" class="sk-screen" style="font-size:16px">${o.label}</text>`;
    return s;
  }
  function footpad() { // the first picture: a footpad in the dust
    let s = `<rect width="400" height="300" fill="#d7cfc0"/><rect width="400" height="300" fill="url(#dots)"/>`;
    s += `<g filter="url(#sk)">${shape("M40 300 Q120 190 260 200 Q380 210 400 300z", "#b9b3a6", 2.6, "hatch")}${ellipse(220, 210, 120, 34, "#e9e4d6", 3, "dotsL")}${ellipse(220, 204, 92, 22, "#d8d2c4", 2)}${ink("M220 182 L250 0", 6)}</g>`;
    for (let i = 0; i < 18; i++) s += ellipse(r(20, 390), r(230, 295), r(2, 9), r(2, 5), "#8f8a80", 1.2, "hatch");
    return s;
  }
  function rocket(x = 200, y = 220, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sk)">${shape("M-16 0 V-130 Q0 -170 16 -130 V0z", "#f4f0e6", 2.6, "dots")}${shape("M-16 -20 L-34 6 L-16 0z", "#c0392b", 2)}${shape("M16 -20 L34 6 L16 0z", "#c0392b", 2)}${ink("M-16 -90 H16 M-16 -60 H16", 1.6)}</g>` + flames(x, y + 2) + speed(x, y + 40, 14, 30, 160).replace(/stroke="#1d1814"/g, 'stroke="#fff"');
  }

  // ---- compose a panel from a spec ----
  function scene(sp) {
    seed = sp.seed || 7;
    const W = sp.world || "mars";
    let s = DEFS;
    switch (sp.bg) {
      case "room": s += room(sp); break;
      case "top": s += topDown(sp); break;
      case "footpad": s += footpad(); break;
      case "photo": s += `<rect width="400" height="300" fill="#2a2420"/><image href="${sp.src}" width="400" height="300" preserveAspectRatio="xMidYMid slice" filter="url(#photo)"/><rect width="400" height="300" fill="url(#dotsL)"/>`; break;
      default: s += sky(sp.bg || "space");
    }
    if (sp.sun) s += sun(...sp.sun);
    if (sp.earth) s += earthDot(...sp.earth);
    if (sp.planet) s += planet(...sp.planet);
    if (sp.speed) s += speed(...sp.speed);
    if (sp.ground) s += ground(W, sp.ground, sp.groundOpts || {});
    if (sp.aeroshell) s += aeroshell(...sp.aeroshell);
    if (sp.flames) s += flames(...sp.flames);
    if (sp.orbiter) s += orbiterV(...sp.orbiter);
    if (sp.viking) s += viking(...sp.viking);
    if (sp.machine) s += machines[sp.machine[0]] ? machines[sp.machine[0]](sp.machine[1], sp.machine[2], sp.machine[3]) : "";
    if (sp.rocket) s += rocket(...sp.rocket);
    if (sp.airbags) s += airbags(...sp.airbags);
    if (sp.skycrane) s += skycrane(...sp.skycrane);
    if (sp.heli) s += machines.helicopter(...sp.heli);
    if (sp.glints) s += sp.glints.map(g => glint(...g)).join("");
    if (sp.crackle) s += crackle(...sp.crackle);
    if (sp.frost) s += `<rect width="400" height="300" fill="#dff1ff" opacity=".28"/>${Array.from({ length: 40 }, () => `<path d="M${f(r(0, 400))} ${f(r(0, 300))}l3 3m-3 0l3 -3" stroke="#fff" stroke-width="1.2"/>`).join("")}`;
    if (sp.dust) s += `<rect width="400" height="300" fill="#c56a3e" opacity="${sp.dust}"/>${Array.from({ length: 70 }, () => `<circle cx="${f(r(0, 400))}" cy="${f(r(0, 300))}" r="${f(r(.5, 2))}" fill="#7c4128" opacity=".6"/>`).join("")}`;
    if (sp.vignette !== false) s += `<rect width="400" height="300" fill="none" stroke="#1d1814" stroke-width="10" opacity=".25"/>`;
    return s;
  }
  return { scene, machines };
})();
