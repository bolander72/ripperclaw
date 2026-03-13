# Applying a Build

Apply a build to create a new agent or update an existing one.

## Safety Rules

ClawClawGo follows strict safety rules when applying:

1. **Security scan first**: Every build is [scanned for security issues](/guide/security) before apply. Blocked builds cannot be applied.
2. **Never overwrites existing agent workspaces**: if `~/.openclaw/agents/<id>/` exists, the apply is blocked. You must choose a unique ID or delete the existing agent first.
3. **Mandatory backup before changes**: `openclaw.json` is automatically copied to `openclaw.backup-<timestamp>.json` before any modifications.
4. **Protects the default agent**: if `agents.list` is empty (single-agent setup), the current agent is automatically marked as `default: true` before creating the new one. This prevents orphaning your existing agent.
5. **Dependency check**: [Dependencies are checked](/guide/dependencies) before installation. You see what's missing and can opt in to auto-install.
6. **Setup guide availability**: For integrations with [setup guides](/guide/setup-guides), the guide is fetched and presented.
7. **Integrations are always manual**: credentials, API keys, and connection details never transfer. You get a checklist with documentation links for manual setup.
8. **Persona requires confirmation**: SOUL.md and AGENTS.md changes are shown in a diff view before applying. You must explicitly confirm persona changes since they alter the agent's core identity.

## Apply Modes

### Create New Agent (Default)

Creates a fresh agent workspace at `~/.openclaw/agents/<id>/`.

- Writes persona files (IDENTITY.md, SOUL.md, AGENTS.md)
- Creates USER.md template (never copies actual user data)
- Installs community skills from ClawHub
- Enables bundled skills
- Writes HEARTBEAT.md
- Creates memory directory structure with templates
- Adds agent entry to `openclaw.json`

### Update Existing Agent

Merges build changes into an existing agent:

- Writes/overwrites persona files (with confirmation)
- Installs missing skills (keeps existing versions)
- Overwrites HEARTBEAT.md
- Creates missing memory directories
- Updates model config

## Model Strategy

When applying, you choose how to handle models:

- **Use build's models**: adopts exactly what the build specifies
- **Use my models**: remaps build tiers to your existing model configuration

This is useful when a build uses paid models you don't have access to, or when you prefer local models.

## Using the App

The ApplyWizard walks you through five steps:

1. **Target** - Enter an agent ID, display name, and model strategy (use build's models or your own)
2. **Security Scan** - Runs schema validation and a client-side security scan. Shows trust score, badge, and any findings. Builds with "block" severity findings cannot proceed.
3. **Dependencies** - Shows what the build needs: binaries, brew/pip/npm packages, models, config keys, platform requirements, and setup guides. Informational only, never blocks you.
4. **Review** - Full action plan showing exactly what will be created, written, or installed
5. **Apply** - Creates the agent workspace, installs skills, writes config. Restart OpenClaw to activate.

## Using the CLI

```bash
# Preview what would happen (dry run)
node clawclawgo.mjs apply build.json --agent my-bot --dry-run

# Apply for real
node clawclawgo.mjs apply build.json --agent my-bot

# Use your own models instead of the build's
node clawclawgo.mjs apply build.json --agent my-bot --use-my-models

# Combine dry run with model remapping
node clawclawgo.mjs apply build.json --agent my-bot --dry-run --use-my-models
```

### Dry Run Mode

The `--dry-run` flag previews all actions without making any changes:

- Shows which files would be created or modified
- Lists skills that would be installed
- Displays the full action plan
- No files are written, no skills are installed, no config is modified

Use this to inspect a build before committing to the apply.

## After Applying

The new agent gets its own:
- Workspace directory with all files
- Entry in `openclaw.json` under `agents.list`
- Independent model, skills, and persona config

Restart OpenClaw for the new agent to become available. Multi-agent setups let you switch between agents in the ClawClawGo app's sidebar.
