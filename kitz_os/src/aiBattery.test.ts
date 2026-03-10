import { describe, it, expect } from 'vitest';
import { recordLLMSpend, recordTTSSpend, recordRecharge, getBatteryStatus, hasBudget, getLedger, getSpendToday } from './aiBattery.js';

describe('AI Battery', () => {
  // Note: since the ledger is module-level, tests are additive.
  // We test the behavior, not absolute values.
  // Default daily limit is 5 (AI_BATTERY_DAILY_LIMIT env not set in tests).

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

    expect(entry.id).toBeTruthy();
    expect(entry.ts).toBeTruthy();
    expect(entry.provider).toBe('openai');
    expect(entry.category).toBe('llm_tokens');
    expect(entry.units).toBe(700);
    expect(entry.credits).toBe(1); // 1 use per AI call (flat model)

    const after = getBatteryStatus();
    expect(after.todayCredits).toBeGreaterThanOrEqual(before.todayCredits);
    expect(after.todayCalls).toBeGreaterThan(before.todayCalls);
  });

  it('records TTS spend', async () => {
    const entry = await recordTTSSpend({
      characterCount: 250,
      voiceId: 'test-voice',
      modelId: 'eleven_multilingual_v2',
      traceId: 'test-trace-2',
    });

    expect(entry.provider).toBe('elevenlabs');
    expect(entry.category).toBe('tts_characters');
    expect(entry.units).toBe(250);
    expect(entry.credits).toBe(1); // 1 use per TTS call (flat model)
  });

  it('records recharge as negative credits', async () => {
    const entry = await recordRecharge(10, 'test-trace-3');
    expect(entry.credits).toBe(-10);
    expect(entry.category).toBe('recharge');
  });

  it('hasBudget returns true when credits remain', () => {
    const status = getBatteryStatus();
    if (status.remaining > 1) {
      expect(hasBudget(1)).toBe(true);
    }
  });

  it('getLedger returns all entries', () => {
    const ledger = getLedger();
    expect(Array.isArray(ledger)).toBe(true);
    expect(ledger.length).toBeGreaterThanOrEqual(3);
  });

  it('battery status has correct shape', () => {
    const status = getBatteryStatus();
    expect(typeof status.todayCredits).toBe('number');
    expect(typeof status.totalCredits).toBe('number');
    expect(typeof status.dailyLimit).toBe('number');
    expect(typeof status.remaining).toBe('number');
    expect(typeof status.depleted).toBe('boolean');
    expect(typeof status.byProvider).toBe('object');
    expect('openai' in status.byProvider).toBe(true);
    expect('claude' in status.byProvider).toBe(true);
    expect('elevenlabs' in status.byProvider).toBe(true);
    expect(typeof status.todayTokens).toBe('number');
    expect(typeof status.todayTtsChars).toBe('number');
    expect(typeof status.todayCalls).toBe('number');
  });

  it('byProvider tracks per-provider spend', () => {
    const status = getBatteryStatus();
    expect(status.byProvider.openai).toBeGreaterThanOrEqual(1);
    expect(status.byProvider.elevenlabs).toBeGreaterThanOrEqual(1);
  });

  it('getSpendToday returns daily credits used (not lifetime)', () => {
    // All entries in this test run have today's timestamp, so they count as today
    const todaySpend = getSpendToday();
    expect(todaySpend).toBeGreaterThanOrEqual(2); // at least the LLM + TTS calls above
    // todayCredits on the status should match getSpendToday
    const status = getBatteryStatus();
    expect(status.todayCredits).toBe(todaySpend);
  });

  it('daily limit enforcement: remaining is based on today not lifetime', () => {
    const status = getBatteryStatus();
    // remaining = dailyLimit + todayRecharges - todayUses
    // Since we recharged 10 credits today: remaining = 5 + 10 - todayUses
    expect(status.remaining).toBe(Math.max(0, status.dailyLimit + 10 - status.todayCredits));
  });

  it('per-org daily isolation: separate org has full daily budget', () => {
    const isolatedStatus = getBatteryStatus('test-isolated-org');
    expect(isolatedStatus.todayCredits).toBe(0);
    expect(isolatedStatus.remaining).toBe(isolatedStatus.dailyLimit);
    expect(isolatedStatus.depleted).toBe(false);
  });
});
