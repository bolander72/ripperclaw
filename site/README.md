# ClawClawGo Landing Page

Landing page for ClawClawGo, the search engine and marketplace for AI agent builds on OpenClaw.

## Features

- Dark theme with cyan + magenta accents
- Animated build cards (conveyor belt)
- Interactive block visualization
- Smooth scroll, single-page layout
- Mobile responsive
- Pure static site, no server required

## Tech Stack

- Vite (build tool)
- React 19 (UI)
- Tailwind CSS v4 (styling)
- Google Fonts: Space Grotesk, JetBrains Mono, Inter

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

The `dist/` folder is the production-ready static site. Works with:

- Vercel: `vercel dist`
- Netlify: drag and drop `dist/`
- GitHub Pages: push `dist/` to `gh-pages` branch
- Any static host: upload `dist/` contents

### Domain: clawclawgo.com

Point DNS to your hosting provider and deploy the `dist/` folder.

## Sections

1. Hero: headline, build cards, download CTA
2. What Is ClawClawGo: feature grid
3. How It Works: 3-step flow
4. Anatomy of a Build: the 6 blocks
5. FAQs
6. Footer with links and CTA

## License

MIT
