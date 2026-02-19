import { BaseAgent } from '../baseAgent.js';

export class conservativeRiskAgent extends BaseAgent {
  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'conservativeRisk', concerns: Object.keys(packet).length ? [] : ['Missing board packet'], confidence: 0.65 };
  }
}
