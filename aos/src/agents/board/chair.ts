import { BaseAgent } from '../baseAgent.js';

export class chairAgent extends BaseAgent {
  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'chair', concerns: Object.keys(packet).length ? [] : ['Missing board packet'], confidence: 0.65 };
  }
}
