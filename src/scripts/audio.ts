// audio.ts - Zero-dependency Web Audio API procedural synthesis for high-tech HUD interactions
// Reflects skills from: Olympus Dash Chaos Arena (Web Audio API procedural synthesis)

let audioCtx: AudioContext | null = null;
let soundEnabled = false;

export function initAudio() {
  if (typeof window === "undefined") return;

  const toggleBtn = document.querySelector(".icon-dial-btn") as HTMLElement | null;
  if (!toggleBtn) return;

  // Read user preference from localStorage if previously toggled
  const stored = localStorage.getItem("hud_sound_enabled");
  if (stored === "true") {
    soundEnabled = true;
    toggleBtn.classList.add("sound-on");
  }

  toggleBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("hud_sound_enabled", String(soundEnabled));
    toggleBtn.classList.toggle("sound-on", soundEnabled);

    if (soundEnabled) {
      ensureAudioContext();
      playBlip(880, 0.05, "sine");
    }
  });

  // Attach subtle click feedback to interactive elements
  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement)?.closest("button, .nav-item, .cmd-pill, .target-btn, .mode-btn");
    if (target && soundEnabled) {
      playClick();
    }
  });
}

function ensureAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function playBlip(freq = 640, duration = 0.04, type: OscillatorType = "sine") {
  if (!soundEnabled) return;
  try {
    ensureAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}

export function playClick() {
  playBlip(1200, 0.03, "triangle");
}

