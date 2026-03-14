import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { IconSearch } from '@tabler/icons-react'

export default function HomeHero() {
  const [query, setQuery] = useState<string>('')
  const [focused, setFocused] = useState<boolean>(false)

  const handleSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`
    } else {
      window.location.href = '/search'
    }
  }, [query])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,100vw)] h-[600px] bg-rc-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-2xl relative z-10 w-full"
      >
        <h1 className="text-4xl md:text-5xl font-grotesk font-bold text-rc-text mb-3 leading-[1.1] tracking-tight">
          The Agent Skills Search Engine
        </h1>
        <p className="text-rc-text-dim text-base md:text-lg mb-6 font-grotesk">
          Find skills for Claude Code, Cursor, OpenClaw, and 30+ AI agents.<br />
          One search. Every source.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto">
          <div className={`
            flex items-center bg-rc-surface border rounded-2xl transition-all duration-300 overflow-hidden
            ${focused ? 'border-rc-cyan/50 shadow-[0_0_20px_rgba(0,240,160,0.08)]' : 'border-rc-border'}
          `}>
            <div className="pl-5 pr-2 text-rc-text-muted">
              <IconSearch size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="voice assistant, coding agent, home automation..."
              className="flex-1 py-4 px-2 bg-transparent text-rc-text font-grotesk text-base placeholder:text-rc-text-muted/50 focus:outline-none"
            />
            <button
              type="submit"
              className="hidden sm:block m-1.5 px-4 py-2 bg-rc-cyan text-rc-bg font-grotesk font-semibold rounded-xl hover:bg-rc-cyan/90 transition-colors text-sm shrink-0"
            >
              Go
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
