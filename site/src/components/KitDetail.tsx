import { useState } from 'react'
import { motion } from 'framer-motion'
import { IconEye, IconDownload, IconHash, IconBrandGithub, IconCopy, IconExternalLink, IconShield, IconAlertTriangle, IconFolder } from '@tabler/icons-react'
import { formatDate } from '../lib/utils'
import { getAgentsByIds } from '../agents'
import CopyButton from './CopyButton'
import type { KitDetailProps } from '../types'

const TRUST_BADGES = {
  verified: { label: 'VERIFIED', color: 'bg-green-400/15 border-green-400/30 text-green-400', icon: IconShield },
  community: { label: 'COMMUNITY', color: 'bg-blue-400/15 border-blue-400/30 text-blue-400', icon: null },
  unreviewed: { label: 'UNREVIEWED', color: 'bg-amber-400/15 border-amber-400/30 text-amber-400', icon: IconAlertTriangle },
}

export default function KitDetail({ kit, onClose, onExport }: KitDetailProps) {
  const [showRaw, setShowRaw] = useState<boolean>(false)
  const trustBadge = TRUST_BADGES[kit.trustTier]
  const TrustIcon = trustBadge.icon
  const agents = getAgentsByIds(kit.compatibility)

  const cliCommand = kit.repoUrl 
    ? `npx clawclawgo add ${kit.repoUrl}`
    : `# No repo URL available`

  const kitJson = JSON.stringify({
    name: kit.name,
    description: kit.description,
    source: kit.source,
    ...(kit.repoUrl && { repoUrl: kit.repoUrl }),
    ...(kit.owner && { owner: kit.owner }),
    compatibility: kit.compatibility,
    trustTier: kit.trustTier,
    tags: kit.tags,
    skills: kit.skills.map(s => ({
      name: s.name,
      description: s.description,
      ...(s.url ? { url: s.url } : s.path && kit.repoUrl ? { url: `${kit.repoUrl}/tree/main/${s.path}` } : {}),
    })),
  }, null, 2)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-rc-surface rounded-3xl border border-rc-border shadow-2xl relative my-8"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-rc-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {/* Source badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30">
                  <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">{kit.source.toUpperCase()}</span>
                </div>
                {/* Trust tier badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${trustBadge.color}`}>
                  {TrustIcon && <TrustIcon size={12} />}
                  <span className="text-[10px] font-mono font-bold tracking-wider">{trustBadge.label}</span>
                </div>
                {/* GitHub stars */}
                {kit.source === 'github' && kit.stars && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-yellow/15 border border-rc-yellow/30">
                    <IconBrandGithub size={12} className="text-rc-yellow" />
                    <span className="text-[10px] font-mono font-bold text-rc-yellow">{kit.stars} ⭐</span>
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-grotesk font-bold text-rc-text mb-1">
                {kit.name}
              </h2>
              <p className="text-rc-text-dim text-sm mb-3">
                {kit.description}
              </p>
              <p className="text-rc-text-muted text-xs">
                <span className="text-rc-cyan/70 font-mono">{kit.creator}</span>
                {' · '}
                <span className="font-mono">{formatDate(kit.createdAt)}</span>
              </p>
              {kit.tags && kit.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
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
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-rc-text shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Compatibility badges */}
        {agents.length > 0 && (
          <div className="px-6 md:px-8 pt-6 pb-4 border-b border-rc-border">
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

        {/* Skills list */}
        <div className="p-6 md:p-8 border-b border-rc-border">
          <p className="text-rc-text-muted text-xs font-mono mb-3">Skills ({kit.skills.length}):</p>
          <div className="space-y-2">
            {kit.skills.map((skill, i) => {
              const skillUrl = skill.url
                ? skill.url
                : (skill.path && kit.repoUrl && kit.source === 'github')
                  ? `${kit.repoUrl}/tree/main/${skill.path}`
                  : null

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-rc-border hover:border-rc-cyan/30 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-rc-cyan mt-1.5 shrink-0" />
                  <div className="flex-1">
                    {skillUrl ? (
                      <a
                        href={skillUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-grotesk font-semibold text-sm text-rc-cyan hover:underline inline-flex items-center gap-1.5"
                      >
                        {skill.name}
                        <IconExternalLink size={12} className="opacity-50" />
                      </a>
                    ) : (
                      <p className="font-grotesk font-semibold text-sm text-rc-text">{skill.name}</p>
                    )}
                    <p className="text-xs text-rc-text-dim mt-0.5">{skill.description}</p>
                    {skill.path && (
                      <p className="text-[10px] text-rc-text-muted font-mono mt-1 flex items-center gap-1">
                        <IconFolder size={10} />
                        {skill.path}
                      </p>
                    )}
                    {skill.compatibility && (
                      <p className="text-[10px] text-rc-text-muted font-mono mt-1">
                        Compatibility: {skill.compatibility}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Export section */}
        <div className="p-6 md:p-8 border-b border-rc-border bg-rc-bg/50">
          <h3 className="text-lg font-grotesk font-bold text-rc-text mb-2">Get This Kit</h3>
          <p className="text-xs text-rc-text-dim mb-4">
            Give this file to your AI agent — it'll know what to do.
          </p>
          <div className="space-y-3">
            {/* CLI command */}
            {kit.repoUrl && (
              <div>
                <p className="text-rc-text-muted text-xs font-mono mb-2">Copy CLI command:</p>
                <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-rc-border">
                  <code className="flex-1 text-xs font-mono text-rc-text overflow-x-auto">
                    {cliCommand}
                  </code>
                  <CopyButton text={cliCommand} />
                </div>
              </div>
            )}
            {/* Download JSON */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([kitJson], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${kit.id}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-rc-cyan text-rc-bg rounded-xl hover:bg-rc-cyan/90 transition-colors text-sm font-grotesk font-semibold"
              >
                <IconDownload size={16} />
                Download kit.json
              </button>
              {kit.repoUrl && (
                <a
                  href={kit.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-rc-text rounded-xl border border-rc-border transition-colors text-sm font-grotesk"
                >
                  <IconBrandGithub size={16} />
                  View on GitHub
                  <IconExternalLink size={12} className="opacity-50" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Raw JSON preview */}
        <div className="p-6 md:p-8">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-rc-text rounded-xl border border-rc-border transition-colors text-sm font-grotesk mb-4"
          >
            <IconEye size={16} />
            {showRaw ? 'Hide' : 'View'} Raw JSON
          </button>
          {showRaw && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-rc-text-muted text-xs font-mono">Raw kit JSON</p>
                <CopyButton text={kitJson} />
              </div>
              <pre className="bg-black/30 rounded-xl p-4 text-xs font-mono text-rc-text-dim overflow-auto max-h-80 border border-rc-border">
                {kitJson}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
