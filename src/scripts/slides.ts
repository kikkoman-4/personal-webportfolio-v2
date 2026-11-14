// slides.ts - GSAP & Observer powered PowerPoint-style Presentation Slide Deck
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { playSlideSound } from "@scripts/audio";

gsap.registerPlugin(Observer);

let currentIndex = 0;
let isAnimating = false;
let slides: HTMLElement[] = [];
let totalSlides = 0;

export function initSlideDeck() {
  if (typeof window === "undefined") return;

  const stage = document.getElementById("slides-stage");
  if (!stage) return;

  slides = Array.from(stage.querySelectorAll<HTMLElement>(".slide-panel"));
  totalSlides = slides.length;
  if (totalSlides === 0) return;

  // Set document/body class for slide deck presentation styling
  document.documentElement.classList.add("slide-deck-mode");
  document.body.classList.add("slide-deck-mode");

  // Initial layout: slide 0 is active and visible, others placed below
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
        scale: 0.95,
        zIndex: 1,
        pointerEvents: "none",
      });
      slide.classList.remove("active");
    }
  });

  updateHUD(0);

  // 1. Gesture Navigation via GSAP Observer (wheel, touch swipe, trackpad)
  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    wheelSpeed: -1, // Normalizes wheel down to trigger onUp (Next Slide)
    tolerance: 20,
    preventDefault: false, // Allows natural text selection, terminal typing & input interaction
    onUp: (self) => {
      // Swiping up on mobile or scrolling wheel down -> Next slide
      handleGesture("next", self.event);
    },
    onDown: (self) => {
      // Swiping down on mobile or scrolling wheel up -> Previous slide
      handleGesture("prev", self.event);
    },
  });

  // 2. Keyboard Navigation (PowerPoint standard: Arrow keys, PageDown/Up, Spacebar)
  window.addEventListener("keydown", (e) => {
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
      handleGesture("next");
    } else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
      e.preventDefault();
      handleGesture("prev");
    } else if (e.key === "Home") {
      e.preventDefault();
      goToSlide(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goToSlide(totalSlides - 1);
    }
  });

  // 3. UI Controls: Prev & Next Buttons
  const prevBtn = document.getElementById("deck-prev-btn");
  const nextBtn = document.getElementById("deck-next-btn");

  prevBtn?.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
  });

  nextBtn?.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
  });

  // 4. UI Controls: Slide Rail Pips
  document.querySelectorAll<HTMLButtonElement>(".slide-pip").forEach((pip) => {
    pip.addEventListener("click", () => {
      const idx = parseInt(pip.getAttribute("data-goto") || "0", 10);
      goToSlide(idx);
    });
  });

  // 5. Intercept internal navigation anchors (#home, #about, #projects, etc.)
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

  // 6. Support Deep Links / Hash Navigation
  if (window.location.hash) {
    const anchor = window.location.hash.replace("#", "");
    const targetIdx = slides.findIndex((s) => s.dataset.anchor === anchor);
    if (targetIdx !== -1 && targetIdx !== 0) {
      goToSlide(targetIdx, true);
    }
  }
}

/**
 * Validates scroll boundaries on the active slide before advancing.
 * If the slide has internal overflow, it allows smooth inner scrolling first.
 */
function handleGesture(direction: "next" | "prev", event?: Event) {
  if (isAnimating) return;

  // Don't intercept clicks or typing inside the interactive terminal
  if (event) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("#terminal-root")) {
      return;
    }
  }

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
  if (!currentSlide) return;

  const inner = currentSlide.querySelector(".slide-inner") as HTMLElement | null;
  if (inner) {
    const hasOverflow = inner.scrollHeight > inner.clientHeight + 6;
    if (hasOverflow) {
      if (direction === "next") {
        const atBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 8;
        if (!atBottom) return; // Allow inner container to finish scrolling
      } else {
        const atTop = inner.scrollTop <= 8;
        if (!atTop) return; // Allow inner container to scroll up
      }
    }
  }

  if (direction === "next") {
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  } else {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
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
  currentIndex = targetIndex;

  updateHUD(targetIndex);
  playSlideSound(isNext ? 1 : -1);

  // Position inner scroll position appropriately
  const targetInner = nextSlide.querySelector(".slide-inner") as HTMLElement | null;
  if (targetInner) {
    targetInner.scrollTop = isNext ? 0 : Math.max(0, targetInner.scrollHeight - targetInner.clientHeight);
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
          yPercent: idx < targetIndex ? -25 : 100,
          opacity: 0,
          autoAlpha: 0,
          scale: 0.95,
          zIndex: 1,
          pointerEvents: "none",
        });
      }
    });
    isAnimating = false;
    return;
  }

  // PowerPoint-style Slide Transition Timeline
  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: () => {
      currentSlide.classList.remove("active");
      nextSlide.classList.add("active");

      gsap.set(currentSlide, {
        autoAlpha: 0,
        zIndex: 1,
        pointerEvents: "none",
      });
      gsap.set(nextSlide, {
        zIndex: 10,
        pointerEvents: "auto",
      });
      isAnimating = false;
    },
  });

  // Activate next slide visibility immediately
  gsap.set(nextSlide, {
    autoAlpha: 1,
    zIndex: 20,
    pointerEvents: "auto",
  });

  // 1. Current Slide Moves Out: shifts away with a smooth scale-down
  tl.to(
    currentSlide,
    {
      yPercent: isNext ? -20 : 100,
      opacity: 0,
      scale: isNext ? 0.94 : 0.98,
      duration: 0.75,
    },
    0
  );

  // 2. Next Slide Moves In: rises/slides into view with scale and full opacity
  tl.fromTo(
    nextSlide,
    {
      yPercent: isNext ? 100 : -20,
      opacity: 0,
      scale: isNext ? 0.98 : 0.94,
    },
    {
      yPercent: 0,
      opacity: 1,
      scale: 1,
      duration: 0.75,
    },
    0
  );

  // 3. Staggered Content Presentation Reveal inside Incoming Slide
  const revealTargets = nextSlide.querySelectorAll(
    ".hero-badge, .hero-headline, .hero-bio, .hero-actions, .section-header, .bento-card, .project-card, .exp-card, .skill-group, .contact-box"
  );
  if (revealTargets.length > 0) {
    tl.fromTo(
      revealTargets,
      {
        y: isNext ? 18 : -18,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.04,
        ease: "power2.out",
      },
      0.22
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
