# Slots

Every loadout is made up of **6 slots**. Each slot is independent. You can swap, remix, or skip any of them.

## Model

The LLMs your agent uses and how it routes between them. Three tiers:

- **Main**: default for most tasks (highest quality)
- **Fast**: when speed matters (lower latency, still capable)
- **Free**: fallback for simple tasks (local or rate-limited models)

```json
{
  "tiers": {
    "main": { "provider": "anthropic", "model": "claude-opus-4-6", "paid": true },
    "fast": { "provider": "anthropic", "model": "claude-sonnet-4-5", "paid": true },
    "free": { "provider": "ollama", "model": "qwen3.5:4b", "paid": false }
  }
}
```

When applying, you can choose **"Use my models"** to remap tiers to your existing models instead of adopting the loadout's choices. This is useful when:

- The loadout uses paid models you don't have access to
- You prefer local models over API-based ones
- You want to test a loadout's structure without changing your model config

## Persona

Who the agent is: its identity, personality, and working style.

- **IDENTITY.md**: name, creature type, vibe, emoji
- **SOUL.md**: personality, communication style, anti-patterns, values
- **AGENTS.md**: workspace conventions, coding principles, session routines
- **USER.md**: info about the human (skipped by default on export, template on apply)

Applying a persona requires explicit confirmation since it changes the agent's core character.

## Skills

Installed skill packages that give the agent capabilities.

Skills come from two sources:
- **Bundled**: ship with OpenClaw (weather, github, calendar, etc.)
- **Community**: installed from [ClawHub](https://clawhub.com)

On apply, bundled skills are enabled automatically. Community skills are installed via `clawhub install`.

## Integrations

External services the agent connects to.

- Messaging channels (iMessage, Telegram, Discord, etc.)
- Calendar (caldir, Google Calendar)
- Email (himalaya, IMAP/SMTP)
- Smart home (Home Assistant, HomeKit)
- Voice I/O (Whisper STT, Kokoro TTS)
- Cameras (Peekaboo, UniFi)
- Developer tools (GitHub, SSH)

::: warning
Integrations are always manual setup. A loadout tells you what integrations the source agent used and links to setup docs, but never copies credentials or connection details.
:::

## Automations

Scheduled and recurring tasks.

- **Heartbeat tasks**: periodic checks defined in HEARTBEAT.md
- **Cron jobs**: scheduled via OpenClaw's cron system

On apply, HEARTBEAT.md is written directly. Cron jobs are flagged if they depend on integrations or skills that aren't set up yet.

## Memory

The agent's context management system.

- **Engine**: which memory system (e.g., LCM/lossless-claw)
- **Directory structure**: `memory/`, `memory/reference/`, `memory/research/`
- **Template files**: `handoff.md`, `active-work.md`, `facts.md`

::: info
Memory exports structure only, never actual content. Your agent's memories, conversations, and facts stay private.
:::
