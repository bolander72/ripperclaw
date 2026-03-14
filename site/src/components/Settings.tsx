import { useState, useEffect } from 'react'
import { generateSecretKey, getPublicKey, nip19, finalizeEvent, Relay } from 'nostr-tools'
import { IconCopy, IconEye, IconEyeOff, IconPlus, IconX, IconCheck, IconKey, IconTrash } from '@tabler/icons-react'
import { RELAYS } from '../lib/utils'

interface NostrKeys {
  nsec: string
  npub: string
}

interface Profile {
  name?: string
  username?: string
  bio?: string
  avatar?: string
  website?: string
  nip05?: string
}

export default function Settings() {
  const [keys, setKeys] = useState<NostrKeys | null>(null)
  const [revealNsec, setRevealNsec] = useState(false)
  const [profile, setProfile] = useState<Profile>({})
  const [relays, setRelays] = useState<string[]>([])
  const [newRelay, setNewRelay] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [importNsec, setImportNsec] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profilePublishing, setProfilePublishing] = useState(false)

  useEffect(() => {
    const storedKeys = localStorage.getItem('clawclawgo:keys')
    if (storedKeys) setKeys(JSON.parse(storedKeys))
    const storedProfile = localStorage.getItem('clawclawgo:profile')
    if (storedProfile) setProfile(JSON.parse(storedProfile))
    const storedRelays = localStorage.getItem('clawclawgo:relays')
    if (storedRelays) setRelays(JSON.parse(storedRelays))
    else setRelays(RELAYS)
  }, [])

  const generateKeys = () => {
    const sk = generateSecretKey()
    const pk = getPublicKey(sk)
    const nsec = nip19.nsecEncode(sk)
    const npub = nip19.npubEncode(pk)
    const newKeys = { nsec, npub }
    setKeys(newKeys)
    localStorage.setItem('clawclawgo:keys', JSON.stringify(newKeys))
  }

  const importKey = () => {
    try {
      const { type, data } = nip19.decode(importNsec.trim())
      if (type !== 'nsec') { alert('Invalid nsec key'); return }
      const pk = getPublicKey(data as Uint8Array)
      const npub = nip19.npubEncode(pk)
      const newKeys = { nsec: importNsec.trim(), npub }
      setKeys(newKeys)
      localStorage.setItem('clawclawgo:keys', JSON.stringify(newKeys))
      setImportNsec('')
      setShowImport(false)
    } catch (err) {
      alert('Failed to import key: ' + (err as Error).message)
    }
  }

  const deleteKeys = () => {
    if (confirm('Delete your Nostr keys? This cannot be undone unless you have a backup.')) {
      setKeys(null)
      localStorage.removeItem('clawclawgo:keys')
      setRevealNsec(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const saveProfile = async () => {
    localStorage.setItem('clawclawgo:profile', JSON.stringify(profile))
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)

    // Publish kind 0 event if keys available
    if (keys) {
      setProfilePublishing(true)
      try {
        const { type, data } = nip19.decode(keys.nsec)
        if (type !== 'nsec') throw new Error('Invalid nsec')

        const metadata: Record<string, string> = {}
        if (profile.name) metadata.name = profile.name
        if (profile.username) metadata.display_name = profile.username
        if (profile.bio) metadata.about = profile.bio
        if (profile.avatar) metadata.picture = profile.avatar
        if (profile.website) metadata.website = profile.website
        if (profile.nip05) metadata.nip05 = profile.nip05

        const event = {
          kind: 0,
          created_at: Math.floor(Date.now() / 1000),
          tags: [],
          content: JSON.stringify(metadata),
        }

        const signedEvent = finalizeEvent(event, data as Uint8Array)

        for (const url of relays) {
          try {
            const relay = await Relay.connect(url)
            await relay.publish(signedEvent)
            relay.close()
          } catch (err) {
            console.error(`Failed to publish profile to ${url}:`, err)
          }
        }
      } catch (err) {
        console.error('Failed to publish profile:', err)
      }
      setProfilePublishing(false)
    }
  }

  const addRelay = () => {
    if (!newRelay.startsWith('wss://')) { alert('Relay URL must start with wss://'); return }
    if (relays.includes(newRelay)) { setNewRelay(''); return }
    const updated = [...relays, newRelay]
    setRelays(updated)
    localStorage.setItem('clawclawgo:relays', JSON.stringify(updated))
    setNewRelay('')
  }

  const removeRelay = (relay: string) => {
    const updated = relays.filter(r => r !== relay)
    setRelays(updated)
    localStorage.setItem('clawclawgo:relays', JSON.stringify(updated))
  }

  const inputClasses = "w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan transition-colors"

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-grotesk font-bold text-2xl md:text-3xl text-rc-text mb-2">Settings</h1>
          <p className="text-rc-text-dim text-sm">Manage your Nostr identity, profile, and relay connections.</p>
        </div>

        <div className="space-y-6">
          {/* ─── Identity ──────────────────────────────────── */}
          <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconKey size={18} className="text-rc-cyan" />
              <h2 className="font-grotesk font-bold text-rc-text text-lg">Identity</h2>
            </div>

            {!keys ? (
              <div className="space-y-4">
                <p className="text-rc-text-dim text-sm">No Nostr identity configured. Generate or import keys to publish builds under your identity.</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={generateKeys}
                    className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                  >
                    Generate New Keys
                  </button>
                  <button
                    onClick={() => setShowImport(!showImport)}
                    className="px-4 py-2 bg-rc-surface border border-rc-border text-rc-text font-mono text-sm rounded-lg hover:border-rc-cyan/40 transition-colors"
                  >
                    Import Existing
                  </button>
                </div>
                {showImport && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={importNsec}
                      onChange={(e) => setImportNsec(e.target.value)}
                      placeholder="nsec1..."
                      className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-sm focus:outline-none focus:border-rc-cyan"
                    />
                    <button onClick={importKey} className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors">
                      Import
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Public Key (npub)</label>
                  <div className="flex gap-2">
                    <input type="text" value={keys.npub} readOnly className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-xs" />
                    <button
                      onClick={() => copyToClipboard(keys.npub, 'npub')}
                      className="px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text-muted hover:text-rc-cyan hover:border-rc-cyan/40 transition-colors"
                    >
                      {copied === 'npub' ? <IconCheck size={14} className="text-rc-cyan" /> : <IconCopy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Private Key (nsec)</label>
                  <div className="flex gap-2">
                    <input type={revealNsec ? 'text' : 'password'} value={keys.nsec} readOnly className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-xs" />
                    <button
                      onClick={() => setRevealNsec(!revealNsec)}
                      className="px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text-muted hover:text-rc-cyan hover:border-rc-cyan/40 transition-colors"
                    >
                      {revealNsec ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                    {revealNsec && (
                      <button
                        onClick={() => copyToClipboard(keys.nsec, 'nsec')}
                        className="px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text-muted hover:text-rc-cyan hover:border-rc-cyan/40 transition-colors"
                      >
                        {copied === 'nsec' ? <IconCheck size={14} className="text-rc-cyan" /> : <IconCopy size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowImport(!showImport)}
                    className="text-rc-cyan text-xs font-mono hover:underline"
                  >
                    {showImport ? 'Cancel' : 'Import different key'}
                  </button>
                  <button
                    onClick={deleteKeys}
                    className="text-red-400/60 text-xs font-mono hover:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <IconTrash size={11} /> Delete keys
                  </button>
                </div>

                {showImport && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={importNsec}
                      onChange={(e) => setImportNsec(e.target.value)}
                      placeholder="nsec1..."
                      className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-sm focus:outline-none focus:border-rc-cyan"
                    />
                    <button onClick={importKey} className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors">
                      Replace
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ─── Profile Metadata ──────────────────────────── */}
          <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
            <h2 className="font-grotesk font-bold text-rc-text text-lg mb-4">Profile Metadata</h2>
            <p className="text-rc-text-dim text-xs mb-4">
              {keys ? 'Saved locally and published as a Nostr kind 0 event.' : 'Saved locally. Connect a Nostr identity to publish to relays.'}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Display Name</label>
                <input type="text" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your Name" className={inputClasses} />
              </div>
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Username</label>
                <input type="text" value={profile.username || ''} onChange={(e) => setProfile({ ...profile, username: e.target.value })} placeholder="username" className={inputClasses} />
              </div>
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Bio</label>
                <textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="About you" rows={2} className={inputClasses + ' resize-y'} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Avatar URL</label>
                  <input type="text" value={profile.avatar || ''} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} placeholder="https://..." className={inputClasses} />
                </div>
                <div>
                  <label className="block text-rc-text-dim text-xs font-mono mb-1.5">Website</label>
                  <input type="text" value={profile.website || ''} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://..." className={inputClasses} />
                </div>
              </div>
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1.5">NIP-05</label>
                <input type="text" value={profile.nip05 || ''} onChange={(e) => setProfile({ ...profile, nip05: e.target.value })} placeholder="you@yourdomain.com" className={inputClasses} />
              </div>
              <button
                onClick={saveProfile}
                disabled={profilePublishing}
                className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {profilePublishing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-rc-bg/30 border-t-rc-bg rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : profileSaved ? (
                  <>
                    <IconCheck size={14} />
                    Saved{keys ? ' & Published' : ''}
                  </>
                ) : (
                  `Save${keys ? ' & Publish' : ''}`
                )}
              </button>
            </div>
          </section>

          {/* ─── Relay Management ──────────────────────────── */}
          <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
            <h2 className="font-grotesk font-bold text-rc-text text-lg mb-4">Relays</h2>
            <p className="text-rc-text-dim text-xs mb-4">Nostr relays used for publishing and reading builds.</p>
            <div className="space-y-2">
              {relays.map((relay, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-xs">
                    {relay}
                  </div>
                  <button
                    onClick={() => removeRelay(relay)}
                    className="px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text-muted hover:border-red-400/40 hover:text-red-400 transition-colors"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newRelay}
                  onChange={(e) => setNewRelay(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRelay()}
                  placeholder="wss://relay.example.com"
                  className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-sm focus:outline-none focus:border-rc-cyan"
                />
                <button
                  onClick={addRelay}
                  className="px-3 py-2 bg-rc-cyan text-rc-bg rounded-lg hover:bg-rc-cyan/90 transition-colors"
                >
                  <IconPlus size={14} />
                </button>
              </div>
            </div>
          </section>

          {/* ─── Danger Zone ───────────────────────────────── */}
          <section className="bg-rc-surface border border-red-500/20 rounded-2xl p-6">
            <h2 className="font-grotesk font-bold text-red-400 text-lg mb-4">Danger Zone</h2>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-rc-text text-sm font-semibold">Clear all local data</p>
                <p className="text-rc-text-dim text-xs">Remove all ClawClawGo data from localStorage (keys, profile, relays).</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('This will delete your keys, profile, and relay settings. Are you sure?')) {
                    localStorage.removeItem('clawclawgo:keys')
                    localStorage.removeItem('clawclawgo:profile')
                    localStorage.removeItem('clawclawgo:relays')
                    setKeys(null)
                    setProfile({})
                    setRelays(RELAYS)
                    setRevealNsec(false)
                  }
                }}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs rounded-lg hover:bg-red-500/20 transition-colors shrink-0"
              >
                Clear Data
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
