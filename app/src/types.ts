/**
 * Build Schema v3 - TypeScript definitions for the Tauri app
 * Canonical source: ~/ripperdoc/src/schema/build.ts
 */

// ── Config Types ────────────────────────────────────────────────────

export interface ModelTier {
  /** Provider name (anthropic, openai, ollama, google, etc.) */
  provider: string;
  /** Full model identifier */
  model: string;
  /** Human-friendly name (e.g., Opus, Sonnet) */
  alias?: string;
  /** Whether this model requires a paid API key */
  paid?: boolean;
  /** Whether this model runs locally */
  local?: boolean;
}

export interface ModelConfig {
  tiers: {
    main?: ModelTier;
    subagent?: ModelTier;
    heartbeat?: ModelTier;
    utility?: ModelTier;
    [tier: string]: ModelTier | undefined;
  };
  routing?: {
    /** Human-readable routing strategy */
    description?: string;
  };
}

export interface PersonaConfig {
  identity?: {
    name?: string;
    creature?: string;
    vibe?: string;
  };
  soul?: {
    included: boolean;
    /** First ~500 chars for preview before applying */
    preview?: string;
    /** Full SOUL.md content (PII-scrubbed) */
    content?: string;
    tokenEstimate?: number;
  };
  user?: {
    /** USER.md is never included in shared builds */
    included: false;
    note?: string;
  };
  agents?: {
    included: boolean;
    preview?: string;
    content?: string;
  };
}

export interface SkillItem {
  /** Skill package name */
  name: string;
  /** Semver version string */
  version?: string;
  /** Where this skill comes from */
  source: "clawhub" | "local" | "custom" | "bundled";
  /** What this skill does */
  description?: string;
  /** Whether post-install configuration is needed */
  requiresConfig?: boolean;
  /** What configuration is needed */
  configHint?: string;
}

export interface SkillsConfig {
  items: SkillItem[];
}

export interface IntegrationItem {
  /** Integration category */
  type: "channel" | "calendar" | "email" | "smart-home" | "code" | "voice" | "camera" | "other";
  /** Human-readable integration name */
  name: string;
  /** Provider/tool identifier (bluebubbles, caldir, himalaya, etc.) */
  provider: string;
  /** Integrations are never auto-applied */
  autoApply: false;
  /** Link to setup docs (human-readable) */
  docsUrl?: string;
  /** Machine-readable setup guide URL (fetched by applying agent) */
  setupGuideUrl?: string;
}

export interface IntegrationsConfig {
  items: IntegrationItem[];
}

export interface CronSchedule {
  /** Schedule kind */
  kind: "at" | "every" | "cron";
  /** Time for 'at' kind (ISO 8601) */
  time?: string;
  /** Interval in ms for 'every' kind */
  everyMs?: number;
  /** Cron expression for 'cron' kind */
  expr?: string;
  [key: string]: unknown;
}

export interface CronItem {
  /** Cron job display name */
  name: string;
  /** Schedule definition */
  schedule: CronSchedule;
  /** What this automation does */
  description?: string;
  /** Dot-path references to required integrations/skills */
  dependsOn?: string[];
}

export interface AutomationsConfig {
  heartbeat?: {
    included: boolean;
    /** HEARTBEAT.md content */
    content?: string;
    taskCount?: number;
  };
  cron?: CronItem[];
}

export interface TemplateFile {
  /** Relative path within workspace */
  path: string;
  /** File template content */
  content: string;
}

export interface MemoryConfig {
  structure?: {
    /** Directories to create */
    directories?: string[];
    /** Template files to seed (never overwrites existing) */
    templateFiles?: TemplateFile[];
  };
  engine?: {
    type?: string;
    /** Human-readable description */
    description?: string;
  };
}

export interface ModelRequirement {
  /** Model file name */
  name: string;
  /** Download URL */
  url: string;
  /** Install path (supports ~) */
  path: string;
  /** File size (e.g., '82MB') */
  size?: string;
}

export interface ConfigRequirement {
  /** Environment variable or keychain key */
  key: string;
  /** What this config is for */
  description?: string;
  /** Whether this is required */
  required?: boolean;
}

export interface DependenciesConfig {
  /** Required binaries on PATH */
  bins?: string[];
  /** Homebrew packages */
  brew?: string[];
  /** Python pip packages */
  pip?: string[];
  /** npm global packages */
  npm?: string[];
  /** Model files to download */
  models?: ModelRequirement[];
  /** Configuration requirements */
  config?: ConfigRequirement[];
  /** Supported platforms (darwin, linux, win32) */
  platform?: string[];
  /** Minimum OpenClaw version */
  minOpenclawVersion?: string;
  /** Setup guides keyed by provider/tool name */
  guides?: Record<string, string>;
}

// ── Build ───────────────────────────────────────────────────────────

export interface BuildMeta {
  /** Display name for this build */
  name: string;
  /** Name of the agent this was exported from */
  agentName: string;
  /** One-liner about what this agent does */
  description?: string;
  /** Creator handle (e.g., @Bolander72) */
  author: string;
  /** Build revision number, bumps on re-export */
  version: number;
  /** ISO 8601 timestamp of export */
  exportedAt: string;
  /** OpenClaw version at export time */
  openclawVersion?: string;
  /** Searchable tags */
  tags?: string[];
}

export interface Build {
  /** Schema version. Must be 3. */
  schema: 3;
  /** Build metadata */
  meta: BuildMeta;
  /** Model configuration */
  model?: ModelConfig;
  /** Persona configuration */
  persona?: PersonaConfig;
  /** Skills configuration */
  skills?: SkillsConfig;
  /** Integrations configuration */
  integrations?: IntegrationsConfig;
  /** Automations configuration */
  automations?: AutomationsConfig;
  /** Memory configuration */
  memory?: MemoryConfig;
  /** Dependency manifest */
  dependencies?: DependenciesConfig;
}

// ── Security Types ──────────────────────────────────────────────────

export interface SecurityFinding {
  severity: "block" | "warn" | "info";
  category: "prompt-injection" | "automation" | "exfiltration" | "skill" | "pii";
  location: string;
  message: string;
  match?: string;
  pattern?: string;
}

export interface SecurityReport {
  buildName: string;
  scannedAt: string;
  trustScore: number;
  findings: SecurityFinding[];
  blocked: boolean;
  summary: string;
}

// ── Diff ────────────────────────────────────────────────────────────

export interface BuildDiff {
  /** Top-level keys that differ */
  keyDiffs: {
    key: string;
    yours: unknown;
    theirs: unknown;
  }[];
  /** Skills only in your build */
  skillsOnlyYours: string[];
  /** Skills only in theirs */
  skillsOnlyTheirs: string[];
  /** Skills in both but different versions */
  skillVersionDiffs: { name: string; yours?: string; theirs?: string }[];
  /** Integrations only in your build */
  integrationsOnlyYours: string[];
  /** Integrations only in theirs */
  integrationsOnlyTheirs: string[];
}


