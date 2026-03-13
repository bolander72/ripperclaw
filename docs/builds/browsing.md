# Browsing Builds

## The Feed

The **Feed** view in ClawClawGo shows builds published by other users on Nostr. It queries your configured relays for events with kind `38333`.

Each card shows:
- Build name
- Author (display name or truncated npub)
- Tags
- Published date
- **Remix badge**: indicator if this is a fork of another build
- **Remix count**: how many times this build has been forked

## Sorting

Control how builds are ordered:

| Sort Mode | Behavior |
|-----------|----------|
| **Recent** | Newest first (default) |
| **Hot** | Most remixed recently (weighted by count and recency) |

Hot sort surfaces builds that are actively being forked and built upon.

## Filtering

Narrow the feed by category:

- **By tag**: click any tag on a build card to filter to that tag
- **By template**: show only builds marked as starter templates
- **Clear filters**: click the active filter badge to reset

Filters stack: you can combine template + tag filtering.

## Provenance Tree

Click any build card to open the detail panel. The **Provenance** section shows:

- **Parent build**: the immediate ancestor (if this is a fork)
- **Original author**: who created the root build
- **Full ancestry chain**: clickable lineage back to the original

Navigate the tree to see how a build evolved through the community.

See the [Provenance guide](/guide/provenance) for details on how remix tracking works.

## Comparing

Click **Compare** on any build to see a side-by-side diff with your current agent:

- Which sections differ
- What models they use vs. yours
- Skills they have that you don't (and vice versa)
- Integration differences

## Importing from File

If someone shared a build file directly, you have two options:

### Drag and Drop

Drag a `.json` file from your file manager and drop it onto the **Builds** or **Feed** view. The build is imported immediately.

### File Picker

1. Go to **Builds** in the sidebar
2. Click **Import File**
3. Select the `.json` file
4. The build is saved to your local collection

Once imported, you can compare or apply it like any feed build.

## Applying

See the [Applying guide](/guide/applying) for the full apply flow: safety rules, model strategy options, and the step-by-step wizard.
