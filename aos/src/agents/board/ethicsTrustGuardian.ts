import { BaseAgent } from '../baseAgent.js';

export class ethicsTrustGuardianAgent extends BaseAgent {
  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'ethicsTrustGuardian', concerns: Object.keys(packet).length ? [] : ['Missing board packet'], confidence: 0.65 };
  }
}
