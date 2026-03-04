import { BaseAgent } from '../baseAgent.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../types.js';

/**
 * HeadEducation Agent — Onboarding Content & User Education
 *
 * Owns: onboarding templates, walkthrough content, 2-min setup validation.
 * Launch gate: Can a new user understand what to do in < 2 minutes?
 */
export class HeadEducationAgent extends BaseAgent {

  private static readonly SYSTEM_PROMPT = `You are the Head of Education at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: Head of Education — onboarding, tutorials, documentation, user enablement.
RESPONSIBILITIES: Design onboarding flows, create tutorials, manage help content, ensure <10 min activation, multilingual education.
STYLE: Patient, clear, encouraging. Make complex things simple. Spanish-first, always.

EDUCATION FRAMEWORK:
1. Assess where the user is: Starter (idea only) or Hustler (already selling)?
2. Design the shortest path to their breakthrough moment (seeing their own data in the system)
3. Create step-by-step content: tutorials, video scripts, FAQs, course outlines
4. Validate: can they self-onboard without human help?
5. Iterate: measure completion rates, identify drop-off points

ESCALATION: Flag onboarding completion issues to HeadGrowth. Content quality issues to CMO.

Education/onboarding team reports to you. Use content and knowledge tools to create materials.
The goal is always: user succeeds on their own in under 10 minutes.`;

  async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);

    const result = await this.reasonWithTools(HeadEducationAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'sonnet',
      traceId,
      maxIterations: 5,
    });

    await this.publish('HEAD_EDUCATION_RESPONSE', {
      traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    if (ctx.campaignTemplateLanguages.length >= 2) {
      passed.push(`Onboarding templates in ${ctx.campaignTemplateLanguages.join(' + ')}`);
    } else {
      warnings.push('Onboarding only in 1 language — LatAm users need ES');
    }

    if (ctx.activationTargetMinutes <= 10) {
      passed.push(`Setup flow targets < ${ctx.activationTargetMinutes} min activation`);
    } else {
      warnings.push(`Setup takes ${ctx.activationTargetMinutes} min — too slow for first impression`);
    }

    passed.push('3-touch campaign includes walkthrough (Touch 2)');
    passed.push('Help command surfaces all capabilities');
    passed.push('Workspace has visual CRM, orders, tasks tabs');
    warnings.push('No video walkthroughs yet — text-only onboarding');

    const vote = blockers.length > 0 ? 'no-go' as const : warnings.length > 0 ? 'conditional' as const : 'go' as const;
    const confidence = blockers.length === 0 ? (warnings.length === 0 ? 80 : 68) : 25;

    return {
      agent: this.name, role: 'HeadEducation', vote, confidence, blockers, warnings, passed,
      summary: vote === 'go'
        ? 'Education ready. Templates, walkthrough, help system — users can self-onboard.'
        : `Education mostly ready: ${warnings.join('; ')}`,
    };
  }
}
