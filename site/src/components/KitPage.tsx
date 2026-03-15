import { useState } from 'react'
import { IconEye, IconHash, IconBrandGithub, IconExternalLink, IconShield, IconAlertTriangle, IconFolder, IconArrowLeft, IconTerminal2 } from '@tabler/icons-react'
import { formatDate } from '../lib/utils'
import { getAgentsByIds } from '../agents'
import CopyButton from './CopyButton'
import type { Kit } from '../types'

const TRUST_BADGES = {
  verified: { label: 'VERIFIED', color: 'bg-green-400/15 border-green-400/30 text-green-400', icon: IconShield },
  community: { label: 'COMMUNITY', color: 'bg-blue-400/15 border-blue-400/30 text-blue-400', icon: null },
  unreviewed: { label: 'UNREVIEWED', color: 'bg-amber-400/15 border-amber-400/30 text-amber-400', icon: IconAlertTriangle },
}

export default function KitPage({ kit }: { kit: Kit }) {
  const [showRaw, setShowRaw] = useState(false)
  const trustBadge = TRUST_BADGES[kit.trustTier]
  const TrustIcon = trustBadge.icon
  const agents = getAgentsByIds(kit.compatibility)

  const cloneCommand = kit.repoUrl ? `git clone ${kit.repoUrl}.git` : null
  const addCommand = kit.repoUrl
    ? `npx clawclawgo add ${kit.repoUrl.replace('https://github.com/', '')}`
    : null

  const kitJson = JSON.stringify({
    name: kit.name,
    description: kit.description,
    source: kit.source,
    ...(kit.repoUrl && { repoUrl: kit.repoUrl }),
    ...(kit.owner && { owner: kit.owner }),
    compatibility: kit.compatibility,
    trustTier: kit.trustTier,
    tags: kit.tags,
    skillCount: kit.skillCount,
  }, null, 2)

  return (
    <div className="min-h-screen bg-rc-bg">
      {/* Header */}
      <header className="border-b border-rc-border bg-rc-bg/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <a
            href="/explore"
            className="flex items-center gap-2 text-rc-text-dim hover:text-rc-cyan transition-colors text-sm font-grotesk"
          >
            <IconArrowLeft size={16} />
            Back
          </a>
          <div className="h-5 w-px bg-rc-border" />
          <a href="/" className="font-grotesk font-bold text-rc-text text-lg hover:text-rc-cyan transition-colors">
            ClawClawGo
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Kit header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30">
              <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">{kit.source.toUpperCase()}</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${trustBadge.color}`}>
              {TrustIcon && <TrustIcon size={12} />}
              <span className="text-[10px] font-mono font-bold tracking-wider">{trustBadge.label}</span>
            </div>
            {kit.source === 'github' && kit.stars && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-yellow/15 border border-rc-yellow/30">
                <IconBrandGithub size={12} className="text-rc-yellow" />
                <span className="text-[10px] font-mono font-bold text-rc-yellow">{kit.stars.toLocaleString()} ⭐</span>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-grotesk font-bold text-rc-text mb-2">
            {kit.name}
          </h1>
          <p className="text-rc-text-dim text-lg mb-3">
            {kit.description}
          </p>
          <p className="text-rc-text-muted text-sm">
            <span className="text-rc-cyan/70 font-mono">{kit.creator}</span>
            {' · '}
            <span className="font-mono">{formatDate(kit.createdAt)}</span>
          </p>
          {kit.tags && kit.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {kit.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white/5 rounded-lg text-xs font-mono text-rc-text-dim flex items-center gap-1"
                >
                  <IconHash size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Get This Kit */}
        <div className="pb-6 mb-6 border-b border-rc-border">
          <h2 className="text-xl font-grotesk font-bold text-rc-text mb-4">Get This Kit</h2>

          {/* Primary: View on GitHub */}
          {kit.repoUrl && (
            <a
              href={kit.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3 bg-rc-cyan text-rc-bg rounded-xl hover:bg-rc-cyan/90 transition-colors text-sm font-grotesk font-semibold mb-4"
            >
              <IconBrandGithub size={18} />
              View on GitHub
              <IconExternalLink size={14} className="opacity-60" />
            </a>
          )}

          {/* Clone command */}
          {cloneCommand && (
            <div className="mb-3">
              <p className="text-rc-text-muted text-xs font-mono mb-2">Clone:</p>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-rc-border">
                <code className="flex-1 text-xs font-mono text-rc-text overflow-x-auto">
                  {cloneCommand}
                </code>
                <CopyButton text={cloneCommand} />
              </div>
            </div>
          )}

          {/* CLI add command */}
          {addCommand && (
            <div>
              <p className="text-rc-text-muted text-xs font-mono mb-2">Or use the CLI (clones + scans):</p>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-rc-border">
                <IconTerminal2 size={14} className="text-rc-text-muted shrink-0" />
                <code className="flex-1 text-xs font-mono text-rc-text overflow-x-auto">
                  {addCommand}
                </code>
                <CopyButton text={addCommand} />
              </div>
            </div>
          )}
        </div>

        {/* Compatibility badges */}
        {agents.length > 0 && (
          <div className="pb-6 mb-6 border-b border-rc-border">
            <p className="text-rc-text-muted text-xs font-mono mb-3">Compatible with:</p>
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`px-3 py-1.5 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30 ${agent.color || 'text-rc-cyan'}`}
                >
                  <span className="text-xs font-mono font-semibold">{agent.name}</span>
                  <span className="text-[9px] font-mono text-rc-text-muted ml-1">({agent.company})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills count + repo link */}
        <div className="pb-6 mb-6 border-b border-rc-border">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-rc-border">
            <div className="flex items-center gap-2 text-rc-text font-grotesk">
              <IconFolder size={18} className="text-rc-cyan" />
              <span className="font-semibold">{kit.skillCount} {kit.skillCount === 1 ? 'skill' : 'skills'}</span>
            </div>
            {kit.repoUrl && (
              <a
                href={kit.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-sm text-rc-cyan hover:underline inline-flex items-center gap-1.5 font-grotesk"
              >
                Browse on GitHub
                <IconExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* Raw JSON toggle */}
        <div>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-rc-text rounded-xl border border-rc-border transition-colors text-sm font-grotesk mb-4"
          >
            <IconEye size={16} />
            {showRaw ? 'Hide' : 'View'} Kit Metadata
          </button>
          {showRaw && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-rc-text-muted text-xs font-mono">Kit metadata (used by ClawClawGo internally)</p>
                <CopyButton text={kitJson} />
              </div>
              <pre className="bg-black/30 rounded-xl p-4 text-xs font-mono text-rc-text-dim overflow-auto max-h-80 border border-rc-border">
                {kitJson}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
