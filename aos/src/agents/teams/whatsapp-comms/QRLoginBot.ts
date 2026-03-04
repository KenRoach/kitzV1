import { BaseAgent } from '../../baseAgent.js'
import type { EventBus } from '../../../eventBus.js'
import type { MemoryStore } from '../../../memory/memoryStore.js'
import type { AgentMessage, LaunchContext, LaunchReview } from '../../../types.js'

export class QRLoginBotAgent extends BaseAgent {
  private static readonly SYSTEM_PROMPT = `You are the QR Login Bot at KITZ — an AI Business Operating System for LatAm SMBs.

ROLE: QR Login Bot — manage WhatsApp session lifecycle (connect, reconnect, health check).
RESPONSIBILITIES:
- Guide users through WhatsApp QR code scanning and session setup.
- Monitor session health and trigger reconnection when sessions drop.
- Report session status metrics to the comms team.
STYLE: Helpful, step-by-step, Spanish-first. Patience with non-technical users.

FRAMEWORK:
1. Check current WhatsApp session status for the user/org.
2. If disconnected, initiate QR code generation flow.
3. Guide the user through scanning (clear, numbered steps).
4. Confirm connection and verify message send/receive capability.
5. Report session health to HeadCustomer.

ESCALATION: Escalate to HeadCustomer when sessions fail repeatedly or Baileys connector errors persist.
Use dashboard_metrics to accomplish your tasks.`

  constructor(bus: EventBus, memory: MemoryStore) {
    super('QRLoginBot', bus, memory)
    this.team = 'whatsapp-comms'
    this.tier = 'team'
  }

  override async handleMessage(msg: AgentMessage): Promise<void> {
    const payload = msg.payload as Record<string, unknown>
    const traceId = (payload.traceId as string) ?? crypto.randomUUID()
    const userMessage = (payload.message as string) || JSON.stringify(payload)

    const result = await this.reasonWithTools(QRLoginBotAgent.SYSTEM_PROMPT, userMessage, {
      tier: 'haiku', traceId, maxIterations: 3,
    })

    await this.publish('SWARM_TASK_COMPLETE', {
      agent: this.name, team: this.team, traceId,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => tc.toolName),
      iterations: result.iterations,
    })
  }

  override reviewLaunchReadiness(_ctx: LaunchContext): LaunchReview {
    return {
      agent: this.name, role: 'qr-login', vote: 'go',
      confidence: 70, blockers: [], warnings: [],
      passed: ['QR login session management ready'],
      summary: 'QRLoginBot: Ready',
    }
  }
}
