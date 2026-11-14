"""Ghost Shorts, general builder: one toon-shaded, ink-outlined scene for any machine.
Reads <work>/spec.json (written by make_shorts.py) and <work>/voice.json, builds the
scene timed to the narration, and saves <work>/short.blend ready to render.
  blender -b --factory-startup --python build_short.py -- <work>
The look (flat colour bands, ink outlines, ghostly blue glow at the end) matches
the Viking 1 pilot made by build_viking.py.
"""
import bpy, json, math, os, random, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1]
SPEC = json.load(open(os.path.join(OUT, "spec.json"), encoding="utf-8"))
VOICE = json.load(open(os.path.join(OUT, "voice.json"), encoding="utf-8-sig"))
FPS, PAD, TITLE, TAIL = 12, 0.7, 3.2, 2.6          # rendered "on twos" (12 fps), shown at 24 fps
random.seed(sum(map(ord, SPEC["id"])))
SET = SPEC["setting"]                               # moon | mars | space
END_KIND = SPEC["ending"]                           # silent | impact | lost | active | retired

# ---- beats: one per narration line ----
beats, t = [], TITLE
for d in VOICE["durations"]:
    beats.append((t, t + d + PAD)); t += d + PAD
END = t + TAIL
F = lambda s: int(round(s * FPS)) + 1
n = len(beats)
ARR = beats[0]                                      # arrival
CODA = beats[-1]                                    # the epitaph
FIN = beats[-2] if n >= 3 else beats[-1]            # the ending event (crash, silence...)
WORK = (ARR[1], FIN[0]) if n >= 4 else (ARR[1], max(ARR[1] + 1, FIN[0]))
json.dump({"beats": beats, "end": END, "fps": FPS, "title": TITLE, "fin": list(FIN), "work": list(WORK)},
          open(os.path.join(OUT, "timing.json"), "w"))

# ---- clean scene ----
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
sc = bpy.context.scene
sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = F(END)
sc.render.resolution_x, sc.render.resolution_y = 1280, 720
engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
sc.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_EEVEE_NEXT"
try: sc.eevee.taa_render_samples = 12
except Exception: pass
sc.view_settings.view_transform = "Standard"
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = os.path.join(OUT, "frames", "f_")

def find(node, ident):
    return next(s for s in list(node.inputs) + list(node.outputs) if s.identifier == ident)

def sock_key(sock, frame, value):
    sock.default_value = value
    sock.keyframe_insert("default_value", frame=frame)

# ---- materials (same recipe as the Viking pilot) ----
DUSTC = {"mars": (0.77, 0.42, 0.24, 1), "moon": (0.55, 0.55, 0.55, 1)}.get(SET, (0.5, 0.5, 0.5, 1))
CRAFT_MATS = []
def toon(name, rgb, emit=0.0, dust=None, craft=True):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree; nt.nodes.clear(); N = nt.nodes; L = nt.links
    out = N.new("ShaderNodeOutputMaterial")
    base = N.new("ShaderNodeRGB"); base.outputs[0].default_value = (*rgb, 1)
    dm = N.new("ShaderNodeMix"); dm.data_type = "RGBA"; dm.name = "Dust"
    find(dm, "Factor_Float").default_value = 0.0
    find(dm, "B_Color").default_value = dust or DUSTC
    L.new(base.outputs[0], find(dm, "A_Color"))
    diff = N.new("ShaderNodeBsdfDiffuse")
    s2r = N.new("ShaderNodeShaderToRGB"); L.new(diff.outputs[0], s2r.inputs[0])
    ramp = N.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = "CONSTANT"
    el = ramp.color_ramp.elements; el[0].position = 0.0; el[0].color = (0.38, 0.36, 0.42, 1); el[1].position = 0.18; el[1].color = (0.72, 0.70, 0.74, 1)
    e3 = el.new(0.5); e3.color = (1, 1, 1, 1)
    L.new(s2r.outputs[0], ramp.inputs[0])
    mul = N.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; find(mul, "Factor_Float").default_value = 1
    L.new(find(dm, "Result_Color"), find(mul, "A_Color")); L.new(ramp.outputs[0], find(mul, "B_Color"))
    em = N.new("ShaderNodeEmission"); L.new(find(mul, "Result_Color"), em.inputs[0]); em.inputs[1].default_value = 1.0
    ghost = N.new("ShaderNodeEmission"); ghost.inputs[0].default_value = (0.62, 0.78, 1, 1); ghost.inputs[1].default_value = 1.8
    mix = N.new("ShaderNodeMixShader"); mix.name = "Ghost"; mix.inputs[0].default_value = 0.0
    L.new(em.outputs[0], mix.inputs[1]); L.new(ghost.outputs[0], mix.inputs[2])
    if emit:
        glow = N.new("ShaderNodeEmission"); glow.inputs[0].default_value = (*rgb, 1); glow.inputs[1].default_value = emit
        add = N.new("ShaderNodeAddShader"); L.new(mix.outputs[0], add.inputs[0]); L.new(glow.outputs[0], add.inputs[1]); L.new(add.outputs[0], out.inputs[0])
    else:
        L.new(mix.outputs[0], out.inputs[0])
    if craft: CRAFT_MATS.append(m)
    return m

def flat(name, rgb, strength=1.0, alpha=None):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree; nt.nodes.clear(); N = nt.nodes; L = nt.links
    out = N.new("ShaderNodeOutputMaterial"); em = N.new("ShaderNodeEmission")
    em.inputs[0].default_value = (*rgb, 1); em.inputs[1].default_value = strength
    if alpha is not None:
        tr = N.new("ShaderNodeBsdfTransparent"); mix = N.new("ShaderNodeMixShader"); mix.name = "Alpha"
        mix.inputs[0].default_value = alpha
        L.new(tr.outputs[0], mix.inputs[1]); L.new(em.outputs[0], mix.inputs[2]); L.new(mix.outputs[0], out.inputs[0])
        try: m.surface_render_method = "BLENDED"
        except Exception: m.blend_method = "BLEND"
    else:
        L.new(em.outputs[0], out.inputs[0])
    return m

INK = flat("Ink", (0.05, 0.04, 0.03)); INK.use_backface_culling = True

def outline(obj, width):
    obj.data.materials.append(INK)
    mod = obj.modifiers.new("Outline", "SOLIDIFY")
    mod.thickness = width; mod.offset = 1; mod.use_flip_normals = True
    mod.material_offset = len(obj.data.materials) - 1; mod.use_rim = False

def last(): return bpy.context.active_object

INKW = [0.025]  # outline width, scaled per model
def place(obj, mat, parent=None, ink=True, w=None):
    obj.data.materials.append(mat)
    if ink: outline(obj, (w if w is not None else 1.0) * INKW[0])
    if parent: obj.parent = parent
    for p in obj.data.polygons: p.use_smooth = False
    return obj

def empty(name, parent=None, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None); sc.collection.objects.link(e)
    e.location = loc
    if parent: e.parent = parent
    return e

def cyl(r, d, loc, mat, parent, verts=16, rot=None, w=None, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d, location=loc)
    else: bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=d, location=loc)
    o = last()
    if rot: o.rotation_euler = rot
    return place(o, mat, parent, w=w)

def box(sx, sy, sz, loc, mat, parent, rot=None, w=None, ink=True):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = last(); o.scale = (sx, sy, sz)
    if rot: o.rotation_euler = rot
    return place(o, mat, parent, ink=ink, w=w)

def ball(r, loc, mat, parent, seg=16, scale=None, w=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=max(6, seg // 2), radius=r, location=loc); o = last()
    if scale: o.scale = scale
    return place(o, mat, parent, w=w)

def rod(a, b, r, mat, parent, w=0.5):
    a, b = Vector(a), Vector(b); v = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=r, depth=v.length, location=(a + b) / 2)
    o = last(); o.rotation_mode = "QUATERNION"; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(v)
    return place(o, mat, parent, w=w)

# ---- palette ----
WHITE = toon("White", (0.93, 0.91, 0.86)); GOLD = toon("Gold", (0.85, 0.64, 0.25))
METAL = toon("Metal", (0.55, 0.57, 0.6)); DARK = toon("Dark", (0.16, 0.16, 0.18))
PANEL = toon("Panel", (0.13, 0.2, 0.45)); COPPER = toon("Copper", (0.78, 0.42, 0.22))
ORANGE = toon("Orange", (0.95, 0.45, 0.15)); RED = toon("Red", (0.75, 0.18, 0.15)); BLUE = toon("Blue", (0.2, 0.3, 0.65))
MIRROR = toon("Mirror", (0.35, 0.42, 0.55), emit=0.4)

# =====================================================================
#   MODELS: each builds onto `root` (an empty) and returns a size hint
# =====================================================================
FLAMES, WHEELS, ROTORS = [], [], []

def legs3(root, top_r, top_z, foot_r, pad, mat=METAL, count=3, start=90):
    for k in range(count):
        a = math.radians(start + k * 360 / count)
        top = (math.cos(a) * top_r, math.sin(a) * top_r, top_z); foot = (math.cos(a) * foot_r, math.sin(a) * foot_r, pad * .5)
        rod(top, foot, .06 * max(1, pad / .3), mat, root)
        cyl(pad, .07, foot, WHITE, root, w=.6)

def engines(root, r, z, count=3, size=1.0):
    FL = flat("Flame", (1.0, 0.62, 0.2), 6.0)
    for k in range(count):
        a = math.radians(90 + k * 360 / count)
        bpy.ops.mesh.primitive_cone_add(vertices=14, radius1=.18 * size, radius2=0, depth=1.1 * size, location=(math.cos(a) * r, math.sin(a) * r, z))
        f = last(); f.rotation_euler[0] = math.pi; f.data.materials.append(FL); f.parent = root; f.scale = (0, 0, 0); FLAMES.append(f)

def m_viking(root):
    cyl(1.0, .45, (0, 0, 1.0), WHITE, root, verts=6); cyl(1.03, .07, (0, 0, 1.26), GOLD, root, verts=6)
    legs3(root, .85, .85, 1.75, .3)
    for sx in (-1, 1): box(.34, .34, .4, (sx * .5, .35, 1.55), DARK, root)
    for x, h in ((.25, .55), (-.05, .48)):
        cyl(.08, h, (x, -.62, 1.25 + h / 2), WHITE, root, w=.6); ball(.11, (x, -.62, 1.28 + h), DARK, root, seg=12, w=.6)
    box(1.0, .07, .07, (1.25, -.2, .75), METAL, root, rot=(0, .35, 0), w=.6); box(.22, .16, .12, (1.72, -.2, .5), METAL, root, w=.6)
    cyl(.05, 1.0, (-.5, -.3, 1.75), METAL, root, w=.5)
    cyl(.62, .22, (-.5, -.12, 2.3), WHITE, root, verts=28, rot=(math.radians(-70), 0, 0), r2=.08, w=.8)
    engines(root, .7, .25); return 2.0

def m_surveyor(root):
    for k in range(3):
        a = math.radians(90 + k * 120)
        rod((0, 0, 1.6), (math.cos(a) * 1.5, math.sin(a) * 1.5, .15), .05, METAL, root)
        cyl(.28, .08, (math.cos(a) * 1.5, math.sin(a) * 1.5, .1), WHITE, root, w=.6)
        rod((0, 0, .7), (math.cos(a) * .9, math.sin(a) * .9, .65), .04, METAL, root)
    box(.5, .5, .35, (.35, .3, .85), WHITE, root); box(.45, .4, .3, (-.35, .2, .85), GOLD, root)
    cyl(.05, 2.2, (0, 0, 2.0), METAL, root, w=.5)
    box(.9, .03, .7, (0, -.1, 3.05), PANEL, root, rot=(math.radians(25), 0, 0))
    box(.7, .03, .7, (.5, .2, 2.6), WHITE, root, rot=(math.radians(-30), 0, math.radians(40)))
    cyl(.14, .4, (-.55, -.45, .95), WHITE, root, rot=(math.radians(-20), 0, 0)); ball(.1, (-.55, -.6, 1.1), DARK, root, seg=10)
    engines(root, .5, .3, size=.8); return 1.8

def m_deck(root, style):   # Mars Polar Lander, Phoenix, InSight: a deck on three legs, two round solar panels
    cyl(1.0, .35, (0, 0, 1.0), WHITE if style != "polar" else GOLD, root, verts=6)
    legs3(root, .8, .85, 1.4, .26)
    for sx in (-1, 1): cyl(1.05 if style != "polar" else .0001, .05, (sx * 2.05, 0, 1.15), PANEL, root, verts=10, w=.6)
    if style == "polar":
        for sx in (-1, 1): box(1.3, .9, .04, (sx * 1.7, 0, 1.25), PANEL, root, rot=(0, sx * .3, 0))
    box(.25, .25, .3, (0, -.5, 1.35), WHITE, root); cyl(.05, .9, (.3, -.4, 1.6), METAL, root, w=.5); box(.25, .15, .18, (.3, -.4, 2.1), DARK, root)
    rod((-.4, -.7, 1.2), (-.8, -1.8, 1.5), .05, METAL, root); rod((-.8, -1.8, 1.5), (-.9, -2.3, .4), .05, METAL, root)
    box(.2, .2, .15, (-.9, -2.35, .3), METAL, root, w=.6)
    if style == "insight":
        ball(.5, (.9, -2.4, 0), WHITE, root, seg=20, scale=(1, 1, .75)); cyl(.62, .08, (.9, -2.4, .03), WHITE, root, verts=20)
    engines(root, .6, .3); return 2.4

def m_lm(root):
    cyl(1.7, 1.5, (0, 0, 1.7), GOLD, root, verts=8)
    for k in range(4):
        a = math.radians(45 + k * 90)
        rod((math.cos(a) * 1.5, math.sin(a) * 1.5, 2.2), (math.cos(a) * 3.0, math.sin(a) * 3.0, .2), .09, METAL, root)
        rod((math.cos(a) * 1.6, math.sin(a) * 1.6, 1.1), (math.cos(a) * 2.8, math.sin(a) * 2.8, .5), .05, METAL, root)
        cyl(.45, .1, (math.cos(a) * 3.0, math.sin(a) * 3.0, .1), GOLD, root, w=.6)
    for z in (.6, 1.0, 1.4): box(.5, .05, .04, (0, -1.85, z), METAL, root, w=.4)
    asc = empty("Ascent", root, (0, 0, 2.45))
    cyl(1.25, 1.6, (0, 0, .85), METAL, asc, verts=7); box(.9, .5, .6, (0, -1.1, 1.0), DARK, asc)
    cyl(.4, .1, (1.1, .8, 2.0), WHITE, asc, verts=20, rot=(math.radians(40), 0, 0), r2=.06)
    bpy.ops.object.select_all(action="DESELECT")
    rod((3.6, -2.2, 0), (3.6, -2.2, 3.2), .03, METAL, root)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(4.1, -2.2, 2.9)); fg = last(); fg.scale = (1.0, .6, 1); fg.rotation_euler[0] = math.radians(90); place(fg, RED, root, ink=False)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(3.85, -2.21, 3.05)); fg = last(); fg.scale = (.45, .3, 1); fg.rotation_euler[0] = math.radians(90); place(fg, BLUE, root, ink=False)
    box(.8, .8, .05, (2.4, -3.6, .35), MIRROR, root, rot=(math.radians(-35), 0, 0))
    engines(root, 0, .6, count=1, size=2.0)
    return {"size": 4.5, "ascent": asc, "mirror": Vector((2.4, -3.6, .4))}

def m_alsep(root):
    for x, y in ((-.5, -.3), (.5, -.3), (-.5, .3), (.5, .3)): rod((x, y, 0), (x, y, .5), .03, METAL, root)
    box(1.2, .8, .5, (0, 0, .7), WHITE, root); box(1.6, 1.2, .03, (0, 0, 1.4), GOLD, root, rot=(.15, 0, 0))
    rod((.6, .4, .95), (.6, .4, 1.9), .03, METAL, root); cyl(.25, .05, (.6, .4, 1.95), WHITE, root, verts=16, rot=(.4, 0, 0))
    cyl(.22, .9, (-2.6, .8, .5), DARK, root, verts=12)
    for k in range(6):
        a = k * math.pi / 3; box(.03, .25, .8, (-2.6 + math.cos(a) * .3, .8 + math.sin(a) * .3, .5), DARK, root, rot=(0, 0, a), w=.4)
    ball(.4, (2.2, -1.2, .15), METAL, root, seg=20, scale=(1, 1, .6)); cyl(.75, .04, (2.2, -1.2, .03), WHITE, root, verts=24)
    rod((0, -.4, .02), (2.2, -1.2, .02), .02, DARK, root, w=.3); rod((0, .4, .02), (-2.6, .8, .02), .02, DARK, root, w=.3)
    return 3.0

def wheel(root, loc, r, width, mat=DARK):
    e = empty("Wheel", root, loc); WHEELS.append((e, r))
    cyl(r, width, (0, 0, 0), mat, e, verts=16, rot=(math.radians(90), 0, 0), w=.7)
    box(r * 1.6, width * 1.05, r * .25, (0, 0, 0), METAL, e, w=.4)   # a spoke bar so the spin shows
    return e

def m_cart(root):
    box(1.4, .8, .35, (0, 0, .75), METAL, root); box(1.3, .7, .05, (0, 0, .95), GOLD, root)
    for sy in (-1, 1): wheel(root, (-.1, sy * .55, .45), .45, .15)
    rod((.7, 0, .8), (1.6, 0, 1.4), .03, METAL, root); rod((1.6, -.3, 1.4), (1.6, .3, 1.4), .03, METAL, root)
    rod((-.7, 0, .6), (-.9, 0, 0), .03, METAL, root)
    box(.4, .3, .3, (-.3, .1, 1.1), WHITE, root); cyl(.06, .9, (.4, -.2, 1.3), METAL, root, w=.5)
    return 2.0

def m_lrv(root):
    box(3.0, 1.5, .12, (0, 0, .7), METAL, root)
    for sx in (-1, 1):
        for sy in (-1, 1):
            wheel(root, (sx * 1.15, sy * .95, .42), .42, .25)
            box(.95, .32, .06, (sx * 1.15, sy * .95, .9), GOLD, root, rot=(0, 0, 0))
    for sy in (-.35, .35):
        box(.5, .45, .08, (-.2, sy, .85), BLUE, root); box(.08, .45, .55, (-.45, sy, 1.1), BLUE, root)
    box(.35, .5, .35, (.6, 0, 1.0), WHITE, root); rod((.6, 0, 1.2), (.4, 0, 1.6), .03, METAL, root)
    rod((1.2, .3, .8), (1.2, .3, 2.0), .03, METAL, root)
    cyl(.5, .2, (1.2, .3, 2.05), WHITE, root, verts=20, rot=(math.radians(-30), 0, 0), r2=.05)
    rod((1.3, -.4, .8), (1.3, -.4, 1.5), .03, METAL, root); box(.3, .2, .2, (1.35, -.4, 1.6), GOLD, root)
    return 3.0

def m_rover(root, kind):
    if kind == "soj":
        box(.65, .48, .2, (0, 0, .32), WHITE, root); box(.68, .5, .02, (0, 0, .44), PANEL, root)
        for x in (-.3, 0, .3):
            for sy in (-1, 1): wheel(root, (x, sy * .3, .07), .07, .06, METAL)
        cyl(.012, .25, (.25, .15, .55), METAL, root, w=.3)
        return .7
    if kind == "mer":
        box(1.3, .8, .45, (0, 0, .75), WHITE, root); box(2.2, 1.9, .04, (-.1, 0, 1.02), PANEL, root)
        for x in (-.6, 0, .6):
            for sy in (-1, 1):
                wheel(root, (x, sy * .75, .14), .14, .14); rod((x, sy * .55, .55), (x, sy * .72, .24), .025, METAL, root)
        cyl(.04, .9, (.5, -.3, 1.45), WHITE, root, w=.5); box(.15, .45, .14, (.52, -.3, 1.95), WHITE, root)
        for sy in (-.15, .15): ball(.04, (.6, -.3 + sy, 1.95), DARK, root, seg=8, w=.3)
        cyl(.18, .04, (-.4, .4, 1.15), WHITE, root, verts=16); cyl(.012, .9, (-.6, -.5, 1.5), METAL, root, w=.3)
        rod((.65, .2, .7), (1.05, .25, .6), .03, METAL, root); box(.12, .12, .12, (1.1, .25, .55), DARK, root, w=.5)
        return 1.7
    # curiosity
    box(2.2, 1.5, .65, (0, 0, 1.0), WHITE, root); box(2.3, 1.6, .05, (0, 0, 1.35), GOLD, root)
    for x in (-.9, 0, .9):
        for sy in (-1, 1):
            wheel(root, (x, sy * 1.1, .26), .26, .3); rod((x, sy * .8, .8), (x, sy * 1.05, .45), .04, METAL, root)
    cyl(.35, .9, (-1.4, 0, 1.4), DARK, root, verts=10, rot=(0, math.radians(-50), 0))
    cyl(.07, 1.5, (.8, -.55, 2.1), WHITE, root, w=.5); box(.25, .7, .3, (.82, -.55, 2.95), WHITE, root)
    ball(.06, (.97, -.4, 2.97), DARK, root, seg=8, w=.3)
    cyl(.32, .06, (-.5, .5, 1.5), WHITE, root, verts=8); rod((1.1, .4, 1.0), (1.9, .5, 1.2), .05, METAL, root); box(.3, .3, .3, (2.0, .5, 1.0), DARK, root)
    return 3.0

def m_pathfinder(root, with_rover=True):
    box(1.0, 1.0, .5, (0, 0, .3), WHITE, root)
    for k in range(3):
        a = math.radians(90 + k * 120)
        bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=1.2, radius2=0, depth=.05, location=(math.cos(a) * 1.25, math.sin(a) * 1.25, .05))
        p = last(); p.rotation_euler[2] = a + math.pi; place(p, PANEL, root)
    cyl(.05, 1.0, (.2, .2, 1.0), METAL, root, w=.5); box(.25, .15, .2, (.2, .2, 1.55), WHITE, root)
    cyl(.3, .05, (-.3, -.2, .6), WHITE, root, verts=14)
    return 2.2

def m_heli(root):
    box(.2, .2, .17, (0, 0, .35), GOLD, root)
    for k in range(4):
        a = math.radians(45 + k * 90); rod((math.cos(a) * .08, math.sin(a) * .08, .3), (math.cos(a) * .32, math.sin(a) * .32, 0), .012, METAL, root, w=.3)
    cyl(.02, .4, (0, 0, .6), METAL, root, w=.3)
    for z, sgn in ((.55, 1), (.65, -1)):
        hub = empty("Rotor", root, (0, 0, z)); ROTORS.append((hub, sgn))
        box(1.2, .07, .012, (0, 0, 0), WHITE, hub, w=.4)
    box(.42, .3, .015, (0, 0, .82), PANEL, root, w=.4)
    return .9

def m_backshell(root):
    cyl(2.25, 1.5, (0, 0, .75), WHITE, root, verts=24, r2=.9); cyl(.9, .12, (0, 0, 1.56), METAL, root, verts=24)
    return 3.0

def m_craft(root, p):
    s = p.get("scale", 1.0)
    body = p.get("body", "box")
    col = {"gold": GOLD, "white": WHITE, "metal": METAL, "copper": COPPER, "dark": DARK}[p.get("color", "gold")]
    if body == "box": box(1.2 * s, 1.2 * s, 1.0 * s, (0, 0, 0), col, root)
    elif body == "hex": cyl(.8 * s, .7 * s, (0, 0, 0), col, root, verts=6)
    elif body == "oct": cyl(.85 * s, .6 * s, (0, 0, 0), col, root, verts=8)
    elif body == "drum": cyl(.9 * s, 1.0 * s, (0, 0, 0), WHITE, root, verts=16); cyl(.92 * s, .3 * s, (0, 0, 0), PANEL, root, verts=16)
    elif body == "cone": cyl(.7 * s, 1.4 * s, (0, 0, 0), col, root, verts=8, r2=.25 * s)
    elif body == "tall": cyl(.6 * s, 2.6 * s, (0, 0, 0), col, root, verts=12); cyl(.5 * s, .5 * s, (0, 0, -1.5 * s), DARK, root, verts=12)
    elif body == "tube":
        cyl(.7 * s, 3.0 * s, (0, 0, .4 * s), WHITE, root, verts=20, rot=(0, math.radians(90), 0)); cyl(.71 * s, .3 * s, (1.85 * s, 0, .4 * s), DARK, root, verts=20, rot=(0, math.radians(90), 0))
        box(1.0 * s, 1.0 * s, .6 * s, (-.6 * s, 0, -.5 * s), GOLD, root)
    elif body == "ball":
        ball(.5 * s, (0, 0, 0), METAL, root, seg=20)
        for k in range(6):
            a = math.radians(k * 60); rod((math.cos(a) * .4 * s, math.sin(a) * .4 * s, 0), (math.cos(a) * 1.6 * s, math.sin(a) * 1.6 * s, -.6 * s), .02 * s, METAL, root, w=.3)
    np_ = p.get("panels", 0); span = p.get("span", 2.0) * s
    if np_:
        for k in range(np_):
            a = math.radians(k * 360 / np_)
            if p.get("round"): cyl(.8 * s, .04 * s, (math.cos(a) * (span / 2 + .7 * s), math.sin(a) * (span / 2 + .7 * s), 0), PANEL, root, verts=10, rot=(0, math.radians(90), a))
            else: box(span, .9 * s, .04 * s, (math.cos(a) * (span / 2 + .6 * s), math.sin(a) * (span / 2 + .6 * s), 0), PANEL, root, rot=(0, 0, a))
    if p.get("dish"):
        dr = p["dish"] * s; dz = p.get("dish_z", .7) * s
        cyl(dr, .35 * dr, (0, 0, dz + .17 * dr), WHITE, root, verts=32, r2=.15 * dr, rot=(math.pi, 0, 0))
        rod((0, 0, dz), (0, 0, dz + .7 * dr), .03 * s, METAL, root, w=.4)
    if p.get("booms"):
        for a in p["booms"]:
            a = math.radians(a); tip = (math.cos(a) * 3.2 * s, math.sin(a) * 3.2 * s, -.1 * s)
            rod((0, 0, 0), tip, .04 * s, METAL, root, w=.4)
            if p.get("rtg"): cyl(.2 * s, .7 * s, tip, DARK, root, verts=8, rot=(0, math.radians(90), a))
    if p.get("sunshade"): box(.15 * s, 2.4 * s, 1.8 * s, (1.0 * s, 0, 0), WHITE, root)
    if p.get("capsule"): cyl(.4 * s, .35 * s, (0, 0, .7 * s), WHITE, root, verts=16, r2=.15 * s)
    if p.get("paddle"): rod((0, 0, .5 * s), (0, -1.6 * s, 1.0 * s), .03 * s, METAL, root, w=.3); box(.8 * s, .05 * s, .5 * s, (0, -1.7 * s, 1.1 * s), toon("Aerogel", (.75, .85, 1.0), emit=.6), root)
    return 2.4 * s + (p.get("span", 0) * s * .5 if np_ else 0)

def m_stage(root, kind):
    if kind == "sivb":
        cyl(1.6, 8.0, (0, 0, 0), WHITE, root, verts=20, rot=(0, math.radians(90), 0)); cyl(1.62, 1.0, (-2.5, 0, 0), DARK, root, verts=20, rot=(0, math.radians(90), 0))
        cyl(1.6, 1.6, (-4.8, 0, 0), METAL, root, verts=20, r2=.6, rot=(0, math.radians(-90), 0))
        return 7.0
    # LCROSS shepherding its Centaur stage
    cyl(1.1, 5.0, (0, 0, 0), METAL, root, verts=16, rot=(0, math.radians(90), 0))
    cyl(1.3, .9, (3.0, 0, 0), GOLD, root, verts=6, rot=(0, math.radians(90), 0)); box(.04, 2.6, .9, (3.0, 0, 1.0), PANEL, root)
    return 5.0

def m_twins(root):
    for sx in (-1.6, 1.6):
        sub = empty("Twin", root, (sx, 0, 0))
        box(.8, .8, .7, (0, 0, 0), GOLD, sub)
        for sy in (-1, 1): box(.9, .7, .03, (0, sy * .75, .2), PANEL, sub)
    return 3.6

def m_venusprobes(root):
    for loc, r in (((0, 0, 0), .8), ((2.4, 1.0, .5), .45), ((-2.2, 1.5, -.3), .45), ((.6, 2.6, .9), .45)):
        ball(r, loc, toon("Probe", (.85, .85, .8)), root, seg=16)
        cyl(r * 1.25, r * .7, (loc[0], loc[1] - r * .55, loc[2]), GOLD, root, verts=20, r2=r * .15, rot=(math.radians(90), 0, 0))
    return 4.0

MODEL = SPEC["model"]
root = empty("Craft")
info = {}
m = MODEL["kind"]
if m == "viking": size = m_viking(root)
elif m == "surveyor": size = m_surveyor(root)
elif m == "deck": size = m_deck(root, MODEL.get("style", "phoenix"))
elif m == "lm": info = m_lm(root); size = info["size"]
elif m == "alsep": size = m_alsep(root)
elif m == "cart": size = m_cart(root)
elif m == "lrv": size = m_lrv(root)
elif m == "rover": size = m_rover(root, MODEL.get("style", "mer"))
elif m == "pathfinder": size = m_pathfinder(root)
elif m == "heli": size = m_heli(root)
elif m == "backshell": size = m_backshell(root)
elif m == "craft": size = m_craft(root, MODEL)
elif m == "stage": size = m_stage(root, MODEL.get("style", "sivb"))
elif m == "twins": size = m_twins(root)
elif m == "venusprobes": size = m_venusprobes(root)
else: raise SystemExit("unknown model " + m)
S = size  # camera distances are measured in "model sizes"

# =====================================================================
#   SETTING: Moon or Mars ground, or deep space with a world nearby
# =====================================================================
W = bpy.data.worlds.new("Sky"); sc.world = W
try: W.use_nodes = True
except Exception: pass
wn = W.node_tree; wn.nodes.clear()
wo = wn.nodes.new("ShaderNodeOutputWorld"); bg = wn.nodes.new("ShaderNodeBackground")
vor = wn.nodes.new("ShaderNodeTexVoronoi"); vor.inputs["Scale"].default_value = 260
sramp = wn.nodes.new("ShaderNodeValToRGB"); sramp.color_ramp.interpolation = "CONSTANT"
sramp.color_ramp.elements[0].color = (1, 1, 1, 1); sramp.color_ramp.elements[1].position = 0.045; sramp.color_ramp.elements[1].color = (0.012, 0.016, 0.04, 1)
wn.links.new(vor.outputs["Distance"], sramp.inputs[0])
day = wn.nodes.new("ShaderNodeRGB"); day.outputs[0].default_value = (0.84, 0.55, 0.36, 1)
sky = wn.nodes.new("ShaderNodeMix"); sky.data_type = "RGBA"
wn.links.new(day.outputs[0], find(sky, "A_Color")); wn.links.new(sramp.outputs[0], find(sky, "B_Color"))
wn.links.new(find(sky, "Result_Color"), bg.inputs[0]); wn.links.new(bg.outputs[0], wo.inputs[0])
NIGHT = find(sky, "Factor_Float"); NIGHT.default_value = 1.0
if SET == "mars": sock_key(NIGHT, 1, 1.0); sock_key(NIGHT, F(ARR[0] + .2), 1.0); sock_key(NIGHT, F(ARR[0] + 1.4), 0.0)

sun = bpy.data.lights.new("Sun", "SUN"); sun.energy = 3.0; sun.angle = .2
sunobj = bpy.data.objects.new("Sun", sun); sc.collection.objects.link(sunobj); sunobj.rotation_euler = (math.radians(50), 0, math.radians(35))

def planet(name, loc, r, colors, bands=0, rings=False, lumpy=0.0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=r, location=loc); o = last(); o.name = name
    if lumpy:
        tex = bpy.data.textures.new(name + "Lumps", "CLOUDS"); tex.noise_scale = r * .6
        d = o.modifiers.new("Lumps", "DISPLACE"); d.texture = tex; d.strength = r * lumpy; o.scale = (1.3, 1, .85)
    if bands:
        mat = bpy.data.materials.new(name + "Mat"); mat.use_nodes = True
        nt = mat.node_tree; nt.nodes.clear(); N = nt.nodes; L = nt.links
        out = N.new("ShaderNodeOutputMaterial"); wave = N.new("ShaderNodeTexWave"); wave.wave_type = "BANDS"; wave.bands_direction = "Z"
        wave.inputs["Scale"].default_value = bands; wave.inputs["Distortion"].default_value = 3
        cr = N.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].color = (*colors[0], 1); cr.color_ramp.elements[1].color = (*colors[1], 1)
        L.new(wave.outputs["Fac"], cr.inputs[0])
        diff = N.new("ShaderNodeBsdfDiffuse"); s2r = N.new("ShaderNodeShaderToRGB"); L.new(diff.outputs[0], s2r.inputs[0])
        ramp = N.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = "CONSTANT"
        el = ramp.color_ramp.elements; el[0].color = (.3, .3, .35, 1); el[1].position = .15; el[1].color = (1, 1, 1, 1)
        L.new(s2r.outputs[0], ramp.inputs[0])
        mul = N.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; find(mul, "Factor_Float").default_value = 1
        L.new(cr.outputs[0], find(mul, "A_Color")); L.new(ramp.outputs[0], find(mul, "B_Color"))
        em = N.new("ShaderNodeEmission"); L.new(find(mul, "Result_Color"), em.inputs[0]); L.new(em.outputs[0], out.inputs[0])
        o.data.materials.append(mat)
    else:
        o.data.materials.append(toon(name + "Mat", colors[0], craft=False))
    for poly in o.data.polygons: poly.use_smooth = True
    if rings:
        bpy.ops.mesh.primitive_torus_add(major_radius=r * 1.9, minor_radius=r * .45, major_segments=96, minor_segments=8, location=loc)
        rg = last(); rg.scale = (1, 1, .02); rg.rotation_euler = (math.radians(18), 0, math.radians(10))
        rg.data.materials.append(flat("Rings", (.86, .78, .6), 1.0, alpha=.85))
    return o

EARTH = None
GROUND = None
if SET in ("moon", "mars"):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=120, size=260)
    GROUND = last(); GROUND.name = "Ground"
    tex = bpy.data.textures.new("Dunes", "CLOUDS"); tex.noise_scale = 6
    d = GROUND.modifiers.new("Dunes", "DISPLACE"); d.texture = tex; d.strength = .9 if SET == "mars" else .6; d.mid_level = .6
    gcol = (0.8, 0.38, 0.19) if SET == "mars" else (0.62, 0.62, 0.64)
    GMAT = toon("Ground", gcol, craft=False, dust=(0.95, 0.97, 1.0, 1)); GROUND.data.materials.append(GMAT)
    for poly in GROUND.data.polygons: poly.use_smooth = True
    ROCK = toon("Rock", (0.45, 0.24, 0.15) if SET == "mars" else (0.42, 0.42, 0.44), craft=False)
    for i in range(80):
        r = random.uniform(S * 2.2, 70); a = random.uniform(0, 6.283)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(.15, .8), location=(math.cos(a) * r, math.sin(a) * r, .05))
        o = last(); o.scale = (1, random.uniform(.7, 1.3), random.uniform(.45, .8)); o.rotation_euler[2] = a; place(o, ROCK, w=1.2)
    if SET == "moon":
        for i in range(14):  # craters: dark rims on the grey plain
            r = random.uniform(S * 3, 80); a = random.uniform(0, 6.283); cr_ = random.uniform(2, 7)
            bpy.ops.mesh.primitive_torus_add(major_radius=cr_, minor_radius=cr_ * .12, location=(math.cos(a) * r, math.sin(a) * r, .1))
            o = last(); o.scale = (1, 1, .35); place(o, ROCK, w=1.0)
    EARTH = Vector((-38, 62, 30)) if SET == "moon" else Vector((-60, 95, 34))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=3.2 if SET == "moon" else .9, location=EARTH); place(last(), flat("EarthGlow", (0.2, 0.45, 1.0), 1.4), ink=False)
else:
    EARTH = Vector((-160, -120, 70))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.2, location=EARTH); place(last(), flat("EarthGlow", (0.2, 0.45, 1.0), 1.6), ink=False)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=6, location=(220, -260, 40)); place(last(), flat("SunGlow", (1.0, 0.9, 0.6), 8.0), ink=False)

BODY = None
BODYC, BODYR = None, None
if SET == "space" and SPEC.get("body"):
    b = SPEC["body"]
    BODYR = b.get("r", 14) * max(1.0, S / 2.4)
    BODYC = Vector((0, BODYR * 2.6 + S * 3, -BODYR * .25))
    BODY = planet("Body", BODYC, BODYR, [tuple(c) for c in b["colors"]], bands=b.get("bands", 0), rings=b.get("rings", False), lumpy=b.get("lumpy", 0))
    if b.get("coma"):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=BODYR * 2.2, location=BODYC); place(last(), flat("Coma", (.6, .8, 1.0), 1.5, alpha=.12), ink=False)
        bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=BODYR * 2, radius2=0, depth=BODYR * 14, location=BODYC + Vector((BODYR * 7, BODYR * 3, 0)))
        tl = last(); tl.rotation_euler = (0, math.radians(-90), math.radians(-20)); place(tl, flat("Tail", (.7, .85, 1.0), 1.2, alpha=.1), ink=False)

# =====================================================================
#   MOTION: where the machine is, second by second
# =====================================================================
POS = []      # (t, Vector) keys of the root location, linear between keys
def at(t, loc):
    root.location = loc; root.keyframe_insert("location", frame=F(t)); POS.append((t, Vector(loc))); POS.sort(key=lambda k: k[0])
def pos(t):
    if not POS: return Vector((0, 0, 0))
    if t <= POS[0][0]: return POS[0][1]
    for (a, pa), (b, pb) in zip(POS, POS[1:]):
        if a <= t <= b: return pa.lerp(pb, (t - a) / max(1e-6, b - a))
    return POS[-1][1]

cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 32; cam_data.clip_end = 2000
cam = bpy.data.objects.new("Cam", cam_data); sc.collection.objects.link(cam); sc.camera = cam
aim = bpy.data.objects.new("Aim", None); sc.collection.objects.link(aim)
tr = cam.constraints.new("TRACK_TO"); tr.target = aim; tr.track_axis = "TRACK_NEGATIVE_Z"; tr.up_axis = "UP_Y"
def shot(t, cpos, apos):
    cam.location = cpos; cam.keyframe_insert("location", frame=F(t))
    aim.location = apos; aim.keyframe_insert("location", frame=F(t))
def follow(t0, t1, off0, off1, look=(0, 0, 0), steps=6):
    for k in range(steps + 1):
        tt = t0 + (t1 - t0) * k / steps; f = k / steps
        o = Vector(off0).lerp(Vector(off1), f); p = pos(tt)
        shot(tt, p + o * S, p + Vector(look) * S)

def flames_on(t0, t1):
    for fl in FLAMES:
        fl.scale = (0, 0, 0); fl.keyframe_insert("scale", frame=F(t0 - .1))
        k = t0
        while k < t1:
            fl.scale = (1, 1, random.uniform(.7, 1.3)); fl.keyframe_insert("scale", frame=F(k)); k += 1 / 6
        fl.scale = (0, 0, 0); fl.keyframe_insert("scale", frame=F(t1 + .05))

def puff_at(t, loc, size, color=None):
    m = flat("Puff", color or ((0.8, 0.5, 0.32) if SET == "mars" else (0.7, 0.7, 0.72)), 1.0, alpha=0.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=.35, location=loc); p = last(); p.data.materials.append(m)
    p.scale = (.3 * size, .3 * size, .3 * size); p.keyframe_insert("scale", frame=F(t))
    p.scale = (3.5 * size, 3.5 * size, 1.2 * size); p.keyframe_insert("scale", frame=F(t + 1.6))
    a = m.node_tree.nodes["Alpha"].inputs[0]; sock_key(a, F(t - .1), 0); sock_key(a, F(t), .85); sock_key(a, F(t + 1.6), 0)

def flash_at(t, loc, size):
    m = flat("Flash", (1.0, .95, .7), 8.0, alpha=0.0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=loc); fo = last(); fo.data.materials.append(m)
    fo.scale = (.2 * size,) * 3; fo.keyframe_insert("scale", frame=F(t))
    fo.scale = (2.4 * size,) * 3; fo.keyframe_insert("scale", frame=F(t + .8))
    a = m.node_tree.nodes["Alpha"].inputs[0]; sock_key(a, F(t - .05), 0); sock_key(a, F(t), 1); sock_key(a, F(t + .8), 0)

RINGS = []
def ring_pulses(t0, t1, src_fn, direction, strength, spacing=1.2):
    if t1 - t0 < 1.3: return
    mat = flat("Radio", (0.25, 0.85, 1.0), 3.0, alpha=0.0)
    for i in range(3):
        bpy.ops.mesh.primitive_torus_add(major_radius=.45, minor_radius=.035, major_segments=40, minor_segments=8)
        r = last(); r.data.materials.append(mat.copy())
        r.rotation_mode = "QUATERNION"; r.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction)
        a = r.data.materials[0].node_tree.nodes["Alpha"].inputs[0]
        s = t0 + i * .4
        sock_key(a, F(t0 - .1), 0)
        while s + spacing < t1:
            src = src_fn(s)
            r.location = src + direction * .3 * S; r.scale = (.6 * S / 2,) * 3
            r.keyframe_insert("location", frame=F(s)); r.keyframe_insert("scale", frame=F(s)); sock_key(a, F(s), strength)
            r.location = src + direction * 4 * S; r.scale = (2.5 * S / 2,) * 3
            r.keyframe_insert("location", frame=F(s + spacing)); r.keyframe_insert("scale", frame=F(s + spacing)); sock_key(a, F(s + spacing), 0)
            s += spacing * 1.2
        sock_key(a, F(t1), 0)

def spin_wheels(t0, t1, dist):
    for e, r in WHEELS:
        e.rotation_euler = (0, 0, 0); e.keyframe_insert("rotation_euler", frame=F(t0))
        e.rotation_euler = (0, dist / r, 0); e.keyframe_insert("rotation_euler", frame=F(t1))

def spin_rotors(t0, t1, turns_per_s=6):
    for hub, sgn in ROTORS:
        hub.rotation_euler = (0, 0, 0); hub.keyframe_insert("rotation_euler", frame=F(t0))
        hub.rotation_euler = (0, 0, sgn * (t1 - t0) * turns_per_s * 2 * math.pi * .25); hub.keyframe_insert("rotation_euler", frame=F(t1))

def mats_key(node, t, value):
    for m_ in CRAFT_MATS:
        nd = m_.node_tree.nodes.get(node)
        if not nd: continue
        sock = find(nd, "Factor_Float") if node == "Dust" else nd.inputs[0]
        sock_key(sock, F(t), value)

def quake(t0, t1, center):
    m = flat("Quake", (1.0, .8, .4), 2.0, alpha=0.0)
    for k in range(3):
        bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=.05, major_segments=64, minor_segments=6, location=center + Vector((0, 0, .15)))
        r = last(); mm = m.copy(); r.data.materials.append(mm); a = mm.node_tree.nodes["Alpha"].inputs[0]
        s = t0 + k * .9
        while s + 2 < t1:
            r.scale = (.5,) * 3; r.keyframe_insert("scale", frame=F(s)); sock_key(a, F(s), .8)
            r.scale = (8 * S / 2.5, 8 * S / 2.5, 1); r.keyframe_insert("scale", frame=F(s + 2)); sock_key(a, F(s + 2), 0)
            s += 2.7
        sock_key(a, F(t1), 0)

def up(v): return Vector((0, 0, 1)) if v is None else v
earth_dir = lambda p: (EARTH - p).normalized()

# ---- the ghost: craft turns pale blue at the end, unless it's still working ----
mats_key("Ghost", 1, 0.0)

arrival = SPEC.get("arrival", "descent")
extras = SPEC.get("extras", [])
work_mode = SPEC.get("work", "radio")
a0, a1 = ARR; w0, w1 = WORK; f0, f1 = FIN; c0, c1 = CODA

# ---------------- SURFACE STORIES ----------------
if SET in ("moon", "mars"):
    HOME = Vector((0, 0, 0))
    shot(0, (0, -30, 3), (0, 30, 40)); shot(a0 - .2, (0, -30, 3), (0, 30, 40))
    impact_story = END_KIND == "impact"
    if impact_story:
        # fly in low and fast from far away, then hit: flash, dust, a crater, and a ghost
        hit_t = f0 + min(2.5, (f1 - f0) * .6)
        start = Vector((-60 * S / 3, 25, 26)); mid = Vector((-14 * S / 3, 5, 9))
        at(a0, start); at(w0, mid); at(hit_t - .05, Vector((0, 0, .5)))
        root.rotation_euler = (0, math.radians(18), math.radians(-20))
        follow(a0, w0, (1.6, -3.2, .5), (1.8, -3.4, .7))
        follow(w0, hit_t - .3, (1.8, -3.4, .7), (3, -5, 1.2), steps=10)
        shot(hit_t + .2, (S * 2.6, -S * 4, S * 1.6), (0, 0, 1)); shot(c0, (S * 3, -S * 4.6, S * 1.8), (0, 0, 0))
        if "lead" in extras:   # LCROSS: its Centaur hits first
            lead = empty("Lead", None, (0, 0, 0)); cyl(1.0, 4.0, (0, 0, 0), METAL, lead, verts=16, rot=(0, math.radians(90), 0))
            lt = w0 + (w1 - w0) * .15
            lead.location = mid + Vector((-6, 3, 4)); lead.keyframe_insert("location", frame=F(w0 - .4))
            lead.location = Vector((8, 10, .4)); lead.keyframe_insert("location", frame=F(lt))
            lead.scale = (1, 1, 1); lead.keyframe_insert("scale", frame=F(lt)); lead.scale = (0, 0, 0); lead.keyframe_insert("scale", frame=F(lt + .12))
            flash_at(lt, Vector((8, 10, .5)), 3); puff_at(lt, Vector((8, 10, .4)), 4)
        root.scale = (1, 1, 1); root.keyframe_insert("scale", frame=F(hit_t)); root.scale = (0, 0, 0); root.keyframe_insert("scale", frame=F(hit_t + .12))
        flash_at(hit_t, Vector((0, 0, .6)), max(2.5, S * .8)); puff_at(hit_t, Vector((0, 0, .3)), max(2, S * .7))
        bpy.ops.mesh.primitive_torus_add(major_radius=max(2.5, S * .8), minor_radius=max(.3, S * .1), location=(0, 0, .15)); crater = last(); crater.scale = (0, 0, 0)
        place(crater, toon("Crater", (.3, .3, .32) if SET == "moon" else (.45, .22, .12), craft=False), w=1.4)
        crater.keyframe_insert("scale", frame=F(hit_t)); crater.scale = (1, 1, .35); crater.keyframe_insert("scale", frame=F(hit_t + 1))
        # the ghost rises over its crater
        at(hit_t + .1, Vector((0, 0, 1.0 * S))); root.rotation_euler = (0, 0, 0); root.keyframe_insert("rotation_euler", frame=F(hit_t + .1))
        root.keyframe_insert("scale", frame=F(c0 - .3)); root.scale = (1, 1, 1); root.keyframe_insert("scale", frame=F(c0 + .8))
        mats_key("Ghost", c0 - .3, .95); at(c0 + 2, Vector((0, 0, 1.6 * S))); at(END, Vector((0, 0, 2.0 * S)))
        follow(c0, END, (1.8, -3.2, .7), (3, -5, 1.4), look=(0, 0, .2))
    else:
        if arrival in ("descent", "descent_fail", "chute"):
            top = 40 + S * 4
            at(a0, Vector((0, 0, top)))
            if arrival == "descent":
                at(a1 - 3, Vector((0, 0, S * 3))); at(a1, HOME); flames_on(a1 - 3.2, a1 - .05)
                puff_at(a1, Vector((0, 0, .25)), S / 2)
            elif arrival == "descent_fail":
                at(a1 - 3.2, Vector((0, 0, 14))); flames_on(a1 - 5, a1 - 3.2); at(a1 - 1.6, Vector((0, 0, 1.2))); at(a1 - 1.4, HOME)
                puff_at(a1 - 1.4, Vector((0, 0, .25)), S / 1.5)
                root.rotation_euler = (0, 0, 0); root.keyframe_insert("rotation_euler", frame=F(a1 - 1.5))
                root.rotation_euler = (math.radians(14), math.radians(-8), 0); root.keyframe_insert("rotation_euler", frame=F(a1 - 1.2))
            else:  # parachute: the backshell rides the chute, lets go, and crashes
                chute = empty("Chute", None, (0, 0, top + 8))
                ball(4.0, (0, 0, 0), toon("Chute", (.95, .45, .2)), chute, seg=24, scale=(1, 1, .4))
                for k in range(8):
                    a = k * math.pi / 4; rod((math.cos(a) * 3.8, math.sin(a) * 3.8, 0), (0, 0, -7.5), .02, METAL, chute, w=.3)
                chute.keyframe_insert("location", frame=F(a0))
                at(a1 - 1.6, Vector((0, 0, 18))); chute.location = (0, 0, 26); chute.keyframe_insert("location", frame=F(a1 - 1.6))
                at(a1 - .4, Vector((6, 2, .8))); at(a1 - .2, Vector((6.3, 2, .75)))
                chute.location = (-6, 9, 6); chute.keyframe_insert("location", frame=F(a1 + 4)); chute.location = (-8, 11, .4); chute.keyframe_insert("location", frame=F(w0 + 6))
                chute.scale = (1, 1, 1); chute.keyframe_insert("scale", frame=F(w0 + 5)); chute.scale = (1, 1, .15); chute.keyframe_insert("scale", frame=F(w0 + 7))
                root.rotation_euler = (math.radians(25), math.radians(15), 0); root.keyframe_insert("rotation_euler", frame=F(a1 - .4))
                puff_at(a1 - .35, Vector((6, 2, .3)), 2); HOME = Vector((6.3, 2, .75))
            follow(a0, a1 - 2, (3.5, -6.5, -1), (3.5, -6.5, .2), look=(0, 0, 0))
            follow(a1 - 2, a1 + .6, (3.2, -6, 1.2), (3, -5.5, 1), look=(0, 0, .3))
        elif arrival == "airbag":
            top = 45; at(a0, Vector((0, 0, top)))
            bags = empty("Bags", root, (0, 0, S * .4))
            for k in range(14):
                th = random.uniform(0, 6.283); ph = random.uniform(-1.2, 1.2)
                ball(S * .32, (math.cos(th) * math.cos(ph) * S * .55, math.sin(th) * math.cos(ph) * S * .55, math.sin(ph) * S * .5), toon("Bag", (.95, .93, .85)), bags, seg=12, w=.8)
            bt = a0 + (a1 - a0) * .45
            at(bt, Vector((0, 0, S * .6))); at(bt + .6, Vector((S * 1.5, 0, S * 2.5))); at(bt + 1.2, Vector((S * 3, 0, S * .6)))
            at(bt + 1.6, Vector((S * 3.8, 0, S * 1.2))); at(bt + 2.0, Vector((S * 4.5, 0, S * .6))); at(a1 - .3, Vector((S * 5, 0, 0)))
            HOME = Vector((S * 5, 0, 0))
            bags.scale = (1, 1, 1); bags.keyframe_insert("scale", frame=F(a1 - .3)); bags.scale = (0, 0, 0); bags.keyframe_insert("scale", frame=F(a1 + .4))
            puff_at(bt, Vector((0, 0, .2)), S / 1.5)
            follow(a0, bt, (4, -10, -2), (4, -9, 1), look=(0, 0, 0))
            follow(bt, a1 + .4, (2, -9, 1.2), (1.5, -6, 1.2), look=(0, 0, .3))
        elif arrival == "drop":   # Ingenuity: lowered from under the rover
            at(a0, Vector((0, 0, 2.4))); at(a1 - 1, HOME)
            rov = empty("Percy", None, (0, 0, 2.6)); box(4, 3, 1.1, (0, 0, .7), WHITE, rov)
            for x in (-1.5, 0, 1.5):
                for sy in (-1, 1): cyl(.35, .35, (x, sy * 1.6, -.6), DARK, rov, rot=(math.radians(90), 0, 0))
            rov.keyframe_insert("location", frame=F(a1 - .6)); rov.location = (-14, 6, 2.6); rov.keyframe_insert("location", frame=F(w0 + 2))
            follow(a0, a1, (3, -6, 1), (2.5, -5, .8), look=(0, 0, .4))
        else:  # "reveal": already there; the camera comes down from Earth in the sky
            at(a0, HOME)
            shot(a0, (S * 3, -S * 6, S * 3), EARTH * .3); shot(a0 + 2.5, (S * 3, -S * 6, S * 3), EARTH * .15)
            shot(a1, (S * 2.6, -S * 3.6, S * 1.4), (0, 0, S * .25))

        # --- the working years ---
        if "ascent" in info:   # Apollo 11: the top half flies home
            asc = info["ascent"]; lt = w0 + .8
            asc.keyframe_insert("location", frame=F(lt)); asc.location = (0, 0, 60); asc.keyframe_insert("location", frame=F(lt + 4))
            fl2 = flat("AscFlame", (1.0, .7, .3), 6.0); bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=.4, radius2=0, depth=2.2, location=(0, 0, -.2))
            af = last(); af.rotation_euler[0] = math.pi; af.data.materials.append(fl2); af.parent = asc
            af.scale = (0, 0, 0); af.keyframe_insert("scale", frame=F(lt - .1)); af.scale = (1, 1, 1); af.keyframe_insert("scale", frame=F(lt))
            shot(w0, (12, -15, 3), (0, 0, 4)); shot(lt + 3.8, (12, -15, 3), (0, 0, 24)); shot(lt + 4.2, (9, -12, 3), (0, 0, 2))
            if "laser" in extras:
                lz0 = lt + 4.6
                mir = info["mirror"]; v = EARTH - mir
                bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.08, depth=v.length, location=mir + v / 2)
                beam = last(); beam.rotation_mode = "QUATERNION"; beam.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(v)
                bm = flat("Laser", (1.0, .15, .1), 8.0, alpha=0.0); beam.data.materials.append(bm); ba = bm.node_tree.nodes["Alpha"].inputs[0]
                sock_key(ba, F(lz0), 0); k = lz0
                while k + .8 < f0:
                    sock_key(ba, F(k + .1), .9); sock_key(ba, F(k + .5), 0); k += 1.4
                shot(lz0, (6, -9, 2), mir); shot(f0, (8, -12, 4), (-5, 8, 8))
        elif work_mode == "drive" and WHEELS:
            dist = S * 5; d0 = w0 + .3; d1 = max(d0 + 3, w1 - 1.0)
            at(d0, HOME); at(d1, HOME + Vector((dist, dist * .25, 0))); spin_wheels(d0, d1, dist)
            follow(d0, d1, (1.5, -3.5, 1.0), (2.5, -3.2, 1.2), look=(.6, 0, .3), steps=8)
            HOME = HOME + Vector((dist, dist * .25, 0))
            ring_pulses(d1 + .3, w1, lambda t: pos(t) + Vector((0, 0, S * .6)), earth_dir(HOME), .9)
            shot(w1, *(lambda p: (p + Vector((-S * 2, -S * 3, S * 1.2)), p + Vector((0, 0, S * .3)))) (pos(w1)))
        elif work_mode == "hop" and ROTORS:
            k = w0 + .4; hops = 0
            spin_rotors(w0, w1)
            while k + 3 < w1 and hops < 3:
                p = pos(k); at(k, p); at(k + 1.0, p + Vector((0, 0, 3.5))); at(k + 2.0, p + Vector((3, 1, 3.5))); at(k + 2.8, p + Vector((3, 1, 0)))
                k += 3.4; hops += 1
            follow(w0, w1, (2.5, -6, 1.5), (2, -6, 2.5), look=(0, 0, 1.4), steps=10)
            HOME = pos(w1)
        else:
            at(w0, HOME)
            shot(w0, HOME + Vector((S * 2.6, -S * 2.2, S * .9)), HOME + Vector((0, 0, S * .35)))
            shot(w0 + (w1 - w0) / 2, HOME + Vector((S * 1.2, -S * 3.0, S * 1.3)), HOME + Vector((-S * .2, S * .5, S * .55)))
            shot(w1, HOME + Vector((-S * 2.4, -S * 2.6, S * 1.3)), HOME + Vector((-S * .3, S * .6, S * .6)))
            if "quake" in extras: quake(w0 + 1, w1, HOME + Vector((S * .6, -S * .4, 0)))
            ring_pulses(w0 + .4, w1, lambda t: HOME + Vector((0, 0, S * .9)), earth_dir(HOME), .9)
        if "golf" in extras:
            for x, y in ((S * 1.4, -S * 1.2), (S * 1.9, -S * .6)): ball(.09, (x, y, .1), WHITE, None, seg=10, w=.3)
        if "sojourner" in extras:
            sj = empty("Soj", None, HOME + Vector((1.6, -1.4, 0)))
            box(.65, .48, .2, (0, 0, .32), WHITE, sj); box(.68, .5, .02, (0, 0, .44), PANEL, sj)
            for x in (-.3, 0, .3):
                for sy in (-1, 1): cyl(.07, .06, (x, sy * .3, .07), METAL, sj, rot=(math.radians(90), 0, 0))
            sj.keyframe_insert("location", frame=F(w0 + 1)); sj.location = HOME + Vector((4.5, -3.6, 0)); sj.keyframe_insert("location", frame=F(w1))
        if "pathfinder" in extras:
            pf = empty("PF", None, HOME + Vector((-2.6, 1.8, 0))); m_pathfinder(pf)

        # --- the end of the working life ---
        if END_KIND in ("active",):
            ring_pulses(f0, END, lambda t: pos(t) + Vector((0, 0, S * .8)), earth_dir(pos(f0)), .9)
            shot(f0, pos(f0) + Vector((S * 2.5, -S * 3.5, S * 1.2)), pos(f0) + Vector((0, 0, S * .4)))
        else:
            if SET == "mars": mats_key("Dust", f0, .03); mats_key("Dust", f1, .6)
            n_ = 6
            if SET == "mars":
                for k in range(n_ + 1): sock_key(NIGHT, F(f0 + (f1 - f0) * k / n_), 1.0 if k % 2 else 0.0)
            if "frost" in extras:
                gd = find(GMAT.node_tree.nodes["Dust"], "Factor_Float"); sock_key(gd, F(f0), 0); sock_key(gd, F(f1), .55)
            sunobj.keyframe_insert("rotation_euler", frame=F(f0)); sunobj.rotation_euler = (math.radians(50), 0, math.radians(35 + 360 * 2)); sunobj.keyframe_insert("rotation_euler", frame=F(f1))
            p = pos(f0); shot(f0, p + Vector((S * 3.6, -S * 4.6, S * 1.6)), p + Vector((0, 0, S * .35))); shot(f1, p + Vector((S * 3.8, -S * 4.9, S * 1.7)), p + Vector((0, 0, S * .35)))
        # --- coda: night, the pale glow, and a slow pull back with Earth in the sky ---
        if SET == "mars": sock_key(NIGHT, F(c0), 1.0); sock_key(NIGHT, F(END), 1.0)
        p = pos(c0)
        if END_KIND != "active": mats_key("Ghost", c0, 0.0); mats_key("Ghost", c0 + 3, .55); mats_key("Ghost", END, .55)
        shot(c0, p + Vector((S * 3.2, -S * 4.2, S * 1.4)), p + Vector((0, 0, S * .5)))
        shot(END, p + Vector((S * 4.6, -S * 6.4, S * 2.4)), p + (EARTH - p) * .06)

# ---------------- SPACE STORIES ----------------
else:
    # the craft drifts slowly along +x; the camera circles it with the world behind
    drift = Vector((S * .3, 0, 0))
    start = Vector((-S * 14, -S * 6, S * 3))
    at(0, start); at(a1, Vector((0, 0, 0)))
    root.rotation_euler = (0, 0, 0); root.keyframe_insert("rotation_euler", frame=1)
    root.rotation_euler = (0, 0, math.radians(40)); root.keyframe_insert("rotation_euler", frame=F(END))
    look_at_body = (BODYC if BODYC is not None else Vector((0, 60, 0)))
    shot(0, (S * 3, -S * 6, S * 1.5), start * .6); shot(a0, (S * 3, -S * 6, S * 1.5), start * .3)
    shot(a1, (S * 2.4, -S * 3.6, S * .9), Vector((0, 0, 0)))
    at(w1, drift * ((w1 - a1) / 4))
    steps = 8
    for k in range(steps + 1):
        tt = w0 + (w1 - w0) * k / steps; th = math.radians(-120 + 80 * k / steps)
        p = pos(tt); shot(tt, p + Vector((math.cos(th) * S * 4, math.sin(th) * S * 4, S * 1.2)), p.lerp(look_at_body, .12))
    ring_pulses(w0 + .5, w1, lambda t: pos(t), earth_dir(Vector((0, 0, 0))), .9)
    p_f = pos(w1)
    if END_KIND == "impact" and BODYC is not None:
        hit_point = BODYC + (p_f - BODYC).normalized() * BODYR * .99
        hit_t = f0 + min(3.0, (f1 - f0) * .7)
        at(f0, p_f); at(hit_t, hit_point)
        follow(f0, hit_t - .4, (1.2, -4.5, 1.2), (1.0, -5, 1.4), look=(0, 2.5, -.3), steps=8)
        shot(hit_t + .1, hit_point + (p_f - hit_point).normalized() * S * 9 + Vector((S * 3, 0, S * 2)), hit_point)
        root.scale = (1, 1, 1); root.keyframe_insert("scale", frame=F(hit_t)); root.scale = (0, 0, 0); root.keyframe_insert("scale", frame=F(hit_t + .12))
        flash_at(hit_t, hit_point, max(3, S * 1.2))
        ghost_at = hit_point + (p_f - hit_point).normalized() * S * 3.5
        at(hit_t + .1, ghost_at); root.keyframe_insert("scale", frame=F(c0 - .3)); root.scale = (1, 1, 1); root.keyframe_insert("scale", frame=F(c0 + .8))
        mats_key("Ghost", c0 - .3, .95); at(END, ghost_at + Vector((0, 0, S * .8)))
        shot(c0, ghost_at + Vector((S * 2.5, -S * 4, S * 1.0)), ghost_at); shot(END, ghost_at + Vector((S * 4, -S * 7, S * 2)), ghost_at.lerp(hit_point, .5))
    elif END_KIND == "impact":
        # no world to fall into here (shouldn't happen); just fade like a lost craft
        at(END, p_f + drift * 4)
        mats_key("Ghost", c0, 0); mats_key("Ghost", c0 + 3, .6)
        follow(f0, END, (2.4, -4, 1), (5, -9, 2.5))
    elif SPEC.get("touchdown") and BODYC is not None:      # NEAR: settles onto Eros
        land = BODYC + (p_f - BODYC).normalized() * BODYR * 1.02
        at(f0, p_f); at(f1 - .4, land)
        follow(f0, f1, (3, -5, 1.6), (2.4, -4, 1.0), steps=8)
        puff_at(f1 - .4, land, 1.2, color=(.6, .55, .5))
        mats_key("Ghost", c0, 0); mats_key("Ghost", c0 + 3, .55)
        shot(c0, land + Vector((S * 3, -S * 4.5, S * 1.3)), land); shot(END, land + Vector((S * 5, -S * 8, S * 2.5)), land.lerp(BODYC, .3))
    else:
        # silent, lost or active: keep drifting; the light goes out (or doesn't)
        away = p_f + Vector((S * 8, S * 4, S * 1.5))
        at(f0, p_f); at(END, away)
        if END_KIND == "active":
            ring_pulses(f0, END, lambda t: pos(t), earth_dir(p_f), .9)
            follow(f0, END, (2.6, -4.2, 1.0), (3.6, -6.5, 1.8), steps=8)
        else:
            if END_KIND == "lost" and BODYC is not None and SPEC.get("behind"):
                at(f1, BODYC + Vector((0, BODYR * 1.2, 0))); root.scale = (1, 1, 1); root.keyframe_insert("scale", frame=F(f1 - .2))
                root.scale = (0, 0, 0); root.keyframe_insert("scale", frame=F(f1 + .2))
                follow(f0, f1, (3, -5, 2), (4, -12, 4), steps=8)
                ghost_at = BODYC + (Vector((0, 0, 0)) - BODYC).normalized() * BODYR * 1.6 + Vector((0, 0, BODYR * .5))
                at(f1 + .3, ghost_at); root.keyframe_insert("scale", frame=F(c0 - .3)); root.scale = (1, 1, 1); root.keyframe_insert("scale", frame=F(c0 + .8))
                at(END, ghost_at + Vector((0, 0, S)))
                mats_key("Ghost", c0 - .3, .95)
                shot(c0, ghost_at + Vector((S * 3, -S * 5, S)), ghost_at); shot(END, ghost_at + Vector((S * 5, -S * 9, S * 2)), ghost_at)
            else:
                ring_pulses(f0, (f0 + f1) / 2, lambda t: pos(t), earth_dir(p_f), .35)
                mats_key("Ghost", c0, 0); mats_key("Ghost", c0 + 3, .6); mats_key("Ghost", END, .6)
                fixed = p_f + Vector((-S * 1.5, -S * 6, S * 1.2))
                shot(f0, p_f + Vector((S * 2.6, -S * 4.2, S * 1.0)), p_f)
                for k in range(1, 5):
                    tt = f0 + (END - f0) * k / 4; shot(tt, fixed.lerp(p_f + Vector((S * 2.6, -S * 4.2, S)), max(0, 1 - k / 2)), pos(tt))

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "short.blend"))
print("BUILT", F(END), "frames", json.dumps(beats))
