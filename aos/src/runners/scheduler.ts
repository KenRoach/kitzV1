import { DailyOpsWorkflow, WeeklyBoardPacketWorkflow } from './workflows.js';
import type { EventBus } from '../eventBus.js';
import { dispatchToAgent, listAgents } from '../runtime/taskDispatcher.js';
import { randomUUID } from 'node:crypto';

export async function runScheduled(eventBus: EventBus, cadence: 'daily' | 'weekly-board'): Promise<void> {
  if (cadence === 'daily') return DailyOpsWorkflow(eventBus);
  return WeeklyBoardPacketWorkflow(eventBus);
}

/**
 * Run daily agent tasks via the runtime.
 * Dispatches tasks to CEO, COO, and CRO for daily operations.
 */
export async function runDailyAgentTasks(): Promise<Record<string, unknown>> {
  const traceId = randomUUID();
  const results: Record<string, unknown> = { traceId, cadence: 'daily', startedAt: new Date().toISOString() };

  const agents = listAgents().filter((a) => a.online);
  results.agentsOnline = agents.length;

  // CEO: strategic priorities
  const ceoResult = await dispatchToAgent('CEO', 'Daily check: Review system status, identify top priorities for today, flag any blockers.', traceId);
  results.ceo = { response: ceoResult.response.slice(0, 300), iterations: ceoResult.iterations };

  // COO: operations review
  const cooResult = await dispatchToAgent('COO', 'Daily ops: Check order pipeline, identify aging orders or SLA risks, recommend actions.', traceId);
  results.coo = { response: cooResult.response.slice(0, 300), iterations: cooResult.iterations };

  // CRO: sales pipeline
  const croResult = await dispatchToAgent('CRO', 'Daily sales: Review lead pipeline, identify warm leads for follow-up, draft outreach.', traceId);
  results.cro = { response: croResult.response.slice(0, 300), iterations: croResult.iterations };

  results.completedAt = new Date().toISOString();
  return results;
}

/**
 * Run weekly board briefing via the runtime.
 * Dispatches tasks to CFO, CMO, and CEO for weekly report.
 */
export async function runWeeklyBoardBriefing(): Promise<Record<string, unknown>> {
  const traceId = randomUUID();
  const results: Record<string, unknown> = { traceId, cadence: 'weekly', startedAt: new Date().toISOString() };

  // CFO: financial review
  const cfoResult = await dispatchToAgent('CFO', 'Weekly financial review: Analyze revenue trajectory, AI Battery usage, cost discipline, and ROI outlook.', traceId);
  results.cfo = { response: cfoResult.response.slice(0, 300), iterations: cfoResult.iterations };

  // CMO: marketing/growth review
  const cmoResult = await dispatchToAgent('CMO', 'Weekly marketing review: Campaign performance, content pipeline, growth metrics, invite campaign status.', traceId);
  results.cmo = { response: cmoResult.response.slice(0, 300), iterations: cmoResult.iterations };

  // CEO: strategic synthesis
  const ceoResult = await dispatchToAgent('CEO', 'Weekly synthesis: Combine financial and marketing reports. Identify strategic priorities for next week. Flag any decisions needed.', traceId);
  results.ceo = { response: ceoResult.response.slice(0, 300), iterations: ceoResult.iterations };

  results.completedAt = new Date().toISOString();
  return results;
}
