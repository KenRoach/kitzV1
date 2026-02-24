import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage } from '../../../types.js';

/**
 * FactChecker — Verifies all outbound content for accuracy before human review.
 *
 * Responsibilities:
 * - Intercept outbound drafts (WhatsApp, email, content)
 * - Extract factual claims using LLM
 * - Cross-reference claims against CRM data, orders, and knowledge base
 * - Flag unsourced or unverifiable claims
 * - Route verified + flagged content for human review with sources
 *
 * Philosophy: Never let fabricated information reach a customer.
 * If a claim can't be verified, it gets flagged. Always.
 */
export class FactCheckerAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('FactChecker', bus, memory);
    this.team = 'legal-compliance';
    this.tier = 'team';
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? msg.id;

    // Check if this is outbound content that needs fact-checking
    const content = (payload.message as string) || (payload.content as string) || (payload.draft as string) || '';
    if (!content) {
      // No content to check — run general fact-check tools
      const result = await this.invokeTool('compliance_factCheck', {
        message: JSON.stringify(payload.findings ?? payload),
      }, traceId);

      await this.publish('SWARM_TASK_COMPLETE', {
        agent: this.name,
        team: this.team,
        tool: 'compliance_factCheck',
        findings: result.data ?? result.error,
        traceId,
      });
      return;
    }

    // Step 1: Extract and verify claims against real data
    const factCheckResult = await this.invokeTool('compliance_factCheck', {
      message: content,
      recipient_context: (payload.recipient as string) ?? '',
    }, traceId);

    const factData = factCheckResult.data as {
      compliant?: boolean;
      flags?: Array<{ claim: string; verified: boolean; source?: string }>;
      recommendation?: string;
    } | undefined;

    // Step 2: Use LLM to analyze the overall truthfulness
    const analyzeResult = await this.invokeTool('llm_analyze', {
      topic: 'content truthfulness and source verification',
      data: JSON.stringify({
        content,
        factCheckResult: factData,
        claimsFound: factData?.flags?.length ?? 0,
        unverifiedClaims: factData?.flags?.filter(f => !f.verified) ?? [],
      }),
      format: 'json',
    }, traceId);

    // Step 3: Compile fact-check report
    const report = {
      agent: this.name,
      team: this.team,
      contentChecked: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
      compliant: factData?.compliant ?? false,
      totalClaims: factData?.flags?.length ?? 0,
      verifiedClaims: factData?.flags?.filter(f => f.verified).length ?? 0,
      unverifiedClaims: factData?.flags?.filter(f => !f.verified) ?? [],
      recommendation: factData?.recommendation ?? 'Review required',
      analysis: analyzeResult.data,
      requiresHumanReview: true, // Always route to human
      traceId,
    };

    // Step 4: Store findings in knowledge base
    await this.invokeTool('memory_store_knowledge', {
      category: 'fact-check',
      content: JSON.stringify(report),
      tags: ['fact-check', 'outbound', 'compliance'],
    }, traceId);

    // Step 5: Publish completion with full report
    await this.publish('SWARM_TASK_COMPLETE', {
      ...report,
      tool: 'compliance_factCheck',
      findings: report,
    });

    // If not compliant, escalate
    if (!report.compliant) {
      await this.escalate(
        `Outbound content has ${report.unverifiedClaims.length} unverified claims. Human review required before sending.`,
        { factCheckReport: report },
      );
    }
  }
}
