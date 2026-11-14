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
