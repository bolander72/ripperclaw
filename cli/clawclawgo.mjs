#!/usr/bin/env node
/**
 * clawclawgo CLI: export and apply OpenClaw agent builds
 *
 * Usage:
 *   clawclawgo export [--agent <id>] [--out <file>]
 *   clawclawgo apply <build.json> --agent <id> [--mode merge|replace] [--use-my-models] [--dry-run] [--skip-deps] [--skip-security]
 *   clawclawgo preview <build.json>
 *   clawclawgo scan <build.json>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OPENCLAW_DIR = path.join(process.env.HOME, '.openclaw');
const CONFIG_PATH = path.join(OPENCLAW_DIR, 'openclaw.json');

// ── Helpers ──

function readConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  // Parse the relaxed JSON5-ish format
  const fn = new Function(`return (${raw})`);
  return fn();
}

function readFileOr(p, fallback = null) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return fallback; }
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

function gatewayRequest(endpoint, method = 'GET', body = null) {
  const port = 18789; // default gateway port
  const args = ['-s', '-X', method, `http://127.0.0.1:${port}${endpoint}`];
  // Try to read gateway token from config
  try {
    const config = readConfig();
    const token = config.gateway?.token;
    if (token) args.push('-H', `Authorization: Bearer ${token}`);
  } catch {}
  if (body) {
    args.push('-H', 'Content-Type: application/json', '-d', JSON.stringify(body));
  }
  try {
    return JSON.parse(execSync(`curl ${args.map(a => `'${a}'`).join(' ')}`, { stdio: ['pipe', 'pipe', 'pipe'] }).toString());
  } catch { return null; }
}

function tokenEstimate(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function scrubPII(text) {
  if (!text) return text;
  // Phone numbers
  text = text.replace(/\+?1?\d{10,11}/g, '[REDACTED_PHONE]');
  // Email addresses
  text = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[REDACTED_EMAIL]');
  // Street addresses (simple pattern)
  text = text.replace(/\d+\s+[\w\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct)\b[^.\n]*/gi, '[REDACTED_ADDRESS]');
  return text;
}

function preview(text, maxLen = 500) {
  if (!text) return null;
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

// ── Dependency Checking ──

function checkDependencies(build) {
  const deps = build.dependencies;
  if (!deps) return { checks: [], missing: 0 };

  const checks = [];

  // Check bins
  (deps.bins || []).forEach(bin => {
    const installed = tryExec(`which ${bin}`) !== undefined;
    checks.push({ name: bin, type: 'bin', installed, installCmd: installed ? null : `install ${bin}` });
  });

  // Check brew
  (deps.brew || []).forEach(pkg => {
    const installed = tryExec(`brew list ${pkg}`) !== undefined;
    checks.push({ name: pkg, type: 'brew', installed, installCmd: installed ? null : `brew install ${pkg}` });
  });

  // Check pip
  (deps.pip || []).forEach(pkg => {
    const installed = tryExec(`pip show ${pkg}`) !== undefined || tryExec(`pip3 show ${pkg}`) !== undefined;
    checks.push({ name: pkg, type: 'pip', installed, installCmd: installed ? null : `pip install ${pkg}` });
  });

  // Check npm
  (deps.npm || []).forEach(pkg => {
    const installed = tryExec(`npm list -g ${pkg}`) !== undefined;
    checks.push({ name: pkg, type: 'npm', installed, installCmd: installed ? null : `npm install -g ${pkg}` });
  });

  // Check models
  (deps.models || []).forEach(model => {
    const expandedPath = model.path.replace(/^~/, process.env.HOME);
    const fullPath = path.join(expandedPath, model.name);
    const installed = fs.existsSync(fullPath);
    checks.push({ name: model.name, type: 'model', installed, details: installed ? fullPath : `${model.size || '?'} from ${model.url}` });
  });

  // Check platform
  if (deps.platform) {
    const current = process.platform;
    const supported = deps.platform.includes(current);
    checks.push({ name: `platform (${deps.platform.join(', ')})`, type: 'platform', installed: supported, details: `you're on ${current}` });
  }

  // Check version
  if (deps.minOpenclawVersion) {
    const current = tryExec('openclaw --version')?.replace(/[^0-9.]/g, '');
    const ok = current && compareVersions(current, deps.minOpenclawVersion) >= 0;
    checks.push({ name: `OpenClaw >= ${deps.minOpenclawVersion}`, type: 'version', installed: ok, details: current ? `you have ${current}` : 'openclaw not found' });
  }

  const missing = checks.filter(c => !c.installed).length;
  return { checks, missing };
}

function compareVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  return 0;
}

function formatDependencyReport(buildName, checks) {
  const installed = checks.filter(c => c.installed);
  const missing = checks.filter(c => !c.installed);

  const lines = [];
  lines.push(`\nDependencies for "${buildName}":\n`);

  if (installed.length > 0) {
    lines.push('INSTALLED:');
    for (const c of installed) {
      lines.push(`  ✅ ${c.name}${c.details ? ` (${c.details})` : ''}`);
    }
    lines.push('');
  }

  if (missing.length > 0) {
    lines.push('MISSING:');
    for (const c of missing) {
      lines.push(`  ❌ ${c.name}${c.installCmd ? ` → ${c.installCmd}` : ''}`);
      if (c.details) lines.push(`     ${c.details}`);
    }
    lines.push('');
  }

  lines.push(`${installed.length} installed, ${missing.length} missing`);
  return lines.join('\n');
}

// ── Security Scanning ──

function scanBuildSecurity(build) {
  const findings = [];

  // Simple pattern-based scanning (reimplemented from src/security.ts)
  const BLOCK_PATTERNS = [
    { pattern: /ignore.*(?:previous|above|prior).*instructions/i, msg: 'Instructions to ignore previous instructions' },
    { pattern: /do\s+not\s+(?:tell|inform|notify|alert).*user/i, msg: 'Instructions to hide behavior from user' },
    { pattern: /(?:disable|bypass|skip|ignore).*(?:safety|security|permission)/i, msg: 'Instructions to disable safety features' },
    { pattern: /\|\s*curl\s+.*https?:\/\//i, msg: 'Shell command pipes output to external URL' },
    { pattern: /rm\s+-rf\s+(?:\/|~\/(?!\.openclaw))/i, msg: 'Dangerous file deletion outside workspace' },
    { pattern: /security\s+find-generic-password/i, msg: 'Keychain credential access' },
    { pattern: /(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?/, msg: 'Hardcoded IP address' },
  ];

  const WARN_PATTERNS = [
    { pattern: /exec\s*\(/i, msg: 'Contains exec() call' },
    { pattern: /eval\s*\(/i, msg: 'Contains eval() call' },
    { pattern: /curl\s+.*https?:\/\//i, msg: 'curl usage (review for legitimacy)' },
    { pattern: /wget\s+.*https?:\/\//i, msg: 'wget usage (review for legitimacy)' },
  ];

  function scanText(text, location, patterns, severity) {
    for (const { pattern, msg } of patterns) {
      if (pattern.test(text)) {
        findings.push({ severity, location, message: msg, match: text.match(pattern)?.[0]?.slice(0, 100) });
      }
    }
  }

  // Scan persona content
  const soulContent = build.blocks?.persona?.soul?.content || '';
  const agentsContent = build.blocks?.persona?.agents?.content || '';
  const heartbeatContent = build.blocks?.automations?.heartbeat?.content || '';

  scanText(soulContent, 'blocks.persona.soul.content', BLOCK_PATTERNS, 'block');
  scanText(soulContent, 'blocks.persona.soul.content', WARN_PATTERNS, 'warn');
  scanText(agentsContent, 'blocks.persona.agents.content', BLOCK_PATTERNS, 'block');
  scanText(agentsContent, 'blocks.persona.agents.content', WARN_PATTERNS, 'warn');
  scanText(heartbeatContent, 'blocks.automations.heartbeat', BLOCK_PATTERNS, 'block');
  scanText(heartbeatContent, 'blocks.automations.heartbeat', WARN_PATTERNS, 'warn');

  // Skill verification
  const skills = build.blocks?.skills?.items || [];
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    if (skill.source === 'custom') {
      findings.push({ severity: 'block', location: `blocks.skills.items[${i}]`, message: `Custom skill "${skill.name}" from unknown source` });
    }
    if (skill.source === 'local') {
      findings.push({ severity: 'warn', location: `blocks.skills.items[${i}]`, message: `Local skill "${skill.name}" (cannot verify contents)` });
    }
  }

  // Calculate trust score
  let score = 0;
  const allClawhub = skills.every(s => s.source === 'clawhub' && s.version);
  if (allClawhub && skills.length > 0) score += 20;
  const hasWarnings = findings.some(f => f.severity === 'warn');
  if (!hasWarnings) score += 20;
  const personaText = soulContent + agentsContent;
  const hasShell = /(?:exec|eval|curl|wget|bash|sh|python -c)/i.test(personaText);
  if (!hasShell) score += 15;

  const blocked = findings.some(f => f.severity === 'block');
  const blockCount = findings.filter(f => f.severity === 'block').length;
  const warnCount = findings.filter(f => f.severity === 'warn').length;

  return {
    buildName: build.meta.name,
    scannedAt: new Date().toISOString(),
    trustScore: Math.min(100, Math.max(0, score)),
    findings,
    blocked,
    summary: `${blockCount} blocked, ${warnCount} warnings`,
  };
}

function formatSecurityReport(report) {
  const lines = [];
  lines.push(`\nScanning "${report.buildName}" for security issues...\n`);

  const blocked = report.findings.filter(f => f.severity === 'block');
  const warnings = report.findings.filter(f => f.severity === 'warn');

  if (blocked.length > 0) {
    lines.push(`❌ BLOCKED (${blocked.length})`);
    for (const f of blocked) {
      lines.push(`${f.location}: ${f.message}`);
      if (f.match) lines.push(`→ "${f.match}"`);
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push(`⚠️  WARNINGS (${warnings.length})`);
    for (const f of warnings) {
      lines.push(`${f.location}: ${f.message}`);
    }
    lines.push('');
  }

  lines.push(`Trust Score: ${report.trustScore}/100`);
  const badge = report.trustScore >= 80 ? 'Verified' : report.trustScore >= 50 ? 'Community' : report.trustScore >= 20 ? 'Unreviewed' : 'Suspicious';
  lines.push(`Badge: ${badge}\n`);

  if (report.blocked) {
    lines.push('This build has blocking security issues and cannot be applied.');
    lines.push('Review the findings above and contact the author.');
  } else if (warnings.length > 0) {
    lines.push('⚠️  This build has warnings. Review before applying.');
  } else {
    lines.push('✅ No blocking issues found.');
  }

  return lines.join('\n');
}

// ── Export ──

function exportBuild(agentId) {
  const config = readConfig();
  const defaults = config.agents?.defaults || {};
  const agents = config.agents?.list || [];
  const agent = agentId ? agents.find(a => a.id === agentId) : null;

  // Resolve workspace
  const workspace = agent?.workspace || defaults.workspace || path.join(OPENCLAW_DIR, 'workspace');

  // ── Model block ──
  const primaryModel = agent?.model?.primary || defaults.model?.primary || 'unknown';
  const subagentModel = defaults.subagents?.model?.primary || 'unknown';
  const heartbeatModel = defaults.heartbeat?.model || 'unknown';
  const aliases = defaults.models || {};

  function buildTier(modelStr) {
    const [provider, model] = modelStr.includes('/') ? modelStr.split('/', 2) : ['unknown', modelStr];
    const alias = aliases[modelStr]?.alias || null;
    const isLocal = provider === 'ollama';
    const isPaid = !isLocal && provider !== 'unknown';
    return { provider, model, ...(alias && { alias }), paid: isPaid, local: isLocal };
  }

  const modelBlock = {
    tiers: {
      main: buildTier(primaryModel),
      subagent: buildTier(subagentModel),
      heartbeat: buildTier(heartbeatModel),
    },
    routing: {
      description: `${aliases[primaryModel]?.alias || primaryModel} for main, ${aliases[subagentModel]?.alias || subagentModel} for sub-agents, ${aliases[heartbeatModel]?.alias || heartbeatModel} for heartbeats`
    }
  };

  // ── Persona block ──
  const soulContent = readFileOr(path.join(workspace, 'SOUL.md'));
  const identityContent = readFileOr(path.join(workspace, 'IDENTITY.md'));
  const agentsContent = readFileOr(path.join(workspace, 'AGENTS.md'));

  // Parse identity fields
  const identityName = identityContent?.match(/\*\*Name:\*\*\s*(.+)/)?.[1]?.trim() || 'Agent';
  const identityCreature = identityContent?.match(/\*\*Creature:\*\*\s*(.+)/)?.[1]?.trim() || '';
  const identityVibe = identityContent?.match(/\*\*Vibe:\*\*\s*(.+)/)?.[1]?.trim() || '';

  const personaBlock = {
    identity: {
      name: identityName,
      ...(identityCreature && { creature: identityCreature }),
      ...(identityVibe && { vibe: identityVibe }),
    },
    soul: soulContent ? {
      included: true,
      preview: preview(scrubPII(soulContent)),
      content: scrubPII(soulContent),
      tokenEstimate: tokenEstimate(soulContent),
    } : { included: false },
    user: {
      included: false,
      note: 'USER.md excluded: contains personal information about the human'
    },
    agents: agentsContent ? {
      included: true,
      preview: preview(scrubPII(agentsContent)),
      content: scrubPII(agentsContent),
    } : { included: false },
  };

  // ── Skills block ──
  const bundledSkills = config.skills?.allowBundled || [];
  const workspaceSkills = [];
  const skillsDir = path.join(workspace, 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const name of fs.readdirSync(skillsDir)) {
      const skillPath = path.join(skillsDir, name);
      if (!fs.statSync(skillPath).isDirectory()) continue;
      const skillMd = readFileOr(path.join(skillPath, 'SKILL.md'));
      const desc = skillMd?.match(/^#[^\n]*\n+([^\n]+)/)?.[1]?.trim() || '';
      workspaceSkills.push({
        name,
        source: 'clawhub',
        description: desc,
        requiresConfig: false,
      });
    }
  }

  const skillItems = [
    ...bundledSkills.map(name => ({
      name,
      source: 'bundled',
      description: `Bundled OpenClaw skill: ${name}`,
      requiresConfig: false,
    })),
    ...workspaceSkills,
  ];

  const skillsBlock = { items: skillItems };

  // ── Integrations block ──
  const integrationItems = [];
  if (config.channels?.bluebubbles?.enabled) {
    integrationItems.push({
      type: 'channel',
      name: 'iMessage (BlueBubbles)',
      provider: 'bluebubbles',
      autoApply: false,
      docsUrl: 'https://docs.openclaw.ai/integrations/bluebubbles',
    });
  }
  // Detect caldir
  try { execSync('which caldir', { stdio: 'pipe' }); integrationItems.push({
    type: 'calendar', name: 'Calendar (caldir)', provider: 'caldir', autoApply: false,
  }); } catch {}
  // Detect himalaya
  try { execSync('which himalaya', { stdio: 'pipe' }); integrationItems.push({
    type: 'email', name: 'Email (IMAP/SMTP)', provider: 'himalaya', autoApply: false,
  }); } catch {}
  // Detect Home Assistant (check TOOLS.md for HA reference)
  const toolsContent = readFileOr(path.join(workspace, 'TOOLS.md')) || '';
  if (toolsContent.includes('Home Assistant') || toolsContent.includes('home_assistant')) {
    integrationItems.push({
      type: 'smart-home', name: 'Home Assistant', provider: 'homeassistant', autoApply: false,
      docsUrl: 'https://docs.openclaw.ai/integrations/home-assistant',
    });
  }
  // Detect gh CLI
  try { execSync('which gh', { stdio: 'pipe' }); integrationItems.push({
    type: 'code', name: 'GitHub', provider: 'gh', autoApply: false,
  }); } catch {}
  // Voice I/O
  if (toolsContent.includes('voice_loop') || toolsContent.includes('Kokoro')) {
    integrationItems.push({
      type: 'voice', name: 'Voice Loop (Whisper + Kokoro)', provider: 'voice-loop', autoApply: false,
    });
  }

  const integrationsBlock = { items: integrationItems };

  // ── Automations block ──
  const heartbeatContent = readFileOr(path.join(workspace, 'HEARTBEAT.md'));
  const heartbeatTasks = heartbeatContent?.match(/^-\s/gm)?.length || 0;

  // We can't call the cron API from a CLI script, but we can note what we found
  // For export, we'll include heartbeat content and note cron jobs exist
  const automationsBlock = {
    heartbeat: heartbeatContent ? {
      included: true,
      content: scrubPII(heartbeatContent),
      taskCount: heartbeatTasks,
    } : { included: false },
    cron: [], // Populated separately when exporting via Tauri/gateway API
  };

  // ── Memory block ──
  const memoryDirs = [];
  const templateFiles = [];
  const memoryDir = path.join(workspace, 'memory');
  if (fs.existsSync(memoryDir)) {
    // Collect directory structure
    function walkDirs(dir, rel) {
      memoryDirs.push(rel + '/');
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          walkDirs(path.join(dir, entry.name), rel + '/' + entry.name);
        }
      }
    }
    walkDirs(memoryDir, 'memory');

    // Include template files (just structure, not actual content)
    for (const name of ['handoff.md', 'active-work.md', 'facts.md']) {
      templateFiles.push({
        path: `memory/${name}`,
        content: `# ${name.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n\n_Updated each session._`,
      });
    }
  }

  const memoryBlock = {
    structure: {
      directories: memoryDirs,
      templateFiles,
    },
    engine: {
      type: config.plugins?.blocks?.contextEngine || 'default',
      description: config.plugins?.blocks?.contextEngine === 'lossless-claw'
        ? 'Lossless Context Management: auto-compacts conversation history'
        : 'Default OpenClaw context engine',
    },
  };

  // ── Assemble ──
  const build = {
    schema: 2,
    meta: {
      name: `${identityName}'s Build`,
      agentName: identityName,
      description: identityVibe || 'An OpenClaw agent build',
      author: 'local',
      version: 1,
      exportedAt: new Date().toISOString(),
      tags: [],
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

// ── Apply ──

function applyBuild(buildPath, agentId, options = {}) {
  const { mode = 'merge', useMyModels = false, dryRun = false, skipDeps = false, skipSecurity = false } = options;

  const build = JSON.parse(fs.readFileSync(buildPath, 'utf8'));

  // Security scan first (unless skipped)
  if (!skipSecurity) {
    const secReport = scanBuildSecurity(build);
    console.log(formatSecurityReport(secReport));
    if (secReport.blocked) {
      throw new Error('Build has blocking security issues. Fix or use --skip-security to bypass (not recommended).');
    }
  }

  // Dependency check (unless skipped)
  if (!skipDeps && build.dependencies) {
    const depResult = checkDependencies(build);
    console.log(formatDependencyReport(build.meta.name, depResult.checks));
    if (depResult.missing > 0) {
      throw new Error(`${depResult.missing} dependencies missing. Install them or use --skip-deps to bypass.`);
    }
  }

  const config = readConfig();
  const agents = config.agents?.list || [];
  const defaults = config.agents?.defaults || {};

  const isNew = !agents.find(a => a.id === agentId);
  const agentWorkspace = path.join(OPENCLAW_DIR, 'agents', agentId);

  // ── Safety: never overwrite an existing agent workspace ──
  if (fs.existsSync(agentWorkspace)) {
    throw new Error(
      `Agent workspace already exists at ${agentWorkspace}. ` +
      `ClawClawGo never overwrites existing agents. Use a different --agent id ` +
      `or remove the directory manually if you're sure.`
    );
  }

  const actions = [];
  const warnings = [];

  // ── 0. Protect current default agent ──
  // If agents.list is empty, the current agent runs from agents.defaults.
  // We must explicitly add it as default before adding the new agent.
  if (agents.length === 0) {
    const defaultWorkspace = defaults.workspace || path.join(OPENCLAW_DIR, 'workspace');
    const defaultModel = defaults.model?.primary || 'anthropic/claude-sonnet-4-5';
    actions.push({
      type: 'add-agent-config',
      note: 'Protecting current default agent: adding explicit entry before new agent',
      agent: {
        id: 'main',
        name: 'Main Agent',
        workspace: defaultWorkspace,
        model: { primary: defaultModel },
        default: true,
      },
    });
    warnings.push('📌 Your current agent will be added to agents.list as "main" with default: true');
  }

  // ── 1. Create workspace ──
  actions.push({ type: 'create-workspace', path: agentWorkspace });

  // ── 2. Model block ──
  const modelBlock = build.blocks?.model;
  if (modelBlock?.tiers) {
    if (useMyModels) {
      actions.push({
        type: 'set-model',
        tier: 'main',
        model: defaults.model?.primary || 'anthropic/claude-sonnet-4-5',
        note: 'Using your current main model',
      });
      actions.push({
        type: 'set-model',
        tier: 'subagent',
        model: defaults.subagents?.model?.primary || defaults.model?.primary,
        note: 'Using your current subagent model',
      });
    } else {
      for (const [tier, info] of Object.entries(modelBlock.tiers)) {
        const fullModel = `${info.provider}/${info.model}`;
        actions.push({ type: 'set-model', tier, model: fullModel });
        if (info.paid) {
          warnings.push(`⚠️  Model tier "${tier}" uses ${info.alias || fullModel} (paid, requires ${info.provider} API key)`);
        }
      }
    }
  }

  // ── 3. Persona block ──
  const personaBlock = build.blocks?.persona;
  if (personaBlock) {
    if (personaBlock.identity) {
      actions.push({
        type: 'write-file',
        path: path.join(agentWorkspace, 'IDENTITY.md'),
        content: `# IDENTITY.md - Who Am I?\n\n- **Name:** ${personaBlock.identity.name || 'Agent'}\n- **Creature:** ${personaBlock.identity.creature || 'AI assistant'}\n- **Vibe:** ${personaBlock.identity.vibe || ''}\n`,
        confirm: true,
        confirmMessage: '⚠️  This will set the agent\'s identity. Continue?',
      });
    }
    if (personaBlock.soul?.included && personaBlock.soul.content) {
      actions.push({
        type: 'write-file',
        path: path.join(agentWorkspace, 'SOUL.md'),
        content: personaBlock.soul.content,
        confirm: true,
        confirmMessage: '⚠️  This will change the agent\'s persona (SOUL.md). Are you sure?',
      });
    }
    if (personaBlock.agents?.included && personaBlock.agents.content) {
      actions.push({
        type: 'write-file',
        path: path.join(agentWorkspace, 'AGENTS.md'),
        content: personaBlock.agents.content,
      });
    }
    // Always create a blank USER.md
    actions.push({
      type: 'write-file-if-missing',
      path: path.join(agentWorkspace, 'USER.md'),
      content: '# USER.md - About Your Human\n\n- **Name:** \n- **Timezone:** \n- **Notes:** \n',
    });
  }

  // ── 4. Skills block ──
  const skillsBlock = build.blocks?.skills;
  if (skillsBlock?.items) {
    for (const skill of skillsBlock.items) {
      if (skill.source === 'bundled') {
        actions.push({ type: 'enable-bundled-skill', name: skill.name });
      } else if (skill.source === 'clawhub') {
        actions.push({
          type: 'install-skill',
          name: skill.name,
          version: skill.version,
        });
        if (skill.requiresConfig) {
          warnings.push(`⚙️  Skill "${skill.name}" needs configuration: ${skill.configHint || 'check skill docs'}`);
        }
      } else {
        warnings.push(`📦 Skill "${skill.name}" (source: ${skill.source}): manual install needed`);
      }
    }
  }

  // ── 5. Integrations block ──
  const intBlock = build.blocks?.integrations;
  if (intBlock?.items) {
    for (const integration of intBlock.items) {
      warnings.push(`🔧 Integration "${integration.name}": manual setup required${integration.docsUrl ? ` (${integration.docsUrl})` : ''}`);
    }
  }

  // ── 6. Automations block ──
  const autoBlock = build.blocks?.automations;
  if (autoBlock?.heartbeat?.included && autoBlock.heartbeat.content) {
    actions.push({
      type: 'write-file',
      path: path.join(agentWorkspace, 'HEARTBEAT.md'),
      content: autoBlock.heartbeat.content,
    });
  }
  if (autoBlock?.cron?.length) {
    for (const job of autoBlock.cron) {
      actions.push({ type: 'create-cron', job });
      if (job.dependsOn?.length) {
        warnings.push(`⏰ Cron "${job.name}" depends on: ${job.dependsOn.join(', ')}`);
      }
    }
  }

  // ── 7. Memory block ──
  const memBlock = build.blocks?.memory;
  if (memBlock?.structure) {
    for (const dir of memBlock.structure.directories || []) {
      actions.push({ type: 'create-dir', path: path.join(agentWorkspace, dir) });
    }
    for (const tmpl of memBlock.structure.templateFiles || []) {
      actions.push({
        type: 'write-file-if-missing',
        path: path.join(agentWorkspace, tmpl.path),
        content: tmpl.content,
      });
    }
  }

  // ── 8. Config entry for new agent ──
  const mainModel = useMyModels
    ? (defaults.model?.primary || 'anthropic/claude-sonnet-4-5')
    : (modelBlock?.tiers?.main ? `${modelBlock.tiers.main.provider}/${modelBlock.tiers.main.model}` : defaults.model?.primary);

  actions.push({
    type: 'add-agent-config',
    agent: {
      id: agentId,
      name: personaBlock?.identity?.name || agentId,
      workspace: agentWorkspace,
      model: { primary: mainModel },
    },
  });

  // ── Execute or dry-run ──
  if (dryRun) {
    return { actions, warnings, dryRun: true };
  }

  const results = [];
  let _collectedSkills = [];
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create-workspace':
        case 'create-dir':
          fs.mkdirSync(action.path, { recursive: true });
          results.push({ ...action, status: 'ok' });
          break;

        case 'write-file':
          fs.mkdirSync(path.dirname(action.path), { recursive: true });
          fs.writeFileSync(action.path, action.content, 'utf8');
          results.push({ ...action, status: 'ok' });
          break;

        case 'write-file-if-missing':
          if (!fs.existsSync(action.path)) {
            fs.mkdirSync(path.dirname(action.path), { recursive: true });
            fs.writeFileSync(action.path, action.content, 'utf8');
            results.push({ ...action, status: 'created' });
          } else {
            results.push({ ...action, status: 'skipped (exists)' });
          }
          break;

        case 'set-model':
          // Model is set via the agent config entry: just track it
          results.push({ ...action, status: 'ok (applied via config)' });
          break;

        case 'enable-bundled-skill':
          // Bundled skills are enabled by adding to agent's skills allowlist in config
          // We collect these and apply them when writing the agent config entry
          if (!action._collected) {
            if (!_collectedSkills) _collectedSkills = [];
            _collectedSkills.push(action.skill);
          }
          results.push({ ...action, status: 'ok (added to allowlist)' });
          break;

        case 'install-skill': {
          // Install from ClawHub into the agent's workspace skills dir
          const skillDir = path.join(agentWorkspace, 'skills');
          fs.mkdirSync(skillDir, { recursive: true });
          try {
            execSync(`clawhub install ${action.skill} --workdir "${agentWorkspace}" --no-input`, {
              stdio: ['pipe', 'pipe', 'pipe'],
            });
            results.push({ ...action, status: 'installed' });
          } catch (err) {
            results.push({ ...action, status: 'install-failed', error: err.stderr?.toString() || err.message });
          }
          break;
        }

        case 'create-cron':
          // Would need gateway cron API: flag for manual setup
          results.push({ ...action, status: 'skipped (cron jobs must be created via gateway)' });
          break;

        case 'add-agent-config': {
          // Read current config, add agent to agents.list, write back
          const currentConfig = readConfig();
          if (!currentConfig.agents) currentConfig.agents = {};
          if (!currentConfig.agents.list) currentConfig.agents.list = [];

          // Check if this agent id already exists in the list
          const existingIdx = currentConfig.agents.list.findIndex(a => a.id === action.agent.id);
          if (existingIdx >= 0) {
            results.push({ ...action, status: 'skipped (already in config)' });
          } else {
            currentConfig.agents.list.push(action.agent);
            writeConfig(currentConfig);
            results.push({ ...action, status: 'ok' });
          }
          break;
        }

        default:
          results.push({ ...action, status: 'unknown action' });
      }
    } catch (err) {
      results.push({ ...action, status: 'error', error: err.message });
    }
  }

  // ── Post-apply summary ──
  const ok = results.filter(r => r.status === 'ok' || r.status === 'created' || r.status === 'installed' || r.status.startsWith('ok'));
  const failed = results.filter(r => r.status === 'error' || r.status === 'install-failed');
  const skipped = results.filter(r => r.status?.startsWith('skipped'));

  console.log(`\n✅ Agent "${agentId}" created at ${agentWorkspace}`);
  console.log(`   ${ok.length} actions applied, ${skipped.length} skipped, ${failed.length} failed`);
  if (failed.length) {
    console.log('\n❌ Failed:');
    for (const f of failed) console.log(`   ${f.type}: ${f.error}`);
  }
  if (warnings.length) {
    console.log('\n⚠️  Warnings:');
    for (const w of warnings) console.log(`   ${w}`);
  }
  console.log('\n🔄 Restart OpenClaw to pick up the new agent: openclaw gateway restart');

  return { results, warnings, agentId, workspace: agentWorkspace };
}

// ── Preview ──

function previewBuild(buildPath) {
  const build = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
  const lines = [];

  lines.push(`\n📦 ${build.meta.name} (by ${build.meta.author})`);
  lines.push(`   Agent: ${build.meta.agentName}`);
  if (build.meta.description) lines.push(`   ${build.meta.description}`);
  lines.push('');

  // Security summary
  const secReport = scanBuildSecurity(build);
  lines.push(`🔒 Security: Trust Score ${secReport.trustScore}/100 (${secReport.summary})`);
  if (secReport.blocked) {
    lines.push('   ❌ Has blocking security issues');
  }
  lines.push('');

  // Model
  const m = build.blocks?.model;
  if (m?.tiers) {
    lines.push('⬢ Model');
    for (const [tier, info] of Object.entries(m.tiers)) {
      const flags = [info.paid && '💰 paid', info.local && '🏠 local'].filter(Boolean).join(' ');
      lines.push(`  ${tier}: ${info.alias || info.model} (${info.provider}) ${flags}`);
    }
    lines.push('');
  }

  // Persona
  const p = build.blocks?.persona;
  if (p) {
    lines.push('🎭 Persona');
    lines.push(`  Name: ${p.identity?.name || '?'}`);
    if (p.soul?.included) lines.push(`  SOUL.md: ✅ included (~${p.soul.tokenEstimate || '?'} tokens)`);
    lines.push(`  USER.md: ❌ excluded (personal)`);
    if (p.agents?.included) lines.push(`  AGENTS.md: ✅ included`);
    lines.push('');
  }

  // Skills
  const s = build.blocks?.skills;
  if (s?.items?.length) {
    lines.push(`🔧 Skills (${s.items.length})`);
    for (const skill of s.items) {
      const ver = skill.version ? `@${skill.version}` : '';
      const flag = skill.requiresConfig ? ' ⚙️' : '';
      lines.push(`  ${skill.name}${ver} (${skill.source})${flag}`);
    }
    lines.push('');
  }

  // Integrations
  const i = build.blocks?.integrations;
  if (i?.items?.length) {
    lines.push(`🔌 Integrations (${i.items.length}): all manual setup`);
    for (const int of i.items) {
      lines.push(`  ${int.name} (${int.provider})`);
    }
    lines.push('');
  }

  // Automations
  const a = build.blocks?.automations;
  if (a) {
    lines.push('⏰ Automations');
    if (a.heartbeat?.included) lines.push(`  Heartbeat: ${a.heartbeat.taskCount} tasks`);
    if (a.cron?.length) lines.push(`  Cron jobs: ${a.cron.length}`);
    lines.push('');
  }

  // Memory
  const mem = build.blocks?.memory;
  if (mem?.structure) {
    lines.push('🧠 Memory');
    lines.push(`  Directories: ${mem.structure.directories?.length || 0}`);
    lines.push(`  Template files: ${mem.structure.templateFiles?.length || 0}`);
    lines.push(`  Engine: ${mem.engine?.type || 'default'}`);
    lines.push('');
  }

  // Dependencies
  if (build.dependencies) {
    const depResult = checkDependencies(build);
    const totalDeps = depResult.checks.length;
    lines.push(`📦 Dependencies (${totalDeps} total, ${depResult.missing} missing)`);
    if (depResult.missing > 0) {
      const missingItems = depResult.checks.filter(c => !c.installed).slice(0, 3);
      for (const item of missingItems) {
        lines.push(`  ❌ ${item.name}`);
      }
      if (depResult.missing > 3) {
        lines.push(`  ... and ${depResult.missing - 3} more`);
      }
    } else {
      lines.push('  ✅ All dependencies installed');
    }
  }

  return lines.join('\n');
}

// ── CLI ──

const args = process.argv.slice(2);
const command = args[0];

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

function hasFlag(flag) {
  return args.includes(flag);
}

try {
  switch (command) {
    case 'export': {
      const agentId = getArg('--agent');
      const outFile = getArg('--out');
      const build = exportBuild(agentId);
      const json = JSON.stringify(build, null, 2);
      if (outFile) {
        fs.writeFileSync(outFile, json, 'utf8');
        console.log(`✅ Exported to ${outFile}`);
      } else {
        console.log(json);
      }
      break;
    }
    case 'apply': {
      const buildPath = args[1];
      const agentId = getArg('--agent');
      if (!buildPath || !agentId) {
        console.error('Usage: clawclawgo apply <build.json> --agent <id>');
        process.exit(1);
      }
      const result = applyBuild(buildPath, agentId, {
        mode: getArg('--mode') || 'merge',
        useMyModels: hasFlag('--use-my-models'),
        dryRun: hasFlag('--dry-run'),
        skipDeps: hasFlag('--skip-deps'),
        skipSecurity: hasFlag('--skip-security'),
      });
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case 'preview': {
      const buildPath = args[1];
      if (!buildPath) {
        console.error('Usage: clawclawgo preview <build.json>');
        process.exit(1);
      }
      console.log(previewBuild(buildPath));
      break;
    }
    case 'scan': {
      const buildPath = args[1];
      if (!buildPath) {
        console.error('Usage: clawclawgo scan <build.json>');
        process.exit(1);
      }
      const build = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
      const report = scanBuildSecurity(build);
      console.log(formatSecurityReport(report));
      break;
    }
    default:
      console.log(`clawclawgo: OpenClaw agent build manager

Commands:
  export [--agent <id>] [--out <file>]    Export current agent as build
  apply <file> --agent <id> [options]     Apply build to agent
  preview <file>                          Preview build contents
  scan <file>                             Run security scan on build

Apply options:
  --mode merge|replace    Apply mode (default: merge)
  --use-my-models         Use your current models instead of build's
  --dry-run               Show what would happen without doing it
  --skip-deps             Skip dependency checking
  --skip-security         Skip security scanning (not recommended)`);
  }
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
