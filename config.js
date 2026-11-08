/**
 * NOCTIS — Scrollytelling Configuration
 * All section heights, chapter ranges, frame counts, frame paths,
 * and callout positions are centralized here for easy tuning.
 */

const CONFIG = {
  // Brand & General
  brandName: 'NOCTIS',
  mobileBreakpoint: 768,

  // Frames Configuration
  hero: {
    frameCount: 598,
    desktopPath: 'assets/frames/hero/frame_',
    mobilePath: 'assets/frames/hero-mobile/frame_',
    extension: '.webp',
    padLength: 4,
    wrapperHeight: '600vh',
    lerpFactor: 0.15,
    blackoutStart: 0.95, // Progress at which canvas begins fading to solid black
    initialPreloadCount: 40, // Load first 40 frames before revealing site
    hud: {
      maxSpeed: 118, // KM/H at 100% scroll
      maxDistance: 4.2 // KM at 100% scroll
    },
    // Chapter ranges [startProgress, endProgress]
    chapters: [
      {
        id: 'hero-ch-0',
        range: [0.00, 0.14],
        chapterNum: '01/04'
      },
      {
        id: 'hero-ch-1',
        range: [0.22, 0.40],
        chapterNum: '02/04'
      },
      {
        id: 'hero-ch-2',
        range: [0.50, 0.68],
        chapterNum: '03/04'
      },
      {
        id: 'hero-ch-3',
        range: [0.80, 1.00],
        chapterNum: '04/04'
      }
    ]
  },

  // Dismantle Section Configuration
  dismantle: {
    frameCount: 200,
    desktopPath: 'assets/frames/dismantle/frame_',
    mobilePath: 'assets/frames/dismantle-mobile/frame_',
    extension: '.webp',
    padLength: 4,
    wrapperHeight: '350vh',
    lerpFactor: 0.15,
    calloutStartProgress: 0.70, // Progress after which callouts begin appearing
    callouts: [
      {
        id: 'callout-body',
        code: 'BODY',
        title: 'Carbon composite monocoque',
        triggerProgress: 0.72,
        // Dot coordinate on canvas (% of stage width/height in landscape)
        dotX: 47,
        dotY: 26,
        // Line vector to label placement (offset in px)
        lineDx: 60,
        lineDy: -60,
        labelSide: 'right'
      },
      {
        id: 'callout-battery',
        code: 'BATTERY',
        title: '110 kWh structural pack',
        triggerProgress: 0.79,
        dotX: 44,
        dotY: 68,
        lineDx: -70,
        lineDy: 50,
        labelSide: 'left'
      },
      {
        id: 'callout-drive',
        code: 'DRIVE',
        title: 'Dual axial-flux motors, 680 kW',
        triggerProgress: 0.86,
        dotX: 63,
        dotY: 62,
        lineDx: 80,
        lineDy: 40,
        labelSide: 'right'
      },
      {
        id: 'callout-light',
        code: 'LIGHT',
        title: 'Single-line LED signature',
        triggerProgress: 0.92,
        dotX: 77,
        dotY: 53,
        lineDx: 70,
        lineDy: -50,
        labelSide: 'right'
      }
    ]
  },

  // Statement Section
  statement: {
    text: "Every part was designed to disappear into one line of light."
  },

  // Lineup Section
  lineup: {
    hoverDebounceMs: 80,
    defaultOpenIndex: 0,
    cars: [
      {
        id: 'gt-e',
        number: '01',
        name: 'GT-E',
        tagline: 'The grand tourer.',
        summary: 'Matte graphite grand tourer coupe engineered for continent-crossing autonomy.',
        image: 'assets/cars/gt-e.webp',
        alt: 'NOCTIS GT-E matte graphite electric grand tourer coupe',
        specs: [
          { label: 'RANGE', value: '640 KM' },
          { label: '0–100 KM/H', value: '3.1 S' },
          { label: 'POWER', value: '680 KW' }
        ],
        swatches: ['#121418', '#EDEAE4', '#0F1A2C', '#C41E1E']
      },
      {
        id: 's',
        number: '02',
        name: 'S',
        tagline: 'Four doors, no compromise.',
        summary: 'Executive sports sedan balancing visceral dynamics with whisper-silent cabin isolation.',
        image: 'assets/cars/s.webp',
        alt: 'NOCTIS S satin bone white electric sport sedan',
        specs: [
          { label: 'RANGE', value: '600 KM' },
          { label: '0–100 KM/H', value: '3.6 S' },
          { label: 'POWER', value: '520 KW' }
        ],
        swatches: ['#EDEAE4', '#121418', '#20242C', '#4A505C']
      },
      {
        id: 'x',
        number: '03',
        name: 'X',
        tagline: 'Higher, never heavier.',
        summary: 'Low-drag crossover coupe with active air suspension and dual-vector all-wheel drive.',
        image: 'assets/cars/x.webp',
        alt: 'NOCTIS X midnight blue electric crossover coupe',
        specs: [
          { label: 'RANGE', value: '560 KM' },
          { label: '0–100 KM/H', value: '4.2 S' },
          { label: 'POWER', value: '480 KW' }
        ],
        swatches: ['#0B1B32', '#121418', '#EDEAE4', '#2C3539']
      },
      {
        id: 'r',
        number: '04',
        name: 'R',
        tagline: 'Built for the track.',
        summary: 'Lightweight homologation track coupe with fixed aero, carbon brakes, and 900 kW output.',
        image: 'assets/cars/r.webp',
        alt: 'NOCTIS R satin black electric track coupe with red accents',
        specs: [
          { label: 'RANGE', value: '420 KM' },
          { label: '0–100 KM/H', value: '2.4 S' },
          { label: 'POWER', value: '900 KW' }
        ],
        swatches: ['#0A0B0D', '#E1251B', '#383C45', '#EDEAE4']
      },
      {
        id: 'one',
        number: '05',
        name: 'ONE',
        tagline: 'The future, early.',
        summary: 'Speedtail concept hypercar exploring solid-state architecture and active aero camouflage.',
        image: 'assets/cars/one.webp',
        alt: 'NOCTIS ONE liquid silver electric concept hypercar',
        specs: [
          { label: 'RANGE', value: '800+ KM' },
          { label: '0–100 KM/H', value: '1.9 S' },
          { label: 'POWER', value: 'CONCEPT' }
        ],
        swatches: ['#D6DCE5', '#121418', '#8A8F98', '#CFE3FF']
      }
    ]
  },

  // Cursor Configuration
  cursor: {
    lerp: 0.18,
    flashDurationMs: 120
  }
};

if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

