# What is ClawClawGo?

ClawClawGo is a desktop app and CLI for building, sharing, and remixing AI agent configurations called **builds**.

Think of it like dotfiles for AI agents. Your agent has a model, a persona, skills, integrations, automations, and memory. ClawClawGo packages all of that into a portable format that anyone can browse, copy, and apply to their own setup.

## The Problem

Setting up a useful AI agent takes time. You pick a model, write personality files, install skills, configure integrations, set up automations. Then your friend wants something similar and has to start from scratch.

## The Solution

ClawClawGo gives you:

- **Export** your working agent config as a build
- **Share** it on Nostr (decentralized, no accounts needed)
- **Browse** other people's builds in the feed
- **Apply** any build to create a new agent or update an existing one

## How It Works

Every AI agent (specifically [OpenClaw](https://github.com/openclaw/openclaw) agents) has a configuration: which models it uses, its personality files, installed skills, connected integrations, scheduled automations, memory settings, and more.

A build captures that configuration as flat JSON, scrubs sensitive data, and produces a portable file you can share across machines. There are no fixed categories. Whatever your agent uses, it goes in the build.

## What ClawClawGo Is Not

- **Not a hosting platform.** Your agent runs on your machine. ClawClawGo just helps you configure it.
- **Not a marketplace.** Builds are shared freely via Nostr. No payments (yet: zaps are on the roadmap).
- **Not an agent framework.** ClawClawGo works with [OpenClaw](https://openclaw.ai). It's the config layer, not the runtime.

## Next Steps

- [Quick Start](/guide/quickstart): get up and running in 5 minutes
- [Installation](/guide/installation): download the app
- 
