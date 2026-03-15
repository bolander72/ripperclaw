#!/usr/bin/env node
/**
 * ClawClawGo CLI
 *
 * Usage:
 *   clawclawgo push [dir]                  Push your kit to the registry
 *   clawclawgo add <owner/repo> [--dest]   Add a kit from GitHub
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

// ── Constants ──

const REGISTRY_REPO = 'bolander72/clawclawgo';
const REGISTRY_FILE = 'registry/kits.json';

const KIT_SCHEMA_VERSION = 1;

// Files and dirs that never leave the machine
const SENSITIVE_FILES = new Set([
  'SOUL.md', 'USER.md', 'MEMORY.md', 'IDENTITY.md',
  'openclaw.json', '.env', '.env.local', '.env.production',
]);
const SENSITIVE_DIRS = new Set([
  'memory', '.ssh', '.gnupg', '.openclaw', '.env',
]);

// Agent config detection
const AGENT_MARKERS = {
  'agent-skills': { files: ['SKILL.md'] },
  'claude-code':  { files: ['CLAUDE.md', '.claude/'] },
  'cursor':       { files: ['.cursorrules', '.cursor/rules/'] },
  'windsurf':     { files: ['.windsurfrules'] },
  'openclaw':     { files: ['AGENTS.md', 'openclaw.json'] },
  'codex':        { files: ['codex.json', 'AGENTS.md'] },
  'cline':        { files: ['.clinerules', '.cline/'] },
  'aider':        { files: ['.aider.conf.yml'] },
  'continue':     { files: ['.continue/config.json'] },
};

const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.cache']);

// ── Kit Schema ──

/**
 * @typedef {Object} KitSkill
 * @property {string} name
 * @property {string} description
 * @property {string} path
 * @property {string} [license]
 * @property {string} [compatibility]
 * @property {string[]} [allowedTools]
 */

/**
 * @typedef {Object} KitConfig
 * @property {string} file
 * @property {string} agent
 */

/**
 * @typedef {Object} KitScan
 * @property {number} trustScore
 * @property {boolean} blocked
 * @property {string} summary
 * @property {Array<{severity: string, message: string, match?: string}>} findings
 * @property {string} scannedAt
 */

/**
 * @typedef {Object} Kit
 * @property {number} schema        - Must be KIT_SCHEMA_VERSION
 * @property {string} name
 * @property {string} description
 * @property {string} repoUrl
 * @property {string} owner
 * @property {string[]} compatibility
 * @property {KitSkill[]} skills
 * @property {KitConfig[]} configs
 * @property {KitScan} scan
 * @property {string} pushedAt
 */

// ── Validation ──

function validateKit(kit) {
  const errors = [];

  if (kit.schema !== KIT_SCHEMA_VERSION)
    errors.push(`schema must be ${KIT_SCHEMA_VERSION}, got ${kit.schema}`);
  if (typeof kit.name !== 'string' || !kit.name.trim())
    errors.push('name is required');
  if (typeof kit.description !== 'string')
    errors.push('description must be a string');
  if (typeof kit.repoUrl !== 'string' || !kit.repoUrl.startsWith('https://github.com/'))
    errors.push('repoUrl must be a valid GitHub URL');
  if (typeof kit.owner !== 'string' || !kit.owner.trim())
    errors.push('owner is required');
  if (!Array.isArray(kit.compatibility))
    errors.push('compatibility must be an array');
  if (!Array.isArray(kit.skills))
    errors.push('skills must be an array');
  if (!Array.isArray(kit.configs))
    errors.push('configs must be an array');

  // Validate skills
  if (Array.isArray(kit.skills)) {
    for (const [i, skill] of kit.skills.entries()) {
      if (typeof skill.name !== 'string' || !skill.name.trim())
        errors.push(`skills[${i}].name is required`);
      if (typeof skill.description !== 'string')
        errors.push(`skills[${i}].description must be a string`);
      if (typeof skill.path !== 'string')
        errors.push(`skills[${i}].path must be a string`);
      if (skill.allowedTools && !Array.isArray(skill.allowedTools))
        errors.push(`skills[${i}].allowedTools must be an array`);
    }
  }

  // Validate configs
  if (Array.isArray(kit.configs)) {
    for (const [i, config] of kit.configs.entries()) {
      if (typeof config.file !== 'string')
        errors.push(`configs[${i}].file must be a string`);
      if (typeof config.agent !== 'string')
        errors.push(`configs[${i}].agent must be a string`);
    }
  }

  // Validate scan
  if (!kit.scan || typeof kit.scan !== 'object')
    errors.push('scan is required');
  else {
    if (typeof kit.scan.trustScore !== 'number' || kit.scan.trustScore < 0 || kit.scan.trustScore > 100)
      errors.push('scan.trustScore must be 0-100');
    if (typeof kit.scan.blocked !== 'boolean')
      errors.push('scan.blocked must be boolean');
    if (!Array.isArray(kit.scan.findings))
      errors.push('scan.findings must be an array');
  }

  // No sensitive content allowed
  const json = JSON.stringify(kit);
  if (SENSITIVE_FILES.has(kit.name))
    errors.push(`name "${kit.name}" matches a sensitive file`);
  for (const skill of kit.skills || []) {
    const pathParts = skill.path.split(path.sep);
    if (pathParts.some(p => SENSITIVE_DIRS.has(p)))
      errors.push(`skill path "${skill.path}" references a sensitive directory`);
  }

  return errors;
}

// ── Security Scanner ──

const BLOCK_PATTERNS = [
  { pattern: /ignore.*(?:previous|above|prior).*instructions/i, msg: 'Prompt injection: ignore previous instructions' },
  { pattern: /do\s+not\s+(?:tell|inform|notify).*user/i, msg: 'Hide behavior from user' },
  { pattern: /(?:disable|bypass|skip|ignore).*(?:safety|security|permission)/i, msg: 'Disable safety features' },
  { pattern: /\|\s*curl\s+.*https?:\/\//i, msg: 'Shell exfiltration via curl pipe' },
  { pattern: />\s*\/dev\/tcp\//i, msg: 'Network exfiltration via /dev/tcp' },
  { pattern: /\/bin\/bash\s+-i/i, msg: 'Interactive shell (reverse shell)' },
  { pattern: /nc\s+(?:-e|--exec)/i, msg: 'Netcat reverse shell' },
  { pattern: /rm\s+-rf\s+(?:\/|~\/)/i, msg: 'Dangerous recursive deletion' },
  { pattern: /security\s+find-generic-password/i, msg: 'Keychain credential access' },
  { pattern: /cat\s+~\/\.ssh\//i, msg: 'SSH key access' },
  { pattern: /\d{3}-\d{2}-\d{4}/, msg: 'SSN found in content' },
  { pattern: /nsec1[a-z0-9]{58,}/, msg: 'Private key found' },
];

const WARN_PATTERNS = [
  { pattern: /exec\s*\(/i, msg: 'Contains exec() call' },
  { pattern: /eval\s*\(/i, msg: 'Contains eval() call' },
  { pattern: /curl\s+.*https?:\/\//i, msg: 'External curl usage' },
  { pattern: /\bsudo\s+/i, msg: 'sudo usage' },
  { pattern: /(?:brew|pip|npm|apt-get)\s+install/i, msg: 'Package installation command' },
  { pattern: /base64\s+(?:-d|--decode)/i, msg: 'Base64 decode (possible obfuscation)' },
];

// ── Helpers ──

function tryExec(cmd) {
  try {
    return execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
  } catch { return undefined; }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      meta[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
    }
  }
  return meta;
}

function walkDir(dir, callback) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !SENSITIVE_DIRS.has(entry.name)) {
        walkDir(fullPath, callback);
      }
    } else {
      if (!SENSITIVE_FILES.has(entry.name)) {
        callback(fullPath, entry.name);
      }
    }
  }
}

function runScan(content) {
  const findings = [];
  const seen = new Set();

  function check(text, patterns, severity) {
    for (const { pattern, msg } of patterns) {
      if (pattern.test(text) && !seen.has(`${severity}:${msg}`)) {
        seen.add(`${severity}:${msg}`);
        findings.push({ severity, message: msg, match: text.match(pattern)?.[0]?.slice(0, 100) });
      }
    }
  }

  check(content, BLOCK_PATTERNS, 'block');
  check(content, WARN_PATTERNS, 'warn');

  const blocks = findings.filter(f => f.severity === 'block').length;
  const warns = findings.filter(f => f.severity === 'warn').length;
  let score = 50;
  if (blocks === 0) score += 30;
  if (warns === 0) score += 20;
  score = Math.max(0, Math.min(100, score - blocks * 20 - warns * 5));

  return { trustScore: score, blocked: blocks > 0, summary: `${blocks} blocked, ${warns} warnings`, findings };
}

function formatScanReport(scan) {
  const lines = ['\n🔒 Security Scan\n'];
  const blocked = scan.findings.filter(f => f.severity === 'block');
  const warnings = scan.findings.filter(f => f.severity === 'warn');

  if (blocked.length) {
    lines.push(`❌ BLOCKED (${blocked.length})`);
    for (const f of blocked) lines.push(`  ${f.message}${f.match ? ` → "${f.match}"` : ''}`);
    lines.push('');
  }
  if (warnings.length) {
    lines.push(`⚠️  WARNINGS (${warnings.length})`);
    for (const f of warnings) lines.push(`  ${f.message}`);
    lines.push('');
  }

  lines.push(`Trust Score: ${scan.trustScore}/100`);
  if (!blocked.length && !warnings.length) lines.push('✅ Clean — no issues found.');
  return lines.join('\n');
}

// ── Build kit internally (never exposed as a command) ──

function buildKit(dir, repoUrl, owner) {
  const targetDir = path.resolve(dir);
  const dirName = path.basename(targetDir);
  const compatibility = new Set();
  const skills = [];
  const configs = [];

  // Detect agent config files
  for (const [agent, { files }] of Object.entries(AGENT_MARKERS)) {
    for (const marker of files) {
      if (SENSITIVE_FILES.has(marker)) continue;
      const fullPath = path.join(targetDir, marker);
      if (!fs.existsSync(fullPath)) continue;
      compatibility.add(agent);
      if (agent !== 'agent-skills') {
        configs.push({ file: marker, agent });
      }
    }
  }

  // Find SKILL.md files
  walkDir(targetDir, (filePath, fileName) => {
    if (fileName !== 'SKILL.md') return;
    const content = fs.readFileSync(filePath, 'utf8');
    const fm = parseFrontmatter(content);
    const skillDir = path.dirname(filePath);
    const relativePath = path.relative(targetDir, skillDir);

    skills.push({
      name: fm.name || path.basename(skillDir),
      description: fm.description || '',
      path: relativePath || '.',
      ...(fm.license && { license: fm.license }),
      ...(fm.compatibility && { compatibility: fm.compatibility }),
      ...(fm['allowed-tools'] && { allowedTools: fm['allowed-tools'].split(/\s+/) }),
    });

    compatibility.add('agent-skills');
  });

  // Scan all non-sensitive file content
  const allContent = [];
  walkDir(targetDir, (filePath) => {
    try { allContent.push(fs.readFileSync(filePath, 'utf8')); } catch {}
  });
  const scan = runScan(allContent.join('\n---\n'));

  /** @type {Kit} */
  const kit = {
    schema: KIT_SCHEMA_VERSION,
    name: dirName,
    description: `Agent skills from ${dirName}`,
    repoUrl,
    owner,
    compatibility: Array.from(compatibility),
    skills,
    configs,
    scan: { ...scan, scannedAt: new Date().toISOString() },
    pushedAt: new Date().toISOString(),
  };

  return kit;
}

// ── Push ──

async function push(dir = '.') {
  const targetDir = path.resolve(dir);

  // Must be a git repo with a GitHub remote
  const gitUrl = tryExec(`git -C "${targetDir}" remote get-url origin`);
  if (!gitUrl) {
    console.error('❌ Not a git repo or no remote origin.');
    console.error('   Push your code to GitHub first, then run `clawclawgo push`.');
    process.exit(1);
  }

  const repoUrl = gitUrl.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
  if (!repoUrl.includes('github.com')) {
    console.error('❌ Only GitHub repos supported.');
    process.exit(1);
  }

  // Require gh CLI
  const ghVersion = tryExec('gh --version');
  if (!ghVersion) {
    console.error('❌ GitHub CLI (gh) required. Install: https://cli.github.com/');
    process.exit(1);
  }
  const ghAuth = tryExec('gh auth status 2>&1');
  if (!ghAuth || ghAuth.includes('not logged in')) {
    console.error('❌ Not authenticated. Run: gh auth login');
    process.exit(1);
  }

  // Get owner from git
  const match = repoUrl.match(/github\.com\/([^/]+)\//);
  const owner = match ? match[1] : os.userInfo().username;

  console.log(`\n📤 Pushing: ${repoUrl}\n`);

  // Build kit internally
  const kit = buildKit(dir, repoUrl, owner);

  // Validate against schema
  const errors = validateKit(kit);
  if (errors.length) {
    console.error('❌ Kit validation failed:\n');
    for (const e of errors) console.error(`   • ${e}`);
    process.exit(1);
  }

  console.log(`   Skills: ${kit.skills.length}`);
  console.log(`   Configs: ${kit.configs.length}`);
  console.log(`   Compatibility: ${kit.compatibility.join(', ') || 'none detected'}`);
  console.log(`   Trust Score: ${kit.scan.trustScore}/100`);

  if (kit.scan.blocked) {
    console.log(formatScanReport(kit.scan));
    console.error('\n❌ Fix blocking issues before pushing.');
    process.exit(1);
  }

  // Fetch current registry
  console.log('\n📥 Fetching registry...');
  let registryContent;
  try {
    registryContent = tryExec(`gh api repos/${REGISTRY_REPO}/contents/${REGISTRY_FILE} --jq .content | base64 -d`);
    if (!registryContent) throw new Error('empty');
  } catch {
    try {
      const resp = await fetch(`https://raw.githubusercontent.com/${REGISTRY_REPO}/main/${REGISTRY_FILE}`, { signal: AbortSignal.timeout(10000) });
      registryContent = await resp.text();
    } catch { registryContent = null; }
  }

  let registry;
  try { registry = JSON.parse(registryContent); } catch { registry = { kits: [] }; }
  if (!registry.kits) registry.kits = [];

  // Check duplicate — update if exists, otherwise add
  const existingIdx = registry.kits.findIndex(k => k.repoUrl === kit.repoUrl);
  if (existingIdx >= 0) {
    console.log(`\n🔄 Updating existing entry for ${kit.repoUrl}`);
    registry.kits[existingIdx] = kit;
  } else {
    registry.kits.push(kit);
  }

  // Validate every kit in the registry before pushing
  for (const [i, k] of registry.kits.entries()) {
    const kitErrors = validateKit(k);
    if (kitErrors.length) {
      console.error(`❌ Registry kit at index ${i} ("${k.name}") fails validation:`);
      for (const e of kitErrors) console.error(`   • ${e}`);
      console.error('\n   This is a registry integrity issue. Proceeding with your entry only.');
    }
  }

  const updatedRegistry = JSON.stringify(registry, null, 2) + '\n';

  // Create PR
  const branchName = `registry/add-${kit.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}`;
  const prTitle = existingIdx >= 0 ? `registry: update ${kit.name}` : `registry: add ${kit.name}`;
  const prBody = [
    `## ${existingIdx >= 0 ? 'Updated' : 'New'} kit: ${kit.name}`,
    '',
    `**Repo:** ${kit.repoUrl}`,
    `**Skills:** ${kit.skills.length}`,
    `**Configs:** ${kit.configs.length}`,
    `**Compatibility:** ${kit.compatibility.join(', ')}`,
    `**Trust Score:** ${kit.scan.trustScore}/100`,
    '',
    '```json',
    JSON.stringify(kit, null, 2),
    '```',
    '',
    '_Submitted via `clawclawgo push`_',
  ].join('\n');

  console.log('🔀 Creating PR...\n');

  try {
    tryExec(`gh repo fork ${REGISTRY_REPO} --clone=false 2>/dev/null`);
    const ghUser = tryExec('gh api user --jq .login');
    if (!ghUser) throw new Error('Could not determine GitHub username');

    const mainSha = tryExec(`gh api repos/${ghUser}/clawclawgo/git/ref/heads/main --jq .object.sha`);
    if (!mainSha) throw new Error('Could not get main branch SHA');

    tryExec(`gh api repos/${ghUser}/clawclawgo/git/refs -f ref=refs/heads/${branchName} -f sha=${mainSha}`);

    const base64Content = Buffer.from(updatedRegistry).toString('base64');
    const fileSha = tryExec(`gh api repos/${ghUser}/clawclawgo/contents/${REGISTRY_FILE} --jq .sha 2>/dev/null`);
    const fileArgs = [`gh api repos/${ghUser}/clawclawgo/contents/${REGISTRY_FILE}`, `-X PUT`, `-f message="${prTitle}"`, `-f content="${base64Content}"`, `-f branch=${branchName}`];
    if (fileSha) fileArgs.push(`-f sha=${fileSha}`);
    tryExec(fileArgs.join(' '));

    const prUrl = tryExec(`gh pr create --repo ${REGISTRY_REPO} --head ${ghUser}:${branchName} --title "${prTitle}" --body '${prBody.replace(/'/g, "'\\''")}' 2>&1`);

    if (prUrl?.includes('github.com')) console.log(`✅ PR created: ${prUrl}`);
    else console.log(`✅ PR submitted to ${REGISTRY_REPO}`);
  } catch (err) {
    console.log(`\n⚠️  Auto-PR failed: ${err.message}`);
    console.log('\nYour kit passed validation. Submit manually:');
    console.log('1. Fork bolander72/clawclawgo');
    console.log(`2. Add your kit to ${REGISTRY_FILE}`);
    console.log('3. Submit a PR');
  }
}

// ── Add ──

async function add(source, destDir) {
  let repoUrl = source;
  if (!repoUrl.startsWith('http://') && !repoUrl.startsWith('https://')) {
    if (repoUrl.match(/^[\w.-]+\/[\w.-]+$/)) {
      repoUrl = `https://github.com/${repoUrl}`;
    } else {
      console.error('❌ Expected owner/repo or a GitHub URL.');
      console.error('   Example: clawclawgo add garrytan/gstack');
      process.exit(1);
    }
  }

  repoUrl = repoUrl.replace(/\.git$/, '').replace(/\/$/, '');
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  const repoName = match ? match[1] : path.basename(repoUrl);
  const dirName = repoName.split('/').pop();
  const outputDir = destDir || process.cwd();
  const cloneDir = path.join(outputDir, dirName);

  if (fs.existsSync(cloneDir)) {
    console.error(`❌ Directory already exists: ${cloneDir}`);
    console.error('   Remove it first or use --dest for another location.');
    process.exit(1);
  }

  console.log(`\n📥 Cloning ${repoName}...`);

  try {
    execSync(`git clone --depth 1 "${repoUrl}.git" "${cloneDir}"`, { stdio: 'pipe' });
  } catch {
    console.error(`❌ Clone failed. Is this a valid public repo?`);
    process.exit(1);
  }

  // Remove .git
  try { fs.rmSync(path.join(cloneDir, '.git'), { recursive: true, force: true }); } catch {}

  // Find skills
  const skills = [];
  walkDir(cloneDir, (filePath, fileName) => {
    if (fileName !== 'SKILL.md') return;
    const content = fs.readFileSync(filePath, 'utf8');
    const fm = parseFrontmatter(content);
    const skillDir = path.dirname(filePath);
    skills.push({
      name: fm.name || path.basename(skillDir),
      description: fm.description || '',
      path: path.relative(cloneDir, skillDir),
    });
  });

  // Detect agent configs
  const detectedConfigs = [];
  for (const [agent, { files }] of Object.entries(AGENT_MARKERS)) {
    if (agent === 'agent-skills') continue;
    for (const marker of files) {
      if (fs.existsSync(path.join(cloneDir, marker))) {
        detectedConfigs.push({ file: marker, agent });
      }
    }
  }

  // Scan
  const allContent = [];
  walkDir(cloneDir, (filePath) => {
    try { allContent.push(fs.readFileSync(filePath, 'utf8')); } catch {}
  });
  const scan = runScan(allContent.join('\n---\n'));

  if (scan.blocked && !args.includes('--force')) {
    console.log(formatScanReport(scan));
    console.error('\n❌ Blocked by security scan. Use --force to override.');
    try { fs.rmSync(cloneDir, { recursive: true, force: true }); } catch {}
    process.exit(1);
  }

  // Generate CLAWCLAWGO.md
  const readmeLines = [
    `# ${repoName}`,
    '',
    `Added from [${repoUrl}](${repoUrl}) via \`clawclawgo add\`.`,
    '',
    `**Trust Score:** ${scan.trustScore}/100`,
    `**Added:** ${new Date().toISOString().split('T')[0]}`,
    '',
  ];

  if (skills.length) {
    readmeLines.push(`## Skills (${skills.length})`, '');
    for (const s of skills) {
      readmeLines.push(`- **${s.name}**${s.description ? ' — ' + s.description : ''} → \`${s.path}/SKILL.md\``);
    }
    readmeLines.push('');
  }

  if (detectedConfigs.length) {
    readmeLines.push('## Agent Configs', '');
    for (const c of detectedConfigs) readmeLines.push(`- \`${c.file}\` (${c.agent})`);
    readmeLines.push('');
  }

  if (scan.findings.length) {
    readmeLines.push('## Scan Findings', '');
    for (const f of scan.findings) readmeLines.push(`- ${f.severity === 'block' ? '❌' : '⚠️'} ${f.message}`);
    readmeLines.push('');
  }

  readmeLines.push('---', `_Generated by [ClawClawGo](https://clawclawgo.com)_`);
  fs.writeFileSync(path.join(cloneDir, 'CLAWCLAWGO.md'), readmeLines.join('\n'), 'utf8');

  // Output
  console.log(`\n✅ Added to ${cloneDir}/`);
  console.log(`   Source: ${repoUrl}`);
  console.log(`   Trust Score: ${scan.trustScore}/100`);

  if (skills.length) {
    console.log(`\n⚡ Skills (${skills.length}):`);
    for (const s of skills) {
      console.log(`   • ${s.name}${s.description ? ' — ' + s.description.slice(0, 60) : ''}`);
    }
  } else if (detectedConfigs.length) {
    console.log(`\n⚙️  Agent configs found:`);
    for (const c of detectedConfigs) console.log(`   • ${c.file} (${c.agent})`);
  } else {
    console.log('\n   No skills or agent configs found in this repo.');
  }

  if (scan.findings.filter(f => f.severity === 'warn').length) {
    console.log(`\n⚠️  ${scan.findings.filter(f => f.severity === 'warn').length} scan warnings — see CLAWCLAWGO.md`);
  }

  console.log(`\n📄 See CLAWCLAWGO.md for details.\n`);
}

// ── CLI Router ──

const args = process.argv.slice(2);
const command = args[0];

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

(async () => {
  try {
    switch (command) {
      case 'push': {
        const dir = args.find((a, i) => i > 0 && !a.startsWith('-')) || '.';
        await push(dir);
        break;
      }

      case 'add': {
        const source = args[1];
        const dest = getArg('--dest');
        if (!source) {
          console.error('Usage: clawclawgo add <owner/repo> [--dest dir]');
          process.exit(1);
        }
        await add(source, dest);
        break;
      }

      default:
        console.log(`ClawClawGo CLI

Commands:
  push [dir]                      Push your kit to the registry
  add <owner/repo> [--dest dir]   Add a kit from GitHub

Examples:
  clawclawgo push
  clawclawgo push ~/my-skills
  clawclawgo add garrytan/gstack
  clawclawgo add anthropics/skills --dest ~/kits`);
    }
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
})();
