import type { SectionData } from '../types';

interface Props {
  section: SectionData;
}

const statusColor: Record<string, string> = {
  active: 'var(--rc-green)',
  degraded: 'var(--rc-yellow)',
  offline: 'var(--rc-red)',
  empty: 'var(--rc-text-muted)',
  missing: 'var(--rc-red)',
  inactive: 'var(--rc-text-muted)',
  minimal: 'var(--rc-yellow)',
};

export function SectionDetail({ section }: Props) {
  const subs = section.subComponents || [];

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.05))',
            border: '1px solid rgba(0, 240, 255, 0.3)'
          }}
        >
          {section.icon}
        </div>
        <div>
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--rc-text)' }}
          >
            {section.label}
          </h2>
          <p className="text-sm" style={{ color: 'var(--rc-cyan)' }}>
            {section.component}
            {section.version && (
              <span style={{ color: 'var(--rc-text-dim)' }}> · v{section.version}</span>
            )}
          </p>
        </div>
      </div>

      {/* Sub-components */}
      {subs.length > 0 && (
        <div className="mb-8">
          <h3
            className="text-sm font-semibold mb-4"
            style={{ color: 'var(--rc-text-dim)' }}
          >
            Components
          </h3>
          <div className="space-y-2">
            {subs.map((sub, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl transition-all hover:bg-white/[0.02]"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--rc-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColor[sub.status] || 'var(--rc-text-muted)' }}
                  />
                  {sub.icon && (
                    <span className="text-sm">{sub.icon}</span>
                  )}
                  <span className="text-sm font-medium" style={{ color: 'var(--rc-text)' }}>
                    {sub.name}
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--rc-text-dim)' }}>
                  {sub.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specifications */}
      {Object.keys(section.details).length > 0 && (
        <div className="space-y-4">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--rc-text-dim)' }}
          >
            Configuration
          </h3>
          <div className="space-y-2">
            {Object.entries(section.details)
              .filter(([, v]) => v !== null && v !== undefined)
              .map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center p-4 rounded-xl"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--rc-border)' }}
              >
                <span
                  className="text-sm font-medium capitalize"
                  style={{ color: 'var(--rc-text-dim)' }}
                >
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-mono max-w-[60%] text-right truncate" style={{ color: 'var(--rc-text)' }}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
