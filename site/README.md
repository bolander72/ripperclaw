# ClawClawGo Landing Page

Cyberpunk-themed landing page for ClawClawGo — AI agent config management for OpenClaw.

## Features

- **Retro-futuristic cyberpunk aesthetic** — Dark theme with cyan + magenta accents
- **Scanline effects** — Animated CRT-style overlay
- **Interactive slot visualization** — Hover over the 9 cyberware slots
- **Smooth scroll navigation** — Single-page layout
- **Mobile responsive** — Works on all devices
- **Pure static site** — No server required

## Tech Stack

- **Vite** — Build tool
- **React 19** — UI framework
- **Tailwind CSS v4** — Styling
- **Google Fonts** — Space Grotesk, JetBrains Mono, Inter

## Colors (from the app)

```css
--rc-bg: #0a0a0f
--rc-surface: #12121a
--rc-border: #1e1e2e
--rc-cyan: #00f0ff
--rc-magenta: #ff00aa
--rc-green: #00ff88
--rc-yellow: #ffcc00
--rc-red: #ff3366
--rc-text: #e8e8f0
--rc-text-dim: #8888a0
--rc-text-muted: #555570
```

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

Output: `dist/` directory

## Deploy

The `dist/` folder contains the production-ready static site. Deploy to:

- **Vercel** — `vercel dist`
- **Netlify** — Drag and drop `dist/` folder
- **GitHub Pages** — Push `dist/` contents to `gh-pages` branch
- **Any static host** — Upload `dist/` contents

### Domain: clawclawgo.com

Point DNS to your hosting provider and deploy the `dist/` folder.

## Sections

1. **Hero** — Big headline, slot grid, download CTA
2. **The Slots** — 9 cyberware slots explained
3. **The Feed** — How sharing works (publish → browse → compare → clone)
4. **How It Works** — 3-step guide
5. **Templates** — Starter configs (Homelab, Ops, Researcher, Smart Home, Creator)
6. **Open Source** — GitHub links, MIT license
7. **Footer** — Minimal links

## License

MIT
