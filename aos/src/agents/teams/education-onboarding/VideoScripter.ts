import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { LaunchContext, LaunchReview } from '../../../types.js';

export class VideoScripterAgent extends BaseAgent {
  constructor(bus: EventBus, memory: MemoryStore) {
    super('VideoScripter', bus, memory);
    this.team = 'education-onboarding';
    this.tier = 'team';
  }

  async scriptVideo(topic: string, lang: 'es' | 'en'): Promise<{ scriptId: string; lang: string; draft: string; draftOnly: true }> {
    return { scriptId: `script_${topic}_${lang}`, lang, draft: `Video script (${lang}): ${topic}`, draftOnly: true };
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
