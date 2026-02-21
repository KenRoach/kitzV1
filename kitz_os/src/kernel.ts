/**
 * KitzKernel — Core runtime for the AI Business Operating System.
 *
 * Responsibilities:
 *   1. Boot: register tools, check health, start server
 *   2. Run: accept goals, enforce policy, execute via tools
 *   3. Status: report system health
 *   4. Shutdown: graceful cleanup
 */

import { createServer } from './server.js';
import { OsToolRegistry } from './tools/registry.js';
import { getBatteryStatus, type BatteryStatus } from './aiBattery.js';

export interface KernelStatus {
  status: 'booting' | 'online' | 'degraded' | 'killed';
  toolCount: number;
  uptime: number;
  lastRun?: string;
  killSwitch: boolean;
  aiBattery: BatteryStatus;
}

export interface RunResult {
  runId: string;
  response: string;
  toolsUsed: string[];
  creditsConsumed: number;
}

export class KitzKernel {
  private status: KernelStatus['status'] = 'booting';
  private bootTime = Date.now();
  public tools = new OsToolRegistry();
  private server: Awaited<ReturnType<typeof createServer>> | null = null;

  async boot(): Promise<void> {
    // 1. Check kill switch
    if (process.env.KILL_SWITCH === 'true') {
      this.status = 'killed';
      console.warn('[kernel] KILL_SWITCH engaged — system halted');
      return;
    }

    // 2. Register all tools
    await this.tools.registerDefaults();
    console.log(`[kernel] ${this.tools.count()} tools registered`);

    // 3. Check AI availability
    const hasAI = !!(
      process.env.CLAUDE_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.AI_API_KEY
    );
    if (!hasAI) {
      this.status = 'degraded';
      console.warn('[kernel] No AI keys configured — running in degraded mode');
    }

    // 4. Start Fastify control plane
    this.server = await createServer(this);
    this.status = hasAI ? 'online' : 'degraded';
  }

  async run(opts: { goal: string; agent?: string; mode?: string; context?: Record<string, unknown> }): Promise<RunResult> {
    if (this.status === 'killed') {
      return { runId: '', response: 'System is killed. Disengage kill switch first.', toolsUsed: [], creditsConsumed: 0 };
    }

    const runId = crypto.randomUUID();
    // Execution is delegated to the semantic router in server.ts
    return { runId, response: '', toolsUsed: [], creditsConsumed: 0 };
  }

  getStatus(): KernelStatus {
    return {
      status: this.status,
      toolCount: this.tools.count(),
      uptime: Math.floor((Date.now() - this.bootTime) / 1000),
      killSwitch: process.env.KILL_SWITCH === 'true',
      aiBattery: getBatteryStatus(),
    };
  }

  async shutdown(): Promise<void> {
    if (this.server) {
      await this.server.close();
    }
    this.status = 'killed';
    console.log('[kernel] shutdown complete');
  }
}
