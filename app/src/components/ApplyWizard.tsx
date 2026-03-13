import { useState, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AgentInfo } from '../hooks/useTauri';
import type { SecurityFinding, DependenciesConfig } from '../types';

// ── Types ──

interface BuildSection {
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

interface Build {
  schema: number;
  meta: {
    name: string;
    agentName?: string;
    description?: string;
    author: string;
    version: number;
    exportedAt: string;
  };
  model?: BuildSection; persona?: BuildSection; skills?: BuildSection; integrations?: BuildSection; automations?: BuildSection; memory?: BuildSection;
  dependencies?: DependenciesConfig;
}

interface ApplyAction {
  type: string;
  section: string;
  description: string;
  status: 'pending' | 'applying' | 'done' | 'error' | 'skipped';
  error?: string;
  detail?: string;
}

interface ValidationResult {
  valid: boolean;
  schema: number;
  errors?: string[];
}

type Step = 'target' | 'security' | 'dependencies' | 'review' | 'applying' | 'done';

// Inline label helper (no fixed categories)
function getKeyLabel(key: string): { label: string; emoji: string } {
  const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/[-_]/g, ' ');
  return { label, emoji: '📦' };
}

// ── Component ──

interface Props {
  build: Build;
  agents: AgentInfo[];
  onClose: () => void;
  onComplete: () => void;
}

export function ApplyWizard({ build, agents, onClose, onComplete }: Props) {
  const [step, setStep] = useState<Step>('target');
  const [agentId, setAgentId] = useState('');
  const [agentName, setAgentName] = useState(build.meta.agentName || '');
  const [useMyModels, setUseMyModels] = useState(true);
  const [actions, setActions] = useState<ApplyAction[]>([]);
  const [applyError, setApplyError] = useState<string | null>(null);
  
  // Security state
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>([]);
  const [trustScore, setTrustScore] = useState(100);
  const [isBlocked, setIsBlocked] = useState(false);

  // Generate preview actions
  const previewActions = useMemo(() => {
    const acts: ApplyAction[] = [];

    // Model
    const modelSlot = build.model;
    if (modelSlot?.tiers) {
      const tierCount = Object.keys(modelSlot.tiers).length;
      acts.push({
        type: 'set-model',
        section: 'model',
        description: useMyModels
          ? `Use your existing models (${tierCount} tiers)`
          : `Set ${tierCount} model tier${tierCount > 1 ? 's' : ''}: ${Object.entries(modelSlot.tiers).map(([t, v]) => `${t}=${v.alias || v.model}`).join(', ')}`,
        status: 'pending',
      });
    }

    // Persona
    const personaSlot = build.persona;
    if (personaSlot) {
      if (personaSlot.identity) {
        acts.push({
          type: 'write-identity',
          section: 'persona',
          description: `Create IDENTITY.md (${personaSlot.identity.name || 'unnamed'})`,
          status: 'pending',
        });
      }
      if (personaSlot.soul?.included) {
        acts.push({
          type: 'write-soul',
          section: 'persona',
          description: `Write SOUL.md (~${personaSlot.soul.tokenEstimate || '?'} tokens)`,
          status: 'pending',
          detail: '⚠️ This defines the agent\'s personality and behavior',
        });
      }
      if (personaSlot.agents?.included) {
        acts.push({
          type: 'write-agents',
          section: 'persona',
          description: 'Write AGENTS.md (workspace instructions)',
          status: 'pending',
        });
      }
    }

    // Skills
    const skillsSlot = build.skills;
    if (skillsSlot?.items?.length) {
      const bundled = skillsSlot.items.filter(s => s.source === 'bundled');
      const clawhub = skillsSlot.items.filter(s => s.source === 'clawhub');
      if (bundled.length) {
        acts.push({
          type: 'enable-skills',
          section: 'skills',
          description: `Enable ${bundled.length} bundled skill${bundled.length > 1 ? 's' : ''}`,
          status: 'pending',
        });
      }
      if (clawhub.length) {
        acts.push({
          type: 'install-skills',
          section: 'skills',
          description: `Install ${clawhub.length} skill${clawhub.length > 1 ? 's' : ''} from ClawHub`,
          status: 'pending',
          detail: clawhub.map(s => s.name).join(', '),
        });
      }
    }

    // Integrations
    const intSlot = build.integrations;
    if (intSlot?.items?.length) {
      acts.push({
        type: 'flag-integrations',
        section: 'integrations',
        description: `${intSlot.items.length} integration${intSlot.items.length > 1 ? 's' : ''} require manual setup`,
        status: 'pending',
        detail: intSlot.items.map(i => i.name).join(', '),
      });
    }

    // Automations
    const autoSlot = build.automations;
    if (autoSlot?.heartbeat?.included) {
      acts.push({
        type: 'write-heartbeat',
        section: 'automations',
        description: `Write HEARTBEAT.md (${autoSlot.heartbeat.taskCount || 0} tasks)`,
        status: 'pending',
      });
    }

    // Memory
    const memSlot = build.memory;
    if (memSlot?.structure) {
      const dirs = memSlot.structure.directories?.length || 0;
      const files = memSlot.structure.templateFiles?.length || 0;
      acts.push({
        type: 'create-memory',
        section: 'memory',
        description: `Create memory structure (${dirs} dirs, ${files} templates)`,
        status: 'pending',
      });
    }

    return acts;
  }, [build, useMyModels]);

  // Security scanning when entering security step
  useEffect(() => {
    if (step === 'security') {
      performSecurityScan();
    }
  }, [step]);

  const performSecurityScan = async () => {
    const findings: SecurityFinding[] = [];
    let score = 100;

    // Validate build schema
    try {
      const result = await invoke<ValidationResult>('validate_build', {
        buildJson: JSON.stringify(build),
      });
      setValidationResult(result);
      
      if (!result.valid && result.errors) {
        for (const error of result.errors) {
          findings.push({
            severity: 'warn',
            category: 'automation',
            location: 'build schema',
            message: error,
          });
          score -= 15;
        }
      }
    } catch (err) {
      setValidationResult({ valid: false, schema: build.schema, errors: [String(err)] });
    }

    // Scan automations for shell commands
    const automations = build.automations;
    if (automations?.heartbeat?.content) {
      const content = automations.heartbeat.content;
      const shellPatterns = [
        { pattern: /\bexec\b/gi, name: 'exec' },
        { pattern: /\brm\s+/gi, name: 'rm' },
        { pattern: /\bcurl\b/gi, name: 'curl' },
        { pattern: /\bwget\b/gi, name: 'wget' },
        { pattern: /\beval\b/gi, name: 'eval' },
        { pattern: /\bsudo\b/gi, name: 'sudo' },
        { pattern: /\|/g, name: 'pipe' },
      ];

      for (const { pattern, name } of shellPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          findings.push({
            severity: name === 'rm' || name === 'eval' || name === 'sudo' ? 'block' : 'warn',
            category: 'automation',
            location: 'automations.heartbeat',
            message: `Shell command detected: ${name}`,
            pattern: name,
          });
          score -= name === 'rm' || name === 'eval' || name === 'sudo' ? 30 : 15;
        }
      }
    }

    // Scan persona for prompt injection patterns
    const persona = build.persona;
    const promptInjectionPatterns = [
      { pattern: /\bignore\s+(previous|all|above)\b/gi, name: 'ignore instruction' },
      { pattern: /\bdisregard\b/gi, name: 'disregard' },
      { pattern: /\bforget\s+(everything|all|previous)\b/gi, name: 'forget instruction' },
      { pattern: /\boverride\s+(system|previous)\b/gi, name: 'override' },
      { pattern: /\bsystem\s+prompt\b/gi, name: 'system prompt reference' },
    ];

    for (const field of [persona?.soul?.content, persona?.agents?.content]) {
      if (field) {
        for (const { pattern, name } of promptInjectionPatterns) {
          const matches = field.match(pattern);
          if (matches) {
            findings.push({
              severity: 'warn',
              category: 'prompt-injection',
              location: 'persona',
              message: `Potential prompt injection: ${name}`,
              pattern: name,
            });
            score -= 15;
          }
        }
      }
    }

    // Scan for PII patterns in all string values
    const piiPatterns = [
      { pattern: /\b[\w.-]+@[\w.-]+\.\w+\b/g, name: 'email address' },
      { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, name: 'phone number' },
      { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, name: 'IP address' },
      { pattern: /\/(Users|home)\/[\w.-]+/g, name: 'file path' },
    ];

    const scanForPII = (obj: unknown, path: string) => {
      if (typeof obj === 'string') {
        for (const { pattern, name } of piiPatterns) {
          const matches = obj.match(pattern);
          if (matches) {
            findings.push({
              severity: 'info',
              category: 'pii',
              location: path,
              message: `PII detected: ${name}`,
              match: matches[0],
            });
            score -= 5;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          scanForPII(value, `${path}.${key}`);
        }
      }
    };

    scanForPII(build, "build");

    setSecurityFindings(findings);
    setTrustScore(Math.max(0, score));
    setIsBlocked(findings.some(f => f.severity === 'block'));
  };

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
      }>('apply_build', {
        buildJson: JSON.stringify(build),
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
        setApplyError('Apply failed. Check results for details.');
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
          boxShadow: '0 0 40px var(--rc-overlay-active)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--rc-border)' }}
        >
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--rc-cyan)' }}>
              Apply Build
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--rc-text-muted)' }}>
              {build.meta.name} {build.meta.author !== 'local' && `by ${build.meta.author}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm hover:opacity-70 transition-opacity"
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
                className="w-full px-3 py-2 rounded-xl text-sm border font-mono"
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
                className="w-full px-3 py-2 rounded-xl text-sm border"
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
                      Map build tiers to your existing model config
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
                      Use build models
                    </span>
                    <p className="text-[10px]" style={{ color: 'var(--rc-text-dim)' }}>
                      Copy exact model config from build (may require API keys)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep('security')}
              disabled={!agentIdValid || agentExists}
              className="w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-30"
              style={{
                background: 'var(--rc-cyan)',
                color: 'var(--rc-bg)',
              }}
            >
              Scan Build →
            </button>
          </div>
        )}

        {/* Step: Security */}
        {step === 'security' && (
          <div className="p-6 space-y-4">
            {/* Validation results */}
            {validationResult && (
              <div
                className="p-3 rounded-lg border"
                style={{
                  borderColor: validationResult.valid ? 'var(--rc-cyan)' : 'var(--rc-red)',
                  background: 'var(--rc-surface)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{validationResult.valid ? '✅' : '❌'}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--rc-text)' }}>
                    Schema Validation
                  </span>
                </div>
                <p className="text-xs ml-6" style={{ color: 'var(--rc-text-muted)' }}>
                  {validationResult.valid
                    ? `Build schema v${validationResult.schema} is valid`
                    : `${validationResult.errors?.length || 0} error(s) found`}
                </p>
                {!validationResult.valid && validationResult.errors && (
                  <div className="ml-6 mt-2 space-y-1">
                    {validationResult.errors.map((err, i) => (
                      <p key={i} className="text-[10px]" style={{ color: 'var(--rc-red)' }}>
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trust score badge */}
            <div
              className="p-4 rounded-lg border text-center"
              style={{
                borderColor:
                  trustScore >= 80
                    ? 'var(--rc-green)'
                    : trustScore >= 50
                    ? '#ffaa00'
                    : trustScore >= 20
                    ? '#ff8800'
                    : 'var(--rc-red)',
                background: 'var(--rc-surface)',
              }}
            >
              <div className="text-2xl font-bold" style={{ color: 'var(--rc-text)' }}>
                {trustScore}
              </div>
              <div
                className="text-xs uppercase tracking-wider font-semibold mt-1"
                style={{
                  color:
                    trustScore >= 80
                      ? 'var(--rc-green)'
                      : trustScore >= 50
                      ? '#ffaa00'
                      : trustScore >= 20
                      ? '#ff8800'
                      : 'var(--rc-red)',
                }}
              >
                {trustScore >= 80
                  ? 'Verified'
                  : trustScore >= 50
                  ? 'Community'
                  : trustScore >= 20
                  ? 'Unreviewed'
                  : 'Suspicious'}
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--rc-text-dim)' }}>
                {securityFindings.length} finding{securityFindings.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Security findings */}
            {securityFindings.length > 0 && (
              <div className="space-y-2">
                <div
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--rc-text-muted)' }}
                >
                  Security Scan
                </div>
                <div className="space-y-1">
                  {securityFindings.map((finding, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl border text-xs"
                      style={{
                        borderColor:
                          finding.severity === 'block'
                            ? 'var(--rc-red)'
                            : finding.severity === 'warn'
                            ? '#ffaa00'
                            : 'var(--rc-cyan)',
                        background: 'var(--rc-surface)',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span>
                          {finding.severity === 'block'
                            ? '🛑'
                            : finding.severity === 'warn'
                            ? '⚠️'
                            : 'ℹ️'}
                        </span>
                        <div className="flex-1">
                          <div
                            className="font-semibold"
                            style={{
                              color:
                                finding.severity === 'block'
                                  ? 'var(--rc-red)'
                                  : finding.severity === 'warn'
                                  ? '#ffaa00'
                                  : 'var(--rc-text)',
                            }}
                          >
                            {finding.message}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--rc-text-dim)' }}>
                            {finding.location}
                            {finding.match && ` · ${finding.match}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blocking warning */}
            {isBlocked && (
              <div
                className="p-3 rounded-lg border"
                style={{ borderColor: 'var(--rc-red)', background: 'var(--rc-surface)' }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--rc-red)' }}>
                  ⛔ Build blocked due to critical security findings
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--rc-text-dim)' }}>
                  Review and resolve blocking issues before continuing
                </p>
              </div>
            )}

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
                onClick={() => setStep('dependencies')}
                disabled={isBlocked}
                className="flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-30"
                style={{
                  background: 'var(--rc-cyan)',
                  color: 'var(--rc-bg)',
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step: Dependencies */}
        {step === 'dependencies' && (
          <div className="p-6 space-y-4">
            {!build.dependencies || Object.keys(build.dependencies).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--rc-text-muted)' }}>
                  No dependencies required
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--rc-text-dim)' }}>
                  This build is ready to apply
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Required binaries */}
                {build.dependencies.bins && build.dependencies.bins.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      Required Binaries
                    </div>
                    <div className="space-y-1">
                      {build.dependencies.bins.map((bin, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                          style={{ background: 'var(--rc-surface)' }}
                        >
                          <span style={{ color: 'var(--rc-text-dim)' }}>?</span>
                          <span className="font-mono" style={{ color: 'var(--rc-text)' }}>
                            {bin}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Homebrew packages */}
                {build.dependencies.brew && build.dependencies.brew.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      Homebrew Packages
                    </div>
                    <div className="space-y-1">
                      {build.dependencies.brew.map((pkg, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                          style={{ background: 'var(--rc-surface)' }}
                        >
                          <span style={{ color: 'var(--rc-text-dim)' }}>?</span>
                          <span className="font-mono" style={{ color: 'var(--rc-text)' }}>
                            {pkg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* pip packages */}
                {build.dependencies.pip && build.dependencies.pip.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      Python (pip) Packages
                    </div>
                    <div className="space-y-1">
                      {build.dependencies.pip.map((pkg, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                          style={{ background: 'var(--rc-surface)' }}
                        >
                          <span style={{ color: 'var(--rc-text-dim)' }}>?</span>
                          <span className="font-mono" style={{ color: 'var(--rc-text)' }}>
                            {pkg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* npm packages */}
                {build.dependencies.npm && build.dependencies.npm.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      npm Packages
                    </div>
                    <div className="space-y-1">
                      {build.dependencies.npm.map((pkg, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                          style={{ background: 'var(--rc-surface)' }}
                        >
                          <span style={{ color: 'var(--rc-text-dim)' }}>?</span>
                          <span className="font-mono" style={{ color: 'var(--rc-text)' }}>
                            {pkg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Models */}
                {build.dependencies.models && build.dependencies.models.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      Model Downloads
                    </div>
                    <div className="space-y-1">
                      {build.dependencies.models.map((model, i) => (
                        <div
                          key={i}
                          className="px-3 py-2 rounded-xl text-xs border"
                          style={{ background: 'var(--rc-surface)', borderColor: 'var(--rc-border)' }}
                        >
                          <div className="font-mono font-semibold" style={{ color: 'var(--rc-text)' }}>
                            {model.name}
                          </div>
                          {model.size && (
                            <div className="text-[10px] mt-0.5" style={{ color: 'var(--rc-text-dim)' }}>
                              {model.size}
                            </div>
                          )}
                          {model.url && (
                            <div
                              className="text-[10px] mt-0.5 font-mono break-all"
                              style={{ color: 'var(--rc-cyan)' }}
                            >
                              {model.url}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config requirements */}
                {build.dependencies.config && build.dependencies.config.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      Configuration
                    </div>
                    <div className="space-y-1">
                      {build.dependencies.config.map((cfg, i) => (
                        <div
                          key={i}
                          className="px-3 py-2 rounded-xl text-xs border"
                          style={{ background: 'var(--rc-surface)', borderColor: 'var(--rc-border)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold" style={{ color: 'var(--rc-text)' }}>
                              {cfg.key}
                            </span>
                            {cfg.required && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-xl"
                                style={{ background: 'var(--rc-red)', color: 'var(--rc-bg)' }}
                              >
                                REQUIRED
                              </span>
                            )}
                          </div>
                          {cfg.description && (
                            <div className="text-[10px] mt-0.5" style={{ color: 'var(--rc-text-dim)' }}>
                              {cfg.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platform requirements */}
                {build.dependencies.platform && build.dependencies.platform.length > 0 && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      Platform
                    </div>
                    <div className="flex gap-2">
                      {build.dependencies.platform.map((platform, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 rounded-xl text-xs font-mono"
                          style={{
                            background:
                              navigator.platform.toLowerCase().includes(platform.toLowerCase())
                                ? 'var(--rc-green)'
                                : 'var(--rc-surface)',
                            color:
                              navigator.platform.toLowerCase().includes(platform.toLowerCase())
                                ? 'var(--rc-bg)'
                                : 'var(--rc-text)',
                          }}
                        >
                          {platform}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Min OpenClaw version */}
                {build.dependencies.minOpenclawVersion && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      Min OpenClaw Version
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-mono"
                      style={{ background: 'var(--rc-surface)', color: 'var(--rc-text)' }}
                    >
                      {build.dependencies.minOpenclawVersion}
                    </div>
                  </div>
                )}

                {/* Setup guides */}
                {build.dependencies.guides && Object.keys(build.dependencies.guides).length > 0 && (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--rc-text-muted)' }}
                    >
                      Setup Guides
                    </div>
                    <div className="space-y-1">
                      {Object.entries(build.dependencies.guides).map(([name, url], i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs hover:opacity-80 transition-opacity"
                          style={{ background: 'var(--rc-surface)', color: 'var(--rc-cyan)' }}
                        >
                          <span>📖</span>
                          <span>{name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep('security')}
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
                onClick={() => setStep('review')}
                className="flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90"
                style={{
                  background: 'var(--rc-cyan)',
                  color: 'var(--rc-bg)',
                }}
              >
                Review Changes →
              </button>
            </div>
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

            {/* Section action list */}
            {Object.keys(actions.reduce((acc: Record<string, boolean>, a: { section?: string }) => { if (a.section) acc[a.section] = true; return acc; }, {})).map(sectionKey => {
              const sectionActions = previewActions.filter(a => a.section === sectionKey);
              if (sectionActions.length === 0) return null;
              const meta = getKeyLabel(sectionKey);

              return (
                <div key={sectionKey}>
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
                    {sectionActions.map((action, i) => (
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
                onClick={() => setStep('dependencies')}
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
                Apply Build
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
                Applying build...
              </p>
            </div>
            <div className="space-y-1">
              {actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                  style={{ background: 'var(--rc-surface)' }}
                >
                  <span>
                    {action.status === 'done' && '✅'}
                    {action.status === 'error' && '❌'}
                    {action.status === 'skipped' && '⏭'}
                  </span>
                  <span style={{ color: action.status === 'error' ? 'var(--rc-red)' : 'var(--rc-text)' }}>
                    {action.description}
                    {action.error && `: ${action.error}`}
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
