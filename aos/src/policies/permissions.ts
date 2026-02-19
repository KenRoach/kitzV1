import type { AOSEvent } from '../types.js';

export function enforcePermissions(event: AOSEvent): void {
  if (String(event.payload.action ?? '') === 'deploy_execute') {
    throw new Error('Agents are advisory + PR-based only. Deploy execution is forbidden.');
  }
}
