import { useState } from 'react';
import logoDark from '../assets/logo-dark.png';
import logoLight from '../assets/logo-light.png';
import { useUpdateCheck } from '../hooks/useUpdateCheck';

export function Header() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const logo = prefersDark ? logoDark : logoLight;
  const { updateState, downloadAndInstall, restartAndInstall } = useUpdateCheck();
  const [showModal, setShowModal] = useState(false);

  const handleUpdateClick = () => {
    setShowModal(true);
  };

  const handleDownload = async () => {
    await downloadAndInstall();
  };

  const handleRestart = async () => {
    await restartAndInstall();
  };

  return (
    <>
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
            {updateState.available && updateState.version && !updateState.readyToInstall && (
              <button
                onClick={handleUpdateClick}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:bg-opacity-20 flex items-center gap-1.5"
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  color: 'var(--rc-cyan)',
                  border: '1px solid var(--rc-cyan)',
                }}
                title={`Click to download ${updateState.version}`}
              >
                <span>{updateState.version} available</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5 10.5H1.5M6 1.5V8.5M6 8.5L3.5 6M6 8.5L8.5 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {updateState.readyToInstall && (
              <button
                onClick={handleRestart}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:bg-opacity-90 flex items-center gap-1.5 animate-pulse"
                style={{
                  background: 'var(--rc-green)',
                  color: 'var(--rc-bg)',
                  border: '1px solid var(--rc-green)',
                }}
                title="Click to restart and install update"
              >
                <span>Restart to update</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C7.466 3 8.335 3.4 9 4M9 2V4H7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
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

      {/* Update Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => !updateState.downloading && setShowModal(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{
              background: 'var(--rc-surface)',
              border: '1px solid var(--rc-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--rc-text)' }}
                >
                  Update Available
                </h3>
                <p className="text-sm" style={{ color: 'var(--rc-text-dim)' }}>
                  Version {updateState.version} is ready to download
                </p>
              </div>
              {!updateState.downloading && (
                <button
                  onClick={() => setShowModal(false)}
                  className="text-xl leading-none"
                  style={{ color: 'var(--rc-text-muted)' }}
                >
                  ×
                </button>
              )}
            </div>

            {updateState.error && (
              <div
                className="mb-4 p-3 rounded-lg text-sm"
                style={{
                  background: 'rgba(255, 51, 102, 0.1)',
                  color: 'var(--rc-red)',
                  border: '1px solid var(--rc-red)',
                }}
              >
                {updateState.error}
              </div>
            )}

            {updateState.downloading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--rc-text-dim)' }}>
                    Downloading...
                  </span>
                  <span className="text-sm font-mono" style={{ color: 'var(--rc-cyan)' }}>
                    {Math.round(updateState.downloadProgress)}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--rc-border)' }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${updateState.downloadProgress}%`,
                      background: 'var(--rc-cyan)',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {!updateState.downloading && !updateState.readyToInstall && (
                <>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: 'transparent',
                      color: 'var(--rc-text-dim)',
                      border: '1px solid var(--rc-border)',
                    }}
                  >
                    Later
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: 'var(--rc-cyan)',
                      color: 'var(--rc-bg)',
                    }}
                  >
                    Download Update
                  </button>
                </>
              )}
              {updateState.readyToInstall && (
                <button
                  onClick={handleRestart}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'var(--rc-green)',
                    color: 'var(--rc-bg)',
                  }}
                >
                  Restart Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
