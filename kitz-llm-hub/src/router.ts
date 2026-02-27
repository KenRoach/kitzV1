/**
 * LLM task router — routes requests to the best provider based on tier and task type.
 * Uses contracts from kitz-schemas.
 */

import type { LLMProvider, LLMTier, LLMTaskType } from 'kitz-schemas';

export interface RouteDecision {
  provider: LLMProvider;
  model: string;
  fallbackProvider: LLMProvider;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
}

const CLAUDE_MODELS: Record<LLMTier, string> = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-5-20251001',
  mini: 'claude-haiku-4-5-20251001',
};

const OPENAI_MODELS: Record<LLMTier, string> = {
  opus: 'gpt-4o',
  sonnet: 'gpt-4o',
  haiku: 'gpt-4o-mini',
  mini: 'gpt-4o-mini',
};

const MAX_TOKENS: Record<LLMTier, number> = {
  opus: 4096,
  sonnet: 2048,
  haiku: 1024,
  mini: 512,
};

const TEMPERATURE: Record<LLMTier, number> = {
  opus: 0.4,
  sonnet: 0.3,
  haiku: 0.2,
  mini: 0.1,
};

/** Infer the best tier for a task type if none specified. */
export function inferTier(taskType?: LLMTaskType): LLMTier {
  switch (taskType) {
    case 'strategy':
    case 'ideation':
      return 'opus';
    case 'drafting':
    case 'coding':
    case 'summarizing':
      return 'sonnet';
    case 'classification':
    case 'extraction':
    case 'search':
      return 'haiku';
    default:
      return 'sonnet';
  }
}

/** Route a request to the best provider/model combination. */
export function routeRequest(opts: {
  tier?: LLMTier;
  taskType?: LLMTaskType;
  provider?: LLMProvider;
}): RouteDecision {
  const tier = opts.tier ?? inferTier(opts.taskType);
  const provider = opts.provider ?? 'claude';

  if (provider === 'openai') {
    return {
      provider: 'openai',
      model: OPENAI_MODELS[tier],
      fallbackProvider: 'claude',
      fallbackModel: CLAUDE_MODELS[tier],
      maxTokens: MAX_TOKENS[tier],
      temperature: TEMPERATURE[tier],
    };
  }

  if (provider === 'gemini') {
    return {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      fallbackProvider: 'claude',
      fallbackModel: CLAUDE_MODELS[tier],
      maxTokens: MAX_TOKENS[tier],
      temperature: TEMPERATURE[tier],
    };
  }

  if (provider === 'perplexity') {
    return {
      provider: 'perplexity',
      model: 'sonar-pro',
      fallbackProvider: 'openai',
      fallbackModel: OPENAI_MODELS[tier],
      maxTokens: MAX_TOKENS[tier],
      temperature: TEMPERATURE[tier],
    };
  }

  if (provider === 'deepseek') {
    return {
      provider: 'deepseek',
      model: 'deepseek-chat',
      fallbackProvider: 'claude',
      fallbackModel: CLAUDE_MODELS[tier],
      maxTokens: MAX_TOKENS[tier],
      temperature: TEMPERATURE[tier],
    };
  }

  // Default: Claude primary, OpenAI fallback
  return {
    provider: 'claude',
    model: CLAUDE_MODELS[tier],
    fallbackProvider: 'openai',
    fallbackModel: OPENAI_MODELS[tier],
    maxTokens: MAX_TOKENS[tier],
    temperature: TEMPERATURE[tier],
  };
}
