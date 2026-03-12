import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SimplePool, nip19 } from 'nostr-tools'
import {
  IconCube, IconPlug, IconBolt, IconSparkles, IconServer, IconClockHour4,
  IconChevronRight, IconRefresh, IconFilter, IconSortDescending,
  IconGitFork, IconUsers, IconClock, IconHash,
} from '@tabler/icons-react'

// ─── Constants ─────────────────────────────────────────────

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
]

const blockColors = {
  Model: 'from-purple-500/40 to-blue-500/40',
  model: 'from-purple-500/40 to-blue-500/40',
  Persona: 'from-cyan-500/40 to-emerald-500/40',
  persona: 'from-cyan-500/40 to-emerald-500/40',
  Skills: 'from-pink-500/40 to-violet-500/40',
  skills: 'from-pink-500/40 to-violet-500/40',
  Integrations: 'from-green-500/40 to-cyan-500/40',
  integrations: 'from-green-500/40 to-cyan-500/40',
  Automations: 'from-rose-500/40 to-blue-500/40',
  automations: 'from-rose-500/40 to-blue-500/40',
  Memory: 'from-amber-500/40 to-orange-500/40',
  memory: 'from-amber-500/40 to-orange-500/40',
}

const blockIcons = {
  Model: IconCube,
  model: IconCube,
  Persona: IconSparkles,
  persona: IconSparkles,
  Skills: IconBolt,
  skills: IconBolt,
  Integrations: IconPlug,
  integrations: IconPlug,
  Automations: IconClockHour4,
  automations: IconClockHour4,
  Memory: IconServer,
  memory: IconServer,
}

// Fallback for custom/unknown slot types
const defaultBlockColor = 'from-white/10 to-white/20'
const DefaultBlockIcon = IconCube

// ─── Helpers ───────────────────────────────────────────────

function formatDate(timestamp) {
  const d = new Date(timestamp * 1000)
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function parseBuildEvent(event) {
  try {
    const content = JSON.parse(event.content)
    const dTag = event.tags.find(t => t[0] === 'd')?.[1] || 'Unnamed'
    const tTags = event.tags.filter(t => t[0] === 't').map(t => t[1])
    const forkTag = event.tags.find(t => t[0] === 'e' && t[3] === 'fork')
    const authorTag = event.tags.find(t => t[0] === 'p')

    const publishTypeTag = event.tags.find(t => t[0] === 'publish_type')
    const blockTypeTag = event.tags.find(t => t[0] === 'block_type')

    return {
      id: event.id,
      name: dTag,
      agentName: content.agentName || dTag,
      creator: nip19.npubEncode(event.pubkey).slice(0, 12) + '...',
      createdAt: event.created_at,
      isNew: (Date.now() / 1000 - event.created_at) < 7 * 24 * 60 * 60, // 7 days
      tags: tTags,
      slots: content.slots || (content.slot ? { [blockTypeTag?.[1] || 'unknown']: content.slot } : []),
      fork: forkTag ? {
        eventId: forkTag[1],
        relay: forkTag[2],
      } : null,
      originalAuthor: authorTag ? nip19.npubEncode(authorTag[1]).slice(0, 12) + '...' : null,
      remixCount: 0,
      publishType: publishTypeTag?.[1] || 'build',
      blockType: blockTypeTag?.[1] || null,
    }
  } catch (e) {
    console.error('Failed to parse build event:', e)
    return null
  }
}

// ─── Build Card ──────────────────────────────────────────

function BuildCard({ build, index, onClick, dropped }) {
  const totalItems = build.slots.reduce((sum, s) => sum + s.items?.length || 0, 0)

  return (
    <motion.div
      initial={dropped ? { y: -200, opacity: 0, scale: 0.95 } : { opacity: 0, y: 20 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={
        dropped
          ? { type: 'spring', stiffness: 100, damping: 15, delay: index * 0.08 }
          : { delay: index * 0.05, duration: 0.3 }
      }
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      {/* Card */}
      <div className="bg-rc-surface rounded-2xl border border-rc-border group-hover:border-rc-cyan/40 transition-all duration-300 overflow-hidden">
        {/* NEW badge + Fork badge */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {build.isNew && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">NEW</span>
              <span className="text-[10px] font-mono text-rc-cyan/60">{formatDate(build.createdAt)}</span>
            </div>
          )}
          {build.publishType === 'block' && build.blockType && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30">
              <span className="text-[10px]">🧩</span>
              <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider uppercase">{build.blockType}</span>
            </div>
          )}
          {build.fork && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-magenta/15 border border-rc-magenta/30">
              <IconGitFork size={12} className="text-rc-magenta" />
              <span className="text-[10px] font-mono font-bold text-rc-magenta tracking-wider">FORK</span>
            </div>
          )}
        </div>

        {/* Mini slot grid preview */}
        <div className="p-5 pt-12">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {build.slots.slice(0, 6).map((slot, si) => {
              const Icon = blockIcons[slot.name] || IconCube
              return (
                <div
                  key={si}
                  className={`aspect-square rounded-xl bg-gradient-to-br ${blockColors[slot.name] || 'from-white/10 to-white/20'} border border-white/10 flex flex-col items-center justify-center gap-1.5 p-2`}
                >
                  <Icon size={22} stroke={1.5} className="text-rc-text" />
                  <span className="text-xs font-mono font-semibold text-rc-text-dim truncate w-full text-center">
                    {slot.items?.length || 0}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card footer */}
        <div className="px-5 pb-5">
          {/* Agent name + build type */}
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-grotesk font-bold text-rc-text text-base truncate">
                {build.agentName}
              </h3>
              <span className="text-rc-text-muted text-xs">·</span>
              <span className="text-rc-text-dim text-xs font-mono truncate">
                {build.name}
              </span>
            </div>
          </div>

          {/* Creator + stats */}
          <div className="flex items-center justify-between">
            <span className="text-rc-cyan/70 text-xs font-mono">
              {build.creator}
            </span>
            <span className="text-rc-text-muted text-[10px] font-mono">
              {build.slots.length} slots · {totalItems} items
            </span>
          </div>

          {/* Tags */}
          {build.tags && build.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {build.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-white/5 rounded-md text-[9px] font-mono text-rc-text-muted flex items-center gap-1"
                >
                  <IconHash size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-rc-cyan/5 via-transparent to-transparent" />
      </div>
    </motion.div>
  )
}

// ─── Build Detail Modal ──────────────────────────────────

function BuildDetail({ build, onClose }) {
  const [expandedSlot, setExpandedSlot] = useState(null)

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
                    <span className="text-[10px] font-mono text-rc-cyan/60">{formatDate(build.createdAt)}</span>
                  </div>
                )}
                {build.fork && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-magenta/15 border border-rc-magenta/30">
                    <IconGitFork size={14} className="text-rc-magenta" />
                    <span className="text-[10px] font-mono font-bold text-rc-magenta tracking-wider">
                      Forked from {build.originalAuthor || 'unknown'}
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

        {/* Blocks grid */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {build.slots.map((slot, si) => {
              const Icon = blockIcons[slot.name] || IconCube
              const isExpanded = expandedSlot === si

              return (
                <motion.div
                  key={si}
                  layout
                  onClick={() => setExpandedSlot(isExpanded ? null : si)}
                  className={`cursor-pointer rounded-2xl border transition-all duration-200 ${
                    isExpanded
                      ? 'col-span-2 md:col-span-3 bg-white/5 border-rc-cyan/30'
                      : 'bg-rc-surface border-rc-border hover:border-rc-cyan/30'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-rc-cyan">
                        <Icon size={18} stroke={1.5} />
                      </div>
                      <span className="font-grotesk font-semibold text-rc-text text-sm">
                        {slot.name}
                      </span>
                      <span className="text-rc-text-muted text-xs ml-auto font-mono">
                        {slot.items?.length || 0}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        className="text-rc-text-muted"
                      >
                        <IconChevronRight size={14} />
                      </motion.div>
                    </div>

                    {!isExpanded && (
                      <div className="flex flex-wrap gap-1">
                        {(slot.items || []).slice(0, 3).map((item, ii) => (
                          <span
                            key={ii}
                            className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-mono text-rc-text-dim"
                          >
                            {item.name}
                          </span>
                        ))}
                        {(slot.items?.length || 0) > 3 && (
                          <span className="px-2 py-0.5 text-[10px] font-mono text-rc-text-muted">
                            +{slot.items.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {(slot.items || []).map((item, ii) => (
                            <motion.div
                              key={ii}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: ii * 0.04 }}
                              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                            >
                              <div className={`w-2 h-2 rounded-full ${item.color?.replace('text-', 'bg-') || 'bg-rc-text-dim'}`} />
                              <span className="font-grotesk text-sm text-rc-text">
                                {item.name}
                              </span>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Explore Page ──────────────────────────────────────────

export default function Explore() {
  const [builds, setBuilds] = useState([])
  const [selectedBuild, setSelectedBuild] = useState(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [sortBy, setSortBy] = useState('newest') // newest, most-remixed
  const poolRef = useRef(null)
  const seenIds = useRef(new Set())

  useEffect(() => {
    // Initialize Nostr connection
    const pool = new SimplePool()
    poolRef.current = pool

    const filters = [
      {
        kinds: [38333],
        limit: 100,
      },
    ]

    // Subscribe to events
    const sub = pool.subscribeMany(RELAYS, filters, {
      onevent(event) {
        // Skip duplicates
        if (seenIds.current.has(event.id)) return
        seenIds.current.add(event.id)

        const build = parseBuildEvent(event)
        if (build) {
          setBuilds(prev => {
            // Check if already exists
            if (prev.find(l => l.id === build.id)) return prev
            // Add to beginning (newest first)
            return [build, ...prev]
          })
        }
      },
      oneose() {
        setIsConnecting(false)
      },
    })

    return () => {
      sub.close()
      pool.close(RELAYS)
    }
  }, [])

  // Sort builds
  const sortedBuilds = [...builds].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.createdAt - a.createdAt
    } else if (sortBy === 'most-remixed') {
      return b.remixCount - a.remixCount
    }
    return 0
  })

  return (
    <div className="min-h-screen bg-rc-bg">
      {/* Header */}
      <header className="border-b border-rc-border bg-rc-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="font-grotesk font-bold text-rc-text text-xl hover:text-rc-cyan transition-colors">
                ← ClawClawGo
              </a>
              <div className="h-6 w-px bg-rc-border" />
              <h1 className="font-grotesk font-semibold text-rc-text text-lg">Explore</h1>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-rc-surface border border-rc-border rounded-xl text-rc-text text-sm font-grotesk font-medium focus:outline-none focus:border-rc-cyan/40 transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="most-remixed">Most Remixed</option>
              </select>

              {/* Connection status */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rc-surface border border-rc-border">
                <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-rc-yellow animate-pulse' : 'bg-rc-green'}`} />
                <span className="text-xs font-mono text-rc-text-dim">
                  {isConnecting ? 'Connecting...' : `${builds.length} builds`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
            Community Builds
          </h2>
          <p className="text-rc-text-dim text-lg max-w-2xl mx-auto mb-2">
            Real-time feed of agent builds from Nostr. Every build is a NIP-33 event (kind 38333)
            published to the decentralized network.
          </p>
          <p className="text-rc-text-muted text-sm">
            Connected to {RELAYS.length} relays · Updates in real-time
          </p>
        </div>

        {/* Loading state */}
        {isConnecting && builds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-rc-cyan/20 border-t-rc-cyan rounded-full animate-spin mb-4" />
            <p className="text-rc-text-dim text-sm font-mono">Connecting to relays...</p>
          </div>
        )}

        {/* Empty state */}
        {!isConnecting && builds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-rc-surface border border-rc-border flex items-center justify-center mb-4">
              <IconUsers size={32} className="text-rc-text-muted" />
            </div>
            <p className="text-rc-text text-lg font-grotesk font-medium mb-2">No builds yet</p>
            <p className="text-rc-text-dim text-sm max-w-md text-center">
              Be the first to publish a build! Share your agent configuration with the community.
            </p>
          </div>
        )}

        {/* Builds grid */}
        {builds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedBuilds.map((build, i) => (
              <BuildCard
                key={build.id}
                build={build}
                index={i}
                onClick={() => setSelectedBuild(build)}
                dropped={true}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedBuild && (
          <BuildDetail
            build={selectedBuild}
            onClose={() => setSelectedBuild(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
