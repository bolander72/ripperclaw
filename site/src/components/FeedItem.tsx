import { motion } from 'framer-motion'
import { IconChevronRight, IconHash, IconShield, IconAlertTriangle, IconAlertCircle, IconStar, IconBrandGithub } from '@tabler/icons-react'
import { formatDate } from '../lib/utils'
import { getAgentsByIds } from '../agents'
import type { FeedItemProps } from '../types'

// Source badges — consistent color per source
const SOURCE_BADGES: Record<string, { icon: typeof IconBrandGithub; color: string }> = {
  github: { icon: IconBrandGithub, color: 'bg-white/10 border-white/20 text-rc-text-dim' },
  clawhub: { icon: IconHash, color: 'bg-purple-400/15 border-purple-400/30 text-purple-400' },
  skillssh: { icon: IconHash, color: 'bg-orange-400/15 border-orange-400/30 text-orange-400' },
}

// Trust tier badges
const TRUST_BADGES = {
  verified: { label: 'VERIFIED', color: 'bg-green-400/15 border-green-400/30 text-green-400', icon: IconShield },
  community: { label: 'COMMUNITY', color: 'bg-blue-400/15 border-blue-400/30 text-blue-400', icon: null },
  unreviewed: { label: 'UNREVIEWED', color: 'bg-amber-400/15 border-amber-400/30 text-amber-400', icon: IconAlertTriangle },
}

export default function FeedItem({ kit, index, isNew, onClick, onTagClick }: FeedItemProps) {
  const sourceBadge = SOURCE_BADGES[kit.source] || { icon: IconHash, color: 'bg-white/10 border-white/20 text-rc-text-dim' }
  const SourceIcon = sourceBadge.icon
  const trustBadge = TRUST_BADGES[kit.trustTier]
  const agents = getAgentsByIds(kit.compatibility.slice(0, 3))

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -80, scale: 0.95 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={
        isNew
          ? { type: 'spring', stiffness: 200, damping: 25 }
          : { delay: index * 0.03, duration: 0.3 }
      }
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      <div className="bg-rc-surface rounded-2xl border border-rc-border group-hover:border-rc-cyan/40 transition-all duration-300 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left: timestamp + badges */}
          <div className="md:w-44 shrink-0 p-5 md:border-r border-rc-border flex md:flex-col items-center md:items-start gap-3 md:gap-2">
            <div className="flex items-center gap-2">
              <span className="text-rc-text-muted text-xs font-mono">
                {formatDate(kit.createdAt)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${sourceBadge.color}`}>
                <SourceIcon size={10} />
                <span className="text-[9px] font-mono font-bold tracking-wider">{kit.source.toUpperCase()}</span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${trustBadge.color}`}>
                {trustBadge.icon && <trustBadge.icon size={10} />}
                <span className="text-[9px] font-mono font-bold tracking-wider">{trustBadge.label}</span>
              </div>
              {kit.source === 'github' && kit.stars && kit.stars > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rc-yellow/15 border border-rc-yellow/30">
                  <IconStar size={10} className="text-rc-yellow" />
                  <span className="text-[9px] font-mono font-bold text-rc-yellow">{kit.stars}</span>
                </div>
              )}
            </div>
          </div>

          {/* Middle: name + description + skills + tags */}
          <div className="flex-1 p-5">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1">
                <h3 className="font-grotesk font-bold text-rc-text text-base">
                  {kit.name}
                </h3>
                {kit.description && (
                  <p className="text-rc-text-dim text-xs mt-1 line-clamp-2">
                    {kit.description}
                  </p>
                )}
              </div>
            </div>

            {/* Compatibility badges */}
            {agents.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {agents.map((agent) => (
                  <span
                    key={agent.id}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono bg-rc-cyan/15 border border-rc-cyan/30 ${agent.color || 'text-rc-cyan'}`}
                    title={`Compatible with ${agent.name}`}
                  >
                    {agent.name}
                  </span>
                ))}
                {kit.compatibility.length > 3 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rc-cyan/15 border border-rc-cyan/30 text-rc-cyan"
                    title={`+${kit.compatibility.length - 3} more agents`}
                  >
                    +{kit.compatibility.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Tags */}
            {kit.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {kit.tags.slice(0, 4).map((tag, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTagClick?.(tag)
                    }}
                    className="px-1.5 py-0.5 text-[9px] font-mono text-rc-text-muted hover:text-rc-cyan hover:bg-rc-cyan/10 rounded transition-colors flex items-center gap-0.5"
                  >
                    <IconHash size={9} />{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: creator + skill count + arrow */}
          <div className="md:w-36 shrink-0 p-5 flex items-center justify-between md:justify-end md:flex-col md:items-end gap-2">
            <span className="text-rc-cyan/70 text-xs font-mono">
              {kit.creator}
            </span>
            <span className="text-rc-text-muted text-xs font-mono">
              {kit.skills.length} {kit.skills.length === 1 ? 'skill' : 'skills'}
            </span>
            <IconChevronRight size={16} className="text-rc-text-muted group-hover:text-rc-cyan transition-colors hidden md:block" />
          </div>
        </div>

        {/* New-item glow */}
        {isNew && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-rc-cyan/30"
          />
        )}
      </div>
    </motion.div>
  )
}
