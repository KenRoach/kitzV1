import type { AgentConfig } from './types.js';

interface AdHocState {
  totalSpawned: number;
  active: number;
}

export class AgentRegistry {
  private readonly configs = new Map<string, AgentConfig>();
  private readonly adHocState = new Map<string, AdHocState>();

  register(config: AgentConfig): void {
    this.configs.set(config.name, config);
    this.adHocState.set(config.name, { totalSpawned: 0, active: 0 });
  }

  get(name: string): AgentConfig | undefined {
    return this.configs.get(name);
  }

  listCoreAgents(): AgentConfig[] {
    return [...this.configs.values()];
  }

  spawnAdHoc(owner: string): void {
    const config = this.configs.get(owner);
    const state = this.adHocState.get(owner);
    if (!config || !state) throw new Error(`Unknown owner: ${owner}`);
    if (!config.can_spawn_ad_hoc) throw new Error(`${owner} cannot spawn ad-hoc agents.`);
    if (state.totalSpawned >= config.max_ad_hoc) throw new Error(`${owner} exceeded max ad-hoc lifetime limit.`);
    if (state.active >= config.max_active_ad_hoc) throw new Error(`${owner} exceeded max active ad-hoc limit.`);
    state.totalSpawned += 1;
    state.active += 1;
  }

  completeAdHoc(owner: string): void {
    const state = this.adHocState.get(owner);
    if (!state) return;
    state.active = Math.max(0, state.active - 1);
  }
}
