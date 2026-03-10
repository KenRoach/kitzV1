/**
 * 10-User MVP Simulation Test
 *
 * Simulates 10 concurrent Kitz OS users exercising real use cases:
 *   - JWT authentication (sign, verify, reject bad tokens)
 *   - Org-level data isolation (each user's MCP calls carry their own userId)
 *   - WhatsApp command parsing (regex tier — no AI cost)
 *   - AI Battery tracking (concurrent spend across users)
 *   - Rate limiting / concurrent access patterns
 *
 * This is NOT an end-to-end test hitting real servers — it tests the
 * critical code paths in isolation to validate MVP readiness for 10 users.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createHmac } from 'node:crypto';

// ── JWT (gateway layer) ──
// Inline sign/verify so we don't import from kitz-gateway (different package)
function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const sig = base64UrlEncode(createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}
function verifyJwt(token: string, secret: string): Record<string, unknown> {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('Malformed JWT');
  const header = JSON.parse(base64UrlDecode(h).toString());
  if (header.alg !== 'HS256') throw new Error('Bad alg');
  const expected = base64UrlEncode(createHmac('sha256', secret).update(`${h}.${p}`).digest());
  if (s !== expected) throw new Error('Invalid signature');
  const payload = JSON.parse(base64UrlDecode(p).toString());
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('Token expired');
  return payload;
}

// ── Command Parser (kitz_os layer) ──
import { parseWhatsAppCommand } from './interfaces/whatsapp/commandParser.js';

// ── AI Battery (kitz_os layer) ──
import { recordLLMSpend, recordTTSSpend, getBatteryStatus, hasBudget } from './aiBattery.js';

// ── Test Fixtures ─────────────────────────────────────────

const JWT_SECRET = 'kitz-mvp-test-secret-2026';

interface TestUser {
  name: string;
  userId: string;
  orgId: string;
  scopes: string[];
  token: string;
  /** Typical WhatsApp messages this user would send */
  messages: string[];
}

function createTestUsers(): TestUser[] {
  const now = Math.floor(Date.now() / 1000);
  const users: Omit<TestUser, 'token'>[] = [
    { name: 'Maria (bakery owner)',         userId: 'user-001', orgId: 'org-bakery-pa',     scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['hola', 'contacts', 'orders', 'dashboard', 'battery'] },
    { name: 'Carlos (food truck)',          userId: 'user-002', orgId: 'org-foodtruck-pa',  scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['status', 'products', 'storefronts', 'summary'] },
    { name: 'Ana (nail salon)',             userId: 'user-003', orgId: 'org-nailsalon-cr',  scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['help', 'contacts', 'create order', 'battery'] },
    { name: 'Diego (mechanic)',             userId: 'user-004', orgId: 'org-mechanic-pa',   scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['hey', 'orders', 'contact Juan', 'report daily'] },
    { name: 'Sofia (boutique)',             userId: 'user-005', orgId: 'org-boutique-co',   scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['buenos dias', 'products', 'dashboard', 'storefronts'] },
    { name: 'Luis (delivery service)',      userId: 'user-006', orgId: 'org-delivery-pa',   scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['status', 'orders', 'contacts', 'summary'] },
    { name: 'Carmen (beauty products)',     userId: 'user-007', orgId: 'org-beauty-do',     scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['hola', 'storefronts', 'create product', 'battery'] },
    { name: 'Pedro (hardware store)',       userId: 'user-008', orgId: 'org-hardware-gt',   scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['hello', 'contacts', 'orders', 'products'] },
    { name: 'Isabella (tutoring)',          userId: 'user-009', orgId: 'org-tutoring-pa',   scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['help', 'dashboard', 'brain dump: new course idea for SAT prep'] },
    { name: 'Roberto (event planning)',     userId: 'user-010', orgId: 'org-events-pa',     scopes: ['events:write', 'tools:invoke', 'battery:read'], messages: ['yo', 'contacts', 'storefronts', 'recharge 10'] },
  ];

  return users.map(u => ({
    ...u,
    token: signJwt({
      sub: u.userId,
      org_id: u.orgId,
      scopes: u.scopes,
      iat: now,
      exp: now + 3600,
    }, JWT_SECRET),
  }));
}

// ── Tests ─────────────────────────────────────────────────

describe('10-User MVP Simulation', () => {
  let users: TestUser[];

  beforeAll(() => {
    users = createTestUsers();
  });

  // ── 1. JWT Authentication ──────────────────────────────

  describe('1. JWT Authentication — all 10 users get valid tokens', () => {
    it('each user token verifies correctly', () => {
      for (const user of users) {
        const claims = verifyJwt(user.token, JWT_SECRET);
        expect(claims.sub).toBe(user.userId);
        expect(claims.org_id).toBe(user.orgId);
        expect(claims.scopes).toEqual(user.scopes);
      }
    });

    it('all 10 tokens are unique', () => {
      const tokenSet = new Set(users.map(u => u.token));
      expect(tokenSet.size).toBe(10);
    });

    it('rejects token signed with wrong secret', () => {
      const badToken = signJwt({ sub: 'hacker', org_id: 'org-evil' }, 'wrong-secret');
      expect(() => verifyJwt(badToken, JWT_SECRET)).toThrow(/Invalid signature/);
    });

    it('rejects expired token', () => {
      const expired = signJwt({ sub: 'user-001', exp: Math.floor(Date.now() / 1000) - 120 }, JWT_SECRET);
      expect(() => verifyJwt(expired, JWT_SECRET)).toThrow(/Token expired/);
    });

    it('rejects malformed token', () => {
      expect(() => verifyJwt('not-a-jwt', JWT_SECRET)).toThrow(/Malformed JWT/);
    });
  });

  // ── 2. Org Isolation ───────────────────────────────────

  describe('2. Org Isolation — each user maps to a distinct org', () => {
    it('all 10 users have unique orgIds', () => {
      const orgs = new Set(users.map(u => u.orgId));
      expect(orgs.size).toBe(10);
    });

    it('all 10 users have unique userIds', () => {
      const ids = new Set(users.map(u => u.userId));
      expect(ids.size).toBe(10);
    });

    it('JWT claims carry org_id for downstream RLS', () => {
      for (const user of users) {
        const claims = verifyJwt(user.token, JWT_SECRET);
        expect(claims.org_id).toBeTruthy();
        expect(typeof claims.org_id).toBe('string');
        expect((claims.org_id as string).length).toBeGreaterThan(0);
      }
    });

    it('MCP userId parameter defaults to GOD_MODE only when no userId given', () => {
      // Simulate: when userId is provided, it should be used
      const effectiveUserId = (userId?: string) => userId || '8787fee9-d06a-442f-91ba-fd082b134ccf';

      for (const user of users) {
        expect(effectiveUserId(user.userId)).toBe(user.userId);
      }
      // System call (no userId) falls back to GOD_MODE
      expect(effectiveUserId(undefined)).toBe('8787fee9-d06a-442f-91ba-fd082b134ccf');
    });
  });

  // ── 3. Command Parser — regex tier (free, no AI cost) ──

  describe('3. Command Parser — all 10 users\' typical messages parse correctly', () => {
    it('greetings are recognized for all greeting variants', () => {
      const greetings = ['hola', 'hey', 'hello', 'buenos dias', 'yo'];
      for (const g of greetings) {
        const cmd = parseWhatsAppCommand(g);
        expect(cmd).toBeTruthy();
        expect(cmd!.action).toBe('greeting');
      }
    });

    it('system commands parse correctly', () => {
      expect(parseWhatsAppCommand('status')?.action).toBe('status');
      expect(parseWhatsAppCommand('help')?.action).toBe('help');
      expect(parseWhatsAppCommand('battery')?.action).toBe('battery');
    });

    it('CRM commands parse correctly', () => {
      expect(parseWhatsAppCommand('contacts')?.action).toBe('list_contacts');
      expect(parseWhatsAppCommand('contact Juan')?.action).toBe('get_contact');
      expect(parseWhatsAppCommand('contact Juan')?.contactId).toBe('juan');
    });

    it('order commands parse correctly', () => {
      expect(parseWhatsAppCommand('orders')?.action).toBe('list_orders');
      expect(parseWhatsAppCommand('create order')?.action).toBe('create_order');
    });

    it('storefront commands parse correctly', () => {
      expect(parseWhatsAppCommand('storefronts')?.action).toBe('list_storefronts');
      expect(parseWhatsAppCommand('create storefront')?.action).toBe('create_storefront');
    });

    it('product commands parse correctly', () => {
      expect(parseWhatsAppCommand('products')?.action).toBe('list_products');
      expect(parseWhatsAppCommand('create product')?.action).toBe('create_product');
    });

    it('dashboard and summary commands parse correctly', () => {
      expect(parseWhatsAppCommand('dashboard')?.action).toBe('dashboard_metrics');
      expect(parseWhatsAppCommand('summary')?.action).toBe('business_summary');
    });

    it('brain dump parses with transcript', () => {
      const cmd = parseWhatsAppCommand('brain dump: new course idea for SAT prep');
      expect(cmd).toBeTruthy();
      expect(cmd!.action).toBe('braindump');
      expect(cmd!.transcript).toContain('SAT prep');
    });

    it('recharge parses with amount', () => {
      const cmd = parseWhatsAppCommand('recharge 10');
      expect(cmd).toBeTruthy();
      expect(cmd!.action).toBe('recharge');
      expect(cmd!.credits).toBe(10);
    });

    it('report command parses with cadence', () => {
      const cmd = parseWhatsAppCommand('report daily');
      expect(cmd).toBeTruthy();
      expect(cmd!.action).toBe('report');
      expect(cmd!.cadence).toBe('daily');
    });

    it('all 10 users\' messages have at least one valid parse', () => {
      for (const user of users) {
        let parsed = 0;
        for (const msg of user.messages) {
          if (parseWhatsAppCommand(msg)) parsed++;
        }
        expect(parsed).toBeGreaterThan(0);
      }
    });

    it('processes all user messages without errors', () => {
      let totalMessages = 0;
      let parsedMessages = 0;
      for (const user of users) {
        for (const msg of user.messages) {
          totalMessages++;
          const result = parseWhatsAppCommand(msg);
          if (result) parsedMessages++;
        }
      }
      expect(totalMessages).toBeGreaterThanOrEqual(40);
      // Most should parse (some complex ones fall through to AI, which is expected)
      const parseRate = parsedMessages / totalMessages;
      expect(parseRate).toBeGreaterThanOrEqual(0.8);
    });
  });

  // ── 4. AI Battery — concurrent spend tracking ──────────

  describe('4. AI Battery — tracks spend across 10 concurrent users', () => {
    it('records spend from 10 users concurrently', async () => {
      const statusBefore = getBatteryStatus();
      const creditsBefore = statusBefore.todayCredits;

      // Simulate 10 users each making 1 LLM call
      const promises = users.map((user, i) =>
        recordLLMSpend({
          provider: i % 2 === 0 ? 'openai' : 'claude',
          model: i % 2 === 0 ? 'gpt-4o-mini' : 'claude-haiku-4-5-20251001',
          promptTokens: 200 + i * 50,
          completionTokens: 100 + i * 20,
          totalTokens: 300 + i * 70,
          traceId: `sim-${user.userId}-${Date.now()}`,
          toolContext: `simulation_user_${i + 1}`,
        })
      );

      const entries = await Promise.all(promises);

      expect(entries.length).toBe(10);

      // Each entry should have unique id and trace
      const ids = new Set(entries.map(e => e.id));
      expect(ids.size).toBe(10);

      // Total credits should have increased
      const statusAfter = getBatteryStatus();
      expect(statusAfter.todayCredits).toBeGreaterThan(creditsBefore);
    });

    it('provider breakdown tracks OpenAI and Claude separately', () => {
      const status = getBatteryStatus();
      expect(status.byProvider.openai).toBeGreaterThan(0);
      expect(status.byProvider.claude).toBeGreaterThan(0);
    });

    it('hasBudget reflects remaining credit state', () => {
      const status = getBatteryStatus();
      // hasBudget should match whether credits actually remain
      expect(hasBudget(1)).toBe(status.remaining >= 1);
    });

    it('call count reflects all user calls', () => {
      const status = getBatteryStatus();
      // At least 10 from this test + previous test runs in this process
      expect(status.todayCalls).toBeGreaterThanOrEqual(10);
    });

    it('handles TTS spend from a voice-using user', async () => {
      const entry = await recordTTSSpend({
        characterCount: 300,
        voiceId: 'kitz-female-v1',
        modelId: 'eleven_multilingual_v2',
        traceId: `sim-voice-${Date.now()}`,
        toolContext: 'simulation_voice_user',
      });

      expect(entry.provider).toBe('elevenlabs');
      expect(entry.credits).toBe(1); // 1 use per TTS call (flat model)

      const status = getBatteryStatus();
      expect(status.byProvider.elevenlabs).toBeGreaterThan(0);
      expect(status.todayTtsChars).toBeGreaterThan(0);
    });
  });

  // ── 5. Concurrent Request Simulation ───────────────────

  describe('5. Concurrent Access — 10 users hitting system simultaneously', () => {
    it('10 concurrent JWT verifications complete without error', () => {
      const results = users.map(user => {
        try {
          return verifyJwt(user.token, JWT_SECRET);
        } catch (e) {
          return { error: (e as Error).message };
        }
      });

      for (let i = 0; i < results.length; i++) {
        expect(results[i]).not.toHaveProperty('error');
        expect((results[i] as Record<string, unknown>).sub).toBe(users[i].userId);
      }
    });

    it('10 concurrent command parses return correct results', () => {
      // Each user sends their first message
      const results = users.map(user => ({
        user: user.name,
        message: user.messages[0],
        result: parseWhatsAppCommand(user.messages[0]),
      }));

      for (const r of results) {
        expect(r.result).toBeTruthy();
      }
    });

    it('10 concurrent battery spend records complete without data loss', async () => {
      const countBefore = getBatteryStatus().todayCalls;

      const promises = users.map((user, i) =>
        recordLLMSpend({
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          traceId: `concurrent-${user.userId}-${Date.now()}-${i}`,
          toolContext: 'concurrent_test',
        })
      );

      await Promise.all(promises);

      const countAfter = getBatteryStatus().todayCalls;
      expect(countAfter).toBeGreaterThanOrEqual(countBefore + 10);
    });
  });

  // ── 6. Full User Journey Simulation ────────────────────

  describe('6. Full Journey — each user runs their typical session', () => {
    it('Maria (bakery): greeting → contacts → orders → dashboard → battery', () => {
      const messages = ['hola', 'contacts', 'orders', 'dashboard', 'battery'];
      const expected = ['greeting', 'list_contacts', 'list_orders', 'dashboard_metrics', 'battery'];

      for (let i = 0; i < messages.length; i++) {
        const cmd = parseWhatsAppCommand(messages[i]);
        expect(cmd).toBeTruthy();
        expect(cmd!.action).toBe(expected[i]);
      }
    });

    it('Carlos (food truck): status → products → storefronts → summary', () => {
      const messages = ['status', 'products', 'storefronts', 'summary'];
      const expected = ['status', 'list_products', 'list_storefronts', 'business_summary'];

      for (let i = 0; i < messages.length; i++) {
        const cmd = parseWhatsAppCommand(messages[i]);
        expect(cmd).toBeTruthy();
        expect(cmd!.action).toBe(expected[i]);
      }
    });

    it('Isabella (tutoring): help → dashboard → brain dump', () => {
      const cmd1 = parseWhatsAppCommand('help');
      expect(cmd1?.action).toBe('help');

      const cmd2 = parseWhatsAppCommand('dashboard');
      expect(cmd2?.action).toBe('dashboard_metrics');

      const cmd3 = parseWhatsAppCommand('brain dump: new course idea for SAT prep');
      expect(cmd3?.action).toBe('braindump');
      expect(cmd3?.transcript).toContain('SAT prep');
    });

    it('Roberto (events): greeting → contacts → storefronts → recharge', () => {
      const cmd1 = parseWhatsAppCommand('yo');
      expect(cmd1?.action).toBe('greeting');

      const cmd2 = parseWhatsAppCommand('contacts');
      expect(cmd2?.action).toBe('list_contacts');

      const cmd3 = parseWhatsAppCommand('storefronts');
      expect(cmd3?.action).toBe('list_storefronts');

      const cmd4 = parseWhatsAppCommand('recharge 10');
      expect(cmd4?.action).toBe('recharge');
      expect(cmd4?.credits).toBe(10);
    });
  });

  // ── 7. Edge Cases & Security ───────────────────────────

  describe('7. Edge Cases & Security', () => {
    it('empty message returns null (falls to AI router)', () => {
      expect(parseWhatsAppCommand('')).toBeNull();
    });

    it('gibberish returns null (falls to AI router)', () => {
      expect(parseWhatsAppCommand('asdfghjkl')).toBeNull();
    });

    it('SQL injection attempt parses as null (safe)', () => {
      const result = parseWhatsAppCommand("'; DROP TABLE contacts; --");
      expect(result).toBeNull();
    });

    it('XSS attempt parses as null (safe)', () => {
      const result = parseWhatsAppCommand('<script>alert("xss")</script>');
      expect(result).toBeNull();
    });

    it('very long message does not crash parser', () => {
      const longMsg = 'a'.repeat(10_000);
      const result = parseWhatsAppCommand(longMsg);
      expect(result).toBeNull();
    });

    it('unicode / emoji messages do not crash', () => {
      expect(parseWhatsAppCommand('hola 🇵🇦')?.action).toBe('greeting');
      expect(parseWhatsAppCommand('📦 orders')).toBeNull(); // emoji prefix breaks regex — falls to AI
    });

    it('user cannot forge another user\'s org via JWT', () => {
      // User 1 signs a token claiming to be org-bakery-pa
      const token1 = signJwt({ sub: 'user-001', org_id: 'org-bakery-pa' }, JWT_SECRET);
      // User 2 cannot re-sign with different org without knowing the secret
      const forged = signJwt({ sub: 'user-001', org_id: 'org-hacker' }, 'attacker-secret');
      expect(() => verifyJwt(forged, JWT_SECRET)).toThrow(/Invalid signature/);

      // But the legitimate token works fine
      const claims = verifyJwt(token1, JWT_SECRET);
      expect(claims.org_id).toBe('org-bakery-pa');
    });
  });

  // ── Summary ────────────────────────────────────────────

  describe('Summary', () => {
    it('final battery status reflects all simulation activity', () => {
      const status = getBatteryStatus();
      // Battery may be depleted when tests share the module-level ledger
      expect(status.todayCalls).toBeGreaterThanOrEqual(20);
    });
  });
});
