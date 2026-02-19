import type { AOSEvent, LedgerArtifact } from '../types.js';
import type { LedgerStore } from './ledgerStore.js';

export class DbLedgerStore implements LedgerStore {
  appendEvent(_event: AOSEvent): void {
    throw new Error('DB store is not configured in this repository. Use FileLedgerStore.');
  }
  appendArtifact(_entry: LedgerArtifact): void {
    throw new Error('DB store is not configured in this repository. Use FileLedgerStore.');
  }
  listEvents(): AOSEvent[] {
    return [];
  }
  listArtifacts(): LedgerArtifact[] {
    return [];
  }
}
