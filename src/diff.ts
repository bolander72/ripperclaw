/**
 * Build Diff - compare two builds block by block.
 */

import type {
  Build,
  BuildDiff,
  BlockDiff,
  BlockName,
} from "./schema/build.js";

const BLOCK_NAMES: BlockName[] = [
  "model",
  "persona",
  "skills",
  "integrations",
  "automations",
  "memory",
];

function diffObjects(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined
): { field: string; yours: unknown; theirs: unknown }[] {
  const changes: { field: string; yours: unknown; theirs: unknown }[] =
    [];
  const allKeys = new Set([
    ...Object.keys(a || {}),
    ...Object.keys(b || {}),
  ]);

  for (const key of allKeys) {
    const va = (a || {})[key];
    const vb = (b || {})[key];
    if (JSON.stringify(va) !== JSON.stringify(vb)) {
      changes.push({ field: key, yours: va, theirs: vb });
    }
  }

  return changes;
}

export function diffBuilds(yours: Build, theirs: Build): BuildDiff {
  const blockDiffs: BlockDiff[] = [];

  for (const block of BLOCK_NAMES) {
    const a = yours.blocks[block] as
      | Record<string, unknown>
      | undefined;
    const b = theirs.blocks[block] as
      | Record<string, unknown>
      | undefined;

    // If both undefined, skip
    if (!a && !b) continue;

    const changes = diffObjects(a, b);
    if (changes.length > 0) {
      blockDiffs.push({ block, changes });
    }
  }

  // Skill diffs
  const yourSkills = new Map(
    yours.blocks.skills?.items.map((s) => [s.name, s]) || []
  );
  const theirSkills = new Map(
    theirs.blocks.skills?.items.map((s) => [s.name, s]) || []
  );

  const skillsOnlyYours: string[] = [];
  const skillsOnlyTheirs: string[] = [];
  const skillVersionDiffs: {
    name: string;
    yours?: string;
    theirs?: string;
  }[] = [];

  for (const [name, skill] of yourSkills) {
    if (!theirSkills.has(name)) {
      skillsOnlyYours.push(name);
    } else {
      const theirSkill = theirSkills.get(name)!;
      if (skill.version !== theirSkill.version) {
        skillVersionDiffs.push({
          name,
          yours: skill.version,
          theirs: theirSkill.version,
        });
      }
    }
  }

  for (const name of theirSkills.keys()) {
    if (!yourSkills.has(name)) {
      skillsOnlyTheirs.push(name);
    }
  }

  // Integration diffs
  const yourIntegrations = new Set(
    yours.blocks.integrations?.items.map((i) => i.provider) || []
  );
  const theirIntegrations = new Set(
    theirs.blocks.integrations?.items.map((i) => i.provider) || []
  );

  const integrationsOnlyYours: string[] = [];
  const integrationsOnlyTheirs: string[] = [];

  for (const provider of yourIntegrations) {
    if (!theirIntegrations.has(provider)) {
      integrationsOnlyYours.push(provider);
    }
  }

  for (const provider of theirIntegrations) {
    if (!yourIntegrations.has(provider)) {
      integrationsOnlyTheirs.push(provider);
    }
  }

  return {
    blockDiffs,
    skillsOnlyYours,
    skillsOnlyTheirs,
    skillVersionDiffs,
    integrationsOnlyYours,
    integrationsOnlyTheirs,
  };
}
