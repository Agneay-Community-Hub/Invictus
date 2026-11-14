/* ===========================================================
   Signal-delay challenge (signal.html): drive a pretend rover to a
   science target when every command takes time to arrive, and every
   picture takes just as long to come back. 1 minute of real delay is
   squeezed into 1 second. Turn on self-driving to see why real
   rovers learned to avoid rocks by themselves.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const W = 12, H = 8, DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], ARROW = ["↑", "→", "↓", "←"];
  const MODES = { moon: [1.3, "the Moon: 1.3 seconds each way"], near: [3, "Mars at its closest: about 3 minutes each way"], avg: [12, "Mars on average: about 12 minutes each way"], far: [22, "Mars at its farthest: about 22 minutes each way"] };
  let delay = 3, map, start, goal, truth, hist, queue, sent, t0, over, auto = false, timer;

  // ---- a new field of rocks, always with a way through ----
  function field() {
    for (;;) {
      map = Array.from({ length: H }, () => Array(W).fill(0));
      start = { x: 0, y: H - 1 }; goal = { x: W - 1 - ((Math.random() * 3) | 0), y: (Math.random() * 3) | 0 };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.random() < .22) map[y][x] = 1;
      map[start.y][start.x] = 0; map[goal.y][goal.x] = 0; map[start.y - 1][start.x] = 0;
      // breadth-first search: is the goal reachable?
      const seen = new Set([start.x + "," + start.y]), q = [start];
      while (q.length) { const p = q.shift(); for (const [dx, dy] of DIRS) { const x = p.x + dx, y = p.y + dy, k = x + "," + y; if (x >= 0 && y >= 0 && x < W && y < H && !map[y][x] && !seen.has(k)) { seen.add(k); q.push({ x, y }); } } }
      if (seen.has(goal.x + "," + goal.y)) return;
    }
  }
  function reset() {
    field();
    t0 = performance.now(); truth = { x: start.x, y: start.y, d: 0, state: "ok" };
    hist = [{ t: 0, ...truth }]; queue = []; sent = 0; over = false; lastSeen = null;
    $("#sgLog").innerHTML = ""; $("#sgEnd").hidden = true;
    log(`Rover landed. Signals take ${delay} s each way (${MODES[$("#sgMode").value][1]}).`);
    $$(".sg-cmd").forEach(b => (b.disabled = false));
    clearInterval(timer); timer = setInterval(tick, 100); tick();
  }
  const now = () => (performance.now() - t0) / 1000;
  function log(html) { $("#sgLog").insertAdjacentHTML("afterbegin", `<li><span>${now().toFixed(1)} s</span> ${html}</li>`); }

  // ---- sending and arriving ----
  function send(cmd) {
    if (over) return;
    sent++; queue.push({ cmd, arrive: now() + delay, id: sent });
    log(`You sent <b>${cmd === "f" ? "Drive forward" : cmd === "l" ? "Turn left" : "Turn right"}</b>. It is on its way…`);
  }
  function apply(cmd) {
    if (truth.state !== "ok") return;
    if (cmd === "l") truth.d = (truth.d + 3) % 4;
    else if (cmd === "r") truth.d = (truth.d + 1) % 4;
    else {
      const [dx, dy] = DIRS[truth.d], x = truth.x + dx, y = truth.y + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) truth.state = "edge";
      else if (map[y][x]) { if (auto) truth.state = "avoided"; else { truth.x = x; truth.y = y; truth.state = "stuck"; } }
      else { truth.x = x; truth.y = y; if (x === goal.x && y === goal.y) truth.state = "won"; }
    }
    hist.push({ t: now(), ...truth });
    if (truth.state === "edge" || truth.state === "avoided") truth.state = "ok"; // just a warning, keep going
  }

  // what mission control can see: the newest picture old enough to have reached Earth
  const seen = () => { const t = now() - delay; let s = hist[0]; for (const h of hist) if (h.t <= t) s = h; return s; };
  let lastSeen = null;
  function tick() {
    const n = now();
    while (queue.length && queue[0].arrive <= n) apply(queue.shift().cmd);
    const v = seen();
    if (v !== lastSeen) {
      if (lastSeen) {
        if (v.state === "stuck") finish(false);
        else if (v.state === "won") finish(true);
        else if (v.state === "edge") log("A picture arrives: the rover stopped at the edge of the map.");
        else if (v.state === "avoided") log("A picture arrives: the rover spotted a rock and <b>refused to drive into it</b>.");
        else log(`A picture arrives, ${delay} s old: the rover is facing ${["north", "east", "south", "west"][v.d]}.`);
      }
      lastSeen = v; draw(v);
    }
    $("#sgClock").textContent = `${n.toFixed(1)} s`;
    $("#sgAir").innerHTML = queue.length ? queue.map(q => `<li><span style="--p:${1 - (q.arrive - n) / delay}"></span>${q.cmd === "f" ? "Forward" : q.cmd === "l" ? "Left" : "Right"} · ${(q.arrive - n).toFixed(1)} s</li>`).join("") : `<li class="sg-quiet">Nothing on the way</li>`;
  }
  function finish(won) {
    over = true; clearInterval(timer);
    $$(".sg-cmd").forEach(b => (b.disabled = true));
    $("#sgEnd").hidden = false;
    $("#sgEnd").innerHTML = won
      ? `<h2>Science target reached!</h2><p>The rover got there ${delay} seconds before you found out, because the picture had to travel home. You sent ${sent} commands in ${now().toFixed(0)} seconds. On real Mars, that's about ${Math.round(now())} minutes.</p><button class="btn btn-primary" id="sgAgain">Drive again</button>`
      : `<h2>Stuck in the rocks</h2><p>The rover drove into a rock ${delay} seconds before the picture reached you, too late to stop it. This is just how Spirit got stuck in soft sand in 2009. Try turning on self-driving, or sending one command at a time and waiting for each picture.</p><button class="btn btn-primary" id="sgAgain">Try again</button>`;
    $("#sgAgain").addEventListener("click", reset);
  }

  // ---- drawing the last picture ----
  function draw(v) {
    const cells = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const g = x === goal.x && y === goal.y, r = map[y][x];
      cells.push(`<i class="${r ? "rock" : ""}${g ? " goal" : ""}"></i>`);
    }
    $("#sgGrid").innerHTML = cells.join("") + `<b class="sg-rover ${v.state}" style="--x:${v.x};--y:${v.y};--d:${v.d * 90}deg" aria-hidden="true"><span>▲</span></b>`;
    $("#sgGrid").setAttribute("aria-label", `Last picture: rover at column ${v.x + 1}, row ${v.y + 1}, facing ${["north", "east", "south", "west"][v.d]}. Target at column ${goal.x + 1}, row ${goal.y + 1}.`);
  }

  // ---- controls ----
  $$(".sg-cmd").forEach(b => b.addEventListener("click", () => send(b.dataset.c)));
  document.addEventListener("keydown", e => {
    if (e.target.closest("input, select, textarea")) return;
    const c = { ArrowUp: "f", ArrowLeft: "l", ArrowRight: "r", w: "f", a: "l", d: "r" }[e.key];
    if (c) { e.preventDefault(); send(c); }
  });
  $("#sgMode").addEventListener("change", e => { delay = MODES[e.target.value][0]; reset(); });
  $("#sgAuto").addEventListener("change", e => { auto = e.target.checked; log(auto ? "Self-driving <b>on</b>: the rover will refuse to drive into rocks." : "Self-driving <b>off</b>."); });
  $("#sgNew").addEventListener("click", reset);
  delay = MODES[$("#sgMode").value][0];
  reset();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
