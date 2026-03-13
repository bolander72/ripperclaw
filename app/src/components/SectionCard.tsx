import type { SectionData } from '../types';

interface Props {
  section: SectionData;
  selected: boolean;
  onClick: () => void;
}

const statusColor: Record<string, string> = {
  active: 'var(--rc-green)',
  degraded: 'var(--rc-yellow)',
  offline: 'var(--rc-red)',
  empty: 'var(--rc-text-muted)',
};

export function SectionCard({ section, selected, onClick }: Props) {
  return (
    <div
      className={`section-card ${selected ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ 
              background: selected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: 'var(--rc-cyan)' 
            }}
          >
            {section.icon}
          </div>
          <div>
            <span className="text-sm font-semibold block" style={{ color: 'var(--rc-text)' }}>
              {section.label}
            </span>
            <span className="text-xs block" style={{ color: 'var(--rc-cyan)' }}>
              {section.component}
            </span>
          </div>
        </div>
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: statusColor[section.status] }}
        />
      </div>
      {section.version && (
        <div className="text-xs font-mono mt-2" style={{ color: 'var(--rc-text-dim)' }}>
          v{section.version}
        </div>
      )}
    </div>
  );
}
