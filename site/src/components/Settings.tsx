import { useState, useEffect } from 'react'
import { IconBrandGithub, IconTrash, IconSettings } from '@tabler/icons-react'

interface Preferences {
  githubUsername?: string
  preferredSources: string[]
  compatibilityFilter: string[]
}

const SOURCES = [
  { id: 'github', name: 'GitHub Repos', description: 'Repos tagged with clawclawgo-build' },
  { id: 'clawhub', name: 'ClawHub', description: 'OpenClaw skill registry' },
  { id: 'skillssh', name: 'skills.sh', description: 'Vercel skill directory' },
]

const AGENTS = [
  { id: 'openclaw', name: 'OpenClaw' },
  { id: 'claude-code', name: 'Claude Code' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'windsurf', name: 'Windsurf' },
  { id: 'codex', name: 'Codex' },
]

export default function Settings() {
  const [prefs, setPrefs] = useState<Preferences>({
    preferredSources: ['github', 'clawhub', 'skillssh'],
    compatibilityFilter: [],
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('clawclawgo:preferences')
    if (stored) {
      try {
        setPrefs(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [])

  const savePreferences = () => {
    localStorage.setItem('clawclawgo:preferences', JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleSource = (source: string) => {
    setPrefs(prev => ({
      ...prev,
      preferredSources: prev.preferredSources.includes(source)
        ? prev.preferredSources.filter(s => s !== source)
        : [...prev.preferredSources, source]
    }))
  }

  const toggleAgent = (agent: string) => {
    setPrefs(prev => ({
      ...prev,
      compatibilityFilter: prev.compatibilityFilter.includes(agent)
        ? prev.compatibilityFilter.filter(a => a !== agent)
        : [...prev.compatibilityFilter, agent]
    }))
  }

  const inputClasses = "w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan transition-colors"

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-grotesk font-bold text-2xl md:text-3xl text-rc-text mb-2">Settings</h1>
          <p className="text-rc-text-dim text-sm">Configure build sources, compatibility filters, and GitHub connection.</p>
        </div>

        <div className="space-y-6">
          {/* ─── GitHub Connection ──────────────────────────── */}
          <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconBrandGithub size={18} className="text-rc-cyan" />
              <h2 className="font-grotesk font-bold text-rc-text text-lg">GitHub Connection</h2>
            </div>
            <p className="text-rc-text-dim text-xs mb-4">
              Connect your GitHub account to publish builds. OAuth coming soon — for now, just enter your username.
            </p>
            <div>
              <label className="block text-rc-text-dim text-xs font-mono mb-1.5">GitHub Username</label>
              <input
                type="text"
                value={prefs.githubUsername || ''}
                onChange={(e) => setPrefs({ ...prefs, githubUsername: e.target.value })}
                placeholder="your-username"
                className={inputClasses}
              />
            </div>
          </section>

          {/* ─── Preferred Sources ──────────────────────────── */}
          <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconSettings size={18} className="text-rc-cyan" />
              <h2 className="font-grotesk font-bold text-rc-text text-lg">Preferred Sources</h2>
            </div>
            <p className="text-rc-text-dim text-xs mb-4">Choose which build sources to show in your feed.</p>
            <div className="space-y-2">
              {SOURCES.map(source => (
                <label key={source.id} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={prefs.preferredSources.includes(source.id)}
                    onChange={() => toggleSource(source.id)}
                    className="mt-1 w-4 h-4 rounded border-rc-border bg-rc-bg text-rc-cyan focus:ring-rc-cyan focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="font-mono text-sm text-rc-text group-hover:text-rc-cyan transition-colors">
                      {source.name}
                    </div>
                    <div className="text-xs text-rc-text-dim">{source.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* ─── Compatibility Filter ──────────────────────── */}
          <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
            <h2 className="font-grotesk font-bold text-rc-text text-lg mb-4">Default Compatibility Filter</h2>
            <p className="text-rc-text-dim text-xs mb-4">Only show builds compatible with these agents (leave empty for all).</p>
            <div className="flex flex-wrap gap-2">
              {AGENTS.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    prefs.compatibilityFilter.includes(agent.id)
                      ? 'bg-rc-cyan text-rc-bg font-bold'
                      : 'bg-rc-bg border border-rc-border text-rc-text-dim hover:border-rc-cyan/40'
                  }`}
                >
                  {agent.name}
                </button>
              ))}
            </div>
          </section>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              className="px-6 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
            >
              {saved ? 'Saved!' : 'Save Preferences'}
            </button>
          </div>

          {/* ─── Danger Zone ───────────────────────────────── */}
          <section className="bg-rc-surface border border-red-500/20 rounded-2xl p-6">
            <h2 className="font-grotesk font-bold text-red-400 text-lg mb-4">Danger Zone</h2>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-rc-text text-sm font-semibold">Clear all local data</p>
                <p className="text-rc-text-dim text-xs">Remove all ClawClawGo data from localStorage (preferences, imported builds).</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('This will delete your preferences and imported builds. Are you sure?')) {
                    localStorage.removeItem('clawclawgo:preferences')
                    setPrefs({
                      preferredSources: ['github', 'clawhub', 'skillssh'],
                      compatibilityFilter: [],
                    })
                  }
                }}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs rounded-lg hover:bg-red-500/20 transition-colors shrink-0 flex items-center gap-2"
              >
                <IconTrash size={14} />
                Clear Data
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
