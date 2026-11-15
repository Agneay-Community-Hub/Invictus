/**
 * The mission trajectory files (frontend/public/missions/<id>/trajectory.json, written by
 * scripts/missions/fetch_horizons.py from JPL Horizons). The SAME cubic-Hermite interpolation as the Unity player
 * (MissionData.cs), so the HUD and the 3-D scene agree to the metre.
 */
export interface TrajectoryFile {
  mission: string
  title: string
  source: string
  retrieved: string
  frame: string
  units: string
  bodies: Record<string, number[][]>
  windows: { kind: string; from: string; to: string; step: string; samples: number }[]
}

export interface State { pos: [number, number, number]; vel: [number, number, number] }

export class Track {
  readonly t: Float64Array
  readonly s: Float64Array
  constructor(rows: number[][]) {
    this.t = new Float64Array(rows.length)
    this.s = new Float64Array(rows.length * 6)
    rows.forEach((r, i) => { this.t[i] = r[0]; for (let k = 0; k < 6; k++) this.s[i * 6 + k] = r[1 + k] })
  }
  get start() { return this.t[0] }
  get end() { return this.t[this.t.length - 1] }

  at(ms: number): State {
    const t = this.t, s = this.s, n = t.length
    ms = Math.max(t[0], Math.min(t[n - 1], ms))
    let lo = 0, hi = n - 1
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t[m] <= ms) lo = m; else hi = m }
    const h = (t[hi] - t[lo]) / 1000
    const u = h > 0 ? (ms - t[lo]) / 1000 / h : 0
    const u2 = u * u, u3 = u2 * u
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2
    const d00 = (6 * u2 - 6 * u) / h, d10 = 3 * u2 - 4 * u + 1, d01 = (-6 * u2 + 6 * u) / h, d11 = 3 * u2 - 2 * u
    const a = lo * 6, b = hi * 6
    const P = (k: number) => h00 * s[a + k] + h10 * h * s[a + 3 + k] + h01 * s[b + k] + h11 * h * s[b + 3 + k]
    const V = (k: number) => d00 * s[a + k] + d10 * s[a + 3 + k] + d01 * s[b + k] + d11 * s[b + 3 + k]
    return { pos: [P(0), P(1), P(2)], vel: [V(0), V(1), V(2)] }
  }
}

export const len = (v: [number, number, number]) => Math.hypot(v[0], v[1], v[2])
export const C_KMS = 299792.458
export const AU_KM = 149597870.7

const cache = new Map<string, Promise<{ file: TrajectoryFile; tracks: Record<string, Track> }>>()
export function loadTrajectory(url: string) {
  let p = cache.get(url)
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
      return r.json() as Promise<TrajectoryFile>
    }).then((file) => ({ file, tracks: Object.fromEntries(Object.entries(file.bodies).map(([k, rows]) => [k, new Track(rows)])) }))
    p.catch(() => cache.delete(url))
    cache.set(url, p)
  }
  return p
}
