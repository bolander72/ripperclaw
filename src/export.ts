/**
 * Build Export - reads the local OpenClaw installation and builds a v2 build snapshot.
 * Sanitizes secrets, API keys, and PII. Only structure and versions leave the machine.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import type {
  Build,
  ModelBlock,
  PersonaBlock,
  SkillsBlock,
  IntegrationsBlock,
  AutomationsBlock,
  MemoryBlock,
} from "./schema/build.js";

// ── Helpers ─────────────────────────────────────────────────────────

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path: string): Promise<any> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function readText(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

function tokenEstimate(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.round(text.length / 4);
}

function tryExec(cmd: string): string | undefined {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 5000 }).trim();
  } catch {
    return undefined;
  }
}

function scrubPII(text: string): string {
  if (!text) return text;
  // Phone numbers
  text = text.replace(/\+?1?\d{10,11}/g, "[REDACTED_PHONE]");
  // Email addresses
  text = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[REDACTED_EMAIL]");
  // Street addresses (simple pattern)
  text = text.replace(
    /\d+\s+[\w\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct)\b[^.\n]*/gi,
    "[REDACTED_ADDRESS]"
  );
  return text;
}

function preview(text: string, maxLen = 500): string | undefined {
  if (!text) return undefined;
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

// ── Config Paths ────────────────────────────────────────────────────

function resolveClawPaths() {
  const home = homedir();
  const clawDir = join(home, ".openclaw");
  return {
    clawDir,
    config: join(clawDir, "openclaw.json"),
    workspace: join(clawDir, "workspace"),
    extensions: join(clawDir, "extensions"),
  };
}

// ── Block Extractors ────────────────────────────────────────────────

function buildModelBlock(config: any): ModelBlock {
  const defaults = config?.agents?.defaults || {};
  const model = defaults.model || {};
  const subagents = defaults.subagents || {};
  const heartbeat = defaults.heartbeat || {};
  const aliases = defaults.models || {};

  function buildTier(modelStr: string) {
    if (!modelStr || modelStr === "unknown") return undefined;
    const [provider, modelName] = modelStr.includes("/")
      ? modelStr.split("/", 2)
      : ["unknown", modelStr];
    const alias = aliases[modelStr]?.alias;
    const isLocal = provider === "ollama";
    const isPaid = !isLocal && provider !== "unknown";
    return {
      provider,
      model: modelName,
      ...(alias && { alias }),
      paid: isPaid,
      local: isLocal,
    };
  }

  const primaryModel = model.primary || "unknown";
  const subagentModel = subagents.model?.primary || primaryModel;
  const heartbeatModel = heartbeat.model || "unknown";

  const mainTier = buildTier(primaryModel);
  const subagentTier = buildTier(subagentModel);
  const heartbeatTier = buildTier(heartbeatModel);

  return {
    tiers: {
      ...(mainTier && { main: mainTier }),
      ...(subagentTier && { subagent: subagentTier }),
      ...(heartbeatTier && { heartbeat: heartbeatTier }),
    },
    routing: {
      description: `${mainTier?.alias || primaryModel} for main, ${subagentTier?.alias || subagentModel} for sub-agents, ${heartbeatTier?.alias || heartbeatModel} for heartbeats`,
    },
  };
}

async function buildPersonaBlock(workspace: string): Promise<PersonaBlock> {
  const soulPath = join(workspace, "SOUL.md");
  const identityPath = join(workspace, "IDENTITY.md");
  const agentsPath = join(workspace, "AGENTS.md");

  const identityContent = await fileExists(identityPath)
    ? await readText(identityPath)
    : null;
  const soulContent = await fileExists(soulPath)
    ? await readText(soulPath)
    : null;
  const agentsContent = await fileExists(agentsPath)
    ? await readText(agentsPath)
    : null;

  // Parse identity fields
  const identityName = identityContent
    ?.match(/\*\*Name:\*\*\s*(.+)/)?.[1]
    ?.trim();
  const identityCreature = identityContent
    ?.match(/\*\*Creature:\*\*\s*(.+)/)?.[1]
    ?.trim();
  const identityVibe = identityContent
    ?.match(/\*\*Vibe:\*\*\s*(.+)/)?.[1]
    ?.trim();

  return {
    identity: {
      ...(identityName && { name: identityName }),
      ...(identityCreature && { creature: identityCreature }),
      ...(identityVibe && { vibe: identityVibe }),
    },
    soul: soulContent
      ? {
          included: true,
          preview: preview(scrubPII(soulContent)),
          content: scrubPII(soulContent),
          tokenEstimate: tokenEstimate(soulContent),
        }
      : { included: false },
    user: {
      included: false,
      note: "USER.md excluded: contains personal information about the human",
    },
    agents: agentsContent
      ? {
          included: true,
          preview: preview(scrubPII(agentsContent)),
          content: scrubPII(agentsContent),
        }
      : { included: false },
  };
}

async function buildSkillsBlock(
  config: any,
  workspace: string
): Promise<SkillsBlock> {
  const items: SkillsBlock["items"] = [];

  // Bundled skills from config
  const allowBundled = config?.skills?.allowBundled || [];
  for (const skill of allowBundled) {
    items.push({
      name: skill,
      source: "bundled",
      description: `Bundled OpenClaw skill: ${skill}`,
      requiresConfig: false,
    });
  }

  // Workspace skills
  const skillsDir = join(workspace, "skills");
  if (await fileExists(skillsDir)) {
    try {
      const entries = await readdir(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillMd = join(skillsDir, entry.name, "SKILL.md");
          if (await fileExists(skillMd)) {
            const content = await readText(skillMd);
            const desc = content.match(/^#[^\n]*\n+([^\n]+)/)?.[1]?.trim();
            // Don't add if already in bundled list
            if (!allowBundled.includes(entry.name)) {
              items.push({
                name: entry.name,
                source: "clawhub",
                description: desc,
                requiresConfig: false,
              });
            }
          }
        }
      }
    } catch {
      // skills dir not readable
    }
  }

  // Plugin-installed skills
  const installs = config?.plugins?.installs || {};
  for (const [id, info] of Object.entries(installs)) {
    if (id === "bluebubbles") continue; // channel, not a skill
    const installInfo = info as any;
    if (!items.find((s) => s.name === id)) {
      items.push({
        name: id,
        version: installInfo.version,
        source: "clawhub",
      });
    }
  }

  return { items };
}

async function buildIntegrationsBlock(
  config: any,
  workspace: string
): Promise<IntegrationsBlock> {
  const items: IntegrationsBlock["items"] = [];

  // BlueBubbles (iMessage)
  if (config.channels?.bluebubbles?.enabled) {
    items.push({
      type: "channel",
      name: "iMessage (BlueBubbles)",
      provider: "bluebubbles",
      autoApply: false,
      docsUrl: "https://docs.openclaw.ai/integrations/bluebubbles",
    });
  }

  // Detect caldir
  if (tryExec("which caldir")) {
    items.push({
      type: "calendar",
      name: "Calendar (caldir)",
      provider: "caldir",
      autoApply: false,
    });
  }

  // Detect himalaya
  if (tryExec("which himalaya")) {
    items.push({
      type: "email",
      name: "Email (IMAP/SMTP)",
      provider: "himalaya",
      autoApply: false,
    });
  }

  // Detect Home Assistant (check TOOLS.md for HA reference)
  const toolsPath = join(workspace, "TOOLS.md");
  const toolsContent = await fileExists(toolsPath)
    ? await readText(toolsPath)
    : "";
  if (
    toolsContent.includes("Home Assistant") ||
    toolsContent.includes("home_assistant")
  ) {
    items.push({
      type: "smart-home",
      name: "Home Assistant",
      provider: "homeassistant",
      autoApply: false,
      docsUrl: "https://docs.openclaw.ai/integrations/home-assistant",
    });
  }

  // Detect gh CLI
  if (tryExec("which gh")) {
    items.push({
      type: "code",
      name: "GitHub",
      provider: "gh",
      autoApply: false,
    });
  }

  // Voice I/O
  if (
    toolsContent.includes("voice_loop") ||
    toolsContent.includes("Kokoro")
  ) {
    items.push({
      type: "voice",
      name: "Voice Loop (Whisper + Kokoro)",
      provider: "voice-loop",
      autoApply: false,
    });
  }

  return { items };
}

async function buildAutomationsBlock(
  config: any,
  workspace: string
): Promise<AutomationsBlock> {
  const heartbeatPath = join(workspace, "HEARTBEAT.md");
  const heartbeatContent = await fileExists(heartbeatPath)
    ? await readText(heartbeatPath)
    : null;
  const heartbeatTasks = heartbeatContent?.match(/^-\s/gm)?.length || 0;

  return {
    heartbeat: heartbeatContent
      ? {
          included: true,
          content: scrubPII(heartbeatContent),
          taskCount: heartbeatTasks,
        }
      : { included: false },
    cron: [],
  };
}

async function buildMemoryBlock(
  config: any,
  workspace: string
): Promise<MemoryBlock> {
  const memoryDirs: string[] = [];
  const templateFiles: Array<{ path: string; content: string }> = [];
  const memoryDir = join(workspace, "memory");

  if (await fileExists(memoryDir)) {
    // Collect directory structure
    async function walkDirs(dir: string, rel: string) {
      memoryDirs.push(rel + "/");
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.isDirectory() &&
          !entry.name.startsWith(".")
        ) {
          await walkDirs(
            join(dir, entry.name),
            rel + "/" + entry.name
          );
        }
      }
    }
    try {
      await walkDirs(memoryDir, "memory");
    } catch {
      // memory dir not readable
    }

    // Include template files (just structure, not actual content)
    for (const name of ["handoff.md", "active-work.md", "facts.md"]) {
      const title = name
        .replace(".md", "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      templateFiles.push({
        path: `memory/${name}`,
        content: `# ${title}\n\n_Updated each session._`,
      });
    }
  }

  const contextEngine =
    config?.plugins?.slots?.contextEngine || "legacy";
  const engineType =
    contextEngine === "lossless-claw" ? "lcm" : "default";

  return {
    structure: {
      directories: memoryDirs,
      templateFiles,
    },
    engine: {
      type: engineType,
      description:
        engineType === "lcm"
          ? "Lossless Context Management: auto-compacts conversation history"
          : "Default OpenClaw context engine",
    },
  };
}

// ── Main Export ──────────────────────────────────────────────────────

export interface ExportOptions {
  name?: string;
  author?: string;
  tags?: string[];
  description?: string;
}

export async function exportBuild(
  options: ExportOptions = {}
): Promise<Build> {
  const paths = resolveClawPaths();

  // Read config
  let config: any = {};
  if (await fileExists(paths.config)) {
    config = await readJson(paths.config);
  }

  // Build all blocks
  const modelBlock = buildModelBlock(config);
  const personaBlock = await buildPersonaBlock(paths.workspace);
  const skillsBlock = await buildSkillsBlock(config, paths.workspace);
  const integrationsBlock = await buildIntegrationsBlock(
    config,
    paths.workspace
  );
  const automationsBlock = await buildAutomationsBlock(
    config,
    paths.workspace
  );
  const memoryBlock = await buildMemoryBlock(config, paths.workspace);

  // Get OpenClaw version
  const openclawVersion =
    tryExec("openclaw --version")?.replace(/[^0-9.a-z-]/gi, "") ||
    undefined;

  const build: Build = {
    schema: 2,
    meta: {
      name:
        options.name ||
        `${personaBlock.identity?.name || "Agent"}'s Build`,
      agentName: personaBlock.identity?.name || "Agent",
      description:
        options.description ||
        personaBlock.identity?.vibe ||
        "An OpenClaw agent build",
      author:
        options.author ||
        tryExec("git config user.name") ||
        "local",
      version: 1,
      exportedAt: new Date().toISOString(),
      openclawVersion,
      tags: options.tags,
    },
    blocks: {
      model: modelBlock,
      persona: personaBlock,
      skills: skillsBlock,
      integrations: integrationsBlock,
      automations: automationsBlock,
      memory: memoryBlock,
    },
  };

  return build;
}
