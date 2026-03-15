---
layout: ../../../layouts/DocLayout.astro
title: What is ClawClawGo?
---

# What is ClawClawGo?

ClawClawGo is a search engine for AI agent kits — curated collections of skills packaged together. It aggregates kits from GitHub repos, indexes them, and lets you search across all of them in one place.

## The Problem

AI agents (Claude Code, Cursor, Windsurf, OpenClaw, Cline, etc.) can be extended with skills and configs. But there's no central place to find curated collections of them.

- Kits are scattered across GitHub repos with no discoverability
- No standard format across agents
- No way to search across all of them
- No security scanning before use

## The Solution

1. **Aggregating** — Pulls kits from GitHub repos into one searchable index
2. **Standardizing** — Supports the [Agent Skills](https://agentskills.io) open standard plus all major agent formats
3. **Scanning** — Built-in security analysis with trust scores
4. **Adding** — Clone kit repos with one command: `npx clawclawgo add owner/repo`

## What's a Kit?

A kit is a GitHub repo containing a collection of skills and agent configs. Examples:

- [garrytan/gstack](https://github.com/garrytan/gstack) — 8 Claude Code skills for CEO/eng review, shipping, QA
- [anthropics/skills](https://github.com/anthropics/skills) — Anthropic's official skill collection
- [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) — Community Cursor rules

## Three Commands

```bash
npx clawclawgo pack              # Pack your skills into a kit
npx clawclawgo push              # Push your kit to the registry
npx clawclawgo add owner/repo    # Add a kit from GitHub
```

**For kit creators:** Pack, push, done.

**For kit users:** Search on [clawclawgo.com](https://clawclawgo.com), then `add`.

## Agent Skills Standard

ClawClawGo follows the [Agent Skills](https://agentskills.io) open standard. 30+ agents support this format. See [AGENT-COMPATIBILITY.md](https://github.com/bolander72/clawclawgo/blob/main/AGENT-COMPATIBILITY.md) for the full list.

## Not Agent-Specific

ClawClawGo started in the OpenClaw ecosystem but is a cross-platform search engine for any AI agent.

## Open Source

- **Repo:** [github.com/bolander72/clawclawgo](https://github.com/bolander72/clawclawgo)
- **Registry:** `registry/kits.json` — submit PRs to add kits
- **CLI:** Node.js, zero dependencies — run with `npx clawclawgo`

## Next Steps

- [Get started](/docs/guide/quickstart)
- [Learn about security](/docs/guide/security)
- [Explore kits](https://clawclawgo.com/explore)
