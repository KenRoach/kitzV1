import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { recordLLMSpend, recordTTSSpend, recordRecharge, getBatteryStatus, hasBudget, getLedger } from './aiBattery.js';

describe('AI Battery', () => {
  // Note: since the ledger is module-level, tests are additive.
  // We test the behavior, not absolute values.

  it('records LLM spend and updates status', async () => {
    const before = getBatteryStatus();
    const entry = await recordLLMSpend({
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 500,
      completionTokens: 200,
      totalTokens: 700,
      traceId: 'test-trace-1',
      toolContext: 'test_tool',
    });

    assert.ok(entry.id, 'entry has id');
    assert.ok(entry.ts, 'entry has timestamp');
    assert.equal(entry.provider, 'openai');
    assert.equal(entry.category, 'llm_tokens');
    assert.equal(entry.units, 700);
    assert.equal(entry.credits, 0.7); // 700 tokens / 1000 = 0.7 credits

    const after = getBatteryStatus();
    assert.ok(after.todayCredits >= before.todayCredits, 'credits increased');
    assert.ok(after.todayCalls > before.todayCalls, 'call count increased');
  });

  it('records TTS spend', async () => {
    const entry = await recordTTSSpend({
      characterCount: 250,
      voiceId: 'test-voice',
      modelId: 'eleven_multilingual_v2',
      traceId: 'test-trace-2',
    });

    assert.equal(entry.provider, 'elevenlabs');
    assert.equal(entry.category, 'tts_characters');
    assert.equal(entry.units, 250);
    assert.equal(entry.credits, 0.5); // 250 chars / 500 = 0.5 credits
  });

  it('records recharge as negative credits', async () => {
    const entry = await recordRecharge(10, 'test-trace-3');
    assert.equal(entry.credits, -10);
    assert.equal(entry.category, 'recharge');
  });

  it('hasBudget returns true when credits remain', () => {
    const status = getBatteryStatus();
    if (status.remaining > 1) {
      assert.equal(hasBudget(1), true);
    }
  });

  it('getLedger returns all entries', () => {
    const ledger = getLedger();
    assert.ok(Array.isArray(ledger));
    assert.ok(ledger.length >= 3, 'should have at least 3 entries from earlier tests');
  });

  it('battery status has correct shape', () => {
    const status = getBatteryStatus();
    assert.equal(typeof status.todayCredits, 'number');
    assert.equal(typeof status.totalCredits, 'number');
    assert.equal(typeof status.dailyLimit, 'number');
    assert.equal(typeof status.remaining, 'number');
    assert.equal(typeof status.depleted, 'boolean');
    assert.equal(typeof status.byProvider, 'object');
    assert.ok('openai' in status.byProvider);
    assert.ok('claude' in status.byProvider);
    assert.ok('elevenlabs' in status.byProvider);
    assert.equal(typeof status.todayTokens, 'number');
    assert.equal(typeof status.todayTtsChars, 'number');
    assert.equal(typeof status.todayCalls, 'number');
  });

  it('byProvider tracks per-provider spend', () => {
    const status = getBatteryStatus();
    assert.ok(status.byProvider.openai >= 0.7, 'openai spend should include our LLM entry');
    assert.ok(status.byProvider.elevenlabs >= 0.5, 'elevenlabs spend should include our TTS entry');
  });
});
