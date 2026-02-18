import cron from 'node-cron';
import { randomUUID } from 'node:crypto';
import { salesAgent } from './agents/sales.js';
import { opsAgent } from './agents/ops.js';
import { cfoAgent } from './agents/cfo.js';
import { toolRegistry, type ToolName } from './tools/registry.js';
import { llmHubClient } from './llm/hubClient.js';
import { requestApproval, waitForApproval } from './approvals/client.js';

export const health = { status: 'ok' };
const logRun = (agent: string, traceId: string, detail: string) => console.log(JSON.stringify({ ts: new Date().toISOString(), agent, traceId, detail }));

const defaultOrgId = process.env.KITZ_ORG_ID || 'org-demo';
const automationUserId = process.env.KITZ_AUTOMATION_USER_ID || 'agent-system';

export async function executeToolWithApproval(name: ToolName, payload: unknown, traceId: string) {
  if (toolRegistry.isHighRisk(name)) {
    const approval = await requestApproval({
      orgId: defaultOrgId,
      userId: automationUserId,
      toolName: name,
      action: `execute:${name}`,
      reason: 'High-risk action requested by brain orchestrator',
      traceId
    });

    await waitForApproval(approval.approvalId, defaultOrgId, traceId);
    return await toolRegistry.invoke(name, { ...(payload as Record<string, unknown>), approvalId: approval.approvalId }, traceId);
  }

  return await toolRegistry.invoke(name, payload, traceId);
}

async function runDaily() {
  const traceId = randomUUID();
  logRun('Sales', traceId, salesAgent.run());
  await executeToolWithApproval('crm.getLeadsSummary', { window: '1d' }, traceId);
  await llmHubClient.complete('summarizing', 'Summarize today leads', traceId);
}

async function runWeekly() {
  const traceId = randomUUID();
  logRun('Ops', traceId, opsAgent.run());
  logRun('CFO', traceId, cfoAgent.run());
  await executeToolWithApproval('messaging.send', { campaignId: 'weekly-campaign' }, traceId);
}

cron.schedule('0 8 * * *', runDaily);
cron.schedule('0 9 * * 1', runWeekly);
console.log('kitz-brain scheduler started');
