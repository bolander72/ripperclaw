# RipperClaw

Cyberware manager for AI agents. Export, compare, and share your agent's loadout.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri v2](https://img.shields.io/badge/tauri-v2-orange.svg)
![Nostr](https://img.shields.io/badge/nostr-kind_38333-purple.svg)

## What is it?

Your AI agent is more than config files. It's a **rig** — a collection of models, skills, memory systems, voice pipelines, integrations, and personality that work together. RipperClaw maps all of it to 9 cyberware slots and lets you export, compare, and share the whole thing as a **loadout**.

### The 9 Slots

| Slot | What It Maps To |
|---|---|
| **Soul** | Personality, identity, behavioral rules (SOUL.md, IDENTITY.md, USER.md) |
| **Brain** | Context engine, memory files, LCM/DAG compaction, daily notes |
| **Skeleton** | Model router — primary, sub-agent, local (Ollama), image models |
| **OS** | Base runtime (OpenClaw version, Node.js, platform) |
| **Heart** | Heartbeat tasks, cron jobs, scheduled automations |
| **Nervous System** | Channels, calendar, email, reminders, Home Assistant, paired nodes |
| **Mouth** | TTS output — Kokoro, Edge, voice loop |
| **Ears** | STT input — Whisper, real-time transcription |
| **Eyes** | Vision models, cameras (UniFi), screen capture (Peekaboo), paired device cameras |

## Desktop App

Built with Tauri v2 (React + Rust). Native, fast, ~8MB.

```bash
cd app
npm install
npm run tauri dev
```

### Features

- **Live slot visualization** — reads your OpenClaw config in real-time
- **Multiple loadouts** — save, name, and switch between configurations
- **Multi-agent** — switch between agents if you run more than one
- **The Feed** — browse and clone loadouts published on Nostr
- **Compare view** — side-by-side diff of any loadout against yours
- **PII scrubber** — strips 12+ pattern types (emails, keys, IPs, paths) before publishing
- **Publish flow** — review scrubbed output, sign with your Nostr keys, push to relays
- **Import/clone** — one click to apply someone else's loadout (with backup)

## The Feed

Share your rig on [Nostr](https://nostr.com/) using kind 38333 (parameterized replaceable events). Your loadout is JSON, signed with your keys, and published to relays. Update it anytime — the old version gets replaced.

**Three modes:**

| Mode | How It Works |
|---|---|
| **Offline** | Export/import `.loadout.json` files |
| **Connected** | Publish to relays, browse the Feed in-app |
| **Self-hosted** | Run your own relay as an OpenClaw plugin |

**Default relays:** relay.damus.io, nos.lol, relay.nostr.band

## CLI

```bash
npm install && npm run build

# Export your current loadout
npx ripperclaw export

# Diff against another loadout
npx ripperclaw diff other.loadout.json

# Inspect a loadout file
npx ripperclaw inspect loadout.json
```

## Starter Templates

| Template | Style | Use Case |
|---|---|---|
| **Homelab** | Self-hosted, privacy-first | Local models, own relay, minimal cloud |
| **Ops** | Lean productivity | Calendar, email, reminders, GitHub |
| **Researcher** | Deep analysis | Large context, web search, PDF analysis |
| **Smart Home** | Automation-focused | HA, cameras, sensors, routines |
| **Creator** | Content & social | Voice, TTS, social media, scheduling |

## Privacy & Security

The PII scrubber runs **locally** before any data leaves your machine:

- Phone numbers, email addresses, SSNs
- IP addresses (private + public ranges)
- API keys, bearer tokens, nostr secret keys
- Home directory paths, street addresses
- MAC addresses, hex private keys
- Sensitive config fields (channels, HA config, agent names)

You review the scrubbed output in a diff view before publishing.

## Architecture

```
ripperclaw/
├── src/              # CLI (TypeScript)
├── app/              # Desktop app (Tauri v2 + React)
│   ├── src/          # React frontend
│   │   ├── components/   # SlotCard, FeedView, CompareView, etc.
│   │   └── hooks/        # useTauri, useNostr
│   └── src-tauri/    # Rust backend
│       └── src/
│           ├── lib.rs    # OpenClaw data reading, slot detection
│           ├── nostr.rs  # Nostr protocol (keys, publish, subscribe)
│           └── scrub.rs  # PII scrubber (12 regex patterns)
├── site/             # Landing page (Vite + React)
├── plugin/           # OpenClaw relay plugin (ripperclaw-relay)
└── PLAN.md           # Full roadmap
```

## Roadmap

- [x] Phase 0: CLI export/diff/inspect
- [x] Phase 1: Tauri desktop app with cyberpunk UI
- [x] Phase 2: Live OpenClaw data (9 slots with sub-component detection)
- [x] Phase 3a: Feed + compare + loadout library views
- [x] Phase 3b: Nostr integration + PII scrubber + publish flow
- [x] Phase 3c: OpenClaw relay plugin
- [ ] Phase 3d: Social features (follows, zaps, comments)
- [ ] Phase 4: Bitcoin ordinals anchoring (inscribe loadout hash on-chain)

## Built With

- [Tauri v2](https://v2.tauri.app/) — native desktop runtime
- [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/) — frontend
- [nostr-sdk](https://github.com/rust-nostr/nostr) — Nostr protocol (Rust)
- [OpenClaw](https://openclaw.ai/) — the agent platform this is built for

## Contributing

PRs welcome. Issues triaged. The roadmap is public in [PLAN.md](PLAN.md).

## License

[MIT](LICENSE)
