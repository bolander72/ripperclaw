# ClawClawGo - Phase 2-3 Plan

## Vision

ClawClawGo is a **search engine and marketplace for AI agent builds**. Privacy-first, decentralized, open source. Think DuckDuckGo for OpenClaw configurations.

Users can:
- **Search** for agent builds by capability, use case, personality, or creator
- **Explore** complete configurations with full transparency
- **Copy** builds and apply them to their own agents
- **Publish** anonymously (no identity required) or with verified identity (Nostr keys)
- **Remix** and evolve builds, with optional attribution

Core principles:
- **Privacy**: No tracking, no accounts required to browse, PII scrubber runs locally
- **Decentralization**: Nostr-based, no central authority, censorship-resistant
- **Transparency**: Every build shows exactly what's configured: no black boxes
- **Remixability**: Fork, modify, republish. Credit is optional but tracked.

## 1. Block Mapping (Real Data)

Map actual OpenClaw subsystems to cyberware blocks. Each block should show what's actually running, not just config keys.

| Block | Label | What Maps Here |
|------|-------|----------------|
| `heart` | Heart | HEARTBEAT.md tasks, heartbeat cron interval/model, cron job health |
| `soul` | Soul | SOUL.md, IDENTITY.md, USER.md: name, token count, personality |
| `brain` | Brain | LCM/LosslessClaw, lcm.db, memory files (handoff.md, daily notes, MEMORY.md, facts.md), DAG compaction |
| `os` | Operating System | OpenClaw version, gateway status, Node.js, platform/arch |
| `skeleton` | Skeleton | Primary model, subagent model, local model (Ollama), auth mode, max concurrency |
| `mouth` | Mouth | TTS provider (Edge/Kokoro), voice, speed, Kokoro model path |
| `ears` | Ears | STT (Whisper local), voice loop status, model size |
| `eyes` | Eyes | UniFi cameras (G4 Doorbell Pro), Peekaboo screen capture, image model, camera entities from HA |
| `nervousSystem` | Nervous System | Channels (BlueBubbles/iMessage), cron jobs, reminders, calendar (caldir), email (himalaya), Home Assistant, smart home devices |

### Detail Panel Per Block

Each block's detail panel should show:
- **Status**: active/degraded/offline with reason
- **Specs**: key-value pairs from real data
- **Sub-components**: e.g., Eyes shows each camera, Nervous System shows each channel/integration
- **Health**: last heartbeat, error count, etc.

### Data Sources in Rust Backend

| Data | Source |
|------|--------|
| OpenClaw config | `~/.openclaw/openclaw.json` |
| SOUL/IDENTITY/USER | `~/.openclaw/workspace/*.md` |
| HEARTBEAT tasks | `~/.openclaw/workspace/HEARTBEAT.md` (parse `- **name**:` lines) |
| Memory files | Check existence of `memory/{handoff,active-work,facts,YYYY-MM-DD}.md` |
| LCM database | `~/.openclaw/lcm.db` (SQLite: can query for stats) |
| Skills | Scan `/opt/homebrew/lib/node_modules/openclaw/skills/` + `~/.openclaw/workspace/skills/` |
| Cron jobs | `openclaw cron list --json` |
| System status | `openclaw status` |
| HA devices | Read from config or `memory/home-devices.md` |
| Ollama models | `ollama list` |

## 2. Import / Diff / Comparison View

### Export
Already works via CLI (`src/export.ts`). Produces a `Build` JSON.

### Import + Diff
- Load a `.build.json` file (drag-and-drop or file picker)
- Parse into `Build` type
- Run diff against current build
- Show side-by-side comparison:
  - Left: "Your Build" (current)
  - Right: "Their Build" (imported)
  - Highlighted differences per block
  - Skills only in yours / only in theirs / version differences

### UI
- New sidebar button: ⊕ (Compare)
- Split-pane view with block-by-block comparison
- Color coding: green = you have it, magenta = they have it, yellow = different version

## 3. The Feed: Search & Discovery Engine

### Options Evaluated

#### A. Nostr (Recommended)
**Pros:**
- Perfect fit: JSON events, relay-based pub/sub, built for discovery
- NIP-15 literally describes "Nostr Marketplace": close to our use case
- NIP-32 (Labeling) for tagging builds by template/category
- NIP-01 events are just signed JSON: builds ARE JSON
- Rust SDK exists: `nostr-sdk` (0.44.1): mature, well-maintained
- Free relays exist, can self-host too
- Users already have nostr keys if they're in the Bitcoin/crypto space (Alex/Rijndael is)
- Privacy: private builds stay local, public ones get published as events
- Censorship-resistant by design
- No server costs for us initially

**Cons:**
- Relay reliability varies
- Need to define a custom event kind for builds (straightforward via NIP-01)
- No built-in search beyond relay capabilities (NIP-50 helps)

**How it works:**
1. User generates or imports a nostr keypair
2. "Publish Build" → signs build JSON as a nostr event (custom kind, e.g., 38333)
3. Event published to configured relays
4. "The Feed" subscribes to events of that kind across relays
5. Other users see published builds, can import/diff

#### B. IPFS / Content-Addressed
**Pros:** Content-addressed, permanent, dedup
**Cons:** No discovery mechanism (need separate index), pinning costs, overkill for small JSON

#### C. Centralized API (clawclawgo.com)
**Pros:** Simple, fast, full control, easy search/discovery
**Cons:** Single point of failure, hosting costs, goes against the vibe

#### D. Hybrid: Nostr + Centralized Index
**Pros:** Best of both worlds. Nostr for distribution, centralized for discovery/search
**Cons:** More complexity

### Recommendation: Start with Nostr, add centralized index later if needed

Nostr fits the cyberpunk aesthetic perfectly. The data model is almost 1:1 with builds as signed JSON events. Discovery happens through relay subscriptions. Privacy is built in (don't publish = private). The Rust SDK is production-ready.

The Feed becomes a nostr client for build events. Users follow other builders, browse by template/tag, and import configs they like.

### Custom Nostr Event Kind

```
kind: 38333 (parameterized replaceable, NIP-33)
tags:
  - ["d", "<build-name>"]          # unique per author
  - ["t", "netrunner"]             # template tag
  - ["t", "voice"]                 # feature tags
  - ["version", "3"]               # build version
  - ["clawclawgo", "0.1.0"]        # client version
content: <build JSON string>
```

Parameterized replaceable means updating your build replaces the old event (same author + same "d" tag).

### Search & Privacy Features

**Anonymous browsing:**
- No accounts, no tracking, no login required to search and browse builds
- Relay subscriptions are anonymous by default
- Local PII scrubber runs before any data leaves your machine

**Anonymous publishing:**
- Generate ephemeral Nostr keypair for anonymous builds
- Or use your existing Nostr identity for verified attribution
- Choice is yours: identity is optional, not required

**Search capabilities:**
- Full-text search across build names, descriptions, tags
- Filter by template type (netrunner, voice, home, coding, etc.)
- Filter by creator (npub)
- Sort by newest, most copied, most remixed

**Discovery:**
- Featured builds (curated by community)
- Trending builds (most activity)
- Related builds (similar configs)
- Creator profiles (all builds from one npub)

### Phase 4: Bitcoin Permanence Layer

Nostr handles mutable, discoverable builds. Bitcoin handles permanence.

**Concept:** Inscribe a commitment (hash of build JSON) on-chain via ordinals. The full build lives on nostr (updatable), but the on-chain inscription proves "this build existed at this point in time."

**Use cases:**
- Proof-of-build: "I was running this exact config on this date"
- Build versioning with immutable history
- Premium/verified builds anchored on-chain
- Could tie into Taproot Wizards ecosystem

**Implementation (later):**
- SHA-256 hash of canonical build JSON
- Inscribe via ord CLI or Xverse API
- Store inscription ID in nostr event tags: `["i", "ord:<inscription_id>"]`
- UI: gold badge on builds with on-chain anchors

Not urgent. Build nostr first, add Bitcoin anchoring when the network has real users.

### Implementation Phases

**Phase 3a: Local Feed (no network)**
- Feed UI component with mock data
- Card layout showing other people's builds
- Click to view → comparison view

**Phase 3b: Nostr Integration**
- Add `nostr-sdk` to Rust backend
- Key management (generate, import, display npub)
- Publish command: sign + push to relays
- Subscribe command: pull build events from relays
- Feed populated from real nostr events

**Phase 3c: Social Features**
- Follow other builders (nostr follow list, NIP-02)
- Reactions/zaps on builds (NIP-25)
- Comments (NIP-22)
- Templates as curated collections
