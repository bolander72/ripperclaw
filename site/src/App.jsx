import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  IconBrain, IconCpu, IconMicrophone,
  IconMessageCircle, IconCalendar, IconMail, IconCheckbox, IconSmartHome, IconBrandGithub,
  IconWaveSine, IconPalette, IconTerminal2, IconWorldSearch, IconNote,
  IconUser, IconFingerprint, IconUserCircle,
  IconDatabase, IconNotebook, IconHeartHandshake, IconPinned,
  IconHeartbeat, IconClock, IconBell,
  IconCube, IconPlug, IconBolt, IconSparkles, IconServer, IconClockHour4,
  IconArrowDown, IconExternalLink, IconCopy, IconChevronRight,
  IconBrandApple, IconBrandDebian, IconDownload, IconTerminal,
  IconLock, IconRefresh, IconPuzzle, IconMessages, IconRobot,
  IconChevronDown, IconBook2, IconBrandDiscord,
} from '@tabler/icons-react'
import { loadouts } from './loadouts'

// ─── Helpers ───────────────────────────────────────────────

const slotColors = {
  Model: 'from-purple-500/40 to-blue-500/40',
  Integrations: 'from-green-500/40 to-cyan-500/40',
  Skills: 'from-pink-500/40 to-violet-500/40',
  Personality: 'from-cyan-500/40 to-emerald-500/40',
  Memory: 'from-amber-500/40 to-orange-500/40',
  Scheduling: 'from-rose-500/40 to-blue-500/40',
}

const slotIcons = {
  Model: IconCube,
  Integrations: IconPlug,
  Skills: IconBolt,
  Personality: IconSparkles,
  Memory: IconServer,
  Scheduling: IconClockHour4,
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
          OPEN SOURCE AI AGENTS
        </motion.div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-rc-text mb-6 leading-[1.1] tracking-tight">
          Your AI.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rc-cyan via-rc-green to-rc-cyan">
            Your loadout.
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-lg md:text-xl text-rc-text-dim max-w-2xl mx-auto mb-4 leading-relaxed">
          OpenClaw agents are built from loadouts — the models, integrations, skills, and personality
          that make each one unique. Browse what others have built. Copy what works. Make it yours.
        </p>

        <p className="text-sm text-rc-text-muted max-w-lg mx-auto mb-10">
          Every loadout below is a real agent configuration. Click any card to see the full build,
          or copy the entire loadout to bootstrap your own.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-rc-cyan text-rc-bg font-grotesk font-semibold rounded-xl hover:bg-rc-cyan/90 transition-colors flex items-center gap-2"
          >
            Get OpenClaw
            <IconExternalLink size={16} />
          </a>
          <button
            onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-white/5 text-rc-text font-grotesk font-semibold rounded-xl hover:bg-white/10 transition-colors border border-rc-border flex items-center gap-2"
          >
            Browse Loadouts
            <IconArrowDown size={16} />
          </button>
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

// ─── Loadout Card (Conveyor Item) ──────────────────────────

function LoadoutCard({ loadout, index, onClick, dropped }) {
  const totalItems = loadout.slots.reduce((sum, s) => sum + s.items.length, 0)

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
      className="relative cursor-pointer shrink-0 w-[280px] group"
    >
      {/* Card */}
      <div className="bg-rc-surface rounded-2xl border border-rc-border group-hover:border-rc-cyan/40 transition-all duration-300 overflow-hidden">
        {/* NEW badge */}
        {loadout.isNew && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">NEW</span>
            <span className="text-[10px] font-mono text-rc-cyan/60">{formatDate(loadout.createdAt)}</span>
          </div>
        )}

        {/* Mini slot grid preview */}
        <div className="p-5 pt-12">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {loadout.slots.slice(0, 6).map((slot, si) => {
              const Icon = slotIcons[slot.name] || IconCube
              return (
                <div
                  key={si}
                  className={`aspect-square rounded-xl bg-gradient-to-br ${slotColors[slot.name] || 'from-white/10 to-white/20'} border border-white/10 flex flex-col items-center justify-center gap-1.5 p-2`}
                >
                  <Icon size={22} stroke={1.5} className="text-rc-text" />
                  <span className="text-xs font-mono font-semibold text-rc-text-dim truncate w-full text-center">
                    {slot.items.length}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card footer */}
        <div className="px-5 pb-5">
          {/* Agent name + loadout type */}
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-grotesk font-bold text-rc-text text-base truncate">
                {loadout.agentName}
              </h3>
              <span className="text-rc-text-muted text-xs">·</span>
              <span className="text-rc-text-dim text-xs font-mono truncate">
                {loadout.name}
              </span>
            </div>
          </div>

          {/* Creator + stats */}
          <div className="flex items-center justify-between">
            <span className="text-rc-cyan/70 text-xs font-mono">
              {loadout.creator}
            </span>
            <span className="text-rc-text-muted text-[10px] font-mono">
              {loadout.slots.length} slots · {totalItems} items
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

function ConveyorBelt({ onSelectLoadout }) {
  const [dropped, setDropped] = useState(false)
  const trackRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    // Trigger drop animation after mount
    const timer = setTimeout(() => setDropped(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Duplicate loadouts for seamless scroll
  const displayLoadouts = [...loadouts, ...loadouts]

  return (
    <section id="showcase" className="relative py-16 overflow-hidden">
      {/* Section header */}
      <div className="text-center mb-12 px-6">
        <h2 className="text-2xl md:text-3xl font-grotesk font-bold text-rc-text mb-3">
          Community Loadouts
        </h2>
        <p className="text-rc-text-dim text-sm max-w-md mx-auto">
          Real agent configurations from the community. New loadouts drop in as they're shared.
        </p>
      </div>

      {/* Spotlight overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-40 h-full bg-gradient-to-r from-rc-bg to-transparent" />
        <div className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-rc-bg to-transparent" />
      </div>

      {/* Moving spotlight */}
      <motion.div
        className="absolute top-0 w-[300px] h-full pointer-events-none z-5"
        animate={{ left: ['-300px', 'calc(100% + 300px)'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      >
        <div className="w-full h-full bg-gradient-to-r from-transparent via-rc-cyan/[0.03] to-transparent" />
      </motion.div>

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
            animation: `scroll ${loadouts.length * 3}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {dropped &&
            displayLoadouts.map((loadout, i) => (
              <LoadoutCard
                key={`${loadout.id}-${i}`}
                loadout={loadout}
                index={i % loadouts.length}
                onClick={() => onSelectLoadout(loadout)}
                dropped={i < loadouts.length}
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

// ─── Loadout Detail Modal ──────────────────────────────────

function LoadoutDetail({ loadout, onClose }) {
  const [expandedSlot, setExpandedSlot] = useState(null)
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
              {loadout.isNew && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rc-cyan/15 border border-rc-cyan/30 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-cyan animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-rc-cyan tracking-wider">NEW</span>
                  <span className="text-[10px] font-mono text-rc-cyan/60">{formatDate(loadout.createdAt)}</span>
                </div>
              )}
              <h2 className="text-3xl font-grotesk font-bold text-rc-text mb-1">
                {loadout.agentName}
              </h2>
              <p className="text-rc-text-dim text-sm">
                <span className="text-rc-cyan/70 font-mono">{loadout.creator}</span>
                {' · '}
                {loadout.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => showToast('Loadout copied!')}
                className="px-4 py-2 bg-rc-cyan/10 hover:bg-rc-cyan/20 text-rc-cyan rounded-lg transition-colors text-sm font-medium border border-rc-cyan/20 flex items-center gap-2"
              >
                <IconCopy size={14} />
                Copy Loadout
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-rc-text"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Slots grid */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loadout.slots.map((slot, si) => {
              const Icon = slotIcons[slot.name] || IconCube
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
                        {slot.items.length}
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
                        {slot.items.slice(0, 3).map((item, ii) => (
                          <span
                            key={ii}
                            className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-mono text-rc-text-dim"
                          >
                            {item.name}
                          </span>
                        ))}
                        {slot.items.length > 3 && (
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
                          {slot.items.map((item, ii) => (
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

// ─── What Is OpenClaw ──────────────────────────────────────

function WhatIsSection() {
  const features = [
    {
      icon: IconRobot,
      title: 'Your own AI agent',
      desc: 'OpenClaw runs on your machine — a Mac mini, a Raspberry Pi, a VPS. It connects to your life: messages, calendar, email, smart home, files. One agent that actually knows your context.',
    },
    {
      icon: IconPuzzle,
      title: 'Modular by design',
      desc: 'Swap models, add integrations, install skills, tune personality. Everything is a config file. No vendor lock-in, no black boxes. You own the whole stack.',
    },
    {
      icon: IconLock,
      title: 'Private by default',
      desc: 'Your data stays on your hardware. API keys stay in your keychain. No telemetry, no training on your conversations. Open source means you can verify every claim.',
    },
    {
      icon: IconMessages,
      title: 'Meets you where you are',
      desc: 'iMessage, Discord, Telegram, Signal, WhatsApp, Slack — OpenClaw connects to the channels you already use. Talk to your agent like you\'d talk to a friend.',
    },
    {
      icon: IconRefresh,
      title: 'Always running',
      desc: 'Cron jobs, heartbeats, scheduled tasks. Your agent monitors what matters and acts without being asked. Set it and forget it.',
    },
    {
      icon: IconBolt,
      title: 'Skills marketplace',
      desc: 'Browse ClawHub for community-built skills — weather, smart home, voice, coding, marketing, and more. Install with one command. Or build your own.',
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
            What is OpenClaw?
          </h2>
          <p className="text-rc-text-dim text-lg max-w-2xl mx-auto">
            An open source AI agent framework that lives on your hardware, connects to your life,
            and gets better the longer you use it.
          </p>
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
      title: 'Install',
      desc: 'One command. OpenClaw installs as a system daemon on macOS, Linux, or any machine with Node.js. Takes about two minutes.',
      code: 'npm install -g openclaw && openclaw init',
    },
    {
      num: '02',
      title: 'Configure',
      desc: 'Pick your model (Claude, GPT, Llama, Qwen — or mix them). Connect your channels. Add integrations. Write a personality file or start from a community loadout.',
      code: 'openclaw config # interactive setup',
    },
    {
      num: '03',
      title: 'Run',
      desc: 'Start the gateway. Your agent comes online across all connected channels. It learns your patterns, handles your tasks, and runs 24/7.',
      code: 'openclaw gateway start',
    },
  ]

  return (
    <section className="py-24 px-6 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rc-cyan/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
            Up and running in minutes
          </h2>
          <p className="text-rc-text-dim text-lg max-w-xl mx-auto">
            No cloud accounts. No API dashboards. Just your machine and a terminal.
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
                <p className="text-rc-text-dim text-sm leading-relaxed mb-3">{step.desc}</p>
                <div className="inline-block px-4 py-2 bg-black/40 rounded-lg border border-rc-border">
                  <code className="text-rc-cyan text-xs font-mono">{step.code}</code>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Download Section ──────────────────────────────────────

function DownloadSection() {
  const platforms = [
    {
      icon: IconBrandApple,
      name: 'macOS',
      desc: 'Apple Silicon & Intel',
      primary: true,
      links: [
        { label: 'Download .dmg', href: '/docs/install/macos', icon: IconDownload },
        { label: 'Homebrew', href: '/docs/install/macos#homebrew', icon: IconTerminal },
      ],
    },
    {
      icon: IconBrandDebian,
      name: 'Linux',
      desc: 'Debian, Ubuntu, Arch, and more',
      primary: false,
      links: [
        { label: 'Install guide', href: '/docs/install/linux', icon: IconDownload },
        { label: 'Docker', href: '/docs/install/docker', icon: IconTerminal },
      ],
    },
    {
      icon: IconTerminal,
      name: 'npm',
      desc: 'Any platform with Node.js',
      primary: false,
      links: [
        { label: 'npm install -g openclaw', href: '/docs/install/npm', icon: IconTerminal },
      ],
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
            Get OpenClaw
          </h2>
          <p className="text-rc-text-dim text-lg max-w-xl mx-auto">
            Free and open source. Install on your hardware, keep your data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-2xl border transition-colors ${
                p.primary
                  ? 'bg-rc-cyan/5 border-rc-cyan/30'
                  : 'bg-rc-surface border-rc-border hover:border-rc-cyan/20'
              }`}
            >
              <p.icon size={28} className="text-rc-cyan mb-4" stroke={1.5} />
              <h3 className="font-grotesk font-bold text-rc-text text-lg mb-1">{p.name}</h3>
              <p className="text-rc-text-dim text-sm mb-5">{p.desc}</p>
              <div className="space-y-2">
                {p.links.map((link, li) => (
                  <a
                    key={li}
                    href={link.href}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-rc-text font-medium transition-colors border border-rc-border"
                  >
                    <link.icon size={14} className="text-rc-cyan" />
                    {link.label}
                  </a>
                ))}
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
      q: 'What do I need to run OpenClaw?',
      a: 'Any machine with Node.js 20+. A Mac mini, a Linux server, a Raspberry Pi, a VPS — anything that stays on. Most people run it on a dedicated Mac mini or a small home server.',
    },
    {
      q: 'Which AI models does it support?',
      a: 'Claude (Opus, Sonnet, Haiku), GPT-4o/4.5, Gemini, Llama, Qwen, Mistral, and any OpenAI-compatible API. You can use different models for different tasks — Opus for complex reasoning, a small local model for heartbeats, Whisper for voice.',
    },
    {
      q: 'Is my data private?',
      a: 'Your data never leaves your machine unless you explicitly connect an external API. There\'s no OpenClaw cloud, no telemetry, no data collection. API calls go directly from your machine to the model provider. Everything is auditable in the open source code.',
    },
    {
      q: 'How is this different from ChatGPT or Claude.ai?',
      a: 'Those are chat interfaces. OpenClaw is an agent. It runs 24/7, connects to your real tools (messages, calendar, email, smart home), executes tasks autonomously, and maintains memory across sessions. It\'s the difference between texting someone and having a full-time assistant.',
    },
    {
      q: 'What are loadouts?',
      a: 'A loadout is a complete agent configuration — the model, integrations, skills, personality, memory settings, and scheduling. Think of it like a dotfiles repo for your AI. You can share loadouts, copy from others, and remix them.',
    },
    {
      q: 'What channels does it support?',
      a: 'iMessage (via BlueBubbles), Discord, Telegram, Signal, WhatsApp, Slack, Google Chat, IRC, and LINE. Connect one or all of them. Your agent responds wherever you message it.',
    },
    {
      q: 'Is it really free?',
      a: 'OpenClaw itself is free and open source (MIT). You\'ll pay for the AI model API calls — typically $20-200/month depending on usage and which models you pick. Or run fully local models like Llama or Qwen for zero cost.',
    },
    {
      q: 'Can I use it for my business?',
      a: 'Yes. MIT license means no restrictions. People use OpenClaw for personal assistants, customer support, internal tools, smart home automation, and more.',
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-4">
            Questions
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
            Build yours.
          </h3>
          <p className="text-rc-text-dim text-sm mb-8 max-w-md mx-auto">
            Install OpenClaw, configure your loadout, and start building an AI that actually knows you.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/openclaw/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-rc-cyan text-rc-bg font-grotesk font-semibold rounded-xl hover:bg-rc-cyan/90 transition-colors flex items-center gap-2"
            >
              <IconBrandGithub size={18} />
              Get Started
            </a>
            <a
              href="/docs"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-rc-text font-grotesk font-semibold rounded-xl transition-colors border border-rc-border flex items-center gap-2"
            >
              <IconBook2 size={18} />
              Read the Docs
            </a>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="/docs" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Documentation</a></li>
              <li><a href="/docs/install" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Installation</a></li>
              <li><a href="/docs/skills" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Skills</a></li>
              <li><a href="https://clawhub.com" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">ClawHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Resources</h4>
            <ul className="space-y-2.5">
              <li><a href="/docs/guides" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Guides</a></li>
              <li><a href="/docs/config" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Configuration</a></li>
              <li><a href="/docs/channels" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Channels</a></li>
              <li><a href="/docs/models" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Models</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Community</h4>
            <ul className="space-y-2.5">
              <li><a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Discord</a></li>
              <li><a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">GitHub</a></li>
              <li><a href="https://github.com/openclaw/openclaw/issues" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Issues</a></li>
              <li><a href="https://github.com/openclaw/openclaw/discussions" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Discussions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><a href="/docs/license" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">MIT License</a></li>
              <li><a href="/docs/privacy" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-8 border-t border-rc-border">
          <p className="text-rc-text-muted text-xs font-mono">
            openclaw · open source ai agents
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener" className="text-rc-text-muted hover:text-rc-text transition-colors">
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

// ─── App ───────────────────────────────────────────────────

export default function App() {
  const [selectedLoadout, setSelectedLoadout] = useState(null)

  return (
    <div className="min-h-screen bg-rc-bg">
      <Hero />
      <ConveyorBelt onSelectLoadout={setSelectedLoadout} />
      <WhatIsSection />
      <HowItWorks />
      <DownloadSection />
      <FAQSection />
      <Footer />

      <AnimatePresence>
        {selectedLoadout && (
          <LoadoutDetail
            loadout={selectedLoadout}
            onClose={() => setSelectedLoadout(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
