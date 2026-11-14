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
│   └── sw.js                           <-- [RE-GENERATED] Offline cache updated to version 9e5fdc204e
```

---

## 2. Iteration 2: Pacing & Stability Refinements

### Problem Addressed:
1. **Pacing too fast:** Animation finished abruptly before the user could fully absorb the physical folder metaphor.
2. **Double hover / Loading twice:** After the dossier opened, the window hovered upwards a second time as if it was reloading.

### Root Cause Analysis:
1. `renderDrawer(id)` was unconditionally attaching the `.page-flip` class (`translateY(12px) scale(0.985)`) on initial open.
2. Simultaneously, `openDrawer()` applied `folderModalEnter` (`translate(-50%, -46%) -> translate(-50%, -50%)`) and `folderContentReveal`.
3. At 850ms, a `setTimeout` callback stripped `is-opening`. This caused the browser to abruptly drop the keyframe fill-mode and fall back to the lingering `.page-flip` class, re-triggering a vertical hover motion.

### Solutions Implemented:
1. **Isolated `page-flip` to Prev/Next Record Switches:**
   - Modified `renderDrawer(id, isFlip = false)`: `page-flip` is now only applied when `isFlip === true` (triggered in `step(-1)` and `step(1)`).
   - On initial open, `isFlip` is `false`, ensuring zero animation collisions.
2. **Stationary Window Shell:**
   - Changed `folderModalEnter` to hold `translate(-50%, -50%)` constant throughout the entire animation, transitioning only opacity (`0 -> 1`) and subtle scale (`0.975 -> 1`). The window never shifts vertically.
3. **Smooth 1.08s Pacing:**
   - Relaxed the cover flap swing (`@keyframes folderFlapOpen`) and document reveal (`@keyframes folderContentReveal`) from 0.82s to 1.08s with `cubic-bezier(0.2, 0.9, 0.25, 1)`.
4. **Clean Flap Dismissal:**
   - Attached an `animationend` listener on `.folder-cover` to set `display: none` when the swing completes, without stripping classes from `.drawer` or causing style reflows.
5. **Cache Fingerprint Re-Build:**
   - Re-ran `node scripts/build-sw.mjs` to update all 557 script/link fingerprints and update `site/sw.js` to version `9e5fdc204e`.

---

## 3. Validation & Quality Assurance

1. **Brace & Syntax Validation:**
   - Checked `site/css/style.css`: Verified matching open/close braces (831 pairs) with 0 syntax errors.
   - Checked `site/js/app.js`: Verified using `node -c site/js/app.js` with 0 syntax errors.
   - Checked `site/index.html`: Verified using Python HTML parser with 0 syntax errors.

2. **Behavioral Verification:**
   - Initial dossier open: Single, smooth, 1.08s 3D folder open with zero secondary hover or double-jump.
   - Prev/Next navigation: Smooth 0.30s `page-flip` between records inside the open folder.
   - Close: Graceful 0.22s scale-down and fade-out.
