import type { Build, SkillItem } from '../types';

// Mock build in flat schema v3 format
export const mockBuild: Build = {
  schema: 3,
  meta: {
    name: "Quinn's Build",
    agentName: "Quinn",
    description: "Personal AI assistant with full integration stack",
    author: "@Bolander72",
    version: 1,
    exportedAt: "2026-03-12T00:00:00Z",
    openclawVersion: "2026.3.7",
    tags: ["personal", "full-stack", "productivity"],
  },
  model: {
    tiers: {
      main: {
        provider: "anthropic",
        model: "claude-opus-4-6",
        alias: "Opus",
        paid: true,
      },
      subagent: {
        provider: "anthropic",
        model: "claude-sonnet-4-5",
        alias: "Sonnet",
        paid: true,
      },
      utility: {
        provider: "ollama",
        model: "qwen3:8b",
        alias: "Qwen 3",
        local: true,
      },
    },
  },
  persona: {
    identity: {
      name: "Quinn",
      creature: "AI assistant",
      vibe: "Calm, efficient, resourceful, agentic",
    },
    soul: {
      included: true,
      preview: "You're not a chatbot. You're becoming someone...",
      tokenEstimate: 2831,
    },
  },
  skills: {
    items: [
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
    ],
  },
  integrations: {
    items: [
      { type: 'channel', name: 'BlueBubbles', provider: 'bluebubbles', autoApply: false },
      { type: 'calendar', name: 'Calendar', provider: 'caldir', autoApply: false },
      { type: 'email', name: 'Email', provider: 'himalaya', autoApply: false },
      { type: 'smart-home', name: 'Home Assistant', provider: 'home-assistant', autoApply: false },
      { type: 'voice', name: 'Voice Loop', provider: 'voice-loop', autoApply: false },
    ],
  },
  automations: {
    heartbeat: {
      included: true,
      taskCount: 2,
      content: "# HEARTBEAT.md\n\n- **Morning**: Review calendar\n- **Evening**: Status check",
    },
    cron: [
      {
        name: "Health check",
        schedule: { kind: 'cron', expr: '0 */6 * * *' },
        description: "Run healthcheck skill every 6 hours",
      },
    ],
  },
  memory: {
    structure: {
      directories: ['memory', 'memory/reference'],
      templateFiles: [
        { path: 'memory/handoff.md', content: '# Handoff\n\n' },
        { path: 'memory/active-work.md', content: '# Active Work\n\n' },
        { path: 'memory/facts.md', content: '# Facts\n\n' },
      ],
    },
    engine: {
      type: 'lossless-claw',
      description: 'Lossless context management with LCM',
    },
  },
};

// Legacy skills export for compatibility
export const skills: SkillItem[] = mockBuild.skills?.items || [];
