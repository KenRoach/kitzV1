/**
 * FeedbackAggregator — Collects all swarm findings and produces a structured report.
 *
 * After a swarm run completes, this aggregates:
 * - Per-team findings
 * - Cross-team patterns
 * - Action items
 * - Risk flags
 */

import type { KnowledgeEntry } from './knowledgeBridge.js'
import type { SwarmResult } from './swarmRunner.js'
import type { TrackedLink } from './linkRegistry.js'

export interface SwarmReport {
  id: string
  generatedAt: string
  swarmResult: SwarmResult
  teamReports: TeamReport[]
  crossTeamPatterns: string[]
  actionItems: ActionItem[]
  riskFlags: string[]
  linksSummary: { total: number; pending: number; tested: number; failed: number }
}

export interface TeamReport {
  team: string
  agentsRun: number
  agentsSucceeded: number
  findings: string[]
  durationMs: number
}

export interface ActionItem {
  priority: 'high' | 'medium' | 'low'
  team: string
  description: string
  assignee?: string
}

export class FeedbackAggregator {
  /** Generate a structured report from swarm results */
  aggregate(
    swarmResult: SwarmResult,
    knowledge: KnowledgeEntry[],
    links: TrackedLink[],
  ): SwarmReport {
    const teamReports: TeamReport[] = swarmResult.teamResults.map(tr => ({
      team: tr.team,
      agentsRun: tr.agentResults.length,
      agentsSucceeded: tr.agentResults.filter(a => a.success).length,
      findings: knowledge
        .filter(k => k.team === tr.team)
        .map(k => k.content)
        .slice(0, 10),
      durationMs: tr.durationMs,
    }))

    const actionItems = this.extractActionItems(swarmResult, knowledge)
    const riskFlags = this.extractRiskFlags(swarmResult)
    const crossTeamPatterns = this.findCrossTeamPatterns(knowledge)

    const linksSummary = {
      total: links.length,
      pending: links.filter(l => l.status === 'pending').length,
      tested: links.filter(l => l.status === 'tested').length,
      failed: links.filter(l => l.status === 'failed').length,
    }

    return {
      id: swarmResult.id,
      generatedAt: new Date().toISOString(),
      swarmResult,
      teamReports,
      crossTeamPatterns,
      actionItems,
      riskFlags,
      linksSummary,
    }
  }

  private extractActionItems(result: SwarmResult, knowledge: KnowledgeEntry[]): ActionItem[] {
    const items: ActionItem[] = []

    // Flag failed teams
    for (const tr of result.teamResults) {
      if (tr.status === 'failed') {
        items.push({
          priority: 'high',
          team: tr.team,
          description: `Team ${tr.team} failed during swarm run: ${tr.error ?? 'unknown error'}`,
        })
      }

      // Flag agents that failed
      for (const ar of tr.agentResults) {
        if (!ar.success) {
          items.push({
            priority: 'medium',
            team: tr.team,
            description: `Agent ${ar.agent} failed: ${ar.error ?? 'unknown'}`,
            assignee: ar.agent,
          })
        }
      }
    }

    // Flag teams with no knowledge output
    const teamsWithKnowledge = new Set(knowledge.map(k => k.team))
    for (const tr of result.teamResults) {
      if (!teamsWithKnowledge.has(tr.team) && tr.status === 'completed') {
        items.push({
          priority: 'low',
          team: tr.team,
          description: `Team ${tr.team} completed but produced no knowledge entries`,
        })
      }
    }

    return items
  }

  private extractRiskFlags(result: SwarmResult): string[] {
    const flags: string[] = []
    if (result.status === 'failed') flags.push('Swarm run failed entirely')
    if (result.status === 'partial') flags.push(`Only ${result.teamsCompleted}/${result.teamsTotal} teams completed`)
    if (result.durationMs > 120_000) flags.push(`Swarm run took ${(result.durationMs / 1000).toFixed(1)}s (>2min)`)
    if (result.handoffCount === 0) flags.push('No cross-agent handoffs occurred — agents may not be collaborating')
    if (result.knowledgeWritten === 0) flags.push('No knowledge was written to brain — findings may be lost')
    return flags
  }

  private findCrossTeamPatterns(knowledge: KnowledgeEntry[]): string[] {
    const patterns: string[] = []
    const teamCounts = new Map<string, number>()
    for (const k of knowledge) {
      teamCounts.set(k.team, (teamCounts.get(k.team) || 0) + 1)
    }
    if (teamCounts.size > 3) {
      patterns.push(`${teamCounts.size} teams contributed knowledge — good cross-team coverage`)
    }
    if (knowledge.length > 50) {
      patterns.push(`High knowledge output (${knowledge.length} entries) — agents are actively producing findings`)
    }
    return patterns
  }
}
