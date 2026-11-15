/**
 * GHOSTS OF EXPLORATION BRIDGE (added when this app joined the Ghosts of Exploration site; not in the original repo).
 *
 * The main site switches into this app with links such as
 *   atlas/index.html?go=site&id=tranquility-base      land at a Moon or Mars site (SURFACE_SITES / UNITY_SITES id)
 *   atlas/index.html?go=relive&id=apollo-11           relive a mission (RELIVE_SCRIPTS id: apollo-11, mer-opportunity, cassini, juno, parker-solar-probe)
 *   atlas/index.html?go=missions | journey&id=moon|mars
 * plus &from=<page to come back to>. The calls are exactly the ones this app's own Home buttons make.
 * It is used as a player (playerOnly): one landing site or replay at a time, then back to the main site. A
 * "← Home" button is always shown (it returns to the main-site page you came from).
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
  return new URL('../landings.html', window.location.href).href
}

function addBackButton() {
  const a = document.createElement('a')
  a.href = backHref()
  a.className = 'goe-back'
  a.innerHTML = '← <span>Home</span>'
  a.setAttribute('aria-label', 'Home: back to Ghosts of Exploration')
  a.title = 'Back to the Ghosts of Exploration site'
  const style = document.createElement('style')
  style.textContent = `
    /* above the app's own bottom toolbar (time, labels, settings), centred so it clears the touch controls in the corners */
    .goe-back { position: fixed; left: 50%; bottom: calc(60px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 2147483000;
      padding: 8px 14px; min-height: 40px; display: inline-flex; align-items: center; border-radius: 999px;
      background: rgba(6,10,19,.86); color: #ffd08a; border: 1px solid rgba(255,179,71,.55); backdrop-filter: blur(8px);
      font: 700 13px/1 system-ui, -apple-system, "Segoe UI", sans-serif; text-decoration: none; box-shadow: 0 6px 20px rgba(0,0,0,.45); }
    .goe-back:hover, .goe-back:focus-visible { background: rgba(20,32,56,.95); color: #fff; }
    .goe-back { gap: 4px; }
    /* Phones: the bottom holds the walking joystick, minimap and jump buttons, so use a small tab on the right edge */
    @media (max-width: 760px) {
      .goe-back { left: auto; right: 0; bottom: auto; top: 46%; transform: translateY(-50%); border-right: 0;
        border-radius: 999px 0 0 999px; padding: 8px 10px 8px 12px; min-height: 44px; }
    }
    body[data-goe-opening] .goe-back { opacity: .6; }`
  document.head.appendChild(style)
  document.body.appendChild(a)
}

function run() {
  switch (go) {
    case 'site': { const s = siteId(id); if (s) leaveForSite(s); break }
    case 'relive': if (RELIVE_SCRIPTS[id]) relive.open(id); break
    case 'missions': useStore.getState().set({ phase: 'explore' }); missionControl.open('relive', { dest: 'all' }); break
    case 'journey': if (id === 'moon' || id === 'mars') expedition.start(id); break
    // 'solar', 'tour' (old links) or nothing: there is nothing to show, so playerOnly() returns to the main site
  }
}

/**
 * Inside Ghosts of Exploration this app is a player: the main site lists every landing site (landings.html) and mission
 * (catalogue.html) and opens one simulation at a time. So there is no homepage, no free Solar System view, and the
 * Missions window keeps only Relive and Discovered (Explore Planet and Mission Catalogue live on the main site).
 * Whenever the visitor is not at a landing site, in a replay or on an expedition (they left the site, a replay ended,
 * or they closed the Missions window), the app returns to the page they came from.
 */
function playerOnly() {
  const idle = () => {
    const st = useStore.getState()
    return useOpening.getState().stage === 'done' && !st.surfaceSiteId && !useRelive.getState().id && !expedition.active() && st.phase !== 'travel'
  }
  let timer = 0
  const check = () => {
    const mc = useMissionControl.getState()
    // the two tabs that moved to the main site
    if (mc.tab === 'explore' || mc.tab === 'catalogue') mc.set({ tab: 'relive' })
    if (mc.open || !idle()) { clearTimeout(timer); timer = 0; return }
    // a moment's grace: picking a site or replay closes the window just before it starts
    if (!timer) timer = window.setTimeout(() => { timer = 0; if (idle() && !useMissionControl.getState().open) window.location.href = backHref() }, 500)
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
  const start = () => { if (done) return; done = true; setTimeout(() => { if (go) run(); playerOnly() }, 250) }
  const check = () => { if (useOpening.getState().stage === 'done') start() }
  const unsub = useOpening.subscribe(() => { check(); if (done) unsub() })
  check()
  // If the opening has not handed over after a few seconds (slow device), skip it ourselves.
  setTimeout(() => { if (!done) { skipOpening(); start(); unsub() } }, 6000)
}
