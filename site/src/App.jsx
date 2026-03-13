import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconBrandGithub, IconSearch, IconBook2, IconBrandDiscord,
  IconArrowDown, IconChevronDown, IconChevronRight,
  IconFingerprint, IconUserCircle, IconCopy, IconPuzzle,
  IconRefresh, IconWorldSearch, IconLivePhoto,
} from '@tabler/icons-react'
import { builds as sampleBuilds } from './builds'
import Explore from './Explore'

// ─── Helpers ───────────────────────────────────────────────

const itemGradients = [
  'from-purple-500/40 to-blue-500/40',
  'from-cyan-500/40 to-emerald-500/40',
  'from-pink-500/40 to-violet-500/40',
  'from-green-500/40 to-cyan-500/40',
  'from-rose-500/40 to-blue-500/40',
  'from-amber-500/40 to-orange-500/40',
]

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Shared Nav ────────────────────────────────────────────

function Nav({ minimal }) {
  return (
    <header className={`border-b border-rc-border bg-rc-bg/90 backdrop-blur-md ${minimal ? '' : 'sticky top-0 z-40'}`}>
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-grotesk font-bold text-rc-text text-lg hover:text-rc-cyan transition-colors">
          ClawClawGo
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <Link to="/explore" className="text-rc-text-dim hover:text-rc-cyan transition-colors flex items-center gap-1">
            <IconLivePhoto size={14} /> Feed
          </Link>
          <Link to="/community" className="text-rc-text-dim hover:text-rc-cyan transition-colors">Community</Link>
        </nav>
      </div>
    </header>
  )
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-rc-bg">
      <Nav />
      {children}
      <Footer />
    </div>
  )
}

// ─── Home (Search) ─────────────────────────────────────────

function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    navigate(`/explore${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }, [query, navigate])

  return (
    <div className="min-h-screen bg-rc-bg flex flex-col overflow-x-hidden">
      {/* Minimal nav for home */}
      <header className="px-4 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/explore" className="text-rc-text-dim hover:text-rc-cyan transition-colors flex items-center gap-1">
              <IconLivePhoto size={14} /> Feed
            </Link>
            <Link to="/community" className="text-rc-text-dim hover:text-rc-cyan transition-colors">Community</Link>
          </nav>
        </div>
      </header>

      {/* Centered search */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,100vw)] h-[600px] bg-rc-cyan/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-2xl relative z-10 w-full"
        >
          <h1 className="text-4xl md:text-5xl font-grotesk font-bold text-rc-text mb-6 leading-[1.1] tracking-tight">
            ClawClawGo
          </h1>

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
      <Footer />
    </div>
  )
}

// ─── Community Builds ──────────────────────────────────────

function BuildCard({ build, onClick }) {
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
        {build.isNew && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">NEW</span>
          </div>
        )}
        <div className="p-5 pt-10 flex-1">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {build.items.slice(0, 8).map((item, ii) => (
              <span
                key={ii}
                className={`px-2 py-1 rounded-lg bg-gradient-to-br ${itemGradients[ii % itemGradients.length]} border border-white/10 text-[11px] font-mono font-medium text-rc-text`}
              >
                {item.name}
              </span>
            ))}
            {build.items.length > 8 && (
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-rc-text-muted">
                +{build.items.length - 8}
              </span>
            )}
          </div>
        </div>
        <div className="px-5 pb-5 mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-grotesk font-bold text-rc-text text-base truncate">{build.agentName}</h3>
            <span className="text-rc-text-muted text-xs">·</span>
            <span className="text-rc-text-dim text-xs font-mono truncate">{build.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-rc-cyan/70 text-xs font-mono">{build.creator}</span>
            <span className="text-rc-text-muted text-[10px] font-mono">{build.items.length} items</span>
          </div>
        </div>
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-rc-cyan/5 via-transparent to-transparent" />
      </div>
    </motion.div>
  )
}

function BuildDetail({ build, onClose }) {
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
              <h2 className="text-3xl font-grotesk font-bold text-rc-text mb-1">{build.agentName}</h2>
              <p className="text-rc-text-dim text-sm">
                <span className="text-rc-cyan/70 font-mono">{build.creator}</span> · {build.name}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-rc-text">
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap gap-2">
            {build.items.map((item, ii) => (
              <div key={ii} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-rc-border hover:border-rc-cyan/30 transition-colors">
                <div className={`w-2 h-2 rounded-full ${item.color?.replace('text-', 'bg-') || 'bg-rc-text-dim'}`} />
                <span className="font-grotesk text-sm text-rc-text">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CommunityPage() {
  const [selectedBuild, setSelectedBuild] = useState(null)

  return (
    <PageShell>
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-3">
            Community Builds
          </h1>
          <p className="text-rc-text-dim text-sm max-w-md mx-auto">
            Real agent configurations from the community. See what others have built.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleBuilds.map((build, i) => (
            <BuildCard key={build.id} build={build} onClick={() => setSelectedBuild(build)} />
          ))}
        </div>
      </main>

      <AnimatePresence>
        {selectedBuild && (
          <BuildDetail build={selectedBuild} onClose={() => setSelectedBuild(null)} />
        )}
      </AnimatePresence>
    </PageShell>
  )
}

// ─── About (What Is ClawClawGo + How It Works) ────────────

function AboutPage() {
  const features = [
    {
      icon: IconWorldSearch,
      title: 'Search and discover',
      desc: 'Find agent builds by capability, personality, use case, or creator. Search is fast and private. No tracking, no accounts required.',
    },
    {
      icon: IconFingerprint,
      title: 'Anonymous or verified',
      desc: 'Publish builds anonymously (no identity required) or tie them to your verified Nostr identity. Your choice. Your control.',
    },
    {
      icon: IconCopy,
      title: 'One-click copy',
      desc: 'See a build you like? Copy the whole thing and bootstrap your agent in seconds. Swap out what doesn\'t fit, keep what does.',
    },
    {
      icon: IconPuzzle,
      title: 'Complete configurations',
      desc: 'Every build is a full agent setup: models, skills, integrations, personality, automations, memory. Whatever your agent uses, it goes in the build.',
    },
    {
      icon: IconUserCircle,
      title: 'Privacy-first',
      desc: 'PII scrubber runs locally before anything leaves your machine. No central authority. Nostr-based, decentralized, censorship-resistant.',
    },
    {
      icon: IconRefresh,
      title: 'Remix and evolve',
      desc: 'Fork a build, change what you want, republish. Builds evolve as people improve them. Credit is optional but tracked.',
    },
  ]

  const steps = [
    { num: '01', title: 'Search', desc: 'Find agent builds by capability, use case, or creator. No tracking. No accounts. Just search and discover what others have built.' },
    { num: '02', title: 'Explore', desc: 'See exactly how an agent is configured: which models, what skills, which integrations, what personality. Complete transparency.' },
    { num: '03', title: 'Apply', desc: 'Copy a build and bootstrap your agent in seconds. Swap models, adjust personality, add skills. Make it yours.' },
  ]

  return (
    <PageShell>
      <main className="max-w-6xl mx-auto px-6">
        {/* What is it */}
        <section className="py-16">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
              What is ClawClawGo?
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="p-6 rounded-2xl bg-rc-surface border border-rc-border hover:border-rc-cyan/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-rc-cyan/10 flex items-center justify-center mb-4 group-hover:bg-rc-cyan/20 transition-colors">
                  <f.icon size={20} className="text-rc-cyan" stroke={1.5} />
                </div>
                <h3 className="font-grotesk font-semibold text-rc-text text-base mb-2">{f.title}</h3>
                <p className="text-rc-text-dim text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rc-cyan/3 rounded-full blur-[150px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
                How it works
              </h2>
              <p className="text-rc-text-dim text-lg max-w-xl mx-auto">
                Search for builds. Explore configurations. Apply what works.
              </p>
            </div>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="flex gap-6 items-start"
                >
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-rc-cyan/10 border border-rc-cyan/20 flex items-center justify-center">
                    <span className="text-rc-cyan font-mono font-bold text-sm">{step.num}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-grotesk font-bold text-rc-text text-xl mb-2">{step.title}</h3>
                    <p className="text-rc-text-dim text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  )
}

// ─── FAQ ───────────────────────────────────────────────────

function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    { q: 'What is a build?', a: 'A build is a complete agent configuration: the model, integrations, skills, personality, memory, and scheduling that define how an AI agent works. Think of it like a character build in a game, or dotfiles for your AI.' },
    { q: 'Can I search without an account?', a: 'Yes. No accounts, no tracking, no login required. Search and browse builds completely anonymously. Only create an identity if you want to publish builds.' },
    { q: 'Can I publish anonymously?', a: 'Yes. You can publish builds without any identity attached. Or use Nostr keys to tie builds to a verified identity if you want credit.' },
    { q: 'What data is shared when I publish?', a: 'Only what you approve. The PII scrubber runs locally and removes phone numbers, emails, API keys, home paths, and other sensitive data before anything leaves your machine. You review the scrubbed output before publishing.' },
    { q: 'How is this decentralized?', a: 'Builds are published to Nostr relays, a decentralized protocol. No central authority. No single point of failure. Censorship-resistant by design.' },
    { q: 'Can I copy someone else\'s build?', a: 'That\'s the whole point. Click any build card, hit "Copy Build," and you\'ve got their full configuration. Swap out what doesn\'t fit, keep what does.' },
    { q: 'What\'s in a typical build?', a: 'Builds contain whatever config your agent uses. Common pieces include model routing (which LLMs), personality (how it talks), skills (what it can do), integrations (what it connects to), automations (heartbeat + cron), and memory config. But builds are flexible.' },
    { q: 'Do I need OpenClaw to use a build?', a: 'Builds are designed for OpenClaw agents, but the concepts are universal. The model choices, integration patterns, and personality approaches apply to any AI agent setup.' },
    { q: 'Is this free?', a: 'ClawClawGo is free. OpenClaw is free and open source. You\'ll pay for AI model API calls depending on which providers you use, or run fully local models for zero cost.' },
    { q: 'How do I get started?', a: 'Search for a build that matches your use case. Explore how it\'s configured. Copy it and apply it to your agent. Or install OpenClaw, create your own build, and publish it for others.' },
  ]

  return (
    <PageShell>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
            FAQs
          </h1>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-rc-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-grotesk font-medium text-rc-text text-sm pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 text-rc-text-muted"
                >
                  <IconChevronDown size={18} />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-rc-text-dim text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </main>
    </PageShell>
  )
}

// ─── Footer ────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-rc-border py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">ClawClawGo</h4>
            <ul className="space-y-2.5">
              <li><Link to="/explore" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Live Feed</Link></li>
              <li><Link to="/community" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Community Builds</Link></li>
              <li><a href="/docs/" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Documentation</a></li>
              <li><a href="https://github.com/bolander72/clawclawgo" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Learn</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">What is ClawClawGo?</Link></li>
              <li><Link to="/faq" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">OpenClaw</h4>
            <ul className="space-y-2.5">
              <li><a href="https://docs.openclaw.ai" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">OpenClaw Docs</a></li>
              <li><a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">GitHub</a></li>
              <li><a href="https://clawhub.com" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">ClawHub Skills</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Community</h4>
            <ul className="space-y-2.5">
              <li><a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Discord</a></li>
              <li><a href="https://github.com/bolander72/clawclawgo/discussions" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Discussions</a></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-rc-border">
          <p className="text-rc-text-muted text-xs font-mono">clawclawgo · agent builds for openclaw</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/bolander72/clawclawgo" target="_blank" rel="noopener" className="text-rc-text-muted hover:text-rc-text transition-colors"><IconBrandGithub size={18} /></a>
            <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="text-rc-text-muted hover:text-rc-text transition-colors"><IconBrandDiscord size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── App ───────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
      </Routes>
    </BrowserRouter>
  )
}
