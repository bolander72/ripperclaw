---
layout: ../../../layouts/DocLayout.astro
title: Security
---

# Security

ClawClawGo scans every kit for common threats. Both `pack` and `add` run the same security checks automatically.

## What Gets Scanned

The scanner checks for:

- **Prompt injection** — Instructions that override system prompts
- **Shell exfiltration** — Commands that send data externally
- **Credential access** — Attempts to read keys, tokens, or passwords
- **PII exposure** — Leaking personal information
- **Dangerous commands** — `rm -rf`, `curl | bash`, etc.
- **Network access** — Unexpected external connections

## Trust Score

Every scan produces a score from 0-100:

- **90-100** — Safe to use
- **70-89** — Review findings, use with caution
- **Below 70** — High risk, don't use without thorough review

## How It Works

### When Adding a Kit

```bash
npx clawclawgo add garrytan/gstack
```

The `add` command clones the repo, scans all files, and reports findings. If blocking issues are found, it removes the clone and exits unless `--force` is passed.

### When Packing

```bash
npx clawclawgo pack --out kit.json
```

Security scan runs automatically and results are baked into the kit.json.

### When Pushing

```bash
npx clawclawgo push
```

Push runs pack + scan. Kits with blocking issues can't be pushed to the registry.

## False Positives

Some legitimate patterns trigger warnings:

- **Git clone commands** — Flagged as network access
- **Package installs** — Flagged as shell execution
- **API calls** — Flagged as external connections
- **Documentation mentioning dangerous commands** — Flagged even in educational context

If the kit is from a trusted source and the findings make sense, proceed with `--force`.

## Trust Tiers (Web App)

On [clawclawgo.com](https://clawclawgo.com), kits show trust tier badges:

- **Verified** — Maintained by the ClawClawGo team or verified authors
- **Community** — Scanned clean, has community traction (10+ stars)
- **Unreviewed** — New or unverified

## Red Flags

- Score below 70
- Credential access attempts
- Obfuscated commands (`eval $(base64 -d ...)`)
- Unexpected external network calls
- Unknown author

## Reporting Issues

Found a malicious kit? Open an issue tagged `security` at [github.com/bolander72/clawclawgo/issues](https://github.com/bolander72/clawclawgo/issues).
