/**
 * Shared LLM helper — Claude-first with OpenAI fallback.
 *
 * Used by all brain-skill tool modules instead of duplicating fetch logic.
 * Claude Haiku by default, falls back to OpenAI gpt-4o-mini.
 *
 * Also provides callLLMWithTools() for agentic tool-use loops.
 */

import { createSubsystemLogger } from 'kitz-schemas';

const callLLMLog = createSubsystemLogger('callLLM');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_VERSION = '2023-06-01';
const OPENAI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface CallLLMOptions {
  model?: string;
  openaiModel?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export async function callLLM(
  systemPrompt: string,
  userInput: string,
  options?: CallLLMOptions,
): Promise<string> {
  const model = options?.model || 'claude-haiku-4-5-20251001';
  const openaiModel = options?.openaiModel || 'gpt-4o-mini';
  const maxTokens = options?.maxTokens || 1024;
  const temperature = options?.temperature || 0.2;
  const timeoutMs = options?.timeoutMs || 15_000;

  if (CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
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
          messages: [{ role: 'user', content: userInput }],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const d = (await res.json()) as {
          content: Array<{ type: string; text?: string }>;
        };
        return d.content?.find((c) => c.type === 'text')?.text || '';
      }
    } catch {
      /* fall through to OpenAI */
    }
  }

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const d = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        return d.choices?.[0]?.message?.content || '';
      }
    } catch {
      /* return error */
    }
  }

  return JSON.stringify({ error: 'No AI available' });
}

// ── Tool-use loop types ──

export interface ToolCallEntry {
  toolName: string;
  toolArgs: Record<string, unknown>;
  result: unknown;
}

export interface ToolLoopResult {
  text: string;
  toolCalls: ToolCallEntry[];
  iterations: number;
}

export interface CallLLMWithToolsOptions extends CallLLMOptions {
  tools: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>;
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  maxIterations?: number;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onToolResult?: (name: string, result: unknown) => void;
}

/**
 * Agentic tool-use loop using Claude's native tool_use API.
 *
 * Sends a request to Claude with tool definitions. When Claude responds with
 * tool_use blocks, executes each tool and feeds results back. Loops until
 * Claude returns end_turn or max iterations reached.
 */
export async function callLLMWithTools(
  systemPrompt: string,
  userInput: string,
  options: CallLLMWithToolsOptions,
): Promise<ToolLoopResult> {
  const model = options.model || 'claude-sonnet-4-20250514';
  const maxTokens = options.maxTokens || 4096;
  const temperature = options.temperature || 0.3;
  const timeoutMs = options.timeoutMs || 120_000;
  const maxIterations = options.maxIterations ?? 10;

  const toolCalls: ToolCallEntry[] = [];

  if (!CLAUDE_API_KEY) {
    callLLMLog.warn('No CLAUDE_API_KEY — tool loop unavailable');
    return { text: JSON.stringify({ error: 'No Claude API key for tool loop' }), toolCalls: [], iterations: 0 };
  }

  // Build message history for the loop
  const messages: Array<Record<string, unknown>> = [
    { role: 'user', content: userInput },
  ];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    callLLMLog.info('tool_loop_iteration', { iteration, messageCount: messages.length });

    const res = await fetch(CLAUDE_API_URL, {
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
        messages,
        tools: options.tools,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      callLLMLog.error('tool_loop_api_error', { status: res.status, detail: errText.slice(0, 300) });
      return { text: `[Claude API error: ${res.status}]`, toolCalls, iterations: iteration + 1 };
    }

    const data = await res.json() as {
      content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
      stop_reason: string;
    };

    // Check if this is a final response (end_turn)
    if (data.stop_reason === 'end_turn' || data.stop_reason === 'max_tokens') {
      const text = data.content
        ?.filter(c => c.type === 'text' && c.text)
        .map(c => c.text)
        .join('\n') || '';
      return { text, toolCalls, iterations: iteration + 1 };
    }

    // Process tool_use blocks
    if (data.stop_reason === 'tool_use') {
      // Append the assistant message with all content blocks (text + tool_use)
      messages.push({ role: 'assistant', content: data.content });

      const toolUseBlocks = data.content.filter(c => c.type === 'tool_use');
      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];

      for (const block of toolUseBlocks) {
        const toolName = block.name!;
        const toolArgs = block.input || {};
        const toolUseId = block.id!;

        options.onToolCall?.(toolName, toolArgs);
        callLLMLog.info('tool_call', { tool: toolName, iteration });

        let result: unknown;
        try {
          result = await options.executeTool(toolName, toolArgs);
        } catch (err) {
          result = { error: `Tool execution failed: ${(err as Error).message}` };
        }

        options.onToolResult?.(toolName, result);
        toolCalls.push({ toolName, toolArgs, result });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        });
      }

      // Append all tool results as a single user message
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unknown stop reason — extract text and return
    const text = data.content
      ?.filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n') || '';
    return { text, toolCalls, iterations: iteration + 1 };
  }

  callLLMLog.warn('tool_loop_max_iterations', { maxIterations });
  return { text: '[Tool loop reached max iterations]', toolCalls, iterations: maxIterations };
}
