---
layout: ../../../layouts/DocLayout.astro
title: Settings
---

# Settings

Configure your ClawClawGo identity, profile, and relays.

## Identity Management

Go to **Settings → Identity** to manage your Nostr keys.

### View Your Public Key

Your `npub` (public key) is your identity on Nostr. Share this when you want people to find your builds.

Example: `npub1h8nk2hyp8p98dek8kuq9ysjn7d7h58qd8gkttl73x8qlg0z9gkyqnmw3e0`

### Reveal Your Private Key

Your `nsec` (private key) is used to sign events. Keep it secret.

Click **Reveal** to view and copy your `nsec`. This is the only way to recover your identity if you lose access to the machine.

::: warning
Anyone with your `nsec` can publish builds as you. Store it securely. Never share it publicly.
:::

### Import a Key

If you already have a Nostr identity, import your existing `nsec`:

1. Click **Import Key**
2. Paste your `nsec1...` string
3. Confirm the import

This replaces your current key. Your old identity is no longer usable in ClawClawGo.

### Regenerate Keys

Destroy your current key pair and generate a new one:

1. Click **Regenerate**
2. Confirm you understand the old key will be lost
3. A new `npub` and `nsec` are created

::: danger
This is irreversible. Builds published under the old key remain on relays but you can't update or delete them without the old `nsec`.
:::

## Profile Metadata

Set your public profile information (NIP-01 kind 0 metadata).

| Field | Purpose |
|-------|---------|
| Display name | Human-readable name shown in the feed |
| Username | Short handle (e.g., `bolander72`) |
| Bio | Short description of who you are |
| Avatar URL | Profile picture (hosted image URL) |
| Website | Your homepage or portfolio |
| NIP-05 | Verification identifier (e.g., `you@yourdomain.com`) |

Click **Publish Profile** to broadcast changes to relays. This is a separate event from build publishes.

::: info
Profile metadata is optional. If you skip it, your builds will show your truncated `npub` instead of a display name.
:::

## Relay Management

Relays are Nostr servers that store and distribute events. ClawClawGo uses a default set but you can customize the list.

### Default Relays

- `wss://relay.clawclawgo.com` (primary relay)

### Add a Relay

1. Go to **Settings → Relays**
2. Enter the WebSocket URL (must start with `wss://`)
3. Click **Add**

Your builds will be published to all configured relays.

### Remove a Relay

Click the **×** button next to any relay to remove it.

::: warning
Removing a relay doesn't delete events already stored there. It only stops ClawClawGo from publishing future events to that relay.
:::

### Custom Relay Storage

Custom relays are saved to `~/.clawclawgo/relays.json`:

```json
{
  "relays": [
    "wss://relay.clawclawgo.com",
    "wss://relay.example.com"
  ]
}
```

## Files Created

| File | Purpose | Permissions |
|------|---------|-------------|
| `~/.clawclawgo/keys.json` | Your `nsec` and `npub` | `0600` (owner only) |
| `~/.clawclawgo/relays.json` | Custom relay list | `0644` (default) |

## Backup Recommendations

Your identity is your `nsec`. If you lose it, you lose the ability to update builds published under that key.

To back up your identity:

1. Go to **Settings → Identity**
2. Click **Reveal**
3. Copy your `nsec1...` string
4. Store it in a password manager or encrypted note

Don't store it in plain text in cloud storage or email.
