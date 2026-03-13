import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SkillList } from './components/SkillList';
import { CompareView } from './components/CompareView';
import { FeedView } from './components/FeedView';
import { BuildsView } from './components/BuildsView';
import { PublishDialog } from './components/PublishDialog';
import { ApplyWizard } from './components/ApplyWizard';
import { SettingsView } from './components/SettingsView';
import { useBuild, useSkills, useSystemStatus, useCloneBuild, useAgents } from './hooks/useTauri';
import { mockBuild, skills as mockSkills } from './data/mockBuild';
import type { Build } from './types';

type View = 'build' | 'skills' | 'builds' | 'compare' | 'feed' | 'settings';

function CloneToast({ result }: { result: { message: string; type: 'success' | 'error' } | null }) {
  if (!result) return null;
  return (
    <div
      className="fixed bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-sm font-semibold z-50 transition-all shadow-xl"
      style={{
        background: result.type === 'success' ? 'var(--rc-green)' : 'var(--rc-red)',
        color: 'var(--rc-bg)',
      }}
    >
      {result.message}
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim();
}

function ConfigTreeView({ build, selectedKey, onSelectKey }: { build: Build; selectedKey: string; onSelectKey: (key: string) => void }) {
  const keys = Object.keys(build).filter(k => k !== 'schema' && k !== 'meta');
  
  return (
    <div className="space-y-1">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onSelectKey(key)}
          className="w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3"
          style={{
            background: selectedKey === key ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
            border: selectedKey === key ? '1px solid var(--rc-cyan)' : '1px solid transparent',
            color: selectedKey === key ? 'var(--rc-text)' : 'var(--rc-text-dim)',
          }}
        >
          <span className="text-lg">{getKeyIcon(key)}</span>
          <div className="flex-1">
            <div className="font-medium text-sm">{formatKey(key)}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function getKeyIcon(key: string): string {
  const icons: Record<string, string> = {
    model: '⬢',
    persona: '◈',
    skills: '⚡',
    integrations: '🔌',
    automations: '⏱',
    memory: '◉',
    dependencies: '📦',
  };
  return icons[key] || '●';
}

function ConfigDetailView({ build, selectedKey }: { build: Build; selectedKey: string }) {
  const value = (build as any)[selectedKey];
  
  if (!value) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--rc-text-dim)' }}>
        <p>No data for {formatKey(selectedKey)}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--rc-text)' }}>
        {getKeyIcon(selectedKey)} {formatKey(selectedKey)}
      </h2>
      
      <div className="space-y-6">
        {selectedKey === 'model' && value.tiers && (
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--rc-text-muted)' }}>Model Tiers</h3>
            <div className="space-y-3">
              {Object.entries(value.tiers).map(([tier, config]: [string, any]) => (
                <div
                  key={tier}
                  className="p-4 rounded-lg"
                  style={{ background: 'var(--rc-surface)', border: '1px solid var(--rc-border)' }}
                >
                  <div className="font-medium mb-1" style={{ color: 'var(--rc-text)' }}>{formatKey(tier)}</div>
                  <div className="text-sm" style={{ color: 'var(--rc-text-dim)' }}>
                    {config.provider}/{config.model}
                    {config.alias && <span className="ml-2">({config.alias})</span>}
                    {config.local && <span className="ml-2 text-xs" style={{ color: 'var(--rc-green)' }}>Local</span>}
                    {config.paid && <span className="ml-2 text-xs" style={{ color: 'var(--rc-magenta)' }}>Paid</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedKey === 'persona' && (
          <div className="space-y-4">
            {value.identity && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--rc-text-muted)' }}>Identity</h3>
                <div className="text-sm space-y-1" style={{ color: 'var(--rc-text-dim)' }}>
                  {value.identity.name && <div>Name: {value.identity.name}</div>}
                  {value.identity.creature && <div>Creature: {value.identity.creature}</div>}
                  {value.identity.vibe && <div>Vibe: {value.identity.vibe}</div>}
                </div>
              </div>
            )}
            {value.soul && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--rc-text-muted)' }}>Soul</h3>
                <div className="text-sm" style={{ color: 'var(--rc-text-dim)' }}>
                  {value.soul.included ? (
                    <>
                      <div>Included: Yes</div>
                      {value.soul.tokenEstimate && <div>~{value.soul.tokenEstimate} tokens</div>}
                      {value.soul.preview && (
                        <div className="mt-2 p-3 rounded" style={{ background: 'var(--rc-surface)', fontStyle: 'italic' }}>
                          {value.soul.preview}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>Not included</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedKey === 'skills' && value.items && (
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--rc-text-muted)' }}>
              {value.items.length} Skills
            </h3>
            <SkillList skills={value.items} />
          </div>
        )}

        {selectedKey === 'integrations' && value.items && (
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--rc-text-muted)' }}>
              {value.items.length} Integrations
            </h3>
            <div className="space-y-2">
              {value.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg flex items-center gap-3"
                  style={{ background: 'var(--rc-surface)', border: '1px solid var(--rc-border)' }}
                >
                  <span className="text-lg">{getIntegrationIcon(item.type)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: 'var(--rc-text)' }}>{item.name}</div>
                    <div className="text-xs" style={{ color: 'var(--rc-text-dim)' }}>{item.provider} · {item.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedKey === 'automations' && (
          <div className="space-y-4">
            {value.heartbeat && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--rc-text-muted)' }}>Heartbeat</h3>
                <div className="text-sm" style={{ color: 'var(--rc-text-dim)' }}>
                  {value.heartbeat.included ? (
                    <>
                      {value.heartbeat.taskCount && <div>{value.heartbeat.taskCount} tasks</div>}
                    </>
                  ) : (
                    <div>Not included</div>
                  )}
                </div>
              </div>
            )}
            {value.cron && Array.isArray(value.cron) && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--rc-text-muted)' }}>Cron Jobs</h3>
                <div className="space-y-2">
                  {value.cron.map((job: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg"
                      style={{ background: 'var(--rc-surface)', border: '1px solid var(--rc-border)' }}
                    >
                      <div className="font-medium text-sm" style={{ color: 'var(--rc-text)' }}>{job.name}</div>
                      <div className="text-xs" style={{ color: 'var(--rc-text-dim)' }}>
                        {job.schedule.kind}: {job.schedule.expr || job.schedule.time || `${job.schedule.everyMs}ms`}
                      </div>
                      {job.description && (
                        <div className="text-xs mt-1" style={{ color: 'var(--rc-text-dim)' }}>{job.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedKey === 'memory' && (
          <div className="space-y-4">
            {value.engine && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--rc-text-muted)' }}>Engine</h3>
                <div className="text-sm" style={{ color: 'var(--rc-text-dim)' }}>
                  {value.engine.type && <div>Type: {value.engine.type}</div>}
                  {value.engine.description && <div>{value.engine.description}</div>}
                </div>
              </div>
            )}
            {value.structure && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--rc-text-muted)' }}>Structure</h3>
                <div className="text-sm space-y-2" style={{ color: 'var(--rc-text-dim)' }}>
                  {value.structure.directories && (
                    <div>
                      <div className="font-medium mb-1">Directories:</div>
                      <div className="pl-3 space-y-1">
                        {value.structure.directories.map((dir: string, idx: number) => (
                          <div key={idx} className="font-mono text-xs">{dir}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {value.structure.templateFiles && (
                    <div>
                      <div className="font-medium mb-1">Template Files: {value.structure.templateFiles.length}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback: JSON preview */}
        {!['model', 'persona', 'skills', 'integrations', 'automations', 'memory'].includes(selectedKey) && (
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--rc-text-muted)' }}>Raw Data</h3>
            <pre
              className="p-4 rounded-lg text-xs overflow-x-auto"
              style={{ background: 'var(--rc-surface)', color: 'var(--rc-text-dim)' }}
            >
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function getIntegrationIcon(type: string): string {
  const icons: Record<string, string> = {
    channel: '📡',
    calendar: '📅',
    email: '📧',
    'smart-home': '🏠',
    code: '⌨️',
    voice: '🗣️',
    camera: '📷',
    other: '🔌',
  };
  return icons[type] || '🔌';
}

function App() {
  const [selectedKey, setSelectedKey] = useState('model');
  const [view, setView] = useState<View>('build');
  const [showPublish, setShowPublish] = useState(false);
  const [compareTarget, setCompareTarget] = useState<Record<string, unknown> | null>(null);
  const [cloneResult, setCloneResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | undefined>(undefined);
  const [applyTarget, setApplyTarget] = useState<Record<string, unknown> | null>(null);
  const { cloneBuild } = useCloneBuild();

  const { data: agents } = useAgents();
  const { data: realBuild, loading: buildLoading, error: buildError } = useBuild(activeAgent);
  const { data: realSkills, loading: skillsLoading } = useSkills();
  const { data: status } = useSystemStatus();

  // Set initial active agent once loaded
  useEffect(() => {
    if (agents.length > 0 && !activeAgent) {
      const defaultAgent = agents.find(a => a.is_default) || agents[0];
      setActiveAgent(defaultAgent.id);
    }
  }, [agents]);

  const build = realBuild || mockBuild;
  const skills = realSkills.length > 0 ? realSkills : mockSkills;

  const dataSource = buildError ? 'mock' : 'live';

  const navItems: { id: View; icon: string; label: string }[] = [
    { id: 'build', icon: '⬡', label: 'Build' },
    { id: 'skills', icon: '◆', label: 'Skills' },
    { id: 'builds', icon: '▤', label: 'Builds' },
    { id: 'compare', icon: '⊕', label: 'Compare' },
    { id: 'feed', icon: '◎', label: 'Feed' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ];

  const buildKeys = Object.keys(build).filter(k => k !== 'schema' && k !== 'meta');

  return (
    <div className="h-screen flex flex-col">
      <Header />

      {/* Horizontal nav tabs */}
      <nav
        className="flex items-center gap-1 px-6 py-3 border-b"
        style={{ borderColor: 'var(--rc-border)', background: 'var(--rc-surface)' }}
      >
        {/* Agent selector (only when multiple agents) */}
        {agents.length > 1 && (
          <div className="flex items-center gap-2 mr-6 pr-6" style={{ borderRight: '1px solid var(--rc-border)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--rc-text-muted)' }}>Agent:</span>
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeAgent === agent.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: activeAgent === agent.id ? 'var(--rc-cyan)' : 'var(--rc-text-dim)',
                  border: activeAgent === agent.id ? '1px solid var(--rc-cyan)' : '1px solid transparent',
                }}
                title={agent.name || agent.id}
              >
                {agent.name || agent.id}
              </button>
            ))}
          </div>
        )}

        {/* View tabs */}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: view === item.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              color: view === item.id ? 'var(--rc-cyan)' : 'var(--rc-text-dim)',
              borderBottom: view === item.id ? '2px solid var(--rc-cyan)' : '2px solid transparent',
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Publish button */}
        <button
          onClick={() => setShowPublish(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          style={{
            background: 'var(--rc-cyan)',
            color: 'var(--rc-bg)',
          }}
        >
          <span>▲</span>
          Publish
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {view === 'build' && (
          <>
            {/* Config tree */}
            <div className="w-[300px] p-6 overflow-y-auto border-r" style={{ borderColor: 'var(--rc-border)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: 'var(--rc-text)' }}
                >
                  Config
                </h3>
                {buildLoading && (
                  <span className="animate-pulse" style={{ color: 'var(--rc-cyan)' }}>●</span>
                )}
              </div>
              <ConfigTreeView build={build} selectedKey={selectedKey} onSelectKey={setSelectedKey} />
            </div>

            {/* Detail panel */}
            <div className="flex-1 p-6 overflow-y-auto">
              <ConfigDetailView build={build} selectedKey={selectedKey} />
            </div>
          </>
        )}

        {view === 'skills' && (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-3xl">
              <div className="mb-6">
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--rc-text)' }}
                >
                  Installed Skills
                  {skillsLoading && (
                    <span className="ml-2 animate-pulse" style={{ color: 'var(--rc-cyan)' }}>●</span>
                  )}
                </h3>
                <p className="text-sm" style={{ color: 'var(--rc-text-dim)' }}>
                  {skills.length} skills · {skills.filter((s) => (s as any).enabled !== false).length} active
                </p>
              </div>
              <SkillList skills={skills} />
            </div>
          </div>
        )}

        {view === 'builds' && (
          <BuildsView
            onCompare={(build) => {
              setCompareTarget(build as Record<string, unknown>);
              setView('compare');
            }}
            onApply={(build) => {
              setApplyTarget(build as Record<string, unknown>);
            }}
          />
        )}

        {view === 'compare' && (
          <CompareView
            currentBuild={build}
            currentSkills={skills}
            currentName={build.meta?.agentName || "Current"}
            initialBuild={compareTarget}
            onClear={() => setCompareTarget(null)}
            onClone={async (buildToClone, mode) => {
              const json = JSON.stringify(buildToClone);
              const res = await cloneBuild(json, mode, activeAgent);
              if (res) {
                const msg = mode === 'new'
                  ? `Saved as build: ${res.section_changes[0] || 'done'}`
                  : `Applied to ${activeAgent || 'agent'}. ${res.applied_skills.length} skills, ${res.skipped_skills.length} skipped. ${res.section_changes.length} changes.`;
                setCloneResult({ message: msg, type: 'success' });
                setTimeout(() => setCloneResult(null), 6000);
              } else {
                setCloneResult({ message: 'Clone failed', type: 'error' });
                setTimeout(() => setCloneResult(null), 4000);
              }
            }}
          />
        )}

        {view === 'feed' && (
          <FeedView
            onCompare={(build) => {
              setCompareTarget(build as Record<string, unknown>);
              setView('compare');
            }}
          />
        )}

        {view === 'settings' && <SettingsView />}
      </main>

      {/* Status bar */}
      <footer
        className="flex items-center justify-between px-6 py-2 text-xs border-t"
        style={{
          borderColor: 'var(--rc-border)',
          background: 'var(--rc-surface)',
          color: 'var(--rc-text-muted)',
        }}
      >
        <span className="font-mono">
          ClawClawGo v0.2.2 · {dataSource === 'live' ? (
            <span style={{ color: 'var(--rc-green)' }}>LIVE</span>
          ) : (
            <span style={{ color: 'var(--rc-magenta)' }}>MOCK</span>
          )}
          {status.gateway === 'running' && (
            <span style={{ color: 'var(--rc-green)' }}> · Gateway ✓</span>
          )}
        </span>
        <span className="font-medium">
          {buildKeys.length} config keys · {skills.length} skills
        </span>
      </footer>

      {/* Clone result toast */}
      <CloneToast result={cloneResult as { message: string; type: 'success' | 'error' } | null} />

      {/* Publish dialog */}
      {showPublish && <PublishDialog onClose={() => setShowPublish(false)} />}

      {/* Apply wizard */}
      {applyTarget != null ? (
        <ApplyWizard
          build={applyTarget as any}
          agents={agents}
          onClose={() => setApplyTarget(null)}
          onComplete={() => {
            setCloneResult({ message: 'Agent created! Restart OpenClaw to activate.', type: 'success' });
            setTimeout(() => setCloneResult(null), 8000);
          }}
        />
      ) : null}
    </div>
  );
}

export default App;
