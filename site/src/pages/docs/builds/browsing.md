---
layout: ../../../layouts/DocLayout.astro
title: Browsing Builds
---

# Browsing Builds

Find builds on ClawClawGo using the web app or CLI.

## Web App

Visit [clawclawgo.com](https://clawclawgo.com) to search and browse.

### Search

Use the search bar on the homepage:

```
voice assistant
```

Results show:
- Build name and description
- Compatible agents
- Trust score
- Author
- Tags

Click a build to see:
- Full description
- List of skills
- Agent configs
- Scan results
- Download instructions

### Feed

The [Feed](https://clawclawgo.com/feed) shows recently added builds.

### Community Builds

[Community Builds](https://clawclawgo.com/community) lists all builds in the registry, organized by category.

## CLI Search

Search from the terminal:

```bash
clawclawgo search "voice assistant"
```

Output:

```
Found 3 builds:

1. voice-assistant-pro
   by @username
   Voice control, TTS, and smart home integration
   Compatible: openclaw, cursor, windsurf
   Score: 95/100

2. basic-voice-commands
   by @another-user
   Simple voice command processing
   Compatible: openclaw
   Score: 88/100

3. voice-agent-toolkit
   by @someone
   Comprehensive voice agent tools
   Compatible: openclaw, cursor, claude-code
   Score: 92/100
```

## Filter by Agent

Find builds for a specific agent:

**Web:**
Use the agent filter dropdown on the search page.

**CLI:**
```bash
clawclawgo search "voice" --agent cursor
```

## Filter by Tag

Narrow results by category:

**Web:**
Click a tag on any build card, or use the tag filter.

**CLI:**
```bash
clawclawgo search "automation" --tag home-assistant
```

Common tags:
- `voice`
- `coding`
- `automation`
- `email`
- `calendar`
- `home-assistant`
- `messaging`

## Check Trust Score

Before downloading, check the security score:

**Web:**
The score is displayed on every build card. Click "View Scan Results" to see findings.

**CLI:**
```bash
clawclawgo preview https://example.com/build.json
```

Output includes:

```
Trust Score: 95/100 ✓

Findings:
  [LOW] External network call in setup.sh
```

## Preview Before Downloading

See what's in a build without downloading:

```bash
clawclawgo preview https://example.com/build.json
```

Shows:
- Skills list
- Agent configs
- Scan results
- File tree

## Registry

The full registry is at [github.com/bolander72/clawclawgo/blob/main/registry/builds.json](https://github.com/bolander72/clawclawgo/blob/main/registry/builds.json).

You can browse it directly or use the web app/CLI.

## Next Steps

- [Creating Builds](/docs/builds/creating) — Make your own
- [Sharing Builds](/docs/builds/sharing) — Publish to the registry
- [Security](/docs/guide/security) — Understanding trust scores
