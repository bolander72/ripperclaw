import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconX, IconArrowLeft, IconArrowRight, IconDownload, IconCopy, IconCheck, IconExternalLink
} from '@tabler/icons-react'
import { getAgentsByIds } from '../agents'
import CopyButton from './CopyButton'
import type { ExportWizardProps } from '../types'

const STEPS = ['review', 'format', 'export']

export default function ExportWizard({ kit, onClose }: ExportWizardProps) {
  const [step, setStep] = useState<number>(0)
  const [selectedFormat, setSelectedFormat] = useState<'skill-md' | 'cli' | 'json' | 'raw'>('skill-md')
  const [copied, setCopied] = useState<boolean>(false)

  const agents = getAgentsByIds(kit.compatibility)
  const kitJson = JSON.stringify({
    name: kit.name,
    description: kit.description,
    source: kit.source,
    skills: kit.skills,
    compatibility: kit.compatibility,
    tags: kit.tags,
  }, null, 2)

  const cliCommand = kit.repoUrl 
    ? `npx clawclawgo export ${kit.repoUrl}`
    : `# No repo URL available`

  function handleCopyAndClose(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        onClose()
      }, 1500)
    })
  }

  function handleDownloadJson() {
    const blob = new Blob([kitJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${kit.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-rc-surface rounded-3xl border border-rc-border shadow-2xl relative my-8"
      >
        {/* Header */}
        <div className="p-6 border-b border-rc-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-grotesk font-bold text-rc-text">
              Export: {kit.name}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-rc-text"
            >
              <IconX size={16} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors
                  ${i <= step ? 'bg-rc-cyan text-rc-bg' : 'bg-white/5 text-rc-text-muted'}
                `}>
                  {i + 1}
                </div>
                <span className={`text-xs font-grotesk capitalize ${i <= step ? 'text-rc-text' : 'text-rc-text-muted'}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-rc-border" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Review */}
            {step === 0 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-grotesk font-semibold text-rc-text mb-4">Review kit contents</h3>
                <div className="space-y-3 mb-6">
                  {kit.skills.map((skill, i) => (
                    <div key={i} className="px-4 py-3 bg-white/5 rounded-xl border border-rc-border">
                      <p className="text-sm font-grotesk font-semibold text-rc-text">{skill.name}</p>
                      <p className="text-xs text-rc-text-dim mt-1">{skill.description}</p>
                    </div>
                  ))}
                </div>
                {agents.length > 0 && (
                  <div className="bg-rc-cyan/10 border border-rc-cyan/30 rounded-xl p-4">
                    <p className="text-xs font-mono text-rc-cyan mb-2">Compatible with {agents.length} {agents.length === 1 ? 'agent' : 'agents'}:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agents.map((agent) => (
                        <span key={agent.id} className={`text-[10px] font-mono ${agent.color || 'text-rc-cyan'}`}>
                          {agent.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Choose format */}
            {step === 1 && (
              <motion.div key="format" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-grotesk font-semibold text-rc-text mb-4">Choose export format</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedFormat('skill-md')}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors ${
                      selectedFormat === 'skill-md' 
                        ? 'bg-rc-cyan/10 border-rc-cyan/50' 
                        : 'bg-white/5 border-rc-border hover:border-rc-cyan/30'
                    }`}
                  >
                    <p className="text-sm font-grotesk font-semibold text-rc-text">Agent Skills (SKILL.md)</p>
                    <p className="text-xs text-rc-text-dim mt-1">Universal format — works with 30+ agents</p>
                  </button>
                  {kit.repoUrl && (
                    <button
                      onClick={() => setSelectedFormat('cli')}
                      className={`w-full text-left px-4 py-4 rounded-xl border transition-colors ${
                        selectedFormat === 'cli' 
                          ? 'bg-rc-cyan/10 border-rc-cyan/50' 
                          : 'bg-white/5 border-rc-border hover:border-rc-cyan/30'
                      }`}
                    >
                      <p className="text-sm font-grotesk font-semibold text-rc-text">CLI command</p>
                      <p className="text-xs text-rc-text-dim mt-1">One-liner to install via ClawClawGo CLI</p>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedFormat('json')}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors ${
                      selectedFormat === 'json' 
                        ? 'bg-rc-cyan/10 border-rc-cyan/50' 
                        : 'bg-white/5 border-rc-border hover:border-rc-cyan/30'
                    }`}
                  >
                    <p className="text-sm font-grotesk font-semibold text-rc-text">Download as JSON</p>
                    <p className="text-xs text-rc-text-dim mt-1">Kit metadata in JSON format</p>
                  </button>
                  <button
                    onClick={() => setSelectedFormat('raw')}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-colors ${
                      selectedFormat === 'raw' 
                        ? 'bg-rc-cyan/10 border-rc-cyan/50' 
                        : 'bg-white/5 border-rc-border hover:border-rc-cyan/30'
                    }`}
                  >
                    <p className="text-sm font-grotesk font-semibold text-rc-text">Copy raw config</p>
                    <p className="text-xs text-rc-text-dim mt-1">JSON to clipboard</p>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Export / Instructions */}
            {step === 2 && (
              <motion.div key="export" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-grotesk font-semibold text-rc-text mb-4">Give this to your agent</h3>
                
                {selectedFormat === 'skill-md' && (
                  <div className="space-y-4">
                    <div className="bg-rc-cyan/10 border border-rc-cyan/30 rounded-xl p-4">
                      <p className="text-xs text-rc-text-dim mb-3">
                        Agent Skills (SKILL.md) is the universal format. Compatible with Claude Code, Cursor, OpenClaw, and 30+ other agents.
                      </p>
                      {kit.repoUrl && (
                        <a
                          href={kit.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-grotesk text-rc-cyan hover:underline"
                        >
                          View on GitHub
                          <IconExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-rc-text-muted">
                      Tell your agent: "Install the skills from this kit" and paste the repo URL (or use the CLI command).
                    </p>
                  </div>
                )}

                {selectedFormat === 'cli' && kit.repoUrl && (
                  <div className="space-y-4">
                    <div className="bg-black/30 rounded-xl p-4 border border-rc-border">
                      <code className="text-xs font-mono text-rc-text break-all">
                        {cliCommand}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyAndClose(cliCommand)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rc-cyan text-rc-bg rounded-xl hover:bg-rc-cyan/90 transition-colors text-sm font-grotesk font-semibold"
                    >
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      {copied ? 'Copied!' : 'Copy command'}
                    </button>
                    <p className="text-xs text-rc-text-muted">
                      Run this in your terminal to export the kit locally.
                    </p>
                  </div>
                )}

                {selectedFormat === 'json' && (
                  <div className="space-y-4">
                    <button
                      onClick={handleDownloadJson}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rc-cyan text-rc-bg rounded-xl hover:bg-rc-cyan/90 transition-colors text-sm font-grotesk font-semibold"
                    >
                      <IconDownload size={16} />
                      Download {kit.id}.json
                    </button>
                    <p className="text-xs text-rc-text-muted">
                      Download the kit as JSON. Give this file to your AI agent — it'll know what to do.
                    </p>
                  </div>
                )}

                {selectedFormat === 'raw' && (
                  <div className="space-y-4">
                    <pre className="bg-black/30 rounded-xl p-4 text-xs font-mono text-rc-text-dim overflow-auto max-h-60 border border-rc-border">
                      {kitJson}
                    </pre>
                    <button
                      onClick={() => handleCopyAndClose(kitJson)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rc-cyan text-rc-bg rounded-xl hover:bg-rc-cyan/90 transition-colors text-sm font-grotesk font-semibold"
                    >
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-rc-border">
                  <p className="text-xs text-rc-text-dim">
                    <strong className="text-rc-text">Agent-specific tips:</strong>
                  </p>
                  <ul className="text-xs text-rc-text-muted mt-2 space-y-1 list-disc list-inside">
                    <li><strong className="text-rc-text">Claude Code / Claude:</strong> "Add these skills to my workspace"</li>
                    <li><strong className="text-rc-text">Cursor:</strong> Drop SKILL.md folders in your project root</li>
                    <li><strong className="text-rc-text">OpenClaw:</strong> Use <code className="font-mono bg-black/30 px-1 rounded">clawclawgo apply</code> or drag-drop to workspace</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-rc-border flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm font-grotesk ${
              step === 0 
                ? 'opacity-30 cursor-not-allowed text-rc-text-muted' 
                : 'bg-white/5 hover:bg-white/10 text-rc-text'
            }`}
          >
            <IconArrowLeft size={16} />
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-rc-cyan text-rc-bg rounded-xl hover:bg-rc-cyan/90 transition-colors text-sm font-grotesk font-semibold"
            >
              Next
              <IconArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-rc-text rounded-xl transition-colors text-sm font-grotesk"
            >
              Done
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
