import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconChevronDown } from '@tabler/icons-react'

interface FAQ {
  q: string
  a: string
}

const faqs: FAQ[] = [
  { q: 'What is ClawClawGo?', a: 'ClawClawGo is a cross-platform agent skills search engine. It aggregates skills from GitHub, ClawHub, skills.sh, and other sources so you can find and export skills for Claude Code, Cursor, OpenClaw, and 30+ other AI agents.' },
  { q: 'What agents are supported?', a: 'ClawClawGo supports 30+ agents via the Agent Skills standard (agentskills.io) — including Claude Code, Claude, OpenAI Codex, GitHub Copilot, VS Code, Cursor, Windsurf, Gemini CLI, Roo Code, Goose, OpenHands, OpenCode, and more. If it uses SKILL.md format, it works.' },
  { q: 'How do I use a kit?', a: 'Find a kit you like. Click to view details. Export as SKILL.md folders, download the JSON, or copy the CLI command. Give the export to your AI agent — it will handle the installation. No manual setup required.' },
  { q: 'What\'s the Agent Skills standard?', a: 'Agent Skills is an open format (agentskills.io) originally developed by Anthropic, now adopted by 30+ agents. It defines how skills are structured (SKILL.md files with YAML frontmatter) so they work across platforms.' },
  { q: 'Can I contribute my own kits?', a: 'Yes! Create a GitHub repo with SKILL.md files following the Agent Skills format. Run `npx clawclawgo publish` to auto-submit a PR to the registry, or manually add your repo URL to registry/kits.json.' },
  { q: 'Where do kits come from?', a: 'ClawClawGo aggregates from multiple sources: GitHub repos with SKILL.md files, ClawHub (OpenClaw skill registry), skills.sh (Vercel\'s leaderboard), official repos from Anthropic and Microsoft, and curated community collections.' },
  { q: 'What\'s in a typical kit?', a: 'A kit is a collection of skills. Each skill has a name, description, compatibility requirements, and optional scripts/docs/assets. Builds range from single skills to full stacks with dozens of capabilities.' },
  { q: 'Do I need OpenClaw?', a: 'No. ClawClawGo works with 30+ agents. OpenClaw is one of them, but you can use Claude Code, Cursor, GitHub Copilot, or any other agent that supports the Agent Skills format.' },
  { q: 'Is this free?', a: 'Yes. ClawClawGo is free. The skills are open source. Your AI agent may have costs (API calls for cloud models), but you can also run fully local models for zero cost.' },
  { q: 'What are trust tiers?', a: 'Builds are tagged as "verified" (official sources like Anthropic, Microsoft), "community" (from known developers with GitHub stars), or "unreviewed" (new or unknown sources). Stars and forks help gauge quality.' },
]

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border border-rc-border rounded-xl overflow-hidden"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
          >
            <span className="font-grotesk font-medium text-rc-text text-sm pr-4">{faq.q}</span>
            <motion.div
              animate={{ rotate: openIndex === i ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 text-rc-text-muted"
            >
              <IconChevronDown size={18} />
            </motion.div>
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-rc-text-dim text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
