---
layout: ../../../layouts/DocLayout.astro
title: CLI Reference
---

# CLI Reference

Two commands. No install required.

## `push`

Scan your repo, build kit metadata, validate against the schema, and submit to the ClawClawGo registry. Kit metadata is built internally — no intermediate files are generated on disk.

```bash
npx clawclawgo push [dir]
```

| Arg | Description |
|-----|-------------|
| `[dir]` | Directory to push (default: `.`) |

**What happens:**
1. Reads all SKILL.md files and agent config files
2. Builds kit.json internally (never written to disk)
3. Runs security scan — blocks if issues found
4. Validates against the kit schema — blocks if invalid
5. Auto-creates a PR to `registry/kits.json` via `gh` CLI
6. If repo already exists in registry, updates the existing entry

**Requires:** Git remote configured, [GitHub CLI](https://cli.github.com/) (`gh`) authenticated.

**Sensitive files excluded:** SOUL.md, USER.md, MEMORY.md, IDENTITY.md, openclaw.json, .env, memory/ — these never leave your machine.

## `add`

Clone a kit repo from GitHub, scan it, and generate a `CLAWCLAWGO.md` describing the kit.

```bash
npx clawclawgo add <owner/repo> [--dest dir]
```

| Arg | Description |
|-----|-------------|
| `<owner/repo>` | GitHub repo (e.g. `garrytan/gstack`) or full URL |
| `--dest <dir>` | Clone destination (default: current directory) |
| `--force` | Override security blocks |

If the security scan finds blocking issues, the clone is removed. Use `--force` to keep it anyway.

## Requirements

- **Node.js** 18+
- **Git** (for `add`)
- **GitHub CLI** (`gh`) — for `push`

## Examples

```bash
npx clawclawgo push
npx clawclawgo push ~/my-skills
npx clawclawgo add garrytan/gstack
npx clawclawgo add anthropics/skills --dest ~/kits
```
