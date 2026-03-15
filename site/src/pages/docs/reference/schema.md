---
layout: ../../../layouts/DocLayout.astro
title: Kit Schema
---

# Kit Schema

Kits in the registry follow a strict schema. The `push` command builds and validates this format automatically — you never write kit.json by hand.

## Schema Version

Current version: `1`

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schema` | number | yes | Schema version (must be `1`) |
| `name` | string | yes | Kit name (usually repo directory name) |
| `description` | string | yes | What this kit does |
| `repoUrl` | string | yes | GitHub URL (must start with `https://github.com/`) |
| `owner` | string | yes | GitHub username or org |
| `compatibility` | string[] | yes | Detected agent compatibility |
| `skills` | Skill[] | yes | Skills found in the repo |
| `configs` | Config[] | yes | Agent config files found |
| `scan` | Scan | yes | Security scan results |
| `pushedAt` | string | yes | ISO 8601 timestamp |

## Skill Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Skill name (from SKILL.md frontmatter or directory name) |
| `description` | string | yes | What the skill does |
| `path` | string | yes | Relative path to skill directory |
| `license` | string | no | License from frontmatter |
| `compatibility` | string | no | Agent compatibility from frontmatter |
| `allowedTools` | string[] | no | Declared tool access |

## Config Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | yes | Config file path (e.g. `.cursorrules`) |
| `agent` | string | yes | Which agent uses this config |

## Scan Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trustScore` | number | yes | 0-100 trust score |
| `blocked` | boolean | yes | Whether blocking issues were found |
| `summary` | string | yes | Human-readable summary |
| `findings` | Finding[] | yes | Detailed scan findings |
| `scannedAt` | string | yes | ISO 8601 timestamp |

## Finding Object

| Field | Type | Description |
|-------|------|-------------|
| `severity` | string | `"block"` or `"warn"` |
| `message` | string | What was found |
| `match` | string | Matched text (truncated to 100 chars) |

## Validation

The `push` command validates every kit before submitting to the registry:

- All required fields must be present and correctly typed
- `repoUrl` must be a valid GitHub URL
- `trustScore` must be 0-100
- Skill paths must not reference sensitive directories
- Kit name must not match sensitive file names
- Blocked kits (scan.blocked = true) are rejected

Invalid kits are rejected before a PR is created.

## Example

```json
{
  "schema": 1,
  "name": "gstack",
  "description": "Agent skills from gstack",
  "repoUrl": "https://github.com/garrytan/gstack",
  "owner": "garrytan",
  "compatibility": ["agent-skills", "claude-code"],
  "skills": [
    {
      "name": "review",
      "description": "Code review skill",
      "path": "review"
    }
  ],
  "configs": [
    { "file": "CLAUDE.md", "agent": "claude-code" }
  ],
  "scan": {
    "trustScore": 95,
    "blocked": false,
    "summary": "0 blocked, 1 warnings",
    "findings": [],
    "scannedAt": "2026-03-15T00:00:00.000Z"
  },
  "pushedAt": "2026-03-15T00:00:00.000Z"
}
```
