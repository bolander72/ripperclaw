#!/usr/bin/env node
/**
 * ClawClawGo CLI
 *
 * Usage:
 *   clawclawgo pack [dir] [--out file]     Pack your skills into a kit
 *   clawclawgo push [dir]                  Push your kit to the registry
 *   clawclawgo add <repo|owner/repo>       Add a kit from GitHub
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

// ── Constants ──

const REGISTRY_REPO = 'bolander72/clawclawgo';
const REGISTRY_FILE = 'registry/kits.json';

// Files to exclude from packing (sensitive / personal)
const SENSITIVE_FILES = new Set([
  'SOUL.md', 'USER.md', 'MEMORY.md', 'IDENTITY.md',
  'openclaw.json', '.env', '.env.local',
]);
const SENSITIVE_DIRS = new Set([
  'memory', '.ssh', '.gnupg', '.openclaw',
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

function scrubPII(text) {
  if (!text) return text;
  return text
    .replace(/\+?1?\d{10,11}/g, '[REDACTED_PHONE]')
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[REDACTED_EMAIL]')
    .replace(/\d+\s+[\w\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct)\b[^.\n]*/gi, '[REDACTED_ADDRESS]')
    .replace(/\d{3}-\d{2}-\d{4}/g, '[REDACTED_SSN]');
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
      if (!SKIP_DIRS.has(entry.name)) walkDir(fullPath, callback);
    } else {
      callback(fullPath, entry.name);
    }
  }
}

// ── Scanner ──

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

// ── Pack ──

function pack(dir = '.') {
  const targetDir = path.resolve(dir);
  const dirName = path.basename(targetDir);
  const compatibility = new Set();
  const skills = [];
  const configs = [];

  // Detect agent config files (skip sensitive ones)
  for (const [agent, { files }] of Object.entries(AGENT_MARKERS)) {
    for (const marker of files) {
      if (SENSITIVE_FILES.has(marker)) continue;
      const fullPath = path.join(targetDir, marker);
      if (!fs.existsSync(fullPath)) continue;
      compatibility.add(agent);

      if (agent !== 'agent-skills') {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            const content = fs.readFileSync(fullPath, 'utf8');
            configs.push({
              file: marker,
              agent,
              preview: scrubPII(content.slice(0, 500)) + (content.length > 500 ? '...' : ''),
            });
          }
        } catch { /* skip */ }
      }
    }
  }

  // Find SKILL.md files (skip sensitive dirs)
  walkDir(targetDir, (filePath, fileName) => {
    // Skip sensitive directories
    const relPath = path.relative(targetDir, filePath);
    if (SENSITIVE_DIRS.has(relPath.split(path.sep)[0])) return;
    if (SENSITIVE_FILES.has(fileName)) return;

    if (fileName !== 'SKILL.md') return;
    const content = fs.readFileSync(filePath, 'utf8');
    const fm = parseFrontmatter(content);
    const skillDir = path.dirname(filePath);
    const relativePath = path.relative(targetDir, skillDir);

    skills.push({
      name: fm.name || path.basename(skillDir),
      description: fm.description || '',
      path: relativePath,
      ...(fm.license && { license: fm.license }),
      ...(fm.compatibility && { compatibility: fm.compatibility }),
      ...(fm['allowed-tools'] && { allowedTools: fm['allowed-tools'].split(/\s+/) }),
    });

    compatibility.add('agent-skills');
  });

  const kit = {
    name: dirName,
    description: `Agent skills from ${dirName}`,
    version: 1,
    exportedAt: new Date().toISOString(),
    compatibility: Array.from(compatibility),
    skills,
    configs,
  };

  // Bake scan into output
  const scan = runScan(JSON.stringify(kit));
  kit.scan = { ...scan, scannedAt: new Date().toISOString() };

  return kit;
}

// ── Push ──

async function push(dir = '.') {
  const targetDir = path.resolve(dir);

  const gitUrl = tryExec(`git -C "${targetDir}" remote get-url origin`);
  if (!gitUrl) {
    console.error('❌ Not a git repo or no remote origin. Push your code to GitHub first.');
    process.exit(1);
  }

  const ghVersion = tryExec('gh --version');
  if (!ghVersion) {
    console.error('❌ GitHub CLI (gh) required. Install: https://cli.github.com/');
    process.exit(1);
  }

  const ghAuth = tryExec('gh auth status 2>&1');
  if (!ghAuth || ghAuth.includes('not logged in')) {
    console.error('❌ Run: gh auth login');
    process.exit(1);
  }

  console.log(`\n📤 Pushing: ${gitUrl}\n`);

  const kit = pack(dir);
  const { scan } = kit;

  console.log(`   Skills: ${kit.skills.length}`);
  console.log(`   Compatibility: ${kit.compatibility.join(', ') || 'none detected'}`);
  console.log(`   Trust Score: ${scan.trustScore}/100`);

  if (scan.blocked) {
    console.log(formatScanReport(scan));
    console.error('\n❌ Fix blocking issues before pushing.');
    process.exit(1);
  }

  const repoUrl = gitUrl.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
  const entry = {
    url: repoUrl,
    name: kit.name,
    description: kit.description,
    compatibility: kit.compatibility,
    tags: [...new Set(kit.skills.map(s => s.name.split('-')[0]).filter(Boolean))],
    addedAt: new Date().toISOString().split('T')[0],
  };

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

  // Check duplicate
  if (registry.kits.find(k => k.url === entry.url)) {
    console.log(`\n⚠️  ${entry.url} is already in the registry.`);
    process.exit(0);
  }

  registry.kits.push(entry);
  const updatedRegistry = JSON.stringify(registry, null, 2) + '\n';

  // Create PR
  const branchName = `registry/add-${kit.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}`;
  const prTitle = `registry: add ${entry.name}`;
  const prBody = `## New kit: ${entry.name}\n\n**URL:** ${entry.url}\n**Skills:** ${kit.skills.length}\n**Compatibility:** ${entry.compatibility.join(', ')}\n**Trust Score:** ${scan.trustScore}/100\n\n\`\`\`json\n${JSON.stringify(entry, null, 2)}\n\`\`\`\n\n_Submitted via \`clawclawgo push\`_`;

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
    console.log('\n📝 Registry entry (submit manually):\n');
    console.log(JSON.stringify(entry, null, 2));
    console.log(`\nAdd this to ${REGISTRY_FILE} in ${REGISTRY_REPO} and submit a PR.`);
  }
}

// ── Add ──

async function add(source, destDir) {
  // Normalize to GitHub URL
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

  // Detect agent config files
  const detectedConfigs = [];
  for (const [agent, { files }] of Object.entries(AGENT_MARKERS)) {
    if (agent === 'agent-skills') continue;
    for (const marker of files) {
      if (fs.existsSync(path.join(cloneDir, marker))) {
        detectedConfigs.push({ file: marker, agent });
      }
    }
  }

  // Scan everything
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

  // Generate a kit README
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
    console.log(`\n⚠️  ${scan.findings.filter(f => f.severity === 'warn').length} scan warnings.`);
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
      case 'pack': {
        const dir = args.find((a, i) => i > 0 && !a.startsWith('-')) || '.';
        const outFile = getArg('--out');
        const kit = pack(dir);
        const json = JSON.stringify(kit, null, 2);
        if (outFile) {
          fs.writeFileSync(outFile, json, 'utf8');
          console.log(`✅ Packed to ${outFile}`);
          console.log(`   Skills: ${kit.skills.length}`);
          console.log(`   Trust Score: ${kit.scan.trustScore}/100`);
        } else {
          console.log(json);
        }
        break;
      }

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
  pack [dir] [--out file]         Pack your skills into a kit
  push [dir]                      Push your kit to the registry
  add <owner/repo> [--dest dir]   Add a kit from GitHub

Examples:
  clawclawgo pack . --out kit.json
  clawclawgo push
  clawclawgo add garrytan/gstack
  clawclawgo add anthropics/skills --dest ~/kits`);
    }
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
})();
