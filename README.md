# ClawClawGo

**Search engine, explorer, and marketplace for AI agent builds.**

Privacy-first. Decentralized. Open source. Think DuckDuckGo for OpenClaw configurations.

**[clawclawgo.com](https://clawclawgo.com)**

![v0.2.2](https://img.shields.io/badge/version-0.2.2-green.svg)
![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri v2](https://img.shields.io/badge/tauri-v2-orange.svg)
![Nostr](https://img.shields.io/badge/nostr-kind_38333-purple.svg)

## What is it?

ClawClawGo is a search engine and marketplace for complete AI agent configurations: **builds**. Find agent setups by capability, use case, or creator. No tracking. No accounts required. Publish anonymously or with verified identity via Nostr keys.

Your AI agent is more than config files. It's a combination of models, skills, integrations, personality, memory, and automations that work together. ClawClawGo lets you search for existing builds, explore how they're configured, copy what works, and publish your own.

### Build Sections (Schema v3)

Every build contains configuration for 6 core areas. The schema is defined in `specs/build.schema.json` with validation on import.

| Section | What It Maps To |
|---|---|
| **Model** | LLM routing: primary, sub-agent, local (Ollama), image models with tier support |
| **Persona** | Personality, identity, behavioral rules (SOUL.md, IDENTITY.md, USER.md) |
| **Skills** | Installed skill packages from ClawHub, local, bundled, or custom sources |
| **Integrations** | Channels, calendar, email, smart home, cameras, GitHub, with setup guide URLs |
| **Automations** | Heartbeat tasks, cron jobs, scheduled routines |
| **Memory** | Context engine, LCM config, memory files, daily notes |

## Security Scanner

Every build gets scanned before apply. Five passes:

1. **PII detection** - phone numbers, emails, API keys, addresses, paths
2. **Prompt injection** - system prompt overrides, jailbreak patterns in persona files
3. **Automation safety** - destructive shell commands, credential access in heartbeats/crons
4. **Skill verification** - ClawHub moderation status via VirusTotal Code Insight (queries isMalwareBlocked / isSuspicious per skill)
5. **Network/exfiltration** - curl/wget in personas, hardcoded IPs, data piping patterns

Each build gets a trust score (0-100) and a badge: Verified (80+), Community (50+), Unreviewed (20+), Suspicious (<20).

## Dependency Resolution

Builds declare what they need. On apply, ClawClawGo checks your system and reports what's missing:

- **System binaries** (brew, pip, npm packages)
- **Models** (Ollama, provider-hosted)
- **Config requirements** (API keys, env vars)
- **Platform** (macOS, Linux) and minimum OpenClaw version
- **Setup guides** - integrations link to external setup docs; URLs validated at publish, fetched at apply

Skip checks with `--skip-deps`. See `specs/dependencies.md` for the full spec.

## Desktop App

Built with Tauri v2 (React + Rust). Native, fast, ~8MB.

```bash
cd app
npm install
npm run tauri dev
```

### Features

- **Live config visualization**: reads your OpenClaw config in real-time
- **Multi-agent support**: switch between agents if you run more than one
- **The Feed**: browse and clone builds published on Nostr
- **Compare view**: side-by-side diff of any build against yours
- **Apply wizard**: step-by-step review with security scan, dependency check, and setup guides
- **Security scanning**: trust score and badge shown before you apply anything
- **PII scrubber**: strips 12+ pattern types before publishing
- **Publish flow**: review scrubbed output, sign with Nostr keys, push to relays

### Opening Unsigned Builds

The app is not code-signed. Your OS will show security warnings on first launch.

**macOS:**
```bash
xattr -cr /Applications/ClawClawGo.app
```
Or right-click the app → Open → confirm the security prompt.

**Windows:**
When Windows SmartScreen shows "Windows protected your PC", click "More info" then "Run anyway". Or right-click the .exe → Properties → check "Unblock" → Apply.

**Linux:**
Make the AppImage executable:
```bash
chmod +x ClawClawGo_*.AppImage
./ClawClawGo_*.AppImage
```
No signing workarounds needed on Linux.

## Apply Flow

Apply a build to create a new agent or configure an existing one:

1. **Select build**: from the Feed, a file, or a saved build
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

```bash
# Export your current build
node cli/clawclawgo.mjs export

# Preview a build (shows security scan + dependency report)
node cli/clawclawgo.mjs preview build.json

# Scan a build for security issues
node cli/clawclawgo.mjs scan build.json

# Apply a build to create a new agent
node cli/clawclawgo.mjs apply build.json --agent my-bot --name "My Bot"

# Dry run (no changes)
node cli/clawclawgo.mjs apply build.json --agent my-bot --dry-run

# Use your own models instead of the build's
node cli/clawclawgo.mjs apply build.json --agent my-bot --use-my-models

# Skip dependency checks or security scanning
node cli/clawclawgo.mjs apply build.json --agent my-bot --skip-deps --skip-security
```

## The Feed

Share your build on [Nostr](https://nostr.com/) using kind 38333. Your build is JSON, signed with your keys, and published to relays. Update it anytime and the old version gets replaced.

| Mode | How It Works |
|---|---|
| **Offline** | Export/import `.json` files |
| **Connected** | Publish to relays, browse the Feed in-app |
| **Self-hosted** | Run your own relay as an OpenClaw plugin |

## Landing Page

The site at [clawclawgo.com](https://clawclawgo.com) is built with Vite + React and deployed via GitHub Pages. Source is in `site/`.

## Privacy & Security

Two layers: the PII scrubber protects publishers, and the security scanner protects consumers.

**PII scrubber** (runs locally before any data leaves your machine):
- Phone numbers, email addresses, SSNs
- IP addresses, API keys, bearer tokens, Nostr secret keys
- Home directory paths, street addresses
- MAC addresses, hex private keys
- Sensitive config fields (channels, HA config, agent names)

You review the scrubbed output in a diff view before publishing.

**Security scanner** (runs on every import/apply):
- 5-pass analysis covering PII leaks, prompt injection, automation safety, skill provenance, and network exfiltration
- ClawHub skills are checked against VirusTotal Code Insight moderation (isMalwareBlocked / isSuspicious)
- Trust score 0-100 with badges (Verified, Community, Unreviewed, Suspicious)
- Blocks malware-flagged skills automatically; warns on suspicious ones

## Architecture

```
clawclawgo/
├── cli/              # CLI tool (clawclawgo.mjs)
├── src/
│   ├── schema/       # Build type definitions (build.ts)
│   ├── security.ts   # 5-pass security scanner + ClawHub integration
│   ├── dependencies.ts # Dependency resolution engine
│   ├── export.ts     # Build export with dep detection
│   ├── validate.ts   # Ajv schema validation
│   ├── diff.ts       # Build comparison
│   └── display.ts    # Terminal formatting
├── app/              # Desktop app (Tauri v2 + React)
│   ├── src/          # React frontend
│   │   ├── components/   # BlockCard, FeedView, CompareView, ApplyWizard
│   │   └── hooks/        # useTauri, useNostr
│   └── src-tauri/    # Rust backend
│       └── src/
│           ├── lib.rs    # OpenClaw data reading, config parsing, apply
│           ├── nostr.rs  # Nostr protocol (keys, publish, subscribe)
│           └── scrub.rs  # PII scrubber
├── specs/            # Schema (build.schema.json), security, dependencies, setup guides
├── site/             # Landing page (clawclawgo.com)
├── docs/             # Full documentation (VitePress, served at /docs)
├── plugin/           # OpenClaw relay plugin (clawclawgo-relay)
└── PLAN.md           # Roadmap
```

## Built With

- [Tauri v2](https://v2.tauri.app/): native desktop runtime
- [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/): frontend
- [nostr-sdk](https://github.com/rust-nostr/nostr): Nostr protocol (Rust)
- [OpenClaw](https://openclaw.ai/): the agent platform this is built for

## License

[MIT](LICENSE)
