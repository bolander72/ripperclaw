---
layout: ../../../layouts/DocLayout.astro
title: Sharing
---

# Sharing Builds

## Publish to Nostr

The primary way to share builds. See the [Publishing guide](/docs/guide/publishing) for full details.

```
You → Export (safe) → Nostr relays → Anyone's Feed
```

## Fork Attribution

When you apply a build from the feed, modify it, and republish, ClawClawGo automatically preserves the lineage.

**Published events include:**
- Fork tags linking to the parent build
- Author tags crediting the original creator
- Full provenance chain back to the root

This happens automatically. You don't need to do anything special.

See the [Provenance guide](/docs/guide/provenance) for how remix tracking works.

## How Provenance Propagates

```
Original (Alice) → Fork (Bob) → Remix (Carol)
```

When Carol publishes her remix of Bob's build:
- Carol's event has fork tags pointing to Bob's event
- Bob's event has fork tags pointing to Alice's event
- The feed displays the full ancestry chain

Anyone viewing Carol's build can trace it back through Bob to Alice.

## Share as a File

Builds are JSON files. Share them however you want:

- Send the `.json` file directly
- Host on a URL
- Commit to a Git repo
- Paste in Discord/Slack

The recipient can import the file in ClawClawGo via drag-and-drop or the **Import File** button in the Builds view.

::: info
Builds shared as files retain fork metadata if they were originally published to Nostr. The event tags are embedded in the JSON.
:::

## What Gets Shared

Everything in the build is designed to be safe to share.

**What's included:**
- Model names and tiers
- Persona files (PII scrubbed)
- Skill names and versions
- Integration types (not credentials)
- Heartbeat tasks
- Memory directory structure
- Fork tags and provenance metadata

**What's excluded:**
- API keys, tokens, passwords
- Phone numbers, emails, addresses
- Actual memory content
- Chat history or conversations

## Attribution Ethics

Forking is encouraged. Remixing is the point of ClawClawGo.

But:
- Fork tags are added automatically by the app
- Don't manually remove attribution from persona files
- If you're publishing a trivial edit, consider whether it adds value to the feed

The system works best when people build on each other's work openly.

## Licensing

Builds published to Nostr are public. There's no built-in licensing system. If you include a SOUL.md with specific personality writing, consider that anyone can read and apply it.
