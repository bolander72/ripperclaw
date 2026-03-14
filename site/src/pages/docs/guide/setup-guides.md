---
layout: ../../../layouts/DocLayout.astro
title: Setup Guides
---

# Setup Guides

Every integration and dependency in a build can reference a machine-readable setup guide that any AI agent can follow.

## What Are Setup Guides?

Setup guides are structured markdown files that explain how to install and configure integrations. They follow a predictable format so AI agents can parse and execute them programmatically.

**Skills have SKILL.md. Integrations have setup guides.**

## How They Work

### For Creators (Export/Publish)

When exporting, ClawClawGo:

1. For each integration, checks if `setupGuideUrl` resolves (HTTP HEAD, 5s timeout)
2. For integrations without a guide URL, checks the default registry (`docs.openclaw.ai/guides/{provider}.md`)
3. If a guide exists at the default location, auto-populates `setupGuideUrl`
4. If no guide exists anywhere: **Warning** (not blocking)

Missing guides degrade the experience but don't break it. The build still exports.

### For Appliers (Apply)

When applying, the agent:

1. Reads `setupGuideUrl` from each integration
2. Fetches the guide content (GET, markdown)
3. Presents it to the user or follows it programmatically (agent's choice)
4. Falls back to `docsUrl` if `setupGuideUrl` fetch fails
5. Falls back to "manual setup required" if both fail

**The applier always fetches fresh.** Guides may have been updated since the build was published.

## Guide Format (SETUP.md)

Guides follow a structured markdown format:

```markdown
# BlueBubbles Setup Guide

## Overview
What this integration does and why you'd want it.

## Prerequisites
- macOS host machine
- iPhone with iMessage
- BlueBubbles server app installed on Mac

## Install Steps
1. Download BlueBubbles from https://bluebubbles.app
2. Install and run the .dmg
3. Sign in with your Apple ID
4. Enable the Private API (Settings > Features > Private API)
5. Note the server URL and password from the status page

## OpenClaw Configuration
Add to your openclaw.json:
```json
{
  "channels": {
    "bluebubbles": {
      "url": "http://localhost:1234",
      "password": "<your-password>"
    }
  }
}
```

## Verify
Run `openclaw status` and confirm BlueBubbles shows as connected.

## Troubleshooting
- If connection fails, check that BlueBubbles server is running
- Ensure firewall allows the configured port
```

**Key conventions:**

- `## Prerequisites` lists what's needed before starting
- `## Install Steps` is the ordered procedure
- `## OpenClaw Configuration` shows what config changes are needed
- `## Verify` explains how to confirm it works
- `## Troubleshooting` covers common issues
- Code blocks use language tags for parseability

## Schema Changes

### IntegrationItem gets `setupGuideUrl`

```json
{
  "type": "channel",
  "name": "iMessage via BlueBubbles",
  "provider": "bluebubbles",
  "autoApply": false,
  "docsUrl": "https://docs.openclaw.ai/integrations/bluebubbles",
  "setupGuideUrl": "https://docs.openclaw.ai/guides/bluebubbles.md"
}
```

| Field | Description |
|-------|-------------|
| `docsUrl` | Link to setup docs (human-readable) |
| `setupGuideUrl` | Machine-readable setup guide URL (fetched by applying agent) |

### DependenciesBlock gets guide references

```json
{
  "dependencies": {
    "bins": ["caldir", "himalaya"],
    "guides": {
      "bluebubbles": "https://docs.openclaw.ai/guides/bluebubbles.md",
      "caldir": "https://docs.openclaw.ai/guides/caldir.md"
    }
  }
}
```

Setup guides keyed by provider or tool name.

## Known Provider Registry

ClawClawGo has hardcoded mappings for common integrations. If no explicit `setupGuideUrl` is set, it checks these default locations:

| Provider | Guide URL |
|----------|-----------|
| `bluebubbles` | https://docs.openclaw.ai/guides/bluebubbles.md |
| `telegram` | https://docs.openclaw.ai/guides/telegram.md |
| `discord` | https://docs.openclaw.ai/guides/discord.md |
| `signal` | https://docs.openclaw.ai/guides/signal.md |
| `whatsapp` | https://docs.openclaw.ai/guides/whatsapp.md |
| `caldir` | https://docs.openclaw.ai/guides/caldir.md |
| `himalaya` | https://docs.openclaw.ai/guides/himalaya.md |
| `home-assistant` | https://docs.openclaw.ai/guides/home-assistant.md |
| `kokoro-onnx` | https://docs.openclaw.ai/guides/kokoro-onnx.md |
| `whisper` | https://docs.openclaw.ai/guides/whisper.md |
| `peekaboo` | https://docs.openclaw.ai/guides/peekaboo.md |

::: info
These URLs are planned defaults. The CLI handles 404s gracefully — missing guides don't block apply.
:::

## Trust and Safety

- Guide URLs must be HTTPS (no HTTP, no file://, no data:)
- Guide content is plain markdown (no executable code, no scripts)
- The security scanner checks guide URLs against known-safe domains
- Unknown domains get an info-level finding: "Setup guide from external domain: example.com"
- Guides are fetched read-only. The applying agent decides what to do with the content.

## CLI Commands

### Validate Guides

Check that all integrations have resolvable guides:

```bash
clawclawgo validate my-build.json
```

### Preview Guides

See what an applier would see:

```bash
clawclawgo preview my-build.json
```

Now shows setup guide availability per integration.

### Scan Includes Guide Safety

```bash
clawclawgo scan my-build.json
```

Includes guide URL safety check in the security report.

## What This Doesn't Cover

- Hosting the actual guide content (that's on docs.openclaw.ai or community)
- Auto-executing setup steps (always user or agent decision)
- Guide authoring tools (just write markdown)
- Guide versioning (URL is the version, fetch fresh)
