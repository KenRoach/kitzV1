import { randomUUID } from 'node:crypto';
import type { DecisionArtifact } from '../types.js';

export function createDecision(input: Omit<DecisionArtifact, 'id' | 'created_at'>): DecisionArtifact {
  return {
    ...input,
    id: randomUUID(),
    created_at: new Date().toISOString()
  };
}
