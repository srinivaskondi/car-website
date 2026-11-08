/**
 * NOCTIS — Luxury Electric Scrollytelling
 * Vanilla JavaScript Engine
 */

(function () {
  'use strict';

  // State Management
  const state = {
    isMobile: window.innerWidth < (window.CONFIG?.mobileBreakpoint || 768),
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    pointerFine: window.matchMedia('(pointer: fine)').matches,
    
    // Frames storage
    heroImages: [],
    dismantleImages: [],
    heroLoadedIndices: new Set(),
    dismantleLoadedIndices: new Set(),

    // Scrollytelling Lerp
    hero: {
      targetProgress: 0,
      currentProgress: 0,
      targetFrame: 0,
      currentFrame: 0,
      lastDrawnFrame: -1
    },
    dismantle: {
      targetProgress: 0,
      currentProgress: 0,
      targetFrame: 0,
      currentFrame: 0,
      lastDrawnFrame: -1
    },

    // Cursor
    cursor: {
      mouseX: window.innerWidth / 2,
      mouseY: window.innerHeight / 2,
      currentX: window.innerWidth / 2,
      currentY: window.innerHeight / 2,
      isMorphed: false,
      label: 'VIEW',
      isPressed: false
    },

    // Lineup
    lineup: {
      activeIndex: window.CONFIG?.lineup?.defaultOpenIndex || 0,
      hoverTimer: null
    },

    // Scroll
    lastScrollY: window.scrollY
  };

  /* ==========================================================================
     1. PRELOADER & FRAME LOADING
     ========================================================================== */
  function getFrameUrl(type, index) {
    const isMobile = state.isMobile;
    const pad = (n, len) => String(n).padStart(len, '0');
    if (type === 'hero') {
      const basePath = isMobile ? CONFIG.hero.mobilePath : CONFIG.hero.desktopPath;
      return `${basePath}${pad(index, CONFIG.hero.padLength)}${CONFIG.hero.extension}`;
    } else {
      const basePath = isMobile ? CONFIG.dismantle.mobilePath : CONFIG.dismantle.desktopPath;
      return `${basePath}${pad(index, CONFIG.dismantle.padLength)}${CONFIG.dismantle.extension}`;
    }
  }

  function initPreloader() {
    const preloader = document.getElementById('preloader');
    const fill = document.getElementById('preloader-fill');
    const counter = document.getElementById('preloader-counter');
    const initialCount = CONFIG.hero.initialPreloadCount;
    let loadedCount = 0;

    function updateProgress(pct) {
      const clamped = Math.min(100, Math.max(0, Math.round(pct)));
      if (fill) fill.style.width = `${clamped}%`;
      if (counter) counter.textContent = String(clamped).padStart(3, '0');
    }

    // Preload hero frames 1 to 40
    for (let i = 1; i <= initialCount; i++) {
      const img = new Image();
      img.src = getFrameUrl('hero', i);
      state.heroImages[i] = img;

      const onLoad = () => {
        state.heroLoadedIndices.add(i);
        loadedCount++;
        const pct = (loadedCount / initialCount) * 100;
        updateProgress(pct);

        if (loadedCount === initialCount) {
          // Flash preloader line brighter for 120ms, then reveal site
          preloader.classList.add('is-flashing');
          setTimeout(() => {
            preloader.classList.add('is-hidden');
            // Trigger first canvas draw
            drawHeroFrame(1);
            drawDismantleFrame(1);
            // Continue background loading remaining frames
            loadRemainingFrames();
          }, 140);
        }
      };

      if (img.complete) {
        onLoad();
      } else {
        img.onload = () => {
          if ('decode' in img) {
            img.decode().then(onLoad).catch(onLoad);
          } else {
            onLoad();
          }
        };
        img.onerror = onLoad;
      }
    }
  }

  function loadRemainingFrames() {
    // 1. Rest of hero frames (41..598)
    const heroCount = CONFIG.hero.frameCount;
    let heroQueue = [];
    for (let i = CONFIG.hero.initialPreloadCount + 1; i <= heroCount; i++) {
      heroQueue.push(i);
    }

    // 2. Dismantle frames (1..200)
    const dismantleCount = CONFIG.dismantle.frameCount;
    let dismantleQueue = [];
    for (let i = 1; i <= dismantleCount; i++) {
      dismantleQueue.push(i);
    }

    function loadNextInQueue() {
      if (heroQueue.length > 0) {
        const i = heroQueue.shift();
        const img = new Image();
        img.src = getFrameUrl('hero', i);
        state.heroImages[i] = img;
        img.onload = () => {
          state.heroLoadedIndices.add(i);
          loadNextInQueue();
        };
        img.onerror = () => loadNextInQueue();
      } else if (dismantleQueue.length > 0) {
        const i = dismantleQueue.shift();
        const img = new Image();
        img.src = getFrameUrl('dismantle', i);
        state.dismantleImages[i] = img;
        img.onload = () => {
          state.dismantleLoadedIndices.add(i);
          loadNextInQueue();
        };
        img.onerror = () => loadNextInQueue();
      }
    }

    // Run 4 concurrent background loading workers
    for (let w = 0; w < 4; w++) {
      loadNextInQueue();
    }
  }

  function findNearestLoadedFrame(type, target) {
    const loadedSet = type === 'hero' ? state.heroLoadedIndices : state.dismantleLoadedIndices;
    const maxCount = type === 'hero' ? CONFIG.hero.frameCount : CONFIG.dismantle.frameCount;

    if (loadedSet.has(target)) return target;

    // Search outward +/- 1, 2, 3...
    for (let offset = 1; offset < maxCount; offset++) {
      const lower = target - offset;
      if (lower >= 1 && loadedSet.has(lower)) return lower;
      const upper = target + offset;
      if (upper <= maxCount && loadedSet.has(upper)) return upper;
    }
    return 1;
  }

  /* ==========================================================================
     2. CANVAS DRAWING (Cover-fit on landscape, Contain-fit on portrait)
     ========================================================================== */
  function drawImageToCanvas(ctx, canvas, img) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const stageW = canvas.parentElement.clientWidth;
    const stageH = canvas.parentElement.clientHeight;

    const targetW = Math.round(stageW * dpr);
    const targetH = Math.round(stageH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const cW = canvas.width;
    const cH = canvas.height;
    const imgRatio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
    const canvasRatio = cW / cH;

    // Landscape screens (stageW >= stageH): cover-fit
    // Portrait screens (stageW < stageH): contain-fit, vertically centred on #07080A
    if (stageW >= stageH) {
      let dw, dh, dx, dy;
      if (canvasRatio > imgRatio) {
        dw = cW;
        dh = cW / imgRatio;
        dx = 0;
        dy = (cH - dh) / 2;
      } else {
        dh = cH;
        dw = cH * imgRatio;
        dx = (cW - dw) / 2;
        dy = 0;
      }
      ctx.clearRect(0, 0, cW, cH);
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      let dw, dh, dx, dy;
      if (canvasRatio > imgRatio) {
        dh = cH;
        dw = cH * imgRatio;
        dx = (cW - dw) / 2;
        dy = 0;
      } else {
        dw = cW;
        dh = cW / imgRatio;
        dx = 0;
        dy = (cH - dh) / 2;
      }
      ctx.fillStyle = '#07080A';
      ctx.fillRect(0, 0, cW, cH);
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  }

  function drawHeroFrame(frameIndex) {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const validFrame = findNearestLoadedFrame('hero', frameIndex);
    const img = state.heroImages[validFrame];

    if (img && (img.complete || img.naturalWidth)) {
      drawImageToCanvas(ctx, canvas, img);

      // Over the last 5% of scroll (progress >= 0.95), canvas fades to solid black
      if (state.hero.currentProgress >= CONFIG.hero.blackoutStart) {
        const blackoutAlpha = Math.min(1, (state.hero.currentProgress - CONFIG.hero.blackoutStart) / (1 - CONFIG.hero.blackoutStart));
        ctx.fillStyle = `rgba(7, 8, 10, ${blackoutAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      state.hero.lastDrawnFrame = frameIndex;
    }
  }

  function drawDismantleFrame(frameIndex) {
    const canvas = document.getElementById('dismantle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const validFrame = findNearestLoadedFrame('dismantle', frameIndex);
    const img = state.dismantleImages[validFrame];

    if (img && (img.complete || img.naturalWidth)) {
      drawImageToCanvas(ctx, canvas, img);
      state.dismantle.lastDrawnFrame = frameIndex;
    }
  }

  /* ==========================================================================
     3. HERO CHAPTERS, HUD, AND DISMANTLE CALLOUTS
     ========================================================================== */
  function updateHeroOverlays(progress) {
    // 1. Progress line
    const progressLine = document.getElementById('hero-progress-line');
    if (progressLine) {
      progressLine.style.transform = `scaleX(${progress})`;
    }

    // 2. HUD Telemetry
    const speedEl = document.getElementById('hud-speed');
    const distEl = document.getElementById('hud-distance');
    const chEl = document.getElementById('hud-chapter');

    const speed = Math.round(progress * CONFIG.hero.hud.maxSpeed);
    const dist = (progress * CONFIG.hero.hud.maxDistance).toFixed(1);

    if (speedEl) speedEl.textContent = String(speed).padStart(3, '0');
    if (distEl) distEl.textContent = dist;

    // Chapters
    let activeChapterNum = '01/04';
    CONFIG.hero.chapters.forEach((ch, idx) => {
      const el = document.getElementById(ch.id);
      const inRange = progress >= ch.range[0] && progress <= ch.range[1];
      if (el) {
        if (inRange) {
          el.classList.add('is-active');
          activeChapterNum = ch.chapterNum;
        } else {
          el.classList.remove('is-active');
        }
      }
    });

    if (chEl) chEl.textContent = activeChapterNum;
  }

  function updateDismantleOverlays(progress) {
    // 1. Progress line
    const progressLine = document.getElementById('dismantle-progress-line');
    if (progressLine) {
      progressLine.style.transform = `scaleX(${progress})`;
    }

    // 2. Callouts fade in after 70% progress
    CONFIG.dismantle.callouts.forEach(callout => {
      const el = document.getElementById(callout.id);
      if (el) {
        if (progress >= callout.triggerProgress) {
          el.classList.add('is-visible');
        } else {
          el.classList.remove('is-visible');
        }
      }
    });
  }

  function initDismantleCallouts() {
    const container = document.getElementById('dismantle-callouts');
    if (!container) return;

    container.innerHTML = '';
    CONFIG.dismantle.callouts.forEach(c => {
      const div = document.createElement('div');
      div.id = c.id;
      div.className = 'callout-item font-hud';
      div.style.left = `${c.dotX}%`;
      div.style.top = `${c.dotY}%`;

      // SVG connector line from dot (0, 0) to label offset
      const lineLen = Math.hypot(c.lineDx, c.lineDy);
      const angleRad = Math.atan2(c.lineDy, c.lineDx);
      const angleDeg = angleRad * (180 / Math.PI);

      const labelLeft = c.lineDx;
      const labelTop = c.lineDy;

      div.innerHTML = `
        <div class="callout-dot"></div>
        <div class="callout-line" style="width: ${lineLen}px; transform: rotate(${angleDeg}deg);"></div>
        <div class="callout-card" style="left: ${labelLeft}px; top: ${labelTop}px; transform: ${c.labelSide === 'left' ? 'translateX(-100%)' : 'translateX(0)'};">
          <span class="callout-code font-hud">${c.code}</span>
          <span class="callout-desc font-body">${c.title}</span>
        </div>
      `;
      container.appendChild(div);
    });
  }

  /* ==========================================================================
     4. STATEMENT WORD-BY-WORD SCROLL REVEAL
     ========================================================================== */
  function initStatementSection() {
    const headline = document.getElementById('statement-headline');
    if (!headline) return;

    const words = CONFIG.statement.text.split(' ');
    headline.innerHTML = words.map(w => `<span class="stmt-word">${w}</span>`).join(' ');
  }

  function updateStatementSection() {
    const section = document.getElementById('statement-section');
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    // Activate between rect.top = vh * 0.85 and rect.top = vh * 0.15
    const start = vh * 0.85;
    const end = vh * 0.15;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));

    const words = section.querySelectorAll('.stmt-word');
    const totalWords = words.length;

    words.forEach((word, idx) => {
      const wordThreshold = idx / totalWords;
      if (progress >= wordThreshold) {
        const wordLocal = Math.min(1, (progress - wordThreshold) * totalWords);
        // Word opacity from 0.15 to 1.0
        word.style.opacity = 0.15 + 0.85 * wordLocal;
      } else {
        word.style.opacity = 0.15;
      }
    });
  }

  /* ==========================================================================
     5. SECTION 4 — LINEUP ACCORDION
     ========================================================================== */
  function initLineup() {
    const container = document.getElementById('lineup-accordion');
    if (!container) return;

    container.innerHTML = '';
    const cars = CONFIG.lineup.cars;

    cars.forEach((car, index) => {
      const slide = document.createElement('div');
      slide.className = `lineup-slide ${index === state.lineup.activeIndex ? 'is-open' : ''}`;
      slide.setAttribute('role', 'button');
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('aria-expanded', index === state.lineup.activeIndex ? 'true' : 'false');
      slide.setAttribute('data-index', index);
      slide.setAttribute('data-cursor', index === state.lineup.activeIndex ? 'CONFIGURE' : 'OPEN');

      const swatchesHtml = car.swatches.map((sw, i) => `
        <span class="swatch ${i === 0 ? 'is-active' : ''}" style="background-color: ${sw};" data-color="${sw}" title="Finish ${i + 1}"></span>
      `).join('');

      const specsHtml = car.specs.map(sp => `
        <div class="spec-cell">
          <span class="spec-cell-label font-hud">${sp.label}</span>
          <span class="spec-cell-val font-hud">${sp.value}</span>
        </div>
      `).join('');

      slide.innerHTML = `
        <!-- Cropped Tight Image for Closed State -->
        <img src="${car.image}" alt="${car.alt}" class="slide-bg-img" loading="lazy">

        <!-- Closed View Content -->
        <div class="slide-closed-view">
          <span class="slide-closed-num font-hud">${car.number}</span>
          <span class="slide-closed-name font-hud">${car.name}</span>
        </div>

        <!-- Open View Content -->
        <div class="slide-open-view">
          <div class="slide-open-header">
            <span class="slide-open-num font-hud">${car.number}</span>
            <h3 class="slide-open-title font-display">${car.name}</h3>
          </div>

          <div class="slide-open-car-container">
            <img src="${car.image}" alt="${car.alt}" class="slide-open-car-img" loading="lazy">
          </div>

          <div class="slide-open-footer">
            <p class="slide-tagline">${car.tagline}</p>
            <p class="slide-summary">${car.summary}</p>
            <div class="slide-specs-grid">
              ${specsHtml}
            </div>
            <div class="slide-controls-row">
              <div class="swatches-row" aria-label="Available Finishes">
                ${swatchesHtml}
              </div>
              <a href="#reserve" class="slide-configure-btn" data-cursor="CONFIGURE">
                <span>CONFIGURE</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      `;

      // Hover opening with 80ms debounce (desktop)
      slide.addEventListener('mouseenter', () => {
        if (state.isMobile) return;
        clearTimeout(state.lineup.hoverTimer);
        state.lineup.hoverTimer = setTimeout(() => {
          setOpenSlide(index);
        }, CONFIG.lineup.hoverDebounceMs);
      });

      // Tap / Click (desktop and mobile)
      slide.addEventListener('click', (e) => {
        if (e.target.closest('.swatch')) {
          handleSwatchClick(e.target.closest('.swatch'), slide);
          return;
        }
        setOpenSlide(index);
      });

      // Keyboard navigation
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpenSlide(index);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (index + 1) % cars.length;
          setOpenSlide(next);
          focusSlide(next);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (index - 1 + cars.length) % cars.length;
          setOpenSlide(prev);
          focusSlide(prev);
        }
      });

      container.appendChild(slide);
    });
  }

  function handleSwatchClick(swatchEl, slide) {
    const swatches = slide.querySelectorAll('.swatch');
    swatches.forEach(s => s.classList.remove('is-active'));
    swatchEl.classList.add('is-active');
  }

  function setOpenSlide(index) {
    state.lineup.activeIndex = index;
    const slides = document.querySelectorAll('.lineup-slide');
    slides.forEach((slide, idx) => {
      const isOpen = idx === index;
      slide.classList.toggle('is-open', isOpen);
      slide.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      slide.setAttribute('data-cursor', isOpen ? 'CONFIGURE' : 'OPEN');
    });

    // Update cursor label if mouse is over open slide
    updateCursorLabel(slides[index]);
  }

  function focusSlide(index) {
    const slides = document.querySelectorAll('.lineup-slide');
    if (slides[index]) slides[index].focus();
  }

  /* ==========================================================================
     6. CUSTOM CURSOR ("THE HEADLIGHT")
     ========================================================================== */
  function initCustomCursor() {
    if (!state.pointerFine || state.prefersReducedMotion) return;

    const cursorEl = document.getElementById('custom-cursor');
    const labelEl = document.getElementById('cursor-label');
    if (!cursorEl) return;

    window.addEventListener('mousemove', (e) => {
      state.cursor.mouseX = e.clientX;
      state.cursor.mouseY = e.clientY;
    });

    window.addEventListener('mousedown', () => {
      cursorEl.classList.add('is-pressed');
      setTimeout(() => {
        cursorEl.classList.remove('is-pressed');
      }, CONFIG.cursor.flashDurationMs);
    });

    // Delegate hover listeners for morphing
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide, .swatch');
      if (target) {
        cursorEl.classList.add('is-morphed');
        let label = target.getAttribute('data-cursor');
        if (!label) {
          if (target.classList.contains('reserve-btn')) label = 'RESERVE';
          else if (target.tagName.toLowerCase() === 'a') label = 'VIEW';
          else if (target.classList.contains('swatch')) label = 'FINISH';
          else label = 'SELECT';
        }
        if (labelEl) labelEl.textContent = label;
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide, .swatch');
      if (target) {
        cursorEl.classList.remove('is-morphed');
      }
    });
  }

  function updateCursorLabel(element) {
    const labelEl = document.getElementById('cursor-label');
    if (labelEl && element) {
      const label = element.getAttribute('data-cursor');
      if (label) labelEl.textContent = label;
    }
  }

  /* ==========================================================================
     7. FILM GRAIN OVERLAY CANVAS
     ========================================================================== */
  function initFilmGrain() {
    const canvas = document.getElementById('grain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Create a 160x160 noise tile offscreen once
    const tile = document.createElement('canvas');
    tile.width = 160;
    tile.height = 160;
    const tCtx = tile.getContext('2d');
    const imgData = tCtx.createImageData(160, 160);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = 255;
    }
    tCtx.putImageData(imgData, 0, 0);

    const pattern = ctx.createPattern(tile, 'repeat');

    // Shift tile randomly ~8 times per second (every 125ms)
    let lastShift = 0;
    function renderGrain(now) {
      if (now - lastShift > 125) {
        lastShift = now;
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ox = (Math.random() * 160) | 0;
        const oy = (Math.random() * 160) | 0;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = pattern;
        ctx.fillRect(-160, -160, w + 320, h + 320);
        ctx.restore();
      }
      requestAnimationFrame(renderGrain);
    }
    requestAnimationFrame(renderGrain);
  }

  /* ==========================================================================
     8. NAVIGATION SCROLL HIDE/SHOW
     ========================================================================== */
  function updateNav() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    const currentY = window.scrollY;

    if (currentY > state.lastScrollY && currentY > 120) {
      nav.classList.add('is-hidden');
    } else {
      nav.classList.remove('is-hidden');
    }
    state.lastScrollY = currentY;
  }

  /* ==========================================================================
     9. UNIFIED MAIN ANIMATION & SCROLL LOOP
     ========================================================================== */
  function computeProgress() {
    // 1. Hero Progress
    const heroWrapper = document.getElementById('hero-wrapper');
    if (heroWrapper) {
      const rect = heroWrapper.getBoundingClientRect();
      const dist = heroWrapper.offsetHeight - window.innerHeight;
      state.hero.targetProgress = dist > 0 ? Math.min(1, Math.max(0, -rect.top / dist)) : 0;
    }

    // 2. Dismantle Progress
    const dismantleWrapper = document.getElementById('dismantle-wrapper');
    if (dismantleWrapper) {
      const rect = dismantleWrapper.getBoundingClientRect();
      const dist = dismantleWrapper.offsetHeight - window.innerHeight;
      state.dismantle.targetProgress = dist > 0 ? Math.min(1, Math.max(0, -rect.top / dist)) : 0;
    }
  }

  function tick() {
    // 1. Lerp Hero Frame
    const heroTargetFrame = Math.round(state.hero.targetProgress * (CONFIG.hero.frameCount - 1)) + 1;
    state.hero.currentProgress += (state.hero.targetProgress - state.hero.currentProgress) * CONFIG.hero.lerpFactor;
    state.hero.currentFrame += (heroTargetFrame - state.hero.currentFrame) * CONFIG.hero.lerpFactor;

    const roundedHeroFrame = Math.round(state.hero.currentFrame);
    if (roundedHeroFrame !== state.hero.lastDrawnFrame) {
      drawHeroFrame(roundedHeroFrame);
    }
    updateHeroOverlays(state.hero.currentProgress);

    // 2. Lerp Dismantle Frame
    const dismantleTargetFrame = Math.round(state.dismantle.targetProgress * (CONFIG.dismantle.frameCount - 1)) + 1;
    state.dismantle.currentProgress += (state.dismantle.targetProgress - state.dismantle.currentProgress) * CONFIG.dismantle.lerpFactor;
    state.dismantle.currentFrame += (dismantleTargetFrame - state.dismantle.currentFrame) * CONFIG.dismantle.lerpFactor;

    const roundedDismantleFrame = Math.round(state.dismantle.currentFrame);
    if (roundedDismantleFrame !== state.dismantle.lastDrawnFrame) {
      drawDismantleFrame(roundedDismantleFrame);
    }
    updateDismantleOverlays(state.dismantle.currentProgress);

    // 3. Statement Section Reveal
    updateStatementSection();

    // 4. Cursor Lerp (Desktop only)
    if (state.pointerFine && !state.prefersReducedMotion) {
      const cursorEl = document.getElementById('custom-cursor');
      if (cursorEl) {
        state.cursor.currentX += (state.cursor.mouseX - state.cursor.currentX) * CONFIG.cursor.lerp;
        state.cursor.currentY += (state.cursor.mouseY - state.cursor.currentY) * CONFIG.cursor.lerp;
        cursorEl.style.transform = `translate3d(${state.cursor.currentX}px, ${state.cursor.currentY}px, 0)`;
      }
    }

    requestAnimationFrame(tick);
  }

  /* ==========================================================================
     10. INITIALIZATION
     ========================================================================== */
  function onResize() {
    state.isMobile = window.innerWidth < (window.CONFIG?.mobileBreakpoint || 768);
    // Redraw current frames on resize
    drawHeroFrame(Math.round(state.hero.currentFrame) || 1);
    drawDismantleFrame(Math.round(state.dismantle.currentFrame) || 1);
  }

  function init() {
    window.addEventListener('scroll', () => {
      computeProgress();
      updateNav();
    }, { passive: true });

    window.addEventListener('resize', onResize);

    initPreloader();
    initFilmGrain();
    initCustomCursor();
    initStatementSection();
    initDismantleCallouts();
    initLineup();

    computeProgress();
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

