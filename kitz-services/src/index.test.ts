import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { complianceUpdateSchema } from './compliance-agent/schema.js';
import { normalizeFindings } from './compliance-agent/normalizer.js';
import { createApp, health } from './index.js';

describe('health', () => {
  it('ok', () => expect(health.status).toBe('ok'));
});

describe('compliance schema', () => {
  it('validates minimum shape', () => {
    const parsed = complianceUpdateSchema.parse({
      country: 'Panama',
      regulatory_body: 'DGI',
      update_type: 'none',
      summary_simple: 'No major regulatory change was detected in this run.',
      operational_impact: 'No immediate workflow change required for workspace.kitz.services or Kitz operations.',
      required_action: ['Continue regular monitoring and keep records of each run.'],
      deadline: null,
      risk_level: 'Low',
      sources: [{ title: 'DGI Official Portal', url: 'https://dgi.mef.gob.pa/', published_at: null }],
      detected_at: new Date().toISOString()
    });

    expect(parsed.country).toBe('Panama');
  });
});

describe('normalizer', () => {
  it('emits none update when no keywords', () => {
    const out = normalizeFindings([
      { regulatory_body: 'DGI', update_type: 'tax', title: 'Portal', url: 'https://dgi.mef.gob.pa/', date: null, text: 'Static homepage text' }
    ]);
    expect(out[0].update_type).toBe('none');
    expect(out[0].sources.length).toBeGreaterThan(1);
  });
});

describe('api smoke', () => {
  const app = createApp();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns compliance latest payload', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/compliance/latest?country=Panama' });
    expect(response.statusCode).toBe(200);
  });
});
