# Quick Start

Get started with ClawClawGo and apply your first build in under 5 minutes.

## Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- Node.js 16+ (for CLI)

## 1. Browse Builds

Visit **[clawclawgo.com](https://clawclawgo.com)** to search and explore agent builds shared by the community. Find one that matches your use case.

## 2. Install the CLI

Clone the repo and install dependencies:

```bash
git clone https://github.com/bolander72/clawclawgo.git
cd clawclawgo
npm install
```

## 3. Export Your Current Agent

Capture your current agent config as a portable build:

```bash
node cli/clawclawgo.mjs export
```

This creates a `build.json` file with your agent's configuration.

## 4. Preview a Build

Before applying any build, preview what it will do:

```bash
node cli/clawclawgo.mjs preview build.json
```

This shows the security scan, dependency check, and what will be created.

## 5. Apply a Build

Create a new agent from a build:

```bash
node cli/clawclawgo.mjs apply build.json --agent my-bot --name "My Bot"
```

Your new agent gets its own workspace at `~/.openclaw/agents/my-bot/`. Restart OpenClaw to activate it.

## 6. Publish Your Build (Optional)

Share your build with the community via Nostr:

```bash
node cli/clawclawgo.mjs publish build.json
```

## Next Steps

- 
- [Exporting](/guide/exporting): customize your exports
- [Publishing](/guide/publishing): share on Nostr
