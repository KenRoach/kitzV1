import cron from 'node-cron';
import { randomUUID } from 'node:crypto';
import { salesAgent } from './agents/sales.js';
import { opsAgent } from './agents/ops.js';
import { cfoAgent } from './agents/cfo.js';
import { approvalRequiredActions, toolRegistry } from './tools/registry.js';
import { llmHubClient } from './llm/hubClient.js';
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

async function runDaily(): Promise<void> {
  const traceId = randomUUID();
  logRun('daily.start', traceId, { agent: salesAgent.name });

  const salesReport = await salesAgent.run(traceId);
  logRun('daily.sales', traceId, salesReport);

  await enforcePolicy('messaging.send', traceId);
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
