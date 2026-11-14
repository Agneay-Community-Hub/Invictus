// Back button on every inner page. Goes to the page you came from when that page is on this site
// (so a scroll position or open filters are kept); otherwise follows its link to the right part of the home page.
(() => {
  const sameSite = () => {
    try { return document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1; }
    catch { return false; }
  };
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-back]");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (sameSite()) { e.preventDefault(); history.back(); }
  });
})();
