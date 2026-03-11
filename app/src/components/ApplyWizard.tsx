import { useState, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AgentInfo } from '../hooks/useTauri';

// ── Types ──

interface LoadoutSlot {
  items?: Array<{
    name: string;
    source?: string;
    version?: string;
    requiresConfig?: boolean;
    type?: string;
    provider?: string;
    autoApply?: boolean;
    docsUrl?: string;
  }>;
  tiers?: Record<string, {
    provider: string;
    model: string;
    alias?: string;
    paid?: boolean;
    local?: boolean;
  }>;
  identity?: { name?: string; creature?: string; vibe?: string };
  soul?: { included?: boolean; content?: string; tokenEstimate?: number };
  agents?: { included?: boolean; content?: string };
  user?: { included?: boolean };
  heartbeat?: { included?: boolean; content?: string; taskCount?: number };
  structure?: {
    directories?: string[];
    templateFiles?: Array<{ path: string; content: string }>;
  };
  engine?: { type?: string; description?: string };
}

interface Loadout {
  schema: number;
  meta: {
    name: string;
    agentName?: string;
    description?: string;
    author: string;
    version: number;
    exportedAt: string;
  };
  slots: Record<string, LoadoutSlot>;
}

interface ApplyAction {
  type: string;
  slot: string;
  description: string;
  status: 'pending' | 'applying' | 'done' | 'error' | 'skipped';
  error?: string;
  detail?: string;
}

type Step = 'target' | 'review' | 'applying' | 'done';

const SLOT_META: Record<string, { icon: string; label: string; color: string }> = {
  model: { icon: '⬢', label: 'Model', color: '#00f0ff' },
  persona: { icon: '◈', label: 'Persona', color: '#ff6b9d' },
  skills: { icon: '◆', label: 'Skills', color: '#00ff88' },
  integrations: { icon: '⊕', label: 'Integrations', color: '#ffd700' },
  automations: { icon: '⏱', label: 'Automations', color: '#ff6b35' },
  memory: { icon: '◎', label: 'Memory', color: '#b388ff' },
};

// ── Component ──

interface Props {
  loadout: Loadout;
  agents: AgentInfo[];
  onClose: () => void;
  onComplete: () => void;
}

export function ApplyWizard({ loadout, agents, onClose, onComplete }: Props) {
  const [step, setStep] = useState<Step>('target');
  const [agentId, setAgentId] = useState('');
  const [agentName, setAgentName] = useState(loadout.meta.agentName || '');
  const [useMyModels, setUseMyModels] = useState(true);
  const [actions, setActions] = useState<ApplyAction[]>([]);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Generate preview actions
  const previewActions = useMemo(() => {
    const acts: ApplyAction[] = [];

    // Model
    const modelSlot = loadout.slots?.model;
    if (modelSlot?.tiers) {
      const tierCount = Object.keys(modelSlot.tiers).length;
      acts.push({
        type: 'set-model',
        slot: 'model',
        description: useMyModels
          ? `Use your existing models (${tierCount} tiers)`
          : `Set ${tierCount} model tier${tierCount > 1 ? 's' : ''}: ${Object.entries(modelSlot.tiers).map(([t, v]) => `${t}=${v.alias || v.model}`).join(', ')}`,
        status: 'pending',
      });
    }

    // Persona
    const personaSlot = loadout.slots?.persona;
    if (personaSlot) {
      if (personaSlot.identity) {
        acts.push({
          type: 'write-identity',
          slot: 'persona',
          description: `Create IDENTITY.md (${personaSlot.identity.name || 'unnamed'})`,
          status: 'pending',
        });
      }
      if (personaSlot.soul?.included) {
        acts.push({
          type: 'write-soul',
          slot: 'persona',
          description: `Write SOUL.md (~${personaSlot.soul.tokenEstimate || '?'} tokens)`,
          status: 'pending',
          detail: '⚠️ This defines the agent\'s personality and behavior',
        });
      }
      if (personaSlot.agents?.included) {
        acts.push({
          type: 'write-agents',
          slot: 'persona',
          description: 'Write AGENTS.md (workspace instructions)',
          status: 'pending',
        });
      }
    }

    // Skills
    const skillsSlot = loadout.slots?.skills;
    if (skillsSlot?.items?.length) {
      const bundled = skillsSlot.items.filter(s => s.source === 'bundled');
      const clawhub = skillsSlot.items.filter(s => s.source === 'clawhub');
      if (bundled.length) {
        acts.push({
          type: 'enable-skills',
          slot: 'skills',
          description: `Enable ${bundled.length} bundled skill${bundled.length > 1 ? 's' : ''}`,
          status: 'pending',
        });
      }
      if (clawhub.length) {
        acts.push({
          type: 'install-skills',
          slot: 'skills',
          description: `Install ${clawhub.length} skill${clawhub.length > 1 ? 's' : ''} from ClawHub`,
          status: 'pending',
          detail: clawhub.map(s => s.name).join(', '),
        });
      }
    }

    // Integrations
    const intSlot = loadout.slots?.integrations;
    if (intSlot?.items?.length) {
      acts.push({
        type: 'flag-integrations',
        slot: 'integrations',
        description: `${intSlot.items.length} integration${intSlot.items.length > 1 ? 's' : ''} require manual setup`,
        status: 'pending',
        detail: intSlot.items.map(i => i.name).join(', '),
      });
    }

    // Automations
    const autoSlot = loadout.slots?.automations;
    if (autoSlot?.heartbeat?.included) {
      acts.push({
        type: 'write-heartbeat',
        slot: 'automations',
        description: `Write HEARTBEAT.md (${autoSlot.heartbeat.taskCount || 0} tasks)`,
        status: 'pending',
      });
    }

    // Memory
    const memSlot = loadout.slots?.memory;
    if (memSlot?.structure) {
      const dirs = memSlot.structure.directories?.length || 0;
      const files = memSlot.structure.templateFiles?.length || 0;
      acts.push({
        type: 'create-memory',
        slot: 'memory',
        description: `Create memory structure (${dirs} dirs, ${files} templates)`,
        status: 'pending',
      });
    }

    return acts;
  }, [loadout, useMyModels]);

  // Validate agent id
  const agentIdValid = agentId.length >= 2 && /^[a-z0-9_-]+$/.test(agentId);
  const agentExists = agents.some(a => a.id === agentId);

  const handleApply = async () => {
    if (!agentIdValid) return;

    setStep('applying');
    setActions(previewActions.map(a => ({ ...a })));
    setApplyError(null);

    try {
      // Call the Tauri backend to apply
      const result = await invoke<{
        ok: boolean;
        results: Array<{ type: string; status: string; error?: string }>;
        warnings: string[];
        workspace: string;
      }>('apply_loadout', {
        loadoutJson: JSON.stringify(loadout),
        agentId,
        agentName: agentName || agentId,
        useMyModels,
      });

      if (result.ok) {
        // Update action statuses from results
        setActions(prev => prev.map((action, i) => ({
          ...action,
          status: result.results[i]?.status === 'error' ? 'error' : 'done',
          error: result.results[i]?.error,
        })));
        setStep('done');
      } else {
        setApplyError('Apply failed — check results for details');
        setActions(prev => prev.map((action, i) => ({
          ...action,
          status: result.results[i]?.status === 'error' ? 'error' : 'done',
          error: result.results[i]?.error,
        })));
        setStep('done');
      }
    } catch (err) {
      setApplyError(String(err));
      setStep('done');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl border"
        style={{
          background: 'var(--rc-bg)',
          borderColor: 'var(--rc-cyan)',
          boxShadow: '0 0 40px rgba(0, 240, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--rc-border)' }}
        >
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--rc-cyan)' }}>
              Apply Loadout
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--rc-text-muted)' }}>
              {loadout.meta.name} {loadout.meta.author !== 'local' && `by ${loadout.meta.author}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'var(--rc-text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Step: Target */}
        {step === 'target' && (
          <div className="p-6 space-y-6">
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-2"
                style={{ color: 'var(--rc-text-muted)' }}
              >
                Agent ID
              </label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="e.g. dev-bot, assistant-2, test"
                className="w-full px-3 py-2 rounded text-sm border font-mono"
                style={{
                  background: 'var(--rc-surface)',
                  borderColor: agentExists ? 'var(--rc-red)' : agentIdValid ? 'var(--rc-cyan)' : 'var(--rc-border)',
                  color: 'var(--rc-text)',
                }}
                autoFocus
              />
              {agentExists && (
                <p className="text-xs mt-1" style={{ color: 'var(--rc-red)' }}>
                  Agent "{agentId}" already exists. Choose a different ID.
                </p>
              )}
              {!agentIdValid && agentId.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--rc-text-dim)' }}>
                  Use lowercase letters, numbers, hyphens, underscores (min 2 chars)
                </p>
              )}
            </div>

            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-2"
                style={{ color: 'var(--rc-text-muted)' }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={agentId || 'Agent name'}
                className="w-full px-3 py-2 rounded text-sm border"
                style={{
                  background: 'var(--rc-surface)',
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text)',
                }}
              />
            </div>

            {/* Model preference */}
            <div
              className="p-4 rounded-lg border"
              style={{ borderColor: 'var(--rc-border)', background: 'var(--rc-surface)' }}
            >
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-3"
                style={{ color: 'var(--rc-text-muted)' }}
              >
                Model Strategy
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={useMyModels}
                    onChange={() => setUseMyModels(true)}
                    className="accent-[#00f0ff]"
                  />
                  <div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--rc-text)' }}>
                      Use my models
                    </span>
                    <p className="text-[10px]" style={{ color: 'var(--rc-text-dim)' }}>
                      Map loadout tiers to your existing model config
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useMyModels}
                    onChange={() => setUseMyModels(false)}
                    className="accent-[#00f0ff]"
                  />
                  <div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--rc-text)' }}>
                      Use loadout models
                    </span>
                    <p className="text-[10px]" style={{ color: 'var(--rc-text-dim)' }}>
                      Copy exact model config from loadout (may require API keys)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep('review')}
              disabled={!agentIdValid || agentExists}
              className="w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-30"
              style={{
                background: 'var(--rc-cyan)',
                color: 'var(--rc-bg)',
              }}
            >
              Review Changes →
            </button>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="p-6 space-y-4">
            <div
              className="p-3 rounded-lg border"
              style={{ borderColor: 'var(--rc-border)', background: 'var(--rc-surface)' }}
            >
              <p className="text-xs" style={{ color: 'var(--rc-text-muted)' }}>
                Creating agent <span className="font-mono font-bold" style={{ color: 'var(--rc-cyan)' }}>{agentId}</span>
                {agentName && <> ({agentName})</>}
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--rc-text-dim)' }}>
                Workspace: ~/.openclaw/agents/{agentId}/
              </p>
            </div>

            {/* Slot-by-slot action list */}
            {Object.keys(SLOT_META).map(slotKey => {
              const slotActions = previewActions.filter(a => a.slot === slotKey);
              if (slotActions.length === 0) return null;
              const meta = SLOT_META[slotKey];

              return (
                <div key={slotKey}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="space-y-1 ml-5">
                    {slotActions.map((action, i) => (
                      <div key={i} className="text-xs" style={{ color: 'var(--rc-text)' }}>
                        <span className="mr-2" style={{ color: 'var(--rc-text-dim)' }}>→</span>
                        {action.description}
                        {action.detail && (
                          <p className="ml-4 text-[10px] mt-0.5" style={{ color: 'var(--rc-text-dim)' }}>
                            {action.detail}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep('target')}
                className="flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all hover:opacity-80"
                style={{
                  borderColor: 'var(--rc-border)',
                  color: 'var(--rc-text-muted)',
                  background: 'transparent',
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90"
                style={{
                  background: 'var(--rc-cyan)',
                  color: 'var(--rc-bg)',
                }}
              >
                Apply Loadout
              </button>
            </div>
          </div>
        )}

        {/* Step: Applying */}
        {step === 'applying' && (
          <div className="p-6 space-y-4">
            <div className="text-center py-4">
              <span className="text-2xl animate-pulse" style={{ color: 'var(--rc-cyan)' }}>⬡</span>
              <p className="text-xs mt-3 font-semibold" style={{ color: 'var(--rc-cyan)' }}>
                Applying loadout...
              </p>
            </div>
            <div className="space-y-1">
              {actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                  style={{ background: 'var(--rc-surface)' }}
                >
                  <span>
                    {action.status === 'done' && '✅'}
                    {action.status === 'applying' && '⏳'}
                    {action.status === 'pending' && '○'}
                    {action.status === 'error' && '❌'}
                    {action.status === 'skipped' && '⏭'}
                  </span>
                  <span style={{ color: 'var(--rc-text)' }}>{action.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="p-6 space-y-4">
            <div className="text-center py-4">
              <span className="text-3xl">{applyError ? '⚠️' : '✅'}</span>
              <p
                className="text-sm mt-3 font-bold"
                style={{ color: applyError ? 'var(--rc-red)' : 'var(--rc-green)' }}
              >
                {applyError ? 'Apply completed with issues' : `Agent "${agentId}" created!`}
              </p>
              {applyError && (
                <p className="text-xs mt-2" style={{ color: 'var(--rc-text-dim)' }}>
                  {applyError}
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--rc-text-muted)' }}>
                Restart OpenClaw to activate: <code className="font-mono" style={{ color: 'var(--rc-cyan)' }}>openclaw gateway restart</code>
              </p>
            </div>

            {/* Results */}
            <div className="space-y-1">
              {actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                  style={{ background: 'var(--rc-surface)' }}
                >
                  <span>
                    {action.status === 'done' && '✅'}
                    {action.status === 'error' && '❌'}
                    {action.status === 'skipped' && '⏭'}
                  </span>
                  <span style={{ color: action.status === 'error' ? 'var(--rc-red)' : 'var(--rc-text)' }}>
                    {action.description}
                    {action.error && ` — ${action.error}`}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90"
              style={{
                background: 'var(--rc-cyan)',
                color: 'var(--rc-bg)',
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
