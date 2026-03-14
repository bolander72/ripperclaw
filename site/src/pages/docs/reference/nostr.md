---
layout: ../../../layouts/DocLayout.astro
title: Nostr Protocol
---

# Nostr Protocol

ClawClawGo uses the [Nostr](https://nostr.com) protocol for decentralized build sharing. No accounts. No servers to manage. No platform lock-in.

## Event Kind

Builds use **kind `38333`**, a NIP-33 parameterized replaceable event. This means:

- Each build is identified by the `d` tag (build name)
- Publishing with the same name **replaces** the previous version
- Different names create separate build events

## Event Structure

```json
{
  "kind": 38333,
  "pubkey": "<author hex pubkey>",
  "created_at": 1741737600,
  "content": "<build JSON string>",
  "tags": [
    ["d", "Quinn"],
    ["t", "personal"],
    ["t", "voice"],
    ["t", "smart-home"],
    ["clawclawgo", "0.2.2"],
    ["e", "<parent_event_id>", "", "fork"],
    ["p", "<original_author_npub>"]
  ],
  "id": "<event id>",
  "sig": "<signature>"
}
```

### Tags

| Tag | Purpose | Required |
|-----|---------|----------|
| `d` | Build name (NIP-33 identifier) | Yes |
| `t` | Hashtag for categorization | No |
| `clawclawgo` | App version that created the event | Yes |
| `e` | Fork reference to parent build event | Only if forked |
| `p` | Credit to original author pubkey | Only if forked |

### Fork Tags

When a build is a remix or fork of another, the event includes provenance tags:

```json
["e", "<parent_event_id>", "", "fork"]
["p", "<original_author_pubkey>"]
```

The `e` tag (event reference) points to the immediate parent. The marker `"fork"` distinguishes this from other event references (like replies or mentions).

The `p` tag (pubkey reference) credits the original author. For multi-level forks, the original author is determined by traversing the fork chain.

Multiple `e` tags may exist if a build merges ideas from multiple parents (future feature).

## Key Management

Keys are stored at `~/.clawclawgo/keys.json`:

```json
{
  "nsec": "nsec1...",
  "npub": "npub1..."
}
```

File permissions are set to `0600` (owner read/write only).

### Key Operations

| Operation | App Location | Description |
|-----------|-------------|-------------|
| Generate | First publish / Settings | Creates a new key pair |
| Import | First publish / Settings | Import an existing `nsec` |
| Export | Settings → Reveal Key | Copy your `nsec` |
| Regenerate | Settings | Destroy old key, create new one |

## Profile Metadata (NIP-01)

Optional kind 0 metadata published alongside builds:

```json
{
  "name": "bolander72",
  "display_name": "Mike",
  "about": "Building AI agents",
  "picture": "https://...",
  "website": "https://clawclawgo.com",
  "nip05": "mike@clawclawgo.com"
}
```

## Default Relays

```
wss://relay.clawclawgo.com
```

Custom relays are persisted to `~/.clawclawgo/relays.json`.

## Feed Queries

The feed fetches events by filtering:

```json
{
  "kinds": [38333],
  "limit": 50
}
```

Results are sorted by `created_at` descending.

## NIPs Used

| NIP | Purpose |
|-----|---------|
| [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) | Basic protocol, kind 0 metadata |
| [NIP-33](https://github.com/nostr-protocol/nips/blob/master/33.md) | Parameterized replaceable events |

## NIP Registration Status

Kind 38333 is not yet registered in the [official NIP repository](https://github.com/nostr-protocol/nips). Registration requires at least 2 client implementations and 1 relay explicitly supporting the kind.

Current status:
- **Clients:** ClawClawGo (web app + CLI) - 1 of 2 needed
- **Relays:** Standard relays accept kind 38333 as an unknown event, but none explicitly support it yet

A draft NIP document is maintained at [`specs/nip-38333.md`](https://github.com/bolander72/clawclawgo/blob/main/specs/nip-38333.md) and will be submitted as a PR to the NIPs repo when the adoption criteria are met.

## Future

- **NIP-05** verification via `clawclawgo.com` (planned)
- **Zaps** (Lightning payments) for premium builds (exploratory)
- **NIP-51** lists for curated build collections
