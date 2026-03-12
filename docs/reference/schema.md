# Build Schema

The build format is a JSON document with three top-level sections.

## Structure

```json
{
  "schema": 1,
  "meta": { ... },
  "blocks": { ... },
  "mods": [ ... ]
}
```

## Meta

```json
{
  "name": "Quinn",
  "author": "bolander72",
  "version": 1,
  "exportedAt": "2026-03-11T22:00:00.000Z",
  "description": "Full-featured personal assistant",
  "tags": ["personal", "voice", "smart-home"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Human-readable build name |
| `author` | string | no | Author identifier |
| `version` | number | no | Build version (bump on significant changes) |
| `exportedAt` | string | yes | ISO 8601 timestamp |
| `description` | string | no | Short description |
| `tags` | string[] | no | Categorization tags |

## Blocks

All 6 blocks have typed structures. Here's the complete schema for each.

### `model`

Model configuration with three tiers: main (default), fast (when speed matters), and free (fallback for simple tasks).

```json
{
  "tiers": {
    "main": {
      "provider": "anthropic",
      "model": "claude-opus-4-6",
      "paid": true
    },
    "fast": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5",
      "paid": true
    },
    "free": {
      "provider": "ollama",
      "model": "qwen3.5:4b",
      "paid": false
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `provider` | string | API provider (anthropic, openai, google, ollama, etc.) |
| `model` | string | Model identifier |
| `paid` | boolean | Whether this tier costs money per request |

### `persona`

Who the agent is: identity, personality, working style, and user context.

```json
{
  "identity": {
    "name": "Quinn",
    "creature": "AI assistant",
    "vibe": "Calm, efficient, resourceful"
  },
  "soul": {
    "included": true,
    "content": "# SOUL.md\n\n..."
  },
  "agents": {
    "included": true,
    "content": "# AGENTS.md\n\n..."
  },
  "user": {
    "included": false,
    "template": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `identity` | object | IDENTITY.md parsed fields (name, creature, vibe, emoji) |
| `soul.included` | boolean | Whether SOUL.md is included |
| `soul.content` | string | Full SOUL.md content (PII scrubbed) |
| `agents.included` | boolean | Whether AGENTS.md is included |
| `agents.content` | string | Full AGENTS.md content |
| `user.included` | boolean | Whether USER.md content is included (always false on export) |
| `user.template` | boolean | Whether to write a USER.md template on apply |

### `skills`

Installed skill packages that give the agent capabilities.

```json
{
  "items": [
    {
      "name": "weather",
      "version": "1.0.0",
      "source": "bundled",
      "requiresConfig": false
    },
    {
      "name": "frontend-design-ultimate",
      "version": "1.2.0",
      "source": "clawhub",
      "requiresConfig": false
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill identifier |
| `version` | string | Semantic version |
| `source` | enum | `"bundled"` (ships with OpenClaw) or `"clawhub"` (community) |
| `requiresConfig` | boolean | Whether the skill needs manual setup after installation |

### `integrations`

External services the agent connects to. Always informational: credentials never transfer.

```json
{
  "items": [
    {
      "type": "imessage",
      "name": "iMessage via BlueBubbles",
      "setupDocs": "https://docs.openclaw.ai/channels/bluebubbles",
      "manual": true
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Integration category (imessage, telegram, calendar, email, etc.) |
| `name` | string | Human-readable integration name |
| `setupDocs` | string | URL to setup instructions |
| `manual` | boolean | Always true (integrations require manual setup) |

::: warning
Integration entries describe what the source agent had configured. They never include credentials or connection details.
:::

### `automations`

Scheduled and recurring tasks.

```json
{
  "heartbeat": {
    "included": true,
    "content": "# HEARTBEAT.md\n\n## Periodic Checks\n- ..."
  },
  "cronJobs": [
    {
      "name": "Daily Health Check",
      "schedule": { "kind": "cron", "expr": "0 8 * * *" },
      "dependsOn": ["skills.healthcheck"]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `heartbeat.included` | boolean | Whether HEARTBEAT.md is included |
| `heartbeat.content` | string | Full HEARTBEAT.md content |
| `cronJobs` | array | List of scheduled jobs |
| `cronJobs[].name` | string | Job display name |
| `cronJobs[].schedule` | object | Cron expression or interval definition |
| `cronJobs[].dependsOn` | array | Prerequisites (skills, integrations) needed for this job |

### `memory`

The agent's context management system. Structure only: actual memories are never exported.

```json
{
  "engine": "lossless-claw",
  "structure": {
    "directories": ["memory/", "memory/reference/", "memory/research/"],
    "templateFiles": [
      {
        "path": "memory/handoff.md",
        "content": "# Handoff\n\n..."
      }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `engine` | string | Memory system identifier (e.g., `"lossless-claw"`) |
| `structure.directories` | array | Directory paths to create |
| `structure.templateFiles` | array | Template files to write on apply |
| `templateFiles[].path` | string | File path relative to agent workspace |
| `templateFiles[].content` | string | Template content |

## Mods (Legacy)

The `mods` array is a flat list of skills for backward compatibility with schema version 1:

```json
{
  "mods": [
    { "name": "weather", "source": "bundled", "enabled": true },
    { "name": "humanize", "source": "custom", "enabled": true }
  ]
}
```

New exports use `blocks.skills.items` instead.

## Validation

The formal JSON Schema is at [`specs/build-v2.schema.json`](https://github.com/bolander72/clawclawgo/blob/main/specs/build-v2.schema.json) in the repo.
