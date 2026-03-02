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

import { createSubsystemLogger } from 'kitz-schemas';

const log = createSubsystemLogger('claudeClient');

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

  log.info('fallback_to_openai', { trace_id: traceId });

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
      log.error(`OpenAI fallback HTTP ${res.status}`, { detail: errText.slice(0, 300), trace_id: traceId });
      return `[Both Claude and OpenAI failed: OpenAI ${res.status}]`;
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    log.info('openai_fallback_response', { trace_id: traceId });

    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    return `[OpenAI fallback error: ${(err as Error).message}]`;
  }
}

// ── Retry helper ──

/** Parse Retry-After header (seconds or HTTP date). Returns ms to wait. */
function parseRetryAfter(header: string | null): number {
  if (!header) return 0;
  const secs = Number(header);
  if (!isNaN(secs) && secs > 0) return secs * 1000;
  const date = Date.parse(header);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  return 0;
}

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

// ── Core Chat Function ──

/**
 * Send messages to Claude and get a response.
 * Retries on 429/529 with exponential backoff.
 * Auto-falls back to OpenAI if retries are exhausted or on other errors.
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
    log.warn('CLAUDE_API_KEY not set — falling back to OpenAI');
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

  const bodyStr = JSON.stringify(body);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    log.info('request', { trace_id: traceId });

    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': CLAUDE_API_VERSION,
        },
        body: bodyStr,
        signal: AbortSignal.timeout(tier === 'opus' ? 120_000 : 60_000),
      });

      if (res.ok) {
        const data = await res.json() as ClaudeResponse;

        log.info('response', { trace_id: traceId });

        // Extract text from content blocks
        const text = data.content
          ?.filter(c => c.type === 'text' && c.text)
          .map(c => c.text)
          .join('\n') || '';

        return text;
      }

      // Rate limited (429) or overloaded (529) — retry with backoff
      if ((res.status === 429 || res.status === 529) && attempt < MAX_RETRIES) {
        const retryAfterMs = parseRetryAfter(res.headers.get('retry-after'));
        const backoffMs = retryAfterMs || BASE_BACKOFF_MS * Math.pow(2, attempt);
        log.warn('warning', { trace_id: traceId });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      // Non-retryable error or retries exhausted — fall back to OpenAI
      const errText = await res.text().catch(() => 'unknown');
      log.error(`Claude HTTP ${res.status}`, { detail: errText.slice(0, 500), tier, model, attempt, trace_id: traceId });

      log.warn(`Claude ${tier} failed (${res.status}) after ${attempt + 1} attempts — falling back to OpenAI`);
      return openaiChatFallback(messages, tier, traceId, systemPrompt);

    } catch (err) {
      // Network error, timeout — if retryable, try again
      if (attempt < MAX_RETRIES && (err as Error).name !== 'AbortError') {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt);
        log.warn('warning', { trace_id: traceId });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      log.error('fetch_failed', { trace_id: traceId });
      log.warn(`Claude ${tier} unreachable after ${attempt + 1} attempts — falling back to OpenAI`);
      return openaiChatFallback(messages, tier, traceId, systemPrompt);
    }
  }

  // Should not reach here, but safety fallback
  return openaiChatFallback(messages, tier, traceId, systemPrompt);
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

// ── Tool-Use Loop Types ──

export interface ToolCallLog {
  toolName: string;
  toolArgs: Record<string, unknown>;
  result: unknown;
}

export interface ToolLoopResponse {
  text: string;
  toolCalls: ToolCallLog[];
  iterations: number;
}

// ── Native Tool-Use Loop ──

/**
 * Agentic tool-use loop using Claude's native tool_use API.
 *
 * Sends a request to Claude with tool definitions. When Claude responds with
 * tool_use blocks, executes each tool and feeds results back. Loops until
 * Claude returns end_turn or max iterations reached.
 *
 * @param systemPrompt - System context for the conversation
 * @param messages - Conversation history
 * @param tools - Tool schemas in Claude API format
 * @param executeTool - Function to execute a tool by name
 * @param options - Tier, max iterations, callbacks
 */
export async function claudeToolLoop(
  systemPrompt: string,
  messages: ClaudeMessage[],
  tools: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>,
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  options?: {
    tier?: ClaudeTier;
    traceId?: string;
    maxIterations?: number;
    onToolCall?: (name: string, args: Record<string, unknown>) => void;
    onToolResult?: (name: string, result: unknown) => void;
    onTextDelta?: (text: string) => void;
  },
): Promise<ToolLoopResponse> {
  const tier = options?.tier ?? 'sonnet';
  const traceId = options?.traceId;
  const maxIterations = options?.maxIterations ?? 10;

  if (!CLAUDE_API_KEY) {
    log.warn('No CLAUDE_API_KEY — falling back to text-only');
    const text = await openaiChatFallback(messages, tier, traceId, systemPrompt);
    return { text, toolCalls: [], iterations: 0 };
  }

  const model = TIER_MODELS[tier];
  const maxTokens = TIER_MAX_TOKENS[tier];
  const temperature = TIER_TEMPERATURE[tier];
  const toolCalls: ToolCallLog[] = [];

  // Build mutable message array — start with user messages
  const loopMessages: Array<Record<string, unknown>> = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    log.info('tool_loop_iter', { iteration, tier, trace_id: traceId });

    let res: Response;
    try {
      res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': CLAUDE_API_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: loopMessages,
          ...(tools.length > 0 ? { tools } : {}),
        }),
        signal: AbortSignal.timeout(tier === 'opus' ? 120_000 : 60_000),
      });
    } catch (err) {
      log.error('tool_loop_fetch_error', { error: (err as Error).message, trace_id: traceId });
      return { text: `[Network error: ${(err as Error).message}]`, toolCalls, iterations: iteration + 1 };
    }

    if (!res.ok) {
      // On rate limit, try OpenAI fallback for the final text
      if (res.status === 429 || res.status === 529) {
        log.warn('tool_loop_rate_limited', { status: res.status, trace_id: traceId });
        const fallbackText = await openaiChatFallback(messages, tier, traceId, systemPrompt);
        return { text: fallbackText, toolCalls, iterations: iteration + 1 };
      }
      const errText = await res.text().catch(() => 'unknown');
      log.error('tool_loop_api_error', { status: res.status, detail: errText.slice(0, 300), trace_id: traceId });
      return { text: `[Claude API error: ${res.status}]`, toolCalls, iterations: iteration + 1 };
    }

    const data = await res.json() as {
      content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
      stop_reason: string;
      usage?: { input_tokens: number; output_tokens: number };
    };

    log.info('tool_loop_response', {
      stop_reason: data.stop_reason,
      content_blocks: data.content?.length,
      usage: data.usage,
      trace_id: traceId,
    });

    // Extract any text from this response
    const textBlocks = data.content?.filter(c => c.type === 'text' && c.text) || [];
    for (const tb of textBlocks) {
      options?.onTextDelta?.(tb.text!);
    }

    // End turn — return final text
    if (data.stop_reason === 'end_turn' || data.stop_reason === 'max_tokens') {
      const text = textBlocks.map(c => c.text).join('\n');
      return { text, toolCalls, iterations: iteration + 1 };
    }

    // Tool use — execute tools and loop
    if (data.stop_reason === 'tool_use') {
      // Push the full assistant response (text + tool_use blocks) into messages
      loopMessages.push({ role: 'assistant', content: data.content });

      const toolUseBlocks = data.content.filter(c => c.type === 'tool_use');
      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];

      for (const block of toolUseBlocks) {
        const toolName = block.name!;
        const toolArgs = (block.input || {}) as Record<string, unknown>;
        const toolUseId = block.id!;

        options?.onToolCall?.(toolName, toolArgs);
        log.info('executing_tool', { tool: toolName, iteration, trace_id: traceId });

        let result: unknown;
        try {
          result = await executeTool(toolName, toolArgs);
        } catch (err) {
          result = { error: `Tool "${toolName}" failed: ${(err as Error).message}` };
        }

        options?.onToolResult?.(toolName, result);
        toolCalls.push({ toolName, toolArgs, result });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        });
      }

      // Push tool results back
      loopMessages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop_reason — return what we have
    const text = textBlocks.map(c => c.text).join('\n');
    return { text, toolCalls, iterations: iteration + 1 };
  }

  log.warn('tool_loop_max_iters', { maxIterations, trace_id: traceId });
  return { text: '[Reached maximum tool loop iterations]', toolCalls, iterations: maxIterations };
}
