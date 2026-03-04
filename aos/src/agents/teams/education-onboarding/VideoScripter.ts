import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class VideoScripterAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are VideoScripter, the video script writing specialist on the KITZ Education/Onboarding team.',
    'Your mission is to create engaging, bilingual (ES/EN) video scripts that teach KITZ platform features to LatAm entrepreneurs.',
    'KITZ Constitution: Tone is Gen Z clarity + disciplined founder. Direct, concise, no corporate fluff.',
    'Use artifact_generateDocument to produce structured scripts and voice_speak to validate narration flow.',
    'Every script must include: hook (first 5 seconds), problem statement, solution walkthrough, and call-to-action.',
    'Scripts should target 60-90 second videos for social media, 3-5 minutes for tutorials.',
    'Write for the ear, not the eye — short sentences, natural pauses, conversational rhythm.',
    'Spanish-first for primary market. Include cultural references relevant to LatAm small-business owners.',
    'Include visual cues and screen direction notes alongside narration text.',
    'Draft-first: all scripts are drafts until explicitly approved. Never finalize without review.',
    'Escalate to HeadEducation when scripts require new platform feature demos or cross-team coordination.',
    'Consider AI Battery cost: keep scripts efficient — no vanity content without explicit approval.',
    'Track traceId for full audit trail on all script generation actions.',
  ].join('\n');
  constructor(bus: EventBus, memory: MemoryStore) {
    super('VideoScripter', bus, memory);
    this.team = 'education-onboarding';
    this.tier = 'team';
  }

  async scriptVideo(topic: string, lang: 'es' | 'en'): Promise<{ scriptId: string; lang: string; draft: string; draftOnly: true }> {
    return { scriptId: `script_${topic}_${lang}`, lang, draft: `Video script (${lang}): ${topic}`, draftOnly: true };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(VideoScripterAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const warnings: string[] = ['No video recording/hosting infrastructure yet — scripts only'];
    const passed: string[] = [];
    if (ctx.campaignTemplateLanguages.includes('es') && ctx.campaignTemplateLanguages.includes('en')) {
      passed.push('Bilingual scripting available (ES/EN)');
    } else {
      warnings.push('Limited language support for video scripts');
    }
    passed.push('Video script drafting pipeline ready');
    return {
      agent: this.name, role: 'video-scripter', vote: 'conditional',
      confidence: 45, blockers: [], warnings, passed,
      summary: 'VideoScripter: Conditional — scripts ready but no video infrastructure',
    };
  }
}
