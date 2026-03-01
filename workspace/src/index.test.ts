import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from './index.js';

describe('health', () => {
  beforeAll(async () => { await app.ready(); });
  afterAll(async () => { await app.close(); });

  it('returns status ok with checks', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toMatch(/ok|degraded/);
    expect(body.checks).toBeDefined();
    expect(body.checks.workspace).toBe('ok');
  });
});

describe('ops metrics', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns minimum metrics shape', async () => {
    await app.inject({ method: 'GET', url: '/leads' });
    await app.inject({ method: 'GET', url: '/ai-direction' });
    await app.inject({ method: 'POST', url: '/api/feedback/tag', payload: { tag: 'confusion-checkout' } });
    const response = await app.inject({ method: 'GET', url: '/api/ops/metrics' });
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body).toHaveProperty('p95LatencyByRoute');
    expect(body).toHaveProperty('errorRateByRoute');
    expect(body).toHaveProperty('authFailures');
    expect(body).toHaveProperty('conversion');
    expect(body).toHaveProperty('featureUsageTop10');
    expect(body).toHaveProperty('topFeedbackTags');
    expect(body.manualModeAlwaysAvailable).toBe(true);
    expect(body.aiModeGatedByCredits).toBe(true);
  });

  it('wires funnel interactions endpoints', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/funnel/signup' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/funnel/first-action' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/funnel/confusing-step' })).statusCode).toBe(200);
  });
});
