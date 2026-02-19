import { BaseAgent } from '../baseAgent.js';

export class customerVoiceAgent extends BaseAgent {
  vote(packet: Record<string, unknown>): Record<string, unknown> {
    return { member: 'customerVoice', concerns: Object.keys(packet).length ? [] : ['Missing board packet'], confidence: 0.65 };
  }
}
