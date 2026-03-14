import { useState } from 'react'
import { IconLivePhoto, IconMenu2, IconX } from '@tabler/icons-react'

interface NavProps {
  minimal?: boolean
}

export default function Nav({ minimal }: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className={`border-b border-rc-border bg-rc-bg/90 backdrop-blur-md ${minimal ? '' : 'sticky top-0 z-40'}`}>
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-grotesk font-bold text-rc-text text-lg hover:text-rc-cyan transition-colors">
          ClawClawGo
        </a>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm">
          <a href="/explore" className="text-rc-text-dim hover:text-rc-cyan transition-colors flex items-center gap-1">
            <IconLivePhoto size={14} /> Explore
          </a>
          <a href="/community" className="text-rc-text-dim hover:text-rc-cyan transition-colors">Community</a>
          <a href="/docs/" className="text-rc-text-dim hover:text-rc-cyan transition-colors">Docs</a>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-rc-text hover:text-rc-cyan transition-colors"
        >
          {mobileMenuOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-rc-border bg-rc-bg">
          <nav className="flex flex-col p-4 gap-3 text-sm">
            <a href="/explore" className="text-rc-text-dim hover:text-rc-cyan transition-colors flex items-center gap-2">
              <IconLivePhoto size={14} /> Explore
            </a>
            <a href="/community" className="text-rc-text-dim hover:text-rc-cyan transition-colors">Community</a>
            <a href="/docs/" className="text-rc-text-dim hover:text-rc-cyan transition-colors">Docs</a>
          </nav>
        </div>
      )}
    </header>
  )
}
