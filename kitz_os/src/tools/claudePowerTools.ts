/**
 * Claude Power Tools — Web Search, Code Execution, Extended Thinking,
 * Batch Processing, Token Counting, Vision, PDF Reading, Summarization.
 *
 * Exposes Claude's advanced API capabilities as KITZ tools.
 * Uses fetch() directly — no Anthropic SDK needed.
 */

import { createSubsystemLogger } from 'kitz-schemas';
import type { ToolSchema } from './registry.js';

const log = createSubsystemLogger('claudePowerTools');

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const API_URL = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';

/** Model shorthand → full model ID */
const MODEL_MAP: Record<string, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-6',
};

/** Pricing per 1M input tokens (USD) */
const INPUT_COST_PER_M: Record<string, number> = {
  'claude-haiku-4-5-20251001': 1,
  'claude-sonnet-4-20250514': 3,
  'claude-opus-4-6': 5,
};

function getApiKey(): string {
  return process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
}

function resolveModel(input?: unknown): string {
  const raw = String(input || 'haiku').trim().toLowerCase();
  return MODEL_MAP[raw] || raw;
}

function missingKeyResponse() {
  return {
    error: 'Set ANTHROPIC_API_KEY to use Claude tools',
    fix: 'Add CLAUDE_API_KEY or ANTHROPIC_API_KEY to your environment variables. ' +
      'Get a key from https://console.anthropic.com/settings/keys',
  };
}

/** Build standard Anthropic headers. betaFlags is comma-separated. */
function buildHeaders(apiKey: string, betaFlags?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': API_VERSION,
  };
  if (betaFlags) {
    headers['anthropic-beta'] = betaFlags;
  }
  return headers;
}

/** Parse Anthropic error response for a human-readable message. */
function parseAnthropicError(label: string, status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; type?: string } };
    const err = parsed.error;
    if (err?.message) {
      return `${label} error (${status}): ${err.message}`;
    }
  } catch {
    // not JSON
  }
  switch (status) {
    case 401:
      return `${label} auth failed (401): Your ANTHROPIC_API_KEY is invalid or expired.`;
    case 403:
      return `${label} forbidden (403): Your API key does not have permission for this endpoint.`;
    case 429:
      return `${label} rate limited (429): Exceeded Anthropic usage quota or rate limit.`;
    case 500:
    case 502:
    case 503:
      return `${label} server error (${status}): Anthropic API is temporarily unavailable. Try again shortly.`;
    case 529:
      return `${label} overloaded (529): Anthropic API is overloaded. Try again in a few seconds.`;
    default:
      return `${label} API error (${status}): ${body.slice(0, 300)}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */

export function getAllClaudePowerTools(): ToolSchema[] {
  return [
    /* ============================================================== */
    /*  1. claude_web_search — Claude-native web search                */
    /* ============================================================== */
    {
      name: 'claude_web_search',
      description:
        'Search the web using Claude\'s built-in web search tool. Claude searches, reads sources, and returns a summary with citations. ' +
        'Use for: researching LatAm market trends, checking competitor pricing, finding Panama/Colombia/Mexico regulations, ' +
        'looking up product suppliers, verifying business registration requirements, finding industry benchmarks, ' +
        'checking current exchange rates, getting latest news affecting your market.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query (e.g. "Panama LLC registration requirements 2026", "best payment gateways LatAm")',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of search results to consider (default 5, max 10)',
          },
        },
        required: ['query'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const query = String(args.query || '').trim();
        if (!query) return { error: 'query is required. Provide a search query.' };

        const maxResults = Math.min(Math.max(Number(args.maxResults) || 5, 1), 10);

        log.info('web_search_request', { query: query.slice(0, 80), maxResults, trace_id: _traceId });

        try {
          const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: buildHeaders(apiKey),
            body: JSON.stringify({
              model: MODEL_MAP.haiku,
              max_tokens: 2048,
              tools: [
                {
                  type: 'web_search_20250311',
                  name: 'web_search',
                  max_uses: maxResults,
                },
              ],
              messages: [
                {
                  role: 'user',
                  content: `Search the web for: "${query}"\n\nProvide a clear, concise summary of the top findings. Include the title and URL of each source you reference.`,
                },
              ],
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('WebSearch', res.status, errText) };
          }

          const data = (await res.json()) as {
            content: Array<{ type: string; text?: string; source?: { title?: string; url?: string } }>;
            model: string;
          };

          // Extract text blocks as the summary
          const textBlocks = data.content.filter(b => b.type === 'text');
          const summary = textBlocks.map(b => b.text || '').join('\n\n').trim();

          // Extract cited sources from server_tool_use results if present
          const sources: Array<{ title: string; url: string }> = [];
          for (const block of data.content) {
            if (block.type === 'web_search_tool_result' || block.source) {
              if (block.source?.url) {
                sources.push({ title: block.source.title || '', url: block.source.url });
              }
            }
            // Also check nested content in tool results
            const nested = (block as Record<string, unknown>).content;
            if (Array.isArray(nested)) {
              for (const item of nested as Array<{ type?: string; title?: string; url?: string }>) {
                if (item.url) {
                  sources.push({ title: item.title || '', url: item.url });
                }
              }
            }
          }

          log.info('web_search_success', { sourceCount: sources.length, model: data.model, trace_id: _traceId });

          return { summary, sources, model: data.model };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Web search timed out (30s). Try a more specific query.' };
          }
          return { error: `Web search failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  2. claude_code_execute — Sandboxed code execution              */
    /* ============================================================== */
    {
      name: 'claude_code_execute',
      description:
        'Execute code in a sandboxed environment via Claude. Claude writes and runs Python or JavaScript code to solve computational tasks. ' +
        'Use for: calculating profit margins, analyzing sales CSV data, computing tax breakdowns for LatAm countries, ' +
        'generating financial projections, processing inventory data, running statistical analysis on customer feedback, ' +
        'converting currencies, building pricing models, validating spreadsheet formulas.',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: 'What to calculate or analyze (e.g. "Calculate monthly profit margin from these sales: ...")',
          },
          data: {
            type: 'string',
            description: 'Optional data to process (CSV, JSON, or plain text). Will be included in the prompt for Claude to work with.',
          },
        },
        required: ['task'],
      },
      riskLevel: 'medium',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const task = String(args.task || '').trim();
        if (!task) return { error: 'task is required. Describe what to calculate or analyze.' };

        const data = args.data ? String(args.data).trim() : '';

        log.info('code_execute_request', { task: task.slice(0, 80), hasData: !!data, trace_id: _traceId });

        const userMessage = data
          ? `Task: ${task}\n\nData to process:\n${data}\n\nWrite and execute code to complete this task. Show your work.`
          : `Task: ${task}\n\nWrite and execute code to complete this task. Show your work.`;

        try {
          const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: buildHeaders(apiKey, 'code-execution-2025-05-22'),
            body: JSON.stringify({
              model: MODEL_MAP.sonnet,
              max_tokens: 4096,
              tools: [
                {
                  type: 'code_execution_20250522',
                  name: 'code_execution',
                },
              ],
              messages: [
                { role: 'user', content: userMessage },
              ],
            }),
            signal: AbortSignal.timeout(120_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('CodeExec', res.status, errText) };
          }

          const resData = (await res.json()) as {
            content: Array<{
              type: string;
              text?: string;
              name?: string;
              input?: { code?: string };
              content?: Array<{ type: string; text?: string; output?: string }>;
            }>;
            model: string;
          };

          // Extract text result, executed code, and stdout
          let result = '';
          let code = '';
          let stdout = '';

          for (const block of resData.content) {
            if (block.type === 'text' && block.text) {
              result += (result ? '\n\n' : '') + block.text;
            }
            if (block.type === 'tool_use' && block.input?.code) {
              code = block.input.code;
            }
            if (block.type === 'code_execution_tool_result' && Array.isArray(block.content)) {
              for (const item of block.content) {
                if (item.output) stdout += item.output;
                if (item.text) stdout += item.text;
              }
            }
            // Also check server tool results
            if (block.type === 'server_tool_result' && Array.isArray(block.content)) {
              for (const item of block.content as Array<{ type?: string; text?: string; output?: string }>) {
                if (item.output) stdout += item.output;
                if (item.text) stdout += item.text;
              }
            }
          }

          log.info('code_execute_success', { model: resData.model, hasCode: !!code, trace_id: _traceId });

          return { result: result || stdout || 'Code executed (no text output)', code, stdout, model: resData.model };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Code execution timed out (120s). Try a simpler task.' };
          }
          return { error: `Code execution failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  3. claude_extended_think — Deep strategic thinking              */
    /* ============================================================== */
    {
      name: 'claude_extended_think',
      description:
        'Deep strategic thinking with Claude\'s extended thinking (chain-of-thought reasoning). ' +
        'Uses extra compute for complex business decisions where getting the right answer matters. ' +
        'Use for: deciding whether to expand to a new LatAm market, evaluating partnership offers, ' +
        'designing pricing strategy with multiple tiers, planning acquisition funnels, ' +
        'complex financial modeling decisions, legal/compliance risk assessment, ' +
        'go-to-market strategy for new products, competitive positioning analysis.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The complex question or decision to reason through deeply',
          },
          context: {
            type: 'string',
            description: 'Optional additional context (business data, constraints, goals)',
          },
          budgetTokens: {
            type: 'number',
            description: 'Thinking budget in tokens (default 10000, min 1024, max 32000). Higher = deeper reasoning but slower/more expensive.',
          },
        },
        required: ['question'],
      },
      riskLevel: 'medium',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const question = String(args.question || '').trim();
        if (!question) return { error: 'question is required. Describe the decision or problem to reason through.' };

        const context = args.context ? String(args.context).trim() : '';
        const budgetTokens = Math.max(1024, Math.min(Number(args.budgetTokens) || 10000, 32000));

        log.info('extended_think_request', { question: question.slice(0, 80), budgetTokens, trace_id: _traceId });

        const userContent = context
          ? `${question}\n\nContext:\n${context}`
          : question;

        try {
          const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: buildHeaders(apiKey, 'interleaved-thinking-2025-05-14'),
            body: JSON.stringify({
              model: MODEL_MAP.sonnet,
              max_tokens: 16000,
              thinking: {
                type: 'enabled',
                budget_tokens: budgetTokens,
              },
              messages: [
                {
                  role: 'user',
                  content: userContent,
                },
              ],
            }),
            signal: AbortSignal.timeout(120_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('ExtendedThink', res.status, errText) };
          }

          const data = (await res.json()) as {
            content: Array<{ type: string; text?: string; thinking?: string }>;
            model: string;
            usage?: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number };
          };

          // Separate thinking blocks from text blocks
          let answer = '';
          let thinkingSummary = '';
          let thinkingTokens = 0;

          for (const block of data.content) {
            if (block.type === 'thinking' && block.thinking) {
              thinkingSummary += (thinkingSummary ? '\n\n' : '') + block.thinking;
              // Rough estimate: 1 token ~= 4 chars
              thinkingTokens += Math.ceil(block.thinking.length / 4);
            }
            if (block.type === 'text' && block.text) {
              answer += (answer ? '\n\n' : '') + block.text;
            }
          }

          log.info('extended_think_success', {
            model: data.model,
            thinkingTokens,
            answerLength: answer.length,
            trace_id: _traceId,
          });

          return {
            answer,
            thinkingSummary: thinkingSummary
              ? thinkingSummary.slice(0, 2000) + (thinkingSummary.length > 2000 ? '... (truncated)' : '')
              : '(no thinking output captured)',
            thinkingTokens,
            model: data.model,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Extended thinking timed out (120s). Try a lower budgetTokens value or simpler question.' };
          }
          return { error: `Extended thinking failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  4. claude_batch_submit — Submit batch at 50% cost              */
    /* ============================================================== */
    {
      name: 'claude_batch_submit',
      description:
        'Submit a batch of prompts to Claude at 50% cost. Results available within 24 hours. ' +
        'Use for: generating product descriptions for entire catalog, bulk content creation, ' +
        'translating all marketing materials to Spanish/Portuguese, analyzing monthly reports, ' +
        'mass email personalization, generating social media posts for the week, ' +
        'processing customer feedback surveys, creating FAQ answers from support tickets.',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            description: 'Array of tasks to process. Each: { id: string, systemPrompt?: string, userMessage: string, model?: "haiku"|"sonnet"|"opus" }',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique identifier for this task (e.g. "product-desc-001")' },
                systemPrompt: { type: 'string', description: 'Optional system prompt for this task' },
                userMessage: { type: 'string', description: 'The user message / prompt for this task' },
                model: { type: 'string', description: 'Model tier: "haiku" (cheapest), "sonnet", or "opus". Default: haiku' },
              },
              required: ['id', 'userMessage'],
            },
          },
        },
        required: ['tasks'],
      },
      riskLevel: 'medium',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const tasks = args.tasks as Array<{ id: string; systemPrompt?: string; userMessage: string; model?: string }> | undefined;
        if (!Array.isArray(tasks) || tasks.length === 0) {
          return { error: 'tasks array is required with at least one task.' };
        }
        if (tasks.length > 10000) {
          return { error: 'Too many tasks (max 10,000 per batch).' };
        }

        log.info('batch_submit_request', { taskCount: tasks.length, trace_id: _traceId });

        // Build the requests array
        const requests = tasks.map((task) => ({
          custom_id: task.id,
          params: {
            model: resolveModel(task.model),
            max_tokens: 1024,
            messages: [{ role: 'user' as const, content: task.userMessage }],
            ...(task.systemPrompt ? { system: task.systemPrompt } : {}),
          },
        }));

        try {
          const res = await fetch(`${API_URL}/messages/batches`, {
            method: 'POST',
            headers: buildHeaders(apiKey),
            body: JSON.stringify({ requests }),
            signal: AbortSignal.timeout(120_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('BatchSubmit', res.status, errText) };
          }

          const data = (await res.json()) as {
            id: string;
            processing_status: string;
            request_counts: { processing: number; succeeded: number; errored: number; canceled: number; expired: number };
            created_at: string;
          };

          log.info('batch_submit_success', { batchId: data.id, status: data.processing_status, trace_id: _traceId });

          return {
            batchId: data.id,
            status: data.processing_status,
            taskCount: tasks.length,
            createdAt: data.created_at,
            note: 'Batch submitted. Results typically available within 24 hours. Use claude_batch_status to check progress.',
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Batch submission timed out (120s). Try fewer tasks or check your connection.' };
          }
          return { error: `Batch submission failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  5. claude_batch_status — Check batch job status                 */
    /* ============================================================== */
    {
      name: 'claude_batch_status',
      description:
        'Check the status of a submitted Claude batch job. ' +
        'Use after claude_batch_submit to see if your bulk tasks are done. ' +
        'Returns progress counts: how many succeeded, failed, or are still processing.',
      parameters: {
        type: 'object',
        properties: {
          batchId: {
            type: 'string',
            description: 'The batch ID returned from claude_batch_submit',
          },
        },
        required: ['batchId'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const batchId = String(args.batchId || '').trim();
        if (!batchId) return { error: 'batchId is required.' };

        log.info('batch_status_request', { batchId, trace_id: _traceId });

        try {
          const res = await fetch(`${API_URL}/messages/batches/${batchId}`, {
            method: 'GET',
            headers: buildHeaders(apiKey),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('BatchStatus', res.status, errText) };
          }

          const data = (await res.json()) as {
            id: string;
            processing_status: string;
            request_counts: { processing: number; succeeded: number; errored: number; canceled: number; expired: number };
            created_at: string;
            ended_at?: string;
            results_url?: string;
          };

          const counts = data.request_counts;
          const total = counts.processing + counts.succeeded + counts.errored + counts.canceled + counts.expired;

          log.info('batch_status_success', { batchId, status: data.processing_status, trace_id: _traceId });

          return {
            batchId: data.id,
            status: data.processing_status,
            createdAt: data.created_at,
            completedAt: data.ended_at || null,
            requestCounts: {
              succeeded: counts.succeeded,
              failed: counts.errored,
              processing: counts.processing,
              canceled: counts.canceled,
              expired: counts.expired,
              total,
            },
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Batch status check timed out (30s).' };
          }
          return { error: `Batch status check failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  6. claude_batch_results — Get batch results                    */
    /* ============================================================== */
    {
      name: 'claude_batch_results',
      description:
        'Retrieve results from a completed Claude batch job. ' +
        'Returns each task\'s output text, keyed by the custom ID you provided. ' +
        'Use after claude_batch_status shows the batch is complete.',
      parameters: {
        type: 'object',
        properties: {
          batchId: {
            type: 'string',
            description: 'The batch ID to retrieve results for',
          },
        },
        required: ['batchId'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const batchId = String(args.batchId || '').trim();
        if (!batchId) return { error: 'batchId is required.' };

        log.info('batch_results_request', { batchId, trace_id: _traceId });

        try {
          const res = await fetch(`${API_URL}/messages/batches/${batchId}/results`, {
            method: 'GET',
            headers: buildHeaders(apiKey),
            signal: AbortSignal.timeout(60_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('BatchResults', res.status, errText) };
          }

          // Response is JSONL (one JSON object per line)
          const text = await res.text();
          const lines = text.split('\n').filter(l => l.trim());

          const results: Array<{ customId: string; status: string; text: string }> = [];

          for (const line of lines) {
            try {
              const entry = JSON.parse(line) as {
                custom_id: string;
                result: {
                  type: string;
                  message?: {
                    content: Array<{ type: string; text?: string }>;
                  };
                  error?: { message: string };
                };
              };

              if (entry.result?.type === 'succeeded' && entry.result.message) {
                const textContent = entry.result.message.content
                  .filter(b => b.type === 'text')
                  .map(b => b.text || '')
                  .join('\n');
                results.push({ customId: entry.custom_id, status: 'succeeded', text: textContent });
              } else if (entry.result?.type === 'errored') {
                results.push({
                  customId: entry.custom_id,
                  status: 'errored',
                  text: entry.result.error?.message || 'Unknown error',
                });
              } else {
                results.push({ customId: entry.custom_id, status: entry.result?.type || 'unknown', text: '' });
              }
            } catch {
              // Skip unparseable lines
            }
          }

          log.info('batch_results_success', { batchId, resultCount: results.length, trace_id: _traceId });

          return { results };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Batch results retrieval timed out (60s). The result set may be very large.' };
          }
          return { error: `Batch results retrieval failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  7. claude_token_count — Count tokens (cost prediction)         */
    /* ============================================================== */
    {
      name: 'claude_token_count',
      description:
        'Count tokens before sending a request to predict exact AI Battery cost. ' +
        'Helps manage credits wisely. Returns input token count and estimated USD cost. ' +
        'Use for: estimating cost before running expensive prompts, budgeting AI Battery credits, ' +
        'comparing cost across model tiers, validating prompt length before batch submission.',
      parameters: {
        type: 'object',
        properties: {
          systemPrompt: {
            type: 'string',
            description: 'The system prompt to count tokens for',
          },
          userMessage: {
            type: 'string',
            description: 'The user message to count tokens for',
          },
          model: {
            type: 'string',
            description: 'Model tier: "haiku" (default, cheapest), "sonnet", or "opus"',
          },
        },
        required: ['systemPrompt', 'userMessage'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const systemPrompt = String(args.systemPrompt || '').trim();
        const userMessage = String(args.userMessage || '').trim();
        if (!userMessage) return { error: 'userMessage is required.' };

        const model = resolveModel(args.model);

        log.info('token_count_request', { model, sysLen: systemPrompt.length, msgLen: userMessage.length, trace_id: _traceId });

        try {
          const res = await fetch(`${API_URL}/messages/count_tokens`, {
            method: 'POST',
            headers: buildHeaders(apiKey),
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: userMessage }],
              ...(systemPrompt ? { system: systemPrompt } : {}),
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('TokenCount', res.status, errText) };
          }

          const data = (await res.json()) as { input_tokens: number };
          const inputTokens = data.input_tokens;
          const costPerM = INPUT_COST_PER_M[model] || 3;
          const estimatedCost = Number(((inputTokens / 1_000_000) * costPerM).toFixed(6));

          log.info('token_count_success', { inputTokens, model, estimatedCost, trace_id: _traceId });

          return {
            inputTokens,
            model,
            estimatedCost,
            costNote: `$${costPerM}/M input tokens for ${model}. Actual cost will also include output tokens.`,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Token counting timed out (30s).' };
          }
          return { error: `Token counting failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  8. claude_vision_analyze — Analyze images with Claude Vision   */
    /* ============================================================== */
    {
      name: 'claude_vision_analyze',
      description:
        'Analyze images using Claude\'s vision capabilities. Understands photos, screenshots, diagrams, receipts, product images. ' +
        'Use for: reading product labels for e-commerce listings, extracting text from receipts for bookkeeping, ' +
        'analyzing competitor social media visuals, describing product photos for SEO descriptions, ' +
        'reviewing storefront images, reading handwritten notes, analyzing charts and graphs, ' +
        'translating text in images (Spanish/Portuguese/English).',
      parameters: {
        type: 'object',
        properties: {
          imageUrl: {
            type: 'string',
            description: 'Public URL of the image to analyze (JPEG, PNG, GIF, WebP)',
          },
          question: {
            type: 'string',
            description: 'What to analyze or ask about the image (e.g. "Extract all text from this receipt", "Describe this product")',
          },
          model: {
            type: 'string',
            description: 'Model tier: "haiku" (default, cheapest), "sonnet", or "opus"',
          },
        },
        required: ['imageUrl', 'question'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const imageUrl = String(args.imageUrl || '').trim();
        if (!imageUrl) return { error: 'imageUrl is required. Provide a public URL to an image.' };

        const question = String(args.question || '').trim();
        if (!question) return { error: 'question is required. Describe what you want to know about the image.' };

        const model = resolveModel(args.model);

        log.info('vision_request', { imageUrl: imageUrl.slice(0, 80), question: question.slice(0, 60), model, trace_id: _traceId });

        // Determine media type from URL
        const ext = imageUrl.split('?')[0].split('.').pop()?.toLowerCase() || '';
        const mediaTypeMap: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
        };
        const mediaType = mediaTypeMap[ext] || 'image/jpeg';

        try {
          const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: buildHeaders(apiKey),
            body: JSON.stringify({
              model,
              max_tokens: 1024,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image',
                      source: {
                        type: 'url',
                        url: imageUrl,
                      },
                    },
                    {
                      type: 'text',
                      text: question,
                    },
                  ],
                },
              ],
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('Vision', res.status, errText) };
          }

          const data = (await res.json()) as {
            content: Array<{ type: string; text?: string }>;
            model: string;
          };

          const analysis = data.content
            .filter(b => b.type === 'text')
            .map(b => b.text || '')
            .join('\n\n')
            .trim();

          if (!analysis) {
            return { error: 'No analysis content in Claude Vision response.' };
          }

          log.info('vision_success', { model: data.model, trace_id: _traceId });

          return { analysis, model: data.model };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Vision analysis timed out (30s). The image may be too large or the URL too slow.' };
          }
          return { error: `Vision analysis failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  9. claude_pdf_read — Read and analyze PDF documents            */
    /* ============================================================== */
    {
      name: 'claude_pdf_read',
      description:
        'Read and analyze PDF documents using Claude with citations. Extracts text, answers questions, and cites specific pages. ' +
        'Use for: analyzing contracts and legal documents, reading supplier invoices, ' +
        'extracting data from government forms (Panama DGI, Mexico SAT), ' +
        'reviewing business plans, parsing financial statements, ' +
        'reading compliance documents, analyzing shipping manifests.',
      parameters: {
        type: 'object',
        properties: {
          pdfUrl: {
            type: 'string',
            description: 'Public URL to a PDF document',
          },
          pdfBase64: {
            type: 'string',
            description: 'Base64-encoded PDF content (use instead of pdfUrl for uploaded files)',
          },
          question: {
            type: 'string',
            description: 'What to extract or analyze from the PDF (e.g. "What are the payment terms?", "Summarize the key findings")',
          },
        },
        required: ['question'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const pdfUrl = args.pdfUrl ? String(args.pdfUrl).trim() : '';
        const pdfBase64 = args.pdfBase64 ? String(args.pdfBase64).trim() : '';
        const question = String(args.question || '').trim();

        if (!pdfUrl && !pdfBase64) return { error: 'Either pdfUrl or pdfBase64 is required.' };
        if (!question) return { error: 'question is required. Describe what to extract or analyze.' };

        log.info('pdf_read_request', { hasPdfUrl: !!pdfUrl, hasPdfBase64: !!pdfBase64, question: question.slice(0, 60), trace_id: _traceId });

        // Build document source block
        const documentSource = pdfUrl
          ? { type: 'url' as const, url: pdfUrl }
          : { type: 'base64' as const, media_type: 'application/pdf' as const, data: pdfBase64 };

        try {
          const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: buildHeaders(apiKey, 'pdfs-2025-06-09'),
            body: JSON.stringify({
              model: MODEL_MAP.sonnet,
              max_tokens: 4096,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'document',
                      source: documentSource,
                    },
                    {
                      type: 'text',
                      text: question,
                    },
                  ],
                },
              ],
            }),
            signal: AbortSignal.timeout(60_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('PDFRead', res.status, errText) };
          }

          const data = (await res.json()) as {
            content: Array<{
              type: string;
              text?: string;
              citations?: Array<{ cited_text?: string; page_number?: number; document_index?: number }>;
            }>;
            model: string;
          };

          let analysis = '';
          const citations: Array<{ text: string; pageNumber: number | null }> = [];

          for (const block of data.content) {
            if (block.type === 'text' && block.text) {
              analysis += (analysis ? '\n\n' : '') + block.text;
            }
            // Collect inline citations
            if (block.citations) {
              for (const cite of block.citations) {
                if (cite.cited_text) {
                  citations.push({
                    text: cite.cited_text,
                    pageNumber: cite.page_number ?? null,
                  });
                }
              }
            }
          }

          if (!analysis) {
            return { error: 'No analysis content in Claude PDF response.' };
          }

          log.info('pdf_read_success', { model: data.model, citationCount: citations.length, trace_id: _traceId });

          return { analysis, citations, model: data.model };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'PDF reading timed out (60s). The PDF may be too large.' };
          }
          return { error: `PDF reading failed: ${(err as Error).message}` };
        }
      },
    },

    /* ============================================================== */
    /*  10. claude_summarize — Intelligent text summarization           */
    /* ============================================================== */
    {
      name: 'claude_summarize',
      description:
        'Summarize long text intelligently using Claude Haiku (cost-efficient). ' +
        'Supports brief, detailed, or bullet-point styles. Auto-detects language. ' +
        'Use for: summarizing meeting transcripts, condensing long customer emails, ' +
        'creating executive summaries of reports, summarizing competitor research, ' +
        'distilling market analysis into actionable points, summarizing legal documents, ' +
        'creating newsletter digests from multiple articles.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The long text to summarize',
          },
          style: {
            type: 'string',
            enum: ['brief', 'detailed', 'bullets'],
            description: 'Summary style: "brief" (2-3 sentences), "detailed" (paragraph with key points), "bullets" (bullet point list). Default: brief',
          },
          language: {
            type: 'string',
            description: 'Output language (e.g. "es" for Spanish, "pt" for Portuguese, "en" for English). Default: "auto" (match input language)',
          },
        },
        required: ['text'],
      },
      riskLevel: 'low',
      execute: async (args, _traceId) => {
        const apiKey = getApiKey();
        if (!apiKey) return missingKeyResponse();

        const text = String(args.text || '').trim();
        if (!text) return { error: 'text is required. Provide the text to summarize.' };

        const style = (args.style as string) || 'brief';
        const language = (args.language as string) || 'auto';

        log.info('summarize_request', { style, language, textLength: text.length, trace_id: _traceId });

        const styleInstructions: Record<string, string> = {
          brief: 'Provide a brief summary in 2-3 sentences. Focus on the most important points.',
          detailed: 'Provide a detailed summary in one or two paragraphs. Cover all key points, findings, and conclusions.',
          bullets: 'Provide a summary as a bullet point list. Each bullet should capture one key point. Use 5-10 bullets.',
        };

        const langInstruction = language === 'auto'
          ? 'Respond in the same language as the input text.'
          : `Respond in ${language}.`;

        const systemPrompt = `You are a precise summarizer. ${styleInstructions[style] || styleInstructions.brief} ${langInstruction} Do not add commentary or opinions — only summarize what is in the text.`;

        // Count words in original
        const originalWordCount = text.split(/\s+/).filter(Boolean).length;

        try {
          const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: buildHeaders(apiKey),
            body: JSON.stringify({
              model: MODEL_MAP.haiku,
              max_tokens: 1024,
              system: systemPrompt,
              messages: [
                { role: 'user', content: `Summarize the following text:\n\n${text}` },
              ],
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            return { error: parseAnthropicError('Summarize', res.status, errText) };
          }

          const data = (await res.json()) as {
            content: Array<{ type: string; text?: string }>;
            model: string;
          };

          const summary = data.content
            .filter(b => b.type === 'text')
            .map(b => b.text || '')
            .join('\n\n')
            .trim();

          if (!summary) {
            return { error: 'No summary generated.' };
          }

          const wordCount = summary.split(/\s+/).filter(Boolean).length;
          const compressionRatio = originalWordCount > 0
            ? Number((originalWordCount / wordCount).toFixed(1))
            : 0;

          log.info('summarize_success', { wordCount, originalWordCount, compressionRatio, model: data.model, trace_id: _traceId });

          return {
            summary,
            wordCount,
            originalWordCount,
            compressionRatio,
          };
        } catch (err) {
          if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
            return { error: 'Summarization timed out (30s). Try shorter text.' };
          }
          return { error: `Summarization failed: ${(err as Error).message}` };
        }
      },
    },
  ];
}
