# Exporting

Export your current agent configuration as a portable build file.

## What Gets Exported

| Section | Exported | Scrubbed |
|------|----------|----------|
| Model | Tiers, providers, model names | (none) |
| Persona | SOUL.md, IDENTITY.md, AGENTS.md | Phone numbers, emails, addresses |
| Skills | Names, versions, sources | (none) |
| Integrations | Types and names (no credentials) | API keys, tokens, passwords |
| Automations | HEARTBEAT.md content, cron job configs | (none) |
| Memory | Directory structure, template files | Actual memory content, facts, notes |
| Dependencies | Detected from skills and integrations | (none) |

**Dependency detection**: The exporter walks all skills and integrations to build a complete [dependency manifest](/guide/dependencies) including required binaries, packages, models, and config. This lets appliers know exactly what's needed before installation.

## PII Scrubbing

Exports automatically scrub personally identifiable information:

- Phone numbers: `[REDACTED_PHONE]`
- Email addresses: `[REDACTED_EMAIL]`
- Street addresses: `[REDACTED_ADDRESS]`
- API keys and tokens: removed entirely
- Absolute file paths: relativized

You can review what was scrubbed in the export report.

## Using the App

1. Go to **Builds** → **Save Current Build**
2. Name your build
3. The build is saved to your workspace's `builds/` directory

## Using the CLI

```bash
# Export to stdout
node clawclawgo.mjs export

# Export to file
node clawclawgo.mjs export > my-build.json
```

## Safe Export for Publishing

When publishing to Nostr, ClawClawGo uses `export_build_safe` which applies stricter scrubbing and returns a report of what was redacted:

```json
{
  "scrubbed_fields": [
    "persona.soul.content: 3 phone numbers redacted",
    "persona.soul.content: 2 email addresses redacted"
  ],
  "warnings": [
    "AGENTS.md contains a GitHub username"
  ]
}
```

## Export Format

Exports use the [Build Schema](/reference/schema), a JSON format with `meta`, configuration keys, and `dependencies` at the top level. See the reference for the full spec.
