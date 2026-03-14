import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX, IconUpload, IconHash, IconEye, IconCheck, IconAlertTriangle } from '@tabler/icons-react'
import { generateSecretKey, getPublicKey, nip19, finalizeEvent, Relay } from 'nostr-tools'
import { scanBuild } from '../lib/utils'
import type { BuildContent } from '../types'

interface PublishModalProps {
  onClose: () => void
}

export default function PublishModal({ onClose }: PublishModalProps) {
  const [step, setStep] = useState<'identity' | 'upload' | 'metadata' | 'preview' | 'publishing' | 'success'>('identity')
  const [keys, setKeys] = useState<{ nsec: string; npub: string } | null>(null)
  const [buildContent, setBuildContent] = useState<BuildContent | null>(null)
  const [buildName, setBuildName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [eventId, setEventId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for existing keys
  useState(() => {
    const stored = localStorage.getItem('clawclawgo:keys')
    if (stored) {
      setKeys(JSON.parse(stored))
      setStep('upload')
    }
  })

  const generateKeys = () => {
    const sk = generateSecretKey()
    const pk = getPublicKey(sk)
    const nsec = nip19.nsecEncode(sk)
    const npub = nip19.npubEncode(pk)
    const newKeys = { nsec, npub }
    setKeys(newKeys)
    localStorage.setItem('clawclawgo:keys', JSON.stringify(newKeys))
    setStep('upload')
  }

  const importKey = (nsec: string) => {
    try {
      const { type, data } = nip19.decode(nsec.trim())
      if (type !== 'nsec') {
        setError('Invalid nsec key')
        return
      }
      const pk = getPublicKey(data as Uint8Array)
      const npub = nip19.npubEncode(pk)
      const newKeys = { nsec: nsec.trim(), npub }
      setKeys(newKeys)
      localStorage.setItem('clawclawgo:keys', JSON.stringify(newKeys))
      setStep('upload')
    } catch (err) {
      setError('Failed to import key: ' + (err as Error).message)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const content = JSON.parse(ev.target?.result as string)
        setBuildContent(content)
        setBuildName(content.meta?.name || content.meta?.agentName || 'Unnamed Build')
        setStep('metadata')
      } catch (err) {
        setError('Failed to parse JSON: ' + (err as Error).message)
      }
    }
    reader.readAsText(file)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const content = JSON.parse(text)
      setBuildContent(content)
      setBuildName(content.meta?.name || content.meta?.agentName || 'Unnamed Build')
      setStep('metadata')
    } catch (err) {
      setError('Failed to parse clipboard content: ' + (err as Error).message)
    }
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const publish = async () => {
    if (!keys || !buildContent) return
    setStep('publishing')
    setError(null)

    try {
      const { type, data } = nip19.decode(keys.nsec)
      if (type !== 'nsec') throw new Error('Invalid nsec')
      
      const event = {
        kind: 38333,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['d', buildName],
          ...tags.map(t => ['t', t]),
          ['clawclawgo', '0.3.0'],
        ],
        content: JSON.stringify(buildContent),
      }

      const signedEvent = finalizeEvent(event, data as Uint8Array)

      // Publish to relays
      const storedRelays = localStorage.getItem('clawclawgo:relays')
      const relayUrls = storedRelays ? JSON.parse(storedRelays) : ['wss://relay.clawclawgo.com']

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

      if (!published) {
        throw new Error('Failed to publish to any relay')
      }

      setEventId(signedEvent.id)
      setStep('success')
    } catch (err) {
      setError('Publishing failed: ' + (err as Error).message)
      setStep('preview')
    }
  }

  const scanResult = buildContent ? scanBuild(buildContent) : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-rc-surface border border-rc-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-rc-surface border-b border-rc-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-grotesk font-bold text-rc-text text-xl">Publish Build</h2>
          <button onClick={onClose} className="text-rc-text-muted hover:text-rc-text transition-colors">
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 'identity' && (
            <div className="space-y-4">
              <p className="text-rc-text-dim text-sm">You need a Nostr identity to publish builds.</p>
              <div className="flex gap-3">
                <button
                  onClick={generateKeys}
                  className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                >
                  Generate New Keys
                </button>
                <button
                  onClick={() => {
                    const nsec = prompt('Enter your nsec:')
                    if (nsec) importKey(nsec)
                  }}
                  className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-cyan/40 transition-colors"
                >
                  Import Existing
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-rc-text-dim text-sm">Upload or paste your build JSON.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-8 bg-rc-bg border-2 border-dashed border-rc-border rounded-lg text-rc-text-dim hover:border-rc-cyan/40 hover:text-rc-cyan transition-all flex flex-col items-center gap-2"
                >
                  <IconUpload size={24} />
                  <span className="font-mono text-sm">Upload JSON</span>
                </button>
                <button
                  onClick={handlePaste}
                  className="flex-1 px-4 py-8 bg-rc-bg border-2 border-dashed border-rc-border rounded-lg text-rc-text-dim hover:border-rc-cyan/40 hover:text-rc-cyan transition-all flex flex-col items-center gap-2"
                >
                  <IconHash size={24} />
                  <span className="font-mono text-sm">Paste from Clipboard</span>
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
          )}

          {/* Step 3: Metadata */}
          {step === 'metadata' && (
            <div className="space-y-4">
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1">Build Name (d tag)</label>
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
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-rc-magenta/15 border border-rc-magenta/30 rounded-lg">
                      <span className="text-xs font-mono text-rc-magenta">#{tag}</span>
                      <button onClick={() => removeTag(tag)} className="text-rc-magenta hover:text-rc-magenta/70">
                        <IconX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep('preview')}
                className="w-full px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
              >
                Preview & Publish
              </button>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 'preview' && buildContent && scanResult && (
            <div className="space-y-4">
              <div className="bg-rc-bg border border-rc-border rounded-lg p-4">
                <h3 className="font-grotesk font-bold text-rc-text mb-2">Security Scan</h3>
                <div className="flex items-center gap-2 mb-2">
                  {scanResult.score === 'PASS' && (
                    <div className="flex items-center gap-1.5 text-green-400">
                      <IconCheck size={16} />
                      <span className="text-sm font-mono font-bold">PASS</span>
                    </div>
                  )}
                  {scanResult.score === 'WARN' && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <IconAlertTriangle size={16} />
                      <span className="text-sm font-mono font-bold">WARN - Contains PII</span>
                    </div>
                  )}
                  {scanResult.score === 'FAIL' && (
                    <div className="flex items-center gap-1.5 text-red-400">
                      <IconAlertTriangle size={16} />
                      <span className="text-sm font-mono font-bold">FAIL - Security Issues</span>
                    </div>
                  )}
                </div>
                {scanResult.findings.pii.length > 0 && (
                  <div className="text-xs text-rc-text-dim">
                    <span className="font-bold">PII found:</span> {scanResult.findings.pii.map(f => f.name).join(', ')}
                  </div>
                )}
                {scanResult.findings.suspicious.length > 0 && (
                  <div className="text-xs text-red-400">
                    <span className="font-bold">Suspicious patterns:</span> {scanResult.findings.suspicious.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              <div className="bg-rc-bg border border-rc-border rounded-lg p-4">
                <h3 className="font-grotesk font-bold text-rc-text mb-2">What will be published</h3>
                <div className="text-xs font-mono text-rc-text-dim space-y-1">
                  <div><span className="text-rc-text">Name:</span> {buildName}</div>
                  <div><span className="text-rc-text">Tags:</span> {tags.join(', ') || 'none'}</div>
                  <div><span className="text-rc-text">Event kind:</span> 38333 (NIP-33)</div>
                  <div><span className="text-rc-text">Your npub:</span> {keys?.npub.slice(0, 20)}...</div>
                </div>
              </div>

              <button
                onClick={publish}
                disabled={scanResult.score === 'FAIL'}
                className="w-full px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanResult.score === 'FAIL' ? 'Cannot Publish - Fix Security Issues' : 'Publish to Relays'}
              </button>
            </div>
          )}

          {/* Step 5: Publishing */}
          {step === 'publishing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-2 border-rc-cyan/20 border-t-rc-cyan rounded-full animate-spin mb-4" />
              <p className="text-rc-text-dim text-sm font-mono">Publishing to relays...</p>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                <IconCheck size={32} className="text-green-400" />
              </div>
              <h3 className="font-grotesk font-bold text-rc-text text-lg mb-2">Published!</h3>
              <p className="text-rc-text-dim text-sm mb-4">Your build is now on Nostr.</p>
              {eventId && (
                <p className="text-xs font-mono text-rc-text-muted break-all">Event ID: {eventId}</p>
              )}
              <button
                onClick={onClose}
                className="mt-6 px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
