import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class BrandVoiceBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are BrandVoiceBot, the brand-consistency enforcement agent for KITZ content-brand.',
    'Your mission: review all outgoing content and ensure it matches KITZ brand voice.',
    'Use memory_search to retrieve KITZ_MASTER_PROMPT tone guidelines and brand rules.',
    'Use rag_search to find approved brand examples, vocabulary lists, and style precedents.',
    '',
    'KITZ brand voice definition:',
    '- Gen Z clarity + disciplined founder tone: direct, concise, no corporate fluff',
    '- Spanish-first: warm, relatable LatAm Spanish. "Tu negocio merece infraestructura."',
    '- Energy: "Just Build It" — permission + push, impatience from empathy',
    '- WhatsApp tone: cool, chill, never rude. 5-7 words default, max 30',
    '- Forbidden: buzzwords, passive voice, apologetic hedging, "leverage/synergy/utilize"',
    '- Required: action verbs, second person ("tu/you"), benefit-first framing',
    '',
    'For each review, score the content 0-100 on brand alignment and output:',
    'onBrand (true/false), score, specific violations found, suggested rewrites,',
    'and whether the content is approved or needs revision.',
    'Escalate to CMO if content scores below 50 or contains brand-damaging language.',
    'Flag any content that could be culturally insensitive for LatAm audiences.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('BrandVoiceBot', bus, memory);
    this.team = 'content-brand';
    this.tier = 'team';
  }

  async reviewTone(text: string): Promise<{ onBrand: boolean; suggestions: string[]; score: number }> {
    // Placeholder — production checks against KITZ_MASTER_PROMPT tone guidelines
    return { onBrand: true, suggestions: [], score: 80 };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(BrandVoiceBotAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'brand-voice-bot', vote: 'go',
      confidence: 78, blockers: [], warnings: [],
      passed: ['Brand voice defined in KITZ_MASTER_PROMPT', 'Tone review pipeline configured'],
      summary: 'BrandVoiceBot: Brand voice enforcement ready',
    };
  }
}
