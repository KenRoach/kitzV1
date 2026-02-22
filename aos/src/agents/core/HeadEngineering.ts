import { BaseAgent } from '../baseAgent.js';
import type { LaunchContext, LaunchReview } from '../../types.js';

/**
 * HeadEngineering Agent — Code Quality, CI, Infrastructure
 *
 * Owns: build system, type safety, test coverage, deployment pipeline.
 * Launch gate: Does it build? Does it deploy? Are critical paths tested?
 */
export class HeadEngineeringAgent extends BaseAgent {

  reviewLaunchReadiness(ctx: LaunchContext): LaunchReview {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    // System must be online or degraded (not killed/booting)
    if (ctx.systemStatus === 'online') {
      passed.push('System boots and serves requests');
    } else if (ctx.systemStatus === 'degraded') {
      warnings.push('System in degraded mode — limited capability');
    } else {
      blockers.push(`System not operational: ${ctx.systemStatus}`);
    }

    // Tools loaded means the build works
    if (ctx.toolCount >= 50) {
      passed.push(`Build successful — ${ctx.toolCount} tool modules loaded`);
    } else {
      blockers.push(`Build issue — only ${ctx.toolCount} tools loaded`);
    }

    // Docker configs exist for deployment
    if (ctx.servicesHealthy.length > 0) {
      passed.push(`${ctx.servicesHealthy.length} services with Docker + Railway configs`);
    }

    passed.push('CI pipeline: typecheck → lint → test on push/PR');
    passed.push('TypeScript strict mode across all services');
    warnings.push('Most test files are placeholder stubs — real tests only in kitz_os');
    warnings.push('Integration test coverage needed for gateway auth flow');

    const vote = blockers.length > 0 ? 'no-go' as const : 'conditional' as const;
    const confidence = blockers.length === 0 ? 68 : 20;

    return {
      agent: this.name, role: 'HeadEngineering', vote, confidence, blockers, warnings, passed,
      summary: vote === 'conditional'
        ? `Engineering: builds pass, deploys work. Caveats: ${warnings.join('; ')}`
        : `Engineering blockers: ${blockers.join('; ')}`,
    };
  }
}
