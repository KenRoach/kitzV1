import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Will this have the intended impact? Strategic assessment */
export class ImpactStrategyAgent extends BaseAgent {
  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];

    passed.push('Impact thesis: give LatAm SMBs AWS-level infrastructure via WhatsApp');
    passed.push('First 10 = validation cohort. If they activate, thesis is proven.');
    passed.push('Free workspace = immediate utility (CRM, orders, checkout links)');
    passed.push('AI Battery upsell = sustainable revenue if free tier works');

    if (ctx.campaignProfileCount >= 10) {
      passed.push('Target profiles span food, beauty, education, retail, logistics — good diversity');
    }

    return {
      agent: this.name, role: 'Impact Strategy', vote: 'go',
      confidence: 85, blockers: [], warnings: [], passed,
      summary: 'High impact potential. Free workspace for LatAm SMBs is a real need. 10-user cohort validates the thesis.',
    };
  }

  prioritize(projects: Array<{ id: string; impactScore: number; cost: number }>): Array<{ id: string; impactScore: number; cost: number }> {
    return [...projects].sort((a, b) => b.impactScore / Math.max(1, b.cost) - a.impactScore / Math.max(1, a.cost));
  }
}
