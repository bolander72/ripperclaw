---
layout: ../../../layouts/DocLayout.astro
title: Security
---

# Security

ClawClawGo bakes security scanning into every kit. The `scan` command checks for common threats in agent skills and configs.

## What Gets Scanned

The scanner looks for:

- **Prompt injection** — Instructions that override system prompts
- **Shell exfiltration** — Commands that send data externally
- **Credential access** — Attempts to read keys, tokens, or passwords
- **PII exposure** — Leaking personal information
- **Dangerous commands** — `rm -rf`, `curl | bash`, etc.
- **Network access** — Unexpected external connections

## Trust Score

Every kit gets a score from 0-100:

- **90-100** — Safe to use
- **70-89** — Review findings, use with caution
- **Below 70** — High risk, don't use without thorough review

The score is baked into `kit.json` so you can see it before downloading.

## Running a Scan

```bash
# Scan a kit
clawclawgo scan kit.json

# Scan before packing
clawclawgo pack --scan
```

Output:

```
Security Scan Results
━━━━━━━━━━━━━━━━━━━━━

Trust Score: 95/100 ✓

Findings:
  [LOW] External network call in setup.sh
    → curl https://example.com/install.sh
    → Consider reviewing install script
```

## How It Works

When you run `pack`, the scan runs automatically and results are stored in the `kit.json`:

```json
{
  "scan": {
    "score": 95,
    "findings": [
      {
        "severity": "low",
        "type": "network",
        "message": "External network call in setup.sh",
        "file": "setup.sh",
        "line": 12
      }
    ],
    "timestamp": "2024-03-14T17:00:00Z"
  }
}
```

## Using Kits with Findings

When you `add` a kit:

```bash
clawclawgo add https://example.com/kit.json
```

ClawClawGo checks the baked-in scan:

- **Score 90+** — Proceeds
- **Score 70-89** — Warns, asks for confirmation
- **Score <70** — Blocks (use `--force` to override)

## Review Findings Yourself

Don't trust scores blindly. Read the findings:

```bash
clawclawgo scan kit.json
```

Check:
- What files are flagged?
- Are the warnings legitimate or false positives?
- Do you trust the kit author?

## False Positives

Some legitimate patterns trigger warnings:

- **Git clone commands** — Flagged as network access
- **Package installs** — Flagged as shell execution
- **API calls** — Flagged as external connections

If the kit is from a trusted source and the findings make sense, it's safe to proceed.

## Best Practices

**Before publishing:**
1. Run `clawclawgo scan kit.json`
2. Fix any high-severity findings
3. Document why low-severity findings are safe

**Before using:**
1. Check the trust score
2. Review findings
3. Inspect flagged files yourself
4. Only use kits from sources you trust

**Red flags:**
- Score below 70
- Credential access attempts
- Obfuscated commands (`eval $(base64 -d ...)`)
- Unexpected external network calls
- Author you don't recognize

## Reporting Issues

Found a malicious kit in the registry?

1. Open an issue: [github.com/bolander72/clawclawgo/issues](https://github.com/bolander72/clawclawgo/issues)
2. Tag it `security`
3. Include the kit ID and findings

We'll review and remove if confirmed.
