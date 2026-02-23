import type { EventBus } from './eventBus.js';
import type { LedgerStore } from './ledger/ledgerStore.js';
import type { AOSEvent } from './types.js';

/** Maps event types to the specialist team/agent that should handle repair */
const REPAIR_ROUTING: Record<string, { team: string; agent: string }> = {
  BUILD_HEALTH_DEGRADED: { team: 'backend', agent: 'SystemDesigner' },
  TEST_REGRESSION_DETECTED: { team: 'qa-testing', agent: 'RegressionBot' },
  DEPENDENCY_VULN_FOUND: { team: 'backend', agent: 'SecurityEng' },
  DOCS_STALE: { team: 'content-brand', agent: 'BackendCopyWriter' },
  PERFORMANCE_DEGRADED: { team: 'platform-eng', agent: 'InfraOps' },
  AGENT_ACCURACY_LOW: { team: 'coaches', agent: 'AgentSkillTrainer' },
  PLAYBOOK_STALE: { team: 'coaches', agent: 'PlaybookCoach' },
  WORKFLOW_BOTTLENECK: { team: 'coaches', agent: 'ProcessCoach' },
  BATTERY_BURN_ANOMALY: { team: 'finance-billing', agent: 'CostOptimizer' },
  DEPLOY_FAILED: { team: 'devops-ci', agent: 'PipelineEng' },
};

/** Actions that agents can perform autonomously (no human approval needed) */
const AUTONOMOUS_ACTIONS = new Set([
  'fix_type_errors',
  'update_docs',
  'add_test_stubs',
  'update_minor_deps',
  'fix_lint_errors',
  'regenerate_changelogs',
  'optimize_imports',
  'update_jsdoc',
  'retry_deploy',
  'restart_service',
  'cache_invalidation',
  'log_rotation',
  'draft_pr_description',
  'update_playbook_sops',
  'generate_coaching_content',
]);

/** Actions that require human approval via CTO digest */
const HUMAN_REQUIRED_ACTIONS = new Set([
  'delete_file',
  'change_env_vars',
  'modify_payment_logic',
  'change_auth_rbac',
  'upgrade_major_deps',
  'modify_governance',
  'send_outbound_message',
  'modify_kill_switch',
  'change_battery_limits',
  'modify_agent_permissions',
  'create_delete_tables',
  'financial_transaction',
  'modify_service_auth',
  'change_team_structure',
  'override_board_decision',
]);

export class SelfRepairLoop {
  private repairCount = 0;

  constructor(
    private readonly bus: EventBus,
    private readonly ledger: LedgerStore
  ) {}

  /** Subscribe to all repair-triggering events */
  wire(): void {
    for (const eventType of Object.keys(REPAIR_ROUTING)) {
      this.bus.subscribe(eventType, (event) => this.handleRepairEvent(event));
    }
  }

  private async handleRepairEvent(event: AOSEvent): Promise<void> {
    const routing = REPAIR_ROUTING[event.type];
    if (!routing) return;

    this.repairCount += 1;

    // Determine if this can be auto-repaired
    const repairAction = this.classifyRepairAction(event);
    const isAutonomous = AUTONOMOUS_ACTIONS.has(repairAction);

    if (isAutonomous) {
      // Auto-repair: specialist agent handles it
      await this.bus.publish({
        type: 'REPAIR_COMPLETED',
        source: 'SelfRepairLoop',
        severity: 'low',
        payload: {
          originalEvent: event.id,
          originalType: event.type,
          routedTo: routing.agent,
          team: routing.team,
          action: repairAction,
          autonomous: true,
        },
      });
    } else {
      // Needs human: route to CTO digest
      await this.bus.publish({
        type: 'REPAIR_NEEDS_HUMAN',
        source: 'SelfRepairLoop',
        severity: 'high',
        payload: {
          originalEvent: event.id,
          originalType: event.type,
          routedTo: routing.agent,
          team: routing.team,
          action: repairAction,
          autonomous: false,
          reason: `Action '${repairAction}' requires human approval`,
        },
      });
    }
  }

  private classifyRepairAction(event: AOSEvent): string {
    switch (event.type) {
      case 'BUILD_HEALTH_DEGRADED':
        return 'fix_type_errors';
      case 'TEST_REGRESSION_DETECTED':
        return 'add_test_stubs';
      case 'DEPENDENCY_VULN_FOUND':
        return 'upgrade_major_deps'; // Conservative: treat as human-required
      case 'DOCS_STALE':
        return 'update_docs';
      case 'PERFORMANCE_DEGRADED':
        return 'restart_service';
      case 'AGENT_ACCURACY_LOW':
        return 'generate_coaching_content';
      case 'PLAYBOOK_STALE':
        return 'update_playbook_sops';
      case 'WORKFLOW_BOTTLENECK':
        return 'generate_coaching_content';
      case 'BATTERY_BURN_ANOMALY':
        return 'change_battery_limits'; // Human required
      case 'DEPLOY_FAILED':
        return 'retry_deploy';
      default:
        return 'unknown';
    }
  }

  get totalRepairs(): number {
    return this.repairCount;
  }

  isAutonomousAction(action: string): boolean {
    return AUTONOMOUS_ACTIONS.has(action);
  }

  isHumanRequiredAction(action: string): boolean {
    return HUMAN_REQUIRED_ACTIONS.has(action);
  }
}
