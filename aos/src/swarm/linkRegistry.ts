/**
 * LinkRegistry — Tracks URLs/endpoints for swarm agents to crawl and test.
 *
 * Agents register links they discover. The swarm runner can query
 * for untested links and assign them to QA/frontend/backend agents.
 */

export interface TrackedLink {
  url: string
  type: 'page' | 'api' | 'webhook' | 'external'
  discoveredBy: string
  team: string
  status: 'pending' | 'tested' | 'failed' | 'skipped'
  lastTested?: string
  result?: Record<string, unknown>
  traceId?: string
}

export class LinkRegistry {
  private links = new Map<string, TrackedLink>()

  register(url: string, type: TrackedLink['type'], discoveredBy: string, team: string): void {
    if (this.links.has(url)) return
    this.links.set(url, { url, type, discoveredBy, team, status: 'pending' })
  }

  markTested(url: string, result: Record<string, unknown>, traceId?: string): void {
    const link = this.links.get(url)
    if (!link) return
    link.status = 'tested'
    link.lastTested = new Date().toISOString()
    link.result = result
    link.traceId = traceId
  }

  markFailed(url: string, error: string, traceId?: string): void {
    const link = this.links.get(url)
    if (!link) return
    link.status = 'failed'
    link.lastTested = new Date().toISOString()
    link.result = { error }
    link.traceId = traceId
  }

  getPending(): TrackedLink[] {
    return [...this.links.values()].filter(l => l.status === 'pending')
  }

  getAll(): TrackedLink[] {
    return [...this.links.values()]
  }

  getByTeam(team: string): TrackedLink[] {
    return [...this.links.values()].filter(l => l.team === team)
  }

  getByType(type: TrackedLink['type']): TrackedLink[] {
    return [...this.links.values()].filter(l => l.type === type)
  }

  getSummary(): { total: number; pending: number; tested: number; failed: number } {
    const all = [...this.links.values()]
    return {
      total: all.length,
      pending: all.filter(l => l.status === 'pending').length,
      tested: all.filter(l => l.status === 'tested').length,
      failed: all.filter(l => l.status === 'failed').length,
    }
  }

  clear(): void {
    this.links.clear()
  }

  /** Seed with default Kitz URLs */
  seedDefaults(): void {
    this.register('https://kitz.services', 'page', 'SwarmRunner', 'frontend')
    this.register('https://workspace.kitz.services', 'page', 'SwarmRunner', 'frontend')
    this.register('http://localhost:4000/health', 'api', 'SwarmRunner', 'platform-eng')
    this.register('http://localhost:3012/health', 'api', 'SwarmRunner', 'platform-eng')
    this.register('http://localhost:3012/api/kitz/status', 'api', 'SwarmRunner', 'platform-eng')
    this.register('http://localhost:3006/health', 'api', 'SwarmRunner', 'whatsapp-comms')
    this.register('http://localhost:3005/health', 'api', 'SwarmRunner', 'finance-billing')
    this.register('http://localhost:5678', 'page', 'SwarmRunner', 'devops-ci')
  }
}
