---
layout: ../../../layouts/DocLayout.astro
title: Browsing Builds
---

# Browsing Builds

Find builds on ClawClawGo using the web app or CLI.

## Web App

Visit [clawclawgo.com](https://clawclawgo.com) to search and browse.

### Search

Use the search bar on the homepage. Results show:
- Build name and description
- Compatible agents
- Trust score
- Author and source
- Tags

Click a build to see the full detail view — skills with links to their source, agent configs, scan results, and download options.

### Feed

The [Feed](https://clawclawgo.com/feed) shows recently added builds from all sources (GitHub, ClawHub, skills.sh, registry).

### Community Builds

[Community Builds](https://clawclawgo.com/community) showcases curated builds organized by category.

## CLI Search

```bash
npx clawclawgo search "voice assistant"
```

Opens the search results on [clawclawgo.com](https://clawclawgo.com/search).

## Filter by Agent

Use the agent filter dropdown on the search page to find builds for a specific agent (Claude Code, Cursor, OpenClaw, etc.).

## Filter by Tag

Click a tag on any build card to filter by category. Common tags:
- `voice`, `coding`, `automation`, `email`, `calendar`, `smart-home`, `devops`, `security`

## Check Trust Score

Every build includes a baked-in security scan. The trust score (0-100) is displayed on build cards. Click into a build to see individual findings.

Preview a build from the CLI:

```bash
npx clawclawgo preview build.json
```

## Download a Build

```bash
npx clawclawgo add https://example.com/build.json
```

The `add` command checks the baked-in scan results and blocks flagged builds unless you pass `--force`. Give the downloaded file to your AI agent — it'll know what to do.

## Registry

The full registry is at [registry/builds.json](https://github.com/bolander72/clawclawgo/blob/main/registry/builds.json).

## Next Steps

- [Creating Builds](/docs/builds/creating) — Make your own
- [Sharing Builds](/docs/builds/sharing) — Publish to the registry
- [Security](/docs/guide/security) — Understanding trust scores
