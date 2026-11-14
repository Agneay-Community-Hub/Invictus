# Changes Log — Dossier Improvements

This log documents all file changes, architecture modifications, and validation steps performed for the Dossier Redesign in **PROJECT-AREA-51 / Ghosts of Exploration**.

---

## 1. Directory Structure

```
PROJECT-AREA-51/
├── dossier improvements/                <-- [NEW FOLDER CREATED]
│   ├── README.md                       <-- Overview, comparison, and summary
│   ├── ANIMATION_AND_STYLING_SPEC.md   <-- Technical specifications and 3D physics
│   └── CHANGES_LOG.md                  <-- Detailed changelog (this file)
├── site/
│   ├── index.html                      <-- [MODIFIED] Added folder-cover, folder-spine, folder-tab-bar
│   ├── css/
│   │   └── style.css                   <-- [MODIFIED] Centering, 3D folder keyframes, responsive rules
│   ├── js/
│   │   └── app.js                      <-- [MODIFIED] Folder opening/closing orchestration, forced reflow
│   └── sw.js                           <-- [RE-GENERATED] Offline cache updated to version d830404b9f
```

---

## 2. Iteration 3: Name Legibility Beat & Smooth 3D Sweep Refinements

### Problem Addressed:
1. **Name not readable on cover:** Animation began immediately upon opening, leaving no time to see the machine's name on the closed folder.
2. **Opening stutter / step-stop:** The cover opened a bit (-22deg), slowed down/stopped at intermediate angles, and then opened fully.

### Root Cause Analysis:
1. Multiple intermediate keyframe stops (`26%`, `62%`, `90%`) with disparate angle steps caused CSS easing curves (`cubic-bezier`) to independently accelerate and decelerate per keyframe segment, producing an unnatural stop-and-go stutter.
2. The lack of an initial readable delay prevented the user from registering the machine's name and classification stamps before the cover unclasped.

### Solutions Implemented:
1. **Readable Cover Beat (0.00s to 0.85s):**
   - Staged the opening animation with `animation-delay: 0.85s; animation-fill-mode: both;`.
   - The closed folder arrives cleanly in 0.35s and rests completely stationary for ~0.85s. The user can clearly read the machine's name (`#dCoverName`), `DECLASSIFIED` stamp, and `★ NASA HISTORIC ARCHIVE ★` seal.
2. **Clasp Pop Beat (0.75s to 1.10s):**
   - The security clasp unfastens at 0.75s (`claspUnfasten 0.35s ease-out 0.75s both`), visibly popping open just before the cover begins to hinge open.
3. **Pure Continuous 3D Opening Motion (0.85s to 1.80s):**
   - Replaced multi-step keyframes with a single uninterrupted trajectory from `0deg` directly to `-125deg` using `cubic-bezier(0.25, 1, 0.35, 1)`.
   - The cover swings smoothly in one fluid motion without any hesitation, hitch, or step.
4. **Synchronized Inner Content Glide:**
   - Inner document sheets (`.drawer-body`) stay hidden at frame 0 during the initial 0.85s read beat, then glide upward (`translateY(24px) -> translateY(0)`) and de-blur in exact synchrony with the swinging cover.
5. **Cache Fingerprint Re-Build:**
   - Re-ran `node scripts/build-sw.mjs` to update all 557 script/link fingerprints and update `site/sw.js` to version `d830404b9f`.

---

## 3. Validation & Quality Assurance

1. **Brace & Syntax Validation:**
   - Checked `site/css/style.css`: Verified matching open/close braces (828 pairs) with 0 syntax errors.
   - Checked `site/js/app.js`: Verified using `node -c site/js/app.js` with 0 syntax errors.
   - Checked `site/index.html`: Verified using Python HTML parser with 0 syntax errors.

2. **Behavioral Verification:**
   - Initial dossier open: Closed folder arrives and rests for ~0.85s with the machine's name in bold, high-contrast typography. Clasp pops at 0.75s. Cover swings open in one continuous, fluid 3D motion to reveal the documents.
   - No second hover: Window shell stays firmly anchored at `translate(-50%, -50%)`.
   - Prev/Next navigation: Smooth 0.30s `page-flip` between records inside the open folder.
   - Close: Graceful 0.22s scale-down and fade-out.

---

## 4. Merge Conflict Resolution & State Synchronization

### Context:
Merging branch `dossier_improvements` with the latest updates from incoming branch (`MERGE_HEAD` / `424e0d5ad467e1269ad160803ffcc80af7a0c54e`) introduced conflicts across 49 files.

### Resolution Strategy:
1. **Incoming Features Accepted:**
   - All 49 files from `MERGE_HEAD` were incorporated, including `site/js/start.js`, the curated "Start here: six curated stops" section, updated canonical links to `Invictus`, NSSDCA official record link buttons in `site/js/app.js`, and updated pitch deck documentation.
2. **Dossier Improvements Preserved:**
   - `site/index.html`: Restored the centered physical folder dossier markup (`#drawer.folder-dossier`, `#folderCover`, `.folder-spine`, `.folder-tab-bar`, and `#drawerBody`).
   - `site/js/app.js`: Reintegrated folder opening and closing orchestration (`openDrawer`, `closeDrawer`, `renderDrawer(id, isFlip)`), the 0.85s readable name delay on cover, reflow triggers, and the NSSDCA official record link button.
   - `site/css/style.css`: Restored centered `.drawer` modal container, tactile folder details (spine rivets, stitching, metallic paper clip, declassified watermark), and all 3D opening keyframes while preserving `MERGE_HEAD`'s styles (`.start`, `.gotd`, etc.).
3. **Cache Synchronization:**
   - Executed `node scripts/build-sw.mjs` to re-stamp all 558 script/link fingerprints and update `site/sw.js` cache version.
4. **Merge Finalization:**
   - All unmerged paths staged cleanly with `git add .` and committed.

---

## 5. Iteration 4: Flap Animation Selector & Class Binding Fix

### Problem Addressed:
The dossier opened and showed the front page titles, but did not perform the 3D swing-open animation; instead, after a brief pause, the cover vanished abruptly and showed the inner content.

### Root Cause Analysis:
1. **Selector Mismatch:** In `site/css/style.css`, the keyframe rule was scoped strictly to `.folder-cover.is-opening`. However, `openDrawer` in `site/js/app.js` was only adding `is-opening` to the parent `#drawer` container, never to `#folderCover`.
2. **Missing Animation Trigger:** Because `#folderCover` lacked `.is-opening`, `animation: folderFlapOpen` was never applied. The cover was only displayed statically via inline `cover.style.display = "flex"`.
3. **Premature Fallback Timeout:** Because the animation never ran, the `animationend` event never fired, causing the cover to remain static until the fallback `setTimeout` unmounted it abruptly with `cover.style.display = "none"`.
4. **Child Event Collision:** The `animationend` listener on `cover` had `{ once: true }`. When the child clasp finished its 0.35s unfasten animation and bubbled up, it prematurely removed the listener before `folderFlapOpen` could complete.

### Solution:
1. **Dual Selector Support:** Updated `site/css/style.css` to match both `.drawer.is-opening .folder-cover` and `.folder-cover.is-opening` (as well as for `.folder-clasp` and reduced-motion overrides).
2. **Explicit Class Management:** Updated `openDrawer` in `site/js/app.js` to explicitly add `cover.classList.add("is-opening")` alongside `drawer.classList.add("is-opening")`, and cleanly strip it in `closeDrawer`.
3. **Specific Animation-End Target:** Revised `onCoverEnd` to check specifically for `e.animationName === "folderFlapOpen"`, removing `{ once: true }` so child clasp animations do not consume or unbind the listener.
4. **Compositor & 3D Polish:** Added `overflow: visible;` on `.drawer` to prevent 3D clipping at `-125deg`, added `will-change: transform, opacity;` to `.folder-cover`, and set `70% { opacity: 0.95; }` in `@keyframes folderFlapOpen` to keep the physical folder flap solid and opaque as it swings.
5. **Re-stamped Service Worker:** Re-ran `node scripts/build-sw.mjs` (version `5497b42d72`).
