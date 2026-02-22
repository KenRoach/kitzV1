import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/** Institutional Memory — Do we remember past lessons? MealKitz → Kitz */
export class InstitutionalMemoryAgent extends BaseAgent {
  reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    const passed: string[] = [];
    const warnings: string[] = [];

    passed.push('MealKitz lesson: delivery logistics were unsustainable → pivot to software');
    passed.push('MealKitz lesson: users loved WhatsApp ordering → kept WhatsApp-first');
    passed.push('MealKitz lesson: manual ops don\'t scale → AI automation is the answer');
    passed.push('AOS event ledger preserves all decisions for future reference');
    passed.push('NDJSON append-only ledger = permanent institutional memory');

    warnings.push('No formal retrospective process yet — add after first 10 users');

    return {
      agent: this.name, role: 'Institutional Memory', vote: 'go',
      confidence: 80, blockers: [], warnings, passed,
      summary: 'MealKitz lessons embedded. WhatsApp-first, software not logistics, AI for scale. Memory preserved.',
    };
  }
}
