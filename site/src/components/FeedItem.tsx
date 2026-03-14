import { motion } from 'framer-motion'
import { IconChevronRight, IconHash, IconShield, IconAlertTriangle, IconAlertCircle, IconStar, IconBrandGithub } from '@tabler/icons-react'
import { formatDate, itemGradients, scanBuild } from '../lib/utils'
import type { FeedItemProps } from '../types'

// Source icons
const SOURCE_ICONS = {
  github: IconBrandGithub,
  clawhub: IconHash,
  skillssh: IconHash,
  local: IconHash,
}

// Trust tier badges
const TRUST_BADGES = {
  verified: { label: 'VERIFIED', color: 'bg-green-400/15 border-green-400/30 text-green-400' },
  community: { label: 'COMMUNITY', color: 'bg-blue-400/15 border-blue-400/30 text-blue-400' },
  unreviewed: { label: 'UNREVIEWED', color: 'bg-amber-400/15 border-amber-400/30 text-amber-400' },
}

export default function FeedItem({ build, index, isNew, onClick, onTagClick }: FeedItemProps) {
  const scanResult = scanBuild(build.content)
  const SourceIcon = SOURCE_ICONS[build.source] || IconHash
  const trustBadge = TRUST_BADGES[build.trustTier]

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
                {formatDate(build.createdAt)}
              </span>
              {scanResult.score === 'PASS' && (
                <IconShield size={12} className="text-green-400" title="Security: PASS" />
              )}
              {scanResult.score === 'WARN' && (
                <IconAlertTriangle size={12} className="text-amber-400" title="Security: WARN" />
              )}
              {scanResult.score === 'FAIL' && (
                <IconAlertCircle size={12} className="text-red-400" title="Security: FAIL" />
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${trustBadge.color}`}>
                <SourceIcon size={10} />
                <span className="text-[9px] font-mono font-bold tracking-wider">{build.source.toUpperCase()}</span>
              </div>
              {build.source === 'github' && build.stars && build.stars > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rc-yellow/15 border border-rc-yellow/30">
                  <IconStar size={10} className="text-rc-yellow" />
                  <span className="text-[9px] font-mono font-bold text-rc-yellow">{build.stars}</span>
                </div>
              )}
            </div>
          </div>

          {/* Middle: name + items */}
          <div className="flex-1 p-5">
            <div className="flex items-start gap-2 mb-3 flex-wrap">
              <div className="flex-1">
                <h3 className="font-grotesk font-bold text-rc-text text-base">
                  {build.name}
                </h3>
                {build.description && (
                  <p className="text-rc-text-dim text-xs mt-1 line-clamp-2">
                    {build.description}
                  </p>
                )}
              </div>
              {build.compatibility && build.compatibility.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {build.compatibility.slice(0, 3).map((agent, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rc-cyan/15 border border-rc-cyan/30 text-rc-cyan"
                      title={`Compatible with ${agent}`}
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {build.items.slice(0, 10).map((item, ii) => (
                <span
                  key={ii}
                  className={`px-2 py-1 rounded-lg bg-gradient-to-br ${itemGradients[ii % itemGradients.length]} border border-white/10 text-[11px] font-mono font-medium text-rc-text`}
                >
                  {item.name}
                </span>
              ))}
              {build.items.length > 10 && (
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-rc-text-muted">
                  +{build.items.length - 10}
                </span>
              )}
            </div>
            {build.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {build.tags.slice(0, 4).map((tag, i) => (
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

          {/* Right: creator + arrow */}
          <div className="md:w-36 shrink-0 p-5 flex items-center justify-between md:justify-end md:flex-col md:items-end gap-2">
            <span className="text-rc-cyan/70 text-xs font-mono">
              {build.creator}
            </span>
            <span className="text-rc-text-muted text-xs font-mono">
              {build.items.length} items
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
