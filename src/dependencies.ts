/**
 * Dependency Resolution - parse skill requirements and check system for installed dependencies
 */

import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Build, SkillItem, IntegrationItem } from "./schema/build.js";

// ── Types ───────────────────────────────────────────────────────────

export interface ModelRequirement {
  name: string;
  url: string;
  path: string;
  size?: string;
}

export interface ConfigRequirement {
  key: string;
  description?: string;
  required?: boolean;
}

export interface DependencyManifest {
  bins?: string[];
  brew?: string[];
  pip?: string[];
  npm?: string[];
  models?: ModelRequirement[];
  config?: ConfigRequirement[];
  platform?: string[];
  minOpenclawVersion?: string;
}

export interface DependencyCheck {
  name: string;
  type: "bin" | "brew" | "pip" | "npm" | "model" | "config" | "platform" | "version";
  installed: boolean;
  details?: string;
  installCmd?: string;
}

export interface DependencyReport {
  buildName: string;
  checks: DependencyCheck[];
  missingCount: number;
  summary: string;
}

// ── Provider to Package Mappings ────────────────────────────────────

const PROVIDER_DEPS: Record<string, DependencyManifest> = {
  caldir: {
    bins: ["caldir"],
    brew: ["caldir"],
  },
  himalaya: {
    bins: ["himalaya"],
    brew: ["himalaya"],
  },
  gh: {
    bins: ["gh"],
    brew: ["gh"],
  },
  bluebubbles: {
    config: [
      {
        key: "bluebubbles-server",
        description: "BlueBubbles server setup",
        required: true,
      },
    ],
  },
  homeassistant: {
    config: [
      {
        key: "HOMEASSISTANT_URL",
        description: "Home Assistant URL",
        required: true,
      },
      {
        key: "HOMEASSISTANT_TOKEN",
        description: "Home Assistant long-lived access token",
        required: true,
      },
    ],
  },
  "voice-loop": {
    bins: ["python3"],
    brew: ["portaudio"],
    pip: ["whisper", "kokoro-onnx"],
  },
};

// ── Parse Skill Requirements ────────────────────────────────────────

/**
 * Parse a SKILL.md file's frontmatter metadata for requires block
 */
export async function parseSkillRequires(skillMdPath: string): Promise<DependencyManifest | null> {
  try {
    const content = await readFile(skillMdPath, "utf-8");
    
    // Look for metadata block at start (YAML frontmatter or fenced code block)
    const metadataMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!metadataMatch) return null;

    const yamlText = metadataMatch[1];
    
    // Simple YAML parser for the requires block
    const requiresMatch = yamlText.match(/requires:\s*\n([\s\S]*?)(?=\n\S|\n*$)/);
    if (!requiresMatch) return null;

    const requiresText = requiresMatch[1];
    const manifest: DependencyManifest = {};

    // Parse each field
    const parseArray = (field: string): string[] | undefined => {
      const regex = new RegExp(`${field}:\\s*\\[([^\\]]+)\\]`, "i");
      const match = requiresText.match(regex);
      if (!match) return undefined;
      return match[1].split(",").map((s) => s.trim().replace(/['"]/g, ""));
    };

    manifest.bins = parseArray("allBins") || parseArray("anyBins");
    manifest.brew = parseArray("brew");
    manifest.pip = parseArray("pip");
    manifest.npm = parseArray("npm");

    // Parse platform array
    const platformMatch = requiresText.match(/platform:\s*\[([^\]]+)\]/);
    if (platformMatch) {
      manifest.platform = platformMatch[1].split(",").map((s) => s.trim().replace(/['"]/g, ""));
    }

    // Parse minOpenclawVersion
    const versionMatch = requiresText.match(/minOpenclawVersion:\s*["']([^"']+)["']/);
    if (versionMatch) {
      manifest.minOpenclawVersion = versionMatch[1];
    }

    // Parse models (simplified, assumes array of objects)
    const modelsMatch = requiresText.match(/models:\s*\n([\s\S]*?)(?=\n\s{0,6}\w+:|$)/);
    if (modelsMatch) {
      const modelsText = modelsMatch[1];
      const modelBlocks = modelsText.split(/\n\s*-\s+/).filter(Boolean);
      manifest.models = modelBlocks.map((block) => {
        const nameMatch = block.match(/name:\s*["']([^"']+)["']/);
        const urlMatch = block.match(/url:\s*["']([^"']+)["']/);
        const pathMatch = block.match(/path:\s*["']([^"']+)["']/);
        const sizeMatch = block.match(/size:\s*["']([^"']+)["']/);
        return {
          name: nameMatch?.[1] || "",
          url: urlMatch?.[1] || "",
          path: pathMatch?.[1] || "",
          size: sizeMatch?.[1],
        };
      }).filter((m) => m.name && m.url && m.path);
    }

    // Parse config (simplified)
    const configMatch = requiresText.match(/config:\s*\n([\s\S]*?)(?=\n\s{0,6}\w+:|$)/);
    if (configMatch) {
      const configText = configMatch[1];
      const configBlocks = configText.split(/\n\s*-\s+/).filter(Boolean);
      manifest.config = configBlocks.map((block) => {
        const keyMatch = block.match(/key:\s*["']([^"']+)["']/);
        const descMatch = block.match(/description:\s*["']([^"']+)["']/);
        const reqMatch = block.match(/required:\s*(true|false)/);
        return {
          key: keyMatch?.[1] || "",
          description: descMatch?.[1],
          required: reqMatch ? reqMatch[1] === "true" : undefined,
        };
      }).filter((c) => c.key);
    }

    return Object.keys(manifest).length > 0 ? manifest : null;
  } catch {
    return null;
  }
}

/**
 * Merge multiple dependency manifests, deduplicating entries
 */
export function mergeDependencies(...manifests: (DependencyManifest | null)[]): DependencyManifest {
  const result: DependencyManifest = {};

  const bins = new Set<string>();
  const brew = new Set<string>();
  const pip = new Set<string>();
  const npm = new Set<string>();
  const models: ModelRequirement[] = [];
  const config: ConfigRequirement[] = [];
  const platforms = new Set<string>();
  let minVersion: string | undefined;

  for (const manifest of manifests) {
    if (!manifest) continue;

    manifest.bins?.forEach((b) => bins.add(b));
    manifest.brew?.forEach((b) => brew.add(b));
    manifest.pip?.forEach((p) => pip.add(p));
    manifest.npm?.forEach((n) => npm.add(n));

    if (manifest.models) {
      for (const model of manifest.models) {
        if (!models.find((m) => m.name === model.name)) {
          models.push(model);
        }
      }
    }

    if (manifest.config) {
      for (const cfg of manifest.config) {
        if (!config.find((c) => c.key === cfg.key)) {
          config.push(cfg);
        }
      }
    }

    manifest.platform?.forEach((p) => platforms.add(p));

    // Take highest version requirement
    if (manifest.minOpenclawVersion) {
      if (!minVersion || compareVersions(manifest.minOpenclawVersion, minVersion) > 0) {
        minVersion = manifest.minOpenclawVersion;
      }
    }
  }

  if (bins.size > 0) result.bins = Array.from(bins).sort();
  if (brew.size > 0) result.brew = Array.from(brew).sort();
  if (pip.size > 0) result.pip = Array.from(pip).sort();
  if (npm.size > 0) result.npm = Array.from(npm).sort();
  if (models.length > 0) result.models = models;
  if (config.length > 0) result.config = config;
  if (platforms.size > 0) result.platform = Array.from(platforms).sort();
  if (minVersion) result.minOpenclawVersion = minVersion;

  return result;
}

/**
 * Build dependency manifest from a full build
 */
export async function buildDependencyManifest(
  build: Build,
  workspaceDir?: string
): Promise<DependencyManifest> {
  const manifests: DependencyManifest[] = [];

  // 1. Skills with requires blocks
  if (build.blocks.skills?.items && workspaceDir) {
    for (const skill of build.blocks.skills.items) {
      const skillMdPath = join(workspaceDir, "skills", skill.name, "SKILL.md");
      const requires = await parseSkillRequires(skillMdPath);
      if (requires) manifests.push(requires);
    }
  }

  // 2. Integrations with known providers
  if (build.blocks.integrations?.items) {
    for (const integration of build.blocks.integrations.items) {
      const providerDeps = PROVIDER_DEPS[integration.provider];
      if (providerDeps) manifests.push(providerDeps);
    }
  }

  return mergeDependencies(...manifests);
}

// ── System Checks ───────────────────────────────────────────────────

function tryExec(cmd: string): string | undefined {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 5000, stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {
    return undefined;
  }
}

function checkBin(name: string): DependencyCheck {
  const installed = tryExec(`which ${name}`) !== undefined;
  return {
    name,
    type: "bin",
    installed,
    installCmd: installed ? undefined : `(install ${name})`,
  };
}

function checkBrew(pkg: string): DependencyCheck {
  const installed = tryExec(`brew list ${pkg}`) !== undefined;
  return {
    name: pkg,
    type: "brew",
    installed,
    installCmd: installed ? undefined : `brew install ${pkg}`,
  };
}

function checkPip(pkg: string): DependencyCheck {
  const installed = tryExec(`pip show ${pkg}`) !== undefined || tryExec(`pip3 show ${pkg}`) !== undefined;
  return {
    name: pkg,
    type: "pip",
    installed,
    installCmd: installed ? undefined : `pip install ${pkg}`,
  };
}

function checkNpm(pkg: string): DependencyCheck {
  const installed = tryExec(`npm list -g ${pkg}`) !== undefined;
  return {
    name: pkg,
    type: "npm",
    installed,
    installCmd: installed ? undefined : `npm install -g ${pkg}`,
  };
}

function checkModel(model: ModelRequirement): DependencyCheck {
  const expandedPath = model.path.replace(/^~/, homedir());
  const fullPath = join(expandedPath, model.name);
  const installed = tryExec(`test -f "${fullPath}" && echo ok`) === "ok";
  return {
    name: model.name,
    type: "model",
    installed,
    details: installed ? fullPath : `${model.size || "?"} download from ${model.url}`,
    installCmd: installed ? undefined : `download ${model.size || ""} from ${model.url}`,
  };
}

function checkConfig(cfg: ConfigRequirement): DependencyCheck {
  // Simple check: just note it needs manual setup
  return {
    name: cfg.key,
    type: "config",
    installed: false,
    details: cfg.description,
    installCmd: "manual setup required",
  };
}

function checkPlatform(platforms: string[]): DependencyCheck {
  const current = process.platform;
  const supported = platforms.includes(current);
  return {
    name: `platform (${platforms.join(", ")})`,
    type: "platform",
    installed: supported,
    details: `you're on ${current}`,
  };
}

function checkVersion(minVersion: string): DependencyCheck {
  const current = tryExec("openclaw --version")?.replace(/[^0-9.]/g, "");
  if (!current) {
    return {
      name: `OpenClaw >= ${minVersion}`,
      type: "version",
      installed: false,
      details: "openclaw not found on PATH",
    };
  }
  const ok = compareVersions(current, minVersion) >= 0;
  return {
    name: `OpenClaw >= ${minVersion}`,
    type: "version",
    installed: ok,
    details: `you have ${current}`,
  };
}

/**
 * Check all dependencies in a manifest against the local system
 */
export function checkDependencies(manifest: DependencyManifest): DependencyCheck[] {
  const checks: DependencyCheck[] = [];

  manifest.bins?.forEach((bin) => checks.push(checkBin(bin)));
  manifest.brew?.forEach((pkg) => checks.push(checkBrew(pkg)));
  manifest.pip?.forEach((pkg) => checks.push(checkPip(pkg)));
  manifest.npm?.forEach((pkg) => checks.push(checkNpm(pkg)));
  manifest.models?.forEach((model) => checks.push(checkModel(model)));
  manifest.config?.forEach((cfg) => checks.push(checkConfig(cfg)));

  if (manifest.platform) {
    checks.push(checkPlatform(manifest.platform));
  }

  if (manifest.minOpenclawVersion) {
    checks.push(checkVersion(manifest.minOpenclawVersion));
  }

  return checks;
}

/**
 * Produce a human-readable dependency report
 */
export function generateDependencyReport(buildName: string, checks: DependencyCheck[]): DependencyReport {
  const missing = checks.filter((c) => !c.installed);
  const installed = checks.filter((c) => c.installed);

  const lines: string[] = [];
  lines.push(`Dependencies for "${buildName}":\n`);

  if (installed.length > 0) {
    lines.push("INSTALLED:");
    for (const check of installed) {
      lines.push(`  ✅ ${check.name}${check.details ? ` (${check.details})` : ""}`);
    }
    lines.push("");
  }

  if (missing.length > 0) {
    lines.push("MISSING:");
    for (const check of missing) {
      lines.push(`  ❌ ${check.name}${check.installCmd ? ` → ${check.installCmd}` : ""}`);
      if (check.details) {
        lines.push(`     ${check.details}`);
      }
    }
    lines.push("");
  }

  const summary = `${installed.length} installed, ${missing.length} missing`;

  return {
    buildName,
    checks,
    missingCount: missing.length,
    summary: lines.join("\n") + "\n" + summary,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Compare semver versions. Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  return 0;
}
