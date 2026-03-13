# Quick Start

Get ClawClawGo running and apply your first build in under 5 minutes.

## Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- macOS, Windows, or Linux

## 1. Install ClawClawGo

Download the latest release for your platform from the [releases page](https://github.com/bolander72/clawclawgo/releases/latest).

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `.dmg` |
| macOS (Intel) | `.dmg` |
| Windows | `.exe` installer |
| Linux | `.deb` or `.AppImage` |

## 2. Launch & Connect

Open ClawClawGo. If OpenClaw's gateway is running, you'll see **LIVE** in the status bar. The app automatically detects your config at `~/.openclaw/openclaw.json`.

If you see **MOCK**, the gateway isn't reachable. ClawClawGo will show sample data so you can still explore the UI.

## 3. View Your Build

The **Build** view shows your current agent's configuration in a tree view. Click any key to drill into the details.

## 4. Save a Snapshot

Go to **Builds** → **Save Current Build**. Give it a name like "My Setup v1". This captures your current config as a portable JSON file.

## 5. Browse the Feed

Switch to **The Feed** to see builds published by other users on Nostr. Find one you like? Click **Compare** to see how it differs from yours, or **Apply** to create a new agent from it.

## 6. Apply a Build

The Apply Wizard walks you through:
1. **Name** your new agent
2. **Review** what will be created, written, or installed
3. **Confirm** and apply

Your new agent gets its own workspace at `~/.openclaw/agents/<name>/`. Restart OpenClaw to activate it.

## Using the CLI

Prefer the terminal? The `clawclawgo` CLI does the same thing:

```bash
# Export your current agent
node clawclawgo.mjs export

# Preview what an apply would do
node clawclawgo.mjs apply build.json --agent my-bot --dry-run

# Apply for real
node clawclawgo.mjs apply build.json --agent my-bot
```

## Next Steps

- 
- [Exporting](/guide/exporting): customize your exports
- [Publishing](/guide/publishing): share on Nostr
