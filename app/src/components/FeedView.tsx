import { useState } from 'react';

interface FeedRig {
  id: string;
  name: string;
  author: string;
  template: string;
  description: string;
  slotCount: number;
  modCount: number;
  tags: string[];
  publishedAt: string;
  reactions: number;
  model: string;
  channels: string[];
}

// Mock feed data — will be replaced with nostr events
const mockFeed: FeedRig[] = [
  {
    id: '1',
    name: 'Nighthawk',
    author: 'npub1cyb3r...punk',
    template: 'netrunner',
    description: 'Full surveillance rig with local LLMs, multi-camera vision, and voice control. Zero cloud dependency.',
    slotCount: 9,
    modCount: 32,
    tags: ['privacy', 'local-first', 'voice', 'cameras'],
    publishedAt: '2026-03-10T22:00:00Z',
    reactions: 42,
    model: 'llama-3.3-70b (local)',
    channels: ['matrix', 'signal'],
  },
  {
    id: '2',
    name: 'Mercury',
    author: 'npub1fast...ship',
    template: 'fixer',
    description: 'Lean and fast. Sonnet backbone, minimal skills, pure productivity. Sub-2s response times.',
    slotCount: 7,
    modCount: 12,
    tags: ['minimal', 'fast', 'productivity'],
    publishedAt: '2026-03-10T20:00:00Z',
    reactions: 28,
    model: 'claude-sonnet-4-5',
    channels: ['telegram'],
  },
  {
    id: '3',
    name: 'Athena',
    author: 'npub1wiz...ard',
    template: 'solo',
    description: 'Research-focused rig with deep web search, PDF analysis, and academic citation tracking. 40+ custom skills.',
    slotCount: 9,
    modCount: 44,
    tags: ['research', 'academic', 'deep-web', 'citations'],
    publishedAt: '2026-03-10T18:00:00Z',
    reactions: 67,
    model: 'claude-opus-4-6',
    channels: ['discord', 'email'],
  },
  {
    id: '4',
    name: 'Patchwork',
    author: 'npub1home...base',
    template: 'nomad',
    description: 'Smart home beast. 47 HA entities, automated routines, energy monitoring, security cams with person detection.',
    slotCount: 9,
    modCount: 22,
    tags: ['smart-home', 'automation', 'security', 'energy'],
    publishedAt: '2026-03-09T15:00:00Z',
    reactions: 35,
    model: 'gpt-5.2',
    channels: ['whatsapp', 'homeassistant'],
  },
  {
    id: '5',
    name: 'Ghostwriter',
    author: 'npub1pen...ink',
    template: 'rockerboy',
    description: 'Content creation rig. Blog posts, social media, email sequences, SEO optimization. Writes in your voice.',
    slotCount: 8,
    modCount: 28,
    tags: ['content', 'writing', 'seo', 'social-media'],
    publishedAt: '2026-03-09T12:00:00Z',
    reactions: 51,
    model: 'claude-opus-4-6',
    channels: ['slack', 'notion'],
  },
  {
    id: '6',
    name: 'Djinn',
    author: 'npub1void...abyss',
    template: 'netrunner',
    description: 'DeFi monitoring + execution. On-chain analytics, portfolio tracking, automated rebalancing. Uses Jito and Jupiter.',
    slotCount: 7,
    modCount: 15,
    tags: ['defi', 'crypto', 'solana', 'trading'],
    publishedAt: '2026-03-08T20:00:00Z',
    reactions: 89,
    model: 'claude-sonnet-4-5',
    channels: ['telegram', 'discord'],
  },
];

const templateColors: Record<string, string> = {
  netrunner: 'var(--rc-cyan)',
  fixer: 'var(--rc-yellow)',
  solo: 'var(--rc-magenta)',
  nomad: 'var(--rc-green)',
  rockerboy: 'var(--rc-red)',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FeedView() {
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedRig, setSelectedRig] = useState<FeedRig | null>(null);

  const filtered = filter
    ? mockFeed.filter((r) => r.template === filter || r.tags.includes(filter))
    : mockFeed;

  const templates = ['netrunner', 'fixer', 'solo', 'nomad', 'rockerboy'];

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
            <div className="flex items-center gap-1">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ 
                background: 'rgba(255,0,170,0.1)',
                color: 'var(--rc-magenta)',
                border: '1px solid var(--rc-magenta-dim)',
              }}>
                MOCK DATA
              </span>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--rc-text-dim)' }}>
            Browse public rigs from the network. Nostr integration coming soon.
          </p>

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
                {/* Card header */}
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
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                    {timeAgo(rig.publishedAt)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--rc-text-dim)' }}>
                  {rig.description}
                </p>

                {/* Stats row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                      {rig.slotCount} slots
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                      {rig.modCount} mods
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--rc-cyan)' }}>
                      {rig.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: 'var(--rc-yellow)' }}>⚡</span>
                    <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                      {rig.reactions}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {rig.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono"
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Model', value: selectedRig.model },
                { label: 'Channels', value: selectedRig.channels.join(', ') },
                { label: 'Slots', value: String(selectedRig.slotCount) },
                { label: 'Mods', value: String(selectedRig.modCount) },
              ].map((stat) => (
                <div key={stat.label} className="py-2 px-3 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--rc-text-muted)' }}>
                    {stat.label}
                  </div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--rc-text)' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                style={{
                  borderColor: 'var(--rc-cyan)',
                  color: 'var(--rc-cyan)',
                  background: 'rgba(0,240,255,0.1)',
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
