import { BaseAgent } from '../baseAgent.js';
import { canSpawnAdHoc, createAdHocProposal } from '../../policies/adHocRules.js';
import type { AgentRegistry } from '../../registry.js';

export class ParallelSolutionsAgent extends BaseAgent {
  propose(owner: string, registry: AgentRegistry, severity: 'low' | 'medium' | 'high' | 'critical', issueId: string): Record<string, unknown> {
    if (!canSpawnAdHoc({ severity })) throw new Error('Ad-hoc spawn not permitted for low-severity issue.');
    registry.spawnAdHoc(owner);
    const proposal = createAdHocProposal('parallel-solution', owner, 24);
    this.logProposal(issueId, proposal);
    return proposal;
  }
}
