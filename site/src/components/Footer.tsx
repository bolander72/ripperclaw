import { IconBrandGithub, IconBrandDiscord } from '@tabler/icons-react'

export default function Footer() {
  return (
    <footer className="border-t border-rc-border py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">ClawClawGo</h4>
            <ul className="space-y-2.5">
              <li><a href="/feed" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Feed</a></li>
              <li><a href="/search" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Search</a></li>
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
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">OpenClaw</h4>
            <ul className="space-y-2.5">
              <li><a href="https://docs.openclaw.ai" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">OpenClaw Docs</a></li>
              <li><a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">GitHub</a></li>
              <li><a href="https://clawhub.com" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">ClawHub Skills</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-grotesk font-semibold text-rc-text text-sm mb-4">Community</h4>
            <ul className="space-y-2.5">
              <li><a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Discord</a></li>
              <li><a href="https://github.com/bolander72/clawclawgo/discussions" target="_blank" rel="noopener" className="text-rc-text-dim text-sm hover:text-rc-text transition-colors">Discussions</a></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-rc-border">
          <p className="text-rc-text-muted text-xs font-mono">clawclawgo · agent skills aggregator · search · remix · export</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/bolander72/clawclawgo" target="_blank" rel="noopener" className="text-rc-text-muted hover:text-rc-text transition-colors"><IconBrandGithub size={18} /></a>
            <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="text-rc-text-muted hover:text-rc-text transition-colors"><IconBrandDiscord size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
