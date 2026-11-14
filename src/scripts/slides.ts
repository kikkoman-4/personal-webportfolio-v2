// slides.ts - High-Performance Slide Deck Transition & Smooth Content Scroll Manager
import { gsap } from "gsap";
import { playSlideSound } from "@scripts/audio";

let isInitialized = false;
let currentIndex = 0;
let isAnimating = false;
let slides: HTMLElement[] = [];
let totalSlides = 0;

// Gesture & Momentum Control Configuration
const COOLDOWN_MS = 600; // Protection buffer against trackpad momentum bleed-through
const WHEEL_THRESHOLD = 85; // Pixels of intentional wheel delta required at boundary
const WHEEL_DECAY_MS = 220; // Silence window before boundary accumulator decays
const TOUCH_THRESHOLD = 50; // Touch swipe distance required at boundary

let lastTransitionTime = 0;
let wheelAccumulator = 0;
let currentWheelDirection: "next" | "prev" | null = null;
let wheelDecayTimer: number | null = null;

// Touch tracking
let touchStartY = 0;
let touchStartX = 0;
let isTouchActive = false;

export function initSlideDeck() {
  if (typeof window === "undefined") return;
  if (isInitialized) return;

  const stage = document.getElementById("slides-stage");
  if (!stage) return;

  slides = Array.from(stage.querySelectorAll<HTMLElement>(".slide-panel"));
  totalSlides = slides.length;
  if (totalSlides === 0) return;

  isInitialized = true;

  // Set document/body class for slide deck presentation styling
  document.documentElement.classList.add("slide-deck-mode");
  document.body.classList.add("slide-deck-mode");

  // Initial layout: slide 0 is active and visible, others positioned below
  slides.forEach((slide, i) => {
    if (i === 0) {
      gsap.set(slide, {
        yPercent: 0,
        opacity: 1,
        autoAlpha: 1,
        scale: 1,
        zIndex: 10,
        pointerEvents: "auto",
      });
      slide.classList.add("active");
    } else {
      gsap.set(slide, {
        yPercent: 100,
        opacity: 0,
        autoAlpha: 0,
        scale: 0.96,
        zIndex: 1,
        pointerEvents: "none",
      });
      slide.classList.remove("active");
    }
  });

  updateHUD(0);

  // 1. Native Wheel Listener for Precise Boundary & Content Scroll Detection
  window.addEventListener("wheel", onWheel, { passive: false });

  // 2. Touch Navigation Listeners
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });

  // 3. Keyboard Navigation (PowerPoint standard: Arrow keys, PageDown/Up, Spacebar)
  window.addEventListener("keydown", onKeyDown);

  // 4. UI Controls: Prev & Next Buttons
  const prevBtn = document.getElementById("deck-prev-btn");
  const nextBtn = document.getElementById("deck-next-btn");

  prevBtn?.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
  });

  nextBtn?.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
  });

  // 5. UI Controls: Slide Rail Pips
  document.querySelectorAll<HTMLButtonElement>(".slide-pip").forEach((pip) => {
    pip.addEventListener("click", () => {
      const idx = parseInt(pip.getAttribute("data-goto") || "0", 10);
      goToSlide(idx);
    });
  });

  // 6. Intercept internal navigation anchors (#home, #about, #projects, etc.)
  document.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement)?.closest("a") as HTMLAnchorElement | null;
    if (!link) return;

    const href = link.getAttribute("href");
    if (href && href.startsWith("#") && href.length > 1) {
      const anchor = href.slice(1);
      const targetIdx = slides.findIndex((s) => s.dataset.anchor === anchor);
      if (targetIdx !== -1) {
        e.preventDefault();
        goToSlide(targetIdx);
      }
    }
  });

  // 7. Support Deep Links / Hash Navigation
  if (window.location.hash) {
    const anchor = window.location.hash.replace("#", "");
    const targetIdx = slides.findIndex((s) => s.dataset.anchor === anchor);
    if (targetIdx !== -1 && targetIdx !== 0) {
      goToSlide(targetIdx, true);
    }
  }
}

/**
 * High-precision wheel listener separating internal content scroll from segment transitions.
 */
function onWheel(e: WheelEvent) {
  const now = Date.now();

  // If transition is animating, suppress wheel events to prevent conflicting scroll queues
  if (isAnimating) {
    e.preventDefault();
    return;
  }

  // During post-transition cooldown, ignore momentum from previous trackpad swipes
  if (now - lastTransitionTime < COOLDOWN_MS) {
    return;
  }

  // Ignore wheel events inside interactive widgets that handle their own interactions
  const target = e.target as HTMLElement | null;
  if (target?.closest("#terminal-root, #engine-root, .canvas-viewport")) {
    return;
  }

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return;

  const deltaY = e.deltaY;
  if (Math.abs(deltaY) < 1.5) return; // Suppress subpixel jitter

  const inner = currentSlide.querySelector(".slide-inner") as HTMLElement | null;
  const isScrollable = inner && inner.scrollHeight > inner.clientHeight + 10;

  // Case A: Slide has NO internal scrollable overflow (e.g. Hero on desktop)
  if (!isScrollable || !inner) {
    e.preventDefault();
    accumulateWheel(deltaY > 0 ? "next" : "prev", Math.abs(deltaY));
    return;
  }

  // Case B: Slide HAS internal scrollable overflow
  const maxScroll = inner.scrollHeight - inner.clientHeight;
  const scrollTop = inner.scrollTop;
  const atTop = scrollTop <= 3;
  const atBottom = scrollTop >= maxScroll - 4;

  if (deltaY > 0) {
    // Scrolling DOWN
    if (!atBottom) {
      // Content is scrolling down inside the slide -> let browser scroll naturally
      resetWheelAccumulator();
      return;
    } else {
      // At bottom boundary -> accumulate intentional overscroll for next slide
      e.preventDefault();
      accumulateWheel("next", deltaY);
    }
  } else if (deltaY < 0) {
    // Scrolling UP
    if (!atTop) {
      // Content is scrolling up inside the slide -> let browser scroll naturally
      resetWheelAccumulator();
      return;
    } else {
      // At top boundary -> accumulate intentional overscroll for previous slide
      e.preventDefault();
      accumulateWheel("prev", Math.abs(deltaY));
    }
  }
}

/**
 * Accumulates intentional overscroll delta at slide boundaries with decay timer.
 */
function accumulateWheel(direction: "next" | "prev", amount: number) {
  if (currentWheelDirection !== direction) {
    wheelAccumulator = 0;
    currentWheelDirection = direction;
  }

  wheelAccumulator += amount;

  if (wheelDecayTimer) {
    window.clearTimeout(wheelDecayTimer);
  }

  if (wheelAccumulator >= WHEEL_THRESHOLD) {
    resetWheelAccumulator();
    if (direction === "next" && currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    } else if (direction === "prev" && currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
    return;
  }

  // Decay accumulator if no subsequent wheel events occur within decay window
  wheelDecayTimer = window.setTimeout(() => {
    resetWheelAccumulator();
  }, WHEEL_DECAY_MS);
}

function resetWheelAccumulator() {
  wheelAccumulator = 0;
  currentWheelDirection = null;
  if (wheelDecayTimer) {
    window.clearTimeout(wheelDecayTimer);
    wheelDecayTimer = null;
  }
}

/**
 * Touch handlers with distinct boundary overscroll detection for mobile devices.
 */
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return;

  const target = e.target as HTMLElement | null;
  if (target?.closest("#terminal-root, #engine-root, .canvas-viewport")) {
    isTouchActive = false;
    return;
  }

  isTouchActive = true;
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}

function onTouchMove(e: TouchEvent) {
  if (!isTouchActive || e.touches.length !== 1) return;

  const now = Date.now();
  if (isAnimating || now - lastTransitionTime < COOLDOWN_MS) return;

  const currentY = e.touches[0].clientY;
  const currentX = e.touches[0].clientX;
  const diffY = touchStartY - currentY; // Positive = swipe UP (advance), Negative = swipe DOWN (return)
  const diffX = touchStartX - currentX;

  // Ignore predominantly horizontal gestures
  if (Math.abs(diffX) > Math.abs(diffY)) return;

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return;

  const inner = currentSlide.querySelector(".slide-inner") as HTMLElement | null;
  const isScrollable = inner && inner.scrollHeight > inner.clientHeight + 10;

  // Slide has NO overflow
  if (!isScrollable || !inner) {
    if (Math.abs(diffY) > TOUCH_THRESHOLD) {
      isTouchActive = false;
      if (diffY > 0 && currentIndex < totalSlides - 1) {
        goToSlide(currentIndex + 1);
      } else if (diffY < 0 && currentIndex > 0) {
        goToSlide(currentIndex - 1);
      }
    }
    return;
  }

  // Slide HAS overflow
  const maxScroll = inner.scrollHeight - inner.clientHeight;
  const scrollTop = inner.scrollTop;
  const atTop = scrollTop <= 3;
  const atBottom = scrollTop >= maxScroll - 4;

  if (diffY > TOUCH_THRESHOLD && atBottom) {
    // Swiped up while already at the bottom of content
    isTouchActive = false;
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  } else if (diffY < -TOUCH_THRESHOLD && atTop) {
    // Swiped down while already at the top of content
    isTouchActive = false;
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }
}

function onTouchEnd() {
  isTouchActive = false;
}

/**
 * Keyboard navigation with content scroll awareness.
 */
function onKeyDown(e: KeyboardEvent) {
  const active = document.activeElement;
  if (
    active &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      (active as HTMLElement).isContentEditable)
  ) {
    return;
  }

  const currentSlide = slides[currentIndex];
  const inner = currentSlide?.querySelector(".slide-inner") as HTMLElement | null;
  const hasOverflow = inner && inner.scrollHeight > inner.clientHeight + 10;
  const maxScroll = inner ? inner.scrollHeight - inner.clientHeight : 0;

  if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
    e.preventDefault();
    if (hasOverflow && inner) {
      const atBottom = inner.scrollTop >= maxScroll - 6;
      if (!atBottom) {
        // Smoothly scroll content inside the slide
        const scrollAmount = e.key === "ArrowDown" ? 180 : inner.clientHeight * 0.75;
        inner.scrollBy({ top: scrollAmount, behavior: "smooth" });
        return;
      }
    }
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  } else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
    e.preventDefault();
    if (hasOverflow && inner) {
      const atTop = inner.scrollTop <= 6;
      if (!atTop) {
        // Smoothly scroll content inside the slide
        const scrollAmount = e.key === "ArrowUp" ? -180 : -inner.clientHeight * 0.75;
        inner.scrollBy({ top: scrollAmount, behavior: "smooth" });
        return;
      }
    }
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  } else if (e.key === "Home") {
    e.preventDefault();
    goToSlide(0);
  } else if (e.key === "End") {
    e.preventDefault();
    goToSlide(totalSlides - 1);
  }
}

/**
 * Transitions to target slide with high-performance GSAP presentation animation.
 */
export function goToSlide(targetIndex: number, immediate = false) {
  if (targetIndex === currentIndex && !immediate) return;
  if (targetIndex < 0 || targetIndex >= totalSlides) return;
  if (isAnimating && !immediate) return;

  const prevIndex = currentIndex;
  const isNext = targetIndex > prevIndex;
  const currentSlide = slides[prevIndex];
  const nextSlide = slides[targetIndex];

  isAnimating = true;
  lastTransitionTime = Date.now();
  currentIndex = targetIndex;
  resetWheelAccumulator();

  updateHUD(targetIndex);
  playSlideSound(isNext ? 1 : -1);

  // Always reset target slide scroll position to top instantly
  const targetInner = nextSlide.querySelector(".slide-inner") as HTMLElement | null;
  if (targetInner) {
    targetInner.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  if (immediate) {
    slides.forEach((s, idx) => {
      s.classList.toggle("active", idx === targetIndex);
      if (idx === targetIndex) {
        gsap.set(s, {
          yPercent: 0,
          opacity: 1,
          autoAlpha: 1,
          scale: 1,
          zIndex: 10,
          pointerEvents: "auto",
        });
      } else {
        gsap.set(s, {
          yPercent: idx < targetIndex ? -35 : 100,
          opacity: 0,
          autoAlpha: 0,
          scale: 0.96,
          zIndex: 1,
          pointerEvents: "none",
        });
      }
    });
    isAnimating = false;
    return;
  }

  // Smooth slide transition timeline
  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => {
      currentSlide.classList.remove("active");
      nextSlide.classList.add("active");

      gsap.set(currentSlide, {
        autoAlpha: 0,
        zIndex: 1,
        pointerEvents: "none",
        yPercent: isNext ? -35 : 100,
        opacity: 0,
      });

      gsap.set(nextSlide, {
        zIndex: 10,
        pointerEvents: "auto",
        yPercent: 0,
        opacity: 1,
        scale: 1,
      });

      isAnimating = false;
      lastTransitionTime = Date.now();
    },
  });

  // Activate incoming slide
  gsap.set(nextSlide, {
    autoAlpha: 1,
    zIndex: 20,
    pointerEvents: "auto",
  });

  // 1. Current Slide Moves Out: smooth slide with subtle depth scale
  tl.to(
    currentSlide,
    {
      yPercent: isNext ? -35 : 100,
      opacity: 0,
      scale: isNext ? 0.95 : 0.98,
      duration: 0.65,
      ease: "power2.inOut",
    },
    0
  );

  // 2. Next Slide Moves In: rises/drops into place smoothly
  tl.fromTo(
    nextSlide,
    {
      yPercent: isNext ? 100 : -35,
      opacity: 0,
      scale: isNext ? 0.98 : 0.95,
    },
    {
      yPercent: 0,
      opacity: 1,
      scale: 1,
      duration: 0.65,
      ease: "power2.out",
    },
    0
  );

  // 3. Staggered Content Reveal
  const revealTargets = nextSlide.querySelectorAll(
    ".hero-badge, .hero-headline, .hero-bio, .hero-actions, .section-header, .bento-card, .project-card, .timeline-item, .category-card, .certs-strip, .contact-box"
  );
  if (revealTargets.length > 0) {
    tl.fromTo(
      revealTargets,
      {
        y: isNext ? 22 : -22,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.035,
        ease: "power2.out",
        clearProps: "transform,opacity",
      },
      0.15
    );
  }
}

/**
 * Updates all telemetry HUD indicators, navigation states, and dock counters.
 */
function updateHUD(targetIndex: number) {
  // 1. Counter numbers
  const currentNumEl = document.getElementById("deck-current-num");
  if (currentNumEl) {
    currentNumEl.textContent = String(targetIndex + 1).padStart(2, "0");
  }

  const totalNumEl = document.getElementById("deck-total-num");
  if (totalNumEl) {
    totalNumEl.textContent = String(totalSlides).padStart(2, "0");
  }

  // 2. Slide Title
  const titleEl = document.getElementById("deck-slide-title");
  if (titleEl && slides[targetIndex]) {
    titleEl.textContent = slides[targetIndex].dataset.title || `SLIDE ${targetIndex + 1}`;
  }

  // 3. Dock Progress Fill
  const progressFill = document.getElementById("deck-progress-fill");
  if (progressFill) {
    const pct = ((targetIndex + 1) / totalSlides) * 100;
    progressFill.style.width = `${pct}%`;
  }

  // 4. Rail Track Progress Line
  const railProgress = document.getElementById("rail-progress-line");
  if (railProgress && totalSlides > 1) {
    const railPct = (targetIndex / (totalSlides - 1)) * 100;
    railProgress.style.height = `${railPct}%`;
  }

  // 5. Rail Pips
  document.querySelectorAll<HTMLButtonElement>(".slide-pip").forEach((pip) => {
    const pipIdx = parseInt(pip.getAttribute("data-goto") || "0", 10);
    pip.classList.toggle("active", pipIdx === targetIndex);
  });

  // 6. Prev/Next Buttons disabled status
  const prevBtn = document.getElementById("deck-prev-btn") as HTMLButtonElement | null;
  const nextBtn = document.getElementById("deck-next-btn") as HTMLButtonElement | null;
  if (prevBtn) prevBtn.disabled = targetIndex === 0;
  if (nextBtn) nextBtn.disabled = targetIndex === totalSlides - 1;

  // 7. Perimeter HudFrame percentage readout sync
  const hudPct = document.querySelector(".pct-readout");
  if (hudPct) {
    const rounded = Math.round(((targetIndex + 1) / totalSlides) * 100);
    hudPct.textContent = `${String(rounded).padStart(2, "0")}%`;
  }

  // 8. Navbar Active Item Synchronization
  const anchor = slides[targetIndex]?.dataset.anchor;
  if (anchor) {
    document.querySelectorAll<HTMLAnchorElement>(".nav-links .nav-item").forEach((item) => {
      const href = item.getAttribute("href")?.replace("#", "");
      item.classList.toggle("active", href === anchor);
    });

    if (history.replaceState) {
      history.replaceState(null, "", `#${anchor}`);
    }
  }

  // 9. Fade out instruction cue once user starts navigating
  if (targetIndex > 0) {
    const cue = document.getElementById("deck-cue-pill");
    cue?.classList.add("hidden");
  }
}
