/**
 * Scientific validation of the Parker Solar Probe experience: the JPL Horizons trajectory it plays
 * (public/missions/parker/trajectory.json) and the script's event times, checked against NASA's published facts.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Track, len, C_KMS, type TrajectoryFile } from './trajectory'
import { PARKER } from '../relive/scripts/parker'

let file: TrajectoryFile, sc: Track, venus: Track
beforeAll(async () => {
  // node's fs, loaded untyped so the browser-only tsconfig needs no @types/node (as realism/records.test.ts)
  const fs: { readFileSync(p: URL, enc: string): string } = await import(/* @vite-ignore */ 'node:' + 'fs')
  file = JSON.parse(fs.readFileSync(new URL('../../public/missions/parker/trajectory.json', import.meta.url), 'utf8'))
  sc = new Track(file.bodies.spacecraft)
  venus = new Track(file.bodies.venus)
})
const R_SUN = 695700, MILE = 1.609344, R_VENUS = 6051.8
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** local minimum of f in [a, b] (ms) by scanning then golden-section refinement */
function minimum(f: (ms: number) => number, a: number, b: number) {
  let best = a, bv = Infinity
  for (let t = a; t <= b; t += 60_000 * 10) { const v = f(t); if (v < bv) { bv = v; best = t } }
  let lo = best - 600_000, hi = best + 600_000
  for (let k = 0; k < 60; k++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3
    if (f(m1) < f(m2)) hi = m2; else lo = m1
  }
  return { t: (lo + hi) / 2, v: f((lo + hi) / 2) }
}
const rSun = (ms: number) => len(sc.at(ms).pos)
const D = (s: string) => Date.parse(s)

describe('Parker Solar Probe: JPL Horizons trajectory vs NASA', () => {
  it('the file is JPL Horizons, ecliptic J2000, and covers launch day to Sept 2026', () => {
    expect(file.source).toMatch(/JPL Horizons/)
    expect(file.frame).toMatch(/ecliptic/)
    expect(day(sc.start)).toBe('2018-08-12')
    expect(sc.end).toBeGreaterThan(D('2026-09-20'))
  })

  it('Dec. 24, 2024: about 3.8 million miles from the surface at about 430,000 mph (NASA) — 0.064 % of light speed', () => {
    const p = minimum(rSun, D('2024-12-23'), D('2024-12-26'))
    expect(day(p.t)).toBe('2024-12-24')
    const miles = (p.v - R_SUN) / MILE
    expect(miles / 3.8e6).toBeGreaterThan(0.97)
    expect(miles / 3.8e6).toBeLessThan(1.03)
    const v = len(sc.at(p.t).vel)
    const mph = v * 3600 / MILE
    expect(mph / 430000).toBeGreaterThan(0.97)
    expect(mph / 430000).toBeLessThan(1.03)
    const pctC = (v / C_KMS) * 100
    expect(pctC).toBeGreaterThan(0.060)
    expect(pctC).toBeLessThan(0.066) // NOT 6 %
  })

  it('seven Venus flybys on NASA’s dates, each within a few thousand km of Venus', () => {
    const dates = ['2018-10-03', '2019-12-26', '2020-07-11', '2021-02-20', '2021-10-16', '2023-08-21', '2024-11-06']
    for (const d of dates) {
      const t0 = D(d) - 86400e3, t1 = D(d) + 2 * 86400e3
      const m = minimum((ms) => { const a = sc.at(ms).pos, b = venus.at(ms).pos; return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) }, t0, t1)
      expect(day(m.t), d).toBe(d)
      expect(m.v - R_VENUS, d).toBeLessThan(5000)
      expect(m.v - R_VENUS, d).toBeGreaterThan(100)
    }
  })

  it('the seventh Venus flyby: within 233 miles (376 km) of the surface (NASA)', () => {
    const m = minimum((ms) => { const a = sc.at(ms).pos, b = venus.at(ms).pos; return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) }, D('2024-11-06T12:00:00Z'), D('2024-11-07T00:00:00Z'))
    expect(Math.abs(m.v - R_VENUS - 376)).toBeLessThan(10)
  })

  it('April 28, 2021: Parker reaches 18.8 solar radii (the first corona crossing, NASA) that day', () => {
    let t = D('2021-04-27')
    while (rSun(t) / R_SUN > 18.8 && t < D('2021-04-30')) t += 60_000
    expect(day(t)).toBe('2021-04-28')
  })

  it('the 29th close approach is on Sept. 4, 2026 (NASA), again within 3.8 million miles', () => {
    const p = minimum(rSun, D('2026-09-03'), D('2026-09-06'))
    expect(day(p.t)).toBe('2026-09-04')
    expect((p.v - R_SUN) / MILE).toBeLessThan(3.86e6)
  })

  it('every perihelion and flyby card is placed within 20 minutes of the trajectory’s closest point', () => {
    for (const e of PARKER.events.filter((x) => x.kind === 'perihelion' || x.kind === 'flyby')) {
      const ms = PARKER.epochMs + e.t * 1000
      const f = e.kind === 'perihelion' ? rSun : (x: number) => { const a = sc.at(x).pos, b = venus.at(x).pos; return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) }
      const m = minimum(f, ms - 6 * 3600e3, ms + 6 * 3600e3)
      expect(Math.abs(m.t - ms) / 60000, e.id).toBeLessThan(20)
    }
  })
})
