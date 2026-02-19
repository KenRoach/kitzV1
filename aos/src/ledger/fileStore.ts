import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { AOSEvent, LedgerArtifact } from '../types.js';
import type { LedgerStore } from './ledgerStore.js';

export class FileLedgerStore implements LedgerStore {
  constructor(private readonly dataDir = resolve(process.cwd(), 'data')) {}

  private ensure(file: 'events.ndjson' | 'ledger.ndjson'): string {
    const fullPath = resolve(this.dataDir, file);
    if (!existsSync(dirname(fullPath))) mkdirSync(dirname(fullPath), { recursive: true });
    if (!existsSync(fullPath)) appendFileSync(fullPath, '', 'utf-8');
    return fullPath;
  }

  appendEvent(event: AOSEvent): void {
    appendFileSync(this.ensure('events.ndjson'), `${JSON.stringify(event)}\n`, 'utf-8');
  }

  appendArtifact(entry: LedgerArtifact): void {
    appendFileSync(this.ensure('ledger.ndjson'), `${JSON.stringify(entry)}\n`, 'utf-8');
  }

  listEvents(): AOSEvent[] {
    const file = this.ensure('events.ndjson');
    const lines = readFileSync(file, 'utf-8').trim();
    if (!lines) return [];
    return lines.split('\n').map((line) => JSON.parse(line) as AOSEvent);
  }

  listArtifacts(): LedgerArtifact[] {
    const file = this.ensure('ledger.ndjson');
    const lines = readFileSync(file, 'utf-8').trim();
    if (!lines) return [];
    return lines.split('\n').map((line) => JSON.parse(line) as LedgerArtifact);
  }
}
