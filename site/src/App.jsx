import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// The 9 cyberware slots
const SLOTS = [
  {
    id: 'brain',
    name: 'Brain',
    tagline: 'Context Engine',
    description: 'Memory architecture, LCM/DAG compaction, conversation history management',
    position: { x: 200, y: 60 },
    path: 'M 180 45 Q 200 30 220 45 L 220 75 Q 200 90 180 75 Z', // simplified brain outline
    color: '#00f0ff',
  },
  {
    id: 'eyes',
    name: 'Eyes',
    tagline: 'Vision Models',
    description: 'Image recognition, cameras, screen capture, visual understanding',
    position: { x: 185, y: 70 },
    path: 'M 175 65 L 185 65 L 185 75 L 175 75 Z', // left eye
    color: '#ff00aa',
  },
  {
    id: 'ears',
    name: 'Ears',
    tagline: 'Audio Input',
    description: 'Speech-to-text, voice input, Whisper transcription',
    position: { x: 165, y: 70 },
    path: 'M 160 65 Q 155 70 160 75', // left ear
    color: '#00f0ff',
  },
  {
    id: 'mouth',
    name: 'Mouth',
    tagline: 'Voice Output',
    description: 'Text-to-speech, Kokoro-ONNX, voice synthesis',
    position: { x: 200, y: 85 },
    path: 'M 190 85 Q 200 88 210 85', // mouth
    color: '#00ff88',
  },
  {
    id: 'soul',
    name: 'Soul',
    tagline: 'Identity Layer',
    description: 'Personality files, behavioral rules, identity and values',
    position: { x: 200, y: 130 },
    path: 'M 190 120 L 210 120 L 210 140 L 190 140 Z', // heart/soul area
    color: '#ff00aa',
  },
  {
    id: 'heart',
    name: 'Heart',
    tagline: 'Heartbeat Tasks',
    description: 'Scheduled automations, health checks, cron jobs, periodic tasks',
    position: { x: 180, y: 135 },
    path: 'M 175 130 Q 170 135 175 140 Q 180 145 185 140 Q 190 135 185 130 Z', // heart shape
    color: '#ff3366',
  },
  {
    id: 'os',
    name: 'OS',
    tagline: 'Runtime Core',
    description: 'Base OpenClaw runtime, platform, shell, node version',
    position: { x: 200, y: 160 },
    path: 'M 195 150 L 205 150 L 205 170 L 195 170 Z', // spine/core
    color: '#ffcc00',
  },
  {
    id: 'nervous',
    name: 'Nervous System',
    tagline: 'Integrations',
    description: 'Channels, calendar, email, Home Assistant, external APIs',
    position: { x: 200, y: 200 },
    path: 'M 200 170 L 180 190 M 200 170 L 220 190 M 200 180 L 170 200 M 200 180 L 230 200', // branching nerves
    color: '#00ff88',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    tagline: 'Model Router',
    description: 'LLM providers, model config, the load-bearing structure',
    position: { x: 200, y: 250 },
    path: 'M 195 100 L 195 270 M 205 100 L 205 270 M 195 270 L 170 320 M 205 270 L 230 320', // legs/skeleton
    color: '#8888a0',
  },
]

function VitruvianDiagram({ activeSlot, setActiveSlot }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full max-h-[70vh]"
        style={{ filter: 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.3))' }}
      >
        {/* SVG filters for glow effects */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Da Vinci parchment texture */}
          <pattern id="parchment" width="400" height="400" patternUnits="userSpaceOnUse">
            <rect width="400" height="400" fill="#0a0a0f" opacity="0.1"/>
          </pattern>
        </defs>

        {/* Background circle (Vitruvian Man style) */}
        <circle
          cx="200"
          cy="200"
          r="180"
          fill="none"
          stroke="rgba(205, 180, 140, 0.3)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        
        {/* Background square */}
        <rect
          x="40"
          y="40"
          width="320"
          height="320"
          fill="none"
          stroke="rgba(205, 180, 140, 0.3)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Body outline - da Vinci sketch style */}
        <g stroke="#cdb48c" strokeWidth="1.5" fill="none" opacity="0.8">
          {/* Head */}
          <circle cx="200" cy="60" r="25" />
          
          {/* Neck */}
          <line x1="200" y1="85" x2="200" y2="100" />
          
          {/* Shoulders and arms */}
          <line x1="165" y1="110" x2="235" y2="110" />
          <line x1="165" y1="110" x2="145" y2="180" />
          <line x1="235" y1="110" x2="255" y2="180" />
          
          {/* Torso outline */}
          <path d="M 180 100 L 170 130 L 165 160 L 170 200 L 180 240" />
          <path d="M 220 100 L 230 130 L 235 160 L 230 200 L 220 240" />
          
          {/* Spine */}
          <line x1="200" y1="100" x2="200" y2="240" strokeDasharray="2,2" opacity="0.5" />
          
          {/* Hips */}
          <line x1="180" y1="240" x2="220" y2="240" />
          
          {/* Legs */}
          <line x1="185" y1="240" x2="175" y2="320" />
          <line x1="215" y1="240" x2="225" y2="320" />
          
          {/* Crosshatch details (da Vinci style) */}
          <g opacity="0.3" strokeWidth="0.5">
            <line x1="190" y1="130" x2="195" y2="140" />
            <line x1="205" y1="130" x2="210" y2="140" />
            <line x1="190" y1="160" x2="195" y2="170" />
            <line x1="205" y1="160" x2="210" y2="170" />
          </g>
        </g>

        {/* Cyberpunk circuit overlays */}
        <g stroke="#00f0ff" strokeWidth="0.5" fill="none" opacity="0.4">
          <path d="M 200 60 L 200 100" strokeDasharray="2,2" />
          <path d="M 200 100 L 200 240" strokeDasharray="3,3" />
          <circle cx="200" cy="130" r="3" fill="#ff00aa" opacity="0.6" />
          <circle cx="200" cy="160" r="3" fill="#ffcc00" opacity="0.6" />
        </g>

        {/* Interactive slot regions */}
        {SLOTS.map((slot) => {
          const isActive = activeSlot?.id === slot.id
          return (
            <g
              key={slot.id}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setActiveSlot(slot)}
              onMouseLeave={() => setActiveSlot(null)}
              onClick={() => setActiveSlot(activeSlot?.id === slot.id ? null : slot)}
            >
              {/* Invisible hit area for easier clicking */}
              <circle
                cx={slot.position.x}
                cy={slot.position.y}
                r="20"
                fill="transparent"
              />
              
              {/* Slot marker */}
              <circle
                cx={slot.position.x}
                cy={slot.position.y}
                r={isActive ? 8 : 6}
                fill={slot.color}
                opacity={isActive ? 1 : 0.7}
                filter={isActive ? 'url(#glow-strong)' : 'url(#glow)'}
                className="transition-all"
              />
              
              {/* Pulsing ring when active */}
              {isActive && (
                <motion.circle
                  cx={slot.position.x}
                  cy={slot.position.y}
                  r="12"
                  fill="none"
                  stroke={slot.color}
                  strokeWidth="2"
                  initial={{ r: 8, opacity: 1 }}
                  animate={{ r: 20, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              
              {/* Connection line to detail panel (when active) */}
              {isActive && (
                <motion.line
                  x1={slot.position.x}
                  y1={slot.position.y}
                  x2="400"
                  y2="200"
                  stroke={slot.color}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function SlotDetailPanel({ slot }) {
  if (!slot) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="p-8 border-2 bg-rc-bg/95 backdrop-blur-md"
      style={{ borderColor: slot.color }}
    >
      <div className="space-y-4">
        <div>
          <h3
            className="text-3xl font-bold mb-1 font-mono"
            style={{ color: slot.color, textShadow: `0 0 20px ${slot.color}` }}
          >
            {slot.name}
          </h3>
          <p className="text-lg text-rc-text-dim">{slot.tagline}</p>
        </div>
        
        <p className="text-rc-text leading-relaxed">
          {slot.description}
        </p>
        
        <div className="flex items-center gap-2 text-xs font-mono text-rc-text-dim pt-4 border-t border-rc-border">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: slot.color }}
          />
          <span>SLOT_{slot.id.toUpperCase()}</span>
        </div>
      </div>
    </motion.div>
  )
}

function TerminalDemo() {
  const [lines, setLines] = useState([])
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          setVisible(true)
        }
      },
      { threshold: 0.3 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])
  
  useEffect(() => {
    if (!visible) return
    
    const sequence = [
      { type: 'input', text: 'ripperclaw export', delay: 300 },
      { type: 'output', text: '✓ Mapping 9 slots...', delay: 700 },
      { type: 'output', text: '✓ 26 mods detected', delay: 1000 },
      { type: 'output', text: '✓ quinn-homelab.json exported', delay: 1300 },
      { type: 'blank', delay: 1700 },
      { type: 'input', text: 'ripperclaw publish --scrub', delay: 2000 },
      { type: 'output', text: '✓ PII scrubbed', delay: 2400 },
      { type: 'output', text: '✓ Signed with npub1...', delay: 2700 },
      { type: 'output', text: '✓ Published to 2/3 relays', delay: 3000 },
    ]
    
    setLines([])
    sequence.forEach(line => {
      setTimeout(() => setLines(prev => [...prev, line]), line.delay)
    })
  }, [visible])
  
  return (
    <div ref={ref} className="font-mono text-sm border border-rc-cyan bg-rc-bg/90 backdrop-blur-sm p-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-rc-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rc-red/60" />
          <div className="w-3 h-3 rounded-full bg-rc-yellow/60" />
          <div className="w-3 h-3 rounded-full bg-rc-green/60" />
        </div>
        <span className="ml-2 text-rc-text-dim">terminal</span>
      </div>
      
      <div className="space-y-1">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              line.type === 'input' ? 'text-rc-cyan' :
              line.type === 'blank' ? 'h-3' :
              'text-rc-green'
            }
          >
            {line.type === 'input' && <span className="text-rc-magenta">$ </span>}
            {line.text}
            {i === lines.length - 1 && line.type !== 'blank' && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block ml-1 w-1.5 h-3.5 bg-rc-cyan align-middle"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [activeSlot, setActiveSlot] = useState(null)
  
  return (
    <div className="min-h-screen bg-rc-bg text-rc-text antialiased scanlines">
      {/* Hero - The Diagram */}
      <section className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left: Title & Diagram */}
          <div className="space-y-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold mb-3"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 40px rgba(0, 240, 255, 0.5)',
                }}
              >
                RIPPER
                <span className="text-rc-magenta">CLAW</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-xl text-rc-text-dim font-mono"
              >
                &gt; AI Agent Configuration Management
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <VitruvianDiagram activeSlot={activeSlot} setActiveSlot={setActiveSlot} />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-rc-text-dim text-center text-sm"
            >
              Tap or hover the body to explore each slot
            </motion.p>
          </div>
          
          {/* Right: Detail Panel */}
          <div className="min-h-[200px] lg:min-h-[400px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeSlot ? (
                <SlotDetailPanel key={activeSlot.id} slot={activeSlot} />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6 p-8"
                >
                  <h2 className="text-xl md:text-2xl font-bold text-rc-cyan">
                    Your Agent Is More Than Config
                  </h2>
                  <p className="text-rc-text-dim max-w-md leading-relaxed">
                    Tap a slot on the body to see what it maps to. 9 cyberware slots. Export the whole loadout.
                    Share it. Compare it. Clone what works.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* The Feed - Flowing narrative */}
      <section className="py-20 px-6 relative border-t border-rc-border bg-rc-surface/30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rc-cyan/5 to-transparent" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-rc-magenta font-mono">&gt;</span> The Feed
            </h2>
            <p className="text-xl text-rc-text-dim max-w-2xl mx-auto">
              A Nostr-powered feed of agent loadouts. Publish yours. Browse others. Compare. Clone. Iterate.
            </p>
          </motion.div>
          
          {/* Flowing timeline */}
          <div className="relative">
            {/* Connection line - hidden on mobile */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-rc-cyan via-rc-magenta via-rc-yellow to-rc-green" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative">
              {[
                { num: '1', label: 'Publish', desc: 'Export to Nostr (kind 38333). PII scrubbed.', color: 'rc-cyan' },
                { num: '2', label: 'Browse', desc: 'See what others are running. Filter by slot.', color: 'rc-magenta' },
                { num: '3', label: 'Compare', desc: 'Diff their loadout against yours.', color: 'rc-yellow' },
                { num: '4', label: 'Clone', desc: 'One click. Import. Adapt. Ship.', color: 'rc-green' },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="text-center relative"
                >
                  <div
                    className={`w-16 h-16 mx-auto mb-4 border-2 border-${step.color} bg-rc-bg flex items-center justify-center text-2xl font-bold text-${step.color} relative z-10`}
                    style={{
                      boxShadow: `0 0 20px var(--color-${step.color})`,
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 className={`font-bold mb-2 text-${step.color} text-lg`}>{step.label}</h3>
                  <p className="text-sm text-rc-text-dim">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Terminal demo integrated here */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <TerminalDemo />
          </motion.div>
        </div>
      </section>

      {/* CTA - Minimal */}
      <section className="py-20 px-6 border-t border-rc-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <h2 className="text-4xl font-bold">Ready to Export Your Rig?</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="https://github.com/bolander72/ripperclaw/releases"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-rc-cyan text-rc-bg font-bold text-lg border-2 border-rc-cyan transition-all"
              style={{ boxShadow: '0 0 30px rgba(0, 240, 255, 0.5)' }}
            >
              DOWNLOAD
            </motion.a>
            
            <motion.a
              href="https://github.com/bolander72/ripperclaw"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-rc-cyan text-rc-cyan font-bold text-lg hover:bg-rc-cyan/10 transition-all"
            >
              ⭐ STAR ON GITHUB
            </motion.a>
          </div>
          
          <p className="text-sm text-rc-text-dim font-mono">
            MIT Licensed • Built for OpenClaw • Community-Driven
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-rc-border text-center text-sm text-rc-text-dim font-mono">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>RipperClaw © 2026</div>
          <div className="flex gap-6">
            <a href="https://github.com/bolander72/ripperclaw" className="hover:text-rc-cyan transition-colors">
              GitHub
            </a>
            <a href="https://github.com/bolander72/ripperclaw/blob/main/LICENSE" className="hover:text-rc-cyan transition-colors">
              License
            </a>
            <a href="https://github.com/bolander72/ripperclaw/blob/main/README.md" className="hover:text-rc-cyan transition-colors">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
