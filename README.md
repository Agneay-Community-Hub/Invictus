# Ghosts of Exploration — *Abandoned but not Forgotten*

NASA Space Apps Challenge 2026 entry. It's an interactive story archive, for ages 8–14 and casual space fans, about the hardware NASA left on the Moon and Mars and the probes it sent into deep space.

## Run it

```bash
python serve.py
```
Then open http://localhost:5173. The server turns off browser caching.

## Live site

https://agneay-community-hub.github.io/PROJECT-AREA-51/

GitHub Pages publishes the `site/` folder automatically on every push to `main` that changes it, using `.github/workflows/pages.yml`. You can also re-run it by hand from the repo's **Actions** tab. `netlify.toml` is kept in case you ever want to host on Netlify instead.

## What's inside

| Section | What it does |
|---|---|
| **Ghost Map** | Moon and Mars maps with every artifact at its real latitude and longitude. You can zoom with the + and − buttons, by double-clicking, with ctrl+scroll, or with the "Zoom to Apollo sites" and "Zoom to Jezero" presets. When zoomed in you can drag the map. Labels are spread out automatically so they don't overlap. A searchable, filterable list sits beside the map. |
| **Dossier** (slide-over) | Each machine has a first-person **Ghost Log**, a story at Explorer level (ages 8–11) or Scientist level (12+), a "planned vs. what happened" comparison, numbers, dates, discoveries, what was left behind, why it matters today, a fun fact, a NASA video, and links to the original NASA records. |
| **Ghost Logs** | 12 short story chapters you can step through with the ← → keys. Each one can be read aloud. |
| **Timeline** | Artifacts grouped by decade from 1964 to 2021, with a filter by world. |
| **Deep Space** | A log-scale ruler showing Pioneer 10/11, Voyager 1/2 and New Horizons at *estimated* distances for today's date, plus how long a signal takes to cross that distance. |
| **Who Am I? quiz** | 8 random clue questions. |
| **Archive** | All NASA photos with their NASA IDs, plus 6 NASA videos. |
| **Explorer Passport** | 8 badges, saved in localStorage. The badge art comes from your Fantasy RPG UI Kit. |
| **NASA 3D models** | 18 machines have a "🧊 View 3D model" button, both in their dossier and in 3D Explore. You can spin and zoom the official NASA model, and phones get "View in your space" (AR). Models are listed below. |
| **3D Explore** (`explore.html`) | Moon and Mars globes you can spin, with clickable beacons. A Deep Space scene shows the Sun, the planet orbits, the heliopause and each probe's direction and distance. It works on phones too. |

**Accessibility:** Atkinson Hyperlegible font, 4 text sizes, a dyslexia-friendly spacing option, a reduce-motion toggle (it also follows the OS setting), read-aloud through the browser's speech synthesis, full keyboard support (Esc and Tab are trapped inside dialogs), and alt text and ARIA labels. A list view gives the same information as the map.

**Accuracy:** the ghost logs are written in the first person, but every fact comes from NASA mission records. Myths are corrected on the page. For example, Opportunity's "my battery is low" line is labelled as a journalist's paraphrase, and Surveyor 3's "bacteria" story is labelled as likely contamination.

## Files
```
site/
  index.html        2D site
  explore.html      3D mode
  css/style.css, css/explore.css
  js/data.js        ← ALL artifact content (edit facts/stories here)
  js/app.js         2D logic
  js/explore.js     3D logic (Three.js 0.160)
  assets/nasa/      54 NASA images (resized to ≤1400px), named by NASA ID
  assets/maps/      moon.jpg (NASA SVS), mars.jpg, stars.jpg, earth.jpg (Solar System Scope, CC BY 4.0)
  assets/ui/        badge icons cut out from Fantasy_Rpg_UI_Kit
  assets/models/    12 NASA GLB models (~19 MB), from NASA 3D Resources
  js/models.js      shared 3D model viewer (Google <model-viewer> 3.5.0, loaded only on first use)
```

## NASA 3D models (github.com/nasa/NASA-3D-Resources)

| File | Used for |
|---|---|
| apollo-lm.glb | Apollo 11, 12, 14 (the lunar module; only its descent stage stayed) |
| saturn-v.glb | Apollo 16 S-IVB stage |
| viking-lander.glb | Viking 1 and 2 |
| mer.glb | Spirit and Opportunity (a simple, low-detail model) |
| insight.glb | InSight (arm deployed) |
| ingenuity.glb | Ingenuity |
| ladee.glb | LADEE |
| pioneer.glb | Pioneer 10 and 11 |
| voyager.glb | Voyager 1 and 2 |
| near.glb | NEAR Shoemaker |
| deep-impact.glb | Deep Impact |
| curiosity.glb | Curiosity. I converted it from NASA's `.blend` file with Blender 5.1, removing the helper boxes, the floor plane and the camera-marker cubes. Its mast is shown folded down. |

NASA doesn't publish models of the Lunar Roving Vehicle, Surveyor, Ranger, Sojourner/Pathfinder, Phoenix, GRAIL or LCROSS. To add a model, put the `.glb` in `assets/models/` and add a line to `MODELS` in `js/data.js`.
To add an artifact, add an object to `ARTIFACTS` in `js/data.js`. The map, list, timeline, quiz, 3D view and badges all pick it up automatically.

## NASA media used (images.nasa.gov)

**Moon:** PIA02975 (Ranger 7), PIA12910 (Surveyor 1 from LRO), AS12-48-7133 (Surveyor 3 + Apollo 12), PIA12903, as11-40-5948 / 5903 / 5875 (Apollo 11), as14-66-9337 (golf ball), as15-86-11603 (LRV-1), as16-113-18339 (Apollo 16), as17-137-20979 / as17-147-22548 / as17-152-23272 (Apollo 17), GSFC_20171208_Archive_e000501 (S-IVB crater), ARC-2009-ACD09-0220-126 (LCROSS), PIA16493 (GRAIL).

**Mars:** PIA00563 / PIA00565 / PIA00567 (Viking 1), PIA00573 (Viking 2), PIA01121 / PIA01551 (Pathfinder and Sojourner), PIA04016 (Polar Lander), PIA12203 / PIA12337 / PIA05040 (Spirit), PIA22222 / PIA16120 / PIA22329 / PIA22908 (Opportunity), PIA10906 / PIA10701 / PIA22223 (Phoenix), PIA25287 / PIA22956 / PIA25680 (InSight), PIA26244 / PIA26236 / PIA26482 (Ingenuity), PIA25218 (backshell), PIA16239 (Curiosity).

**Deep space:** ARC-1972-AC72-2135 (Pioneer 10), ARC-1974-A74-9030-1 (Pioneer 11), PIA00452 (Pale Blue Dot), PIA14113 (Golden Record), PIA17049 (Voyager), PIA02473 (Eros), PIA02137 (Tempel 1), PIA20200 (Pluto).

**Videos (streamed):** Apollo 11 Restored Moonwalk; *Apollo 15: Never Been on a Ride like this Before*; *Mars Report: Ingenuity*; *First Likely Marsquake Heard by InSight*; *InSight Captures Sound of a Meteoroid*; *Voyager 1 Team Reacts to Receiving Engineering Data*.

## Credits
- Photos and videos: NASA Image and Video Library (public domain; NASA does not endorse this project).
- Moon texture: NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC).
- Mars, star and Earth textures: Solar System Scope (CC BY 4.0).
- Badge art: Fantasy RPG UI Kit (supplied asset pack).
- 3D models: NASA 3D Resources (public domain).
- 3D: Three.js (MIT) and Google model-viewer (Apache 2.0).
