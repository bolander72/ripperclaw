---
layout: ../../../layouts/DocLayout.astro
title: Installation
---

# Installation

## CLI

Use without installing:

```bash
npx clawclawgo
```

Or clone from source:

```bash
git clone https://github.com/bolander72/clawclawgo
cd clawclawgo
chmod +x cli/clawclawgo.mjs
./cli/clawclawgo.mjs
```

## Web App

No installation needed. Visit [clawclawgo.com](https://clawclawgo.com) to search and browse kits.

## Requirements

- **Node.js** 18+ (for CLI)
- **Git** (for `add` command — clones repos)
- **GitHub CLI** (`gh`) — optional, for `push` command (auto-creates registry PRs)

## Commands

```bash
npx clawclawgo pack [dir] [--out file]         # Pack your skills into a kit
npx clawclawgo push [dir]                      # Push your kit to the registry
npx clawclawgo add <owner/repo> [--dest dir]   # Add a kit from GitHub
```

## Next Steps

- [Quickstart](/docs/guide/quickstart) — Add your first kit
- [Packing](/docs/guide/packing) — Learn the pack command
- [Pushing](/docs/guide/pushing) — Share on the registry
