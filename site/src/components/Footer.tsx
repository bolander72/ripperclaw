import { IconBrandGithub } from '@tabler/icons-react'

export default function Footer() {
  return (
    <footer className="border-t border-rc-border py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">ClawClawGo</h4>
            <ul className="space-y-2.5">
              <li><a href="/explore" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Explore</a></li>
              <li><a href="/community" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Community Builds</a></li>
              <li><a href="/docs/" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Documentation</a></li>
              <li><a href="https://github.com/bolander72/clawclawgo" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Learn</h4>
            <ul className="space-y-2.5">
              <li><a href="/about" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">What is ClawClawGo?</a></li>
              <li><a href="/faqs" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">FAQs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Community</h4>
            <ul className="space-y-2.5">
              <li><a href="https://github.com/bolander72/clawclawgo/issues" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Report an Issue</a></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-rc-border">
          <p className="text-rc-text-muted text-xs font-mono">clawclawgo · agent skills search engine</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/bolander72/clawclawgo" target="_blank" rel="noopener" className="text-rc-text-muted hover:text-rc-text transition-colors"><IconBrandGithub size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
