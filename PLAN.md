# ClawClawGo - Post-Launch Plan

## ✅ Completed (v0.2.2)

### GitHub Pivot (March 2026)
- ✅ Removed all Nostr dependencies and code
- ✅ New Kit schema v4 with `source`, `compatibility`, `permissions`, `trustTier`
- ✅ GitHub-based publishing flow (export → create repo → tag with `clawclawgo-kit`)
- ✅ Multi-source aggregation (GitHub, ClawHub, skills.sh)
- ✅ Enhanced security scanner with permission cross-checking
- ✅ Trust tier assignment based on GitHub signals (stars, forks, activity)
- ✅ CLI installable via npx (`npx clawclawgo export/apply/scan`)
- ✅ Animated sprite logo for loading states
- ✅ Feed shows source badges, compatibility, trust tiers
- ✅ Settings manages GitHub connection, preferred sources, filters
- ✅ Search filters by source and compatibility

### Core Features (Phase 1-2)
- ✅ CLI: export, apply, scan, preview
- ✅ Kit schema v4 with 6 core sections (model, persona, skills, integrations, automations, memory)
- ✅ Security scanner (5 passes: PII, prompt injection, automation safety, skill verification, exfiltration)
- ✅ Dependency resolution
- ✅ Static site with Astro + React
- ✅ Feed view with sample kits
- ✅ Search functionality
- ✅ Kit detail modals
- ✅ Apply wizard

## 🚧 In Progress / Next Up

### Aggregator Backend
Build a Node.js service that:
- Polls GitHub API for repos tagged `clawclawgo-kit`
- Fetches `kit.json` from each repo
- Runs security scanner
- Assigns trust tier based on stars, forks, age, contributors
- Stores metadata in SQLite or JSON
- Exposes JSON API for the frontend
- Refreshes index every 6-24 hours

**Stack:**
- Node.js + TypeScript
- GitHub REST API (Octokit)
- SQLite for caching
- Runs as cron job or long-running service

### ClawHub Integration
- Query ClawHub API for published kits
- Map ClawHub skill metadata to Kit schema
- Show ClawHub kits in feed with `source: 'clawhub'`

### skills.sh Integration
- Query skills.sh API (if available)
- Map Vercel skill metadata to Kit schema
- Show skills.sh kits in feed with `source: 'skillssh'`

### Trust Signals
- Display GitHub stats: stars, forks, last updated
- Show contributor count
- Show repo age
- Verify email domains for verified badge
- Manual curation for featured kits

## 🎯 Backlog

### Kit Management
- **Import from URL** — apply kits directly from GitHub raw URLs
- **Kit versioning** — track updates to published kits
- **Kit collections** — curated lists of related kits
- **Kit templates** — starter templates for common use cases

### Discovery
- **Advanced filters** — by model, skill type, integration, permission level
- **Sort options** — by stars, recency, trust score
- **Tag browsing** — browse all kits by tag
- **Creator profiles** — view all kits from a creator

### Community
- **Comments/reviews** — GitHub Discussions integration or separate comment system
- **Usage stats** — download/apply counts per kit
- **Featured kits** — manually curated showcase
- **Kit of the week** — highlight exceptional kits

### Developer Experience
- **TypeScript SDK** — programmatic access to kit schema and CLI
- **VS Code extension** — export/apply kits from editor
- **Kit linter** — validate kits before publishing
- **Kit diff tool** — compare two kits visually

### Analytics (Privacy-First)
- **Plausible.io** integration (no cookies, GDPR-compliant)
- Track: page views, popular kits, search queries (anonymized)
- No user tracking, no session recording

### Performance
- **Kit CDN** — cache popular kit.json files on edge
- **Search index** — full-text search with Meilisearch or similar
- **Image optimization** — compress/optimize all assets
- **Code splitting** — lazy-load React components

## 🔬 Research & Exploration

### Decentralized Index
- IPFS for kit storage
- Filecoin for archival
- Arweave for permanent storage

### Smart Contracts (Optional)
- On-chain kit registry
- Reputation/trust via blockchain
- Donation/tip mechanism for creators

### AI-Powered Features
- **Kit recommendations** — suggest kits based on current config
- **Auto-tagging** — analyze kit.json and suggest tags
- **Similar kits** — find kits with overlapping skills/integrations
- **Kit composition** — merge multiple kits intelligently

## 📊 Metrics to Track

- Total kits indexed
- Builds by source (GitHub, ClawHub, skills.sh)
- Trust tier distribution
- Most popular tags
- Most starred kits
- Most applied kits (if we add tracking)
- Security scan failure rate

## 🎨 Design Principles

1. **Privacy first** — no tracking, no accounts required to browse
2. **Fast** — static site, minimal JS, edge CDN
3. **Transparent** — show all config, no hidden layers
4. **Trustworthy** — clear trust signals, security scanning
5. **Open** — MIT license, open source, encourage forks

## 🚀 Launch Checklist (v1.0)

- [ ] Aggregator backend deployed and indexing GitHub
- [ ] At least 20 real kits in feed
- [ ] Documentation complete
- [ ] CLI published to npm
- [ ] Domain configured (clawclawgo.com)
- [ ] Analytics (Plausible) set up
- [ ] Open source announcement (Twitter, HN, Reddit)

## Vision

ClawClawGo becomes the **de facto registry** for AI agent kits across all platforms (OpenClaw, Claude Code, Cursor, Windsurf, etc.). Developers publish kits to GitHub, tag with `clawclawgo-kit`, and users discover them via the feed.

Long-term: expand beyond OpenClaw to any AI agent framework that can consume a JSON config.
