# CLI Reference

The ClawClawGo CLI is a standalone Node.js script at `cli/clawclawgo.mjs`.

## Commands

### `export`

Export the current agent's configuration as a build JSON document.

```bash
node clawclawgo.mjs export
```

Outputs to stdout. Pipe to a file to save:

```bash
node clawclawgo.mjs export > my-build.json
```

**What it captures:**
- Model tiers (main, fast, free) from `openclaw.json`
- Persona files (IDENTITY.md, SOUL.md, AGENTS.md) with PII scrubbing
- Skills (bundled and clawhub-installed)
- Integrations (types only, no credentials)
- Automations (HEARTBEAT.md content)
- Memory (directory structure and template files)

### `apply`

Apply a build file to create a new agent.

```bash
node clawclawgo.mjs apply <build.json> --agent <agent-id> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--agent <id>` | Agent ID (required, lowercase alphanumeric + hyphens) |
| `--dry-run` | Preview actions without making changes |
| `--use-my-models` | Remap build model tiers to your existing config |

**Example:**

```bash
# Preview
node clawclawgo.mjs apply quinn-build.json --agent test-bot --dry-run

# Apply
node clawclawgo.mjs apply quinn-build.json --agent test-bot

# Apply with your own models
node clawclawgo.mjs apply quinn-build.json --agent test-bot --use-my-models
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

## Environment

The CLI expects:
- `~/.openclaw/openclaw.json` to exist
- `clawhub` CLI available in PATH (for skill installation)
- Node.js 18+
