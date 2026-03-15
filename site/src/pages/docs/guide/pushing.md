---
layout: ../../../layouts/DocLayout.astro
title: Pushing
---

# Pushing to the Registry

Pushing makes your kit discoverable on [clawclawgo.com](https://clawclawgo.com).

## How It Works

Your kit lives in your GitHub repo. The `push` command:
1. Scans your repo for SKILL.md files and agent configs
2. Builds kit metadata internally (nothing written to disk)
3. Runs a security scan — blocks if issues found
4. Validates against the kit schema — blocks if invalid
5. Submits a PR to `registry/kits.json`

Sensitive files (SOUL.md, USER.md, MEMORY.md, memory/, .env) are automatically excluded.

## Quick Push

```bash
cd ~/my-agent-skills
npx clawclawgo push
```

Requires the [GitHub CLI](https://cli.github.com/) (`gh`) with authentication.

## What Gets Submitted

A full kit object with skills, configs, compatibility, and scan results:

```json
{
  "schema": 1,
  "name": "my-agent-skills",
  "repoUrl": "https://github.com/yourname/my-agent-skills",
  "owner": "yourname",
  "compatibility": ["agent-skills", "claude-code", "cursor"],
  "skills": [...],
  "configs": [...],
  "scan": { "trustScore": 95, ... },
  "pushedAt": "2026-03-15T00:00:00.000Z"
}
```

Every entry is validated against a strict schema. Invalid kits are rejected before the PR is created.

## Updating

Run `push` again. If your repo URL already exists in the registry, it updates the existing entry.

## Manual Submission

If the auto-PR doesn't work (no `gh` CLI, auth issues, etc.):

1. Fork [bolander72/clawclawgo](https://github.com/bolander72/clawclawgo)
2. Add your kit entry to `registry/kits.json`
3. Submit a PR

The kit must pass schema validation — see [Schema Reference](/docs/reference/schema) for the format.

## Removing from Registry

Submit a PR removing your entry from `registry/kits.json`.
