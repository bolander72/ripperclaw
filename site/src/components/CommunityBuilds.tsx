import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { itemGradients } from '../lib/utils'
import type { Build } from '../types'

interface BuildCardProps {
  build: Build
  onClick: () => void
}

function BuildCard({ build, onClick }: BuildCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="bg-rc-surface rounded-2xl border border-rc-border group-hover:border-rc-cyan/40 transition-all duration-300 overflow-hidden h-full flex flex-col">

        <div className="p-5 pt-10 flex-1">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {build.skills.slice(0, 8).map((skill, ii) => (
              <span
                key={ii}
                className={`px-2 py-1 rounded-lg bg-gradient-to-br ${itemGradients[ii % itemGradients.length]} border border-white/10 text-[11px] font-mono font-medium text-rc-text`}
              >
                {skill.name}
              </span>
            ))}
            {build.skills.length > 8 && (
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-rc-text-muted">
                +{build.skills.length - 8}
              </span>
            )}
          </div>
        </div>
        <div className="px-5 pb-5 mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-grotesk font-bold text-rc-text text-base truncate">{build.name}</h3>
          </div>
          <p className="text-rc-text-dim text-xs mb-2 line-clamp-2">{build.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-rc-cyan/70 text-xs font-mono">{build.creator}</span>
            <span className="text-rc-text-muted text-[10px] font-mono">{build.skills.length} {build.skills.length === 1 ? 'skill' : 'skills'}</span>
          </div>
        </div>
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-rc-cyan/5 via-transparent to-transparent" />
      </div>
    </motion.div>
  )
}

interface BuildDetailProps {
  build: Build
  onClose: () => void
}

function BuildDetail({ build, onClose }: BuildDetailProps) {
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
        <div className="p-6 md:p-8 border-b border-rc-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-grotesk font-bold text-rc-text mb-1">{build.name}</h2>
              <p className="text-rc-text-dim text-sm">
                <span className="text-rc-cyan/70 font-mono">{build.creator}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-rc-text">
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap gap-2">
            {build.skills.map((skill, ii) => (
              <div key={ii} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-rc-border hover:border-rc-cyan/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-rc-cyan" />
                <div>
                  <p className="font-grotesk text-sm text-rc-text font-semibold">{skill.name}</p>
                  <p className="text-xs text-rc-text-dim">{skill.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface CommunityBuildsProps {
  builds: Build[]
}

export default function CommunityBuilds({ builds }: CommunityBuildsProps) {
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {builds.map((build) => (
          <BuildCard key={build.id} build={build} onClick={() => setSelectedBuild(build)} />
        ))}
      </div>

      <AnimatePresence>
        {selectedBuild && (
          <BuildDetail build={selectedBuild} onClose={() => setSelectedBuild(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
