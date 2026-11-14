# Space Apps 2026 project submission: Ghosts of Exploration

Copy each section into the matching field on the Space Apps project page. Fill in or confirm the parts marked ✏️.

---

## Project name
**Ghosts of Exploration: Abandoned but not Forgotten**

## Challenge
Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars

## Team
✏️ Team name, members and roles.

## Links
- **Live project:** https://agneay-community-hub.github.io/Invictus/
- **Start here (5-minute story):** https://agneay-community-hub.github.io/Invictus/story.html
- **Code:** https://github.com/Agneay-Community-Hub/Invictus
- **Pitch deck (12 slides):** https://agneay-community-hub.github.io/Invictus/pitch.html, also `docs/pitch-deck.pptx` and `docs/pitch-deck.pdf`
- **Demo video (30 s):** ✏️ add the link after recording it with `docs/DEMO_VIDEO_SCRIPT.md`

## High-level summary
*(About 150 words.)*

Ghosts of Exploration gives a voice to 49 machines NASA left on the Moon, on Mars and across the solar system, for kids aged 8–14, classrooms and space fans. Visitors start with **Echo's journey**: Echo, the last radio message a spacecraft ever sends home, travels at the speed of light from the Moon to interstellar space and tells the whole story in 5 minutes. Then every machine can be met in its own way:
- a first-person **ghost log** built from NASA records, on a map at its true coordinates;
- a **cartoon short**, a **comic** and a **podcast** episode for every machine;
- **3D walks** on 14 real landing sites, and **games** with real gravity and signal delay.

Every story links the hardware to the science it made possible, and every fact is checked against NASA sources. The site is free, works offline, comes in English, Spanish and Hindi, and includes a teacher pack.

## How it answers the challenge

| The brief asks for | What we built |
|---|---|
| "Translate complex historical and scientific data into an engaging narrative" | Echo's 5-minute journey; a first-person ghost log and epitaph for all 49 machines |
| "An interactive map of the Moon with clickable ghost rovers" | The Ghost Map: every machine at its real latitude and longitude, each opening a dossier |
| "A digital graphic novel told from the perspective of a dormant Mars lander" | Ghost Comics: a comic for every machine. Issue #1 is narrated by the Viking 1 lander |
| "An audio podcast chronicling the final days of a deep space instrument" | Ghost Logs podcast: 85 episodes, six seasons narrated by instruments |
| "A short animated video" | Ghost Shorts: 49 cartoon shorts, one per machine |
| "Showing how these missions operated rather than listing facts" | 11 step-by-step "How it worked" animations, the landing game, and 3D walks on real terrain |
| "A clear connection between the engineering and the science" | Every dossier pairs "what was on board" and "how it worked" with "what it discovered" and "why it matters today" |
| "Accuracy is important throughout" | 95 cited sources, NSSDCA records for 48 of 49 machines, myths corrected on the page, estimates labelled |
| "What age group? How accessible?" | Ages 8–14 with two reading levels, read-aloud, captions, three languages, offline use |

## Project details

### What it does
- **Echo's journey (the front door):** a 5-minute guided story in 9 scenes over real NASA photos, narrated aloud with captions always on. Each scene shows one key fact and a link to go deeper. Voyager 1's distance and signal time are worked out live.
- **Ghost Map and dossiers:** Moon and Mars maps with every machine at its true coordinates. Each dossier has:
  - a first-person ghost log and an epitaph, plus its story at two reading levels (ages 8–11 and 12+);
  - "This story, three ways": its cartoon short, comic and podcast episode;
  - planned vs. what really happened, dates, discoveries, what was left behind and why it matters;
  - NASA photos and videos, a NASA 3D model for 22 machines (viewable in AR on phones), and "Check the facts" links to its NSSDCA record and sources;
  - a full-screen reading mode with a bar of section links.
- **Stories in every format:**
  - **Ghost Shorts:** 49 cartoon shorts, each narrated with the machine's ghost log and subtitled;
  - **Ghost Comics:** a flip-book comic for every machine;
  - **Ghost Logs podcast:** 85 episodes with transcripts.
- **Show how it worked:**
  - 11 step-by-step animations: airbags, the sky crane, rocket landings, impactors, laser mirrors, quakes, gravity assists and plunges into giant planets;
  - "Then & now" sliders comparing mission photos with later orbital views;
  - real recordings: Mars wind, Ingenuity's blades, a marsquake and Apollo 15 astronauts driving.
- **Go there in 3D:** walk the 6 Apollo sites and explore 8 Mars sites on measured terrain, relive Apollo 11 and Opportunity, spin Moon and Mars globes, and fly with NASA's Eyes on the Solar System.
- **Play:** land a spacecraft with real gravity (Moon, Mars or Jezero crater), drive a Mars rover with real signal delay, Ghost Cards, Build a probe, the Who am I? quiz, and puzzles to print.
- **Ask the Archive:** questions answered from the archive, offline and without AI. An optional mode uses Google's Gemini, restricted to the archive's facts.
- **Teacher pack:** three 45-minute lesson plans linked to NGSS standards, four printable worksheets with an answer key, and a projector quiz with team scores.
- **For space fans:** a live tracker for the far probes, "The Moon tonight", a timeline from 1958 to today, Adopt a Ghost certificates and open data downloads.

### How it works
- **A static website** (HTML, CSS and JavaScript) on GitHub Pages: no servers, no database, no hosting cost.
- **One data file** (`site/js/data.js`) drives the map, dossiers, comics, podcast, shorts, worksheets, cards, quiz and search, so a fact corrected once is right everywhere.
- **Cartoon shorts are generated from the data:** a script builds a toon-shaded Blender scene for each machine on the Moon, Mars or in space, narrated with its NASA-checked ghost log. The ending follows its status: silent, crashed, lost or still working.
- **3D:** Three.js, Google's model-viewer, and a Unity player for the Mars landing sites.
- **Offline:** a service worker saves the site for classrooms with poor internet.
- **Automatic builds:** every update rebuilds the translations, 147 search-friendly machine pages, the sitemap and the offline file list.

### Who it's for and why it matters
Kids usually hear only about active missions. This project gives the "retired" machines a voice, so learners see that today's discoveries stand on the shoulders of Surveyor, Viking, Spirit, Opportunity and many others. It also shows why missions end, sometimes on purpose: Cassini and Galileo were steered into their planets to protect moons that might hold life.

### Accessibility and inclusion
- English, Spanish and Hindi on the main pages, with read-aloud in each.
- Two reading levels, four text sizes and a dyslexia-friendly spacing option.
- Captions on every narrated story and short.
- Full keyboard support, alt text, and "reduce motion" respected.
- Works on phones, and offline once loaded.
- Free, with no sign-up, no ads and no tracking.

### Accuracy
- Facts come from NASA mission pages, NSSDCA records and the NASA Image and Video Library. Every photo keeps its NASA ID.
- The Sources page lists 95 sources, and 48 of 49 dossiers link to the machine's own NSSDCA record.
- Myths are corrected on the page. For example, Opportunity's "My battery is low and it's getting dark" was a journalist's summary of its final data, not a real message.
- Estimates, such as live deep-space distances, are labelled as estimates.

### Tools, languages and services
HTML, CSS, JavaScript, SVG and Canvas; Three.js 0.160; Google model-viewer 3.5; Unity WebGL; Blender 5.1 and ffmpeg (cartoon shorts); Python and Node.js (build scripts); Windows and browser text-to-speech (narration); GitHub Pages and GitHub Actions; an optional Cloudflare Worker with Google's Gemini API.

## Why it fits these awards
*(For your reference when presenting. Judges nominate projects; teams don't apply per award.)*
- **Best Storytelling:** one story told six ways. Echo's journey, 49 ghost logs and epitaphs, 49 cartoon shorts, 49 comics and 85 podcast episodes, all from the same checked facts.
- **Art & Technology:** cartoon shorts generated in Blender from the archive's data, the comic art, and Echo, an original character drawn in code.
- **Best Use of Data:** NSSDCA, the NASA Image and Video Library, LRO and HiRISE imagery, NASA 3D Resources and JPL orbital elements, combined into one sourced archive with open data downloads.
- **Best Use of Science:** step-by-step engineering animations, real recordings, myths corrected, and every claim traced to a source.
- **Global Connection:** three languages, offline-first for low-bandwidth classrooms, free, with no sign-up.
- **Most Inspirational:** stories of persistence and endings: Opportunity's 14 years from a 90-day plan, Voyager still talking, Cassini's last dive.

## NASA data used
- **NASA Space Science Data Coordinated Archive (NSSDCA):** https://nssdc.gsfc.nasa.gov — mission parameters, final status and resting places; 48 of 49 dossiers link to the machine's own NSSDCA record.
- **NASA Image and Video Library:** https://images.nasa.gov — 80 photos and 6 videos, each credited with its NASA ID (for example `as11-40-5903`, `AS12-48-7133`, `PIA22222`, `PIA25287`, `PIA00452`, `PIA21895`).
- **NASA 3D Resources:** https://github.com/nasa/NASA-3D-Resources — models for 22 machines, including the Apollo Lunar Module, Viking, InSight, Ingenuity, Voyager, Cassini and Curiosity (converted from NASA's Blender file).
- **Lunar Reconnaissance Orbiter (LROC) and HiRISE imagery and terrain:** orbital views of the hardware today, and the measured terrain under the 3D landing sites.
- **NASA Scientific Visualization Studio, CGI Moon Kit (LRO data):** https://svs.gsfc.nasa.gov/4720
- **NASA/JPL:** Eyes on the Solar System (embedded), and JPL orbital elements for planet positions.
- **NASA mission pages** for Apollo, Surveyor, Ranger, Viking, Mars Pathfinder, the Mars Exploration Rovers, Phoenix, InSight, Mars 2020 and Ingenuity, LCROSS, GRAIL, LADEE, Pioneer, Voyager, NEAR, Deep Impact, MESSENGER, Pioneer Venus, Galileo, Cassini, Dawn, Kepler, Spitzer, Stardust and New Horizons.

## Other data and resources
- Mars, star and Earth textures: Solar System Scope (CC BY 4.0), based on NASA data.
- Badge icons: Fantasy RPG UI Kit (asset pack supplied by the team).
- Fonts: Atkinson Hyperlegible and Space Grotesk (Google Fonts).
- 3D Worlds app: built by our teammate GuruPrasannaa Manikandan.

## Use of artificial intelligence
✏️ Review this wording and make sure it matches how your team worked.

- **Building the project:** we used Claude (Anthropic), through Claude Code, as a coding and writing assistant directed by our team. It helped write the website code and the scripts that generate the cartoon shorts, draft the stories and captions from NASA mission facts, translate the Spanish and Hindi drafts, and prepare these submission materials.

  ✏️ *Our team reviewed the facts against NASA sources.* (Keep this sentence only if it's true.)
- **In the project:** the optional "AI guide" on the Ask page uses Google's Gemini API, restricted to answering from the site's archive. The default guide on that page uses no AI.
- **Media:** all photos and videos are real NASA material. The cartoon shorts and Echo are made with code (Blender scripts and SVG drawings), not with image-generating AI. Narration uses the computer's built-in text-to-speech voices.

## References
- Challenge description: "Abandoned but not Forgotten" (NASA Space Apps Challenge 2026).
- NASA Space Science Data Coordinated Archive: https://nssdc.gsfc.nasa.gov
- NASA Image and Video Library: https://images.nasa.gov
- NASA 3D Resources: https://github.com/nasa/NASA-3D-Resources
- NASA SVS CGI Moon Kit: https://svs.gsfc.nasa.gov/4720
- NASA, "Recommendations to Space-Faring Entities: How to Protect and Preserve the Historic and Scientific Value of U.S. Government Lunar Artifacts" (2011).
