/**
 * Claude API Client — Tiered Model Routing with OpenAI Fallback
 *
 * The BRAIN of KITZ. Claude preferred, OpenAI backup.
 *
 * Load balancing strategy:
 *   - Claude Opus    → fallback: OpenAI gpt-4o (strategy, C-suite)
 *   - Claude Sonnet  → fallback: OpenAI gpt-4o (analysis, content)
 *   - Claude Haiku   → fallback: OpenAI gpt-4o-mini (classification, extraction)
 *
 * If Claude fails (rate limit, 500, timeout), auto-falls back to OpenAI.
 * If OpenAI also fails, returns error message.
 *
 * Used by:
 *   - semanticRouter.ts (READ/COMPREHEND/VOICE phases)
 *   - agentTools.ts (agent conversations — tiered by agent importance)
 *   - factCheckTools.ts, docScanTools.ts, braindumpTools.ts
 *
 * Usage:
 *   import { claudeChat, claudeThink } from './claudeClient.js';
 *   const answer = await claudeChat(messages, 'sonnet', traceId);
 *   const strategy = await claudeThink("analyze my business", context, traceId);
 */

// ── Config ──
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';

const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// ── Model Tiers ──
export type ClaudeTier = 'opus' | 'sonnet' | 'haiku';

const TIER_MODELS: Record<ClaudeTier, string> = {
  opus:   'claude-opus-4-6',               // Best brain — strategy, C-suite, complex decisions
  sonnet: 'claude-sonnet-4-20250514',      // Mid-tier — analysis, content, operational agents
  haiku:  'claude-haiku-4-5-20251001',     // Fast + cheap — extraction, quick answers, classification
};

// OpenAI fallback models (equivalent tier)
const TIER_OPENAI_FALLBACK: Record<ClaudeTier, string> = {
  opus:   'gpt-4o',          // Strategy fallback
  sonnet: 'gpt-4o',          // Analysis fallback
  haiku:  'gpt-4o-mini',     // Transactional fallback
};

// Token limits per tier (controls cost)
const TIER_MAX_TOKENS: Record<ClaudeTier, number> = {
  opus:   4096,  // Strategic thinking gets more room
  sonnet: 2048,  // Standard work
  haiku:  1024,  // Quick answers
};

// Temperature per tier
const TIER_TEMPERATURE: Record<ClaudeTier, number> = {
  opus:   0.4,  // Slightly creative for strategy
  sonnet: 0.3,  // Balanced
  haiku:  0.2,  // Precise
};

// ── Types ──
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ── OpenAI Fallback ──

async function openaiChatFallback(
  messages: ClaudeMessage[],
  tier: ClaudeTier,
  traceId?: string,
  systemPrompt?: string,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return '[No AI available — both Claude and OpenAI keys missing]';
  }

  const model = TIER_OPENAI_FALLBACK[tier];
  const maxTokens = TIER_MAX_TOKENS[tier];
  const temperature = TIER_TEMPERATURE[tier];

  const openaiMessages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    openaiMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const msg of messages) {
    openaiMessages.push({ role: msg.role, content: msg.content });
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    module: 'claudeClient',
    action: 'fallback_to_openai',
    tier,
    model,
    trace_id: traceId,
  }));

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
      signal: AbortSignal.timeout(tier === 'opus' ? 120_000 : 60_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'claudeClient',
        error: `OpenAI fallback HTTP ${res.status}`,
        detail: errText.slice(0, 300),
        trace_id: traceId,
      }));
      return `[Both Claude and OpenAI failed: OpenAI ${res.status}]`;
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'claudeClient',
      action: 'openai_fallback_response',
      tier,
      model,
      prompt_tokens: data.usage?.prompt_tokens,
      completion_tokens: data.usage?.completion_tokens,
      trace_id: traceId,
    }));

    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    return `[OpenAI fallback error: ${(err as Error).message}]`;
  }
}

// ── Core Chat Function ──

/**
 * Send messages to Claude and get a response.
 * Auto-falls back to OpenAI if Claude fails.
 *
 * @param messages - Array of user/assistant messages
 * @param tier - Model tier: 'opus' | 'sonnet' | 'haiku'
 * @param traceId - Trace ID for logging
 * @param systemPrompt - Optional system prompt
 * @returns The assistant's text response
 */
export async function claudeChat(
  messages: ClaudeMessage[],
  tier: ClaudeTier = 'sonnet',
  traceId?: string,
  systemPrompt?: string,
): Promise<string> {
  // If Claude is not configured, go straight to OpenAI
  if (!CLAUDE_API_KEY) {
    console.warn('[claudeClient] CLAUDE_API_KEY not set — falling back to OpenAI');
    return openaiChatFallback(messages, tier, traceId, systemPrompt);
  }

  const model = TIER_MODELS[tier];
  const maxTokens = TIER_MAX_TOKENS[tier];
  const temperature = TIER_TEMPERATURE[tier];

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    module: 'claudeClient',
    action: 'request',
    tier,
    model,
    message_count: messages.length,
    trace_id: traceId,
  }));

  try {
    const res = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': CLAUDE_API_VERSION,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(tier === 'opus' ? 120_000 : 60_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        module: 'claudeClient',
        error: `HTTP ${res.status}`,
        detail: errText.slice(0, 500),
        tier,
        model,
        trace_id: traceId,
      }));

      // Fallback to OpenAI on Claude failure (rate limit, 500, etc.)
      console.warn(`[claudeClient] Claude ${tier} failed (${res.status}) — falling back to OpenAI`);
      return openaiChatFallback(messages, tier, traceId, systemPrompt);
    }

    const data = await res.json() as ClaudeResponse;

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'claudeClient',
      action: 'response',
      tier,
      model: data.model,
      input_tokens: data.usage?.input_tokens,
      output_tokens: data.usage?.output_tokens,
      stop_reason: data.stop_reason,
      trace_id: traceId,
    }));

    // Extract text from content blocks
    const text = data.content
      ?.filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n') || '';

    return text;
  } catch (err) {
    // Network error, timeout, etc. — fallback to OpenAI
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'claudeClient',
      error: 'fetch_failed',
      detail: (err as Error).message,
      tier,
      model,
      trace_id: traceId,
    }));
    console.warn(`[claudeClient] Claude ${tier} unreachable — falling back to OpenAI`);
    return openaiChatFallback(messages, tier, traceId, systemPrompt);
  }
}

// ── Strategic Think Function ──

/**
 * Use Claude Opus for strategic thinking about the business.
 * Falls back to OpenAI gpt-4o if Claude is unavailable.
 */
export async function claudeThink(
  question: string,
  context: Record<string, unknown> | string,
  traceId?: string,
): Promise<string> {
  const contextStr = typeof context === 'string' ? context : JSON.stringify(context, null, 2);

  const systemPrompt = `You are the strategic brain of KITZ, an AI business operating system.

You think like a world-class CEO + COO. Your job:
- Analyze data and find leverage points
- Identify bottlenecks and risks
- Recommend 1-3 high-impact moves
- Think in systems, not tasks

Rules:
- Be direct and concise (max 200 words)
- Use numbers when available
- Prioritize revenue-generating actions
- Flag risks clearly
- End with ONE specific next step`;

  return claudeChat(
    [
      {
        role: 'user',
        content: `${question}\n\n--- BUSINESS DATA ---\n${contextStr.slice(0, 8000)}`,
      },
    ],
    'opus',
    traceId,
    systemPrompt,
  );
}

// ── Content Creation Function ──

/**
 * Use Claude Sonnet for content creation (emails, posts, descriptions).
 * Falls back to OpenAI gpt-4o if Claude is unavailable.
 */
export async function claudeCreate(
  prompt: string,
  tone: string = 'professional, warm, concise',
  traceId?: string,
): Promise<string> {
  return claudeChat(
    [{ role: 'user', content: prompt }],
    'sonnet',
    traceId,
    `You are a content creator for a small business. Write in this tone: ${tone}. Be concise. No fluff. Maximum 150 words unless the user asks for more.`,
  );
}

// ── Quick Classification ──

/**
 * Use Claude Haiku for fast classification or extraction.
 * Falls back to OpenAI gpt-4o-mini if Claude is unavailable.
 */
export async function claudeClassify(
  text: string,
  categories: string[],
  traceId?: string,
): Promise<string> {
  return claudeChat(
    [
      {
        role: 'user',
        content: `Classify this text into exactly ONE of these categories: ${categories.join(', ')}\n\nText: "${text.slice(0, 1000)}"\n\nRespond with ONLY the category name, nothing else.`,
      },
    ],
    'haiku',
    traceId,
  );
}

// ── Availability Check ──

/**
 * Check if any AI is available (Claude or OpenAI).
 */
export function isClaudeConfigured(): boolean {
  return CLAUDE_API_KEY.length > 0 || OPENAI_API_KEY.length > 0;
}

export function getClaudeModel(tier: ClaudeTier): string {
  return TIER_MODELS[tier];
}
