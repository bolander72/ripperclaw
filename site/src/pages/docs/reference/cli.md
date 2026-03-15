---
layout: ../../../layouts/DocLayout.astro
title: CLI Reference
---

# CLI Reference

Three commands. No install required.

## `pack`

Pack your skills into a `kit.json` file with security scan baked in. Sensitive files (SOUL.md, MEMORY.md, USER.md, memory/, .env) are automatically excluded.

```bash
npx clawclawgo pack [dir] [--out file]
```

| Arg | Description |
|-----|-------------|
| `[dir]` | Directory to scan (default: `.`) |
| `--out <file>` | Write to file instead of stdout |

**Detects:** SKILL.md files, CLAUDE.md, .cursorrules, .windsurfrules, AGENTS.md, codex.json, .clinerules, .aider.conf.yml, .continue/config.json

## `push`

Push your kit to the ClawClawGo registry. Runs `pack` + security scan, then auto-creates a PR to `registry/kits.json`.

```bash
npx clawclawgo push [dir]
```

| Arg | Description |
|-----|-------------|
| `[dir]` | Directory to push (default: `.`) |

**Requires:** Git remote configured, [GitHub CLI](https://cli.github.com/) (`gh`) authenticated. If `gh` isn't available, prints the registry entry JSON for manual submission.

Kits with blocking security issues can't be pushed.

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
- **GitHub CLI** (`gh`) — optional, for `push` auto-PRs

## Examples

```bash
npx clawclawgo pack --out kit.json
npx clawclawgo push
npx clawclawgo add garrytan/gstack
npx clawclawgo add anthropics/skills --dest ~/kits
```
