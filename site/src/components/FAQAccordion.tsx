import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconChevronDown } from '@tabler/icons-react'

interface FAQ {
  q: string
  a: string
}

const faqs: FAQ[] = [
  { q: 'What is a build?', a: 'A build is a complete agent configuration: the model, integrations, skills, personality, memory, and scheduling that define how an AI agent works. Think of it like a character build in a game, or dotfiles for your AI.' },
  { q: 'Can I search without an account?', a: 'Yes. No accounts, no tracking, no login required. Search and browse builds completely anonymously. Only create an identity if you want to publish builds.' },
  { q: 'Can I publish anonymously?', a: 'Yes. Publish builds under your GitHub username or keep them in a private repo. Your identity is tied to your GitHub account — no extra signup required.' },
  { q: 'What data is shared when I publish?', a: 'Only what you approve. The PII scrubber runs locally and removes phone numbers, emails, API keys, home paths, and other sensitive data before anything leaves your machine. You review the scrubbed output before publishing.' },
  { q: 'Where are builds stored?', a: 'Builds are published as JSON files in GitHub repositories. ClawClawGo aggregates builds from GitHub, ClawHub, and other sources into a single searchable feed.' },
  { q: "Can I copy someone else's build?", a: 'That\'s the whole point. Click any build card, hit "Copy Build," and you\'ve got their full configuration. Swap out what doesn\'t fit, keep what does.' },
  { q: 'What\'s in a typical build?', a: 'Builds contain whatever config your agent uses. Common pieces include model routing (which LLMs), personality (how it talks), skills (what it can do), integrations (what it connects to), automations (heartbeat + cron), and memory config. But builds are flexible.' },
  { q: 'Do I need OpenClaw to use a build?', a: 'Builds are designed for OpenClaw agents, but the concepts are universal. The model choices, integration patterns, and personality approaches apply to any AI agent setup.' },
  { q: 'Is this free?', a: 'ClawClawGo is free. OpenClaw is free and open source. You\'ll pay for AI model API calls depending on which providers you use, or run fully local models for zero cost.' },
  { q: 'How do I get started?', a: 'Search for a build that matches your use case. Explore how it\'s configured. Copy it and apply it to your agent. Or install OpenClaw, create your own build, and publish it for others.' },
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
