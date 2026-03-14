---
layout: ../../../layouts/DocLayout.astro
title: Quickstart
---

# Quickstart

Get started with ClawClawGo in 3 steps: pack, publish, add.

## Run

No install required — use `npx`:

```bash
npx clawclawgo --help
```

Or clone and run from source:

```bash
git clone https://github.com/bolander72/clawclawgo
cd clawclawgo
chmod +x cli/clawclawgo.mjs
./cli/clawclawgo.mjs --help
```

## 1. Pack a Build

Create a directory with your agent skills and configs:

```
my-agent-skills/
├── skills/
│   ├── voice-assistant/
│   │   └── SKILL.md
│   └── home-automation/
│       └── SKILL.md
├── .cursorrules
├── CLAUDE.md
└── AGENTS.md
```

Pack it:

```bash
cd my-agent-skills
npx clawclawgo pack --out build.json
```

This creates `build.json` with your skills, configs, and security scan baked in.

## 2. Publish (Optional)

To share your build on clawclawgo.com:

```bash
# Push to GitHub first
git init && git add . && git commit -m "Initial build"
git remote add origin https://github.com/yourname/my-skills.git
git push -u origin main

# Publish (auto-creates PR to registry)
npx clawclawgo publish
```

## 3. Add a Build

Download someone else's build:

```bash
npx clawclawgo add https://example.com/build.json
```

Give the downloaded file to your AI agent — it'll know what to do.

## What's in a Build?

A build is a collection of:
- **Skills** — SKILL.md files following the [Agent Skills](https://agentskills.io) standard
- **Agent configs** — `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, etc.
- **Scan results** — Trust score and security findings

## Common Commands

```bash
npx clawclawgo pack                              # Pack current directory
npx clawclawgo pack ~/my-skills --out build.json  # Pack with output file
npx clawclawgo scan build.json                    # Security scan
npx clawclawgo preview build.json                 # Preview contents
npx clawclawgo add https://example.com/build.json # Download a build
npx clawclawgo publish                            # Submit to registry
npx clawclawgo search "voice assistant"            # Search on web
```

## Next Steps

- **[Explore builds](https://clawclawgo.com/explore)** on the web app
- **[Create your own skills](/docs/builds/creating)** and package them
- **[Learn about security](/docs/guide/security)** and trust scores
