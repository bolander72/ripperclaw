import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SectionCard } from './components/SectionCard';
import { SectionDetail } from './components/SectionDetail';
import { SkillList } from './components/SkillList';
import { CompareView } from './components/CompareView';
import { FeedView } from './components/FeedView';
import { BuildsView } from './components/BuildsView';
import { PublishDialog } from './components/PublishDialog';
import { ApplyWizard } from './components/ApplyWizard';
import { SettingsView } from './components/SettingsView';
import { useSections, useSkills, useSystemStatus, useCloneBuild, useAgents } from './hooks/useTauri';
import { sections as mockSections, skills as mockSkills } from './data/mockBuild';

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

function App() {
  const [selectedSection, setSelectedSection] = useState('soul');
  const [view, setView] = useState<View>('build');
  const [showPublish, setShowPublish] = useState(false);
  const [compareTarget, setCompareTarget] = useState<Record<string, unknown> | null>(null);
  const [cloneResult, setCloneResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | undefined>(undefined);
  const [applyTarget, setApplyTarget] = useState<Record<string, unknown> | null>(null);
  const { cloneBuild } = useCloneBuild();

  const { data: agents } = useAgents();
  const { data: realSections, loading: sectionsLoading, error: sectionsError } = useSections(activeAgent);
  const { data: realSkills, loading: skillsLoading } = useSkills();
  const { data: status } = useSystemStatus();

  // Set initial active agent once loaded
  useEffect(() => {
    if (agents.length > 0 && !activeAgent) {
      const defaultAgent = agents.find(a => a.is_default) || agents[0];
      setActiveAgent(defaultAgent.id);
    }
  }, [agents]);

  const sections = realSections.length > 0 ? realSections : mockSections;
  const skills = realSkills.length > 0 ? realSkills : mockSkills;

  const activeSection = sections.find((s) => s.id === selectedSection) ?? sections[0];

  useEffect(() => {
    if (sections.length > 0 && !sections.find((s) => s.id === selectedSection)) {
      setSelectedSection(sections[0].id);
    }
  }, [sections]);

  const dataSource = sectionsError ? 'mock' : 'live';

  const navItems: { id: View; icon: string; label: string }[] = [
    { id: 'build', icon: '⬡', label: 'Build' },
    { id: 'skills', icon: '◆', label: 'Skills' },
    { id: 'builds', icon: '▤', label: 'Builds' },
    { id: 'compare', icon: '⊕', label: 'Compare' },
    { id: 'feed', icon: '◎', label: 'Feed' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ];

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
            {/* Section grid */}
            <div className="w-[360px] p-6 overflow-y-auto border-r" style={{ borderColor: 'var(--rc-border)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: 'var(--rc-text)' }}
                >
                  Sections
                </h3>
                {sectionsLoading && (
                  <span className="animate-pulse" style={{ color: 'var(--rc-cyan)' }}>●</span>
                )}
              </div>
              <div className="space-y-3">
                {sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    selected={selectedSection === section.id}
                    onClick={() => setSelectedSection(section.id)}
                  />
                ))}
              </div>
            </div>

            {/* Detail panel */}
            <div className="flex-1 p-6 overflow-y-auto">
              <SectionDetail section={activeSection} />
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
            currentSections={sections}
            currentSkills={skills}
            currentName="Quinn"
            initialBuild={compareTarget}
            onClear={() => setCompareTarget(null)}
            onClone={async (build, mode) => {
              const json = JSON.stringify(build);
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
          {sections.length} sections · {skills.length} skills
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
