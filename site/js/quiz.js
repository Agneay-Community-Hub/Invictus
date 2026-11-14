/* ===========================================================
   Who am I? (quiz.html): read a clue, pick the machine.
   8 questions from data.js clues; choose the Moon, Mars, Elsewhere or all.
   Scoring 6+ earns the Archive Expert badge, saved in the same
   progress store the home page's Explorer Passport reads.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const store = {
    get(k, d) { try { const v = localStorage.getItem("goe:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("goe:" + k, JSON.stringify(v)); } catch { } }
  };
  const progress = Object.assign({ opened: [], chapters: [], voice: false, quizBest: 0, explore: false, badges: [] }, store.get("progress", {}));
  const LEN = 8;
  const thumb = a => a.media && a.media[0]
    ? `<img src="assets/nasa/${a.media[0].f}" alt="" loading="lazy">`
    : `<span class="ph" aria-hidden="true">${ico("rocket")}</span>`;
  let world = "all", quiz = null;

  function pool() { return ARTIFACTS.filter(a => a.quiz && (world === "all" || a.world === world)); }
  function newQuiz() {
    const all = pool(), qs = [...all].sort(() => Math.random() - .5).slice(0, LEN);
    quiz = { qs: qs.map(a => {
      const others = all.filter(o => o.id !== a.id).sort(() => Math.random() - .5).slice(0, 3);
      return { a, opts: [a, ...others].sort(() => Math.random() - .5) };
    }), i: 0, score: 0, answered: false };
    render();
  }
  function best() {
    $("#qBest").textContent = progress.quizBest ? `Your best score: ${progress.quizBest} out of ${LEN}` + (progress.badges.includes("quiz") ? " · Archive Expert badge earned" : "") : "Score 6 or more to earn the Archive Expert badge.";
  }
  function finish() {
    const s = quiz.score, n = quiz.qs.length;
    let badge = false;
    if (s > progress.quizBest) progress.quizBest = s;
    if (s >= 6 && !progress.badges.includes("quiz")) { progress.badges.push("quiz"); badge = true; }
    store.set("progress", progress); best();
    $("#quizBox").innerHTML = `<div class="q-done"><img src="assets/ui/${s >= 6 ? "trophy" : "star"}.png" alt="">
      <h2>You scored ${s} out of ${n}!</h2>
      <p>${s >= 6 ? "Amazing, you're an Archive Expert." : "Nice try! Open a few more dossiers and try again."}${badge ? " <b>New badge: Archive Expert.</b> It's in your Explorer Passport on the home page." : ""}</p>
      <div class="q-done-btns"><button class="btn btn-primary" id="qAgain">${ico("shuffle")} Play again</button><a class="btn" href="index.html#play">${ico("rocket")} More games</a></div></div>`;
    $("#qAgain").addEventListener("click", newQuiz); $("#qAgain").focus();
  }
  function render() {
    if (quiz.i >= quiz.qs.length) return finish();
    const q = quiz.qs[quiz.i], box = $("#quizBox");
    box.innerHTML = `
      <div class="q-top"><span class="tag">Question ${quiz.i + 1} of ${quiz.qs.length}</span><span class="q-progress" aria-hidden="true"><i style="width:${quiz.i / quiz.qs.length * 100}%"></i></span><span class="tag">Score: ${quiz.score}</span></div>
      <p class="q-clue">${esc(q.a.quiz)}</p>
      <div class="q-opts">${q.opts.map(o => `<button class="q-opt" data-id="${o.id}">${thumb(o)}<span><b>${esc(o.name)}</b><br><small style="color:var(--muted)">${esc(WORLDS[o.world].short)} · ${o.year}</small></span></button>`).join("")}</div>
      <div class="q-feedback" id="qFeed" aria-live="polite"></div>`;
    $$(".q-opt").forEach(b => b.addEventListener("click", () => {
      if (quiz.answered) return; quiz.answered = true;
      const ok = b.dataset.id === q.a.id;
      if (ok) quiz.score++;
      $$(".q-opt").forEach(x => { x.disabled = true; if (x.dataset.id === q.a.id) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      $("#qFeed").innerHTML = `<p>${ok ? ico("check", "ok") + " Correct!" : ico("cross", "no") + " Not quite, it was <b>" + esc(q.a.name) + "</b>."} ${esc(q.a.fun)}</p>
        <button class="btn btn-primary btn-small" id="qNext">${quiz.i === quiz.qs.length - 1 ? "See my score" : "Next question →"}</button>
        <a class="btn btn-small" href="index.html#artifact=${q.a.id}" target="_blank" rel="noopener">Open its dossier ↗</a>`;
      $("#qNext").addEventListener("click", () => { quiz.i++; quiz.answered = false; render(); $("#quizBox").scrollIntoView({ block: "nearest" }); $(".q-opt")?.focus(); });
      $("#qNext").focus();
    }));
  }

  // choose a world
  $$("[data-qw]").forEach(b => {
    const n = ARTIFACTS.filter(a => a.quiz && (b.dataset.qw === "all" || a.world === b.dataset.qw)).length;
    b.querySelector("small").textContent = n;
    b.addEventListener("click", () => {
      world = b.dataset.qw;
      $$("[data-qw]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      newQuiz();
    });
  });
  best();
  newQuiz();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
