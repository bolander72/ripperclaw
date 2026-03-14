import { useState, useEffect } from 'react'
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools'
import { IconCopy, IconEye, IconEyeOff, IconPlus, IconX, IconCheck } from '@tabler/icons-react'
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

  useEffect(() => {
    // Load from localStorage
    const storedKeys = localStorage.getItem('clawclawgo:keys')
    if (storedKeys) {
      setKeys(JSON.parse(storedKeys))
    }
    const storedProfile = localStorage.getItem('clawclawgo:profile')
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile))
    }
    const storedRelays = localStorage.getItem('clawclawgo:relays')
    if (storedRelays) {
      setRelays(JSON.parse(storedRelays))
    } else {
      setRelays(RELAYS)
    }
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
      if (type !== 'nsec') {
        alert('Invalid nsec key')
        return
      }
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const saveProfile = () => {
    localStorage.setItem('clawclawgo:profile', JSON.stringify(profile))
    // TODO: publish kind 0 event to relays
    alert('Profile saved locally. Publishing to relays not yet implemented.')
  }

  const addRelay = () => {
    if (!newRelay.startsWith('wss://')) {
      alert('Relay URL must start with wss://')
      return
    }
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

  return (
    <div className="min-h-screen bg-rc-bg py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Identity */}
        <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
          <h2 className="font-grotesk font-bold text-rc-text text-xl mb-4">Identity</h2>
          
          {!keys ? (
            <div className="space-y-4">
              <p className="text-rc-text-dim text-sm">No Nostr identity found. Generate or import one to publish builds.</p>
              <div className="flex gap-3">
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
                  <button
                    onClick={importKey}
                    className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                  >
                    Import
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* npub */}
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1">Public Key (npub)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keys.npub}
                    readOnly
                    className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(keys.npub, 'npub')}
                    className="px-3 py-2 bg-rc-surface border border-rc-border rounded-lg text-rc-text hover:border-rc-cyan/40 transition-colors"
                  >
                    {copied === 'npub' ? <IconCheck size={16} className="text-rc-cyan" /> : <IconCopy size={16} />}
                  </button>
                </div>
              </div>

              {/* nsec */}
              <div>
                <label className="block text-rc-text-dim text-xs font-mono mb-1">Private Key (nsec)</label>
                <div className="flex gap-2">
                  <input
                    type={revealNsec ? 'text' : 'password'}
                    value={keys.nsec}
                    readOnly
                    className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-sm"
                  />
                  <button
                    onClick={() => setRevealNsec(!revealNsec)}
                    className="px-3 py-2 bg-rc-surface border border-rc-border rounded-lg text-rc-text hover:border-rc-cyan/40 transition-colors"
                  >
                    {revealNsec ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                  {revealNsec && (
                    <button
                      onClick={() => copyToClipboard(keys.nsec, 'nsec')}
                      className="px-3 py-2 bg-rc-surface border border-rc-border rounded-lg text-rc-text hover:border-rc-cyan/40 transition-colors"
                    >
                      {copied === 'nsec' ? <IconCheck size={16} className="text-rc-cyan" /> : <IconCopy size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowImport(!showImport)}
                className="text-rc-cyan text-xs font-mono hover:underline"
              >
                {showImport ? 'Cancel' : 'Import different key'}
              </button>
              {showImport && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={importNsec}
                    onChange={(e) => setImportNsec(e.target.value)}
                    placeholder="nsec1..."
                    className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-sm focus:outline-none focus:border-rc-cyan"
                  />
                  <button
                    onClick={importKey}
                    className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
                  >
                    Replace
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Profile Metadata */}
        <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
          <h2 className="font-grotesk font-bold text-rc-text text-xl mb-4">Profile Metadata</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-rc-text-dim text-xs font-mono mb-1">Display Name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your Name"
                className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
              />
            </div>
            <div>
              <label className="block text-rc-text-dim text-xs font-mono mb-1">Username</label>
              <input
                type="text"
                value={profile.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="username"
                className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
              />
            </div>
            <div>
              <label className="block text-rc-text-dim text-xs font-mono mb-1">Bio</label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="About you"
                rows={2}
                className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
              />
            </div>
            <div>
              <label className="block text-rc-text-dim text-xs font-mono mb-1">Avatar URL</label>
              <input
                type="text"
                value={profile.avatar || ''}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
              />
            </div>
            <div>
              <label className="block text-rc-text-dim text-xs font-mono mb-1">Website</label>
              <input
                type="text"
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
              />
            </div>
            <div>
              <label className="block text-rc-text-dim text-xs font-mono mb-1">NIP-05</label>
              <input
                type="text"
                value={profile.nip05 || ''}
                onChange={(e) => setProfile({ ...profile, nip05: e.target.value })}
                placeholder="you@yourdomain.com"
                className="w-full px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text text-sm focus:outline-none focus:border-rc-cyan"
              />
            </div>
            <button
              onClick={saveProfile}
              className="px-4 py-2 bg-rc-cyan text-rc-bg font-mono text-sm font-bold rounded-lg hover:bg-rc-cyan/90 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </section>

        {/* Relay Management */}
        <section className="bg-rc-surface border border-rc-border rounded-2xl p-6">
          <h2 className="font-grotesk font-bold text-rc-text text-xl mb-4">Relay Management</h2>
          <div className="space-y-3">
            {relays.map((relay, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={relay}
                  readOnly
                  className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-sm"
                />
                <button
                  onClick={() => removeRelay(relay)}
                  className="px-3 py-2 bg-rc-surface border border-rc-border rounded-lg text-rc-text hover:border-red-400 hover:text-red-400 transition-colors"
                >
                  <IconX size={16} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newRelay}
                onChange={(e) => setNewRelay(e.target.value)}
                placeholder="wss://relay.example.com"
                className="flex-1 px-3 py-2 bg-rc-bg border border-rc-border rounded-lg text-rc-text font-mono text-sm focus:outline-none focus:border-rc-cyan"
              />
              <button
                onClick={addRelay}
                className="px-3 py-2 bg-rc-cyan text-rc-bg rounded-lg hover:bg-rc-cyan/90 transition-colors"
              >
                <IconPlus size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
