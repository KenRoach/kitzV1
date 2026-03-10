/**
 * KitzKernel — Core runtime for the AI Business Operating System.
 *
 * Responsibilities:
 *   1. Boot: register tools, check health, start AOS, start server
 *   2. Run: accept goals, enforce policy, execute via tools
 *   3. Launch: orchestrate 33-agent launch review, CEO decides
 *   4. Status: report system health
 *   5. Shutdown: graceful cleanup
 */

import { createServer } from './server.js';
import { OsToolRegistry } from './tools/registry.js';
import { getBatteryStatus, initBattery, hasBudget, type BatteryStatus } from './aiBattery.js';
import { initSOPStore } from './sops/store.js';
import { loadStarterSOPs } from './sops/loader.js';
import { CadenceEngine } from './cadence/engine.js';
import { routeWithAI, brainFirstRoute } from './interfaces/whatsapp/semanticRouter.js';
import { createAOS, type AOSRuntime, createAllAgents, createCoreAgents, registerAgent, dispatchToAgent } from '../../aos/src/index.js';
import type { LaunchContext, AOSEvent, AgentMessage } from '../../aos/src/types.js';
import { createSubsystemLogger } from 'kitz-schemas';
import { loadCustomTools } from './tools/customToolLoader.js';
import { setToolFactoryRegistry } from './tools/toolFactoryTools.js';
import { loadContacts } from './contacts/registry.js';
import { startNotificationEngine, stopNotificationEngine } from './notifications/engine.js';

const log = createSubsystemLogger('kernel');

/** Database connection pool configuration */
export const DB_POOL_CONFIG = {
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
} as const;

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
  private cadence: CadenceEngine | null = null;
  public aos: AOSRuntime;
  private eventLoopTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // AOS created without tool bridge — will be wired after tools register
    this.aos = createAOS();
  }

  async boot(): Promise<void> {
    // 1. Check kill switch
    if (process.env.KILL_SWITCH === 'true') {
      this.status = 'killed';
      log.warn('KILL_SWITCH engaged — system halted');
      return;
    }

    // 2. Restore AI Battery ledger from persistent storage (if enabled)
    if (process.env.AI_BATTERY_ENABLED === 'true') {
      await initBattery().catch(err => {
        log.warn('Battery restore failed', { error: (err as Error).message });
      });
    }

    // 2.5. Initialize SOP store and load starter SOPs
    await initSOPStore().catch(err => {
      log.warn('SOP store init failed', { error: (err as Error).message });
    });
    await loadStarterSOPs().catch(err => {
      log.warn('Starter SOP load failed', { error: (err as Error).message });
    });

    // 2.7. Load contact registry (Supabase primary, file fallback)
    await loadContacts();

    // 3. Register all tools
    await this.tools.registerDefaults();
    const builtInCount = this.tools.count();

    // 3.1. Load custom tools from disk
    const customCount = await loadCustomTools(this.tools).catch(err => {
      log.warn('Custom tool load failed', { error: (err as Error).message });
      return 0;
    });

    // 3.2. Wire registry into tool factory for runtime tool creation
    setToolFactoryRegistry(this.tools);

    log.info(`${this.tools.count()} tools registered`, {
      builtIn: builtInCount,
      custom: customCount,
      total: this.tools.count(),
    });

    // 3.5. Re-create AOS with tool bridge now that registry is populated
    this.aos = createAOS(undefined, this.tools);
    log.info('AOS tool bridge wired (agents can invoke tools)');

    // 3.6. Register all agents for real-time dispatch
    const teamAgents = createAllAgents(this.aos.bus, this.aos.memory, this.aos.toolBridge);
    const coreAgents = createCoreAgents(this.aos.bus, this.aos.memory, this.aos.toolBridge);
    let agentCount = 0;
    for (const agent of teamAgents.values()) { registerAgent(agent); agentCount++; }
    for (const agent of coreAgents.values()) { registerAgent(agent); agentCount++; }
    log.info(`${agentCount} agents registered for real-time dispatch`);

    // 3.7. Subscribe agents to event bus for autonomous wake-up
    const allAgents = [...teamAgents.values(), ...coreAgents.values()];

    // Route AGENT_MESSAGE events to their target agents
    this.aos.bus.subscribe('AGENT_MESSAGE', async (event: AOSEvent) => {
      const msg = event as unknown as AgentMessage;
      const targets = Array.isArray(msg.target) ? msg.target : [msg.target];
      for (const targetName of targets) {
        const agent = allAgents.find(a => a.name === targetName);
        if (agent) {
          try { await agent.handleMessage(msg); } catch (err) {
            log.error(`Agent ${agent.name} failed`, { error: (err as Error).message });
          }
        }
      }
    });

    // Route SWARM_TASK events to target agents
    this.aos.bus.subscribe('SWARM_TASK', async (event: AOSEvent) => {
      const msg = event as unknown as AgentMessage;
      const targets = Array.isArray(msg.target) ? msg.target : [msg.target];
      for (const targetName of targets) {
        const agent = allAgents.find(a => a.name === targetName);
        if (agent) {
          try { await agent.handleSwarmTask(msg); } catch (err) {
            log.error(`Swarm task failed for ${agent.name}`, { error: (err as Error).message });
          }
        }
      }
    });

    log.info(`Event bus subscriptions active — ${allAgents.length} agents listening`);

    // 4. Check AI availability
    const hasAI = !!(
      process.env.CLAUDE_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.AI_API_KEY
    );
    if (!hasAI) {
      this.status = 'degraded';
      log.warn('No AI keys configured — running in degraded mode');
    }

    // 5. Start Fastify control plane
    this.server = await createServer(this);
    this.status = hasAI ? 'online' : 'degraded';

    // 6. Start cadence engine (cron-based reports)
    this.cadence = new CadenceEngine(this);
    this.cadence.start();

    // 6.5. Start notification engine (proactive updates, trial reminders)
    startNotificationEngine();

    // 7. AOS initialized
    log.info('AOS agent operating system online', { agents: agentCount });

    // 8. Verify C-Suite agents are registered and online
    const CSUITE_AGENTS = [
      'CEO', 'CFO', 'CMO', 'CTO', 'CPO', 'COO', 'CRO',
      'HeadCustomer', 'HeadEngineering', 'HeadGrowth',
      'HeadIntelligenceRisk', 'HeadEducation',
    ];
    const registeredCsuite = CSUITE_AGENTS.filter(name => allAgents.some(a => a.name === name));
    const missingCsuite = CSUITE_AGENTS.filter(name => !allAgents.some(a => a.name === name));
    log.info(`C-Suite roster: ${registeredCsuite.length}/${CSUITE_AGENTS.length} verified`, {
      registered: registeredCsuite,
      ...(missingCsuite.length > 0 ? { missing: missingCsuite } : {}),
    });
  }

  async run(opts: { goal: string; agent?: string; mode?: string; context?: Record<string, unknown> }): Promise<RunResult> {
    if (this.status === 'killed') {
      return { runId: '', response: 'System is killed. Disengage kill switch first.', toolsUsed: [], creditsConsumed: 0 };
    }

    // Enforce daily AI Battery limit (skip for god-mode admin)
    const isGodMode = opts.context?.userId === process.env.GOD_MODE_USER_ID;
    if (!isGodMode && !hasBudget(1)) {
      const battery = getBatteryStatus();
      log.warn('battery_depleted_kernel_run', { todayCredits: battery.todayCredits, dailyLimit: battery.dailyLimit });
      return {
        runId: crypto.randomUUID(),
        response: `Daily AI limit reached (${battery.todayCredits}/${battery.dailyLimit} today). Recharge or wait until tomorrow.`,
        toolsUsed: [],
        creditsConsumed: 0,
      };
    }

    const runId = crypto.randomUUID();

    // Route through brain-first pipeline (classifies, then dispatches to agents or routeWithAI)
    // If an agent is specified, prefix the goal so the router knows the context
    const message = opts.agent ? `[agent:${opts.agent}] ${opts.goal}` : opts.goal;
    try {
      const result = await brainFirstRoute(
        message,
        this.tools,
        runId,        // use runId as traceId
        undefined,    // no media context for programmatic runs
        undefined,    // no userId for programmatic runs
      );
      return {
        runId,
        response: result.response,
        toolsUsed: result.toolsUsed,
        creditsConsumed: result.creditsConsumed,
      };
    } catch (err) {
      log.error('Run failed', { runId, error: (err as Error).message });
      return { runId, response: `Error: ${(err as Error).message}`, toolsUsed: [], creditsConsumed: 0 };
    }
  }

  /** Build launch context from current system state */
  async buildLaunchContext(): Promise<LaunchContext> {
    const battery = getBatteryStatus();
    const hasAI = !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY);

    return {
      killSwitch: process.env.KILL_SWITCH === 'true',
      toolCount: this.tools.count(),
      systemStatus: this.status,
      aiKeysConfigured: hasAI,
      batteryRemaining: battery.remaining,
      batteryDailyLimit: battery.dailyLimit,
      batteryDepleted: battery.depleted,
      servicesHealthy: await this.probeServiceHealth(),
      servicesDown: [],
      campaignProfileCount: 10,
      campaignTemplateLanguages: ['es', 'en'],
      draftFirstEnforced: true,
      webhookCryptoEnabled: !!(process.env.STRIPE_WEBHOOK_SECRET || process.env.YAPPY_WEBHOOK_SECRET),
      rateLimitingEnabled: true,
      jwtAuthEnabled: !!process.env.DEV_TOKEN_SECRET,
      semanticRouterActive: hasAI,
      whatsappConnectorConfigured: !!process.env.WA_CONNECTOR_URL,
      workspaceMcpConfigured: !!process.env.WORKSPACE_MCP_URL,
      cadenceEngineEnabled: process.env.CADENCE_ENABLED !== 'false',
      funnelStagesDefined: 10,
      activationTargetMinutes: 10,
      pricingTiersDefined: 3,
      freeToPathDefined: true,
    };
  }

  /** Probe downstream services for real health status */
  private async probeServiceHealth(): Promise<string[]> {
    const services: Array<{ name: string; url: string }> = [
      { name: 'kitz_os', url: `http://localhost:${process.env.PORT || 3012}/health` },
      { name: 'workspace', url: `${process.env.WORKSPACE_API_URL || 'http://localhost:3001'}/health` },
      { name: 'kitz-whatsapp-connector', url: `${process.env.WA_CONNECTOR_URL || 'http://localhost:3006'}/health` },
    ];
    const healthy: string[] = [];
    await Promise.all(services.map(async (svc) => {
      try {
        const res = await fetch(svc.url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) healthy.push(svc.name);
      } catch { /* service down */ }
    }));
    return healthy;
  }

  /** Run the full 33-agent launch review. CEO decides. */
  async runLaunchReview() {
    const ctx = await this.buildLaunchContext();
    return this.aos.runLaunchReview(ctx);
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
    if (this.cadence) this.cadence.stop();
    if (this.eventLoopTimer) clearInterval(this.eventLoopTimer);
    stopNotificationEngine();
    if (this.server) {
      await this.server.close();
    }
    this.status = 'killed';
    log.info('shutdown complete');
  }
}

// Re-export dispatchToAgent so semanticRouter and other modules can dispatch tasks to AOS agents
export { dispatchToAgent };
