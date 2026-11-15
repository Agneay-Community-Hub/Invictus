/**
 * Playback pacing for the long robotic missions (Parker, Juno, Cassini): years of flight in a few minutes, but every
 * encounter slowed down enough to SEE it — the planet growing, the closest approach, the departure. (The first
 * version spent ~1 s on each flyby, so the planets were never seen close.)
 */
import type { Segment } from '../types'

export interface Beat { a: number; b: number; play: number }

const DAY = 86400

/**
 * An encounter around its closest approach `t`: the approach (`before` seconds), the close pass (±`core`) and the
 * departure (`after`), each with its own playback length in seconds.
 */
export const encounter = (t: number, before: number, after: number, play: [number, number, number], core = 1200): Beat[] => [
  { a: t - before, b: t - core, play: play[0] },
  { a: t - core, b: t + core, play: play[1] },
  { a: t + core, b: t + after, play: play[2] },
]

/** contiguous, monotonic segments: the beats as given (overlaps clipped), the gaps between them compressed by length */
export function segments(beats: Beat[]): Segment[] {
  const focus = [...beats].sort((x, y) => x.a - y.a)
  const segs: Segment[] = []
  let t = focus[0].a
  for (const f of focus) {
    const a = Math.max(t, f.a)
    if (f.b <= a) continue
    if (a > t) segs.push({ t0: t, t1: a, play: Math.max(4, Math.min(12, 2.2 * Math.log2(1 + (a - t) / DAY))) })
    const share = (f.b - a) / (f.b - f.a)
    segs.push({ t0: a, t1: f.b, play: Math.max(0.5, f.play * share) })
    t = f.b
  }
  return segs
}
