# Browsing Loadouts

## The Feed

The **Feed** view in RipperClaw shows loadouts published by other users on Nostr. It queries your configured relays for events with kind `38333`.

Each card shows:
- Loadout name
- Author (display name or truncated npub)
- Tags
- Published date
- **Remix badge**: indicator if this is a fork of another loadout
- **Remix count**: how many times this loadout has been forked

## Sorting

Control how loadouts are ordered:

| Sort Mode | Behavior |
|-----------|----------|
| **Recent** | Newest first (default) |
| **Hot** | Most remixed recently (weighted by count and recency) |

Hot sort surfaces loadouts that are actively being forked and built upon.

## Filtering

Narrow the feed by category:

- **By tag**: click any tag on a loadout card to filter to that tag
- **By template**: show only loadouts marked as starter templates
- **Clear filters**: click the active filter badge to reset

Filters stack: you can combine template + tag filtering.

## Provenance Tree

Click any loadout card to open the detail panel. The **Provenance** section shows:

- **Parent loadout**: the immediate ancestor (if this is a fork)
- **Original author**: who created the root loadout
- **Full ancestry chain**: clickable lineage back to the original

Navigate the tree to see how a loadout evolved through the community.

See the [Provenance guide](/guide/provenance) for details on how remix tracking works.

## Comparing

Click **Compare** on any loadout to see a side-by-side diff with your current agent:

- Which slots differ
- What models they use vs. yours
- Skills they have that you don't (and vice versa)
- Integration differences

## Importing from File

If someone shared a loadout file directly, you have two options:

### Drag and Drop

Drag a `.json` file from your file manager and drop it onto the **Loadouts** or **Feed** view. The loadout is imported immediately.

### File Picker

1. Go to **Loadouts** in the sidebar
2. Click **Import File**
3. Select the `.json` file
4. The loadout is saved to your local collection

Once imported, you can compare or apply it like any feed loadout.

## Applying

See the [Applying guide](/guide/applying) for the full apply flow: safety rules, model strategy options, and the step-by-step wizard.
