---
layout: ../../../layouts/DocLayout.astro
title: Quickstart
---

# Quickstart

Get started with ClawClawGo in 2 steps.

## Run

No install required — use `npx`:

```bash
npx clawclawgo
```

## 1. Add a Kit

Find a kit on [clawclawgo.com](https://clawclawgo.com/explore) or grab one directly:

```bash
npx clawclawgo add garrytan/gstack
```

This clones the repo, finds all SKILL.md files, runs a security scan, and generates a `CLAWCLAWGO.md` explaining what's inside.

## 2. Push Your Own Kit

Create a directory with your agent skills and push it:

```
my-agent-skills/
├── skills/
│   ├── voice-assistant/
│   │   └── SKILL.md
│   └── home-automation/
│       └── SKILL.md
├── .cursorrules
└── CLAUDE.md
```

```bash
# Push to GitHub first
cd my-agent-skills
git init && git add . && git commit -m "Initial kit"
git remote add origin https://github.com/yourname/my-skills.git
git push -u origin main

# Push to the ClawClawGo registry
npx clawclawgo push
```

The `push` command scans your repo, builds kit metadata internally, validates it, and auto-creates a registry PR. No intermediate files are generated — sensitive files never leave your machine.

## All Commands

```bash
npx clawclawgo push [dir]                      # Push your kit to the registry
npx clawclawgo add <owner/repo> [--dest dir]   # Add a kit from GitHub
```

## Next Steps

- **[Explore kits](https://clawclawgo.com/explore)** on the web app
- **[Create your own skills](/docs/kits/creating)** and push them
- **[Learn about security](/docs/guide/security)** and trust scores
