---
layout: ../../../layouts/DocLayout.astro
title: Publishing
---

# Publishing to GitHub

Share your build with the community by publishing it as a GitHub repository.

## Why GitHub?

- **Familiar workflow**: standard Git/GitHub workflow developers already know
- **Discoverability**: builds are indexed via GitHub's topic system
- **Trust signals**: stars, forks, contributor count, and repo age provide natural trust indicators
- **Version control**: full Git history for your build evolution
- **No special accounts**: if you have GitHub, you're ready to publish

## Publishing Flow

1. **Export your build**  
   Click **Publish** or run `npx clawclawgo export --out build.json`

2. **Review sections**  
   Choose which parts of your config to include. The security scanner highlights sensitive data (emails, API keys, IP addresses).

3. **Add metadata**  
   - Build name and description
   - Tags for discoverability
   - Compatibility (which agents can use this: OpenClaw, Claude Code, Cursor, etc.)
   - Declared permissions (filesystem, web-search, email, etc.)

4. **Get your build.json**  
   Download or copy the generated JSON file

5. **Create a GitHub repo**  
   Make it public so others can discover it

6. **Add build.json to repo root**  
   Commit the file

7. **Tag your repo**  
   Add the `clawclawgo-build` topic to your repository:
   - Go to repo settings → Topics
   - Add: `clawclawgo-build`

8. **Your build appears in the feed**  
   The aggregator indexes GitHub repos with the `clawclawgo-build` topic. Your build will show up within 24 hours.

## PII Scrubbing

Before publishing, ClawClawGo automatically scans for personally identifiable information:

**Warnings shown for:**
- Phone numbers
- Email addresses
- Physical addresses
- API keys and tokens
- Bearer tokens
- IP addresses

**Never include these in your build.json:**
- USER.md content
- Memory content (facts, handoffs, daily notes)
- Chat history or conversations
- Integration credentials (tokens, passwords, API keys)
- Personal calendar events or contact information

Review the security scan results and exclude any sections with warnings before generating your build.json.

## Build Schema (v4)

```json
{
  "schema": 4,
  "meta": {
    "name": "My Agent Build",
    "description": "A productivity-focused AI assistant",
    "tags": ["productivity", "coding"],
    "compatibility": ["openclaw", "claude-code", "cursor"],
    "permissions": ["filesystem", "web-search"],
    "source": "github",
    "repoUrl": "https://github.com/user/my-build"
  },
  "model": { ... },
  "persona": { ... },
  "skills": { ... },
  "integrations": { ... },
  "automations": { ... }
}
```

See the [Schema Reference](/docs/reference/schema) for the full spec.

## Trust Tiers

Builds are assigned trust tiers based on GitHub signals:

- **Verified**: repos with 100+ stars, active contributors, established history
- **Community**: repos with some activity and stars
- **Unreviewed**: new repos or those with little activity

These are hints, not guarantees. Always review builds before applying them.

## Permissions

Declare which tools/capabilities your build uses:

- `filesystem` — Read, Write, Edit files
- `web-search` — Brave Search, web research
- `email` — Email reading/sending
- `calendar` — Calendar access
- `smart-home` — Home Assistant, HomeKit
- `message` — iMessage, Telegram, Discord
- `exec` — Shell command execution
- `browser` — Browser automation

The security scanner compares declared permissions against detected tool usage and warns if permissions are missing.

## Compatibility

List which AI agents can use your build:

- `openclaw`
- `claude-code`
- `cursor`
- `windsurf`
- `codex`
- `pi`
- `opencode`

This helps users find builds that work with their tools.

## CLI Publishing

```bash
# Export from OpenClaw config
npx clawclawgo export --agent main --out build.json

# Preview before publishing
npx clawclawgo preview build.json

# Security scan
npx clawclawgo scan build.json
```

See the [CLI Reference](/docs/reference/cli) for full usage.
