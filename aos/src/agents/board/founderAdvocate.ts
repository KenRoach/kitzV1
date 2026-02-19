import { BaseAgent } from '../baseAgent.js';

export class founderAdvocateAgent extends BaseAgent {
  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'founderAdvocate', concerns: Object.keys(packet).length ? [] : ['Missing board packet'], confidence: 0.65 };
  }
}
