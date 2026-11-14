"""Ghost Shorts pilot: Viking 1, "Facing the Wrong Way".
Builds a cartoon (toon-shaded, ink-outlined) Viking lander on Mars and animates
six story beats timed to the narration in voice.json. Run with:
  blender -b --factory-startup --python build_viking.py -- <outdir>
Saves <outdir>/viking.blend, ready to render.
"""
import bpy, json, math, os, random, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1]
VOICE = json.load(open(os.path.join(OUT, "voice.json"), encoding="utf-8-sig"))
FPS, PAD, TITLE, TAIL = 24, 0.8, 3.5, 2.0
random.seed(7)

# ---- beat times (seconds) from the narration lengths ----
beats, t = [], TITLE
for d in VOICE["durations"]:
    beats.append((t, t + d + PAD)); t += d + PAD
END = t + TAIL
F = lambda s: int(round(s * FPS)) + 1
B = [(a, b) for a, b in beats]
json.dump({"beats": B, "end": END, "fps": FPS, "title": TITLE}, open(os.path.join(OUT, "timing.json"), "w"))

# ---- clean scene ----
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = F(END)
sc.render.resolution_x, sc.render.resolution_y = 1280, 720
engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
sc.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_EEVEE_NEXT"
try: sc.eevee.taa_render_samples = 16
except Exception: pass
sc.view_settings.view_transform = "Standard"
sc.render.image_settings.file_format = "PNG"
sc.render.filepath = os.path.join(OUT, "frames", "f_")

def key(obj, path, frame, value=None, interp="BEZIER"):
    if value is not None:
        if isinstance(value, (tuple, list)): setattr(obj, path, value) if not hasattr(getattr(obj, path), "__len__") else getattr(obj, path).__setitem__(slice(None), value)
        else: setattr(obj, path, value)
    obj.keyframe_insert(path, frame=frame)

def sock_key(sock, frame, value):
    sock.default_value = value
    sock.keyframe_insert("default_value", frame=frame)

def find(node, ident):
    return next(s for s in list(node.inputs) + list(node.outputs) if s.identifier == ident)

# ---- toon material: flat bands of colour, dust and a ghostly glow we can animate ----
DUST = (0.77, 0.42, 0.24, 1)
MATS = {}
def toon(name, rgb, emit=0.0):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree; nt.nodes.clear(); N = nt.nodes; L = nt.links
    out = N.new("ShaderNodeOutputMaterial")
    base = N.new("ShaderNodeRGB"); base.outputs[0].default_value = (*rgb, 1)
    dust = N.new("ShaderNodeMix"); dust.data_type = "RGBA"; dust.name = "Dust"
    find(dust, "Factor_Float").default_value = 0.0
    find(dust, "B_Color").default_value = DUST
    L.new(base.outputs[0], find(dust, "A_Color"))
    diff = N.new("ShaderNodeBsdfDiffuse")
    s2r = N.new("ShaderNodeShaderToRGB"); L.new(diff.outputs[0], s2r.inputs[0])
    ramp = N.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = "CONSTANT"
    el = ramp.color_ramp.elements; el[0].position = 0.0; el[0].color = (0.38, 0.36, 0.42, 1); el[1].position = 0.18; el[1].color = (0.72, 0.70, 0.74, 1)
    e3 = el.new(0.5); e3.color = (1, 1, 1, 1)
    L.new(s2r.outputs[0], ramp.inputs[0])
    mul = N.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; find(mul, "Factor_Float").default_value = 1
    L.new(find(dust, "Result_Color"), find(mul, "A_Color")); L.new(ramp.outputs[0], find(mul, "B_Color"))
    em = N.new("ShaderNodeEmission"); L.new(find(mul, "Result_Color"), em.inputs[0]); em.inputs[1].default_value = 1.0
    ghost = N.new("ShaderNodeEmission"); ghost.inputs[0].default_value = (0.62, 0.78, 1, 1); ghost.inputs[1].default_value = 1.8
    mix = N.new("ShaderNodeMixShader"); mix.name = "Ghost"; mix.inputs[0].default_value = 0.0
    L.new(em.outputs[0], mix.inputs[1]); L.new(ghost.outputs[0], mix.inputs[2])
    if emit:
        glow = N.new("ShaderNodeEmission"); glow.inputs[0].default_value = (*rgb, 1); glow.inputs[1].default_value = emit
        add = N.new("ShaderNodeAddShader"); L.new(mix.outputs[0], add.inputs[0]); L.new(glow.outputs[0], add.inputs[1]); L.new(add.outputs[0], out.inputs[0])
    else:
        L.new(mix.outputs[0], out.inputs[0])
    MATS[name] = m
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

INK = flat("Ink", (0.05, 0.04, 0.03))
INK.use_backface_culling = True

def outline(obj, width=0.025):
    obj.data.materials.append(INK)
    mod = obj.modifiers.new("Outline", "SOLIDIFY")
    mod.thickness = width; mod.offset = 1; mod.use_flip_normals = True
    mod.material_offset = len(obj.data.materials) - 1
    mod.use_rim = False

def place(obj, mat, parent=None, ink=True, w=0.025):
    obj.data.materials.append(mat)
    if ink: outline(obj, w)
    if parent: obj.parent = parent
    for p in obj.data.polygons: p.use_smooth = False
    return obj

def last(): return bpy.context.active_object

# ---- materials ----
WHITE = toon("White", (0.93, 0.91, 0.86)); GOLD = toon("Gold", (0.85, 0.64, 0.25))
METAL = toon("Metal", (0.55, 0.57, 0.6)); DARK = toon("Dark", (0.16, 0.16, 0.18))
GROUND = toon("Ground", (0.8, 0.38, 0.19)); ROCK = toon("Rock", (0.45, 0.24, 0.15))
FLAG_B = toon("FlagBlue", (0.2, 0.3, 0.65)); FLAG_R = toon("FlagRed", (0.75, 0.18, 0.15))
LANDER_MATS = [WHITE, GOLD, METAL, DARK, FLAG_B, FLAG_R]

# ---- the world: butterscotch day sky that can fade to a starry night ----
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
sky = wn.nodes.new("ShaderNodeMix"); sky.data_type = "RGBA"; sky.name = "Night"
wn.links.new(day.outputs[0], find(sky, "A_Color")); wn.links.new(sramp.outputs[0], find(sky, "B_Color"))
wn.links.new(find(sky, "Result_Color"), bg.inputs[0]); wn.links.new(bg.outputs[0], wo.inputs[0])
NIGHT = find(sky, "Factor_Float")

# ---- ground, rocks, and the boulder called Big Joe ----
bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=120, size=220)
g = last(); g.name = "Mars"
tex = bpy.data.textures.new("Dunes", "CLOUDS"); tex.noise_scale = 6
d = g.modifiers.new("Dunes", "DISPLACE"); d.texture = tex; d.strength = 0.9; d.mid_level = 0.6
g.data.materials.append(GROUND)
for poly in g.data.polygons: poly.use_smooth = True
for i in range(70):
    r = random.uniform(5, 60); a = random.uniform(0, 6.283)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.15, 0.7), location=(math.cos(a) * r, math.sin(a) * r, 0.05))
    o = last(); o.scale = (1, random.uniform(.7, 1.3), random.uniform(.45, .8)); o.rotation_euler[2] = a
    place(o, ROCK, w=0.03)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.6, location=(4.5, 7.5, 0.4))
joe = last(); joe.name = "BigJoe"; joe.scale = (1.4, 1, .65); place(joe, ROCK, w=0.04)

# ---- the Viking lander, from simple shapes ----
root = bpy.data.objects.new("Lander", None); sc.collection.objects.link(root)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=1.0, depth=0.45, location=(0, 0, 1.0)); place(last(), WHITE, root)
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=1.03, depth=0.07, location=(0, 0, 1.26)); place(last(), GOLD, root)
for ang in (90, 210, 330):
    a = math.radians(ang); top = Vector((math.cos(a) * .85, math.sin(a) * .85, .85)); foot = Vector((math.cos(a) * 1.75, math.sin(a) * 1.75, .12))
    mid = (top + foot) / 2; v = foot - top
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=.06, depth=v.length, location=mid)
    leg = last(); leg.rotation_mode = "QUATERNION"; leg.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(v); place(leg, METAL, root, w=.015)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.3, depth=.07, location=foot); place(last(), WHITE, root, w=.02)
for sx in (-1, 1):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(sx * .5, .35, 1.55)); o = last(); o.scale = (.34, .34, .4); place(o, DARK, root)
    for k in range(3):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(sx * .5, .35 + (k - 1) * .12, 1.82)); o = last(); o.scale = (.36, .02, .14); place(o, METAL, root, w=.01)
for (x, h) in ((.25, .55), (-.05, .48)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=.08, depth=h, location=(x, -.62, 1.25 + h / 2)); place(last(), WHITE, root, w=.015)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=.11, location=(x, -.62, 1.28 + h)); place(last(), DARK, root, w=.015)
bpy.ops.mesh.primitive_cube_add(size=1, location=(1.25, -.2, .75)); o = last(); o.scale = (1.0, .07, .07); o.rotation_euler[1] = .35; place(o, METAL, root, w=.015)
bpy.ops.mesh.primitive_cube_add(size=1, location=(1.72, -.2, .5)); o = last(); o.scale = (.22, .16, .12); place(o, METAL, root, w=.015)
bpy.ops.mesh.primitive_plane_add(size=1, location=(.2, -.88, 1.02)); o = last(); o.scale = (.34, .22, 1); o.rotation_euler[0] = math.radians(90); place(o, FLAG_R, root, ink=False)
bpy.ops.mesh.primitive_plane_add(size=1, location=(.08, -.885, 1.06)); o = last(); o.scale = (.12, .1, 1); o.rotation_euler[0] = math.radians(90); place(o, FLAG_B, root, ink=False)
# the dish, on a mast, with a pivot we can turn
bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=.05, depth=1.0, location=(-.5, -.3, 1.75)); place(last(), METAL, root, w=.012)
pivot = bpy.data.objects.new("DishPivot", None); sc.collection.objects.link(pivot); pivot.parent = root; pivot.location = (-.5, -.3, 2.28)
bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=.62, radius2=.08, depth=.22, location=(0, 0, 0))
dish = last(); dish.name = "Dish"; dish.rotation_euler[0] = math.radians(-90); place(dish, WHITE, None, w=.02); dish.parent = pivot; dish.location = (0, .18, 0)
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.02, depth=.45, location=(0, .4, 0)); f = last(); f.rotation_euler[0] = math.radians(90); place(f, METAL, None, w=.01); f.parent = pivot

# ---- Earth in the sky, the Sun, and the light ----
EARTH = Vector((-38, 62, 30))
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.4, location=EARTH); place(last(), flat("EarthGlow", (0.42, 0.72, 1.0), 4.0), ink=False)
sun = bpy.data.lights.new("Sun", "SUN"); sun.energy = 3.0; sun.angle = .2
sunobj = bpy.data.objects.new("Sun", sun); sc.collection.objects.link(sunobj); sunobj.rotation_euler = (math.radians(50), 0, math.radians(35))

# dish yaw/pitch to face a point
def aim_angles(target):
    d = (target - (Vector(root.location) + Vector(pivot.location))).normalized()
    yaw = math.atan2(-d.x, d.y); pitch = math.asin(max(-1, min(1, d.z)))
    return (pitch, 0, yaw)
HOME = aim_angles(EARTH)
AWAY = (math.radians(8), 0, HOME[2] + math.radians(150))

# ---- radio rings, retro flames, landing dust ----
RING = flat("Radio", (0.25, 0.85, 1.0), 3.0, alpha=0.0)
rings = []
for i in range(3):
    bpy.ops.mesh.primitive_torus_add(major_radius=.45, minor_radius=.035, major_segments=40, minor_segments=8)
    r = last(); r.name = f"Ring{i}"; r.data.materials.append(RING.copy()); rings.append(r)
FLAME = flat("Flame", (1.0, 0.62, 0.2), 6.0)
flames = []
for ang in (90, 210, 330):
    a = math.radians(ang)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=.18, radius2=0, depth=1.1, location=(math.cos(a) * .7, math.sin(a) * .7, .25))
    fl = last(); fl.rotation_euler[0] = math.pi; fl.data.materials.append(FLAME); fl.parent = root; flames.append(fl)
PUFF = flat("Puff", (0.8, 0.5, 0.32), 1.0, alpha=0.0)
bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=.35, location=(0, 0, .25)); puff = last(); puff.data.materials.append(PUFF)

# ---- the camera and what it looks at ----
cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 32
cam = bpy.data.objects.new("Cam", cam_data); sc.collection.objects.link(cam); sc.camera = cam
aim = bpy.data.objects.new("Aim", None); sc.collection.objects.link(aim)
tr = cam.constraints.new("TRACK_TO"); tr.target = aim; tr.track_axis = "TRACK_NEGATIVE_Z"; tr.up_axis = "UP_Y"
def shot(s, cpos, apos):
    cam.location = cpos; cam.keyframe_insert("location", frame=F(s))
    aim.location = apos; aim.keyframe_insert("location", frame=F(s))

def mats_key(socket_name, s, value):
    for m in LANDER_MATS:
        n = m.node_tree.nodes[socket_name]
        sock = find(n, "Factor_Float") if socket_name == "Dust" else n.inputs[0]
        sock_key(sock, F(s), value)

(b1, b2, b3, b4, b5, b6) = B
# title: night sky
sock_key(NIGHT, 1, 1.0); sock_key(NIGHT, F(b1[0] + .2), 1.0); sock_key(NIGHT, F(b1[0] + 1.4), 0.0)
shot(0, (0, -30, 3), (0, 30, 40)); shot(b1[0] - .2, (0, -30, 3), (0, 30, 40))
# 1. descent
root.location = (0, 0, 46); root.keyframe_insert("location", frame=F(b1[0]))
root.location = (0, 0, 0); root.keyframe_insert("location", frame=F(b2[0]))
shot(b1[0], (7, -13, 1.2), (0, 0, 44)); shot(b1[0] + 4, (7, -13, 1.2), (0, 0, 22)); shot(b2[0], (7, -13, 1.2), (0, 0, 1.4))
for fl in flames:
    fl.scale = (0, 0, 0); fl.keyframe_insert("scale", frame=F(b2[0] - 3.2))
    for k in range(int(3 * 6)):
        fl.scale = (1, 1, random.uniform(.7, 1.3)); fl.keyframe_insert("scale", frame=F(b2[0] - 3 + k / 6))
    fl.scale = (0, 0, 0); fl.keyframe_insert("scale", frame=F(b2[0] + .1))
# 2. landing: a dust puff, a close look at the footpad, then a medium shot
puff.scale = (.3, .3, .3); puff.keyframe_insert("scale", frame=F(b2[0]))
puff.scale = (3.5, 3.5, 1.2); puff.keyframe_insert("scale", frame=F(b2[0] + 1.6))
pm = puff.data.materials[0].node_tree.nodes["Alpha"].inputs[0]
sock_key(pm, F(b2[0] - .1), 0); sock_key(pm, F(b2[0]), .85); sock_key(pm, F(b2[0] + 1.6), 0)
shot(b2[0] + .4, (3.2, -3.4, .45), (1.4, -1.0, .2)); shot(b2[0] + 3.2, (3.0, -3.6, .6), (1.2, -1.0, .35)); shot(b2[1], (6.5, -8, 2.4), (0, 0, 1.3))
# 3. work: dish to Earth, radio rings flying home
pivot.rotation_euler = HOME; pivot.keyframe_insert("rotation_euler", frame=1)
shot(b3[0], (8, -6, 2.6), (0, 0, 1.8)); shot(b3[0] + 3.5, (3, -9, 3), (-1, 2, 2.6)); shot(b3[1], (-6, -7, 3.2), (-1.5, 3, 3))
dirv = (EARTH - (Vector(pivot.location))).normalized()
def ring_pulses(t0, t1, direction, strength):
    for i, r in enumerate(rings):
        r.rotation_mode = "QUATERNION"; r.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction)
        r.keyframe_insert("rotation_quaternion", frame=F(t0))
        a = r.data.materials[0].node_tree.nodes["Alpha"].inputs[0]
        s = t0 + i * .4
        while s + 1.2 < t1:
            r.location = Vector(pivot.location) + direction * .3; r.scale = (.6, .6, .6)
            r.keyframe_insert("location", frame=F(s)); r.keyframe_insert("scale", frame=F(s)); sock_key(a, F(s), strength)
            r.location = Vector(pivot.location) + direction * 7; r.scale = (3, 3, 3)
            r.keyframe_insert("location", frame=F(s + 1.2)); r.keyframe_insert("scale", frame=F(s + 1.2)); sock_key(a, F(s + 1.2), 0)
            s += 1.2
        sock_key(a, F(t1), 0)
ring_pulses(b3[0] + .5, b3[1], dirv, .9)
# 4. the wrong command: the dish swings away
shot(b4[0], (-3.6, -4.6, 2.6), (-.5, -.3, 2.25)); shot(b4[1], (-4.4, -5.2, 2.9), (-.5, -.2, 2.3))
pivot.keyframe_insert("rotation_euler", frame=F(b4[0] + 1.6))
pivot.rotation_euler = AWAY; pivot.keyframe_insert("rotation_euler", frame=F(b4[0] + 4.6))
away_dir = Vector((math.sin(-AWAY[2]) * math.cos(AWAY[0]), math.cos(AWAY[2]) * math.cos(AWAY[0]), math.sin(AWAY[0])))
ring_pulses(b4[0] + 4.8, b4[1], away_dir.normalized(), .35)
# 5. years go by: days and nights flicker, the dust settles
shot(b5[0], (10, -14, 4), (0, 0, 1)); shot(b5[1], (10.5, -14.5, 4.2), (0, 0, 1))
sunobj.keyframe_insert("rotation_euler", frame=F(b5[0]))
n = 8
for k in range(n + 1):
    s = b5[0] + (b5[1] - b5[0]) * k / n
    sock_key(NIGHT, F(s), 1.0 if k % 2 else 0.0)
sunobj.rotation_euler = (math.radians(50), 0, math.radians(35 + 360 * 4)); sunobj.keyframe_insert("rotation_euler", frame=F(b5[1]))
mats_key("Dust", b5[0], 0.05); mats_key("Dust", b5[1], 0.7)
# 6. still here: night, a pale ghostly glow, the camera pulls back with Earth in the sky
sock_key(NIGHT, F(b6[0]), 1.0); sock_key(NIGHT, F(END), 1.0)
mats_key("Ghost", b6[0], 0.0); mats_key("Ghost", b6[0] + 4, 0.55); mats_key("Ghost", END, 0.55)
shot(b6[0], (9, -12, 3.5), (0, 0, 1.6)); shot(END, (12, -17, 5.5), (-2, 6, 3.5))

# smooth starts and stops everywhere
for ob in bpy.data.objects:
    ad = ob.animation_data
    if ad and ad.action:
        try:
            for fc in ad.action.fcurves:
                for kp in fc.keyframe_points: kp.interpolation = "BEZIER"
        except Exception: pass

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "viking.blend"))
print("BUILT", F(END), "frames", json.dumps(B))
