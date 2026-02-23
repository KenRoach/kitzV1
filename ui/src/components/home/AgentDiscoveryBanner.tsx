import { Code, ExternalLink } from 'lucide-react'

const manifestUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/.well-known/kitz.json`
  : '/.well-known/kitz.json'

const jsonPreview = `{
  "name": "KITZ",
  "version": "0.1.0",
  "capabilities": {
    "agentTeams": 18,
    "tools": 68,
    "sops": 6,
    "languages": ["en", "es"]
  },
  "agentTeams": [...]
}`

export function AgentDiscoveryBanner() {
  return (
    <div className="mt-8 mb-4 rounded-2xl bg-gray-900 p-6 text-white">
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
        {/* Left — text */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-400" />
            <h3 className="text-xl font-bold">Built for AI Agents</h3>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            External AI agents can discover and integrate with KITZ capabilities
            through our machine-readable manifest endpoint.
          </p>
          <a
            href={manifestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 transition hover:text-purple-300"
          >
            <span className="font-mono">{manifestUrl}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Right — JSON preview */}
        <div className="relative hidden w-72 shrink-0 lg:block">
          <pre className="overflow-hidden rounded-xl bg-black/50 p-4 font-mono text-[11px] leading-relaxed text-green-400">
            {jsonPreview}
          </pre>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-xl bg-gradient-to-t from-gray-900" />
        </div>
      </div>
    </div>
  )
}
