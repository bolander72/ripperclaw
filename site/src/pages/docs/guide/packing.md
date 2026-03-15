---
layout: ../../../layouts/DocLayout.astro
title: Packing
---

# Packing

The `pack` command scans your directory for agent config files and SKILL.md files, detects which agents they're compatible with, and generates a `kit.json` with security scan results baked in.

Sensitive files (SOUL.md, USER.md, MEMORY.md, IDENTITY.md, memory/, .env) are automatically excluded.

## Usage

```bash
npx clawclawgo pack [dir] [--out file]
```

**Options:**
- `[dir]` — Directory to scan (defaults to current directory)
- `--out <file>` — Write to file instead of stdout

## What Gets Detected

The pack command looks for:

- **SKILL.md** — Agent Skills standard skill files
- **Agent config files:**
  - `CLAUDE.md` (Claude Code)
  - `.cursorrules` (Cursor)
  - `.windsurfrules` (Windsurf)
  - `AGENTS.md` (OpenClaw, Codex)
  - `codex.json` (Codex)
  - `.clinerules` (Cline)
  - `.aider.conf.yml` (Aider)
  - `.continue/config.json` (Continue)
  - And more — see [AGENT-COMPATIBILITY.md](https://github.com/bolander72/clawclawgo/blob/main/AGENT-COMPATIBILITY.md)

## Example

```bash
npx clawclawgo pack                              # Pack current directory
npx clawclawgo pack ~/my-agent-skills             # Pack a specific directory
npx clawclawgo pack --out kit.json                # Write to file
```

## Next Steps

Once packed:
1. Review the generated `kit.json`
2. Push your repo to GitHub
3. Push to the registry with `npx clawclawgo push`
