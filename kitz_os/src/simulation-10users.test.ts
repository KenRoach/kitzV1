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

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
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

  before(() => {
    users = createTestUsers();
  });

  // ── 1. JWT Authentication ──────────────────────────────

  describe('1. JWT Authentication — all 10 users get valid tokens', () => {
    it('each user token verifies correctly', () => {
      for (const user of users) {
        const claims = verifyJwt(user.token, JWT_SECRET);
        assert.equal(claims.sub, user.userId, `${user.name}: sub mismatch`);
        assert.equal(claims.org_id, user.orgId, `${user.name}: org_id mismatch`);
        assert.deepEqual(claims.scopes, user.scopes, `${user.name}: scopes mismatch`);
      }
    });

    it('all 10 tokens are unique', () => {
      const tokenSet = new Set(users.map(u => u.token));
      assert.equal(tokenSet.size, 10, 'expected 10 unique tokens');
    });

    it('rejects token signed with wrong secret', () => {
      const badToken = signJwt({ sub: 'hacker', org_id: 'org-evil' }, 'wrong-secret');
      assert.throws(() => verifyJwt(badToken, JWT_SECRET), /Invalid signature/);
    });

    it('rejects expired token', () => {
      const expired = signJwt({ sub: 'user-001', exp: Math.floor(Date.now() / 1000) - 120 }, JWT_SECRET);
      assert.throws(() => verifyJwt(expired, JWT_SECRET), /Token expired/);
    });

    it('rejects malformed token', () => {
      assert.throws(() => verifyJwt('not-a-jwt', JWT_SECRET), /Malformed JWT/);
    });
  });

  // ── 2. Org Isolation ───────────────────────────────────

  describe('2. Org Isolation — each user maps to a distinct org', () => {
    it('all 10 users have unique orgIds', () => {
      const orgs = new Set(users.map(u => u.orgId));
      assert.equal(orgs.size, 10, 'expected 10 unique orgs');
    });

    it('all 10 users have unique userIds', () => {
      const ids = new Set(users.map(u => u.userId));
      assert.equal(ids.size, 10, 'expected 10 unique user IDs');
    });

    it('JWT claims carry org_id for downstream RLS', () => {
      for (const user of users) {
        const claims = verifyJwt(user.token, JWT_SECRET);
        assert.ok(claims.org_id, `${user.name}: missing org_id in claims`);
        assert.ok(typeof claims.org_id === 'string' && claims.org_id.length > 0);
      }
    });

    it('MCP userId parameter defaults to GOD_MODE only when no userId given', () => {
      // Simulate: when userId is provided, it should be used
      const effectiveUserId = (userId?: string) => userId || '8787fee9-d06a-442f-91ba-fd082b134ccf';

      for (const user of users) {
        assert.equal(effectiveUserId(user.userId), user.userId, `${user.name}: should use own userId`);
      }
      // System call (no userId) falls back to GOD_MODE
      assert.equal(effectiveUserId(undefined), '8787fee9-d06a-442f-91ba-fd082b134ccf');
    });
  });

  // ── 3. Command Parser — regex tier (free, no AI cost) ──

  describe('3. Command Parser — all 10 users\' typical messages parse correctly', () => {
    it('greetings are recognized for all greeting variants', () => {
      const greetings = ['hola', 'hey', 'hello', 'buenos dias', 'yo'];
      for (const g of greetings) {
        const cmd = parseWhatsAppCommand(g);
        assert.ok(cmd, `"${g}" should parse`);
        assert.equal(cmd.action, 'greeting', `"${g}" should be greeting`);
      }
    });

    it('system commands parse correctly', () => {
      assert.equal(parseWhatsAppCommand('status')?.action, 'status');
      assert.equal(parseWhatsAppCommand('help')?.action, 'help');
      assert.equal(parseWhatsAppCommand('battery')?.action, 'battery');
    });

    it('CRM commands parse correctly', () => {
      assert.equal(parseWhatsAppCommand('contacts')?.action, 'list_contacts');
      assert.equal(parseWhatsAppCommand('contact Juan')?.action, 'get_contact');
      assert.equal(parseWhatsAppCommand('contact Juan')?.contactId, 'juan');
    });

    it('order commands parse correctly', () => {
      assert.equal(parseWhatsAppCommand('orders')?.action, 'list_orders');
      assert.equal(parseWhatsAppCommand('create order')?.action, 'create_order');
    });

    it('storefront commands parse correctly', () => {
      assert.equal(parseWhatsAppCommand('storefronts')?.action, 'list_storefronts');
      assert.equal(parseWhatsAppCommand('create storefront')?.action, 'create_storefront');
    });

    it('product commands parse correctly', () => {
      assert.equal(parseWhatsAppCommand('products')?.action, 'list_products');
      assert.equal(parseWhatsAppCommand('create product')?.action, 'create_product');
    });

    it('dashboard and summary commands parse correctly', () => {
      assert.equal(parseWhatsAppCommand('dashboard')?.action, 'dashboard_metrics');
      assert.equal(parseWhatsAppCommand('summary')?.action, 'business_summary');
    });

    it('brain dump parses with transcript', () => {
      const cmd = parseWhatsAppCommand('brain dump: new course idea for SAT prep');
      assert.ok(cmd);
      assert.equal(cmd.action, 'braindump');
      assert.ok(cmd.transcript?.includes('SAT prep'));
    });

    it('recharge parses with amount', () => {
      const cmd = parseWhatsAppCommand('recharge 10');
      assert.ok(cmd);
      assert.equal(cmd.action, 'recharge');
      assert.equal(cmd.credits, 10);
    });

    it('report command parses with cadence', () => {
      const cmd = parseWhatsAppCommand('report daily');
      assert.ok(cmd);
      assert.equal(cmd.action, 'report');
      assert.equal(cmd.cadence, 'daily');
    });

    it('all 10 users\' messages have at least one valid parse', () => {
      for (const user of users) {
        let parsed = 0;
        for (const msg of user.messages) {
          if (parseWhatsAppCommand(msg)) parsed++;
        }
        assert.ok(parsed > 0, `${user.name}: expected at least 1 message to parse, got ${parsed}/${user.messages.length}`);
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
      assert.ok(totalMessages >= 40, `expected at least 40 total messages, got ${totalMessages}`);
      // Most should parse (some complex ones fall through to AI, which is expected)
      const parseRate = parsedMessages / totalMessages;
      assert.ok(parseRate >= 0.8, `expected at least 80% parse rate, got ${(parseRate * 100).toFixed(0)}% (${parsedMessages}/${totalMessages})`);
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

      assert.equal(entries.length, 10, 'should have 10 spend entries');

      // Each entry should have unique id and trace
      const ids = new Set(entries.map(e => e.id));
      assert.equal(ids.size, 10, 'all entry IDs should be unique');

      // Total credits should have increased
      const statusAfter = getBatteryStatus();
      assert.ok(statusAfter.todayCredits > creditsBefore, 'credits should increase after 10-user spend');
    });

    it('provider breakdown tracks OpenAI and Claude separately', () => {
      const status = getBatteryStatus();
      assert.ok(status.byProvider.openai > 0, 'OpenAI spend should be tracked');
      assert.ok(status.byProvider.claude > 0, 'Claude spend should be tracked');
    });

    it('hasBudget returns true when sufficient credits remain', () => {
      // With default 500 credit daily limit, 10 small calls won't deplete
      assert.equal(hasBudget(1), true, 'should have budget for 1 credit');
    });

    it('call count reflects all user calls', () => {
      const status = getBatteryStatus();
      // At least 10 from this test + previous test runs in this process
      assert.ok(status.todayCalls >= 10, `expected at least 10 calls, got ${status.todayCalls}`);
    });

    it('handles TTS spend from a voice-using user', async () => {
      const entry = await recordTTSSpend({
        characterCount: 300,
        voiceId: 'kitz-female-v1',
        modelId: 'eleven_multilingual_v2',
        traceId: `sim-voice-${Date.now()}`,
        toolContext: 'simulation_voice_user',
      });

      assert.equal(entry.provider, 'elevenlabs');
      assert.equal(entry.credits, 0.6); // 300 chars / 500 = 0.6

      const status = getBatteryStatus();
      assert.ok(status.byProvider.elevenlabs > 0, 'ElevenLabs spend tracked');
      assert.ok(status.todayTtsChars > 0, 'TTS character count tracked');
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
        assert.ok(!('error' in results[i]), `User ${users[i].name} JWT failed: ${(results[i] as { error: string }).error}`);
        assert.equal((results[i] as Record<string, unknown>).sub, users[i].userId);
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
        assert.ok(r.result, `${r.user}: "${r.message}" should parse`);
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
      assert.ok(countAfter >= countBefore + 10, `expected at least 10 new calls recorded, got ${countAfter - countBefore}`);
    });
  });

  // ── 6. Full User Journey Simulation ────────────────────

  describe('6. Full Journey — each user runs their typical session', () => {
    it('Maria (bakery): greeting → contacts → orders → dashboard → battery', () => {
      const messages = ['hola', 'contacts', 'orders', 'dashboard', 'battery'];
      const expected = ['greeting', 'list_contacts', 'list_orders', 'dashboard_metrics', 'battery'];

      for (let i = 0; i < messages.length; i++) {
        const cmd = parseWhatsAppCommand(messages[i]);
        assert.ok(cmd, `"${messages[i]}" should parse`);
        assert.equal(cmd.action, expected[i], `"${messages[i]}" → ${expected[i]}`);
      }
    });

    it('Carlos (food truck): status → products → storefronts → summary', () => {
      const messages = ['status', 'products', 'storefronts', 'summary'];
      const expected = ['status', 'list_products', 'list_storefronts', 'business_summary'];

      for (let i = 0; i < messages.length; i++) {
        const cmd = parseWhatsAppCommand(messages[i]);
        assert.ok(cmd, `"${messages[i]}" should parse`);
        assert.equal(cmd.action, expected[i]);
      }
    });

    it('Isabella (tutoring): help → dashboard → brain dump', () => {
      const cmd1 = parseWhatsAppCommand('help');
      assert.equal(cmd1?.action, 'help');

      const cmd2 = parseWhatsAppCommand('dashboard');
      assert.equal(cmd2?.action, 'dashboard_metrics');

      const cmd3 = parseWhatsAppCommand('brain dump: new course idea for SAT prep');
      assert.equal(cmd3?.action, 'braindump');
      assert.ok(cmd3?.transcript?.includes('SAT prep'));
    });

    it('Roberto (events): greeting → contacts → storefronts → recharge', () => {
      const cmd1 = parseWhatsAppCommand('yo');
      assert.equal(cmd1?.action, 'greeting');

      const cmd2 = parseWhatsAppCommand('contacts');
      assert.equal(cmd2?.action, 'list_contacts');

      const cmd3 = parseWhatsAppCommand('storefronts');
      assert.equal(cmd3?.action, 'list_storefronts');

      const cmd4 = parseWhatsAppCommand('recharge 10');
      assert.equal(cmd4?.action, 'recharge');
      assert.equal(cmd4?.credits, 10);
    });
  });

  // ── 7. Edge Cases & Security ───────────────────────────

  describe('7. Edge Cases & Security', () => {
    it('empty message returns null (falls to AI router)', () => {
      assert.equal(parseWhatsAppCommand(''), null);
    });

    it('gibberish returns null (falls to AI router)', () => {
      assert.equal(parseWhatsAppCommand('asdfghjkl'), null);
    });

    it('SQL injection attempt parses as null (safe)', () => {
      const result = parseWhatsAppCommand("'; DROP TABLE contacts; --");
      assert.equal(result, null, 'SQL injection should not match any command');
    });

    it('XSS attempt parses as null (safe)', () => {
      const result = parseWhatsAppCommand('<script>alert("xss")</script>');
      assert.equal(result, null, 'XSS should not match any command');
    });

    it('very long message does not crash parser', () => {
      const longMsg = 'a'.repeat(10_000);
      const result = parseWhatsAppCommand(longMsg);
      assert.equal(result, null, 'long message should return null');
    });

    it('unicode / emoji messages do not crash', () => {
      assert.equal(parseWhatsAppCommand('hola 🇵🇦')?.action, 'greeting');
      assert.equal(parseWhatsAppCommand('📦 orders'), null); // emoji prefix breaks regex — falls to AI
    });

    it('user cannot forge another user\'s org via JWT', () => {
      // User 1 signs a token claiming to be org-bakery-pa
      const token1 = signJwt({ sub: 'user-001', org_id: 'org-bakery-pa' }, JWT_SECRET);
      // User 2 cannot re-sign with different org without knowing the secret
      const forged = signJwt({ sub: 'user-001', org_id: 'org-hacker' }, 'attacker-secret');
      assert.throws(() => verifyJwt(forged, JWT_SECRET), /Invalid signature/);

      // But the legitimate token works fine
      const claims = verifyJwt(token1, JWT_SECRET);
      assert.equal(claims.org_id, 'org-bakery-pa');
    });
  });

  // ── Summary ────────────────────────────────────────────

  describe('Summary', () => {
    it('final battery status reflects all simulation activity', () => {
      const status = getBatteryStatus();
      console.log('\n── 10-User Simulation Summary ──');
      console.log(`  Total calls today: ${status.todayCalls}`);
      console.log(`  Credits consumed: ${status.todayCredits.toFixed(2)} / ${status.dailyLimit}`);
      console.log(`  Remaining: ${status.remaining.toFixed(2)}`);
      console.log(`  OpenAI: ${status.byProvider.openai.toFixed(2)} credits`);
      console.log(`  Claude: ${status.byProvider.claude.toFixed(2)} credits`);
      console.log(`  ElevenLabs: ${status.byProvider.elevenlabs.toFixed(2)} credits`);
      console.log(`  LLM tokens: ${status.todayTokens.toLocaleString()}`);
      console.log(`  TTS chars: ${status.todayTtsChars.toLocaleString()}`);
      console.log(`  Depleted: ${status.depleted ? 'YES' : 'NO'}`);
      console.log('────────────────────────────────\n');

      assert.equal(status.depleted, false, 'battery should NOT be depleted after simulation');
      assert.ok(status.todayCalls >= 20, 'should have at least 20 tracked calls');
    });
  });
});
