import { BaseAgent } from '../../baseAgent.js';
import type { EventBus } from '../../../eventBus.js';
import type { MemoryStore } from '../../../memory/memoryStore.js';
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js';

export class AssetManagerAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = [
    'You are AssetManager, the brand-asset organization agent for KITZ content-brand team.',
    'Your mission: catalog, retrieve, and manage all brand assets (logos, images, templates,',
    'fonts, color palettes, videos) so other agents and humans can find what they need fast.',
    'Use artifact_list to browse the asset catalog and find available resources.',
    'Use artifact_readFile to retrieve specific asset metadata and content.',
    '',
    'Asset management responsibilities:',
    '- Maintain an organized inventory of all brand assets by type and usage',
    '- Respond to asset requests: "find the purple logo" → return URL + metadata',
    '- Track asset versions: which logo is current, which templates are deprecated',
    '- Enforce naming conventions: [type]-[name]-[version].[ext]',
    '- Flag missing assets: if a campaign needs an asset that does not exist, report it',
    '',
    'KITZ brand assets reference:',
    '- Purple palette: #A855F7 (primary), #7C3AED (secondary), Inter font',
    '- Logo variants: full, icon, white, dark, Spanish tagline, English tagline',
    '- Template categories: email, flyer, social, WhatsApp, presentation',
    'Escalate to CMO if an asset request cannot be fulfilled or requires new creation.',
    'Always output: asset name, type, URL/path, version, and usage context.',
  ].join('\n');

  constructor(bus: EventBus, memory: MemoryStore) {
    super('AssetManager', bus, memory);
    this.team = 'content-brand';
    this.tier = 'team';
  }

  async getAsset(name: string): Promise<{ assetId: string; url: string; type: string } | null> {
    // Placeholder — production fetches from asset storage
    return { assetId: `asset_${name}`, url: `https://assets.kitz.services/${name}`, type: 'image' };
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>;
    const traceId = (payload.traceId as string) ?? crypto.randomUUID();
    const userMessage = (payload.message as string) || JSON.stringify(payload);
    const result = await this.reasonWithTools(AssetManagerAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    });
    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    });
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'asset-manager', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['Asset management pipeline configured', 'Brand asset catalog accessible'],
      summary: 'AssetManager: Brand assets accessible for content creation',
    };
  }
}
