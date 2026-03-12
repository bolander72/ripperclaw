# Build Schema

The build format is a JSON document with three top-level sections: `schema`, `meta`, `blocks`, and `dependencies`.

## Structure

```json
{
  "schema": 2,
  "meta": { ... },
  "blocks": { ... },
  "dependencies": { ... }
}
```

## Schema Version

```json
{
  "schema": 2
}
```

The schema version is always `2`. Older version 1 builds used a different structure with a `mods` array instead of the `blocks.skills` structure.

## Meta

```json
{
  "name": "Quinn",
  "agentName": "Quinn",
  "author": "@Bolander72",
  "version": 1,
  "exportedAt": "2026-03-12T18:00:00.000Z",
  "openclawVersion": "1.5.0",
  "description": "Full-featured personal assistant",
  "tags": ["personal", "voice", "smart-home"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Human-readable build name |
| `agentName` | string | yes | Name of the agent this was exported from |
| `author` | string | yes | Author identifier (e.g., @username) |
| `version` | number | yes | Build revision number (bumps on re-export) |
| `exportedAt` | string | yes | ISO 8601 timestamp of export |
| `openclawVersion` | string | no | OpenClaw version at export time |
| `description` | string | no | Short description of what this agent does |
| `tags` | string[] | no | Searchable tags for categorization |

## Blocks

The `blocks` object contains six core block types. Each block has a specific structure.

### `model`

Model configuration with routing tiers.

```json
{
  "tiers": {
    "main": {
      "provider": "anthropic",
      "model": "claude-opus-4-6",
      "alias": "Opus",
      "paid": true,
      "local": false
    },
    "subagent": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5",
      "alias": "Sonnet",
      "paid": true,
      "local": false
    }
  },
  "routing": {
    "description": "Opus for main, Sonnet for subagents, Haiku for utilities"
  }
}
```

**Model Tier:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | yes | API provider (anthropic, openai, google, ollama, etc.) |
| `model` | string | yes | Full model identifier |
| `alias` | string | no | Human-friendly name (e.g., Opus, Sonnet) |
| `paid` | boolean | no | Whether this model requires a paid API key |
| `local` | boolean | no | Whether this model runs locally |

Common tier names: `main`, `subagent`, `heartbeat`, `utility`. You can define custom tiers as needed.

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
    "preview": "# SOUL.md - Who You Are\n\n_You're not a chatbot...",
    "content": "<full SOUL.md content>",
    "tokenEstimate": 3200
  },
  "user": {
    "included": false,
    "note": "USER.md is never included in shared builds"
  },
  "agents": {
    "included": true,
    "preview": "# AGENTS.md - Your Workspace...",
    "content": "<full AGENTS.md content>"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `identity` | object | IDENTITY.md parsed fields (name, creature, vibe) |
| `soul.included` | boolean | Whether SOUL.md is included |
| `soul.preview` | string | First ~500 chars for preview before applying |
| `soul.content` | string | Full SOUL.md content (PII scrubbed) |
| `soul.tokenEstimate` | number | Approximate token count of content |
| `user.included` | boolean | Always `false` (USER.md never transfers) |
| `agents.included` | boolean | Whether AGENTS.md is included |
| `agents.preview` | string | Preview snippet |
| `agents.content` | string | Full AGENTS.md content |

### `skills`

Installed skill packages that give the agent capabilities.

```json
{
  "items": [
    {
      "name": "weather",
      "version": "1.0.0",
      "source": "bundled",
      "description": "Get current weather and forecasts",
      "requiresConfig": false
    },
    {
      "name": "frontend-design-ultimate",
      "version": "1.2.0",
      "source": "clawhub",
      "description": "Create production-grade static sites",
      "requiresConfig": false,
      "configHint": "No setup needed"
    }
  ]
}
```

**Skill Item:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Skill package name |
| `version` | string | no | Semver version string |
| `source` | enum | yes | Where this skill comes from: `clawhub`, `local`, `custom`, `bundled` |
| `description` | string | no | What this skill does |
| `requiresConfig` | boolean | no | Whether post-install configuration is needed |
| `configHint` | string | no | What configuration is needed |

### `integrations`

External services the agent connects to. Credentials never transfer.

```json
{
  "items": [
    {
      "type": "channel",
      "name": "iMessage via BlueBubbles",
      "provider": "bluebubbles",
      "autoApply": false,
      "docsUrl": "https://docs.openclaw.ai/integrations/bluebubbles",
      "setupGuideUrl": "https://docs.openclaw.ai/guides/bluebubbles.md"
    },
    {
      "type": "calendar",
      "name": "Calendar (caldir)",
      "provider": "caldir",
      "autoApply": false,
      "setupGuideUrl": "https://docs.openclaw.ai/guides/caldir.md"
    }
  ]
}
```

**Integration Item:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | yes | Integration category: `channel`, `calendar`, `email`, `smart-home`, `code`, `voice`, `camera`, `other` |
| `name` | string | yes | Human-readable integration name |
| `provider` | string | yes | Provider/tool identifier (bluebubbles, caldir, himalaya, etc.) |
| `autoApply` | boolean | yes | Always `false` (integrations require manual setup) |
| `docsUrl` | string | no | Link to setup docs (human-readable) |
| `setupGuideUrl` | string | no | Machine-readable setup guide URL (fetched by applying agent) |

### `automations`

Scheduled and recurring tasks.

```json
{
  "heartbeat": {
    "included": true,
    "content": "# HEARTBEAT.md\n\n## Periodic Checks\n- ..."
  },
  "cron": [
    {
      "name": "Daily Health Check",
      "schedule": { "kind": "cron" },
      "description": "Check system health every morning",
      "dependsOn": ["integrations.email"]
    }
  ]
}
```

**Heartbeat:**

| Field | Type | Description |
|-------|------|-------------|
| `included` | boolean | Whether HEARTBEAT.md is included |
| `content` | string | Full HEARTBEAT.md content |

**Cron Item:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Job display name |
| `schedule` | object | yes | Schedule definition (kind: `at`, `every`, or `cron`) |
| `description` | string | no | What this automation does |
| `dependsOn` | string[] | no | Prerequisites (skills, integrations) needed for this job |

### `memory`

The agent's context management system. Structure only, actual memories are never exported.

```json
{
  "structure": {
    "directories": ["memory/", "memory/reference/", "memory/research/"],
    "templateFiles": [
      {
        "path": "memory/handoff.md",
        "content": "# Handoff\n\n..."
      }
    ]
  },
  "engine": {
    "type": "lossless-claw",
    "description": "LosslessClaw with DAG-based compaction"
  }
}
```

**Structure:**

| Field | Type | Description |
|-------|------|-------------|
| `directories` | string[] | Directory paths to create |
| `templateFiles` | object[] | Template files to seed (never overwrites existing) |

**Template File:**

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | File path relative to agent workspace |
| `content` | string | Template content |

**Engine:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Memory system identifier |
| `description` | string | Human description of the memory engine |

## Dependencies

System-level requirements for the build. Populated during export by walking skills and integrations.

```json
{
  "bins": ["python3", "ffmpeg", "caldir"],
  "brew": ["portaudio"],
  "pip": ["whisper", "kokoro-onnx"],
  "npm": [],
  "models": [
    {
      "name": "kokoro-v1.0.onnx",
      "url": "https://github.com/thewh1teagle/kokoro-onnx/releases/...",
      "path": "~/.cache/kokoro-onnx/",
      "size": "82MB"
    }
  ],
  "config": [
    {
      "key": "OPENAI_API_KEY",
      "description": "OpenAI API key for Whisper API",
      "required": false
    }
  ],
  "platform": ["darwin"],
  "minOpenclawVersion": "1.4.0",
  "guides": {
    "bluebubbles": "https://docs.openclaw.ai/guides/bluebubbles.md",
    "caldir": "https://docs.openclaw.ai/guides/caldir.md"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `bins` | string[] | Required binaries on PATH |
| `brew` | string[] | Homebrew packages |
| `pip` | string[] | Python pip packages |
| `npm` | string[] | npm global packages |
| `models` | object[] | Model files to download |
| `config` | object[] | Configuration requirements |
| `platform` | string[] | Supported platforms (darwin, linux, win32) |
| `minOpenclawVersion` | string | Minimum OpenClaw version |
| `guides` | object | Setup guides keyed by provider/tool name (URLs to fetchable markdown) |

**Model Requirement:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Model file name |
| `url` | string | Download URL |
| `path` | string | Install path (supports ~) |
| `size` | string | File size (e.g., '82MB') |

**Config Requirement:**

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Environment variable or keychain key |
| `description` | string | What this config is for |
| `required` | boolean | Whether this is required |

## Custom Blocks

Builds can include custom block types beyond the six defaults. Any string key in `blocks` is valid.

```json
{
  "blocks": {
    "model": { ... },
    "persona": { ... },
    "customBlock": {
      "label": "My Custom Block",
      "status": "active",
      "component": "CustomComponent",
      "version": "1.0",
      "details": { "foo": "bar" },
      "items": [ { "name": "item1" } ]
    }
  }
}
```

Custom blocks can contain any structure. Common properties:

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Display label |
| `status` | string | Status indicator |
| `component` | string | UI component name |
| `version` | string | Block version |
| `details` | object | Arbitrary metadata |
| `items` | array | List of items |

## Validation

The formal JSON Schema is at [`specs/build.schema.json`](https://github.com/bolander72/clawclawgo/blob/main/specs/build.schema.json) in the repo.

Use the `validate` command to check a build file:

```bash
clawclawgo validate my-build.json
```
