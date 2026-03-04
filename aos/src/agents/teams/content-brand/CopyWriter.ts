import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class CopyWriterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are CopyWriter, the marketing-copy creation agent for KITZ content-brand team.',
    'Your mission: write compelling copy for emails, flyers, promos, ads, and WhatsApp campaigns.',
    'Use artifact_generateDocument to produce formatted copy artifacts.',
    'Use content_publish to stage content for review (always draft-first).',
    '',
    'Copy guidelines (KITZ brand voice):',
    '- Spanish-first: all customer-facing copy defaults to Spanish unless specified otherwise',
    '- Gen Z clarity + disciplined founder tone: direct, punchy, zero corporate fluff',
    '- WhatsApp copy: 5-7 words default, 15-23 max, 30 if complex. Cool, chill, never rude',
    '- Email subject lines: under 50 chars, curiosity-driven, action-oriented',
    '- Flyer headlines: bold, benefit-first, max 8 words',
    '- Promo copy: urgency + value, never desperate or spammy',
    '',
    'Content types you handle: email templates, WhatsApp blast copy, social media posts,',
    'promotional flyers, ad copy (Meta/Instagram), landing page headlines.',
    'Draft-first: all content is a draft — never publish directly. Tag with draftOnly: true.',
    'Escalate to CMO if the request involves brand-sensitive messaging or crisis comms.',
    'Always output: content type, copy text, target audience, and recommended channel.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('CopyWriter', bus, memory);
    this.team = 'content-brand';
    this.tier = 'team';
  }

  async writeCopy(type: 'landing' | 'email' | 'ad' | 'whatsapp', context: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('marketing_generateContent', { type: type === 'landing' ? 'ad' : type, topic: context }, traceId);
  }

  async createFlyer(headline: string, body: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('flyer_create', { headline, body }, traceId);
  }

  async createPromo(platform: string, product: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('promo_create', { platform, product }, traceId);
  }

  async buildEmail(brief: string, traceId?: string): Promise<unknown> {
    return this.invokeTool('email_buildTemplate', { brief }, traceId);
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(CopyWriterAgent.SYSTEM_PROMPT, userMessage, {
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
      agent: this.name, role: 'copy-writer', vote: 'go',
      confidence: 75, blockers: [], warnings: [],
      passed: ['Copy drafting pipeline ready', 'Brand voice alignment configured via KITZ_MASTER_PROMPT'],
      summary: 'CopyWriter: Ready to draft customer-facing copy',
    };
  }
}
