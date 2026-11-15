/**
 * Scientific validation of the Cassini-Huygens experience: the JPL Horizons trajectories it plays
 * (public/missions/cassini/trajectory.json) and the script's times, against NASA's published facts.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Track, len, type TrajectoryFile } from './trajectory'
import { CASSINI } from '../relive/scripts/cassini'

let T: Record<string, Track>
beforeAll(async () => {
  const fs: { readFileSync(p: URL, enc: string): string } = await import(/* @vite-ignore */ 'node:' + 'fs')
  const file = JSON.parse(fs.readFileSync(new URL('../../public/missions/cassini/trajectory.json', import.meta.url), 'utf8')) as TrajectoryFile
  T = Object.fromEntries(Object.entries(file.bodies).map(([k, v]) => [k, new Track(v)]))
})
const D = (s: string) => Date.parse(s)
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const R_SAT = 60268
const dist = (a: Track, b: Track) => (ms: number) => { const p = a.at(ms).pos, q = b.at(ms).pos; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) }
function minimum(f: (ms: number) => number, a: number, b: number, step = 60_000) {
  let best = a, bv = Infinity
  for (let t = a; t <= b; t += step) { const v = f(t); if (v < bv) { bv = v; best = t } }
  let lo = best - step, hi = best + step
  for (let k = 0; k < 60; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1 }
  return { t: (lo + hi) / 2, v: f((lo + hi) / 2) }
}
function periapses(tr: Track, from: number, to: number) {
  const out: number[] = []
  // start from a real sample (no artificial 'falling' state), so the scan's first step is never counted
  let prev = len(tr.at(from).pos), falling = false
  for (let t = from + 5 * 60_000; t < to; t += 5 * 60_000) {
    const r = len(tr.at(t).pos)
    // a real periapsis is days from the last one (Cassini's shortest orbits took ~6 days); interpolation ripples are not
    if (r > prev && falling && (!out.length || t - out[out.length - 1] > 2 * 86400e3)) out.push(t - 5 * 60_000)
    falling = r < prev
    prev = r
  }
  return out
}

describe('Cassini-Huygens: JPL Horizons trajectory vs NASA', () => {
  it('294 Saturn orbits (NASA quick facts): one periapsis per orbit from orbit insertion to the end', () => {
    expect(periapses(T['spacecraft-saturn'], D('2004-06-25'), D('2017-09-15T10:30:00Z')).length).toBe(294)
  })

  it('22 Grand Finale dives, the first on April 26, 2017 (NASA), the lowest ~1,600 km above the clouds', () => {
    const fin = periapses(T['spacecraft-saturn'], D('2017-04-23'), D('2017-09-15T00:00:00Z'))
    expect(fin.length).toBe(22)
    expect(day(fin[0])).toBe('2017-04-26')
    const lowest = Math.min(...fin.map((t) => len(T['spacecraft-saturn'].at(t).pos) - R_SAT))
    expect(lowest).toBeGreaterThan(1500)
    expect(lowest).toBeLessThan(4000)
  })

  it('Saturn orbit insertion: about 20,000 km above the cloud tops on July 1, 2004 UTC', () => {
    const m = minimum((t) => len(T['spacecraft-saturn'].at(t).pos), D('2004-06-30'), D('2004-07-02'))
    expect(day(m.t)).toBe('2004-07-01')
    expect(m.v - R_SAT).toBeGreaterThan(18000)
    expect(m.v - R_SAT).toBeLessThan(22000)
  })

  it('Oct. 2008: about 16 miles (25 km) from Enceladus (NASA timeline)', () => {
    const m = minimum(dist(T['spacecraft-saturn'], T.enceladus), D('2008-10-09T12:00:00Z'), D('2008-10-10T00:00:00Z'), 10_000)
    expect(Math.abs(m.v - 252.1 - 25)).toBeLessThan(6)
  })

  it('the 127th and final Titan flyby: about 608 miles (979 km) on April 22, 2017', () => {
    const m = minimum(dist(T['spacecraft-saturn'], T.titan), D('2017-04-21T12:00:00Z'), D('2017-04-23'), 10_000)
    expect(day(m.t)).toBe('2017-04-22')
    expect(Math.abs(m.v - 2574.7 - 979)).toBeLessThan(25)
  })

  it('Huygens (Horizons -150, predicted): from ~3,250 km above Titan down to the surface around NASA’s 11:38:11 UT landing', () => {
    const hu = T.huygens
    expect(len(hu.at(D('2005-01-14T09:00:00Z')).pos) - 2574.7).toBeGreaterThan(3000)
    expect(len(hu.at(D('2005-01-14T11:38:11Z')).pos) - 2574.7).toBeLessThan(5)
  })

  it('every trajectory-derived card is within 5 minutes of the trajectory’s closest point', () => {
    const target: Record<string, string> = { 'venus-1': 'venus', 'venus-2': 'venus', earth: 'earth', 'enceladus-plume': 'enceladus', 'plume-sample': 'enceladus', e5: 'enceladus', e21: 'enceladus', 'titan-lakes': 'titan', 'titan-final': 'titan' }
    for (const e of CASSINI.events.filter((x) => x.basis === 'derived' && x.id !== 'jupiter')) {
      const ms = CASSINI.epochMs + e.t * 1000
      const sat = ms >= D('2004-06-25')
      const sc = sat ? T['spacecraft-saturn'] : T.spacecraft
      const f = target[e.id] ? dist(sc, T[target[e.id]]) : (x: number) => len(sc.at(x).pos)
      const m = minimum(f, ms - 3 * 3600e3, ms + 3 * 3600e3, 20_000)
      expect(Math.abs(m.t - ms) / 60000, e.id).toBeLessThan(5)
    }
  })
})
