# ClawClawGo - Post-Launch Plan

## ✅ Completed (v0.2.2)

### GitHub Pivot (March 2026)
- ✅ Removed all Nostr dependencies and code
- ✅ New Build schema v4 with `source`, `compatibility`, `permissions`, `trustTier`
- ✅ GitHub-based publishing flow (export → create repo → tag with `clawclawgo-build`)
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
- ✅ Build schema v4 with 6 core sections (model, persona, skills, integrations, automations, memory)
- ✅ Security scanner (5 passes: PII, prompt injection, automation safety, skill verification, exfiltration)
- ✅ Dependency resolution
- ✅ Static site with Astro + React
- ✅ Feed view with sample builds
- ✅ Search functionality
- ✅ Build detail modals
- ✅ Apply wizard

## 🚧 In Progress / Next Up

### Aggregator Backend
Build a Node.js service that:
- Polls GitHub API for repos tagged `clawclawgo-build`
- Fetches `build.json` from each repo
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
- Query ClawHub API for published builds
- Map ClawHub skill metadata to Build schema
- Show ClawHub builds in feed with `source: 'clawhub'`

### skills.sh Integration
- Query skills.sh API (if available)
- Map Vercel skill metadata to Build schema
- Show skills.sh builds in feed with `source: 'skillssh'`

### Trust Signals
- Display GitHub stats: stars, forks, last updated
- Show contributor count
- Show repo age
- Verify email domains for verified badge
- Manual curation for featured builds

## 🎯 Backlog

### Build Management
- **Import from URL** — apply builds directly from GitHub raw URLs
- **Build versioning** — track updates to published builds
- **Build collections** — curated lists of related builds
- **Build templates** — starter templates for common use cases

### Discovery
- **Advanced filters** — by model, skill type, integration, permission level
- **Sort options** — by stars, recency, trust score
- **Tag browsing** — browse all builds by tag
- **Creator profiles** — view all builds from a creator

### Community
- **Comments/reviews** — GitHub Discussions integration or separate comment system
- **Usage stats** — download/apply counts per build
- **Featured builds** — manually curated showcase
- **Build of the week** — highlight exceptional builds

### Developer Experience
- **TypeScript SDK** — programmatic access to build schema and CLI
- **VS Code extension** — export/apply builds from editor
- **Build linter** — validate builds before publishing
- **Build diff tool** — compare two builds visually

### Analytics (Privacy-First)
- **Plausible.io** integration (no cookies, GDPR-compliant)
- Track: page views, popular builds, search queries (anonymized)
- No user tracking, no session recording

### Performance
- **Build CDN** — cache popular build.json files on edge
- **Search index** — full-text search with Meilisearch or similar
- **Image optimization** — compress/optimize all assets
- **Code splitting** — lazy-load React components

## 🔬 Research & Exploration

### Decentralized Index
- IPFS for build storage
- Filecoin for archival
- Arweave for permanent storage

### Smart Contracts (Optional)
- On-chain build registry
- Reputation/trust via blockchain
- Donation/tip mechanism for creators

### AI-Powered Features
- **Build recommendations** — suggest builds based on current config
- **Auto-tagging** — analyze build.json and suggest tags
- **Similar builds** — find builds with overlapping skills/integrations
- **Build composition** — merge multiple builds intelligently

## 📊 Metrics to Track

- Total builds indexed
- Builds by source (GitHub, ClawHub, skills.sh)
- Trust tier distribution
- Most popular tags
- Most starred builds
- Most applied builds (if we add tracking)
- Security scan failure rate

## 🎨 Design Principles

1. **Privacy first** — no tracking, no accounts required to browse
2. **Fast** — static site, minimal JS, edge CDN
3. **Transparent** — show all config, no hidden layers
4. **Trustworthy** — clear trust signals, security scanning
5. **Open** — MIT license, open source, encourage forks

## 🚀 Launch Checklist (v1.0)

- [ ] Aggregator backend deployed and indexing GitHub
- [ ] At least 20 real builds in feed
- [ ] Documentation complete
- [ ] CLI published to npm
- [ ] Domain configured (clawclawgo.com)
- [ ] Analytics (Plausible) set up
- [ ] Open source announcement (Twitter, HN, Reddit)

## Vision

ClawClawGo becomes the **de facto registry** for AI agent builds across all platforms (OpenClaw, Claude Code, Cursor, Windsurf, etc.). Developers publish builds to GitHub, tag with `clawclawgo-build`, and users discover them via the feed.

Long-term: expand beyond OpenClaw to any AI agent framework that can consume a JSON config.
