/**
 * Parker Solar Probe — launch (2018) to its 29th close approach (4 Sept 2026), rendered by the Unity MissionsExplorer
 * player (renderer 'unity'). Research and provenance: docs/missions/parker-solar-probe/research.md.
 *
 * Times:
 *  - 'sourced': read from NASA (mission pages, encounter articles) or from JPL Horizons' event list for -96;
 *  - 'derived': computed from the JPL Horizons trajectory (navigation solution) — closest approaches to Venus and to
 *    the Sun, and the moment Parker reached 18.8 solar radii on the day NASA gives for the first corona crossing.
 *    The rule is in each event's timeNote; the precision never exceeds the trajectory sampling.
 * Nothing here is invented: an event without a published or computable time is not given one.
 */
import type { InstrumentDef, MissionEvent, MissionScript, Phase, Segment, ShotCue } from '../types'
import { encounter, segments } from './pace'

const M = 'psp-mission', INS = 'psp-instruments', REF = 'psp-reference', TPS = 'psp-tps-2017', MELT = 'psp-melt'
const COR = 'psp-corona', DEC = 'psp-dec2024', BEACON = 'psp-dec2024-beacon', P24 = 'psp-24th', SEP = 'psp-sep2026'
const VEN = 'nasa-venus-exploration', HZ = 'horizons-psp', MODEL = 'nasa-3d-psp', V7 = 'psp-venus7'

/** MET 0 = launch, Aug. 12, 2018 07:31 UTC (NASA; to the minute) */
const EPOCH = Date.UTC(2018, 7, 12, 7, 31, 0)
const at = (y: number, mo: number, d: number, h = 0, mi = 0) => (Date.UTC(y, mo - 1, d, h, mi) - EPOCH) / 1000
const H = 3600, DAY = 86400

/** first vector Horizons serves (44 min after launch) */
const DATA0 = at(2018, 8, 12, 8, 16)
/** closest approaches to Venus in the Horizons trajectory (1-minute samples, Hermite-refined; parker.test.ts checks) */
const VGA = [
  at(2018, 10, 3, 8, 44), // also the Horizons event list: "Venus Flyby #1 @ 8:44 UTC"
  at(2019, 12, 26, 18, 15),
  at(2020, 7, 11, 3, 24),
  at(2021, 2, 20, 20, 6),
  at(2021, 10, 16, 9, 31),
  at(2023, 8, 21, 12, 3),
  at(2024, 11, 6, 18, 44),
]
/** closest-approach altitude above Venus' 6,051.8 km mean radius in the Horizons trajectory (km). NASA gives 376 km
 *  (233 miles) for the seventh: the trajectory gives 377 km. */
const VGA_ALT = [2429, 3005, 833, 2385, 3809, 4005, 377]
const P1 = at(2018, 11, 6, 3, 27)
const P8 = at(2021, 4, 29, 8, 46)
const CORONA = at(2021, 4, 28, 13, 9)
const ANNOUNCE = at(2021, 12, 14)
const P22 = at(2024, 12, 24, 11, 46)
const BEACON_T = at(2024, 12, 27, 4, 55) // "just before midnight EST on Dec. 26" = shortly before 05:00 UTC Dec. 27
const P23 = at(2025, 3, 22, 22, 31)
const P29 = at(2026, 9, 4, 14, 31)
const CHECKIN = at(2026, 9, 7)
const EXTENDED = at(2026, 9, 10)
const END = at(2026, 9, 12)

const ev = (id: string, t: number, title: string, text: string, kind: MissionEvent['kind'], sources: string[], extra: Partial<MissionEvent> = {}): MissionEvent => ({
  id, t, basis: 'sourced', title, text, kind, sources, ...extra,
})
const day = (published: string): Partial<MissionEvent> => ({ precision: 'day', published, standard: 'UTC', record: 'mission-record', confidence: 'high' })
const minute = (published: string): Partial<MissionEvent> => ({ precision: 'minute', published, standard: 'UTC', record: 'mission-record', confidence: 'high' })
const traj = (note: string, precision: MissionEvent['precision'] = 'minute', uncertaintyS = 300): Partial<MissionEvent> => ({
  basis: 'derived', record: 'derived', precision, uncertaintyS, confidence: 'medium', standard: 'UTC-SCET',
  timeNote: `${note} Computed from the JPL Horizons trajectory for Parker Solar Probe (-96, the navigation team's solution), cubic-Hermite interpolated; NASA publishes the date.`,
})

const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh']
const PUB_VGA = ['Oct. 3, 2018', 'Dec. 26, 2019', 'July 11, 2020', 'Feb. 20, 2021', 'Oct. 16, 2021', 'Aug. 21, 2023', 'Nov. 6, 2024']

const venusEvents: MissionEvent[] = VGA.map((t, i) => ev(
  `venus-${i + 1}`, t, `${ORD[i]} Venus flyby${i === 6 ? ' (the last)' : ''}`,
  `Venus gravity assist ${i + 1} of 7 ("${i === 6 ? '7th and Final Venus Flyby' : `${i + 1}${['st', 'nd', 'rd'][i] ?? 'th'} Venus Flyby`}", NASA, ${PUB_VGA[i]}). Each pass slows Parker in its orbit around the Sun, so its next perihelion comes closer to the Sun. In the JPL Horizons trajectory the closest approach is about ${VGA_ALT[i].toLocaleString('en-US')} km above Venus${i === 6 ? ' (NASA: within 233 miles, 376 km, of the surface)' : ''}.`,
  'flyby', i === 6 ? [VEN, V7, HZ] : [VEN, HZ],
  i === 0 ? minute('2018-Oct-03 8:44 UTC (JPL Horizons event list)') : traj(`Closest approach to Venus on ${PUB_VGA[i]}.`, 'minute', 300),
))

const EVENTS: MissionEvent[] = [
  ev('launch', 0, 'Launch', 'Parker Solar Probe launched on a Delta IV-Heavy with Upper Stage from Space Launch Complex 37, Cape Canaveral Air Force Station, Florida, at 7:31 UTC (3:31 a.m. EDT) on Aug. 12, 2018. Launch mass: 1,510 pounds (685 kg).', 'liftoff', [M, REF, 'psp-delta-iv'],
    { ...minute('Aug. 12, 2018 / 7:31 UTC'), location: 'Space Launch Complex 37, Cape Canaveral', vehicle: 'Delta IV-Heavy with Upper Stage' }),
  ev('shield', DATA0 + 2 * H, 'A shield made for the Sun', 'Parker carries a Thermal Protection System 8 feet (2.4 m) across and 4.5 inches (11.43 cm) thick: carbon-composite foam between two carbon plates, with white ceramic paint on the Sun-facing plate. The Sun-facing side heats to about 2,500 °F (1,377 °C) while the spacecraft body behind it stays near 85 °F (30 °C).', 'deploy', [MELT, TPS, M],
    { basis: 'conceptual', timeNote: 'Not a dated event: the heat shield is introduced while Parker leaves Earth.', precision: 'unknown', record: 'sequence', confidence: 'high' }),
  venusEvents[0],
  ev('perihelion-1', P1, 'First perihelion', 'Parker\'s first closest approach to the Sun ("Perihelion #1 @ 03:27 UTC", JPL Horizons). In the Horizons trajectory it passes about 24.1 million km above the visible surface at about 95 km/s.', 'perihelion', [HZ],
    { ...minute('2018-Nov-06 03:27 UTC (JPL Horizons event list)') }),
  venusEvents[1],
  venusEvents[2],
  venusEvents[3],
  ev('corona', CORONA, 'Inside the Sun\'s atmosphere', 'On April 28, 2021, during its eighth flyby of the Sun, Parker crossed the Alfvén critical surface — the boundary where the Sun\'s atmosphere ends and the solar wind begins — at 18.8 solar radii (around 8.1 million miles). It was the first time a spacecraft flew through the corona. This first passage lasted only a few hours.', 'discovery', [COR, HZ],
    { ...traj('The moment the trajectory reaches 18.8 solar radii from the Sun\'s centre (8.1 million miles = 18.7 solar radii, so NASA\'s figure is a centre distance) on the day NASA gives.', 'hour', 1800), published: 'April 28, 2021' }),
  ev('perihelion-8', P8, 'Perihelion 8', 'The closest point of the eighth orbit ("2021-Apr-29: Perihelion #8", JPL Horizons): about 16 solar radii from the Sun\'s centre in the Horizons trajectory. NASA reports Parker dipped to just beneath 15 solar radii while passing through a pseudostreamer, a feature in the corona.', 'perihelion', [HZ, COR],
    { ...traj('Closest approach to the Sun on 2021-Apr-29 (JPL Horizons event list gives the date).', 'minute', 450) }),
  venusEvents[4],
  ev('corona-results', ANNOUNCE, 'What Parker found in the corona', 'NASA announced the corona crossing on Dec. 14, 2021. The boundary of the corona is not a smooth sphere: it has spikes and valleys. Parker\'s data also showed that one place where "switchbacks" — sudden S-shaped bends in the magnetic field — begin is at the visible surface of the Sun, linked to magnetic funnels that emerge from the photosphere.', 'discovery', [COR],
    { ...day('Dec. 14, 2021') }),
  venusEvents[5],
  venusEvents[6],
  ev('perihelion-22', P22, 'Closest ever to the Sun', 'Perihelion 22, the first of the closest approaches ("2024-Dec-24: Perihelion #22 (first close approach)", JPL Horizons). Parker passed about 3.8 million miles from the solar surface at about 430,000 mph — faster than any human-made object has travelled. That is about 192 km/s: about 0.064 % of the speed of light.', 'perihelion', [DEC, HZ],
    { ...traj('Closest approach to the Sun on Dec. 24, 2024.', 'minute', 450), published: 'Dec. 24, 2024' }),
  ev('beacon', BEACON_T, 'A beacon from Parker', 'Parker was out of contact during the closest approach. The mission operations team at the Johns Hopkins Applied Physics Laboratory received a beacon tone just before midnight EST on Dec. 26, 2024: the spacecraft had come through safely.', 'comms', [BEACON],
    { cue: 'beep', precision: 'hour', published: 'just before midnight EST on Dec. 26, 2024', standard: 'UTC-ERT', record: 'mission-record', confidence: 'medium', timeNote: 'NASA gives "just before midnight EST" (05:00 UTC Dec. 27); placed at 04:55 UTC and shown to the hour.' }),
  ev('perihelion-23', P23, 'Again, just as close', 'Close approach 23, on March 22, 2025, matched the record distance and speed set on Dec. 24, 2024.', 'perihelion', [P24, HZ],
    { ...traj('Closest approach to the Sun on March 22, 2025.', 'minute', 450), published: 'March 22, 2025' }),
  ev('perihelion-29', P29, 'The 29th close approach', 'Parker completed its 29th close approach to the Sun on Sept. 4, 2026, within 3.8 million miles of the surface at a top speed of 430,000 mph, again matching its record.', 'perihelion', [SEP, HZ],
    { ...traj('Closest approach to the Sun on Sept. 4, 2026.', 'minute', 450), published: 'Sept. 4, 2026' }),
  ev('checkin', CHECKIN, 'All systems normal', 'After the 29th close approach the team reported that Parker\'s systems were operating normally on Sept. 7, 2026.', 'comms', [SEP], { cue: 'beep', ...day('Sept. 7, 2026') }),
  ev('extended', EXTENDED, 'The mission continues', 'The Parker Solar Probe mission has been extended into 2029 as a result of NASA\'s 2026 Heliophysics Senior Review (NASA, Sept. 10, 2026).', 'end', [SEP], { ...day('Sept. 10, 2026') }),
]
EVENTS.sort((a, b) => a.t - b.t)

const PHASES: Phase[] = [
  { id: 'launch', title: 'Launch and departure', t0: -120, t1: VGA[0] - 2 * DAY, env: 'earth-near', summary: 'From Cape Canaveral toward the inner Solar System.', location: 'Earth to Venus', vehicle: 'Parker Solar Probe', told: false },
  { id: 'first-orbits', title: 'First orbits', t0: VGA[0] - 2 * DAY, t1: VGA[1] - 2 * DAY, env: 'interplanetary', summary: 'The first Venus flyby bends Parker inward; the first perihelia.', location: 'Inner heliosphere', vehicle: 'Parker Solar Probe' },
  { id: 'tightening', title: 'Venus tightens the orbit', t0: VGA[1] - 2 * DAY, t1: CORONA - 3 * DAY, env: 'interplanetary', summary: 'Each Venus flyby lowers the next perihelion.', location: 'Inner heliosphere', vehicle: 'Parker Solar Probe' },
  { id: 'corona', title: 'Into the corona', t0: CORONA - 3 * DAY, t1: P8 + 3 * DAY, env: 'sun-near', summary: 'The first flight through the Sun\'s atmosphere.', location: 'Solar corona', vehicle: 'Parker Solar Probe' },
  { id: 'closer', title: 'Closer still', t0: P8 + 3 * DAY, t1: P22 - 3 * DAY, env: 'interplanetary', summary: 'The last three Venus flybys set up the final orbit.', location: 'Inner heliosphere', vehicle: 'Parker Solar Probe' },
  { id: 'record', title: 'The record orbits', t0: P22 - 3 * DAY, t1: END, env: 'sun-near', summary: 'About 3.8 million miles from the surface, about every 88 days (JPL Horizons trajectory).', location: 'Solar corona', vehicle: 'Parker Solar Probe' },
]

/** playback pacing: each Venus flyby and close approach slowed down so it is SEEN; the gaps compressed */
function pacing(): Segment[] {
  return segments([
    { a: -120, b: 150, play: 28 },                         // the launch, in NASA's photographs
    { a: 150, b: DATA0 + 3 * H, play: 14 },                // leaving Earth
    ...VGA.flatMap((t) => encounter(t, 10 * H, 6 * H, [5, 7, 4], 40 * 60)),
    ...encounter(P1, 1.5 * DAY, 1 * DAY, [5, 6, 4], 3 * H),
    { a: CORONA - 1 * DAY, b: CORONA + 6 * H, play: 9 },
    ...encounter(P8, 12 * H, 1.5 * DAY, [4, 6, 5], 3 * H),
    { a: ANNOUNCE - 6 * H, b: ANNOUNCE + 6 * H, play: 5 },
    ...encounter(P22, 1.5 * DAY, 1 * DAY, [7, 9, 5], 3 * H),
    { a: BEACON_T - 3 * H, b: BEACON_T + 6 * H, play: 6 },
    ...encounter(P23, 12 * H, 12 * H, [4, 5, 3], 3 * H),
    ...encounter(P29, 1 * DAY, 2 * DAY, [5, 6, 4], 3 * H),
    { a: CHECKIN, b: END, play: 9 },
  ])
}

/**
 * Camera. Every encounter is filmed from an OBSERVER viewpoint behind and sunward of Parker (`obs` = target radii),
 * so Venus or the Sun is large and lit behind the spacecraft. No top-down system views in the story: the "Orbits"
 * button opens the labelled overview on demand.
 */
const venusShots = (t: number, i: number): ShotCue[] => [
  { t: t - 9 * H, shot: { kind: 'wide', target: 2, dist: 14, fov: 40, obs: 7, azim: 10 + i * 12 }, label: `Venus flyby ${i + 1}` },
  { t: t - 35 * 60, shot: { kind: 'wide', target: 2, dist: 13, fov: 50, obs: 2.2, azim: -20 + i * 9 } },
  { t: t + 50 * 60, shot: { kind: 'sun', dist: 15, elev: 8, azim: 80, fov: 48 } },
]
const sunShots = (t: number, label: string, obs: number): ShotCue[] => [
  { t: t - 20 * H, shot: { kind: 'wide', target: 0, dist: 15, fov: 30, obs, azim: 20 }, label },
  { t: t - 2 * H, shot: { kind: 'sun', dist: 14, elev: 10, azim: 72, fov: 50 } },               // broadside: shield lit, Sun at the edge
  { t: t + 2.5 * H, shot: { kind: 'wide', target: 0, dist: 15, fov: 34, obs: obs * 0.8, azim: -35 } },
]
const SHOT_LIST: ShotCue[] = [
  { t: -120, shot: { kind: 'wide', target: 3, dist: 15, fov: 45, obs: 3, azim: 10 }, label: 'Leaving Earth' },
  { t: DATA0 + 1.2 * H, shot: { kind: 'sun', dist: 14, elev: 10, azim: -80, fov: 45 }, label: 'Parker Solar Probe' },
  { t: DATA0 + 2.4 * H, shot: { kind: 'sun', dist: 15, elev: 14, azim: 70, fov: 45 }, label: 'The heat shield faces the Sun' },
  ...VGA.flatMap((t, i) => venusShots(t, i)),
  ...sunShots(P1, 'First perihelion', 4),
  { t: CORONA - 20 * H, shot: { kind: 'wide', target: 0, dist: 15, fov: 30, obs: 3, azim: 30 }, label: 'Into the corona' },
  { t: CORONA - 1 * H, shot: { kind: 'sun', dist: 14, elev: 6, azim: 22, fov: 55 } },             // looking past Parker into the light
  ...sunShots(P8, 'Perihelion 8', 3),
  { t: ANNOUNCE - 5 * H, shot: { kind: 'sun', dist: 15, elev: 12, azim: 78, fov: 45 } },
  ...sunShots(P22, 'The closest approaches', 2.5),
  { t: P22 - 30 * 60, shot: { kind: 'sun', dist: 14, elev: 8, azim: 55, fov: 50 }, label: '430,000 mph' },
  { t: BEACON_T - 2 * H, shot: { kind: 'sun', dist: 15, elev: 12, azim: -82, fov: 48 }, label: 'Safe and sound' },
  ...sunShots(P23, 'Close approach 23', 2.5),
  ...sunShots(P29, 'Close approach 29', 2.5),
  { t: CHECKIN, shot: { kind: 'wide', target: 0, dist: 15, fov: 45, obs: 22, azim: 40 }, label: 'Parker today' },
]
const SHOTS = [...SHOT_LIST].sort((a, b) => a.t - b.t)

export const PARKER_INSTRUMENTS: InstrumentDef[] = [
  { id: 'tps', name: 'Thermal Protection System (heat shield)', measures: 'Protects the spacecraft and its instruments: the Sun-facing side reaches about 2,500 °F (1,377 °C) while the body behind it stays near 85 °F (30 °C).', location: 'The Sun-facing end of the spacecraft. 8 feet (2.4 m) across, 4.5 inches (11.43 cm) thick: carbon-composite foam between two carbon plates, white ceramic paint on the Sun-facing plate.', placement: 'matched', placementNote: 'The shield is a separate piece of NASA\'s model (2.25–2.33 m across, 12.6 cm thick: within about 5 % of NASA\'s figures).', sources: [MELT, TPS, M, MODEL] },
  { id: 'fields', name: 'FIELDS — electric antennas', suite: 'FIELDS (UC Berkeley Space Sciences Laboratory)', measures: 'Electric and magnetic fields, waves and turbulence in the inner heliosphere.', location: 'Five 2-meter electric antennas: four stick out beyond the heat shield into sunlight; the fifth is perpendicular to them in the shield\'s shade.', placement: 'named-part', placementNote: 'NASA\'s model names the antennas (node "electricAntennas"); the marker is on one of the four sunlit antenna mounts at the shield rim.', sources: [INS, MODEL] },
  { id: 'wispr', name: 'WISPR', suite: 'WISPR (Naval Research Laboratory)', measures: 'Images the large-scale structure of the corona and solar wind — coronal mass ejections and jets — before Parker flies through them.', location: 'Two cameras, about the size of a shoebox, using the heat shield to block most of the Sunlight.', placement: 'approximate', placementNote: 'Approximate: matched to a part of NASA\'s model with stacked baffles, from NASA\'s description; NASA\'s model does not name it.', sources: [INS, MODEL] },
  { id: 'sweap-spc', name: 'SWEAP — Solar Probe Cup', suite: 'SWEAP (Smithsonian Astrophysical Observatory / UC Berkeley SSL)', measures: 'Solar-wind ions in full sunlight: up to 146 measurements per second near the Sun.', location: 'Peeks over the heat shield into direct sunlight; its front grids can reach 3,000 °F.', placement: 'matched', placementNote: 'Matched: the small cup at the shield rim in NASA\'s model, where NASA describes it.', sources: [INS, MODEL] },
  { id: 'sweap-span', name: 'SWEAP — Solar Probe Analyzers', suite: 'SWEAP', measures: 'SPAN-A measures electrons and ions; SPAN-B measures electrons. Together with the cup: velocity, density and temperature of the solar wind.', location: 'Two wide-field analysers in the shade of the heat shield.', placement: 'approximate', placementNote: 'Approximate: one of a mirrored pair of sensors on opposite sides of the bus in NASA\'s model.', sources: [INS, MODEL] },
  { id: 'isois', name: 'ISʘIS', suite: 'ISʘIS (Princeton University)', measures: 'Energetic electrons, protons and heavy ions: where they come from, how they are accelerated and how they move.', location: 'EPI-Lo (an octagonal dome with 80 dime-sized viewfinders) and EPI-Hi (three stacked sensors, up to 100,000 particles per second).', placement: 'approximate', placementNote: 'Approximate: matched from NASA\'s description of EPI-Lo\'s dome; NASA\'s model does not name it.', sources: [INS, MODEL] },
  { id: 'mag', name: 'FIELDS — magnetometers', suite: 'FIELDS', measures: 'Magnetic fields: a search-coil magnetometer and two fluxgate magnetometers (MAGi, MAGo).', location: 'On the long boom behind the spacecraft, far from its own electronics. Each about the size of a fist.', placement: 'named-part', placementNote: 'NASA\'s model names the boom and magnetometers (nodes "boom", "magnetometers").', sources: [INS, MODEL] },
  { id: 'arrays', name: 'Solar arrays and cooling', measures: 'Power. About a gallon (3.7 liters) of deionized water is pumped through two radiators to cool the arrays; at each close approach the arrays retract behind the shield\'s shadow.', location: 'Two wings at the sides of the spacecraft.', placement: 'named-part', placementNote: 'NASA\'s model names the arrays and cooling system. The retraction is described, not animated: NASA does not publish the angles.', sources: [MELT, MODEL] },
  { id: 'hga', name: 'High-gain antenna', measures: 'Communication with Earth.', location: 'Behind the heat shield.', placement: 'named-part', placementNote: 'NASA\'s model names it (node "HGA"); its size is not in the sources read.', sources: [MODEL] },
]

export const PARKER: MissionScript = {
  kind: 'relive',
  renderer: 'unity',
  id: 'parker-solar-probe',
  missionId: 'parker-solar-probe',
  title: 'Parker Solar Probe',
  subtitle: 'The first flight through the Sun\'s atmosphere · 2018 –',
  epochMs: EPOCH,
  epochNote: 'Mission clock from launch, Aug. 12, 2018 7:31 UTC (NASA).',
  vehicle: 'delta-iv-heavy',
  clock: 'days',
  phases: PHASES,
  events: EVENTS,
  segments: pacing(),
  telemetry: [],
  shots: SHOTS,
  illustrative: [
    'Trajectory: JPL Horizons spacecraft -96 (the navigation team\'s solution, fit to tracking data through 2026-09-29), with Mercury, Venus and Earth from Horizons; between samples it is cubic-Hermite interpolated.',
    'Spacecraft: NASA 3D Resources model, unchanged. Its ATTITUDE is reconstructed: the heat shield always faces the Sun (as NASA describes for the encounters); the roll about the Sun line is not published and is held fixed.',
    'The Sun: a physical model (5,772 K blackbody colour, limb darkening, granulation texture), not a photograph; no sunspots are drawn.',
    'The corona: the Baumbach empirical brightness profile, display-stretched like a coronagraph image (it is a million times fainter than the disk); its streamer shape is ILLUSTRATIVE.',
    'The solar-wind streaks (overlay) are a VISUALISATION of the flow direction SWEAP measures: not to scale and not visible light.',
    'Launch: NASA photographs of the launch (NASA/Bill Ingalls): the rocket on the pad the night before, liftoff at 3:31 a.m. EDT and the climb. The first trajectory vector is 44 minutes after launch.',
    'Camera: the encounters are seen from a viewpoint a few planet radii behind and sunward of the spacecraft, so the body it meets is large and lit; the spacecraft is drawn ENLARGED (at true scale it would be invisible next to a planet). Its position on the trajectory and the geometry of the Sun, the body and the spacecraft are from JPL Horizons. The star background is NASA SVS “Deep Star Maps 2020” (svs.gsfc.nasa.gov/4851), placed by its J2000 coordinates. Playback is accelerated between events and slowed around each closest approach.',
    'Mercury and Venus are uniform spheres in illustrative tones (no surface maps are drawn at these distances). Earth wears NASA’s Blue Marble mosaic (NASA SVS 2915), but its tilt and its rotation on each date are not modelled.',
    'Camera paths and time compression; the playback is accelerated between events. A soft fill light keeps the spacecraft’s shaded side readable (in space that side would be nearly black).',
    'Sound is synthesised sound design (the app’s interface and event cues), not a recording: there is no sound in space. No NASA recording is used for Parker (NASA’s historical sounds archive has none for this mission).',
  ],
  jumps: [
    { label: 'Launch', event: 'launch' },
    { label: 'First Venus flyby', event: 'venus-1' },
    { label: 'Into the corona', event: 'corona' },
    { label: 'Closest ever', event: 'perihelion-22' },
    { label: 'Today', event: 'perihelion-29' },
  ],
  unity: {
    mission: 'parker',
    trajectory: '/missions/parker/trajectory.json',
    centre: { name: 'Sun', radiusKm: 695700 },
    launch: {
      name: 'Delta IV Heavy', site: 'Space Launch Complex 37, Cape Canaveral', padSeconds: 150, sources: ['psp-delta-iv', 'nasa-img-psp-launch'],
      photos: [
        { from: -120, src: '/missions/launch/NHQ201808110006.jpg', nasaId: 'NHQ201808110006', title: 'The service tower rolls back to reveal the Delta IV Heavy with Parker Solar Probe', date: 'Aug. 11, 2018', credit: 'NASA/Bill Ingalls' },
        { from: -4, src: '/missions/launch/NHQ201808120007.jpg', nasaId: 'NHQ201808120007', title: 'Liftoff from Launch Complex 37', date: 'Aug. 12, 2018', credit: 'NASA/Bill Ingalls' },
        { from: 10, src: '/missions/launch/NHQ201808120013.jpg', nasaId: 'NHQ201808120013', title: 'The Delta IV Heavy launches Parker Solar Probe', date: 'Aug. 12, 2018', credit: 'NASA/Bill Ingalls' },
        { from: 30, src: '/missions/launch/NHQ201808120009.jpg', nasaId: 'NHQ201808120009', title: 'Three Common Booster Cores firing', date: 'Aug. 12, 2018', credit: 'NASA/Bill Ingalls' },
        { from: 70, src: '/missions/launch/NHQ201808120010.jpg', nasaId: 'NHQ201808120010', title: 'The climb, in a long-exposure photograph', date: 'Aug. 12, 2018', credit: 'NASA/Bill Ingalls' },
      ],
    },
    overview: [{ dist: 1.25, elev: 65 }],
    instruments: PARKER_INSTRUMENTS,
    layers: [
      { name: 'Spacecraft', kind: 'nasa-model', note: 'NASA 3D Resources "Parker Solar Probe", unchanged.' },
      { name: 'Launch', kind: 'nasa-model', note: 'NASA photographs of the launch (NASA/Bill Ingalls).' },
      { name: 'Stars', kind: 'nasa-model', note: 'NASA SVS Deep Star Maps 2020, placed by J2000 coordinates.' },
      { name: 'Trajectory', kind: 'trajectory', note: 'JPL Horizons -96 (navigation solution) and the planets from Horizons.' },
      { name: 'Attitude', kind: 'reconstructed', note: 'Shield to the Sun; roll held fixed (not published).' },
      { name: 'Sun', kind: 'model', note: 'Blackbody colour, limb darkening, granulation texture; no sunspots.' },
      { name: 'Corona', kind: 'illustrative', note: 'Baumbach brightness profile, display-stretched; streamer shape illustrative.' },
      { name: 'Solar wind', kind: 'visualisation', note: 'Direction of the flow only; not to scale, not visible light.' },
    ],
  },
  conclusion: {
    title: 'Still flying through the corona',
    text: 'Parker is still orbiting the Sun, passing about 3.8 million miles from its surface at each closest approach — about every 88 days in the JPL Horizons trajectory. NASA has extended the mission into 2029.',
    sources: [SEP, HZ],
  },
}
