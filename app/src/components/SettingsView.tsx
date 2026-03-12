import { useState } from 'react';
import { useNostrKeys, useNostrProfile, type NostrProfile } from '../hooks/useNostr';

export function SettingsView() {
  const { keys, generate, importKey, exportKeys, refresh } = useNostrKeys();
  const { profile, saving, saveProfile, setProfile } = useNostrProfile();

  const [nsecInput, setNsecInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showNsec, setShowNsec] = useState(false);
  const [revealedNsec, setRevealedNsec] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const handleImport = async () => {
    try {
      await importKey(nsecInput.trim());
      setNsecInput('');
      setImportError(null);
      setImportSuccess(true);
      setRevealedNsec(null);
      setShowNsec(false);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch {
      setImportError('Invalid nsec key');
    }
  };

  const handleReveal = async () => {
    if (showNsec) {
      setShowNsec(false);
      setRevealedNsec(null);
      return;
    }
    try {
      const stored = await exportKeys();
      setRevealedNsec(stored.nsec);
      setShowNsec(true);
    } catch {
      setImportError('Failed to export keys');
    }
  };

  const handleRegenerate = async () => {
    await generate();
    await refresh();
    setConfirmRegenerate(false);
    setRevealedNsec(null);
    setShowNsec(false);
  };

  const handleSaveProfile = async () => {
    setProfileError(null);
    try {
      await saveProfile(profile);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(String(err));
    }
  };

  const updateField = (field: keyof NostrProfile, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.03)',
    borderColor: 'var(--rc-border)',
    color: 'var(--rc-text)',
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-12">
      {/* Identity / Keys */}
      <section>
        <h3
          className="text-[10px] uppercase tracking-widest font-bold mb-4 pb-2 border-b"
          style={{ color: 'var(--rc-cyan)', borderColor: 'var(--rc-border)' }}
        >
          Identity
        </h3>

        {keys.has_keys ? (
          <div className="space-y-3">
            {/* Current npub */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--rc-text-muted)' }}>
                Public Key (npub)
              </label>
              <div
                className="px-3 py-2 rounded border text-xs font-mono select-all"
                style={{ ...inputStyle, cursor: 'text' }}
              >
                {keys.npub}
              </div>
            </div>

            {/* Reveal nsec */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--rc-text-muted)' }}>
                Secret Key (nsec)
              </label>
              {showNsec && revealedNsec ? (
                <div className="space-y-2">
                  <div
                    className="px-3 py-2 rounded border text-xs font-mono select-all break-all"
                    style={{ ...inputStyle, borderColor: 'var(--rc-red)' }}
                  >
                    {revealedNsec}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--rc-red)' }}>
                    ⚠ This is your secret identity. Store it safely. Never share it. Anyone with this key can publish as you.
                  </div>
                </div>
              ) : (
                <div className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                  Hidden for security.
                </div>
              )}
              <button
                onClick={handleReveal}
                className="mt-1 text-[10px] px-3 py-1 rounded border transition-all hover:opacity-80"
                style={{
                  borderColor: showNsec ? 'var(--rc-border)' : 'var(--rc-yellow)',
                  color: showNsec ? 'var(--rc-text-dim)' : 'var(--rc-yellow)',
                }}
              >
                {showNsec ? 'Hide' : 'Reveal Secret Key'}
              </button>
            </div>

            {/* Import different key */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--rc-text-muted)' }}>
                Replace Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={nsecInput}
                  onChange={(e) => { setNsecInput(e.target.value); setImportError(null); }}
                  placeholder="nsec1..."
                  className="flex-1 px-3 py-2 rounded text-xs border outline-none font-mono"
                  style={inputStyle}
                />
                <button
                  onClick={handleImport}
                  disabled={!nsecInput.trim()}
                  className="px-4 py-2 rounded text-xs font-semibold border transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ borderColor: 'var(--rc-cyan)', color: 'var(--rc-cyan)' }}
                >
                  Import
                </button>
              </div>
              {importError && <div className="text-[10px] mt-1" style={{ color: 'var(--rc-red)' }}>{importError}</div>}
              {importSuccess && <div className="text-[10px] mt-1" style={{ color: 'var(--rc-green)' }}>✓ Key imported</div>}
            </div>

            {/* Regenerate */}
            <div className="pt-2">
              {confirmRegenerate ? (
                <div
                  className="p-3 rounded border text-xs space-y-2"
                  style={{ borderColor: 'var(--rc-red)', background: 'rgba(255,50,50,0.05)' }}
                >
                  <div style={{ color: 'var(--rc-red)' }}>
                    This will create a new identity. Your old npub will no longer be linked to your loadouts.
                    {' '}Make sure you've backed up your current key if you want to keep it.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRegenerate(false)}
                      className="px-3 py-1 rounded text-[10px] border transition-all hover:opacity-80"
                      style={{ borderColor: 'var(--rc-border)', color: 'var(--rc-text-dim)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="px-3 py-1 rounded text-[10px] border transition-all hover:opacity-80"
                      style={{ borderColor: 'var(--rc-red)', color: 'var(--rc-red)' }}
                    >
                      Yes, Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRegenerate(true)}
                  className="text-[10px] px-3 py-1 rounded border transition-all hover:opacity-80"
                  style={{ borderColor: 'var(--rc-border)', color: 'var(--rc-text-muted)' }}
                >
                  Regenerate Key
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs" style={{ color: 'var(--rc-text-muted)' }}>
              No identity yet. Generate one or import an existing Nostr key.
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => { await generate(); await refresh(); }}
                className="px-4 py-2 rounded text-xs font-semibold border transition-all hover:opacity-80"
                style={{ borderColor: 'var(--rc-cyan)', color: 'var(--rc-cyan)', background: 'rgba(0,240,255,0.1)' }}
              >
                Generate New Identity
              </button>
            </div>
            <div>
              <div className="flex gap-2 mt-2">
                <input
                  type="password"
                  value={nsecInput}
                  onChange={(e) => { setNsecInput(e.target.value); setImportError(null); }}
                  placeholder="Or import: nsec1..."
                  className="flex-1 px-3 py-2 rounded text-xs border outline-none font-mono"
                  style={inputStyle}
                />
                <button
                  onClick={handleImport}
                  disabled={!nsecInput.trim()}
                  className="px-4 py-2 rounded text-xs font-semibold border transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ borderColor: 'var(--rc-cyan)', color: 'var(--rc-cyan)' }}
                >
                  Import
                </button>
              </div>
              {importError && <div className="text-[10px] mt-1" style={{ color: 'var(--rc-red)' }}>{importError}</div>}
            </div>
          </div>
        )}
      </section>

      {/* Profile */}
      {keys.has_keys && (
        <section>
          <h3
            className="text-[10px] uppercase tracking-widest font-bold mb-4 pb-2 border-b"
            style={{ color: 'var(--rc-cyan)', borderColor: 'var(--rc-border)' }}
          >
            Profile
          </h3>
          <div className="text-[10px] mb-4" style={{ color: 'var(--rc-text-muted)' }}>
            Optional. This is your public Nostr profile (kind 0 metadata). Other Nostr clients and
            the Ripperclaw feed will show this info alongside your loadouts.
          </div>

          <div className="space-y-3">
            {([
              ['display_name', 'Display Name', 'How you want to be known'],
              ['name', 'Username', 'Short handle (e.g. bolander72)'],
              ['about', 'Bio', 'A few words about you or your agents'],
              ['picture', 'Avatar URL', 'https://example.com/avatar.png'],
              ['banner', 'Banner URL', 'https://example.com/banner.png'],
              ['website', 'Website', 'https://yoursite.com'],
              ['nip05', 'NIP-05 Verification', 'you@yourdomain.com'],
            ] as [keyof NostrProfile, string, string][]).map(([field, label, placeholder]) => (
              <div key={field}>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--rc-text-muted)' }}>
                  {label}
                  {field === 'nip05' && (
                    <span className="normal-case tracking-normal ml-1" style={{ color: 'var(--rc-text-muted)' }}>
                      — proves you own a domain
                    </span>
                  )}
                </label>
                {field === 'about' ? (
                  <textarea
                    value={profile[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full px-3 py-2 rounded text-xs border outline-none resize-none"
                    style={inputStyle}
                  />
                ) : (
                  <input
                    type="text"
                    value={profile[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded text-xs border outline-none"
                    style={inputStyle}
                  />
                )}
              </div>
            ))}

            {profileError && (
              <div className="text-[10px] p-2 rounded" style={{ color: 'var(--rc-red)', background: 'rgba(255,50,50,0.05)' }}>
                {profileError}
              </div>
            )}
            {profileSaved && (
              <div className="text-[10px]" style={{ color: 'var(--rc-green)' }}>
                ✓ Profile saved and published to relays
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: 'var(--rc-cyan)',
                color: 'var(--rc-cyan)',
                background: 'rgba(0,240,255,0.1)',
              }}
            >
              {saving ? 'Publishing...' : 'Save & Publish Profile'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
