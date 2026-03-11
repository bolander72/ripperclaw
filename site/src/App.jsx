import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'

// Animated dot grid background component
function DotGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle, rgba(0, 240, 255, 0.15) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />
    </div>
  )
}

// Glitch text component
function GlitchText({ children, className = '' }) {
  const [isGlitching, setIsGlitching] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.9) {
        setIsGlitching(true)
        setTimeout(() => setIsGlitching(false), 150)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      {isGlitching && (
        <>
          <span className="absolute inset-0 text-rc-cyan opacity-70" style={{ transform: 'translate(-2px, 0)' }}>
            {children}
          </span>
          <span className="absolute inset-0 text-rc-magenta opacity-70" style={{ transform: 'translate(2px, 0)' }}>
            {children}
          </span>
        </>
      )}
    </span>
  )
}

// Terminal typing animation
function TerminalDemo() {
  const [lines, setLines] = useState([])
  const terminalRef = useRef(null)
  const isInView = useInView(terminalRef, { once: true, margin: '-100px' })
  
  const terminalContent = [
    { type: 'input', text: 'ripperclaw export', delay: 500 },
    { type: 'output', text: '✓ Reading OpenClaw config...', delay: 800 },
    { type: 'output', text: '✓ Mapping 9 slots...', delay: 1100 },
    { type: 'output', text: '✓ 26 mods detected', delay: 1400 },
    { type: 'output', text: '✓ Loadout exported: quinn-homelab.json', delay: 1700 },
    { type: 'blank', delay: 2200 },
    { type: 'input', text: 'ripperclaw publish --scrub', delay: 2500 },
    { type: 'output', text: '✓ PII scrubbed (3 patterns removed)', delay: 2900 },
    { type: 'output', text: '✓ Signed with npub1abc...xyz', delay: 3200 },
    { type: 'output', text: '✓ Published to 2/3 relays', delay: 3500 },
  ]
  
  useEffect(() => {
    if (!isInView) return
    
    setLines([])
    terminalContent.forEach((line, index) => {
      setTimeout(() => {
        setLines(prev => [...prev, line])
      }, line.delay)
    })
  }, [isInView])
  
  return (
    <div ref={terminalRef} className="mt-12 p-6 border-2 border-rc-cyan bg-rc-bg/90 backdrop-blur-sm font-mono text-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-rc-border">
        <div className="w-3 h-3 rounded-full bg-rc-red"></div>
        <div className="w-3 h-3 rounded-full bg-rc-yellow"></div>
        <div className="w-3 h-3 rounded-full bg-rc-green"></div>
        <span className="ml-2 text-rc-text-dim">terminal</span>
      </div>
      <div className="space-y-1">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={line.type === 'input' ? 'text-rc-cyan' : line.type === 'blank' ? 'h-4' : 'text-rc-green'}
          >
            {line.type === 'input' && <span className="text-rc-magenta">&gt; </span>}
            {line.text}
            {i === lines.length - 1 && line.type !== 'blank' && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block ml-1 w-2 h-4 bg-rc-cyan"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Body diagram with positioned slots
function BodyDiagram({ slots, activeSlot, setActiveSlot }) {
  return (
    <div className="relative w-full max-w-xl mx-auto" style={{ height: '600px' }}>
      {/* Stylized humanoid wireframe */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="100" cy="50" r="30" stroke="currentColor" strokeWidth="1" className="text-rc-cyan" />
        {/* Neck */}
        <line x1="100" y1="80" x2="100" y2="110" stroke="currentColor" strokeWidth="2" className="text-rc-cyan" />
        {/* Shoulders */}
        <line x1="60" y1="120" x2="140" y2="120" stroke="currentColor" strokeWidth="2" className="text-rc-cyan" />
        {/* Torso */}
        <path d="M 70 120 L 60 200 L 70 280 L 130 280 L 140 200 L 130 120 Z" stroke="currentColor" strokeWidth="2" className="text-rc-cyan" />
        {/* Arms */}
        <line x1="60" y1="120" x2="40" y2="200" stroke="currentColor" strokeWidth="2" className="text-rc-cyan" />
        <line x1="140" y1="120" x2="160" y2="200" stroke="currentColor" strokeWidth="2" className="text-rc-cyan" />
        {/* Legs */}
        <line x1="80" y1="280" x2="70" y2="420" stroke="currentColor" strokeWidth="2" className="text-rc-cyan" />
        <line x1="120" y1="280" x2="130" y2="420" stroke="currentColor" strokeWidth="2" className="text-rc-cyan" />
      </svg>
      
      {/* Slot markers */}
      {slots.map((slot, i) => {
        const isActive = activeSlot?.name === slot.name
        return (
          <motion.div
            key={i}
            className="absolute cursor-pointer group"
            style={{
              top: slot.bodyPosition.top,
              left: slot.bodyPosition.left,
              transform: 'translate(-50%, -50%)',
            }}
            onHoverStart={() => setActiveSlot(slot)}
            onHoverEnd={() => setActiveSlot(null)}
            whileHover={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              className={`relative w-12 h-12 border-2 ${slot.color.replace('text-', 'border-')} bg-rc-bg/80 backdrop-blur-sm flex items-center justify-center`}
              animate={isActive ? {
                boxShadow: [`0 0 10px ${slot.glowColor}`, `0 0 30px ${slot.glowColor}`, `0 0 10px ${slot.glowColor}`],
              } : {}}
              transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
            >
              <span className={`text-xs font-bold font-mono ${slot.color}`}>
                {slot.name.slice(0, 2).toUpperCase()}
              </span>
              
              {/* Pulse indicator */}
              <motion.div
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${slot.color.replace('text-', 'bg-')}`}
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            {/* Hover tooltip */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 px-4 py-2 bg-rc-surface border border-rc-border rounded whitespace-nowrap z-10 backdrop-blur-sm"
              >
                <div className={`font-bold text-sm ${slot.color}`}>{slot.name}</div>
                <div className="text-xs text-rc-text-dim">{slot.description}</div>
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// Scroll-triggered section wrapper
function ScrollSection({ children, className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const controls = useAnimation()
  
  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [isInView, controls])
  
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
      }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

function App() {
  const [activeSlot, setActiveSlot] = useState(null)

  const slots = [
    { 
      name: 'Brain', 
      description: 'Memory/LCM', 
      bodyPosition: { top: '8%', left: '50%' },
      color: 'text-rc-cyan',
      glowColor: 'rgba(0, 240, 255, 0.8)'
    },
    { 
      name: 'Eyes', 
      description: 'Cameras', 
      bodyPosition: { top: '12%', left: '50%' },
      color: 'text-rc-magenta',
      glowColor: 'rgba(255, 0, 170, 0.8)'
    },
    { 
      name: 'Ears', 
      description: 'STT', 
      bodyPosition: { top: '10%', left: '35%' },
      color: 'text-rc-cyan',
      glowColor: 'rgba(0, 240, 255, 0.8)'
    },
    { 
      name: 'Mouth', 
      description: 'TTS', 
      bodyPosition: { top: '10%', left: '65%' },
      color: 'text-rc-green',
      glowColor: 'rgba(0, 255, 136, 0.8)'
    },
    { 
      name: 'Soul', 
      description: 'Personality', 
      bodyPosition: { top: '25%', left: '50%' },
      color: 'text-rc-magenta',
      glowColor: 'rgba(255, 0, 170, 0.8)'
    },
    { 
      name: 'Heart', 
      description: 'Heartbeat', 
      bodyPosition: { top: '32%', left: '45%' },
      color: 'text-rc-red',
      glowColor: 'rgba(255, 51, 102, 0.8)'
    },
    { 
      name: 'OS', 
      description: 'Runtime', 
      bodyPosition: { top: '40%', left: '50%' },
      color: 'text-rc-yellow',
      glowColor: 'rgba(255, 204, 0, 0.8)'
    },
    { 
      name: 'Nervous System', 
      description: 'Integrations', 
      bodyPosition: { top: '52%', left: '50%' },
      color: 'text-rc-green',
      glowColor: 'rgba(0, 255, 136, 0.8)'
    },
    { 
      name: 'Skeleton', 
      description: 'Models', 
      bodyPosition: { top: '68%', left: '50%' },
      color: 'text-rc-text-dim',
      glowColor: 'rgba(136, 136, 160, 0.8)'
    },
  ]

  const templates = [
    { name: 'Homelab', icon: '🏠', color: 'text-rc-cyan' },
    { name: 'Ops', icon: '⚙️', color: 'text-rc-yellow' },
    { name: 'Researcher', icon: '🔬', color: 'text-rc-magenta' },
    { name: 'Smart Home', icon: '💡', color: 'text-rc-green' },
    { name: 'Creator', icon: '✨', color: 'text-rc-red' },
  ]

  return (
    <div className="min-h-screen scanlines overflow-x-hidden">
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-4 relative">
        <DotGridBackground />
        
        <div className="absolute inset-0 bg-gradient-to-b from-rc-bg via-rc-surface/30 to-rc-bg"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-4 text-glow-cyan">
              <GlitchText>
                RIPPER<span className="text-rc-magenta">CLAW</span>
              </GlitchText>
            </h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <p className="text-xl md:text-2xl text-rc-text-dim font-mono mb-2">
                {Array.from('> AI AGENT CONFIG MANAGEMENT').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.03 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </p>
              <p className="text-lg text-rc-text-muted font-mono">
                Build. Export. Share. Clone.
              </p>
            </motion.div>
          </motion.div>

          {/* Body Diagram */}
          <motion.div 
            className="my-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <BodyDiagram 
              slots={slots} 
              activeSlot={activeSlot} 
              setActiveSlot={setActiveSlot}
            />
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <motion.a
              href="https://github.com/bolander72/ripperclaw/releases"
              className="px-8 py-4 bg-rc-cyan text-rc-bg font-bold text-lg hover:bg-rc-cyan/90 transition-all border-2 border-rc-cyan relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-rc-cyan"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0, 240, 255, 0.5)',
                    '0 0 40px rgba(0, 240, 255, 0.8)',
                    '0 0 20px rgba(0, 240, 255, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="relative z-10">DOWNLOAD</span>
            </motion.a>
            
            <motion.a
              href="https://github.com/bolander72/ripperclaw"
              className="px-8 py-4 border-2 border-rc-cyan text-rc-cyan font-bold text-lg hover:bg-rc-cyan/10 transition-all"
              whileHover={{ scale: 1.05, borderColor: 'rgba(0, 240, 255, 1)' }}
              whileTap={{ scale: 0.95 }}
            >
              ⭐ STAR ON GITHUB
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="relative py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rc-cyan/10 to-transparent" 
             style={{ clipPath: 'polygon(0 0, 100% 20%, 100% 80%, 0% 100%)' }} />
        
        <ScrollSection>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
            {[
              { label: 'Cyberware Slots', value: '9' },
              { label: 'PII Patterns Scrubbed', value: '12' },
              { label: 'Nostr Relays', value: '3' },
              { label: 'License', value: 'MIT' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="border border-rc-border bg-rc-bg/80 backdrop-blur-sm p-4"
              >
                <div className="text-3xl md:text-4xl font-bold text-rc-cyan font-mono mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-rc-text-dim">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </ScrollSection>
      </div>

      {/* What It Does */}
      <ScrollSection className="py-20 px-4 bg-rc-surface/30 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-cyan to-transparent" />
        
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            <span className="text-rc-cyan font-mono">&gt;</span> THE SLOTS
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {slots.map((slot, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                whileHover={{ 
                  y: -5, 
                  transition: { type: 'spring', stiffness: 300 }
                }}
                className={`border border-rc-border bg-rc-bg p-6 hover:border-current transition-all group cursor-pointer ${slot.color}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-xl font-mono">{slot.name}</h3>
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-current"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <p className="text-rc-text-dim text-sm">{slot.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <p className="text-lg text-rc-text-dim max-w-3xl mx-auto">
              Your AI agent is more than config files. It's a <span className="text-rc-cyan font-mono">rig</span>. 
              Map every component to cyberware slots. Export the whole loadout. Share it. Compare it. Clone what works.
            </p>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-magenta to-transparent" />
      </ScrollSection>

      {/* The Feed */}
      <ScrollSection className="py-20 px-4 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-magenta to-transparent" />
        
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            <span className="text-rc-magenta font-mono">&gt;</span> THE FEED
          </h2>

          <div className="grid md:grid-cols-4 gap-8 items-center">
            {[
              { num: '1', title: 'PUBLISH', desc: 'Export your rig to Nostr (kind 38333). PII scrubbed automatically.', color: 'rc-cyan' },
              { num: '2', title: 'BROWSE', desc: 'See what other OpenClaw agents are running. Filter by slot, model, capability.', color: 'rc-magenta' },
              { num: '3', title: 'COMPARE', desc: 'Diff their loadout against yours. See exactly what\'s different.', color: 'rc-yellow' },
              { num: '4', title: 'CLONE', desc: 'One click. Import their entire rig. Adapt it. Make it yours.', color: 'rc-green' },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <motion.div 
                  className={`w-16 h-16 mx-auto mb-4 border-2 border-${step.color} flex items-center justify-center text-2xl text-${step.color}`}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 360,
                    transition: { type: 'spring', stiffness: 200 }
                  }}
                >
                  {step.num}
                </motion.div>
                <h3 className={`font-bold mb-2 text-${step.color}`}>{step.title}</h3>
                <p className="text-sm text-rc-text-dim">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-12 p-6 border border-rc-border bg-rc-bg/50"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-rc-cyan text-xl">⚡</div>
              <div>
                <h4 className="font-bold text-rc-cyan mb-2">Self-Hosted Relay (Optional)</h4>
                <p className="text-sm text-rc-text-dim">
                  Run your own Nostr relay as an OpenClaw plugin. Keep your loadouts private or share with your crew only.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-green to-transparent" />
      </ScrollSection>

      {/* How It Works */}
      <ScrollSection className="py-20 px-4 bg-rc-surface/30 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-green to-transparent" />
        
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            <span className="text-rc-green font-mono">&gt;</span> HOW IT WORKS
          </h2>

          <div className="space-y-8">
            {[
              { num: '01', title: 'Install', desc: 'Download RipperClaw for macOS, Linux, or Windows. Built with Tauri v2 — fast, native, secure.', color: 'text-rc-cyan' },
              { num: '02', title: 'Export Your Rig', desc: 'RipperClaw reads your OpenClaw config and maps it to the 9 slots. Review. Edit. Export.', color: 'text-rc-magenta' },
              { num: '03', title: 'Share on The Feed', desc: 'Publish to Nostr. Browse others\' rigs. Compare, clone, iterate. Build in public or keep it private.', color: 'text-rc-green' },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="flex gap-6 items-start"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
              >
                <div className={`text-4xl font-bold ${step.color} font-mono flex-shrink-0`}>{step.num}</div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-rc-text-dim">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <TerminalDemo />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-yellow to-transparent" />
      </ScrollSection>

      {/* Templates */}
      <ScrollSection className="py-20 px-4 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-yellow to-transparent" />
        
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            <span className="text-rc-red font-mono">&gt;</span> STARTER TEMPLATES
          </h2>

          <div className="grid md:grid-cols-5 gap-6">
            {templates.map((template, i) => (
              <motion.div
                key={i}
                className={`border border-rc-border bg-rc-bg p-6 hover:border-current transition-all text-center group cursor-pointer ${template.color}`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.05,
                  transition: { type: 'spring', stiffness: 300 }
                }}
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="font-bold font-mono">{template.name}</h3>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <p className="text-rc-text-dim max-w-2xl mx-auto">
              Start with a proven config. Homelab automation, ops workflows, research agents, smart home control, or content creation.
              Clone → customize → share back.
            </p>
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-red to-transparent" />
      </ScrollSection>

      {/* Open Source */}
      <ScrollSection className="py-20 px-4 bg-rc-surface/30 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-red to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-rc-cyan font-mono">&gt;</span> OPEN SOURCE
          </h2>

          <motion.p 
            className="text-xl text-rc-text-dim mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            MIT licensed. Built for OpenClaw. Community-driven.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.a
              href="https://github.com/bolander72/ripperclaw"
              className="px-8 py-4 border-2 border-rc-cyan text-rc-cyan font-bold hover:bg-rc-cyan/10 transition-all font-mono"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              GITHUB REPO
            </motion.a>
            <motion.a
              href="https://github.com/bolander72/ripperclaw/issues"
              className="px-8 py-4 border-2 border-rc-magenta text-rc-magenta font-bold hover:bg-rc-magenta/10 transition-all font-mono"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              REPORT BUGS
            </motion.a>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { title: 'Contribute', desc: 'PRs welcome. Issues triaged. Roadmap public.', color: 'text-rc-cyan' },
              { title: 'Privacy First', desc: 'PII scrubber runs locally. Your data never leaves your machine unless you choose.', color: 'text-rc-magenta' },
              { title: 'Built for OpenClaw', desc: 'Native integration. Read your config. Export your rig. No manual mapping.', color: 'text-rc-green' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="border border-rc-border bg-rc-bg p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <h3 className={`font-bold mb-2 ${feature.color}`}>{feature.title}</h3>
                <p className="text-sm text-rc-text-dim">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-rc-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-mono text-rc-text-dim text-sm">
            RipperClaw © 2026 — MIT License
          </div>
          <div className="flex gap-6 text-sm">
            <a href="https://github.com/bolander72/ripperclaw" className="text-rc-cyan hover:text-rc-cyan/80 transition-colors">
              GitHub
            </a>
            <a href="https://github.com/bolander72/ripperclaw/blob/main/LICENSE" className="text-rc-cyan hover:text-rc-cyan/80 transition-colors">
              License
            </a>
            <a href="https://github.com/bolander72/ripperclaw/blob/main/README.md" className="text-rc-cyan hover:text-rc-cyan/80 transition-colors">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
