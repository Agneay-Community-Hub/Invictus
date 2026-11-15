/**
 * React ⇄ Unity bridge for the NASA robotic mission experiences (Parker, Juno, Cassini-Huygens): the MissionsExplorer
 * player. The web app owns time (the Relive clock), narration, cards and audio; Unity draws the 3-D scene.
 *
 * Every frame Unity calls window.__missionState() (MissionBridge.jslib) and gets the array below — the layout MUST
 * match MissionBridge.cs `S`. Unity reports through window.__missionEvent: 'ready', 'frame' (10 Hz: spacecraft and
 * instrument anchors on screen), 'pick' (tap on an instrument), 'error'.
 *
 * One player at a time: created when a mission replay opens, Quit() when it closes (as the Mars player).
 */
import { create } from 'zustand'
import { clock, useRelive } from '../relive/player'
import { rateAt } from '../relive/timeline'
import { live } from '../relive/scene/live'
import type { MissionScript, Shot } from '../relive/types'

const PRODUCT = 'MissionsExplorer'
const BASE = '/unity/missions/Build/'

export const SHOT_KIND: Record<Shot['kind'], number> = { chase: 0, side: 1, wide: 2, orbit: 3, top: 4, sun: 5, ground: 0, low: 0 }
export const OVERLAY = { orbits: 1, markers: 2, wind: 4, field: 8 } as const

/** the named bodies on screen: [name, x, y (viewport 0..1, y down), in front (1/0), radius (fraction of the height)] */
export type BodyOnScreen = [string, number, number, number, number]
export interface FrameReport { sx: number; sy: number; visible: boolean; r: number; fps: number; anchors?: [number, number, number][]; inst: number; rpm?: number; bodies?: BodyOnScreen[]; top?: boolean }
export interface ReadyReport { mission: string; parseMs: number; bodies: { name: string; samples: number }[]; anchors: string[]; retrieved: string }

interface Mission3d {
  status: 'idle' | 'loading' | 'ready' | 'error'
  progress: number
  error: string | null
  ready: ReadyReport | null
  frame: FrameReport | null
  build: { id: string; built: string } | null
  /** the inspected part (index into script.unity.instruments), -1 = none */
  instrument: number
  overlays: number
  /** the user took the camera: their view, not the script's shot, until they hand it back */
  freeCam: boolean
  set: (p: Partial<Mission3d>) => void
}

export const useMission3d = create<Mission3d>((set) => ({
  status: 'idle', progress: 0, error: null, ready: null, frame: null, build: null, instrument: -1, overlays: 0, freeCam: false,
  set: (p) => set(p),
}))

/** gesture accumulators, consumed by Unity once per frame */
const pointer = { dx: 0, dy: 0, zoom: 0 }
const tap = { x: -1, y: -1, seq: 0 }
export const addPointer = (dx: number, dy: number, zoom = 0) => { pointer.dx += dx; pointer.dy += dy; pointer.zoom += zoom }
export const sendTap = (x: number, y: number) => { tap.x = x; tap.y = y; tap.seq += 1 }

const QUALITY: Record<string, number> = { low: 0, medium: 1, high: 2, ultra: 2 }
let quality = 1
export const setMissionQuality = (q: string) => { quality = QUALITY[q] ?? 1 }

/** the state array Unity reads every frame (MissionBridge.cs S) */
function state(script: MissionScript): number[] {
  const t = clock.t
  const ms = script.epochMs + t * 1000
  const R = useRelive.getState()
  const M = useMission3d.getState()
  const rate = rateAt(script.segments, clock.u)
  let i = 0
  for (let k = 0; k < script.shots.length; k++) if (script.shots[k].t <= t) i = k
  let shot: Shot = script.shots[i]?.shot ?? { kind: 'chase', dist: 12 }
  // "Orbits": the labelled top-down overview of the frame the mission is in (Sun-centred, or Jupiter / Saturn)
  if (M.overlays & OVERLAY.orbits) {
    const ov = [...script.unity!.overview].reverse().find((o) => o.fromMs == null || ms >= o.fromMs) ?? { dist: 1.2 }
    shot = { kind: 'top', dist: ov.dist, elev: ov.elev ?? 60, azim: ov.azim ?? 0, fov: 45 }
    i = -1000
  }
  const out = [
    ms, rate, R.status === 'playing' ? 1 : 0,
    SHOT_KIND[shot.kind] ?? 0, shot.dist, shot.elev ?? 0, shot.azim ?? 0, shot.fov ?? 50, shot.target ?? -1,
    pointer.dx, pointer.dy, pointer.zoom,
    M.instrument, M.overlays, quality, M.freeCam ? 1 : 0, shot.lit ? 1 : 0,
    tap.x, tap.y, tap.seq, i, shot.obs ?? 0,
  ]
  pointer.dx = 0; pointer.dy = 0; pointer.zoom = 0
  return out
}

declare global {
  interface Window {
    __missionState?: () => number[]
    __missionEvent?: (kind: string, data: unknown) => void
    __missionConfig?: string
    __mission?: Record<string, unknown>
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => res()
    s.onerror = () => rej(new Error('could not load ' + src))
    document.head.appendChild(s)
  })
}

let instance: { Quit: () => Promise<void> } | null = null
let starting: Promise<unknown> | null = null
/** start / stop generations: a stop only tears down what is still current (React dev mode mounts effects twice) */
let gen = 0
let stopping: Promise<void> = Promise.resolve()

export async function startMission(canvas: HTMLCanvasElement, script: MissionScript): Promise<void> {
  const my = ++gen
  await stopping // never boot a second player on the canvas while the previous one is quitting
  if (my !== gen) return
  const S = useMission3d.getState()
  S.set({ status: 'loading', progress: 0, error: null, ready: null, frame: null, instrument: -1 })
  // Ghosts of Exploration: the app lives in a sub-folder, so tell the player the real address of its files
  // (missions/…, assets/…). (Originally: base: '/')
  window.__missionConfig = JSON.stringify({ mission: script.unity!.mission, base: new URL(import.meta.env.BASE_URL, window.location.href).href })
  window.__missionState = () => state(script)
  window.__missionEvent = (kind, data) => {
    if (kind === 'ready') useMission3d.getState().set({ status: 'ready', ready: data as ReadyReport })
    else if (kind === 'frame') {
      const f = data as FrameReport
      useMission3d.getState().set({ frame: f })
      // the event cards keep clear of the spacecraft (relive card placement reads live.subjectScreen, NDC y up)
      live.subjectScreen = { x: f.sx * 2 - 1, y: 1 - f.sy * 2, r: Math.max(0.12, Math.min(0.9, f.r * 2)) }
      live.subjectRect = null
    } else if (kind === 'pick') {
      const p = data as { index: number }
      if (p.index >= 0) useMission3d.getState().set({ instrument: p.index })
    } else if (kind === 'error') useMission3d.getState().set({ status: 'error', error: String((data as { message?: string }).message ?? data) })
  }
  try {
    const info = await fetch('/unity/missions/build-info.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    if (!info) throw new Error('The 3-D mission player is not available in this build (/unity/missions/).')
    useMission3d.getState().set({ build: { id: info.id, built: info.built } })
    const v = `?v=${info.id}`
    if (!window.createUnityInstance) await loadScript(BASE + PRODUCT + '.loader.js' + v)
    const create = window.createUnityInstance!(canvas, {
      dataUrl: BASE + PRODUCT + '.data' + v,
      frameworkUrl: BASE + PRODUCT + '.framework.js' + v,
      codeUrl: BASE + PRODUCT + '.wasm' + v,
      streamingAssetsUrl: 'StreamingAssets',
      companyName: 'Cosmic Atlas',
      productName: 'Missions',
      productVersion: info.id,
      // the player URLs carry the build id, so a cached copy is always the right one (see marsBridge.ts)
      cacheControl: (url: string) => (/\/unity\/[^?]+\?v=/.test(url) ? 'immutable' : 'no-store'),
    }, (p: number) => useMission3d.getState().set({ progress: p }))
    starting = create
    const inst = (await create) as { Quit: () => Promise<void> }
    if (starting === create) starting = null
    if (my !== gen) { await inst.Quit().catch(() => {}); return } // stopped while loading
    instance = inst
  } catch (e) {
    if (my === gen) useMission3d.getState().set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
  }
}

export function stopMission(): Promise<void> {
  const my = ++gen
  const pending = starting
  const current = instance
  instance = null
  starting = null
  stopping = (async () => {
    const target = current ?? ((await pending?.catch(() => null)) as typeof instance)
    try { await target?.Quit() } catch { /* already gone */ }
    if (my !== gen) return // a newer start owns the globals now
    delete window.__missionState
    delete window.__missionEvent
    useMission3d.getState().set({ status: 'idle', ready: null, frame: null, instrument: -1, freeCam: false })
  })()
  return stopping
}
