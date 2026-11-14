# Dossier Improvements — Archival Folder Redesign

## Executive Summary
This document outlines the complete redesign of the **"View Dossier"** feature for **PROJECT-AREA-51 / Ghosts of Exploration**. 

Previously, the dossier was implemented as a narrow sidebar drawer glued to the right edge of the viewport (`right: 0; width: min(620px, 100vw);`) with a generic slide-in animation. It felt cramped, unbalanced on modern widescreen displays, and did not evoke the feeling of reading through an authentic archival mission folder.

The redesign transforms the dossier into a **centered, tactile, archival mission folder** with a **two-phase 3D folder-opening animation**:
1. **Readable Cover Phase (~0.85s):** The closed classified folder arrives in the center of the viewport, presenting the artifact's name, NASA mission stamps, and security clasp in bold, crisp typography for the user to read clearly.
2. **Smooth Full Opening Phase (~0.95s):** The security clasp unfastens, and in one single, continuous, uninterrupted 3D gesture, the front cover swings open to the left, revealing the clean briefing sheets inside.

---

## Key Improvements At A Glance

| Aspect | Before | After (Redesign) |
| :--- | :--- | :--- |
| **Positioning** | Glued to the right edge (`top: 0; right: 0; bottom: 0`) | **Centered** in the viewport (`top: 50%; left: 50%; transform: translate(-50%, -50%)`) |
| **Width & Space** | Max 620px, cramped data layouts | **880px wide** (`min(880px, calc(100vw - 32px))`), giving content room to breathe |
| **Metaphor** | Generic web slide-over drawer | **Archival Dossier Folder** with spine, rivets, folder tab, and classified security seal |
| **Read Beat** | Cover vanished immediately | **Name Readable for ~0.85s**: Machine name, mission tags, and classified stamp stay clearly legible before opening |
| **Opening Motion** | Segmented stutter (stop-and-go) | **Single Smooth 3D Sweep**: Evaluated continuously from `0deg` to `-125deg` with pure `cubic-bezier(0.25, 1, 0.35, 1)` |
| **Page Flipping** | Instant DOM swap | **Tactile Page Flip**: Smooth document slide & settle when switching between artifacts with `‹` and `›` (isolated from initial open) |
| **Closing Transition** | Abrupt DOM hide (`hidden = true`) | **Graceful Folder Close**: Smooth scale-down and fade-out before unmounting |
| **Stability** | Double hover/bob glitch | **Rock-Solid Entry**: Modal shell remains stationary on the Y-axis; no mid-flight style reset |
| **Aesthetics & Details**| Plain dark background | Textured archival cardstock, brass rivets, binder spine, paper clip accent, and declassified watermark |
| **Mobile & Accessibility** | Generic mobile drawer | Responsive centered modal with touch padding and full `prefers-reduced-motion` support |

---

## Core Changes Implemented

### 1. Viewport Centering & Frame Layout
- **Files modified:** `site/css/style.css`
- Centered the `.drawer` container horizontally and vertically using:
  ```css
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(880px, calc(100vw - 32px));
  height: min(880px, calc(100vh - 48px));
  max-height: calc(100vh - 48px);
  ```
- Removed container clipping (`overflow: visible` on `.drawer` while `.drawer-body` handles internal scrolling with `border-radius: 0 0 20px 20px`), allowing full 3D rotation without clipping along the left boundary.
- Added rounded folder corners (`border-radius: 20px`), rich multi-layered drop shadows (`0 30px 90px -15px rgba(0, 0, 0, 0.92)`), and an amber ambient rim glow (`rgba(255, 179, 71, 0.18)`).
- Increased backdrop scrim blur to `6px` with deep dark contrast for cinematic focus.

### 2. Animated Two-Phase 3D Folder Opening Experience
- **Files modified:** `site/index.html`, `site/css/style.css`, `site/js/app.js`
- Added the `.folder-cover` element inside `#drawer`:
  - Modeled as the heavy front flap of a classified archival file jacket.
  - Stamped with `DECLASSIFIED`, `★ NASA HISTORIC ARCHIVE ★`, project serial numbers, barcode, and an authentic folder clasp with string tie.
  - Dynamically displays the current artifact name and world code in high-contrast typography.
- **Readable Beat (0.00s to 0.85s):**
  - Staged using `animation-delay: 0.85s; animation-fill-mode: both;`.
  - The folder arrives in the center and rests stationary, allowing the user to clearly read the title and classification stamp.
- **Continuous 3D Hinge Motion (0.85s to 1.80s):**
  - Originates from the left spine (`transform-origin: 0% 50%`).
  - Swings open through a pure, uninterrupted bezier curve from `0deg` directly to `-125deg` (`cubic-bezier(0.25, 1, 0.35, 1)`). All intermediate angle steps were removed to eliminate the previous stop-and-go stutter.
  - The security clasp visibly unfastens at `0.75s` right before the swing begins.
  - As the cover opens, the inner document sheets (`.drawer-body`) glide up and illuminate in lockstep (`translateY(24px) -> translateY(0)`).
  - The cover cleanly unmounts via `animationend` without resetting styles or causing secondary layout jumps.

### 3. Tactile Folder Spine & Tab Bar
- **Files modified:** `site/index.html`, `site/css/style.css`
- **Left Binder Spine (`.folder-spine`):**
  - Simulated metal grommets/rivets (`.spine-rivet`) at top and bottom.
  - Vertical dashed binder stitch line (`.spine-stitch`).
- **Top Folder Tab (`.folder-tab-bar`):**
  - Asymmetrical folder tab shape protruding from the top left.
  - Contains folder icon 📁, dynamic machine name, and world badge (e.g. `APOLLO 11 // DOSSIER [MOON]`).
  - Red dashed `RESTRICTED RECORD` archival classification stamp.
- **Document Accent Details:**
  - Archival metallic paper clip (`.d-main::before`) resting at the top right of the dossier sheets.
  - Subtle `DECLASSIFIED RECORD` watermark stamp (`.d-main::after`).

---

## Documentation Structure
The following detailed documents are available in this folder:
- **`README.md`**: High-level overview and before/after comparison (this document).
- **`ANIMATION_AND_STYLING_SPEC.md`**: Complete CSS animation timings, bezier curves, 3D perspective specifications, and visual design tokens.
- **`CHANGES_LOG.md`**: Line-by-line file changes and architectural implementation details.
