import type { SkillItem } from '../types';

interface Props {
  skills: (SkillItem & { enabled?: boolean })[];
}

const sourceColor: Record<string, string> = {
  bundled: 'var(--rc-text-muted)',
  custom: 'var(--rc-cyan)',
  clawhub: 'var(--rc-magenta)',
  local: 'var(--rc-yellow)',
};

const sourceBadge: Record<string, string> = {
  bundled: 'Stock',
  custom: 'Custom',
  clawhub: 'ClawHub',
  local: 'Local',
};

export function SkillList({ skills }: Props) {
  const grouped = {
    clawhub: skills.filter((s) => s.source === 'clawhub'),
    custom: skills.filter((s) => s.source === 'custom'),
    bundled: skills.filter((s) => s.source === 'bundled'),
    local: skills.filter((s) => s.source === 'local'),
  };

  const sections = Object.entries(grouped).filter(([, items]) => items.length > 0);

  return (
    <div className="space-y-6">
      {sections.map(([source, items]) => (
        <div key={source}>
          <h4
            className="text-sm font-semibold mb-3 capitalize"
            style={{ color: sourceColor[source] }}
          >
            {source} ({items.length})
          </h4>
          <div className="space-y-2">
            {items.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.02]"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--rc-border)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: skill.enabled !== false ? 'var(--rc-green)' : 'var(--rc-red)',
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--rc-text)' }}>{skill.name}</span>
                  {skill.version && (
                    <span className="text-xs font-mono" style={{ color: 'var(--rc-text-muted)' }}>v{skill.version}</span>
                  )}
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-lg"
                  style={{
                    color: sourceColor[skill.source],
                    background: `${sourceColor[skill.source]}15`,
                    border: `1px solid ${sourceColor[skill.source]}40`,
                  }}
                >
                  {sourceBadge[skill.source]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
