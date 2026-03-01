/**
 * kitz-llm-hub — Multi-provider LLM router.
 * Routes: POST /complete, POST /complete/tools, GET /health, GET /models
 */

import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { LLMCompletionRequest, LLMCompletionResponse } from 'kitz-schemas';
import { routeRequest, inferTier } from './router.js';
import { redact } from './redaction.js';
import { callClaude } from './providers/anthropic_claude.js';
import { callOpenAI } from './providers/openai_codex.js';
import { callGemini } from './providers/google_gemini.js';
import { callPerplexity } from './providers/perplexity.js';
import { callDeepSeek } from './providers/deepseek.js';

const app = Fastify({ logger: true });

// ── Auth hook (validates x-service-secret for inter-service calls) ──
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.DEV_TOKEN_SECRET || '';

app.addHook('onRequest', async (req, reply) => {
  const path = req.url.split('?')[0];
  if (path === '/health' || path === '/models') return;

  if (SERVICE_SECRET) {
    const secret = req.headers['x-service-secret'] as string | undefined;
    const devSecret = req.headers['x-dev-secret'] as string | undefined;
    if (secret !== SERVICE_SECRET && devSecret !== process.env.DEV_TOKEN_SECRET) {
      return reply.code(401).send({ error: 'Unauthorized: missing or invalid service secret' });
    }
  }
});

type ProviderFn = (req: LLMCompletionRequest, route: ReturnType<typeof routeRequest>) => Promise<LLMCompletionResponse>;

const PROVIDERS: Record<string, ProviderFn> = {
  claude: callClaude,
  openai: callOpenAI,
  gemini: callGemini,
  perplexity: callPerplexity,
  deepseek: callDeepSeek,
};

async function complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
  const route = routeRequest({
    tier: req.tier,
    taskType: req.taskType,
    provider: req.provider,
  });

  // Redact sensitive data from prompt
  const sanitized = { ...req, prompt: redact(req.prompt) };

  const primaryFn = PROVIDERS[route.provider];
  if (!primaryFn) {
    throw new Error(`Unknown provider: ${route.provider}`);
  }

  try {
    return await primaryFn(sanitized, route);
  } catch (primaryErr) {
    app.log.warn({ err: primaryErr, provider: route.provider, traceId: req.traceId }, 'primary_provider_failed');

    // Fallback
    const fallbackFn = PROVIDERS[route.fallbackProvider];
    if (!fallbackFn) {
      throw primaryErr;
    }

    const fallbackRoute = { ...route, provider: route.fallbackProvider, model: route.fallbackModel };
    try {
      const result = await fallbackFn(sanitized, fallbackRoute as ReturnType<typeof routeRequest>);
      app.log.info({ provider: route.fallbackProvider, traceId: req.traceId }, 'fallback_succeeded');
      return result;
    } catch (fallbackErr) {
      app.log.error({ err: fallbackErr, provider: route.fallbackProvider, traceId: req.traceId }, 'fallback_also_failed');
      throw new Error(
        `Both ${route.provider} and ${route.fallbackProvider} failed. ` +
        `Primary: ${(primaryErr as Error).message}. Fallback: ${(fallbackErr as Error).message}`
      );
    }
  }
}

app.post('/complete', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const body = req.body as Partial<LLMCompletionRequest>;

  const request: LLMCompletionRequest = {
    prompt: String(body.prompt || ''),
    system: body.system,
    tier: body.tier ?? inferTier(body.taskType),
    taskType: body.taskType,
    provider: body.provider,
    tools: body.tools,
    messages: body.messages,
    maxTokens: body.maxTokens,
    temperature: body.temperature,
    traceId,
    orgId: body.orgId ?? String(req.headers['x-org-id'] || ''),
  };

  return complete(request);
});

app.post('/complete/tools', async (req: any) => {
  const traceId = String(req.headers['x-trace-id'] || randomUUID());
  const body = req.body as Partial<LLMCompletionRequest>;

  const request: LLMCompletionRequest = {
    prompt: String(body.prompt || ''),
    system: body.system,
    tier: body.tier ?? 'haiku',
    taskType: body.taskType ?? 'extraction',
    provider: body.provider,
    tools: body.tools,
    messages: body.messages,
    maxTokens: body.maxTokens,
    temperature: body.temperature ?? 0.1,
    traceId,
    orgId: body.orgId ?? String(req.headers['x-org-id'] || ''),
  };

  return complete(request);
});

app.get('/health', async () => ({ status: 'ok', service: 'kitz-llm-hub' }));

app.get('/models', async () => ({
  providers: {
    claude: ['claude-opus-4-6', 'claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
    openai: ['gpt-4o', 'gpt-4o-mini'],
    gemini: ['gemini-2.0-flash'],
    perplexity: ['sonar-pro'],
    deepseek: ['deepseek-chat'],
  },
  tiers: ['opus', 'sonnet', 'haiku', 'mini'],
  defaultProvider: 'claude',
}));

app.listen({ port: Number(process.env.PORT || 4010), host: '0.0.0.0' });
