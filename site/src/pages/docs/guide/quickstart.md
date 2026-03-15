---
layout: ../../../layouts/DocLayout.astro
title: Quickstart
---

# Quickstart

Get started with ClawClawGo in 3 steps.

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

## 2. Pack Your Own Kit

Create a directory with your agent skills and configs:

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

Pack it:

```bash
cd my-agent-skills
npx clawclawgo pack --out kit.json
```

This generates `kit.json` with your skills, detected configs, and security scan baked in. Sensitive files (SOUL.md, MEMORY.md, USER.md, memory/) are automatically excluded.

## 3. Push to Registry

To share your kit on [clawclawgo.com](https://clawclawgo.com):

```bash
# Push to GitHub first
git init && git add . && git commit -m "Initial kit"
git remote add origin https://github.com/yourname/my-skills.git
git push -u origin main

# Push to registry (auto-creates PR)
npx clawclawgo push
```

## All Commands

```bash
npx clawclawgo pack [dir] [--out file]         # Pack your skills into a kit
npx clawclawgo push [dir]                      # Push your kit to the registry
npx clawclawgo add <owner/repo> [--dest dir]   # Add a kit from GitHub
```

## Next Steps

- **[Explore kits](https://clawclawgo.com/explore)** on the web app
- **[Create your own skills](/docs/kits/creating)** and package them
- **[Learn about security](/docs/guide/security)** and trust scores
