"""Assemble the Viking 1 short: frames + narration + sound effects + title cards -> MP4, poster, VTT."""
import json, os, subprocess, sys
D = sys.argv[1]; SITE = sys.argv[2]
V = json.load(open(os.path.join(D, "voice.json"), encoding="utf-8-sig"))
T = json.load(open(os.path.join(D, "timing.json")))
beats, END = T["beats"], T["end"]
os.makedirs(os.path.join(SITE, "assets", "video"), exist_ok=True)
out = os.path.join(SITE, "assets", "video", "viking1.mp4")
FONT = "C\\:/Windows/Fonts/impact.ttf" if os.path.exists("C:/Windows/Fonts/impact.ttf") else "C\\:/Windows/Fonts/arialbd.ttf"
BODY = "C\\:/Windows/Fonts/arialbd.ttf"

# ---- sound: narration at each beat, a wind bed, a landing thump, radio beeps, static at the wrong command ----
inputs = ["-framerate", "24", "-i", os.path.join(D, "frames", "f_%04d.png")]
for i in range(len(beats)): inputs += ["-i", os.path.join(D, f"line{i + 1}.wav")]
n = len(beats)
af = []
for i, (a, b) in enumerate(beats):
    ms = int((a + .3) * 1000)
    af.append(f"[{i + 1}:a]aformat=channel_layouts=mono,adelay={ms},volume=1.6[v{i}]")
af.append(f"anoisesrc=d={END:.2f}:c=brown:a=0.5,lowpass=f=420,volume=0.12,afade=t=in:d=2,afade=t=out:st={END - 2:.2f}:d=2[wind]")
t2 = beats[1][0]
af.append(f"sine=f=52:d=0.6,volume=1.4,afade=t=out:d=0.6,adelay={int(t2 * 1000)}[thump]")
b3 = beats[2]
beeps = "+".join(f"between(t,{b3[0] + .5 + k * 1.2:.2f},{b3[0] + .62 + k * 1.2:.2f})" for k in range(int((b3[1] - b3[0] - .6) / 1.2)))
af.append(f"sine=f=880:d={END:.2f},volume='0.10*({beeps})':eval=frame[beep]")
b4 = beats[3]
af.append(f"anoisesrc=d=1.1:c=white:a=0.25,highpass=f=1500,afade=t=out:d=1.1,adelay={int((b4[0] + 1.6) * 1000)}[stat]")
mixins = "".join(f"[v{i}]" for i in range(n)) + "[wind][thump][beep][stat]"
af.append(f"{mixins}amix=inputs={n + 4}:normalize=0:duration=longest,atrim=0:{END:.2f},alimiter=limit=0.9[aout]")

# ---- picture: title card, the years flying by, and an end card ----
def dt(text, x, y, size, color, start, end, font=FONT, box=False):
    t = text.replace(":", "\\:").replace("'", "\u2019")
    b = ":box=1:boxcolor=black@0.55:boxborderw=18" if box else ""
    return (f"drawtext=fontfile='{font}':text='{t}':x={x}:y={y}:fontsize={size}:fontcolor={color}:borderw=4:bordercolor=black{b}"
            f":alpha='if(lt(t,{start}),0,if(lt(t,{start}+0.4),(t-{start})/0.4,if(lt(t,{end}-0.4),1,if(lt(t,{end}),({end}-t)/0.4,0))))'")
vf = [dt("GHOST SHORTS", "(w-text_w)/2", "h*0.30", 96, "0xFFD23F", 0.2, 3.4),
      dt("Viking 1 · Facing the Wrong Way", "(w-text_w)/2", "h*0.30+120", 54, "white", 0.5, 3.4),
      dt("July 20, 1976 · Chryse Planitia, Mars", "40", "h-90", 34, "white", beats[1][0] + .2, beats[1][0] + 3.6, BODY, True),
      dt("November 1982", "40", "h-90", 34, "white", beats[3][0] + .2, beats[3][0] + 3.4, BODY, True)]
b5 = beats[4]; years = [1985, 1990, 1997, 2004, 2006, 2012, 2021, 2026]
step = (b5[1] - b5[0]) / len(years)
for k, y in enumerate(years):
    vf.append(dt(str(y), "w-text_w-50", "50", 78, "0xFFD23F", b5[0] + k * step, b5[0] + (k + 1) * step + .15))
vf.append(dt("Still here.", "(w-text_w)/2", "h*0.16", 72, "white", END - 4.2, END))
vf.append(dt("Ghosts of Exploration", "(w-text_w)/2", "h-80", 34, "0xFFD23F", END - 3.4, END, BODY))
vf.append(f"fade=t=in:st=0:d=0.6,fade=t=out:st={END - .8:.2f}:d=0.8")

cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(af) + f";[0:v]{','.join(vf)}[vout]",
       "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-t", f"{END:.2f}", out]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode: print(r.stderr[-3000:]); sys.exit(1)

# poster frame and subtitles
subprocess.run(["ffmpeg", "-y", "-ss", f"{beats[2][0] + 3:.2f}", "-i", out, "-frames:v", "1", "-q:v", "4", os.path.join(SITE, "assets", "video", "viking1.jpg")], capture_output=True)
def ts(s): return f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{s % 60:06.3f}"
vtt = ["WEBVTT", ""]
for i, ((a, b), line) in enumerate(zip(beats, V["lines"])):
    vtt += [str(i + 1), f"{ts(a + .3)} --> {ts(a + .3 + V['durations'][i])}", line, ""]
open(os.path.join(SITE, "assets", "video", "viking1.vtt"), "w", encoding="utf-8").write("\n".join(vtt))
print("OK", out, os.path.getsize(out) // 1024, "KB", f"{END:.1f}s")
