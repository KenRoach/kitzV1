/**
 * Policy Enforcer — Unified policy checks for KITZ OS.
 *
 * Combines:
 *   - Kill switch checking
 *   - Risk assessment per action
 *   - Approval gate requirements
 *   - Agent capability caps
 *   - Email write enforcement (admin_assistant only)
 */

// Agent capability limits
const AGENT_CAPS: Record<string, { maxToolCallsPerRun: number; maxLoopsPerRun: number; maxCreditsPerDay: number }> = {
  ceo:              { maxToolCallsPerRun: 20, maxLoopsPerRun: 8, maxCreditsPerDay: 5 },
  sales:            { maxToolCallsPerRun: 15, maxLoopsPerRun: 5, maxCreditsPerDay: 3 },
  ops:              { maxToolCallsPerRun: 15, maxLoopsPerRun: 5, maxCreditsPerDay: 3 },
  cfo:              { maxToolCallsPerRun: 10, maxLoopsPerRun: 5, maxCreditsPerDay: 3 },
  support:          { maxToolCallsPerRun: 10, maxLoopsPerRun: 5, maxCreditsPerDay: 3 },
  marketing:        { maxToolCallsPerRun: 10, maxLoopsPerRun: 5, maxCreditsPerDay: 3 },
  admin_assistant:  { maxToolCallsPerRun: 20, maxLoopsPerRun: 5, maxCreditsPerDay: 3 },
  fact_checker:     { maxToolCallsPerRun: 10, maxLoopsPerRun: 3, maxCreditsPerDay: 2 },
};

// Risk levels by action pattern
const ACTION_RISK_MAP: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  'list': 'low',
  'get': 'low',
  'search': 'low',
  'summary': 'low',
  'dashboard': 'low',
  'create': 'medium',
  'update': 'medium',
  'braindump': 'medium',
  'scan': 'medium',
  'send': 'high',
  'compose': 'high',
  'markPaid': 'high',
  'delete': 'critical',
  'security': 'critical',
};

export class PolicyEnforcer {
  checkKillSwitch(): boolean {
    return process.env.KILL_SWITCH === 'true';
  }

  assessRisk(toolName: string): 'low' | 'medium' | 'high' | 'critical' {
    for (const [pattern, risk] of Object.entries(ACTION_RISK_MAP)) {
      if (toolName.toLowerCase().includes(pattern.toLowerCase())) {
        return risk;
      }
    }
    return 'medium'; // Default to medium for unknown tools
  }

  requiresApproval(toolName: string): boolean {
    const risk = this.assessRisk(toolName);
    return risk === 'high' || risk === 'critical';
  }

  canWriteEmail(agentType: string): boolean {
    return agentType === 'admin_assistant';
  }

  getAgentCaps(agentType: string) {
    return AGENT_CAPS[agentType] || AGENT_CAPS['support']; // Default to support caps
  }

  validateGoal(goal: string): { safe: boolean; flags: string[] } {
    const flags: string[] = [];

    // Basic injection detection patterns
    const injectionPatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /you\s+are\s+now\s+/i,
      /system\s*prompt/i,
      /\bsudo\b/i,
      /\brm\s+-rf\b/i,
      /DROP\s+TABLE/i,
      /eval\s*\(/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(goal)) {
        flags.push(`Suspicious pattern: ${pattern.source}`);
      }
    }

    return { safe: flags.length === 0, flags };
  }
}
