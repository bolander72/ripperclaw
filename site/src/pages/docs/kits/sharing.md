---
layout: ../../../layouts/DocLayout.astro
title: Sharing
---

# Sharing Kits

## Push to GitHub

Your skills and configs live in a GitHub repo — that's the kit.

1. Organize your skills in a directory with `SKILL.md` files
2. Push to GitHub
3. Run `npx clawclawgo push` to submit a registry entry

Others find your kit on [clawclawgo.com](https://clawclawgo.com) and add it:

```bash
npx clawclawgo add yourname/your-repo
```

See the [Pushing guide](/docs/guide/pushing) for full details.

## Submit to the Registry

The ClawClawGo registry at `registry/kits.json` is a lightweight URL index. Submitting adds a pointer to your repo — ClawClawGo never hosts your content.

```bash
npx clawclawgo push
```

This packs your skills, runs a security scan, then auto-creates a PR to add your entry (requires `gh` CLI).

## What Gets Shared

Your GitHub repo is the kit. When someone runs `clawclawgo add`, they get a clone with:

- Skill directories with `SKILL.md` files
- Agent config files (`.cursorrules`, `CLAUDE.md`, etc.)
- A generated `CLAWCLAWGO.md` describing the kit

The `add` command runs a security scan so the user sees a trust report before using anything.
