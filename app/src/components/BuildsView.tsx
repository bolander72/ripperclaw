import { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useBuilds } from '../hooks/useTauri';

interface Props {
  onCompare?: (build: unknown) => void;
  onApply?: (build: unknown) => void;
}

export function BuildsView({ onCompare, onApply }: Props) {
  const { data: builds, loading, refresh } = useBuilds();
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null);
  const [buildCache, setBuildCache] = useState<Record<string, unknown>>({});
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const saveCurrentBuild = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const build = await invoke<Record<string, unknown>>('export_build');
      // Override the name
      const named = {
        ...build,
        meta: { ...(build.meta as Record<string, unknown> || {}), name: saveName.trim() },
      };
      await invoke('clone_build', {
        buildJson: JSON.stringify(named),
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
    if (buildCache[path]) return buildCache[path];
    try {
      const content = await invoke<string>('read_workspace_file', {
        relativePath: path,
      });
      const parsed = JSON.parse(content);
      setBuildCache((prev) => ({ ...prev, [path]: parsed }));
      return parsed;
    } catch {
      // Try absolute path read
      try {
        const content = await invoke<string>('read_file_absolute', { path });
        const parsed = JSON.parse(content);
        setBuildCache((prev) => ({ ...prev, [path]: parsed }));
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

  const handleFileImport = async (file: File) => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const text = await file.text();
      // Validate JSON
      const parsed = JSON.parse(text);
      // Check for v3 (top-level sections) or v2 (blocks wrapper)
      const hasSections = ['model', 'persona', 'skills', 'integrations', 'automations', 'memory']
        .some(k => parsed[k] != null);
      if (!hasSections && !parsed.blocks) {
        setImportError("File doesn't look like a valid build");
        return;
      }
      // Save via clone_build in "new" mode
      await invoke('clone_build', {
        buildJson: text,
        mode: 'new',
        agentId: null,
      });
      setImportSuccess(`Imported "${parsed.meta?.name || file.name}"`);
      setTimeout(() => setImportSuccess(null), 4000);
      refresh();
    } catch (err) {
      setImportError(`Import failed: ${err instanceof SyntaxError ? 'Invalid JSON' : String(err)}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.json') || file.type === 'application/json')) {
      handleFileImport(file);
    } else {
      setImportError('Please drop a .json build file');
    }
  };

  return (
    <div
      className="flex-1 p-6 overflow-y-auto"
      ref={dropZoneRef}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        outline: dragging ? '2px dashed var(--rc-cyan)' : 'none',
        outlineOffset: '-4px',
      }}
    >
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'var(--rc-text-muted)' }}
            >
              Saved Builds
              {loading && (
                <span className="ml-2 animate-pulse" style={{ color: 'var(--rc-cyan)' }}>●</span>
              )}
            </h3>
            <p className="text-xs" style={{ color: 'var(--rc-text-dim)' }}>
              {builds.length} build{builds.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--rc-border)',
                color: 'var(--rc-text-muted)',
                background: 'transparent',
              }}
            >
              Import File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileImport(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-80"
              style={{
                background: 'var(--rc-cyan)',
                color: 'var(--rc-bg)',
              }}
            >
              + Save Current Build
            </button>
          </div>
        </div>

        {/* Import feedback */}
        {importError && (
          <div className="mb-4 p-3 rounded-lg text-xs border" style={{ borderColor: 'var(--rc-red)', color: 'var(--rc-red)', background: 'rgba(255,50,50,0.05)' }}>
            {importError}
          </div>
        )}
        {importSuccess && (
          <div className="mb-4 p-3 rounded-lg text-xs border" style={{ borderColor: 'var(--rc-green)', color: 'var(--rc-green)', background: 'rgba(0,255,100,0.05)' }}>
            ✓ {importSuccess}
          </div>
        )}

        {/* Drop zone hint when dragging */}
        {dragging && (
          <div
            className="mb-4 p-8 rounded-lg border-2 border-dashed text-center"
            style={{ borderColor: 'var(--rc-cyan)', background: 'var(--rc-overlay-accent)' }}
          >
            <span className="text-2xl block mb-2" style={{ color: 'var(--rc-cyan)' }}>⬡</span>
            <p className="text-xs font-semibold" style={{ color: 'var(--rc-cyan)' }}>
              Drop build file here
            </p>
          </div>
        )}

        {/* Save dialog */}
        {showSaveDialog && (
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{ borderColor: 'var(--rc-cyan)', background: 'var(--rc-overlay-accent)' }}
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
                onKeyDown={(e) => e.key === 'Enter' && saveCurrentBuild()}
                placeholder="e.g. Production, Experimental, Lean Ops..."
                className="flex-1 px-3 py-2 rounded-xl text-xs border"
                style={{
                  background: 'var(--rc-bg)',
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text)',
                }}
                autoFocus
              />
              <button
                onClick={saveCurrentBuild}
                disabled={saving || !saveName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-80 disabled:opacity-30"
                style={{
                  background: 'var(--rc-cyan)',
                  color: 'var(--rc-bg)',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setShowSaveDialog(false); setSaveName(''); }}
                className="px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
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
              No saved builds yet. Save your current config, import a file, or grab one from the Feed.
            </p>
            <p className="text-[10px] mt-2" style={{ color: 'var(--rc-text-muted)' }}>
              Drag & drop a .json build file anywhere on this page
            </p>
          </div>
        )}

        {/* Builds list */}
        <div className="space-y-2">
          {builds.map((entry) => {
            const expanded = expandedBuild === entry.filename;
            const cached = buildCache[entry.path];

            return (
              <div
                key={entry.filename}
                className="rounded-lg border transition-all"
                style={{
                  borderColor: expanded ? 'var(--rc-cyan)' : 'var(--rc-border)',
                  background: expanded ? 'var(--rc-overlay-accent)' : 'var(--rc-surface)',
                }}
              >
                {/* Build header */}
                <button
                  onClick={() => handleExpand(entry.filename, entry.path)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'var(--rc-overlay-active)',
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
                        {entry.name}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--rc-text-muted)' }}>
                        {entry.skills} skills
                        {entry.exportedAt && (
                          <> · {new Date(entry.exportedAt).toLocaleDateString()}</>
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
                    {/* Section summary */}
                    <div className="mt-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        {['model', 'persona', 'skills', 'integrations', 'automations', 'memory']
                          .filter(id => (cached as Record<string, unknown>)[id] != null)
                          .map((id) => {
                            const s = (cached as Record<string, unknown>)[id] as Record<string, unknown>;
                            return (
                              <span
                                key={id}
                                className="px-2 py-1 rounded-xl text-[10px] font-mono"
                                style={{
                                  background: 'var(--rc-overlay-accent)',
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
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                          style={{
                            borderColor: 'var(--rc-cyan)',
                            color: 'var(--rc-bg)',
                            background: 'var(--rc-cyan)',
                          }}
                        >
                          Apply to Agent
                        </button>
                      )}
                      {onCompare && (
                        <button
                          onClick={() => onCompare(cached)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
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
                        {entry.filename}
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
