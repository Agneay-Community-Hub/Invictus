/**
 * The 3-D view of a Unity mission replay (Parker, Juno, Cassini-Huygens): the MissionsExplorer player plus what the
 * web draws over it — loading and error states, the trajectory read-out (JPL Horizons), the spacecraft inspection
 * panel with on-model labels, and the overlay switches. Mounted by ReliveMission instead of ReliveScene.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { clock } from '../relive/player'
import type { InstrumentDef, MissionScript } from '../relive/types'
import { useViewGestures } from '../mars/viewGestures'
import { OVERLAY, addPointer, sendTap, startMission, stopMission, useMission3d } from './bridge'
import { AU_KM, C_KMS, len, loadTrajectory, type Track } from './trajectory'
import { citeGroups } from '../missions'
import './missions3d.css'

const KMH = 3600, MPH = 2236.936
// one cached formatter per precision (toLocaleString builds a new Intl formatter on every call: measurable at 4 Hz)
const FMT = new Map<number, Intl.NumberFormat>()
const fmt = (n: number, d = 0) => {
  let f = FMT.get(d)
  if (!f) FMT.set(d, (f = new Intl.NumberFormat('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })))
  return f.format(n)
}

/** a re-render at `ms` intervals (the replay clock is not React state) */
function useTick(ms: number) {
  const [, tick] = useState(0)
  useEffect(() => { const id = window.setInterval(() => tick((x) => x + 1), ms); return () => window.clearInterval(id) }, [ms])
}

/**
 * The launch, in NASA's own photographs: shown full-screen from the countdown to the climb, cross-fading with a slow
 * push-in, each captioned with what it shows, its date and NASA's credit. Then the replay continues in space.
 */
function LaunchFilm({ script }: { script: MissionScript }) {
  useTick(200)
  const L = script.unity!.launch
  if (!L) return null
  const met = clock.t
  if (met >= L.padSeconds) return null
  let k = 0
  for (let i = 0; i < L.photos.length; i++) if (L.photos[i].from <= met) k = i
  const fade = Math.max(0, Math.min(1, (L.padSeconds - met) / 6)) // fades into space over the last ~6 s
  const p = L.photos[k]
  return (
    <div className="m3d-film" style={{ opacity: fade }} data-testid="m3d-launch-film" aria-label="NASA photographs of the launch">
      {L.photos.map((ph, i) => (
        <img key={ph.nasaId} src={ph.src} alt={ph.title} className={i === k ? 'on' : ''} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
      ))}
      <figcaption className="m3d-film-cap" data-testid="m3d-launch-caption">
        <b>{p.title}</b>
        <span>{p.date} · Photo: {p.credit} · {p.nasaId}</span>
      </figcaption>
    </div>
  )
}

/**
 * Names on the bodies (Sun, planets, moons) and on the spacecraft in the overview: at these distances most bodies are a
 * few pixels across, so a body smaller than ~1 % of the view gets a ring as well as its name.
 */
function BodyLabels({ title }: { title: string }) {
  const F = useMission3d((s) => s.frame)
  if (!F?.bodies) return null
  const placed: [number, number][] = []
  const items = F.bodies
    .filter(([, x, y, front]) => front && x > -0.02 && x < 1.02 && y > -0.02 && y < 1.02)
    .sort((a, b) => b[4] - a[4])
    .filter(([, x, y, , r]) => {
      if (r < 0.012 && placed.some(([px, py]) => Math.abs(px - x) < 0.07 && Math.abs(py - y) < 0.035)) return false
      placed.push([x, y])
      return true
    })
  return (
    <div className="m3d-bodies" aria-hidden data-testid="m3d-body-labels">
      {items.map(([name, x, y, , r]) => {
        const small = r < 0.012
        const top = small ? y : Math.max(0.03, y - Math.min(r, 0.45) * 0.9)
        return (
          <span key={name} className={`m3d-body${small ? ' small' : ''}`} style={{ left: `${x * 100}%`, top: `${top * 100}%` }}>
            {small && <i />}{name}
          </span>
        )
      })}
      {F.top && F.visible && (
        <span className="m3d-body craft" style={{ left: `${F.sx * 100}%`, top: `${F.sy * 100}%` }}><i />{title}</span>
      )}
    </div>
  )
}

function Readout({ script, spin }: { script: MissionScript; spin?: number }) {
  const cfg = script.unity!
  const [tracks, setTracks] = useState<Record<string, Track> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [, tick] = useState(0)
  const [more, setMoreState] = useState(() => { try { return localStorage.getItem('abnf.m3d.readout') === 'more' } catch { return false } })
  const setMore = (v: boolean) => { setMoreState(v); try { localStorage.setItem('abnf.m3d.readout', v ? 'more' : 'less') } catch { /* private mode */ } }
  useEffect(() => {
    let live = true
    loadTrajectory(cfg.trajectory).then((d) => { if (live) setTracks(d.tracks) }).catch((e) => live && setErr(String(e.message ?? e)))
    const id = window.setInterval(() => tick((x) => x + 1), 250)
    return () => { live = false; window.clearInterval(id) }
  }, [cfg.trajectory])
  if (err) return null
  if (!tracks) return null
  const ms = script.epochMs + clock.t * 1000
  const fr = [...(cfg.frames ?? [])].reverse().find((f) => ms >= f.fromMs)
  const track = tracks[fr?.track ?? 'spacecraft']
  const centre = fr?.centre ?? cfg.centre
  if (!track) return null
  const inRange = ms >= track.start && ms <= track.end
  const L = cfg.launch
  const met = (ms - script.epochMs) / 1000
  if (L && met < L.padSeconds) {
    const tt = Math.abs(Math.round(met)), mm = Math.floor(tt / 60), ss = String(tt % 60).padStart(2, '0')
    return (
      <section className="relive-tele glass m3d-readout" aria-label="Launch" data-testid="m3d-readout" data-relive-reserve
        title="The launch is shown in NASA's photographs; the trajectory read-out starts once Horizons has the spacecraft.">
        <dl>
          <div><dt>{met < 0 ? 'Countdown' : 'Since liftoff'}</dt><dd data-testid="m3d-launch-clock">T{met < 0 ? '−' : '+'}{mm}:{ss}</dd></div>
          <div><dt>Vehicle</dt><dd>{L.name}</dd></div>
          <div><dt>Site</dt><dd><small>{L.site}</small></dd></div>
        </dl>
        <div className="m3d-ro-foot"><span className="m3d-src">NASA photographs of the launch · no altitude shown</span></div>
      </section>
    )
  }
  const st = track.at(ms)
  const rKm = len(st.pos), v = len(st.vel)
  const R = centre.radiusKm
  const solar = centre.name === 'Sun'
  const above = solar ? `${fmt((rKm - R) / 1e6, 2)} million km` : rKm - R < 1e6 ? `${fmt(rKm - R)} km` : `${fmt((rKm - R) / 1e6, 2)} million km`
  const aboveMi = solar ? `${fmt((rKm - R) / 1.609344e6, 2)} million miles` : `${fmt((rKm - R) / 1.609344)} miles`
  const surface = solar ? 'the visible surface' : `the ${('surface' in centre && typeof centre.surface === 'string' ? centre.surface : 'surface')}`
  return (
    // Layer B of the Relive screen: the live parameters, in the shared telemetry slot (top-left) — never where the story
    // cards go. Compact by default; the rest behind "More".
    <section className="relive-tele glass m3d-readout" aria-label="Trajectory values" data-testid="m3d-readout" data-relive-reserve data-open={more ? 'on' : undefined}
      title={`Computed from the JPL Horizons trajectory (${script.unity!.mission}: the navigation team's solution), interpolated between samples. Not telemetry.`}>
      {!inRange && <div className="m3d-ro-note">Before the first trajectory sample</div>}
      <dl>
        <div><dt>Above {surface}</dt><dd data-testid="m3d-above">{above} <small>({aboveMi})</small></dd></div>
        <div><dt>Speed {solar ? 'around the Sun' : `relative to ${centre.name}`}</dt><dd data-testid="m3d-speed">{fmt(v, 1)} km/s <small>· {fmt(v * MPH)} mph</small></dd></div>
        {spin != null && <div><dt>Spin</dt><dd>{spin} rpm <small>(documented rate, at real speed)</small></dd></div>}
        {more && <>
          <div><dt>From {centre.name === 'Sun' ? 'the Sun' : centre.name}’s centre</dt><dd data-testid="m3d-dist">{rKm < 1e6 ? `${fmt(rKm)} km` : `${fmt(rKm / 1e6, 2)} million km`} <small>· {solar ? `${fmt(rKm / R, 1)} solar radii · ${fmt(rKm / AU_KM, 3)} AU` : `${fmt(rKm / R, 2)} ${centre.name} radii`}</small></dd></div>
          <div><dt>Speed, other units</dt><dd>{fmt(v * KMH)} km/h <small>· {fmt((v / C_KMS) * 100, 4)} % of light speed</small></dd></div>
          {solar && <div><dt>Sunlight</dt><dd>{fmt((AU_KM / rKm) ** 2, 0)} × what Earth receives</dd></div>}
        </>}
      </dl>
      <div className="m3d-ro-foot">
        <span className="m3d-src">JPL Horizons trajectory · not telemetry</span>
        <button className="m3d-ro-more" onClick={() => setMore(!more)} aria-expanded={more} data-testid="m3d-readout-more">{more ? 'Less ▴' : 'More ▾'}</button>
      </div>
    </section>
  )
}

/** what each line means, in the "Orbits" overview */
function OrbitLegend({ script }: { script: MissionScript }) {
  const top = useMission3d((s) => s.frame?.top)
  if (!top) return null
  const m = script.unity!.mission
  const ms = script.epochMs + clock.t * 1000
  const aroundPlanet = (script.unity!.frames ?? []).some((f) => ms >= f.fromMs)
  const body = m === 'juno' ? 'Jupiter' : m === 'cassini' ? 'Saturn' : ''
  const name = m === 'parker' ? 'Parker' : m === 'juno' ? 'Juno' : 'Cassini'
  return (
    <aside className="m3d-legend glass" aria-label="What the lines show" data-testid="m3d-legend" data-relive-reserve>
      {aroundPlanet ? (
        <>
          <span><i className="ln path" /> {name}’s orbit around {body}: 20 days back (solid), 20 days ahead (fading) — JPL Horizons</span>
          <span><i className="ln moon" /> Orbits of {m === 'juno' ? 'the Galilean moons' : 'Titan and Enceladus'} (JPL Horizons)</span>
        </>
      ) : (
        <>
          <span><i className="ln path" /> {m === 'parker' ? 'Parker’s current orbit: 90 days back (solid) and ahead (fading)' : `${name}’s path from launch to arrival`} — JPL Horizons</span>
          <span><i className="ln planet" /> Planet orbits (JPL Horizons)</span>
        </>
      )}
    </aside>
  )
}

function InstrumentCard({ def, onClose }: { def: InstrumentDef; onClose: () => void }) {
  const cites = useMemo(() => citeGroups(def.sources), [def.sources])
  return (
    <section className="m3d-inst glass" role="dialog" aria-label={def.name} data-testid="m3d-instrument-card">
      <header>
        <div>
          {def.suite && <span className="eyebrow">{def.suite}</span>}
          <h3>{def.name}</h3>
        </div>
        <button className="btn ghost sm" onClick={onClose} aria-label="Close">✕</button>
      </header>
      <p><b>What it does.</b> {def.measures}</p>
      <p><b>Where it is.</b> {def.location}</p>
      <p className={`m3d-place m3d-place-${def.placement}`}><b>{def.placement === 'approximate' ? 'Position approximate.' : def.placement === 'named-part' ? 'Named in NASA’s model.' : 'Matched on NASA’s model.'}</b> {def.placementNote}</p>
      <p className="m3d-cite">Sources: {cites.map((c) => c.label).join(' · ')}</p>
    </section>
  )
}

export function UnityMissionView({ script }: { script: MissionScript }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const M = useMission3d()
  const cfg = script.unity!
  const [panel, setPanel] = useState(false)
  const down = useRef<{ x: number; y: number; t: number } | null>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    void startMission(c, script)
    return () => { void stopMission() }
  }, [script])

  const gestures = useViewGestures((dx, dy) => addPointer(dx, dy), (z) => addPointer(0, 0, z))
  const inst = M.instrument >= 0 ? cfg.instruments[M.instrument] : null

  return (
    <div className="m3d" data-testid="m3d-view" data-status={M.status}>
      <div
        className="m3d-canvas"
        {...gestures}
        onPointerDown={(e) => { down.current = { x: e.clientX, y: e.clientY, t: performance.now() }; gestures.onPointerDown(e) }}
        onPointerUp={(e) => {
          const d = down.current
          down.current = null
          gestures.onPointerUp(e)
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6 && performance.now() - d.t < 350) {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
            sendTap((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
          }
        }}
      >
        <canvas ref={canvasRef} id="m3d-canvas" tabIndex={-1} aria-label={`${script.title}: 3-D view`} />
      </div>
      <LaunchFilm script={script} />

      {M.status === 'loading' && (
        <div className="m3d-loading glass" role="status" data-testid="m3d-loading">
          <b>Preparing the 3-D mission</b>
          <div className="m3d-bar"><i style={{ width: `${Math.round(M.progress * 100)}%` }} /></div>
          <small>{M.progress < 0.9 ? 'Downloading the Unity player' : 'Loading the spacecraft and the JPL Horizons trajectory'}</small>
        </div>
      )}
      {M.status === 'error' && (
        <div className="m3d-loading glass" role="alert" data-testid="m3d-error">
          <b>The 3-D view could not start</b>
          <small>{M.error}</small>
          <small>The timeline and the mission record below still work.</small>
        </div>
      )}

      {M.status === 'ready' && <Readout script={script} spin={M.frame?.rpm} />}
      {M.status === 'ready' && <OrbitLegend script={script} />}
      {M.status === 'ready' && !(script.unity!.launch && clock.t < script.unity!.launch.padSeconds - 4) && <BodyLabels title={script.title.split(/[ -]/)[0]} />}

      {/* labels on the model while inspecting */}
      {M.status === 'ready' && panel && M.frame?.anchors && (
        <div className="m3d-labels" aria-hidden>
          {M.frame.anchors.map(([x, y, vis], i) => vis && x > 0 && x < 1 && y > 0 && y < 1 ? (
            <button key={cfg.instruments[i]?.id ?? i} className={`m3d-label${i === M.instrument ? ' on' : ''}`} style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
              onClick={() => M.set({ instrument: i })} tabIndex={-1}>
              <i />{cfg.instruments[i]?.name.split(' — ').pop()?.split(' (')[0]}
            </button>
          ) : null)}
        </div>
      )}

      {M.status === 'ready' && (
        <div className="m3d-tools" role="toolbar" aria-label="3-D view" data-relive-reserve>
          <button className={`btn sm${panel ? ' on' : ''}`} aria-pressed={panel} onClick={() => { setPanel(!panel); if (panel) M.set({ instrument: -1 }) }} data-testid="m3d-inspect">
            🛰 Spacecraft
          </button>
          <button className={`btn sm${M.overlays & OVERLAY.orbits ? ' on' : ''}`} aria-pressed={!!(M.overlays & OVERLAY.orbits)} onClick={() => M.set({ overlays: M.overlays ^ OVERLAY.orbits })} title="Overview: the orbits from the JPL Horizons trajectory, labelled">
            ◌ Orbits
          </button>
          <button className={`btn sm${M.overlays & OVERLAY.markers ? ' on' : ''}`} aria-pressed={!!(M.overlays & OVERLAY.markers)} onClick={() => M.set({ overlays: M.overlays ^ OVERLAY.markers })} title="Markers on the planets (they are tiny at these distances)">
            ● Planets
          </button>
          {cfg.mission === 'juno' && (
            <button className={`btn sm${M.overlays & OVERLAY.field ? ' on' : ''}`} aria-pressed={!!(M.overlays & OVERLAY.field)} onClick={() => M.set({ overlays: M.overlays ^ OVERLAY.field })} title="Visualisation of a tilted dipole field: the idea of what MAG maps, not Juno's measured field; not visible light">
              ⌇ Magnetic field (visualisation)
            </button>
          )}
          {cfg.mission === 'parker' && (
            <button className={`btn sm${M.overlays & OVERLAY.wind ? ' on' : ''}`} aria-pressed={!!(M.overlays & OVERLAY.wind)} onClick={() => M.set({ overlays: M.overlays ^ OVERLAY.wind })} title="Visualisation of the solar wind's direction: not to scale, not visible light">
              ⇢ Solar wind (visualisation)
            </button>
          )}
        </div>
      )}

      {panel && M.status === 'ready' && (
        <nav className="m3d-list glass" aria-label="Parts of the spacecraft" data-testid="m3d-instrument-list">
          {cfg.instruments.map((d, i) => (
            <button key={d.id} className={`m3d-li${i === M.instrument ? ' on' : ''}`} onClick={() => M.set({ instrument: i === M.instrument ? -1 : i })} aria-pressed={i === M.instrument}>
              {d.name}{d.placement === 'approximate' && <small> · approx.</small>}
            </button>
          ))}
        </nav>
      )}
      {inst && <InstrumentCard def={inst} onClose={() => M.set({ instrument: -1 })} />}
    </div>
  )
}
