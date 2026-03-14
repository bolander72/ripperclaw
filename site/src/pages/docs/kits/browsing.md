---
layout: ../../../layouts/DocLayout.astro
title: Browsing Kits
---

# Browsing Kits

Find kits on ClawClawGo using the web app or CLI.

## Web App

Visit [clawclawgo.com](https://clawclawgo.com) to search and browse.

### Search

Use the search bar on the homepage. Results show:
- Kit name and description
- Compatible agents
- Trust score
- Author and source
- Tags

Click a kit to see the full detail view — skills with links to their source, agent configs, scan results, and download options.

### Feed

The [Explore](https://clawclawgo.com/explore) page shows recently added kits from all sources (GitHub, ClawHub, skills.sh, registry).

### Community Kits

[Community Kits](https://clawclawgo.com/community) showcases curated kits organized by category.

## CLI Search

```bash
npx clawclawgo search "voice assistant"
```

Opens the search results on [clawclawgo.com](https://clawclawgo.com/search).

## Filter by Agent

Use the agent filter dropdown on the search page to find kits for a specific agent (Claude Code, Cursor, OpenClaw, etc.).

## Filter by Tag

Click a tag on any kit card to filter by category. Common tags:
- `voice`, `coding`, `automation`, `email`, `calendar`, `smart-home`, `devops`, `security`

## Check Trust Score

Every kit includes a baked-in security scan. The trust score (0-100) is displayed on kit cards. Click into a kit to see individual findings.

Preview a kit from the CLI:

```bash
npx clawclawgo preview kit.json
```

## Download a Kit

```bash
npx clawclawgo add https://example.com/kit.json
```

The `add` command checks the baked-in scan results and blocks flagged kits unless you pass `--force`. Give the downloaded file to your AI agent — it'll know what to do.

## Registry

The full registry is at [registry/kits.json](https://github.com/bolander72/clawclawgo/blob/main/registry/kits.json).

## Next Steps

- [Creating Kits](/docs/kits/creating) — Make your own
- [Sharing Kits](/docs/kits/sharing) — Publish to the registry
- [Security](/docs/guide/security) — Understanding trust scores
