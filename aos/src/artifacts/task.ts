import { randomUUID } from 'node:crypto';
import type { TaskArtifact } from '../types.js';

export function createTask(input: Omit<TaskArtifact, 'id' | 'created_at'>): TaskArtifact {
  return {
    ...input,
    id: randomUUID(),
    created_at: new Date().toISOString()
  };
}
