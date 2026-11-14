# Dossier Improvements — Archival Folder Redesign

## Executive Summary
This document outlines the complete redesign of the **"View Dossier"** feature for **PROJECT-AREA-51 / Ghosts of Exploration**. 

Previously, the dossier was implemented as a narrow sidebar drawer glued to the right edge of the viewport (`right: 0; width: min(620px, 100vw);`) with a generic slide-in animation. It felt cramped, unbalanced on modern widescreen displays, and did not evoke the feeling of reading through an authentic archival mission folder.

The redesign transforms the dossier into a **centered, tactile, archival mission folder** with a **3D folder-opening animation** that reveals the classified briefing sheets inside in a neat, clean, and highly polished manner.

---

## Key Improvements At A Glance

| Aspect | Before | After (Redesign) |
| :--- | :--- | :--- |
| **Positioning** | Glued to the right edge (`top: 0; right: 0; bottom: 0`) | **Centered** in the viewport (`top: 50%; left: 50%; transform: translate(-50%, -50%)`) |
| **Width & Space** | Max 620px, cramped data layouts | **880px wide** (`min(880px, calc(100vw - 32px))`), giving content room to breathe |
| **Metaphor** | Generic web slide-over drawer | **Archival Dossier Folder** with spine, rivets, folder tab, and classified security seal |
| **Opening Animation** | Simple 1D slide (`translateX(40px)`) | **3D Folder Open (1.08s)**: Front cover unclasps and hinges open in 3D perspective (`rotateY(-125deg)`), while document sheets slide up and illuminate smoothly |
| **Page Flipping** | Instant DOM swap | **Tactile Page Flip**: Smooth document slide & settle when switching between artifacts with `‹` and `›` (isolated from initial open) |
| **Closing Transition** | Abrupt DOM hide (`hidden = true`) | **Graceful Folder Close**: Smooth scale-down and fade-out before unmounting |
| **Stability** | Double hover/bob glitch | **Rock-Solid Entry**: Modal shell remains stationary on the Y-axis; no double animation or mid-flight style reset |
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

### 2. Animated 3D Folder Opening Experience (Pacing & Stability Refinements)
- **Files modified:** `site/index.html`, `site/css/style.css`, `site/js/app.js`
- Added the `.folder-cover` element inside `#drawer`:
  - Modeled as the heavy front flap of a classified archival file jacket.
  - Stamped with `DECLASSIFIED`, `★ NASA HISTORIC ARCHIVE ★`, project serial numbers, barcode, and an authentic folder clasp with string tie.
  - Dynamically displays the current artifact name and world code.
- **Pacing Adjusted (1.08s):**
  - Slightly relaxed from earlier iterations to give an authentic, majestic feel where the user can comfortably see the physical folder, watch the clasp unfasten, and witness the cover swing open in 3D perspective.
- **Resolved "Double Hovering / Loading Twice" Issue:**
  - *Cause:* Previously, `renderDrawer()` was applying `.page-flip` on initial open simultaneously with `folderModalEnter` and `folderContentReveal`. When a JS timer stripped `.is-opening`, the browser dropped the fill-mode and re-applied the `.page-flip` translation, making the window look like it loaded a second time.
  - *Fix:*
    1. Isolated `.page-flip` so it only fires when clicking Prev/Next (`isFlip === true`), never on initial open.
    2. Locked the modal shell to `translate(-50%, -50%)` without vertical translation shifts.
    3. Handled cover flap dismissal cleanly via `animationend` without resetting `.drawer.is-opening` mid-flight.

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
