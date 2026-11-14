// slides.ts - Ultra-Snappy Zero-Delay Solid Slide Deck Transition & Viewport Manager
import { gsap } from "gsap";
import { playSlideSound } from "@scripts/audio";

let isInitialized = false;
let currentIndex = 0;
let isAnimating = false;
let slides: HTMLElement[] = [];
let totalSlides = 0;

// Balanced Responsive Configuration: Silky Smooth Glide
const TRANSITION_DURATION = 0.42; // Smooth 420ms glide: eased, luxurious, not rushed
const TRANSITION_EASE = "power2.out"; // Immediate response on frame 0 with gentle, graceful deceleration
const MIN_WHEEL_DELTA = 1; // Instant trigger on intentional scroll
const SWIPE_THRESHOLD = 25; // Balanced 25px swipe on touchscreens
const MOMENTUM_WINDOW_MS = 120; // Protection window against decaying trackpad tails

let transitionEndTime = 0;

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

  // Initial layout: solid opaque slides, inactive slides hidden & inert
  slides.forEach((slide, i) => {
    if (i === 0) {
      gsap.set(slide, {
        yPercent: 0,
        opacity: 1,
        zIndex: 10,
        pointerEvents: "auto",
      });
      slide.classList.add("active");
      slide.removeAttribute("inert");
      slide.removeAttribute("aria-hidden");
      slide.style.visibility = "visible";
    } else {
      gsap.set(slide, {
        yPercent: 100,
        opacity: 1,
        zIndex: 1,
        pointerEvents: "none",
      });
      slide.classList.remove("active");
      slide.setAttribute("inert", "");
      slide.setAttribute("aria-hidden", "true");
      slide.style.visibility = "hidden";
    }
  });

  updateHUD(0);

  // 1. Native Wheel Listener for Instant Slide Transitions
  window.addEventListener("wheel", onWheel, { passive: false });

  // 2. Touch Navigation Listeners for Single-Swipe Transitions
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
 * Wheel listener: Instantaneous zero-delay slide transitions.
 */
function onWheel(e: WheelEvent) {
  const target = e.target as HTMLElement | null;

  // If cursor is directly inside the terminal screen and it has active scroll overflow,
  // allow terminal internal scrolling until boundaries are reached.
  const termScreen = target?.closest("#terminal-screen") as HTMLElement | null;
  if (termScreen && termScreen.scrollHeight > termScreen.clientHeight + 10) {
    const atBottom = termScreen.scrollTop >= termScreen.scrollHeight - termScreen.clientHeight - 4;
    const atTop = termScreen.scrollTop <= 4;
    if (e.deltaY > 0 && !atBottom) return;
    if (e.deltaY < 0 && !atTop) return;
  }

  const deltaY = e.deltaY;
  if (Math.abs(deltaY) < MIN_WHEEL_DELTA) return;

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return;

  // Fallback for ultra-short landscape viewports (< 560px) where inner scrolling is active
  const inner = currentSlide.querySelector(".slide-inner") as HTMLElement | null;
  const isScrollable =
    inner &&
    window.innerHeight <= 560 &&
    inner.scrollHeight > inner.clientHeight + 20;

  if (isScrollable && inner) {
    const maxScroll = inner.scrollHeight - inner.clientHeight;
    const scrollTop = inner.scrollTop;
    const atTop = scrollTop <= 4;
    const atBottom = scrollTop >= maxScroll - 6;

    if (deltaY > 0 && !atBottom) return;
    if (deltaY < 0 && !atTop) return;
  }

  e.preventDefault();

  // If transition is currently animating, suppress new wheel triggers
  if (isAnimating) {
    return;
  }

  const now = Date.now();
  const timeSinceTransition = now - transitionEndTime;

  // Filter lingering trackpad momentum tail (low deltas within 100ms of finish)
  // while allowing deliberate mouse wheel clicks (|deltaY| >= 25 or deltaMode !== 0) instantly
  if (timeSinceTransition < MOMENTUM_WINDOW_MS) {
    if (e.deltaMode === 0 && Math.abs(deltaY) < 25) {
      return;
    }
  }

  const direction = deltaY > 0 ? "next" : "prev";
  const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  if (targetIndex < 0 || targetIndex >= totalSlides) return;

  goToSlide(targetIndex);
}

/**
 * Touch handlers: Instantaneous swipe response on mobile devices.
 */
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return;

  const target = e.target as HTMLElement | null;
  const termScreen = target?.closest("#terminal-screen") as HTMLElement | null;
  if (termScreen && termScreen.scrollHeight > termScreen.clientHeight + 10) {
    isTouchActive = false;
    return;
  }

  isTouchActive = true;
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}

function onTouchMove(e: TouchEvent) {
  if (!isTouchActive || e.touches.length !== 1) return;

  const currentY = e.touches[0].clientY;
  const currentX = e.touches[0].clientX;
  const diffY = touchStartY - currentY; // Positive = swipe UP (advance), Negative = swipe DOWN (return)
  const diffX = touchStartX - currentX;

  // Ignore horizontal gestures
  if (Math.abs(diffX) > Math.abs(diffY)) return;

  if (Math.abs(diffY) > SWIPE_THRESHOLD) {
    isTouchActive = false;
    const targetIndex = diffY > 0 ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < totalSlides) {
      goToSlide(targetIndex);
    }
  }
}

function onTouchEnd() {
  isTouchActive = false;
}

/**
 * Keyboard navigation for slide deck.
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

  if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
    e.preventDefault();
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  } else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
    e.preventDefault();
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
 * Transitions to target slide with instant, solid, zero-fade push presentation animation.
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
  currentIndex = targetIndex;

  updateHUD(targetIndex);
  playSlideSound(isNext ? 1 : -1);

  // Reset target slide scroll position to top instantly
  const targetInner = nextSlide.querySelector(".slide-inner") as HTMLElement | null;
  if (targetInner) {
    targetInner.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  // Prepare next slide: fully solid (opacity: 1), visible, interactive
  nextSlide.removeAttribute("inert");
  nextSlide.removeAttribute("aria-hidden");
  nextSlide.style.visibility = "visible";
  nextSlide.style.pointerEvents = "auto";
  nextSlide.style.opacity = "1";
  currentSlide.style.opacity = "1";

  if (immediate) {
    slides.forEach((s, idx) => {
      s.classList.toggle("active", idx === targetIndex);
      if (idx === targetIndex) {
        s.removeAttribute("inert");
        s.removeAttribute("aria-hidden");
        s.style.visibility = "visible";
        s.style.pointerEvents = "auto";
        gsap.set(s, {
          yPercent: 0,
          opacity: 1,
          zIndex: 10,
        });
      } else {
        s.setAttribute("inert", "");
        s.setAttribute("aria-hidden", "true");
        s.style.visibility = "hidden";
        s.style.pointerEvents = "none";
        gsap.set(s, {
          yPercent: idx < targetIndex ? -100 : 100,
          opacity: 1,
          zIndex: 1,
        });
      }
    });
    isAnimating = false;
    transitionEndTime = Date.now();
    return;
  }

  // Kill running tweens to ensure clean state
  gsap.killTweensOf([currentSlide, nextSlide]);

  // Position next slide immediately offscreen in incoming direction
  gsap.set(nextSlide, {
    yPercent: isNext ? 100 : -100,
    zIndex: 20,
    opacity: 1,
  });
  gsap.set(currentSlide, {
    zIndex: 10,
    opacity: 1,
  });

  // Solid push with instant peak velocity (power3.out) - zero delay
  gsap.to(currentSlide, {
    yPercent: isNext ? -100 : 100,
    duration: TRANSITION_DURATION,
    ease: TRANSITION_EASE,
    overwrite: "auto",
  });

  gsap.to(nextSlide, {
    yPercent: 0,
    duration: TRANSITION_DURATION,
    ease: TRANSITION_EASE,
    overwrite: "auto",
    onComplete: () => {
      currentSlide.classList.remove("active");
      nextSlide.classList.add("active");

      // Hide and disable off-screen current slide
      currentSlide.setAttribute("inert", "");
      currentSlide.setAttribute("aria-hidden", "true");
      currentSlide.style.visibility = "hidden";
      currentSlide.style.pointerEvents = "none";
      gsap.set(currentSlide, {
        zIndex: 1,
        yPercent: isNext ? -100 : 100,
        opacity: 1,
      });

      // Confirm next slide active position
      gsap.set(nextSlide, {
        zIndex: 10,
        yPercent: 0,
        opacity: 1,
        pointerEvents: "auto",
      });

      isAnimating = false;
      transitionEndTime = Date.now();
    },
  });
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
      // Support matching section groups
      const isMatch =
        href === anchor ||
        (href === "projects" && (anchor === "projects" || anchor === "works-engines")) ||
        (href === "experience" && (anchor === "experience" || anchor === "leadership"));
      item.classList.toggle("active", isMatch);
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
