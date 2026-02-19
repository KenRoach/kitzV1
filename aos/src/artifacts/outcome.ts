import { randomUUID } from 'node:crypto';
import type { OutcomeArtifact } from '../types.js';

export function createOutcome(input: Omit<OutcomeArtifact, 'id' | 'created_at'>): OutcomeArtifact {
  return {
    ...input,
    id: randomUUID(),
    created_at: new Date().toISOString()
  };
}
