---
layout: ../../../layouts/DocLayout.astro
title: Kits Overview
---

# Kits Overview

A kit is a collection of skills and agent configs packaged together. Think of it as a portable skill pack for AI agents.

## Structure

A typical kit directory looks like:

```
my-kit/
├── skills/
│   ├── voice-assistant/
│   │   ├── SKILL.md
│   │   └── scripts/
│   │       └── tts.sh
│   └── home-automation/
│       └── SKILL.md
├── .cursorrules
├── CLAUDE.md
├── openclaw.json
├── kit.json
└── README.md
```

When you run `clawclawgo pack`, it scans this directory and generates `kit.json`:

```json
{
  "name": "Voice & Home Automation",
  "description": "Skills for voice control and smart home management",
  "version": "1.0.0",
  "author": "Your Name",
  "skills": [
    {
      "path": "skills/voice-assistant/SKILL.md",
      "name": "voice-assistant",
      "description": "Voice command processing",
      "compatibility": ["openclaw", "cursor", "windsurf"]
    },
    {
      "path": "skills/home-automation/SKILL.md",
      "name": "home-automation",
      "description": "Smart home device control",
      "compatibility": ["openclaw"]
    }
  ],
  "configs": [
    {
      "path": ".cursorrules",
      "agent": "cursor"
    },
    {
      "path": "CLAUDE.md",
      "agent": "claude-code"
    },
    {
      "path": "openclaw.json",
      "agent": "openclaw"
    }
  ],
  "scan": {
    "score": 95,
    "findings": [
      {
        "severity": "low",
        "type": "network",
        "message": "External API call in tts.sh",
        "file": "skills/voice-assistant/scripts/tts.sh",
        "line": 12
      }
    ],
    "timestamp": "2024-03-14T17:00:00Z"
  },
  "repository": "https://github.com/yourusername/my-kit"
}
```

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

When the user sends a voice message:
1. Transcribe with Whisper
2. Process the command
3. Generate response with TTS
```

Skills can include:
- Scripts (bash, python, etc.)
- Config files
- Assets (audio files, images, etc.)

### Agent Configs

Config files tell agents how to behave:

- `.cursorrules` — Instructions for Cursor
- `CLAUDE.md` — Instructions for Claude Code
- `openclaw.json` — OpenClaw agent config
- `.windsurfrules` — Windsurf instructions
- And more

These are agent-specific and vary in format.

### Scan Results

Every kit includes security scan results:

- **Trust score** (0-100) — Overall safety rating
- **Findings** — List of potential issues
- **Timestamp** — When the scan was run

The scan is baked into `kit.json` so users can see it before downloading.

## Kit Lifecycle

1. **Create** — Organize skills and configs in a directory
2. **Pack** — `clawclawgo pack` generates kit.json
3. **Scan** — Security analysis runs automatically
4. **Publish** — Push to GitHub, submit to registry
5. **Share** — Others download with `clawclawgo add`

## Kit Format

Kits are just directories with a `kit.json`. No special format required. The pack command handles the detection and metadata generation.

You can create kits manually or use the CLI. Either way, the result is a portable package that works across agents.

## Next Steps

- [Creating Kits](/docs/kits/creating) — How to make your own
- [Browsing Kits](/docs/kits/browsing) — Finding kits on ClawClawGo
- [Sharing Kits](/docs/kits/sharing) — Publishing to the registry
