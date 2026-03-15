---
layout: ../../../layouts/DocLayout.astro
title: Browsing Kits
---

# Browsing Kits

Find kits on ClawClawGo using the web app.

## Web App

Visit [clawclawgo.com](https://clawclawgo.com) to search and browse.

### Search

Use the search bar on the homepage. Results show kit name, description, compatible agents, trust tier badge, author, and source.

Click a kit to see the full detail page — skills with links to source code, agent compatibility, and how to add it.

### Explore

The [Explore](https://clawclawgo.com/explore) page shows kits from all sources (GitHub, ClawHub, skills.sh, registry).

### Filter by Agent

Use the agent filter dropdown to find kits for a specific agent (Claude Code, Cursor, OpenClaw, etc.).

## Adding a Kit

From a kit's detail page:

1. **View on GitHub** — go straight to the source repo
2. **Clone it** — `git clone` one-liner
3. **Use the CLI** — `npx clawclawgo add owner/repo` clones the repo and runs a security scan

```bash
npx clawclawgo add garrytan/gstack
npx clawclawgo add anthropics/skills --dest ~/kits
```

The `add` command generates a `CLAWCLAWGO.md` in the cloned directory describing the kit and its skills.

## Next Steps

- [Creating Kits](/docs/kits/creating) — Make your own
- [Sharing Kits](/docs/kits/sharing) — Push to the registry
- [Security](/docs/guide/security) — Understanding trust scores
