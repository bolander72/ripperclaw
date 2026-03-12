# Nostr Protocol

RipperClaw uses the [Nostr](https://nostr.com) protocol for decentralized loadout sharing. No accounts. No servers to manage. No platform lock-in.

## Event Kind

Loadouts use **kind `38333`**, a NIP-33 parameterized replaceable event. This means:

- Each loadout is identified by the `d` tag (loadout name)
- Publishing with the same name **replaces** the previous version
- Different names create separate loadout events

## Event Structure

```json
{
  "kind": 38333,
  "pubkey": "<author hex pubkey>",
  "created_at": 1741737600,
  "content": "<loadout JSON string>",
  "tags": [
    ["d", "Quinn"],
    ["t", "personal"],
    ["t", "voice"],
    ["t", "smart-home"],
    ["ripperclaw", "0.1.0"],
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
| `d` | Loadout name (NIP-33 identifier) | Yes |
| `t` | Hashtag for categorization | No |
| `ripperclaw` | App version that created the event | Yes |
| `e` | Fork reference to parent loadout event | Only if forked |
| `p` | Credit to original author pubkey | Only if forked |

### Fork Tags

When a loadout is a remix or fork of another, the event includes provenance tags:

```json
["e", "<parent_event_id>", "", "fork"]
["p", "<original_author_pubkey>"]
```

The `e` tag (event reference) points to the immediate parent. The marker `"fork"` distinguishes this from other event references (like replies or mentions).

The `p` tag (pubkey reference) credits the original author. For multi-level forks, the original author is determined by traversing the fork chain.

Multiple `e` tags may exist if a loadout merges ideas from multiple parents (future feature).

## Key Management

Keys are stored at `~/.ripperclaw/keys.json`:

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

Optional kind 0 metadata published alongside loadouts:

```json
{
  "name": "bolander72",
  "display_name": "Mike",
  "about": "Building AI agents",
  "picture": "https://...",
  "website": "https://ripperclaw.com",
  "nip05": "mike@ripperclaw.com"
}
```

## Default Relays

```
wss://relay.damus.io
wss://nos.lol
wss://relay.nostr.band
```

Custom relays are persisted to `~/.ripperclaw/relays.json`.

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

## Future

- **NIP-05** verification via `ripperclaw.com` (planned)
- **Zaps** (Lightning payments) for premium loadouts (exploratory)
- **NIP-51** lists for curated loadout collections
