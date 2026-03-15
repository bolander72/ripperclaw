import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconLivePhoto } from '@tabler/icons-react'
import { kits as sampleKits } from './kits'
import FeedItem from './components/FeedItem'
import LoadingSprite from './components/LoadingSprite'
import type { Kit } from './types'

export default function Explore() {
  const [kits, setKits] = useState<Kit[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [sortMode, setSortMode] = useState<'recent' | 'hot'>('recent')
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  useEffect(() => {
    setTimeout(() => {
      setKits(sampleKits)
      setIsLoading(false)
    }, 500)
  }, [])

  const filteredAndSortedKits = kits
    .filter(kit => !tagFilter || kit.tags.includes(tagFilter))
    .sort((a, b) => {
      if (sortMode === 'recent') {
        const aTime = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime() / 1000
        const bTime = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime() / 1000
        return bTime - aTime
      } else {
        const aScore = a.stars || 0
        const bScore = b.stars || 0
        if (aScore !== bScore) return bScore - aScore
        const aTime = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime() / 1000
        const bTime = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime() / 1000
        return bTime - aTime
      }
    })

  return (
    <div className="min-h-screen bg-rc-bg">
      <header className="border-b border-rc-border bg-rc-bg/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-grotesk font-bold text-rc-text text-lg hover:text-rc-cyan transition-colors shrink-0">
              ClawClawGo
            </a>
            <div className="h-5 w-px bg-rc-border shrink-0" />
            <div className="flex items-center gap-2">
              <IconLivePhoto size={16} className="text-rc-cyan" />
              <span className="font-grotesk font-medium text-rc-text text-sm">Explore</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rc-surface border border-rc-border shrink-0">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-xs font-mono text-rc-text-dim">
                {isLoading ? 'Loading' : `${kits.length} kits`}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortMode('recent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                sortMode === 'recent'
                  ? 'bg-rc-cyan text-rc-bg font-bold'
                  : 'bg-rc-surface border border-rc-border text-rc-text-dim hover:text-rc-cyan hover:border-rc-cyan/40'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortMode('hot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                sortMode === 'hot'
                  ? 'bg-rc-cyan text-rc-bg font-bold'
                  : 'bg-rc-surface border border-rc-border text-rc-text-dim hover:text-rc-cyan hover:border-rc-cyan/40'
              }`}
            >
              Hot
            </button>
            {tagFilter && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rc-magenta/15 border border-rc-magenta/30">
                <span className="text-xs font-mono text-rc-magenta">#{tagFilter}</span>
                <button
                  onClick={() => setTagFilter(null)}
                  className="text-rc-magenta hover:text-rc-magenta/70 transition-colors"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <span className="text-rc-text-muted text-[10px] font-mono">
            Multi-source aggregator
          </span>
        </div>

        {isLoading && kits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSprite size={64} />
          </div>
        )}

        {!isLoading && kits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-rc-surface border border-rc-border flex items-center justify-center mb-4">
              <IconLivePhoto size={32} className="text-rc-text-muted" />
            </div>
            <p className="text-rc-text text-lg font-grotesk font-medium mb-2">No kits yet</p>
            <p className="text-rc-text-dim text-sm max-w-md text-center">
              No kits found. Check back soon.
            </p>
          </div>
        )}

        {kits.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredAndSortedKits.map((kit, i) => (
                <FeedItem
                  key={kit.id}
                  kit={kit}
                  index={i}
                  isNew={false}
                  onClick={() => { window.location.href = `/${kit.id}` }}
                  onTagClick={(tag) => setTagFilter(tag)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
