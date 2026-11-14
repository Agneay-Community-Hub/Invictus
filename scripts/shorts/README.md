# Ghost Shorts pipeline

Cartoon shorts of the machines, made with Blender, ffmpeg and the Windows built-in voices. No downloads are needed.

## Every machine: `make_shorts.py`

```bash
python scripts/shorts/make_shorts.py                  # every machine without a short yet
python scripts/shorts/make_shorts.py spirit ranger7   # just these
python scripts/shorts/make_shorts.py --force spirit   # remake one
```

For each machine it:

1. Takes the narration from `site/js/data.js`: the machine's ghost log (split into up to five beats), then its epitaph. These texts are already checked against NASA records, so the shorts say nothing the site doesn't. A few words are respelled for the voice only (for example "km/h" is read as "kilometres an hour"); the subtitles keep the original.
2. `voice_lines.ps1` speaks each line (David or Zira) and measures it.
3. `build_short.py` builds a toon-shaded, ink-outlined scene in Blender from the machine's entry in `SPECS` (its model, a Moon, Mars or deep-space setting, and how it arrives: engines, airbags, parachute, already parked, or flying in). The ending follows the machine's status in `data.js`: it falls silent and glows pale blue, crashes (flash, crater and a ghost rising), is lost, or keeps sending radio rings home if it's still working.
4. Renders at 12 frames a second ("on twos", like hand-drawn cartoons), about 0.35 s a frame with Eevee.
5. Adds the narration, sound effects, title card, date-and-place caption and end card, and writes `site/assets/video/<id>.mp4` (720p, H.264), a poster `.jpg` and `.vtt` subtitles.
6. Rewrites the `SHORTS` list in `site/js/shorts.js`, which the Shorts page and the dossiers' "Watch its cartoon short" button read.

Set `SHORTS_WORK` to choose where the frames go (default: a `goe_shorts` folder in the temp directory), and `BLENDER` if Blender isn't on the PATH. To add a new machine, give it an entry in `SPECS`.

## The Viking 1 pilot

Viking 1 was made by hand first, with its own scene and sound design:

1. `powershell -File voice.ps1 -Out <work>`
2. `blender -b --factory-startup --python build_viking.py -- <work>`
3. `blender -b <work>/viking.blend -a`
4. `python assemble.py <work> site`

Videos are kept out of the offline cache (`scripts/build-sw.mjs`).
