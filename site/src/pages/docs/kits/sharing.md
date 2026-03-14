---
layout: ../../../layouts/DocLayout.astro
title: Sharing
---

# Sharing Kits

## Push to GitHub

The primary way to share kits. Your skills and configs live in a GitHub repo — that's the kit.

```
You → Pack → Push to GitHub → Others find it on ClawClawGo
```

1. Organize your skills in a directory with `SKILL.md` files
2. Run `clawclawgo pack` to verify everything looks right
3. Push to GitHub
4. Run `clawclawgo publish` to submit a registry entry

See the [Publishing guide](/docs/guide/publishing) for full details.

## Submit to the Registry

The ClawClawGo registry at `registry/kits.json` is a lightweight URL index. Submitting adds a pointer to your repo — ClawClawGo never hosts your content.

```bash
npx clawclawgo publish
```

This generates a registry entry and tells you how to submit a PR.

## Share as a File

Builds are JSON files. Share them however you want:

- Send the `.json` file directly
- Host on a URL
- Commit to a Git repo
- Paste in Discord/Slack

The recipient can download with `clawclawgo add` or just give the file to their AI agent.

## What Gets Shared

Everything in the kit is designed to be safe to share.

**What's included:**
- Skill names, descriptions, and paths
- Agent config files (`.cursorrules`, `CLAUDE.md`, etc.)
- Compatibility info (which agents this works with)
- Security scan results (trust score + findings)

**What's excluded by the scanner:**
- API keys, tokens, passwords
- Phone numbers, emails, addresses
- Other PII patterns

## Licensing

Builds on GitHub inherit your repo's license. If you include persona files (SOUL.md, etc.) with specific creative writing, consider that anyone can read and use them.
