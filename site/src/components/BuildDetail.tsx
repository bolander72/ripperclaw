import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconEye, IconDownload, IconGitFork, IconHash, IconArrowsSplit } from '@tabler/icons-react'
import { formatDate, itemGradients } from '../lib/utils'
import CopyButton from './CopyButton'
import CompareModal from './CompareModal'
import type { BuildDetailProps } from '../types'

export default function BuildDetail({ build, onClose, onApply }: BuildDetailProps) {
  const [showRaw, setShowRaw] = useState<boolean>(false)
  const [showCompare, setShowCompare] = useState<boolean>(false)
  const configKeys = Object.keys(build.content || {}).filter(k => !['schema', 'meta', 'dependencies'].includes(k))

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
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {build.isNew && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">NEW</span>
                    <span className="text-[10px] font-mono text-rc-cyan/60">
                      {formatDate(typeof build.createdAt === 'number' ? build.createdAt : 0)}
                    </span>
                  </div>
                )}
                {build.fork && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-magenta/15 border border-rc-magenta/30">
                    <IconGitFork size={14} className="text-rc-magenta" />
                    <span className="text-[10px] font-mono text-rc-magenta">
                      Forked from 
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Navigate to parent build if available in builds list
                        }}
                        className="ml-1 font-bold hover:underline"
                        title={`Event: ${build.fork.eventId}`}
                      >
                        {build.originalAuthor || build.fork.eventId.slice(0, 8)}
                      </button>
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-grotesk font-bold text-rc-text mb-1">
                {build.agentName}
              </h2>
              <p className="text-rc-text-dim text-sm">
                <span className="text-rc-cyan/70 font-mono">{build.creator}</span>
                {' · '}
                {build.name}
              </p>
              {build.tags && build.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {build.tags.map((tag, i) => (
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
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-rc-text"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Build contents */}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap gap-2">
            {build.items.map((item, ii) => (
              <motion.div
                key={ii}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: ii * 0.03 }}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-rc-border hover:border-rc-cyan/30 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-rc-cyan" />
                <span className="font-grotesk text-sm text-rc-text">
                  {item.name}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Config keys */}
          {configKeys.length > 0 && (
            <div className="mt-6 pt-6 border-t border-rc-border">
              <p className="text-rc-text-muted text-xs font-mono mb-3">Config keys in this build:</p>
              <div className="flex flex-wrap gap-2">
                {configKeys.map((key, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white/5 rounded-lg text-xs font-mono text-rc-text-dim"
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON preview */}
          {showRaw && (
            <div className="mt-6 pt-6 border-t border-rc-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-rc-text-muted text-xs font-mono">Raw build JSON</p>
                <CopyButton text={JSON.stringify(build.content, null, 2)} />
              </div>
              <pre className="bg-black/30 rounded-xl p-4 text-xs font-mono text-rc-text-dim overflow-auto max-h-80 border border-rc-border">
                {JSON.stringify(build.content, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-6 md:p-8 border-t border-rc-border flex flex-wrap gap-3">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-rc-text rounded-xl border border-rc-border transition-colors text-sm font-grotesk"
          >
            <IconEye size={16} />
            {showRaw ? 'Hide' : 'View'} JSON
          </button>
          <button
            onClick={() => setShowCompare(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-rc-text rounded-xl border border-rc-border transition-colors text-sm font-grotesk"
          >
            <IconArrowsSplit size={16} />
            Compare
          </button>
          <CopyButton text={JSON.stringify(build.content, null, 2)} label="Copy JSON" />
          <button
            onClick={() => onApply(build)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rc-cyan text-rc-bg rounded-xl hover:bg-rc-cyan/90 transition-colors text-sm font-grotesk font-semibold ml-auto"
          >
            <IconDownload size={16} />
            Apply Build
          </button>
        </div>
      </motion.div>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompare && (
          <CompareModal build={build} onClose={() => setShowCompare(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
