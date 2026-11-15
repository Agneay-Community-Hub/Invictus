/**
 * Relive Mission — the shared cinematic foundation (Milestone 1).
 *
 * A mission is a SCRIPT of data, never code: dated events with sources, the phases they fall in, the playback pacing,
 * the published telemetry values, the vehicle configuration at each moment and the camera shots. The engine
 * (player.ts) plays any script; the scene (ReliveScene.tsx) draws whatever the script says is true at mission time t.
 *
 * Honesty contract (enforced by relive.test.ts):
 *   - every event carries at least one source id that exists in missions/sources.ts;
 *   - an event's time is either 'sourced' (read from the source), 'derived' (computed from sourced values, with the
 *     rule in `timeNote`) or 'sequence' (the source gives the order but not the time: it is placed between its sourced
 *     neighbours and the UI marks it "≈ time not published");
 *   - telemetry samples are published values only; between samples the HUD says "interpolated";
 *   - anything drawn without a source (orbit geometry, terrain, proportions) is listed in the script's `illustrative`.
 */

/** seconds of mission elapsed time (MET / GET). Negative before liftoff. */
export type Met = number

export type TimeBasis = 'sourced' | 'derived' | 'sequence' | 'conceptual'

export type EventKind =
  | 'countdown' | 'ignition' | 'liftoff' | 'staging' | 'jettison' | 'cutoff' | 'burn' | 'orbit' | 'docking'
  | 'separation' | 'coast' | 'landing' | 'surface' | 'entry' | 'parachute' | 'splashdown' | 'deploy' | 'comms' | 'end' | 'discovery'
  | 'flyby' | 'perihelion'

export interface MissionEvent {
  id: string
  t: Met
  basis: TimeBasis
  /** how a derived / sequence time was obtained */
  timeNote?: string
  title: string
  /** what happened, in the source's terms (no embellishment) */
  text: string
  kind: EventKind
  sources: string[]
  /** a sound cue fired when playback crosses this event (synthesised sound design, never archival audio) */
  cue?: AudioCue
  /** a NASA recording played when playback crosses this event (labelled on the card; a sonification is data converted
   *  to sound, never sound heard in space) */
  recording?: { url: string; title: string; credit: string; kind: 'sonification' | 'recording'; sources: string[] }
  /** a NASA image from the event itself (shown on the card, credited) */
  image?: { src: string; title: string; credit: string; id: string; sources: string[] }
  // ── historical record (Relive overhaul, Milestone 3) — see timeline.ts eventRecord() for the defaults
  /** the time exactly as the source prints it ('102:45:39.90' GET, '04:55 UTC', '2003-12-10') */
  published?: string
  /** how precisely the source gives the time (never shown more precisely than this) */
  precision?: TimePrecision
  /** what the time measures */
  standard?: TimeStandard
  /** ± seconds on the absolute time: an interval known precisely whose anchor is known only to the minute */
  uncertaintyS?: number
  /** documented duration of the event, s */
  durationS?: number
  /** where it happened (defaults to the phase's location) */
  location?: string
  /** the vehicle or instrument involved (defaults to the phase's vehicle) */
  vehicle?: string
  /** how much the time can be trusted: high = read from a mission record; medium = reconstructed or derived; low = order only */
  confidence?: 'high' | 'medium' | 'low'
  /** what kind of record the time comes from */
  record?: EventRecordClass
}

/** finest unit the source gives; 'unknown' = the source gives the order but no time */
export type TimePrecision = 'centisecond' | 'decisecond' | 'second' | 'minute' | 'hour' | 'day' | 'month' | 'unknown'
/**
 * GET = ground elapsed time from range zero (Apollo); UTC-SCET = UTC at the spacecraft (when it happened);
 * UTC-ERT = UTC when the signal reached Earth (confirmation); UTC = UTC as published, standard not stated
 */
export type TimeStandard = 'GET' | 'UTC' | 'UTC-SCET' | 'UTC-ERT'
/**
 * mission-record = an official post-flight timeline or mission report (Apollo by the Numbers, PDS mission description);
 * flight-reconstruction = reconstructed from the vehicle's own flight data (accelerometers, gyros);
 * derived = computed from published values (the rule is in timeNote); planned = a design / pre-flight value;
 * sequence = the source gives the order only
 */
export type EventRecordClass = 'mission-record' | 'flight-reconstruction' | 'derived' | 'planned' | 'sequence'

export type Environment =
  | 'pad' // low atmosphere over the launch site
  | 'earth-near' // ascent above the atmosphere, Earth orbit, departure
  | 'cislunar' // Earth–Moon space
  | 'moon-near' // lunar orbit, descent and ascent
  | 'moon-surface'
  | 'earth-entry' // return: entry and parachutes
  | 'ocean'
  | 'interplanetary' // Earth–Mars cruise
  | 'mars-near' // approach and entry
  | 'mars-descent' // parachute, airbags, bounces
  | 'mars-surface'
  | 'sun-near' // inner heliosphere: Parker Solar Probe's encounters
  | 'venus-near' // a Venus gravity assist

export interface Phase {
  id: string
  title: string
  t0: Met
  t1: Met
  env: Environment
  /** one line shown under the phase title */
  summary: string
  /** where the phase takes place, and the vehicle configuration flying (event record defaults) */
  location?: string
  vehicle?: string
  /** the phase is TOLD from the record over an overview view, not reconstructed in 3-D */
  told?: boolean
}

/** playback pacing: MET [t0, t1] plays in `play` seconds at 1× (piecewise-linear, monotonic) */
export interface Segment { t0: Met; t1: Met; play: number }

export interface TelemetrySample { t: Met; altitudeM?: number; speedMS?: number; distanceKm?: number; label?: string }
export interface TelemetryTrack {
  /** what the value is, e.g. 'Altitude' */
  name: 'altitude' | 'speed' | 'distance'
  unit: string
  frame: string
  sources: string[]
  samples: { t: Met; v: number }[]
  /** false: the values are too far apart to interpolate; each is shown only around its own moment */
  interp?: boolean
}

export type AudioCue = 'ignition' | 'staging' | 'pyro' | 'chute' | 'bounce' | 'beep' | 'touchdown' | 'splash' | 'sonic' | 'airbag' | 'retro' | 'retract' | 'petals' | 'egress'

export interface Shot {
  /** chase: behind/below the vehicle looking along it; side: broadside; wide: far framing with the body; ground: fixed
   *  observer at the launch site; orbit: slow circle around the vehicle; top: overhead of a surface scene */
  kind: 'chase' | 'side' | 'wide' | 'ground' | 'orbit' | 'top' | 'low' | 'sun'
  /** Unity missions, 'wide': the body framed with the spacecraft (mission-defined index, e.g. Parker 0 Sun, 2 Venus) */
  target?: number
  /** metres from the vehicle (or the body radius multiple for 'wide') */
  dist: number
  /** degrees above the local horizon */
  elev?: number
  /** degrees around the vehicle (0 = behind) */
  azim?: number
  fov?: number
  /** wide shots: put the camera on the sunlit side of the body (a night-side orbit would otherwise be a black frame) */
  lit?: boolean
  /** Unity 'wide' shots: an OBSERVER viewpoint this many target radii behind and sunward of the spacecraft, so the body
   *  is large and lit behind it (the spacecraft is drawn enlarged); `azim` turns the viewpoint around the line of sight */
  obs?: number
}

export interface ShotCue { t: Met; shot: Shot; label?: string }

export interface MissionScript {
  /** 'relive': a historical mission; 'expedition': the explorer's own conceptual journey (Explore) */
  kind?: 'relive' | 'expedition'
  /** expeditions: where it goes and which surface it opens */
  dest?: 'moon' | 'mars'
  siteId?: string
  direction?: 'outbound' | 'return' | 'hop'
  /** the flight model (expeditions carry their own; historical missions use flight.ts frameAt) */
  frame?: (t: Met) => import('./flight').Frame
  id: string
  missionId: string
  title: string
  subtitle: string
  /** UTC of MET 0 (range zero / liftoff reference) */
  epochMs: number
  epochNote: string
  vehicle: 'saturn-v' | 'delta-ii-7925h' | 'delta-iv-heavy' | 'atlas-v-551' | 'titan-ivb-centaur'
  /** 'get': GET hhh:mm:ss (Apollo); 'days': L+ d hh:mm:ss (long cruises) */
  clock: 'get' | 'days'
  phases: Phase[]
  events: MissionEvent[]
  segments: Segment[]
  telemetry: TelemetryTrack[]
  shots: ShotCue[]
  /** what is drawn without a source (always shown in the "How this is built" panel) */
  illustrative: string[]
  /** the player's 'Jump to' targets: a label and the event it jumps to (in mission order) */
  jumps?: { label: string; event: string }[]
  /**
   * Unity missions (NASA robotic mission experiences): the 3-D view is the MissionsExplorer Unity player instead of
   * ReliveScene; the timeline, cards, evidence and audio are the same. See docs/missions/shared/architecture.md.
   */
  renderer?: 'three' | 'unity'
  unity?: UnityMissionConfig
  /** the hand-off at the end of the mission */
  conclusion: { title: string; text: string; sources: string[] }
}

/** A part of the spacecraft the visitor can inspect (order = the Unity mission's anchor list). */
export interface InstrumentDef {
  id: string
  name: string
  /** the suite or system it belongs to */
  suite?: string
  /** what it measures / does, in the source's terms */
  measures: string
  /** where it is, in the source's terms */
  location: string
  /** how its place on the 3-D model was found */
  placement: 'named-part' | 'matched' | 'approximate'
  placementNote: string
  sources: string[]
}

/** a NASA photograph shown during the launch (MET seconds from which it is shown) */
export interface LaunchPhoto { from: number; src: string; nasaId: string; title: string; date: string; credit: string }

export interface UnityMissionConfig {
  /** the mission id the Unity player builds ('parker', 'juno', 'cassini') */
  mission: string
  instruments: InstrumentDef[]
  /** /missions/<mission>/trajectory.json (JPL Horizons vectors) for the HUD */
  trajectory: string
  /** HUD reference body: distances are measured from it */
  centre: { name: string; radiusKm: number }
  /** missions with several frames (Juno: cruise around the Sun, then around Jupiter): from that UTC on, the read-out
   *  uses this trajectory track and centre */
  frames?: { fromMs: number; track: string; centre: { name: string; radiusKm: number; surface?: string } }[]
  /** the launch shown at the start (RECONSTRUCTED vehicle, ILLUSTRATIVE climb); MET 0 = liftoff (script.epochMs) */
  launch?: { name: string; site: string; padSeconds: number; photos: LaunchPhoto[]; sources: string[] }
  /** the "Orbits" overview (labelled, top-down): AU from the frame centre, per frame (fromMs = when it applies) */
  overview: { fromMs?: number; dist: number; elev?: number; azim?: number }[]
  /** provenance of each visual layer, shown in "How this is built" */
  layers: { name: string; kind: 'nasa-model' | 'trajectory' | 'reconstructed' | 'illustrative' | 'visualisation' | 'model'; note: string }[]
}
