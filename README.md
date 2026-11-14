# personal-webportfolio-v2

<div align="center">

![Astro](https://img.shields.io/badge/Astro-7.3.8-BC52EE?style=for-the-badge&logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.15.1-88CE02?style=for-the-badge&logo=greensock&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-60_FPS-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Procedural-00E5FF?style=for-the-badge)
![License](https://img.shields.io/badge/License-ISC-gray?style=for-the-badge)

<br />

**A cyber-minimalist, high-performance developer portfolio and presentation deck.**  
Engineered with **Astro**, **TypeScript**, **GSAP**, zero-dependency **HTML5 Canvas 3D rendering**, and procedural **Web Audio API** synthesis.

[Live Demo](https://kikzafable.vercel.app) • [Report Issue](https://github.com/kikkoman-4/personal-webportfolio-v2/issues) • [Transmission](mailto:kikzafable@gmail.com)

</div>

---

## ⚡ Overview

**`personal-webportfolio-v2`** is the next-generation iteration of AA Kikz Afable's personal web portfolio. Built from the ground up for speed, visual precision, and interactive immersion, it transforms traditional vertical scrolling into a **fluid PowerPoint / Keynote-style presentation deck** enclosed within a cybernetic telemetry HUD frame.

The application delivers sub-second page loads, zero runtime overhead from heavy 3D frameworks, and tactile sensory feedback across all inputs.

---

## ✨ Key Features

### 🎛️ 1. PowerPoint-Style Slide Deck Architecture
- **Full Viewport Presentation Stage:** Structured as a 6-panel presentation deck with smooth vertical sliding animations powered by **GSAP** and the **GSAP Observer plugin**.
- **Multi-Input Gesture Navigation:** Seamlessly responds to mouse wheel scrolling, touchpad swipes, mobile touch gestures, and keyboard navigation.
- **Scroll Boundary Protection:** Intelligent overflow handling ensures slides with rich content (like project grids and dossier cards) allow users to scroll their internal content completely before advancing to adjacent slides.
- **Deep Linking & State Sync:** Every slide is mapped to URL hash anchors (`#home`, `#about`, `#projects`, `#experience`, `#skills`, `#contact`) with real-time browser history synchronization.
- **HUD Navigation Dock & Rail:** Features a vertical pip rail with live progress lines, an interactive bottom-right status dock with slide counters and progress bars, and directional jump buttons.

### 🌐 2. Zero-Dependency 3D Canvas Wireframe Engine
- **Custom Math Pipeline:** Projects 3D geometry onto a 2D canvas context without loading massive libraries like Three.js, keeping the bundle size negligible.
- **3 Visual Modes:**
  - `POLYHEDRON`: Interactive 4D hypercube / tesseract wireframe matrix.
  - `PARTICLES`: Floating dynamic orbital node network with depth attenuation.
  - `TOPOLOGY`: Rotating geometric terrain grid.
- **Interactive Physics:** Direct touch and drag rotation with inertia and momentum damping.
- **Live 60 FPS Telemetry:** Embedded real-time performance monitor tracking frames per second (FPS), frame render time in milliseconds (`ms`), and dynamic Euler coordinate positions.

### 💻 3. Interactive Dossier CLI Terminal
- **Built-in ZSH Emulation:** Embedded in Slide 02 to provide an interactive biography and technical dossier.
- **Dual Interaction Modes:** Execute commands via keyboard input or by clicking the quick-action command pills.
- **Available Commands:**
  - `bio` — Engineering background, location, and philosophy.
  - `education` — Degree, honors (Dean's Lister), and alma mater.
  - `leadership` — Presidency and roles at Shiba Re-Ignite Org.
  - `certs` — Verified Google Cybersecurity, AI, Agile, and Python specializations.
  - `stack` — Core languages, frontend, backend, and cloud technologies.
  - `contact` — Direct channels, phone, and location data.
  - `clear` — Resets the terminal output buffer.
  - `help` — Lists all available commands.

### 🔊 4. Procedural Web Audio API Sound System
- **Synthesized UI Feedback:** Zero audio asset files. Uses real-time oscillator waveforms (`sine` and `triangle`) and exponential gain ramps.
- **Contextual Micro-tones:**
  - Distinct directional tones for advancing slides (`820 Hz`) vs. moving back (`620 Hz`).
  - Tactile high-frequency clicks for interactive buttons and pills (`1200 Hz`).
- **User Preference Memory:** Sound state can be toggled on/off via the dial in the top navigation bar and persists across sessions in `localStorage`.

### 📐 5. Cybernetic Telemetry HUD Frame
- **Perimeter Crosshairs & Ticks:** Technical corner markers and perimeter calibration ticks framing the entire viewport.
- **Live Readouts:** Continuous slide completion percentage readout (`00%` – `100%`) and live Philippine Standard Time (PHT / UTC+8) station clock.

---

## 🗂️ Presentation Deck Breakdown

The deck is organized into nine targeted presentation slides, each engineered to force-fit the viewport with zero vertical scroll:

| Slide | Anchor | Title | Component | Highlights |
| :---: | :--- | :--- | :--- | :--- |
| **01** | `#home` | `WIREFRAME ENGINE CORE` | `Hero.astro` | Interactive 3D Canvas engine, tech badges, call-to-actions |
| **02** | `#about` | `SYSTEM DOSSIER & BIO` | `AboutSection.astro` | Operative bio narrative, station telemetry, 4 verified benchmarks |
| **03** | `#terminal` | `COMMAND INTERFACE` | `TerminalSection.astro` | Full-width interactive ZSH terminal console with quick-run pills |
| **04** | `#projects` | `WORKS: WEB & CLOUD` | `ProjectsSection.astro` | Wine Century, Civic LGU Portal, Inventi Property Management |
| **05** | `#works-engines` | `WORKS: ENGINES & REALTIME` | `ProjectsSection.astro` | Olympus Dash 60 FPS Canvas, YGG Matchmaking WebSockets |
| **06** | `#experience` | `CAREER TIMELINE` | `ExperienceSection.astro` | HildrStudios, Pawzled Digital, Barangay Cotta LGU engineering logs |
| **07** | `#leadership` | `LEADERSHIP & ACADEMICS` | `ExperienceSection.astro` | Shiba Re-Ignite presidency, STI College honors, hackathons |
| **08** | `#skills` | `TECHNICAL ARSENAL` | `SkillsSection.astro` | Categorized technical skills & verified Google certifications |
| **09** | `#contact` | `DIRECT TRANSMISSION` | `Footer.astro` | One-click clipboard email copy, social links, footer telemetry |

---

## 🎮 Controls & Keyboard Shortcuts

| Input | Action |
| :--- | :--- |
| <kbd>↓</kbd> / <kbd>PageDown</kbd> / <kbd>Space</kbd> | Advance to Next Slide |
| <kbd>↑</kbd> / <kbd>PageUp</kbd> / <kbd>Shift</kbd> + <kbd>Space</kbd> | Return to Previous Slide |
| <kbd>Home</kbd> | Jump to First Slide (`#home`) |
| <kbd>End</kbd> | Jump to Final Slide (`#contact`) |
| **Mouse Wheel / Trackpad Scroll** | Fluid slide navigation with boundary locking |
| **Touch Swipe (Up / Down)** | Mobile gesture slide switching |
| **Vertical Rail Pips (Right)** | Direct slide index jumping with tooltip previews |
| **Audio Toggle Dial (Navbar)** | Enable / disable procedural Web Audio FX |

---

## 🛠️ Tech Stack & Architecture

### Core Technologies
- **Framework:** [Astro v7.3+](https://astro.build/) — Ultra-fast, content-driven static generation with component-level hydration.
- **Language:** [TypeScript v7.0+](https://www.typescriptlang.org/) — End-to-end type safety, strict configuration, and path aliases.
- **Animation & Gestures:** [GSAP v3.15+](https://gsap.com/) + **GSAP Observer** — Smooth timeline tweens, gesture handling, and hardware-accelerated transforms.
- **Graphics:** HTML5 2D Canvas context rendering 3D isometric and perspective projection.
- **Audio:** Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`).
- **Styling:** Vanilla CSS design tokens (`variables.css`) and global technical styling (`global.css`) without utility bloat.
- **Typography:** Inter (Sans-serif UI) & JetBrains Mono (Technical HUD & Monospace).

### Design Tokens (`src/styles/variables.css`)
- **Base Canvas:** Obsidian black (`#060709`) and pure black (`#000000`).
- **Glass Panels:** Translucent surface cards (`rgba(14, 16, 20, 0.78)`) with `16px` backdrop blur.
- **Hairline Borders:** Multi-tier subtle borders (`rgba(255, 255, 255, 0.05)` to `0.22`).
- **Precision Accents:** Signal Green (`#22c55e`), Alert Red (`#ef4444`), and Cyan (`#38bdf8`).

---

## 📁 Repository Structure

```text
personal-webportfolio-v2/
├── public/                     # Static public assets
│   ├── favicon.svg             # Cybernetic glyph favicon
│   └── robots.txt
├── src/
│   ├── assets/                 # Optimized static assets
│   │   ├── icons/              # SVG system icons
│   │   └── images/             # Media and graphic assets
│   ├── components/             # Astro UI Components
│   │   ├── AboutSection.astro        # Slide 02: Bento dossier & station stats
│   │   ├── ExperienceSection.astro   # Slides 06 & 07: Career timeline & leadership
│   │   ├── Footer.astro              # Slide 09: Contact transmission & metadata
│   │   ├── Hero.astro                # Slide 01: Core introduction & CTA
│   │   ├── HudFrame.astro            # Viewport telemetry border & crosshairs
│   │   ├── InteractiveTerminal.astro # Terminal CLI logic & commands
│   │   ├── Navbar.astro              # Top brand bar, slide links & audio toggle
│   │   ├── ProjectsSection.astro     # Slides 04 & 05: Curated project cards
│   │   ├── SkillsSection.astro       # Slide 08: Tech chips & certifications
│   │   ├── SlideControls.astro       # Right rail pips & bottom deck dock
│   │   ├── TerminalSection.astro     # Slide 03: Dedicated terminal slide stage
│   │   └── WireframeEngine.astro     # 60 FPS HTML5 Canvas 3D engine
│   ├── layouts/
│   │   └── BaseLayout.astro    # HTML head, typography, SEO metadata
│   ├── pages/
│   │   └── index.astro         # Root slide deck stage & transition engine
│   ├── scripts/
│   │   ├── audio.ts            # Web Audio API procedural synthesis & FX
│   │   └── slides.ts           # GSAP Observer slide deck transition manager
│   └── styles/
│       ├── global.css          # CSS reset, base typography & animations
│       └── variables.css       # Design tokens, palette, and spacing
├── astro.config.mjs            # Astro engine configuration
├── package.json                # Project dependencies & npm scripts
├── tsconfig.json               # TypeScript compiler config & path aliases
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x, v20.x, or v22.x recommended)
- **npm**, **pnpm**, or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/kikkoman-4/personal-webportfolio-v2.git
cd personal-webportfolio-v2
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Start Local Development Server

```bash
npm run dev
```

Visit [`http://localhost:4321`](http://localhost:4321) in your browser to view the interactive presentation deck.

---

## 📦 Building for Production

To create a static production build:

```bash
# Compile and optimize static assets to /dist
npm run build

# Preview the local production build
npm run preview
```

### Deployment Targets

The output directory (`/dist`) contains zero-server static HTML, CSS, and optimized JavaScript assets ready for instantaneous deployment on:
- **Vercel:** Connect the GitHub repository; Astro is auto-detected.
- **GitHub Pages:** Deploy via Astro's built-in GitHub Pages action.
- **Netlify / Cloudflare Pages:** Point build output to `dist`.

---

## 🔧 Path Aliases

TypeScript path mapping is configured in `tsconfig.json` for clean, absolute-style imports:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@styles/*": ["./src/styles/*"],
    "@components/*": ["./src/components/*"],
    "@layouts/*": ["./src/layouts/*"],
    "@scripts/*": ["./src/scripts/*"],
    "@assets/*": ["./src/assets/*"]
  }
}
```

---

## 👤 Author

**AA Kikz H. Afable**  
*Full-Stack Developer & Creative Software Engineer*  
- **Location:** BGC, Taguig, Philippines (UTC+8)  
- **Email:** [kikzafable@gmail.com](mailto:kikzafable@gmail.com)  
- **GitHub:** [@Kikkoman-4](https://github.com/Kikkoman-4)  
- **Live MVP:** [kikzafable.vercel.app](https://kikzafable.vercel.app)

---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).
