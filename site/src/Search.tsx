import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconSearch, IconX } from '@tabler/icons-react'
import { kits as sampleKits } from './kits'
import Nav from './components/Nav'
import Footer from './components/Footer'
import FeedItem from './components/FeedItem'
import KitDetail from './components/KitDetail'
import ExportWizard from './components/ExportWizard'
import LoadingSprite from './components/LoadingSprite'
import type { Kit } from './types'

export default function Search() {
  // Get initial query from URL
  const initialQuery = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('q') || ''
    : ''
  
  const [kits, setKits] = useState<Kit[]>([])
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery)
  const [searchFocused, setSearchFocused] = useState<boolean>(false)
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null)
  const [exportKit, setExportKit] = useState<Kit | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [compatFilter, setCompatFilter] = useState<string | null>(null)

  // Load kits
  useEffect(() => {
    setTimeout(() => {
      setKits(sampleKits)
      setIsLoading(false)
    }, 300)
  }, [])

  // Filter kits by search query + filters
  const filteredKits = useMemo(() => {
    if (!searchQuery.trim() && !sourceFilter && !compatFilter) return []
    const q = searchQuery.toLowerCase().trim()
    const terms = q.split(/\s+/)
    
    return kits.filter(kit => {
      // Source filter
      if (sourceFilter && kit.source !== sourceFilter) return false
      
      // Compatibility filter
      if (compatFilter && !kit.compatibility.includes(compatFilter)) return false
      
      // Text search
      if (!q) return true
      
      const searchable = [
        kit.name,
        kit.description || '',
        kit.creator,
        ...kit.tags,
        ...kit.skills.map(s => s.name),
        ...kit.skills.map(s => s.description),
        ...(kit.compatibility || []),
      ].join(' ').toLowerCase()
      
      return terms.every(term => searchable.includes(term))
    })
  }, [kits, searchQuery, sourceFilter, compatFilter])

  // Sync search query to URL
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (value.trim()) {
        url.searchParams.set('q', value)
      } else {
        url.searchParams.delete('q')
      }
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <div className="min-h-screen bg-rc-bg flex flex-col">
      <Nav />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Search bar */}
        <div className="mb-8">
          <div className={`
            flex items-center bg-rc-surface border rounded-2xl transition-all duration-300 overflow-hidden
            ${searchFocused ? 'border-rc-cyan/50 shadow-[0_0_20px_rgba(0,240,160,0.08)]' : 'border-rc-border'}
          `}>
            <div className="pl-5 pr-2 text-rc-text-muted">
              <IconSearch size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search for kits by name, skill, model, or tag"
              className="flex-1 py-4 px-2 bg-transparent text-rc-text font-grotesk text-base placeholder:text-rc-text-muted/50 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="mr-4 text-rc-text-muted hover:text-rc-text transition-colors"
              >
                <IconX size={18} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <span className="text-xs font-mono text-rc-text-muted py-1.5">Filter:</span>
            <button
              onClick={() => setSourceFilter(sourceFilter === 'github' ? null : 'github')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                sourceFilter === 'github'
                  ? 'bg-rc-cyan text-rc-bg font-bold'
                  : 'bg-rc-surface border border-rc-border text-rc-text-dim hover:border-rc-cyan/40'
              }`}
            >
              GitHub
            </button>
            <button
              onClick={() => setSourceFilter(sourceFilter === 'clawhub' ? null : 'clawhub')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                sourceFilter === 'clawhub'
                  ? 'bg-rc-cyan text-rc-bg font-bold'
                  : 'bg-rc-surface border border-rc-border text-rc-text-dim hover:border-rc-cyan/40'
              }`}
            >
              ClawHub
            </button>
            <div className="w-px h-6 bg-rc-border" />
            <span className="text-xs font-mono text-rc-text-muted py-1.5">Agent:</span>
            {['openclaw', 'claude-code', 'cursor', 'github-copilot', 'windsurf'].map(agent => (
              <button
                key={agent}
                onClick={() => setCompatFilter(compatFilter === agent ? null : agent)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  compatFilter === agent
                    ? 'bg-rc-magenta text-rc-bg font-bold'
                    : 'bg-rc-surface border border-rc-border text-rc-text-dim hover:border-rc-magenta/40'
                }`}
              >
                {agent}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSprite size={64} className="mb-4" />
            <p className="text-rc-text-dim text-sm font-mono">Loading kits...</p>
          </div>
        )}

        {/* Empty state — no search query */}
        {!isLoading && !searchQuery.trim() && !sourceFilter && !compatFilter && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-rc-surface border border-rc-border flex items-center justify-center mb-4">
              <IconSearch size={32} className="text-rc-text-muted" />
            </div>
            <p className="text-rc-text text-lg font-grotesk font-medium mb-2">Search kits</p>
            <p className="text-rc-text-dim text-sm max-w-md text-center">
              Start typing to search by name, skill, model, tags, or filter by source and compatibility.
            </p>
          </div>
        )}

        {/* No results */}
        {!isLoading && (searchQuery.trim() || sourceFilter || compatFilter) && filteredKits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-rc-surface border border-rc-border flex items-center justify-center mb-4">
              <IconX size={32} className="text-rc-text-muted" />
            </div>
            <p className="text-rc-text text-lg font-grotesk font-medium mb-2">No kits found</p>
            <p className="text-rc-text-dim text-sm max-w-md text-center">
              Try adjusting your search or filters.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && filteredKits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-rc-text-dim text-sm font-mono">
                {filteredKits.length} {filteredKits.length === 1 ? 'kit' : 'kits'} found
              </p>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {filteredKits.map((kit, i) => (
                  <FeedItem
                    key={kit.id}
                    kit={kit}
                    index={i}
                    isNew={false}
                    onClick={() => setSelectedBuild(kit)}
                    onTagClick={(tag) => handleSearchChange(tag)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <AnimatePresence>
        {selectedKit && !exportKit && (
          <KitDetail
            kit={selectedKit}
            onClose={() => setSelectedBuild(null)}
            onExport={(kit) => {
              setSelectedBuild(null)
              setExportBuild(kit)
            }}
          />
        )}
        {exportKit && (
          <ExportWizard
            kit={exportKit}
            onClose={() => setExportBuild(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
