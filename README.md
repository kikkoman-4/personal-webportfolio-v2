# personal-webportfolio-v2

A modern, high-performance successor to my personal web portfolio. Built with **Astro**, **TypeScript**, and modern CSS styling to showcase projects, skills, and professional experience with snappy page loads and refined visuals.

---

## 🚀 Tech Stack

- **Framework:** [Astro](https://astro.build/) (content-focused, zero-JS by default, ultra-fast load times)
- **Language:** TypeScript
- **Styling:** Modern Vanilla CSS / CSS Modules (clean design tokens, dark mode support, fluid responsiveness)
- **Deployment:** Vercel / GitHub Pages / Netlify

---

## 📁 Repository Structure

```text
personal-webportfolio-v2/
├── public/                 # Static assets served untouched (favicons, downloads, robots.txt)
├── src/
│   ├── assets/             # Optimized assets (images, icons, designs)
│   │   ├── images/
│   │   └── icons/
│   ├── components/         # Reusable UI components
│   ├── layouts/            # Page layouts (BaseLayout.astro)
│   ├── pages/              # Astro routing (index.astro)
│   └── styles/             # Global CSS & Design tokens
│       ├── variables.css   # Color palette, spacing, typography tokens
│       └── global.css      # CSS reset, base tags, utility classes
├── astro.config.mjs        # Astro configuration
├── tsconfig.json           # TypeScript config with path aliases (@/*, @styles/*, etc.)
└── package.json
```

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (>= 18.x or 20.x recommended)
- npm / pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/personal-webportfolio-v2.git
cd personal-webportfolio-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

---

