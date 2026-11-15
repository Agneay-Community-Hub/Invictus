/**
 * Cassini-Huygens — launch (1997) to the final plunge into Saturn (Sept. 15, 2017), including ESA's Huygens descent to
 * Titan, rendered by the Unity MissionsExplorer player. Research and provenance: docs/missions/cassini-huygens/research.md.
 *
 * NASA's timeline headings use US dates; where NASA gives a UTC time it is used. Flyby and periapsis times are
 * 'derived' from JPL Horizons' reconstructed trajectory (-82) and say so. Huygens' descent uses Horizons' PREDICTED
 * trajectory (-150), with NASA's published entry and landing times.
 */
import type { InstrumentDef, MissionEvent, MissionScript, Phase, Segment, ShotCue } from '../types'
import { encounter, segments } from './pace'

const LN = 'cassini-launch-1997', LK = 'cassini-launch-kit'
const QF = 'cassini-quickfacts', ORB = 'cassini-orbiter', TL = 'cassini-timeline', GF = 'grand-finale', CH = 'cassini-huygens'
const HZ = 'horizons-cassini', HU = 'horizons-huygens', MODEL = 'nasa-3d-cassini', CAT = 'nasa-cassini', SND = 'nasa-sounds'

/** MET 0 = liftoff, Oct. 15, 1997 4:43 a.m. EDT = 08:43 UTC (NASA) */
const EPOCH = Date.UTC(1997, 9, 15, 8, 43)
const at = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) => (Date.UTC(y, mo - 1, d, h, mi, s) - EPOCH) / 1000
const H = 3600, DAY = 86400

const V1 = at(1998, 4, 26, 13, 45), V2 = at(1999, 6, 24, 20, 30), EFB = at(1999, 8, 18, 3, 28), JUP = at(2000, 12, 30, 10, 0)
const APPROACH = at(2004, 6, 25), SOI = at(2004, 7, 1, 2, 39)
const RELEASE = at(2004, 12, 25, 2, 0)
const ENTRY = at(2005, 1, 14, 9, 5, 56), CHUTE = at(2005, 1, 14, 9, 10), LANDING = at(2005, 1, 14, 11, 38, 11)
const E2 = at(2005, 7, 14, 19, 55), WATER = at(2006, 3, 8), T16 = at(2006, 7, 22, 0, 26), E3 = at(2008, 3, 12, 19, 6), E5 = at(2008, 10, 9, 19, 7)
const EQUINOX = at(2009, 8, 10), SOLSTICE = at(2010, 9, 26), STORM = at(2010, 12, 4), HEX = at(2013, 12, 3), GEYSERS = at(2014, 7, 27)
const E21 = at(2015, 10, 28, 15, 23), GRAZE = at(2016, 11, 29), H2 = at(2017, 4, 12), T126 = at(2017, 4, 22, 6, 8)
const DIVE1 = at(2017, 4, 26, 9, 5), DIVE11 = at(2017, 6, 29, 22, 15), DIVE22 = at(2017, 9, 9, 0, 10)
const ROLL = at(2017, 9, 15, 7, 14), ENTRY_S = at(2017, 9, 15, 10, 31), LOS = at(2017, 9, 15, 10, 32)
const END = at(2017, 9, 15, 10, 40)

const ev = (id: string, t: number, title: string, text: string, kind: MissionEvent['kind'], sources: string[], extra: Partial<MissionEvent> = {}): MissionEvent => ({ id, t, basis: 'sourced', title, text, kind, sources, ...extra })
const day = (published: string): Partial<MissionEvent> => ({ precision: 'day', published, standard: 'UTC', record: 'mission-record', confidence: 'high' })
const exact = (precision: MissionEvent['precision'], published: string, standard: MissionEvent['standard'] = 'UTC'): Partial<MissionEvent> => ({ precision, published, standard, record: 'mission-record', confidence: 'high' })
const traj = (note: string, unc = 120): Partial<MissionEvent> => ({
  basis: 'derived', record: 'derived', precision: 'minute', uncertaintyS: unc, confidence: 'medium', standard: 'UTC-SCET',
  timeNote: `${note} Computed from the JPL Horizons trajectory for Cassini (-82, the navigation team's reconstruction); NASA publishes the date.`,
})
const SAT_RADIO = { url: '/missions/audio/584791main_spookysaturn.mp3', title: 'NASA: “Cassini: Saturn Radio Emissions #1”', credit: 'NASA (Historical Sounds), Cassini RPWS.', kind: 'sonification' as const, sources: [SND] }
const SAT_RADIO2 = { url: '/missions/audio/584795main_saturn_radio_waves.mp3', title: 'NASA: “Cassini: Saturn Radio Emissions #2”', credit: 'NASA (Historical Sounds), Cassini RPWS.', kind: 'sonification' as const, sources: [SND] }
const ENC_SOUND = { url: '/missions/audio/584796main_enceladus.mp3', title: 'NASA: “Cassini: Enceladus Sound”', credit: 'NASA (Historical Sounds), Cassini RPWS.', kind: 'sonification' as const, sources: [SND] }

const EVENTS: MissionEvent[] = [
  ev('launch', 0, 'Launch', 'Cassini-Huygens lifted off at 4:43 a.m. EDT on a Titan IVB/Centaur from Launch Complex 40, Cape Canaveral Air Station, carrying ESA’s Huygens probe: 5,712 kg with fuel, Huygens and adapter. A first attempt on Oct. 13 had been scrubbed. Cassini was a joint NASA-ESA-ASI mission.', 'liftoff', [LN, LK, TL, QF, CAT], { ...exact('minute', 'Oct. 15, 1997, 4:43 a.m. EDT (08:43 UTC)'), location: 'Launch Complex 40, Cape Canaveral Air Station', vehicle: 'Titan IVB/Centaur' }),
  ev('spacecraft', 6 * H, 'A spacecraft built for Saturn', 'Cassini stood 6.7 m tall and 4 m wide. Far from the Sun, solar panels would not do: three radioisotope thermoelectric generators gave 885 watts at launch. It carried 12 science instruments; Huygens carried six more.', 'deploy', [QF, ORB], { basis: 'conceptual', precision: 'unknown', record: 'sequence', confidence: 'high', timeNote: 'Not a dated event: Cassini’s design is introduced as it leaves Earth.' }),
  ev('venus-1', V1, 'First Venus flyby', 'The first of two Venus gravity assists. In the Horizons trajectory Cassini passed about 284 km above Venus. (NASA’s timeline heading gives April 25, 1998; the closest approach in the trajectory is on April 26 UTC.)', 'flyby', [TL, HZ], traj('Closest approach to Venus.')),
  ev('venus-2', V2, 'Second Venus flyby', 'Cassini passed roughly 370 miles (about 600 km) above Venus.', 'flyby', [TL, HZ], traj('Closest approach to Venus on June 24, 1999.')),
  ev('earth', EFB, 'Earth flyby', 'Cassini swung past Earth about 700 miles away, gaining speed for the outer Solar System (Aug. 17 in US time zones).', 'flyby', [TL, HZ], traj('Closest approach to Earth.')),
  ev('jupiter', JUP, 'Jupiter', 'Closest approach to Jupiter, about 6.2 million miles away. Cassini observed Jupiter together with NASA’s Galileo orbiter.', 'flyby', [TL, HZ], traj('Closest approach to Jupiter on Dec. 30, 2000.', 3 * 3600)),
  ev('soi', SOI, 'Into orbit around Saturn', 'Cassini, still carrying Huygens, became the first spacecraft to orbit Saturn (June 30, 2004 in US time zones). At its closest it passed about 20,000 km above the cloud tops in the Horizons trajectory.', 'burn', [TL, CAT, HZ], { ...traj('Closest approach to Saturn during orbit insertion.'), cue: undefined }),
  ev('saturn-radio', SOI + 6 * H, 'Saturn’s radio voice', 'Cassini’s Radio and Plasma Wave Science instrument recorded Saturn’s radio emissions. NASA converted the data into sound.', 'discovery', [SND], { basis: 'conceptual', precision: 'unknown', record: 'sequence', confidence: 'high', timeNote: 'Not a dated event: NASA does not date this recording on its sounds page.', recording: SAT_RADIO }),
  ev('release', RELEASE, 'Huygens separates', 'Huygens, the probe supplied by ESA, separated from Cassini on Christmas Day 2004 at 02:00 UT, after more than six years dormant. It coasted for three weeks toward Titan.', 'separation', [CH, TL], exact('minute', 'Christmas Day 2004 at 02:00 UT')),
  ev('huygens-entry', ENTRY, 'Into Titan’s atmosphere', 'Huygens entered Titan’s atmosphere at 09:05:56 UT on Jan. 14, 2005.', 'entry', [CH, HU], exact('second', '09:05:56 UT Jan. 14, 2005')),
  ev('huygens-chute', CHUTE, 'The main parachute', 'Within four minutes Huygens deployed its 8.5-meter main parachute and began a descent of about two and a half hours.', 'parachute', [CH], { basis: 'sequence', record: 'sequence', precision: 'unknown', confidence: 'medium', timeNote: 'NASA says "within four minutes" of entry; placed about four minutes after it.' }),
  ev('huygens-landing', LANDING, 'Landing on Titan', 'Huygens touched down on Titan at 11:38:11 UT — the first landing in the outer Solar System. It landed on a flat plain littered with pebbles, on ground like sand made of ice grains, and kept transmitting from the surface (NASA gives both 1 hour 10 minutes and 3 hours 10 minutes).', 'landing', [CH, TL, 'pia07232'], { ...exact('second', '11:38:11 UT'), image: { src: '/missions/images/PIA07232.jpg', title: 'Huygens’ own view from Titan’s surface', credit: 'NASA/JPL/ESA/University of Arizona', id: 'PIA07232', sources: ['pia07232'] } }),
  ev('enceladus-plume', E2, 'Enceladus breathes', 'Images of Enceladus’ south pole revealed a cloud of water vapour and young terrain.', 'discovery', [TL, HZ], { ...traj('Closest approach to Enceladus in July 2005 (NASA timeline heading: July 13, 2005).'), recording: ENC_SOUND }),
  ev('enceladus-water', WATER, 'Liquid water?', 'Evidence suggested reservoirs of liquid water feed Enceladus’ icy jets.', 'discovery', [TL], day('March 8, 2006')),
  ev('titan-lakes', T16, 'Lakes on Titan', 'Cassini’s radar found dozens of lakes on Titan, some about 20 miles across: liquid hydrocarbons, not water.', 'discovery', [TL, HZ], traj('Closest approach to Titan of July 2006 (NASA timeline heading: July 21, 2006).')),
  ev('plume-sample', E3, 'Tasting the plume', 'Flying through the plume, Cassini detected water vapour, volatile gases and organic materials.', 'discovery', [TL, HZ], traj('Closest approach to Enceladus on March 12, 2008.')),
  ev('e5', E5, 'Through the jets', 'Cassini’s closest pass of a moon: about 16 miles (25 km) from Enceladus, sampling the plume directly.', 'flyby', [TL, HZ], traj('Closest approach to Enceladus on Oct. 9, 2008 (NASA timeline heading: Oct. 8).')),
  ev('equinox', EQUINOX, 'Equinox', 'The Sun shone edge-on to the rings, letting Cassini measure vertical structures in them.', 'discovery', [TL], day('August 10, 2009')),
  ev('solstice', SOLSTICE, 'The Solstice Mission', 'A second mission extension began, to watch Saturn’s seasons change.', 'comms', [TL], day('September 26, 2010')),
  ev('storm', STORM, 'A giant storm', 'A giant storm stretched around Saturn’s northern hemisphere, the largest in two decades.', 'discovery', [TL], { ...day('December 4, 2010'), recording: SAT_RADIO2 }),
  ev('hexagon', HEX, 'The hexagon', 'Cassini made its highest-resolution movie of the six-sided jet stream around Saturn’s north pole.', 'discovery', [TL], day('December 3, 2013')),
  ev('geysers', GEYSERS, '101 geysers', 'Analysis identified 101 distinct geysers on Enceladus; liquid water may reach the surface.', 'discovery', [TL], day('July 27, 2014')),
  ev('e21', E21, 'A last deep dive into the plume', 'One of Cassini’s closest Enceladus passes: about 46 km above it in the Horizons trajectory.', 'flyby', [HZ], traj('Closest approach to Enceladus on Oct. 28, 2015.')),
  ev('graze', GRAZE, 'The final orbits begin', 'Cassini began its final orbital phase, passing over the poles and close to the rings.', 'orbit', [TL, GF], day('November 29, 2016')),
  ev('hydrogen', H2, 'Hydrogen in the ocean', 'Hydrogen gas in the plume pointed to hydrothermal activity on the floor of Enceladus’ ocean, beneath its icy crust.', 'discovery', [TL], day('April 12, 2017')),
  ev('titan-final', T126, 'Goodbye, Titan', 'The 127th and final close Titan flyby (about 608 miles; about 980 km in the trajectory) bent Cassini’s orbit into the Grand Finale.', 'flyby', [GF, TL, HZ], traj('Closest approach to Titan on April 22, 2017.')),
  ev('dive-1', DIVE1, 'The first dive', 'The first of 22 dives through the gap, about 2,000 km wide, between Saturn and its rings. The gap turned out to be surprisingly free of dust.', 'orbit', [GF, TL, HZ], traj('Periapsis of the first Grand Finale orbit (April 26, 2017).')),
  ev('dive-11', DIVE11, 'Halfway', 'Dive 11 of 22.', 'orbit', [TL, HZ], traj('Periapsis on June 29, 2017.')),
  ev('dive-22', DIVE22, 'The last dive', 'The 22nd and last dive between Saturn and its rings: about 1,600 km above the clouds in the Horizons trajectory.', 'orbit', [GF, HZ], traj('Periapsis on Sept. 9, 2017.')),
  ev('why', DIVE22 + 2 * DAY, 'Why Cassini ended this way', 'Cassini was running low on fuel. NASA chose to send it into Saturn’s atmosphere so that it could never collide with, and contaminate, Enceladus or Titan — moons that may have habitable or prebiotic environments.', 'end', [GF], { basis: 'conceptual', precision: 'unknown', record: 'sequence', confidence: 'high', timeNote: 'Not a dated event: NASA’s reason for the ending, told before the final day.' }),
  ev('roll', ROLL, 'Pointing into the wind', 'Cassini rolled to point its Ion and Neutral Mass Spectrometer into Saturn’s upper atmosphere and began sending its data in real time.', 'comms', [HZ], exact('minute', '7:14 UTC (spacecraft time)', 'UTC-SCET')),
  ev('entry', ENTRY_S, 'Into Saturn', 'Atmospheric entry: Cassini’s thrusters fired to keep its antenna pointed at Earth while the mass spectrometer sampled the air. (On Earth this was received at 11:54 UTC.)', 'entry', [HZ, GF], exact('minute', '10:31 UTC (spacecraft time) · 11:54 UTC (received on Earth)', 'UTC-SCET')),
  ev('los', LOS, 'Loss of signal', 'The thrusters reached full power and the antenna turned away from Earth. Cassini’s signal ended — received on Earth at 11:55 UTC, 83 minutes later. Its mission was over.', 'end', [HZ, GF], exact('minute', '10:32 UTC (spacecraft time) · 11:55 UTC (received on Earth)', 'UTC-SCET')),
]
EVENTS.sort((a, b) => a.t - b.t)

const PHASES: Phase[] = [
  { id: 'cruise', title: 'The long way to Saturn', t0: -120, t1: APPROACH, env: 'interplanetary', summary: 'Venus twice, Earth, Jupiter.', location: 'Earth to Saturn', vehicle: 'Cassini with Huygens' },
  { id: 'arrival', title: 'Arrival', t0: APPROACH, t1: RELEASE - 2 * DAY, env: 'interplanetary', summary: 'Into orbit around Saturn.', location: 'Saturn', vehicle: 'Cassini with Huygens' },
  { id: 'huygens', title: 'Huygens to Titan', t0: RELEASE - 2 * DAY, t1: LANDING + 2 * H, env: 'interplanetary', summary: 'ESA’s probe parachutes to Titan’s surface.', location: 'Titan', vehicle: 'Huygens (ESA)' },
  { id: 'discovery', title: 'Years of discovery', t0: LANDING + 2 * H, t1: GRAZE - 2 * DAY, env: 'interplanetary', summary: 'Enceladus’ plumes, Titan’s lakes, Saturn’s storms and seasons.', location: 'Saturn system', vehicle: 'Cassini' },
  { id: 'finale', title: 'The Grand Finale', t0: GRAZE - 2 * DAY, t1: END, env: 'interplanetary', summary: '22 dives between Saturn and its rings, and the end.', location: 'Saturn', vehicle: 'Cassini' },
]

/** playback pacing: the flybys, orbit insertion, Huygens' descent and the Grand Finale slowed down so they are SEEN */
function pacing(): Segment[] {
  return segments([
    { a: -120, b: 150, play: 26 },                                   // the launch, in NASA's photographs
    { a: 150, b: 7 * H, play: 12 },
    ...encounter(V1, 10 * H, 6 * H, [4, 6, 3], 40 * 60),
    ...encounter(V2, 10 * H, 6 * H, [4, 6, 3], 40 * 60),
    ...encounter(EFB, 12 * H, 8 * H, [5, 7, 4], 40 * 60),
    ...encounter(JUP, 3 * DAY, 3 * DAY, [4, 4, 4], 1 * DAY),
    { a: APPROACH, b: APPROACH + 2 * DAY, play: 6 },
    ...encounter(SOI, 1 * DAY, 18 * H, [6, 10, 5], 2 * H),
    ...encounter(RELEASE, 8 * H, 8 * H, [3, 5, 3], 1 * H),
    { a: ENTRY - 20 * 60, b: CHUTE + 10 * 60, play: 14 },            // Huygens: entry and the parachute
    { a: CHUTE + 10 * 60, b: LANDING - 10 * 60, play: 16 },          // the descent
    { a: LANDING - 10 * 60, b: LANDING + 30 * 60, play: 10 },        // the landing
    ...encounter(E2, 6 * H, 3 * H, [4, 6, 2], 20 * 60),
    { a: WATER - 6 * H, b: WATER + 6 * H, play: 4 },
    ...encounter(T16, 6 * H, 3 * H, [4, 6, 2], 30 * 60),
    ...encounter(E3, 4 * H, 2 * H, [3, 5, 2], 15 * 60),
    ...encounter(E5, 4 * H, 4 * H, [3, 6, 3], 15 * 60),
    ...[EQUINOX, SOLSTICE, STORM, HEX, GEYSERS].map((t) => ({ a: t - 8 * H, b: t + 8 * H, play: 5 })),
    ...encounter(E21, 4 * H, 2 * H, [3, 5, 2], 15 * 60),
    { a: GRAZE - 12 * H, b: GRAZE + 12 * H, play: 6 },
    { a: H2 - 6 * H, b: H2 + 6 * H, play: 4 },
    ...encounter(T126, 6 * H, 3 * H, [4, 6, 2], 30 * 60),
    ...encounter(DIVE1, 8 * H, 6 * H, [5, 8, 4], 1 * H),
    ...encounter(DIVE11, 3 * H, 3 * H, [2, 4, 2], 1 * H),
    ...encounter(DIVE22, 3 * H, 2 * DAY, [2, 4, 6], 1 * H),
    { a: ROLL - 3 * H, b: ENTRY_S - 30 * 60, play: 12 },             // the final day
    { a: ENTRY_S - 30 * 60, b: END, play: 22 },                     // the last minutes
  ])
}

/**
 * Camera. Encounters are filmed from an OBSERVER viewpoint behind and sunward of Cassini (`obs` = target radii), so
 * the planet or moon is large and lit behind the spacecraft. No top-down views in the story.
 * Targets — cruise: 1 Venus, 2 Earth, 3 Jupiter, 4 Saturn; Saturn years: 0 Saturn, 1 Titan, 2 Enceladus.
 */
const flyby = (t: number, target: number, label: string, az = 15, far = 8, near = 2.3, small = false): ShotCue[] => [
  { t: t - (small ? 1 / 3 : 8) * H, shot: { kind: 'wide', target, dist: 24, fov: 45, obs: far, azim: az }, label },
  { t: t - (small ? 1.5 : 30) * 60, shot: { kind: 'wide', target, dist: 22, fov: 52, obs: near, azim: az - 30 } },
  { t: t + 40 * 60, shot: { kind: 'side', dist: 24, elev: 10, azim: 0, fov: 48 } },
]
const saturn = (t: number, obs: number, az: number, label?: string, fov = 50): ShotCue => ({ t, shot: { kind: 'wide', target: 0, dist: 24, fov, obs, azim: az }, label })
const SHOT_LIST: ShotCue[] = [
  { t: -120, shot: { kind: 'wide', target: 2, dist: 24, fov: 45, obs: 3, azim: 15 }, label: 'Leaving Earth' },
  { t: 3 * H, shot: { kind: 'orbit', dist: 22, elev: 15, azim: 0, fov: 45 }, label: 'Cassini with Huygens' },
  { t: 6 * H, shot: { kind: 'side', dist: 24, elev: 10, azim: 0, fov: 45 }, label: 'The long way to Saturn' },
  ...flyby(V1, 1, 'Venus'),
  ...flyby(V2, 1, 'Venus again', 40),
  ...flyby(EFB, 2, 'Earth flyby', -10),
  { t: JUP - 2.5 * DAY, shot: { kind: 'wide', target: 3, dist: 24, fov: 14, elev: 0, azim: 0, lit: true }, label: 'Jupiter, 6 million miles away' },
  { t: JUP + 2 * DAY, shot: { kind: 'side', dist: 24, elev: 10, azim: 0, fov: 45 } },
  saturn(APPROACH, 30, 20, 'Saturn ahead', 30),
  saturn(SOI - 20 * H, 9, 25, 'Orbit insertion'),
  saturn(SOI - 50 * 60, 2.4, -15),
  saturn(SOI + 2.5 * H, 3.2, 40),
  { t: RELEASE - 6 * H, shot: { kind: 'side', dist: 18, elev: 10, azim: 0, fov: 45 }, label: 'Huygens separates' },
  { t: RELEASE + 2 * H, shot: { kind: 'wide', target: 1, dist: 22, fov: 40, obs: 25, azim: 10 } },
  { t: ENTRY - 18 * 60, shot: { kind: 'wide', target: 1, dist: 9, fov: 50, obs: 1.7, azim: 20 }, label: 'Huygens at Titan' },
  { t: CHUTE, shot: { kind: 'wide', target: 1, dist: 24, fov: 50, obs: 1.45, azim: -20 }, label: 'Under the parachute' },
  { t: CHUTE + 70 * 60, shot: { kind: 'wide', target: 1, dist: 20, fov: 55, obs: 1.3, azim: 30 }, label: 'Down through the haze' },
  { t: LANDING + 15 * 60, shot: { kind: 'wide', target: 1, dist: 24, fov: 45, obs: 6, azim: 20 } },
  ...flyby(E2, 2, 'Enceladus', -20, 6, 3, true),
  saturn(WATER - 6 * H, 7, 60),
  ...flyby(T16, 1, 'Titan', -15, 8, 2.2),
  ...flyby(E3, 2, 'Through the plume', 15, 6, 3, true),
  ...flyby(E5, 2, '25 km above Enceladus', -10, 6, 2.6, true),
  saturn(EQUINOX - 8 * H, 8, 10, 'Equinox'),
  saturn(SOLSTICE - 8 * H, 9, 70),
  saturn(STORM - 8 * H, 6, -40, 'The great storm'),
  saturn(HEX - 8 * H, 5, 110, 'The hexagon'),
  saturn(GEYSERS - 8 * H, 7, 30),
  ...flyby(E21, 2, 'The last deep dive', 10, 6, 3, true),
  saturn(GRAZE - 12 * H, 6, 50, 'Ring-grazing orbits'),
  ...flyby(T126, 1, 'The last Titan flyby', -15, 8, 2.2),
  saturn(DIVE1 - 7 * H, 6, 25, 'Between the rings and Saturn'),
  saturn(DIVE1 - 40 * 60, 2, -20),
  saturn(DIVE1 + 1.5 * H, 3, 45),
  saturn(DIVE11 - 2 * H, 2.4, 15),
  saturn(DIVE22 - 2 * H, 2.4, 35),
  saturn(DIVE22 + 6 * H, 6, 60, 'The last orbits'),
  saturn(ROLL - 2 * H, 3.5, 30, 'The final day'),
  saturn(ENTRY_S - 25 * 60, 1.8, 15, 'The last minutes'),
  saturn(LOS + 30, 2.2, 25, 'Signal lost'),
]
const SHOTS = [...SHOT_LIST].sort((a, b) => a.t - b.t)

const PALLET = 'Approximate: NASA’s model does not name the instruments. The marker is on the instrument pallet where NASA places this group.'
const FP = 'Approximate: the marker is on the fields-and-particles side of the spacecraft in NASA’s model; the model does not name the instrument.'
export const CASSINI_INSTRUMENTS: InstrumentDef[] = [
  { id: 'iss', name: 'Imaging Science Subsystem (ISS)', suite: 'Optical remote sensing (remote sensing pallet)', measures: 'Pictures in visible, near-ultraviolet and near-infrared light.', location: 'On the remote sensing pallet.', placement: 'approximate', placementNote: PALLET, sources: [ORB, QF, MODEL] },
  { id: 'vims', name: 'Visual and Infrared Mapping Spectrometer (VIMS)', suite: 'Optical remote sensing', measures: 'The chemical composition of atmospheres, surfaces and rings.', location: 'On the remote sensing pallet.', placement: 'approximate', placementNote: PALLET, sources: [ORB, QF, MODEL] },
  { id: 'cirs', name: 'Composite Infrared Spectrometer (CIRS)', suite: 'Optical remote sensing', measures: 'Temperatures and composition of Saturn, its moons and its rings.', location: 'On the remote sensing pallet.', placement: 'approximate', placementNote: PALLET, sources: [ORB, QF, MODEL] },
  { id: 'uvis', name: 'Ultraviolet Imaging Spectrograph (UVIS)', suite: 'Optical remote sensing', measures: 'Structure, chemistry and composition of atmospheres, surfaces and rings in ultraviolet light.', location: 'On the remote sensing pallet.', placement: 'approximate', placementNote: PALLET, sources: [ORB, QF, MODEL] },
  { id: 'radar', name: 'Imaging Radar', suite: 'Microwave remote sensing', measures: 'Mapped Titan’s surface through its haze and found its lakes.', location: 'Uses radio waves; the marker is on the high-gain antenna.', placement: 'approximate', placementNote: 'Approximate: the marker shows the large dish.', sources: [ORB, TL, MODEL] },
  { id: 'rss', name: 'Radio Science Subsystem (RSS)', suite: 'Microwave remote sensing', measures: 'Used Cassini’s radio link to measure the masses of moons and probe atmospheres and rings.', location: 'The radio system and the high-gain antenna.', placement: 'approximate', placementNote: 'Approximate: the marker shows the large dish.', sources: [ORB, MODEL] },
  { id: 'caps', name: 'Cassini Plasma Spectrometer (CAPS)', suite: 'Fields, particles and waves', measures: 'Plasma in and near Saturn’s magnetic field.', location: 'On the spacecraft body.', placement: 'approximate', placementNote: FP, sources: [ORB, QF, MODEL] },
  { id: 'cda', name: 'Cosmic Dust Analyzer (CDA)', suite: 'Fields, particles and waves', measures: 'Ice and dust grains in the Saturn system, including the grains of Enceladus’ plume.', location: 'On the spacecraft body.', placement: 'approximate', placementNote: FP, sources: [ORB, QF, MODEL] },
  { id: 'inms', name: 'Ion and Neutral Mass Spectrometer (INMS)', suite: 'Fields, particles and waves', measures: 'The gases of Titan’s and Enceladus’ atmospheres and plumes — and, at the very end, Saturn’s own upper atmosphere.', location: 'On the spacecraft body.', placement: 'approximate', placementNote: FP, sources: [ORB, GF, MODEL] },
  { id: 'mag', name: 'Magnetometer (MAG)', suite: 'Fields, particles and waves', measures: 'Saturn’s magnetic field and how it interacts with the rings and moons.', location: 'On the long boom, far from the spacecraft’s own electronics.', placement: 'matched', placementNote: 'Matched: the tip of the long thin boom in NASA’s model.', sources: [ORB, QF, MODEL] },
  { id: 'mimi', name: 'Magnetospheric Imaging Instrument (MIMI)', suite: 'Fields, particles and waves', measures: 'Images of Saturn’s magnetosphere.', location: 'On the spacecraft body.', placement: 'approximate', placementNote: FP, sources: [ORB, QF, MODEL] },
  { id: 'rpws', name: 'Radio and Plasma Wave Science (RPWS)', suite: 'Fields, particles and waves', measures: 'Radio and plasma waves — the instrument behind NASA’s Saturn and Enceladus sonifications.', location: 'Long wire antennas on the spacecraft.', placement: 'approximate', placementNote: 'Approximate: the marker is on the antenna geometry in NASA’s model.', sources: [ORB, SND, MODEL] },
  { id: 'huygens', name: 'Huygens probe (ESA)', suite: 'Built by ESA', measures: 'Six instruments (HASI, GC/MS, ACP, DISR, SSP, DWE) to study Titan’s atmosphere during the descent and its surface.', location: 'Mounted on the side of Cassini until Dec. 25, 2004.', placement: 'named-part', placementNote: 'A separate part of NASA’s model (NASA also publishes the probe alone).', sources: [CH, MODEL] },
  { id: 'hga', name: 'High-gain antenna', measures: 'Cassini’s link to Earth; held toward Earth until the very end.', location: 'The 4-metre dish at the top.', placement: 'named-part', placementNote: 'Named in NASA’s model (the dish).', sources: [ORB, QF, MODEL] },
  { id: 'rtg', name: 'Radioisotope thermoelectric generators', measures: 'Electric power from the heat of decaying plutonium: 885 W at launch, 633 W at the end.', location: 'Three generators at the base of the spacecraft.', placement: 'matched', placementNote: 'Matched: the three cylinders at the base of NASA’s model.', sources: [ORB, QF, MODEL] },
  { id: 'engine', name: 'Main engine', measures: '445 N: the trajectory manoeuvres and Saturn orbit insertion.', location: 'At the base of the spacecraft.', placement: 'matched', placementNote: 'Matched: the engine at the base of NASA’s model.', sources: [HZ, MODEL] },
]

export const CASSINI: MissionScript = {
  kind: 'relive',
  renderer: 'unity',
  id: 'cassini',
  missionId: 'cassini',
  title: 'Cassini-Huygens',
  subtitle: 'Twenty years to Saturn and back into it · 1997–2017',
  epochMs: EPOCH,
  epochNote: 'Mission clock from liftoff, Oct. 15, 1997 4:43 a.m. EDT (08:43 UTC; NASA).',
  vehicle: 'titan-ivb-centaur',
  clock: 'days',
  phases: PHASES,
  events: EVENTS,
  segments: pacing(),
  telemetry: [],
  shots: SHOTS,
  illustrative: [
    'Trajectory: JPL Horizons spacecraft -82 (the navigation team’s reconstruction): heliocentric in cruise, Saturn-centred from 25 June 2004 (Titan, Enceladus and the Sun’s direction from Horizons), cubic-Hermite interpolated; every periapsis and the chosen flybys are sampled every few minutes.',
    'Huygens: JPL Horizons -150 is the PREDICTED descent trajectory (Horizons notes the actual one has not been converted); the entry (09:05:56 UT) and landing (11:38:11 UT) times are NASA’s. The 8.5 m parachute is drawn to NASA’s size; its shape is a reconstruction. The probe’s orientation is reconstructed.',
    'Spacecraft: NASA 3D Resources "Cassini-Huygens (A)" (with and without the probe), unchanged. Its ATTITUDE is reconstructed: 3-axis stabilised, high-gain antenna toward Earth (cruise) or the Sun-Earth direction (at Saturn); no attitude kernels are used.',
    'Saturn: band colours sampled from NASA’s PIA06193 portrait (southern hemisphere, mirrored to the north) — an illustrative map; the north-polar hexagon is a reconstructed outline. Storms are not drawn.',
    'The rings: radii, optical depths and albedos from NASA’s NSSDCA ring fact sheet; within each listed range the profile varies smoothly (illustrative); light through them follows Beer-Lambert; Saturn’s shadow falls on them.',
    'Titan is a featureless orange haze ball (as in visible light). Enceladus wears a USGS Astrogeology mosaic of NASA Cassini data; its south-polar jets are a VISUALISATION.',
    'Launch: NASA photographs: the Titan IVB/Centaur as the service tower rolls away on Oct. 14, 1997, the night liftoff at 4:43 a.m. EDT and the climb (NASA/JPL/KSC). The first trajectory vector is 47 minutes after liftoff.',
    'Camera: the encounters are seen from a viewpoint a few planet radii behind and sunward of the spacecraft, so the body it meets is large and lit; the spacecraft is drawn ENLARGED (at true scale it would be invisible next to a planet). Its position on the trajectory and the geometry of the Sun, the body and the spacecraft are from JPL Horizons. The star background is NASA SVS “Deep Star Maps 2020” (svs.gsfc.nasa.gov/4851), placed by its J2000 coordinates. Playback is accelerated between events and slowed around each closest approach.',
    'The end: the spacecraft stops being drawn at the loss of signal; no explosion is shown.',
    'Sound is synthesised sound design (interface and event cues), except NASA’s Cassini RPWS sonifications: radio data converted into sound, not sounds heard in space.',
  ],
  jumps: [
    { label: 'Launch', event: 'launch' },
    { label: 'Saturn', event: 'soi' },
    { label: 'Huygens', event: 'huygens-entry' },
    { label: 'Enceladus', event: 'enceladus-plume' },
    { label: 'Grand Finale', event: 'dive-1' },
    { label: 'The end', event: 'roll' },
  ],
  unity: {
    mission: 'cassini',
    trajectory: '/missions/cassini/trajectory.json',
    centre: { name: 'Sun', radiusKm: 695700 },
    launch: {
      name: 'Titan IVB/Centaur', site: 'Launch Complex 40, Cape Canaveral Air Station', padSeconds: 150, sources: [LN, LK, 'nasa-img-cassini-launch'],
      photos: [
        { from: -120, src: '/missions/launch/KSC-97PC1541.jpg', nasaId: 'KSC-97PC1541', title: 'The service tower rolls away from the Titan IVB/Centaur carrying Cassini', date: 'Oct. 14, 1997', credit: 'NASA (Kennedy Space Center)' },
        { from: -2, src: '/missions/launch/PIA01051.jpg', nasaId: 'PIA01051', title: 'Liftoff of the Titan IVB/Centaur with Cassini and Huygens', date: 'Oct. 15, 1997', credit: 'NASA/JPL/KSC' },
        { from: 25, src: '/missions/launch/PIA00748.jpg', nasaId: 'PIA00748', title: 'A seven-year journey to Saturn begins', date: 'Oct. 15, 1997', credit: 'NASA/JPL/KSC' },
      ],
    },
    overview: [{ dist: 7, elev: 68 }, { fromMs: Date.UTC(2004, 5, 25), dist: 0.012, elev: 35 }],
    frames: [{ fromMs: Date.UTC(2004, 5, 25), track: 'spacecraft-saturn', centre: { name: 'Saturn', radiusKm: 60268, surface: 'cloud tops (1-bar level, equatorial radius)' } }],
    instruments: CASSINI_INSTRUMENTS,
    layers: [
      { name: 'Spacecraft', kind: 'nasa-model', note: 'NASA 3D Resources "Cassini-Huygens (A)", unchanged.' },
      { name: 'Launch', kind: 'nasa-model', note: 'NASA photographs of the launch (NASA/JPL/KSC).' },
      { name: 'Stars', kind: 'nasa-model', note: 'NASA SVS Deep Star Maps 2020, placed by J2000 coordinates.' },
      { name: 'Trajectory', kind: 'trajectory', note: 'JPL Horizons -82 reconstruction; Huygens -150 predicted descent.' },
      { name: 'Attitude', kind: 'reconstructed', note: 'High-gain antenna toward Earth; probe orientation reconstructed.' },
      { name: 'Saturn', kind: 'illustrative', note: 'Band colours from PIA06193; hexagon outline reconstructed.' },
      { name: 'Rings', kind: 'model', note: 'NASA NSSDCA radii and optical depths.' },
      { name: 'Plumes', kind: 'visualisation', note: 'Enceladus’ jets, illustrative.' },
    ],
  },
  conclusion: {
    title: 'The end of Cassini',
    text: 'On Sept. 15, 2017 Cassini entered Saturn’s atmosphere, sending data to the end. It had made 294 orbits, 127 targeted Titan flybys and 23 targeted Enceladus flybys, and taken 453,048 images.',
    sources: [QF, HZ, GF],
  },
}
