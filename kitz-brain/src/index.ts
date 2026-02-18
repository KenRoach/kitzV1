
import cron from 'node-cron';
import { randomUUID } from 'node:crypto';
import { salesAgent } from './agents/sales.js';
import { opsAgent } from './agents/ops.js';
import { cfoAgent } from './agents/cfo.js';
import { toolRegistry } from './tools/registry.js';
import { llmHubClient } from './llm/hubClient.js';

export const health = { status: 'ok' };
const logRun = (agent: string, traceId: string, detail: string) => console.log(JSON.stringify({ ts: new Date().toISOString(), agent, traceId, detail }));

async function runDaily() {
  const traceId = randomUUID();
  logRun('Sales', traceId, salesAgent.run());
  await toolRegistry.invoke('crm.getLeadsSummary', { window: '1d' }, traceId);
  await llmHubClient.complete('summarizing', 'Summarize today leads', traceId);
}

async function runWeekly() {
  const traceId = randomUUID();
  logRun('Ops', traceId, opsAgent.run());
  logRun('CFO', traceId, cfoAgent.run());
  await toolRegistry.invoke('approvals.request', { action: 'weekly-campaign-send' }, traceId);
}

cron.schedule('0 8 * * *', runDaily);
cron.schedule('0 9 * * 1', runWeekly);
console.log('kitz-brain scheduler started');
