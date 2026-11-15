/**
 * Juno — launch (2011) to perijove 87 (Sept 2026), rendered by the Unity MissionsExplorer player.
 * Research and provenance: docs/missions/juno/research.md.
 *
 * Times: 'sourced' = JPL Horizons' event list for -61 (navigation team) or NASA pages; 'derived' = closest approaches
 * computed from the JPL Horizons trajectory (1-minute samples around each flyby, 2-minute around each perijove).
 * Perijove numbers follow NASA's (JOI = PJ0): checked in juno.test.ts. Discoveries NASA lists without a date are
 * 'conceptual' cards placed during the orbits that gathered them, and say so.
 */
import type { InstrumentDef, MissionEvent, MissionScript, Phase, Segment, ShotCue } from '../types'
import { encounter, segments } from './pace'

const M = 'juno-mission', SC = 'juno-spacecraft', F = 'juno-facts', X = 'juno-extension', ST = 'juno-stories'
const TH = 'juno-thebe', HI = 'juno-hi', HZ = 'horizons-juno', MODEL = 'nasa-3d-juno', MAP = 'pia07782'

/** MET 0 = launch, Aug. 5, 2011 16:25 UTC (JPL Horizons event list; NASA) */
const EPOCH = Date.UTC(2011, 7, 5, 16, 25, 0)
const at = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) => (Date.UTC(y, mo - 1, d, h, mi, s) - EPOCH) / 1000
const H = 3600, DAY = 86400

const SEP = at(2011, 8, 5, 17, 24, 56)
const DSM1 = at(2012, 8, 30, 22, 29), DSM2 = at(2012, 9, 3, 22, 29)
const HI_T = at(2013, 10, 9, 18, 0)
const EFB = at(2013, 10, 9, 19, 21, 25)
const APPROACH = at(2016, 6, 25) // the replay switches to Jupiter-centred vectors
const JOI = at(2016, 7, 5, 2, 30)
const PJ0 = at(2016, 7, 5, 2, 48)
const PJ1 = at(2016, 8, 27, 12, 51)
const PRM = at(2016, 10, 19)
const PJ = (n: number) => PJS[n]
/** perijove times computed from the Horizons trajectory (closest approach to Jupiter's centre), NASA numbering */
const PJS: Record<number, number> = { 2: at(2016, 10, 19, 18, 11), 3: at(2016, 12, 11, 17, 4), 4: at(2017, 2, 2, 12, 57), 5: at(2017, 3, 27, 8, 52), 6: at(2017, 5, 19, 6, 1), 34: at(2021, 6, 8, 7, 46), 45: at(2022, 9, 29, 17, 12), 57: at(2023, 12, 30, 12, 36), 58: at(2024, 2, 3, 21, 48), 87: at(2026, 9, 9, 6, 23) }
const GAN = at(2021, 6, 7, 16, 56), EUR = at(2022, 9, 29, 9, 37), IO1 = at(2023, 12, 30, 8, 36), IO2 = at(2024, 2, 3, 17, 49)
const THEBE = at(2026, 5, 1), IO_HEAT = at(2026, 7, 22)
const END = at(2026, 9, 26, 12)

const ev = (id: string, t: number, title: string, text: string, kind: MissionEvent['kind'], sources: string[], extra: Partial<MissionEvent> = {}): MissionEvent => ({ id, t, basis: 'sourced', title, text, kind, sources, ...extra })
const rec = (precision: MissionEvent['precision'], published: string): Partial<MissionEvent> => ({ precision, published, standard: 'UTC', record: 'mission-record', confidence: 'high' })
const traj = (note: string, unc = 120): Partial<MissionEvent> => ({
  basis: 'derived', record: 'derived', precision: 'minute', uncertaintyS: unc, confidence: 'medium', standard: 'UTC-SCET',
  timeNote: `${note} Computed from the JPL Horizons trajectory for Juno (-61, the navigation team's solution); NASA publishes the date.`,
})
const told = (note: string): Partial<MissionEvent> => ({ basis: 'conceptual', precision: 'unknown', record: 'sequence', confidence: 'high', timeNote: note })
const RESULT = 'Not a dated event: NASA lists this result on its mission page without a date. It is shown during the polar orbits whose observations produced it.'

const EVENTS: MissionEvent[] = [
  ev('launch', 0, 'Launch', 'Juno launched on an Atlas V-551 rocket from Cape Canaveral, Florida, at 16:25 UTC on Aug. 5, 2011. Launch mass: 3,625 kg.', 'liftoff', [HZ, M, F, 'juno-launch-kit'], { ...rec('minute', 'Aug 5, 2011 16:25 UTC'), location: 'Space Launch Complex 41, Cape Canaveral', vehicle: 'Atlas V-551' }),
  ev('separation', SEP, 'Juno separates from its rocket', 'Juno separated from the Centaur upper stage at 17:24:56 UTC.', 'separation', [HZ], rec('second', 'Aug 5, 2011 17:24:56.12 UTC')),
  ev('solar-spinner', SEP + 3 * H, 'A spinning, solar-powered explorer', 'Juno is the first solar-powered spacecraft sent to Jupiter: three solar arrays, each 9 m long, with 18,698 solar cells — about 14 kW near Earth, only about 400 W at Jupiter. It spins to stay stable: 1 rpm in cruise, 2 rpm for science, 5 rpm for main-engine burns.', 'deploy', [F, SC], told('Not a dated event: Juno’s design is introduced as it leaves Earth.')),
  ev('dsm-1', DSM1, 'First deep-space manoeuvre', 'Juno fired its main engine (Δv 344.95 m/s), the first of two burns that set up its return to Earth for a gravity assist.', 'burn', [HZ], rec('minute', 'Aug 30, 2012 22:29 UTC')),
  ev('dsm-2', DSM2, 'Second deep-space manoeuvre', 'The second main-engine burn (Δv 387.77 m/s).', 'burn', [HZ], rec('minute', 'Sep 3, 2012 22:29 UTC')),
  ev('hi', HI_T, '“HI” from Earth', 'Amateur radio operators around the world sent “HI” in Morse code to Juno, 16 times, every 10 minutes from 18:00 UTC. Juno’s Waves instrument detected the message.', 'comms', [HI], { ...rec('minute', 'Oct. 9, 2013, from 18:00 UTC'), cue: 'beep' }),
  ev('earth-flyby', EFB, 'Earth gravity assist', 'Juno swung past Earth at 19:21:25 UTC, 558.8 km above it, gaining the speed it needed to reach Jupiter. It passed through Earth’s shadow from 19:19:36 to 19:39:01 UTC.', 'flyby', [HZ], rec('second', 'Oct 9, 2013 19:21:25 UTC')),
  ev('safe-mode', EFB + 6 * 60, 'Safe mode', 'A few minutes after closest approach Juno entered safe mode, and its science instruments were switched off; it recovered and continued to Jupiter.', 'comms', [HI], { basis: 'sequence', record: 'sequence', precision: 'unknown', confidence: 'medium', timeNote: 'NASA says "a few minutes after closest approach"; placed 6 minutes after it.' }),
  ev('approach', APPROACH, 'Jupiter ahead', 'Juno approaches Jupiter. From here the replay follows Juno around Jupiter itself (Jupiter-centred trajectory).', 'coast', [HZ], told('Not a dated event: where the replay switches to Jupiter-centred vectors.')),
  ev('joi', JOI, 'Into orbit around Jupiter', 'Jupiter orbit insertion: Juno’s main engine slowed it by 541.7 m/s, into a 53.5-day capture orbit (July 4, 2016 in US time zones).', 'burn', [HZ, M], rec('minute', 'Jul 5, 2016 02:30 UTC')),
  ev('pj0', PJ0, 'Perijove 0', 'Juno’s first closest approach to Jupiter, during orbit insertion: about 4,500 km above the cloud tops (1-bar level) in the Horizons trajectory.', 'perihelion', [HZ], traj('Closest approach to Jupiter on July 5, 2016.')),
  ev('pj1', PJ1, 'The first science pass', 'Perijove 1: Juno flies from pole to pole just above the clouds — about 4,100 km above them — with all its instruments on. No spacecraft had flown over Jupiter’s poles before.', 'perihelion', [HZ, M], traj('Closest approach to Jupiter on Aug. 27, 2016.')),
  ev('cyclones', PJ1 + 40 * 60, 'Cyclones at the poles', 'Juno found a central cyclone at Jupiter’s north pole surrounded by eight more.', 'discovery', [M], told(RESULT)),
  ev('prm', PRM, 'A burn that never happened', 'The burn to shorten Juno’s orbit from 53 to 14 days, planned for Oct. 19, 2016, was cancelled because of slow-responding helium check valves. Juno stayed in its 53-day orbit.', 'burn', [HZ], rec('day', 'Oct 19, 2016 (CANCELLED)')),
  ev('pj2', PJ(2), 'Perijove 2', 'The second close pass, on the same 53-day orbit.', 'perihelion', [HZ], traj('Closest approach to Jupiter on Oct. 19, 2016.')),
  ev('deep-belts', PJ(3) + 30 * 60, 'Weather that goes deep', 'Jupiter’s belts and zones extend about 3,000 km below the cloud tops (Microwave Radiometer and gravity measurements).', 'discovery', [M], told(RESULT)),
  ev('magnetic', PJ(4) + 30 * 60, 'A stronger magnetic field', 'Jupiter’s magnetic field is far more intense than anyone expected (Magnetometer).', 'discovery', [M], told(RESULT)),
  ev('fuzzy-core', PJ(5) + 30 * 60, 'A “fuzzy” core', 'Jupiter’s core appears larger than expected and partly dissolved (Gravity Science).', 'discovery', [M], told(RESULT)),
  ev('lightning', PJ(6) + 30 * 60, 'Lightning and ammonia hail', 'Lightning on Jupiter is a polar phenomenon; storms there drop hailstones of ammonia and water.', 'discovery', [M], told(RESULT)),
  ev('auroras', PJ(6) + 3 * H, 'Auroras unlike Earth’s', 'Jupiter’s auroras appear to form by processes different from the northern and southern lights on Earth (UVS, JEDI, JADE).', 'discovery', [M], told(RESULT)),
  ev('extension', at(2021, 1, 13), 'A longer mission', 'NASA extended Juno through September 2025, or the end of the spacecraft’s life: 42 more orbits, with flybys of Ganymede, Europa and Io.', 'comms', [X], rec('day', 'Jan. 13, 2021')),
  ev('ganymede', GAN, 'Ganymede flyby', 'Juno passed 1,038 km from Ganymede, the largest moon in the Solar System. Its orbit around Jupiter shrank from about 53 to 43 days.', 'flyby', [X, HZ], { ...traj('Closest approach to Ganymede on June 7, 2021.', 60), published: 'June 7, 2021 (PJ34)' }),
  ev('pj34', PJ(34), 'Perijove 34', 'The perijove just after the Ganymede flyby.', 'perihelion', [X, HZ], traj('Closest approach to Jupiter on June 8, 2021.')),
  ev('europa', EUR, 'Europa flyby', 'A close flyby of Europa, the icy moon with an ocean beneath its shell; Juno’s orbit dropped to 38 days. In the Horizons trajectory Juno passed about 354 km above the surface.', 'flyby', [X, HZ], { ...traj('Closest approach to Europa on Sept. 29, 2022.', 60), published: 'Sept. 29, 2022 (PJ45)' }),
  ev('io-1', IO1, 'Io, the volcanic moon', 'The first of a pair of close Io flybys, about 1,500 km above Io in the Horizons trajectory.', 'flyby', [X, HZ], { ...traj('Closest approach to Io on Dec. 30, 2023.', 60), published: 'Dec. 30, 2023 (PJ57)' }),
  ev('io-2', IO2, 'Io again', 'The second close Io flyby; Juno’s orbit around Jupiter shrank to 33 days.', 'flyby', [X, HZ], { ...traj('Closest approach to Io on Feb. 3, 2024.', 60), published: 'Feb. 3, 2024 (PJ58)' }),
  ev('thebe', THEBE, 'Thebe', 'Juno imaged Thebe, the second largest of Jupiter’s inner moons, during a close pass on May 1, 2026.', 'discovery', [TH], rec('day', 'May 1, 2026')),
  ev('io-heat', IO_HEAT, 'Io’s hidden heat', 'NASA published three new Juno studies of Io’s heat on July 22, 2026.', 'discovery', [ST], rec('day', 'Jul 22, 2026')),
  ev('pj87', PJ(87), 'Perijove 87', 'Juno’s 87th close pass of Jupiter, the latest in JPL’s reconstructed trajectory (Sept. 9, 2026).', 'perihelion', [HZ], traj('Closest approach to Jupiter in the reconstruction.')),
  ev('status', END, 'Still at work', 'NASA’s Juno mission page (updated Nov. 3, 2026) lists Juno as an active mission. Its published extension ran to September 2025; JPL’s navigation trajectory follows Juno to Sept. 26, 2026. NASA has not published a new end date in the sources read.', 'end', [M, HZ], rec('day', 'Sep 26, 2026 (end of the reconstruction)')),
]
EVENTS.sort((a, b) => a.t - b.t)

const PHASES: Phase[] = [
  { id: 'launch', title: 'Launch and departure', t0: -120, t1: DSM1 - 3 * DAY, env: 'earth-near', summary: 'From Cape Canaveral into a two-year loop around the Sun.', location: 'Earth to deep space', vehicle: 'Juno' },
  { id: 'loop', title: 'The loop back to Earth', t0: DSM1 - 3 * DAY, t1: EFB + 3 * DAY, env: 'interplanetary', summary: 'Two engine burns and an Earth flyby.', location: 'Inner Solar System', vehicle: 'Juno' },
  { id: 'cruise', title: 'Cruise to Jupiter', t0: EFB + 3 * DAY, t1: APPROACH, env: 'interplanetary', summary: 'Nearly three years to Jupiter.', location: 'Earth to Jupiter', vehicle: 'Juno' },
  { id: 'arrival', title: 'Arrival', t0: APPROACH, t1: PJ1 - 2 * DAY, env: 'interplanetary', summary: 'Jupiter orbit insertion.', location: 'Jupiter', vehicle: 'Juno' },
  { id: 'science', title: 'Polar science orbits', t0: PJ1 - 2 * DAY, t1: GAN - 2 * DAY, env: 'interplanetary', summary: 'Pole-to-pole passes over the clouds every 53 days.', location: 'Jupiter', vehicle: 'Juno' },
  { id: 'moons', title: 'The moons', t0: GAN - 2 * DAY, t1: IO2 + 3 * DAY, env: 'interplanetary', summary: 'Ganymede, Europa and Io.', location: 'Jupiter system', vehicle: 'Juno' },
  { id: 'today', title: 'Juno today', t0: IO2 + 3 * DAY, t1: END, env: 'interplanetary', summary: 'Still orbiting Jupiter.', location: 'Jupiter', vehicle: 'Juno' },
]

/** playback pacing: the Earth flyby, orbit insertion, perijoves and moon flybys slowed down so they are SEEN */
function pacing(): Segment[] {
  return segments([
    { a: -120, b: 150, play: 26 },                                   // the launch, in NASA's photographs
    { a: 150, b: SEP + 4 * H, play: 14 },
    ...encounter(DSM1, 6 * H, 6 * H, [3, 5, 3], 1.5 * H),
    ...encounter(DSM2, 3 * H, 6 * H, [2, 4, 2], 1.5 * H),
    ...encounter(EFB, 1 * DAY, 10 * H, [7, 8, 5], 40 * 60),
    { a: APPROACH, b: APPROACH + 2 * DAY, play: 6 },
    ...encounter(JOI, 1.5 * DAY, 1 * DAY, [6, 9, 5], 2 * H),
    ...encounter(PJ1, 1 * DAY, 2.5 * DAY, [5, 7, 7], 1.5 * H),
    ...encounter(PJ(2), 12 * H, 6 * H, [2, 3, 2], 1 * H),
    ...[3, 4, 5, 6].flatMap((n) => encounter(PJ(n), 5 * H, n === 6 ? 5 * H : 3 * H, [2, 6, 4], 1.2 * H)),
    ...encounter(GAN, 10 * H, 6 * H, [5, 7, 3], 25 * 60),
    ...encounter(PJ(34), 6 * H, 8 * H, [3, 4, 3], 1 * H),
    ...encounter(EUR, 8 * H, 3 * H, [4, 6, 2], 20 * 60),
    ...encounter(PJ(45), 3 * H, 8 * H, [2, 4, 3], 1 * H),
    ...encounter(IO1, 8 * H, 3 * H, [4, 6, 2], 20 * 60),
    ...encounter(PJ(57), 1 * H, 4 * H, [1, 3, 2], 1 * H),
    ...encounter(IO2, 8 * H, 3 * H, [4, 6, 2], 20 * 60),
    ...encounter(PJ(58), 1 * H, 4 * H, [1, 3, 2], 1 * H),
    { a: THEBE - 6 * H, b: THEBE + 6 * H, play: 4 },
    { a: IO_HEAT - 6 * H, b: IO_HEAT + 6 * H, play: 4 },
    ...encounter(PJ(87), 1 * DAY, 2 * DAY, [5, 7, 5], 1.5 * H),
    { a: PJ(87) + 2 * DAY, b: END, play: 6 },
  ])
}

/**
 * Camera. Encounters are filmed from an OBSERVER viewpoint behind and sunward of Juno (`obs` = target radii), so
 * Earth, Jupiter or the moon is large and lit behind the spacecraft. No top-down views in the story.
 * Targets — cruise: 0 Sun, 1 Earth, 3 Jupiter; Jupiter years: 0 Jupiter, 1 Io, 2 Europa, 3 Ganymede.
 */
const pj = (t: number, label?: string, az = 25): ShotCue[] => [
  { t: t - 20 * H, shot: { kind: 'wide', target: 0, dist: 44, fov: 50, obs: 5, azim: az }, label },
  { t: t - 50 * 60, shot: { kind: 'wide', target: 0, dist: 41, fov: 55, obs: 1.9, azim: az - 40 } },
  { t: t + 70 * 60, shot: { kind: 'wide', target: 0, dist: 44, fov: 55, obs: 2.6, azim: az + 50 } },
]
const moon = (t: number, target: number, label: string, az = 20): ShotCue[] => [
  { t: t - 40 * 60, shot: { kind: 'wide', target, dist: 41, fov: 45, obs: 6, azim: az }, label },
  { t: t - 4 * 60, shot: { kind: 'wide', target, dist: 38, fov: 50, obs: 2.4, azim: az - 30 } },
  { t: t + 25 * 60, shot: { kind: 'side', dist: 44, elev: 12, azim: 0, fov: 48 } },
]
const SHOT_LIST: ShotCue[] = [
  { t: -120, shot: { kind: 'wide', target: 1, dist: 41, fov: 45, obs: 3, azim: 15 }, label: 'Leaving Earth' },
  { t: SEP + 2 * H, shot: { kind: 'orbit', dist: 44, elev: 18, azim: 0, fov: 45 }, label: 'Juno, spinning' },
  { t: DSM1 - 5 * H, shot: { kind: 'chase', dist: 41, elev: 14, azim: 150, fov: 45 }, label: 'Main engine' },
  { t: DSM2 + 3 * H, shot: { kind: 'side', dist: 44, elev: 10, azim: 0, fov: 45 } },
  { t: EFB - 20 * H, shot: { kind: 'wide', target: 1, dist: 41, fov: 45, obs: 9, azim: 20 }, label: 'Back to Earth' },
  { t: EFB - 35 * 60, shot: { kind: 'wide', target: 1, dist: 38, fov: 55, obs: 2.3, azim: -10 } },
  { t: EFB + 50 * 60, shot: { kind: 'wide', target: 1, dist: 41, fov: 50, obs: 4, azim: 60 } },
  { t: EFB + 9 * H, shot: { kind: 'side', dist: 44, elev: 12, azim: 0, fov: 45 }, label: 'To Jupiter' },
  { t: APPROACH, shot: { kind: 'wide', target: 0, dist: 44, fov: 24, obs: 40, azim: 20 }, label: 'Jupiter ahead' },
  ...pj(JOI, 'Orbit insertion'),
  ...pj(PJ1, 'Pole to pole', 60),
  { t: PJ1 + 1 * DAY, shot: { kind: 'wide', target: 0, dist: 44, fov: 50, obs: 4, azim: 70 }, label: 'A 53-day orbit' },
  ...pj(PJ(2), undefined, -20),
  ...[3, 4, 5, 6].flatMap((n, i) => pj(PJ(n), undefined, 30 + i * 25)),
  ...moon(GAN, 3, 'Ganymede'),
  ...pj(PJ(34), undefined, 40),
  ...moon(EUR, 2, 'Europa', -25),
  ...pj(PJ(45), undefined, 10),
  ...moon(IO1, 1, 'Io'),
  ...moon(IO2, 1, 'Io again', 40),
  { t: THEBE - 6 * H, shot: { kind: 'wide', target: 0, dist: 44, fov: 50, obs: 4, azim: -30 } },
  ...pj(PJ(87), 'Perijove 87', 35),
  { t: PJ(87) + 1.5 * DAY, shot: { kind: 'wide', target: 0, dist: 44, fov: 50, obs: 4, azim: 50 }, label: 'Juno today' },
]
const SHOTS = [...SHOT_LIST].sort((a, b) => a.t - b.t)

const APPROX = 'Approximate: NASA’s model does not name the instruments. The marker is on the part of the model that matches NASA’s description and images most closely.'
export const JUNO_INSTRUMENTS: InstrumentDef[] = [
  { id: 'mwr', name: 'Microwave Radiometer (MWR)', measures: 'The abundance of water and ammonia in the deep layers of Jupiter’s atmosphere, and temperature profiles.', location: 'Antennas mounted on the sides of the spacecraft body.', placement: 'approximate', placementNote: APPROX, sources: [M, MODEL] },
  { id: 'mag', name: 'Magnetometer (MAG)', measures: 'Maps Jupiter’s magnetic field and the dynamics of the planet’s interior.', location: 'At the end of one solar array, far from the spacecraft’s own electronics.', placement: 'matched', placementNote: 'Matched: the instrument block at the tip of the longest array in NASA’s model, where NASA describes the MAG boom.', sources: [M, SC, MODEL] },
  { id: 'gravity', name: 'Gravity Science', measures: 'Maps the distribution of mass inside Jupiter from its effect on Juno’s radio signal.', location: 'Uses the high-gain antenna and Juno’s radio link to Earth.', placement: 'named-part', placementNote: 'The high-gain dish is a named part of NASA’s model.', sources: [M, MODEL] },
  { id: 'jedi', name: 'JEDI', suite: 'Jupiter Energetic Particle Detector Instrument', measures: 'High-energy ions and electrons in Jupiter’s auroras and near its moons.', location: 'On the spacecraft deck.', placement: 'approximate', placementNote: APPROX, sources: [M, MODEL] },
  { id: 'jade', name: 'JADE', suite: 'Jovian Auroral Distributions Experiment', measures: 'Low-energy ions and electrons in Jupiter’s auroras and near its moons.', location: 'On the spacecraft deck.', placement: 'approximate', placementNote: APPROX, sources: [M, MODEL] },
  { id: 'waves', name: 'Waves', measures: 'Identifies the auroral current regions that produce Jupiter’s radio emissions; it detected the “HI” sent from Earth in 2013.', location: 'Its antennas are not identified on NASA’s model: the marker shows the spacecraft body.', placement: 'approximate', placementNote: 'Not identified on NASA’s model; the marker shows the body.', sources: [M, HI, MODEL] },
  { id: 'uvs', name: 'Ultraviolet Spectrograph (UVS)', measures: 'Images the ultraviolet auroras over Jupiter’s poles.', location: 'On the spacecraft deck.', placement: 'approximate', placementNote: APPROX, sources: [M, MODEL] },
  { id: 'jiram', name: 'JIRAM', suite: 'Jovian Infrared Auroral Mapper', measures: 'Infrared images of the auroras in the upper atmosphere; the composition and temperature of the moons’ surfaces.', location: 'On the spacecraft body.', placement: 'approximate', placementNote: APPROX, sources: [M, MODEL] },
  { id: 'junocam', name: 'JunoCam', measures: 'Visible-light images of the clouds and the moons; made for public outreach.', location: 'On the side of the spacecraft body.', placement: 'approximate', placementNote: 'Approximate: a small separate part of NASA’s model on the body’s side, where JunoCam is in NASA’s images.', sources: [M, MODEL] },
  { id: 'arrays', name: 'Solar arrays', measures: 'Power: three arrays, each 9 m x 2.65 m, 18,698 cells; about 14 kW near Earth, about 400 W at Jupiter.', location: 'Three wings, equally spaced around the hexagonal body.', placement: 'named-part', placementNote: 'Named in NASA’s model.', sources: [F, SC, MODEL] },
  { id: 'vault', name: 'Radiation vault', measures: 'A titanium box, about 200 kg with walls about 1 cm thick, that shields most of the electronics from Jupiter’s radiation belts.', location: 'Inside the spacecraft body (not visible).', placement: 'approximate', placementNote: 'Inside the body: the marker shows where it is housed.', sources: [SC, F] },
  { id: 'engine', name: 'Main engine', measures: 'Leros 1B, 635 N: the deep-space manoeuvres and Jupiter orbit insertion. Juno spins at 5 rpm during main-engine burns.', location: 'At the bottom of the spacecraft body.', placement: 'matched', placementNote: 'Matched: the nozzle at the base of NASA’s model.', sources: [HZ, SC, MODEL] },
]

export const JUNO: MissionScript = {
  kind: 'relive',
  renderer: 'unity',
  id: 'juno',
  missionId: 'juno',
  title: 'Juno',
  subtitle: 'A spinning, solar-powered explorer at Jupiter · 2011 –',
  epochMs: EPOCH,
  epochNote: 'Mission clock from launch, Aug. 5, 2011 16:25 UTC (JPL Horizons event list).',
  vehicle: 'atlas-v-551',
  clock: 'days',
  phases: PHASES,
  events: EVENTS,
  segments: pacing(),
  telemetry: [],
  shots: SHOTS,
  illustrative: [
    'Trajectory: JPL Horizons spacecraft -61 (the navigation team’s reconstruction, to 2026-09-26): heliocentric in cruise, Jupiter-centred from 25 June 2016, with Earth, Mars, Jupiter, the Sun’s direction and the Galilean moons from Horizons; cubic-Hermite interpolated.',
    'Spacecraft: NASA 3D Resources model "Juno (A)", unchanged. Its SPIN uses the documented rates (1 rpm cruise, 2 rpm science, 5 rpm during main-engine burns) at their real speed on the wall clock, while the mission clock runs faster. Its spin AXIS is reconstructed: toward Earth in cruise, toward the Sun at Jupiter (Earth stays within about 11 degrees of the Sun as seen from Jupiter); no attitude kernels are used.',
    'Jupiter: NASA/JPL PIA07782 Cassini colour map (clouds of December 2000, not those of each date), with Jupiter’s flattening, its IAU pole and System III rotation.',
    'The Galilean moons wear USGS Astrogeology mosaics made from NASA spacecraft data.',
    'The magnetic-field lines (overlay) are a VISUALISATION of a simple tilted dipole: they show the idea of what MAG maps, not Juno’s measured field, and are not visible light.',
    'Launch: NASA photographs (NASA/Bill Ingalls): the Atlas V the evening before (Aug. 4, 2011), liftoff from Space Launch Complex 41 at 16:25 UTC and the climb.',
    'Camera: the encounters are seen from a viewpoint a few planet radii behind and sunward of the spacecraft, so the body it meets is large and lit; the spacecraft is drawn ENLARGED (at true scale it would be invisible next to a planet). Its position on the trajectory and the geometry of the Sun, the body and the spacecraft are from JPL Horizons. The star background is NASA SVS “Deep Star Maps 2020” (svs.gsfc.nasa.gov/4851), placed by its J2000 coordinates. Playback is accelerated between events and slowed around each closest approach.',
    'Discoveries NASA lists without a date are shown during the polar orbits that gathered them.',
    'Sound is synthesised sound design (interface and event cues), not a recording. NASA’s recording of the “HI” message is listed by NASA, but its file link no longer works, so it is not played.',
  ],
  jumps: [
    { label: 'Launch', event: 'launch' },
    { label: 'Earth flyby', event: 'earth-flyby' },
    { label: 'Arrival', event: 'joi' },
    { label: 'First pass', event: 'pj1' },
    { label: 'Ganymede', event: 'ganymede' },
    { label: 'Io', event: 'io-1' },
    { label: 'Today', event: 'pj87' },
  ],
  unity: {
    mission: 'juno',
    trajectory: '/missions/juno/trajectory.json',
    centre: { name: 'Sun', radiusKm: 695700 },
    launch: {
      name: 'Atlas V 551', site: 'Space Launch Complex 41, Cape Canaveral', padSeconds: 150, sources: ['juno-launch-kit', 'nasa-img-juno-launch'],
      photos: [
        { from: -120, src: '/missions/launch/201108040002HQ.jpg', nasaId: '201108040002HQ', title: 'The Atlas V with Juno, the evening before launch', date: 'Aug. 4, 2011', credit: 'NASA/Bill Ingalls' },
        { from: -2, src: '/missions/launch/201108050005HQ.jpg', nasaId: '201108050005HQ', title: 'Liftoff from Space Launch Complex 41', date: 'Aug. 5, 2011', credit: 'NASA/Bill Ingalls' },
        { from: 8, src: '/missions/launch/201108050007HQ.jpg', nasaId: '201108050007HQ', title: 'The Atlas V clears the towers', date: 'Aug. 5, 2011', credit: 'NASA/Bill Ingalls' },
        { from: 30, src: '/missions/launch/201108050003HQ.jpg', nasaId: '201108050003HQ', title: 'Juno on its way', date: 'Aug. 5, 2011', credit: 'NASA/Bill Ingalls' },
      ],
    },
    overview: [{ dist: 3.6, elev: 62 }, { fromMs: Date.UTC(2016, 5, 25), dist: 0.014, elev: 40 }],
    frames: [{ fromMs: Date.UTC(2016, 5, 25), track: 'spacecraft-jupiter', centre: { name: 'Jupiter', radiusKm: 71492, surface: 'cloud tops (1-bar level, equatorial radius)' } }],
    instruments: JUNO_INSTRUMENTS,
    layers: [
      { name: 'Spacecraft', kind: 'nasa-model', note: 'NASA 3D Resources "Juno (A)", unchanged.' },
      { name: 'Launch', kind: 'nasa-model', note: 'NASA photographs of the launch (NASA/Bill Ingalls).' },
      { name: 'Stars', kind: 'nasa-model', note: 'NASA SVS Deep Star Maps 2020, placed by J2000 coordinates.' },
      { name: 'Trajectory', kind: 'trajectory', note: 'JPL Horizons -61 navigation reconstruction; moons and planets from Horizons.' },
      { name: 'Spin', kind: 'reconstructed', note: 'Documented rates; axis toward Earth (cruise) or the Sun (at Jupiter).' },
      { name: 'Jupiter', kind: 'model', note: 'PIA07782 Cassini map (Dec 2000 clouds), flattening, IAU pole, System III rotation.' },
      { name: 'Magnetic field', kind: 'visualisation', note: 'A tilted dipole for illustration only.' },
    ],
  },
  conclusion: {
    title: 'Still orbiting Jupiter',
    text: 'Juno is still orbiting Jupiter: NASA lists it as an active mission, and JPL’s navigation trajectory follows it through its 87th close pass in September 2026.',
    sources: [M, HZ],
  },
}
