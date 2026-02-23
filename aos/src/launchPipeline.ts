/**
 * Launch Pipeline — Orchestrates the full org review for launch readiness.
 *
 * Flow:
 *   1. Build LaunchContext from system state
 *   2. C-suite agents review (12 agents)
 *   3. Board agents review (9 agents — advisory)
 *   4. Governance agents review (9 agents — policy enforcement)
 *   5. External councils review (3 agents — advisory)
 *   6. CEO collects all reviews → makes FINAL DECISION
 *   7. Emit LAUNCH_APPROVED or LAUNCH_BLOCKED event
 *
 * All 33 agents participate. CEO has final authority.
 */

import type { EventBus } from './eventBus.js';
import type { MemoryStore } from './memory/memoryStore.js';
import type { AgentToolBridge } from './toolBridge.js';
import type { LaunchContext, LaunchDecision, LaunchReview } from './types.js';

// C-Suite
import { CEOAgent } from './agents/core/CEO.js';
import { CFOAgent } from './agents/core/CFO.js';
import { CMOAgent } from './agents/core/CMO.js';
import { COOAgent } from './agents/core/COO.js';
import { CPOAgent } from './agents/core/CPO.js';
import { CROAgent } from './agents/core/CRO.js';
import { CTOAgent } from './agents/core/CTO.js';
import { HeadCustomerAgent } from './agents/core/HeadCustomer.js';
import { HeadEducationAgent } from './agents/core/HeadEducation.js';
import { HeadEngineeringAgent } from './agents/core/HeadEngineering.js';
import { HeadGrowthAgent } from './agents/core/HeadGrowth.js';
import { HeadIntelligenceRiskAgent } from './agents/core/HeadIntelligenceRisk.js';

// Board
import { chairAgent } from './agents/board/chair.js';
import { conservativeRiskAgent } from './agents/board/conservativeRisk.js';
import { customerVoiceAgent } from './agents/board/customerVoice.js';
import { efficiencyStrategistCNAgent } from './agents/board/efficiencyStrategistCN.js';
import { ethicsTrustGuardianAgent } from './agents/board/ethicsTrustGuardian.js';
import { founderAdvocateAgent } from './agents/board/founderAdvocate.js';
import { growthVisionaryAgent } from './agents/board/growthVisionary.js';
import { operationalRealistAgent } from './agents/board/operationalRealist.js';
import { techFuturistAgent } from './agents/board/techFuturist.js';

// Governance
import { CapitalAllocationAgent } from './agents/governance/CapitalAllocation.js';
import { FeedbackCoachAgent } from './agents/governance/FeedbackCoach.js';
import { FocusCapacityAgent } from './agents/governance/FocusCapacity.js';
import { ImpactStrategyAgent } from './agents/governance/ImpactStrategy.js';
import { IncentiveAlignmentAgent } from './agents/governance/IncentiveAlignment.js';
import { InstitutionalMemoryAgent } from './agents/governance/InstitutionalMemory.js';
import { NetworkingBotAgent } from './agents/governance/NetworkingBot.js';
import { ParallelSolutionsAgent } from './agents/governance/ParallelSolutions.js';
import { ReviewerAgent } from './agents/governance/Reviewer.js';

// External
import { councilCNAgent } from './agents/external/councilCN.js';
import { councilUS_AAgent } from './agents/external/councilUS_A.js';
import { councilUS_BAgent } from './agents/external/councilUS_B.js';

export interface LaunchPipelineResult {
  decision: LaunchDecision;
  reviewsByTier: {
    cSuite: LaunchReview[];
    board: LaunchReview[];
    governance: LaunchReview[];
    external: LaunchReview[];
  };
  context: LaunchContext;
}

export async function runLaunchPipeline(
  ctx: LaunchContext,
  bus: EventBus,
  memory: MemoryStore,
  toolBridge?: AgentToolBridge,
): Promise<LaunchPipelineResult> {

  // Announce launch review
  await bus.publish({
    type: 'LAUNCH_REVIEW_REQUESTED',
    source: 'LaunchPipeline',
    severity: 'critical',
    payload: { campaign: 'first-10-users', timestamp: new Date().toISOString() },
  });

  // ── Instantiate all agents ──

  // C-Suite (CEO created separately — he decides last)
  const ceo = new CEOAgent('CEO', bus, memory);
  if (toolBridge) ceo.setToolBridge(toolBridge);
  const cSuiteAgents = [
    new CFOAgent('CFO', bus, memory),
    new CMOAgent('CMO', bus, memory),
    new COOAgent('COO', bus, memory),
    new CPOAgent('CPO', bus, memory),
    new CROAgent('CRO', bus, memory),
    new CTOAgent('CTO', bus, memory),
    new HeadCustomerAgent('HeadCustomer', bus, memory),
    new HeadEducationAgent('HeadEducation', bus, memory),
    new HeadEngineeringAgent('HeadEngineering', bus, memory),
    new HeadGrowthAgent('HeadGrowth', bus, memory),
    new HeadIntelligenceRiskAgent('HeadIntelligenceRisk', bus, memory),
  ];

  const boardAgents = [
    new chairAgent('Chair', bus, memory),
    new conservativeRiskAgent('ConservativeRisk', bus, memory),
    new customerVoiceAgent('CustomerVoice', bus, memory),
    new efficiencyStrategistCNAgent('EfficiencyStrategistCN', bus, memory),
    new ethicsTrustGuardianAgent('EthicsTrustGuardian', bus, memory),
    new founderAdvocateAgent('FounderAdvocate', bus, memory),
    new growthVisionaryAgent('GrowthVisionary', bus, memory),
    new operationalRealistAgent('OperationalRealist', bus, memory),
    new techFuturistAgent('TechFuturist', bus, memory),
  ];

  const governanceAgents = [
    new CapitalAllocationAgent('CapitalAllocation', bus, memory),
    new FeedbackCoachAgent('FeedbackCoach', bus, memory),
    new FocusCapacityAgent('FocusCapacity', bus, memory),
    new ImpactStrategyAgent('ImpactStrategy', bus, memory),
    new IncentiveAlignmentAgent('IncentiveAlignment', bus, memory),
    new InstitutionalMemoryAgent('InstitutionalMemory', bus, memory),
    new NetworkingBotAgent('NetworkingBot', bus, memory),
    new ParallelSolutionsAgent('ParallelSolutions', bus, memory),
    new ReviewerAgent('Reviewer', bus, memory),
  ];

  const externalAgents = [
    new councilCNAgent('CouncilCN', bus, memory),
    new councilUS_AAgent('CouncilUS_A', bus, memory),
    new councilUS_BAgent('CouncilUS_B', bus, memory),
  ];

  // ── Attach tool bridge to all agents ──
  if (toolBridge) {
    const allAgents = [...cSuiteAgents, ...boardAgents, ...governanceAgents, ...externalAgents];
    for (const agent of allAgents) {
      agent.setToolBridge(toolBridge);
    }
  }

  // ── Collect reviews from all tiers ──

  const cSuiteReviews = cSuiteAgents.map(a => a.reviewLaunchReadiness(ctx));
  const boardReviews = boardAgents.map(a => a.reviewLaunchReadiness(ctx));
  const governanceReviews = governanceAgents.map(a => a.reviewLaunchReadiness(ctx));
  const externalReviews = externalAgents.map(a => a.reviewLaunchReadiness(ctx));

  const allReviews = [...cSuiteReviews, ...boardReviews, ...governanceReviews, ...externalReviews];

  // Log each review as an event
  for (const review of allReviews) {
    await bus.publish({
      type: 'LAUNCH_REVIEW_SUBMITTED',
      source: review.agent,
      severity: review.vote === 'no-go' ? 'critical' : 'low',
      payload: { vote: review.vote, confidence: review.confidence, summary: review.summary },
    });
  }

  // ── CEO makes the FINAL DECISION ──
  const decision = ceo.makeLaunchDecision(ctx, allReviews);

  // Emit final event
  await bus.publish({
    type: decision.approved ? 'LAUNCH_APPROVED' : 'LAUNCH_BLOCKED',
    source: 'CEO',
    severity: 'critical',
    payload: {
      approved: decision.approved,
      totalGo: decision.totalGo,
      totalNoGo: decision.totalNoGo,
      totalConditional: decision.totalConditional,
      blockers: decision.blockers,
      summary: decision.summary,
    },
  });

  return {
    decision,
    reviewsByTier: {
      cSuite: cSuiteReviews,
      board: boardReviews,
      governance: governanceReviews,
      external: externalReviews,
    },
    context: ctx,
  };
}
