# NASA SAC '26 Virtual Participants: form answers

Paste each section into the matching field of the form. The text under each heading is plain text, so it pastes cleanly into Google Forms.

**PPT field:** upload `docs/pitch-deck.pdf` (10 pages, about 3 MB). The same deck is online at https://agneay-community-hub.github.io/Invictus/pitch.html

---

## Abstract

Ghosts of Exploration is a free, story-driven website about the machines NASA left behind: 49 rovers, landers, Moon cars, science stations and probes on the Moon, on Mars and across the solar system, from Vanguard 1 (1958) to Ingenuity. Each machine tells its own story in a first-person "ghost log" built from real NASA mission facts. Kids aged 8 to 14, teachers and space fans can find the machines on a map at their true coordinates, walk 14 real landing sites in 3D, read a comic for every machine, listen to an 85-episode podcast, watch cartoon shorts, play games and follow the far probes live. It works offline, in English, Spanish and Hindi, with no sign-up and no tracking.

Live site: https://agneay-community-hub.github.io/Invictus/

---

## Detailed Description with objective

PROBLEM
More than 180 tonnes of hardware rest on the Moon and several tonnes on Mars, and probes like Voyager and Pioneer are still sailing out of the solar system. Rovers, landers and probes that changed what we know went silent long ago, and their stories are locked inside technical records written for adults. Kids mostly hear about the missions that are still running.

OBJECTIVES
1. Preserve: record where every machine is, what it was meant to do, what it really did and how it ended, with sources.
2. Connect: show that today's missions stand on the shoulders of Surveyor, Viking, Spirit, Opportunity and many others.
3. Explain: show why missions end, including the ones crashed on purpose (Cassini, Galileo) to protect moons that might hold life.
4. Include: reach learners of every reading level, language and internet speed.

WHAT THE PROJECT IS
A website built around one sourced archive of 49 machines. Every machine has a dossier with its ghost log, its story at two reading levels (ages 8 to 11 and 12+), planned versus actual results, discoveries, what was left behind, NASA photos and videos, and links to NASA and NSSDCA records. The same archive powers:
- Explore: the Ghost Map at true coordinates, 14 landing sites in 3D on measured terrain, 3D Explore, NASA Eyes, a live tracker for Voyager 1 and 2, Pioneer 10 and 11 and New Horizons, "The Moon tonight" (which Apollo sites are in sunlight right now), a timeline, and "Scroll to Voyager" (the solar system at true scale).
- Stories: Ghost Comics (a flip-book comic for every machine), the Ghost Logs podcast (six seasons narrated by instruments such as Voyager's, InSight's "mole" and Cassini's, plus an episode for every machine), and Ghost Shorts (cartoon videos made in Blender).
- Play: Build a probe (design a spacecraft in 3D and watch it survive or fail), Ghost Cards, a Mars driving game with real signal delay, a landing game with real gravity, and a quiz.
- Learn: a teacher pack with NGSS-linked lesson plans, worksheets and an answer key, printable activity sheets, a wall poster, a glossary, open data downloads, and "Ask the Archive", which answers questions from the archive even offline.

WHO IT IS FOR
Children aged 8 to 14, their teachers, and anyone curious about space. It has two reading levels, read-aloud in every language, text-size and dyslexia-friendly settings, glossary pop-ups and keyboard support.

---

## Feasibility

The project is already built and running publicly, so its feasibility is proven rather than planned.

TECHNICAL
- A static website (HTML, CSS and JavaScript) hosted free on GitHub Pages. No servers or database, so hosting costs nothing.
- One data file drives the map, dossiers, comics, podcast episodes, worksheets, cards and search. A fact is corrected once and is right everywhere.
- It works offline as an installable app, which matters for classrooms with poor internet.
- 3D uses Three.js, Google's model-viewer and a Unity player for the landing sites. Large files (3D, video) load only when asked for.
- Every update automatically rebuilds the translations, 147 search-friendly machine pages, the sitemap and the offline file list.

CONTENT THAT SCALES
- Comics and podcast episodes are generated from each machine's dossier, so a new machine gets them automatically.
- Cartoon shorts render in Blender in about 5 minutes per video on a laptop, from a reusable script.
- Narration currently uses free, offline computer voices, and the scripts are ready for real recordings.
- The optional AI guide runs on free tiers behind a small Cloudflare Worker. Without it, the site still answers from its own archive.

ACCURACY AND SAFETY
- Facts come from NASA mission pages, NSSDCA records and the NASA Image and Video Library. Every photo keeps its NASA ID, the Sources page lists 95 sources, and 48 of 49 dossiers link to the machine's own NSSDCA record.
- Common myths are corrected, and estimates (such as live probe distances) are labelled as estimates.
- No sign-up, no tracking and no ads. The AI guide never asks for personal details.

RISKS AND MITIGATION
- Facts change (for example, Voyager instruments being switched off): dates live in one place and are checked against NASA pages.
- Robotic voices: scripts are ready for human recordings.
- Translation quality: the Spanish and Hindi were drafted with AI help and will be checked by fluent speakers.

---

## What is ALREADY done

All of the following is live at https://agneay-community-hub.github.io/Invictus/

ARCHIVE
- 49 machines on the Moon, on Mars and across the solar system, each with a first-person ghost log, a story at two reading levels, planned versus actual results, discoveries, what was left behind, an epitaph, NASA photos and videos, and NASA and NSSDCA source links.
- 30 pages and tools, plus 147 search-friendly machine pages in three languages.

EXPLORE
- Ghost Map with every machine at its true coordinates.
- 14 landing sites in 3D on measured Moon and Mars terrain, plus "relive a mission".
- 3D Explore, NASA Eyes on the Solar System, NASA 3D models (viewable in AR on phones).
- Live tracker for the five far travellers, "Scroll to Voyager" at true scale, "The Moon tonight", a timeline from 1958 to today, "Then and now" photo sliders, and 11 "How it worked" animations.

STORIES
- Ghost Comics: a flip-book comic for all 49 machines. Issue #1, "Facing the Wrong Way", is a hand-written 16-page story told by the Viking 1 Lander.
- Ghost Logs podcast: 85 episodes. Six seasons narrated by instruments (Voyager, InSight, Cassini, Opportunity, Kepler and the Apollo science stations) and Ghost Log Radio, an episode for every machine, with transcripts and quiz questions.
- Ghost Shorts: a cartoon video pilot of Viking 1, made with Blender, with narration and subtitles.
- Ghost of the day, Future ghosts (machines on their way), and Adopt a Ghost certificates.

PLAY AND LEARN
- Build a probe (a 3D spacecraft builder with damage effects), Ghost Cards, Drive on Mars with real signal delay, Land it yourself, a quiz and a passport of badges.
- Teacher pack (3 NGSS-linked lesson plans, 4 worksheets with an answer key, a projector quiz), activity sheets, a wall poster, a glossary, open data (CSV and JSON) and an embed code for other websites.
- Ask the Archive, with an optional AI guide.
- Site-wide search, compare two machines, a guided tour for first visits and a "Start here" path.

FOR EVERYONE
- English, Spanish and Hindi on the main pages, with read-aloud.
- Accessibility settings, works on phones, works offline, free, no sign-up and no tracking.

---

## Future Implementation Plan

NEXT MONTH
- Cartoon shorts for all 49 machines, using NASA 3D models where they exist.
- Real voice recordings for the podcast, and a podcast feed on Spotify and Apple Podcasts.
- Translate every page into Spanish and Hindi, reviewed by fluent speakers.

NEXT 3 MONTHS
- Pilot the site in classrooms and collect feedback from teachers and students.
- A full accessibility and speed audit.
- Mars clocks: whether it is day or night at every Mars machine, live.
- "Point your phone at the Moon": use the phone's sensors to find the Apollo sites in the real sky.

NEXT 6 TO 12 MONTHS
- Add machines as missions end, and follow the Artemis era as it happens.
- More languages, chosen with partner schools.
- A classroom challenge mode with team progress.
- Invite museums, planetariums and space clubs to embed the archive on their own websites.
