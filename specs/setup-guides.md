# Setup Guide Resolution Spec

How ClawClawGo ensures every integration and dependency in a build comes with machine-readable instructions that any AI agent can follow.

## Problem

When someone applies a build with BlueBubbles or Home Assistant, their agent just sees a label and "manual setup required." There's no structured guide another AI agent can follow to actually set it up. Skills have SKILL.md. Integrations have nothing.

## Design

### The Reference Model (not inline)

Builds reference setup guides by URL rather than embedding them. This keeps builds small, avoids content going stale, and means guide authors can update independently.

### Guide Registry

Guides live at predictable URLs following a convention:

```
https://docs.openclaw.ai/guides/{provider}.md
https://clawhub.ai/guides/{provider}
```

Community-contributed guides can live at any URL. The build just stores the reference.

### Schema Changes

#### IntegrationItem gets `setupGuideUrl`

```typescript
export interface IntegrationItem {
  type: "channel" | "calendar" | "email" | "smart-home" | "code" | "voice" | "camera" | "other";
  name: string;
  provider: string;
  autoApply: false;
  docsUrl?: string;
  /** Machine-readable setup guide URL (fetched by applying agent) */
  setupGuideUrl?: string;
}
```

#### DependenciesBlock gets guide references

```typescript
export interface DependenciesBlock {
  bins?: string[];
  brew?: string[];
  pip?: string[];
  npm?: string[];
  models?: ModelRequirement[];
  config?: ConfigRequirement[];
  platform?: string[];
  minOpenclawVersion?: string;
  /** Setup guides keyed by provider/tool name */
  guides?: Record<string, string>;  // { "bluebubbles": "https://docs.openclaw.ai/guides/bluebubbles.md" }
}
```

### Guide Format (SETUP.md)

Guides follow a structured markdown format that agents can parse:

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

Key conventions:
- `## Prerequisites` lists what's needed before starting
- `## Install Steps` is the ordered procedure
- `## OpenClaw Configuration` shows what config changes are needed
- `## Verify` explains how to confirm it works
- `## Troubleshooting` covers common issues
- Code blocks use language tags for parseability

### Creator Flow (Export/Publish)

On export, the CLI:

1. For each integration, checks if `setupGuideUrl` resolves (HTTP HEAD, 5s timeout)
2. For integrations without a guide URL, checks the default registry (`docs.openclaw.ai/guides/{provider}.md`)
3. If a guide exists at the default location, auto-populates `setupGuideUrl`
4. If no guide exists anywhere:
   - **Warning** (not blocking): "Integration 'bluebubbles' has no setup guide. Applying users will need to figure it out manually."
   - The build still exports. Missing guides degrade the experience but don't break it.

For dependencies:
1. Each known provider mapping can include a guide URL
2. The `guides` field in dependencies is populated from: skill SETUP.md files, known registry URLs, and integration setupGuideUrls

### Applier Flow (Apply)

On apply, the agent:

1. Reads `setupGuideUrl` from each integration
2. Fetches the guide content (GET, markdown)
3. Presents it to the user or follows it programmatically (agent's choice)
4. Falls back to `docsUrl` if `setupGuideUrl` fetch fails
5. Falls back to "manual setup required" if both fail

The key insight: the applier always fetches fresh. Guides may have been updated since the build was published.

### Known Provider Registry

Hardcoded mappings for common integrations (fallback when no explicit URL is set):

```typescript
const KNOWN_GUIDES: Record<string, string> = {
  'bluebubbles': 'https://docs.openclaw.ai/guides/bluebubbles.md',
  'telegram': 'https://docs.openclaw.ai/guides/telegram.md',
  'discord': 'https://docs.openclaw.ai/guides/discord.md',
  'signal': 'https://docs.openclaw.ai/guides/signal.md',
  'whatsapp': 'https://docs.openclaw.ai/guides/whatsapp.md',
  'caldir': 'https://docs.openclaw.ai/guides/caldir.md',
  'himalaya': 'https://docs.openclaw.ai/guides/himalaya.md',
  'home-assistant': 'https://docs.openclaw.ai/guides/home-assistant.md',
  'kokoro-onnx': 'https://docs.openclaw.ai/guides/kokoro-onnx.md',
  'whisper': 'https://docs.openclaw.ai/guides/whisper.md',
  'peekaboo': 'https://docs.openclaw.ai/guides/peekaboo.md',
};
```

These don't need to exist yet. The registry grows over time. The CLI gracefully handles 404s.

### Trust and Safety

- Guide URLs must be HTTPS (no HTTP, no file://, no data:)
- Guide content is plain markdown (no executable code, no scripts)
- The security scanner checks guide URLs against known-safe domains
- Unknown domains get an info-level finding: "Setup guide from external domain: example.com"
- Guides are fetched read-only. The applying agent decides what to do with the content.

### CLI Commands

```bash
# Validate guides exist for all integrations
clawclawgo validate <build.json>

# Preview what an applier would see
clawclawgo preview <build.json>
# Now shows setup guide availability per integration

# Scan includes guide URL safety check
clawclawgo scan <build.json>
```

### What This Doesn't Cover

- Hosting the actual guide content (that's on docs.openclaw.ai or community)
- Auto-executing setup steps (always user/agent decision)
- Guide authoring tools (just write markdown)
- Guide versioning (URL is the version -- fetch fresh)
