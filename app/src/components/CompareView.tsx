import { useState, useEffect } from 'react';
import type { Loadout, SlotData } from '../types';

interface Props {
  currentSlots: SlotData[];
  currentMods: { name: string; source: string; enabled: boolean; version?: string }[];
  currentName: string;
  initialLoadout?: unknown;
  onClear?: () => void;
  onClone?: (loadout: Loadout, mode: 'overwrite' | 'new') => void;
}

// Build a diff between current rig and imported loadout
function buildDiff(
  currentSlots: SlotData[],
  currentMods: { name: string; source: string }[],
  imported: Loadout
) {
  const slotDiffs: {
    id: string;
    label: string;
    yours: { component: string; status: string; details: Record<string, unknown> } | null;
    theirs: { component: string; status: string; details: Record<string, unknown> } | null;
    match: boolean;
  }[] = [];

  // All slot IDs from both
  const allSlotIds = new Set([
    ...currentSlots.map((s) => s.id),
    ...Object.keys(imported.slots || {}),
  ]);

  for (const id of allSlotIds) {
    const mine = currentSlots.find((s) => s.id === id);
    const theirs = imported.slots?.[id];

    const match = mine && theirs
      ? mine.component === theirs.component && mine.status === theirs.status
      : !mine && !theirs;

    slotDiffs.push({
      id,
      label: mine?.label || theirs?.label || id,
      yours: mine ? { component: mine.component, status: mine.status, details: mine.details } : null,
      theirs: theirs ? { component: theirs.component, status: theirs.status, details: theirs.details as Record<string, unknown> } : null,
      match,
    });
  }

  // Mod diffs
  const myModNames = new Set(currentMods.map((m) => m.name));
  const theirModNames = new Set((imported.mods || []).map((m) => m.name));
  const onlyYours = [...myModNames].filter((n) => !theirModNames.has(n));
  const onlyTheirs = [...theirModNames].filter((n) => !myModNames.has(n));
  const shared = [...myModNames].filter((n) => theirModNames.has(n));

  return { slotDiffs, onlyYours, onlyTheirs, shared };
}

const statusColor: Record<string, string> = {
  active: 'var(--rc-green)',
  degraded: 'var(--rc-yellow)',
  offline: 'var(--rc-red)',
  empty: 'var(--rc-text-muted)',
};

export function CompareView({ currentSlots, currentMods, currentName, initialLoadout, onClear, onClone }: Props) {
  const [imported, setImported] = useState<Loadout | null>(
    initialLoadout ? (initialLoadout as Loadout) : null
  );
  const [dragOver, setDragOver] = useState(false);

  // Sync when a Feed rig gets passed in
  useEffect(() => {
    if (initialLoadout) {
      setImported(initialLoadout as Loadout);
    }
  }, [initialLoadout]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const loadout = JSON.parse(text) as Loadout;
      if (!loadout.schema || !loadout.slots) {
        throw new Error('Invalid loadout format');
      }
      setImported(loadout);
    } catch {
      console.error('Failed to parse loadout file');
    }
  };

  const handleFileSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.loadout';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const loadout = JSON.parse(text) as Loadout;
        setImported(loadout);
      } catch {
        console.error('Failed to parse loadout file');
      }
    };
    input.click();
  };

  if (!imported) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="w-full max-w-lg p-12 rounded-lg border-2 border-dashed text-center transition-all"
          style={{
            borderColor: dragOver ? 'var(--rc-cyan)' : 'var(--rc-border)',
            background: dragOver ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="text-4xl block mb-4" style={{ color: 'var(--rc-cyan)' }}>⊕</span>
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--rc-text)' }}
          >
            Compare Loadouts
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--rc-text-dim)' }}>
            Drop a .loadout.json file here or click to browse
          </p>
          <button
            onClick={handleFileSelect}
            className="px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
            style={{
              borderColor: 'var(--rc-cyan)',
              color: 'var(--rc-cyan)',
              background: 'transparent',
            }}
          >
            Choose File
          </button>
        </div>
      </div>
    );
  }

  const diff = buildDiff(currentSlots, currentMods, imported);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'var(--rc-text-muted)' }}
            >
              Loadout Comparison
            </h3>
            <p className="text-sm" style={{ color: 'var(--rc-text-dim)' }}>
              <span style={{ color: 'var(--rc-cyan)' }}>{currentName}</span>
              {' vs '}
              <span style={{ color: 'var(--rc-magenta)' }}>{imported.meta?.name || 'Unknown'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {imported && onClone && (
              <>
                <button
                  onClick={() => onClone(imported, 'overwrite')}
                  className="px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                  style={{
                    borderColor: 'var(--rc-cyan)',
                    color: 'var(--rc-bg)',
                    background: 'var(--rc-cyan)',
                  }}
                >
                  Clone to My Rig
                </button>
                <button
                  onClick={() => onClone(imported, 'new')}
                  className="px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
                  style={{
                    borderColor: 'var(--rc-magenta)',
                    color: 'var(--rc-magenta)',
                    background: 'transparent',
                  }}
                >
                  Save as New Build
                </button>
              </>
            )}
            <button
              onClick={() => { setImported(null); onClear?.(); }}
              className="px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--rc-border)',
                color: 'var(--rc-text-dim)',
                background: 'transparent',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--rc-text-muted)' }}>
            Slot
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--rc-cyan)' }}>
            Your Rig
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--rc-magenta)' }}>
            Their Rig
          </div>
        </div>

        {/* Slot comparisons */}
        <div className="space-y-2 mb-8">
          {diff.slotDiffs.map((sd) => (
            <div
              key={sd.id}
              className="grid grid-cols-[1fr_1fr_1fr] gap-4 py-3 px-4 rounded"
              style={{
                background: sd.match ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                border: sd.match ? 'none' : '1px solid var(--rc-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase" style={{ color: 'var(--rc-text)' }}>
                  {sd.label}
                </span>
                {sd.match && (
                  <span className="text-[10px]" style={{ color: 'var(--rc-green)' }}>✓</span>
                )}
              </div>
              <div className="text-center">
                {sd.yours ? (
                  <div>
                    <span className="text-xs font-mono" style={{ color: 'var(--rc-cyan)' }}>
                      {sd.yours.component}
                    </span>
                    <div
                      className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                      style={{ backgroundColor: statusColor[sd.yours.status] || 'var(--rc-text-muted)' }}
                    />
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--rc-text-muted)' }}>—</span>
                )}
              </div>
              <div className="text-center">
                {sd.theirs ? (
                  <div>
                    <span className="text-xs font-mono" style={{ color: 'var(--rc-magenta)' }}>
                      {sd.theirs.component}
                    </span>
                    <div
                      className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                      style={{ backgroundColor: statusColor[sd.theirs.status] || 'var(--rc-text-muted)' }}
                    />
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--rc-text-muted)' }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mod diffs */}
        <div className="grid grid-cols-3 gap-6">
          {diff.shared.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--rc-green)' }}>
                Shared ({diff.shared.length})
              </h4>
              <div className="space-y-1">
                {diff.shared.map((name) => (
                  <div key={name} className="text-xs py-1 px-2 rounded" style={{ background: 'rgba(0,255,136,0.05)', color: 'var(--rc-text-dim)' }}>
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
          {diff.onlyYours.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--rc-cyan)' }}>
                Only Yours ({diff.onlyYours.length})
              </h4>
              <div className="space-y-1">
                {diff.onlyYours.map((name) => (
                  <div key={name} className="text-xs py-1 px-2 rounded" style={{ background: 'rgba(0,240,255,0.05)', color: 'var(--rc-cyan)' }}>
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
          {diff.onlyTheirs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--rc-magenta)' }}>
                Only Theirs ({diff.onlyTheirs.length})
              </h4>
              <div className="space-y-1">
                {diff.onlyTheirs.map((name) => (
                  <div key={name} className="text-xs py-1 px-2 rounded" style={{ background: 'rgba(255,0,170,0.05)', color: 'var(--rc-magenta)' }}>
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
