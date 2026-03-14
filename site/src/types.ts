// ─── Core Types ────────────────────────────────────────────

export type BuildSource = 'github' | 'clawhub' | 'skillssh' | 'local'

export interface BuildItem {
  name: string
  color?: string
}

export interface Build {
  id: string
  name: string
  description: string
  source: BuildSource
  // GitHub-specific
  repoUrl?: string
  owner?: string
  stars?: number
  forks?: number
  lastUpdated?: string
  // Universal
  creator: string
  createdAt: number | string
  tags: string[]
  items: BuildItem[]
  keyCount: number
  content: BuildContent
  compatibility: string[] // e.g. ['openclaw', 'claude-code', 'cursor']
  permissions?: string[] // declared tool access e.g. ['filesystem', 'web-search', 'email']
  trustTier: 'verified' | 'community' | 'unreviewed'
}

export interface BuildContent {
  schema?: number | string
  meta?: {
    name?: string
    description?: string
    agentName?: string
    compatibility?: string[]
    permissions?: string[]
    tags?: string[]
    source?: BuildSource
    repoUrl?: string
    [key: string]: unknown
  }
  agentName?: string
  dependencies?: unknown
  model?: {
    tiers?: Record<string, {
      alias?: string
      model?: string
      provider?: string
      [key: string]: unknown
    }>
    [key: string]: unknown
  }
  skills?: {
    items?: Array<{ name: string; [key: string]: unknown }>
    [key: string]: unknown
  }
  integrations?: {
    items?: Array<{ name: string; [key: string]: unknown }>
    [key: string]: unknown
  }
  automations?: {
    heartbeat?: unknown
    cron?: unknown[]
    [key: string]: unknown
  }
  persona?: {
    identity?: {
      name?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  permissions?: string[]
  [key: string]: unknown
}

// ─── Security Scanner Types ────────────────────────────────

export interface PIIFinding {
  name: string
  count: number
  samples: string[]
}

export interface SuspiciousFinding {
  name: string
  severity: 'low' | 'medium' | 'high'
  count: number
  samples: string[]
}

export interface InfoFinding {
  name: string
  value: string
}

export interface PermissionFinding {
  name: string
  severity: 'info' | 'warning'
  message: string
}

export interface ScanResult {
  findings: {
    pii: PIIFinding[]
    suspicious: SuspiciousFinding[]
    info: InfoFinding[]
    permissions?: PermissionFinding[]
  }
  score: 'PASS' | 'WARN' | 'FAIL'
}

// ─── Component Props ───────────────────────────────────────

export interface FeedItemProps {
  build: Build
  index: number
  isNew: boolean
  onClick: () => void
  onTagClick?: (tag: string) => void
}

export interface BuildDetailProps {
  build: Build
  onClose: () => void
  onApply: (build: Build) => void
}

export interface ApplyWizardProps {
  build: Build
  onClose: () => void
}

export interface CopyButtonProps {
  text: string
  label?: string
}

export interface NavProps {
  // No props currently
}
