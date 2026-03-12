import { useState } from 'react';
import { useNostrKeys, useNostrPublish, useSafeExport, type ScrubReport } from '../hooks/useNostr';

const TEMPLATES = [
  { id: 'homelab', label: 'Homelab', color: 'var(--rc-cyan)', desc: 'Self-hosted, privacy-first' },
  { id: 'ops', label: 'Ops', color: 'var(--rc-yellow)', desc: 'Lean productivity' },
  { id: 'researcher', label: 'Researcher', color: 'var(--rc-magenta)', desc: 'Deep analysis' },
  { id: 'smart-home', label: 'Smart Home', color: 'var(--rc-green)', desc: 'Automation-focused' },
  { id: 'creator', label: 'Creator', color: 'var(--rc-red)', desc: 'Content & social' },
];

type Step = 'identity' | 'configure' | 'review' | 'publishing' | 'done';

export function PublishDialog({ onClose }: { onClose: () => void }) {
  const [rigName, setRigName] = useState('');
  const [template, setTemplate] = useState('ops');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [scrubReport, setScrubReport] = useState<ScrubReport | null>(null);
  const [scrubbedJson, setScrubbedJson] = useState<string>('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{ event_id: string; relays_sent: number } | null>(null);
  const [nsecInput, setNsecInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const { keys, generate, importKey, refresh } = useNostrKeys();
  const { publish, publishing } = useNostrPublish();
  const { exportSafe, exporting } = useSafeExport();

  // Start on identity step if no keys, otherwise skip to configure
  const [step, setStep] = useState<Step>(keys.has_keys ? 'configure' : 'identity');

  const tags = tagInput
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);

  const handleReview = async () => {
    try {
      const [loadout, report] = await exportSafe(template, description, [...tags, template]);
      setScrubbedJson(JSON.stringify(loadout, null, 2));
      setScrubReport(report);
      setStep('review');
    } catch (err) {
      setPublishError(String(err));
    }
  };

  const handlePublish = async () => {
    if (!keys.has_keys) {
      await generate();
    }
    setStep('publishing');
    setPublishError(null);
    try {
      const result = await publish(scrubbedJson, rigName || 'My Loadout', [...tags, template]);
      setPublishResult(result);
      setStep('done');
    } catch (err) {
      setPublishError(String(err));
      setStep('review');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-[560px] max-h-[80vh] overflow-y-auto rounded-lg border p-6"
        style={{
          background: 'var(--rc-bg)',
          borderColor: 'var(--rc-cyan)',
          boxShadow: '0 0 30px var(--rc-cyan-dim)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--rc-text)' }}>
            {step === 'identity' && 'Your Identity'}
            {step === 'configure' && 'Publish Loadout'}
            {step === 'review' && 'Review & Confirm'}
            {step === 'publishing' && 'Publishing...'}
            {step === 'done' && 'Published!'}
          </h2>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded border transition-all hover:opacity-80"
            style={{ borderColor: 'var(--rc-border)', color: 'var(--rc-text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Step: Identity (first-time only) */}
        {step === 'identity' && (
          <div className="space-y-4">
            <div
              className="p-4 rounded border text-xs leading-relaxed"
              style={{
                borderColor: 'var(--rc-cyan)',
                background: 'rgba(0,240,255,0.03)',
                color: 'var(--rc-text-dim)',
              }}
            >
              <p className="mb-3">
                Your loadout will be signed with a <strong style={{ color: 'var(--rc-text)' }}>Nostr keypair</strong> so others
                can verify it's yours. This is your publishing identity — it stays with your loadouts.
              </p>
              <p style={{ color: 'var(--rc-text-muted)' }}>
                You can update your identity anytime in <strong>Settings</strong>.
              </p>
            </div>

            {/* Generated key preview */}
            {keys.has_keys ? (
              <div
                className="p-3 rounded border text-xs font-mono"
                style={{
                  borderColor: 'var(--rc-green)',
                  background: 'rgba(0,255,100,0.03)',
                  color: 'var(--rc-green)',
                }}
              >
                ✓ {keys.npub_short}
              </div>
            ) : (
              <div
                className="p-3 rounded border text-xs"
                style={{
                  borderColor: 'var(--rc-border)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'var(--rc-text-muted)',
                }}
              >
                A fresh identity will be created for you. Or import an existing one below.
              </div>
            )}

            {/* Import existing key */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: 'var(--rc-text-muted)' }}>
                Already on Nostr? Import your key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={nsecInput}
                  onChange={(e) => { setNsecInput(e.target.value); setImportError(null); }}
                  placeholder="nsec1..."
                  className="flex-1 px-3 py-2 rounded text-xs border outline-none font-mono"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'var(--rc-border)',
                    color: 'var(--rc-text)',
                  }}
                />
                <button
                  onClick={async () => {
                    try {
                      await importKey(nsecInput.trim());
                      setNsecInput('');
                      setImportError(null);
                    } catch {
                      setImportError('Invalid nsec key');
                    }
                  }}
                  disabled={!nsecInput.trim()}
                  className="px-4 py-2 rounded text-xs font-semibold border transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ borderColor: 'var(--rc-cyan)', color: 'var(--rc-cyan)' }}
                >
                  Import
                </button>
              </div>
              {importError && (
                <div className="text-[10px] mt-1" style={{ color: 'var(--rc-red)' }}>{importError}</div>
              )}
            </div>

            {/* Or stay anon */}
            <div className="text-[10px] text-center" style={{ color: 'var(--rc-text-muted)' }}>
              No Nostr account? No problem — publish anonymously with a generated key.
              <br />Add a display name, avatar, and NIP-05 verification later in Settings.
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                style={{ borderColor: 'var(--rc-border)', color: 'var(--rc-text-dim)' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!keys.has_keys) {
                    await generate();
                    await refresh();
                  }
                  setStep('configure');
                }}
                className="flex-1 py-2.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                style={{
                  borderColor: 'var(--rc-cyan)',
                  color: 'var(--rc-bg)',
                  background: 'var(--rc-cyan)',
                }}
              >
                {keys.has_keys ? 'Continue →' : 'Generate & Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Configure */}
        {step === 'configure' && (
          <div className="space-y-4">
            {/* PII warning */}
            <div
              className="p-3 rounded border text-xs"
              style={{
                borderColor: 'var(--rc-magenta)',
                background: 'rgba(255,0,170,0.05)',
                color: 'var(--rc-text-dim)',
              }}
            >
              <span style={{ color: 'var(--rc-magenta)' }}>⚠ Privacy:</span> Your loadout will be scrubbed of phone numbers, emails, IP addresses, API keys, file paths, and other PII before publishing. You'll review the scrubbed version before it goes live.
            </div>

            {/* Rig name */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--rc-text-muted)' }}>
                Rig Name
              </label>
              <input
                type="text"
                value={rigName}
                onChange={(e) => setRigName(e.target.value)}
                placeholder="e.g. Nighthawk, Mercury, Athena..."
                className="w-full px-3 py-2 rounded text-xs border outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text)',
                }}
              />
            </div>

            {/* Template */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: 'var(--rc-text-muted)' }}>
                Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className="p-2 rounded border text-left transition-all"
                    style={{
                      borderColor: template === t.id ? t.color : 'var(--rc-border)',
                      background: template === t.id ? `${t.color}1a` : 'transparent',
                    }}
                  >
                    <div className="text-xs font-semibold" style={{ color: template === t.id ? t.color : 'var(--rc-text-dim)' }}>
                      {t.label}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--rc-text-muted)' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes your rig unique?"
                rows={3}
                className="w-full px-3 py-2 rounded text-xs border outline-none resize-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text)',
                }}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--rc-text-muted)' }}>
                Tags (comma or space separated)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="privacy, local-first, voice"
                className="w-full px-3 py-2 rounded text-xs border outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text)',
                }}
              />
              {tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--rc-cyan)' }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {publishError && (
              <div className="text-xs p-2 rounded" style={{ color: 'var(--rc-red)', background: 'rgba(255,50,50,0.05)' }}>
                {publishError}
              </div>
            )}

            <button
              onClick={handleReview}
              disabled={exporting || !rigName.trim()}
              className="w-full py-2.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: 'var(--rc-cyan)',
                color: 'var(--rc-cyan)',
                background: 'rgba(0,240,255,0.1)',
              }}
            >
              {exporting ? 'Scrubbing PII...' : 'Review Before Publishing'}
            </button>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && scrubReport && (
          <div className="space-y-4">
            {/* Scrub report */}
            <div
              className="p-3 rounded border text-xs"
              style={{
                borderColor: 'var(--rc-green)',
                background: 'rgba(0,255,100,0.03)',
              }}
            >
              <div className="font-semibold mb-1" style={{ color: 'var(--rc-green)' }}>
                PII Scrub Complete — {scrubReport.scrubbed_fields.length} fields cleaned
              </div>
              {scrubReport.scrubbed_fields.length > 0 && (
                <ul className="space-y-0.5 mt-2" style={{ color: 'var(--rc-text-muted)' }}>
                  {scrubReport.scrubbed_fields.slice(0, 10).map((f) => (
                    <li key={f} className="font-mono text-[10px]">✓ {f}</li>
                  ))}
                  {scrubReport.scrubbed_fields.length > 10 && (
                    <li className="text-[10px]">...and {scrubReport.scrubbed_fields.length - 10} more</li>
                  )}
                </ul>
              )}
            </div>

            {/* Warnings */}
            {scrubReport.warnings.length > 0 && (
              <div
                className="p-3 rounded border text-xs"
                style={{
                  borderColor: 'var(--rc-red)',
                  background: 'rgba(255,50,50,0.05)',
                  color: 'var(--rc-red)',
                }}
              >
                <div className="font-semibold mb-1">⚠ Warnings</div>
                {scrubReport.warnings.map((w, i) => (
                  <div key={i} className="text-[10px] mt-1">{w}</div>
                ))}
              </div>
            )}

            {/* Preview */}
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--rc-text-muted)' }}>
                Scrubbed Loadout Preview
              </label>
              <pre
                className="p-3 rounded border text-[10px] font-mono overflow-auto max-h-60"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text-dim)',
                }}
              >
                {scrubbedJson}
              </pre>
            </div>

            {publishError && (
              <div className="text-xs p-2 rounded" style={{ color: 'var(--rc-red)', background: 'rgba(255,50,50,0.05)' }}>
                {publishError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('configure')}
                className="flex-1 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                style={{ borderColor: 'var(--rc-border)', color: 'var(--rc-text-dim)' }}
              >
                Back
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                style={{
                  borderColor: 'var(--rc-cyan)',
                  color: 'var(--rc-bg)',
                  background: 'var(--rc-cyan)',
                }}
              >
                {publishing ? 'Signing & Publishing...' : 'Publish to Nostr'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Publishing */}
        {step === 'publishing' && (
          <div className="text-center py-8">
            <div className="text-2xl mb-3 animate-pulse" style={{ color: 'var(--rc-cyan)' }}>⬡</div>
            <div className="text-xs" style={{ color: 'var(--rc-text-muted)' }}>
              Signing event and broadcasting to relays...
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && publishResult && (
          <div className="text-center py-6 space-y-4">
            <div className="text-3xl" style={{ color: 'var(--rc-green)' }}>✓</div>
            <div className="text-sm font-bold" style={{ color: 'var(--rc-text)' }}>
              Rig Published
            </div>
            <div className="text-[10px] font-mono p-2 rounded" style={{
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--rc-text-muted)',
            }}>
              Event: {publishResult.event_id.slice(0, 16)}...
            </div>
            <div className="text-xs" style={{ color: 'var(--rc-text-dim)' }}>
              Sent to {publishResult.relays_sent} relay{publishResult.relays_sent !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--rc-cyan)',
                color: 'var(--rc-cyan)',
                background: 'rgba(0,240,255,0.1)',
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
