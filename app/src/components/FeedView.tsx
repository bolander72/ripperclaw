import { useState, useEffect } from 'react';
import { useNostrKeys, useNostrFeed, type FeedRig } from '../hooks/useNostr';

// Mock feed data — shown when no real events exist yet
const mockFeed: DisplayRig[] = [
  {
    id: 'mock-1',
    name: 'Nighthawk',
    author: 'npub1cyb3r...punk',
    template: 'homelab',
    description: 'Full surveillance rig with local LLMs, multi-camera vision, and voice control. Zero cloud dependency.',
    tags: ['privacy', 'local-first', 'voice', 'cameras'],
    publishedAt: Date.now() / 1000 - 3600,
    model: 'llama-3.3-70b (local)',
    isMock: true,
  },
  {
    id: 'mock-2',
    name: 'Mercury',
    author: 'npub1fast...ship',
    template: 'ops',
    description: 'Lean and fast. Sonnet backbone, minimal skills, pure productivity. Sub-2s response times.',
    tags: ['minimal', 'fast', 'productivity'],
    publishedAt: Date.now() / 1000 - 7200,
    model: 'claude-sonnet-4-5',
    isMock: true,
  },
  {
    id: 'mock-3',
    name: 'Athena',
    author: 'npub1wiz...ard',
    template: 'researcher',
    description: 'Research-focused rig with deep web search, PDF analysis, and academic citation tracking. 40+ custom skills.',
    tags: ['research', 'academic', 'deep-web'],
    publishedAt: Date.now() / 1000 - 14400,
    model: 'claude-opus-4-6',
    isMock: true,
  },
  {
    id: 'mock-4',
    name: 'Patchwork',
    author: 'npub1home...base',
    template: 'smart-home',
    description: 'Smart home beast. 47 HA entities, automated routines, energy monitoring, security cams with person detection.',
    tags: ['smart-home', 'automation', 'security'],
    publishedAt: Date.now() / 1000 - 86400,
    model: 'gpt-5.2',
    isMock: true,
  },
  {
    id: 'mock-5',
    name: 'Ghostwriter',
    author: 'npub1pen...ink',
    template: 'creator',
    description: 'Content creation rig. Blog posts, social media, email sequences, SEO optimization. Writes in your voice.',
    tags: ['content', 'writing', 'seo', 'social-media'],
    publishedAt: Date.now() / 1000 - 172800,
    model: 'claude-opus-4-6',
    isMock: true,
  },
  {
    id: 'mock-6',
    name: 'Djinn',
    author: 'npub1void...abyss',
    template: 'ops',
    description: 'DeFi monitoring + execution. On-chain analytics, portfolio tracking, automated rebalancing.',
    tags: ['defi', 'crypto', 'solana', 'trading'],
    publishedAt: Date.now() / 1000 - 259200,
    model: 'claude-sonnet-4-5',
    isMock: true,
  },
];

interface DisplayRig {
  id: string;
  name: string;
  author: string;
  template: string;
  description: string;
  tags: string[];
  publishedAt: number;
  model?: string;
  isMock?: boolean;
}

const templateColors: Record<string, string> = {
  homelab: 'var(--rc-cyan)',
  ops: 'var(--rc-yellow)',
  researcher: 'var(--rc-magenta)',
  'smart-home': 'var(--rc-green)',
  creator: 'var(--rc-red)',
};

const templates = ['homelab', 'ops', 'researcher', 'smart-home', 'creator'];

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function parseFeedRig(rig: FeedRig): DisplayRig {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(rig.content);
  } catch { /* ignore */ }

  const template = rig.template || rig.tags.find((t) => templates.includes(t)) || 'ops';
  const meta = (parsed.meta || {}) as Record<string, unknown>;

  return {
    id: rig.id,
    name: rig.name,
    author: rig.author,
    template,
    description: (meta.description as string) || `${rig.tags.length} tags · Published via RipperClaw`,
    tags: rig.tags,
    publishedAt: rig.published_at,
    model: ((parsed.slots as Record<string, unknown>)?.skeleton as Record<string, unknown>)?.component as string | undefined,
  };
}

interface FeedViewProps {
  onCompare?: (loadout: unknown) => void;
}

export function FeedView({ onCompare }: FeedViewProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedRig, setSelectedRig] = useState<DisplayRig | null>(null);
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [nsecInput, setNsecInput] = useState('');

  const { keys, generate, importKey } = useNostrKeys();
  const { feed: nostrFeed, loading: feedLoading, error: feedError, fetchFeed } = useNostrFeed();

  // Fetch feed on mount if we have keys
  useEffect(() => {
    if (keys.has_keys) {
      fetchFeed(50);
    }
  }, [keys.has_keys]);

  // Convert nostr events to display rigs, fall back to mock
  const realRigs = nostrFeed.map(parseFeedRig);
  const displayRigs = realRigs.length > 0 ? realRigs : mockFeed;
  const isUsingMock = realRigs.length === 0;

  const filtered = filter
    ? displayRigs.filter((r) => r.template === filter || r.tags.includes(filter))
    : displayRigs;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Feed list */}
      <div className={`${selectedRig ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto transition-all`}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--rc-text-muted)' }}
            >
              The Feed
            </h3>
            <div className="flex items-center gap-2">
              {isUsingMock && (
                <span className="text-[10px] px-2 py-0.5 rounded" style={{
                  background: 'rgba(255,0,170,0.1)',
                  color: 'var(--rc-magenta)',
                  border: '1px solid var(--rc-magenta-dim)',
                }}>
                  MOCK DATA
                </span>
              )}
              {feedLoading && (
                <span className="text-[10px] animate-pulse" style={{ color: 'var(--rc-cyan)' }}>
                  SYNCING...
                </span>
              )}
            </div>
          </div>

          {/* Identity bar */}
          <div
            className="flex items-center justify-between mb-4 p-3 rounded-lg border"
            style={{ background: 'var(--rc-surface)', borderColor: 'var(--rc-border)' }}
          >
            {keys.has_keys ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--rc-green)' }} />
                  <span className="text-[10px] font-mono" style={{ color: 'var(--rc-text-muted)' }}>
                    {keys.npub_short}
                  </span>
                </div>
                <button
                  onClick={() => fetchFeed(50)}
                  className="text-[10px] px-2 py-1 rounded border transition-all hover:opacity-80"
                  style={{
                    borderColor: 'var(--rc-cyan)',
                    color: 'var(--rc-cyan)',
                    background: 'rgba(0,240,255,0.05)',
                  }}
                >
                  Refresh
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                  No identity set — generate or import a nostr key to publish & subscribe
                </span>
                <button
                  onClick={() => setShowKeySetup(!showKeySetup)}
                  className="text-[10px] px-2 py-1 rounded border transition-all hover:opacity-80"
                  style={{
                    borderColor: 'var(--rc-cyan)',
                    color: 'var(--rc-cyan)',
                    background: 'rgba(0,240,255,0.05)',
                  }}
                >
                  Setup Identity
                </button>
              </div>
            )}
          </div>

          {/* Key setup panel */}
          {showKeySetup && !keys.has_keys && (
            <div
              className="mb-4 p-4 rounded-lg border"
              style={{ background: 'var(--rc-surface)', borderColor: 'var(--rc-cyan-dim)' }}
            >
              <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--rc-text)' }}>
                Nostr Identity
              </h4>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    await generate();
                    setShowKeySetup(false);
                  }}
                  className="w-full py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                  style={{
                    borderColor: 'var(--rc-cyan)',
                    color: 'var(--rc-cyan)',
                    background: 'rgba(0,240,255,0.1)',
                  }}
                >
                  Generate New Keys
                </button>
                <div className="text-center text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>or</div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={nsecInput}
                    onChange={(e) => setNsecInput(e.target.value)}
                    placeholder="nsec1..."
                    className="flex-1 px-3 py-2 rounded text-xs font-mono border outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderColor: 'var(--rc-border)',
                      color: 'var(--rc-text)',
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (nsecInput.startsWith('nsec1')) {
                        await importKey(nsecInput);
                        setNsecInput('');
                        setShowKeySetup(false);
                      }
                    }}
                    className="px-3 py-2 rounded text-xs border transition-all hover:opacity-80"
                    style={{
                      borderColor: 'var(--rc-border)',
                      color: 'var(--rc-text-dim)',
                    }}
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {feedError && (
            <div
              className="mb-4 p-3 rounded-lg border text-xs"
              style={{
                borderColor: 'var(--rc-red)',
                color: 'var(--rc-red)',
                background: 'rgba(255,50,50,0.05)',
              }}
            >
              {feedError}
            </div>
          )}

          {/* Template filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setFilter(null)}
              className="px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-all"
              style={{
                borderColor: !filter ? 'var(--rc-cyan)' : 'var(--rc-border)',
                color: !filter ? 'var(--rc-cyan)' : 'var(--rc-text-muted)',
                background: !filter ? 'rgba(0,240,255,0.1)' : 'transparent',
              }}
            >
              All
            </button>
            {templates.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(filter === t ? null : t)}
                className="px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-all"
                style={{
                  borderColor: filter === t ? templateColors[t] : 'var(--rc-border)',
                  color: filter === t ? templateColors[t] : 'var(--rc-text-muted)',
                  background: filter === t ? `${templateColors[t]}1a` : 'transparent',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Rig cards */}
          <div className="space-y-3">
            {filtered.map((rig) => (
              <div
                key={rig.id}
                className="p-4 rounded-lg border cursor-pointer transition-all hover:border-opacity-80"
                style={{
                  background: selectedRig?.id === rig.id ? 'var(--rc-surface-hover)' : 'var(--rc-surface)',
                  borderColor: selectedRig?.id === rig.id ? 'var(--rc-cyan)' : 'var(--rc-border)',
                  boxShadow: selectedRig?.id === rig.id ? '0 0 12px var(--rc-cyan-dim)' : 'none',
                }}
                onClick={() => setSelectedRig(selectedRig?.id === rig.id ? null : rig)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--rc-text)' }}>
                      {rig.name}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                      style={{
                        color: templateColors[rig.template] || 'var(--rc-text-muted)',
                        border: `1px solid ${templateColors[rig.template] || 'var(--rc-border)'}33`,
                      }}
                    >
                      {rig.template}
                    </span>
                    {rig.isMock && (
                      <span className="text-[9px] px-1 py-0.5 rounded" style={{
                        color: 'var(--rc-text-muted)',
                        opacity: 0.5,
                      }}>
                        sample
                      </span>
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                    {timeAgo(rig.publishedAt)}
                  </span>
                </div>

                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--rc-text-dim)' }}>
                  {rig.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono" style={{ color: 'var(--rc-text-muted)' }}>
                      {rig.author}
                    </span>
                    {rig.model && (
                      <span className="text-[10px] font-mono" style={{ color: 'var(--rc-cyan)' }}>
                        {rig.model}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 mt-2 flex-wrap">
                  {rig.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--rc-text-muted)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilter(tag);
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedRig && (
        <div
          className="w-1/2 p-6 border-l overflow-y-auto"
          style={{ borderColor: 'var(--rc-border)' }}
        >
          <div
            className="p-6 rounded-lg border"
            style={{
              background: 'var(--rc-surface)',
              borderColor: templateColors[selectedRig.template] || 'var(--rc-border)',
              boxShadow: `0 0 20px ${templateColors[selectedRig.template] || 'var(--rc-cyan)'}33`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--rc-text)' }}>
                {selectedRig.name}
              </h2>
              <span
                className="text-xs px-2 py-1 rounded font-mono uppercase"
                style={{
                  color: templateColors[selectedRig.template],
                  border: `1px solid ${templateColors[selectedRig.template]}66`,
                }}
              >
                {selectedRig.template}
              </span>
            </div>

            <p className="text-xs mb-1" style={{ color: 'var(--rc-text-muted)' }}>
              by {selectedRig.author}
            </p>
            <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--rc-text-dim)' }}>
              {selectedRig.description}
            </p>

            {selectedRig.model && (
              <div className="mb-6 py-2 px-3 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--rc-text-muted)' }}>
                  Model
                </div>
                <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--rc-text)' }}>
                  {selectedRig.model}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                style={{
                  borderColor: 'var(--rc-cyan)',
                  color: 'var(--rc-cyan)',
                  background: 'rgba(0,240,255,0.1)',
                }}
                onClick={() => {
                  if (!onCompare || !selectedRig) return;
                  // Build a Loadout-shaped object from the Feed rig
                  let parsed: Record<string, unknown> = {};
                  try {
                    // For real nostr events, content is the full loadout JSON
                    const realRig = nostrFeed.find((r) => r.id === selectedRig.id);
                    if (realRig) {
                      parsed = JSON.parse(realRig.content);
                    }
                  } catch { /* use mock structure */ }

                  const loadout = parsed.schema ? parsed : {
                    schema: 1,
                    meta: {
                      name: selectedRig.name,
                      author: selectedRig.author,
                      template: selectedRig.template,
                    },
                    slots: (parsed.slots as Record<string, unknown>) || {},
                    mods: (parsed.mods as unknown[]) || [],
                  };
                  onCompare(loadout);
                }}
              >
                Compare to Mine
              </button>
              <button
                className="flex-1 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                style={{
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text-dim)',
                  background: 'transparent',
                }}
              >
                Import Loadout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
