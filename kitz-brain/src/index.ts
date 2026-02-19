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
  logRun('daily.start', traceId, { agent: salesAgent.name, summary: salesAgent.run() });

  await toolRegistry.invoke('crm.getLeadsSummary', { window: '24h' }, traceId);
  await toolRegistry.invoke('crm.createTask', { title: 'Follow up warm leads', dueDate: 'today' }, traceId);
  await enforcePolicy('messaging.send', traceId);

  const response = await llmHubClient.complete('summarizing', 'Create a daily summary for leads and orders', traceId);
  logRun('daily.complete', traceId, response);
}

async function runWeekly(): Promise<void> {
  const traceId = randomUUID();
  logRun('weekly.start', traceId, {
    ops: opsAgent.run(),
    cfo: cfoAgent.run(),
    growthExecutionPolicy
  });

  await toolRegistry.invoke('orders.getOpenOrders', { includeAging: true }, traceId);

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

  const response = await llmHubClient.complete('drafting', 'Draft weekly revenue and operations briefing', traceId);
  logRun('weekly.complete', traceId, response);
}

cron.schedule('0 8 * * *', runDaily);
cron.schedule('0 9 * * 1', runWeekly);

console.log('kitz-brain scheduler started', { financePolicy, growthExecutionPolicy });
