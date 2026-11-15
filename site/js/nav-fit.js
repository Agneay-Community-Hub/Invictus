/* ===========================================================
   Every page's top bar: if the full menu doesn't fit on one line
   (narrow window, browser zoom, longer Spanish/Hindi labels), mark
   the bar "nav-compact" so the links fold into the ☰ button.
   Each page's own script opens the menu; this only measures.
   =========================================================== */
(() => {
  const bar = document.querySelector(".topbar");
  if (!bar || !bar.querySelector(".mainnav")) return;
  const ul = document.getElementById("navlist"), t = bar.querySelector(".nav-toggle");
  const fit = () => {
    bar.classList.remove("nav-compact");
    if (bar.scrollWidth > bar.clientWidth + 1) bar.classList.add("nav-compact");
    else if (ul && ul.classList.contains("open")) { ul.classList.remove("open"); t?.setAttribute("aria-expanded", "false"); }
  };
  let timer = 0;
  const refit = () => { clearTimeout(timer); timer = setTimeout(fit, 60); };
  fit();
  addEventListener("resize", refit);
  addEventListener("load", refit);
  document.fonts?.ready.then(refit);
  // choosing a link closes the drop-down
  ul?.addEventListener("click", e => { if (e.target.closest("a")) { ul.classList.remove("open"); t?.setAttribute("aria-expanded", "false"); } });
})();
