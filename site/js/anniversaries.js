/* ===========================================================
   Anniversaries: every dated moment in ARTIFACTS[].dates (launch,
   arrival, last word) turned into calendar events. Used by the Ghost
   Calendar (calendar.html) and the "On this day" line on the home page.
   Nothing here is new data: it only reads the dates already in data.js.
   Dates without a day ("Mar 2009", "1964") or without a date at all
   ("Still working") are skipped on purpose.
   =========================================================== */
(() => {
  const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const DATE_RE = /(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})/;
  const LANDS = new Set(["lander", "rover", "vehicle", "experiment", "helicopter", "debris"]);
  const WORLD_NAME = { moon: "the Moon", mars: "Mars" };

  // "Moon orbit: 11 Jan 1998" → { y, m, d, before: "Moon orbit", paren: "" }
  function parse(raw) {
    const s = String(raw || "");
    const hit = s.match(DATE_RE);
    if (!hit) return null;
    const before = s.slice(0, hit.index).replace(/[\s:,]+$/, "").trim();
    const paren = (s.slice(hit.index).match(/\(([^)]*)\)/) || [])[1] || "";
    return { y: +hit[3], m: MON[hit[2]], d: +hit[1], before, paren };
  }

  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  // The words in brackets after a last date, said the way a person would.
  const LAST = {
    "switched off": "Switched off", "parked": "Parked for good", "impact": "Crashed on purpose to end its mission",
    "final burn": "Fired its engine one last time", "final commands": "Final commands sent", "mission ended": "Mission ended",
    "via lander": "Last word, sent through its lander", "lost during landing": "Lost during landing",
    "grand finale plunge": "Grand Finale plunge into Saturn", "plunged into jupiter": "Plunged into Jupiter"
  };

  function label(a, kind, p) {
    if (kind === "launch") return "Launched";
    if (kind === "arrive") {
      if (/impact/i.test(p.paren)) return a.world === "deep" ? "Hit its target" : `Crashed into ${WORLD_NAME[a.world]}`;
      if (/entry/i.test(p.paren)) return "Plunged into the atmosphere";
      if (/orbit/i.test(p.paren)) return "Went into orbit";
      if (/ flyby$/.test(p.before)) return "Flew past " + p.before.replace(/ flyby$/, "");
      if (p.before) return "Reached " + p.before.replace(/^Interstellar/, "interstellar");
      return LANDS.has(a.type) ? `Landed on ${WORLD_NAME[a.world] || "its world"}` : "Arrived";
    }
    if (p.paren) return LAST[p.paren.toLowerCase()] || cap(p.paren);
    if (/^Flight \d+/.test(p.before)) return `Last flight (${p.before})`;
    return a.status === "lost" ? "Last heard from" : "Went quiet";
  }

  const all = [];
  for (const a of ARTIFACTS) {
    const seen = new Set();
    for (const kind of ["launch", "arrive", "last"]) {
      const p = parse(a.dates && a.dates[kind]);
      if (!p) continue;
      const key = `${p.y}-${p.m}-${p.d}`;
      if (seen.has(key)) { // arrived and ended the same day (Ranger 7, Mars Polar Lander): one event
        if (a.status === "lost") { const e = all[all.length - 1]; e.kind = "last"; e.raw = a.dates.last; e.text = p.paren ? label(a, kind, p) : "Lost on arrival"; }
        continue;
      }
      seen.add(key);
      all.push({ a, kind, y: p.y, m: p.m, d: p.d, text: label(a, kind, p), raw: a.dates[kind] });
    }
  }
  all.sort((x, y) => x.m - y.m || x.d - y.d || x.y - y.y);

  const onDay = (m, d) => all.filter(e => e.m === m && e.d === d);

  // The next n anniversaries after (not including) the given day, wrapping into next year.
  function upcoming(from, n) {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const withNext = all.map(e => {
      let next = new Date(start.getFullYear(), e.m, e.d);
      if (next <= start) next = new Date(start.getFullYear() + 1, e.m, e.d);
      return { ...e, next, inDays: Math.round((next - start) / 864e5) };
    });
    return withNext.sort((x, y) => x.next - y.next || x.y - y.y).slice(0, n);
  }

  // Was this machine out there working on that day? From launch to its last dated word.
  // Machines with no dated last word count up to today if they are still active or partly awake.
  const at = p => new Date(p.y, p.m, p.d).getTime();
  function workingOn(date) {
    const t = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return ARTIFACTS.filter(a => {
      const l = parse(a.dates.launch);
      if (!l) return false;
      const last = parse(a.dates.last), arrive = parse(a.dates.arrive);
      const end = last ? at(last) : (a.status === "active" || a.status === "retired") ? Date.now() : arrive ? at(arrive) : null;
      return end !== null && at(l) <= t && t <= end;
    });
  }

  const ago = (y, now = new Date()) => now.getFullYear() - y;

  window.Anniv = { all, onDay, upcoming, workingOn, ago, parse };
})();
