# Agent Compatibility Research

## The Agent Skills Standard (agentskills.io)

An open format originally developed by Anthropic, now adopted by 30+ agents. This IS the universal format.

### SKILL.md Spec (the standard format)
```
skill-name/
├── SKILL.md          # Required: YAML frontmatter + markdown instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
```

Frontmatter fields:
- `name` (required): lowercase, hyphens, 1-64 chars
- `description` (required): what it does + when to use it, max 1024 chars
- `license` (optional)
- `compatibility` (optional): environment requirements, max 500 chars
- `metadata` (optional): arbitrary key-value pairs (author, version, etc.)
- `allowed-tools` (optional, experimental): space-delimited pre-approved tools

### Compatible Agents (from agentskills.io)

| Agent | Company | URL | Skills Docs |
|---|---|---|---|
| Claude Code | Anthropic | claude.ai/code | code.claude.com/docs/en/skills |
| Claude | Anthropic | claude.ai | platform.claude.com/docs/en/agents-and-tools/agent-skills/overview |
| OpenAI Codex | OpenAI | developers.openai.com/codex | developers.openai.com/codex/skills/ |
| GitHub Copilot | Microsoft | github.com | docs.github.com/en/copilot/concepts/agents/about-agent-skills |
| VS Code Copilot | Microsoft | code.visualstudio.com | code.visualstudio.com/docs/copilot/customization/agent-skills |
| Cursor | Anysphere | cursor.com | cursor.com/docs/context/skills |
| Gemini CLI | Google | geminicli.com | geminicli.com/docs/cli/skills/ |
| Roo Code | Roo Code Inc | roocode.com | docs.roocode.com/features/skills |
| Goose | Block | block.github.io/goose/ | block.github.io/goose/docs/guides/context-engineering/using-skills/ |
| OpenHands | All Hands AI | all-hands.dev | docs.openhands.dev/overview/skills |
| OpenCode | SST | opencode.ai | opencode.ai/docs/skills/ |
| Amp | Sourcegraph | ampcode.com | ampcode.com/manual#agent-skills |
| Junie | JetBrains | junie.jetbrains.com | junie.jetbrains.com/docs/agent-skills.html |
| Mux | Coder | mux.coder.com | mux.coder.com/agent-skills |
| Letta | Letta | letta.com | docs.letta.com/letta-code/skills/ |
| Firebender | Firebender | firebender.com | docs.firebender.com/multi-agent/skills |
| TRAE | ByteDance | trae.ai | trae.ai/blog/trae_tutorial_0115 |
| Factory | Factory AI | factory.ai | docs.factory.ai/cli/configuration/skills.md |
| pi | badlogic | shittycodingagent.ai | github.com/badlogic/pi-mono |
| Databricks | Databricks | databricks.com | docs.databricks.com/aws/en/assistant/skills |
| Piebald | Piebald | piebald.ai | — |
| Agentman | Agentman | agentman.ai | agentman.ai/agentskills |
| Spring AI | VMware | spring.io | spring.io/blog/2026/01/13/spring-ai-generic-agent-skills/ |
| Autohand Code CLI | Autohand | autohand.ai | autohand.ai/docs/working-with-autohand-code/agent-skills.html |
| Mistral Vibe | Mistral AI | github.com/mistralai/mistral-vibe | — |
| Command Code | — | commandcode.ai | commandcode.ai/docs/skills |
| Ona | Ona | ona.com | ona.com/docs/ona/agents-md#skills |
| VT Code | — | github.com/vinhnx/vtcode | github.com/vinhnx/vtcode/blob/main/docs/skills/SKILLS_GUIDE.md |
| Qodo | Qodo | qodo.ai | qodo.ai/blog/how-i-use-qodos-agent-skills-to-auto-fix-issues |
| Laravel Boost | Laravel | github.com/laravel/boost | laravel.com/docs/12.x/boost#agent-skills |
| Emdash | — | emdash.sh | docs.emdash.sh/skills |
| Snowflake | Snowflake | snowflake.com | docs.snowflake.com/en/user-guide/cortex-code/extensibility |

### Agents with LEGACY config formats (pre-standard, still in use)

| Agent | Config Format | Notes |
|---|---|---|
| Cursor | `.cursorrules`, `.cursor/rules/` | May also support Agent Skills now |
| Windsurf (Codeium) | `.windsurfrules` | Single markdown file |
| Aider | `.aider.conf.yml`, conventions | YAML config + markdown conventions |
| Continue | `.continue/config.json` | JSON config |
| Cline | `.clinerules`, `.cline/` | Markdown rules |
| OpenClaw | `openclaw.json` + workspace files | SOUL.md, IDENTITY.md, AGENTS.md, HEARTBEAT.md, skills/ |

## Key Skill Sources to Index

1. **GitHub repos** — Search for repos with SKILL.md files, .cursorrules, etc.
2. **anthropics/skills** — Anthropic's official skill repo (installable via Claude Code plugin marketplace)
3. **skills.sh** — Vercel's leaderboard aggregator (tracks download counts)
4. **ClawHub** — OpenClaw's skill registry (clawhub.com)
5. **awesome-cursorrules** and similar curated lists
6. **Individual repos** like garrytan/gstack, pbakaus/impeccable, etc.

## What ClawClawGo Needs to Understand

### A "kit" / "stack" / "rig" = a collection of:
- Skills (SKILL.md folders — the universal unit)
- Config files (agent-specific: CLAUDE.md, .cursorrules, openclaw.json, etc.)
- System prompts / personas (SOUL.md, custom instructions)
- Workspace conventions (AGENTS.md, coding guidelines)

### Detection heuristics for GitHub crawler:
- `SKILL.md` in any subdirectory → Agent Skills standard
- `.cursorrules` or `.cursor/rules/` → Cursor rules
- `CLAUDE.md` or `.claude/` → Claude Code config
- `AGENTS.md` → Codex/OpenClaw config
- `.windsurfrules` → Windsurf config
- `openclaw.json` → OpenClaw kit
- `clawclawgo.json` or `kit.json` → ClawClawGo native kit
- Multiple SKILL.md files + setup script → "stack" (like gstack)

### Compatibility tagging:
- If it uses SKILL.md format → compatible with ALL 30+ agents
- If it has agent-specific files → tag with those agents
- If it's just markdown prompts → "universal" (works anywhere)
- If it has scripts/binaries → check platform requirements

## Export Formats (what ClawClawGo generates)

When a user finds skills/kits they want, ClawClawGo should generate:
1. **Agent Skills format** (SKILL.md) — works with 30+ agents
2. **Agent-specific configs** — .cursorrules, CLAUDE.md, etc.
3. **CLI one-liner** — `npx clawclawgo apply <url>`
4. **Downloadable ZIP** — all files ready to drop in

## Architecture Decision

ClawClawGo should:
- Adopt Agent Skills (SKILL.md) as the canonical internal format
- Index ALL sources (GitHub, skills.sh, ClawHub, curated lists)
- Auto-detect compatibility based on file structure
- Let users remix: pick skills from different kits, combine them
- Generate agent-specific output (not just SKILL.md — also .cursorrules, CLAUDE.md, etc.)
- Track which agents a skill is known to work with

This positions ClawClawGo as the cross-platform aggregator, not tied to any one agent ecosystem.
