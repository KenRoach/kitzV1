import { mkdirSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { AOSEvent, ProposalRecord } from '../types.js';

export class MemoryStore {
  constructor(private readonly baseDir = resolve(process.cwd(), 'aos/data')) {}

  private pathFor(file: 'events.ndjson' | 'decisions.ndjson' | 'proposals.ndjson'): string {
    const path = resolve(this.baseDir, file);
    if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
    return path;
  }

  writeEvent(event: AOSEvent): void {
    appendFileSync(this.pathFor('events.ndjson'), `${JSON.stringify(event)}\n`, 'utf-8');
  }

  logDecision(context: string, options: string[], chosen: string, result: string): void {
    const row = { timestamp: new Date().toISOString(), context, options, chosen, result };
    appendFileSync(this.pathFor('decisions.ndjson'), `${JSON.stringify(row)}\n`, 'utf-8');
  }

  logProposal(record: ProposalRecord): void {
    appendFileSync(this.pathFor('proposals.ndjson'), `${JSON.stringify(record)}\n`, 'utf-8');
  }

  retrieveSimilarDecisions(query: string): Array<Record<string, unknown>> {
    const file = this.pathFor('decisions.ndjson');
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  }
}
