import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconUpload, IconHash, IconCheck, IconAlertTriangle, IconX,
  IconShieldCheck, IconShieldExclamation, IconEye, IconEyeOff,
  IconChevronDown, IconChevronRight, IconKey, IconUserCircle,
  IconSpy, IconCopy, IconFile, IconTrash, IconInfoCircle,
} from '@tabler/icons-react'
import { generateSecretKey, getPublicKey, nip19, finalizeEvent, Relay } from 'nostr-tools'
import { scanBuild, RELAYS } from '../lib/utils'
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

type Step = 'upload' | 'review' | 'identity' | 'metadata' | 'publishing' | 'success'

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
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [identityMode, setIdentityMode] = useState<'anon' | 'existing' | 'generate'>('anon')
  const [keys, setKeys] = useState<{ nsec: string; npub: string } | null>(null)
  const [importNsec, setImportNsec] = useState('')
  const [revealNsec, setRevealNsec] = useState(false)
  const [eventId, setEventId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [showPasteArea, setShowPasteArea] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load stored keys on mount
  useEffect(() => {
    const stored = localStorage.getItem('clawclawgo:keys')
    if (stored) {
      try {
        setKeys(JSON.parse(stored))
        setIdentityMode('existing')
      } catch { /* ignore */ }
    }
  }, [])

  // ─── Build Parsing ─────────────────────────────────────

  const parseBuild = useCallback((content: BuildContent) => {
    setRawContent(content)
    setBuildName(content.meta?.agentName || (content as any).agentName || 'Unnamed Build')

    // Extract tags from content if present
    const autoTags: string[] = []
    if (content.model?.tiers) {
      Object.values(content.model.tiers).forEach((t: any) => {
        if (t?.provider) autoTags.push(t.provider)
      })
    }
    if (content.skills?.items) {
      content.skills.items.forEach(s => autoTags.push(s.name))
    }
    setTags([...new Set(autoTags)].slice(0, 8))

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

  // ─── Identity ──────────────────────────────────────────

  const generateKeys = () => {
    const sk = generateSecretKey()
    const pk = getPublicKey(sk)
    const nsec = nip19.nsecEncode(sk)
    const npub = nip19.npubEncode(pk)
    const newKeys = { nsec, npub }
    setKeys(newKeys)
    localStorage.setItem('clawclawgo:keys', JSON.stringify(newKeys))
    setIdentityMode('generate')
  }

  const importKey = () => {
    try {
      const { type, data } = nip19.decode(importNsec.trim())
      if (type !== 'nsec') {
        setError('Invalid nsec key')
        return
      }
      const pk = getPublicKey(data as Uint8Array)
      const npub = nip19.npubEncode(pk)
      const newKeys = { nsec: importNsec.trim(), npub }
      setKeys(newKeys)
      localStorage.setItem('clawclawgo:keys', JSON.stringify(newKeys))
      setIdentityMode('existing')
      setImportNsec('')
    } catch (err) {
      setError('Failed to import key: ' + (err as Error).message)
    }
  }

  // ─── Section Toggle ────────────────────────────────────

  const toggleSection = (key: string) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, included: !s.included } : s))
  }

  // ─── Publish ───────────────────────────────────────────

  const publish = async () => {
    if (!rawContent) return
    setStep('publishing')
    setError(null)

    try {
      // Build filtered content — only included sections
      const filteredContent: Record<string, unknown> = {}
      if (rawContent.schema) filteredContent.schema = rawContent.schema
      for (const section of sections) {
        if (section.included) {
          filteredContent[section.key] = section.content
        }
      }
      if (rawContent.dependencies) filteredContent.dependencies = rawContent.dependencies

      let secretKey: Uint8Array
      if (identityMode === 'anon') {
        // Generate throwaway keys for anonymous publish
        secretKey = generateSecretKey()
      } else {
        if (!keys) {
          setError('No identity configured')
          setStep('identity')
          return
        }
        const { type, data } = nip19.decode(keys.nsec)
        if (type !== 'nsec') throw new Error('Invalid nsec')
        secretKey = data as Uint8Array
      }

      const event = {
        kind: 38333,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['d', buildName],
          ...tags.map(t => ['t', t]),
          ['clawclawgo', '0.3.0'],
        ],
        content: JSON.stringify(filteredContent),
      }

      const signedEvent = finalizeEvent(event, secretKey)

      // Publish to relays
      const storedRelays = localStorage.getItem('clawclawgo:relays')
      const relayUrls: string[] = storedRelays ? JSON.parse(storedRelays) : RELAYS

      let published = false
      for (const url of relayUrls) {
        try {
          const relay = await Relay.connect(url)
          await relay.publish(signedEvent)
          relay.close()
          published = true
        } catch (err) {
          console.error(`Failed to publish to ${url}:`, err)
        }
      }

      if (!published) throw new Error('Failed to publish to any relay')

      setEventId(signedEvent.id)
      setStep('success')
    } catch (err) {
      setError('Publishing failed: ' + (err as Error).message)
      setStep('metadata')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // ─── Computed ──────────────────────────────────────────

  const includedCount = sections.filter(s => s.included).length
  const totalCount = sections.length
  const hasWarnings = sections.some(s => s.included && s.scanScore !== 'PASS')
  const hasCritical = sections.some(s => s.included && s.scanScore === 'FAIL')
  const overallScanResult = rawContent ? scanBuild(rawContent) : null

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-grotesk font-bold text-2xl md:text-3xl text-rc-text mb-2">Publish Build</h1>
          <p className="text-rc-text-dim text-sm">Share your agent configuration on Nostr. Choose what to include and how to identify yourself.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-xs font-mono">
          {(['upload', 'review', 'identity', 'metadata'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-px ${step === s || (['review', 'identity', 'metadata', 'publishing', 'success'].indexOf(step) > ['review', 'identity', 'metadata'].indexOf(s)) ? 'bg-rc-cyan' : 'bg-rc-border'}`} />}
              <button
                onClick={() => {
                  if (s === 'upload') setStep('upload')
                  else if (s === 'review' && rawContent) setStep('review')
                  else if (s === 'identity' && rawContent) setStep('identity')
                  else if (s === 'metadata' && rawContent) setStep('metadata')
                }}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  step === s
                    ? 'bg-rc-cyan/15 border-rc-cyan/40 text-rc-cyan'
                    : 'bg-rc-surface border-rc-border text-rc-text-muted hover:border-rc-border hover:text-rc-text-dim'
                }`}
              >
                {s === 'upload' ? '1. Upload' : s === 'review' ? '2. Review' : s === 'identity' ? '3. Identity' : '4. Publish'}
              </button>
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400"><IconX size={14} /></button>
          </div>
        )}

        {/* ─── Step 1: Upload ─────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-rc-cyan bg-rc-cyan/5'
                  : 'border-rc-border hover:border-rc-cyan/30'
              }`}
            >
              <IconUpload size={40} className="mx-auto mb-4 text-rc-text-muted" />
              <p className="text-rc-text font-grotesk font-semibold mb-1">Drop your build JSON here</p>
              <p className="text-rc-text-dim text-sm mb-4">or use one of the options below</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                >
                  <IconFile size={14} className="inline mr-1.5 -mt-0.5" />
                  Browse Files
                </button>
                <button
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-cyan/40 transition-colors"
                >
                  Paste JSON
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </div>

            {showPasteArea && (
              <div className="bg-rc-surface border border-rc-border rounded-2xl p-4 space-y-3">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder='{"schema": "3", "model": {...}, "skills": {...}}'
                  rows={8}
                  className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-xs focus:outline-none focus:border-rc-cyan resize-y"
                />
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Parse Build
                </button>
              </div>
            )}

            <div className="bg-rc-surface/50 border border-rc-border rounded-xl p-4 flex gap-3 items-start">
              <IconInfoCircle size={16} className="text-rc-text-muted mt-0.5 shrink-0" />
              <div className="text-xs text-rc-text-dim">
                <p className="mb-1">Export your build with the CLI: <code className="text-rc-cyan font-mono">clawclawgo export</code></p>
                <p>Builds are published as <a href="/docs/reference/nostr" className="text-rc-cyan hover:underline">Nostr kind 38333 events</a> — decentralized and censorship-resistant.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 2: Review (scan results + content selector) ─── */}
        {step === 'review' && rawContent && (
          <div className="space-y-4">
            {/* Overall scan badge */}
            <div className={`border rounded-xl p-4 flex items-center gap-3 ${
              hasCritical ? 'bg-red-500/10 border-red-500/30' :
              hasWarnings ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-green-500/10 border-green-500/30'
            }`}>
              {hasCritical ? (
                <IconShieldExclamation size={24} className="text-red-400" />
              ) : hasWarnings ? (
                <IconShieldExclamation size={24} className="text-amber-400" />
              ) : (
                <IconShieldCheck size={24} className="text-green-400" />
              )}
              <div>
                <p className={`font-mono text-sm font-bold ${
                  hasCritical ? 'text-red-400' : hasWarnings ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {hasCritical ? 'SECURITY ISSUES DETECTED' : hasWarnings ? 'PII WARNINGS' : 'SCAN PASSED'}
                </p>
                <p className="text-xs text-rc-text-dim">
                  {includedCount} of {totalCount} sections selected for publishing
                </p>
              </div>
            </div>

            {/* Section list */}
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.key}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    section.included ? 'bg-rc-surface border-rc-border' : 'bg-rc-bg/50 border-rc-border/50 opacity-60'
                  }`}
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleSection(section.key)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                        section.included
                          ? 'bg-rc-cyan border-rc-cyan'
                          : 'border-rc-text-muted hover:border-rc-cyan'
                      }`}
                    >
                      {section.included && <IconCheck size={12} className="text-rc-bg" />}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-grotesk font-semibold text-rc-text">{section.label}</span>
                        {section.scanScore === 'WARN' && (
                          <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                            <IconAlertTriangle size={12} /> PII
                          </span>
                        )}
                        {section.scanScore === 'FAIL' && (
                          <span className="text-xs font-mono text-red-400 flex items-center gap-1">
                            <IconAlertTriangle size={12} /> DANGER
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-rc-text-dim truncate">{section.description}</p>
                    </div>

                    {/* Expand button */}
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                      className="text-rc-text-muted hover:text-rc-cyan transition-colors shrink-0"
                    >
                      {expandedSection === section.key ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                    </button>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {expandedSection === section.key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {/* PII warnings for this section */}
                          {section.piiWarnings.length > 0 && (
                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <p className="text-xs font-mono text-amber-400 font-bold mb-1">PII Detected:</p>
                              {section.piiWarnings.map((w, i) => (
                                <p key={i} className="text-xs text-amber-400/80">• {w}</p>
                              ))}
                            </div>
                          )}

                          {/* Content preview */}
                          <div className="bg-rc-bg border border-rc-border rounded-lg overflow-hidden">
                            <div className="px-3 py-1.5 border-b border-rc-border flex items-center justify-between">
                              <span className="text-[10px] font-mono text-rc-text-muted uppercase tracking-wider">{section.key}</span>
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(section.content, null, 2))}
                                className="text-rc-text-muted hover:text-rc-cyan transition-colors"
                              >
                                <IconCopy size={12} />
                              </button>
                            </div>
                            <pre className="p-3 text-xs font-mono text-rc-text-dim overflow-x-auto max-h-64 overflow-y-auto">
                              {JSON.stringify(section.content, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('identity')}
              disabled={includedCount === 0}
              className="w-full px-4 py-3 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-xl hover:bg-rc-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue with {includedCount} section{includedCount !== 1 ? 's' : ''} →
            </button>
          </div>
        )}

        {/* ─── Step 3: Identity ───────────────────────────── */}
        {step === 'identity' && (
          <div className="space-y-4">
            <p className="text-rc-text-dim text-sm mb-2">Choose how this build is attributed.</p>

            {/* Anonymous option */}
            <button
              onClick={() => { setIdentityMode('anon'); }}
              className={`w-full border rounded-xl p-4 text-left transition-all flex items-start gap-4 ${
                identityMode === 'anon'
                  ? 'bg-rc-cyan/10 border-rc-cyan/40'
                  : 'bg-rc-surface border-rc-border hover:border-rc-cyan/20'
              }`}
            >
              <IconSpy size={24} className={identityMode === 'anon' ? 'text-rc-cyan' : 'text-rc-text-muted'} />
              <div>
                <p className={`font-grotesk font-semibold text-sm ${identityMode === 'anon' ? 'text-rc-cyan' : 'text-rc-text'}`}>Anonymous</p>
                <p className="text-xs text-rc-text-dim mt-0.5">Publish with a throwaway key. No one can link it to your identity.</p>
              </div>
              {identityMode === 'anon' && <IconCheck size={18} className="text-rc-cyan ml-auto mt-1" />}
            </button>

            {/* Existing identity option */}
            <button
              onClick={() => {
                if (keys) setIdentityMode('existing')
                else setIdentityMode('generate')
              }}
              className={`w-full border rounded-xl p-4 text-left transition-all flex items-start gap-4 ${
                identityMode === 'existing' || identityMode === 'generate'
                  ? 'bg-rc-cyan/10 border-rc-cyan/40'
                  : 'bg-rc-surface border-rc-border hover:border-rc-cyan/20'
              }`}
            >
              <IconUserCircle size={24} className={identityMode !== 'anon' ? 'text-rc-cyan' : 'text-rc-text-muted'} />
              <div className="flex-1">
                <p className={`font-grotesk font-semibold text-sm ${identityMode !== 'anon' ? 'text-rc-cyan' : 'text-rc-text'}`}>With Identity</p>
                <p className="text-xs text-rc-text-dim mt-0.5">
                  {keys
                    ? `Publish as ${keys.npub.slice(0, 20)}...`
                    : 'Generate new keys or import existing ones.'
                  }
                </p>
              </div>
              {identityMode !== 'anon' && <IconCheck size={18} className="text-rc-cyan ml-auto mt-1" />}
            </button>

            {/* Key management (only when identity mode selected) */}
            {identityMode !== 'anon' && (
              <div className="bg-rc-surface border border-rc-border rounded-xl p-4 space-y-4">
                {keys ? (
                  <>
                    <div>
                      <label className="block text-rc-text-dim text-xs font-mono mb-1">Public Key (npub)</label>
                      <div className="flex gap-2">
                        <input type="text" value={keys.npub} readOnly className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-xs" />
                        <button onClick={() => copyToClipboard(keys.npub)} className="px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text-muted hover:text-rc-cyan transition-colors">
                          <IconCopy size={14} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-rc-text-dim text-xs font-mono mb-1">Private Key (nsec)</label>
                      <div className="flex gap-2">
                        <input type={revealNsec ? 'text' : 'password'} value={keys.nsec} readOnly className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-xs" />
                        <button onClick={() => setRevealNsec(!revealNsec)} className="px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text-muted hover:text-rc-cyan transition-colors">
                          {revealNsec ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-rc-text-muted">
                      Keys stored in localStorage. Use <a href="/settings" className="text-rc-cyan hover:underline">Settings</a> to manage.
                    </p>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={generateKeys}
                      className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                    >
                      <IconKey size={14} className="inline mr-1.5 -mt-0.5" />
                      Generate Keys
                    </button>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={importNsec}
                        onChange={(e) => setImportNsec(e.target.value)}
                        placeholder="nsec1..."
                        className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-xs focus:outline-none focus:border-rc-cyan"
                      />
                      <button
                        onClick={importKey}
                        disabled={!importNsec.trim()}
                        className="px-3 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-xs rounded-lg hover:border-rc-cyan/40 transition-colors disabled:opacity-40"
                      >
                        Import
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setStep('metadata')}
              disabled={identityMode !== 'anon' && !keys}
              className="w-full px-4 py-3 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-xl hover:bg-rc-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ─── Step 4: Metadata + Final Publish ───────────── */}
        {step === 'metadata' && (
          <div className="space-y-4">
            <div className="bg-rc-surface border border-rc-border rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1">Build Name</label>
                <input
                  type="text"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
                />
              </div>

              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag('') } } }}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
                  />
                  <button
                    onClick={() => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag('') } }}
                    className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-cyan/40 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-rc-magenta/15 border border-rc-magenta/30 rounded-lg">
                      <span className="text-xs font-mono text-rc-magenta">#{tag}</span>
                      <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-rc-magenta/60 hover:text-rc-magenta">
                        <IconX size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-rc-surface border border-rc-border rounded-xl p-4">
              <h3 className="font-grotesk font-semibold text-rc-text text-sm mb-3">Publish Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="text-rc-text-muted">Sections</div>
                <div className="text-rc-text">{includedCount} of {totalCount}</div>
                <div className="text-rc-text-muted">Identity</div>
                <div className="text-rc-text">
                  {identityMode === 'anon' ? 'Anonymous (throwaway key)' : keys?.npub.slice(0, 16) + '...'}
                </div>
                <div className="text-rc-text-muted">Relay</div>
                <div className="text-rc-text">{RELAYS[0]}</div>
                <div className="text-rc-text-muted">Event kind</div>
                <div className="text-rc-text">38333 (NIP-33)</div>
              </div>

              {hasWarnings && (
                <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-400">
                    <IconAlertTriangle size={12} className="inline mr-1 -mt-0.5" />
                    Some included sections contain PII. Go back to review and deselect if needed.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('review')}
                className="px-4 py-3 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-xl hover:border-rc-cyan/40 transition-colors"
              >
                ← Review
              </button>
              <button
                onClick={publish}
                disabled={!buildName.trim() || hasCritical}
                className="flex-1 px-4 py-3 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-xl hover:bg-rc-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {hasCritical ? 'Fix Security Issues First' : 'Publish to Nostr'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Publishing spinner ─────────────────────────── */}
        {step === 'publishing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-rc-cyan/20 border-t-rc-cyan rounded-full animate-spin mb-4" />
            <p className="text-rc-text-dim text-sm font-mono">Signing and publishing to relays...</p>
          </div>
        )}

        {/* ─── Success ────────────────────────────────────── */}
        {step === 'success' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
              <IconCheck size={32} className="text-green-400" />
            </div>
            <h2 className="font-grotesk font-bold text-rc-text text-xl mb-2">Published!</h2>
            <p className="text-rc-text-dim text-sm mb-6">Your build is live on Nostr.</p>
            {eventId && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rc-surface border border-rc-border rounded-lg mb-6">
                <span className="text-xs font-mono text-rc-text-muted">Event ID:</span>
                <span className="text-xs font-mono text-rc-text">{eventId.slice(0, 16)}...</span>
                <button onClick={() => copyToClipboard(eventId)} className="text-rc-text-muted hover:text-rc-cyan transition-colors">
                  <IconCopy size={12} />
                </button>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <a href="/feed" className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors">
                View on Feed
              </a>
              <button
                onClick={() => { setStep('upload'); setRawContent(null); setSections([]); setEventId(null) }}
                className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-cyan/40 transition-colors"
              >
                Publish Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
