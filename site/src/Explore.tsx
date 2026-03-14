import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Relay } from 'nostr-tools'
import { IconLivePhoto } from '@tabler/icons-react'
import { parseBuildEvent, RELAYS } from './lib/utils'
import FeedItem from './components/FeedItem'
import BuildDetail from './components/BuildDetail'
import ApplyWizard from './components/ApplyWizard'
import type { Build } from './types'

export default function Explore() {
  const [builds, setBuilds] = useState<Build[]>([])
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null)
  const [applyBuild, setApplyBuild] = useState<Build | null>(null)
  const [isConnecting, setIsConnecting] = useState<boolean>(true)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [sortMode, setSortMode] = useState<'recent' | 'hot'>('recent')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  
  const relayRef = useRef<any>(null)
  const seenIds = useRef<Set<string>>(new Set())
  const isInitialLoad = useRef<boolean>(true)

  useEffect(() => {
    let sub: any = null
    let relay: any = null

    async function connect() {
      try {
        relay = await Relay.connect(RELAYS[0])
        relayRef.current = relay

        sub = relay.subscribe([{ kinds: [38333], limit: 200 }], {
          onevent(event: any) {
            if (seenIds.current.has(event.id)) return
            seenIds.current.add(event.id)

            const build = parseBuildEvent(event)
            if (build) {
              setBuilds(prev => {
                if (prev.find(l => l.id === build.id)) return prev
                const next = [build, ...prev].sort((a, b) => 
                  (typeof b.createdAt === 'number' ? b.createdAt : 0) - (typeof a.createdAt === 'number' ? a.createdAt : 0)
                )
                return next
              })

              if (!isInitialLoad.current) {
                setNewIds(prev => new Set([...prev, build.id]))
                setTimeout(() => {
                  setNewIds(prev => {
                    const next = new Set(prev)
                    next.delete(build.id)
                    return next
                  })
                }, 2000)
              }
            }
          },
          oneose() {
            setIsConnecting(false)
            setTimeout(() => { isInitialLoad.current = false }, 500)
          },
        })
      } catch (err) {
        console.error('Failed to connect to relay:', err)
        setIsConnecting(false)
      }
    }

    connect()

    return () => {
      if (sub) sub.close()
      if (relay) relay.close()
    }
  }, [])

  // Filter and sort builds
  const filteredAndSortedBuilds = builds
    .filter(build => !tagFilter || build.tags.includes(tagFilter))
    .sort((a, b) => {
      if (sortMode === 'recent') {
        return (typeof b.createdAt === 'number' ? b.createdAt : 0) - (typeof a.createdAt === 'number' ? a.createdAt : 0)
      } else {
        // Hot: for now just sort by recency (remix counting requires relay queries)
        return (typeof b.createdAt === 'number' ? b.createdAt : 0) - (typeof a.createdAt === 'number' ? a.createdAt : 0)
      }
    })

  return (
    <div className="min-h-screen bg-rc-bg">
      {/* Header */}
      <header className="border-b border-rc-border bg-rc-bg/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-grotesk font-bold text-rc-text text-lg hover:text-rc-cyan transition-colors shrink-0">
              ClawClawGo
            </a>
            <div className="h-5 w-px bg-rc-border shrink-0" />
            <div className="flex items-center gap-2">
              <IconLivePhoto size={16} className="text-rc-cyan" />
              <span className="font-grotesk font-medium text-rc-text text-sm">Feed</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <a href="/community" className="text-rc-text-dim hover:text-rc-cyan transition-colors">Community</a>
            </nav>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rc-surface border border-rc-border shrink-0">
              <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-xs font-mono text-rc-text-dim">
                {isConnecting ? 'Connecting' : `${builds.length} builds`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Feed header with sort controls and tag filter */}
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
            relay.clawclawgo.com
          </span>
        </div>

        {/* Loading state */}
        {isConnecting && builds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-rc-cyan/20 border-t-rc-cyan rounded-full animate-spin mb-4" />
            <p className="text-rc-text-dim text-sm font-mono">Connecting to relay...</p>
          </div>
        )}

        {/* Empty state */}
        {!isConnecting && builds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-rc-surface border border-rc-border flex items-center justify-center mb-4">
              <IconLivePhoto size={32} className="text-rc-text-muted" />
            </div>
            <p className="text-rc-text text-lg font-grotesk font-medium mb-2">No builds yet</p>
            <p className="text-rc-text-dim text-sm max-w-md text-center">
              Be the first to publish a build. Share your agent configuration with the community.
            </p>
          </div>
        )}

        {/* Build list */}
        {builds.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredAndSortedBuilds.map((build, i) => (
                <FeedItem
                  key={build.id}
                  build={build}
                  index={i}
                  isNew={newIds.has(build.id)}
                  onClick={() => setSelectedBuild(build)}
                  onTagClick={(tag) => setTagFilter(tag)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedBuild && !applyBuild && (
          <BuildDetail
            build={selectedBuild}
            onClose={() => setSelectedBuild(null)}
            onApply={(build) => {
              setSelectedBuild(null)
              setApplyBuild(build)
            }}
          />
        )}
        {applyBuild && (
          <ApplyWizard
            build={applyBuild}
            onClose={() => setApplyBuild(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
