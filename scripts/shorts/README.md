# Ghost Shorts pipeline

Cartoon shorts of the machines, made with Blender, ffmpeg and the Windows built-in voices. No downloads are needed.

1. `powershell -File voice.ps1 -Out <work>`: speaks the narration lines into `line1.wav`, `line2.wav` and so on, and writes `voice.json` with their lengths.
2. `blender -b --factory-startup --python build_viking.py -- <work>`: builds the toon-shaded, ink-outlined scene, timed to the narration, and saves `viking.blend`.
3. `blender -b <work>/viking.blend -a`: renders the frames, about 0.25 s each with Eevee.
4. `python assemble.py <work> site`: adds the narration, wind, thump, beeps, title cards and year counter, and writes `site/assets/video/<id>.mp4` (720p, H.264), a poster `.jpg` and `.vtt` subtitles.

Then list the video in `site/js/shorts.js`. Videos are kept out of the offline cache (`scripts/build-sw.mjs`).
