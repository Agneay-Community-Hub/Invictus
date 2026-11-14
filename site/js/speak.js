/* ===========================================================
   Read aloud for the subpages (the home page has its own in app.js).
   GhostVoice.toggle(btn, text) reads one text; GhostVoice.queue(list,
   {onItem, onEnd}) reads several in a row. Uses the page language
   (English, Spanish or Hindi) and prefers the more natural voices.
   =========================================================== */
window.GhostVoice = (() => {
  const ok = "speechSynthesis" in window;
  let btn = null, stopped = true, after = null;
  const lang = () => (window.I18n && I18n.lang) || (document.documentElement.lang || "en").slice(0, 2);
  const tag = () => ({ en: "en-US", es: "es-ES", hi: "hi-IN" })[lang()] || "en-US";
  function voice() {
    const re = new RegExp("^" + lang() + "(-|_|$)", "i"), vs = speechSynthesis.getVoices();
    return vs.find(v => re.test(v.lang) && /natural|google|samantha|aria|jenny|sabina|helena|madhur|swara|kalpana|hemant/i.test(v.name)) || vs.find(v => re.test(v.lang));
  }
  function stop() {
    stopped = true;
    if (ok) speechSynthesis.cancel();
    if (btn) { btn.setAttribute("aria-pressed", "false"); btn.classList.remove("speaking"); }
    btn = null;
    const f = after; after = null; f && f();
  }
  function say(text, done) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = tag(); const v = voice(); if (v) u.voice = v;
    u.onend = u.onerror = () => { if (!stopped) done(); };
    speechSynthesis.speak(u);
  }
  // read items one after another; onItem(i) before each, onEnd() when all done or stopped
  function queue(b, items, { onItem, onEnd } = {}) {
    if (!ok) { alert("Read aloud isn't supported in this browser."); return; }
    if (btn === b) return stop();
    stop();
    btn = b; stopped = false; after = onEnd || null;
    b.setAttribute("aria-pressed", "true"); b.classList.add("speaking");
    let i = 0;
    const next = () => {
      if (stopped) return;
      if (i >= items.length) return stop();
      onItem && onItem(i);
      say(items[i++], next);
    };
    next();
  }
  if (ok) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; }
  addEventListener("pagehide", stop);
  return { ok, stop, queue, toggle: (b, text) => queue(b, [text]), busy: () => !stopped };
})();
