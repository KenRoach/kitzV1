import cron from 'node-cron';
import { randomUUID } from 'node:crypto';
import { salesAgent } from './agents/sales.js';
import { opsAgent } from './agents/ops.js';
import { cfoAgent } from './agents/cfo.js';
import { approvalRequiredActions, toolRegistry } from './tools/registry.js';
import { llmHubClient } from './llm/hubClient.js';
import { assertReceiveOnlyAction, financePolicy } from './policy.js';

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
    cfo: cfoAgent.run()
  });

  await toolRegistry.invoke('orders.getOpenOrders', { includeAging: true }, traceId);
  assertReceiveOnlyAction('create_checkout_link');
  await toolRegistry.invoke('payments.createCheckoutLink', { orderId: 'weekly-batch', amount: 19900, currency: 'USD', direction: 'incoming' }, traceId);

  const response = await llmHubClient.complete('drafting', 'Draft weekly revenue and operations briefing', traceId);
  logRun('weekly.complete', traceId, response);
}

cron.schedule('0 8 * * *', runDaily);
cron.schedule('0 9 * * 1', runWeekly);

console.log('kitz-brain scheduler started', financePolicy);
