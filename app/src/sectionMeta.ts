// Shared section metadata: known defaults + graceful fallback for custom types

export interface SectionMeta {
  icon: string;
  emoji: string;
  label: string;
  color: string;
}

const KNOWN_SECTIONS: Record<string, SectionMeta> = {
  model:        { icon: '⬢', emoji: '🧠', label: 'Model',        color: '#00f0ff' },
  persona:      { icon: '◈', emoji: '👤', label: 'Persona',      color: '#ff6b9d' },
  skills:       { icon: '◆', emoji: '⚡', label: 'Skills',       color: '#00ff88' },
  integrations: { icon: '⊕', emoji: '🔌', label: 'Integrations', color: '#ffd700' },
  automations:  { icon: '⏱', emoji: '⏰', label: 'Automations',  color: '#ff6b35' },
  memory:       { icon: '◎', emoji: '💾', label: 'Memory',       color: '#b388ff' },
};

// Deterministic color for unknown section types based on string hash
const FALLBACK_COLORS = [
  '#ff4da6', '#4dff88', '#4da6ff', '#ffaa4d', '#aa4dff',
  '#4dffff', '#ff4d4d', '#88ff4d', '#4d4dff', '#ff4dff',
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getSectionMeta(sectionId: string): SectionMeta {
  if (KNOWN_SECTIONS[sectionId]) return KNOWN_SECTIONS[sectionId];

  // Generate consistent fallback for custom section types
  const color = FALLBACK_COLORS[hashString(sectionId) % FALLBACK_COLORS.length];
  const label = sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace(/[-_]/g, ' ');
  return { icon: '◇', emoji: '🔧', label, color };
}

export function getAllKnownSections(): Record<string, SectionMeta> {
  return { ...KNOWN_SECTIONS };
}

export function isKnownSection(sectionId: string): boolean {
  return sectionId in KNOWN_SECTIONS;
}


