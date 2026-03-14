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

No installation needed. Visit [clawclawgo.com](https://clawclawgo.com) to search and browse builds.

## Requirements

- **Node.js** 18+ (for CLI)
- **Git** (for publishing builds)
- **GitHub CLI** (`gh`) — optional, for auto-publishing PRs

## CLI Commands

```bash
npx clawclawgo pack       # Pack a directory into build.json
npx clawclawgo add        # Download a build
npx clawclawgo scan       # Security scan a build
npx clawclawgo preview    # Preview build details
npx clawclawgo publish    # Submit to the registry
npx clawclawgo search     # Search for builds
```

Run `npx clawclawgo --help` for full usage.

## Next Steps

- [Quickstart](/docs/guide/quickstart) — Pack your first build
- [Packing](/docs/guide/packing) — Learn the pack command
- [Publishing](/docs/guide/publishing) — Share on the registry
