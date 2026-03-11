import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BODY_PATH } from './bodyPath.js'

// ── Mock loadout data (what a real OpenClaw agent would have) ──────────
const DEMO_LOADOUT = {
  name: 'quinn-homelab',
  template: 'Homelab',
  level: 26,  // total mods installed
  capacity: 40,
  slots: {
    brain: {
      label: 'BRAIN',
      tagline: 'Context Engine',
      side: 'left',
      bodyY: 0.08,
      color: '#00f0ff',
      mods: [
        { name: 'lossless-claw', version: '0.2.8', tier: 3, desc: 'DAG-based rolling summarization. Lossless context compaction.' },
        { name: 'LCM Tools', version: 'built-in', tier: 2, desc: 'grep, expand, describe, expand_query across compacted history.' },
      ],
    },
    ears: {
      label: 'EARS',
      tagline: 'Audio Input',
      side: 'left',
      bodyY: 0.14,
      color: '#00f0ff',
      mods: [
        { name: 'Whisper (local)', version: 'base.en', tier: 2, desc: 'On-device speech-to-text. Zero cost, ~2s latency.' },
      ],
    },
    mouth: {
      label: 'MOUTH',
      tagline: 'Voice Output',
      side: 'left',
      bodyY: 0.20,
      color: '#00ff88',
      mods: [
        { name: 'Kokoro-ONNX', version: '1.0', tier: 3, desc: 'Local neural TTS. Voice: af_bella. ~1s latency.' },
        { name: 'iMessage Voice', version: '1.0', tier: 2, desc: 'CAF/Opus voice bubbles for native iMessage playback.' },
      ],
    },
    heart: {
      label: 'HEART',
      tagline: 'Heartbeat System',
      side: 'left',
      bodyY: 0.34,
      color: '#ff3366',
      mods: [
        { name: 'Heartbeat Tasks', version: 'built-in', tier: 2, desc: 'Periodic health checks, cron monitoring, ClawHub watch.' },
        { name: 'Cron Engine', version: '22 jobs', tier: 3, desc: 'Email check, vault sync, health checkin, LinkedIn posts, security audit.' },
      ],
    },
    nervous: {
      label: 'NERVOUS SYSTEM',
      tagline: 'Integrations',
      side: 'left',
      bodyY: 0.52,
      color: '#00ff88',
      mods: [
        { name: 'BlueBubbles', version: '1.0', tier: 3, desc: 'iMessage send/receive, reactions, attachments, voice.' },
        { name: 'Home Assistant', version: 'API', tier: 2, desc: 'Ecobee, UniFi cameras, garage door, sensors.' },
        { name: 'caldir', version: '1.0', tier: 2, desc: 'iCloud + Google Calendar read/write/sync.' },
        { name: 'himalaya', version: '1.0', tier: 2, desc: 'IMAP/SMTP email for work + personal accounts.' },
      ],
    },
    soul: {
      label: 'SOUL',
      tagline: 'Identity Layer',
      side: 'right',
      bodyY: 0.08,
      color: '#ff00aa',
      mods: [
        { name: 'SOUL.md', version: 'v3', tier: 3, desc: 'Personality, anti-patterns, communication style, productive flaws.' },
        { name: 'IDENTITY.md', version: 'v1', tier: 1, desc: 'Name, creature type, vibe, avatar config.' },
      ],
    },
    eyes: {
      label: 'EYES',
      tagline: 'Vision & Capture',
      side: 'right',
      bodyY: 0.14,
      color: '#ff00aa',
      mods: [
        { name: 'Peekaboo', version: '1.0', tier: 2, desc: 'macOS screen capture and UI automation.' },
        { name: 'UniFi G4 Doorbell', version: 'Pro', tier: 2, desc: 'Front porch camera + package cam via HA.' },
      ],
    },
    os: {
      label: 'OPERATING SYSTEM',
      tagline: 'Runtime Core',
      side: 'right',
      bodyY: 0.28,
      color: '#ffcc00',
      mods: [
        { name: 'OpenClaw', version: '2026.3.7', tier: 3, desc: 'Base runtime. Darwin ARM64, Node 22, zsh.' },
        { name: 'Mac mini M4', version: 'macOS 15', tier: 2, desc: 'Always-on host. 24/7 uptime.' },
      ],
    },
    skeleton: {
      label: 'SKELETON',
      tagline: 'Model Router',
      side: 'right',
      bodyY: 0.44,
      color: '#8888a0',
      mods: [
        { name: 'claude-opus-4-6', version: 'Anthropic', tier: 3, desc: 'Primary model. Main session reasoning.' },
        { name: 'claude-sonnet-4-5', version: 'Anthropic', tier: 2, desc: 'Sub-agents, voice session, fast tasks.' },
        { name: 'qwen3.5:4b', version: 'Ollama', tier: 1, desc: 'Local model. Heartbeats, utility, free.' },
        { name: 'Kokoro-ONNX', version: 'local', tier: 1, desc: 'Local TTS inference. Zero API cost.' },
        { name: 'Whisper', version: 'local', tier: 1, desc: 'Local STT inference. Zero API cost.' },
      ],
    },
  },
}

const LEFT_SLOTS = ['brain', 'ears', 'mouth', 'heart', 'nervous']
const RIGHT_SLOTS = ['soul', 'eyes', 'os', 'skeleton']

// ── Tier badge colors ──────────
function tierColor(tier) {
  if (tier === 3) return '#ffcc00'
  if (tier === 2) return '#00f0ff'
  return '#8888a0'
}

function tierLabel(tier) {
  if (tier === 3) return 'T3'
  if (tier === 2) return 'T2'
  return 'T1'
}

// ── The Body SVG ──────────
// Real anatomical silhouette from Wikimedia Commons (Public Domain)
// Rescaled from 970x2200 to 300x590 viewBox

// Node positions mapped to the Wikimedia anatomical silhouette (300x590 viewBox)
// The body is centered around x~145, head top ~87, feet ~580
const BODY_NODES = {
  brain:   { x: 145, y: 102 },  // head center (brain/skull)
  ears:    { x: 145, y: 118 },  // lower head / ear level
  mouth:   { x: 145, y: 128 },  // jaw/neck junction
  soul:    { x: 145, y: 97 },   // upper head (identity/consciousness)
  eyes:    { x: 145, y: 108 },  // eye level
  heart:   { x: 140, y: 210 },  // left chest
  os:      { x: 145, y: 260 },  // core/torso center
  nervous: { x: 145, y: 320 },  // lower torso / spine
  skeleton:{ x: 145, y: 410 },  // structural, legs
}

// Node positions as percentages of the body image dimensions
const BODY_NODES_PCT = {
  brain:   { x: 50, y: 7 },    // top of head
  ears:    { x: 50, y: 10 },   // ear level
  mouth:   { x: 50, y: 12.5 }, // jaw
  soul:    { x: 50, y: 5 },    // crown
  eyes:    { x: 50, y: 8.5 },  // eye level
  heart:   { x: 45, y: 30 },   // left chest
  os:      { x: 50, y: 40 },   // core
  nervous: { x: 50, y: 52 },   // lower torso
  skeleton:{ x: 50, y: 68 },   // legs
}

function BodyFigure({ activeSlot, slots }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ maxHeight: '70vh' }}>
      {/* The holographic body image */}
      <img
        src="./body.png"
        alt="Agent body diagram"
        className="h-full object-contain relative z-10"
        style={{
          maxHeight: '70vh',
          filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.3)) drop-shadow(0 0 60px rgba(255, 0, 170, 0.15))',
        }}
        draggable={false}
      />

      {/* Scan beam overlay */}
      <div
        className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
        style={{ mixBlendMode: 'screen' }}
      >
        <div
          className="absolute w-full h-16"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(0,240,255,0.08), rgba(0,240,255,0.15), rgba(0,240,255,0.08), transparent)',
            animation: 'scanBeam 4s linear infinite',
          }}
        />
      </div>

      {/* SVG overlay for nodes */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full z-30 pointer-events-none"
      >
        <defs>
          <filter id="node-glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Object.entries(slots).map(([id, slot]) => {
          const node = BODY_NODES_PCT[id] || { x: 50, y: 50 }
          const isActive = activeSlot === id
          const r = isActive ? 1.8 : 1.2
          return (
            <g key={id}>
              <circle cx={node.x} cy={node.y} r={r * 1.8} fill="none" stroke={slot.color} strokeWidth={isActive ? 0.3 : 0.15} opacity={isActive ? 0.8 : 0.3} />
              <circle cx={node.x} cy={node.y} r={r} fill={slot.color} opacity={isActive ? 1 : 0.7} filter="url(#node-glow)" />
              {isActive && (
                <>
                  <circle cx={node.x} cy={node.y} r={r} fill="none" stroke={slot.color} strokeWidth="0.3" opacity="0.6">
                    <animate attributeName="r" from={r} to={r * 4} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </g>
          )
        })}
      </svg>

      {/* Diagnostic label */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 font-mono text-[8px] tracking-[0.3em] text-[#00f0ff] opacity-20 pointer-events-none">
        RIPPERCLAW DIAGNOSTIC v0.1
      </div>
    </div>
  )
}

// ── Slot Card (flanking the body) ──────────
function SlotCard({ id, slot, isActive, onClick }) {
  const modCount = slot.mods.length
  const maxTier = Math.max(...slot.mods.map(m => m.tier))

  return (
    <motion.div
      onClick={onClick}
      className="cursor-pointer group relative"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`border transition-all duration-200 ${isActive ? 'border-opacity-100 bg-opacity-20' : 'border-opacity-40 bg-opacity-5 hover:border-opacity-70'}`}
        style={{
          borderColor: slot.color,
          backgroundColor: isActive ? `${slot.color}15` : `${slot.color}08`,
          boxShadow: isActive ? `0 0 20px ${slot.color}40, inset 0 0 20px ${slot.color}10` : 'none',
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b" style={{ borderColor: `${slot.color}30` }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest" style={{ color: slot.color }}>
              {slot.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: `${slot.color}99` }}>
              {modCount} MOD{modCount !== 1 ? 'S' : ''}
            </span>
          </div>
          <div className="text-[10px] text-[#8888a0] mt-0.5">{slot.tagline}</div>
        </div>

        {/* Mod slots grid */}
        <div className="px-3 py-2 flex gap-1.5 flex-wrap">
          {slot.mods.map((mod, i) => (
            <div
              key={i}
              className="w-7 h-7 border flex items-center justify-center text-[8px] font-bold"
              style={{
                borderColor: tierColor(mod.tier),
                backgroundColor: `${tierColor(mod.tier)}15`,
                color: tierColor(mod.tier),
              }}
              title={mod.name}
            >
              {tierLabel(mod.tier)}
            </div>
          ))}
          {/* Empty mod slots */}
          {Array.from({ length: Math.max(0, 4 - modCount) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-7 h-7 border border-[#1e1e2e] bg-[#0a0a0f] flex items-center justify-center"
            >
              <span className="text-[8px] text-[#333]">-</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection line indicator */}
      <div
        className={`absolute top-1/2 ${slot.side === 'left' ? '-right-3' : '-left-3'} w-3 h-px transition-opacity`}
        style={{
          backgroundColor: slot.color,
          opacity: isActive ? 1 : 0.3,
        }}
      />
    </motion.div>
  )
}

// ── Detail Panel (when a slot is selected) ──────────
function DetailPanel({ slotId, slot, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[500px] z-50 border-2 bg-[#0a0a0f]/95 backdrop-blur-md"
      style={{ borderColor: slot.color }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${slot.color}40` }}>
        <div>
          <h3 className="text-lg font-bold font-mono" style={{ color: slot.color }}>{slot.label}</h3>
          <span className="text-xs text-[#8888a0]">{slot.tagline}</span>
        </div>
        <button onClick={onClose} className="text-[#8888a0] hover:text-white text-xl leading-none px-2">x</button>
      </div>

      {/* Installed mods list */}
      <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
        {slot.mods.map((mod, i) => (
          <div key={i} className="border border-[#1e1e2e] bg-[#12121a]/50 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 border"
                  style={{ color: tierColor(mod.tier), borderColor: tierColor(mod.tier) }}
                >
                  TIER {mod.tier}
                </span>
                <span className="text-sm font-bold text-[#e8e8f0]">{mod.name}</span>
              </div>
              <span className="text-[10px] text-[#8888a0] font-mono">{mod.version}</span>
            </div>
            <p className="text-xs text-[#8888a0] leading-relaxed">{mod.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div className="px-4 py-2.5 border-t flex items-center justify-between text-[10px] font-mono" style={{ borderColor: `${slot.color}30` }}>
        <span style={{ color: slot.color }}>SLOT_{slotId.toUpperCase()}</span>
        <span className="text-[#8888a0]">{slot.mods.length} / 4 CAPACITY</span>
      </div>
    </motion.div>
  )
}

// ── Status Bar (top) ──────────
function StatusBar({ loadout }) {
  const totalMods = Object.values(loadout.slots).reduce((sum, s) => sum + s.mods.length, 0)
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e2e] bg-[#0a0a0f]/90 backdrop-blur-sm text-xs font-mono">
      <div className="flex items-center gap-4">
        <span className="text-[#ffcc00] font-bold">{totalMods} MODS</span>
        <span className="text-[#8888a0]">|</span>
        <span className="text-[#00f0ff]">{loadout.name}</span>
        <span className="text-[#8888a0]">|</span>
        <span className="text-[#8888a0]">TEMPLATE: <span className="text-[#e8e8f0]">{loadout.template}</span></span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[#8888a0]">{totalMods}/{loadout.capacity}</span>
        <div className="w-24 h-1.5 bg-[#1e1e2e] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00f0ff] to-[#ff00aa]"
            style={{ width: `${(totalMods / loadout.capacity) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Connect Modal ──────────
function ConnectModal({ onClose }) {
  const [url, setUrl] = useState('')
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md border-2 border-[#00f0ff] bg-[#0a0a0f] p-6 space-y-4"
      >
        <h3 className="text-xl font-bold text-[#00f0ff] font-mono">CONNECT YOUR AGENT</h3>
        <p className="text-sm text-[#8888a0]">
          Enter your OpenClaw instance URL to view your live loadout. Your config stays local — we fetch read-only slot data.
        </p>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="http://localhost:3000"
          className="w-full bg-[#12121a] border border-[#1e1e2e] px-4 py-3 text-sm font-mono text-[#e8e8f0] placeholder-[#555570] focus:border-[#00f0ff] focus:outline-none"
        />
        <div className="flex gap-3">
          <button className="flex-1 py-2.5 bg-[#00f0ff] text-[#0a0a0f] font-bold text-sm hover:bg-[#00d4dd] transition-colors">
            CONNECT
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#1e1e2e] text-[#8888a0] text-sm hover:border-[#555570] transition-colors">
            CANCEL
          </button>
        </div>
        <p className="text-[10px] text-[#555570] text-center">Coming soon. Download the desktop app to view your loadout now.</p>
      </motion.div>
    </motion.div>
  )
}

// ── Terminal Demo ──────────
function TerminalDemo() {
  const [lines, setLines] = useState([])
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !visible) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const seq = [
      { type: 'input', text: 'ripperclaw export', delay: 300 },
      { type: 'output', text: '\u2713 Mapping 9 slots...', delay: 700 },
      { type: 'output', text: '\u2713 26 mods detected (5 T3, 12 T2, 9 T1)', delay: 1100 },
      { type: 'output', text: '\u2713 quinn-homelab.json exported', delay: 1500 },
      { type: 'blank', delay: 1900 },
      { type: 'input', text: 'ripperclaw publish --scrub', delay: 2200 },
      { type: 'output', text: '\u2713 PII scrubbed (12 patterns checked)', delay: 2600 },
      { type: 'output', text: '\u2713 Signed with npub1q2w3...', delay: 2900 },
      { type: 'output', text: '\u2713 Published to 2/3 relays (kind:38333)', delay: 3200 },
    ]
    setLines([])
    seq.forEach(l => setTimeout(() => setLines(prev => [...prev, l]), l.delay))
  }, [visible])

  return (
    <div ref={ref} className="font-mono text-xs border border-[#1e1e2e] bg-[#0a0a0f]/90 p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1e1e2e]">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff3366]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffcc00]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88]/60" />
        </div>
        <span className="ml-1 text-[#555570] text-[10px]">terminal</span>
      </div>
      <div className="space-y-0.5 min-h-[120px]">
        {lines.map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={line.type === 'input' ? 'text-[#00f0ff]' : line.type === 'blank' ? 'h-2' : 'text-[#00ff88]'}>
            {line.type === 'input' && <span className="text-[#ff00aa]">$ </span>}
            {line.text}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Connection Lines SVG (between slots and body) ──────────
function ConnectionLines({ slots, activeSlot, leftRef, rightRef, bodyRef }) {
  // These are decorative — CSS handles the actual layout
  return null
}

// ── Main App ──────────
function App() {
  const [activeSlot, setActiveSlot] = useState(null)
  const [showConnect, setShowConnect] = useState(false)
  const loadout = DEMO_LOADOUT

  const handleSlotClick = (id) => {
    setActiveSlot(activeSlot === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] scanlines" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Status Bar */}
      <StatusBar loadout={loadout} />

      {/* Nav bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-6 text-xs font-mono">
          <span className="text-[#00f0ff] font-bold tracking-wider">RIPPERCLAW</span>
          <span className="text-[#ffcc00] border-b border-[#ffcc00]">CYBERWARE</span>
          <a href="https://github.com/bolander72/ripperclaw" className="text-[#8888a0] hover:text-[#e8e8f0] transition-colors hidden sm:inline">GITHUB</a>
        </div>
        <button
          onClick={() => setShowConnect(true)}
          className="text-[10px] font-mono px-3 py-1 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors"
        >
          CONNECT AGENT
        </button>
      </div>

      {/* Main ripperdoc view */}
      <div className="relative flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
        {/* Left slot column */}
        <div className="md:w-[280px] lg:w-[320px] p-3 md:p-4 space-y-2 md:space-y-3 flex-shrink-0 order-2 md:order-1">
          {LEFT_SLOTS.map(id => (
            <SlotCard
              key={id}
              id={id}
              slot={loadout.slots[id]}
              isActive={activeSlot === id}
              onClick={() => handleSlotClick(id)}
            />
          ))}
        </div>

        {/* Center body */}
        <div className="flex-1 flex items-center justify-center relative order-1 md:order-2 py-6 md:py-0 min-h-[300px] md:min-h-0">
          <div className="w-full max-w-[250px] md:max-w-[300px]">
            <BodyFigure activeSlot={activeSlot} slots={loadout.slots} />
          </div>

          {/* "DEMO" watermark */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[#555570]">
            DEMO LOADOUT — <button onClick={() => setShowConnect(true)} className="text-[#00f0ff] hover:underline">connect yours</button>
          </div>

          {/* Detail panel overlay */}
          <AnimatePresence>
            {activeSlot && loadout.slots[activeSlot] && (
              <DetailPanel
                slotId={activeSlot}
                slot={loadout.slots[activeSlot]}
                onClose={() => setActiveSlot(null)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Right slot column */}
        <div className="md:w-[280px] lg:w-[320px] p-3 md:p-4 space-y-2 md:space-y-3 flex-shrink-0 order-3">
          {RIGHT_SLOTS.map(id => (
            <SlotCard
              key={id}
              id={id}
              slot={loadout.slots[id]}
              isActive={activeSlot === id}
              onClick={() => handleSlotClick(id)}
            />
          ))}
        </div>
      </div>

      {/* Below the fold: Terminal + CTA */}
      <section className="border-t border-[#1e1e2e] py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <TerminalDemo />
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://github.com/bolander72/ripperclaw/releases"
                className="px-6 py-3 bg-[#00f0ff] text-[#0a0a0f] font-bold text-sm hover:bg-[#00d4dd] transition-colors text-center"
                style={{ boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}
              >
                DOWNLOAD APP
              </a>
              <a
                href="https://github.com/bolander72/ripperclaw"
                className="px-6 py-3 border border-[#1e1e2e] text-[#8888a0] text-sm hover:border-[#00f0ff] hover:text-[#00f0ff] transition-colors text-center"
              >
                VIEW SOURCE
              </a>
            </div>
            <p className="text-[10px] text-[#555570] font-mono">
              MIT Licensed | Nostr-powered | Built for OpenClaw
            </p>
          </div>
        </div>
      </section>

      {/* Connect modal */}
      <AnimatePresence>
        {showConnect && <ConnectModal onClose={() => setShowConnect(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default App
