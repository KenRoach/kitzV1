/**
 * WhatsApp Connector — Unit Tests
 *
 * Tests utility modules: backoff, debounce, dedupe, extract.
 * These are the testable pure-logic modules that don't require Baileys.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeBackoff, DEFAULT_RECONNECT_POLICY, type ReconnectPolicy } from './backoff.js';
import { InboundDebouncer, type DebouncedMessage } from './debounce.js';
import { isDuplicateMessage, buildDedupeKey } from './dedupe.js';
import { extractReplyContext, extractLocationData, formatLocationText, type LocationData } from './extract.js';

// ── Backoff ──────────────────────────────────────────────

describe('computeBackoff', () => {
  it('returns initialMs for attempt 0', () => {
    const delay = computeBackoff(0, { ...DEFAULT_RECONNECT_POLICY, jitter: 0 });
    expect(delay).toBe(DEFAULT_RECONNECT_POLICY.initialMs);
  });

  it('increases delay with each attempt', () => {
    const policy: ReconnectPolicy = { ...DEFAULT_RECONNECT_POLICY, jitter: 0 };
    const d0 = computeBackoff(0, policy);
    const d1 = computeBackoff(1, policy);
    const d2 = computeBackoff(2, policy);
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
  });

  it('caps at maxMs', () => {
    const policy: ReconnectPolicy = { ...DEFAULT_RECONNECT_POLICY, jitter: 0 };
    const delay = computeBackoff(100, policy);
    expect(delay).toBeLessThanOrEqual(policy.maxMs);
  });

  it('never goes below initialMs', () => {
    for (let i = 0; i < 20; i++) {
      const delay = computeBackoff(i);
      expect(delay).toBeGreaterThanOrEqual(DEFAULT_RECONNECT_POLICY.initialMs);
    }
  });

  it('applies jitter within expected range', () => {
    const policy: ReconnectPolicy = { initialMs: 1000, maxMs: 10000, factor: 2, jitter: 0.5, maxAttempts: 10 };
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      results.add(computeBackoff(2, policy));
    }
    // With jitter, we should get some variation
    expect(results.size).toBeGreaterThan(1);
  });
});

// ── Debouncer ────────────────────────────────────────────

describe('InboundDebouncer', () => {
  function makeMsg(overrides: Partial<DebouncedMessage> = {}): DebouncedMessage {
    return {
      text: 'hello',
      senderJid: '507XXXX@s.whatsapp.net',
      userId: 'user-1',
      traceId: 'trace-1',
      hasMedia: false,
      ...overrides,
    };
  }

  it('flushes media messages immediately', async () => {
    const flushed: DebouncedMessage[][] = [];
    const debouncer = new InboundDebouncer({
      windowMs: 5000,
      onFlush: async (msgs) => { flushed.push(msgs); },
    });

    debouncer.enqueue(makeMsg({ hasMedia: true }));
    // Media should flush immediately (async)
    await vi.waitFor(() => expect(flushed.length).toBe(1));
    expect(flushed[0][0].hasMedia).toBe(true);
  });

  it('flushes immediately when windowMs is 0', async () => {
    const flushed: DebouncedMessage[][] = [];
    const debouncer = new InboundDebouncer({
      windowMs: 0,
      onFlush: async (msgs) => { flushed.push(msgs); },
    });

    debouncer.enqueue(makeMsg());
    await vi.waitFor(() => expect(flushed.length).toBe(1));
  });

  it('batches messages within the window', async () => {
    vi.useFakeTimers();
    const flushed: DebouncedMessage[][] = [];
    const debouncer = new InboundDebouncer({
      windowMs: 500,
      onFlush: async (msgs) => { flushed.push(msgs); },
    });

    debouncer.enqueue(makeMsg({ text: 'first' }));
    debouncer.enqueue(makeMsg({ text: 'second' }));
    expect(flushed.length).toBe(0);

    vi.advanceTimersByTime(600);
    await vi.waitFor(() => expect(flushed.length).toBe(1));
    expect(flushed[0].length).toBe(2);
    expect(flushed[0][0].text).toBe('first');
    expect(flushed[0][1].text).toBe('second');
    vi.useRealTimers();
  });

  it('separates batches by sender', async () => {
    vi.useFakeTimers();
    const flushed: DebouncedMessage[][] = [];
    const debouncer = new InboundDebouncer({
      windowMs: 500,
      onFlush: async (msgs) => { flushed.push(msgs); },
    });

    debouncer.enqueue(makeMsg({ senderJid: 'a@s.whatsapp.net' }));
    debouncer.enqueue(makeMsg({ senderJid: 'b@s.whatsapp.net' }));

    vi.advanceTimersByTime(600);
    await vi.waitFor(() => expect(flushed.length).toBe(2));
    vi.useRealTimers();
  });

  it('flushAll flushes all pending batches', async () => {
    const flushed: DebouncedMessage[][] = [];
    const debouncer = new InboundDebouncer({
      windowMs: 60000,
      onFlush: async (msgs) => { flushed.push(msgs); },
    });

    debouncer.enqueue(makeMsg({ senderJid: 'a@s.whatsapp.net' }));
    debouncer.enqueue(makeMsg({ senderJid: 'b@s.whatsapp.net' }));
    debouncer.flushAll();

    await vi.waitFor(() => expect(flushed.length).toBe(2));
  });

  it('calls onError when flush throws', async () => {
    const errors: unknown[] = [];
    const debouncer = new InboundDebouncer({
      windowMs: 0,
      onFlush: async () => { throw new Error('flush failed'); },
      onError: (err) => { errors.push(err); },
    });

    debouncer.enqueue(makeMsg());
    await vi.waitFor(() => expect(errors.length).toBe(1));
    expect((errors[0] as Error).message).toBe('flush failed');
  });
});

// ── Dedupe ───────────────────────────────────────────────

describe('dedupe', () => {
  describe('buildDedupeKey', () => {
    it('builds key from userId, remoteJid, messageId', () => {
      const key = buildDedupeKey('user-1', '507XXXX@s.whatsapp.net', 'msg-123');
      expect(key).toBe('user-1:507XXXX@s.whatsapp.net:msg-123');
    });
  });

  describe('isDuplicateMessage', () => {
    it('returns false for first occurrence', () => {
      const key = `test-dedupe-${Date.now()}-${Math.random()}`;
      expect(isDuplicateMessage(key)).toBe(false);
    });

    it('returns true for second occurrence', () => {
      const key = `test-dedupe-repeat-${Date.now()}-${Math.random()}`;
      isDuplicateMessage(key);
      expect(isDuplicateMessage(key)).toBe(true);
    });

    it('handles different keys independently', () => {
      const ts = Date.now();
      const key1 = `dedupe-a-${ts}-${Math.random()}`;
      const key2 = `dedupe-b-${ts}-${Math.random()}`;
      isDuplicateMessage(key1);
      expect(isDuplicateMessage(key2)).toBe(false);
    });
  });
});

// ── Extract ──────────────────────────────────────────────

describe('extract', () => {
  describe('extractReplyContext', () => {
    it('returns null for non-reply messages', () => {
      const msg = { message: { conversation: 'hello' } };
      expect(extractReplyContext(msg as any)).toBeNull();
    });

    it('extracts reply context from extendedTextMessage', () => {
      const msg = {
        message: {
          extendedTextMessage: {
            text: 'reply text',
            contextInfo: {
              stanzaId: 'orig-msg-id',
              participant: 'sender@s.whatsapp.net',
              quotedMessage: {
                conversation: 'original message',
              },
            },
          },
        },
      };
      const ctx = extractReplyContext(msg as any);
      expect(ctx).not.toBeNull();
      expect(ctx!.id).toBe('orig-msg-id');
      expect(ctx!.body).toBe('original message');
      expect(ctx!.sender).toBe('sender@s.whatsapp.net');
    });

    it('extracts reply context from image caption', () => {
      const msg = {
        message: {
          imageMessage: {
            caption: 'image reply',
            contextInfo: {
              stanzaId: 'img-msg-id',
              quotedMessage: {
                imageMessage: { caption: 'original caption' },
              },
            },
          },
        },
      };
      const ctx = extractReplyContext(msg as any);
      expect(ctx).not.toBeNull();
      expect(ctx!.body).toBe('original caption');
    });
  });

  describe('extractLocationData', () => {
    it('returns null for null message', () => {
      expect(extractLocationData(null)).toBeNull();
    });

    it('returns null for non-location message', () => {
      expect(extractLocationData({ conversation: 'hello' } as any)).toBeNull();
    });

    it('extracts location data', () => {
      const message = {
        locationMessage: {
          degreesLatitude: 8.9824,
          degreesLongitude: -79.5199,
          name: 'Panama City',
          address: 'Calle 50',
        },
      };
      const loc = extractLocationData(message as any);
      expect(loc).not.toBeNull();
      expect(loc!.latitude).toBe(8.9824);
      expect(loc!.longitude).toBe(-79.5199);
      expect(loc!.name).toBe('Panama City');
    });

    it('returns null when coordinates are missing', () => {
      const message = { locationMessage: { degreesLatitude: 0, degreesLongitude: 0 } };
      expect(extractLocationData(message as any)).toBeNull();
    });
  });

  describe('formatLocationText', () => {
    it('formats with name and address', () => {
      const loc: LocationData = { latitude: 8.9824, longitude: -79.5199, name: 'Panama City', address: 'Calle 50' };
      const text = formatLocationText(loc);
      expect(text).toContain('Panama City');
      expect(text).toContain('Calle 50');
      expect(text).toContain('8.982400');
    });

    it('formats with only coordinates', () => {
      const loc: LocationData = { latitude: 8.9824, longitude: -79.5199 };
      const text = formatLocationText(loc);
      expect(text).toBe('(8.982400, -79.519900)');
    });
  });
});
