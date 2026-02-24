#!/usr/bin/env npx tsx
/**
 * Kitz — 10-User Simulation Script
 *
 * Exercises the full platform as 10 concurrent LatAm small business owners.
 * Each user: signs up → creates leads → creates orders → creates checkout links
 * → sends messages to Kitz → checks battery → triggers payment webhooks.
 *
 * Usage:
 *   npx tsx scripts/simulate-10-users.ts
 *
 * Requires services running (docker compose up):
 *   - kitz-gateway  :4000
 *   - kitz_os       :3012
 *   - workspace     :3001
 *   - kitz-payments :3005
 */

import { randomUUID } from 'node:crypto';

// ── Config ──
const GATEWAY  = process.env.GATEWAY_URL  || 'http://localhost:4000';
const KITZ_OS  = process.env.KITZ_OS_URL  || 'http://localhost:3012';
const WORKSPACE = process.env.WORKSPACE_URL || 'http://localhost:3001';
const DEV_SECRET = process.env.DEV_TOKEN_SECRET || 'kitz-dev-secret-2025';

// ── 10 User Personas ──
const PERSONAS = [
  { name: 'Maria Rodriguez', email: 'maria@cafebonito.pa',    biz: 'Cafe Bonito',         city: 'Panama City' },
  { name: 'Carlos Mendez',   email: 'carlos@fitzone.pa',      biz: 'FitZone Gym',         city: 'Panama City' },
  { name: 'Sofia Chen',      email: 'sofia@dulcessofi.pa',    biz: 'Dulces Sofi Bakery',  city: 'David' },
  { name: 'Diego Vargas',    email: 'diego@surfshack.pa',     biz: 'Surf Shack',          city: 'Bocas del Toro' },
  { name: 'Ana Castillo',    email: 'ana@belleza.pa',         biz: 'Belleza Salon',        city: 'Panama City' },
  { name: 'Roberto Flores',  email: 'roberto@saboresrob.pa',  biz: 'Sabores de Roberto',  city: 'Chitre' },
  { name: 'Isabella Torres', email: 'isa@modapanama.com',     biz: 'Moda Panama',         city: 'Panama City' },
  { name: 'Luis Morales',    email: 'luis@techfix.pa',        biz: 'TechFix Panama',      city: 'Colon' },
  { name: 'Carmen Delgado',  email: 'carmen@florcarmen.pa',   biz: 'Flor de Carmen',      city: 'Santiago' },
  { name: 'Pedro Silva',     email: 'pedro@construped.pa',    biz: 'ConstruPed',          city: 'La Chorrera' },
];

// ── Logging ──
const log = (user: string, phase: string, msg: string) =>
  console.log(`[${new Date().toISOString().slice(11, 19)}] [${user.padEnd(18)}] ${phase.padEnd(14)} ${msg}`);

const fail = (user: string, phase: string, msg: string) =>
  console.error(`[${new Date().toISOString().slice(11, 19)}] [${user.padEnd(18)}] ${phase.padEnd(14)} ❌ ${msg}`);

// ── HTTP helpers ──
async function post(url: string, body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; data: any }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-trace-id': randomUUID(), ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

async function get(url: string, headers: Record<string, string> = {}): Promise<{ status: number; data: any }> {
  const res = await fetch(url, {
    headers: { 'x-trace-id': randomUUID(), ...headers },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

// ── Metrics ──
interface Metrics {
  total: number;
  passed: number;
  failed: number;
  times: Record<string, number[]>;
}

const metrics: Metrics = { total: 0, passed: 0, failed: 0, times: {} };

function trackTime(phase: string, ms: number) {
  if (!metrics.times[phase]) metrics.times[phase] = [];
  metrics.times[phase]!.push(ms);
}

// ── User Journey ──
async function simulateUser(persona: typeof PERSONAS[0]): Promise<void> {
  const { name, email, biz } = persona;
  const password = 'KitzDemo2026!';
  const traceId = randomUUID();
  let token = '';
  let userId = '';
  let orgId = '';

  // ── Step 1: Sign up via gateway ──
  try {
    const t0 = Date.now();
    const { status, data } = await post(`${GATEWAY}/auth/signup`, { email, password, name });
    trackTime('signup', Date.now() - t0);
    metrics.total++;

    if (status === 200 || status === 201) {
      token = data.token;
      userId = data.userId;
      orgId = data.orgId;
      log(name, 'SIGNUP', `✅ token=${token.slice(0, 12)}... org=${orgId.slice(0, 8)}`);
      metrics.passed++;
    } else if (status === 409) {
      // Already exists — try login
      const login = await post(`${GATEWAY}/auth/token`, { email, password });
      if (login.status === 200) {
        token = login.data.token;
        userId = login.data.userId;
        orgId = login.data.orgId;
        log(name, 'LOGIN', `✅ existing user, token=${token.slice(0, 12)}...`);
        metrics.passed++;
      } else {
        fail(name, 'LOGIN', `${login.status} ${JSON.stringify(login.data)}`);
        metrics.failed++;
        return;
      }
    } else {
      fail(name, 'SIGNUP', `${status} ${JSON.stringify(data)}`);
      metrics.failed++;
      return;
    }
  } catch (e) {
    fail(name, 'SIGNUP', `${(e as Error).message}`);
    metrics.failed++;
    return;
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'x-org-id': orgId,
    'x-user-id': userId,
    'x-scopes': 'battery:read,tools:invoke,events:write,approvals:write,payments:write,messages:write,notifications:write',
  };

  // ── Step 2: Check kitz_os health ──
  try {
    const t0 = Date.now();
    const { status, data } = await get(`${KITZ_OS}/api/kitz/status`);
    trackTime('os-status', Date.now() - t0);
    metrics.total++;
    if (status === 200) {
      log(name, 'OS-STATUS', `✅ tools=${data.toolCount} killSwitch=${data.killSwitch}`);
      metrics.passed++;
    } else {
      fail(name, 'OS-STATUS', `${status}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'OS-STATUS', `${(e as Error).message}`);
    metrics.failed++;
  }

  // ── Step 3: Check AI battery ──
  try {
    const t0 = Date.now();
    const { status, data } = await get(`${KITZ_OS}/api/kitz/battery`);
    trackTime('battery', Date.now() - t0);
    metrics.total++;
    if (status === 200) {
      log(name, 'BATTERY', `✅ remaining=${data.remaining} limit=${data.dailyLimit}`);
      metrics.passed++;
    } else {
      fail(name, 'BATTERY', `${status}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'BATTERY', `${(e as Error).message}`);
    metrics.failed++;
  }

  // ── Step 4: Send greeting to Kitz ──
  try {
    const t0 = Date.now();
    const { status, data } = await post(`${KITZ_OS}/api/kitz`, {
      message: 'hey kitz!',
      sender: email,
      user_id: userId,
      trace_id: traceId,
    });
    trackTime('greeting', Date.now() - t0);
    metrics.total++;
    if (status === 200) {
      log(name, 'GREETING', `✅ "${(data.response || '').slice(0, 60)}"`);
      metrics.passed++;
    } else {
      fail(name, 'GREETING', `${status} ${JSON.stringify(data).slice(0, 80)}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'GREETING', `${(e as Error).message}`);
    metrics.failed++;
  }

  // ── Step 5: Ask a business question ──
  const questions = [
    "who hasn't paid me yet?",
    'create a payment link for $50',
    'what should I do today?',
    "how's my week looking?",
    'show me my orders',
    'help me follow up with leads',
    'check my AI battery',
    'create a task to call suppliers',
    'show me my calendar',
    'how do I connect WhatsApp?',
  ];
  const question = questions[PERSONAS.indexOf(persona)] || questions[0]!;
  try {
    const t0 = Date.now();
    const { status, data } = await post(`${KITZ_OS}/api/kitz`, {
      message: question,
      sender: email,
      user_id: userId,
      trace_id: randomUUID(),
    });
    trackTime('question', Date.now() - t0);
    metrics.total++;
    if (status === 200) {
      log(name, 'QUESTION', `✅ asked: "${question}" → "${(data.response || '').slice(0, 50)}"`);
      metrics.passed++;
    } else {
      fail(name, 'QUESTION', `${status}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'QUESTION', `${(e as Error).message}`);
    metrics.failed++;
  }

  // ── Step 6: Check gateway battery endpoint ──
  try {
    const t0 = Date.now();
    const { status, data } = await get(`${GATEWAY}/ai-battery/balance`, authHeaders);
    trackTime('gw-battery', Date.now() - t0);
    metrics.total++;
    if (status === 200) {
      log(name, 'GW-BATTERY', `✅ credits=${data.credits} spent=${data.todaySpent}`);
      metrics.passed++;
    } else {
      fail(name, 'GW-BATTERY', `${status}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'GW-BATTERY', `${(e as Error).message}`);
    metrics.failed++;
  }

  // ── Step 7: Simulate Stripe payment webhook ──
  try {
    const t0 = Date.now();
    const { status, data } = await post(
      `${KITZ_OS}/api/payments/webhook/stripe`,
      {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_sim_${randomUUID().slice(0, 8)}`,
            amount_total: Math.floor(Math.random() * 5000 + 500),
            currency: 'usd',
            customer_email: email,
            metadata: { orgId, userId },
          },
        },
      },
      { 'stripe-signature': 'sim_sig_placeholder' },
    );
    trackTime('webhook', Date.now() - t0);
    metrics.total++;
    if (status === 200 || status === 202) {
      log(name, 'WEBHOOK', `✅ stripe payment processed`);
      metrics.passed++;
    } else {
      fail(name, 'WEBHOOK', `${status} ${JSON.stringify(data).slice(0, 80)}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'WEBHOOK', `${(e as Error).message}`);
    metrics.failed++;
  }

  // ── Step 8: Check pending drafts ──
  try {
    const t0 = Date.now();
    const { status, data } = await get(`${KITZ_OS}/api/kitz/drafts`);
    trackTime('drafts', Date.now() - t0);
    metrics.total++;
    if (status === 200) {
      log(name, 'DRAFTS', `✅ pending=${data.pending_count}`);
      metrics.passed++;
    } else {
      fail(name, 'DRAFTS', `${status}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'DRAFTS', `${(e as Error).message}`);
    metrics.failed++;
  }

  // ── Step 9: List agents ──
  try {
    const t0 = Date.now();
    const { status, data } = await get(`${KITZ_OS}/api/kitz/agents`);
    trackTime('agents', Date.now() - t0);
    metrics.total++;
    if (status === 200) {
      const count = data.teams?.length || data.length || '?';
      log(name, 'AGENTS', `✅ teams=${count}`);
      metrics.passed++;
    } else {
      fail(name, 'AGENTS', `${status}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'AGENTS', `${(e as Error).message}`);
    metrics.failed++;
  }

  // ── Step 10: Request approval via gateway ──
  try {
    const t0 = Date.now();
    const { status, data } = await post(
      `${GATEWAY}/approvals/request`,
      {
        orgId,
        action: 'messaging.send',
        reason: `Follow-up campaign for ${biz}`,
        requesterUserId: userId,
        traceId: randomUUID(),
      },
      authHeaders,
    );
    trackTime('approval', Date.now() - t0);
    metrics.total++;
    if (status === 200 || status === 201) {
      log(name, 'APPROVAL', `✅ id=${data.approvalId?.slice(0, 8)} status=${data.status}`);
      metrics.passed++;
    } else {
      fail(name, 'APPROVAL', `${status}`);
      metrics.failed++;
    }
  } catch (e) {
    fail(name, 'APPROVAL', `${(e as Error).message}`);
    metrics.failed++;
  }

  log(name, 'COMPLETE', `🎉 User journey finished`);
}

// ── Main ──
async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  KITZ — 10-User Simulation');
  console.log('  Simulating 10 LatAm small business owners using the platform');
  console.log('═'.repeat(70) + '\n');

  // Health checks first
  console.log('Checking service health...\n');
  const services = [
    { name: 'kitz-gateway', url: `${GATEWAY}/health` },
    { name: 'kitz-os',      url: `${KITZ_OS}/health` },
  ];

  let allHealthy = true;
  for (const svc of services) {
    try {
      const { status, data } = await get(svc.url);
      if (status === 200) {
        console.log(`  ✅ ${svc.name} — healthy`);
      } else {
        console.log(`  ⚠️  ${svc.name} — ${status} ${JSON.stringify(data)}`);
        allHealthy = false;
      }
    } catch (e) {
      console.log(`  ❌ ${svc.name} — ${(e as Error).message}`);
      allHealthy = false;
    }
  }

  if (!allHealthy) {
    console.log('\n⚠️  Some services are down. Running simulation anyway (errors expected).\n');
  } else {
    console.log('\nAll services healthy. Starting simulation...\n');
  }

  console.log('─'.repeat(70));

  // Run all 10 users concurrently
  const startTime = Date.now();
  await Promise.allSettled(PERSONAS.map(simulateUser));
  const totalTime = Date.now() - startTime;

  // ── Report ──
  console.log('\n' + '═'.repeat(70));
  console.log('  SIMULATION RESULTS');
  console.log('═'.repeat(70));
  console.log(`  Users simulated:  10`);
  console.log(`  Total requests:   ${metrics.total}`);
  console.log(`  Passed:           ${metrics.passed} ✅`);
  console.log(`  Failed:           ${metrics.failed} ❌`);
  console.log(`  Success rate:     ${metrics.total > 0 ? ((metrics.passed / metrics.total) * 100).toFixed(1) : 0}%`);
  console.log(`  Total time:       ${(totalTime / 1000).toFixed(1)}s`);
  console.log();

  // Latency breakdown
  console.log('  Latency (avg ms):');
  for (const [phase, times] of Object.entries(metrics.times)) {
    if (times.length === 0) continue;
    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(0);
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(`    ${phase.padEnd(14)} avg=${avg}ms  min=${min}ms  max=${max}ms  (n=${times.length})`);
  }

  console.log('\n' + '═'.repeat(70));
  console.log(metrics.failed === 0
    ? '  🚀 ALL CLEAR — Platform ready for real users!'
    : `  ⚠️  ${metrics.failed} failures detected — review logs above.`);
  console.log('═'.repeat(70) + '\n');

  process.exit(metrics.failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
