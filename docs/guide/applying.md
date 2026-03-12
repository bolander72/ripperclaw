# Applying a Build

Apply a build to create a new agent or update an existing one.

## Safety Rules

ClawClawGo follows strict safety rules when applying:

1. **Never overwrites existing agent workspaces**: if `~/.openclaw/agents/<id>/` exists, the apply is blocked. You must choose a unique ID or delete the existing agent first.
2. **Mandatory backup before changes**: `openclaw.json` is automatically copied to `openclaw.backup-<timestamp>.json` before any modifications.
3. **Protects the default agent**: if `agents.list` is empty (single-agent setup), the current agent is automatically marked as `default: true` before creating the new one. This prevents orphaning your existing agent.
4. **Integrations are always manual**: credentials, API keys, and connection details never transfer. You get a checklist with documentation links for manual setup.
5. **Persona requires confirmation**: SOUL.md and AGENTS.md changes are shown in a diff view before applying. You must explicitly confirm persona changes since they alter the agent's core identity.

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

1. Find a build (Builds view, Feed, or import a file)
2. Click **Apply to Agent**
3. Enter an agent ID and display name
4. Choose your model strategy
5. Review the block-by-block action plan
6. Confirm and apply
7. Restart OpenClaw to activate the new agent

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
- Displays the full action plan for each block
- No files are written, no skills are installed, no config is modified

Use this to inspect a build before committing to the apply.

## After Applying

The new agent gets its own:
- Workspace directory with all files
- Entry in `openclaw.json` under `agents.list`
- Independent model, skills, and persona config

Restart OpenClaw for the new agent to become available. Multi-agent setups let you switch between agents in the ClawClawGo app's sidebar.
