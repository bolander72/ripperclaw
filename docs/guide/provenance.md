# Provenance & Remix System

ClawClawGo tracks the lineage of every build. When you fork or remix someone else's work, the ancestry chain is preserved and displayed.

## How It Works

When you apply a published build and later publish your modified version, ClawClawGo automatically:

1. Records the parent build's event ID
2. Adds fork tags to your published event
3. Displays the remix relationship in the feed

## Fork Tags

Published events include provenance information via Nostr tags:

```json
{
  "tags": [
    ["e", "<parent_event_id>", "", "fork"],
    ["p", "<original_author_npub>"]
  ]
}
```

| Tag | Purpose |
|-----|---------|
| `["e", parent_id, "", "fork"]` | Links to the parent build event |
| `["p", author_npub]` | Credits the original author |

Multiple levels of remixing create a chain: your build points to its parent, which points to its parent, and so on.

## Remix Badges

Build cards in the feed show remix status:

- **Remix count**: how many times this build has been forked
- **Fork indicator**: shows this build is based on someone else's work

Sort options:
- **Hot**: most remixed recently (weighted by recency and count)
- **Recent**: newest first (default)

## Provenance Tree

Click any build card to open the detail panel. The provenance section shows:

- **Parent build**: the immediate ancestor (if this is a fork)
- **Original author**: who created the root build
- **Ancestry chain**: full lineage back to the original

Each ancestor is clickable. Navigate the tree to see how a build evolved through the community.

## Future Plans

### Zap Splits (Deferred)

The original vision included Lightning payment splits: when someone tips your remix, a percentage automatically flows to the original creator.

This requires:
- NIP-57 (Lightning Zaps) support
- Relay infrastructure for split coordination
- Wallet integration in the app

This feature is planned but not yet implemented. The provenance tags are already structured to support it.

### Attribution UI

Planned improvements:
- Visual tree graph showing fork relationships
- Filter feed by "forks of X"
- "Upstream updates available" notifications when a parent build is updated

## Publishing a Remix

You don't need to do anything special. The app automatically detects when you're publishing a build that originated from the feed:

1. Apply a build from the feed
2. Make changes to the agent
3. Export and publish
4. ClawClawGo adds the fork tags automatically

## Ethics

Forking is encouraged. That's the point.

But:
- Credit is automatic via fork tags
- Don't remove attribution from SOUL.md or other persona files
- If you're publishing a minor edit, consider whether it adds value to the feed

Remixing thrives when people build on each other's work openly.
