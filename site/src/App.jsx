import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconBrain, IconCpu, IconMicrophone,
  IconMessageCircle, IconCalendar, IconMail, IconCheckbox, IconSmartHome, IconBrandGithub,
  IconWaveSine, IconPalette, IconTerminal2, IconWorldSearch, IconNote,
  IconUser, IconFingerprint, IconUserCircle,
  IconDatabase, IconNotebook, IconHeartHandshake, IconPinned,
  IconHeartbeat, IconClock, IconBell,
  IconCube, IconPlug, IconBolt, IconSparkles, IconServer, IconClockHour4,
} from '@tabler/icons-react'

const M = 18
const I = 22
const S = 20
const STK = 1.5

const sampleLoadout = {
  name: 'Quinn',
  description: "Mike's personal AI assistant",
  version: '1.0',
  slots: [
    {
      name: 'Model',
      icon: <IconCube size={S} stroke={STK} />,
      items: [
        { name: 'Claude Opus', detail: 'Primary reasoning', icon: <IconBrain size={M} stroke={STK} className="text-purple-400" /> },
        { name: 'Claude Sonnet', detail: 'Sub-agents', icon: <IconCpu size={M} stroke={STK} className="text-blue-400" /> },
        { name: 'Qwen 3.5:4b', detail: 'Heartbeats & utility', icon: <IconCpu size={M} stroke={STK} className="text-rc-green" /> },
        { name: 'Whisper', detail: 'Voice STT (local)', icon: <IconMicrophone size={M} stroke={STK} className="text-rc-text-dim" /> },
      ],
    },
    {
      name: 'Integrations',
      icon: <IconPlug size={S} stroke={STK} />,
      items: [
        { name: 'iMessage', detail: 'BlueBubbles', icon: <IconMessageCircle size={M} stroke={STK} className="text-green-400" /> },
        { name: 'Calendar', detail: 'caldir (iCloud + Google)', icon: <IconCalendar size={M} stroke={STK} className="text-rc-red" /> },
        { name: 'Email', detail: 'himalaya (IMAP/SMTP)', icon: <IconMail size={M} stroke={STK} className="text-blue-400" /> },
        { name: 'Reminders', detail: 'remindctl', icon: <IconCheckbox size={M} stroke={STK} className="text-orange-400" /> },
        { name: 'Smart Home', detail: 'Home Assistant + HomeKit', icon: <IconSmartHome size={M} stroke={STK} className="text-rc-yellow" /> },
        { name: 'GitHub', detail: 'gh CLI', icon: <IconBrandGithub size={M} stroke={STK} className="text-rc-text" /> },
      ],
    },
    {
      name: 'Skills',
      icon: <IconBolt size={S} stroke={STK} />,
      items: [
        { name: 'Voice Chat', detail: 'Kokoro TTS + Whisper STT', icon: <IconWaveSine size={M} stroke={STK} className="text-pink-400" /> },
        { name: 'Frontend Design', detail: 'React + Tailwind builder', icon: <IconPalette size={M} stroke={STK} className="text-violet-400" /> },
        { name: 'Coding Agent', detail: 'Delegate to Codex/Claude', icon: <IconTerminal2 size={M} stroke={STK} className="text-rc-green" /> },
        { name: 'Web Research', detail: 'Search + fetch + browse', icon: <IconWorldSearch size={M} stroke={STK} className="text-rc-cyan" /> },
        { name: 'Apple Notes', detail: 'memo CLI', icon: <IconNote size={M} stroke={STK} className="text-rc-yellow" /> },
      ],
    },
    {
      name: 'Personality',
      icon: <IconSparkles size={S} stroke={STK} />,
      items: [
        { name: 'SOUL.md', detail: 'Core identity & voice', icon: <IconUser size={M} stroke={STK} className="text-rc-green" /> },
        { name: 'IDENTITY.md', detail: 'Name, creature, vibe', icon: <IconFingerprint size={M} stroke={STK} className="text-purple-400" /> },
        { name: 'USER.md', detail: 'About Mike', icon: <IconUserCircle size={M} stroke={STK} className="text-blue-400" /> },
      ],
    },
    {
      name: 'Memory',
      icon: <IconServer size={S} stroke={STK} />,
      items: [
        { name: 'MEMORY.md', detail: 'Long-term curated facts', icon: <IconDatabase size={M} stroke={STK} className="text-rc-green" /> },
        { name: 'Daily Notes', detail: 'Raw daily logs', icon: <IconNotebook size={M} stroke={STK} className="text-amber-400" /> },
        { name: 'Handoff', detail: 'Session continuity', icon: <IconHeartHandshake size={M} stroke={STK} className="text-rc-cyan" /> },
        { name: 'Facts', detail: 'Atomic verified facts', icon: <IconPinned size={M} stroke={STK} className="text-rc-red" /> },
      ],
    },
    {
      name: 'Scheduling',
      icon: <IconClockHour4 size={S} stroke={STK} />,
      items: [
        { name: 'Heartbeats', detail: 'Periodic health checks', icon: <IconHeartbeat size={M} stroke={STK} className="text-rose-400" /> },
        { name: 'Cron Jobs', detail: 'Timed automations', icon: <IconClock size={M} stroke={STK} className="text-blue-400" /> },
        { name: 'Reminders', detail: 'Time-triggered alerts', icon: <IconBell size={M} stroke={STK} className="text-rc-yellow" /> },
      ],
    },
  ],
}

export default function App() {
  const [expandedSlot, setExpandedSlot] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  const handleCopy = (type, name) => {
    if (type === 'loadout') showToast('Copied loadout!')
    else if (type === 'slot') showToast(`Copied ${name}!`)
    else if (type === 'item') showToast(`Copied ${name}!`)
  }

  return (
    <div className="min-h-screen bg-rc-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-grotesk font-bold text-rc-text mb-2">
                {sampleLoadout.name}
              </h1>
              <p className="text-rc-text-dim text-sm md:text-base">
                {sampleLoadout.description}
              </p>
              <p className="text-rc-text-muted text-xs mt-1">
                v{sampleLoadout.version}
              </p>
            </div>
            <button
              onClick={() => handleCopy('loadout')}
              className="px-4 py-2 bg-rc-cyan/10 hover:bg-rc-cyan/20 text-rc-cyan rounded-lg transition-colors text-sm font-medium border border-rc-cyan/20 self-start md:self-auto font-grotesk"
            >
              Copy Loadout
            </button>
          </div>
        </div>

        {/* Slot Grid */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {sampleLoadout.slots.map((slot, index) => (
            <div key={index} className="relative">
              <motion.div
                onClick={() => setExpandedSlot(expandedSlot === index ? null : index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer bg-rc-surface rounded-2xl p-5 border border-rc-border hover:border-rc-cyan/40 transition-all duration-200 w-fit"
              >
                <div className="grid grid-cols-2 gap-2 mb-3 w-24 h-24 mx-auto">
                  {slot.items.slice(0, 4).map((item, i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-xl flex items-center justify-center"
                    >
                      {item.icon}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-rc-text-dim">
                  {slot.icon}
                  <span className="text-sm font-grotesk font-semibold">
                    {slot.name}
                  </span>
                </div>
              </motion.div>

              <AnimatePresence>
                {expandedSlot === index && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setExpandedSlot(null)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[80vh] overflow-y-auto bg-rc-surface rounded-3xl border border-rc-border z-50 shadow-2xl"
                    >
                      <div className="sticky top-0 bg-rc-surface/95 backdrop-blur-sm border-b border-rc-border p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-rc-cyan">{slot.icon}</div>
                          <div>
                            <h2 className="text-2xl font-grotesk font-bold text-rc-text">
                              {slot.name}
                            </h2>
                            <p className="text-rc-text-dim text-sm mt-0.5">
                              {slot.items.length} items
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy('slot', slot.name)
                            }}
                            className="px-4 py-2 bg-rc-cyan/10 hover:bg-rc-cyan/20 text-rc-cyan rounded-lg transition-colors text-sm font-medium border border-rc-cyan/20"
                          >
                            Copy Slot
                          </button>
                          <button
                            onClick={() => setExpandedSlot(null)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-rc-text"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        {slot.items.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-rc-border hover:border-rc-cyan/20 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-grotesk font-semibold text-rc-text">
                                {item.name}
                              </p>
                              <p className="text-rc-text-dim text-sm truncate">
                                {item.detail}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopy('item', item.name)
                              }}
                              className="px-3 py-1.5 bg-rc-cyan/0 group-hover:bg-rc-cyan/10 text-rc-cyan/60 group-hover:text-rc-cyan rounded-lg transition-all text-xs font-medium opacity-0 group-hover:opacity-100"
                            >
                              Copy
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-rc-cyan rounded-full text-rc-bg font-grotesk font-medium shadow-lg z-50"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
