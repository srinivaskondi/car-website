# NOCTIS — The City is Asleep

> A premium, minimal, single-page scrollytelling website for **NOCTIS**, a fictional luxury electric vehicle brand. Mood: a city in total blackout at night where the car's light is the only light in the world. Quiet, expensive, and precise.

---

## Features

- **Pinned Scrollytelling Canvas**: Scroll-scrubbed image sequences drawn on `<canvas>` scaling with device pixel ratio. Cover-fit on landscape, contain-fit on portrait centered on `--asphalt` (`#07080A`).
- **Zero Libraries**: Pure HTML5, CSS3, and vanilla JavaScript only. No frameworks, no build tools, no npm packages.
- **Hero Sequence (598 frames)**: Smooth scrubbing through blackout city with real-time telemetry HUD (speed `000` → `118 KM/H`, distance `0.0` → `4.2 KM`, phase counters).
- **Architecture Dismantle (200 frames)**: Explodes car into structural components with hairline callouts (`BODY`, `BATTERY`, `DRIVE`, `LIGHT`).
- **Interactive Lineup**: 5 models (GT-E, S, X, R, ONE) in an interactive vertical accordion with 6% entrance slide, 80ms debounced hover, specifications, and solid square color swatches.
- **Headlight Cursor ("The Headlight")**: 6px solid xenon dot inside a 28px ring following the cursor with lerp `0.18`, morphing into a 44×2px light bar signature over interactive elements.
- **Statement Word-by-Word Scroll Reveal**: Engineering philosophy sentence illuminating word by word with scroll progress.
- **Real-Time Film Grain Overlay**: Small noise tile shifted 8×/sec at 3.5% opacity.
- **Accessible & Responsive**: Full keyboard navigation, `prefers-reduced-motion` fallbacks, and mobile adaptive layout.

---

## Project Structure

```text
├── index.html            # Main markup
├── styles.css            # Design tokens & strict minimal stylesheet
├── main.js               # Vanilla scrollytelling engine & animation loops
├── config.js             # Centralized tuning config (heights, paths, callouts)
├── assets/
│   ├── cars/             # 5 studio lineup car images (1600px 16:9 WebP)
│   │   ├── gt-e.webp
│   │   ├── s.webp
│   │   ├── x.webp
│   │   ├── r.webp
│   │   └── one.webp
│   └── frames/           # Scroll-scrubbed WebP sequences
│       ├── hero/         # Desktop 1600px hero frames (598 frames)
│       ├── hero-mobile/  # Mobile 960px hero frames (598 frames)
│       ├── dismantle/    # Desktop 1600px dismantle frames (200 frames)
│       └── dismantle-mobile/ # Mobile 960px dismantle frames (200 frames)
└── README.md
```

---

## Running Locally

To run the site locally, launch any standard HTTP static file server:

```bash
# Python 3
python -m http.server 8000
```

Then visit `http://localhost:8000` in your web browser.
