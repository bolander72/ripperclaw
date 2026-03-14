---
layout: ../../../layouts/DocLayout.astro
title: CLI Reference
---

# CLI Reference

Run with `npx` (no install required):

```bash
npx clawclawgo <command>
```

Or run from source:

```bash
git clone https://github.com/bolander72/clawclawgo
chmod +x clawclawgo/cli/clawclawgo.mjs
./clawclawgo/cli/clawclawgo.mjs --help
```

## Commands

### `pack`

Scan a directory for agent skills and configs, output a portable `build.json`.

```bash
npx clawclawgo pack [dir] [--out file]
```

**Options:**

| Flag | Description |
|------|-------------|
| `[dir]` | Directory to scan (defaults to current directory) |
| `--out <file>` | Write to file instead of stdout |

**What it detects:**
- `SKILL.md` files (Agent Skills standard)
- `CLAUDE.md` (Claude Code)
- `.cursorrules` (Cursor)
- `.windsurfrules` (Windsurf)
- `AGENTS.md` (OpenClaw)
- `codex.json` (Codex)
- `.clinerules` (Cline)
- `.aider.conf.yml` (Aider)
- `.continue/config.json` (Continue)

Security scan results are baked into the output so anyone reading the file can see the trust score.

**Examples:**

```bash
npx clawclawgo pack ~/my-skills --out build.json
npx clawclawgo pack .
```

### `add`

Download a build to your machine. Checks baked-in scan results and blocks flagged builds unless `--force`.

```bash
npx clawclawgo add <url|file> [--dest dir] [--force]
```

**Options:**

| Flag | Description |
|------|-------------|
| `<url\|file>` | URL or local path to a build.json |
| `--dest <dir>` | Where to save (defaults to current directory) |
| `--force` | Download even if scan found issues |

**Examples:**

```bash
npx clawclawgo add https://example.com/build.json
npx clawclawgo add ./someone-elses-build.json --dest ~/builds
```

Give the downloaded file to your AI agent — it'll know what to do with it.

### `scan`

Run the security scanner on any build file. Checks for prompt injection, shell exfiltration, credential access, PII, and dangerous commands.

```bash
npx clawclawgo scan <file>
```

Outputs a trust score (0-100) and list of findings.

**Examples:**

```bash
npx clawclawgo scan build.json
npx clawclawgo scan ~/downloads/someones-build.json
```

See [Security](/docs/guide/security) for details on what's scanned.

### `preview`

Pretty-print a build summary — skills, compatibility, scan results.

```bash
npx clawclawgo preview <file>
```

**Examples:**

```bash
npx clawclawgo preview build.json
npx clawclawgo preview ~/downloads/someones-build.json
```

### `publish`

Prepare your repo for the ClawClawGo registry. Detects your git remote, runs `pack` + `scan`, and generates a registry entry.

```bash
npx clawclawgo publish [dir]
```

Outputs a JSON entry you can submit as a PR to `registry/builds.json`. See [Publishing](/docs/guide/publishing) for details.

### `search`

Search for builds on ClawClawGo.

```bash
npx clawclawgo search <query>
```

Opens [clawclawgo.com/search](https://clawclawgo.com/search) with your query.

## Environment

- Node.js 18+
- No other dependencies required

## From Source

```bash
git clone https://github.com/bolander72/clawclawgo
cd clawclawgo
chmod +x cli/clawclawgo.mjs
./cli/clawclawgo.mjs --help
```
