import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EventBus } from '../src/eventBus.js';
import { FileLedgerStore } from '../src/ledger/fileStore.js';
import { createTask } from '../src/artifacts/task.js';
import { NetworkingBot } from '../src/bots/networkingBot.js';

describe('AOS communication layer', () => {
  it('routes events through publish/subscribe and stores event log', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aos-ledger-'));
    const store = new FileLedgerStore(dir);
    const bus = new EventBus(store);

    let handled = false;
    bus.subscribe('BUG_REPORTED', () => {
      handled = true;
    });

    const event = await bus.publish({
      type: 'BUG_REPORTED',
      source: 'test-suite',
      severity: 'medium',
      payload: { message: 'checkout failure' }
    });

    expect(handled).toBe(true);
    expect(event.id).toBeTruthy();
    expect(store.listEvents().length).toBe(1);
  });

  it('stores structured ledger artifacts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aos-artifacts-'));
    const store = new FileLedgerStore(dir);

    const task = createTask({
      title: 'Fix onboarding confusion',
      owner_agent: 'HeadCustomer',
      status: 'open',
      related_event_ids: ['e-1']
    });

    store.appendArtifact({ kind: 'task', data: task });
    const artifacts = store.listArtifacts();

    expect(artifacts.length).toBe(1);
    expect(artifacts[0].kind).toBe('task');
    expect((artifacts[0] as { kind: 'task'; data: { owner_agent: string } }).data.owner_agent).toBe('HeadCustomer');
  });

  it('networking bot publishes ORG_DIGEST_READY from ledger', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aos-digest-'));
    const store = new FileLedgerStore(dir);
    const bus = new EventBus(store);
    const bot = new NetworkingBot('NetworkingBot', bus, store);

    store.appendArtifact({
      kind: 'task',
      data: createTask({
        title: 'Investigate auth failures',
        owner_agent: 'HeadEngineering',
        status: 'in_progress',
        related_event_ids: []
      })
    });

    await bot.publishOrgDigest();
    const digestEvent = store.listEvents().at(-1);

    expect(digestEvent?.type).toBe('ORG_DIGEST_READY');
    expect((digestEvent?.payload as { totals: { tasks: number } }).totals.tasks).toBe(1);
  });
});
