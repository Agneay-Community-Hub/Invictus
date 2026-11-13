/**
 * GHOSTS OF EXPLORATION BRIDGE (added when this app joined the Ghosts of Exploration site; not in the original repo).
 *
 * The main site switches into this app with links such as
 *   atlas/index.html?go=site&id=tranquility-base      land at a Moon or Mars site (SURFACE_SITES / UNITY_SITES id)
 *   atlas/index.html?go=relive&id=apollo-11           relive a mission (RELIVE_SCRIPTS id: apollo-11, mer-opportunity)
 *   atlas/index.html?go=missions | journey&id=moon|mars
 * plus &from=<page to come back to>. The calls are exactly the ones this app's own Home buttons make.
 * Without ?go= it opens on the Missions window (missionsHub): no homepage, no free Solar System view. A "← Ghosts of
 * Exploration" button is always shown.
 */
import { useStore } from '../store/store'
import { useOpening, skipOpening } from '../opening/openingState'
import { leaveForSite } from '../missionControl/MissionControl'
import { missionControl, useMissionControl } from '../missionControl/missionState'
import { relive } from '../relive/player'
import { expedition } from '../expedition/expedition'
import { SITE_BY_ID, UNITY_SITE_BY_ID } from '../surface/sites'
import { RELIVE_SCRIPTS, useRelive } from '../relive/player'
import './ghosts-theme.css'

// A site id as the app knows it: Moon sites as given, Mars landing sites carry a "mars-" prefix (mars-viking-1);
// accept either form. Unknown ids return null so a bad link opens the normal app instead of an empty surface.
function siteId(raw: string): string | null {
  for (const k of [raw, `mars-${raw}`]) if (SITE_BY_ID[k] || UNITY_SITE_BY_ID[k]) return k
  return null
}

const params = new URLSearchParams(window.location.search)
const go = params.get('go')
const id = params.get('id') ?? ''

// Where the back button goes: the page that sent us here (same site only), else the main site's home page.
function backHref(): string {
  const from = params.get('from')
  if (from) {
    try {
      const u = new URL(from, window.location.href)
      if (u.origin === window.location.origin) return u.href
    } catch { /* ignore a malformed value */ }
  }
  return new URL('../index.html', window.location.href).href
}

function addBackButton() {
  const a = document.createElement('a')
  a.href = backHref()
  a.className = 'goe-back'
  a.innerHTML = '← <span class="goe-long">Ghosts of Exploration</span><span class="goe-short">Ghosts</span>'
  a.setAttribute('aria-label', 'Back to Ghosts of Exploration')
  a.title = 'Back to the Ghosts of Exploration archive'
  const style = document.createElement('style')
  style.textContent = `
    /* above the app's own bottom toolbar (time, labels, settings), centred so it clears the touch controls in the corners */
    .goe-back { position: fixed; left: 50%; bottom: calc(60px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 2147483000;
      padding: 8px 14px; min-height: 40px; display: inline-flex; align-items: center; border-radius: 999px;
      background: rgba(6,10,19,.86); color: #ffd08a; border: 1px solid rgba(255,179,71,.55); backdrop-filter: blur(8px);
      font: 700 13px/1 system-ui, -apple-system, "Segoe UI", sans-serif; text-decoration: none; box-shadow: 0 6px 20px rgba(0,0,0,.45); }
    .goe-back:hover, .goe-back:focus-visible { background: rgba(20,32,56,.95); color: #fff; }
    .goe-back { gap: 4px; } .goe-short { display: none; }
    /* Phones: the bottom holds the walking joystick, minimap and jump buttons, so use a small tab on the right edge */
    @media (max-width: 760px) {
      .goe-back { left: auto; right: 0; bottom: auto; top: 46%; transform: translateY(-50%); border-right: 0;
        border-radius: 999px 0 0 999px; padding: 8px 10px 8px 12px; min-height: 44px; }
      .goe-long { display: none; } .goe-short { display: inline; }
    }
    body[data-goe-opening] .goe-back { opacity: .6; }`
  document.head.appendChild(style)
  document.body.appendChild(a)
}

function run() {
  switch (go) {
    case 'site': { const s = siteId(id); if (s) leaveForSite(s); break }
    case 'relive': if (RELIVE_SCRIPTS[id]) relive.open(id); break
    case 'missions': missionControl.open('catalogue', { dest: 'all' }); break
    case 'journey': if (id === 'moon' || id === 'mars') expedition.start(id); break
    // 'solar' and 'tour' (old links) and anything unknown: the Missions window opens on its own (missionsHub)
  }
}

/**
 * Inside Ghosts of Exploration this app has no homepage and no free Solar System view: the Missions window is its
 * starting point. Whenever the visitor isn't at a landing site, in a replay or on an expedition, the Missions window
 * is open (Explore Planet: pick a Moon or Mars site). Closing it takes the visitor back to the main site, because there
 * is nothing behind it to use. CSS (ghosts-theme.css) hides the old homepage so it can never flash on screen.
 */
function missionsHub() {
  const idle = () => {
    const st = useStore.getState()
    return useOpening.getState().stage === 'done' && !st.surfaceSiteId && !useRelive.getState().id && !expedition.active() && st.phase !== 'travel'
  }
  let wasOpen = useMissionControl.getState().open
  let pendingClose = false
  let reopen = 0
  const check = () => {
    const open = useMissionControl.getState().open
    if (wasOpen && !open) {
      // the window just closed: by the visitor (go back), or because they picked a site, replay or expedition
      wasOpen = false
      pendingClose = true
      setTimeout(() => {
        pendingClose = false
        if (idle() && !useMissionControl.getState().open) window.location.href = backHref()
      }, 400)
      return
    }
    wasOpen = open
    if (open || pendingClose || !idle()) return
    // back from a site or a finished replay (or just arrived): show the Missions window again
    clearTimeout(reopen)
    reopen = window.setTimeout(() => {
      if (idle() && !useMissionControl.getState().open && !pendingClose) {
        if (useStore.getState().phase === 'intro') useStore.getState().set({ phase: 'explore' }) // not the homepage
        missionControl.open('explore', { dest: 'all' }); wasOpen = true
      }
    }, 300)
  }
  useStore.subscribe(check)
  useOpening.subscribe(check)
  useRelive.subscribe(check)
  useMissionControl.subscribe(check)
  check()
}

export function initGhostsBridge() {
  // the main site's fonts, used by the restyled Missions window (ghosts-theme.css)
  const fonts = document.createElement('link')
  fonts.rel = 'stylesheet'
  fonts.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Space+Grotesk:wght@500;600;700&display=swap'
  document.head.appendChild(fonts)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addBackButton, { once: true })
  else addBackButton()
  // Every visit skips the opening flight (it ends on the homepage, which this site doesn't show).
  try { window.localStorage.setItem('abnf.opening.seen', '1') } catch { /* private mode */ }
  let done = false
  const start = () => { if (done) return; done = true; setTimeout(() => { if (go) run(); missionsHub() }, 250) }
  const check = () => { if (useOpening.getState().stage === 'done') start() }
  const unsub = useOpening.subscribe(() => { check(); if (done) unsub() })
  check()
  // If the opening has not handed over after a few seconds (slow device), skip it ourselves.
  setTimeout(() => { if (!done) { skipOpening(); start(); unsub() } }, 6000)
}
