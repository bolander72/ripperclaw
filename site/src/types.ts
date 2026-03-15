// ─── Core Types ────────────────────────────────────────────

export type KitSource = 'github' | 'clawhub' | 'skillssh' | 'custom'

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
  skillCount: number        // how many skills in this kit
  compatibility: string[]   // which agents this works with (agent IDs)
  trustTier: 'verified' | 'community' | 'unreviewed'
  // Detection info
  detectedFiles?: string[]  // e.g. ['SKILL.md', 'CLAUDE.md', '.cursorrules']
}

// ─── Component Props ───────────────────────────────────────

export interface FeedItemProps {
  kit: Kit
  index: number
  isNew: boolean
  onClick: () => void
  onTagClick?: (tag: string) => void
}

export interface CopyButtonProps {
  text: string
  label?: string
}
