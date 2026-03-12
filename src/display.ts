/**
 * Terminal display for builds and diffs.
 */

import type { Build, BuildDiff } from "./schema/build.js";

// ── Colors (ANSI) ───────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
};

const BLOCK_LABELS: Record<
  string,
  { icon: string; label: string }
> = {
  model: { icon: "⬢", label: "Model" },
  persona: { icon: "🎭", label: "Persona" },
  skills: { icon: "🔧", label: "Skills" },
  integrations: { icon: "🔌", label: "Integrations" },
  automations: { icon: "⏰", label: "Automations" },
  memory: { icon: "🧠", label: "Memory" },
};

// ── Build Display ───────────────────────────────────────────────────

export function displayBuild(build: Build): string {
  const lines: string[] = [];

  // Header
  lines.push("");
  lines.push(
    `${c.bold}${c.cyan}  CLAWCLAWGO - BUILD EXPORT${c.reset}`
  );
  lines.push(`${c.dim}  ${"─".repeat(50)}${c.reset}`);
  lines.push("");

  // Meta
  lines.push(`  ${c.bold}${build.meta.name}${c.reset}`);
  lines.push(
    `  ${c.dim}by ${build.meta.author} · v${build.meta.version} · ${build.meta.exportedAt.slice(0, 10)}${c.reset}`
  );
  if (build.meta.tags?.length) {
    lines.push(
      `  ${c.dim}tags: ${build.meta.tags.join(", ")}${c.reset}`
    );
  }
  if (build.meta.description) {
    lines.push(`  ${c.dim}${build.meta.description}${c.reset}`);
  }
  lines.push("");

  // Blocks
  lines.push(`  ${c.bold}BLOCKS${c.reset}`);
  lines.push(`  ${c.dim}${"─".repeat(50)}${c.reset}`);

  // Model
  if (build.blocks.model) {
    const info = BLOCK_LABELS["model"];
    lines.push("");
    lines.push(
      `  ${c.cyan}${info.icon}${c.reset} ${c.bold}${info.label}${c.reset}`
    );
    for (const [tier, tierInfo] of Object.entries(
      build.blocks.model.tiers
    )) {
      if (!tierInfo) continue;
      const flags = [
        tierInfo.paid && "💰 paid",
        tierInfo.local && "🏠 local",
      ]
        .filter(Boolean)
        .join(" ");
      lines.push(
        `    ${tier}: ${tierInfo.alias || tierInfo.model} (${tierInfo.provider}) ${flags}`
      );
    }
    if (build.blocks.model.routing?.description) {
      lines.push(
        `    ${c.dim}${build.blocks.model.routing.description}${c.reset}`
      );
    }
  }

  // Persona
  if (build.blocks.persona) {
    const info = BLOCK_LABELS["persona"];
    lines.push("");
    lines.push(
      `  ${c.cyan}${info.icon}${c.reset} ${c.bold}${info.label}${c.reset}`
    );
    const p = build.blocks.persona;
    if (p.identity?.name) {
      lines.push(`    name: ${p.identity.name}`);
    }
    if (p.identity?.creature) {
      lines.push(`    creature: ${p.identity.creature}`);
    }
    if (p.identity?.vibe) {
      lines.push(`    vibe: ${p.identity.vibe}`);
    }
    if (p.soul?.included) {
      lines.push(
        `    SOUL.md: ✅ included (~${p.soul.tokenEstimate || "?"} tokens)`
      );
    }
    if (p.agents?.included) {
      lines.push(`    AGENTS.md: ✅ included`);
    }
    lines.push(`    USER.md: ❌ excluded (personal)`);
  }

  // Skills
  if (build.blocks.skills && build.blocks.skills.items.length > 0) {
    const info = BLOCK_LABELS["skills"];
    lines.push("");
    lines.push(
      `  ${c.cyan}${info.icon}${c.reset} ${c.bold}${info.label}${c.reset} (${build.blocks.skills.items.length})`
    );
    for (const skill of build.blocks.skills.items) {
      const ver = skill.version ? `@${skill.version}` : "";
      const src = `${c.dim}[${skill.source}]${c.reset}`;
      const flag = skill.requiresConfig ? " ⚙️" : "";
      lines.push(
        `    ${c.green}${skill.name}${ver}${c.reset} ${src}${flag}`
      );
    }
  }

  // Integrations
  if (
    build.blocks.integrations &&
    build.blocks.integrations.items.length > 0
  ) {
    const info = BLOCK_LABELS["integrations"];
    lines.push("");
    lines.push(
      `  ${c.cyan}${info.icon}${c.reset} ${c.bold}${info.label}${c.reset} (${build.blocks.integrations.items.length})`
    );
    for (const integration of build.blocks.integrations.items) {
      lines.push(
        `    ${integration.name} ${c.dim}[${integration.provider}]${c.reset}`
      );
    }
  }

  // Automations
  if (build.blocks.automations) {
    const info = BLOCK_LABELS["automations"];
    lines.push("");
    lines.push(
      `  ${c.cyan}${info.icon}${c.reset} ${c.bold}${info.label}${c.reset}`
    );
    const a = build.blocks.automations;
    if (a.heartbeat?.included) {
      lines.push(
        `    Heartbeat: ${a.heartbeat.taskCount || 0} tasks`
      );
    }
    if (a.cron && a.cron.length > 0) {
      lines.push(`    Cron jobs: ${a.cron.length}`);
    }
  }

  // Memory
  if (build.blocks.memory) {
    const info = BLOCK_LABELS["memory"];
    lines.push("");
    lines.push(
      `  ${c.cyan}${info.icon}${c.reset} ${c.bold}${info.label}${c.reset}`
    );
    const m = build.blocks.memory;
    if (m.structure?.directories) {
      lines.push(
        `    Directories: ${m.structure.directories.length}`
      );
    }
    if (m.structure?.templateFiles) {
      lines.push(
        `    Template files: ${m.structure.templateFiles.length}`
      );
    }
    if (m.engine?.type) {
      lines.push(`    Engine: ${m.engine.type}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

// ── Diff Display ────────────────────────────────────────────────────

export function displayDiff(diff: BuildDiff): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(
    `${c.bold}${c.magenta}  CLAWCLAWGO - BUILD DIFF${c.reset}`
  );
  lines.push(`${c.dim}  ${"─".repeat(50)}${c.reset}`);

  if (
    diff.blockDiffs.length === 0 &&
    diff.skillsOnlyYours.length === 0 &&
    diff.skillsOnlyTheirs.length === 0 &&
    diff.skillVersionDiffs.length === 0 &&
    diff.integrationsOnlyYours.length === 0 &&
    diff.integrationsOnlyTheirs.length === 0
  ) {
    lines.push("");
    lines.push(`  ${c.green}Identical builds.${c.reset}`);
    lines.push("");
    return lines.join("\n");
  }

  // Block diffs
  for (const blockDiff of diff.blockDiffs) {
    const info =
      BLOCK_LABELS[blockDiff.block] || {
        icon: "?",
        label: blockDiff.block,
      };
    lines.push("");
    lines.push(
      `  ${c.cyan}${info.icon}${c.reset} ${c.bold}${info.label}${c.reset}`
    );

    for (const change of blockDiff.changes) {
      const y =
        change.yours === undefined
          ? `${c.dim}(none)${c.reset}`
          : String(change.yours);
      const t =
        change.theirs === undefined
          ? `${c.dim}(none)${c.reset}`
          : String(change.theirs);
      lines.push(`    ${change.field}:`);
      lines.push(`      ${c.red}- yours: ${y}${c.reset}`);
      lines.push(`      ${c.green}+ theirs: ${t}${c.reset}`);
    }
  }

  // Skill diffs
  if (diff.skillsOnlyYours.length > 0) {
    lines.push("");
    lines.push(`  ${c.bold}Skills only in yours:${c.reset}`);
    for (const name of diff.skillsOnlyYours) {
      lines.push(`    ${c.red}- ${name}${c.reset}`);
    }
  }

  if (diff.skillsOnlyTheirs.length > 0) {
    lines.push("");
    lines.push(`  ${c.bold}Skills only in theirs:${c.reset}`);
    for (const name of diff.skillsOnlyTheirs) {
      lines.push(`    ${c.green}+ ${name}${c.reset}`);
    }
  }

  if (diff.skillVersionDiffs.length > 0) {
    lines.push("");
    lines.push(`  ${c.bold}Skill version differences:${c.reset}`);
    for (const d of diff.skillVersionDiffs) {
      lines.push(
        `    ${c.yellow}~ ${d.name}: ${d.yours || "?"} → ${d.theirs || "?"}${c.reset}`
      );
    }
  }

  // Integration diffs
  if (diff.integrationsOnlyYours.length > 0) {
    lines.push("");
    lines.push(`  ${c.bold}Integrations only in yours:${c.reset}`);
    for (const provider of diff.integrationsOnlyYours) {
      lines.push(`    ${c.red}- ${provider}${c.reset}`);
    }
  }

  if (diff.integrationsOnlyTheirs.length > 0) {
    lines.push("");
    lines.push(`  ${c.bold}Integrations only in theirs:${c.reset}`);
    for (const provider of diff.integrationsOnlyTheirs) {
      lines.push(`    ${c.green}+ ${provider}${c.reset}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
