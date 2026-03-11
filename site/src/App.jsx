import { useState, useEffect } from 'react'

function App() {
  const [activeSlot, setActiveSlot] = useState(null)

  const slots = [
    { name: 'Heart', description: 'Heartbeat', position: { top: '35%', left: '50%' }, color: 'text-rc-red' },
    { name: 'Soul', description: 'Personality', position: { top: '25%', left: '50%' }, color: 'text-rc-magenta' },
    { name: 'Brain', description: 'Memory/LCM', position: { top: '15%', left: '50%' }, color: 'text-rc-cyan' },
    { name: 'OS', description: 'Runtime', position: { top: '40%', left: '50%' }, color: 'text-rc-yellow' },
    { name: 'Mouth', description: 'TTS', position: { top: '20%', left: '45%' }, color: 'text-rc-green' },
    { name: 'Ears', description: 'STT', position: { top: '18%', left: '55%' }, color: 'text-rc-cyan' },
    { name: 'Eyes', description: 'Cameras', position: { top: '12%', left: '48%' }, color: 'text-rc-magenta' },
    { name: 'Nervous System', description: 'Integrations', position: { top: '45%', left: '50%' }, color: 'text-rc-green' },
    { name: 'Skeleton', description: 'Models', position: { top: '55%', left: '50%' }, color: 'text-rc-text-dim' },
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
        <div className="absolute inset-0 bg-gradient-to-b from-rc-bg via-rc-surface to-rc-bg opacity-50"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 text-glow-cyan animate-flicker">
              RIPPER<span className="text-rc-magenta">CLAW</span>
            </h1>
            <p className="text-xl md:text-2xl text-rc-text-dim font-mono mb-2">
              &gt; AI AGENT CONFIG MANAGEMENT
            </p>
            <p className="text-lg text-rc-text-muted font-mono">
              Build. Export. Share. Clone.
            </p>
          </div>

          {/* Simplified Slot Visualization */}
          <div className="my-16 relative">
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {slots.slice(0, 9).map((slot, i) => (
                <div
                  key={i}
                  className={`border border-rc-border bg-rc-surface/30 p-3 ${slot.color} hover:border-current transition-all cursor-pointer backdrop-blur-sm`}
                  onMouseEnter={() => setActiveSlot(slot)}
                  onMouseLeave={() => setActiveSlot(null)}
                >
                  <div className="font-mono text-xs mb-1">{slot.name}</div>
                  <div className="text-[10px] text-rc-text-muted">{slot.description}</div>
                </div>
              ))}
            </div>
            {activeSlot && (
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 font-mono text-sm text-rc-cyan animate-pulse-glow">
                → {activeSlot.name}: {activeSlot.description}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-20">
            <a
              href="https://github.com/bolander72/ripperclaw/releases"
              className="px-8 py-4 bg-rc-cyan text-rc-bg font-bold text-lg hover:bg-rc-cyan/90 transition-all border-2 border-rc-cyan hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
            >
              DOWNLOAD
            </a>
            <a
              href="https://github.com/bolander72/ripperclaw"
              className="px-8 py-4 border-2 border-rc-cyan text-rc-cyan font-bold text-lg hover:bg-rc-cyan/10 transition-all"
            >
              VIEW ON GITHUB
            </a>
          </div>
        </div>
      </section>

      {/* What It Does */}
      <section className="py-20 px-4 bg-rc-surface/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            <span className="text-rc-cyan font-mono">&gt;</span> THE SLOTS
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {slots.map((slot, i) => (
              <div
                key={i}
                className={`border border-rc-border bg-rc-bg p-6 hover:border-current transition-all group ${slot.color}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-xl font-mono">{slot.name}</h3>
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse-glow"></div>
                </div>
                <p className="text-rc-text-dim text-sm">{slot.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg text-rc-text-dim max-w-3xl mx-auto">
              Your AI agent is more than config files. It's a <span className="text-rc-cyan font-mono">rig</span>. 
              Map every component to cyberware slots. Export the whole loadout. Share it. Compare it. Clone what works.
            </p>
          </div>
        </div>
      </section>

      {/* The Feed */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            <span className="text-rc-magenta font-mono">&gt;</span> THE FEED
          </h2>

          <div className="grid md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-rc-cyan flex items-center justify-center text-2xl text-rc-cyan">
                1
              </div>
              <h3 className="font-bold mb-2 text-rc-cyan">PUBLISH</h3>
              <p className="text-sm text-rc-text-dim">Export your rig to Nostr (kind 38333). PII scrubbed automatically.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-rc-magenta flex items-center justify-center text-2xl text-rc-magenta">
                2
              </div>
              <h3 className="font-bold mb-2 text-rc-magenta">BROWSE</h3>
              <p className="text-sm text-rc-text-dim">See what other OpenClaw agents are running. Filter by slot, model, capability.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-rc-yellow flex items-center justify-center text-2xl text-rc-yellow">
                3
              </div>
              <h3 className="font-bold mb-2 text-rc-yellow">COMPARE</h3>
              <p className="text-sm text-rc-text-dim">Diff their loadout against yours. See exactly what's different.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-rc-green flex items-center justify-center text-2xl text-rc-green">
                4
              </div>
              <h3 className="font-bold mb-2 text-rc-green">CLONE</h3>
              <p className="text-sm text-rc-text-dim">One click. Import their entire rig. Adapt it. Make it yours.</p>
            </div>
          </div>

          <div className="mt-12 p-6 border border-rc-border bg-rc-bg/50">
            <div className="flex items-start gap-3">
              <div className="text-rc-cyan text-xl">⚡</div>
              <div>
                <h4 className="font-bold text-rc-cyan mb-2">Self-Hosted Relay (Optional)</h4>
                <p className="text-sm text-rc-text-dim">
                  Run your own Nostr relay as an OpenClaw plugin. Keep your loadouts private or share with your crew only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-rc-surface/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            <span className="text-rc-green font-mono">&gt;</span> HOW IT WORKS
          </h2>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="text-4xl font-bold text-rc-cyan font-mono flex-shrink-0">01</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Install</h3>
                <p className="text-rc-text-dim">
                  Download RipperClaw for macOS, Linux, or Windows. Built with Tauri v2 — fast, native, secure.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="text-4xl font-bold text-rc-magenta font-mono flex-shrink-0">02</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Export Your Rig</h3>
                <p className="text-rc-text-dim">
                  RipperClaw reads your OpenClaw config and maps it to the 9 slots. Review. Edit. Export.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="text-4xl font-bold text-rc-green font-mono flex-shrink-0">03</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Share on The Feed</h3>
                <p className="text-rc-text-dim">
                  Publish to Nostr. Browse others' rigs. Compare, clone, iterate. Build in public or keep it private.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 border-2 border-rc-yellow bg-rc-bg/50">
            <pre className="text-rc-yellow font-mono text-sm overflow-x-auto">
              <code>{`> ripperclaw export --sanitize
✓ Config loaded
✓ PII scrubbed
✓ Loadout signed
✓ Published to relay

Your rig is live.`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            <span className="text-rc-red font-mono">&gt;</span> STARTER TEMPLATES
          </h2>

          <div className="grid md:grid-cols-5 gap-6">
            {templates.map((template, i) => (
              <div
                key={i}
                className={`border border-rc-border bg-rc-bg p-6 hover:border-current transition-all text-center group ${template.color}`}
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="font-bold font-mono">{template.name}</h3>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-rc-text-dim max-w-2xl mx-auto">
              Start with a proven config. Homelab automation, ops workflows, research agents, smart home control, or content creation.
              Clone → customize → share back.
            </p>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="py-20 px-4 bg-rc-surface/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-rc-cyan font-mono">&gt;</span> OPEN SOURCE
          </h2>

          <p className="text-xl text-rc-text-dim mb-8">
            MIT licensed. Built for OpenClaw. Community-driven.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://github.com/bolander72/ripperclaw"
              className="px-8 py-4 border-2 border-rc-cyan text-rc-cyan font-bold hover:bg-rc-cyan/10 transition-all font-mono"
            >
              GITHUB REPO
            </a>
            <a
              href="https://github.com/bolander72/ripperclaw/issues"
              className="px-8 py-4 border-2 border-rc-magenta text-rc-magenta font-bold hover:bg-rc-magenta/10 transition-all font-mono"
            >
              REPORT BUGS
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="border border-rc-border bg-rc-bg p-6">
              <h3 className="font-bold mb-2 text-rc-cyan">Contribute</h3>
              <p className="text-sm text-rc-text-dim">
                PRs welcome. Issues triaged. Roadmap public.
              </p>
            </div>

            <div className="border border-rc-border bg-rc-bg p-6">
              <h3 className="font-bold mb-2 text-rc-magenta">Privacy First</h3>
              <p className="text-sm text-rc-text-dim">
                PII scrubber runs locally. Your data never leaves your machine unless you choose.
              </p>
            </div>

            <div className="border border-rc-border bg-rc-bg p-6">
              <h3 className="font-bold mb-2 text-rc-green">Built for OpenClaw</h3>
              <p className="text-sm text-rc-text-dim">
                Native integration. Read your config. Export your rig. No manual mapping.
              </p>
            </div>
          </div>
        </div>
      </section>

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
