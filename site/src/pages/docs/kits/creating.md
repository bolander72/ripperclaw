---
layout: ../../../layouts/DocLayout.astro
title: Creating
---

# Creating a Kit

## Directory Structure

A kit is a directory with skills and agent configs:

```
my-kit/
├── skills/
│   ├── voice-assistant/
│   │   ├── SKILL.md
│   │   └── scripts/
│   └── home-automation/
│       └── SKILL.md
├── .cursorrules
├── CLAUDE.md
└── README.md
```

Each skill follows the [Agent Skills](https://agentskills.io) standard — a directory with a `SKILL.md` file containing YAML frontmatter.

## Write a SKILL.md

```markdown
---
name: voice-assistant
description: Process voice commands and respond with TTS
agents: [openclaw, cursor, windsurf]
tools: [exec, read, write]
---

# Voice Assistant

When the user sends a voice message:
1. Transcribe with Whisper
2. Process the command
3. Generate response with TTS
```

Skills can include scripts, config files, and assets alongside the SKILL.md.

## Pack It

```bash
npx clawclawgo pack ~/my-kit --out kit.json
```

This scans the directory, detects all skills and agent configs, runs a security scan, and outputs `kit.json`.

## Add Agent Configs

Include config files for the agents you support:

- `CLAUDE.md` — Claude Code instructions
- `.cursorrules` — Cursor rules
- `.windsurfrules` — Windsurf rules
- `AGENTS.md` — OpenClaw workspace config

The `pack` command auto-detects these and maps them to the right agents.

## Tips

- **Name skills clearly.** `seo-audit` beats `skill-1`.
- **Write good descriptions.** The YAML `description` field is what shows up in search results.
- **Declare compatibility.** The `agents` field in frontmatter tells ClawClawGo which agents can use each skill.
- **Keep skills focused.** One skill per capability. Let users pick what they need.
