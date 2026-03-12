# ClawClawGo

Modular builds for AI agents. Build, share, and remix how your agent is configured.

**[clawclawgo.com](https://clawclawgo.com)**

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri v2](https://img.shields.io/badge/tauri-v2-orange.svg)
![Nostr](https://img.shields.io/badge/nostr-kind_38333-purple.svg)

## What is it?

Your AI agent is more than config files. It's a combination of models, skills, integrations, personality, memory, and automations that work together. ClawClawGo lets you package all of that as a **build**. Then export it, share it, or apply someone else's to a new agent.

### The 6 Blocks

| Block | What It Maps To |
|---|---|
| **Model** | LLM routing: primary, sub-agent, local (Ollama), image models |
| **Persona** | Personality, identity, behavioral rules (SOUL.md, IDENTITY.md, USER.md) |
| **Skills** | Installed skill packages: voice, vision, tools, workflows |
| **Integrations** | Channels, calendar, email, smart home, cameras, GitHub |
| **Automations** | Heartbeat tasks, cron jobs, scheduled routines |
| **Memory** | Context engine, LCM, memory files, daily notes |

## Desktop App

Built with Tauri v2 (React + Rust). Native, fast, ~8MB.

```bash
cd app
npm install
npm run tauri dev
```

### Features

- **Live block visualization**: reads your OpenClaw config in real-time
- **Multi-agent support**: switch between agents if you run more than one
- **The Feed**: browse and clone builds published on Nostr
- **Compare view**: side-by-side diff of any build against yours
- **Apply wizard**: block-by-block review with safety guards, model remapping, and skill installs
- **PII scrubber**: strips 12+ pattern types before publishing
- **Publish flow**: review scrubbed output, sign with Nostr keys, push to relays

## Apply Flow

Apply a build to create a new agent or configure an existing one:

1. **Select build**: from the Feed, a file, or a saved build
2. **Choose target**: pick an agent ID and name
3. **Review blocks**: block-by-block preview with warnings and options
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

# Preview what applying would do
node cli/clawclawgo.mjs apply build.json --agent my-bot --dry-run

# Apply a build to create a new agent
node cli/clawclawgo.mjs apply build.json --agent my-bot --name "My Bot"

# Use your own models instead of the build's
node cli/clawclawgo.mjs apply build.json --agent my-bot --use-my-models
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

The PII scrubber runs locally before any data leaves your machine:

- Phone numbers, email addresses, SSNs
- IP addresses, API keys, bearer tokens, nostr secret keys
- Home directory paths, street addresses
- MAC addresses, hex private keys
- Sensitive config fields (channels, HA config, agent names)

You review the scrubbed output in a diff view before publishing.

## Architecture

```
clawclawgo/
├── cli/              # CLI tool (clawclawgo.mjs)
├── app/              # Desktop app (Tauri v2 + React)
│   ├── src/          # React frontend
│   │   ├── components/   # BlockCard, FeedView, CompareView, ApplyWizard
│   │   └── hooks/        # useTauri, useNostr
│   └── src-tauri/    # Rust backend
│       └── src/
│           ├── lib.rs    # OpenClaw data reading, block detection, apply
│           ├── nostr.rs  # Nostr protocol (keys, publish, subscribe)
│           └── scrub.rs  # PII scrubber
├── site/             # Landing page (clawclawgo.com)
├── specs/            # Build schema and spec
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
