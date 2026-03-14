# ClawClawGo

**Multi-source aggregator and marketplace for AI agent builds.**

GitHub-based publishing with trust scoring. Open source. Think registry + curator for AI agent configurations.

**[clawclawgo.com](https://clawclawgo.com)**

![v0.2.2](https://img.shields.io/badge/version-0.2.2-green.svg)
![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub](https://img.shields.io/badge/source-github-blue.svg)

## What is it?

ClawClawGo is a multi-source aggregator and marketplace for complete AI agent configurations: **builds**. Find agent setups by capability, use case, or creator. Builds are published as GitHub repos, indexed from ClawHub, or sourced from skills.sh.

Your AI agent is more than config files. It's a combination of models, skills, integrations, personality, memory, and automations that work together. ClawClawGo lets you search for existing builds, explore how they're configured, copy what works, and publish your own.

## Build Sources

ClawClawGo aggregates builds from multiple sources:

- **GitHub** — Repos tagged with `clawclawgo-build` topic (primary source)
- **ClawHub** — OpenClaw skill registry (skills.openclaw.com)
- **skills.sh** — Vercel skill directory (skills.sh)

Trust tiers are assigned based on signals:
- **Verified**: 100+ stars, active contributors, established history
- **Community**: Some activity and stars
- **Unreviewed**: New or low-activity repos

### Build Schema (v4)

Every build contains configuration for 6 core areas. The schema is defined in `specs/build.schema.json` with validation on import.

| Section | What It Maps To |
|---|---|
| **Model** | LLM routing: primary, sub-agent, local (Ollama), image models with tier support |
| **Persona** | Personality, identity, behavioral rules (SOUL.md, IDENTITY.md, USER.md) |
| **Skills** | Installed skill packages from ClawHub, local, bundled, or custom sources |
| **Integrations** | Channels, calendar, email, smart home, cameras, GitHub, with setup guide URLs |
| **Automations** | Heartbeat tasks, cron jobs, scheduled routines |
| **Memory** | Context engine, LCM config, memory files, daily notes |

**New in v4:**
- `permissions` field — declare which tools your build uses (filesystem, web-search, email, etc.)
- `compatibility` field — list which agents can use this build (openclaw, claude-code, cursor, etc.)
- GitHub metadata: `source`, `repoUrl`, `stars`, `forks`, `trustTier`

## Security Scanner

Every build gets scanned before apply. Five passes:

1. **PII detection** - phone numbers, emails, API keys, addresses, paths
2. **Prompt injection** - system prompt overrides, jailbreak patterns in persona files
3. **Automation safety** - destructive shell commands, credential access in heartbeats/crons
4. **Skill verification** - ClawHub moderation status via VirusTotal Code Insight (queries isMalwareBlocked / isSuspicious per skill)
5. **Network/exfiltration** - curl/wget in personas, hardcoded IPs, data piping patterns
6. **Permission checking** - compares declared permissions against detected tool usage

Each build gets a trust score (0-100) and a badge: Verified (80+), Community (50+), Unreviewed (20+), Suspicious (<20).

## Dependency Resolution

Builds declare what they need. On apply, ClawClawGo checks your system and reports what's missing:

- **System binaries** (brew, pip, npm packages)
- **Models** (Ollama, provider-hosted)
- **Config requirements** (API keys, env vars)
- **Platform** (macOS, Linux) and minimum OpenClaw version
- **Setup guides** - integrations link to external setup docs; URLs validated at publish, fetched at apply

Skip checks with `--skip-deps`. See `specs/dependencies.md` for the full spec.

## Apply Flow

Apply a build to create a new agent or configure an existing one:

1. **Select build**: from the Feed, a file, URL, or stdin
2. **Choose target**: pick an agent ID and name
3. **Review**: full preview with warnings and options
4. **Apply**: workspace created, skills installed, config wired up

Safety rules:
- Never overwrites an existing agent workspace
- Protects your default agent when adding to `agents.list`
- Credentials and integrations are never copied: always manual setup
- Automatic backup of config before changes
- `--use-my-models` remaps build models to your existing tiers

## CLI

Install globally or run with npx:

```bash
npm install -g clawclawgo
# or just use npx (no install)
npx clawclawgo <command>
```

### Commands

```bash
# Export your current build
npx clawclawgo export --agent main --out build.json

# Preview a build (shows security scan + dependency report)
npx clawclawgo preview build.json

# Scan a build for security issues
npx clawclawgo scan build.json

# Apply a build to create a new agent
npx clawclawgo apply build.json --agent my-bot

# Apply from URL
npx clawclawgo apply https://raw.githubusercontent.com/user/build/main/build.json --agent my-bot

# Dry run (no changes)
npx clawclawgo apply build.json --agent my-bot --dry-run

# Use your own models instead of the build's
npx clawclawgo apply build.json --agent my-bot --use-my-models

# Skip dependency checks or security scanning
npx clawclawgo apply build.json --agent my-bot --skip-deps --skip-security
```

## Publishing

### 1. Export your build

```bash
npx clawclawgo export --agent main --out build.json
```

### 2. Review and scan

```bash
npx clawclawgo preview build.json
npx clawclawgo scan build.json
```

### 3. Create a GitHub repo

Make it public for discoverability.

### 4. Add build.json to repo root

Commit the file.

### 5. Tag your repo

Add the `clawclawgo-build` topic to your repository:
- Go to repo settings → Topics
- Add: `clawclawgo-build`

### 6. Your build appears in the feed

The aggregator indexes GitHub repos with the `clawclawgo-build` topic. Builds appear within 24 hours.

## Development

```bash
# Install dependencies
npm install
cd site && npm install

# Dev server (site)
cd site && npm run dev

# Build site
cd site && npm run build

# Test CLI
./cli/clawclawgo.mjs --help
```

## Stack

- **Site**: Astro + React + Tailwind CSS v4
- **CLI**: Node.js (ESM)
- **Aggregator**: GitHub API (topic search), ClawHub API, skills.sh API
- **Schema**: JSON Schema with Ajv validation

## License

MIT — see LICENSE
