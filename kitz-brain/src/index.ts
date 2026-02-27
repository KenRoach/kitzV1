import cron from 'node-cron';
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { salesAgent } from './agents/sales.js';
import { opsAgent } from './agents/ops.js';
import { cfoAgent } from './agents/cfo.js';
import { approvalRequiredActions, toolRegistry } from './tools/registry.js';
import { llmHubClient } from './llm/hubClient.js';
import { classify, type ClassifyRequest, type BrainDecision } from './classifier.js';
import {
  assertReceiveOnlyAction,
  buildRoiPlan,
  financePolicy,
  growthExecutionPolicy,
  shouldRequestFunds
} from './policy.js';

export const health = { status: 'ok' };

const logRun = (phase: string, traceId: string, details: unknown) => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), phase, traceId, details }));
};

const enforcePolicy = async (action: string, traceId: string): Promise<void> => {
  if (!approvalRequiredActions.includes(action)) return;
  await toolRegistry.invoke('approvals.request', {
    action,
    reason: 'Default draft-first policy',
    requesterUserId: 'brain-system'
  }, traceId);
};

/** Post a brain task to kitz_os orchestrator for draft-first multi-channel delivery */
async function createBrainTask(message: string, channel: 'whatsapp' | 'email' | 'web', traceId: string): Promise<void> {
  const kitzOsUrl = process.env.KITZ_OS_URL || 'http://kitz-os:3012';
  try {
    const res = await fetch(`${kitzOsUrl}/api/kitz/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-trace-id': traceId,
        'x-dev-secret': process.env.DEV_TOKEN_SECRET || '',
      },
      body: JSON.stringify({
        message,
        channel,
        user_id: 'brain-system',
        org_id: process.env.DEFAULT_ORG_ID || '',
        phone: process.env.CADENCE_PHONE || '',
        email: process.env.CADENCE_EMAIL || '',
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      logRun('brain.task.created', traceId, { taskId: data.taskId, channel, status: data.status });
    } else {
      logRun('brain.task.error', traceId, { status: res.status });
    }
  } catch (err) {
    logRun('brain.task.error', traceId, { error: (err as Error).message });
  }
}

async function runDaily(): Promise<void> {
  const traceId = randomUUID();
  logRun('daily.start', traceId, { agent: salesAgent.name });

  const salesReport = await salesAgent.run(traceId);
  logRun('daily.sales', traceId, salesReport);

  await enforcePolicy('messaging.send', traceId);

  // Deliver daily report as a brain task (draft-first, multi-channel)
  // WhatsApp gets a quick summary, Email gets the full report
  await createBrainTask(
    `Daily sales brief: ${salesReport.summary}. Warm leads: ${salesReport.warmLeads.join(', ') || 'none'}. Follow-ups drafted: ${salesReport.followUpsDrafted}.`,
    'whatsapp',
    traceId,
  );

  await createBrainTask(
    `Generate a detailed daily business report. Sales data: ${JSON.stringify(salesReport)}. Include: pipeline summary, warm leads to follow up, actions taken, and recommendations for today.`,
    'email',
    traceId,
  );

  logRun('daily.complete', traceId, { summary: salesReport.summary });
}

async function runWeekly(): Promise<void> {
  const traceId = randomUUID();
  logRun('weekly.start', traceId, { growthExecutionPolicy });

  // Run ops and cfo agents
  const opsReport = await opsAgent.run(traceId);
  logRun('weekly.ops', traceId, opsReport);

  const cfoReport = await cfoAgent.run(traceId);
  logRun('weekly.cfo', traceId, cfoReport);

  const roiPlan = buildRoiPlan('weekly-campaign-expansion');
  logRun('weekly.free-validation', traceId, roiPlan.freeValidationSteps);

  if (shouldRequestFunds(roiPlan)) {
    await toolRegistry.invoke('approvals.request', {
      action: 'funding.request',
      reason: `Validated with free options. Projected ROI ${roiPlan.projectedRoiMultiple}x. Request budget $${roiPlan.requestedBudgetUsd}`,
      requesterUserId: 'brain-system'
    }, traceId);

    assertReceiveOnlyAction('create_checkout_link');
    await toolRegistry.invoke('payments.createCheckoutLink', {
      orderId: 'weekly-batch',
      amount: 19900,
      currency: 'USD',
      direction: 'incoming',
      provider: 'stripe'
    }, traceId);
  } else {
    logRun('weekly.funding-blocked', traceId, 'Funding request skipped: validation or ROI threshold not met.');
  }

  // Deliver weekly scorecard via email (detailed) and WhatsApp (summary)
  await createBrainTask(
    `Weekly scorecard: Ops: ${opsReport.summary}. Finance: ${cfoReport.summary}. ROI plan: ${roiPlan.projectedRoiMultiple}x.`,
    'whatsapp',
    traceId,
  );

  await createBrainTask(
    `Generate a comprehensive weekly business scorecard. Operations: ${JSON.stringify(opsReport)}. Finance: ${JSON.stringify(cfoReport)}. Growth plan: ${JSON.stringify(roiPlan)}. Include: KPI trends, wins, blockers, and priorities for next week.`,
    'email',
    traceId,
  );

  logRun('weekly.complete', traceId, { ops: opsReport.summary, cfo: cfoReport.summary });
}

/** Trigger AOS launch review via kitz_os API */
async function triggerLaunchReview(): Promise<void> {
  const traceId = randomUUID();
  const kitzOsUrl = process.env.KITZ_OS_URL || 'http://kitz-os:3012';
  logRun('aos.launch-review.start', traceId, {});
  try {
    const res = await fetch(`${kitzOsUrl}/api/kitz/launch`, {
      headers: { 'x-trace-id': traceId },
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) {
      const data = await res.json() as { approved?: boolean; summary?: string; votes?: unknown };
      logRun('aos.launch-review.complete', traceId, {
        approved: data.approved,
        summary: data.summary,
        votes: data.votes,
      });
    } else {
      logRun('aos.launch-review.error', traceId, { status: res.status });
    }
  } catch (err) {
    logRun('aos.launch-review.error', traceId, { error: (err as Error).message });
  }
}

/** Fetch CTO digest from AOS via kitz_os API */
async function fetchCtoDigest(): Promise<void> {
  const traceId = randomUUID();
  const kitzOsUrl = process.env.KITZ_OS_URL || 'http://kitz-os:3012';
  logRun('aos.cto-digest.start', traceId, {});
  try {
    const res = await fetch(`${kitzOsUrl}/api/kitz/agents/cto/digest`, {
      headers: { 'x-trace-id': traceId },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      logRun('aos.cto-digest.complete', traceId, data);
    }
  } catch (err) {
    logRun('aos.cto-digest.error', traceId, { error: (err as Error).message });
  }
}

/** Trigger AOS swarm simulation via kitz_os API */
async function triggerSwarmRun(): Promise<void> {
  const traceId = randomUUID();
  const kitzOsUrl = process.env.KITZ_OS_URL || 'http://kitz-os:3012';
  logRun('aos.swarm-run.start', traceId, {});
  try {
    const res = await fetch(`${kitzOsUrl}/api/kitz/swarm/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-secret': process.env.DEV_TOKEN_SECRET || '',
        'x-trace-id': traceId,
      },
      body: JSON.stringify({ concurrency: 6, timeoutMs: 60_000 }),
      signal: AbortSignal.timeout(300_000), // 5 min timeout for full swarm
    });
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      logRun('aos.swarm-run.complete', traceId, {
        status: data.status,
        teamsCompleted: data.teamsCompleted,
        knowledgeWritten: data.knowledgeWritten,
        durationMs: data.durationMs,
      });
    } else {
      logRun('aos.swarm-run.error', traceId, { status: res.status });
    }
  } catch (err) {
    logRun('aos.swarm-run.error', traceId, { error: (err as Error).message });
  }
}

cron.schedule('0 8 * * *', runDaily);            // Daily ops: 8am
cron.schedule('0 9 * * 1', runWeekly);           // Weekly briefing: Mon 9am
cron.schedule('0 7 * * *', triggerLaunchReview);  // AOS launch review: 7am daily
cron.schedule('0 */4 * * *', fetchCtoDigest);     // CTO digest: every 4 hours
cron.schedule('0 6 * * *', triggerSwarmRun);      // Swarm run: 6am daily

console.log('kitz-brain scheduler started', { financePolicy, growthExecutionPolicy, aosIntegration: true, swarmEnabled: true });

// ── HTTP Server (real-time classification service) ──
const PORT = Number(process.env.PORT) || 3015;
const server = Fastify({ logger: false });

server.get('/health', async () => ({ status: 'ok', service: 'kitz-brain' }));

server.post<{ Body: ClassifyRequest }>('/decide', async (req, reply) => {
  const { message, channel, userId, traceId, chatHistory, mediaContext } = req.body || {};
  if (!message) return reply.code(400).send({ error: 'message required' });

  const tid = traceId || randomUUID();
  const start = Date.now();

  const decision = await classify({
    message,
    channel: channel || 'whatsapp',
    userId: userId || 'unknown',
    traceId: tid,
    chatHistory,
    mediaContext,
  });

  logRun('classify.complete', tid, {
    strategy: decision.strategy,
    confidence: decision.confidence,
    agents: decision.agents,
    reviewRequired: decision.reviewRequired,
    durationMs: Date.now() - start,
  });

  return decision;
});

server.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  console.log(`kitz-brain HTTP server listening on port ${PORT}`);
}).catch((err) => {
  console.error('kitz-brain HTTP server failed to start:', err);
  process.exit(1);
});
