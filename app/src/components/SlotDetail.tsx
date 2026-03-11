import type { SlotData } from '../types';

interface Props {
  slot: SlotData;
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

export function SlotDetail({ slot }: Props) {
  const subs = slot.subComponents || [];

  return (
    <div
      className="h-full p-6 rounded-lg border"
      style={{
        background: 'var(--rc-surface)',
        borderColor: 'var(--rc-cyan)',
        boxShadow: '0 0 20px var(--rc-cyan-dim), inset 0 0 20px rgba(0, 240, 255, 0.03)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl" style={{ color: 'var(--rc-cyan)' }}>
          {slot.icon}
        </span>
        <div>
          <h2
            className="text-xl font-bold uppercase tracking-wider"
            style={{ color: 'var(--rc-text)' }}
          >
            {slot.label}
          </h2>
          <p className="text-sm" style={{ color: 'var(--rc-cyan)' }}>
            {slot.component}
            {slot.version && (
              <span style={{ color: 'var(--rc-text-dim)' }}> v{slot.version}</span>
            )}
          </p>
        </div>
      </div>

      {/* Sub-components */}
      {subs.length > 0 && (
        <div className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--rc-text-muted)' }}
          >
            Components
          </h3>
          <div className="space-y-1">
            {subs.map((sub, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusColor[sub.status] || 'var(--rc-text-muted)' }}
                  />
                  {sub.icon && (
                    <span className="text-xs">{sub.icon}</span>
                  )}
                  <span className="text-xs font-medium" style={{ color: 'var(--rc-text)' }}>
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
      <div className="space-y-3">
        <h3
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--rc-text-muted)' }}
        >
          Raw Data
        </h3>
        {Object.entries(slot.details)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center py-2 px-3 rounded"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--rc-text-dim)' }}
            >
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-xs font-mono max-w-[60%] text-right truncate" style={{ color: 'var(--rc-text)' }}>
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
