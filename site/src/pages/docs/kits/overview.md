---
layout: ../../../layouts/DocLayout.astro
title: Kits Overview
---

# Kits Overview

A kit is a GitHub repo containing a collection of agent skills and configs. Think of it as a portable skill pack for AI agents.

## What's in a Kit

### Skills

Skills are directories with `SKILL.md` files following the [Agent Skills](https://agentskills.io) standard:

```markdown
---
name: voice-assistant
description: Process voice commands and respond with TTS
agents: [openclaw, cursor, windsurf]
tools: [exec, read, write]
---

# Voice Assistant

When the user sends a voice message...
```

### Agent Configs

Config files tell agents how to behave:

| File | Agent |
|------|-------|
| `CLAUDE.md` | Claude Code |
| `.cursorrules` | Cursor |
| `.windsurfrules` | Windsurf |
| `AGENTS.md` | OpenClaw, Codex |
| `codex.json` | Codex |
| `.clinerules` | Cline |
| `.aider.conf.yml` | Aider |
| `.continue/config.json` | Continue |

## Kit Lifecycle

1. **Create** — Organize skills and configs in a directory
2. **Pack** — `npx clawclawgo pack` generates kit.json
3. **Push** — `npx clawclawgo push` adds to the registry
4. **Add** — Others clone with `npx clawclawgo add owner/repo`

## How Others Use Your Kit

```bash
npx clawclawgo add yourname/your-repo
```

This clones your repo (shallow, no git history), finds all SKILL.md files and agent configs, runs a security scan, and generates a `CLAWCLAWGO.md` documenting what's inside.

## Next Steps

- [Creating Kits](/docs/kits/creating) — How to make your own
- [Browsing Kits](/docs/kits/browsing) — Finding kits on ClawClawGo
- [Sharing Kits](/docs/kits/sharing) — Pushing to the registry
