/**
 * GHOSTS OF EXPLORATION (added for the merged site; not in the original repo).
 * The mission catalogue and the landing sites, as plain data for the main site's own pages
 * (site/catalogue.html and site/landings.html). scripts/build-atlas-data.mjs bundles this file and writes
 * site/js/atlas-data.js, so those pages always match this app's sourced catalogue.
 */
import { MISSIONS, OBJECTS, SOURCES, CATALOG_VERSION } from '../missions'
import { SURFACE_SITES, UNITY_SITES } from '../surface/sites'

const objectsOf = (missionId: string) =>
  OBJECTS.filter((o) => o.missionId === missionId).map((o) => ({
    id: o.id,
    name: o.name,
    category: o.category,
    builtBy: o.builtBy,
    nasaHardware: o.nasaHardware,
    design: o.design,
    dimensions: o.dimensions,
    massKg: o.massKg,
    status: o.currentStatus,
    components: o.components.map((c) => c.name),
    findings: (o.findings ?? []).map((f) => f.text),
    sources: o.sources,
  }))

export const SITE_DATA = {
  version: CATALOG_VERSION,
  missions: MISSIONS.map((m) => ({
    id: m.id,
    name: m.name,
    agency: m.agency,
    partners: m.partners,
    nasaMission: m.nasaMission,
    nonNasaNote: m.nonNasaNote ?? null,
    target: m.target,
    launch: m.launch,
    arrival: m.arrival ?? null,
    landing: m.landing ?? null,
    end: m.end ?? null,
    status: m.status,
    landingSite: m.landingSite ?? null,
    actualDuration: m.actualDuration ?? null,
    summary: m.summary,
    milestones: m.milestones,
    objects: objectsOf(m.id),
  })),
  sources: SOURCES,
  sites: [
    ...SURFACE_SITES.filter((s) => s.available).map((s) => ({
      id: s.id,
      body: s.bodyId,
      name: s.name,
      missionIds: s.missionIds,
      lat: s.origin.latDeg,
      lon: s.origin.lonEastDeg,
      mode: 'walk',
      scene: s.daylight.label,
      summary: '',
      hardware: '',
      terrain: s.terrainProvenance,
      engine: 'three',
    })),
    ...UNITY_SITES.map((s) => ({
      id: s.id,
      body: s.bodyId,
      name: s.name,
      missionIds: s.missionIds,
      lat: s.origin.latDeg,
      lon: s.origin.lonEastDeg,
      mode: s.mode === 'rover' ? 'drive' : 'walk',
      scene: s.scene.label,
      summary: s.summary,
      hardware: s.hardware ?? '',
      terrain: s.terrainProvenance,
      engine: 'unity',
    })),
  ],
}
