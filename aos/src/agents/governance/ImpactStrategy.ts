import { BaseAgent } from '../baseAgent.js';

export class ImpactStrategyAgent extends BaseAgent {
  prioritize(projects: Array<{ id: string; impactScore: number; cost: number }>): Array<{ id: string; impactScore: number; cost: number }> {
    return [...projects].sort((a, b) => b.impactScore / Math.max(1, b.cost) - a.impactScore / Math.max(1, a.cost));
  }
}
