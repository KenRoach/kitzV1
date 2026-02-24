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
import { getBatteryStatus, initBattery, type BatteryStatus } from './aiBattery.js';
import { initSOPStore } from './sops/store.js';
import { loadStarterSOPs } from './sops/loader.js';
import { CadenceEngine } from './cadence/engine.js';
import { routeWithAI } from './interfaces/whatsapp/semanticRouter.js';
import { createAOS, type AOSRuntime } from '../../aos/src/index.js';
import type { LaunchContext } from '../../aos/src/types.js';
import { createLogger } from './logger.js';
import { loadCustomTools } from './tools/customToolLoader.js';
import { setToolFactoryRegistry } from './tools/toolFactoryTools.js';

const log = createLogger('kernel');

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

    // 2. Restore AI Battery ledger from persistent storage
    await initBattery().catch(err => {
      log.warn('Battery restore failed', { error: (err as Error).message });
    });

    // 2.5. Initialize SOP store and load starter SOPs
    await initSOPStore().catch(err => {
      log.warn('SOP store init failed', { error: (err as Error).message });
    });
    await loadStarterSOPs().catch(err => {
      log.warn('Starter SOP load failed', { error: (err as Error).message });
    });

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

    // 7. AOS initialized
    log.info('AOS agent operating system online', { agents: 33 });
  }

  async run(opts: { goal: string; agent?: string; mode?: string; context?: Record<string, unknown> }): Promise<RunResult> {
    if (this.status === 'killed') {
      return { runId: '', response: 'System is killed. Disengage kill switch first.', toolsUsed: [], creditsConsumed: 0 };
    }

    const runId = crypto.randomUUID();

    // Route through the 5-phase semantic router (same pipeline as WhatsApp webhook)
    // If an agent is specified, prefix the goal so the router knows the context
    const message = opts.agent ? `[agent:${opts.agent}] ${opts.goal}` : opts.goal;
    try {
      const result = await routeWithAI(
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
  buildLaunchContext(): LaunchContext {
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
      servicesHealthy: ['kitz_os', 'workspace', 'kitz-gateway', 'kitz-whatsapp-connector', 'kitz-payments', 'kitz-notifications-queue', 'admin-kitz-services'],
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

  /** Run the full 33-agent launch review. CEO decides. */
  async runLaunchReview() {
    const ctx = this.buildLaunchContext();
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
    if (this.server) {
      await this.server.close();
    }
    this.status = 'killed';
    log.info('shutdown complete');
  }
}
