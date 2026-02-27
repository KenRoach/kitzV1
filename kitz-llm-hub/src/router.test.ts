import { describe, it, expect } from 'vitest';
import { routeRequest, inferTier } from './router.js';

describe('inferTier', () => {
  it('returns opus for strategy tasks', () => {
    expect(inferTier('strategy')).toBe('opus');
  });

  it('returns opus for ideation tasks', () => {
    expect(inferTier('ideation')).toBe('opus');
  });

  it('returns sonnet for drafting tasks', () => {
    expect(inferTier('drafting')).toBe('sonnet');
  });

  it('returns sonnet for coding tasks', () => {
    expect(inferTier('coding')).toBe('sonnet');
  });

  it('returns haiku for classification tasks', () => {
    expect(inferTier('classification')).toBe('haiku');
  });

  it('returns haiku for extraction tasks', () => {
    expect(inferTier('extraction')).toBe('haiku');
  });

  it('returns sonnet as default when no task type', () => {
    expect(inferTier(undefined)).toBe('sonnet');
  });
});

describe('routeRequest', () => {
  it('defaults to claude provider', () => {
    const route = routeRequest({});
    expect(route.provider).toBe('claude');
    expect(route.fallbackProvider).toBe('openai');
  });

  it('routes to specified provider', () => {
    const route = routeRequest({ provider: 'openai' });
    expect(route.provider).toBe('openai');
    expect(route.fallbackProvider).toBe('claude');
  });

  it('uses specified tier', () => {
    const route = routeRequest({ tier: 'opus' });
    expect(route.model).toContain('opus');
    expect(route.maxTokens).toBe(4096);
  });

  it('infers tier from task type when no tier specified', () => {
    const route = routeRequest({ taskType: 'classification' });
    expect(route.maxTokens).toBe(1024); // haiku tier
  });

  it('routes gemini to gemini-2.0-flash', () => {
    const route = routeRequest({ provider: 'gemini' });
    expect(route.provider).toBe('gemini');
    expect(route.model).toBe('gemini-2.0-flash');
    expect(route.fallbackProvider).toBe('claude');
  });

  it('routes perplexity to sonar-pro', () => {
    const route = routeRequest({ provider: 'perplexity' });
    expect(route.provider).toBe('perplexity');
    expect(route.model).toBe('sonar-pro');
  });

  it('routes deepseek to deepseek-chat', () => {
    const route = routeRequest({ provider: 'deepseek' });
    expect(route.provider).toBe('deepseek');
    expect(route.model).toBe('deepseek-chat');
  });

  it('sets correct temperature for each tier', () => {
    expect(routeRequest({ tier: 'opus' }).temperature).toBe(0.4);
    expect(routeRequest({ tier: 'sonnet' }).temperature).toBe(0.3);
    expect(routeRequest({ tier: 'haiku' }).temperature).toBe(0.2);
    expect(routeRequest({ tier: 'mini' }).temperature).toBe(0.1);
  });

  it('sets correct maxTokens for each tier', () => {
    expect(routeRequest({ tier: 'opus' }).maxTokens).toBe(4096);
    expect(routeRequest({ tier: 'sonnet' }).maxTokens).toBe(2048);
    expect(routeRequest({ tier: 'haiku' }).maxTokens).toBe(1024);
    expect(routeRequest({ tier: 'mini' }).maxTokens).toBe(512);
  });
});
