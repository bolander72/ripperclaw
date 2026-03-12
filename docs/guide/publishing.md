# Publishing to Nostr

Share your loadout with the community by publishing it to the decentralized [Nostr](https://nostr.com) network.

## Why Nostr?

- **No accounts**: your identity is a cryptographic key pair
- **No platform lock-in**: loadouts are stored across multiple relays
- **No moderation bottleneck**: anyone can publish, anyone can relay
- **Censorship resistant**: no single point of failure

## First-Time Setup

The first time you publish, RipperClaw generates a Nostr key pair:

1. Click **Publish** (▲ button in the sidebar)
2. An identity screen shows your generated `npub` (public key)
3. Optionally import an existing key if you already use Nostr
4. Continue to configure your loadout for publishing

Keys are stored locally at `~/.ripperclaw/keys.json` with restricted permissions (0600).

## Publishing Flow

1. Click the **▲ Publish** button
2. Name your loadout and add tags
3. Review the safe export (PII scrubbed)
4. Publish: the loadout is sent to your configured relays

Published loadouts use **NIP-33** (parameterized replaceable events) with kind `38333`. This means publishing again with the same name updates the existing event rather than creating a duplicate.

### PII Scrubbing

Before publishing, RipperClaw automatically removes personally identifiable information:

**Removed from persona files:**
- Phone numbers
- Email addresses
- Physical addresses
- API keys and tokens
- Webhook URLs
- Internal IP addresses
- SSH host details

**Never included:**
- USER.md content (always excluded)
- Memory content (facts, handoffs, daily notes)
- Chat history or conversations
- Integration credentials

The scrubbing process preserves the structure and tone of your persona files while removing sensitive details. Review the preview to confirm everything looks safe before publishing.

## Managing Your Identity

Go to **Settings → Identity** to:

- View your `npub` (public key)
- Reveal and copy your `nsec` (private key): handle with care
- Import a different key
- Regenerate keys (irreversible for the old key)

## Profile Metadata

Optionally set your profile (NIP-01 kind 0):

- Display name
- Username
- Bio
- Avatar URL
- Website
- NIP-05 verification

This info is published to relays and shown alongside your loadouts.

## Relay Configuration

By default, RipperClaw publishes to:

- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`

Add or remove relays in **Settings → Relays**. Custom relays are saved to `~/.ripperclaw/relays.json`.

## Event Format

```json
{
  "kind": 38333,
  "content": "<loadout JSON>",
  "tags": [
    ["d", "<loadout-name>"],
    ["t", "<tag1>"],
    ["t", "<tag2>"],
    ["ripperclaw", "0.1.0"]
  ]
}
```

See the [Nostr Protocol Reference](/reference/nostr) for the full event spec.
