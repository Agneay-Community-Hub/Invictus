/**
 * Scientific validation of the Juno experience: the JPL Horizons trajectory it plays
 * (public/missions/juno/trajectory.json) and the script's event times, against JPL's event list and NASA's pages.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Track, len, type TrajectoryFile } from './trajectory'
import { JUNO } from '../relive/scripts/juno'

let file: TrajectoryFile, helio: Track, jov: Track, T: Record<string, Track>
beforeAll(async () => {
  const fs: { readFileSync(p: URL, enc: string): string } = await import(/* @vite-ignore */ 'node:' + 'fs')
  file = JSON.parse(fs.readFileSync(new URL('../../public/missions/juno/trajectory.json', import.meta.url), 'utf8'))
  T = Object.fromEntries(Object.entries(file.bodies).map(([k, v]) => [k, new Track(v)]))
  helio = T.spacecraft
  jov = T['spacecraft-jupiter']
})
const D = (s: string) => Date.parse(s)
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const dist = (a: Track, b: Track) => (ms: number) => { const p = a.at(ms).pos, q = b.at(ms).pos; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) }
function minimum(f: (ms: number) => number, a: number, b: number, step = 60_000) {
  let best = a, bv = Infinity
  for (let t = a; t <= b; t += step) { const v = f(t); if (v < bv) { bv = v; best = t } }
  let lo = best - step, hi = best + step
  for (let k = 0; k < 60; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1 }
  return { t: (lo + hi) / 2, v: f((lo + hi) / 2) }
}
const R_JUP = 71492

describe('Juno: JPL Horizons trajectory vs NASA / JPL', () => {
  it('two frames: heliocentric cruise, then Jupiter-centred from June 2016', () => {
    expect((file as unknown as { frames: Record<string, string> }).frames['spacecraft-jupiter']).toBe('500@599')
    expect(day(jov.start)).toBe('2016-06-20')
    expect(jov.end).toBeGreaterThan(D('2026-09-20'))
  })

  it('Earth flyby: Oct 9, 2013 19:21:25 UTC, 558.8 km (JPL event list) — within a minute and a few km', () => {
    const m = minimum(dist(helio, T.earth), D('2013-10-09T17:00:00Z'), D('2013-10-09T22:00:00Z'), 10_000)
    expect(Math.abs(m.t - D('2013-10-09T19:21:25Z'))).toBeLessThan(60_000)
    expect(Math.abs(m.v - 6378.137 - 558.8)).toBeLessThan(15)
  })

  it('Ganymede flyby June 7, 2021: 1,038 km from the surface (JPL event list)', () => {
    const m = minimum(dist(jov, T.ganymede), D('2021-06-07T00:00:00Z'), D('2021-06-08T00:00:00Z'), 10_000)
    expect(day(m.t)).toBe('2021-06-07')
    expect(Math.abs(m.v - 2634.1 - 1038)).toBeLessThan(20)
  })

  it('Europa (Sept 29, 2022) and Io (Dec 30, 2023; Feb 3, 2024) flybys on NASA’s dates', () => {
    for (const [moon, d] of [['europa', '2022-09-29'], ['io', '2023-12-30'], ['io', '2024-02-03']] as const) {
      const m = minimum(dist(jov, T[moon]), D(d) - 12 * 3600e3, D(d) + 36 * 3600e3, 10_000)
      expect(day(m.t), `${moon} ${d}`).toBe(d)
    }
  })

  it('perijove numbering matches NASA (JOI = PJ0; PJ34 June 2021, PJ45 Sept 2022, PJ57 Dec 2023, PJ58 Feb 2024)', () => {
    const per: number[] = []
    let prev = Infinity, falling = false
    for (let t = jov.start; t < jov.end; t += 10 * 60_000) {
      const r = len(jov.at(t).pos)
      if (r > prev && falling && prev < 3 * R_JUP) per.push(t)
      falling = r < prev
      prev = r
    }
    expect(day(per[0])).toBe('2016-07-05')
    expect(day(per[34])).toBe('2021-06-08')
    expect(day(per[45])).toBe('2022-09-29')
    expect(day(per[57])).toBe('2023-12-30')
    expect(day(per[58])).toBe('2024-02-03')
  })

  it('every flyby and perijove card is within 5 minutes of the trajectory’s closest point', () => {
    const moonFor: Record<string, string> = { ganymede: 'ganymede', europa: 'europa', 'io-1': 'io', 'io-2': 'io' }
    for (const e of JUNO.events.filter((x) => x.basis === 'derived')) {
      const ms = JUNO.epochMs + e.t * 1000
      const f = moonFor[e.id] ? dist(jov, T[moonFor[e.id]]) : (x: number) => len(jov.at(x).pos)
      const m = minimum(f, ms - 3 * 3600e3, ms + 3 * 3600e3, 20_000)
      expect(Math.abs(m.t - ms) / 60000, e.id).toBeLessThan(5)
    }
  })
})
