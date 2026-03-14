---
layout: ../../../layouts/DocLayout.astro
title: Installation
---

# Installation

ClawClawGo has two parts: the CLI and the web app.

## CLI

Use without installing:

```bash
npx clawclawgo --help
```

Or clone from source:

```bash
git clone https://github.com/bolander72/clawclawgo
cd clawclawgo
chmod +x cli/clawclawgo.mjs
./cli/clawclawgo.mjs --help
```

## Web App

No installation needed. Visit [clawclawgo.com](https://clawclawgo.com) to search and browse kits.

## Requirements

- **Node.js** 18+ (for CLI)
- **Git** (for publishing kits)
- **GitHub CLI** (`gh`) — optional, for auto-publishing PRs

## CLI Commands

```bash
npx clawclawgo pack       # Pack a directory into kit.json
npx clawclawgo add        # Download a kit
npx clawclawgo scan       # Security scan a kit
npx clawclawgo preview    # Preview kit details
npx clawclawgo publish    # Submit to the registry
npx clawclawgo search     # Search for kits
```

Run `npx clawclawgo --help` for full usage.

## Next Steps

- [Quickstart](/docs/guide/quickstart) — Pack your first kit
- [Packing](/docs/guide/packing) — Learn the pack command
- [Publishing](/docs/guide/publishing) — Share on the registry
