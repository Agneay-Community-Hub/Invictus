# 3D Worlds (atlas/)

This folder is the frontend of **Abandoned but Not Forgotten**, by our teammate **GuruPrasannaa Manikandan**
(https://github.com/Agneay-Community-Hub/Abandoned-But-Not-Forgotten, MIT licence, see `LICENSE`).
It was copied from commit `129fcb6` (12 Nov 2026) so both projects ship as one website, and updated from commit
`42845b8` (14 Nov 2026), which added the Parker Solar Probe, Juno and Cassini-Huygens replays.

It is built into `site/atlas/` and appears on the main site as **3D Worlds**: walk the six Apollo sites, explore eight
Mars landing sites, and relive Apollo 11, Opportunity, Cassini-Huygens, Juno and Parker Solar Probe. The main site lists them on its own pages
(`landings.html`, `catalogue.html`); this app plays one at a time and then returns to the page you came from.

## Build

```bash
node scripts/build-atlas.mjs
```

The first run installs packages and downloads the pinned Mars Unity player (~100 MB, from the
`Abandoned-But-Not-Forgotten-Assets` release) into `atlas/unity-cache/`. `site/atlas/`, `atlas/node_modules/` and
`atlas/unity-cache/` are git-ignored; GitHub Pages builds them on every deploy (`.github/workflows/pages.yml`).

The backend (`/api`, live JPL Horizons comparison) is not part of the static site. That one feature reports it is
unavailable; everything else works.

## What we changed

Only four things, so updates from the original repo are easy to bring in:

1. **`vite.config.ts`**: builds into `../site/atlas` with a relative base, keeps the Unity player in `unity-cache/`,
   and rewrites the source's root paths (`'/assets/…'`, `` `/unity/…` ``) at build time so it runs from a sub-folder.
2. **`unity-player.json`**: `dir` points at `unity-cache/`, and both players (Mars, and Missions for Parker, Juno and
   Cassini) download from releases on this repo (Invictus). `vite.config.ts` also rewrites `/missions/…` paths.
3. **`src/embed/ghosts.ts`** (new) and one import in **`src/main.tsx`**: links such as
   `atlas/index.html?go=site&id=tranquility-base` open one feature directly (using the same calls as the app's own
   Home buttons), and a "← Home" button returns to the page you came from.
4. **`src/mars/marsBridge.ts`** (one line in `startMars`): passes the Unity player the real address of `mars-sites/`,
   also for the Victoria scene (with an empty site id), because the player otherwise looks for it at the site root.
   **`src/missions3d/bridge.ts`** (one line): the same for the Missions player (`base` = this app's folder, not `/`).
6. **`src/embed/site-data.ts`** (new): exports the mission catalogue and landing sites as plain data; the main site's
   `scripts/build-atlas-data.mjs` turns it into `site/js/atlas-data.js` for its Landing sites and Mission catalogue
   pages. The Missions window here keeps only Relive and Discovered.

Deep-link values: `go=site&id=` any Moon or Mars site id (`tranquility-base`, `apollo-12` … `apollo-17`,
`victoria-crater`, `mars-viking-1`, `mars-viking-2`, `mars-pathfinder`, `mars-spirit`, `mars-phoenix`, `mars-curiosity`, `mars-insight`; the `mars-` prefix may be left out);
`go=relive&id=apollo-11|mer-opportunity|cassini|juno|parker-solar-probe`; `go=missions`; `go=journey&id=moon|mars`. Without `go` (and after leaving a site
or a replay) the Missions window opens: there is no homepage or free Solar System view, and closing the window returns
to the main site.
The main site's buttons are in `site/js/atlas-links.js`.

## Updating from the original repo

Copy the new `frontend/` files over this folder (not `node_modules` or `dist`), then re-apply the four changes above
(`git diff` shows them) and run the build.

## The Missions player (Parker, Juno, Cassini)

The teammate's pinned Missions player could not be downloaded (its release repo is not public), so we built one from
the Unity project in `Abandoned-But-Not-Forgotten/unity/CosmicAtlas` (`MissionsBuild.Build`) and host it as the
`unity-missions-7b01e05647a9` release on this repo. It was built with Unity 6000.4.3f1 instead of the project's
6000.3.28f1, with `WebGLInput.captureAllKeyboardInput` set by name (the type is not visible to that build).
**Known issue:** in this build the spacecraft models do not draw (their part labels do); the planets, Sun, rings,
trajectories, timeline and read-outs all work. Rebuilding with Unity 6000.3.28f1 should fix it: replace the files in
`unity-cache/MissionsExplorer/Build/`, publish a new release and update `unity-player.json`.
