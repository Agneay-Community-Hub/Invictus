/* ===========================================================
   Back button: always returns to the page you were really on before.
   Every page (the home page too) records itself in a short trail kept
   for this browser tab (sessionStorage). The button on inner pages
   reads that trail, says where it goes ("Back to Play", "Back to
   Spirit") and returns there:
     - with history.back() when the browser's own history leads there,
       so the scroll position, open dossier and filters come back too;
     - otherwise by opening that page's address.
   With no trail at all (a page opened from a search engine or a shared
   link), it follows its own href to the matching part of the home page.
   =========================================================== */
(() => {
  const KEY = "goe:trail", MAX = 30;
  const lang = (document.documentElement.lang || "en").slice(0, 2);
  const WORDS = {
    en: { back: "Back", to: "Back to", home: "Home" },
    es: { back: "Volver", to: "Volver a", home: "Inicio" },
    hi: { back: "वापस", to: "वापस जाएँ:", home: "मुख्य पेज" }
  }[lang] || { back: "Back", to: "Back to", home: "Home" };

  const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = t => { try { sessionStorage.setItem(KEY, JSON.stringify(t.slice(-MAX))); } catch { } };
  const here = () => location.pathname + location.search;            // a page, whatever its #section
  const isHome = /\/(index\.html)?$/.test(location.pathname) && !/\/machines\//.test(location.pathname);   // machines/index.html is "All 49 machines"

  // A short, friendly name for this page, as the next page's button will show it.
  function label() {
    if (isHome) {
      const name = document.getElementById("dName");                 // an open dossier
      if (name && !document.getElementById("drawer")?.hidden) return name.textContent.trim();
      // the home page section on screen, by its little eyebrow title
      const mid = innerHeight * 0.35;
      const sec = [...document.querySelectorAll("main > section")].find(s => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
      const eb = sec?.querySelector(".eyebrow")?.textContent.trim();
      return eb && sec.id ? eb : WORDS.home;
    }
    const h1 = document.querySelector("main h1, h1");
    if (/\/machines\/(?!index)/.test(location.pathname) && h1) return h1.textContent.trim().slice(0, 40);   // a machine page: its name
    const t = (document.title.split(/\s[—|]\s/)[0] || "").trim();
    return (t || h1?.textContent || WORDS.home).trim().slice(0, 40);
  }

  // ---- record this page in the trail ----
  const me = here();
  function record() {
    const trail = read();
    const last = trail[trail.length - 1], prev = trail[trail.length - 2];
    if (last && last.u === me) { /* a reload, or the same page again */ }
    else if (prev && prev.u === me) trail.pop();                     // we came back one step
    else trail.push({ u: me, h: location.hash, l: label() });
    write(trail);
  }
  record();
  // pages restored from the browser's back/forward cache don't re-run scripts: record them again
  addEventListener("pageshow", e => { if (e.persisted) { record(); setButton(); } });

  // keep this page's entry fresh: which section or dossier was on screen when we left
  const refresh = () => {
    const t = read(), e = t[t.length - 1];
    if (e && e.u === me) { e.h = location.hash; e.l = label(); write(t); }
  };
  addEventListener("pagehide", refresh);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") refresh(); });
  document.addEventListener("click", e => { if (e.target.closest("a[href]")) refresh(); }, true);

  // ---- the button ----
  const btn = document.querySelector("a[data-back]");
  const fallback = btn?.getAttribute("href");
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>';
  let dest = null;
  function setButton() {
    if (!btn) return;
    const t = read(); dest = t[t.length - 1]?.u === me ? t[t.length - 2] : null;
    const name = dest ? dest.l : null;
    btn.innerHTML = `<span class="back-ic">${arrow}</span><span class="back-txt"><small>${name ? WORDS.to : WORDS.back}</small><b>${name ? escapeHTML(name) : WORDS.home}</b></span>`;
    const full = name ? `${WORDS.to} ${name}` : WORDS.back;
    btn.setAttribute("aria-label", full); btn.title = full;
    btn.href = dest ? dest.u + (dest.h || "") : fallback;
  }
  setButton();
  if (!btn) return;

  btn.addEventListener("click", e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // new tab / window: use the link
    if (!dest) return;                                                                 // no trail: follow the link
    e.preventDefault();
    let sameSite = false;
    try { sameSite = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { }
    if (sameSite && history.length > 1) {
      // the browser knows the way back (keeps scroll and state); if nothing happens, go by address
      const was = location.href;
      history.back();
      setTimeout(() => { if (location.href === was && document.visibilityState === "visible") location.href = btn.href; }, 700);
    } else location.href = btn.href;
  });

  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
})();
