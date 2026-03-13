# Builds Overview

A **build** is a portable snapshot of an AI agent's configuration. It captures everything about how an agent is set up: which models it uses, its personality, installed skills, connected services, scheduled tasks, and memory structure.

## What's in a Build?

```
┌──────────────────────────────┐
│         LOADOUT              │
├──────────────────────────────┤
│  Meta                        │
│  ├─ name, author, version    │
│  ├─ tags, description        │
│  └─ exportedAt               │
│                              │
│  Blocks                       │
│  ├─ Model (LLM tiers)       │
│  ├─ Persona (identity)      │
│  ├─ Skills (packages)       │
│  ├─ Integrations (services) │
│  ├─ Automations (cron)      │
│  └─ Memory (structure)      │
└──────────────────────────────┘
```

## Lifecycle

```
Export → Save → (optional) Publish → Browse → Apply
```

1. **Export** your current agent config produces a build JSON file
2. **Save** it locally for versioning or backup
3. **Publish** to Nostr for others to discover
4. **Browse** the feed for builds shared by others
5. **Apply** a build to create a new agent or update an existing one

## Key Principles

### Portable
Builds are plain JSON. Copy them, email them, paste them, host them. They work anywhere.

### Private by Default
Exports automatically scrub phone numbers, emails, API keys, and personal data. You review what gets shared.

### Non-Destructive
Applying a build never deletes existing config. It creates new agents in isolated workspaces or merges changes with explicit confirmation.

### Modular
Each section is independent. You can take inspiration from one build's skills and another's persona.
