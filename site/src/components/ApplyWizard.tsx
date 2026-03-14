import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconX, IconArrowLeft, IconArrowRight, IconShieldCheck, IconAlertTriangle,
  IconPackage, IconCopy, IconCheck, IconDownload
} from '@tabler/icons-react'
import { scanBuild } from '../lib/utils'
import CopyButton from './CopyButton'
import type { ApplyWizardProps, ScanResult } from '../types'

const STEPS = ['review', 'security', 'apply']

export default function ApplyWizard({ kit, onClose }: ApplyWizardProps) {
  const [step, setStep] = useState<number>(0)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [agentId, setAgentId] = useState<string>('')

  useEffect(() => {
    const result = scanBuild(kit.content)
    setScanResult(result)
  }, [kit])

  const kitJson = JSON.stringify(kit.content, null, 2)

  const simpleCommand = agentId
    ? `pbpaste | clawclawgo apply --from-stdin --agent ${agentId}`
    : null

  function handleCopyAndCommand() {
    navigator.clipboard.writeText(kitJson).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
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
              Apply: {kit.agentName}
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
            {step === 0 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-grotesk font-semibold text-rc-text mb-4">Review kit contents</h3>
                <div className="space-y-3 mb-6">
                  {kit.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-rc-border">
                      <div className="w-2 h-2 rounded-full bg-rc-cyan" />
                      <span className="text-sm font-grotesk text-rc-text">{item.name}</span>
                    </div>
                  ))}
                </div>
                {kit.content.dependencies && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <IconPackage size={16} className="text-amber-400" />
                      <span className="text-sm font-grotesk font-medium text-amber-300">Dependencies</span>
                    </div>
                    <p className="text-xs text-rc-text-dim">This kit declares dependencies. The CLI will check them during apply.</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 1 && scanResult && (
              <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  {scanResult.score === 'PASS' ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                        <IconShieldCheck size={20} className="text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-grotesk font-semibold text-green-400">Security scan passed</h3>
                        <p className="text-xs text-rc-text-dim">No PII or suspicious patterns detected</p>
                      </div>
                    </>
                  ) : scanResult.score === 'WARN' ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                        <IconAlertTriangle size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-grotesk font-semibold text-amber-400">Potential PII detected</h3>
                        <p className="text-xs text-rc-text-dim">Review findings below before applying</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                        <IconAlertTriangle size={20} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-grotesk font-semibold text-red-400">Security issues found</h3>
                        <p className="text-xs text-rc-text-dim">This kit contains suspicious patterns</p>
                      </div>
                    </>
                  )}
                </div>

                {scanResult.findings.suspicious.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-mono text-rc-text-muted mb-2">Suspicious patterns:</p>
                    <div className="space-y-2">
                      {scanResult.findings.suspicious.map((f, i) => (
                        <div key={i} className={`px-4 py-3 rounded-xl border ${f.severity === 'high' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono font-bold uppercase ${f.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>{f.severity}</span>
                            <span className="text-sm text-rc-text">{f.name}</span>
                            <span className="text-xs text-rc-text-muted ml-auto">{f.count} match{f.count > 1 ? 'es' : ''}</span>
                          </div>
                          <p className="text-xs font-mono text-rc-text-dim mt-1">{f.samples.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scanResult.findings.pii.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-mono text-rc-text-muted mb-2">Potential PII:</p>
                    <div className="space-y-2">
                      {scanResult.findings.pii.map((f, i) => (
                        <div key={i} className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-rc-text">{f.name}</span>
                            <span className="text-xs text-rc-text-muted ml-auto">{f.count} found</span>
                          </div>
                          <p className="text-xs font-mono text-rc-text-dim mt-1">{f.samples.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scanResult.findings.info.length > 0 && (
                  <div>
                    <p className="text-xs font-mono text-rc-text-muted mb-2">Kit info:</p>
                    <div className="space-y-1">
                      {scanResult.findings.info.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-rc-text-muted font-mono w-24 shrink-0">{f.name}:</span>
                          <span className="text-rc-text-dim">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="apply" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-grotesk font-semibold text-rc-text mb-2">Apply to your agent</h3>
                <p className="text-sm text-rc-text-dim mb-6">Choose an agent ID, then run the command in your terminal.</p>

                <div className="mb-6">
                  <label className="block text-xs font-mono text-rc-text-muted mb-2">Agent ID</label>
                  <input
                    type="text"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="e.g. my-agent"
                    className="w-full px-4 py-3 bg-black/30 border border-rc-border rounded-xl text-rc-text font-mono text-sm focus:outline-none focus:border-rc-cyan/40 placeholder:text-rc-text-muted/50"
                  />
                </div>

                {agentId && (
                  <>
                    <div className="mb-6 p-4 rounded-xl bg-white/5 border border-rc-border">
                      <p className="text-xs font-mono text-rc-text-muted mb-3">Option 1: Copy kit to clipboard, then run</p>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={handleCopyAndCommand}
                          className="flex items-center gap-2 px-3 py-2 bg-rc-cyan text-rc-bg rounded-lg text-xs font-grotesk font-semibold hover:bg-rc-cyan/90 transition-colors"
                        >
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                          {copied ? 'Copied!' : 'Copy kit JSON'}
                        </button>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-rc-cyan break-all select-all">
                        {simpleCommand}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-rc-border">
                      <p className="text-xs font-mono text-rc-text-muted mb-3">Option 2: Download and apply file</p>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => {
                            const blob = new Blob([kitJson], { type: 'application/json' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${kit.name || 'kit'}.json`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-white/10 text-rc-text rounded-lg text-xs font-grotesk font-semibold hover:bg-white/15 transition-colors"
                        >
                          <IconDownload size={14} />
                          Download {kit.name || 'kit'}.json
                        </button>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-rc-cyan break-all select-all">
                        clawclawgo apply {kit.name || 'kit'}.json --agent {agentId}
                      </div>
                    </div>
                  </>
                )}

                {!agentId && (
                  <div className="p-4 rounded-xl bg-white/5 border border-rc-border text-center">
                    <p className="text-sm text-rc-text-dim">Enter an agent ID above to generate the apply command</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-rc-border flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-rc-text rounded-xl border border-rc-border transition-colors text-sm font-grotesk"
          >
            <IconArrowLeft size={16} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && scanResult?.score === 'FAIL'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-grotesk font-semibold transition-colors ${
                step === 1 && scanResult?.score === 'FAIL'
                  ? 'bg-white/5 text-rc-text-muted cursor-not-allowed'
                  : 'bg-rc-cyan text-rc-bg hover:bg-rc-cyan/90'
              }`}
            >
              Next
              <IconArrowRight size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
