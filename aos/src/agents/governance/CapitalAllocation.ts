import { BaseAgent } from '../baseAgent.js';

export class CapitalAllocationAgent extends BaseAgent {
  runCycle(input: { revenue: number; expenses: number; rnd: number; runwayMonths: number; marginPercent: number }): Record<string, unknown> {
    const distributable = Math.max(0, input.revenue - input.expenses - input.rnd);
    let founder = distributable * 0.5;
    let impact = distributable * 0.45;
    let agentUpgrade = distributable * 0.05;

    const guardrailTriggered = input.runwayMonths < 6 || input.marginPercent < 20;
    if (guardrailTriggered) {
      founder *= 0.5;
      impact *= 0.5;
      agentUpgrade *= 0.5;
    }

    return { distributable, founder, impact, agentUpgrade, guardrailTriggered };
  }
}
