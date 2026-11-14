# Animation & Styling Technical Specification

This document provides technical specifications for the centered folder dossier animation and visual styling implemented in **PROJECT-AREA-51 / Ghosts of Exploration**.

---

## 1. 3D Perspective & Spatial Geometry

### Modal Shell Dimensions
- **Centering Mechanism:**
  - `top: 50%; left: 50%; transform: translate(-50%, -50%);`
  - Position: `fixed`
  - Target Width: `min(880px, calc(100vw - 32px))`
  - Target Height: `min(880px, calc(100vh - 48px))`
  - Max Height Constraint: `calc(100vh - 48px)`
  - Border Radius: `20px`
  - Z-Index: `61` (above scrim at `60`, below toast at `90`)
  - **No 2D Clipping (`overflow: visible`):** Outer `.drawer` maintains `overflow: visible` so that the 3D swinging cover flap is not clipped along the left boundary during rotation. Internal scrolling is safely encapsulated inside `#drawerBody` (`overflow-y: auto`, `border-radius: 0 0 20px 20px`).
  - **Stationary Shell:** The modal container appears via a quick 0.35s scale settle (`scale(0.97) -> scale(1)`) while anchored firmly at `translate(-50%, -50%)`. It never shifts vertically during entry.
- **3D Context:**
  - `perspective: 1600px;`
  - `transform-style: preserve-3d;`
  - This establishes the focal length for 3D rotation of the folder flap cover.

---

## 2. Animation Sequences & Keyframes

### Sequence Timeline (On Open - Total Duration: 1.80s)
```
0.00s ---------------- 0.35s ------------- 0.75s ---- 0.85s ---------------- 1.80s
|-- Scrim Fades In -----|
|-- Folder Arrives -----|
|========== Name & Cover Visible Beat =============|
                                           |-- Clasp --|
                                                       |-- Smooth Cover Swing Open -->|
                                                       |-- Content Slides Up & Fades ->|
```

### Keyframe Details

#### 1. Folder Cover Flap Opening (`@keyframes folderFlapOpen`)
- **Transform Origin:** `0% 50%` (left edge / folder spine)
- **Timing Function:** `cubic-bezier(0.25, 1, 0.35, 1)` (continuous pure ease-out)
- **Animation Delay:** `0.85s` (holds closed cover stationary for reading)
- **Duration:** `0.95s`
```css
@keyframes folderFlapOpen {
  0% {
    transform: perspective(1400px) rotateY(0deg);
    opacity: 1;
    filter: brightness(1) drop-shadow(10px 0 25px rgba(0,0,0,0.85));
    visibility: visible;
  }
  70% {
    opacity: 0.9;
  }
  100% {
    transform: perspective(1400px) rotateY(-125deg);
    opacity: 0;
    visibility: hidden;
  }
}
```

#### 2. Clasp Unfastening (`@keyframes claspUnfasten`)
- **Timing Function:** `ease-out`
- **Animation Delay:** `0.75s` (fires right before the cover begins to swing)
- **Duration:** `0.35s`
```css
@keyframes claspUnfasten {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.95; }
  100% { transform: scale(0.9) translateY(4px); opacity: 0.2; }
}
```

#### 3. Inner Content Sheet Reveal (`@keyframes folderContentReveal`)
- **Target:** `.drawer-body` inside `.drawer.is-opening`
- **Timing Function:** `cubic-bezier(0.25, 1, 0.35, 1)`
- **Animation Delay:** `0.85s` (runs in lockstep with the swinging cover)
- **Duration:** `0.95s`
```css
@keyframes folderContentReveal {
  0% {
    opacity: 0;
    transform: translateY(24px);
    filter: blur(2px) brightness(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0) brightness(1);
  }
}
```

#### 4. Modal Shell Arrival (`@keyframes folderModalEnter`)
- **Duration:** `0.35s`
- **Timing Function:** `ease-out`
```css
@keyframes folderModalEnter {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
```

#### 5. Record Flip Transition (`@keyframes folderPageFlip`)
- **Trigger:** Prev / Next artifact step (`#dPrev`, `#dNext`) via `renderDrawer(n, true)`
- **Duration:** `0.30s`
- **Curve:** `cubic-bezier(0.2, 0.8, 0.25, 1)`
```css
@keyframes folderPageFlip {
  0% {
    opacity: 0.35;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 6. Graceful Exit Sequence (`@keyframes folderModalExit` & `scrimFadeOut`)
- **Duration:** `0.22s - 0.24s`
- **Curve:** `cubic-bezier(0.4, 0, 1, 1)`
```css
@keyframes folderModalExit {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -46%) scale(0.95);
  }
}
```

---

## 3. Visual Tactile Elements

### Folder Spine Strip
- **Element:** `.folder-spine`
- **Width:** `14px`
- **Gradient:** `linear-gradient(90deg, #060912, #18243b 50%, #0d1526)`
- **Rivets:** Steel grommets (`6px x 6px`) with bevel highlights.
- **Binder Stitch:** Dashed vertical amber-tinted thread line (`1px dashed rgba(255, 179, 71, 0.3)`).

### Asymmetrical Folder Tab
- **Element:** `.folder-tab-bar` & `.folder-tab`
- **Elevation:** Protrudes above the document sheet with rounded top corners (`border-radius: 10px 10px 0 0`).
- **Metadata:** Displays active machine name, world classification pill, and `RESTRICTED RECORD` stamp.

### Archival Paper Clip
- **Selector:** `.d-main::before`
- **Appearance:** Rounded metallic paper clip resting over the top-right corner of the document sheet.
- **Dimensions:** `14px x 38px`, `border: 2px solid #7c92b3`, `opacity: 0.55`.

### Declassified Record Watermark
- **Selector:** `.d-main::after`
- **Text:** `DECLASSIFIED RECORD`
- **Angle:** `-1.5deg` slant with amber border box.

---

## 4. Responsive Breakpoints

| Viewport Width | Folder Width | Folder Height | Spine Width | Content Padding |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop (>768px)** | `min(880px, 92vw)` | `min(880px, 90vh)` | `14px` | `22px 28px 0` |
| **Tablet (601px - 768px)** | `min(94vw, 700px)` | `min(92vh, 800px)` | `14px` | `18px 20px 0` |
| **Mobile (<=600px)** | `calc(100vw - 16px)` | `calc(100dvh - 24px)` | `8px` | `14px 16px 0` |

---

## 5. Accessibility & Performance
- **`prefers-reduced-motion: reduce`**: Disables 3D flap animations, instant opacity transitions, and preserves all keyboard navigation and focus trapping.
- **Hardware Acceleration:** All animated properties rely exclusively on `transform` and `opacity` to avoid layout reflows and guarantee 60fps on modern GPUs.
