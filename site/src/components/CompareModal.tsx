import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { IconX, IconUpload, IconArrowRight, IconPlus, IconMinus, IconEqual } from '@tabler/icons-react'
import type { Build, BuildContent } from '../types'

interface CompareModalProps {
  build: Build
  onClose: () => void
}

function getSection(content: BuildContent, key: string) {
  return content[key] || content.blocks?.[key]
}

export default function CompareModal({ build, onClose }: CompareModalProps) {
  const [currentBuild, setCurrentBuild] = useState<BuildContent | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const content = JSON.parse(ev.target?.result as string)
        setCurrentBuild(content)
      } catch (err) {
        alert('Failed to parse JSON: ' + (err as Error).message)
      }
    }
    reader.readAsText(file)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const content = JSON.parse(text)
      setCurrentBuild(content)
    } catch (err) {
      alert('Failed to parse clipboard content: ' + (err as Error).message)
    }
  }

  const compareArrays = (theirs: any[], yours: any[], getName: (item: any) => string) => {
    const theirNames = new Set(theirs?.map(getName) || [])
    const yourNames = new Set(yours?.map(getName) || [])
    
    const added = theirs?.filter(item => !yourNames.has(getName(item))) || []
    const removed = yours?.filter(item => !theirNames.has(getName(item))) || []
    const same = theirs?.filter(item => yourNames.has(getName(item))) || []
    
    return { added, removed, same }
  }

  if (!currentBuild) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-rc-surface border border-rc-border rounded-2xl max-w-2xl w-full p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-grotesk font-bold text-rc-text text-xl">Compare with Current Build</h2>
            <button onClick={onClose} className="text-rc-text-muted hover:text-rc-text transition-colors">
              <IconX size={20} />
            </button>
          </div>

          <p className="text-rc-text-dim text-sm mb-4">Upload or paste your current build.json to compare.</p>

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-8 bg-rc-bg border-2 border-dashed border-rc-border rounded-lg text-rc-text-dim hover:border-rc-cyan/40 hover:text-rc-cyan transition-all flex flex-col items-center gap-2"
            >
              <IconUpload size={24} />
              <span className="font-mono text-sm">Upload JSON</span>
            </button>
            <button
              onClick={handlePaste}
              className="flex-1 px-4 py-8 bg-rc-bg border-2 border-dashed border-rc-border rounded-lg text-rc-text-dim hover:border-rc-cyan/40 hover:text-rc-cyan transition-all flex flex-col items-center gap-2"
            >
              <IconArrowRight size={24} />
              <span className="font-mono text-sm">Paste from Clipboard</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </motion.div>
      </motion.div>
    )
  }

  // Compare
  const theirContent = build.content
  const yourContent = currentBuild

  const theirModels = getSection(theirContent, 'model')?.tiers ? Object.values(getSection(theirContent, 'model').tiers).map((t: any) => t.alias || `${t.provider}/${t.model}`) : []
  const yourModels = getSection(yourContent, 'model')?.tiers ? Object.values(getSection(yourContent, 'model').tiers).map((t: any) => t.alias || `${t.provider}/${t.model}`) : []
  const modelsDiff = compareArrays(theirModels, yourModels, (x) => x)

  const theirSkills = getSection(theirContent, 'skills')?.items || []
  const yourSkills = getSection(yourContent, 'skills')?.items || []
  const skillsDiff = compareArrays(theirSkills, yourSkills, (s: any) => s.name)

  const theirIntegrations = getSection(theirContent, 'integrations')?.items || []
  const yourIntegrations = getSection(yourContent, 'integrations')?.items || []
  const integrationsDiff = compareArrays(theirIntegrations, yourIntegrations, (i: any) => i.name)

  const theirPersona = getSection(theirContent, 'persona')
  const yourPersona = getSection(yourContent, 'persona')
  const theirHasPersona = !!(theirPersona?.soul?.included || theirPersona?.agents?.included)
  const yourHasPersona = !!(yourPersona?.soul?.included || yourPersona?.agents?.included)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-rc-surface border border-rc-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-rc-surface border-b border-rc-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-grotesk font-bold text-rc-text text-xl">Build Comparison</h2>
          <button onClick={onClose} className="text-rc-text-muted hover:text-rc-text transition-colors">
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Models */}
          <section>
            <h3 className="font-grotesk font-bold text-rc-text mb-3">Models</h3>
            <div className="space-y-2">
              {modelsDiff.added.length > 0 && (
                <div>
                  <p className="text-xs text-green-400 font-mono mb-1 flex items-center gap-1">
                    <IconPlus size={12} /> In their build (not yours)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {modelsDiff.added.map((m, i) => (
                      <span key={i} className="px-2 py-1 bg-green-400/15 border border-green-400/30 rounded text-xs font-mono text-green-400">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {modelsDiff.removed.length > 0 && (
                <div>
                  <p className="text-xs text-red-400 font-mono mb-1 flex items-center gap-1">
                    <IconMinus size={12} /> In your build (not theirs)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {modelsDiff.removed.map((m, i) => (
                      <span key={i} className="px-2 py-1 bg-red-400/15 border border-red-400/30 rounded text-xs font-mono text-red-400">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {modelsDiff.same.length > 0 && (
                <div>
                  <p className="text-xs text-rc-text-dim font-mono mb-1 flex items-center gap-1">
                    <IconEqual size={12} /> Same in both
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {modelsDiff.same.map((m, i) => (
                      <span key={i} className="px-2 py-1 bg-rc-bg border border-rc-border rounded text-xs font-mono text-rc-text-dim">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h3 className="font-grotesk font-bold text-rc-text mb-3">Skills</h3>
            <div className="space-y-2">
              {skillsDiff.added.length > 0 && (
                <div>
                  <p className="text-xs text-green-400 font-mono mb-1 flex items-center gap-1">
                    <IconPlus size={12} /> In their build
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsDiff.added.map((s: any, i) => (
                      <span key={i} className="px-2 py-1 bg-green-400/15 border border-green-400/30 rounded text-xs font-mono text-green-400">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skillsDiff.removed.length > 0 && (
                <div>
                  <p className="text-xs text-red-400 font-mono mb-1 flex items-center gap-1">
                    <IconMinus size={12} /> In your build
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsDiff.removed.map((s: any, i) => (
                      <span key={i} className="px-2 py-1 bg-red-400/15 border border-red-400/30 rounded text-xs font-mono text-red-400">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skillsDiff.same.length > 0 && (
                <div>
                  <p className="text-xs text-rc-text-dim font-mono mb-1 flex items-center gap-1">
                    <IconEqual size={12} /> Same in both
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsDiff.same.slice(0, 8).map((s: any, i) => (
                      <span key={i} className="px-2 py-1 bg-rc-bg border border-rc-border rounded text-xs font-mono text-rc-text-dim">
                        {s.name}
                      </span>
                    ))}
                    {skillsDiff.same.length > 8 && (
                      <span className="px-2 py-1 text-xs font-mono text-rc-text-muted">
                        +{skillsDiff.same.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Integrations */}
          <section>
            <h3 className="font-grotesk font-bold text-rc-text mb-3">Integrations</h3>
            <div className="space-y-2">
              {integrationsDiff.added.length > 0 && (
                <div>
                  <p className="text-xs text-green-400 font-mono mb-1 flex items-center gap-1">
                    <IconPlus size={12} /> In their build
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {integrationsDiff.added.map((i: any, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-400/15 border border-green-400/30 rounded text-xs font-mono text-green-400">
                        {i.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {integrationsDiff.removed.length > 0 && (
                <div>
                  <p className="text-xs text-red-400 font-mono mb-1 flex items-center gap-1">
                    <IconMinus size={12} /> In your build
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {integrationsDiff.removed.map((i: any, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-400/15 border border-red-400/30 rounded text-xs font-mono text-red-400">
                        {i.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {integrationsDiff.same.length > 0 && (
                <div>
                  <p className="text-xs text-rc-text-dim font-mono mb-1 flex items-center gap-1">
                    <IconEqual size={12} /> Same in both
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {integrationsDiff.same.map((i: any, idx) => (
                      <span key={idx} className="px-2 py-1 bg-rc-bg border border-rc-border rounded text-xs font-mono text-rc-text-dim">
                        {i.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Persona */}
          <section>
            <h3 className="font-grotesk font-bold text-rc-text mb-3">Persona Files</h3>
            <div className="flex items-center gap-2">
              {theirHasPersona && !yourHasPersona && (
                <span className="px-3 py-1.5 bg-green-400/15 border border-green-400/30 rounded text-sm font-mono text-green-400">
                  <IconPlus size={14} className="inline mr-1" /> They include persona files
                </span>
              )}
              {!theirHasPersona && yourHasPersona && (
                <span className="px-3 py-1.5 bg-red-400/15 border border-red-400/30 rounded text-sm font-mono text-red-400">
                  <IconMinus size={14} className="inline mr-1" /> You have persona, they don't
                </span>
              )}
              {theirHasPersona && yourHasPersona && (
                <span className="px-3 py-1.5 bg-rc-bg border border-rc-border rounded text-sm font-mono text-rc-text-dim">
                  <IconEqual size={14} className="inline mr-1" /> Both include persona
                </span>
              )}
              {!theirHasPersona && !yourHasPersona && (
                <span className="px-3 py-1.5 bg-rc-bg border border-rc-border rounded text-sm font-mono text-rc-text-dim">
                  Neither includes persona files
                </span>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  )
}
