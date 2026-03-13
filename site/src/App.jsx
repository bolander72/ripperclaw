import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  IconBrain, IconCpu, IconMicrophone,
  IconMessageCircle, IconCalendar, IconMail, IconCheckbox, IconSmartHome, IconBrandGithub,
  IconWaveSine, IconPalette, IconTerminal2, IconWorldSearch, IconNote,
  IconUser, IconFingerprint, IconUserCircle,
  IconDatabase, IconNotebook, IconHeartHandshake, IconPinned,
  IconHeartbeat, IconClock, IconBell,

  IconArrowDown, IconExternalLink, IconCopy, IconChevronRight,
  IconRefresh, IconPuzzle, IconMessages,
  IconChevronDown, IconBook2, IconBrandDiscord,
  IconBrandApple, IconBrandWindows, IconBrandDebian,
} from '@tabler/icons-react'
import { builds } from './builds'
import Explore from './Explore'

// ─── Helpers ───────────────────────────────────────────────

// Item color palette for build cards (cycles through)
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

// ─── Download Dropdown ─────────────────────────────────────

const RELEASE_BASE = 'https://github.com/bolander72/clawclawgo/releases'
const RELEASE_TAG = 'v0.2.1'

function DownloadDropdown({ className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const platforms = [
    { label: 'macOS (Apple Silicon)', icon: IconBrandApple, href: `${RELEASE_BASE}/download/${RELEASE_TAG}/ClawClawGo_${RELEASE_TAG.slice(1)}_aarch64.dmg` },
    { label: 'macOS (Intel)', icon: IconBrandApple, href: `${RELEASE_BASE}/download/${RELEASE_TAG}/ClawClawGo_${RELEASE_TAG.slice(1)}_x64.dmg` },
    { label: 'Windows', icon: IconBrandWindows, href: `${RELEASE_BASE}/download/${RELEASE_TAG}/ClawClawGo_${RELEASE_TAG.slice(1)}_x64-setup.exe` },
    { label: 'Linux (.deb)', icon: IconBrandDebian, href: `${RELEASE_BASE}/download/${RELEASE_TAG}/ClawClawGo_${RELEASE_TAG.slice(1)}_amd64.deb` },
    { label: 'Linux (.AppImage)', icon: IconBrandDebian, href: `${RELEASE_BASE}/download/${RELEASE_TAG}/ClawClawGo_${RELEASE_TAG.slice(1)}_amd64.AppImage` },
  ]

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-3 bg-rc-cyan text-rc-bg font-grotesk font-semibold rounded-xl hover:bg-rc-cyan/90 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
      >
        Get ClawClawGo
        <IconChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-rc-surface border border-rc-border rounded-xl shadow-xl z-50 py-1"
          >
            {platforms.map((p) => (
              <a
                key={p.label}
                href={p.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-rc-text hover:bg-white/5 transition-colors text-sm font-grotesk"
              >
                <p.icon size={18} stroke={1.5} />
                {p.label}
              </a>
            ))}
            <div className="border-t border-rc-border">
              <a
                href={`${RELEASE_BASE}/tag/${RELEASE_TAG}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-rc-text-dim hover:bg-white/5 transition-colors text-xs font-mono"
              >
                All releases →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Hero Section ──────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rc-cyan/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-rc-magenta/3 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-3xl relative z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rc-cyan/10 border border-rc-cyan/20 text-rc-cyan text-xs font-mono tracking-wider mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
          SEARCH · EXPLORE · NO TRACKING
        </motion.div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-rc-text mb-6 leading-[1.1] tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rc-cyan via-rc-green to-rc-cyan">
            AI agent builds.
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-lg md:text-xl text-rc-text-dim max-w-2xl mx-auto mb-4 leading-relaxed">
          Find complete OpenClaw configurations. No tracking. No accounts. Publish anonymously or with verified identity. 
          Search, copy, remix.
        </p>

        <p className="text-sm text-rc-text-muted max-w-lg mx-auto mb-10">
          Every build is a complete agent setup: models, skills, integrations, personality, automations, memory.
          Browse what others have built. Copy what works. Make it yours.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
          <DownloadDropdown className="w-full" />
          <a
            href="/docs"
            className="w-full px-6 py-3 bg-white/5 text-rc-text font-grotesk font-semibold rounded-xl hover:bg-white/10 transition-colors border border-rc-border flex items-center justify-center gap-2"
          >
            Read the Docs
          </a>
          <Link
            to="/explore"
            className="w-full px-6 py-3 bg-white/5 text-rc-text font-grotesk font-semibold rounded-xl hover:bg-white/10 transition-colors border border-rc-border flex items-center justify-center gap-2"
          >
            Search Builds
            <IconArrowDown size={16} />
          </Link>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-rc-text-muted/30 flex items-start justify-center p-1"
        >
          <motion.div className="w-1 h-2 rounded-full bg-rc-text-muted/50" />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── Build Card (Conveyor Item) ──────────────────────────

function BuildCard({ build, index, onClick, dropped }) {

  return (
    <motion.div
      initial={dropped ? { y: -400, opacity: 0, rotate: -5 } : { opacity: 0, y: 20 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={
        dropped
          ? { type: 'spring', stiffness: 120, damping: 18, delay: index * 0.12 }
          : { delay: index * 0.08, duration: 0.4 }
      }
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onClick}
      className="relative cursor-pointer shrink-0 w-[280px] group h-[260px]"
    >
      {/* Card */}
      <div className="bg-rc-surface rounded-2xl border border-rc-border group-hover:border-rc-cyan/40 transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* NEW badge */}
        {build.isNew && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">NEW</span>
            <span className="text-[10px] font-mono text-rc-cyan/60">{formatDate(build.createdAt)}</span>
          </div>
        )}

        {/* Items tag cloud preview */}
        <div className="p-5 pt-12 flex-1">
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

        {/* Card footer */}
        <div className="px-5 pb-5 mt-auto">
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
              {build.items.length} items
            </span>
          </div>
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-rc-cyan/5 via-transparent to-transparent" />
      </div>
    </motion.div>
  )
}

// ─── Conveyor Belt ─────────────────────────────────────────

function ConveyorBelt({ onSelectBuild }) {
  const [dropped, setDropped] = useState(false)
  const trackRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    // Trigger drop animation after mount
    const timer = setTimeout(() => setDropped(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Duplicate builds for seamless scroll
  const displayBuilds = [...builds, ...builds]

  return (
    <section id="showcase" className="relative py-16 overflow-hidden max-w-[100vw]">
      {/* Section header */}
      <div className="text-center mb-12 px-6">
        <h2 className="text-2xl md:text-3xl font-grotesk font-bold text-rc-text mb-3">
          Community Builds
        </h2>
        <p className="text-rc-text-dim text-sm max-w-md mx-auto">
          Real agent configurations from the community. New builds drop in as they're shared.
        </p>
      </div>

      {/* Edge fade */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-20 md:w-40 h-full bg-gradient-to-r from-rc-bg to-transparent" />
        <div className="absolute top-0 right-0 w-20 md:w-40 h-full bg-gradient-to-l from-rc-bg to-transparent" />
      </div>

      {/* Conveyor track */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex gap-6 px-6"
          style={{
            animation: `scroll ${builds.length * 3}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {dropped &&
            displayBuilds.map((build, i) => (
              <BuildCard
                key={`${build.id}-${i}`}
                build={build}
                index={i % builds.length}
                onClick={() => onSelectBuild(build)}
                dropped={i < builds.length}
              />
            ))}
        </div>
      </div>

      {/* Track line */}
      <div className="mt-8 mx-6">
        <div className="h-px bg-gradient-to-r from-transparent via-rc-border to-transparent" />
      </div>
    </section>
  )
}

// ─── Build Detail Modal ──────────────────────────────────

function BuildDetail({ build, onClose }) {

  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

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
              {build.isNew && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">NEW</span>
                  <span className="text-[10px] font-mono text-rc-cyan/60">{formatDate(build.createdAt)}</span>
                </div>
              )}
              <h2 className="text-3xl font-grotesk font-bold text-rc-text mb-1">
                {build.agentName}
              </h2>
              <p className="text-rc-text-dim text-sm">
                <span className="text-rc-cyan/70 font-mono">{build.creator}</span>
                {' · '}
                {build.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-rc-text"
              >
                ✕
              </button>
            </div>
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
                <div className={`w-2 h-2 rounded-full ${item.color?.replace('text-', 'bg-') || 'bg-rc-text-dim'}`} />
                <span className="font-grotesk text-sm text-rc-text">
                  {item.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-rc-cyan rounded-full text-rc-bg font-grotesk font-medium text-sm shadow-lg"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── What Is ClawClawGo ────────────────────────────────────

function WhatIsSection() {
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

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
            What is ClawClawGo?
          </h2>
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
      </div>
    </section>
  )
}

// ─── How It Works ──────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Search',
      desc: 'Find agent builds by capability, use case, or creator. No tracking. No accounts. Just search and discover what others have built.',
    },
    {
      num: '02',
      title: 'Explore',
      desc: 'See exactly how an agent is configured: which models, what skills, which integrations, what personality. Complete transparency.',
    },
    {
      num: '03',
      title: 'Apply',
      desc: 'Copy a build and bootstrap your agent in seconds. Swap models, adjust personality, add skills. Make it yours.',
    },
  ]

  return (
    <section className="py-24 px-6 relative">
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
  )
}

// ─── FAQ ───────────────────────────────────────────────────

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      q: 'What is a build?',
      a: 'A build is a complete agent configuration: the model, integrations, skills, personality, memory, and scheduling that define how an AI agent works. Think of it like a character build in a game, or dotfiles for your AI.',
    },
    {
      q: 'Can I search without an account?',
      a: 'Yes. No accounts, no tracking, no login required. Search and browse builds completely anonymously. Only create an identity if you want to publish builds.',
    },
    {
      q: 'Can I publish anonymously?',
      a: 'Yes. You can publish builds without any identity attached. Or use Nostr keys to tie builds to a verified identity if you want credit.',
    },
    {
      q: 'What data is shared when I publish?',
      a: 'Only what you approve. The PII scrubber runs locally and removes phone numbers, emails, API keys, home paths, and other sensitive data before anything leaves your machine. You review the scrubbed output before publishing.',
    },
    {
      q: 'How is this decentralized?',
      a: 'Builds are published to Nostr relays, a decentralized protocol. No central authority. No single point of failure. Censorship-resistant by design.',
    },
    {
      q: 'Can I copy someone else\'s build?',
      a: 'That\'s the whole point. Click any build card, hit "Copy Build," and you\'ve got their full configuration. Swap out what doesn\'t fit, keep what does.',
    },
    {
      q: 'What\'s in a typical build?',
      a: 'Builds contain whatever config your agent uses. Common pieces include model routing (which LLMs), personality (how it talks), skills (what it can do), integrations (what it connects to), automations (heartbeat + cron), and memory config. But builds are flexible - they contain your agent\'s full configuration, not a fixed template.',
    },
    {
      q: 'Do I need OpenClaw to use a build?',
      a: 'Builds are designed for OpenClaw agents, but the concepts are universal. The model choices, integration patterns, and personality approaches apply to any AI agent setup.',
    },
    {
      q: 'Is this free?',
      a: 'ClawClawGo is free. OpenClaw is free and open source. You\'ll pay for AI model API calls depending on which providers you use, or run fully local models for zero cost.',
    },
    {
      q: 'How do I get started?',
      a: 'Search for a build that matches your use case. Explore how it\'s configured. Copy it and apply it to your agent. Or install OpenClaw, create your own build, and publish it for others.',
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
            FAQs
          </h2>
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
                    <p className="px-5 pb-5 text-rc-text-dim text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-rc-border py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* CTA */}
        <div className="text-center mb-16">
          <h3 className="text-2xl md:text-3xl font-grotesk font-bold text-rc-text mb-4">
            Search. Discover. Build.
          </h3>
          <p className="text-rc-text-dim text-sm mb-8 max-w-md mx-auto">
            Find agent builds that match your needs. No tracking. No accounts. Publish yours anonymously or with verified identity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            <DownloadDropdown className="w-full" />
            <a
              href="/docs/"
              className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-rc-text font-grotesk font-semibold rounded-xl transition-colors border border-rc-border flex items-center justify-center gap-2"
            >
              <IconBook2 size={18} />
              Read the Docs
            </a>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">ClawClawGo</h4>
            <ul className="space-y-2.5">
              <li><Link to="/explore" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Explore Builds</Link></li>
              <li><a href="/docs/" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Documentation</a></li>
              <li><a href={RELEASE_BASE} target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Download</a></li>
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
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><a href="https://github.com/bolander72/clawclawgo/blob/main/LICENSE" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">MIT License</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-8 border-t border-rc-border">
          <p className="text-rc-text-muted text-xs font-mono">
            clawclawgo · agent builds for openclaw
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/bolander72/clawclawgo" target="_blank" rel="noopener" className="text-rc-text-muted hover:text-rc-text transition-colors">
              <IconBrandGithub size={18} />
            </a>
            <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="text-rc-text-muted hover:text-rc-text transition-colors">
              <IconBrandDiscord size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Landing Page ──────────────────────────────────────────

function Landing() {
  const [selectedBuild, setSelectedBuild] = useState(null)

  return (
    <div className="min-h-screen bg-rc-bg overflow-x-hidden">
      <Hero />
      <ConveyorBelt onSelectBuild={setSelectedBuild} />
      <WhatIsSection />
      <HowItWorks />

      <FAQSection />
      <Footer />

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

// ─── App ───────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/explore" element={<Explore />} />
      </Routes>
    </BrowserRouter>
  )
}
