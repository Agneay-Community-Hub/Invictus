/* ===========================================================
   "Echo's journey" (story.html): the whole archive in about 6 minutes.
   Echo is the last radio message a spacecraft ever sends home. It
   travels at the speed of light and visits the machines nearest first.
   Every fact here comes from js/data.js (the checked dossiers);
   Voyager 1's distance is worked out live, like on the home page.
   Narration uses the browser's own voice; captions are always on.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const byId = Object.fromEntries(ARTIFACTS.map(a => [a.id, a]));
  const count = w => ARTIFACTS.filter(a => a.world === w).length;
  const v1 = byId.voyager1.dist;
  const au = v1.au2025 + v1.rate * ((Date.now() - Date.UTC(2025, 0, 1)) / (365.25 * 864e5));
  const lightH = au * 499.005 / 3600;                       // 1 AU of light ≈ 499 s
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- the script: scene by scene ----
  const SCENES = [
    { title: "Hello from Echo", bg: "as17-152-23272.jpg", focus: "50% 40%",
      lines: [
        "Hi! I'm Echo. I'm the last radio message a spacecraft ever sends home, and I travel at the speed of light.",
        "Since 1958, NASA has sent machines out into space, and many of them will never come back.",
        `This archive keeps ${ARTIFACTS.length} of them: ${count("moon")} on the Moon, ${count("mars")} on Mars, and ${count("deep")} more, from Earth orbit all the way to interstellar space.`,
        "Let's visit them, nearest first. Hold on tight!"],
      fact: [String(ARTIFACTS.length), `machines in the archive · ${count("moon")} Moon · ${count("mars")} Mars · ${count("deep")} elsewhere`],
      deeper: ["Find them all on the Ghost Map", "index.html#map"] },

    { title: "The Moon: the brave first ones", bg: "PIA02975.jpg", focus: "50% 50%", travel: ["The Moon", "1.3 light-seconds away"],
      lines: [
        "First stop: the Moon. For me, that's just over one second away.",
        "In 1964, Ranger 7 was built to crash. Six Rangers before it had failed. In its last 17 minutes, it sent home 4,308 pictures, then hit the Moon.",
        "Two years later, Surveyor 1 landed gently on three legs. Some people feared deep, fluffy dust would swallow a spaceship. It didn't sink, and that told the Apollo engineers it was safe to land."],
      fact: ["4,308", "pictures from Ranger 7 in its last 17 minutes"],
      deeper: ["How do you land on another world?", "index.html#how"] },

    { title: "Then people came", bg: "as11-40-5903.jpg", focus: "50% 45%",
      lines: [
        "In 1969, people followed. The bottom half of the lunar module Eagle stayed behind. It was the launch pad for Neil and Buzz's trip home.",
        "Next to it lies a small mirror. Scientists still bounce lasers off it, to measure exactly how far away the Moon is.",
        "Later crews drove electric Moon cars at up to 13 kilometres an hour, and left science stations behind. When an empty lunar module was crashed on purpose, Apollo 12's seismometer felt the Moon ring like a bell for nearly an hour."],
      fact: ["~55 min", "the Moon “ringing” after an empty lunar module was crashed on purpose"],
      deeper: ["Walk the Apollo sites in 3D", "index.html#worlds3d"] },

    { title: "Mars: the first eyes", bg: "PIA00563.jpg", focus: "50% 60%", travel: ["Mars", "3 to 22 light-minutes away"],
      lines: [
        "Now, Mars. Here I'm slow: a message takes between 3 and 22 minutes, depending on where the planets are. So nobody can drive a Mars robot with a joystick.",
        "In 1976, Viking 1 took the very first photo from the surface of Mars. It sent weather reports home for six years, until a wrong command turned its antenna away from Earth.",
        "In 1997, Sojourner, about the size of a microwave oven, became the first rover ever to drive on another planet."],
      fact: ["1976", "the first photo ever taken on the surface of Mars"],
      deeper: ["Try driving a rover with a time delay", "signal.html"] },

    { title: "The twins who wouldn't quit", bg: "PIA16120.jpg", focus: "50% 50%",
      lines: [
        "Then came the twins, Spirit and Opportunity. Each was planned to work for 90 days.",
        "Opportunity found little round pebbles, nicknamed blueberries, that formed in water. She drove 45 kilometres, farther than a marathon, for more than 14 years.",
        "In 2018, a huge dust storm blocked out the Sun. Her last message home was about power, and darkness."],
      fact: ["90 days → 14 years", "how long Opportunity was planned to last, and how long she did"],
      deeper: ["Opportunity, up close", "index.html#upclose"] },

    { title: "Listening, flying, learning", bg: "PIA25287.jpg", focus: "50% 45%",
      lines: [
        "InSight was Mars's doctor. It listened with a seismometer and heard 1,319 marsquakes, which told us Mars has a liquid metal core.",
        "Ingenuity did something nobody had ever done: it flew on another planet. It was meant to fly 5 times. It flew 72.",
        "Not every trip worked. Mars Climate Orbiter was lost because one computer used pounds and the other expected newtons. Engineers still learn from that mistake."],
      fact: ["1,319 · 72", "marsquakes heard by InSight · flights by Ingenuity"],
      deeper: ["Watch their cartoon shorts", "shorts.html"] },

    { title: "Guardians of the ocean moons", bg: "PIA14599.jpg", focus: "50% 50%", travel: ["Jupiter and Saturn", "up to 1.5 light-hours away"],
      lines: [
        "Out among the giant planets, Galileo found hints of a salty ocean under the ice of Jupiter's moon Europa.",
        "Cassini circled Saturn for 13 years, and saw geysers of ice shooting from the tiny moon Enceladus.",
        "At the end, both were steered into their planets on purpose, so germs from Earth could never reach those moons. Cassini sent data until the very last second."],
      fact: ["13 years", "Cassini at Saturn, then a plunge to keep its moons clean"],
      deeper: ["Explore the rest of the solar system", "index.html#deep"] },

    { title: "The far travellers", bg: "PIA00452.jpg", focus: "50% 50%", travel: ["Interstellar space", `about ${Math.round(lightH)} light-hours away`],
      lines: [
        "The farthest travellers left the planets behind. Pioneer 10 carries a golden plaque, with a drawing of two humans and a map to our Sun.",
        "Voyager 1 is the farthest human-made object. In 1990, it turned around and photographed Earth: a pale blue dot in a sunbeam.",
        `Today it's about ${Math.round(au)} times farther from the Sun than Earth is. A message from Voyager 1 takes about ${Math.round(lightH)} hours to reach home, and it's still talking.`],
      fact: [`~${Math.round(lightH)} h`, `for a radio message from Voyager 1 to reach Earth today (estimate, ~${Math.round(au)} AU)`],
      deeper: ["Watch the far travellers move, live", "tracker.html"] },

    { title: "Your turn", bg: "as17-137-20979.jpg", focus: "50% 40%", travel: ["Home", "back to Earth"],
      lines: [
        "So: they stopped talking. Their stories didn't.",
        "Every one of these machines taught us something, even the ones that crashed or got lost. And every fact you just heard is checked against NASA's own records.",
        "Now it's your turn. Find them on the Ghost Map, play the games, or ask me anything. Bye for now!"],
      fact: ["You", "the next explorer"],
      deeper: ["Ask Echo anything", "ask.html"], end: true }
  ];

  // ---- timing: spoken where the browser can, otherwise read at a calm pace ----
  const words = s => s.split(/\s+/).length;
  const estimate = s => words(s) / 2.5 + .9;                 // seconds, ~150 words a minute
  const TOTAL = SCENES.reduce((t, sc) => t + sc.lines.reduce((u, l) => u + estimate(l), 0) + (sc.travel ? 2.6 : 0) + 1.2, 0);
  $("#stLen").textContent = `about ${Math.round(TOTAL / 60)} minutes`;

  let scene = 0, line = -1, playing = false, voiceOn = true, timer = null, token = 0, shown = -1;
  const synth = "speechSynthesis" in window ? speechSynthesis : null;
  let voice = null;
  const pickVoice = () => {
    if (!synth) return;
    const vs = synth.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
    voice = vs.find(v => /natural|online|google/i.test(v.name) && /en-(US|GB)/i.test(v.lang)) || vs.find(v => /en-(US|GB)/i.test(v.lang)) || vs[0] || null;
  };
  if (synth) { pickVoice(); synth.addEventListener?.("voiceschanged", pickVoice); }
  if (!synth) { voiceOn = false; $("#stVoice").hidden = true; }

  // ---- building the screen ----
  $("#stDots").innerHTML = SCENES.map((s, i) => `<button type="button" data-go="${i}" aria-label="Scene ${i + 1}: ${esc(s.title)}"><i></i></button>`).join("");
  const bgA = $("#stBgA"), bgB = $("#stBgB"); let front = bgA;

  function showScene(i) {
    const s = SCENES[i];
    const back = front === bgA ? bgB : bgA;
    back.style.backgroundImage = `url("assets/nasa/${s.bg}")`;
    back.style.backgroundPosition = s.focus || "50% 50%";
    back.classList.remove("zoom"); void back.offsetWidth; if (!calm) back.classList.add("zoom");
    back.classList.add("on"); front.classList.remove("on"); front = back;
    $("#stTitle").textContent = s.title;
    $("#stNum").textContent = `${i + 1} / ${SCENES.length}`;
    $("#stFactN").textContent = s.fact[0];
    $("#stFactL").textContent = s.fact[1];
    const d = $("#stDeeper"); d.href = s.deeper[1]; d.querySelector("span").textContent = s.deeper[0];
    $("#stFact").classList.remove("in"); void $("#stFact").offsetWidth; $("#stFact").classList.add("in");
    $$("#stDots button").forEach((b, k) => { b.classList.toggle("done", k < i); b.setAttribute("aria-current", String(k === i)); });
    $("#stEnd").hidden = true;                                   // shown when Echo has finished
    $("#stFact").hidden = !!s.end;
  }

  function travel(s, then) {
    const w = $("#stWarp");
    if (!s.travel) return then();
    w.querySelector("b").textContent = s.travel[0];
    w.querySelector("small").textContent = s.travel[1];
    w.hidden = false; w.classList.remove("go"); void w.offsetWidth; w.classList.add("go");
    $("#stEcho").classList.add("zoom-off");
    const my = token;
    timer = setTimeout(() => { if (my !== token) return; w.hidden = true; $("#stEcho").classList.remove("zoom-off"); then(); }, calm ? 1200 : 2400);
  }

  function say(text, done) {
    const cap = $("#stCap");
    cap.classList.remove("in"); void cap.offsetWidth; cap.textContent = text; cap.classList.add("in");
    $("#stEcho").classList.add("talking");
    const my = token;
    const finish = () => { if (my !== token) return; clearTimeout(timer); $("#stEcho").classList.remove("talking"); timer = setTimeout(() => my === token && done(), 450); };
    if (voiceOn && synth) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/→/g, " to ").replace(/(\d),(\d{3})/g, "$1$2"));
      if (voice) u.voice = voice;
      u.lang = voice?.lang || "en-US"; u.rate = .97; u.pitch = 1.08;
      u.onend = finish; u.onerror = finish;
      synth.speak(u);
      timer = setTimeout(finish, estimate(text) * 1900);         // safety net if the voice never reports the end
    } else {
      timer = setTimeout(finish, estimate(text) * 1000);
    }
  }

  function next() {
    if (!playing) return;
    const s = SCENES[scene];
    if (line + 1 < s.lines.length) { line++; return say(s.lines[line], next); }
    if (scene + 1 < SCENES.length) { goto(scene + 1, true); return; }
    stop(true);
  }

  function goto(i, auto = false) {
    token++; clearTimeout(timer); synth?.cancel();
    scene = Math.max(0, Math.min(SCENES.length - 1, i)); line = -1;
    $("#stWarp").hidden = true;
    const s = SCENES[scene];
    const start = () => { showScene(scene); shown = scene; if (playing) timer = setTimeout(next, 700); else $("#stCap").textContent = s.lines[0]; };
    if (auto && playing) travel(s, start); else start();
    try { history.replaceState(null, "", "#" + (scene + 1)); } catch { }
  }

  function resume() {
    token++; clearTimeout(timer); synth?.cancel();
    $("#stWarp").hidden = true; $("#stEcho").classList.remove("zoom-off");
    if (shown !== scene) return goto(scene);                 // stopped mid-jump: land on the scene
    line = Math.max(-1, line - 1); next();                  // say the current line again
  }
  function play() {
    playing = true; $("#stPlay").setAttribute("aria-pressed", "true"); $("#stPlay").innerHTML = ico("pause"); $("#stPlay").setAttribute("aria-label", "Pause");
    resume();
  }
  function stop(ended = false) {
    playing = false; token++; clearTimeout(timer); synth?.cancel();
    $("#stWarp").hidden = true; $("#stEcho").classList.remove("zoom-off");
    if (shown !== scene) { showScene(scene); shown = scene; line = -1; $("#stCap").textContent = SCENES[scene].lines[0]; }
    $("#stEcho").classList.remove("talking");
    $("#stPlay").setAttribute("aria-pressed", "false"); $("#stPlay").innerHTML = ico("play"); $("#stPlay").setAttribute("aria-label", ended ? "Play again" : "Play");
    if (ended) { $("#stEnd").hidden = false; scene = SCENES.length - 1; $("#stEnd a")?.focus(); }
  }

  // ---- controls ----
  $("#stStart").addEventListener("click", () => {
    $("#stIntro").hidden = true; document.body.classList.add("running");
    const want = parseInt(location.hash.slice(1), 10);
    playing = true; $("#stPlay").innerHTML = ico("pause");
    goto(want >= 1 && want <= SCENES.length ? want - 1 : 0, want > 1);
    $("#stPlay").focus();
  });
  $("#stPlay").addEventListener("click", () => {
    if (playing) return stop();
    if (!$("#stEnd").hidden && scene === SCENES.length - 1 && line >= SCENES[scene].lines.length - 1) { playing = true; $("#stPlay").innerHTML = ico("pause"); return goto(0); }
    play();
  });
  $("#stPrev").addEventListener("click", () => goto(line > 0 ? scene : scene - 1));
  $("#stNext").addEventListener("click", () => goto(scene + 1, true));
  $("#stDots").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) goto(+b.dataset.go); });
  $("#stVoice").addEventListener("click", () => {
    voiceOn = !voiceOn; const b = $("#stVoice");
    b.setAttribute("aria-pressed", String(voiceOn)); b.innerHTML = ico(voiceOn ? "speaker" : "mute"); b.setAttribute("aria-label", voiceOn ? "Narration on" : "Narration off (captions only)");
    if (playing) resume();
  });
  $("#stAgain").addEventListener("click", () => { $("#stEnd").hidden = true; playing = true; $("#stPlay").innerHTML = ico("pause"); goto(0); });
  addEventListener("keydown", e => {
    if (!document.body.classList.contains("running") || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); $("#stPlay").click(); }
    else if (e.key === "ArrowRight") $("#stNext").click();
    else if (e.key === "ArrowLeft") $("#stPrev").click();
    else if (e.key === "m") $("#stVoice").click();
  });
  addEventListener("pagehide", () => synth?.cancel());

  // first picture behind the start card
  showScene(0);
  $("#stCap").textContent = SCENES[0].lines[0];
})();
