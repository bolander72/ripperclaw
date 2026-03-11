# Loadout Schema v2

The canonical format for exporting, sharing, and applying OpenClaw agent loadouts.

## Design Principles

1. **Human-readable** — JSON with clear field names, no encoded blobs
2. **Apply-safe** — no credentials, no PII, no absolute paths
3. **Slot-independent** — each slot is self-contained, can be applied/skipped individually
4. **Version-aware** — skills pin versions, models specify providers

---

## Top-Level Structure

```json
{
  "schema": 2,
  "meta": {
    "name": "Personal Assistant",
    "agentName": "Quinn",
    "description": "Full-featured personal assistant with voice, smart home, and coding",
    "author": "@Bolander72",
    "version": 1,
    "exportedAt": "2026-03-11T21:00:00Z",
    "openclawVersion": "1.4.2",
    "tags": ["personal", "voice", "smart-home", "coding"]
  },
  "slots": {
    "model": { ... },
    "persona": { ... },
    "skills": { ... },
    "integrations": { ... },
    "automations": { ... },
    "memory": { ... }
  }
}
```

### `meta`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Display name for the loadout |
| `agentName` | string | ✅ | Name of the agent this was exported from |
| `description` | string | ❌ | One-liner about what this agent does |
| `author` | string | ✅ | Creator handle (e.g., `@Bolander72`) |
| `version` | integer | ✅ | Loadout revision number (bumps on re-export) |
| `exportedAt` | ISO 8601 | ✅ | When this loadout was created |
| `openclawVersion` | string | ❌ | OpenClaw version at export time |
| `tags` | string[] | ❌ | Searchable tags |

---

## Slot: `model`

```json
{
  "model": {
    "tiers": {
      "main": {
        "provider": "anthropic",
        "model": "claude-opus-4-6",
        "alias": "Opus",
        "paid": true
      },
      "subagent": {
        "provider": "anthropic",
        "model": "claude-sonnet-4-5",
        "alias": "Sonnet",
        "paid": true
      },
      "heartbeat": {
        "provider": "ollama",
        "model": "qwen3.5:4b",
        "alias": "Qwen",
        "paid": false,
        "local": true
      },
      "utility": {
        "provider": "ollama",
        "model": "qwen3:8b",
        "alias": "Qwen",
        "paid": false,
        "local": true
      }
    },
    "routing": {
      "description": "Opus for main, Sonnet for sub-agents, Qwen for heartbeats and utility"
    }
  }
}
```

**Apply behavior:**
- Show each tier with paid/local flags
- If user doesn't have the provider configured: warn "requires [provider] API key"
- **"Use my models instead"** toggle → maps tiers to user's existing config:
  - `main` → user's default model
  - `subagent` → user's subagent model (or default)
  - `heartbeat` → user's cheapest/local model (or skip)
  - `utility` → same as heartbeat
- User can also manually pick per-tier from their configured models

---

## Slot: `persona`

```json
{
  "persona": {
    "identity": {
      "name": "Quinn",
      "creature": "AI assistant (OpenClaw agent)",
      "vibe": "Calm, efficient, resourceful, agentic, fun"
    },
    "soul": {
      "included": true,
      "preview": "First 500 chars of SOUL.md for preview...",
      "content": "Full SOUL.md content (scrubbed of PII)",
      "tokenEstimate": 2400
    },
    "user": {
      "included": false,
      "note": "USER.md excluded — contains personal information about the human"
    },
    "agents": {
      "included": true,
      "preview": "First 500 chars of AGENTS.md...",
      "content": "Full AGENTS.md content (scrubbed)"
    }
  }
}
```

**Apply behavior:**
- ⚠️ Always confirm: "This will change your agent's persona. Are you sure?"
- Show diff of current vs incoming SOUL.md, IDENTITY.md, AGENTS.md
- USER.md never included in loadouts, never overwritten
- Merge mode: appends non-conflicting sections. Replace mode: overwrites files.

---

## Slot: `skills`

```json
{
  "skills": {
    "items": [
      {
        "name": "voice-chat",
        "version": "1.2.0",
        "source": "clawhub",
        "description": "Local voice loop with Whisper STT + Kokoro TTS",
        "requiresConfig": true,
        "configHint": "Needs Kokoro model files downloaded (~82MB)"
      },
      {
        "name": "frontend-design-ultimate",
        "version": "2.0.1",
        "source": "clawhub",
        "description": "Production-grade static sites with React + Tailwind",
        "requiresConfig": false
      },
      {
        "name": "coding-agent",
        "version": "1.0.0",
        "source": "clawhub",
        "description": "Delegate coding tasks to background agents",
        "requiresConfig": false
      }
    ]
  }
}
```

**Apply behavior:**
- Auto-install from ClawHub via `clawhub install <name>@<version>`
- If already installed at same version: ✅ skip
- If already installed at different version: show "weather v1.2.0 installed (loadout uses v1.4.0) [Update →]" — default: keep user's version
- If `requiresConfig: true`: flag after install with `configHint`
- Skills not on ClawHub (`source: "local"` or `source: "custom"`): show "manual install needed" with description

---

## Slot: `integrations`

```json
{
  "integrations": {
    "items": [
      {
        "type": "channel",
        "name": "iMessage (BlueBubbles)",
        "provider": "bluebubbles",
        "autoApply": false,
        "docsUrl": "https://docs.openclaw.ai/integrations/bluebubbles"
      },
      {
        "type": "calendar",
        "name": "Google Calendar",
        "provider": "caldir",
        "autoApply": false,
        "docsUrl": "https://docs.openclaw.ai/integrations/calendar"
      },
      {
        "type": "email",
        "name": "Email (IMAP/SMTP)",
        "provider": "himalaya",
        "autoApply": false
      },
      {
        "type": "smart-home",
        "name": "Home Assistant",
        "provider": "homeassistant",
        "autoApply": false,
        "docsUrl": "https://docs.openclaw.ai/integrations/home-assistant"
      },
      {
        "type": "code",
        "name": "GitHub",
        "provider": "gh",
        "autoApply": false
      }
    ]
  }
}
```

**Apply behavior:**
- ❌ Never auto-applied — credentials, OAuth, device pairing all manual
- Show checklist: "This loadout uses these integrations:"
- Each item shows setup status (✅ already configured / ⚙️ setup needed)
- Link to docs where available
- Detection: check if provider CLI exists, config has channel entry, etc.

---

## Slot: `automations`

```json
{
  "automations": {
    "heartbeat": {
      "included": true,
      "content": "Full HEARTBEAT.md content",
      "taskCount": 3
    },
    "cron": [
      {
        "name": "email-monitor",
        "schedule": { "kind": "cron", "expr": "*/30 * * * *" },
        "description": "Check inbox every 30 minutes",
        "dependsOn": ["integrations.email"]
      },
      {
        "name": "health-check",
        "schedule": { "kind": "every", "everyMs": 3600000 },
        "description": "Hourly system health check",
        "dependsOn": []
      }
    ]
  }
}
```

**Apply behavior:**
- Heartbeat: write HEARTBEAT.md (merge appends tasks, replace overwrites)
- Cron jobs: create via OpenClaw cron API
- If `dependsOn` references missing integration/skill: warn "This automation depends on [email] which isn't set up yet"
- Show each cron with schedule in human-readable form

---

## Slot: `memory`

```json
{
  "memory": {
    "structure": {
      "directories": [
        "memory/",
        "memory/reference/"
      ],
      "templateFiles": [
        {
          "path": "memory/handoff.md",
          "content": "# Handoff\n\n_Updated each session with current state._"
        },
        {
          "path": "memory/active-work.md",
          "content": "# Active Work\n\n_Track ongoing projects here._"
        },
        {
          "path": "memory/facts.md",
          "content": "# Facts\n\n_Atomic facts promoted from daily notes._"
        }
      ]
    },
    "engine": {
      "type": "lcm",
      "description": "Lossless Context Management — auto-compacts conversation history"
    }
  }
}
```

**Apply behavior:**
- Create directory structure if missing
- Write template files only if they don't already exist (never overwrite memory)
- In replace mode: still never overwrite — memory is sacred
- `engine` field is informational only (LCM is an OpenClaw feature, not configurable per-loadout)

---

## Apply Flow Summary

```
1. Load loadout JSON
2. Select target agent(s)
3. Choose global mode: Merge (default) | Replace
4. Per-slot review:
   ┌─────────────────┬──────────┬─────────────────────────────────┐
   │ Slot            │ Action   │ Notes                           │
   ├─────────────────┼──────────┼─────────────────────────────────┤
   │ Model           │ Apply    │ "Use my models" toggle          │
   │ Persona         │ Confirm  │ "Change persona? Are you sure?" │
   │ Skills          │ Apply    │ Version mismatch notes           │
   │ Integrations    │ Manual   │ Setup checklist                 │
   │ Automations     │ Apply    │ Dependency warnings             │
   │ Memory          │ Apply    │ Structure only, never content   │
   └─────────────────┴──────────┴─────────────────────────────────┘
5. Backup current config (automatic)
6. Apply changes
7. Show results + rollback option
```

---

## Scrubbing Rules (export)

Before a loadout is shared, the PII scrubber (`scrub::scrub_loadout`) must:
- Remove all phone numbers, email addresses, physical addresses
- Remove API keys, tokens, passwords
- Remove USER.md content entirely
- Strip absolute file paths → relative
- Replace personal names in SOUL.md with `[human]` placeholder
- Flag anything it couldn't confidently scrub in `ScrubReport`

---

## Migration

Schema v1 (current Tauri export) → v2:
- Map 9 diagnostic slots to 6 canonical slots
- Restructure flat `details` into typed slot objects
- Add `tiers` to model slot
- Add `items` array to skills/integrations
- Preserve `meta` fields, bump `schema: 2`

A `migrate_v1_to_v2(loadout)` function handles this automatically.
