"""Make Ghost Shorts for any machine in site/js/data.js.

  python scripts/shorts/make_shorts.py                 # every machine that doesn't have a short yet
  python scripts/shorts/make_shorts.py spirit ranger7  # just these
  python scripts/shorts/make_shorts.py --force spirit  # remake one
  python scripts/shorts/make_shorts.py --build-only spirit   # stop after building the .blend

The narration is the machine's own ghost log from data.js (already checked against
NASA records), one sentence or two per beat, then its epitaph. Each short gets a
scene from SPECS below (model, Moon/Mars/space setting, how it arrives and how its
story ends), is rendered with Blender Eevee at 12 fps ("on twos", like hand-drawn
cartoons), and assembled by ffmpeg into site/assets/video/<id>.mp4 with a poster
and subtitles. Afterwards it updates site/js/shorts-list.js.
Needs: Blender on PATH (or BLENDER env var), ffmpeg, Node, Windows speech voices.
"""
import json, os, re, shutil, subprocess, sys, tempfile, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SITE = os.path.join(ROOT, "site")
VIDEO = os.path.join(SITE, "assets", "video")
WORK = os.environ.get("SHORTS_WORK") or os.path.join(tempfile.gettempdir(), "goe_shorts")
BLENDER = os.environ.get("BLENDER") or shutil.which("blender") or next((p for p in ("C:/Program Files/Blender Foundation/Blender 5.1/blender.exe",) if os.path.exists(p)), "blender")
DAVID, ZIRA = "Microsoft David Desktop", "Microsoft Zira Desktop"

# ---- the worlds seen from space ----
JUPITER = {"r": 16, "colors": [(.85, .7, .5), (.6, .38, .25)], "bands": 4}
SATURN = {"r": 13, "colors": [(.92, .82, .58), (.75, .62, .4)], "bands": 3, "rings": True}
VENUS = {"r": 15, "colors": [(.95, .82, .5)]}
MARS = {"r": 14, "colors": [(.8, .38, .19)]}
MERCURY = {"r": 13, "colors": [(.55, .53, .5)]}
EARTHB = {"r": 15, "colors": [(.25, .5, .9), (.95, .97, 1.0)], "bands": 2}
NEPTUNE = {"r": 13, "colors": [(.3, .5, .95)]}
CERES = {"r": 10, "colors": [(.45, .44, .42)]}
EROS = {"r": 6, "colors": [(.62, .55, .45)], "lumpy": .12}
COMET = {"r": 4, "colors": [(.35, .32, .3)], "lumpy": .15, "coma": True}
PLUTO = {"r": 10, "colors": [(.85, .72, .55)]}

# model, setting, arrival, work, ending, extras, voice
SPECS = {
    "ranger7":     dict(model={"kind": "craft", "body": "cone", "panels": 2, "span": 2.2, "dish": .5, "dish_z": -.9}, setting="moon"),
    "surveyor1":   dict(model={"kind": "surveyor"}, setting="moon", voice=ZIRA),
    "surveyor3":   dict(model={"kind": "surveyor"}, setting="moon"),
    "apollo11":    dict(model={"kind": "lm"}, setting="moon", extras=["laser"]),
    "apollo12":    dict(model={"kind": "alsep"}, setting="moon", arrival="reveal", extras=["quake"]),
    "apollo14":    dict(model={"kind": "cart"}, setting="moon", arrival="reveal", work="drive", extras=["golf"]),
    "apollo15":    dict(model={"kind": "lrv"}, setting="moon", arrival="reveal", work="drive"),
    "apollo16":    dict(model={"kind": "lrv"}, setting="moon", arrival="reveal", work="drive", voice=ZIRA),
    "apollo17":    dict(model={"kind": "lrv"}, setting="moon", arrival="reveal", work="drive"),
    "sivb16":      dict(model={"kind": "stage", "style": "sivb"}, setting="moon"),
    "lcross":      dict(model={"kind": "stage", "style": "lcross"}, setting="moon", extras=["lead"], voice=ZIRA),
    "grail":       dict(model={"kind": "twins"}, setting="moon", voice=ZIRA),
    "ladee":       dict(model={"kind": "craft", "body": "hex", "color": "white", "scale": 1.0}, setting="moon"),
    "prospector":  dict(model={"kind": "craft", "body": "drum", "booms": [0, 120, 240]}, setting="moon"),
    "viking2":     dict(model={"kind": "viking"}, setting="mars", extras=["frost"]),
    "pathfinder":  dict(model={"kind": "pathfinder"}, setting="mars", arrival="airbag", extras=["sojourner"]),
    "sojourner":   dict(model={"kind": "rover", "style": "soj"}, setting="mars", arrival="reveal", work="drive", extras=["pathfinder"], voice=ZIRA),
    "polarlander": dict(model={"kind": "deck", "style": "polar"}, setting="mars", arrival="descent_fail"),
    "spirit":      dict(model={"kind": "rover", "style": "mer"}, setting="mars", arrival="airbag", work="drive", voice=ZIRA),
    "opportunity": dict(model={"kind": "rover", "style": "mer"}, setting="mars", arrival="airbag", work="drive", voice=ZIRA),
    "phoenix":     dict(model={"kind": "deck", "style": "phoenix"}, setting="mars", extras=["frost"], voice=ZIRA),
    "insight":     dict(model={"kind": "deck", "style": "insight"}, setting="mars", extras=["quake"], voice=ZIRA),
    "ingenuity":   dict(model={"kind": "heli"}, setting="mars", arrival="drop", work="hop", voice=ZIRA),
    "backshell":   dict(model={"kind": "backshell"}, setting="mars", arrival="chute"),
    "curiosity":   dict(model={"kind": "rover", "style": "msl"}, setting="mars", work="drive"),
    "pioneer10":   dict(model={"kind": "craft", "body": "hex", "dish": 1.4, "booms": [0, 180], "rtg": True}, setting="space", body=JUPITER),
    "pioneer11":   dict(model={"kind": "craft", "body": "hex", "dish": 1.4, "booms": [0, 180], "rtg": True}, setting="space", body=SATURN),
    "voyager1":    dict(model={"kind": "craft", "body": "oct", "color": "metal", "dish": 1.8, "booms": [200, 340, 90], "rtg": True}, setting="space"),
    "voyager2":    dict(model={"kind": "craft", "body": "oct", "color": "metal", "dish": 1.8, "booms": [200, 340, 90], "rtg": True}, setting="space", body=NEPTUNE),
    "near":        dict(model={"kind": "craft", "body": "oct", "panels": 4, "span": 1.6, "dish": .7}, setting="space", body=EROS, touchdown=True),
    "deepimpact":  dict(model={"kind": "craft", "body": "hex", "color": "copper", "scale": .8}, setting="space", body=COMET),
    "newhorizons": dict(model={"kind": "craft", "body": "hex", "dish": 1.1, "booms": [210], "rtg": True}, setting="space", body=PLUTO),
    "messenger":   dict(model={"kind": "craft", "body": "box", "panels": 2, "span": 1.8, "sunshade": True}, setting="space", body=MERCURY, voice=ZIRA),
    "pioneervenus": dict(model={"kind": "venusprobes"}, setting="space", body=VENUS, voice=ZIRA),
    "galileo":     dict(model={"kind": "craft", "body": "tall", "dish": 1.2, "dish_z": 1.3, "booms": [30, 150, 270], "rtg": True}, setting="space", body=JUPITER),
    "cassini":     dict(model={"kind": "craft", "body": "tall", "dish": 1.5, "dish_z": 1.3, "booms": [90]}, setting="space", body=SATURN, voice=ZIRA),
    "dawn":        dict(model={"kind": "craft", "body": "box", "panels": 2, "span": 4.0, "dish": .6}, setting="space", body=CERES, voice=ZIRA),
    "magellan":    dict(model={"kind": "craft", "body": "box", "panels": 2, "span": 1.8, "dish": 1.3, "dish_z": .9}, setting="space", body=VENUS, voice=ZIRA),
    "mariner9":    dict(model={"kind": "craft", "body": "oct", "panels": 4, "span": 1.4, "dish": .6}, setting="space", body=MARS),
    "mco":         dict(model={"kind": "craft", "body": "box", "panels": 1, "span": 2.6, "dish": .5}, setting="space", body=MARS, behind=True),
    "mgs":         dict(model={"kind": "craft", "body": "box", "panels": 2, "span": 2.0, "dish": .8}, setting="space", body=MARS),
    "vanguard1":   dict(model={"kind": "craft", "body": "ball"}, setting="space", body=EARTHB),
    "mariner2":    dict(model={"kind": "craft", "body": "hex", "panels": 2, "span": 1.6, "dish": .5}, setting="space", body=VENUS),
    "mariner4":    dict(model={"kind": "craft", "body": "oct", "panels": 4, "span": 1.4, "dish": .6}, setting="space", body=MARS),
    "isee3":       dict(model={"kind": "craft", "body": "drum", "booms": [0, 90, 180, 270]}, setting="space", body=COMET),
    "kepler":      dict(model={"kind": "craft", "body": "tube", "panels": 0}, setting="space", voice=ZIRA),
    "spitzer":     dict(model={"kind": "craft", "body": "tube", "panels": 0}, setting="space", voice=ZIRA),
    "stardust":    dict(model={"kind": "craft", "body": "box", "panels": 2, "span": 1.8, "capsule": True, "paddle": True}, setting="space", body=COMET, voice=ZIRA),
}
# where a deep-space machine's lower-third caption says it is
WHERE = {"pioneer10": "Jupiter", "pioneer11": "Saturn", "voyager1": "Interstellar space", "voyager2": "Interstellar space",
         "near": "Asteroid Eros", "deepimpact": "Comet Tempel 1", "newhorizons": "Pluto", "messenger": "Mercury",
         "pioneervenus": "Venus", "galileo": "Jupiter", "cassini": "Saturn", "dawn": "Ceres", "magellan": "Venus",
         "mariner9": "Mars", "mco": "Mars", "mgs": "Mars", "vanguard1": "Earth orbit", "mariner2": "Venus", "mariner4": "Mars",
         "isee3": "Comet Giacobini–Zinner", "kepler": "Orbit around the Sun", "spitzer": "Orbit around the Sun", "stardust": "Comet Wild 2"}

# ---- narration: what's said can differ a little from what's shown, so the voice reads it right ----
SAY = [(r"(\d) ?km/h", r"\1 kilometres an hour"), (r"(\d) ?km\b", r"\1 kilometres"), (r"\bS-IVB\b", "S four B"),
       (r"\bthe MET\b", "the M.E.T."), (r"…", ","), (r"—", ","), (r"–", " to "), (r"‘|’", "'"), (r"Ebb and Flow", "Ebb, and Flow"),
       (r"\bTempel\b", "Tempel"), (r"\bGCMS\b", "G C M S")]
def spoken(s):
    for a, b in SAY: s = re.sub(a, b, s)
    return s

def sentences(text):
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z‘'\"“0-9])", text.strip())
    out = []
    for p in parts:   # glue very short sentences to the previous one so each beat is long enough to show
        if out and (len(p) < 38 or len(out[-1]) < 30): out[-1] += " " + p
        else: out.append(p)
    while len(out) > 5:   # at most five story beats
        k = min(range(len(out) - 1), key=lambda i: len(out[i]) + len(out[i + 1])); out[k:k + 2] = [out[k] + " " + out[k + 1]]
    return out

def machines():
    js = "const fs=require('fs'),vm=require('vm');const c={};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8')+';globalThis.A=ARTIFACTS',c);process.stdout.write(JSON.stringify(c.A))"
    r = subprocess.run(["node", "-e", js, os.path.join(SITE, "js", "data.js")], capture_output=True, text=True, encoding="utf-8", check=True)
    return {a["id"]: a for a in json.loads(r.stdout)}

def clean(s): return re.sub(r"\s*\(.*?\)", "", s or "").strip()

def caption(a):
    arrive = clean(a["dates"].get("arrive", ""))
    if ":" in arrive: arrive = arrive.split(":", 1)[1].strip()
    arrive = arrive.split(" / ")[0]
    if a["world"] == "deep": where = WHERE.get(a["id"], "")
    else: where = re.split(r"[,(]", a.get("place") or "")[0].strip() + (", the Moon" if a["world"] == "moon" else ", Mars")
    return f"{arrive} · {where}" if arrive and where else (arrive or where)

def end_line(a):
    k = a["status"]
    if k in ("active",): return "Still going."
    if k == "retired": return "Still standing."
    if k == "impact": return "Gone, but not forgotten."
    if k == "lost": return "Never heard from again."
    return "Still out there." if a["world"] == "deep" else "Still here."

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)
    if r.returncode: raise RuntimeError(" ".join(map(str, cmd[:3])) + "\n" + (r.stdout or "")[-1500:] + (r.stderr or "")[-2500:])
    return r.stdout

def make(a, build_only=False):
    sid = a["id"]; spec = SPECS[sid]; d = os.path.join(WORK, sid)
    if os.path.isdir(d): shutil.rmtree(d)
    os.makedirs(os.path.join(d, "frames"))
    shown = sentences(a["ghost"]) + [a["epitaph"]]
    json.dump({"shown": shown, "spoken": [spoken(s) for s in shown]}, open(os.path.join(d, "lines.json"), "w", encoding="utf-8"), ensure_ascii=False)
    status = {"active": "active", "retired": "retired", "impact": "impact", "lost": "lost"}.get(a["status"], "silent")
    full = dict(id=sid, model=spec["model"], setting=spec["setting"], body=spec.get("body"), arrival=spec.get("arrival", "descent"),
                work=spec.get("work", "radio"), extras=spec.get("extras", []), ending=status, touchdown=spec.get("touchdown", False), behind=spec.get("behind", False))
    json.dump(full, open(os.path.join(d, "spec.json"), "w", encoding="utf-8"))
    run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", os.path.join(HERE, "voice_lines.ps1"), "-Out", d, "-Voice", spec.get("voice", DAVID)])
    run([BLENDER, "-b", "--factory-startup", "--python", os.path.join(HERE, "build_short.py"), "--", d])
    if build_only: return None
    run([BLENDER, "-b", os.path.join(d, "short.blend"), "-a"])
    return assemble(a, d, status)

def assemble(a, d, status):
    V = json.load(open(os.path.join(d, "voice.json"), encoding="utf-8-sig"))
    T = json.load(open(os.path.join(d, "timing.json")))
    beats, END, fin, work = T["beats"], T["end"], T["fin"], T["work"]
    sid = a["id"]; out = os.path.join(VIDEO, sid + ".mp4")
    FONT = "C\\:/Windows/Fonts/impact.ttf" if os.path.exists("C:/Windows/Fonts/impact.ttf") else "C\\:/Windows/Fonts/arialbd.ttf"
    BODY = "C\\:/Windows/Fonts/arialbd.ttf"
    world = a["world"]; n = len(beats)
    inputs = ["-framerate", str(T["fps"]), "-i", os.path.join(d, "frames", "f_%04d.png")]
    for i in range(n): inputs += ["-i", os.path.join(d, f"line{i + 1}.wav")]
    af, mix = [], []
    for i, (s, e) in enumerate(beats):
        af.append(f"[{i + 1}:a]aformat=channel_layouts=mono,adelay={int((s + .3) * 1000)},volume=1.6[v{i}]"); mix.append(f"[v{i}]")
    if world == "mars": af.append(f"anoisesrc=d={END:.2f}:c=brown:a=0.5,lowpass=f=420,volume=0.12,afade=t=in:d=2,afade=t=out:st={END - 2:.2f}:d=2[bed]")
    else: af.append(f"sine=f=55:d={END:.2f},volume=0.05,afade=t=in:d=2,afade=t=out:st={END - 2:.2f}:d=2[bed]")
    mix.append("[bed]")
    a1 = beats[0][1]
    if world != "deep" and status != "impact":
        af.append(f"sine=f=52:d=0.6,volume=1.4,afade=t=out:d=0.6,adelay={int(max(0, a1 - .3) * 1000)}[thump]"); mix.append("[thump]")
    w0, w1 = work
    k = int(max(0, (w1 - w0 - .6) / 1.4))
    if k:
        beeps = "+".join(f"between(t,{w0 + .5 + j * 1.4:.2f},{w0 + .62 + j * 1.4:.2f})" for j in range(k))
        af.append(f"sine=f=880:d={END:.2f},volume='0.08*({beeps})':eval=frame[beep]"); mix.append("[beep]")
    if status == "impact":
        hit = fin[0] + min(3.0 if world == "deep" else 2.5, (fin[1] - fin[0]) * (.7 if world == "deep" else .6))
        af.append(f"anoisesrc=d=1.6:c=brown:a=0.9,lowpass=f=300,afade=t=out:d=1.6,volume=1.6,adelay={int(hit * 1000)}[boom]"); mix.append("[boom]")
    if status in ("lost", "silent") and world != "moon":
        af.append(f"anoisesrc=d=1.1:c=white:a=0.2,highpass=f=1500,afade=t=out:d=1.1,adelay={int((fin[0] + 1.2) * 1000)}[stat]"); mix.append("[stat]")
    af.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0:duration=longest,atrim=0:{END:.2f},alimiter=limit=0.9[aout]")

    def dt(text, x, y, size, color, start, end, font=FONT, box=False):
        t = text.replace("\\", "").replace(":", "\\:").replace("'", "\u2019").replace("%", "\\%").replace(",", "\\,")
        b = ":box=1:boxcolor=black@0.55:boxborderw=18" if box else ""
        return (f"drawtext=fontfile='{font}':text='{t}':x={x}:y={y}:fontsize={size}:fontcolor={color}:borderw=4:bordercolor=black{b}"
                f":alpha='if(lt(t,{start}),0,if(lt(t,{start}+0.4),(t-{start})/0.4,if(lt(t,{end}-0.4),1,if(lt(t,{end}),({end}-t)/0.4,0))))'")
    name = a["name"]; size = 54 if len(name) < 30 else 44
    vf = ["fps=24", dt("GHOST SHORTS", "(w-text_w)/2", "h*0.30", 96, "0xFFD23F", 0.2, 3.0),
          dt(name, "(w-text_w)/2", "h*0.30+120", size, "white", 0.5, 3.0)]
    cap = caption(a)
    if cap: vf.append(dt(cap, "40", "h-90", 32, "white", beats[0][0] + .2, beats[0][0] + 3.8, BODY, True))
    vf.append(dt(end_line(a), "(w-text_w)/2", "h*0.14", 68, "white", END - 4.0, END))
    vf.append(dt("Ghosts of Exploration", "(w-text_w)/2", "h-80", 34, "0xFFD23F", END - 3.2, END, BODY))
    vf.append(f"fade=t=in:st=0:d=0.6,fade=t=out:st={END - .8:.2f}:d=0.8")
    cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(af) + f";[0:v]{','.join(vf)}[vout]",
           "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-crf", "29", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "80k", "-movflags", "+faststart", "-t", f"{END:.2f}", out]
    run(cmd)
    run(["ffmpeg", "-y", "-ss", f"{(work[0] + work[1]) / 2:.2f}", "-i", out, "-frames:v", "1", "-q:v", "4", os.path.join(VIDEO, sid + ".jpg")])
    def ts(s): return f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{s % 60:06.3f}"
    vtt = ["WEBVTT", ""]
    for i, ((s, e), line) in enumerate(zip(beats, V["lines"])):
        vtt += [str(i + 1), f"{ts(s + .3)} --> {ts(s + .3 + V['durations'][i])}", line, ""]
    open(os.path.join(VIDEO, sid + ".vtt"), "w", encoding="utf-8").write("\n".join(vtt))
    return {"title": name, "length": f"{round(END)} s", "kb": os.path.getsize(out) // 1024}

NL = chr(10)

def write_list(A):
    """Rewrite the SHORTS list in site/js/shorts.js: every short on disk, in data.js order."""
    entries = []
    for sid, a in A.items():
        mp4 = os.path.join(VIDEO, sid + ".mp4")
        if not os.path.exists(mp4): continue
        dur = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).strip() or 0)
        title = "Viking 1: Facing the Wrong Way" if sid == "viking1" else a["name"]
        entries.append(f'  {sid}: {{ title: {json.dumps(title, ensure_ascii=False)}, src: "assets/video/{sid}.mp4", poster: "assets/video/{sid}.jpg", vtt: "assets/video/{sid}.vtt", length: "{round(dur)} s" }}')
    p = os.path.join(SITE, "js", "shorts.js"); js = open(p, encoding="utf-8").read()
    a_, b_ = js.index("const SHORTS = {"), js.index("};", js.index("const SHORTS = {")) + 2
    js = js[:a_] + "const SHORTS = {   // written by scripts/shorts/make_shorts.py" + NL + ("," + NL).join(entries) + NL + "};" + js[b_:]
    open(p, "w", encoding="utf-8", newline=NL).write(js)
    return len(entries)

if __name__ == "__main__":
    args = sys.argv[1:]
    force = "--force" in args; build_only = "--build-only" in args
    ids = [x for x in args if not x.startswith("--")]
    A = machines()
    todo = ids or [i for i in A if i in SPECS and (force or not os.path.exists(os.path.join(VIDEO, i + ".mp4")))]
    os.makedirs(WORK, exist_ok=True); os.makedirs(VIDEO, exist_ok=True)
    failed = []
    for k, sid in enumerate(todo, 1):
        if sid not in SPECS: print("no scene for", sid); continue
        t0 = time.time()
        try:
            r = make(A[sid], build_only)
            what = "built" if r is None else "%s, %d KB" % (r["length"], r["kb"])
            print(f"[{k}/{len(todo)}] {sid}: {what} in {time.time() - t0:.0f}s", flush=True)
        except Exception as e:
            failed.append(sid); print(f"[{k}/{len(todo)}] {sid}: FAILED\n{e}", flush=True)
    if not build_only: print("shorts.js now lists", write_list(A), "shorts")
    if failed: print("FAILED:", " ".join(failed)); sys.exit(1)
