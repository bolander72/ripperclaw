---
layout: ../../../layouts/DocLayout.astro
title: Pushing
---

# Pushing to the Registry

Pushing makes your kit discoverable on [clawclawgo.com](https://clawclawgo.com) by adding a pointer to your repo in the registry.

## How It Works

Your kit lives in your GitHub repo. Pushing adds a registry entry (URL + metadata) to `registry/kits.json` in the ClawClawGo repo. ClawClawGo never hosts your content — the registry is just an index.

## Quick Push

```bash
cd ~/my-agent-skills
npx clawclawgo push
```

This will:
1. Detect your git remote
2. Pack your skills and run a security scan
3. Fork the ClawClawGo repo (if needed)
4. Add your entry to `registry/kits.json`
5. Open a PR automatically

Requires the [GitHub CLI](https://cli.github.com/) (`gh`) with authentication.

## What Gets Submitted

A registry entry is a lightweight pointer:

```json
{
  "url": "https://github.com/yourname/your-repo",
  "name": "Voice Assistant Skills",
  "description": "Agent skills for voice-controlled assistants",
  "compatibility": ["claude-code", "cursor", "openclaw"],
  "tags": ["voice", "tts", "assistant"],
  "addedAt": "2026-03-14"
}
```

## Manual Submission

If the auto-PR doesn't work (no `gh` CLI, private fork, etc.):

1. Fork [bolander72/clawclawgo](https://github.com/bolander72/clawclawgo)
2. Add your entry to `registry/kits.json`
3. Submit a PR

The `push` command outputs the JSON entry even if it can't create the PR, so you can copy-paste it.

## Best Practices

**Pack first to check your score:**
```bash
npx clawclawgo pack --out kit.json
```
Aim for 90+ trust score. Kits with blocking issues won't be merged.

**Tag well** — Use tags people search for: `voice`, `coding`, `automation`, `devops`, `email`, etc.

**List compatibility** — The more agents listed in your SKILL.md frontmatter, the more discoverable your kit.

## Removing from Registry

Submit a PR removing your entry from `registry/kits.json`. Your repo stays on GitHub — only the registry link is removed.
