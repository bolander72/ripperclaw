// Supported AI agents that work with Agent Skills standard
// Data from agentskills.io and AGENT-COMPATIBILITY.md

export interface AgentPlatform {
  id: string
  name: string
  company: string
  configFormat: string
  color?: string
}

export const SUPPORTED_AGENTS: AgentPlatform[] = [
  { id: 'claude-code', name: 'Claude Code', company: 'Anthropic', configFormat: 'SKILL.md', color: 'text-amber-400' },
  { id: 'claude', name: 'Claude', company: 'Anthropic', configFormat: 'SKILL.md', color: 'text-amber-500' },
  { id: 'openai-codex', name: 'OpenAI Codex', company: 'OpenAI', configFormat: 'SKILL.md', color: 'text-emerald-400' },
  { id: 'github-copilot', name: 'GitHub Copilot', company: 'Microsoft', configFormat: 'SKILL.md', color: 'text-purple-400' },
  { id: 'vs-code', name: 'VS Code Copilot', company: 'Microsoft', configFormat: 'SKILL.md', color: 'text-blue-400' },
  { id: 'cursor', name: 'Cursor', company: 'Anysphere', configFormat: 'SKILL.md / .cursorrules', color: 'text-cyan-400' },
  { id: 'windsurf', name: 'Windsurf', company: 'Codeium', configFormat: '.windsurfrules', color: 'text-teal-400' },
  { id: 'gemini-cli', name: 'Gemini CLI', company: 'Google', configFormat: 'SKILL.md', color: 'text-blue-500' },
  { id: 'roo-code', name: 'Roo Code', company: 'Roo Code Inc', configFormat: 'SKILL.md', color: 'text-orange-400' },
  { id: 'goose', name: 'Goose', company: 'Block', configFormat: 'SKILL.md', color: 'text-yellow-400' },
  { id: 'openhands', name: 'OpenHands', company: 'All Hands AI', configFormat: 'SKILL.md', color: 'text-pink-400' },
  { id: 'opencode', name: 'OpenCode', company: 'SST', configFormat: 'SKILL.md', color: 'text-violet-400' },
  { id: 'amp', name: 'Amp', company: 'Sourcegraph', configFormat: 'SKILL.md', color: 'text-red-400' },
  { id: 'junie', name: 'Junie', company: 'JetBrains', configFormat: 'SKILL.md', color: 'text-purple-500' },
  { id: 'mux', name: 'Mux', company: 'Coder', configFormat: 'SKILL.md', color: 'text-indigo-400' },
  { id: 'letta', name: 'Letta', company: 'Letta', configFormat: 'SKILL.md', color: 'text-green-400' },
  { id: 'firebender', name: 'Firebender', company: 'Firebender', configFormat: 'SKILL.md', color: 'text-orange-500' },
  { id: 'trae', name: 'TRAE', company: 'ByteDance', configFormat: 'SKILL.md', color: 'text-blue-600' },
  { id: 'factory', name: 'Factory', company: 'Factory AI', configFormat: 'SKILL.md', color: 'text-gray-400' },
  { id: 'pi', name: 'pi', company: 'badlogic', configFormat: 'SKILL.md', color: 'text-lime-400' },
  { id: 'databricks', name: 'Databricks', company: 'Databricks', configFormat: 'SKILL.md', color: 'text-red-500' },
  { id: 'piebald', name: 'Piebald', company: 'Piebald', configFormat: 'SKILL.md', color: 'text-slate-400' },
  { id: 'agentman', name: 'Agentman', company: 'Agentman', configFormat: 'SKILL.md', color: 'text-cyan-500' },
  { id: 'spring-ai', name: 'Spring AI', company: 'VMware', configFormat: 'SKILL.md', color: 'text-green-500' },
  { id: 'autohand', name: 'Autohand', company: 'Autohand', configFormat: 'SKILL.md', color: 'text-blue-300' },
  { id: 'mistral-vibe', name: 'Mistral Vibe', company: 'Mistral AI', configFormat: 'SKILL.md', color: 'text-orange-300' },
  { id: 'command-code', name: 'Command Code', company: 'Command Code', configFormat: 'SKILL.md', color: 'text-yellow-500' },
  { id: 'ona', name: 'Ona', company: 'Ona', configFormat: 'SKILL.md', color: 'text-purple-300' },
  { id: 'vt-code', name: 'VT Code', company: 'VT Code', configFormat: 'SKILL.md', color: 'text-pink-500' },
  { id: 'qodo', name: 'Qodo', company: 'Qodo', configFormat: 'SKILL.md', color: 'text-indigo-500' },
  { id: 'laravel-boost', name: 'Laravel Boost', company: 'Laravel', configFormat: 'SKILL.md', color: 'text-red-600' },
  { id: 'emdash', name: 'Emdash', company: 'Emdash', configFormat: 'SKILL.md', color: 'text-slate-500' },
  { id: 'snowflake', name: 'Snowflake', company: 'Snowflake', configFormat: 'SKILL.md', color: 'text-sky-400' },
  { id: 'openclaw', name: 'OpenClaw', company: 'OpenClaw', configFormat: 'SKILL.md / openclaw.json', color: 'text-rc-cyan' },
]

export function getAgentById(id: string): AgentPlatform | undefined {
  return SUPPORTED_AGENTS.find(a => a.id === id)
}

export function getAgentsByIds(ids: string[]): AgentPlatform[] {
  return ids.map(getAgentById).filter((a): a is AgentPlatform => a !== undefined)
}
