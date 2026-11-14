"""Makes small copies of the NASA photos for card grids and lists.

Usage (from the repo root):  python scripts/build-thumbs.py
Needs Pillow (pip install Pillow). Writes site/assets/nasa/thumb/<same name>.jpg,
at most 560 px wide: sharp on a 280 px card on a 2x screen, about a quarter of the bytes.
Re-run it after adding a photo to site/assets/nasa/. Existing thumbnails that are newer
than their photo are skipped. Dossiers, lightboxes and print pages keep the full photo.
"""
import os
import sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site", "assets", "nasa")
OUT = os.path.join(ROOT, "thumb")
WIDTH = 560

os.makedirs(OUT, exist_ok=True)
made = skipped = 0
for name in sorted(os.listdir(ROOT)):
    src = os.path.join(ROOT, name)
    if not name.lower().endswith((".jpg", ".jpeg", ".png")) or not os.path.isfile(src):
        continue
    dst = os.path.join(OUT, os.path.splitext(name)[0] + ".jpg")
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src) and "--force" not in sys.argv:
        skipped += 1
        continue
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(dst, "JPEG", quality=80, optimize=True, progressive=True)
    made += 1
print(f"Thumbnails: {made} made, {skipped} up to date, in {os.path.relpath(OUT)}")
