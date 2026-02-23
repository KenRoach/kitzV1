/**
 * OS Tool Registry — Central registry for all KITZ OS tools.
 */

export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  execute: (args: Record<string, unknown>, traceId?: string) => Promise<unknown>;
}

export class OsToolRegistry {
  private tools = new Map<string, ToolSchema>();

  register(tool: ToolSchema): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolSchema | undefined {
    return this.tools.get(name);
  }

  list(): ToolSchema[] {
    return Array.from(this.tools.values());
  }

  count(): number {
    return this.tools.size;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async invoke(name: string, args: Record<string, unknown>, traceId?: string): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) return { error: `Tool "${name}" not found` };
    try {
      return await tool.execute(args, traceId);
    } catch (err) {
      return { error: `Tool "${name}" failed: ${(err as Error).message}` };
    }
  }

  toOpenAITools(): Array<{ type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
    return this.list().map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  async registerDefaults(): Promise<void> {
    const modules = await Promise.allSettled([
      import('./crmTools.js'),
      import('./storefrontTools.js'),
      import('./dashboardTools.js'),
      import('./emailTools.js'),
      import('./braindumpTools.js'),
      import('./docScanTools.js'),
      import('./factCheckTools.js'),
      import('./agentTools.js'),
      import('./outboundTools.js'),
      import('./calendarTools.js'),
      import('./artifactTools.js'),
      import('./lovableTools.js'),
      import('./paymentTools.js'),
      import('./voiceTools.js'),
      import('./mediaUnderstandingTools.js'),
      import('./memoryTools.js'),
      import('./webTools.js'),
      import('./sopTools.js'),
    ]);

    const getterNames = [
      'getAllCrmTools',
      'getAllStorefrontTools',
      'getAllDashboardTools',
      'getAllEmailTools',
      'getAllBraindumpTools',
      'getAllDocScanTools',
      'getAllFactCheckTools',
      'getAllAgentTools',
      'getAllOutboundTools',
      'getAllCalendarTools',
      'getAllArtifactTools',
      'getAllLovableTools',
      'getAllPaymentTools',
      'getAllVoiceTools',
      'getAllMediaUnderstandingTools',
      'getAllMemoryTools',
      'getAllWebTools',
      'getAllSOPTools',
    ];

    for (let i = 0; i < modules.length; i++) {
      const result = modules[i];
      if (result.status === 'fulfilled') {
        const getAll = (result.value as Record<string, () => ToolSchema[]>)[getterNames[i]];
        if (typeof getAll === 'function') {
          for (const tool of getAll()) {
            this.register(tool);
          }
        }
      } else {
        console.warn(`[registry] Failed to load ${getterNames[i]}: ${result.reason}`);
      }
    }
  }
}
