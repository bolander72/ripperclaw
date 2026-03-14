import { motion } from 'framer-motion'
import { IconChevronRight, IconGitFork, IconHash, IconShield, IconAlertTriangle, IconAlertCircle } from '@tabler/icons-react'
import { formatDate, itemGradients, scanBuild } from '../lib/utils'
import type { FeedItemProps } from '../types'

export default function FeedItem({ build, index, isNew, onClick, onTagClick }: FeedItemProps) {
  const scanResult = scanBuild(build.content)
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
                {formatDate(typeof build.createdAt === 'number' ? build.createdAt : 0)}
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
              {build.isNew && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rc-cyan/15 border border-rc-cyan/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
                  <span className="text-[9px] font-mono font-bold text-rc-cyan tracking-wider">NEW</span>
                </div>
              )}
              {build.fork && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rc-magenta/15 border border-rc-magenta/30">
                  <IconGitFork size={10} className="text-rc-magenta" />
                  <span className="text-[9px] font-mono font-bold text-rc-magenta tracking-wider">FORK</span>
                </div>
              )}
            </div>
          </div>

          {/* Middle: name + items */}
          <div className="flex-1 p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-grotesk font-bold text-rc-text text-base">
                {build.agentName}
              </h3>
              <span className="text-rc-text-muted text-xs font-mono hidden sm:inline">
                {build.name}
              </span>
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
