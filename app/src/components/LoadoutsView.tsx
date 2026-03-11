import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useBuilds } from '../hooks/useTauri';

interface Props {
  onCompare?: (loadout: unknown) => void;
  onApply?: (loadout: unknown) => void;
}

export function LoadoutsView({ onCompare, onApply }: Props) {
  const { data: builds, loading, refresh } = useBuilds();
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null);
  const [loadoutCache, setLoadoutCache] = useState<Record<string, unknown>>({});

  const saveCurrentRig = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const loadout = await invoke<Record<string, unknown>>('export_loadout');
      // Override the name
      const named = {
        ...loadout,
        meta: { ...(loadout.meta as Record<string, unknown> || {}), name: saveName.trim() },
      };
      await invoke('clone_loadout', {
        loadoutJson: JSON.stringify(named),
        mode: 'new',
      });
      setShowSaveDialog(false);
      setSaveName('');
      refresh();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const loadBuild = async (path: string) => {
    if (loadoutCache[path]) return loadoutCache[path];
    try {
      const content = await invoke<string>('read_workspace_file', {
        relativePath: path,
      });
      const parsed = JSON.parse(content);
      setLoadoutCache((prev) => ({ ...prev, [path]: parsed }));
      return parsed;
    } catch {
      // Try absolute path read
      try {
        const content = await invoke<string>('read_file_absolute', { path });
        const parsed = JSON.parse(content);
        setLoadoutCache((prev) => ({ ...prev, [path]: parsed }));
        return parsed;
      } catch {
        console.error('Failed to load build:', path);
        return null;
      }
    }
  };

  const handleExpand = async (filename: string, path: string) => {
    if (expandedBuild === filename) {
      setExpandedBuild(null);
      return;
    }
    await loadBuild(path);
    setExpandedBuild(filename);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'var(--rc-text-muted)' }}
            >
              Saved Loadouts
              {loading && (
                <span className="ml-2 animate-pulse" style={{ color: 'var(--rc-cyan)' }}>●</span>
              )}
            </h3>
            <p className="text-xs" style={{ color: 'var(--rc-text-dim)' }}>
              {builds.length} build{builds.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-80"
            style={{
              background: 'var(--rc-cyan)',
              color: 'var(--rc-bg)',
            }}
          >
            + Save Current Rig
          </button>
        </div>

        {/* Save dialog */}
        {showSaveDialog && (
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{ borderColor: 'var(--rc-cyan)', background: 'rgba(0, 240, 255, 0.03)' }}
          >
            <label
              className="text-xs font-semibold uppercase tracking-wider block mb-2"
              style={{ color: 'var(--rc-cyan)' }}
            >
              Name this build
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCurrentRig()}
                placeholder="e.g. Production, Experimental, Lean Ops..."
                className="flex-1 px-3 py-2 rounded text-xs border"
                style={{
                  background: 'var(--rc-bg)',
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text)',
                }}
                autoFocus
              />
              <button
                onClick={saveCurrentRig}
                disabled={saving || !saveName.trim()}
                className="px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-80 disabled:opacity-30"
                style={{
                  background: 'var(--rc-cyan)',
                  color: 'var(--rc-bg)',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setShowSaveDialog(false); setSaveName(''); }}
                className="px-3 py-2 rounded text-xs transition-all hover:opacity-80"
                style={{ color: 'var(--rc-text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && builds.length === 0 && (
          <div
            className="text-center py-16 rounded-lg border border-dashed"
            style={{ borderColor: 'var(--rc-border)' }}
          >
            <span className="text-3xl block mb-3" style={{ color: 'var(--rc-text-muted)' }}>⬡</span>
            <p className="text-xs" style={{ color: 'var(--rc-text-dim)' }}>
              No saved builds yet. Save your current rig or clone one from the Feed.
            </p>
          </div>
        )}

        {/* Builds list */}
        <div className="space-y-2">
          {builds.map((build) => {
            const expanded = expandedBuild === build.filename;
            const cached = loadoutCache[build.path];

            return (
              <div
                key={build.filename}
                className="rounded-lg border transition-all"
                style={{
                  borderColor: expanded ? 'var(--rc-cyan)' : 'var(--rc-border)',
                  background: expanded ? 'rgba(0, 240, 255, 0.02)' : 'var(--rc-surface)',
                }}
              >
                {/* Build header */}
                <button
                  onClick={() => handleExpand(build.filename, build.path)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'rgba(0, 240, 255, 0.08)',
                        color: 'var(--rc-cyan)',
                        border: '1px solid var(--rc-cyan-dim)',
                      }}
                    >
                      ⬡
                    </span>
                    <div>
                      <span
                        className="text-sm font-semibold block"
                        style={{ color: 'var(--rc-text)' }}
                      >
                        {build.name}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                        {build.slots} slots · {build.mods} mods
                        {build.exportedAt && (
                          <> · {new Date(build.exportedAt).toLocaleDateString()}</>
                        )}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-xs transition-transform"
                    style={{
                      color: 'var(--rc-text-muted)',
                      transform: expanded ? 'rotate(90deg)' : 'none',
                    }}
                  >
                    ▸
                  </span>
                </button>

                {/* Expanded detail */}
                {expanded && cached != null && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--rc-border)' }}>
                    {/* Slot summary */}
                    <div className="mt-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries((cached as Record<string, unknown>).slots || {}).map(
                          ([id, slot]) => {
                            const s = slot as Record<string, unknown>;
                            return (
                              <span
                                key={id}
                                className="px-2 py-1 rounded text-[10px] font-mono"
                                style={{
                                  background: 'rgba(0, 240, 255, 0.05)',
                                  color: 'var(--rc-text-dim)',
                                  border: '1px solid var(--rc-border)',
                                }}
                              >
                                {String(s.label || id)}: {String(s.component || '?')}
                              </span>
                            );
                          },
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {onApply && (
                        <button
                          onClick={() => onApply(cached)}
                          className="px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                          style={{
                            borderColor: 'var(--rc-cyan)',
                            color: 'var(--rc-bg)',
                            background: 'var(--rc-cyan)',
                          }}
                        >
                          Apply to My Rig
                        </button>
                      )}
                      {onCompare && (
                        <button
                          onClick={() => onCompare(cached)}
                          className="px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                          style={{
                            borderColor: 'var(--rc-magenta)',
                            color: 'var(--rc-magenta)',
                            background: 'transparent',
                          }}
                        >
                          Compare
                        </button>
                      )}
                      <span className="flex-1" />
                      <span
                        className="text-[10px] self-center font-mono"
                        style={{ color: 'var(--rc-text-muted)' }}
                      >
                        {build.filename}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
