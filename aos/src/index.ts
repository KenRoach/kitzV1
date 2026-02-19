import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EventBus } from './eventBus.js';
import { MemoryStore } from './memory/memoryStore.js';
import { AgentRegistry } from './registry.js';
import { enforceApprovals } from './policies/approvals.js';
import { enforcePermissions } from './policies/permissions.js';
import { ReviewerAgent } from './agents/governance/Reviewer.js';
import { FeedbackCoachAgent } from './agents/governance/FeedbackCoach.js';

export interface AOSRuntime {
  bus: EventBus;
  memory: MemoryStore;
  registry: AgentRegistry;
}

export function createAOS(baseDir = resolve(process.cwd())): AOSRuntime {
  const memory = new MemoryStore(resolve(baseDir, 'data'));
  const bus = new EventBus(memory);
  const registry = new AgentRegistry();

  const agents = JSON.parse(readFileSync(resolve(baseDir, 'config/agents.json'), 'utf-8')) as Array<Record<string, unknown>>;
  agents.forEach((agent) => registry.register(agent as any));

  bus.use(enforcePermissions);
  bus.use(enforceApprovals);

  const reviewer = new ReviewerAgent('Reviewer', bus, memory);
  const feedbackCoach = new FeedbackCoachAgent('FeedbackCoach', bus, memory);

  bus.subscribe('PR_READY_FOR_REVIEW', async (event) => {
    const review = reviewer.review(event);
    memory.logDecision('review', ['APPROVE', 'REQUEST_CHANGES', 'REJECT'], review.decision, JSON.stringify(review.checklist));
    if (review.decision !== 'APPROVE') {
      await bus.publish({ type: 'REVIEW_REJECTED', source: 'Reviewer', severity: 'medium', payload: review });
    }
  });

  bus.subscribe('CUSTOMER_FEEDBACK_RECEIVED', async (event) => {
    const brief = {
      signal: event.payload.feedback ?? 'Feedback received',
      evidence: event.payload,
      learning: 'Use evidence, remove blame.',
      nextStep: 'Run one improvement experiment this week.',
      owner: 'HeadCustomer',
      expectedKpiLift: '+2% conversion'
    };
    feedbackCoach.logProposal(String(event.id), brief);
  });

  return { bus, memory, registry };
}
