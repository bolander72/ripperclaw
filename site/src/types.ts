// ─── Core Types ────────────────────────────────────────────

export interface BuildItem {
  name: string
  color?: string
}

export interface Build {
  id: string
  name: string
  agentName: string
  creator: string
  createdAt: number | string // timestamp or date string
  isNew: boolean
  tags: string[]
  items: BuildItem[]
  keyCount: number
  content: BuildContent
  fork: {
    eventId: string
    relay: string
  } | null
  originalAuthor: string | null
  remixCount: number
}

export interface BuildContent {
  schema?: string
  meta?: {
    agentName?: string
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
  [key: string]: unknown
}

export interface BuildEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
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

export interface ScanResult {
  findings: {
    pii: PIIFinding[]
    suspicious: SuspiciousFinding[]
    info: InfoFinding[]
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
