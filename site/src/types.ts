// ─── Core Types ────────────────────────────────────────────

export type KitSource = 'github' | 'clawhub' | 'skillssh' | 'custom'

export interface Skill {
  name: string
  description: string
  url?: string             // direct link to the skill (clawhub, skills.sh, github, etc.)
  path?: string            // relative path in repo (e.g. 'skills/plan-ceo-review')
  compatibility?: string   // from SKILL.md frontmatter
  license?: string
  metadata?: Record<string, string>
  allowedTools?: string[]
}

export interface Kit {
  id: string
  name: string
  description: string
  source: KitSource
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
  skills: Skill[]           // the actual skills in this kit
  compatibility: string[]   // which agents this works with (agent IDs)
  trustTier: 'verified' | 'community' | 'unreviewed'
  // Detection info
  detectedFiles?: string[]  // e.g. ['SKILL.md', 'CLAUDE.md', '.cursorrules']
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
  kit: Kit
  index: number
  isNew: boolean
  onClick: () => void
  onTagClick?: (tag: string) => void
}

export interface KitDetailProps {
  kit: Kit
  onClose: () => void
  onExport: (kit: Kit) => void
}

export interface ExportWizardProps {
  kit: Kit
  onClose: () => void
}

export interface CopyButtonProps {
  text: string
  label?: string
}

export interface NavProps {
  // No props currently
}
