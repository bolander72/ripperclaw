# Installation

## Web App

Visit **[clawclawgo.com](https://clawclawgo.com)** to browse and search agent builds. No installation required.

## CLI

The CLI is a standalone Node.js tool for exporting, applying, and publishing builds.

### Quick Install

```bash
git clone https://github.com/bolander72/clawclawgo.git
cd clawclawgo
npm install
node cli/clawclawgo.mjs --help
```

### Requirements

- Node.js 18+
- OpenClaw installed (`~/.openclaw/openclaw.json` must exist)
- [ClawHub CLI](https://clawhub.com) for skill installation during apply

### Available Commands

```bash
# Export your current agent
node cli/clawclawgo.mjs export

# Preview a build
node cli/clawclawgo.mjs preview build.json

# Security scan
node cli/clawclawgo.mjs scan build.json

# Apply a build
node cli/clawclawgo.mjs apply build.json --agent my-bot

# Publish to Nostr
node cli/clawclawgo.mjs publish build.json
```

## Building the Site from Source

```bash
git clone https://github.com/bolander72/clawclawgo.git
cd clawclawgo/site
npm install
npm run dev    # Dev server
npm run build  # Production build
```
