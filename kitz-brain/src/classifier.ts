/**
 * Classifier — LLM-powered message classifier for real-time routing.
 *
 * Takes a user message + context and returns a BrainDecision:
 * which strategy (direct_tool, single_agent, multi_agent, swarm, clarify),
 * which agents, confidence level, and whether review is required.
 */

import { llmHubClient } from './llm/hubClient.js';

export type Strategy = 'direct_tool' | 'single_agent' | 'multi_agent' | 'swarm' | 'clarify';

export interface BrainDecision {
  strategy: Strategy;
  confidence: number;         // 0-100
  agents?: string[];          // e.g. ['CFO', 'CMO']
  teams?: string[];           // e.g. ['sales-crm', 'marketing-growth']
  reasoning: string;          // brief explanation for logs
  toolHints?: string[];       // specific tools brain thinks relevant
  clarificationQuestion?: string;
  reviewRequired: boolean;    // true for writes, multi-agent, swarm
  traceId: string;
}

export interface ClassifyRequest {
  message: string;
  channel: string;
  userId: string;
  traceId: string;
  chatHistory?: Array<{ role: string; content: string }>;
  mediaContext?: { mime_type: string; media_base64?: string };
}

const CLASSIFICATION_PROMPT = `You are the KITZ Brain — the classification layer for an AI Business Operating System.

Your job: Given a user message + context, decide the best execution strategy.

STRATEGIES:
- direct_tool — Simple reads, status checks, dashboard lookups. Use existing tool pipeline. Fast.
- single_agent — One specialist agent needed. E.g., finance question → CFO, sales → CRO, ops → COO.
- multi_agent — Sequential collaboration needed. E.g., pitch deck needs CFO (financial data) + CMO (design).
- swarm — Large parallel analysis across multiple teams. E.g., full business review, quarterly planning.
- clarify — Ambiguous request. Ask the user for more information before proceeding.

AGENT NAMES (C-Suite):
CEO, CFO, CMO, COO, CPO, CRO, CTO, HeadCustomer, HeadEducation, HeadEngineering, HeadGrowth, HeadIntelligenceRisk

ROUTING HEURISTICS:
- Finance/revenue/budget/ROI/payments → CFO
- Sales/leads/CRM/pipeline/follow-up → CRO
- Marketing/campaign/content/brand/growth → CMO
- Operations/orders/delivery/SLA/logistics → COO
- Product/feature/roadmap/UX/design → CPO
- Engineering/code/deploy/infrastructure/API → CTO
- Customer support/complaints/satisfaction → HeadCustomer
- Education/onboarding/tutorials → HeadEducation
- Strategy/vision/launch/approve → CEO

REVIEW REQUIRED when:
- Any write operation (create, update, delete, send, compose)
- multi_agent or swarm strategy
- Outbound messages (email, WhatsApp, SMS, voice)

NOT REQUIRED when:
- Simple reads (list, get, search, status, dashboard)
- direct_tool strategy with read-only intent

Respond with ONLY valid JSON (no markdown fences):
{
  "strategy": "direct_tool|single_agent|multi_agent|swarm|clarify",
  "confidence": <0-100>,
  "agents": ["AgentName"],
  "teams": [],
  "reasoning": "brief explanation",
  "toolHints": ["tool_name"],
  "clarificationQuestion": "question if strategy is clarify",
  "reviewRequired": true|false
}`;

/**
 * Keyword-based fallback routing — used when LLM Hub is unreachable.
 * Mirrors taskDispatcher.ts routing logic.
 */
function keywordFallback(message: string, traceId: string): BrainDecision {
  const lower = message.toLowerCase();

  const routingRules: Array<{ keywords: string[]; agent: string }> = [
    { keywords: ['revenue', 'finance', 'budget', 'roi', 'spend', 'cost', 'credit', 'payment', 'invoice', 'tax'], agent: 'CFO' },
    { keywords: ['marketing', 'campaign', 'content', 'brand', 'invite', 'growth', 'social', 'seo'], agent: 'CMO' },
    { keywords: ['sales', 'lead', 'crm', 'pipeline', 'follow-up', 'prospect', 'deal', 'outreach'], agent: 'CRO' },
    { keywords: ['operations', 'order', 'delivery', 'sla', 'logistics', 'fulfillment', 'shipping'], agent: 'COO' },
    { keywords: ['product', 'feature', 'roadmap', 'ux', 'design'], agent: 'CPO' },
    { keywords: ['engineering', 'code', 'deploy', 'infrastructure', 'api', 'bug', 'server'], agent: 'CTO' },
    { keywords: ['customer', 'support', 'complaint', 'satisfaction', 'feedback', 'ticket'], agent: 'HeadCustomer' },
    { keywords: ['strategy', 'vision', 'decision', 'approve', 'launch'], agent: 'CEO' },
  ];

  // Simple read patterns → direct_tool
  const readPatterns = /\b(list|show|get|check|status|dashboard|how many|what'?s my|battery|contacts|orders|storefronts|products|summary|metrics|inbox)\b/i;
  if (readPatterns.test(lower)) {
    return {
      strategy: 'direct_tool',
      confidence: 70,
      reasoning: 'Keyword fallback: read-only intent detected',
      reviewRequired: false,
      traceId,
    };
  }

  // Write patterns → needs review
  const writePatterns = /\b(create|send|email|compose|update|delete|make|build|generate|draft|pitch|deck|call|broadcast)\b/i;
  const isWrite = writePatterns.test(lower);

  // Multi-agent patterns
  const multiPatterns = /\b(pitch deck|business review|quarterly|full report|comprehensive|analyze everything)\b/i;
  if (multiPatterns.test(lower)) {
    return {
      strategy: 'multi_agent',
      confidence: 60,
      agents: ['CFO', 'CMO'],
      reasoning: 'Keyword fallback: multi-agent complexity detected',
      reviewRequired: true,
      traceId,
    };
  }

  // Swarm patterns
  const swarmPatterns = /\b(full business review|company-wide|all departments|swarm|everything)\b/i;
  if (swarmPatterns.test(lower)) {
    return {
      strategy: 'swarm',
      confidence: 55,
      teams: ['sales-crm', 'marketing-growth', 'finance-billing', 'strategy-intel'],
      reasoning: 'Keyword fallback: swarm-level breadth detected',
      reviewRequired: true,
      traceId,
    };
  }

  // Single agent routing
  let bestAgent = 'CEO';
  let bestScore = 0;
  for (const rule of routingRules) {
    const score = rule.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestAgent = rule.agent;
    }
  }

  if (bestScore > 0) {
    return {
      strategy: 'single_agent',
      confidence: 65,
      agents: [bestAgent],
      reasoning: `Keyword fallback: routed to ${bestAgent} (score ${bestScore})`,
      reviewRequired: isWrite,
      traceId,
    };
  }

  // Default: direct_tool (let existing routeWithAI handle it)
  return {
    strategy: 'direct_tool',
    confidence: 50,
    reasoning: 'Keyword fallback: no strong signal, defaulting to direct_tool',
    reviewRequired: isWrite,
    traceId,
  };
}

/**
 * Classify a user message and return a BrainDecision.
 * Uses LLM Hub (Haiku tier) for classification, with keyword fallback.
 */
export async function classify(req: ClassifyRequest): Promise<BrainDecision> {
  const { message, channel, userId, traceId, chatHistory, mediaContext } = req;

  // Build the user prompt
  let userPrompt = `User message: "${message}"\nChannel: ${channel}\nUser ID: ${userId}`;
  if (mediaContext) {
    userPrompt += `\nAttachment: ${mediaContext.mime_type}`;
  }
  if (chatHistory && chatHistory.length > 0) {
    const recent = chatHistory.slice(-5);
    userPrompt += `\nRecent conversation:\n${recent.map(m => `${m.role}: ${m.content}`).join('\n')}`;
  }

  try {
    const fullPrompt = `${CLASSIFICATION_PROMPT}\n\n${userPrompt}`;

    const result = await Promise.race([
      llmHubClient.complete('classification', fullPrompt, traceId),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Classification timeout')), 3000)
      ),
    ]) as { text?: string };

    const text = result.text || '';

    // Parse JSON from LLM response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(JSON.stringify({ ts: new Date().toISOString(), phase: 'classify.parse_fail', traceId, text: text.slice(0, 200) }));
      return keywordFallback(message, traceId);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<BrainDecision>;

    // Validate required fields
    const validStrategies: Strategy[] = ['direct_tool', 'single_agent', 'multi_agent', 'swarm', 'clarify'];
    if (!parsed.strategy || !validStrategies.includes(parsed.strategy)) {
      return keywordFallback(message, traceId);
    }

    return {
      strategy: parsed.strategy,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
      agents: parsed.agents,
      teams: parsed.teams,
      reasoning: parsed.reasoning || 'LLM classification',
      toolHints: parsed.toolHints,
      clarificationQuestion: parsed.clarificationQuestion,
      reviewRequired: parsed.reviewRequired ?? false,
      traceId,
    };
  } catch (err) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      phase: 'classify.error',
      traceId,
      error: (err as Error).message,
    }));
    return keywordFallback(message, traceId);
  }
}
