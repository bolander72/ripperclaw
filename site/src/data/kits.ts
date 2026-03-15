import type { Kit } from '../types'
import registryData from '../../../registry/kits.json'

// Build-time: reads from registry/kits.json — the single source of truth.
// No hardcoded sample data. The registry IS the data.
export function getKits(): Kit[] {
  return (registryData.kits as any[]).map(entry => {
    const owner = entry.repoUrl?.split('github.com/')[1]?.split('/')[0] || ''
    return {
      id: entry.id,
      name: entry.name,
      description: entry.description || '',
      source: 'github' as const,
      repoUrl: entry.repoUrl,
      owner,
      stars: entry.stars || 0,
      forks: entry.forks || 0,
      lastUpdated: entry.addedAt?.split('T')[0] || '',
      creator: `@${owner}`,
      createdAt: entry.addedAt?.split('T')[0] || '',
      compatibility: entry.compatibility || [],
      trustTier: entry.trustTier || 'unreviewed',
      detectedFiles: entry.detectedFiles || [],
      skillCount: entry.skillCount || 0,
    }
  })
}
