---
layout: ../../../layouts/DocLayout.astro
title: Publishing
---

# Publishing

Publishing makes your kit discoverable on clawclawgo.com by adding a pointer to your repo in the registry.

## How It Works

Your kit lives in your GitHub repo. Publishing adds a registry entry (URL + metadata) to `registry/kits.json` in the ClawClawGo repo. ClawClawGo never hosts your content — the registry is just an index.

## Quick Publish

```bash
cd ~/my-agent-skills
npx clawclawgo publish
```

This will:
1. Pack your skills and run a security scan
2. Fork the ClawClawGo repo (if needed)
3. Add your entry to `registry/kits.json`
4. Open a PR automatically

Requires the [GitHub CLI](https://cli.github.com/) (`gh`) with authentication.

## What Gets Submitted

A registry entry is a lightweight pointer:

```json
{
  "url": "https://github.com/yourname/your-repo",
  "name": "Voice Assistant Skills",
  "description": "Agent skills from voice-assistant-skills",
  "compatibility": ["claude-code", "cursor", "openclaw"],
  "tags": ["voice", "tts", "assistant"],
  "addedAt": "2026-03-14"
}
```

## Step-by-Step (Manual)

If the auto-PR doesn't work, you can submit manually:

### 1. Pack Your Kit

```bash
npx clawclawgo pack --out kit.json
```

### 2. Push to GitHub

```bash
git add kit.json
git commit -m "Add kit.json"
git push
```

### 3. Submit a PR

1. Fork [bolander72/clawclawgo](https://github.com/bolander72/clawclawgo)
2. Add your entry to `registry/kits.json`
3. Submit a PR

Once merged, your kit appears on clawclawgo.com.

## Best Practices

**Scan before publishing**
```bash
npx clawclawgo scan kit.json
```
Aim for 90+ trust score. Kits with blocking issues won't be merged.

**Tag well** — Use tags people search for: `voice`, `coding`, `automation`, `devops`, `email`, etc.

**List compatibility** — The more agents listed, the more discoverable your kit.

**Keep it updated** — When you add skills, re-run `clawclawgo pack` and push. Users re-download with `clawclawgo add`.

## Unpublishing

Submit a PR removing your entry from `registry/kits.json`. Your repo stays on GitHub — only the registry link is removed.
