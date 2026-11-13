/* ===========================================================
   Build a probe (probe.html): choose a destination, a power source,
   a radio dish and protection within a budget, then launch. A simple
   model of sunlight, cold, radiation, dust and radio range decides
   how long it lasts, and the result names the real machine that made
   the same choices. Choices live in the URL so a design can be shared.
   =========================================================== */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const BUDGET = 9;

  const DEST = {
    moon:    { where: "on the Moon", name: "The Moon", au: 1, travel: "3 days", cold: "lunar night: two weeks of darkness at −170 °C", need: 1, rad: false, dust: false, surface: true, icon: "moon" },
    mars:    { where: "on Mars", name: "Mars", au: 1.52, travel: "7 months", cold: "Martian winter nights below −90 °C", need: 1, rad: false, dust: true, surface: true, icon: "globe" },
    jupiter: { where: "in orbit around Jupiter", name: "Jupiter orbit", au: 5.2, travel: "about 5 years", cold: "the cold of the outer solar system", need: 2, rad: true, dust: false, surface: false, icon: "globe" },
    saturn:  { where: "in orbit around Saturn", name: "Saturn orbit", au: 9.5, travel: "about 7 years", cold: "the cold of the outer solar system", need: 3, rad: false, dust: false, surface: false, icon: "globe" },
    beyond:  { where: "sailing on beyond Pluto", name: "Beyond Pluto", au: 40, travel: "10+ years, and then keep going", cold: "deep space, near −270 °C", need: 3, rad: false, dust: false, surface: false, icon: "rocket" }
  };
  const POWER = {
    battery: { name: "Batteries only", cost: 0, note: "Light and cheap, but they run flat in hours or days." },
    solarS:  { name: "Small solar panels", cost: 1, note: "Fine near the Sun. Sunlight fades fast further out." },
    solarL:  { name: "Big solar panels", cost: 3, note: "Enough to work even at Jupiter, if you have the money." },
    rtg:     { name: "Nuclear battery (RTG)", cost: 4, note: "Works anywhere for decades, day or night. Expensive." }
  };
  const DISH = {
    s: { name: "Small antenna", cost: 1, size: 1, note: "Good for the Moon, or Mars if orbiters relay your data." },
    m: { name: "Medium dish", cost: 2, size: 2, note: "About 2.5 m across. Talks from Jupiter." },
    l: { name: "Big dish", cost: 3, size: 3, note: "3.7 m, like Voyager's. Talks from the edge of the solar system." }
  };
  const EXTRA = {
    heat:  { name: "Heaters and insulation", cost: 1, note: "Keeps electronics alive through cold nights." },
    vault: { name: "Radiation vault", cost: 2, note: "A titanium box that shields the brain from Jupiter's radiation." }
  };

  // ---- the form ----
  const card = (group, key, o, type = "radio", extra = "") => `
    <label class="pb-opt"><input type="${type}" name="${group}" value="${key}"${extra}>
      <span class="pb-box"><b>${esc(o.name)}</b>${o.cost != null ? `<em>${o.cost ? o.cost + (o.cost === 1 ? " coin" : " coins") : "free"}</em>` : ""}<small>${esc(o.note || o.travel && `Travel: ${o.travel}`)}</small></span></label>`;
  $("#pbDest").innerHTML = Object.entries(DEST).map(([k, o]) => card("dest", k, o)).join("");
  $("#pbPower").innerHTML = Object.entries(POWER).map(([k, o]) => card("power", k, o)).join("");
  $("#pbDish").innerHTML = Object.entries(DISH).map(([k, o]) => card("dish", k, o)).join("");
  $("#pbExtra").innerHTML = Object.entries(EXTRA).map(([k, o]) => card("extra", k, o, "checkbox")).join("");

  const pick = () => ({
    dest: $("input[name=dest]:checked")?.value, power: $("input[name=power]:checked")?.value, dish: $("input[name=dish]:checked")?.value,
    extra: $$("input[name=extra]:checked").map(i => i.value), name: $("#pbName").value.trim() || "Your probe"
  });
  const cost = c => (POWER[c.power]?.cost || 0) + (DISH[c.dish]?.cost || 0) + c.extra.reduce((s, k) => s + EXTRA[k].cost, 0);
  function update() {
    const c = pick(), spent = cost(c), left = BUDGET - spent;
    $("#pbCoins").textContent = left; $("#pbBudget").style.setProperty("--p", Math.min(1, spent / BUDGET));
    $("#pbBudgetBox").classList.toggle("over", left < 0);
    const ready = c.dest && c.power && c.dish && left >= 0;
    $("#pbLaunch").disabled = !ready;
    $("#pbHint").textContent = left < 0 ? `Over budget by ${-left} ${-left === 1 ? "coin" : "coins"}. Real missions have to make choices like this too.` : !c.dest ? "Pick where to go." : !c.power ? "Pick a power source." : !c.dish ? "Pick a radio dish." : "Ready for launch!";
    const q = new URLSearchParams({ d: c.dest || "", p: c.power || "", r: c.dish || "", x: c.extra.join(".") });
    if (c.name !== "Your probe") q.set("n", c.name);
    history.replaceState(null, "", "?" + q);
  }
  document.querySelector(".pb-form").addEventListener("change", update);
  $("#pbName").addEventListener("input", update);

  // ---- the model ----
  function simulate(c) {
    const D = DEST[c.dest], heat = c.extra.includes("heat") || c.power === "rtg", vault = c.extra.includes("vault"), dish = DISH[c.dish].size;
    const sun = 1 / (D.au * D.au); // sunlight compared with Earth
    const log = []; let years = null, end = "", data = "plenty of";
    const ok = (t, s) => log.push(["ok", t, s]), bad = (t, s) => log.push(["bad", t, s]), warn = (t, s) => log.push(["warn", t, s]);
    ok("Launch", "A perfect launch. You are on your way.");

    // getting there on batteries
    if (c.power === "battery" && !["moon"].includes(c.dest)) { bad("Cruise", `The batteries ran flat long before ${D.name}: the trip takes ${D.travel}.`); return { log, years: 0, end: "never arrived alive", data: "no" }; }
    ok("Cruise", `${D.travel} through space.`);

    // power at the destination
    if (c.power === "battery") { warn("Arrival", "You arrive with full batteries and start working at once."); years = 2 / 365; end = "the batteries ran flat after a couple of days"; }
    else if (c.power === "solarS" && sun < .3) { bad("Arrival", `Sunlight at ${D.name} is only ${Math.round(sun * 100)}% of Earth's. Small panels can't power the probe.`); return { log, years: 0, end: "ran out of power on arrival", data: "no" }; }
    else if (c.power === "solarL" && sun < .03) { bad("Arrival", `Sunlight out here is only ${(sun * 100).toFixed(1)}% of Earth's. Even big panels give almost nothing.`); return { log, years: 0, end: "ran out of power on arrival", data: "no" }; }
    else ok("Arrival", c.power === "rtg" ? "The nuclear battery doesn't care how far you are from the Sun." : `Sunlight here is ${Math.round(sun * 100)}% of Earth's. The panels keep up.`);

    // radiation
    if (D.rad) {
      if (!vault) { bad("Radiation", "Jupiter's radiation belts fry unprotected electronics. Glitches start within weeks."); years = Math.min(years ?? 99, c.power === "rtg" ? 8 : .4); end = c.power === "rtg" ? "radiation damage built up until it was worn out" : "radiation destroyed the electronics"; }
      else ok("Radiation", "The radiation vault protects the probe's brain.");
    }

    // cold nights and winters
    if (D.surface && c.power !== "battery") {
      if (!heat) { bad("First cold night", `No heaters for ${D.cold}. The electronics freeze and crack.`); const y = c.dest === "moon" ? 14 / 365 : .45; if (years == null || y < years) { years = y; end = "it froze in the first cold night"; } }
      else ok("First cold night", c.power === "rtg" ? "The nuclear battery's waste heat keeps everything warm." : "Heaters and insulation keep it alive through the night.");
    }

    // dust on Mars
    if (D.dust && c.power !== "rtg" && c.power !== "battery" && years == null) {
      const storm = 3 + Math.random() * 12;
      warn("Dust", "Dust slowly covers the solar panels. Lucky gusts of wind sometimes blow them clean.");
      years = storm; end = "a giant dust storm blocked the Sun";
    }

    // radio
    if (dish < D.need) {
      if (c.dest === "jupiter") { warn("Radio", "The small dish is too weak this far out. Data trickles home a few bits per second."); data = "only a trickle of"; }
      else if (c.dest === "saturn") { warn("Radio", "From Saturn your signal is very faint. Only a little data gets through."); data = "only a trickle of"; }
      else { warn("Radio", "The dish is too small for this distance. Your signal fades below what Earth can hear."); const y = dish === 2 ? 31 : 12; if (years == null || y < years) { years = y; end = "its signal grew too faint to hear"; } }
    } else ok("Radio", c.dest === "mars" && dish === 1 ? "Orbiters overhead relay your data to Earth." : "Earth hears you loud and clear.");

    // whatever is left: the power source wears out
    if (years == null) {
      if (c.power === "rtg") { years = c.dest === "moon" || c.dest === "mars" ? 15 + Math.random() * 15 : c.dest === "saturn" ? 20 : c.dest === "jupiter" ? 12 : 48; end = c.dest === "saturn" || c.dest === "jupiter" ? "it ran low on fuel and was sent on a final plunge" : "the nuclear battery slowly faded"; }
      else { years = c.dest === "moon" ? 4 + Math.random() * 6 : 6 + Math.random() * 6; end = "parts slowly wore out"; }
    }
    ok("Science", `It sends home ${data} pictures and measurements.`);
    return { log, years, end, data };
  }

  // the real machine (or mission) that made similar choices
  function twin(c, r) {
    const heat = c.extra.includes("heat") || c.power === "rtg", vault = c.extra.includes("vault"), solar = c.power === "solarS" || c.power === "solarL";
    const T = (id, text) => ({ id, text });
    switch (c.dest) {
      case "moon":
        if (c.power === "battery") return T("ranger7", "Ranger 7 only had to last three days: it flew straight at the Moon, sent 4,308 photos in its last 17 minutes, then crashed on purpose.");
        if (c.power === "rtg") return T("apollo12", "Apollo's science stations ran on nuclear batteries. They worked for years until NASA switched them off in 1977 to save money.");
        if (solar && !heat) return T("surveyor3", "Surveyor 3 ran on sunlight with no way to stay warm. It went silent in its first lunar night.");
        return T(null, "China's Chang'e 3 lander used sunlight by day and small nuclear heaters at night, and kept working for years.");
      case "mars":
        if (c.power === "rtg") return T("curiosity", "Curiosity runs on a nuclear battery. It landed in 2012 and is still driving.");
        if (solar && !heat) return T("phoenix", "Phoenix landed near Mars's north pole on solar power. It froze in its first Martian winter in 2008.");
        if (solar) return T("opportunity", "Opportunity was solar-powered and planned to last 90 days. Wind kept cleaning its panels, so it lasted 14 years, until a giant dust storm in 2018.");
        return T("sojourner", "Little Sojourner had a non-rechargeable battery and solar panels, and talked to Earth through its lander.");
      case "jupiter":
        if (c.power === "rtg") return T("galileo", "Galileo used nuclear batteries. Its big antenna never opened, so data trickled home through a small one, and radiation kept damaging it until it was sent into Jupiter in 2003.");
        if (solar && vault) return T(null, "NASA's Juno uses three huge solar panels and a titanium radiation vault, and has orbited Jupiter since 2016.");
        return T("galileo", "Galileo, at Jupiter from 1995 to 2003, showed how hard radiation is on a spacecraft.");
      case "saturn":
        return c.power === "rtg" ? T("cassini", "Cassini used nuclear batteries and a 4-metre dish. It explored Saturn for 13 years, then dived into the planet in 2017.") : T("cassini", "No mission has gone to Saturn on sunlight. Cassini needed nuclear batteries to work out there.");
      default:
        if (c.power !== "rtg") return T("pioneer10", "No probe has tried this without a nuclear battery: sunlight is thousands of times weaker past Pluto. Pioneer 10 and the Voyagers all used RTGs.");
        if (DISH[c.dish].size < 3) return T("pioneer10", "Pioneer 10 used a nuclear battery and a 2.7 m dish. Its signal faded below what Earth could hear in 2003.");
        return T("voyager1", "Voyager 1 has a nuclear battery and a 3.7 m dish. Launched in 1977, it is still talking from interstellar space.");
    }
  }

  const span = y => y <= 0 ? "never worked" : y < 1 / 52 ? `${Math.max(1, Math.round(y * 365 * 24))} hours` : y < .2 ? `${Math.round(y * 365)} days` : y < 2 ? `${Math.round(y * 12)} months` : `${Math.round(y)} years`;

  // ---- launch ----
  let running = false;
  $("#pbLaunch").addEventListener("click", async () => {
    if (running) return; running = true;
    const c = pick(), r = simulate(c), tw = twin(c, r), out = $("#pbOut");
    out.hidden = false; out.innerHTML = `<h2>${esc(c.name)} · mission log</h2><ol class="pb-log" id="pbLog"></ol><div id="pbEnd"></div>`;
    out.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    for (const [kind, title, text] of r.log) {
      await new Promise(res => setTimeout(res, 650));
      $("#pbLog").insertAdjacentHTML("beforeend", `<li class="${kind}"><b>${esc(title)}</b> ${esc(text)}</li>`);
    }
    await new Promise(res => setTimeout(res, 650));
    const a = tw.id && ARTIFACTS.find(x => x.id === tw.id);
    const stars = r.years <= 0 ? 0 : r.years < .1 ? 1 : r.years < 2 ? 2 : r.years < 10 ? 3 : r.years < 25 ? 4 : 5;
    $("#pbEnd").innerHTML = `
      <div class="pb-result">
        <p class="eyebrow">Mission result</p>
        <h3>${r.years > 0 ? `${esc(c.name)} worked for about <span>${span(r.years)}</span>` : `${esc(c.name)} ${esc(r.end)}`}</h3>
        ${r.years > 0 ? `<p>Then ${esc(r.end)}. Now it is a ghost, still ${esc(DEST[c.dest].where)}.</p>` : `<p>Every engineer learns from missions like this. Change one thing and try again.</p>`}
        <p class="pb-stars" aria-label="${stars} out of 5">${"★".repeat(stars)}<span>${"★".repeat(5 - stars)}</span></p>
        <div class="pb-twin">${a && a.media?.[0] ? `<img src="assets/nasa/${a.media[0].f}" alt="" loading="lazy">` : ""}
          <div><p class="eyebrow">Real machines that made these choices</p><p>${esc(tw.text)}</p>
          ${a ? `<a class="btn btn-small" href="index.html#artifact=${a.id}">${ico("book")} Read ${esc(a.name)}'s story</a>` : ""}</div></div>
        <div class="pb-again"><button class="btn btn-primary" id="pbRetry">${ico("shuffle")} Change the design</button>
          <button class="btn" id="pbShare">${ico("arrow")} Share this design</button></div>
      </div>`;
    $("#pbRetry").addEventListener("click", () => document.querySelector(".pb-form").scrollIntoView({ behavior: "smooth" }));
    $("#pbShare").addEventListener("click", async () => {
      const url = location.href;
      if (navigator.share) { try { await navigator.share({ title: c.name, text: `I designed a space probe: ${c.name}. Can you beat it?`, url }); } catch { } return; }
      try { await navigator.clipboard.writeText(url); $("#pbShare").textContent = "Link copied!"; } catch { prompt("Copy this link:", url); }
    });
    running = false;
  });

  // ---- restore a shared design ----
  const q = new URLSearchParams(location.search);
  const set = (n, v) => { const el = v && $(`input[name=${n}][value="${v}"]`); if (el) el.checked = true; };
  set("dest", q.get("d")); set("power", q.get("p")); set("dish", q.get("r"));
  (q.get("x") || "").split(".").forEach(v => set("extra", v));
  if (q.get("n")) $("#pbName").value = q.get("n");
  update();

  const nt = $(".nav-toggle"), ul = $("#navlist");
  nt?.addEventListener("click", () => { const o = ul.classList.toggle("open"); nt.setAttribute("aria-expanded", String(o)); });
})();
