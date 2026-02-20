import { randomUUID } from 'node:crypto';
import type { ProposalArtifact } from '../types.js';

export function createProposal(input: Omit<ProposalArtifact, 'id' | 'created_at'>): ProposalArtifact {
  return {
    ...input,
    id: randomUUID(),
    created_at: new Date().toISOString()
  };
}
