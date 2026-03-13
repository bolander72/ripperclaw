import type { SectionData, SkillItem } from '../types';

// UI rendering sections (for get_build display)
export const sections: SectionData[] = [
  {
    id: 'persona',
    label: 'Persona',
    icon: '◈',
    status: 'active',
    component: 'Quinn (defined)',
    details: { agent_name: 'Quinn', soul_tokens: 2831, has_soul: true },
    subComponents: [
      { name: 'SOUL.md', status: 'active', detail: '~2831 tokens', icon: '◈' },
      { name: 'IDENTITY.md', status: 'active', detail: 'Quinn', icon: '👤' },
      { name: 'USER.md', status: 'active', detail: 'Human: Mike', icon: '🧑' },
    ],
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: '⧫',
    status: 'active',
    component: 'lossless-claw',
    version: '0.2.8',
    details: { context_engine: 'lossless-claw', lcm_db_size_mb: '12.4', daily_notes: 45 },
    subComponents: [
      { name: 'Context Engine', status: 'active', detail: 'lossless-claw', icon: '🧠' },
      { name: 'LCM Database', status: 'active', detail: '12.4 MB', icon: '💾' },
      { name: 'Memory Files', status: 'active', detail: '4 core + 45 daily notes', icon: '📝' },
    ],
  },
  {
    id: 'model',
    label: 'Model',
    icon: '⬢',
    status: 'active',
    component: 'claude-opus-4-6',
    details: { primary: 'claude-opus-4-6', subagent: 'claude-sonnet-4-5' },
    subComponents: [
      { name: 'Primary', status: 'active', detail: 'claude-opus-4-6', icon: '🦴' },
      { name: 'Sub-agent', status: 'active', detail: 'claude-sonnet-4-5', icon: '🔗' },
      { name: 'Local (Ollama)', status: 'active', detail: '2 models', icon: '🏠' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: '⬡',
    status: 'active',
    component: 'OpenClaw',
    version: '2026.3.7',
    details: { platform: 'darwin', arch: 'aarch64' },
    subComponents: [
      { name: 'OpenClaw', status: 'active', detail: '2026.3.7', icon: '⬡' },
      { name: 'Node.js', status: 'active', detail: 'v22.22.0', icon: '📦' },
      { name: 'Platform', status: 'active', detail: 'macos aarch64', icon: '💻' },
    ],
  },
  {
    id: 'automations',
    label: 'Automations',
    icon: '♥',
    status: 'active',
    component: 'Heartbeat Engine',
    details: { heartbeat_tasks: 2, cron_jobs: 20 },
    subComponents: [
      { name: 'Heartbeat', status: 'active', detail: '2 tasks', icon: '💓' },
      { name: 'Cron Jobs', status: 'active', detail: '20 scheduled', icon: '⏰' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: '⚡',
    status: 'active',
    component: 'bluebubbles',
    details: { channels: ['bluebubbles'], integrations: 5 },
    subComponents: [
      { name: 'bluebubbles', status: 'active', detail: 'messaging channel', icon: '📡' },
      { name: 'Calendar (caldir)', status: 'active', detail: 'iCloud + Google', icon: '📅' },
      { name: 'Email (himalaya)', status: 'active', detail: 'IMAP/SMTP', icon: '📧' },
      { name: 'Reminders', status: 'active', detail: 'Apple Reminders', icon: '✅' },
      { name: 'Home Assistant', status: 'active', detail: '192.168.1.232', icon: '🏠' },
      { name: 'Smart Devices', status: 'active', detail: '12 devices', icon: '💡' },
    ],
  },
];

// Skills list
export const skills: SkillItem[] = [
  { name: 'apple-notes', source: 'bundled' },
  { name: 'apple-reminders', source: 'bundled' },
  { name: 'bluebubbles', source: 'bundled' },
  { name: 'clawhub', source: 'bundled' },
  { name: 'coding-agent', source: 'bundled' },
  { name: 'gh-issues', source: 'bundled' },
  { name: 'github', source: 'bundled' },
  { name: 'gog', source: 'bundled' },
  { name: 'healthcheck', source: 'bundled' },
  { name: 'himalaya', source: 'bundled' },
  { name: 'peekaboo', source: 'bundled' },
  { name: 'skill-creator', source: 'bundled' },
  { name: 'summarize', source: 'bundled' },
  { name: 'weather', source: 'bundled' },
  { name: 'openai-whisper-api', source: 'bundled' },
  { name: 'client-setup', source: 'custom' },
  { name: 'frontend-design-ultimate', source: 'custom' },
  { name: 'humanize', source: 'custom' },
  { name: 'imessage-voice-reply', source: 'custom' },
  { name: 'luck', source: 'custom' },
  { name: 'markdown-converter', source: 'custom' },
  { name: 'marketing-skills', source: 'custom' },
  { name: 'ollama-local', source: 'custom' },
  { name: 'zero-trust', source: 'custom' },
  { name: 'lossless-claw', source: 'custom', version: '0.2.8' },
];

// Legacy export for compatibility during migration

