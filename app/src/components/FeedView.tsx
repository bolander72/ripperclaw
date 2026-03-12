import { useState, useEffect } from 'react';
import { useNostrKeys, useNostrFeed, type FeedLoadout } from '../hooks/useNostr';

// Mock feed data, shown when no real events exist yet
const mockLoadouts: DisplayLoadout[] = [
  {
    id: 'mock-1',
    name: 'Nighthawk',
    author: 'npub1cyb3r...punk',
    authorHex: 'abc123',
    template: 'homelab',
    description: 'Full surveillance loadout with local LLMs, multi-camera vision, and voice control. Zero cloud dependency.',
    tags: ['privacy', 'local-first', 'voice', 'cameras'],
    publishedAt: Date.now() / 1000 - 3600,
    model: 'llama-3.3-70b (local)',
    isMock: true,
    remixCount: 23,
  },
  {
    id: 'mock-2',
    name: 'Mercury',
    author: 'npub1fast...ship',
    authorHex: 'def456',
    template: 'ops',
    description: 'Lean and fast. Sonnet backbone, minimal skills, pure productivity. Sub-2s response times.',
    tags: ['minimal', 'fast', 'productivity'],
    publishedAt: Date.now() / 1000 - 7200,
    model: 'claude-sonnet-4-5',
    isMock: true,
    forkOf: 'mock-1',
    forkAuthor: 'npub1cyb3r...punk',
    remixCount: 8,
  },
  {
    id: 'mock-3',
    name: 'Athena',
    author: 'npub1wiz...ard',
    authorHex: 'ghi789',
    template: 'researcher',
    description: 'Research-focused loadout with deep web search, PDF analysis, and academic citation tracking. 40+ custom skills.',
    tags: ['research', 'academic', 'deep-web'],
    publishedAt: Date.now() / 1000 - 14400,
    model: 'claude-opus-4-6',
    isMock: true,
    remixCount: 47,
  },
  {
    id: 'mock-4',
    name: 'Patchwork',
    author: 'npub1home...base',
    authorHex: 'jkl012',
    template: 'smart-home',
    description: 'Smart home beast. 47 HA entities, automated routines, energy monitoring, security cams with person detection.',
    tags: ['smart-home', 'automation', 'security'],
    publishedAt: Date.now() / 1000 - 86400,
    model: 'gpt-5.2',
    isMock: true,
    remixCount: 12,
  },
  {
    id: 'mock-5',
    name: 'Ghostwriter',
    author: 'npub1pen...ink',
    authorHex: 'mno345',
    template: 'creator',
    description: 'Content creation loadout. Blog posts, social media, email sequences, SEO optimization. Writes in your voice.',
    tags: ['content', 'writing', 'seo', 'social-media'],
    publishedAt: Date.now() / 1000 - 172800,
    model: 'claude-opus-4-6',
    isMock: true,
    forkOf: 'mock-3',
    forkAuthor: 'npub1wiz...ard',
    remixCount: 3,
  },
  {
    id: 'mock-6',
    name: 'Djinn',
    author: 'npub1void...abyss',
    authorHex: 'pqr678',
    template: 'ops',
    description: 'DeFi monitoring + execution. On-chain analytics, portfolio tracking, automated rebalancing.',
    tags: ['defi', 'crypto', 'solana', 'trading'],
    publishedAt: Date.now() / 1000 - 259200,
    model: 'claude-sonnet-4-5',
    isMock: true,
    remixCount: 0,
  },
];

interface DisplayLoadout {
  id: string;
  name: string;
  author: string;
  authorHex: string;
  template: string;
  description: string;
  tags: string[];
  publishedAt: number;
  model?: string;
  isMock?: boolean;
  forkOf?: string;
  forkAuthor?: string;
  remixCount: number;
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

function parseFeedLoadout(entry: FeedLoadout, allEntries: FeedLoadout[]): DisplayLoadout {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(entry.content);
  } catch { /* ignore */ }

  const template = entry.template || entry.tags.find((t) => templates.includes(t)) || 'ops';
  const meta = (parsed.meta || {}) as Record<string, unknown>;

  // Count how many other loadouts fork from this one
  const remixCount = allEntries.filter((e) => e.fork_of === entry.id).length;

  return {
    id: entry.id,
    name: entry.name,
    author: entry.author,
    authorHex: entry.author_hex,
    template,
    description: (meta.description as string) || `${entry.tags.length} tags · Published via RipperClaw`,
    tags: entry.tags,
    publishedAt: entry.published_at,
    model: ((parsed.slots as Record<string, unknown>)?.model as Record<string, unknown>)?.component as string | undefined,
    forkOf: entry.fork_of || undefined,
    forkAuthor: entry.fork_author || undefined,
    remixCount,
  };
}

interface FeedViewProps {
  onCompare?: (loadout: unknown) => void;
}

export function FeedView({ onCompare }: FeedViewProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'remixes'>('recent');
  const [selectedLoadout, setSelectedLoadout] = useState<DisplayLoadout | null>(null);
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

  // Convert nostr events to display loadouts, fall back to mock
  const realLoadouts = nostrFeed.map((entry) => parseFeedLoadout(entry, nostrFeed));
  const displayLoadouts = realLoadouts.length > 0 ? realLoadouts : mockLoadouts;
  const isUsingMock = realLoadouts.length === 0;

  const filtered = (filter
    ? displayLoadouts.filter((r) => r.template === filter || r.tags.includes(filter))
    : displayLoadouts
  ).sort((a, b) =>
    sortBy === 'remixes'
      ? b.remixCount - a.remixCount
      : b.publishedAt - a.publishedAt
  );

  // Build a lookup for provenance tree in detail panel
  const loadoutById = new Map(displayLoadouts.map((l) => [l.id, l]));

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Feed list */}
      <div className={`${selectedLoadout ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto transition-all`}>
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
                  No identity set. Generate or import a nostr key to publish & subscribe.
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

          {/* Template filters + sort */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 flex-wrap">
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
            <div className="flex gap-1">
              {(['recent', 'remixes'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border transition-all"
                  style={{
                    borderColor: sortBy === s ? 'var(--rc-magenta)' : 'var(--rc-border)',
                    color: sortBy === s ? 'var(--rc-magenta)' : 'var(--rc-text-muted)',
                    background: sortBy === s ? 'rgba(255,0,170,0.1)' : 'transparent',
                  }}
                >
                  {s === 'recent' ? '🕐 Recent' : '🔀 Hot'}
                </button>
              ))}
            </div>
          </div>

          {/* Loadout cards */}
          <div className="space-y-3">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-lg border cursor-pointer transition-all hover:border-opacity-80"
                style={{
                  background: selectedLoadout?.id === entry.id ? 'var(--rc-surface-hover)' : 'var(--rc-surface)',
                  borderColor: selectedLoadout?.id === entry.id ? 'var(--rc-cyan)' : 'var(--rc-border)',
                  boxShadow: selectedLoadout?.id === entry.id ? '0 0 12px var(--rc-cyan-dim)' : 'none',
                }}
                onClick={() => setSelectedLoadout(selectedLoadout?.id === entry.id ? null : entry)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--rc-text)' }}>
                      {entry.name}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                      style={{
                        color: templateColors[entry.template] || 'var(--rc-text-muted)',
                        border: `1px solid ${templateColors[entry.template] || 'var(--rc-border)'}33`,
                      }}
                    >
                      {entry.template}
                    </span>
                    {entry.remixCount > 0 && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          color: 'var(--rc-magenta)',
                          background: 'rgba(255,0,170,0.1)',
                          border: '1px solid rgba(255,0,170,0.2)',
                        }}
                      >
                        🔀 {entry.remixCount}
                      </span>
                    )}
                    {entry.isMock && (
                      <span className="text-[9px] px-1 py-0.5 rounded" style={{
                        color: 'var(--rc-text-muted)',
                        opacity: 0.5,
                      }}>
                        sample
                      </span>
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                    {timeAgo(entry.publishedAt)}
                  </span>
                </div>

                <p className="text-xs mb-2 leading-relaxed" style={{ color: 'var(--rc-text-dim)' }}>
                  {entry.description}
                </p>

                {entry.forkOf && (
                  <div
                    className="text-[10px] mb-2 flex items-center gap-1"
                    style={{ color: 'var(--rc-text-muted)' }}
                  >
                    <span>🔀</span>
                    <span>remixed from</span>
                    <span className="font-mono" style={{ color: 'var(--rc-cyan)' }}>
                      {loadoutById.get(entry.forkOf)?.name || entry.forkOf.slice(0, 12) + '...'}
                    </span>
                    {entry.forkAuthor && (
                      <span className="font-mono">by {entry.forkAuthor.slice(0, 12)}...</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono" style={{ color: 'var(--rc-text-muted)' }}>
                      {entry.author}
                    </span>
                    {entry.model && (
                      <span className="text-[10px] font-mono" style={{ color: 'var(--rc-cyan)' }}>
                        {entry.model}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 mt-2 flex-wrap">
                  {entry.tags.map((tag) => (
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
      {selectedLoadout && (
        <div
          className="w-1/2 p-6 border-l overflow-y-auto"
          style={{ borderColor: 'var(--rc-border)' }}
        >
          <div
            className="p-6 rounded-lg border"
            style={{
              background: 'var(--rc-surface)',
              borderColor: templateColors[selectedLoadout.template] || 'var(--rc-border)',
              boxShadow: `0 0 20px ${templateColors[selectedLoadout.template] || 'var(--rc-cyan)'}33`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--rc-text)' }}>
                {selectedLoadout.name}
              </h2>
              <span
                className="text-xs px-2 py-1 rounded font-mono uppercase"
                style={{
                  color: templateColors[selectedLoadout.template],
                  border: `1px solid ${templateColors[selectedLoadout.template]}66`,
                }}
              >
                {selectedLoadout.template}
              </span>
            </div>

            <p className="text-xs mb-1" style={{ color: 'var(--rc-text-muted)' }}>
              by {selectedLoadout.author}
            </p>
            <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--rc-text-dim)' }}>
              {selectedLoadout.description}
            </p>

            {selectedLoadout.model && (
              <div className="mb-4 py-2 px-3 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--rc-text-muted)' }}>
                  Model
                </div>
                <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--rc-text)' }}>
                  {selectedLoadout.model}
                </div>
              </div>
            )}

            {/* Provenance */}
            {(selectedLoadout.forkOf || selectedLoadout.remixCount > 0) && (
              <div
                className="mb-6 py-3 px-3 rounded border"
                style={{ background: 'rgba(255,0,170,0.03)', borderColor: 'rgba(255,0,170,0.15)' }}
              >
                <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--rc-magenta)' }}>
                  Provenance
                </div>

                {/* Ancestry chain */}
                {selectedLoadout.forkOf && (() => {
                  const chain: DisplayLoadout[] = [];
                  let current: DisplayLoadout | undefined = selectedLoadout;
                  while (current?.forkOf) {
                    const parent = loadoutById.get(current.forkOf);
                    if (parent) {
                      chain.unshift(parent);
                      current = parent;
                    } else {
                      // Parent not in current feed, show truncated
                      chain.unshift({
                        id: current.forkOf,
                        name: current.forkOf.slice(0, 12) + '...',
                        author: current.forkAuthor || 'unknown',
                        authorHex: '',
                        template: 'ops',
                        description: '',
                        tags: [],
                        publishedAt: 0,
                        remixCount: 0,
                      });
                      break;
                    }
                  }

                  return (
                    <div className="space-y-1 mb-2">
                      {chain.map((ancestor, i) => (
                        <div
                          key={ancestor.id}
                          className="flex items-center gap-2 text-[10px] cursor-pointer hover:opacity-80"
                          style={{ paddingLeft: `${i * 12}px` }}
                          onClick={() => {
                            const full = displayLoadouts.find((l) => l.id === ancestor.id);
                            if (full) setSelectedLoadout(full);
                          }}
                        >
                          <span style={{ color: 'var(--rc-text-muted)' }}>
                            {i === 0 ? '🌱' : '↳'}
                          </span>
                          <span className="font-semibold" style={{ color: 'var(--rc-text)' }}>
                            {ancestor.name}
                          </span>
                          <span className="font-mono" style={{ color: 'var(--rc-text-muted)' }}>
                            {ancestor.author}
                          </span>
                        </div>
                      ))}
                      <div
                        className="flex items-center gap-2 text-[10px]"
                        style={{ paddingLeft: `${chain.length * 12}px` }}
                      >
                        <span style={{ color: 'var(--rc-cyan)' }}>↳</span>
                        <span className="font-semibold" style={{ color: 'var(--rc-cyan)' }}>
                          {selectedLoadout.name}
                        </span>
                        <span className="text-[9px]" style={{ color: 'var(--rc-text-muted)' }}>(this)</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Remix count */}
                {selectedLoadout.remixCount > 0 && (
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--rc-text-dim)' }}>
                    <span>🔀</span>
                    <span>
                      Remixed <span style={{ color: 'var(--rc-magenta)' }}>{selectedLoadout.remixCount}</span> time{selectedLoadout.remixCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Direct forks list */}
                {selectedLoadout.remixCount > 0 && (
                  <div className="mt-2 space-y-1">
                    {displayLoadouts
                      .filter((l) => l.forkOf === selectedLoadout.id)
                      .map((fork) => (
                        <div
                          key={fork.id}
                          className="flex items-center gap-2 text-[10px] cursor-pointer hover:opacity-80 pl-3"
                          onClick={() => setSelectedLoadout(fork)}
                        >
                          <span style={{ color: 'var(--rc-text-muted)' }}>↳</span>
                          <span className="font-semibold" style={{ color: 'var(--rc-text)' }}>
                            {fork.name}
                          </span>
                          <span className="font-mono" style={{ color: 'var(--rc-text-muted)' }}>
                            {fork.author}
                          </span>
                          {fork.remixCount > 0 && (
                            <span style={{ color: 'var(--rc-magenta)' }}>🔀 {fork.remixCount}</span>
                          )}
                        </div>
                      ))
                    }
                  </div>
                )}
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
                  if (!onCompare || !selectedLoadout) return;
                  // Build a Loadout-shaped object from the feed entry
                  let parsed: Record<string, unknown> = {};
                  try {
                    // For real nostr events, content is the full loadout JSON
                    const realEntry = nostrFeed.find((r) => r.id === selectedLoadout.id);
                    if (realEntry) {
                      parsed = JSON.parse(realEntry.content);
                    }
                  } catch { /* use mock structure */ }

                  const loadout = parsed.schema ? parsed : {
                    schema: 1,
                    meta: {
                      name: selectedLoadout.name,
                      author: selectedLoadout.author,
                      template: selectedLoadout.template,
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
