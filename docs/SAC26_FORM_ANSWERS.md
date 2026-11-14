# NASA SAC '26 Virtual Participants: form answers

Paste each section into the matching field of the form. The text under each heading is plain text, so it pastes cleanly into Google Forms.

**PPT field:** upload `docs/pitch-deck.pptx` (PowerPoint, 12 slides), or `docs/pitch-deck.pdf` (same slides) if the form wants a PDF. The same deck is online at https://agneay-community-hub.github.io/Invictus/pitch.html

---

## Abstract

Ghosts of Exploration is a free, story-driven website about the machines NASA left behind: 49 rovers, landers, Moon cars, science stations and probes on the Moon, on Mars and across the solar system, from Vanguard 1 (1958) to Ingenuity. Each machine tells its own story in a first-person "ghost log" built from real NASA mission facts. Visitors start with Echo's journey, a 5-minute narrated story told by Echo, the last radio message a spacecraft ever sends home. Kids aged 8 to 14, teachers and space fans can then find the machines on a map at their true coordinates, walk 14 real landing sites in 3D, and meet every machine as a cartoon short, a comic and a podcast episode, then play games and follow the far probes live. It works offline, in English, Spanish and Hindi, with no sign-up and no tracking.

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
A website built around one sourced archive of 49 machines. It opens with Echo's journey: a 5-minute guided story in 9 narrated scenes, from the Moon to interstellar space, with captions always on. Every machine has a dossier with its ghost log, its story at two reading levels (ages 8 to 11 and 12+), planned versus actual results, discoveries, what was left behind, NASA photos and videos, and links to NASA and NSSDCA records. The same archive powers:
- Explore: the Ghost Map at true coordinates, 14 landing sites in 3D on measured terrain, 3D Explore, NASA Eyes, a live tracker for Voyager 1 and 2, Pioneer 10 and 11 and New Horizons, "The Moon tonight" (which Apollo sites are in sunlight right now), a timeline, and "Scroll to Voyager" (the solar system at true scale).
- Stories: Echo's journey, Ghost Shorts (a cartoon short for all 49 machines, made in Blender and narrated with each ghost log), Ghost Comics (a flip-book comic for every machine), and the Ghost Logs podcast (six seasons narrated by instruments such as Voyager's, InSight's "mole" and Cassini's, plus an episode for every machine).
- Play: every game in one Play section: a landing game with real gravity (Moon, Mars or Jezero crater), a Mars driving game with real signal delay, Build a probe (design a spacecraft in 3D and watch it survive or fail), Ghost Cards, the Who am I? quiz and puzzles to print.
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
- Cartoon shorts are generated from the archive: one reusable script builds a Blender scene for each machine and renders it in about 3 minutes on a laptop. All 49 are done.
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
- Echo's journey: the whole archive in a 5-minute guided story, narrated with captions, over real NASA photos.
- Ghost Shorts: 49 cartoon shorts, one for every machine, made with Blender, with narration and subtitles.
- Ghost of the day, Future ghosts (machines on their way), and Adopt a Ghost certificates.

PLAY AND LEARN
- A Play section with every game: Land it yourself, Drive on Mars with real signal delay, Build a probe (a 3D spacecraft builder with damage effects), Ghost Cards, the Who am I? quiz page and a passport of badges.
- Dossiers with a full-screen reading mode, "This story, three ways" cards, and a Back button that returns to wherever you came from.
- Teacher pack (3 NGSS-linked lesson plans, 4 worksheets with an answer key, a projector quiz), activity sheets, a wall poster, a glossary, open data (CSV and JSON) and an embed code for other websites.
- Ask the Archive, with an optional AI guide.
- Site-wide search, compare two machines, a guided tour for first visits and a "Start here" path.

FOR EVERYONE
- English, Spanish and Hindi on the main pages, with read-aloud.
- Accessibility settings, works on phones, works offline, free, no sign-up and no tracking.

---

## Future Implementation Plan

Our plan for the next 48 hours. Every change goes live on the website about a minute after we make it, so each step is small enough to finish in its time block.

HOURS 0–12: POLISH WHAT JUDGES SEE
- Fix anything judges or testers report, live within minutes.
- Submit the sitemap to Google Search Console so all 147 machine pages get indexed.
- Run a speed and accessibility check on the main pages and fix what it finds.

HOURS 12–24: INTO A REAL CLASSROOM
- Run Echo's journey and the Who am I? quiz with a local class, and collect what the children say.
- Share the teacher pack with teachers and collect feedback through a short form.
- Add the Ghost Calendar (on-this-day anniversaries for every machine), which is already built on a branch.

HOURS 24–48: MORE VOICES, MORE LANGUAGES
- Fluent speakers review the Spanish and Hindi text.
- Bring Echo's journey to Spanish and Hindi.
- Record real voices for Echo and the first podcast episodes, replacing the computer voices.
