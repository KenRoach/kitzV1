import { createAdHocProposal, canSpawnAdHoc } from '../policies/adHocRules.js';
import type { EventBus } from '../eventBus.js';
import type { AgentRegistry } from '../registry.js';
import type { MemoryStore } from '../memory/memoryStore.js';

export async function DailyOpsWorkflow(eventBus: EventBus): Promise<void> {
  await eventBus.publish({ type: 'CUSTOMER_FEEDBACK_RECEIVED', source: 'DailyOpsWorkflow', severity: 'medium', payload: { feedback: 'Signup flow unclear', tag: 'Confusion' } });
  await eventBus.publish({ type: 'KPI_CHANGED', source: 'DailyOpsWorkflow', severity: 'medium', payload: { revenueDelta: 2, marginDelta: -1, growthDelta: 3, churnDelta: 1 } });
  await eventBus.publish({ type: 'ORG_DIGEST_READY', source: 'NetworkingBot', severity: 'low', payload: { summary: 'Daily status ping complete' } });
}

export async function WeeklyBoardPacketWorkflow(eventBus: EventBus): Promise<void> {
  const packet = {
    kpiSummary: 'stable',
    riskSummary: 'moderate',
    initiatives: ['funnel-fix', 'latency-improvement'],
    capitalAllocation: { founder: 50, impact: 45, agentUpgrade: 5 }
  };
  await eventBus.publish({ type: 'BOARD_REVIEW_REQUESTED', source: 'WeeklyBoardPacketWorkflow', severity: 'medium', payload: packet });
  await eventBus.publish({ type: 'BOARD_REVIEW_COMPLETE', source: 'DigitalBoard', severity: 'medium', payload: { votes: 9, confidence: 0.74 } });
}

export async function IncidentWorkflow(eventBus: EventBus, registry: AgentRegistry, memory: MemoryStore): Promise<void> {
  const owner = registry.get('CTO') ? 'CTO' : 'HeadEngineering';
  const severity = 'high';
  if (canSpawnAdHoc({ severity })) {
    registry.spawnAdHoc(owner);
    const proposal = createAdHocProposal('incident-mitigation', owner, 12);
    memory.logProposal({ owner, issueId: 'incident-1', proposal, timestamp: new Date().toISOString() });
    await eventBus.publish({ type: 'PROPOSAL_CREATED', source: 'ParallelSolutions', severity: 'high', payload: { owner, proposal } });
  }
  await eventBus.publish({ type: 'PR_READY_FOR_REVIEW', source: owner, severity: 'high', payload: { action: 'merge_pr_recommendation', approvals: ['Reviewer'] } });
}
