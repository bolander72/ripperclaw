/**
 * Build Security Scanner - detect malicious patterns in builds before apply/publish
 */

import type { Build } from "./schema/build.js";

// ── Types ───────────────────────────────────────────────────────────

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

// ── Pattern Definitions ─────────────────────────────────────────────

interface PatternRule {
  pattern: RegExp;
  severity: "block" | "warn";
  message: string;
  category: SecurityFinding["category"];
}

const PROMPT_INJECTION_PATTERNS: PatternRule[] = [
  {
    pattern: /ignore.*(?:previous|above|prior).*instructions/i,
    severity: "block",
    message: "Instructions to ignore previous instructions",
    category: "prompt-injection",
  },
  {
    pattern: /do\s+not\s+(?:tell|inform|notify|alert).*user/i,
    severity: "block",
    message: "Instructions to hide behavior from user",
    category: "prompt-injection",
  },
  {
    pattern: /(?:disable|bypass|skip|ignore).*(?:safety|security|permission)/i,
    severity: "block",
    message: "Instructions to disable safety features",
    category: "prompt-injection",
  },
  {
    pattern: /keep\s+(?:this|it)\s+(?:secret|hidden|private)/i,
    severity: "block",
    message: "Instructions to keep secrets from user",
    category: "prompt-injection",
  },
  {
    pattern: /repeat\s+(?:your|the|system)\s+(?:instructions|prompt)/i,
    severity: "block",
    message: "System prompt extraction attempt",
    category: "prompt-injection",
  },
  {
    pattern: /exec\s*\(/i,
    severity: "warn",
    message: "Contains exec() call",
    category: "prompt-injection",
  },
  {
    pattern: /eval\s*\(/i,
    severity: "warn",
    message: "Contains eval() call",
    category: "prompt-injection",
  },
  {
    pattern: /base64\s+(?:-d|--decode)/i,
    severity: "warn",
    message: "Base64 decode operation (possible obfuscation)",
    category: "prompt-injection",
  },
  {
    pattern: /\b(?:0x)?[0-9a-f]{64,}\b/i,
    severity: "warn",
    message: "Long hex string (possible obfuscation)",
    category: "prompt-injection",
  },
  {
    pattern: /(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}/,
    severity: "warn",
    message: "Bitcoin address found (potential scam)",
    category: "exfiltration",
  },
];

const AUTOMATION_PATTERNS: PatternRule[] = [
  {
    pattern: /\|\s*curl\s+.*https?:\/\//i,
    severity: "block",
    message: "Shell command pipes output to external URL",
    category: "automation",
  },
  {
    pattern: />\s*\/dev\/tcp\//i,
    severity: "block",
    message: "Network exfiltration via /dev/tcp",
    category: "automation",
  },
  {
    pattern: /\/bin\/bash\s+-i/i,
    severity: "block",
    message: "Interactive shell invocation (reverse shell)",
    category: "automation",
  },
  {
    pattern: /nc\s+(?:-e|--exec)/i,
    severity: "block",
    message: "Netcat with exec (reverse shell)",
    category: "automation",
  },
  {
    pattern: /python\s+-c\s+["']import\s+socket/i,
    severity: "block",
    message: "Python socket import (potential reverse shell)",
    category: "automation",
  },
  {
    pattern: /rm\s+-rf\s+(?:\/|~\/(?!\.openclaw))/i,
    severity: "block",
    message: "Dangerous file deletion outside workspace",
    category: "automation",
  },
  {
    pattern: /security\s+find-generic-password/i,
    severity: "block",
    message: "Keychain credential access",
    category: "automation",
  },
  {
    pattern: /cat\s+~\/\.ssh\//i,
    severity: "block",
    message: "SSH key access",
    category: "automation",
  },
  {
    pattern: /(?:brew|pip|npm|apt-get)\s+install/i,
    severity: "block",
    message: "Package installation without user consent",
    category: "automation",
  },
  {
    pattern: /curl\s+.*https?:\/\//i,
    severity: "warn",
    message: "curl usage (review for legitimacy)",
    category: "automation",
  },
  {
    pattern: /wget\s+.*https?:\/\//i,
    severity: "warn",
    message: "wget usage (review for legitimacy)",
    category: "automation",
  },
  {
    pattern: /\bsudo\s+/i,
    severity: "warn",
    message: "sudo usage",
    category: "automation",
  },
  {
    pattern: /(?:launchctl|systemctl)/i,
    severity: "warn",
    message: "Service/process management",
    category: "automation",
  },
  {
    pattern: /crontab\s+-/i,
    severity: "warn",
    message: "Crontab modification",
    category: "automation",
  },
];

const EXFILTRATION_PATTERNS: PatternRule[] = [
  {
    pattern: /(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?/,
    severity: "block",
    message: "Hardcoded IP address",
    category: "exfiltration",
  },
  {
    pattern: /https?:\/\/(?:discord|slack)\.com\/api\/webhooks\//i,
    severity: "block",
    message: "Discord/Slack webhook URL",
    category: "exfiltration",
  },
  {
    pattern: /https?:\/\/(?:api\.telegram\.org|t\.me)\//i,
    severity: "block",
    message: "Telegram webhook/bot URL",
    category: "exfiltration",
  },
  {
    pattern: /https?:\/\/(?:ngrok|serveo|localhost\.run)/i,
    severity: "block",
    message: "Ngrok/tunnel URL (potential exfiltration)",
    category: "exfiltration",
  },
  {
    pattern: /https?:\/\/(?!(?:openclaw\.ai|github\.com|clawhub\.com|docs\.))/i,
    severity: "warn",
    message: "External URL (review for legitimacy)",
    category: "exfiltration",
  },
];

// ── PII Detection (reimplemented from scrub.rs) ─────────────────────

const PII_PATTERNS: PatternRule[] = [
  {
    pattern: /\+?1?\d{10,11}/,
    severity: "warn",
    message: "Phone number found",
    category: "pii",
  },
  {
    pattern: /[\w.-]+@[\w.-]+\.\w+/,
    severity: "warn",
    message: "Email address found",
    category: "pii",
  },
  {
    pattern: /\d{1,5}\s+[\w\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct)\b/i,
    severity: "warn",
    message: "Street address found",
    category: "pii",
  },
  {
    pattern: /\d{3}-\d{2}-\d{4}/,
    severity: "block",
    message: "SSN found",
    category: "pii",
  },
  {
    pattern: /(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}/,
    severity: "warn",
    message: "MAC address found",
    category: "pii",
  },
  {
    pattern: /nsec1[a-z0-9]{58,}/,
    severity: "block",
    message: "Nostr nsec key found",
    category: "pii",
  },
  {
    pattern: /\b(?:0x)?[0-9a-f]{64}\b/i,
    severity: "warn",
    message: "Possible private key (64-char hex)",
    category: "pii",
  },
];

// ── Scanner Passes ──────────────────────────────────────────────────

/**
 * Pass 1: PII leak detection (publish only, but we scan anyway)
 */
function scanForPII(text: string, location: string): SecurityFinding[] {
  return scanWithPatterns(text, location, PII_PATTERNS);
}

/**
 * Pass 2: Prompt injection detection
 */
function scanForPromptInjection(text: string, location: string): SecurityFinding[] {
  return scanWithPatterns(text, location, PROMPT_INJECTION_PATTERNS);
}

/**
 * Pass 3: Automation safety (HEARTBEAT.md, cron jobs)
 */
function scanForAutomationThreats(text: string, location: string): SecurityFinding[] {
  return scanWithPatterns(text, location, AUTOMATION_PATTERNS);
}

/**
 * Pass 4: Skill verification
 */
function scanSkills(build: Build): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const skills = build.blocks.skills?.items || [];

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const location = `blocks.skills.items[${i}]`;

    if (skill.source === "custom") {
      findings.push({
        severity: "block",
        category: "skill",
        location,
        message: `Custom skill "${skill.name}" from unknown source`,
      });
    }

    if (skill.source === "local") {
      findings.push({
        severity: "warn",
        category: "skill",
        location,
        message: `Local skill "${skill.name}" (cannot verify contents)`,
      });
    }

    if (!skill.version && skill.source === "clawhub") {
      findings.push({
        severity: "warn",
        category: "skill",
        location,
        message: `Skill "${skill.name}" has no version pin`,
      });
    }

    if (skill.requiresConfig) {
      findings.push({
        severity: "info",
        category: "skill",
        location,
        message: `Skill "${skill.name}" requires configuration`,
      });
    }

    if (skill.source === "clawhub" && skill.version) {
      findings.push({
        severity: "info",
        category: "skill",
        location,
        message: `ClawHub skill "${skill.name}@${skill.version}" (trusted)`,
      });
    }
  }

  return findings;
}

/**
 * Pass 5: Network/exfiltration detection
 */
function scanForExfiltration(text: string, location: string): SecurityFinding[] {
  return scanWithPatterns(text, location, EXFILTRATION_PATTERNS);
}

/**
 * Helper: scan text with a list of patterns
 */
function scanWithPatterns(text: string, location: string, patterns: PatternRule[]): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (const rule of patterns) {
    const matches = text.match(rule.pattern);
    if (matches) {
      findings.push({
        severity: rule.severity,
        category: rule.category,
        location,
        message: rule.message,
        match: matches[0].slice(0, 100), // Truncate match
        pattern: rule.pattern.source,
      });
    }
  }

  return findings;
}

// ── Trust Scoring ───────────────────────────────────────────────────

function calculateTrustScore(build: Build, findings: SecurityFinding[]): number {
  let score = 0;

  // All skills from ClawHub with versions (+20)
  const skills = build.blocks.skills?.items || [];
  const allClawhub = skills.every((s) => s.source === "clawhub" && s.version);
  if (allClawhub && skills.length > 0) score += 20;

  // No WARN findings (+20)
  const hasWarnings = findings.some((f) => f.severity === "warn");
  if (!hasWarnings) score += 20;

  // No shell commands in persona files (+15)
  const personaText = [
    build.blocks.persona?.soul?.content,
    build.blocks.persona?.agents?.content,
  ].filter(Boolean).join("\n");
  const hasShell = /(?:exec|eval|curl|wget|bash|sh|python -c)/i.test(personaText);
  if (!hasShell) score += 15;

  // Author is verified (future: check Nostr NIP-05) (+15)
  // For now, skip this
  // if (build.meta.author.includes("@")) score += 15;

  // No external URLs in content (+10)
  const allText = JSON.stringify(build);
  const hasExternal = /https?:\/\/(?!(?:openclaw\.ai|github\.com|clawhub\.com))/.test(allText);
  if (!hasExternal) score += 10;

  // Platform published > 30 days (skip for local builds) (+10)

  // Has been applied by > 10 users (skip for local builds) (+10)

  return Math.min(100, Math.max(0, score));
}

// ── Main Scanner ────────────────────────────────────────────────────

/**
 * Scan a build for security issues
 */
export function scanBuild(build: Build): SecurityReport {
  const findings: SecurityFinding[] = [];

  // Pass 1: PII (scan all text content)
  const personaContent = [
    build.blocks.persona?.soul?.content,
    build.blocks.persona?.agents?.content,
  ].filter(Boolean);

  for (const content of personaContent) {
    if (content) {
      findings.push(...scanForPII(content, "blocks.persona"));
    }
  }

  // Pass 2: Prompt injection (persona files)
  if (build.blocks.persona?.soul?.content) {
    findings.push(
      ...scanForPromptInjection(build.blocks.persona.soul.content, "blocks.persona.soul.content")
    );
  }
  if (build.blocks.persona?.agents?.content) {
    findings.push(
      ...scanForPromptInjection(build.blocks.persona.agents.content, "blocks.persona.agents.content")
    );
  }

  // Pass 3: Automation threats (HEARTBEAT.md, cron)
  if (build.blocks.automations?.heartbeat?.content) {
    findings.push(
      ...scanForAutomationThreats(
        build.blocks.automations.heartbeat.content,
        "blocks.automations.heartbeat"
      )
    );
  }

  const cronJobs = build.blocks.automations?.cron || [];
  for (let i = 0; i < cronJobs.length; i++) {
    const job = cronJobs[i];
    const jobText = JSON.stringify(job);
    findings.push(...scanForAutomationThreats(jobText, `blocks.automations.cron[${i}]`));
  }

  // Pass 4: Skill verification
  findings.push(...scanSkills(build));

  // Pass 5: Exfiltration detection (all text)
  const allText = JSON.stringify(build);
  findings.push(...scanForExfiltration(allText, "build"));

  // Calculate trust score
  const trustScore = calculateTrustScore(build, findings);

  // Summary
  const blocked = findings.some((f) => f.severity === "block");
  const blockCount = findings.filter((f) => f.severity === "block").length;
  const warnCount = findings.filter((f) => f.severity === "warn").length;
  const infoCount = findings.filter((f) => f.severity === "info").length;

  const summary = `${blockCount} blocked, ${warnCount} warnings, ${infoCount} info`;

  return {
    buildName: build.meta.name,
    scannedAt: new Date().toISOString(),
    trustScore,
    findings,
    blocked,
    summary,
  };
}

/**
 * Format a security report for CLI display
 */
export function formatSecurityReport(report: SecurityReport): string {
  const lines: string[] = [];

  lines.push(`\nScanning "${report.buildName}" for security issues...\n`);

  const blocked = report.findings.filter((f) => f.severity === "block");
  const warnings = report.findings.filter((f) => f.severity === "warn");
  const info = report.findings.filter((f) => f.severity === "info");

  if (blocked.length > 0) {
    lines.push(`❌ BLOCKED (${blocked.length})`);
    for (const finding of blocked) {
      lines.push(`${finding.location}: ${finding.message}`);
      if (finding.match) {
        lines.push(`→ "${finding.match}"`);
      }
    }
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push(`⚠️  WARNINGS (${warnings.length})`);
    for (const finding of warnings) {
      lines.push(`${finding.location}: ${finding.message}`);
    }
    lines.push("");
  }

  if (info.length > 0) {
    lines.push(`ℹ️  INFO (${info.length})`);
    for (const finding of info) {
      lines.push(`${finding.location}: ${finding.message}`);
    }
    lines.push("");
  }

  lines.push(`Trust Score: ${report.trustScore}/100`);
  const badge =
    report.trustScore >= 80
      ? "Verified"
      : report.trustScore >= 50
      ? "Community"
      : report.trustScore >= 20
      ? "Unreviewed"
      : "Suspicious";
  lines.push(`Badge: ${badge}\n`);

  if (report.blocked) {
    lines.push("This build has blocking security issues and cannot be applied.");
    lines.push("Review the findings above and contact the author.");
  } else if (warnings.length > 0) {
    lines.push("⚠️  This build has warnings. Review before applying.");
  } else {
    lines.push("✅ No blocking issues found.");
  }

  return lines.join("\n");
}
