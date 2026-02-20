/**
 * AI Client — Hybrid Tool-Routing Engine
 *
 * The EXECUTE engine of KITZ's semantic router.
 *
 * Model tier strategy (powerful ↔ transactional):
 *   - Claude Opus    → Strategy, C-suite decisions (claudeClient.ts)
 *   - Claude Sonnet  → Analysis, content, planning (claudeClient.ts)
 *   - Claude Haiku   → Classification, extraction, voice polish (claudeClient.ts)
 *   - OpenAI gpt-4o-mini → Tool-routing loops (THIS FILE — cheapest for volume)
 *
 * The EXECUTE phase runs many tool-routing loops per request.
 * OpenAI gpt-4o-mini is the cheapest option for this high-volume work.
 * Falls back to Claude Haiku if no OpenAI key is set.
 *
 * Both APIs share the same ChatMessage/ToolDef types — the router is
 * transparent to callers. It auto-selects the best provider.
 */

// ── Config ────────────────────────────────────────────────

// OpenAI for transactional tool-routing (cheapest for volume)
const OPENAI_API_KEY =
  process.env.AI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

// Claude fallback for tool-routing (if no OpenAI key)
const CLAUDE_API_KEY =
  process.env.CLAUDE_API_KEY ||
  process.env.ANTHROPIC_API_KEY ||
  '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const CLAUDE_FALLBACK_MODEL = 'claude-haiku-4-5-20251001';

// ── Types ─────────────────────────────────────────────────

/**
 * ChatMessage — unified format used by the semantic router.
 * Works with both OpenAI and Anthropic APIs internally.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResult {
  message: ChatMessage;
  finishReason: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ── Anthropic-specific types (internal) ───────────────────

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

interface AnthropicContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'image';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | AnthropicContentBlock[];
  is_error?: boolean;
  source?: { type: string; media_type: string; data: string };
}

interface AnthropicToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ── OpenAI Client ─────────────────────────────────────────

async function openaiCompletion(
  messages: ChatMessage[],
  tools?: ToolDef[],
  traceId?: string,
): Promise<ChatCompletionResult> {
  const body: Record<string, unknown> = {
    model: OPENAI_MODEL,
    messages,
    stream: false,
    temperature: 0.3,
    max_tokens: 2048,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };

  if (traceId) {
    headers['x-trace-id'] = traceId;
  }

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'unknown error');
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'aiClient',
      provider: 'openai',
      error: `HTTP ${res.status}`,
      detail: errorText.slice(0, 500),
      trace_id: traceId,
    }));
    return {
      message: { role: 'assistant', content: `[OpenAI error: ${res.status}]` },
      finishReason: 'error',
    };
  }

  const data = await res.json() as Record<string, unknown>;
  const choices = data.choices as Array<Record<string, unknown>> | undefined;

  if (!choices || choices.length === 0) {
    return {
      message: { role: 'assistant', content: '[AI returned no response]' },
      finishReason: 'error',
    };
  }

  const choice = choices[0];
  const msg = choice.message as Record<string, unknown>;
  const finishReason = String(choice.finish_reason || 'stop');

  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: (msg.content as string) || null,
  };

  if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
    assistantMessage.tool_calls = (msg.tool_calls as Array<Record<string, unknown>>).map(tc => ({
      id: String(tc.id || `call_${Date.now()}`),
      type: 'function' as const,
      function: {
        name: String((tc.function as Record<string, unknown>)?.name || ''),
        arguments: String((tc.function as Record<string, unknown>)?.arguments || '{}'),
      },
    }));
  }

  return {
    message: assistantMessage,
    finishReason,
    usage: data.usage as ChatCompletionResult['usage'],
  };
}

// ── Anthropic Claude Client (fallback) ────────────────────

function convertToolDefsToAnthropic(tools: ToolDef[]): AnthropicToolDef[] {
  return tools.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));
}

function convertMessagesToAnthropic(messages: ChatMessage[]): {
  system: string | undefined;
  anthropicMessages: AnthropicMessage[];
} {
  let system: string | undefined;
  const anthropicMessages: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system = msg.content || undefined;
      continue;
    }

    if (msg.role === 'user') {
      anthropicMessages.push({ role: 'user', content: msg.content || '' });
      continue;
    }

    if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const blocks: AnthropicContentBlock[] = [];
        if (msg.content) blocks.push({ type: 'text', text: msg.content });
        for (const tc of msg.tool_calls) {
          let input: Record<string, unknown> = {};
          try { input = JSON.parse(tc.function.arguments); } catch { input = {}; }
          blocks.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input });
        }
        anthropicMessages.push({ role: 'assistant', content: blocks });
      } else {
        anthropicMessages.push({ role: 'assistant', content: msg.content || '' });
      }
      continue;
    }

    if (msg.role === 'tool') {
      const toolResultBlock: AnthropicContentBlock = {
        type: 'tool_result',
        tool_use_id: msg.tool_call_id || '',
        content: msg.content || '',
      };
      const lastMsg = anthropicMessages[anthropicMessages.length - 1];
      if (
        lastMsg && lastMsg.role === 'user' &&
        Array.isArray(lastMsg.content) &&
        (lastMsg.content as AnthropicContentBlock[])[0]?.type === 'tool_result'
      ) {
        (lastMsg.content as AnthropicContentBlock[]).push(toolResultBlock);
      } else {
        anthropicMessages.push({ role: 'user', content: [toolResultBlock] });
      }
    }
  }

  return { system, anthropicMessages };
}

function convertAnthropicResponse(response: AnthropicResponse): ChatMessage {
  const msg: ChatMessage = { role: 'assistant', content: null };

  const textBlocks = response.content.filter(c => c.type === 'text');
  const toolUseBlocks = response.content.filter(c => c.type === 'tool_use');

  if (textBlocks.length > 0) {
    msg.content = textBlocks.map(c => c.text).join('\n');
  }

  if (toolUseBlocks.length > 0) {
    msg.tool_calls = toolUseBlocks.map(tc => ({
      id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'function' as const,
      function: {
        name: tc.name || '',
        arguments: JSON.stringify(tc.input || {}),
      },
    }));
  }

  return msg;
}

async function claudeCompletion(
  messages: ChatMessage[],
  tools?: ToolDef[],
  traceId?: string,
): Promise<ChatCompletionResult> {
  const { system, anthropicMessages } = convertMessagesToAnthropic(messages);
  const anthropicTools = tools && tools.length > 0 ? convertToolDefsToAnthropic(tools) : undefined;

  const body: Record<string, unknown> = {
    model: CLAUDE_FALLBACK_MODEL,
    max_tokens: 2048,
    temperature: 0.2,
    messages: anthropicMessages,
  };
  if (system) body.system = system;
  if (anthropicTools && anthropicTools.length > 0) body.tools = anthropicTools;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': CLAUDE_API_KEY,
    'anthropic-version': CLAUDE_API_VERSION,
  };
  if (traceId) headers['x-trace-id'] = traceId;

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'unknown error');
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      module: 'aiClient',
      provider: 'claude',
      error: `HTTP ${res.status}`,
      detail: errorText.slice(0, 500),
      trace_id: traceId,
    }));
    return {
      message: { role: 'assistant', content: `[Claude error: ${res.status}]` },
      finishReason: 'error',
    };
  }

  const data = await res.json() as AnthropicResponse;
  if (!data.content || data.content.length === 0) {
    return {
      message: { role: 'assistant', content: '[AI returned no response]' },
      finishReason: 'error',
    };
  }

  const assistantMessage = convertAnthropicResponse(data);
  let finishReason: string;
  switch (data.stop_reason) {
    case 'tool_use': finishReason = 'tool_calls'; break;
    case 'end_turn': finishReason = 'stop'; break;
    case 'max_tokens': finishReason = 'length'; break;
    default: finishReason = data.stop_reason || 'stop';
  }

  return {
    message: assistantMessage,
    finishReason,
    usage: {
      prompt_tokens: data.usage?.input_tokens,
      completion_tokens: data.usage?.output_tokens,
      total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
  };
}

// ── Public API ────────────────────────────────────────────

/**
 * Call AI for a chat completion with optional tool-use.
 *
 * Auto-selects the cheapest provider for tool-routing:
 *   1. OpenAI gpt-4o-mini (preferred — cheapest for transactional work)
 *   2. Claude Haiku (fallback — if no OpenAI key)
 *
 * Returns the assistant's response message + finish reason.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  tools?: ToolDef[],
  traceId?: string
): Promise<ChatCompletionResult> {
  // Prefer OpenAI for transactional tool-routing (cheapest)
  if (OPENAI_API_KEY) {
    return openaiCompletion(messages, tools, traceId);
  }

  // Fallback to Claude Haiku
  if (CLAUDE_API_KEY) {
    return claudeCompletion(messages, tools, traceId);
  }

  return {
    message: {
      role: 'assistant',
      content: '[AI not configured — set AI_API_KEY (OpenAI) or CLAUDE_API_KEY (Anthropic) env var]',
    },
    finishReason: 'error',
  };
}

/**
 * Check if AI is available (any API key configured).
 */
export function isAiConfigured(): boolean {
  return OPENAI_API_KEY.length > 0 || CLAUDE_API_KEY.length > 0;
}

/**
 * Get current AI model name (for logging).
 */
export function getAiModel(): string {
  if (OPENAI_API_KEY) return OPENAI_MODEL;
  if (CLAUDE_API_KEY) return CLAUDE_FALLBACK_MODEL;
  return 'none';
}
