# Creating a Build

## From the App

1. Open ClawClawGo
2. Navigate to **Builds** in the sidebar
3. Click **Save Current Build**
4. Enter a name (e.g., "Production Setup", "Lean Ops", "Dev Mode")
5. Your build is saved to `~/.openclaw/workspace/builds/`

## From the CLI

```bash
# Export to stdout (pipe-friendly)
node clawclawgo.mjs export

# Save to a specific file
node clawclawgo.mjs export > my-agent.build.json
```

## From the Feed

When you find a build in the Feed that you like, it's automatically available to save, compare, or apply. There's no separate "download" step.

## Tips

- **Save before big changes.** Create a build before swapping models, rewriting your SOUL.md, or installing experimental skills.
- **Name meaningfully.** "Quinn v3: Sonnet main, no voice" is better than "backup2".
- **Version your builds.** The meta includes a version number. Bump it when you make significant changes before re-publishing.
