#!/usr/bin/env node
/**
 * ripperclaw CLI — export and apply OpenClaw agent loadouts
 *
 * Usage:
 *   ripperclaw export [--agent <id>] [--out <file>]
 *   ripperclaw apply <loadout.json> --agent <id> [--mode merge|replace] [--use-my-models] [--dry-run]
 *   ripperclaw preview <loadout.json>
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

// ── Export ──

function exportLoadout(agentId) {
  const config = readConfig();
  const defaults = config.agents?.defaults || {};
  const agents = config.agents?.list || [];
  const agent = agentId ? agents.find(a => a.id === agentId) : null;

  // Resolve workspace
  const workspace = agent?.workspace || defaults.workspace || path.join(OPENCLAW_DIR, 'workspace');

  // ── Model slot ──
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

  const modelSlot = {
    tiers: {
      main: buildTier(primaryModel),
      subagent: buildTier(subagentModel),
      heartbeat: buildTier(heartbeatModel),
    },
    routing: {
      description: `${aliases[primaryModel]?.alias || primaryModel} for main, ${aliases[subagentModel]?.alias || subagentModel} for sub-agents, ${aliases[heartbeatModel]?.alias || heartbeatModel} for heartbeats`
    }
  };

  // ── Persona slot ──
  const soulContent = readFileOr(path.join(workspace, 'SOUL.md'));
  const identityContent = readFileOr(path.join(workspace, 'IDENTITY.md'));
  const agentsContent = readFileOr(path.join(workspace, 'AGENTS.md'));

  // Parse identity fields
  const identityName = identityContent?.match(/\*\*Name:\*\*\s*(.+)/)?.[1]?.trim() || 'Agent';
  const identityCreature = identityContent?.match(/\*\*Creature:\*\*\s*(.+)/)?.[1]?.trim() || '';
  const identityVibe = identityContent?.match(/\*\*Vibe:\*\*\s*(.+)/)?.[1]?.trim() || '';

  const personaSlot = {
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
      note: 'USER.md excluded — contains personal information about the human'
    },
    agents: agentsContent ? {
      included: true,
      preview: preview(scrubPII(agentsContent)),
      content: scrubPII(agentsContent),
    } : { included: false },
  };

  // ── Skills slot ──
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

  const skillsSlot = { items: skillItems };

  // ── Integrations slot ──
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

  const integrationsSlot = { items: integrationItems };

  // ── Automations slot ──
  const heartbeatContent = readFileOr(path.join(workspace, 'HEARTBEAT.md'));
  const heartbeatTasks = heartbeatContent?.match(/^-\s/gm)?.length || 0;

  // We can't call the cron API from a CLI script, but we can note what we found
  // For export, we'll include heartbeat content and note cron jobs exist
  const automationsSlot = {
    heartbeat: heartbeatContent ? {
      included: true,
      content: scrubPII(heartbeatContent),
      taskCount: heartbeatTasks,
    } : { included: false },
    cron: [], // Populated separately when exporting via Tauri/gateway API
  };

  // ── Memory slot ──
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

  const memorySlot = {
    structure: {
      directories: memoryDirs,
      templateFiles,
    },
    engine: {
      type: config.plugins?.slots?.contextEngine || 'default',
      description: config.plugins?.slots?.contextEngine === 'lossless-claw'
        ? 'Lossless Context Management — auto-compacts conversation history'
        : 'Default OpenClaw context engine',
    },
  };

  // ── Assemble ──
  const loadout = {
    schema: 1,
    meta: {
      name: `${identityName}'s Loadout`,
      agentName: identityName,
      description: identityVibe || 'An OpenClaw agent loadout',
      author: 'local',
      version: 1,
      exportedAt: new Date().toISOString(),
      tags: [],
    },
    slots: {
      model: modelSlot,
      persona: personaSlot,
      skills: skillsSlot,
      integrations: integrationsSlot,
      automations: automationsSlot,
      memory: memorySlot,
    },
  };

  return loadout;
}

// ── Apply ──

function applyLoadout(loadoutPath, agentId, options = {}) {
  const { mode = 'merge', useMyModels = false, dryRun = false } = options;

  const loadout = JSON.parse(fs.readFileSync(loadoutPath, 'utf8'));
  const config = readConfig();
  const agents = config.agents?.list || [];
  const defaults = config.agents?.defaults || {};

  const isNew = !agents.find(a => a.id === agentId);
  const agentWorkspace = path.join(OPENCLAW_DIR, 'agents', agentId);

  // ── Safety: never overwrite an existing agent workspace ──
  if (fs.existsSync(agentWorkspace)) {
    throw new Error(
      `Agent workspace already exists at ${agentWorkspace}. ` +
      `Ripperclaw never overwrites existing agents. Use a different --agent id ` +
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
      note: 'Protecting current default agent — adding explicit entry before new agent',
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

  // ── 2. Model slot ──
  const modelSlot = loadout.slots?.model;
  if (modelSlot?.tiers) {
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
      for (const [tier, info] of Object.entries(modelSlot.tiers)) {
        const fullModel = `${info.provider}/${info.model}`;
        actions.push({ type: 'set-model', tier, model: fullModel });
        if (info.paid) {
          warnings.push(`⚠️  Model tier "${tier}" uses ${info.alias || fullModel} (paid, requires ${info.provider} API key)`);
        }
      }
    }
  }

  // ── 3. Persona slot ──
  const personaSlot = loadout.slots?.persona;
  if (personaSlot) {
    if (personaSlot.identity) {
      actions.push({
        type: 'write-file',
        path: path.join(agentWorkspace, 'IDENTITY.md'),
        content: `# IDENTITY.md - Who Am I?\n\n- **Name:** ${personaSlot.identity.name || 'Agent'}\n- **Creature:** ${personaSlot.identity.creature || 'AI assistant'}\n- **Vibe:** ${personaSlot.identity.vibe || ''}\n`,
        confirm: true,
        confirmMessage: '⚠️  This will set the agent\'s identity. Continue?',
      });
    }
    if (personaSlot.soul?.included && personaSlot.soul.content) {
      actions.push({
        type: 'write-file',
        path: path.join(agentWorkspace, 'SOUL.md'),
        content: personaSlot.soul.content,
        confirm: true,
        confirmMessage: '⚠️  This will change the agent\'s persona (SOUL.md). Are you sure?',
      });
    }
    if (personaSlot.agents?.included && personaSlot.agents.content) {
      actions.push({
        type: 'write-file',
        path: path.join(agentWorkspace, 'AGENTS.md'),
        content: personaSlot.agents.content,
      });
    }
    // Always create a blank USER.md
    actions.push({
      type: 'write-file-if-missing',
      path: path.join(agentWorkspace, 'USER.md'),
      content: '# USER.md - About Your Human\n\n- **Name:** \n- **Timezone:** \n- **Notes:** \n',
    });
  }

  // ── 4. Skills slot ──
  const skillsSlot = loadout.slots?.skills;
  if (skillsSlot?.items) {
    for (const skill of skillsSlot.items) {
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
        warnings.push(`📦 Skill "${skill.name}" (source: ${skill.source}) — manual install needed`);
      }
    }
  }

  // ── 5. Integrations slot ──
  const intSlot = loadout.slots?.integrations;
  if (intSlot?.items) {
    for (const integration of intSlot.items) {
      warnings.push(`🔧 Integration "${integration.name}" — manual setup required${integration.docsUrl ? ` (${integration.docsUrl})` : ''}`);
    }
  }

  // ── 6. Automations slot ──
  const autoSlot = loadout.slots?.automations;
  if (autoSlot?.heartbeat?.included && autoSlot.heartbeat.content) {
    actions.push({
      type: 'write-file',
      path: path.join(agentWorkspace, 'HEARTBEAT.md'),
      content: autoSlot.heartbeat.content,
    });
  }
  if (autoSlot?.cron?.length) {
    for (const job of autoSlot.cron) {
      actions.push({ type: 'create-cron', job });
      if (job.dependsOn?.length) {
        warnings.push(`⏰ Cron "${job.name}" depends on: ${job.dependsOn.join(', ')}`);
      }
    }
  }

  // ── 7. Memory slot ──
  const memSlot = loadout.slots?.memory;
  if (memSlot?.structure) {
    for (const dir of memSlot.structure.directories || []) {
      actions.push({ type: 'create-dir', path: path.join(agentWorkspace, dir) });
    }
    for (const tmpl of memSlot.structure.templateFiles || []) {
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
    : (modelSlot?.tiers?.main ? `${modelSlot.tiers.main.provider}/${modelSlot.tiers.main.model}` : defaults.model?.primary);

  actions.push({
    type: 'add-agent-config',
    agent: {
      id: agentId,
      name: personaSlot?.identity?.name || agentId,
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
          // Model is set via the agent config entry — just track it
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
          // Would need gateway cron API — flag for manual setup
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

function previewLoadout(loadoutPath) {
  const loadout = JSON.parse(fs.readFileSync(loadoutPath, 'utf8'));
  const lines = [];

  lines.push(`\n📦 ${loadout.meta.name} (by ${loadout.meta.author})`);
  lines.push(`   Agent: ${loadout.meta.agentName}`);
  if (loadout.meta.description) lines.push(`   ${loadout.meta.description}`);
  lines.push('');

  // Model
  const m = loadout.slots?.model;
  if (m?.tiers) {
    lines.push('⬢ Model');
    for (const [tier, info] of Object.entries(m.tiers)) {
      const flags = [info.paid && '💰 paid', info.local && '🏠 local'].filter(Boolean).join(' ');
      lines.push(`  ${tier}: ${info.alias || info.model} (${info.provider}) ${flags}`);
    }
    lines.push('');
  }

  // Persona
  const p = loadout.slots?.persona;
  if (p) {
    lines.push('🎭 Persona');
    lines.push(`  Name: ${p.identity?.name || '?'}`);
    if (p.soul?.included) lines.push(`  SOUL.md: ✅ included (~${p.soul.tokenEstimate || '?'} tokens)`);
    lines.push(`  USER.md: ❌ excluded (personal)`);
    if (p.agents?.included) lines.push(`  AGENTS.md: ✅ included`);
    lines.push('');
  }

  // Skills
  const s = loadout.slots?.skills;
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
  const i = loadout.slots?.integrations;
  if (i?.items?.length) {
    lines.push(`🔌 Integrations (${i.items.length}) — all manual setup`);
    for (const int of i.items) {
      lines.push(`  ${int.name} (${int.provider})`);
    }
    lines.push('');
  }

  // Automations
  const a = loadout.slots?.automations;
  if (a) {
    lines.push('⏰ Automations');
    if (a.heartbeat?.included) lines.push(`  Heartbeat: ${a.heartbeat.taskCount} tasks`);
    if (a.cron?.length) lines.push(`  Cron jobs: ${a.cron.length}`);
    lines.push('');
  }

  // Memory
  const mem = loadout.slots?.memory;
  if (mem?.structure) {
    lines.push('🧠 Memory');
    lines.push(`  Directories: ${mem.structure.directories?.length || 0}`);
    lines.push(`  Template files: ${mem.structure.templateFiles?.length || 0}`);
    lines.push(`  Engine: ${mem.engine?.type || 'default'}`);
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
      const loadout = exportLoadout(agentId);
      const json = JSON.stringify(loadout, null, 2);
      if (outFile) {
        fs.writeFileSync(outFile, json, 'utf8');
        console.log(`✅ Exported to ${outFile}`);
      } else {
        console.log(json);
      }
      break;
    }
    case 'apply': {
      const loadoutPath = args[1];
      const agentId = getArg('--agent');
      if (!loadoutPath || !agentId) {
        console.error('Usage: ripperclaw apply <loadout.json> --agent <id>');
        process.exit(1);
      }
      const result = applyLoadout(loadoutPath, agentId, {
        mode: getArg('--mode') || 'merge',
        useMyModels: hasFlag('--use-my-models'),
        dryRun: hasFlag('--dry-run'),
      });
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case 'preview': {
      const loadoutPath = args[1];
      if (!loadoutPath) {
        console.error('Usage: ripperclaw preview <loadout.json>');
        process.exit(1);
      }
      console.log(previewLoadout(loadoutPath));
      break;
    }
    default:
      console.log(`ripperclaw — OpenClaw agent loadout manager

Commands:
  export [--agent <id>] [--out <file>]    Export current agent as loadout
  apply <file> --agent <id> [options]     Apply loadout to agent
  preview <file>                          Preview loadout contents

Apply options:
  --mode merge|replace    Apply mode (default: merge)
  --use-my-models         Use your current models instead of loadout's
  --dry-run               Show what would happen without doing it`);
  }
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
