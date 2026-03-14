---
layout: ../../../layouts/DocLayout.astro
title: What is ClawClawGo?
---

# What is ClawClawGo?

ClawClawGo is a search engine for AI agent skills. It aggregates skills from GitHub repos, indexes them, and lets you search across all of them in one place.

## The Problem

AI agents (Claude Code, Cursor, Windsurf, OpenClaw, Cline, etc.) can be extended with skills and configs. But there's no central place to find them.

- Skills are scattered across GitHub repos
- No standard format (some use SKILL.md, some use .cursorrules, some use custom formats)
- No way to search across all of them
- No security scanning
- Hard to share and discover

## The Solution

ClawClawGo solves this by:

1. **Aggregating** — Pulls skills from GitHub repos into one index
2. **Standardizing** — Supports the [Agent Skills](https://agentskills.io) open standard plus all major agent formats
3. **Searching** — Full-text search across all indexed builds
4. **Scanning** — Built-in security analysis with trust scores
5. **Packaging** — Bundle skills + configs into portable builds

## What's a Build?

A build is a collection of skills and agent configs packaged together. Think of it as a recipe:

```json
{
  "name": "Voice Assistant Build",
  "description": "Skills for voice-controlled agents",
  "skills": [
    { "path": "skills/voice-commands/SKILL.md" },
    { "path": "skills/tts/SKILL.md" }
  ],
  "configs": [
    { "path": ".cursorrules", "agent": "cursor" },
    { "path": "CLAUDE.md", "agent": "claude-code" }
  ],
  "scan": {
    "score": 95,
    "findings": []
  }
}
```

Builds can be:
- Shared via GitHub repos
- Published to the ClawClawGo registry
- Downloaded with the CLI
- Scanned for security before use

## How It Works

**For build creators:**
1. Organize your skills and configs in a directory
2. Run `clawclawgo pack` to generate build.json
3. Push to GitHub
4. Submit to the registry

**For build users:**
1. Search on [clawclawgo.com](https://clawclawgo.com)
2. Download with `clawclawgo add`
3. Review scan results
4. Use in your agent

## Agent Skills Standard

ClawClawGo follows the [Agent Skills](https://agentskills.io) open standard. A skill is a directory with a `SKILL.md` file containing:

```markdown
---
name: example-skill
description: Does something useful
agents: [openclaw, cursor, windsurf]
tools: [read, write, exec]
---

# Skill Instructions

When the user asks to do X, follow these steps...
```

The YAML frontmatter describes:
- What the skill does
- Which agents it works with
- What tools/permissions it needs

The markdown body contains the actual instructions.

## Supported Agents

ClawClawGo works with 30+ AI agents:

- **Claude Code** — CLAUDE.md
- **Cursor** — .cursorrules
- **Windsurf** — .windsurfrules
- **OpenClaw** — openclaw.json, SKILL.md
- **Codex** — codex.json
- **Cline** — .clinerules
- **Aider** — .aider.conf.yml
- **Continue** — .continue/config.json
- **GitHub Copilot** — .github/copilot-instructions.md
- And more — see [AGENT-COMPATIBILITY.md](https://github.com/bolander72/clawclawgo/blob/main/AGENT-COMPATIBILITY.md)

## Security

Every build includes security scan results:

- Trust score (0-100)
- List of findings (prompt injection, shell exfiltration, credential access, etc.)
- Timestamp of scan

The `add` command checks the score before downloading. Low-scoring builds are blocked by default.

## Not OpenClaw-Specific

ClawClawGo started in the OpenClaw ecosystem but is **not OpenClaw-specific**. It's a cross-platform search engine for any AI agent that uses skills.

OpenClaw is just one of 30+ supported agents.

## Open Source

ClawClawGo is MIT licensed and open source:

- **Repo:** [github.com/bolander72/clawclawgo](https://github.com/bolander72/clawclawgo)
- **Registry:** `registry/builds.json` (submit PRs to add builds)
- **CLI:** Node.js, zero dependencies

## Next Steps

- [Install the CLI](/docs/guide/installation)
- [Pack your first build](/docs/guide/quickstart)
- [Learn about security](/docs/guide/security)
- [Browse builds](https://clawclawgo.com/search)
