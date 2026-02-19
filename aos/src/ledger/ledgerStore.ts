import type { AOSEvent, LedgerArtifact } from '../types.js';

export interface LedgerStore {
  appendEvent(event: AOSEvent): void;
  appendArtifact(entry: LedgerArtifact): void;
  listEvents(): AOSEvent[];
  listArtifacts(): LedgerArtifact[];
}
