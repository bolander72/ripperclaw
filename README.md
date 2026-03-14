# ClawClawGo

The agent skills search engine. Find, pack, and share skills for Claude Code, Cursor, OpenClaw, and 30+ AI agents.

**[clawclawgo.com](https://clawclawgo.com)**

## What is it?

ClawClawGo is a search engine for AI agent skills. It aggregates skills from GitHub repos, indexes them, and lets you search across all of them in one place.

A "kit" is a collection of skills and agent configs packaged together. Kits follow the [Agent Skills](https://agentskills.io) open standard — a SKILL.md file with YAML frontmatter describing what the skill does, which agents it works with, and what tools it needs.

## CLI

```bash
npx clawclawgo <command>
```

| Command | What it does |
|---------|-------------|
| `pack [dir]` | Scan a directory, detect agent files, output a kit.json with scan results baked in |
| `add <url\|file>` | Download a kit to your machine |
| `scan <file>` | Security scan a kit (trust score + findings) |
| `preview <file>` | Pretty-print a kit summary |
| `publish [dir]` | Prepare your repo for the registry |
| `search <query>` | Search for kits on clawclawgo.com |

### Pack

Scans your directory for agent config files and SKILL.md files, detects which agents they're compatible with, and generates a `kit.json`. Security scan results are baked into the output so anyone reading the file can see the trust score.

```bash
clawclawgo pack ~/my-skills --out kit.json
```

Detected files: SKILL.md, CLAUDE.md, .cursorrules, .windsurfrules, AGENTS.md, openclaw.json, codex.json, .clinerules, .aider.conf.yml, .continue/config.json

### Add

Download a kit to your machine. Checks the baked-in scan results and blocks anything flagged (unless `--force`).

```bash
clawclawgo add https://example.com/kit.json
clawclawgo add ./someone-elses-kit.json --dest ~/kits
```

### Scan

Run the security scanner on any kit. Checks for prompt injection, shell exfiltration, credential access, PII, and dangerous commands. Outputs a trust score (0-100).

```bash
clawclawgo scan kit.json
```

## Supported Agents

ClawClawGo works with any agent that follows the Agent Skills standard, plus agents with their own config formats:

Claude Code · Cursor · Windsurf · OpenClaw · Codex · Cline · Aider · Continue · GitHub Copilot · Gemini CLI · VS Code · Roo Code · Goose · and more

See [AGENT-COMPATIBILITY.md](AGENT-COMPATIBILITY.md) for the full list.

## Registry

The registry is a simple JSON file at `registry/kits.json`. To add your kit:

1. `clawclawgo pack` your repo
2. `clawclawgo publish` to generate the registry entry
3. Submit a PR adding the entry to `registry/kits.json`

## Development

```bash
# Site
cd site && npm install && npm run dev

# CLI
node cli/clawclawgo.mjs --help
```

## Stack

- **Site**: Astro + React + Tailwind CSS v4
- **CLI**: Node.js (zero dependencies)

## License

MIT
