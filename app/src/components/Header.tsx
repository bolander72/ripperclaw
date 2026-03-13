import logoDark from '../assets/logo-dark.png';
import logoLight from '../assets/logo-light.png';

export function Header() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const logo = prefersDark ? logoDark : logoLight;

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ borderColor: 'var(--rc-border)', background: 'var(--rc-surface)' }}
      data-tauri-drag-region
    >
      <div className="flex items-center gap-4">
        <img src={logo} alt="ClawClawGo" className="h-8 w-auto" />
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight font-grotesk" style={{ color: 'var(--rc-text)' }}>
            ClawClawGo
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--rc-text-muted)' }}>
            v0.2.2
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full health-pulse"
            style={{ backgroundColor: 'var(--rc-green)' }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--rc-text-dim)' }}>
            All systems nominal
          </span>
        </div>
        <button
          className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-white/5"
          style={{
            borderColor: 'var(--rc-border)',
            color: 'var(--rc-text-dim)',
            background: 'transparent',
          }}
        >
          Export
        </button>
      </div>
    </header>
  );
}
