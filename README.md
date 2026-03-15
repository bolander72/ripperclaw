# ClawClawGo

The agent kits search engine. Find, explore, and add skill collections for Claude Code, Cursor, OpenClaw, and 30+ AI agents.

**[clawclawgo.com](https://clawclawgo.com)**

## What is it?

ClawClawGo is a search engine for AI agent kits — curated collections of skills packaged together. It aggregates kits from GitHub repos, indexes them, and lets you search across all of them in one place.

Kits follow the [Agent Skills](https://agentskills.io) open standard — SKILL.md files with YAML frontmatter describing what each skill does, which agents it works with, and what tools it needs.

## CLI

Two commands. No install required.

```bash
npx clawclawgo push [dir]                      # Push your kit to the registry
npx clawclawgo add <owner/repo> [--dest dir]   # Add a kit from GitHub
```

### Push

Scans your repo for SKILL.md files and agent configs, builds kit metadata internally, runs a security scan, validates against the kit schema, and auto-creates a PR to `registry/kits.json`. Requires `gh` CLI.

No sensitive files (SOUL.md, MEMORY.md, USER.md, memory/, .env) ever leave your machine.

```bash
npx clawclawgo push
```

### Add

Clone a kit repo to your machine. Finds all SKILL.md files and agent configs, runs a security scan, and generates a `CLAWCLAWGO.md` describing the kit.

```bash
npx clawclawgo add garrytan/gstack
npx clawclawgo add anthropics/skills --dest ~/kits
```

## Supported Agents

Claude Code · Cursor · Windsurf · OpenClaw · Codex · Cline · Aider · Continue · GitHub Copilot · Gemini CLI · VS Code · Roo Code · Goose · and more

See [AGENT-COMPATIBILITY.md](AGENT-COMPATIBILITY.md) for the full list.

## Registry

The registry is a JSON file at `registry/kits.json`. Each entry is a full kit object with skills, configs, compatibility, and scan results — validated against a strict schema.

To add your kit:

1. Push your skills to a GitHub repo
2. Run `npx clawclawgo push` to auto-create a PR

## Development

```bash
cd site && npm install && npm run dev    # Site
node cli/clawclawgo.mjs                  # CLI
```

## Stack

- **Site**: Astro + React + Tailwind CSS v4
- **CLI**: Node.js (zero dependencies)

## License

MIT
