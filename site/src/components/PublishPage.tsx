import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconUpload, IconHash, IconCheck, IconAlertTriangle, IconX,
  IconShieldCheck, IconShieldExclamation, IconChevronDown, IconChevronRight,
  IconInfoCircle, IconCopy, IconDownload, IconBrandGithub,
} from '@tabler/icons-react'
import { scanBuild } from '../lib/utils'
import LoadingSprite from './LoadingSprite'
import type { BuildContent, ScanResult } from '../types'

// ─── Types ─────────────────────────────────────────────────

interface BuildSection {
  key: string
  label: string
  description: string
  included: boolean
  content: unknown
  scanScore: 'PASS' | 'WARN' | 'FAIL'
  piiWarnings: string[]
}

type Step = 'upload' | 'review' | 'metadata' | 'output'

// ─── Section descriptions ──────────────────────────────────

const SECTION_INFO: Record<string, { label: string; description: string }> = {
  model: { label: 'Model Configuration', description: 'AI model tiers, routing, and aliases' },
  persona: { label: 'Persona (SOUL.md)', description: 'Your agent\'s personality, voice, communication style, and behavioral rules' },
  skills: { label: 'Skills', description: 'Installed skills and their configurations' },
  integrations: { label: 'Integrations', description: 'Connected services (calendar, email, smart home, etc.)' },
  automations: { label: 'Automations', description: 'Heartbeat tasks and cron jobs' },
  memory: { label: 'Memory', description: 'Memory configuration and stored context' },
  meta: { label: 'Metadata', description: 'Build metadata (name, version, export info)' },
}

// ─── Per-section PII scan ──────────────────────────────────

const PII_PATTERNS = [
  { name: 'Email', pattern: /[\w.-]+@[\w.-]+\.\w+/g },
  { name: 'Phone', pattern: /\+?1?\d{10,15}/g },
  { name: 'IP Address', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
  { name: 'Street Address', pattern: /\d+\s+[\w\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Circle|Place|Terrace)\b/gi },
  { name: 'API Key', pattern: /(?:sk|pk|api[_-]?key)[_-][\w-]{20,}/gi },
  { name: 'Bearer Token', pattern: /Bearer\s+[\w.-]{20,}/g },
]

function scanSectionPII(content: unknown): { score: 'PASS' | 'WARN' | 'FAIL'; warnings: string[] } {
  const text = JSON.stringify(content, null, 2)
  const warnings: string[] = []
  for (const { name, pattern } of PII_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      warnings.push(`${name} (${matches.length} found)`)
    }
  }
  return { score: warnings.length > 0 ? 'WARN' : 'PASS', warnings }
}

// ─── Component ─────────────────────────────────────────────

export default function PublishPage() {
  const [step, setStep] = useState<Step>('upload')
  const [rawContent, setRawContent] = useState<BuildContent | null>(null)
  const [sections, setSections] = useState<BuildSection[]>([])
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [buildName, setBuildName] = useState('')
  const [buildDescription, setBuildDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [compatibility, setCompatibility] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Build Parsing ─────────────────────────────────────

  const parseBuild = useCallback((content: BuildContent) => {
    setRawContent(content)
    setBuildName(content.meta?.name || 'Unnamed Build')
    setBuildDescription(content.meta?.description || '')
    
    // Extract tags, compatibility, permissions from content
    const autoTags: string[] = content.meta?.tags || []
    setTags([...new Set(autoTags)].slice(0, 8))
    
    setCompatibility(content.meta?.compatibility || [])
    setPermissions(content.permissions || content.meta?.permissions || [])

    // Build sections
    const sectionKeys = Object.keys(content).filter(k => !['schema', 'dependencies'].includes(k))
    const built: BuildSection[] = sectionKeys.map(key => {
      const info = SECTION_INFO[key] || { label: key, description: `${key} configuration` }
      const sectionContent = (content as any)[key]
      const { score, warnings } = scanSectionPII(sectionContent)
      return {
        key,
        label: info.label,
        description: info.description,
        included: true,
        content: sectionContent,
        scanScore: score,
        piiWarnings: warnings,
      }
    })

    setSections(built)
    setStep('review')
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const content = JSON.parse(ev.target?.result as string)
        parseBuild(content)
      } catch (err) {
        setError('Failed to parse JSON: ' + (err as Error).message)
      }
    }
    reader.readAsText(file)
  }

  const handlePasteSubmit = () => {
    try {
      const content = JSON.parse(pasteText)
      parseBuild(content)
      setShowPasteArea(false)
    } catch (err) {
      setError('Failed to parse JSON: ' + (err as Error).message)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.json')) {
      setError('Please drop a .json file')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const content = JSON.parse(ev.target?.result as string)
        parseBuild(content)
      } catch (err) {
        setError('Failed to parse JSON: ' + (err as Error).message)
      }
    }
    reader.readAsText(file)
  }

  // ─── Generate Output ───────────────────────────────────

  const generateBuildJSON = () => {
    if (!rawContent) return ''
    
    const finalContent = { ...rawContent }
    
    // Update meta
    if (!finalContent.meta) finalContent.meta = {}
    finalContent.meta.name = buildName
    finalContent.meta.description = buildDescription
    finalContent.meta.tags = tags
    finalContent.meta.compatibility = compatibility
    finalContent.meta.permissions = permissions
    finalContent.meta.source = 'github'
    
    // Set schema version
    finalContent.schema = 4
    
    // Remove excluded sections
    sections.filter(s => !s.included).forEach(s => {
      delete (finalContent as any)[s.key]
    })
    
    return JSON.stringify(finalContent, null, 2)
  }

  const downloadBuildJSON = () => {
    const json = generateBuildJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'build.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    const json = generateBuildJSON()
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-rc-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-grotesk font-bold text-2xl md:text-3xl text-rc-text mb-2">Publish a Build</h1>
          <p className="text-rc-text-dim text-sm">Export your agent config and publish it as a GitHub repo</p>
        </div>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
            >
              <IconAlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 text-sm font-mono">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400">
                <IconX size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 transition-all
                ${isDragging ? 'border-rc-cyan bg-rc-cyan/5' : 'border-rc-border bg-rc-surface'}
              `}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rc-bg border border-rc-border flex items-center justify-center">
                  <IconUpload size={32} className="text-rc-cyan" />
                </div>
                <div className="text-center">
                  <p className="font-grotesk font-bold text-rc-text text-lg mb-1">Upload build config</p>
                  <p className="text-rc-text-dim text-sm">Drag and drop, paste JSON, or click to browse</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                  >
                    Browse files
                  </button>
                  <button
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-cyan/40 transition-colors"
                  >
                    Paste JSON
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {showPasteArea && (
              <div className="bg-rc-surface border border-rc-border rounded-2xl p-6">
                <label className="block text-rc-text text-sm font-mono mb-2">Paste your build JSON:</label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder='{ "schema": 4, "meta": { ... }, ... }'
                  rows={12}
                  className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-xs focus:outline-none focus:border-rc-cyan resize-y"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handlePasteSubmit}
                    className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                  >
                    Parse & Continue
                  </button>
                  <button
                    onClick={() => { setShowPasteArea(false); setPasteText('') }}
                    className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-border/40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review sections */}
        {step === 'review' && rawContent && (
          <div className="space-y-6">
            <div className="bg-rc-surface border border-rc-border rounded-2xl p-6">
              <h2 className="font-grotesk font-bold text-rc-text text-lg mb-4">Review & Select Sections</h2>
              <p className="text-rc-text-dim text-sm mb-6">
                Choose which parts of your config to include. Sensitive data warnings are highlighted.
              </p>
              
              <div className="space-y-2">
                {sections.map(section => (
                  <div
                    key={section.key}
                    className="bg-rc-bg border border-rc-border rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4">
                      <input
                        type="checkbox"
                        checked={section.included}
                        onChange={() => {
                          setSections(prev => prev.map(s =>
                            s.key === section.key ? { ...s, included: !s.included } : s
                          ))
                        }}
                        className="w-4 h-4 rounded border-rc-border bg-rc-surface text-rc-cyan focus:ring-rc-cyan focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-rc-text font-semibold">{section.label}</span>
                          {section.scanScore === 'WARN' && (
                            <IconShieldExclamation size={14} className="text-amber-400" title="Contains potentially sensitive data" />
                          )}
                          {section.scanScore === 'PASS' && (
                            <IconShieldCheck size={14} className="text-green-400" title="No sensitive data detected" />
                          )}
                        </div>
                        <p className="text-xs text-rc-text-dim">{section.description}</p>
                        {section.piiWarnings.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {section.piiWarnings.map((w, i) => (
                              <span key={i} className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                                {w}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                        className="text-rc-text-muted hover:text-rc-cyan transition-colors"
                      >
                        {expandedSection === section.key ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                      </button>
                    </div>
                    {expandedSection === section.key && (
                      <div className="px-4 pb-4">
                        <pre className="text-xs font-mono text-rc-text-dim bg-rc-surface p-3 rounded-lg overflow-x-auto max-h-60">
                          {JSON.stringify(section.content, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-border/40 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('metadata')}
                className="px-6 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
              >
                Next: Add Metadata
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Metadata */}
        {step === 'metadata' && (
          <div className="space-y-6">
            <div className="bg-rc-surface border border-rc-border rounded-2xl p-6 space-y-4">
              <h2 className="font-grotesk font-bold text-rc-text text-lg mb-4">Build Metadata</h2>
              
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Build Name *</label>
                <input
                  type="text"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  placeholder="My Awesome Agent Build"
                  className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
                />
              </div>

              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Description</label>
                <textarea
                  value={buildDescription}
                  onChange={(e) => setBuildDescription(e.target.value)}
                  placeholder="A powerful AI assistant with voice control, smart home integration, and calendar management"
                  rows={3}
                  className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan resize-y"
                />
              </div>

              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-rc-magenta/15 border border-rc-magenta/30 text-rc-magenta text-xs font-mono rounded flex items-center gap-1.5"
                    >
                      <IconHash size={10} />{tag}
                      <button onClick={() => setTags(tags.filter((_, ii) => ii !== i))} className="hover:text-rc-magenta/70">
                        <IconX size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        setTags([...tags, newTag.trim()])
                        setNewTag('')
                      }
                    }}
                    placeholder="Add tag (press Enter)"
                    className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Compatibility (which agents can use this)</label>
                <div className="flex flex-wrap gap-2">
                  {['openclaw', 'claude-code', 'cursor', 'windsurf', 'codex'].map(agent => (
                    <button
                      key={agent}
                      onClick={() => {
                        setCompatibility(prev =>
                          prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
                        )
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        compatibility.includes(agent)
                          ? 'bg-rc-cyan text-rc-bg font-bold'
                          : 'bg-rc-bg border border-rc-border text-rc-text-dim hover:border-rc-cyan/40'
                      }`}
                    >
                      {agent}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Declared Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {['filesystem', 'web-search', 'email', 'calendar', 'smart-home', 'message', 'exec', 'browser'].map(perm => (
                    <button
                      key={perm}
                      onClick={() => {
                        setPermissions(prev =>
                          prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
                        )
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        permissions.includes(perm)
                          ? 'bg-rc-magenta text-rc-bg font-bold'
                          : 'bg-rc-bg border border-rc-border text-rc-text-dim hover:border-rc-magenta/40'
                      }`}
                    >
                      {perm}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('review')}
                className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-border/40 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('output')}
                disabled={!buildName.trim()}
                className="px-6 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Output
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Output */}
        {step === 'output' && (
          <div className="space-y-6">
            <div className="bg-rc-surface border border-rc-border rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-rc-bg border border-rc-cyan flex items-center justify-center shrink-0">
                  <IconBrandGithub size={24} className="text-rc-cyan" />
                </div>
                <div>
                  <h2 className="font-grotesk font-bold text-rc-text text-lg mb-1">Publish to GitHub</h2>
                  <p className="text-rc-text-dim text-sm">Your build.json is ready. Follow these steps to publish:</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-rc-cyan/15 border border-rc-cyan/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-mono font-bold text-rc-cyan">1</span>
                  </div>
                  <div>
                    <p className="text-rc-text text-sm font-semibold mb-1">Create a new GitHub repository</p>
                    <p className="text-rc-text-dim text-xs">Make it public so others can discover your build</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-rc-cyan/15 border border-rc-cyan/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-mono font-bold text-rc-cyan">2</span>
                  </div>
                  <div>
                    <p className="text-rc-text text-sm font-semibold mb-1">Add this <code className="text-rc-cyan">build.json</code> file to the repo root</p>
                    <p className="text-rc-text-dim text-xs">Copy the JSON below or download the file</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-rc-cyan/15 border border-rc-cyan/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-mono font-bold text-rc-cyan">3</span>
                  </div>
                  <div>
                    <p className="text-rc-text text-sm font-semibold mb-1">Add the <code className="text-rc-cyan">clawclawgo-build</code> topic</p>
                    <p className="text-rc-text-dim text-xs">Go to repo settings → Topics → add "clawclawgo-build"</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-rc-cyan/15 border border-rc-cyan/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-mono font-bold text-rc-cyan">4</span>
                  </div>
                  <div>
                    <p className="text-rc-text text-sm font-semibold mb-1">Your build will appear in the feed within 24 hours</p>
                    <p className="text-rc-text-dim text-xs">The aggregator indexes GitHub repos with the clawclawgo-build topic</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-rc-text-dim text-xs font-mono">build.json</span>
                <div className="flex-1 h-px bg-rc-border" />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-rc-bg border border-rc-border text-rc-text-dim hover:text-rc-cyan hover:border-rc-cyan/40 rounded text-xs font-mono transition-colors flex items-center gap-1.5"
                >
                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={downloadBuildJSON}
                  className="px-3 py-1 bg-rc-cyan text-rc-bg rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
                >
                  <IconDownload size={12} />
                  Download
                </button>
              </div>

              <pre className="text-xs font-mono text-rc-text-dim bg-rc-bg p-4 rounded-lg overflow-x-auto max-h-96 border border-rc-border">
                {generateBuildJSON()}
              </pre>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('metadata')}
                className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-border/40 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => window.location.href = '/feed'}
                className="px-6 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
