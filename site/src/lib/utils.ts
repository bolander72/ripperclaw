import type { KitContent, Kit, KitItem, ScanResult, PIIFinding, SuspiciousFinding, InfoFinding, PermissionFinding } from '../types'

// ─── Constants ─────────────────────────────────────────────

export const itemGradients = [
  'from-purple-500/40 to-blue-500/40',
  'from-cyan-500/40 to-emerald-500/40',
  'from-pink-500/40 to-violet-500/40',
  'from-green-500/40 to-cyan-500/40',
  'from-rose-500/40 to-blue-500/40',
  'from-amber-500/40 to-orange-500/40',
]

// ─── Helpers ───────────────────────────────────────────────

export function formatDate(timestamp: number | string): string {
  const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime() / 1000
  const d = new Date(ts * 1000)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function extractItems(content: KitContent): { items: KitItem[]; keyCount: number } {
  const items: KitItem[] = []
  if (content.model?.tiers) {
    Object.values(content.model.tiers).forEach(tier => {
      if (tier?.alias) items.push({ name: tier.alias })
      else if (tier?.model) items.push({ name: tier.model.split('/').pop() || tier.model })
    })
  }
  if (content.skills?.items) {
    content.skills.items.forEach(s => items.push({ name: s.name }))
  }
  if (content.integrations?.items) {
    content.integrations.items.forEach(i => items.push({ name: i.name }))
  }
  if (content.automations?.heartbeat) items.push({ name: 'Heartbeat' })
  if (content.automations?.cron?.length) items.push({ name: `${content.automations.cron.length} cron jobs` })
  if (content.persona?.identity?.name) items.push({ name: content.persona.identity.name })
  const configKeys = Object.keys(content).filter(k => !['schema', 'meta', 'dependencies'].includes(k))
  return { items, keyCount: configKeys.length }
}

// ─── Security Scanner ──────────────────────────────────────

interface PIIPattern {
  name: string
  pattern: RegExp
}

interface SuspiciousPattern {
  name: string
  pattern: RegExp
  severity: 'low' | 'medium' | 'high'
}

const PII_PATTERNS: PIIPattern[] = [
  { name: 'Email', pattern: /[\w.-]+@[\w.-]+\.\w+/g },
  { name: 'Phone', pattern: /\+?1?\d{10,15}/g },
  { name: 'IP Address', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
  { name: 'Street Address', pattern: /\d+\s+[\w\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Circle|Place|Terrace)\b/gi },
  { name: 'API Key', pattern: /(?:sk|pk|api[_-]?key)[_-][\w-]{20,}/gi },
  { name: 'Bearer Token', pattern: /Bearer\s+[\w.-]{20,}/g },
]

const SUSPICIOUS_PATTERNS: SuspiciousPattern[] = [
  { name: 'Prompt injection', pattern: /ignore\s+(?:all\s+)?(?:previous|above|prior)\s+instructions/gi, severity: 'high' },
  { name: 'System prompt override', pattern: /you\s+are\s+now\s+(?:a|an)\s+(?:new|different)/gi, severity: 'high' },
  { name: 'Exfiltration attempt', pattern: /curl\s+.*\|\s*sh|wget\s+.*\|\s*(?:ba)?sh|eval\s*\(/gi, severity: 'high' },
  { name: 'Credential access', pattern: /security\s+find-generic-password|keychain|\.env\b/gi, severity: 'medium' },
  { name: 'File system access', pattern: /\/etc\/(?:passwd|shadow)|~\/\.[a-z]/gi, severity: 'medium' },
  { name: 'Network exfil', pattern: /(?:nc|netcat|ncat)\s+-[a-z]*\s+\d/gi, severity: 'high' },
]

// Tool/permission patterns for permission checker
const TOOL_PATTERNS: Record<string, RegExp[]> = {
  'filesystem': [/\bRead\b|\bWrite\b|\bEdit\b|file_path|readFile|writeFile/gi],
  'web-search': [/web_search|brave.*search|google.*search/gi],
  'email': [/\bemail\b|message.*email|smtp|imap/gi],
  'calendar': [/calendar|caldir|icalPal/gi],
  'smart-home': [/smart.?home|home.?assistant|homekit/gi],
  'browser': [/\bbrowser\b|playwright|puppeteer/gi],
  'exec': [/\bexec\b|shell|command|process/gi],
  'message': [/\bmessage\b|sms|imessage|telegram|discord/gi],
}

export function scanBuild(content: KitContent): ScanResult {
  const text = JSON.stringify(content, null, 2)
  const findings: { pii: PIIFinding[]; suspicious: SuspiciousFinding[]; info: InfoFinding[]; permissions: PermissionFinding[] } = { 
    pii: [], 
    suspicious: [], 
    info: [],
    permissions: []
  }

  // PII scan
  for (const { name, pattern } of PII_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      findings.pii.push({ name, count: matches.length, samples: [...new Set(matches)].slice(0, 3) })
    }
  }

  // Suspicious patterns scan
  for (const { name, pattern, severity } of SUSPICIOUS_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      findings.suspicious.push({ name, severity, count: matches.length, samples: [...new Set(matches)].slice(0, 2) })
    }
  }

  // Permission checking
  const declaredPermissions = content.permissions || content.meta?.permissions || []
  const detectedTools: Set<string> = new Set()

  for (const [tool, patterns] of Object.entries(TOOL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        detectedTools.add(tool)
        break
      }
    }
  }

  // Check for undeclared permissions
  for (const tool of detectedTools) {
    if (!declaredPermissions.includes(tool)) {
      findings.permissions.push({
        name: tool,
        severity: 'warning',
        message: `Kit uses ${tool} but doesn't declare it in permissions`
      })
    }
  }

  // Info section
  const keys = Object.keys(content).filter(k => !['schema', 'meta', 'dependencies'].includes(k))
  findings.info.push({ name: 'Config keys', value: keys.join(', ') })
  
  if (content.model?.tiers) {
    const models = Object.values(content.model.tiers).map(t => t.alias || `${t.provider}/${t.model}`).join(', ')
    findings.info.push({ name: 'Models', value: models })
  }
  
  if (content.skills?.items?.length) {
    findings.info.push({ name: 'Skills', value: content.skills.items.map(s => s.name).join(', ') })
  }

  if (content.meta?.compatibility?.length) {
    findings.info.push({ name: 'Compatibility', value: content.meta.compatibility.join(', ') })
  }

  if (declaredPermissions.length > 0) {
    findings.info.push({ name: 'Declared permissions', value: declaredPermissions.join(', ') })
  }

  // Scoring
  const hasCritical = findings.suspicious.some(f => f.severity === 'high')
  const hasPII = findings.pii.length > 0
  const score = hasCritical ? 'FAIL' : hasPII ? 'WARN' : 'PASS'

  return { findings, score }
}
