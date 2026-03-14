---
layout: ../../../layouts/DocLayout.astro
title: CLI Reference
---

# CLI Reference

The ClawClawGo CLI is installable via npm/npx. No installation required — just run with `npx`:

```bash
npx clawclawgo <command>
```

Or install globally:

```bash
npm install -g clawclawgo
clawclawgo <command>
```

## Commands

### `export`

Export the current agent's configuration as a build JSON document.

```bash
npx clawclawgo export
```

Outputs to stdout. Pipe to a file to save:

```bash
npx clawclawgo export > my-build.json
```

**Options:**

| Flag | Description |
|------|-------------|
| `--agent <id>` | Agent ID to export (defaults to main) |
| `--out <file>` | Write to file instead of stdout |

**What it captures:**
- Model tiers (main, fast, free) from `openclaw.json`
- Persona files (IDENTITY.md, SOUL.md, AGENTS.md) with PII scrubbing
- Skills (bundled and clawhub-installed)
- Integrations (types only, no credentials)
- Automations (HEARTBEAT.md content)
- Memory (directory structure and template files)

**Example:**

```bash
npx clawclawgo export --agent main --out build.json
```

### `apply`

Apply a build file to create a new agent.

```bash
npx clawclawgo apply <build.json> --agent <agent-id> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--agent <id>` | Agent ID (required, lowercase alphanumeric + hyphens) |
| `--dry-run` | Preview actions without making changes |
| `--use-my-models` | Remap build model tiers to your existing config |
| `--skip-deps` | Skip dependency checking |
| `--skip-security` | Skip security scan (not recommended) |

**Build sources:**
- Local file: `npx clawclawgo apply build.json --agent test-bot`
- URL: `npx clawclawgo apply https://example.com/build.json --agent test-bot`
- Stdin: `cat build.json | npx clawclawgo apply --from-stdin --agent test-bot`

**Example:**

```bash
# Preview
npx clawclawgo apply quinn-build.json --agent test-bot --dry-run

# Apply
npx clawclawgo apply quinn-build.json --agent test-bot

# Apply with your own models
npx clawclawgo apply quinn-build.json --agent test-bot --use-my-models

# Apply from URL
npx clawclawgo apply https://raw.githubusercontent.com/user/build/main/build.json --agent prod-bot
```

**Safety:**
- Refuses to overwrite existing agent workspaces
- Backs up `openclaw.json` before changes
- Adds default agent protection when `agents.list` is empty

### Actions performed during apply:

1. Create workspace at `~/.openclaw/agents/<id>/`
2. Write IDENTITY.md, SOUL.md, AGENTS.md
3. Write USER.md template
4. Install ClawHub skills
5. Enable bundled skills
6. Write HEARTBEAT.md
7. Create memory directories and template files
8. Add agent config entry to `openclaw.json`

### `scan`

Scan a build file for security issues without applying it.

```bash
npx clawclawgo scan <build.json>
```

Runs all security passes and outputs the security report with trust score and findings. See [Security Scanning](/docs/guide/security) for details.

**Example:**

```bash
npx clawclawgo scan my-build.json
npx clawclawgo scan https://example.com/build.json
```

### `preview`

Preview what an applier would see (security summary, dependency report, guide availability).

```bash
npx clawclawgo preview <build.json>
```

Shows:
- Security scan summary with trust score
- Dependency report (installed vs missing)
- Setup guide availability per integration
- Section-by-section action plan

**Example:**

```bash
npx clawclawgo preview my-build.json
npx clawclawgo preview https://raw.githubusercontent.com/user/build/main/build.json
```

## Environment

The CLI expects:
- `~/.openclaw/openclaw.json` to exist
- `clawhub` CLI available in PATH (for skill installation)
- Node.js 18+

## Installation

**Via npx (no install required):**

```bash
npx clawclawgo <command>
```

**Global install:**

```bash
npm install -g clawclawgo
```

**From source:**

```bash
git clone https://github.com/bolander72/clawclawgo
cd clawclawgo
chmod +x cli/clawclawgo.mjs
./cli/clawclawgo.mjs <command>
```

## Publishing Workflow

```bash
# 1. Export your config
npx clawclawgo export --agent main --out build.json

# 2. Preview/scan
npx clawclawgo preview build.json
npx clawclawgo scan build.json

# 3. Publish to GitHub
#    - Create repo
#    - Add build.json
#    - Tag with 'clawclawgo-build' topic
```

See [Publishing Guide](/docs/guide/publishing) for details.
