/* ===========================================================
   Ghost Calendar (calendar.html?date=YYYY-MM-DD): today's anniversaries,
   a date picker (birthdays), what's coming up, the whole year by month,
   and an .ics download with every anniversary repeating yearly.
   Events come from js/anniversaries.js, which reads data.js only.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ico = n => `<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-${n}"></use></svg>`;
  const thumb = a => a.media && a.media[0] ? "assets/nasa/thumb/" + a.media[0].f.replace(/\.\w+$/, ".jpg") : null;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const SITE = "https://agneay-community-hub.github.io/Invictus/";
  const { all, onDay, upcoming, workingOn } = window.Anniv;
  const today = new Date();
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const dayName = (m, d) => `${d} ${MONTHS[m]}`;
  const yearsAgo = (y, ref = today) => { const n = ref.getFullYear() - y; return n === 0 ? "this year" : n > 0 ? plural(n, "year") + " ago" : "in " + plural(-n, "year"); };

  const item = (e, extra = "") => `<li class="cal-item" style="--c:${WORLDS[e.a.world].color}">
      <a href="index.html#artifact=${e.a.id}">
        ${thumb(e.a) ? `<img src="${thumb(e.a)}" alt="" loading="lazy" decoding="async">` : `<span class="cal-ph">${ico("planet")}</span>`}
        <span><b>${esc(e.a.name)}</b> <span class="cal-what">${esc(e.text)}</span>
        <small>${extra || dayName(e.m, e.d)} · ${e.y} · ${esc(WORLDS[e.a.world].short)}</small></span>
      </a></li>`;

  /* ---- today ---- */
  function renderToday() {
    const hits = onDay(today.getMonth(), today.getDate());
    const head = `<p class="cal-date">${today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>`;
    if (hits.length) {
      $("#calTodayOut").innerHTML = head + `<ul class="cal-list cal-big">${hits.map(e => item(e, yearsAgo(e.y) + " today")).join("")}</ul>`;
    } else {
      const n = upcoming(today, 1)[0];
      $("#calTodayOut").innerHTML = head + `<p class="cal-none">Nothing in the archive happened on this exact day. The next anniversary is in <b>${plural(n.inDays, "day")}</b>:</p>
        <ul class="cal-list cal-big">${item(n, dayName(n.m, n.d))}</ul>`;
    }
  }

  /* ---- a picked date ---- */
  const fromISO = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); if (!m) return null; const d = new Date(+m[1], +m[2] - 1, +m[3]); return isNaN(d) || d.getMonth() !== +m[2] - 1 ? null : d; };
  const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const firstLaunch = all.filter(e => e.kind === "launch").reduce((p, e) => (!p || e.y < p.y || (e.y === p.y && (e.m < p.m || (e.m === p.m && e.d < p.d))) ? e : p), null);

  function renderPick(d) {
    const same = onDay(d.getMonth(), d.getDate());
    const working = workingOn(d);
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const sameHTML = same.length
      ? `<ul class="cal-list">${same.map(e => item(e, e.y === d.getFullYear() ? "that very day" : yearsAgo(e.y, d).replace("ago", "before").replace(/^in (.*)$/, "$1 later"))).join("")}</ul>`
      : `<p class="cal-none">No launch, landing or last word on ${dayName(d.getMonth(), d.getDate())} in any year. Pick a day nearby and try again!</p>`;
    let workHTML;
    if (working.length) {
      workHTML = `<p>On <b>${esc(label)}</b>, <b>${plural(working.length, "machine")}</b> from the archive ${working.length === 1 ? "was" : "were"} out there working:</p>
        <div class="cal-chips">${working.map(a => `<a class="cal-chip" href="index.html#artifact=${a.id}" style="--c:${WORLDS[a.world].color}">${thumb(a) ? `<img src="${thumb(a)}" alt="" loading="lazy" decoding="async">` : ""}${esc(a.name)}</a>`).join("")}</div>`;
    } else if (d < new Date(firstLaunch.y, firstLaunch.m, firstLaunch.d)) {
      workHTML = `<p class="cal-none">No machine from the archive had launched yet. The first, <a href="index.html#artifact=${firstLaunch.a.id}">${esc(firstLaunch.a.name)}</a>, went up on ${dayName(firstLaunch.m, firstLaunch.d)} ${firstLaunch.y}.</p>`;
    } else {
      workHTML = `<p class="cal-none">None of the archive's machines were working on that exact day. Space was quiet!</p>`;
    }
    $("#calPickOut").innerHTML = `
      <div class="cal-pick-grid">
        <div><h3>${esc(dayName(d.getMonth(), d.getDate()))} in other years</h3>${sameHTML}</div>
        <div><h3>Out there that day</h3>${workHTML}</div>
      </div>`;
  }

  const input = $("#calDate");
  const q = fromISO(new URLSearchParams(location.search).get("date"));
  input.value = toISO(q || today);
  const pick = (push) => {
    const d = fromISO(input.value); if (!d) return;
    renderPick(d);
    if (push) history.replaceState(null, "", toISO(d) === toISO(today) ? location.pathname : "?date=" + toISO(d));
  };
  input.addEventListener("change", () => pick(true));
  $("#calTodayBtn").addEventListener("click", () => { input.value = toISO(today); pick(true); });
  $("#calShare").addEventListener("click", async e => {
    const url = new URL("calendar.html?date=" + input.value, location.href).href;
    if (navigator.share) { try { await navigator.share({ title: "Ghost Calendar", url }); } catch { } return; }
    try { await navigator.clipboard.writeText(url); e.currentTarget.lastChild.textContent = " Link copied!"; }
    catch { prompt("Copy this link:", url); }
  });

  /* ---- coming up ---- */
  $("#calNext").innerHTML = upcoming(today, 6).map(e => item(e, `in ${plural(e.inDays, "day")} (${dayName(e.m, e.d)})`)).join("");

  /* ---- the whole year ---- */
  $("#calYear").innerHTML = MONTHS.map((name, m) => {
    const list = all.filter(e => e.m === m);
    const now = m === today.getMonth() ? ' class="cal-month now"' : ' class="cal-month"';
    return `<details${now}${m === today.getMonth() ? " open" : ""}><summary><b>${name}</b> <span>${plural(list.length, "moment")}</span></summary>
      <ul>${list.map(e => `<li><span class="cal-day">${e.d}</span> <a href="index.html#artifact=${e.a.id}">${esc(e.a.name)}</a>: ${esc(e.text)} <small>(${e.y})</small></li>`).join("")}</ul></details>`;
  }).join("");

  /* ---- .ics: one all-day event per moment, repeating every year ---- */
  const icsEsc = s => String(s).replace(/\\/g, "\\\\").replace(/[;,]/g, m => "\\" + m).replace(/\r?\n/g, "\\n");
  const enc = new TextEncoder();
  function fold(line) { // lines longer than 75 bytes continue on the next line, starting with a space (RFC 5545)
    const out = []; let cur = "", bytes = 0;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (bytes + b > 75) { out.push(cur); cur = " "; bytes = 1; }
      cur += ch; bytes += b;
    }
    return out.concat(cur).join("\r\n");
  }
  function ics() {
    const ymd = e => `${e.y}${String(e.m + 1).padStart(2, "0")}${String(e.d).padStart(2, "0")}`;
    const next = e => { const d = new Date(e.y, e.m, e.d + 1); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`; };
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ghosts of Exploration//Ghost Calendar//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Ghost Calendar"];
    for (const e of all) {
      const url = SITE + "machines/" + e.a.id + ".html";
      lines.push("BEGIN:VEVENT", `UID:${e.a.id}-${e.kind}@ghosts-of-exploration`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(e)}`, `DTEND;VALUE=DATE:${next(e)}`, "RRULE:FREQ=YEARLY",
        `SUMMARY:${icsEsc(`${e.a.name}: ${e.text} (${e.y})`)}`,
        `DESCRIPTION:${icsEsc(`${e.a.story}\n\nRead its story: ${url}`)}`, `URL:${url}`, "TRANSP:TRANSPARENT", "END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return lines.map(fold).join("\r\n") + "\r\n";
  }
  $("#calIcs").addEventListener("click", () => {
    const blob = new Blob([ics()], { type: "text/calendar;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "ghost-calendar.ics" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  renderToday();
  pick(false);

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
